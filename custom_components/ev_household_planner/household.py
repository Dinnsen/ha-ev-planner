"""The household coordinator: prices, cars, chargers and the guest.

EV Planner does not poll. It reacts to the price sensor, the cars' and
chargers' entities, user input, and a one-minute tick that decides what each
charger should do now (plans start and end on whole minutes, and the low
price rule follows the current price).
"""

from __future__ import annotations

import asyncio
from collections.abc import Mapping
from dataclasses import dataclass, replace
from datetime import UTC, date, datetime, timedelta
from functools import partial
import logging
import re
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN, UnitOfEnergy, UnitOfPower
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, State, callback
from homeassistant.exceptions import HomeAssistantError, ServiceNotFound, ServiceValidationError
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_call_later, async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.start import async_at_started
from homeassistant.helpers.storage import Store
from homeassistant.helpers.translation import async_get_translations
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .const import (
    ACTION_CHARGE_NOW,
    ACTION_FOLLOW_PLAN,
    BLIP_HOLD,
    BLIP_KWH,
    CALENDAR_LOOKAHEAD,
    CALENDAR_REFRESH,
    COMMAND_REPEAT,
    COMMAND_TIMEOUT,
    CONF_CONNECTED_ENTITY,
    CONF_COUNTRY,
    CONF_CURRENCY,
    CONF_ENERGY_ENTITY,
    CONF_EXPORT_PRICE,
    CONF_EXPORT_PRICE_ENTITY,
    CONF_HOME,
    CONF_MOTORAPI_KEY,
    CONF_NOTIFY,
    CONF_PLATE_PROVIDER,
    CONF_POWER,
    CONF_POWER_ENTITY,
    CONF_PRICE_ADD,
    CONF_PRICE_ENTITY,
    CONF_SITE,
    CONF_SWITCH_ENTITY,
    CONF_UNPLUGGED_STATES,
    CONTROL_BACKOFF,
    CONTROL_CAR,
    CONTROL_CHARGE,
    CONTROL_CHARGER,
    CONTROL_FAILS_ISSUE,
    CONTROL_NONE,
    CONTROL_PAUSE,
    CONTROL_RELEASED,
    COUNTRY_DENMARK,
    DEFAULT_CHARGE_POWER,
    DEFAULT_COUNTRY,
    DEFAULT_CURRENCY,
    DEFAULT_PLATE_PROVIDER,
    DEFAULT_UNPLUGGED_STATES,
    DOMAIN,
    EVENT_NOTIFICATION_ACTION,
    FORGET_RESUME,
    ISSUE_CONTROL_FAILED,
    ISSUE_PRICE_ENTITY_MISSING,
    LIVE_MIN_INTERVAL,
    MIN_REST,
    MODE_CHARGE_NOW,
    MODE_OFF,
    MODE_PAUSE,
    MODE_SMART,
    MODES,
    MOVED_KEYS,
    PART_KEYS,
    PART_TYPES,
    PLANNING_HORIZON,
    PROBLEM_RECHECK,
    REASON_SOLAR,
    REASON_WAITING,
    RECALCULATE_DELAY,
    RECALCULATE_MAX_WAIT,
    REMINDER_MAX_REPEATS,
    SAVE_COUNTERS,
    SET_DAY_TARGETS,
    SET_KNOWN_PRICES,
    SET_LIVE,
    SET_MANUAL_SOC,
    SET_MODE,
    SET_NOTIFY_DONE,
    SET_NOTIFY_RECEIPT,
    SET_REMINDER,
    SET_REMINDER_DAYS,
    SET_REMINDER_HORIZON,
    SET_REMINDER_PRICE,
    SET_REMINDER_PRICE_ENABLED,
    SET_REMINDER_REPEAT,
    SET_REMINDER_SOC,
    SET_REMINDER_TIME,
    SET_SCHEDULE,
    SET_TARGET_SOC,
    SITE_HOME,
    STORAGE_KEY,
    STORAGE_VERSION,
    SUBENTRY_CHARGER,
    SUBENTRY_SITE,
    SUBENTRY_VEHICLE,
    UNPLUG_CONFIRM,
    VERIFY_BACKOFF,
    VERIFY_DELAY,
    VERIFY_UNKNOWN_TRIES,
    WEEKDAYS,
    WIDGET_MIN_INTERVAL,
)
from .guest import GuestSession
from .home import HomeInfo
from .layout import clean_layouts
from .learning import MIN_POWER_KW
from .notifications import COLOR_CHARGE, COLOR_ERROR, COLOR_WARN, Notifier, tag_for
from .pairing import Pairing, Site
from .planner import PlanError, PriceSlot, Segment, segments_to_schedule
from .prices import extract_price_slots
from .rules import (
    Car,
    Decision,
    VehiclePlan,
    current_price,
    decide,
    fallback_plan,
    in_segments,
    keep_fallback,
    keep_previous,
    parse_hhmm,
    plan_vehicle,
)
from .solar_control import SolarControl
from .supply_control import SupplyControl
from .vehicle import Vehicle, elapsed, is_charging_state, to_float

_LOGGER = logging.getLogger(__name__)

type EVPlannerConfigEntry = ConfigEntry[Household]

TICK = timedelta(minutes=1)
ENFORCE_AFTER_PLUG_IN = timedelta(minutes=3)
# A session without a charging sensor ends when the charge level has not risen for this long.
IDLE_END = timedelta(minutes=30)
# language: the language of notifications; "auto" follows Home Assistant's language.
# house: which picture of a house the Home tab shows.
SETTINGS_DEFAULTS: dict[str, Any] = {
    "bill_price": None,
    "payment_text": "",
    "language": "auto",
    "house": "classic",
    "houses": {},
}
TRIP_TARGET = re.compile(r"(\d{2,3})\s*%")
TOGGLE_DOMAINS = ("switch", "input_boolean", "light", "fan")


@dataclass(slots=True)
class Charger:
    """A charge point, from a charger subentry."""

    charger_id: str
    name: str
    config: dict[str, Any]
    connected: bool | None = None
    meter_last: float | None = None
    guest_last_sent: str | None = None
    # Who is at the charger, when that was found or chosen: a car's id, or ``guest``.
    occupant: str | None = None
    # How it was found ("found", "only_charger" or "chosen"), and when the charger got its car
    # (None: before EV Planner saw it).
    found_by: str | None = None
    plugged_at: datetime | None = None
    # The household has a question about this charger on its phones.
    asked: bool = False

    @property
    def power(self) -> float:
        return to_float(self.config.get(CONF_POWER)) or DEFAULT_CHARGE_POWER

    @property
    def switch_entity(self) -> str | None:
        return self.config.get(CONF_SWITCH_ENTITY) or None

    @property
    def energy_entity(self) -> str | None:
        return self.config.get(CONF_ENERGY_ENTITY) or None

    @property
    def connected_entity(self) -> str | None:
        return self.config.get(CONF_CONNECTED_ENTITY) or None

    @property
    def power_entity(self) -> str | None:
        return self.config.get(CONF_POWER_ENTITY) or None

    def read_connected(self, state: str | None) -> bool | None:
        if state is None or state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return None
        raw = self.config.get(CONF_UNPLUGGED_STATES) or DEFAULT_UNPLUGGED_STATES
        if isinstance(raw, str):
            raw = raw.split(",")
        return state.strip().lower() not in {str(item).strip().lower() for item in raw}


def meter_value(state: State | None) -> float | None:
    """An energy meter reading in kWh."""
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    value = to_float(state.state)
    if value is None:
        return None
    unit = state.attributes.get("unit_of_measurement")
    if unit == UnitOfEnergy.WATT_HOUR:
        return value / 1000
    if unit == UnitOfEnergy.MEGA_WATT_HOUR:
        return value * 1000
    return value


def power_value(state: State | None) -> float | None:
    """A power reading in kW."""
    value = state_float(state)
    if value is None or state is None:
        return None
    unit = state.attributes.get("unit_of_measurement")
    if unit == UnitOfPower.WATT:
        return value / 1000
    if unit == UnitOfPower.MEGA_WATT:
        return value * 1000
    return value


def state_float(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    return to_float(state.state)


class Household(DataUpdateCoordinator[None]):
    """Central state of one EV Planner household."""

    config_entry: EVPlannerConfigEntry

    def __init__(self, hass: HomeAssistant, entry: EVPlannerConfigEntry) -> None:
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN}_{entry.entry_id}", update_interval=None)
        self.vehicles: dict[str, Vehicle] = {}
        self.chargers: dict[str, Charger] = {}
        # The places: the home, and the others (a summer house). The home is always there and has
        # the id "home" here, whatever its subentry is called; a household from before places were
        # parts of their own has its home's settings among its own, and they are read from there.
        legacy = {key: value for key in MOVED_KEYS if (value := self.config.get(key)) not in (None, "", [])}
        self.sites: dict[str, Site] = {SITE_HOME: Site(SITE_HOME, "", legacy)}
        self._site_keys: dict[str, str] = {}
        for subentry_id, subentry in entry.subentries.items():
            if subentry.subentry_type == SUBENTRY_VEHICLE:
                self.vehicles[subentry_id] = Vehicle(subentry_id, subentry.title, dict(subentry.data))
            elif subentry.subentry_type == SUBENTRY_CHARGER:
                self.chargers[subentry_id] = Charger(subentry_id, subentry.title, dict(subentry.data))
            elif subentry.subentry_type == SUBENTRY_SITE:
                if subentry.data.get(CONF_HOME) and SITE_HOME not in self._site_keys.values():
                    self._site_keys[subentry_id] = SITE_HOME
                    self.sites[SITE_HOME] = Site(SITE_HOME, subentry.title, {**legacy, **subentry.data})
                else:
                    self.sites[subentry_id] = Site(subentry_id, subentry.title, dict(subentry.data))
        # The parts of a place (the sun, a home battery, a heat pump): one of each kind for a place.
        for subentry_id, subentry in entry.subentries.items():
            kind = subentry.subentry_type
            if kind not in PART_TYPES:
                continue
            site = self.sites[self.site_key(subentry.data.get(CONF_SITE))]
            if kind in site.parts:
                continue
            site.parts[kind] = subentry_id
            for key in PART_KEYS[kind]:
                if key in subentry.data:
                    site.data[key] = subentry.data[key]
                else:
                    site.data.pop(key, None)
        self.pairing = Pairing(self)
        self.guest = GuestSession(hass, self)
        self.settings: dict[str, Any] = dict(SETTINGS_DEFAULTS)
        # Photos of the cars and chargers: {car or charger id: image_upload id}.
        self.images: dict[str, str] = {}
        # Where the household has placed things in the house picture (see layout.py).
        self.layout: dict[str, Any] = {}
        # The photo as it was before its background was cut away, so the cut can be undone.
        self.originals: dict[str, str] = {}
        self.notifier = Notifier(hass, self.notify_services)
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY.format(entry_id=entry.entry_id))
        self._unsub: list[CALLBACK_TYPE] = []
        self._recalc_timer: CALLBACK_TYPE | None = None
        self._recalc_since: float | None = None
        self._recalc_force = False
        # One evaluation at a time: two at once would send the same command twice.
        self._control_lock = asyncio.Lock()
        self._save_due: float | None = None
        self._slots_cache: tuple[State | None, date, float, list[PriceSlot]] | None = None
        self._verify_unknown: dict[str, int] = {}
        self._verify_timers: dict[str, CALLBACK_TYPE] = {}
        self._unplug_timers: dict[str, CALLBACK_TYPE] = {}
        # A supply for each place; ``supply`` is the home's.
        self.supplies: dict[str, SupplyControl] = {
            site_id: SupplyControl(self, site) for site_id, site in self.sites.items()
        }
        self.supply = self.supplies[SITE_HOME]
        # The sun and what the place draws, for each place; ``solar`` and ``home`` are the home's.
        self.solars: dict[str, SolarControl] = {
            site_id: SolarControl(self, site) for site_id, site in self.sites.items()
        }
        self.homes: dict[str, HomeInfo] = {site_id: HomeInfo(self, site) for site_id, site in self.sites.items()}
        self.solar = self.solars[SITE_HOME]
        self.home = self.homes[SITE_HOME]
        self._widgets_sent: datetime | None = None
        # The status words in Danish and English, for the summary line widgets show.
        self._status_texts: dict[str, dict[str, str]] = {}
        self._widgets_timer: CALLBACK_TYPE | None = None
        self._last_status: dict[str, str] = {}
        self._started = False
        self.data = None

    # ------------------------------------------------------------------
    # Configuration

    @property
    def config(self) -> dict[str, Any]:
        return {**self.config_entry.data, **self.config_entry.options}

    @property
    def price_entity(self) -> str:
        return str(self.config[CONF_PRICE_ENTITY])

    @property
    def currency(self) -> str:
        return str(self.config.get(CONF_CURRENCY) or self.hass.config.currency or DEFAULT_CURRENCY)

    @property
    def motorapi_key(self) -> str:
        """The key for looking up guest cars; none outside Denmark, where MotorAPI has no cars."""
        if self.country != COUNTRY_DENMARK:
            return ""
        return str(self.config.get(CONF_MOTORAPI_KEY) or "").strip()

    @property
    def country(self) -> str:
        return str(self.config.get(CONF_COUNTRY) or DEFAULT_COUNTRY)

    @property
    def plate_provider(self) -> str:
        return str(self.config.get(CONF_PLATE_PROVIDER) or DEFAULT_PLATE_PROVIDER)

    @property
    def notify_services(self) -> list[str]:
        value = self.config.get(CONF_NOTIFY) or []
        return [str(item) for item in value] if isinstance(value, list) else [str(value)]

    # ------------------------------------------------------------------
    # Lifecycle

    async def async_initialize(self) -> None:
        await self._async_load()
        await self._async_load_status_texts()
        hass = self.hass
        start = dt_util.now()
        await self.home.async_refresh(start, force=True)  # the Energy dashboard is the home's
        for vehicle in self.vehicles.values():
            self._read_vehicle(vehicle)
            vehicle.last_soc_seen = vehicle.soc if vehicle.soc is not None else vehicle.last_soc_seen
            if vehicle.connected is False:
                vehicle.unplugged_at = start
            if entities := vehicle.watched_entities():
                self._unsub.append(
                    async_track_state_change_event(
                        hass, entities, partial(self._handle_vehicle_state, vehicle.vehicle_id)
                    )
                )
        for charger in self.chargers.values():
            if charger.connected_entity:
                charger.connected = charger.read_connected(self._state(charger.connected_entity))
            if charger.energy_entity:
                charger.meter_last = self.meter_kwh(charger.energy_entity)
            entities = [entity for entity in (charger.connected_entity, charger.energy_entity) if entity]
            if entities:
                self._unsub.append(
                    async_track_state_change_event(
                        hass, entities, partial(self._handle_charger_state, charger.charger_id)
                    )
                )
        self.pairing.restore()
        self._unsub.append(async_track_state_change_event(hass, [self.price_entity], self._handle_price_update))
        self._unsub.append(async_track_time_interval(hass, self._handle_tick, TICK))
        self._unsub.append(async_track_time_interval(hass, self._handle_calendar_tick, CALENDAR_REFRESH))
        self._unsub.append(hass.bus.async_listen(EVENT_NOTIFICATION_ACTION, self._handle_notification_action))
        self._unsub.append(async_at_started(hass, self._async_started))
        self.guest.async_start()
        await self.async_recalculate(apply=False)

    @callback
    def _async_started(self, _hass: HomeAssistant | None = None) -> None:
        """Once Home Assistant runs: check the price sensor, read calendars, and start acting."""
        self._started = True
        self._check_price_entity()
        for supply in self.supplies.values():
            supply.async_start()
        self.config_entry.async_create_task(self.hass, self._async_after_start(), f"{DOMAIN} start")

    async def _async_after_start(self) -> None:
        await self._async_refresh_calendars()
        await self.async_recalculate()

    async def async_shutdown(self) -> None:
        while self._unsub:
            self._unsub.pop()()
        if self._recalc_timer is not None:
            self._recalc_timer()
            self._recalc_timer = None
        if self._widgets_timer is not None:
            self._widgets_timer()
            self._widgets_timer = None
        for supply in self.supplies.values():
            supply.async_stop()
        for cancel in self._unplug_timers.values():
            cancel()
        self._unplug_timers.clear()
        for cancel in self._verify_timers.values():
            cancel()
        self._verify_timers.clear()
        self.guest.async_stop()
        await self._store.async_save(self._data_to_store())
        await super().async_shutdown()

    async def _async_update_data(self) -> None:
        return None

    def state_of(self, entity_id: str | None) -> str | None:
        """An entity's state, or None."""
        return self._state(entity_id)

    def is_charging(self, vehicle: Vehicle) -> bool:
        return self._is_charging(vehicle)

    def power_reading(self, vehicle: Vehicle) -> float | None:
        """The car's charging power now (kW), when it reports one."""
        return power_value(self.hass.states.get(vehicle.power_entity)) if vehicle.power_entity else None

    def _state(self, entity_id: str | None) -> str | None:
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        return state.state if state is not None else None

    @callback
    def _check_price_entity(self) -> None:
        issue_id = f"{ISSUE_PRICE_ENTITY_MISSING}_{self.config_entry.entry_id}"
        if self.hass.states.get(self.price_entity) is None:
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                issue_id,
                is_fixable=False,
                severity=ir.IssueSeverity.ERROR,
                translation_key=ISSUE_PRICE_ENTITY_MISSING,
                translation_placeholders={"entity_id": self.price_entity, "title": self.config_entry.title},
            )
        else:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)

    # ------------------------------------------------------------------
    # Persistence

    async def _async_load(self) -> None:
        stored = await self._store.async_load()
        if not isinstance(stored, dict):
            return
        vehicles = stored.get("vehicles") or {}
        for vehicle_id, vehicle in self.vehicles.items():
            vehicle.load(vehicles.get(vehicle_id))
        chargers = stored.get("chargers") or {}
        for charger_id, charger in self.chargers.items():
            data = chargers.get(charger_id) or {}
            last = data.get("guest_last_sent")
            charger.guest_last_sent = last if last in (CONTROL_CHARGE, CONTROL_PAUSE) else None
            who = data.get("occupant")
            charger.occupant = who if isinstance(who, str) else None
            charger.found_by = data.get("found_by") if isinstance(data.get("found_by"), str) else None
        self.guest.load(stored.get("guest"))
        self.supply.load(stored.get("supply_forecast"))
        self.supply.load_actuators(stored.get("actuators"))
        places = stored.get("sites") or {}
        for site_id, supply in self.supplies.items():
            if site_id != SITE_HOME and isinstance(place := places.get(site_id), dict):
                supply.load(place.get("forecast"))
                supply.load_actuators(place.get("actuators"))
                self.solars[site_id].load(place.get("solar"))
        self.solar.load(stored.get("solar"))
        self.settings = {**SETTINGS_DEFAULTS, **(stored.get("settings") or {})}
        self.images = self._known_images(stored.get("images"))
        self.layout = clean_layouts(stored.get("layout"))
        self.originals = {
            key: value for key, value in self._known_images(stored.get("image_originals")).items() if key in self.images
        }

    def _known_images(self, images: Any) -> dict[str, str]:
        if not isinstance(images, dict):
            return {}
        return {
            key: value
            for key, value in images.items()
            if isinstance(value, str) and (key in self.vehicles or key in self.chargers)
        }

    @callback
    def async_save(self, delay: float = 1.0) -> None:
        """Write to disk soon. A save that is due sooner already is not put off by a slower one."""
        due = self.hass.loop.time() + delay
        if self._save_due is not None and self._save_due <= due:
            return
        self._save_due = due
        self._store.async_delay_save(self._data_to_store, delay)

    @callback
    def _data_to_store(self) -> dict[str, Any]:
        self._save_due = None
        return {
            "actuators": self.supply.actuators_to_store(),
            "vehicles": {vehicle_id: vehicle.to_store() for vehicle_id, vehicle in self.vehicles.items()},
            "chargers": {
                cid: {
                    "guest_last_sent": charger.guest_last_sent,
                    "occupant": charger.occupant,
                    "found_by": charger.found_by,
                }
                for cid, charger in self.chargers.items()
            },
            "sites": {
                site_id: {
                    "forecast": supply.to_store(),
                    "actuators": supply.actuators_to_store(),
                    "solar": self.solars[site_id].to_store(),
                }
                for site_id, supply in self.supplies.items()
                if site_id != SITE_HOME
            },
            "guest": self.guest.to_store(),
            "supply_forecast": self.supply.to_store(),
            "solar": self.solar.to_store(),
            "settings": self.settings,
            "images": self.images,
            "image_originals": self.originals,
            "layout": self.layout,
        }

    # ------------------------------------------------------------------
    # Prices

    def price_slots(self, now: datetime | None = None) -> list[PriceSlot]:
        """The prices, read from the sensor once for each time it changes (and each day)."""
        state = self.hass.states.get(self.price_entity)
        day = dt_util.as_local(now or dt_util.now()).date()
        add = to_float(self.config.get(CONF_PRICE_ADD)) or 0.0
        cache = self._slots_cache
        if cache is None or cache[0] is not state or cache[1] != day or cache[2] != add:
            slots = extract_price_slots(state, now or dt_util.now())
            if add:
                slots = [replace(slot, price=slot.price + add) for slot in slots]
            cache = self._slots_cache = (state, day, add, slots)
        return list(cache[3])

    def plan_on_forecast(self, vehicle: Vehicle, now: datetime) -> bool:
        """Whether a car's plan has hours whose price is a forecast, not a published price."""
        plan = vehicle.plan
        if plan is None or not plan.segments:
            return False
        forecasts = [slot for slot in self.price_slots(now) if slot.forecast]
        return any(
            slot.start < segment["end"] and segment["start"] < slot.end
            for segment in plan.segments
            for slot in forecasts
        )

    def export_price(self, site_id: str = SITE_HOME) -> float:
        """What a kWh sent to the grid pays now at a place: the sensor, else the fixed price, else nothing."""
        config = self.sites.get(site_id, self.sites[SITE_HOME]).data
        if (entity := config.get(CONF_EXPORT_PRICE_ENTITY)) and (
            value := to_float(self._state(str(entity)))
        ) is not None:
            return max(0.0, value)
        return max(0.0, to_float(config.get(CONF_EXPORT_PRICE)) or 0.0)

    def site_key(self, raw: Any) -> str:
        """The id a place has here, from what a charger or a part has stored for it (none: the home)."""
        key = self._site_keys.get(str(raw), str(raw)) if raw else SITE_HOME
        return key if key in self.sites else SITE_HOME

    def site_id_of(self, vehicle: Vehicle) -> str:
        """The place the car is at (the home when it is at none)."""
        site = self.pairing.vehicle_site(vehicle)
        return site.site_id if site else SITE_HOME

    def solar_of(self, vehicle: Vehicle) -> SolarControl:
        """The sun of the place the car is at."""
        return self.solars[self.site_id_of(vehicle)]

    def visible_slots(self, slots: list[PriceSlot]) -> list[PriceSlot]:
        """Today's and tomorrow's prices, for graphs."""
        if not slots:
            return []
        first = dt_util.start_of_local_day(slots[0].start)
        end = first + PLANNING_HORIZON
        return [slot for slot in slots if slot.start < end]

    def image_url(self, target_id: str, size: int = 512) -> str | None:
        """Where the photo of a car or charger is served, if it has one."""
        image_id = self.images.get(target_id)
        return f"/api/image/serve/{image_id}/{size}x{size}" if image_id else None

    def original_image_url(self, target_id: str) -> str | None:
        """The photo before its background was cut away, if it was."""
        image_id = self.originals.get(target_id)
        return f"/api/image/serve/{image_id}/original" if image_id else None

    def set_image(self, target_id: str, image_id: str | None, cutout: bool = False) -> list[str]:
        """Give a car or charger a photo (None removes it).

        A cut-out keeps the photo it was made from, so it can be undone. Returns
        the photos nothing uses any more, so they can be deleted.
        """
        self._check_target(target_id)
        old = self.images.pop(target_id, None)
        original = self.originals.pop(target_id, None)
        if image_id:
            self.images[target_id] = image_id
            source = original or old
            if cutout and source and source != image_id:
                self.originals[target_id] = source
        return self._images_changed(old, original)

    def restore_image(self, target_id: str) -> list[str]:
        """Undo a cut-out: the car or charger gets the photo it was made from back."""
        self._check_target(target_id)
        original = self.originals.pop(target_id, None)
        if original is None:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="no_original_image")
        old = self.images.get(target_id)
        self.images[target_id] = original
        return self._images_changed(old)

    def _check_target(self, target_id: str) -> None:
        if target_id not in self.vehicles and target_id not in self.chargers:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="car_not_found")

    def _images_changed(self, *dropped: str | None) -> list[str]:
        self.async_save()
        self.async_update_listeners()
        in_use = {*self.images.values(), *self.originals.values()}
        return [image_id for image_id in dict.fromkeys(dropped) if image_id and image_id not in in_use]

    def meter_kwh(self, entity_id: str) -> float | None:
        return meter_value(self.hass.states.get(entity_id))

    # ------------------------------------------------------------------
    # Chargers and the guest

    def charger_for_guest(self, charger_id: Any) -> Charger | None:
        if charger_id and charger_id in self.chargers:
            return self.chargers[str(charger_id)]
        return next(iter(self.chargers.values()), None)

    def blocked_for_guest(self, charger_id: str | None) -> list[Segment]:
        """The guest has priority on its charger, so nothing is blocked for it."""
        return []

    def guest_holds(self, charger_id: str | None, now: datetime) -> bool:
        return (
            charger_id is not None
            and self.guest.charger_id == charger_id
            and self.guest.charger_control(now) != CONTROL_RELEASED
        )

    def now(self) -> datetime:
        return dt_util.now()

    def text(self, key: str, **values: Any) -> str:
        """A text for a notification, in the household's language."""
        return self._text(key, **values)

    def charger_power(self, charger: Charger) -> float | None:
        """What the charger gives now (kW), when it has a power sensor."""
        return power_value(self.hass.states.get(charger.power_entity)) if charger.power_entity else None

    def supply_of(self, vehicle: Vehicle) -> SupplyControl:
        """The supply of the place the car is at (the home's when it is at none)."""
        return self.supplies[self.site_id_of(vehicle)]

    def at_home_site(self, vehicle: Vehicle) -> bool:
        """The car is at the home, not at another of the household's places (or away)."""
        site = self.pairing.vehicle_site(vehicle)
        return site is not None and site.home

    # ------------------------------------------------------------------
    # Reading the cars

    def _read_vehicle(self, vehicle: Vehicle) -> None:
        if vehicle.soc_entity:
            vehicle.soc = state_float(self.hass.states.get(vehicle.soc_entity))
        if vehicle.target_entity:
            vehicle.target_from_car = state_float(self.hass.states.get(vehicle.target_entity))
        if vehicle.capacity_entity:
            vehicle.capacity_from_car = meter_value(self.hass.states.get(vehicle.capacity_entity))
        if vehicle.connected_entity:
            vehicle.connected = vehicle.read_connected(self._state(vehicle.connected_entity))
        if vehicle.home_entity:
            # At home, or at another of the household's places (a summer house with a charger).
            vehicle.place = self._state(vehicle.home_entity)
            vehicle.home = self.pairing.at_a_site(vehicle.place)
        if vehicle.charging_entity:
            charging = is_charging_state(self._state(vehicle.charging_entity))
            if charging is not None and vehicle.charging is not None and charging != vehicle.charging:
                vehicle.charging_changed_at = dt_util.now()
            vehicle.charging = charging

    @callback
    def _handle_vehicle_state(self, vehicle_id: str, event: Event[EventStateChangedData]) -> None:
        vehicle = self.vehicles.get(vehicle_id)
        if vehicle is None:
            return
        was_connected = vehicle.connected
        old_soc = vehicle.soc
        self._read_vehicle(vehicle)
        now = dt_util.now()
        entity_id = event.data["entity_id"]
        charging = vehicle.charging is True or vehicle_id in self._unplug_timers
        if (
            vehicle.connected is False
            and was_connected is True
            and charging
            and not self._unplug_confirmed(vehicle, now)
        ):
            # A plug that reads unplugged for a moment while the car charges is not an
            # unplug: the car stays plugged in (and its plan stands) until the plug has
            # read unplugged for two minutes.
            vehicle.connected = True
            if vehicle.unplugged_at is None:
                vehicle.unplugged_at = now
                self._unplug_timers[vehicle_id] = async_call_later(
                    self.hass, UNPLUG_CONFIRM + timedelta(seconds=1), partial(self._unplug_check, vehicle_id)
                )
        elif vehicle.connected is True:
            vehicle.unplugged_at = None
            if (cancel := self._unplug_timers.pop(vehicle_id, None)) is not None:
                cancel()
        elif vehicle.connected is False and vehicle.unplugged_at is None:
            vehicle.unplugged_at = now
        if vehicle.connected is True and was_connected is False:
            vehicle.connected_since = now
        elif vehicle.connected is False:
            vehicle.connected_since = None
            # Unplugged: whatever paused it has let go of it.
            vehicle.paused_by = None
        if entity_id == vehicle.soc_entity and vehicle.soc is not None:
            self._count_soc(vehicle, old_soc, vehicle.soc, now)
        if vehicle.connected is False and was_connected is True and vehicle.finish_measurement(unplugged=True):
            self.async_save()
        if vehicle.connected is True and was_connected is False:
            # Many cars start charging as soon as they are plugged in: for a few
            # minutes, make sure the car does what the plan says.
            vehicle.enforce_until = now + ENFORCE_AFTER_PLUG_IN
            self.config_entry.async_create_task(
                self.hass, self._async_clear_reminder(vehicle), f"{DOMAIN} clear reminder"
            )
        self.schedule_recalculate()

    @staticmethod
    def _unplug_confirmed(vehicle: Vehicle, now: datetime) -> bool:
        return vehicle.unplugged_at is not None and elapsed(now, vehicle.unplugged_at) >= UNPLUG_CONFIRM

    @callback
    def _unplug_check(self, vehicle_id: str, _now: datetime) -> None:
        """The plug still reads unplugged: now the car is unplugged."""
        self._unplug_timers.pop(vehicle_id, None)
        vehicle = self.vehicles.get(vehicle_id)
        if vehicle is None or vehicle.connected is not True or vehicle.connected_entity is None:
            return
        if vehicle.unplugged_at is None:
            return
        if vehicle.read_connected(self._state(vehicle.connected_entity)) is not False:
            return
        vehicle.connected = False
        if vehicle.finish_measurement(unplugged=True):
            self.async_save()
        self.schedule_recalculate()

    def _count_soc(self, vehicle: Vehicle, old: float | None, new: float, now: datetime) -> None:
        """A rising charge level while plugged in at home is charging; count its energy."""
        previous = vehicle.last_soc_seen if vehicle.last_soc_seen is not None else old
        vehicle.last_soc_seen = new
        if vehicle.connected is False or vehicle.home is False:
            return
        vehicle.meter.reading(new)
        power = self.vehicle_power(vehicle)
        speed, _source = vehicle.charge_speed(power)
        kwh = vehicle.soc_energy(previous, new, speed, power)
        if kwh > 0:
            vehicle.last_rise = now
            vehicle.start_session(now, vehicle.decision.reason)
            # A car that reports its power has its energy counted by that, every minute.
            if not self._power_counted(vehicle, now):
                vehicle.add_energy(now, kwh, current_price(self.price_slots(now), now), "soc")
            self.async_save()

    @callback
    def _handle_charger_state(self, charger_id: str, event: Event[EventStateChangedData]) -> None:
        charger = self.chargers.get(charger_id)
        if charger is None:
            return
        entity_id = event.data["entity_id"]
        new = event.data["new_state"]
        if entity_id == charger.connected_entity:
            was = charger.connected
            charger.connected = charger.read_connected(new.state if new else None)
            if charger.connected is True and was is False:
                charger.plugged_at = dt_util.now()
            elif charger.connected is False:
                charger.plugged_at = None
            if self.guest.charger_id == charger_id:
                self.guest.handle_connected(charger.connected)
        if entity_id == charger.energy_entity:
            reading = meter_value(new)
            if self.guest.charger_id == charger_id:
                self.guest.meter_step(reading)
            charger.meter_last = reading
            if self.guest.charger_id != charger_id:
                # A meter counts every few seconds: no plan depends on it, so nothing is planned again.
                return
        self.schedule_recalculate()

    # ------------------------------------------------------------------
    # Recalculation

    @callback
    def _handle_price_update(self, event: Event[EventStateChangedData]) -> None:
        if event.data["new_state"] is not None:
            self._check_price_entity()
        self.guest.handle_prices()
        self.schedule_recalculate()

    @callback
    def schedule_recalculate(self, force: bool = False) -> None:
        """Recalculate shortly; many entity updates arrive together."""
        clock = self.hass.loop.time()
        if self._recalc_timer is not None:
            waited = self._recalc_since is not None and clock - self._recalc_since >= RECALCULATE_MAX_WAIT
            if waited and (self._recalc_force or not force):
                # Updates that keep coming do not postpone it for ever.
                return
            self._recalc_timer()
        else:
            self._recalc_since = clock
        self._recalc_force = self._recalc_force or force

        @callback
        def run(_now: datetime) -> None:
            forced, self._recalc_force = self._recalc_force, False
            self._recalc_timer = None
            self._recalc_since = None
            self.config_entry.async_create_task(
                self.hass, self.async_recalculate(force=forced), f"{DOMAIN} recalculate"
            )

        self._recalc_timer = async_call_later(self.hass, RECALCULATE_DELAY, run)

    def _vehicle_order(self, now: datetime) -> list[Vehicle]:
        """Cars with the earliest deadline first: they get the charger first."""
        far = now + timedelta(days=30)

        def key(vehicle: Vehicle) -> tuple[datetime, str]:
            return (vehicle.next_deadline(now) or far, vehicle.name)

        return sorted(self.vehicles.values(), key=key)

    def reserved_for(self, vehicle: Vehicle) -> list[Segment]:
        """What the other cars plugged in on the same charger have planned.

        Finishing in one go (``join_within``) never takes these. A car that is
        not plugged in reserves nothing: on a charger with one cable the car
        that is plugged in charges in its own plan.
        """
        if not vehicle.charger_id:
            return []
        return [
            segment
            for other in self.vehicles.values()
            if other.vehicle_id != vehicle.vehicle_id
            and other.charger_id == vehicle.charger_id
            and other.plan is not None
            and other.connected is True
            for segment in other.plan.segments
        ]

    def plan_one(self, vehicle: Vehicle, now: datetime, blocked: list[Segment], *, stable: bool = False) -> None:
        """Make the car's plan. A plan that is charging now is kept until its period ends.

        With ``stable`` (a new price or reading, not a changed setting) the plan
        from before is kept when the new one would hardly be cheaper.
        """
        vehicle.deadline = vehicle.next_deadline(now)
        vehicle.plan_restored = False
        if vehicle.deadline is None and vehicle.night is not None:
            vehicle.night = None
        soc = vehicle.current_soc
        if soc is None:
            vehicle.plan, vehicle.plan_error = None, None
            return
        aim = self._aim(vehicle, now)
        if self.solar_of(vehicle).only(vehicle):
            # Only the sun: no plan from the grid.
            vehicle.plan, vehicle.plan_error, vehicle.planned_at = None, "solar_only", now
            return
        sun = self.solar_of(vehicle).expected_soc(vehicle, now, aim)
        if sun > 0 and soc + sun >= vehicle.target:
            # The forecast promises enough sun before the ready-by time; the plan waits for it.
            vehicle.plan, vehicle.plan_error, vehicle.planned_at = None, "solar_expected", now
            return
        car = Car(
            soc=soc + sun,
            target=vehicle.target,
            capacity=vehicle.capacity,
            power=(power := self.vehicle_power(vehicle)),
            speed=vehicle.charge_speed(power)[0],
            curve=vehicle.learned.speeds(),
        )
        every = self.price_slots(now)
        known = [slot for slot in every if not slot.forecast]
        # With only the published prices, the car is ready by the ready-by time, or by the end of
        # the prices there are when that comes first. Nothing is bet on a forecast.
        short = bool(known) and len(known) < len(every) and (aim is None or known[-1].end < aim)
        known_aim = known[-1].end if short and aim is not None else aim
        use_known = bool(vehicle.settings.get(SET_KNOWN_PRICES)) and bool(known)
        prices, other = (known, every) if use_known else (every, known)
        aim, other_aim = (known_aim, aim) if use_known else (aim, known_aim)

        def make(slots: list[PriceSlot], deadline: datetime | None) -> VehiclePlan:
            return plan_vehicle(
                slots,
                car,
                vehicle.rules(),
                now,
                deadline=deadline,
                earliest=vehicle.earliest_start,
                continuous=vehicle.plan_continuous,
                blocked=blocked,
                reserved=self.reserved_for(vehicle),
            )

        # What the same charge costs on the other prices, for the button that changes between them.
        vehicle.other_cost = None
        if short:
            try:
                vehicle.other_cost = make(other, other_aim).cost
            except PlanError:
                vehicle.other_cost = None
        try:
            plan = make(prices, aim)
            if stable:
                plan = keep_previous(vehicle.plan, plan, prices, now, power=power, deadline=aim, blocked=blocked)
            vehicle.plan = plan
            vehicle.plan_error = None
            vehicle.plan_done = False
            self._note_night(vehicle, now)
        except PlanError as err:
            old = vehicle.plan
            if old is not None and old.end is not None and old.end <= now:
                vehicle.plan_done = True
            vehicle.plan, vehicle.plan_error = None, err.key
            if err.key in ("no_price_data", "not_enough_prices"):
                # Waiting for prices: in case they never come, charge just in time anyway.
                vehicle.plan = keep_fallback(old, fallback_plan(car, now, aim), now)
        vehicle.planned_at = now

    @staticmethod
    def _aim(vehicle: Vehicle, now: datetime) -> datetime | None:
        """The time a plan aims to be done by: the ready-by time, less what the car has taught."""
        deadline = vehicle.deadline
        margin = timedelta(minutes=vehicle.learned.margin)
        if deadline is None or not margin or deadline - margin <= now:
            return deadline
        return deadline - margin

    @staticmethod
    def _note_night(vehicle: Vehicle, now: datetime) -> None:
        """Remember what the plan for the ready-by time promises, for the morning receipt."""
        plan, deadline = vehicle.plan, vehicle.deadline
        if plan is None or deadline is None or not plan.segments:
            return
        earlier = dt_util.parse_datetime(str(vehicle.night.get("deadline"))) if vehicle.night else None
        if earlier is not None and earlier <= now and earlier != deadline:
            # The last ready-by time has passed and its receipt is still to go out.
            return
        vehicle.night = {
            "deadline": deadline.isoformat(),
            "planned_soc": round(plan.end_soc, 1),
            "target": round(vehicle.target, 1),
            "speed": plan.speed,
            # A plan that cannot reach the target is no lesson about the car.
            "short": plan.short or plan.limited or plan.min_only,
        }

    async def _async_receipts(self, now: datetime) -> None:
        """At the ready-by time: how it went."""
        for vehicle in self.vehicles.values():
            night = vehicle.night
            deadline = dt_util.parse_datetime(str(night.get("deadline"))) if night else None
            if night is not None and (deadline is None or now >= deadline):
                vehicle.night = None
                self.async_save()
                if deadline is not None:
                    await self._async_receipt(vehicle, night, deadline)

    async def _async_receipt(self, vehicle: Vehicle, night: Mapping[str, Any], deadline: datetime) -> None:
        soc = vehicle.current_soc
        if soc is None or vehicle.connected is False or vehicle.at_home is False:
            # Driven off before the ready-by time, or not known: nothing to tell or learn.
            return
        planned = to_float(night.get("planned_soc")) or 0.0
        target = to_float(night.get("target")) or vehicle.target
        speed = to_float(night.get("speed")) or 0.0
        late = 0.0
        if not night.get("short") and speed > 0 and soc < planned - 2:
            late = (planned - soc) / speed * 60
        changed = False if night.get("short") else vehicle.learned.morning(late)
        session = vehicle.session
        energy = session.energy if session is not None else 0.0
        cost = session.cost if session is not None else 0.0
        vehicle.last_receipt = {
            "at": deadline.isoformat(),
            "soc": round(soc, 1),
            "planned_soc": planned,
            "target": target,
            "energy": round(energy, 2),
            "cost": round(cost, 2),
            "late": late > 1,
            "margin": vehicle.learned.margin,
        }
        self.async_save()
        self.async_update_listeners()
        if not vehicle.settings.get(SET_NOTIFY_RECEIPT) or not self.notifier.enabled:
            return
        key = "receipt" if soc >= min(planned, target) - 2 else "receipt_short"
        message = self._text(
            key,
            time=self._time(deadline),
            soc=self._num(soc, 0),
            target=self._num(target, 0),
            planned=self._num(planned, 0),
            energy=self._num(round(energy, 2), 1),
            cost=self._money(round(cost, 2)),
        )
        if changed and late > 1:
            message = f"{message} " + self._text("receipt_margin", minutes=vehicle.learned.margin)
        await self.notifier.send(
            title=vehicle.name,
            message=message,
            tag=tag_for("receipt", vehicle.vehicle_id),
            to=vehicle.notify_to,
            icon="mdi:car-clock",
            color=COLOR_CHARGE if key == "receipt" else COLOR_WARN,
        )

    async def _async_warn_short(self, vehicle: Vehicle) -> None:
        """Once per ready-by time: the plugged-in car cannot reach its target in time."""
        plan, deadline = vehicle.plan, vehicle.deadline
        if plan is None or deadline is None or not plan.short or vehicle.connected is not True:
            return
        key = deadline.isoformat()
        if vehicle.warned_for == key:
            return
        vehicle.warned_for = key
        self.async_save()
        if not vehicle.settings.get(SET_NOTIFY_RECEIPT) or not self.notifier.enabled:
            return
        await self.notifier.send(
            title=vehicle.name,
            message=self._text(
                "short_warning",
                name=vehicle.name,
                target=self._num(vehicle.target, 0),
                time=self._time(deadline),
                soc=self._num(plan.end_soc, 0),
            ),
            tag=tag_for("short", vehicle.vehicle_id),
            to=vehicle.notify_to,
            icon="mdi:clock-alert-outline",
            color=COLOR_WARN,
            actions=[
                {"action": f"{ACTION_CHARGE_NOW}_{vehicle.vehicle_id}", "title": self._text("action_charge_now")},
            ],
        )

    def vehicle_power(self, vehicle: Vehicle) -> float:
        """The car's charging power: what it has shown, else its setting, at most what its charger can give."""
        return self.vehicle_power_source(vehicle)[0]

    def charging_figures(self, vehicle: Vehicle) -> dict[str, Any]:
        """The speed and power the car is planned with, and where they come from."""
        power, power_source = self.vehicle_power_source(vehicle)
        speed, speed_source = vehicle.charge_speed(power)
        return {
            "charge_speed": round(speed, 1),
            "charge_speed_source": speed_source,
            "charge_speed_learned_from": vehicle.learned.speed_count,
            "charge_power": round(power, 2),
            "charge_power_source": power_source,
            "measured_rise": round(vehicle.meter.rise, 1),
        }

    def vehicle_power_source(self, vehicle: Vehicle) -> tuple[float, str]:
        """The car's charging power (kW), and whether it was "learned" or "configured"."""
        if vehicle.learned.power is not None:
            return vehicle.learned.power, "learned"
        charger = self.chargers.get(vehicle.charger_id or "")
        power = vehicle.configured_power
        return (min(power, charger.power) if charger is not None else power), "configured"

    def blocked_for(self, vehicle: Vehicle, now: datetime) -> list[Segment]:
        """Periods others have on the car's charger: the guest, and plugged-in cars planned before it."""
        charger_id = vehicle.charger_id
        if not charger_id:
            return []
        blocked: list[Segment] = []
        if self.guest.charger_id == charger_id and self.guest.session_active(now):
            blocked.extend(self.guest.segments)
        for other in self._vehicle_order(now):
            if other.vehicle_id == vehicle.vehicle_id:
                break
            if other.charger_id == charger_id and other.plan is not None and other.connected is True:
                blocked.extend(other.plan.segments)
        return blocked

    async def async_recalculate(self, *, force: bool = False, apply: bool = True) -> None:
        """Plan every car (earliest deadline first, sharing chargers) and act on it."""
        now = dt_util.now()
        if self.pairing.resolve(now):
            self.async_save()
        taken: dict[str, list[Segment]] = {}
        for vehicle in self._vehicle_order(now):
            charger_id = vehicle.charger_id
            blocked = list(taken.get(charger_id, [])) if charger_id else []
            if charger_id and self.guest.charger_id == charger_id and self.guest.session_active(now):
                blocked.extend(self.guest.segments)
            # A plan made without prices gives way as soon as there are prices.
            active = vehicle.plan is not None and not vehicle.plan.fallback and in_segments(vehicle.plan.segments, now)
            # A plan charging now is kept; after a restart, the stored plan the car was charging in.
            charging_in_plan = vehicle.decision.control == CONTROL_CHARGE or (
                vehicle.plan_restored and vehicle.last_sent == CONTROL_CHARGE
            )
            if force or not active or not charging_in_plan:
                self.plan_one(vehicle, now, blocked, stable=not force)
            if charger_id and vehicle.plan is not None and vehicle.connected is True:
                taken.setdefault(charger_id, []).extend(vehicle.plan.segments)
        # On a shared supply the plugged-in cars are planned together, under the limit: each place its own.
        for supply in self.supplies.values():
            supply.replan(now)
        await self.async_evaluate(now, apply=apply)

    # ------------------------------------------------------------------
    # Deciding and acting

    @callback
    def _handle_tick(self, now: datetime) -> None:
        self.config_entry.async_create_task(self.hass, self._async_tick(now), f"{DOMAIN} tick")

    async def _async_tick(self, now: datetime) -> None:
        now = dt_util.now()
        replan = False
        for vehicle in self.vehicles.values():
            # A plan that has just ended: plan again from the new charge level.
            if vehicle.plan is not None and vehicle.plan.end is not None and vehicle.plan.end <= now:
                vehicle.plan_done = True
                replan = True
            if vehicle.deadline is not None and vehicle.deadline <= now:
                replan = True
            self._count_time(vehicle, now)
        for supply in self.supplies.values():
            if supply.sample(now):
                self.async_save()
            # The guard acts when the meter moves; a meter that stays too high is looked at again here.
            supply.async_check()
            await supply.async_release_heat_pump(now)
            if await supply.async_refresh_weather(now):
                replan = True
        await self.home.async_refresh(now)
        # Cars and chargers found each other, or lost each other: the plans follow.
        if self.pairing.resolve(now):
            self.async_save()
            replan = True
        await self.pairing.async_follow_up(now)
        if await self.solar.async_refresh_forecast(now):  # the forecast is the home's
            replan = True
        # How the morning went, before the plan moves on to the next ready-by time.
        await self._async_receipts(now)
        if replan:
            # Planned again before acting, so a car that goes on charging (finishing in
            # one go) is not paused and started again in between.
            await self.async_recalculate(force=True)
        else:
            await self.async_evaluate(now)
        await self._async_reminders(now)
        for vehicle in self.vehicles.values():
            await self._async_warn_short(vehicle)

    def _count_time(self, vehicle: Vehicle, now: datetime) -> None:
        """A minute of charging: for the measurement, and for the energy when nothing else counts it.

        A car that reports its charging power is counted by that. Without a
        power reading, the rising charge level counts the energy; without a
        charge level sensor, the charging time at the charging power does,
        and moves the manual charge level on at the charging speed.
        """
        charging = self._is_charging(vehicle) and vehicle.at_home is not False
        reading = power_value(self.hass.states.get(vehicle.power_entity)) if vehicle.power_entity else None
        vehicle.power_from_car = reading
        if not charging:
            vehicle.counted_at = None
            return
        since = self._counted_since(vehicle)
        vehicle.counted_at = now
        if since is None:
            # The first sign of charging: counted from now on.
            return
        seconds = min(max(0.0, elapsed(now, since).total_seconds()), 2 * TICK.total_seconds())
        vehicle.meter.tick(seconds, True, reading)
        self._count_energy(vehicle, now, seconds, reading)

    @staticmethod
    def _counted_since(vehicle: Vehicle) -> datetime | None:
        """Since when the charging has not been counted: the last count, or the start of the period."""
        opened = vehicle.session.open_since if vehicle.session is not None else None
        moments = [moment for moment in (vehicle.counted_at, opened) if moment is not None]
        return max(moments, key=lambda moment: moment.astimezone(UTC)) if moments else None

    def _count_energy(self, vehicle: Vehicle, now: datetime, seconds: float, reading: float | None) -> None:
        """Energy for ``seconds`` of charging up to ``now``: the reported power, else the charging power.

        A car with a charge level sensor but no power reading is counted by
        its rising level instead (``_count_soc``).
        """
        if seconds <= 0:
            return
        hours = seconds / 3600
        if reading is not None and reading >= MIN_POWER_KW:
            vehicle.power_counted_at = now
            kwh, source = reading * hours, "power"
        elif vehicle.has_soc_sensor:
            self.async_save(SAVE_COUNTERS)
            return
        else:
            kwh, source = self.vehicle_power(vehicle) * hours, "time"
        vehicle.start_session(now, vehicle.decision.reason)
        vehicle.add_energy(
            now,
            kwh,
            current_price(self.price_slots(now), now),
            source,
            solar=kwh * self.solar_of(vehicle).share_now(vehicle),
            solar_price=self.export_price(self.site_id_of(vehicle)),
        )
        if not vehicle.has_soc_sensor:
            speed, _source = vehicle.charge_speed(self.vehicle_power(vehicle))
            soc = to_float(vehicle.settings.get(SET_MANUAL_SOC)) or 0.0
            vehicle.settings[SET_MANUAL_SOC] = round(min(100.0, soc + speed * hours), 2)
        # A minute's energy: written with the next save, or after a while.
        self.async_save(SAVE_COUNTERS)

    def _count_tail(self, vehicle: Vehicle, now: datetime) -> None:
        """Charging stopped: count the part since the last minute, up to when it stopped."""
        since = self._counted_since(vehicle)
        vehicle.counted_at = None
        if since is None:
            return
        changed = vehicle.charging_changed_at
        stop = now
        if changed is not None and elapsed(changed, since) > timedelta(0) and elapsed(now, changed) >= timedelta(0):
            stop = changed
        seconds = min(max(0.0, elapsed(stop, since).total_seconds()), TICK.total_seconds())
        reading = vehicle.power_from_car
        if vehicle.power_entity:
            current = power_value(self.hass.states.get(vehicle.power_entity))
            if current is not None and current >= MIN_POWER_KW:
                reading = current
        vehicle.meter.tick(seconds, True, reading)
        self._count_energy(vehicle, stop, seconds, reading)

    @staticmethod
    def _power_counted(vehicle: Vehicle, now: datetime) -> bool:
        """Whether the car's power reading counts its energy right now."""
        return vehicle.power_counted_at is not None and elapsed(now, vehicle.power_counted_at) <= 2 * TICK

    def _is_charging(self, vehicle: Vehicle) -> bool:
        if vehicle.connected is False:
            return False
        if vehicle.charging is not None:
            return vehicle.charging
        return vehicle.control != CONTROL_NONE and vehicle.decision.control == CONTROL_CHARGE

    async def async_evaluate(self, now: datetime | None = None, *, apply: bool = True) -> None:
        """Decide what each charger should do now, and do it. One at a time."""
        async with self._control_lock:
            await self._async_evaluate(now, apply=apply)

    async def _async_evaluate(self, now: datetime | None = None, *, apply: bool = True) -> None:
        now = now or dt_util.now()
        prices = self.price_slots(now)
        price_now = current_price(prices, now)
        if apply and self._started:
            for solar in self.solars.values():
                solar.update(now)
        for vehicle in self.vehicles.values():
            if (mode := vehicle.mode_after_charge_now()) is not None:
                vehicle.settings[SET_MODE] = mode
                self.async_save()
            decision = decide(
                now,
                mode=vehicle.mode,
                connected=vehicle.connected,
                home=vehicle.at_home,
                soc=vehicle.current_soc,
                target=vehicle.target,
                segments=vehicle.plan.segments if vehicle.plan else [],
                rules=vehicle.rules(),
                price_now=price_now,
                plan_done=vehicle.plan_done,
                charger_free=not self.guest_holds(vehicle.charger_id, now),
            )
            if (
                self.solar_of(vehicle).wants(vehicle)
                and decision.control == CONTROL_PAUSE
                and decision.reason == REASON_WAITING
            ):
                # The sun shines on it: charge on the surplus.
                decision = Decision(CONTROL_CHARGE, REASON_SOLAR)
            if decision.control == CONTROL_CHARGE and self.supply_of(vehicle).holds_off(vehicle, now):
                # The guard paused it: the house needs the current for a while.
                decision = Decision(CONTROL_PAUSE, REASON_WAITING)
            changed = decision != vehicle.decision
            vehicle.decision = decision
            if apply and self._started:
                await self._async_apply(vehicle, force=False)
                if changed:
                    self._watch_verify(vehicle)
                await self._async_session(vehicle, now)
                if not self._states_unknown(vehicle):
                    # Acted on with what the car says: from now on the plan is an ordinary one.
                    vehicle.plan_restored = False
        if apply and self._started:
            for supply in self.supplies.values():
                await supply.async_apply(now)
            for solar in self.solars.values():
                await solar.async_apply(now)
            await self._async_apply_guest(now)
            self._maybe_refresh_widgets(now)
        self.async_update_listeners()

    async def async_pause_for_house(self, vehicle: Vehicle) -> bool:
        """The guard: stop this car now, as the house needs the current. True when it was stopped."""
        vehicle.decision = Decision(CONTROL_PAUSE, REASON_WAITING)
        stopped = await self._async_apply(vehicle, force=True, urgent=True)
        self.async_update_listeners()
        return stopped

    def control_sources(self, vehicle: Vehicle) -> list[tuple[str, str]]:
        """What can start and pause the car, the chosen one first: ("car" or "charger", its switch).

        With a backup, the other of the two comes second, when the car has it:
        its own switch, or a switch on the charger it is at.
        """
        if vehicle.control == CONTROL_NONE:
            return []
        charger = self.chargers.get(vehicle.charger_id or "")
        entities = {
            CONTROL_CAR: vehicle.car_control_entity,
            CONTROL_CHARGER: charger.switch_entity if charger else None,
        }
        other = CONTROL_CHARGER if vehicle.control == CONTROL_CAR else CONTROL_CAR
        order = [vehicle.control, other] if vehicle.control_backup else [vehicle.control]
        return [(kind, entity) for kind in order if (entity := entities[kind])]

    def control_entity(self, vehicle: Vehicle) -> str | None:
        """The switch EV Planner starts and pauses the car with first."""
        sources = self.control_sources(vehicle)
        return sources[0][1] if sources else None

    async def _async_send(self, vehicle: Vehicle, want_on: bool, *, force: bool) -> str | None:
        """Start or pause the car through what controls it; an error text, or None when it is done.

        A pause takes one of them: the first, and the backup when that does
        not answer (or first, when the car went on charging after the first
        said yes). A start takes all of them: the one that paused the car
        must let go of it, and the other must not hold it either.
        """
        sources = self.control_sources(vehicle)
        if not want_on:
            if vehicle.verify_attempts >= 2 and len(sources) > 1:
                # Told twice, and still charging: the other one this time.
                sources = sources[::-1]
            error: str | None = "no_control_entity"
            for kind, entity in sources:
                error = await self._async_switch(entity, False)
                if error is None:
                    vehicle.paused_by = kind
                    return None
            return error
        errors: list[tuple[bool, str]] = []
        done = False
        ordered = sorted(sources, key=lambda source: source[0] != vehicle.paused_by)
        for kind, entity in ordered:
            holds = kind == vehicle.paused_by or self._state(entity) == "off"
            if not holds and done and not (force and vehicle.verify_attempts >= 2):
                # It does not hold the car back: left alone, so a car is not woken for nothing.
                continue
            error = await self._async_switch(entity, True)
            if error is None:
                done = True
            else:
                errors.append((holds, error))
        if held := [error for holds, error in errors if holds]:
            # The one that holds the car back did not let go: the car does not charge.
            return held[0]
        if not done:
            return errors[0][1] if errors else "no_control_entity"
        vehicle.paused_by = None
        return None

    async def _async_switch(self, entity_id: str, on: bool) -> str | None:
        """Turn a switch on or off; returns an error text, or None."""
        domain = entity_id.split(".", 1)[0]
        service_domain = domain if domain in TOGGLE_DOMAINS else "homeassistant"
        try:
            async with asyncio.timeout(COMMAND_TIMEOUT):
                await self.hass.services.async_call(
                    service_domain, "turn_on" if on else "turn_off", {"entity_id": entity_id}, blocking=True
                )
        except TimeoutError:
            _LOGGER.warning("No answer when turning %s %s", "on" if on else "off", entity_id)
            return "timeout"
        except (HomeAssistantError, ServiceNotFound) as err:
            _LOGGER.warning("Could not turn %s %s: %s", "on" if on else "off", entity_id, err)
            return str(err) or type(err).__name__
        return None

    async def _async_apply(self, vehicle: Vehicle, *, force: bool, urgent: bool = False) -> bool:
        """Send the decision to the car or the charger, when it changed. True when it is as decided.

        ``force`` sends it though it was sent before (the check that it took); ``urgent`` (the guard)
        also does not wait after a command that failed.
        """
        desired = vehicle.decision.control
        if vehicle.control == CONTROL_NONE or desired == CONTROL_RELEASED:
            # Let go of: a command that failed before is no longer anything to report.
            self._control_worked(vehicle)
            return False
        if vehicle.control == CONTROL_CHARGER and self.guest_holds(vehicle.charger_id, dt_util.now()):
            self._control_worked(vehicle)
            return False
        now = dt_util.now()
        enforcing = vehicle.enforce_until is not None and now < vehicle.enforce_until
        if not force and desired == vehicle.last_sent:
            recent = vehicle.last_sent_at is not None and elapsed(now, vehicle.last_sent_at) < COMMAND_REPEAT
            if not enforcing or recent:
                return True
        entity_id = self.control_entity(vehicle)
        if not entity_id:
            # A car whose charger is found each time, and has not been found yet, waits for it.
            waiting = vehicle.control == CONTROL_CHARGER and self.pairing.floats(vehicle)
            vehicle.control_error = "finding_charger" if waiting else "no_control_entity"
            return False
        want_on = desired == CONTROL_CHARGE
        current = self._state(entity_id)
        if want_on and vehicle.paused_by is not None and vehicle.paused_by != self.control_sources(vehicle)[0][0]:
            # The backup paused it: the first one's switch does not say whether it charges.
            current = None
        if not force and current in ("on", "off") and (current == "on") == want_on:
            # Already there; do not wake the car for nothing. A command that failed before no longer matters.
            vehicle.last_sent = desired
            self._control_worked(vehicle)
            return True
        if not urgent and vehicle.retry_after is not None and now < vehicle.retry_after:
            # The last command failed: wait a little longer each time before the next.
            return False
        if want_on and not force and vehicle.paused_at is not None and elapsed(now, vehicle.paused_at) < MIN_REST:
            # Just paused: a start right after it is what a flickering sensor asks for. Wait a moment.
            return False
        if not vehicle.count_command(now, stop=not want_on):
            # A car or charger that does not listen is not flooded; the check tries again later.
            # A stop always goes out: it is never the one too many.
            vehicle.control_error = "rate_limited"
            return False
        error = await self._async_send(vehicle, want_on, force=force)
        vehicle.control_error = error
        if error is not None:
            self._control_failed(vehicle, entity_id, error, now)
            return False
        vehicle.last_sent = desired
        vehicle.last_sent_at = now
        vehicle.paused_at = None if want_on else now
        self._control_worked(vehicle)
        self.async_save()
        return True

    def _control_issue(self, vehicle: Vehicle) -> str:
        return f"{ISSUE_CONTROL_FAILED}_{vehicle.vehicle_id}"

    def _control_failed(self, vehicle: Vehicle, entity_id: str, error: str, now: datetime) -> None:
        """A command did not get through: the next waits longer, and after a few it is reported as a repair."""
        vehicle.fail_count += 1
        vehicle.retry_after = now + CONTROL_BACKOFF[min(vehicle.fail_count, len(CONTROL_BACKOFF)) - 1]
        if vehicle.fail_count == CONTROL_FAILS_ISSUE:
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                self._control_issue(vehicle),
                is_fixable=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=ISSUE_CONTROL_FAILED,
                translation_placeholders={"name": vehicle.name, "entity_id": entity_id, "error": error},
            )

    def _control_worked(self, vehicle: Vehicle) -> None:
        """The car or charger is as decided, or EV Planner lets go of it: what failed before is forgotten."""
        vehicle.control_error = None
        if vehicle.fail_count >= CONTROL_FAILS_ISSUE:
            ir.async_delete_issue(self.hass, DOMAIN, self._control_issue(vehicle))
        vehicle.fail_count = 0
        vehicle.retry_after = None

    async def _async_apply_guest(self, now: datetime) -> None:
        """Start, pause and hand back the guest's charger when it has a switch."""
        charger = self.guest.charger
        if charger is None or not charger.switch_entity:
            return
        desired = self.guest.charger_control(now)
        if desired == CONTROL_RELEASED:
            if charger.guest_last_sent is None:
                return
            # Hand the charger back: let it charge again, as before the guest.
            if await self._async_switch(charger.switch_entity, True) is None:
                charger.guest_last_sent = None
                self.async_save()
            return
        if desired == charger.guest_last_sent:
            return
        if await self._async_switch(charger.switch_entity, desired == CONTROL_CHARGE) is None:
            charger.guest_last_sent = desired
            self.async_save()

    # ------------------------------------------------------------------
    # Checking that charging started

    def _watch_verify(self, vehicle: Vehicle) -> None:
        vid = vehicle.vehicle_id
        if (cancel := self._verify_timers.pop(vid, None)) is not None:
            cancel()
        vehicle.verify_attempts = 0
        self._verify_unknown.pop(vid, None)
        if vehicle.decision.control not in (CONTROL_CHARGE, CONTROL_PAUSE) or vehicle.control == CONTROL_NONE:
            if vehicle.problem:
                vehicle.problem = False
                self.config_entry.async_create_task(
                    self.hass,
                    self.notifier.clear(tag_for("problem", vid), to=vehicle.notify_to),
                    f"{DOMAIN} clear problem",
                )
            return
        self._verify_timers[vid] = async_call_later(self.hass, VERIFY_DELAY, partial(self._verify_soon, vid))

    @callback
    def _verify_soon(self, vehicle_id: str, _now: datetime) -> None:
        self._verify_timers.pop(vehicle_id, None)
        self.config_entry.async_create_task(self.hass, self._async_verify(vehicle_id), f"{DOMAIN} verify charging")

    async def _async_verify(self, vehicle_id: str) -> None:
        vehicle = self.vehicles.get(vehicle_id)
        if vehicle is None or vehicle.connected is False or vehicle.control == CONTROL_NONE:
            return
        desired = vehicle.decision.control
        charging = vehicle.charging
        if desired not in (CONTROL_CHARGE, CONTROL_PAUSE):
            return
        if charging is None:
            # No charging sensor: nothing to check against. One that does not answer right now is
            # asked again a few times, so a car that did not start is still found when it is back.
            tries = self._verify_unknown.get(vehicle_id, 0)
            if vehicle.charging_entity and tries < VERIFY_UNKNOWN_TRIES:
                self._verify_unknown[vehicle_id] = tries + 1
                self._verify_timers[vehicle_id] = async_call_later(
                    self.hass, VERIFY_DELAY, partial(self._verify_soon, vehicle_id)
                )
            return
        self._verify_unknown.pop(vehicle_id, None)
        want = desired == CONTROL_CHARGE
        soc = vehicle.current_soc
        if want and (vehicle.decision.reason == "keep_on" or (soc is not None and soc >= vehicle.target - 1)):
            # A full car does not draw power, and that is fine.
            want = charging
        if charging == want:
            if vehicle.problem:
                vehicle.problem = False
                await self.notifier.clear(tag_for("problem", vehicle_id), to=vehicle.notify_to)
                self.async_update_listeners()
            return
        attempt = vehicle.verify_attempts
        if attempt < len(VERIFY_BACKOFF):
            # Not what it was told: tell it again, and look again a little later each time.
            vehicle.verify_attempts += 1
            await self._async_apply(vehicle, force=True)
            self._verify_timers[vehicle_id] = async_call_later(
                self.hass, VERIFY_BACKOFF[attempt], partial(self._verify_soon, vehicle_id)
            )
            return
        if not vehicle.problem:
            vehicle.problem = True
            key = "problem" if want else "problem_pause"
            if want and self._after_pause(vehicle):
                key = "problem_resume_learned" if vehicle.learned.did_not_resume() else "problem_resume"
                self.async_save()
                if key == "problem_resume_learned":
                    self.schedule_recalculate(force=True)
            await self.notifier.send(
                title=vehicle.name,
                message=self._text(key, name=vehicle.name),
                tag=tag_for("problem", vehicle_id),
                to=vehicle.notify_to,
                icon="mdi:ev-plug-type2",
                color=COLOR_ERROR,
            )
        else:
            # Still wrong: one more try now and then, in case the car has woken up.
            await self._async_apply(vehicle, force=True)
        self._verify_timers[vehicle_id] = async_call_later(
            self.hass, PROBLEM_RECHECK, partial(self._verify_soon, vehicle_id)
        )
        self.async_update_listeners()

    @staticmethod
    def _after_pause(vehicle: Vehicle) -> bool:
        """Whether the car should take up a planned charge after a pause it has charged before."""
        session = vehicle.session
        return (
            vehicle.decision.reason == "planned"
            and session is not None
            and not session.charging
            and bool(session.periods)
            and session.energy >= BLIP_KWH
        )

    # ------------------------------------------------------------------
    # Sessions, live notifications and widgets

    @staticmethod
    def _states_unknown(vehicle: Vehicle) -> bool:
        """Whether the car's own sensors are unavailable, e.g. while its integration starts."""
        return (
            (vehicle.charging_entity is not None and vehicle.charging is None)
            or (vehicle.connected_entity is not None and vehicle.connected is None)
            or (vehicle.home_entity is not None and vehicle.home is None)
        )

    async def _async_session(self, vehicle: Vehicle, now: datetime) -> None:
        if self._states_unknown(vehicle):
            # Not known whether it charges: a charge going on is neither ended nor reported.
            return
        if vehicle.charging is not None or vehicle.control != CONTROL_NONE:
            charging = self._is_charging(vehicle)
        else:
            # Without a charging sensor or control, a rising charge level is the only sign of charging.
            rising = vehicle.last_rise is not None and elapsed(now, vehicle.last_rise) < IDLE_END
            charging = rising and vehicle.connected is not False
        if charging:
            resumed = vehicle.start_session(now, vehicle.decision.reason)
            if resumed and vehicle.decision.reason == "planned" and vehicle.learned.resumes is not True:
                # Charging again after a pause in the plan: the car does that.
                vehicle.learned.resumed()
                self.async_save()
            if vehicle.pause_notice:
                # Charging again: the "paused" message is no longer true.
                vehicle.pause_notice = False
                self.async_save()
                if self.notifier.enabled:
                    await self.notifier.clear(tag_for("done", vehicle.vehicle_id), to=vehicle.notify_to)
            if vehicle.settings.get(SET_LIVE) and self.notifier.enabled:
                await self._async_live(vehicle, now)
            return
        if vehicle.live_active:
            vehicle.live_active = False
            vehicle.live_sent_at = None
            await self.notifier.clear(tag_for("live", vehicle.vehicle_id), to=vehicle.notify_to)
        if vehicle.session is None:
            return
        if vehicle.session.charging:
            self._count_tail(vehicle, now)
            vehicle.stop_charging(now)
            # A charge that rose enough teaches the car's speed; a smaller one is measured on.
            vehicle.finish_measurement()
            self.async_save()
            if vehicle.session.last_period_energy >= 0.1:
                await self._async_notify_stopped(vehicle, now)
        if self._session_over(vehicle, now):
            blip = vehicle.session_is_blip() and not vehicle.plug_sessions
            vehicle.end_session(now, min_energy=BLIP_KWH if blip else 0.1)
            self.async_save()

    def _session_over(self, vehicle: Vehicle, now: datetime) -> bool:
        """Whether the stopped charge goes to the history now.

        With a plug sensor: once the car has been unplugged for a little
        while (or has left home). Without one: right away, except a blip,
        which waits for a charge to join.
        """
        session = vehicle.session
        if session is None or session.charging:
            return False
        if vehicle.plug_sessions:
            if vehicle.at_home is False:
                return True
            unplugged = vehicle.unplugged_at
            return vehicle.connected is False and unplugged is not None and elapsed(now, unplugged) >= UNPLUG_CONFIRM
        if not vehicle.session_is_blip():
            return True
        last = session.periods[-1].end if session.periods else session.start
        return last is None or elapsed(now, last) >= BLIP_HOLD

    async def _async_notify_stopped(self, vehicle: Vehicle, now: datetime) -> None:
        """Charging stopped: done, or paused until the plan goes on."""
        session = vehicle.session
        if session is None or not vehicle.settings.get(SET_NOTIFY_DONE) or not self.notifier.enabled:
            return
        soc = vehicle.current_soc
        # Stopped short of the target: say so, and when it goes on.
        full = soc is None or soc >= vehicle.target - 1 or vehicle.connected is False
        plan = vehicle.plan
        resume = plan.start if plan is not None and plan.start is not None and plan.start > now else None
        key = "done" if full else "paused_until" if resume is not None else "paused"
        vehicle.pause_notice = key != "done"
        await self.notifier.send(
            title=vehicle.name,
            message=self._text(
                key,
                soc=self._num(soc, 0) if soc is not None else "?",
                energy=self._num(round(session.energy, 2), 1),
                cost=self._money(round(session.cost, 2)),
                target=self._num(vehicle.target, 0),
                window=self._plan_windows(plan) if resume is not None and plan is not None else "-",
            ),
            tag=tag_for("done", vehicle.vehicle_id),
            to=vehicle.notify_to,
            icon="mdi:battery-charging-100",
            color=COLOR_CHARGE,
        )

    async def _async_live(self, vehicle: Vehicle, now: datetime) -> None:
        soc = vehicle.current_soc
        first = not vehicle.live_active
        if not first and vehicle.live_sent_at is not None:
            soc_moved = soc is not None and (vehicle.live_sent_soc is None or abs(soc - vehicle.live_sent_soc) >= 1)
            reason_moved = vehicle.live_sent_reason != vehicle.decision.reason
            if not reason_moved and (not soc_moved or elapsed(now, vehicle.live_sent_at) < LIVE_MIN_INTERVAL):
                return
        plan = vehicle.plan
        until = None
        if vehicle.decision.reason == "planned" and plan is not None:
            until = next((seg["end"] for seg in plan.segments if seg["start"] <= now < seg["end"]), None)
        target = vehicle.target
        message = self._text(
            f"live_{vehicle.decision.reason}"
            if vehicle.decision.reason in ("planned", "low_soc", "low_price")
            else "live_charging",
            target=self._num(target, 0),
            deadline=self._time(vehicle.deadline) if vehicle.deadline else "-",
        )
        await self.notifier.live(
            tag=tag_for("live", vehicle.vehicle_id),
            to=vehicle.notify_to,
            title=vehicle.name,
            message=message,
            critical_text=f"{self._num(soc, 0)} %" if soc is not None else None,
            progress=round(soc) if soc is not None else None,
            progress_max=round(target),
            until=until,
            icon="mdi:ev-station",
            first=first,
        )
        vehicle.live_active = True
        vehicle.live_sent_at = now
        vehicle.live_sent_soc = soc
        vehicle.live_sent_reason = vehicle.decision.reason
        self.async_save()

    def _maybe_refresh_widgets(self, now: datetime) -> None:
        """Refresh iOS widgets when a car's status changes (at most every 15 minutes)."""
        statuses = {vid: vehicle.status() for vid, vehicle in self.vehicles.items()}
        if statuses == self._last_status:
            return
        first_run = not self._last_status
        self._last_status = statuses
        if first_run or not self.config.get("update_widgets") or not self.notifier.enabled:
            return
        if self._widgets_sent is not None and elapsed(now, self._widgets_sent) < WIDGET_MIN_INTERVAL:
            if self._widgets_timer is None:
                delay = WIDGET_MIN_INTERVAL - (now - self._widgets_sent)

                @callback
                def later(_now: datetime) -> None:
                    self._widgets_timer = None
                    self._widgets_sent = dt_util.now()
                    self.config_entry.async_create_task(self.hass, self.notifier.update_widgets(), f"{DOMAIN} widgets")

                self._widgets_timer = async_call_later(self.hass, delay, later)
            return
        self._widgets_sent = now
        self.config_entry.async_create_task(self.hass, self.notifier.update_widgets(), f"{DOMAIN} widgets")

    # ------------------------------------------------------------------
    # Reminders

    async def _async_reminders(self, now: datetime) -> None:
        for vehicle in self.vehicles.values():
            if self.notifier.enabled and self._reminder_due(vehicle, now):
                await self._async_remind(vehicle, now)

    def _reminder_due(self, vehicle: Vehicle, now: datetime) -> bool:
        """Whether a plug-in reminder (or a repeat of it) should go out now."""
        s = vehicle.settings
        if not s.get(SET_REMINDER):
            return False
        moment = parse_hhmm(s.get(SET_REMINDER_TIME))
        if moment is None or now.time() < moment:
            return False
        days = s.get(SET_REMINDER_DAYS)
        if isinstance(days, list) and WEEKDAYS[now.weekday()] not in days:
            return False
        if vehicle.reminded_on == now.date().isoformat():
            # Already reminded (or skipped for the price) today: only repeat it.
            repeat = to_float(s.get(SET_REMINDER_REPEAT)) or 0.0
            if repeat <= 0 or not 0 < vehicle.reminders_sent <= REMINDER_MAX_REPEATS or vehicle.reminded_at is None:
                return False
            if elapsed(now, vehicle.reminded_at) < timedelta(minutes=repeat):
                return False
        soc = vehicle.current_soc
        threshold = to_float(s.get(SET_REMINDER_SOC)) or 0.0
        return not (vehicle.connected is not False or vehicle.at_home is False or soc is None or soc >= threshold)

    async def _async_remind(self, vehicle: Vehicle, now: datetime) -> None:
        s = vehicle.settings
        today = now.date().isoformat()
        if vehicle.reminded_on != today:
            vehicle.reminded_on, vehicle.reminders_sent = today, 0
        hours = to_float(s.get(SET_REMINDER_HORIZON)) or 24.0
        cheapest = self._cheapest_slot(now, timedelta(hours=hours))
        if s.get(SET_REMINDER_PRICE_ENABLED) and vehicle.reminders_sent == 0:
            limit = to_float(s.get(SET_REMINDER_PRICE))
            if cheapest is None or (limit is not None and cheapest.price > limit):
                # Not cheap enough: no reminder today.
                self.async_save()
                return
        vehicle.reminders_sent += 1
        vehicle.reminded_at = now
        self.async_save()
        soc = vehicle.current_soc
        plan = vehicle.plan
        if plan is not None and plan.segments:
            text = self._text(
                "reminder_plan",
                name=vehicle.name,
                soc=self._num(soc, 0),
                window=self._plan_windows(plan),
                energy=self._num(plan.energy, 0),
                cost=self._money(plan.cost),
            )
        else:
            text = self._text("reminder", name=vehicle.name, soc=self._num(soc, 0))
        if cheapest is not None:
            text = f"{text} " + self._text(
                "reminder_cheapest",
                price=self._money(cheapest.price),
                when=self._window(cheapest.start, cheapest.end),
            )
        await self.notifier.send(
            title=self._text("reminder_title", name=vehicle.name),
            message=text,
            tag=tag_for("reminder", vehicle.vehicle_id),
            icon="mdi:ev-plug-type2",
            color=COLOR_WARN,
            actions=[
                {"action": f"{ACTION_CHARGE_NOW}_{vehicle.vehicle_id}", "title": self._text("action_charge_now")},
                {"action": f"{ACTION_FOLLOW_PLAN}_{vehicle.vehicle_id}", "title": self._text("action_follow")},
            ],
            to=vehicle.notify_to,
        )

    def _cheapest_slot(self, now: datetime, ahead: timedelta = timedelta(hours=24)) -> PriceSlot | None:
        """The cheapest price from now until ``ahead``."""
        horizon = now + ahead
        upcoming = [slot for slot in self.price_slots(now) if slot.end > now and slot.start < horizon]
        return min(upcoming, key=lambda slot: (slot.price, slot.start), default=None)

    async def _async_clear_reminder(self, vehicle: Vehicle) -> None:
        if vehicle.reminded_on and self.notifier.enabled:
            await self.notifier.clear(tag_for("reminder", vehicle.vehicle_id), to=vehicle.notify_to)

    @callback
    def _handle_notification_action(self, event: Event) -> None:
        action = str(event.data.get("action") or "")
        if (answer := self.pairing.action(action)) is not None:
            self.config_entry.async_create_task(
                self.hass, self.pairing.async_set(*answer), f"{DOMAIN} who is at the charger"
            )
            return
        for vehicle_id in self.vehicles:
            if action == f"{ACTION_CHARGE_NOW}_{vehicle_id}":
                mode = MODE_CHARGE_NOW
            elif action == f"{ACTION_FOLLOW_PLAN}_{vehicle_id}":
                mode = MODE_SMART
            else:
                continue
            self.config_entry.async_create_task(
                self.hass, self.async_set_vehicle(vehicle_id, {SET_MODE: mode}), f"{DOMAIN} notification action"
            )

    # ------------------------------------------------------------------
    # Calendars

    @callback
    def _handle_calendar_tick(self, _now: datetime) -> None:
        self.config_entry.async_create_task(self.hass, self._async_calendar_tick(), f"{DOMAIN} calendar")

    async def _async_calendar_tick(self) -> None:
        if await self._async_refresh_calendars():
            await self.async_recalculate(force=True)

    async def _async_refresh_calendars(self) -> bool:
        """Read the next trip from each car's calendar; True when one changed."""
        changed = False
        now = dt_util.now()
        for vehicle in self.vehicles.values():
            if not vehicle.calendar_entity:
                continue
            event, target, summary = await self._async_next_trip(vehicle, now)
            if (event, target) != (vehicle.calendar_event, vehicle.calendar_target):
                changed = True
            vehicle.calendar_event, vehicle.calendar_target, vehicle.calendar_summary = event, target, summary
        return changed

    async def _async_next_trip(
        self, vehicle: Vehicle, now: datetime
    ) -> tuple[datetime | None, float | None, str | None]:
        entity_id = vehicle.calendar_entity
        assert entity_id is not None
        try:
            response = await self.hass.services.async_call(
                "calendar",
                "get_events",
                {
                    "entity_id": entity_id,
                    "start_date_time": now.isoformat(),
                    "end_date_time": (now + CALENDAR_LOOKAHEAD).isoformat(),
                },
                blocking=True,
                return_response=True,
            )
        except (HomeAssistantError, ServiceNotFound) as err:
            _LOGGER.debug("Could not read %s: %s", entity_id, err)
            return None, None, None
        data = response.get(entity_id) if isinstance(response, dict) else None
        found = data.get("events") if isinstance(data, dict) else None
        events = found if isinstance(found, list) else []
        keyword = vehicle.calendar_keyword.casefold()
        for item in events:
            if not isinstance(item, Mapping):
                continue
            summary = str(item.get("summary") or "")
            text = f"{summary} {item.get('description') or ''}"
            if keyword and keyword not in text.casefold():
                continue
            start_raw = str(item.get("start") or "")
            if "T" not in start_raw:
                continue  # all-day events have no departure time
            start = dt_util.parse_datetime(start_raw)
            if start is None or start <= now:
                continue
            target = None
            if match := TRIP_TARGET.search(text):
                target = max(10.0, min(100.0, float(match.group(1))))
            return dt_util.as_local(start), target, summary or None
        return None, None, None

    # ------------------------------------------------------------------
    # Changes from entities, actions and the panel

    async def async_set_vehicle(self, vehicle_id: str, changes: Mapping[str, Any]) -> None:
        vehicle = self.vehicles.get(vehicle_id)
        if vehicle is None:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="car_not_found")
        mode_changed = False
        changes = dict(changes)
        if changes.pop(FORGET_RESUME, False):
            # "Try again": the car may charge again after a pause after all (e.g. a new charger).
            vehicle.learned.forget_resume()
        for key, value in changes.items():
            if key == SET_MODE and value not in MODES:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="invalid_mode")
            if key == SET_SCHEDULE:
                value = {day: str(entry) for day, entry in dict(value or {}).items() if day in WEEKDAYS}
            if key == SET_DAY_TARGETS:
                value = {day: float(entry) for day, entry in dict(value or {}).items() if day in WEEKDAYS}
            if key == SET_TARGET_SOC and vehicle.target_entity:
                await self._async_set_car_target(vehicle, float(value))
            if key == SET_MODE and value != vehicle.mode:
                mode_changed = True
            vehicle.settings[key] = value
        if mode_changed:
            vehicle.last_sent = None
            # Asked for by hand: at once, whatever went before.
            vehicle.paused_at = None
            vehicle.retry_after = None
            if vehicle.mode in (MODE_OFF, MODE_PAUSE, MODE_CHARGE_NOW):
                vehicle.problem = False
        self.async_save()
        await self.async_recalculate(force=True)

    async def _async_set_car_target(self, vehicle: Vehicle, value: float) -> None:
        """Set the car's own charge limit, when it is a number entity."""
        entity_id = vehicle.target_entity
        if not entity_id or entity_id.split(".", 1)[0] not in ("number", "input_number"):
            return
        domain = entity_id.split(".", 1)[0]
        try:
            await self.hass.services.async_call(
                domain, "set_value", {"entity_id": entity_id, "value": value}, blocking=True
            )
        except (HomeAssistantError, ServiceNotFound) as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="target_not_set",
                translation_placeholders={"entity_id": entity_id, "error": str(err)},
            ) from err
        vehicle.target_from_car = value

    def set_layout(self, layout: Any) -> None:
        """Keep where the household placed things in the house picture, for each house."""
        self.layout = clean_layouts(layout)
        self.async_save()
        self.async_update_listeners()

    async def async_update_settings(self, changes: Mapping[str, Any]) -> None:
        self.settings.update({key: value for key, value in changes.items() if key in SETTINGS_DEFAULTS})
        self.async_save()
        self.async_update_listeners()

    # ------------------------------------------------------------------
    # Small text helpers for notifications (Danish or English)

    @property
    def _danish(self) -> bool:
        language = str(self.settings.get("language") or "auto")
        if language in ("da", "en"):
            return language == "da"
        return str(self.hass.config.language or "").lower().startswith("da")

    def _text(self, key: str, **values: Any) -> str:
        table = TEXT_DA if self._danish else TEXT_EN
        return table[key].format(**values)

    def _num(self, value: float | None, digits: int) -> str:
        if value is None:
            return "-"
        text = f"{value:.{digits}f}"
        return text.replace(".", ",") if self._danish else text

    def _money(self, value: float) -> str:
        amount = self._num(value, 2)
        return f"{amount} kr." if self.currency == "DKK" and self._danish else f"{amount} {self.currency}"

    def _time(self, moment: datetime | None) -> str:
        if moment is None:
            return "-"
        local = dt_util.as_local(moment)
        return local.strftime("%H.%M") if self._danish else local.strftime("%H:%M")

    def _day(self, moment: datetime, now: datetime) -> str:
        """``i nat``, ``i morgen`` or nothing (today), before a time."""
        local, today = dt_util.as_local(moment), dt_util.as_local(now)
        days = (local.date() - today.date()).days
        if days <= 0:
            return ""
        if days == 1 and local.hour < 6 and today.hour >= 12:
            return "i nat " if self._danish else "tonight "
        if days == 1:
            return "i morgen " if self._danish else "tomorrow "
        return f"{local.day}/{local.month} " if self._danish else f"{local.month}/{local.day} "

    def _window(self, start: datetime | None, end: datetime | None) -> str:
        if start is None or end is None:
            return "-"
        return f"{self._day(start, dt_util.now())}{self._time(start)}-{self._time(end)}"

    def _plan_windows(self, plan: Any) -> str:
        """A plan's charging periods, e.g. ``i nat 04.00-04.41 og i morgen 12.00-14.00``."""
        segments = list(plan.segments)
        if not segments:
            return "-"
        now = dt_util.now()
        parts: list[str] = []
        last_day: str | None = None
        for segment in segments[:3]:
            day = self._day(segment["start"], now)
            parts.append(f"{day if day != last_day else ''}{self._time(segment['start'])}-{self._time(segment['end'])}")
            last_day = day
        if len(segments) > 3:
            parts[-1] = f"{parts[-1]} …"
        joiner = " og " if self._danish else " and "
        return parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + joiner + parts[-1]

    # ------------------------------------------------------------------
    # For the panel and entities

    async def _async_load_status_texts(self) -> None:
        prefix = f"component.{DOMAIN}.entity.sensor.status.state."
        for language in ("da", "en"):
            strings = await async_get_translations(self.hass, language, "entity", [DOMAIN])
            self._status_texts[language] = {
                key.removeprefix(prefix): value for key, value in strings.items() if key.startswith(prefix)
            }

    def status_text(self, status: str) -> str:
        """A car's status in words, in the language of the notifications."""
        return self._status_texts.get("da" if self._danish else "en", {}).get(status, status)

    def format_time(self, moment: datetime | None) -> str:
        return self._time(moment)

    def format_money(self, value: float) -> str:
        return self._money(value)

    def charger_control(self, charger_id: str) -> tuple[str, str | None]:
        """What a charger should do now, and for whom (``guest`` or the car's name)."""
        now = dt_util.now()
        if self.guest.charger_id == charger_id and (control := self.guest.charger_control(now)) != CONTROL_RELEASED:
            return control, "guest"
        for vehicle in self._vehicle_order(now):
            if vehicle.charger_id == charger_id and vehicle.decision.control != CONTROL_RELEASED:
                return vehicle.decision.control, vehicle.name
        return CONTROL_RELEASED, None

    def schedule_for(self, vehicle: Vehicle, now: datetime) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """``raw_two_days`` and ``charging_schedule`` like EV Smart Charging, for graphs."""
        visible = self.visible_slots(self.price_slots(now))
        raw = [{"start": slot.start.isoformat(), "end": slot.end.isoformat(), "value": slot.price} for slot in visible]
        segments = vehicle.plan.segments if vehicle.plan else []
        return raw, segments_to_schedule(segments, visible)


TEXT_EN: dict[str, str] = {
    "pair_ask": "A car was plugged in to {charger}. Which one is it?",
    "pair_guest": "A guest",
    "problem": "{name} should be charging, but it is not. Check the car and the charger.",
    "problem_pause": "{name} should be paused, but it is still charging. Check the car and the charger.",
    "problem_resume": "{name} did not charge again after the pause. Some cars must be plugged in again.",
    "problem_resume_learned": "{name} did not charge again after the pause. Some cars must be plugged in again. "
    "From now on it charges in one go.",
    "reminder_cheapest": "Cheapest price: {price}/kWh ({when}).",
    "receipt": "Ready at {time}: {soc} % of {target} %, {energy} kWh for {cost}.",
    "receipt_short": "Not quite ready at {time}: {soc} % of {target} % (planned {planned} %). {energy} kWh for {cost}.",
    "receipt_margin": "From now on it aims to be done {minutes} minutes earlier.",
    "short_warning": "{name} cannot reach {target} % by {time}: about {soc} %. Charge now, or set a later time.",
    "done": "Charged to {soc} %: {energy} kWh for {cost}.",
    "paused": "Paused at {soc} % of {target} %: {energy} kWh for {cost} so far.",
    "paused_until": "Paused at {soc} % of {target} %: {energy} kWh for {cost} so far. Charges on {window}.",
    "live_planned": "Charging to {target} %, ready by {deadline}",
    "live_low_soc": "Low battery: charging right away",
    "live_low_price": "Cheap power: charging now",
    "live_charging": "Charging to {target} %",
    "reminder_title": "Plug in {name}",
    "reminder": "{name} is at {soc} % and not plugged in.",
    "reminder_plan": "{name} is at {soc} % and not plugged in. The cheapest charge is {window}: about {energy} kWh for {cost}.",
    "action_charge_now": "Charge now",
    "action_follow": "Follow the plan",
}
TEXT_DA: dict[str, str] = {
    "pair_ask": "Der er sat en bil til {charger}. Hvilken er det?",
    "pair_guest": "En gæst",
    "problem": "{name} skulle lade, men gør det ikke. Tjek bilen og laderen.",
    "problem_pause": "{name} skulle holde pause, men lader stadig. Tjek bilen og laderen.",
    "problem_resume": "{name} startede ikke igen efter pausen. Nogle biler skal have stikket sat i igen.",
    "problem_resume_learned": "{name} startede ikke igen efter pausen. Nogle biler skal have stikket sat i igen. "
    "Fremover lader den i ét stræk.",
    "reminder_cheapest": "Billigste pris: {price}/kWh ({when}).",
    "receipt": "Klar kl. {time}: {soc} % af {target} %, {energy} kWh for {cost}.",
    "receipt_short": "Ikke helt klar kl. {time}: {soc} % af {target} % (planlagt {planned} %). {energy} kWh for {cost}.",
    "receipt_margin": "Fremover sigter den efter at være færdig {minutes} minutter før.",
    "short_warning": "{name} kan ikke nå {target} % til kl. {time}: ca. {soc} %. Lad nu, eller vælg et senere tidspunkt.",
    "done": "Ladet til {soc} %: {energy} kWh for {cost}.",
    "paused": "Pause ved {soc} % af {target} %: {energy} kWh for {cost} indtil nu.",
    "paused_until": "Pause ved {soc} % af {target} %: {energy} kWh for {cost} indtil nu. Lader videre {window}.",
    "live_planned": "Lader til {target} %, klar kl. {deadline}",
    "live_low_soc": "Lavt batteri: lader med det samme",
    "live_low_price": "Billig strøm: lader nu",
    "live_charging": "Lader til {target} %",
    "reminder_title": "Sæt {name} til",
    "reminder": "{name} er på {soc} % og ikke tilsluttet.",
    "reminder_plan": "{name} er på {soc} % og ikke tilsluttet. Billigste ladning er {window}: ca. {energy} kWh for {cost}.",
    "action_charge_now": "Lad nu",
    "action_follow": "Følg planen",
}
