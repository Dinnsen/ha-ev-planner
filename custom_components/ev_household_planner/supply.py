"""Shared supply: several cars behind one fuse, planned together.

Pure Python, no Home Assistant. The house comes first: what it is expected
to draw (learned from a meter, or a fixed reserve) is taken from the limit,
and the rest is shared between the cars, a slot at a time, cheapest slots
first. Every car first gets what it must have by its ready-by time, then
what it would like, in order of priority.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from .planner import PriceSlot

VOLTS = 230.0
MIN_AMPS = 6.0  # the least a charger can give (IEC 61851)
# The house: the 80th percentile of what it drew at the same hour on recent days.
FORECAST_SHARE = 0.8
FORECAST_DAYS = 14
# The weather: how many more amps the house draws for each degree colder, learned from its own
# hours. Only with enough hours and enough spread in the temperature, never more than MAX_SLOPE,
# and never further than WEATHER_REACH degrees beyond the temperatures it has seen.
MIN_WEATHER_HOURS = 24
MIN_WEATHER_SPREAD = 1.0  # °C, as a standard deviation around each hour's own mean
MAX_SLOPE = 1.0  # A per °C
WEATHER_REACH = 10.0  # °C
# A plan on a shared supply aims to be done this long before the ready-by time,
# so the house can take what it needs on the way; the last stretch is for catching up.
BUFFER = timedelta(hours=1)
EPSILON = 1e-6


def kw(amps: float, phases: int) -> float:
    """Power in kW at ``amps`` per phase."""
    return amps * VOLTS * phases / 1000


def amps_for(kw_value: float, phases: int) -> float:
    return kw_value * 1000 / (VOLTS * phases)


# ----------------------------------------------------------------------
# The house


@dataclass(slots=True)
class HouseForecast:
    """What the house draws (amps on its busiest phase), learned per hour.

    Kept apart for cheap hours (the cheapest third of the day's prices), since
    a heat pump or a water heater on a price plan runs then, and for the rest.
    With the weather, each hour also keeps the temperature it had, and the
    house's answer to the cold (amps per degree) is learned from all hours
    together: a cold night after mild weeks is then expected to draw more.
    """

    samples: dict[str, list[float]] = field(default_factory=dict)
    temps: dict[str, list[float | None]] = field(default_factory=dict)  # line up with the last samples
    slope: float | None = None  # amps per °C (negative: more when colder), None until it is known

    @staticmethod
    def _key(hour: int, cheap: bool) -> str:
        return f"{hour:02d}{'c' if cheap else 'n'}"

    def add(self, hour: int, cheap: bool, amps: float, temperature: float | None = None) -> None:
        key = self._key(hour, cheap)
        values = self.samples.setdefault(key, [])
        values.append(round(max(0.0, amps), 2))
        del values[:-FORECAST_DAYS]
        temps = self.temps.setdefault(key, [])
        temps.append(None if temperature is None else round(temperature, 1))
        del temps[: max(0, len(temps) - len(values))]
        self.slope = self._slope()

    def _pairs(self, key: str) -> list[tuple[float, float]]:
        """(temperature, amps) for the hours of ``key`` that have both."""
        temps = self.temps.get(key) or []
        values = self.samples.get(key) or []
        if not temps or len(temps) > len(values):
            return []
        return [(t, a) for t, a in zip(temps, values[-len(temps) :], strict=True) if t is not None]

    def _slope(self) -> float | None:
        """Amps per °C from all hours, each around its own mean, or None without enough to go on."""
        top = bottom = 0.0
        count = 0
        for key in self.samples:
            pairs = self._pairs(key)
            if len(pairs) < 3:
                continue
            mean_t = sum(t for t, _a in pairs) / len(pairs)
            mean_a = sum(a for _t, a in pairs) / len(pairs)
            top += sum((t - mean_t) * (a - mean_a) for t, a in pairs)
            bottom += sum((t - mean_t) ** 2 for t, _a in pairs)
            count += len(pairs)
        if count < MIN_WEATHER_HOURS or bottom / count < MIN_WEATHER_SPREAD**2:
            return None
        return max(-MAX_SLOPE, min(0.0, top / bottom))

    def predict(self, hour: int, cheap: bool, reserve: float, temperature: float | None = None) -> float:
        """The house at ``hour``: the 80th percentile of its days, else of the other kind of hour, else ``reserve``.

        With the temperature expected then, the hour is moved by the house's
        answer to the cold, from the temperature its days had.
        """
        for key in (self._key(hour, cheap), self._key(hour, not cheap)):
            values = sorted(self.samples.get(key, []))
            if len(values) >= 3:
                amps = values[min(len(values) - 1, int(FORECAST_SHARE * len(values)))]
                pairs = self._pairs(key)
                if temperature is None or self.slope is None or len(pairs) < 3:
                    return amps
                seen = [t for t, _a in pairs]
                temperature = max(min(seen) - WEATHER_REACH, min(max(seen) + WEATHER_REACH, temperature))
                return max(0.0, amps + self.slope * (temperature - sum(seen) / len(seen)))
        return reserve

    def to_dict(self) -> dict[str, Any]:
        return {
            **{key: list(values) for key, values in self.samples.items()},
            "temps": {key: list(values) for key, values in self.temps.items()},
        }

    @classmethod
    def from_dict(cls, data: Any) -> HouseForecast:
        if not isinstance(data, dict):
            return cls()
        forecast = cls(
            {
                str(k): [float(v) for v in values][-FORECAST_DAYS:]
                for k, values in data.items()
                if isinstance(values, list)
            }
        )
        temps = data.get("temps")
        if isinstance(temps, dict):
            for key, values in temps.items():
                count = len(forecast.samples.get(str(key)) or [])
                if count and isinstance(values, list):
                    clean = [float(v) if isinstance(v, int | float) else None for v in values]
                    forecast.temps[str(key)] = clean[-count:]
        forecast.slope = forecast._slope()
        return forecast


def cheap_hours(slots: Sequence[PriceSlot]) -> set[datetime]:
    """The starts of the cheapest third of the slots of each day."""
    days: dict[Any, list[PriceSlot]] = {}
    for slot in slots:
        days.setdefault(slot.start.date(), []).append(slot)
    cheap: set[datetime] = set()
    for day in days.values():
        ranked = sorted(day, key=lambda slot: slot.price)
        cheap.update(slot.start for slot in ranked[: max(1, len(ranked) // 3)])
    return cheap


# ----------------------------------------------------------------------
# The plan


@dataclass(slots=True)
class SharedCar:
    """A plugged-in car on the shared supply."""

    vehicle_id: str
    must_kwh: float  # from the wall, by the ready-by time
    want_kwh: float  # from the wall, to the target (at least ``must_kwh``)
    max_amps: float
    deadline: datetime | None
    priority: int = 1  # 0 comes first
    phases: int = 3
    adjustable: bool = True  # False: the charger can only be on (at full current) or off
    min_amps: float = MIN_AMPS


@dataclass(slots=True)
class SupplyPlan:
    """Amps per car per slot, and what could not be fitted."""

    amps: dict[str, list[tuple[datetime, datetime, float]]]
    short_kwh: dict[str, float]
    capacity: list[tuple[datetime, datetime, float, float]]  # start, end, limit, expected house

    def segments(self, vehicle_id: str) -> list[dict[str, datetime]]:
        merged: list[dict[str, datetime]] = []
        for start, end, amps in sorted(self.amps.get(vehicle_id, [])):
            if amps <= 0:
                continue
            if merged and merged[-1]["end"] == start:
                merged[-1]["end"] = end
            else:
                merged.append({"start": start, "end": end})
        return merged

    def amps_at(self, vehicle_id: str, moment: datetime) -> float | None:
        for start, end, amps in self.amps.get(vehicle_id, []):
            if start <= moment < end:
                return amps
        return None


def plan_supply(
    slots: Sequence[PriceSlot],
    cars: Sequence[SharedCar],
    now: datetime,
    *,
    limit: float,
    house: Callable[[PriceSlot], float],
) -> SupplyPlan:
    """Share ``limit`` amps (per phase) between ``cars`` over ``slots``, the house first.

    Two rounds over the slots, cheapest first (earlier first at the same
    price): every car's ``must_kwh``, then the rest up to ``want_kwh``. In a
    slot the cars take their turn by priority, then by the earliest ready-by
    time. A car takes what it still needs, at most its own maximum, and never
    less than a charger can give; a car that can only be on or off takes its
    full current or waits.
    """
    usable = [slot for slot in slots if slot.end > now]
    capacity: dict[datetime, float] = {}
    shown: list[tuple[datetime, datetime, float, float]] = []
    for slot in usable:
        expected = max(0.0, house(slot))
        capacity[slot.start] = max(0.0, limit - expected)
        shown.append((slot.start, slot.end, limit, expected))
    amps: dict[str, dict[datetime, float]] = {car.vehicle_id: {} for car in cars}
    left_must = {car.vehicle_id: max(0.0, car.must_kwh) for car in cars}
    left_want = {car.vehicle_id: max(0.0, car.want_kwh - car.must_kwh) for car in cars}
    order = sorted(cars, key=lambda car: (car.priority, car.deadline or datetime.max.replace(tzinfo=now.tzinfo)))
    ranked = sorted(usable, key=lambda slot: (slot.price, slot.start))

    for left in (left_must, left_want):
        for slot in ranked:
            start = max(slot.start, now)
            hours = (slot.end - start).total_seconds() / 3600
            if hours <= EPSILON:
                continue
            for car in order:
                need = left[car.vehicle_id]
                if need <= EPSILON or (car.deadline is not None and slot.end > car.deadline + timedelta(seconds=1)):
                    continue
                room = capacity[slot.start]
                given = amps[car.vehicle_id].get(slot.start, 0.0)
                top = min(car.max_amps - given, room)
                if car.adjustable:
                    wanted = min(top, amps_for(need / hours, car.phases))
                    if given + wanted < car.min_amps:
                        wanted = car.min_amps - given if top >= car.min_amps - given else 0.0
                else:
                    wanted = car.max_amps if given == 0 and room >= car.max_amps - EPSILON else 0.0
                if wanted <= EPSILON:
                    continue
                amps[car.vehicle_id][slot.start] = given + wanted
                capacity[slot.start] = room - wanted
                left[car.vehicle_id] = max(0.0, need - kw(wanted, car.phases) * hours)

    ends = {slot.start: slot.end for slot in usable}
    return SupplyPlan(
        amps={
            vid: sorted((start, ends[start], round(value, 1)) for start, value in per.items() if value > EPSILON)
            for vid, per in amps.items()
        },
        short_kwh={vid: round(left_must[vid] + left_want[vid], 2) for vid in amps},
        capacity=shown,
    )
