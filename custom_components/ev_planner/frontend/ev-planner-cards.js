/* EV Planner – cards for your own dashboards.

   Loaded by the integration on every dashboard, so there is no resource to add and nothing
   to install in HACS. The cards share the panel's code, texts and style (ev-planner-panel.js),
   so the large car card is the very card on EV Planner's overview, and all cards on a page
   share one connection to EV Planner.

     type: custom:ev-planner-household-card   all cars, the guest and the chargers on one line
     type: custom:ev-planner-car-card          vehicle: <id>   one car, small
     type: custom:ev-planner-car-large-card    vehicle: <id>   one car, like on EV Planner's overview
     type: custom:ev-planner-guest-card                         the guest car
     type: custom:ev-planner-charger-card      charger: <id>   one charger
     type: custom:ev-planner-bubble-card       vehicle: <id> | charger: <id> | guest: true
                                               one line in the style of a Bubble Card button

   tap_action: popup (default) | panel | none
*/

const VERSION = new URL(import.meta.url).searchParams.get("v") || "";
// The same address as the panel's, so cards and panel share one copy of its code.
const PANEL_URL = new URL(`./ev-planner-panel.js${VERSION ? `?v=${encodeURIComponent(VERSION)}` : ""}`, import.meta.url).href;
const { EvPlannerPanel, TEXT, STYLE, ICONS, MODES, MODE_ICONS, chargerArt, esc, clamp, isNum, hasSegments, cssId } = await import(PANEL_URL);

const PANEL_PATH = "/ev-planner";
const TAP_ACTIONS = ["popup", "panel", "none"];
const DOCS = "https://github.com/Dinnsen/ha-ev-planner#dashboard-cards";

/* ------------------------------------------------------------------ one connection for all cards */

const stores = new WeakMap();

function storeOf(hass) {
  let store = stores.get(hass.connection);
  if (!store) {
    store = { state: null, error: null, listeners: new Set(), unsub: null, pending: null, timer: null };
    stores.set(hass.connection, store);
  }
  return store;
}

function startStore(store, hass) {
  if (store.unsub || store.pending) return;
  store.pending = hass.connection
    .subscribeMessage(
      (message) => {
        if (message.reload) {
          // EV Planner reloads after a car or charger is added: subscribe again.
          stopStore(store);
          setTimeout(() => store.listeners.size && startStore(store, hass), 1000);
          return;
        }
        store.state = message;
        store.error = null;
        store.listeners.forEach((listener) => listener());
      },
      { type: "ev_planner/subscribe" },
    )
    .then((unsub) => {
      store.unsub = unsub;
      store.pending = null;
      if (!store.listeners.size) stopStore(store);
    })
    .catch((err) => {
      store.pending = null;
      store.error = err || true;
      store.listeners.forEach((listener) => listener());
    });
}

function stopStore(store) {
  const unsub = store.unsub;
  store.unsub = null;
  if (unsub) Promise.resolve(unsub()).catch(() => {});
}

/* Follow EV Planner's state; returns the function that stops following. */
function watch(hass, listener) {
  const store = storeOf(hass);
  store.listeners.add(listener);
  clearTimeout(store.timer);
  startStore(store, hass);
  if (store.state || store.error) queueMicrotask(listener);
  return () => {
    store.listeners.delete(listener);
    // Kept a little, so moving between dashboard views does not subscribe again.
    if (!store.listeners.size) store.timer = setTimeout(() => stopStore(store), 5000);
  };
}

/* ------------------------------------------------------------------ shared helpers */

let sheet = null;
function cardSheet() {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLE + CARD_STYLE);
  }
  return sheet;
}

/* The panel's own drawing and wording code, without a panel on the page. */
function makeRenderer() {
  const r = Object.create(EvPlannerPanel.prototype);
  Object.assign(r, {
    _state: null,
    _hass: null,
    _shown: new Set(),
    _vdraft: {},
    _vdraftId: null,
    _busy: null,
    _animatePlan: false,
    _customTime: {},
    _gdraft: {},
  });
  return r;
}

function pageLang() {
  const lang = (document.documentElement.lang || navigator.language || "en").slice(0, 2);
  return TEXT[lang] ? lang : "en";
}

function text(key) {
  return TEXT[pageLang()][key] ?? TEXT.en[key] ?? key;
}

function navigate(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

/* A pop-up through Home Assistant's own dialogs, so it sits above everything (also inside
   another pop-up) and closes with the back button. Outside Home Assistant: on the page. */
function openPopup(source, view, title) {
  const params = { view, title, hass: source._hass };
  if (document.querySelector("home-assistant")) {
    source.dispatchEvent(
      new CustomEvent("show-dialog", {
        bubbles: true,
        composed: true,
        detail: { dialogTag: "ev-planner-dialog", dialogImport: () => Promise.resolve(), dialogParams: params },
      }),
    );
    return;
  }
  const dialog = document.body.querySelector("ev-planner-dialog") || document.body.appendChild(document.createElement("ev-planner-dialog"));
  dialog.showDialog(params);
}

function ringSvg(pct, color) {
  const c = 2 * Math.PI * 20;
  const value = isNum(pct) ? clamp(Number(pct), 0, 100) : 0;
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" class="track"/>${
    isNum(pct) ? `<circle cx="24" cy="24" r="20" class="val" style="stroke:${color};stroke-dasharray:${((value / 100) * c).toFixed(1)} ${c.toFixed(1)}"/>` : ""
  }</svg>`;
}

function socColor(soc) {
  if (!isNum(soc)) return "var(--evp-soft)";
  if (soc < 25) return "var(--evp-coral)";
  if (soc < 50) return "var(--evp-sand)";
  return "var(--evp-a)";
}

/* ------------------------------------------------------------------ the cards */

class EvPlannerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [cardSheet()];
    this.shadowRoot.innerHTML = `<ha-card></ha-card>`;
    this._r = makeRenderer();
    this._config = {};
    this._html = null;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    if (config.tap_action && !TAP_ACTIONS.includes(config.tap_action)) {
      throw new Error(`tap_action must be one of: ${TAP_ACTIONS.join(", ")}`);
    }
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._r._hass = hass;
    if (first && this.isConnected) this._follow();
    this._render();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._follow();
    clearInterval(this._tick);
    // The clock's hand, "starts in" and the like move with time.
    this._tick = setInterval(() => this._render(), 30000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._unwatch?.();
    this._unwatch = null;
  }

  _follow() {
    if (!this._hass || this._unwatch) return;
    this._unwatch = watch(this._hass, () => this._render());
  }

  get _store() {
    return this._hass ? storeOf(this._hass) : null;
  }

  get _state() {
    return this._store?.state || null;
  }

  _t(key, vars) {
    return this._r._t(key, vars);
  }

  _render() {
    const card = this.shadowRoot.querySelector("ha-card");
    let html;
    if (!this._hass) html = "";
    else if (this._store?.error && !this._state) html = `<p class="evc-msg">${esc(this._t("card_missing"))}</p>`;
    else if (!this._state) html = `<div class="evc-loading" aria-busy="true"></div>`;
    else {
      this._r._state = this._state;
      html = this._content();
    }
    if (html === this._html) return;
    this._html = html;
    const focus = this.shadowRoot.activeElement?.dataset?.f;
    card.innerHTML = html;
    if (focus) card.querySelector(`[data-f="${cssId(focus)}"]`)?.focus({ preventScroll: true });
  }

  _missing(id) {
    return `<p class="evc-msg">${esc(this._t("card_unknown", { id: id || "–" }))}</p>`;
  }

  _onClick(ev) {
    const el = ev.target.closest("[data-act], [data-view]");
    if (!el || el.disabled) return;
    const act = el.dataset.act;
    if (act === "mode") {
      ev.stopPropagation();
      this._call("ev_planner/vehicle_set", { vehicle_id: el.dataset.id, settings: { mode: el.dataset.mode } }, el);
      return;
    }
    if (act === "g-stop") {
      this._call("ev_planner/guest_stop", {}, el);
      return;
    }
    if (act === "open-car") {
      this._tap(`car/${el.dataset.id}`, this._r._car(el.dataset.id)?.name);
      return;
    }
    if (el.dataset.view) this._tap(el.dataset.view, el.dataset.title, el.dataset.force);
  }

  /* What tapping does: the pop-up, EV Planner on that page, or nothing. */
  _tap(view, title, force) {
    const action = force || this._config.tap_action || "popup";
    if (action === "none") return;
    if (action === "panel") navigate(`${PANEL_PATH}/${view}`);
    else openPopup(this, view, title || "EV Planner");
  }

  async _call(type, data, el) {
    if (el) el.disabled = true;
    try {
      const message = { type, ...data };
      if (this._state?.entry_id) message.entry_id = this._state.entry_id;
      await this._hass.callWS(message);
    } catch (err) {
      this.dispatchEvent(
        new CustomEvent("hass-notification", {
          bubbles: true,
          composed: true,
          detail: { message: err?.message || this._t("err_unknown", { detail: err?.code || "" }) },
        }),
      );
    } finally {
      if (el) el.disabled = false;
    }
  }

  getCardSize() {
    return 2;
  }

  static getConfigElement() {
    return document.createElement("ev-planner-card-editor");
  }

  static async _firstState(hass) {
    try {
      return await hass.callWS({ type: "ev_planner/state" });
    } catch {
      return null;
    }
  }
}

/* All cars, the guest and the chargers on one line. */
class HouseholdCard extends EvPlannerCard {
  _content() {
    const s = this._state;
    const r = this._r;
    const cfg = this._config;
    const chips = [];
    if (cfg.show_cars !== false) {
      for (const v of s.vehicles) {
        const plan = hasSegments(v.plan) ? v.plan : null;
        let sub = r._statusText(v);
        if (v.home === false) sub = r._t("away");
        else if (v.control === "charge") sub = r._t("vstatus_charging");
        else if (plan && v.status === "planned") sub = r._time(plan.segments.find((seg) => new Date(seg.end) > Date.now())?.start || plan.segments[0].start);
        const pct = isNum(v.soc) ? r._pct(v.soc) : "";
        chips.push(`<button class="evh-chip tone-${r._statusTone(v)} ${v.control === "charge" ? "charging" : ""}" data-view="car/${esc(v.id)}" data-title="${esc(v.name)}" data-f="h-${esc(v.id)}" aria-label="${esc(`${v.name}: ${pct}, ${sub}`)}">
          <span class="evh-ring">${ringSvg(v.soc, socColor(v.soc))}${v.image ? `<img src="${esc(v.image)}" alt="" loading="lazy">${pct ? `<em class="evh-pct">${pct}</em>` : ""}` : `<i>${pct}</i>`}</span>
          <b>${esc(v.name)}</b><small>${esc(sub)}</small></button>`);
      }
    }
    const g = s.guest;
    if (cfg.show_guest !== false && g) {
      const active = hasSegments(g.plan) || g.inputs?.license_plate;
      const soc = g.plan?.progress?.soc ?? g.inputs?.soc;
      const sub = active ? (g.error ? r._t(`err_${g.error}`) : r._t(`status_${g.status}`)) : r._t("guest_add");
      chips.push(`<button class="evh-chip ${active ? "" : "add"}" data-view="guest" data-title="${esc(r._t("guest_card"))}" data-f="h-guest" aria-label="${esc(`${r._t("guest_card")}: ${sub}`)}">
        <span class="evh-ring">${active ? ringSvg(soc, socColor(soc)) : ringSvg(null)}<i>${active ? (isNum(soc) ? r._pct(soc) : "") : ICONS.plus}</i></span>
        <b>${esc(active && g.inputs?.license_plate ? g.inputs.license_plate : r._t("guest_card"))}</b><small>${esc(sub)}</small></button>`);
    }
    if (cfg.show_chargers !== false) {
      for (const c of s.chargers) {
        chips.push(`<button class="evh-chip ctl-${esc(c.control || "released")}" data-view="charger/${esc(c.id)}" data-title="${esc(c.name)}" data-f="h-${esc(c.id)}" aria-label="${esc(`${c.name}: ${r._chargerStateText(c)}`)}">
          <span class="evh-ring art">${ringSvg(c.control === "charge" ? 100 : null, "var(--evp-b)")}${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : chargerArt(c.style)}</span>
          <b>${esc(c.name)}</b><small>${esc(c.control === "released" ? r._t("charger_free") : r._t(`charger_${c.control}`))}</small></button>`);
      }
    }
    if (!chips.length) return `<p class="evc-msg">${esc(r._t("no_cars_title"))}</p>`;
    return `<div class="evh" role="list">${chips.join("")}</div>`;
  }

  static async getStubConfig() {
    return {};
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }
}

/* One car, small: battery, target, start, cost and savings. */
class CarCard extends EvPlannerCard {
  setConfig(config) {
    if (!config?.vehicle) throw new Error("Choose a car (vehicle)");
    super.setConfig(config);
  }

  _content() {
    const r = this._r;
    const v = r._car(this._config.vehicle);
    if (!v) return this._missing(this._config.vehicle);
    const name = this._config.name || v.name;
    const plan = hasSegments(v.plan) ? v.plan : null;
    const tone = r._statusTone(v);
    let line = "";
    if (plan) {
      const range = `${r._time(plan.start || plan.segments[0].start)}–${r._time(plan.end || plan.segments.at(-1).end)}`;
      line = `<div class="evc-row"><span>${esc(range)}</span><b>${r._money(plan.cost)}</b></div>
        ${plan.savings > 0.005 ? `<div class="evc-row"><span class="soft">${esc(r._t("savings"))}</span><b class="good">${r._money(plan.savings)}</b></div>` : ""}`;
    } else if (v.plan_error) line = `<div class="evc-row"><span class="soft">${esc(r._t(`vstatus_${v.plan_error}`))}</span></div>`;
    return `<button class="evc" data-view="car/${esc(v.id)}" data-title="${esc(name)}" data-f="card" aria-label="${esc(r._t("open_car", { name }))}">
      <span class="evc-head">
        <span class="evc-pic ${v.image ? "has" : ""}">${v.image ? `<img src="${esc(v.image)}" alt="" loading="lazy">` : ICONS.car}</span>
        <span class="evc-name"><strong>${esc(name)}</strong><span><i class="dot ${tone}"></i>${esc(r._statusText(v))}</span></span>
      </span>
      ${r._miniBatteryHtml(v)}
      ${line}
    </button>`;
  }

  static async getStubConfig(hass) {
    const state = await EvPlannerCard._firstState(hass);
    return { vehicle: state?.vehicles?.[0]?.id || "" };
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, rows: "auto" };
  }
}

/* One car, as on EV Planner's overview: the price clock, the battery and the mode. */
class CarLargeCard extends CarCard {
  _content() {
    const r = this._r;
    const v = r._car(this._config.vehicle);
    if (!v) return this._missing(this._config.vehicle);
    const shown = this._config.name ? { ...v, name: this._config.name } : v;
    return r._carCardHtml(shown);
  }

  getCardSize() {
    return 5;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }
}

/* The guest car: add a guest, the plan, charging, stop and bill. */
class GuestCard extends EvPlannerCard {
  _content() {
    const r = this._r;
    const g = this._state.guest;
    if (!g) return this._missing("guest");
    const title = esc(r._t("guest_card"));
    const plate = g.inputs?.license_plate || "";
    const hasPlan = hasSegments(g.plan);
    if (!hasPlan && !plate) {
      return `<div class="evc static">
        <span class="evc-head"><span class="evc-pic">${ICONS.guest}</span><span class="evc-name"><strong>${title}</strong><span>${esc(r._t("guest_none"))}</span></span></span>
        <button class="btn primary" data-view="guest" data-title="${title}" data-force="${this._config.tap_action === "panel" ? "panel" : "popup"}" data-f="add">${ICONS.plus}<span>${esc(r._t("guest_add"))}</span></button>
      </div>`;
    }
    const car = [g.car?.brand, g.car?.model].filter(Boolean).join(" ") || r._t("unknown_car");
    const status = g.error ? r._t(`err_${g.error}`) : r._t(`status_${g.status}`);
    const charging = g.control === "charge" || g.status === "charging";
    const tone = g.error ? "coral" : charging || g.status === "planned" ? "teal" : g.status === "completed" ? "grey" : "sand";
    const soc = g.plan?.progress?.soc ?? g.inputs?.soc;
    const target = g.inputs?.charge_limit;
    const where = [g.charger?.name, hasPlan ? `${r._time(g.plan.segments[0].start)}–${r._time(g.plan.segments.at(-1).end)}` : ""].filter(Boolean).join(" · ");
    const billable = g.status === "completed" && (g.history || []).length;
    const actions = [
      charging ? `<button class="btn ghost" data-act="g-stop" data-f="stop">${ICONS.pause}<span>${esc(r._t("guest_stop"))}</span></button>` : "",
      billable ? `<button class="btn ghost" data-view="history" data-force="panel" data-f="bill">${ICONS.receipt}<span>${esc(r._t("bill"))}</span></button>` : "",
    ].filter(Boolean);
    return `<div class="evc static">
      <button class="evc-open" data-view="guest" data-title="${title}" data-f="card" aria-label="${esc(r._t("guest_open"))}">
        <span class="evc-head between">
          ${plate ? `<em class="mini-plate">${esc(plate)}</em>` : `<span class="evc-pic">${ICONS.guest}</span>`}
          <span class="pill ${tone}">${esc(status)}</span>
        </span>
        <span class="evc-name"><strong>${esc(car)}</strong><span>${esc(where)}</span></span>
        ${isNum(soc) && isNum(target) ? r._miniBatteryHtml({ soc, target, capacity: g.inputs?.battery_capacity, control: charging ? "charge" : "released" }) : ""}
        ${hasPlan ? `<span class="evc-row"><span class="soft">${esc(r._t("cost"))}</span><b>${r._money(g.plan.measured_cost ?? g.plan.cost)}</b></span>` : ""}
      </button>
      ${actions.length ? `<div class="evc-actions">${actions.join("")}</div>` : ""}
    </div>`;
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, rows: "auto" };
  }
}

/* One charger: who charges, and who is next. */
class ChargerCard extends EvPlannerCard {
  setConfig(config) {
    if (!config?.charger) throw new Error("Choose a charger");
    super.setConfig(config);
  }

  _content() {
    const r = this._r;
    const c = r._charger(this._config.charger);
    if (!c) return this._missing(this._config.charger);
    const name = this._config.name || c.name;
    const next = r._chargerNext(c);
    const tone = c.control === "charge" ? "teal" : c.control === "pause" ? "sand" : "grey";
    const details = [isNum(c.power) ? `${r._num(c.power)} kW` : "", c.connected === true ? r._t("car_plugged") : c.connected === false ? r._t("car_unplugged") : ""]
      .filter(Boolean)
      .join(" · ");
    return `<button class="evc ctl-${esc(c.control || "released")}" data-view="charger/${esc(c.id)}" data-title="${esc(name)}" data-f="card" aria-label="${esc(r._t("open_charger", { name }))}">
      <span class="evc-head">
        <span class="evc-pic charger ${c.image ? "has" : ""}">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : chargerArt(c.style)}</span>
        <span class="evc-name"><strong>${esc(name)}</strong><span>${esc(details)}</span></span>
      </span>
      <span class="pill ${tone}">${esc(r._chargerStateText(c))}</span>
      ${next ? `<span class="evc-row"><span class="soft">${esc(r._t("charger_next", { name: next.name, time: r._time(next.start) }))}</span></span>` : ""}
    </button>`;
  }

  static async getStubConfig(hass) {
    const state = await EvPlannerCard._firstState(hass);
    return { charger: state?.chargers?.[0]?.id || "" };
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, rows: "auto" };
  }
}

/* A car, the guest or a charger as one Bubble Card button: the battery fills it like a
   Bubble slider, and it takes its colours from the same --bubble-* variables. */
class BubbleCard extends EvPlannerCard {
  setConfig(config) {
    if (!config?.vehicle && !config?.charger && !config?.guest) throw new Error("Choose a car (vehicle), a charger or the guest (guest: true)");
    super.setConfig(config);
  }

  _content() {
    const cfg = this._config;
    if (cfg.vehicle) return this._car();
    if (cfg.charger) return this._chargerBubble();
    return this._guestBubble();
  }

  _shell({ view, title, label, icon, name, state, fill = null, target = null, on = false, flow = false, subs = "" }) {
    const filled = isNum(fill);
    return `<div class="bub ${on ? "is-on" : ""} ${flow ? "bub-live" : ""}">
      ${filled ? `<i class="bub-fill" style="width:${clamp(Number(fill), 0, 100)}%"></i>` : on ? `<i class="bub-fill" style="width:100%"></i>` : ""}
      ${filled && isNum(target) && Number(target) > Number(fill) && Number(target) < 99.5 ? `<i class="bub-target" style="left:${clamp(Number(target), 0, 100)}%"></i>` : ""}
      <button class="bub-main" data-view="${esc(view)}" data-title="${esc(title)}" data-f="card" aria-label="${esc(label)}">
        <span class="bub-icon">${icon}</span>
        <span class="bub-name"><b>${esc(name)}</b><span>${state}</span></span>
      </button>
      ${subs ? `<span class="bub-subs">${subs}</span>` : ""}
    </div>`;
  }

  _car() {
    const r = this._r;
    const v = r._car(this._config.vehicle);
    if (!v) return `<div class="bub">${this._missing(this._config.vehicle)}</div>`;
    const name = this._config.name || v.name;
    const plan = hasSegments(v.plan) ? v.plan : null;
    const charging = v.control === "charge";
    const soc = isNum(v.soc) ? Number(v.soc) : null;
    const target = isNum(v.target) ? Number(v.target) : null;
    const parts = [];
    if (soc !== null) parts.push(`${r._pct(soc)}${target !== null ? ` → ${r._pct(target)}` : ""}`);
    if (v.home === false) parts.push(r._t("away"));
    else if (charging && plan) parts.push(r._t("bubble_until", { time: r._time(plan.end || plan.segments.at(-1).end) }));
    else if (charging) parts.push(r._t("vstatus_charging"));
    else if (plan && v.status === "planned") {
      const start = plan.segments.find((seg) => new Date(seg.end) > Date.now())?.start || plan.segments[0].start;
      parts.push(r._t("bubble_starts", { time: r._time(start) }));
    } else parts.push(r._statusText(v));
    const mode = v.mode || "smart";
    const subs = [
      plan ? `<span class="bub-sub info">${r._money(plan.cost)}</span>` : "",
      `<button class="bub-sub ${charging ? "on" : ""}" data-act="bub-modes" data-f="modes" aria-haspopup="menu" aria-label="${esc(`${r._t("mode_label")}: ${r._t(`mode_${mode}`)}`)}">${ICONS[MODE_ICONS[mode]] || ""}</button>`,
    ].join("");
    return this._shell({
      view: `car/${v.id}`,
      title: name,
      label: r._t("open_car", { name }),
      icon: v.image ? `<img src="${esc(v.image)}" alt="" loading="lazy">` : ICONS.car,
      name,
      state: `${v.problem || v.control_error ? `<i class="dot coral"></i>` : ""}${esc(parts.join(" · "))}`,
      fill: soc,
      target,
      flow: charging,
      subs,
    }) + this._menu(v, mode);
  }

  /* The modes as a menu in the top layer, so the card's rounded corners do not cut it. */
  _menu(v, mode) {
    const r = this._r;
    return `<div class="bub-menu" popover role="menu" aria-label="${esc(r._t("mode_label"))}">${MODES.map(
      (m) => `<button role="menuitemradio" aria-checked="${m === mode}" class="${m === mode ? "on" : ""}" data-act="mode" data-id="${esc(v.id)}" data-mode="${m}" data-f="menu-${m}">${ICONS[MODE_ICONS[m]]}<span>${esc(r._t(`mode_${m}`))}</span></button>`,
    ).join("")}</div>`;
  }

  _guestBubble() {
    const r = this._r;
    const g = this._state.guest;
    if (!g) return `<div class="bub">${this._missing("guest")}</div>`;
    const title = r._t("guest_card");
    const plate = g.inputs?.license_plate || "";
    const hasPlan = hasSegments(g.plan);
    const force = this._config.tap_action === "panel" ? "panel" : "popup";
    if (!hasPlan && !plate) {
      return this._shell({
        view: "guest",
        title,
        label: r._t("guest_open"),
        icon: ICONS.guest,
        name: this._config.name || title,
        state: esc(r._t("guest_none")),
        subs: `<button class="bub-sub" data-view="guest" data-title="${esc(title)}" data-force="${force}" data-f="add">${ICONS.plus}<span>${esc(r._t("bubble_add"))}</span></button>`,
      });
    }
    const car = [g.car?.brand, g.car?.model].filter(Boolean).join(" ");
    const charging = g.control === "charge" || g.status === "charging";
    const soc = g.plan?.progress?.soc ?? g.inputs?.soc;
    const target = g.inputs?.charge_limit;
    const status = g.error ? r._t(`err_${g.error}`) : r._t(`status_${g.status}`);
    const parts = [status];
    if (isNum(soc)) parts.push(`${r._pct(soc)}${isNum(target) ? ` → ${r._pct(target)}` : ""}`);
    else if (hasPlan) parts.push(`${r._time(g.plan.segments[0].start)}–${r._time(g.plan.segments.at(-1).end)}`);
    const billable = g.status === "completed" && (g.history || []).length;
    const subs = charging
      ? `<button class="bub-sub" data-act="g-stop" data-f="stop">${ICONS.pause}<span>${esc(r._t("bubble_stop"))}</span></button>`
      : billable
        ? `<button class="bub-sub" data-view="history" data-force="panel" data-f="bill">${ICONS.receipt}<span>${esc(r._t("bill"))}</span></button>`
        : hasPlan
          ? `<span class="bub-sub info">${r._money(g.plan.measured_cost ?? g.plan.cost)}</span>`
          : "";
    return this._shell({
      view: "guest",
      title,
      label: r._t("guest_open"),
      icon: ICONS.guest,
      name: this._config.name || [plate, car].filter(Boolean).join(" · ") || title,
      state: `${g.error ? `<i class="dot coral"></i>` : ""}${esc(parts.join(" · "))}`,
      fill: isNum(soc) ? soc : null,
      target: isNum(target) ? target : null,
      flow: charging,
      subs,
    });
  }

  _chargerBubble() {
    const r = this._r;
    const c = r._charger(this._config.charger);
    if (!c) return `<div class="bub">${this._missing(this._config.charger)}</div>`;
    const name = this._config.name || c.name;
    const charging = c.control === "charge";
    const next = !charging ? r._chargerNext(c) : null;
    const parts = [r._chargerStateText(c)];
    if (next) parts.push(r._t("charger_next", { name: next.name, time: r._time(next.start) }));
    return this._shell({
      view: `charger/${c.id}`,
      title: name,
      label: r._t("open_charger", { name }),
      icon: c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : chargerArt(c.style),
      name,
      state: `<i class="dot ${charging ? "teal" : c.control === "pause" ? "sand" : ""}"></i>${esc(parts.join(" · "))}`,
      on: charging,
      flow: charging,
      subs: isNum(c.power) && Number(c.power) > 0 ? `<span class="bub-sub info">${r._num(c.power)} kW</span>` : "",
    });
  }

  _onClick(ev) {
    const el = ev.target.closest("[data-act]");
    if (el?.dataset.act === "bub-modes") {
      ev.stopPropagation();
      this._openMenu(el, ev.detail === 0);
      return;
    }
    if (el?.dataset.act === "mode") this.shadowRoot.querySelector(".bub-menu")?.hidePopover?.();
    super._onClick(ev);
  }

  _openMenu(anchor, keyboard) {
    const menu = this.shadowRoot.querySelector(".bub-menu");
    // Browsers without pop-overs (Safari before 17): the car's page has the modes.
    if (!menu?.showPopover) {
      const v = this._r._car(this._config.vehicle);
      if (v) this._tap(`car/${v.id}`, this._config.name || v.name, this._config.tap_action === "panel" ? "panel" : "popup");
      return;
    }
    if (menu.matches(":popover-open")) {
      menu.hidePopover();
      return;
    }
    menu.showPopover();
    const a = anchor.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const left = clamp(a.right - width, 8, innerWidth - width - 8);
    const below = a.bottom + 6 + height <= innerHeight - 8;
    menu.style.left = `${left}px`;
    menu.style.top = `${below ? a.bottom + 6 : Math.max(8, a.top - 6 - height)}px`;
    // From the keyboard, straight into the menu; a tap leaves the focus where it is.
    if (keyboard) menu.querySelector("button.on, button")?.focus({ preventScroll: true });
  }

  _render() {
    // A new state must not shut the menu while it is open.
    const menu = this.shadowRoot.querySelector(".bub-menu");
    if (menu?.matches?.(":popover-open")) {
      this._pending = true;
      if (!this._closeHook) {
        this._closeHook = true;
        menu.addEventListener("toggle", (ev) => {
          this._closeHook = false;
          if (ev.newState === "closed" && this._pending) {
            this._pending = false;
            this._render();
          }
        }, { once: true });
      }
      return;
    }
    super._render();
  }

  static async getStubConfig(hass) {
    const state = await EvPlannerCard._firstState(hass);
    if (state?.vehicles?.[0]) return { vehicle: state.vehicles[0].id };
    if (state?.chargers?.[0]) return { charger: state.chargers[0].id };
    return { guest: true };
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 1, min_rows: 1, max_rows: 1 };
  }
}

/* ------------------------------------------------------------------ the pop-up */

class EvPlannerDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onKey = (ev) => {
      if (ev.key === "Escape" && this._open) this._close();
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (this._panelEl) this._panelEl.hass = hass;
  }

  /* Called by Home Assistant's dialog manager (or by the card outside Home Assistant). */
  showDialog(params) {
    this._hass = params?.hass || this._hass;
    this._view = params?.view || "cars";
    this._open = true;
    this.hidden = false;
    const lang = pageLang();
    this.shadowRoot.innerHTML = `<style>${DIALOG_STYLE}</style>
      <div class="scrim" part="scrim"></div>
      <section class="sheet" role="dialog" aria-modal="true" tabindex="-1" aria-label="${esc(params?.title || "EV Planner")}">
        <header>
          <span class="grab" aria-hidden="true"></span>
          <h2>${this._view === "guest" ? esc(params?.title || "") : ""}</h2>
          <a class="open" href="${PANEL_PATH}/${esc(this._view)}">${esc(TEXT[lang].open_in_panel)} ›</a>
          <button class="close" aria-label="${esc(TEXT[lang].close || "Close")}">${ICONS.close}</button>
        </header>
        <div class="body"></div>
      </section>`;
    const panel = document.createElement("ev-planner-panel");
    panel.panel = { config: {} };
    panel.narrow = innerWidth < 870;
    panel.embed = { view: this._view };
    this.shadowRoot.querySelector(".body").appendChild(panel);
    this._panelEl = panel;
    if (this._hass) panel.hass = this._hass;
    this.shadowRoot.querySelector(".scrim").addEventListener("click", () => this._close());
    this.shadowRoot.querySelector(".close").addEventListener("click", () => this._close());
    this.shadowRoot.querySelector(".open").addEventListener("click", (ev) => {
      ev.preventDefault();
      const path = `${PANEL_PATH}/${panel._path || this._view}`;
      this._close();
      // After the dialog's history entry is gone, or the panel would be closed again.
      setTimeout(() => navigate(path), 60);
    });
    this._dragToClose(this.shadowRoot.querySelector("header"));
    document.addEventListener("keydown", this._onKey);
    requestAnimationFrame(() => this.shadowRoot.querySelector(".sheet")?.focus({ preventScroll: true }));
  }

  /* Called by Home Assistant when the dialog's history entry goes (the back button). */
  closeDialog() {
    this._teardown();
    return true;
  }

  _close() {
    if (!this._open) return;
    this._teardown();
    this.dispatchEvent(new CustomEvent("dialog-closed", { bubbles: true, composed: true, detail: { dialog: this.localName } }));
  }

  _teardown() {
    this._open = false;
    document.removeEventListener("keydown", this._onKey);
    this._panelEl?.remove();
    this._panelEl = null;
    this.shadowRoot.innerHTML = "";
    this.hidden = true;
  }

  /* On a phone the sheet can be pulled down to close it. */
  _dragToClose(handle) {
    const sheetEl = this.shadowRoot.querySelector(".sheet");
    let startY = null;
    handle.addEventListener("touchstart", (ev) => (startY = ev.touches.length === 1 ? ev.touches[0].clientY : null), { passive: true });
    handle.addEventListener(
      "touchmove",
      (ev) => {
        if (startY === null) return;
        const dy = Math.max(0, ev.touches[0].clientY - startY);
        sheetEl.style.transform = `translateY(${dy}px)`;
      },
      { passive: true },
    );
    const end = (ev) => {
      if (startY === null) return;
      const dy = (ev.changedTouches?.[0]?.clientY ?? startY) - startY;
      startY = null;
      sheetEl.style.transform = "";
      if (dy > 90) this._close();
    };
    handle.addEventListener("touchend", end, { passive: true });
    handle.addEventListener("touchcancel", end, { passive: true });
  }
}

/* ------------------------------------------------------------------ the card editor */

class EvPlannerCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._state && !this._loading) {
      this._loading = true;
      EvPlannerCard._firstState(hass).then((state) => {
        this._state = state;
        this._render();
      });
    }
    this._render();
  }

  get _kind() {
    return String(this._config?.type || "").replace("custom:ev-planner-", "").replace("-card", "");
  }

  _schema() {
    const t = (key) => TEXT[pageLang()][key] ?? TEXT.en[key];
    const options = (items) => (items || []).map((item) => ({ value: item.id, label: item.name }));
    const tap = {
      name: "tap_action",
      selector: { select: { mode: "dropdown", options: TAP_ACTIONS.map((value) => ({ value, label: t(`tap_${value}`) })) } },
    };
    const name = { name: "name", selector: { text: {} } };
    switch (this._kind) {
      case "car":
      case "car-large":
        return [{ name: "vehicle", required: true, selector: { select: { mode: "dropdown", options: options(this._state?.vehicles) } } }, name, tap];
      case "charger":
        return [{ name: "charger", required: true, selector: { select: { mode: "dropdown", options: options(this._state?.chargers) } } }, name, tap];
      case "bubble": {
        const items = [
          ...(this._state?.vehicles || []).map((v) => ({ value: `vehicle:${v.id}`, label: `${t("ed_vehicle")}: ${v.name}` })),
          { value: "guest", label: t("guest_card") },
          ...(this._state?.chargers || []).map((c) => ({ value: `charger:${c.id}`, label: `${t("ed_charger")}: ${c.name}` })),
        ];
        return [{ name: "show", required: true, selector: { select: { mode: "dropdown", options: items } } }, name, tap];
      }
      case "household":
        return [
          { name: "show_cars", selector: { boolean: {} } },
          { name: "show_guest", selector: { boolean: {} } },
          { name: "show_chargers", selector: { boolean: {} } },
          tap,
        ];
      default:
        return [tap];
    }
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        const value = { ...ev.detail.value };
        if ("show" in value) {
          const [key, id] = String(value.show || "").split(/:(.*)/s);
          delete value.show;
          delete value.vehicle;
          delete value.charger;
          delete value.guest;
          if (key === "guest") value.guest = true;
          else if (key && id) value[key] = id;
        }
        for (const key of Object.keys(value)) if (value[key] === "" || value[key] === undefined) delete value[key];
        if (value.tap_action === "popup") delete value.tap_action;
        for (const key of ["show_cars", "show_guest", "show_chargers"]) if (value[key] === true) delete value[key];
        this._config = { type: this._config.type, ...value };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const labels = { show: "ed_show", vehicle: "ed_vehicle", charger: "ed_charger", name: "ed_name", tap_action: "ed_tap", show_cars: "ed_show_cars", show_guest: "ed_show_guest", show_chargers: "ed_show_chargers" };
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    const c = this._config;
    const show = c.vehicle ? `vehicle:${c.vehicle}` : c.charger ? `charger:${c.charger}` : c.guest ? "guest" : undefined;
    this._form.data = { tap_action: "popup", show_cars: true, show_guest: true, show_chargers: true, ...c, ...(this._kind === "bubble" ? { show } : {}) };
    this._form.computeLabel = (item) => text(labels[item.name] || item.name);
  }
}

/* ------------------------------------------------------------------ styles */

/* Themes reach the cards through Home Assistant's own variables (--ha-card-*), Theme Studio's
   (--theme-studio-*) and, for the Bubble card, Bubble Card's (--bubble-*). Each has a fallback,
   so the cards look the same as before without them. */
const CARD_STYLE = `
:host {
  display: block; height: auto; background: none;
  --evc-surface: var(--theme-studio-soft-background-color, color-mix(in srgb, var(--evp-ink) 4%, transparent));
  --evc-chip-radius: var(--theme-studio-chip-radius, 14px);
  /* Theme Studio's glass blur is for the cards that ask for it; these do. */
  --ha-card-backdrop-filter: var(--theme-studio-card-backdrop-filter, none);
}
ha-card { height: 100%; overflow: hidden; color: var(--evp-ink); }
.evc { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; align-content: start; width: 100%; height: 100%; min-width: 0; overflow: hidden; padding: 14px 16px 16px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.evc.static { cursor: default; }
.evc-open { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; min-width: 0; width: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; border-radius: 10px; }
.evc:focus-visible, .evc-open:focus-visible, .evh-chip:focus-visible { outline: 2px solid var(--evp-accent); outline-offset: -2px; }
.evc-head { display: flex; align-items: center; gap: 10px; min-width: 0; }
.evc-head.between { justify-content: space-between; }
.evc-pic { width: 48px; height: 38px; flex: none; border-radius: 10px; display: grid; place-items: center; overflow: hidden; color: var(--evp-soft); background: var(--evc-surface); }
.evc-pic.has { background: var(--evp-photo-bg); }
.evc-pic img { width: 100%; height: 100%; object-fit: contain; padding: 2px; box-sizing: border-box; filter: drop-shadow(0 2px 3px rgba(0,0,0,.18)); }
.evc-pic > svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.evc-pic.charger { width: 44px; height: 48px; }
.evc-pic > svg.art { width: 36px; height: 36px; stroke-width: 2.6; }
svg.art .glass { fill: color-mix(in srgb, var(--evp-a) 18%, transparent); }
svg.art .led { stroke: var(--evp-a); fill: var(--evp-a); }
.ctl-charge svg.art .led { filter: drop-shadow(0 0 3px var(--evp-b)); }
.evc-name { display: grid; min-width: 0; gap: 1px; }
.evc-name strong { font-size: 15.5px; font-weight: 600; line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.evc-name span { color: var(--evp-soft); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: 1px; background: var(--evp-soft); }
.dot.teal { background: var(--evp-a); }
.dot.sand { background: var(--evp-sand); }
.dot.coral { background: var(--evp-coral); }
.evc .pill { justify-self: start; max-width: 100%; white-space: normal; line-height: 1.25; }
.evc-head.between { flex-wrap: wrap; gap: 6px; }
.evc-row > span.soft { white-space: normal; }
.evc-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 2px 8px; font-size: 13.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.evc-row > span { overflow: hidden; text-overflow: ellipsis; }
.evc .mini-batt p { font-size: 12.5px; white-space: nowrap; }
/* Small cards show the levels; the energy is on the large card and in the pop-up. */
.evc .mini-batt p span { display: none; }
.evc .btn { width: 100%; min-width: 0; }
.evc-actions { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px; }
.evc-actions .btn { padding: 10px 12px; }
.evc-msg { margin: 0; padding: 16px; color: var(--evp-soft); }
.evc-loading { height: 96px; margin: 14px; border-radius: 12px; background: linear-gradient(90deg, color-mix(in srgb, var(--evp-ink) 4%, transparent), color-mix(in srgb, var(--evp-ink) 9%, transparent), color-mix(in srgb, var(--evp-ink) 4%, transparent)); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* The large car card is the overview's card, in the dashboard's own card frame. */
ha-card > .vcard { border: 0; border-radius: 0; background: none; box-shadow: none; height: 100%; }

/* The household line */
.evh { display: flex; gap: 8px; padding: 10px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; overscroll-behavior-x: contain; }
.evh::-webkit-scrollbar { display: none; }
.evh-chip { flex: 1 1 0; min-width: 76px; max-width: 150px; min-width: 0; scroll-snap-align: start; display: grid; justify-items: center; gap: 3px; padding: 10px 6px 9px; border: 0; border-radius: var(--evc-chip-radius); background: var(--evc-surface); color: inherit; font: inherit; cursor: pointer; text-align: center; }
.evh-chip b { font-size: 13px; font-weight: 600; line-height: 1.2; max-width: 100%; margin-top: 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
.evh-chip small { font-size: 12px; color: var(--evp-soft); max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.evh-chip.tone-coral small { color: color-mix(in srgb, #C2410C 75%, var(--evp-ink)); }
.evh-ring { position: relative; width: 52px; height: 52px; display: grid; place-items: center; }
.evh-ring > svg { position: absolute; inset: 0; width: 52px; height: 52px; transform: rotate(-90deg); }
.evh-ring .track { fill: none; stroke: color-mix(in srgb, var(--evp-ink) 9%, transparent); stroke-width: 4.5; }
.evh-ring .val { fill: none; stroke-width: 4.5; stroke-linecap: round; transition: stroke-dasharray .6s ease; }
.evh-chip.charging .evh-ring .val, .evh-chip.ctl-charge .evh-ring .val { animation: pulse-ring 1.8s ease-in-out infinite; }
@keyframes pulse-ring { 50% { opacity: .45; } }
.evh-ring img { position: relative; width: 38px; height: 30px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,.2)); }
.evh-pct { position: absolute; bottom: -5px; left: 50%; translate: -50% 0; font-style: normal; font-size: 10.5px; font-weight: 650; padding: 0 5px; border-radius: 999px; background: var(--evp-card); box-shadow: 0 0 0 1px var(--evp-line); font-variant-numeric: tabular-nums; white-space: nowrap; }
.evh-ring i { position: relative; font-style: normal; font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.evh-ring i svg { width: 20px; height: 20px; fill: none; stroke: var(--evp-a); stroke-width: 2; stroke-linecap: round; }
.evh-ring.art > svg.art { position: relative; transform: none; width: 30px; height: 30px; inset: auto; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.evh-chip.add { background: color-mix(in srgb, var(--evp-a) 10%, var(--evc-surface)); }

/* The Bubble card: Bubble Card's button, measure for measure, and its variables. */
:host(ev-planner-bubble-card) { --ha-card-backdrop-filter: none; }
:host(ev-planner-bubble-card) ha-card { background: none; border: 0; box-shadow: none; border-radius: 0; overflow: visible; }
.bub {
  --bub-radius: var(--bubble-button-border-radius, var(--bubble-border-radius, calc(var(--row-height, 56px) / 2)));
  --bub-accent: var(--bubble-button-accent-color, var(--bubble-accent-color, var(--bubble-default-color, var(--accent-color, var(--primary-color)))));
  --bub-sub-bg: var(--bubble-sub-button-background-color, var(--bubble-icon-background-color, var(--bubble-secondary-background-color, var(--card-background-color, var(--ha-card-background)))));
  position: relative; display: flex; align-items: center; height: 50px; width: 100%; box-sizing: border-box; overflow: hidden; overflow: clip;
  border-radius: var(--bub-radius);
  background-color: var(--bubble-button-main-background-color, var(--bubble-main-background-color, var(--background-color-2, var(--secondary-background-color))));
  box-shadow: var(--bubble-button-box-shadow, var(--bubble-box-shadow, none));
  border: var(--bubble-button-border, var(--bubble-border, none));
  color: var(--primary-text-color);
  -webkit-tap-highlight-color: transparent;
}
.bub-fill { position: absolute; inset: 0 auto 0 0; background-color: var(--bub-accent); transition: width .5s ease-in-out; pointer-events: none; overflow: hidden; }
.bub.bub-live .bub-fill::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, color-mix(in srgb, #fff 34%, transparent), transparent);
  animation: bub-flow 2.6s ease-in-out infinite;
}
@keyframes bub-flow { to { transform: translateX(100%); } }
.bub-target { position: absolute; top: 10px; bottom: 10px; width: 2px; margin-left: -1px; border-radius: 1px; pointer-events: none; background: color-mix(in srgb, var(--primary-text-color) 32%, transparent); }
.bub-main { position: relative; display: flex; align-items: center; flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; border-radius: var(--bub-radius); }
.bub-main:focus-visible, .bub-sub:focus-visible { outline: 2px solid var(--bub-accent); outline-offset: -2px; }
.bub-icon {
  position: relative; display: grid; place-items: center; flex: none; width: 38px; height: 38px; margin: 6px; overflow: hidden;
  border-radius: var(--bubble-button-icon-border-radius, var(--bubble-icon-border-radius, var(--bubble-border-radius, 50%)));
  background-color: var(--bubble-button-icon-background-color, var(--bubble-icon-background-color, var(--bubble-secondary-background-color, var(--card-background-color, var(--ha-card-background)))));
  color: var(--bubble-icon-color, var(--primary-text-color));
}
.bub-icon img { width: 34px; height: 26px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,.2)); }
.bub-icon > svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.bub-icon > svg.art { width: 26px; height: 26px; stroke-width: 2.8; }
.bub-name { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; margin: 0 16px 0 4px; line-height: 18px; }
.bub-name b { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bub-name > span { font-size: 12px; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.bub-name .dot { width: 7px; height: 7px; margin-right: 5px; }
.bub-name .dot:not(.teal):not(.sand):not(.coral) { display: none; }
.bub-subs { position: relative; display: flex; align-items: center; gap: 8px; margin-right: 8px; flex: none; }
.bub-sub {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; min-width: 36px; height: var(--bubble-sub-button-height, 36px); padding: 0 8px;
  border: 0; border-radius: var(--bubble-sub-button-border-radius, var(--bubble-border-radius, 18px));
  background-color: var(--bub-sub-bg); color: var(--primary-text-color); font: inherit; font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums;
  transition: background-color .5s ease-in-out;
}
button.bub-sub { cursor: pointer; }
.bub-sub.on { background-color: var(--bubble-sub-button-light-background-color, var(--bub-accent)); }
.bub-sub > svg { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.bub-sub > svg .fill { fill: currentColor; stroke: none; }
.bub .evc-msg { padding: 0 18px; font-size: 13px; }
/* Narrow: the text goes first, then the price. */
@container (max-width: 340px) { .bub-sub.info { display: none; } }
@container (max-width: 250px) { .bub-sub > span { display: none; } }
:host(ev-planner-bubble-card) ha-card { container-type: inline-size; }
.bub-menu {
  position: fixed; inset: auto; margin: 0; min-width: 180px; padding: 6px; box-sizing: border-box; display: none; gap: 2px;
  border: var(--bubble-border, none); border-radius: var(--bubble-select-list-border-radius, var(--bubble-border-radius, 20px));
  background-color: var(--bubble-select-list-background-color, var(--bubble-pop-up-background-color, var(--card-background-color, var(--ha-card-background, #fff))));
  box-shadow: 0 12px 32px rgba(0, 0, 0, .22), var(--bubble-box-shadow, 0 0 0 transparent);
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  color: var(--primary-text-color); font-family: var(--ha-font-family-body, inherit);
}
.bub-menu:popover-open { display: grid; animation: bub-menu .16s ease-out; }
@keyframes bub-menu { from { opacity: 0; transform: translateY(-4px); } }
.bub-menu button { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border: 0; border-radius: calc(var(--bubble-select-list-border-radius, var(--bubble-border-radius, 20px)) - 6px); background: none; color: inherit; font: inherit; font-size: 14px; text-align: left; cursor: pointer; }
.bub-menu button:hover { background: color-mix(in srgb, var(--primary-text-color) 7%, transparent); }
.bub-menu button.on { background-color: var(--bubble-select-list-item-accent-color, var(--bubble-list-item-accent-color, var(--bubble-accent-color, var(--accent-color, var(--primary-color))))); font-weight: 600; }
.bub-menu button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
.bub-menu svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@media (prefers-reduced-motion: reduce) { .bub.bub-live .bub-fill::after, .bub-menu:popover-open { animation: none; } .bub-fill { transition: none; } }
`;

const DIALOG_STYLE = `
:host { position: fixed; inset: 0; z-index: 1000; display: block; }
/* Closed: nothing on the screen, and nothing in the way of taps. */
:host([hidden]) { display: none; }
/* Like Home Assistant's own dialogs, and like a Bubble pop-up where the theme styles those
   (Theme Studio does): the scrim, the surface, the corners, the border and the shadow. */
:host {
  --evd-radius: var(--bubble-pop-up-border-radius, var(--ha-dialog-border-radius, 24px));
}
.scrim {
  position: absolute; inset: 0; background: var(--mdc-dialog-scrim-color, rgba(0, 0, 0, .45)); animation: fade .2s ease;
  -webkit-backdrop-filter: var(--ha-dialog-scrim-backdrop-filter, none); backdrop-filter: var(--ha-dialog-scrim-backdrop-filter, none);
}
.sheet {
  position: absolute; left: 50%; bottom: 0; translate: -50% 0; width: 100%; height: min(92dvh, 100% - 24px);
  display: flex; flex-direction: column; overflow: hidden; border-radius: var(--evd-radius) var(--evd-radius) 0 0;
  background: var(--bubble-pop-up-background-color, var(--ha-dialog-surface-background, var(--primary-background-color, #fafafa)));
  -webkit-backdrop-filter: var(--theme-studio-card-backdrop-filter, none); backdrop-filter: var(--theme-studio-card-backdrop-filter, none);
  border: var(--theme-studio-popup-border-css, var(--bubble-pop-up-border, none)); border-bottom: 0; box-sizing: border-box;
  color: var(--primary-text-color, #1c1c1c);
  box-shadow: var(--theme-studio-popup-shadow-css, 0 -10px 40px rgba(0, 0, 0, .25)); animation: up .32s cubic-bezier(.2, .8, .2, 1);
  font-family: var(--ha-font-family-body, Roboto, system-ui, sans-serif);
}
header { position: relative; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 16px 12px 10px 20px; touch-action: none; }
.grab { position: absolute; top: 6px; left: 50%; width: 40px; height: 5px; margin-left: -20px; border-radius: 3px; background: color-mix(in srgb, var(--primary-text-color, #000) 22%, transparent); }
h2 { margin: 0; font-size: 19px; font-weight: 650; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.open { color: var(--primary-color, #009ac7); font-size: 14px; font-weight: 500; text-decoration: none; white-space: nowrap; }
.close { width: 40px; height: 40px; border: 0; border-radius: 12px; background: transparent; color: inherit; display: grid; place-items: center; cursor: pointer; }
.sheet:focus { outline: none; }
.close:hover { background: color-mix(in srgb, var(--primary-text-color, #000) 7%, transparent); }
.close:focus-visible, .open:focus-visible { outline: 2px solid var(--primary-color, #009ac7); outline-offset: 2px; }
.close svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.body { flex: 1; min-height: 0; }
.body ev-planner-panel { height: 100%; --evp-safe-bottom: env(safe-area-inset-bottom, 0px); }
@media (min-width: 870px) {
  .sheet { top: 50%; bottom: auto; width: min(1080px, 94vw); height: min(88dvh, 960px); border-radius: var(--evd-radius); border-bottom: var(--theme-studio-popup-border-css, var(--bubble-pop-up-border, none)); translate: -50% -50%; animation: pop .25s cubic-bezier(.2, .8, .2, 1); }
  .grab { display: none; }
}
@keyframes fade { from { opacity: 0; } }
@keyframes up { from { transform: translateY(100%); } }
@keyframes pop { from { opacity: 0; transform: scale(.97); } }
@media (prefers-reduced-motion: reduce) { .scrim, .sheet { animation: none; } }
`;

/* ------------------------------------------------------------------ registration */

const CARDS = [
  ["ev-planner-household-card", HouseholdCard, "card_household"],
  ["ev-planner-car-card", CarCard, "card_car"],
  ["ev-planner-car-large-card", CarLargeCard, "card_car_large"],
  ["ev-planner-guest-card", GuestCard, "card_guest"],
  ["ev-planner-charger-card", ChargerCard, "card_charger"],
  ["ev-planner-bubble-card", BubbleCard, "card_bubble"],
];

for (const [tag, cls] of CARDS) if (!customElements.get(tag)) customElements.define(tag, cls);
if (!customElements.get("ev-planner-dialog")) customElements.define("ev-planner-dialog", EvPlannerDialog);
if (!customElements.get("ev-planner-card-editor")) customElements.define("ev-planner-card-editor", EvPlannerCardEditor);

window.customCards = window.customCards || [];
for (const [tag, , key] of CARDS) {
  if (window.customCards.some((card) => card.type === tag)) continue;
  window.customCards.push({ type: tag, name: text(key), description: text(`${key}_desc`), preview: true, documentationURL: DOCS });
}

export { HouseholdCard, CarCard, CarLargeCard, GuestCard, ChargerCard, BubbleCard, EvPlannerDialog, EvPlannerCardEditor, watch };
