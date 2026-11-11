"""Two cars on one supply. A broken rule fails the run, unless SIM_REPORT_ONLY is set (for versions without it)."""

from __future__ import annotations

import json
import os
from pathlib import Path

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest

from .supply_nights import SupplyNight, run_supply_night, supply_nights

NIGHTS = supply_nights()


@pytest.mark.parametrize("night", NIGHTS, ids=[night.name for night in NIGHTS])
async def test_supply_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: SupplyNight) -> None:
    run = await run_supply_night(hass, freezer, night)
    broken: list[str] = []
    if run.over_limit:
        broken.append(f"planned above the limit in {run.over_limit} slot checks")
    hours = 14
    for key, changes in run.current_changes.items():
        if changes > 6 * hours:
            broken.append(f"car {key}: the current changed {changes} times")
        if run.most_per_hour.get(key, 0) > 12:
            broken.append(f"car {key}: the current changed {run.most_per_hour[key]} times in one hour")
    if "meter-frozen" in night.tags:
        # A meter that froze is found after five minutes; until then nobody can see the house.
        if run.longest_over > 8:
            broken.append(f"over the fuse for {run.longest_over} minutes in a row with a frozen meter")
    elif night.guard and run.longest_over > night.latency + 2:
        broken.append(
            f"over the fuse for {run.longest_over} minutes in a row ({run.over_fuse} in all, {run.peak_over} A at worst):"
            f" {'; '.join(run.over_at[:1] + run.over_at[4:6] + run.over_at[-2:])}"
        )
    if "shortage" in night.tags:
        first = next(car for car in night.cars if car.priority == "first")
        if not run.ready[first.key]:
            broken.append(f"the first car reached {run.soc_at_deadline.get(first.key)} %, not {first.target} %")
        for car in night.cars:
            if car.must and run.soc_at_deadline.get(car.key, 0) < car.must - 0.5:
                broken.append(
                    f"car {car.key} reached {run.soc_at_deadline.get(car.key)} %, under its must of {car.must} %"
                )
    else:
        for car in night.cars:
            if not run.ready[car.key]:
                broken.append(f"car {car.key} reached {run.soc_at_deadline.get(car.key)} % of {car.target} %")
    run.result.violations = broken
    run.result.changes_log = [f"car {k}: {round(v, 1)} % at the ready-by time" for k, v in run.soc_at_deadline.items()]
    run.result.changes_log.append(
        f"over the fuse: {run.over_fuse} min, longest {run.longest_over} min, worst {run.peak_over} A,"
        f" {run.blind} min while the meter was out;"
        f" current changes {run.current_changes}, busiest hour {run.most_per_hour}"
    )
    out = os.environ.get("SIM_OUT")
    if out:
        with Path(out).open("a", encoding="utf-8") as file:
            file.write(json.dumps(run.result.to_dict(), ensure_ascii=False) + "\n")
    if not os.environ.get("SIM_REPORT_ONLY"):
        assert not broken, "; ".join(broken)
