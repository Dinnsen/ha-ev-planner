"""Tests for the charger catalog and how it reads a charger's device."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_planner.catalog import (
    MODELS,
    STYLES,
    describe_device,
    get_model,
    match_model,
    model_options,
    panel_info,
    suggest_entities,
)


def test_catalog_is_consistent() -> None:
    keys = [model.key for model in MODELS]
    assert len(keys) == len(set(keys))
    assert all(model.style in STYLES and model.power > 0 for model in MODELS)
    options = model_options()
    assert len(options) == len(MODELS)
    # Named chargers first, the generic ones last.
    assert options[-1][0] == "generic_socket"
    assert options[0][1].endswith("kW)")


def test_models() -> None:
    home = get_model("easee_home")
    assert home is not None
    assert home.title == "Easee Home"
    assert home.suggested_power == 11
    socket = get_model("generic_socket")
    assert socket is not None and socket.suggested_power == 2.3
    assert get_model(None) is None
    assert get_model("nope") is None
    assert panel_info({"model": "zaptec_go"}) == {"model": "zaptec_go", "model_title": "Zaptec Go", "style": "slim"}
    assert panel_info({}) == {"model": None, "model_title": None, "style": "box"}


def _key(*args: Any) -> str | None:
    model = match_model(*args)
    return model.key if model else None


def test_match_model() -> None:
    assert _key("Easee", "Easee Home") == "easee_home"
    assert _key("Easee AS", "Charge Lite") == "easee_charge"
    assert _key("Zaptec", "ZAPTEC GO 2") == "zaptec_go2"
    assert _key("Wallbox", "Pulsar Plus") == "wallbox_pulsar_plus"
    assert _key("go-e GmbH", "go-eCharger Gemini flex") == "go_e_gemini_flex"
    assert _key("Tesla, Inc.", "Wall Connector") == "tesla_wall_connector"
    # The integration names the brand when the manufacturer does not.
    assert _key(None, "Home Pro", ["ohme"]) == "ohme_home_pro"
    # OCPP is used by many brands.
    assert _key("Unknown", "Box", ["ocpp"]) == "ocpp_charger"
    assert _key("ABB", "Terra AC W22", ["ocpp"]) == "abb_terra_ac"
    assert _key("Unknown", "Box") is None


async def _device(hass: HomeAssistant, domain: str, manufacturer: str, model: str) -> tuple[MockConfigEntry, str]:
    entry = MockConfigEntry(domain=domain)
    entry.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={(domain, model)}, manufacturer=manufacturer, model=model
    )
    return entry, device.id


def _add(hass: HomeAssistant, entry: MockConfigEntry, device_id: str, domain: str, key: str, **kwargs: Any) -> str:
    entity = er.async_get(hass).async_get_or_create(
        domain, entry.domain, f"{device_id}_{key}", config_entry=entry, device_id=device_id, **kwargs
    )
    return entity.entity_id


async def test_suggest_entities_with_a_plug_sensor(hass: HomeAssistant) -> None:
    entry, device_id = await _device(hass, "tesla_wall_connector", "Tesla", "Wall Connector")
    plug = _add(hass, entry, device_id, "binary_sensor", "vehicle_connected", original_name="Vehicle connected")
    _add(hass, entry, device_id, "binary_sensor", "contactor", original_name="Contactor closed")
    meter = _add(hass, entry, device_id, "sensor", "energy", original_device_class="energy")
    _add(hass, entry, device_id, "switch", "led", original_name="Status LED")
    name, model = describe_device(hass, device_id)
    assert model is not None and model.key == "tesla_wall_connector"
    assert name == "Wall Connector" or name is None
    assert suggest_entities(hass, device_id, model) == {"energy_entity": meter, "connected_entity": plug}


async def test_suggest_entities_with_a_status_sensor(hass: HomeAssistant) -> None:
    entry, device_id = await _device(hass, "wallbox", "Wallbox", "Pulsar Plus")
    pause = _add(hass, entry, device_id, "switch", "pause_resume", translation_key="pause_resume")
    status = _add(hass, entry, device_id, "sensor", "status_description", translation_key="status_description")
    _add(hass, entry, device_id, "sensor", "charging_power", original_device_class="power")
    model = get_model("wallbox_pulsar_plus")
    assert suggest_entities(hass, device_id, model) == {
        "switch_entity": pause,
        "connected_entity": status,
        "unplugged_states": ["ready", "disconnected", "locked"],
    }
    # Without a known brand there is nothing to say which states mean "no car".
    assert suggest_entities(hass, device_id, None) == {"switch_entity": pause}


async def test_describe_a_missing_device(hass: HomeAssistant) -> None:
    assert describe_device(hass, "nope") == (None, None)
