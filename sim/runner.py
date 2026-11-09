"""Run one night through the whole integration, minute by minute, and measure it.

EV Planner runs as it would at home: it reads the price sensor and the car's
sensors and turns the car's charge switch on and off. The simulated car charges
while the switch is on. Only what EV Planner shows from the outside is read
(its plan and its history), so the same nights also run on older versions.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta
import json
import os
from pathlib import Path
from typing import Any
from unittest.mock import patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from .model import MINUTE, Night, Result, cheapest_cost, feasible_by

DOMAIN = "ev_household_planner"
PRICE = "sensor.energi_data_service"
SOC = "sensor.sim_battery"
LIMIT = "number.sim_charge_limit"
CABLE = "binary_sensor.sim_cable"
SWITCH = "switch.sim_charge"
CHARGING = "binary_sensor.sim_charging"
POWER = "sensor.sim_power"
VEHICLE = "sim_car"
CHARGER = "sim_charger"
# EV Planner may send this many commands in an hour (Tesla charges for calls to the car).
MAX_COMMANDS_PER_HOUR = 12


def version() -> str:
    manifest = Path(__file__).parent.parent / "custom_components" / DOMAIN / "manifest.json"
    return str(os.environ.get("SIM_VERSION") or json.loads(manifest.read_text())["version"])


def _entry(night: Night) -> MockConfigEntry:
    car = night.car
    vehicle: dict[str, Any] = {
        "battery_capacity": car.capacity,
        "charge_power": car.power,
        "soc_entity": SOC,
        "connected_entity": CABLE,
        "charging_entity": CHARGING,
        "power_entity": POWER,
        "control": "car",
        "control_entity": SWITCH,
        "charger": CHARGER,
    }
    if car.target_entity:
        vehicle["target_entity"] = LIMIT
    return MockConfigEntry(
        domain=DOMAIN,
        title="EV Planner",
        unique_id=DOMAIN,
        data={"price_entity": PRICE, "country": "Denmark", "motorapi_api_key": "", "plate_provider": "motorapi_dk"},
        options={"currency": "DKK", "notify_services": []},
        subentries_data=[
            ConfigSubentryDataWithId(
                data={"power": car.power}, subentry_id=CHARGER, subentry_type="charger", title="Charger", unique_id=None
            ),
            ConfigSubentryDataWithId(
                data=vehicle, subentry_id=VEHICLE, subentry_type="vehicle", title="Car", unique_id=None
            ),
        ],
        version=1,
        minor_version=1,
    )


class Run:
    """The simulated car and the record of the night."""

    def __init__(self, hass: HomeAssistant, night: Night) -> None:
        self.hass = hass
        self.night = night
        self.soc = night.car.soc
        self.switch_on = False
        self.resume_blocked = False
        self.was_charging = False
        self.commands: list[tuple[datetime, bool]] = []
        self.now = night.start
        self.price_shown: tuple[Any, ...] | None = None
        self.first_charge: datetime | None = None

    # EV Planner's commands -------------------------------------------------
    async def switch(self, _household: Any, entity_id: str, on: bool) -> str | None:
        if entity_id != SWITCH:
            return None
        self.commands.append((self.now, on))
        if not on and self.was_charging and self.night.car.no_resume:
            self.resume_blocked = True
        self.switch_on = on
        self.hass.states.async_set(SWITCH, "on" if on else "off")
        return None

    # The car -----------------------------------------------------------------
    def plugged(self, moment: datetime) -> bool:
        car = self.night.car
        return car.plug_in is not None and car.plug_in <= moment and (car.unplug is None or moment < car.unplug)

    def charging(self, moment: datetime) -> bool:
        return (
            self.plugged(moment)
            and self.switch_on
            and not self.resume_blocked
            and self.soc < self.night.car.limit - 1e-6
        )

    def unavailable(self, moment: datetime) -> bool:
        return any(start <= moment < end for start, end in self.night.car.outages)

    def publish(self, moment: datetime) -> None:
        car = self.night.car
        if not self.plugged(moment):
            self.resume_blocked = False
        if self.unavailable(moment):
            for entity in (SOC, CABLE, CHARGING, POWER):
                self.hass.states.async_set(entity, "unavailable")
            return
        charging = self.charging(moment)
        self.was_charging = charging
        soc = round(self.soc, car.soc_decimals) if car.soc_decimals else int(self.soc)
        self.hass.states.async_set(SOC, str(soc), {"unit_of_measurement": "%", "device_class": "battery"})
        self.hass.states.async_set(LIMIT, str(int(car.limit)))
        self.hass.states.async_set(CABLE, "on" if self.plugged(moment) else "off")
        self.hass.states.async_set(CHARGING, "on" if charging else "off")
        power = car.power * car.factor(self.soc) if charging else 0.0
        self.hass.states.async_set(POWER, str(round(power, 2)), {"unit_of_measurement": "kW", "device_class": "power"})

    def advance(self, moment: datetime) -> float:
        """One minute of charging from ``moment``: the wall energy."""
        if not self.charging(moment):
            return 0.0
        wall, self.soc = self.night.car.minute(self.soc)
        if self.first_charge is None:
            self.first_charge = moment
        return wall

    def start_night(self, night: Night) -> None:
        """A new night: the car comes home as full as it was the first time."""
        self.night = night
        self.soc = night.car.soc
        self.commands = []
        self.first_charge = None
        self.price_shown = None

    # The price sensor ----------------------------------------------------------
    def publish_prices(self, moment: datetime) -> None:
        night = self.night
        today, tomorrow = night.visible_prices(moment)
        current = next((p for s, p in today if s <= moment < s + night.step), None)
        shown = (current, len(today), len(tomorrow), today[0][0] if today else None)
        if shown == self.price_shown:
            return
        self.price_shown = shown

        def rows(slots: list[tuple[datetime, float]]) -> list[dict[str, Any]]:
            return [{"hour": start.isoformat(), "price": price} for start, price in slots]

        self.hass.states.async_set(
            PRICE,
            "unknown" if current is None else str(current),
            {"raw_today": rows(today), "raw_tomorrow": rows(tomorrow), "unit_of_measurement": "kr/kWh"},
        )


def _windows(vehicle: Any) -> list[tuple[datetime, datetime]]:
    plan = getattr(vehicle, "plan", None)
    if plan is None:
        return []
    return [(seg["start"], seg["end"]) for seg in plan.segments if seg.get("start") and seg.get("end")]


def _future(windows: list[tuple[datetime, datetime]], moment: datetime) -> tuple[tuple[datetime, datetime], ...]:
    return tuple((max(start, moment), end) for start, end in windows if end > moment)


def _covers(windows: list[tuple[datetime, datetime]], moment: datetime) -> bool:
    return any(start <= moment < end for start, end in windows)


async def _tick(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: datetime) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass, moment)
    await hass.async_block_till_done()


async def run_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: Night) -> list[Result]:
    """Run ``night`` (and its repeats, one day apart) and measure each."""
    await hass.config.async_set_time_zone(night.tz)
    run = Run(hass, night)
    freezer.move_to(night.start)
    run.publish_prices(night.start)
    run.publish(night.start)
    hass.states.async_set(SWITCH, "off")
    entry = _entry(night)
    entry.add_to_hass(hass)

    async def switch(household: Any, entity_id: str, on: bool) -> str | None:
        return await run.switch(household, entity_id, on)

    results: list[Result] = []
    with patch(f"custom_components.{DOMAIN}.household.Household._async_switch", switch):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        household = entry.runtime_data
        if night.settings:
            await household.async_set_vehicle(VEHICLE, dict(night.settings))
        for index in range(night.nights):
            this = night.shifted(index) if index else night
            run.start_night(this)
            result = await _run_one(hass, freezer, household, run, this)
            # Nights before the last of a series, or a single night with a car to learn.
            result.learning = this.learns and index < max(night.nights - 1, 1)
            if night.nights > 1:
                result.name = f"{night.name} #{index + 1}"
            _check(result, this, run, result.moved)
            results.append(result)
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
    return results


async def _run_one(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, household: Any, run: Run, night: Night
) -> Result:
    car = night.car
    assert car.plug_in is not None and car.unplug is not None
    result = Result(name=night.name, version=version(), tags=night.tags, private=night.private, goal=night.goal())
    await _tick(hass, freezer, night.start + timedelta(seconds=5))

    deadline = night.deadline()
    window_end = min(deadline, car.unplug) if deadline is not None else car.unplug
    if deadline is not None:
        result.feasible, slack = feasible_by(night, deadline)
        result.slack_minutes = slack.total_seconds() / 60
    energy_in_window, cost_in_window, soc_at_window_end = 0.0, 0.0, car.soc
    previous: list[tuple[datetime, datetime]] = []
    moment = night.start
    while moment < night.end:
        run.now = moment
        wall = run.advance(moment)
        price = night.price_at(moment) or 0.0
        result.energy += wall
        result.cost += wall * price
        if moment < window_end:
            energy_in_window += wall
            cost_in_window += wall * price
            soc_at_window_end = run.soc
        moment += MINUTE
        run.now = moment
        if deadline is not None and moment == deadline.replace(second=0, microsecond=0):
            result.soc_at_deadline = round(run.soc, 2)
        run.publish_prices(moment)
        if any(moment <= blip < moment + MINUTE for blip in car.blips) and run.plugged(moment):
            for entity in (SOC, CABLE, CHARGING, POWER):
                hass.states.async_set(entity, "unavailable")
            await _tick(hass, freezer, moment)
        if any(moment <= flicker < moment + MINUTE for flicker in car.flickers) and run.plugged(moment):
            hass.states.async_set(CABLE, "off")
            await _tick(hass, freezer, moment)
        run.publish(moment)
        await _tick(hass, freezer, moment)
        await _tick(hass, freezer, moment + timedelta(seconds=3))

        windows = _windows(household.vehicles[VEHICLE])
        if run.plugged(moment) and run.soc < night.goal() - 1:
            if previous and _future(previous, moment) != _future(windows, moment):
                result.plan_changes += 1
                if len(result.changes_log) < 12:
                    shown = ", ".join(
                        f"{night.local(a):%H:%M}-{night.local(b):%H:%M}" for a, b in _future(windows, moment)
                    )
                    result.changes_log.append(f"{night.local(moment):%H:%M} {round(run.soc, 1)} %: {shown or 'none'}")
            # A plan that is charging now goes on charging.
            if _covers(previous, moment - MINUTE) and _covers(previous, moment) and not _covers(windows, moment):
                result.moved.append(moment)
        previous = windows

    if deadline is not None and result.soc_at_deadline is None and deadline >= night.end:
        result.soc_at_deadline = round(run.soc, 2)
    if result.soc_at_deadline is not None:
        result.on_time = result.soc_at_deadline >= night.goal() - 0.5

    soc_from = car.soc
    if energy_in_window > 0.1 and soc_at_window_end > soc_from and night.priced(car.plug_in, window_end):
        result.cheapest = cheapest_cost(night, car.plug_in, window_end, soc_from, soc_at_window_end)
        # Compare like with like: what was charged before the ready-by time.
        if result.cheapest is not None:
            result.cost, result.energy = cost_in_window, energy_in_window
    result.commands = sum(1 for when, _on in run.commands if car.plug_in <= when <= car.unplug + timedelta(minutes=5))
    since = car.plug_in - timedelta(minutes=1)
    entries = [
        entry
        for entry in getattr(household.vehicles[VEHICLE], "history", [])
        if (started := _parse(entry.get("start"))) is not None and started >= since
    ]
    result.entries = len(entries)
    result.counted = round(sum(float(entry.get("energy") or 0) for entry in entries), 3)
    return result


def _parse(value: Any) -> datetime | None:
    try:
        moment = datetime.fromisoformat(str(value))
    except ValueError:
        return None
    return moment if moment.tzinfo else None


def _check(result: Result, night: Night, run: Run, moved: list[datetime]) -> None:
    """The rules that must never break."""
    car = night.car
    # 1. Ready by the ready-by time whenever it is possible (with an hour to spare, as the car's curve is learned).
    if result.feasible and (result.slack_minutes or 0) >= 60 and result.on_time is False and not result.learning:
        result.violations.append(
            f"not ready: {result.soc_at_deadline} % of {result.goal} % ({result.slack_minutes:.0f} min to spare)"
        )
    # 2. A plan that is charging never moves.
    if moved:
        first = night.local(moved[0]).strftime("%H:%M")
        result.violations.append(f"a plan that was charging moved {len(moved)} time(s), first at {first}")
    # 3. Never more commands than the limit, and never the same command twice in a row within a minute.
    times = [when for when, _on in run.commands]
    for index, when in enumerate(times):
        within = [other for other in times[index:] if other < when + timedelta(hours=1)]
        if len(within) > MAX_COMMANDS_PER_HOUR:
            result.violations.append(f"{len(within)} commands in an hour from {night.local(when):%H:%M}")
            break
    for (first_at, first_on), (second_at, second_on) in zip(run.commands, run.commands[1:], strict=False):
        if first_on == second_on and second_at - first_at < timedelta(seconds=60):
            result.violations.append(f"the same command twice within a minute at {night.local(second_at):%H:%M}")
            break
    # 4. One plug-in, one history entry; and energy is never negative.
    if result.energy > 0.5 and result.entries > 1:
        result.violations.append(f"{result.entries} history entries for one plug-in")
    if result.counted is not None and result.counted < 0:
        result.violations.append("negative energy in the history")
    # 5. Summer time: the cheapest hours are the right hours, and the earliest start holds on the wall clock.
    if "dst" in night.tags and result.over is not None and result.over > 5:
        result.violations.append(f"summer time: {result.over:.1f} % dearer than the cheapest hours")
    if night.settings.get("use_earliest_start") and run.first_charge is not None:
        earliest = time.fromisoformat(str(night.settings["earliest_start"]))
        started = night.local(run.first_charge)
        if car.plug_in is not None and started.time() < earliest and started.date() == night.local(car.plug_in).date():
            result.violations.append(f"charged at {started:%H:%M}, before the earliest start {earliest:%H:%M}")
