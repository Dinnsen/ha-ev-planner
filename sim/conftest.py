"""Fixtures for the simulator: the same as for the tests, without the shared test helpers."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import patch

from homeassistant.core import HomeAssistant
import pytest

# The integration is imported up front, so it can be patched (and so it runs as at home).
import custom_components.ev_household_planner
import custom_components.ev_household_planner.household  # noqa: F401


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Allow loading custom_components."""


@pytest.fixture(autouse=True)
def skip_panel_dependencies(hass: HomeAssistant) -> None:
    """The sidebar panel needs the real frontend; mark it as loaded instead."""
    hass.config.components.update({"frontend", "image_upload", "panel_custom"})


@pytest.fixture(autouse=True)
def mock_panel() -> Generator[None]:
    with (
        patch("custom_components.ev_household_planner.async_register_panel"),
        patch("custom_components.ev_household_planner.async_unregister_panel"),
    ):
        yield
