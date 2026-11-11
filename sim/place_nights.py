"""Two cars that find their charger, at home and at the summer house, minute by minute.

The home has a garage (its charger says when a car is plugged in, and what
power it gives) and a carport (says when a car is plugged in). The summer
house has one charger with a current setting and no plug sensor, behind a
small fuse of its own. A car charges when its charger's switch and its own
are on, at the current its charger is set to. A switch can be out of reach
for the night (the charger's cloud is down): then it stays as it was, and
only the other one can start and pause the car.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from unittest.mock import patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from .model import MINUTE, Result
from .nights import ZONE, day_prices, wall_time
from .runner import DOMAIN, PRICE, version

KW_PER_A = 3 * 230 / 1000
SUMMER = "summer_id"
SUMMER_NAME = "Sommerhus"
SUMMER_LIMIT = 10.0
SUMMER_HOUSE = 2.0  # what the summer house draws by itself, in amps
CABIN_CURRENT = (
    "input_number.cabin_current"  # not a number: EV Planner has numbers of its own, and theirs is the real service
)
CAPACITY = 60.0
EFFICIENCY = 0.9
TARGET = 80.0

# Each charger: where it is, and what it can tell.
CHARGERS: dict[str, dict[str, Any]] = {
    "garage": {"place": "home", "plug": "binary_sensor.garage_car", "power": "sensor.garage_power"},
    "carport": {"place": "home", "plug": "binary_sensor.carport_car"},
    "cabin": {"place": SUMMER_NAME, "current": CABIN_CURRENT},
}


@dataclass(slots=True)
class Arrival:
    car: str  # "elroq" or "epiq"
    charger: str  # the charger it is plugged in to
    at: str = "18:00"
    soc: float = 30.0


@dataclass(slots=True)
class PlaceNight:
    name: str
    day: date
    arrivals: list[Arrival]
    ready_by: str = "07:00"
    down: list[str] = field(default_factory=list)  # switches that do not answer this night
    backup: bool = True  # the car's own switch steps in for the charger's
    tags: list[str] = field(default_factory=list)

    def at(self, day: date, hhmm: str) -> datetime:
        return wall_time(day, time.fromisoformat(hhmm), ZONE).astimezone(UTC)


@dataclass(slots=True)
class PlaceResult:
    result: Result
    ready: dict[str, bool]
    soc_at_deadline: dict[str, float]
    found: dict[str, str | None]  # the charger each car was found at
    found_after: dict[str, int | None]  # minutes from the plug went in
    over_summer: int  # minutes the summer house drew more than its fuse, after the car was found
    unplanned: dict[str, int]  # minutes a car charged while EV Planner wanted it paused, after it was found
    refused: int  # commands a switch did not answer
    summer_planned: bool  # the car at the summer house was planned on that place's supply
    over_how: dict[str, int] = field(default_factory=dict)  # what EV Planner wanted in those minutes


def _entry(night: PlaceNight) -> MockConfigEntry:
    def charger(key: str, title: str, data: dict[str, Any]) -> ConfigSubentryDataWithId:
        return ConfigSubentryDataWithId(
            data={"power": 11.0, "switch_entity": f"switch.{key}", **data},
            subentry_id=f"{key}_id",
            subentry_type="charger",
            title=title,
            unique_id=None,
        )

    def car(key: str) -> ConfigSubentryDataWithId:
        return ConfigSubentryDataWithId(
            data={
                "battery_capacity": CAPACITY,
                "charge_power": 16 * KW_PER_A,
                "soc_entity": f"sensor.{key}_battery",
                "connected_entity": f"binary_sensor.{key}_cable",
                "charging_entity": f"binary_sensor.{key}_charging",
                "home_entity": f"device_tracker.{key}",
                "charger": "auto",
                "control": "charger",
                "control_entity": f"switch.{key}_charge",
                "control_backup": night.backup,
            },
            subentry_id=f"{key}_id",
            subentry_type="vehicle",
            title=key.title(),
            unique_id=None,
        )

    return MockConfigEntry(
        domain=DOMAIN,
        title="EV Planner",
        unique_id=DOMAIN,
        data={"price_entity": PRICE, "country": "Denmark", "motorapi_api_key": "", "plate_provider": "motorapi_dk"},
        options={"currency": "DKK", "notify_services": []},
        subentries_data=[
            charger(
                "garage",
                "Garage",
                {"connected_entity": CHARGERS["garage"]["plug"], "power_entity": CHARGERS["garage"]["power"]},
            ),
            charger("carport", "Carport", {"connected_entity": CHARGERS["carport"]["plug"]}),
            charger("cabin", "Skur", {"current_entity": CABIN_CURRENT, "site": SUMMER}),
            ConfigSubentryDataWithId(
                data={
                    "zone": "zone.sommerhus",
                    "supply_limit": SUMMER_LIMIT,
                    "supply_phases": "3",
                    "supply_reserve": SUMMER_HOUSE,
                },
                subentry_id=SUMMER,
                subentry_type="site",
                title=SUMMER_NAME,
                unique_id=None,
            ),
            *(car(key) for key in ("elroq", "epiq")),
        ],
        version=1,
        minor_version=1,
    )


async def run_place_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: PlaceNight) -> PlaceResult:
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    arrive = {a.car: night.at(night.day, a.at) for a in night.arrivals}
    start = min(arrive.values()) - timedelta(minutes=30)
    deadline = night.at(night.day + timedelta(days=1), night.ready_by)
    end = deadline + timedelta(minutes=30)
    prices = day_prices(night.day, 2)
    cars = ("elroq", "epiq")
    here = {a.car: a for a in night.arrivals}
    socs = {key: here[key].soc if key in here else 60.0 for key in cars}
    # Every switch is on, as a charger and a car are when nobody has touched them.
    on = {f"switch.{key}": True for key in CHARGERS} | {f"switch.{key}_charge": True for key in cars}
    cabin_amps = {"now": 16.0}
    got = dict.fromkeys(cars, 0.0)
    commands = refused = 0

    def publish_prices(moment: datetime) -> None:
        local = moment.astimezone(ZONE)
        today = [(s, p) for s, p in prices if s.astimezone(ZONE).date() == local.date()]
        tomorrow = [(s, p) for s, p in prices if s.astimezone(ZONE).date() == local.date() + timedelta(days=1)]
        current = next((p for s, p in today if s <= moment < s + timedelta(hours=1)), None)
        hass.states.async_set(
            PRICE,
            "unknown" if current is None else str(current),
            {
                "raw_today": [{"hour": s.isoformat(), "price": p} for s, p in today],
                "raw_tomorrow": [{"hour": s.isoformat(), "price": p} for s, p in tomorrow] if local.hour >= 13 else [],
            },
        )

    def plugged(key: str, moment: datetime) -> bool:
        return key in here and arrive[key] <= moment

    def publish(moment: datetime) -> None:
        for key in cars:
            there = plugged(key, moment)
            hass.states.async_set(
                f"sensor.{key}_battery", str(int(socs[key])), {"unit_of_measurement": "%", "device_class": "battery"}
            )
            hass.states.async_set(f"binary_sensor.{key}_cable", "on" if there else "off")
            hass.states.async_set(f"binary_sensor.{key}_charging", "on" if got[key] > 0 else "off")
            hass.states.async_set(
                f"device_tracker.{key}", CHARGERS[here[key].charger]["place"] if there else "not_home"
            )
        for name, charger in CHARGERS.items():
            holder = next((a.car for a in night.arrivals if a.charger == name and plugged(a.car, moment)), None)
            if "plug" in charger:
                hass.states.async_set(charger["plug"], "on" if holder else "off")
            if "power" in charger:
                hass.states.async_set(
                    charger["power"],
                    str(round((got[holder] if holder else 0.0) * KW_PER_A, 2)),
                    {"unit_of_measurement": "kW"},
                )
        for entity, state in on.items():
            hass.states.async_set(entity, "on" if state else "off")
        hass.states.async_set(CABIN_CURRENT, str(cabin_amps["now"]), {"min": 6, "max": 16})

    async def switch(_household: Any, entity_id: str, state: bool) -> str | None:
        nonlocal commands, refused
        commands += 1
        if entity_id in night.down:
            refused += 1
            return "cloud down"
        if entity_id in on:
            on[entity_id] = state
            hass.states.async_set(entity_id, "on" if state else "off")
        return None

    async def set_value(call: ServiceCall) -> None:
        if call.data["entity_id"] == CABIN_CURRENT:
            cabin_amps["now"] = float(call.data["value"])
            hass.states.async_set(CABIN_CURRENT, str(cabin_amps["now"]), {"min": 6, "max": 16})

    async def tick(moment: datetime) -> None:
        freezer.move_to(moment)
        async_fire_time_changed(hass, moment)
        await hass.async_block_till_done()

    hass.services.async_register("input_number", "set_value", set_value)
    hass.states.async_set("zone.sommerhus", "0", {"friendly_name": SUMMER_NAME})
    freezer.move_to(start)
    publish_prices(start)
    publish(start)
    entry = _entry(night)
    entry.add_to_hass(hass)
    found: dict[str, str | None] = {a.car: None for a in night.arrivals}
    found_after: dict[str, int | None] = {a.car: None for a in night.arrivals}
    unplanned = {a.car: 0 for a in night.arrivals}
    at_deadline: dict[str, float] = {}
    over_summer = 0
    over_how: dict[str, int] = {}
    summer_planned = False
    cost = energy = 0.0
    with patch(f"custom_components.{DOMAIN}.household.Household._async_switch", switch):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        household = entry.runtime_data
        for key in cars:
            await household.async_set_vehicle(f"{key}_id", {"ready_by": night.ready_by, "use_ready_by": True})
        moment = start
        while moment < end:
            summer_amps = SUMMER_HOUSE
            for a in night.arrivals:
                key = a.car
                vehicle = household.vehicles[f"{key}_id"]
                charging = (
                    plugged(key, moment)
                    and on[f"switch.{a.charger}"]
                    and on[f"switch.{key}_charge"]
                    and socs[key] < TARGET
                )
                amps = (cabin_amps["now"] if a.charger == "cabin" else 16.0) if charging else 0.0
                got[key] = amps
                wall = amps * KW_PER_A / 60
                socs[key] = min(TARGET, socs[key] + wall * EFFICIENCY / CAPACITY * 100)
                price = next((p for s, p in prices if s <= moment < s + timedelta(hours=1)), 0.0)
                cost += wall * price
                energy += wall
                if a.charger == "cabin":
                    summer_amps += amps
                if found_after[key] is None and plugged(key, moment) and vehicle.charger_id is not None:
                    found[key] = str(vehicle.charger_id).removesuffix("_id")
                    found_after[key] = round((moment - arrive[key]).total_seconds() / 60)
                # A few minutes for the first command to reach the car after it was found.
                settled = found_after[key] is not None and moment >= arrive[key] + timedelta(
                    minutes=found_after[key] + 3
                )
                if settled and moment < deadline:
                    decision = getattr(vehicle, "decision", None)
                    if amps > 0 and decision is not None and decision.control == "pause":
                        unplanned[key] += 1
                    if a.charger == "cabin" and summer_amps > SUMMER_LIMIT + 0.5:
                        over_summer += 1
                        summer = household.supplies.get(SUMMER)
                        share = summer.plan.amps_at(vehicle.vehicle_id, moment) if summer and summer.plan else None
                        what = f"{decision.control if decision else None}/{decision.reason if decision else None}, share {share}, set to {cabin_amps['now']}"
                        over_how[what] = over_how.get(what, 0) + 1
            moment += MINUTE
            if moment == deadline:
                at_deadline = dict(socs)
            publish_prices(moment)
            publish(moment)
            await tick(moment)
            await tick(moment + timedelta(seconds=3))
            summer = household.supplies.get(SUMMER)
            if (
                summer is not None
                and summer.plan is not None
                and any(f"{a.car}_id" in summer.plan.amps for a in night.arrivals if a.charger == "cabin")
            ):
                summer_planned = True
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()

    ready = {a.car: at_deadline.get(a.car, socs[a.car]) >= TARGET - 0.5 for a in night.arrivals}
    result = Result(name=night.name, version=version(), tags=["places", *night.tags], private=False)
    result.energy, result.cost = energy, cost
    result.commands = commands
    result.on_time = all(ready.values())
    result.feasible = True
    result.goal = None
    return PlaceResult(
        result,
        ready,
        {a.car: at_deadline.get(a.car, socs[a.car]) for a in night.arrivals},
        found,
        found_after,
        over_summer,
        unplanned,
        refused,
        summer_planned,
        over_how,
    )


# ----------------------------------------------------------------------
# The nights


def place_nights() -> list[PlaceNight]:
    monday = date(2026, 11, 16)
    return [
        # One car in the garage at home, the other at the summer house on its small fuse.
        PlaceNight(
            "places-home-and-summer-house",
            monday,
            [Arrival("epiq", "garage"), Arrival("elroq", "cabin", soc=35)],
            tags=["two-places"],
        ),
        # Both at home, one after the other: each is found at the charger it took.
        PlaceNight(
            "places-two-chargers-at-home",
            monday,
            [Arrival("elroq", "carport", "17:40"), Arrival("epiq", "garage", "18:20", 45)],
        ),
        # The cars have swapped chargers since last time.
        PlaceNight(
            "places-swapped-chargers",
            monday,
            [Arrival("epiq", "carport", "17:10", 50), Arrival("elroq", "garage", "19:05")],
        ),
        # A long way to the summer house: the car comes with little left, and has the small fuse to fill it on.
        PlaceNight(
            "places-summer-house-low-battery", monday, [Arrival("epiq", "cabin", "16:30", 15)], tags=["two-places"]
        ),
        # The garage's cloud is down all night: the car's own switch pauses and starts it.
        PlaceNight(
            "places-charger-does-not-answer",
            monday,
            [Arrival("epiq", "garage")],
            down=["switch.garage"],
            tags=["backup"],
        ),
        # The car's cloud is down, and the charger is what there is.
        PlaceNight(
            "places-car-does-not-answer",
            monday,
            [Arrival("elroq", "carport")],
            down=["switch.elroq_charge"],
            tags=["backup"],
        ),
        # At the summer house the charger does not answer: the car sees to it, on the summer house's supply all the same.
        PlaceNight(
            "places-summer-charger-does-not-answer",
            monday,
            [Arrival("elroq", "cabin", "19:00", 40)],
            down=["switch.cabin"],
            tags=["backup", "two-places"],
        ),
    ]
