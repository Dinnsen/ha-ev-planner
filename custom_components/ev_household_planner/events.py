"""What EV Planner did and why: a log of events kept for a week, and the integration's own log lines.

The events are written by the household as things happen (a car plugged in, a plan made, a command
sent, the guard turning a car down), each with the figures it was decided on. Together with the
log lines they make the support export (support.py), so a problem can be followed minute by minute.
"""

from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta
import logging
import traceback
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN

EVENTS_KEEP = timedelta(days=7)
EVENTS_MAX = 6000
EVENTS_SAVE_DELAY = 120.0
LOG_LINES_MAX = 1500
EVENTS_STORAGE_KEY = f"{DOMAIN}.{{entry_id}}.events"

PACKAGE_LOGGER = __name__.rsplit(".", 1)[0]


def _plain(value: Any) -> Any:
    """A value as it is written to JSON: times as text, sets as lists."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, float):
        return round(value, 3)
    if isinstance(value, dict):
        return {str(key): _plain(item) for key, item in value.items()}
    if isinstance(value, list | tuple | set):
        return [_plain(item) for item in value]
    if value is None or isinstance(value, str | int | bool):
        return value
    return str(value)


class EventLog:
    """The household's events of the last week, newest last."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        self.hass = hass
        self.items: deque[dict[str, Any]] = deque(maxlen=EVENTS_MAX)
        self._store: Store[dict[str, Any]] = Store(hass, 1, EVENTS_STORAGE_KEY.format(entry_id=entry_id))
        # The last event of a kind for a car or charger, so a repeat of the same is not written again.
        self._last: dict[tuple[str, str], tuple[Any, ...]] = {}

    async def async_load(self) -> None:
        try:
            stored = await self._store.async_load()
        except Exception:
            stored = None
        if not isinstance(stored, dict):
            return
        since = dt_util.now() - EVENTS_KEEP
        for item in stored.get("events") or []:
            if not isinstance(item, dict):
                continue
            moment = dt_util.parse_datetime(str(item.get("at") or ""))
            if moment is not None and moment >= since:
                self.items.append(item)

    @callback
    def add(self, now: datetime, kind: str, **data: Any) -> None:
        """Write an event: what happened, and the figures it was decided on."""
        item = {"at": now.isoformat(), "kind": kind}
        item.update({key: _plain(value) for key, value in data.items() if value is not None})
        self.items.append(item)
        since = (now - EVENTS_KEEP).isoformat()
        while self.items and str(self.items[0].get("at", "")) < since:
            self.items.popleft()
        self._store.async_delay_save(self._to_store, EVENTS_SAVE_DELAY)

    @callback
    def changed(self, now: datetime, kind: str, subject: str, key: tuple[Any, ...], **data: Any) -> None:
        """Write an event only when it differs from the last one of its kind for this subject."""
        if self._last.get((kind, subject)) == key:
            return
        self._last[(kind, subject)] = key
        self.add(now, kind, **data)

    @callback
    def _to_store(self) -> dict[str, Any]:
        return {"events": list(self.items)}

    async def async_save(self) -> None:
        await self._store.async_save(self._to_store())

    async def async_remove(self) -> None:
        await self._store.async_remove()

    def since(self, moment: datetime | None = None) -> list[dict[str, Any]]:
        if moment is None:
            return list(self.items)
        start = moment.isoformat()
        return [item for item in self.items if str(item.get("at", "")) >= start]


class _LogCapture(logging.Handler):
    """Keeps the integration's last log lines, whatever level the log is set to show."""

    def __init__(self) -> None:
        super().__init__(logging.DEBUG)
        self.lines: deque[dict[str, Any]] = deque(maxlen=LOG_LINES_MAX)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            line: dict[str, Any] = {
                "at": dt_util.utc_from_timestamp(record.created).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            if record.exc_info and record.exc_info[0] is not None:
                line["traceback"] = "".join(traceback.format_exception(*record.exc_info))[-4000:]
            self.lines.append(line)
        except Exception:
            self.handleError(record)


LOG_CAPTURE = _LogCapture()


def async_capture_logs() -> None:
    """Start keeping the integration's log lines (once)."""
    logger = logging.getLogger(PACKAGE_LOGGER)
    if LOG_CAPTURE not in logger.handlers:
        logger.addHandler(LOG_CAPTURE)
