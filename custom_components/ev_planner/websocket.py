"""Websocket commands used by the EV Planner panel."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
import functools
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    GUEST_BATTERY,
    GUEST_CHARGER,
    GUEST_CONTINUOUS,
    GUEST_EFFICIENCY,
    GUEST_LIMIT,
    GUEST_PLATE,
    GUEST_POWER,
    GUEST_READY_BY,
    GUEST_SOC,
    GUEST_USE_READY_BY,
    MODES,
    OPPORTUNISTIC_OPTIONS,
    SCHEDULE_DEFAULT,
    SCHEDULE_NONE,
    SET_CEILING,
    SET_CEILING_ENABLED,
    SET_CONTINUOUS,
    SET_EARLIEST_START,
    SET_EFFICIENCY,
    SET_FOLLOW_LEVEL,
    SET_KEEP_ON,
    SET_LIVE,
    SET_LOW_PRICE_ENABLED,
    SET_LOW_PRICE_LEVEL,
    SET_LOW_SOC_ENABLED,
    SET_LOW_SOC_LEVEL,
    SET_MANUAL_SOC,
    SET_MIN_SOC,
    SET_MODE,
    SET_NOTIFY_DONE,
    SET_OPPORTUNISTIC,
    SET_OPPORTUNISTIC_LEVEL,
    SET_READY_BY,
    SET_REMINDER,
    SET_REMINDER_SOC,
    SET_REMINDER_TIME,
    SET_SCHEDULE,
    SET_TARGET_SOC,
    SET_USE_EARLIEST_START,
    SET_USE_READY_BY,
    WEEKDAYS,
)
from .guest import GuestSession, serialize_segments
from .household import EVPlannerConfigEntry, Household
from .planner import PlanError
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
        vol.Optional(SET_CEILING_ENABLED): cv.boolean,
        vol.Optional(SET_CEILING): PRICE,
        vol.Optional(SET_LOW_PRICE_ENABLED): cv.boolean,
        vol.Optional(SET_LOW_PRICE_LEVEL): PRICE,
        vol.Optional(SET_LOW_SOC_ENABLED): cv.boolean,
        vol.Optional(SET_LOW_SOC_LEVEL): PERCENT,
        vol.Optional(SET_OPPORTUNISTIC): vol.In(OPPORTUNISTIC_OPTIONS),
        vol.Optional(SET_OPPORTUNISTIC_LEVEL): PERCENT,
        vol.Optional(SET_FOLLOW_LEVEL): vol.All(vol.Coerce(float), vol.Range(min=0, max=200)),
        vol.Optional(SET_KEEP_ON): cv.boolean,
        vol.Optional(SET_EFFICIENCY): vol.All(vol.Coerce(float), vol.Range(min=50, max=100)),
        vol.Optional(SET_REMINDER): cv.boolean,
        vol.Optional(SET_REMINDER_TIME): _hhmm,
        vol.Optional(SET_REMINDER_SOC): PERCENT,
        vol.Optional(SET_LIVE): cv.boolean,
        vol.Optional(SET_NOTIFY_DONE): cv.boolean,
    }
)
GUEST_SCHEMA = vol.Schema(
    {
        vol.Optional(GUEST_PLATE): vol.All(cv.string, vol.Length(max=16)),
        vol.Optional(GUEST_SOC): PERCENT,
        vol.Optional(GUEST_LIMIT): PERCENT,
        vol.Optional(GUEST_BATTERY): vol.All(vol.Coerce(float), vol.Range(min=1, max=300)),
        vol.Optional(GUEST_POWER): vol.All(vol.Coerce(float), vol.Range(min=0.1, max=350)),
        vol.Optional(GUEST_EFFICIENCY): vol.All(vol.Coerce(float), vol.Range(min=50, max=100)),
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
    }


def vehicle_state(household: Household, vehicle: Vehicle) -> dict[str, Any]:
    now = dt_util.now()
    charger = household.chargers.get(vehicle.charger_id or "")
    target_entity = vehicle.target_entity
    return {
        "id": vehicle.vehicle_id,
        "name": vehicle.name,
        "status": vehicle.status(),
        "reason": vehicle.decision.reason,
        "control": vehicle.decision.control,
        "control_source": vehicle.control,
        "control_error": vehicle.control_error,
        "problem": vehicle.problem,
        "mode": vehicle.mode,
        "soc": _r(vehicle.current_soc, 1),
        "soc_source": "sensor" if vehicle.has_soc_sensor else "manual",
        "target": _r(vehicle.target, 1),
        "target_editable": target_entity is None or target_entity.split(".", 1)[0] in ("number", "input_number"),
        "capacity": vehicle.capacity,
        "power": household.vehicle_power(vehicle),
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


def panel_state(hass: HomeAssistant, household: Household) -> dict[str, Any]:
    """Everything the panel shows."""
    now = dt_util.now()
    slots = household.visible_slots(household.price_slots(now))
    vehicles = sorted(household.vehicles.values(), key=lambda vehicle: vehicle.name.casefold())
    chargers = []
    for charger in household.chargers.values():
        control, holder = household.charger_control(charger.charger_id)
        chargers.append(
            {
                "id": charger.charger_id,
                "name": charger.name,
                "power": charger.power,
                "control": control,
                "holder": holder,
                "connected": charger.connected,
                "has_switch": charger.switch_entity is not None,
                "has_meter": charger.energy_entity is not None,
            }
        )
    return {
        "entry_id": household.config_entry.entry_id,
        "title": household.config_entry.title,
        "now": now.isoformat(),
        "currency": household.currency,
        "prices": [{"start": s.start.isoformat(), "end": s.end.isoformat(), "price": s.price} for s in slots],
        "vehicles": [vehicle_state(household, vehicle) for vehicle in vehicles],
        "chargers": chargers,
        "guest": guest_state(household, household.guest),
        "settings": dict(household.settings),
        "config": {
            "price_entity": household.price_entity,
            "notify": household.notify_services,
            "update_widgets": bool(household.config.get("update_widgets")),
        },
    }


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe", ENTRY: str})
@websocket_api.async_response
@_errors
async def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Send the panel state now and whenever it changes."""
    household = _household(hass, msg)

    @callback
    def send() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], panel_state(hass, household)))

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
        ws_delete_history,
        ws_settings,
    ):
        websocket_api.async_register_command(hass, command)
