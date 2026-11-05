"""Times for EV Planner: when each car must be ready, the earliest start and the reminder."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import time

from homeassistant.components.time import TimeEntity, TimeEntityDescription
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import GUEST_READY_BY, SET_EARLIEST_START, SET_READY_BY, SET_REMINDER_TIME
from .entity import GuestEntity, VehicleEntity
from .household import EVPlannerConfigEntry, Household
from .rules import parse_hhmm

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class PlannerTimeDescription(TimeEntityDescription):
    setting: str


VEHICLE_TIMES: tuple[PlannerTimeDescription, ...] = (
    PlannerTimeDescription(key="ready_by", setting=SET_READY_BY),
    PlannerTimeDescription(key="earliest_start", setting=SET_EARLIEST_START, entity_category=EntityCategory.CONFIG),
    PlannerTimeDescription(key="reminder_time", setting=SET_REMINDER_TIME, entity_category=EntityCategory.CONFIG),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    household = entry.runtime_data
    for vehicle_id in household.vehicles:
        async_add_entities(
            (VehicleTime(household, vehicle_id, description) for description in VEHICLE_TIMES),
            config_subentry_id=vehicle_id,
        )
    async_add_entities([GuestReadyBy(household)])


class VehicleTime(VehicleEntity, TimeEntity):
    entity_description: PlannerTimeDescription

    def __init__(self, household: Household, vehicle_id: str, description: PlannerTimeDescription) -> None:
        super().__init__(household, vehicle_id, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> time | None:
        return parse_hhmm(self.vehicle.settings.get(self.entity_description.setting))

    async def async_set_value(self, value: time) -> None:
        await self.coordinator.async_set_vehicle(
            self.vehicle_id, {self.entity_description.setting: value.strftime("%H:%M")}
        )


class GuestReadyBy(GuestEntity, TimeEntity):
    def __init__(self, household: Household) -> None:
        super().__init__(household, "guest_ready_by")

    @property
    def native_value(self) -> time | None:
        return parse_hhmm(self.guest.inputs.get(GUEST_READY_BY))

    async def async_set_value(self, value: time) -> None:
        await self.guest.async_set_input(GUEST_READY_BY, value)
