"""A car of the household: its settings, plan, decision and statistics.

Pure Python without Home Assistant imports. The household coordinator reads
the car's sensors, hands the values in, and acts on the decision.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime, time
from typing import Any
from uuid import uuid4

from .const import (
    CONF_BATTERY_CAPACITY,
    CONF_CALENDAR_ENTITY,
    CONF_CALENDAR_KEYWORD,
    CONF_CAPACITY_ENTITY,
    CONF_CHARGE_POWER,
    CONF_CHARGER,
    CONF_CHARGING_ENTITY,
    CONF_CONNECTED_ENTITY,
    CONF_CONTROL,
    CONF_CONTROL_ENTITY,
    CONF_HOME_ENTITY,
    CONF_SOC_ENTITY,
    CONF_TARGET_ENTITY,
    CONF_UNPLUGGED_STATES,
    CONTROL_CAR,
    CONTROL_CHARGE,
    CONTROL_CHARGER,
    CONTROL_NONE,
    CONTROL_RELEASED,
    DEFAULT_BATTERY_CAPACITY,
    DEFAULT_CHARGE_POWER,
    DEFAULT_UNPLUGGED_STATES,
    DEFAULT_VEHICLE_SETTINGS,
    HISTORY_LIMIT,
    MODE_CHARGE_NOW,
    MODE_OFF,
    MODE_PAUSE,
    NO_CHARGER,
    OPPORTUNISTIC_OFF,
    SET_CEILING,
    SET_CEILING_ENABLED,
    SET_CONTINUOUS,
    SET_EARLIEST_START,
    SET_EFFICIENCY,
    SET_FOLLOW_LEVEL,
    SET_KEEP_ON,
    SET_LOW_PRICE_ENABLED,
    SET_LOW_PRICE_LEVEL,
    SET_LOW_SOC_ENABLED,
    SET_LOW_SOC_LEVEL,
    SET_MANUAL_SOC,
    SET_MIN_SOC,
    SET_MODE,
    SET_NOTIFY_TARGETS,
    SET_OPPORTUNISTIC,
    SET_OPPORTUNISTIC_LEVEL,
    SET_READY_BY,
    SET_SCHEDULE,
    SET_TARGET_SOC,
    SET_USE_EARLIEST_START,
    SET_USE_READY_BY,
    STATUS_CHARGER_BUSY,
    STATUS_CHARGING,
    STATUS_CHARGING_NOW,
    STATUS_COMPLETED,
    STATUS_KEEPING_ON,
    STATUS_LOW_PRICE,
    STATUS_LOW_SOC,
    STATUS_NO_PLAN,
    STATUS_NO_SOC,
    STATUS_OFF,
    STATUS_PAUSED,
    STATUS_PLANNED,
    STATUS_UNPLUGGED,
)
from .rules import Decision, Rules, VehiclePlan, next_deadline, parse_hhmm

CHARGING_STATES = {"on", "charging", "true", "yes", "active"}
# A single charge level step above this is a glitch (or a car swap), not charging.
MAX_SOC_STEP = 60.0
MONTHS_KEPT = 24

REASON_STATUS = {
    "off": STATUS_OFF,
    "unplugged": STATUS_UNPLUGGED,
    "away": STATUS_UNPLUGGED,
    "paused": STATUS_PAUSED,
    "full": STATUS_COMPLETED,
    "charge_now": STATUS_CHARGING_NOW,
    "low_soc": STATUS_LOW_SOC,
    "low_price": STATUS_LOW_PRICE,
    "planned": STATUS_CHARGING,
    "keep_on": STATUS_KEEPING_ON,
    "charger_busy": STATUS_CHARGER_BUSY,
}


def to_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None  # NaN


def is_charging_state(state: str | None) -> bool | None:
    """Whether an entity state means "charging": on/charging, or a power above zero."""
    if state is None or state in ("unknown", "unavailable", ""):
        return None
    number = to_float(state)
    if number is not None:
        return number > 0.05
    return state.lower() in CHARGING_STATES


def month_key(moment: datetime) -> str:
    return moment.strftime("%Y-%m")


@dataclass(slots=True)
class Session:
    """A charge in progress, for history and notifications."""

    start: datetime
    start_soc: float | None
    energy: float = 0.0
    cost: float = 0.0
    reason: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "start": self.start.isoformat(),
            "start_soc": self.start_soc,
            "energy": self.energy,
            "cost": self.cost,
            "reason": self.reason,
        }

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> Session | None:
        try:
            start = datetime.fromisoformat(str(data["start"]))
        except (KeyError, ValueError):
            return None
        return cls(
            start=start,
            start_soc=to_float(data.get("start_soc")),
            energy=float(data.get("energy") or 0.0),
            cost=float(data.get("cost") or 0.0),
            reason=str(data.get("reason") or ""),
        )


@dataclass(slots=True)
class Vehicle:
    """One car, from a vehicle subentry."""

    vehicle_id: str
    name: str
    config: dict[str, Any]
    settings: dict[str, Any] = field(default_factory=dict)

    # Live values, read from the car's entities.
    soc: float | None = None
    target_from_car: float | None = None
    # Battery capacity in kWh as the car reports it, when it does.
    capacity_from_car: float | None = None
    connected: bool | None = None
    home: bool | None = None
    charging: bool | None = None

    # Planning
    plan: VehiclePlan | None = None
    plan_error: str | None = None
    deadline: datetime | None = None
    calendar_event: datetime | None = None
    calendar_target: float | None = None
    calendar_summary: str | None = None
    planned_at: datetime | None = None
    decision: Decision = field(default_factory=lambda: Decision(CONTROL_RELEASED, "off"))
    plan_done: bool = False

    # Control
    last_sent: str | None = None
    enforce_until: datetime | None = None
    control_error: str | None = None
    problem: bool = False
    verify_attempts: int = 0

    # Statistics
    session: Session | None = None
    months: dict[str, dict[str, float]] = field(default_factory=dict)
    history: list[dict[str, Any]] = field(default_factory=list)
    last_soc_seen: float | None = None
    last_rise: datetime | None = None

    # Notifications
    live_active: bool = False
    live_sent_at: datetime | None = None
    live_sent_soc: float | None = None
    live_sent_reason: str | None = None
    reminded_on: str | None = None
    # Reminders sent on ``reminded_on`` (0: checked, but not sent), and when the last one went.
    reminders_sent: int = 0
    reminded_at: datetime | None = None

    def __post_init__(self) -> None:
        imported = self.config.get("imported_settings")
        initial = dict(imported) if isinstance(imported, Mapping) else {}
        self.settings = {**DEFAULT_VEHICLE_SETTINGS, **initial, **(self.settings or {})}
        self.settings[SET_SCHEDULE] = dict(self.settings.get(SET_SCHEDULE) or {})

    # ------------------------------------------------------------------
    # Configuration

    @property
    def capacity(self) -> float:
        """Usable battery in kWh: the car's own figure when it has one."""
        if self.capacity_from_car is not None and self.capacity_from_car > 0:
            return self.capacity_from_car
        return to_float(self.config.get(CONF_BATTERY_CAPACITY)) or DEFAULT_BATTERY_CAPACITY

    @property
    def notify_to(self) -> list[str]:
        """The phones this car's messages go to; empty means all of the household's."""
        chosen = self.settings.get(SET_NOTIFY_TARGETS)
        return [str(item) for item in chosen] if isinstance(chosen, list) else []

    @property
    def capacity_entity(self) -> str | None:
        return self.config.get(CONF_CAPACITY_ENTITY) or None

    @property
    def configured_power(self) -> float:
        return to_float(self.config.get(CONF_CHARGE_POWER)) or DEFAULT_CHARGE_POWER

    @property
    def efficiency(self) -> float:
        value = to_float(self.settings.get(SET_EFFICIENCY)) or 90.0
        return min(1.0, max(0.5, value / 100))

    @property
    def soc_entity(self) -> str | None:
        return self.config.get(CONF_SOC_ENTITY) or None

    @property
    def target_entity(self) -> str | None:
        return self.config.get(CONF_TARGET_ENTITY) or None

    @property
    def connected_entity(self) -> str | None:
        return self.config.get(CONF_CONNECTED_ENTITY) or None

    @property
    def home_entity(self) -> str | None:
        return self.config.get(CONF_HOME_ENTITY) or None

    @property
    def charging_entity(self) -> str | None:
        return self.config.get(CONF_CHARGING_ENTITY) or None

    @property
    def calendar_entity(self) -> str | None:
        return self.config.get(CONF_CALENDAR_ENTITY) or None

    @property
    def calendar_keyword(self) -> str:
        return str(self.config.get(CONF_CALENDAR_KEYWORD) or "").strip()

    @property
    def charger_id(self) -> str | None:
        value = self.config.get(CONF_CHARGER)
        return None if value in (None, "", NO_CHARGER) else str(value)

    @property
    def control(self) -> str:
        value = self.config.get(CONF_CONTROL) or CONTROL_NONE
        return value if value in (CONTROL_CAR, CONTROL_CHARGER, CONTROL_NONE) else CONTROL_NONE

    @property
    def car_control_entity(self) -> str | None:
        return self.config.get(CONF_CONTROL_ENTITY) or None

    @property
    def unplugged_states(self) -> set[str]:
        raw = self.config.get(CONF_UNPLUGGED_STATES) or DEFAULT_UNPLUGGED_STATES
        if isinstance(raw, str):
            raw = raw.split(",")
        return {str(item).strip().lower() for item in raw if str(item).strip()}

    def watched_entities(self) -> list[str]:
        return [
            entity
            for entity in (
                self.soc_entity,
                self.target_entity,
                self.capacity_entity,
                self.connected_entity,
                self.home_entity,
                self.charging_entity,
                self.car_control_entity,
            )
            if entity
        ]

    # ------------------------------------------------------------------
    # Live values

    def read_connected(self, state: str | None) -> bool | None:
        if state is None or state in ("unknown", "unavailable"):
            return None
        return state.strip().lower() not in self.unplugged_states

    @staticmethod
    def read_home(state: str | None) -> bool | None:
        if state is None or state in ("unknown", "unavailable"):
            return None
        return state.lower() in ("home", "on", "true")

    @property
    def at_home(self) -> bool | None:
        """Whether EV Planner may act on the car where it is.

        None without a home entity (the car is taken to be at home). With
        one, an unknown location counts as away: better to leave a charge
        on the road alone than to stop it.
        """
        if self.home_entity is None:
            return self.home
        return self.home is True

    @property
    def has_soc_sensor(self) -> bool:
        return self.soc_entity is not None

    @property
    def current_soc(self) -> float | None:
        """The charge level to plan from: the car's sensor, or the manual value."""
        if self.has_soc_sensor:
            return self.soc
        return to_float(self.settings.get(SET_MANUAL_SOC))

    @property
    def target(self) -> float:
        """The charge level to aim for: a calendar trip, the car's own limit, or the setting."""
        if self.calendar_target is not None:
            return self.calendar_target
        if self.target_entity and self.target_from_car is not None:
            return self.target_from_car
        return to_float(self.settings.get(SET_TARGET_SOC)) or 80.0

    @property
    def mode(self) -> str:
        return str(self.settings.get(SET_MODE) or "smart")

    # ------------------------------------------------------------------
    # Rules and deadline

    def rules(self) -> Rules:
        s = self.settings
        return Rules(
            min_soc=to_float(s.get(SET_MIN_SOC)) or 0.0,
            ceiling=to_float(s.get(SET_CEILING)) if s.get(SET_CEILING_ENABLED) else None,
            opportunistic=str(s.get(SET_OPPORTUNISTIC) or OPPORTUNISTIC_OFF),
            opportunistic_level=to_float(s.get(SET_OPPORTUNISTIC_LEVEL)) or 50.0,
            follow_level=to_float(s.get(SET_FOLLOW_LEVEL)) or 90.0,
            low_price_level=to_float(s.get(SET_LOW_PRICE_LEVEL)) if s.get(SET_LOW_PRICE_ENABLED) else None,
            low_soc_level=to_float(s.get(SET_LOW_SOC_LEVEL)) if s.get(SET_LOW_SOC_ENABLED) else None,
            keep_on=bool(s.get(SET_KEEP_ON)),
        )

    @property
    def ready_by(self) -> time | None:
        return parse_hhmm(self.settings.get(SET_READY_BY))

    @property
    def earliest_start(self) -> time | None:
        if not self.settings.get(SET_USE_EARLIEST_START):
            return None
        return parse_hhmm(self.settings.get(SET_EARLIEST_START))

    @property
    def continuous(self) -> bool:
        return bool(self.settings.get(SET_CONTINUOUS))

    def next_deadline(self, now: datetime) -> datetime | None:
        return next_deadline(
            now,
            default=self.ready_by,
            use_default=bool(self.settings.get(SET_USE_READY_BY, True)),
            schedule=self.settings.get(SET_SCHEDULE) or {},
            event=self.calendar_event,
        )

    # ------------------------------------------------------------------
    # Status

    def status(self) -> str:
        """The vehicle status sensor."""
        decision = self.decision
        if decision.reason in REASON_STATUS and decision.reason not in ("unplugged", "away"):
            return REASON_STATUS[decision.reason]
        if decision.reason in ("unplugged", "away"):
            return STATUS_UNPLUGGED
        # Waiting: a plan ahead, or why there is none.
        if self.current_soc is None:
            return STATUS_NO_SOC
        if self.plan is not None and self.plan.segments:
            return STATUS_PLANNED
        if self.plan_error == "limit_not_above_soc":
            return STATUS_COMPLETED
        if self.plan_error in ("no_price_data", "not_enough_prices", "no_window"):
            return self.plan_error
        return STATUS_NO_PLAN

    @property
    def charge_now(self) -> bool:
        return self.decision.control == CONTROL_CHARGE

    def summary(self, now: datetime, fmt_time: Any, fmt_money: Any) -> str:
        """A short line for widgets, e.g. ``03.00-04.10 · 12,45 kr.``."""
        status = self.status()
        if status in (STATUS_OFF, STATUS_PAUSED, STATUS_COMPLETED, STATUS_NO_SOC):
            return status
        plan = self.plan
        if plan is not None and plan.segments and plan.end is not None and plan.end > now:
            start = plan.start or now
            return f"{fmt_time(max(start, now))}-{fmt_time(plan.end)} · {fmt_money(plan.cost)}"
        return status

    # ------------------------------------------------------------------
    # Mode helpers

    def mode_after_charge_now(self) -> str | None:
        """Lad nu falls back to Smart when the car is full or unplugged."""
        if self.mode != MODE_CHARGE_NOW:
            return None
        soc = self.current_soc
        if self.connected is False or (soc is not None and soc >= self.target - 1e-9):
            return "smart"
        return None

    @property
    def controls_charging(self) -> bool:
        return self.control != CONTROL_NONE and self.mode not in (MODE_OFF,)

    @property
    def paused_by_user(self) -> bool:
        return self.mode == MODE_PAUSE

    # ------------------------------------------------------------------
    # Statistics

    def add_energy(self, now: datetime, kwh: float, price: float | None) -> None:
        """Count energy from the grid for the running session and the month."""
        if kwh <= 0:
            return
        cost = kwh * price if price is not None else 0.0
        month = self.months.setdefault(month_key(now), {"energy": 0.0, "cost": 0.0, "sessions": 0.0})
        month["energy"] = round(month["energy"] + kwh, 4)
        month["cost"] = round(month["cost"] + cost, 4)
        if self.session is not None:
            self.session.energy += kwh
            self.session.cost += cost
        for key in sorted(self.months)[:-MONTHS_KEPT]:
            self.months.pop(key, None)

    def soc_energy(self, old: float | None, new: float | None) -> float:
        """Grid energy implied by a rise in the charge level."""
        if old is None or new is None:
            return 0.0
        step = new - old
        if step <= 0 or step > MAX_SOC_STEP:
            return 0.0
        return step / 100 * self.capacity / self.efficiency

    def start_session(self, now: datetime, reason: str) -> None:
        if self.session is None:
            self.session = Session(start=now, start_soc=self.current_soc, reason=reason)

    def end_session(self, now: datetime) -> dict[str, Any] | None:
        """Close the session; returns the history entry when something was charged."""
        session, self.session = self.session, None
        if session is None or session.energy < 0.1:
            return None
        month = self.months.setdefault(month_key(session.start), {"energy": 0.0, "cost": 0.0, "sessions": 0.0})
        month["sessions"] = month.get("sessions", 0.0) + 1
        entry = {
            "id": uuid4().hex,
            "start": session.start.isoformat(),
            "end": now.isoformat(),
            "energy": round(session.energy, 2),
            "cost": round(session.cost, 2),
            "start_soc": session.start_soc,
            "end_soc": self.current_soc,
            "reason": session.reason,
        }
        self.history = [entry, *self.history][:HISTORY_LIMIT]
        return entry

    def month(self, now: datetime) -> dict[str, float]:
        return self.months.get(month_key(now), {"energy": 0.0, "cost": 0.0, "sessions": 0.0})

    # ------------------------------------------------------------------
    # Storage

    def to_store(self) -> dict[str, Any]:
        return {
            "settings": self.settings,
            "months": self.months,
            "history": self.history,
            "session": self.session.to_dict() if self.session else None,
            "last_sent": self.last_sent,
            "last_soc_seen": self.last_soc_seen,
            "live_active": self.live_active,
            "reminded_on": self.reminded_on,
            "reminders_sent": self.reminders_sent,
            "reminded_at": self.reminded_at.isoformat() if self.reminded_at else None,
            "plan_done": self.plan_done,
        }

    def load(self, data: Mapping[str, Any] | None) -> None:
        if not isinstance(data, Mapping):
            return
        settings = data.get("settings")
        if isinstance(settings, Mapping):
            self.settings = {**DEFAULT_VEHICLE_SETTINGS, **settings}
            self.settings[SET_SCHEDULE] = dict(self.settings.get(SET_SCHEDULE) or {})
        months = data.get("months")
        if isinstance(months, Mapping):
            self.months = {
                str(key): {k: float(v) for k, v in value.items() if isinstance(v, int | float)}
                for key, value in months.items()
                if isinstance(value, Mapping)
            }
        history = data.get("history")
        if isinstance(history, list):
            self.history = [item for item in history if isinstance(item, dict)][:HISTORY_LIMIT]
        session = data.get("session")
        self.session = Session.from_dict(session) if isinstance(session, Mapping) else None
        last_sent = data.get("last_sent")
        self.last_sent = last_sent if last_sent in (CONTROL_CHARGE, "pause") else None
        self.last_soc_seen = to_float(data.get("last_soc_seen"))
        self.live_active = bool(data.get("live_active"))
        reminded = data.get("reminded_on")
        self.reminded_on = str(reminded) if reminded else None
        sent = data.get("reminders_sent")
        self.reminders_sent = int(sent) if isinstance(sent, int) else (1 if self.reminded_on else 0)
        at = data.get("reminded_at")
        self.reminded_at = datetime.fromisoformat(at) if isinstance(at, str) else None
        self.plan_done = bool(data.get("plan_done"))
