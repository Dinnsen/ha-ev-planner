"""Constants for EV Planner."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

from homeassistant.const import Platform

DOMAIN: Final = "ev_planner"
DEFAULT_NAME: Final = "EV Planner"
MANUFACTURER: Final = "Dinnsen"
DOCS_URL: Final = "https://github.com/Dinnsen/ha-ev-planner"
PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.TEXT,
    Platform.TIME,
]
USER_AGENT: Final = "EVPlannerHomeAssistant/0.4.0 (+https://github.com/Dinnsen/ha-ev-planner)"

# ----------------------------------------------------------------------
# Config entry: the household

CONF_PRICE_ENTITY: Final = "price_entity"
CONF_CURRENCY: Final = "currency"
CONF_NOTIFY: Final = "notify_services"
CONF_MOTORAPI_KEY: Final = "motorapi_api_key"
CONF_COUNTRY: Final = "country"
CONF_PLATE_PROVIDER: Final = "plate_provider"

DEFAULT_PRICE_ENTITY: Final = "sensor.energi_data_service"
DEFAULT_CURRENCY: Final = "DKK"
CURRENCIES: Final = ["DKK", "EUR", "USD", "SEK", "NOK"]
COUNTRY_DENMARK: Final = "Denmark"
DEFAULT_COUNTRY: Final = COUNTRY_DENMARK
COUNTRIES: Final = [COUNTRY_DENMARK]
DEFAULT_PLATE_PROVIDER: Final = "motorapi_dk"

# Settings that belong to the connection (changed via reconfigure) as opposed
# to preferences (changed via options).
CONNECTION_KEYS: Final = (CONF_PRICE_ENTITY, CONF_COUNTRY, CONF_MOTORAPI_KEY)

# ----------------------------------------------------------------------
# Subentries

SUBENTRY_VEHICLE: Final = "vehicle"
SUBENTRY_CHARGER: Final = "charger"

# Vehicle
CONF_SOURCE: Final = "source"
SOURCE_MANUAL: Final = "manual"
CONF_IMPORTED_FROM: Final = "imported_from"
CONF_BATTERY_CAPACITY: Final = "battery_capacity"
CONF_CHARGE_POWER: Final = "charge_power"
CONF_SOC_ENTITY: Final = "soc_entity"
CONF_MODEL: Final = "model"
CONF_DEVICE: Final = "device"
CONF_CAPACITY_ENTITY: Final = "capacity_entity"
CONF_TARGET_ENTITY: Final = "target_entity"
CONF_CONNECTED_ENTITY: Final = "connected_entity"
CONF_UNPLUGGED_STATES: Final = "unplugged_states"
CONF_HOME_ENTITY: Final = "home_entity"
CONF_CHARGER: Final = "charger"
CONF_CONTROL: Final = "control"
CONF_CONTROL_ENTITY: Final = "control_entity"
CONF_CHARGING_ENTITY: Final = "charging_entity"
CONF_CALENDAR_ENTITY: Final = "calendar_entity"
CONF_CALENDAR_KEYWORD: Final = "calendar_keyword"

CONTROL_CAR: Final = "car"
CONTROL_CHARGER: Final = "charger"
CONTROL_NONE: Final = "none"
CONTROL_SOURCES: Final = [CONTROL_CAR, CONTROL_CHARGER, CONTROL_NONE]

DEFAULT_BATTERY_CAPACITY: Final = 75.0
DEFAULT_CHARGE_POWER: Final = 11.0
DEFAULT_UNPLUGGED_STATES: Final = ["off", "disconnected", "unplugged", "not_connected", "false"]
NO_CHARGER: Final = "none"

# Charger
CONF_POWER: Final = "power"
CONF_SWITCH_ENTITY: Final = "switch_entity"
CONF_ENERGY_ENTITY: Final = "energy_entity"

# ----------------------------------------------------------------------
# Vehicle settings (stored, edited with entities and in the panel)

SET_MODE: Final = "mode"
SET_TARGET_SOC: Final = "target_soc"
SET_MANUAL_SOC: Final = "manual_soc"
SET_MIN_SOC: Final = "min_soc"
SET_READY_BY: Final = "ready_by"
SET_USE_READY_BY: Final = "use_ready_by"
SET_SCHEDULE: Final = "schedule"
SET_EARLIEST_START: Final = "earliest_start"
SET_USE_EARLIEST_START: Final = "use_earliest_start"
SET_CONTINUOUS: Final = "continuous"
SET_CEILING_ENABLED: Final = "price_ceiling_enabled"
SET_CEILING: Final = "price_ceiling"
SET_LOW_PRICE_ENABLED: Final = "low_price_charging"
SET_LOW_PRICE_LEVEL: Final = "low_price_level"
SET_LOW_SOC_ENABLED: Final = "low_soc_charging"
SET_LOW_SOC_LEVEL: Final = "low_soc_level"
SET_OPPORTUNISTIC: Final = "opportunistic"
SET_OPPORTUNISTIC_LEVEL: Final = "opportunistic_level"
SET_FOLLOW_LEVEL: Final = "follow_level"
SET_KEEP_ON: Final = "keep_charger_on"
SET_EFFICIENCY: Final = "charging_efficiency"
SET_REMINDER: Final = "reminder"
SET_REMINDER_TIME: Final = "reminder_time"
SET_REMINDER_SOC: Final = "reminder_soc"
SET_REMINDER_PRICE_ENABLED: Final = "reminder_price_enabled"
SET_REMINDER_PRICE: Final = "reminder_price"
SET_REMINDER_DAYS: Final = "reminder_days"
SET_REMINDER_REPEAT: Final = "reminder_repeat"
SET_REMINDER_HORIZON: Final = "reminder_horizon"
SET_NOTIFY_TARGETS: Final = "notify_targets"
# A reminder is repeated at most this many times a day.
REMINDER_MAX_REPEATS: Final = 3
SET_LIVE: Final = "live_notification"
SET_NOTIFY_DONE: Final = "notify_done"

MODE_SMART: Final = "smart"
MODE_CHARGE_NOW: Final = "charge_now"
MODE_PAUSE: Final = "pause"
MODE_OFF: Final = "off"
MODES: Final = [MODE_SMART, MODE_CHARGE_NOW, MODE_PAUSE, MODE_OFF]

OPPORTUNISTIC_OFF: Final = "off"
OPPORTUNISTIC_LOWER: Final = "lower_ceiling"
OPPORTUNISTIC_FOLLOW: Final = "follow_end_price"
OPPORTUNISTIC_OPTIONS: Final = [OPPORTUNISTIC_OFF, OPPORTUNISTIC_LOWER, OPPORTUNISTIC_FOLLOW]

WEEKDAYS: Final = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
SCHEDULE_DEFAULT: Final = "default"
SCHEDULE_NONE: Final = "none"

DEFAULT_VEHICLE_SETTINGS: Final[dict[str, object]] = {
    SET_MODE: MODE_SMART,
    SET_TARGET_SOC: 80.0,
    SET_MANUAL_SOC: 50.0,
    SET_MIN_SOC: 0.0,
    SET_READY_BY: "07:00",
    SET_USE_READY_BY: True,
    SET_SCHEDULE: {},
    SET_EARLIEST_START: "18:00",
    SET_USE_EARLIEST_START: False,
    SET_CONTINUOUS: False,
    SET_CEILING_ENABLED: False,
    SET_CEILING: 2.0,
    SET_LOW_PRICE_ENABLED: False,
    SET_LOW_PRICE_LEVEL: 0.3,
    SET_LOW_SOC_ENABLED: False,
    SET_LOW_SOC_LEVEL: 20.0,
    SET_OPPORTUNISTIC: OPPORTUNISTIC_OFF,
    SET_OPPORTUNISTIC_LEVEL: 50.0,
    SET_FOLLOW_LEVEL: 90.0,
    SET_KEEP_ON: False,
    SET_EFFICIENCY: 90.0,
    SET_REMINDER: False,
    SET_REMINDER_TIME: "16:00",
    SET_REMINDER_SOC: 60.0,
    SET_REMINDER_PRICE_ENABLED: False,
    SET_REMINDER_PRICE: 2.2,
    SET_REMINDER_DAYS: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    SET_REMINDER_REPEAT: 0,
    SET_REMINDER_HORIZON: 24,
    SET_NOTIFY_TARGETS: [],
    SET_LIVE: False,
    SET_NOTIFY_DONE: False,
}

# ----------------------------------------------------------------------
# State

CONTROL_RELEASED: Final = "released"
CONTROL_CHARGE: Final = "charge"
CONTROL_PAUSE: Final = "pause"
CONTROL_OPTIONS: Final = [CONTROL_RELEASED, CONTROL_CHARGE, CONTROL_PAUSE]

# Why the vehicle should (not) charge now.
REASON_OFF: Final = "off"
REASON_PAUSED: Final = "paused"
REASON_UNPLUGGED: Final = "unplugged"
REASON_AWAY: Final = "away"
REASON_FULL: Final = "full"
REASON_CHARGE_NOW: Final = "charge_now"
REASON_LOW_SOC: Final = "low_soc"
REASON_LOW_PRICE: Final = "low_price"
REASON_PLANNED: Final = "planned"
REASON_KEEP_ON: Final = "keep_on"
REASON_WAITING: Final = "waiting"
REASON_CHARGER_BUSY: Final = "charger_busy"

STATUS_OFF: Final = "off"
STATUS_PAUSED: Final = "paused"
STATUS_UNPLUGGED: Final = "unplugged"
STATUS_PLANNED: Final = "planned"
STATUS_CHARGING: Final = "charging"
STATUS_CHARGING_NOW: Final = "charging_now"
STATUS_LOW_SOC: Final = "charging_low_soc"
STATUS_LOW_PRICE: Final = "charging_low_price"
STATUS_KEEPING_ON: Final = "keeping_on"
STATUS_COMPLETED: Final = "completed"
STATUS_NO_PLAN: Final = "no_plan"
STATUS_CHARGER_BUSY: Final = "charger_busy"
STATUS_NO_SOC: Final = "no_soc"
ERROR_INVALID_INPUT: Final = "invalid_input"
ERROR_LIMIT_NOT_ABOVE_SOC: Final = "limit_not_above_soc"
ERROR_NO_PRICE_DATA: Final = "no_price_data"
ERROR_NOT_ENOUGH_PRICES: Final = "not_enough_prices"
ERROR_NO_WINDOW: Final = "no_window"
VEHICLE_STATUS_OPTIONS: Final = [
    STATUS_OFF,
    STATUS_PAUSED,
    STATUS_UNPLUGGED,
    STATUS_PLANNED,
    STATUS_CHARGING,
    STATUS_CHARGING_NOW,
    STATUS_LOW_SOC,
    STATUS_LOW_PRICE,
    STATUS_KEEPING_ON,
    STATUS_COMPLETED,
    STATUS_NO_PLAN,
    STATUS_CHARGER_BUSY,
    STATUS_NO_SOC,
    ERROR_NO_PRICE_DATA,
    ERROR_NOT_ENOUGH_PRICES,
    ERROR_NO_WINDOW,
]

# Guest (EV Guest's statuses)
GUEST_READY: Final = "ready"
GUEST_PLANNED: Final = "planned"
GUEST_CHARGING: Final = "charging"
GUEST_COMPLETED: Final = "completed"
GUEST_STOPPED: Final = "stopped"
GUEST_STATUS_OPTIONS: Final = [
    GUEST_READY,
    GUEST_PLANNED,
    GUEST_CHARGING,
    GUEST_COMPLETED,
    GUEST_STOPPED,
    ERROR_INVALID_INPUT,
    ERROR_LIMIT_NOT_ABOVE_SOC,
    ERROR_NO_PRICE_DATA,
    ERROR_NOT_ENOUGH_PRICES,
    ERROR_NO_WINDOW,
]
ERROR_LICENSE_PLATE_REQUIRED: Final = "license_plate_required"
ERROR_MOTORAPI_KEY_MISSING: Final = "motorapi_key_missing"
ERROR_INVALID_API_KEY: Final = "invalid_api_key"
ERROR_VEHICLE_NOT_FOUND: Final = "vehicle_not_found"
ERROR_LOOKUP_FAILED: Final = "lookup_failed"

GUEST_PLATE: Final = "license_plate"
GUEST_SOC: Final = "soc"
GUEST_BATTERY: Final = "battery_capacity"
GUEST_POWER: Final = "charger_power"
GUEST_LIMIT: Final = "charge_limit"
GUEST_READY_BY: Final = "charge_completion_time"
GUEST_USE_READY_BY: Final = "use_completion_time"
GUEST_CONTINUOUS: Final = "continuous_charging_preferred"
GUEST_EFFICIENCY: Final = "charging_efficiency"
GUEST_CHARGER: Final = "charger"

RELEASE_PLAN_END: Final = "plan_end"
RELEASE_NEW_GUEST: Final = "new_guest"
RELEASE_UNPLUGGED: Final = "unplugged"
RELEASE_CLEARED: Final = "cleared"
RELEASE_STOPPED: Final = "stopped"

# ----------------------------------------------------------------------
# Timing

PLANNING_HORIZON: Final = timedelta(hours=48)
RECALCULATE_DELAY: Final = 1.0
METER_GRACE: Final = timedelta(minutes=10)
PROGRESS_INTERVAL: Final = timedelta(minutes=1)
UNPLUG_DELAY: Final = timedelta(minutes=1)
POST_PLAN_HOLD: Final = timedelta(hours=24)
VERIFY_DELAY: Final = timedelta(minutes=6)
CALENDAR_REFRESH: Final = timedelta(minutes=15)
CALENDAR_LOOKAHEAD: Final = timedelta(hours=36)
LIVE_MIN_INTERVAL: Final = timedelta(minutes=5)
WIDGET_MIN_INTERVAL: Final = timedelta(minutes=15)

# ----------------------------------------------------------------------
# Storage, actions, misc

STORAGE_VERSION: Final = 1
STORAGE_KEY: Final = f"{DOMAIN}.{{entry_id}}"
HISTORY_LIMIT: Final = 200

SERVICE_RECALCULATE: Final = "recalculate"
SERVICE_SET_MODE: Final = "set_mode"
SERVICE_GUEST_LOOKUP: Final = "guest_lookup"
SERVICE_GUEST_PLAN: Final = "guest_plan"
SERVICE_GUEST_CHARGE_NOW: Final = "guest_charge_now"
SERVICE_GUEST_STOP: Final = "guest_stop"
SERVICE_NEW_GUEST: Final = "new_guest"
ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"
ATTR_VEHICLE: Final = "vehicle"
ATTR_MODE: Final = "mode"

EVENT_NOTIFICATION_ACTION: Final = "mobile_app_notification_action"
ACTION_CHARGE_NOW: Final = "EV_PLANNER_CHARGE_NOW"
ACTION_FOLLOW_PLAN: Final = "EV_PLANNER_FOLLOW_PLAN"

ISSUE_PRICE_ENTITY_MISSING: Final = "price_entity_missing"
ISSUE_ENTITY_MISSING: Final = "entity_missing"

DATASET_CACHE_KEY: Final = f"{DOMAIN}_open_ev_data_cache"
DATASET_CACHE_TTL: Final = timedelta(hours=24)
MOTORAPI_BASE_URL: Final = "https://v1.motorapi.dk"
NHTSA_DECODE_URL: Final = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{vin}?format=json"
OPEN_EV_DATA_URL: Final = "https://raw.githubusercontent.com/KilowattApp/open-ev-data/main/data/ev-data.json"
OPEN_EV_DATA_FALLBACK_URL: Final = "https://raw.githubusercontent.com/KilowattApp/open-ev-data/master/data/ev-data.json"

REDACT_KEYS: Final = {CONF_MOTORAPI_KEY, "vin", GUEST_PLATE, "plate"}

ESC_DOMAIN: Final = "ev_smart_charging"
