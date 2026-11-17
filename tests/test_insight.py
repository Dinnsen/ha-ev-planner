"""Insight in Home Assistant: the log, what is read the first time, the evening's choice and the hold."""

from __future__ import annotations

from datetime import datetime, time, timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

from aiohttp import ClientResponseError
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.ev_household_planner.insight import (
    Insight,
    days_from_statistics,
    hourly,
    number,
    price_factor,
    share_from_states,
    spot_hours,
    tariff_hours,
)
from custom_components.ev_household_planner.insight_model import STYLES
from custom_components.ev_household_planner.planner import PriceSlot
from custom_components.ev_household_planner.weekplan import Hour

from .conftest import MERCEDES, PRICE_ENTITY, SOC, TESLA, NotifyCalls, set_tesla

ODOMETER = "sensor.tesla_odometer"
TRACKER = "device_tracker.tesla_location"
OUTSIDE = "sensor.tesla_outside_temperature"
ENERGY = "sensor.tesla_charge_energy_added"


def rows(start: datetime, hours: int, price: float) -> list[dict[str, Any]]:
    return [{"hour": (start + timedelta(hours=h)).isoformat(), "price": price} for h in range(hours)]


def car_device(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """The Tesla's device with what Insight looks for on it, and things it must pass by."""
    device = dr.async_get(hass).async_get_or_create(config_entry_id=entry.entry_id, identifiers={("test", "tesla")})
    registry = er.async_get(hass)

    def add(entity: str, device_class: str | None = None, state_class: str | None = None, **extra: Any) -> None:
        domain, name = entity.split(".")
        registry.async_get_or_create(
            domain,
            "test",
            name,
            suggested_object_id=name,
            device_id=device.id,
            original_device_class=device_class,
            capabilities={"state_class": state_class} if state_class else None,
            **extra,
        )

    # The battery sensor has a state already; its place in the registry needs the name free for a moment.
    state = hass.states.get(SOC)
    hass.states.async_remove(SOC)
    add(SOC, "battery", "measurement")
    if state is not None:
        hass.states.async_set(SOC, state.state, state.attributes)
    add("sensor.tesla_a_trip_meter", "distance", "total_increasing")
    add(ODOMETER, "distance", "total_increasing")
    add("sensor.tesla_range", "distance", "measurement")
    add("device_tracker.tesla_a_route")
    add(TRACKER)
    add("sensor.tesla_inside_temperature", "temperature", "measurement")
    add(OUTSIDE, "temperature", "measurement")
    add(ENERGY, "energy", "total")
    add("sensor.tesla_energy_used", "energy", "total")
    add("binary_sensor.tesla_door")
    add("sensor.tesla_gone_odometer", "distance", "total_increasing", disabled_by=er.RegistryEntryDisabler.USER)


def insight_of(entry: MockConfigEntry) -> Insight:
    result: Insight = entry.runtime_data.insight
    return result


def at(now: datetime, **change: int) -> datetime:
    return now.replace(**change)


def test_the_small_readers() -> None:
    assert number("1.5") == 1.5
    assert number("unknown") is None and number(None) is None and number("nan") is None and number("inf") is None
    assert tariff_hours({}) == [0.0] * 24
    hours = tariff_hours({"tariffs": {"additional_tariffs": {"a": 0.1, "b": "x"}, "tariffs": {"17": 0.5}}})
    assert hours[17] == 0.6 and hours[3] == 0.1
    assert tariff_hours({"tariffs": {"additional_tariffs": 1, "tariffs": 2}}) == [0.0] * 24
    spot = spot_hours(
        [
            {"HourDK": "2025-09-30T23:00:00", "SpotPriceDKK": 500.0},
            {"TimeDK": "2025-10-01T00:00:00", "DayAheadPriceDKK": 1000.0},
            {"TimeDK": "2025-10-01T00:15:00", "DayAheadPriceDKK": 2000.0},
            {"TimeDK": "2025-10-01T0x:15:00", "DayAheadPriceDKK": 2000.0},
            {"TimeDK": "short", "DayAheadPriceDKK": 1.0},
            {"TimeDK": "2025-10-01T01:00:00", "DayAheadPriceDKK": None},
        ]
    )
    assert spot["2025-09-30"][23] == 0.5 and spot["2025-10-01"][0] == 1.5 and spot["2025-10-01"][1] is None
    # The household's price over spot plus tariffs, from a day known both ways; else VAT.
    known = {"2026-01-01": [2.5] * 24, "2026-01-02": [None] * 24}
    assert price_factor(known, {"2026-01-01": [1.0] * 24}, [1.0] * 24) == 1.25
    assert price_factor(known, {"2026-01-01": [1.5] * 24}, [1.0] * 24) == 1.0
    assert price_factor({}, {}, [0.0] * 24) == 1.25
    assert price_factor({"2026-01-01": [9.0] * 24}, {"2026-01-01": [1.0] * 24}, [0.0] * 24) == 1.25


def test_days_from_statistics() -> None:
    day = datetime(2026, 11, 3, tzinfo=dt_util.get_default_time_zone())
    hour = 3600

    def rows(values: list[tuple[int, float | None]], key: str) -> list[dict[str, Any]]:
        return [{"start": day.timestamp() + offset * hour, key: value} for offset, value in values]

    found = days_from_statistics(
        {
            "odo": [*rows([(7, 0.4), (8, 30.0), (17, 30.0), (30, 5.0), (31, 9000.0), (32, None)], "change")],
            "energy": rows([(20, 12.0), (21, -3.0), (22, 500.0)], "change"),
            "temp": [
                {"start": day + timedelta(hours=1), "mean": 4.0},
                {"start": day + timedelta(hours=2), "mean": 6.0},
            ],
            "soc": rows([(6, 80.0), (8, 70.0), (17, 60.0), (20, 90.0)], "mean"),
        },
        {"odometer": "odo", "energy": "energy", "temperature": "temp", "soc": "soc", "tracker": "x"},
        60.0,
    )
    first = dt_util.as_local(day).date().isoformat()
    assert found[first] == {
        "km": 60.4,
        "out": float(dt_util.as_local(day + timedelta(hours=8)).hour),
        "charged": 12.0,
        "temp": 5.0,
        "used": 12.0,
    }
    assert len(found) == 2
    assert days_from_statistics({}, {"odometer": None}, None) == {}


async def test_off_until_it_is_turned_on(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    assert planner.settings["insight"] is False and not insight.enabled
    await insight.async_tick(dt_util.now())
    assert insight.data["live"] == {} and insight.data["prices"] == {}
    switch = next(
        s.entity_id for s in hass.states.async_all("switch") if s.entity_id.endswith("_insight_log_and_learn")
    )
    await hass.services.async_call("switch", "turn_on", {"entity_id": switch}, blocking=True)
    assert insight.enabled
    assert planner.vehicles[TESLA].week_target is None


async def test_the_cars_sensors_are_found_on_its_device(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    insight = insight_of(init_integration)
    planner = init_integration.runtime_data
    # Before the battery sensor is in a device: nothing but the battery.
    assert insight.sources(planner.vehicles[TESLA])["odometer"] is None
    insight._sources.clear()
    car_device(hass, init_integration)
    found = insight.sources(planner.vehicles[TESLA])
    assert found == {"soc": SOC, "odometer": ODOMETER, "tracker": TRACKER, "temperature": OUTSIDE, "energy": ENERGY}
    assert insight.sources(planner.vehicles[TESLA]) is found
    assert insight.sources(planner.vehicles[MERCEDES])["soc"] is None


async def test_a_trip_and_the_day_are_written_down(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    car_device(hass, init_integration)
    await planner.async_update_settings({"insight": True})
    with patch.object(insight, "_wants_backfill", return_value=False):
        hass.states.async_set(ODOMETER, "1000")
        hass.states.async_set(ENERGY, "5")
        hass.states.async_set(OUTSIDE, "4")
        hass.states.async_set(TRACKER, "home")
        set_tesla(hass, soc=80, cable=False)
        await hass.async_block_till_done()
        await insight.async_tick(now)
        live = insight.data["live"][TESLA]
        assert live["place"] == "home" and live["odo"] == 1000
        # An unknown position is the last one; the same place is no trip.
        hass.states.async_set(TRACKER, "unavailable")
        await insight.async_tick(now + timedelta(minutes=1))
        assert live["place"] == "home" and live.get("trip") is None
        # The position wanders: off and home again with nothing driven is not a trip.
        hass.states.async_set(TRACKER, "not_home")
        await insight.async_tick(now + timedelta(minutes=2))
        assert live["trip"]["from"] == "home" and live["out"] == 20.03
        hass.states.async_set(TRACKER, "home")
        hass.states.async_set(ODOMETER, "1000.2")
        await insight.async_tick(now + timedelta(minutes=3))
        assert insight.data["trips"] == []
        # A real trip: to work, 12 km and 5 % later. The odometer jumping far is another sensor.
        hass.states.async_set(TRACKER, "not_home")
        await insight.async_tick(now + timedelta(minutes=10))
        hass.states.async_set(ODOMETER, "1012.2")
        hass.states.async_set(ENERGY, "9")
        set_tesla(hass, soc=75, cable=False)
        hass.states.async_set(TRACKER, "work")
        await hass.async_block_till_done()
        await insight.async_tick(now + timedelta(minutes=30))
        trip = insight.data["trips"][0]
        assert (trip["from"], trip["to"], trip["km"], trip["kwh"], trip["temp"]) == ("home", "work", 12.0, 3.0, 4.0)
        assert (trip["soc_start"], trip["soc_end"], trip["vehicle"]) == (80.0, 75.0, TESLA)
        hass.states.async_set(ODOMETER, "99999")
        hass.states.async_set(ENERGY, "999")
        await insight.async_tick(now + timedelta(minutes=31))
        assert round(live["km"], 1) == 12.2 and live["charged"] == 4.0
        # From one zone straight to the next between two readings.
        hass.states.async_set(ODOMETER, "100003")
        hass.states.async_set(TRACKER, "school")
        await insight.async_tick(now + timedelta(minutes=40))
        assert [t["to"] for t in insight.data["trips"]] == ["work", "school"]
        # The next day: yesterday's line. The Mercedes has nothing to read from, and gets none.
        await insight.async_tick(now + timedelta(days=1))
        day = insight.data["days"][TESLA][dt_util.as_local(now).date().isoformat()]
        assert day == {"km": 16.2, "used": 3.0, "charged": 4.0, "temp": 4.0, "out": 20.03}
        assert MERCEDES not in insight.data["days"]
        # Old trips and days go, and so do those of a car that is gone.
        insight.data["trips"].append({"end": "2020-01-01T00:00:00+00:00"})
        insight.data["days"]["gone"] = {"2026-10-18": {}}
        insight.data["days"][TESLA]["2020-01-01"] = {}
        insight.data["forecasts"]["2020-01-01"] = {}
        insight.data["ledger"]["2020-01-01"] = {}
        insight._prune(now + timedelta(days=1))
        assert len(insight.data["trips"]) == 2 and list(insight.data["days"]) == [TESLA]
        assert "2020-01-01" not in insight.data["days"][TESLA]
        assert "2020-01-01" not in insight.data["forecasts"] and "2020-01-01" not in insight.data["ledger"]


async def test_a_car_that_only_reports_where_it_stopped_gets_a_trip_for_each_stop(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime
) -> None:
    """Its position and odometer come only when it is parked: each new stop ends a trip, timed back from the stop."""
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    car_device(hass, init_integration)
    await planner.async_update_settings({"insight": True})
    with patch.object(insight, "_wants_backfill", return_value=False):
        hass.states.async_set(ODOMETER, "1000")
        hass.states.async_set(TRACKER, "home", {"latitude": 55.49, "longitude": 9.47})
        set_tesla(hass, soc=80, cable=False)
        await hass.async_block_till_done()
        await insight.async_tick(now)
        # Parked at a customer's 20 km away: the odometer and the position come together.
        hass.states.async_set(ODOMETER, "1020")
        hass.states.async_set(TRACKER, "not_home", {"latitude": 55.60, "longitude": 9.60})
        await insight.async_tick(now + timedelta(hours=1))
        # On to the next, 8 km further.
        hass.states.async_set(ODOMETER, "1028")
        hass.states.async_set(TRACKER, "not_home", {"latitude": 55.65, "longitude": 9.70})
        await insight.async_tick(now + timedelta(hours=3))
        # Home again.
        hass.states.async_set(ODOMETER, "1050")
        hass.states.async_set(TRACKER, "home", {"latitude": 55.49, "longitude": 9.47})
        await insight.async_tick(now + timedelta(hours=5))
        trips = insight.data["trips"]
        assert [(t["from"], t["to"], t["km"]) for t in trips] == [
            ("home", "not_home", 20.0),
            ("not_home", "not_home", 8.0),
            ("not_home", "home", 22.0),
        ]
        # Each trip ends at its stop and began about as long before as 40 km/h takes.
        first = trips[0]
        assert dt_util.parse_datetime(first["end"]) - dt_util.parse_datetime(first["start"]) == timedelta(minutes=30)


async def test_trips_without_a_tracker_or_an_odometer(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    tesla, mercedes = planner.vehicles[TESLA], planner.vehicles[MERCEDES]
    # No home entity: the car is taken to be at home, and no trips are found.
    assert insight._place(mercedes, None, None) == "home"
    tesla.config = {**tesla.config, "home_entity": "binary_sensor.tesla_home"}
    tesla.home = None
    assert insight._place(tesla, None, "work") == "work"
    tesla.home = False
    assert insight._place(tesla, None, "home") is None
    tesla.home = True
    assert insight._place(tesla, None, None) == "home"
    # A home entity that is a tracker is the tracker.
    tesla.config = {**tesla.config, "home_entity": TRACKER}
    assert insight.sources(tesla)["tracker"] == TRACKER
    # Without an odometer: a trip counts when the battery fell or it took a while.
    start = {"start": now.isoformat(), "from": "home", "odo": None, "soc": 80.0, "temp": None}
    insight._end_trip(tesla, dict(start), "work", now + timedelta(minutes=1), None, 80.0)
    assert insight.data["trips"] == []
    insight._end_trip(tesla, dict(start), "work", now + timedelta(minutes=1), None, 78.0)
    insight._end_trip(tesla, {**start, "soc": None}, "work", now + timedelta(minutes=9), None, None)
    assert [(t["km"], t["kwh"]) for t in insight.data["trips"]] == [(None, 1.2), (None, None)]
    # A day with nothing read is not written.
    insight._close_day(TESLA, {"day": "2026-10-19", "seen": False})
    insight._close_day(TESLA, {})
    assert insight.data["days"] == {}


async def test_prices_and_the_forecast_are_kept(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    await planner.async_update_settings({"insight": True})
    midnight = dt_util.start_of_local_day(now)
    hass.states.async_set(
        PRICE_ENTITY,
        "1",
        {
            "raw_today": rows(midnight, 24, 1.0),
            "raw_tomorrow": rows(midnight + timedelta(days=1), 24, 2.0),
            "forecast": rows(midnight + timedelta(days=2), 30, 3.0),
        },
    )
    await hass.async_block_till_done()
    with patch.object(insight, "_wants_backfill", return_value=False):
        await insight.async_tick(now)
    today = dt_util.as_local(now).date()
    assert insight.data["prices"][today.isoformat()] == [1.0] * 24
    assert insight.data["prices"][(today + timedelta(days=1)).isoformat()] == [2.0] * 24
    forecast = insight.data["forecasts"][today.isoformat()]
    assert forecast["prices"] == [3.0] * 30 and forecast["start"] == (midnight + timedelta(days=2)).isoformat()
    slots = [
        PriceSlot(midnight, midnight + timedelta(minutes=30), 1.0, False),
        PriceSlot(midnight + timedelta(minutes=30), midnight + timedelta(hours=1), 2.0, False),
    ]
    assert hourly(slots, today)[0] == 1.5 and hourly(slots, today, forecast=True)[0] is None
    # A broken tick never stops the planning.
    with patch.object(insight, "_sample", side_effect=RuntimeError("no")):
        await insight.async_tick(now + timedelta(hours=1))


async def test_the_first_time_reads_what_is_already_there(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, aioclient_mock: AiohttpClientMocker
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    car_device(hass, init_integration)
    await planner.async_update_settings({"insight": True})
    yesterday = dt_util.start_of_local_day(now) - timedelta(days=1)
    stats = {
        ODOMETER: [{"start": yesterday.timestamp() + 8 * 3600, "change": 42.0}],
        SOC: [{"start": yesterday.timestamp(), "mean": 80.0}],
    }
    recorder = SimpleNamespace(async_add_executor_job=AsyncMock(return_value=stats))
    today = dt_util.as_local(now).date()
    hass.states.async_set(
        PRICE_ENTITY,
        "1",
        {
            "region_code": "DK1",
            "tariffs": {"additional_tariffs": {"a": 0.5}, "tariffs": {}},
            "raw_today": [
                {"hour": (dt_util.start_of_local_day(now) + timedelta(hours=h)).isoformat(), "price": 2.5}
                for h in range(24)
            ],
        },
    )
    await hass.async_block_till_done()
    old = {"records": [{"HourDK": "2025-09-01T10:00:00", "SpotPriceDKK": 1000.0}]}
    new = {
        "records": [{"TimeDK": f"{today.isoformat()}T{h:02d}:00:00", "DayAheadPriceDKK": 1500.0} for h in range(24)]
        + ["odd"]
    }
    aioclient_mock.get("https://api.energidataservice.dk/dataset/Elspotprices", json=old)
    aioclient_mock.get("https://api.energidataservice.dk/dataset/DayAheadPrices", json=new)
    pause = AsyncMock()
    with (
        patch("homeassistant.components.recorder.get_instance", return_value=recorder),
        patch("custom_components.ev_household_planner.insight.asyncio.sleep", pause),
    ):
        await insight.async_tick(now)
        await hass.async_block_till_done(wait_background_tasks=True)
    assert pause.await_count >= 2
    assert insight.data["days"][TESLA][yesterday.date().isoformat()] == {
        "km": 42.0,
        "used": None,
        "charged": None,
        "temp": None,
        "out": 8.0,
    }
    done = insight.data["done"]
    assert done["cars"][TESLA]["days"] == 1 and MERCEDES in done["cars"]
    # The household's price is 2.5 where spot is 1.5 and the tariff 0.5: a factor of 1.25 on the older days.
    assert done["prices"]["factor"] == 1.25 and done["prices"]["area"] == "DK1"
    assert insight.data["spot"]["2025-09-01"][10] == 1.875 and today.isoformat() not in insight.data["spot"]
    assert not insight._wants_backfill() and insight._task is None
    kinds = [event["kind"] for event in planner.events.items]
    assert "insight_backfill" in kinds and "insight_prices" in kinds
    # A sensor that does not say where it is: no prices are fetched, and it is not asked again.
    del done["prices"]
    hass.states.async_set(PRICE_ENTITY, "1", {})
    await insight._async_backfill(now)
    assert done["prices"]["area"] is None
    # The recorder failing is written down and tried again another day.
    del done["cars"][TESLA]
    recorder.async_add_executor_job.side_effect = RuntimeError("busy")
    with patch("homeassistant.components.recorder.get_instance", return_value=recorder):
        await insight._async_backfill(now)
    assert TESLA not in done["cars"]
    assert any(event.get("error") == "busy" for event in planner.events.items)
    # An answer that is not what was asked for is no prices.
    aioclient_mock.clear_requests()
    aioclient_mock.get("https://api.energidataservice.dk/dataset/DayAheadPrices", json=["odd"])
    with patch("custom_components.ev_household_planner.insight.asyncio.sleep", pause):
        assert await insight._async_spot("DK1", today, today + timedelta(days=1)) == []
        # Asked too often: it waits longer each time, and gives up after four.
        aioclient_mock.clear_requests()
        aioclient_mock.get(
            "https://api.energidataservice.dk/dataset/DayAheadPrices",
            status=429,
            text="Rate limit is exceeded. Try again in 7 seconds.",
        )
        pause.reset_mock()
        with pytest.raises(ClientResponseError):
            await insight._async_spot("DK1", today, today + timedelta(days=1))
        assert [call.args[0] for call in pause.await_args_list] == [3.0, 9.0, 3.0, 9.0, 3.0, 9.0, 3.0]
        # Told to wait very long, or not told how long: it stops at once, or waits a minute.
        aioclient_mock.clear_requests()
        aioclient_mock.get(
            "https://api.energidataservice.dk/dataset/DayAheadPrices", status=429, text="Try again in 9000 seconds."
        )
        pause.reset_mock()
        with pytest.raises(ClientResponseError):
            await insight._async_spot("DK1", today, today + timedelta(days=1))
        assert pause.await_count == 1
        aioclient_mock.clear_requests()
        aioclient_mock.get("https://api.energidataservice.dk/dataset/DayAheadPrices", status=429, text="No.")
        pause.reset_mock()
        with pytest.raises(ClientResponseError):
            await insight._async_spot("DK1", today, today + timedelta(days=1))
        assert pause.await_args_list[1].args[0] == 62.0
        # A fetch that was stopped goes on from where it was, with what it had.
        aioclient_mock.clear_requests()
        aioclient_mock.get("https://api.energidataservice.dk/dataset/DayAheadPrices", json=new)
        hass.states.async_set(
            PRICE_ENTITY, "1", {"region_code": "DK1", "tariffs": {"additional_tariffs": {"a": 0.5}, "tariffs": {}}}
        )
        del done["prices"]
        done["spot_next"] = (today - timedelta(days=1)).isoformat()
        insight.data["spot_raw"] = {"2025-01-01": [1.0] * 24}
        insight.data["spot"] = {}
        await insight._async_import_prices(now)
    assert "spot_next" not in done and insight.data["spot_raw"] == {}
    assert insight.data["spot"]["2025-01-01"][0] == 1.875 and done["prices"]["days"] == 2
    assert len(aioclient_mock.mock_calls) == 1


def seed(insight: Insight, now: datetime, kwh: float = 3.0) -> None:
    """Forty days of light driving for both cars."""
    today = dt_util.as_local(now).date()
    for vehicle_id in (TESLA, MERCEDES):
        insight.data["days"][vehicle_id] = {
            (today - timedelta(days=ago)).isoformat(): {
                "km": None,
                "used": kwh,
                "charged": 5.0,
                "temp": None,
                "out": None,
            }
            for ago in range(1, 41)
        }


def night_prices(hass: HomeAssistant, now: datetime, tonight: float, later: float) -> None:
    midnight = dt_util.start_of_local_day(now)
    hass.states.async_set(
        PRICE_ENTITY,
        "1",
        {
            "raw_today": rows(midnight, 24, tonight),
            "raw_tomorrow": rows(midnight + timedelta(days=1), 24, tonight),
            # A forecast moves from hour to hour (one that does not, far under the prices, is only the tariffs).
            "forecast": [
                {**row, "price": later + (i % 24) / 200}
                for i, row in enumerate(rows(midnight + timedelta(days=2), 96, later))
            ],
        },
    )


async def test_the_evening_which_car_and_the_hold(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, notify: NotifyCalls
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    tesla, mercedes = planner.vehicles[TESLA], planner.vehicles[MERCEDES]
    await planner.async_update_settings(
        {"insight": True, "insight_notify": True, "insight_use": True, "phones": ["notify.mobile_app_phone"]}
    )
    await planner.async_set_vehicle(MERCEDES, {"manual_soc": 70})
    assert insight.window == (21, 7) and not insight.in_window(now) and insight.in_window(at(now, hour=23))
    assert [len(group) for group in insight.groups()] == [2]
    # Still learning: nobody is told anything.
    night_prices(hass, now, 3.0, 1.0)
    await hass.async_block_till_done()
    await insight._async_decide(now, tell=True)
    assert insight.tonight["groups"][0]["reason"] == "learning" and not notify.calls
    # Both can wait and the coming nights are cheaper: no car tonight, and the plan holds the cars at their floor.
    seed(insight, now)
    set_tesla(hass, soc=50, cable=False)
    await hass.async_block_till_done()
    await insight._async_decide(now, tell=True)
    group = insight.tonight["groups"][0]
    assert (group["pick"], group["wait"], group["reason"]) == (None, True, "cheaper")
    assert notify.messages()[-1] == planner.text("insight_no_car")
    # The week plan steers: the car's stay gets the plan's target.
    week = insight.week["cars"][TESLA]
    assert week["steer"] and tesla.week_target == week["target"]
    assert tesla.target == max(week["target"], tesla.settings["min_soc"])
    assert insight.data["ledger"][dt_util.as_local(now).date().isoformat()]["wait"] is True
    # The car's lowest level is never gone under, and a trip is never held back.
    tesla.settings["min_soc"] = 60
    assert tesla.target >= 60
    tesla.calendar_target = 90.0
    assert tesla.target == 90
    tesla.calendar_target = None
    tesla.settings["min_soc"] = 20
    # No cheaper night, and both have enough for tomorrow: no car charges, and the plan holds them at their floor.
    night_prices(hass, now, 1.0, 3.0)
    await hass.async_block_till_done()
    await insight._async_decide(now)
    group = insight.tonight["groups"][0]
    assert (group["pick"], group["wait"], group["reason"]) == (None, False, "enough")
    assert tesla.week_target == insight.week["cars"][TESLA]["target"]
    # Every night, as it chose before: the emptier car should have the charger, and it is not plugged in.
    planner.settings["insight_style"] = 10
    notify.calls.clear()
    await insight._async_decide(now, tell=True)
    group = insight.tonight["groups"][0]
    assert (group["pick"], group["wait"]) == (TESLA, False)
    # Every night: the week plan fills every stay as before.
    assert tesla.week_target == insight.week["cars"][TESLA]["target"] >= tesla.current_soc
    # It says why: the car's level, and what a busy day of its takes.
    need = insight.tonight["cars"][TESLA]["p90"]
    assert need > 0 and tesla.current_soc is not None
    assert notify.messages()[-1] == planner.text(
        "insight_plug_why", car="Tesla", other="Mercedes", soc=round(tesla.current_soc), need=round(need)
    )
    # Plugged in already: nothing to say.
    set_tesla(hass, soc=50, cable=True)
    await hass.async_block_till_done()
    notify.calls.clear()
    await insight._async_decide(now, tell=True)
    assert not notify.calls
    # Both under their floor: the one that lacks most, and the other in the daytime.
    seed(insight, now, kwh=30.0)
    set_tesla(hass, soc=20, cable=False)
    await planner.async_set_vehicle(MERCEDES, {"manual_soc": 30})
    await hass.async_block_till_done()
    await insight._async_decide(now, tell=True)
    assert insight.tonight["groups"][0]["both"] is True
    # The week plan never gives both the same hour: the car it charges the most in the coming hours is named.
    need = round(insight.tonight["cars"][TESLA]["p90"])
    assert notify.messages()[-1] == planner.text("insight_plug_why", car="Tesla", other="Mercedes", soc=20, need=need)
    # In the window the evening's choice stands.
    inside = at(now, hour=23)
    kept = insight.data["ledger"][dt_util.as_local(now).date().isoformat()]
    set_tesla(hass, soc=80, cable=False)
    await hass.async_block_till_done()
    await insight._async_decide(inside)
    assert insight.data["ledger"][dt_util.as_local(now).date().isoformat()] is kept
    # After midnight the night still belongs to the evening before; in the morning a new day is not kept before noon.
    await insight._async_decide(inside + timedelta(hours=3))
    assert len(insight.data["ledger"]) == 1
    await insight._async_decide(at(now, hour=9) + timedelta(days=1))
    assert len(insight.data["ledger"]) == 1
    # A car without a charge level has no outlook; a ready-by time with its own target must be met.
    await planner.async_set_vehicle(MERCEDES, {"manual_soc": None})
    assert insight.outlook(mercedes, now) is None
    tesla.calendar_target = 90.0
    tesla.deadline = now + timedelta(hours=10)
    assert insight._known_need(tesla, now) == 54.0
    tesla.calendar_target = None
    assert insight._known_need(tesla, now) == 0.0


async def test_the_window_the_time_of_the_message_and_the_ripe_message(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, notify: NotifyCalls
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    await planner.async_update_settings(
        {
            "insight": True,
            "insight_notify": True,
            "insight_window": True,
            "insight_from": "22:00",
            "insight_to": "06:00",
            "insight_notify_at": "20:01",
            "phones": ["notify.mobile_app_phone"],
        }
    )
    assert insight.window == (22, 6)
    planner.settings["insight_from"] = "odd"
    assert insight.window == (21, 6)
    planner.settings.update(insight_from="01:00", insight_to="05:00")
    assert insight.in_window(at(now, hour=2)) and not insight.in_window(at(now, hour=6))
    planner.settings.update(insight_from="22:00", insight_to="06:00")
    # The ledger has held for a month: the household is told once.
    today = dt_util.as_local(now).date()
    seed(insight, now)
    insight.data["ledger"] = {
        (today - timedelta(days=ago)).isoformat(): {"wait": False, "cars": {TESLA: {"p90": 5.0, "ripe": True}}}
        for ago in range(2, 30)
    }
    assert insight.scored()["ripe"]
    with patch.object(insight, "_wants_backfill", return_value=False):
        await insight.async_tick(now)  # the hour's work
        notify.calls.clear()
        await insight.async_tick(now + timedelta(minutes=1))  # the minute of the message
    assert any("%" in message for message in notify.messages())
    assert "ripe" in insight.data["done"]
    notify.calls.clear()
    await insight._async_tell(now)
    assert not any("%" in message for message in notify.messages())


async def test_what_the_panel_and_the_export_get_and_what_is_kept(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, hass_ws_client: WebSocketGenerator
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    await planner.async_update_settings({"insight": True})
    seed(insight, now)
    await insight._async_decide(now)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "ev_household_planner/insight"})
    result = (await client.receive_json())["result"]
    assert result["enabled"] is True and result["cars"][TESLA]["days"] == 40
    assert len(result["detail"][TESLA]["week"]) == 7 and result["detail"][TESLA]["week"][0]["p90"] == 3.0
    assert result["window"] == [21, 7] and result["tonight"]["groups"]
    assert len(result["detail"][TESLA]["needs"]) == 40 and len(result["errors"]) == 6
    insight.data["prices"] = {"2026-10-18": [2.0] * 24, "2026-10-19": [1.0] * 23 + [None]}
    insight.data["spot"] = {"2026-10-17": [None] * 24}
    shown = insight.detail()["price_days"]
    assert shown["2026-10-18"] == {"night": 1.0, "mean": 2.0, "own": True}
    assert shown["2026-10-17"] == {"night": 2.0, "mean": None, "own": False}
    assert insight.detail()["price_hours"]["2026-10-18"] == [2.0] * 24
    assert insight.detail()["rhythm"][6][0] == 2.0 and insight.detail()["rhythm"][2][0] is None
    assert len(result["detail"][TESLA]["backtest"]) == 12
    assert result["detail"][TESLA]["calibration"][0] == {"said": 0.5, "hit": 1.0}
    await client.send_json({"id": 2, "type": "ev_household_planner/state"})
    assert (await client.receive_json())["result"]["insight"]["groups"]
    await client.send_json(
        {
            "id": 3,
            "type": "ev_household_planner/settings",
            "settings": {"insight_to": "06:30", "insight_style": 1},
        }
    )
    assert (await client.receive_json())["success"]
    assert "insight_level" not in planner.settings
    assert planner.settings["insight_style"] == 1
    # A trip made often can be given a name; the prices from now on are sent with the rest.
    names = {TESLA: [{"km": 24.3, "name": "Work", "lat": 56.2, "lon": 10.1}]}
    await client.send_json({"id": 4, "type": "ev_household_planner/settings", "settings": {"insight_names": names}})
    assert (await client.receive_json())["success"]
    assert planner.settings["insight_names"] == names
    assert all(set(slot) == {"start", "price", "forecast"} for slot in insight.detail()["ahead"])
    # Saved and read again; a damaged file starts empty.
    await insight.async_save()
    again = Insight(planner)
    await again.async_load()
    assert again.data["days"][TESLA] == insight.data["days"][TESLA]
    with patch.object(again._store, "async_load", side_effect=ValueError("bad")):
        again.data = again._empty()
        await again.async_load()
    assert again.data["days"] == {}
    with patch.object(again._store, "async_load", return_value={"days": [], "done": {}}):
        await again.async_load()
    assert again.data["days"] == {} and again.data["done"] == {"cars": {}}
    await again.async_remove()


async def test_tonight_is_kept_over_a_restart_in_the_window_and_follows_a_new_choice(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    await planner.async_update_settings({"insight": True})
    seed(insight, now)
    night_prices(hass, now, 1.0, 3.0)
    await hass.async_block_till_done()
    evening = now.replace(hour=20)
    await insight._async_decide(evening)
    kept = insight.tonight
    assert kept["groups"]
    # Home Assistant starts again at 23: tonight is what was kept in the evening, not nothing.
    insight.tonight = {}
    late = at(now, hour=23)
    await insight._async_decide(late)
    assert insight.tonight == kept
    # A new choice of how careful is looked at again at once, in the window too.
    with patch.object(insight, "_async_decide", wraps=insight._async_decide) as decide:
        await planner.async_update_settings({"insight_style": 10})
    assert decide.call_args.kwargs.get("again") is True


def sunny_noons(hass: HomeAssistant, now: datetime) -> None:
    """Dear all night, cheap at noon from tomorrow on."""
    midnight = dt_util.start_of_local_day(now)
    days = [rows(midnight + timedelta(days=ahead), 24, 2.0) for ahead in range(6)]
    for ahead, day in enumerate(days):
        for row in day[11:15]:
            row["price"] = 0.5 if ahead else 2.0
    hass.states.async_set(
        PRICE_ENTITY,
        "1",
        {"raw_today": days[0], "raw_tomorrow": days[1], "forecast": [row for day in days[2:] for row in day]},
    )


def trips_out(insight: Insight, now: datetime, vehicle_id: str, leave: int, back: int) -> None:
    """Four weeks of the car leaving home at ``leave`` and coming back at ``back`` every day."""
    today = dt_util.start_of_local_day(now)
    for ago in range(28, 0, -1):
        day = today - timedelta(days=ago)
        for start, end, origin, place in (
            (day + timedelta(hours=leave), day + timedelta(hours=leave, minutes=30), "home", None),
            (day + timedelta(hours=back), day + timedelta(hours=back, minutes=30), None, "home"),
        ):
            insight.data["trips"].append(
                {"vehicle": vehicle_id, "start": start.isoformat(), "end": end.isoformat(), "from": origin, "to": place}
            )


async def test_the_days_prices_count_at_the_hours_the_car_is_home(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    await planner.async_update_settings({"insight": True, "insight_use": True})
    seed(insight, now)
    # The fixed steps, not the ones fitted to the seeded days: this is about the hours the car is home.
    insight._styles = (dt_util.now().date(), list(STYLES))
    set_tesla(hass, soc=50, cable=True)
    await planner.async_set_vehicle(MERCEDES, {"manual_soc": 100})
    sunny_noons(hass, now)
    await hass.async_block_till_done()
    # Not known yet when the car is home: the nights alike, so no waiting.
    await insight._async_decide(now)
    assert insight.tonight["cars"][TESLA]["later"] is None
    assert insight.tonight["groups"][0]["wait"] is False
    # At work from 8 to 16 every day: the cheap noons are no use to it.
    trips_out(insight, now, TESLA, 8, 16)
    share = insight.home_hours(TESLA, now)
    assert share is not None and share[0][12] == 0.0
    await insight._async_decide(now)
    car = insight.tonight["cars"][TESLA]
    assert car["now_price"] == 2.0 and car["later"] == [2.0, 2.0, 2.0]
    assert insight.tonight["groups"][0]["wait"] is False
    # Home at noon, out in the evening: it waits for tomorrow's noon instead of the dear night.
    insight.data["trips"] = []
    trips_out(insight, now, TESLA, 17, 18)
    await insight._async_decide(now)
    car = insight.tonight["cars"][TESLA]
    assert car["now_price"] == 2.0 and car["later"] == [0.5, 0.5, 0.5]
    group = insight.tonight["groups"][0]
    assert (group["wait"], group["reason"]) == (True, "cheaper")
    assert planner.vehicles[TESLA].week_target == insight.week["cars"][TESLA]["target"]
    # The other car has no trips: it goes by the nights.
    assert insight.tonight["cars"][MERCEDES]["later"] is None


async def test_the_week_plan_hour_by_hour_and_what_it_hands_on(
    hass: HomeAssistant, init_integration: MockConfigEntry, now: datetime, hass_ws_client: WebSocketGenerator
) -> None:
    planner = init_integration.runtime_data
    insight = insight_of(init_integration)
    tesla, mercedes = planner.vehicles[TESLA], planner.vehicles[MERCEDES]
    await planner.async_update_settings({"insight": True})
    # The week plan steers by default.
    assert planner.settings["insight_use"] is True
    seed(insight, now)
    insight._styles = (dt_util.now().date(), list(STYLES))
    set_tesla(hass, soc=40, cable=True)
    await planner.async_set_vehicle(MERCEDES, {"manual_soc": 90})
    sunny_noons(hass, now)
    await hass.async_block_till_done()
    # The Mercedes is out only from 7 to 8: home at the cheap noons. The Tesla is not known yet: the nights.
    trips_out(insight, now, MERCEDES, 7, 8)
    await insight._async_hold(now)
    week = insight.week
    assert len(week["prices"]) == len(week["kinds"]) == 168
    assert week["step"] == 6 and len(week["steps"]) == 11
    assert all(len(step[TESLA]) == len(step[MERCEDES]) == 7 for step in week["steps"])
    # Published prices, the forecast, and after that nothing known (no years of prices kept yet).
    assert {"known", "forecast", "none"} <= set(week["kinds"])
    for vid, vehicle in ((TESLA, tesla), (MERCEDES, mercedes)):
        car = week["cars"][vid]
        assert len(car["kwh"]) == len(car["home"]) == 168 and car["steer"]
        assert all(car["home"][h] for h, kwh in enumerate(car["kwh"]) if kwh > 0)
        assert vehicle.week_target == car["target"]
        deadline = dt_util.parse_datetime(car["deadline"]) if car["deadline"] else None
        assert vehicle.week_deadline == deadline
    # Two cars at one charger never charge in the same hour.
    assert not any(
        a > 0 and b > 0 for a, b in zip(week["cars"][TESLA]["kwh"], week["cars"][MERCEDES]["kwh"], strict=True)
    )
    # The years' prices fill the hours after the forecast, lifted to this week's level.
    today = dt_util.as_local(now).date()
    insight.data["spot"] = {(today - timedelta(days=ago)).isoformat(): [1.0] * 24 for ago in range(1, 15)}
    insight._rhythm = (None, insight._rhythm[1])
    await insight._async_hold(now)
    assert "pattern" in insight.week["kinds"] and "none" not in insight.week["kinds"]
    assert insight.rhythm() is insight.rhythm()
    # The panel gets all of it, the home screen the short of it.
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "ev_household_planner/insight"})
    assert (await client.receive_json())["result"]["week"]["cars"][TESLA]["kwh"]
    await client.send_json({"id": 2, "type": "ev_household_planner/state"})
    brief = (await client.receive_json())["result"]["week"]
    assert set(brief["cars"][MERCEDES]) >= {"charges", "target", "deadline", "stay", "short"}
    # A full charge once a week: planned before a departure, and seen when the car is full.
    await planner.async_set_vehicle(MERCEDES, {"full_charge": True, "full_level": 100, "full_days": 7})
    assert insight.week["cars"][MERCEDES]["full_at"] is not None
    await planner.async_set_vehicle(MERCEDES, {"manual_soc": 100})
    assert insight.data["done"]["full"][MERCEDES] == today.isoformat()
    insight.data["done"]["full"][MERCEDES] = "odd"
    await insight.async_week(now)
    # Low prices to their own level, and filling every stay instead of the cheapest hours.
    await planner.async_set_vehicle(
        TESLA, {"low_price_charging": True, "low_price_level": 0.6, "low_price_soc": 100, "charge_amount": "fill"}
    )
    assert insight.week["cars"][TESLA]["learning"] is False
    # While it steers, topping up cheaply and lowering the ceiling rest, and a reminder follows the plan.
    tesla.settings.update(topup=True, opportunistic="lower_ceiling")
    assert tesla.rules().topup_level is None and tesla.rules().opportunistic == "off"
    set_tesla(hass, soc=40, cable=False)
    await hass.async_block_till_done()
    tesla.settings.update(
        reminder=True, reminder_time="00:00", reminder_days=["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    )
    tesla.reminded_on = None
    assert planner._reminder_due(tesla, now) == (tesla.week_deadline is not None)
    # Not steering: the cars go by their own targets again.
    await planner.async_update_settings({"insight_use": False})
    assert tesla.week_target is None and tesla.week_deadline is None
    await planner.async_update_settings({"insight_use": True})
    assert tesla.week_target is not None
    # A car that comes or goes: the week plan again within the minute.
    insight._seen = ("someone else",)
    local = dt_util.as_local(now)
    insight._price_hour = (local.date(), local.hour)
    insight.week = {}
    with patch.object(insight, "_wants_backfill", return_value=False):
        await insight.async_tick(now)
    assert insight.week
    # Before its trips are enough, a car's hours at home come from Home Assistant's history of its tracker.
    assert insight.home_hours(TESLA, now) is None
    begin = dt_util.start_of_local_day(now) - timedelta(days=10)
    rows = [
        [(begin + timedelta(hours=h)).isoformat(), "home" if h % 24 >= 16 else "not_home"] for h in range(0, 240, 8)
    ]
    with (
        patch.object(insight, "sources", return_value={"tracker": "device_tracker.car"}),
        patch(
            "custom_components.ev_household_planner.insight.async_history", return_value={"device_tracker.car": rows}
        ),
    ):
        await insight._async_home_history(now)
        await insight._async_home_history(now)  # once a day
    share = insight.home_hours(TESLA, now)
    assert share is not None and share[0][18] == 1.0 and share[0][10] == 0.0
    # «Have enough for»: the week plan over the days gone by at every step, once a day in the background.
    await insight._async_runs(now)
    runs = insight.detail()["runs"]
    assert len(runs) == 11 and {"per_week", "short", "morning", "charged"} <= set(runs[0])
    await insight._async_runs(now)
    assert insight.detail()["runs"] is runs
    insight._runs = (None, [])
    insight.data["days"][TESLA] = {}
    await insight._async_runs(now)
    assert insight.detail()["runs"] == []
    # A week plan that fails never stops the charging: nothing is steered.
    with patch.object(insight, "make_week", side_effect=RuntimeError("broken")):
        await insight._async_hold(now)
    assert insight.week == {} and insight.week_brief() == {} and tesla.week_target is None
    planner.settings["insight_style"] = "odd"
    assert insight.style_index() == 6
    # Insight off: nothing is steered by it.
    await insight._async_hold(now)
    await planner.async_update_settings({"insight": False})
    assert insight.week == {} and tesla.week_target is None and mercedes.week_target is None


def test_home_hours_from_a_trackers_history() -> None:
    start = datetime(2026, 11, 2, tzinfo=dt_util.DEFAULT_TIME_ZONE)  # a Monday
    rows = []
    for day in range(7):
        base = start + timedelta(days=day)
        rows += [(base + timedelta(hours=7), "not_home"), (base + timedelta(hours=15), "home")]
    rows.insert(0, (start - timedelta(hours=1), "home"))
    share = share_from_states(rows, start, start + timedelta(days=7))
    assert share is not None and share[0][12] == 0.0 and share[0][20] == 1.0 and share[6][3] == 1.0
    # Not every weekday seen yet, or nothing at all: not known.
    assert share_from_states(rows, start, start + timedelta(days=3)) is None
    assert share_from_states([], start, start + timedelta(days=7)) is None
    assert share_from_states([(start, "unavailable")], start, start + timedelta(days=7)) is None


def test_a_cars_own_limits_for_the_week_plan() -> None:
    monday = datetime(2026, 11, 16, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    hours = [Hour(monday + timedelta(hours=h), 1.0 + (h % 24) / 10) for h in range(72)]
    # Its ready-by times are departures it knows of: 07 on Monday, none on Tuesday, 08:30 on Wednesday.
    car = SimpleNamespace(settings={"ready_by": "07:00", "schedule": {"tue": "none", "wed": "08:30"}})
    assert Insight._ready_hours(car, hours) == [7, 56]
    assert Insight._ready_hours(SimpleNamespace(settings={"use_ready_by": False}), hours) == []
    # Not before its earliest start: from it to its ready-by time.
    late = SimpleNamespace(earliest_start=time(22), ready_by=time(6))
    blocked = Insight._blocked(late, hours)
    assert blocked is not None and blocked[12] and not blocked[23] and not blocked[3]
    assert Insight._blocked(SimpleNamespace(earliest_start=None, ready_by=None), hours) is None
    assert Insight._blocked(SimpleNamespace(earliest_start=time(1), ready_by=None), hours)[8]
    # The ceiling: its own, or the coming day's mean and the share above it.
    rules = lambda ceiling, above: SimpleNamespace(rules=lambda: SimpleNamespace(ceiling=ceiling, ceiling_above=above))  # noqa: E731
    assert Insight._ceiling(rules(2.0, None), hours) == 2.0
    assert Insight._ceiling(rules(None, 10.0), hours) == pytest.approx(sum(h.price for h in hours[:24]) / 24 * 1.1)
    assert Insight._ceiling(rules(None, 10.0), [Hour(monday, None)]) is None
