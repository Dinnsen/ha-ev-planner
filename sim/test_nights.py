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


@pytest.mark.parametrize("night", NIGHTS, ids=[night.name for night in NIGHTS])
async def test_night(hass: HomeAssistant, freezer: FrozenDateTimeFactory, night: Night) -> None:
    result = await run_night(hass, freezer, night)
    out = os.environ.get("SIM_OUT")
    if out:
        with Path(out).open("a", encoding="utf-8") as file:
            file.write(json.dumps(result.to_dict(), ensure_ascii=False) + "\n")
    if not os.environ.get("SIM_REPORT_ONLY"):
        assert not result.violations, "; ".join(result.violations)
