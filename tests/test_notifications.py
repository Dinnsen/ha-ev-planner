"""Tests for reminders, live notifications, messages, notification actions and widgets."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_planner.notifications import is_mobile_app, service_name, tag_for

from .conftest import (
    CABLE,
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

PHONE = "notify.mobile_app_phone"


@pytest.fixture
async def household(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> MockConfigEntry:
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    entry = entry_with(
        charger_sub(),
        vehicle_sub(TESLA, "Tesla", tesla_data()),
        options={"notify_services": [PHONE, "notify.family_email"], "update_widgets": True},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    return entry


async def _switch(hass: HomeAssistant, entity_id: str, on: bool = True) -> None:
    await hass.services.async_call(
        "switch", "turn_on" if on else "turn_off", {ATTR_ENTITY_ID: entity_id}, blocking=True
    )


def test_helpers() -> None:
    assert service_name("notify.mobile_app_x") == "mobile_app_x"
    assert service_name("mobile_app_x") == "mobile_app_x"
    assert is_mobile_app("notify.mobile_app_x")
    assert not is_mobile_app("notify.email")
    assert tag_for("live", "a b/c") == "evp_live_a_b_c"
    assert len(tag_for("live", "x" * 100)) == 64


async def test_plug_in_reminder(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    email = NotifyCalls(hass, "family_email")
    hass.states.async_set(CABLE, "off")
    hass.states.async_set(SOC, "40")
    await _switch(hass, "switch.tesla_plug_in_reminder")
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))

    reminders = [call for call in notify.calls if call.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]
    assert len(reminders) == 1
    assert "Tesla" in reminders[0]["title"]
    assert reminders[0]["data"]["notification_icon"] == "mdi:ev-plug-type2"
    # A white glyph on a coloured badge (iOS draws both in the colours given).
    assert reminders[0]["data"]["notification_icon_color"] == "#FFFFFF"
    assert reminders[0]["data"]["color"] != "#FFFFFF"
    actions = [action["action"] for action in reminders[0]["data"]["actions"]]
    assert actions == [f"EV_PLANNER_CHARGE_NOW_{TESLA}", f"EV_PLANNER_FOLLOW_PLAN_{TESLA}"]
    # With the cheapest price of the coming day (0.3 at 02:00).
    assert "Cheapest price: 0.30 DKK/kWh" in reminders[0]["message"]
    # A plain notify action gets the text only.
    assert email.calls and "data" not in email.calls[0]

    # Only once a day.
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert len([c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]) == 1

    # Plugging in clears it.
    hass.states.async_set(CABLE, "on")
    await settle(hass, freezer)
    assert {"message": "clear_notification", "data": {"tag": f"evp_reminder_{TESLA}"}} in notify.calls


async def test_notifications_in_the_chosen_language(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    assert hass.config.language == "en"
    await household.runtime_data.async_update_settings({"language": "da"})
    hass.states.async_set(CABLE, "off")
    hass.states.async_set(SOC, "40")
    await _switch(hass, "switch.tesla_plug_in_reminder")
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    reminders = [call for call in notify.calls if call.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]
    assert reminders and "Billigste pris: 0,30 kr./kWh" in reminders[0]["message"]
    # The line widgets show follows the same language.
    assert household.runtime_data.status_text("unplugged") == "Ikke tilsluttet"
    await household.runtime_data.async_update_settings({"language": "en"})
    assert household.runtime_data.status_text("unplugged") == "Not plugged in"
    assert household.runtime_data.status_text("10.00-11.00") == "10.00-11.00"


async def test_reminder_without_a_plan_and_not_when_charged_enough(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    hass.states.async_set(CABLE, "off")
    await _switch(hass, "switch.tesla_plug_in_reminder")
    hass.states.async_set(SOC, "70")  # above the 60 % threshold
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert not [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]

    hass.states.async_set(SOC, "20")
    hass.states.async_set("sensor.energi_data_service", "unavailable")
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    reminder = [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]
    assert reminder and "20" in reminder[0]["message"]


async def test_reminder_only_at_a_low_price(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    planner = household.runtime_data
    hass.states.async_set(CABLE, "off")
    hass.states.async_set(SOC, "40")
    await planner.async_set_vehicle(TESLA, {"reminder": True, "reminder_price_enabled": True, "reminder_price": 0.2})
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    # The cheapest price (0.3) is not below 0.2: no reminder today.
    assert not [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]
    assert planner.vehicles[TESLA].reminded_on == dt_util.now().date().isoformat()

    planner.vehicles[TESLA].reminded_on = None
    await planner.async_set_vehicle(TESLA, {"reminder_price": 0.35})
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"]
    assert hass.states.get("number.tesla_remind_below_price").state == "0.35"
    assert hass.states.get("switch.tesla_remind_only_at_a_low_price").state == "on"


async def test_reminder_days_repeats_and_phones(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    planner = household.runtime_data
    email = NotifyCalls(hass, "family_email")
    hass.states.async_set(CABLE, "off")
    hass.states.async_set(SOC, "40")

    def reminders() -> int:
        return len([c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_reminder_{TESLA}"])

    # Monday is not one of the days.
    await planner.async_set_vehicle(TESLA, {"reminder": True, "reminder_days": ["tue"]})
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert reminders() == 0

    await planner.async_set_vehicle(TESLA, {"reminder_days": ["mon"], "reminder_repeat": 30, "notify_targets": [PHONE]})
    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert reminders() == 1
    await move(hass, freezer, dt_util.now() + timedelta(minutes=10))
    assert reminders() == 1
    for expected in (2, 3, 4, 4):
        await move(hass, freezer, dt_util.now() + timedelta(minutes=31))
        assert reminders() == expected
    # Only the chosen phone.
    assert email.calls == []
    assert float(hass.states.get("number.tesla_repeat_reminder_every").state) == 30
    assert float(hass.states.get("number.tesla_low_price_within").state) == 24


async def test_live_notification_while_charging_and_message_when_done(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    await _switch(hass, "switch.tesla_live_notification")
    await _switch(hass, "switch.tesla_notify_when_charged")
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": "charge_now"}, blocking=True
    )
    hass.states.async_set(CHARGING, "on")
    await settle(hass, freezer)

    live = [c for c in notify.calls if c.get("data", {}).get("live_update")]
    assert live
    first = live[0]
    assert first["title"] == "Tesla"
    assert first["data"]["tag"] == f"evp_live_{TESLA}"
    assert first["data"]["notification_icon"] == "mdi:ev-station"
    assert first["data"]["progress"] == 50 and first["data"]["progress_max"] == 80
    assert first["data"]["critical_text"] == "50 %"
    assert "silent" not in first["data"]

    # The level rises: an update, quietly, at most every few minutes.
    hass.states.async_set(SOC, "55")
    await settle(hass, freezer)
    await move(hass, freezer, dt_util.now() + timedelta(minutes=6))
    updates = [c for c in notify.calls if c.get("data", {}).get("live_update")]
    assert len(updates) == 2
    assert updates[-1]["data"]["silent"] is True
    assert updates[-1]["data"]["progress"] == 55
    # A small change right after is not sent.
    hass.states.async_set(SOC, "56")
    await settle(hass, freezer)
    assert len([c for c in notify.calls if c.get("data", {}).get("live_update")]) == 2

    # Stops: the live notification ends, and a message says what was charged.
    hass.states.async_set(CHARGING, "off")
    await hass.services.async_call(
        "select", "select_option", {ATTR_ENTITY_ID: "select.tesla_mode", "option": "pause"}, blocking=True
    )
    await settle(hass, freezer)
    assert {"message": "clear_notification", "data": {"tag": f"evp_live_{TESLA}"}} in notify.calls
    done = [c for c in notify.calls if c.get("data", {}).get("tag") == f"evp_done_{TESLA}"]
    assert done and done[0]["data"]["notification_icon"] == "mdi:battery-charging-100"
    assert "kWh" in done[0]["message"]
    assert hass.states.get("sensor.tesla_energy_this_month").state != "0.0"
    history = household.runtime_data.vehicles[TESLA].history
    assert history and history[0]["energy"] > 0


async def test_notification_actions_set_the_mode(
    hass: HomeAssistant, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    hass.bus.async_fire("mobile_app_notification_action", {"action": f"EV_PLANNER_CHARGE_NOW_{TESLA}"})
    await settle(hass, freezer)
    assert hass.states.get("select.tesla_mode").state == "charge_now"
    hass.bus.async_fire("mobile_app_notification_action", {"action": f"EV_PLANNER_FOLLOW_PLAN_{TESLA}"})
    await settle(hass, freezer)
    assert hass.states.get("select.tesla_mode").state == "smart"
    hass.bus.async_fire("mobile_app_notification_action", {"action": "SOMETHING_ELSE"})
    await settle(hass, freezer)
    assert hass.states.get("select.tesla_mode").state == "smart"


async def test_widgets_are_refreshed_when_a_status_changes(
    hass: HomeAssistant, notify: NotifyCalls, household: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    hass.states.async_set(CABLE, "off")
    await settle(hass, freezer)
    assert {"message": "update_widgets"} in notify.calls
    count = notify.calls.count({"message": "update_widgets"})

    # Another change soon after waits for the quiet period.
    hass.states.async_set(CABLE, "on")
    await settle(hass, freezer)
    assert notify.calls.count({"message": "update_widgets"}) == count
    await move(hass, freezer, dt_util.now() + timedelta(minutes=16))
    assert notify.calls.count({"message": "update_widgets"}) == count + 1
