"""How fast a car really charges, learned from its own charges.

Pure Python without Home Assistant imports. A planner that works from the
battery size, the charging power and a guess at the losses is wrong as soon as
one of them is: a car that draws 9.6 kW instead of 11, or a battery smaller
than the number plate says. The charging speed in % per hour that the car
shows is all of them at once, so it is what the plan is made from.

* The speed is measured over the charging time between two charge level
  readings, so a car that pauses between periods is measured right, and the
  delay before a car reports a new level counts at both ends alike.
* Only a rise of at least ``MIN_RISE`` percentage points counts. A charge
  level in whole percent is then at most a few percent off.
* A finished measurement moves the learned speed part of the way, so a single
  odd charge (a cold battery, a charger that was shared) does not take over.
* A charge that has risen ``MIN_RISE`` already plans with what it shows, so a
  car that is charged with another current is followed the same night.

The charging power, as the car reports it, is learned in the same way. It only
decides the energy and the price; the time comes from the speed.

Many cars charge slower near the top. The speed is therefore also learned per
band of the charge level (``BANDS``), from the readings inside each band, so a
plan to 100 % gives the last per cent the time they really take.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

# A measurement counts from a rise of this many percentage points.
MIN_RISE = 30.0
# The weight a new measurement gets against what was learned before.
NEW_WEIGHT = 0.3
# The charging power counts from this much charging time with readings (hours).
MIN_POWER_HOURS = 0.25
# Readings below this are a car that is not really charging (kW).
MIN_POWER_KW = 0.5
# Speeds outside this range are a broken sensor, not a car (% per hour).
SPEED_RANGE = (0.5, 400.0)
# The most a plan aims to be done before the ready-by time (minutes), and how many mornings
# on time in a row bring it a quarter of an hour closer again.
MAX_MARGIN = 60
ON_TIME_MORNINGS = 3
# A car that has not charged again after a pause this many times charges in one go.
RESUME_FAILURES = 2
# Bands of the charge level with a speed of their own (%): many cars slow down near the top.
BANDS: tuple[tuple[float, float], ...] = ((0.0, 50.0), (50.0, 80.0), (80.0, 90.0), (90.0, 100.0))
# A band's speed counts from a rise of this many percentage points inside it.
MIN_BAND_RISE = 5.0
# At most this many readings are kept for the bands (one per whole per cent is plenty).
MAX_READINGS = 120


def band_key(band: tuple[float, float]) -> str:
    return f"{band[0]:g}-{band[1]:g}"


def band_speeds(readings: list[tuple[float, float]]) -> dict[str, float]:
    """The speed (% per hour) in each band, from (charge level, charging seconds) readings.

    Only readings inside a band count for it, so the time a car spends below
    or above the band is never part of its speed.
    """
    speeds: dict[str, float] = {}
    for band in BANDS:
        low, high = band
        inside = [(soc, seconds) for soc, seconds in readings if low <= soc <= high]
        if len(inside) < 2:
            continue
        (first_soc, first_seconds), (last_soc, last_seconds) = inside[0], inside[-1]
        rise, hours = last_soc - first_soc, (last_seconds - first_seconds) / 3600
        if rise + 1e-9 < MIN_BAND_RISE or hours <= 0:
            continue
        speed = rise / hours
        if SPEED_RANGE[0] <= speed <= SPEED_RANGE[1]:
            speeds[band_key(band)] = speed
    return speeds


SOURCE_MEASURING = "measuring"
SOURCE_LEARNED = "learned"
SOURCE_IMPORTED = "imported"
SOURCE_ESTIMATED = "estimated"


def blend(old: float | None, new: float) -> float:
    """``new`` folded into what was learned; the first one is taken as it is."""
    return new if old is None else old * (1 - NEW_WEIGHT) + new * NEW_WEIGHT


def _readings(value: Any) -> list[tuple[float, float]]:
    result: list[tuple[float, float]] = []
    for item in value if isinstance(value, list) else []:
        if isinstance(item, list | tuple) and len(item) == 2:
            soc, seconds = _float(item[0]), _float(item[1])
            if soc is not None and seconds is not None:
                result.append((soc, seconds))
    return result


def _float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None  # NaN


@dataclass(slots=True)
class ChargeMeter:
    """What a car has shown since it was plugged in.

    ``charging_seconds`` counts only the time the car charged. A charge level
    reading is stored with the charging time at that moment, so the time
    between two readings is the charging time between them.
    """

    charging_seconds: float = 0.0
    first_soc: float | None = None
    first_seconds: float = 0.0
    last_soc: float | None = None
    last_seconds: float = 0.0
    power_kwh: float = 0.0
    power_seconds: float = 0.0
    # Every rise of the level with the charging time at that moment, for the speed per band.
    readings: list[tuple[float, float]] = field(default_factory=list)
    # The car was turned down below its full current while it charged (for the house): its speed and
    # power then say what it was given, not what it can take, and are not learned from.
    throttled: bool = False

    def tick(self, seconds: float, charging: bool, power_kw: float | None = None) -> None:
        """Count ``seconds`` of time, and the reported power while charging."""
        if not charging or seconds <= 0:
            return
        self.charging_seconds += seconds
        if power_kw is not None and power_kw >= MIN_POWER_KW:
            self.power_kwh += power_kw * seconds / 3600
            self.power_seconds += seconds

    def reading(self, soc: float) -> None:
        """A new charge level from the car.

        Readings before the car has charged at all are left out: the level
        the car had when it was plugged in may be old.
        """
        if self.charging_seconds <= 0:
            return
        if self.last_soc is not None and soc < self.last_soc - 1:
            # The level fell: the car was used without charging (driven off without
            # being seen unplugged, or warmed up from the battery). Start over, so
            # that time is not counted; the next charge is measured from its own start.
            self.reset()
            return
        if self.first_soc is None:
            self.first_soc, self.first_seconds = soc, self.charging_seconds
            self.last_soc, self.last_seconds = soc, self.charging_seconds
            self.readings = [(soc, self.charging_seconds)]
            return
        if self.last_soc is None or soc > self.last_soc:
            self.last_soc, self.last_seconds = soc, self.charging_seconds
            self.readings.append((soc, self.charging_seconds))
            if len(self.readings) > MAX_READINGS:
                del self.readings[1]

    def reset(self) -> None:
        """Forget everything measured so far."""
        self.charging_seconds = self.first_seconds = self.last_seconds = 0.0
        self.first_soc = self.last_soc = None
        self.power_kwh = self.power_seconds = 0.0
        self.readings = []
        self.throttled = False

    @property
    def rise(self) -> float:
        if self.first_soc is None or self.last_soc is None:
            return 0.0
        return self.last_soc - self.first_soc

    @property
    def speed(self) -> float | None:
        """The measured speed (% per hour), once the level has risen ``MIN_RISE``."""
        hours = (self.last_seconds - self.first_seconds) / 3600
        if self.rise + 1e-9 < MIN_RISE or hours <= 0:
            return None
        speed = self.rise / hours
        return speed if SPEED_RANGE[0] <= speed <= SPEED_RANGE[1] else None

    @property
    def power(self) -> float | None:
        """The average reported charging power (kW), once there is enough of it."""
        if self.power_seconds < MIN_POWER_HOURS * 3600:
            return None
        return self.power_kwh / (self.power_seconds / 3600)

    def to_dict(self) -> dict[str, Any]:
        return {
            "charging_seconds": round(self.charging_seconds, 1),
            "first_soc": self.first_soc,
            "first_seconds": round(self.first_seconds, 1),
            "last_soc": self.last_soc,
            "last_seconds": round(self.last_seconds, 1),
            "power_kwh": round(self.power_kwh, 4),
            "power_seconds": round(self.power_seconds, 1),
            "readings": [[soc, round(seconds, 1)] for soc, seconds in self.readings],
            "throttled": self.throttled,
        }

    @classmethod
    def from_dict(cls, data: Any) -> ChargeMeter:
        if not isinstance(data, Mapping):
            return cls()
        return cls(
            charging_seconds=_float(data.get("charging_seconds")) or 0.0,
            first_soc=_float(data.get("first_soc")),
            first_seconds=_float(data.get("first_seconds")) or 0.0,
            last_soc=_float(data.get("last_soc")),
            last_seconds=_float(data.get("last_seconds")) or 0.0,
            power_kwh=_float(data.get("power_kwh")) or 0.0,
            power_seconds=_float(data.get("power_seconds")) or 0.0,
            readings=_readings(data.get("readings")),
            throttled=bool(data.get("throttled")),
        )


@dataclass(slots=True)
class Learned:
    """What a car has taught EV Planner, and the setup it was learned with.

    ``basis`` is the battery capacity and charging power from the car's setup.
    When either is changed, what was learned is dropped and learning starts
    over, so a wrong figure that has been corrected leaves nothing behind.
    """

    speed: float | None = None
    speed_count: int = 0
    power: float | None = None
    power_count: int = 0
    basis: tuple[float, float] | None = None
    # Whether the car charges again after a pause in a plan: None until it has shown it.
    resumes: bool | None = None
    resume_failures: int = 0
    # The speed (% per hour) per band of the charge level, and from how many charges.
    curve: dict[str, float] = field(default_factory=dict)
    curve_counts: dict[str, int] = field(default_factory=dict)
    # Minutes before the ready-by time a plan aims to be done, learned from mornings the car was late.
    margin: int = 0
    on_time: int = 0

    def add(self, meter: ChargeMeter) -> bool:
        """Fold in a measurement; True when the speed was part of it. A turned-down charge teaches nothing."""
        learned_speed = False
        if meter.throttled:
            return False
        if (speed := meter.speed) is not None:
            self.speed = blend(self.speed, speed)
            self.speed_count += 1
            learned_speed = True
        if (power := meter.power) is not None:
            self.power = blend(self.power, power)
            self.power_count += 1
        for key, speed in band_speeds(meter.readings).items():
            self.curve[key] = blend(self.curve.get(key), speed)
            self.curve_counts[key] = self.curve_counts.get(key, 0) + 1
        return learned_speed

    def speeds(self) -> tuple[tuple[float, float, float], ...]:
        """The learned bands as (from %, to %, speed), for the planner."""
        return tuple(
            (low, high, self.curve[band_key((low, high))]) for low, high in BANDS if band_key((low, high)) in self.curve
        )

    def morning(self, short_minutes: float) -> bool:
        """How a morning went: ``short_minutes`` of charging the car still lacked at its ready-by time.

        Late: aim that much earlier from now on (in whole quarters, at most an
        hour). On time three mornings in a row: a quarter later again. Returns
        True when the margin changed.
        """
        before = self.margin
        if short_minutes > 1:
            quarters = -(-short_minutes // 15)
            self.margin = int(min(MAX_MARGIN, self.margin + quarters * 15))
            self.on_time = 0
        else:
            self.on_time += 1
            if self.on_time >= ON_TIME_MORNINGS and self.margin > 0:
                self.margin, self.on_time = max(0, self.margin - 15), 0
        return self.margin != before

    def resumed(self) -> None:
        """The car took up charging again after a pause."""
        self.resumes, self.resume_failures = True, 0

    def did_not_resume(self) -> bool:
        """The car did not charge again after a pause; True when it is now known not to.

        Once can be a car that was asleep or a charger that was busy, so it
        takes ``RESUME_FAILURES`` times before the car charges in one go.
        """
        self.resume_failures += 1
        if self.resume_failures >= RESUME_FAILURES and self.resumes is not False:
            self.resumes = False
            return True
        return False

    def forget_resume(self) -> None:
        self.resumes, self.resume_failures = None, 0

    def check_basis(self, basis: tuple[float, float]) -> bool:
        """Start over when the setup changed; True when something was dropped."""
        if self.basis == basis:
            return False
        dropped = self.basis is not None and (self.speed is not None or self.power is not None)
        if self.basis is not None:
            self.speed, self.speed_count, self.power, self.power_count = None, 0, None, 0
            self.curve, self.curve_counts = {}, {}
        self.basis = basis
        return dropped

    def to_dict(self) -> dict[str, Any]:
        return {
            "speed": None if self.speed is None else round(self.speed, 3),
            "speed_count": self.speed_count,
            "power": None if self.power is None else round(self.power, 3),
            "power_count": self.power_count,
            "basis": list(self.basis) if self.basis is not None else None,
            "resumes": self.resumes,
            "resume_failures": self.resume_failures,
            "curve": {key: round(value, 3) for key, value in self.curve.items()},
            "curve_counts": dict(self.curve_counts),
            "margin": self.margin,
            "on_time": self.on_time,
        }

    @classmethod
    def from_dict(cls, data: Any) -> Learned:
        if not isinstance(data, Mapping):
            return cls()
        basis = data.get("basis")
        parsed: tuple[float, float] | None = None
        if isinstance(basis, list | tuple) and len(basis) == 2:
            first, second = _float(basis[0]), _float(basis[1])
            if first is not None and second is not None:
                parsed = (first, second)
        speed = _float(data.get("speed"))
        power = _float(data.get("power"))
        resumes = data.get("resumes")
        return cls(
            speed=speed if speed is not None and speed > 0 else None,
            speed_count=int(_float(data.get("speed_count")) or 0),
            power=power if power is not None and power > 0 else None,
            power_count=int(_float(data.get("power_count")) or 0),
            basis=parsed,
            resumes=resumes if isinstance(resumes, bool) else None,
            resume_failures=int(_float(data.get("resume_failures")) or 0),
            curve=_curve(data.get("curve")),
            curve_counts={key: int(_float(value) or 0) for key, value in (data.get("curve_counts") or {}).items()}
            if isinstance(data.get("curve_counts"), Mapping)
            else {},
            margin=int(min(MAX_MARGIN, max(0.0, _float(data.get("margin")) or 0))),
            on_time=int(_float(data.get("on_time")) or 0),
        )


def _curve(value: Any) -> dict[str, float]:
    if not isinstance(value, Mapping):
        return {}
    known = {band_key(band) for band in BANDS}
    result: dict[str, float] = {}
    for key, raw in value.items():
        speed = _float(raw)
        if key in known and speed is not None and SPEED_RANGE[0] <= speed <= SPEED_RANGE[1]:
            result[str(key)] = speed
    return result
