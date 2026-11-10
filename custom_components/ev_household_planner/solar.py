"""Charging on the sun: the surplus, when a car may take it, at what current and on how many phases.

Pure Python, no Home Assistant. The surplus is what the house sends to the
grid, plus what the cars charging on the sun already take, plus what the
home battery takes once it is full enough to share. A car starts when there
has been enough for a minute, follows the surplus with its current, and
stops when there has been too little for a few minutes, so a cloud does not
switch it on and off. A charger that can switch between one and three phases
uses one phase when the surplus is small.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from .vehicle import elapsed

VOLTS = 230.0
MIN_AMPS = 6.0
# Enough sun for this long before a car starts, too little for this long before it stops.
ENABLE_DELAY = timedelta(minutes=1)
DISABLE_DELAY = timedelta(minutes=4)
# A change of phases at most this often: a charger pauses to switch.
PHASE_EVERY = timedelta(minutes=15)
# Kept back from the surplus, so the house does not buy for a car by a small margin.
RESERVE_KW = 0.1
# A car's current follows the surplus in whole amps. It goes down at once when the house would buy,
# up only when there has been room for a while, and not more often than this, so a passing cloud
# costs two changes and the charger's cloud is not asked too often.
RAISE_DELAY = timedelta(minutes=2)
RAISE_EVERY = timedelta(minutes=5)
# Up only to what the sun has given most of the time over this long (the low end of it), so a
# day of passing clouds costs few changes but the car still takes the sun between them.
RAISE_WINDOW = timedelta(minutes=10)
RAISE_SHARE = 0.3
# Of the sun the forecast promises before the ready-by time, the plan counts on this share at most.
FORECAST_TRUST = 0.5

# The modes (``const.SOLAR_*``): off; the sun when it shines and the plan for the rest; only the sun.


def min_kw(phases: int) -> float:
    """The least a charger can take on ``phases``."""
    return MIN_AMPS * VOLTS * phases / 1000


def amps_for(kw: float, phases: int) -> float:
    return kw * 1000 / (VOLTS * phases)


def surplus_kw(
    grid_kw: float,
    *,
    cars_kw: float,
    battery_kw: float | None = None,
    battery_soc: float | None = None,
    battery_first_until: float = 100.0,
) -> float:
    """What the cars charging on the sun could take now.

    ``grid_kw`` is what the house draws from the grid (negative when it sends
    to it); ``cars_kw`` what the cars charging on the sun draw now. A home
    battery that discharges is not sun; one that charges keeps what it takes
    until it is at ``battery_first_until``, then shares it with the cars.
    """
    surplus = -grid_kw + cars_kw - RESERVE_KW
    shares = battery_soc is not None and battery_soc >= battery_first_until
    if battery_kw is not None and (battery_kw < 0 or shares):
        surplus += battery_kw
    return surplus


def solar_share(cars_kw: float, grid_kw: float) -> float:
    """The part of what the cars draw now that does not come from the grid (0-1).

    What the house buys is counted against the cars first, so the share is
    never too high.
    """
    if cars_kw <= 0:
        return 0.0
    bought = max(0.0, grid_kw)
    return max(0.0, min(1.0, (cars_kw - bought) / cars_kw))


@dataclass(slots=True)
class SolarCar:
    """What the surplus controller knows of one car this minute."""

    vehicle_id: str
    mode: str
    max_amps: float
    phases: int = 3  # the phases it charges on now
    can_switch: bool = False  # the charger can change between one and three phases
    adjustable: bool = True  # False: only on (at full power) and off
    full_kw: float = 11.0  # what it takes when it is on, without a current setting
    charging_kw: float = 0.0  # what it draws now
    priority: int = 1  # 0 comes first


@dataclass(slots=True)
class SolarState:
    """One car's state in the controller: on or off, since when the surplus has been enough or too little."""

    on: bool = False
    enough_since: datetime | None = None
    short_since: datetime | None = None
    phases: int | None = None
    phases_at: datetime | None = None
    amps: float | None = None
    raise_since: datetime | None = None
    changed_at: datetime | None = None
    seen: list[tuple[datetime, float]] = field(default_factory=list)
    other_since: datetime | None = None  # since when the other number of phases would fit better

    def to_dict(self) -> dict[str, Any]:
        return {"on": self.on, "phases": self.phases}

    @classmethod
    def from_dict(cls, data: Any) -> SolarState:
        if not isinstance(data, Mapping):
            return cls()
        phases = data.get("phases")
        return cls(on=bool(data.get("on")), phases=phases if phases in (1, 3) else None)


@dataclass(slots=True)
class SolarDecision:
    """For one car: charge on the sun now, at what current and on how many phases."""

    on: bool
    amps: float | None = None
    phases: int | None = None


@dataclass(slots=True)
class SurplusController:
    """Shares the surplus between the cars that charge on the sun, with delays against clouds."""

    states: dict[str, SolarState] = field(default_factory=dict)

    def step(self, now: datetime, surplus: float, cars: list[SolarCar]) -> dict[str, SolarDecision]:
        """``surplus`` already includes what these cars draw now."""
        decisions: dict[str, SolarDecision] = {}
        left = surplus
        for car in sorted(cars, key=lambda car: (car.priority, car.vehicle_id)):
            state = self.states.setdefault(car.vehicle_id, SolarState())
            decision = self._one(now, state, car, left)
            decisions[car.vehicle_id] = decision
            if decision.on:
                phases = decision.phases or car.phases
                left -= car.full_kw if not car.adjustable else (decision.amps or MIN_AMPS) * VOLTS * phases / 1000
        for vid in [vid for vid in self.states if vid not in {car.vehicle_id for car in cars}]:
            del self.states[vid]
        return decisions

    def _one(self, now: datetime, state: SolarState, car: SolarCar, available: float) -> SolarDecision:
        phases = state.phases or car.phases
        # On how many phases it would charge: one when the sun is small and the charger can switch.
        # Only when that has been so for a while (a cloud is not a reason), and a while after the last change.
        want_phases = phases
        if car.can_switch and car.adjustable:
            lowest = low_end([kw for at, kw in state.seen if elapsed(now, at) < RAISE_WINDOW] + [available])
            if phases == 3 and available < min_kw(3) and available >= min_kw(1):
                want_phases = 1
            elif phases == 1 and lowest >= min_kw(3) + 1.0:
                want_phases = 3
            if want_phases == phases:
                state.other_since = None
            elif state.other_since is None:
                state.other_since = now
            settled = state.phases_at is None or elapsed(now, state.phases_at) >= PHASE_EVERY
            lasted = state.phases is None or (
                state.other_since is not None and elapsed(now, state.other_since) >= DISABLE_DELAY
            )
            if want_phases != phases and settled and lasted:
                state.phases, state.phases_at = want_phases, now
                phases = want_phases
                # Amps on other phases: start the current over.
                state.amps, state.raise_since, state.other_since = None, None, None
        need = min_kw(phases) if car.adjustable else car.full_kw
        if available >= need:
            state.short_since = None
            if state.enough_since is None:
                state.enough_since = now
            if not state.on and elapsed(now, state.enough_since) >= ENABLE_DELAY:
                state.on = True
        else:
            state.enough_since = None
            if state.short_since is None:
                state.short_since = now
            if state.on and elapsed(now, state.short_since) >= DISABLE_DELAY:
                state.on = False
        if not state.on:
            state.amps = None
            return SolarDecision(False, phases=phases if car.can_switch else None)
        if not car.adjustable:
            return SolarDecision(True)
        state.seen = [(at, kw) for at, kw in state.seen if elapsed(now, at) < RAISE_WINDOW] + [(now, available)]

        def fit(kw: float) -> float:
            return max(MIN_AMPS, min(car.max_amps, float(int(amps_for(max(0.0, kw), phases)))))

        target = fit(available)
        steady = fit(low_end([kw for _at, kw in state.seen]))
        amps = target if state.amps is None else state.amps
        if state.amps is not None and target < state.amps:
            amps, state.raise_since = target, None
        elif state.amps is not None and steady >= state.amps + 1:
            if state.raise_since is None:
                state.raise_since = now
            waited = elapsed(now, state.raise_since) >= RAISE_DELAY
            rested = state.changed_at is None or elapsed(now, state.changed_at) >= RAISE_EVERY
            if waited and rested:
                amps, state.raise_since = steady, None
        else:
            state.raise_since = None
        if amps != state.amps:
            state.changed_at = now
        state.amps = amps
        return SolarDecision(True, amps, phases if car.can_switch else None)


def low_end(values: list[float]) -> float:
    """The value the sun has given at least most of the time: the lower part of what was seen."""
    ordered = sorted(values)
    return ordered[int(RAISE_SHARE * (len(ordered) - 1))]


def forecast_kwh(hours: Mapping[datetime, float], start: datetime, end: datetime) -> float:
    """The forecast's energy (kWh) between ``start`` and ``end``, from Wh per hour starting at each key."""
    total = 0.0
    for begin, wh in hours.items():
        stop = begin + timedelta(hours=1)
        overlap = (min(stop, end) - max(begin, start)).total_seconds()
        if overlap > 0:
            total += wh / 1000 * overlap / 3600
    return total
