"""The household's departures: the one-off ready-by times a car can be set to, besides its week plan.

Each is a name, a day (the next time it comes, today, tomorrow, a weekday, or a date chosen when it
is set), a time, how cheap it charges for it, and maybe a target. The household keeps one list for
all its cars, under *Settings → Departures* in the panel; the holiday is always in it.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import date, datetime, time, timedelta
from math import ceil
from typing import Any

from .planner import PriceSlot
from .rules import at_time, parse_hhmm

DAY_NEXT = "next"
DAY_TODAY = "today"
DAY_TOMORROW = "tomorrow"
DAY_DATE = "date"  # the day is chosen when the departure is set (the holiday's day home)
WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
DAYS = (DAY_NEXT, DAY_TODAY, DAY_TOMORROW, DAY_DATE, *WEEKDAYS)

PRICE_NORMAL = "normal"  # the cheapest hours before it, as any ready-by time
PRICE_LOWEST = "lowest"  # only at the lowest published price and up to ``pct`` % above it
PRICE_CHEAPEST = "cheapest"  # only in the cheapest ``pct`` % of the hours until it
PRICES = (PRICE_NORMAL, PRICE_LOWEST, PRICE_CHEAPEST)

HOLIDAY = "holiday"

DEFAULT_DEPARTURES: tuple[dict[str, Any], ...] = (
    {"id": "morning", "day": DAY_NEXT, "time": "06:00", "price": PRICE_NORMAL},
    {"id": "midday", "day": DAY_NEXT, "time": "12:00", "price": PRICE_NORMAL},
    {"id": "evening", "day": DAY_NEXT, "time": "17:00", "price": PRICE_NORMAL},
    {"id": "tomorrow_afternoon", "day": DAY_TOMORROW, "time": "17:00", "price": PRICE_NORMAL},
    {"id": "weekend", "day": "mon", "time": "06:00", "price": PRICE_LOWEST, "pct": 10},
    {"id": HOLIDAY, "day": DAY_DATE, "time": "06:00", "price": PRICE_CHEAPEST, "pct": 10},
)


def clean(item: Mapping[str, Any]) -> dict[str, Any] | None:
    """A departure as it is kept, or None when it is not one."""
    ident = str(item.get("id") or "").strip()
    moment = parse_hhmm(item.get("time"))
    if not ident or moment is None:
        return None
    day = str(item.get("day") or DAY_NEXT)
    if day not in DAYS or (day == DAY_DATE) != (ident == HOLIDAY):
        day = DAY_DATE if ident == HOLIDAY else DAY_NEXT
    price = str(item.get("price") or PRICE_NORMAL)
    out: dict[str, Any] = {
        "id": ident,
        "day": day,
        "time": moment.strftime("%H:%M"),
        "price": price if price in PRICES else PRICE_NORMAL,
    }
    if name := str(item.get("name") or "").strip():
        out["name"] = name[:40]
    try:
        pct = float(item.get("pct", 10))
    except (TypeError, ValueError):
        pct = 10.0
    out["pct"] = max(1.0, min(100.0, pct))
    target = item.get("target")
    if isinstance(target, int | float) and 10 <= target <= 100:
        out["target"] = float(target)
    return out


def departures(stored: Any) -> list[dict[str, Any]]:
    """The household's departures: as stored, or the defaults; the holiday always among them."""
    items = stored if isinstance(stored, list) else [dict(item) for item in DEFAULT_DEPARTURES]
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in items:
        if isinstance(item, Mapping) and (found := clean(item)) is not None and found["id"] not in seen:
            seen.add(found["id"])
            out.append(found)
    if HOLIDAY not in seen:
        out.append(dict(DEFAULT_DEPARTURES[-1]))
    return out


def find(stored: Any, ident: str | None) -> dict[str, Any] | None:
    return next((item for item in departures(stored) if item["id"] == ident), None)


def deadline(item: Mapping[str, Any], now: datetime, day: date | None = None) -> datetime | None:
    """When a departure must be ready, set now (None when it cannot be: today's has passed, no date)."""
    moment = parse_hhmm(item.get("time")) or time(6)
    today = now.date()

    def first(*days: date) -> datetime | None:
        return next((at for one in days if (at := at_time(one, moment, now)) > now), None)

    kind = item.get("day")
    if kind == DAY_TODAY:
        return first(today)
    if kind == DAY_TOMORROW:
        return at_time(today + timedelta(days=1), moment, now)
    if kind in WEEKDAYS:
        ahead = (WEEKDAYS.index(str(kind)) - today.weekday()) % 7
        start = today + timedelta(days=ahead)
        return first(start, start + timedelta(days=7))
    if kind == DAY_DATE:
        return first(day) if day is not None else None
    return first(today, today + timedelta(days=1))


def ceiling(item: Mapping[str, Any] | None, prices: Sequence[PriceSlot], until: datetime | None) -> float | None:
    """The highest price a departure charges at (None: as for any ready-by time)."""
    if item is None:
        return None
    pct = float(item.get("pct") or 10)
    window = [slot for slot in prices if until is None or slot.start < until]
    if item.get("price") == PRICE_LOWEST:
        known = [slot.price for slot in window if not slot.forecast]
        if not known:
            return None
        low = min(known)
        return low + abs(low) * pct / 100
    if item.get("price") == PRICE_CHEAPEST:
        if not window:
            return None
        ranked = sorted(slot.price for slot in window)
        return ranked[max(0, ceil(len(ranked) * pct / 100) - 1)]
    return None


# A car's own times before 2.5, as they were by default.
CAR_DEFAULTS = {"morning_time": "06:00", "midday_time": "12:00", "evening_time": "17:00", "afternoon_time": "15:00"}


def from_cars(settings: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """The defaults, with the times a car had set for its morning, midday and evening (before 2.5)."""
    out = [dict(item) for item in DEFAULT_DEPARTURES]
    for item in out:
        key = {
            "morning": "morning_time",
            "midday": "midday_time",
            "evening": "evening_time",
            "tomorrow_afternoon": "afternoon_time",
        }.get(item["id"])
        if key is None:
            continue
        # The first car that had another time than its default (the defaults are stored too).
        for car in settings:
            moment = parse_hhmm(car.get(key))
            if moment is not None and moment.strftime("%H:%M") != CAR_DEFAULTS[key]:
                item["time"] = moment.strftime("%H:%M")
                break
    morning = out[0]["time"]
    for item in out:
        if item["id"] in ("weekend", HOLIDAY):
            item["time"] = morning
    return out
