"""The current version started on a household an older version left behind.

The Tests workflow sets the household up with the older version's own config flow
(tests_upgrade/make_old_household.py, run in a checkout of that version), and hands
what it saved to this test in ``EVP_UPGRADE_FROM``. Without it, the test is skipped.
"""

from __future__ import annotations

from datetime import datetime
import json
import logging
import os
from pathlib import Path
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState, ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.const import DOMAIN
from custom_components.ev_household_planner.websocket import panel_state

from .conftest import NIGHT, SwitchCalls, set_prices, settle

OLD = os.environ.get("EVP_UPGRADE_FROM")

pytestmark = pytest.mark.skipif(not OLD, reason="EVP_UPGRADE_FROM names a household made by an older version")


async def test_a_household_from_the_last_release_starts_as_it_was(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
    hass_storage: dict[str, Any],
    caplog: pytest.LogCaptureFixture,
) -> None:
    old = json.loads(Path(str(OLD)).read_text())
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    freezer.move_to(datetime.fromisoformat(old["now"]))
    for entity_id, (state, attributes) in old["states"].items():
        hass.states.async_set(entity_id, state, attributes)
    # Prices for the night ahead: the old run's night is over.
    set_prices(hass, datetime.fromisoformat(old["now"]), NIGHT)
    hass_storage.update(old["storage"])
    was = old["entry"]
    entry = MockConfigEntry(
        domain=DOMAIN,
        entry_id=was["entry_id"],
        title=was["title"],
        unique_id=was["unique_id"],
        data=was["data"],
        options=was["options"],
        version=was["version"],
        minor_version=was["minor_version"],
        subentries_data=[
            ConfigSubentryDataWithId(
                data=sub["data"],
                subentry_id=sub["subentry_id"],
                subentry_type=sub["subentry_type"],
                title=sub["title"],
                unique_id=sub["unique_id"],
            )
            for sub in was["subentries"]
        ],
    )
    entry.add_to_hass(hass)
    # The entities the old version made, with the ids dashboards and automations use.
    registry = er.async_get(hass)
    for entity in old["entities"]:
        object_id = entity["entity_id"].split(".", 1)[1]
        made = registry.async_get_or_create(
            entity["platform"],
            DOMAIN,
            entity["unique_id"],
            suggested_object_id=object_id,
            config_entry=entry,
            config_subentry_id=entity["subentry"],
        )
        assert made.entity_id == entity["entity_id"]

    caplog.set_level(logging.WARNING, logger=f"custom_components.{DOMAIN}")
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    assert entry.state is ConfigEntryState.LOADED
    household = entry.runtime_data

    # Every entity is still there under its old id, and is not left behind as unavailable.
    gone = [
        e["entity_id"]
        for e in old["entities"]
        if (state := hass.states.get(e["entity_id"])) is None or state.attributes.get("restored")
    ]
    assert not gone, f"entities the new version no longer makes: {gone}"

    # The cars, with the settings the user made, and their history.
    assert set(household.vehicles) == set(old["settings"])
    for vehicle_id, settings in old["settings"].items():
        now = household.vehicles[vehicle_id].settings
        changed = {key: (value, now.get(key)) for key, value in settings.items() if now.get(key) != value}
        assert not changed, f"settings that did not survive for {vehicle_id}: {changed}"
        assert len(household.vehicles[vehicle_id].history) >= old["history"][vehicle_id]

    # The home is a place now, and nothing was lost on the way.
    home = [sub for sub in entry.subentries.values() if sub.subentry_type == "site"]
    assert len(home) == 1 and home[0].data.get("home") is True
    assert set(was["options"]) >= set(entry.options) - {"price_add"}

    # The panel reads it, all of it as JSON.
    state = json.loads(json.dumps(panel_state(hass, household)))
    assert {v["id"] for v in state["vehicles"]} == set(old["settings"])
    assert state["sites"][0]["home"] is True

    problems = [
        r for r in caplog.records if r.levelno >= logging.WARNING and r.name.startswith(f"custom_components.{DOMAIN}")
    ]
    assert not problems, [r.getMessage() for r in problems]

    # And it runs on: a restart of the new version keeps it all.
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED
    assert set(entry.runtime_data.vehicles) == set(old["settings"])
