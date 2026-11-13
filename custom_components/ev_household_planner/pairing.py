"""Places, and finding the car at a charger.

A household can have chargers in more than one place: the home, and say a
summer house. Each place has its own supply, and a zone in Home Assistant the
cars are in when they are there.

A car either has a charger of its own, or its charger is found each time it
is plugged in. When a charger gets a car, EV Planner looks at the cars that
could be the one: those that are at the charger's place, say they are plugged
in, and are not at another charger. One left: that is the car. A car that has
not reported yet is asked to (its "refresh" entity), and when the car still
cannot be told, the household is asked on its phones. Until then the charger
has an unknown car, and is left alone.

The choice itself (``choose``) is plain Python, so it can be tested alone.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util

from .const import (
    ACTION_PAIR,
    CONF_SITE,
    CONF_ZONE,
    GUEST_CHARGER,
    OCCUPANT_GUEST,
    PAIR_ASK_AFTER,
    PAIR_ASK_AFTER_SLOW,
    PAIR_ASK_CAR_AT,
    PAIR_EARLIER,
    PAIR_NO_SENSOR_AFTER,
    PAIR_POWER,
    PAIR_REFRESH_GAP,
    SITE_HOME,
)
from .notifications import COLOR_WARN, tag_for
from .vehicle import elapsed

if TYPE_CHECKING:
    from .household import Charger, Household
    from .vehicle import Vehicle

_LOGGER = logging.getLogger(__name__)

HOME_STATES = ("home", "on", "true")
PRESS_DOMAINS = ("button", "input_button")


# ----------------------------------------------------------------------
# Places


@dataclass(slots=True)
class Site:
    """A place with chargers and a supply of its own. The home is one, and is always there."""

    site_id: str
    name: str
    # The place's settings, with those of its parts (the sun, a home battery, a heat pump) in them.
    data: dict[str, Any] = field(default_factory=dict)
    # Its parts: {"solar": the part's id, ...}.
    parts: dict[str, str] = field(default_factory=dict)

    @property
    def home(self) -> bool:
        return self.site_id == SITE_HOME

    @property
    def zone(self) -> str | None:
        value = self.data.get(CONF_ZONE)
        return str(value) if value else None


def place_matches(hass: HomeAssistant, site: Site, place: str | None) -> bool | None:
    """Whether ``place`` (the state of a car's location entity) is this site. None when it is not known."""
    if place is None or place in (STATE_UNKNOWN, STATE_UNAVAILABLE, ""):
        return None
    text = place.strip().casefold()
    if site.home:
        return text in HOME_STATES
    zone = site.zone
    if not zone:
        return False
    names = {zone.split(".", 1)[-1].casefold()}
    if (state := hass.states.get(zone)) is not None:
        names.add(state.name.strip().casefold())
    return text in names


# ----------------------------------------------------------------------
# The choice


@dataclass(slots=True)
class Candidate:
    """A car that could be the one at a charger."""

    vehicle_id: str
    # What the car says: plugged in, at the charger's place, charging. None: it does not say.
    plugged: bool | None = None
    here: bool | None = None
    charging: bool | None = None
    # When it was seen to be plugged in (None: not known).
    since: datetime | None = None
    # The only car the household has that could be anywhere.
    alone: bool = False


def possible(candidates: list[Candidate], plugged_at: datetime | None) -> list[Candidate]:
    """The cars that can be the one: not unplugged, not elsewhere, and not plugged in long before the charger."""
    return [
        car
        for car in candidates
        if car.plugged is not False
        and car.here is not False
        and not (
            car.plugged is True
            and car.since is not None
            and plugged_at is not None
            and elapsed(plugged_at, car.since) > PAIR_EARLIER
        )
    ]


def choose(candidates: list[Candidate], *, plugged_at: datetime | None, drawing: bool | None) -> str | None:
    """The car at the charger, when it can be told; else None.

    One car that says it is plugged in is the one. With several, the charger's
    power tells them apart when it can: the one car that charges while the
    charger gives power, or the one that does not while it gives none. When no
    car says it is plugged in, a car without a plug sensor is the one when it
    is the only one that is here.
    """
    cars = possible(candidates, plugged_at)
    sure = [car for car in cars if car.plugged is True]
    if len(sure) == 1:
        return sure[0].vehicle_id
    if len(sure) > 1:
        if drawing is None or any(car.charging is None for car in sure):
            return None
        same = [car for car in sure if car.charging is drawing]
        return same[0].vehicle_id if len(same) == 1 else None
    blind = [car for car in cars if car.plugged is None]
    if len(blind) == 1 and (blind[0].here is True or blind[0].alone):
        return blind[0].vehicle_id
    return None


# ----------------------------------------------------------------------
# In the household


class Pairing:
    """Which car is at which charger, for one household."""

    def __init__(self, household: Household) -> None:
        self.household = household
        # When the household was asked about a charger, and when each car was asked to report for it.
        self._asked: dict[str, datetime] = {}
        self._refreshed: dict[str, dict[str, list[datetime]]] = {}

    @property
    def hass(self) -> HomeAssistant:
        return self.household.hass

    # ------------------------------------------------------------------
    # Places

    def site_of(self, charger: Charger | None) -> Site:
        sites = self.household.sites
        if charger is None:
            return sites[SITE_HOME]
        return sites[self.household.site_key(charger.config.get(CONF_SITE))]

    def place_site(self, vehicle: Vehicle) -> Site | None:
        """The place the car's location entity says it is at (None: not at one, or not known)."""
        if vehicle.home_entity is None:
            return None
        for site in self.household.sites.values():
            if place_matches(self.hass, site, vehicle.place) is True:
                return site
        return None

    def at_a_site(self, place: str | None) -> bool | None:
        """Whether a location is one of the household's places (None: not known)."""
        answers = [place_matches(self.hass, site, place) for site in self.household.sites.values()]
        if any(answer is True for answer in answers):
            return True
        return None if any(answer is None for answer in answers) else False

    def vehicle_site(self, vehicle: Vehicle) -> Site | None:
        """The place whose supply the car draws on: its charger's, else where it is.

        A car without a location entity is taken to be at home. None: the car
        is away.
        """
        charger = self.household.chargers.get(vehicle.charger_id or "")
        if charger is not None:
            return self.site_of(charger)
        if vehicle.home_entity is None:
            return self.household.sites[SITE_HOME]
        return self.place_site(vehicle)

    def here(self, vehicle: Vehicle, site: Site) -> bool | None:
        if vehicle.home_entity is None:
            return None
        return place_matches(self.hass, site, vehicle.place)

    # ------------------------------------------------------------------
    # Who could be where

    def floats(self, vehicle: Vehicle) -> bool:
        """The car's charger is found: it has none of its own, or it is at another place than its own."""
        if vehicle.finds_charger:
            return True
        fixed = self.household.chargers.get(vehicle.fixed_charger or "")
        if fixed is None:
            return False
        site = self.place_site(vehicle)
        return site is not None and site is not self.site_of(fixed)

    def _floating(self) -> list[Vehicle]:
        return [vehicle for vehicle in self.household.vehicles.values() if self.floats(vehicle)]

    def occupant(self, charger: Charger) -> str | None:
        """Who is at the charger: a car's id, ``guest``, or None (nobody, or not known)."""
        household = self.household
        if charger.occupant is not None:
            return charger.occupant
        now = household.now()
        if household.guest.charger_id == charger.charger_id and household.guest.session_active(now):
            return OCCUPANT_GUEST
        if charger.connected is False:
            return None
        own = [
            vehicle
            for vehicle in household.vehicles.values()
            if vehicle.at_charger == charger.charger_id and not self.floats(vehicle)
        ]
        plugged = [vehicle for vehicle in own if vehicle.connected is True]
        if len(plugged) == 1:
            return plugged[0].vehicle_id
        if charger.connected is True and not plugged:
            blind = [vehicle for vehicle in own if vehicle.connected is None]
            if len(blind) == 1 and not self._free():
                return blind[0].vehicle_id
        return None

    def _free(self) -> list[Vehicle]:
        """The cars whose charger is found, that are at none."""
        return [vehicle for vehicle in self._floating() if vehicle.at_charger is None]

    def unknown(self, charger: Charger) -> bool:
        """A car is plugged in to the charger, and it is not known which."""
        return (
            charger.connected is True
            and self.occupant(charger) is None
            and bool(self._candidates(charger, self._free()))
        )

    def _candidates(self, charger: Charger, free: list[Vehicle]) -> list[Candidate]:
        site = self.site_of(charger)
        alone = len(self._floating()) == 1
        return [
            Candidate(
                vehicle.vehicle_id,
                plugged=vehicle.connected,
                here=self.here(vehicle, site),
                charging=vehicle.charging,
                since=vehicle.connected_since,
                alone=alone,
            )
            for vehicle in free
        ]

    def choices(self, charger: Charger) -> list[str]:
        """The cars the household can say are at the charger, the likeliest first.

        The cars that fit come first; the others follow, as a car that says it
        is away may be the one that has not reported yet.
        """
        cars = self._candidates(charger, self._free())
        fits = {car.vehicle_id for car in possible(cars, charger.plugged_at)}
        vehicles = self.household.vehicles
        cars.sort(
            key=lambda car: (
                car.vehicle_id not in fits,
                car.plugged is not True,
                vehicles[car.vehicle_id].name.casefold(),
            )
        )
        return [car.vehicle_id for car in cars]

    def _drawing(self, charger: Charger) -> bool | None:
        power = self.household.charger_power(charger)
        if power is None:
            return None
        return power >= PAIR_POWER

    # ------------------------------------------------------------------
    # Finding

    def restore(self) -> None:
        """After a restart: what was stored is kept only where the charger is still there."""
        chargers = self.household.chargers
        for vehicle in self.household.vehicles.values():
            if vehicle.at_charger is not None and vehicle.at_charger not in chargers:
                vehicle.at_charger = None
        for charger in chargers.values():
            who = charger.occupant
            if who is None or who == OCCUPANT_GUEST:
                continue
            owner = self.household.vehicles.get(who)
            if owner is None or owner.at_charger != charger.charger_id:
                charger.occupant = None

    def _unpair(self, vehicle: Vehicle) -> None:
        charger = self.household.chargers.get(vehicle.at_charger or "")
        if charger is not None and charger.occupant == vehicle.vehicle_id:
            charger.occupant = None
        vehicle.at_charger = None

    def _pair(self, vehicle: Vehicle, charger: Charger, why: str) -> None:
        if vehicle.at_charger != charger.charger_id:
            self._unpair(vehicle)
        vehicle.at_charger = charger.charger_id
        charger.occupant = vehicle.vehicle_id
        charger.found_by = why
        _LOGGER.debug("%s is at %s (%s)", vehicle.name, charger.name, why)
        self.household.events.add(dt_util.now(), "paired", vehicle=vehicle.name, charger=charger.name, by=why)

    def resolve(self, now: datetime) -> bool:
        """Bring cars and chargers together from what they say now. True when something changed."""
        household = self.household
        chargers = household.chargers
        before = {vehicle.vehicle_id: vehicle.at_charger for vehicle in household.vehicles.values()}
        occupants = {charger.charger_id: charger.occupant for charger in chargers.values()}

        for vehicle in household.vehicles.values():
            if not self.floats(vehicle):
                # A car with a charger of its own is at it, plugged in or not.
                fixed = vehicle.fixed_charger
                vehicle.at_charger = fixed if fixed in chargers else None
                continue
            charger = chargers.get(vehicle.at_charger or "")
            if charger is None:
                vehicle.at_charger = None
                continue
            # What the household chose itself stands until the charger says the car is gone: the car
            # may be the one that has not reported yet.
            chosen = (
                charger.occupant == vehicle.vehicle_id
                and charger.found_by == "chosen"
                and charger.connected_entity is not None
            )
            gone = charger.connected is False or (
                not chosen and (vehicle.connected is False or self.here(vehicle, self.site_of(charger)) is False)
            )
            if gone:
                self._unpair(vehicle)

        for charger in chargers.values():
            who = charger.occupant
            if charger.connected is False:
                charger.occupant = None
                charger.plugged_at = None
            elif who not in (None, OCCUPANT_GUEST):
                owner = household.vehicles.get(str(who))
                if owner is None or owner.at_charger != charger.charger_id:
                    charger.occupant = None
            if charger.connected is not True or charger.occupant is not None:
                self._asked.pop(charger.charger_id, None)
                self._refreshed.pop(charger.charger_id, None)

        # A charger with a plug sensor that got a car: the car that fits.
        for charger in chargers.values():
            if charger.connected is not True or charger.connected_entity is None:
                continue
            if self.occupant(charger) is not None:
                continue
            free = self._free()
            if not free:
                break
            found = choose(
                self._candidates(charger, free), plugged_at=charger.plugged_at, drawing=self._drawing(charger)
            )
            if found is not None:
                self._pair(household.vehicles[found], charger, "found")

        # A plugged-in car that no charger took: the charger without a plug sensor at its place,
        # when there is one, and no charger with a sensor is waiting for its car.
        for vehicle in self._free():
            if vehicle.connected is not True:
                continue
            since = vehicle.connected_since
            if since is not None and elapsed(now, since) < PAIR_NO_SENSOR_AFTER:
                continue
            spots = []
            waiting = False
            for charger in chargers.values():
                if self.here(vehicle, self.site_of(charger)) is False:
                    continue
                if self.occupant(charger) is not None:
                    continue
                if charger.connected_entity is None:
                    spots.append(charger)
                elif charger.connected is True:
                    waiting = True
            if len(spots) == 1 and not waiting:
                self._pair(vehicle, spots[0], "only_charger")

        return before != {
            vehicle.vehicle_id: vehicle.at_charger for vehicle in household.vehicles.values()
        } or occupants != {charger.charger_id: charger.occupant for charger in chargers.values()}

    # ------------------------------------------------------------------
    # Asking the cars, and the household

    async def async_follow_up(self, now: datetime) -> None:
        """For each charger that got a car: ask the cars to report, then, if still unknown, the household."""
        household = self.household
        free = self._free()
        for charger in household.chargers.values():
            cid = charger.charger_id
            tag = tag_for("pair", cid)
            await self._async_ask_cars(charger, free, now)
            if not self.unknown(charger):
                if charger.asked:
                    charger.asked = False
                    await household.notifier.clear(tag)
                continue
            if charger.plugged_at is None:
                # Plugged in before EV Planner saw it: shown in the panel, where the car can be chosen.
                continue
            if household.charger_open(charger):
                # An open place (a summer house let out): a car nobody knows charges, and nobody is asked.
                continue
            cars = self._candidates(charger, free)
            log = self._refreshed.get(cid, {})
            sure = [car for car in possible(cars, charger.plugged_at) if car.plugged is True]
            if cid in self._asked or not household.notifier.enabled:
                continue
            asked_cars = any(log.values())
            wait = PAIR_ASK_AFTER if asked_cars or len(sure) > 1 else PAIR_ASK_AFTER_SLOW
            if elapsed(now, charger.plugged_at) < wait:
                continue
            self._asked[cid] = now
            charger.asked = True
            names = self.choices(charger)[:2]
            actions = [{"action": f"{ACTION_PAIR}_{cid}_{vid}", "title": household.vehicles[vid].name} for vid in names]
            actions.append({"action": f"{ACTION_PAIR}_{cid}_{OCCUPANT_GUEST}", "title": household.text("pair_guest")})
            await household.notifier.send(
                title=charger.name,
                message=household.text("pair_ask", charger=charger.name),
                tag=tag,
                icon="mdi:ev-plug-type2",
                color=COLOR_WARN,
                actions=actions,
            )

    async def _async_ask_cars(self, charger: Charger, free: list[Vehicle], now: datetime) -> None:
        """A car is plugged in to the charger, and the car itself has not said so: ask it to report.

        Its cloud asks the car every few minutes, so the car is asked after one, three and eight
        minutes: the first time the car and the charger may not yet be done talking.
        """
        if charger.connected is not True or charger.plugged_at is None:
            return
        cid = charger.charger_id
        cars = [
            vehicle
            for vehicle in self.household.vehicles.values()
            # A car that may be anywhere is asked too: its location may be as old as its plug.
            if vehicle.charger_id == cid or vehicle.fixed_charger == cid or (vehicle in free and self.unknown(charger))
        ]
        if any(vehicle.connected_car is True for vehicle in cars):
            return  # the car at it has reported
        log = self._refreshed.setdefault(cid, {})
        for vehicle in cars:
            if vehicle.refresh_entity is None:
                continue
            times = log.setdefault(vehicle.vehicle_id, [])
            if len(times) >= len(PAIR_ASK_CAR_AT) or now < charger.plugged_at + PAIR_ASK_CAR_AT[len(times)]:
                continue
            if vehicle.refreshed_at is not None and elapsed(now, vehicle.refreshed_at) < PAIR_REFRESH_GAP:
                continue
            times.append(now)
            vehicle.refreshed_at = now
            self.household.events.add(
                now,
                "asked_car",
                vehicle=vehicle.name,
                charger=charger.name,
                entity=vehicle.refresh_entity,
                time=len(times),
            )
            await self._async_refresh(vehicle)

    async def async_ask_unplugged(self, charger_id: str, vehicle_ids: list[str], now: datetime) -> None:
        """The charger's plug came out: a car that was at it and still says it is plugged in is asked to report.

        Its cloud may not ask the car for long, and until it does the car and the charger stay taken.
        """
        charger = self.household.chargers.get(charger_id)
        if charger is None or charger.connected is not False:
            return  # plugged in again
        for vehicle_id in vehicle_ids:
            vehicle = self.household.vehicles.get(vehicle_id)
            if vehicle is None or vehicle.refresh_entity is None or vehicle.connected_car is False:
                continue
            if vehicle.refreshed_at is not None and elapsed(now, vehicle.refreshed_at) < PAIR_REFRESH_GAP:
                continue
            vehicle.refreshed_at = now
            self.household.events.add(
                now,
                "asked_car",
                vehicle=vehicle.name,
                charger=charger.name,
                entity=vehicle.refresh_entity,
                why="unplugged",
            )
            await self._async_refresh(vehicle)

    async def _async_refresh(self, vehicle: Vehicle) -> None:
        """Make the car's integration ask the car now: press its button, run its script, or update its entity."""
        entity = vehicle.refresh_entity
        if entity is None:
            return
        domain = entity.split(".", 1)[0]
        if domain in PRESS_DOMAINS:
            call = (domain, "press")
        elif domain == "script":
            call = ("script", "turn_on")
        else:
            call = ("homeassistant", "update_entity")
        try:
            await self.hass.services.async_call(*call, {"entity_id": entity}, blocking=False)
        except HomeAssistantError as err:
            _LOGGER.warning("Could not ask %s to report with %s: %s", vehicle.name, entity, err)

    def action(self, action: str) -> tuple[str, str] | None:
        """A tap on the question's answer: (charger id, car id or ``guest``), when it is one."""
        prefix = f"{ACTION_PAIR}_"
        if not action.startswith(prefix):
            return None
        rest = action[len(prefix) :]
        for cid in self.household.chargers:
            if rest.startswith(f"{cid}_"):
                who = rest[len(cid) + 1 :]
                if who == OCCUPANT_GUEST or who in self.household.vehicles:
                    return cid, who
        return None

    async def async_set(self, charger_id: str, who: str | None) -> None:
        """The household says who is at a charger: a car, the guest, or (None) find it again."""
        household = self.household
        charger = household.chargers[charger_id]
        current = charger.occupant
        was = household.vehicles.get(str(current)) if current not in (None, OCCUPANT_GUEST) else None
        if was is not None and self.floats(was):
            self._unpair(was)
        charger.occupant = None
        if who == OCCUPANT_GUEST:
            charger.occupant = OCCUPANT_GUEST
            charger.found_by = "chosen"
            await household.guest.async_set_input(GUEST_CHARGER, charger_id)
        elif who is not None:
            vehicle = household.vehicles[who]
            if self.floats(vehicle):
                self._pair(vehicle, charger, "chosen")
        if charger.asked:
            charger.asked = False
            await household.notifier.clear(tag_for("pair", charger_id))
        self._asked[charger_id] = household.now()
        household.async_save()
        await household.async_recalculate(force=True)
