"""Prices from the price sensors EV Planner reads, and what looks wrong with them."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from homeassistant.core import State
from homeassistant.util import dt as dt_util
import pytest

from custom_components.ev_household_planner.planner import PriceSlot
from custom_components.ev_household_planner.prices import extract_price_slots, price_issue

TZ = ZoneInfo("Europe/Copenhagen")
NOW = datetime(2026, 11, 9, 20, 0, tzinfo=TZ)


def quarters(start: datetime, prices: list[float], key: str = "time", value: str = "price") -> list[dict]:
    return [{key: (start + timedelta(minutes=15 * i)).isoformat(), value: price} for i, price in enumerate(prices)]


def test_entso_e_quarter_hours() -> None:
    """ENTSO-e: prices_today and prices_tomorrow, with time and price."""
    midnight = NOW.replace(hour=0)
    state = State(
        "sensor.average_electricity_price",
        "0.12",
        {
            "prices_today": quarters(midnight, [0.10 + i / 1000 for i in range(96)]),
            "prices_tomorrow": quarters(midnight + timedelta(days=1), [0.05] * 96),
            "prices": quarters(midnight, [0.10 + i / 1000 for i in range(96)]),
        },
    )
    slots = extract_price_slots(state, NOW)
    assert len(slots) == 192
    assert slots[0].start == midnight and slots[0].end == midnight + timedelta(minutes=15)
    assert slots[1].price == pytest.approx(0.101)
    assert slots[-1].price == 0.05
    assert price_issue(slots, NOW) is None


def test_ge_spot_and_generic_lists() -> None:
    start = NOW.replace(hour=0)
    ge_spot = State(
        "sensor.gespot",
        "1",
        {
            "today_interval_prices": quarters(start, [1.0, 2.0], value="value"),
            "tomorrow_interval_prices": [],
        },
    )
    assert [slot.price for slot in extract_price_slots(ge_spot, NOW)] == [1.0, 2.0]
    # Generic: "data" with start_time and price in cents per kWh.
    generic = State("sensor.prices", "1", {"data": quarters(start, [25.0, 30.0], "start_time", "price_ct_per_kwh")})
    assert [slot.price for slot in extract_price_slots(generic, NOW)] == [0.25, 0.30]
    # Tibber-like objects under today, and a start without a time zone (local time).
    tibber = State(
        "sensor.tibber",
        "1",
        {
            "today": [
                {"startsAt": "2026-11-09T00:00:00", "total": 1.5},
                {"startsAt": "2026-11-09T01:00:00", "total": 1.6},
            ]
        },
    )
    slots = extract_price_slots(tibber, NOW)
    assert [slot.price for slot in slots] == [1.5, 1.6]
    local = dt_util.get_default_time_zone()
    assert slots[0].start == datetime(2026, 11, 9, 0, 0, tzinfo=local)
    assert slots[0].end == datetime(2026, 11, 9, 1, 0, tzinfo=local)


def test_bad_prices_are_left_out() -> None:
    start = NOW.replace(hour=0)
    state = State(
        "sensor.prices",
        "1",
        {
            "prices": [
                {"time": start.isoformat(), "price": "nan"},
                {"time": (start + timedelta(hours=1)).isoformat(), "price": "inf"},
                {"time": "not a time", "price": 1},
                {"price": 1},
                {"time": (start + timedelta(hours=2)).isoformat(), "price": 1.0},
                "nonsense",
            ]
        },
    )
    assert [slot.price for slot in extract_price_slots(state, NOW)] == [1.0]


def test_what_looks_wrong_with_the_prices() -> None:
    def slot(hour: int, price: float = 1.0, length: int = 1) -> PriceSlot:
        begin = NOW + timedelta(hours=hour)
        return PriceSlot(begin, begin + timedelta(hours=length), price)

    assert price_issue([], NOW) == "stale"
    assert price_issue([slot(-3), slot(-2)], NOW) == "stale"
    assert price_issue([slot(0), slot(2)], NOW) == "gaps"
    assert price_issue([slot(0), slot(1), slot(30)], NOW) is None  # a hole more than a day ahead
    assert price_issue([slot(0, 250.0), slot(1, 260.0)], NOW) == "unit"


def test_the_night_winter_time_begins_keeps_both_hours_without_offsets() -> None:
    """A sensor with local times and no offset has 02:00 twice that night: both hours and prices are kept."""
    before = dt_util.get_default_time_zone()
    dt_util.set_default_time_zone(TZ)
    try:
        start = datetime(2026, 10, 24, 22, 0, tzinfo=dt_util.UTC)  # 00:00 local, summer time
        rows = [
            {"hour": (start + timedelta(hours=i)).astimezone(TZ).replace(tzinfo=None).isoformat(), "price": float(i)}
            for i in range(6)
        ]
        slots = extract_price_slots(State("sensor.prices", "1", {"raw_today": rows}), start)
    finally:
        dt_util.set_default_time_zone(before)
    assert [slot.price for slot in slots] == [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]
    assert [slot.start.astimezone(dt_util.UTC) for slot in slots] == [start + timedelta(hours=i) for i in range(6)]
    assert all(
        slot.end.astimezone(dt_util.UTC) - slot.start.astimezone(dt_util.UTC) == timedelta(hours=1) for slot in slots
    )
