"""A plan that does not move for a few øre, charging early, topping up and a target per weekday."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.websocket import vehicle_state

from .conftest import NIGHT, TESLA, SwitchCalls, set_prices, settle


def _hours(plan) -> list[tuple[int, int]]:
    return [(seg["start"].hour, seg["end"].hour) for seg in plan.segments]


async def test_a_plan_does_not_move_for_a_few_ore(
    hass: HomeAssistant,
    now: datetime,
    init_integration: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    tesla = init_integration.runtime_data.vehicles[TESLA]
    assert tesla.plan is not None and _hours(tesla.plan) == [(2, 4)]
    # 01 gets a little cheaper than 03: moving would save 0.3 kr, so the plan stays.
    prices = list(NIGHT)
    prices[5] = 0.32
    set_prices(hass, now, prices)
    await settle(hass, freezer)
    assert _hours(tesla.plan) == [(2, 4)] and tesla.plan.kept
    assert vehicle_state(init_integration.runtime_data, tesla)["plan"]["kept"] is True
    # Much cheaper: it moves.
    prices[5] = 0.05
    set_prices(hass, now, prices)
    await settle(hass, freezer)
    assert _hours(tesla.plan) == [(1, 3)] and not tesla.plan.kept


async def test_early_and_top_up_from_the_switches(
    hass: HomeAssistant,
    now: datetime,
    init_integration: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    tesla = init_integration.runtime_data.vehicles[TESLA]
    set_prices(hass, now, [1.006, 1.005, 1.004, 1.003, 1.002, 1.001, 1.0, 0.999, 0.998, 0.997, 0.996])
    await settle(hass, freezer)
    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: "switch.tesla_prefer_charging_early"}, blocking=True
    )
    await settle(hass, freezer)
    assert tesla.plan is not None and tesla.plan.early
    assert tesla.plan.segments[0]["start"] == now
    await hass.services.async_call(
        "number", "set_value", {ATTR_ENTITY_ID: "number.tesla_top_up_from", "value": 70}, blocking=True
    )
    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: "switch.tesla_top_up_before_departure"}, blocking=True
    )
    await settle(hass, freezer)
    assert tesla.plan is not None and tesla.plan.topup
    # 50 % to 70 % right away, 70 % to 80 % just before seven.
    assert tesla.plan.segments[0]["start"] == now
    assert tesla.plan.segments[-1]["end"] > now + timedelta(hours=9)


async def test_a_target_for_a_weekday(
    hass: HomeAssistant,
    now: datetime,
    init_integration: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    # Monday evening: the next ready-by time is Tuesday 07:00.
    await household.async_set_vehicle(TESLA, {"day_targets": {"tue": 100, "nonsense": 5}})
    assert tesla.settings["day_targets"] == {"tue": 100.0}
    assert tesla.target == 100
    state = vehicle_state(household, tesla)
    assert state["day_target"] == 100
    # The car's own limit is lower: the panel can say so.
    assert state["car_limit"] == 80
    assert tesla.plan is not None and tesla.plan.end_soc == 100


async def test_waiting_for_prices_charges_just_in_time_if_they_never_come(
    hass: HomeAssistant,
    now: datetime,
    init_integration: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    # Prices only until midnight: tomorrow's have not come.
    set_prices(hass, now, NIGHT[:4])
    await settle(hass, freezer)
    assert tesla.plan_error == "not_enough_prices"
    assert hass.states.get("sensor.tesla_status").state == "not_enough_prices"
    assert tesla.plan is not None and tesla.plan.fallback
    assert _hours(tesla.plan) == [(4, 6)]
    state = vehicle_state(household, tesla)
    assert state["plan"]["fallback"] is True
    # The price sensor stops altogether: still the plan for the morning.
    hass.states.async_set("sensor.energi_data_service", "unavailable")
    await settle(hass, freezer)
    assert tesla.plan_error == "no_price_data"
    assert tesla.plan is not None and tesla.plan.fallback
    from custom_components.ev_household_planner.websocket import panel_state

    assert panel_state(hass, household)["price_issue"] == "stale"


async def test_a_plan_without_prices_gives_way_when_they_come(
    hass: HomeAssistant,
    now: datetime,
    init_integration: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
    switches: SwitchCalls,
) -> None:
    household = init_integration.runtime_data
    tesla = household.vehicles[TESLA]
    # Ready by 21:30 and no prices: it charges right away, just in case.
    await household.async_set_vehicle(TESLA, {"ready_by": "21:30"})
    hass.states.async_set("sensor.energi_data_service", "unavailable")
    await settle(hass, freezer)
    assert tesla.plan is not None and tesla.plan.fallback
    assert tesla.decision.control == "charge"
    # The prices come: the real plan takes over at once, even while it charges.
    set_prices(hass, now, NIGHT)
    await settle(hass, freezer)
    assert tesla.plan is not None and not tesla.plan.fallback
