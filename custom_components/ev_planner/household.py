"""The household coordinator: prices, cars, chargers and the guest.

EV Planner does not poll. It reacts to the price sensor, the cars' and
chargers' entities, user input, and a one-minute tick that decides what each
charger should do now (plans start and end on whole minutes, and the low
price rule follows the current price).
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import partial
import logging
import re
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN, UnitOfEnergy
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
    CALENDAR_LOOKAHEAD,
    CALENDAR_REFRESH,
    CONF_CONNECTED_ENTITY,
    CONF_COUNTRY,
    CONF_CURRENCY,
    CONF_ENERGY_ENTITY,
    CONF_MOTORAPI_KEY,
    CONF_NOTIFY,
    CONF_PLATE_PROVIDER,
    CONF_POWER,
    CONF_PRICE_ENTITY,
    CONF_SWITCH_ENTITY,
    CONF_UNPLUGGED_STATES,
    CONTROL_CAR,
    CONTROL_CHARGE,
    CONTROL_CHARGER,
    CONTROL_NONE,
    CONTROL_PAUSE,
    CONTROL_RELEASED,
    DEFAULT_CHARGE_POWER,
    DEFAULT_COUNTRY,
    DEFAULT_CURRENCY,
    DEFAULT_PLATE_PROVIDER,
    DEFAULT_UNPLUGGED_STATES,
    DOMAIN,
    EVENT_NOTIFICATION_ACTION,
    ISSUE_PRICE_ENTITY_MISSING,
    LIVE_MIN_INTERVAL,
    MODE_CHARGE_NOW,
    MODE_OFF,
    MODE_PAUSE,
    MODE_SMART,
    MODES,
    PLANNING_HORIZON,
    RECALCULATE_DELAY,
    REMINDER_MAX_REPEATS,
    SET_LIVE,
    SET_MANUAL_SOC,
    SET_MODE,
    SET_NOTIFY_DONE,
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
    STORAGE_KEY,
    STORAGE_VERSION,
    SUBENTRY_CHARGER,
    SUBENTRY_VEHICLE,
    VERIFY_DELAY,
    WEEKDAYS,
    WIDGET_MIN_INTERVAL,
)
from .guest import GuestSession
from .notifications import COLOR_CHARGE, COLOR_ERROR, COLOR_WARN, Notifier, tag_for
from .planner import PlanError, PriceSlot, Segment, segments_to_schedule
from .prices import extract_price_slots
from .rules import Car, current_price, decide, in_segments, parse_hhmm, plan_vehicle
from .vehicle import Vehicle, is_charging_state, to_float

_LOGGER = logging.getLogger(__name__)

type EVPlannerConfigEntry = ConfigEntry[Household]

TICK = timedelta(minutes=1)
ENFORCE_AFTER_PLUG_IN = timedelta(minutes=3)
# A session without a charging sensor ends when the charge level has not risen for this long.
IDLE_END = timedelta(minutes=30)
# language: the language of notifications; "auto" follows Home Assistant's language.
SETTINGS_DEFAULTS: dict[str, Any] = {"bill_price": None, "payment_text": "", "language": "auto"}
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
        for subentry_id, subentry in entry.subentries.items():
            if subentry.subentry_type == SUBENTRY_VEHICLE:
                self.vehicles[subentry_id] = Vehicle(subentry_id, subentry.title, dict(subentry.data))
            elif subentry.subentry_type == SUBENTRY_CHARGER:
                self.chargers[subentry_id] = Charger(subentry_id, subentry.title, dict(subentry.data))
        self.guest = GuestSession(hass, self)
        self.settings: dict[str, Any] = dict(SETTINGS_DEFAULTS)
        # Photos of the cars and chargers: {car or charger id: image_upload id}.
        self.images: dict[str, str] = {}
        # The photo as it was before its background was cut away, so the cut can be undone.
        self.originals: dict[str, str] = {}
        self.notifier = Notifier(hass, self.notify_services)
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY.format(entry_id=entry.entry_id))
        self._unsub: list[CALLBACK_TYPE] = []
        self._recalc_timer: CALLBACK_TYPE | None = None
        self._verify_timers: dict[str, CALLBACK_TYPE] = {}
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
        for vehicle in self.vehicles.values():
            self._read_vehicle(vehicle)
            vehicle.last_soc_seen = vehicle.soc if vehicle.soc is not None else vehicle.last_soc_seen
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
        for cancel in self._verify_timers.values():
            cancel()
        self._verify_timers.clear()
        self.guest.async_stop()
        await self._store.async_save(self._data_to_store())
        await super().async_shutdown()

    async def _async_update_data(self) -> None:
        return None

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
        self.guest.load(stored.get("guest"))
        self.settings = {**SETTINGS_DEFAULTS, **(stored.get("settings") or {})}
        self.images = self._known_images(stored.get("images"))
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
    def async_save(self) -> None:
        self._store.async_delay_save(self._data_to_store, 1)

    @callback
    def _data_to_store(self) -> dict[str, Any]:
        return {
            "vehicles": {vehicle_id: vehicle.to_store() for vehicle_id, vehicle in self.vehicles.items()},
            "chargers": {cid: {"guest_last_sent": charger.guest_last_sent} for cid, charger in self.chargers.items()},
            "guest": self.guest.to_store(),
            "settings": self.settings,
            "images": self.images,
            "image_originals": self.originals,
        }

    # ------------------------------------------------------------------
    # Prices

    def price_slots(self, now: datetime | None = None) -> list[PriceSlot]:
        return extract_price_slots(self.hass.states.get(self.price_entity), now or dt_util.now())

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
            vehicle.home = vehicle.read_home(self._state(vehicle.home_entity))
        if vehicle.charging_entity:
            vehicle.charging = is_charging_state(self._state(vehicle.charging_entity))

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
        if entity_id == vehicle.soc_entity and vehicle.soc is not None:
            self._count_soc(vehicle, old_soc, vehicle.soc, now)
        if vehicle.connected is True and was_connected is False:
            # Many cars start charging as soon as they are plugged in: for a few
            # minutes, make sure the car does what the plan says.
            vehicle.enforce_until = now + ENFORCE_AFTER_PLUG_IN
            self.config_entry.async_create_task(
                self.hass, self._async_clear_reminder(vehicle), f"{DOMAIN} clear reminder"
            )
        self.schedule_recalculate()

    def _count_soc(self, vehicle: Vehicle, old: float | None, new: float, now: datetime) -> None:
        """A rising charge level while plugged in at home is charging; count its energy."""
        previous = vehicle.last_soc_seen if vehicle.last_soc_seen is not None else old
        vehicle.last_soc_seen = new
        if vehicle.connected is False or vehicle.home is False:
            return
        kwh = vehicle.soc_energy(previous, new)
        if kwh > 0:
            vehicle.last_rise = now
            vehicle.start_session(now, vehicle.decision.reason)
            vehicle.add_energy(now, kwh, current_price(self.price_slots(now), now))
            self.async_save()

    @callback
    def _handle_charger_state(self, charger_id: str, event: Event[EventStateChangedData]) -> None:
        charger = self.chargers.get(charger_id)
        if charger is None:
            return
        entity_id = event.data["entity_id"]
        new = event.data["new_state"]
        if entity_id == charger.connected_entity:
            charger.connected = charger.read_connected(new.state if new else None)
            if self.guest.charger_id == charger_id:
                self.guest.handle_connected(charger.connected)
        if entity_id == charger.energy_entity:
            reading = meter_value(new)
            if self.guest.charger_id == charger_id:
                self.guest.meter_step(reading)
            charger.meter_last = reading
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
        if self._recalc_timer is not None:
            self._recalc_timer()

        @callback
        def run(_now: datetime) -> None:
            self._recalc_timer = None
            self.config_entry.async_create_task(self.hass, self.async_recalculate(force=force), f"{DOMAIN} recalculate")

        self._recalc_timer = async_call_later(self.hass, RECALCULATE_DELAY, run)

    def _vehicle_order(self, now: datetime) -> list[Vehicle]:
        """Cars with the earliest deadline first: they get the charger first."""
        far = now + timedelta(days=30)

        def key(vehicle: Vehicle) -> tuple[datetime, str]:
            return (vehicle.next_deadline(now) or far, vehicle.name)

        return sorted(self.vehicles.values(), key=key)

    def plan_one(self, vehicle: Vehicle, now: datetime, blocked: list[Segment]) -> None:
        """Make the car's plan. A plan that is charging now is kept until its period ends."""
        vehicle.deadline = vehicle.next_deadline(now)
        soc = vehicle.current_soc
        if soc is None:
            vehicle.plan, vehicle.plan_error = None, None
            return
        car = Car(
            soc=soc,
            target=vehicle.target,
            capacity=vehicle.capacity,
            power=self.vehicle_power(vehicle),
            efficiency=vehicle.efficiency,
        )
        try:
            vehicle.plan = plan_vehicle(
                self.price_slots(now),
                car,
                vehicle.rules(),
                now,
                deadline=vehicle.deadline,
                earliest=vehicle.earliest_start,
                continuous=vehicle.continuous,
                blocked=blocked,
            )
            vehicle.plan_error = None
            vehicle.plan_done = False
        except PlanError as err:
            if vehicle.plan is not None and vehicle.plan.end is not None and vehicle.plan.end <= now:
                vehicle.plan_done = True
            vehicle.plan, vehicle.plan_error = None, err.key
        vehicle.planned_at = now

    def vehicle_power(self, vehicle: Vehicle) -> float:
        """The car's charging power, at most what its charger can give."""
        charger = self.chargers.get(vehicle.charger_id or "")
        power = vehicle.configured_power
        return min(power, charger.power) if charger is not None else power

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
        taken: dict[str, list[Segment]] = {}
        for vehicle in self._vehicle_order(now):
            charger_id = vehicle.charger_id
            blocked = list(taken.get(charger_id, [])) if charger_id else []
            if charger_id and self.guest.charger_id == charger_id and self.guest.session_active(now):
                blocked.extend(self.guest.segments)
            active = vehicle.plan is not None and in_segments(vehicle.plan.segments, now)
            if force or not active or vehicle.decision.control != CONTROL_CHARGE:
                self.plan_one(vehicle, now, blocked)
            if charger_id and vehicle.plan is not None and vehicle.connected is True:
                taken.setdefault(charger_id, []).extend(vehicle.plan.segments)
        await self.async_evaluate(now, apply=apply)

    # ------------------------------------------------------------------
    # Deciding and acting

    @callback
    def _handle_tick(self, now: datetime) -> None:
        self.config_entry.async_create_task(self.hass, self._async_tick(now), f"{DOMAIN} tick")

    async def _async_tick(self, now: datetime) -> None:
        now = dt_util.now()
        for vehicle in self.vehicles.values():
            # A plan that has just ended: plan again from the new charge level.
            if vehicle.plan is not None and vehicle.plan.end is not None and vehicle.plan.end <= now:
                vehicle.plan_done = True
                self.schedule_recalculate(force=True)
            if vehicle.deadline is not None and vehicle.deadline <= now:
                self.schedule_recalculate(force=True)
            self._count_time(vehicle, now)
        await self.async_evaluate(now)
        await self._async_reminders(now)

    def _count_time(self, vehicle: Vehicle, now: datetime) -> None:
        """Without a charge level sensor, charging time is the only measure of energy."""
        if vehicle.has_soc_sensor or not self._is_charging(vehicle):
            return
        power = self.vehicle_power(vehicle)
        kwh = power * TICK.total_seconds() / 3600
        vehicle.start_session(now, vehicle.decision.reason)
        vehicle.add_energy(now, kwh, current_price(self.price_slots(now), now))
        soc = to_float(vehicle.settings.get(SET_MANUAL_SOC)) or 0.0
        gained = kwh * vehicle.efficiency / vehicle.capacity * 100
        vehicle.settings[SET_MANUAL_SOC] = round(min(100.0, soc + gained), 2)
        self.async_save()

    def _is_charging(self, vehicle: Vehicle) -> bool:
        if vehicle.connected is False:
            return False
        if vehicle.charging is not None:
            return vehicle.charging
        return vehicle.control != CONTROL_NONE and vehicle.decision.control == CONTROL_CHARGE

    async def async_evaluate(self, now: datetime | None = None, *, apply: bool = True) -> None:
        """Decide what each charger should do now, and do it."""
        now = now or dt_util.now()
        prices = self.price_slots(now)
        price_now = current_price(prices, now)
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
            changed = decision != vehicle.decision
            vehicle.decision = decision
            if apply and self._started:
                await self._async_apply(vehicle, force=False)
                if changed:
                    self._watch_verify(vehicle)
                await self._async_session(vehicle, now)
        if apply and self._started:
            await self._async_apply_guest(now)
            self._maybe_refresh_widgets(now)
        self.async_update_listeners()

    def control_entity(self, vehicle: Vehicle) -> str | None:
        if vehicle.control == CONTROL_CAR:
            return vehicle.car_control_entity
        if vehicle.control == CONTROL_CHARGER:
            charger = self.chargers.get(vehicle.charger_id or "")
            return charger.switch_entity if charger else None
        return None

    async def _async_switch(self, entity_id: str, on: bool) -> str | None:
        """Turn a switch on or off; returns an error text, or None."""
        domain = entity_id.split(".", 1)[0]
        service_domain = domain if domain in TOGGLE_DOMAINS else "homeassistant"
        try:
            await self.hass.services.async_call(
                service_domain, "turn_on" if on else "turn_off", {"entity_id": entity_id}, blocking=True
            )
        except (HomeAssistantError, ServiceNotFound) as err:
            _LOGGER.warning("Could not turn %s %s: %s", "on" if on else "off", entity_id, err)
            return str(err) or type(err).__name__
        return None

    async def _async_apply(self, vehicle: Vehicle, *, force: bool) -> None:
        """Send the decision to the car or the charger, when it changed."""
        desired = vehicle.decision.control
        if vehicle.control == CONTROL_NONE or desired == CONTROL_RELEASED:
            return
        if vehicle.control == CONTROL_CHARGER and self.guest_holds(vehicle.charger_id, dt_util.now()):
            return
        now = dt_util.now()
        enforcing = vehicle.enforce_until is not None and now < vehicle.enforce_until
        if not force and not enforcing and desired == vehicle.last_sent:
            return
        entity_id = self.control_entity(vehicle)
        if not entity_id:
            vehicle.control_error = "no_control_entity"
            return
        want_on = desired == CONTROL_CHARGE
        current = self._state(entity_id)
        if not force and current in ("on", "off") and (current == "on") == want_on:
            # Already there; do not wake the car for nothing.
            vehicle.last_sent = desired
            vehicle.control_error = None
            return
        error = await self._async_switch(entity_id, want_on)
        vehicle.control_error = error
        if error is None:
            vehicle.last_sent = desired
            self.async_save()

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
        if desired not in (CONTROL_CHARGE, CONTROL_PAUSE) or charging is None:
            # No charging sensor: nothing to check against.
            return
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
        if vehicle.verify_attempts == 0:
            vehicle.verify_attempts = 1
            await self._async_apply(vehicle, force=True)
            self._verify_timers[vehicle_id] = async_call_later(
                self.hass, VERIFY_DELAY, partial(self._verify_soon, vehicle_id)
            )
            return
        if not vehicle.problem:
            vehicle.problem = True
            await self.notifier.send(
                title=vehicle.name,
                message=self._text("problem" if want else "problem_pause", name=vehicle.name),
                tag=tag_for("problem", vehicle_id),
                to=vehicle.notify_to,
                icon="mdi:ev-plug-type2",
                color=COLOR_ERROR,
            )
        self.async_update_listeners()

    # ------------------------------------------------------------------
    # Sessions, live notifications and widgets

    async def _async_session(self, vehicle: Vehicle, now: datetime) -> None:
        if vehicle.charging is not None or vehicle.control != CONTROL_NONE:
            charging = self._is_charging(vehicle)
        else:
            # Without a charging sensor or control, a rising charge level is the only sign of charging.
            rising = vehicle.last_rise is not None and now - vehicle.last_rise < IDLE_END
            charging = rising and vehicle.connected is not False
        if charging:
            vehicle.start_session(now, vehicle.decision.reason)
            if vehicle.settings.get(SET_LIVE) and self.notifier.enabled:
                await self._async_live(vehicle, now)
            return
        if vehicle.live_active:
            vehicle.live_active = False
            vehicle.live_sent_at = None
            await self.notifier.clear(tag_for("live", vehicle.vehicle_id), to=vehicle.notify_to)
        if vehicle.session is not None:
            entry = vehicle.end_session(now)
            self.async_save()
            if entry and vehicle.settings.get(SET_NOTIFY_DONE) and self.notifier.enabled:
                soc = vehicle.current_soc
                await self.notifier.send(
                    title=vehicle.name,
                    message=self._text(
                        "done",
                        soc=self._num(soc, 0) if soc is not None else "?",
                        energy=self._num(entry["energy"], 1),
                        cost=self._money(entry["cost"]),
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
            if not reason_moved and (not soc_moved or now - vehicle.live_sent_at < LIVE_MIN_INTERVAL):
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
        if self._widgets_sent is not None and now - self._widgets_sent < WIDGET_MIN_INTERVAL:
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
            if now - vehicle.reminded_at < timedelta(minutes=repeat):
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
                window=self._window(plan.start, plan.end),
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
        for key, value in changes.items():
            if key == SET_MODE and value not in MODES:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="invalid_mode")
            if key == SET_SCHEDULE:
                value = {day: str(entry) for day, entry in dict(value or {}).items() if day in WEEKDAYS}
            if key == SET_TARGET_SOC and vehicle.target_entity:
                await self._async_set_car_target(vehicle, float(value))
            if key == SET_MODE and value != vehicle.mode:
                mode_changed = True
            vehicle.settings[key] = value
        if mode_changed:
            vehicle.last_sent = None
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

    def _window(self, start: datetime | None, end: datetime | None) -> str:
        if start is None or end is None:
            return "-"
        now = dt_util.now()
        day = ""
        if dt_util.as_local(start).date() != now.date():
            day = "i morgen " if self._danish else "tomorrow "
        return f"{day}{self._time(start)}-{self._time(end)}"

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
    "problem": "{name} should be charging, but it is not. Check the car and the charger.",
    "problem_pause": "{name} should be paused, but it is still charging. Check the car and the charger.",
    "reminder_cheapest": "Cheapest price: {price}/kWh ({when}).",
    "done": "Charged to {soc} %: {energy} kWh for {cost}.",
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
    "problem": "{name} skulle lade, men gør det ikke. Tjek bilen og laderen.",
    "problem_pause": "{name} skulle holde pause, men lader stadig. Tjek bilen og laderen.",
    "reminder_cheapest": "Billigste pris: {price}/kWh ({when}).",
    "done": "Ladet til {soc} %: {energy} kWh for {cost}.",
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
