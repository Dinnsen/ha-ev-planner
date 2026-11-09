"""The morning receipt, the margin it teaches, the cannot-make-it warning and the charging curve."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.const import ACTION_CHARGE_NOW

from .conftest import (
    CHARGING,
    NIGHT,
    SOC,
    TESLA,
    NotifyCalls,
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


async def _setup(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> MockConfigEntry:
    entry = entry_with(
        charger_sub(),
        vehicle_sub(TESLA, "Tesla", tesla_data()),
        options={"notify_services": ["notify.mobile_app_phone"]},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


def _at(now: datetime, hour: int, minute: int = 0) -> datetime:
    day = now if hour >= 12 else now + timedelta(days=1)
    return day.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _tagged(notify: NotifyCalls, kind: str) -> list[dict]:
    return [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_{kind}_{TESLA}"]


async def _night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, now: datetime, soc_at_four: float) -> None:
    """The plan charges 02-04; the car gets to ``soc_at_four``."""
    await move(hass, freezer, _at(now, 2, 1))
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 3, 59))
    hass.states.async_set(SOC, str(soc_at_four), {"unit_of_measurement": "%"})
    hass.states.async_set(CHARGING, "off")
    await settle(hass, freezer)


async def test_the_morning_receipt_says_how_it_went(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = await _setup(hass, freezer)
    tesla = entry.runtime_data.vehicles[TESLA]
    assert tesla.night is not None and tesla.night["planned_soc"] == 80
    await _night(hass, freezer, now, 80)
    assert _tagged(notify, "receipt") == []
    await move(hass, freezer, _at(now, 7, 0))
    receipt = _tagged(notify, "receipt")
    assert len(receipt) == 1
    assert receipt[0]["message"].startswith("Ready at 07:00: 80 % of 80 %, 20.0 kWh for")
    assert receipt[0]["data"]["notification_icon"] == "mdi:car-clock"
    assert tesla.last_receipt is not None and tesla.last_receipt["late"] is False
    assert tesla.learned.margin == 0 and tesla.learned.on_time == 1
    await move(hass, freezer, _at(now, 7, 5))
    assert len(_tagged(notify, "receipt")) == 1


async def test_a_late_morning_makes_the_next_plan_finish_earlier(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = await _setup(hass, freezer)
    tesla = entry.runtime_data.vehicles[TESLA]
    # The car charges slower than planned and gets to 70 % only.
    await _night(hass, freezer, now, 70)
    await move(hass, freezer, _at(now, 7, 0))
    receipt = _tagged(notify, "receipt")
    assert receipt and receipt[-1]["message"].startswith("Not quite ready at 07:00: 70 % of 80 % (planned 80 %).")
    assert receipt[-1]["message"].endswith("From now on it aims to be done 45 minutes earlier.")
    assert tesla.learned.margin == 45
    assert tesla.last_receipt is not None and tesla.last_receipt["late"] is True

    # The next night the cheapest hour is the last one: the plan stops 45 minutes before 07:00.
    evening = _at(now, 20, 0) + timedelta(days=1)
    await move(hass, freezer, evening - timedelta(hours=1))
    set_prices(hass, evening, [3.0] * 10 + [0.1])
    await settle(hass, freezer)
    assert tesla.plan is not None and tesla.plan.end is not None
    assert tesla.plan.end <= evening + timedelta(hours=10, minutes=15)


async def test_a_car_that_cannot_make_it_is_warned_about_once(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = await _setup(hass, freezer)
    household = entry.runtime_data
    await household.async_set_vehicle(TESLA, {"ready_by": "20:30"})
    await move(hass, freezer, now + timedelta(minutes=1))
    warning = _tagged(notify, "short")
    assert len(warning) == 1
    assert warning[0]["message"].startswith("Tesla cannot reach 80 % by 20:30")
    assert warning[0]["data"]["actions"][0]["action"] == f"{ACTION_CHARGE_NOW}_{TESLA}"
    await move(hass, freezer, now + timedelta(minutes=2))
    assert len(_tagged(notify, "short")) == 1
    # Without the receipt setting, nothing is sent.
    await household.async_set_vehicle(TESLA, {"notify_receipt": False, "ready_by": "20:45"})
    await move(hass, freezer, now + timedelta(minutes=3))
    assert len(_tagged(notify, "short")) == 1


async def test_a_driven_off_car_gets_no_receipt(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    notify = NotifyCalls(hass)
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = await _setup(hass, freezer)
    tesla = entry.runtime_data.vehicles[TESLA]
    await _night(hass, freezer, now, 80)
    hass.states.async_set("binary_sensor.tesla_cable", "off")
    await settle(hass, freezer)
    await move(hass, freezer, _at(now, 7, 0))
    assert _tagged(notify, "receipt") == []
    assert tesla.night is None or tesla.night["deadline"] != _at(now, 7, 0).isoformat()


async def test_the_slow_top_is_planned_with_its_own_speed(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, limit=90)
    entry = await _setup(hass, freezer)
    household = entry.runtime_data
    tesla = household.vehicles[TESLA]
    assert tesla.plan is not None and tesla.plan.minutes == 160 + 5  # 40 % at 15 %/h, in quarters
    tesla.learned.curve = {"80-90": 5.0}
    await household.async_recalculate(force=True)
    # 30 % at 15 %/h and the last 10 % at 5 %/h.
    assert tesla.plan is not None and tesla.plan.minutes == 120 + 120
    assert tesla.plan.speed == pytest.approx(10)
