"""Tests for trips read from a calendar."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError

from .conftest import MERCEDES, NIGHT, entry_with, mercedes_data, move, set_prices, settle, vehicle_sub

CALENDAR = "calendar.trips"


def _register(hass: HomeAssistant, events: list[dict[str, Any]], fail: bool = False) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []

    async def get_events(call: ServiceCall) -> ServiceResponse:
        calls.append(dict(call.data))
        if fail:
            raise HomeAssistantError("calendar down")
        return {CALENDAR: {"events": events}}

    hass.services.async_register("calendar", "get_events", get_events, supports_response=SupportsResponse.ONLY)
    return calls


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, now: datetime, **extra: Any) -> None:
    set_prices(hass, now, NIGHT)
    entry = entry_with(
        vehicle_sub(MERCEDES, "Mercedes", mercedes_data(calendar_entity=CALENDAR, **extra)),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)


async def test_trip_sets_deadline_and_target(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory
) -> None:
    trip = (now + timedelta(days=1)).replace(hour=5, minute=0)
    calls = _register(
        hass,
        [
            {"start": "2026-10-20", "end": "2026-10-21", "summary": "Mercedes all day"},
            {"start": (now + timedelta(hours=1)).isoformat(), "summary": "Dentist"},
            {"start": trip.isoformat(), "end": (trip + timedelta(hours=3)).isoformat(), "summary": "Mercedes Aarhus 90 %"},
        ],
    )
    await _setup(hass, freezer, now, calendar_keyword="mercedes")
    assert calls and calls[0]["entity_id"] == CALENDAR
    status = hass.states.get("sensor.mercedes_status")
    assert status is not None
    assert status.attributes["target_soc"] == 90
    assert status.attributes["calendar_trip"] == "Mercedes Aarhus 90 %"
    assert hass.states.get("sensor.mercedes_ready_by").state == "2026-10-20T03:00:00+00:00"

    # The calendar is read again every 15 minutes.
    await move(hass, freezer, now + timedelta(minutes=16))
    assert len(calls) >= 2


async def test_without_keyword_the_first_timed_event_counts(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory
) -> None:
    _register(hass, [{"start": (now + timedelta(hours=3)).isoformat(), "summary": "Trip"}])
    await _setup(hass, freezer, now)
    assert hass.states.get("sensor.mercedes_ready_by").state == "2026-10-19T21:00:00+00:00"


async def test_calendar_errors_are_ignored(hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory) -> None:
    _register(hass, [], fail=True)
    await _setup(hass, freezer, now)
    assert hass.states.get("sensor.mercedes_ready_by").state == "2026-10-20T05:00:00+00:00"
