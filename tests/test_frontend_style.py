"""The panel's style is shared with the dashboard cards: rules for the panel alone must say so."""

from __future__ import annotations

from pathlib import Path
import re

PANEL_JS = Path("custom_components/ev_household_planner/frontend/ev-planner-panel.js")


def test_only_the_panel_fills_the_screen() -> None:
    """A card on a dashboard is as tall as its content, not as the screen (2.0.1)."""
    rules = [line for line in PANEL_JS.read_text(encoding="utf-8").splitlines() if "100dvh" in line]
    assert rules
    for rule in rules:
        selector = rule.split("{", 1)[0]
        assert re.search(r":host\(ev-planner-panel", selector), rule
