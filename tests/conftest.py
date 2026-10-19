"""Fixtures for EV Planner tests."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Generator, Sequence
from datetime import datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState, ConfigSubentryDataWithId
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.ev_planner.const import DOMAIN

PRICE_ENTITY = "sensor.energi_data_service"
NOW = "2026-10-19T20:00:00+02:00"
# Hourly prices from 20:00 to 07:00 next morning; the cheapest hours are 02 and 03.
NIGHT = [1.8, 1.5, 1.2, 1.0, 0.9, 0.4, 0.3, 0.35, 0.8, 1.1, 1.6]

SOC = "sensor.tesla_battery"
LIMIT = "number.tesla_charge_limit"
CABLE = "binary_sensor.tesla_cable"
CHARGE_SWITCH = "switch.tesla_charge"
CHARGING = "binary_sensor.tesla_charging"
CHARGER_SWITCH = "switch.carport"
CHARGER_METER = "sensor.carport_energy"
CHARGER_CAR = "binary_sensor.carport_car"

TESLA = "tesla_id"
MERCEDES = "mercedes_id"
CARPORT = "carport_id"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Allow loading custom_components in every test."""


@pytest.fixture(autouse=True)
def skip_panel_dependencies(hass: HomeAssistant) -> None:
    """The sidebar panel needs the real frontend; mark it as loaded instead."""
    hass.config.components.update({"frontend", "image_upload", "panel_custom"})


@pytest.fixture(autouse=True)
def mock_panel() -> Generator[tuple[AsyncMock, MagicMock]]:
    """Don't serve the panel files in tests (that needs the real frontend)."""
    with (
        patch("custom_components.ev_planner.async_register_panel") as register,
        patch("custom_components.ev_planner.async_unregister_panel") as unregister,
    ):
        yield register, unregister


@pytest.fixture
async def now(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> datetime:
    """Freeze time at Monday 20:00 Copenhagen time."""
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    moment = dt_util.parse_datetime(NOW)
    assert moment is not None
    freezer.move_to(moment)
    return moment


def set_prices(hass: HomeAssistant, start: datetime, prices: Sequence[float]) -> None:
    """Set the price sensor with hourly prices starting at ``start``."""
    hass.states.async_set(
        PRICE_ENTITY,
        str(prices[0]),
        {
            "raw_today": [
                {"hour": (start + timedelta(hours=offset)).isoformat(), "price": price}
                for offset, price in enumerate(prices)
            ],
            "raw_tomorrow": [],
        },
    )


async def move(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: datetime) -> None:
    """Move time and let every timer and the debounced recalculation run."""
    freezer.move_to(moment)
    async_fire_time_changed(hass, moment)
    await hass.async_block_till_done()
    later = moment + timedelta(seconds=2)
    freezer.move_to(later)
    async_fire_time_changed(hass, later)
    await hass.async_block_till_done()


async def settle(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    """Let the debounced recalculation run."""
    await move(hass, freezer, dt_util.now() + timedelta(seconds=2))


def tesla_data(**extra: Any) -> dict[str, Any]:
    return {
        "battery_capacity": 60.0,
        "charge_power": 10.0,
        "soc_entity": SOC,
        "target_entity": LIMIT,
        "connected_entity": CABLE,
        "charging_entity": CHARGING,
        "control": "car",
        "control_entity": CHARGE_SWITCH,
        "charger": CARPORT,
        **extra,
    }


def mercedes_data(**extra: Any) -> dict[str, Any]:
    return {"battery_capacity": 66.5, "charge_power": 11.0, "control": "none", "charger": CARPORT, **extra}


def carport_data(**extra: Any) -> dict[str, Any]:
    return {"power": 11.0, **extra}


def entry_with(*subentries: ConfigSubentryDataWithId, options: dict[str, Any] | None = None) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        title="EV Planner",
        unique_id=DOMAIN,
        data={
            "price_entity": PRICE_ENTITY,
            "country": "Denmark",
            "motorapi_api_key": "",
            "plate_provider": "motorapi_dk",
        },
        options={"currency": "DKK", "notify_services": [], **(options or {})},
        subentries_data=list(subentries),
        version=1,
        minor_version=1,
    )


def vehicle_sub(subentry_id: str, title: str, data: dict[str, Any]) -> ConfigSubentryDataWithId:
    return ConfigSubentryDataWithId(
        data=data, subentry_id=subentry_id, subentry_type="vehicle", title=title, unique_id=None
    )


def charger_sub(data: dict[str, Any] | None = None) -> ConfigSubentryDataWithId:
    return ConfigSubentryDataWithId(
        data=data or carport_data(), subentry_id=CARPORT, subentry_type="charger", title="Carport", unique_id=None
    )


def set_tesla(
    hass: HomeAssistant,
    *,
    soc: float = 50,
    limit: float = 80,
    cable: bool = True,
    switch: bool = False,
    charging: bool = False,
) -> None:
    hass.states.async_set(SOC, str(soc), {"unit_of_measurement": "%"})
    hass.states.async_set(LIMIT, str(limit))
    hass.states.async_set(CABLE, "on" if cable else "off")
    hass.states.async_set(CHARGE_SWITCH, "on" if switch else "off")
    hass.states.async_set(CHARGING, "on" if charging else "off")


class SwitchCalls:
    """Records what EV Planner switches, and mirrors it in the switch's state.

    The real ``switch.turn_on`` action belongs to the switch platform, which
    EV Planner's own switches also use, so the call is recorded one step
    earlier.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.calls: list[tuple[str, str]] = []
        self.mirror = True
        self.error: str | None = None

    async def switch(self, _household: Any, entity_id: str, on: bool) -> str | None:
        self.calls.append(("turn_on" if on else "turn_off", entity_id))
        if self.error:
            return self.error
        if self.mirror:
            self.hass.states.async_set(entity_id, "on" if on else "off")
        return None


class NotifyCalls:
    """Records notify.mobile_app_phone calls."""

    def __init__(self, hass: HomeAssistant, name: str = "mobile_app_phone") -> None:
        self.calls: list[dict[str, Any]] = []
        hass.services.async_register("notify", name, self._handle)

    async def _handle(self, call: ServiceCall) -> None:
        self.calls.append(dict(call.data))

    def messages(self) -> list[str]:
        return [str(call.get("message")) for call in self.calls]


@pytest.fixture
def switches(hass: HomeAssistant) -> Generator[SwitchCalls]:
    calls = SwitchCalls(hass)

    async def fake(household: Any, entity_id: str, on: bool) -> str | None:
        return await calls.switch(household, entity_id, on)

    with patch("custom_components.ev_planner.household.Household._async_switch", fake):
        yield calls


@pytest.fixture
def notify(hass: HomeAssistant) -> NotifyCalls:
    return NotifyCalls(hass)


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """A household with a Tesla (controlled by the car), a Mercedes (plan only) and a charger."""
    return entry_with(
        charger_sub(),
        vehicle_sub(TESLA, "Tesla", tesla_data()),
        vehicle_sub(MERCEDES, "Mercedes", mercedes_data()),
    )


@pytest.fixture
async def init_integration(
    hass: HomeAssistant, now: datetime, mock_config_entry: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> AsyncGenerator[MockConfigEntry]:
    """Set up EV Planner with the night prices and the Tesla plugged in at 50 %."""
    set_prices(hass, now, NIGHT)
    set_tesla(hass)
    mock_config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    await settle(hass, freezer)
    yield mock_config_entry
    if mock_config_entry.state is ConfigEntryState.LOADED:
        await hass.config_entries.async_unload(mock_config_entry.entry_id)
        await hass.async_block_till_done()
