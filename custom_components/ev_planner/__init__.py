"""EV Planner: cheap charging for the household's own cars, and for guests."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, PLATFORMS, STORAGE_KEY, STORAGE_VERSION
from .household import EVPlannerConfigEntry, Household
from .panel import async_register_panel, async_unregister_panel
from .services import async_setup_services
from .websocket import async_register_websocket

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the actions and the panel's websocket commands."""
    async_setup_services(hass)
    async_register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: EVPlannerConfigEntry) -> bool:
    """Set up the household with its cars, chargers and guest."""
    household = Household(hass, entry)
    await household.async_initialize()
    entry.runtime_data = household
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # Cars and chargers are subentries: adding, changing or removing one reloads the household.
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    await async_register_panel(hass)
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: EVPlannerConfigEntry) -> bool:
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        await entry.runtime_data.async_shutdown()
        if not [other for other in hass.config_entries.async_loaded_entries(DOMAIN) if other is not entry]:
            async_unregister_panel(hass)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove the stored settings, plans and history with the household."""
    store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY.format(entry_id=entry.entry_id))
    await store.async_remove()


async def async_remove_config_entry_device(
    hass: HomeAssistant, entry: EVPlannerConfigEntry, device: dr.DeviceEntry
) -> bool:
    """A car or charger device can be removed once its subentry is gone."""
    household = entry.runtime_data
    known = {*household.vehicles, *household.chargers, f"{entry.entry_id}_guest", entry.entry_id}
    return not any(identifier[1] in known for identifier in device.identifiers if identifier[0] == DOMAIN)
