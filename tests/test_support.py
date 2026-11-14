"""The support export: what it keeps of a meter's history."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from custom_components.ev_household_planner.support import _thin

TZ = ZoneInfo("Europe/Copenhagen")
T0 = datetime(2026, 11, 13, 20, 37, 0, tzinfo=TZ)


def test_a_short_peak_within_a_minute_is_kept() -> None:
    """The guard acted on 26.9 A for a few seconds: the export must show it, not only where the minute ended."""
    rows = [
        (T0 + timedelta(seconds=5), "14.5"),
        (T0 + timedelta(seconds=19), "25.6"),
        (T0 + timedelta(seconds=56), "22.2"),
        (T0 + timedelta(seconds=90), "18.6"),
        (T0 + timedelta(seconds=95), "unavailable"),
    ]
    values = [value for _when, value in _thin(rows)]
    assert values == ["25.6", "22.2", "unavailable"]


def test_calendar_names_and_zone_names_are_left_out() -> None:
    from custom_components.ev_household_planner.support import ELSEWHERE, REDACTED, _events, _panel, _place

    events = _events(
        [
            {"at": "2026-11-14T10:00:00+01:00", "kind": "calendar", "vehicle": "Tesla", "title": "Til far og Jytte"},
            {"at": "2026-11-14T10:01:00+01:00", "kind": "plan", "vehicle": "Tesla", "title": "kept"},
        ]
    )
    assert events[0]["title"] == REDACTED and events[0]["vehicle"] == "Tesla"
    assert events[1]["title"] == "kept"
    panel = _panel({"vehicles": [{"id": "a", "calendar": {"start": "2026-11-15T09:00:00+01:00", "summary": "Lægen"}}]})
    assert panel["vehicles"][0]["calendar"] == {"start": "2026-11-15T09:00:00+01:00", "summary": REDACTED}
    assert _place("device_tracker.tesla", "home") == "home"
    assert _place("device_tracker.tesla", "not_home") == "not_home"
    assert _place("person.anna", "Mormors hus") == ELSEWHERE
    assert _place("sensor.tesla_battery", "55") == "55"
