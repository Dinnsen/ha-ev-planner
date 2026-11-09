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

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .const import (
    CONF_CURRENT_ENTITY,
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
from .supply import BUFFER, HouseForecast, SharedCar, SupplyPlan, amps_for, cheap_hours, kw, plan_supply
from .vehicle import elapsed, to_float

if TYPE_CHECKING:
    from .household import Household
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

MAX_AMPS = 32.0
# A car's current is changed at most this often, except to lower it.
CURRENT_EVERY = timedelta(minutes=5)


class SupplyControl:
    """The shared supply of one household."""

    def __init__(self, household: Household) -> None:
        self.household = household
        self.forecast = HouseForecast()
        self.plan: SupplyPlan | None = None
        self._hour: datetime | None = None
        self._readings: list[float] = []
        self._sent: dict[str, tuple[float, datetime]] = {}

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

    async def async_apply(self, now: datetime) -> None:
        """Tell each car with a current setting how many amps its share is now."""
        if self.plan is None:
            return
        for vehicle in self.household.vehicles.values():
            entity = self.current_entity(vehicle)
            amps = self.plan.amps_at(vehicle.vehicle_id, now)
            if entity is None or amps is None or amps <= 0:
                continue
            state = self.hass.states.get(entity)
            if state is None:
                continue
            low = to_float(state.attributes.get("min"))
            high = to_float(state.attributes.get("max"))
            value = float(round(amps))
            if high is not None:
                value = min(value, high)
            if low is not None:
                value = max(value, low)
            last = self._sent.get(vehicle.vehicle_id)
            if last is not None and (
                abs(last[0] - value) < 1 or (value > last[0] and elapsed(now, last[1]) < CURRENT_EVERY)
            ):
                continue
            if to_float(state.state) == value:
                self._sent[vehicle.vehicle_id] = (value, now)
                continue
            try:
                await self.hass.services.async_call(
                    entity.split(".", 1)[0], "set_value", {"entity_id": entity, "value": value}, blocking=True
                )
            except HomeAssistantError as err:
                _LOGGER.warning("Could not set %s to %s A: %s", entity, value, err)
                continue
            self._sent[vehicle.vehicle_id] = (value, now)

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
        }

    def vehicle_amps(self, vehicle_id: str, now: datetime) -> float | None:
        return self.plan.amps_at(vehicle_id, now) if self.plan else None

    def to_store(self) -> dict[str, list[float]]:
        return self.forecast.to_dict()

    def load(self, data: Any) -> None:
        self.forecast = HouseForecast.from_dict(data)

    def _now(self) -> datetime:
        from homeassistant.util import dt as dt_util

        return dt_util.now()
