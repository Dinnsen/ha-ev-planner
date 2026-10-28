"""A charge going on when Home Assistant restarts goes on after it."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import (
    CABLE,
    CHARGE_SWITCH,
    CHARGING,
    NIGHT,
    TESLA,
    SwitchCalls,
    charger_sub,
    entry_with,
    move,
    set_prices,
    set_tesla,
    settle,
    tesla_data,
    vehicle_sub,
)


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, entry: MockConfigEntry) -> MockConfigEntry:
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


async def test_a_restart_does_not_pause_a_charge(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = await _setup(hass, freezer, entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data())))
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.plan is not None and tesla.plan.start is not None
    planned = tesla.plan.to_dict()

    # Charging in the plan.
    await move(hass, freezer, tesla.plan.start + timedelta(minutes=20, seconds=30))
    assert switches.calls[-1] == ("turn_on", CHARGE_SWITCH)
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    sent = len(switches.calls)

    # Home Assistant restarts; the car's integration is not up yet.
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    hass.states.async_set(CHARGING, "unavailable")
    hass.states.async_set(CABLE, "unavailable")
    await move(hass, freezer, dt_util.now() + timedelta(seconds=30))
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    tesla = entry.runtime_data.vehicles[TESLA]
    # The plan it was charging in is kept, nothing is switched and the charge goes on.
    assert tesla.plan is not None and tesla.plan.to_dict() == planned
    assert tesla.session is not None
    assert len(switches.calls) == sent

    # The car's integration is up again.
    hass.states.async_set(CABLE, "on")
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=2))
    assert tesla.plan is not None and tesla.plan.to_dict() == planned
    assert tesla.plan_restored is False
    assert tesla.decision.control == "charge"
    assert len(switches.calls) == sent
    assert tesla.session is not None


async def test_after_a_restart_a_finished_period_is_planned_again(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = await _setup(hass, freezer, entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data())))
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.plan is not None and tesla.plan.end is not None
    end = tesla.plan.end
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    # Down until after the planned period.
    await move(hass, freezer, end + timedelta(minutes=5))
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.plan_restored is False
    assert tesla.plan is None or tesla.plan.end != end
