"""The home as a place of its own, with the sun, a home battery and a heat pump as its parts."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant import config_entries
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.const import SITE_HOME
from custom_components.ev_household_planner.websocket import panel_state

from .conftest import NIGHT, SwitchCalls, entry_with, set_prices, set_tesla, settle, vehicle_sub

TESLA = "tesla_id"
OLD = {
    "currency": "DKK",
    "price_add": 0.5,
    "supply_limit": 23,
    "supply_phases": "3",
    "supply_reserve": 4,
    "supply_guard": True,
    "weather_entity": "weather.home",
    "heat_pump_power": "sensor.heat_pump",
    "grid_power": "sensor.grid",
    "grid_power_inverted": True,
    "export_price": 0.4,
    "solar_power": "sensor.panels",
    "solar_forecast": False,
    "battery_soc": "sensor.battery",
    "battery_first_until": 80,
}


def _parts(entry: MockConfigEntry) -> dict[str, Any]:
    return {
        sub.subentry_type: sub for sub in entry.subentries.values() if sub.subentry_type not in ("vehicle", "charger")
    }


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, now: datetime, entry: MockConfigEntry) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=40)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)


async def test_an_old_households_settings_move_to_its_home_and_its_parts(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    entry = entry_with(vehicle_sub(TESLA, "Tesla", {"battery_capacity": 60.0}), options=dict(OLD))
    await _setup(hass, freezer, now, entry)
    # What is the whole household's stays; the rest is gone from there.
    assert entry.options == {"currency": "DKK", "notify_services": [], "price_add": 0.5}
    parts = _parts(entry)
    assert set(parts) == {"site", "solar", "battery", "heat_pump"}
    assert parts["site"].title == "Home"
    assert dict(parts["site"].data) == {
        "home": True,
        "supply_limit": 23,
        "supply_phases": "3",
        "supply_reserve": 4,
        "supply_guard": True,
        "weather_entity": "weather.home",
        "grid_power": "sensor.grid",
        "grid_power_inverted": True,
        "export_price": 0.4,
    }
    assert dict(parts["solar"].data) == {"solar_power": "sensor.panels", "solar_forecast": False}
    assert dict(parts["battery"].data) == {"battery_soc": "sensor.battery", "battery_first_until": 80}
    assert dict(parts["heat_pump"].data) == {"heat_pump_power": "sensor.heat_pump"}

    # And the household works as before, from the new place.
    household = entry.runtime_data
    assert household.supply.limit == 23 and household.supply.reserve == 4
    assert household.solar.active
    assert household.export_price() == 0.4
    home = panel_state(hass, household)["sites"][0]
    assert home["id"] == SITE_HOME and home["home"] is True
    assert home["parts"] == ["battery", "heat_pump", "solar"]

    # Set up again, nothing is moved twice.
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert set(_parts(entry)) == {"site", "solar", "battery", "heat_pump"}
    assert len(entry.subentries) == 5


async def test_a_new_household_gets_a_home_and_nothing_else(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    parts = _parts(init_integration)
    assert set(parts) == {"site"}
    assert dict(parts["site"].data) == {"home": True}
    household = init_integration.runtime_data
    assert list(household.sites) == [SITE_HOME]
    assert not household.supply.active and not household.solar.active


async def test_the_home_is_changed_as_a_place(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    home = _parts(init_integration)["site"]
    result = await init_integration.start_subentry_reconfigure_flow(hass, home.subentry_id)
    assert result["type"] is FlowResultType.FORM
    # The home has no zone to choose: it is where a car's location says "home".
    assert "zone" not in {str(key) for key in result["data_schema"].schema}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Hjemme",
            "supply": {"supply_limit": 25, "supply_phases": "3", "supply_meter": [], "supply_reserve": 0},
            "grid": {"grid_power": "sensor.grid", "export_price": 0.3},
        },
    )
    assert result["type"] is FlowResultType.ABORT
    await hass.async_block_till_done()
    home = _parts(init_integration)["site"]
    assert home.title == "Hjemme"
    assert dict(home.data) == {
        "home": True,
        "supply_limit": 25,
        "supply_phases": "3",
        "supply_reserve": 0,
        "supply_share": "queue",
        "grid_power": "sensor.grid",
        "export_price": 0.3,
    }
    household = init_integration.runtime_data
    assert household.sites[SITE_HOME].name == "Hjemme"
    assert household.supply.limit == 25 and household.supply.reserve == 0
    assert household.solar.active


async def test_the_sun_a_battery_and_a_heat_pump_are_added_as_parts_one_of_each_for_a_place(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    async def add(kind: str, data: dict[str, Any]) -> Any:
        result = await hass.config_entries.subentries.async_init(
            (init_integration.entry_id, kind), context={"source": config_entries.SOURCE_USER}
        )
        assert result["type"] is FlowResultType.FORM
        # One place: no place to choose.
        assert "site" not in {str(key) for key in result["data_schema"].schema}
        return await hass.config_entries.subentries.async_configure(result["flow_id"], data)

    result = await add("solar", {"name": "Taget", "solar_power": "sensor.panels", "solar_forecast": True})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    result = await add("battery", {"name": "Batteri", "battery_soc": "sensor.battery", "battery_first_until": 70})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    result = await add("heat_pump", {"name": "Varmepumpe", "heat_pump_power": "sensor.heat_pump"})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    household = init_integration.runtime_data
    home = household.sites[SITE_HOME]
    assert sorted(home.parts) == ["battery", "heat_pump", "solar"]
    assert home.data["solar_power"] == "sensor.panels"
    assert home.data["battery_soc"] == "sensor.battery"
    assert household.solar.battery_first_until == 70
    assert home.data["heat_pump_power"] == "sensor.heat_pump"

    # A second one for the same place is refused.
    result = await add("solar", {"name": "Garagen", "solar_power": "sensor.other"})
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "already_there"}

    # Changed, it is the same part with new values.
    solar = _parts(init_integration)["solar"]
    result = await init_integration.start_subentry_reconfigure_flow(hass, solar.subentry_id)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": "Taget", "solar_power": "sensor.new_panels", "solar_forecast": False}
    )
    assert result["type"] is FlowResultType.ABORT
    await hass.async_block_till_done()
    assert init_integration.runtime_data.sites[SITE_HOME].data["solar_power"] == "sensor.new_panels"


async def test_a_summer_house_has_its_own_sun(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    def sub(kind: str, sid: str, title: str, data: dict[str, Any]) -> ConfigSubentryDataWithId:
        return ConfigSubentryDataWithId(data=data, subentry_id=sid, subentry_type=kind, title=title, unique_id=None)

    entry = entry_with(
        sub("site", "summer", "Sommerhus", {"zone": "zone.sommerhus", "grid_power": "sensor.summer_grid"}),
        sub("solar", "summer_sun", "Sommerhusets tag", {"site": "summer", "solar_power": "sensor.summer_panels"}),
        sub("battery", "home_battery", "Batteri", {"battery_soc": "sensor.battery"}),
        vehicle_sub(TESLA, "Tesla", {"battery_capacity": 60.0}),
        options={"currency": "DKK"},
    )
    hass.states.async_set("sensor.summer_grid", "-3000", {"unit_of_measurement": "W"})
    hass.states.async_set("sensor.summer_panels", "4000", {"unit_of_measurement": "W"})
    await _setup(hass, freezer, now, entry)
    household = entry.runtime_data
    assert list(household.sites) == [SITE_HOME, "summer"]
    # The sun is the summer house's; the battery is the home's.
    assert household.solars["summer"].active and not household.solar.active
    assert household.sites["summer"].parts == {"solar": "summer_sun"}
    assert household.sites[SITE_HOME].parts == {"battery": "home_battery"}
    assert "battery_soc" not in household.sites["summer"].data
    summer = panel_state(hass, household)["sites"][1]
    assert summer["name"] == "Sommerhus" and summer["parts"] == ["solar"]
    assert summer["energy"]["grid_kw"] == -3.0 and summer["energy"]["solar_kw"] == 4.0
    assert panel_state(hass, household)["sites"][0]["energy"] is None
