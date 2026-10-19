"""Binary sensors for EV Planner."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .entity import GuestEntity, VehicleEntity
from .guest import serialize_segments
from .household import EVPlannerConfigEntry, Household
from .rules import current_price

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    household = entry.runtime_data
    for vehicle_id in household.vehicles:
        async_add_entities(
            [VehicleChargeNow(household, vehicle_id), VehicleProblem(household, vehicle_id)],
            config_subentry_id=vehicle_id,
        )
    async_add_entities([GuestChargeNow(household), GuestBehindPlan(household)])


class VehicleChargeNow(VehicleEntity, BinarySensorEntity):
    """On when the car should charge now. Its attributes match EV Smart Charging's, for graphs."""

    _attr_device_class = BinarySensorDeviceClass.BATTERY_CHARGING
    _unrecorded_attributes = frozenset({"raw_two_days", "charging_schedule", "charging_segments"})

    def __init__(self, household: Household, vehicle_id: str) -> None:
        super().__init__(household, vehicle_id, "charge_now")

    @property
    def is_on(self) -> bool:
        return self.vehicle.charge_now

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        vehicle = self.vehicle
        now = dt_util.now()
        raw, schedule = self.coordinator.schedule_for(vehicle, now)
        plan = vehicle.plan
        return {
            "reason": vehicle.decision.reason,
            # The same attributes as EV Smart Charging's charging sensor, so
            # dashboards and automations made for it keep working.
            "current_price": current_price(self.coordinator.price_slots(now), now),
            "ev_soc": vehicle.current_soc,
            "ev_target_soc": vehicle.target,
            "charging_number_of_hours": round(plan.minutes / 60, 2) if plan and plan.segments else 0,
            "opportunistic": bool(plan and plan.opportunistic),
            "charging_is_planned": bool(plan and plan.segments),
            "charging_start_time": plan.start.isoformat() if plan and plan.start else None,
            "charging_stop_time": plan.end.isoformat() if plan and plan.end else None,
            "charging_segments": serialize_segments(plan.segments) if plan else [],
            "raw_two_days": raw,
            "charging_schedule": schedule,
        }


class VehicleProblem(VehicleEntity, BinarySensorEntity):
    """On when the car should charge but does not, even after one more try."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    def __init__(self, household: Household, vehicle_id: str) -> None:
        super().__init__(household, vehicle_id, "charging_problem")

    @property
    def is_on(self) -> bool:
        return self.vehicle.problem

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"control_error": self.vehicle.control_error}


class GuestChargeNow(GuestEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.BATTERY_CHARGING

    def __init__(self, household: Household) -> None:
        super().__init__(household, "guest_charge_now")

    @property
    def is_on(self) -> bool:
        return self.guest.is_charge_now()


class GuestBehindPlan(GuestEntity, BinarySensorEntity):
    """With an energy meter: on when the guest car takes clearly less energy than planned."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    def __init__(self, household: Household) -> None:
        super().__init__(household, "guest_behind_plan")

    @property
    def available(self) -> bool:
        return super().available and self.guest.energy_entity is not None

    @property
    def is_on(self) -> bool | None:
        progress = self.guest.progress()
        return None if progress is None else bool(progress.behind_plan)
