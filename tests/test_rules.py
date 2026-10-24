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
    no_deadline_end,
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
CAR = Car(soc=50, target=80, capacity=60, power=10)  # 18 kWh = 1.8 h


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


def test_plan_joins_a_split_plan_when_one_period_costs_little_more() -> None:
    """Last night: 02-06 cheapest, the last hour cheapest tomorrow evening.

    With "finish in one period" the car charges in one go when that costs at
    most the set amount more per kWh, and splits as before when it costs more.
    """
    night = datetime(2026, 10, 24, 0, 0, tzinfo=TZ)
    # 00-24 on Saturday: 02-06 cheapest, then 23:00 just below the hours around the night.
    day = [0.47, 0.47, 0.41, 0.42, 0.41, 0.42, 0.53, 0.66, *[0.7] * 13, 0.6, 0.58, 0.45]
    car = Car(soc=13, target=100, capacity=50, power=10)  # 43.5 kWh = 4.35 h
    prices = slots(day, night)

    split = plan_vehicle(prices, car, Rules(), night, deadline=None)
    assert split.mode == "split" and len(split.segments) == 2
    assert not split.joined and split.joined_extra == 0

    joined = plan_vehicle(prices, car, Rules(join_within=0.05), night, deadline=None)
    assert joined.mode == "continuous" and len(joined.segments) == 1
    assert joined.joined
    assert joined.joined_extra == pytest.approx(joined.cost - split.cost)
    assert 0 < joined.joined_extra / joined.energy <= 0.05
    assert joined.end_soc == pytest.approx(100)

    # A difference above the setting keeps the split plan.
    strict = plan_vehicle(prices, car, Rules(join_within=0.001), night, deadline=None)
    assert strict.mode == "split" and not strict.joined


def test_join_goes_on_charging_when_now_costs_little_more() -> None:
    """06:00, the car not full yet: 06-07 costs 0.53, tonight's 23:00 0.45.

    Within 0.10 per kWh the car goes on charging now; within 0.05 it waits.
    """
    six = datetime(2026, 10, 24, 6, 0, tzinfo=TZ)
    rest = [0.53, 0.66, *[0.7] * 14, 0.58, 0.45]  # 06:00-23:59
    car = Car(soc=81, target=100, capacity=50, power=10)  # 9.5 kWh = 0.95 h
    prices = slots(rest, six)
    wait = plan_vehicle(prices, car, Rules(join_within=0.05), six, deadline=None)
    assert hhmm(wait.segments)[0][0] == "23:00" and not wait.joined
    go_on = plan_vehicle(prices, car, Rules(join_within=0.1), six, deadline=None)
    assert hhmm(go_on.segments) == [("06:00", "06:57")]
    assert go_on.joined and go_on.mode == "continuous"
    assert go_on.joined_extra == pytest.approx(go_on.cost - wait.cost)


def test_join_leaves_the_other_cars_cheap_hours() -> None:
    """The other car on the charger has 06:00-07:00 planned: no going on charging into it."""
    six = datetime(2026, 10, 24, 6, 0, tzinfo=TZ)
    rest = [0.53, 0.66, *[0.7] * 14, 0.58, 0.45]
    car = Car(soc=81, target=100, capacity=50, power=10)
    other = [{"start": six + timedelta(minutes=30), "end": six + timedelta(hours=1)}]
    plan = plan_vehicle(slots(rest, six), car, Rules(join_within=0.5), six, deadline=None, reserved=other)
    assert not any(seg["start"] < other[0]["end"] and other[0]["start"] < seg["end"] for seg in plan.segments)
    assert hhmm(plan.segments) != [("06:00", "06:57")]


def test_join_leaves_plans_that_are_one_period_already() -> None:
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(join_within=0.5), NOW, deadline=DEADLINE)
    assert hhmm(plan.segments) == [("02:00", "03:48")]
    assert plan.mode == "split" and not plan.joined
    # "One period" chosen by the user is not "joined".
    chosen = plan_vehicle(slots(NIGHT), CAR, Rules(join_within=0.5), NOW, deadline=DEADLINE, continuous=True)
    assert chosen.mode == "continuous" and not chosen.joined


def test_plan_without_deadline_uses_all_known_prices() -> None:
    plan = plan_vehicle(slots(NIGHT), CAR, Rules(), NOW, deadline=None)
    assert hhmm(plan.segments) == [("02:00", "03:48")]


def test_plan_without_deadline_looks_one_day_ahead() -> None:
    """A week of forecast prices must not move the plan to next Sunday."""
    week = [*[1.0] * 30, *[0.1] * 4, *[1.0] * 100]
    plan = plan_vehicle(slots(week), CAR, Rules(), NOW, deadline=None)
    assert plan.segments[0]["start"] < NOW + timedelta(hours=24)
    assert plan.segments[-1]["end"] <= NOW + timedelta(hours=24)


def test_plan_without_deadline_does_not_wait_for_a_forecast() -> None:
    """Last night: published prices to midnight, a cheaper forecast after it.

    The plan must charge in tonight's cheapest published hours, and not move
    a little further into tomorrow's forecast every few minutes.
    """
    midnight = datetime(2026, 10, 21, 0, 0, tzinfo=TZ)
    tonight = slots(
        [
            1.77,
            1.75,
            1.67,
            1.74,
            1.75,
            1.77,
            2.14,
            2.43,
            2.57,
            2.59,
            2.46,
            2.3,
            2.17,
            2.09,
            2.08,
            2.24,
            2.48,
            3.02,
            2.92,
            2.98,
            2.75,
            2.16,
            2.05,
            1.85,
        ],
        midnight,
    )
    tomorrow = [
        PriceSlot(s.start + timedelta(days=1), s.end + timedelta(days=1), price, True)
        for s, price in zip(tonight, [1.1, 1.03, 0.97, 0.92, 0.86, 0.8, 0.92, 1.04, *[1.2] * 16], strict=True)
    ]
    prices = [*tonight, *tomorrow]
    car = Car(soc=46, target=100, capacity=52.5, power=11, speed=11 * 0.9 / 52.5 * 100)
    plans = [
        plan_vehicle(prices, car, Rules(), midnight + timedelta(minutes=minutes), deadline=None)
        for minutes in (0, 3, 6, 61, 173)
    ]
    for plan in plans:
        assert plan.segments[-1]["end"] <= midnight + timedelta(days=1)
    assert plans[0].segments == plans[1].segments == plans[2].segments
    # Tonight's cheap hours (02-04 is the cheapest), never tomorrow's forecast.
    assert midnight + timedelta(hours=1) <= plans[0].segments[0]["start"] < midnight + timedelta(hours=2)
    assert plans[0].segments[-1]["end"] <= midnight + timedelta(hours=5)
    # Half-way through the night it still charges tonight.
    assert plans[4].segments[0]["start"] < midnight + timedelta(hours=4)
    assert plans[4].segments[-1]["end"] <= midnight + timedelta(hours=6)


def test_no_deadline_end() -> None:
    week = slots([1.0] * 48)
    # A whole slot, never part of one.
    assert no_deadline_end(week, NOW + timedelta(minutes=20)) == NOW + timedelta(hours=24)
    # Only forecasts: they are all there is.
    forecast = [PriceSlot(s.start, s.end, s.price, True) for s in slots([1.0] * 3)]
    assert no_deadline_end(forecast, NOW) == NOW + timedelta(hours=3)


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
    full = Car(soc=80, target=80, capacity=60, power=10)
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
    car = Car(soc=20, target=80, capacity=60, power=10)
    plan = plan_vehicle(slots(NIGHT), car, Rules(ceiling=0.3, min_soc=50), NOW, deadline=DEADLINE)
    assert plan.min_only
    # 30 % of 60 kWh = 18 kWh = 1.8 h at the cheapest prices, ignoring the ceiling.
    assert plan.energy == pytest.approx(18)


def test_minimum_level_without_enough_time() -> None:
    car = Car(soc=10, target=80, capacity=60, power=10)
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
