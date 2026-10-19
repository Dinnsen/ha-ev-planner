"""Numbers for EV Planner: targets, levels and prices per car, and the guest's inputs."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberEntityDescription, NumberMode
from homeassistant.const import PERCENTAGE, EntityCategory, UnitOfEnergy, UnitOfPower, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    GUEST_BATTERY,
    GUEST_EFFICIENCY,
    GUEST_LIMIT,
    GUEST_POWER,
    GUEST_SOC,
    SET_CEILING,
    SET_EFFICIENCY,
    SET_FOLLOW_LEVEL,
    SET_LOW_PRICE_LEVEL,
    SET_LOW_SOC_LEVEL,
    SET_MANUAL_SOC,
    SET_MIN_SOC,
    SET_OPPORTUNISTIC_LEVEL,
    SET_REMINDER_HORIZON,
    SET_REMINDER_PRICE,
    SET_REMINDER_REPEAT,
    SET_REMINDER_SOC,
    SET_TARGET_SOC,
)
from .entity import GuestEntity, VehicleEntity
from .household import EVPlannerConfigEntry, Household
from .vehicle import Vehicle, to_float

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class PlannerNumberDescription(NumberEntityDescription):
    setting: str
    price: bool = False


def _percent(key: str, setting: str, *, config: bool = False) -> PlannerNumberDescription:
    return PlannerNumberDescription(
        key=key,
        setting=setting,
        device_class=NumberDeviceClass.BATTERY,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.SLIDER,
        entity_category=EntityCategory.CONFIG if config else None,
    )


def _price(key: str, setting: str) -> PlannerNumberDescription:
    return PlannerNumberDescription(
        key=key,
        setting=setting,
        native_min_value=-5,
        native_max_value=20,
        native_step=0.01,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
        price=True,
    )


TARGET = _percent("target_soc", SET_TARGET_SOC)
MANUAL_SOC = _percent("manual_soc", SET_MANUAL_SOC)
VEHICLE_NUMBERS: tuple[PlannerNumberDescription, ...] = (
    _percent("min_soc", SET_MIN_SOC, config=True),
    _price("price_ceiling", SET_CEILING),
    _price("low_price_level", SET_LOW_PRICE_LEVEL),
    _percent("low_soc_level", SET_LOW_SOC_LEVEL, config=True),
    PlannerNumberDescription(
        key="opportunistic_level",
        setting=SET_OPPORTUNISTIC_LEVEL,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
    PlannerNumberDescription(
        key="follow_level",
        setting=SET_FOLLOW_LEVEL,
        native_min_value=0,
        native_max_value=200,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
    PlannerNumberDescription(
        key="charging_efficiency",
        setting=SET_EFFICIENCY,
        native_min_value=50,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
    _percent("reminder_soc", SET_REMINDER_SOC, config=True),
    _price("reminder_price", SET_REMINDER_PRICE),
    PlannerNumberDescription(
        key="reminder_repeat",
        setting=SET_REMINDER_REPEAT,
        native_min_value=0,
        native_max_value=240,
        native_step=5,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
    PlannerNumberDescription(
        key="reminder_horizon",
        setting=SET_REMINDER_HORIZON,
        native_min_value=1,
        native_max_value=48,
        native_step=1,
        native_unit_of_measurement=UnitOfTime.HOURS,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
)
GUEST_NUMBERS: tuple[PlannerNumberDescription, ...] = (
    PlannerNumberDescription(
        key="guest_soc",
        setting=GUEST_SOC,
        device_class=NumberDeviceClass.BATTERY,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.BOX,
    ),
    PlannerNumberDescription(
        key="guest_charge_limit",
        setting=GUEST_LIMIT,
        device_class=NumberDeviceClass.BATTERY,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.BOX,
    ),
    PlannerNumberDescription(
        key="guest_battery_capacity",
        setting=GUEST_BATTERY,
        device_class=NumberDeviceClass.ENERGY_STORAGE,
        native_min_value=1,
        native_max_value=300,
        native_step=0.1,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        mode=NumberMode.BOX,
    ),
    PlannerNumberDescription(
        key="guest_charger_power",
        setting=GUEST_POWER,
        device_class=NumberDeviceClass.POWER,
        native_min_value=0.1,
        native_max_value=350,
        native_step=0.1,
        native_unit_of_measurement=UnitOfPower.KILO_WATT,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
    PlannerNumberDescription(
        key="guest_charging_efficiency",
        setting=GUEST_EFFICIENCY,
        native_min_value=50,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
)


def _target_editable(vehicle: Vehicle) -> bool:
    """The target is set here, or on the car's own number entity; a sensor is read only."""
    entity = vehicle.target_entity
    return entity is None or entity.split(".", 1)[0] in ("number", "input_number")


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    household = entry.runtime_data
    for vehicle_id, vehicle in household.vehicles.items():
        descriptions = list(VEHICLE_NUMBERS)
        if _target_editable(vehicle):
            descriptions.insert(0, TARGET)
        if not vehicle.has_soc_sensor:
            descriptions.insert(0, MANUAL_SOC)
        async_add_entities(
            (VehicleNumber(household, vehicle_id, description) for description in descriptions),
            config_subentry_id=vehicle_id,
        )
    async_add_entities(GuestNumber(household, description) for description in GUEST_NUMBERS)


class VehicleNumber(VehicleEntity, NumberEntity):
    entity_description: PlannerNumberDescription

    def __init__(self, household: Household, vehicle_id: str, description: PlannerNumberDescription) -> None:
        super().__init__(household, vehicle_id, description.key)
        self.entity_description = description
        if description.price:
            self._attr_native_unit_of_measurement = f"{household.currency}/kWh"

    @property
    def native_value(self) -> float | None:
        if self.entity_description.setting == SET_TARGET_SOC:
            return self.vehicle.target
        return to_float(self.vehicle.settings.get(self.entity_description.setting))

    async def async_set_native_value(self, value: float) -> None:
        await self.coordinator.async_set_vehicle(self.vehicle_id, {self.entity_description.setting: float(value)})


class GuestNumber(GuestEntity, NumberEntity):
    entity_description: PlannerNumberDescription

    def __init__(self, household: Household, description: PlannerNumberDescription) -> None:
        super().__init__(household, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> float | None:
        return to_float(self.guest.inputs.get(self.entity_description.setting))

    async def async_set_native_value(self, value: float) -> None:
        await self.guest.async_set_input(self.entity_description.setting, float(value))
