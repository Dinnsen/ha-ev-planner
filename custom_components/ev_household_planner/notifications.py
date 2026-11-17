"""Notifications from EV Planner: normal ones with icons, and live ones.

Live notifications are the Home Assistant Companion app's Live Activities
(iOS 17.2+) and Live Updates (Android): a notification sent with
``live_update: true`` and a ``tag`` that is updated in place and ended with
``clear_notification``. They need Home Assistant 2026.7 or newer and a
``notify.mobile_app_*`` action. Other notify actions get a normal message.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable, Mapping
from datetime import datetime
import logging
import re
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN, MESSAGE_ALWAYS, MESSAGE_THROUGH

_LOGGER = logging.getLogger(__name__)

NOTIFY = "notify"
GROUP = "ev-planner"
PANEL_PATH = "/ev-planner"

COLOR_CHARGE = "#00B894"
COLOR_WARN = "#E9B949"
COLOR_ERROR = "#E4572E"
# On iOS a notification's icon is a glyph (notification_icon_color) on a round
# badge (color); a white glyph shows on any of the colours above.
COLOR_GLYPH = "#FFFFFF"


def service_name(service: str) -> str:
    """``notify.mobile_app_x`` or ``mobile_app_x`` to ``mobile_app_x``."""
    return service.split(".", 1)[1] if service.startswith(f"{NOTIFY}.") else service


def is_mobile_app(service: str) -> bool:
    return service_name(service).startswith("mobile_app_")


def tag_for(kind: str, key: str) -> str:
    """A tag the companion app accepts: letters, digits, - and _ only, at most 64 characters."""
    raw = f"evp_{kind}_{key}"
    clean = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in raw)
    return clean[:64]


TAG = re.compile(r"^evp_([a-z]+)_(.+)$")


def kind_of(tag: str) -> tuple[str | None, str | None]:
    """The message centre's kind of a notification, and the car (or charger) it is about, from its tag."""
    if tag.startswith(f"{DOMAIN}_insight"):
        return "pick", None
    found = TAG.match(tag)
    return (found.group(1), found.group(2)) if found else (None, None)


class Notifier:
    """Send EV Planner notifications to the chosen notify actions."""

    def __init__(
        self,
        hass: HomeAssistant,
        services: Iterable[str],
        note: Callable[..., None] | None = None,
        *,
        quiet: Callable[[], bool] | None = None,
        off: Callable[[], bool] | None = None,
        rules: Callable[[], Mapping[str, Mapping[str, Any]]] | None = None,
        digest: Callable[[], bool] | None = None,
    ) -> None:
        self.hass = hass
        self.services: list[str] = []
        self.set_services(services)
        # Whether notifications are held back now (turned off, or the quiet hours).
        self._quiet = quiet
        # Turned off altogether (then nothing goes, not even what goes through the quiet hours).
        self._off = off
        # The message centre's choices for each kind of message.
        self._rules = rules
        # What is held back in the quiet hours comes as one message when they end.
        self._digest = digest
        self.waiting: list[tuple[str, str]] = []
        # Live notifications taken away for the quiet hours, so it is done once.
        self._hushed: set[str] = set()
        # Writes each notification in the event log (the support export).
        self._note = note

    @property
    def enabled(self) -> bool:
        return bool(self.services)

    def targets(self, chosen: Iterable[str] | None) -> list[str]:
        """The household's notify actions, narrowed to a car's own choice when it has one."""
        if not chosen:
            return self.services
        wanted = {service_name(service) for service in chosen if service}
        return [service for service in self.services if service in wanted] or self.services

    async def _call(self, service: str, data: Mapping[str, Any]) -> None:
        if not self.hass.services.has_service(NOTIFY, service):
            _LOGGER.debug("Notify action notify.%s does not exist", service)
            return
        try:
            await self.hass.services.async_call(NOTIFY, service, dict(data), blocking=False)
        except HomeAssistantError as err:  # pragma: no cover - depends on the notify integration
            _LOGGER.warning("Could not notify with notify.%s: %s", service, err)

    async def send(
        self,
        *,
        title: str,
        message: str,
        tag: str,
        icon: str,
        color: str = COLOR_CHARGE,
        actions: list[dict[str, str]] | None = None,
        to: Iterable[str] | None = None,
        progress: tuple[int, int] | None = None,
    ) -> None:
        """A normal notification with an icon (the companion app shows it), as the message centre has the kind."""
        kind, key = kind_of(tag)
        rule = (self._rules() if self._rules is not None else {}).get(kind or "") or {}
        if kind not in MESSAGE_ALWAYS and rule.get("on") is False:
            return
        cars = rule.get("cars")
        if isinstance(cars, list) and key and kind not in ("pair", "pick") and key not in cars:
            return
        if isinstance(rule.get("to"), list) and rule["to"]:
            to = rule["to"]
        icon = str(rule.get("icon") or icon)
        color = str(rule.get("color") or color)
        through = bool(rule.get("through", kind in MESSAGE_THROUGH))
        off = self._off is not None and self._off()
        if off or (self.held and not through):
            if self._note is not None:
                self._note("notification_held", title=title, message=message, tag=tag)
            if not off and self._digest is not None and self._digest():
                self.waiting.append((title, message))
            return
        if self._note is not None:
            self._note("notification", title=title, message=message, tag=tag, to=list(self.targets(to)))
        for service in self.targets(to):
            data: dict[str, Any] = {"title": title, "message": message}
            if is_mobile_app(service):
                extra: dict[str, Any] = {
                    "tag": tag,
                    "group": GROUP,
                    "url": PANEL_PATH,
                    "clickAction": PANEL_PATH,
                    "notification_icon": icon,
                    "notification_icon_color": COLOR_GLYPH,
                    "color": color,
                }
                if actions:
                    extra["actions"] = actions
                if progress is not None:
                    # Shown with a bar (and as a live notification where the phone has them).
                    extra["progress"], extra["progress_max"] = progress
                    extra["progress_bar_color"] = color
                data["data"] = extra
            await self._call(service, data)

    async def live(
        self,
        *,
        tag: str,
        title: str,
        message: str,
        critical_text: str | None,
        progress: int | None,
        progress_max: int | None,
        until: datetime | None,
        icon: str,
        color: str = COLOR_CHARGE,
        first: bool,
        to: Iterable[str] | None = None,
    ) -> None:
        """Start or update a live notification (only to companion apps).

        In the quiet hours it is taken away once and not updated; after them it comes back silently.
        """
        if self.held:
            if tag not in self._hushed:
                self._hushed.add(tag)
                await self.clear(tag, to)
            return
        if tag in self._hushed:
            self._hushed.discard(tag)
            first = False
        for service in self.targets(to):
            if not is_mobile_app(service):
                if first:
                    await self._call(service, {"title": title, "message": message})
                continue
            extra: dict[str, Any] = {
                "tag": tag,
                "live_update": True,
                "notification_icon": icon,
                "notification_icon_color": color,
                "color": color,
                "progress_bar_color": color,
                "url": PANEL_PATH,
                "clickAction": PANEL_PATH,
                "sticky": True,
            }
            if critical_text:
                extra["critical_text"] = critical_text
            if progress is not None and progress_max:
                extra["progress"] = max(0, min(progress, progress_max))
                extra["progress_max"] = progress_max
            if until is not None:
                extra["chronometer"] = True
                extra["when"] = int(until.timestamp())
                extra["when_relative"] = False
            if not first:
                extra["silent"] = True
                extra["alert_once"] = True
            await self._call(service, {"title": title, "message": message, "data": extra})

    @property
    def held(self) -> bool:
        return self._quiet is not None and self._quiet()

    async def async_flush(self, title: str, intro: str) -> None:
        """The quiet hours are over: what was held back, as one message."""
        if self.held or not self.waiting:
            return
        lines = [f"{head}: {text}" for head, text in self.waiting[-12:]]
        self.waiting = []
        await self.send(
            title=title,
            message="\n".join([intro, *lines]),
            tag="evp_digest_all",
            icon="mdi:weather-night",
            color="#5B5BD6",
        )

    async def clear(self, tag: str, to: Iterable[str] | None = None) -> None:
        """End a live notification, or remove a delivered one."""
        for service in self.targets(to):
            if is_mobile_app(service):
                await self._call(service, {"message": "clear_notification", "data": {"tag": tag}})

    def set_services(self, services: Iterable[str]) -> None:
        """The phones to send to (chosen in the panel since 2.5)."""
        self.services = [service_name(service) for service in services if service]

    async def update_widgets(self) -> None:
        """Ask the iOS companion app to refresh its widgets."""
        for service in self.services:
            if is_mobile_app(service):
                await self._call(service, {"message": "update_widgets"})
