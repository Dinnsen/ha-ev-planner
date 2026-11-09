"""Turn simulator results into a Markdown report.

    python -m sim.report results.jsonl [older.jsonl ...]

Each file is one version. Real nights (private) are only shown as totals.
"""

from __future__ import annotations

import json
from pathlib import Path
from statistics import mean, median
import sys
from typing import Any


def _load(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _fmt(value: float | None, digits: int = 1, unit: str = "") -> str:
    return "-" if value is None else f"{value:.{digits}f}{unit}"


def totals(rows: list[dict[str, Any]]) -> dict[str, Any]:
    feasible = [r for r in rows if r["feasible"] and r["on_time"] is not None]
    over = [r["over"] for r in rows if r["over"] is not None]
    errors = [abs(r["energy_error"]) for r in rows if r["energy_error"] is not None]
    charged = [r for r in rows if r["energy"] > 0.5]
    return {
        "nights": len(rows),
        "on_time": f"{sum(1 for r in feasible if r['on_time'])}/{len(feasible)}",
        "over_median": median(over) if over else None,
        "over_mean": mean(over) if over else None,
        "commands": mean(r["commands"] for r in rows) if rows else None,
        "commands_max": max((r["commands"] for r in rows), default=None),
        "changes": mean(r["plan_changes"] for r in rows) if rows else None,
        "changes_max": max((r["plan_changes"] for r in rows), default=None),
        "energy_error": mean(errors) if errors else None,
        "entries": mean(r["entries"] for r in charged) if charged else None,
        "broken": sum(1 for r in rows if r["violations"]),
    }


def report(files: list[Path]) -> str:
    versions = [(rows[0]["version"] if rows else path.stem, rows) for path in files if (rows := _load(path))]
    lines = ["## Simulator", ""]
    for title, private in (("Made and random nights", False), ("Real nights (totals only)", True)):
        sets = [(version, [r for r in rows if r["private"] == private]) for version, rows in versions]
        if not any(rows for _version, rows in sets):
            continue
        lines += [f"### {title}", "", "| | " + " | ".join(version for version, _rows in sets) + " |"]
        lines.append("|---|" + "---|" * len(sets))
        figures = [totals(rows) for _version, rows in sets]
        for label, key, digits, unit in (
            ("Nights", "nights", 0, ""),
            ("Ready on time (when possible)", "on_time", 0, ""),
            ("Dearer than the cheapest, median", "over_median", 1, " %"),
            ("Dearer than the cheapest, mean", "over_mean", 1, " %"),
            ("Commands per night", "commands", 1, ""),
            ("Commands, most in a night", "commands_max", 0, ""),
            ("Plan changes per night", "changes", 1, ""),
            ("Plan changes, most in a night", "changes_max", 0, ""),
            ("Energy off by (mean)", "energy_error", 1, " %"),
            ("History entries per plug-in", "entries", 2, ""),
            ("Nights with a broken rule", "broken", 0, ""),
        ):
            cells = [str(f[key]) if isinstance(f[key], str) else _fmt(f[key], digits, unit) for f in figures]
            lines.append(f"| {label} | " + " | ".join(cells) + " |")
        lines.append("")
        if private:
            continue
        lines += ["#### Night by night", "", "| Night | " + " | ".join(v for v, _r in sets) + " |"]
        lines.append("|---|" + "---|" * len(sets))
        names = [r["name"] for r in sets[0][1]]
        for name in names:
            cells = []
            for _version, rows in sets:
                row = next((r for r in rows if r["name"] == name), None)
                if row is None:
                    cells.append("-")
                    continue
                ready = {True: "ready", False: "NOT ready", None: "-"}[row["on_time"]]
                cell = (
                    f"{ready}, {_fmt(row['over'], 1, ' %')} dearer, {row['commands']} cmd, "
                    f"{row['plan_changes']} changes, energy {_fmt(row['energy_error'], 1, ' %')}"
                )
                if row["violations"]:
                    cell += " ⚠ " + "; ".join(row["violations"])
                cells.append(cell)
            lines.append(f"| {name} | " + " | ".join(cells) + " |")
        lines.append("")
        lines += ["<details><summary>Plans and changes, night by night</summary>", ""]
        for version, rows in sets:
            lines.append(f"**{version}**")
            lines.append("")
            for row in rows:
                if row.get("changes_log") or row.get("history_log"):
                    lines.append(
                        f"- {row['name']}: "
                        + " / ".join(row.get("changes_log", []))
                        + " | history: "
                        + " / ".join(row.get("history_log", []))
                    )
            lines.append("")
        lines += ["</details>", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    print(report([Path(arg) for arg in sys.argv[1:]]))
