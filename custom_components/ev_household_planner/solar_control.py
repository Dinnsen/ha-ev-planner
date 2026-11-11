"""The sun in Home Assistant: the grid meter, the home battery, the forecast, and cars that charge on the surplus.

Off until a grid power sensor is set in the options. Then a car whose
*Solar* setting is *Sun and plan* or *Only sun* charges when the house sends
power to the grid, with a current that follows the surplus (``solar``). With
*Sun and plan* its price plan still makes sure it is ready, and counts on part
of the sun the forecast promises before its ready-by time. Energy is counted
as sun or grid, for the history.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util

from .const import (
    CONF_BATTERY_FIRST,
    CONF_BATTERY_HOLD,
    CONF_BATTERY_INVERTED,
    CONF_BATTERY_POWER,
    CONF_BATTERY_SOC,
    CONF_GRID_INVERTED,
    CONF_GRID_POWER,
    CONF_PHASE_ENTITY,
    CONF_SOLAR_FORECAST,
    CONF_SOLAR_POWER,
    CONTROL_CHARGE,
    DEFAULT_BATTERY_FIRST,
    PRIORITY_FIRST,
    REASON_SOLAR,
    SET_PRIORITY,
    SET_SOLAR,
    SITE_HOME,
    SOLAR_ONLY,
    SOLAR_SURPLUS,
)
from .solar import (
    FORECAST_TRUST,
    SolarCar,
    SolarDecision,
    SolarState,
    SurplusController,
    amps_for,
    forecast_kwh,
    solar_share,
    surplus_kw,
)
from .vehicle import elapsed, to_float

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .household import Household
    from .pairing import Site
    from .supply_control import SupplyControl
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

# The forecast is fetched again this often.
FORECAST_EVERY = timedelta(minutes=30)
# Of each forecast hour, this much is taken to go to the house, not the car (kWh).
HOUSE_PER_HOUR = 0.5
# Grid charging (a plan, charge now) holds the home battery: it should not empty itself into the car.
GRID_REASONS = ("planned", "charge_now", "low_price", "low_soc", "keep_on")
CHARGE_EFFICIENCY = 0.9


class SolarControl:
    """The sun of one place of a household: the home, or another place with panels."""

    def __init__(self, household: Household, site: Site | None = None) -> None:
        self.household = household
        self.site = site
        self.controller = SurplusController()
        self.decisions: dict[str, SolarDecision] = {}
        self.forecast: dict[datetime, float] = {}
        self._forecast_at: datetime | None = None
        self._hold: bool | None = None
        self._restore: set[str] = set()
        self._phases_sent: dict[str, int] = {}
        # The cars whose surplus is sold now, as that pays more than their plan costs: {car: (sold for, plan's price)}.
        self.sold: dict[str, tuple[float, float]] = {}

    @property
    def hass(self) -> HomeAssistant:
        return self.household.hass

    # ------------------------------------------------------------------
    # Settings and readings

    def _option(self, key: str) -> Any:
        if self.site is None:
            return self.household.config.get(key)
        return self.site.data.get(key)

    @property
    def _supply(self) -> SupplyControl:
        """The supply of the same place."""
        return self.household.supplies[self.site.site_id] if self.site is not None else self.household.supply

    @property
    def active(self) -> bool:
        return bool(self._option(CONF_GRID_POWER))

    def _kw(self, key: str, inverted: str | None = None) -> float | None:
        from .household import power_value

        entity = self._option(key)
        if not entity:
            return None
        value = power_value(self.hass.states.get(str(entity)))
        if value is None:
            return None
        return -value if inverted and self._option(inverted) else value

    def grid_kw(self) -> float | None:
        """What the house draws from the grid now (kW); negative when it sends to it."""
        return self._kw(CONF_GRID_POWER, CONF_GRID_INVERTED)

    def solar_kw(self) -> float | None:
        return self._kw(CONF_SOLAR_POWER)

    def battery_kw(self) -> float | None:
        """What the home battery takes now (kW); negative when it gives."""
        return self._kw(CONF_BATTERY_POWER, CONF_BATTERY_INVERTED)

    def battery_soc(self) -> float | None:
        entity = self._option(CONF_BATTERY_SOC)
        return to_float(self.household.state_of(str(entity))) if entity else None

    @property
    def battery_first_until(self) -> float:
        value = to_float(self._option(CONF_BATTERY_FIRST))
        return DEFAULT_BATTERY_FIRST if value is None else value

    def mode(self, vehicle: Vehicle) -> str:
        return str(vehicle.settings.get(SET_SOLAR) or "off")

    def only(self, vehicle: Vehicle) -> bool:
        return self.active and self.mode(vehicle) == SOLAR_ONLY

    def phase_entity(self, vehicle: Vehicle) -> str | None:
        entity = vehicle.config.get(CONF_PHASE_ENTITY)
        if not entity and vehicle.charger_id and (charger := self.household.chargers.get(vehicle.charger_id)):
            entity = charger.config.get(CONF_PHASE_ENTITY)
        return str(entity) if entity else None

    def _phases_now(self, vehicle: Vehicle) -> int:
        entity = self.phase_entity(vehicle)
        if entity:
            state = self.household.state_of(entity)
            if state in ("on", "off"):
                return 3 if state == "on" else 1
        return self._supply.phases

    def _car_kw(self, vehicle: Vehicle) -> float:
        """What the car draws now: its reading, else the current the sun gave it, else its charging power."""
        if not self.household.is_charging(vehicle):
            return 0.0
        reading = self.household.power_reading(vehicle)
        if reading is not None and reading > 0:
            return reading
        decision = self.decisions.get(vehicle.vehicle_id)
        if decision is not None and decision.on and decision.amps is not None:
            return decision.amps * 0.23 * (decision.phases or self._phases_now(vehicle))
        return self.household.vehicle_power(vehicle)

    # ------------------------------------------------------------------
    # Each minute: who charges on the sun

    def _candidates(self) -> list[tuple[Vehicle, SolarCar]]:
        out: list[tuple[Vehicle, SolarCar]] = []
        supply = self._supply
        for vehicle in self._cars():
            if self.mode(vehicle) not in (SOLAR_SURPLUS, SOLAR_ONLY) or vehicle.mode != "smart":
                continue
            soc = vehicle.current_soc
            if (
                vehicle.connected is False
                or vehicle.at_home is False
                or (soc is not None and soc >= vehicle.target - 0.5)
            ):
                continue
            if self.household.guest_holds(vehicle.charger_id, dt_util.now()):
                continue
            if (prices := self._sells(vehicle)) is not None:
                self.sold[vehicle.vehicle_id] = prices
                continue
            entity = supply.current_entity(vehicle)
            phases = self._phases_now(vehicle)
            power = self.household.vehicle_power(vehicle)
            high = supply.bounds(entity)[1] if entity else amps_for(power, phases)
            out.append(
                (
                    vehicle,
                    SolarCar(
                        vehicle.vehicle_id,
                        self.mode(vehicle),
                        max_amps=high,
                        phases=phases,
                        can_switch=self.phase_entity(vehicle) is not None,
                        adjustable=entity is not None,
                        full_kw=power,
                        charging_kw=self._car_kw(vehicle) if self.wants(vehicle) else 0.0,
                        priority=0 if vehicle.settings.get(SET_PRIORITY) == PRIORITY_FIRST else 1,
                    ),
                )
            )
        return out

    def _sells(self, vehicle: Vehicle) -> tuple[float, float] | None:
        """(what a kWh is sold for, what the car's plan pays for one) when selling pays more than the plan costs.

        A car on "sun and plan" then leaves the surplus to the grid and
        charges in its planned hours instead: the household ends up with more.
        A car on "only sun" has no plan to fall back on, and charges on the sun.
        """
        if self.mode(vehicle) != SOLAR_SURPLUS:
            return None
        plan = vehicle.plan
        price = plan.average_price if plan is not None and plan.segments else None
        if price is None:
            return None
        site_id = self.site.site_id if self.site is not None else SITE_HOME
        sold = self.household.export_price(site_id)
        # The sun's kWh reach the battery with the same loss as the grid's, so the prices compare as they are.
        return (sold, price) if sold > price + 0.005 else None

    def update(self, now: datetime) -> None:
        """Decide, before the cars' decisions, which cars charge on the sun this minute."""
        grid = self.grid_kw() if self.active else None
        self.sold = {}
        if grid is None:
            self.decisions = {}
            return
        candidates = self._candidates()
        cars = [car for _vehicle, car in candidates]
        surplus = surplus_kw(
            grid,
            cars_kw=sum(car.charging_kw for car in cars),
            battery_kw=self.battery_kw(),
            battery_soc=self.battery_soc(),
            battery_first_until=self.battery_first_until,
        )
        self.decisions = self.controller.step(now, surplus, cars)

    def _cars(self) -> list[Vehicle]:
        """The cars at this place: the sun on one roof is not for a car at another place."""
        return [vehicle for vehicle in self.household.vehicles.values() if self._here(vehicle)]

    def _here(self, vehicle: Vehicle) -> bool:
        site = self.household.pairing.vehicle_site(vehicle)
        if self.site is None or self.site.home:
            # A car that is away is the home's, as before there were other places.
            return site is None or site.home
        return site is self.site

    def wants(self, vehicle: Vehicle) -> bool:
        decision = self.decisions.get(vehicle.vehicle_id)
        return decision is not None and decision.on

    async def async_apply(self, now: datetime) -> None:
        """Set the current (and phases) of the cars charging on the sun; give the others back their current."""
        supply = self._supply
        for vehicle in self._cars():
            decision = self.decisions.get(vehicle.vehicle_id)
            on = decision is not None and decision.on and vehicle.decision.reason == REASON_SOLAR
            entity = supply.current_entity(vehicle)
            phase_entity = self.phase_entity(vehicle)
            if on and decision is not None:
                if decision.phases and phase_entity and self._phases_sent.get(vehicle.vehicle_id) != decision.phases:
                    await self._async_phases(vehicle, phase_entity, decision.phases)
                if entity and decision.amps is not None:
                    # Only when it changed: a car in the cloud is not told the same every minute.
                    await supply.async_keep_current(vehicle, entity, decision.amps, now)
                    if vehicle.vehicle_id not in self._restore:
                        self._restore.add(vehicle.vehicle_id)
                        self.household.async_save()
            else:
                if vehicle.vehicle_id in self._restore:
                    # Done on the sun: the full current again.
                    self._restore.discard(vehicle.vehicle_id)
                    self.household.async_save()
                    if entity and supply.plan_amps(vehicle, now) is None:
                        await supply.async_set_current(vehicle, entity, supply.bounds(entity)[1], now)
                # Three phases again only when it charges from the grid; between suns it stays as it is,
                # so the charger's contactor is not switched for nothing.
                grid = vehicle.decision.control == CONTROL_CHARGE and vehicle.decision.reason != REASON_SOLAR
                if grid and phase_entity and self._phases_sent.get(vehicle.vehicle_id) == 1:
                    await self._async_phases(vehicle, phase_entity, 3)
        await self._async_hold()

    async def _async_phases(self, vehicle: Vehicle, entity: str, phases: int) -> None:
        domain = entity.split(".", 1)[0]
        try:
            await self.hass.services.async_call(
                domain if domain in ("switch", "input_boolean") else "homeassistant",
                "turn_on" if phases == 3 else "turn_off",
                {"entity_id": entity},
                blocking=True,
            )
        except HomeAssistantError as err:
            _LOGGER.warning("Could not set %s to %s phases: %s", entity, phases, err)
            return
        self._phases_sent[vehicle.vehicle_id] = phases
        self.household.async_save()

    async def _async_hold(self) -> None:
        """While a car charges from the grid, hold the home battery, so it does not empty itself into the car."""
        entity = self._option(CONF_BATTERY_HOLD)
        if not entity:
            return
        hold = any(
            self.household.is_charging(vehicle) and vehicle.decision.reason in GRID_REASONS for vehicle in self._cars()
        )
        if hold == self._hold:
            return
        domain = str(entity).split(".", 1)[0]
        try:
            await self.hass.services.async_call(
                domain if domain in ("switch", "input_boolean") else "homeassistant",
                "turn_on" if hold else "turn_off",
                {"entity_id": str(entity)},
                blocking=True,
            )
        except HomeAssistantError as err:
            _LOGGER.warning("Could not %s the home battery hold %s: %s", "turn on" if hold else "turn off", entity, err)
            return
        self._hold = hold

    # ------------------------------------------------------------------
    # Counting: how much of what a car takes now is sun

    def share_now(self, vehicle: Vehicle) -> float:
        grid = self.grid_kw() if self.active else None
        if grid is None:
            return 0.0
        if not self._here(vehicle):
            return 0.0
        cars = sum(self._car_kw(other) for other in self._cars())
        return solar_share(cars, grid) if self._car_kw(vehicle) > 0 else 0.0

    # ------------------------------------------------------------------
    # The forecast

    async def async_refresh_forecast(self, now: datetime, *, force: bool = False) -> bool:
        """Fetch the forecast from the Energy dashboard's solar forecast; True when it changed."""
        if self.site is not None and not self.site.home:
            # The Energy dashboard is the home's: another place has no forecast.
            return False
        if not self.active or self._option(CONF_SOLAR_FORECAST) is False:
            changed = bool(self.forecast)
            self.forecast = {}
            return changed
        if not force and self._forecast_at is not None and elapsed(now, self._forecast_at) < FORECAST_EVERY:
            return False
        self._forecast_at = now
        hours = await self._async_fetch_forecast()
        changed = hours != self.forecast
        self.forecast = hours
        return changed

    async def _async_fetch_forecast(self) -> dict[datetime, float]:
        try:
            from homeassistant.components.energy.data import async_get_manager
            from homeassistant.components.energy.websocket_api import async_get_energy_platforms
        except ImportError:  # pragma: no cover - the energy integration is always there
            return {}
        try:
            manager = await async_get_manager(self.hass)
            prefs: Any = manager.data or {}
            entries = {
                entry_id
                for source in prefs.get("energy_sources", [])
                if source.get("type") == "solar"
                for entry_id in source.get("config_entry_solar_forecast") or []
            }
            if not entries:
                return {}
            platforms: Any = await async_get_energy_platforms(self.hass)
            hours: dict[datetime, float] = {}
            for entry_id in entries:
                entry = self.hass.config_entries.async_get_entry(entry_id)
                if entry is None or entry.domain not in platforms:
                    continue
                data = await platforms[entry.domain](self.hass, entry_id)
                for key, wh in ((data or {}).get("wh_hours") or {}).items():
                    moment = dt_util.parse_datetime(str(key))
                    if moment is not None and isinstance(wh, int | float):
                        hours[moment] = hours.get(moment, 0.0) + float(wh)
            return hours
        except Exception as err:  # a forecast is a bonus, never a reason to fail
            _LOGGER.debug("No solar forecast: %s", err)
            return {}

    def expected_kwh(self, vehicle: Vehicle, now: datetime, until: datetime | None) -> float:
        """Sun the plan may count on for this car before ``until``: a part of the forecast, less the house."""
        if until is None or self.mode(vehicle) != SOLAR_SURPLUS or not self.forecast:
            return 0.0
        end = until - timedelta(hours=1)
        hours = {
            start: max(0.0, wh - HOUSE_PER_HOUR * 1000)
            for start, wh in self.forecast.items()
            if start + timedelta(hours=1) > now and start < end
        }
        sharing = sum(
            1
            for other in self._cars()
            if self.mode(other) == SOLAR_SURPLUS and other.connected is not False and other.at_home is not False
        )
        return FORECAST_TRUST * forecast_kwh(hours, now, end) / max(1, sharing)

    def expected_soc(self, vehicle: Vehicle, now: datetime, until: datetime | None) -> float:
        """The same, as charge level (%)."""
        kwh = self.expected_kwh(vehicle, now, until)
        return kwh * CHARGE_EFFICIENCY / vehicle.capacity * 100 if vehicle.capacity > 0 else 0.0

    # ------------------------------------------------------------------
    # State and storage

    def forecast_today(self, now: datetime) -> float | None:
        if not self.forecast:
            return None
        start = dt_util.start_of_local_day(now)
        return round(forecast_kwh(self.forecast, now, start + timedelta(days=1)), 1)

    def state(self, now: datetime) -> dict[str, Any] | None:
        if not self.active:
            return None
        grid = self.grid_kw()
        battery_kw = self.battery_kw()
        return {
            "grid_kw": None if grid is None else round(grid, 2),
            "solar_kw": None if (sun := self.solar_kw()) is None else round(sun, 2),
            "battery": None
            if battery_kw is None and self.battery_soc() is None
            else {"kw": None if battery_kw is None else round(battery_kw, 2), "soc": self.battery_soc()},
            "cars": {
                vid: {"on": decision.on, "amps": decision.amps, "phases": decision.phases}
                for vid, decision in self.decisions.items()
            },
            # The cars that leave the surplus to the grid now: selling pays more than their plan costs.
            "sold": {
                vid: {"sold_for": round(sold, 3), "plan": round(price, 3)} for vid, (sold, price) in self.sold.items()
            },
            "forecast_left_today": self.forecast_today(now),
        }

    def to_store(self) -> dict[str, Any]:
        """Each car's state on the sun, and what is to be put back after it: the full current, three phases."""
        return {
            "states": {vid: state.to_dict() for vid, state in self.controller.states.items()},
            "restore": sorted(self._restore),
            "phases": dict(self._phases_sent),
        }

    def load(self, data: Any) -> None:
        if not isinstance(data, dict):
            return
        # Before 2.3.0b3 only the states were stored, each under its car.
        stored = data.get("states")
        states: dict[Any, Any] = stored if isinstance(stored, dict) else data
        self.controller.states = {
            str(vid): SolarState.from_dict(value) for vid, value in states.items() if isinstance(value, dict)
        }
        if isinstance(data.get("restore"), list):
            self._restore = {str(vid) for vid in data["restore"]}
        if isinstance(data.get("phases"), dict):
            self._phases_sent = {str(vid): int(value) for vid, value in data["phases"].items() if value in (1, 3)}
