"""Every night through EV Planner. A broken rule fails the run, unless SIM_REPORT_ONLY is set."""

from __future__ import annotations

import json
import os
from pathlib import Path

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest

from .model import Night, load_nights
from .nights import all_nights
from .runner import run_night


def _nights() -> list[Night]:
    nights = all_nights()
    private = os.environ.get("SIM_NIGHTS")
    if private and Path(private).is_dir():
        for night in load_nights(Path(private)):
            night.private = True
            nights.append(night)
    return nights


NIGHTS = _nights()

# Rules these nights break today, with why. Strict: once fixed, the run says so and the entry goes.
KNOWN = {
    "random-19": "the first night's speed leaves out the charging losses, and the plan has no margin",
    "random-21": "the first night's speed leaves out the charging losses, and the plan has no margin",
}


def _params() -> list[object]:
    return [
        pytest.param(
            night,
            id=night.name,
            marks=[pytest.mark.xfail(reason=KNOWN[night.name], strict=True)]
            if night.name in KNOWN and not os.environ.get("SIM_REPORT_ONLY")
            else [],
        )
        for night in NIGHTS
    ]


@pytest.mark.parametrize("night", _params())
async def test_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: Night) -> None:
    results = await run_night(hass, freezer, night)
    out = os.environ.get("SIM_OUT")
    if out:
        with Path(out).open("a", encoding="utf-8") as file:
            for result in results:
                file.write(json.dumps(result.to_dict(), ensure_ascii=False) + "\n")
    broken = [f"{result.name}: {v}" for result in results for v in result.violations]
    if not os.environ.get("SIM_REPORT_ONLY"):
        assert not broken, "; ".join(broken) + " | plan changes: " + " / ".join(results[-1].changes_log)
