"""Moving a household from EV Planner 1.x (domain ev_planner) to ev_household_planner."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr, entity_registry as er, issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.const import DOMAIN
from custom_components.ev_household_planner.migration import ISSUE_OLD_FILES, OLD_DOMAIN

from .conftest import (
    CARPORT,
    NIGHT,
    PRICE_ENTITY,
    TESLA,
    SwitchCalls,
    carport_data,
    set_prices,
    set_tesla,
    settle,
    tesla_data,
)

OLD_ID = "old_entry_id"


def _old_entry(**data: Any) -> MockConfigEntry:
    return MockConfigEntry(
        domain=OLD_DOMAIN,
        entry_id=OLD_ID,
        title="Marielystvej",
        unique_id=OLD_DOMAIN,
        data={
            "price_entity": PRICE_ENTITY,
            "country": "Denmark",
            "motorapi_api_key": "",
            "plate_provider": "motorapi_dk",
            **data,
        },
        options={"currency": "DKK", "notify_services": []},
        subentries_data=[
            config_entries.ConfigSubentryDataWithId(
                data=carport_data(), subentry_id=CARPORT, subentry_type="charger", title="Carport", unique_id=None
            ),
            config_entries.ConfigSubentryDataWithId(
                data=tesla_data(), subentry_id=TESLA, subentry_type="vehicle", title="Tesla", unique_id=None
            ),
        ],
    )


async def test_a_household_of_1x_is_moved_with_everything_in_it(
    hass: HomeAssistant,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
    hass_storage: dict[str, Any],
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    old = _old_entry()
    old.add_to_hass(hass)
    entities = er.async_get(hass)
    devices = dr.async_get(hass)
    car = devices.async_get_or_create(
        config_entry_id=OLD_ID, config_subentry_id=TESLA, identifiers={(OLD_DOMAIN, TESLA)}, name="Tesla"
    )
    guest = devices.async_get_or_create(config_entry_id=OLD_ID, identifiers={(OLD_DOMAIN, f"{OLD_ID}_guest")})
    status = entities.async_get_or_create(
        "sensor",
        OLD_DOMAIN,
        f"{TESLA}_status",
        config_entry=old,
        config_subentry_id=TESLA,
        device_id=car.id,
        suggested_object_id="tesla_status",
    )
    guest_status = entities.async_get_or_create(
        "sensor",
        OLD_DOMAIN,
        f"{OLD_ID}_guest_status",
        config_entry=old,
        device_id=guest.id,
        suggested_object_id="guest_car_status",
    )
    # Something else with the same domain is left alone.
    other = MockConfigEntry(domain=OLD_DOMAIN, data={"some": "thing"})
    other.add_to_hass(hass)
    hass_storage[f"{OLD_DOMAIN}.{OLD_ID}"] = {
        "version": 1,
        "key": f"{OLD_DOMAIN}.{OLD_ID}",
        "data": {"vehicles": {TESLA: {"settings": {"target_soc": 66, "ready_by": "05:30"}}}},
    }

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "migrate"
    assert result["description_placeholders"] == {"title": "Marielystvej", "cars": "1", "chargers": "1"}
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    await settle(hass, freezer)

    entry = result["result"]
    assert entry.title == "Marielystvej"
    assert "migrated_from" not in entry.data
    assert entry.data["price_entity"] == PRICE_ENTITY
    assert set(entry.subentries) == {CARPORT, TESLA}
    # The 1.x household is gone; the other integration's entry is not.
    assert hass.config_entries.async_get_entry(OLD_ID) is None
    assert hass.config_entries.async_get_entry(other.entry_id) is not None

    # Same entity ids, now in this integration.
    moved = entities.async_get(status.entity_id)
    assert moved is not None and moved.platform == DOMAIN and moved.config_entry_id == entry.entry_id
    assert moved.unique_id == f"{TESLA}_status"
    moved_guest = entities.async_get(guest_status.entity_id)
    assert moved_guest is not None and moved_guest.unique_id == f"{entry.entry_id}_guest_status"
    assert hass.states.get(status.entity_id) is not None
    device = devices.async_get(car.id)
    assert device is not None and device.identifiers == {(DOMAIN, TESLA)}
    assert device.config_entry_id == entry.entry_id
    assert device.config_subentry_id == TESLA
    guest_device = devices.async_get(guest.id)
    assert guest_device is not None and guest_device.identifiers == {(DOMAIN, f"{entry.entry_id}_guest")}

    # The stored settings came along.
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.settings["ready_by"] == "05:30"

    # Adding EV Planner again: it is there already.
    again = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert again["type"] is FlowResultType.ABORT


async def test_the_files_of_1x_get_a_repair(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    from custom_components.ev_household_planner.migration import async_check_old_files

    folder = Path(hass.config.path("custom_components", OLD_DOMAIN))
    folder.mkdir(parents=True, exist_ok=True)
    try:
        (folder / "manifest.json").write_text('{"documentation": "https://github.com/Dinnsen/ha-ev-planner"}')
        await async_check_old_files(hass)
        assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_OLD_FILES) is not None
        # Another integration's files with that domain are none of our business.
        (folder / "manifest.json").write_text('{"documentation": "https://example.com"}')
        await async_check_old_files(hass)
        assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_OLD_FILES) is None
    finally:
        (folder / "manifest.json").unlink(missing_ok=True)
        folder.rmdir()
