"""Known chargers: power, look, and how their Home Assistant entities fit in.

Choosing a charger fills in the setup: the power, and - when the charger has
a device in Home Assistant - its charge switch, energy meter and the entity
that shows whether a car is plugged in. Everything can still be changed.

``style`` picks one of the panel's own drawings (no manufacturer photos are
shipped); a photo of your own charger can be added in the panel.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
import re
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er

STYLE_BOX = "box"
STYLE_SLIM = "slim"
STYLE_ROUND = "round"
STYLE_POST = "post"
STYLE_PORTABLE = "portable"
STYLE_SOCKET = "socket"
STYLES = (STYLE_BOX, STYLE_SLIM, STYLE_ROUND, STYLE_POST, STYLE_PORTABLE, STYLE_SOCKET)

MODEL_AUTO = "auto"
MODEL_OTHER = "other"

# What a typical Danish home gets out of a 22 kW charger: 3 x 16 A.
TYPICAL_HOME_KW = 11.0


@dataclass(frozen=True, slots=True)
class Brand:
    """Integration domains and the states of its status sensor that mean "no car"."""

    name: str
    domains: tuple[str, ...] = ()
    unplugged: tuple[str, ...] = ()
    aliases: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ChargerModel:
    key: str
    brand: str
    model: str
    power: float
    """Rated power in kW."""
    style: str = STYLE_BOX
    aliases: tuple[str, ...] = field(default=())

    @property
    def title(self) -> str:
        return f"{BRANDS[self.brand].name} {self.model}".strip()

    @property
    def suggested_power(self) -> float:
        """The rated power, but at most what a typical home connection gives."""
        return min(self.power, TYPICAL_HOME_KW)


BRANDS: dict[str, Brand] = {
    "easee": Brand("Easee", ("easee",), ("disconnected",)),
    "zaptec": Brand("Zaptec", ("zaptec",), ("disconnected",)),
    "wallbox": Brand("Wallbox", ("wallbox",), ("ready", "disconnected", "locked")),
    "tesla": Brand("Tesla", ("tesla_wall_connector",), aliases=("tesla motors", "tesla, inc.")),
    "go_e": Brand("go-e", ("goecharger", "goecharger_api2", "go_e"), aliases=("go-e gmbh", "goe")),
    "ohme": Brand("Ohme", ("ohme",), ("unplugged",)),
    "peblar": Brand("Peblar", ("peblar",), ("no_ev_connected",)),
    "alfen": Brand("Alfen", ("alfen_wallbox",), ("available",)),
    "charge_amps": Brand("Charge Amps", ("chargeamps",), ("available", "disconnected"), aliases=("chargeamps",)),
    "myenergi": Brand("myenergi", ("myenergi",), ("ev disconnected",)),
    "keba": Brand("KEBA", ("keba",)),
    "abb": Brand("ABB", ("abb_terra_ac", "ocpp"), ("available",)),
    "defa": Brand("DEFA", ("defa_power", "ocpp"), ("available",)),
    "ctek": Brand("CTEK", ("ctek", "ocpp"), ("available",)),
    "elli": Brand("Elli", ("ocpp",), ("available",)),
    "mennekes": Brand("Mennekes", ("mennekes", "ocpp"), ("available",)),
    "nrgkick": Brand("NRGkick", ("nrgkick",)),
    "autel": Brand("Autel", ("ocpp",), ("available",)),
    "ocpp": Brand("OCPP", ("ocpp",), ("available",)),
    "generic": Brand(""),
}

MODELS: tuple[ChargerModel, ...] = (
    ChargerModel("easee_home", "easee", "Home", 22.0, STYLE_SLIM),
    ChargerModel("easee_charge", "easee", "Charge", 22.0, STYLE_SLIM, ("charge core", "charge lite")),
    ChargerModel("easee_one", "easee", "One", 22.0, STYLE_SLIM),
    ChargerModel("zaptec_go", "zaptec", "Go", 22.0, STYLE_SLIM),
    ChargerModel("zaptec_go2", "zaptec", "Go 2", 22.0, STYLE_SLIM, ("go2",)),
    ChargerModel("zaptec_pro", "zaptec", "Pro", 22.0, STYLE_SLIM),
    ChargerModel("wallbox_pulsar_plus", "wallbox", "Pulsar Plus", 22.0, STYLE_BOX, ("pulsar plus",)),
    ChargerModel("wallbox_pulsar_max", "wallbox", "Pulsar Max", 22.0, STYLE_BOX, ("pulsar max",)),
    ChargerModel("wallbox_pulsar_pro", "wallbox", "Pulsar Pro", 22.0, STYLE_BOX, ("pulsar pro",)),
    ChargerModel("wallbox_commander_2", "wallbox", "Commander 2", 22.0, STYLE_BOX, ("commander",)),
    ChargerModel("wallbox_copper_sb", "wallbox", "Copper SB", 22.0, STYLE_ROUND, ("copper",)),
    ChargerModel("tesla_wall_connector", "tesla", "Wall Connector (Gen 3)", 11.0, STYLE_SLIM, ("wall connector",)),
    ChargerModel("tesla_universal", "tesla", "Universal Wall Connector", 11.0, STYLE_SLIM, ("universal",)),
    ChargerModel("go_e_gemini", "go_e", "Charger Gemini", 22.0, STYLE_ROUND, ("gemini",)),
    ChargerModel("go_e_gemini_flex", "go_e", "Charger Gemini flex", 22.0, STYLE_PORTABLE, ("gemini flex",)),
    ChargerModel("go_e_homefix", "go_e", "Charger HOMEfix", 11.0, STYLE_ROUND, ("homefix",)),
    ChargerModel("ohme_home_pro", "ohme", "Home Pro", 7.4, STYLE_BOX, ("home pro",)),
    ChargerModel("ohme_epod", "ohme", "ePod", 7.4, STYLE_SLIM, ("epod",)),
    ChargerModel("peblar_home", "peblar", "Home", 11.0, STYLE_BOX, ("peblar home",)),
    ChargerModel("peblar_business", "peblar", "Business", 22.0, STYLE_BOX, ("business",)),
    ChargerModel("alfen_eve_single", "alfen", "Eve Single Pro-line", 22.0, STYLE_BOX, ("eve single",)),
    ChargerModel("alfen_eve_double", "alfen", "Eve Double", 22.0, STYLE_POST, ("eve double",)),
    ChargerModel("charge_amps_halo", "charge_amps", "Halo", 11.0, STYLE_SLIM, ("halo",)),
    ChargerModel("charge_amps_aura", "charge_amps", "Aura", 22.0, STYLE_BOX, ("aura",)),
    ChargerModel("charge_amps_dawn", "charge_amps", "Dawn", 22.0, STYLE_ROUND, ("dawn",)),
    ChargerModel("myenergi_zappi", "myenergi", "zappi", 22.0, STYLE_BOX, ("zappi",)),
    ChargerModel("keba_p30", "keba", "KeContact P30", 22.0, STYLE_BOX, ("p30",)),
    ChargerModel("keba_p40", "keba", "KeContact P40", 22.0, STYLE_BOX, ("p40",)),
    ChargerModel("abb_terra_ac", "abb", "Terra AC", 22.0, STYLE_BOX, ("terra ac",)),
    ChargerModel("defa_power", "defa", "Power", 22.0, STYLE_SLIM, ("defa power",)),
    ChargerModel("ctek_chargestorm", "ctek", "Chargestorm Connected 3", 22.0, STYLE_BOX, ("chargestorm",)),
    ChargerModel("elli_charger_2", "elli", "Charger 2 Connect", 11.0, STYLE_BOX, ("charger 2", "wallbox connect")),
    ChargerModel("mennekes_amtron", "mennekes", "AMTRON", 22.0, STYLE_BOX, ("amtron",)),
    ChargerModel("nrgkick_gen2", "nrgkick", "Gen2", 22.0, STYLE_PORTABLE, ("nrgkick",)),
    ChargerModel("autel_maxicharger", "autel", "MaxiCharger AC", 22.0, STYLE_BOX, ("maxicharger",)),
    ChargerModel("ocpp_charger", "ocpp", "charger (OCPP)", 22.0, STYLE_BOX),
    ChargerModel("generic_box", "generic", "Wall charger", 11.0, STYLE_BOX),
    ChargerModel("generic_post", "generic", "Charging post", 22.0, STYLE_POST),
    ChargerModel("generic_portable", "generic", "Portable charger", 11.0, STYLE_PORTABLE),
    ChargerModel("generic_socket", "generic", "Household socket", 2.3, STYLE_SOCKET),
)
MODELS_BY_KEY: dict[str, ChargerModel] = {model.key: model for model in MODELS}


def get_model(key: object) -> ChargerModel | None:
    return MODELS_BY_KEY.get(key) if isinstance(key, str) else None


def model_options() -> list[tuple[str, str]]:
    """(key, label) for a dropdown, generic models last."""

    def label(model: ChargerModel) -> str:
        return f"{model.title} ({model.power:g} kW)"

    named = sorted((m for m in MODELS if m.brand != "generic"), key=lambda m: m.title.casefold())
    generic = [m for m in MODELS if m.brand == "generic"]
    return [(m.key, label(m)) for m in (*named, *generic)]


def _norm(text: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(text or "").casefold()).strip()


def match_model(manufacturer: str | None, model: str | None, domains: Iterable[str] = ()) -> ChargerModel | None:
    """The catalog model that fits a device's manufacturer, model and integration."""
    maker, model_name = _norm(manufacturer), _norm(model)
    domain_set = set(domains)
    brands = [
        key
        for key, brand in BRANDS.items()
        if key != "generic"
        and (
            (maker and (_norm(brand.name) in maker or any(_norm(alias) in maker for alias in brand.aliases)))
            # OCPP is shared by many brands, so it does not name one.
            or domain_set & (set(brand.domains) - {"ocpp"})
        )
    ]
    if not brands and "ocpp" in domain_set:
        brands = ["ocpp"]
    best: ChargerModel | None = None
    best_score = -1
    for candidate in MODELS:
        if candidate.brand not in brands:
            continue
        # "Zaptec Go 2" is model "Go 2" of brand Zaptec.
        name = " ".join(model_name.replace(_norm(BRANDS[candidate.brand].name), " ").split())
        words = [_norm(candidate.model), *(_norm(alias) for alias in candidate.aliases)]
        score = max((len(word) for word in words if word and word in name), default=0)
        if score > best_score:
            best, best_score = candidate, score
    return best


# ----------------------------------------------------------------------
# Entities of a charger device

SWITCH_GOOD = ("charg", "enable", "start", "resume", "charge_control", "pause")
SWITCH_BAD = ("lock", "led", "light", "phase", "smart", "schedul", "eco", "boost", "cable", "update", "auto", "solar")
METER_GOOD = ("total", "lifetime", "meter", "import", "register", "life")
METER_BAD = ("session", "added", "today", "day", "week", "month", "year", "last")
PLUG_GOOD = ("plug", "connected", "cable", "vehicle", "car")
STATUS_GOOD = ("status", "state", "operation", "mode", "cp")
NO_CAR_WORDS = ("disconnect", "unplug", "no_ev", "not_connected", "no car", "no_car", "ev disconnected")


def _words(entry: er.RegistryEntry) -> str:
    return " ".join(
        str(part).casefold()
        for part in (entry.translation_key, entry.original_name, entry.name, entry.entity_id, entry.unique_id)
        if part
    )


def _has_word(text: str, words: Iterable[str]) -> bool:
    """A word in ``text`` starts with one of ``words`` ("led" is not in "is_enabled")."""
    tokens = re.split(r"[^a-z0-9]+", text)
    return any(token.startswith(word) for token in tokens for word in words)


def _score(text: str, good: Iterable[str], bad: Iterable[str] = ()) -> int:
    if _has_word(text, bad):
        return -1
    return sum(1 for word in good if word in text)


def suggest_entities(hass: HomeAssistant, device_id: str, model: ChargerModel | None) -> dict[str, Any]:
    """Guess the switch, energy meter and plugged-in entity of a charger device."""
    registry = er.async_get(hass)
    entries = [entry for entry in er.async_entries_for_device(registry, device_id) if not entry.disabled_by]
    suggested: dict[str, Any] = {}

    switches = [(e, _score(_words(e), SWITCH_GOOD, SWITCH_BAD)) for e in entries if e.domain == "switch"]
    switches = [(e, s) for e, s in switches if s > 0]
    if switches:
        suggested["switch_entity"] = max(switches, key=lambda item: item[1])[0].entity_id

    meters: list[tuple[er.RegistryEntry, int]] = []
    for entry in entries:
        if entry.domain != "sensor" or (entry.device_class or entry.original_device_class) != "energy":
            continue
        text = _words(entry)
        score = 1 + _score(text, METER_GOOD)
        if _has_word(text, METER_BAD):
            score -= 2
        if (entry.capabilities or {}).get("state_class") == "total_increasing":
            score += 1
        meters.append((entry, score))
    if meters:
        suggested["energy_entity"] = max(meters, key=lambda item: item[1])[0].entity_id

    plugs = [
        (e, _score(_words(e), PLUG_GOOD) + (3 if (e.device_class or e.original_device_class) == "plug" else 0))
        for e in entries
        if e.domain == "binary_sensor"
    ]
    plugs = [(e, s) for e, s in plugs if s > 0]
    if plugs:
        suggested["connected_entity"] = max(plugs, key=lambda item: item[1])[0].entity_id
        return suggested

    brand = BRANDS.get(model.brand) if model else None
    statuses = [
        (e, _score(_words(e), STATUS_GOOD) + (1 if (e.device_class or e.original_device_class) == "enum" else 0))
        for e in entries
        if e.domain == "sensor"
    ]
    for entry, _score_value in sorted(statuses, key=lambda item: -item[1]):
        if _score_value <= 0:
            break
        options = [str(o).casefold() for o in (entry.capabilities or {}).get("options") or []]
        unplugged = [o for o in options if any(word in o for word in NO_CAR_WORDS)]
        if not unplugged and brand and brand.unplugged:
            unplugged = [o for o in brand.unplugged if not options or o in options]
        if unplugged:
            suggested["connected_entity"] = entry.entity_id
            suggested["unplugged_states"] = unplugged
            break
    return suggested


def describe_device(hass: HomeAssistant, device_id: str) -> tuple[str | None, ChargerModel | None]:
    """The device's name and the catalog model it matches."""
    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        return None, None
    # Newer Home Assistant: one config entry per device; older: a set of them.
    entry_id: str | None = getattr(device, "config_entry_id", None)
    entry_ids = [entry_id] if entry_id else list(getattr(device, "config_entries", ()))
    domains = [entry.domain for eid in entry_ids if (entry := hass.config_entries.async_get_entry(eid)) is not None]
    manufacturer: str | None = getattr(device, "manufacturer", None)
    model: str | None = getattr(device, "model", None)
    return device.name_by_user or device.name, match_model(manufacturer, model, domains)


def panel_info(config: Mapping[str, Any]) -> dict[str, Any]:
    """What the panel needs to draw a charger."""
    model = get_model(config.get("model"))
    return {
        "model": model.key if model else None,
        "model_title": model.title if model else None,
        "style": model.style if model else STYLE_BOX,
    }
