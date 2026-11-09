"""Nights, a simulated car and the yardsticks, without Home Assistant.

A night is the prices and one car: when it is plugged in and unplugged, how
full it is, how it charges and what it does wrong. The simulated car charges
while EV Planner has turned it on, at a speed that follows its own charging
curve, so the planner never knows more than it would at home.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import UTC, date, datetime, time, timedelta
import json
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

MINUTE = timedelta(minutes=1)


@dataclass(slots=True)
class CarSpec:
    capacity: float = 60.0  # kWh in the battery
    power: float = 11.0  # kW from the wall
    efficiency: float = 0.9  # share of the wall energy that ends up in the battery
    # Charging curve: (from %, to %, share of the power).
    curve: list[tuple[float, float, float]] = field(default_factory=lambda: [(0.0, 100.0, 1.0)])
    soc: float = 40.0  # at plug-in
    limit: float = 80.0  # where the car stops by itself
    target_entity: bool = True  # EV Planner reads the car's limit
    soc_decimals: int = 0  # how the car reports its level
    plug_in: datetime | None = None
    unplug: datetime | None = None
    # Things real cars do.
    no_resume: bool = False  # does not start again after a pause
    blips: list[datetime] = field(default_factory=list)  # every sensor unavailable for a moment
    outages: list[tuple[datetime, datetime]] = field(default_factory=list)  # sensors unavailable
    flickers: list[datetime] = field(default_factory=list)  # the cable reads unplugged for a moment

    def __post_init__(self) -> None:
        # Everything in UTC: a minute added to a local time is a wall-clock minute in Python,
        # which skips or repeats an hour when the clocks change.
        self.plug_in = None if self.plug_in is None else _utc(self.plug_in)
        self.unplug = None if self.unplug is None else _utc(self.unplug)
        self.blips = [_utc(moment) for moment in self.blips]
        self.outages = [(_utc(start), _utc(end)) for start, end in self.outages]
        self.flickers = [_utc(moment) for moment in self.flickers]

    def shifted(self, delta: timedelta) -> CarSpec:
        return replace(
            self,
            plug_in=None if self.plug_in is None else self.plug_in + delta,
            unplug=None if self.unplug is None else self.unplug + delta,
            blips=[moment + delta for moment in self.blips],
            outages=[(start + delta, end + delta) for start, end in self.outages],
            flickers=[moment + delta for moment in self.flickers],
        )

    def factor(self, soc: float) -> float:
        for low, high, share in self.curve:
            if low <= soc < high:
                return share
        return self.curve[-1][2]

    def minute(self, soc: float) -> tuple[float, float]:
        """One minute of charging from ``soc``: (wall kWh, new soc)."""
        if soc >= self.limit:
            return 0.0, soc
        wall = self.power * self.factor(soc) / 60
        return wall, min(self.limit, soc + wall * self.efficiency / self.capacity * 100)


@dataclass(slots=True)
class Night:
    name: str
    start: datetime  # the simulation starts here (aware)
    end: datetime
    prices: list[tuple[datetime, float]]  # slot start (aware) and price
    step: timedelta = timedelta(hours=1)
    car: CarSpec = field(default_factory=CarSpec)
    settings: dict[str, Any] = field(default_factory=dict)
    tz: str = "Europe/Copenhagen"
    published: time | None = time(13, 0)  # when tomorrow's prices come; None: never
    tags: list[str] = field(default_factory=list)
    private: bool = False  # a real night: only totals are shown
    hidden_after: datetime | None = None  # prices from here on never reach the sensor
    nights: int = 1  # the same night this many times in a row, to see what EV Planner learns

    def __post_init__(self) -> None:
        self.start = _utc(self.start)
        self.end = _utc(self.end)
        self.prices = [(_utc(start), price) for start, price in self.prices]
        self.hidden_after = _utc(self.hidden_after) if self.hidden_after is not None else None

    def shifted(self, days: int) -> Night:
        """The same night ``days`` later (24 hours a day)."""
        delta = timedelta(days=days)
        return replace(
            self,
            start=self.start + delta,
            end=self.end + delta,
            prices=[(start + delta, price) for start, price in self.prices],
            car=self.car.shifted(delta),
            hidden_after=None if self.hidden_after is None else self.hidden_after + delta,
            nights=1,
        )

    @property
    def zone(self) -> ZoneInfo:
        return ZoneInfo(self.tz)

    def local(self, moment: datetime) -> datetime:
        return moment.astimezone(self.zone)

    def price_at(self, moment: datetime) -> float | None:
        for start, price in self.prices:
            if start <= moment < start + self.step:
                return price
        return None

    def priced(self, start: datetime, end: datetime) -> bool:
        """Is every minute from ``start`` to ``end`` priced?"""
        moment = start
        while moment < end:
            if self.price_at(moment) is None:
                return False
            moment += self.step
        return self.price_at(end - MINUTE) is not None

    @property
    def learns(self) -> bool:
        """A car EV Planner has to learn before it can plan it right: a charging curve, or no restart after a pause."""
        return self.car.no_resume or any(share < 1 for _low, _high, share in self.car.curve)

    def deadline(self) -> datetime | None:
        """The ready-by time after plug-in, on the wall clock, as EV Planner should see it."""
        car = self.car
        if car.plug_in is None or not self.settings.get("use_ready_by", True):
            return None
        ready = time.fromisoformat(str(self.settings.get("ready_by", "07:00")))
        plugged = self.local(car.plug_in)
        day = plugged.date()
        for offset in range(8):
            moment = wall_time(day + timedelta(days=offset), ready, self.zone)
            if moment <= car.plug_in:
                continue
            schedule = self.settings.get("schedule") or {}
            weekday = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")[moment.weekday()]
            entry = schedule.get(weekday, "default")
            if entry == "none":
                continue
            if entry not in ("default", None, ""):
                moment = wall_time(moment.date(), time.fromisoformat(str(entry)), self.zone)
            return moment
        return None

    def goal(self) -> float:
        """What the car can reach: the target, but never above the car's own limit."""
        target = self.car.limit if self.car.target_entity else float(self.settings.get("target_soc", 80.0))
        return min(target, self.car.limit)

    def visible_prices(self, now: datetime) -> tuple[list[tuple[datetime, float]], list[tuple[datetime, float]]]:
        """What the price sensor shows at ``now``: today's prices and, once published, tomorrow's."""
        today = self.local(now).date()
        tomorrow = today + timedelta(days=1)
        known = [(s, p) for s, p in self.prices if self.hidden_after is None or s < self.hidden_after]
        shown_today = [(s, p) for s, p in known if self.local(s).date() == today]
        published = self.published is not None and self.local(now).time() >= self.published
        shown_tomorrow = [(s, p) for s, p in known if published and self.local(s).date() == tomorrow]
        return shown_today, shown_tomorrow


def _utc(moment: datetime) -> datetime:
    return moment.astimezone(UTC)


def wall_time(day: date, moment: time, zone: ZoneInfo) -> datetime:
    """``moment`` on ``day`` on the wall clock; a time that does not exist moves on by the gap."""
    naive = datetime.combine(day, moment)
    aware = naive.replace(tzinfo=zone)
    # Round trip through UTC: a time in the spring gap comes back an hour later.
    return aware.astimezone(UTC).astimezone(zone)


# ----------------------------------------------------------------------
# Yardsticks


def feasible_by(night: Night, deadline: datetime) -> tuple[bool, timedelta]:
    """Could the car reach its goal by ``deadline`` charging all the time from plug-in? And with what to spare."""
    car = night.car
    if car.plug_in is None:
        return False, timedelta(0)
    soc, moment, goal = car.soc, car.plug_in, night.goal()
    while soc < goal - 0.01 and moment < deadline:
        _wall, soc = car.minute(soc)
        moment += MINUTE
    return soc >= goal - 0.01, deadline - moment


def cheapest_cost(night: Night, start: datetime, end: datetime, soc_from: float, soc_to: float) -> float | None:
    """A floor under the cost of charging ``soc_from`` to ``soc_to`` between ``start`` and ``end``.

    The energy from the wall is bought in the cheapest slots first, as if the car
    took full power all the time and every price were known in advance. No
    planner can do better, so a plan's cost is measured against it.
    """
    car = night.car
    energy, soc = 0.0, soc_from
    while soc < soc_to - 0.01:
        wall, soc = car.minute(soc)
        if wall <= 0:
            return None
        energy += wall
    slots = sorted(
        (p, max(s, start), min(s + night.step, end)) for s, p in night.prices if s + night.step > start and s < end
    )
    cost = 0.0
    for price, begin, finish in slots:
        take = min(energy, car.power * (finish - begin).total_seconds() / 3600)
        cost += take * price
        energy -= take
        if energy <= 1e-9:
            return cost
    return None


@dataclass(slots=True)
class Result:
    """One night through EV Planner."""

    name: str
    version: str
    tags: list[str]
    private: bool
    feasible: bool | None = None
    slack_minutes: float | None = None
    on_time: bool | None = None
    soc_at_deadline: float | None = None
    goal: float | None = None
    energy: float = 0.0  # kWh from the wall, really
    cost: float = 0.0
    cheapest: float | None = None  # for the same energy
    commands: int = 0
    plan_changes: int = 0
    counted: float | None = None  # kWh EV Planner wrote in its history
    entries: int = 0  # history entries for the night
    learning: bool = False  # EV Planner has not had the nights to learn this car yet
    changes_log: list[str] = field(default_factory=list)  # when the plan changed, and to what
    history_log: list[str] = field(default_factory=list)  # EV Planner's history entries for the night
    violations: list[str] = field(default_factory=list)
    moved: list[datetime] = field(default_factory=list)  # minutes a charging plan stopped covering
    cheapest_slot_minutes: int = 0  # minutes charged in the night's cheapest slot

    @property
    def over(self) -> float | None:
        """How much dearer than the cheapest, in %."""
        if self.cheapest is None or self.cheapest <= 0 or self.energy < 0.5:
            return None
        return (self.cost - self.cheapest) / self.cheapest * 100

    @property
    def energy_error(self) -> float | None:
        """EV Planner's energy against the truth, in %."""
        if self.counted is None or self.energy < 1:
            return None
        return (self.counted - self.energy) / self.energy * 100

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "version": self.version,
            "tags": self.tags,
            "private": self.private,
            "feasible": self.feasible,
            "slack_minutes": self.slack_minutes,
            "on_time": self.on_time,
            "soc_at_deadline": self.soc_at_deadline,
            "goal": self.goal,
            "energy": round(self.energy, 3),
            "cost": round(self.cost, 3),
            "cheapest": None if self.cheapest is None else round(self.cheapest, 3),
            "over": None if self.over is None else round(self.over, 2),
            "commands": self.commands,
            "plan_changes": self.plan_changes,
            "counted": self.counted,
            "entries": self.entries,
            "energy_error": None if self.energy_error is None else round(self.energy_error, 2),
            "learning": self.learning,
            "changes_log": self.changes_log,
            "history_log": self.history_log,
            "violations": self.violations,
        }


# ----------------------------------------------------------------------
# Night files


def _when(value: Any, zone: ZoneInfo) -> datetime:
    moment = datetime.fromisoformat(str(value))
    return moment if moment.tzinfo else moment.replace(tzinfo=zone)


def night_from_dict(data: dict[str, Any]) -> Night:
    """A night from its JSON form (times without an offset are local)."""
    zone = ZoneInfo(str(data.get("tz", "Europe/Copenhagen")))
    car_data = dict(data.get("car") or {})
    car = CarSpec(
        capacity=float(car_data.get("capacity", 60)),
        power=float(car_data.get("power", 11)),
        efficiency=float(car_data.get("efficiency", 0.9)),
        curve=[(float(a), float(b), float(c)) for a, b, c in car_data.get("curve", [[0, 100, 1]])],
        soc=float(car_data.get("soc", 40)),
        limit=float(car_data.get("limit", 80)),
        target_entity=bool(car_data.get("target_entity", True)),
        soc_decimals=int(car_data.get("soc_decimals", 0)),
        plug_in=_when(car_data["plug_in"], zone) if car_data.get("plug_in") else None,
        unplug=_when(car_data["unplug"], zone) if car_data.get("unplug") else None,
        no_resume=bool(car_data.get("no_resume", False)),
        blips=[_when(v, zone) for v in car_data.get("blips", [])],
        outages=[(_when(a, zone), _when(b, zone)) for a, b in car_data.get("outages", [])],
        flickers=[_when(v, zone) for v in car_data.get("flickers", [])],
    )
    step = timedelta(minutes=int(data.get("step_minutes", 60)))
    prices = [(_when(s, zone), float(p)) for s, p in data["prices"]]
    published = data.get("published", "13:00")
    hidden = data.get("hidden_after")
    return Night(
        name=str(data["name"]),
        start=_when(data["start"], zone),
        end=_when(data["end"], zone),
        prices=prices,
        step=step,
        car=car,
        settings=dict(data.get("settings") or {}),
        tz=str(zone),
        published=None if published is None else time.fromisoformat(str(published)),
        tags=list(data.get("tags", [])),
        private=bool(data.get("private", False)),
        hidden_after=_when(hidden, zone) if hidden else None,
        nights=int(data.get("nights", 1)),
    )


def load_nights(folder: Path) -> list[Night]:
    return [night_from_dict(json.loads(path.read_text())) for path in sorted(folder.glob("*.json"))]
