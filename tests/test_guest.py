"""Tests for the guest car (EV Guest's flow inside EV Planner)."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.api import (
    BatteryLookupResult,
    PlateAuthError,
    PlateLookupFailed,
    VehicleLookupResult,
)

from .conftest import (
    CARPORT,
    CHARGER_CAR,
    CHARGER_METER,
    CHARGER_SWITCH,
    NIGHT,
    PRICE_ENTITY,
    TESLA,
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

STATUS = "sensor.guest_car_status"
CONTROL = "sensor.guest_car_charger_control"


def _state(hass: HomeAssistant, entity_id: str) -> Any:
    state = hass.states.get(entity_id)
    assert state is not None, entity_id
    return state


async def _press(hass: HomeAssistant, key: str) -> None:
    await hass.services.async_call("button", "press", {ATTR_ENTITY_ID: f"button.guest_car_{key}"}, blocking=True)
    await hass.async_block_till_done()


@pytest.fixture
async def guest_household(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> MockConfigEntry:
    """A carport with a switch, a meter and a car connected sensor, and a Tesla that uses it."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, cable=False)
    hass.states.async_set(CHARGER_SWITCH, "on")
    hass.states.async_set(CHARGER_CAR, "off")
    hass.states.async_set(CHARGER_METER, "1000.0", {"unit_of_measurement": "kWh", "device_class": "energy"})
    entry = entry_with(
        charger_sub(
            carport_data(switch_entity=CHARGER_SWITCH, energy_entity=CHARGER_METER, connected_entity=CHARGER_CAR)
        ),
        vehicle_sub(TESLA, "Tesla", tesla_data()),
    )
    entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(entry, data={**entry.data, "motorapi_api_key": "secret"})
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


async def test_guest_entities(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    assert _state(hass, STATUS).state == "ready"
    assert _state(hass, CONTROL).state == "released"
    assert _state(hass, "number.guest_car_charge_level").state == "20.0"
    assert _state(hass, "time.guest_car_ready_by").state == "07:00:00"
    assert _state(hass, "switch.guest_car_one_period").state == "on"
    assert _state(hass, "text.guest_car_license_plate").state == ""
    assert hass.states.get("select.guest_car_charger") is None  # only with several chargers


async def test_guest_plan_session_and_history(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = guest_household.runtime_data
    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: "text.guest_car_license_plate", "value": " ab 12 345 "}, blocking=True
    )
    await _press(hass, "make_plan")
    assert _state(hass, STATUS).state == "planned"
    assert _state(hass, CONTROL).state == "pause"
    assert household.guest.inputs["license_plate"] == "AB 12 345"
    # The guest has the charger: pause it until the plan starts.
    await settle(hass, freezer)
    assert ("turn_off", CHARGER_SWITCH) in switches.calls
    # The Tesla (on the same charger) waits while the guest has it.
    hass.states.async_set("binary_sensor.tesla_cable", "on")
    await settle(hass, freezer)
    assert _state(hass, "sensor.tesla_status").state == "charger_busy"
    assert _state(hass, "sensor.carport_charger_control").attributes["holder"] == "guest"

    start = household.guest.plan_start
    assert start is not None
    await move(hass, freezer, start + timedelta(minutes=1))
    assert _state(hass, STATUS).state == "charging"
    assert _state(hass, "binary_sensor.guest_car_charge_now").state == "on"
    assert switches.calls[-1] == ("turn_on", CHARGER_SWITCH)

    # The meter counts the guest's energy.
    hass.states.async_set(CHARGER_METER, "1005.5", {"unit_of_measurement": "kWh"})
    await hass.async_block_till_done()
    assert household.guest.results["measured_energy"] == pytest.approx(5.5)
    assert float(_state(hass, "sensor.guest_car_measured_energy").state) == pytest.approx(5.5)

    end = household.guest.plan_end
    assert end is not None
    await move(hass, freezer, end + timedelta(minutes=11))
    assert _state(hass, STATUS).state == "completed"
    assert _state(hass, CONTROL).state == "released"
    assert household.guest.history and household.guest.history[0]["plate"] == "AB 12 345"
    assert household.guest.history[0]["measured_energy"] == pytest.approx(5.5)
    # Handed back.
    assert switches.calls[-1] == ("turn_on", CHARGER_SWITCH)

    await _press(hass, "new_guest")
    assert _state(hass, STATUS).state == "ready"
    assert household.guest.inputs["license_plate"] == ""


async def test_guest_charge_now_is_saved_in_the_history(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = guest_household.runtime_data
    await _press(hass, "make_plan")
    await _press(hass, "charge_now")
    guest = household.guest
    # Starts right away and runs until the target, as one period.
    assert guest.plan_start == now.replace(second=0)
    assert guest.plan_info is not None and guest.plan_info["mode"] == "now"
    assert guest.results["savings"] == 0
    # 20 % -> 80 % of 77 kWh at 11 kW: 4 h 12 min, planned in whole quarters.
    assert guest.results["charge_time"] == 255
    assert guest.plan_end == now + timedelta(minutes=255)
    await settle(hass, freezer)
    assert _state(hass, STATUS).state == "charging"
    assert switches.calls[-1] == ("turn_on", CHARGER_SWITCH)
    # New prices do not move it.
    set_prices(hass, now, [-1.0] * 11)
    await settle(hass, freezer)
    assert guest.plan_start == now

    hass.states.async_set(CHARGER_METER, "1010.0", {"unit_of_measurement": "kWh"})
    await hass.async_block_till_done()
    end = guest.plan_end
    assert end is not None
    await move(hass, freezer, end + timedelta(minutes=11))
    assert guest.history[0]["mode"] == "now"
    assert guest.history[0]["measured_energy"] == pytest.approx(10.0)

    # Also as an action, and the plan it replaces goes to the history first.
    await hass.services.async_call("ev_household_planner", "guest_charge_now", {}, blocking=True)
    assert guest.plan_start is not None
    await hass.services.async_call(
        "number", "set_value", {ATTR_ENTITY_ID: "number.guest_car_charge_level", "value": 90}, blocking=True
    )
    with pytest.raises(ServiceValidationError):
        await _press(hass, "charge_now")


async def test_stopping_the_guest_charge(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = guest_household.runtime_data
    guest = household.guest
    hass.states.async_set(CHARGER_CAR, "on")
    await hass.async_block_till_done()
    # Nothing to stop yet.
    await _press(hass, "stop_charging")
    assert guest.history == []

    await _press(hass, "charge_now")
    assert guest.results["charge_time"] == 255
    await move(hass, freezer, now + timedelta(minutes=63.75))
    await _press(hass, "stop_charging")
    await settle(hass, freezer)
    # A quarter of the charge was done, and that is what the history says.
    assert _state(hass, STATUS).state == "stopped"
    assert guest.history[0]["stopped"] is True
    assert guest.history[0]["energy"] == pytest.approx(round(guest.results["energy"] * 63.75 / 255, 2), abs=0.02)
    # The charger stays paused for the guest car while it is plugged in.
    assert _state(hass, CONTROL).state == "pause"
    assert [call for call in switches.calls if call[1] == CHARGER_SWITCH][-1] == ("turn_off", CHARGER_SWITCH)

    hass.states.async_set(CHARGER_CAR, "off")
    await hass.async_block_till_done()
    await move(hass, freezer, now + timedelta(minutes=80))
    assert _state(hass, CONTROL).state == "released"
    assert len(guest.history) == 1

    # A plan that has not started is simply dropped.
    await _press(hass, "make_plan")
    assert guest.plan_start is not None and guest.plan_start > dt_util.now()
    await hass.services.async_call("ev_household_planner", "guest_stop", {}, blocking=True)
    assert guest.segments == []
    assert _state(hass, STATUS).state == "ready"


async def test_stopped_guest_without_a_plug_sensor(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, freezer: FrozenDateTimeFactory
) -> None:
    """Without a plugged-in sensor the charger is held until the charge would have ended."""
    guest = init_integration.runtime_data.guest
    await _press(hass, "charge_now")
    end = guest.plan_end
    assert end is not None
    await move(hass, freezer, now + timedelta(minutes=30))
    await _press(hass, "stop_charging")
    assert guest.status() == "stopped"
    assert guest.charger_control() == "pause"
    # Kept across a restart.
    await hass.config_entries.async_reload(init_integration.entry_id)
    await hass.async_block_till_done()
    guest = init_integration.runtime_data.guest
    assert guest.status() == "stopped"
    await move(hass, freezer, end + timedelta(minutes=1))
    assert guest.charger_control() == "released"
    assert guest.release_info()["reason"] == "stopped"


async def test_unplugging_ends_the_guest_session(
    hass: HomeAssistant, guest_household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = guest_household.runtime_data
    hass.states.async_set(CHARGER_CAR, "on")
    await hass.async_block_till_done()
    await _press(hass, "make_plan")
    start = household.guest.plan_start
    assert start is not None
    await move(hass, freezer, start + timedelta(minutes=30))
    hass.states.async_set(CHARGER_CAR, "off")
    await hass.async_block_till_done()
    await move(hass, freezer, start + timedelta(minutes=32))
    assert _state(hass, CONTROL).state == "released"
    assert household.guest.release_info()["reason"] == "unplugged"
    assert household.guest.history


async def test_guest_errors(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    with pytest.raises(ServiceValidationError) as err:
        await _press(hass, "look_up")
    assert err.value.translation_key == "license_plate_required"
    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: "text.guest_car_license_plate", "value": "AB12345"}, blocking=True
    )
    with pytest.raises(ServiceValidationError) as err:
        await _press(hass, "look_up")
    assert err.value.translation_key == "motorapi_key_missing"

    await hass.services.async_call(
        "number", "set_value", {ATTR_ENTITY_ID: "number.guest_car_charge_level", "value": 90}, blocking=True
    )
    with pytest.raises(ServiceValidationError) as err:
        await _press(hass, "make_plan")
    assert err.value.translation_key == "limit_not_above_soc"
    assert _state(hass, STATUS).state == "limit_not_above_soc"


async def test_guest_plan_follows_new_prices_until_it_starts(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    await hass.services.async_call("switch", "turn_off", {ATTR_ENTITY_ID: "switch.guest_car_ready_by"}, blocking=True)
    await _press(hass, "make_plan")
    first = household.guest.plan_start
    cheaper = [-1.0] * 5 + NIGHT[5:]
    set_prices(hass, now, cheaper)
    await settle(hass, freezer)
    assert first is not None and household.guest.plan_start is not None
    assert household.guest.plan_start < first
    # Waiting for prices: no plan, no error kept on a plan.
    hass.states.async_set(PRICE_ENTITY, "unavailable")
    await settle(hass, freezer)


async def test_guest_lookup(hass: HomeAssistant, guest_household: MockConfigEntry) -> None:
    household = guest_household.runtime_data
    await household.guest.async_set_input("license_plate", "AB12345")
    car = VehicleLookupResult(
        plate="AB12345",
        vin="VIN1",
        brand="Kia",
        model="EV6",
        variant="GT",
        model_year=2024,
        fuel_type="El",
        source="m",
        raw={},
    )
    battery = BatteryLookupResult(battery_capacity=77.4, source="open", match_score=92, raw={})
    with (
        patch("custom_components.ev_household_planner.guest.async_lookup_vehicle", AsyncMock(return_value=car)),
        patch("custom_components.ev_household_planner.guest.async_decode_vin_nhtsa", AsyncMock(return_value=None)),
        patch(
            "custom_components.ev_household_planner.guest.async_lookup_battery_open_ev_data",
            AsyncMock(return_value=battery),
        ),
    ):
        await _press(hass, "look_up")
    assert household.guest.results["car_brand"] == "Kia"
    assert household.guest.inputs["battery_capacity"] == 77.4
    assert _state(hass, "sensor.guest_car_car").state == "Kia EV6"

    with (
        patch(
            "custom_components.ev_household_planner.guest.async_lookup_vehicle",
            AsyncMock(side_effect=PlateLookupFailed("vehicle_not_found")),
        ),
        pytest.raises(ServiceValidationError),
    ):
        await _press(hass, "look_up")
    with (
        patch(
            "custom_components.ev_household_planner.guest.async_lookup_vehicle",
            AsyncMock(side_effect=PlateLookupFailed("timeout")),
        ),
        pytest.raises(HomeAssistantError),
    ):
        await _press(hass, "look_up")
    assert _state(hass, "sensor.guest_car_car").state == "unavailable"
    with (
        patch(
            "custom_components.ev_household_planner.guest.async_lookup_vehicle",
            AsyncMock(side_effect=PlateAuthError("bad")),
        ),
        pytest.raises(ServiceValidationError),
    ):
        await _press(hass, "look_up")


async def test_guest_charger_choice(hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory) -> None:
    set_prices(hass, now, NIGHT)
    entry = entry_with(
        charger_sub(),
        ConfigSubentryDataWithId(
            data={"power": 22.0}, subentry_id="garage", subentry_type="charger", title="Garage", unique_id=None
        ),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    assert _state(hass, "select.guest_car_charger").state == "Carport"
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.guest_car_charger", "option": "Garage"}, blocking=True
    )
    assert entry.runtime_data.guest.charger_id == "garage"
    assert entry.runtime_data.guest.inputs["charger"] == "garage"
    assert CARPORT in entry.runtime_data.chargers


# From 20:00: the cheap hours are midnight and 03, with dearer hours between them.
TWO_PERIODS = [3.0, 3.0, 3.0, 3.0, 0.5, 2.0, 2.0, 0.6, 3.0, 3.0, 3.0]


def _night_at(now: datetime, hour: int, minute: int = 0) -> datetime:
    day = now if hour >= 12 else now + timedelta(days=1)
    return day.replace(hour=hour, minute=minute, second=0, microsecond=0)


async def _guest_plan(hass: HomeAssistant, entry: MockConfigEntry, now: datetime, *, continuous: bool) -> Any:
    """A guest at 60 % to 80 % (77 kWh, 11 kW): an hour and a half of charging."""
    guest = entry.runtime_data.guest
    guest.inputs.update({"soc": 60.0, "charge_limit": 80.0, "continuous_charging_preferred": continuous})
    hass.states.async_set(CHARGER_CAR, "on")
    await hass.async_block_till_done()
    await _press(hass, "make_plan")
    return guest


async def test_a_split_guest_plan_bills_both_periods(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    set_prices(hass, now, TWO_PERIODS)
    await settle(hass, freezer)
    guest = await _guest_plan(hass, guest_household, now, continuous=False)
    assert [(seg["start"].hour, seg["end"].hour, seg["end"].minute) for seg in guest.segments] == [
        (0, 1, 0),
        (3, 3, 30),
    ]
    await move(hass, freezer, _night_at(now, 0, 1))
    assert switches.calls[-1] == ("turn_on", CHARGER_SWITCH)
    hass.states.async_set(CHARGER_METER, "1011.0", {"unit_of_measurement": "kWh"})
    await move(hass, freezer, _night_at(now, 1, 1))
    assert _state(hass, CONTROL).state == "pause"
    # The charger says "no car" while charging is paused: the guest is not let go for that.
    hass.states.async_set(CHARGER_CAR, "off")
    await settle(hass, freezer)
    await move(hass, freezer, _night_at(now, 1, 10))
    assert _state(hass, STATUS).state == "planned"
    await move(hass, freezer, _night_at(now, 3, 1))
    assert switches.calls[-1] == ("turn_on", CHARGER_SWITCH)
    hass.states.async_set(CHARGER_CAR, "on")
    hass.states.async_set(CHARGER_METER, "1016.5", {"unit_of_measurement": "kWh"})
    await settle(hass, freezer)
    await move(hass, freezer, _night_at(now, 3, 41))
    assert _state(hass, STATUS).state == "completed"
    entry = guest.history[0]
    assert entry["measured_energy"] == pytest.approx(16.5)
    assert [(period["start"][11:16], period["end"][11:16]) for period in entry["periods"]] == [
        ("00:00", "01:00"),
        ("03:00", "03:30"),
    ]


async def test_a_guest_gone_in_a_pause_is_let_go_when_charging_should_go_on(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    set_prices(hass, now, TWO_PERIODS)
    await settle(hass, freezer)
    guest = await _guest_plan(hass, guest_household, now, continuous=False)
    await move(hass, freezer, _night_at(now, 0, 1))
    hass.states.async_set(CHARGER_METER, "1011.0", {"unit_of_measurement": "kWh"})
    await move(hass, freezer, _night_at(now, 1, 20))
    hass.states.async_set(CHARGER_CAR, "off")
    await settle(hass, freezer)
    # Still missing five minutes after charging should have gone on: gone since 01:20.
    await move(hass, freezer, _night_at(now, 3, 4))
    assert guest.release_info() is None
    await move(hass, freezer, _night_at(now, 3, 6))
    assert _state(hass, STATUS).state == "completed"
    assert guest.release_info()["reason"] == "unplugged"
    entry = guest.history[0]
    assert entry["end"][11:16] == "01:20"
    assert [(period["start"][11:16], period["end"][11:16]) for period in entry["periods"]] == [("00:00", "01:00")]
    assert entry["measured_energy"] == pytest.approx(11)


async def test_planning_again_while_the_guest_charges_keeps_what_was_charged(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    guest = await _guest_plan(hass, guest_household, now, continuous=True)
    first = guest.plan_info
    assert first is not None
    start = guest.plan_start
    assert start is not None and start.hour == 2
    await move(hass, freezer, start + timedelta(minutes=30))
    hass.states.async_set(CHARGER_METER, "1005.0", {"unit_of_measurement": "kWh"})
    await hass.async_block_till_done()
    # Half an hour in, the guest says the car is at 70 % now and plans again.
    guest.inputs["soc"] = 70.0
    await _press(hass, "make_plan")
    assert guest.results["measured_energy"] == pytest.approx(5)
    second = guest.plan_info
    assert second is not None
    # "Charge now" in the middle keeps it too.
    await move(hass, freezer, dt_util.now() + timedelta(minutes=10))
    await _press(hass, "charge_now")
    third = guest.plan_info
    assert third is not None
    end = guest.plan_end
    assert end is not None
    hass.states.async_set(CHARGER_METER, "1009.0", {"unit_of_measurement": "kWh"})
    await hass.async_block_till_done()
    await move(hass, freezer, end + timedelta(minutes=11))
    assert len(guest.history) == 1
    entry = guest.history[0]
    assert entry["start"] == start.isoformat()
    assert len(entry["periods"]) == 3
    assert entry["measured_energy"] == pytest.approx(9)
    # The bill without a meter: the part of the first plan that ran (a third), of the second, and the third.
    parts = guest._carried
    assert len(parts) == 2
    assert parts[0]["energy"] == pytest.approx(first["energy"] / 3, abs=0.05)
    assert parts[1]["energy"] < second["energy"]
    assert entry["energy"] == pytest.approx(parts[0]["energy"] + parts[1]["energy"] + third["energy"], abs=0.01)
    assert entry["cost"] == pytest.approx(parts[0]["cost"] + parts[1]["cost"] + third["cost"], abs=0.01)


async def test_a_guest_unplugged_while_charging_without_a_meter_pays_for_what_was_charged(
    hass: HomeAssistant,
    guest_household: MockConfigEntry,
    now: datetime,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = guest_household.runtime_data
    household.chargers[CARPORT].config.pop("energy_entity")
    guest = await _guest_plan(hass, guest_household, now, continuous=True)
    planned = dict(guest.plan_info)
    start = guest.plan_start
    assert start is not None
    await move(hass, freezer, start + timedelta(minutes=45))
    hass.states.async_set(CHARGER_CAR, "off")
    await settle(hass, freezer)
    await move(hass, freezer, start + timedelta(minutes=47))
    assert _state(hass, STATUS).state == "completed"
    entry = guest.history[0]
    assert entry["measured_energy"] is None
    # 45 of the 90 minutes.
    assert entry["energy"] == pytest.approx(planned["energy"] / 2, abs=0.05)
    assert entry["cost"] == pytest.approx(planned["cost"] / 2, abs=0.05)
    assert entry["end"][11:16] == "02:45"


async def test_a_car_of_the_household_plugged_in_takes_the_charger_from_a_guest(
    hass: HomeAssistant, guest_household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    """A guest's plan left over (the guest drove off at a charger that cannot tell) does not block the household."""
    household = guest_household.runtime_data
    hass.states.async_set(CHARGER_CAR, "on")
    await hass.async_block_till_done()
    await _press(hass, "make_plan")
    guest = household.guest
    assert guest.session_active()
    # The guest's car leaves unseen; the Tesla is plugged in at the carport later.
    freezer.tick(timedelta(minutes=5))
    set_tesla(hass, cable=True)
    await hass.async_block_till_done()
    await household.async_recalculate(force=True)
    assert not guest.session_active()
    assert guest.release_info()["reason"] == "household_car"
    assert any(e["kind"] == "guest_released" for e in household.events.items)


async def test_forgetting_a_guest_who_drove_off_happens_once(
    hass: HomeAssistant, guest_household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    """After the guest is forgotten, a new plate is not wiped again a minute later."""
    household = guest_household.runtime_data
    guest = household.guest
    guest._release = {"at": dt_util.now().isoformat(), "reason": "unplugged", "seen": dt_util.now().isoformat()}
    hass.states.async_set(CHARGER_CAR, "off")
    await hass.async_block_till_done()
    now = dt_util.now() + timedelta(hours=1)
    assert guest.finished_long_ago(now)
    await guest.async_new_guest()
    assert not guest.finished_long_ago(now)
    guest.inputs["license_plate"] = "AB12345"
    assert not guest.finished_long_ago(now + timedelta(minutes=1))


async def test_a_guest_can_be_ready_by_a_departure_of_the_household(
    hass: HomeAssistant, guest_household: MockConfigEntry, now: datetime
) -> None:
    household = guest_household.runtime_data
    guest = household.guest
    plan, _slots = guest.make_plan({**guest.inputs, "soc": 60.0, "charge_limit": 70.0, "departure": "morning"})
    deadline = departures_deadline(household, "morning")
    assert plan.segments and plan.segments[-1]["end"] <= deadline
    # A ceiling no hour is under: the cheapest hours all the same.
    capped, _slots = guest.make_plan({**guest.inputs, "soc": 60.0, "charge_limit": 70.0, "price_ceiling": -5.0})
    assert capped.segments


def departures_deadline(household: Any, ident: str) -> datetime:
    from custom_components.ev_household_planner import departures

    item = departures.find(household.settings.get("departures"), ident)
    assert item is not None
    deadline = departures.deadline(item, dt_util.now())
    assert deadline is not None
    return deadline
