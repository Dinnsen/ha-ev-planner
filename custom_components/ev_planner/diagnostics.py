"""Diagnostics for EV Planner."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import REDACT_KEYS
from .household import EVPlannerConfigEntry


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: EVPlannerConfigEntry) -> dict[str, Any]:
    household = entry.runtime_data
    now = dt_util.now()
    return {
        "entry": async_redact_data(dict(entry.data), REDACT_KEYS),
        "options": dict(entry.options),
        "price_slots": len(household.price_slots(now)),
        "vehicles": {
            vehicle_id: {
                "config": dict(vehicle.config),
                "settings": vehicle.settings,
                "soc": vehicle.current_soc,
                "target": vehicle.target,
                "connected": vehicle.connected,
                "home": vehicle.home,
                "charging": vehicle.charging,
                "status": vehicle.status(),
                "decision": {"control": vehicle.decision.control, "reason": vehicle.decision.reason},
                "deadline": vehicle.deadline.isoformat() if vehicle.deadline else None,
                "plan_error": vehicle.plan_error,
                "plan": None
                if vehicle.plan is None
                else {
                    "segments": [
                        {"start": seg["start"].isoformat(), "end": seg["end"].isoformat()}
                        for seg in vehicle.plan.segments
                    ],
                    "cost": vehicle.plan.cost,
                    "energy": vehicle.plan.energy,
                    "limited": vehicle.plan.limited,
                    "min_only": vehicle.plan.min_only,
                    "short": vehicle.plan.short,
                    "joined": vehicle.plan.joined,
                    "joined_extra": vehicle.plan.joined_extra,
                },
                "last_sent": vehicle.last_sent,
                "control_error": vehicle.control_error,
                "problem": vehicle.problem,
                "months": vehicle.months,
                "charging_figures": household.charging_figures(vehicle),
                "meter": vehicle.meter.to_dict(),
                "learned": vehicle.learned.to_dict(),
            }
            for vehicle_id, vehicle in household.vehicles.items()
        },
        "chargers": {
            cid: {"config": dict(c.config), "connected": c.connected} for cid, c in household.chargers.items()
        },
        "guest": async_redact_data(household.guest.to_store(), REDACT_KEYS),
        "guest_status": household.guest.status(now),
        "guest_control": household.guest.charger_control(now),
    }
