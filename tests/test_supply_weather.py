"""The house forecast with the weather: learned from the hours themselves, without Home Assistant."""

from __future__ import annotations

import pytest

from custom_components.ev_household_planner.supply import MAX_SLOPE, MIN_WEATHER_HOURS, WEATHER_REACH, HouseForecast


def _weeks(low: float, high: float, per_degree: float = 0.33) -> HouseForecast:
    """Two weeks where each hour draws 2 A plus ``per_degree`` for each degree under 16 °C."""
    forecast = HouseForecast()
    for day in range(14):
        for hour in range(24):
            t = low + (high - low) * ((hour + day) % 24) / 23
            forecast.add(hour, False, 2 + max(0.0, 16 - t) * per_degree, t)
    return forecast


def test_the_house_answer_to_the_cold_is_learned_and_moves_the_hour() -> None:
    forecast = _weeks(3, 11)
    assert forecast.slope == pytest.approx(-0.33, abs=0.01)
    mild = forecast.predict(3, False, 6.0)
    # A night 10 degrees colder than the weeks it learned from: about 3.3 A more.
    assert forecast.predict(3, False, 6.0, temperature=-3) == pytest.approx(mild + 3.3, abs=0.6)
    assert forecast.predict(3, False, 6.0, temperature=15) < mild


def test_without_enough_hours_or_spread_the_weather_is_left_out() -> None:
    few = HouseForecast()
    for day in range(3):
        few.add(3, False, 4.0 + day, 5.0 + day)
    assert MIN_WEATHER_HOURS > 3 and few.slope is None
    assert few.predict(3, False, 6.0, temperature=-10) == few.predict(3, False, 6.0)
    flat = _weeks(7, 7)
    assert flat.slope is None


def test_the_answer_is_capped_and_never_reaches_far_beyond_what_was_seen() -> None:
    steep = _weeks(3, 11, per_degree=3.0)
    assert steep.slope == -MAX_SLOPE
    base = steep.predict(3, False, 6.0)
    # Colder than ever seen: counted no further than WEATHER_REACH below the coldest.
    far = steep.predict(3, False, 6.0, temperature=-60)
    assert far == steep.predict(3, False, 6.0, temperature=3 - WEATHER_REACH)
    assert far > base
    # Warmer never draws less than nothing.
    assert steep.predict(3, False, 6.0, temperature=60) >= 0


def test_hours_without_the_weather_still_line_up_and_survive_a_restart() -> None:
    forecast = _weeks(3, 11)
    forecast.add(3, False, 9.0, None)
    again = HouseForecast.from_dict(forecast.to_dict())
    assert again.samples == forecast.samples
    assert again.temps["03n"][-1] is None and len(again.temps["03n"]) == len(again.samples["03n"])
    assert again.slope == pytest.approx(forecast.slope)
    # Stored before the weather: just the hours.
    old = HouseForecast.from_dict({"03n": [4.0, 5.0, 6.0]})
    assert old.slope is None and old.predict(3, False, 1.0, temperature=-5) == 6.0
    assert HouseForecast.from_dict({"03n": [4.0], "temps": {"03n": [1.0, 2.0], "09n": [1.0]}}).temps == {"03n": [2.0]}
