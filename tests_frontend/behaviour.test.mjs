/* What the panel does when it is used: the commands it sends to Home Assistant, the house
   that is drawn again when its look changes, and the CSV file of the history. */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";

import { DESKTOP, PHONE, fixture, keepPicture, launch, openPage, serve } from "./lib/setup.mjs";

const DOMAIN = "ev_household_planner";
let browser;
let server;

before(async () => {
  browser = await launch();
  server = await serve();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

/* The panel on a page with a fixture; `run` gets helpers that work inside the panel's shadow root.
   `known: true` is for a fault that is known: no picture of it is kept. */
async function withPanel(name, options, run) {
  const state = typeof name === "string" ? fixture(name) : name;
  const opened = await openPage(browser, server.url, { now: state.now, ...options });
  const { page, context, errors } = opened;
  const tools = {
    page,
    state,
    // A real click with the mouse (Playwright's selectors look inside shadow roots).
    tap: (selector) => page.locator(`ev-planner-panel ${selector}`).first().click({ timeout: 5000 }),
    // A tap as on an iPhone, where the focus stays where it was.
    touch: (selector) =>
      page.evaluate((s) => {
        const el = window.harness.panel.shadowRoot.querySelector(s);
        if (!el) throw new Error(`Nothing to tap at ${s}`);
        el.click();
      }, selector),
    read: (selector, attribute = null) =>
      page.evaluate(([s, a]) => {
        const el = window.harness.panel.shadowRoot.querySelector(s);
        return el ? (a ? el.getAttribute(a) : el.textContent.trim()) : null;
      }, [selector, attribute]),
    calls: (type) => page.evaluate((t) => window.harness.calls.filter((c) => c.type === t), `${DOMAIN}/${type}`),
    waitForCall: (type) => page.waitForFunction((t) => window.harness.calls.some((c) => c.type === t), `${DOMAIN}/${type}`, { timeout: 5000 }),
    push: (next) => page.evaluate((s) => window.harness.push(s), next),
  };
  try {
    await page.evaluate(([s, o]) => window.harness.mountPanel(s, o).then(() => null), [state, { lang: options.lang || "en", dark: false }]);
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector(".tabs button"));
    await run(tools);
    assert.deepEqual(errors, [], "nothing in the console");
    assert.deepEqual(await page.evaluate(() => window.harness.unknown), [], "every command had an answer");
  } catch (err) {
    if (!options.known) await keepPicture(page, `behaviour ${err.message.slice(0, 40)}`);
    throw err;
  } finally {
    await context.close();
  }
}

test("the panel follows EV Planner once, and stops when it leaves the page", async () => {
  await withPanel("two-cars", {}, async ({ page, calls }) => {
    // Home Assistant gives the panel `hass` first and puts it on the page after: one subscription, not two.
    assert.equal((await calls("subscribe")).length, 1);
    assert.equal(await page.evaluate(() => window.harness.listeners.size), 1);
    await page.evaluate(() => window.harness.panel.remove());
    await page.waitForFunction(() => window.harness.listeners.size === 0);
  });
});

test("a mode button stores the mode at once", async () => {
  await withPanel("two-cars", {}, async ({ tap, read, calls, waitForCall, state }) => {
    await tap('.tabs button[data-tab="cars"]');
    const button = '.modes[data-id="tesla_model_y"] button[data-mode="pause"]';
    assert.equal(await read(button, "aria-checked"), "false");
    await tap(button);
    await waitForCall("vehicle_set");
    assert.deepEqual(await calls("vehicle_set"), [
      { type: `${DOMAIN}/vehicle_set`, vehicle_id: "tesla_model_y", settings: { mode: "pause" }, entry_id: state.entry_id },
    ]);
    assert.equal(await read(button, "aria-checked"), "true");
    assert.equal(await read('.modes[data-id="tesla_model_y"] button[data-mode="smart"]', "aria-checked"), "false");
  });
});

test("changing a rule shows the plan it would give, then stores it", async () => {
  await withPanel("two-cars", { size: PHONE }, async ({ page, tap, read, calls, waitForCall, state }) => {
    await tap('.tabs button[data-tab="cars"]');
    await tap('[data-act="open-car"][data-id="tesla_model_y"]');
    await tap('[data-act="car-view"][data-view="rules"]');
    await tap('[data-act="tile"][data-tile="price"]');
    const key = await read('.sheet .switch[data-act="toggle"]', "data-key");
    assert.ok(key, "the sheet has a switch");
    const before = (await read(`.switch[data-key="${key}"]`, "aria-checked")) === "true";
    assert.equal(before, Boolean(state.vehicles.find((v) => v.id === "tesla_model_y").settings[key]));
    await tap(`.switch[data-key="${key}"]`);
    // The switch moves at once; the preview is asked for shortly after, and the change is stored after that.
    assert.equal(await read(`.switch[data-key="${key}"]`, "aria-checked"), String(!before));
    assert.deepEqual(await calls("vehicle_set"), []);
    await waitForCall("vehicle_preview");
    await waitForCall("vehicle_set");
    const expected = { vehicle_id: "tesla_model_y", settings: { [key]: !before }, entry_id: state.entry_id };
    assert.deepEqual(await calls("vehicle_preview"), [{ type: `${DOMAIN}/vehicle_preview`, ...expected }]);
    assert.deepEqual(await calls("vehicle_set"), [{ type: `${DOMAIN}/vehicle_set`, ...expected }]);
    const order = await page.evaluate(() => window.harness.calls.map((c) => c.type.split("/")[1]));
    assert.ok(order.indexOf("vehicle_preview") < order.indexOf("vehicle_set"), "the preview comes before the change is stored");
  });
});

test("a new household is shown what to set up, until there is a car, a charger and prices", async () => {
  await withPanel("empty", {}, async ({ page, read, push, state }) => {
    const steps = () => page.evaluate(() => [...window.harness.panel.shadowRoot.querySelectorAll(".setup-steps li")].map((li) => `${li.dataset.step}:${li.classList.contains("done")}`));
    assert.deepEqual(await steps(), ["prices:true", "car:false", "charger:false", "supply:false", "energy:false", "notify:true"]);
    assert.equal(await read(".setup-count"), "2 of 6");
    assert.equal(await read(".setup a.btn", "href"), "/config/integrations/integration/ev_household_planner");
    assert.equal(await read(".empty.panel"), null, "the steps stand in for the empty page");

    // A car is added: the steps stay over the car until there is a charger too.
    const full = fixture("two-cars");
    await push({ ...state, vehicles: full.vehicles });
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector('.setup-steps li[data-step="car"].done'), null, { timeout: 5000 });
    assert.ok(await read(".cars-grid"), "the car is shown under the steps");
    await push({ ...state, vehicles: full.vehicles, chargers: full.chargers });
    await page.waitForFunction(() => !window.harness.panel.shadowRoot.querySelector(".setup"), null, { timeout: 5000 });
  });
});

test("a plan on the price forecast says so, and a button makes it from the known prices", async () => {
  await withPanel("two-cars", {}, async ({ page, tap, read, calls, waitForCall, push, state }) => {
    const car = state.vehicles.find((v) => v.plan);
    const note = '.cars-grid .basis [data-act="known-prices"]';
    assert.equal(await read(note), null);
    await push({ ...state, vehicles: state.vehicles.map((v) => (v.id === car.id ? { ...v, plan_forecast: true, plan_other_cost: v.plan.cost + 12.5 } : v)) });
    await page.waitForFunction((s) => window.harness.panel.shadowRoot.querySelector(s), note, { timeout: 5000 });
    assert.equal((await read(note)).replace(/\s/g, " "), "Use known prices+DKK 12.50");
    assert.equal(await read(".cars-grid .basis span"), "Price forecast");
    await tap(note);
    await waitForCall("vehicle_set");
    assert.deepEqual((await calls("vehicle_set")).at(-1).settings, { known_prices: true });
    // Planned from the known prices: the note says so, and the forecast can be used again.
    await push({ ...state, vehicles: state.vehicles.map((v) => (v.id === car.id ? { ...v, plan_forecast: false, settings: { ...v.settings, known_prices: true } } : v)) });
    const back = '.cars-grid .basis [data-act="forecast-prices"]';
    await page.waitForFunction((s) => window.harness.panel.shadowRoot.querySelector(s), back, { timeout: 5000 });
    await tap(back);
    await page.waitForFunction(() => window.harness.calls.filter((c) => c.type.endsWith("vehicle_set")).length >= 2, null, { timeout: 5000 });
    assert.deepEqual((await calls("vehicle_set")).at(-1).settings, { known_prices: false });
  });
});

test("each place has its own picture and its own house", async () => {
  await withPanel("two-chargers", {}, async ({ page, tap, touch, read, calls, waitForCall, push, state }) => {
    const scene = () => page.evaluate(() => window.harness.panel.shadowRoot.querySelector(".cscene svg.cs-main")?.innerHTML || "");
    const count = (selector) => page.evaluate((s) => window.harness.panel.shadowRoot.querySelectorAll(s).length, selector);
    await tap('.tabs button[data-tab="home"]');
    // The home is shown first: its two chargers, and not the summer house's.
    assert.equal(await read('[data-act="place"][data-id="home"]', "aria-pressed"), "true");
    assert.equal(await count(".cscene .cs-charger"), 2);
    const home = await scene();

    await tap('[data-act="place"][data-id="summer"]');
    await page.waitForFunction((was) => window.harness.panel.shadowRoot.querySelector(".cscene svg.cs-main")?.innerHTML !== was, home, { timeout: 5000 });
    assert.equal(await read('[data-act="place"][data-id="summer"]', "aria-pressed"), "true");
    assert.equal(await count(".cscene .cs-charger"), 1, "the summer house has its one charger");
    assert.equal(await count(".cscene .cs-car"), 0, "and no car is there");
    const cabin = await scene();

    // Each place's house is chosen by itself: the summer house starts as the wooden one.
    await tap('.tabs button[data-tab="settings"]');
    await tap('[data-act="tile"][data-tile="house"]');
    assert.equal(await read('[data-act="house-look"][data-site="home"][data-house="classic"]', "aria-pressed"), "true");
    assert.equal(await read('[data-act="house-look"][data-site="summer"][data-house="cabin"]', "aria-pressed"), "true");
    await touch('[data-act="house-look"][data-site="summer"][data-house="funkis"]');
    await waitForCall("settings");
    assert.deepEqual(await calls("settings"), [{ type: `${DOMAIN}/settings`, settings: { houses: { summer: "funkis" } }, entry_id: state.entry_id }]);

    await push({ ...state, settings: { ...state.settings, houses: { summer: "funkis" } } });
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector('[data-act="house-look"][data-site="summer"][data-house="funkis"]')?.getAttribute("aria-pressed") === "true", null, { timeout: 5000 });
    assert.equal(await read('[data-act="house-look"][data-site="home"][data-house="classic"]', "aria-pressed"), "true", "the home keeps its house");
    await tap('[data-act="sheet-close"][data-f]');
    await tap('.tabs button[data-tab="home"]');
    // The place that was looked at is still the one shown.
    assert.equal(await read('[data-act="place"][data-id="summer"]', "aria-pressed"), "true");
    assert.notEqual(await scene(), cabin, "the summer house is drawn as the new house");
  });
});

test("the house's look is stored, and the house is drawn again when it changes", async () => {
  await withPanel("shared-supply", {}, async ({ page, tap, touch, read, calls, waitForCall, push, state }) => {
    const scene = () => page.evaluate(() => window.harness.panel.shadowRoot.querySelector(".cscene svg.cs-main")?.innerHTML || "");
    await tap('.tabs button[data-tab="home"]');
    const classic = await scene();
    assert.ok(classic.includes("cs-wire"), "the classic house is drawn");

    await tap('.tabs button[data-tab="settings"]');
    await tap('[data-act="tile"][data-tile="house"]');
    assert.equal(await read('[data-act="house-look"][data-house="classic"]', "aria-pressed"), "true");
    // The focus is on the sheet's "Done" button and stays there: the choice must show all the same.
    await touch('[data-act="house-look"][data-house="angle"]');
    await waitForCall("settings");
    assert.deepEqual(await calls("settings"), [{ type: `${DOMAIN}/settings`, settings: { house: "angle" }, entry_id: state.entry_id }]);

    // Home Assistant stores it and sends the new state.
    await push({ ...state, settings: { ...state.settings, house: "angle" } });
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector('[data-act="house-look"][data-house="angle"]')?.getAttribute("aria-pressed") === "true", null, { timeout: 5000 });
    await tap('[data-act="sheet-close"][data-f]');
    await tap('.tabs button[data-tab="home"]');
    const angle = await scene();
    assert.ok(angle.includes("cs-wire"), "the angle house is drawn");
    assert.notEqual(angle, classic, "the picture changed");

    // And back, while the Home tab is open: Home Assistant sends only what changed.
    await page.evaluate((settings) => window.harness.patch({ patch: { now: window.harness.state.now, settings } }), { ...state.settings, house: "classic" });
    await page.waitForFunction((was) => window.harness.panel.shadowRoot.querySelector(".cscene svg.cs-main")?.innerHTML !== was, angle, { timeout: 5000 });
    assert.equal(await scene(), classic, "the classic house is back");
  });
});

/* Click "Export CSV" and read the file the browser was given: {name, bytes, text}. */
async function exported({ page, tap }) {
  const [download] = await Promise.all([page.waitForEvent("download"), tap('[data-act="hist-export"]')]);
  const bytes = await readFile(await download.path());
  return { name: download.suggestedFilename(), bytes, text: bytes.toString("utf8") };
}

test("the history as CSV: what the view shows, for Excel in English", async () => {
  await withPanel("two-cars", {}, async (tools) => {
    await tools.tap('.tabs button[data-tab="history"]');
    assert.equal(await tools.read('[data-act="hist-export"]'), "Export CSV");
    const file = await exported(tools);
    assert.equal(file.name, "ev-planner-2026-11-01-2026-11-30.csv");
    assert.deepEqual([...file.bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf], "UTF-8 with a byte order mark");
    assert.deepEqual(file.text.slice(1).split("\r\n"), [
      "Start,End,Car or guest,Charger,kWh,Cost,Currency,Charge level at start (%),Charge level at end (%),Of which from the sun (kWh),Measured by",
      "2026-11-09 02:00,2026-11-09 03:50,Renault Zoe,Garage,19.80,22.40,DKK,44,80,0.00,Charge level",
      "2026-11-08 01:00,2026-11-08 04:05,Tesla Model Y,Garage,34.10,41.27,DKK,38,80,0.00,Power reading",
      "2026-11-07 19:20,2026-11-07 22:10,Guest: Kia e-Niro CX48213,Garage,31.20,61.40,DKK,35,,,",
      "2026-11-05 23:30,2026-11-06 03:30,Tesla Model Y,Garage,43.60,58.90,DKK,26,80,0.00,Power reading",
      "2026-11-04 13:10,2026-11-04 15:15,Renault Zoe,Garage,21.10,24.75,DKK,39,78,6.30,Time and charging power",
      "2026-11-02 02:15,2026-11-02 04:00,Tesla Model Y,Garage,18.60,21.67,DKK,57,80,0.00,Power reading",
      "",
    ]);
    // The rows are the charges in the list on the page.
    assert.equal(await tools.page.evaluate(() => window.harness.panel.shadowRoot.querySelectorAll(".hist-body .sessions > li").length), 6);

    // Another scope and period: one car, last month.
    await tools.tap('[data-act="hist-scope"][data-value="car:renault_zoe"]');
    await tools.tap('[data-act="hist-move"][data-step="-1"]');
    const october = await exported(tools);
    assert.equal(october.name, "ev-planner-2026-10-01-2026-10-31.csv");
    assert.deepEqual(october.text.slice(1).split("\r\n").slice(1), [
      "2026-10-30 01:00,2026-10-30 03:10,Renault Zoe,Garage,23.40,39.10,DKK,36,80,0.00,Power reading",
      "2026-10-22 02:30,2026-10-22 04:05,Renault Zoe,Garage,17.20,28.80,DKK,48,80,0.00,Power reading",
      "2026-10-15 00:30,2026-10-15 02:50,Renault Zoe,Garage,25.30,43.90,DKK,33,80,0.00,Power reading",
      "",
    ]);

    // A period without charges has nothing to export.
    await tools.tap('[data-act="hist-period"][data-value="day"]');
    assert.equal(await tools.read('[data-act="hist-export"]'), null);
  });
});

test("the history as CSV in Danish: semicolons and decimal commas", async () => {
  await withPanel("two-cars", { lang: "da" }, async (tools) => {
    await tools.tap('.tabs button[data-tab="history"]');
    assert.equal(await tools.read('[data-act="hist-export"]'), "Eksportér CSV");
    const lines = (await exported(tools)).text.slice(1).split("\r\n");
    assert.equal(lines[0], "Start;Slut;Bil eller gæst;Lader;kWh;Pris;Valuta;Ladeniveau ved start (%);Ladeniveau ved slut (%);Heraf fra solen (kWh);Målt med");
    assert.equal(lines[1], "2026-11-09 02:00;2026-11-09 03:50;Renault Zoe;Garage;19,80;22,40;DKK;44;80;0,00;Ladeniveau");
    assert.equal(lines[3], "2026-11-07 19:20;2026-11-07 22:10;Gæst: Kia e-Niro CX48213;Garage;31,20;61,40;DKK;35;;;");
    assert.equal(lines.length, 8);
  });
});

test("the CSV keeps names with commas, quotes and formulas in one harmless cell", async () => {
  const state = fixture("two-cars");
  state.vehicles[0].name = '=2+3, "Zoe"';
  state.vehicles[0].history[0].cost = -1.5;
  await withPanel(state, {}, async (tools) => {
    await tools.tap('.tabs button[data-tab="history"]');
    const lines = (await exported(tools)).text.slice(1).split("\r\n");
    // A name is text, also when it looks like a formula; a negative cost stays a number.
    assert.equal(lines[1], '2026-11-09 02:00,2026-11-09 03:50,"\'=2+3, ""Zoe""",Garage,19.80,-1.50,DKK,44,80,0.00,Charge level');
  });
});

test("tonight's plans on a phone: a name that is too long ends in an ellipsis", async () => {
  await withPanel("shared-supply", { size: PHONE }, async ({ page, tap }) => {
    await tap('.tabs button[data-tab="home"]');
    const names = await page.evaluate(() =>
      [...window.harness.panel.shadowRoot.querySelectorAll(".tn-name span")].map((el) => ({
        name: el.textContent,
        cut: el.scrollWidth > el.clientWidth,
        ellipsis: getComputedStyle(el).textOverflow === "ellipsis" && getComputedStyle(el).overflowX === "hidden",
        inside: el.getBoundingClientRect().right <= el.parentElement.getBoundingClientRect().right + 0.5,
      })),
    );
    assert.deepEqual(names.map((n) => n.name), ["Renault Zoe", "Tesla Model Y"]);
    assert.ok(names.some((n) => n.cut), "a name does not fit on a phone");
    for (const n of names) assert.ok(n.ellipsis && n.inside, `${n.name} is shortened with "…"`);
  });
});

test("the Home tab's numbers fit in their chips", async () => {
  await withPanel("shared-supply", { size: DESKTOP, known: true }, async ({ page, tap }) => {
    await tap('.tabs button[data-tab="home"]');
    const spills = await page.evaluate(() =>
      [...window.harness.panel.shadowRoot.querySelectorAll(".now-chip")]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => `${el.textContent.trim()}: ${el.scrollWidth}px of text in ${el.clientWidth}px`),
    );
    assert.deepEqual(spills, []);
  });
});

test("a change to one car leaves the rest of the state as it was", async () => {
  await withPanel("shared-supply", { known: true }, async ({ page, state }) => {
    const car = state.vehicles[0];
    await page.evaluate((changed) => window.harness.patch({ patch: {}, items: { vehicles: { [changed.id]: changed } } }), { ...car, name: "Changed" });
    const seen = await page.evaluate(() => {
      const s = window.harness.panel._state;
      return { names: s.vehicles.map((v) => v.name), chargers: s.chargers.length, prices: s.prices.length };
    });
    assert.equal(seen.names[0], "Changed");
    assert.deepEqual(seen.names.slice(1), state.vehicles.slice(1).map((v) => v.name));
    assert.equal(seen.chargers, state.chargers.length);
    assert.equal(seen.prices, state.prices.length);
    assert.deepEqual((await page.evaluate(() => window.harness.calls)).filter((c) => c.type.endsWith("/subscribe")).at(-1).changes, true);
  });
});

test("the grid's label shows an arrow and the power, and the words when it is tapped", async () => {
  await withPanel("shared-supply", { known: true }, async ({ page }) => {
    await page.locator('ev-planner-panel .tabs button[data-tab="home"]').click();
    const grid = page.locator('ev-planner-panel .cs-label[data-key="grid"]');
    await grid.waitFor();
    assert.equal(await grid.getAttribute("data-dir"), "in");
    assert.equal(await grid.locator(".cs-dir").count(), 1);
    assert.doesNotMatch(await grid.locator(".cs-v").innerText(), /buying/);
    await grid.click();
    const open = page.locator('ev-planner-panel .cs-label[data-key="grid"]');
    assert.match(await open.locator(".cs-v").innerText(), /buying/);
    assert.equal(await open.getAttribute("aria-expanded"), "true");
    // A car shows its level; the plan comes with a tap.
    const car = page.locator('ev-planner-panel .cs-label[data-key="car0"]');
    assert.match(await car.locator(".cs-v").innerText(), /^\d+\s?%$/);
  });
});

test("the clock's charging window is drawn in full when it sweeps in", async () => {
  await withPanel("two-cars", { size: PHONE, motion: true }, async ({ page, tap, state }) => {
    const car = state.vehicles.find((v) => v.plan?.segments?.length);
    await tap('.tabs button[data-tab="cars"]');
    await tap(`[data-act="open-car"][data-id="${car.id}"]`);
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector(".dial .window.sweep"));
    const drawn = await page.evaluate(async () => {
      const windows = [...window.harness.panel.shadowRoot.querySelectorAll(".dial .window.sweep")];
      await Promise.all(windows.flatMap((w) => w.getAnimations().map((a) => a.finished)));
      return windows.map((w) => getComputedStyle(w).strokeDashoffset);
    });
    assert.ok(drawn.length > 0, "the window sweeps in");
    for (const offset of drawn) assert.equal(parseFloat(offset), 0, "and stays drawn when the sweep is over");
  });
});

test("each animation has a name of its own", async () => {
  const source = await readFile(new URL("../custom_components/ev_household_planner/frontend/ev-planner-panel.js", import.meta.url), "utf8");
  const seen = new Map();
  for (const [, name, body] of source.matchAll(/@keyframes ([\w-]+) (\{.*\})/g)) {
    // The same animation written twice does no harm; two different ones with one name do: the last wins.
    if (seen.has(name)) assert.equal(body, seen.get(name), `two different animations are called ${name}`);
    seen.set(name, body);
  }
  assert.ok(seen.size > 5);
});

test("a command that is tried again by itself is shown quietly, and as a problem when it keeps failing", async () => {
  await withPanel("two-cars", { size: PHONE, known: true }, async ({ page, tap, state }) => {
    await tap('.tabs button[data-tab="cars"]');
    const car = state.vehicles[0];
    const show = (changes) => page.evaluate((changed) => window.harness.patch({ patch: {}, items: { vehicles: { [changed.id]: changed } } }), { ...car, ...changes });
    const seen = () => page.evaluate((id) => {
      const root = window.harness.panel.shadowRoot;
      const card = root.querySelector(`.modes[data-id="${id}"]`).closest("article, section, .vcard");
      return {
        badge: root.querySelector('.tabs button[data-tab="cars"] em')?.textContent || null,
        notes: [...card.querySelectorAll(".note-line")].map((n) => [n.classList.contains("info") ? "info" : "bad", n.textContent.trim()]),
      };
    }, car.id);
    await show({ control_error: "vehicle is offline", control_retry: "2026-01-14T21:24:00+01:00", problem: false });
    let now = await seen();
    assert.equal(now.badge, null, "no problem on the tab");
    assert.deepEqual(now.notes, [["info", "The command did not get through. Trying again at 21:24."]]);
    await show({ control_error: "vehicle is offline", control_retry: null, problem: false });
    now = await seen();
    assert.equal(now.badge, "1", "a problem once it keeps failing");
    assert.deepEqual(now.notes, [["bad", "Could not control charging: vehicle is offline"]]);
    await show({ control_error: null, control_retry: null, problem: false });
    now = await seen();
    assert.equal(now.badge, null);
    assert.deepEqual(now.notes, []);
  });
});

test("a charger with an unknown car asks which car it is, and stores the answer", async () => {
  await withPanel("two-chargers", { size: PHONE }, async ({ page, tap, calls, waitForCall, state }) => {
    await tap('.tabs button[data-tab="home"]');
    const list = await page.locator("ev-planner-panel .chargers").innerText();
    assert.match(list, /Unknown car/);
    assert.match(list, /Tesla Model Y is plugged in/);
    // The charger at the summer house says where it is.
    assert.match(list, /Sommerhus/);
    await tap('[data-act="open-charger"][data-id="carport"]');
    const who = page.locator("ev-planner-panel .who");
    assert.match(await who.innerText(), /cannot tell which one/);
    await tap('.who [data-act="occupant"][data-who="renault_zoe"]');
    await waitForCall("charger_occupant");
    assert.deepEqual(await calls("charger_occupant"), [
      { type: `${DOMAIN}/charger_occupant`, charger_id: "carport", occupant: "renault_zoe", entry_id: state.entry_id },
    ]);
  });
});

test("a car whose charger is not found yet says so, without a warning", async () => {
  await withPanel("two-chargers", {}, async ({ page, tap }) => {
    await tap('.tabs button[data-tab="cars"]');
    const card = await page.locator("ev-planner-panel .cars-grid").innerText();
    assert.match(card, /Finding the charger/);
    assert.equal(await page.locator('ev-planner-panel .tabs button[data-tab="cars"] .badge').count(), 0);
  });
});
