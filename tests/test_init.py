"""Tests for setting up, reloading and removing EV Planner."""

from __future__ import annotations

from datetime import datetime

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState, ConfigSubentry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er, issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_planner import async_remove_config_entry_device
from custom_components.ev_planner.const import DOMAIN

from .conftest import MERCEDES, NIGHT, TESLA, entry_with, set_prices, settle, vehicle_sub


async def test_setup_creates_cars_charger_and_guest(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    assert init_integration.state is ConfigEntryState.LOADED
    status = hass.states.get("sensor.tesla_status")
    assert status is not None
    assert status.state == "planned"
    assert status.attributes["soc"] == 50
    assert status.attributes["target_soc"] == 80
    assert hass.states.get("sensor.tesla_plan_start").state == "2026-10-20T00:00:00+00:00"
    assert hass.states.get("sensor.tesla_plan_end").state == "2026-10-20T02:00:00+00:00"
    assert hass.states.get("sensor.tesla_charger_control").state == "pause"
    assert hass.states.get("binary_sensor.tesla_charge_now").state == "off"
    assert hass.states.get("select.tesla_mode").state == "smart"
    # The Mercedes has no charge level sensor: a manual level, and no target from the car.
    assert hass.states.get("number.mercedes_charge_level") is not None
    assert hass.states.get("number.tesla_charge_level") is None
    assert hass.states.get("number.tesla_target").state == "80.0"
    assert hass.states.get("sensor.carport_charger_control").state == "pause"
    assert hass.states.get("sensor.guest_car_status").state == "ready"
    assert hass.states.get("button.guest_car_new_guest") is not None

    devices = dr.async_get(hass)
    tesla = devices.async_get_device(identifiers={(DOMAIN, TESLA)})
    assert tesla is not None and tesla.name == "Tesla"
    assert devices.async_get_device(identifiers={(DOMAIN, f"{init_integration.entry_id}_guest")}) is not None


async def test_unload_and_remove(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    assert await hass.config_entries.async_unload(init_integration.entry_id)
    await hass.async_block_till_done()
    assert init_integration.state is ConfigEntryState.NOT_LOADED
    assert await hass.config_entries.async_remove(init_integration.entry_id)
    await hass.async_block_till_done()


async def test_adding_a_car_reloads_the_household(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    hass.config_entries.async_add_subentry(
        init_integration,
        ConfigSubentry(
            data={"battery_capacity": 50.0, "charge_power": 7.4}, subentry_type="vehicle", title="Zoe", unique_id=None
        ),
    )
    await hass.async_block_till_done()
    await settle(hass, freezer)
    assert hass.states.get("sensor.zoe_status") is not None


async def test_device_removal(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    devices = dr.async_get(hass)
    tesla = devices.async_get_device(identifiers={(DOMAIN, TESLA)})
    assert tesla is not None
    assert not await async_remove_config_entry_device(hass, init_integration, tesla)
    stale = devices.async_get_or_create(config_entry_id=init_integration.entry_id, identifiers={(DOMAIN, "gone")})
    assert await async_remove_config_entry_device(hass, init_integration, stale)


async def test_imported_settings_start_the_car(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory
) -> None:
    set_prices(hass, now, NIGHT)
    entry = entry_with(
        vehicle_sub(
            MERCEDES,
            "Mercedes",
            {
                "battery_capacity": 66.5,
                "charge_power": 11.0,
                "imported_settings": {"mode": "off", "price_ceiling": 1.47},
            },
        )
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    assert hass.states.get("select.mercedes_mode").state == "off"
    assert hass.states.get("sensor.mercedes_status").state == "off"
    assert hass.states.get("number.mercedes_price_ceiling").state == "1.47"
    registry = er.async_get(hass)
    assert registry.async_get("sensor.mercedes_status") is not None


async def test_missing_price_sensor_raises_a_repair(hass: HomeAssistant, now: datetime) -> None:
    entry = entry_with()
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert ir.async_get(hass).async_get_issue(DOMAIN, f"price_entity_missing_{entry.entry_id}") is not None
    set_prices(hass, now, NIGHT)
    await hass.async_block_till_done()
    assert ir.async_get(hass).async_get_issue(DOMAIN, f"price_entity_missing_{entry.entry_id}") is None
