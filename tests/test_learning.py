"""Tests for the learned charging speed and power (pure, without Home Assistant)."""

from __future__ import annotations

import pytest

from custom_components.ev_household_planner.learning import MIN_RISE, ChargeMeter, Learned, blend

MINUTE = 60.0


def charge(meter: ChargeMeter, minutes: int, start_soc: float, speed: float, power: float | None = None) -> float:
    """Charge for ``minutes`` at ``speed`` (%/h), with a reading every 5 minutes; returns the last level."""
    soc = start_soc
    for minute in range(1, minutes + 1):
        meter.tick(MINUTE, True, power)
        if minute % 5 == 0:
            soc = start_soc + speed * minute / 60
            meter.reading(round(soc, 1))
    return soc


def test_blend() -> None:
    assert blend(None, 16) == 16
    assert blend(10, 20) == pytest.approx(13)


def test_a_rise_below_the_minimum_is_not_a_speed() -> None:
    meter = ChargeMeter()
    meter.reading(13)  # plugged in, not charging yet: left out
    assert meter.first_soc is None
    charge(meter, 100, 13, 17)  # about 28 %
    assert meter.rise < MIN_RISE
    assert meter.speed is None


def test_the_speed_comes_from_the_readings_and_the_charging_time() -> None:
    meter = ChargeMeter()
    charge(meter, 240, 13, 17)  # 13 % → 81 %
    assert meter.rise == pytest.approx(68 - 17 * 5 / 60, abs=0.2)
    assert meter.speed == pytest.approx(17, rel=0.01)


def test_a_pause_between_periods_does_not_count() -> None:
    meter = ChargeMeter()
    soc = charge(meter, 120, 20, 16)
    for _ in range(180):  # paused for three hours: the level stays
        meter.tick(MINUTE, False, None)
        meter.reading(round(soc, 1))
    meter.reading(round(soc, 1))
    for minute in range(1, 61):
        meter.tick(MINUTE, True, None)
        if minute % 5 == 0:
            meter.reading(round(soc + 16 * minute / 60, 1))
    assert meter.speed == pytest.approx(16, rel=0.01)


def test_a_falling_level_starts_the_measurement_over() -> None:
    meter = ChargeMeter()
    charge(meter, 60, 50, 20, 10)
    meter.reading(69.5)  # a small dip is noise, not a new start
    assert meter.first_soc is not None and meter.rise > 15
    meter.reading(30)  # driven off without being seen unplugged
    assert meter == ChargeMeter()
    meter.reading(29)  # not charging yet: left out
    assert meter.first_soc is None


def test_time_without_charging_before_a_charge_is_not_measured() -> None:
    """A car that warms up from the battery (active, but the level falls) and later charges."""
    meter = ChargeMeter()
    for _ in range(12):
        meter.tick(MINUTE, True, 3)
    meter.reading(60)
    meter.reading(58.5)
    assert meter == ChargeMeter()
    charge(meter, 180, 58, 13)
    assert meter.speed == pytest.approx(13, rel=0.01)


def test_an_impossible_speed_is_left_out() -> None:
    meter = ChargeMeter()
    meter.tick(MINUTE, True)
    meter.reading(10)
    meter.tick(1, True)
    meter.reading(90)
    assert meter.speed is None


def test_power_needs_enough_charging_time_and_real_readings() -> None:
    meter = ChargeMeter()
    meter.tick(MINUTE, True, 9.6)
    assert meter.power is None
    for _ in range(20):
        meter.tick(MINUTE, True, 9.6)
        meter.tick(MINUTE, True, 0.1)  # not really charging: left out
        meter.tick(MINUTE, False, 9.6)  # not charging: left out
    assert meter.power == pytest.approx(9.6)
    meter.tick(0, True, 50)
    assert meter.power == pytest.approx(9.6)


def test_meter_store_round_trip() -> None:
    meter = ChargeMeter()
    charge(meter, 150, 20, 16, 9.6)
    again = ChargeMeter.from_dict(meter.to_dict())
    assert again.speed == pytest.approx(meter.speed, rel=1e-3)
    assert again.power == pytest.approx(9.6)
    assert ChargeMeter.from_dict(None) == ChargeMeter()
    assert ChargeMeter.from_dict({"first_soc": "x", "charging_seconds": None}) == ChargeMeter()


def test_learning_folds_in_measurements() -> None:
    learned = Learned()
    meter = ChargeMeter()
    charge(meter, 150, 20, 16, 9.6)
    assert learned.add(meter) is True
    assert learned.speed == pytest.approx(16, rel=0.01)
    assert learned.speed_count == 1
    assert learned.power == pytest.approx(9.6)

    faster = ChargeMeter()
    charge(faster, 150, 20, 26, 11)
    learned.add(faster)
    assert learned.speed == pytest.approx(16 * 0.7 + 26 * 0.3, rel=0.01)
    assert learned.speed_count == 2
    assert learned.power == pytest.approx(9.6 * 0.7 + 11 * 0.3)

    short = ChargeMeter()
    charge(short, 30, 20, 16)
    assert learned.add(short) is False
    assert learned.speed_count == 2


def test_a_changed_setup_starts_learning_over() -> None:
    learned = Learned()
    assert learned.check_basis((60, 9.6)) is False  # the first setup
    learned.speed, learned.speed_count, learned.power, learned.power_count = 17, 3, 9.6, 3
    assert learned.check_basis((60, 9.6)) is False
    assert learned.speed == 17
    assert learned.check_basis((60, 11)) is True
    assert (learned.speed, learned.speed_count, learned.power, learned.power_count) == (None, 0, None, 0)
    assert learned.basis == (60, 11)
    assert learned.check_basis((52.5, 11)) is False  # nothing to drop


def test_learned_store_round_trip() -> None:
    learned = Learned(speed=16.84, speed_count=3, power=9.6, power_count=2, basis=(60, 9.6))
    assert Learned.from_dict(learned.to_dict()) == learned
    assert Learned.from_dict(None) == Learned()
    assert Learned.from_dict({"speed": -1, "power": "x", "basis": [60]}) == Learned()
    assert Learned.from_dict({"basis": [60, "x"]}).basis is None


def test_whether_the_car_charges_again_after_a_pause() -> None:
    learned = Learned()
    assert learned.resumes is None
    # Once can be a car that was asleep.
    assert learned.did_not_resume() is False
    assert learned.resumes is None
    assert learned.did_not_resume() is True
    assert learned.resumes is False
    assert learned.did_not_resume() is False  # already known
    again = Learned.from_dict(learned.to_dict())
    assert again.resumes is False and again.resume_failures == 3
    learned.resumed()
    assert learned.resumes is True and learned.resume_failures == 0
    learned.forget_resume()
    assert learned.resumes is None
    # A changed setup does not forget it: it is about the car, not its figures.
    learned.resumes = False
    learned.check_basis((60, 11))
    learned.check_basis((60, 10))
    assert learned.resumes is False
    assert Learned.from_dict({"resumes": "yes"}).resumes is None


def test_the_speed_per_band_of_the_charge_level() -> None:
    from custom_components.ev_household_planner.learning import band_speeds

    # 20 %/h up to 80 %, 10 %/h above: readings every 5 minutes.
    readings: list[tuple[float, float]] = []
    soc, seconds = 60.0, 0.0
    while soc < 100:
        readings.append((round(soc, 1), seconds))
        speed = 20.0 if soc < 80 else 10.0
        soc += speed * 5 / 60
        seconds += 300
    speeds = band_speeds(readings)
    assert speeds["50-80"] == pytest.approx(20, rel=0.05)
    assert speeds["80-90"] == pytest.approx(10, rel=0.05)
    assert speeds["90-100"] == pytest.approx(10, rel=0.1)
    assert "0-50" not in speeds  # no readings there
    # Too little rise inside a band, or a broken sensor, teaches nothing.
    assert band_speeds([(81, 0), (83, 600)]) == {}
    assert band_speeds([(81, 0), (90, 1)]) == {}


def test_a_charge_teaches_the_curve_and_it_is_stored() -> None:
    meter = ChargeMeter()
    meter.tick(MINUTE, True)
    soc = 70.0
    for _ in range(40):
        meter.reading(round(soc, 1))
        meter.tick(300, True)
        soc += (20.0 if soc < 80 else 8.0) * 5 / 60
    learned = Learned()
    learned.add(meter)
    assert learned.curve["80-90"] == pytest.approx(8, rel=0.1)
    assert learned.curve_counts["80-90"] == 1
    assert [band[:2] for band in learned.speeds()] == [(50, 80), (80, 90), (90, 100)]
    again = Learned.from_dict(learned.to_dict())
    assert again.curve == pytest.approx(learned.curve, abs=0.001)
    assert again.curve_counts == learned.curve_counts
    assert Learned.from_dict({"curve": {"80-90": 1000, "nonsense": 5, "50-80": "x"}}).curve == {}
    # A changed setup drops the curve with the speed.
    learned.check_basis((60, 11))
    learned.check_basis((60, 10))
    assert learned.curve == {}
    # The readings survive a restart and go when the level falls.
    stored = ChargeMeter.from_dict(meter.to_dict())
    assert stored.readings == pytest.approx(meter.readings)
    meter.reading(10)
    assert meter.readings == []


def test_a_late_morning_teaches_a_margin() -> None:
    learned = Learned()
    assert learned.morning(0) is False
    # 20 minutes short: aim two quarters earlier.
    assert learned.morning(20) is True
    assert learned.margin == 30
    # Never more than an hour.
    learned.morning(200)
    assert learned.margin == 60
    # Three mornings on time: a quarter later again.
    assert learned.morning(0) is False
    assert learned.morning(0) is False
    assert learned.morning(0) is True
    assert learned.margin == 45
    again = Learned.from_dict(learned.to_dict())
    assert again.margin == 45 and again.on_time == 0
    assert Learned.from_dict({"margin": 500}).margin == 60
