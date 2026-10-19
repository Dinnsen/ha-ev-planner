"""Tests for the panel's websocket commands, the actions and diagnostics."""

from __future__ import annotations

from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import device_registry as dr
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.ev_planner.const import DOMAIN
from custom_components.ev_planner.diagnostics import async_get_config_entry_diagnostics

from .conftest import CARPORT, MERCEDES, TESLA, settle


async def _ws(client: Any, msg_id: int, **msg: Any) -> dict[str, Any]:
    await client.send_json({"id": msg_id, **msg})
    result: dict[str, Any] = await client.receive_json()
    return result


async def test_state(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    msg = await _ws(client, 1, type="ev_planner/state")
    assert msg["success"]
    state = msg["result"]
    assert state["currency"] == "DKK"
    assert len(state["prices"]) == 11
    names = [vehicle["name"] for vehicle in state["vehicles"]]
    assert names == ["Mercedes", "Tesla"]
    tesla = state["vehicles"][1]
    assert tesla["status"] == "planned"
    assert tesla["soc_source"] == "sensor"
    assert tesla["target_editable"] is True
    assert tesla["charger"] == {"id": "carport_id", "name": "Carport"}
    assert tesla["plan"]["segments"][0]["start"].startswith("2026-10-20T02:00")
    assert tesla["plan"]["energy"] == 20
    assert state["vehicles"][0]["soc_source"] == "manual"
    assert state["chargers"][0]["name"] == "Carport"
    assert state["guest"]["status"] == "ready"
    assert state["guest"]["charger"]["name"] == "Carport"

    msg = await _ws(client, 2, type="ev_planner/state", entry_id="nope")
    assert not msg["success"]
    assert msg["error"]["code"] == "entry_not_found"


async def test_subscribe_and_vehicle_settings(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    freezer: FrozenDateTimeFactory,
) -> None:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "ev_planner/subscribe"})
    assert (await client.receive_json())["success"]
    event = await client.receive_json()
    assert event["event"]["vehicles"][1]["name"] == "Tesla"

    await client.send_json(
        {
            "id": 2,
            "type": "ev_planner/vehicle_set",
            "vehicle_id": MERCEDES,
            "settings": {"manual_soc": 30, "schedule": {"tue": "none", "wed": "08:30"}, "continuous": True},
        }
    )
    # Events and the result may come in any order.
    seen_result = False
    for _ in range(10):
        msg = await client.receive_json()
        if msg.get("id") == 2 and msg.get("type") == "result":
            assert msg["success"]
            seen_result = True
            break
    assert seen_result
    mercedes = init_integration.runtime_data.vehicles[MERCEDES]
    assert mercedes.settings["manual_soc"] == 30
    assert mercedes.settings["schedule"] == {"tue": "none", "wed": "08:30"}

    await client.send_json(
        {"id": 3, "type": "ev_planner/vehicle_set", "vehicle_id": "nope", "settings": {"mode": "pause"}}
    )
    for _ in range(10):
        msg = await client.receive_json()
        if msg.get("id") == 3 and msg.get("type") == "result":
            assert not msg["success"]
            assert msg["error"]["code"] == "car_not_found"
            break


async def test_vehicle_preview(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    msg = await _ws(
        client,
        1,
        type="ev_planner/vehicle_preview",
        vehicle_id=TESLA,
        settings={"target_soc": 90, "ready_by": "06:00"},
    )
    assert msg["success"]
    assert msg["result"]["plan"]["end_soc"] == 90
    assert msg["result"]["deadline"].startswith("2026-10-20T06:00")
    # Nothing was stored.
    assert init_integration.runtime_data.vehicles[TESLA].settings["ready_by"] == "07:00"

    msg = await _ws(client, 2, type="ev_planner/vehicle_preview", vehicle_id=TESLA, settings={"target_soc": 40})
    assert msg["result"]["plan"] is None
    assert msg["result"]["error"] == "limit_not_above_soc"


async def test_guest_commands(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    msg = await _ws(client, 1, type="ev_planner/guest_set", inputs={"license_plate": " ab 1 ", "soc": 30})
    assert msg["success"]
    guest = init_integration.runtime_data.guest
    assert guest.inputs["license_plate"] == "AB 1"

    msg = await _ws(client, 2, type="ev_planner/guest_preview", inputs={"charge_limit": 90})
    assert msg["success"] and msg["result"]["energy"] > 0
    msg = await _ws(client, 3, type="ev_planner/guest_preview", inputs={"charge_limit": 10})
    assert msg["result"] == {"error": "limit_not_above_soc"}

    msg = await _ws(client, 4, type="ev_planner/guest_plan")
    assert msg["success"]
    assert guest.status() == "planned"
    msg = await _ws(client, 5, type="ev_planner/guest_lookup")
    assert not msg["success"]
    assert msg["error"]["code"] == "motorapi_key_missing"
    msg = await _ws(client, 6, type="ev_planner/guest_new")
    assert msg["success"]
    assert guest.status() == "ready"

    guest.history = [{"id": "a"}, {"id": "b"}]
    msg = await _ws(client, 7, type="ev_planner/delete_history", history_id="a")
    assert msg["success"] and guest.history == [{"id": "b"}]
    tesla = init_integration.runtime_data.vehicles[TESLA]
    tesla.history = [{"id": "x"}]
    msg = await _ws(client, 8, type="ev_planner/delete_history", vehicle_id=TESLA)
    assert msg["success"] and tesla.history == []

    msg = await _ws(client, 9, type="ev_planner/settings", settings={"bill_price": 2.5, "payment_text": "MobilePay"})
    assert msg["success"]
    assert init_integration.runtime_data.settings == {"bill_price": 2.5, "payment_text": "MobilePay"}


async def test_images(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    freezer: FrozenDateTimeFactory,
) -> None:
    client = await hass_ws_client(hass)
    first, second = "a" * 32, "b" * 32
    msg = await _ws(client, 1, type="ev_planner/set_image", target_id=TESLA, image_id=first)
    assert msg["success"] and msg["result"] == {"replaced": None}
    msg = await _ws(client, 2, type="ev_planner/set_image", target_id=TESLA, image_id=second)
    assert msg["result"] == {"replaced": first}
    msg = await _ws(client, 3, type="ev_planner/set_image", target_id=CARPORT, image_id=first)
    assert msg["success"]
    await hass.async_block_till_done()

    state = (await _ws(client, 4, type="ev_planner/state"))["result"]
    assert state["vehicles"][1]["image"] == f"/api/image/serve/{second}/512x512"
    assert state["vehicles"][0]["image"] is None
    assert state["chargers"][0]["image"] == f"/api/image/serve/{first}/512x512"
    assert state["chargers"][0]["style"] == "box"
    tesla_status = hass.states.get("sensor.tesla_status")
    assert tesla_status is not None
    assert tesla_status.attributes["entity_picture"] == f"/api/image/serve/{second}/512x512"
    carport = hass.states.get("sensor.carport_charger_control")
    assert carport is not None and carport.attributes["entity_picture"].startswith("/api/image/serve/")

    msg = await _ws(client, 5, type="ev_planner/set_image", target_id=TESLA, image_id=None)
    assert msg["result"] == {"replaced": second}
    msg = await _ws(client, 6, type="ev_planner/set_image", target_id="nope", image_id=first)
    assert not msg["success"]
    msg = await _ws(client, 7, type="ev_planner/set_image", target_id=TESLA, image_id="../etc")
    assert not msg["success"]

    # Kept across a restart.
    await hass.config_entries.async_reload(init_integration.entry_id)
    await hass.async_block_till_done()
    assert init_integration.runtime_data.images == {CARPORT: first}

    msg = await _ws(client, 8, type="ev_planner/guest_charge_now")
    assert msg["success"]
    assert init_integration.runtime_data.guest.status() == "charging"


async def test_actions(hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory) -> None:
    device = dr.async_get(hass).async_get_device_by_identifier((DOMAIN, TESLA), init_integration.entry_id)
    assert device is not None
    await hass.services.async_call(DOMAIN, "set_mode", {"vehicle": device.id, "mode": "pause"}, blocking=True)
    await settle(hass, freezer)
    assert hass.states.get("select.tesla_mode").state == "pause"
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "set_mode", {"vehicle": "nope", "mode": "pause"}, blocking=True)
    await hass.services.async_call(DOMAIN, "recalculate", {}, blocking=True)
    await hass.services.async_call(DOMAIN, "guest_plan", {}, blocking=True)
    assert init_integration.runtime_data.guest.status() == "planned"
    await hass.services.async_call(DOMAIN, "new_guest", {}, blocking=True)
    assert init_integration.runtime_data.guest.status() == "ready"
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "guest_lookup", {}, blocking=True)


async def test_diagnostics(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    await init_integration.runtime_data.guest.async_set_input("license_plate", "AB12345")
    diagnostics = await async_get_config_entry_diagnostics(hass, init_integration)
    assert diagnostics["vehicles"][TESLA]["status"] == "planned"
    assert diagnostics["vehicles"][TESLA]["plan"]["energy"] == 20
    assert diagnostics["guest"]["inputs"]["license_plate"] == "**REDACTED**"
    assert diagnostics["price_slots"] == 11
