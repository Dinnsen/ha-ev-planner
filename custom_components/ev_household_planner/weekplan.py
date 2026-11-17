"""The week plan: which car charges in which hour of the coming week, and how much.

One plan for each charger, hour by hour for seven days, worked out in one place. Every screen shows it,
and only the part for the car's current stay at home is handed on: as a target and a time to be done by,
to the planner that picks the hours and the control that runs the charger, which do not change.

How it is worked out, for each car at a charger:

- The week is split into stays: the hours the car is expected home, from coming home to leaving.
- Each day the car leaves, it takes what that weekday takes on a hard day (as careful as chosen). Before
  that it must have that, the reserve on top, and never less than its own minimum.
- Those needs are met in order of time with the cheapest hours at home before each departure. Two cars at
  one charger never get the same hour.
- Then, only in free hours: the hours under the low-price limit up to that level; a full charge when one
  is due, in the cheapest stay ending in a departure; and with "always cheapest" the week's cheapest hours
  up to the preferred level when that is a worthwhile charge, or with "fill up" every stay to it.

Nothing here reads Home Assistant: it is fed plain numbers, so it can be tested on its own.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

HOURS = 168
# A forecast price counts for a bit more than it says: the further ahead, the less sure.
FORECAST_RISK = 0.5
PATTERN_ERROR = 0.45
# "Always cheapest" also takes the cheapest quarter of the week's hours at home, for a charge worth starting.
CHEAP_SHARE = 0.25
CHEAP_MIN_KWH = 2.0
CHEAP_MIN_SHARE = 0.10
EPSILON = 1e-6

WHY_NEED = "need"
WHY_FULL = "full"
WHY_LOW = "low_price"
WHY_CHEAP = "cheap"
WHY_FILL = "fill"
ORDER = (WHY_FULL, WHY_NEED, WHY_LOW, WHY_FILL, WHY_CHEAP)


@dataclass
class Hour:
    """One hour of the week: when it starts, its price, and how sure that price is."""

    start: datetime
    price: float | None
    kind: str = "known"  # known, forecast, pattern or none
    error: float = 0.0  # the price's expected error, relative
    share: float = 1.0  # the part of the hour that is left (the first hour is under way)

    @property
    def cost(self) -> float:
        """The price the choice goes by: a guess counts for a bit more than it says."""
        price = 1.0 if self.price is None else self.price
        return price + FORECAST_RISK * self.error * abs(price)


@dataclass
class WeekCar:
    """What the plan needs to know about a car, in kWh and in the week's hours."""

    vehicle_id: str
    capacity: float
    soc: float
    power: float
    minimum: float  # never less than this when it leaves
    preferred: Sequence[float]  # the level it is normally filled to, for each hour (its weekday's)
    hard: Sequence[float]  # what each day from today takes on a hard day
    typical: Sequence[float]  # and on a typical one
    reserve: float
    home: Sequence[bool]
    low_price: float | None = None
    low_level: float | None = None
    full_level: float | None = None
    full_due: int | None = None  # the hour from which a full charge is due; None: none due this week
    fill: bool = False  # fill up every stay instead of "always cheapest"
    ceiling: float | None = None  # never dearer than this, except for what it must have at the least
    blocked: Sequence[bool] | None = None  # hours it may not charge in (before its earliest start)


@dataclass
class CarWeek:
    """A car's week: what it charges each hour and why, and where its battery is expected to be."""

    vehicle_id: str
    charge: list[float]
    why: list[str | None]
    soc_hard: list[float]  # with a hard day every day (for the screens)
    soc_typical: list[float]  # with a typical day every day: what the plan goes by between departures
    leaves: list[tuple[int, int, float]]  # (hour, day, what that day takes on a hard day)
    short: list[int] = field(default_factory=list)  # hours it leaves without enough, nothing to be done
    full_at: int | None = None  # the departure a full charge is planned before


def leaving(car: WeekCar, hours: Sequence[Hour], day_of: Sequence[int]) -> list[tuple[int, int, float]]:
    """When the car takes each day's driving: the first time it leaves that day.

    A day it is expected home all day takes it at the end of the day (it may still drive a little). Today
    counts only when it still leaves today.
    """
    out: list[tuple[int, int, float]] = []
    count = len(hours)
    seen: set[int] = set()
    for hour in range(1, count):
        day = day_of[hour]
        if day in seen or day >= len(car.hard):
            continue
        if car.home[hour - 1] and not car.home[hour]:
            seen.add(day)
            out.append((hour, day, car.hard[day]))
    days = sorted(set(day_of))
    for day in days:
        if day in seen or day == 0 or day >= len(car.hard):
            continue
        last = max(hour for hour in range(count) if day_of[hour] == day)
        if last + 1 < count:
            out.append((last + 1, day, car.hard[day]))
    return sorted(out)


class _Plan:
    """The plan as it is built: the charge in each hour, and who has the charger then."""

    def __init__(
        self,
        cars: Sequence[WeekCar],
        hours: Sequence[Hour],
        day_of: Sequence[int],
        window: Sequence[int | None] | None = None,
        holder: str | None = None,
    ) -> None:
        self.cars = list(cars)
        # The hours the cable is not moved (a night, by default): each such stretch is one car's at a shared charger.
        self.window = list(window) if window is not None and len(cars) > 1 else [None] * len(hours)
        self.stretch: dict[int, list[int]] = {}
        for hour, key in enumerate(self.window):
            if key is not None:
                self.stretch.setdefault(key, []).append(hour)
        # The car plugged in now keeps the stretch it is in.
        self.owner: dict[int, str] = {}
        if holder is not None and self.window and self.window[0] is not None:
            self.owner[self.window[0]] = holder
        self.hours = list(hours)
        self.day_of = list(day_of)
        self.count = len(hours)
        self.charge = {car.vehicle_id: [0.0] * self.count for car in cars}
        self.why: dict[str, list[str | None]] = {car.vehicle_id: [None] * self.count for car in cars}
        self.holder: list[str | None] = [None] * self.count
        # The cap each charged hour was planned under: a charge earlier must not push it over.
        self.limit = {car.vehicle_id: [car.capacity] * self.count for car in cars}
        self.leaves = {car.vehicle_id: leaving(car, hours, day_of) for car in cars}
        # Between departures a day takes what it typically does; only the day ahead is counted as a hard one.
        self.used = {car.vehicle_id: [0.0] * self.count for car in cars}
        for car in cars:
            for hour, day, _need in self.leaves[car.vehicle_id]:
                self.used[car.vehicle_id][hour] += car.typical[day] if day < len(car.typical) else 0.0

    def level(self, car: WeekCar) -> list[float]:
        """The battery at the end of each hour: driving taken as it leaves, then what the hour charges."""
        out = []
        soc = car.soc
        charge, used = self.charge[car.vehicle_id], self.used[car.vehicle_id]
        for hour in range(self.count):
            soc = soc - used[hour] + charge[hour]
            out.append(soc)
        return out

    def before(self, car: WeekCar, hour: int) -> float:
        """The battery just before the car leaves in ``hour``."""
        if hour <= 0:
            return car.soc
        return self.level(car)[hour - 1]

    def context(self, car: WeekCar) -> tuple[list[float], list[float], list[float]]:
        """The battery each hour, and from each hour on: its highest until the car leaves, and at all."""
        levels = self.level(car)
        count = self.count
        used = self.used[car.vehicle_id]
        stay_top = [0.0] * count
        all_top = [0.0] * count
        top = run = -1e9
        for hour in range(count - 1, -1, -1):
            top = max(top, levels[hour])
            all_top[hour] = top
            run = levels[hour] if hour + 1 >= count or used[hour + 1] > 0 else max(run, levels[hour])
            stay_top[hour] = run
        return levels, stay_top, all_top

    def taken(self, car: WeekCar, hour: int) -> bool:
        """Whether the stretch the cable is not moved in, that ``hour`` is in, is another car's."""
        key = self.window[hour]
        if key is None:
            return False
        owner = self.owner.get(key)
        if owner is None:
            owner = next(
                (
                    other.vehicle_id
                    for other in self.cars
                    for h in self.stretch[key]
                    if self.charge[other.vehicle_id][h] > EPSILON
                ),
                None,
            )
        return owner is not None and owner != car.vehicle_id

    def room(
        self,
        car: WeekCar,
        hour: int,
        cap: float,
        ctx: tuple[list[float], ...],
        *,
        displace: bool = False,
        dear: bool = False,
    ) -> float:
        """How much more ``hour`` can give the car: its power, and the caps from then on.

        A later charge that would go over its own cap gives way to this one (it is trimmed when this is
        added), unless it is cheaper: then it stays and this hour gives less. ``displace``: it always gives way.
        """
        here = self.hours[hour]
        if not car.home[hour] or (here.price is None and here.kind != "none"):
            return 0.0
        if car.blocked is not None and car.blocked[hour]:
            return 0.0
        if not dear and car.ceiling is not None and here.price is not None and here.price > car.ceiling + EPSILON:
            return 0.0
        holder = self.holder[hour]
        if (holder is not None and holder != car.vehicle_id) or self.taken(car, hour):
            return 0.0
        left = car.power * here.share - self.charge[car.vehicle_id][hour]
        if left <= EPSILON:
            return 0.0
        levels, stay_top, all_top = ctx
        charged, limit = self.charge[car.vehicle_id], self.limit[car.vehicle_id]
        kept = car.capacity
        if not displace:
            for later in range(hour + 1, self.count):
                if charged[later] > EPSILON and self.hours[later].cost < here.cost - EPSILON:
                    kept = min(kept, limit[later] - levels[later])
        # Under the cap until the car leaves, never over full, and no cheaper later charge pushed over its cap.
        return max(0.0, min(left, cap - stay_top[hour], car.capacity - all_top[hour], kept))

    def add(self, car: WeekCar, hour: int, kwh: float, why: str, cap: float) -> None:
        vid = car.vehicle_id
        if self.charge[vid][hour] <= EPSILON:
            self.limit[vid][hour] = cap
        else:
            self.limit[vid][hour] = max(self.limit[vid][hour], cap)
        self.charge[vid][hour] += kwh
        self.holder[hour] = vid
        if self.why[vid][hour] is None:
            self.why[vid][hour] = why
        # Later charges now over their cap give way, the earliest first.
        levels = self.level(car)
        lowered = 0.0
        for later in range(hour + 1, self.count):
            if self.charge[vid][later] <= EPSILON:
                continue
            over = levels[later] - lowered - self.limit[vid][later]
            if over > EPSILON:
                cut = min(self.charge[vid][later], over)
                self.charge[vid][later] -= cut
                lowered += cut
                if self.charge[vid][later] <= EPSILON:
                    self.charge[vid][later] = 0.0
                    self.why[vid][later] = None
                    if self.holder[later] == vid:
                        self.holder[later] = None

    def fill(
        self,
        car: WeekCar,
        hours: Sequence[int],
        wanted: float,
        cap: float,
        why: str,
        until: int,
        *,
        displace: bool = False,
        dear: bool = False,
    ) -> float:
        """Raise the battery just before ``until`` by ``wanted`` kWh with the cheapest of ``hours``.

        ``dear``: hours over the car's price ceiling count too (for what it must have at the least).
        """
        got = 0.0
        order = sorted((h for h in hours if h < until), key=lambda h: (self.hours[h].cost, -h))
        done: set[int] = set()
        while wanted - got > EPSILON:
            ctx = self.context(car)
            for hour in order:
                if hour in done:
                    continue
                give = self.room(car, hour, cap, ctx, displace=displace, dear=dear)
                if give <= EPSILON:
                    done.add(hour)
                    continue
                give = min(give, wanted - got)
                self.add(car, hour, give, why, cap)
                got += give
                done.add(hour)
                break
            else:
                break
        return got

    def stay(self, car: WeekCar, until: int) -> list[int]:
        """The hours at home in the stay that ends with leaving in ``until``."""
        out = []
        hour = until - 1
        while hour >= 0 and car.home[hour]:
            out.append(hour)
            hour -= 1
        return out[::-1]


def plan_week(
    cars: Sequence[WeekCar],
    hours: Sequence[Hour],
    day_of: Sequence[int],
    *,
    always: bool = False,
    window: Sequence[int | None] | None = None,
    holder: str | None = None,
) -> dict[str, CarWeek]:
    """The cheapest week for cars that share one charger (or one car alone).

    ``always``: every stay is filled to the preferred level (the old "every night"), for every car.
    ``window``: for each hour, the stretch it belongs to of hours the cable is not moved in (None: it may be);
    at a shared charger each stretch is one car's, the ``holder`` (plugged in now) keeping the one it is in.
    """
    plan = _Plan(cars, hours, day_of, window, holder)
    count = len(hours)
    every = range(count)
    short: dict[str, list[int]] = {car.vehicle_id: [] for car in cars}

    # 1. Enough at every departure: the hard day, the reserve and the minimum. In order of time.
    events = sorted(
        ((hour, index, need) for index, car in enumerate(cars) for hour, _day, need in plan.leaves[car.vehicle_id]),
        key=lambda event: (event[0], event[1]),
    )
    for hour, index, need in events:
        car = cars[index]
        wanted = max(car.minimum, need + car.reserve)
        missing = wanted - plan.before(car, hour)
        if missing <= EPSILON:
            continue
        cap = max(car.preferred[min(hour, count - 1)], wanted)
        got = plan.fill(car, every, missing, cap, WHY_NEED, hour)
        # Under the price ceiling if it can be; what it must have at the least, whatever the price.
        least = car.minimum - plan.before(car, hour)
        if missing - got > EPSILON and least > EPSILON:
            got += plan.fill(car, every, min(least, missing - got), cap, WHY_NEED, hour, dear=True)
        if missing - got > 0.05:
            short[car.vehicle_id].append(hour)

    # 2. Under the low-price limit: up to that level, at the published prices only.
    for car in cars:
        limit_price = car.low_price
        if limit_price is None or car.low_level is None:
            continue
        cheap = [
            h
            for h in every
            if hours[h].kind == "known" and (price := hours[h].price) is not None and price <= limit_price + EPSILON
        ]
        for hour in sorted(cheap, key=lambda h: (hours[h].cost, h)):
            room = plan.room(car, hour, car.low_level, plan.context(car))
            if room > EPSILON:
                plan.add(car, hour, room, WHY_LOW, car.low_level)

    # 3. A full charge when one is due: before the departure whose stay does it cheapest.
    full_at: dict[str, int | None] = {car.vehicle_id: None for car in cars}
    for car in cars:
        if car.full_level is None or car.full_due is None:
            continue
        best = None
        for hour, _day, _need in plan.leaves[car.vehicle_id]:
            if hour < car.full_due:
                continue
            stay = plan.stay(car, hour)
            missing = car.full_level - plan.before(car, hour)
            if not stay:
                continue
            slots = max(1, int(missing / max(car.power, 0.1)) + 1)
            prices = sorted(hours[h].cost for h in stay if plan.holder[h] in (None, car.vehicle_id))
            if len(prices) * car.power < missing:
                continue
            cost = sum(prices[:slots]) / slots
            if best is None or cost < best[0] - EPSILON:
                best = (cost, hour, stay, missing)
        if best is not None:
            _cost, hour, stay, missing = best
            if missing > EPSILON:
                plan.fill(car, stay, missing, car.full_level, WHY_FULL, hour, displace=True)
            full_at[car.vehicle_id] = hour

    # 4. The rest: every stay to the preferred level, or the week's cheapest hours when worth a charge.
    for car in cars:
        if car.fill or always:
            for hour, _day, _need in plan.leaves[car.vehicle_id]:
                stay = plan.stay(car, hour)
                cap = car.preferred[max(0, hour - 1)]
                missing = cap - plan.before(car, hour)
                if stay and missing > EPSILON:
                    plan.fill(car, stay, missing, cap, WHY_FILL, hour, displace=True)
            continue
        home = sorted(hours[h].cost for h in every if car.home[h] and hours[h].price is not None)
        if len(home) < 8:
            continue
        limit = home[int(len(home) * CHEAP_SHARE)]
        least = max(CHEAP_MIN_KWH, CHEAP_MIN_SHARE * car.capacity)
        cheap = sorted(
            (h for h in every if car.home[h] and hours[h].cost <= limit + EPSILON), key=lambda h: (hours[h].cost, -h)
        )
        # A run of cheap hours is one charge: only worth it when it adds enough together.
        ctx = plan.context(car)
        gain = {h: plan.room(car, h, car.preferred[h], ctx) for h in cheap}
        if sum(gain.values()) < least:
            continue
        for hour in cheap:
            give = plan.room(car, hour, car.preferred[hour], plan.context(car))
            if give > EPSILON:
                plan.add(car, hour, give, WHY_CHEAP, car.preferred[hour])
        # Small leftovers alone are not a charge: a stay that only gets a little of it gets none.
        for stay in stays(car.home):
            extra = [h for h in stay if plan.why[car.vehicle_id][h] == WHY_CHEAP]
            if extra and sum(plan.charge[car.vehicle_id][h] for h in extra) < least:
                for h in extra:
                    plan.charge[car.vehicle_id][h] = 0.0
                    plan.why[car.vehicle_id][h] = None
                    if plan.holder[h] == car.vehicle_id:
                        plan.holder[h] = None

    out = {}
    for car in cars:
        typical = plan.level(car)
        hard_used = [0.0] * count
        for hour, _day, need in plan.leaves[car.vehicle_id]:
            hard_used[hour] += need
        soc, hard = car.soc, []
        for hour in range(count):
            soc = min(car.capacity, max(0.0, soc - hard_used[hour] + plan.charge[car.vehicle_id][hour]))
            hard.append(soc)
        out[car.vehicle_id] = CarWeek(
            vehicle_id=car.vehicle_id,
            charge=[round(v, 3) for v in plan.charge[car.vehicle_id]],
            why=plan.why[car.vehicle_id],
            soc_hard=[round(v, 3) for v in hard],
            soc_typical=[round(max(0.0, v), 3) for v in typical],
            leaves=plan.leaves[car.vehicle_id],
            short=short[car.vehicle_id],
            full_at=full_at[car.vehicle_id],
        )
    return out


def stretches(hours: Sequence[Hour], window: tuple[int, int] | None) -> list[int | None] | None:
    """For each hour, the night (or other stretch) of hours the cable is not moved in that it belongs to.

    ``window``: from and to (hours of the day); a stretch over midnight belongs to the evening it starts.
    """
    if window is None:
        return None
    start, end = window
    out: list[int | None] = []
    for hour in hours:
        hod = hour.start.hour
        day = hour.start.date().toordinal()
        if start < end:
            out.append(day if start <= hod < end else None)
        elif hod >= start:
            out.append(day)
        elif hod < end:
            out.append(day - 1)
        else:
            out.append(None)
    return out


def stays(home: Sequence[bool]) -> list[list[int]]:
    """The runs of hours at home."""
    out: list[list[int]] = []
    for hour, here in enumerate(home):
        if not here:
            continue
        if out and out[-1][-1] == hour - 1:
            out[-1].append(hour)
        else:
            out.append([hour])
    return out


def runs(week: CarWeek) -> list[tuple[int, int]]:
    """The charges as runs of hours (start, end), a gap of an hour or less joined."""
    out: list[tuple[int, int]] = []
    for hour, kwh in enumerate(week.charge):
        if kwh <= EPSILON:
            continue
        if out and hour - out[-1][1] <= 1:
            out[-1] = (out[-1][0], hour + 1)
        else:
            out.append((hour, hour + 1))
    return out


def stay_end(home: Sequence[bool], hour: int = 0) -> int | None:
    """The hour the car next leaves, from ``hour`` on (None: home to the end of the week)."""
    for later in range(hour + 1, len(home)):
        if home[later - 1] and not home[later]:
            return later
    return None


def summary(week: CarWeek, car: WeekCar, hours: Sequence[Hour]) -> dict[str, Any]:
    """What the screens show of a car's week, in plain values."""
    charges: list[dict[str, Any]] = []
    for start, end in runs(week):
        kwh = sum(week.charge[start:end])
        cost = sum(week.charge[h] * (hours[h].price or 0.0) for h in range(start, end))
        whys = [week.why[h] for h in range(start, end) if week.why[h]]
        main = next((why for why in ORDER if why in whys), WHY_NEED)
        charges.append(
            {
                "start": hours[start].start.isoformat(),
                "end": (hours[end - 1].start + timedelta(hours=1)).isoformat(),
                "from": start,
                "to": end,
                "kwh": round(kwh, 1),
                "cost": round(cost, 2),
                "price": round(cost / kwh, 3) if kwh > EPSILON else None,
                "why": main,
                "level": round(week.soc_typical[end - 1] / car.capacity * 100, 1) if car.capacity else None,
                "guess": any(hours[h].kind != "known" for h in range(start, end)),
            }
        )
    return {
        "charges": charges,
        "kwh": [round(v, 2) for v in week.charge],
        "why": week.why,
        "hard": [round(v / car.capacity * 100, 1) for v in week.soc_hard] if car.capacity else [],
        "typical": [round(v / car.capacity * 100, 1) for v in week.soc_typical] if car.capacity else [],
        "home": [bool(v) for v in car.home],
        "leaves": [{"hour": h, "day": d, "need": round(n, 1)} for h, d, n in week.leaves],
        "short": week.short,
        "full_at": week.full_at,
        "cost": round(sum(c["cost"] for c in charges), 2),
    }


def replay(
    cars: Sequence[dict[str, Any]],
    prices: dict[str, Sequence[float | None]],
    first: datetime,
    days: int,
    style: dict[str, Any],
    *,
    horizon: int = 48,
    window: tuple[int, int] | None = None,
) -> dict[str, Any]:
    """The week plan played over days gone by: each noon a plan for the next two days, the first day of it done.

    ``cars``: each with its ``id``, ``capacity``, ``power``, ``minimum`` and ``target`` (kWh), what each day
    took (``used``: {iso day: kWh}), what each weekday takes on a hard and a typical day (``hard``,
    ``typical``: 7 values, Monday first) and when it is home (``home``: 7 by 24). What each day really took
    is driven; a day the battery did not have that (and a full battery would have) is a short day.
    """
    soc = {car["id"]: car["target"] for car in cars}
    charged: list[tuple[str, str]] = []
    short: list[tuple[str, str]] = []
    morning: list[float] = []
    for offset in range(days):
        start = first + timedelta(days=offset)
        hours, day_of = [], []
        for index in range(horizon):
            moment = start + timedelta(hours=index)
            row = prices.get(moment.date().isoformat()) or []
            price = row[moment.hour] if moment.hour < len(row) else None
            hours.append(Hour(moment, price, "known" if price is not None else "none"))
            day_of.append((moment.date() - start.date()).days)
        week_cars = []
        for car in cars:
            hard = [car["hard"][(start + timedelta(days=n)).weekday()] for n in range(4)]
            typical = [car["typical"][(start + timedelta(days=n)).weekday()] for n in range(4)]
            week_cars.append(
                WeekCar(
                    vehicle_id=car["id"],
                    capacity=car["capacity"],
                    soc=soc[car["id"]],
                    power=car["power"],
                    minimum=car["minimum"],
                    preferred=[car["target"]] * horizon,
                    hard=hard,
                    typical=typical,
                    reserve=style["reserve"] * car["capacity"],
                    home=[bool(car["home"][h.start.weekday()][h.start.hour]) for h in hours],
                    fill=bool(style.get("every")),
                )
            )
        plan = plan_week(week_cars, hours, day_of, always=bool(style.get("every")), window=stretches(hours, window))
        for car, week_car in zip(cars, week_cars, strict=True):
            week = plan[car["id"]]
            level = soc[car["id"]]
            leaves = {hour: day for hour, day, _need in week.leaves if hour < 24}
            done = False
            for hour in range(24):
                if hour in leaves:
                    day = (start + timedelta(days=leaves[hour])).date().isoformat()
                    took = float(car["used"].get(day) or 0.0)
                    morning.append(level / car["capacity"] * 100 if car["capacity"] else 0.0)
                    if took > level - 0.05 * car["capacity"] and took <= car["target"] - 0.05 * car["capacity"]:
                        short.append((day, car["id"]))
                    level = max(0.0, level - took)
                if week.charge[hour] > EPSILON:
                    level = min(week_car.capacity, level + week.charge[hour])
                    if not done:
                        charged.append((start.date().isoformat(), car["id"]))
                        done = True
            soc[car["id"]] = level
    weeks = max(days / 7, 1e-9)
    return {
        "per_week": round(len(charged) / weeks, 2),
        "per": {car["id"]: round(sum(1 for _, vid in charged if vid == car["id"]) / weeks, 2) for car in cars},
        "short": len(short),
        "short_days": short,
        "charged": charged,
        "morning": round(sum(morning) / len(morning), 1) if morning else 0.0,
        "days": days,
    }
