"""The weather in the house forecast, and holding a heat pump back, in Home Assistant."""

from __future__ import annotations

from datetime import datetime, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util
import pytest

from custom_components.ev_household_planner.planner import PriceSlot
from custom_components.ev_household_planner.supply import HouseForecast
from custom_components.ev_household_planner.supply_control import HOLD_HEAT_PUMP, HOLDS_PER_NIGHT

from .conftest import CHARGE_SWITCH, NIGHT, TESLA, SwitchCalls, set_prices, set_tesla
from .test_supply_ha import AMPS, METER, _entry, _setup, _skoda

WEATHER = "weather.home"
BLOCK = "switch.heat_pump_block"
HEAT_PUMP = "sensor.heat_pump_power"


def _mild_weeks() -> HouseForecast:
    forecast = HouseForecast()
    for day in range(14):
        for hour in range(24):
            t = 3 + 8 * ((hour + day) % 24) / 23
            forecast.add(hour, False, 2 + (16 - t) * 0.33, t)
    return forecast


def _weather(hass: HomeAssistant, now: datetime, temperature: float, unit: str = "°C") -> list[ServiceCall]:
    calls: list[ServiceCall] = []
    hass.states.async_set(WEATHER, "cloudy", {"temperature": temperature, "temperature_unit": unit})

    async def forecasts(call: ServiceCall) -> ServiceResponse:
        calls.append(call)
        hour = now.replace(minute=0, second=0, microsecond=0)
        return {
            WEATHER: {
                "forecast": [
                    {"datetime": (hour + timedelta(hours=k)).isoformat(), "temperature": temperature} for k in range(48)
                ]
                + [{"datetime": "never", "temperature": 1}, "nothing"]
            }
        }

    hass.services.async_register("weather", "get_forecasts", forecasts, supports_response=SupportsResponse.ONLY)
    return calls


async def test_a_cold_forecast_raises_what_the_house_is_expected_to_draw(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    calls = _weather(hass, now, -8)
    entry = _entry(weather_entity=WEATHER)
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    supply.forecast = _mild_weeks()
    assert await supply.async_refresh_weather(dt_util.now(), force=True)
    assert calls and calls[-1].data["type"] == "hourly"
    # Fetched a moment ago: not again, and the same forecast is no reason to plan again.
    assert not await supply.async_refresh_weather(dt_util.now())
    assert not await supply.async_refresh_weather(dt_util.now(), force=True)
    start = dt_util.now().replace(minute=0, second=0, microsecond=0) + timedelta(hours=3)
    slot = PriceSlot(start, start + timedelta(hours=1), 1.0)
    plain = supply.forecast.predict(start.hour, False, supply.reserve)
    assert supply.house_at(slot, set()) > plain + 2
    state = supply.state(dt_util.now())
    assert state is not None and state["weather"]["now"] == -8 and state["weather"]["slope"] < 0
    # Learning keeps the temperature with the hour.
    supply._hour = None
    supply.sample(dt_util.now())
    assert supply._temps == ([-8.0] if supply.house_now() is not None else [])


async def test_the_weather_in_fahrenheit_and_a_failing_forecast(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    hass.states.async_set(WEATHER, "cloudy", {"temperature": 14, "temperature_unit": "°F"})

    async def broken(call: ServiceCall) -> ServiceResponse:
        raise HomeAssistantError("no forecast")

    hass.services.async_register("weather", "get_forecasts", broken, supports_response=SupportsResponse.ONLY)
    entry = _entry(weather_entity=WEATHER)
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    assert supply.temperature_now() == pytest.approx(-10)
    assert not await supply.async_refresh_weather(dt_util.now(), force=True)
    # No forecast: the hour ahead counts on the temperature now, later hours on nothing.
    assert supply.temperature_at(dt_util.now()) == pytest.approx(-10)
    assert supply.temperature_at(dt_util.now() + timedelta(hours=5)) is None
    hass.states.async_remove(WEATHER)
    assert supply.temperature_now() is None


async def test_without_a_weather_entity_the_forecast_is_as_before(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20)
    _skoda(hass, soc=20)
    entry = _entry()
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    assert supply.temperature_at(dt_util.now()) is None
    assert not await supply.async_refresh_weather(dt_util.now(), force=True)
    assert supply.state(dt_util.now())["weather"] is None  # type: ignore[index]
    assert supply.heat_pump_state(dt_util.now()) is None


async def test_the_guard_holds_the_heat_pump_back_before_it_stops_a_car(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(METER, "10", {"unit_of_measurement": "A"})
    hass.states.async_set(HEAT_PUMP, "2000", {"unit_of_measurement": "W"})
    entry = _entry(supply_meter=[METER], supply_guard=True, heat_pump_block=BLOCK, heat_pump_power=HEAT_PUMP)
    calls = await _setup(hass, freezer, entry)
    household = entry.runtime_data
    supply = household.supply
    supply._sent.clear()
    hass.states.async_set(AMPS, "16", {"min": 6, "max": 16})
    hass.states.async_set(CHARGE_SWITCH, "on")
    household.vehicles[TESLA].last_sent = None
    calls.clear()
    switches.calls.clear()
    # 35 A: 12 over. 16 to 6 A is 10; the heat pump's 2.9 A does the rest, the car goes on.
    hass.states.async_set(METER, "35", {"unit_of_measurement": "A"})
    await hass.async_block_till_done()
    assert [c.data["value"] for c in calls] == [6]
    assert ("turn_on", BLOCK) in switches.calls
    assert ("turn_off", CHARGE_SWITCH) not in switches.calls
    state = supply.heat_pump_state(dt_util.now())
    assert state is not None and state["held"] and state["kw"] == 2.0 and state["holds_tonight"] == 1
    # Room is counted as if the heat pump ran.
    assert supply._room_reading() == pytest.approx(35 + 2000 / 690, abs=0.01)
    # Not before its time, then it runs again.
    await supply.async_release_heat_pump(dt_util.now())
    assert ("turn_off", BLOCK) not in switches.calls
    await supply.async_release_heat_pump(dt_util.now() + HOLD_HEAT_PUMP)
    assert ("turn_off", BLOCK) in switches.calls
    assert not supply.heat_pump_state(dt_util.now())["held"]  # type: ignore[index]


async def test_the_heat_pump_is_held_back_only_so_often_and_only_when_it_runs(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    hass.states.async_set(HEAT_PUMP, "50", {"unit_of_measurement": "W"})
    entry = _entry(supply_meter=[METER], supply_guard=True, heat_pump_block=BLOCK, heat_pump_power=HEAT_PUMP)
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    moment = dt_util.now()
    assert await supply._async_hold_heat_pump(moment) == 0  # it is resting
    hass.states.async_set(HEAT_PUMP, "1.4", {"unit_of_measurement": "kW"})
    supply._holds = [moment - timedelta(hours=1)] * HOLDS_PER_NIGHT
    assert await supply._async_hold_heat_pump(moment) == 0  # held twice tonight already
    supply._holds = [moment - timedelta(days=1)] * HOLDS_PER_NIGHT
    assert await supply._async_hold_heat_pump(moment) == pytest.approx(1400 / 690, abs=0.01)
    # Leaving: the heat pump is never left held back.
    switches.calls.clear()
    supply.async_stop()
    await hass.async_block_till_done()
    assert ("turn_off", BLOCK) in switches.calls


async def test_without_a_power_reading_the_heat_pump_counts_as_three_amps(
    hass: HomeAssistant, now: datetime, freezer: FrozenDateTimeFactory, switches: SwitchCalls
) -> None:
    set_prices(hass, now, NIGHT)
    set_tesla(hass, soc=20, switch=True, charging=True)
    _skoda(hass, soc=20)
    entry = _entry(supply_meter=[METER], supply_guard=True, heat_pump_block=BLOCK)
    await _setup(hass, freezer, entry)
    supply = entry.runtime_data.supply
    switches.error = "unavailable"
    assert await supply._async_hold_heat_pump(dt_util.now()) == 0
    switches.error = None
    assert await supply._async_hold_heat_pump(dt_util.now()) == 3.0
    state = supply.heat_pump_state(dt_util.now())
    assert state is not None and state["kw"] is None and state["held"]
    # Forced: at once.
    await supply.async_release_heat_pump(dt_util.now(), force=True)
    assert not supply.heat_pump_state(dt_util.now())["held"]  # type: ignore[index]
