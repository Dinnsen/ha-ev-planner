"""A charge from plug-in to unplug, energy by the time it took, and commands that do not take."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import (
    CABLE,
    CHARGE_SWITCH,
    CHARGING,
    SOC,
    TESLA,
    NotifyCalls,
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

POWER = "sensor.tesla_power"
# From 20:00: the cheap hours are midnight and 03, with dearer hours between them.
TWO_NIGHTS = [3.0, 3.0, 3.0, 3.0, 0.5, 2.0, 2.0, 0.6, 3.0, 3.0, 3.0]


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, entry: MockConfigEntry) -> MockConfigEntry:
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


async def _mode(hass: HomeAssistant, option: str) -> None:
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": option}, blocking=True
    )


def _at(now: datetime, hour: int, minute: int = 0) -> datetime:
    day = now if hour >= 12 else now + timedelta(days=1)
    return day.replace(hour=hour, minute=minute, second=0, microsecond=0)


async def test_a_plan_in_two_periods_is_one_charge_in_the_history(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    entry = await _setup(
        hass,
        freezer,
        entry_with(
            charger_sub(),
            vehicle_sub(TESLA, "Tesla", tesla_data()),
            options={"notify_services": ["notify.mobile_app_phone"]},
        ),
    )
    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: "switch.tesla_notify_when_charged"}, blocking=True
    )
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.plan is not None and len(tesla.plan.segments) == 2

    # The first period: 15 % in the hour, as planned.
    await move(hass, freezer, _at(now, 0, 1))
    assert switches.calls[-1] == ("turn_on", CHARGE_SWITCH)
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    hass.states.async_set(SOC, "65", {"unit_of_measurement": "%"})
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 1, 0))
    assert switches.calls[-1] == ("turn_off", CHARGE_SWITCH)
    hass.states.async_set(CHARGING, "off")
    await settle(hass, freezer)
    paused = [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_done_{TESLA}"]
    assert paused and paused[-1]["message"].startswith("Paused at 65 % of 80 %")
    # Paused, still plugged in: nothing in the history yet.
    assert tesla.history == []
    assert tesla.session is not None and len(tesla.session.periods) == 1

    # The second period: the car takes up charging again, and that is learned.
    await move(hass, freezer, _at(now, 3, 1))
    assert switches.calls[-1] == ("turn_on", CHARGE_SWITCH)
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    assert tesla.learned.resumes is True
    await move(hass, freezer, _at(now, 3, 30))
    hass.states.async_set(SOC, "80", {"unit_of_measurement": "%"})
    hass.states.async_set(CHARGING, "off")
    await settle(hass, freezer)
    assert tesla.history == []

    # Unplugged for a moment only (a sensor that blinks): still one charge.
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 3, 31))
    hass.states.async_set(CABLE, "on")
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 3, 35))
    assert tesla.history == [] and tesla.session is not None

    # Unplugged for real: one entry with both periods.
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 3, 38))
    assert tesla.session is None
    assert len(tesla.history) == 1
    entry_ = tesla.history[0]
    assert entry_["start_soc"] == 50 and entry_["end_soc"] == 80
    assert entry_["energy"] == pytest.approx(20, abs=0.1)  # 30 % at 15 %/h and 10 kW
    assert len(entry_["periods"]) == 2
    assert entry_["plugged"] is True and entry_["source"] == "soc"
    assert tesla.month(dt_util.now())["sessions"] == 1


async def test_without_a_plug_sensor_a_blip_joins_the_next_charge(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    hass.states.async_set(POWER, "0", {"unit_of_measurement": "kW"})
    entry = await _setup(
        hass,
        freezer,
        entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data(connected_entity=None, power_entity=POWER))),
    )
    tesla = entry.runtime_data.vehicles[TESLA]
    assert not tesla.plug_sessions

    async def charge(minutes: int) -> None:
        await _mode(hass, "charge_now")
        hass.states.async_set(CHARGING, "on")
        hass.states.async_set(POWER, "10", {"unit_of_measurement": "kW"})
        await settle(hass, freezer)
        start = dt_util.now()
        for minute in range(1, minutes + 1):
            await move(hass, freezer, start + timedelta(minutes=minute))
        hass.states.async_set(CHARGING, "off")
        await _mode(hass, "pause")
        await settle(hass, freezer)
        hass.states.async_set(POWER, "0", {"unit_of_measurement": "kW"})
        await settle(hass, freezer)

    # A minute of charging and no rise in the level: a blip, kept for the next charge.
    await charge(1)
    assert tesla.history == []
    assert tesla.session is not None and 0.1 < tesla.session.energy < 0.5
    await move(hass, freezer, dt_util.now() + timedelta(hours=1))
    await charge(30)
    assert len(tesla.history) == 1
    assert len(tesla.history[0]["periods"]) == 2
    assert tesla.history[0]["energy"] == pytest.approx(31 / 60 * 10, abs=0.2)
    assert tesla.history[0]["plugged"] is False

    # A blip with nothing after it is left out of the history.
    await charge(1)
    assert tesla.session is not None
    await move(hass, freezer, dt_util.now() + timedelta(hours=6, minutes=1))
    assert tesla.session is None
    assert len(tesla.history) == 1


async def test_a_short_charge_counts_the_seconds_it_took(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """A car that charges for ten seconds draws for ten seconds, not for a whole minute."""
    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    hass.states.async_set(POWER, "10", {"unit_of_measurement": "kW"})
    entry = await _setup(
        hass, freezer, entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data(power_entity=POWER)))
    )
    tesla = entry.runtime_data.vehicles[TESLA]
    await _mode(hass, "charge_now")
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    start = dt_util.now()
    await move(hass, freezer, start + timedelta(seconds=58))
    await move(hass, freezer, start + timedelta(seconds=70))
    hass.states.async_set(CHARGING, "off")
    await _mode(hass, "pause")
    await settle(hass, freezer)
    assert tesla.session is not None
    assert tesla.session.energy == pytest.approx(10 * 75 / 3600, abs=0.02)
    assert tesla.session.sources.keys() == {"power"}


async def test_a_car_that_does_not_charge_after_a_pause_is_learned(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    entry = await _setup(
        hass,
        freezer,
        entry_with(
            charger_sub(),
            vehicle_sub(TESLA, "Tesla", tesla_data()),
            options={"notify_services": ["notify.mobile_app_phone"]},
        ),
    )
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    # It has failed once before.
    tesla.learned.resume_failures = 1

    await move(hass, freezer, _at(now, 0, 1))
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    hass.states.async_set(SOC, "65", {"unit_of_measurement": "%"})
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 1, 0))
    hass.states.async_set(CHARGING, "off")
    await settle(hass, freezer)

    # At 03 the car is told to charge, but it does not.
    start = _at(now, 3, 0)
    for minutes in (1, 7, 13, 25):
        await move(hass, freezer, start + timedelta(minutes=minutes))
    assert hass.states.get("binary_sensor.tesla_charging_problem").state == "on"
    problem = [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_problem_{TESLA}"]
    assert problem and "did not charge again after the pause" in problem[-1]["message"]
    assert "From now on it charges in one go." in problem[-1]["message"]
    assert tesla.learned.resumes is False
    assert tesla.plan_continuous
    await settle(hass, freezer)
    assert tesla.plan is None or len(tesla.plan.segments) == 1

    # "Try again" forgets it.
    await household.async_set_vehicle(TESLA, {"forget_resume": True})
    assert tesla.learned.resumes is None and not tesla.plan_continuous
    assert "forget_resume" not in tesla.settings


async def test_a_car_that_did_not_resume_once_is_reported_without_learning_it(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    entry = await _setup(
        hass,
        freezer,
        entry_with(
            charger_sub(),
            vehicle_sub(TESLA, "Tesla", tesla_data()),
            options={"notify_services": ["notify.mobile_app_phone"]},
        ),
    )
    tesla = entry.runtime_data.vehicles[TESLA]
    await move(hass, freezer, _at(now, 0, 1))
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    hass.states.async_set(SOC, "65", {"unit_of_measurement": "%"})
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 1, 0))
    hass.states.async_set(CHARGING, "off")
    await settle(hass, freezer)
    start = _at(now, 3, 0)
    for minutes in (1, 7, 13, 25):
        await move(hass, freezer, start + timedelta(minutes=minutes))
    problem = [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_problem_{TESLA}"]
    assert problem and problem[-1]["message"].endswith("Some cars must be plugged in again.")
    assert tesla.learned.resumes is None and tesla.learned.resume_failures == 1


async def test_commands_to_a_car_that_does_not_listen_are_limited(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    entry = await _setup(hass, freezer, entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data())))
    tesla = entry.runtime_data.vehicles[TESLA]
    tesla.sent_log = [dt_util.now()] * 12
    await _mode(hass, "charge_now")
    await settle(hass, freezer)
    assert switches.calls == []
    assert tesla.control_error == "rate_limited"
    # An hour later there is room again, and the check sends it.
    await move(hass, freezer, dt_util.now() + timedelta(minutes=61))
    assert switches.calls and switches.calls[-1] == ("turn_on", CHARGE_SWITCH)
    assert tesla.control_error is None


async def test_the_panel_sees_the_charge_going_on(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    from custom_components.ev_household_planner.websocket import vehicle_state

    set_prices(hass, now, TWO_NIGHTS)
    set_tesla(hass)
    entry = await _setup(hass, freezer, entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data())))
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    assert vehicle_state(household, tesla)["session"] is None
    await _mode(hass, "charge_now")
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    state = vehicle_state(household, tesla)
    assert state["session"]["charging"] is True
    assert len(state["session"]["periods"]) == 1
    assert state["resumes"] is None
