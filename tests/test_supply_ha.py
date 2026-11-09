"""Two cars on one supply in Home Assistant: planned together under the limit, the current set per slot."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.supply import kw
from custom_components.ev_household_planner.supply_control import (
    EASEE_TTL_MINUTES,
    GUARD_HOLD,
    GUARD_PAUSE,
    GUARD_SETTLE,
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
        options={"supply_limit": 23, "supply_phases": "3", "supply_reserve": 5, **options},
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
    supply = entry.runtime_data.supply
    state = supply.state(now)
    assert supply.guard and state is not None and state["guard"] is True
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    calls.clear()
    # A kettle: 30 A on the meter, 7 A over. The Tesla goes from 16 to 9 A at once.
    hass.states.async_set(METER, "30", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [9]
    # The meter has not caught up yet: the cut counts as done, no second cut.
    hass.states.async_set(METER, "29.8", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert len(calls) == 1
    # Still over a minute later: down again, to the least a charger gives.
    later = dt_util.now() + GUARD_SETTLE + timedelta(seconds=1)
    freezer.move_to(later)
    hass.states.async_set(METER, "26", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert calls[-1].data["value"] == 6
    assert supply.guard_events == 2
    # Under the limit: nothing to do.
    hass.states.async_set(METER, "12", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert len(calls) == 2
    # The plan does not raise it for a while; after that it may.
    held = supply._held[TESLA]
    assert held == later + GUARD_HOLD
    await supply.async_apply(later + timedelta(seconds=30))
    assert len(calls) == 2


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
    calls.clear()
    switches.calls.clear()
    # The oven and the kettle at once: 40 A, 17 over. 16 to 6 A is 10; the rest needs the car to stop.
    hass.states.async_set(METER, "40", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [6]
    assert ("turn_off", CHARGE_SWITCH) in switches.calls
    tesla = household.vehicles[TESLA]
    assert supply.holds_off(tesla, dt_util.now())
    # It waits, also while the meter shows little room, then starts again when there is room.
    later = dt_util.now() + GUARD_PAUSE + timedelta(seconds=1)
    hass.states.async_set(METER, "20", {"unit_of_measurement": "A"})
    assert supply.holds_off(tesla, later)
    hass.states.async_set(METER, "8", {"unit_of_measurement": "A"})
    assert not supply.holds_off(tesla, later)


async def test_the_plan_raises_a_watched_car_only_into_free_room(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "19", {"unit_of_measurement": "A"})
    entry = _entry(supply_meter=[METER], supply_guard=True)
    calls = await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    plan = supply.plan
    assert plan is not None
    start, _end, amps = max(plan.amps[TESLA], key=lambda item: item[2])
    moment = max(start, dt_util.now()) + timedelta(minutes=1)
    supply._sent[TESLA] = (6.0, moment - timedelta(hours=1))
    supply._held.clear()
    calls.clear()
    # 23 A limit, 19 A on the meter: 3 A free after the margin, so 6 becomes 9, not the plan's share.
    await supply.async_apply(moment)
    if round(amps) > 9:
        assert [c.data["value"] for c in calls] == [9]
    # No room at all: it stays.
    hass.states.async_set(METER, "23", {"unit_of_measurement": "A"})
    supply._sent[TESLA] = (6.0, moment - timedelta(hours=1))
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
    supply._held.clear()
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
