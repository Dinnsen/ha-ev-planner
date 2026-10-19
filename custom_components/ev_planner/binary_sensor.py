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

    def __init__(self, household: Household, vehicle_id: str) -> None:
        super().__init__(household, vehicle_id, "charge_now")

    @property
    def is_on(self) -> bool:
        return self.vehicle.charge_now

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        vehicle = self.vehicle
        raw, schedule = self.coordinator.schedule_for(vehicle, dt_util.now())
        plan = vehicle.plan
        return {
            "reason": vehicle.decision.reason,
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
