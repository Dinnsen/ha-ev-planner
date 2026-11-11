"""Websocket commands used by the EV Planner panel."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from datetime import datetime
import functools
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util, slugify

from .catalog import panel_info
from .const import (
    BODY_OPTIONS,
    CONTROL_FAILS_ISSUE,
    DOMAIN,
    FORGET_RESUME,
    GUEST_BATTERY,
    GUEST_CHARGER,
    GUEST_CONTINUOUS,
    GUEST_LIMIT,
    GUEST_PLATE,
    GUEST_POWER,
    GUEST_READY_BY,
    GUEST_SOC,
    GUEST_USE_READY_BY,
    MODES,
    OCCUPANT_GUEST,
    OPPORTUNISTIC_OPTIONS,
    PAINT_OPTIONS,
    PRIORITY_OPTIONS,
    SCHEDULE_DEFAULT,
    SCHEDULE_NONE,
    SET_BODY,
    SET_CEILING,
    SET_CEILING_ABOVE,
    SET_CEILING_ENABLED,
    SET_CEILING_RELATIVE,
    SET_CONTINUOUS,
    SET_DAY_TARGETS,
    SET_EARLIEST_START,
    SET_EARLY_ENABLED,
    SET_EARLY_WITHIN,
    SET_FOLLOW_LEVEL,
    SET_JOIN_ENABLED,
    SET_JOIN_WITHIN,
    SET_KEEP_ON,
    SET_LIVE,
    SET_LOW_PRICE_ENABLED,
    SET_LOW_PRICE_LEVEL,
    SET_LOW_SOC_ENABLED,
    SET_LOW_SOC_LEVEL,
    SET_MANUAL_SOC,
    SET_MIN_SOC,
    SET_MODE,
    SET_MUST_SOC,
    SET_NOTIFY_DONE,
    SET_NOTIFY_RECEIPT,
    SET_NOTIFY_TARGETS,
    SET_OPPORTUNISTIC,
    SET_OPPORTUNISTIC_LEVEL,
    SET_PAINT,
    SET_PRIORITY,
    SET_READY_BY,
    SET_REMINDER,
    SET_REMINDER_DAYS,
    SET_REMINDER_HORIZON,
    SET_REMINDER_PRICE,
    SET_REMINDER_PRICE_ENABLED,
    SET_REMINDER_REPEAT,
    SET_REMINDER_SOC,
    SET_REMINDER_TIME,
    SET_SCHEDULE,
    SET_SOLAR,
    SET_SPOT,
    SET_TARGET_SOC,
    SET_TOPUP_ENABLED,
    SET_TOPUP_LEVEL,
    SET_USE_EARLIEST_START,
    SET_USE_READY_BY,
    SOLAR_OPTIONS,
    SPOT_OPTIONS,
    WEEKDAYS,
)
from .guest import GuestSession, serialize_segments
from .household import EVPlannerConfigEntry, Household
from .planner import PlanError
from .prices import price_issue
from .rules import VehiclePlan, parse_hhmm
from .schema import vol
from .vehicle import Vehicle

ENTRY = vol.Optional("entry_id")
PERCENT = vol.All(vol.Coerce(float), vol.Range(min=0, max=100))
PRICE = vol.All(vol.Coerce(float), vol.Range(min=-5, max=20))


def _hhmm(value: Any) -> str:
    moment = parse_hhmm(value)
    if moment is None:
        raise vol.Invalid("expected HH:MM")
    return moment.strftime("%H:%M")


def _schedule_entry(value: Any) -> str:
    if value in (SCHEDULE_DEFAULT, SCHEDULE_NONE):
        return str(value)
    return _hhmm(value)


VEHICLE_SCHEMA = vol.Schema(
    {
        vol.Optional(SET_MODE): vol.In(MODES),
        vol.Optional(SET_TARGET_SOC): PERCENT,
        vol.Optional(SET_MANUAL_SOC): PERCENT,
        vol.Optional(SET_MIN_SOC): PERCENT,
        vol.Optional(SET_READY_BY): _hhmm,
        vol.Optional(SET_USE_READY_BY): cv.boolean,
        vol.Optional(SET_SCHEDULE): {vol.In(WEEKDAYS): _schedule_entry},
        vol.Optional(SET_EARLIEST_START): _hhmm,
        vol.Optional(SET_USE_EARLIEST_START): cv.boolean,
        vol.Optional(SET_CONTINUOUS): cv.boolean,
        vol.Optional(SET_JOIN_ENABLED): cv.boolean,
        vol.Optional(SET_JOIN_WITHIN): vol.All(vol.Coerce(float), vol.Range(min=0, max=2)),
        vol.Optional(SET_CEILING_ENABLED): cv.boolean,
        vol.Optional(SET_CEILING): PRICE,
        vol.Optional(SET_CEILING_RELATIVE): cv.boolean,
        vol.Optional(SET_CEILING_ABOVE): vol.All(vol.Coerce(float), vol.Range(min=0, max=200)),
        vol.Optional(SET_LOW_PRICE_ENABLED): cv.boolean,
        vol.Optional(SET_LOW_PRICE_LEVEL): PRICE,
        vol.Optional(SET_LOW_SOC_ENABLED): cv.boolean,
        vol.Optional(SET_LOW_SOC_LEVEL): PERCENT,
        vol.Optional(SET_OPPORTUNISTIC): vol.In(OPPORTUNISTIC_OPTIONS),
        vol.Optional(SET_OPPORTUNISTIC_LEVEL): PERCENT,
        vol.Optional(SET_FOLLOW_LEVEL): vol.All(vol.Coerce(float), vol.Range(min=0, max=200)),
        vol.Optional(SET_KEEP_ON): cv.boolean,
        vol.Optional(SET_REMINDER): cv.boolean,
        vol.Optional(SET_REMINDER_TIME): _hhmm,
        vol.Optional(SET_REMINDER_SOC): PERCENT,
        vol.Optional(SET_REMINDER_PRICE_ENABLED): cv.boolean,
        vol.Optional(SET_REMINDER_PRICE): PRICE,
        vol.Optional(SET_REMINDER_DAYS): vol.All(cv.ensure_list, [vol.In(WEEKDAYS)]),
        vol.Optional(SET_REMINDER_REPEAT): vol.All(vol.Coerce(float), vol.Range(min=0, max=240)),
        vol.Optional(SET_REMINDER_HORIZON): vol.All(vol.Coerce(float), vol.Range(min=1, max=48)),
        vol.Optional(SET_NOTIFY_TARGETS): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(SET_LIVE): cv.boolean,
        vol.Optional(SET_NOTIFY_DONE): cv.boolean,
        vol.Optional(SET_NOTIFY_RECEIPT): cv.boolean,
        vol.Optional(SET_EARLY_ENABLED): cv.boolean,
        vol.Optional(SET_EARLY_WITHIN): vol.All(vol.Coerce(float), vol.Range(min=0, max=2)),
        vol.Optional(SET_TOPUP_ENABLED): cv.boolean,
        vol.Optional(SET_TOPUP_LEVEL): vol.All(vol.Coerce(float), vol.Range(min=10, max=100)),
        vol.Optional(SET_MUST_SOC): vol.All(vol.Coerce(float), vol.Range(min=0, max=100)),
        vol.Optional(SET_PRIORITY): vol.In(PRIORITY_OPTIONS),
        vol.Optional(SET_SOLAR): vol.In(SOLAR_OPTIONS),
        vol.Optional(SET_BODY): vol.In(BODY_OPTIONS),
        vol.Optional(SET_PAINT): vol.In(PAINT_OPTIONS),
        vol.Optional(SET_SPOT): vol.In(SPOT_OPTIONS),
        vol.Optional(SET_DAY_TARGETS): {vol.In(WEEKDAYS): vol.All(vol.Coerce(float), vol.Range(min=10, max=100))},
        vol.Optional(FORGET_RESUME): cv.boolean,
    }
)
GUEST_SCHEMA = vol.Schema(
    {
        vol.Optional(GUEST_PLATE): vol.All(cv.string, vol.Length(max=16)),
        vol.Optional(GUEST_SOC): PERCENT,
        vol.Optional(GUEST_LIMIT): PERCENT,
        vol.Optional(GUEST_BATTERY): vol.All(vol.Coerce(float), vol.Range(min=1, max=300)),
        vol.Optional(GUEST_POWER): vol.All(vol.Coerce(float), vol.Range(min=0.1, max=350)),
        vol.Optional(GUEST_READY_BY): _hhmm,
        vol.Optional(GUEST_USE_READY_BY): cv.boolean,
        vol.Optional(GUEST_CONTINUOUS): cv.boolean,
        vol.Optional(GUEST_CHARGER): vol.Any(None, cv.string),
    }
)
SETTINGS_SCHEMA = vol.Schema(
    {
        vol.Optional("bill_price"): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0))),
        vol.Optional("payment_text"): vol.All(cv.string, vol.Length(max=200)),
        vol.Optional("language"): vol.In(["auto", "da", "en"]),
        vol.Optional("house"): vol.In(["classic", "angle"]),
    }
)

type _Handler = Callable[[HomeAssistant, websocket_api.ActiveConnection, dict[str, Any]], Awaitable[None]]


def _household(hass: HomeAssistant, msg: Mapping[str, Any]) -> Household:
    entries: list[EVPlannerConfigEntry] = hass.config_entries.async_loaded_entries(DOMAIN)
    if entry_id := msg.get("entry_id"):
        entries = [entry for entry in entries if entry.entry_id == entry_id]
    if not entries:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="entry_not_found")
    return entries[0].runtime_data


def _vehicle(household: Household, vehicle_id: str) -> Vehicle:
    vehicle = household.vehicles.get(vehicle_id)
    if vehicle is None:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="car_not_found")
    return vehicle


def _errors(func: _Handler) -> _Handler:
    """Send translated errors back to the panel instead of failing the command."""

    @functools.wraps(func)
    async def wrapper(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        try:
            await func(hass, connection, msg)
        except HomeAssistantError as err:
            connection.send_error(msg["id"], err.translation_key or "unknown", str(err))

    return wrapper


def _r(value: float | None, digits: int = 2) -> float | None:
    return None if value is None else round(value, digits)


def plan_state(plan: VehiclePlan | None) -> dict[str, Any] | None:
    if plan is None:
        return None
    return {
        "segments": serialize_segments(plan.segments),
        "start": plan.start.isoformat() if plan.start else None,
        "end": plan.end.isoformat() if plan.end else None,
        "cost": _r(plan.cost),
        "energy": _r(plan.energy),
        "battery_energy": _r(plan.battery_energy),
        "minutes": plan.minutes,
        "mode": plan.mode,
        "speed": _r(plan.speed, 1),
        "end_soc": _r(plan.end_soc, 1),
        "savings": _r(plan.savings),
        "charge_now_cost": _r(plan.charge_now_cost),
        "average_price": _r(plan.average_price, 4),
        "ceiling": _r(plan.ceiling, 4),
        "opportunistic": plan.opportunistic,
        "limited": plan.limited,
        "min_only": plan.min_only,
        "short": plan.short,
        "joined": plan.joined,
        "joined_extra": _r(plan.joined_extra),
        "early": plan.early,
        "topup": plan.topup,
        "fallback": plan.fallback,
        "kept": plan.kept,
    }


def session_state(vehicle: Vehicle, now: datetime) -> dict[str, Any] | None:
    """The charge going on (from plug-in to unplug), for the panel."""
    session = vehicle.session
    if session is None:
        return None
    return {
        "start": session.start.isoformat(),
        "start_soc": session.start_soc,
        "energy": round(session.energy, 2),
        "cost": round(session.cost, 2),
        "charging": session.charging,
        "periods": [period.to_dict() for period in session.periods],
        "charging_minutes": round(session.charging_minutes(now)),
    }


def vehicle_state(household: Household, vehicle: Vehicle) -> dict[str, Any]:
    now = dt_util.now()
    charger = household.chargers.get(vehicle.charger_id or "")
    target_entity = vehicle.target_entity
    return {
        "id": vehicle.vehicle_id,
        "name": vehicle.name,
        "image": household.image_url(vehicle.vehicle_id),
        "image_original": household.original_image_url(vehicle.vehicle_id),
        "status": vehicle.status(),
        "reason": vehicle.decision.reason,
        "supply_amps": household.supply_of(vehicle).vehicle_amps(vehicle.vehicle_id, now),
        "has_current": household.supply.current_entity(vehicle) is not None,
        "control": vehicle.decision.control,
        "control_source": vehicle.control,
        # What paused the car, when it was the backup (the other of the car and the charger).
        "paused_by": vehicle.paused_by,
        "control_backup": len(household.control_sources(vehicle)) > 1,
        # The car's charger is found each time; "charger" below is the one it is at now.
        "finds_charger": household.pairing.floats(vehicle),
        "site": site.site_id if (site := household.pairing.vehicle_site(vehicle)) else None,
        "control_error": vehicle.control_error,
        # A command that failed once or twice is tried again by itself: when, until it counts as a problem.
        "control_retry": vehicle.retry_after.isoformat()
        if vehicle.retry_after and vehicle.control_error and 0 < vehicle.fail_count < CONTROL_FAILS_ISSUE
        else None,
        "problem": vehicle.problem,
        "mode": vehicle.mode,
        "soc": _r(vehicle.current_soc, 1),
        "soc_source": "sensor" if vehicle.has_soc_sensor else "manual",
        "target": _r(vehicle.target, 1),
        "target_editable": target_entity is None or target_entity.split(".", 1)[0] in ("number", "input_number"),
        # The car's own charge limit, when it has one: it stops there, whatever the plan says.
        "car_limit": _r(vehicle.target_from_car, 1) if target_entity else None,
        "day_target": vehicle.day_target,
        "capacity": vehicle.capacity,
        "power": household.vehicle_power(vehicle),
        **household.charging_figures(vehicle),
        "resumes": vehicle.learned.resumes,
        "curve": {key: round(value, 1) for key, value in vehicle.learned.curve.items()},
        "margin": vehicle.learned.margin,
        "receipt": vehicle.last_receipt,
        "session": session_state(vehicle, now),
        "connected": vehicle.connected,
        "home": vehicle.home,
        "charging": vehicle.charging,
        "charger": {"id": charger.charger_id, "name": charger.name} if charger else None,
        "deadline": vehicle.deadline.isoformat() if vehicle.deadline else None,
        "calendar": None
        if vehicle.calendar_event is None
        else {
            "summary": vehicle.calendar_summary,
            "start": vehicle.calendar_event.isoformat(),
            "target": vehicle.calendar_target,
        },
        "settings": dict(vehicle.settings),
        "plan": plan_state(vehicle.plan),
        "plan_error": vehicle.plan_error,
        "month": vehicle.month(now),
        "months": vehicle.months,
        "history": vehicle.history[:60],
    }


def guest_state(household: Household, guest: GuestSession) -> dict[str, Any]:
    now = dt_util.now()
    results = guest.results
    progress = guest.progress(now)
    charger = guest.charger
    return {
        "status": guest.status(now),
        "error": guest.error,
        "error_detail": guest.error_detail,
        "charge_now": guest.is_charge_now(now),
        "control": guest.charger_control(now),
        "release": guest.release_info(now),
        "plan_locked": guest.is_plan_locked(now),
        "inputs": dict(guest.inputs),
        "charger": {"id": charger.charger_id, "name": charger.name, "power": charger.power} if charger else None,
        "car": {
            "brand": results.get("car_brand"),
            "model": results.get("car_model"),
            "variant": results.get("car_variant"),
            "battery": results.get("car_battery_capacity"),
            "model_year": results.get("model_year"),
            "match_score": results.get("match_score"),
            "looked_up": results.get("last_lookup"),
        },
        "plan": {
            "segments": serialize_segments(guest.segments),
            "mode": results.get("plan_mode"),
            "speed": results.get("charging_speed"),
            "minutes": results.get("charge_time"),
            "cost": results.get("charge_costs"),
            "energy": results.get("energy"),
            "savings": results.get("savings"),
            "charge_now_cost": results.get("charge_now_cost"),
            "average_price": results.get("average_price"),
            "calculated": results.get("last_calculation"),
            "info": guest.plan_info,
            "measured_energy": results.get("measured_energy"),
            "measured_cost": results.get("measured_cost"),
            "progress": None
            if progress is None
            else {
                "soc": round(progress.soc, 1),
                "source": progress.source,
                "planned_soc": round(progress.planned_soc, 1),
                "behind_plan": progress.behind_plan,
            },
        },
        "lookup": bool(household.motorapi_key),
        "energy_entity": guest.energy_entity,
        "service_health": dict(guest.service_health),
        "history": guest.history,
    }


def _notify_name(hass: HomeAssistant, service: str) -> str:
    """A phone's name for a notify action: its device's name, else the action's own."""
    name = service.removeprefix("notify.")
    if name.startswith("mobile_app_"):
        for entry in hass.config_entries.async_entries("mobile_app"):
            device_name = str(entry.data.get("device_name") or entry.title or "")
            if device_name and slugify(device_name) == name.removeprefix("mobile_app_"):
                return entry.title or device_name
        name = name.removeprefix("mobile_app_")
    return name.replace("_", " ").strip().capitalize()


def panel_state(hass: HomeAssistant, household: Household) -> dict[str, Any]:
    """Everything the panel shows."""
    now = dt_util.now()
    slots = household.visible_slots(household.price_slots(now))
    vehicles = sorted(household.vehicles.values(), key=lambda vehicle: vehicle.name.casefold())
    chargers = []
    pairing = household.pairing
    for charger in household.chargers.values():
        control, holder = household.charger_control(charger.charger_id)
        site = pairing.site_of(charger)
        occupant = pairing.occupant(charger)
        unknown = pairing.unknown(charger)
        chargers.append(
            {
                "id": charger.charger_id,
                "name": charger.name,
                "power": charger.power,
                "control": control,
                "holder": holder,
                "connected": charger.connected,
                "site": site.site_id,
                # Who is at it: a car's id or "guest"; with ``unknown`` a car is plugged in, and
                # ``choices`` are the cars it can be, the likeliest first.
                "occupant": occupant,
                "found_by": charger.found_by if charger.occupant is not None else None,
                "unknown": unknown,
                "choices": pairing.choices(charger) if unknown else [],
                "has_plug_sensor": charger.connected_entity is not None,
                "has_switch": charger.switch_entity is not None,
                "has_meter": charger.energy_entity is not None,
                "image": household.image_url(charger.charger_id),
                "image_original": household.original_image_url(charger.charger_id),
                **panel_info(charger.config),
            }
        )
    return {
        "entry_id": household.config_entry.entry_id,
        "title": household.config_entry.title,
        "now": now.isoformat(),
        "currency": household.currency,
        "prices": [{"start": s.start.isoformat(), "end": s.end.isoformat(), "price": s.price} for s in slots],
        "price_issue": price_issue(household.price_slots(now), now),
        "supply": household.supply.state(now),
        # The household's places, the home first: each with its own supply, sun and house.
        "sites": [
            {
                "id": site.site_id,
                "name": site.name,
                "home": site.home,
                "zone": site.zone,
                "parts": sorted(site.parts),
                "supply": household.supplies[site.site_id].state(now),
                "solar": household.solars[site.site_id].state(now),
                "energy": household.homes[site.site_id].state(now),
            }
            for site in household.sites.values()
        ],
        "solar": household.solar.state(now),
        "heat_pump": household.supply.heat_pump_state(now),
        "home": household.home.state(now),
        "vehicles": [vehicle_state(household, vehicle) for vehicle in vehicles],
        "chargers": chargers,
        "guest": guest_state(household, household.guest),
        "settings": dict(household.settings),
        "layout": household.layout,
        "config": {
            "price_entity": household.price_entity,
            "notify": household.notify_services,
            "notify_names": {service: _notify_name(hass, service) for service in household.notify_services},
            "update_widgets": bool(household.config.get("update_widgets")),
        },
    }


LISTS = ("vehicles", "chargers", "sites")


def state_patch(old: dict[str, Any], new: dict[str, Any]) -> dict[str, Any]:
    """What changed from one panel state to the next: {"patch": {key: value}, "items": {list: {id: item}}}.

    The parts that are the same are left out. In the lists of cars and chargers
    only the ones that changed are sent, as long as the list has the same ones
    in the same order.
    """
    patch: dict[str, Any] = {}
    items: dict[str, dict[str, Any]] = {}
    for key, value in new.items():
        before = old.get(key)
        if before == value:
            continue
        if key in LISTS and before is not None and [item["id"] for item in before] == [item["id"] for item in value]:
            items[key] = {item["id"]: item for item, was in zip(value, before, strict=True) if item != was}
        else:
            patch[key] = value
    gone = [key for key in old if key not in new]
    out: dict[str, Any] = {"patch": patch}
    if items:
        out["items"] = items
    if gone:
        out["gone"] = gone
    return out


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/subscribe", ENTRY: str, vol.Optional("changes", default=False): bool}
)
@websocket_api.async_response
@_errors
async def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Send the panel state now and whenever it changes.

    With ``changes``, the whole state comes first and after that only what
    changed (see ``state_patch``); nothing is sent when nothing but the time did.
    """
    household = _household(hass, msg)
    last: dict[str, Any] | None = None

    @callback
    def send() -> None:
        nonlocal last
        state = panel_state(hass, household)
        if not msg["changes"] or last is None:
            last = state
            connection.send_message(websocket_api.event_message(msg["id"], state))
            return
        changed = state_patch(last, state)
        last = state
        if set(changed["patch"]) <= {"now"} and len(changed) == 1:
            return
        connection.send_message(websocket_api.event_message(msg["id"], changed))

    @callback
    def reloaded() -> None:
        # A reload (a car added, options changed) makes a new household; the panel subscribes again.
        connection.send_message(websocket_api.event_message(msg["id"], {"reload": True}))

    connection.subscriptions[msg["id"]] = household.async_add_listener(send)
    household.config_entry.async_on_unload(reloaded)
    connection.send_result(msg["id"])
    send()


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/state", ENTRY: str})
@websocket_api.async_response
@_errors
async def ws_state(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], panel_state(hass, _household(hass, msg)))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/vehicle_set",
        ENTRY: str,
        vol.Required("vehicle_id"): str,
        vol.Required("settings"): VEHICLE_SCHEMA,
    }
)
@websocket_api.async_response
@_errors
async def ws_vehicle_set(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    household = _household(hass, msg)
    _vehicle(household, msg["vehicle_id"])
    await household.async_set_vehicle(msg["vehicle_id"], msg["settings"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/vehicle_preview",
        ENTRY: str,
        vol.Required("vehicle_id"): str,
        vol.Optional("settings", default={}): VEHICLE_SCHEMA,
    }
)
@websocket_api.async_response
@_errors
async def ws_vehicle_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The plan for settings being changed, without storing anything."""
    household = _household(hass, msg)
    vehicle = _vehicle(household, msg["vehicle_id"])
    trial = Vehicle(vehicle.vehicle_id, vehicle.name, dict(vehicle.config), {**vehicle.settings, **msg["settings"]})
    trial.soc, trial.connected, trial.home = vehicle.soc, vehicle.connected, vehicle.home
    trial.charging = vehicle.charging
    trial.calendar_event, trial.calendar_target = vehicle.calendar_event, vehicle.calendar_target
    trial.target_from_car = (
        float(msg["settings"][SET_TARGET_SOC])
        if SET_TARGET_SOC in msg["settings"] and vehicle.target_entity
        else vehicle.target_from_car
    )
    now = dt_util.now()
    household.plan_one(trial, now, household.blocked_for(vehicle, now))
    connection.send_result(
        msg["id"],
        {
            "plan": plan_state(trial.plan),
            "error": trial.plan_error,
            "deadline": trial.deadline.isoformat() if trial.deadline else None,
        },
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/guest_set", ENTRY: str, vol.Required("inputs"): GUEST_SCHEMA}
)
@websocket_api.async_response
@_errors
async def ws_guest_set(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    guest = _household(hass, msg).guest
    for key, value in msg["inputs"].items():
        await guest.async_set_input(key, value)
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/guest_preview", ENTRY: str, vol.Optional("inputs", default={}): GUEST_SCHEMA}
)
@websocket_api.async_response
@_errors
async def ws_guest_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    guest = _household(hass, msg).guest
    try:
        plan, _slots = guest.make_plan({**guest.inputs, **msg["inputs"]})
    except PlanError as err:
        connection.send_result(msg["id"], {"error": err.key})
        return
    connection.send_result(
        msg["id"],
        {
            "segments": serialize_segments(plan.segments),
            "mode": plan.mode,
            "cost": round(plan.cost, 2),
            "energy": round(plan.need.grid_kwh, 2),
            "minutes": plan.need.minutes,
            "speed": round(plan.need.speed_pct_per_hour, 1),
            "savings": None if plan.savings is None else round(plan.savings, 2),
            "charge_now_cost": None if plan.charge_now_cost is None else round(plan.charge_now_cost, 2),
        },
    )


def _guest_action(name: str, run: Callable[[GuestSession], Awaitable[None]]) -> Any:
    @websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/{name}", ENTRY: str})
    @websocket_api.async_response
    @_errors
    async def handler(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        await run(_household(hass, msg).guest)
        connection.send_result(msg["id"])

    return handler


ws_guest_lookup = _guest_action("guest_lookup", lambda guest: guest.async_lookup())
ws_guest_plan = _guest_action("guest_plan", lambda guest: guest.async_calculate())
ws_guest_new = _guest_action("guest_new", lambda guest: guest.async_new_guest())
ws_guest_charge_now = _guest_action("guest_charge_now", lambda guest: guest.async_charge_now())
ws_guest_stop = _guest_action("guest_stop", lambda guest: guest.async_stop_charging())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/delete_history",
        ENTRY: str,
        vol.Optional("vehicle_id"): vol.Any(None, str),
        vol.Optional("history_id"): vol.Any(None, str),
    }
)
@websocket_api.async_response
@_errors
async def ws_delete_history(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete one history entry, or all of them, of the guest or a car."""
    household = _household(hass, msg)
    history_id = msg.get("history_id")
    if vehicle_id := msg.get("vehicle_id"):
        vehicle = _vehicle(household, vehicle_id)
        vehicle.history = [] if history_id is None else [e for e in vehicle.history if e.get("id") != history_id]
        household.async_save()
        household.async_update_listeners()
    else:
        await household.guest.async_delete_history(history_id)
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/settings", ENTRY: str, vol.Required("settings"): SETTINGS_SCHEMA}
)
@websocket_api.async_response
@_errors
async def ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    await _household(hass, msg).async_update_settings(msg["settings"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/history",
        ENTRY: str,
        vol.Required("period"): vol.In(["day", "week", "month", "year"]),
        vol.Required("start"): str,
        vol.Required("end"): str,
    }
)
@websocket_api.async_response
@_errors
async def ws_history(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """The whole house from Home Assistant's statistics: what it bought in each hour, day or month."""
    start = dt_util.parse_datetime(msg["start"])
    end = dt_util.parse_datetime(msg["end"])
    if start is None or end is None or end <= start:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="bad_period")
    result = await _household(hass, msg).home.async_history(msg["period"], start, end)
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/charger_occupant",
        ENTRY: str,
        vol.Required("charger_id"): str,
        # A car's id, "guest", or None to let EV Planner find the car again.
        vol.Required("occupant"): vol.Any(None, str),
    }
)
@websocket_api.async_response
@_errors
async def ws_charger_occupant(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The household says which car is at a charger."""
    household = _household(hass, msg)
    who = msg["occupant"]
    if msg["charger_id"] not in household.chargers or (
        who is not None and who != OCCUPANT_GUEST and who not in household.vehicles
    ):
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="car_not_found")
    await household.pairing.async_set(msg["charger_id"], who)
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/set_image",
        ENTRY: str,
        vol.Required("target_id"): str,
        vol.Required("image_id"): vol.Any(None, vol.Match(r"^[0-9a-f]{32}$")),
        vol.Optional("cutout", default=False): bool,
    }
)
@websocket_api.async_response
@_errors
async def ws_set_image(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Give a car or charger a photo uploaded with image_upload; answers with the photos nothing uses any more."""
    unused = _household(hass, msg).set_image(msg["target_id"], msg["image_id"], msg["cutout"])
    connection.send_result(msg["id"], {"unused": unused})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/restore_image",
        ENTRY: str,
        vol.Required("target_id"): str,
    }
)
@websocket_api.async_response
@_errors
async def ws_restore_image(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Undo a cut-out: back to the photo it was made from."""
    unused = _household(hass, msg).restore_image(msg["target_id"])
    connection.send_result(msg["id"], {"unused": unused})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/layout", ENTRY: str, vol.Required("layout"): dict})
@websocket_api.require_admin
@websocket_api.async_response
@_errors
async def ws_layout(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Where an administrator placed things in the house picture: the things, the wires, the panels, the labels."""
    household = _household(hass, msg)
    household.set_layout(msg["layout"])
    connection.send_result(msg["id"], {"layout": household.layout})


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    for command in (
        ws_subscribe,
        ws_state,
        ws_vehicle_set,
        ws_vehicle_preview,
        ws_guest_set,
        ws_guest_preview,
        ws_guest_lookup,
        ws_guest_plan,
        ws_guest_new,
        ws_guest_charge_now,
        ws_guest_stop,
        ws_set_image,
        ws_charger_occupant,
        ws_restore_image,
        ws_delete_history,
        ws_settings,
        ws_history,
        ws_layout,
    ):
        websocket_api.async_register_command(hass, command)
