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
from collections.abc import Callable, Mapping
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.event import async_call_later, async_track_state_change_event
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
    CONTROL_PAUSE,
    DEFAULT_SUPPLY_RESERVE,
    PRIORITY_FIRST,
    REASON_SOLAR,
    SET_KNOWN_PRICES,
    SET_MUST_SOC,
    SET_PRIORITY,
    SHARE_NEED,
    SHARE_QUEUE,
)
from .planner import PlanError, PriceSlot, charge_need, price_at
from .rules import window_start
from .supply import (
    BUFFER,
    MIN_AMPS,
    HouseForecast,
    SharedCar,
    SupplyPlan,
    amps_for,
    cheap_hours,
    kw,
    plan_supply,
    share_room,
)
from .vehicle import elapsed, to_float

if TYPE_CHECKING:
    from .household import Household
    from .pairing import Charger, Site
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

MAX_AMPS = 32.0
# A charger's current goes up at most this often (down it goes at once, when the house needs it).
CURRENT_EVERY = timedelta(minutes=5)
# Zaptec asks that its current is not changed more often than every 15 minutes.
CURRENT_EVERY_BY = {"zaptec": timedelta(minutes=15)}
# Easee: a current set through its cloud falls back by itself after this long, so a car is
# not left at a low current if Home Assistant stops; it is sent again before that.
EASEE_TTL_MINUTES = 30
EASEE_RENEW = timedelta(minutes=15)
# A meter that has not reported for this long has stopped: its last value is no reading.
METER_STALE = timedelta(minutes=5)
# A cut the guard has sent counts as done for this long, while the charger and the meter catch up.
GUARD_SETTLE = timedelta(seconds=60)
# A small overload (up to this share above the limit) must last this long before the guard cuts:
# an oven's element or a kettle that peaks for a few seconds is not worth turning a car down for.
# A fuse carries a little more than its rating for many minutes; a large overload is cut at once.
GUARD_CONFIRM = timedelta(seconds=30)
GUARD_SMALL = 0.2
# A charger whose cloud shows the current it had a moment ago (a Zaptec's does for up to a minute):
# what EV Planner set counts for this long, whatever the charger shows. Shown differently after
# that, and for that long, someone else has set it (its app, a person), and that is what it is.
ECHO = timedelta(minutes=2)
# A car the guard had to stop waits at least this long, then until the meter shows room for it.
GUARD_PAUSE = timedelta(minutes=5)
# A charger that draws more than this (kW) charges a car.
STRAY_KW = 1.0
# The cars never get the last two amps under the limit: room for the small things that come and go
# (a fridge, a washing machine's motor) and for a meter that is a moment behind (25 A: the cars stay under 23).
HEADROOM_MARGIN = 2.0
# The house's peaks are kept this long: a charger goes up only into what has been free all the time
# since it last changed (at least the place's window), so a dishwasher or a dryer that heats in bursts
# every ten minutes is not given to a car in the gap between two of them.
HEADROOM_WINDOW = timedelta(minutes=10)
PEAKS_KEPT = timedelta(minutes=30)
# The weather forecast is fetched again after this long.
WEATHER_EVERY = timedelta(minutes=55)
# A plan is made again when the forecast moves this much (°C) in the hours ahead.
WEATHER_REPLAN = 2.0
# The heat pump is held back for at most this long at a time, and this many times a night.
HOLD_HEAT_PUMP = timedelta(minutes=15)
HOLDS_PER_NIGHT = 2
# Without a power reading, holding the heat pump back is counted as freeing this much (A per phase).
HEAT_PUMP_AMPS = 3.0
# A charger's own setting EV Planner no longer turns (it turns the installation's), set back to full
# when it was left lower: not more often than this.
UNCLAMP_EVERY = timedelta(minutes=15)
# What turns a charger's current is looked up again after this long.
KNOB_KEPT = timedelta(minutes=10)

WHO_CAR = "car"
WHO_GUEST = "guest"
WHO_STRAY = "stray"


@dataclass(slots=True)
class Channel:
    """A charger that draws now, as the guard and the raises see it: what turns it, and what it may have."""

    entity: str | None  # what sets its current (None: a car that can only be switched)
    who: str  # WHO_CAR, WHO_GUEST or WHO_STRAY
    name: str
    vehicle: Vehicle | None
    charger: Charger | None
    draw: float  # amps per phase it draws now
    value: float  # what it is set to (a car that can only be switched: what it draws)
    low: float
    high: float
    want: float | None  # the most it is to be given (None: not raised by the supply)
    known: bool = True  # what it is set to is known (from EV Planner or the charger)
    tier: int = 1  # 0: a car set to come first gets the room before the others
    planned: float | None = None  # its share in the joint plan now (used only without a meter)


class SupplyControl:
    """The shared supply of one place of a household: the home, or another place with chargers."""

    def __init__(self, household: Household, site: Site | None = None) -> None:
        self.household = household
        self.site = site
        self.forecast = HouseForecast()
        self.plan: SupplyPlan | None = None
        self._hour: datetime | None = None
        self._readings: list[float] = []
        # What EV Planner set each charger's current to, and when (by what turns it: a number, or an
        # Easee charger's limit). One memory for the plan, the guard and the raises alike.
        self._sent: dict[str, tuple[float, datetime]] = {}
        # What a charger drew when the guard cut it: counted as its draw until the cut has settled.
        self._cut_draw: dict[str, tuple[float, datetime]] = {}
        self._cuts: list[tuple[datetime, float]] = []
        self._paused: dict[str, datetime] = {}
        # The house's busiest phase without the chargers, the most in each minute, for the raises.
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
        # When the meter first showed a small overload that is still there (the guard waits GUARD_CONFIRM).
        self._over_since: datetime | None = None
        self._confirm_unsub: CALLBACK_TYPE | None = None
        # The meter had no reading at the guard's last check, and when it last had none.
        self._blind = False
        self._blind_at: datetime | None = None
        # A Zaptec charger's own current setting, set back to full once EV Planner turns its installation's.
        self._unclamped: dict[str, datetime] = {}
        # The cars that wait for room on the supply before they are started.
        self._waiting: set[str] = set()
        # What turns each charger's current, as last found (a Zaptec's installation, or the setting itself).
        self._knobs: dict[str, tuple[str, datetime]] = {}

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
        return {**self.site.data, **self.household.place_settings(self.site.site_id)}

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

    def car_kw(self, vehicle: Vehicle) -> float | None:
        """What the car draws now (kW): its charger's power sensor when the car is the one at it, else the car's.

        A charger's sensor reports often (a Shelly every few seconds); a car's own reading comes from its
        cloud and can be minutes old, which is too old for the guard.
        """
        charger = self.household.chargers.get(vehicle.charger_id or "")
        if (
            charger is not None
            and charger.power_entity
            and self.household.pairing.occupant(charger) == vehicle.vehicle_id
        ):
            reading = self.household.charger_power(charger)
            if reading is not None:
                return reading
        return self.household.power_reading(vehicle)

    def _charger_kw(self, vehicle: Vehicle) -> float | None:
        """What the car's charger measures, when the car is the one at it (None without a meter there)."""
        charger = self.household.chargers.get(vehicle.charger_id or "")
        if (
            charger is None
            or not charger.power_entity
            or self.household.pairing.occupant(charger) != vehicle.vehicle_id
        ):
            return None
        return self.household.charger_power(charger)

    def full_amps(self, vehicle: Vehicle, entity: str | None = None) -> float:
        """The most the car takes at its charger (A per phase): its setup and the charger's, within the setting's range.

        Not what it has been measured at: a car that was turned down for the house would otherwise be
        planned at that from then on, and never be given its full current again.
        """
        charger = self.household.chargers.get(vehicle.charger_id or "")
        power = vehicle.configured_power if charger is None else min(vehicle.configured_power, charger.power)
        amps = min(MAX_AMPS, amps_for(power, self.phases))
        entity = entity or self.current_entity(vehicle)
        if entity:
            low, high = self.bounds(entity)
            amps = max(low, min(high, amps))
        return amps

    def throttled(self, vehicle: Vehicle) -> bool:
        """The car charges at less than its full current, because EV Planner turned it down."""
        if not self.active or (entity := self.current_entity(vehicle)) is None:
            return False
        value = self.setting(self.knob(entity), self._now())
        return value is not None and value < self.full_amps(vehicle, entity) - 1

    def held_kw(self, vehicle: Vehicle) -> float | None:
        """What the car charges at while the guard holds it below its full current (kW), else None: the plan
        then works out when it is done at that."""
        if not self.active or not self.guard or (raw := self.current_entity(vehicle)) is None:
            return None
        if not self.household.is_charging(vehicle):
            return None
        value = self.setting(self.knob(raw), self._now())
        if value is None or value >= round(self.full_amps(vehicle, raw)) - 0.5:
            return None
        return kw(value, self.phases)

    # ------------------------------------------------------------------
    # The chargers that draw now

    def _started(self, vehicle: Vehicle) -> bool:
        return vehicle.decision is not None and vehicle.decision.control == CONTROL_CHARGE

    def _power_amps(self, kw_value: float | None) -> float | None:
        return None if kw_value is None else max(0.0, amps_for(kw_value, self.phases))

    def channels(self, now: datetime) -> list[Channel]:
        """Every charger at this place that charges now, or is about to: the household's cars, the guest's, and
        any other that draws (a car EV Planner took for another, or does not know). The one to be turned
        down first comes first: another's or a guest's charger last.
        """
        out: list[Channel] = []
        held: set[str] = set()
        cars = sorted(
            (
                vehicle
                for vehicle in self.cars()
                if (self.household.is_charging(vehicle) or self._started(vehicle))
                and vehicle.vehicle_id not in self._paused
            ),
            key=lambda vehicle: (
                not self._started(vehicle),
                vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST,
                -(vehicle.deadline.timestamp() if vehicle.deadline else 0),
            ),
        )
        # A car the guard stopped: its charger is still the car's, also while it winds down.
        held.update(
            vehicle.charger_id for vehicle in self.cars() if vehicle.vehicle_id in self._paused and vehicle.charger_id
        )
        for vehicle in cars:
            if vehicle.charger_id:
                held.add(vehicle.charger_id)
            raw = self.current_entity(vehicle)
            entity = self.knob(raw) if raw else None
            if entity is not None and self._easee_device(entity) is None and self.hass.states.get(entity) is None:
                entity = None
            charging = self.household.is_charging(vehicle)
            # Its charger's meter counts whether or not the car says it charges yet (a car that has just started
            # draws all the same, and its current is not the house's); the car's own reading, from its cloud,
            # only while it charges.
            measured = self._power_amps(self.car_kw(vehicle) if charging else self._charger_kw(vehicle))
            if entity is not None:
                low, high = self.bounds(entity)
                high = max(low, min(high, float(round(self.full_amps(vehicle, raw)))))
                setting = self.setting(entity, now)
                value = high if setting is None else setting
                # With the meter, a charger gets the room there is, whatever started the car (the plan, charge now,
                # its app): the plan only starts and stops it. Without one, the joint plan's share is all there is.
                want: float | None = None
                decision = vehicle.decision
                if decision is not None and decision.reason == REASON_SOLAR:
                    want = None  # the sun sets it
                elif decision is None or decision.control != CONTROL_PAUSE:
                    want = high
                planned = self.plan_amps(vehicle, now)
                share = max(low, min(high, float(round(planned)))) if planned else None
                draw = measured if measured is not None else value
                first = 0 if vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST else 1
                out.append(
                    Channel(
                        entity,
                        WHO_CAR,
                        vehicle.name,
                        vehicle,
                        None,
                        draw,
                        value,
                        low,
                        high,
                        want,
                        setting is not None,
                        first,
                        share,
                    )
                )
            else:
                power = self.household.vehicle_power(vehicle)
                full = min(MAX_AMPS, amps_for(power, self.phases))
                draw = measured if measured is not None else (full if charging else 0.0)
                if draw >= 0.5:  # it can only be stopped, and is only worth stopping when it draws
                    out.append(Channel(None, WHO_CAR, vehicle.name, vehicle, None, draw, draw, draw, draw, None))
        guest = self._guest_charger(now)
        others: list[tuple[Charger, str]] = []
        if guest is not None:
            others.append((guest, WHO_GUEST))
        for charger in self.household.chargers.values():
            if (
                charger.charger_id in held
                or charger is guest
                or self.household.pairing.site_of(charger) is not self.site
            ):
                continue
            if (drawing := self.household.charger_power(charger)) is not None and drawing > STRAY_KW:
                others.append((charger, WHO_STRAY))
        for charger, who in others:
            raw = charger.config.get(CONF_CURRENT_ENTITY)
            entity = self.knob(str(raw)) if raw else None
            if entity is not None and self._easee_device(entity) is None and self.hass.states.get(entity) is None:
                entity = None
            measured = self._power_amps(self.household.charger_power(charger))
            full = min(MAX_AMPS, float(round(amps_for(charger.power, self.phases))))
            if entity is None:
                draw = measured if measured is not None else (full if who == WHO_GUEST else 0.0)
                if draw >= 0.5:
                    out.append(Channel(None, who, charger.name, None, charger, draw, draw, draw, draw, None))
                continue
            low, high = self.bounds(entity)
            high = max(low, min(high, full))
            setting = self.setting(entity, now)
            value = high if setting is None else setting
            draw = measured if measured is not None else value
            out.append(
                Channel(entity, who, charger.name, None, charger, draw, value, low, high, high, setting is not None)
            )
        # A cut that has not settled yet: the charger is counted at what it drew, as the meter is.
        for channel in out:
            cut = self._cut_draw.get(channel.entity) if channel.entity else None
            if cut is not None and elapsed(now, cut[1]) < GUARD_SETTLE:
                channel.draw = cut[0]
        return out

    def cars_amps(self) -> float:
        """What the chargers that charge now draw per phase: measured where they can be, else as they are set."""
        return sum(channel.draw for channel in self.channels(self._now()))

    def _amps(self, entity: str) -> float | None:
        """A meter's reading in amps: None when it has none, or has not reported for a while."""
        state = self.hass.states.get(entity)
        value = to_float(state.state) if state is not None else None
        if state is None or value is None:
            return None
        if elapsed(dt_util.utcnow(), state.last_reported) > METER_STALE:
            return None
        return value / 1000 if state.attributes.get("unit_of_measurement") == "mA" else value

    def house_now(self, channels: list[Channel] | None = None) -> float | None:
        """The house's current on its busiest phase, without the chargers (None without a meter)."""
        reading = self._meter_reading()
        if reading is None:
            return None
        if channels is None:
            channels = self.channels(self._now())
        return max(0.0, reading - sum(channel.draw for channel in channels))

    def note_house(self, now: datetime, channels: list[Channel] | None = None) -> float | None:
        """Keep the house's current now for the window the raises look back over."""
        house = self.house_now(channels)
        if house is None:
            return None
        minute = now.replace(second=0, microsecond=0)
        self._house_peaks[minute] = max(house, self._house_peaks.get(minute, 0.0))
        cutoff = minute - max(PEAKS_KEPT, self.headroom_window)
        for old in [moment for moment in self._house_peaks if moment < cutoff]:
            del self._house_peaks[old]
        return house

    def house_peak(self, now: datetime) -> float | None:
        """The most the house has drawn on its busiest phase in the window, now included."""
        return self.house_peak_within(now, self.headroom_window)

    def house_peak_within(
        self, now: datetime, window: timedelta, channels: list[Channel] | None = None
    ) -> float | None:
        """The most the house has drawn in the last ``window``."""
        house = self.note_house(now, channels)
        if house is None:
            return None
        cutoff = now - window
        return max([house, *(amps for moment, amps in self._house_peaks.items() if moment >= cutoff)])

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
            slots = self.household.price_slots(self._hour, self.site.site_id if self.site else None)
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

    def house_at(self, slot: PriceSlot, cheap: set[datetime], fallback: float | None = None) -> float:
        return self.forecast.predict(
            slot.start.hour,
            slot.start in cheap,
            self.reserve if fallback is None else fallback,
            self.temperature_at(slot.start),
        )

    def house_fallback(self, now: datetime) -> float:
        """What the house is planned with in an hour the forecast does not know yet.

        The reserve, the first days. With the guard and a meter, what the house has drawn of late
        instead, when that is less: the guard turns the cars down if the house takes more after all.
        """
        if self.guard and (peak := self.house_peak(now)) is not None:
            return min(self.reserve, max(1.0, peak))
        return self.reserve

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
        if must_soc <= 0 and vehicle.trip_cap is not None:
            # A departure at the cheapest prices only: nothing of it must come at any price.
            must = 0.0
        deadline = vehicle.deadline
        if deadline is not None and elapsed(deadline - BUFFER, now) > timedelta(0):
            deadline -= BUFFER
        # The car's own rules, for the joint plan: its price ceiling (as its own plan worked it out),
        # its earliest start and published prices only. They hold as far as the target allows.
        ceiling = vehicle.plan.ceiling
        begin = window_start(now, vehicle.earliest_start, vehicle.deadline)
        known_only = bool(vehicle.settings.get(SET_KNOWN_PRICES))

        def avoid(slot: PriceSlot) -> bool:
            return (
                (ceiling is not None and slot.price > ceiling + 1e-9)
                or slot.end <= begin
                or (known_only and slot.forecast)
            )

        never: Callable[[PriceSlot], bool] | None = None
        if (cap := vehicle.trip_cap) is not None:
            top = cap

            def never(slot: PriceSlot) -> bool:
                return slot.price > top + 1e-9

        return SharedCar(
            vehicle.vehicle_id,
            must_kwh=must,
            want_kwh=max(must, want),
            # A car whose current is set gets its full current (not what it was last measured at, which
            # may be what the guard turned it down to); one that is only switched takes what it takes.
            max_amps=self.full_amps(vehicle)
            if self.current_entity(vehicle)
            else min(MAX_AMPS, amps_for(power, self.phases)),
            deadline=deadline,
            priority=0 if vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST else 1,
            phases=self.phases,
            adjustable=self.current_entity(vehicle) is not None,
            avoid=avoid,
            never=never,
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
        slots = [
            slot
            for slot in self.household.price_slots(now, self.site.site_id if self.site else None)
            if slot.start < horizon
        ]
        cheap = cheap_hours(slots)
        # With the guard, the cars never get its margin: the plan leaves it out, so it is long enough.
        limit = self.limit - (HEADROOM_MARGIN if self.guard else 0.0)
        fallback = self.house_fallback(now)
        self.plan = plan_supply(
            slots, cars, now, limit=limit, house=lambda slot: self.house_at(slot, cheap, fallback), share=self.share
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
            # Short only when what is missing is worth saying: a percent of the battery, at least half a kWh
            # (not the rounding between the plan's slots and the car's own estimate).
            missing = self.plan.short_kwh.get(car.vehicle_id, 0.0)
            # The joint plan aims an hour before the ready-by time (BUFFER): what it leaves for that hour
            # still comes in time, at the car's full current, and is not "short".
            real = vehicle.deadline
            if real is not None and car.deadline is not None and real > car.deadline:
                missing -= kw(car.max_amps, car.phases) * elapsed(real, car.deadline).total_seconds() / 3600
            short = missing > max(0.5, vehicle.capacity / 100)
            # The joint plan reaches the target also where the car's own plan stopped at its price ceiling.
            held_back = vehicle.plan.limited or vehicle.plan.min_only
            end_soc = vehicle.target if held_back else vehicle.plan.end_soc
            if short:
                end_soc = min(end_soc, vehicle.target - missing / max(1.0, vehicle.capacity) * 100)
            vehicle.plan = replace(
                vehicle.plan,
                segments=self.plan.segments(car.vehicle_id),
                energy=round(energy, 3),
                cost=round(cost, 2),
                minutes=round(sum(elapsed(end, max(start, now)).total_seconds() for start, end, _amps in shares) / 60),
                short=short,
                end_soc=end_soc,
                limited=False,
                min_only=False,
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
        """The guard stopped this car, or there is no room on the supply to start it: it waits for room."""
        until = self._paused.get(vehicle.vehicle_id)
        if until is not None:
            room = self.room_for_cars(now)
            free = None if room is None else room - self.cars_amps()
            if not self.guard or (now >= until and (free is None or free >= MIN_AMPS)):
                del self._paused[vehicle.vehicle_id]
                return False
            return True
        waits = self.no_room_to_start(vehicle, now)
        if waits != (vehicle.vehicle_id in self._waiting):
            if waits:
                self._waiting.add(vehicle.vehicle_id)
            else:
                self._waiting.discard(vehicle.vehicle_id)
            self.household.events.add(now, "start_waits", vehicle=vehicle.name, waits=waits)
        return waits

    def no_room_to_start(self, vehicle: Vehicle, now: datetime) -> bool:
        """A car whose current is set, about to start, for which the meter has not shown the least a charger
        gives free (6 A) all the last while, with the others at their share: it is not started yet."""
        if not self.guard or self.household.is_charging(vehicle) or self._started(vehicle):
            return False
        found = self._start_shares(vehicle, now)
        return found is not None and found[1][-1] <= 0

    def room_to_start(self, vehicle: Vehicle, now: datetime) -> float | None:
        """What the car would start at, with the room shared evenly with the chargers that charge now."""
        found = self._start_shares(vehicle, now)
        return None if found is None else found[1][-1]

    def _start_shares(self, vehicle: Vehicle, now: datetime) -> tuple[list[Channel], list[float]] | None:
        """The chargers that charge now and the car about to start (last), with the share of each when it does."""
        if (raw := self.current_entity(vehicle)) is None:
            return None
        entity = self.knob(raw)
        channels = [channel for channel in self.channels(now) if channel.vehicle is not vehicle]
        peak = self.house_peak_within(now, self.headroom_window, channels)
        if peak is None:
            return None
        held = self._held_amps if self._held_until is not None else 0.0
        low, high = self.bounds(entity)
        high = max(low, min(high, float(round(self.full_amps(vehicle, raw)))))
        tier = 0 if vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST else 1
        new = Channel(entity, WHO_CAR, vehicle.name, vehicle, None, 0.0, high, low, high, high, True, tier)
        order = [*reversed(channels), new]  # the one to keep its current longest first, the new car last
        wants = [(channel.low, max(channel.low, channel.value)) for channel in order]
        shares = share_room(wants, self.limit - peak - held - HEADROOM_MARGIN, [channel.tier for channel in order])
        return order, shares

    async def async_before_start(self, vehicle: Vehicle, now: datetime) -> None:
        """Set the car's current to its share of the room before it is started (with the guard); the chargers
        that charge already go down to theirs first, so the room is shared evenly."""
        if not self.active or not self.guard or self.current_entity(vehicle) is None:
            return
        if self.household.is_charging(vehicle):
            return  # it charges already: the guard and the raises have it
        await self._async_unclamp(now, force=True)
        found = self._start_shares(vehicle, now)
        if found is None:
            return
        order, shares = found
        new = order[-1]
        assert new.entity is not None
        if self._easee_device(new.entity) is None and self.hass.states.get(new.entity) is None:
            return
        for channel, share in zip(order[:-1], shares[:-1], strict=True):
            if channel.entity is not None and 0 < share < channel.value - 0.5:
                await self._async_set(channel.entity, share, now, "share", channel.name, channel.who)
        target = max(new.low, shares[-1])
        value = self.setting(new.entity, now)
        if value is not None and abs(value - target) < 0.5:
            return
        await self._async_set(new.entity, target, now, "start", vehicle.name, WHO_CAR)

    async def async_before_guest_start(self, charger: Charger, now: datetime) -> None:
        """Set the guest's charger to what there is room for before it is switched on (with the guard)."""
        raw = charger.config.get(CONF_CURRENT_ENTITY)
        if not self.active or not self.guard or not raw:
            return
        entity = self.knob(str(raw))
        if self._easee_device(entity) is None and self.hass.states.get(entity) is None:
            return
        channels = self.channels(now)
        peak = self.house_peak_within(now, self.headroom_window, channels)
        if peak is None:
            return
        held = self._held_amps if self._held_until is not None else 0.0
        others = sum(channel.draw for channel in channels if channel.charger is not charger)
        low, high = self.bounds(entity)
        high = max(low, min(high, float(round(amps_for(charger.power, self.phases)))))
        target = max(low, min(high, float(int(self.limit - peak - held - HEADROOM_MARGIN - others))))
        value = self.setting(entity, now)
        if value is None or abs(value - target) >= 0.5:
            await self._async_set(entity, target, now, "start", charger.name, WHO_GUEST)

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

    def knob(self, entity: str) -> str:
        """What turns the current set up as ``entity``.

        A Zaptec charger's own "Charger max current" is a setting kept in the charger; Zaptec asks that the
        current is turned on its installation ("Available current"). When the charger is the only one of
        its installation, that is turned instead.
        """
        cached = self._knobs.get(entity)
        if cached is not None and elapsed(dt_util.utcnow(), cached[1]) < KNOB_KEPT:
            return cached[0]
        knob = self._find_knob(entity)
        self._knobs[entity] = (knob, dt_util.utcnow())
        return knob

    def _find_knob(self, entity: str) -> str:
        registry = er.async_get(self.hass)
        entry = registry.async_get(entity)
        if (
            entry is None
            or entry.platform != "zaptec"
            or not str(entry.unique_id).endswith("_charger_max_current")
            or entry.device_id is None
        ):
            return entity
        devices = dr.async_get(self.hass)
        device = devices.async_get(entry.device_id)
        installation = device.via_device_id if device is not None else None
        if installation is None:
            return entity
        if sum(1 for other in devices.devices.values() if other.via_device_id == installation) != 1:
            return entity  # its installation has more chargers: it is turned on its own
        for item in er.async_entries_for_device(registry, installation):
            if (
                item.domain == "number"
                and item.platform == "zaptec"
                and str(item.unique_id).endswith("_available_current")
                and item.disabled_by is None
                and self.hass.states.get(item.entity_id) is not None
            ):
                return item.entity_id
        return entity

    def bounds(self, entity: str) -> tuple[float, float]:
        """The least and the most a car's current is set to.

        Never under 6 A, whatever the number allows (a Zaptec Go 2 goes down to 0): below that a car
        does not charge at all, so the guard pauses it instead.
        """
        state = self.hass.states.get(entity)
        low = to_float(state.attributes.get("min")) if state is not None else None
        high = to_float(state.attributes.get("max")) if state is not None else None
        return max(MIN_AMPS, low or 0.0), (MAX_AMPS if high is None else max(MIN_AMPS, high))

    def setting(self, entity: str, now: datetime) -> float | None:
        """What the current behind ``entity`` is set to: what EV Planner set, while the charger catches up.

        A charger's cloud shows the value it had for a while after a change. One that shows another value
        for longer, and steadily, was set by someone else: that is what it is from then on.
        """
        shown = to_float(self.household.state_of(entity))
        mine = self._sent.get(entity)
        if mine is None:
            return shown
        value, at = mine
        if shown is None or abs(shown - value) < 0.5 or elapsed(now, at) < ECHO:
            return value
        state = self.hass.states.get(entity)
        if state is not None and elapsed(now, state.last_changed) < ECHO:
            return value
        self._sent[entity] = (shown, now)
        self.household.events.add(now, "current_outside", entity=entity, amps=shown, before=value)
        return shown

    async def _async_set(
        self, entity: str, value: float, now: datetime, why: str, name: str | None = None, who: str | None = None
    ) -> bool:
        """Set a charger's current: through Easee's own action, or the number's ``set_value``."""
        if (device := self._easee_device(entity)) is not None:
            service = ("easee", "set_charger_dynamic_limit")
            data: dict[str, Any] = {"device_id": device, "current": value, "time_to_live": EASEE_TTL_MINUTES}
        else:
            service = (entity.split(".", 1)[0], "set_value")
            data = {"entity_id": entity, "value": value}
        before = self._sent.get(entity)
        error: str | None = None
        try:
            async with asyncio.timeout(COMMAND_TIMEOUT):
                await self.hass.services.async_call(*service, data, blocking=True)
        except TimeoutError:
            error = "timeout"
        except Exception as err:  # whatever the charger's or car's integration raises
            error = str(err) or type(err).__name__
        if error is None:
            self._sent[entity] = (value, now)
            if who == WHO_CAR:
                # The plan works out again when the car is done at what it gets now.
                self.household.schedule_recalculate()
        else:
            _LOGGER.warning("Could not set %s to %s A: %s", entity, value, error)
        self.household.events.add(
            now,
            "current",
            vehicle=name,
            who=who,
            site=self.site.site_id if self.site else None,
            entity=entity,
            amps=value,
            before=before[0] if before else to_float(self.household.state_of(entity)),
            why=why,
            reading=self._meter_reading(),
            error=error,
        )
        return error is None

    async def async_set_current(self, vehicle: Vehicle, entity: str, value: float, now: datetime) -> bool:
        """Set the car's current (the sun's share, or its full current after the sun)."""
        return await self._async_set(self.knob(entity), value, now, "set", vehicle.name, WHO_CAR)

    async def async_keep_current(self, vehicle: Vehicle, entity: str, value: float, now: datetime) -> bool:
        """Set the car's current only when it is not there already (an Easee limit is renewed before it runs out)."""
        knob = self.knob(entity)
        last = self._sent.get(knob)
        if self._easee_device(knob) is not None:
            if last is not None and abs(last[0] - value) < 0.5 and elapsed(now, last[1]) < EASEE_RENEW:
                return True
        elif (shown := self.setting(knob, now)) is not None and abs(shown - value) < 0.5:
            if last is None or abs(last[0] - value) >= 0.5:
                self._sent[knob] = (value, now)
            return True
        return await self._async_set(knob, value, now, "set", vehicle.name, WHO_CAR)

    def plan_amps(self, vehicle: Vehicle, now: datetime) -> float | None:
        """The car's share in the joint plan now (None without a plan or a share)."""
        return self.plan.amps_at(vehicle.vehicle_id, now) if self.plan is not None else None

    async def async_apply(self, now: datetime) -> None:
        """Give each charger the current it is to have: the plan's share, or its full current, as far as there
        is room. Up only as often as the charger allows, and only into what has been free all that time;
        down at once when the plan wants less. The guard turns them down when the house needs more."""
        if not self.active:
            return
        channels = self.channels(now)
        if not self.guard:
            for channel in channels:
                if channel.entity is None or channel.who != WHO_CAR or channel.planned is None:
                    continue
                await self._async_toward(channel, channel.planned, now)
            await self._async_rest(channels, now)
            return
        reading = self._meter_reading()
        if reading is None:
            await self._async_blind(channels, now)
            return
        await self._async_rest(channels, now)
        if reading > self.limit or self._over_since is not None:
            return  # the guard is on it
        await self._async_adjust(channels, now)

    async def _async_toward(self, channel: Channel, target: float, now: datetime) -> None:
        """Without a meter to go by: down at once, up as often as the charger allows."""
        assert channel.entity is not None
        last = self._sent.get(channel.entity)
        if not channel.known or target < channel.value - 0.5:
            await self._async_set(channel.entity, target, now, "plan", channel.name, channel.who)
        elif target > channel.value + 0.5:
            if last is None or elapsed(now, last[1]) >= self._raise_every(channel.entity):
                await self._async_set(channel.entity, target, now, "plan", channel.name, channel.who)
        elif self._easee_device(channel.entity) is not None and (last is None or elapsed(now, last[1]) >= EASEE_RENEW):
            await self._async_set(channel.entity, target, now, "renew", channel.name, channel.who)

    def _changed_at(self, entity: str) -> datetime | None:
        """When the current behind ``entity`` last changed: set by EV Planner, or seen to change (its app)."""
        last = self._sent.get(entity)
        state = self.hass.states.get(entity)
        moments = [moment for moment in (last[1] if last else None, state.last_changed if state else None) if moment]
        return max(moments) if moments else None

    async def _async_adjust(self, channels: list[Channel], now: datetime) -> None:
        """With the meter and no overload: the chargers up into the room there has been all the time since each
        last changed.

        Up at most as often as the charger allows (a Zaptec every 15 minutes), and only when the house has left
        the room all the place's wait after a peak. A car that would not be ready in time otherwise waits only
        the charger's own time. Straight to its share, not a step at a time: the room is shared evenly, a car set
        to come first before the others.
        """
        held = self._held_amps if self._held_until is not None else 0.0
        windows: dict[str, timedelta] = {}
        for channel in channels:
            if channel.entity is None or channel.want is None:
                continue
            last = self._sent.get(channel.entity)
            every = self._raise_every(channel.entity)
            changed = self._changed_at(channel.entity)
            if channel.want > channel.value + 0.5:
                if changed is None or elapsed(now, changed) >= every:
                    windows[channel.entity] = every if self._behind(channel) else max(every, self.headroom_window)
            elif self._easee_device(channel.entity) is not None and (
                last is None or elapsed(now, last[1]) >= EASEE_RENEW
            ):
                await self._async_set(channel.entity, channel.value, now, "renew", channel.name, channel.who)
        order = list(reversed(channels))
        for window in sorted(set(windows.values())):
            peak = self.house_peak_within(now, window, channels)
            if peak is None:
                return
            room = self.limit - peak - held - HEADROOM_MARGIN
            wants = [
                (
                    channel.low,
                    max(
                        channel.low,
                        channel.want
                        if channel.entity and windows.get(channel.entity) == window and channel.want
                        else channel.value,
                    ),
                )
                for channel in order
            ]
            shares = share_room(wants, room, [channel.tier for channel in order])
            for channel, share in zip(order, shares, strict=True):
                if channel.entity and windows.get(channel.entity) == window and share >= channel.value + 1:
                    await self._async_set(channel.entity, share, now, "raise", channel.name, channel.who)
                    channel.value = share

    def _settings_here(self) -> list[tuple[str, float, Charger | None, Vehicle | None]]:
        """The chargers' current settings at this place: each charger's, and a car's that is a charger's
        (a Zaptec's) rather than the car's own (which would wake the car). With what the charger gives (kW)."""
        out: list[tuple[str, float, Charger | None, Vehicle | None]] = []
        seen: set[str] = set()
        for charger in self.household.chargers.values():
            raw = charger.config.get(CONF_CURRENT_ENTITY)
            if raw and self.household.pairing.site_of(charger) is self.site and str(raw) not in seen:
                seen.add(str(raw))
                out.append((str(raw), charger.power, charger, None))
        for vehicle in self.cars():
            raw = vehicle.config.get(CONF_CURRENT_ENTITY)
            if not raw or str(raw) in seen:
                continue
            entry = er.async_get(self.hass).async_get(str(raw))
            if entry is None or entry.platform != "zaptec":
                continue
            seen.add(str(raw))
            charger = self.household.chargers.get(vehicle.charger_id or "")
            rated = vehicle.configured_power if charger is None else min(vehicle.configured_power, charger.power)
            out.append((str(raw), rated, charger, vehicle))
        return out

    async def _async_rest(self, channels: list[Channel], now: datetime) -> None:
        """A charger nothing charges at (unplugged, or done) is set to its full current, once: a car plugged in
        while Home Assistant is away charges at all the charger gives, not at what it was left at. Not one the
        guard has stopped for a while: that starts again at what there is room for."""
        active = {channel.entity for channel in channels if channel.entity}
        waiting = {vehicle.charger_id for vehicle in self.cars() if vehicle.vehicle_id in self._paused}
        guest = self.household.guest
        if guest.house_hold is not None and now < guest.house_hold and guest.charger is not None:
            waiting.add(guest.charger.charger_id)
        for raw, rated, charger, vehicle in self._settings_here():
            if charger is not None and charger.charger_id in waiting:
                continue
            if vehicle is not None and (vehicle.vehicle_id in self._paused or vehicle.charger_id in waiting):
                continue
            entity = self.knob(raw)
            if entity in active or self._easee_device(entity) is not None or self.hass.states.get(entity) is None:
                continue  # an Easee limit runs out by itself
            power = self.household.charger_power(charger) if charger is not None else None
            if power is not None and power > 0.5:
                continue
            low, high = self.bounds(entity)
            full = max(low, min(high, float(round(amps_for(rated, self.phases)))))
            value = self.setting(entity, now)
            if value is not None and value >= full - 0.5:
                continue
            last = self._sent.get(entity)
            if last is not None and abs(last[0] - full) < 0.5:
                continue  # sent already: the charger has not caught up
            await self._async_set(entity, full, now, "rest", charger.name, None)

    def _behind(self, channel: Channel) -> bool:
        """The car would not be ready in time at what it gets now: it is short in the plan."""
        vehicle = channel.vehicle
        return vehicle is not None and vehicle.plan is not None and bool(vehicle.plan.short)

    async def _async_blind(self, channels: list[Channel], now: datetime) -> None:
        """No meter reading: every charger at the least it gives, until the meter is back."""
        self._blind_at = now
        for channel in channels:
            if channel.entity is not None and channel.value > channel.low + 0.5:
                await self._async_set(channel.entity, channel.low, now, "blind", channel.name, channel.who)

    async def _async_unclamp(self, now: datetime, force: bool = False) -> None:
        """A Zaptec charger whose installation EV Planner turns: its own setting back to full, when it was
        left lower (by EV Planner before, or by hand) and nothing charges there."""
        for raw, rated, charger, _vehicle in self._settings_here():
            if self.knob(raw) == raw:
                continue
            power = self.household.charger_power(charger) if charger is not None else None
            if power is not None and power > 0.5 and not force:
                continue
            last = self._unclamped.get(raw)
            if last is not None and elapsed(now, last) < UNCLAMP_EVERY:
                continue
            low, high = self.bounds(raw)
            full = max(low, min(high, float(round(amps_for(rated, self.phases)))))
            shown = to_float(self.household.state_of(raw))
            if shown is None or shown >= full - 0.5:
                continue
            self._unclamped[raw] = now
            try:
                async with asyncio.timeout(COMMAND_TIMEOUT):
                    await self.hass.services.async_call(
                        raw.split(".", 1)[0], "set_value", {"entity_id": raw, "value": full}, blocking=True
                    )
            except Exception as err:  # a timeout, or whatever the charger's integration raises
                _LOGGER.debug("Could not set %s back to %s A: %s", raw, full, err)
                continue
            self.household.events.add(now, "current_unclamp", entity=raw, amps=full, before=shown)

    async def async_idle(self, now: datetime) -> None:
        """A charger with nothing charging at it goes to its full current (once); the next start sets what there
        is room for then. A Zaptec charger's own setting, now that its installation is turned, is full too."""
        if self.active:
            await self._async_rest(self.channels(now), now)
            await self._async_unclamp(now)

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
        if self._confirm_unsub is not None:
            self._confirm_unsub()
            self._confirm_unsub = None
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

    def _confirm_later(self) -> None:
        """Look at the meter again when a small overload has had its time to pass."""
        if self._confirm_unsub is not None:
            self._confirm_unsub()

        @callback
        def _again(_now: datetime) -> None:
            self._confirm_unsub = None
            self._handle_meter(None)

        self._confirm_unsub = async_call_later(self.hass, GUARD_CONFIRM.total_seconds() + 1, _again)

    async def _async_guard_runs(self) -> None:
        try:
            while True:
                self._guard_again = False
                await self.async_guard(dt_util.now())
                if not self._guard_again:
                    return
        finally:
            self._guard_running = False

    async def async_guard(self, now: datetime) -> None:
        """When the house and the chargers draw more than the limit, turn the chargers down at once.

        Each to what there is room for now: the limit, less what the house draws without the chargers
        (the meter less what the chargers measure, or are set to), less a margin; shared so the one to keep
        its current longest keeps the most (another's or a guest's charger, then a car of the household that
        comes first or has the earliest ready-by time). None under the least a charger gives (6 A): a
        charger there is no room for at all is stopped, after the heat pump is held back. Without a meter
        reading, every charger goes to the least. The raises come later (``async_apply``).
        """
        if not self.guard:
            return
        reading = self._meter_reading()
        channels = self.channels(now)
        if reading is None:
            if not self._blind:
                self.household.events.add(now, "guard", site=self.site.site_id if self.site else None, reading=None)
            self._blind = True
            await self._async_blind(channels, now)
            return
        self._blind = False
        self.note_house(now, channels)
        if not channels:
            self._over_since = None
            return
        self._cuts = [(at, amps) for at, amps in self._cuts if elapsed(now, at) < GUARD_SETTLE]
        over = reading - self.limit - sum(amps for _at, amps in self._cuts)
        if over <= 0:
            self._over_since = None
            if reading <= self.limit:
                await self._async_adjust(channels, now)
            return
        if reading <= self.limit * (1 + GUARD_SMALL):
            # A small overload: cut only when it lasts (the meter is looked at again when the time is up).
            if self._over_since is None:
                self._over_since = now
                self._confirm_later()
            if elapsed(now, self._over_since) < GUARD_CONFIRM:
                return
        self._over_since = None
        house = self.house_now(channels)
        assert house is not None
        room = self.limit - house - HEADROOM_MARGIN
        self.household.events.add(
            now,
            "guard",
            site=self.site.site_id if self.site else None,
            reading=reading,
            limit=self.limit,
            over=round(over, 2),
            house=round(house, 2),
            room=round(room, 2),
            chargers=[
                {"name": channel.name, "who": channel.who, "draw": round(channel.draw, 1), "set": channel.value}
                for channel in channels
            ],
        )
        order = list(reversed(channels))  # the one to keep its current longest first
        wants = [(channel.low, max(channel.low, channel.value)) for channel in order]
        tiers = [channel.tier for channel in order]
        shares = share_room(wants, room, tiers)
        if any(share <= 0 for share in shares) and (freed := await self._async_hold_heat_pump(now)) > 0:
            self._cuts.append((now, freed))
            room += freed
            shares = share_room(wants, room, tiers)
        given = dict(zip((id(channel) for channel in order), shares, strict=True))
        for channel in channels:  # the one to be turned down first first
            share = given[id(channel)]
            if share > 0:
                if share < channel.value - 0.5:
                    await self._async_cut(channel, share, now)
                continue
            await self._async_stop(channel, now)

    async def _async_cut(self, channel: Channel, value: float, now: datetime) -> None:
        """Turn a charger down; until the meter has caught up, it counts at what it drew."""
        if channel.entity is None:
            return
        if await self._async_set(channel.entity, value, now, "cut", channel.name, channel.who):
            self._cut_draw[channel.entity] = (channel.draw, now)
            self._cuts.append((now, max(0.0, channel.draw - value)))
            self.guard_events += 1

    async def _async_stop(self, channel: Channel, now: datetime) -> None:
        """No room for even the least: the guest's charger or the car is stopped for a while; a charger
        EV Planner cannot stop goes to its least."""
        if channel.value > channel.low + 0.5:
            await self._async_cut(channel, channel.low, now)
        if channel.who == WHO_GUEST and channel.charger is not None:
            await self._async_pause_guest(channel.charger, channel.draw, now)
            return
        vehicle = channel.vehicle
        if vehicle is None or self.household.control_entity(vehicle) is None:
            return
        if not await self.household.async_pause_for_house(vehicle):
            # It did not stop: not counted as done, and the next reading tries again.
            return
        self._paused[vehicle.vehicle_id] = now + GUARD_PAUSE
        self._cuts.append((now, min(channel.draw, channel.low) if channel.entity else channel.draw))
        self.guard_events += 1

    # ------------------------------------------------------------------
    # The guard and the guest

    def _guest_charger(self, now: datetime) -> Charger | None:
        """The charger at this place the guest charges at now (None when no guest does)."""
        guest = self.household.guest
        charger = guest.charger
        if charger is None or self.household.pairing.site_of(charger) is not self.site or not guest.wants_charge(now):
            return None
        if guest.house_hold is not None and now < guest.house_hold:
            return None  # paused for the house already
        return charger

    async def _async_pause_guest(self, charger: Charger, amps: float, now: datetime) -> float:
        """Stop the guest's charging for a while, when its charger has a switch. Returns the amps freed."""
        if not charger.switch_entity:
            return 0.0
        guest = self.household.guest
        guest.house_hold = now + GUARD_PAUSE
        await self.household._async_apply_guest(now)
        stopped = charger.guest_last_sent == CONTROL_PAUSE
        self.household.events.add(now, "guard_pause", vehicle="guest", stopped=stopped)
        if not stopped:
            guest.house_hold = None
            return 0.0
        self._cuts.append((now, amps))
        self.guard_events += 1
        self.household.async_update_listeners()
        return amps

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
            "short": {vid: kwh for vid, kwh in plan.short_kwh.items() if kwh > 0.5} if plan else {},
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
