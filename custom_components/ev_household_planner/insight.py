"""Insight: a log of the cars' days, their trips, the prices and the price forecasts.

Nothing here plans or controls: it only writes down what happened, so the cars' rhythm and the
forecast's errors can be learned from later. It is off until the household turns it on.

What is kept, and for how long:
- ``trips``: each trip with its times, places (zone names, never coordinates), distance and
  charge levels, for 90 days.
- ``days``: one line for each car and day (km, kWh used and charged, temperature, first
  departure), for two years. No places and no single trips.
- ``prices``: the price sensor's price for each hour, for two years; ``spot`` holds what was
  fetched for the time before, recalculated to the household's price.
- ``forecasts``: the price forecast as it looked each day, for half a year.

The first time it is turned on, it reads what Home Assistant already has: the cars' odometer,
battery, charged energy and temperature from the recorder's long-term statistics, and two years
of spot prices from Energi Data Service (when the price sensor says which price area it is in).
"""

from __future__ import annotations

import asyncio
from collections.abc import Iterable, Mapping, Sequence
from datetime import date, datetime, timedelta
import itertools
import logging
from statistics import median
from typing import TYPE_CHECKING, Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .insight_model import CarOutlook, choose, efficiency, forecast_errors, needs, night_price, score
from .planner import PriceSlot

if TYPE_CHECKING:
    from .household import Household
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

SET_INSIGHT = "insight"
# A message each evening about which car should have the charger, at this time.
SET_INSIGHT_NOTIFY = "insight_notify"
SET_INSIGHT_NOTIFY_AT = "insight_notify_at"
# The cars are not moved between these times: what is plugged in when the window opens has the night.
SET_INSIGHT_WINDOW = "insight_window"
SET_INSIGHT_FROM = "insight_from"
SET_INSIGHT_TO = "insight_to"
# The plan waits for a cheaper night when Insight expects one and the cars can do without.
SET_INSIGHT_USE = "insight_use"
# How hard a day the cars must always have enough for: 80, 90 or 95 (% of days).
SET_INSIGHT_LEVEL = "insight_level"
INSIGHT_SETTINGS: dict[str, Any] = {
    SET_INSIGHT: False,
    SET_INSIGHT_NOTIFY: False,
    SET_INSIGHT_NOTIFY_AT: "19:30",
    SET_INSIGHT_WINDOW: False,
    SET_INSIGHT_FROM: "21:00",
    SET_INSIGHT_TO: "07:00",
    SET_INSIGHT_USE: False,
    SET_INSIGHT_LEVEL: 90,
}
LEDGER_KEEP = 180
INSIGHT_STORAGE_KEY = f"{DOMAIN}.{{entry_id}}.insight"
TRIPS_KEEP = timedelta(days=90)
LOOKAHEAD_DAYS = 6
DAYS_KEEP = 730
FORECASTS_KEEP = 180
SAVE_DELAY = 300.0
# A trip shorter than this, in a car with an odometer, is the position wandering, not a trip.
TRIP_MIN_KM = 0.5
TRIP_MIN_TIME = timedelta(minutes=5)
# One reading further than this from the last is a sensor that came back with something else.
ODOMETER_JUMP = 1500.0
ENERGY_JUMP = 200.0

SPOT_URL = "https://api.energidataservice.dk/dataset/{dataset}"
# Hourly spot prices until this day, quarter-hourly day-ahead prices from it.
SPOT_SPLIT = date(2025, 10, 1)
SPOT_CHUNK = timedelta(days=92)
SPOT_TIMEOUT = 60
# The household's price over spot plus tariffs (VAT), when no day is known both ways.
DEFAULT_FACTOR = 1.25

OUTSIDE_WORDS = ("outside", "outdoor", "exterior", "ambient")
ODOMETER_WORDS = ("odometer", "mileage")
MISSING = (None, STATE_UNKNOWN, STATE_UNAVAILABLE, "")


def number(value: Any) -> float | None:
    """A state as a number, or None."""
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if result == result and abs(result) != float("inf") else None


def hourly(slots: Iterable[PriceSlot], day: date, *, forecast: bool = False) -> list[float | None]:
    """The price of each of a local day's 24 hours: the mean of the slots that start in it."""
    hours: list[list[float]] = [[] for _ in range(24)]
    for slot in slots:
        local = dt_util.as_local(slot.start)
        if local.date() == day and slot.forecast is forecast:
            hours[local.hour].append(slot.price)
    return [round(sum(values) / len(values), 4) if values else None for values in hours]


def days_from_statistics(
    rows: Mapping[str, Sequence[Mapping[str, Any]]],
    sources: Mapping[str, str | None],
    capacity: float | None,
) -> dict[str, dict[str, Any]]:
    """A car's days from hourly statistics: km and first departure, kWh charged and used, temperature."""

    def hours(kind: str, key: str) -> list[tuple[datetime, float]]:
        out = []
        for row in rows.get(sources.get(kind) or "", []):
            begin, value = row.get("start"), row.get(key)
            if begin is None or value is None:
                continue
            moment = dt_util.utc_from_timestamp(begin) if isinstance(begin, int | float) else begin
            out.append((dt_util.as_local(moment), float(value)))
        return sorted(out)

    days: dict[str, dict[str, Any]] = {}

    def line(moment: datetime) -> dict[str, Any]:
        return days.setdefault(moment.date().isoformat(), {})

    for moment, change in hours("odometer", "change"):
        if not 0 <= change < ODOMETER_JUMP:
            continue
        day = line(moment)
        day["km"] = round(day.get("km", 0.0) + change, 1)
        if change >= 1 and day.get("out") is None:
            day["out"] = float(moment.hour)
    for moment, change in hours("energy", "change"):
        if 0 < change < ENERGY_JUMP:
            day = line(moment)
            day["charged"] = round(day.get("charged", 0.0) + change, 2)
    temperatures: dict[str, list[float]] = {}
    for moment, mean in hours("temperature", "mean"):
        temperatures.setdefault(moment.date().isoformat(), []).append(mean)
    for key, values in temperatures.items():
        days.setdefault(key, {})["temp"] = round(sum(values) / len(values), 1)
    if capacity:
        levels = hours("soc", "mean")
        for (_before, earlier), (moment, later) in itertools.pairwise(levels):
            if earlier > later:
                day = line(moment)
                day["used"] = round(day.get("used", 0.0) + (earlier - later) / 100 * capacity, 2)
    return days


def spot_hours(records: Iterable[Mapping[str, Any]]) -> dict[str, list[float | None]]:
    """Spot prices (per MWh, hourly or by the quarter) as each local day's 24 hourly prices per kWh."""
    found: dict[str, list[list[float]]] = {}
    for record in records:
        stamp = str(record.get("HourDK") or record.get("TimeDK") or "")
        price = number(record.get("SpotPriceDKK", record.get("DayAheadPriceDKK")))
        if len(stamp) < 13 or price is None or not stamp[11:13].isdigit():
            continue
        found.setdefault(stamp[:10], [[] for _ in range(24)])[int(stamp[11:13]) % 24].append(price / 1000)
    return {
        day: [round(sum(values) / len(values), 4) if values else None for values in hours]
        for day, hours in found.items()
    }


def tariff_hours(attributes: Mapping[str, Any]) -> list[float]:
    """What the price sensor adds to the spot price in each hour of the day (Energi Data Service's tariffs)."""
    tariffs = attributes.get("tariffs")
    if not isinstance(tariffs, Mapping):
        return [0.0] * 24
    extra = tariffs.get("additional_tariffs")
    fixed = sum(number(value) or 0.0 for value in extra.values()) if isinstance(extra, Mapping) else 0.0
    by_hour = tariffs.get("tariffs")
    by_hour = by_hour if isinstance(by_hour, Mapping) else {}
    return [fixed + (number(by_hour.get(str(hour))) or 0.0) for hour in range(24)]


def price_factor(
    known: Mapping[str, list[float | None]], spot: Mapping[str, list[float | None]], tariffs: list[float]
) -> float:
    """How much the household's price is over spot plus tariffs, from the days known both ways."""
    ratios = [
        price / (raw + tariffs[hour])
        for day, prices in known.items()
        for hour, (price, raw) in enumerate(zip(prices, spot.get(day) or [], strict=False))
        if price is not None and raw is not None and raw + tariffs[hour] > 0.2
    ]
    factor = median(ratios) if len(ratios) >= 12 else DEFAULT_FACTOR
    return round(factor, 4) if 0.8 <= factor <= 2.0 else DEFAULT_FACTOR


class Insight:
    """The household's log of days, trips, prices and forecasts."""

    def __init__(self, household: Household) -> None:
        self.household = household
        self.hass: HomeAssistant = household.hass
        self._store: Store[dict[str, Any]] = Store(
            self.hass, 1, INSIGHT_STORAGE_KEY.format(entry_id=household.config_entry.entry_id)
        )
        self.data: dict[str, Any] = self._empty()
        self._sources: dict[str, tuple[Any, dict[str, str | None]]] = {}
        self._price_hour: tuple[date, int] | None = None
        self._tried: date | None = None
        self._task: asyncio.Task[None] | None = None
        # What is expected tonight, for the panel: made each hour and when the evening's message goes out.
        self.tonight: dict[str, Any] = {}

    @staticmethod
    def _empty() -> dict[str, Any]:
        return {
            "days": {},
            "trips": [],
            "prices": {},
            "spot": {},
            "forecasts": {},
            "ledger": {},
            "done": {"cars": {}},
            "live": {},
        }

    @property
    def enabled(self) -> bool:
        return bool(self.household.settings.get(SET_INSIGHT))

    async def async_load(self) -> None:
        try:
            stored = await self._store.async_load()
        except Exception:  # a damaged file must not stop the household
            stored = None
        if isinstance(stored, dict):
            for key, empty in self._empty().items():
                value = stored.get(key)
                self.data[key] = value if isinstance(value, type(empty)) else empty
            self.data["done"].setdefault("cars", {})

    async def async_save(self) -> None:
        if self._task is not None:
            self._task.cancel()
            self._task = None
        await self._store.async_save(self.data)

    async def async_remove(self) -> None:
        await self._store.async_remove()

    def _changed(self) -> None:
        self._store.async_delay_save(lambda: self.data, SAVE_DELAY)

    # ------------------------------------------------------------------
    # What each car has to read from

    def sources(self, vehicle: Vehicle) -> dict[str, str | None]:
        """The car's sensors for the log, found on the device its battery sensor belongs to."""
        key = (vehicle.soc_entity, vehicle.home_entity)
        cached = self._sources.get(vehicle.vehicle_id)
        if cached is not None and cached[0] == key:
            return cached[1]
        found: dict[str, str | None] = {
            "soc": vehicle.soc_entity,
            "odometer": None,
            "tracker": None,
            "temperature": None,
            "energy": None,
        }
        registry = er.async_get(self.hass)
        entry = registry.async_get(vehicle.soc_entity) if vehicle.soc_entity else None
        entities = (
            sorted(
                (item for item in er.async_entries_for_device(registry, entry.device_id) if not item.disabled),
                key=lambda item: item.entity_id,
            )
            if entry is not None and entry.device_id
            else []
        )
        for item in entities:
            entity, domain = item.entity_id, item.domain
            kind = item.device_class or item.original_device_class
            state_class = (item.capabilities or {}).get("state_class")
            counting = state_class in ("total", "total_increasing")
            if domain == "device_tracker":
                if found["tracker"] is None or "location" in entity:
                    found["tracker"] = entity
            elif domain != "sensor":
                continue
            elif kind == "distance" and counting:
                if found["odometer"] is None or any(word in entity for word in ODOMETER_WORDS):
                    found["odometer"] = entity
            elif kind == "temperature" and any(word in entity for word in OUTSIDE_WORDS):
                found["temperature"] = found["temperature"] or entity
            elif kind == "energy" and counting and "charg" in entity:
                found["energy"] = found["energy"] or entity
        if vehicle.home_entity and vehicle.home_entity.startswith("device_tracker."):
            found["tracker"] = vehicle.home_entity
        self._sources[vehicle.vehicle_id] = (key, found)
        return found

    def _read(self, entity: str | None) -> float | None:
        state = self.hass.states.get(entity) if entity else None
        return None if state is None else number(state.state)

    def _place(self, vehicle: Vehicle, tracker: str | None, last: str | None) -> str | None:
        """Where the car stands (a zone's name), or None on the road. An unknown position is the last one."""
        if tracker is not None:
            state = self.hass.states.get(tracker)
            if state is None or state.state in MISSING:
                return last
            return None if state.state == "not_home" else state.state
        if vehicle.home_entity is None or vehicle.home is None:
            return "home" if vehicle.home_entity is None else last
        return "home" if vehicle.home else None

    # ------------------------------------------------------------------
    # Every minute

    async def async_tick(self, now: datetime) -> None:
        """Write down where the cars are and what they have used, and now and then the prices."""
        if not self.enabled:
            return
        try:
            for vehicle in self.household.vehicles.values():
                self._sample(vehicle, now)
            local = dt_util.as_local(now)
            if self._price_hour != (local.date(), local.hour):
                self._price_hour = (local.date(), local.hour)
                self._prices(now)
                self._prune(now)
                await self._async_decide(now)
                self._changed()
            elif self._minute(SET_INSIGHT_NOTIFY_AT, "19:30") == (local.hour, local.minute):
                await self._async_decide(now, tell=True)
            if self._task is None and self._tried != local.date() and self._wants_backfill():
                self._tried = local.date()
                task = self.household.config_entry.async_create_background_task(
                    self.hass, self._async_backfill(now), f"{DOMAIN} insight backfill"
                )
                # A task that had nothing to wait for is done already.
                self._task = None if task.done() else task
        except Exception:  # the log is a bonus: it never stops the planning
            _LOGGER.exception("Insight could not write its log")

    def _sample(self, vehicle: Vehicle, now: datetime) -> None:
        sources = self.sources(vehicle)
        live: dict[str, Any] = self.data["live"].setdefault(vehicle.vehicle_id, {})
        day = dt_util.as_local(now).date().isoformat()
        if live.get("day") != day:
            self._close_day(vehicle.vehicle_id, live)
            live.update(day=day, km=0.0, used=0.0, charged=0.0, temp_sum=0.0, temp_n=0, out=None, seen=False)

        odometer = self._read(sources["odometer"])
        before = live.get("odo")
        if odometer is not None:
            if before is not None and 0 < odometer - before < ODOMETER_JUMP:
                live["km"] += odometer - before
            live["odo"] = odometer
            live["seen"] = True

        soc = vehicle.soc if vehicle.has_soc_sensor else None
        soc_before = live.get("soc")
        if soc is not None:
            if soc_before is not None and soc < soc_before and not self.household.is_charging(vehicle):
                live["used"] += (soc_before - soc) / 100 * vehicle.capacity
            live["soc"] = soc
            live["seen"] = True

        energy = self._read(sources["energy"])
        if energy is not None:
            if (last := live.get("energy")) is not None and 0 < energy - last < ENERGY_JUMP:
                live["charged"] += energy - last
            live["energy"] = energy

        temperature = self._read(sources["temperature"])
        if temperature is None:
            temperature = self.household.supply.temperature_now()
        if temperature is not None:
            live["temp_sum"] += temperature
            live["temp_n"] += 1

        if "place" not in live:
            live["place"] = self._place(vehicle, sources["tracker"], "home")
            return
        was = live["place"]
        place = self._place(vehicle, sources["tracker"], was)
        if place == was:
            return
        live["place"] = place
        if was is not None and live.get("trip") is None:
            live["trip"] = {
                "start": now.isoformat(),
                "from": was,
                "odo": before if before is not None else odometer,
                "soc": soc_before if soc_before is not None else soc,
                "temp": temperature,
            }
            if live.get("out") is None:
                local = dt_util.as_local(now)
                live["out"] = round(local.hour + local.minute / 60, 2)
        if place is not None and (trip := live.get("trip")) is not None:
            live["trip"] = None
            self._end_trip(vehicle, trip, place, now, odometer, soc)
        self._changed()

    def _end_trip(
        self,
        vehicle: Vehicle,
        trip: dict[str, Any],
        place: str,
        now: datetime,
        odometer: float | None,
        soc: float | None,
    ) -> None:
        start = dt_util.parse_datetime(str(trip.get("start"))) or now
        km = odometer - trip["odo"] if odometer is not None and trip.get("odo") is not None else None
        soc_start = trip.get("soc")
        drop = soc_start - soc if soc is not None and soc_start is not None else None
        if km is not None and km < TRIP_MIN_KM:
            return
        if km is None and (drop is None or drop < 1) and now - start < TRIP_MIN_TIME:
            return
        self.data["trips"].append(
            {
                "vehicle": vehicle.vehicle_id,
                "start": start.isoformat(),
                "end": now.isoformat(),
                "from": trip.get("from"),
                "to": place,
                "km": None if km is None else round(km, 1),
                "soc_start": soc_start,
                "soc_end": soc,
                "kwh": None if drop is None or drop <= 0 else round(drop / 100 * vehicle.capacity, 2),
                "temp": trip.get("temp"),
            }
        )

    def _close_day(self, vehicle_id: str, live: dict[str, Any]) -> None:
        """Yesterday's line for a car, when anything was read from it."""
        day = live.get("day")
        if not day or not live.get("seen"):
            return
        count = live.get("temp_n") or 0
        self.data["days"].setdefault(vehicle_id, {})[day] = {
            "km": round(live.get("km") or 0.0, 1) if live.get("odo") is not None else None,
            "used": round(live.get("used") or 0.0, 2),
            "charged": round(live.get("charged") or 0.0, 2) if live.get("energy") is not None else None,
            "temp": round(live["temp_sum"] / count, 1) if count else None,
            "out": live.get("out"),
        }

    def _prices(self, now: datetime) -> None:
        """Keep the published prices of today and tomorrow, and today's forecast once it reaches past them."""
        slots = self.household.price_slots(now)
        today = dt_util.as_local(now).date()
        tomorrow = today + timedelta(days=1)
        for day in (today, tomorrow):
            prices = hourly(slots, day)
            if sum(price is not None for price in prices) >= 23:
                self.data["prices"][day.isoformat()] = prices
        ahead = sorted((slot for slot in slots if slot.forecast and slot.start > now), key=lambda slot: slot.start)
        key = today.isoformat()
        ready = tomorrow.isoformat() in self.data["prices"] or dt_util.as_local(now).hour >= 18
        if not ahead or key in self.data["forecasts"] or not ready:
            return
        first = dt_util.as_local(ahead[0].start).replace(minute=0, second=0, microsecond=0)
        hours: dict[int, list[float]] = {}
        for slot in ahead:
            hours.setdefault(int((dt_util.as_local(slot.start) - first).total_seconds() // 3600), []).append(slot.price)
        self.data["forecasts"][key] = {
            "at": now.isoformat(),
            "start": first.isoformat(),
            "prices": [
                round(sum(values) / len(values), 4) if (values := hours.get(index)) else None
                for index in range(max(hours) + 1)
            ],
        }

    def _prune(self, now: datetime) -> None:
        since = (now - TRIPS_KEEP).isoformat()
        self.data["trips"] = [trip for trip in self.data["trips"] if str(trip.get("end") or "") >= since]
        oldest = (dt_util.as_local(now).date() - timedelta(days=DAYS_KEEP)).isoformat()
        for key in ("prices", "spot"):
            self.data[key] = {day: value for day, value in self.data[key].items() if day >= oldest}
        known = set(self.household.vehicles)
        self.data["days"] = {
            vehicle_id: {day: value for day, value in days.items() if day >= oldest}
            for vehicle_id, days in self.data["days"].items()
            if vehicle_id in known
        }
        self.data["live"] = {key: value for key, value in self.data["live"].items() if key in known}
        first = (dt_util.as_local(now).date() - timedelta(days=FORECASTS_KEEP)).isoformat()
        self.data["forecasts"] = {day: value for day, value in self.data["forecasts"].items() if day >= first}
        oldest = (dt_util.as_local(now).date() - timedelta(days=LEDGER_KEEP)).isoformat()
        self.data["ledger"] = {day: value for day, value in self.data["ledger"].items() if day >= oldest}

    # ------------------------------------------------------------------
    # What is expected, and which car gets the charger tonight

    def _minute(self, key: str, default: str) -> tuple[int, int]:
        text = str(self.household.settings.get(key) or default)
        hour, _, minute = text.partition(":")
        try:
            return int(hour) % 24, int(minute or 0) % 60
        except ValueError:
            return self._minute("", default)

    @property
    def window(self) -> tuple[int, int]:
        """The night's hours: the window the cars are not moved in, else 21 to 07."""
        if not self.household.settings.get(SET_INSIGHT_WINDOW):
            return 21, 7
        return self._minute(SET_INSIGHT_FROM, "21:00")[0], self._minute(SET_INSIGHT_TO, "07:00")[0]

    def in_window(self, now: datetime) -> bool:
        start, end = self.window
        hour = dt_util.as_local(now).hour
        return start <= hour < end if start < end else hour >= start or hour < end

    def _all_prices(self, now: datetime) -> dict[str, list[float | None]]:
        """Each day's hourly prices: the published ones, and the forecast for the days after."""
        slots = self.household.price_slots(now)
        today = dt_util.as_local(now).date()
        out: dict[str, list[float | None]] = {}
        for ahead in range(LOOKAHEAD_DAYS):
            day = today + timedelta(days=ahead)
            known, guessed = hourly(slots, day), hourly(slots, day, forecast=True)
            out[day.isoformat()] = [a if a is not None else b for a, b in zip(known, guessed, strict=True)]
        return out

    def outlook(self, vehicle: Vehicle, now: datetime) -> CarOutlook | None:
        """A car's evening: what it has and what the coming days are expected to take."""
        soc = vehicle.current_soc
        if soc is None or not vehicle.capacity:
            return None
        days = self.data["days"].get(vehicle.vehicle_id) or {}
        base, slope = efficiency(days)
        level = number(self.household.settings.get(SET_INSIGHT_LEVEL)) or 90.0
        return CarOutlook(
            vehicle_id=vehicle.vehicle_id,
            soc_kwh=soc / 100 * vehicle.capacity,
            capacity=vehicle.capacity,
            target_kwh=vehicle.wanted_target / 100 * vehicle.capacity,
            history=needs(days, base, slope),
            today=dt_util.as_local(now).date(),
            level=min(0.99, max(0.5, level / 100)),
            known_need=self._known_need(vehicle, now),
        )

    def _known_need(self, vehicle: Vehicle, now: datetime) -> float:
        """A ready-by time with its own target within a day and a half: the car must have that."""
        deadline = vehicle.deadline
        own = vehicle.calendar_target is not None or vehicle.trip is not None
        if own and deadline is not None and now < deadline <= now + timedelta(hours=36):
            return vehicle.wanted_target / 100 * vehicle.capacity
        return 0.0

    def groups(self) -> list[list[Vehicle]]:
        """The cars that share a charger; a car with its own charger is a group of one."""
        shared: dict[str, list[Vehicle]] = {}
        for vehicle in self.household.vehicles.values():
            shared.setdefault(vehicle.fixed_charger or f"own {vehicle.vehicle_id}", []).append(vehicle)
        return list(shared.values())

    async def _async_decide(self, now: datetime, *, tell: bool = False) -> None:
        """Tonight's expectation: kept in the ledger from the evening on, and not changed in the window."""
        local = dt_util.as_local(now)
        start, end = self.window
        evening = local.date() if local.hour >= end or start < end else local.date() - timedelta(days=1)
        key = evening.isoformat()
        locked = self.in_window(now) and key in self.data["ledger"]
        if not locked:
            prices = self._all_prices(now)
            tonight = night_price(prices, evening, start, end)
            later = [night_price(prices, evening + timedelta(days=ahead), start, end) for ahead in range(1, 4)]
            errors = forecast_errors(self.data["forecasts"], self.data["prices"])
            entry: dict[str, Any] = {"at": now.isoformat(), "price": tonight, "cars": {}, "groups": []}
            for group in self.groups():
                cars = [car for vehicle in group if (car := self.outlook(vehicle, now)) is not None]
                entry["cars"].update({car.vehicle_id: car.as_dict() for car in cars})
                entry["groups"].append(
                    {"cars": [car.vehicle_id for car in cars], **choose(cars, tonight, later, errors)}
                )
            entry["wait"] = any(group["wait"] for group in entry["groups"])
            self.tonight = entry
            if local.hour >= 12 or key in self.data["ledger"]:
                self.data["ledger"][key] = entry
        await self._async_hold(now)
        if tell and self.household.settings.get(SET_INSIGHT_NOTIFY):
            await self._async_tell(now)

    async def _async_hold(self, now: datetime) -> None:
        """With the plan following Insight: a night it waits, the cars charge no further than their floor."""
        use = bool(self.household.settings.get(SET_INSIGHT_USE))
        changed = False
        for group in self.tonight.get("groups") or []:
            for vehicle_id in group["cars"]:
                vehicle = self.household.vehicles.get(vehicle_id)
                car = (self.tonight.get("cars") or {}).get(vehicle_id) or {}
                hold = float(car["floor_pct"]) if use and group["wait"] and car.get("floor_pct") else None
                if vehicle is not None and vehicle.insight_hold != hold:
                    vehicle.insight_hold = hold
                    changed = True
                    self.household.events.add(now, "insight_hold", vehicle=vehicle.name, hold=hold)
        if changed:
            await self.household.async_recalculate()

    async def _async_tell(self, now: datetime) -> None:
        """The evening's message: which car should have the charger, when it is not the one plugged in."""
        household = self.household
        for group in self.tonight.get("groups") or []:
            if len(group["cars"]) < 2:
                continue
            names = {vid: household.vehicles[vid].name for vid in group["cars"] if vid in household.vehicles}
            pick = group.get("pick")
            if pick in names and household.vehicles[pick].connected is not True:
                other = next((name for vid, name in names.items() if vid != pick), "")
                text = household.text(
                    "insight_plug_both" if group["both"] else "insight_plug", car=names[pick], other=other
                )
            elif group["wait"] and not any(household.vehicles[vid].connected for vid in names):
                text = household.text("insight_no_car")
            else:
                continue
            await household.notifier.send(
                title=household.text("insight_title"), message=text, tag=f"{DOMAIN}_insight", icon="mdi:ev-plug-type2"
            )
        result = self.scored()
        if result["ripe"] and "ripe" not in self.data["done"]:
            self.data["done"]["ripe"] = now.isoformat()
            await household.notifier.send(
                title=household.text("insight_title"),
                message=household.text(
                    "insight_ripe",
                    rate=round((result["rate"] or 0) * 100),
                    days=result["scored"],
                    saved=round(result["saved"]),
                    currency=household.currency,
                ),
                tag=f"{DOMAIN}_insight_ripe",
                icon="mdi:chart-bell-curve",
            )

    def scored(self) -> dict[str, Any]:
        """How the expectations have held against what the cars did."""
        by_car = {}
        for vehicle_id, days in self.data["days"].items():
            base, slope = efficiency(days)
            by_car[vehicle_id] = dict(needs(days, base, slope))
        prices = {**self.data["spot"], **self.data["prices"]}
        return score(self.data["ledger"], self.data["days"], prices, by_car, self.window)

    # ------------------------------------------------------------------
    # The first time: what Home Assistant and Energi Data Service already have

    def _wants_backfill(self) -> bool:
        done = self.data["done"]
        return "prices" not in done or any(vehicle_id not in done["cars"] for vehicle_id in self.household.vehicles)

    async def _async_backfill(self, now: datetime) -> None:
        try:
            done = self.data["done"]
            for vehicle in list(self.household.vehicles.values()):
                if vehicle.vehicle_id not in done["cars"]:
                    await self._async_backfill_car(vehicle, now)
            if "prices" not in done:
                await self._async_import_prices(now)
            self._changed()
        except Exception as err:  # tried again tomorrow
            _LOGGER.warning("Insight could not read the older data: %s", err)
            self.household.events.add(now, "insight_backfill", error=str(err) or type(err).__name__)
        finally:
            self._task = None

    async def _async_backfill_car(self, vehicle: Vehicle, now: datetime) -> None:
        sources = self.sources(vehicle)
        ids = {entity for kind, entity in sources.items() if entity and kind != "tracker"}
        rows = await self._async_statistics(ids, now - timedelta(days=DAYS_KEEP), now) if ids else {}
        found = days_from_statistics(rows, sources, vehicle.capacity)
        today = dt_util.as_local(now).date().isoformat()
        days = self.data["days"].setdefault(vehicle.vehicle_id, {})
        for day, line in found.items():
            if day < today and day not in days:
                days[day] = {"km": None, "used": None, "charged": None, "temp": None, "out": None, **line}
        self.data["done"]["cars"][vehicle.vehicle_id] = {"at": now.isoformat(), "days": len(found)}
        self.household.events.add(now, "insight_backfill", vehicle=vehicle.name, days=len(found), sources=sources)

    async def _async_statistics(self, ids: set[str], start: datetime, end: datetime) -> dict[str, list[dict[str, Any]]]:
        from homeassistant.components.recorder import get_instance
        from homeassistant.components.recorder.statistics import statistics_during_period

        result: Any = await get_instance(self.hass).async_add_executor_job(
            statistics_during_period, self.hass, start, end, ids, "hour", None, {"change", "mean"}
        )
        return dict(result or {})

    async def _async_import_prices(self, now: datetime) -> None:
        """Two years of spot prices for the price sensor's area, as the household's price."""
        state = self.hass.states.get(self.household.price_entity)
        area = str(state.attributes.get("region_code") or "") if state is not None else ""
        done = self.data["done"]
        if state is None or not area:
            done["prices"] = {"at": now.isoformat(), "days": 0, "area": None}
            return
        today = dt_util.as_local(now).date()
        records: list[Mapping[str, Any]] = []
        begin = today - timedelta(days=DAYS_KEEP)
        while begin <= today:
            end = min(begin + SPOT_CHUNK, today + timedelta(days=1))
            if begin < SPOT_SPLIT < end:
                end = SPOT_SPLIT
            records.extend(await self._async_spot(area, begin, end))
            begin = end
        spot = spot_hours(records)
        tariffs = tariff_hours(state.attributes)
        factor = price_factor(self.data["prices"], spot, tariffs)
        add = self.household.price_add or 0.0
        self.data["spot"] = {
            day: [
                None if raw is None else round((raw + tariffs[hour]) * factor + add, 4)
                for hour, raw in enumerate(hours)
            ]
            for day, hours in spot.items()
            if day not in self.data["prices"]
        }
        done["prices"] = {"at": now.isoformat(), "days": len(spot), "area": area, "factor": factor}
        self.household.events.add(now, "insight_prices", area=area, days=len(spot), factor=factor)

    async def _async_spot(self, area: str, begin: date, end: date) -> list[Mapping[str, Any]]:
        old = begin < SPOT_SPLIT
        params = {
            "start": begin.isoformat(),
            "end": end.isoformat(),
            "filter": f'{{"PriceArea":["{area}"]}}',
            "columns": "HourDK,SpotPriceDKK" if old else "TimeDK,DayAheadPriceDKK",
            "limit": "0",
        }
        session = async_get_clientsession(self.hass)
        async with asyncio.timeout(SPOT_TIMEOUT):
            response = await session.get(
                SPOT_URL.format(dataset="Elspotprices" if old else "DayAheadPrices"), params=params
            )
            response.raise_for_status()
            body = await response.json()
        records = body.get("records") if isinstance(body, Mapping) else None
        return [record for record in records if isinstance(record, Mapping)] if isinstance(records, list) else []

    # ------------------------------------------------------------------
    # For the panel and the support export

    def summary(self) -> dict[str, Any]:
        """How much is logged, and what each car is read from. No places and no trips."""
        cars = {}
        for vehicle in self.household.vehicles.values():
            days = self.data["days"].get(vehicle.vehicle_id) or {}
            recent = sorted(days)[-30:]
            cars[vehicle.vehicle_id] = {
                "name": vehicle.name,
                "sources": self.sources(vehicle),
                "days": len(days),
                "first": min(days) if days else None,
                "km_30": round(sum(days[day].get("km") or 0.0 for day in recent), 1),
                "trips": sum(trip.get("vehicle") == vehicle.vehicle_id for trip in self.data["trips"]),
            }
        return {
            "enabled": self.enabled,
            "cars": cars,
            "prices": len(self.data["prices"]),
            "spot": len(self.data["spot"]),
            "forecasts": len(self.data["forecasts"]),
            "done": self.data["done"],
            "tonight": self.tonight,
            "score": self.scored(),
            "window": list(self.window),
        }

    def detail(self) -> dict[str, Any]:
        """What the panel draws: each car's days and week, the trips, and the ledger."""
        today = dt_util.now().date()
        cars = {}
        for vehicle in self.household.vehicles.values():
            days = self.data["days"].get(vehicle.vehicle_id) or {}
            base, slope = efficiency(days)
            history = needs(days, base, slope)
            car = CarOutlook(vehicle.vehicle_id, 0.0, vehicle.capacity or 1.0, 0.0, history, today)
            cars[vehicle.vehicle_id] = {
                "kwh_km": base,
                "cold": slope,
                "week": [
                    {"p50": round(car.need(ahead, 0.5), 1), "p90": round(car.need(ahead, 0.9), 1)}
                    for ahead in sorted(range(7), key=lambda ahead: (today + timedelta(days=ahead)).weekday())
                ],
                "days": {day: days[day] for day in sorted(days)[-90:]},
            }
        return {
            **self.summary(),
            "detail": cars,
            "trips": self.data["trips"][-200:],
            "ledger": {day: self.data["ledger"][day] for day in sorted(self.data["ledger"])[-30:]},
        }
