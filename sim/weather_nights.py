"""Nights where the weather decides what the house draws: a heat pump that works harder the colder it is.

EV Planner has learned the house for two weeks before each night (the
stored forecast is put in place before it starts), in weather that was not
the night's: mild weeks before a cold night, cold weeks before a mild one.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import date, datetime, timedelta
import math
from typing import Any

from .supply_nights import SupplyCar, SupplyNight

HISTORY_DAYS = 14


def daily(low: float, high: float) -> Callable[[datetime], float]:
    """A day's temperature: lowest at 5 in the morning, highest at 5 in the afternoon."""

    def temperature(local: datetime) -> float:
        hours = (local.hour + local.minute / 60 - 5) % 24
        return low + (high - low) * (1 - math.cos(hours / 24 * 2 * math.pi)) / 2

    return temperature


def falling(evening: float, morning: float) -> Callable[[datetime], float]:
    """A night that gets colder (or warmer) from 18 to 7, steadily."""

    def temperature(local: datetime) -> float:
        hours = (local.hour - 18) % 24 + local.minute / 60
        return evening + (morning - evening) * min(1.0, hours / 13)

    return temperature


def heat_pump_amps(temperature: float) -> float:
    """What the heat pump draws on each phase: nothing at 16 °C, a third of an amp more for each degree colder."""
    return max(0.0, min(9.0, (16 - temperature) * 0.33))


def rest_of_house(local: datetime) -> float:
    """Everything but the heat pump: more in the evening, little at night."""
    if 17 <= local.hour < 22:
        return 4.0
    if 7 <= local.hour < 17:
        return 3.0
    return 2.0


def with_heat_pump(temperature: Callable[[datetime], float]) -> Callable[[datetime], float]:
    """The heat pump by the temperature, and a defrost now and then when it is near freezing."""

    def amps(local: datetime) -> float:
        t = temperature(local)
        defrost = 3.0 if t < 3 and (local.hour * 60 + local.minute) % 55 < 6 else 0.0
        return heat_pump_amps(t) + defrost

    return amps


def learned(temperature: Callable[[datetime], float], first: date) -> dict[str, Any]:
    """Two weeks of the house as EV Planner stores it: per hour, cheap or not, and the temperature each time."""
    samples: dict[str, list[float]] = {}
    temps: dict[str, list[float]] = {}
    for day in range(HISTORY_DAYS):
        for hour in range(24):
            moment = datetime(first.year, first.month, first.day, hour, 30) + timedelta(days=day)
            t = temperature(moment)
            defrost = 3.0 * 6 / 55 if t < 3 else 0.0
            amps = round(rest_of_house(moment) + heat_pump_amps(t) + defrost, 2)
            for cheap in (True, False):
                key = f"{hour:02d}{'c' if cheap else 'n'}"
                samples.setdefault(key, []).append(amps)
                temps.setdefault(key, []).append(round(t, 1))
    return {**samples, "temps": temps}


def weather_nights() -> list[SupplyNight]:
    monday = date(2026, 11, 16)
    before = monday - timedelta(days=HISTORY_DAYS)
    cold = falling(-3, -8)
    mild = falling(10, 8)
    mild_weeks = learned(daily(3, 11), before)
    cold_weeks = learned(daily(-6, 0), before)

    def big(key: str, soc: float, target: float, capacity: float, priority: str = "normal") -> SupplyCar:
        return SupplyCar(key, soc, target, capacity=capacity, adjustable=True, priority=priority)

    nights: list[SupplyNight] = []
    for weather in (True, False):
        suffix = "" if weather else "-no-weather"
        tags = ["weather"] if weather else ["no-weather"]
        nights += [
            # Two mild weeks, then a cold night: the house draws more than it has learned.
            SupplyNight(
                f"cold-night-after-mild-weeks{suffix}",
                monday,
                [big("a", 30, 80, 75), big("b", 30, 80, 60, "first")],
                fuse=25,
                limit=23,
                house=rest_of_house,
                heat_pump=with_heat_pump(cold),
                temperature=cold,
                weather=weather,
                history=mild_weeks,
                equalizer=False,
                guard=True,
                tags=[*tags, "cold"],
            ),
            # Two cold weeks, then a mild night: there is more room than the house has learned.
            SupplyNight(
                f"mild-night-after-cold-weeks{suffix}",
                monday,
                [big("a", 30, 80, 75), big("b", 30, 80, 60, "first")],
                fuse=25,
                limit=23,
                house=rest_of_house,
                heat_pump=with_heat_pump(mild),
                temperature=mild,
                weather=weather,
                history=cold_weeks,
                plug_in="22:00",
                ready_by="06:00",
                equalizer=False,
                guard=True,
                tags=[*tags, "mild"],
            ),
        ]
    # A small fuse on a cold night: the heat pump may be held back for a while before a car is stopped.
    for block in (True, False):
        nights.append(
            SupplyNight(
                "heat-pump-held-back" if block else "heat-pump-not-held-back",
                monday,
                [big("a", 40, 80, 60), big("b", 40, 80, 60, "first")],
                fuse=25,
                limit=21,
                house=lambda local: rest_of_house(local) + (7.0 if local.hour == 23 and local.minute < 25 else 0.0),
                heat_pump=with_heat_pump(cold),
                heat_pump_meter=True,
                temperature=cold,
                weather=True,
                history=learned(daily(-6, 0), before),
                block=block,
                plug_in="21:00",
                equalizer=False,
                guard=True,
                tags=["heat-pump", "block" if block else "no-block"],
            )
        )
    return nights
