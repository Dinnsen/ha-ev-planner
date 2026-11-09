"""Several cars on one supply: the house first, then each car's must, then the rest."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.ev_household_planner.planner import PriceSlot
from custom_components.ev_household_planner.supply import (
    MIN_AMPS,
    HouseForecast,
    SharedCar,
    SupplyPlan,
    amps_for,
    cheap_hours,
    kw,
    plan_supply,
)

TZ = ZoneInfo("Europe/Copenhagen")
NOW = datetime(2026, 11, 9, 22, 0, tzinfo=TZ)
DEADLINE = NOW + timedelta(hours=8)  # 06:00


def slots(prices: list[float]) -> list[PriceSlot]:
    return [PriceSlot(NOW + timedelta(hours=i), NOW + timedelta(hours=i + 1), p) for i, p in enumerate(prices)]


NIGHT = slots([2.5, 2.4, 2.2, 2.0, 1.9, 2.1, 2.3, 2.6])


def car(vid: str, must: float, want: float | None = None, *, priority: int = 1, adjustable: bool = True) -> SharedCar:
    return SharedCar(
        vid,
        must,
        want if want is not None else must,
        max_amps=16,
        deadline=DEADLINE,
        priority=priority,
        adjustable=adjustable,
    )


def delivered(plan: SupplyPlan, vid: str) -> float:
    return sum(kw(amps, 3) * (end - start).total_seconds() / 3600 for start, end, amps in plan.amps[vid])


def test_units() -> None:
    assert kw(16, 3) == pytest.approx(11.04)
    assert amps_for(11.04, 3) == pytest.approx(16)


def test_one_car_takes_the_cheapest_hours_under_the_limit() -> None:
    plan = plan_supply(NIGHT, [car("a", 20)], NOW, limit=25, house=lambda slot: 5)
    # Enough, and at most a slot at the least current more (the car stops by itself).
    assert 20 <= delivered(plan, "a") <= 20 + kw(MIN_AMPS, 3)
    hours = {start.hour for start, _end, _amps in plan.amps["a"]}
    assert 2 in hours and hours <= {1, 2, 3}
    assert all(amps <= 16 for _s, _e, amps in plan.amps["a"])
    assert plan.short_kwh["a"] == 0


def test_two_cars_share_and_never_go_over_the_limit() -> None:
    plan = plan_supply(NIGHT, [car("a", 30), car("b", 30)], NOW, limit=23, house=lambda slot: 8)
    for start, _end, _limit, house in plan.capacity:
        used = sum(amps for vid in ("a", "b") for s, _e, amps in plan.amps[vid] if s == start)
        assert used + house <= 23 + 1e-6
    assert 30 <= delivered(plan, "a") <= 30 + kw(MIN_AMPS, 3)
    assert 30 <= delivered(plan, "b") <= 30 + kw(MIN_AMPS, 3)


def test_not_enough_for_both_the_must_comes_first_then_priority() -> None:
    # 15 A for the cars for 8 hours: about 83 kWh. Both must have 30; both want 60.
    plan = plan_supply(NIGHT, [car("a", 30, 60, priority=0), car("b", 30, 60)], NOW, limit=23, house=lambda slot: 8)
    assert delivered(plan, "b") >= 30 - 1e-6
    assert delivered(plan, "a") > delivered(plan, "b")
    assert plan.short_kwh["b"] > plan.short_kwh["a"]


def test_a_charger_that_can_only_be_on_or_off_takes_turns() -> None:
    cars = [car("a", 20, adjustable=False), car("b", 20, adjustable=False)]
    plan = plan_supply(NIGHT, cars, NOW, limit=23, house=lambda slot: 5)
    for start, _end, _limit, _house in plan.capacity:
        on = [vid for vid in ("a", "b") if any(s == start for s, _e, _a in plan.amps[vid])]
        assert len(on) <= 1  # 2 x 16 A does not fit in 18 A
    assert all(amps == 16 for vid in ("a", "b") for _s, _e, amps in plan.amps[vid])
    assert delivered(plan, "a") >= 20 and delivered(plan, "b") >= 20


def test_never_under_the_least_a_charger_gives_and_never_after_the_deadline() -> None:
    plan = plan_supply(NIGHT, [car("a", 2)], NOW, limit=25, house=lambda slot: 22)
    assert plan.amps["a"] == [] and plan.short_kwh["a"] == 2  # 3 A is too little to charge at all
    plan = plan_supply(NIGHT, [car("a", 1)], NOW, limit=25, house=lambda slot: 0)
    assert all(amps >= MIN_AMPS for _s, _e, amps in plan.amps["a"])
    early = SharedCar("a", 10, 10, max_amps=16, deadline=NOW + timedelta(hours=3))
    plan = plan_supply(NIGHT, [early], NOW, limit=25, house=lambda slot: 0)
    assert early.deadline is not None and all(end <= early.deadline for _s, end, _a in plan.amps["a"])
    first = plan.segments("a")[0]["start"]
    assert plan.amps_at("a", first) is not None
    assert plan.amps_at("a", NOW - timedelta(hours=1)) is None


def test_the_house_forecast_learns_cheap_hours_apart() -> None:
    forecast = HouseForecast()
    assert forecast.predict(2, True, reserve=6) == 6
    for amps in (8, 9, 10, 11, 12):
        forecast.add(2, True, amps)
    for amps in (3, 3, 4):
        forecast.add(2, False, amps)
    assert forecast.predict(2, True, reserve=6) == 12  # 80th percentile of five days
    assert forecast.predict(2, False, reserve=6) == 4
    assert forecast.predict(3, False, reserve=6) == 6
    for _ in range(20):
        forecast.add(2, True, 1)
    assert len(forecast.samples["02c"]) == 14
    again = HouseForecast.from_dict(forecast.to_dict())
    assert again.predict(2, True, reserve=6) == 1
    assert HouseForecast.from_dict(None).samples == {}


def test_cheap_hours_are_the_cheapest_third_of_each_day() -> None:
    # 22-23 on one day, 00-05 on the next: the cheapest of each.
    assert {start.hour for start in cheap_hours(NIGHT)} == {23, 1, 2}
