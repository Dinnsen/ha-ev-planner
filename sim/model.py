"""Nights, a simulated car and the yardsticks, without Home Assistant.

A night is the prices and one car: when it is plugged in and unplugged, how
full it is, how it charges and what it does wrong. The simulated car charges
while EV Planner has turned it on, at a speed that follows its own charging
curve, so the planner never knows more than it would at home.
"""

from __future__ import annotations

from dataclasses import dataclass, field
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
        shown_today = [(s, p) for s, p in self.prices if self.local(s).date() == today]
        published = self.published is not None and self.local(now).time() >= self.published
        shown_tomorrow = [(s, p) for s, p in self.prices if published and self.local(s).date() == tomorrow]
        return shown_today, shown_tomorrow


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
    """The cost of charging ``soc_from`` to ``soc_to`` in the cheapest slots between ``start`` and ``end``.

    Knows every price in advance, which no planner does: a yardstick, not a goal.
    Slots are added cheapest first; the car charges through them in time order
    at its own curve, until it has what it needs.
    """
    car = night.car
    slots = sorted(
        ((max(s, start), min(s + night.step, end), p) for s, p in night.prices if s + night.step > start and s < end),
        key=lambda slot: (slot[2], slot[0]),
    )
    chosen: list[tuple[datetime, datetime, float]] = []
    for slot in slots:
        chosen.append(slot)
        cost, soc = 0.0, soc_from
        for begin, finish, price in sorted(chosen):
            moment = begin
            while moment < finish and soc < soc_to - 0.01:
                wall, soc = car.minute(soc)
                cost += wall * price
                moment += MINUTE
        if soc >= soc_to - 0.01:
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
    violations: list[str] = field(default_factory=list)

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
    )


def load_nights(folder: Path) -> list[Night]:
    return [night_from_dict(json.loads(path.read_text())) for path in sorted(folder.glob("*.json"))]
