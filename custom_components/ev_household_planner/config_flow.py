"""Config flow for EV Planner: the household, its cars and its chargers."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers import entity_registry as er, selector
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from . import migration, places
from .api import PlateAuthError, PlateLookupFailed, async_validate_plate_provider_credentials
from .catalog import (
    MODEL_AUTO,
    MODEL_OTHER,
    describe_device,
    get_model,
    model_options,
    suggest_entities,
    suggest_vehicle_entities,
)
from .const import (
    CHARGER_AUTO,
    CONF_BATTERY_CAPACITY,
    CONF_BATTERY_FIRST,
    CONF_BATTERY_HOLD,
    CONF_BATTERY_INVERTED,
    CONF_BATTERY_POWER,
    CONF_BATTERY_SOC,
    CONF_CALENDAR_ENTITY,
    CONF_CALENDAR_KEYWORD,
    CONF_CAPACITY_ENTITY,
    CONF_CHARGE_POWER,
    CONF_CHARGER,
    CONF_CHARGING_ENTITY,
    CONF_CLIMATE_ENTITY,
    CONF_CONNECTED_ENTITY,
    CONF_CONTROL,
    CONF_CONTROL_BACKUP,
    CONF_CONTROL_ENTITY,
    CONF_COUNTRY,
    CONF_CURRENCY,
    CONF_CURRENT_ENTITY,
    CONF_DEVICE,
    CONF_ENERGY_ENTITY,
    CONF_EXPORT_PRICE,
    CONF_EXPORT_PRICE_ENTITY,
    CONF_GRID_INVERTED,
    CONF_GRID_POWER,
    CONF_HEAT_PUMP_BLOCK,
    CONF_HEAT_PUMP_POWER,
    CONF_HOME,
    CONF_HOME_ENTITY,
    CONF_IMPORTED_FROM,
    CONF_IMPORTED_SPEED,
    CONF_MODEL,
    CONF_MOTORAPI_KEY,
    CONF_NOTIFY,
    CONF_PHASE_ENTITY,
    CONF_PLATE_PROVIDER,
    CONF_POWER,
    CONF_POWER_ENTITY,
    CONF_PRICE_ADD,
    CONF_PRICE_ENTITY,
    CONF_REFRESH_ENTITY,
    CONF_SITE,
    CONF_SOC_ENTITY,
    CONF_SOLAR_FORECAST,
    CONF_SOLAR_POWER,
    CONF_SOURCE,
    CONF_SUPPLY_GUARD,
    CONF_SUPPLY_LIMIT,
    CONF_SUPPLY_METER,
    CONF_SUPPLY_PHASES,
    CONF_SUPPLY_RESERVE,
    CONF_SUPPLY_SHARE,
    CONF_SUPPLY_WAIT,
    CONF_SWITCH_ENTITY,
    CONF_TARGET_ENTITY,
    CONF_UNPLUGGED_STATES,
    CONF_WEATHER_ENTITY,
    CONF_ZONE,
    CONNECTION_KEYS,
    CONTROL_CAR,
    CONTROL_CHARGER,
    CONTROL_NONE,
    CONTROL_SOURCES,
    COUNTRIES,
    COUNTRY_DENMARK,
    COUNTRY_OTHER,
    CURRENCIES,
    DEFAULT_BATTERY_CAPACITY,
    DEFAULT_BATTERY_FIRST,
    DEFAULT_CHARGE_POWER,
    DEFAULT_COUNTRY,
    DEFAULT_CURRENCY,
    DEFAULT_NAME,
    DEFAULT_PLATE_PROVIDER,
    DEFAULT_SUPPLY_RESERVE,
    DEFAULT_SUPPLY_WAIT,
    DOMAIN,
    ESC_DOMAIN,
    NO_CHARGER,
    OPPORTUNISTIC_FOLLOW,
    OPPORTUNISTIC_LOWER,
    OPPORTUNISTIC_OFF,
    PART_KEYS,
    SET_CEILING,
    SET_CEILING_ENABLED,
    SET_CONTINUOUS,
    SET_EARLIEST_START,
    SET_FOLLOW_LEVEL,
    SET_KEEP_ON,
    SET_LOW_PRICE_ENABLED,
    SET_LOW_PRICE_LEVEL,
    SET_LOW_SOC_ENABLED,
    SET_LOW_SOC_LEVEL,
    SET_MIN_SOC,
    SET_MODE,
    SET_OPPORTUNISTIC,
    SET_OPPORTUNISTIC_LEVEL,
    SET_READY_BY,
    SET_USE_EARLIEST_START,
    SET_USE_READY_BY,
    SHARE_OPTIONS,
    SHARE_QUEUE,
    SITE_HOME,
    SITE_KEYS,
    SOURCE_MANUAL,
    SUBENTRY_BATTERY,
    SUBENTRY_CHARGER,
    SUBENTRY_HEAT_PUMP,
    SUBENTRY_SITE,
    SUBENTRY_SOLAR,
    SUBENTRY_VEHICLE,
)
from .prices import extract_price_slots
from .schema import vol

CONF_IMPORTED_SETTINGS = "imported_settings"
SECTION_SENSORS = "sensors"
SECTION_CHARGING = "charging"
SECTION_TRIPS = "trips"
SECTION_SUPPLY = "supply"
SECTION_SOLAR = "solar"

PRICE_ENTITY_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor"))
COUNTRY_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(
        options=[country.lower() for country in COUNTRIES],
        mode=selector.SelectSelectorMode.DROPDOWN,
        translation_key="country",
    )
)


def _country_option(value: Any) -> str:
    """The selector's option for a stored country (``Denmark`` is stored as before)."""
    return (
        COUNTRY_DENMARK.lower() if str(value or DEFAULT_COUNTRY).lower() == COUNTRY_DENMARK.lower() else COUNTRY_OTHER
    )


def _country(value: Any) -> str:
    """The country to store for the selector's option."""
    return COUNTRY_DENMARK if _country_option(value) == COUNTRY_DENMARK.lower() else COUNTRY_OTHER


API_KEY_SELECTOR = selector.TextSelector(selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD))
LEVEL_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain=["sensor", "number", "input_number"]))
ANY_ENTITY_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig())
HOME_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["device_tracker", "person", "binary_sensor"])
)
# The car's climate: a climate entity, or a switch, button or script that starts it.
CLIMATE_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["climate", "switch", "button", "input_button", "script", "input_boolean"])
)
SWITCH_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain=["switch", "input_boolean"]))
# A number, or any entity of an Easee charger: EV Planner then uses Easee's own action for the current.
CURRENT_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(
        filter=[
            {"domain": ["number", "input_number"]},
            {"integration": "easee", "domain": "sensor"},
        ]
    )
)
METER_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(domain="sensor", device_class="current", multiple=True)
)
PRICE_SELECTOR = selector.NumberSelector(
    selector.NumberSelectorConfig(min=-100, max=100, step=0.01, mode=selector.NumberSelectorMode.BOX)
)
PRICE_SENSOR_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["sensor", "input_number", "number"])
)
BATTERY_LEVEL_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class="battery"))
PERCENT_SELECTOR = selector.NumberSelector(
    selector.NumberSelectorConfig(
        min=0, max=100, step=5, unit_of_measurement="%", mode=selector.NumberSelectorMode.SLIDER
    )
)
AMPS_SELECTOR = selector.NumberSelector(
    selector.NumberSelectorConfig(min=0, max=200, step=1, unit_of_measurement="A", mode=selector.NumberSelectorMode.BOX)
)
# How long the guard waits after a peak in the house before it turns the cars up again.
WAIT_SELECTOR = selector.NumberSelector(
    selector.NumberSelectorConfig(
        min=5, max=30, step=5, unit_of_measurement="min", mode=selector.NumberSelectorMode.SLIDER
    )
)
PHASES_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(options=["1", "3"], mode=selector.SelectSelectorMode.LIST, translation_key="phases")
)
ENERGY_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class="energy"))
POWER_ENTITY_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class="power"))
WEATHER_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="weather"))
CAPACITY_ENTITY_SELECTOR = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["sensor", "number", "input_number"])
)
CALENDAR_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="calendar"))
CONTROL_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(
        options=CONTROL_SOURCES, mode=selector.SelectSelectorMode.LIST, translation_key="control"
    )
)
STATES_SELECTOR = selector.TextSelector(selector.TextSelectorConfig(multiple=True))
SHARE_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(
        options=SHARE_OPTIONS, mode=selector.SelectSelectorMode.LIST, translation_key="supply_share"
    )
)
ZONE_SELECTOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="zone"))
CAPACITY_SELECTOR = selector.NumberSelector(
    selector.NumberSelectorConfig(
        min=1, max=300, step=0.1, unit_of_measurement="kWh", mode=selector.NumberSelectorMode.BOX
    )
)
POWER_SELECTOR = selector.NumberSelector(
    selector.NumberSelectorConfig(
        min=0.1, max=350, step=0.1, unit_of_measurement="kW", mode=selector.NumberSelectorMode.BOX
    )
)


def _currency_selector(hass: HomeAssistant) -> selector.SelectSelector:
    options = list(CURRENCIES)
    if hass.config.currency and hass.config.currency not in options:
        options.append(hass.config.currency)
    return selector.SelectSelector(
        selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.DROPDOWN)
    )


def _notify_selector(hass: HomeAssistant) -> selector.SelectSelector:
    services = sorted(f"notify.{name}" for name in hass.services.async_services_for_domain("notify"))
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=services, multiple=True, custom_value=True, mode=selector.SelectSelectorMode.DROPDOWN
        )
    )


def _price_sensors(hass: HomeAssistant) -> list[str]:
    """The sensors here with prices EV Planner can read, whichever price integration they come from."""
    now = dt_util.now()
    return sorted(state.entity_id for state in hass.states.async_all("sensor") if extract_price_slots(state, now))


def _connection_schema(hass: HomeAssistant, defaults: Mapping[str, Any]) -> dict[vol.Marker, Any]:
    # The price sensor the household has, not one integration's name: only one that is here is filled in.
    found = _price_sensors(hass)
    price = defaults.get(CONF_PRICE_ENTITY) or (found[0] if found else None)
    return {
        vol.Required(CONF_PRICE_ENTITY, description={"suggested_value": price}): PRICE_ENTITY_SELECTOR,
        vol.Required(CONF_COUNTRY, default=_country_option(defaults.get(CONF_COUNTRY))): COUNTRY_SELECTOR,
        vol.Optional(CONF_MOTORAPI_KEY, default=defaults.get(CONF_MOTORAPI_KEY, "")): API_KEY_SELECTOR,
    }


async def _async_validate_connection(hass: HomeAssistant, user_input: Mapping[str, Any]) -> dict[str, str]:
    """Check the price sensor and, if given, the MotorAPI key."""
    errors: dict[str, str] = {}
    if not extract_price_slots(hass.states.get(user_input[CONF_PRICE_ENTITY]), dt_util.now()):
        errors[CONF_PRICE_ENTITY] = "invalid_price_entity"
    api_key = str(user_input.get(CONF_MOTORAPI_KEY) or "").strip()
    if api_key and _country(user_input.get(CONF_COUNTRY)) == COUNTRY_DENMARK:
        try:
            await async_validate_plate_provider_credentials(
                async_get_clientsession(hass),
                country=COUNTRY_DENMARK,
                provider=DEFAULT_PLATE_PROVIDER,
                api_key=api_key,
            )
        except PlateAuthError:
            errors[CONF_MOTORAPI_KEY] = "invalid_auth"
        except PlateLookupFailed as err:
            errors["base"] = (
                str(err) if str(err) in {"cannot_connect", "timeout", "unsupported_provider"} else "unknown"
            )
    return errors


class EVPlannerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up the household."""

    VERSION = 1
    MINOR_VERSION = 1

    @classmethod
    @callback
    def async_get_supported_subentry_types(cls, config_entry: ConfigEntry) -> dict[str, type[ConfigSubentryFlow]]:
        return {
            SUBENTRY_VEHICLE: VehicleSubentryFlow,
            SUBENTRY_CHARGER: ChargerSubentryFlow,
            SUBENTRY_SITE: SiteSubentryFlow,
            SUBENTRY_SOLAR: SolarSubentryFlow,
            SUBENTRY_BATTERY: BatterySubentryFlow,
            SUBENTRY_HEAT_PUMP: HeatPumpSubentryFlow,
        }

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is None and migration.old_entries(self.hass):
            return await self.async_step_migrate()
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = await _async_validate_connection(self.hass, user_input)
            if not errors:
                await self.async_set_unique_id(DOMAIN)
                self._abort_if_unique_id_configured()
                data = {
                    CONF_PRICE_ENTITY: user_input[CONF_PRICE_ENTITY],
                    CONF_COUNTRY: _country(user_input[CONF_COUNTRY]),
                    CONF_MOTORAPI_KEY: str(user_input.get(CONF_MOTORAPI_KEY) or "").strip(),
                    CONF_PLATE_PROVIDER: DEFAULT_PLATE_PROVIDER,
                }
                options = {CONF_CURRENCY: user_input[CONF_CURRENCY], CONF_NOTIFY: []}
                return self.async_create_entry(title=user_input[CONF_NAME], data=data, options=options)

        defaults = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=defaults.get(CONF_NAME, DEFAULT_NAME)): str,
                **_connection_schema(self.hass, defaults),
                vol.Required(
                    CONF_CURRENCY, default=defaults.get(CONF_CURRENCY, self.hass.config.currency or DEFAULT_CURRENCY)
                ): (_currency_selector(self.hass)),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def async_step_migrate(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Move the household of EV Planner 1.x (domain ev_planner) here, with everything in it."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        old = migration.old_entries(self.hass)[0]
        if user_input is not None:
            return self.async_create_entry(**migration.entry_from_old(old))
        return self.async_show_form(step_id="migrate", description_placeholders=dict(migration.describe(old)))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the price sensor, country or MotorAPI key."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = await _async_validate_connection(self.hass, user_input)
            if not errors:
                return self.async_update_and_abort(
                    entry,
                    data_updates={
                        CONF_PRICE_ENTITY: user_input[CONF_PRICE_ENTITY],
                        CONF_COUNTRY: _country(user_input[CONF_COUNTRY]),
                        CONF_MOTORAPI_KEY: str(user_input.get(CONF_MOTORAPI_KEY) or "").strip(),
                    },
                    options={k: v for k, v in entry.options.items() if k not in CONNECTION_KEYS},
                )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=vol.Schema(_connection_schema(self.hass, user_input or {**entry.data, **entry.options})),
            errors=errors,
        )

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Enter a new MotorAPI key."""
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            api_key = str(user_input[CONF_MOTORAPI_KEY]).strip()
            try:
                await async_validate_plate_provider_credentials(
                    async_get_clientsession(self.hass),
                    country=entry.data.get(CONF_COUNTRY, DEFAULT_COUNTRY),
                    provider=entry.data.get(CONF_PLATE_PROVIDER, DEFAULT_PLATE_PROVIDER),
                    api_key=api_key,
                )
            except PlateAuthError:
                errors[CONF_MOTORAPI_KEY] = "invalid_auth"
            except PlateLookupFailed as err:
                errors["base"] = str(err) if str(err) in {"cannot_connect", "timeout"} else "unknown"
            else:
                return self.async_update_and_abort(entry, data_updates={CONF_MOTORAPI_KEY: api_key})
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({vol.Required(CONF_MOTORAPI_KEY): API_KEY_SELECTOR}),
            description_placeholders={"name": entry.title},
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> EVPlannerOptionsFlow:
        return EVPlannerOptionsFlow()


class EVPlannerOptionsFlow(OptionsFlow):
    """What is the whole household's: currency, notifications and what is added to every price.

    The supply, the sun, the home battery and the heat pump belong to a place
    and are parts of their own, added under the integration.
    """

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        options = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Required(CONF_CURRENCY, default=options.get(CONF_CURRENCY) or DEFAULT_CURRENCY): _currency_selector(
                    self.hass
                ),
                vol.Optional(CONF_NOTIFY, default=list(options.get(CONF_NOTIFY) or [])): _notify_selector(self.hass),
                vol.Optional("update_widgets", default=bool(options.get("update_widgets", False))): bool,
                vol.Optional(CONF_PRICE_ADD, default=options.get(CONF_PRICE_ADD) or 0): PRICE_SELECTOR,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)


# ----------------------------------------------------------------------
# Cars


def _esc_entries(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, str]:
    """EV Smart Charging cars not imported yet: {entry_id: title}."""
    imported = {
        sub.data.get(CONF_IMPORTED_FROM)
        for sub in entry.subentries.values()
        if sub.subentry_type == SUBENTRY_VEHICLE and sub.data.get(CONF_IMPORTED_FROM)
    }
    return {
        esc.entry_id: esc.title for esc in hass.config_entries.async_entries(ESC_DOMAIN) if esc.entry_id not in imported
    }


def _esc_state(hass: HomeAssistant, entry_id: str, platform: str, key: str) -> str | None:
    """The state of one of EV Smart Charging's own entities."""
    registry = er.async_get(hass)
    unique_id = ".".join([entry_id, platform, key.replace("_", "").lower()])
    entity_id = registry.async_get_entity_id(platform, ESC_DOMAIN, unique_id)
    state = hass.states.get(entity_id) if entity_id else None
    return state.state if state is not None else None


def _float(value: str | None) -> float | None:
    try:
        return float(value) if value is not None else None
    except ValueError:
        return None


def esc_import(hass: HomeAssistant, entry_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """Read an EV Smart Charging car: (suggested form values, initial settings)."""
    esc = hass.config_entries.async_get_entry(entry_id)
    if esc is None:
        return {}, {}
    options = {**esc.data, **esc.options}
    charger_entity = options.get("charger_entity") or ""
    values: dict[str, Any] = {
        CONF_NAME: esc.title.replace("EV Smart Charging", "").strip() or esc.title,
        CONF_SOC_ENTITY: options.get("ev_soc_sensor") or None,
        CONF_TARGET_ENTITY: options.get("ev_target_soc_sensor") or None,
        CONF_CONTROL: CONTROL_CAR if charger_entity else CONTROL_NONE,
        CONF_CONTROL_ENTITY: charger_entity or None,
    }
    # EV Smart Charging plans with a speed in % per hour: the car starts out with that.
    speed = _float(_esc_state(hass, entry_id, "number", "charging_speed"))
    if speed and speed > 0:
        values[CONF_IMPORTED_SPEED] = speed

    def on(key: str) -> bool:
        return _esc_state(hass, entry_id, "switch", key) == "on"

    settings: dict[str, Any] = {
        SET_CONTINUOUS: on("continuous_charging_preferred"),
        SET_KEEP_ON: on("keep_charger_on"),
        SET_CEILING_ENABLED: on("apply_price_limit"),
        SET_LOW_PRICE_ENABLED: on("low_price_charging"),
        SET_LOW_SOC_ENABLED: on("low_soc_charging"),
        SET_MODE: "smart" if _esc_state(hass, entry_id, "switch", "smart_charging_activated") != "off" else "off",
    }
    if on("opportunistic_charging"):
        settings[SET_OPPORTUNISTIC] = OPPORTUNISTIC_LOWER
    elif on("opportunistic_type2_charging"):
        settings[SET_OPPORTUNISTIC] = OPPORTUNISTIC_FOLLOW
    else:
        settings[SET_OPPORTUNISTIC] = OPPORTUNISTIC_OFF
    for key, setting in (
        ("electricity_price_limit", SET_CEILING),
        ("low_price_charging_level", SET_LOW_PRICE_LEVEL),
        ("low_soc_charging_level", SET_LOW_SOC_LEVEL),
        ("minimum_ev_soc", SET_MIN_SOC),
        ("opportunistic_level", SET_OPPORTUNISTIC_LEVEL),
        ("opportunistic_type2_level", SET_FOLLOW_LEVEL),
    ):
        if (value := _float(_esc_state(hass, entry_id, "number", key))) is not None:
            settings[setting] = value
    ready = _esc_state(hass, entry_id, "select", "charge_completion_time")
    if ready and ready not in ("None", "unknown", "unavailable"):
        settings[SET_READY_BY], settings[SET_USE_READY_BY] = ready[:5], True
    elif ready == "None":
        settings[SET_USE_READY_BY] = False
    start = _esc_state(hass, entry_id, "select", "charge_start_time")
    if start and start not in ("None", "unknown", "unavailable"):
        settings[SET_EARLIEST_START], settings[SET_USE_EARLIEST_START] = start[:5], True
    return values, settings


def _flat(user_input: Mapping[str, Any]) -> dict[str, Any]:
    """Flatten the form's sections."""
    flat: dict[str, Any] = {}
    for key, value in user_input.items():
        if key in (SECTION_SENSORS, SECTION_CHARGING, SECTION_TRIPS) and isinstance(value, Mapping):
            flat.update(value)
        else:
            flat[key] = value
    return flat


class VehicleSubentryFlow(ConfigSubentryFlow):
    """Add or change a car."""

    def __init__(self) -> None:
        self._suggested: dict[str, Any] = {}
        self._imported_from: str | None = None
        self._imported_settings: dict[str, Any] = {}
        self._imported_speed: float | None = None

    def _charger_options(self) -> list[selector.SelectOptionDict]:
        entry = self._get_entry()
        options = [
            selector.SelectOptionDict(value=NO_CHARGER, label="-"),
            selector.SelectOptionDict(value=CHARGER_AUTO, label=CHARGER_AUTO),
        ]
        options.extend(
            selector.SelectOptionDict(value=subentry_id, label=sub.title)
            for subentry_id, sub in entry.subentries.items()
            if sub.subentry_type == SUBENTRY_CHARGER
        )
        return options

    def _schema(self, values: Mapping[str, Any]) -> vol.Schema:
        charger_selector = selector.SelectSelector(
            selector.SelectSelectorConfig(
                options=self._charger_options(), mode=selector.SelectSelectorMode.DROPDOWN, translation_key="charger"
            )
        )

        def opt(key: str) -> vol.Optional:
            return vol.Optional(key, description={"suggested_value": values.get(key)})

        return vol.Schema(
            {
                vol.Required(CONF_NAME, default=values.get(CONF_NAME, "")): str,
                vol.Required(
                    CONF_BATTERY_CAPACITY, default=values.get(CONF_BATTERY_CAPACITY, DEFAULT_BATTERY_CAPACITY)
                ): CAPACITY_SELECTOR,
                vol.Required(SECTION_SENSORS): section(
                    vol.Schema(
                        {
                            opt(CONF_SOC_ENTITY): LEVEL_SELECTOR,
                            opt(CONF_TARGET_ENTITY): LEVEL_SELECTOR,
                            opt(CONF_CAPACITY_ENTITY): CAPACITY_ENTITY_SELECTOR,
                            opt(CONF_CONNECTED_ENTITY): ANY_ENTITY_SELECTOR,
                            opt(CONF_UNPLUGGED_STATES): STATES_SELECTOR,
                            opt(CONF_HOME_ENTITY): HOME_SELECTOR,
                            opt(CONF_CHARGING_ENTITY): ANY_ENTITY_SELECTOR,
                            opt(CONF_POWER_ENTITY): POWER_ENTITY_SELECTOR,
                            opt(CONF_REFRESH_ENTITY): ANY_ENTITY_SELECTOR,
                        }
                    ),
                    {"collapsed": False},
                ),
                vol.Required(SECTION_CHARGING): section(
                    vol.Schema(
                        {
                            vol.Required(
                                CONF_CHARGE_POWER, default=values.get(CONF_CHARGE_POWER, DEFAULT_CHARGE_POWER)
                            ): POWER_SELECTOR,
                            vol.Required(
                                CONF_CHARGER, default=values.get(CONF_CHARGER) or NO_CHARGER
                            ): charger_selector,
                            vol.Required(
                                CONF_CONTROL, default=values.get(CONF_CONTROL, CONTROL_NONE)
                            ): CONTROL_SELECTOR,
                            opt(CONF_CONTROL_ENTITY): SWITCH_SELECTOR,
                            vol.Optional(
                                CONF_CONTROL_BACKUP, default=bool(values.get(CONF_CONTROL_BACKUP, False))
                            ): bool,
                            opt(CONF_CURRENT_ENTITY): CURRENT_SELECTOR,
                            opt(CONF_PHASE_ENTITY): SWITCH_SELECTOR,
                        }
                    ),
                    {"collapsed": False},
                ),
                vol.Required(SECTION_TRIPS): section(
                    vol.Schema(
                        {
                            opt(CONF_CALENDAR_ENTITY): CALENDAR_SELECTOR,
                            opt(CONF_CALENDAR_KEYWORD): str,
                            opt(CONF_CLIMATE_ENTITY): CLIMATE_SELECTOR,
                        }
                    ),
                    {"collapsed": True},
                ),
            }
        )

    def _validate(self, data: Mapping[str, Any]) -> dict[str, str]:
        errors: dict[str, str] = {}
        control = data.get(CONF_CONTROL)
        if control == CONTROL_CAR and not data.get(CONF_CONTROL_ENTITY):
            errors["base"] = "control_entity_required"
        if control == CONTROL_CHARGER:
            charger_id = data.get(CONF_CHARGER)
            entry = self._get_entry()
            if charger_id == CHARGER_AUTO:
                # Found each time: one of the chargers must have a switch.
                if not any(
                    sub.subentry_type == SUBENTRY_CHARGER and sub.data.get(CONF_SWITCH_ENTITY)
                    for sub in entry.subentries.values()
                ):
                    errors["base"] = "charger_has_no_switch"
                return errors
            charger = entry.subentries.get(charger_id) if charger_id and charger_id != NO_CHARGER else None
            if charger is None:
                errors["base"] = "charger_required"
            elif not charger.data.get(CONF_SWITCH_ENTITY):
                errors["base"] = "charger_has_no_switch"
        return errors

    def _defaults(self, found: Mapping[str, Any]) -> dict[str, Any]:
        """Where a new car charges and what starts and pauses it, from the chargers there are.

        One charger: that one. Several: found each time. A charger with a
        switch starts and pauses the car, as a charger is more often there to
        answer than a car; the car's own switch is then the backup.
        """
        chargers = {
            sid: sub for sid, sub in self._get_entry().subentries.items() if sub.subentry_type == SUBENTRY_CHARGER
        }
        values: dict[str, Any] = {}
        if len(chargers) == 1:
            values[CONF_CHARGER] = next(iter(chargers))
        elif chargers:
            values[CONF_CHARGER] = CHARGER_AUTO
        car_switch = bool(found.get(CONF_CONTROL_ENTITY))
        if chargers and all(sub.data.get(CONF_SWITCH_ENTITY) for sub in chargers.values()):
            values[CONF_CONTROL] = CONTROL_CHARGER
            values[CONF_CONTROL_BACKUP] = car_switch
        elif car_switch:
            values[CONF_CONTROL] = CONTROL_CAR
        return values

    @staticmethod
    def _clean(data: Mapping[str, Any]) -> dict[str, Any]:
        result = {key: value for key, value in data.items() if key != CONF_NAME and value not in (None, "", [])}
        if result.get(CONF_CHARGER) == NO_CHARGER:
            result.pop(CONF_CHARGER)
        return result

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Start from the car's device in Home Assistant, from a car in EV Smart Charging, or from scratch."""
        candidates = _esc_entries(self.hass, self._get_entry())
        if user_input is not None:
            source = user_input.get(CONF_SOURCE, SOURCE_MANUAL)
            if source != SOURCE_MANUAL and source in candidates:
                self._imported_from = source
                self._suggested, self._imported_settings = esc_import(self.hass, source)
                self._imported_speed = self._suggested.pop(CONF_IMPORTED_SPEED, None)
            if device_id := user_input.get(CONF_DEVICE):
                # What the device has fills in what EV Smart Charging did not.
                found = suggest_vehicle_entities(self.hass, device_id)
                name, _model = describe_device(self.hass, device_id)
                if name:
                    found[CONF_NAME] = name
                self._suggested = {**found, **{k: v for k, v in self._suggested.items() if v not in (None, "")}}
            self._suggested = {**self._defaults(self._suggested), **self._suggested}
            return await self.async_step_details()
        fields: dict[vol.Marker, Any] = {
            vol.Optional(CONF_DEVICE): selector.DeviceSelector(selector.DeviceSelectorConfig())
        }
        if candidates:
            options = [selector.SelectOptionDict(value=SOURCE_MANUAL, label="-")]
            options.extend(selector.SelectOptionDict(value=eid, label=title) for eid, title in candidates.items())
            fields[vol.Required(CONF_SOURCE, default=next(iter(candidates)))] = selector.SelectSelector(
                selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.LIST)
            )
        return self.async_show_form(step_id="user", data_schema=vol.Schema(fields))

    async def async_step_details(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            data = _flat(user_input)
            errors = self._validate(data)
            if not errors:
                stored = self._clean(data)
                if self._imported_from:
                    stored[CONF_IMPORTED_FROM] = self._imported_from
                    stored[CONF_IMPORTED_SETTINGS] = self._imported_settings
                    if self._imported_speed:
                        stored[CONF_IMPORTED_SPEED] = self._imported_speed
                return self.async_create_entry(title=data[CONF_NAME], data=stored)
            self._suggested = data
        return self.async_show_form(
            step_id="details",
            data_schema=self._schema(self._suggested),
            errors=errors,
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            data = _flat(user_input)
            errors = self._validate(data)
            if not errors:
                stored = self._clean(data)
                for key in (CONF_IMPORTED_FROM, CONF_IMPORTED_SETTINGS):
                    if key in subentry.data:
                        stored[key] = subentry.data[key]
                # EV Smart Charging's speed goes with the capacity and power it came with.
                if CONF_IMPORTED_SPEED in subentry.data and all(
                    stored.get(key) == subentry.data.get(key) for key in (CONF_BATTERY_CAPACITY, CONF_CHARGE_POWER)
                ):
                    stored[CONF_IMPORTED_SPEED] = subentry.data[CONF_IMPORTED_SPEED]
                return self.async_update_and_abort(self._get_entry(), subentry, title=data[CONF_NAME], data=stored)
            values = data
        else:
            values = {**subentry.data, CONF_NAME: subentry.title}
        return self.async_show_form(step_id="reconfigure", data_schema=self._schema(values), errors=errors)


# ----------------------------------------------------------------------
# Chargers


def _model_selector(*, auto: bool) -> selector.SelectSelector:
    options = [selector.SelectOptionDict(value=MODEL_AUTO, label=MODEL_AUTO)] if auto else []
    options.extend(selector.SelectOptionDict(value=key, label=label) for key, label in model_options())
    options.append(selector.SelectOptionDict(value=MODEL_OTHER, label=MODEL_OTHER))
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=options, mode=selector.SelectSelectorMode.DROPDOWN, translation_key="charger_model", sort=False
        )
    )


class ChargerSubentryFlow(ConfigSubentryFlow):
    """Add or change a charger: pick it from the list, and its device fills in the rest."""

    def __init__(self) -> None:
        self._values: dict[str, Any] = {}

    def _schema(self, values: Mapping[str, Any]) -> vol.Schema:
        def opt(key: str) -> vol.Optional:
            return vol.Optional(key, description={"suggested_value": values.get(key)})

        fields: dict[vol.Marker, Any] = {
            vol.Required(CONF_NAME, default=values.get(CONF_NAME, "")): str,
            vol.Required(CONF_MODEL, default=values.get(CONF_MODEL) or MODEL_OTHER): _model_selector(auto=False),
            vol.Required(CONF_POWER, default=values.get(CONF_POWER, DEFAULT_CHARGE_POWER)): POWER_SELECTOR,
        }
        sites = _site_options(self._get_entry())
        if len(sites) > 1:
            # Only asked when the household has another place than the home.
            known = {site["value"] for site in sites}
            chosen = values.get(CONF_SITE)
            fields[vol.Required(CONF_SITE, default=chosen if chosen in known else SITE_HOME)] = _site_selector(sites)
        fields.update(
            {
                opt(CONF_SWITCH_ENTITY): SWITCH_SELECTOR,
                opt(CONF_CURRENT_ENTITY): CURRENT_SELECTOR,
                opt(CONF_PHASE_ENTITY): SWITCH_SELECTOR,
                opt(CONF_ENERGY_ENTITY): ENERGY_SELECTOR,
                opt(CONF_POWER_ENTITY): POWER_ENTITY_SELECTOR,
                opt(CONF_CONNECTED_ENTITY): ANY_ENTITY_SELECTOR,
                opt(CONF_UNPLUGGED_STATES): STATES_SELECTOR,
            }
        )
        return vol.Schema(fields)

    @staticmethod
    def _clean(data: Mapping[str, Any]) -> dict[str, Any]:
        result = {key: value for key, value in data.items() if key != CONF_NAME and value not in (None, "", [])}
        if result.get(CONF_MODEL) == MODEL_OTHER:
            result.pop(CONF_MODEL)
        if result.get(CONF_SITE) == SITE_HOME:
            result.pop(CONF_SITE)
        return result

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Which charger, and its device in Home Assistant if it has one."""
        if user_input is not None:
            device_id = user_input.get(CONF_DEVICE)
            device_name, matched = describe_device(self.hass, device_id) if device_id else (None, None)
            chosen = user_input.get(CONF_MODEL, MODEL_AUTO)
            model = matched if chosen == MODEL_AUTO else get_model(chosen)
            values: dict[str, Any] = {
                CONF_NAME: device_name or (model.title if model else ""),
                CONF_MODEL: model.key if model else MODEL_OTHER,
                CONF_POWER: model.suggested_power if model else DEFAULT_CHARGE_POWER,
            }
            if device_id:
                values.update(suggest_entities(self.hass, device_id, model))
            self._values = values
            return await self.async_step_details()
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_DEVICE): selector.DeviceSelector(selector.DeviceSelectorConfig()),
                    vol.Required(CONF_MODEL, default=MODEL_AUTO): _model_selector(auto=True),
                }
            ),
        )

    async def async_step_details(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is not None:
            return self.async_create_entry(title=user_input[CONF_NAME], data=self._clean(user_input))
        return self.async_show_form(step_id="details", data_schema=self._schema(self._values))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        if user_input is not None:
            return self.async_update_and_abort(
                self._get_entry(), subentry, title=user_input[CONF_NAME], data=self._clean(user_input)
            )
        return self.async_show_form(
            step_id="reconfigure", data_schema=self._schema({**subentry.data, CONF_NAME: subentry.title})
        )


# ----------------------------------------------------------------------
# Places, and their parts


def _site_options(entry: ConfigEntry) -> list[selector.SelectOptionDict]:
    """The household's places, the home first. The home's value is always "home"."""
    home = places.home_subentry(entry)
    options = [selector.SelectOptionDict(value=SITE_HOME, label=home.title if home else SITE_HOME)]
    options.extend(
        selector.SelectOptionDict(value=sid, label=sub.title)
        for sid, sub in entry.subentries.items()
        if sub.subentry_type == SUBENTRY_SITE and sub is not home
    )
    return options


def _site_selector(options: list[selector.SelectOptionDict]) -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=options, mode=selector.SelectSelectorMode.DROPDOWN, translation_key="site"
        )
    )


def _site_of(entry: ConfigEntry, raw: Any) -> str:
    """The value a place has in a selector, from what is stored for it."""
    home = places.home_subentry(entry)
    if not raw or raw == SITE_HOME or (home is not None and raw == home.subentry_id):
        return SITE_HOME
    return str(raw) if raw in entry.subentries else SITE_HOME


SECTION_GRID = "grid"
SUPPLY_FIELDS = (
    CONF_SUPPLY_LIMIT,
    CONF_SUPPLY_PHASES,
    CONF_SUPPLY_METER,
    CONF_SUPPLY_RESERVE,
    CONF_SUPPLY_GUARD,
    CONF_SUPPLY_WAIT,
    CONF_SUPPLY_SHARE,
    CONF_WEATHER_ENTITY,
)


class SiteSubentryFlow(ConfigSubentryFlow):
    """Add or change a place: the home, or another place with chargers (a summer house).

    A place has its own supply (what it may draw, and a meter), and its own
    meter to the grid for the sun.
    """

    def _schema(self, values: Mapping[str, Any], *, home: bool) -> vol.Schema:
        def opt(key: str) -> vol.Optional:
            return vol.Optional(key, description={"suggested_value": values.get(key)})

        weathers = self.hass.states.async_entity_ids("weather")
        only_weather = weathers[0] if home and len(weathers) == 1 else None
        fields: dict[vol.Marker, Any] = {vol.Required(CONF_NAME, default=values.get(CONF_NAME, "")): str}
        if not home:
            # The home is where a car's location says "home".
            fields[opt(CONF_ZONE)] = ZONE_SELECTOR
        fields[vol.Required(SECTION_SUPPLY)] = section(
            vol.Schema(
                {
                    vol.Optional(CONF_SUPPLY_LIMIT, default=values.get(CONF_SUPPLY_LIMIT) or 0): AMPS_SELECTOR,
                    vol.Optional(
                        CONF_SUPPLY_PHASES, default=str(values.get(CONF_SUPPLY_PHASES) or "3")
                    ): PHASES_SELECTOR,
                    vol.Optional(CONF_SUPPLY_METER, default=list(values.get(CONF_SUPPLY_METER) or [])): METER_SELECTOR,
                    vol.Optional(
                        CONF_SUPPLY_RESERVE, default=values.get(CONF_SUPPLY_RESERVE, DEFAULT_SUPPLY_RESERVE)
                    ): AMPS_SELECTOR,
                    vol.Optional(CONF_SUPPLY_GUARD, default=bool(values.get(CONF_SUPPLY_GUARD, False))): bool,
                    vol.Optional(
                        CONF_SUPPLY_WAIT, default=values.get(CONF_SUPPLY_WAIT, DEFAULT_SUPPLY_WAIT)
                    ): WAIT_SELECTOR,
                    vol.Optional(
                        CONF_SUPPLY_SHARE, default=values.get(CONF_SUPPLY_SHARE) or SHARE_QUEUE
                    ): SHARE_SELECTOR,
                    vol.Optional(
                        CONF_WEATHER_ENTITY,
                        description={"suggested_value": values.get(CONF_WEATHER_ENTITY, only_weather)},
                    ): WEATHER_SELECTOR,
                }
            ),
            {"collapsed": not values.get(CONF_SUPPLY_LIMIT)},
        )
        fields[vol.Required(SECTION_GRID)] = section(
            vol.Schema(
                {
                    opt(CONF_GRID_POWER): POWER_ENTITY_SELECTOR,
                    vol.Optional(CONF_GRID_INVERTED, default=bool(values.get(CONF_GRID_INVERTED, False))): bool,
                    vol.Optional(CONF_EXPORT_PRICE, default=values.get(CONF_EXPORT_PRICE) or 0): PRICE_SELECTOR,
                    opt(CONF_EXPORT_PRICE_ENTITY): PRICE_SENSOR_SELECTOR,
                }
            ),
            {"collapsed": not values.get(CONF_GRID_POWER)},
        )
        return vol.Schema(fields)

    @staticmethod
    def _clean(data: Mapping[str, Any], *, home: bool) -> dict[str, Any]:
        flat = {**data, **(data.get(SECTION_SUPPLY) or {}), **(data.get(SECTION_GRID) or {})}
        result = {key: flat[key] for key in SITE_KEYS if flat.get(key) not in (None, "", [], 0, False)}
        if CONF_SUPPLY_RESERVE in flat and flat[CONF_SUPPLY_RESERVE] is not None:
            result[CONF_SUPPLY_RESERVE] = flat[CONF_SUPPLY_RESERVE]
        if result.get(CONF_SUPPLY_WAIT) == DEFAULT_SUPPLY_WAIT:
            result.pop(CONF_SUPPLY_WAIT)  # the default is not stored, so a later default follows
        if home:
            result = {CONF_HOME: True, **{key: value for key, value in result.items() if key != CONF_ZONE}}
        return result

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is not None:
            return self.async_create_entry(title=user_input[CONF_NAME], data=self._clean(user_input, home=False))
        return self.async_show_form(step_id="user", data_schema=self._schema({}, home=False))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        home = bool(subentry.data.get(CONF_HOME))
        if user_input is not None:
            return self.async_update_and_abort(
                self._get_entry(), subentry, title=user_input[CONF_NAME], data=self._clean(user_input, home=home)
            )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self._schema({**subentry.data, CONF_NAME: subentry.title}, home=home),
        )


class _PartSubentryFlow(ConfigSubentryFlow):
    """Something a place has one of: the sun on its roof, a home battery, a heat pump."""

    KIND = ""

    def _fields(self, values: Mapping[str, Any]) -> dict[vol.Marker, Any]:
        raise NotImplementedError

    def _found(self) -> dict[str, Any]:
        """What Home Assistant already knows about it (the Energy dashboard), to fill in."""
        return {}

    def _schema(self, values: Mapping[str, Any]) -> vol.Schema:
        fields: dict[vol.Marker, Any] = {
            vol.Required(CONF_NAME, default=values.get(CONF_NAME) or places.title(self.hass, self.KIND)): str
        }
        sites = _site_options(self._get_entry())
        if len(sites) > 1:
            chosen = _site_of(self._get_entry(), values.get(CONF_SITE))
            fields[vol.Required(CONF_SITE, default=chosen)] = _site_selector(sites)
        fields.update(self._fields(values))
        return vol.Schema(fields)

    def _taken(self, site: str, but: str | None = None) -> bool:
        """The place already has one of these."""
        entry = self._get_entry()
        return any(
            sub.subentry_type == self.KIND and sid != but and _site_of(entry, sub.data.get(CONF_SITE)) == site
            for sid, sub in entry.subentries.items()
        )

    def _clean(self, data: Mapping[str, Any]) -> dict[str, Any]:
        result = {key: data[key] for key in PART_KEYS[self.KIND] if data.get(key) not in (None, "", [])}
        site = _site_of(self._get_entry(), data.get(CONF_SITE))
        if site != SITE_HOME:
            result[CONF_SITE] = site
        return result

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            if self._taken(_site_of(self._get_entry(), user_input.get(CONF_SITE))):
                errors["base"] = "already_there"
            else:
                return self.async_create_entry(title=user_input[CONF_NAME], data=self._clean(user_input))
        return self.async_show_form(
            step_id="user", data_schema=self._schema(user_input or self._found()), errors=errors
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            if self._taken(_site_of(self._get_entry(), user_input.get(CONF_SITE)), subentry.subentry_id):
                errors["base"] = "already_there"
            else:
                return self.async_update_and_abort(
                    self._get_entry(), subentry, title=user_input[CONF_NAME], data=self._clean(user_input)
                )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self._schema(user_input or {**subentry.data, CONF_NAME: subentry.title}),
            errors=errors,
        )


def _opt(values: Mapping[str, Any], key: str) -> vol.Optional:
    return vol.Optional(key, description={"suggested_value": values.get(key)})


class SolarSubentryFlow(_PartSubentryFlow):
    """The sun on a place's roof."""

    KIND = SUBENTRY_SOLAR

    def _found(self) -> dict[str, Any]:
        household = getattr(self._get_entry(), "runtime_data", None)
        entity = household.home.solar_power_entity if household is not None else None
        return {CONF_SOLAR_POWER: entity} if entity else {}

    def _fields(self, values: Mapping[str, Any]) -> dict[vol.Marker, Any]:
        return {
            _opt(values, CONF_SOLAR_POWER): POWER_ENTITY_SELECTOR,
            vol.Optional(CONF_SOLAR_FORECAST, default=bool(values.get(CONF_SOLAR_FORECAST, True))): bool,
        }


class BatterySubentryFlow(_PartSubentryFlow):
    """A place's home battery."""

    KIND = SUBENTRY_BATTERY

    def _fields(self, values: Mapping[str, Any]) -> dict[vol.Marker, Any]:
        return {
            _opt(values, CONF_BATTERY_SOC): BATTERY_LEVEL_SELECTOR,
            _opt(values, CONF_BATTERY_POWER): POWER_ENTITY_SELECTOR,
            vol.Optional(CONF_BATTERY_INVERTED, default=bool(values.get(CONF_BATTERY_INVERTED, False))): bool,
            vol.Optional(
                CONF_BATTERY_FIRST, default=values.get(CONF_BATTERY_FIRST, DEFAULT_BATTERY_FIRST)
            ): PERCENT_SELECTOR,
            _opt(values, CONF_BATTERY_HOLD): SWITCH_SELECTOR,
        }


class HeatPumpSubentryFlow(_PartSubentryFlow):
    """A place's heat pump."""

    KIND = SUBENTRY_HEAT_PUMP

    def _fields(self, values: Mapping[str, Any]) -> dict[vol.Marker, Any]:
        return {
            _opt(values, CONF_HEAT_PUMP_POWER): POWER_ENTITY_SELECTOR,
            _opt(values, CONF_HEAT_PUMP_BLOCK): SWITCH_SELECTOR,
        }
