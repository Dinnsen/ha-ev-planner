"""A car at home with the sun on the roof, minute by minute: panels, a house, sometimes a home battery.

The house's meter reads what it draws from the grid (negative when it sends
power out). The car takes the current EV Planner sets (a number) on one or
three phases (a switch). The home battery, when there is one, does what home
batteries do: it takes what the panels make beyond the house and the car,
and gives when the house needs more, unless EV Planner holds it.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
import math
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from .model import MINUTE, Result
from .nights import ZONE, day_prices, wall_time
from .runner import DOMAIN, PRICE, version

GRID = "sensor.sim_grid_power"
SUN = "sensor.sim_solar_power"
BATTERY_SOC = "sensor.sim_battery_level"
BATTERY_POWER = "sensor.sim_battery_power"
HOLD = "input_boolean.sim_battery_hold"
CAR = {
    "soc": "sensor.car_battery",
    "limit": "number.car_limit",
    "cable": "binary_sensor.car_cable",
    "charging": "binary_sensor.car_charging",
    "power": "sensor.car_power",
    "switch": "switch.car_charge",
    "amps": "input_number.car_amps",
    "phases": "input_boolean.car_three_phases",
}


@dataclass(slots=True)
class Battery:
    capacity: float = 10.0
    soc: float = 30.0
    max_kw: float = 5.0
    first_until: float = 100.0


@dataclass(slots=True)
class SolarDay:
    name: str
    day: date
    mode: str  # the car's Solar setting: off, surplus, only
    sun: Callable[[datetime], float]  # kW from the panels, by local time
    house: Callable[[datetime], float] = lambda local: 0.45
    soc: float = 30.0
    target: float = 80.0
    capacity: float = 60.0
    max_amps: float = 16.0
    phase_switch: bool = True
    plug_in: str = "08:00"
    ready_by: str = "07:00"  # the next morning
    days: int = 1  # how many days later the ready-by time is
    battery: Battery | None = None
    hold: bool = False
    forecast: bool = False  # the Energy dashboard has a forecast (the real sun, hour by hour)
    tags: list[str] = field(default_factory=list)

    def at(self, day: date, hhmm: str) -> datetime:
        return wall_time(day, time.fromisoformat(hhmm), ZONE).astimezone(UTC)


@dataclass(slots=True)
class SolarResult:
    result: Result
    ready: bool
    soc_at_deadline: float
    car_kwh: float
    car_grid_kwh: float
    starts: int
    most_current_changes: int
    phase_changes: int
    battery_peak: float | None
    battery_into_car: float
    cost: float
    log: list[str] = field(default_factory=list)

    @property
    def solar_share(self) -> float:
        return 0.0 if self.car_kwh <= 0 else 1 - self.car_grid_kwh / self.car_kwh


def _entry(day: SolarDay) -> MockConfigEntry:
    car: dict[str, Any] = {
        "battery_capacity": day.capacity,
        "charge_power": day.max_amps * 0.69,
        "soc_entity": CAR["soc"],
        "target_entity": CAR["limit"],
        "connected_entity": CAR["cable"],
        "charging_entity": CAR["charging"],
        "power_entity": CAR["power"],
        "control": "car",
        "control_entity": CAR["switch"],
        "current_entity": CAR["amps"],
        "charger": "charger",
    }
    if day.phase_switch:
        car["phase_entity"] = CAR["phases"]
    options: dict[str, Any] = {"currency": "DKK", "notify_services": [], "grid_power": GRID, "solar_power": SUN}
    if day.battery:
        options |= {
            "battery_soc": BATTERY_SOC,
            "battery_power": BATTERY_POWER,
            "battery_first_until": day.battery.first_until,
        }
    if day.hold:
        options["battery_hold"] = HOLD
    return MockConfigEntry(
        domain=DOMAIN,
        title="EV Planner",
        unique_id=DOMAIN,
        data={"price_entity": PRICE, "country": "Denmark", "motorapi_api_key": "", "plate_provider": "motorapi_dk"},
        options=options,
        subentries_data=[
            ConfigSubentryDataWithId(
                data={"power": 11.0}, subentry_id="charger", subentry_type="charger", title="Charger", unique_id=None
            ),
            ConfigSubentryDataWithId(data=car, subentry_id="car", subentry_type="vehicle", title="Car", unique_id=None),
        ],
        version=1,
        minor_version=1,
    )


async def run_solar_day(hass: HomeAssistant, freezer: FrozenDateTimeFactory, day: SolarDay) -> SolarResult:
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    plug = day.at(day.day, day.plug_in)
    start = plug - timedelta(minutes=10)
    deadline = day.at(day.day + timedelta(days=day.days), day.ready_by)
    end = deadline + timedelta(minutes=10)
    prices = day_prices(day.day, day.days + 2)
    state: dict[str, Any] = {
        "soc": day.soc,
        "switch": False,
        "amps": day.max_amps,
        "three": True,
        "hold": False,
        "car_kw": 0.0,
        "battery": day.battery.soc if day.battery else None,
        "battery_kw": 0.0,
        "grid": 0.0,
    }
    clock = {"now": start}
    log: list[str] = []
    starts = 0
    current_times: list[datetime] = []
    phase_changes = 0

    def price_at(moment: datetime) -> float:
        return next((p for s, p in prices if s <= moment < s + timedelta(hours=1)), 0.0)

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
        nonlocal starts
        if entity_id == CAR["switch"]:
            if on and not state["switch"]:
                starts += 1
            state["switch"] = on
            hass.states.async_set(entity_id, "on" if on else "off")
        return None

    async def set_amps(call: ServiceCall) -> None:
        value = float(call.data["value"])
        if value != state["amps"]:
            current_times.append(clock["now"])
        state["amps"] = value
        hass.states.async_set(CAR["amps"], str(value), {"min": 6, "max": day.max_amps})

    async def boolean(call: ServiceCall) -> None:
        nonlocal phase_changes
        on = call.service == "turn_on"
        if call.data["entity_id"] == CAR["phases"]:
            if on != state["three"]:
                phase_changes += 1
            state["three"] = on
        elif call.data["entity_id"] == HOLD:
            state["hold"] = on
        hass.states.async_set(call.data["entity_id"], "on" if on else "off")

    hass.services.async_register("input_number", "set_value", set_amps)
    hass.services.async_register("input_boolean", "turn_on", boolean)
    hass.services.async_register("input_boolean", "turn_off", boolean)

    def publish(moment: datetime) -> None:
        plugged = moment >= plug
        hass.states.async_set(
            CAR["soc"], str(round(state["soc"], 1)), {"unit_of_measurement": "%", "device_class": "battery"}
        )
        hass.states.async_set(CAR["limit"], str(int(day.target)))
        hass.states.async_set(CAR["cable"], "on" if plugged else "off")
        hass.states.async_set(CAR["charging"], "on" if state["car_kw"] > 0 else "off")
        hass.states.async_set(CAR["power"], str(round(state["car_kw"], 2)), {"unit_of_measurement": "kW"})
        hass.states.async_set(CAR["phases"], "on" if state["three"] else "off")
        if hass.states.get(CAR["amps"]) is None:
            hass.states.async_set(CAR["amps"], str(day.max_amps), {"min": 6, "max": day.max_amps})
        hass.states.async_set(
            GRID, str(round(state["grid"] * 1000)), {"unit_of_measurement": "W", "device_class": "power"}
        )
        hass.states.async_set(SUN, str(round(day.sun(moment.astimezone(ZONE)) * 1000)), {"unit_of_measurement": "W"})
        if day.battery:
            hass.states.async_set(BATTERY_SOC, str(round(state["battery"], 1)), {"unit_of_measurement": "%"})
            hass.states.async_set(BATTERY_POWER, str(round(state["battery_kw"], 2)), {"unit_of_measurement": "kW"})
        if day.hold:
            hass.states.async_set(HOLD, "on" if state["hold"] else "off")

    async def tick(moment: datetime) -> None:
        freezer.move_to(moment)
        async_fire_time_changed(hass, moment)
        await hass.async_block_till_done()

    # The forecast: the real sun, hour by hour (as Forecast.Solar would give it).
    forecast_entry = MockConfigEntry(domain="forecast_solar")
    hours: dict[str, float] = {}
    moment = wall_time(day.day, time(0), ZONE)
    while moment < deadline + timedelta(days=1):
        hours[moment.isoformat()] = (
            sum(day.sun((moment + timedelta(minutes=m)).astimezone(ZONE)) for m in range(0, 60, 5)) / 12 * 1000
        )
        moment += timedelta(hours=1)
    patches = [patch(f"custom_components.{DOMAIN}.household.Household._async_switch", switch)]
    if day.forecast:
        forecast_entry.add_to_hass(hass)
        manager = SimpleNamespace(
            data={"energy_sources": [{"type": "solar", "config_entry_solar_forecast": [forecast_entry.entry_id]}]}
        )
        patches += [
            patch("homeassistant.components.energy.data.async_get_manager", AsyncMock(return_value=manager)),
            patch(
                "homeassistant.components.energy.websocket_api.async_get_energy_platforms",
                AsyncMock(return_value={"forecast_solar": AsyncMock(return_value={"wh_hours": hours})}),
            ),
        ]
    freezer.move_to(start)
    publish_prices(start)
    publish(start)
    entry = _entry(day)
    entry.add_to_hass(hass)
    car_kwh = car_grid = cost = into_car = 0.0
    peak: float | None = None
    at_deadline: float | None = None
    for p in patches:
        p.start()
    try:
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        household = entry.runtime_data
        await household.async_set_vehicle("car", {"ready_by": day.ready_by, "use_ready_by": True, "solar": day.mode})
        moment = start
        while moment < end:
            clock["now"] = moment
            local = moment.astimezone(ZONE)
            sun = day.sun(local)
            house = day.house(local)
            phases = 3 if state["three"] else 1
            plugged = moment >= plug
            car = (
                min(state["amps"], day.max_amps) * 0.23 * phases
                if state["switch"] and plugged and state["soc"] < day.target
                else 0.0
            )
            # The home battery: takes what is left over, gives what is missing, unless held.
            battery_kw = 0.0
            if day.battery and state["battery"] is not None:
                b = day.battery
                net = sun - house - car
                room = (100 - state["battery"]) / 100 * b.capacity * 60
                stock = state["battery"] / 100 * b.capacity * 60
                if net > 0:
                    battery_kw = min(net, b.max_kw, room)
                elif not state["hold"]:
                    battery_kw = -min(-net, b.max_kw, stock)
                state["battery"] = max(0.0, min(100.0, state["battery"] + battery_kw / 60 / b.capacity * 100))
                peak = state["battery"] if peak is None else max(peak, state["battery"])
                if battery_kw < 0 and car > 0:
                    into_car += min(car, -battery_kw) / 60
            grid = house + car + battery_kw - sun
            state.update(car_kw=car, battery_kw=battery_kw, grid=grid)
            bought = min(car, max(0.0, grid))
            car_kwh += car / 60
            car_grid += bought / 60
            cost += bought / 60 * price_at(moment)
            state["soc"] = min(day.target, state["soc"] + car / 60 * 0.9 / day.capacity * 100)
            moment += MINUTE
            if moment == deadline:
                at_deadline = state["soc"]
            publish_prices(moment)
            publish(moment)
            await tick(moment)
            await tick(moment + timedelta(seconds=3))
            if local.minute == 0 and local.hour % 2 == 0:
                log.append(
                    f"{local:%H:%M} sun {sun:.1f} house {house:.1f} car {car:.1f} grid {grid:.1f}"
                    + (f" battery {state['battery']:.0f}%" if day.battery else "")
                )
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    finally:
        for p in patches:
            p.stop()
    final = at_deadline if at_deadline is not None else state["soc"]
    busiest = max((sum(1 for t in current_times if a <= t < a + timedelta(hours=1)) for a in current_times), default=0)
    result = Result(name=day.name, version=version(), tags=["solar", day.mode, *day.tags], private=False)
    result.energy, result.cost = car_kwh, cost
    result.commands = starts
    result.on_time = final >= day.target - 0.5
    result.feasible = True
    result.goal = None
    return SolarResult(
        result, result.on_time, final, car_kwh, car_grid, starts, busiest, phase_changes, peak, into_car, cost, log
    )


# ----------------------------------------------------------------------
# The days


def bell(peak: float, rise: float = 5.5, fall: float = 21.0) -> Callable[[datetime], float]:
    """A clear day: the sun from ``rise`` to ``fall`` (local hours), ``peak`` kW at noon-ish."""

    def sun(local: datetime) -> float:
        h = local.hour + local.minute / 60
        if h <= rise or h >= fall:
            return 0.0
        return round(peak * math.sin(math.pi * (h - rise) / (fall - rise)) ** 1.6, 3)

    return sun


def cloudy(
    base: Callable[[datetime], float], every: int = 13, length: int = 3, dip: float = 0.2
) -> Callable[[datetime], float]:
    """Clouds pass: every ``every`` minutes the sun falls to ``dip`` for ``length`` minutes."""
    return lambda local: base(local) * (dip if (local.hour * 60 + local.minute) % every < length else 1.0)


def busy_house(local: datetime) -> float:
    """A house: a little all the time, a washing machine late morning, dinner at six."""
    h = local.hour + local.minute / 60
    extra = 2.0 if 10.5 <= h < 11.2 else 2.5 if 17.5 <= h < 18.4 else 0.0
    return 0.45 + extra


def solar_days() -> list[SolarDay]:
    june = date(2026, 6, 13)  # a Saturday
    april = date(2026, 4, 18)
    return [
        SolarDay("sun-clear-day", june, "surplus", bell(8.0), house=busy_house, tags=["sunny"]),
        SolarDay("sun-clouds-passing", june, "surplus", cloudy(bell(8.0)), house=busy_house, tags=["clouds"]),
        SolarDay("sun-only-small-panels", april, "only", bell(3.6, 7.0, 19.5), target=60, soc=35, tags=["one-phase"]),
        SolarDay(
            "sun-only-no-phase-switch", april, "only", bell(3.6, 7.0, 19.5), target=60, soc=35, phase_switch=False
        ),
        SolarDay(
            "sun-battery-first",
            june,
            "surplus",
            bell(8.0),
            house=busy_house,
            battery=Battery(soc=30, first_until=90),
            tags=["battery"],
        ),
        SolarDay(
            "sun-battery-held-at-night",
            june,
            "off",
            lambda local: 0.0,
            plug_in="18:00",
            battery=Battery(soc=90),
            hold=True,
            tags=["battery", "hold"],
        ),
        SolarDay(
            "sun-forecast-weekend",
            date(2026, 6, 12),
            "surplus",
            bell(8.0),
            plug_in="18:00",
            ready_by="18:00",
            days=2,
            forecast=True,
            house=busy_house,
            tags=["forecast"],
        ),
    ]
