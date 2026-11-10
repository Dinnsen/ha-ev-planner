"""Control that holds when things fail: commands that do not get through, a meter that stops, a restart."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any
from unittest.mock import PropertyMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.const import (
    COMMANDS_PER_HOUR,
    CONTROL_BACKOFF,
    CONTROL_CHARGE,
    CONTROL_FAILS_ISSUE,
    CONTROL_PAUSE,
    CONTROL_RELEASED,
    DOMAIN,
    ISSUE_CONTROL_FAILED,
    MIN_REST,
    SAVE_COUNTERS,
)
from custom_components.ev_household_planner.planner import PriceSlot
from custom_components.ev_household_planner.rules import Decision
from custom_components.ev_household_planner.solar_control import SolarControl
from custom_components.ev_household_planner.supply_control import METER_STALE
from custom_components.ev_household_planner.vehicle import Vehicle
from custom_components.ev_household_planner.websocket import vehicle_state

from .conftest import CHARGE_SWITCH, CHARGING, NIGHT, TESLA, SwitchCalls, set_prices, set_tesla, settle
from .test_supply_ha import AMPS, METER, _entry, _setup, _skoda

BLOCK = "switch.heat_pump_block"


def _tesla(entry: MockConfigEntry) -> Vehicle:
    vehicle: Vehicle = entry.runtime_data.vehicles[TESLA]
    return vehicle


def _decide(vehicle: Vehicle, control: str) -> None:
    vehicle.decision = Decision(control, "planned" if control == CONTROL_CHARGE else "waiting")
    vehicle.last_sent = None


# ----------------------------------------------------------------------
# Commands


async def test_a_stop_always_goes_out_and_a_start_leaves_room_for_one(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry
) -> None:
    household = init_integration.runtime_data
    vehicle = _tesla(init_integration)
    moment = dt_util.now()
    # One command left in the hour: it is kept for a stop.
    vehicle.sent_log = [moment] * (COMMANDS_PER_HOUR - 1)
    _decide(vehicle, CONTROL_CHARGE)
    switches.calls.clear()
    assert not await household._async_apply(vehicle, force=False)
    assert vehicle.control_error == "rate_limited"
    assert switches.calls == []
    # The stop goes out, also when the hour is used up.
    vehicle.sent_log = [moment] * (COMMANDS_PER_HOUR + 3)
    hass.states.async_set(CHARGE_SWITCH, "on")
    _decide(vehicle, CONTROL_PAUSE)
    assert await household._async_apply(vehicle, force=False)
    assert switches.calls == [("turn_off", CHARGE_SWITCH)]
    assert vehicle.control_error is None


async def test_commands_that_fail_wait_longer_each_time_and_are_reported(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    vehicle = _tesla(init_integration)
    issues = ir.async_get(hass)
    issue_id = f"{ISSUE_CONTROL_FAILED}_{TESLA}"
    switches.error = "cloud down"
    _decide(vehicle, CONTROL_CHARGE)
    switches.calls.clear()
    for count in range(1, CONTROL_FAILS_ISSUE + 1):
        assert issues.async_get_issue(DOMAIN, issue_id) is None
        assert not await household._async_apply(vehicle, force=False)
        assert vehicle.fail_count == count
        assert vehicle.retry_after == dt_util.now() + CONTROL_BACKOFF[count - 1]
        # Not before its time, also not when the check asks.
        assert not await household._async_apply(vehicle, force=True)
        assert len(switches.calls) == count
        freezer.tick(CONTROL_BACKOFF[count - 1])
    issue = issues.async_get_issue(DOMAIN, issue_id)
    assert issue is not None and issue.translation_placeholders == {
        "name": "Tesla",
        "entity_id": CHARGE_SWITCH,
        "error": "cloud down",
    }
    # The guard does not wait.
    vehicle.retry_after = dt_util.now() + timedelta(minutes=5)
    hass.states.async_set(CHARGE_SWITCH, "on")
    assert not await household.async_pause_for_house(vehicle)
    assert switches.calls[-1] == ("turn_off", CHARGE_SWITCH)
    # It gets through: all is forgotten.
    switches.error = None
    assert await household.async_pause_for_house(vehicle)
    assert vehicle.fail_count == 0 and vehicle.retry_after is None
    assert issues.async_get_issue(DOMAIN, issue_id) is None


async def test_a_command_that_failed_is_tried_again_quietly_and_forgotten_when_let_go(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    """A Tesla that is plugged in starts by itself and is not awake yet: the stop does not get through.

    The panel shows when it is tried again, until it has failed so often that it is a problem. Set to
    Off, EV Planner lets go of the car, and what failed is no longer anything to report.
    """
    household = init_integration.runtime_data
    vehicle = _tesla(init_integration)
    issues = ir.async_get(hass)
    issue_id = f"{ISSUE_CONTROL_FAILED}_{TESLA}"
    switches.error = "vehicle is offline"
    hass.states.async_set(CHARGE_SWITCH, "on")
    _decide(vehicle, CONTROL_PAUSE)
    assert not await household._async_apply(vehicle, force=True)
    shown = vehicle_state(household, vehicle)
    assert shown["control_error"] == "vehicle is offline"
    assert shown["control_retry"] == (dt_util.now() + CONTROL_BACKOFF[0]).isoformat()
    for count in range(2, CONTROL_FAILS_ISSUE + 1):
        freezer.tick(CONTROL_BACKOFF[count - 2])
        assert not await household._async_apply(vehicle, force=True)
    # Failed time after time: now it is a problem, and a repair.
    assert vehicle_state(household, vehicle)["control_retry"] is None
    assert issues.async_get_issue(DOMAIN, issue_id) is not None
    # Off: EV Planner lets go of the car, and the error goes with it.
    vehicle.decision = Decision(CONTROL_RELEASED, "off")
    assert not await household._async_apply(vehicle, force=False)
    assert vehicle.control_error is None and vehicle.fail_count == 0 and vehicle.retry_after is None
    assert issues.async_get_issue(DOMAIN, issue_id) is None
    shown = vehicle_state(household, vehicle)
    assert shown["control_error"] is None and shown["control_retry"] is None


async def test_a_command_that_failed_is_forgotten_when_the_car_is_as_decided(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry
) -> None:
    household = init_integration.runtime_data
    vehicle = _tesla(init_integration)
    switches.error = "vehicle is offline"
    hass.states.async_set(CHARGE_SWITCH, "on")
    _decide(vehicle, CONTROL_PAUSE)
    assert not await household._async_apply(vehicle, force=True)
    assert vehicle.fail_count == 1
    # The car stopped all the same: there is nothing to send, and nothing to report.
    hass.states.async_set(CHARGE_SWITCH, "off")
    assert await household._async_apply(vehicle, force=True)
    assert vehicle.control_error is None and vehicle.fail_count == 0 and vehicle.retry_after is None


async def test_a_car_that_was_paused_rests_before_it_starts_again(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    vehicle = _tesla(init_integration)
    hass.states.async_set(CHARGE_SWITCH, "on")
    _decide(vehicle, CONTROL_PAUSE)
    assert await household._async_apply(vehicle, force=False)
    assert vehicle.paused_at == dt_util.now()
    switches.calls.clear()
    vehicle.decision = Decision(CONTROL_CHARGE, "planned")
    assert not await household._async_apply(vehicle, force=False)
    assert switches.calls == []
    freezer.tick(MIN_REST)
    assert await household._async_apply(vehicle, force=False)
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    assert vehicle.paused_at is None
    # Asked for by hand, it starts at once.
    vehicle.paused_at = dt_util.now()
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    assert vehicle.paused_at is None


async def test_a_charging_sensor_that_does_not_answer_is_asked_again(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    vehicle = _tesla(init_integration)
    hass.states.async_set(CHARGING, "unavailable")
    await settle(hass, freezer)
    assert vehicle.charging is None
    vehicle.decision = Decision(CONTROL_CHARGE, "planned")
    household._watch_verify(vehicle)
    household._verify_timers.pop(TESLA)()
    await household._async_verify(TESLA)
    assert household._verify_unknown[TESLA] == 1
    assert TESLA in household._verify_timers
    # Back again: checked as always.
    hass.states.async_set(CHARGING, "on")
    await hass.async_block_till_done()
    household._verify_timers.pop(TESLA)()
    await household._async_verify(TESLA)
    assert TESLA not in household._verify_unknown
    household._watch_verify(vehicle)


# ----------------------------------------------------------------------
# Writing to disk, the prices


async def test_counters_are_written_now_and_then_and_never_put_a_save_off(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    await settle(hass, freezer)
    household._save_due = None
    household.async_save(SAVE_COUNTERS)
    slow = household._save_due
    assert slow is not None
    # A minute's energy more does not move it; a changed setting brings it forward.
    household.async_save(SAVE_COUNTERS)
    assert household._save_due == slow
    household.async_save()
    assert household._save_due is not None and household._save_due < slow
    soon = household._save_due
    household.async_save(SAVE_COUNTERS)
    assert household._save_due == soon
    household._data_to_store()
    assert household._save_due is None


async def test_the_prices_are_read_once_and_an_amount_is_added(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    _skoda(hass)
    entry = _entry(price_add=0.25, export_price=0.4)
    await _setup(hass, freezer, entry)
    household = entry.runtime_data
    slots: list[PriceSlot] = household.price_slots()
    assert slots[0].price == pytest.approx(NIGHT[0] + 0.25)
    # The same sensor state: the same slots, in a list of the caller's own.
    again = household.price_slots()
    assert again is not slots and again[0] is slots[0]
    set_prices(hass, now, [9.0, *NIGHT[1:]])
    assert household.price_slots()[0].price == pytest.approx(9.25)
    # A kWh of the sun costs what it would have been sold for.
    assert household.export_price() == 0.4
    hass.states.async_set("sensor.sell", "0.6")
    config = {**household.config, "export_price_entity": "sensor.sell"}
    with patch.object(type(household), "config", new_callable=PropertyMock, return_value=config):
        assert household.export_price() == 0.6
        hass.states.async_set("sensor.sell", "unknown")
        assert household.export_price() == 0.4
    vehicle = household.vehicles[TESLA]
    vehicle.months.clear()
    vehicle.add_energy(dt_util.now(), 10, 2.0, solar=4, solar_price=0.5)
    assert next(iter(vehicle.months.values()))["cost"] == pytest.approx(6 * 2.0 + 4 * 0.5)


# ----------------------------------------------------------------------
# The shared supply


async def test_a_meter_that_has_stopped_is_no_reading(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    assert supply._meter_reading() == 10
    # Milliamps are amps too.
    hass.states.async_set(METER, "12500", {"unit_of_measurement": "mA"})
    assert supply._meter_reading() == 12.5
    freezer.tick(METER_STALE - timedelta(seconds=1))
    assert supply._meter_reading() == 12.5
    freezer.tick(timedelta(seconds=2))
    assert supply._meter_reading() is None
    assert supply.house_now() is None
    # Reported again, with the same value: it is a reading.
    hass.states.async_set(METER, "12500", {"unit_of_measurement": "mA"}, force_update=True)
    assert supply._meter_reading() == 12.5


async def test_a_stop_that_fails_is_not_counted_as_done(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    hass.states.async_set(CHARGE_SWITCH, "on")
    household.vehicles[TESLA].last_sent = None
    calls.clear()
    switches.calls.clear()
    switches.error = "cloud down"
    hass.states.async_set(METER, "40", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert ("turn_off", CHARGE_SWITCH) in switches.calls
    assert TESLA not in supply._paused
    # The next reading tries again, and now it stops.
    switches.error = None
    switches.calls.clear()
    hass.states.async_set(METER, "41", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert ("turn_off", CHARGE_SWITCH) in switches.calls
    assert TESLA in supply._paused


async def test_readings_that_come_while_the_guard_runs_give_one_more_run(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    runs: list[datetime] = []

    async def guard(moment: datetime) -> None:
        runs.append(moment)
        if len(runs) == 1:
            # Two readings while the first run is at work.
            hass.states.async_set(METER, "11", {"unit_of_measurement": "A"})
            hass.states.async_set(METER, "12", {"unit_of_measurement": "A"})
            await asyncio.sleep(0)
            await asyncio.sleep(0)

    supply.async_guard = guard  # type: ignore[method-assign]
    hass.states.async_set(METER, "10.5", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert len(runs) == 2
    assert not supply._guard_running


async def test_a_heat_pump_held_back_when_home_assistant_stopped_is_let_go(
    hass: HomeAssistant,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
    hass_storage: dict[str, Any],
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    hass.states.async_set(BLOCK, "on")
    entry = _entry(supply_meter=[METER], supply_guard=True, heat_pump_block=BLOCK)
    key = f"{DOMAIN}.{entry.entry_id}"
    hass_storage[key] = {"version": 1, "minor_version": 1, "key": key, "data": {"actuators": {"heat_pump_held": True}}}
    await _setup(hass, freezer, entry)
    assert ("turn_off", BLOCK) in switches.calls
    supply = entry.runtime_data.supply
    assert supply.actuators_to_store() == {"heat_pump_held": False}
    assert await supply._async_hold_heat_pump(dt_util.now()) > 0
    assert supply.actuators_to_store() == {"heat_pump_held": True}
    await supply.async_release_heat_pump(dt_util.now(), force=True)
    assert supply.actuators_to_store() == {"heat_pump_held": False}


async def test_a_current_that_is_there_already_is_not_sent_again(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    entry = _entry()
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    vehicle = household.vehicles[TESLA]
    moment = dt_util.now()
    hass.states.async_set(AMPS, "10", {"min": 6, "max": 16})
    calls.clear()
    assert await supply.async_keep_current(vehicle, AMPS, 10.0, moment)
    assert not calls and supply._sent[TESLA] == (10.0, moment)
    assert await supply.async_keep_current(vehicle, AMPS, 10.0, moment + timedelta(minutes=1))
    assert not calls and supply._sent[TESLA] == (10.0, moment)
    assert await supply.async_keep_current(vehicle, AMPS, 8.0, moment + timedelta(minutes=2))
    assert [call.data["value"] for call in calls] == [8.0]


def test_what_the_sun_put_aside_survives_a_restart() -> None:
    household: Any = type("Household", (), {"hass": None, "config": {}})()
    solar = SolarControl(household)
    solar._restore = {"car"}
    solar._phases_sent = {"car": 1}
    stored = solar.to_store()
    assert stored == {"states": {}, "restore": ["car"], "phases": {"car": 1}}
    again = SolarControl(household)
    again.load(stored)
    assert again._restore == {"car"} and again._phases_sent == {"car": 1}
    # As it was stored before: each car's state under its own name.
    old = SolarControl(household)
    old.load({"car": {"on": True}})
    assert set(old.controller.states) == {"car"} and old._restore == set()
    old.load(None)
