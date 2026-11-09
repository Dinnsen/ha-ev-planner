"""Two cars behind one fuse, minute by minute, with a house that draws what it draws.

With an Equalizer, the fuse is guarded the way an Easee Equalizer does it:
what the house leaves is shared evenly between the cars that ask for
current, never under 6 A. Without one, the cars take what they are set to,
and only EV Planner's guard turns them down when the house needs more.
A car with a current setting gets its amps from EV Planner, through a number
or through Easee's own action (with the cloud's delay); the others can only
be switched on and off. The meter on the house reads the house and the cars,
and can drop out for a while.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from unittest.mock import patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from .model import MINUTE, Result
from .nights import ZONE, day_prices, wall_time
from .runner import DOMAIN, PRICE, version

KW_PER_A = 3 * 230 / 1000
METER = "sensor.sim_house_current"


@dataclass(slots=True)
class SupplyCar:
    key: str  # "a" or "b"
    soc: float
    target: float
    must: float = 0.0
    capacity: float = 60.0
    max_amps: float = 16.0
    efficiency: float = 0.9
    adjustable: bool = False
    priority: str = "normal"
    easee: bool = False  # the current goes through Easee's own action, not a number

    @property
    def entities(self) -> dict[str, str]:
        k = self.key
        return {
            "soc": f"sensor.car_{k}_battery",
            "limit": f"number.car_{k}_limit",
            "cable": f"binary_sensor.car_{k}_cable",
            "charging": f"binary_sensor.car_{k}_charging",
            "power": f"sensor.car_{k}_power",
            "switch": f"switch.car_{k}_charge",
            "amps": f"input_number.car_{k}_amps",
            "easee": f"sensor.easee_{k}_dynamic_charger_limit",
        }


@dataclass(slots=True)
class SupplyNight:
    name: str
    day: date
    cars: list[SupplyCar]
    fuse: float  # what the Equalizer guards
    limit: float  # what EV Planner is told to stay under
    house: Callable[[datetime], float]  # amps on the busiest phase, by local time
    meter: bool = True
    ready_by: str = "07:00"
    plug_in: str = "18:00"
    price: Callable[[datetime], float] | None = None
    tags: list[str] = field(default_factory=list)
    equalizer: bool = True  # False: nothing but EV Planner keeps the cars under the fuse
    guard: bool = False
    latency: int = 0  # minutes before a new current reaches the car (Easee's cloud)
    meter_gaps: list[tuple[str, str]] = field(default_factory=list)  # local times the meter is unavailable

    def meter_lost(self, local: datetime) -> bool:
        now = local.strftime("%H:%M")
        return any((a <= now < b) if a <= b else (now >= a or now < b) for a, b in self.meter_gaps)

    def at(self, day: date, hhmm: str) -> datetime:
        return wall_time(day, time.fromisoformat(hhmm), ZONE).astimezone(UTC)


def _entry(night: SupplyNight) -> MockConfigEntry:
    subentries = []
    for car in night.cars:
        e = car.entities
        charger = f"charger_{car.key}"
        subentries.append(
            ConfigSubentryDataWithId(
                data={"power": 11.0},
                subentry_id=charger,
                subentry_type="charger",
                title=f"Charger {car.key}",
                unique_id=None,
            )
        )
        data: dict[str, Any] = {
            "battery_capacity": car.capacity,
            "charge_power": car.max_amps * KW_PER_A,
            "soc_entity": e["soc"],
            "target_entity": e["limit"],
            "connected_entity": e["cable"],
            "charging_entity": e["charging"],
            "power_entity": e["power"],
            "control": "car",
            "control_entity": e["switch"],
            "charger": charger,
        }
        if car.adjustable:
            data["current_entity"] = e["easee"] if car.easee else e["amps"]
        subentries.append(
            ConfigSubentryDataWithId(
                data=data, subentry_id=f"car_{car.key}", subentry_type="vehicle", title=f"Car {car.key}", unique_id=None
            )
        )
    options: dict[str, Any] = {
        "currency": "DKK",
        "notify_services": [],
        "supply_limit": night.limit,
        "supply_phases": "3",
        "supply_reserve": 6,
        "supply_guard": night.guard,
    }
    if night.meter:
        options["supply_meter"] = [METER]
    return MockConfigEntry(
        domain=DOMAIN,
        title="EV Planner",
        unique_id=DOMAIN,
        data={"price_entity": PRICE, "country": "Denmark", "motorapi_api_key": "", "plate_provider": "motorapi_dk"},
        options=options,
        subentries_data=subentries,
        version=1,
        minor_version=1,
    )


def share(requests: list[float], avail: float) -> list[float]:
    """The Equalizer: evenly, cars that want less get what they want, nobody under 6 A."""
    got = [0.0] * len(requests)
    active = [i for i, r in enumerate(requests) if r >= 6]
    while active:
        each = avail / len(active)
        if each < 6:
            active = active[:-1]
            continue
        small = [i for i in active if requests[i] <= each]
        if not small:
            for i in active:
                got[i] = each
            break
        for i in small:
            got[i] = requests[i]
            avail -= requests[i]
        active = [i for i in active if i not in small]
    return got


@dataclass(slots=True)
class SupplyResult:
    result: Result
    ready: dict[str, bool]
    soc_at_deadline: dict[str, float]
    over_limit: int  # slots EV Planner planned above its limit
    current_changes: dict[str, int]
    over_fuse: int = 0  # minutes the house and the cars drew more than the fuse
    longest_over: int = 0  # the longest of those stretches, in minutes
    peak_over: float = 0.0  # amps above the fuse at worst
    most_per_hour: dict[str, int] = field(default_factory=dict)  # current changes in the busiest hour
    blind: int = 0  # minutes over the fuse while the meter was out


async def run_supply_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: SupplyNight) -> SupplyResult:
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    start = night.at(night.day, night.plug_in) - timedelta(minutes=30)
    deadline = night.at(night.day + timedelta(days=1), night.ready_by)
    end = deadline + timedelta(minutes=30)
    prices = day_prices(night.day, 2, price=night.price)
    socs = {car.key: car.soc for car in night.cars}
    switch_on = {car.key: False for car in night.cars}
    amps_set = {car.key: car.max_amps for car in night.cars}
    commands: list[tuple[datetime, str]] = []
    current_changes = {car.key: 0 for car in night.cars}
    change_times: dict[str, list[datetime]] = {car.key: [] for car in night.cars}
    pending: list[tuple[datetime, str, float]] = []  # (reaches the car at, car, amps)
    clock = {"now": start}

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

    async def switch(_household: Any, entity_id: str, on: bool) -> str | None:
        for car in night.cars:
            if entity_id == car.entities["switch"]:
                switch_on[car.key] = on
                commands.append((clock["now"], car.key))
                hass.states.async_set(entity_id, "on" if on else "off")
        return None

    def new_current(car: SupplyCar, amps: float, entity: str, attributes: dict[str, Any]) -> None:
        current_changes[car.key] += 1
        change_times[car.key].append(clock["now"])
        if night.latency:
            pending.append((clock["now"] + timedelta(minutes=night.latency), car.key, amps))
        else:
            amps_set[car.key] = amps
        hass.states.async_set(entity, str(amps), attributes)

    async def set_amps(call: ServiceCall) -> None:
        for car in night.cars:
            if call.data["entity_id"] == car.entities["amps"]:
                new_current(car, float(call.data["value"]), car.entities["amps"], {"min": 6, "max": car.max_amps})

    devices: dict[str, SupplyCar] = {}

    async def set_easee(call: ServiceCall) -> None:
        car = devices[call.data["device_id"]]
        assert 0 <= call.data["current"] <= 32 and 0 <= call.data["time_to_live"] <= 1080
        new_current(car, float(call.data["current"]), car.entities["easee"], {"unit_of_measurement": "A"})

    hass.services.async_register("input_number", "set_value", set_amps)
    hass.services.async_register("easee", "set_charger_dynamic_limit", set_easee)
    if any(car.easee for car in night.cars):
        easee_entry = MockConfigEntry(domain="easee")
        easee_entry.add_to_hass(hass)
        for car in night.cars:
            if car.easee:
                device = dr.async_get(hass).async_get_or_create(
                    config_entry_id=easee_entry.entry_id, identifiers={("easee", f"EH{car.key}")}
                )
                er.async_get(hass).async_get_or_create(
                    "sensor",
                    "easee",
                    f"EH{car.key}_dynamic_charger_limit",
                    device_id=device.id,
                    config_entry=easee_entry,
                    suggested_object_id=f"easee_{car.key}_dynamic_charger_limit",
                )
                devices[device.id] = car
    got = {car.key: 0.0 for car in night.cars}

    def publish(moment: datetime) -> None:
        plugged = night.at(night.day, night.plug_in) <= moment
        for car in night.cars:
            e = car.entities
            hass.states.async_set(
                e["soc"], str(int(socs[car.key])), {"unit_of_measurement": "%", "device_class": "battery"}
            )
            hass.states.async_set(e["limit"], str(int(car.target)))
            hass.states.async_set(e["cable"], "on" if plugged else "off")
            hass.states.async_set(e["charging"], "on" if got[car.key] > 0 else "off")
            hass.states.async_set(e["power"], str(round(got[car.key] * KW_PER_A, 2)), {"unit_of_measurement": "kW"})
            if car.adjustable and hass.states.get(e["amps"]) is None:
                hass.states.async_set(e["amps"], str(car.max_amps), {"min": 6, "max": car.max_amps})
        local = moment.astimezone(ZONE)
        house = night.house(local)
        if night.meter_lost(local):
            hass.states.async_set(METER, "unavailable")
        else:
            hass.states.async_set(METER, str(round(house + sum(got.values()), 1)), {"unit_of_measurement": "A"})

    async def tick(moment: datetime) -> None:
        freezer.move_to(moment)
        async_fire_time_changed(hass, moment)
        await hass.async_block_till_done()

    freezer.move_to(start)
    publish_prices(start)
    publish(start)
    entry = _entry(night)
    entry.add_to_hass(hass)
    over = 0
    over_fuse = longest = run_over = blind = 0
    peak = 0.0
    at_deadline: dict[str, float] = {}
    cost = energy = 0.0
    with patch(f"custom_components.{DOMAIN}.household.Household._async_switch", switch):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        household = entry.runtime_data
        for car in night.cars:
            settings: dict[str, Any] = {"ready_by": night.ready_by, "use_ready_by": True}
            if car.must:
                settings["must_soc"] = car.must
            if car.priority != "normal":
                settings["priority"] = car.priority
            await household.async_set_vehicle(f"car_{car.key}", settings)
        moment = start
        while moment < end:
            clock["now"] = moment
            for item in [p for p in pending if p[0] <= moment]:
                amps_set[item[1]] = item[2]
                pending.remove(item)
            house = night.house(moment.astimezone(ZONE))
            requests = [
                (amps_set[c.key] if c.adjustable else c.max_amps)
                if switch_on[c.key] and moment >= night.at(night.day, night.plug_in) and socs[c.key] < c.target
                else 0.0
                for c in night.cars
            ]
            given = share(requests, max(0.0, night.fuse - house)) if night.equalizer else requests
            above = house + sum(given) - night.fuse
            if above > 0.5 and night.meter_lost(moment.astimezone(ZONE)):
                blind += 1  # nobody can see it: the cars are at the least they can take
                run_over = 0
            elif above > 0.5:
                over_fuse += 1
                run_over += 1
                longest = max(longest, run_over)
                peak = max(peak, above)
            else:
                run_over = 0
            for car, amps in zip(night.cars, given, strict=True):
                got[car.key] = amps
                wall = amps * KW_PER_A / 60
                socs[car.key] = min(car.target, socs[car.key] + wall * car.efficiency / car.capacity * 100)
                price = next((p for s, p in prices if s <= moment < s + timedelta(hours=1)), 0.0)
                cost += wall * price
                energy += wall
            moment += MINUTE
            if moment == deadline:
                at_deadline = dict(socs)
            publish_prices(moment)
            publish(moment)
            await tick(moment)
            await tick(moment + timedelta(seconds=3))
            plan = getattr(getattr(household, "supply", None), "plan", None)
            if plan is not None:
                for s, _e, limit, expected in plan.capacity:
                    used = sum(a for per in plan.amps.values() for st, _en, a in per if st == s)
                    if used + expected > limit + 1e-6:
                        over += 1
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()

    ready = {car.key: at_deadline.get(car.key, socs[car.key]) >= car.target - 0.5 for car in night.cars}
    result = Result(name=night.name, version=version(), tags=["supply", *night.tags], private=False)
    result.energy, result.cost = energy, cost
    result.commands = len(commands)
    result.on_time = all(ready.values())
    result.feasible = True
    result.goal = None
    busiest = {
        key: max((sum(1 for t in times if a <= t < a + timedelta(hours=1)) for a in times), default=0)
        for key, times in change_times.items()
    }
    return SupplyResult(
        result, ready, at_deadline, over, current_changes, over_fuse, longest, round(peak, 1), busiest, blind
    )


# ----------------------------------------------------------------------
# The nights


def _flat(amps: float) -> Callable[[datetime], float]:
    return lambda local: amps


def _heat_pump(base: float, extra: float) -> Callable[[datetime], float]:
    """A house with a heat pump on a price plan: it runs in the cheap night hours."""
    return lambda local: base + (extra if local.hour in (1, 2, 3, 4) else 0.0)


def _spiky(base: float) -> Callable[[datetime], float]:
    """A house with a washing machine, a dryer, a kettle and a water heater during the night."""
    spikes = [
        ((1, 10), 20, 11.0),  # washing machine heating
        ((2, 40), 40, 9.0),  # dryer
        ((3, 30), 3, 9.0),  # kettle
        ((4, 15), 30, 8.0),  # water heater
        ((23, 5), 4, 9.0),  # kettle
    ]

    def house(local: datetime) -> float:
        minute = local.hour * 60 + local.minute
        extra = sum(amps for (h, m), length, amps in spikes if h * 60 + m <= minute < h * 60 + m + length)
        return base + extra

    return house


def supply_nights() -> list[SupplyNight]:
    monday = date(2026, 11, 16)
    return [
        SupplyNight(
            "supply-room-for-both",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 30, 80)],
            fuse=35,
            limit=32,
            house=_flat(6),
        ),
        SupplyNight(
            "supply-heat-pump-at-night",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 25, 80)],
            fuse=25,
            limit=23,
            house=_heat_pump(5, 9),
            tags=["heat-pump"],
        ),
        SupplyNight(
            "supply-not-enough-first-car-first",
            monday,
            [SupplyCar("a", 10, 100, adjustable=True, priority="first"), SupplyCar("b", 10, 90, must=40)],
            fuse=25,
            limit=23,
            house=_flat(9),
            plug_in="22:00",
            ready_by="06:00",
            tags=["shortage"],
        ),
        # No Equalizer: the guard is all that turns the cars down when the house needs more.
        SupplyNight(
            "guard-spikes",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 25, 80, adjustable=True, priority="first")],
            fuse=25,
            limit=23,
            house=_spiky(4),
            plug_in="22:00",
            equalizer=False,
            guard=True,
            tags=["guard"],
        ),
        SupplyNight(
            "guard-spikes-easee-delay",
            monday,
            [
                SupplyCar("a", 20, 80, adjustable=True, easee=True),
                SupplyCar("b", 25, 80, adjustable=True, easee=True, priority="first"),
            ],
            fuse=25,
            limit=23,
            house=_spiky(4),
            plug_in="22:00",
            equalizer=False,
            guard=True,
            latency=1,
            tags=["guard", "easee"],
        ),
        SupplyNight(
            "guard-meter-drops-out",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 25, 80, adjustable=True)],
            fuse=25,
            limit=23,
            house=_spiky(4),
            plug_in="22:00",
            equalizer=False,
            guard=True,
            meter_gaps=[("01:00", "01:40")],
            tags=["guard", "meter-gap"],
        ),
        # The same spiky night without the guard, for comparison: here the fuse is on its own.
        SupplyNight(
            "spikes-without-guard",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 25, 80, adjustable=True, priority="first")],
            fuse=25,
            limit=23,
            house=_spiky(4),
            plug_in="22:00",
            equalizer=False,
            tags=["no-guard"],
        ),
    ]
