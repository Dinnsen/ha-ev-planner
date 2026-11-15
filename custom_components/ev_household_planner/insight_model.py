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

from collections.abc import Mapping, Sequence
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

    @property
    def ripe(self) -> bool:
        return len(self.history) >= RIPE_DAYS

    def need(self, ahead: int, p: float) -> float:
        day = self.today + timedelta(days=ahead)
        return quantile(self.history, day.weekday(), p, self.today) or 0.0

    def floor(self, ahead: int = 1) -> float:
        """What the car must have the morning ``ahead`` days from now: a hard day and the reserve."""
        wanted = self.need(ahead, self.level) + RESERVE * self.capacity
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
            left -= self.need(ahead, 0.9)
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
    cars: Sequence[CarOutlook], tonight: float | None, later: Sequence[float | None], errors: Sequence[float]
) -> dict[str, Any]:
    """Which car gets the charger tonight (``pick``), or none (``wait``), and why."""
    cars = [car for car in cars if car.ripe]
    if not cars:
        return {"pick": None, "wait": False, "reason": "learning", "both": False, "chance": 0.0}
    reach = {car.vehicle_id: car.reach for car in cars}
    must = [car for car in cars if reach[car.vehicle_id] == 0]
    shortest, longest = min(reach.values()), max(reach.values())
    chance = chance_cheaper(tonight, later[: max(1, shortest - 1)], errors)
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
    pick = min(below, key=lambda car: (reach[car.vehicle_id], car.soc_kwh / car.capacity))
    return {**result, "pick": pick.vehicle_id, "reason": "soonest"}


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
