"""Tests for presets (a one-off ready-by time), what a calendar event says, and the car's climate."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.household import climate_temperature, read_trip
from custom_components.ev_household_planner.prices import PriceSlot
from custom_components.ev_household_planner.rules import cheap_ceiling, trip_deadline

from .conftest import TESLA, move, settle

CPH = ZoneInfo("Europe/Copenhagen")
MORNING = time(6)
AFTERNOON = time(15)


def _at(day: int, hour: int, minute: int = 0) -> datetime:
    return datetime(2026, 10, day, hour, minute, tzinfo=CPH)


# ----------------------------------------------------------------------
# Presets


def test_presets_are_the_next_morning_afternoon_monday_or_the_day_home() -> None:
    evening = _at(19, 20)  # a Monday evening
    assert trip_deadline("morning", evening, morning=MORNING, afternoon=AFTERNOON) == _at(20, 6)
    assert trip_deadline("afternoon", evening, morning=MORNING, afternoon=AFTERNOON) == _at(20, 15)
    assert trip_deadline("tomorrow_afternoon", evening, morning=MORNING, afternoon=AFTERNOON) == _at(20, 15)
    assert trip_deadline("weekend", evening, morning=MORNING, afternoon=AFTERNOON) == _at(26, 6)
    holiday = trip_deadline("holiday", evening, morning=MORNING, afternoon=AFTERNOON, day=date(2026, 10, 30))
    assert holiday == _at(30, 6)
    # In the night, "tomorrow morning" is this morning; in the morning, "this afternoon" is today's.
    night = _at(20, 2)
    assert trip_deadline("morning", night, morning=MORNING, afternoon=AFTERNOON) == _at(20, 6)
    assert trip_deadline("afternoon", _at(20, 9), morning=MORNING, afternoon=AFTERNOON) == _at(20, 15)
    assert trip_deadline("tomorrow_afternoon", night, morning=MORNING, afternoon=AFTERNOON) == _at(21, 15)
    # A holiday needs its day, and one that has passed is no trip.
    assert trip_deadline("holiday", evening, morning=MORNING, afternoon=AFTERNOON) is None
    assert trip_deadline("holiday", evening, morning=MORNING, afternoon=AFTERNOON, day=date(2026, 10, 1)) is None


def _slots(prices: list[float], forecast_from: int | None = None) -> list[PriceSlot]:
    start = _at(19, 20)
    return [
        PriceSlot(
            start + timedelta(hours=i),
            start + timedelta(hours=i + 1),
            price,
            forecast=forecast_from is not None and i >= forecast_from,
        )
        for i, price in enumerate(prices)
    ]


def test_the_weekend_and_a_holiday_charge_only_at_the_cheapest_prices() -> None:
    slots = _slots([1.0, 0.5, 0.6, 2.0, 0.4, 0.3], forecast_from=4)
    # The weekend: the lowest published price (0.5) and 10 % above it; the forecast's are not known.
    assert cheap_ceiling("weekend", slots, None) == pytest.approx(0.55)
    # A holiday: the cheapest tenth of the hours (here one of six).
    assert cheap_ceiling("holiday", slots, None) == pytest.approx(0.3)
    assert cheap_ceiling("morning", slots, None) is None


# ----------------------------------------------------------------------
# Calendar events


def test_a_calendar_event_gives_departure_target_and_climate() -> None:
    start = _at(20, 9)
    assert read_trip("Bil 80 %", start) == (start, 80.0, None)
    assert read_trip("Aarhus fuld opladet", start) == (start, 100.0, None)
    assert read_trip("Møde i Odense, afgang 7:30, 90%, klima 22°", start) == (_at(20, 7, 30), 90.0, 22.0)
    assert read_trip("Kører kl. 6.45, forvarm", start) == (_at(20, 6, 45), None, True)
    assert read_trip("Leave 07:15 preheat 21.5C full", start) == (_at(20, 7, 15), 100.0, 21.5)
    # The short form: a time, a level and the climate with its temperature.
    assert read_trip("Elroq 7:15 80% klima 21,5", start) == (_at(20, 7, 15), 80.0, 21.5)
    assert read_trip("Elroq 6.30 klima 20", start) == (_at(20, 6, 30), None, 20.0)
    # A temperature without the word for the climate is not a climate.
    assert read_trip("Strand 25 grader", start) == (start, None, None)


def test_the_climate_temperature_fits_the_car() -> None:
    skoda = {"min_temp": 16, "max_temp": 29.5, "target_temp_step": 0.5}
    assert climate_temperature(21.3, skoda) == 21.5
    assert climate_temperature(12, skoda) == 16
    assert climate_temperature(31, skoda) == 29.5
    assert climate_temperature(20.2, {"target_temp_step": 1}) == 20


# ----------------------------------------------------------------------
# In Home Assistant


async def test_a_preset_is_the_ready_by_time_once_then_the_week_plan(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    week = tesla.deadline
    at = await household.async_set_trip(TESLA, "afternoon")
    await settle(hass, freezer)
    assert at is not None and at.hour == 15
    assert tesla.deadline == at
    assert tesla.trip is not None and tesla.trip["kind"] == "afternoon"
    kinds = [event["kind"] for event in household.events.items]
    assert "trip" in kinds
    # Back to the week plan by hand ...
    await household.async_set_trip(TESLA, None)
    await settle(hass, freezer)
    assert tesla.trip is None and tesla.deadline == week
    # ... or by itself once the trip has passed.
    at = await household.async_set_trip(TESLA, "morning")
    assert at is not None
    await move(hass, freezer, at + timedelta(minutes=2))
    await settle(hass, freezer)
    assert tesla.trip is None
    assert tesla.settings.get("trip") is None


async def test_the_climate_is_started_by_hand_and_before_a_calendar_trip(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    calls: list[tuple[str, dict[str, Any]]] = []

    async def record(call: ServiceCall) -> None:
        calls.append((call.service, dict(call.data)))
        if call.service == "set_hvac_mode":
            hass.states.async_set("climate.tesla", call.data["hvac_mode"], dict(state.attributes))

    for service in ("set_hvac_mode", "set_temperature", "turn_on"):
        hass.services.async_register("climate", service, record)
    hass.states.async_set(
        "climate.tesla",
        "off",
        {
            "hvac_modes": ["off", "heat_cool"],
            "temperature": 20,
            "min_temp": 16,
            "max_temp": 29.5,
            "target_temp_step": 0.5,
        },
    )
    state = hass.states.get("climate.tesla")
    assert state is not None
    tesla.config["climate_entity"] = "climate.tesla"

    await household.async_climate(TESLA, True)
    assert calls[0] == ("set_hvac_mode", {"entity_id": "climate.tesla", "hvac_mode": "heat_cool"})
    assert calls[1] == ("set_temperature", {"entity_id": "climate.tesla", "temperature": 21.0})
    assert household.climate_running(tesla) is True
    calls.clear()
    await household.async_climate(TESLA, False)
    assert calls == [("set_hvac_mode", {"entity_id": "climate.tesla", "hvac_mode": "off"})]

    # A calendar trip that asks for the climate: started once, the set minutes before leaving.
    calls.clear()
    departure = (tesla.deadline or dt_now(hass)) - timedelta(hours=2)
    tesla.calendar_event, tesla.calendar_climate = departure, 22.5
    tesla.deadline = departure
    await household._async_auto_climate(tesla, departure - timedelta(minutes=30))
    assert not calls
    await household._async_auto_climate(tesla, departure - timedelta(minutes=10))
    assert ("set_temperature", {"entity_id": "climate.tesla", "temperature": 22.5}) in calls
    calls.clear()
    await household._async_auto_climate(tesla, departure - timedelta(minutes=5))
    assert not calls


def dt_now(hass: HomeAssistant) -> datetime:
    from homeassistant.util import dt as dt_util

    return dt_util.now()


async def test_the_actions_set_a_trip_and_go_back_to_the_week_plan(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    from homeassistant.helpers import device_registry as dr

    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    device = next(
        device
        for device in dr.async_entries_for_config_entry(dr.async_get(hass), init_integration.entry_id)
        if ("ev_household_planner", TESLA) in device.identifiers
    )
    await hass.services.async_call(
        "ev_household_planner", "set_trip", {"vehicle": device.id, "trip": "weekend"}, blocking=True
    )
    await settle(hass, freezer)
    assert tesla.trip is not None and tesla.trip["kind"] == "weekend"
    assert tesla.deadline is not None and tesla.deadline.weekday() == 0 and tesla.deadline.hour == 6
    await hass.services.async_call(
        "ev_household_planner", "set_trip", {"vehicle": device.id, "trip": "week"}, blocking=True
    )
    await settle(hass, freezer)
    assert tesla.trip is None


async def test_a_week_day_with_climate_starts_it_and_a_start_button_has_its_stop(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    from custom_components.ev_household_planner.household import climate_sibling  # noqa: PLC0415

    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    pressed: list[str] = []

    async def press(call: ServiceCall) -> None:
        pressed.append(str(call.data["entity_id"]))

    hass.services.async_register("button", "press", press)
    for entity in ("button.car_preclimate_start", "button.car_preclimate_stop"):
        hass.states.async_set(entity, "unknown")
    hass.states.async_set("binary_sensor.car_preclimate_status", "on")
    assert climate_sibling(hass, "button.car_preclimate_start", "stop") == "button.car_preclimate_stop"
    tesla.config["climate_entity"] = "button.car_preclimate_start"
    assert household.climate_running(tesla) is True

    departure = tesla.deadline
    assert departure is not None
    weekday = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")[departure.weekday()]
    tesla.settings["day_climate"] = {weekday: 20.5}
    await household._async_auto_climate(tesla, departure - timedelta(minutes=10))
    assert pressed == ["button.car_preclimate_start"]
    await household.async_climate(TESLA, False)
    assert pressed[-1] == "button.car_preclimate_stop"
