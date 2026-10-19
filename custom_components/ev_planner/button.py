"""Buttons for the guest car: look it up, make the plan, start over."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import GuestEntity
from .guest import GuestSession
from .household import EVPlannerConfigEntry, Household

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class GuestButtonDescription(ButtonEntityDescription):
    press_fn: Callable[[GuestSession], Awaitable[None]]


GUEST_BUTTONS: tuple[GuestButtonDescription, ...] = (
    GuestButtonDescription(key="guest_lookup", press_fn=lambda guest: guest.async_lookup()),
    GuestButtonDescription(key="guest_plan", press_fn=lambda guest: guest.async_calculate()),
    GuestButtonDescription(key="guest_new", press_fn=lambda guest: guest.async_new_guest()),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities(GuestButton(entry.runtime_data, description) for description in GUEST_BUTTONS)


class GuestButton(GuestEntity, ButtonEntity):
    entity_description: GuestButtonDescription

    def __init__(self, household: Household, description: GuestButtonDescription) -> None:
        super().__init__(household, description.key)
        self.entity_description = description

    async def async_press(self) -> None:
        await self.entity_description.press_fn(self.guest)
