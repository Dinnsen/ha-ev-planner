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
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_planner.api import BatteryLookupResult, PlateAuthError, PlateLookupFailed, VehicleLookupResult

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
    # Starts at the next whole minute and runs until the target, as one period.
    assert guest.plan_start == now
    assert guest.plan_info is not None and guest.plan_info["mode"] == "now"
    assert guest.results["savings"] == 0
    # 20 % -> 80 % of 77 kWh at 90 % and 11 kW: 4 h 40 min.
    assert guest.results["charge_time"] == 280
    assert guest.plan_end == now + timedelta(minutes=280)
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
    await hass.services.async_call("ev_planner", "guest_charge_now", {}, blocking=True)
    assert guest.plan_start is not None
    await hass.services.async_call(
        "number", "set_value", {ATTR_ENTITY_ID: "number.guest_car_charge_level", "value": 90}, blocking=True
    )
    with pytest.raises(ServiceValidationError):
        await _press(hass, "charge_now")


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
        patch("custom_components.ev_planner.guest.async_lookup_vehicle", AsyncMock(return_value=car)),
        patch("custom_components.ev_planner.guest.async_decode_vin_nhtsa", AsyncMock(return_value=None)),
        patch("custom_components.ev_planner.guest.async_lookup_battery_open_ev_data", AsyncMock(return_value=battery)),
    ):
        await _press(hass, "look_up")
    assert household.guest.results["car_brand"] == "Kia"
    assert household.guest.inputs["battery_capacity"] == 77.4
    assert _state(hass, "sensor.guest_car_car").state == "Kia EV6"

    with (
        patch(
            "custom_components.ev_planner.guest.async_lookup_vehicle",
            AsyncMock(side_effect=PlateLookupFailed("vehicle_not_found")),
        ),
        pytest.raises(ServiceValidationError),
    ):
        await _press(hass, "look_up")
    with (
        patch(
            "custom_components.ev_planner.guest.async_lookup_vehicle",
            AsyncMock(side_effect=PlateLookupFailed("timeout")),
        ),
        pytest.raises(HomeAssistantError),
    ):
        await _press(hass, "look_up")
    assert _state(hass, "sensor.guest_car_car").state == "unavailable"
    with (
        patch("custom_components.ev_planner.guest.async_lookup_vehicle", AsyncMock(side_effect=PlateAuthError("bad"))),
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
