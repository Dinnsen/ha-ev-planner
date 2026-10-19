"""Tests for starting and stopping charging through the car or the charger."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import (
    CABLE,
    CARPORT,
    CHARGE_SWITCH,
    CHARGER_SWITCH,
    CHARGING,
    NIGHT,
    SOC,
    TESLA,
    NotifyCalls,
    SwitchCalls,
    carport_data,
    charger_sub,
    entry_with,
    move,
    set_prices,
    set_tesla,
    settle,
    tesla_data,
    vehicle_sub,
)


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, entry: MockConfigEntry) -> MockConfigEntry:
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


def _night(now: datetime, hour: int) -> datetime:
    return (now + timedelta(days=1)).replace(hour=hour, minute=0, second=0)


async def test_car_starts_and_stops_with_the_plan(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    now = dt_util.now()
    # Waiting: the switch is already off, so nothing is sent (and the car is not woken).
    assert switches.calls == []
    await move(hass, freezer, _night(now, 2))
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    assert hass.states.get("binary_sensor.tesla_charge_now").state == "on"
    assert hass.states.get("sensor.tesla_status").state == "charging"

    # Full: pause.
    hass.states.async_set(SOC, "80")
    await settle(hass, freezer)
    assert switches.calls[-1] == ("turn_off", CHARGE_SWITCH)
    assert hass.states.get("sensor.tesla_status").state == "completed"


async def test_plugging_in_pauses_a_car_that_starts_by_itself(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    assert hass.states.get("sensor.tesla_status").state == "unplugged"
    assert hass.states.get("sensor.tesla_charger_control").state == "released"

    hass.states.async_set(CABLE, "on")
    hass.states.async_set(CHARGE_SWITCH, "on")
    await settle(hass, freezer)
    assert switches.calls == [("turn_off", CHARGE_SWITCH)]


async def test_manual_start_is_respected(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    # Started by hand in the car's app: EV Planner waits for the next change of plan.
    hass.states.async_set(CHARGE_SWITCH, "on")
    await settle(hass, freezer)
    assert switches.calls == []


async def test_charge_now_mode(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": "charge_now"}, blocking=True
    )
    await settle(hass, freezer)
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    assert hass.states.get("sensor.tesla_status").state == "charging_now"

    # Full: back to smart by itself.
    hass.states.async_set(SOC, "80")
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert hass.states.get("select.tesla_mode").state == "smart"

    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": "pause"}, blocking=True
    )
    await settle(hass, freezer)
    assert hass.states.get("sensor.tesla_status").state == "paused"


async def test_low_battery_charges_right_away(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: "switch.tesla_charge_at_low_battery"}, blocking=True
    )
    hass.states.async_set(SOC, "10")
    await settle(hass, freezer)
    assert ("turn_on", CHARGE_SWITCH) in switches.calls
    assert hass.states.get("sensor.tesla_status").state == "charging_low_soc"


async def test_charging_that_does_not_start_is_retried_then_reported(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = entry_with(
        charger_sub(),
        vehicle_sub(TESLA, "Tesla", tesla_data()),
        options={"notify_services": ["notify.mobile_app_phone"]},
    )
    await _setup(hass, freezer, entry)

    start = _night(now, 2)
    await move(hass, freezer, start)
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    # The car says it is not charging: try once more after a few minutes ...
    await move(hass, freezer, start + timedelta(minutes=7))
    assert switches.calls == [("turn_on", CHARGE_SWITCH), ("turn_on", CHARGE_SWITCH)]
    assert hass.states.get("binary_sensor.tesla_charging_problem").state == "off"
    # ... then report it.
    await move(hass, freezer, start + timedelta(minutes=14))
    assert hass.states.get("binary_sensor.tesla_charging_problem").state == "on"
    problem = [call for call in notify.calls if call.get("data", {}).get("tag") == f"evp_problem_{TESLA}"]
    assert problem and problem[0]["data"]["notification_icon"] == "mdi:ev-plug-type2"


async def test_a_car_that_keeps_charging_on_pause_is_reported(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """The car starts by itself when plugged in, and the pause does not take."""
    notify = NotifyCalls(hass)
    set_prices(hass, now, NIGHT)
    set_tesla(hass, cable=False, charging=True)
    entry = entry_with(
        charger_sub(),
        vehicle_sub(TESLA, "Tesla", tesla_data()),
        options={"notify_services": ["notify.mobile_app_phone"]},
    )
    await _setup(hass, freezer, entry)
    hass.states.async_set(CABLE, "on")
    await settle(hass, freezer)
    # The switch already says off, so nothing is sent yet ...
    assert switches.calls == []
    # ... but the car still charges: pause it again, then report it.
    await move(hass, freezer, now + timedelta(minutes=7))
    assert switches.calls == [("turn_off", CHARGE_SWITCH)]
    await move(hass, freezer, now + timedelta(minutes=14))
    assert hass.states.get("binary_sensor.tesla_charging_problem").state == "on"
    problem = [call for call in notify.calls if call.get("data", {}).get("tag") == f"evp_problem_{TESLA}"]
    assert problem and "still charging" in problem[0]["message"]


async def test_a_full_car_that_does_not_charge_is_fine(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=79.5)
    entry = entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data()))
    await _setup(hass, freezer, entry)
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": "charge_now"}, blocking=True
    )
    await settle(hass, freezer)
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    await move(hass, freezer, now + timedelta(minutes=7))
    await move(hass, freezer, now + timedelta(minutes=14))
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    assert hass.states.get("binary_sensor.tesla_charging_problem").state == "off"


async def test_charging_that_starts_is_not_reported(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    start = _night(dt_util.now(), 2)
    await move(hass, freezer, start)
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    await move(hass, freezer, start + timedelta(minutes=7))
    assert switches.calls == [("turn_on", CHARGE_SWITCH)]
    assert hass.states.get("binary_sensor.tesla_charging_problem").state == "off"


async def test_charger_control_and_errors(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """A car started and stopped by the charger's switch."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    hass.states.async_set(CHARGER_SWITCH, "on")
    entry = entry_with(
        charger_sub(carport_data(switch_entity=CHARGER_SWITCH)),
        vehicle_sub(TESLA, "Tesla", tesla_data(control="charger", control_entity=None, charger=CARPORT)),
    )
    await _setup(hass, freezer, entry)
    # Waiting: the charger's switch is turned off.
    assert switches.calls == [("turn_off", CHARGER_SWITCH)]
    await move(hass, freezer, _night(now, 2))
    assert switches.calls[-1] == ("turn_on", CHARGER_SWITCH)


async def test_switch_errors_are_kept(
    hass: HomeAssistant, switches: SwitchCalls, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    switches.error = "boom"
    hass.states.async_set(CHARGE_SWITCH, "on")
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    hass.states.async_set(CABLE, "on")
    await settle(hass, freezer)
    assert hass.states.get("sensor.tesla_status").attributes["control_error"] == "boom"


async def test_switching_reports_errors(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    household = init_integration.runtime_data
    calls: list[str] = []

    async def fail(call: ServiceCall) -> None:
        raise HomeAssistantError("no way")

    async def record(call: ServiceCall) -> None:
        calls.append(f"{call.domain}.{call.service}")

    hass.services.async_register("input_boolean", "turn_on", fail)
    hass.services.async_register("input_boolean", "turn_off", record)
    hass.services.async_register("homeassistant", "turn_on", record)
    assert await household._async_switch("input_boolean.x", True) == "no way"
    assert await household._async_switch("input_boolean.x", False) is None
    assert await household._async_switch("lock.x", True) is None
    assert calls == ["input_boolean.turn_off", "homeassistant.turn_on"]
    # A domain without the action.
    assert await household._async_switch("fan.x", True)


@pytest.mark.parametrize("control", ["car", "charger"])
async def test_missing_control_entity(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls, control: str
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, switch=True)
    entry = entry_with(vehicle_sub(TESLA, "Tesla", tesla_data(control=control, control_entity=None, charger=None)))
    await _setup(hass, freezer, entry)
    assert hass.states.get("sensor.tesla_status").attributes["control_error"] == "no_control_entity"
    assert switches.calls == []


async def test_battery_capacity_from_the_car(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """A capacity sensor replaces the number from the setup while it has a value."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    hass.states.async_set("sensor.tesla_capacity", "75000", {"unit_of_measurement": "Wh"})
    entry = entry_with(vehicle_sub(TESLA, "Tesla", tesla_data(capacity_entity="sensor.tesla_capacity", charger=None)))
    await _setup(hass, freezer, entry)
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.capacity == 75
    assert tesla.plan is not None and tesla.plan.energy == pytest.approx(25)

    hass.states.async_set("sensor.tesla_capacity", "unavailable")
    await settle(hass, freezer)
    assert tesla.capacity == 60
    assert tesla.plan is not None and tesla.plan.energy == pytest.approx(20)
