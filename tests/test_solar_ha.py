"""Charging on the sun in Home Assistant: the grid meter, the current, the phases, the battery and the forecast."""

from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import (
    CHARGE_SWITCH,
    NIGHT,
    TESLA,
    SwitchCalls,
    charger_sub,
    entry_with,
    move,
    set_prices,
    set_tesla,
    settle,
    tesla_data,
    vehicle_sub,
)

AMPS = "input_number.tesla_amps"
GRID = "sensor.grid_power"
PHASES = "input_boolean.tesla_three_phases"
HOLD = "input_boolean.battery_hold"
POWER = "sensor.tesla_power"


def _entry(car: dict[str, Any] | None = None, **options: Any) -> MockConfigEntry:
    return entry_with(
        charger_sub(),
        vehicle_sub(TESLA, "Tesla", tesla_data(current_entity=AMPS, **(car or {}))),
        options={"grid_power": GRID, **options},
    )


def _grid(hass: HomeAssistant, watts: float) -> None:
    hass.states.async_set(GRID, str(watts), {"unit_of_measurement": "W", "device_class": "power"})


async def _setup(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, entry: MockConfigEntry, solar: str = "surplus"
) -> dict[str, list[ServiceCall]]:
    calls: dict[str, list[ServiceCall]] = {"amps": [], "bool": []}

    async def amps(call: ServiceCall) -> None:
        calls["amps"].append(call)
        hass.states.async_set(AMPS, str(call.data["value"]), {"min": 6, "max": 16})

    async def boolean(call: ServiceCall) -> None:
        calls["bool"].append(call)
        hass.states.async_set(call.data["entity_id"], "on" if call.service == "turn_on" else "off")

    hass.services.async_register("input_number", "set_value", amps)
    hass.services.async_register("input_boolean", "turn_on", boolean)
    hass.services.async_register("input_boolean", "turn_off", boolean)
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await entry.runtime_data.async_set_vehicle(TESLA, {"solar": solar})
    await settle(hass, freezer)
    return calls


async def _minutes(hass: HomeAssistant, freezer: FrozenDateTimeFactory, start: datetime, n: int) -> datetime:
    moment = start
    for _ in range(n):
        moment += timedelta(minutes=1)
        await move(hass, freezer, moment)
    return moment


async def test_a_car_charges_on_the_surplus_follows_it_and_stops_when_the_sun_goes(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50)
    _grid(hass, -6000)
    entry = _entry({"power_entity": POWER})
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    assert household.solar.active
    moment = await _minutes(hass, freezer, now, 2)
    assert tesla.decision.reason == "solar" and tesla.status() == "charging_solar"
    assert ("turn_on", CHARGE_SWITCH) in switches.calls
    assert calls["amps"][-1].data["value"] == 8  # 5.9 kW on three phases
    # The car draws 5.5 kW now; the house still sends 2 kW out: up to 10 A, once the sun has stayed.
    set_tesla(hass, soc=50, switch=True, charging=True)
    hass.states.async_set(POWER, "5.5", {"unit_of_measurement": "kW"})
    _grid(hass, -2000)
    moment = await _minutes(hass, freezer, moment, 5)
    assert calls["amps"][-1].data["value"] == 8
    moment = await _minutes(hass, freezer, moment, 10)
    assert calls["amps"][-1].data["value"] == 10
    state = household.solar.state(moment)
    assert state is not None and state["cars"][TESLA]["on"] and state["grid_kw"] == -2.0
    # The sun goes: after a few minutes the car stops and gets its full current back.
    _grid(hass, 3000)
    hass.states.async_set(POWER, "6.9", {"unit_of_measurement": "kW"})
    moment = await _minutes(hass, freezer, moment, 6)
    assert tesla.decision.reason != "solar"
    assert ("turn_off", CHARGE_SWITCH) in switches.calls
    assert calls["amps"][-1].data["value"] == 16


async def test_only_the_sun_makes_no_plan_and_waits(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50)
    _grid(hass, 400)
    entry = _entry()
    await _setup(hass, freezer, entry, solar="only")
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.plan is None and tesla.plan_error == "solar_only"
    assert tesla.status() == "waiting_for_sun"
    await _minutes(hass, freezer, now, 3)
    assert tesla.decision.reason == "waiting"


async def test_the_home_battery_keeps_its_sun_until_it_is_full_enough(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50)
    _grid(hass, -1000)
    hass.states.async_set("sensor.battery_level", "60", {"unit_of_measurement": "%"})
    hass.states.async_set("sensor.battery_power", "4.5", {"unit_of_measurement": "kW"})
    entry = _entry(battery_soc="sensor.battery_level", battery_power="sensor.battery_power", battery_first_until=90)
    await _setup(hass, freezer, entry)
    tesla = entry.runtime_data.vehicles[TESLA]
    moment = await _minutes(hass, freezer, now, 3)
    assert tesla.decision.reason != "solar"
    # Full enough: the battery's sun goes to the car.
    hass.states.async_set("sensor.battery_level", "92", {"unit_of_measurement": "%"})
    await _minutes(hass, freezer, moment, 3)
    assert tesla.decision.reason == "solar"
    battery = entry.runtime_data.solar.state(moment)
    assert battery is not None and battery["battery"] == {"kw": 4.5, "soc": 92.0}


async def test_one_phase_when_the_sun_is_small(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50)
    hass.states.async_set(PHASES, "on")
    _grid(hass, -2500)
    entry = _entry({"phase_entity": PHASES})
    calls = await _setup(hass, freezer, entry)
    await _minutes(hass, freezer, now, 2)
    assert hass.states.get(PHASES).state == "off"  # type: ignore[union-attr]
    assert calls["amps"][-1].data["value"] == 10  # 2.4 kW on one phase


async def test_the_sun_is_counted_and_the_battery_is_held_while_a_car_charges_from_the_grid(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50, switch=True, charging=True)
    hass.states.async_set(POWER, "6", {"unit_of_measurement": "kW"})
    _grid(hass, 1500)
    entry = _entry({"power_entity": POWER}, battery_hold=HOLD)
    calls = await _setup(hass, freezer, entry, solar="off")
    household = entry.runtime_data
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    moment = await _minutes(hass, freezer, now, 2)
    tesla = household.vehicles[TESLA]
    assert tesla.session is not None and tesla.session.energy > 0
    # 6 kW for the car, 1.5 kW bought: a quarter of it from the grid.
    assert tesla.session.solar / tesla.session.energy > 0.7
    assert [c.service for c in calls["bool"] if c.data["entity_id"] == HOLD][-1] == "turn_on"
    await household.async_set_vehicle(TESLA, {"mode": "pause"})
    set_tesla(hass, soc=50, switch=False, charging=False)
    await _minutes(hass, freezer, moment, 1)
    assert [c.service for c in calls["bool"] if c.data["entity_id"] == HOLD][-1] == "turn_off"


async def test_a_sunny_forecast_lets_the_plan_wait_for_the_sun(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=70, limit=80)
    _grid(hass, 300)
    forecast = MockConfigEntry(domain="forecast_solar")
    forecast.add_to_hass(hass)
    hours = {(now + timedelta(hours=h)).isoformat(): 9000 for h in (6, 7, 8)}
    manager = SimpleNamespace(
        data={"energy_sources": [{"type": "solar", "config_entry_solar_forecast": [forecast.entry_id]}]}
    )
    platform = AsyncMock(return_value={"wh_hours": hours})
    with (
        patch("homeassistant.components.energy.data.async_get_manager", AsyncMock(return_value=manager)),
        patch(
            "homeassistant.components.energy.websocket_api.async_get_energy_platforms",
            AsyncMock(return_value={"forecast_solar": platform}),
        ),
    ):
        entry = _entry()
        await _setup(hass, freezer, entry)
        household = entry.runtime_data
        await household.solar.async_refresh_forecast(now, force=True)
        await household.async_recalculate(force=True)
    tesla = household.vehicles[TESLA]
    # Deadline 07:00: the sun from 02 to 03 (an hour before) counts, half of it, less the house.
    assert household.solar.expected_kwh(tesla, now, tesla.deadline) > 0
    assert tesla.plan_error == "solar_expected" and tesla.status() == "waiting_for_sun"
    assert household.solar.forecast_today(now) is not None
    # Without the forecast option it is all plan again.
    assert household.solar.expected_kwh(tesla, now, None) == 0


async def test_without_a_grid_sensor_the_sun_is_off(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50)
    entry = entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data()))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    household = entry.runtime_data
    assert not household.solar.active and household.solar.state(now) is None
    assert household.solar.share_now(household.vehicles[TESLA]) == 0
    assert hass.states.get("select.tesla_solar") is None
    assert await household.solar.async_refresh_forecast(now) is False
