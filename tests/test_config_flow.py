"""Tests for the config flow: the household, its options, and adding cars and chargers."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, patch

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_planner.api import PlateAuthError, PlateLookupFailed
from custom_components.ev_planner.config_flow import esc_import
from custom_components.ev_planner.const import DOMAIN

from .conftest import CARPORT, CHARGE_SWITCH, NIGHT, PRICE_ENTITY, SOC, TESLA, set_prices

USER_INPUT = {
    "name": "Hjem",
    "price_entity": PRICE_ENTITY,
    "country": "Denmark",
    "motorapi_api_key": "",
    "currency": "DKK",
}


async def test_user_flow(hass: HomeAssistant, now: datetime) -> None:
    set_prices(hass, now, NIGHT)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "price_entity": "sensor.nope"}
    )
    assert result["errors"] == {"price_entity": "invalid_price_entity"}
    result = await hass.config_entries.flow.async_configure(result["flow_id"], USER_INPUT)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Hjem"
    assert result["data"]["price_entity"] == PRICE_ENTITY
    assert result["options"] == {"currency": "DKK", "notify_services": []}

    # Only one household.
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT


async def test_user_flow_checks_the_motorapi_key(hass: HomeAssistant, now: datetime) -> None:
    set_prices(hass, now, NIGHT)
    target = "custom_components.ev_planner.config_flow.async_validate_plate_provider_credentials"
    for side_effect, errors in (
        (PlateAuthError("invalid_auth"), {"motorapi_api_key": "invalid_auth"}),
        (PlateLookupFailed("timeout"), {"base": "timeout"}),
        (PlateLookupFailed("weird"), {"base": "unknown"}),
    ):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        with patch(target, AsyncMock(side_effect=side_effect)):
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"], {**USER_INPUT, "motorapi_api_key": "key"}
            )
        assert result["errors"] == errors
    with patch(target, AsyncMock(return_value=None)):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {**USER_INPUT, "motorapi_api_key": " key "}
        )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["motorapi_api_key"] == "key"


async def test_reconfigure_and_reauth(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await init_integration.start_reconfigure_flow(hass)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"price_entity": PRICE_ENTITY, "country": "Denmark", "motorapi_api_key": ""}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"

    result = await init_integration.start_reauth_flow(hass)
    target = "custom_components.ev_planner.config_flow.async_validate_plate_provider_credentials"
    with patch(target, AsyncMock(side_effect=PlateAuthError("bad"))):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"motorapi_api_key": "bad"})
    assert result["errors"] == {"motorapi_api_key": "invalid_auth"}
    with patch(target, AsyncMock(side_effect=PlateLookupFailed("cannot_connect"))):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"motorapi_api_key": "x"})
    assert result["errors"] == {"base": "cannot_connect"}
    with patch(target, AsyncMock(return_value=None)):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"motorapi_api_key": "good"})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert init_integration.data["motorapi_api_key"] == "good"


async def test_options(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    hass.services.async_register("notify", "mobile_app_phone", AsyncMock())
    result = await hass.config_entries.options.async_init(init_integration.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"currency": "EUR", "notify_services": ["notify.mobile_app_phone"], "update_widgets": True},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert init_integration.options["currency"] == "EUR"
    assert init_integration.runtime_data.notify_services == ["notify.mobile_app_phone"]


async def _start_vehicle_flow(hass: HomeAssistant, entry: MockConfigEntry) -> dict:
    return await hass.config_entries.subentries.async_init(
        (entry.entry_id, "vehicle"), context={"source": config_entries.SOURCE_USER}
    )


async def test_add_a_car(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await _start_vehicle_flow(hass, init_integration)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "details"
    user_input = {
        "name": "Zoe",
        "battery_capacity": 52,
        "sensors": {"soc_entity": SOC},
        "charging": {"charge_power": 7.4, "charger": "none", "control": "car"},
        "trips": {},
    }
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], user_input)
    assert result["errors"] == {"base": "control_entity_required"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {**user_input, "charging": {"charge_power": 7.4, "charger": "none", "control": "charger"}},
    )
    assert result["errors"] == {"base": "charger_required"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {**user_input, "charging": {"charge_power": 7.4, "charger": CARPORT, "control": "charger"}},
    )
    assert result["errors"] == {"base": "charger_has_no_switch"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            **user_input,
            "charging": {"charge_power": 7.4, "charger": "none", "control": "car", "control_entity": CHARGE_SWITCH},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    zoe = next(sub for sub in init_integration.subentries.values() if sub.title == "Zoe")
    assert zoe.data["soc_entity"] == SOC
    assert zoe.data["control_entity"] == CHARGE_SWITCH
    assert "charger" not in zoe.data


async def test_change_a_car(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await init_integration.start_subentry_reconfigure_flow(hass, TESLA)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Model 3",
            "battery_capacity": 75,
            "sensors": {"soc_entity": SOC},
            "charging": {"charge_power": 11, "charger": CARPORT, "control": "car"},
            "trips": {},
        },
    )
    assert result["errors"] == {"base": "control_entity_required"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Model 3",
            "battery_capacity": 75,
            "sensors": {"soc_entity": SOC},
            "charging": {"charge_power": 11, "charger": CARPORT, "control": "none"},
            "trips": {},
        },
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert init_integration.subentries[TESLA].title == "Model 3"
    assert init_integration.subentries[TESLA].data["battery_capacity"] == 75


async def test_add_and_change_a_charger(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await hass.config_entries.subentries.async_init(
        (init_integration.entry_id, "charger"), context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], {"model": "easee_home"})
    assert result["step_id"] == "details"
    schema = result["data_schema"].schema
    defaults = {str(key): key.default() for key in schema if callable(getattr(key, "default", None))}
    assert defaults["name"] == "Easee Home"
    assert defaults["model"] == "easee_home"
    assert defaults["power"] == 11.0
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": "Garage", "model": "easee_home", "power": 22, "switch_entity": "switch.garage"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    garage = next(sub for sub in init_integration.subentries.values() if sub.title == "Garage")
    assert garage.data == {"model": "easee_home", "power": 22, "switch_entity": "switch.garage"}
    await hass.async_block_till_done()

    result = await init_integration.start_subentry_reconfigure_flow(hass, CARPORT)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": "Carport", "model": "other", "power": 7.4}
    )
    assert result["type"] is FlowResultType.ABORT
    assert init_integration.subentries[CARPORT].data == {"power": 7.4}


async def test_add_a_charger_from_its_device(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """The device names the model, and its entities fill in the rest."""
    easee = MockConfigEntry(domain="easee", title="Easee")
    easee.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=easee.entry_id,
        identifiers={("easee", "EH123")},
        manufacturer="Easee",
        model="Easee Home",
        name="Indkørsel",
    )
    registry = er.async_get(hass)

    def add(domain: str, key: str, **kwargs: Any) -> str:
        entity = registry.async_get_or_create(
            domain, "easee", f"EH123_{key}", config_entry=easee, device_id=device.id, translation_key=key, **kwargs
        )
        return entity.entity_id

    add("switch", "smart_charging")
    enabled = add("switch", "is_enabled")
    add("sensor", "session_energy", original_device_class="energy")
    lifetime = add(
        "sensor", "lifetime_energy", original_device_class="energy", capabilities={"state_class": "total_increasing"}
    )
    status = add(
        "sensor", "status", original_device_class="enum", capabilities={"options": ["disconnected", "charging"]}
    )

    result = await hass.config_entries.subentries.async_init(
        (init_integration.entry_id, "charger"), context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"device": device.id, "model": "auto"}
    )
    schema = result["data_schema"].schema
    suggested = {
        str(key): (key.description or {}).get("suggested_value") for key in schema if getattr(key, "description", None)
    }
    defaults = {str(key): key.default() for key in schema if callable(getattr(key, "default", None))}
    assert defaults["name"] == "Indkørsel"
    assert defaults["model"] == "easee_home"
    assert suggested["switch_entity"] == enabled
    assert suggested["energy_entity"] == lifetime
    assert suggested["connected_entity"] == status
    assert suggested["unplugged_states"] == ["disconnected"]


def _esc_entities(hass: HomeAssistant, esc: MockConfigEntry) -> None:
    registry = er.async_get(hass)
    values = {
        ("number", "charging_speed"): "16.0",
        ("number", "electricity_price_limit"): "1.4",
        ("number", "low_price_charging_level"): "0.3",
        ("number", "minimum_ev_soc"): "20.0",
        ("switch", "apply_price_limit"): "on",
        ("switch", "continuous_charging_preferred"): "off",
        ("switch", "opportunistic_charging"): "on",
        ("switch", "smart_charging_activated"): "on",
        ("select", "charge_completion_time"): "07:00",
        ("select", "charge_start_time"): "None",
    }
    for (platform, key), state in values.items():
        unique_id = ".".join([esc.entry_id, platform, key.replace("_", "")])
        entity = registry.async_get_or_create(platform, "ev_smart_charging", unique_id, config_entry=esc)
        hass.states.async_set(entity.entity_id, state)


async def test_add_a_car_from_ev_smart_charging(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    esc = MockConfigEntry(
        domain="ev_smart_charging",
        title="EV Smart Charging",
        data={},
        options={
            "price_sensor": PRICE_ENTITY,
            "ev_soc_sensor": SOC,
            "ev_target_soc_sensor": "number.tesla_charge_limit",
            "charger_entity": CHARGE_SWITCH,
        },
    )
    esc.add_to_hass(hass)
    _esc_entities(hass, esc)

    values, settings = esc_import(hass, esc.entry_id)
    assert values["control"] == "car"
    assert values["control_entity"] == CHARGE_SWITCH
    # The speed comes along as it is; the power is not made up from it.
    assert values["imported_speed"] == 16.0
    assert "charge_power" not in values
    assert settings["price_ceiling_enabled"] is True
    assert settings["price_ceiling"] == 1.4
    assert settings["opportunistic"] == "lower_ceiling"
    assert settings["ready_by"] == "07:00" and settings["use_ready_by"] is True
    assert "earliest_start" not in settings
    assert esc_import(hass, "missing") == ({}, {})

    result = await _start_vehicle_flow(hass, init_integration)
    assert result["step_id"] == "user"
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], {"source": esc.entry_id})
    assert result["step_id"] == "details"
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Tesla 2",
            "battery_capacity": 75,
            "sensors": {"soc_entity": SOC, "target_entity": "number.tesla_charge_limit"},
            "charging": {"charge_power": 12, "charger": CARPORT, "control": "car", "control_entity": CHARGE_SWITCH},
            "trips": {},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    new = next(sub for sub in init_integration.subentries.values() if sub.title == "Tesla 2")
    assert new.data["imported_from"] == esc.entry_id
    assert new.data["imported_settings"]["price_ceiling"] == 1.4
    assert new.data["imported_speed"] == 16.0
    assert init_integration.runtime_data.vehicles[new.subentry_id].charge_speed(11) == (16.0, "imported")

    # Reconfigured with the same capacity and power, the speed stays; with another power it goes.
    for power, kept in ((12, True), (9.6, False)):
        result = await init_integration.start_subentry_reconfigure_flow(hass, new.subentry_id)
        result = await hass.config_entries.subentries.async_configure(
            result["flow_id"],
            {
                "name": "Tesla 2",
                "battery_capacity": 75,
                "sensors": {"soc_entity": SOC, "target_entity": "number.tesla_charge_limit"},
                "charging": {
                    "charge_power": power,
                    "charger": CARPORT,
                    "control": "car",
                    "control_entity": CHARGE_SWITCH,
                },
                "trips": {},
            },
        )
        assert result["type"] is FlowResultType.ABORT
        await hass.async_block_till_done()
        new = init_integration.subentries[new.subentry_id]
        assert ("imported_speed" in new.data) is kept

    # Already imported: straight to the form.
    result = await _start_vehicle_flow(hass, init_integration)
    assert result["step_id"] == "details"


async def test_manual_choice_when_ev_smart_charging_exists(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    MockConfigEntry(domain="ev_smart_charging", title="EV Smart Charging Mercedes", data={}, options={}).add_to_hass(
        hass
    )
    result = await _start_vehicle_flow(hass, init_integration)
    assert result["step_id"] == "user"
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], {"source": "manual"})
    assert result["step_id"] == "details"
