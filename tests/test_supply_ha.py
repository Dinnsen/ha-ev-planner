"""Two cars on one supply in Home Assistant: planned together under the limit, the current set per slot."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.supply import kw

from .conftest import (
    CARPORT,
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


def _entry(**options: Any) -> MockConfigEntry:
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
        vehicle_sub(TESLA, "Tesla", tesla_data(current_entity=AMPS, charge_power=11.0)),
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
