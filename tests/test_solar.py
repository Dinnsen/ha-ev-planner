"""Charging on the sun, without Home Assistant: the surplus, the delays, the current and the phases."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.ev_household_planner.solar import (
    DISABLE_DELAY,
    ENABLE_DELAY,
    PHASE_EVERY,
    SolarCar,
    SolarState,
    SurplusController,
    forecast_kwh,
    min_kw,
    solar_share,
    surplus_kw,
)

T0 = datetime(2026, 6, 20, 12, 0, tzinfo=ZoneInfo("Europe/Copenhagen"))


def car(vid: str = "a", **extra: object) -> SolarCar:
    return SolarCar(vid, "surplus", max_amps=16, **extra)  # type: ignore[arg-type]


def test_the_surplus_counts_the_cars_and_shares_with_the_battery_only_when_it_is_full_enough() -> None:
    assert surplus_kw(-5, cars_kw=0) == pytest.approx(4.9)
    assert surplus_kw(1, cars_kw=6) == pytest.approx(4.9)  # the car on the sun is part of it
    # A battery that charges keeps its sun below its level, shares it above.
    assert surplus_kw(-1, cars_kw=0, battery_kw=3, battery_soc=50, battery_first_until=90) == pytest.approx(0.9)
    assert surplus_kw(-1, cars_kw=0, battery_kw=3, battery_soc=95, battery_first_until=90) == pytest.approx(3.9)
    # A battery that gives is never sun for the car.
    assert surplus_kw(0, cars_kw=5, battery_kw=-2, battery_soc=95) == pytest.approx(2.9)


def test_the_suns_share_counts_what_is_bought_against_the_cars() -> None:
    assert solar_share(0, -3) == 0
    assert solar_share(6, -1) == 1
    assert solar_share(6, 1.5) == pytest.approx(0.75)
    assert solar_share(6, 10) == 0


def test_a_car_starts_after_a_minute_of_sun_and_stops_after_minutes_without() -> None:
    ctl = SurplusController()
    cars = [car()]
    assert not ctl.step(T0, 6.0, cars)["a"].on
    assert not ctl.step(T0 + ENABLE_DELAY / 2, 6.0, cars)["a"].on
    on = ctl.step(T0 + ENABLE_DELAY, 6.0, cars)["a"]
    assert on.on and on.amps == 8  # 6 kW on three phases, rounded down
    # A cloud: still on until the delay has passed.
    t = T0 + ENABLE_DELAY + timedelta(minutes=1)
    assert ctl.step(t, 1.0, cars)["a"].on
    assert ctl.step(t + DISABLE_DELAY - timedelta(seconds=1), 1.0, cars)["a"].on
    assert not ctl.step(t + DISABLE_DELAY, 1.0, cars)["a"].on
    # Too little sun from the start never starts it.
    ctl2 = SurplusController()
    for k in range(5):
        assert not ctl2.step(T0 + timedelta(minutes=k), min_kw(3) - 0.2, cars)["a"].on


def test_the_current_follows_the_surplus_in_whole_amps_between_six_and_the_most() -> None:
    ctl = SurplusController()
    cars = [car()]
    ctl.step(T0, 20, cars)
    assert ctl.step(T0 + ENABLE_DELAY, 20, cars)["a"].amps == 16
    assert ctl.step(T0 + ENABLE_DELAY * 2, 5.0, cars)["a"].amps == 7
    assert ctl.step(T0 + ENABLE_DELAY * 3, 5.2, cars)["a"].amps == 7  # less than an amp: unchanged
    assert ctl.step(T0 + ENABLE_DELAY * 4, 3.0, cars)["a"].amps == 6  # never under six while on


def test_one_phase_when_the_sun_is_small_and_three_again_when_it_grows() -> None:
    ctl = SurplusController()
    cars = [car(can_switch=True)]
    first = ctl.step(T0, 2.5, cars)["a"]
    assert first.phases == 1 and not first.on
    on = ctl.step(T0 + ENABLE_DELAY, 2.5, cars)["a"]
    assert on.on and on.phases == 1 and on.amps == 10
    # More sun, but not before the last change is old enough.
    assert ctl.step(T0 + ENABLE_DELAY * 2, 8.0, cars)["a"].phases == 1
    later = ctl.step(T0 + PHASE_EVERY, 8.0, cars)["a"]
    assert later.phases == 3 and later.amps == 11


def test_a_car_without_a_current_setting_waits_for_its_full_power_and_cars_take_turns_by_priority() -> None:
    ctl = SurplusController()
    switched = SolarCar("b", "surplus", max_amps=16, adjustable=False, full_kw=7.4)
    ctl.step(T0, 7.0, [switched])
    assert not ctl.step(T0 + ENABLE_DELAY, 7.0, [switched])["b"].on
    ctl.step(T0 + ENABLE_DELAY * 2, 8.0, [switched])
    assert ctl.step(T0 + ENABLE_DELAY * 3, 8.0, [switched])["b"].on
    # Two cars, sun for one: the first in line gets it.
    ctl = SurplusController()
    cars = [car("x"), car("y", priority=0)]
    ctl.step(T0, 5.0, cars)
    got = ctl.step(T0 + ENABLE_DELAY, 5.0, cars)
    assert got["y"].on and not got["x"].on
    # A car that leaves is forgotten.
    ctl.step(T0 + ENABLE_DELAY * 2, 5.0, [cars[1]])
    assert "x" not in ctl.states


def test_the_forecast_counts_the_part_of_each_hour_in_the_window() -> None:
    hours = {T0: 4000.0, T0 + timedelta(hours=1): 2000.0}
    assert forecast_kwh(hours, T0, T0 + timedelta(hours=2)) == pytest.approx(6.0)
    assert forecast_kwh(hours, T0 + timedelta(minutes=30), T0 + timedelta(hours=1, minutes=30)) == pytest.approx(3.0)
    assert forecast_kwh(hours, T0 + timedelta(hours=3), T0 + timedelta(hours=4)) == 0


def test_the_state_survives_a_restart() -> None:
    state = SolarState(on=True, phases=1)
    again = SolarState.from_dict(state.to_dict())
    assert again.on and again.phases == 1
    assert SolarState.from_dict(None).on is False
    assert SolarState.from_dict({"phases": 2}).phases is None
