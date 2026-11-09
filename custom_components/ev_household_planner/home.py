"""The home as a whole: what the Energy dashboard knows, read for the Home tab and the history.

Nothing here steers a car. EV Planner reads the Energy dashboard's settings
(the grid's power and energy, the sun, the home battery and the devices with
their power) so a household that has set it up gets the Home tab without
choosing anything again; the history of the whole house comes from Home
Assistant's own long-term statistics.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
from typing import TYPE_CHECKING, Any, Literal

from homeassistant.util import dt as dt_util

from .const import CONF_HEAT_PUMP_POWER
from .vehicle import elapsed

if TYPE_CHECKING:
    from .household import Household

_LOGGER = logging.getLogger(__name__)

# The Energy dashboard's settings are read again after this long.
ENERGY_EVERY = timedelta(minutes=30)
# A device whose name says so is the heat pump.
HEAT_PUMP_NAMES = ("heat pump", "heatpump", "varmepumpe", "wärmepumpe", "waermepumpe", "värmepump", "varmepumpa")
PERIODS: dict[str, Literal["hour", "day", "month"]] = {"day": "hour", "week": "day", "month": "day", "year": "month"}


def _rate(config: Any) -> tuple[str | None, str | None, bool]:
    """A source's power: (entity, entity sent back, inverted) from its ``power_config`` or ``stat_rate``."""
    power = config.get("power_config") if isinstance(config.get("power_config"), dict) else {}
    if power.get("stat_rate_from") or power.get("stat_rate_to"):
        return power.get("stat_rate_from"), power.get("stat_rate_to"), False
    if power.get("stat_rate_inverted"):
        return power["stat_rate_inverted"], None, True
    return power.get("stat_rate") or config.get("stat_rate"), None, False


class HomeInfo:
    """The Energy dashboard's view of the home, kept fresh."""

    def __init__(self, household: Household) -> None:
        self.household = household
        self.grid: tuple[str | None, str | None, bool] = (None, None, False)
        self.grid_energy: list[str] = []
        self.solar: list[str] = []
        self.battery: tuple[str | None, str | None, bool] = (None, None, False)
        self.devices: list[dict[str, str | None]] = []
        self._read_at: datetime | None = None

    @property
    def hass(self) -> Any:
        return self.household.hass

    async def async_refresh(self, now: datetime, force: bool = False) -> bool:
        """Read the Energy dashboard's settings; True when they were read."""
        if not force and self._read_at is not None and elapsed(now, self._read_at) < ENERGY_EVERY:
            return False
        self._read_at = now
        try:
            from homeassistant.components.energy.data import async_get_manager

            manager = await async_get_manager(self.hass)
        except Exception as err:  # the Energy dashboard is a bonus, never a reason to fail
            _LOGGER.debug("No Energy dashboard: %s", err)
            return False
        prefs: Any = manager.data or {}
        grid: tuple[str | None, str | None, bool] = (None, None, False)
        grid_energy: list[str] = []
        solar: list[str] = []
        battery: tuple[str | None, str | None, bool] = (None, None, False)
        for source in prefs.get("energy_sources") or []:
            kind = source.get("type")
            if kind == "grid":
                if source.get("stat_energy_from"):
                    grid_energy.append(str(source["stat_energy_from"]))
                for flow in source.get("flow_from") or []:  # older settings
                    if flow.get("stat_energy_from"):
                        grid_energy.append(str(flow["stat_energy_from"]))
                rate = _rate(source)
                if rate[0] and grid[0] is None:
                    grid = rate
            elif kind == "solar":
                rate = _rate(source)
                if rate[0]:
                    solar.append(str(rate[0]))
            elif kind == "battery":
                rate = _rate(source)
                if rate[0] and battery[0] is None:
                    battery = rate
        self.grid, self.grid_energy, self.solar, self.battery = grid, grid_energy, solar, battery
        self.devices = [
            {
                "name": str(device.get("name") or self._name(device.get("stat_consumption"))),
                "power": device.get("stat_rate"),
                "energy": device.get("stat_consumption"),
            }
            for device in prefs.get("device_consumption") or []
            if device.get("stat_consumption")
        ]
        return True

    def _name(self, entity_id: Any) -> str:
        state = self.hass.states.get(str(entity_id)) if entity_id else None
        return str(state.name) if state is not None else str(entity_id or "")

    def _kw(self, rate: tuple[str | None, str | None, bool]) -> float | None:
        from .household import power_value

        entity, back, inverted = rate
        if not entity:
            return None
        value = power_value(self.hass.states.get(entity))
        if value is None:
            return None
        if back:
            sent = power_value(self.hass.states.get(back))
            value -= sent or 0.0
        return -value if inverted else value

    # ------------------------------------------------------------------
    # Now

    @property
    def grid_power_entity(self) -> str | None:
        """The grid's power, when it is one sensor that is positive when the house buys."""
        entity, back, inverted = self.grid
        return entity if entity and not back and not inverted else None

    @property
    def solar_power_entity(self) -> str | None:
        return self.solar[0] if len(self.solar) == 1 else None

    @property
    def has_solar(self) -> bool:
        return bool(self.solar)

    def grid_kw(self) -> float | None:
        if (kw := self.household.solar.grid_kw()) is not None:
            return kw
        return self._kw(self.grid)

    def solar_kw(self) -> float | None:
        from .household import power_value

        if (kw := self.household.solar.solar_kw()) is not None:
            return kw
        values = [power_value(self.hass.states.get(entity)) for entity in self.solar]
        readings = [value for value in values if value is not None]
        return sum(readings) if readings else None

    def battery_kw(self) -> float | None:
        """Positive when the home battery charges."""
        if (kw := self.household.solar.battery_kw()) is not None:
            return kw
        value = self._kw(self.battery)
        # The Energy dashboard counts a battery's power positive when it gives.
        return None if value is None else -value

    def heat_pump_kw(self) -> float | None:
        if self.household.config.get(CONF_HEAT_PUMP_POWER):
            return self.household.supply.heat_pump_kw()
        from .household import power_value

        for device in self.devices:
            name = str(device.get("name") or "").lower()
            if device.get("power") and any(word in name for word in HEAT_PUMP_NAMES):
                return power_value(self.hass.states.get(str(device["power"])))
        return None

    def cars_kw(self) -> float:
        total = 0.0
        for vehicle in self.household.vehicles.values():
            reading = self.household.power_reading(vehicle)
            if reading is not None and reading > 0 and self.household.is_charging(vehicle):
                total += reading
        return total

    def state(self, now: datetime) -> dict[str, Any] | None:
        """What the home draws now, or None when EV Planner has nothing to show."""
        from .household import power_value

        grid = self.grid_kw()
        solar = self.solar_kw()
        battery = self.battery_kw()
        heat_pump = self.heat_pump_kw()
        temperature = self.household.supply.temperature_now()
        if grid is None and solar is None and heat_pump is None and temperature is None:
            return None
        cars = self.cars_kw()
        house = None
        if grid is not None:
            house = max(0.0, grid + (solar or 0.0) - (battery or 0.0) - cars)
        devices = []
        for device in self.devices:
            power = power_value(self.hass.states.get(str(device["power"]))) if device.get("power") else None
            devices.append({"name": device["name"], "kw": None if power is None else round(power, 2)})

        def r(value: float | None) -> float | None:
            return None if value is None else round(value, 2)

        return {
            "grid_kw": r(grid),
            "solar_kw": r(solar),
            "battery_kw": r(battery),
            "cars_kw": round(cars, 2),
            "house_kw": r(house),
            "heat_pump_kw": r(heat_pump),
            "temperature": None if temperature is None else round(temperature, 1),
            "devices": devices,
            "history": bool(self.grid_energy),
        }

    # ------------------------------------------------------------------
    # The history of the whole house

    async def async_history(self, period: str, start: datetime, end: datetime) -> dict[str, Any]:
        """What the house bought from the grid in each hour, day or month between ``start`` and ``end``."""
        unit = PERIODS.get(period, "day")
        if not self.grid_energy:
            return {"period": period, "unit": unit, "rows": [], "typical_day": []}
        rows = await self._async_change(set(self.grid_energy), start, end, unit)
        costs = await self._async_change({f"{entity}_cost" for entity in self.grid_energy}, start, end, unit)
        out = [
            {
                "start": moment.isoformat(),
                "kwh": round(kwh, 3),
                "cost": None if moment not in costs else round(costs[moment], 2),
            }
            for moment, kwh in sorted(rows.items())
        ]
        # The typical day: the last two weeks, hour by hour.
        now = dt_util.now()
        hours = await self._async_change(set(self.grid_energy), now - timedelta(days=14), now, "hour")
        by_hour: dict[int, list[float]] = {}
        for moment, kwh in hours.items():
            by_hour.setdefault(dt_util.as_local(moment).hour, []).append(kwh)
        typical = [round(sum(values) / len(values), 3) if (values := by_hour.get(h)) else None for h in range(24)]
        return {"period": period, "unit": unit, "rows": out, "typical_day": typical}

    async def _async_change(
        self, statistic_ids: set[str], start: datetime, end: datetime, unit: Literal["hour", "day", "month"]
    ) -> dict[datetime, float]:
        """The summed change of some statistics in each period (empty without the recorder)."""
        try:
            from homeassistant.components.recorder import get_instance
            from homeassistant.components.recorder.statistics import statistics_during_period

            result: Any = await get_instance(self.hass).async_add_executor_job(
                statistics_during_period, self.hass, start, end, statistic_ids, unit, None, {"change"}
            )
        except Exception as err:  # statistics are a bonus, never a reason to fail
            _LOGGER.debug("No statistics for %s: %s", statistic_ids, err)
            return {}
        totals: dict[datetime, float] = {}
        for rows in (result or {}).values():
            for row in rows:
                change = row.get("change")
                begin = row.get("start")
                if change is None or begin is None:
                    continue
                moment = dt_util.utc_from_timestamp(begin) if isinstance(begin, int | float) else begin
                totals[moment] = totals.get(moment, 0.0) + float(change)
        return totals
