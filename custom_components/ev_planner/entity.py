"""Base entities for EV Planner: the household, each car, each charger and the guest."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOCS_URL, DOMAIN, MANUFACTURER
from .guest import GuestSession
from .household import Charger, Household
from .vehicle import Vehicle


class EVPlannerEntity(CoordinatorEntity[Household]):
    """An EV Planner entity; its name and icon come from the translation key."""

    _attr_has_entity_name = True

    def __init__(self, household: Household, key: str) -> None:
        super().__init__(household)
        self._key = key
        self._attr_translation_key = key


class VehicleEntity(EVPlannerEntity):
    """An entity of one of the household's cars."""

    def __init__(self, household: Household, vehicle_id: str, key: str) -> None:
        super().__init__(household, key)
        self.vehicle_id = vehicle_id
        vehicle = household.vehicles[vehicle_id]
        self._attr_unique_id = f"{vehicle_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, vehicle_id)},
            name=vehicle.name,
            manufacturer=MANUFACTURER,
            model="EV Planner",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=DOCS_URL,
        )

    @property
    def vehicle(self) -> Vehicle:
        return self.coordinator.vehicles[self.vehicle_id]

    @property
    def available(self) -> bool:
        return super().available and self.vehicle_id in self.coordinator.vehicles


class ChargerEntity(EVPlannerEntity):
    """An entity of one of the household's chargers."""

    def __init__(self, household: Household, charger_id: str, key: str) -> None:
        super().__init__(household, key)
        self.charger_id = charger_id
        charger = household.chargers[charger_id]
        self._attr_unique_id = f"{charger_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, charger_id)},
            name=charger.name,
            manufacturer=MANUFACTURER,
            model="EV Planner",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=DOCS_URL,
        )

    @property
    def charger(self) -> Charger:
        return self.coordinator.chargers[self.charger_id]


class GuestEntity(EVPlannerEntity):
    """An entity of the guest car."""

    def __init__(self, household: Household, key: str) -> None:
        super().__init__(household, key)
        entry_id = household.config_entry.entry_id
        self._attr_unique_id = f"{entry_id}_guest_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry_id}_guest")},
            translation_key="guest",
            manufacturer=MANUFACTURER,
            model="EV Planner",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=DOCS_URL,
        )

    @property
    def guest(self) -> GuestSession:
        return self.coordinator.guest
