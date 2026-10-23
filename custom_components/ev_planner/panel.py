"""Sidebar panel and home-screen app for EV Planner."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, callback
from homeassistant.loader import async_get_integration

from .const import DOMAIN

PANEL_URL = "ev-planner"
STATIC_URL = "/ev_planner_static"
APP_URL = "/ev_planner_app"
WEBCOMPONENT = "ev-planner-panel"
CARDS_MODULE = "ev-planner-cards"
_STATIC_KEY = f"{DOMAIN}_static_registered"
_CARDS_KEY = f"{DOMAIN}_cards_url"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Serve the panel files and add the panel to the sidebar."""
    if not hass.data.get(_STATIC_KEY):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), True),
                # Home-screen web app; not cached, so the launcher can change.
                StaticPathConfig(APP_URL, str(Path(__file__).parent / "app"), False),
            ]
        )
        hass.data[_STATIC_KEY] = True
    version = (await async_get_integration(hass, DOMAIN)).version
    # The dashboard cards, loaded on every dashboard: no resource to add, nothing to install.
    if not hass.data.get(_CARDS_KEY):
        cards_url = f"{STATIC_URL}/{CARDS_MODULE}.js?v={version}"
        frontend.add_extra_js_url(hass, cards_url)
        hass.data[_CARDS_KEY] = cards_url
    if PANEL_URL in hass.data.get(frontend.DATA_PANELS, {}):
        return
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=WEBCOMPONENT,
        sidebar_title="EV Planner",
        sidebar_icon="mdi:car-electric",
        module_url=f"{STATIC_URL}/{WEBCOMPONENT}.js?v={version}",
        config={"static_url": STATIC_URL, "app_url": APP_URL, "version": str(version)},
        require_admin=False,
    )


@callback
def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove the panel and the cards when the household is unloaded."""
    if PANEL_URL in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_URL)
    if cards_url := hass.data.pop(_CARDS_KEY, None):
        frontend.remove_extra_js_url(hass, cards_url)
