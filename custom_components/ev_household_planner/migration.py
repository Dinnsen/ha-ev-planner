"""Moving a household from EV Planner 1.x (domain ``ev_planner``) to this domain.

EV Planner 1.x used the domain ``ev_planner``, which another integration in
the Marketplace (formerly HACS) uses too. From 2.0 the domain is ``ev_household_planner``.
Adding EV Planner again finds the 1.x household and moves it here:

* the setup: price sensor, options, and every car and charger with the same
  ids, so the stored settings, plans, history, learning and photos fit;
* the stored data;
* the entities and devices, so entity ids, history and statistics are kept
  and dashboards and automations that use the entities go on working.

The 1.x household is then removed. Its files may stay in
``custom_components/ev_planner``; a repair says they can be deleted, so the
two versions never run side by side.
"""

from __future__ import annotations

from collections.abc import Mapping
import logging
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigEntryState, ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er, issue_registry as ir
from homeassistant.helpers.storage import Store

from .const import CONF_COUNTRY, CONF_MOTORAPI_KEY, CONF_PRICE_ENTITY, DOCS_URL, DOMAIN, STORAGE_KEY, STORAGE_VERSION

_LOGGER = logging.getLogger(__name__)

OLD_DOMAIN = "ev_planner"
# Set on a new entry made from a 1.x household until the move is done.
CONF_MIGRATED_FROM = "migrated_from"
ISSUE_OLD_FILES = "old_version_files"


def old_entries(hass: HomeAssistant) -> list[ConfigEntry]:
    """EV Planner 1.x households: ``ev_planner`` entries with EV Planner's own setup.

    The other integration with the domain ``ev_planner`` has a setup of its own,
    so it is never taken for one of these.
    """
    return [
        entry
        for entry in hass.config_entries.async_entries(OLD_DOMAIN)
        if all(key in entry.data for key in (CONF_PRICE_ENTITY, CONF_COUNTRY, CONF_MOTORAPI_KEY))
    ]


def entry_from_old(old: ConfigEntry) -> dict[str, Any]:
    """What the new entry is made of: the 1.x setup, with the same car and charger ids."""
    return {
        "title": old.title,
        "data": {**old.data, CONF_MIGRATED_FROM: old.entry_id},
        "options": dict(old.options),
        "subentries": [
            ConfigSubentryDataWithId(
                data=dict(sub.data),
                subentry_id=sub.subentry_id,
                subentry_type=sub.subentry_type,
                title=sub.title,
                unique_id=sub.unique_id,
            )
            for sub in old.subentries.values()
        ],
    }


def _new_id(value: str, old_id: str, new_id: str) -> str:
    """An id of the 1.x household in the new one: only the household's own id changes."""
    return new_id + value[len(old_id) :] if value.startswith(old_id) else value


async def async_take_over(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Move the 1.x household this entry was made from; nothing happens when it is done."""
    old_id = entry.data.get(CONF_MIGRATED_FROM)
    if not old_id:
        return
    new_id = entry.entry_id
    old = hass.config_entries.async_get_entry(old_id)

    # 1. The stored data, unless this household has its own already.
    new_store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY.format(entry_id=new_id))
    if await new_store.async_load() is None:
        old_store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, f"{OLD_DOMAIN}.{old_id}")
        if (stored := await old_store.async_load()) is not None:
            await new_store.async_save(stored)

    # 2. Stop the 1.x household, so its entities can move and nothing is controlled twice.
    if old is not None and old.state is ConfigEntryState.LOADED:
        await hass.config_entries.async_unload(old_id)

    # 3. Entities and devices, with their ids, names and history.
    entities = er.async_get(hass)
    for item in er.async_entries_for_config_entry(entities, old_id):
        if item.platform != OLD_DOMAIN:
            continue
        unique_id = _new_id(item.unique_id, old_id, new_id)
        if entities.async_get_entity_id(item.domain, DOMAIN, unique_id):
            entities.async_remove(item.entity_id)  # already made here: keep that one
            continue
        try:
            entities.async_update_entity_platform(
                item.entity_id,
                DOMAIN,
                new_config_entry_id=new_id,
                # The car's and charger's subentries keep their ids, so an entity keeps its subentry.
                **({"new_config_subentry_id": item.config_subentry_id} if item.config_subentry_id else {}),
                **({"new_unique_id": unique_id} if unique_id != item.unique_id else {}),
            )
        except ValueError as err:
            _LOGGER.warning("Could not move %s to EV Planner: %s", item.entity_id, err)
    devices = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(devices, old_id):
        identifiers = {
            (DOMAIN, _new_id(value, old_id, new_id)) if domain == OLD_DOMAIN else (domain, value)
            for domain, value in device.identifiers
        }
        if hasattr(device, "config_entry_id"):
            # A device belongs to one config entry (and subentry): move it.
            devices.async_update_device(
                device.id,
                new_config_entry_id=new_id,
                new_config_subentry_id=device.config_subentry_id,
                new_identifiers=identifiers,
            )
            continue
        for subentry_id in device.config_entries_subentries.get(old_id, {None}):  # pragma: no cover - before 2026.10
            devices.async_update_device(
                device.id,
                add_config_entry_id=new_id,
                add_config_subentry_id=subentry_id,
                new_identifiers=identifiers,
            )
        devices.async_update_device(device.id, remove_config_entry_id=old_id)  # pragma: no cover

    # 4. The 1.x household itself.
    if old is not None:
        await hass.config_entries.async_remove(old_id)

    hass.config_entries.async_update_entry(
        entry, data={key: value for key, value in entry.data.items() if key != CONF_MIGRATED_FROM}
    )
    _LOGGER.info("EV Planner 1.x household %s moved to %s", old_id, new_id)


def _old_files(path: Path) -> bool:
    """Whether the files of EV Planner 1.x are still in ``custom_components/ev_planner``."""
    manifest = path / "manifest.json"
    try:
        text = manifest.read_text(encoding="utf-8")
    except OSError:
        return False
    return DOCS_URL in text


async def async_check_old_files(hass: HomeAssistant) -> None:
    """A repair while EV Planner 1.x's files are installed: they can be deleted."""
    path = Path(hass.config.path("custom_components", OLD_DOMAIN))
    if await hass.async_add_executor_job(_old_files, path):
        ir.async_create_issue(
            hass,
            DOMAIN,
            ISSUE_OLD_FILES,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_OLD_FILES,
            translation_placeholders={"path": str(path)},
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, ISSUE_OLD_FILES)


def describe(old: ConfigEntry) -> Mapping[str, str]:
    """Placeholders for the form that offers the move."""
    cars = sum(1 for sub in old.subentries.values() if sub.subentry_type == "vehicle")
    chargers = sum(1 for sub in old.subentries.values() if sub.subentry_type == "charger")
    return {"title": old.title, "cars": str(cars), "chargers": str(chargers)}
