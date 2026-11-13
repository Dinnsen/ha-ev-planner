"""The support export: everything EV Planner knows and used, in one file.

The settings of the household and of every car, charger and place; what the panel shows; what is
stored (plans, history, what was learned about each car, the house and the sun); the events of the
last week and the integration's log lines; and every entity EV Planner reads or controls, and its
own, with their attributes now and their history. Locations, number plates, VINs and keys are left
out, so the file can be sent with a question.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
import re
from typing import TYPE_CHECKING, Any

from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .const import DOMAIN, REDACT_KEYS
from .events import LOG_CAPTURE, PACKAGE_LOGGER

if TYPE_CHECKING:
    from .household import Household

_LOGGER = logging.getLogger(__name__)

HISTORY_HOURS = 48
HISTORY_POINTS = 3000
ENTITY_ID = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
REDACTED = "**REDACTED**"
# Keys whose values are never written: where someone is, who the car is, and keys to services.
SECRET_KEYS = {
    *REDACT_KEYS,
    "latitude",
    "longitude",
    "gps_accuracy",
    "altitude",
    "location",
    "address",
    "street",
    "postal_code",
    "zip",
    "registration",
    "license_plate",
    "vin",
    "api_key",
    "token",
    "access_token",
    "refresh_token",
    "password",
    "secret",
    "user_id",
    "device_trackers",
}


def redact(value: Any) -> Any:
    """``value`` with the secret keys' values left out, at any depth."""
    if isinstance(value, dict):
        return {
            key: (REDACTED if str(key).lower() in SECRET_KEYS and item not in (None, "", []) else redact(item))
            for key, item in value.items()
        }
    if isinstance(value, list | tuple):
        return [redact(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, set):
        return sorted(redact(item) for item in value)
    if value is None or isinstance(value, str | int | float | bool):
        return value
    return str(value)


def _entity_ids(value: Any, found: set[str]) -> None:
    """Every entity id among the settings (at any depth)."""
    if isinstance(value, str):
        if ENTITY_ID.match(value) and not value.startswith(("notify.", "mobile_app_")):
            found.add(value)
    elif isinstance(value, dict):
        for item in value.values():
            _entity_ids(item, found)
    elif isinstance(value, list | tuple | set):
        for item in value:
            _entity_ids(item, found)


def used_entities(hass: HomeAssistant, household: Household) -> list[str]:
    """The entities EV Planner reads or controls: everything named in its settings, that exists."""
    found: set[str] = set()
    entry = household.config_entry
    _entity_ids(dict(entry.data), found)
    _entity_ids(dict(entry.options), found)
    for subentry in entry.subentries.values():
        _entity_ids(dict(subentry.data), found)
    for vehicle in household.vehicles.values():
        _entity_ids(vehicle.settings, found)
    for site in household.sites.values():
        _entity_ids(site.data, found)
    return sorted(entity for entity in found if hass.states.get(entity) is not None)


def own_entities(hass: HomeAssistant, household: Household) -> list[str]:
    registry = er.async_get(hass)
    return sorted(
        entry.entity_id for entry in er.async_entries_for_config_entry(registry, household.config_entry.entry_id)
    )


def _state(state: State | None) -> dict[str, Any] | None:
    if state is None:
        return None
    attributes = dict(state.attributes)
    if state.domain in ("device_tracker", "person", "zone"):
        attributes = {key: value for key, value in attributes.items() if key in ("source_type", "friendly_name")}
    return {
        "state": state.state,
        "attributes": redact(attributes),
        "last_changed": state.last_changed.isoformat(),
        "last_updated": state.last_updated.isoformat(),
    }


def _thin(rows: list[tuple[datetime, str]]) -> list[list[str]]:
    """The history with one value a minute at most, and no repeats."""
    by_minute: dict[datetime, tuple[datetime, str]] = {}
    for moment, value in rows:
        by_minute[moment.replace(second=0, microsecond=0)] = (moment, value)
    out: list[list[str]] = []
    for moment, value in sorted(by_minute.values()):
        if out and out[-1][1] == value:
            continue
        out.append([moment.isoformat(timespec="seconds"), value])
    return out[-HISTORY_POINTS:]


async def async_history(
    hass: HomeAssistant, entity_ids: list[str], start: datetime, end: datetime
) -> dict[str, list[list[str]]] | str:
    """Each entity's states between ``start`` and ``end`` (or why there are none)."""
    if not entity_ids:
        return {}
    try:
        from homeassistant.components.recorder import get_instance, history

        result: dict[str, list[Any]] = await get_instance(hass).async_add_executor_job(
            lambda: history.get_significant_states(
                hass,
                start,
                end,
                entity_ids,
                include_start_time_state=True,
                significant_changes_only=False,  # every change, not only the significant ones
                minimal_response=True,
                no_attributes=True,
            )
        )
    except Exception as err:
        _LOGGER.debug("No history for the support export: %s", err)
        return f"no history: {err}"
    out: dict[str, list[list[str]]] = {}
    for entity_id, states in (result or {}).items():
        rows: list[tuple[datetime, str]] = []
        for item in states:
            if isinstance(item, State):
                rows.append((item.last_changed, item.state))
            elif isinstance(item, dict):
                moment = item.get("last_changed") or item.get("lu") or item.get("last_updated")
                if isinstance(moment, int | float):
                    moment = dt_util.utc_from_timestamp(moment)
                elif isinstance(moment, str):
                    moment = dt_util.parse_datetime(moment)
                value = item.get("state", item.get("s"))
                if isinstance(moment, datetime) and value is not None:
                    rows.append((moment, str(value)))
        out[entity_id] = _thin(rows)
    return out


def _system_log(hass: HomeAssistant) -> list[dict[str, Any]]:
    """The warnings and errors Home Assistant keeps (Settings → System → Logs) that are EV Planner's."""
    handler = hass.data.get("system_log")
    records = getattr(handler, "records", None)
    if records is None:
        return []
    out = []
    try:
        for entry in list(records.values()):
            data = entry.to_dict()
            if PACKAGE_LOGGER in str(data.get("name", "")) or DOMAIN in str(data.get("source", "")):
                out.append(data)
    except Exception:
        return []
    return redact(out)


async def async_bundle(hass: HomeAssistant, household: Household, hours: int = HISTORY_HOURS) -> dict[str, Any]:
    """Everything, for the support export and the diagnostics."""
    from .diagnostics import household_diagnostics
    from .websocket import panel_state

    now = dt_util.now()
    start = now - timedelta(hours=max(1, min(hours, 168)))
    entry = household.config_entry
    try:
        version = str((await async_get_integration(hass, DOMAIN)).version)
    except Exception:
        version = None
    used = used_entities(hass, household)
    own = own_entities(hass, household)
    history = await async_history(hass, sorted({*used, *own}), start, now)
    stored = household.stored_data()
    return {
        # The household as EV Planner sees it now (as the diagnostics always had it) ...
        **redact(household_diagnostics(household, now)),
        # ... and everything else.
        "about": {
            "made": now.isoformat(),
            "time_zone": str(hass.config.time_zone),
            "home_assistant": HA_VERSION,
            "ev_planner": version,
            "history_from": start.isoformat(),
            "note": "Locations, number plates, VINs and keys are left out.",
        },
        "config": redact(
            {
                "data": dict(entry.data),
                "options": dict(entry.options),
                "subentries": {
                    subentry_id: {"type": subentry.subentry_type, "title": subentry.title, "data": dict(subentry.data)}
                    for subentry_id, subentry in entry.subentries.items()
                },
            }
        ),
        "panel": redact(panel_state(hass, household)),
        # What is kept on disk: settings, plans, history, what was learned about the cars and places.
        "stored": redact(stored),
        "learning": redact(
            {
                vehicle.name: {
                    "learned": vehicle.learned.to_dict(),
                    "meter": vehicle.meter.to_dict(),
                    "figures": household.charging_figures(vehicle),
                }
                for vehicle in household.vehicles.values()
            }
        ),
        "events": household.events.since(start),
        "log": list(LOG_CAPTURE.lines),
        "system_log": _system_log(hass),
        "entities": {
            "used": {entity: _state(hass.states.get(entity)) for entity in used},
            "own": {entity: _state(hass.states.get(entity)) for entity in own},
        },
        "history": history,
    }
