"""Selects for EV Planner: each car's mode and opportunistic charging, and the guest's charger."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import GUEST_CHARGER, MODES, OPPORTUNISTIC_OPTIONS, SET_MODE, SET_OPPORTUNISTIC
from .entity import GuestEntity, VehicleEntity
from .household import EVPlannerConfigEntry, Household

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class PlannerSelectDescription(SelectEntityDescription):
    setting: str


VEHICLE_SELECTS: tuple[PlannerSelectDescription, ...] = (
    PlannerSelectDescription(key="mode", setting=SET_MODE, options=MODES),
    PlannerSelectDescription(
        key="opportunistic",
        setting=SET_OPPORTUNISTIC,
        options=OPPORTUNISTIC_OPTIONS,
        entity_category=EntityCategory.CONFIG,
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
            (VehicleSelect(household, vehicle_id, description) for description in VEHICLE_SELECTS),
            config_subentry_id=vehicle_id,
        )
    if len(household.chargers) > 1:
        async_add_entities([GuestChargerSelect(household)])


class VehicleSelect(VehicleEntity, SelectEntity):
    entity_description: PlannerSelectDescription

    def __init__(self, household: Household, vehicle_id: str, description: PlannerSelectDescription) -> None:
        super().__init__(household, vehicle_id, description.key)
        self.entity_description = description

    @property
    def current_option(self) -> str | None:
        value = self.vehicle.settings.get(self.entity_description.setting)
        return str(value) if value in self.options else None

    async def async_select_option(self, option: str) -> None:
        await self.coordinator.async_set_vehicle(self.vehicle_id, {self.entity_description.setting: option})


class GuestChargerSelect(GuestEntity, SelectEntity):
    """Which charger the guest uses, when there are several."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, household: Household) -> None:
        super().__init__(household, "guest_charger")

    @property
    def options(self) -> list[str]:
        return [charger.name for charger in self.coordinator.chargers.values()]

    @property
    def current_option(self) -> str | None:
        charger = self.guest.charger
        return charger.name if charger else None

    async def async_select_option(self, option: str) -> None:
        for charger_id, charger in self.coordinator.chargers.items():
            if charger.name == option:
                await self.guest.async_set_input(GUEST_CHARGER, charger_id)
                return
