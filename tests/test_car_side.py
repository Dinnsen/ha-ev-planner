"""What the car says for itself: a limit changed in its app, and a plug at a charger EV Planner does not know."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

from .conftest import (
    CABLE,
    CHARGER_CAR,
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

# An input_number: the number domain's own set_value belongs to EV Planner's number entities.
LIMIT = "input_number.tesla_limit"


async def test_with_own_steps_a_limit_changed_in_the_car_becomes_the_target(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    sent: list[float] = []

    async def record(call: ServiceCall) -> None:
        sent.append(call.data["value"])
        hass.states.async_set(call.data["entity_id"], str(call.data["value"]), {"min": 50, "max": 100, "step": 10})

    hass.services.async_register("input_number", "set_value", record)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    hass.states.async_set(LIMIT, "80", {"min": 50, "max": 100, "step": 10})
    entry = entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data(target_entity=LIMIT)))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    await household.async_set_vehicle(TESLA, {"target_step": "10", "target_soc": 90})
    await settle(hass, freezer)
    assert sent == [90] and tesla.target == 90
    # The car's own report of what EV Planner set is not a change.
    hass.states.async_set(LIMIT, "90", {"min": 50, "max": 100, "step": 10})
    await settle(hass, freezer)
    assert tesla.target == 90
    # Set to 80 % in the car's app on the way home: EV Planner follows.
    hass.states.async_set(LIMIT, "80", {"min": 50, "max": 100, "step": 10})
    await settle(hass, freezer)
    assert tesla.settings["target_soc"] == 80 and tesla.target == 80
    assert sent == [90], "nothing is sent back to the car"
    # Offline for a while, then a new limit: still followed.
    hass.states.async_set(LIMIT, "unavailable")
    await settle(hass, freezer)
    hass.states.async_set(LIMIT, "70", {"min": 50, "max": 100, "step": 10})
    await settle(hass, freezer)
    assert tesla.target == 70


async def test_a_late_report_of_the_old_limit_is_not_a_change(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    async def keep(call: ServiceCall) -> None:
        """The car's cloud takes its time: the entity still says the old limit."""

    hass.services.async_register("input_number", "set_value", keep)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    hass.states.async_set(LIMIT, "80")
    entry = entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data(target_entity=LIMIT)))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    await household.async_set_vehicle(TESLA, {"target_step": "5", "target_soc": 90})
    hass.states.async_set(LIMIT, "80.0")
    await settle(hass, freezer)
    assert tesla.target == 90


async def test_a_car_plugged_in_at_another_charger_is_left_alone(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """The car's cable says plugged in, its own charger says no car: it is at a charger EV Planner does not know."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, cable=False)
    hass.states.async_set(CHARGER_CAR, "off")
    entry = entry_with(
        charger_sub(carport_data(connected_entity=CHARGER_CAR)),
        vehicle_sub(TESLA, "Tesla", tesla_data(target_entity=LIMIT)),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    hass.states.async_set(CABLE, "on")
    await settle(hass, freezer)
    # Not at once: the charger may report a moment after the car.
    assert tesla.connected is True and tesla.elsewhere is False
    for _minute in range(6):
        await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert tesla.elsewhere is True and tesla.at_home is False
    assert tesla.plan is None and tesla.decision.reason == "away"
    assert "elsewhere" in [event["kind"] for event in household.events.items]
    # A car plugged in at its charger now is another car: the cable has not been out.
    hass.states.async_set(CHARGER_CAR, "on")
    await settle(hass, freezer)
    assert tesla.elsewhere is True
    # Unplugged there, and plugged in at its own charger at home: it is planned again.
    hass.states.async_set(CHARGER_CAR, "off")
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    assert tesla.elsewhere is False
    hass.states.async_set(CABLE, "on")
    hass.states.async_set(CHARGER_CAR, "on")
    await settle(hass, freezer)
    assert tesla.elsewhere is False and tesla.plan is not None


async def test_with_own_steps_a_limit_the_car_had_already_is_followed(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """Frank: set to 80 % in the app before EV Planner started; EV Planner still said 90 %."""

    async def keep(call: ServiceCall) -> None:
        """The car does not take it."""

    hass.services.async_register("input_number", "set_value", keep)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    hass.states.async_set(LIMIT, "80")
    entry = entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data(target_entity=LIMIT)))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    await household.async_set_vehicle(TESLA, {"target_step": "10", "target_soc": 90})
    assert tesla.target == 90
    # The car never took 90 %: once the moment for its report has passed, the car's 80 % is the target.
    await move(hass, freezer, dt_util.now() + timedelta(minutes=16))
    hass.states.async_set(LIMIT, "80", {"min": 50, "max": 100, "step": 10})
    await settle(hass, freezer)
    assert tesla.settings["target_soc"] == 80 and tesla.target == 80
