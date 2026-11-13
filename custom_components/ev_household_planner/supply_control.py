"""The shared supply in Home Assistant: the meter, the house forecast, the joint plan and the current.

Off until a limit is set in the options. Then the cars that are plugged in
are planned together under the limit (``supply.plan_supply``), each car's
plan becomes its share, and a car or charger with a current setting is told
how many amps to take in each slot. A charger that can only be switched on
and off takes its turn instead.

EV Planner plans under the limit; it does not protect the fuse. A charger's
own load balancing (an Easee Equalizer, say) does that, and when it turns a
car down, the car's measured speed falls and the next plan follows.
"""

from __future__ import annotations

import asyncio
from collections.abc import Mapping
from dataclasses import replace
from datetime import datetime, timedelta
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util

from .const import (
    COMMAND_TIMEOUT,
    CONF_CURRENT_ENTITY,
    CONF_HEAT_PUMP_BLOCK,
    CONF_HEAT_PUMP_POWER,
    CONF_SUPPLY_GUARD,
    CONF_SUPPLY_LIMIT,
    CONF_SUPPLY_METER,
    CONF_SUPPLY_PHASES,
    CONF_SUPPLY_RESERVE,
    CONF_SUPPLY_SHARE,
    CONF_SUPPLY_WAIT,
    CONF_WEATHER_ENTITY,
    CONTROL_CHARGE,
    DEFAULT_SUPPLY_RESERVE,
    PRIORITY_FIRST,
    SET_MUST_SOC,
    SET_PRIORITY,
    SHARE_NEED,
    SHARE_QUEUE,
)
from .planner import PlanError, PriceSlot, charge_need, price_at
from .supply import BUFFER, MIN_AMPS, HouseForecast, SharedCar, SupplyPlan, amps_for, cheap_hours, kw, plan_supply
from .vehicle import elapsed, to_float

if TYPE_CHECKING:
    from .household import Household
    from .pairing import Site
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

MAX_AMPS = 32.0
# A car's current is changed at most this often, except to lower it.
CURRENT_EVERY = timedelta(minutes=5)
# Zaptec asks that its current is not changed more often than every 15 minutes (lowering it for the
# house is still done at once).
CURRENT_EVERY_BY = {"zaptec": timedelta(minutes=15)}
# Easee: a current set through its cloud falls back by itself after this long, so a car is
# not left at a low current if Home Assistant stops; it is sent again before that.
EASEE_TTL_MINUTES = 30
EASEE_RENEW = timedelta(minutes=15)
# The guard: after it has lowered a car, the plan may raise it again after this long.
GUARD_HOLD = timedelta(minutes=2)
# A meter that has not reported for this long has stopped: its last value is no reading.
METER_STALE = timedelta(minutes=5)
# A cut the guard has sent counts as done for this long, while the charger and the meter catch up.
GUARD_SETTLE = timedelta(seconds=60)
# A car the guard had to stop waits at least this long, then until the meter shows room for it.
GUARD_PAUSE = timedelta(minutes=5)
# The plan raises a car the guard watches only into what has been free on the meter, less this:
# room for the small things that come and go (a washing machine's motor, a fridge).
HEADROOM_MARGIN = 2.0
# ... and what has been free all the time this long: a dishwasher or a dryer that heats in bursts
# every ten minutes is not given to a car in the gap between two of them.
HEADROOM_WINDOW = timedelta(minutes=10)
# The weather forecast is fetched again after this long.
WEATHER_EVERY = timedelta(minutes=55)
# A plan is made again when the forecast moves this much (°C) in the hours ahead.
WEATHER_REPLAN = 2.0
# The heat pump is held back for at most this long at a time, and this many times a night.
HOLD_HEAT_PUMP = timedelta(minutes=15)
HOLDS_PER_NIGHT = 2
# Without a power reading, holding the heat pump back is counted as freeing this much (A per phase).
HEAT_PUMP_AMPS = 3.0


class SupplyControl:
    """The shared supply of one place of a household: the home, or another place with chargers."""

    def __init__(self, household: Household, site: Site | None = None) -> None:
        self.household = household
        self.site = site
        self.forecast = HouseForecast()
        self.plan: SupplyPlan | None = None
        self._hour: datetime | None = None
        self._readings: list[float] = []
        self._sent: dict[str, tuple[float, datetime]] = {}
        self._held: dict[str, datetime] = {}
        self._cuts: list[tuple[datetime, float]] = []
        self._paused: dict[str, datetime] = {}
        # The house's busiest phase without the cars, the most in each minute, for the raises.
        self._house_peaks: dict[datetime, float] = {}
        self._unsub: CALLBACK_TYPE | None = None
        self.guard_events = 0
        self._temps: list[float] = []
        self._weather: dict[datetime, float] = {}
        self._weather_at: datetime | None = None
        self._held_until: datetime | None = None
        self._held_amps = 0.0
        self._holds: list[datetime] = []
        # One run of the guard at a time; a reading that comes meanwhile gives one more run.
        self._guard_running = False
        self._guard_again = False
        # The heat pump was held back when Home Assistant stopped: it is let go at the start.
        self._release_at_start = False

    @property
    def hass(self) -> HomeAssistant:
        return self.household.hass

    # ------------------------------------------------------------------
    # Settings

    @property
    def config(self) -> Mapping[str, Any]:
        """The place's settings."""
        if self.site is None:
            return self.household.config
        return self.site.data

    def cars(self) -> list[Vehicle]:
        """The cars at this place."""
        if self.site is None:
            return list(self.household.vehicles.values())
        pairing = self.household.pairing
        return [vehicle for vehicle in self.household.vehicles.values() if pairing.vehicle_site(vehicle) is self.site]

    @property
    def share(self) -> str:
        value = self.config.get(CONF_SUPPLY_SHARE)
        return SHARE_NEED if value == SHARE_NEED else SHARE_QUEUE

    @property
    def limit(self) -> float:
        return to_float(self.config.get(CONF_SUPPLY_LIMIT)) or 0.0

    @property
    def active(self) -> bool:
        return self.limit > 0

    @property
    def phases(self) -> int:
        return 1 if str(self.config.get(CONF_SUPPLY_PHASES) or "3") == "1" else 3

    @property
    def meters(self) -> list[str]:
        value = self.config.get(CONF_SUPPLY_METER) or []
        return [str(entity) for entity in (value if isinstance(value, list) else [value]) if entity]

    @property
    def headroom_window(self) -> timedelta:
        """How long the guard looks back for the house's peaks before it turns the cars up (5-30 min)."""
        minutes = to_float(self.config.get(CONF_SUPPLY_WAIT))
        if minutes is None:
            return HEADROOM_WINDOW
        return timedelta(minutes=max(5.0, min(30.0, minutes)))

    @property
    def guard(self) -> bool:
        """The guard is on, and has a meter to watch."""
        return self.active and bool(self.config.get(CONF_SUPPLY_GUARD)) and bool(self.meters)

    @property
    def reserve(self) -> float:
        value = to_float(self.config.get(CONF_SUPPLY_RESERVE))
        return DEFAULT_SUPPLY_RESERVE if value is None else max(0.0, value)

    def current_entity(self, vehicle: Vehicle) -> str | None:
        """The number that sets the car's charging current: on the car, else on its charger."""
        entity = vehicle.config.get(CONF_CURRENT_ENTITY)
        if entity and any(
            charger.config.get(CONF_CURRENT_ENTITY) == entity and charger.charger_id != vehicle.charger_id
            for charger in self.household.chargers.values()
        ):
            # The car's setting is the current of a charger it is not at (it was set up at one, and
            # now finds its charger): the charger it is at sets it, not the one it was set up with.
            entity = None
        if not entity and vehicle.charger_id and (charger := self.household.chargers.get(vehicle.charger_id)):
            entity = charger.config.get(CONF_CURRENT_ENTITY)
        return str(entity) if entity else None

    # ------------------------------------------------------------------
    # The house

    def cars_amps(self) -> float:
        """What the cars charging now draw per phase, from their power readings or the plan."""
        total = 0.0
        for vehicle in self.cars():
            if not self.household.is_charging(vehicle):
                continue
            reading = self.household.power_reading(vehicle)
            if reading is None:
                reading = (
                    kw(self.plan.amps_at(vehicle.vehicle_id, self._now()) or 0.0, self.phases) if self.plan else 0.0
                )
            total += amps_for(reading, self.phases)
        return total

    def _amps(self, entity: str) -> float | None:
        """A meter's reading in amps: None when it has none, or has not reported for a while."""
        state = self.hass.states.get(entity)
        value = to_float(state.state) if state is not None else None
        if state is None or value is None:
            return None
        if elapsed(dt_util.utcnow(), state.last_reported) > METER_STALE:
            return None
        return value / 1000 if state.attributes.get("unit_of_measurement") == "mA" else value

    def house_now(self) -> float | None:
        """The house's current on its busiest phase, without the cars (None without a meter)."""
        reading = self._meter_reading()
        if reading is None:
            return None
        return max(0.0, reading - self.cars_amps())

    def note_house(self, now: datetime) -> float | None:
        """Keep the house's current now for the window the raises look back over."""
        house = self.house_now()
        if house is None:
            return None
        minute = now.replace(second=0, microsecond=0)
        self._house_peaks[minute] = max(house, self._house_peaks.get(minute, 0.0))
        cutoff = minute - self.headroom_window
        for old in [moment for moment in self._house_peaks if moment < cutoff]:
            del self._house_peaks[old]
        return house

    def house_peak(self, now: datetime) -> float | None:
        """The most the house has drawn on its busiest phase in the window, now included."""
        house = self.note_house(now)
        if house is None:
            return None
        cutoff = now - self.headroom_window
        return max([house, *(amps for moment, amps in self._house_peaks.items() if moment >= cutoff)])

    def _others_amps(self, vehicle: Vehicle, sent: float) -> float:
        """What the other cars draw now: all the cars, less this one."""
        own = 0.0
        if self.household.is_charging(vehicle):
            reading = self.household.power_reading(vehicle)
            own = amps_for(reading, self.phases) if reading is not None else sent
        return max(0.0, self.cars_amps() - own)

    def room_for_cars(self, now: datetime) -> float | None:
        """Amps per phase the cars may have in all: the limit less what the house has needed of late."""
        peak = self.house_peak(now)
        if peak is None:
            return None
        held = self._held_amps if self._held_until is not None else 0.0
        return self.limit - peak - held - HEADROOM_MARGIN

    def sample(self, now: datetime) -> bool:
        """A minute of the house; at the end of each hour, the hour goes into the forecast. True when saved."""
        if not self.active:
            return False
        hour = now.replace(minute=0, second=0, microsecond=0)
        saved = False
        if self._hour is not None and hour != self._hour and self._readings:
            slots = self.household.price_slots(self._hour)
            cheap = any(start == self._hour for start in cheap_hours(slots))
            temperature = sum(self._temps) / len(self._temps) if self._temps else None
            self.forecast.add(self._hour.hour, cheap, sum(self._readings) / len(self._readings), temperature)
            self._readings = []
            self._temps = []
            saved = True
        self._hour = hour
        if (amps := self.note_house(now)) is not None:
            self._readings.append(amps)
            if (temperature := self.temperature_now()) is not None:
                self._temps.append(temperature)
        return saved

    def house_at(self, slot: PriceSlot, cheap: set[datetime]) -> float:
        return self.forecast.predict(
            slot.start.hour, slot.start in cheap, self.reserve, self.temperature_at(slot.start)
        )

    # ------------------------------------------------------------------
    # The weather

    @property
    def weather_entity(self) -> str | None:
        value = self.config.get(CONF_WEATHER_ENTITY)
        return str(value) if value else None

    @staticmethod
    def _celsius(value: Any, unit: Any) -> float | None:
        number = to_float(value)
        if number is None:
            return None
        return (number - 32) * 5 / 9 if unit in ("°F", "F") else number

    def temperature_now(self) -> float | None:
        """Outside now, from the weather entity (°C)."""
        if not self.weather_entity or (state := self.hass.states.get(self.weather_entity)) is None:
            return None
        return self._celsius(state.attributes.get("temperature"), state.attributes.get("temperature_unit"))

    def temperature_at(self, moment: datetime) -> float | None:
        """The temperature expected in the hour from ``moment``: the forecast, else now for the hour ahead."""
        if not self.weather_entity:
            return None
        hour = dt_util.as_utc(moment).replace(minute=0, second=0, microsecond=0)
        if (value := self._weather.get(hour)) is not None:
            return value
        if abs(elapsed(moment, self._now())) < timedelta(hours=1):
            return self.temperature_now()
        return None

    async def async_refresh_weather(self, now: datetime, force: bool = False) -> bool:
        """Fetch the hourly forecast; True when it moved enough to plan again."""
        entity = self.weather_entity
        if not self.active or not entity:
            return False
        if not force and self._weather_at is not None and elapsed(now, self._weather_at) < WEATHER_EVERY:
            return False
        self._weather_at = now
        try:
            response = await self.hass.services.async_call(
                "weather",
                "get_forecasts",
                {"entity_id": entity, "type": "hourly"},
                blocking=True,
                return_response=True,
            )
        except (HomeAssistantError, ValueError) as err:
            _LOGGER.debug("No weather forecast from %s: %s", entity, err)
            return False
        state = self.hass.states.get(entity)
        unit = state.attributes.get("temperature_unit") if state else None
        forecast = (response or {}).get(entity) if isinstance(response, dict) else None
        items = forecast.get("forecast") if isinstance(forecast, dict) else None
        hours: dict[datetime, float] = {}
        for item in items if isinstance(items, list) else []:
            if not isinstance(item, dict):
                continue
            when = dt_util.parse_datetime(str(item.get("datetime") or ""))
            value = self._celsius(item.get("temperature"), unit)
            if when is not None and value is not None:
                hours[dt_util.as_utc(when).replace(minute=0, second=0, microsecond=0)] = value
        if not hours:
            return False
        before, self._weather = self._weather, hours
        moved = [abs(value - before[hour]) for hour, value in hours.items() if hour in before]
        return not before or (bool(moved) and max(moved) >= WEATHER_REPLAN)

    # ------------------------------------------------------------------
    # The plan

    def shared_car(self, vehicle: Vehicle, now: datetime) -> SharedCar | None:
        soc = vehicle.current_soc
        if vehicle.connected is not True or vehicle.at_home is False or soc is None or vehicle.plan is None:
            return None
        power = self.household.vehicle_power(vehicle)
        speed = vehicle.charge_speed(power)[0]
        curve = vehicle.learned.speeds()

        def grid_kwh(level: float) -> float:
            """Energy from the wall to ``level`` (0 when the car is there already)."""
            if level <= soc:
                return 0.0
            try:
                return charge_need(soc, level, vehicle.capacity, power, speed=speed, curve=curve).grid_kwh
            except PlanError:
                return 0.0

        want = grid_kwh(vehicle.target)
        if want <= 0:
            return None
        must_soc = to_float(vehicle.settings.get(SET_MUST_SOC)) or 0.0
        must = want if must_soc <= 0 else grid_kwh(min(must_soc, vehicle.target))
        deadline = vehicle.deadline
        if deadline is not None and elapsed(deadline - BUFFER, now) > timedelta(0):
            deadline -= BUFFER
        return SharedCar(
            vehicle.vehicle_id,
            must_kwh=must,
            want_kwh=max(must, want),
            max_amps=min(MAX_AMPS, amps_for(power, self.phases)),
            deadline=deadline,
            priority=0 if vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST else 1,
            phases=self.phases,
            adjustable=self.current_entity(vehicle) is not None,
        )

    def replan(self, now: datetime) -> None:
        """Plan the plugged-in cars together, and give each its share as its plan."""
        if not self.active:
            self.plan = None
            return
        cars = [car for vehicle in self.cars() if (car := self.shared_car(vehicle, now))]
        if not cars:
            self.plan = None
            return
        deadlines = [car.deadline for car in cars if car.deadline is not None]
        horizon = max(deadlines) if len(deadlines) == len(cars) else now + timedelta(hours=24)
        slots = [slot for slot in self.household.price_slots(now) if slot.start < horizon]
        cheap = cheap_hours(slots)
        # With the guard, the cars never get its margin: the plan leaves it out, so it is long enough.
        limit = self.limit - (HEADROOM_MARGIN if self.guard else 0.0)
        self.plan = plan_supply(
            slots, cars, now, limit=limit, house=lambda slot: self.house_at(slot, cheap), share=self.share
        )
        for car in cars:
            vehicle = self.household.vehicles[car.vehicle_id]
            if vehicle.plan is None:
                continue
            shares = self.plan.amps.get(car.vehicle_id, [])
            energy = sum(
                kw(amps, car.phases) * elapsed(end, max(start, now)).total_seconds() / 3600
                for start, end, amps in shares
            )
            cost = sum(
                kw(amps, car.phases)
                * elapsed(end, max(start, now)).total_seconds()
                / 3600
                * (price_at(slots, start) or 0.0)
                for start, end, amps in shares
            )
            vehicle.plan = replace(
                vehicle.plan,
                segments=self.plan.segments(car.vehicle_id),
                energy=round(energy, 3),
                cost=round(cost, 2),
                minutes=round(sum(elapsed(end, max(start, now)).total_seconds() for start, end, _amps in shares) / 60),
                short=self.plan.short_kwh.get(car.vehicle_id, 0.0) > 0.1,
            )

    # ------------------------------------------------------------------
    # The current

    def _meter_reading(self) -> float | None:
        """The busiest phase as the meter shows it, the cars included (None without a reading)."""
        readings = [value for entity in self.meters if (value := self._amps(entity)) is not None]
        return max(readings) if readings else None

    # ------------------------------------------------------------------
    # The heat pump

    @property
    def heat_pump_power(self) -> str | None:
        value = self.config.get(CONF_HEAT_PUMP_POWER)
        return str(value) if value else None

    @property
    def heat_pump_block(self) -> str | None:
        value = self.config.get(CONF_HEAT_PUMP_BLOCK)
        return str(value) if value else None

    def heat_pump_kw(self) -> float | None:
        from .household import power_value

        if not self.heat_pump_power:
            return None
        return power_value(self.hass.states.get(self.heat_pump_power))

    def _holds_tonight(self, now: datetime) -> int:
        """Times the heat pump was held back since noon."""
        noon = dt_util.as_local(now).replace(hour=12, minute=0, second=0, microsecond=0)
        if dt_util.as_local(now) < noon:
            noon -= timedelta(days=1)
        self._holds = [at for at in self._holds if at >= noon]
        return len(self._holds)

    async def _async_hold_heat_pump(self, now: datetime) -> float:
        """Hold the heat pump back, when allowed; the amps that frees (0 when it was not held)."""
        entity = self.heat_pump_block
        if not entity or self._held_until is not None or self._holds_tonight(now) >= HOLDS_PER_NIGHT:
            return 0.0
        power = self.heat_pump_kw()
        if power is not None and power < 0.2:
            return 0.0  # it is not running: nothing to free
        if await self.household._async_switch(entity, True) is not None:
            return 0.0
        amps = amps_for(power, self.phases) if power is not None else HEAT_PUMP_AMPS
        self._held_until = now + HOLD_HEAT_PUMP
        self._held_amps = amps
        self._holds.append(now)
        self.guard_events += 1
        self.household.async_save()
        self.household.events.add(now, "heat_pump_held", entity=entity, kw=power, amps=amps, until=self._held_until)
        return amps

    async def async_release_heat_pump(self, now: datetime, force: bool = False) -> None:
        """Let the heat pump run again after its time, or at once with ``force``."""
        if self._held_until is None or (not force and now < self._held_until):
            return
        self._held_until = None
        self._held_amps = 0.0
        self.household.async_save()
        self.household.events.add(now, "heat_pump_released", forced=force)
        if self.heat_pump_block:
            await self.household._async_switch(self.heat_pump_block, False)

    def heat_pump_state(self, now: datetime) -> dict[str, Any] | None:
        if not self.heat_pump_power and not self.heat_pump_block:
            return None
        power = self.heat_pump_kw()
        return {
            "kw": None if power is None else round(power, 2),
            "held": self._held_until is not None,
            "held_until": self._held_until.isoformat() if self._held_until else None,
            "holds_tonight": self._holds_tonight(now),
        }

    def holds_off(self, vehicle: Vehicle, now: datetime) -> bool:
        """The guard stopped this car: it waits, then until the meter shows room for it."""
        until = self._paused.get(vehicle.vehicle_id)
        if until is None:
            return False
        room = self.room_for_cars(now)
        free = None if room is None else room - self.cars_amps()
        if not self.guard or (now >= until and (free is None or free >= MIN_AMPS)):
            del self._paused[vehicle.vehicle_id]
            self._sent.pop(vehicle.vehicle_id, None)
            return False
        return True

    def _raise_every(self, entity: str) -> timedelta:
        """How often the current behind ``entity`` may be raised."""
        entry = er.async_get(self.hass).async_get(entity)
        return CURRENT_EVERY_BY.get(entry.platform, CURRENT_EVERY) if entry is not None else CURRENT_EVERY

    def _easee_device(self, entity: str) -> str | None:
        """The Easee charger behind ``entity``, when it belongs to the Easee integration."""
        entry = er.async_get(self.hass).async_get(entity)
        if entry is None or entry.platform != "easee":
            return None
        return entry.device_id

    def bounds(self, entity: str) -> tuple[float, float]:
        """The least and the most a car's current is set to.

        Never under 6 A, whatever the number allows (a Zaptec Go 2 goes down to 0): below that a car
        does not charge at all, so the guard pauses it instead.
        """
        state = self.hass.states.get(entity)
        low = to_float(state.attributes.get("min")) if state is not None else None
        high = to_float(state.attributes.get("max")) if state is not None else None
        return max(MIN_AMPS, low or 0.0), (MAX_AMPS if high is None else max(MIN_AMPS, high))

    async def async_set_current(self, vehicle: Vehicle, entity: str, value: float, now: datetime) -> bool:
        """Set the car's current: through Easee's own action, or the number's ``set_value``."""
        if (device := self._easee_device(entity)) is not None:
            service = ("easee", "set_charger_dynamic_limit")
            data: dict[str, Any] = {"device_id": device, "current": value, "time_to_live": EASEE_TTL_MINUTES}
        else:
            service = (entity.split(".", 1)[0], "set_value")
            data = {"entity_id": entity, "value": value}
        try:
            async with asyncio.timeout(COMMAND_TIMEOUT):
                await self.hass.services.async_call(*service, data, blocking=True)
        except TimeoutError:
            _LOGGER.warning("No answer when setting %s to %s A", entity, value)
            self._note_current(vehicle, entity, value, now, "timeout")
            return False
        except HomeAssistantError as err:
            _LOGGER.warning("Could not set %s to %s A: %s", entity, value, err)
            self._note_current(vehicle, entity, value, now, str(err) or type(err).__name__)
            return False
        before = self._sent.get(vehicle.vehicle_id)
        self._sent[vehicle.vehicle_id] = (value, now)
        self._note_current(vehicle, entity, value, now, None, before[0] if before else None)
        return True

    def _note_current(
        self,
        vehicle: Vehicle,
        entity: str,
        value: float,
        now: datetime,
        error: str | None,
        before: float | None = None,
    ) -> None:
        """A current sent, in the event log: with what the house drew and the room there was."""
        self.household.events.add(
            now,
            "current",
            vehicle=vehicle.name,
            site=self.site.site_id if self.site else None,
            entity=entity,
            amps=value,
            before=before,
            house=self.house_now(),
            peak=self.house_peak(now),
            room=self.room_for_cars(now),
            cars=self.cars_amps(),
            error=error,
        )

    async def async_keep_current(self, vehicle: Vehicle, entity: str, value: float, now: datetime) -> bool:
        """Set the car's current only when it is not there already (an Easee limit is renewed before it runs out)."""
        last = self._sent.get(vehicle.vehicle_id)
        if self._easee_device(entity) is not None:
            if last is not None and abs(last[0] - value) < 0.5 and elapsed(now, last[1]) < EASEE_RENEW:
                return True
        elif (shown := to_float(self.household.state_of(entity))) is not None and abs(shown - value) < 0.5:
            self._sent[vehicle.vehicle_id] = (value, last[1] if last is not None and last[0] == value else now)
            return True
        return await self.async_set_current(vehicle, entity, value, now)

    def plan_amps(self, vehicle: Vehicle, now: datetime) -> float | None:
        """The car's share in the joint plan now (None without a plan or a share)."""
        return self.plan.amps_at(vehicle.vehicle_id, now) if self.plan is not None else None

    async def async_apply(self, now: datetime) -> None:
        """Tell each car with a current setting how many amps its share is now."""
        if self.plan is None:
            return
        for vehicle in self.cars():
            entity = self.current_entity(vehicle)
            amps = self.plan.amps_at(vehicle.vehicle_id, now)
            if entity is None or amps is None or amps <= 0:
                continue
            easee = self._easee_device(entity) is not None
            if not easee and self.hass.states.get(entity) is None:
                continue
            low, high = self.bounds(entity)
            value = max(low, min(high, float(round(amps))))
            if self.guard and self.house_now() is None:
                value = low  # the guard has no meter: the least, until it is back
            last = self._sent.get(vehicle.vehicle_id)
            held = self._held.get(vehicle.vehicle_id)
            if held is not None and now < held and (last is None or value > last[0]):
                continue  # the guard lowered it a moment ago
            if self.guard and last is not None and value > last[0]:
                # Up only into what has been free on the meter all the last ten minutes.
                room = self.room_for_cars(now)
                allowed = 0.0 if room is None else room - self._others_amps(vehicle, last[0])
                value = min(value, float(int(max(last[0], allowed))))
                if value < last[0] + 1:
                    continue
            renew = easee and last is not None and elapsed(now, last[1]) >= EASEE_RENEW
            if (
                last is not None
                and not renew
                and (
                    abs(last[0] - value) < 1 or (value > last[0] and elapsed(now, last[1]) < self._raise_every(entity))
                )
            ):
                continue
            if not easee and not renew and to_float(self.hass.states.get(entity).state) == value:  # type: ignore[union-attr]
                self._sent[vehicle.vehicle_id] = (value, now)
                continue
            await self.async_set_current(vehicle, entity, value, now)

    # ------------------------------------------------------------------
    # The guard: the house first, now

    @callback
    def async_start(self) -> None:
        """Watch the meter, for the guard. A heat pump left held back by a restart is let go."""
        if self._release_at_start:
            self._release_at_start = False
            if self.heat_pump_block:
                self.hass.async_create_task(self.household._async_switch(self.heat_pump_block, False))
        if self.guard and self._unsub is None:
            self._unsub = async_track_state_change_event(self.hass, self.meters, self._handle_meter)

    @callback
    def async_stop(self) -> None:
        if self._unsub is not None:
            self._unsub()
            self._unsub = None
        if self._held_until is not None and self.heat_pump_block:
            # Never leave the heat pump held back.
            self.hass.async_create_task(self.household._async_switch(self.heat_pump_block, False))
            self._held_until = None

    @callback
    def async_check(self) -> None:
        """Look at the meter again. A meter that stays on the same number sends nothing new to act on."""
        if self.guard:
            self._handle_meter(None)

    @callback
    def _handle_meter(self, _event: Event[EventStateChangedData] | None) -> None:
        # Every reading counts for the window the raises look back over, also a short burst.
        self.note_house(self._now())
        if self._guard_running:
            # One run at a time: two at once would both cut for the same amps.
            self._guard_again = True
            return
        self._guard_running = True
        self.household.config_entry.async_create_task(self.hass, self._async_guard_runs(), "ev planner guard")

    async def _async_guard_runs(self) -> None:
        try:
            while True:
                self._guard_again = False
                await self.async_guard(dt_util.now())
                if not self._guard_again:
                    return
        finally:
            self._guard_running = False

    def _current_now(self, vehicle: Vehicle, entity: str, high: float) -> float:
        """The car's current: as last sent, else as its setting shows, else as it charges, else its most."""
        if (last := self._sent.get(vehicle.vehicle_id)) is not None:
            return last[0]
        if (shown := to_float(self.household.state_of(entity))) is not None and shown > 0:
            return min(shown, high)
        if (power := self.household.power_reading(vehicle)) is not None and power > 0:
            return min(amps_for(power, self.phases), high)
        return high

    async def async_guard(self, now: datetime) -> None:
        """When the house and the cars draw more than the limit, lower the cars at once.

        The car with the lowest priority and the latest ready-by time first, to
        the least a charger gives (6 A). Without a meter reading, every car with
        a current setting goes down to the least. The plan raises them again
        when there is room, but not for ``GUARD_HOLD``.
        """
        if not self.guard:
            return
        reading = self._meter_reading()

        # The cars that draw current: the ones that say they charge, and the ones that have just been
        # started and have not said so yet. A car that is to be paused, and still says it charges,
        # is most often on its way down: it comes last, so a cut is not spent on it.
        def started(vehicle: Vehicle) -> bool:
            return vehicle.decision is not None and vehicle.decision.control == CONTROL_CHARGE

        charging = sorted(
            (
                vehicle
                for vehicle in self.cars()
                if (self.household.is_charging(vehicle) or started(vehicle)) and vehicle.vehicle_id not in self._paused
            ),
            key=lambda vehicle: (
                not started(vehicle),
                vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST,
                -(vehicle.deadline.timestamp() if vehicle.deadline else 0),
            ),
        )
        if not charging:
            return
        self._cuts = [(at, amps) for at, amps in self._cuts if elapsed(now, at) < GUARD_SETTLE]
        over = reading - self.limit - sum(amps for _at, amps in self._cuts) if reading is not None else None
        if over is not None and over <= 0:
            return
        self.household.events.add(
            now,
            "guard",
            site=self.site.site_id if self.site else None,
            reading=reading,
            limit=self.limit,
            over=over,
            settling=[[at, amps] for at, amps in self._cuts],
            cars=[vehicle.name for vehicle in charging],
        )
        cars = [(vehicle, entity) for vehicle in charging if (entity := self.current_entity(vehicle)) is not None]
        for vehicle, entity in cars:
            low, high = self.bounds(entity)
            current = self._current_now(vehicle, entity, high)
            target = low if over is None else max(low, current - over)
            target = float(round(target)) if over is None else float(int(target))  # round down when cutting
            if target >= current:
                continue
            if await self.async_set_current(vehicle, entity, target, now):
                self._held[vehicle.vehicle_id] = now + GUARD_HOLD
                self._cuts.append((now, current - target))
                self.guard_events += 1
                if over is not None:
                    over -= current - target
                    if over <= 0:
                        return
        if over is None or over <= 0:
            return
        # Every car at the least it can take, and still too much: hold the heat pump back for a while,
        # when that is allowed, then stop the last car in line.
        if (freed := await self._async_hold_heat_pump(now)) > 0:
            self._cuts.append((now, freed))
            over -= freed
            if over <= 0:
                return
        for vehicle in charging:
            if self.household.control_entity(vehicle) is None:
                continue
            entity = self.current_entity(vehicle)
            power = self.household.power_reading(vehicle)
            if entity is not None:
                amps = self._current_now(vehicle, entity, MAX_AMPS)
            else:
                amps = amps_for(power, self.phases) if power else MIN_AMPS
            if not await self.household.async_pause_for_house(vehicle):
                # It did not stop: not counted as done, and the next reading tries again.
                continue
            self._paused[vehicle.vehicle_id] = now + GUARD_PAUSE
            self._cuts.append((now, amps))
            self.guard_events += 1
            over -= amps
            if over <= 0:
                return

    # ------------------------------------------------------------------
    # State and storage

    def state(self, now: datetime) -> dict[str, Any] | None:
        if not self.active:
            return None
        plan = self.plan
        expected = (
            next((house for start, end, _limit, house in plan.capacity if start <= now < end), None) if plan else None
        )
        return {
            "limit": self.limit,
            "phases": self.phases,
            "meter": bool(self.meters),
            "house_now": None if (house := self.house_now()) is None else round(house, 1),
            "house_expected": None if expected is None else round(expected, 1),
            "cars": {vid: plan.amps_at(vid, now) for vid in plan.amps} if plan else {},
            "short": {vid: kwh for vid, kwh in plan.short_kwh.items() if kwh > 0.1} if plan else {},
            "cars_now": self.cars_now(),
            "guard": self.guard,
            "timeline": self.timeline(now),
            "weather": {"now": self.temperature_now(), "slope": self.forecast.slope} if self.weather_entity else None,
        }

    def cars_now(self) -> dict[str, float]:
        """What each car charging now draws per phase, from its power reading (for the energy flow)."""
        out: dict[str, float] = {}
        for vehicle in self.cars():
            reading = self.household.power_reading(vehicle)
            if reading is not None and reading > 0 and self.household.is_charging(vehicle):
                out[vehicle.vehicle_id] = round(amps_for(reading, self.phases), 1)
        return out

    def timeline(self, now: datetime, hours: int = 14) -> list[dict[str, Any]]:
        """The slots ahead: the limit, what the house is expected to draw and each car's share."""
        if self.plan is None:
            return []
        end = now + timedelta(hours=hours)
        rows = []
        for start, stop, limit, house in self.plan.capacity:
            if stop <= now or start >= end:
                continue
            cars = {vid: amps for vid, per in self.plan.amps.items() for s, _e, amps in per if s == start}
            rows.append(
                {
                    "start": start.isoformat(),
                    "end": stop.isoformat(),
                    "limit": limit,
                    "house": round(house, 1),
                    "cars": cars,
                }
            )
        return rows

    def vehicle_amps(self, vehicle_id: str, now: datetime) -> float | None:
        return self.plan.amps_at(vehicle_id, now) if self.plan else None

    def to_store(self) -> dict[str, Any]:
        return self.forecast.to_dict()

    def actuators_to_store(self) -> dict[str, Any]:
        """What EV Planner holds back right now, so a restart can let it go."""
        return {"heat_pump_held": self._held_until is not None}

    def load_actuators(self, data: Any) -> None:
        self._release_at_start = isinstance(data, dict) and bool(data.get("heat_pump_held"))

    def load(self, data: Any) -> None:
        self.forecast = HouseForecast.from_dict(data)

    def _now(self) -> datetime:
        from homeassistant.util import dt as dt_util

        return dt_util.now()
