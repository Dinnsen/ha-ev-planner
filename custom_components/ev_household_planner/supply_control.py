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
    CONF_CURRENT_ENTITY,
    CONF_SUPPLY_GUARD,
    CONF_SUPPLY_LIMIT,
    CONF_SUPPLY_METER,
    CONF_SUPPLY_PHASES,
    CONF_SUPPLY_RESERVE,
    DEFAULT_SUPPLY_RESERVE,
    PRIORITY_FIRST,
    SET_MUST_SOC,
    SET_PRIORITY,
)
from .planner import PlanError, PriceSlot, charge_need, price_at
from .supply import BUFFER, MIN_AMPS, HouseForecast, SharedCar, SupplyPlan, amps_for, cheap_hours, kw, plan_supply
from .vehicle import elapsed, to_float

if TYPE_CHECKING:
    from .household import Household
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

MAX_AMPS = 32.0
# A car's current is changed at most this often, except to lower it.
CURRENT_EVERY = timedelta(minutes=5)
# Easee: a current set through its cloud falls back by itself after this long, so a car is
# not left at a low current if Home Assistant stops; it is sent again before that.
EASEE_TTL_MINUTES = 30
EASEE_RENEW = timedelta(minutes=15)
# The guard: after it has lowered a car, the plan may raise it again after this long.
GUARD_HOLD = timedelta(minutes=2)
# A cut the guard has sent counts as done for this long, while the charger and the meter catch up.
GUARD_SETTLE = timedelta(seconds=60)
# A car the guard had to stop waits at least this long, then until the meter shows room for it.
GUARD_PAUSE = timedelta(minutes=5)
# The plan raises a car the guard watches only into what the meter shows is free, less this.
HEADROOM_MARGIN = 1.0


class SupplyControl:
    """The shared supply of one household."""

    def __init__(self, household: Household) -> None:
        self.household = household
        self.forecast = HouseForecast()
        self.plan: SupplyPlan | None = None
        self._hour: datetime | None = None
        self._readings: list[float] = []
        self._sent: dict[str, tuple[float, datetime]] = {}
        self._held: dict[str, datetime] = {}
        self._cuts: list[tuple[datetime, float]] = []
        self._paused: dict[str, datetime] = {}
        self._unsub: CALLBACK_TYPE | None = None
        self.guard_events = 0

    @property
    def hass(self) -> HomeAssistant:
        return self.household.hass

    # ------------------------------------------------------------------
    # Settings

    @property
    def limit(self) -> float:
        return to_float(self.household.config.get(CONF_SUPPLY_LIMIT)) or 0.0

    @property
    def active(self) -> bool:
        return self.limit > 0

    @property
    def phases(self) -> int:
        return 1 if str(self.household.config.get(CONF_SUPPLY_PHASES) or "3") == "1" else 3

    @property
    def meters(self) -> list[str]:
        value = self.household.config.get(CONF_SUPPLY_METER) or []
        return [str(entity) for entity in (value if isinstance(value, list) else [value]) if entity]

    @property
    def guard(self) -> bool:
        """The guard is on, and has a meter to watch."""
        return self.active and bool(self.household.config.get(CONF_SUPPLY_GUARD)) and bool(self.meters)

    @property
    def reserve(self) -> float:
        value = to_float(self.household.config.get(CONF_SUPPLY_RESERVE))
        return DEFAULT_SUPPLY_RESERVE if value is None else max(0.0, value)

    def current_entity(self, vehicle: Vehicle) -> str | None:
        """The number that sets the car's charging current: on the car, else on its charger."""
        entity = vehicle.config.get(CONF_CURRENT_ENTITY)
        if not entity and vehicle.charger_id and (charger := self.household.chargers.get(vehicle.charger_id)):
            entity = charger.config.get(CONF_CURRENT_ENTITY)
        return str(entity) if entity else None

    # ------------------------------------------------------------------
    # The house

    def cars_amps(self) -> float:
        """What the cars charging now draw per phase, from their power readings or the plan."""
        total = 0.0
        for vehicle in self.household.vehicles.values():
            if not self.household.is_charging(vehicle):
                continue
            reading = self.household.power_reading(vehicle)
            if reading is None:
                reading = (
                    kw(self.plan.amps_at(vehicle.vehicle_id, self._now()) or 0.0, self.phases) if self.plan else 0.0
                )
            total += amps_for(reading, self.phases)
        return total

    def house_now(self) -> float | None:
        """The house's current on its busiest phase, without the cars (None without a meter)."""
        values = [to_float(self.household.state_of(entity)) for entity in self.meters]
        readings = [value for value in values if value is not None]
        if not readings:
            return None
        return max(0.0, max(readings) - self.cars_amps())

    def sample(self, now: datetime) -> bool:
        """A minute of the house; at the end of each hour, the hour goes into the forecast. True when saved."""
        if not self.active:
            return False
        hour = now.replace(minute=0, second=0, microsecond=0)
        saved = False
        if self._hour is not None and hour != self._hour and self._readings:
            slots = self.household.price_slots(self._hour)
            cheap = any(start == self._hour for start in cheap_hours(slots))
            self.forecast.add(self._hour.hour, cheap, sum(self._readings) / len(self._readings))
            self._readings = []
            saved = True
        self._hour = hour
        if (amps := self.house_now()) is not None:
            self._readings.append(amps)
        return saved

    def house_at(self, slot: PriceSlot, cheap: set[datetime]) -> float:
        return self.forecast.predict(slot.start.hour, slot.start in cheap, self.reserve)

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
        cars = [car for vehicle in self.household.vehicles.values() if (car := self.shared_car(vehicle, now))]
        if not cars:
            self.plan = None
            return
        deadlines = [car.deadline for car in cars if car.deadline is not None]
        horizon = max(deadlines) if len(deadlines) == len(cars) else now + timedelta(hours=24)
        slots = [slot for slot in self.household.price_slots(now) if slot.start < horizon]
        cheap = cheap_hours(slots)
        self.plan = plan_supply(slots, cars, now, limit=self.limit, house=lambda slot: self.house_at(slot, cheap))
        for car in cars:
            vehicle = self.household.vehicles[car.vehicle_id]
            if vehicle.plan is None:
                continue
            shares = self.plan.amps.get(car.vehicle_id, [])
            energy = sum(
                kw(amps, car.phases) * (end - max(start, now)).total_seconds() / 3600 for start, end, amps in shares
            )
            cost = sum(
                kw(amps, car.phases) * (end - max(start, now)).total_seconds() / 3600 * (price_at(slots, start) or 0.0)
                for start, end, amps in shares
            )
            vehicle.plan = replace(
                vehicle.plan,
                segments=self.plan.segments(car.vehicle_id),
                energy=round(energy, 3),
                cost=round(cost, 2),
                minutes=round(sum((end - max(start, now)).total_seconds() for start, end, _amps in shares) / 60),
                short=self.plan.short_kwh.get(car.vehicle_id, 0.0) > 0.1,
            )

    # ------------------------------------------------------------------
    # The current

    def _meter_reading(self) -> float | None:
        """The busiest phase as the meter shows it, the cars included (None without a reading)."""
        values = [to_float(self.household.state_of(entity)) for entity in self.meters]
        readings = [value for value in values if value is not None]
        return max(readings) if readings else None

    def holds_off(self, vehicle: Vehicle, now: datetime) -> bool:
        """The guard stopped this car: it waits, then until the meter shows room for it."""
        until = self._paused.get(vehicle.vehicle_id)
        if until is None:
            return False
        reading = self._meter_reading()
        if not self.guard or (now >= until and (reading is None or self.limit - reading >= MIN_AMPS + HEADROOM_MARGIN)):
            del self._paused[vehicle.vehicle_id]
            self._sent.pop(vehicle.vehicle_id, None)
            return False
        return True

    def _easee_device(self, entity: str) -> str | None:
        """The Easee charger behind ``entity``, when it belongs to the Easee integration."""
        entry = er.async_get(self.hass).async_get(entity)
        if entry is None or entry.platform != "easee":
            return None
        return entry.device_id

    def bounds(self, entity: str) -> tuple[float, float]:
        state = self.hass.states.get(entity)
        low = to_float(state.attributes.get("min")) if state is not None else None
        high = to_float(state.attributes.get("max")) if state is not None else None
        return (6.0 if low is None else low), (MAX_AMPS if high is None else high)

    async def async_set_current(self, vehicle: Vehicle, entity: str, value: float, now: datetime) -> bool:
        """Set the car's current: through Easee's own action, or the number's ``set_value``."""
        if (device := self._easee_device(entity)) is not None:
            service = ("easee", "set_charger_dynamic_limit")
            data: dict[str, Any] = {"device_id": device, "current": value, "time_to_live": EASEE_TTL_MINUTES}
        else:
            service = (entity.split(".", 1)[0], "set_value")
            data = {"entity_id": entity, "value": value}
        try:
            await self.hass.services.async_call(*service, data, blocking=True)
        except HomeAssistantError as err:
            _LOGGER.warning("Could not set %s to %s A: %s", entity, value, err)
            return False
        self._sent[vehicle.vehicle_id] = (value, now)
        return True

    def plan_amps(self, vehicle: Vehicle, now: datetime) -> float | None:
        """The car's share in the joint plan now (None without a plan or a share)."""
        return self.plan.amps_at(vehicle.vehicle_id, now) if self.plan is not None else None

    async def async_apply(self, now: datetime) -> None:
        """Tell each car with a current setting how many amps its share is now."""
        if self.plan is None:
            return
        for vehicle in self.household.vehicles.values():
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
                # Up only into what the meter shows is free now.
                reading = self._meter_reading()
                room = 0.0 if reading is None else self.limit - reading - HEADROOM_MARGIN
                value = min(value, float(int(last[0] + max(0.0, room))))
                if value < last[0] + 1:
                    continue
            renew = easee and last is not None and elapsed(now, last[1]) >= EASEE_RENEW
            if (
                last is not None
                and not renew
                and (abs(last[0] - value) < 1 or (value > last[0] and elapsed(now, last[1]) < CURRENT_EVERY))
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
        """Watch the meter, for the guard."""
        if self.guard and self._unsub is None:
            self._unsub = async_track_state_change_event(self.hass, self.meters, self._handle_meter)

    @callback
    def async_stop(self) -> None:
        if self._unsub is not None:
            self._unsub()
            self._unsub = None

    @callback
    def _handle_meter(self, _event: Event[EventStateChangedData]) -> None:
        self.household.config_entry.async_create_task(self.hass, self.async_guard(dt_util.now()), "ev planner guard")

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
        charging = sorted(
            (
                vehicle
                for vehicle in self.household.vehicles.values()
                if self.household.is_charging(vehicle) and vehicle.vehicle_id not in self._paused
            ),
            key=lambda vehicle: (
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
        # Every car at the least it can take, and still too much: stop the last in line.
        for vehicle in charging:
            if self.household.control_entity(vehicle) is None:
                continue
            entity = self.current_entity(vehicle)
            power = self.household.power_reading(vehicle)
            if entity is not None:
                amps = self._current_now(vehicle, entity, MAX_AMPS)
            else:
                amps = amps_for(power, self.phases) if power else MIN_AMPS
            self._paused[vehicle.vehicle_id] = now + GUARD_PAUSE
            self._cuts.append((now, amps))
            self.guard_events += 1
            await self.household.async_pause_for_house(vehicle)
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
        }

    def cars_now(self) -> dict[str, float]:
        """What each car charging now draws per phase, from its power reading (for the energy flow)."""
        out: dict[str, float] = {}
        for vehicle in self.household.vehicles.values():
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

    def to_store(self) -> dict[str, list[float]]:
        return self.forecast.to_dict()

    def load(self, data: Any) -> None:
        self.forecast = HouseForecast.from_dict(data)

    def _now(self) -> datetime:
        from homeassistant.util import dt as dt_util

        return dt_util.now()
