"""Two cars on one supply in Home Assistant: planned together under the limit, the current set per slot."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.ev_household_planner.supply import kw
from custom_components.ev_household_planner.supply_control import (
    CURRENT_EVERY,
    EASEE_TTL_MINUTES,
    ECHO,
    GUARD_CONFIRM,
    GUARD_PAUSE,
    GUARD_SETTLE,
    HEADROOM_WINDOW,
)

from .conftest import (
    CARPORT,
    CHARGE_SWITCH,
    NIGHT,
    TESLA,
    SwitchCalls,
    carport_data,
    charger_sub,
    entry_with,
    move,
    set_prices,
    set_tesla,
    settle,
    tesla_data,
    vehicle_sub,
)

AMPS = "input_number.tesla_amps"
SKODA = "skoda_id"
GARAGE = "garage_id"
METER = "sensor.house_current"


def _skoda(hass: HomeAssistant, soc: float = 50) -> None:
    hass.states.async_set("sensor.skoda_battery", str(soc), {"unit_of_measurement": "%"})
    hass.states.async_set("binary_sensor.skoda_cable", "on")
    hass.states.async_set("switch.skoda_charge", "off")
    hass.states.async_set("binary_sensor.skoda_charging", "off")


def _entry(current: str = AMPS, **options: Any) -> MockConfigEntry:
    skoda = tesla_data(
        soc_entity="sensor.skoda_battery",
        target_entity=None,
        connected_entity="binary_sensor.skoda_cable",
        charging_entity="binary_sensor.skoda_charging",
        control_entity="switch.skoda_charge",
        charger=GARAGE,
        charge_power=11.0,
    )
    return entry_with(
        charger_sub(),
        ConfigSubentryDataWithId(
            data=carport_data(), subentry_id=GARAGE, subentry_type="charger", title="Garage", unique_id=None
        ),
        vehicle_sub(TESLA, "Tesla", tesla_data(current_entity=current, charge_power=11.0)),
        vehicle_sub(SKODA, "Skoda", skoda),
        # A margin of 2 A, as before 2.5.0b29 (the default is 1 A): the numbers below are worked out with it.
        options={
            key: value
            for key, value in {
                "supply_limit": 23,
                "supply_phases": "3",
                "supply_reserve": 5,
                "supply_margin": 2,
                **options,
            }.items()
            if value is not None
        },
    )


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, entry: MockConfigEntry) -> list[ServiceCall]:
    calls: list[ServiceCall] = []

    async def record(call: ServiceCall) -> None:
        calls.append(call)
        hass.states.async_set(AMPS, str(call.data["value"]), {"min": 6, "max": 16})

    hass.services.async_register("input_number", "set_value", record)
    hass.states.async_set(AMPS, "0", {"min": 0, "max": 16})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return calls


async def test_two_cars_share_the_supply_and_the_house_comes_first(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    entry = _entry()
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    plan = household.supply.plan
    assert plan is not None
    # Under the limit with the house's 5 A in every slot.
    for start, _end, limit, house in plan.capacity:
        used = sum(amps for per in plan.amps.values() for s, _e, amps in per if s == start)
        assert used + house <= limit + 1e-6
    # The Skoda can only be switched (16 A or nothing); the Tesla takes the rest in amps.
    full = {amps for _s, _e, amps in plan.amps[SKODA]}
    assert len(full) == 1 and full.pop() > 15  # 11 kW on three phases
    for start, _end, amps in plan.amps[TESLA]:
        assert amps <= 16
        if any(s == start for s, _e, _a in plan.amps[SKODA]):
            assert amps <= 2 or amps == 0
    tesla = household.vehicles[TESLA]
    assert tesla.plan is not None and tesla.plan.segments == plan.segments(TESLA)
    # In the Tesla's first slot, its current is set to its share.
    first = plan.amps[TESLA][0]
    await move(hass, freezer, first[0] + timedelta(minutes=1))
    assert calls and calls[-1].data["entity_id"] == AMPS and calls[-1].data["value"] == round(first[2])
    state = household.supply.state(first[0] + timedelta(minutes=1))
    assert state is not None and state["limit"] == 23 and state["meter"] is False
    assert sum(kw(a, 3) * (e - s).total_seconds() / 3600 for s, e, a in plan.amps[TESLA]) > 0


async def test_the_meter_teaches_the_house(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "9", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER])
    await _setup(hass, freezer, entry)
    household = entry.runtime_data
    assert household.supply.house_now() == 9
    # An hour of readings goes into the forecast at the turn of the hour.
    start = now.replace(minute=0, second=0, microsecond=0)
    for minute in range(1, 62, 10):
        await move(hass, freezer, start + timedelta(minutes=minute))
    assert household.supply.forecast.samples
    assert household.supply.state(now) is not None


async def test_without_a_limit_nothing_changes(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    _skoda(hass)
    entry = _entry(supply_limit=0)
    await _setup(hass, freezer, entry)
    household = entry.runtime_data
    assert household.supply.plan is None and household.supply.state(now) is None
    assert household.supply.vehicle_amps(TESLA, now) is None
    assert household.supply.current_entity(household.vehicles[TESLA]) == AMPS
    assert CARPORT in household.chargers


async def test_a_car_at_its_target_leaves_the_supply_to_the_other(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=80, limit=80)
    _skoda(hass, soc=20)
    entry = _entry()
    await _setup(hass, freezer, entry)
    plan = entry.runtime_data.supply.plan
    assert plan is not None and TESLA not in plan.amps and plan.amps[SKODA]


async def test_an_easee_charger_gets_its_current_through_easees_own_action(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    easee_entry = MockConfigEntry(domain="easee")
    easee_entry.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=easee_entry.entry_id, identifiers={("easee", "EH1")}
    )
    sensor = er.async_get(hass).async_get_or_create(
        "sensor", "easee", "EH1_dynamic_charger_limit", device_id=device.id, config_entry=easee_entry
    )
    easee: list[ServiceCall] = []

    async def record(call: ServiceCall) -> None:
        easee.append(call)

    hass.services.async_register("easee", "set_charger_dynamic_limit", record)
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    entry = _entry(current=sensor.entity_id)
    calls = await _setup(hass, freezer, entry)
    plan = entry.runtime_data.supply.plan
    assert plan is not None
    start, end, amps = plan.amps[TESLA][0]
    await move(hass, freezer, start + timedelta(minutes=1))
    assert not calls  # not through a number
    assert easee[-1].data == {"device_id": device.id, "current": round(amps), "time_to_live": EASEE_TTL_MINUTES}
    sent = len(easee)
    # The same current again before Easee lets it go, so the charger does not fall back by itself.
    if end - start >= timedelta(minutes=20):
        await move(hass, freezer, start + timedelta(minutes=10))
        assert len(easee) == sent
        await move(hass, freezer, start + timedelta(minutes=17))
        assert len(easee) == sent + 1 and easee[-1].data["current"] == round(amps)


async def test_the_guard_turns_the_car_down_at_once_and_up_again_later(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    state = supply.state(now)
    assert supply.guard and state is not None and state["guard"] is True
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    # A kettle: 30 A on the meter with the car's 16, so the house draws 14. The car gets what is left
    # under the 23 A limit, less a margin of 2 A: 7 A, at once.
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [7]
    assert supply.guard_events == 1
    # The meter has not caught up yet: the cut counts as done, no second cut.
    hass.states.async_set(METER, "29.8", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert len(calls) == 1
    later = dt_util.now()
    # Under the limit: not up again yet, though the kettle is off.
    freezer.move_to(later + timedelta(minutes=1))
    hass.states.async_set(METER, "12", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert len(calls) == 1
    # Up only when the house has left the room all the time since the last change, and the charger may
    # be changed again: then straight to its full current, not a step at a time.
    freezer.move_to(later + CURRENT_EVERY + timedelta(seconds=5))
    hass.states.async_set(METER, "11.9", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert len(calls) == 1
    freezer.move_to(later + HEADROOM_WINDOW + timedelta(minutes=1))
    hass.states.async_set(METER, "11", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert calls[-1].data["value"] == 16 and len(calls) == 2


async def test_the_guard_looks_again_when_the_meter_stays_too_high(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """A meter that keeps showing the same number sends nothing new: the guard looks again each minute."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [7]
    # The cut did not help, and the meter says 30 as before.
    for _ in range(3):
        freezer.tick(timedelta(seconds=61))
        hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
        async_fire_time_changed(hass, dt_util.now())
        await hass.async_block_till_done()
    assert 6 in [c.data["value"] for c in calls]
    assert supply.guard_events >= 2


async def test_the_guard_stops_a_car_when_even_the_least_is_too_much(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    # As if the Tesla were charging in its slot.
    hass.states.async_set(CHARGE_SWITCH, "on")
    household.vehicles[TESLA].last_sent = None
    calls.clear()
    switches.calls.clear()
    # The oven and the kettle at once: 40 A, 17 over. 16 to 6 A is 10; the rest needs the car to stop.
    hass.states.async_set(METER, "40", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [6]
    assert ("turn_off", CHARGE_SWITCH) in switches.calls
    tesla = household.vehicles[TESLA]
    assert tesla.decision.control == "pause" and tesla.decision.reason == "no_room"
    assert tesla.status() == "waiting_for_room"
    assert supply.holds_off(tesla, dt_util.now())
    # It waits its while, and then while the meter shows too little room (23 - 20 - 2 = 1 A).
    later = dt_util.now() + GUARD_PAUSE + timedelta(seconds=1)
    hass.states.async_set(METER, "20", {"unit_of_measurement": "A"})
    assert supply.holds_off(tesla, later)
    # The house now is what counts: 8 A leaves 13 A, and it starts again.
    hass.states.async_set(METER, "8", {"unit_of_measurement": "A"})
    assert not supply.holds_off(tesla, later)


async def test_a_watched_car_goes_up_only_into_free_room(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """With the meter, the charger gets the room there is, not the plan's share: the plan starts and stops."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "19", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    hass.states.async_set(AMPS, "6", {"min": 6, "max": 16})
    moment = dt_util.now() + timedelta(minutes=6)  # the charger has been at 6 A for longer than it must wait
    supply._sent[AMPS] = (6.0, moment - timedelta(hours=1))
    supply._house_peaks.clear()
    calls.clear()
    # 23 A limit, 19 A on the meter with the car's 6: the house draws 13, so 8 A are free for the car
    # after the 2 A margin. The guard sees it at the meter's next reading.
    freezer.move_to(moment)
    hass.states.async_set(METER, "19", {"unit_of_measurement": "A"}, force_update=True)
    await hass.async_block_till_done()
    await supply.async_apply(moment)
    assert [c.data["value"] for c in calls] == [8]
    # No room at all: it stays.
    hass.states.async_set(METER, "23", {"unit_of_measurement": "A"})
    hass.states.async_set(AMPS, "6", {"min": 6, "max": 16})
    supply._sent[AMPS] = (6.0, moment - timedelta(hours=1))
    calls.clear()
    await supply.async_apply(moment)
    assert not calls


async def test_the_guard_without_a_meter_reading_turns_the_cars_to_the_least(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    hass.states.async_set(METER, "unavailable")
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [6]
    # And the plan keeps it there until the meter is back.
    plan = supply.plan
    assert plan is not None and plan.amps[TESLA]
    start = plan.amps[TESLA][0][0]
    await supply.async_apply(max(start, dt_util.now()) + timedelta(minutes=10))
    assert all(c.data["value"] == 6 for c in calls)


async def test_the_guard_is_off_unless_asked_for(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER])
    calls = await _setup(hass, freezer, entry)
    calls.clear()
    assert entry.runtime_data.supply.guard is False
    hass.states.async_set(METER, "40", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert not calls
    await entry.runtime_data.supply.async_guard(now)
    assert not calls


async def test_a_short_peak_is_waited_out_and_a_lasting_one_cut(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """An oven's element for a few seconds, a little over the limit: no cut. One that lasts: cut."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    # 26.9 A on a 23 A limit, and back under before the guard's time is up: nothing is cut.
    hass.states.async_set(METER, "26.9", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    freezer.tick(timedelta(seconds=10))
    hass.states.async_set(METER, "18.6", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    freezer.tick(GUARD_CONFIRM)
    async_fire_time_changed(hass, dt_util.now())
    await hass.async_block_till_done()
    assert not calls
    # The same, and it stays: cut when the time is up, to what is left (a house of 26 - 16 = 10 leaves 11).
    hass.states.async_set(METER, "26", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert not calls
    freezer.tick(GUARD_CONFIRM + timedelta(seconds=2))
    async_fire_time_changed(hass, dt_util.now())
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [11]


async def test_a_charger_nothing_charges_at_goes_to_its_full_current_once(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Frank: with no car charging, the charger is at its 16 A, so a car plugged in while Home Assistant is
    away charges at all the charger gives. Once, whatever the house draws; the next start sets the room."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "3", {"unit_of_measurement": "A"})
    garage_amps = "input_number.garage_amps"
    entry = entry_with(
        charger_sub(),
        ConfigSubentryDataWithId(
            data=carport_data(current_entity=garage_amps),
            subentry_id=GARAGE,
            subentry_type="charger",
            title="Garage",
            unique_id=None,
        ),
        vehicle_sub(TESLA, "Tesla", tesla_data(charge_power=11.0, connected_entity=None)),
        options={
            "supply_limit": 23,
            "supply_phases": "3",
            "supply_reserve": 5,
            "supply_meter": [METER],
            "supply_guard": True,
        },
    )
    calls: list[ServiceCall] = []

    async def record(call: ServiceCall) -> None:
        calls.append(call)
        hass.states.async_set(call.data["entity_id"], str(call.data["value"]), {"min": 6, "max": 16})

    hass.services.async_register("input_number", "set_value", record)
    hass.states.async_set(garage_amps, "7", {"min": 0, "max": 16})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    supply = entry.runtime_data.supply
    for minutes in (1, 16, 31):
        hass.states.async_set(METER, "18" if minutes == 16 else "3", {"unit_of_measurement": "A"})
        await supply.async_idle(dt_util.now() + timedelta(minutes=minutes))
    assert [c.data for c in calls] == [{"entity_id": garage_amps, "value": 16.0}]


async def test_a_car_is_started_at_what_there_is_room_for(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Frank: the current is set before the start, and with the oven on there is no start at all."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    # The oven: 18 A in the house leaves 23 - 18 - 2 = 3 A, under the least a charger gives.
    hass.states.async_set(METER, "18", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    switches.calls.clear()
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    assert ("turn_on", CHARGE_SWITCH) not in switches.calls
    assert tesla.decision.control == "pause" and tesla.decision.reason == "no_room"
    assert any(event["kind"] == "start_waits" and event["waits"] for event in household.events.items)
    # The oven goes off: at the meter's next reading the current goes to the 11 A there is room for
    # (10 A in the house), and the car is started. Nothing waits for the house to have been quiet.
    await move(hass, freezer, dt_util.now() + timedelta(seconds=15))
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    await move(hass, freezer, dt_util.now() + timedelta(seconds=2))
    assert ("turn_on", CHARGE_SWITCH) in switches.calls
    assert calls and calls[0].data == {"entity_id": AMPS, "value": 11.0}


async def test_a_charger_that_shows_its_old_current_for_a_while_is_not_believed_at_once(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Zaptec's cloud shows the current it had for up to a minute after a change; set by hand, it is taken."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [7]
    # The cloud shows 16 again for a moment: it is 7 all the same, and a cut a minute later is from 7.
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    assert supply.setting(AMPS, dt_util.now()) == 7
    freezer.move_to(dt_util.now() + GUARD_SETTLE + timedelta(seconds=1))
    hass.states.async_set(METER, "28", {"unit_of_measurement": "A"})  # a house of 21: nothing left, so stop
    await hass.async_block_till_done()
    assert calls[-1].data["value"] == 6
    # Someone sets it to 10 in the charger's app, and it stays: that is what it is from then on.
    hass.states.async_set(METER, "14", {"unit_of_measurement": "A"})
    hass.states.async_set(AMPS, "10", {"min": 6, "max": 16})
    freezer.move_to(dt_util.now() + ECHO + timedelta(seconds=1))
    assert supply.setting(AMPS, dt_util.now()) == 10
    assert any(event["kind"] == "current_outside" for event in household.events.items)


async def test_the_joint_plan_follows_a_cars_price_ceiling_as_far_as_its_target_allows(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=80)
    entry = _entry()
    await _setup(hass, freezer, entry)
    household = entry.runtime_data
    await household.async_set_vehicle(TESLA, {"price_ceiling_enabled": True, "price_ceiling": 0.5})
    await settle(hass, freezer)
    plan = household.supply.plan
    assert plan is not None
    prices = {now + timedelta(hours=i): price for i, price in enumerate(NIGHT)}
    shares = {start: amps for start, _end, amps in plan.amps[TESLA]}
    under = [start for start, price in prices.items() if price <= 0.5]
    over = [start for start in shares if prices[start] > 0.5]
    # Every hour under the ceiling is used in full (16 A), before any hour over it.
    assert len(under) == 3 and all(shares.get(start, 0) >= 15 for start in under)
    # The target still comes first: what the three hours cannot give comes in the cheapest hour over the
    # ceiling (0.8), and nowhere dearer.
    assert over and all(prices[start] == 0.8 for start in over)
    tesla = household.vehicles[TESLA]
    assert tesla.plan is not None and not tesla.plan.limited and tesla.plan.end_soc == tesla.target


async def test_the_guard_gives_a_car_charging_outside_its_plan_its_current_back(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Frank: a car on charge now goes back to its full current, not to what it had before a cut."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    # Left at 14 A from before (the plan of the night, say): EV Planner's memory says so too.
    hass.states.async_set(AMPS, "14", {"min": 6, "max": 16})
    supply._sent[AMPS] = (14.0, dt_util.now() - timedelta(hours=1))
    calls.clear()
    start = dt_util.now()
    hass.states.async_set(METER, "28", {"unit_of_measurement": "A"})  # a house of 14
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [7]
    # The kettle is off. A few minutes later: not yet. When the house has been quiet for the window: 16 A.
    for minutes in (3, 6, 9):
        freezer.move_to(start + timedelta(minutes=minutes))
        hass.states.async_set(METER, f"11.{minutes}", {"unit_of_measurement": "A"})
        await hass.async_block_till_done()
    assert len(calls) == 1
    freezer.move_to(start + HEADROOM_WINDOW + timedelta(minutes=1))
    hass.states.async_set(METER, "11", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert calls[-1].data["value"] == 16


async def test_a_zaptec_charger_is_turned_on_its_installation(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Zaptec asks that the current is turned on the installation ("Available current"), not the charger's
    own setting; that is set back to full once, as EV Planner no longer turns it."""
    zaptec = MockConfigEntry(domain="zaptec")
    zaptec.add_to_hass(hass)
    devices = dr.async_get(hass)
    installation = devices.async_get_or_create(config_entry_id=zaptec.entry_id, identifiers={("zaptec", "I1")})
    charger = devices.async_get_or_create(
        config_entry_id=zaptec.entry_id, identifiers={("zaptec", "C1")}, via_device_id=installation.id
    )
    registry = er.async_get(hass)
    own = registry.async_get_or_create(
        "number",
        "zaptec",
        "C1_charger_max_current",
        device_id=charger.id,
        config_entry=zaptec,
        suggested_object_id="lader1_charger_max_current",
    ).entity_id
    available = registry.async_get_or_create(
        "number",
        "zaptec",
        "I1_available_current",
        device_id=installation.id,
        config_entry=zaptec,
        suggested_object_id="hjem_available_current",
    ).entity_id
    hass.states.async_set(own, "6", {"min": 0, "max": 16})
    hass.states.async_set(available, "16", {"min": 0, "max": 25})
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(current=own, supply_meter=[METER], supply_guard=True)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    sent: list[tuple[str, float]] = []

    async def record(call: ServiceCall) -> None:
        sent.append((call.data["entity_id"], call.data["value"]))
        top = 25 if call.data["entity_id"] == available else 16
        hass.states.async_set(call.data["entity_id"], str(call.data["value"]), {"min": 0, "max": top})

    hass.services.async_register("number", "set_value", record)
    household = entry.runtime_data
    supply = household.supply
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    assert supply.knob(own) == available
    assert supply._raise_every(available).total_seconds() == 15 * 60
    sent.clear()
    supply._sent.clear()
    supply._unclamped.clear()
    hass.states.async_set(available, "16", {"min": 0, "max": 25})
    hass.states.async_set(own, "6", {"min": 0, "max": 16})
    # The kettle: the installation goes down, not the charger.
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert sent == [(available, 7.0)]
    # The charger's own setting was left at 6 A: it goes back to its full 16 A, once.
    await supply.async_idle(dt_util.now())
    await supply.async_idle(dt_util.now() + timedelta(minutes=1))
    assert sent.count((own, 16.0)) == 1
    # A second charger on the installation: each is turned on its own setting again.
    devices.async_get_or_create(
        config_entry_id=zaptec.entry_id, identifiers={("zaptec", "C2")}, via_device_id=installation.id
    )
    supply._knobs.clear()
    assert supply.knob(own) == own


async def test_a_car_paused_and_started_again_waits_only_for_the_meters_next_reading(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Frank, 12.42: paused, then charge now again. The car's own meter falls at once, the supply's shows the
    car's current for half a minute more. The car starts when the supply's meter reports, and what it showed
    meanwhile is not kept as the house's."""
    from custom_components.ev_household_planner.websocket import vehicle_state

    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "2", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    tesla = household.vehicles[TESLA]
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    # Charging: 17.3 A on the meter, 16 of them the car's.
    hass.states.async_set(METER, "17.3", {"unit_of_measurement": "A"})
    await move(hass, freezer, dt_util.now() + timedelta(seconds=10))
    # Paused: the car stops at once; the supply's meter has not reported since.
    await household.async_set_vehicle(TESLA, {"mode": "pause"})
    set_tesla(hass, soc=20, switch=False, charging=False)
    await settle(hass, freezer)
    switches.calls.clear()
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    # 23 - 17.3 - 2 is under 6 A, as far as the meter shows: it waits, and says so.
    assert tesla.decision.reason == "no_room" and tesla.status() == "waiting_for_room"
    assert ("turn_on", CHARGE_SWITCH) not in switches.calls
    assert vehicle_state(household, tesla)["room_free"] == 3.7
    # The meter reports: 2 A in the house, and the car is started at once.
    hass.states.async_set(METER, "2", {"unit_of_measurement": "A"})
    await move(hass, freezer, dt_util.now() + timedelta(seconds=2))
    assert ("turn_on", CHARGE_SWITCH) in switches.calls
    assert tesla.decision.control == "charge"
    assert vehicle_state(household, tesla)["room_free"] is None
    # The 17.3 A were never the house's: the window the raises look back over does not have them.
    peak = supply.house_peak(dt_util.now())
    assert peak is not None and peak < 3


async def test_the_margin_is_the_places_setting_from_none_to_three_amps(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """The margin under the fuse: 1 A unless the place says otherwise; 0 runs right up to the fuse."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True, supply_margin=None)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    assert supply.margin == 1.0
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    # The kettle again: 30 A with the car's 16, a house of 14. With 1 A kept free the car gets 8 A, not 7.
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [8]
    # The setting is kept between 0 and 3 A.
    assert supply.site is not None
    for value, margin in ((0, 0.0), (2.5, 2.5), (5, 3.0), (-1, 0.0)):
        supply.site.data["supply_margin"] = value
        assert supply.margin == margin


async def test_a_paused_car_is_judged_by_its_chargers_meter_not_by_what_its_cloud_still_says(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Frank, 15.12: turned down to 10 A by the oven, then paused. The car's cloud said "charging" for a minute
    more, so the charger was left at 10 A and charge now started at it. The charger's own meter shows the stop at
    once: the charger goes back to its full current, and the next start sets what there is room for."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    # The oven: 30 A with the car's 16. Down to 7 A.
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [7]
    # Paused. The car still says it charges; its charger's meter shows nothing.
    meter = {"kw": 0.0}
    supply._charger_kw = lambda vehicle: meter["kw"]  # type: ignore[method-assign]
    calls.clear()
    await household.async_set_vehicle(TESLA, {"mode": "pause"})
    hass.states.async_set(METER, "3", {"unit_of_measurement": "A"})
    await settle(hass, freezer)
    assert household.is_charging(household.vehicles[TESLA])  # as its cloud says
    assert [c.data["value"] for c in calls] == [16]  # back to its full current
    assert any(e["kind"] == "current" and e["why"] == "rest" for e in household.events.items)
    # Charge now again: started at what there is room for (all of it), not at the 7 A of before.
    switches.calls.clear()
    await household.async_set_vehicle(TESLA, {"mode": "charge_now"})
    await settle(hass, freezer)
    assert hass.states.get(AMPS).state == "16"  # type: ignore[union-attr]
    assert household.vehicles[TESLA].last_sent == "charge"
