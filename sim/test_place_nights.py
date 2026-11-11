"""Cars that find their charger at two places. A broken rule fails the run, unless SIM_REPORT_ONLY is set."""

from __future__ import annotations

import json
import os
from pathlib import Path

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest

from .place_nights import PlaceNight, place_nights, run_place_night

NIGHTS = place_nights()


@pytest.mark.parametrize("night", NIGHTS, ids=[night.name for night in NIGHTS])
async def test_place_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: PlaceNight) -> None:
    run = await run_place_night(hass, freezer, night)
    broken: list[str] = []
    for arrival in night.arrivals:
        key = arrival.car
        after = run.found_after[key]
        if run.found[key] != arrival.charger:
            broken.append(f"{key} was found at {run.found[key]}, and is at {arrival.charger}")
        elif after is None or after > 10:
            broken.append(f"{key} was found after {after} minutes")
        if not run.ready[key]:
            broken.append(f"{key} reached {round(run.soc_at_deadline[key], 1)} % of 80 %")
        if run.unplanned[key] > 15:
            broken.append(f"{key} charged for {run.unplanned[key]} minutes while it was to be paused")
    if any(arrival.charger == "cabin" for arrival in night.arrivals):
        if not run.summer_planned:
            broken.append("the car at the summer house was not planned on the summer house's supply")
        if run.over_summer > 2:
            broken.append(f"the summer house drew more than its fuse for {run.over_summer} minutes ({run.over_how})")
    # A charger that is down is tried first; a car that is down is only the backup, and may never be needed.
    if any(not entity.endswith("_charge") for entity in night.down) and not run.refused:
        broken.append("the switch that is down was never tried")
    run.result.violations = broken
    run.result.changes_log = [
        f"{key}: found at {run.found[key]} after {run.found_after[key]} min, {round(run.soc_at_deadline[key], 1)} % at the"
        f" ready-by time, {run.unplanned[key]} min charged while it was to be paused"
        for key in run.found
    ]
    run.result.changes_log.append(
        f"over the summer house's fuse: {run.over_summer} min; commands not answered: {run.refused}"
    )
    out = os.environ.get("SIM_OUT")
    if out:
        with Path(out).open("a", encoding="utf-8") as file:
            file.write(json.dumps(run.result.to_dict(), ensure_ascii=False) + "\n")
    if not os.environ.get("SIM_REPORT_ONLY"):
        assert not broken, "; ".join(broken)
