"""Notifications from EV Planner: normal ones with icons, and live ones.

Live notifications are the Home Assistant Companion app's Live Activities
(iOS 17.2+) and Live Updates (Android): a notification sent with
``live_update: true`` and a ``tag`` that is updated in place and ended with
``clear_notification``. They need Home Assistant 2026.7 or newer and a
``notify.mobile_app_*`` action. Other notify actions get a normal message.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import datetime
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

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


class Notifier:
    """Send EV Planner notifications to the chosen notify actions."""

    def __init__(self, hass: HomeAssistant, services: Iterable[str]) -> None:
        self.hass = hass
        self.services = [service_name(service) for service in services if service]

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
    ) -> None:
        """A normal notification with an icon (the companion app shows it)."""
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
        """Start or update a live notification (only to companion apps)."""
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

    async def clear(self, tag: str, to: Iterable[str] | None = None) -> None:
        """End a live notification, or remove a delivered one."""
        for service in self.targets(to):
            if is_mobile_app(service):
                await self._call(service, {"message": "clear_notification", "data": {"tag": tag}})

    async def update_widgets(self) -> None:
        """Ask the iOS companion app to refresh its widgets."""
        for service in self.services:
            if is_mobile_app(service):
                await self._call(service, {"message": "update_widgets"})
