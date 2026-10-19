"""Actions for EV Planner."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv, device_registry as dr, service

from .const import (
    ATTR_CONFIG_ENTRY_ID,
    ATTR_MODE,
    ATTR_VEHICLE,
    DOMAIN,
    MODES,
    SERVICE_GUEST_CHARGE_NOW,
    SERVICE_GUEST_LOOKUP,
    SERVICE_GUEST_PLAN,
    SERVICE_NEW_GUEST,
    SERVICE_RECALCULATE,
    SERVICE_SET_MODE,
    SET_MODE,
)
from .household import EVPlannerConfigEntry, Household
from .schema import vol

ENTRY_SCHEMA = vol.Schema({vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string})
MODE_SCHEMA = vol.Schema({vol.Required(ATTR_VEHICLE): cv.string, vol.Required(ATTR_MODE): vol.In(MODES)})


def _household(call: ServiceCall) -> Household:
    entry: EVPlannerConfigEntry = service.async_get_config_entry(call.hass, DOMAIN, call.data.get(ATTR_CONFIG_ENTRY_ID))
    return entry.runtime_data


def _vehicle(call: ServiceCall) -> tuple[Household, str]:
    """The household and car of a car device."""
    device = dr.async_get(call.hass).async_get(call.data[ATTR_VEHICLE])
    if device is not None:
        for entry in call.hass.config_entries.async_loaded_entries(DOMAIN):
            household: Household = entry.runtime_data
            for domain, identifier in device.identifiers:
                if domain == DOMAIN and identifier in household.vehicles:
                    return household, identifier
    raise ServiceValidationError(translation_domain=DOMAIN, translation_key="car_not_found")


async def _async_recalculate(call: ServiceCall) -> None:
    await _household(call).async_recalculate(force=True)


async def _async_set_mode(call: ServiceCall) -> None:
    household, vehicle_id = _vehicle(call)
    await household.async_set_vehicle(vehicle_id, {SET_MODE: call.data[ATTR_MODE]})


async def _async_guest_lookup(call: ServiceCall) -> None:
    await _household(call).guest.async_lookup()


async def _async_guest_plan(call: ServiceCall) -> None:
    await _household(call).guest.async_calculate()


async def _async_guest_charge_now(call: ServiceCall) -> None:
    await _household(call).guest.async_charge_now()


async def _async_new_guest(call: ServiceCall) -> None:
    await _household(call).guest.async_new_guest()


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    hass.services.async_register(DOMAIN, SERVICE_RECALCULATE, _async_recalculate, schema=ENTRY_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_SET_MODE, _async_set_mode, schema=MODE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_GUEST_LOOKUP, _async_guest_lookup, schema=ENTRY_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_GUEST_PLAN, _async_guest_plan, schema=ENTRY_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_GUEST_CHARGE_NOW, _async_guest_charge_now, schema=ENTRY_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_NEW_GUEST, _async_new_guest, schema=ENTRY_SCHEMA)
