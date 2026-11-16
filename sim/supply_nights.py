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
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from .model import Result
from .nights import ZONE, day_prices, wall_time
from .runner import DOMAIN, PRICE, version

KW_PER_A = 3 * 230 / 1000
METER = "sensor.sim_house_current"
WEATHER = "weather.sim"
HEAT_PUMP_POWER = "sensor.sim_heat_pump_power"
HEAT_PUMP_BLOCK = "switch.sim_heat_pump_block"


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
    mode: str | None = None  # "charge_now": charged at once, outside any plan
    known: bool = True  # False: a car EV Planner does not know charges at the charger (it only sees the charger)

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
            "meter": f"sensor.charger_{k}_power",
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
    meter_frozen: list[tuple[str, str]] = field(default_factory=list)  # ... or stuck on its last value
    temperature: Callable[[datetime], float] | None = None  # outside, in °C, by local time
    weather: bool = False  # EV Planner is given a weather entity with the forecast
    history: dict[str, Any] | None = None  # the house forecast EV Planner has learned before the night
    heat_pump: Callable[[datetime], float] | None = None  # the heat pump's amps per phase (on top of ``house``)
    heat_pump_meter: bool = False  # EV Planner is given the heat pump's power
    block: bool = False  # EV Planner may hold the heat pump back
    share: str = "queue"  # how the cars share an hour there is not room for all of them in: "queue" or "need"
    step: int = 60  # seconds between two looks at the house (the guard acts on each reading)
    until: str | None = None  # the night ends at this local time on its first day (not after the ready-by time)
    zaptec: bool = False  # the chargers are Zaptecs: their current may go up only every 15 minutes
    echo: int = 0  # seconds a charger's cloud shows the current it had before a change
    charger_meter: bool = False  # each charger has a meter of its own (a Shelly), read every few seconds
    charging_lag: int = 0  # seconds before a car's cloud says it charges (and what it draws)
    user_sets: list[tuple[str, str, float]] = field(default_factory=list)  # (local time, car, amps) set in the app
    expect_back: list[tuple[str, str, float]] = field(default_factory=list)  # (by local time, car, amps) set again
    wait: int | None = None  # minutes the place waits after a peak before the cars get more (5-30; 10 if not set)

    def meter_lost(self, local: datetime) -> bool:
        now = local.strftime("%H:%M")
        return any((a <= now < b) if a <= b else (now >= a or now < b) for a, b in self.meter_gaps)

    def frozen(self, local: datetime) -> bool:
        now = local.strftime("%H:%M")
        return any((a <= now < b) if a <= b else (now >= a or now < b) for a, b in self.meter_frozen)

    def at(self, day: date, hhmm: str) -> datetime:
        return wall_time(day, time.fromisoformat(hhmm), ZONE).astimezone(UTC)


def _entry(night: SupplyNight) -> MockConfigEntry:
    subentries = []
    for car in night.cars:
        e = car.entities
        charger = f"charger_{car.key}"
        charger_data: dict[str, Any] = {"power": 11.0}
        if night.charger_meter:
            charger_data["power_entity"] = e["meter"]
        if not car.known:
            # Only the charger is known: its current can be set, and its meter says it charges.
            charger_data["current_entity"] = e["amps"]
        subentries.append(
            ConfigSubentryDataWithId(
                data=charger_data,
                subentry_id=charger,
                subentry_type="charger",
                title=f"Charger {car.key}",
                unique_id=None,
            )
        )
        if not car.known:
            continue
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
    if night.share != "queue":
        options["supply_share"] = night.share
    if night.wait is not None:
        options["supply_wait"] = night.wait
    if night.weather:
        options["weather_entity"] = WEATHER
    if night.heat_pump_meter:
        options["heat_pump_power"] = HEAT_PUMP_POWER
    if night.block:
        options["heat_pump_block"] = HEAT_PUMP_BLOCK
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
    guard_events: int = 0  # times the guard turned a car down or stopped it
    stops: int = 0  # times a car was switched off while it still needed charge
    misses: list[float] = field(default_factory=list)  # each minute: the house's real amps less what the plan expected
    blocks: list[int] = field(default_factory=list)  # each time the heat pump was held back: for how many minutes
    over_at: list[str] = field(
        default_factory=list
    )  # the first minutes over the fuse: the house, the cars and what they were set to
    idle_changes: int = 0  # current changes to a charger while no car charged at it
    not_back: list[str] = field(default_factory=list)  # expect_back that did not come
    fought: list[str] = field(default_factory=list)  # a change in the app that EV Planner undid at once
    log: list[str] = field(default_factory=list)  # every current change, for the report
    left_low: list[str] = field(default_factory=list)  # chargers left under their full current with nothing charging


def _forecast(night: SupplyNight, moment: datetime) -> list[dict[str, Any]]:
    """Hourly forecast from this hour, two days ahead (the weather service's answer)."""
    assert night.temperature is not None
    hour = moment.replace(minute=0, second=0, microsecond=0)
    return [
        {
            "datetime": (hour + timedelta(hours=k)).isoformat(),
            "temperature": round(night.temperature((hour + timedelta(hours=k, minutes=30)).astimezone(ZONE)), 1),
            "condition": "cloudy",
        }
        for k in range(48)
    ]


def _guard_state(household: Any) -> str:
    """What the guard knows, for a minute over the fuse."""
    supply = household.supply
    sent = {k: v[0] for k, v in supply._sent.items()}
    return (
        f"running={supply._guard_running} events={supply.guard_events} reading={supply._meter_reading()}"
        f" paused={sorted(supply._paused)} sent={sent}"
        f" cuts={[round(a, 1) for _t, a in supply._cuts]}"
        f" charging={[v.vehicle_id for v in supply.cars() if household.is_charging(v)]}"
    )


async def run_supply_night(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    night: SupplyNight,
    storage: dict[str, Any] | None = None,
) -> SupplyResult:
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    start = night.at(night.day, night.plug_in) - timedelta(minutes=30)
    deadline = night.at(night.day + timedelta(days=1), night.ready_by)
    end = night.at(night.day, night.until) if night.until else deadline + timedelta(minutes=30)
    step = timedelta(seconds=night.step)
    share_of_minute = night.step / 60
    prices = day_prices(night.day, 2, price=night.price)
    socs = {car.key: car.soc for car in night.cars}
    # A car EV Planner does not know is not switched by it: it charges as soon as it is plugged in.
    switch_on = {car.key: not car.known for car in night.cars}
    amps_set = {car.key: car.max_amps for car in night.cars}
    commands: list[tuple[datetime, str]] = []
    current_changes = {car.key: 0 for car in night.cars}
    change_times: dict[str, list[datetime]] = {car.key: [] for car in night.cars}
    pending: list[tuple[datetime, str, float]] = []  # (reaches the car at, car, amps)
    clock = {"now": start}
    # What each charger's cloud shows: the current it had, for ``echo`` seconds after a change.
    shown: dict[str, tuple[float, float, datetime]] = {}  # car: (old, new, new shown from)
    drawing_since: dict[str, datetime | None] = {car.key: None for car in night.cars}
    starts: dict[str, list[datetime]] = {car.key: [] for car in night.cars}
    over_seconds = longest_seconds = 0
    log: list[str] = []
    user_at: dict[str, datetime] = {}
    fought: list[str] = []

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

    blocked: dict[str, datetime | None] = {"since": None}
    blocks: list[int] = []
    stops = 0

    async def switch(_household: Any, entity_id: str, on: bool) -> str | None:
        nonlocal stops
        if entity_id == HEAT_PUMP_BLOCK:
            if on and blocked["since"] is None:
                blocked["since"] = clock["now"]
            elif not on and (since := blocked["since"]) is not None:
                blocks.append(round((clock["now"] - since).total_seconds() / 60))
                blocked["since"] = None
            hass.states.async_set(entity_id, "on" if on else "off")
            return None
        for car in night.cars:
            if entity_id == car.entities["switch"]:
                if switch_on[car.key] and not on and socs[car.key] < car.target - 0.5:
                    stops += 1
                switch_on[car.key] = on
                commands.append((clock["now"], car.key))
                hass.states.async_set(entity_id, "on" if on else "off")
        return None

    def heat_pump(local: datetime) -> float:
        return 0.0 if night.heat_pump is None or blocked["since"] is not None else night.heat_pump(local)

    async def get_forecasts(call: ServiceCall) -> ServiceResponse:
        return {WEATHER: {"forecast": _forecast(night, clock["now"])}}

    if night.temperature is not None:
        hass.services.async_register("weather", "get_forecasts", get_forecasts, supports_response=SupportsResponse.ONLY)

    def new_current(car: SupplyCar, amps: float, entity: str, attributes: dict[str, Any]) -> None:
        now = clock["now"]
        before = amps_set[car.key]
        current_changes[car.key] += 1
        change_times[car.key].append(now)
        if got[car.key] <= 0 and amps < car.max_amps:
            # Nothing draws there now, and it is not set to its full current (which it is when nothing
            # charges): idle, unless a start follows.
            idle.append((now, car.key))
        if (when := user_at.get(car.key)) is not None and now - when < timedelta(minutes=2):
            fought.append(
                f"{now.astimezone(ZONE):%H:%M:%S} car {car.key}: {before:g} -> {amps:g} A, {(now - when).seconds} s after the app"
            )
        log.append(f"{now.astimezone(ZONE):%H:%M:%S} car {car.key}: {before:g} -> {amps:g} A")
        if night.latency:
            pending.append((now + timedelta(minutes=night.latency), car.key, amps))
        else:
            amps_set[car.key] = amps
        if night.echo:
            shown[car.key] = (before, amps, now + timedelta(seconds=night.echo))
        hass.states.async_set(entity, str(amps), attributes)

    idle: list[tuple[datetime, str]] = []

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
    if night.zaptec:
        zaptec_entry = MockConfigEntry(domain="zaptec")
        zaptec_entry.add_to_hass(hass)
        for car in night.cars:
            er.async_get(hass).async_get_or_create(
                "input_number",
                "zaptec",
                f"Z{car.key}",
                config_entry=zaptec_entry,
                suggested_object_id=f"car_{car.key}_amps",
            )
    got = {car.key: 0.0 for car in night.cars}

    def publish(moment: datetime) -> None:
        plugged = night.at(night.day, night.plug_in) <= moment
        for car in night.cars:
            e = car.entities
            since = drawing_since[car.key]
            # The car's cloud says it charges (and what it draws) a while after it has begun.
            told = got[car.key] > 0 and since is not None and (moment - since).total_seconds() >= night.charging_lag
            if car.known:
                hass.states.async_set(
                    e["soc"], str(int(socs[car.key])), {"unit_of_measurement": "%", "device_class": "battery"}
                )
                hass.states.async_set(e["limit"], str(int(car.target)))
                hass.states.async_set(e["cable"], "on" if plugged else "off")
                hass.states.async_set(e["charging"], "on" if told else "off")
                hass.states.async_set(
                    e["power"], str(round(got[car.key] * KW_PER_A, 2) if told else 0.0), {"unit_of_measurement": "kW"}
                )
            if night.charger_meter:
                hass.states.async_set(
                    e["meter"],
                    str(round(got[car.key] * KW_PER_A, 3)),
                    {"unit_of_measurement": "kW", "device_class": "power"},
                )
            if car.adjustable and hass.states.get(e["amps"]) is None:
                hass.states.async_set(e["amps"], str(car.max_amps), {"min": 6, "max": car.max_amps})
            if car.adjustable and (echo := shown.get(car.key)) is not None:
                old, new, until = echo
                value = old if moment < until else new
                state = hass.states.get(e["amps"])
                if state is None or state.state != str(value):
                    hass.states.async_set(e["amps"], str(value), {"min": 6, "max": car.max_amps})
                if moment >= until:
                    shown.pop(car.key, None)
        local = moment.astimezone(ZONE)
        house = night.house(local) + heat_pump(local)
        if night.temperature is not None:
            hass.states.async_set(
                WEATHER, "cloudy", {"temperature": round(night.temperature(local), 1), "temperature_unit": "°C"}
            )
        if night.heat_pump is not None:
            hass.states.async_set(
                HEAT_PUMP_POWER,
                str(round(heat_pump(local) * KW_PER_A * 1000)),
                {"unit_of_measurement": "W", "device_class": "power"},
            )
            hass.states.async_set(HEAT_PUMP_BLOCK, "on" if blocked["since"] is not None else "off")
        if night.meter_lost(local):
            hass.states.async_set(METER, "unavailable")
        elif night.frozen(local):
            pass  # the meter has stopped: its last value stays, and nothing says so
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
    if night.history is not None and storage is not None:
        key = f"{DOMAIN}.{entry.entry_id}"
        storage[key] = {"version": 1, "minor_version": 1, "key": key, "data": {"supply_forecast": night.history}}
    misses: list[float] = []
    over = 0
    over_at: list[str] = []
    blind = 0
    peak = 0.0
    at_deadline: dict[str, float] = {}
    cost = energy = 0.0
    user_sets = sorted((night.at(night.day, at), key, amps) for at, key, amps in night.user_sets)
    with patch(f"custom_components.{DOMAIN}.household.Household._async_switch", switch):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        household = entry.runtime_data
        for car in night.cars:
            if not car.known:
                continue
            settings: dict[str, Any] = {"ready_by": night.ready_by, "use_ready_by": True}
            if car.must:
                settings["must_soc"] = car.must
            if car.priority != "normal":
                settings["priority"] = car.priority
            await household.async_set_vehicle(f"car_{car.key}", settings)
        moment = start
        runs_over = 0.0  # seconds over the fuse in the stretch now
        modes_set = False
        while moment < end:
            clock["now"] = moment
            if not modes_set and moment >= night.at(night.day, night.plug_in) + step:
                # Charge now is chosen when the car is plugged in (unplugged, it goes back to the plan).
                modes_set = True
                for car in night.cars:
                    if car.known and car.mode:
                        await household.async_set_vehicle(f"car_{car.key}", {"mode": car.mode})
            for item in [p for p in pending if p[0] <= moment]:
                amps_set[item[1]] = item[2]
                pending.remove(item)
            while user_sets and user_sets[0][0] <= moment:
                _at, key, amps = user_sets.pop(0)
                car = next(c for c in night.cars if c.key == key)
                amps_set[key] = amps
                user_at[key] = moment
                log.append(f"{moment.astimezone(ZONE):%H:%M:%S} car {key}: set to {amps:g} A in the app")
                hass.states.async_set(car.entities["amps"], str(amps), {"min": 6, "max": car.max_amps})
            house = night.house(moment.astimezone(ZONE)) + heat_pump(moment.astimezone(ZONE))
            plan_now = getattr(getattr(household, "supply", None), "plan", None)
            if plan_now is not None and night.at(night.day, night.plug_in) <= moment < deadline:
                expected = next((e for s, en, _l, e in plan_now.capacity if s <= moment < en), None)
                if expected is not None:
                    misses.append(house - expected)
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
                runs_over = 0.0
            elif above > 0.5:
                runs_over += night.step
                over_seconds += night.step
                longest_seconds = max(longest_seconds, int(runs_over))
                if len(over_at) < 40:
                    over_at.append(
                        f"{moment.astimezone(ZONE):%H:%M:%S} house {house:g} cars {[round(g, 1) for g in given]} set {[amps_set[c.key] for c in night.cars]}"
                        f" guard {_guard_state(household)}"
                    )
                peak = max(peak, above)
            else:
                runs_over = 0.0
            for car, amps in zip(night.cars, given, strict=True):
                if amps > 0 and got[car.key] <= 0:
                    drawing_since[car.key] = moment
                    starts[car.key].append(moment)
                elif amps <= 0:
                    drawing_since[car.key] = None
                got[car.key] = amps
                wall = amps * KW_PER_A / 60 * share_of_minute
                socs[car.key] = min(car.target, socs[car.key] + wall * car.efficiency / car.capacity * 100)
                price = next((p for s, p in prices if s <= moment < s + timedelta(hours=1)), 0.0)
                cost += wall * price
                energy += wall
            moment += step
            if moment == deadline:
                at_deadline = dict(socs)
            publish_prices(moment)
            publish(moment)
            await tick(moment)
            await tick(moment + timedelta(seconds=min(3, night.step // 2)))
            plan = getattr(getattr(household, "supply", None), "plan", None)
            if plan is not None:
                for s, _e, limit, expected in plan.capacity:
                    used = sum(a for per in plan.amps.values() for st, _en, a in per if st == s)
                    if used + expected > limit + 1e-6:
                        over += 1
        guard_events = int(getattr(getattr(household, "supply", None), "guard_events", 0) or 0)
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    if (since := blocked["since"]) is not None:
        blocks.append(round((end - since).total_seconds() / 60))
    # Minutes over the fuse, and the longest stretch, counted in whole minutes begun.
    over_fuse = -(-over_seconds // 60)
    longest = -(-longest_seconds // 60)
    # A change while nothing charged at that charger, and no start came right after it.
    idle_changes = sum(
        1 for when, key in idle if not any(when <= t <= when + timedelta(minutes=2) for t in starts[key])
    )
    not_back: list[str] = []
    for by, key, amps in night.expect_back:
        moment = night.at(night.day, by)
        state = [line for line in log if line.split(" ")[2] == f"{key}:"]
        last = next(
            (
                float(line.rsplit("-> ", 1)[1].split(" ")[0])
                for line in reversed(state)
                if "-> " in line and line[:8] <= f"{moment.astimezone(ZONE):%H:%M:%S}"
            ),
            None,
        )
        if last is None or last < amps:
            not_back.append(f"car {key} at {last} A by {by}, not {amps:g} A")

    # Nothing charges at the end: each charger is left at its full current (a car plugged in while Home
    # Assistant is away charges at all the charger gives).
    left_low = [
        f"car {car.key} at {amps_set[car.key]:g} A"
        for car in night.cars
        if car.adjustable and got[car.key] <= 0 and amps_set[car.key] < car.max_amps - 0.5
    ]
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
        result,
        ready,
        at_deadline,
        over,
        current_changes,
        over_fuse,
        longest,
        round(peak, 1),
        busiest,
        blind,
        guard_events,
        stops,
        misses,
        blocks,
        over_at,
        idle_changes,
        not_back,
        fought,
        log,
        left_low,
    )


# ----------------------------------------------------------------------
# The nights


def _flat(amps: float) -> Callable[[datetime], float]:
    return lambda local: amps


def _heat_pump(base: float, extra: float) -> Callable[[datetime], float]:
    """A house with a heat pump on a price plan: it runs in the cheap night hours."""
    return lambda local: base + (extra if local.hour in (1, 2, 3, 4) else 0.0)


def _step(base: float, high: float, start: str, end: str) -> Callable[[datetime], float]:
    """A house that draws ``high`` between two local times, ``base`` otherwise."""
    return lambda local: high if start <= local.strftime("%H:%M") < end else base


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


def _cycling(base: float, high: float, start: str, end: str, *, on: int, off: int) -> Callable[[datetime], float]:
    """An oven that holds its heat: the element on for ``on`` minutes, off for ``off``, between two local times."""

    def house(local: datetime) -> float:
        now = local.strftime("%H:%M")
        if not start <= now < end:
            return base
        first = int(start[:2]) * 60 + int(start[3:])
        minute = local.hour * 60 + local.minute - first
        return high if minute % (on + off) < on else base

    return house


def _spiky_evening(base: float) -> Callable[[datetime], float]:
    """An evening and a night: the oven, a kettle, the washing machine, the dishwasher in bursts."""
    spikes = [
        ((17, 30), 40, 13.0),  # the oven
        ((18, 20), 3, 9.0),  # the kettle
        ((19, 0), 25, 10.0),  # the washing machine heats
        ((21, 0), 60, 0.0),
        ((22, 30), 3, 9.0),  # the kettle
    ]
    bursts = [((23, 0), 90)]  # the dishwasher: 9 A for two minutes every ten

    def house(local: datetime) -> float:
        minute = local.hour * 60 + local.minute
        extra = sum(amps for (h, m), length, amps in spikes if h * 60 + m <= minute < h * 60 + m + length)
        for (h, m), length in bursts:
            begin = h * 60 + m
            if begin <= minute < begin + length and (minute - begin) % 10 < 2:
                extra += 9.0
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
        # No Equalizer: the guard is all that turns the cars down when the house needs more. Both cars need
        # most of the night at full current, and five peaks take some of it: the place waits 5 minutes after a
        # peak before the cars get more (the shortest it can be set to).
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
            wait=5,
            tags=["guard"],
        ),
        # The same night with the place's usual 10 minutes after a peak: shown, not held to the ready-by time.
        SupplyNight(
            "guard-spikes-wait-10",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 25, 80, adjustable=True, priority="first")],
            fuse=25,
            limit=23,
            house=_spiky(4),
            plug_in="22:00",
            equalizer=False,
            guard=True,
            tags=["guard", "tight"],
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
            wait=5,
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
        # The meter stops on its last value just before the house needs more: nothing reports it.
        SupplyNight(
            "guard-meter-freezes",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 25, 80, adjustable=True)],
            fuse=25,
            limit=23,
            house=_step(4, 12, "01:00", "02:30"),
            plug_in="22:00",
            equalizer=False,
            guard=True,
            meter_frozen=[("00:55", "02:30")],
            tags=["guard", "meter-frozen"],
        ),
        # Sharing by need: the car that lacks the most gets the most of an hour there is not room for both in.
        SupplyNight(
            "need-short-night",
            monday,
            [SupplyCar("a", 20, 80, adjustable=True), SupplyCar("b", 60, 80, adjustable=True)],
            fuse=25,
            limit=23,
            house=_flat(9),
            plug_in="22:00",
            ready_by="06:00",
            share="need",
            tags=["need"],
        ),
        SupplyNight(
            "need-heat-pump-and-guard",
            monday,
            [SupplyCar("a", 40, 80, adjustable=True), SupplyCar("b", 60, 80, adjustable=True)],
            fuse=25,
            limit=23,
            house=_heat_pump(5, 9),
            plug_in="21:00",
            equalizer=False,
            guard=True,
            share="need",
            tags=["need", "guard"],
        ),
        # The same night in line. The heat pump starts in the hour the cars change places: the guard must
        # turn down the car that has just started, and look again when the meter stays where it is.
        SupplyNight(
            "queue-heat-pump-and-guard",
            monday,
            [SupplyCar("a", 40, 80, adjustable=True), SupplyCar("b", 60, 80, adjustable=True)],
            fuse=25,
            limit=23,
            house=_heat_pump(5, 9),
            plug_in="21:00",
            equalizer=False,
            guard=True,
            tags=["guard"],
        ),
        # Frank's mornings and evenings: a Zaptec on a 25 A supply, its own meter (a Shelly) on the charger, a
        # cloud that shows the old current for a while after a change, and a car whose cloud says it charges a
        # minute and a half after it has begun. The house is watched every 15 seconds.
        SupplyNight(
            "frank-oven-on-charge-now",
            monday,
            [SupplyCar("a", 60, 90, adjustable=True, mode="charge_now")],
            fuse=25,
            limit=25,
            house=_step(1.8, 14.8, "07:40", "08:00"),
            plug_in="07:35",
            until="09:00",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            expect_back=[("08:17", "a", 16)],
            tags=["guard", "frank"],
        ),
        SupplyNight(
            "frank-oven-cycling",
            monday,
            [SupplyCar("a", 40, 90, adjustable=True, mode="charge_now")],
            fuse=25,
            limit=25,
            house=_cycling(1.8, 13.0, "17:00", "18:00", on=4, off=3),
            plug_in="16:50",
            until="19:00",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            expect_back=[("18:17", "a", 16)],
            tags=["guard", "frank"],
        ),
        SupplyNight(
            "frank-started-with-the-oven-on",
            monday,
            [SupplyCar("a", 50, 90, adjustable=True, mode="charge_now")],
            fuse=25,
            limit=25,
            house=_step(1.8, 14.8, "06:45", "07:30"),
            plug_in="07:00",
            until="08:30",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            expect_back=[("07:47", "a", 16)],
            tags=["guard", "frank", "no-overload"],
        ),
        SupplyNight(
            "frank-no-room-to-start",
            monday,
            [SupplyCar("a", 50, 90, adjustable=True, mode="charge_now")],
            fuse=25,
            limit=25,
            house=_step(1.8, 20.0, "06:45", "07:30"),
            plug_in="07:00",
            until="08:30",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            tags=["guard", "frank", "no-overload"],
        ),
        # Frank: the supply is what counts. A car EV Planner does not know charges at the charger.
        SupplyNight(
            "frank-a-car-it-does-not-know",
            monday,
            [SupplyCar("a", 40, 90, adjustable=True, known=False)],
            fuse=25,
            limit=25,
            house=_step(1.8, 14.8, "17:30", "18:00"),
            plug_in="17:00",
            until="19:00",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            expect_back=[("18:17", "a", 16)],
            tags=["guard", "frank"],
        ),
        # Two Zaptecs: one on charge now, one on its plan, with the oven, a kettle and the washing machine.
        SupplyNight(
            "frank-two-chargers",
            monday,
            [
                SupplyCar("a", 30, 90, adjustable=True, mode="charge_now"),
                SupplyCar("b", 30, 80, adjustable=True),
            ],
            fuse=25,
            limit=25,
            house=_spiky_evening(1.8),
            plug_in="17:00",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            tags=["guard", "frank"],
        ),
        # Someone sets the current in the charger's app: EV Planner does not undo it at once.
        SupplyNight(
            "frank-set-in-the-app",
            monday,
            [SupplyCar("a", 40, 90, adjustable=True, mode="charge_now")],
            fuse=25,
            limit=25,
            house=_flat(1.8),
            plug_in="07:30",
            until="09:00",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            user_sets=[("08:10", "a", 10)],
            tags=["guard", "frank", "app"],
        ),
        # The meter drops out for twenty minutes while the oven is on.
        SupplyNight(
            "frank-meter-out-with-the-oven",
            monday,
            [SupplyCar("a", 40, 90, adjustable=True, mode="charge_now")],
            fuse=25,
            limit=25,
            house=_step(1.8, 14.8, "17:30", "18:10"),
            plug_in="17:00",
            until="19:30",
            equalizer=False,
            guard=True,
            step=15,
            zaptec=True,
            echo=45,
            charger_meter=True,
            charging_lag=90,
            meter_gaps=[("17:40", "18:00")],
            tags=["guard", "frank", "meter-gap"],
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
