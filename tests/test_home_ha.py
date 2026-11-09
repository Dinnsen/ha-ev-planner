"""The home as the Energy dashboard sees it: the Home tab's numbers and the whole house's history."""

from __future__ import annotations

from datetime import timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.ev_household_planner.home import HomeInfo

PREFS: dict[str, Any] = {
    "energy_sources": [
        {
            "type": "grid",
            "stat_energy_from": "sensor.grid_energy",
            "power_config": {"stat_rate": "sensor.grid_power"},
        },
        {"type": "solar", "stat_energy_from": "sensor.solar_energy", "stat_rate": "sensor.solar_power"},
        {"type": "battery", "power_config": {"stat_rate_inverted": "sensor.battery_power"}},
        {"type": "gas", "stat_energy_from": "sensor.gas"},
    ],
    "device_consumption": [
        {"stat_consumption": "sensor.pump_energy", "stat_rate": "sensor.pump_power", "name": "Varmepumpe"},
        {"stat_consumption": "sensor.fridge_energy"},
        {"name": "nothing"},
    ],
}


def _manager(prefs: dict[str, Any] | None) -> Any:
    return patch(
        "homeassistant.components.energy.data.async_get_manager",
        AsyncMock(return_value=SimpleNamespace(data=prefs)),
    )


def _set(hass: HomeAssistant, entity: str, value: float, unit: str = "W") -> None:
    hass.states.async_set(entity, str(value), {"unit_of_measurement": unit})


async def test_the_home_tab_reads_the_energy_dashboard(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    household = init_integration.runtime_data
    home: HomeInfo = household.home
    _set(hass, "sensor.grid_power", 2500)
    _set(hass, "sensor.solar_power", 1.5, "kW")
    _set(hass, "sensor.battery_power", -500)  # an inverted sensor: the battery gives 0.5 kW
    _set(hass, "sensor.pump_power", 800)
    hass.states.async_set("sensor.fridge_energy", "3", {"friendly_name": "Fridge"})
    with _manager(PREFS):
        assert await home.async_refresh(dt_util.now(), force=True)
        # Read a moment ago: not again.
        assert not await home.async_refresh(dt_util.now())
    assert home.grid_power_entity == "sensor.grid_power"
    assert home.solar_power_entity == "sensor.solar_power" and home.has_solar
    state = home.state(dt_util.now())
    assert state is not None
    assert state["grid_kw"] == 2.5 and state["solar_kw"] == 1.5 and state["battery_kw"] == -0.5
    assert state["house_kw"] == pytest.approx(4.5)
    assert state["heat_pump_kw"] == 0.8
    assert [d["name"] for d in state["devices"]] == ["Varmepumpe", "Fridge"]
    assert state["devices"][1]["kw"] is None and state["history"] is True


async def test_grid_power_in_two_sensors_and_nothing_to_show(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    home: HomeInfo = init_integration.runtime_data.home
    prefs = {
        "energy_sources": [
            {
                "type": "grid",
                "flow_from": [{"stat_energy_from": "sensor.old_grid"}],
                "power_config": {"stat_rate_from": "sensor.in", "stat_rate_to": "sensor.out"},
            }
        ]
    }
    _set(hass, "sensor.in", 3000)
    _set(hass, "sensor.out", 1000)
    with _manager(prefs):
        assert await home.async_refresh(dt_util.now(), force=True)
    assert home.grid_energy == ["sensor.old_grid"]
    assert home.grid_power_entity is None  # two sensors: not one EV Planner could use as the grid's power
    assert home.grid_kw() == 2.0
    hass.states.async_set("sensor.in", "unavailable")
    assert home.grid_kw() is None
    with _manager({}):
        await home.async_refresh(dt_util.now(), force=True)
    assert home.state(dt_util.now()) is None
    # No Energy dashboard at all.
    with patch(
        "homeassistant.components.energy.data.async_get_manager", AsyncMock(side_effect=RuntimeError("no energy"))
    ):
        assert not await home.async_refresh(dt_util.now(), force=True)


async def test_the_heat_pump_set_in_the_options_comes_first(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    household = init_integration.runtime_data
    home: HomeInfo = household.home
    _set(hass, "sensor.chosen", 1200)
    assert home.heat_pump_kw() is None
    hass.config_entries.async_update_entry(
        init_integration, options={**init_integration.options, "heat_pump_power": "sensor.chosen"}
    )
    await hass.async_block_till_done()
    assert init_integration.runtime_data.home.heat_pump_kw() == 1.2


async def test_the_whole_house_history(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    home: HomeInfo = init_integration.runtime_data.home
    with _manager(PREFS):
        await home.async_refresh(dt_util.now(), force=True)
    day = dt_util.start_of_local_day()
    hours = {day + timedelta(hours=h): 0.5 + h / 10 for h in range(3)}

    async def change(ids: set[str], start: Any, end: Any, unit: str) -> dict[Any, float]:
        if any(i.endswith("_cost") for i in ids):
            return {day: 1.25}
        return hours

    with patch.object(home, "_async_change", side_effect=change):
        result = await home.async_history("day", day, day + timedelta(days=1))
        assert result["unit"] == "hour"
        assert [row["kwh"] for row in result["rows"]] == [0.5, 0.6, 0.7]
        assert result["rows"][0]["cost"] == 1.25 and result["rows"][1]["cost"] is None
        assert result["typical_day"][day.hour] == 0.5
        client = await hass_ws_client(hass)
        await client.send_json(
            {
                "id": 1,
                "type": "ev_household_planner/history",
                "period": "year",
                "start": day.isoformat(),
                "end": (day + timedelta(days=1)).isoformat(),
            }
        )
        msg = await client.receive_json()
        assert msg["success"] and msg["result"]["unit"] == "month"
        await client.send_json(
            {"id": 2, "type": "ev_household_planner/history", "period": "day", "start": "x", "end": "y"}
        )
        msg = await client.receive_json()
        assert not msg["success"]
    # Without the recorder: nothing, and no error.
    assert await home._async_change({"sensor.grid_energy"}, day, day + timedelta(days=1), "hour") == {}
    with _manager({}):
        await home.async_refresh(dt_util.now(), force=True)
    assert (await home.async_history("week", day, day + timedelta(days=7)))["rows"] == []


async def test_statistics_rows_are_summed_per_period(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    home: HomeInfo = init_integration.runtime_data.home
    day = dt_util.start_of_local_day()
    rows = {
        "a": [{"start": day.timestamp(), "change": 1.0}, {"start": day.timestamp() + 3600, "change": None}],
        "b": [{"start": day, "change": 2.0}, {"start": None, "change": 1.0}],
    }
    recorder = SimpleNamespace(async_add_executor_job=AsyncMock(return_value=rows))
    with patch("homeassistant.components.recorder.get_instance", return_value=recorder):
        totals = await home._async_change({"a", "b"}, day, day + timedelta(hours=2), "hour")
    assert totals == {day: 3.0}
