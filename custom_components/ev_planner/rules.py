"""Charging rules for the household's own cars.

Pure Python without Home Assistant imports, like ``planner.py``, so every
rule can be tested and reasoned about on its own.

A car's plan is EV Guest's cheapest plan (``planner.py``) with EV Smart
Charging's rules on top:

* a deadline from a weekday schedule or a calendar event,
* an earliest start,
* a price ceiling, optionally lowered by the price at the end of the known
  prices (opportunistic charging),
* a minimum charge level that is always reached, whatever the price,
* periods taken by another car or a guest on the same charger.

``decide`` then says what the charger should do right now: charge for a low
charge level or a low price, follow the plan, keep the charger on after the
plan, or pause.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from math import ceil

from .planner import (
    EPSILON,
    MODE_CONTINUOUS,
    MODE_SPLIT,
    ChargeNeed,
    PlanError,
    PriceSlot,
    Segment,
    ceil_minute,
    charge_need,
    energy_cost,
    limit_slots,
    merge_segments,
    price_at,
    select_continuous,
    select_split,
)

OPPORTUNISTIC_OFF = "off"
OPPORTUNISTIC_LOWER = "lower_ceiling"
OPPORTUNISTIC_FOLLOW = "follow_end_price"

MODE_SMART = "smart"
MODE_CHARGE_NOW = "charge_now"
MODE_PAUSE = "pause"
MODE_OFF = "off"

CONTROL_RELEASED = "released"
CONTROL_CHARGE = "charge"
CONTROL_PAUSE = "pause"

# How far ahead a car without a ready-by time looks for cheap hours.
NO_DEADLINE_HORIZON = timedelta(hours=24)

WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
SCHEDULE_DEFAULT = "default"
SCHEDULE_NONE = "none"


@dataclass(frozen=True, slots=True)
class Rules:
    """EV Smart Charging's rules, all optional."""

    min_soc: float = 0.0
    """Always reach this charge level, whatever the price."""
    ceiling: float | None = None
    """Never plan charging at a higher price (None: no ceiling)."""
    opportunistic: str = OPPORTUNISTIC_OFF
    opportunistic_level: float = 50.0
    """``lower_ceiling``: use this share (%) of the ceiling when the last known price is below it."""
    follow_level: float = 90.0
    """``follow_end_price``: the ceiling is this share (%) of the last known price."""
    low_price_level: float | None = None
    """Charge right away whenever the price is at or below this."""
    low_soc_level: float | None = None
    """Charge right away while the charge level is below this."""
    keep_on: bool = False
    """Keep the charger on after the plan, so the car can precondition from the grid."""


@dataclass(frozen=True, slots=True)
class Car:
    """What the planner needs to know about a car."""

    soc: float
    target: float
    capacity: float
    """Usable battery capacity (kWh)."""
    power: float
    """Charging power drawn from the grid (kW)."""
    efficiency: float
    """Share (0-1] of the grid energy that reaches the battery."""


@dataclass(slots=True)
class VehiclePlan:
    """A car's charging plan and what it costs."""

    segments: list[Segment]
    cost: float
    energy: float
    """Energy planned from the grid (kWh)."""
    battery_energy: float
    """Energy planned into the battery (kWh)."""
    minutes: int
    mode: str
    speed: float
    """Charge level gained per hour (%)."""
    end_soc: float
    """The charge level the plan reaches (%)."""
    charge_now_cost: float | None = None
    ceiling: float | None = None
    """The ceiling the plan used, after opportunistic lowering."""
    opportunistic: bool = False
    """True when opportunistic charging changed the ceiling."""
    limited: bool = False
    """True when the ceiling keeps the car from reaching its target."""
    min_only: bool = False
    """True when only the minimum charge level is planned (the ceiling allows too little)."""
    short: bool = False
    """True when there is not enough time before the deadline to reach the target."""

    @property
    def savings(self) -> float | None:
        """Saved compared with charging the same energy right away."""
        if self.charge_now_cost is None:
            return None
        return max(0.0, self.charge_now_cost - self.cost)

    @property
    def average_price(self) -> float | None:
        return self.cost / self.energy if self.energy > EPSILON else None

    @property
    def start(self) -> datetime | None:
        return self.segments[0]["start"] if self.segments else None

    @property
    def end(self) -> datetime | None:
        return self.segments[-1]["end"] if self.segments else None


@dataclass(frozen=True, slots=True)
class Decision:
    """What the charger should do now, and why."""

    control: str
    reason: str


# ----------------------------------------------------------------------
# Time


def parse_hhmm(value: object) -> time | None:
    """``HH:MM`` (or ``HH:MM:SS``) to a time; None for anything else."""
    if isinstance(value, time):
        return value
    if not isinstance(value, str):
        return None
    parts = value.strip().split(":")
    if len(parts) not in (2, 3):
        return None
    try:
        hour, minute = int(parts[0]), int(parts[1])
    except ValueError:
        return None
    if not (0 <= hour < 24 and 0 <= minute < 60):
        return None
    return time(hour, minute)


def at_time(day: date, moment: time, like: datetime) -> datetime:
    """``day`` at ``moment`` in the time zone of ``like``."""
    return datetime.combine(day, moment, like.tzinfo)


def next_deadline(
    now: datetime,
    *,
    default: time | None,
    use_default: bool,
    schedule: Mapping[str, str] | None = None,
    event: datetime | None = None,
) -> datetime | None:
    """The next moment the car must be ready.

    ``schedule`` maps weekdays (``mon`` ... ``sun``) to ``default`` (use the
    default time), ``none`` (no deadline that day) or ``HH:MM``. Without
    ``use_default`` the schedule is not used at all. A calendar ``event``
    earlier than the scheduled deadline wins.
    """
    found: datetime | None = None
    if use_default:
        schedule = schedule or {}
        for offset in range(8):
            day = (now + timedelta(days=offset)).date()
            entry = schedule.get(WEEKDAYS[day.weekday()], SCHEDULE_DEFAULT)
            if entry == SCHEDULE_NONE:
                continue
            moment = default if entry == SCHEDULE_DEFAULT else parse_hhmm(entry)
            if moment is None:
                continue
            candidate = at_time(day, moment, now)
            if candidate > now:
                found = candidate
                break
    if event is not None and event > now and (found is None or event < found):
        return event
    return found


def window_start(now: datetime, earliest: time | None, deadline: datetime | None) -> datetime:
    """When charging may start: now, or the next earliest start.

    The earliest start only applies with a deadline. Inside the window that
    opened at the last earliest start (less than a day before the deadline)
    charging may start right away.
    """
    if earliest is None or deadline is None:
        return now
    last = at_time(now.date(), earliest, now)
    if last > now:
        last -= timedelta(days=1)
    if deadline - last < timedelta(days=1):
        return now
    following = last + timedelta(days=1)
    return following if following < deadline else now


# ----------------------------------------------------------------------
# Prices


def effective_ceiling(rules: Rules, prices: Sequence[PriceSlot]) -> tuple[float | None, bool]:
    """The ceiling to plan with, and whether opportunistic charging changed it.

    Like EV Smart Charging, opportunistic charging looks at the last
    published price (late tomorrow evening once tomorrow's prices are out),
    never at a forecast:

    * ``lower_ceiling``: when that price is below ``opportunistic_level`` %
      of the ceiling, the ceiling drops to that level, since cheap prices are
      coming.
    * ``follow_end_price``: the ceiling is ``follow_level`` % of that price
      (for a negative price: ``200 - follow_level`` %), but never above the
      price ceiling itself.
    """
    ceiling = rules.ceiling
    published = [slot for slot in prices if not slot.forecast]
    if not published:
        return ceiling, False
    last = published[-1].price
    if rules.opportunistic == OPPORTUNISTIC_LOWER and ceiling is not None:
        lowered = ceiling * rules.opportunistic_level / 100
        if last < lowered:
            return lowered, True
        return ceiling, False
    if rules.opportunistic == OPPORTUNISTIC_FOLLOW:
        level = rules.follow_level if last >= 0 else 200 - rules.follow_level
        follow = last * level / 100
        if ceiling is not None and ceiling < follow:
            return ceiling, False
        return follow, True
    return ceiling, False


def cut_slots(slots: Sequence[PriceSlot], blocked: Iterable[Segment]) -> list[PriceSlot]:
    """Remove the ``blocked`` periods (taken by others) from the slots."""
    blocks = sorted(((seg["start"], seg["end"]) for seg in blocked), key=lambda block: block[0])
    if not blocks:
        return list(slots)
    result: list[PriceSlot] = []
    for slot in slots:
        pieces = [(slot.start, slot.end)]
        for b_start, b_end in blocks:
            next_pieces: list[tuple[datetime, datetime]] = []
            for p_start, p_end in pieces:
                if b_end <= p_start or b_start >= p_end:
                    next_pieces.append((p_start, p_end))
                    continue
                if b_start > p_start:
                    next_pieces.append((p_start, b_start))
                if b_end < p_end:
                    next_pieces.append((b_end, p_end))
            pieces = next_pieces
        result.extend(PriceSlot(start, end, slot.price, slot.forecast) for start, end in pieces if end > start)
    return result


def slot_hours(slots: Iterable[PriceSlot]) -> float:
    return sum(slot.hours for slot in slots)


def segments_cost(slots: Sequence[PriceSlot], segments: Iterable[Segment], power_kw: float) -> float:
    """What drawing ``power_kw`` during ``segments`` costs at the slots' prices."""
    total = 0.0
    for segment in segments:
        for slot in slots:
            begin = max(slot.start, segment["start"])
            stop = min(slot.end, segment["end"])
            if stop > begin:
                total += slot.price * (stop - begin).total_seconds() / 3600 * power_kw
    return total


def segments_hours(segments: Iterable[Segment]) -> float:
    return sum((seg["end"] - seg["start"]).total_seconds() / 3600 for seg in segments)


def _all_of(slots: Sequence[PriceSlot]) -> list[Segment]:
    return merge_segments([{"start": slot.start, "end": slot.end} for slot in slots])


def _select(slots: list[PriceSlot], need: ChargeNeed, power: float, continuous: bool) -> tuple[list[Segment], str]:
    if continuous:
        segments, _cost = select_continuous(slots, need, power)
        if segments:
            return segments, MODE_CONTINUOUS
    segments, _cost = select_split(slots, need, power)
    return segments, MODE_SPLIT


def _need_for_hours(need: ChargeNeed, hours: float) -> ChargeNeed:
    """The same need, but charging only ``hours``."""
    share = hours / need.hours if need.hours > EPSILON else 0.0
    return ChargeNeed(
        battery_kwh=need.battery_kwh * share,
        grid_kwh=need.grid_kwh * share,
        hours=hours,
        minutes=ceil(hours * 60 - EPSILON),
        speed_pct_per_hour=need.speed_pct_per_hour,
    )


# ----------------------------------------------------------------------
# Planning


def no_deadline_end(prices: Sequence[PriceSlot], now: datetime) -> datetime:
    """How far a plan without a deadline looks ahead.

    Only as far as the published prices: waiting for a forecast price is a
    bet that may not come true, and a forecast reaching a little further
    every minute pushed a started charge on to the next night. At most one
    day ahead, and always to the end of a price slot, so the end does not
    creep forward minute by minute and drag the plan along with it.
    """
    published = [slot for slot in prices if not slot.forecast] or list(prices)
    end = min(published[-1].end, now + NO_DEADLINE_HORIZON)
    for slot in prices:
        if slot.start < end < slot.end:
            return max(slot.start, now)
    return end


def plan_vehicle(
    prices: Sequence[PriceSlot],
    car: Car,
    rules: Rules,
    now: datetime,
    *,
    deadline: datetime | None,
    earliest: time | None = None,
    continuous: bool = False,
    blocked: Iterable[Segment] = (),
) -> VehiclePlan:
    """The cheapest plan for one car under its rules.

    Raises ``PlanError`` with a status key when no plan can be made:
    ``no_price_data``, ``limit_not_above_soc`` (already at the target),
    ``invalid_input``, or ``not_enough_prices`` when the prices do not reach
    the deadline yet (tomorrow's prices usually arrive in the early
    afternoon).
    """
    if not prices:
        raise PlanError("no_price_data")
    need = charge_need(car.soc, car.target, car.capacity, car.power, car.efficiency)
    last_price_end = prices[-1].end
    if deadline is not None and last_price_end < deadline:
        raise PlanError("not_enough_prices")
    end = deadline if deadline is not None else no_deadline_end(prices, now)
    start = window_start(now, earliest, deadline)
    window = cut_slots(limit_slots(list(prices), start, end), blocked)
    if not window:
        raise PlanError("no_window")

    ceiling, opportunistic = effective_ceiling(rules, prices)
    allowed = window if ceiling is None else [slot for slot in window if slot.price <= ceiling + EPSILON]
    short = slot_hours(window) + EPSILON < need.hours
    limited = False
    min_only = False

    if slot_hours(allowed) + EPSILON >= need.hours:
        segments, mode = _select(list(allowed), need, car.power, continuous)
        hours = need.hours
    else:
        # The ceiling (or the time left) does not allow the whole charge.
        min_need = None
        if rules.min_soc > car.soc + EPSILON:
            min_need = charge_need(car.soc, min(rules.min_soc, car.target), car.capacity, car.power, car.efficiency)
        if min_need is not None and slot_hours(allowed) + EPSILON < min_need.hours:
            min_only = True
            if slot_hours(window) + EPSILON >= min_need.hours:
                segments, mode = _select(list(window), min_need, car.power, continuous)
                hours = min_need.hours
            else:
                segments, mode = _all_of(window), MODE_SPLIT
                hours = segments_hours(segments)
        else:
            segments, mode = _all_of(allowed), MODE_SPLIT
            hours = segments_hours(segments)
        limited = ceiling is not None and not short
        if not segments:
            raise PlanError("no_window")

    planned = _need_for_hours(need, hours) if abs(hours - need.hours) > EPSILON else need
    cost = segments_cost(window, segments, car.power)

    charge_now_cost = None
    upcoming = limit_slots(list(prices), now, None)
    if upcoming and upcoming[0].start == ceil_minute(now):
        begin = upcoming[0].start
        charge_now_cost = energy_cost(upcoming, begin, begin + timedelta(hours=planned.hours), car.power)

    return VehiclePlan(
        segments=merge_segments(segments),
        cost=cost,
        energy=planned.grid_kwh,
        battery_energy=planned.battery_kwh,
        minutes=planned.minutes,
        mode=mode,
        speed=need.speed_pct_per_hour,
        end_soc=min(100.0, car.soc + planned.battery_kwh / car.capacity * 100),
        charge_now_cost=charge_now_cost,
        ceiling=ceiling,
        opportunistic=opportunistic,
        limited=limited,
        min_only=min_only,
        short=short,
    )


# ----------------------------------------------------------------------
# What to do now


def in_segments(segments: Iterable[Segment], now: datetime) -> bool:
    return any(seg["start"] <= now < seg["end"] for seg in segments)


def decide(
    now: datetime,
    *,
    mode: str,
    connected: bool | None,
    home: bool | None = None,
    soc: float | None,
    target: float,
    segments: Sequence[Segment],
    rules: Rules,
    price_now: float | None,
    plan_done: bool = False,
    charger_free: bool = True,
) -> Decision:
    """What the charger should do for this car right now.

    ``connected`` and ``home`` are None when unknown (no sensor): then the car
    is taken to be plugged in at home. ``plan_done`` is True when the car's
    last plan has ended (for keeping the charger on). ``charger_free`` is
    False when a guest or another car has the charger now.
    """
    if mode == MODE_OFF:
        return Decision(CONTROL_RELEASED, "off")
    if connected is False:
        return Decision(CONTROL_RELEASED, "unplugged")
    if home is False:
        return Decision(CONTROL_RELEASED, "away")
    if mode == MODE_PAUSE:
        return Decision(CONTROL_PAUSE, "paused")
    full = soc is not None and soc + EPSILON >= target
    if mode == MODE_CHARGE_NOW:
        if full:
            return Decision(CONTROL_CHARGE, "keep_on") if rules.keep_on else Decision(CONTROL_PAUSE, "full")
        return Decision(CONTROL_CHARGE, "charge_now")
    if not charger_free:
        return Decision(CONTROL_PAUSE, "charger_busy")
    if full:
        return Decision(CONTROL_CHARGE, "keep_on") if rules.keep_on else Decision(CONTROL_PAUSE, "full")
    if rules.low_soc_level is not None and soc is not None and soc < rules.low_soc_level:
        return Decision(CONTROL_CHARGE, "low_soc")
    if rules.low_price_level is not None and price_now is not None and price_now <= rules.low_price_level + EPSILON:
        return Decision(CONTROL_CHARGE, "low_price")
    if in_segments(segments, now):
        return Decision(CONTROL_CHARGE, "planned")
    if rules.keep_on and plan_done:
        return Decision(CONTROL_CHARGE, "keep_on")
    return Decision(CONTROL_PAUSE, "waiting")


def current_price(prices: Sequence[PriceSlot], now: datetime) -> float | None:
    return price_at(list(prices), now)
