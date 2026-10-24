"""Sensors for EV Planner: each car's plan and status, the guest, and the chargers."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.const import PERCENTAGE, EntityCategory, UnitOfEnergy, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.typing import StateType
from homeassistant.util import dt as dt_util

from .const import CONTROL_OPTIONS, GUEST_STATUS_OPTIONS, VEHICLE_STATUS_OPTIONS
from .entity import ChargerEntity, GuestEntity, VehicleEntity
from .guest import GuestSession, serialize_segments
from .household import EVPlannerConfigEntry, Household
from .vehicle import Vehicle

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class VehicleSensorDescription(SensorEntityDescription):
    value_fn: Callable[[Household, Vehicle], StateType | datetime]
    monetary: bool = False
    month: bool = False


@dataclass(frozen=True, kw_only=True)
class GuestSensorDescription(SensorEntityDescription):
    value_fn: Callable[[GuestSession], StateType | datetime]
    monetary: bool = False
    car_info: bool = False
    needs_meter: bool = False


def _plan(attr: str, digits: int = 2) -> Callable[[Household, Vehicle], StateType]:
    def value(_household: Household, vehicle: Vehicle) -> StateType:
        plan = vehicle.plan
        if plan is None:
            return None
        number = getattr(plan, attr)
        return None if number is None else round(float(number), digits)

    return value


def _plan_time(attr: str) -> Callable[[Household, Vehicle], datetime | None]:
    def value(_household: Household, vehicle: Vehicle) -> datetime | None:
        return getattr(vehicle.plan, attr) if vehicle.plan is not None else None

    return value


def _summary(household: Household, vehicle: Vehicle) -> str:
    now = dt_util.now()
    return household.status_text(vehicle.summary(now, household.format_time, household.format_money))


VEHICLE_SENSORS: tuple[VehicleSensorDescription, ...] = (
    VehicleSensorDescription(
        key="status",
        device_class=SensorDeviceClass.ENUM,
        options=VEHICLE_STATUS_OPTIONS,
        value_fn=lambda _h, v: v.status(),
    ),
    VehicleSensorDescription(
        key="charger_control",
        device_class=SensorDeviceClass.ENUM,
        options=CONTROL_OPTIONS,
        value_fn=lambda _h, v: v.decision.control,
    ),
    VehicleSensorDescription(key="plan_start", device_class=SensorDeviceClass.TIMESTAMP, value_fn=_plan_time("start")),
    VehicleSensorDescription(key="plan_end", device_class=SensorDeviceClass.TIMESTAMP, value_fn=_plan_time("end")),
    VehicleSensorDescription(
        key="ready_by_next", device_class=SensorDeviceClass.TIMESTAMP, value_fn=lambda _h, v: v.deadline
    ),
    VehicleSensorDescription(
        key="plan_cost",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        value_fn=_plan("cost"),
    ),
    VehicleSensorDescription(
        key="savings",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        value_fn=_plan("savings"),
    ),
    VehicleSensorDescription(
        key="energy_needed",
        device_class=SensorDeviceClass.ENERGY,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        suggested_display_precision=1,
        value_fn=_plan("energy"),
    ),
    VehicleSensorDescription(
        key="charge_time",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        suggested_display_precision=0,
        value_fn=_plan("minutes", 0),
    ),
    VehicleSensorDescription(
        key="planned_soc",
        native_unit_of_measurement=PERCENTAGE,
        suggested_display_precision=0,
        value_fn=_plan("end_soc", 1),
    ),
    VehicleSensorDescription(
        key="month_energy",
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        suggested_display_precision=1,
        month=True,
        value_fn=lambda _h, v: round(v.month(dt_util.now()).get("energy", 0.0), 3),
    ),
    VehicleSensorDescription(
        key="month_cost",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        monetary=True,
        month=True,
        value_fn=lambda _h, v: round(v.month(dt_util.now()).get("cost", 0.0), 2),
    ),
    VehicleSensorDescription(key="summary", value_fn=_summary),
)

GUEST_SENSORS: tuple[GuestSensorDescription, ...] = (
    GuestSensorDescription(
        key="guest_status",
        device_class=SensorDeviceClass.ENUM,
        options=GUEST_STATUS_OPTIONS,
        value_fn=lambda g: g.status(),
    ),
    GuestSensorDescription(
        key="guest_charger_control",
        device_class=SensorDeviceClass.ENUM,
        options=CONTROL_OPTIONS,
        value_fn=lambda g: g.charger_control(),
    ),
    GuestSensorDescription(
        key="guest_plan_start", device_class=SensorDeviceClass.TIMESTAMP, value_fn=lambda g: g.plan_start
    ),
    GuestSensorDescription(
        key="guest_plan_end", device_class=SensorDeviceClass.TIMESTAMP, value_fn=lambda g: g.plan_end
    ),
    GuestSensorDescription(
        key="guest_cost",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        value_fn=lambda g: g.results.get("charge_costs"),
    ),
    GuestSensorDescription(
        key="guest_savings",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        value_fn=lambda g: g.results.get("savings"),
    ),
    GuestSensorDescription(
        key="guest_energy",
        device_class=SensorDeviceClass.ENERGY,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        suggested_display_precision=1,
        value_fn=lambda g: g.results.get("energy"),
    ),
    GuestSensorDescription(
        key="guest_estimated_soc",
        device_class=SensorDeviceClass.BATTERY,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=PERCENTAGE,
        suggested_display_precision=0,
        value_fn=lambda g: None if (p := g.progress()) is None else round(p.soc, 1),
    ),
    GuestSensorDescription(
        key="guest_measured_energy",
        device_class=SensorDeviceClass.ENERGY,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        suggested_display_precision=2,
        needs_meter=True,
        value_fn=lambda g: g.results.get("measured_energy"),
    ),
    GuestSensorDescription(
        key="guest_measured_cost",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        needs_meter=True,
        value_fn=lambda g: g.results.get("measured_cost"),
    ),
    GuestSensorDescription(
        key="guest_car",
        entity_category=EntityCategory.DIAGNOSTIC,
        car_info=True,
        value_fn=lambda g: (
            " ".join(str(part) for part in (g.results.get("car_brand"), g.results.get("car_model")) if part) or None
        ),
    ),
    GuestSensorDescription(
        key="guest_car_battery",
        device_class=SensorDeviceClass.ENERGY_STORAGE,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        entity_category=EntityCategory.DIAGNOSTIC,
        car_info=True,
        value_fn=lambda g: g.results.get("car_battery_capacity"),
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    household = entry.runtime_data
    for vehicle_id in household.vehicles:
        async_add_entities(
            (VehicleSensor(household, vehicle_id, description) for description in VEHICLE_SENSORS),
            config_subentry_id=vehicle_id,
        )
    for charger_id in household.chargers:
        async_add_entities([ChargerControlSensor(household, charger_id)], config_subentry_id=charger_id)
    has_meter = any(charger.energy_entity for charger in household.chargers.values())
    async_add_entities(
        GuestSensor(household, description) for description in GUEST_SENSORS if has_meter or not description.needs_meter
    )


class VehicleSensor(VehicleEntity, SensorEntity):
    entity_description: VehicleSensorDescription
    _unrecorded_attributes = frozenset({"segments"})

    def __init__(self, household: Household, vehicle_id: str, description: VehicleSensorDescription) -> None:
        super().__init__(household, vehicle_id, description.key)
        self.entity_description = description
        if description.monetary:
            self._attr_native_unit_of_measurement = household.currency

    @property
    def native_value(self) -> StateType | datetime:
        return self.entity_description.value_fn(self.coordinator, self.vehicle)

    @property
    def entity_picture(self) -> str | None:
        """The car's photo on its status, for dashboards."""
        if self.entity_description.key != "status":
            return None
        return self.coordinator.image_url(self.vehicle_id)

    @property
    def last_reset(self) -> datetime | None:
        if not self.entity_description.month:
            return None
        return dt_util.start_of_local_day(dt_util.now().replace(day=1))

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        vehicle = self.vehicle
        key = self.entity_description.key
        if key == "status":
            plan = vehicle.plan
            return {
                "reason": vehicle.decision.reason,
                "plan_error": vehicle.plan_error,
                "soc": vehicle.current_soc,
                "target_soc": vehicle.target,
                "connected": vehicle.connected,
                "deadline": vehicle.deadline.isoformat() if vehicle.deadline else None,
                "calendar_trip": vehicle.calendar_summary,
                "price_ceiling": plan.ceiling if plan else None,
                "opportunistic": plan.opportunistic if plan else False,
                "limited_by_ceiling": plan.limited if plan else False,
                "minimum_only": plan.min_only if plan else False,
                "not_enough_time": plan.short if plan else False,
                "plan_mode": plan.mode if plan else None,
                "one_period_extra": round(plan.joined_extra, 2) if plan and plan.joined else None,
                "control": vehicle.control,
                "control_error": vehicle.control_error,
            }
        if key == "charger_control":
            return {"reason": vehicle.decision.reason, "car_connected": vehicle.connected}
        if key == "savings" and vehicle.plan is not None:
            plan = vehicle.plan
            return {
                "charge_now_cost": None if plan.charge_now_cost is None else round(plan.charge_now_cost, 2),
                "average_price": None if plan.average_price is None else round(plan.average_price, 4),
            }
        if key == "plan_start" and vehicle.plan is not None:
            return {"segments": serialize_segments(vehicle.plan.segments)}
        if key == "month_energy":
            return {"sessions": int(vehicle.month(dt_util.now()).get("sessions", 0))}
        return None


class GuestSensor(GuestEntity, SensorEntity):
    entity_description: GuestSensorDescription
    _unrecorded_attributes = frozenset({"raw_two_days", "charging_schedule", "charging_segments"})

    def __init__(self, household: Household, description: GuestSensorDescription) -> None:
        super().__init__(household, description.key)
        self.entity_description = description
        if description.monetary:
            self._attr_native_unit_of_measurement = household.currency

    @property
    def available(self) -> bool:
        if self.entity_description.car_info and not self.guest.service_health.get("motorapi", True):
            return False
        return super().available

    @property
    def native_value(self) -> StateType | datetime:
        return self.entity_description.value_fn(self.guest)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        guest = self.guest
        key = self.entity_description.key
        if key == "guest_status":
            return {
                "error_detail": guest.error_detail,
                "plan_mode": guest.results.get("plan_mode"),
                "plan_locked": guest.is_plan_locked(),
                "charging_segments": serialize_segments(guest.segments),
                "charging_schedule": guest.results.get("charging_schedule", []),
                "raw_two_days": guest.results.get("raw_two_days", []),
                "license_plate_looked_up": guest.results.get("last_lookup"),
            }
        if key == "guest_charger_control":
            release = guest.release_info()
            charger = guest.charger
            return {
                "charger": charger.name if charger else None,
                "session_ends": guest.plan_end.isoformat() if guest.session_active() and guest.plan_end else None,
                "released_at": release["at"] if release else None,
                "release_reason": release["reason"] if release else None,
                "car_connected": guest.car_connected,
            }
        if key == "guest_estimated_soc" and (progress := guest.progress()) is not None:
            return {
                "source": progress.source,
                "start_soc": progress.start_soc,
                "target_soc": progress.target_soc,
                "behind_plan": progress.behind_plan,
            }
        return None


class ChargerControlSensor(ChargerEntity, SensorEntity):
    """What the charger should do now, for automations of chargers EV Planner cannot switch itself."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = CONTROL_OPTIONS

    def __init__(self, household: Household, charger_id: str) -> None:
        super().__init__(household, charger_id, "charger_control")

    @property
    def native_value(self) -> str:
        return self.coordinator.charger_control(self.charger_id)[0]

    @property
    def entity_picture(self) -> str | None:
        return self.coordinator.image_url(self.charger_id)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        _control, holder = self.coordinator.charger_control(self.charger_id)
        return {"holder": holder, "car_connected": self.charger.connected}
