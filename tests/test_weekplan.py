"""The week plan: the cheapest hours at home for one or two cars at a charger, hour by hour for a week."""

from __future__ import annotations

from datetime import datetime, timedelta

from custom_components.ev_household_planner.weekplan import (
    WHY_CHEAP,
    WHY_FILL,
    WHY_FULL,
    WHY_LOW,
    WHY_NEED,
    Hour,
    WeekCar,
    leaving,
    plan_week,
    replay,
    stay_end,
    stays,
    stretches,
    summary,
)

# Tuesday evening, 20:00.
START = datetime(2026, 11, 17, 20)


def price(moment: datetime) -> float:
    """Dear from 17 to 21, cheap at noon (cheapest at the weekend), a bit dear in the morning."""
    hour = moment.hour
    if 17 <= hour < 21:
        return 2.1
    if 10 <= hour < 15:
        return 0.72 if moment.weekday() >= 5 else 1.0
    if hour < 6:
        return 1.05
    return 1.4


def week(known: int = 28, prices=price) -> tuple[list[Hour], list[int]]:
    hours, day_of = [], []
    for index in range(168):
        moment = START + timedelta(hours=index)
        guess = index >= known
        hours.append(Hour(moment, prices(moment), "forecast" if guess else "known", 0.2 if guess else 0.0))
        day_of.append((moment.date() - START.date()).days)
    return hours, day_of


def at_work(moment: datetime) -> bool:
    """Home except 7 to 15 on Tuesday, Wednesday and Thursday."""
    return not (moment.weekday() in (1, 2, 3) and 7 <= moment.hour < 15)


def school_run(moment: datetime) -> bool:
    """Home except 7-8 and 14-15 on weekdays."""
    return not (moment.weekday() < 5 and (moment.hour == 7 or moment.hour == 14))


def car(name: str, hours: list[Hour], home, soc: float = 0.5, **kw) -> WeekCar:
    capacity = kw.pop("capacity", 60.0)
    return WeekCar(
        vehicle_id=name,
        capacity=capacity,
        soc=soc * capacity,
        power=kw.pop("power", 10.0),
        minimum=kw.pop("minimum", 0.2 * capacity),
        preferred=[kw.pop("preferred", 0.8) * capacity] * len(hours),
        hard=kw.pop("hard", [20.0] * 8),
        typical=kw.pop("typical", [8.0] * 8),
        reserve=kw.pop("reserve", 0.1 * capacity),
        home=[home(hour.start) for hour in hours],
        **kw,
    )


def enough(plan, cars: list[WeekCar]) -> None:
    """Before every departure each car has its hard day, the reserve and its minimum."""
    for one in cars:
        result = plan[one.vehicle_id]
        assert not result.short
        for hour, _day, need in result.leaves:
            before = result.soc_typical[hour - 1] if hour else one.soc
            assert before >= max(one.minimum, need + one.reserve) - 0.01


def test_one_car_charges_at_the_cheapest_hours_at_home() -> None:
    hours, day_of = week()
    tesla = car("tesla", hours, at_work, soc=0.4)
    plan = plan_week([tesla], hours, day_of)
    enough(plan, [tesla])
    charged = [h for h, kwh in enumerate(plan["tesla"].charge) if kwh > 0]
    assert charged
    # Never in the dear evening hours, never away, never over the preferred level.
    assert all(not 17 <= hours[h].start.hour < 21 for h in charged)
    assert all(tesla.home[h] for h in charged)
    assert max(plan["tesla"].soc_typical) <= 0.8 * 60 + 0.01
    # The weekend's cheap noons are used: the week's cheapest hours at home.
    assert any(hours[h].start.weekday() >= 5 and 10 <= hours[h].start.hour < 15 for h in charged)


def test_a_car_home_by_day_charges_at_noon_not_at_night() -> None:
    hours, day_of = week()
    mercedes = car("mercedes", hours, school_run, soc=0.3, hard=[15.0] * 8, typical=[5.0] * 8)
    plan = plan_week([mercedes], hours, day_of)
    enough(plan, [mercedes])
    # Most of it at noon; only what tomorrow morning needs comes before.
    charge = plan["mercedes"].charge
    noon = sum(kwh for h, kwh in enumerate(charge) if 10 <= hours[h].start.hour < 15)
    assert noon > sum(charge) / 2


def test_two_cars_at_one_charger_never_share_an_hour() -> None:
    hours, day_of = week()
    tesla = car("tesla", hours, at_work, soc=0.3)
    mercedes = car("mercedes", hours, school_run, soc=0.3, hard=[15.0] * 8)
    plan = plan_week([tesla, mercedes], hours, day_of)
    enough(plan, [tesla, mercedes])
    both = [h for h in range(168) if plan["tesla"].charge[h] > 0 and plan["mercedes"].charge[h] > 0]
    assert both == []
    # Each alone (two chargers) may well take the same cheap hours.
    alone_t = plan_week([tesla], hours, day_of)["tesla"]
    alone_m = plan_week([mercedes], hours, day_of)["mercedes"]
    assert any(alone_t.charge[h] > 0 and alone_m.charge[h] > 0 for h in range(168))


def test_a_full_charge_before_a_departure_in_the_cheapest_stay() -> None:
    hours, day_of = week()
    mercedes = car("mercedes", hours, school_run, soc=0.85, full_level=60.0, full_due=0, typical=[2.0] * 8)
    plan = plan_week([mercedes], hours, day_of)["mercedes"]
    assert plan.full_at is not None
    assert plan.soc_typical[plan.full_at - 1] >= 60 - 0.01
    assert WHY_FULL in plan.why
    # Not due this week: none.
    later = car("mercedes", hours, school_run, soc=0.85, full_level=60.0, full_due=None)
    assert plan_week([later], hours, day_of)["mercedes"].full_at is None
    # Due later than any departure: none either.
    late = car("mercedes", hours, school_run, soc=0.85, full_level=60.0, full_due=500)
    assert plan_week([late], hours, day_of)["mercedes"].full_at is None


def test_low_prices_charge_to_their_own_level() -> None:
    hours, day_of = week(known=168, prices=lambda m: 0.1 if m.hour == 3 else 2.0)
    tesla = car(
        "tesla", hours, lambda m: True, soc=0.5, low_price=0.2, low_level=60.0, hard=[0.0] * 8, typical=[0.0] * 8
    )
    plan = plan_week([tesla], hours, day_of)["tesla"]
    assert WHY_LOW in plan.why
    assert max(plan.soc_typical) == 60.0
    # Forecast prices are not trusted for it.
    hours, day_of = week(known=0, prices=lambda m: 0.1 if m.hour == 3 else 2.0)
    tesla = car(
        "tesla", hours, lambda m: True, soc=0.5, low_price=0.2, low_level=60.0, hard=[0.0] * 8, typical=[0.0] * 8
    )
    assert WHY_LOW not in plan_week([tesla], hours, day_of)["tesla"].why


def test_fill_up_tops_every_stay_to_the_preferred_level() -> None:
    hours, day_of = week()
    tesla = car("tesla", hours, at_work, soc=0.5, fill=True)
    plan = plan_week([tesla], hours, day_of)["tesla"]
    assert WHY_FILL in plan.why
    for hour, _day, _need in plan.leaves:
        if hour > 1 and tesla.home[hour - 1]:
            assert plan.soc_typical[hour - 1] >= 0.8 * 60 - 0.01
    # "Every night" fills every car's stays the same way.
    other = car("tesla", hours, at_work, soc=0.5)
    assert WHY_FILL in plan_week([other], hours, day_of, always=True)["tesla"].why


def test_always_cheapest_adds_only_a_charge_worth_starting() -> None:
    hours, day_of = week()
    # Nearly at the preferred level and hardly driving: the cheap hours would add too little to bother.
    calm = car("calm", hours, lambda m: True, soc=0.79, hard=[0.5] * 8, typical=[0.1] * 8)
    plan = plan_week([calm], hours, day_of)["calm"]
    assert sum(plan.charge) == 0
    # Far under it: the cheapest quarter of the hours at home fill it up.
    low = car("low", hours, lambda m: True, soc=0.3, hard=[0.5] * 8, typical=[0.1] * 8)
    plan = plan_week([low], hours, day_of)["low"]
    assert WHY_CHEAP in plan.why
    assert max(plan.soc_typical) <= 0.8 * 60 + 0.01
    # Too few hours at home to tell cheap from dear: nothing extra.
    rare = car("rare", hours, lambda m: m.hour == 3 and m.weekday() == 4, soc=0.3, hard=[0.0] * 8, typical=[0.0] * 8)
    assert sum(plan_week([rare], hours, day_of)["rare"].charge) == 0


def test_a_day_that_cannot_be_met_is_told() -> None:
    hours, day_of = week()
    # Home only for an hour before it leaves, with a long day ahead.
    short = car("short", hours, lambda m: m.weekday() != 2, soc=0.1, hard=[0.0, 0.0, 55.0] + [0.0] * 5, power=3.0)
    plan = plan_week([short], hours, day_of)["short"]
    assert plan.short


def test_a_guess_costs_a_bit_more_than_it_says() -> None:
    now = Hour(START, 1.0, "known")
    guess = Hour(START, 1.0, "forecast", 0.2)
    nothing = Hour(START, None, "none", 0.45)
    assert now.cost == 1.0 and guess.cost == 1.1 and nothing.cost > 1.0


def test_departures_and_stays() -> None:
    hours, day_of = week()
    weekend_home = car("x", hours, at_work)
    leaves = leaving(weekend_home, hours, day_of)
    # Wednesday and Thursday it leaves at 7; the days it is home it takes its driving at the end of the day.
    assert [hours[h].start.strftime("%a %H") for h, _d, _n in leaves[:2]] == ["Wed 07", "Thu 07"]
    assert all(day > 0 for _h, day, _n in leaves)
    assert stays([True, True, False, True]) == [[0, 1], [3]]
    assert stay_end([True, True, False, True]) == 2
    assert stay_end([True, True, True]) is None


def test_summary_for_the_screens() -> None:
    hours, day_of = week()
    tesla = car("tesla", hours, at_work, soc=0.3)
    result = plan_week([tesla], hours, day_of)["tesla"]
    brief = summary(result, tesla, hours)
    assert brief["charges"] and brief["charges"][0]["why"] == WHY_NEED
    first = brief["charges"][0]
    assert first["kwh"] > 0 and first["price"] is not None and first["level"] is not None
    assert len(brief["kwh"]) == len(brief["hard"]) == len(brief["typical"]) == len(brief["home"]) == 168
    assert brief["cost"] == round(sum(c["cost"] for c in brief["charges"]), 2)
    assert any(c["guess"] for c in brief["charges"]) or all(not c["guess"] for c in brief["charges"])
    # A car with no capacity known shows no levels.
    empty = car("none", hours, at_work, capacity=0.0)
    assert summary(plan_week([empty], hours, day_of)["none"], empty, hours)["hard"] == []


def test_replayed_over_days_gone_by() -> None:
    first = datetime(2026, 9, 1, 12)
    prices = {}
    for day in range(40):
        moment = first.date() + timedelta(days=day)
        prices[moment.isoformat()] = [price(datetime(moment.year, moment.month, moment.day, h)) for h in range(24)]
    home = [[not (wd < 5 and 7 <= h < 16) for h in range(24)] for wd in range(7)]
    cars = [
        {
            "id": "a",
            "capacity": 60.0,
            "power": 10.0,
            "minimum": 6.0,
            "target": 48.0,
            "used": {(first.date() + timedelta(days=d)).isoformat(): 8.0 + (d % 3) * 4 for d in range(40)},
            "hard": [16.0] * 7,
            "typical": [10.0] * 7,
            "home": home,
        },
        {
            "id": "b",
            "capacity": 60.0,
            "power": 10.0,
            "minimum": 6.0,
            "target": 48.0,
            # One day longer than any battery: no failing of the plan.
            "used": {(first.date() + timedelta(days=5)).isoformat(): 90.0},
            "hard": [2.0] * 7,
            "typical": [1.0] * 7,
            "home": [[True] * 24 for _ in range(7)],
        },
    ]
    result = replay(cars, prices, first, 28, {"level": 0.9, "reserve": 0.1, "rest": 0.5, "every": False})
    assert result["days"] == 28 and result["per_week"] > 0
    assert result["per"]["a"] > 0 and result["short"] == 0
    assert 0 < result["morning"] <= 100
    every = replay(cars, prices, first, 14, {"level": 0.9, "reserve": 0.1, "rest": 0.9, "every": True})
    assert every["per_week"] >= result["per_week"] - 0.01
    # Home an hour a night at a slow charger, and long days: it runs short.
    away = [{**cars[0], "home": [[h == 1 for h in range(24)] for _ in range(7)], "target": 30.0, "power": 1.0}]
    assert replay(away, prices, first, 7, {"level": 0.9, "reserve": 0.1, "rest": 0.5})["short"] > 0
    # No prices at all: still planned, by the hours alone.
    assert replay(cars[:1], {}, first, 3, {"level": 0.9, "reserve": 0.1, "rest": 0.5})["days"] == 3


def test_the_cable_is_not_moved_at_night() -> None:
    hours, day_of = week()
    window = stretches(hours, (21, 7))
    # Both low, both home only at night: each night is one car's.
    nights = lambda m: m.hour >= 21 or m.hour < 7  # noqa: E731
    a = car("a", hours, nights, soc=0.3, hard=[15.0] * 8, typical=[10.0] * 8)
    b = car("b", hours, nights, soc=0.3, hard=[15.0] * 8, typical=[10.0] * 8)
    plan = plan_week([a, b], hours, day_of, window=window)
    for key in {k for k in window if k is not None}:
        span = [h for h, k in enumerate(window) if k == key]
        who = {vid for vid in ("a", "b") for h in span if plan[vid].charge[h] > 0}
        assert len(who) <= 1, f"two cars in one night: {who}"
    # Without the rule a night may well be shared.
    free = plan_week([a, b], hours, day_of)
    assert any(
        {vid for vid in ("a", "b") for h in [h for h, k in enumerate(window) if k == key] if free[vid].charge[h] > 0}
        == {"a", "b"}
        for key in {k for k in window if k is not None}
    )
    # The car plugged in now keeps tonight; the other waits for its own night.
    held = plan_week([a, b], hours, day_of, window=window, holder="b")
    tonight = [h for h, k in enumerate(window) if k == window[0]]
    assert sum(held["a"].charge[h] for h in tonight) == 0
    # A window within the day, and none at all.
    day = stretches(hours, (1, 5))
    assert day[hours.index(next(h for h in hours if h.start.hour == 3))] is not None
    assert day[0] is None and stretches(hours, None) is None


def test_the_price_ceiling_except_for_the_least() -> None:
    hours, day_of = week(known=168, prices=lambda m: 3.0 if m.hour < 12 else 1.0)
    # Home only in the dear mornings: under the ceiling it charges nothing, over it only up to its minimum.
    car_ = car(
        "c", hours, lambda m: m.hour < 7, soc=0.1, minimum=12.0, hard=[20.0] * 8, typical=[10.0] * 8, ceiling=2.0
    )
    plan = plan_week([car_], hours, day_of)["c"]
    first = plan.leaves[0][0]
    assert abs(plan.soc_typical[first - 1] - 12.0) < 0.05
    assert plan.short
    # Home at the cheap noons too: the ceiling is kept.
    both = car("d", hours, lambda m: True, soc=0.1, minimum=6.0, hard=[20.0] * 8, typical=[10.0] * 8, ceiling=2.0)
    plan = plan_week([both], hours, day_of)["d"]
    assert all(hours[h].price <= 2.0 for h, kwh in enumerate(plan.charge) if kwh > 0)


def test_not_before_the_earliest_start() -> None:
    hours, day_of = week()
    blocked = [not (h.start.hour >= 22 or h.start.hour < 6) for h in hours]
    tesla = car("t", hours, at_work, soc=0.2, blocked=blocked)
    plan = plan_week([tesla], hours, day_of)["t"]
    assert any(kwh > 0 for kwh in plan.charge)
    assert all(not blocked[h] for h, kwh in enumerate(plan.charge) if kwh > 0)
