"""Nights where the weather decides what the house draws. A broken rule fails the run, unless SIM_REPORT_ONLY is set.

The nights without the weather entity (``no-weather``) and without holding the heat
pump back (``no-block``) are there for comparison and only report.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest

from .supply_nights import SupplyNight, run_supply_night
from .weather_nights import weather_nights

NIGHTS = weather_nights()


@pytest.mark.parametrize("night", NIGHTS, ids=[night.name for night in NIGHTS])
async def test_weather_night(
    hass: HomeAssistant, hass_storage: dict[str, Any], freezer: FrozenDateTimeFactory, night: SupplyNight
) -> None:
    run = await run_supply_night(hass, freezer, night, storage=hass_storage)
    misses = run.misses
    mean = sum(misses) / len(misses) if misses else 0.0
    under = sum(1 for m in misses if m > 2) / len(misses) if misses else 0.0
    broken: list[str] = []
    if "no-weather" not in night.tags and "no-block" not in night.tags:
        for car in night.cars:
            if not run.ready[car.key]:
                broken.append(f"car {car.key} reached {run.soc_at_deadline.get(car.key)} % of {car.target} %")
        if run.longest_over > 2:
            broken.append(f"over the fuse for {run.longest_over} minutes in a row ({run.over_fuse} in all)")
        if "weather" in night.tags and abs(mean) > 1.5:
            broken.append(f"the house was {mean:+.1f} A off the plan on average")
        if "weather" in night.tags and under > 0.15:
            broken.append(f"the house drew 2 A more than planned in {under:.0%} of the minutes")
        if run.stops > 2:
            broken.append(f"a car was stopped {run.stops} times")
        if len(run.blocks) > 2 or any(b > 15 for b in run.blocks):
            broken.append(f"the heat pump was held back {run.blocks} minutes")
    run.result.violations = broken
    run.result.changes_log = [f"car {k}: {round(v, 1)} % at the ready-by time" for k, v in run.soc_at_deadline.items()]
    run.result.changes_log.append(
        f"house vs plan: {mean:+.1f} A on average, 2 A or more over in {under:.0%} of the minutes;"
        f" over the fuse {run.over_fuse} min (longest {run.longest_over}); guard {run.guard_events} times,"
        f" cars stopped {run.stops} times; heat pump held back {run.blocks} min"
    )
    out = os.environ.get("SIM_OUT")
    if out:
        with Path(out).open("a", encoding="utf-8") as file:
            file.write(json.dumps(run.result.to_dict(), ensure_ascii=False) + "\n")
    print(night.name, "|", run.result.changes_log)
    if not os.environ.get("SIM_REPORT_ONLY"):
        assert not broken, "; ".join(broken)
