"""Tests for a household car's state (no Home Assistant needed beyond constants)."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.ev_planner.planner import PriceSlot
from custom_components.ev_planner.rules import Car, Decision, Rules, plan_vehicle
from custom_components.ev_planner.vehicle import Vehicle, is_charging_state, month_key, to_float

TZ = ZoneInfo("Europe/Copenhagen")
NOW = datetime(2026, 10, 19, 20, 0, tzinfo=TZ)


def make(**config) -> Vehicle:
    return Vehicle("v1", "Tesla", {"battery_capacity": 60, "charge_power": 10, **config})


def test_defaults_and_config() -> None:
    vehicle = make()
    assert vehicle.capacity == 60
    assert vehicle.configured_power == 10
    assert vehicle.charge_speed(10) == (pytest.approx(10 / 60 * 100), "estimated")
    assert vehicle.basis == (60, 10)
    assert vehicle.control == "none"
    assert vehicle.charger_id is None
    assert vehicle.mode == "smart"
    assert vehicle.target == 80
    assert vehicle.current_soc == 50  # manual default
    assert vehicle.watched_entities() == []
    assert make(control="bad").control == "none"
    assert make(charger="none").charger_id is None
    assert make(charger="c1").charger_id == "c1"


def test_imported_settings_are_the_starting_point() -> None:
    vehicle = make(imported_settings={"price_ceiling": 1.4, "mode": "off"})
    assert vehicle.settings["price_ceiling"] == 1.4
    assert vehicle.mode == "off"


def test_target_from_calendar_car_or_setting() -> None:
    vehicle = make(target_entity="number.limit")
    assert vehicle.target == 80
    vehicle.target_from_car = 90
    assert vehicle.target == 90
    vehicle.calendar_target = 100
    assert vehicle.target == 100


def test_soc_from_sensor() -> None:
    vehicle = make(soc_entity="sensor.soc")
    assert vehicle.has_soc_sensor
    assert vehicle.current_soc is None
    vehicle.soc = 40
    assert vehicle.current_soc == 40


@pytest.mark.parametrize(
    ("states", "state", "expected"),
    [
        (None, "on", True),
        (None, "off", False),
        (None, "unavailable", None),
        (None, None, None),
        (["3"], "3", False),
        (["3"], "1", True),
        ("3, 4", "4", False),
    ],
)
def test_connected(states, state, expected) -> None:
    vehicle = make(**({"unplugged_states": states} if states is not None else {}))
    assert vehicle.read_connected(state) is expected


def test_home_and_charging_states() -> None:
    assert Vehicle.read_home("home") is True
    assert Vehicle.read_home("not_home") is False
    assert Vehicle.read_home("unknown") is None
    assert is_charging_state("charging") is True
    assert is_charging_state("on") is True
    assert is_charging_state("off") is False
    assert is_charging_state("7.2") is True
    assert is_charging_state("0") is False
    assert is_charging_state("unavailable") is None
    assert to_float("nan") is None
    assert to_float("x") is None
    assert month_key(NOW) == "2026-10"


def test_rules_from_settings() -> None:
    vehicle = make()
    assert vehicle.rules() == Rules(min_soc=0, ceiling=None, low_price_level=None, low_soc_level=None)
    vehicle.settings.update(
        {
            "price_ceiling_enabled": True,
            "price_ceiling": 1.5,
            "low_price_charging": True,
            "low_price_level": 0.2,
            "low_soc_charging": True,
            "low_soc_level": 15,
            "min_soc": 30,
            "keep_charger_on": True,
            "opportunistic": "lower_ceiling",
            "join_period": True,
            "join_within": 0.08,
        }
    )
    rules = vehicle.rules()
    assert rules.join_within == 0.08
    assert rules.ceiling == 1.5 and rules.low_price_level == 0.2 and rules.low_soc_level == 15
    assert rules.min_soc == 30 and rules.keep_on and rules.opportunistic == "lower_ceiling"


def test_deadline_and_earliest_start() -> None:
    vehicle = make()
    assert vehicle.next_deadline(NOW) == NOW.replace(hour=7) + timedelta(days=1)
    vehicle.settings["use_ready_by"] = False
    assert vehicle.next_deadline(NOW) is None
    assert vehicle.earliest_start is None
    vehicle.settings.update({"use_earliest_start": True, "earliest_start": "22:00"})
    assert vehicle.earliest_start is not None


def _plan(vehicle: Vehicle):
    prices = [PriceSlot(NOW + timedelta(hours=i), NOW + timedelta(hours=i + 1), 1.0) for i in range(11)]
    car = Car(soc=50, target=80, capacity=60, power=10)
    return plan_vehicle(prices, car, Rules(), NOW, deadline=NOW + timedelta(hours=11))


@pytest.mark.parametrize(
    ("reason", "status"),
    [
        ("off", "off"),
        ("unplugged", "unplugged"),
        ("away", "unplugged"),
        ("paused", "paused"),
        ("full", "completed"),
        ("charge_now", "charging_now"),
        ("low_soc", "charging_low_soc"),
        ("low_price", "charging_low_price"),
        ("planned", "charging"),
        ("keep_on", "keeping_on"),
        ("charger_busy", "charger_busy"),
    ],
)
def test_status_from_reason(reason, status) -> None:
    vehicle = make()
    vehicle.decision = Decision("pause", reason)
    assert vehicle.status() == status


def test_status_while_waiting() -> None:
    vehicle = make(soc_entity="sensor.soc")
    vehicle.decision = Decision("pause", "waiting")
    assert vehicle.status() == "no_soc"
    vehicle.soc = 50
    assert vehicle.status() == "no_plan"
    vehicle.plan_error = "not_enough_prices"
    assert vehicle.status() == "not_enough_prices"
    vehicle.plan_error = "limit_not_above_soc"
    assert vehicle.status() == "completed"
    vehicle.plan_error = None
    vehicle.plan = _plan(vehicle)
    assert vehicle.status() == "planned"
    # Charging anyway, e.g. started from the charger's app.
    vehicle.charging = True
    assert vehicle.status() == "charging"
    vehicle.connected = False
    assert vehicle.status() == "planned"


def test_summary() -> None:
    vehicle = make()
    vehicle.decision = Decision("pause", "waiting")
    vehicle.plan = _plan(vehicle)
    text = vehicle.summary(NOW, lambda moment: moment.strftime("%H:%M"), lambda value: f"{value:.2f}")
    assert text.startswith("20:00-") and "·" in text
    vehicle.decision = Decision("released", "off")
    assert vehicle.summary(NOW, str, str) == "off"
    vehicle.decision = Decision("pause", "waiting")
    vehicle.plan = None
    assert vehicle.summary(NOW, str, str) == "no_plan"


def test_charge_now_falls_back_to_smart() -> None:
    vehicle = make(soc_entity="sensor.soc")
    assert vehicle.mode_after_charge_now() is None
    vehicle.settings["mode"] = "charge_now"
    vehicle.soc = 50
    assert vehicle.mode_after_charge_now() is None
    vehicle.soc = 80
    assert vehicle.mode_after_charge_now() == "smart"
    vehicle.soc = 50
    vehicle.connected = False
    assert vehicle.mode_after_charge_now() == "smart"
    assert vehicle.controls_charging is False
    assert make(control="car").controls_charging is True
    vehicle.settings["mode"] = "pause"
    assert vehicle.paused_by_user


def test_energy_sessions_months_and_store() -> None:
    vehicle = make()
    assert vehicle.soc_energy(None, 50, 15, 9) == 0
    assert vehicle.soc_energy(50, 49, 15, 9) == 0
    assert vehicle.soc_energy(10, 90, 15, 9) == 0  # a jump, not charging
    # 10 % at 15 %/h is 40 minutes of charging at 9 kW.
    assert vehicle.soc_energy(50, 60, 15, 9) == pytest.approx(6)
    assert vehicle.soc_energy(50, 60, 0, 9) == 0
    vehicle.add_energy(NOW, 0, 1.0)
    assert vehicle.month(NOW)["energy"] == 0
    vehicle.start_session(NOW, "planned")
    vehicle.add_energy(NOW, 5, 2.0)
    vehicle.add_energy(NOW, 1, None)
    assert vehicle.month(NOW)["energy"] == pytest.approx(6)
    assert vehicle.month(NOW)["cost"] == pytest.approx(10)
    entry = vehicle.end_session(NOW + timedelta(hours=1))
    assert entry is not None and entry["energy"] == 6 and entry["reason"] == "planned"
    assert vehicle.month(NOW)["sessions"] == 1
    assert vehicle.end_session(NOW) is None
    vehicle.start_session(NOW, "planned")
    assert vehicle.end_session(NOW) is None  # nothing charged

    vehicle.start_session(NOW, "low_soc")
    vehicle.last_sent = "charge"
    vehicle.reminded_on = "2026-10-19"
    stored = vehicle.to_store()
    again = make()
    again.load(stored)
    assert again.history == vehicle.history
    assert again.months == vehicle.months
    assert again.session is not None and again.session.reason == "low_soc"
    assert again.last_sent == "charge"
    assert again.reminded_on == "2026-10-19"
    again.load(None)
    again.load({"session": {"start": "bad"}, "last_sent": "nonsense", "months": {"x": 1}})
    assert again.session is None and again.last_sent is None


def test_only_a_plugged_in_car_keeps_its_hours_from_finishing_in_one_go() -> None:
    """One charger, one cable: the car that is plugged in charges in its own plan."""
    from types import SimpleNamespace

    from custom_components.ev_planner.household import Household

    tesla = Vehicle("v1", "Tesla", {"charger": "c1"})
    mercedes = Vehicle("v2", "Mercedes", {"charger": "c1"})
    elsewhere = Vehicle("v3", "Other", {"charger": "c2"})
    hours = [{"start": NOW, "end": NOW + timedelta(hours=1)}]
    for car in (mercedes, elsewhere):
        car.plan = plan_vehicle(
            [PriceSlot(NOW, NOW + timedelta(hours=3), 1.0)], Car(50, 60, 60, 10), Rules(), NOW, deadline=None
        )
    household = SimpleNamespace(vehicles={"v1": tesla, "v2": mercedes, "v3": elsewhere})

    mercedes.connected, elsewhere.connected = False, True
    assert Household.reserved_for(household, tesla) == []  # at home without a cable: nothing reserved
    mercedes.connected = True
    assert Household.reserved_for(household, tesla) == mercedes.plan.segments
    assert hours[0]["start"] == mercedes.plan.segments[0]["start"]
    assert Household.reserved_for(household, Vehicle("v4", "No charger", {})) == []


def test_the_speed_to_plan_with() -> None:
    vehicle = make()
    assert vehicle.charge_speed(9.6) == (pytest.approx(16), "estimated")
    imported = make(imported_speed=15.6)
    assert imported.charge_speed(9.6) == (15.6, "imported")
    imported.learned.speed, imported.learned.speed_count = 17.1, 1
    assert imported.charge_speed(9.6) == (17.1, "learned")
    # A charge that has risen enough is followed while it goes on.
    for minute in range(1, 151):
        imported.meter.tick(60, True, 9.6)
        if minute % 5 == 0:
            imported.meter.reading(20 + 20 * minute / 60)
    speed, source = imported.charge_speed(9.6)
    assert source == "measuring" and speed == pytest.approx(20, rel=0.01)


def test_a_charge_teaches_the_car_once_it_rose_enough() -> None:
    vehicle = make()
    for minute in range(1, 61):
        vehicle.meter.tick(60, True, 9.6)
        if minute % 5 == 0:
            vehicle.meter.reading(20 + 17 * minute / 60)
    assert vehicle.finish_measurement() is False  # 17 % so far: measured on
    assert vehicle.meter.rise > 0
    for minute in range(61, 151):
        vehicle.meter.tick(60, True, 9.6)
        if minute % 5 == 0:
            vehicle.meter.reading(20 + 17 * minute / 60)
    assert vehicle.finish_measurement() is True
    assert vehicle.learned.speed == pytest.approx(17, rel=0.01)
    assert vehicle.learned.power == pytest.approx(9.6)
    assert vehicle.meter.rise == 0

    # Unplugged after a short charge: the power is learned, the speed is not.
    for minute in range(1, 31):
        vehicle.meter.tick(60, True, 10.0)
        if minute % 5 == 0:
            vehicle.meter.reading(60 + 17 * minute / 60)
    assert vehicle.finish_measurement(unplugged=True) is True
    assert vehicle.learned.speed_count == 1 and vehicle.learned.power_count == 2
    assert vehicle.finish_measurement(unplugged=True) is False


def test_learning_is_stored_and_dropped_when_the_setup_changes() -> None:
    vehicle = make()
    vehicle.learned.speed, vehicle.learned.speed_count = 17.0, 2
    vehicle.meter.tick(60, True)
    vehicle.meter.reading(40)
    stored = vehicle.to_store()

    again = make()
    again.load(stored)
    assert again.learned.speed == 17 and again.learned.speed_count == 2
    assert again.meter.first_soc == 40

    changed = make(charge_power=9.6)
    changed.load(stored)
    assert changed.learned.speed is None and changed.learned.basis == (60, 9.6)
    assert changed.meter.first_soc is None


def test_the_retired_efficiency_setting_is_dropped() -> None:
    vehicle = make(imported_settings={"charging_efficiency": 85})
    assert "charging_efficiency" not in vehicle.settings
    vehicle.load({"settings": {"charging_efficiency": 90, "target_soc": 70}})
    assert "charging_efficiency" not in vehicle.settings
    assert vehicle.settings["target_soc"] == 70


def test_power_entity_and_imported_speed_from_the_setup() -> None:
    vehicle = make(power_entity="sensor.model3_charger_power", imported_speed="bad")
    assert vehicle.power_entity == "sensor.model3_charger_power"
    assert vehicle.imported_speed is None
    assert make(imported_speed=0).imported_speed is None
    assert make().power_entity is None


def test_the_plan_is_stored_so_it_survives_a_restart() -> None:
    vehicle = make()
    vehicle.plan = _plan(vehicle)
    vehicle.plan.joined, vehicle.plan.joined_extra, vehicle.plan.ceiling = True, 0.4, 2.5
    vehicle.pause_notice = True
    again = make()
    again.load(vehicle.to_store())
    assert again.plan is not None
    assert again.plan.to_dict() == vehicle.plan.to_dict()
    assert again.plan.start == vehicle.plan.start
    assert again.plan_restored is True
    assert again.pause_notice is True

    nothing = make()
    nothing.load({"plan": None})
    assert nothing.plan is None and nothing.plan_restored is False


@pytest.mark.parametrize(
    "stored",
    [
        "x",
        {"segments": [{"start": "bad", "end": "bad"}]},
        {"segments": [{"start": "2026-10-19T20:00:00", "end": "2026-10-19T21:00:00"}]},  # no time zone
        {"segments": [{"start": "2026-10-19T21:00:00+01:00", "end": "2026-10-19T20:00:00+01:00"}]},
        {"segments": [], "cost": "x"},
    ],
)
def test_an_unreadable_stored_plan_is_dropped(stored) -> None:
    from custom_components.ev_planner.rules import VehiclePlan

    assert VehiclePlan.from_dict(stored) is None
