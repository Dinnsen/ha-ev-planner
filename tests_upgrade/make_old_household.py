"""Run inside a checkout of an older EV Planner (its tests/ folder): set a household up the way a user
does, with the config flow, let it plan and charge through a night, and write what it leaves behind.

The upgrade test (tests/test_upgrade.py) then starts the current version on exactly that: the config
entry, the stored settings and history, the entities and the states around them. Copied into the old
checkout by the Tests workflow; nothing here imports the current version.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import json
import os
from pathlib import Path
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant import config_entries
from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from custom_components.ev_household_planner.const import DOMAIN

from .conftest import (
    CABLE,
    CHARGE_SWITCH,
    CHARGING,
    LIMIT,
    NIGHT,
    PRICE_ENTITY,
    SOC,
    SwitchCalls,
    move,
    set_prices,
    set_tesla,
)

CHARGER_SWITCH = "switch.carport_charging"
MERCEDES_SOC = "sensor.eqb_soc"
MERCEDES_CABLE = "binary_sensor.eqb_cable"


async def test_make_an_old_household(
    hass: HomeAssistant,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
    hass_storage: dict[str, Any],
) -> None:
    out = os.environ.get("EVP_UPGRADE_OUT")
    assert out, "EVP_UPGRADE_OUT names the file to write"
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=40)
    hass.states.async_set(CHARGER_SWITCH, "on")
    hass.states.async_set(MERCEDES_SOC, "30", {"unit_of_measurement": "%"})
    hass.states.async_set(MERCEDES_CABLE, "off")

    # The household, as the user sets it up.
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {"name": "Hjem", "price_entity": PRICE_ENTITY, "country": "denmark", "motorapi_api_key": "", "currency": "DKK"},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    entry = hass.config_entries.async_entries(DOMAIN)[0]

    # A charger with a switch.
    result = await hass.config_entries.subentries.async_init((entry.entry_id, "charger"), context={"source": "user"})
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], {"model": "other"})
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": "Carport", "model": "other", "power": 11, "switch_entity": CHARGER_SWITCH}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY, result
    await hass.async_block_till_done()
    charger_id = next(sid for sid, sub in entry.subentries.items() if sub.subentry_type == "charger")

    async def add_car(name: str, sensors: dict[str, Any], charging: dict[str, Any]) -> None:
        result = await hass.config_entries.subentries.async_init(
            (entry.entry_id, "vehicle"), context={"source": "user"}
        )
        if result.get("step_id") == "user":
            result = await hass.config_entries.subentries.async_configure(result["flow_id"], {})
        result = await hass.config_entries.subentries.async_configure(
            result["flow_id"],
            {"name": name, "battery_capacity": 60, "sensors": sensors, "charging": charging, "trips": {}},
        )
        assert result["type"] is FlowResultType.CREATE_ENTRY, result
        await hass.async_block_till_done()

    # One car started and paused through the car, one through the charger: both on the same charger.
    await add_car(
        "Tesla",
        {"soc_entity": SOC, "target_entity": LIMIT, "connected_entity": CABLE, "charging_entity": CHARGING},
        {"charge_power": 11, "charger": charger_id, "control": "car", "control_entity": CHARGE_SWITCH},
    )
    await add_car(
        "Mercedes",
        {"soc_entity": MERCEDES_SOC, "connected_entity": MERCEDES_CABLE},
        {"charge_power": 11, "charger": charger_id, "control": "charger"},
    )
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    household = entry.runtime_data
    tesla = next(vid for vid, v in household.vehicles.items() if v.name == "Tesla")
    # Settings the user has changed.
    await household.async_set_vehicle(
        tesla, {"ready_by": "06:30", "use_ready_by": True, "target_soc": 90, "min_soc": 25}
    )

    # A night: plugged in, charged in the cheap hours, unplugged in the morning.
    moment = dt_util.now()
    for _ in range(12 * 6):
        moment += timedelta(minutes=10)
        if hass.states.get(CHARGE_SWITCH).state == "on":
            soc = float(hass.states.get(SOC).state)
            set_tesla(hass, soc=min(90, soc + 3), switch=True, charging=soc < 90)
        await move(hass, freezer, moment)
    set_tesla(hass, soc=float(hass.states.get(SOC).state), cable=False)
    await move(hass, freezer, moment + timedelta(minutes=5))

    registry = er.async_get(hass)
    entities = [
        {"entity_id": e.entity_id, "unique_id": e.unique_id, "platform": e.domain, "subentry": e.config_subentry_id}
        for e in er.async_entries_for_config_entry(registry, entry.entry_id)
    ]
    settings = {vid: dict(v.settings) for vid, v in household.vehicles.items()}
    history = {vid: len(getattr(v, "history", []) or []) for vid, v in household.vehicles.items()}
    around = {
        entity_id: [state.state, dict(state.attributes)]
        for state in hass.states.async_all()
        if (entity_id := state.entity_id).split(".")[0] in {"sensor", "binary_sensor", "number", "switch"}
        and not any(entity_id == e["entity_id"] for e in entities)
    }
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    stored = {key: value for key, value in hass_storage.items() if key.startswith(DOMAIN)}
    assert stored, "the household was saved"
    old = entry.as_dict()
    Path(out).write_text(
        json.dumps(
            {
                "home_assistant": HA_VERSION,
                "now": dt_util.now().isoformat(),
                "entry": old,
                "storage": stored,
                "entities": entities,
                "settings": settings,
                "history": history,
                "states": around,
            },
            default=str,
            ensure_ascii=False,
            indent=1,
        )
    )
