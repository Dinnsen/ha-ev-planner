"""Insight's learning and expectations: pure functions."""

from __future__ import annotations

from datetime import date, timedelta

from custom_components.ev_household_planner.insight_model import (
    DEFAULT_ERROR,
    DEFAULT_KWH_KM,
    CarOutlook,
    backtest,
    chance_cheaper,
    choose,
    cost_per_km,
    efficiency,
    forecast_errors,
    needs,
    night_price,
    quantile,
    score,
)

TODAY = date(2026, 11, 15)  # a Sunday
WEEK = [10.0, 20.0, 25.0, 15.0, 5.0, 5.0, 0.0]  # kWh from Monday
LIGHT = [4.0, 6.0, 8.0, 5.0, 3.0, 2.0, 0.0]


def history(days: int = 91, week: list[float] | None = None) -> list[tuple[date, float]]:
    start = TODAY - timedelta(days=days)
    return [(start + timedelta(days=i), (week or WEEK)[(start + timedelta(days=i)).weekday()]) for i in range(days)]


def car(name: str, soc: float, *, target: float = 48.0, days: int = 91, **extra: float) -> CarOutlook:
    return CarOutlook(name, soc, 60.0, target, history(days), TODAY, **extra)


def light(name: str, soc: float) -> CarOutlook:
    return CarOutlook(name, soc, 60.0, 48.0, history(91, LIGHT), TODAY)


def test_efficiency_learns_the_mild_day_and_the_cold() -> None:
    assert efficiency({}) == (DEFAULT_KWH_KM, 0.0)
    days = {f"2026-06-{d:02d}": {"km": 100.0, "used": 15.0, "temp": 18.0} for d in range(1, 13)}
    days |= {f"2026-01-{d:02d}": {"km": 100.0, "used": 21.0, "temp": 0.0} for d in range(1, 13)}
    days["2026-03-01"] = {"km": 5.0, "used": 4.0, "temp": 3.0}  # too short to say anything
    days["2026-03-02"] = {"km": 100.0, "used": 90.0, "temp": 3.0}  # the battery fell for another reason
    base, slope = efficiency(days)
    assert base == 0.15
    assert round(slope, 3) == round(0.4 / 15, 3)
    assert cost_per_km(base, slope, 0.0) > cost_per_km(base, slope, 20.0) == cost_per_km(base, slope, None) == base
    # Too few cold days: no slope. Too few mild ones: the mean of them all.
    few = {f"2026-01-{d:02d}": {"km": 100.0, "used": 20.0, "temp": 0.0} for d in range(1, 9)}
    assert efficiency(few) == (0.2, 0.0)


def test_needs_are_km_at_the_days_temperature_or_what_the_battery_fell() -> None:
    days = {
        "2026-11-01": {"km": 100.0, "temp": 5.0},
        "2026-11-02": {"km": None, "used": 7.0},
        "2026-11-03": {"km": None, "used": None},
        "not a day": {"km": 1.0},
    }
    found = needs(days, 0.2, 0.01)
    assert [day for day, _ in found] == [date(2026, 11, 1), date(2026, 11, 2)]
    assert [round(value, 3) for _, value in found] == [22.0, 7.0]


def test_quantile_weighs_the_same_weekday_and_newer_weeks() -> None:
    assert quantile([], 0, 0.9, TODAY) is None
    past = history()
    assert quantile(past, 2, 0.5, TODAY) == 15.0  # Wednesdays pull the middle up
    assert quantile(past, 6, 0.5, TODAY) == 5.0
    assert quantile(past, 0, 1.0, TODAY) == 25.0
    # A new habit counts for more than an old one.
    changed = [(day, 40.0 if (TODAY - day).days < 21 else value) for day, value in past]
    assert quantile(changed, 0, 0.9, TODAY) == 40.0


def test_a_cars_floor_and_how_long_it_can_wait() -> None:
    low = car("a", 20.0)
    assert not car("a", 20.0, days=10).ripe and low.ripe
    assert low.floor(1) == low.need(1, 0.9) + 6.0
    assert low.reach == 0
    assert car("a", 46.0).reach == 1
    assert light("a", 46.0).reach == 4
    # A trip tomorrow that the pattern cannot know: the car must have it, but never more than its target.
    assert car("a", 20.0, known_need=40.0).floor(1) == 40.0
    assert car("a", 20.0, known_need=99.0).floor(1) == 48.0
    assert car("a", 20.0, known_need=40.0).floor(2) < 40.0
    assert car("a", 20.0, level=0.5).floor(1) < low.floor(1)
    assert low.as_dict()["floor_pct"] == round(low.floor(1) / 60 * 100)
    assert CarOutlook("a", 1.0, 0.0, 0.0, [], TODAY).as_dict()["floor_pct"] is None


def test_the_chance_of_a_cheaper_night() -> None:
    assert chance_cheaper(None, [1.0], []) == 0.0
    assert chance_cheaper(2.0, [None, 0.0], []) == 0.0
    assert chance_cheaper(2.0, [1.0], []) > 0.99
    assert chance_cheaper(1.0, [1.0], []) == 0.5
    assert chance_cheaper(1.0, [2.0], [0.1]) < 0.01
    # A worse forecast makes the same difference less certain.
    assert chance_cheaper(1.2, [1.0], [0.5]) < chance_cheaper(1.2, [1.0], [0.1])


def test_which_car_gets_the_charger() -> None:
    assert choose([car("a", 20.0, days=5)], 1.0, [], [])["reason"] == "learning"
    # One car is under its floor: it gets the charger. Both: the one that lacks most, and a warning.
    needed = choose([car("a", 20.0), car("b", 46.0)], 1.0, [1.0], [])
    assert (needed["pick"], needed["reason"], needed["both"]) == ("a", "needed", False)
    both = choose([car("a", 25.0), car("b", 20.0)], 1.0, [1.0], [])
    assert (both["pick"], both["both"]) == ("b", True)
    # Both are charged.
    assert choose([car("a", 48.0), car("b", 48.0)], 1.0, [1.0], [])["reason"] == "full"
    # Both can wait and a cheaper night is likely: no car tonight.
    wait = choose([light("a", 46.0), light("b", 47.0)], 2.0, [1.0, 1.0, 1.0], [])
    assert (wait["pick"], wait["wait"], wait["reason"]) == (None, True, "cheaper")
    # No cheaper night: the car that reaches its floor first, and of two alike the emptier one.
    soon = choose([light("a", 46.0), light("b", 47.0)], 1.0, [2.0, 2.0, 2.0], [])
    assert (soon["pick"], soon["wait"], soon["reason"]) == ("a", False, "soonest")
    # Both reach their floor tomorrow night: one of them is taken now.
    edge = car("a", 0.0)
    level = edge.floor(1) + 0.1
    apart = choose([car("a", level), car("b", level + 0.2)], 2.0, [1.0], [])
    assert (apart["pick"], apart["reason"]) == ("a", "apart")
    # A car alone waits as well.
    assert choose([light("a", 46.0)], 2.0, [1.0, 1.0, 1.0], [])["wait"] is True
    # Not every night: a car that has enough is not charged though no cheaper night comes.
    calm = choose([light("a", 46.0), light("b", 47.0)], 1.0, [2.0, 2.0, 2.0], [], every=False)
    assert (calm["pick"], calm["wait"], calm["reason"]) == (None, False, "enough")
    # ... and what must charge still does.
    assert choose([car("a", 20.0), car("b", 46.0)], 1.0, [1.0], [], every=False)["pick"] == "a"


def test_the_styles_go_from_bold_to_every_night() -> None:
    from custom_components.ev_household_planner.insight_model import DEFAULT_STYLE, STYLES

    assert len(STYLES) == 6 and STYLES[DEFAULT_STYLE]["every"] is False and STYLES[-1]["every"] is True
    floors = [car("a", 30.0, level=s["level"], reserve=s["reserve"]).floor(1) for s in STYLES[:5]]
    assert floors == sorted(floors), "each step keeps more"
    # Counting the days after tomorrow as typical days lets a car wait longer.
    assert car("a", 46.0, rest=0.5).reach >= car("a", 46.0).reach


def test_the_nights_price_is_its_cheapest_hours() -> None:
    prices = {"2026-11-15": [3.0] * 21 + [2.0, 2.0, 2.0], "2026-11-16": [1.0, 1.0, None] + [5.0] * 21}
    assert night_price(prices, TODAY, 21, 7) == round((1 + 1 + 2) / 3, 4)
    assert night_price(prices, TODAY, 0, 6) == 3.0
    assert night_price(prices, TODAY + timedelta(days=5), 21, 7) is None


def test_the_forecasts_error_is_learned_for_each_day_ahead() -> None:
    assert forecast_errors({}, {}) == list(DEFAULT_ERROR)
    forecasts = {
        "2026-11-10": {"start": "2026-11-11T00:00:00", "prices": [1.1, 0.9] * 30 + [None]},
        "bad": {"start": "nothing", "prices": [1.0]},
    }
    prices = {f"2026-11-{d}": [1.0] * 24 for d in (11, 12, 13)}
    prices["2026-11-13"][11] = 0.0  # a price near nothing is left out
    errors = forecast_errors(forecasts, prices)
    assert errors[0] == 0.1
    assert errors[1:] == list(DEFAULT_ERROR[1:])


def test_the_ledger_is_scored_against_what_happened() -> None:
    assert score({}, {}, {}, {}, (21, 7)) == {
        "scored": 0,
        "hits": 0,
        "rate": None,
        "waits": 0,
        "saved": 0.0,
        "ripe": False,
    }
    evenings = [date(2026, 10, 1) + timedelta(days=i) for i in range(25)]
    ledger = {
        day.isoformat(): {"wait": i == 0, "cars": {"a": {"p90": 10.0, "ripe": True}, "b": {"p90": None}}}
        for i, day in enumerate(evenings)
    }
    ledger["odd"] = {}
    actual = {"a": {day + timedelta(days=1): 12.0 if i < 2 else 8.0 for i, day in enumerate(evenings)}}
    prices = {"2026-10-01": [2.0] * 24, "2026-10-02": [2.0] * 21 + [1.0] * 3, "2026-10-03": [1.0] * 24}
    days = {"a": {"2026-10-02": {"charged": 10.0}}}
    result = score(ledger, days, prices, actual, (21, 7))
    assert (result["scored"], result["hits"], result["rate"]) == (25, 23, 0.92)
    assert (result["waits"], result["saved"], result["ripe"]) == (1, 10.0, True)


def test_the_last_days_against_what_was_expected() -> None:
    assert backtest(history(10), TODAY) == ([], [])
    rows, held = backtest(history(), TODAY, days=14)
    assert len(rows) == 14 and rows[0]["p10"] <= rows[0]["p90"]
    assert [level["said"] for level in held] == [0.5, 0.6, 0.7, 0.8, 0.9]
    assert held[0]["hit"] <= held[-1]["hit"] <= 1.0
