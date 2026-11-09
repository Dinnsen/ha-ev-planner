"""Read electricity prices from a price sensor."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import datetime, timedelta
from itertools import pairwise
from math import isfinite
from statistics import median
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import State
from homeassistant.util import dt as dt_util

from .planner import PriceSlot

HOUR = timedelta(hours=1)

# Attributes with lists of prices, each an object with a start and a price:
# Energi Data Service and Nord Pool (raw_*), ENTSO-e (prices_*), GE-Spot (*_interval_prices),
# and the generic lists EV Smart Charging reads (prices, data); forecast is a forecast.
LIST_ATTRIBUTES = (
    "raw_today",
    "raw_tomorrow",
    "prices_today",
    "prices_tomorrow",
    "today_interval_prices",
    "tomorrow_interval_prices",
    "prices",
    "data",
    "today",
    "tomorrow",
)
FORECAST_ATTRIBUTE = "forecast"
START_KEYS = ("hour", "start", "time", "start_time", "startsAt", "datetime", "from")
VALUE_KEYS = ("price", "value", "total", "electricity_price", "price_ct_per_kwh")
# Prices given in cents (or øre) per kWh by their key are turned into the currency per kWh.
CENT_KEYS = ("price_ct_per_kwh",)

PRICE_STALE = "stale"
PRICE_GAPS = "gaps"
PRICE_UNIT = "unit"


def extract_price_slots(state: State | None, now: datetime) -> list[PriceSlot]:
    """Return sorted price slots from a supported price sensor.

    Supported layouts, with hourly, 30 or 15 minute prices:
    - lists of prices with a start and a price (``LIST_ATTRIBUTES``): Energi
      Data Service (``hour``, ``price``), Nord Pool (``start``, ``end``,
      ``value``), ENTSO-e (``prices_today``, ``time``, ``price``), GE-Spot
      (``today_interval_prices``) and the generic ``prices`` or ``data``;
      ``forecast`` (Energi Data Service) as a forecast
    - ``today`` / ``tomorrow`` lists of prices starting at midnight (Nord Pool)

    Prices that are not numbers (or not finite) are left out, a price given
    twice counts once (a published price before a forecast), and a start
    without a time zone is local time.
    """
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return []

    attrs = state.attributes
    starts: list[tuple[datetime, datetime | None, float, bool]] = []
    for key in LIST_ATTRIBUTES:
        starts.extend((*row, False) for row in _rows(attrs.get(key)))
    starts.extend((*row, True) for row in _rows(attrs.get(FORECAST_ATTRIBUTE)))

    if not starts and isinstance(attrs.get("today"), list):
        base = dt_util.as_local(now).replace(hour=0, minute=0, second=0, microsecond=0)
        for day_offset, key in enumerate(("today", "tomorrow")):
            values = attrs.get(key)
            if not isinstance(values, list) or not values:
                continue
            step = _step_for_day(len(values))
            # Count from midnight in UTC, so days with a DST change line up.
            day = dt_util.as_utc(base + timedelta(days=day_offset))
            for idx, value in enumerate(values):
                price = _to_float(value)
                if price is not None:
                    start = dt_util.as_local(day + step * idx)
                    starts.append((start, start + step, price, False))

    # A published price wins over a forecast for the same time.
    by_start: dict[datetime, tuple[datetime | None, float, bool]] = {}
    for start, end, price, forecast in starts:
        if start not in by_start or not forecast:
            by_start[start] = (end, price, forecast)
    ordered = sorted(by_start)
    step = _common_step(ordered)

    slots: list[PriceSlot] = []
    for index, start in enumerate(ordered):
        end, price, forecast = by_start[start]
        if end is None or end <= start:
            following = ordered[index + 1] if index + 1 < len(ordered) else None
            end = following if following and following - start <= step else start + step
        slots.append(PriceSlot(start, end, price, forecast))
    return slots


def _rows(rows: Any) -> Iterable[tuple[datetime, datetime | None, float]]:
    if not isinstance(rows, list):
        return
    for row in rows:
        if not isinstance(row, Mapping):
            continue
        start_key = next((key for key in START_KEYS if row.get(key) is not None), None)
        value_key = next((key for key in VALUE_KEYS if row.get(key) is not None), None)
        if start_key is None or value_key is None:
            continue
        start = _to_datetime(row[start_key])
        price = _to_float(row[value_key])
        if start is None or price is None:
            continue
        if value_key in CENT_KEYS:
            price /= 100
        yield start, _to_datetime(row.get("end", row.get("to"))), price


def _common_step(starts: list[datetime]) -> timedelta:
    """The shortest distance between prices, at most one hour."""
    gaps = [later - earlier for earlier, later in pairwise(starts) if later > earlier]
    return min([*gaps, HOUR]) if gaps else HOUR


def _step_for_day(count: int) -> timedelta:
    """Slot length from the number of prices in a day (23-25 hours for DST)."""
    if count >= 88:
        return timedelta(minutes=15)
    if count >= 44:
        return timedelta(minutes=30)
    return HOUR


def _to_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        moment: datetime | None = value
    elif value in (None, ""):
        return None
    else:
        moment = dt_util.parse_datetime(str(value))
    if moment is not None and moment.tzinfo is None:
        moment = moment.replace(tzinfo=dt_util.get_default_time_zone())
    return moment


def _to_float(value: object) -> float | None:
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return number if isfinite(number) else None


def price_issue(slots: list[PriceSlot], now: datetime) -> str | None:
    """What looks wrong with the prices, for the panel: none for now, holes, or an odd unit.

    ``stale``: no price for now or later (the sensor has stopped). ``gaps``:
    a hole in the prices of the next day. ``unit``: prices that look like
    øre or cents per kWh rather than the currency per kWh.
    """
    ahead = [slot for slot in slots if slot.end > now]
    if not ahead:
        return PRICE_STALE
    soon = [slot for slot in ahead if slot.start < now + timedelta(hours=24)]
    if any(later.start > earlier.end for earlier, later in pairwise(soon)):
        return PRICE_GAPS
    if median(abs(slot.price) for slot in ahead) > 20:
        return PRICE_UNIT
    return None
