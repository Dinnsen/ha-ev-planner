"""A car on the sun. A broken rule fails the run, unless SIM_REPORT_ONLY is set (for versions without it)."""

from __future__ import annotations

import json
import os
from pathlib import Path

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest

from .solar_days import SolarDay, run_solar_day, solar_days

DAYS = solar_days()


@pytest.mark.parametrize("day", DAYS, ids=[day.name for day in DAYS])
async def test_solar_day(hass: HomeAssistant, freezer: FrozenDateTimeFactory, day: SolarDay) -> None:
    run = await run_solar_day(hass, freezer, day)
    broken: list[str] = []
    if run.most_current_changes > 12:
        broken.append(f"the current changed {run.most_current_changes} times in one hour")
    if run.starts > 8:
        broken.append(f"the car was started {run.starts} times")
    if run.phase_changes > 6:
        broken.append(f"the phases changed {run.phase_changes} times")
    if day.mode in ("surplus", "off") and not run.ready:
        broken.append(f"the car reached {run.soc_at_deadline:.1f} %, not {day.target} %")
    if "sunny" in day.tags and run.solar_share < 0.5:
        broken.append(f"only {run.solar_share:.0%} of the car's energy came from the sun on a clear day")
    if day.mode == "only" and run.car_kwh > 0 and run.car_grid_kwh > 0.1 * run.car_kwh:
        broken.append(f"only the sun, but {run.car_grid_kwh:.1f} of {run.car_kwh:.1f} kWh came from the grid")
    if "one-phase" in day.tags and run.car_kwh < 3:
        broken.append(f"only {run.car_kwh:.1f} kWh on a day with sun")
    if (
        day.battery
        and day.battery.first_until < 100
        and "hold" not in day.tags
        and (run.battery_peak or 0) < day.battery.first_until
    ):
        broken.append(
            f"the home battery only reached {run.battery_peak:.0f} %, it should come first up to {day.battery.first_until:.0f} %"
        )
    if day.hold and run.battery_into_car > 0.3:
        broken.append(f"the held home battery gave {run.battery_into_car:.1f} kWh to the car")
    if "forecast" in day.tags and run.solar_share < 0.5:
        broken.append(f"with a sunny forecast only {run.solar_share:.0%} came from the sun")
    run.result.violations = broken
    run.result.changes_log = [
        f"{run.soc_at_deadline:.1f} % at the ready-by time; {run.car_kwh:.1f} kWh, {run.solar_share:.0%} sun, "
        f"{run.cost:.2f} kr; {run.starts} starts, busiest hour {run.most_current_changes} current changes, "
        f"{run.phase_changes} phase changes"
        + (
            f"; battery peak {run.battery_peak:.0f} %, into the car {run.battery_into_car:.1f} kWh"
            if day.battery
            else ""
        ),
        *run.log,
    ]
    out = os.environ.get("SIM_OUT")
    if out:
        with Path(out).open("a", encoding="utf-8") as file:
            file.write(json.dumps(run.result.to_dict(), ensure_ascii=False) + "\n")
    if not os.environ.get("SIM_REPORT_ONLY"):
        assert not broken, "; ".join(broken)
