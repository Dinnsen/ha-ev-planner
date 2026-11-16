"""License plate lookup for guest cars (from EV Guest)."""

from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher
import logging
import re
import time
from typing import Any

from aiohttp import ClientError, ClientSession, ClientTimeout

from .const import (
    COUNTRY_DENMARK,
    DEFAULT_PLATE_PROVIDER,
    MOTORAPI_BASE_URL,
    NHTSA_DECODE_URL,
    OPEN_EV_DATA_FALLBACK_URL,
    OPEN_EV_DATA_URL,
    USER_AGENT,
)

_LOGGER = logging.getLogger(__name__)

REQUEST_TIMEOUT = ClientTimeout(total=20)
DATASET_TIMEOUT = ClientTimeout(total=30)
DATASET_MAX_AGE = 24 * 3600


class PlateLookupError(Exception):
    """Base lookup exception."""


class PlateAuthError(PlateLookupError):
    """Authentication error."""


class PlateLookupFailed(PlateLookupError):
    """Lookup error."""


@dataclass(slots=True)
class VehicleLookupResult:
    """Normalized vehicle result."""

    plate: str
    vin: str | None
    brand: str | None
    model: str | None
    variant: str | None
    model_year: int | None
    fuel_type: str | None
    source: str
    raw: dict[str, Any]


@dataclass(slots=True)
class BatteryLookupResult:
    """Battery lookup result."""

    battery_capacity: float | None
    source: str
    match_score: float | None
    raw: dict[str, Any] | None
    # The batteries the car could have, when the data cannot tell them apart: [{"kwh", "label"}], likeliest first.
    options: list[dict[str, Any]] = field(default_factory=list)


PLATE_PROVIDER_REGISTRY: dict[str, dict[str, Any]] = {
    COUNTRY_DENMARK: {
        "default": DEFAULT_PLATE_PROVIDER,
        "providers": {
            DEFAULT_PLATE_PROVIDER: {
                "label": "MotorAPI Denmark",
                "auth": "api_key",
                "docs": "https://motorapi.dk/",
            }
        },
    }
}


def clean_identifier(value: str) -> str:
    """Normalize plate/VIN strings."""
    return re.sub(r"[^A-Za-z0-9]", "", value or "").upper()


def normalize_text(value: str | None) -> str:
    """Normalize free text for matching."""
    if not value:
        return ""
    return re.sub(r"[^a-z0-9+]", "", value.lower())


def get_supported_countries() -> list[str]:
    """Return currently supported countries."""
    return list(PLATE_PROVIDER_REGISTRY)


def get_default_plate_provider(country: str | None) -> str:
    """Return the default vehicle lookup provider for a country."""
    if not country:
        return DEFAULT_PLATE_PROVIDER
    return str(PLATE_PROVIDER_REGISTRY.get(country, {}).get("default", DEFAULT_PLATE_PROVIDER))


def get_supported_plate_providers(country: str | None) -> dict[str, Any]:
    """Return the provider mapping for a country."""
    if not country:
        country = COUNTRY_DENMARK
    providers: dict[str, Any] = PLATE_PROVIDER_REGISTRY.get(country, {}).get("providers", {})
    return providers


def _extract_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = re.search(r"([0-9]+(?:[\.,][0-9]+)?)", value)
        if match:
            return float(match.group(1).replace(",", "."))
    return None


async def async_validate_motorapi_key(session: ClientSession, api_key: str) -> None:
    """Validate the MotorAPI key with a harmless request."""
    if not api_key:
        raise PlateAuthError("missing_api_key")

    url = f"{MOTORAPI_BASE_URL}/vehicles/AA00000"
    headers = {"User-Agent": USER_AGENT, "X-AUTH-TOKEN": api_key}

    try:
        async with session.get(url, headers=headers, timeout=REQUEST_TIMEOUT) as resp:
            if resp.status == 401:
                raise PlateAuthError("invalid_auth")
            if resp.status in (200, 404):
                return
            raise PlateLookupFailed(f"unexpected_http_{resp.status}")
    except ClientError as err:
        raise PlateLookupFailed("cannot_connect") from err
    except TimeoutError as err:
        raise PlateLookupFailed("timeout") from err


async def async_validate_plate_provider_credentials(
    session: ClientSession,
    country: str | None,
    provider: str | None,
    api_key: str,
) -> None:
    """Validate credentials for the selected provider."""
    provider_id = provider or get_default_plate_provider(country)
    if provider_id == DEFAULT_PLATE_PROVIDER:
        await async_validate_motorapi_key(session, api_key)
        return
    raise PlateLookupFailed("unsupported_provider")


async def async_lookup_vehicle(
    session: ClientSession,
    plate: str,
    api_key: str,
    country: str | None,
    provider: str | None = None,
) -> VehicleLookupResult:
    """Look up vehicle data using the selected provider."""
    provider_id = provider or get_default_plate_provider(country)
    if provider_id == DEFAULT_PLATE_PROVIDER:
        return await async_lookup_vehicle_motorapi(session, plate, api_key)
    raise PlateLookupFailed("unsupported_provider")


async def async_lookup_vehicle_motorapi(session: ClientSession, plate: str, api_key: str) -> VehicleLookupResult:
    """Look up vehicle data using MotorAPI."""
    plate = clean_identifier(plate)
    if not plate:
        raise PlateLookupFailed("empty_plate")
    if not api_key:
        raise PlateAuthError("missing_api_key")

    url = f"{MOTORAPI_BASE_URL}/vehicles/{plate}"
    headers = {"User-Agent": USER_AGENT, "X-AUTH-TOKEN": api_key}
    try:
        async with session.get(url, headers=headers, timeout=REQUEST_TIMEOUT) as resp:
            if resp.status == 401:
                raise PlateAuthError("invalid_auth")
            if resp.status == 404:
                raise PlateLookupFailed("vehicle_not_found")
            if resp.status != 200:
                raise PlateLookupFailed(f"unexpected_http_{resp.status}")
            data = await resp.json()
    except ClientError as err:
        raise PlateLookupFailed("cannot_connect") from err
    except TimeoutError as err:
        raise PlateLookupFailed("timeout") from err

    return VehicleLookupResult(
        plate=plate,
        vin=data.get("vin"),
        brand=data.get("make") or data.get("brand"),
        model=data.get("model"),
        variant=data.get("variant") or data.get("version") or data.get("type_name"),
        # The register's model year is often missing (0): the year of first registration is near enough.
        model_year=_extract_year(data.get("model_year"))
        or _year_in(
            data.get("first_registration") or data.get("first_registration_date") or data.get("registration_date")
        ),
        fuel_type=data.get("fuel_type"),
        source="MotorAPI",
        raw=data,
    )


async def async_decode_vin_nhtsa(
    session: ClientSession, vin: str, model_year: int | None = None
) -> VehicleLookupResult | None:
    """Decode a VIN using NHTSA vPIC."""
    vin = clean_identifier(vin)
    if not vin:
        return None

    url = NHTSA_DECODE_URL.format(vin=vin)
    if model_year:
        url += f"&modelyear={model_year}"
    try:
        async with session.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT) as resp:
            if resp.status != 200:
                return None
            payload = await resp.json()
    except (ClientError, TimeoutError):
        return None

    results = payload.get("Results") if isinstance(payload, dict) else None
    if not isinstance(results, list) or not results:
        return None
    row = results[0]
    if not isinstance(row, dict):
        return None

    return VehicleLookupResult(
        plate="",
        vin=vin,
        brand=row.get("Make") or row.get("Manufacturer"),
        model=row.get("Model"),
        variant=row.get("Trim") or row.get("Series"),
        model_year=_extract_year(row.get("ModelYear")) or model_year,
        fuel_type=row.get("FuelTypePrimary"),
        source="NHTSA vPIC",
        raw=row,
    )


async def async_lookup_battery_open_ev_data(
    session: ClientSession,
    brand: str | None,
    model: str | None,
    variant: str | None,
    model_year: int | None,
    cache: dict[str, Any] | None = None,
) -> BatteryLookupResult:
    """Look up battery data in Open EV Data.

    The dataset is several megabytes. Pass ``cache`` (any dict that lives on,
    e.g. in ``hass.data``) to download it at most once a day.
    """
    dataset = await _async_cached_dataset(session, cache)
    candidates = _extract_candidates(dataset)
    if not candidates:
        return BatteryLookupResult(None, "Open EV Data", None, None)

    scored = sorted(
        ((_score_candidate(item, brand, model, variant, model_year), item) for item in candidates),
        key=lambda item: item[0],
        reverse=True,
    )
    best_score, best = scored[0]
    if best_score < 45:
        return BatteryLookupResult(None, "Open EV Data", best_score, best)
    # The variants that fit about as well: when their batteries differ, the household chooses.
    options: list[dict[str, Any]] = []
    for score, item in scored:
        if score < max(45.0, best_score - 15):
            break
        kwh = item.get("battery_capacity")
        if kwh is None or any(abs(kwh - known["kwh"]) < 1.0 for known in options):
            continue
        label = " ".join(str(part) for part in (item.get("variant"), item.get("model_year")) if part)
        options.append({"kwh": round(float(kwh), 1), "label": label})
        if len(options) >= 6:
            break
    return BatteryLookupResult(best.get("battery_capacity"), "Open EV Data", best_score, best, options)


async def _async_cached_dataset(session: ClientSession, cache: dict[str, Any] | None) -> Any:
    if cache is not None and cache.get("data") and time.monotonic() - cache.get("fetched", 0.0) < DATASET_MAX_AGE:
        return cache["data"]
    dataset = await _async_fetch_open_ev_dataset(session)
    if cache is not None and dataset:
        cache.update(data=dataset, fetched=time.monotonic())
    return dataset


async def _async_fetch_open_ev_dataset(session: ClientSession) -> Any:
    for url in (OPEN_EV_DATA_URL, OPEN_EV_DATA_FALLBACK_URL):
        try:
            async with session.get(url, headers={"User-Agent": USER_AGENT}, timeout=DATASET_TIMEOUT) as resp:
                if resp.status == 200:
                    return await resp.json(content_type=None)
        except (ClientError, TimeoutError):
            _LOGGER.debug("Could not fetch Open EV Data from %s", url)
    return []


def _extract_year(value: Any) -> int | None:
    try:
        if value in (None, ""):
            return None
        year = int(value)
    except (TypeError, ValueError):
        return None
    return year if year > 1900 else None


def _year_in(value: Any) -> int | None:
    """The year in a date as the register writes it (2021-05-03, 03-05-2021)."""
    found = re.search(r"(19|20)\d{2}", str(value or ""))
    return int(found.group(0)) if found else None


def battery_from_vin(decoded: VehicleLookupResult | None) -> float | None:
    """The battery NHTSA's decoding of the VIN gives, when it gives one (kWh)."""
    raw = decoded.raw if decoded is not None else {}
    for key in ("BatteryKWh", "BatteryKWh_to"):
        value = _extract_float(raw.get(key))
        if value is not None and 10 <= value <= 250:
            return value
    return None


# Tesla's own VIN: positions 1-3 the maker, 4 the model, 7 the battery (F and Q: LFP), 8 the motors, 10 the year.
TESLA_MAKERS = ("5YJ", "7SA", "LRW", "XP7", "7G2")
TESLA_YEARS = {code: 2010 + index for index, code in enumerate("ABCDEFGHJKLMNPRSTVWXY")}
TESLA_DUAL = {"B", "C", "E", "K", "L", "Q", "T", "N", "P"}
TESLA_SINGLE = {"A", "D", "G", "J", "R", "S"}


def tesla_vin(vin: str | None) -> dict[str, Any] | None:
    """What a Tesla's VIN says of its battery: LFP or not, one motor or two, and the year."""
    vin = clean_identifier(vin or "")
    if len(vin) != 17 or not vin.startswith(TESLA_MAKERS):
        return None
    model, cell, motor = vin[3], vin[6], vin[7]
    dual = True if motor in TESLA_DUAL and model in "3Y" else False if motor in TESLA_SINGLE else None
    return {"model": model, "lfp": cell in "FQ", "dual": dual, "year": TESLA_YEARS.get(vin[9])}


def battery_from_tesla_vin(vin: str | None) -> float | None:
    """A Model 3 or Y with LFP cells has Tesla's 60 kWh pack from 2021 on (55 kWh before): the VIN says which."""
    info = tesla_vin(vin)
    if info is None or not info["lfp"] or info["model"] not in "3Y":
        return None
    year = info["year"]
    return 55.0 if year is not None and year < 2021 else 60.0


def fits_drive(label: str, dual: bool | None) -> bool:
    """Whether a dataset variant fits a car with two motors (``dual``) or one."""
    if dual is None:
        return True
    text = label.lower()
    two = re.search(r"\b(lr|long range|performance|dual|awd|4wd|4x4|all.wheel)\b", text) is not None
    if re.search(r"\b(rwd|fwd|single)\b", text) and not re.search(r"\b(awd|dual|performance)\b", text):
        two = False
    return two == dual


def _extract_candidates(node: Any, inherited_brand: str | None = None) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    if isinstance(node, list):
        for child in node:
            items.extend(_extract_candidates(child, inherited_brand=inherited_brand))
        return items
    if not isinstance(node, dict):
        return items

    brand = node.get("brand") or node.get("make") or inherited_brand
    model = node.get("model") or (node.get("name") if node.get("battery") or node.get("variant") else None)
    variant = node.get("variant") or node.get("trim") or node.get("version")
    year = _extract_year(node.get("model_year") or node.get("release_year") or node.get("year"))

    battery = None
    for key in (
        "battery_capacity",
        "battery_capacity_kwh",
        "usable_battery_size",
        "usable_battery_capacity",
        "nominal_battery_capacity",
        "battery_size",
        "usable_kwh",
        "battery_kwh",
    ):
        battery = _extract_float(node.get(key))
        if battery is not None:
            break
    if battery is None and isinstance(node.get("battery"), dict):
        battery = (
            _extract_float(node["battery"].get("usable_kwh"))
            or _extract_float(node["battery"].get("usable"))
            or _extract_float(node["battery"].get("nominal_kwh"))
            or _extract_float(node["battery"].get("capacity"))
        )

    if brand and model and battery is not None:
        items.append(
            {
                "brand": brand,
                "model": model,
                "variant": variant,
                "model_year": year,
                "battery_capacity": battery,
            }
        )

    for value in node.values():
        if isinstance(value, (list, dict)):
            items.extend(_extract_candidates(value, inherited_brand=brand))
    return items


def _score_candidate(
    candidate: dict[str, Any], brand: str | None, model: str | None, variant: str | None, model_year: int | None
) -> float:
    score = 0.0
    cand_brand = normalize_text(candidate.get("brand"))
    cand_model = normalize_text(candidate.get("model"))
    cand_variant = normalize_text(candidate.get("variant"))
    brand_n = normalize_text(brand)
    model_n = normalize_text(model)
    variant_n = normalize_text(variant)
    if re.fullmatch(r"\d+\s*kw", variant_n or ""):
        variant_n = ""  # the register's "208 KW" is the motor, not a variant the dataset knows

    if brand_n and cand_brand:
        score += 35 if brand_n == cand_brand else 15 * SequenceMatcher(None, brand_n, cand_brand).ratio()
    if model_n and cand_model:
        score += 40 if model_n == cand_model else 18 * SequenceMatcher(None, model_n, cand_model).ratio()
    if variant_n and cand_variant:
        if variant_n == cand_variant:
            score += 30
        elif variant_n in cand_variant or cand_variant in variant_n:
            score += 24
        else:
            score += 12 * SequenceMatcher(None, variant_n, cand_variant).ratio()
    elif not variant_n:
        score += 8

    cand_year = candidate.get("model_year")
    if model_year and cand_year:
        if model_year == cand_year:
            score += 10
        elif abs(model_year - cand_year) <= 1:
            score += 6
    return score
