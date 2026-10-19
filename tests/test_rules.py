"""Tests for the household car rules (pure, without Home Assistant)."""

from __future__ import annotations

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.ev_planner.planner import PlanError, PriceSlot
from custom_components.ev_planner.rules import (
    Car,
    Rules,
    current_price,
    cut_slots,
    decide,
    effective_ceiling,
    in_segments,
    next_deadline,
    parse_hhmm,
    plan_vehicle,
    segments_cost,
    window_start,
)

TZ = ZoneInfo("Europe/Copenhagen")
# Monday 19 October 2026, 20:00.
NOW = datetime(2026, 10, 19, 20, 0, tzinfo=TZ)
# Hourly prices from 20:00 to 07:00 next morning, cheapest 01-04.
NIGHT = [1.8, 1.5, 1.2, 1.0, 0.9, 0.4, 0.3, 0.35, 0.8, 1.1, 1.6]
CAR = Car(soc=50, target=80, capacity=60, power=10, efficiency=1.0)  # 18 kWh = 1.8 h


def slots(prices: list[float], start: datetime = NOW, minutes: int = 60) -> list[PriceSlot]:
    step = timedelta(minutes=minutes)
    return [PriceSlot(start + step * i, start + step * (i + 1), price) for i, price in enumerate(prices)]


def hhmm(segments) -> list[tuple[str, str]]:
    return [(seg["start"].strftime("%H:%M"), seg["end"].strftime("%H:%M")) for seg in segments]


DEADLINE = NOW.replace(hour=7) + timedelta(days=1)


# ----------------------------------------------------------------------
# Time


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("07:00", time(7)),
        ("22:15:30", time(22, 15)),
        (time(6), time(6)),
        ("25:00", None),
        ("x", None),
        (None, None),
        ("7", None),
        ("a:b", None),
    ],
)
def test_parse_hhmm(value, expected) -> None:
    assert parse_hhmm(value) == expected


def test_next_deadline_uses_the_default_time() -> None:
    assert next_deadline(NOW, default=time(7), use_default=True) == DEADLINE
    assert next_deadline(NOW, default=time(22), use_default=True) == NOW.replace(hour=22)


def test_next_deadline_skips_days_without_a_deadline_and_uses_day_times() -> None:
    schedule = {"tue": "none", "wed": "08:30"}
    assert next_deadline(NOW, default=time(7), use_default=True, schedule=schedule) == (
        NOW.replace(hour=8, minute=30) + timedelta(days=2)
    )


def test_next_deadline_off_and_bad_schedule_entries() -> None:
    assert next_deadline(NOW, default=time(7), use_default=False) is None
    everything_off = dict.fromkeys(("mon", "tue", "wed", "thu", "fri", "sat", "sun"), "none")
    assert next_deadline(NOW, default=time(7), use_default=True, schedule=everything_off) is None
    assert next_deadline(NOW, default=time(7), use_default=True, schedule={"tue": "bad"}) == DEADLINE + timedelta(
        days=1
    )


def test_next_deadline_calendar_event_wins_when_earlier() -> None:
    trip = NOW + timedelta(hours=5)
    assert next_deadline(NOW, default=time(7), use_default=True, event=trip) == trip
    later = DEADLINE + timedelta(hours=3)
    assert next_deadline(NOW, default=time(7), use_default=True, event=later) == DEADLINE
    assert next_deadline(NOW, default=time(7), use_default=False, event=later) == later
    assert next_deadline(NOW, default=time(7), use_default=False, event=NOW - timedelta(hours=1)) is None


def test_window_start() -> None:
    assert window_start(NOW, None, DEADLINE) == NOW
    assert window_start(NOW, time(22), None) == NOW
    # Before the window opens: wait for 22:00.
    assert window_start(NOW, time(22), DEADLINE) == NOW.replace(hour=22)
    # Inside the window that opened at 18:00.
    assert window_start(NOW, time(18), DEADLINE) == NOW
    # A start after the deadline never delays.
    assert window_start(NOW, time(10), NOW + timedelta(hours=5)) == NOW


# ----------------------------------------------------------------------
# Prices


def test_effective_ceiling() -> None:
    prices = slots([1.0, 2.0, 0.3])
    assert effective_ceiling(Rules(), prices) == (None, False)
    assert effective_ceiling(Rules(ceiling=1.5), []) == (1.5, False)
    assert effective_ceiling(Rules(ceiling=1.5), prices) == (1.5, False)
    lowered = effective_ceiling(Rules(ceiling=1.0, opportunistic="lower_ceiling", opportunistic_level=50), prices)
    assert lowered == (0.5, True)
    expensive_end = slots([1.0, 2.0, 0.9])
    assert effective_ceiling(Rules(ceiling=1.0, opportunistic="lower_ceiling"), expensive_end) == (1.0, False)
    follow = effective_ceiling(Rules(opportunistic="follow_end_price", follow_level=90), prices)
    assert follow[0] == pytest.approx(0.27) and follow[1]
    negative = effective_ceiling(Rules(opportunistic="follow_end_price", follow_level=90), slots([1.0, -0.5]))
    assert negative[0] == pytest.approx(-0.55)
    capped = effective_ceiling(Rules(ceiling=0.1, opportunistic="follow_end_price"), prices)
    assert capped == (0.1, False)


def test_cut_slots_removes_blocked_periods() -> None:
    base = slots([1.0, 2.0])
    blocked = [{"start": NOW + timedelta(minutes=15), "end": NOW + timedelta(minutes=75)}]
    pieces = cut_slots(base, blocked)
    assert [(p.start.minute, p.end.minute, p.price) for p in pieces] == [(0, 15, 1.0), (15, 0, 2.0)]
    assert cut_slots(base, []) == base
    assert cut_slots(base, [{"start": NOW - timedelta(hours=5), "end": NOW + timedelta(hours=5)}]) == []


def test_segments_cost_and_current_price() -> None:
    base = slots([1.0, 2.0])
    segment = [{"start": NOW + timedelta(minutes=30), "end": NOW + timedelta(minutes=90)}]
    assert segments_cost(base, segment, 10) == pytest.approx(0.5 * 10 * 1.0 + 0.5 * 10 * 2.0)
    assert current_price(base, NOW + timedelta(minutes=70)) == 2.0
    assert in_segments(segment, NOW + timedelta(minutes=45))
    assert not in_segments(segment, NOW)


# ----------------------------------------------------------------------
# Planning


def test_plan_picks_the_cheapest_hours_before_the_deadline() -> None:
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=DEADLINE)
    assert hhmm(plan.segments) == [("02:00", "03:48")]
    assert plan.mode == "split"
    assert plan.energy == pytest.approx(18)
    assert plan.end_soc == pytest.approx(80)
    assert plan.savings is not None and plan.savings > 0
    assert plan.average_price is not None
    assert plan.start == plan.segments[0]["start"] and plan.end == plan.segments[-1]["end"]
    assert not (plan.limited or plan.min_only or plan.short)


def test_plan_one_period() -> None:
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=DEADLINE, continuous=True)
    assert plan.mode == "continuous"
    assert len(plan.segments) == 1


def test_plan_without_deadline_uses_all_known_prices() -> None:
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=None)
    assert hhmm(plan.segments) == [("02:00", "03:48")]


def test_plan_without_deadline_looks_one_day_ahead() -> None:
    """A week of forecast prices must not move the plan to next Sunday."""
    week = [*[1.0] * 30, *[0.1] * 4, *[1.0] * 100]
    plan = plan_vehicle(slots(week), CAR, Rules(), NOW, deadline=None)
    assert plan.segments[0]["start"] < NOW + timedelta(hours=24)
    assert plan.segments[-1]["end"] <= NOW + timedelta(hours=24)


def test_opportunistic_ignores_forecast() -> None:
    published = slots([1.0, 1.0])
    forecast = [PriceSlot(s.start + timedelta(hours=2), s.end + timedelta(hours=2), 0.0, True) for s in published]
    rules = Rules(ceiling=2.0, opportunistic="lower_ceiling", opportunistic_level=50)
    assert effective_ceiling(rules, [*published, *forecast]) == (2.0, False)
    assert effective_ceiling(rules, forecast) == (2.0, False)


def test_plan_errors() -> None:
    with pytest.raises(PlanError, match="no_price_data"):
        plan_vehicle([], CAR, Rules(), NOW, deadline=DEADLINE)
    with pytest.raises(PlanError, match="not_enough_prices"):
        plan_vehicle(slots(NIGHT[:3]), CAR, Rules(), NOW, deadline=DEADLINE)
    full = Car(soc=80, target=80, capacity=60, power=10, efficiency=1.0)
    with pytest.raises(PlanError, match="limit_not_above_soc"):
        plan_vehicle(slots(NIGHT), full, Rules(), NOW, deadline=DEADLINE)
    everything = [{"start": NOW - timedelta(hours=1), "end": DEADLINE}]
    with pytest.raises(PlanError, match="no_window"):
        plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=DEADLINE, blocked=everything)


def test_plan_short_of_time_charges_all_it_can() -> None:
    soon = NOW + timedelta(hours=1)
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=soon)
    assert plan.short and not plan.limited
    assert hhmm(plan.segments) == [("20:00", "21:00")]
    assert plan.energy == pytest.approx(10)


def test_ceiling_that_still_allows_the_whole_charge() -> None:
    # Only the 0.30 and 0.35 hours are at or below the ceiling: 2 h ≥ 1.8 h, so the target is reached.
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(ceiling=0.35), NOW, deadline=DEADLINE)
    assert not plan.limited
    assert plan.ceiling == 0.35
    assert hhmm(plan.segments) == [("02:00", "03:48")]
    assert plan.energy == pytest.approx(18)


def test_ceiling_too_low_for_the_whole_charge() -> None:
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(ceiling=0.3), NOW, deadline=DEADLINE)
    assert plan.limited and not plan.min_only
    assert hhmm(plan.segments) == [("02:00", "03:00")]
    assert plan.energy == pytest.approx(10)
    assert plan.end_soc == pytest.approx(50 + 10 / 60 * 100)


def test_minimum_level_is_reached_whatever_the_price() -> None:
    car = Car(soc=20, target=80, capacity=60, power=10, efficiency=1.0)
    plan = plan_vehicle(slots(NIGHT), car, Rules(ceiling=0.3, min_soc=50), NOW, deadline=DEADLINE)
    assert plan.min_only
    # 30 % of 60 kWh = 18 kWh = 1.8 h at the cheapest prices, ignoring the ceiling.
    assert plan.energy == pytest.approx(18)


def test_minimum_level_without_enough_time() -> None:
    car = Car(soc=10, target=80, capacity=60, power=10, efficiency=1.0)
    soon = NOW + timedelta(hours=1)
    plan = plan_vehicle(slots(NIGHT), car, Rules(ceiling=0.1, min_soc=50), NOW, deadline=soon)
    assert plan.min_only and plan.short
    assert hhmm(plan.segments) == [("20:00", "21:00")]


def test_blocked_periods_are_left_to_others() -> None:
    taken = [{"start": NOW.replace(hour=1) + timedelta(days=1), "end": NOW.replace(hour=3) + timedelta(days=1)}]
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=DEADLINE, blocked=taken)
    for segment in plan.segments:
        assert segment["end"] <= taken[0]["start"] or segment["start"] >= taken[0]["end"]


def test_earliest_start_delays_the_plan() -> None:
    prices = [0.1, 1.0, 1.0, 1.0, 1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    early = plan_vehicle(slots(prices), CAR, Rules(), NOW, deadline=DEADLINE)
    assert hhmm(early.segments)[0][0] == "20:00"
    late = plan_vehicle(slots(prices), CAR, Rules(), NOW, deadline=DEADLINE, earliest=time(23))
    assert all(seg["start"] >= NOW.replace(hour=23) for seg in late.segments)


def test_charge_now_cost_needs_a_price_now() -> None:
    later = slots(NIGHT, start=NOW + timedelta(hours=1))
    plan = plan_vehicle(later, CAR, Rules(), NOW, deadline=DEADLINE)
    assert plan.charge_now_cost is None and plan.savings is None


# ----------------------------------------------------------------------
# Deciding


SEGMENT = [{"start": NOW, "end": NOW + timedelta(hours=1)}]


def _decide(**kwargs):
    base = {
        "mode": "smart",
        "connected": True,
        "home": True,
        "soc": 50.0,
        "target": 80.0,
        "segments": [],
        "rules": Rules(),
        "price_now": 1.0,
    }
    base.update(kwargs)
    return decide(NOW, **base)


@pytest.mark.parametrize(
    ("kwargs", "control", "reason"),
    [
        ({"mode": "off"}, "released", "off"),
        ({"connected": False}, "released", "unplugged"),
        ({"home": False}, "released", "away"),
        ({"mode": "pause"}, "pause", "paused"),
        ({"mode": "charge_now"}, "charge", "charge_now"),
        ({"mode": "charge_now", "soc": 80.0}, "pause", "full"),
        ({"mode": "charge_now", "soc": 80.0, "rules": Rules(keep_on=True)}, "charge", "keep_on"),
        ({"charger_free": False}, "pause", "charger_busy"),
        ({"soc": 85.0}, "pause", "full"),
        ({"soc": 85.0, "rules": Rules(keep_on=True)}, "charge", "keep_on"),
        ({"soc": 10.0, "rules": Rules(low_soc_level=20)}, "charge", "low_soc"),
        ({"price_now": 0.2, "rules": Rules(low_price_level=0.3)}, "charge", "low_price"),
        ({"segments": SEGMENT}, "charge", "planned"),
        ({"plan_done": True, "rules": Rules(keep_on=True)}, "charge", "keep_on"),
        ({}, "pause", "waiting"),
        ({"connected": None, "home": None, "segments": SEGMENT}, "charge", "planned"),
        ({"soc": None, "segments": SEGMENT}, "charge", "planned"),
    ],
)
def test_decide(kwargs, control, reason) -> None:
    decision = _decide(**kwargs)
    assert (decision.control, decision.reason) == (control, reason)
