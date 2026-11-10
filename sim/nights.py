"""The nights the simulator runs: made to test one thing each, and random ones with a fixed seed."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, date, datetime, time, timedelta
import random
from zoneinfo import ZoneInfo

from .model import CarSpec, Night, wall_time

ZONE = ZoneInfo("Europe/Copenhagen")
SEED = 2026
RANDOM_NIGHTS = 24

# A typical Danish day in kr/kWh with tariffs: cheap at night, dear at the evening peak.
SHAPE = [2.3, 2.2, 2.15, 2.1, 2.1, 2.2, 2.6, 3.1, 3.1, 2.8, 2.5, 2.4,
         2.35, 2.4, 2.5, 2.9, 3.3, 3.7, 3.6, 3.5, 3.3, 2.8, 2.6, 2.45]  # fmt: skip


def day_prices(
    first: date, days: int, *, step: timedelta = timedelta(hours=1), price: Callable[[datetime], float] | None = None
) -> list[tuple[datetime, float]]:
    """Slots from local midnight on ``first`` for ``days`` days, stepped in real time (23 or 25 hours on DST days)."""
    start = wall_time(first, time(0), ZONE)
    end = wall_time(first + timedelta(days=days), time(0), ZONE)
    slots: list[tuple[datetime, float]] = []
    moment = start.astimezone(UTC)
    while moment < end:
        local = moment.astimezone(ZONE)
        value = price(local) if price is not None else SHAPE[local.hour]
        slots.append((local, round(value, 4)))
        moment += step
    return slots


def at(day: date, hhmm: str) -> datetime:
    return wall_time(day, time.fromisoformat(hhmm), ZONE)


def _night(
    name: str,
    day: date,
    car: CarSpec,
    *,
    prices: list[tuple[datetime, float]] | None = None,
    step: timedelta = timedelta(hours=1),
    settings: dict[str, object] | None = None,
    published: time | None = time(13, 0),
    tags: list[str] | None = None,
    hidden_after: datetime | None = None,
    nights: int = 1,
) -> Night:
    car.plug_in = car.plug_in or at(day, "17:30")
    car.unplug = car.unplug or at(day + timedelta(days=1), "07:30")
    return Night(
        name=name,
        start=car.plug_in - timedelta(minutes=30),
        end=car.unplug + timedelta(minutes=30),
        prices=prices if prices is not None else day_prices(day, 2, step=step),
        step=step,
        car=car,
        settings={"ready_by": "07:00", "use_ready_by": True, **(settings or {})},
        published=published,
        tags=tags or [],
        hidden_after=hidden_after,
        nights=nights,
    )


def made_nights() -> list[Night]:
    """One thing each."""
    monday = date(2026, 10, 19)
    taper = [(0.0, 80.0, 1.0), (80.0, 90.0, 0.55), (90.0, 100.0, 0.3)]

    def flat(local: datetime) -> float:
        return 1.0 if local.hour >= 22 or local.hour < 6 else SHAPE[local.hour]

    def two_cheap(local: datetime) -> float:
        if local.hour in (0, 4):
            return 0.6
        return SHAPE[local.hour]

    def night_dip(local: datetime) -> float:
        # 01 and 02 are the cheap hours, so the plan lies there.
        return 0.5 if local.hour in (1, 2) else SHAPE[local.hour]

    def spring(local: datetime) -> float:
        # The cheapest hours are 01 and 03, either side of the hour that does not exist.
        return {1: 0.5, 3: 0.55}.get(local.hour, SHAPE[local.hour])

    def autumn(local: datetime) -> float:
        # 02:00 comes twice; the second one (after the clock goes back) is the cheapest.
        if local.hour == 2:
            return 0.4 if local.fold or local.utcoffset() == timedelta(hours=1) else 1.9
        return SHAPE[local.hour]

    nights = [
        _night("basic", monday, CarSpec(capacity=60, power=11, soc=40, limit=80), tags=["basic"]),
        _night(
            "flat-price",
            monday,
            CarSpec(capacity=60, power=11, soc=50, limit=80),
            prices=day_prices(monday, 2, price=flat),
            tags=["flat"],
        ),
        _night(
            "two-cheap-windows",
            monday,
            CarSpec(capacity=60, power=11, soc=50, limit=80),
            prices=day_prices(monday, 2, price=two_cheap),
            tags=["two-windows"],
        ),
        _night("taper", monday, CarSpec(capacity=60, power=11, soc=50, limit=100, curve=taper), tags=["taper"]),
        _night(
            "taper-learned",
            monday,
            CarSpec(capacity=60, power=11, soc=50, limit=100, curve=taper, plug_in=at(monday, "22:30")),
            tags=["taper", "series"],
            nights=3,
        ),
        # The car's cloud is down when the plan starts: fewer and fewer tries, and it charges when it is back.
        _night(
            "cloud-down-at-the-start",
            monday,
            CarSpec(
                capacity=60,
                power=11,
                soc=50,
                limit=80,
                cloud_down=[(at(monday + timedelta(days=1), "00:50"), at(monday + timedelta(days=1), "02:00"))],
            ),
            prices=day_prices(monday, 2, price=night_dip),
            tags=["cloud"],
        ),
        # Down when the plan ends: the car goes on charging, and is stopped when the cloud is back.
        _night(
            "cloud-down-at-the-end",
            monday,
            CarSpec(
                capacity=60,
                power=11,
                soc=30,
                limit=100,
                target_entity=False,
                cloud_down=[(at(monday + timedelta(days=1), "02:30"), at(monday + timedelta(days=1), "04:00"))],
            ),
            prices=day_prices(monday, 2, price=night_dip),
            settings={"target_soc": 60},
            tags=["cloud"],
        ),
        # A car asleep behind a slow cloud: a command takes three minutes, the level comes every ten.
        _night(
            "slow-car-stale-level",
            monday,
            CarSpec(capacity=60, power=11, soc=35, limit=80, command_delay=3, soc_every=10),
            tags=["slow-car"],
        ),
        _night(
            "slow-car-taper-to-full",
            monday,
            CarSpec(capacity=75, power=11, soc=45, limit=100, curve=taper, command_delay=2, soc_every=5),
            tags=["slow-car", "taper"],
        ),
        _night(
            "tight",
            monday,
            CarSpec(capacity=60, power=11, soc=20, limit=90, plug_in=at(monday + timedelta(days=1), "01:30")),
            tags=["tight"],
        ),
        _night(
            "impossible",
            monday,
            CarSpec(capacity=60, power=11, soc=10, limit=100, plug_in=at(monday + timedelta(days=1), "03:00")),
            tags=["impossible"],
        ),
        _night(
            "dst-spring",
            date(2026, 3, 28),
            CarSpec(capacity=60, power=11, soc=50, limit=80, plug_in=at(date(2026, 3, 28), "18:00")),
            prices=day_prices(date(2026, 3, 28), 2, price=spring),
            tags=["dst"],
        ),
        _night(
            "dst-autumn",
            date(2026, 10, 24),
            CarSpec(capacity=60, power=11, soc=60, limit=80, plug_in=at(date(2026, 10, 24), "18:00")),
            prices=day_prices(date(2026, 10, 24), 2, price=autumn),
            tags=["dst"],
        ),
        _night(
            "dst-autumn-earliest",
            date(2026, 10, 24),
            CarSpec(capacity=60, power=11, soc=30, limit=80, plug_in=at(date(2026, 10, 24), "18:00")),
            prices=day_prices(date(2026, 10, 24), 2, price=autumn),
            settings={"earliest_start": "23:00", "use_earliest_start": True},
            tags=["dst", "earliest"],
        ),
        _night(
            "late-prices",
            monday,
            CarSpec(capacity=60, power=11, soc=40, limit=80),
            published=time(23, 30),
            tags=["late-prices"],
        ),
        _night(
            "no-prices",
            monday,
            CarSpec(capacity=60, power=11, soc=40, limit=80),
            published=None,
            hidden_after=at(monday + timedelta(days=1), "00:00"),
            tags=["no-prices"],
        ),
        _night(
            "flaky-sensors",
            monday,
            CarSpec(
                capacity=60,
                power=11,
                soc=30,
                limit=80,
                blips=[at(monday, "21:01"), at(monday + timedelta(days=1), "03:01")],
                outages=[(at(monday + timedelta(days=1), "01:00"), at(monday + timedelta(days=1), "01:20"))],
                flickers=[at(monday + timedelta(days=1), "02:10")],
            ),
            tags=["flaky"],
        ),
        _night(
            "no-resume",
            monday,
            CarSpec(capacity=60, power=11, soc=50, limit=80, no_resume=True),
            prices=day_prices(monday, 2, price=two_cheap),
            tags=["no-resume"],
        ),
        _night(
            "no-resume-learned",
            monday,
            CarSpec(capacity=60, power=11, soc=50, limit=80, no_resume=True),
            prices=day_prices(monday, 5, price=two_cheap),
            tags=["no-resume", "series"],
            nights=3,
        ),
        _night(
            "quarter-prices",
            monday,
            CarSpec(capacity=60, power=11, soc=45, limit=80),
            prices=day_prices(
                monday,
                2,
                step=timedelta(minutes=15),
                price=lambda local: SHAPE[local.hour] + (0.12 if local.minute in (0, 45) else -0.08),
            ),
            step=timedelta(minutes=15),
            tags=["quarter"],
        ),
    ]
    return nights


def random_nights(count: int = RANDOM_NIGHTS, seed: int = SEED) -> list[Night]:
    """Nights with random prices, cars and times, the same every run."""
    rng = random.Random(seed)
    nights: list[Night] = []
    first = date(2026, 1, 5)
    for index in range(count):
        day = first + timedelta(days=rng.randrange(0, 360))
        level = rng.uniform(0.5, 1.4)
        noise = {hour: rng.uniform(-0.35, 0.35) for hour in range(48)}

        def price(local: datetime, level: float = level, noise: dict[int, float] = noise, day: date = day) -> float:
            index = local.hour + (24 if local.date() > day else 0)
            return max(0.05, SHAPE[local.hour] * level + noise[index])

        capacity = rng.choice([40.0, 58.0, 60.0, 66.5, 77.0, 90.0])
        power = rng.choice([3.7, 7.4, 11.0, 11.0])
        limit = rng.choice([80.0, 90.0, 100.0])
        curve = (
            [(0.0, 100.0, 1.0)] if rng.random() < 0.5 else [(0.0, 80.0, 1.0), (80.0, 90.0, 0.6), (90.0, 100.0, 0.35)]
        )
        plug = at(day, f"{rng.randrange(15, 23):02d}:{rng.randrange(0, 60):02d}")
        unplug = at(day + timedelta(days=1), f"{rng.randrange(6, 9):02d}:{rng.randrange(0, 60):02d}")
        ready = f"{rng.randrange(5, 8):02d}:{rng.choice(['00', '15', '30', '45'])}"
        car = CarSpec(
            capacity=capacity,
            power=power,
            soc=round(rng.uniform(10, limit - 5), 1),
            limit=limit,
            curve=curve,
            plug_in=plug,
            unplug=unplug,
            soc_decimals=rng.choice([0, 1]),
            no_resume=rng.random() < 0.1,
            blips=[plug + timedelta(minutes=rng.randrange(30, 600))] if rng.random() < 0.3 else [],
        )
        step = timedelta(minutes=15) if rng.random() < 0.3 else timedelta(hours=1)
        nights.append(
            Night(
                name=f"random-{index + 1:02d}",
                start=plug - timedelta(minutes=30),
                end=unplug + timedelta(minutes=30),
                prices=day_prices(day, 2, step=step, price=price),
                step=step,
                car=car,
                settings={"ready_by": ready, "use_ready_by": True},
                tags=["random"],
            )
        )
    return nights


def all_nights() -> list[Night]:
    return made_nights() + random_nights()
