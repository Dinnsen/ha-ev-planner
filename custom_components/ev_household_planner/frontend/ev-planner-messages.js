/* EV Planner – the message centre: every message as a card (on/off, when, which cars, which phones, the quiet
   hours, live, icon and colour), and beside them a phone with one example of each message that is on, in the
   order they come. Mounted by the panel in Settings → Messages; it saves through the panel. */

const SVG = {
  plug: '<path d="M7 2v5M13 2v5M4 7h12v3a6 6 0 0 1-12 0V7zM10 16v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  moon: '<path d="M15.5 12.5A6.5 6.5 0 0 1 8 4a6.5 6.5 0 1 0 7.5 8.5z" fill="currentColor"/>',
  bell: '<path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 2h-13zM8 18h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
  bolt: '<path d="M11 2 4 11h5l-1 7 7-9h-5z" fill="currentColor"/>',
  check: '<path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  sun: '<circle cx="10" cy="10" r="3.5" fill="currentColor"/><path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.7 1.7M14.3 14.3 16 16M4 16l1.7-1.7M14.3 5.7 16 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  warn: '<path d="M10 2.5 18.5 17h-17z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 8v4M10 14.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  cars: '<path d="M3 13v-3l2-4h10l2 4v3zM3 13v2M17 13v2M6 13h.1M14 13h.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  battery: '<rect x="2.5" y="6" width="13" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M17.5 9v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="4.5" y="8" width="3" height="4" rx="1" fill="currentColor"/>',
  coin: '<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 7.5h3a1.5 1.5 0 0 1 0 3H8.5a1.5 1.5 0 0 0 0 3H12M10 6v1.5M10 13.5V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  chart: '<path d="M3 17h14M5 14V9M9 14V5M13 14v-3M17 14V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  cal: '<rect x="3" y="4" width="14" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  home: '<path d="M3 10 10 4l7 6M5 9v8h10V9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  leaf: '<path d="M4 16C4 8 9 4 17 4c0 8-4 13-12 12zM4 16l7-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
// The icon on the phone is Material Design's (the companion app's); here it is drawn by its own key.
const MDI = { bolt: "mdi:lightning-bolt", plug: "mdi:ev-plug-type2", moon: "mdi:weather-night", bell: "mdi:bell", check: "mdi:check-circle", sun: "mdi:weather-sunny", warn: "mdi:alert", cars: "mdi:car-multiple", battery: "mdi:battery-30", coin: "mdi:cash", chart: "mdi:chart-bar", cal: "mdi:calendar", home: "mdi:home", leaf: "mdi:leaf" };
const KEY_OF = Object.fromEntries(Object.entries(MDI).map(([k, v]) => [v, k]));
const COLOURS = ["#14B47C", "#0FA3A3", "#2F80ED", "#5B5BD6", "#C2185B", "#D0424F", "#E8761E", "#C98A00", "#7A8594"];
const svg = (k) => `<svg viewBox="0 0 20 20" aria-hidden="true">${SVG[k] || SVG.bell}</svg>`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const toMin = (hhmm) => { const [h, m] = String(hhmm || "00:00").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const fmt = (m) => `${pad(Math.floor((((m % 1440) + 1440) % 1440) / 60))}:${pad((((m % 60) + 60) % 60))}`;
const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Each card: its name, icon and colour, whether it can be live, whether it goes through the quiet hours unless told
// otherwise, and the car's own switch it is (or the household's).
const KINDS = {
  evening: { icon: "moon", c: "#5B5BD6", live: true, own: true, isNew: true },
  reminder: { icon: "bell", c: "#C98A00", flag: "reminder" },
  plug: { icon: "plug", c: "#14B47C", flag: "notify_plug", byDefault: true },
  live: { icon: "bolt", c: "#14B47C", flag: "live_notification" },
  done: { icon: "check", c: "#14B47C", flag: "notify_done" },
  short: { icon: "warn", c: "#D0424F", own: true, important: true },
  receipt: { icon: "sun", c: "#0FA3A3", flag: "notify_receipt", byDefault: true },
  pick: { icon: "cars", c: "#5B5BD6", insight: true },
  problem: { icon: "warn", c: "#D0424F", always: true, important: true },
  pair: { icon: "plug", c: "#E8761E", always: true, important: true },
};
const ORDER = Object.keys(KINDS);

const TEXT = {
  da: {
    evening: ["Aftenstatus", "Fast tid, også når bilen sidder i"], reminder: ["Husk at sætte i", "Når bilen er lav og ikke sidder i"], plug: ["Sat i laderen", "Laderen, klar-tiden og planen"],
    live: ["Lader nu", "Procent og tid, mens den lader"], done: ["Ladet eller pause", "Når ladningen stopper"], short: ["Når målet ikke nås", "Advarsel med «Lad nu»"],
    receipt: ["Morgenkvittering", "Ved klar-tiden: hvordan det gik"], pick: ["Hvilken bil skal i", "Fra Læring, to biler om én lader"], problem: ["Når noget går galt", "Bilen eller laderen svarer ikke"],
    pair: ["Hvem holder ved laderen?", "Spørger med knapper"],
    when: { plug: "1 min efter tilslutning", live: "Mens den lader", done: "Når ladningen stopper", short: "Så snart planen viser det", receipt: "Ved klar-tiden", problem: "Efter tre forsøg", pair: "Når en bil sættes i, og ingen ved hvilken" },
    all: "Beskeder", quiet: "Stille", after: "Bagefter", digest: "Én samlet besked", drop: "Ingenting", away: "Også når bilen er ude", quietTip: "Kort mærket «Går igennem» kommer også i de stille timer. De andre samles i én besked, når de stille timer slutter, eller droppes. Ikon og farve vises som et rundt mærke på iPhone og Android.",
    phoneHead: "Alle beskeder, der er slået til", phoneTip: "Ét eksempel på hver besked, der er slået til, i den rækkefølge de kommer. Tryk på en besked for at åbne dens kort.", cardsHead: "Dine beskeder", cardsTip: "Hvert kort er én besked. Slå til og fra, vælg hvornår, hvilke biler og hvilke mobiler. «Går igennem» betyder, at den også kommer i de stille timer.",
    tonight: "I aften", night: "I nat", tomorrow: "I morgen", afterQuiet: "Efter stille timer", slept: "Mens du sov", allOff: "Alle beskeder er slået fra.", noneOn: "Ingen beskeder er slået til.", held: "Holdt tilbage · ",
    newTag: "Ny", important: "Vigtig", liveTag: "Live", open: "Tilpas", close: "Luk", whenL: "Hvornår", days: "Dage", which: "Hvilke biler", allCars: "Alle", inCars: "Dem der sidder i", outCars: "Dem der ikke gør",
    below: "Under", repeat: "Gentag", no: "Nej", every30: "Hver 30 min", every60: "Hver time", onlyIf: "Kun hvis", nightPrice: "nattens pris er under", liveL: "Live", liveEvening: "Med en bjælke for batteriet", cars: "Biler", to: "Til", allPhones: "Alle mobiler",
    quietL: "Stille timer", hold: "Holdes tilbage", through: "Går igennem", icon: "Ikon", colour: "Farve", alwaysOn: "Kan ikke slås fra", insightOff: "Slå Læring til for at få den",
    dayNames: ["man", "tir", "ons", "tor", "fre", "lør", "søn"], tonightT: "i aften", plugged: "sidder i", notPlugged: "ikke sat i", shouldPlug: "bør i laderen i aften", charges: "lader", about: "ca.", ready: "klar kl.",
    remindT: "Husk at sætte {car} i", remindB: "{car} har {soc} %. Lad nu, eller følg planen.", liveB: "Lader efter planen til {target} %", doneB: "Ladet til {target} %", shortB: "{car} når ikke {target} % kl. {ready}.", receiptB: "Klar kl. {ready}: {target} %",
    iconNames: { bolt: "Lyn", plug: "Stik", moon: "Måne", bell: "Klokke", check: "Flueben", sun: "Sol", warn: "Advarsel", cars: "Biler", battery: "Batteri", coin: "Penge", chart: "Søjler", cal: "Kalender", home: "Hus", leaf: "Blad" },
    pickB: "Sæt {car} i laderen i aften. {other} kan vente.", problemB: "Laderen svarer ikke. Tjek strøm og netværk.", pairB: "Hvilken bil holder ved laderen?", plugB: "Klar kl. {ready} · {target} %. {plan}", guest: "Gæst", chargeNow: "Lad nu", follow: "Følg planen", full: "fuld",
  },
  en: {
    evening: ["Evening status", "At a set time, also when the car is plugged in"], reminder: ["Plug in reminder", "When the car is low and not plugged in"], plug: ["Plugged in", "The charger, the ready time and the plan"],
    live: ["Charging now", "Per cent and time while it charges"], done: ["Charged or paused", "When charging stops"], short: ["When the target is not reached", "A warning with «Charge now»"],
    receipt: ["Morning receipt", "At the ready time: how it went"], pick: ["Which car to plug in", "From Learning, two cars sharing a charger"], problem: ["When something goes wrong", "The car or the charger does not answer"],
    pair: ["Who is at the charger?", "Asks with buttons"],
    when: { plug: "1 min after plugging in", live: "While it charges", done: "When charging stops", short: "As soon as the plan shows it", receipt: "At the ready time", problem: "After three tries", pair: "When a car is plugged in and nobody knows which" },
    all: "Messages", quiet: "Quiet", after: "Afterwards", digest: "One message", drop: "Nothing", away: "Also when the car is away", quietTip: "Cards marked «Goes through» also come in the quiet hours. The others come together in one message when the quiet hours end, or are dropped. The icon and colour show as a round badge on iPhone and Android.",
    phoneHead: "Every message that is on", phoneTip: "One example of each message that is on, in the order they come. Tap a message to open its card.", cardsHead: "Your messages", cardsTip: "Each card is one message. Turn it on and off, choose when, which cars and which phones. «Goes through» means it also comes in the quiet hours.",
    tonight: "Tonight", night: "Overnight", tomorrow: "Tomorrow", afterQuiet: "After the quiet hours", slept: "While you slept", allOff: "All messages are off.", noneOn: "No messages are on.", held: "Held back · ",
    newTag: "New", important: "Important", liveTag: "Live", open: "Adjust", close: "Close", whenL: "When", days: "Days", which: "Which cars", allCars: "All", inCars: "Those plugged in", outCars: "Those that are not",
    below: "Below", repeat: "Repeat", no: "No", every30: "Every 30 min", every60: "Every hour", onlyIf: "Only if", nightPrice: "the night's price is below", liveL: "Live", liveEvening: "With a bar for the battery", cars: "Cars", to: "To", allPhones: "All phones",
    quietL: "Quiet hours", hold: "Held back", through: "Goes through", icon: "Icon", colour: "Colour", alwaysOn: "Cannot be turned off", insightOff: "Turn Learning on to get it",
    dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], tonightT: "tonight", plugged: "plugged in", notPlugged: "not plugged in", shouldPlug: "should be plugged in tonight", charges: "charges", about: "about", ready: "ready at",
    remindT: "Plug {car} in", remindB: "{car} is at {soc} %. Charge now, or follow the plan.", liveB: "Charging to {target} % as planned", doneB: "Charged to {target} %", shortB: "{car} will not reach {target} % by {ready}.", receiptB: "Ready at {ready}: {target} %",
    iconNames: { bolt: "Lightning", plug: "Plug", moon: "Moon", bell: "Bell", check: "Tick", sun: "Sun", warn: "Warning", cars: "Cars", battery: "Battery level", coin: "Money", chart: "Bars", cal: "Calendar", home: "House", leaf: "Leaf" },
    pickB: "Plug {car} in tonight. {other} can wait.", problemB: "The charger does not answer. Check power and network.", pairB: "Which car is at the charger?", plugB: "Ready at {ready} · {target} %. {plan}", guest: "Guest", chargeNow: "Charge now", follow: "Follow the plan", full: "full",
  },
};

const CSS = `
:host { display: block; container-type: inline-size; --mc-card: var(--evp-card, #fff); --mc-ink: var(--evp-ink, #1B2230); --mc-soft: var(--evp-soft, #5D6675); --mc-line: var(--evp-line, #DFE3E9); --mc-well: var(--evp-well, color-mix(in srgb, var(--mc-ink) 6%, transparent)); --mc-accent: var(--evp-accent, #14B47C); --mc-r: var(--evp-radius, 16px); font-size: 14.5px; color: var(--mc-ink); }
* { box-sizing: border-box; }
[hidden] { display: none !important; }
button, input, select { font: inherit; color: inherit; }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--mc-accent); outline-offset: 2px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
h3, h4 { margin: 0; }
.strip { background: var(--mc-card); border: 1px solid var(--mc-line); border-radius: var(--mc-r); padding: 12px 14px; display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; margin-bottom: 16px; }
.grp { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.grp > span { font-size: 13px; color: var(--mc-soft); }
.sw { appearance: none; width: 40px; height: 24px; border-radius: 99px; background: var(--mc-line); border: 0; position: relative; cursor: pointer; flex: none; transition: background .2s; padding: 0; }
.sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 2px rgba(0,0,0,.25); }
.sw[aria-checked="true"] { background: var(--mc-accent); }
.sw[aria-checked="true"]::after { left: 19px; }
.sw:disabled { opacity: .55; cursor: default; }
.chip { appearance: none; border: 1px solid var(--mc-line); background: var(--mc-card); border-radius: 999px; padding: 5px 11px; font-size: 13px; cursor: pointer; color: var(--mc-soft); white-space: nowrap; }
.chip[aria-pressed="true"] { background: var(--mc-ink); color: var(--mc-card); border-color: var(--mc-ink); }
.time { border: 1px solid var(--mc-line); background: var(--mc-card); color: var(--mc-ink); border-radius: 10px; padding: 4px 8px; font-variant-numeric: tabular-nums; }
.num { width: 70px; }
.main { display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr); gap: 22px; align-items: start; }
@container (max-width: 700px) { .main { grid-template-columns: 1fr; } }
.phonecol { position: sticky; top: 8px; display: grid; gap: 8px; }
@container (max-width: 700px) { .phonecol { position: static; } }
.label { font-size: 11.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--mc-soft); }
.phone { position: relative; background: #0F1218; color: #F3F5F8; border-radius: 34px; padding: 16px 10px 14px; border: 6px solid #2A2F38; min-height: 480px; max-height: 70vh; overflow: auto; display: grid; align-content: start; gap: 8px; }
.phone .clock { text-align: center; font: 600 40px/1 inherit; letter-spacing: -.02em; margin-top: 4px; }
.phone .when { color: #A7AFBC; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; padding: 8px 6px 2px; }
.note { appearance: none; border: 0; width: 100%; text-align: left; color: inherit; cursor: pointer; background: rgba(255,255,255,.12); border-radius: 18px; padding: 10px 12px; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 2px 10px; }
.note .ic { grid-row: span 2; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--c, #14B47C); color: #fff; }
.note .ic svg { width: 16px; height: 16px; }
.note .t { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 600; min-width: 0; }
.note .t span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.note .t span:last-child { color: #A7AFBC; font-weight: 400; flex: none; }
.note .m { font-size: 13px; line-height: 1.38; color: #DDE2EA; }
.note .acts { grid-column: 2; display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.note .acts span { background: rgba(255,255,255,.14); border-radius: 9px; padding: 3px 9px; font-size: 12px; }
.note .bar { grid-column: 2; height: 5px; border-radius: 3px; background: rgba(255,255,255,.15); margin-top: 6px; overflow: hidden; }
.note .bar i { display: block; height: 100%; background: #34D893; }
.note.held { opacity: .42; }
.note.sel { box-shadow: 0 0 0 2px var(--c, #34D893), 0 0 18px -2px var(--c, #34D893); }
.phone.focus .note:not(.sel) { opacity: .38; }
.empty { color: #A7AFBC; text-align: center; font-size: 13px; padding: 20px 10px; }
.cards { display: grid; gap: 12px; }
.card { background: var(--mc-card); border: 1px solid var(--mc-line); border-radius: var(--mc-r); padding: 14px; display: grid; gap: 10px; }
.card.off { opacity: .62; }
.card.sel { opacity: 1; border-color: var(--c); box-shadow: 0 0 0 1.5px var(--c) inset; scroll-margin-top: 16px; }
.card .top { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 12px; align-items: center; cursor: pointer; }
.card .ic { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; }
.card .ic svg { width: 19px; height: 19px; }
.card h4 { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 15px; }
.card .sub { color: var(--mc-soft); font-size: 13px; }
.tag { font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: 2px 7px; border-radius: 99px; background: color-mix(in srgb, #5B5BD6 14%, transparent); color: #5B5BD6; }
.tag.imp { background: color-mix(in srgb, #D0424F 14%, transparent); color: #D0424F; }
.bubble { background: var(--mc-well); border-radius: 12px; padding: 9px 12px; font-size: 13.5px; display: grid; gap: 2px; cursor: pointer; }
.bubble b { font-size: 12.5px; }
.opts { display: grid; gap: 8px; }
.opt { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 10px; align-items: center; }
.opt > span { font-size: 12.5px; color: var(--mc-soft); font-weight: 600; }
@container (max-width: 440px) { .opt { grid-template-columns: 1fr; gap: 4px; } }
.more { appearance: none; border: 0; background: none; color: var(--mc-accent); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; justify-self: start; }
.swatches, .icons { display: flex; gap: 6px; flex-wrap: wrap; }
.swatch { appearance: none; width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--mc-card); box-shadow: 0 0 0 1px var(--mc-line); background: var(--s); cursor: pointer; padding: 0; }
.swatch[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--mc-ink); }
.icobtn { appearance: none; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--mc-line); background: var(--mc-card); color: var(--mc-soft); display: grid; place-items: center; cursor: pointer; padding: 0; }
.icobtn svg { width: 16px; height: 16px; }
.icobtn[aria-pressed="true"] { background: var(--c); color: #fff; border-color: var(--c); }
.q { appearance: none; border: 1px solid var(--mc-line); background: var(--mc-card); color: var(--mc-soft); width: 22px; height: 22px; border-radius: 50%; font-size: 12px; font-weight: 600; cursor: pointer; padding: 0; flex: none; }
.pop { position: relative; display: inline-flex; }
.pop .tip { position: absolute; top: 28px; right: 0; width: min(280px, 78vw); background: var(--mc-ink); color: var(--mc-card); font-size: 13px; line-height: 1.45; padding: 10px 12px; border-radius: 12px; z-index: 5; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hint { color: var(--mc-soft); font-size: 13px; }
`;

export function mountMessages(el, first) {
  const root = el.shadowRoot || el.attachShadow({ mode: "open" });
  let api = first;
  let open = null;
  const T = () => TEXT[api.lang === "en" ? "en" : "da"];
  const tf = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

  /* What each card is now, from the cars' own switches and the household's choices. */
  function rule(kind) {
    const k = KINDS[kind], st = api.settings || {}, own = (st.messages || {})[kind] || {}, cars = api.cars || [];
    const r = { kind, icon: KEY_OF[own.icon] || k.icon, color: own.color || k.c, to: own.to || "all", through: own.through ?? Boolean(k.important), live: Boolean(own.live) };
    if (k.flag) {
      const on = cars.filter((c) => (k.byDefault ? c.s?.[k.flag] !== false : Boolean(c.s?.[k.flag])));
      r.on = on.length > 0;
      r.cars = !on.length || on.length === cars.length ? "all" : on.map((c) => c.id);
    } else if (k.insight) {
      r.on = Boolean(st.insight && st.insight_notify);
      r.disabled = !st.insight;
      r.at = String(st.insight_notify_at || "19:30").slice(0, 5);
    } else if (k.always) {
      r.on = true;
      r.disabled = true;
    } else {
      r.on = own.on ?? true;
      r.cars = own.cars || "all";
    }
    if (kind === "evening") Object.assign(r, { at: String(own.at || "22:00").slice(0, 5), days: Array.isArray(own.days) ? own.days : [0, 1, 2, 3, 4, 5, 6], plugged: own.plugged || "all" });
    if (kind === "reminder") {
      const c = cars.find((x) => x.s?.reminder) || cars[0] || { s: {} }, s = c.s || {};
      Object.assign(r, { at: String(s.reminder_time || "16:00").slice(0, 5), below: Number(s.reminder_soc ?? 60), days: (s.reminder_days || WEEK).map((d) => WEEK.indexOf(d)).filter((i) => i >= 0), repeat: Number(s.reminder_repeat || 0), price: s.reminder_price_enabled ? Number(s.reminder_price ?? 1) : null });
    }
    return r;
  }
  const inCars = (r) => (api.cars || []).filter((c) => r.cars === "all" || !Array.isArray(r.cars) || r.cars.includes(c.id));

  /* One example of a message, from the cars as they are. */
  function examples(r) {
    const t = T(), out = [], cars = inCars(r), all = api.cars || [];
    const add = (time, title, body, extra = {}) => out.push({ time, title, body, r, ...extra });
    const first = cars[0] || all[0];
    if (!first && !["problem", "pair"].includes(r.kind)) return out;
    const lvl = (c) => (Number.isFinite(c.soc) ? `${Math.round(c.soc)} %` : "?");
    switch (r.kind) {
      case "evening":
        for (const c of cars) {
          const inn = c.connected === true;
          if ((r.plugged === "in" && !inn) || (r.plugged === "out" && inn)) continue;
          const body = inn ? [lvl(c), t.plugged, c.soc >= c.target - 0.5 ? t.full : c.plan ? `${t.charges} ${c.plan} · ${t.about} ${c.cost}` : "", c.ready ? `${t.ready} ${c.ready}` : ""].filter(Boolean).join(" · ") : [lvl(c), t.notPlugged, c.soc < c.target - 0.5 ? t.shouldPlug : ""].filter(Boolean).join(" · ");
          add(r.at, `${c.name} ${t.tonightT}`, body, { bar: r.live && Number.isFinite(c.soc) ? c.soc : null });
        }
        break;
      case "reminder": {
        const c = [...cars].sort((a, b) => (a.soc ?? 100) - (b.soc ?? 100))[0];
        if (c) add(r.at, tf(t.remindT, { car: c.name }), tf(t.remindB, { car: c.name, soc: Math.min(Math.round(c.soc ?? r.below), r.below - 1) }), { acts: [t.chargeNow, t.follow] });
        break;
      }
      case "plug": add("17:45", `${first.name} · ${api.charger || "Lader"}`, tf(t.plugB, { ready: first.ready || "07.00", target: Math.round(first.target || 80), plan: first.plan ? `${t.charges} ${first.plan}, ${t.about} ${first.cost}` : "" }).trim().replace(/\.$/, "")); break;
      case "live": add("01:00", first.name, tf(t.liveB, { target: Math.round(first.target || 80) }), { bar: Math.round(first.soc ?? 60) }); break;
      case "done": add("03:30", first.name, tf(t.doneB, { target: Math.round(first.target || 80) })); break;
      case "short": add("22:05", first.name, tf(t.shortB, { car: first.name, target: Math.round(first.target || 80), ready: first.ready || "07.00" }), { acts: [t.chargeNow] }); break;
      case "receipt": add(String(first.ready || "07.00").replace(".", ":"), first.name, tf(t.receiptB, { ready: first.ready || "07.00", target: Math.round(first.target || 80) })); break;
      case "pick": if (all.length > 1) add(r.at, "Læring", tf(t.pickB, { car: all[1].name, other: all[0].name })); break;
      case "problem": add("23:40", api.charger || "Lader", t.problemB); break;
      case "pair": add("19:10", api.charger || "Lader", t.pairB, { acts: [...all.slice(0, 2).map((c) => c.name), t.guest] }); break;
    }
    return out;
  }
  const order = (time) => (toMin(time) - 15 * 60 + 1440) % 1440;
  function inQuiet(time) {
    const st = api.settings || {};
    if (!st.quiet_enabled) return false;
    const a = toMin(st.quiet_from || "22:00"), b = toMin(st.quiet_to || "06:00"), x = toMin(time);
    return a <= b ? x >= a && x < b : x >= a || x < b;
  }

  function phoneHtml() {
    const t = T(), st = api.settings || {}, rules = ORDER.map(rule);
    const list = [];
    if (st.notify_enabled !== false) for (const r of rules) if (r.on) list.push(...examples(r));
    list.sort((a, b) => order(a.time) - order(b.time));
    const held = [];
    for (const m of list) if (inQuiet(m.time) && !m.r.through) { m.held = true; held.push(m); }
    const digest = (st.quiet_after || "digest") === "digest";
    let html = `<div class="clock">${fmt(toMin(st.quiet_to || "06:30"))}</div>`;
    if (st.notify_enabled === false) html += `<div class="empty">${t.allOff}</div>`;
    else if (!list.length) html += `<div class="empty">${t.noneOn}</div>`;
    let section = "";
    for (const m of list) {
      if (m.held && digest) continue;
      const o = order(m.time), sec = o <= 7 * 60 ? t.tonight : o < 15 * 60 ? t.night : t.tomorrow;
      if (sec !== section) { section = sec; html += `<div class="when">${sec}</div>`; }
      html += note(m);
    }
    if (held.length && digest) {
      html += `<div class="when">${t.afterQuiet}</div>` + note({ time: String(st.quiet_to || "06:00").slice(0, 5), title: t.slept, body: held.map((m) => `${m.title}: ${m.body}`).join(" · "), r: { kind: "", icon: "moon", color: "#5B5BD6" }, digest: true });
    }
    return html;
  }
  function note(m) {
    const r = m.r, sel = open && r.kind === open, live = r.live && KINDS[r.kind]?.live;
    return `<button class="note${m.held ? " held" : ""}${sel ? " sel" : ""}" style="--c:${r.color}" data-note="${m.digest ? "" : r.kind}"><span class="ic">${svg(r.icon)}</span><span class="t"><span>${esc(m.title)}${live ? ` · ${T().liveTag}` : ""}</span><span>${m.time}</span></span><span class="m">${m.held ? T().held : ""}${esc(m.body)}</span>${m.bar != null ? `<span class="bar"><i style="width:${m.bar}%"></i></span>` : ""}${m.acts ? `<span class="acts">${m.acts.map((a) => `<span>${esc(a)}</span>`).join("")}</span>` : ""}</button>`;
  }

  const sw = (on, attr, label, disabled = false) => `<button class="sw" role="switch" aria-checked="${on}" ${attr} aria-label="${esc(label)}"${disabled ? " disabled" : ""}></button>`;
  const chips = (kind, key, opts, cur) => `<div class="row">${opts.map(([v, l]) => `<button class="chip" data-k="${kind}" data-f="${key}" data-v="${esc(v)}" aria-pressed="${Array.isArray(cur) ? cur.includes(v) : String(cur) === String(v)}">${esc(l)}</button>`).join("")}</div>`;
  function card(r) {
    const t = T(), k = KINDS[r.kind], [name, sub] = t[r.kind], sel = open === r.kind, cars = api.cars || [], phones = api.phones || [];
    const ex = examples(r)[0] || examples({ ...r, cars: "all", plugged: "all" })[0];
    const opts = [];
    if ("at" in r) opts.push(`<div class="opt"><span>${t.whenL}</span><div class="row"><input class="time" type="time" step="300" value="${r.at}" data-k="${r.kind}" data-f="at" aria-label="${t.whenL}"></div></div>`);
    else opts.push(`<div class="opt"><span>${t.whenL}</span><div class="row hint">${esc(t.when[r.kind] || "")}</div></div>`);
    if (r.days) opts.push(`<div class="opt"><span>${t.days}</span><div class="row">${t.dayNames.map((d, i) => `<button class="chip" data-k="${r.kind}" data-day="${i}" aria-pressed="${r.days.includes(i)}">${d}</button>`).join("")}</div></div>`);
    if (r.kind === "evening") opts.push(`<div class="opt"><span>${t.which}</span>${chips(r.kind, "plugged", [["all", t.allCars], ["in", t.inCars], ["out", t.outCars]], r.plugged)}</div>`);
    if (r.kind === "reminder") {
      opts.push(`<div class="opt"><span>${t.below}</span><div class="row"><input class="time num" type="number" min="5" max="95" step="5" value="${r.below}" data-k="reminder" data-f="below" aria-label="${t.below}"> %</div></div>`);
      opts.push(`<div class="opt"><span>${t.repeat}</span>${chips("reminder", "repeat", [[0, t.no], [30, t.every30], [60, t.every60]], r.repeat)}</div>`);
      opts.push(`<div class="opt"><span>${t.onlyIf}</span><div class="row">${sw(r.price != null, 'data-k="reminder" data-toggle="price"', t.onlyIf)}<span class="hint">${t.nightPrice}</span>${r.price != null ? `<input class="time num" type="number" step="0.1" value="${r.price}" data-k="reminder" data-f="price" aria-label="${t.nightPrice}">` : ""}</div></div>`);
    }
    if (k.live) opts.push(`<div class="opt"><span>${t.liveL}</span><div class="row">${sw(r.live, `data-k="${r.kind}" data-toggle="live"`, t.liveL)}<span class="hint">${t.liveEvening}</span></div></div>`);
    if (r.cars !== undefined && cars.length > 1) opts.push(`<div class="opt"><span>${t.cars}</span><div class="row"><button class="chip" data-k="${r.kind}" data-cars="all" aria-pressed="${r.cars === "all"}">${t.allCars}</button>${cars.map((c) => `<button class="chip" data-k="${r.kind}" data-cars="${esc(c.id)}" aria-pressed="${r.cars !== "all" && r.cars.includes(c.id)}">${esc(c.name)}</button>`).join("")}</div></div>`);
    if (phones.length > 1) opts.push(`<div class="opt"><span>${t.to}</span><div class="row"><button class="chip" data-k="${r.kind}" data-to="all" aria-pressed="${r.to === "all"}">${t.allPhones}</button>${phones.map((p) => `<button class="chip" data-k="${r.kind}" data-to="${esc(p.id)}" aria-pressed="${Array.isArray(r.to) && r.to.includes(p.id)}">${esc(p.name)}</button>`).join("")}</div></div>`);
    opts.push(`<div class="opt"><span>${t.quietL}</span>${chips(r.kind, "through", [[false, t.hold], [true, t.through]], r.through)}</div>`);
    opts.push(`<div class="opt"><span>${t.icon}</span><div class="icons">${Object.keys(MDI).map((key) => `<button class="icobtn" style="--c:${r.color}" data-k="${r.kind}" data-icon="${key}" aria-pressed="${r.icon === key}" aria-label="${esc(`${t.icon}: ${t.iconNames[key]}`)}">${svg(key)}</button>`).join("")}</div></div>`);
    opts.push(`<div class="opt"><span>${t.colour}</span><div class="swatches">${COLOURS.map((c) => `<button class="swatch" style="--s:${c}" data-k="${r.kind}" data-color="${c}" aria-pressed="${r.color === c}" aria-label="${t.colour} ${c}"></button>`).join("")}</div></div>`);
    const note2 = r.disabled ? `<div class="hint">${k.insight ? t.insightOff : t.alwaysOn}</div>` : "";
    return `<article class="card${r.on ? "" : " off"}${sel ? " sel" : ""}" id="card-${r.kind}" style="--c:${r.color}">
      <div class="top" data-pick="${r.kind}"><div class="ic">${svg(r.icon)}</div><div style="min-width:0"><h4>${esc(name)}${k.isNew ? `<span class="tag">${t.newTag}</span>` : ""}${k.important ? `<span class="tag imp">${t.important}</span>` : ""}</h4><div class="sub">${esc(sub)}</div></div>${sw(r.on, `data-k="${r.kind}" data-toggle="on"`, name, r.disabled && !k.insight ? true : r.disabled)}</div>
      ${ex ? `<div class="bubble" data-pick="${r.kind}"><b>${esc(ex.title)}</b><span>${esc(ex.body)}</span></div>` : ""}${note2}
      <button class="more" data-open="${r.kind}" aria-expanded="${sel}">${sel ? t.close : t.open}</button>
      <div class="opts"${sel ? "" : " hidden"}>${opts.join("")}</div></article>`;
  }

  function render() {
    const t = T(), st = api.settings || {};
    const away = (api.cars || []).every((c) => c.s?.notify_away !== false);
    root.innerHTML = `<style>${CSS}</style>
      <div class="strip">
        <div class="grp">${sw(st.notify_enabled !== false, 'data-g="notify_enabled"', t.all)}<b>${t.all}</b></div>
        <div class="grp">${sw(Boolean(st.quiet_enabled), 'data-g="quiet_enabled"', t.quiet)}<span>${t.quiet}</span>${st.quiet_enabled ? `<input class="time" type="time" step="900" value="${String(st.quiet_from || "22:00").slice(0, 5)}" data-g="quiet_from" aria-label="${t.quiet}">–<input class="time" type="time" step="900" value="${String(st.quiet_to || "06:00").slice(0, 5)}" data-g="quiet_to" aria-label="${t.quiet}">` : ""}</div>
        ${st.quiet_enabled ? `<div class="grp"><span>${t.after}</span><button class="chip" data-g="quiet_after" data-v="digest" aria-pressed="${(st.quiet_after || "digest") === "digest"}">${t.digest}</button><button class="chip" data-g="quiet_after" data-v="drop" aria-pressed="${st.quiet_after === "drop"}">${t.drop}</button></div>` : ""}
        <div class="grp">${sw(away, 'data-g="away"', t.away)}<span>${t.away}</span></div>
        <div class="grp"><span class="pop"><button class="q" aria-label="?">?</button><span class="tip" hidden>${t.quietTip}</span></span></div>
      </div>
      <div class="main">
        <div class="phonecol"><div class="head"><span class="label">${t.phoneHead}</span><span class="pop"><button class="q" aria-label="?">?</button><span class="tip" hidden>${t.phoneTip}</span></span></div><div class="phone${open ? " focus" : ""}" aria-live="polite">${phoneHtml()}</div></div>
        <div class="cards"><div class="head"><h3>${t.cardsHead}</h3><span class="pop"><button class="q" aria-label="?">?</button><span class="tip" hidden>${t.cardsTip}</span></span></div>${ORDER.map((k) => card(rule(k))).join("")}</div>
      </div>`;
    const phone = root.querySelector(".phone"), selNote = phone?.querySelector(".note.sel");
    if (selNote && (selNote.offsetTop < phone.scrollTop || selNote.offsetTop + selNote.offsetHeight > phone.scrollTop + phone.clientHeight)) phone.scrollTop = Math.max(0, selNote.offsetTop - phone.clientHeight / 3);
  }

  /* Saving: the cars' own switches for their cards, the household's choices for the rest. */
  const messages = () => ({ ...((api.settings || {}).messages || {}) });
  const saveRule = (kind, patch) => { const all = messages(); all[kind] = { ...(all[kind] || {}), ...patch }; return api.saveSettings({ messages: all }); };
  function setCars(kind, ids) {
    const k = KINDS[kind];
    if (!k.flag) return saveRule(kind, { cars: ids });
    return Promise.all((api.cars || []).map((c) => api.saveCar(c.id, { [k.flag]: ids === "all" || ids.includes(c.id) })));
  }
  function saveReminder(patch) {
    const r = rule("reminder"), cars = inCars(r);
    return Promise.all(cars.map((c) => api.saveCar(c.id, patch)));
  }
  function change(kind, field, value) {
    const r = rule(kind);
    if (kind === "reminder" && ["at", "below", "repeat", "price"].includes(field)) {
      const map = { at: "reminder_time", below: "reminder_soc", repeat: "reminder_repeat", price: "reminder_price" };
      return saveReminder({ [map[field]]: field === "at" ? value : Number(value) });
    }
    if (kind === "pick" && field === "at") return api.saveSettings({ insight_notify_at: value });
    if (field === "through") return saveRule(kind, { through: value === "true" || value === true });
    if (field === "plugged" || field === "at") return saveRule(kind, { [field]: value });
    return null;
  }

  root.addEventListener("click", (e) => {
    const q = e.target.closest(".q");
    root.querySelectorAll(".pop .tip").forEach((tip) => { if (!q || tip !== q.nextElementSibling) tip.hidden = true; });
    if (q) { q.nextElementSibling.hidden = !q.nextElementSibling.hidden; return; }
    const b = e.target.closest("button, [data-pick]");
    if (!b) return;
    const d = b.dataset;
    if (d.note !== undefined) { if (d.note) { open = d.note; render(); root.getElementById(`card-${d.note}`)?.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
    if (d.pick && b.tagName !== "BUTTON") { if (open !== d.pick) { open = d.pick; render(); } return; }
    if (d.open) { open = open === d.open ? null : d.open; render(); return; }
    if (d.g) {
      const st = api.settings || {};
      if (d.g === "away") { const on = !(api.cars || []).every((c) => c.s?.notify_away !== false); Promise.all((api.cars || []).map((c) => api.saveCar(c.id, { notify_away: on }))); return; }
      if (d.g === "quiet_after") { api.saveSettings({ quiet_after: d.v }); return; }
      if (d.g === "notify_enabled") { api.saveSettings({ notify_enabled: st.notify_enabled === false }); return; }
      if (d.g === "quiet_enabled") { api.saveSettings({ quiet_enabled: !st.quiet_enabled }); return; }
      return;
    }
    const kind = d.k;
    if (!kind || !KINDS[kind]) return;
    open = kind;
    const r = rule(kind), k = KINDS[kind];
    if (d.toggle === "on") {
      if (r.disabled) return;
      if (k.insight) api.saveSettings({ insight_notify: !r.on });
      else if (k.flag) setCars(kind, r.on ? [] : r.cars);
      else saveRule(kind, { on: !r.on });
    } else if (d.toggle === "live") saveRule(kind, { live: !r.live });
    else if (d.toggle === "price") saveReminder({ reminder_price_enabled: r.price == null, ...(r.price == null ? { reminder_price: 1 } : {}) });
    else if (d.day != null) {
      const i = Number(d.day), days = r.days.includes(i) ? r.days.filter((x) => x !== i) : [...r.days, i].sort();
      if (kind === "reminder") saveReminder({ reminder_days: days.map((x) => WEEK[x]) });
      else saveRule(kind, { days });
    } else if (d.cars) {
      const all = (api.cars || []).map((c) => c.id);
      let ids = d.cars === "all" ? "all" : r.cars === "all" ? [d.cars] : r.cars.includes(d.cars) ? r.cars.filter((x) => x !== d.cars) : [...r.cars, d.cars];
      if (Array.isArray(ids) && (!ids.length || ids.length === all.length)) ids = "all";
      setCars(kind, ids);
    } else if (d.to) {
      const all = (api.phones || []).map((p) => p.id);
      let to = d.to === "all" ? "all" : r.to === "all" ? [d.to] : r.to.includes(d.to) ? r.to.filter((x) => x !== d.to) : [...r.to, d.to];
      if (Array.isArray(to) && (!to.length || to.length === all.length)) to = "all";
      saveRule(kind, { to });
    } else if (d.icon) saveRule(kind, { icon: MDI[d.icon] });
    else if (d.color) saveRule(kind, { color: d.color });
    else if (d.f) change(kind, d.f, d.v);
    render();
  });
  root.addEventListener("change", (e) => {
    const el2 = e.target, d = el2.dataset;
    if (d.g === "quiet_from" || d.g === "quiet_to") { if (el2.value) api.saveSettings({ [d.g]: el2.value }); return; }
    if (d.k && d.f && el2.value !== "") change(d.k, d.f, el2.value);
  });

  render();
  return {
    update(next) {
      api = next;
      // Not while a field is being typed in.
      const active = root.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "SELECT")) return;
      render();
    },
  };
}
