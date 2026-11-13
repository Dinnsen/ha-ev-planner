"""Cars that find their charger, places with a supply of their own, and a backup for start and pause."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import datetime, timedelta
from typing import Any
from unittest.mock import patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntryState, ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ev_household_planner.catalog import describe_device, suggest_entities
from custom_components.ev_household_planner.const import (
    CONTROL_CHARGE,
    CONTROL_PAUSE,
    PAIR_ASK_AFTER_SLOW,
    PAIR_EARLIER,
    PAUSES_IN_WINDOW,
)
from custom_components.ev_household_planner.pairing import Candidate, Site, choose, place_matches
from custom_components.ev_household_planner.planner import PriceSlot
from custom_components.ev_household_planner.rules import Decision
from custom_components.ev_household_planner.supply import SharedCar, plan_supply
from custom_components.ev_household_planner.vehicle import Vehicle
from custom_components.ev_household_planner.websocket import panel_state

from .conftest import NIGHT, NotifyCalls, SwitchCalls, entry_with, move, set_prices, settle, vehicle_sub

ELROQ = "elroq_id"
EPIQ = "epiq_id"
GARAGE = "garage_id"
CARPORT = "carport_id"
CABIN = "cabin_id"
SUMMER = "summer_id"
PHONE = "notify.mobile_app_phone"


def _car(key: str, **extra: Any) -> dict[str, Any]:
    return {
        "battery_capacity": 60.0,
        "charge_power": 11.0,
        "soc_entity": f"sensor.{key}_battery",
        "connected_entity": f"binary_sensor.{key}_cable",
        "charging_entity": f"binary_sensor.{key}_charging",
        "home_entity": f"device_tracker.{key}",
        "charger": "auto",
        "control": "charger",
        "control_entity": f"switch.{key}_charge",
        "control_backup": True,
        "refresh_entity": f"button.{key}_refresh",
        **extra,
    }


def _set_car(
    hass: HomeAssistant, key: str, *, place: str = "not_home", cable: bool = False, charging: bool = False
) -> None:
    hass.states.async_set(f"sensor.{key}_battery", "30", {"unit_of_measurement": "%"})
    hass.states.async_set(f"binary_sensor.{key}_cable", "on" if cable else "off")
    hass.states.async_set(f"binary_sensor.{key}_charging", "on" if charging else "off")
    hass.states.async_set(f"device_tracker.{key}", place)
    hass.states.async_set(f"switch.{key}_charge", "on")


def _charger(subentry_id: str, title: str, data: dict[str, Any]) -> ConfigSubentryDataWithId:
    return ConfigSubentryDataWithId(
        data=data, subentry_id=subentry_id, subentry_type="charger", title=title, unique_id=None
    )


def _entry(**options: Any) -> MockConfigEntry:
    return entry_with(
        _charger(
            GARAGE,
            "Garage",
            {
                "power": 11.0,
                "switch_entity": "switch.garage",
                "connected_entity": "binary_sensor.garage_car",
                "power_entity": "sensor.garage_power",
            },
        ),
        _charger(
            CARPORT,
            "Carport",
            {"power": 11.0, "switch_entity": "switch.carport", "connected_entity": "binary_sensor.carport_car"},
        ),
        # The charger at the summer house has no plug sensor.
        _charger(
            CABIN,
            "Skur",
            {"power": 11.0, "switch_entity": "switch.cabin", "current_entity": "number.cabin_current", "site": SUMMER},
        ),
        ConfigSubentryDataWithId(
            data={"zone": "zone.sommerhus", "supply_limit": 10, "supply_phases": "3", "supply_reserve": 2},
            subentry_id=SUMMER,
            subentry_type="site",
            title="Sommerhus",
            unique_id=None,
        ),
        vehicle_sub(ELROQ, "Elroq", _car("elroq")),
        vehicle_sub(EPIQ, "Epiq", _car("epiq")),
        options=options,
    )


@pytest.fixture
def presses(hass: HomeAssistant) -> list[str]:
    """The cars that were asked to report."""
    pressed: list[str] = []

    async def press(call: ServiceCall) -> None:
        pressed.append(str(call.data["entity_id"]))

    hass.services.async_register("button", "press", press)
    return pressed


@pytest.fixture
async def home(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> AsyncGenerator[MockConfigEntry]:
    """Two cars that find their charger, away; two chargers at home and one at the summer house, all free."""
    set_prices(hass, now, NIGHT)
    for key in ("elroq", "epiq"):
        _set_car(hass, key)
    for entity in ("binary_sensor.garage_car", "binary_sensor.carport_car"):
        hass.states.async_set(entity, "off")
    for entity in ("switch.garage", "switch.carport", "switch.cabin"):
        hass.states.async_set(entity, "on")
    hass.states.async_set("sensor.garage_power", "0", {"unit_of_measurement": "kW"})
    hass.states.async_set("zone.sommerhus", "0", {"friendly_name": "Sommerhus"})
    hass.states.async_set("number.cabin_current", "16", {"min": 6, "max": 16})

    async def set_value(call: ServiceCall) -> None:
        hass.states.async_set(str(call.data["entity_id"]), str(call.data["value"]), {"min": 6, "max": 16})

    hass.services.async_register("number", "set_value", set_value)
    entry = _entry(notify_services=[PHONE])
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    yield entry
    if entry.state is ConfigEntryState.LOADED:
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


# ----------------------------------------------------------------------
# The choice


def test_the_one_car_that_is_plugged_in_is_the_car() -> None:
    at = dt_util.utcnow()
    cars = [Candidate("a", plugged=True, here=True), Candidate("b", plugged=False, here=True)]
    assert choose(cars, plugged_at=at, drawing=None) == "a"
    # A car that is somewhere else is not it, whatever its plug says.
    assert choose([Candidate("a", plugged=True, here=False)], plugged_at=at, drawing=None) is None
    # Nor one that was plugged in long before the charger got its car.
    early = Candidate("a", plugged=True, here=True, since=at - PAIR_EARLIER - timedelta(minutes=1))
    assert choose([early], plugged_at=at, drawing=None) is None
    assert choose([early], plugged_at=None, drawing=None) == "a"


def test_two_cars_are_told_apart_by_the_chargers_power_or_not_at_all() -> None:
    cars = [
        Candidate("a", plugged=True, here=True, charging=True),
        Candidate("b", plugged=True, here=True, charging=False),
    ]
    assert choose(cars, plugged_at=None, drawing=None) is None
    assert choose(cars, plugged_at=None, drawing=True) == "a"
    assert choose(cars, plugged_at=None, drawing=False) == "b"
    both = [Candidate("a", plugged=True, charging=True), Candidate("b", plugged=True, charging=True)]
    assert choose(both, plugged_at=None, drawing=True) is None


def test_a_car_without_a_plug_sensor_is_the_car_when_it_is_the_only_one_here() -> None:
    assert choose([Candidate("a", here=True), Candidate("b", here=False)], plugged_at=None, drawing=None) == "a"
    assert choose([Candidate("a", here=True), Candidate("b", here=True)], plugged_at=None, drawing=None) is None
    # Nothing says where it is: only when the household has no other car it could be.
    assert choose([Candidate("a")], plugged_at=None, drawing=None) is None
    assert choose([Candidate("a", alone=True)], plugged_at=None, drawing=None) == "a"


def test_a_place_is_known_by_its_zone(hass: HomeAssistant) -> None:
    hass.states.async_set("zone.sommerhus", "0", {"friendly_name": "Sommerhus"})
    summer = Site("s", "Sommerhus", {"zone": "zone.sommerhus"})
    home_site = Site("home", "")
    assert place_matches(hass, summer, "Sommerhus") is True
    assert place_matches(hass, summer, "home") is False
    assert place_matches(hass, home_site, "home") is True
    assert place_matches(hass, home_site, "Sommerhus") is False
    assert place_matches(hass, home_site, "unknown") is None


# ----------------------------------------------------------------------
# Finding the car


async def test_a_car_that_comes_home_is_found_at_the_charger_it_is_plugged_in_to(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory, presses: list[str]
) -> None:
    household = home.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    assert elroq.charger_id is None

    _set_car(hass, "elroq", place="home", cable=True)
    hass.states.async_set("binary_sensor.carport_car", "on")
    await settle(hass, freezer)
    assert elroq.charger_id == CARPORT
    assert household.chargers[CARPORT].occupant == ELROQ
    assert household.vehicles[EPIQ].charger_id is None
    # The car said who it was: nobody had to be asked.
    assert presses == []
    state = panel_state(hass, household)
    carport = next(c for c in state["chargers"] if c["id"] == CARPORT)
    assert carport["occupant"] == ELROQ and carport["unknown"] is False
    assert next(v for v in state["vehicles"] if v["id"] == ELROQ)["charger"]["id"] == CARPORT

    # Unplugged: the charger is free again, and so is the car.
    hass.states.async_set("binary_sensor.carport_car", "off")
    await settle(hass, freezer)
    assert elroq.charger_id is None
    assert household.chargers[CARPORT].occupant is None


async def test_cars_that_have_not_reported_are_asked_to_and_the_charger_waits(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory, presses: list[str]
) -> None:
    """A car's cloud is slow: the charger sees the plug first. Nothing is taken for a guest."""
    household = home.runtime_data
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    garage = next(c for c in panel_state(hass, household)["chargers"] if c["id"] == GARAGE)
    assert garage["unknown"] is True
    assert garage["occupant"] is None

    await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert sorted(presses) == ["button.elroq_refresh", "button.epiq_refresh"]
    # The Epiq answers: at home and plugged in.
    _set_car(hass, "epiq", place="home", cable=True)
    await settle(hass, freezer)
    assert household.vehicles[EPIQ].charger_id == GARAGE
    assert household.chargers[GARAGE].found_by == "found"
    await move(hass, freezer, dt_util.now() + timedelta(minutes=10))
    # No car is asked again once the car is found.
    assert len(presses) == 2


async def test_the_household_is_asked_when_the_car_cannot_be_told(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory, notify: NotifyCalls, presses: list[str]
) -> None:
    household = home.runtime_data
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    for _minute in range(6):
        await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    asked = [call for call in notify.calls if "Garage" in str(call.get("title"))]
    assert len(asked) == 1
    actions = asked[0]["data"]["actions"]
    assert [action["action"] for action in actions][-1] == f"EVP_PAIR_{GARAGE}_guest"
    # Each car was asked to report twice, and no more.
    assert sorted(presses) == ["button.elroq_refresh"] * 2 + ["button.epiq_refresh"] * 2

    hass.bus.async_fire("mobile_app_notification_action", {"action": f"EVP_PAIR_{GARAGE}_{EPIQ}"})
    await settle(hass, freezer)
    assert household.vehicles[EPIQ].charger_id == GARAGE
    assert household.chargers[GARAGE].found_by == "chosen"
    # What the household said stands, though the car still says it is away.
    await move(hass, freezer, dt_util.now() + timedelta(minutes=3))
    assert household.vehicles[EPIQ].charger_id == GARAGE
    # Until the charger says the car is gone.
    hass.states.async_set("binary_sensor.garage_car", "off")
    await settle(hass, freezer)
    assert household.vehicles[EPIQ].charger_id is None


async def test_a_guest_can_be_the_answer(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory, hass_ws_client: Any
) -> None:
    household = home.runtime_data
    hass.states.async_set("binary_sensor.carport_car", "on")
    await settle(hass, freezer)
    client = await hass_ws_client(hass)
    await client.send_json(
        {"id": 1, "type": "ev_household_planner/charger_occupant", "charger_id": CARPORT, "occupant": "guest"}
    )
    assert (await client.receive_json())["success"]
    assert household.chargers[CARPORT].occupant == "guest"
    assert household.guest.charger_id == CARPORT
    carport = next(c for c in panel_state(hass, household)["chargers"] if c["id"] == CARPORT)
    assert carport["unknown"] is False
    await client.send_json(
        {"id": 2, "type": "ev_household_planner/charger_occupant", "charger_id": CARPORT, "occupant": "nobody"}
    )
    assert not (await client.receive_json())["success"]


async def test_two_cars_at_home_are_told_apart_by_which_charger_gives_power(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = home.runtime_data
    _set_car(hass, "elroq", place="home", cable=True, charging=True)
    _set_car(hass, "epiq", place="home", cable=True)
    await settle(hass, freezer)
    # Both plugged in, no charger has said it has a car: nothing to pair.
    assert household.vehicles[ELROQ].charger_id is None
    hass.states.async_set("sensor.garage_power", "7.2", {"unit_of_measurement": "kW"})
    hass.states.async_set("binary_sensor.garage_car", "on")
    hass.states.async_set("binary_sensor.carport_car", "on")
    await settle(hass, freezer)
    assert household.vehicles[ELROQ].charger_id == GARAGE
    # The other car is then the one at the other charger.
    assert household.vehicles[EPIQ].charger_id == CARPORT


async def test_at_the_summer_house_the_car_is_at_the_charger_there_on_its_own_supply(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = home.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    _set_car(hass, "elroq", place="Sommerhus", cable=True)
    await settle(hass, freezer)
    # Plugged in a moment ago: a charger with a plug sensor could still say it has it.
    assert elroq.charger_id is None
    await move(hass, freezer, dt_util.now() + timedelta(minutes=4))
    assert elroq.charger_id == CABIN
    assert elroq.at_home is True
    assert household.chargers[CABIN].found_by == "only_charger"
    # The summer house's supply plans it, under its own limit; the home's has no car.
    summer = household.supplies[SUMMER]
    assert household.supply_of(elroq) is summer
    assert summer.plan is not None and ELROQ in summer.plan.amps
    shares = summer.plan.amps[ELROQ]
    # 10 A, less the 2 A the summer house is expected to draw.
    assert shares and all(6 <= amps <= 8 for _start, _end, amps in shares)
    assert household.supply.plan is None
    state = panel_state(hass, household)
    assert [(site["name"], site["home"]) for site in state["sites"]] == [("Home", True), ("Sommerhus", False)]
    assert state["sites"][1]["supply"]["limit"] == 10
    assert next(c for c in state["chargers"] if c["id"] == CABIN)["site"] == SUMMER

    # Gone from the summer house: the charger is free.
    _set_car(hass, "elroq", place="not_home", cable=False)
    await settle(hass, freezer)
    assert elroq.charger_id is None
    assert household.chargers[CABIN].occupant is None


async def test_what_was_found_is_kept_over_a_restart(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = home.runtime_data
    _set_car(hass, "elroq", place="home", cable=True)
    hass.states.async_set("binary_sensor.carport_car", "on")
    await settle(hass, freezer)
    assert household.vehicles[ELROQ].charger_id == CARPORT
    await hass.config_entries.async_reload(home.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    assert home.runtime_data.vehicles[ELROQ].charger_id == CARPORT
    assert home.runtime_data.chargers[CARPORT].occupant == ELROQ


# ----------------------------------------------------------------------
# A backup for start and pause


async def test_the_car_pauses_itself_when_the_charger_does_not_answer_and_then_starts_itself(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = home.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    _set_car(hass, "elroq", place="home", cable=True, charging=True)
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    assert elroq.charger_id == GARAGE
    assert household.control_sources(elroq) == [("charger", "switch.garage"), ("car", "switch.elroq_charge")]

    calls: list[tuple[str, bool]] = []

    async def switch(_household: Any, entity_id: str, on: bool) -> str | None:
        calls.append((entity_id, on))
        if entity_id == "switch.garage":
            return "cloud down"
        hass.states.async_set(entity_id, "on" if on else "off")
        return None

    with patch("custom_components.ev_household_planner.household.Household._async_switch", switch):
        hass.states.async_set("switch.garage", "on")
        elroq.decision = Decision(CONTROL_PAUSE, "waiting")
        elroq.last_sent = None
        elroq.retry_after = None
        assert await household._async_apply(elroq, force=False) is True
        assert calls == [("switch.garage", False), ("switch.elroq_charge", False)]
        assert elroq.paused_by == "car"
        assert elroq.control_error is None

        # The one that paused it starts it; the charger never held it, and is left alone.
        calls.clear()
        elroq.decision = Decision(CONTROL_CHARGE, "planned")
        elroq.last_sent = None
        elroq.paused_at = None
        assert await household._async_apply(elroq, force=False) is True
        assert calls == [("switch.elroq_charge", True)]
        assert elroq.paused_by is None


async def test_a_car_whose_charger_is_not_found_yet_uses_its_own_switch_or_waits(
    hass: HomeAssistant, home: MockConfigEntry, switches: SwitchCalls
) -> None:
    household = home.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    # With a backup, the car's own switch is what there is until the charger is found.
    assert household.control_sources(elroq) == [("car", "switch.elroq_charge")]
    elroq.config["control_backup"] = False
    assert household.control_sources(elroq) == []
    elroq.decision = Decision(CONTROL_PAUSE, "waiting")
    elroq.last_sent = None
    assert await household._async_apply(elroq, force=False) is False
    assert elroq.control_error == "finding_charger"


def test_a_start_waits_when_the_next_pause_would_be_one_too_many() -> None:
    vehicle = Vehicle("v", "Car", {})
    at = dt_util.utcnow()
    for index in range(PAUSES_IN_WINDOW):
        assert vehicle.count_command(at + timedelta(minutes=index), stop=True) is True
    assert vehicle.count_command(at + timedelta(minutes=4)) is False
    # A stop always goes out.
    assert vehicle.count_command(at + timedelta(minutes=5), stop=True) is True
    assert vehicle.count_command(at + timedelta(minutes=16)) is True


# ----------------------------------------------------------------------
# Sharing by need


def test_cars_share_an_hour_by_the_kwh_they_lack() -> None:
    now = dt_util.utcnow().replace(minute=0, second=0, microsecond=0)
    slots = [PriceSlot(now + timedelta(hours=i), now + timedelta(hours=i + 1), price) for i, price in enumerate(NIGHT)]
    end = now + timedelta(hours=len(NIGHT))
    cars = [
        SharedCar("big", must_kwh=30, want_kwh=30, max_amps=16, deadline=end),
        SharedCar("small", must_kwh=10, want_kwh=10, max_amps=16, deadline=end),
    ]

    def house(_slot: PriceSlot) -> float:
        return 5.0

    queue = plan_supply(slots, cars, now, limit=23, house=house)
    need = plan_supply(slots, cars, now, limit=23, house=house, share="need")
    assert queue.short_kwh == need.short_kwh == {"big": 0.0, "small": 0.0}
    cheapest = min(slots, key=lambda slot: slot.price).start

    def at(plan: Any, car: str) -> float:
        return next((amps for start, _end, amps in plan.amps[car] if start == cheapest), 0.0)

    # In line, the first car fills the cheapest hour and the other gets nothing of it.
    assert at(queue, "big") == 16 and at(queue, "small") < 6
    # By need, both charge in it: the one that lacks the most gets the most, the other at least 6 A.
    assert at(need, "big") > at(need, "small") >= 6
    assert at(need, "big") + at(need, "small") <= 18 + 1e-6
    for plan in (queue, need):
        for start, _end, limit, expected in plan.capacity:
            used = sum(amps for per in plan.amps.values() for s, _e, amps in per if s == start)
            assert used + expected <= limit + 1e-6


def test_sharing_by_need_never_leaves_a_car_further_from_what_it_must_have() -> None:
    now = dt_util.utcnow().replace(minute=0, second=0, microsecond=0)
    slots = [PriceSlot(now + timedelta(hours=i), now + timedelta(hours=i + 1), 1.0) for i in range(4)]
    cars = [
        # Must be ready after two hours, and needs both of them at full current.
        SharedCar("early", must_kwh=20, want_kwh=20, max_amps=16, deadline=now + timedelta(hours=2)),
        SharedCar("late", must_kwh=40, want_kwh=40, max_amps=16, deadline=now + timedelta(hours=4)),
    ]
    queue = plan_supply(slots, cars, now, limit=16, house=lambda _slot: 0.0)
    need = plan_supply(slots, cars, now, limit=16, house=lambda _slot: 0.0, share="need")
    assert need.short_kwh["early"] <= queue.short_kwh["early"] + 0.1


# ----------------------------------------------------------------------
# Setting it up


async def test_add_a_place_and_put_a_charger_there(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await hass.config_entries.subentries.async_init(
        (init_integration.entry_id, "site"), context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Sommerhus",
            "zone": "zone.sommerhus",
            "supply": {"supply_limit": 13, "supply_phases": "3", "supply_meter": []},
            "grid": {},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    site = next(
        sub for sub in init_integration.subentries.values() if sub.subentry_type == "site" and not sub.data.get("home")
    )
    assert site.title == "Sommerhus"
    assert site.data["zone"] == "zone.sommerhus" and site.data["supply_limit"] == 13

    # Now a charger asks where it is, and a car can find its charger each time.
    result = await init_integration.start_subentry_reconfigure_flow(hass, "carport_id")
    assert "site" in {str(key) for key in result["data_schema"].schema}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": "Skur", "model": "other", "power": 11, "site": site.subentry_id}
    )
    assert result["type"] is FlowResultType.ABORT
    await hass.async_block_till_done()
    assert init_integration.subentries["carport_id"].data == {"power": 11, "site": site.subentry_id}
    household = init_integration.runtime_data
    assert household.pairing.site_of(household.chargers["carport_id"]).name == "Sommerhus"

    result = await init_integration.start_subentry_reconfigure_flow(hass, "tesla_id")
    user_input = {
        "name": "Tesla",
        "battery_capacity": 60,
        "sensors": {},
        "charging": {"charge_power": 11, "charger": "auto", "control": "charger"},
        "trips": {},
    }
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], user_input)
    # Found each time, and started and paused by the charger: one of the chargers must have a switch.
    assert result["errors"] == {"base": "charger_has_no_switch"}
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {**user_input, "charging": {"charge_power": 11, "charger": "auto", "control": "none"}},
    )
    assert result["type"] is FlowResultType.ABORT
    assert init_integration.subentries["tesla_id"].data["charger"] == "auto"


async def test_a_peblar_charger_fills_itself_in(hass: HomeAssistant) -> None:
    """Peblar's own integration, as on the chargers Peblar builds for OK."""
    entry = MockConfigEntry(domain="peblar")
    entry.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={("peblar", "1")}, manufacturer="Peblar", model="Home"
    )
    registry = er.async_get(hass)

    def add(domain: str, key: str, **kwargs: Any) -> str:
        return registry.async_get_or_create(
            domain, "peblar", f"1_{key}", config_entry=entry, device_id=device.id, translation_key=key, **kwargs
        ).entity_id

    charge = add("switch", "charge")
    add("switch", "force_single_phase")
    add("switch", "solar_always_charge")
    limit = add("number", "charge_current_limit", unit_of_measurement="A")
    add("number", "solar_start_threshold", unit_of_measurement="W")
    power = add("sensor", "power_total", original_device_class="power")
    add("sensor", "power_phase_1", original_device_class="power")
    energy = add(
        "sensor", "energy_total", original_device_class="energy", capabilities={"state_class": "total_increasing"}
    )
    add("sensor", "energy_session", original_device_class="energy")
    state = add(
        "sensor",
        "cp_state",
        original_device_class="enum",
        capabilities={"options": ["charging", "error", "fault", "no_ev_connected", "suspended", "invalid"]},
    )
    _name, model = describe_device(hass, device.id)
    assert model is not None and model.key == "peblar_home"
    assert suggest_entities(hass, device.id, model) == {
        "switch_entity": charge,
        "current_entity": limit,
        "power_entity": power,
        "energy_entity": energy,
        "connected_entity": state,
        "unplugged_states": ["no_ev_connected"],
    }


async def test_ask_after_is_longer_for_cars_that_cannot_be_asked(
    hass: HomeAssistant, home: MockConfigEntry, freezer: FrozenDateTimeFactory, notify: NotifyCalls
) -> None:
    household = home.runtime_data
    for vehicle in household.vehicles.values():
        vehicle.config.pop("refresh_entity")
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    for _minute in range(7):
        await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    assert not [call for call in notify.calls if "Garage" in str(call.get("title"))]
    await move(hass, freezer, dt_util.now() + PAIR_ASK_AFTER_SLOW)
    assert len([call for call in notify.calls if "Garage" in str(call.get("title"))]) == 1


# ----------------------------------------------------------------------
# A car with its own charger


@pytest.fixture
async def fixed(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> AsyncGenerator[MockConfigEntry]:
    """One car that always uses the garage charger, at home, and its cloud has not seen the cable yet."""
    set_prices(hass, now, NIGHT)
    _set_car(hass, "elroq", place="home")
    hass.states.async_set("binary_sensor.garage_car", "off")
    hass.states.async_set("switch.garage", "on")
    hass.states.async_set("sensor.garage_power", "0", {"unit_of_measurement": "kW"})
    hass.states.async_set("sensor.garage_energy", "100.0", {"unit_of_measurement": "kWh"})
    entry = entry_with(
        _charger(
            GARAGE,
            "Garage",
            {
                "power": 11.0,
                "switch_entity": "switch.garage",
                "connected_entity": "binary_sensor.garage_car",
                "power_entity": "sensor.garage_power",
                "energy_entity": "sensor.garage_energy",
            },
        ),
        vehicle_sub(ELROQ, "Elroq", _car("elroq", charger=GARAGE)),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    yield entry
    if entry.state is ConfigEntryState.LOADED:
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_a_car_with_its_own_charger_is_plugged_in_when_the_charger_says_so_and_is_asked_to_report(
    hass: HomeAssistant, fixed: MockConfigEntry, freezer: FrozenDateTimeFactory, presses: list[str]
) -> None:
    household = fixed.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    assert elroq.connected is False
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    # The car's cloud still says no cable: the charger's plug says yes, and it is the car's own charger.
    assert elroq.connected is True
    assert elroq.plugged_by_charger is True
    for _minute in range(9):
        await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    # Asked after one, three and eight minutes, and no more.
    assert presses == ["button.elroq_refresh"] * 3
    kinds = [event["kind"] for event in household.events.items]
    assert "charger_plugged_in" in kinds and "asked_car" in kinds
    # The car answers: from now on its own cable sensor counts.
    _set_car(hass, "elroq", place="home", cable=True)
    await settle(hass, freezer)
    assert elroq.connected is True and elroq.plugged_by_charger is False


async def test_a_car_that_still_says_plugged_in_after_the_charger_is_unplugged_is_asked_to_report(
    hass: HomeAssistant, fixed: MockConfigEntry, freezer: FrozenDateTimeFactory, presses: list[str]
) -> None:
    household = fixed.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    _set_car(hass, "elroq", place="home", cable=True)
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    assert elroq.connected is True
    presses.clear()
    # The plug comes out at the charger; the car's cloud still says the cable is in.
    hass.states.async_set("binary_sensor.garage_car", "off")
    await settle(hass, freezer)
    for _minute in range(4):
        await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    # Asked after half a minute and after two, and no more.
    assert presses == ["button.elroq_refresh"] * 2
    assert any(event.get("why") == "unplugged" for event in household.events.items)


async def test_the_chargers_meter_counts_its_own_cars_charge(
    hass: HomeAssistant, fixed: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    household = fixed.runtime_data
    elroq: Vehicle = household.vehicles[ELROQ]
    _set_car(hass, "elroq", place="home", cable=True, charging=True)
    hass.states.async_set("binary_sensor.garage_car", "on")
    await settle(hass, freezer)
    for minute in range(1, 6):
        hass.states.async_set("sensor.garage_energy", str(100.0 + 0.18 * minute), {"unit_of_measurement": "kWh"})
        await move(hass, freezer, dt_util.now() + timedelta(minutes=1))
    session = elroq.session
    assert session is not None
    assert session.sources.get("meter", 0) > 0
    # Counted by the meter, not by the charging power (11 kW would be 0.18 kWh a minute too, but labelled power).
    assert session.energy == pytest.approx(0.18 * 4, abs=0.2)
