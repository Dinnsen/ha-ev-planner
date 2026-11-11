"""Where a household placed things in the house picture: kept tidy, stored, and only set by an administrator."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.ev_household_planner.layout import MAX_CELLS, clean_layout, clean_layouts

LAYOUT: dict[str, Any] = {
    "things": {
        "gateway": {"w": "s2", "u": 9.4, "z": 1.05},
        "charger1": {"w": "e1", "u": 7.123, "z": 0.9},
        "heat": {"x": 15.0, "y": 9.0},
    },
    "panels": {"roof": [[0, 1], [1, 1]], "garage": []},
    "wires": {"grid": [[16.5, 11.6, 0.02], [9.65, 11.6, 0.02], [9.65, 8.62, 1.05]]},
    "labels": {"car0": [12, -30.5]},
}


def test_a_layout_is_kept_as_it_was_drawn() -> None:
    clean = clean_layout(LAYOUT)
    assert clean["things"]["charger1"] == {"w": "e1", "u": 7.12, "z": 0.9}
    assert clean["things"]["heat"] == {"x": 15.0, "y": 9.0}
    # No panels on the garage is a choice too: an empty list stays.
    assert clean["panels"] == {"roof": [[0, 1], [1, 1]], "garage": []}
    assert clean["wires"]["grid"][-1] == [9.65, 8.62, 1.05]
    assert clean["labels"] == {"car0": [12.0, -30.5]}


def test_what_the_picture_cannot_draw_is_left_out() -> None:
    assert clean_layout(None) == {}
    assert clean_layout({"things": "x", "panels": "y", "wires": [], "labels": 3}) == {}
    clean = clean_layout(
        {
            "things": {
                "gateway": {"w": "roof", "u": 1, "z": 1},  # not a wall
                "battery": {"w": "s1", "u": "a", "z": 1},  # not a number
                "charger0": {"w": "s1", "u": 1e9, "z": float("nan")},
                "charger1": {"w": "s1", "u": 1e9, "z": 1},  # far away: brought into reach
                "heat": {"x": True, "y": 1},
                "lamp": {"w": "s1", "u": 1, "z": 1},
                "sun": 5,
            },
            "panels": {"roof": [[0, 0], [0, 0], [1], [-1, 2], [True, 1], "x", [25, 1]], "garage": "all"},
            "wires": {
                "sun": [[1, 2, 3]],
                "grid": [[1, 2, 3], [1, 2]],
                "heat": [[0, 0, 0]] * 50,
                "lamp": [[1, 2, 3]] * 2,
            },
            "labels": {"car0": [1], "home": ["a", 2], "lamp": [1, 2]},
        }
    )
    assert clean == {"things": {"charger1": {"w": "s1", "u": 40.0, "z": 1.0}}, "panels": {"roof": [[0, 0]]}}
    many = clean_layout({"panels": {"roof": [[c % 20, c // 20] for c in range(400)]}})
    assert len(many["panels"]["roof"]) == MAX_CELLS


def test_each_house_has_its_own_layout() -> None:
    assert clean_layouts(None) == {}
    assert clean_layouts({"classic": LAYOUT, "angle": {}, "castle": LAYOUT}) == {"classic": clean_layout(LAYOUT)}
    # Another place has its own layout of its house.
    assert clean_layouts({"cabin@01ABC": LAYOUT, "cabin@../x": LAYOUT, "castle@01ABC": LAYOUT}) == {
        "cabin@01ABC": clean_layout(LAYOUT)
    }


async def test_an_administrator_places_things(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    household = init_integration.runtime_data
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "ev_household_planner/layout", "layout": {"angle": LAYOUT}})
    msg = await client.receive_json()
    saved = {"angle": clean_layout(LAYOUT)}
    assert msg["success"] and msg["result"]["layout"] == saved
    assert household.layout == saved
    assert household._data_to_store()["layout"] == saved
    await client.send_json({"id": 2, "type": "ev_household_planner/state"})
    msg = await client.receive_json()
    assert msg["result"]["layout"]["angle"]["labels"] == {"car0": [12.0, -30.5]}
    # Someone who is not an administrator cannot.
    other = await hass_ws_client(hass, hass_read_only_access_token)
    await other.send_json({"id": 3, "type": "ev_household_planner/layout", "layout": {}})
    msg = await other.receive_json()
    assert not msg["success"] and msg["error"]["code"] == "unauthorized"
    assert household.layout == saved
    # Back to what EV Planner places by itself.
    await client.send_json({"id": 4, "type": "ev_household_planner/layout", "layout": {}})
    assert (await client.receive_json())["result"]["layout"] == {}


async def test_the_layout_comes_back_after_a_restart(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    household = init_integration.runtime_data
    household._store.async_load = AsyncMock(return_value={"layout": {"classic": {**LAYOUT, "unknown": 1}}})
    await household._async_load()
    assert household.layout == {"classic": clean_layout(LAYOUT)}
    household._store.async_load = AsyncMock(return_value={"layout": "broken"})
    await household._async_load()
    assert household.layout == {}
