"""Constants for EV Planner."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

from homeassistant.const import Platform

DOMAIN: Final = "ev_household_planner"
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
USER_AGENT: Final = "EVPlannerHomeAssistant (+https://github.com/Dinnsen/ha-ev-planner)"

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
# Any other country: everything works, except looking up guest cars by license plate.
COUNTRY_OTHER: Final = "other"
DEFAULT_COUNTRY: Final = COUNTRY_DENMARK
COUNTRIES: Final = [COUNTRY_DENMARK, COUNTRY_OTHER]
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
# The car's own charging power sensor (kW), to learn the power and count the energy.
CONF_POWER_ENTITY: Final = "power_entity"
# The charging speed (% per hour) of a car imported from EV Smart Charging.
CONF_IMPORTED_SPEED: Final = "imported_speed"
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
# A number entity that sets the charging current (A): on the car (Tesla's charging amps) or the charger.
CONF_CURRENT_ENTITY: Final = "current_entity"
# Shared supply (options): the most the house may draw per phase, its phases, the meter and,
# without a meter, what the house is expected to draw.
CONF_SUPPLY_LIMIT: Final = "supply_limit"
CONF_SUPPLY_PHASES: Final = "supply_phases"
# Added to every price (per kWh), for a price sensor without tariffs and taxes.
CONF_PRICE_ADD: Final = "price_add"
# What a kWh sent to the grid pays: a fixed price, or a sensor with the price now. A kWh of the
# sun in a car costs that much, as it was not sold.
CONF_EXPORT_PRICE: Final = "export_price"
CONF_EXPORT_PRICE_ENTITY: Final = "export_price_entity"
CONF_SUPPLY_METER: Final = "supply_meter"
CONF_SUPPLY_RESERVE: Final = "supply_reserve"
# Shared supply: lower the cars at once when the house draws more than planned (needs a meter and a current setting).
CONF_SUPPLY_GUARD: Final = "supply_guard"
# The weather: a weather entity whose hourly forecast moves the house forecast with the temperature.
CONF_WEATHER_ENTITY: Final = "weather_entity"
# A heat pump: its power (shown, and part of the house), and a switch that holds it back (on) for a while
# when the house and the cars need more than the limit, before a car is stopped.
CONF_HEAT_PUMP_POWER: Final = "heat_pump_power"
CONF_HEAT_PUMP_BLOCK: Final = "heat_pump_block"
# The sun: a grid power sensor (W or kW, positive when the house buys) turns it on.
CONF_GRID_POWER: Final = "grid_power"
CONF_GRID_INVERTED: Final = "grid_power_inverted"
CONF_SOLAR_POWER: Final = "solar_power"
CONF_BATTERY_SOC: Final = "battery_soc"
CONF_BATTERY_POWER: Final = "battery_power"  # positive when the home battery charges
CONF_BATTERY_INVERTED: Final = "battery_power_inverted"
# Below this level the home battery keeps the sun it takes; above it the cars may have it.
CONF_BATTERY_FIRST: Final = "battery_first_until"
DEFAULT_BATTERY_FIRST: Final = 100.0
# A switch that holds the home battery (no discharging) while a car charges from the grid.
CONF_BATTERY_HOLD: Final = "battery_hold"
# Use the solar forecast of the Energy dashboard.
CONF_SOLAR_FORECAST: Final = "solar_forecast"
# A switch that sets the charger to three phases (on) or one (off).
CONF_PHASE_ENTITY: Final = "phase_entity"
DEFAULT_SUPPLY_RESERVE: Final = 6.0
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
# Split plans: one period instead, when that costs at most this much more per kWh.
SET_JOIN_ENABLED: Final = "join_period"
SET_JOIN_WITHIN: Final = "join_within"
SET_CEILING_ENABLED: Final = "price_ceiling_enabled"
SET_CEILING: Final = "price_ceiling"
# The ceiling as the average price up to the ready-by time plus this many percent.
SET_CEILING_RELATIVE: Final = "price_ceiling_relative"
SET_CEILING_ABOVE: Final = "price_ceiling_above"
SET_LOW_PRICE_ENABLED: Final = "low_price_charging"
SET_LOW_PRICE_LEVEL: Final = "low_price_level"
SET_LOW_SOC_ENABLED: Final = "low_soc_charging"
SET_LOW_SOC_LEVEL: Final = "low_soc_level"
SET_OPPORTUNISTIC: Final = "opportunistic"
SET_OPPORTUNISTIC_LEVEL: Final = "opportunistic_level"
SET_FOLLOW_LEVEL: Final = "follow_level"
SET_KEEP_ON: Final = "keep_charger_on"
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
# A message at the ready-by time with how it went, and a warning when the car cannot be ready.
SET_NOTIFY_RECEIPT: Final = "notify_receipt"
# Charge earlier when it costs at most ``early_within`` more per kWh than the cheapest plan.
SET_EARLY_ENABLED: Final = "prefer_early"
SET_EARLY_WITHIN: Final = "early_within"
# Charge to ``topup_level`` at the cheapest prices, and the rest just before the ready-by time.
SET_TOPUP_ENABLED: Final = "topup"
SET_TOPUP_LEVEL: Final = "topup_level"
# Shared supply: what a car must have by its ready-by time before other cars fill up (0: its whole target),
# and whether it comes first when there is not enough for every car.
SET_MUST_SOC: Final = "must_soc"
SET_PRIORITY: Final = "priority"
PRIORITY_NORMAL: Final = "normal"
PRIORITY_FIRST: Final = "first"
PRIORITY_OPTIONS: Final = [PRIORITY_NORMAL, PRIORITY_FIRST]
# Charging on the sun: off, the sun and the plan, or only the sun.
SET_SOLAR: Final = "solar"
SOLAR_OFF: Final = "off"
SOLAR_SURPLUS: Final = "surplus"
SOLAR_ONLY: Final = "only"
SOLAR_OPTIONS: Final = [SOLAR_OFF, SOLAR_SURPLUS, SOLAR_ONLY]
# How the car looks in the panel's drawing of the house.
SET_BODY: Final = "body"
BODY_OPTIONS: Final = ["mini", "sedan", "suv", "estate", "van", "photo"]
SET_PAINT: Final = "paint"
SET_SPOT: Final = "spot"
SPOT_OPTIONS: Final = ["auto", "left", "right"]
PAINT_OPTIONS: Final = ["white", "black"]
# A target per weekday of the ready-by time: {"fri": 100}.
SET_DAY_TARGETS: Final = "day_targets"

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

# Not a setting: makes a car forget that it does not charge again after a pause.
FORGET_RESUME: Final = "forget_resume"

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
    SET_JOIN_ENABLED: False,
    SET_JOIN_WITHIN: 0.05,
    SET_CEILING_ENABLED: False,
    SET_CEILING: 2.0,
    SET_CEILING_RELATIVE: False,
    SET_CEILING_ABOVE: 10.0,
    SET_LOW_PRICE_ENABLED: False,
    SET_LOW_PRICE_LEVEL: 0.3,
    SET_LOW_SOC_ENABLED: False,
    SET_LOW_SOC_LEVEL: 20.0,
    SET_OPPORTUNISTIC: OPPORTUNISTIC_OFF,
    SET_OPPORTUNISTIC_LEVEL: 50.0,
    SET_FOLLOW_LEVEL: 90.0,
    SET_KEEP_ON: False,
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
    SET_NOTIFY_RECEIPT: True,
    SET_EARLY_ENABLED: False,
    SET_EARLY_WITHIN: 0.02,
    SET_TOPUP_ENABLED: False,
    SET_TOPUP_LEVEL: 80.0,
    SET_MUST_SOC: 0.0,
    SET_PRIORITY: PRIORITY_NORMAL,
    SET_SOLAR: SOLAR_OFF,
    SET_BODY: "sedan",
    SET_PAINT: "white",
    SET_SPOT: "auto",
    SET_DAY_TARGETS: {},
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
REASON_SOLAR: Final = "solar"

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
STATUS_SOLAR: Final = "charging_solar"
STATUS_WAITING_SUN: Final = "waiting_for_sun"
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
    STATUS_SOLAR,
    STATUS_WAITING_SUN,
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
# Waits between the checks that charging did what it was told: a command that
# did not take is sent again after each of the first ones, then reported.
VERIFY_BACKOFF: Final = (timedelta(minutes=6), timedelta(minutes=12))
# While a problem is reported, it is checked (and the command sent once more) this often.
PROBLEM_RECHECK: Final = timedelta(minutes=30)
# At most this many commands per car per hour, so a car that does not listen is not flooded.
COMMANDS_PER_HOUR: Final = 12
# A command to a car or charger is given up after this long (seconds): a cloud that hangs holds nothing else up.
COMMAND_TIMEOUT: Final = 30.0
# After a command that failed, the next try waits this long: longer each time in a row.
CONTROL_BACKOFF: Final = (
    timedelta(minutes=1),
    timedelta(minutes=2),
    timedelta(minutes=5),
    timedelta(minutes=10),
    timedelta(minutes=15),
)
# This many failed commands in a row are reported as a repair, until one gets through.
CONTROL_FAILS_ISSUE: Final = 3
# A car EV Planner has paused is not started again within this time (a changed mode starts it at once).
MIN_REST: Final = timedelta(minutes=2)
# Counters (energy, time) are written to disk at most this often (seconds); the rest within a second.
SAVE_COUNTERS: Final = 120.0
# Many updates in a row postpone the recalculation, but never longer than this (seconds).
RECALCULATE_MAX_WAIT: Final = 5.0
# A charging sensor that does not answer is asked again this many times before the check gives up.
VERIFY_UNKNOWN_TRIES: Final = 5
# The same command is not sent again within this time, except to check it.
COMMAND_REPEAT: Final = timedelta(seconds=60)
# A car with a plug sensor must stay unplugged this long before its charge goes to the history.
UNPLUG_CONFIRM: Final = timedelta(minutes=2)
# Charging that stops and starts again within this time is one period (a charging sensor that flickers).
PERIOD_JOIN: Final = timedelta(minutes=2)
# Without a plug sensor, a charge smaller than this without a rise in the charge level is a blip: it
# is joined to the next charge that starts within BLIP_HOLD, else it is left out of the history.
BLIP_KWH: Final = 0.5
BLIP_HOLD: Final = timedelta(hours=6)
# A guest car seen unplugged in a pause between periods: checked again this long after the next
# period starts (some chargers report "no car" while charging is paused).
GUEST_PAUSE_UNPLUG_CHECK: Final = timedelta(minutes=5)
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
ISSUE_CONTROL_FAILED: Final = "control_failed"

DATASET_CACHE_KEY: Final = f"{DOMAIN}_open_ev_data_cache"
DATASET_CACHE_TTL: Final = timedelta(hours=24)
MOTORAPI_BASE_URL: Final = "https://v1.motorapi.dk"
NHTSA_DECODE_URL: Final = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{vin}?format=json"
OPEN_EV_DATA_URL: Final = "https://raw.githubusercontent.com/KilowattApp/open-ev-data/main/data/ev-data.json"
OPEN_EV_DATA_FALLBACK_URL: Final = "https://raw.githubusercontent.com/KilowattApp/open-ev-data/master/data/ev-data.json"

REDACT_KEYS: Final = {CONF_MOTORAPI_KEY, "vin", GUEST_PLATE, "plate"}

ESC_DOMAIN: Final = "ev_smart_charging"
