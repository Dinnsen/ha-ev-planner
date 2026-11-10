"""Where things sit in the house picture: what a household moves, draws and places itself.

The picture in the Home tab places the chargers, the box where the current
comes in, the home battery and the heat pump by itself, draws the wires and
lays out the solar panels. An administrator can move each of them, draw a
wire's way and place the labels; this module keeps what they chose tidy
before it is stored. Nothing here steers a car.
"""

from __future__ import annotations

from typing import Any

# Each house in Settings has its own layout.
HOUSES = ("classic", "angle")
# The walls a thing can hang on: walls towards the road (s1, s2) and gables (e1, e2); which is which depends on the house.
WALLS = ("s1", "s2", "e1", "e2")
# What can be moved: things on a wall, and the heat pump on the ground.
WALL_THINGS = ("gateway", "battery", "charger0", "charger1")
GROUND_THINGS = ("heat",)
WIRES = ("sun", "grid", "heat", "battery", "car0", "car1")
LABELS = ("sun", "grid", "home", "battery", "heat", "car0", "car1")
ROOFS = ("roof", "garage")
# Enough for any house, and a limit for what is stored.
MAX_CELLS = 120
MAX_POINTS = 40
REACH = 40.0
LABEL_REACH = 600.0


def _number(value: Any, reach: float) -> float | None:
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    if value != value:  # not a number
        return None
    return round(max(-reach, min(reach, float(value))), 2)


def _point(value: Any, size: int, reach: float) -> list[float] | None:
    if not isinstance(value, list | tuple) or len(value) != size:
        return None
    numbers = [_number(v, reach) for v in value]
    if any(n is None for n in numbers):
        return None
    return [n for n in numbers if n is not None]


def clean_layouts(layouts: Any) -> dict[str, Any]:
    """A layout for each house, each kept tidy; a house with nothing placed is left out."""
    if not isinstance(layouts, dict):
        return {}
    out = {house: clean_layout(layouts.get(house)) for house in HOUSES}
    return {house: layout for house, layout in out.items() if layout}


def clean_layout(layout: Any) -> dict[str, Any]:
    """Only what the picture knows, in numbers it can draw; anything else is left out."""
    if not isinstance(layout, dict):
        return {}
    out: dict[str, Any] = {}
    things: dict[str, Any] = {}
    raw_things = layout.get("things")
    for key, value in (raw_things if isinstance(raw_things, dict) else {}).items():
        if not isinstance(value, dict):
            continue
        if key in WALL_THINGS and value.get("w") in WALLS:
            u, z = _number(value.get("u"), REACH), _number(value.get("z"), REACH)
            if u is not None and z is not None:
                things[key] = {"w": value["w"], "u": u, "z": z}
        elif key in GROUND_THINGS:
            x, y = _number(value.get("x"), REACH), _number(value.get("y"), REACH)
            if x is not None and y is not None:
                things[key] = {"x": x, "y": y}
    if things:
        out["things"] = things
    panels: dict[str, Any] = {}
    raw_panels = layout.get("panels")
    for roof in ROOFS:
        cells = raw_panels.get(roof) if isinstance(raw_panels, dict) else None
        if not isinstance(cells, list):
            continue
        kept: list[list[int]] = []
        for cell in cells[: MAX_CELLS * 2]:
            if (
                isinstance(cell, list | tuple)
                and len(cell) == 2
                and all(isinstance(n, int) and not isinstance(n, bool) and 0 <= n < 20 for n in cell)
                and list(cell) not in kept
            ):
                kept.append(list(cell))
        panels[roof] = kept[:MAX_CELLS]
    if panels:
        out["panels"] = panels
    wires: dict[str, Any] = {}
    raw_wires = layout.get("wires")
    for key in WIRES:
        route = raw_wires.get(key) if isinstance(raw_wires, dict) else None
        if not isinstance(route, list) or not 2 <= len(route) <= MAX_POINTS:
            continue
        points = [_point(p, 3, REACH) for p in route]
        if all(p is not None for p in points):
            wires[key] = points
    if wires:
        out["wires"] = wires
    labels: dict[str, Any] = {}
    raw_labels = layout.get("labels")
    for key in LABELS:
        offset = _point(raw_labels.get(key), 2, LABEL_REACH) if isinstance(raw_labels, dict) else None
        if offset is not None:
            labels[key] = offset
    if labels:
        out["labels"] = labels
    return out
