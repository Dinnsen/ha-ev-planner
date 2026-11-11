"""The home as a place of its own, and what used to be settings of the whole household as parts of it.

Before places, the supply, the sun, the home battery and the heat pump were
set under Configure, for the household. Now a household has places (the home,
and say a summer house), and each place has its own supply and its own parts.
The first time a household is set up after that, its home is made a place and
its old settings are moved there: nothing has to be set again, and nothing
else about the household changes.
"""

from __future__ import annotations

from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_BATTERY_POWER,
    CONF_BATTERY_SOC,
    CONF_HEAT_PUMP_BLOCK,
    CONF_HEAT_PUMP_POWER,
    CONF_HOME,
    CONF_SOLAR_POWER,
    MOVED_KEYS,
    PART_KEYS,
    SITE_KEYS,
    SUBENTRY_BATTERY,
    SUBENTRY_HEAT_PUMP,
    SUBENTRY_SITE,
    SUBENTRY_SOLAR,
)

# A part is made when one of these is set.
PART_NEEDS = {
    SUBENTRY_SOLAR: (CONF_SOLAR_POWER,),
    SUBENTRY_BATTERY: (CONF_BATTERY_SOC, CONF_BATTERY_POWER),
    SUBENTRY_HEAT_PUMP: (CONF_HEAT_PUMP_POWER, CONF_HEAT_PUMP_BLOCK),
}
TITLES = {
    "da": {
        SUBENTRY_SITE: "Hjem",
        SUBENTRY_SOLAR: "Solceller",
        SUBENTRY_BATTERY: "Husbatteri",
        SUBENTRY_HEAT_PUMP: "Varmepumpe",
    },
    "en": {
        SUBENTRY_SITE: "Home",
        SUBENTRY_SOLAR: "Solar panels",
        SUBENTRY_BATTERY: "Home battery",
        SUBENTRY_HEAT_PUMP: "Heat pump",
    },
}


def title(hass: HomeAssistant, kind: str) -> str:
    """What a part made for the household is called, in Home Assistant's language."""
    language = "da" if str(hass.config.language).startswith("da") else "en"
    return TITLES[language][kind]


def home_subentry(entry: ConfigEntry) -> ConfigSubentry | None:
    return next(
        (sub for sub in entry.subentries.values() if sub.subentry_type == SUBENTRY_SITE and sub.data.get(CONF_HOME)),
        None,
    )


def _set(data: dict[str, Any], keys: tuple[str, ...]) -> dict[str, Any]:
    return {key: data[key] for key in keys if data.get(key) not in (None, "", [])}


def async_ensure_home(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Make the home a place, with the household's old settings moved to it. True when something was moved."""
    if home_subentry(entry) is not None:
        return False
    options = dict(entry.options)
    old = {key: options.pop(key) for key in MOVED_KEYS if key in options}
    hass.config_entries.async_add_subentry(
        entry,
        ConfigSubentry(
            data=MappingProxyType({CONF_HOME: True, **_set(old, SITE_KEYS)}),
            subentry_type=SUBENTRY_SITE,
            title=title(hass, SUBENTRY_SITE),
            unique_id=CONF_HOME,
        ),
    )
    for kind, needs in PART_NEEDS.items():
        if not any(old.get(key) for key in needs):
            continue
        hass.config_entries.async_add_subentry(
            entry,
            ConfigSubentry(
                data=MappingProxyType(_set(old, PART_KEYS[kind])),
                subentry_type=kind,
                title=title(hass, kind),
                unique_id=f"{CONF_HOME}_{kind}",
            ),
        )
    if old:
        hass.config_entries.async_update_entry(entry, options=options)
    return True
