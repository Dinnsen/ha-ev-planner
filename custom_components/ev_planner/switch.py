"""Switches for EV Planner: each car's rules and notifications, and the guest's plan options."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.components.switch import SwitchEntity, SwitchEntityDescription
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    GUEST_CONTINUOUS,
    GUEST_USE_READY_BY,
    SET_CEILING_ENABLED,
    SET_CONTINUOUS,
    SET_KEEP_ON,
    SET_LIVE,
    SET_LOW_PRICE_ENABLED,
    SET_LOW_SOC_ENABLED,
    SET_NOTIFY_DONE,
    SET_REMINDER,
    SET_REMINDER_PRICE_ENABLED,
    SET_USE_EARLIEST_START,
    SET_USE_READY_BY,
)
from .entity import GuestEntity, VehicleEntity
from .household import EVPlannerConfigEntry, Household

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class PlannerSwitchDescription(SwitchEntityDescription):
    setting: str


def _switch(key: str, setting: str, *, config: bool = True) -> PlannerSwitchDescription:
    return PlannerSwitchDescription(key=key, setting=setting, entity_category=EntityCategory.CONFIG if config else None)


VEHICLE_SWITCHES: tuple[PlannerSwitchDescription, ...] = (
    _switch("use_ready_by", SET_USE_READY_BY, config=False),
    _switch("use_earliest_start", SET_USE_EARLIEST_START),
    _switch("continuous", SET_CONTINUOUS),
    _switch("price_ceiling_enabled", SET_CEILING_ENABLED),
    _switch("low_price_charging", SET_LOW_PRICE_ENABLED),
    _switch("low_soc_charging", SET_LOW_SOC_ENABLED),
    _switch("keep_charger_on", SET_KEEP_ON),
    _switch("reminder", SET_REMINDER),
    _switch("reminder_price_enabled", SET_REMINDER_PRICE_ENABLED),
    _switch("live_notification", SET_LIVE),
    _switch("notify_done", SET_NOTIFY_DONE),
)
GUEST_SWITCHES: tuple[PlannerSwitchDescription, ...] = (
    _switch("guest_use_ready_by", GUEST_USE_READY_BY, config=False),
    _switch("guest_continuous", GUEST_CONTINUOUS),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    household = entry.runtime_data
    for vehicle_id in household.vehicles:
        async_add_entities(
            (VehicleSwitch(household, vehicle_id, description) for description in VEHICLE_SWITCHES),
            config_subentry_id=vehicle_id,
        )
    async_add_entities(GuestSwitch(household, description) for description in GUEST_SWITCHES)


class VehicleSwitch(VehicleEntity, SwitchEntity):
    entity_description: PlannerSwitchDescription

    def __init__(self, household: Household, vehicle_id: str, description: PlannerSwitchDescription) -> None:
        super().__init__(household, vehicle_id, description.key)
        self.entity_description = description

    @property
    def is_on(self) -> bool:
        return bool(self.vehicle.settings.get(self.entity_description.setting))

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.coordinator.async_set_vehicle(self.vehicle_id, {self.entity_description.setting: True})

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.coordinator.async_set_vehicle(self.vehicle_id, {self.entity_description.setting: False})


class GuestSwitch(GuestEntity, SwitchEntity):
    entity_description: PlannerSwitchDescription

    def __init__(self, household: Household, description: PlannerSwitchDescription) -> None:
        super().__init__(household, description.key)
        self.entity_description = description

    @property
    def is_on(self) -> bool:
        return bool(self.guest.inputs.get(self.entity_description.setting))

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.guest.async_set_input(self.entity_description.setting, True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.guest.async_set_input(self.entity_description.setting, False)
