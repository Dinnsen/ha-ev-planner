"""The guest car's license plate."""

from __future__ import annotations

from homeassistant.components.text import TextEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import GUEST_PLATE
from .entity import GuestEntity
from .household import EVPlannerConfigEntry, Household

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([GuestPlate(entry.runtime_data)])


class GuestPlate(GuestEntity, TextEntity):
    _attr_native_max = 16

    def __init__(self, household: Household) -> None:
        super().__init__(household, "guest_license_plate")

    @property
    def native_value(self) -> str:
        return str(self.guest.inputs.get(GUEST_PLATE) or "")

    async def async_set_value(self, value: str) -> None:
        await self.guest.async_set_input(GUEST_PLATE, value)
