"""What Insight learns from its log, and what it expects: pure functions, no Home Assistant.

- ``needs``: what each of a car's days took (kWh), from its km and what a km costs at that temperature.
- ``quantile``: the kWh a weekday stays under ``p`` of the time; the same weekday counts three
  times, and newer weeks more than old ones.
- ``reach``: how many nights a car can do without the charger and still have enough for a hard day.
- ``choose``: which of the cars that share a charger gets it tonight, or none when a cheaper
  night is likely and both can wait.

The expectation never lowers a car under what a hard day takes. Simulated on a household's real
driving, charging only what tomorrow looked like left a car short some thirty mornings a year.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from math import erf, sqrt
from statistics import pstdev
from typing import Any

DEFAULT_KWH_KM = 0.18
HALF_LIFE_WEEKS = 6.0
SAME_WEEKDAY = 3.0
# Days of driving before a car's pattern is used for anything.
RIPE_DAYS = 28
RESERVE = 0.10
TOP = 0.80
LOOKAHEAD = 4
MIN_PROBABILITY = 0.70
# How careful the household wants it, from bold (0) to every night (5): what a hard day is, the reserve
# kept on top of it, how the days after tomorrow are counted, and whether a car that is not full gets the
# charger every night. 5 is how it chose before there was a choice.
STYLES: tuple[dict[str, Any], ...] = (
    {"level": 0.60, "reserve": 0.05, "rest": 0.5, "every": False},
    {"level": 0.70, "reserve": 0.05, "rest": 0.5, "every": False},
    {"level": 0.80, "reserve": 0.05, "rest": 0.5, "every": False},
    {"level": 0.90, "reserve": 0.10, "rest": 0.5, "every": False},
    {"level": 0.95, "reserve": 0.15, "rest": 0.5, "every": False},
    {"level": 0.90, "reserve": 0.10, "rest": 0.9, "every": True},
)
DEFAULT_STYLE = 3
# The forecast's error (relative, one standard deviation) a number of nights ahead, until it is learned.
DEFAULT_ERROR = (0.10, 0.17, 0.24, 0.31, 0.38, 0.45)
MILD = 15.0


def phi(value: float) -> float:
    return 0.5 * (1 + erf(value / sqrt(2)))


def efficiency(days: Mapping[str, Mapping[str, Any]]) -> tuple[float, float]:
    """kWh per km on a mild day, and how much more each degree under 15 °C costs (a share)."""
    rows = [
        (float(day["used"]) / float(day["km"]), day.get("temp"))
        for day in days.values()
        if (day.get("km") or 0) >= 20 and (day.get("used") or 0) > 0 and 0.08 <= day["used"] / day["km"] <= 0.45
    ]
    if len(rows) < 7:
        return DEFAULT_KWH_KM, 0.0
    mild = [value for value, temp in rows if temp is None or temp >= MILD - 5]
    base = sum(mild) / len(mild) if len(mild) >= 5 else sum(value for value, _ in rows) / len(rows)
    cold = [(MILD - float(temp), value / base - 1) for value, temp in rows if temp is not None and temp < MILD]
    slope = 0.0
    if len(cold) >= 10 and (weight := sum(degrees * degrees for degrees, _ in cold)) > 0:
        slope = sum(degrees * extra for degrees, extra in cold) / weight
    return round(base, 4), round(min(0.04, max(0.0, slope)), 4)


def cost_per_km(base: float, slope: float, temperature: float | None) -> float:
    return base * (1 + slope * max(0.0, MILD - temperature)) if temperature is not None else base


def needs(days: Mapping[str, Mapping[str, Any]], base: float, slope: float) -> list[tuple[date, float]]:
    """Each logged day as (day, kWh it took): km at that day's temperature, else what the battery fell."""
    out = []
    for key, day in days.items():
        try:
            moment = date.fromisoformat(key)
        except ValueError:
            continue
        if day.get("km") is not None:
            out.append((moment, float(day["km"]) * cost_per_km(base, slope, day.get("temp"))))
        elif day.get("used") is not None:
            out.append((moment, float(day["used"])))
    return sorted(out)


def quantile(history: Sequence[tuple[date, float]], weekday: int, p: float, today: date) -> float | None:
    """What a weekday stays under ``p`` of the time (kWh), weighing the same weekday and newer weeks most."""
    weighted = sorted(
        (
            value,
            0.5 ** (max(0, (today - day).days) / 7 / HALF_LIFE_WEEKS)
            * (SAME_WEEKDAY if day.weekday() == weekday else 1),
        )
        for day, value in history
    )
    total = sum(weight for _, weight in weighted)
    if not weighted or total <= 0:
        return None
    seen = 0.0
    for value, weight in weighted:
        seen += weight
        if seen >= p * total:
            return value
    return weighted[-1][0]


@dataclass
class CarOutlook:
    """A car tonight: what it has, what the coming days are expected to take, how long it can wait."""

    vehicle_id: str
    soc_kwh: float
    capacity: float
    target_kwh: float
    history: Sequence[tuple[date, float]]
    today: date
    level: float = 0.90
    known_need: float = 0.0  # a trip in the calendar tomorrow (kWh), which the pattern cannot know
    reserve: float = RESERVE  # kept on top of a hard day, of the battery
    rest: float = 0.9  # how the days after tomorrow are counted (0.5: a typical day)
    # The price from now till the morning, and in each of the coming days (morning to morning), at the
    # hours this car is usually home: by day as well as by night. None: the household's night prices count.
    now_price: float | None = None
    later: Sequence[float | None] | None = None

    @property
    def ripe(self) -> bool:
        return len(self.history) >= RIPE_DAYS

    def need(self, ahead: int, p: float) -> float:
        day = self.today + timedelta(days=ahead)
        return quantile(self.history, day.weekday(), p, self.today) or 0.0

    def floor(self, ahead: int = 1) -> float:
        """What the car must have the morning ``ahead`` days from now: a hard day and the reserve."""
        wanted = self.need(ahead, self.level) + self.reserve * self.capacity
        if ahead == 1:
            wanted = max(wanted, self.known_need)
        return min(self.target_kwh, wanted)

    @property
    def reach(self) -> int:
        """The nights the car can do without the charger (0: it must charge tonight)."""
        left = self.soc_kwh
        if left < self.floor(1) - 1e-6:
            return 0
        nights = 1
        for ahead in range(1, LOOKAHEAD):
            left -= self.need(ahead, self.rest)
            if left < self.floor(ahead + 1):
                break
            nights = ahead + 1
        return nights

    def as_dict(self) -> dict[str, Any]:
        return {
            "soc_kwh": round(self.soc_kwh, 1),
            "p50": round(self.need(1, 0.5), 1),
            "p90": round(self.need(1, 0.9), 1),
            "floor": round(self.floor(1), 1),
            "floor_pct": round(self.floor(1) / self.capacity * 100) if self.capacity else None,
            "reach": self.reach,
            "ripe": self.ripe,
            "now_price": self.now_price,
            "later": list(self.later) if self.later is not None else None,
        }


def chance_cheaper(tonight: float | None, later: Sequence[float | None], errors: Sequence[float]) -> float:
    """How likely one of the coming nights is cheaper than tonight, from the forecast and its error."""
    best = 0.0
    if tonight is None:
        return best
    for index, price in enumerate(later):
        if price is None or price <= 0:
            continue
        error = errors[min(index, len(errors) - 1)] if errors else DEFAULT_ERROR[min(index, 5)]
        best = max(best, phi((tonight - price) / (max(error, 0.01) * price)))
    return round(best, 3)


def choose(
    cars: Sequence[CarOutlook],
    tonight: float | None,
    later: Sequence[float | None],
    errors: Sequence[float],
    *,
    every: bool = True,
) -> dict[str, Any]:
    """Which car gets the charger tonight (``pick``), or none (``wait``), and why.

    Without ``every`` a car charges only the night it must, or when two would otherwise meet at the
    charger; with it, the car that is not full and reaches its floor first gets every night.
    """
    cars = [car for car in cars if car.ripe]
    if not cars:
        return {"pick": None, "wait": False, "reason": "learning", "both": False, "chance": 0.0}
    reach = {car.vehicle_id: car.reach for car in cars}
    must = [car for car in cars if reach[car.vehicle_id] == 0]
    shortest, longest = min(reach.values()), max(reach.values())

    # Each car against its own coming days, at the hours it is usually home (by day too): waiting needs a
    # cheaper chance for every car that is not full.
    def own(car: CarOutlook) -> float:
        if car.later is None:
            return chance_cheaper(tonight, later[: max(1, shortest - 1)], errors)
        mine = car.now_price if car.now_price is not None else tonight
        return chance_cheaper(mine, list(car.later)[: max(1, reach[car.vehicle_id] - 1)], errors)

    waiting = [car for car in cars if car.soc_kwh < car.target_kwh - 0.5] or cars
    chance = min(own(car) for car in waiting)
    result: dict[str, Any] = {"both": len(must) >= 2, "chance": chance, "wait": False}
    if must:
        pick = max(must, key=lambda car: (car.floor(1) - car.soc_kwh) / car.capacity)
        return {**result, "pick": pick.vehicle_id, "reason": "needed"}
    below = [car for car in cars if car.soc_kwh < car.target_kwh - 0.5]
    if not below:
        return {**result, "pick": None, "reason": "full"}
    if len(cars) > 1 and shortest <= 1 and shortest == longest:
        # Both reach their floor tomorrow night: take one of them now, so they do not meet at the charger.
        pick = min(below, key=lambda car: car.soc_kwh / car.capacity)
        return {**result, "pick": pick.vehicle_id, "reason": "apart"}
    if shortest >= 2 and (len(cars) == 1 or longest >= 3) and chance >= MIN_PROBABILITY:
        return {**result, "pick": None, "wait": True, "reason": "cheaper"}
    if not every:
        return {**result, "pick": None, "reason": "enough"}
    pick = min(below, key=lambda car: (reach[car.vehicle_id], car.soc_kwh / car.capacity))
    return {**result, "pick": pick.vehicle_id, "reason": "soonest"}


def home_share(
    trips: Iterable[tuple[datetime, datetime, str | None, str | None]], first: date, last: date, home: str = "home"
) -> list[list[float]]:
    """How often the car is home at each hour of each weekday (Monday first, 0 to 1), from its trips.

    Away from a trip that leaves home until one that comes back; ``trips`` in local time, oldest first.
    """
    away = [[0] * 24 for _ in range(7)]
    seen = [0] * 7
    out_at: datetime | None = None
    spans: list[tuple[datetime, datetime]] = []
    for start, end, origin, place in trips:
        if origin == home and out_at is None:
            out_at = start
        if place == home and out_at is not None:
            spans.append((out_at, end))
            out_at = None
    day = first
    while day <= last:
        seen[day.weekday()] += 1
        day += timedelta(days=1)
    for begin, end in spans:
        moment = begin.replace(minute=30, second=0, microsecond=0)
        if moment < begin:
            moment += timedelta(hours=1)
        while moment < end:
            if first <= moment.date() <= last:
                away[moment.weekday()][moment.hour] += 1
            moment += timedelta(hours=1)
    return [[1.0 - away[wd][hour] / seen[wd] if seen[wd] else 1.0 for hour in range(24)] for wd in range(7)]


def home_price(
    prices: Mapping[str, Sequence[float | None]],
    begin: datetime,
    end: datetime,
    share: Sequence[Sequence[float]] | None,
    hours: int = 3,
) -> float | None:
    """The mean of the cheapest hours from ``begin`` to ``end`` (local) at which the car is usually home."""
    known: list[float] = []
    moment = begin.replace(minute=0, second=0, microsecond=0)
    while moment < end:
        price = (prices.get(moment.date().isoformat()) or [None] * 24)[moment.hour]
        home = share is None or share[moment.weekday()][moment.hour] >= 0.5
        if price is not None and home:
            known.append(price)
        moment += timedelta(hours=1)
    if len(known) < hours:
        return None
    known.sort()
    return round(sum(known[:hours]) / hours, 4)


def night_price(
    prices: Mapping[str, Sequence[float | None]], day: date, start: int, end: int, hours: int = 3
) -> float | None:
    """The mean of the cheapest hours of the night that begins on ``day`` (from ``start`` to ``end`` o'clock)."""
    first = prices.get(day.isoformat()) or []
    second = prices.get((day + timedelta(days=1)).isoformat()) or []
    night = list(first[start:end]) if start < end else [*first[start:], *second[:end]]
    known = sorted(price for price in night if price is not None)
    if len(known) < hours:
        return None
    return round(sum(known[:hours]) / hours, 4)


def forecast_errors(
    forecasts: Mapping[str, Mapping[str, Any]], prices: Mapping[str, Sequence[float | None]]
) -> list[float]:
    """The forecast's relative error for each day ahead, where at least 48 hours can be compared."""
    found: dict[int, list[float]] = {}
    for made, forecast in forecasts.items():
        try:
            start = datetime.fromisoformat(str(forecast.get("start")))
            base = date.fromisoformat(made)
        except ValueError:
            continue
        for index, expected in enumerate(forecast.get("prices") or []):
            moment = start + timedelta(hours=index)
            actual = (prices.get(moment.date().isoformat()) or [None] * 24)[moment.hour]
            if expected is None or actual is None or actual <= 0.05:
                continue
            found.setdefault(max(1, (moment.date() - base).days), []).append((expected - actual) / actual)
    errors = []
    for ahead in range(1, 7):
        values = found.get(ahead) or []
        errors.append(round(max(0.03, pstdev(values)), 3) if len(values) >= 48 else DEFAULT_ERROR[ahead - 1])
    return errors


def score(
    ledger: Mapping[str, Mapping[str, Any]],
    days: Mapping[str, Mapping[str, Mapping[str, Any]]],
    prices: Mapping[str, Sequence[float | None]],
    needs_by_car: Mapping[str, Mapping[date, float]],
    window: tuple[int, int],
) -> dict[str, Any]:
    """How the expectations held: days under the hard-day figure, and what waiting would have saved."""
    hits = total = waits = 0
    saved = 0.0
    for key, entry in ledger.items():
        try:
            evening = date.fromisoformat(key)
        except ValueError:
            continue
        after = evening + timedelta(days=1)
        for vehicle_id, car in (entry.get("cars") or {}).items():
            actual = (needs_by_car.get(vehicle_id) or {}).get(after)
            if actual is None or car.get("p90") is None or not car.get("ripe"):
                continue
            total += 1
            hits += actual <= car["p90"] + 0.05
        if not entry.get("wait"):
            continue
        tonight = night_price(prices, evening, *window)
        nights = [night_price(prices, evening + timedelta(days=ahead), *window) for ahead in range(1, 4)]
        best = min((price for price in nights if price is not None), default=None)
        charged = sum(
            float((days.get(vehicle_id) or {}).get(after.isoformat(), {}).get("charged") or 0.0)
            for vehicle_id in entry.get("cars") or {}
        )
        if tonight is not None and best is not None:
            waits += 1
            saved += charged * (tonight - best)
    return {
        "scored": total,
        "hits": hits,
        "rate": round(hits / total, 3) if total else None,
        "waits": waits,
        "saved": round(saved, 2),
        "ripe": total >= 21 and hits / total >= 0.8,
    }


def backtest(
    history: Sequence[tuple[date, float]],
    today: date,
    days: int = 30,
    levels: Sequence[float] = (0.5, 0.6, 0.7, 0.8, 0.9),
) -> tuple[list[dict[str, Any]], list[dict[str, float]]]:
    """Each of the last days as it was expected the day before against what it took, and how often each level held."""
    rows: list[dict[str, Any]] = []
    hits = dict.fromkeys(levels, 0)
    for index, (day, actual) in enumerate(history):
        if (today - day).days > days or index < RIPE_DAYS:
            continue
        before = history[:index]
        low, high = quantile(before, day.weekday(), 0.1, day) or 0.0, quantile(before, day.weekday(), 0.9, day) or 0.0
        rows.append({"day": day.isoformat(), "p10": round(low, 1), "p90": round(high, 1), "actual": round(actual, 1)})
        for level in levels:
            hits[level] += actual <= (quantile(before, day.weekday(), level, day) or 0.0) + 0.05
    return rows, [{"said": level, "hit": round(hits[level] / len(rows), 3)} for level in levels] if rows else []


# ----------------------------------------------------------------------
# How careful: the steps fitted to the household's own driving.

STEP_DAYS = 90


def _pick(values: Sequence[float], p: float) -> float:
    """The value ``p`` of the way up the sorted values (as the panel picks it)."""
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = int(p * (len(ordered) - 1) + 0.5)
    return ordered[min(max(index, 0), len(ordered) - 1)]


def nights_a_week(style: Mapping[str, Any], cars: Sequence[Mapping[str, Any]]) -> float | None:
    """How many nights a week the cars would have charged with ``style``, played over their own days.

    ``cars``: each ``{"used": [kWh of each day, oldest first], "cap": kWh, "full": kWh, "weekday": the first
    day's weekday}``. The same rule as the evening's choice, and as the panel plays it.
    """
    if not cars:
        return None
    count = min(len(car["used"]) for car in cars)
    if count < 15:
        return None
    by_weekday = []
    for car in cars:
        lists: list[list[float]] = [[] for _ in range(7)]
        for day, used in enumerate(car["used"][:count]):
            lists[(car["weekday"] + day) % 7].append(used)
        by_weekday.append(lists)

    def need(i: int, day: int, p: float) -> float:
        return _pick(by_weekday[i][(cars[i]["weekday"] + day) % 7], p)

    soc = [float(car["full"]) for car in cars]
    charged = 0
    for day in range(count - 1):

        def floor(i: int, ahead: int, day: int = day) -> float:
            return float(min(cars[i]["full"], need(i, day + ahead, style["level"]) + style["reserve"] * cars[i]["cap"]))

        def reach(i: int, day: int = day) -> int:
            left = soc[i]
            if left < floor(i, 1) - 1e-6:
                return 0
            nights = 1
            for ahead in range(1, 4):
                left -= need(i, day + ahead, style["rest"])
                if left < floor(i, ahead + 1):
                    break
                nights = ahead + 1
            return nights

        nights = [reach(i) for i in range(len(cars))]
        must = [i for i, value in enumerate(nights) if value == 0]
        below = [i for i in range(len(cars)) if soc[i] < cars[i]["full"] - 0.5]

        def share(i: int) -> float:
            return float(soc[i] / cars[i]["cap"])

        pick = None
        if must:
            pick = max(must, key=lambda i: (floor(i, 1) - soc[i]) / cars[i]["cap"])
        elif len(cars) > 1 and min(nights) <= 1 and min(nights) == max(nights) and below:
            pick = min(below, key=share)
        elif style["every"] and below:
            pick = min(below, key=lambda i: (nights[i], share(i)))
        if pick is not None:
            soc[pick] = max(soc[pick], cars[pick]["full"])
            charged += 1
        for i, car in enumerate(cars):
            soc[i] = max(0.0, soc[i] - car["used"][day + 1])
    return charged / ((count - 1) / 7)


def fitted_styles(cars: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]] | None:
    """Steps 0-4 so that each is about one night a week more than the one before, on the household's own days.

    "Every night" stays the last step. None without enough driving to play over.
    """
    every = nights_a_week(STYLES[-1], cars)
    if every is None:
        return None
    # What a hard day is, and above all the reserve kept on top of it, decide how often a car charges.
    tried: list[tuple[float, dict[str, Any]]] = []
    for level in (0.6, 0.7, 0.8, 0.9, 0.95):
        for percent in range(5, 61):
            style = {"level": level, "reserve": percent / 100, "rest": 0.5, "every": False}
            nights = nights_a_week(style, cars)
            if nights is not None:
                tried.append((nights, style))
    if not tried:
        return None
    low = min(nights for nights, _ in tried)
    high = min(every - 0.5, max(nights for nights, _ in tried))
    step = 1.0 if high - low >= 4 else max(0.0, high - low) / 4
    chosen: list[dict[str, Any]] = []
    last = low
    for k in range(5):
        want = low + k * step
        later = [(nights, style) for nights, style in tried if nights >= last - 1e-9]
        nights, style = min(later, key=lambda item: (abs(item[0] - want), item[1]["reserve"], item[1]["level"]))
        chosen.append(style)
        last = nights
    return [*chosen, dict(STYLES[-1])]
