"""The charging speed and power a car teaches EV Planner, in Home Assistant."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import (
    CABLE,
    CHARGING,
    NIGHT,
    SOC,
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

POWER = "sensor.tesla_charger_power"
STATUS = "sensor.tesla_status"


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory, entry: MockConfigEntry) -> MockConfigEntry:
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


async def _mode(hass: HomeAssistant, option: str) -> None:
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": option}, blocking=True
    )


async def _charge(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, minutes: int, start_soc: float, speed: float
) -> None:
    """Charge minute by minute at ``speed`` (%/h), with a new charge level every 5 minutes."""
    start = dt_util.now()
    for minute in range(1, minutes + 1):
        await move(hass, freezer, start + timedelta(minutes=minute))
        if minute % 5 == 0:
            hass.states.async_set(SOC, str(round(start_soc + speed * minute / 60, 1)), {"unit_of_measurement": "%"})
            await hass.async_block_till_done()


async def test_a_charge_teaches_the_speed_and_the_power(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, limit=100)
    hass.states.async_set(POWER, "0", {"unit_of_measurement": "kW"})
    entry = await _setup(
        hass,
        freezer,
        entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data(power_entity=POWER, imported_speed=None))),
    )
    tesla = entry.runtime_data.vehicles[TESLA]
    attributes = hass.states.get(STATUS).attributes
    # Nothing shown yet: 10 kW against 60 kWh.
    assert attributes["charge_speed"] == 16.7
    assert attributes["charge_speed_source"] == "estimated"
    assert attributes["charge_power"] == 10
    assert attributes["charge_power_source"] == "configured"

    await _mode(hass, "charge_now")
    hass.states.async_set(CHARGING, "on")
    hass.states.async_set(POWER, "9600", {"unit_of_measurement": "W"})
    await settle(hass, freezer)
    await _charge(hass, freezer, 150, 20, 17)

    # Risen more than 30 %: the plan follows what the car shows now.
    attributes = hass.states.get(STATUS).attributes
    assert attributes["charge_speed_source"] == "measuring"
    assert attributes["charge_speed"] == pytest.approx(17, abs=0.3)
    assert attributes["measured_rise"] > 30
    # The energy is what the car reports drawing, not worked out from the level.
    assert tesla.session is not None
    assert tesla.session.energy == pytest.approx(9.6 * 150 / 60, rel=0.05)

    hass.states.async_set(CHARGING, "off")
    hass.states.async_set(POWER, "0", {"unit_of_measurement": "kW"})
    await _mode(hass, "pause")
    await settle(hass, freezer)
    assert tesla.session is None
    assert tesla.learned.speed == pytest.approx(17, rel=0.02)
    assert tesla.learned.speed_count == 1
    assert tesla.learned.power == pytest.approx(9.6)
    figures = entry.runtime_data.charging_figures(tesla)
    assert figures["charge_speed_source"] == "learned"
    assert figures["charge_speed_learned_from"] == 1
    assert figures["charge_power"] == pytest.approx(9.6)
    assert figures["charge_power_source"] == "learned"
    # The plan uses both: the last 37.5 % at 17 %/h, drawing 9.6 kW.
    await _mode(hass, "smart")
    await settle(hass, freezer)
    assert tesla.plan is not None
    assert tesla.plan.speed == pytest.approx(17, rel=0.02)
    assert tesla.plan.energy == pytest.approx(tesla.plan.minutes / 60 * 9.6, rel=0.02)

    # Kept across a restart.
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.learned.speed == pytest.approx(17, rel=0.02)

    # A short charge is measured on, and unplugging ends it: only the power is learned from it.
    await _mode(hass, "charge_now")
    hass.states.async_set(CHARGING, "on")
    hass.states.async_set(POWER, "10.2", {"unit_of_measurement": "kW"})
    await settle(hass, freezer)
    await _charge(hass, freezer, 30, 62, 17)
    hass.states.async_set(CHARGING, "off")
    await settle(hass, freezer)
    assert tesla.meter.rise > 0  # 8 %: measured on
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    assert tesla.meter.rise == 0
    assert tesla.learned.speed_count == 1
    assert tesla.learned.power_count == 2
    assert tesla.learned.power == pytest.approx(9.6 * 0.7 + 10.2 * 0.3, rel=0.01)


async def test_without_a_power_sensor_the_level_counts_the_energy(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    """10 % at the imported 15 %/h is 40 minutes at 10 kW."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=50, limit=100)
    entry = await _setup(hass, freezer, entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data())))
    tesla = entry.runtime_data.vehicles[TESLA]
    await _mode(hass, "charge_now")
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    hass.states.async_set(SOC, "60", {"unit_of_measurement": "%"})
    await settle(hass, freezer)
    assert tesla.session is not None
    assert tesla.session.energy == pytest.approx(10 / 15 * 10)


async def test_the_old_efficiency_entities_are_removed(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = entry_with(charger_sub(), vehicle_sub(TESLA, "Tesla", tesla_data()))
    entry.add_to_hass(hass)
    registry = er.async_get(hass)
    old = registry.async_get_or_create(
        "number", "ev_planner", f"{TESLA}_charging_efficiency", config_entry=entry, suggested_object_id="tesla_eff"
    )
    guest = registry.async_get_or_create(
        "number",
        "ev_planner",
        f"{entry.entry_id}_guest_guest_charging_efficiency",
        config_entry=entry,
        suggested_object_id="guest_eff",
    )
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert registry.async_get(old.entity_id) is None
    assert registry.async_get(guest.entity_id) is None
    assert registry.async_get("number.tesla_target") is not None
