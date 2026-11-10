/* The test page's side of the tests: a stand-in for Home Assistant's `hass` object, and
   helpers to put the panel and the cards on the page. Nothing of EV Planner is fetched
   until a test asks for it, so the tests can see what is fetched when. */

const PANEL_URL = "/frontend/ev-planner-panel.js?v=test";
const CARDS_URL = "/frontend/ev-planner-cards.js?v=test";
const DOMAIN = "ev_household_planner";

/* Home Assistant's own colours, as the default theme sets them. */
const THEMES = {
  light: {
    "primary-text-color": "#212121", "secondary-text-color": "#727272", "card-background-color": "#ffffff",
    "primary-background-color": "#fafafa", "secondary-background-color": "#e5e5e5", "divider-color": "rgba(0, 0, 0, .12)",
    "primary-color": "#03a9f4", "accent-color": "#ff9800",
  },
  dark: {
    "primary-text-color": "#e1e1e1", "secondary-text-color": "#9b9b9b", "card-background-color": "#1c1c1c",
    "primary-background-color": "#111111", "secondary-background-color": "#202020", "divider-color": "rgba(225, 225, 225, .12)",
    "primary-color": "#03a9f4", "accent-color": "#ff9800",
  },
};

/* Home Assistant's card frame, which the dashboard cards draw themselves in. */
customElements.define(
  "ha-card",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).innerHTML = `<style>:host { display: block; position: relative; box-sizing: border-box;
        background: var(--ha-card-background, var(--card-background-color, #fff)); color: var(--primary-text-color);
        border-radius: var(--ha-card-border-radius, 12px); border: 1px solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); }</style><slot></slot>`;
    }
  },
);

const harness = {
  /* Every message sent to Home Assistant, in order. */
  calls: [],
  /* Messages the stand-in has no answer for: a test fails on any. */
  unknown: [],
  state: null,
  hass: null,
  panel: null,
  listeners: new Set(),

  setTheme(dark) {
    for (const [key, value] of Object.entries(dark ? THEMES.dark : THEMES.light)) document.documentElement.style.setProperty(`--${key}`, value);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  },

  makeHass(state, { lang = "en", dark = false } = {}) {
    this.state = state;
    this.calls = [];
    this.unknown = [];
    this.listeners = new Set();
    document.documentElement.lang = lang;
    this.setTheme(dark);
    const callWS = async (message) => {
      this.calls.push(JSON.parse(JSON.stringify(message)));
      return this.answer(message);
    };
    this.hass = {
      language: lang,
      locale: { language: lang, number_format: "language", time_format: "24" },
      themes: { darkMode: dark },
      states: {
        // A November evening: the sun is well below the horizon.
        "sun.sun": { entity_id: "sun.sun", state: "below_horizon", attributes: { elevation: -31.6, rising: false } },
        "sensor.energi_data_service": { entity_id: "sensor.energi_data_service", state: "0.62", attributes: { friendly_name: "Energi Data Service" } },
      },
      connection: {
        subscribeMessage: async (callback, message) => {
          this.calls.push(JSON.parse(JSON.stringify(message)));
          if (message.type !== `${DOMAIN}/subscribe`) throw { code: "unknown_command", message: message.type };
          this.listeners.add(callback);
          queueMicrotask(() => this.listeners.has(callback) && callback(this.state));
          return () => this.listeners.delete(callback);
        },
        sendMessagePromise: callWS,
      },
      callWS,
      fetchWithAuth: async () => new Response("{}", { status: 404 }),
    };
    return this.hass;
  },

  /* What Home Assistant answers to each command of websocket.py. */
  answer(message) {
    const type = String(message.type || "").replace(`${DOMAIN}/`, "");
    const state = this.state;
    switch (type) {
      case "state":
        return state;
      case "vehicle_set":
      case "guest_set":
      case "guest_lookup":
      case "guest_plan":
      case "guest_new":
      case "guest_charge_now":
      case "guest_stop":
      case "delete_history":
      case "settings":
        return null;
      case "vehicle_preview": {
        const car = state.vehicles.find((v) => v.id === message.vehicle_id);
        if (!car) throw { code: "car_not_found", message: "car_not_found" };
        return { plan: car.plan, error: car.plan ? null : car.plan_error, deadline: car.deadline };
      }
      case "guest_preview": {
        if (!state.prices.length) return { error: "no_price_data" };
        const start = state.prices.find((p) => new Date(p.end) > new Date(state.now)) || state.prices[0];
        const end = new Date(new Date(start.start).getTime() + 3 * 3600e3).toISOString();
        return { segments: [{ start: start.start, end }], mode: "continuous", cost: 18.4, energy: 33, minutes: 180, speed: 14.3, savings: 12.6, charge_now_cost: 31 };
      }
      case "history":
        return this.houseHistory(message);
      case "set_image":
      case "restore_image":
        return { unused: [] };
      default:
        this.unknown.push(message.type);
        throw { code: "unknown_command", message: `Unknown command: ${message.type}` };
    }
  },

  /* The whole house from the statistics: something for every hour, day or month that has been. */
  houseHistory({ period, start, end }) {
    const unit = period === "day" ? "hour" : period === "year" ? "month" : "day";
    if (!this.state.home?.history) return { period, unit, rows: [], typical_day: [] };
    const typical = [0.42, 0.38, 0.36, 0.35, 0.37, 0.52, 0.94, 1.31, 1.12, 0.83, 0.71, 0.69, 0.78, 0.74, 0.7, 0.82, 1.24, 1.86, 2.14, 1.72, 1.33, 1.05, 0.74, 0.51];
    const rows = [];
    const now = new Date(this.state.now);
    for (let t = new Date(start); t < new Date(end) && t < now; ) {
      const next = unit === "hour" ? new Date(t.getTime() + 3600e3) : unit === "day" ? new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1) : new Date(t.getFullYear(), t.getMonth() + 1, 1);
      const kwh = unit === "hour" ? typical[t.getHours()] : unit === "day" ? 18 + ((t.getDate() * 7) % 11) : 520 + ((t.getMonth() * 37) % 160);
      rows.push({ start: t.toISOString(), kwh: Math.round(kwh * 1000) / 1000, cost: Math.round(kwh * 1.9 * 100) / 100 });
      t = next;
    }
    return { period, unit, rows, typical_day: typical };
  },

  /* A new state from Home Assistant, to everything that follows it. */
  push(state) {
    this.state = state;
    for (const listener of [...this.listeners]) listener(state);
  },

  loadPanel() {
    return import(PANEL_URL);
  },

  loadCards() {
    return import(CARDS_URL);
  },

  /* The panel on the page, as Home Assistant shows it at /ev-planner. */
  async mountPanel(state, { lang = "en", dark = false, path = "" } = {}) {
    await this.loadPanel();
    this.panel?.remove();
    try {
      localStorage.clear();
    } catch {
      /* no storage */
    }
    const hass = this.makeHass(state, { lang, dark });
    const panel = document.createElement("ev-planner-panel");
    panel.panel = { config: { static_url: "/frontend", app_url: "/ev_planner_app", version: "test" } };
    panel.narrow = innerWidth < 870;
    panel.route = { prefix: "/ev-planner", path };
    panel.hass = hass;
    document.body.appendChild(panel);
    this.panel = panel;
    return panel;
  },

  /* A dashboard card on the page, made the way a dashboard makes it. */
  mountCard(type, config = {}) {
    const box = document.getElementById("cards") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "cards" }));
    const card = document.createElement(type);
    card.setConfig({ type: `custom:${type}`, ...config });
    card.hass = this.hass;
    box.appendChild(card);
    return card;
  },

  /* Everything a person can read in an element and the shadow roots below it:
     [{text, where}] of text nodes and of the attributes that are read aloud or shown. */
  texts(root) {
    const out = [];
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (text) out.push({ text, where: node.parentElement?.className?.baseVal ?? node.parentElement?.className ?? "" });
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.localName === "style" || node.localName === "script") return;
        for (const name of ["aria-label", "title", "placeholder", "alt"]) {
          const value = node.getAttribute(name);
          if (value && value.trim()) out.push({ text: value.trim(), where: `${node.localName}[${name}]` });
        }
        if (node.shadowRoot) walk(node.shadowRoot);
      }
      for (const child of node.childNodes) walk(child);
    };
    walk(root);
    return out;
  },

  /* Attributes with a number that did not come out as one: "NaN", "undefined" and the like. */
  brokenAttributes(root) {
    const out = [];
    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        for (const attr of node.attributes) {
          if (/NaN|undefined|Infinity|\[object /.test(attr.value)) out.push(`<${node.localName} ${attr.name}="${attr.value.slice(0, 80)}">`);
        }
        if (node.shadowRoot) walk(node.shadowRoot);
      }
      for (const child of node.childNodes) walk(child);
    };
    walk(root);
    return out;
  },
};

window.harness = harness;
window.harnessReady = true;
