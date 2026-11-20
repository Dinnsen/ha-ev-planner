/* ====================================================================================================
   2.5.0b48: the pages as drawn ("EV Planner – hele siden"). Every page opens with its own top, which
   holds the brand, the menu and the profile (as Middagsro and Hverdagsro); on a PC the menu is pills at
   the bottom of the top, on a phone a bar floating at the bottom. The content sits in one column of
   at most 1180 px.
   ==================================================================================================== */

const XD = {
  house: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5",
  car: "M5 17h14v-5l-2-5H7l-2 5v5zM5 12h14M8 19v-2M16 19v-2",
  guest: "M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 20c1-4 4-6 7-6s6 2 7 6M19 8v6M16 11h6",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3 2",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  look: "M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1 3.7c.6.4.4 2.3-3 2.3zM7.5 11h.01M10.5 7h.01M15 7.5h.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4",
  party: "M4 20l4-12 8 8-12 4zM14 4l1 3M19 9l-3 1M18 3l-2 3M20 14h.01M10 3h.01",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  smart: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  now: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  pause: "M8 5v14M16 5v14",
  off: "M12 3v8M6.3 7.3a8 8 0 1 0 11.4 0",
  price: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01",
  battery: "M3 7h15v10H3zM21 10v4M7 10v4M11 10v4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  thermo: "M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0z",
  snow: "M12 2v20M4 6l16 12M20 6 4 18",
  back: "M15 6l-6 6 6 6",
  chev: "M9 6l6 6-6 6",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12l5 5 9-10",
  swap: "M7 7h11l-3-3M17 17H6l3 3",
  warn: "M12 3 2 20h20L12 3zM12 10v4M12 17h.01",
  moon: "M14 3a9 9 0 1 0 7 14.5A8 8 0 0 1 14 3Z",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4",
  plug: "M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0zM12 17v5",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z",
  fan: "M12 12c0-4 1-8 4-8 2 0 3 2 2 4-1 2-4 3-6 4zM12 12c4 0 8 1 8 4 0 2-2 3-4 2-2-1-3-4-4-6zM12 12c0 4-1 8-4 8-2 0-3-2-2-4 1-2 4-3 6-4zM12 12c-4 0-8-1-8-4 0-2 2-3 4-2 2 1 3 4 4 6z",
  timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l3 2M9 2h6",
};
const xi = (d, { w = 20, sw = 2, fill = false } = {}) =>
  `<svg class="xi" width="${w}" height="${w}" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="${fill ? "none" : "currentColor"}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const XMARK = '<svg class="x-mark" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="4"/><path d="M14 3 A11 11 0 0 1 25 14" fill="none" stroke="#2fd3a3" stroke-width="4" stroke-linecap="round"/><path d="M15 8 L10 15 H14 L13 20 L18 13 H14 Z" fill="#7ed957"/></svg>';
const XSPARK = '<svg class="xi" width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1 L7.2 4.8 L11 6 L7.2 7.2 L6 11 L4.8 7.2 L1 6 L4.8 4.8 Z" fill="currentColor"/></svg>';
const X_FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap";
const X_TIER = (p, lo, hi) => (p <= lo + (hi - lo) * 0.3 ? "lo" : p <= lo + (hi - lo) * 0.66 ? "mid" : "hi");
const X_TIER_COLOR = { lo: "#3ee08f", mid: "#f5b94a", hi: "#ff7a6b" };
const X_THEMES = ["auto", "light", "dark"];

Object.assign(EvPlannerPanel.prototype, {
  // ------------------------------------------------------------------ the shell

  /* The display font of the drawings (Bricolage Grotesque) and Inter, from Google Fonts, once for the page. */
  _xFonts() {
    if (typeof document === "undefined" || document.getElementById("evp-x-fonts")) return;
    const link = document.createElement("link");
    link.id = "evp-x-fonts";
    link.rel = "stylesheet";
    link.href = X_FONTS;
    document.head.appendChild(link);
  },

  /* Light or dark for the EV Planner look: Auto follows Home Assistant. */
  _xTheme() {
    return X_THEMES.includes(this._theme) ? this._theme : "auto";
  },

  _xDark() {
    const theme = this._xTheme();
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return !!this._hass?.themes?.darkMode;
  },

  _setTheme(theme) {
    if (!X_THEMES.includes(theme)) return;
    this._theme = theme;
    this._applyTheme();
    this._hass?.callWS?.({ type: "frontend/set_user_data", key: "ev_planner_theme", value: theme }).catch(() => {});
    this._render();
  },

  /* The brand, the menu and the profile go into the page's top; on a PC the tabs go there too. */
  _xPark() {
    const root = this.shadowRoot;
    const app = root.querySelector(".app");
    const bar = root.querySelector(".app .bar") || root.querySelector(".bar");
    const nav = root.querySelector("nav.tabs");
    const fab = root.querySelector(".app > .qfab");
    if (bar && bar.parentNode !== app) app.insertBefore(bar, app.firstChild);
    if (nav && nav.parentNode !== app) app.insertBefore(nav, fab || null);
  },

  _xDock() {
    const root = this.shadowRoot;
    const app = root.querySelector(".app");
    const bar = root.querySelector(".bar");
    const nav = root.querySelector("nav.tabs");
    const fab = root.querySelector(".app > .qfab");
    if (!app || !bar || !nav) return;
    const top = root.querySelector(".content .x-top");
    const dock = top?.querySelector(".x-dock");
    if (dock && !this._embed) {
      if (bar.parentNode !== dock) dock.appendChild(bar);
      bar.classList.add("docked");
    } else {
      if (bar.parentNode !== app) app.insertBefore(bar, app.firstChild);
      bar.classList.remove("docked");
    }
    const wide = typeof matchMedia === "function" ? matchMedia("(min-width: 701px)").matches : true;
    const slot = top?.querySelector(".x-tabs");
    if (wide && slot && !this._embed) {
      if (nav.parentNode !== slot) slot.appendChild(nav);
      nav.classList.add("docked");
    } else {
      if (nav.parentNode !== app) app.insertBefore(nav, fab || null);
      nav.classList.remove("docked");
    }
    // The quick menu's button: on Huset and the cars' overview.
    if (fab) {
      const show = !this._embed && this._cars.length && ((this._tab === "home" && !this._currentCharger) || (this._tab === "cars" && !this._currentCar && !this._currentCharger));
      fab.hidden = !show;
      fab.classList.toggle("open", !!this._quick);
      fab.innerHTML = this._quick ? xi(XD.close, { w: 26, sw: 2.6 }) : xi(XD.now, { w: 28, fill: true });
      fab.setAttribute("aria-label", this._t(this._quick ? "close" : "q_open"));
      fab.setAttribute("aria-expanded", String(!!this._quick));
    }
  },

  /* The sky of now: day to night with the sun, fading into the page at the bottom. */
  _xSky(kind = "big") {
    const k = Math.round(this._sceneLight() * 100);
    const mix = (day, night) => `color-mix(in srgb, ${night} ${k}%, ${day})`;
    if (kind === "small") return `linear-gradient(180deg, ${mix("#5fa7ec", "#060a20")} 0%, ${mix("#9fcdf5", "#121a45")} 50%, ${mix("#cfe3f5", "#232a5c")} 86%, ${mix("#b9cde2", "#1a1f3a")} 100%)`;
    if (kind === "car") return `radial-gradient(120% 80% at 50% 82%, rgba(47,211,163,.22) 0%, rgba(47,211,163,0) 46%), linear-gradient(180deg, ${mix("#5fa7ec", "#060a20")} 0%, ${mix("#9fcdf5", "#121a45")} 45%, ${mix("#cfe3f5", "#1c2350")} 70%, var(--x-bg) 100%)`;
    return `linear-gradient(180deg, ${mix("#5fa7ec", "#060a20")} 0%, ${mix("#9fcdf5", "#121a45")} 36%, ${mix("#dceaf7", "#232a5c")} 58%, ${mix("#b9c6d6", "#1a1f3a")} 76%, var(--x-bg) 100%)`;
  },

  _xNight() {
    return this._sceneLight() > 0.5;
  },

  _xStars(list) {
    if (!this._xNight()) return "";
    return list.map(([x, y], i) => `<i class="x-star" style="left:${x}%;top:${y}px;--d:${(i * 0.37).toFixed(2)}s;${i % 3 ? "" : "width:3px;height:3px;"}"></i>`).join("");
  },

  /* The small top of the other pages: the page's name, a line, a slice of the house with the cars, and the prices. */
  _xSmallTop({ title, line = "", back = null, pic = true }) {
    const night = this._xNight();
    const hours = this._hourPrices();
    const known = hours.filter((h) => h.p !== null);
    const lo = known.length ? Math.min(...known.map((h) => h.p)) : 0;
    const hi = known.length ? Math.max(...known.map((h) => h.p)) : 1;
    const dots = known.length
      ? hours.map((h, k) => {
          if (h.p === null) return "<i></i>";
          const car = this._chargeAt(h.at, h.at + 3600e3);
          return `<i class="${X_TIER(h.p, lo, hi)}${k === 0 ? " now" : ""}${car >= 0 ? " chg" : ""}"${car >= 0 ? ` style="--car:${this._carColor(car)}"` : ""}></i>`;
        }).join("")
      : "";
    const backBtn = back ? `<button class="x-round" data-act="${back}" data-f="x-back" aria-label="${esc(this._t("back_label"))}">${xi(XD.back, { sw: 2.4 })}</button>` : "";
    return `<header class="x-top small ${night ? "night" : "day"}" style="background:${this._xSky("small")}" aria-label="${esc(title)}">
      <div class="x-sky">${this._xStars([[10, 30], [38, 18], [59, 44], [72, 22], [88, 50]])}</div>
      <div class="x-in">
        <div class="x-dock"></div>
        ${pic && this._homeShown ? '<div class="x-pic mini-slot" aria-hidden="true"></div>' : ""}
        <div class="x-title">${backBtn}<div><h1>${esc(title)}</h1>${line ? `<span class="x-num">${esc(line)}</span>` : ""}</div></div>
        ${dots ? `<div class="x-rib" role="img" aria-label="${esc(this._t("x_rib_aria"))}">${dots}</div>` : ""}
      </div>
      <div class="x-tabs x-in"></div>
    </header>`;
  },

  /* The small top's line: the cars at home and the price. */
  _xLine() {
    const cars = this._cars.filter((v) => isNum(v.soc)).slice(0, 3).map((v) => `${v.name} ${this._pct(v.soc)}`).join(" · ");
    const price = this._priceNow();
    const best = this._cheapest(this._hourPrices(), 3);
    const pad = (h) => String(h).padStart(2, "0");
    const second = [price !== null ? this._t("mini_now", { price: this._money(price) }) : "", best ? this._t("mini_cheap", { from: `${pad(best.from)}${this._lang === "da" ? ".00" : ":00"}` }) : ""].filter(Boolean).join(" · ");
    return [cars, second].filter(Boolean).join("\n");
  },

  /* Another page in a small top: its own content under it, as it was. */
  _xPage(title, inner, opts = {}) {
    return `${this._xSmallTop({ title, line: opts.line ?? this._xLine(), back: opts.back || null, pic: opts.pic !== false })}<div class="x-wrap x-old">${inner}</div>`;
  },

  _xMountMini() {
    const slot = this.shadowRoot.querySelector(".x-top .x-pic");
    if (!slot || !this._homeShown) return;
    if (!this._mini) {
      this._mini = new ClayScene();
      this._mini.t = (key, vars) => this._t(key, vars);
      this._mini._fit = miniFit;
    }
    slot.appendChild(this._mini.el);
    this._mini.update({ ...this._sceneModel(), labels: [], canEdit: false });
    requestAnimationFrame(() => this._mini && this._mini._fit());
  },

  // ------------------------------------------------------------------ the tabs

  _xTabsHtml() {
    const problems = this._cars.filter((v) => this._troubled(v)).length;
    const icons = { home: XD.house, cars: XD.car, guest: XD.guest, history: XD.bulb, past: XD.history };
    return TABS.filter((tab) => tab !== "home" || this._homeShown).map((tab) => {
      const on = this._tab === tab;
      const badge = tab === "cars" && problems ? `<em class="bad" aria-label="${problems}">${problems}</em>` : "";
      return `<button role="tab" data-tab="${tab}" aria-selected="${on}" class="${on ? "on" : ""}">${xi(icons[tab], { w: 22 })}<span>${this._t(`tab_${tab}`)}</span>${badge}</button>`;
    }).join("");
  },

  // ------------------------------------------------------------------ Huset

  _xGreeting() {
    const hour = ZD().getHours();
    return this._t(hour < 5 ? "greet_night" : hour < 10 ? "greet_morning" : hour < 12 ? "greet_late_morning" : hour < 18 ? "greet_afternoon" : hour < 23 ? "greet_evening" : "greet_night");
  },

  _xOverline() {
    const now = ZD();
    return `${new Intl.DateTimeFormat(this._locale, { weekday: "long", day: "numeric", month: "long" }).format(now)} · ${this._t("hero_week", { n: isoWeek(now) })}`;
  },

  /* The price arc over the house: the next 24 hours as beads, now at the bottom left. */
  _xArcHtml() {
    const hours = this._hourPrices();
    const known = hours.filter((h) => h.p !== null);
    if (known.length < 6) return "";
    const lo = Math.min(...known.map((h) => h.p)), hi = Math.max(...known.map((h) => h.p));
    const at = (k) => { const a = Math.PI * (1 - k / 23); return [50 + 50 * Math.cos(a), 100 - 100 * Math.sin(a), a]; };
    const pad = (h) => String(h).padStart(2, "0");
    const best = this._cheapest(hours);
    const beads = hours.map((h, k) => {
      if (h.p === null) return "";
      const [x, y] = at(k);
      const car = this._chargeAt(h.at, h.at + 3600e3);
      return `<i class="x-bead ${X_TIER(h.p, lo, hi)}${k === 0 ? " now" : ""}${car >= 0 ? " chg" : ""}${h.fc ? " fc" : ""}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%${car >= 0 ? `;--car:${this._carColor(car)}` : ""}" title="${esc(`${pad(h.hour)}.00 · ${this._money(h.p)}`)}"></i>`;
    }).join("");
    const lab = (k, text, cls, out) => {
      const [x, y, a] = at(k);
      return `<span class="x-lab ${cls}" style="left:calc(${x.toFixed(2)}% + ${(Math.cos(a) * out).toFixed(1)}px);top:calc(${y.toFixed(2)}% - ${(Math.sin(a) * out).toFixed(1)}px)">${esc(text)}</span>`;
    };
    let labels = hours[0].p !== null ? `<span class="x-lab x-now-lab">${esc(this._t("x_arc_now", { price: this._num(hours[0].p, 2) }))}</span>` : "";
    hours.forEach((h, k) => { if (k > 0 && h.hour % 6 === 0 && (!best || Math.abs(k - (best.k + 1.5)) > 3)) labels += lab(k, pad(h.hour), "hour", 16); });
    if (best) labels += lab(best.k + 1.5, this._t("arc_cheap", { from: pad(best.from), to: pad(best.to), price: this._money(best.avg) }), "cheap", 30);
    const aria = best ? this._t("arc_aria", { from: pad(best.from), to: pad(best.to) }) : "";
    return `<div class="x-arc" role="img" aria-label="${esc(aria)}">${beads}${labels}</div>`;
  },

  _xHomeTop() {
    const s = this._state.settings || {};
    const night = this._xNight();
    const sites = this._state.sites || [];
    const place = this._placeNow();
    const pills = [];
    if (s.insight) pills.push(`<button class="x-glass x-pill ins${s.insight_use ? " on" : ""}" data-act="insight-open" data-f="insight-open">${XSPARK}<span>${esc(this._t(s.insight_use ? "hero_insight" : "hero_learning"))}</span>${xi(XD.chev, { w: 12, sw: 2.4 })}</button>`);
    const day = dayNow(s, ZD());
    if (day) pills.push(`<span class="x-glass x-pill fest">${esc(this._t(`day_${day}`))}</span>`);
    if (sites.length > 1) sites.forEach((site) => pills.push(`<button class="x-glass x-pill place${site.id === place.id ? " on" : ""}" data-act="place" data-id="${esc(site.id)}" data-f="place-${esc(site.id)}" aria-pressed="${site.id === place.id}">${esc(site.name || this._t("place_home"))}</button>`));
    return `<header class="x-top big ${night ? "night" : "day"}" style="background:${this._xSky("big")}" aria-label="${esc(this._t("tab_home"))}">
      <div class="x-sky">${this._xStars([[7, 62], [16, 98], [30, 70], [44, 104], [55, 66], [67, 92], [77, 60], [90, 110], [24, 160], [61, 152], [86, 180], [5, 208]])}<i class="x-orb ${night ? "moon" : "sun"}"></i></div>
      <div class="x-in">
        <div class="x-dock"></div>
        <div class="x-hello">
          <span class="x-over">${esc(this._xOverline())}</span>
          <h1>${esc(this._xGreeting())}</h1>
          <p>${esc(this._heroLine())}</p>
          ${pills.length ? `<div class="x-pills">${pills.join("")}</div>` : ""}
        </div>
        <div class="x-stage">${this._xArcHtml()}<div class="x-house scene-slot" role="img" aria-label="${esc(this._t("home_title"))}"></div></div>
      </div>
      <div class="x-tabs x-in"></div>
    </header>`;
  },

  _xHomeHtml() {
    const sites = this._state.sites || [];
    const place = this._placeNow();
    const only = sites.length > 1 ? place.id : null;
    const supply = place.home || !only ? this._state.supply : place.supply;
    const cards = [this._xTonightLink(only), place.home && this._state.home?.history ? this._xTodayCard() : "", supply ? this._xSupplyCard(supply, place.home ? null : place) : "", this._xChargersCard(only)].filter(Boolean);
    return `${this._xHomeTop()}<div class="x-wrap x-home">${cards.join("")}</div>`;
  },

  /* "Bilerne i nat": the cars by the charger, each one's level and what it does tonight; it opens Biler. */
  _xTonightLink(siteId) {
    const cars = this._tonightCars().filter((v) => !siteId || (v.site ?? "home") === siteId);
    if (!cars.length) return "";
    const now = znow();
    const items = cars.map((v, i) => {
      const c = this._nextCharge(v);
      const soon = c && ZD(c.start).getTime() < now + 24 * 3600e3;
      const note = c ? (soon ? this._t("x_charges", { when: this._whenSpan(c) }) : this._t("x_waits", { day: this._xDayShort(c.start) })) : this._t("x_enough");
      const side = cars.length > 1 ? (i === 1 ? " r" : "") : " c";
      return `<span class="x-tl-car${side}"><b class="x-tl-name">${esc(v.name)}</b><b class="x-num x-disp x-tl-soc">${isNum(v.soc) ? this._pct(v.soc) : "–"}</b><small class="x-num ${soon ? "on" : ""}">${esc(note)}</small></span>`;
    }).join("");
    return `<button class="x-card x-hero-card x-tonight-link" data-act="x-tab" data-tab="cars" aria-label="${esc(this._t("x_to_cars"))}">
      <span class="x-head"><h2>${esc(this._t("x_cars_tonight"))}</h2><span class="x-go">${esc(this._t("tab_cars"))}${xi(XD.chev, { w: 14, sw: 2.4 })}</span></span>
      <span class="x-tpic tn-pic" role="img" aria-label="${esc(this._t("x_cars_tonight"))}"></span>
      <span class="x-tl-row${cars.length > 1 ? "" : " one"}">${items}</span>
    </button>`;
  },

  _xDayShort(iso) {
    return new Intl.DateTimeFormat(this._locale, { weekday: "short" }).format(ZD(iso)).replace(".", "");
  },

  /* I dag: the house hour by hour (and the sun), the cars' part of it, and what it cost. */
  _xTodayCard() {
    return `<section class="x-card x-today home-today" aria-label="${esc(this._t("home_today"))}">
      <div class="x-head"><h2>${esc(this._t("home_today"))}</h2><span class="x-num x-soft">${esc(new Intl.DateTimeFormat(this._locale, { weekday: "short", day: "numeric", month: "numeric" }).format(ZD()))}</span></div>
      <div class="today-body">${this._xTodayBody()}</div>
    </section>`;
  },

  _xTodayBody() {
    const data = this._houseData?.[this._histKey("day", 0)];
    if (!data) return `<p class="x-soft">…</p>`;
    const rows = data.rows || [];
    const kwh = rows.reduce((sum, r) => sum + (Number(r.kwh) || 0), 0);
    const costs = rows.map((r) => r.cost).filter(isNum);
    const cost = costs.length ? costs.reduce((a, b) => a + Number(b), 0) : null;
    const [start, end] = this._histRange("day", 0);
    const sessions = this._sessionsIn(start, end).filter((e) => !e.elsewhere);
    const cars = sessions.reduce((sum, e) => sum + (Number(e.energy) || 0), 0);
    const carCosts = sessions.map((e) => e.cost).filter(isNum);
    const carCost = carCosts.length ? carCosts.reduce((a, b) => a + Number(b), 0) : null;
    const share = kwh > 0 ? Math.min(100, (cars / kwh) * 100) : 0;
    // The chart: the house's use hour by hour, the sun where it is known, and the hours the cars charged.
    const W = 326, H = 130;
    const byHour = Array.from({ length: 24 }, (_, h) => rows.find((r) => ZD(r.start).getHours() === h));
    const use = byHour.map((r) => (r ? Number(r.kwh) || 0 : null));
    const sun = byHour.map((r) => (r && isNum(r.solar) ? Number(r.solar) : null));
    const top = Math.max(1, ...use.filter(isNum), ...sun.filter(isNum));
    const X = (h) => (h / 24) * W;
    const Y = (v) => H - 18 - (v / top) * (H - 30);
    const nowH = ZD().getHours() + ZD().getMinutes() / 60;
    let usePath = "";
    use.forEach((v, h) => { if (v !== null) usePath += `${usePath ? " L" : "M"}${X(h + 0.5).toFixed(1)} ${Y(v).toFixed(1)}`; });
    let sunPath = "";
    if (sun.some(isNum)) {
      sunPath = `M0 ${Y(0).toFixed(1)}`;
      sun.forEach((v, h) => { if (v !== null) sunPath += ` L${X(h + 0.5).toFixed(1)} ${Y(v).toFixed(1)}`; });
      sunPath += ` L${X(Math.min(24, nowH)).toFixed(1)} ${Y(0).toFixed(1)} Z`;
    }
    let carPath = "";
    for (const e of sessions) {
      const a = ZD(e.start), b = e.end ? ZD(e.end) : ZD();
      const ha = a.getHours() + a.getMinutes() / 60, hb = Math.max(ha + 0.2, b.getDate() === a.getDate() ? b.getHours() + b.getMinutes() / 60 : 24);
      const per = (Number(e.energy) || 0) / Math.max(0.25, hb - ha);
      carPath += `M${X(ha).toFixed(1)} ${Y(0).toFixed(1)} V${Y(Math.min(top, per)).toFixed(1)} H${X(hb).toFixed(1)} V${Y(0).toFixed(1)} Z `;
    }
    const totals = [];
    const sum = (key) => rows.reduce((t, r) => t + (Number(r[key]) || 0), 0);
    if (rows.some((r) => isNum(r.solar))) totals.push([this._t("x_t_sun"), "#ffc83d", sum("solar")]);
    if (rows.some((r) => isNum(r.battery))) totals.push([this._t("x_t_battery"), "#7ed957", sum("battery")]);
    if (rows.some((r) => isNum(r.bought))) totals.push([this._t("x_t_bought"), "#3b8bff", sum("bought")]);
    if (rows.some((r) => isNum(r.sold))) totals.push([this._t("x_t_sold"), "#9a6bff", sum("sold")]);
    return `<div class="x-chart" style="height:130px">
        <svg width="100%" height="130" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          ${sunPath ? `<path d="${sunPath}" fill="#ffc83d" fill-opacity=".28" stroke="#ffc83d" stroke-width="1.6" vector-effect="non-scaling-stroke"/>` : ""}
          ${usePath ? `<path d="${usePath}" fill="none" stroke="#6db4f2" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` : ""}
          ${carPath ? `<path d="${carPath}" fill="var(--x-acc)" fill-opacity=".55"/>` : ""}
          <line x1="${X(nowH).toFixed(1)}" y1="0" x2="${X(nowH).toFixed(1)}" y2="${H}" stroke="var(--x-ink)" stroke-width="1.2" opacity=".7" vector-effect="non-scaling-stroke"/>
        </svg>
        <div class="x-axis x-num"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
      </div>
      <div class="x-well x-tday">
        <div class="x-row"><span>${esc(this._t("x_whole_house"))}</span><span class="x-num"><b class="x-big">${esc(this._kwh(kwh))}</b>${cost !== null ? `<span class="x-soft"> · ${esc(this._money(cost))}</span>` : ""}</span></div>
        <div class="x-share"><i style="width:${share.toFixed(1)}%"></i></div>
        <div class="x-row"><span class="x-key"><i style="background:var(--x-acc)"></i>${esc(this._t("x_of_cars"))}</span><span class="x-num"><b class="x-good">${esc(this._kwh(cars))}</b>${carCost !== null ? `<span class="x-soft"> · ${esc(this._money(carCost))}</span>` : ""}</span></div>
      </div>
      ${totals.length ? `<div class="x-totals">${totals.map(([label, c, v]) => `<div><span><i style="background:${c}"></i>${esc(label)}</span><b class="x-num">${esc(this._kwh(v))}</b></div>`).join("")}</div>` : ""}`;
  },

  /* Hvem får strømmen: the supply now, the house and the cars, and the room for charging. */
  _xSupplyCard(supply, site) {
    const limit = Number(supply.limit) || 0;
    if (!limit) return "";
    const phases = Number(supply.phases) || 3;
    const cars = this._cars.filter((v) => v.connected && (v.site ?? "home") === (site?.id ?? "home"));
    const house = isNum(supply.house_now) ? Number(supply.house_now) : isNum(supply.house_expected) ? Number(supply.house_expected) : 0;
    const carAmps = (v) => Number(supply.cars_now?.[v.id] ?? (v.charging ? supply.cars?.[v.id] : 0) ?? 0) || 0;
    const carsA = cars.reduce((sum, v) => sum + carAmps(v), 0);
    const room = Math.max(0, limit - house - carsA) * 0.23 * phases;
    const row = (name, h, c) => `<div class="x-phase"><b>${esc(name)}</b><div class="x-ptrack"><i style="width:${Math.min(100, (h / limit) * 100).toFixed(1)}%;background:#6db4f2"></i><i style="width:${Math.min(100, (c / limit) * 100).toFixed(1)}%;background:var(--x-acc)"></i></div><span class="x-num">${Math.round(h + c)} / ${Math.round(limit)} A</span></div>`;
    const rows = supply.phase_now && typeof supply.phase_now === "object"
      ? Object.entries(supply.phase_now).map(([name, a]) => row(name, Number(a) || 0, carsA)).join("")
      : Array.from({ length: phases }, (_, i) => row(`L${i + 1}`, house, carsA)).join("");
    return `<section class="x-card x-supply" aria-label="${esc(this._t("x_who_power"))}">
      <div class="x-head"><h2>${esc(site ? `${this._t("x_who_power")} · ${site.name}` : this._t("x_who_power"))}</h2><span class="x-num x-soft">${phases} × ${Math.round(limit)} A</span></div>
      ${rows}
      <div class="x-legend"><span><i style="background:#6db4f2"></i>${esc(this._t("home_house"))}</span><span><i style="background:var(--x-acc)"></i>${esc(this._t("x_the_cars"))}</span><span class="x-push">${esc(this._t("x_room", { kw: this._num(room, room < 10 ? 1 : 0) }))}</span></div>
    </section>`;
  },

  _xChargersCard(siteId) {
    const list = this._chargers.filter((c) => !siteId || (c.site ?? "home") === siteId);
    if (!list.length) return "";
    const rows = list.map((c) => {
      const who = this._chargerWho(c);
      return `<button class="x-line-btn" data-act="open-charger" data-id="${esc(c.id)}"><span class="x-tile-ic">${xi(XD.plug)}</span><span class="x-grow"><b>${esc(c.name)}</b><small class="x-soft">${esc(this._chargerStateText(c, who))}</small></span>${xi(XD.chev, { w: 16, sw: 2.4 })}</button>`;
    }).join("");
    return `<section class="x-card x-chargers"><div class="x-head"><h2>${esc(this._t("x_chargers"))}</h2></div>${rows}</section>`;
  },

  // ------------------------------------------------------------------ Biler

  _xCarsHtml() {
    const cars = this._cars;
    const setup = this._setupHtml();
    if (this._state.settings?.insight) this._insightLoad(() => this._tab === "cars" && !this._currentCar);
    const body = cars.length
      ? `${this._xIssueCard()}${this._xTonightCard()}${this._xWeekCard()}`
      : setup ? "" : `<section class="x-card x-empty">${MARK}<h2>${this._t("no_cars_title")}</h2><p>${this._t("no_cars_text")}</p>
          <a class="x-btn primary" href="/config/integrations/integration/ev_household_planner" target="_top">${ICONS.plus}<span>${this._t("add_car")}</span></a></section>`;
    return `${this._xSmallTop({ title: this._t("tab_cars"), line: this._xLine() })}<div class="x-wrap x-cars">${setup}${body}</div>`;
  },

  /* A problem at the top: a charger that does not answer, or a plan that cannot reach its target. */
  _xIssueCard() {
    const v = this._cars.find((car) => this._troubled(car));
    const short = this._cars.find((car) => car.plan?.short && car.connected);
    if (!v && !short) return "";
    const car = v || short;
    const title = v ? this._t("x_issue_charger", { car: car.name }) : this._t("x_issue_short", { car: car.name, pct: this._pct(car.plan?.end_soc) });
    const text = v ? this._t("problem") : this._t("x_issue_short_text", { when: this._readyText(car.deadline) });
    return `<div class="x-issue" role="status">${xi(XD.warn, { sw: 2.2 })}<div><b>${esc(title)}</b><span>${esc(text)}</span>
      <div class="x-btns"><button class="x-btn warn" data-act="open-car" data-id="${esc(car.id)}">${esc(this._t("x_issue_open"))}</button></div></div></div>`;
  },

  /* I aften, as in Learning: who charges, the cars by the charger, and the next day's prices. */
  _xTonightCard() {
    const cars = this._tonightCars();
    if (!cars.length) return "";
    const now = znow();
    const pad = (h) => String(h).padStart(2, "0");
    const next = cars.map((v) => [v, this._nextCharge(v)]).filter(([, c]) => c && ZD(c.start).getTime() < now + 24 * 3600e3).sort((a, b) => ZD(a[1].start).getTime() - ZD(b[1].start).getTime());
    let head = `<h2 class="x-tn-h">${esc(this._t("x_no_charge_tonight"))}</h2>`;
    let sub = this._t("x_enough_next");
    if (next.length) {
      const [v, c] = next[0];
      const plugged = v.connected === true || v.charging;
      const until = v.deadline ? this._t("x_until", { what: this._readyText(v.deadline) }) : "";
      head = `<h2 class="x-tn-h">${esc(this._t(plugged ? "x_tn_a" : "x_tn_a_plug", { car: v.name }))}<span>${esc(this._whenSpan(c))}</span>${esc(until)}.</h2>`;
      sub = isNum(c.soc) ? this._t("x_tn_reach", { pct: this._pct(c.soc) }) : "";
      for (const w of cars.filter((x) => x !== v)) {
        const own = this._nextCharge(w);
        sub += ` ${own ? this._t("tn_other", { car: w.name, when: this._whenSpan(own) }) : this._t("tn_other_none", { car: w.name })}`;
      }
    }
    const hours = this._hourPrices(20);
    const charging = (h) => this._chargeAt(h.at, h.at + 3600e3);
    const paid = hours.filter((h) => h.p !== null && charging(h) >= 0);
    const best = this._cheapest(hours);
    const nightPrice = paid.length ? paid.reduce((t, h) => t + h.p, 0) / paid.length : best ? best.avg : null;
    const top = Math.max(0.01, ...hours.map((h) => h.p || 0));
    const bars = hours.map((h, n) => {
      if (h.p === null) return "<i></i>";
      const car = charging(h);
      return `<i class="x-bar" style="height:${Math.max(4, (h.p / top) * 46).toFixed(1)}px;${car >= 0 ? `background:${this._carColor(car)};` : ""}animation-delay:${n * 25}ms"></i>`;
    }).join("");
    const ticks = hours.map((h) => `<span>${h.hour % 3 === 0 ? pad(h.hour) : ""}</span>`).join("");
    const steered = (v) => this._steered(v);
    const blocks = cars.map((v, i) => {
      const c = this._nextCharge(v);
      const soon = c && ZD(c.start).getTime() < now + 24 * 3600e3;
      const down = this._troubled(v);
      const note = down ? this._t("x_charger_down") : c ? (soon ? `${this._t("x_charges", { when: this._whenSpan(c) })}${isNum(c.cost) ? ` · ${this._money(c.cost, 0)}` : ""}` : this._t("x_charges_night", { day: this._xDayShort(c.start) })) : this._t("x_enough");
      const s = this._vs(v);
      const day = this._deadlineDay(v);
      const fast = day && isNum(s.day_targets?.[day]) && (!steered(v) || (s.day_fixed || []).includes(day));
      const auto = steered(v) && !fast;
      const tag = v.deadline ? `${auto ? "✦ " : ""}${this._pct(v.target)} · ${this._day(v.deadline).toLowerCase()} ${this._time(v.deadline)}` : this._t("x_no_departure");
      return `<button class="x-tn-car${cars.length > 1 && i === 1 ? " r" : ""}" data-act="open-car" data-id="${esc(v.id)}" data-f="tn-${esc(v.id)}" style="--car:${this._carColor(i)}" aria-label="${esc(this._t("tn_open", { car: v.name }))}">
        <span class="x-tn-name"><b>${esc(v.name)}</b>${xi(XD.chev, { w: 16, sw: 2.4 })}</span>
        <b class="x-num x-disp x-tn-soc">${isNum(v.soc) ? this._pct(v.soc) : "–"}</b>
        <small class="x-num ${down ? "warn" : soon ? "on" : ""}">${esc(note)}</small>
        <small class="x-tag${auto ? " auto" : ""}">${esc(tag)}</small></button>`;
    }).join("");
    const s = this._state.settings || {};
    const one = this._chargers.filter((c) => (c.site ?? "home") === "home").length === 1;
    const holder = cars.find((v) => v.connected === true);
    const swap = one && cars.length > 1 && s.insight && s.insight_window
      ? `<button class="x-swap" data-act="x-pop" data-pop="swap" aria-expanded="${this._xPop === "swap"}">${xi(XD.swap, { w: 18 })}<span>${esc(this._t("x_swap", { from: this._hhmm(s.insight_from || "21:00"), to: this._hhmm(s.insight_to || "07:00") }))}${holder ? ` · ${esc(this._t("x_swap_has", { car: holder.name }))}` : ""}</span><b>?</b></button>
        ${this._xPop === "swap" ? `<p class="x-note">${esc(this._t("x_swap_help"))}</p>` : ""}`
      : "";
    const why = this._xPop === "why" ? `<div class="x-popover" role="note">${cars.map((v, i) => {
      const c = this._nextCharge(v);
      const text = c ? this._t("x_why_charge", { car: v.name, pct: this._pct(c.soc ?? v.target), when: this._whenSpan(c) }) : this._t("x_why_enough", { car: v.name, pct: this._pct(v.soc) });
      return `<div><i style="background:${this._carColor(i)}"></i><span>${esc(text)}</span></div>`;
    }).join("")}</div>` : "";
    return `<section class="x-card x-hero-card x-tn" aria-label="${esc(this._t("tn_title"))}">
      <div class="x-tn-top">
        <div class="x-tn-when"><span class="x-moon">${xi(XD.moon, { fill: true })}</span><span><b>${esc(this._t("tn_title"))}</b><small>${esc(new Intl.DateTimeFormat(this._locale, { weekday: "long", day: "numeric", month: "numeric" }).format(ZD()))}</small></span></div>
        <div class="x-tn-price">${nightPrice !== null ? `<span class="x-pricechip"><b class="x-num">${esc(this._money(nightPrice))}</b><small>${esc(this._t("tn_night"))}</small></span>` : ""}<button class="x-q" data-act="x-pop" data-pop="why" aria-label="${esc(this._t("x_why"))}" aria-expanded="${this._xPop === "why"}">?</button></div>
      </div>
      ${why}
      <div class="x-tn-words">${head}${sub ? `<p>${esc(sub.trim())}</p>` : ""}</div>
      <div class="x-tpic tn-pic" role="img" aria-label="${esc(this._t("x_cars_tonight"))}"></div>
      <div class="x-tn-cars${cars.length > 1 ? "" : " one"}">${blocks}</div>
      ${swap}
      ${hours.some((h) => h.p !== null) ? `<div class="x-well x-strip"><div class="x-row x-soft"><span>${esc(this._t("x_next_day_prices"))}</span><span class="x-num">${best ? esc(this._t("x_cheap_at", { from: pad(best.from), to: pad(best.to) })) : ""}</span></div><div class="x-bars20">${bars}</div><div class="x-ticks20 x-num">${ticks}</div></div>` : ""}
    </section>`;
  },

  /* A car's departures in the next seven days, from today: the week plan, a moved one, or none. */
  _xDeps(v) {
    const s = this._vs(v);
    const now = znow();
    const today = ZD();
    const steered = this._steered(v);
    const charges = this._weekCharges(v);
    const trip = v.trip;
    const tripAt = trip?.at ? ZD(trip.at) : null;
    const out = [];
    for (let k = 0; k < 7; k += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k);
      const wd = WEEKDAYS[(date.getDay() + 6) % 7];
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const value = s.use_ready_by === false ? "none" : (s.schedule || {})[wd] || "default";
      const once = !!(tripAt && trip.kind === "once" && tripAt.toDateString() === date.toDateString());
      let time = value === "default" ? s.ready_by || "07:00" : value === "none" ? null : value;
      if (once) time = `${String(tripAt.getHours()).padStart(2, "0")}:${String(tripAt.getMinutes()).padStart(2, "0")}`;
      const [hh, mm] = String(time || "0:0").split(":").map(Number);
      const at = time ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm).getTime() : null;
      const own = isNum(s.day_targets?.[wd]) ? Number(s.day_targets[wd]) : null;
      const fixed = once ? isNum(trip.target) : own !== null && (!steered || (s.day_fixed || []).includes(wd));
      const pct = once && isNum(trip.target) ? Number(trip.target) : fixed ? own : null;
      // Auto: Insight's level for the departure: the car's target for the next one, else where the week plan has it then.
      let auto = null;
      if (!fixed && at !== null) {
        if (v.deadline && Math.abs(ZD(v.deadline).getTime() - at) < 60000) auto = Number(v.target);
        else {
          const before = charges.filter((c) => ZD(c.end).getTime() <= at).at(-1);
          auto = before && isNum(before.level) ? Number(before.level) : steered ? null : Number(s.target_soc) || 80;
        }
      }
      const charge = at !== null ? charges.find((c) => ZD(c.end).getTime() <= at && ZD(c.end).getTime() > at - 30 * 3600e3) : null;
      out.push({
        k, wd, iso, date, value: once ? "other" : value, time, at, past: at !== null && at <= now, once, fixed, pct, auto, steered,
        climate: isNum(s.day_climate?.[wd]) ? Number(s.day_climate[wd]) : null, charge,
        weekend: (date.getDay() === 0 || date.getDay() === 6),
      });
    }
    return out;
  },

  _xPctText(d) {
    if (d.time === null) return d.weekend && d.value === "none" ? this._t("x_free") : "–";
    if (d.k === 0 && d.past) return this._t("x_gone");
    if (d.fixed) return `${Math.round(d.pct)}`;
    if (d.steered) return `✦${isNum(d.auto) ? Math.round(d.auto) : ""}`;
    return `${Math.round(d.auto ?? 80)}`;
  },

  /* Bilernes uge: the price, each car's battery and its charges over the next seven days, and the week plan under it. */
  _xWeekCard() {
    const cars = this._cars;
    if (!cars.length) return "";
    const today = ZD();
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const W = 326, H = 156, span = 7 * 24 * 3600e3;
    const X = (t) => clamp(((t - t0) / span) * W, 0, W);
    const prices = (this._state.prices || []).map((p) => [ZD(p.start).getTime(), Number(p.price)]).filter(([t, p]) => Number.isFinite(p) && t >= t0 && t < t0 + span);
    const plo = prices.length ? Math.min(...prices.map((p) => p[1])) : 0, phi = prices.length ? Math.max(...prices.map((p) => p[1])) : 1;
    const PY = (p) => 58 - ((p - plo) / (phi - plo || 1)) * 50;
    const BY = (l) => 150 - (clamp(l, 0, 100) / 100) * 78;
    const price = prices.map(([t, p], i) => `${i ? "L" : "M"}${X(t).toFixed(1)} ${PY(p).toFixed(1)}`).join(" ");
    const full = this._insight?.week;
    const lines = cars.slice(0, 4).map((v, i) => {
      const color = this._carColor(i);
      const deps = this._xDeps(v);
      const charges = this._weekCharges(v);
      let pts = [];
      const typical = full?.cars?.[v.id]?.typical;
      if (Array.isArray(typical) && full.start) {
        const s0 = ZD(full.start).getTime();
        pts = typical.map((l, h) => [s0 + h * 3600e3, l]).filter(([t]) => t >= t0 && t <= t0 + span);
      } else {
        let level = isNum(v.soc) ? Number(v.soc) : 50;
        pts.push([znow(), level]);
        for (const c of charges) {
          pts.push([ZD(c.start).getTime(), level]);
          level = isNum(c.level) ? Number(c.level) : level;
          pts.push([ZD(c.end).getTime(), level]);
        }
        pts.push([t0 + span, level]);
      }
      const line = pts.map(([t, l], k) => `${k ? "L" : "M"}${X(t).toFixed(1)} ${BY(l).toFixed(1)}`).join(" ");
      const fills = charges.map((c) => `M${X(ZD(c.start).getTime()).toFixed(1)} 72 H${X(ZD(c.end).getTime()).toFixed(1)} V150 H${X(ZD(c.start).getTime()).toFixed(1)} Z`).join(" ");
      const levelAt = (t) => { let l = pts[0]?.[1] ?? 0; for (const [pt, pl] of pts) { if (pt <= t) l = pl; } return l; };
      const pins = deps.filter((d) => d.at !== null && d.at > znow()).map((d) => { const x = X(d.at), y = BY(levelAt(d.at)); return `M${(x - 3.5).toFixed(1)} ${y.toFixed(1)} a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0`; }).join(" ");
      return `<path d="${fills}" fill="${color}" fill-opacity=".2"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${pins}" fill="var(--x-well)" stroke="${color}" stroke-width="2"/>`;
    }).join("");
    const nowX = X(znow());
    const sel = this._xSel && cars.some((v) => v.id === this._xSel.car) ? this._xSel : null;
    const days = Array.from({ length: 7 }, (_, k) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + k));
    const head = days.map((d, k) => `<span class="${k === 0 ? "today" : sel && sel.k === k ? "sel" : ""}"><b>${esc(this._xWd(d))}</b><small class="x-num">${d.getDate()}</small></span>`).join("");
    const cols = days.map((d, k) => `<i class="${sel && sel.k === k ? "sel" : d.getDay() === 0 || d.getDay() === 6 ? "we" : ""}"></i>`).join("");
    const legend = cars.slice(0, 4).map((v, i) => `<span><i style="background:${this._carColor(i)}"></i>${esc(v.name.split(" ")[0])}</span>`).join("");
    const grid = cars.map((v, i) => {
      const deps = this._xDeps(v);
      const cells = deps.map((d) => {
        const on = sel && sel.car === v.id && sel.k === d.k;
        const pct = this._xPctText(d);
        const cls = [on ? "on" : "", d.k === 0 && d.past ? "past" : "", d.time === null ? "none" : "", d.once ? "once" : "", d.fixed ? "fast" : d.steered ? "auto" : ""].filter(Boolean).join(" ");
        return `<button class="x-cell ${cls}" data-act="x-cell" data-id="${esc(v.id)}" data-k="${d.k}" aria-pressed="${!!on}" aria-label="${esc(`${v.name} ${this._weekdayName(d.wd).toLowerCase()}: ${d.time ? `${this._hhmm(d.time)}, ${pct}` : this._t("no_deadline")}`)}">
          <small class="x-num">${d.time ? esc(this._hhmm(d.time)) : d.k === 0 && d.past ? esc(this._t("x_gone")) : " "}</small><b class="x-num">${esc(pct)}</b>
          <span class="x-cellmarks"><i class="x-bolt"${d.charge ? ` style="background:${this._carColor(i)}"` : ""}></i>${d.climate !== null && v.climate ? xi(XD.snow, { w: 10, sw: 2.6 }) : ""}</span></button>`;
      }).join("");
      return `<div class="x-wrow"><button class="x-wname" data-act="open-car" data-id="${esc(v.id)}"><i style="background:${this._carColor(i)}"></i>${esc(v.name)}${xi(XD.chev, { w: 12, sw: 2.4 })}</button><div class="x-cells">${cells}</div></div>`;
    }).join("");
    const help = this._xPop === "week" ? `<div class="x-popover" role="note"><span>${esc(this._t("x_week_help1"))}</span><span>${esc(this._t("x_week_help2"))}</span><span>${esc(this._t("x_week_help3"))}</span></div>` : "";
    return `<section class="x-card x-week" aria-label="${esc(this._t("wk_title"))}">
      <div class="x-head"><span class="x-hl"><h2>${esc(this._t("wk_title"))}</h2><button class="x-q small" data-act="x-pop" data-pop="week" aria-label="${esc(this._t("x_week_about"))}" aria-expanded="${this._xPop === "week"}">?</button></span>
        <span class="x-legend"><span><i class="line"></i>${esc(this._t("x_price"))}</span>${legend}</span></div>
      ${help}
      <div class="x-days">${head}</div>
      <div class="x-graph">
        <div class="x-cols">${cols}</div>
        <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="72" x2="${W}" y2="72" stroke="var(--x-line2)" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
          <line x1="0" y1="111" x2="${W}" y2="111" stroke="var(--x-line2)" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
          ${lines}
          ${price ? `<path d="${price}" fill="none" stroke="var(--x-ink)" stroke-width="1.4" stroke-linejoin="round" opacity=".85" vector-effect="non-scaling-stroke"/>` : ""}
          <line x1="${nowX.toFixed(1)}" y1="0" x2="${nowX.toFixed(1)}" y2="${H}" stroke="var(--x-ink)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="x-nowtag x-num" style="left:${((nowX / W) * 100).toFixed(1)}%">${esc(this._t("x_now"))}</span>
        <span class="x-glab" style="top:75px">100 %</span><span class="x-glab" style="top:140px">0 %</span>
      </div>
      ${grid}
      ${sel ? this._xEditorHtml(this._car(sel.car), sel.k, "x-ed") : ""}
    </section>`;
  },

  _xWd(date) {
    const name = new Intl.DateTimeFormat(this._locale, { weekday: "short" }).format(date).replace(".", "");
    return name.charAt(0).toUpperCase() + name.slice(1, 3);
  },

  /* The chosen day of a car: ready by (none, the car's usual time, another), the target (Auto or Fast),
     whether it is that day only or every week, and the climate. */
  _xEditorHtml(v, k, cls = "x-ed") {
    if (!v) return "";
    const d = this._xDeps(v)[k];
    if (!d) return "";
    const s = this._vs(v);
    const i = this._cars.findIndex((c) => c.id === v.id);
    const usual = s.ready_by || "07:00";
    const kind = d.once ? "other" : d.value === "default" ? "default" : d.value === "none" ? "none" : "other";
    const seg = (act, items, current) => `<div class="x-seg n${items.length}" role="group">${items.map(([key, label]) => `<button data-act="${act}" data-id="${esc(v.id)}" data-k="${k}" data-value="${key}" aria-pressed="${key === current}" class="${key === current ? "on" : ""}">${label}</button>`).join("")}</div>`;
    const dateText = `${this._weekdayName(d.wd).toLowerCase()} ${d.date.getDate()}/${d.date.getMonth() + 1}`;
    const has = d.time !== null;
    const pct = d.fixed ? Math.round(d.pct) : Math.round(d.auto ?? Number(s.target_soc) ?? 80);
    const autoLabel = d.steered ? `${XSPARK} ${esc(this._t("x_auto_pct", { pct: isNum(d.auto) ? `≈${Math.round(d.auto)} %` : "" }))}` : esc(this._t("x_std_pct", { pct: `${Math.round(Number(s.target_soc) || 80)} %` }));
    let result = this._t("x_res_none");
    if (has && !(d.k === 0 && d.past)) {
      const c = d.charge;
      result = c
        ? this._t("x_res_charge", { when: `${this._whenSpan(c)}`, kwh: this._kwh(c.kwh), cost: this._money(c.cost), pct: this._pct(c.level ?? pct), time: this._hhmm(d.time) })
        : this._t("x_res_enough", { time: this._hhmm(d.time) });
      if (d.climate !== null && v.climate) {
        const start = new Date(d.at - (Number(s.climate_minutes) || 15) * 60000);
        result += ` · ${this._t("x_res_climate", { time: `${String(start.getHours()).padStart(2, "0")}${this._lang === "da" ? "." : ":"}${String(start.getMinutes()).padStart(2, "0")}` })}`;
      }
    } else if (has && d.k === 0 && d.past) result = this._t("x_res_gone");
    return `<div class="${cls} x-pop-in" data-ed="${esc(v.id)}">
      <div class="x-ed-head"><span><i style="background:${this._carColor(i)}"></i>${esc(`${v.name.split(" ")[0]} · ${dateText}`)}</span><button class="x-round small" data-act="x-ed-close" aria-label="${esc(this._t("close"))}">${xi(XD.close, { w: 16, sw: 2.4 })}</button></div>
      <div class="x-field"><small>${esc(this._t("q_ready"))}</small>
        ${seg("x-kind", [["none", esc(this._t("sched_none_short"))], ["default", esc(this._t("x_std_time", { time: this._hhmm(usual) }))], ["other", kind === "other" && d.time ? esc(this._hhmm(d.time)) : `${esc(this._t("sched_other_short"))} …`]], kind)}
        ${kind === "other" ? `<div class="x-time-row"><label class="x-time"><span>${esc(this._t("x_time"))}</span><input type="time" step="900" data-x-time="${esc(v.id)}" data-k="${k}" value="${esc(d.time || usual)}" aria-label="${esc(this._t("x_time"))}"></label>${d.once ? "" : `<button class="x-btn ghost${d.time === usual ? " on" : ""}" data-act="x-make-std" data-id="${esc(v.id)}" data-k="${k}">${esc(this._t("x_make_std"))}</button>`}</div>` : ""}
      </div>
      ${has ? `<div class="x-field"><small>${esc(this._t("x_target"))}</small>
        ${seg("x-mode", [["auto", autoLabel], ["fast", esc(d.fixed ? this._t("x_fast_pct", { pct: `${Math.round(d.pct)} %` }) : this._t("x_fast"))]], d.fixed ? "fast" : "auto")}
        ${d.fixed ? `<div class="x-step"><span>${esc(this._t("x_ready_with"))}</span><div><button class="x-sq" data-act="x-step" data-id="${esc(v.id)}" data-k="${k}" data-d="-5" aria-label="${esc(this._t("x_less"))}">−</button><b class="x-num x-disp">${Math.round(d.pct)} %</b><button class="x-sq" data-act="x-step" data-id="${esc(v.id)}" data-k="${k}" data-d="5" aria-label="${esc(this._t("x_more"))}">+</button></div></div>` : ""}
      </div>
      <div class="x-field"><small>${esc(this._t("x_applies"))}</small>
        ${seg("x-scope", [["once", esc(this._t("x_only", { day: `${this._xDayShort(d.date.toISOString?.() ? d.date : d.date)}`.toLowerCase(), date: `${d.date.getDate()}/${d.date.getMonth() + 1}` }))], ["every", esc(this._t("x_every", { day: this._weekdayName(d.wd).toLowerCase() }))]], d.once ? "once" : "every")}
      </div>
      ${v.climate ? `<button class="x-clim-row" data-act="x-clim" data-id="${esc(v.id)}" data-k="${k}" aria-pressed="${d.climate !== null}"><span class="x-clim-ic${d.climate !== null ? " on" : ""}">${xi(XD.snow, { w: 18, sw: 2.2 })}</span><span class="x-grow"><b>${esc(this._t("x_clim_dep"))}</b><small class="x-num">${esc(d.climate !== null ? this._t("x_clim_sub", { temp: this._num(d.climate, 1), min: Number(s.climate_minutes) || 15 }) : this._t("x_off"))}</small></span><span class="x-sw${d.climate !== null ? " on" : ""}"><i></i></span></button>` : ""}` : ""}
      <div class="x-result">${xi(XD.now, { w: 16, fill: true })}<span class="x-num">${esc(result)}</span></div>
    </div>`;
  },

  /* A setting of any car, stored at once and shown at once. */
  async _xSet(v, changes) {
    if (!v) return;
    this._state = { ...this._state, vehicles: this._cars.map((car) => (car.id === v.id ? { ...car, settings: { ...(car.settings || {}), ...changes } } : car)) };
    this._render();
    await this._run("set", "ev_household_planner/vehicle_set", { vehicle_id: v.id, settings: changes });
  },

  async _xTrip(v, d, { time, target, clear = false } = {}) {
    if (!v) return;
    if (clear) {
      this._state = { ...this._state, vehicles: this._cars.map((car) => (car.id === v.id ? { ...car, trip: null } : car)) };
      this._render();
      await this._run("trip", "ev_household_planner/vehicle_trip", { vehicle_id: v.id, kind: null });
      return;
    }
    const t = (time || d.time || this._vs(v).ready_by || "07:00").slice(0, 5);
    const [hh, mm] = t.split(":").map(Number);
    const at = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate(), hh, mm);
    if (at.getTime() <= znow()) {
      this._toast(this._t("x_time_gone"));
      return;
    }
    this._state = { ...this._state, vehicles: this._cars.map((car) => (car.id === v.id ? { ...car, trip: { kind: "once", at: at.toISOString(), target: target ?? null, day: d.iso } } : car)) };
    this._render();
    await this._run("trip", "ev_household_planner/vehicle_trip", { vehicle_id: v.id, kind: "once", date: d.iso, time: t, target: target ?? null });
  },

  /* The editor's buttons (in Biler and in a car's Afgange). */
  _xEditorAct(act, button) {
    const v = this._car(button.dataset.id);
    if (!v) return false;
    const k = Number(button.dataset.k);
    const d = this._xDeps(v)[k];
    if (!d) return false;
    const s = this._vs(v);
    const schedule = { ...(s.schedule || {}) };
    const targets = { ...(s.day_targets || {}) };
    const fixed = new Set(s.day_fixed || []);
    const value = button.dataset.value;
    switch (act) {
      case "x-kind":
        if (d.once) {
          if (value !== "other") this._xTrip(v, d, { clear: true });
          if (value === "none") this._xSet(v, { use_ready_by: true, schedule: { ...schedule, [d.wd]: "none" } });
          return true;
        }
        if (value === "other") {
          const [hh, mm] = String(s.ready_by || "07:00").split(":").map(Number);
          schedule[d.wd] = `${String((hh + 1) % 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        } else schedule[d.wd] = value;
        this._xSet(v, { use_ready_by: true, schedule });
        return true;
      case "x-make-std":
        if (!d.time) return true;
        for (const day of WEEKDAYS) if (schedule[day] === d.time) schedule[day] = "default";
        schedule[d.wd] = "default";
        this._xSet(v, { use_ready_by: true, ready_by: d.time, schedule });
        this._toast(this._t("sched_default_set", { time: this._hhmm(d.time) }));
        return true;
      case "x-mode":
        if (d.once) {
          this._xTrip(v, d, { target: value === "fast" ? Math.round((d.auto ?? Number(s.target_soc) ?? 80) / 5) * 5 : null });
          return true;
        }
        if (value === "auto") {
          delete targets[d.wd];
          fixed.delete(d.wd);
        } else {
          targets[d.wd] = clamp(Math.round((d.auto ?? Number(s.target_soc) ?? 80) / 5) * 5, 10, 100);
          fixed.add(d.wd);
        }
        this._xSet(v, { day_targets: targets, day_fixed: WEEKDAYS.filter((day) => fixed.has(day)) });
        return true;
      case "x-step": {
        const next = clamp(Math.round((d.pct ?? 80) + Number(button.dataset.d)), 10, 100);
        if (d.once) this._xTrip(v, d, { target: next });
        else {
          targets[d.wd] = next;
          fixed.add(d.wd);
          this._xSet(v, { day_targets: targets, day_fixed: WEEKDAYS.filter((day) => fixed.has(day)) });
        }
        return true;
      }
      case "x-scope":
        if (value === "once" && !d.once) this._xTrip(v, d, { target: d.fixed ? d.pct : null });
        else if (value === "every" && d.once) this._xTrip(v, d, { clear: true });
        return true;
      case "x-clim": {
        const climates = { ...(s.day_climate || {}) };
        if (isNum(climates[d.wd])) delete climates[d.wd];
        else climates[d.wd] = Number(s.climate_temperature) || 21;
        this._xSet(v, { day_climate: climates });
        return true;
      }
      default:
        return false;
    }
  },

  _xEditorTime(input) {
    const v = this._car(input.dataset.xTime);
    if (!v || !input.value) return;
    const d = this._xDeps(v)[Number(input.dataset.k)];
    if (!d) return;
    if (d.once) this._xTrip(v, d, { time: input.value, target: d.fixed ? d.pct : null });
    else this._xSet(v, { use_ready_by: true, schedule: { ...(this._vs(v).schedule || {}), [d.wd]: input.value.slice(0, 5) } });
  },

  // ------------------------------------------------------------------ a car's own page

  _xCarTop(v) {
    const sub = this._carSubline(v);
    const c = v.climate;
    const on = c?.on === true;
    const body = ClayScene.BODIES.includes(v.settings?.body) ? v.settings.body : "sedan";
    const photo = v.image ? `<img class="x-carimg photo" src="${esc(v.image)}" alt="${esc(v.name)}">` : `<span class="x-carimg drawn" role="img" aria-label="${esc(v.name)}">${ClayScene.preview(body, v.settings?.paint === "black" ? "black" : "white").replace(/<rect[^>]*url\(#cs-bg\)[^>]*\/>/, "")}</span>`;
    return `<header class="x-top car ${this._xNight() ? "night" : "day"}" style="background:${this._xSky("car")}" aria-label="${esc(v.name)}">
      <div class="x-sky">${this._xStars([[12, 30], [30, 70], [64, 24], [82, 60]])}</div>
      <div class="x-in">
        <div class="x-dock"></div>
        <div class="x-carrow">
          ${this._embed ? "" : `<button class="x-round" data-act="back" data-f="back" aria-label="${esc(this._t("back_label"))}">${xi(XD.back, { sw: 2.4 })}</button>`}
          <div class="x-grow"><b class="x-disp">${esc(v.name)}</b><small>${esc(sub)}</small></div>
          ${c ? `<button class="x-round clim${on ? " on" : ""}" data-act="climate-open" data-f="climate" aria-pressed="${on}" aria-haspopup="dialog" aria-label="${esc(this._t("climate_label"))}">${xi(XD.thermo)}</button>` : ""}
        </div>
        <div class="x-carglow" aria-hidden="true"></div>
        <button class="x-carpic" data-act="photo-look" data-kind="car" data-id="${esc(v.id)}" aria-label="${esc(this._t(v.image ? "photo_change" : "photo_add"))}">${photo}</button>
        ${v.image ? `<span class="x-phototag">${esc(this._t("x_own_photo"))}</span>` : ""}
      </div>
      <div class="x-tabs x-in"></div>
    </header>`;
  },

  _xCarHtml(v) {
    const view = this._embed ? "now" : CAR_VIEWS.includes(this._carView) ? this._carView : "now";
    const views = this._embed
      ? ""
      : `<nav class="x-views" role="tablist" aria-label="${esc(v.name)}">${CAR_VIEWS.map((k) => `<button role="tab" data-act="car-view" data-view="${k}" data-f="cv-${k}" aria-selected="${k === view}" class="${k === view ? "on" : ""}">${this._t(`view_${k}`)}</button>`).join("")}</nav>`;
    const top = this._xCarTop(v);
    if (view === "rules") {
      return `${top}<div class="x-wrap x-carpage car-page view-rules" data-id="${esc(v.id)}">${views}<div class="tiles x-rules"></div><div class="sheet-slot"></div></div>`;
    }
    if (view === "history") {
      return `${top}<div class="x-wrap x-carpage car-page view-history" data-id="${esc(v.id)}">${views}${this._xHistCard(v)}<div class="x-old">${this._carHistoryHtml(v)}${this._learnedCarHtml(v)}</div></div>`;
    }
    return `${top}<div class="x-wrap x-carpage car-page view-now" data-id="${esc(v.id)}">${views}
      <div class="x-cargrid">
        <section class="x-card x-hero-card x-next" aria-label="${esc(this._t("x_next_dep"))}">
          <div class="x-nexthead"></div>
          <div class="dial-wrap x-clock">
            <svg class="dial big" viewBox="0 0 400 400" role="img" aria-label="${this._t("prices_title")}"></svg>
            <div class="dial-center big"></div>
          </div>
          <div class="x-slider">
            <div class="x-slab-row"><span class="x-slab x-num"></span></div>
            ${this._batteryHtml()}
          </div>
          <div class="x-modes" role="group" aria-label="${esc(this._t("mode_label"))}">${["smart", "charge_now", "pause"].map((m) => `<button data-act="mode" data-id="${esc(v.id)}" data-mode="${m}" data-f="mode-${esc(v.id)}-${m}" aria-pressed="${v.mode === m}" class="${v.mode === m ? "on" : ""} m-${m}">${xi({ smart: XD.smart, charge_now: XD.now, pause: XD.pause }[m], { w: 16, sw: 2.2, fill: v.mode === m && m !== "pause" })}<span>${this._t(`mode_${m}`)}</span></button>`).join("")}<button class="m-off${v.mode === "off" ? " on" : ""}" data-act="mode" data-id="${esc(v.id)}" data-mode="off" aria-pressed="${v.mode === "off"}" aria-label="${esc(this._t("mode_off"))}" title="${esc(this._t("mode_off"))}">${xi(XD.off, { w: 18, sw: 2.2 })}</button></div>
          <div class="status-line"></div>
          <div class="car-notes"></div>
        </section>
        <div class="x-side">
          <section class="x-card x-price" aria-label="${esc(this._t("prices_title"))}"><div class="x-head"><h2>${esc(this._t("x_price_days"))}</h2><span class="x-legend"><span><i class="line acc"></i>${esc(this._t("x_battery"))}</span></span></div><div class="x-price-body"></div></section>
          <section class="x-card x-deps" aria-label="${esc(this._t("x_deps"))}"><div class="x-head"><h2>${esc(this._t("x_deps"))}</h2><button class="x-link" data-act="x-tab" data-tab="cars">${esc(this._t("x_household_week"))}</button></div><div class="x-deps-body"></div></section>
        </div>
      </div>
    </div>`;
  },

  /* The next departure: when, at what, and what decides its target (Insight: Auto or Fast). */
  _xNextHead(v, shown) {
    const s = this._vs(v);
    const model = this._batteryModel();
    const mode = v.mode;
    const target = model ? Math.round(model.limit) : Math.round(Number(v.target) || 80);
    const when = shown.deadline ? `${this._xDayShort(shown.deadline).toLowerCase()} ${this._t("x_at")} ${this._time(shown.deadline)}` : this._t("x_no_departure");
    const plan = shown.plan;
    const line = mode === "pause"
      ? this._t("x_paused_line")
      : plan && hasSegments(plan)
        ? `${this._pct(plan.end_soc ?? target)} · ${this._t("x_charges", { when: this._whenSpan({ start: plan.segments[0].start, end: plan.segments.at(-1).end }) })}`
        : `${this._pct(target)} · ${this._t("x_no_charge")}`;
    const steered = this._steered(v);
    let ctl, cls;
    if (mode === "charge_now") { ctl = this._t("mode_charge_now"); cls = "now"; }
    else if (mode === "pause") { ctl = this._t("mode_pause"); cls = "plain"; }
    else if (model?.auto) { ctl = `${this._t("target_auto")} · ${target} %`; cls = "auto"; }
    else { ctl = `${this._t("x_fast_short")} · ${target} %`; cls = "plain"; }
    const help = mode === "charge_now" ? this._t("x_ctl_now") : model?.auto ? this._t("x_ctl_auto") : steered ? this._t("x_ctl_fast") : this._t("x_ctl_plain");
    return `<div class="x-nh"><small class="x-over2">${esc(this._t("x_next_dep_caps"))}</small><b class="x-disp x-num">${esc(when)}</b><span class="x-num x-soft">${esc(line)}</span></div>
      <button class="x-ctl ${cls}" data-act="x-pop" data-pop="ctl" aria-expanded="${this._xPop === "ctl"}">${steered ? `<small>${XSPARK} ${esc(this._t("x_insight_caps"))}</small>` : ""}<b>${esc(ctl)}</b></button>
      ${this._xPop === "ctl" ? `<div class="x-popover right" role="note"><span>${esc(help)}</span><span class="x-soft">${esc(this._t("x_ctl_limit"))}</span></div>` : ""}`;
  },

  /* The slider's label over the bar, and "back to Auto" under it. */
  _xSlider(model) {
    const root = this.shadowRoot;
    const lab = root.querySelector(".x-slab");
    if (!lab || !model) return;
    const v = this._currentCar;
    const limit = Math.round(clamp(model.limit, 0, 100));
    const now = v?.mode === "charge_now";
    lab.style.left = `${clamp(limit, 8, 92)}%`;
    lab.className = `x-slab x-num ${now ? "now" : model.auto ? "auto" : "fast"}`;
    lab.innerHTML = now ? esc(this._t("q_go", { pct: `${limit} %` })) : model.auto ? `${XSPARK} ${esc(this._t("target_auto"))} · ${limit} %` : `${esc(this._t("x_fast_short"))} · ${limit} %`;
    const box = root.querySelector(".x-slider");
    box?.classList.toggle("now", now);
    box?.classList.toggle("auto", !!model.auto);
  },

  /* Elpris de næste døgn: 48 hours of prices, the battery over them, and the departure. */
  _xPriceHtml(v, shown) {
    const from = Math.floor(znow() / 3600e3) * 3600e3;
    const slots = (this._state.prices || []).map((p) => [ZD(p.start).getTime(), Number(p.price)]).filter(([, p]) => Number.isFinite(p));
    const hours = Array.from({ length: 48 }, (_, k) => {
      const a = from + k * 3600e3;
      const inside = slots.filter(([t]) => t >= a && t < a + 3600e3);
      return { at: a, p: inside.length ? inside.reduce((t, [, p]) => t + p, 0) / inside.length : null };
    });
    const known = hours.filter((h) => h.p !== null);
    if (!known.length) return `<p class="x-soft">${esc(this._t("no_prices"))}</p>`;
    const lo = Math.min(...known.map((h) => h.p)), hi = Math.max(...known.map((h) => h.p));
    const top = Math.max(0.01, hi);
    const plan = shown.plan;
    const charging = (h) => plan && hasSegments(plan) && plan.segments.some((s) => ZD(s.start).getTime() < h.at + 3600e3 && ZD(s.end).getTime() > h.at);
    const PW = 326, PH = 132;
    const bars = hours.map((h, k) => (h.p === null ? "<i></i>" : `<i class="x-bar" style="height:${Math.max(6, (Math.max(0, h.p) / top) * PH).toFixed(1)}px;background:${charging(h) ? "var(--x-acc)" : X_TIER_COLOR[X_TIER(h.p, lo, hi)]};opacity:${charging(h) ? 0.95 : 0.42};animation-delay:${k * 12}ms"></i>`)).join("");
    const X = (t) => clamp(((t - from) / (48 * 3600e3)) * PW, 0, PW);
    const Y = (l) => PH - 6 - (clamp(l, 0, 100) / 100) * (PH - 16);
    const points = this._socForecast(v, shown);
    const level = points && points.length > 1 ? [...points, [from + 48 * 3600e3, points.at(-1)[1]]].map(([t, l], i) => `${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(l).toFixed(1)}`).join(" ") : "";
    const dep = shown.deadline ? ZD(shown.deadline).getTime() : null;
    const depX = dep !== null && dep < from + 48 * 3600e3 ? X(dep) : null;
    const target = plan && isNum(plan.end_soc) ? plan.end_soc : v.target;
    const ticks = Array.from({ length: 8 }, (_, k) => `<span>${String(ZD(from + k * 6 * 3600e3).getHours()).padStart(2, "0")}</span>`).join("");
    const paid = hours.filter((h) => h.p !== null && charging(h));
    const pay = paid.length ? paid.reduce((t, h) => t + h.p, 0) / paid.length : null;
    return `<div class="x-pchart">
        <div class="x-pbars">${bars}</div>
        <svg width="100%" height="${PH}" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="none" aria-hidden="true">
          ${level ? `<path d="${level}" fill="none" stroke="var(--x-acc)" stroke-width="2.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` : ""}
          ${depX !== null ? `<line x1="${depX.toFixed(1)}" y1="0" x2="${depX.toFixed(1)}" y2="${PH}" stroke="var(--x-warn-ink)" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>` : ""}
        </svg>
        ${depX !== null ? `<span class="x-deptag x-num" style="left:${clamp((depX / PW) * 100, 12, 88).toFixed(1)}%">${esc(`${this._xDayShort(shown.deadline).toLowerCase()} ${this._time(shown.deadline)} · ${this._pct(target)}`)}</span>` : ""}
        <div class="x-pticks x-num">${ticks}</div>
      </div>
      <div class="x-pfoot x-num"><span>${esc(this._t("x_now_short"))} <b class="hi">${esc(this._money(hours[0].p))}</b></span>${pay !== null ? `<span>${esc(this._t("x_charges_at"))} <b class="good">${esc(this._money(pay))}</b></span>` : ""}<span>${esc(this._t("x_cheapest"))} <b>${esc(this._money(lo))}</b></span></div>`;
  },

  /* Afgange: the car's week as a strip, and its departures, each with its own target and climate. */
  _xDepsHtml(v) {
    const deps = this._xDeps(v);
    const open = this._xDepOpen && this._xDepOpen.car === v.id ? this._xDepOpen.k : null;
    const strip = deps.map((d) => {
      const pct = this._xPctText(d);
      const cls = [open === d.k ? "on" : "", d.k === 0 && d.past ? "past" : "", d.time === null ? "none" : "", d.once ? "once" : "", d.fixed ? "fast" : d.steered ? "auto" : ""].filter(Boolean).join(" ");
      return `<button class="x-wk ${cls}" data-act="x-dep" data-id="${esc(v.id)}" data-k="${d.k}" aria-pressed="${open === d.k}" aria-label="${esc(`${this._weekdayName(d.wd)}: ${d.time ? this._hhmm(d.time) : this._t("no_deadline")}`)}"><small>${esc(this._xWd(d.date))}</small><b class="x-num">${esc(pct)}</b><small class="x-num">${d.time ? esc(this._hhmm(d.time)) : " "}</small></button>`;
    }).join("");
    const rows = deps.filter((d) => d.time !== null && !(d.k === 0 && d.past)).map((d) => {
      const isOpen = open === d.k;
      const pct = d.fixed ? `${Math.round(d.pct)} %` : d.steered ? `✦ ${isNum(d.auto) ? `≈${Math.round(d.auto)} %` : this._t("target_auto")}` : this._pct(d.auto ?? 80);
      const note = d.charge ? ` · ${this._t("x_charges", { when: this._whenSpan(d.charge) })}` : "";
      return `<div class="x-dep${isOpen ? " open" : ""}">
        <div class="x-deprow">
          <button class="x-depmain" data-act="x-dep" data-id="${esc(v.id)}" data-k="${d.k}" aria-expanded="${isOpen}">
            <span class="x-depday${d.once ? " once" : ""}"><b>${esc(this._xWd(d.date).toUpperCase())}</b><b class="x-num x-disp">${d.date.getDate()}</b></span>
            <span class="x-grow"><b class="x-num">${esc(this._t("x_at_time", { time: this._hhmm(d.time) }))}</b><small>${esc(d.once ? this._t("x_once") : this._t("x_every", { day: this._weekdayName(d.wd).toLowerCase() }))}${esc(note)}</small></span>
            <span class="x-pctpill ${d.fixed ? "fast" : d.steered ? "auto" : "plain"}">${esc(pct)}</span>
          </button>
          ${v.climate ? `<button class="x-climbtn${d.climate !== null ? " on" : ""}" data-act="x-clim" data-id="${esc(v.id)}" data-k="${d.k}" aria-pressed="${d.climate !== null}" aria-label="${esc(this._t("x_clim_dep"))}">${xi(XD.snow, { w: 18, sw: 2.2 })}</button>` : ""}
        </div>
        ${isOpen ? this._xEditorHtml(v, d.k, "x-ed inline") : ""}
      </div>`;
    }).join("");
    return `<div class="x-wkstrip">${strip}</div>${rows || `<p class="x-soft">${esc(this._t("x_no_departures"))}</p>`}${open !== null && !deps[open]?.time ? this._xEditorHtml(v, open, "x-ed inline") : ""}`;
  },

  /* Historik: the month, its days, and the latest charges. */
  _xHistCard(v) {
    const month = (v.months || [])[0] || v.month || {};
    const now = ZD();
    const name = new Intl.DateTimeFormat(this._locale, { month: "long" }).format(now).toUpperCase();
    const history = (v.history || []).filter((e) => !e.elsewhere);
    const inMonth = history.filter((e) => { const d = ZD(e.start); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const cost = isNum(month.cost) ? Number(month.cost) : inMonth.reduce((t, e) => t + (Number(e.cost) || 0), 0);
    const kwh = isNum(month.energy) ? Number(month.energy) : inMonth.reduce((t, e) => t + (Number(e.energy) || 0), 0);
    const saved = isNum(month.saved) ? Number(month.saved) : null;
    const days = Array.from({ length: Math.min(20, now.getDate()) }, (_, i) => {
      const day = now.getDate() - Math.min(20, now.getDate()) + 1 + i;
      return inMonth.filter((e) => ZD(e.start).getDate() === day).reduce((t, e) => t + (Number(e.energy) || 0), 0);
    });
    const peak = Math.max(1, ...days);
    const bars = days.map((k, i) => `<i class="x-bar${i === days.length - 1 ? " last" : k ? " on" : ""}" style="height:${Math.max(3, Math.round((k / peak) * 92))}px;animation-delay:${i * 20}ms"></i>`).join("");
    const last = history.slice(0, 3).map((e) => {
      const d = ZD(e.start);
      const a = isNum(e.start_soc) ? Number(e.start_soc) : null, b = isNum(e.end_soc) ? Number(e.end_soc) : null;
      const line = [a !== null && b !== null ? `${this._pct(a)} → ${this._pct(b)}` : "", isNum(e.energy) ? this._kwh(e.energy) : "", isNum(e.cost) && isNum(e.energy) && e.energy > 0 ? `${this._money(e.cost / e.energy)}/kWh` : ""].filter(Boolean).join(" · ");
      return `<div class="x-lastrow"><span class="x-daybox"><b class="x-num x-disp">${d.getDate()}</b><small>${esc(new Intl.DateTimeFormat(this._locale, { month: "short" }).format(d))}</small></span>
        <span class="x-grow"><b class="x-num">${esc(`${this._time(e.start)}–${e.end ? this._time(e.end) : "…"}`)}</b>${a !== null && b !== null ? `<span class="x-socbar"><i style="left:${a}%;width:${Math.max(1, b - a)}%"></i></span>` : ""}<small class="x-num x-soft">${esc(line)}</small></span>
        <b class="x-num">${esc(isNum(e.cost) ? this._money(e.cost) : "–")}</b></div>`;
    }).join("");
    return `<section class="x-card x-hero-card x-hist" aria-label="${esc(this._t("view_history"))}">
      <div class="x-histhead"><div><small class="x-over2">${esc(name)}</small><b class="x-disp x-num x-histbig">${esc(this._money(cost, 0))}</b></div>
        <div class="x-right"><b class="x-num">${esc(this._kwh(kwh, 0))}</b>${kwh > 0 ? `<small class="x-num x-good">${esc(`${this._money(cost / kwh)}/kWh${saved !== null ? ` · ${this._t("x_saved", { money: this._money(saved, 0) })}` : ""}`)}</small>` : ""}</div></div>
      <div class="x-monthbars">${bars}</div>
      ${last}
    </section>`;
  },

  /* Regler: each group as a card with a small picture of what it does. */
  _xRulesHtml(v, s, groups) {
    const look = {
      price: [XD.price, "rgba(47,211,163,.15)", "var(--x-acc-ink)"],
      battery: [XD.battery, "rgba(126,217,87,.15)", "#8fd96f"],
      time: [XD.clock, "rgba(140,110,255,.18)", "var(--x-vio)"],
      climate: [XD.thermo, "rgba(59,139,255,.16)", "var(--x-blue-ink)"],
      notify: [XD.bell, "rgba(245,185,74,.16)", "var(--x-warn-ink)"],
      supply: [XD.plug, "rgba(255,154,122,.16)", "var(--x-coral)"],
      sun: [XD.sun, "rgba(255,200,61,.16)", "#ffc83d"],
      look: [XD.car, "rgba(255,255,255,.08)", "var(--x-ink2)"],
    };
    const vis = (key) => {
      const hm = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return ((h + m / 60) / 24) * 100; };
      if (key === "battery") return [Number(s.min_soc) || 0, 100, s.low_soc_charging ? Number(s.low_soc_level) || 20 : -1];
      if (key === "price") return [0, s.price_ceiling_enabled ? 55 : 100, s.low_price_charging ? 20 : -1];
      if (key === "time") return s.use_earliest_start ? [hm(s.earliest_start || "18:00"), 100, -1] : [0, 0, -1];
      if (key === "climate") return [0, ((Number(s.climate_temperature) || 21) - 10) / 20 * 100, ((Number(s.climate_temperature) || 21) - 10) / 20 * 100];
      if (key === "notify") return s.reminder ? [hm(s.reminder_time || "16:00"), 100, -1] : [0, 0, -1];
      return [0, 0, -1];
    };
    return groups.map((g) => {
      const [d, bg, fg] = look[g.key] || [XD.gear, "rgba(255,255,255,.08)", "var(--x-ink2)"];
      const [a, b, mark] = vis(g.key);
      const chips = String(g.summary || this._t("tile_off")).split(" · ").filter(Boolean).map((t) => `<span class="x-num">${esc(t)}</span>`).join("");
      const attrs = g.key === "notify" ? `data-act="goto-settings" data-tile="notifications" data-car="${esc(v.id)}"` : `data-act="tile" data-tile="${g.key}" aria-haspopup="dialog"`;
      return `<button class="x-rule${g.summary ? "" : " off"}" ${attrs} data-f="tile-${g.key}">
        <span class="x-rule-head"><span class="x-tile-ic" style="background:${bg};color:${fg}">${xi(d)}</span><b>${esc(g.title)}</b>${xi(XD.chev, { w: 16, sw: 2.4 })}</span>
        ${b > a ? `<span class="x-rvis"><i style="left:${a}%;width:${b - a}%;background:${fg}"></i>${mark >= 0 ? `<i class="mark" style="left:calc(${mark}% - 1px)"></i>` : ""}</span>` : ""}
        <span class="x-chips">${chips}</span></button>`;
    }).join("");
  },

  // ------------------------------------------------------------------ the profile menu

  _xProfHtml() {
    const name = String(this._hass?.user?.name || "").trim();
    const initial = (name[0] || "?").toUpperCase();
    const tiles = [
      ["houseday", XD.sun, "rgba(245,185,74,.16)", "var(--x-warn-ink)", this._t("preview_tag")],
      ["look", XD.look, "rgba(47,211,163,.16)", "var(--x-acc-ink)", ""],
      ["settings", XD.gear, "rgba(255,255,255,.08)", "var(--x-ink2)", ""],
      ["notifications", XD.bell, "rgba(140,110,255,.18)", "var(--x-vio)", ""],
      ["days", XD.party, "rgba(255,122,107,.16)", "var(--x-coral)", ""],
      ["support", XD.help, "rgba(59,139,255,.16)", "var(--x-blue-ink)", ""],
    ];
    return `<div class="x-prof-head"><span class="x-avatar">${esc(initial)}</span><div class="x-grow"><b class="x-disp">${esc(name || this._t("prof_open"))}</b><small>${esc(this._t(this._hass?.user?.is_admin ? "x_admin" : "x_user"))}</small></div><button class="x-round small" data-prof="close" aria-label="${esc(this._t("close"))}">${xi(XD.close, { w: 16, sw: 2.4 })}</button></div>
      <div class="prof-tiles x-prof-tiles">${tiles.map(([key, d, bg, fg, tag]) => `<button role="menuitem" data-prof="${key}"><span class="x-tile-ic" style="background:${bg};color:${fg}">${xi(d)}</span><span>${esc(this._t(`prof_${key}`))}</span>${tag ? `<em class="prev">${esc(tag)}</em>` : ""}</button>`).join("")}</div>
      <i class="x-handle" aria-hidden="true"></i>`;
  },

  // ------------------------------------------------------------------ the quick menu

  _xQuickCars() {
    const q = this._quick;
    const list = this._cars;
    const picked = (q.pick || []).filter((id) => list.some((v) => v.id === id));
    return picked.length ? list.filter((v) => picked.includes(v.id)) : list.slice(0, 1);
  },

  _xQuickTo(v) {
    const q = this._quick;
    if (isNum(q.to[v.id])) return Number(q.to[v.id]);
    if (v.mode === "charge_now" && isNum(v.settings?.now_target)) return Number(v.settings.now_target);
    return Math.round((Number(v.target) || 80) / 5) * 5;
  },

  _xQuickHtml() {
    const q = this._quick;
    const all = this._cars;
    const cars = this._xQuickCars();
    const many = all.length > 1;
    const both = many && cars.length === all.length;
    const anyNow = cars.some((v) => v.mode === "charge_now");
    const allNow = cars.every((v) => v.mode === "charge_now");
    const climOn = cars.some((v) => v.climate?.on === true);
    const temp = Number(this._vs(cars[0]).climate_temperature) || 21;
    const chips = many
      ? `<div class="x-qchips" role="group" aria-label="${esc(this._t("x_which_cars"))}">${all.map((v, i) => {
          const on = cars.length === 1 && cars[0].id === v.id;
          return `<button data-q="pick" data-id="${esc(v.id)}" aria-pressed="${on}" class="${on ? "on" : ""}" style="--car:${this._carColor(i)}"><i></i><span><b>${esc(v.name.split(" ")[0])}</b><small class="x-num">${esc(`${isNum(v.soc) ? this._pct(v.soc) : "–"}${v.mode === "charge_now" || v.charging ? ` · ${this._t("x_charging_short")}` : ""}`)}</small></span></button>`;
        }).join("")}<button data-q="pick" data-id="*" aria-pressed="${both}" class="${both ? "on" : ""} both" style="--car:var(--x-vio)"><i></i><span><b>${esc(this._t(all.length > 2 ? "q_all" : "q_both"))}</b><small>${esc(this._t("x_same_action"))}</small></span></button></div>`
      : `<div class="x-qone"><i style="background:${this._carColor(0)}"></i><b>${esc(all[0].name)}</b><span class="x-num x-soft">${esc(this._carSubline(all[0]).split(" · ")[0] || "")}${isNum(all[0].soc) ? ` · ${this._pct(all[0].soc)}` : ""}</span></div>`;
    const readySub = cars.length > 1 ? cars.map((v) => (v.deadline ? this._xDayShort(v.deadline).toLowerCase() : "–")).join(" · ") : cars[0].deadline ? `${this._xDayShort(cars[0].deadline).toLowerCase()} ${this._time(cars[0].deadline)}` : this._t("x_none");
    const tile = (key, label, sub, active, icon) => `<button role="tab" data-q="tab" data-tab-q="${key}" aria-selected="${q.tab === key}" class="x-qtile ${key}${q.tab === key ? " sel" : ""}${active ? " active" : ""}"><span class="x-qic">${icon}</span><b>${esc(label)}</b><small class="x-num">${esc(sub)}</small></button>`;
    const tiles = `<div class="x-qtiles" role="tablist">${tile("now", this._t("q_now"), anyNow ? (allNow ? this._t("x_charging_short") : this._t("x_partly")) : this._t("x_off"), anyNow, xi(XD.now, { w: 22, fill: true }))}${tile("climate", this._t("q_climate"), climOn ? this._t("x_clim_running", { temp: this._num(temp, 1) }) : this._t("x_off"), climOn, `<svg class="xi${climOn ? " x-spin" : ""}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${XD.fan}"/></svg>`)}${tile("ready", this._t("q_ready"), readySub, true, xi(XD.timer, { w: 22, sw: 2.2 }))}</div>`;
    let panel = "";
    if (q.tab === "now") {
      let kwh = 0, hrs = 0;
      cars.forEach((v) => { const k = Math.max(0, ((this._xQuickTo(v) - (Number(v.soc) || 0)) / 100) * (Number(v.capacity) || 0)); kwh += k; hrs += k / (Number(v.power) || 11); });
      const ready = new Date(znow() + hrs * 3600e3);
      const sub = anyNow
        ? this._t("x_now_sub_on", { time: `${String(ready.getHours()).padStart(2, "0")}${this._lang === "da" ? "." : ":"}${String(ready.getMinutes()).padStart(2, "0")}`, kwh: this._kwh(kwh) })
        : (() => { const c = this._nextCharge(cars[0]); return c ? this._t("x_now_sub_off", { when: this._whenSpan(c) }) : this._t("x_now_sub_none"); })();
      const sliders = cars.map((v) => {
        const i = all.findIndex((x) => x.id === v.id);
        const soc = clamp(Number(v.soc) || 0, 0, 100);
        const to = clamp(this._xQuickTo(v), 20, 100);
        const on = v.mode === "charge_now";
        return `<div class="x-qs"><div class="x-row"><span class="x-key"><i style="background:${this._carColor(i)}"></i>${esc(`${v.name.split(" ")[0]} · ${this._pct(soc)}`)}</span><b class="x-num x-qtag${on ? " on" : ""}">${esc(this._t("q_to", { pct: `${to} %` }))}</b></div>
          <div class="x-qbar" style="--soc:${soc}%;--to:${to}%;--car:${this._carColor(i)}"><div class="x-qin"><i class="soc"></i><i class="add"></i></div><i class="knob"></i><input type="range" min="20" max="100" step="5" value="${to}" data-q="to" data-id="${esc(v.id)}" aria-label="${esc(this._t("x_now_to", { car: v.name }))}"><i class="nub"></i></div></div>`;
      }).join("");
      const preset = q.preset || "";
      const opt = (key, label) => `<button data-q="preset" data-p="${key}" class="${preset === key ? "on" : ""}" aria-pressed="${preset === key}">${esc(label)}</button>`;
      panel = `<div class="x-qpanel">
        <button class="x-qrow${allNow ? " on" : ""}" data-q="toggle-now" aria-pressed="${allNow}"><span><b>${esc(both ? this._t("x_now_both") : this._t("x_now_one", { car: cars[0].name.split(" ")[0] }))}</b><small class="x-num">${esc(sub)}</small></span><span class="x-sw big${allNow ? " on warn" : ""}"><i></i></span></button>
        ${sliders}
        <div class="x-qopts">${opt("plan", this._t("x_dep_target"))}${opt("full", "100 %")}${opt("hour", this._t("x_plus_hour"))}</div>
      </div>`;
    } else if (q.tab === "climate") {
      const able = cars.filter((v) => v.climate);
      if (!able.length) panel = `<div class="x-qpanel"><p class="x-soft">${esc(this._t("q_no_climate"))}</p></div>`;
      else {
        const v = able[0];
        const m = this._climateModel(v);
        const dep = this._xDeps(v).find((d) => d.time && !d.past);
        const depOn = !!dep && dep.climate !== null;
        panel = `<div class="x-qpanel">
          <div class="x-qclim"><div class="cabin-pop x-qcabin${m.classes}" style="--k:${m.k.toFixed(2)}">${this._cabinSvg()}</div>
            <div class="x-qclim-ctl"><span class="x-state${m.on ? " on" : ""} ${m.mode}">${esc(m.on ? m.status : depOn ? this._t("x_clim_ready_for", { when: `${this._xDayShort(new Date(dep.at)).toLowerCase()} ${this._hhmm(dep.time)}` }) : this._t("climate_off"))}</span>
              <div class="x-temp"><button class="x-roundbtn cold" data-q="temp" data-d="-0.5" aria-label="${esc(this._t("climate_colder"))}">‹</button><b class="x-num x-disp">${esc(m.fmt(m.temp))}°</b><button class="x-roundbtn warm" data-q="temp" data-d="0.5" aria-label="${esc(this._t("climate_warmer"))}">›</button></div>
              <div class="x-temps x-num">${m.inside !== null ? `<span><b>${esc(m.fmt(m.inside))}°</b> ${esc(this._t("climate_inside_short"))}</span>` : ""}${m.outside !== null ? `<span><b>${esc(m.fmt(m.outside))}°</b> ${esc(this._t("climate_outside_short"))}</span>` : ""}</div></div></div>
          <div class="x-two"><button class="x-bigbtn${m.on ? " warm" : ""}" data-q="clim-now" aria-pressed="${m.on}">${esc(this._t(m.on ? "x_clim_stop" : "x_clim_start"))}</button><button class="x-bigbtn${depOn ? " light" : ""}" data-q="clim-dep" aria-pressed="${depOn}"${dep ? "" : " disabled"}>${esc(this._t("x_clim_for_dep"))}${depOn ? " ✓" : ""}</button></div>
        </div>`;
      }
    } else {
      const today = ZD();
      const day = q.day || "tomorrow";
      const base = day === "today" ? today : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const opts = day === "today" ? [1, 2, 3, 4].map((n) => (today.getHours() + n) % 24) : [6, 7, 8, 9];
      const time = q.time || `${String(opts[day === "today" ? 1 : 1]).padStart(2, "0")}:00`;
      const mode = q.mode || "auto";
      const pct = q.pct || 90;
      const v0 = cars[0];
      const need = cars.reduce((t, v) => t + Math.max(0, (((mode === "fast" ? pct : Number(v.target) || 80) - (Number(v.soc) || 0)) / 100) * (Number(v.capacity) || 0)), 0);
      const [hh, mm] = time.split(":").map(Number);
      const late = day === "today" && new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm).getTime() <= znow();
      const when = `${this._xDayShort(base).toLowerCase()} ${this._hhmm(time)}`;
      const seg2 = (key, label, cur, attr) => `<button data-q="${attr}" data-v="${key}" class="${cur === key ? "on" : ""}" aria-pressed="${cur === key}">${label}</button>`;
      panel = `<div class="x-qpanel">
        <div class="x-seg n2" role="group" aria-label="${esc(this._t("x_which_day"))}">${seg2("today", esc(`${this._t("today")} · ${this._xDayShort(today).toLowerCase()}`), day, "day")}${seg2("tomorrow", esc(`${this._t("tomorrow")} · ${this._xDayShort(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)).toLowerCase()}`), day, "day")}</div>
        <div class="x-qtimes" role="group" aria-label="${esc(this._t("q_ready"))}">${opts.map((h) => { const t = `${String(h).padStart(2, "0")}:00`; return `<button data-q="time" data-v="${t}" class="${time === t ? "on" : ""}" aria-pressed="${time === t}">${esc(this._hhmm(t))}</button>`; }).join("")}<label class="x-qother${opts.every((h) => `${String(h).padStart(2, "0")}:00` !== time) ? " on" : ""}"><input type="time" step="900" data-q="time-in" value="${esc(time)}" aria-label="${esc(this._t("sched_other_short"))}"></label></div>
        <div class="x-seg n2" role="group" aria-label="${esc(this._t("x_target"))}">${seg2("auto", `${XSPARK} ${esc(this._t("x_auto_pct", { pct: isNum(v0.target) ? `≈${Math.round(v0.target)} %` : "" }))}`, mode, "mode")}${seg2("fast", esc(mode === "fast" ? this._t("x_fast_pct", { pct: `${pct} %` }) : this._t("x_fast")), mode, "mode")}</div>
        ${mode === "fast" ? `<div class="x-qpct"><button class="x-sq" data-q="pct" data-d="-5" aria-label="${esc(this._t("x_less"))}">−</button><div class="x-qpbar"><i style="width:${pct}%"></i><i class="now" style="left:calc(${clamp(Number(v0.soc) || 0, 0, 100)}% - 1px)"></i></div><button class="x-sq" data-q="pct" data-d="5" aria-label="${esc(this._t("x_more"))}">+</button></div>` : ""}
        <button class="x-save" data-q="save"${late ? " disabled" : ""}>${xi(XD.check, { w: 18, sw: 2.6 })}${esc(this._t("x_save_ready", { when, pct: mode === "fast" ? ` · ${pct} %` : "" }))}</button>
        <span class="x-qnote x-num">${esc(late ? this._t("x_time_gone") : need > 0.05 ? this._t("x_ready_note", { kwh: this._kwh(need), when }) : this._t("x_has_enough"))}</span>
      </div>`;
    }
    return `<div class="x-scrim fade" data-q="close"></div>
      <section class="x-quick" role="dialog" aria-label="${esc(this._t("q_open"))}">${chips}${tiles}${panel}${q.toast ? `<div class="x-qtoast">${xi(XD.check, { w: 16, sw: 2.6 })}<span>${esc(q.toast)}</span></div>` : ""}</section>`;
  },

  _renderQuick() {
    const root = this.shadowRoot.querySelector(".sheet-root");
    if (!this._quick || !root) return;
    const focus = root.contains(this.shadowRoot.activeElement) ? this.shadowRoot.activeElement : null;
    const key = focus ? [focus.dataset.q, focus.dataset.id, focus.dataset.tabQ, focus.dataset.p, focus.dataset.v].join("|") : null;
    root.dataset.key = "";
    root.innerHTML = this._xQuickHtml();
    const back = key && [...root.querySelectorAll("[data-q]")].find((el) => [el.dataset.q, el.dataset.id, el.dataset.tabQ, el.dataset.p, el.dataset.v].join("|") === key);
    (back || root.querySelector(".x-qtile.sel"))?.focus({ preventScroll: true });
    root.onclick = (ev) => this._onQuickClick(ev);
    root.oninput = (ev) => {
      const input = ev.target.closest('[data-q="to"]');
      if (!input) return;
      this._quick.to[input.dataset.id] = Number(input.value);
      this._quick.preset = "";
      const box = input.closest(".x-qs");
      box.querySelector(".x-qbar").style.setProperty("--to", `${input.value}%`);
      box.querySelector(".x-qtag").textContent = this._t("q_to", { pct: `${input.value} %` });
      const v = this._car(input.dataset.id);
      if (v?.mode === "charge_now") {
        clearTimeout(this._quickTimer);
        this._quickTimer = setTimeout(() => this._run("mode", "ev_household_planner/vehicle_set", { vehicle_id: v.id, settings: { mode: "charge_now", now_target: Number(input.value) } }), 600);
      }
    };
    root.onchange = (ev) => {
      const input = ev.target.closest('[data-q="time-in"]');
      if (input?.value) { this._quick.time = input.value.slice(0, 5); this._renderQuick(); }
    };
    root.onkeydown = (ev) => ev.key === "Escape" && this._closeQuick();
    this._xDock();
  },

  _closeQuick() {
    this._quick = null;
    const root = this.shadowRoot.querySelector(".sheet-root");
    if (root && root.querySelector(".x-quick")) {
      root.innerHTML = "";
      root.onclick = root.oninput = root.onkeydown = root.onchange = null;
    }
    this._xDock();
    this.shadowRoot.querySelector(".app > .qfab")?.focus();
  },

  async _onQuickClick(ev) {
    const el = ev.target.closest("[data-q]");
    if (!el || !this._quick) return;
    const q = this._quick;
    const cars = this._xQuickCars();
    const say = (text) => { q.toast = text; };
    switch (el.dataset.q) {
      case "close":
        this._closeQuick();
        return;
      case "tab":
        q.tab = el.dataset.tabQ;
        q.toast = "";
        break;
      case "pick":
        q.pick = el.dataset.id === "*" ? this._cars.map((v) => v.id) : [el.dataset.id];
        q.toast = "";
        break;
      case "preset":
        q.preset = el.dataset.p;
        for (const v of cars) {
          const kw = Number(v.power) || 11, cap = Number(v.capacity) || 60;
          q.to[v.id] = el.dataset.p === "full" ? 100 : el.dataset.p === "hour" ? clamp(Math.round(((Number(v.soc) || 0) + (kw / cap) * 100) / 5) * 5, 20, 100) : clamp(Math.round((Number(v.target) || 80) / 5) * 5, 20, 100);
        }
        break;
      case "toggle-now": {
        const allNow = cars.every((v) => v.mode === "charge_now");
        for (const v of cars) {
          const settings = allNow ? { mode: "smart" } : { mode: "charge_now", now_target: this._xQuickTo(v) };
          this._state = { ...this._state, vehicles: this._cars.map((car) => (car.id === v.id ? { ...car, mode: settings.mode, settings: { ...(car.settings || {}), ...settings } } : car)) };
          this._run("mode", "ev_household_planner/vehicle_set", { vehicle_id: v.id, settings });
        }
        say(allNow ? this._t("x_back_to_plan") : this._t("x_now_started", { car: cars.length > 1 ? this._t("x_both_cars") : cars[0].name.split(" ")[0] }));
        this._render();
        break;
      }
      case "temp": {
        for (const v of cars.filter((x) => x.climate)) {
          const m = this._climateModel(v);
          const next = clamp(Math.round((m.temp + Number(el.dataset.d)) / m.step) * m.step, m.min, m.max);
          this._state = { ...this._state, vehicles: this._cars.map((car) => (car.id === v.id ? { ...car, settings: { ...(car.settings || {}), climate_temperature: next } } : car)) };
          clearTimeout(this._quickTemp);
          this._quickTemp = setTimeout(() => this._run("set", "ev_household_planner/vehicle_set", { vehicle_id: v.id, settings: { climate_temperature: next } }), 500);
        }
        break;
      }
      case "clim-now": {
        const able = cars.filter((v) => v.climate);
        const on = !able.some((v) => v.climate?.on === true);
        for (const v of able) this._run("climate", "ev_household_planner/vehicle_climate", { vehicle_id: v.id, on });
        say(on ? this._t("x_clim_started", { temp: this._num(Number(this._vs(able[0]).climate_temperature) || 21, 1) }) : this._t("x_clim_stopped"));
        break;
      }
      case "clim-dep": {
        for (const v of cars.filter((x) => x.climate)) {
          const dep = this._xDeps(v).find((d) => d.time && !d.past);
          if (!dep) continue;
          const s = this._vs(v);
          const climates = { ...(s.day_climate || {}) };
          if (isNum(climates[dep.wd])) delete climates[dep.wd];
          else climates[dep.wd] = Number(s.climate_temperature) || 21;
          this._xSet(v, { day_climate: climates });
        }
        break;
      }
      case "day":
        q.day = el.dataset.v;
        q.time = null;
        break;
      case "time":
        q.time = el.dataset.v;
        break;
      case "mode":
        q.mode = el.dataset.v;
        break;
      case "pct":
        q.pct = clamp((q.pct || 90) + Number(el.dataset.d), 50, 100);
        break;
      case "save": {
        const today = ZD();
        const base = (q.day || "tomorrow") === "today" ? today : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
        const opts = (q.day || "tomorrow") === "today" ? [1, 2, 3, 4].map((n) => (today.getHours() + n) % 24) : [6, 7, 8, 9];
        const time = q.time || `${String(opts[1]).padStart(2, "0")}:00`;
        const target = (q.mode || "auto") === "fast" ? q.pct || 90 : null;
        for (const v of cars) this._run("trip", "ev_household_planner/vehicle_trip", { vehicle_id: v.id, kind: "once", date: iso, time, target });
        say(this._t("x_saved_ready", { car: cars.length > 1 ? this._t("q_both") : cars[0].name.split(" ")[0], when: `${this._xDayShort(base).toLowerCase()} ${this._hhmm(time)}` }));
        break;
      }
      default:
        return;
    }
    this._renderQuick();
  },

  // ------------------------------------------------------------------ Insight's pop-up

  _xInsightOpen() {
    this._xInsight = true;
    this._insightLoad(() => this._xInsight);
    this._xInsightRender();
  },

  _xInsightClose() {
    this._xInsight = false;
    const root = this.shadowRoot.querySelector(".sheet-root");
    if (root?.querySelector(".x-insight")) { root.innerHTML = ""; root.onclick = null; root.onkeydown = null; }
  },

  _xInsightRender() {
    const root = this.shadowRoot.querySelector(".sheet-root");
    if (!this._xInsight || !root) return;
    root.innerHTML = this._xInsightHtml();
    root.onclick = (ev) => {
      const el = ev.target.closest("[data-ins]");
      if (!el) return;
      if (el.dataset.ins === "close") this._xInsightClose();
      else if (el.dataset.ins === "toggle") {
        const on = !this._state.settings?.insight_use;
        this._state = { ...this._state, settings: { ...this._state.settings, insight_use: on } };
        this._saveSettings({ insight_use: on });
        this._xInsightRender();
        this._render();
      }
    };
    root.onkeydown = (ev) => ev.key === "Escape" && this._xInsightClose();
    root.querySelector(".x-insight [data-ins=close]")?.focus({ preventScroll: true });
  },

  _xInsightHtml() {
    const s = this._state.settings || {};
    const on = !!s.insight_use;
    const data = this._insight;
    const cars = this._cars;
    const names = (id) => this._car(id)?.name || data?.cars?.[id]?.name || "";
    let body = `<p class="x-soft">${esc(this._t("insight_loading"))}</p>`;
    if (data) {
      const days = Math.max(0, ...Object.values(data.cars || {}).map((c) => Number(c.days) || 0));
      const sc = data.score || {};
      const knows = isNum(sc.rate) && sc.scored ? Math.round(Number(sc.rate) * 100) : Math.min(100, Math.round((days / 30) * 100));
      const ids = Object.keys(data.detail || {}).filter((id) => cars.some((v) => v.id === id));
      const typ = ids.length ? ids.reduce((t, id) => t + (data.detail[id].week || []).reduce((a, d) => a + (Number(d.p50) || 0), 0) / 7, 0) / ids.length : 0;
      const hard = ids.length ? ids.reduce((t, id) => t + Math.max(0, ...(data.detail[id].week || []).map((d) => Number(d.p90) || 0)), 0) / ids.length : 0;
      const reserve = clamp(Number(s.min_soc) || 15, 0, 60);
      const wd = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const rows = ids.map((id, i) => {
        const week = data.detail[id].week || [];
        const top = Math.max(1, ...ids.flatMap((x) => (data.detail[x].week || []).map((d) => Number(d.p50) || 0)));
        const bars = week.map((d, k) => { const kw = Number(d.p50) || 0; return `<i title="${esc(`${this._t(`day_${wd[k]}`)}: ${this._kwh(kw)}`)}" style="height:${Math.round(6 + (kw / top) * 28)}px;background:${this._carColor(cars.findIndex((v) => v.id === id))};opacity:${(0.35 + (kw / top) * 0.65).toFixed(2)}"></i>`; }).join("");
        return `<div class="x-insrow"><span><i style="background:${this._carColor(cars.findIndex((v) => v.id === id))}"></i>${esc(names(id).split(" ")[0])}</span>${bars}</div>`;
      }).join("");
      // Tonight: the next 12 hours' prices, and the hours a car charges.
      const hours = this._hourPrices(12);
      const known = hours.filter((h) => h.p !== null);
      const lo = known.length ? Math.min(...known.map((h) => h.p)) : 0, hi = known.length ? Math.max(...known.map((h) => h.p)) : 1;
      const night = hours.map((h) => (h.p === null ? "<i></i>" : `<i style="height:${Math.round(10 + ((h.p - lo) / (hi - lo || 1)) * 40)}px;background:${X_TIER_COLOR[X_TIER(h.p, lo, hi)]};opacity:${this._chargeAt(h.at, h.at + 3600e3) >= 0 ? 1 : 0.45}"></i>`)).join("");
      const ticks = hours.map((h, k) => `<span>${k % 3 === 0 ? String(h.hour).padStart(2, "0") : ""}</span>`).join("");
      const plans = cars.slice(0, 4).map((v, i) => {
        const c = this._nextCharge(v);
        const sv = this._vs(v);
        const day = this._deadlineDay(v);
        const fast = day && isNum(sv.day_targets?.[day]) && (sv.day_fixed || []).includes(day);
        const text = c ? `${this._whenSpan(c)} → ${this._pct(c.soc ?? v.target)}${v.deadline ? ` · ${this._readyText(v.deadline)}` : ""}` : this._t("x_ins_waits", { pct: this._pct(v.soc) });
        return `<div class="x-insplan"><i style="background:${this._carColor(i)}"></i><b>${esc(v.name.split(" ")[0])}</b><span class="x-num">${esc(text)}</span><span class="x-pctpill small ${fast ? "fast" : "auto"}">${esc(fast ? this._t("x_fast_low") : `✦ ≈${Math.round(Number(v.target) || 0)} %`)}</span></div>`;
      }).join("");
      const saved = isNum(sc.saved) ? Number(sc.saved) : null;
      body = `<small class="x-over2 vio">${esc(this._t("x_ins_learned", { days }))}</small>
        <div class="x-ins3">
          <div><div class="x-ring" style="--p:${knows}%"><b class="x-num x-disp">${knows} %</b></div><small>${esc(this._t("x_ins_knows"))}</small></div>
          <div><div class="x-twobars"><span><b class="x-num">${Math.round(typ)}</b><i style="height:${Math.max(8, Math.round((typ / Math.max(1, hard)) * 56))}px;background:var(--x-acc-ink)"></i></span><span><b class="x-num">${Math.round(hard)}</b><i style="height:56px;background:var(--x-coral)"></i></span></div><small>${esc(this._t("x_ins_kwh"))}</small></div>
          <div><div class="x-cellbat"><i style="height:${reserve}%;background:var(--x-warn)"></i><i style="bottom:${reserve}%;height:${Math.min(100 - reserve, 35)}%;background:var(--x-coral);opacity:.8"></i></div><small>${esc(this._t("x_ins_reserve", { pct: this._pct(reserve) }))}</small></div>
        </div>
        ${rows ? `<div class="x-well x-insweek"><div class="x-row"><b>${esc(this._t("x_ins_typical"))}</b><span class="x-soft">${esc(this._t("x_ins_higher"))}</span></div><div class="x-insrow head"><span></span>${wd.map((d) => `<span>${esc(this._t(`day_${d}`).slice(0, 1).toUpperCase())}</span>`).join("")}</div>${rows}</div>` : ""}
        <small class="x-over2 vio">${esc(this._t("x_ins_tonight"))}</small>
        <div class="x-well x-insnight"><div class="x-insbars">${night}</div><div class="x-insticks x-num">${ticks}</div></div>
        <div class="x-insplans">${plans}</div>
        ${saved !== null && sc.scored ? `<div class="x-saved"><div><b class="x-num x-disp">${esc(this._money(saved, 0))}</b><small>${esc(this._t("x_ins_saved"))}</small></div><svg width="120" height="40" viewBox="0 0 120 40" aria-hidden="true"><path d="M0 34 L12 30 L24 31 L36 24 L48 25 L60 18 L72 19 L84 12 L96 13 L108 6 L120 4" fill="none" stroke="var(--x-acc-ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` : ""}`;
    }
    return `<div class="x-scrim" data-ins="close"></div>
      <section class="x-insight sheet-up" role="dialog" aria-modal="true" aria-label="Insight">
        <i class="x-handle" aria-hidden="true"></i>
        <div class="x-inshead"><span class="x-insbadge${on ? " on" : ""}">${XSPARK.replace('width="14" height="14"', 'width="24" height="24"')}</span>
          <div class="x-grow"><b class="x-disp">Insight</b><small class="${on ? "on" : ""}">${esc(this._t(on ? "x_ins_on" : "x_ins_off"))}</small></div>
          <button class="x-sw big vio${on ? " on" : ""}" data-ins="toggle" role="switch" aria-checked="${on}" aria-label="${esc(this._t("insight_use"))}"><i></i></button>
          <button class="x-round small" data-ins="close" aria-label="${esc(this._t("close"))}">${xi(XD.close, { w: 16, sw: 2.6 })}</button></div>
        <div class="x-insbody${on ? "" : " dim"}">${body}</div>
        <div class="x-insfoot">${xi("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01", { w: 16, sw: 2.2 })}<span>${esc(this._t(on ? "x_ins_foot_on" : "x_ins_foot_off"))}</span></div>
      </section>`;
  },

  // ------------------------------------------------------------------ Look

  _xLookHtml() {
    const night = this._xLookNight ?? this._xNight();
    const now = this.getAttribute("look") || "evp";
    const theme = this._xTheme();
    const looks = this._looks().map((look) => {
      const sw = { evp: "linear-gradient(135deg, #0d1014 50%, #2fd3a3 50%)", frisk: "linear-gradient(135deg, #f4f7f5 50%, #19b6a5 50%)", hverdag: "linear-gradient(135deg, #f2f4f6 50%, #6e4aff 50%)", studio: "linear-gradient(135deg, #1b1530 50%, #6e4aff 50%)" }[look];
      return `<button class="x-look${now === look ? " on" : ""}" data-act="look" data-look="${look}" data-f="look-${look}" aria-pressed="${now === look}"><span style="background:${sw}"></span><b>${esc(this._t(`look_${look}`))}</b></button>`;
    }).join("");
    const site = this._placeNow();
    const house = this._houseOf(site);
    const houses = ClayScene.HOUSES.map((code) => `<button class="x-housepick house-pick${house === code ? " on" : ""}" data-act="house-look" data-site="${esc(site.home ? "home" : site.id)}" data-house="${code}" data-f="hl-${code}" aria-pressed="${house === code}"><span class="house-pic">${ClayScene.housePreview(code)}</span><small>${esc(this._t(`house_${code}`))}</small></button>`).join("");
    const cars = this._cars.map((v, i) => {
      const body = ClayScene.BODIES.includes(v.settings?.body) ? v.settings.body : "sedan";
      const paint = v.settings?.paint === "black" ? "black" : "white";
      return `<div class="x-card x-lookcar"><span class="x-key"><i style="background:${this._carColor(i)}"></i><b>${esc(v.name)}</b></span>
        <div class="x-bodies">${ClayScene.BODIES.map((b) => `<button class="${b === body ? "on" : ""}" data-act="x-body" data-id="${esc(v.id)}" data-value="${b}" aria-pressed="${b === body}" aria-label="${esc(this._t(`body_${b}`))}" style="--car:${this._carColor(i)}"><span class="x-bodypic">${ClayScene.preview(b, paint).replace(/<rect[^>]*url\(#cs-bg\)[^>]*\/>/, "")}</span><small>${esc(this._t(`body_${b}`))}</small></button>`).join("")}</div></div>`;
    }).join("");
    const photos = this._cars.map((v) => `<div class="x-photorow"><b>${esc(v.name)}</b>${this._photoEditHtml(v.id, v.image, ICONS.car, v.image_original)}</div>`).join("");
    return `<header class="x-top look ${night ? "night" : "day"}" style="background:${night ? "linear-gradient(180deg, #060a20 0%, #121a45 45%, #232a5c 75%, var(--x-bg) 100%)" : "linear-gradient(180deg, #5fa7ec 0%, #9fcdf5 40%, #dceaf7 72%, var(--x-bg) 100%)"}" aria-label="${esc(this._t("prof_look"))}">
      <div class="x-in">
        <div class="x-dock"></div>
        <div class="x-lookrow"><button class="x-round" data-act="x-look-back" aria-label="${esc(this._t("back_label"))}">${xi(XD.back, { sw: 2.4 })}</button><b class="x-disp x-grow">${esc(this._t("x_look"))}</b>
          <div class="x-daynight" role="group" aria-label="${esc(this._t("x_day_night"))}"><button data-act="x-look-light" data-value="day" class="${night ? "" : "on"}" aria-pressed="${!night}">${esc(this._t("x_day"))}</button><button data-act="x-look-light" data-value="night" class="${night ? "on" : ""}" aria-pressed="${night}">${esc(this._t("x_night"))}</button></div></div>
        <div class="x-lookstage x-look-slot"></div>
        <span class="x-lookname">${esc(this._t(`house_${house}`))}</span>
      </div>
      <div class="x-tabs x-in"></div>
    </header>
    <div class="x-wrap x-lookpage">
      <section class="x-sec"><h2>${esc(this._t("x_appearance"))}</h2><div class="x-looks">${looks}</div>
        <div class="x-seg n3">${X_THEMES.map((t) => `<button data-act="x-theme" data-value="${t}" class="${theme === t ? "on" : ""}" aria-pressed="${theme === t}">${esc(this._t(`x_theme_${t}`))}</button>`).join("")}</div></section>
      <section class="x-sec"><h2>${esc(this._t("x_top_house"))}</h2><div class="x-houses">${houses}</div></section>
      ${cars ? `<section class="x-sec"><h2>${esc(this._t("x_top_cars"))}</h2>${cars}</section>` : ""}
      ${photos ? `<section class="x-card x-hero-card x-photos"><div class="x-head"><div><h2>${esc(this._t("x_own_picture"))}</h2><small class="x-soft">${esc(this._t("x_own_picture_sub"))}</small></div><button class="x-q small" data-act="x-pop" data-pop="photo" aria-expanded="${this._xPop === "photo"}" aria-label="${esc(this._t("x_how"))}">?</button></div>
        ${this._xPop === "photo" ? `<div class="x-popover right" role="note"><span>${esc(this._t("x_photo_help1"))}</span><span>${esc(this._t("x_photo_help2"))}</span></div>` : ""}${photos}</section>` : ""}
    </div>`;
  },

  _xMountLook() {
    const slot = this.shadowRoot.querySelector(".x-look-slot");
    if (!slot || !this._homeShown) return;
    if (!this._lookScene) {
      this._lookScene = new ClayScene();
      this._lookScene.t = (key, vars) => this._t(key, vars);
    }
    slot.appendChild(this._lookScene.el);
    const night = this._xLookNight ?? this._xNight();
    this._lookScene.update({ ...this._sceneModel(), labels: [], canEdit: false, light: night ? 1 : 0 });
  },
});
