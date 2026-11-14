"""The guest car: EV Guest's guest session, inside EV Planner.

A guest arrives with an electric car. Enter the license plate, the charge
level now and the target, and EV Planner plans the cheapest charging on the
chosen charger, holds that charger for the guest session and hands it back
when the guest has gone. Ported from EV Guest 0.10.2.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import datetime, time, timedelta
import logging
from typing import TYPE_CHECKING, Any, NoReturn
from uuid import uuid4

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_call_later, async_track_point_in_time, async_track_time_interval
from homeassistant.util import dt as dt_util

from . import departures
from .api import (
    PlateAuthError,
    PlateLookupFailed,
    VehicleLookupResult,
    async_decode_vin_nhtsa,
    async_lookup_battery_open_ev_data,
    async_lookup_vehicle,
)
from .const import (
    CONTROL_CHARGE,
    CONTROL_PAUSE,
    CONTROL_RELEASED,
    DATASET_CACHE_KEY,
    DOMAIN,
    ERROR_INVALID_API_KEY,
    ERROR_INVALID_INPUT,
    ERROR_LICENSE_PLATE_REQUIRED,
    ERROR_LOOKUP_FAILED,
    ERROR_MOTORAPI_KEY_MISSING,
    ERROR_VEHICLE_NOT_FOUND,
    GUEST_BATTERY,
    GUEST_CEILING,
    GUEST_CHARGER,
    GUEST_CHARGING,
    GUEST_CLEAR_AFTER,
    GUEST_COMPLETED,
    GUEST_CONTINUOUS,
    GUEST_DEPARTURE,
    GUEST_LIMIT,
    GUEST_PAUSE_UNPLUG_CHECK,
    GUEST_PLANNED,
    GUEST_PLATE,
    GUEST_POWER,
    GUEST_READY,
    GUEST_READY_BY,
    GUEST_SOC,
    GUEST_STEP,
    GUEST_STOPPED,
    GUEST_USE_READY_BY,
    HISTORY_LIMIT,
    METER_GRACE,
    PLANNING_HORIZON,
    POST_PLAN_HOLD,
    PROGRESS_INTERVAL,
    RELEASE_CLEARED,
    RELEASE_HOUSEHOLD,
    RELEASE_NEW_GUEST,
    RELEASE_PLAN_END,
    RELEASE_STOPPED,
    RELEASE_UNPLUGGED,
    UNPLUG_DELAY,
)
from .planner import (
    ChargeNeed,
    Plan,
    PlanError,
    PriceSlot,
    Segment,
    charge_need,
    charge_now_plan,
    make_plan,
    price_at,
    segments_to_schedule,
)
from .progress import Progress, plan_progress
from .rules import cut_slots, parse_hhmm
from .vehicle import to_float

if TYPE_CHECKING:
    from .household import Charger, Household
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

# A single meter step above this is a glitch, not a charge.
MAX_METER_STEP_KWH = 100.0

CAR_RESULTS = (
    "car_brand",
    "car_model",
    "car_variant",
    "car_battery_capacity",
    "vin",
    "model_year",
    "fuel_type",
    "match_score",
    "last_source",
    "last_lookup",
)
PLAN_RESULTS = (
    "charging_speed",
    "charge_time",
    "charge_costs",
    "energy",
    "savings",
    "charge_now_cost",
    "average_price",
)
PLAN_INPUT_KEYS = (
    GUEST_SOC,
    GUEST_LIMIT,
    GUEST_BATTERY,
    GUEST_POWER,
    GUEST_READY_BY,
    GUEST_USE_READY_BY,
    GUEST_CONTINUOUS,
    GUEST_DEPARTURE,
    GUEST_CEILING,
)


def next_completion(now: datetime, completion: time) -> datetime:
    result = now.replace(hour=completion.hour, minute=completion.minute, second=0, microsecond=0)
    if result <= now:
        result += timedelta(days=1)
    return result


def serialize_segments(segments: list[Segment]) -> list[dict[str, str]]:
    return [{"start": seg["start"].isoformat(), "end": seg["end"].isoformat()} for seg in segments]


def parse_segments(raw: Any) -> list[Segment]:
    segments: list[Segment] = []
    for item in raw if isinstance(raw, list) else []:
        if not isinstance(item, dict):
            continue
        start = dt_util.parse_datetime(str(item.get("start", "")))
        end = dt_util.parse_datetime(str(item.get("end", "")))
        if start is None or end is None or end <= start:
            continue
        segments.append({"start": start, "end": end})
    return sorted(segments, key=lambda seg: seg["start"])


class GuestSession:
    """The guest car and its plan; at most one guest at a time per household."""

    def __init__(self, hass: HomeAssistant, household: Household) -> None:
        self.hass = hass
        self.household = household
        self.inputs: dict[str, Any] = {
            GUEST_PLATE: "",
            GUEST_SOC: 20.0,
            GUEST_BATTERY: 77.0,
            GUEST_POWER: 11.0,
            GUEST_LIMIT: 80.0,
            GUEST_READY_BY: "07:00",
            GUEST_USE_READY_BY: True,
            GUEST_CONTINUOUS: True,
            GUEST_CHARGER: None,
            GUEST_DEPARTURE: "",
            GUEST_CEILING: None,
            GUEST_STEP: 1,
        }
        self.results: dict[str, Any] = {
            **dict.fromkeys(PLAN_RESULTS),
            **dict.fromkeys(CAR_RESULTS),
            "last_calculation": None,
            "charging_schedule": [],
            "raw_two_days": [],
            "plan_mode": "continuous",
            "measured_energy": None,
            "measured_cost": None,
        }
        self.service_health: dict[str, bool] = {"motorapi": True, "nhtsa": True, "open_ev_data": True}
        self.history: list[dict[str, Any]] = []
        self.segments: list[Segment] = []
        self.error: str | None = None
        self.error_detail: str | None = None
        self.plan_info: dict[str, Any] | None = None
        self._auto_recalculate = False
        self._recorded = True
        self._release: dict[str, str] | None = None
        # When the guest's plan was made: a car of the household plugged in after that has taken the charger.
        self._session_start: datetime | None = None
        self._car_present = False
        # After "Stop": the charger stays paused for the guest until then
        # (or until the guest car is unplugged, when the charger can tell).
        self._hold_until: datetime | None = None
        self._meter_last: float | None = None
        # What was charged under earlier plans of the same session (planned again, or
        # "Charge now", while it charged): it stays on the bill.
        self._carried: list[dict[str, Any]] = []
        # When the guest car was seen unplugged in a pause between periods.
        self._unplugged_at: datetime | None = None
        self._boundaries: list[CALLBACK_TYPE] = []
        self._tick: CALLBACK_TYPE | None = None
        self._unplug_timer: CALLBACK_TYPE | None = None

    # ------------------------------------------------------------------
    # Charger

    @property
    def charger(self) -> Charger | None:
        return self.household.charger_for_guest(self.inputs.get(GUEST_CHARGER))

    @property
    def charger_id(self) -> str | None:
        charger = self.charger
        return charger.charger_id if charger else None

    @property
    def energy_entity(self) -> str | None:
        charger = self.charger
        return charger.energy_entity if charger else None

    @property
    def connected_entity(self) -> str | None:
        charger = self.charger
        return charger.connected_entity if charger else None

    # ------------------------------------------------------------------
    # Persistence

    def to_store(self) -> dict[str, Any]:
        return {
            "inputs": dict(self.inputs),
            "results": dict(self.results),
            "segments": serialize_segments(self.segments),
            "auto_recalculate": self._auto_recalculate,
            "plan_info": self.plan_info,
            "recorded": self._recorded,
            "meter_last": self._meter_last,
            "release": self._release,
            "session_start": self._session_start.isoformat() if self._session_start else None,
            "car_present": self._car_present,
            "hold_until": self._hold_until.isoformat() if self._hold_until else None,
            "carried": self._carried,
            "history": self.history,
        }

    def load(self, stored: Mapping[str, Any] | None) -> None:
        if not isinstance(stored, Mapping):
            return
        for key, value in (stored.get("inputs") or {}).items():
            if key in self.inputs:
                self.inputs[key] = value
        for key, value in (stored.get("results") or {}).items():
            if key in self.results:
                self.results[key] = value
        self.inputs[GUEST_READY_BY] = (parse_hhmm(self.inputs.get(GUEST_READY_BY)) or time(7)).strftime("%H:%M")
        self.segments = parse_segments(stored.get("segments"))
        self._auto_recalculate = bool(stored.get("auto_recalculate", False))
        info = stored.get("plan_info")
        self.plan_info = info if isinstance(info, dict) else None
        self._recorded = bool(stored.get("recorded", self.plan_info is None))
        release = stored.get("release")
        self._release = release if isinstance(release, dict) else None
        self._car_present = bool(stored.get("car_present", False))
        start = stored.get("session_start")
        self._session_start = dt_util.parse_datetime(start) if isinstance(start, str) else None
        hold = stored.get("hold_until")
        self._hold_until = dt_util.parse_datetime(hold) if isinstance(hold, str) else None
        meter = stored.get("meter_last")
        self._meter_last = float(meter) if isinstance(meter, int | float) else None
        carried = stored.get("carried")
        self._carried = [part for part in carried if isinstance(part, dict)] if isinstance(carried, list) else []
        self.history = [entry for entry in stored.get("history") or [] if isinstance(entry, dict)][:HISTORY_LIMIT]

    def _changed(self) -> None:
        self.household.async_save()
        self.household.async_update_listeners()

    # ------------------------------------------------------------------
    # Lifecycle

    @callback
    def async_start(self) -> None:
        if (connected := self.car_connected) is not None:
            self._car_present = connected
        if self.energy_entity and self._meter_last is None:
            self._meter_last = self.household.meter_kwh(self.energy_entity)
        self._update_session(dt_util.now())
        self._maybe_record()
        self._schedule_boundaries()

    @callback
    def async_stop(self) -> None:
        self._cancel_boundaries()
        self._stop_tick()
        self._cancel_unplug_timer()

    # ------------------------------------------------------------------
    # Inputs and status

    async def async_set_input(self, key: str, value: Any) -> None:
        if key == GUEST_READY_BY:
            moment = value if isinstance(value, time) else parse_hhmm(value)
            value = (moment or time(7)).strftime("%H:%M")
        if key == GUEST_PLATE:
            value = str(value or "").strip().upper()
        if key == GUEST_STEP:
            value = int(value) if value in (1, 5, 10, "1", "5", "10") else 1
        self.inputs[key] = value
        self._changed()

    def status(self, now: datetime | None = None) -> str:
        if self.error:
            return self.error
        if not self.segments:
            return GUEST_READY
        if self._release is not None:
            return GUEST_COMPLETED
        now = now or dt_util.now()
        if self.is_charge_now(now):
            return GUEST_CHARGING
        if self._hold_until is not None:
            return GUEST_STOPPED
        if now >= self.segments[-1]["end"]:
            return GUEST_COMPLETED
        return GUEST_PLANNED

    @property
    def plan_start(self) -> datetime | None:
        return self.segments[0]["start"] if self.segments else None

    @property
    def plan_end(self) -> datetime | None:
        return self.segments[-1]["end"] if self.segments else None

    def _set_service_health(self, service: str, available: bool) -> None:
        self.service_health[service] = available

    # ------------------------------------------------------------------
    # License plate lookup

    async def async_lookup(self) -> None:
        """Look up the guest car from its license plate (MotorAPI, NHTSA, Open EV Data)."""
        plate = str(self.inputs.get(GUEST_PLATE) or "").strip()
        if not plate:
            self._fail(ERROR_LICENSE_PLATE_REQUIRED)
        api_key = self.household.motorapi_key
        if not api_key:
            self._fail(ERROR_MOTORAPI_KEY_MISSING)
        session = async_get_clientsession(self.hass)
        try:
            motor = await async_lookup_vehicle(
                session, plate, api_key, self.household.country, self.household.plate_provider
            )
            self._set_service_health("motorapi", True)
        except PlateAuthError as err:
            self._set_service_health("motorapi", False)
            self.household.config_entry.async_start_reauth(self.hass)
            self._fail(ERROR_INVALID_API_KEY, cause=err)
        except PlateLookupFailed as err:
            reason = str(err)
            self._set_service_health("motorapi", reason not in {"cannot_connect", "timeout"})
            if reason == "vehicle_not_found":
                self._fail(ERROR_VEHICLE_NOT_FOUND, cause=err)
            self._fail(ERROR_LOOKUP_FAILED, detail=reason, cause=err, service_error=True)

        decoded = None
        if motor.vin:
            decoded = await async_decode_vin_nhtsa(session, motor.vin, motor.model_year)
            self._set_service_health("nhtsa", decoded is not None)
        normalized = self._merge(motor, decoded)
        battery = await async_lookup_battery_open_ev_data(
            session,
            normalized.brand,
            normalized.model,
            normalized.variant,
            normalized.model_year,
            cache=self.hass.data.setdefault(DATASET_CACHE_KEY, {}),
        )
        self._set_service_health("open_ev_data", battery.raw is not None or battery.battery_capacity is None)
        self.results.update(
            {
                "car_brand": normalized.brand,
                "car_model": normalized.model,
                "car_variant": normalized.variant,
                "car_battery_capacity": battery.battery_capacity,
                "vin": normalized.vin,
                "model_year": normalized.model_year,
                "fuel_type": normalized.fuel_type,
                "match_score": battery.match_score,
                "last_source": f"{normalized.source} + {battery.source}",
                "last_lookup": dt_util.now().isoformat(),
            }
        )
        if battery.battery_capacity:
            self.inputs[GUEST_BATTERY] = battery.battery_capacity
        self._changed()

    @staticmethod
    def _merge(primary: VehicleLookupResult, fallback: VehicleLookupResult | None) -> VehicleLookupResult:
        return VehicleLookupResult(
            plate=primary.plate,
            vin=primary.vin or (fallback.vin if fallback else None),
            brand=primary.brand or (fallback.brand if fallback else None),
            model=primary.model or (fallback.model if fallback else None),
            variant=primary.variant or (fallback.variant if fallback else None),
            model_year=primary.model_year or (fallback.model_year if fallback else None),
            fuel_type=primary.fuel_type or (fallback.fuel_type if fallback else None),
            source=primary.source,
            raw=primary.raw,
        )

    def _fail(
        self,
        key: str,
        *,
        detail: str | None = None,
        cause: Exception | None = None,
        service_error: bool = False,
        show_in_status: bool = False,
    ) -> NoReturn:
        if show_in_status:
            self.error, self.error_detail = key, detail
        self.household.async_update_listeners()
        error_cls = HomeAssistantError if service_error else ServiceValidationError
        raise error_cls(
            translation_domain=DOMAIN,
            translation_key=key,
            translation_placeholders={"detail": detail} if detail else None,
        ) from cause

    # ------------------------------------------------------------------
    # Planning

    @staticmethod
    def _need(inputs: Mapping[str, Any]) -> tuple[ChargeNeed, float]:
        """What the guest car needs, and the charging power; raises PlanError."""
        try:
            soc = float(inputs[GUEST_SOC])
            capacity = float(inputs[GUEST_BATTERY])
            power = float(inputs[GUEST_POWER])
            limit = float(inputs[GUEST_LIMIT])
        except (KeyError, TypeError, ValueError) as err:
            raise PlanError(ERROR_INVALID_INPUT) from err
        return charge_need(soc, limit, capacity, power), power

    def make_plan(self, inputs: Mapping[str, Any], now: datetime | None = None) -> tuple[Plan, list[PriceSlot]]:
        """Plan with the given inputs; raises PlanError. Nothing is stored."""
        need, power = self._need(inputs)
        now = now or dt_util.now()
        slots = self.household.price_slots(now)
        completion = None
        departure = self.departure(inputs)
        if departure is not None:
            completion = departures.deadline(departure, now)
        elif bool(inputs.get(GUEST_USE_READY_BY, True)):
            completion = next_completion(now, parse_hhmm(inputs.get(GUEST_READY_BY)) or time(7))
        blocked = self.household.blocked_for_guest(self.charger_id)
        if blocked:
            slots = cut_slots(slots, blocked)
        continuous = bool(inputs.get(GUEST_CONTINUOUS, True))
        ceilings = [
            value
            for value in (
                to_float(inputs.get(GUEST_CEILING)),
                departures.ceiling(departure, slots, completion) if departure is not None else None,
            )
            if value is not None
        ]
        if ceilings:
            # Only the hours at or under the ceiling; when they are too few, the cheapest hours after all.
            cheap = [slot for slot in slots if slot.price <= min(ceilings) + 1e-9]
            try:
                return make_plan(cheap, need, power, now, completion, PLANNING_HORIZON, continuous), slots
            except PlanError:
                pass
        plan = make_plan(slots, need, power, now, completion, PLANNING_HORIZON, continuous)
        return plan, slots

    def departure(self, inputs: Mapping[str, Any] | None = None) -> dict[str, Any] | None:
        """The household's departure the guest's plan is ready by (None: the guest's own time)."""
        ident = str((inputs or self.inputs).get(GUEST_DEPARTURE) or "")
        if not ident or ident == departures.HOLIDAY:
            return None
        return departures.find(self.household.settings.get("departures"), ident)

    async def async_calculate(self, manual: bool = True) -> None:
        """Make the cheapest plan; the plan is locked once it has started (EV Guest)."""
        if manual:
            self._auto_recalculate = True
        elif self.is_plan_locked():
            return
        now = dt_util.now()
        try:
            plan, _slots = self.make_plan(self.inputs, now)
        except PlanError as err:
            if manual:
                self._maybe_record(now, ended=True)
                self._clear_plan(now, RELEASE_CLEARED)
                self.household.async_save()
                self._fail(err.key, cause=err, show_in_status=True)
            if not self.segments:
                self.error = err.key
                self.household.async_update_listeners()
            return
        self._apply(plan, now, new_session=manual or not self.segments)

    async def async_charge_now(self) -> None:
        """Charge the guest car right away until the target, whatever the price.

        Runs like a plan that starts now, so the charger, the energy meter and
        the history work as for a planned charge. New prices do not move it.
        """
        now = dt_util.now()
        try:
            need, power = self._need(self.inputs)
        except PlanError as err:
            self._fail(err.key, cause=err, show_in_status=True)
        self._auto_recalculate = False
        plan = charge_now_plan(self.household.price_slots(now), need, power, now)
        self._apply(plan, now, new_session=True)

    async def async_stop_charging(self) -> None:
        """Stop the guest's charge now; it goes to the history with what was charged.

        The charger stays paused for the guest until the car is unplugged
        (or, without a plugged-in sensor, until the plan would have ended),
        so it does not just carry on charging the guest car.
        """
        now = dt_util.now()
        start, planned_end = self.plan_start, self.plan_end
        if not self.session_active(now) or start is None or planned_end is None:
            return
        if now <= start:
            # Not started yet: there is nothing to stop, only a plan to drop.
            self._clear_plan(now, RELEASE_CLEARED)
            self._auto_recalculate = False
            self._changed()
            self.household.schedule_recalculate()
            return
        kept = self._scale_to(now)
        if self.plan_info is not None:
            self.plan_info["stopped"] = True
        self._auto_recalculate = False
        self._set_plan(kept)
        self._maybe_record(now, released=True)
        self._hold_until = planned_end + (POST_PLAN_HOLD if self.connected_entity else timedelta())
        self._schedule_boundaries()
        self._stop_tick()
        self._changed()
        self.household.schedule_recalculate()

    def _scale_to(self, now: datetime) -> list[Segment]:
        """The plan's periods up to ``now``, with the planned energy and cost cut to that share."""
        planned = sum((seg["end"] - seg["start"]).total_seconds() for seg in self.segments)
        kept = [{"start": seg["start"], "end": min(seg["end"], now)} for seg in self.segments if seg["start"] < now]
        charged = sum((seg["end"] - seg["start"]).total_seconds() for seg in kept)
        if self.plan_info is not None and planned > 0:
            share = min(1.0, charged / planned)
            for key in ("energy", "battery_energy", "cost", "savings"):
                if isinstance(value := self.plan_info.get(key), int | float):
                    self.plan_info[key] = round(value * share, 2)
        return kept

    def _charging_part(self, now: datetime) -> dict[str, Any] | None:
        """What the running session has charged so far under its plan, or None when it has not begun."""
        if self._recorded or self.plan_info is None or self._release is not None or not self.segments:
            return None
        if now <= self.segments[0]["start"]:
            return None
        info = dict(self.plan_info)
        self.plan_info = info
        kept = self._scale_to(now)
        return {
            "periods": serialize_segments(kept),
            **{key: info.get(key) for key in ("energy", "battery_energy", "cost", "savings")},
        }

    def _apply(self, plan: Plan, now: datetime, *, new_session: bool) -> None:
        """Store a new plan; a new session first records the previous one.

        A plan made while the guest's charge is running (planned again, or
        "Charge now") keeps the session: what was charged so far stays on the
        bill, and the energy meter counts on.
        """
        if new_session:
            if (part := self._charging_part(now)) is not None:
                self._carried.append(part)
            else:
                self._maybe_record(now, ended=True)
                self._start_session()
        visible = self.household.visible_slots(self.household.price_slots(now))
        self.results.update(
            {
                "charging_speed": round(plan.need.speed_pct_per_hour, 1),
                "charge_time": plan.need.minutes,
                "charge_costs": round(plan.cost, 2),
                "energy": round(plan.need.grid_kwh, 2),
                "savings": None if plan.savings is None else round(plan.savings, 2),
                "charge_now_cost": None if plan.charge_now_cost is None else round(plan.charge_now_cost, 2),
                "average_price": None if plan.average_price is None else round(plan.average_price, 4),
                "raw_two_days": [{"start": slot.start.isoformat(), "value": slot.price} for slot in visible],
                "charging_schedule": segments_to_schedule(plan.segments, visible),
                "plan_mode": plan.mode,
                "last_calculation": now.isoformat(),
            }
        )
        self.plan_info = self._describe(plan)
        self.error = self.error_detail = None
        self._set_plan(plan.segments)
        self._changed()
        self.household.schedule_recalculate()

    def _describe(self, plan: Plan) -> dict[str, Any]:
        car = " ".join(str(p) for p in (self.results.get("car_brand"), self.results.get("car_model")) if p)
        charger = self.charger
        return {
            "plate": str(self.inputs.get(GUEST_PLATE) or ""),
            "car": car or None,
            "variant": self.results.get("car_variant"),
            "soc": self.inputs.get(GUEST_SOC),
            "limit": self.inputs.get(GUEST_LIMIT),
            "energy": round(plan.need.grid_kwh, 2),
            "battery_energy": round(plan.need.battery_kwh, 2),
            "cost": round(plan.cost, 2),
            "savings": None if plan.savings is None else round(plan.savings, 2),
            "mode": plan.mode,
            "currency": self.household.currency,
            "charger": charger.name if charger else None,
            "inputs": {key: self.inputs.get(key) for key in PLAN_INPUT_KEYS},
        }

    def _start_session(self) -> None:
        self._recorded = False
        self._release = None
        self._session_start = dt_util.now()
        self._hold_until = None
        self._carried = []
        self._unplugged_at = None
        if self.energy_entity:
            self.results["measured_energy"] = 0.0
            self.results["measured_cost"] = 0.0
            self._meter_last = self.household.meter_kwh(self.energy_entity)
        else:
            self.results["measured_energy"] = None
            self.results["measured_cost"] = None

    def _clear_plan(self, now: datetime, reason: str) -> None:
        if self.session_active(now):
            self._release = {"at": now.isoformat(), "reason": reason}
        self._hold_until = None
        self._set_plan([])
        for key in PLAN_RESULTS:
            self.results[key] = None
        self.plan_info = None
        self._recorded = True
        self._carried = []

    def finished_long_ago(self, now: datetime) -> bool:
        """The guest unplugged after the charge a while ago, and has not come back: time to forget them."""
        if self._release is None or self._release.get("reason") != RELEASE_UNPLUGGED or self.car_connected is True:
            return False
        # From when the car was found gone, not from when it left (that can be long before, in a pause).
        released = dt_util.parse_datetime(str(self._release.get("seen") or self._release.get("at") or ""))
        return released is not None and now - released >= GUEST_CLEAR_AFTER

    async def async_new_guest(self) -> None:
        """Forget the guest and the plan; a finished plan goes to the history."""
        now = dt_util.now()
        self._maybe_record(now, ended=True)
        self._clear_plan(now, RELEASE_NEW_GUEST)
        if self._release is not None and self._release.get("reason") == RELEASE_UNPLUGGED:
            # The guest who drove off is forgotten now: not again every minute (that wiped a new plate).
            self._release = {"at": now.isoformat(), "reason": RELEASE_NEW_GUEST}
        self.error = self.error_detail = None
        self._auto_recalculate = False
        self.inputs[GUEST_PLATE] = ""
        for key in CAR_RESULTS:
            self.results[key] = None
        self.results["measured_energy"] = None
        self.results["measured_cost"] = None
        self._changed()
        self.household.schedule_recalculate()

    @callback
    def handle_prices(self) -> None:
        """New prices: update a plan that has not started yet."""
        if self._auto_recalculate and not self.is_plan_locked():
            self.household.config_entry.async_create_task(
                self.hass, self.async_calculate(manual=False), f"{DOMAIN} guest recalculate"
            )

    # ------------------------------------------------------------------
    # Plan state

    def _set_plan(self, segments: list[Segment]) -> None:
        self.segments = [{"start": seg["start"], "end": seg["end"]} for seg in segments]
        if not segments:
            self.results["charging_schedule"] = []
        self._schedule_boundaries()

    def _schedule_boundaries(self) -> None:
        self._cancel_boundaries()
        now = dt_util.now()
        moments = [moment for seg in self.segments for moment in (seg["start"], seg["end"])]
        if self.segments and not self._recorded:
            moments.append(self.segments[-1]["end"] + METER_GRACE)
        if self.segments and self.connected_entity and self._release is None:
            moments.append(self.segments[-1]["end"] + POST_PLAN_HOLD)
        if self._hold_until is not None and self._release is None:
            moments.append(self._hold_until)
        for moment in moments:
            if moment > now:
                self._boundaries.append(async_track_point_in_time(self.hass, self._handle_boundary, moment))
        self._update_tick(now)

    def _cancel_boundaries(self) -> None:
        while self._boundaries:
            self._boundaries.pop()()

    @callback
    def _handle_boundary(self, now: datetime) -> None:
        self._update_session(now)
        self._maybe_record(now)
        self._update_tick(now)
        self.household.schedule_recalculate()
        self.household.async_update_listeners()

    def _update_tick(self, now: datetime) -> None:
        if self.is_charge_now(now):
            if self._tick is None:
                self._tick = async_track_time_interval(self.hass, self._handle_tick, PROGRESS_INTERVAL)
        else:
            self._stop_tick()

    def _stop_tick(self) -> None:
        if self._tick is not None:
            self._tick()
            self._tick = None

    @callback
    def _handle_tick(self, _now: datetime) -> None:
        self.household.async_update_listeners()

    def is_plan_locked(self, now: datetime | None = None) -> bool:
        if not self.segments:
            return False
        return self.segments[0]["start"] <= (now or dt_util.now())

    def is_charge_now(self, now: datetime | None = None) -> bool:
        if self._release is not None:
            return False
        now = now or dt_util.now()
        return any(seg["start"] <= now < seg["end"] for seg in self.segments)

    # ------------------------------------------------------------------
    # Session and charger control

    def session_active(self, now: datetime | None = None) -> bool:
        """True while the guest plan holds the charger (EV Guest's rules)."""
        end = self.plan_end
        if end is None or self._release is not None:
            return False
        now = now or dt_util.now()
        if now < end:
            return True
        if self._hold_until is not None:
            return now < self._hold_until and (not self.connected_entity or self._car_present)
        return bool(self.connected_entity) and self._car_present and now < end + POST_PLAN_HOLD

    def charger_control(self, now: datetime | None = None) -> str:
        now = now or dt_util.now()
        if not self.session_active(now):
            return CONTROL_RELEASED
        return CONTROL_CHARGE if self.is_charge_now(now) else CONTROL_PAUSE

    def release_info(self, now: datetime | None = None) -> dict[str, str] | None:
        now = now or dt_util.now()
        if self.session_active(now):
            return None
        if self._release is not None:
            return dict(self._release)
        end = self.plan_end
        if end is not None:
            return {"at": end.isoformat(), "reason": RELEASE_PLAN_END}
        return None

    def _update_session(self, now: datetime) -> None:
        end = self.plan_end
        if self._release is None and end is not None and now >= end and not self.session_active(now):
            reason = RELEASE_STOPPED if self._hold_until is not None else RELEASE_PLAN_END
            self._release = {"at": now.isoformat(), "reason": reason}
            self.household.async_save()

    def yield_to_household(self, now: datetime, vehicles: Iterable[Vehicle]) -> str | None:
        """A car of the household plugged in at the guest's charger after the guest's plan was made: the guest has gone.

        One cable, one car: the guest's plan no longer holds the charger (a plan left over from a guest who
        drove off at a charger that cannot tell, kept a car of the household waiting). The name of the car,
        when the guest let go.
        """
        charger_id = self.charger_id
        if charger_id is None or not self.session_active(now):
            return None
        for vehicle in vehicles:
            since = vehicle.connected_since
            if (
                vehicle.charger_id != charger_id
                or vehicle.connected_car is not True  # its own sensor, not the charger's say-so
                or vehicle.at_home is False
                or since is None
                or (self._session_start is not None and since <= self._session_start)
            ):
                continue
            self._release = {"at": now.isoformat(), "reason": RELEASE_HOUSEHOLD, "car": vehicle.name}
            self._auto_recalculate = False
            self._maybe_record(now, released=True)
            self._stop_tick()
            self._changed()
            return vehicle.name
        return None

    @property
    def car_connected(self) -> bool | None:
        charger = self.charger
        if charger is None:
            return None
        return charger.connected

    @callback
    def handle_connected(self, connected: bool | None) -> None:
        """The charger's car connected sensor changed."""
        if connected is True:
            self._cancel_unplug_timer()
            self._unplugged_at = None
            self._car_present = True
        elif connected is False:
            now = dt_util.now()
            end = self.plan_end
            if not self.session_active(now):
                self._car_present = False
            elif end is not None and now >= end:
                self._handle_unplugged(now)
                return
            elif self._unplug_timer is None:
                self._unplugged_at = now
                following = self._next_start(now)
                if following is not None and not self.is_charge_now(now):
                    # In a pause: some chargers say "no car" while charging is paused.
                    # The car is gone only if it is still missing when charging should go on.
                    delay = following + GUEST_PAUSE_UNPLUG_CHECK - now
                else:
                    delay = UNPLUG_DELAY
                self._unplug_timer = async_call_later(self.hass, delay, self._handle_unplugged)
        self._changed()

    def _next_start(self, now: datetime) -> datetime | None:
        """When the next period of the plan begins, if one is still to come."""
        return next((seg["start"] for seg in self.segments if seg["start"] > now), None)

    @callback
    def _handle_unplugged(self, now: datetime) -> None:
        self._unplug_timer = None
        if self.car_connected is not False:
            return
        active = self.session_active(now)
        self._car_present = False
        if active:
            # Gone since it was first seen unplugged: that is where the charge ended.
            gone = min(self._unplugged_at or now, now)
            self._unplugged_at = None
            if self.measured_energy is None:
                # No meter: the bill is the share of the plan that was charged.
                self._set_plan(self._scale_to(gone) or self.segments)
            self._release = {"at": gone.isoformat(), "reason": RELEASE_UNPLUGGED, "seen": now.isoformat()}
            self._auto_recalculate = False
            self._maybe_record(gone, released=True)
            self._stop_tick()
        self._changed()
        self.household.schedule_recalculate()

    @property
    def measured_energy(self) -> float | None:
        value = self.results.get("measured_energy")
        return float(value) if self.energy_entity and isinstance(value, int | float) else None

    def _cancel_unplug_timer(self) -> None:
        if self._unplug_timer is not None:
            self._unplug_timer()
            self._unplug_timer = None

    def progress(self, now: datetime | None = None) -> Progress | None:
        measured = None
        if self.energy_entity:
            value = self.results.get("measured_energy")
            measured = float(value) if isinstance(value, int | float) else None
        inputs = (self.plan_info or {}).get("inputs")
        now = now or dt_util.now()
        if self._release is not None and (released := dt_util.parse_datetime(self._release.get("at", ""))):
            now = min(now, released)
        return plan_progress(self.segments, inputs, now, measured)

    # ------------------------------------------------------------------
    # Energy meter

    def meter_step(self, reading: float | None) -> float:
        """Count a meter reading toward the guest; returns the kWh counted (0 when not the guest's)."""
        if reading is None:
            return 0.0
        last, self._meter_last = self._meter_last, reading
        start, end = self.plan_start, self.plan_end
        if last is None or start is None or end is None or self._recorded:
            return 0.0
        if self._release is not None and self._release.get("reason") != RELEASE_PLAN_END:
            return 0.0
        now = dt_util.now()
        if not start <= now <= end + METER_GRACE:
            return 0.0
        step = reading - last
        if step <= 0 or step > MAX_METER_STEP_KWH:
            return 0.0
        energy = float(self.results.get("measured_energy") or 0.0) + step
        cost = float(self.results.get("measured_cost") or 0.0)
        price = price_at(self.household.price_slots(now), now)
        if price is not None:
            cost += step * price
        self.results["measured_energy"] = round(energy, 3)
        self.results["measured_cost"] = round(cost, 2)
        self._changed()
        return step

    # ------------------------------------------------------------------
    # History

    def _maybe_record(self, now: datetime | None = None, *, ended: bool = False, released: bool = False) -> None:
        end = self.plan_end
        if self._recorded or self.plan_info is None or end is None:
            return
        now = now or dt_util.now()
        if released:
            if now <= self.segments[0]["start"]:
                self._recorded = True
                return
            end = min(now, end)
        elif now < end + (timedelta() if ended else METER_GRACE):
            return
        periods = [period for part in self._carried for period in part.get("periods") or []]
        until = end
        periods += serialize_segments(
            [{"start": seg["start"], "end": min(seg["end"], until)} for seg in self.segments if seg["start"] < until]
        )
        entry = {
            **self.plan_info,
            "id": uuid4().hex,
            "start": periods[0]["start"] if periods else self.segments[0]["start"].isoformat(),
            "end": end.isoformat(),
            "periods": periods,
            "measured_energy": self.results.get("measured_energy"),
            "measured_cost": self.results.get("measured_cost"),
        }
        for key in ("energy", "battery_energy", "cost", "savings"):
            values = [part.get(key) for part in self._carried] + [entry.get(key)]
            numbers = [float(value) for value in values if isinstance(value, int | float)]
            if self._carried and len(numbers) == len(values):
                entry[key] = round(sum(numbers), 2)
        self.history = [entry, *self.history][:HISTORY_LIMIT]
        self._recorded = True
        self.household.async_save()

    async def async_delete_history(self, entry_id: str | None) -> None:
        self.history = [] if entry_id is None else [e for e in self.history if e.get("id") != entry_id]
        self._changed()
