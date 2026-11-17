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

test("the steps of the target move at once when another is chosen", async () => {
  await withPanel("two-cars", { size: PHONE }, async ({ tap, read, waitForCall, calls }) => {
    await tap('.tabs button[data-tab="cars"]');
    await tap('[data-act="open-car"][data-id="tesla_model_y"]');
    await tap('[data-act="car-view"][data-view="rules"]');
    await tap('[data-act="tile"][data-tile="battery"]');
    assert.equal(await read('.sheet [data-act="tstep"][aria-checked="true"]', "data-value"), "auto");
    for (const step of ["5", "1", "10"]) {
      await tap(`.sheet [data-act="tstep"][data-value="${step}"]`);
      assert.equal(await read('.sheet [data-act="tstep"][aria-checked="true"]', "data-value"), step);
    }
    await waitForCall("vehicle_set");
    assert.equal((await calls("vehicle_set")).at(-1).settings.target_step, "10");
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
    await tap('.tabs button[data-tab="cars"]');
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
    await tap(".prof");
    await tap('[data-prof="settings"]');
    await tap('[data-act="tile"][data-tile="places"]');
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

    await tap(".prof");
    await tap('[data-prof="settings"]');
    await tap('[data-act="tile"][data-tile="places"]');
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
    await tools.tap('.tabs button[data-tab="past"]');
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
    await tools.tap('.tabs button[data-tab="past"]');
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
    await tools.tap('.tabs button[data-tab="past"]');
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
    // Each place shows its own chargers: the summer house's is under the summer house, not the home.
    assert.doesNotMatch(list, /Skur/);
    await tap('[data-act="place"][data-id="summer"]');
    const there = await page.locator("ev-planner-panel .chargers").innerText();
    assert.match(there, /Skur/);
    assert.doesNotMatch(there, /Carport/);
    await tap('[data-act="place"][data-id="home"]');
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

test("the household's departures: your own is added, changed and in every car's dropdown", async () => {
  await withPanel("two-cars", {}, async ({ page, tap, calls, waitForCall, state }) => {
    await tap(".prof");
    await tap('[data-prof="settings"]');
    await tap('[data-act="tile"][data-tile="departures"]');
    await tap('[data-act="dep-add"]');
    await waitForCall("settings");
    const added = (await calls("settings")).at(-1).settings.departures;
    assert.equal(added.at(-1).id, "holiday", "the holiday stays last");
    const own = added.at(-2);
    assert.equal(own.day, "tomorrow");
    assert.equal(own.time, "17:00");
    // Fridays, and only at the cheapest hours.
    await tap('[data-act="dep-set"][data-field="day"][data-value="fri"]');
    await tap('[data-act="dep-set"][data-field="price"][data-value="cheapest"]');
    const last = (await calls("settings")).at(-1).settings.departures.find((d) => d.id === own.id);
    assert.equal(last.day, "fri");
    assert.equal(last.price, "cheapest");
    // A car's dropdown has it.
    await tap('[data-act="sheet-close"][data-f]');
    await tap('.tabs button[data-tab="cars"]');
    await tap(`[data-act="open-car"][data-id="${state.vehicles[0].id}"]`);
    const options = await page.evaluate(() => [...window.harness.panel.shadowRoot.querySelectorAll("[data-trip-select] option")].map((o) => o.value));
    assert.ok(options.includes(own.id), "the new departure is in the dropdown");
    assert.ok(options.includes("summer") && options.includes("holiday"));
  });
});

test("a car's messages are set in Settings → Messages, and the phones for all cars", async () => {
  await withPanel("two-cars", {}, async ({ tap, calls, waitForCall, state }) => {
    const car = state.vehicles[0];
    await tap('.tabs button[data-tab="cars"]');
    await tap(`[data-act="open-car"][data-id="${car.id}"]`);
    await tap('[data-act="car-view"][data-view="rules"]');
    // The car's Messages tile leads to the household's settings, with this car open.
    await tap('[data-tile="notifications"][data-act="goto-settings"]');
    await tap('[data-ncar] [data-act="toggle"][data-key="live_notification"]');
    await waitForCall("vehicle_set");
    const set = (await calls("vehicle_set")).at(-1);
    assert.equal(set.vehicle_id, car.id);
    assert.equal(set.settings.live_notification, !car.settings?.live_notification);
    await tap('[data-act="phone-toggle"][data-phone="notify.mobile_app_iphone_15"]');
    await waitForCall("settings");
    assert.deepEqual((await calls("settings")).at(-1).settings.phones, ["notify.mobile_app_pixel_9", "notify.mobile_app_iphone_15"]);
  });
});

test("a settings sheet stays where it is scrolled to when something in it changes", async () => {
  await withPanel("two-cars", { size: { width: 390, height: 700 } }, async ({ page, tap }) => {
    await tap(".prof");
    await tap('[data-prof="settings"]');
    await tap('[data-act="tile"][data-tile="departures"]');
    await tap('[data-act="dep-open"][data-dep-id="weekend"]');
    const before = await page.evaluate(() => {
      const sheet = window.harness.panel.shadowRoot.querySelector(".sheet.in-page");
      sheet.scrollTop = 400;
      return sheet.scrollTop;
    });
    assert.ok(before > 100, "the sheet can scroll");
    // Clicked where it is (a real tap would first scroll it into view).
    await page.evaluate(() => window.harness.panel.shadowRoot.querySelector('[data-act="dep-set"][data-field="price"][data-value="cheapest"]').click());
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => {
      const sheet = window.harness.panel.shadowRoot.querySelector(".sheet.in-page");
      return { top: sheet.scrollTop, stay: sheet.classList.contains("stay") };
    });
    assert.equal(after.top, before, "not back at the top");
    assert.ok(after.stay, "and it does not slide in again");
  });
});

/* A finger's swipe inside the panel: from the middle of `selector`, `dx` to the side and `dy` down. */
function swipe(page, selector, dx, dy) {
  return page.evaluate(
    async ([s, x, y]) => {
      const el = window.harness.panel.shadowRoot.querySelector(s);
      if (!el) throw new Error(`Nothing to swipe at ${s}`);
      const box = el.getBoundingClientRect();
      const [x0, y0] = [box.left + box.width / 2, box.top + Math.min(box.height / 2, 40)];
      const fire = (type, cx, cy) => {
        const touch = new Touch({ identifier: 1, target: el, clientX: cx, clientY: cy });
        el.dispatchEvent(new TouchEvent(type, { touches: type === "touchend" ? [] : [touch], changedTouches: [touch], bubbles: true, composed: true, cancelable: true }));
      };
      fire("touchstart", x0, y0);
      for (let i = 1; i <= 6; i += 1) fire("touchmove", x0 + (x * i) / 6, y0 + (y * i) / 6);
      fire("touchend", x0 + x, y0 + y);
      await new Promise((resolve) => setTimeout(resolve, 260));
    },
    [selector, dx, dy],
  );
}

test("a swipe to the side changes the tab, and a scroll up and down does not", async () => {
  await withPanel("two-cars", { size: { width: 390, height: 844 } }, async ({ page, read }) => {
    const tab = () => read('.tabs button[aria-selected="true"]', "data-tab");
    assert.equal(await tab(), "home");
    await swipe(page, ".content", -160, 10);
    assert.equal(await tab(), "cars");
    await swipe(page, ".content", 0, -200);
    assert.equal(await tab(), "cars");
    await swipe(page, ".content", 160, -8);
    assert.equal(await tab(), "home");
    // The first tab has nothing before it.
    await swipe(page, ".content", 160, 0);
    assert.equal(await tab(), "home");
  });
});

test("the climate's sheet is closed by a swipe down, and its temperature is set by a swipe across the number or the wheel", async () => {
  const state = fixture("two-cars");
  const car = state.vehicles[0];
  car.climate = { entity: "climate.car", on: false, started_at: null, inside: 14, outside: 6 };
  car.settings = { ...car.settings, climate_temperature: 21 };
  await withPanel(state, { size: { width: 390, height: 844 } }, async ({ page, tap, read, calls, waitForCall }) => {
    await tap('.tabs button[data-tab="cars"]');
    await tap(`[data-act="open-car"][data-id="${car.id}"]`);
    await tap('[data-act="climate-open"]');
    assert.ok(await read(".sheet.pop-climate .cabin-temp output"));
    // The wheel over the number: half a degree up.
    await page.locator("ev-planner-panel .cabin-temp output").hover();
    await page.mouse.wheel(0, -100);
    await waitForCall("vehicle_set");
    assert.equal((await calls("vehicle_set")).at(-1).settings.climate_temperature, 21.5);
    // A drag across the number: 48 px is three steps down.
    const box = await page.locator("ev-planner-panel .cabin-temp output").boundingBox();
    const before = (await calls("vehicle_set")).length;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 50, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction((n) => window.harness.calls.filter((c) => c.type.endsWith("/vehicle_set")).length > n, before, { timeout: 5000 });
    assert.equal((await calls("vehicle_set")).at(-1).settings.climate_temperature, 20);
    // A small pull lets it stay; a long one closes it.
    await swipe(page, ".sheet.pop-climate header", 0, 30);
    assert.ok(await read(".sheet.pop-climate"));
    await swipe(page, ".sheet.pop-climate header", 0, 220);
    assert.equal(await read(".sheet.pop-climate"), null);
  });
});

test("a rule changed just before leaving the car's page is still stored", async () => {
  await withPanel("two-cars", { size: PHONE }, async ({ page, tap, read, calls, waitForCall }) => {
    await tap('.tabs button[data-tab="cars"]');
    await tap('[data-act="open-car"][data-id="tesla_model_y"]');
    await tap('[data-act="car-view"][data-view="rules"]');
    await tap('[data-act="tile"][data-tile="price"]');
    const key = await read('.sheet .switch[data-act="toggle"]', "data-key");
    const before = (await read(`.switch[data-key="${key}"]`, "aria-checked")) === "true";
    // The switch and, at once (before the change would be stored by itself), back to the cars.
    await page.evaluate((k) => {
      const panel = window.harness.panel;
      panel.shadowRoot.querySelector(`.switch[data-key="${k}"]`).click();
      panel._openCar(null);
    }, key);
    await waitForCall("vehicle_set");
    const sets = await calls("vehicle_set");
    assert.equal(sets.length, 1, "stored once");
    assert.deepEqual(sets[0].settings, { [key]: !before });
    // And not a second time, when the wait that was running is over.
    await page.waitForTimeout(900);
    assert.equal((await calls("vehicle_set")).length, 1);
  });
});

test("the guest's preview is made with the departure, the ceiling and the step that were just chosen", async () => {
  await withPanel("guest-charging", { size: PHONE }, async ({ page, waitForCall, calls }) => {
    await page.evaluate(() => window.harness.panel._setTab("guest"));
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      window.harness.calls.length = 0;
      window.harness.panel._gchange({ departure: "evening", price_ceiling: 1.2, target_step: 5 });
    });
    await waitForCall("guest_preview");
    const inputs = (await calls("guest_preview")).at(-1).inputs;
    assert.equal(inputs.departure, "evening");
    assert.equal(inputs.price_ceiling, 1.2);
    assert.equal(inputs.target_step, 5);
  });
});

test("every time is shown on Home Assistant's clock, also from another time zone", async () => {
  const state = fixture("two-cars");
  await withPanel({ ...state, time_zone: "Asia/Tokyo" }, { size: PHONE }, async ({ page }) => {
    // The browser is in Copenhagen (the tests' time zone); Home Assistant is in Tokyo, eight hours ahead in winter.
    const shown = await page.evaluate(() => {
      const panel = window.harness.panel;
      return { time: panel._time("2026-01-15T07:00:00+09:00"), day: panel._day(new Date(Date.now()).toISOString()) };
    });
    assert.equal(shown.time, "07:00");
    assert.equal(shown.day, "Today");
  });
  await withPanel({ ...state, time_zone: "Europe/Copenhagen" }, { size: PHONE }, async ({ page }) => {
    assert.equal(await page.evaluate(() => window.harness.panel._time("2026-01-15T07:00:00+01:00")), "07:00");
    assert.equal(await page.evaluate(() => window.harness.panel._time("2026-01-15T07:00:00+09:00")), "23:00");
  });
});

test("Insight's page shows the evening, the cars, the prices, the charging, the learning and the ledger", async () => {
  const state = fixture("two-cars");
  const [a, b] = state.vehicles.map((v) => v.id);
  const days = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`2026-10-${String((i % 28) + 1).padStart(2, "0")}`, { km: 20 + i, used: 4 + i / 5, charged: i % 3 ? null : 12, temp: 10 - (i % 12), out: 7 + (i % 3) }]));
  const car = (name) => ({ name, sources: { soc: "sensor.soc", odometer: "sensor.odo", tracker: null, temperature: null, energy: null }, days: 40, first: "2026-10-01", km_30: 900, trips: 1 });
  const detail = { kwh_km: 0.17, cold: 0.02, week: Array.from({ length: 7 }, (_, i) => ({ p50: 5 + i, p90: 20 + i })), days, needs: { "2026-10-11": 30, "2026-10-12": 3 } };
  const outlook = { soc_kwh: 30, p50: 6, p90: 24, floor: 30, floor_pct: 50, reach: 0, ripe: true };
  const tonight = { price: 1.2, cars: { [a]: outlook, [b]: { ...outlook, reach: 3 } }, groups: [{ cars: [a, b], pick: a, wait: false, reason: "needed", both: true, chance: 0.4 }], wait: false };
  const insight = {
    enabled: true,
    cars: { [a]: car("Tesla"), [b]: car("Mercedes") },
    prices: 3,
    spot: 700,
    forecasts: 2,
    done: {},
    tonight,
    score: { scored: 4, hits: 3, rate: 0.75, waits: 1, saved: 12.5, ripe: false },
    window: [21, 7],
    detail: { [a]: detail, [b]: { ...detail, days: {} } },
    price_days: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`2026-0${9 + Math.floor(i / 30)}-${String((i % 30) + 1).padStart(2, "0")}`.replace("010-", "10-"), { night: i % 9 ? 1 + (i % 5) / 10 : null, mean: 2, own: i > 55 }])),
    errors: [0.1, 0.17, 0.24, 0.31, 0.38, 0.45],
    price_hours: {},
    trips: [{ vehicle: a, start: "2026-10-10T07:00:00+02:00", end: "2026-10-10T07:40:00+02:00", from: "home", to: "work", km: 31.2, kwh: 5.1, temp: 8 }],
    ledger: { "2026-10-10": { cars: { [a]: outlook, [b]: outlook }, groups: [{ pick: a }] }, "2026-10-11": { cars: { [a]: outlook }, groups: [{ wait: true }] } },
  };
  // The week plan from this hour: the Tesla charges tonight from 01 to 04, the Mercedes on Friday at noon.
  const H = 168, flat = (v) => Array(H).fill(v), at4 = (from, to, kwh) => Array.from({ length: H }, (_, i) => (i >= from && i < to ? kwh : 0));
  const weekCar = (charges, kwh, level) => ({ charges, kwh, why: kwh.map((v) => (v ? "need" : null)), hard: flat(level - 5), typical: flat(level), home: flat(true), leaves: [], short: [], full_at: null, cost: 14, target: level, deadline: null, stay: [0, null], steer: true, learning: false, soc: level });
  const day = (charge) => Array.from({ length: 7 }, (_, n) => ({ kwh: n === charge ? 12 : 0, level: 60 }));
  insight.week = {
    at: "2026-11-10T21:00:00+01:00",
    start: "2026-11-10T21:00:00+01:00",
    step: 6,
    prices: Array.from({ length: H }, (_, i) => 1 + ((i + 21) % 24 < 6 ? 0 : 0.5)),
    kinds: Array.from({ length: H }, (_, i) => (i < 27 ? "known" : "forecast")),
    groups: [[a, b]],
    cars: {
      [a]: weekCar([{ start: "2026-11-11T01:00:00+01:00", end: "2026-11-11T04:00:00+01:00", from: 4, to: 7, kwh: 12, cost: 14, price: 1.17, why: "need", level: 70, guess: false }], at4(4, 7, 4), 60),
      [b]: weekCar([{ start: "2026-11-13T11:00:00+01:00", end: "2026-11-13T14:00:00+01:00", from: 62, to: 65, kwh: 12, cost: 12, price: 1, why: "cheap", level: 80, guess: true }], at4(62, 65, 4), 60),
    },
    steps: Array.from({ length: 11 }, () => ({ [a]: day(0), [b]: day(2) })),
  };
  // The week plan played over the last 90 days at each step.
  insight.runs = Array.from({ length: 11 }, (_, k) => ({ per_week: 2 + k / 5, per: { [a]: 1 + k / 10, [b]: 1 + k / 10 }, short: k ? 0 : 1, short_days: k ? [] : [["2026-10-12", a]], charged: [["2026-10-12", a], ["2026-10-14", b]], morning: 70, days: 88 }));
  // An hour of driving and a night of charging in Home Assistant's own statistics, for the days before the log.
  const hour = (day, h) => `2026-11-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00+01:00`;
  const statistics = {
    // The last: the odometer caught up while the car stood at home.
    "sensor.odo": [{ start: hour(8, 7), change: 24 }, { start: hour(8, 16), change: 24 }, { start: hour(9, 7), change: 24.4 }, { start: hour(9, 16), change: 24.1 }, { start: hour(10, 19), change: 1.7 }],
    "sensor.soc": [{ start: hour(8, 6), mean: 70 }, { start: hour(8, 8), mean: 62 }, { start: hour(8, 15), mean: 62 }, { start: hour(8, 17), mean: 55 }, { start: hour(9, 3), mean: 80 }],
    "sensor.energy": [{ start: hour(9, 1), change: 9.5 }, { start: hour(9, 2), change: 6.2 }],
  };
  insight.cars[a].sources.energy = "sensor.energy";
  // Where the car was on those days, as Home Assistant's history has it: out to a place and home again.
  insight.cars[a].sources.tracker = "device_tracker.car";
  const at = (day, h, minute, lat, lon) => ({ s: "not_home", a: { latitude: lat, longitude: lon }, lu: new Date(hour(day, h)).getTime() / 1000 + minute * 60 });
  const history = { "device_tracker.car": [...[8, 9].flatMap((day) => [at(day, 6, 0, 55, 10), at(day, 7, 10, 55.05, 10.07), at(day, 7, 40, 55.15, 10.2), at(day, 16, 5, 55.1, 10.12), at(day, 16, 40, 55, 10)]), at(10, 19, 5, 55, 10.0004), at(10, 19, 40, 55.0002, 10)] };
  insight.cars[b].sources.soc = "sensor.soc_b";
  statistics["sensor.soc_b"] = [{ start: hour(7, 1), mean: 40 }, { start: hour(7, 2), mean: 52 }, { start: hour(7, 3), mean: 66 }, { start: hour(7, 4), mean: 70 }];
  await withPanel({ ...state, settings: { ...state.settings, insight: true } }, { size: PHONE }, async ({ page, tap, read, calls, push }) => {
    const tiles = [];
    await page.route("**/api/map_tiles/raster/**", (route) => { tiles.push(route.request().url()); return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>' }); });
    await page.evaluate(([data, rows, past]) => { window.harness.insight = data; window.harness.statistics = rows; window.harness.history = past; window.harness.hass.config = { latitude: 55, longitude: 10 }; }, [insight, statistics, history]);
    await page.evaluate(() => window.harness.panel._setTab("history"));
    // The learning centre is a page of its own, fetched now: tonight in a picture, the timeline and three answers.
    const inside = (fn, arg) => page.evaluate(([code, value]) => new Function("root", "value", `return (${code})(root, value)`)(window.harness.panel.shadowRoot.querySelector("ev-planner-insight").shadowRoot, value), [fn.toString(), arg]);
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector("ev-planner-insight")?.shadowRoot.querySelector("#tl svg"));
    await page.waitForFunction(() => window.harness.calls.some((c) => c.type === "recorder/statistics_during_period"));
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector("ev-planner-insight").shadowRoot.querySelectorAll("#tl circle").length > 0);
    assert.equal((await calls("insight")).length, 1);
    assert.equal(await inside((root) => root.querySelectorAll("nav.tabs button").length), 4);
    assert.match(await inside((root) => root.querySelector("#hero .hero").textContent), /Tesla/);
    assert.equal(await inside((root) => root.querySelectorAll("#hero svg clipPath").length), 2, "both cars are drawn by their sides");
    assert.ok(await inside((root) => root.querySelector("#hero #h-cab").getAttribute("d")), "the cable is drawn");
    // The car that charges next, from the week plan, and what to do about it.
    assert.match(await inside((root) => root.querySelector("#hero .hero").textContent), /Tesla.*tonight/);
    assert.match(await inside((root) => root.querySelector("#hero .hcue").textContent), /Tesla/);
    assert.match(await inside((root) => root.querySelector("#hero").textContent), /Mercedes charges/);
    assert.equal(await inside((root) => root.querySelectorAll("#hero .hstep").length), 0, "no steps under the picture");
    assert.equal(await inside((root) => root.querySelectorAll(".tl-q").length), 3);
    assert.match(await inside((root) => root.querySelector(".tl-q b").textContent), /Tesla/);
    // The week for the cars: seven days from the week plan, each car's level, and a bolt on the car that charges tonight.
    assert.equal(await inside((root) => root.querySelectorAll("#wkp .wkp-col").length), 7);
    assert.equal(await inside((root) => root.querySelectorAll('#wkp .wkp-col[data-wkp="0"] .bat.chg').length), 1);
    assert.equal(await inside((root) => root.querySelectorAll("#tl-day .wkfact").length), 3, "both cars and the night's price, on one line");
    await tap('ev-planner-insight #wkp [data-wkp="2"]');
    assert.ok(await inside((root) => root.querySelector('#wkp [data-wkp="2"]').classList.contains("on")));
    assert.match(await inside((root) => root.querySelector("#tl-day").textContent), /cheapest/);
    // The timeline is wider than the page and scrolls by itself, both cars in it; a day is chosen by a tap, the zoom by + and −.
    assert.ok(await inside((root) => { const el = root.querySelector("#tl-scroll"); return el.scrollWidth > el.clientWidth && el.scrollLeft > 0; }));
    assert.equal(await inside((root) => root.querySelectorAll("#tl .tl-bf").length), 2);
    await inside((root) => root.querySelector('.tl-d[data-day="-2"]').dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })));
    assert.ok(await inside((root) => root.querySelector('.tl-d[data-day="-2"]').classList.contains("on")));
    assert.match(await inside((root) => root.querySelector("#tl-day").textContent), /48 km/);
    const wide = await inside((root) => root.querySelector("#tl svg").getBoundingClientRect().width);
    await tap('ev-planner-insight .tl-ctl [data-tlz="1"]');
    assert.ok((await inside((root) => root.querySelector("#tl svg").getBoundingClientRect().width)) > wide * 2);
    assert.equal(await inside((root) => root.querySelector('.tl-ctl [data-tlz="1"]').disabled), true);
    await tap("ev-planner-insight .tl-ctl [data-tlnow]");
    assert.equal(await inside((root) => root.querySelectorAll("#p-plan .chips button").length), 0, "no rows of buttons over the timeline");
    // A push from EV Planner does not draw the page again: the timeline is the same one, where it was left.
    await inside((root) => { root.querySelector("#tl svg").dataset.kept = "1"; });
    await push({ ...state, settings: { ...state.settings, insight: true } });
    assert.equal(await inside((root) => root.querySelector("#tl svg").dataset.kept), "1");
    // Driving: the logged trip with its places, and the older ones found in the odometer, told apart by how far.
    await tap('ev-planner-insight [data-tab="bil"]');
    assert.equal(await inside((root) => root.querySelectorAll("#trips circle").length), 5);
    // The map is a real one, asked for when Driving is first looked at: home, the place the car went to with how often, and its road.
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector("ev-planner-insight").shadowRoot.querySelector("#map .rsvg"));
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector("ev-planner-insight").shadowRoot.querySelector("#map .rtiles img"));
    assert.ok(tiles.length > 0 && tiles.every((url) => /\/api\/map_tiles\/raster\/\d+\/\d+\/\d+\.png\?token=tiles$/.test(url)), "the map's tiles are Home Assistant's own, opened by its token");
    assert.match(await inside((root) => root.querySelector("#map .rsvg").textContent), /Home/);
    assert.match(await inside((root) => root.querySelector("#map .rsvg").textContent), /≈ 24 km · 2×/);
    assert.match(await inside((root) => root.querySelector("#places").textContent), /work · 1×/, "a place without a position is listed under the map");
    assert.equal(await page.evaluate(() => window.harness.calls.filter((c) => c.type === "history/history_during_period").length), 1);
    assert.equal(await inside((root) => root.querySelectorAll("#clock path").length), 168);
    // A finger held on a chart reads it, and the page stays put.
    await inside((root) => { const el = root.querySelector("#clock"), r = el.querySelector("path[data-wd]").getBoundingClientRect(); el.dispatchEvent(new PointerEvent("pointerdown", { clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: "touch", bubbles: true })); });
    await page.waitForTimeout(260);
    assert.equal(await inside((root) => root.querySelector("#clock .tip").hidden), false);
    await inside((root) => root.querySelector("#clock").dispatchEvent(new PointerEvent("pointerup", { pointerType: "touch", bubbles: true })));
    assert.match(await inside((root) => root.querySelector("#sum-bil").textContent), /trips/);
    assert.equal(await inside((root) => root.querySelectorAll("#sum-wk rect").length), 13);
    // A trip made often is given a name: kept with the settings by the car and how far it goes, and shown at once.
    // A tap on the place on the map chooses it, with its name ready to be written.
    await page.locator("ev-planner-panel ev-planner-insight #map g[data-mp]").first().click({ force: true });
    assert.match(await inside((root) => root.querySelector("#trip .facts").textContent), /2×driven in 90 days/);
    // The ten places driven to most, and the box folds away.
    await tap('ev-planner-insight [data-mi="top"]');
    assert.ok(await inside((root) => root.querySelectorAll("#trip .top10 button").length >= 1));
    assert.doesNotMatch(await inside((root) => root.querySelector("#trip .top10").textContent + root.querySelector("#places").textContent), /1[.,]7 km/, "kilometres at home are not a place");
    await tap('ev-planner-insight [data-mi="tog"]');
    assert.equal(await inside((root) => root.querySelector("#trip .top10")), null);
    await tap('ev-planner-insight [data-mi="trip"]');
    await page.locator("ev-planner-panel ev-planner-insight #nm-in").fill("Work place");
    await page.locator("ev-planner-panel ev-planner-insight #nm-in").press("Enter");
    assert.match(await inside((root) => root.querySelector("#map .rsvg").textContent), /Work place · 2×/);
    assert.deepEqual((await calls("settings")).at(-1).settings, { insight_names: { [a]: [{ km: 24.2, name: "Work place", lat: 55.15, lon: 10.2 }] } });
    // The map zooms with + and −.
    const zoomed = await inside((root) => root.querySelector("#map .rtiles img").src);
    await tap('ev-planner-insight #map [data-mz="1"]');
    assert.notEqual(await inside((root) => root.querySelector("#map .rtiles img").src), zoomed);
    // An explanation is behind the card's "?".
    assert.equal(await inside((root) => getComputedStyle(root.querySelector("#p-bil .card p.small")).display), "none");
    await tap("ev-planner-insight #p-bil .q");
    assert.equal(await inside((root) => getComputedStyle(root.querySelector("#p-bil .card.help-open p.small")).display), "block");
    await tap(`ev-planner-insight #carsel [data-car="${b}"]`);
    // Power: the coming days three ways (the ways it may go flow on a canvas), and the charging found in the statistics.
    await tap('ev-planner-insight [data-tab="lad"]');
    assert.ok(await inside((root) => root.querySelector("#wk-pris svg .known")));
    await tap('ev-planner-insight [data-v="paths"]');
    assert.equal(await inside((root) => root.querySelector("#wk-pris canvas").style.visibility), "visible");
    await tap('ev-planner-insight [data-v="prob"]');
    assert.ok(await inside((root) => root.querySelectorAll("#wk-pris .pbar").length > 10));
    await tap('ev-planner-insight [data-v="fan"]');
    assert.match(await inside((root) => root.querySelector("#kpi-lad").textContent), /2 charges/);
    // The other car has no energy meter: its charging is seen as the battery rising while it stands still.
    assert.match(await inside((root) => root.querySelector("#flow").textContent), /Mercedes/);
    assert.ok(await inside((root) => root.querySelector("#flow svg .flow")));
    // Learned: four models with a ring each, and what was said against what was done.
    await tap('ev-planner-insight [data-tab="laer"]');
    assert.equal(await inside((root) => root.querySelectorAll("#models .model").length), 4);
    assert.match(await inside((root) => root.querySelector("#ledger-t").textContent), /3 of 4 days/);
    // The log as it is: a square for each of the 90 days, and what is learned from them.
    assert.equal(await inside((root) => root.querySelectorAll("#conveyor rect[data-k]").length), 90);
    assert.match(await inside((root) => root.querySelector("#conveyor .keep-kept").textContent), /The week's rhythm/);
    // A day of the log opens below it with what was kept that day; the hover tip stays inside the card.
    assert.equal(await inside((root) => getComputedStyle(root.querySelector("#conveyor")).position), "relative");
    const driven = await inside((root) => [...root.querySelectorAll("#conveyor rect[data-log]")].find((r) => r.getAttribute("fill") === "var(--accent)").dataset.log);
    await tap(`ev-planner-insight #conveyor rect[data-log="${driven}"]`);
    assert.match(await inside((root) => root.querySelector("#conveyor .logday").textContent), /km/);
    await tap("ev-planner-insight #conveyor .lx");
    assert.equal(await inside((root) => root.querySelector("#conveyor .logday")), null);
    // How careful: one slider, and what each choice would have done on the household's own days.
    assert.equal(await inside((root) => root.querySelectorAll("#c9-week i").length), 7);
    assert.equal(await inside((root) => root.querySelector("#c9-name").textContent), "Recommended");
    await inside((root) => { const input = root.querySelector("#c9lv"); input.value = "10"; input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); });
    assert.equal(await inside((root) => root.querySelector("#c9-name").textContent), "Fill up");
    assert.deepEqual((await calls("settings")).at(-1).settings, { insight_style: 10 });
    await tap("ev-planner-insight [data-c9q]");
    assert.equal(await inside((root) => root.querySelector("#tl-sheet").hidden), false);
    assert.ok(await inside((root) => root.querySelectorAll("#tl-sheet .strip i").length > 80));
    await tap("ev-planner-insight #tl-close");
    // An answer opens a sheet; from it the history is one tap away, with a way back to where one was.
    await tap('ev-planner-insight [data-tab="plan"]');
    await tap('ev-planner-insight .tl-q[data-tlsheet="kost"]');
    assert.equal(await inside((root) => root.querySelector("#tl-sheet").hidden), false);
    await tap('ev-planner-insight #tl-sheet [data-open="history"]');
    // The history is a tab of its own: the charging history alone, and back to Learning from the tab bar.
    assert.equal(await read('.tabs button[aria-selected="true"]', "data-tab"), "past");
    assert.ok(await read(".hist-controls"));
    assert.equal(await read(".learn-views"), null);
    await tap('.tabs button[data-tab="history"]');
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector("ev-planner-insight")?.shadowRoot.querySelector("#tl svg"));
    await tap('ev-planner-insight [data-tab="laer"]');
    assert.equal(await inside((root) => root.querySelector('#tabs button.on').dataset.tab), "laer");
    await tap('ev-planner-insight [data-tab="plan"]');
    // Fetched once a minute, not for every look (and once more after the choice of how careful). No sideways scroll on a phone.
    assert.equal((await calls("insight")).length, 2);
    assert.equal(await page.evaluate(() => window.harness.calls.filter((c) => c.type === "recorder/statistics_during_period").length), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    // Nothing unfinished is shown.
    assert.deepEqual(await inside((root) => [...root.querySelectorAll("*")].filter((el) => !el.children.length && /NaN|undefined|Infinity|\[object /.test(el.textContent)).map((el) => el.textContent.slice(0, 60))), []);
    // The settings sheet shows the same figures.
    await page.evaluate(() => window.harness.panel._setTab("settings"));
    await tap('[data-act="tile"][data-tile="insight"]');
    assert.ok(await read(".sheet .insight-card strong"));
    assert.match(await read(".sheet .insight-card small"), /01–04/);
  });
  // With Insight off: Charging and Learned as before, the other four dimmed with one line.
  await withPanel(state, { size: PHONE }, async ({ page, tap, read, calls }) => {
    await page.evaluate(() => window.harness.panel._setTab("history"));
    assert.equal(await read('.learn-views button[aria-selected="true"]', "data-value"), "learned");
    assert.equal(await page.evaluate(() => window.harness.panel.shadowRoot.querySelectorAll(".learn-views button.dim").length), 2);
    await tap('[data-act="hist-view"][data-value="cars"]');
    assert.match(await read(".hist-page .hint"), /Insight/);
    assert.equal((await calls("insight")).length, 0);
  });
});

test("A charge elsewhere is a grey line without kWh or price, and a charge over midnight shows both days", async () => {
  const state = fixture("two-cars");
  const zoe = state.vehicles[0];
  zoe.history = [
    { id: "away", start: "2026-11-10T00:05:00+01:00", end: "2026-11-10T01:10:00+01:00", energy: 10.4, cost: null, start_soc: 60, end_soc: 80, reason: "away", periods: [], charging_minutes: 65, elsewhere: true },
    { id: "night", start: "2026-11-08T21:43:00+01:00", end: "2026-11-09T15:29:00+01:00", energy: 15.2, cost: 34.32, start_soc: 75, end_soc: 91, reason: "planned", periods: [], charging_minutes: 111, charger: "Garage" },
    ...zoe.history,
  ];
  await withPanel(state, { size: PHONE }, async ({ page, tap, read }) => {
    await tap('.tabs button[data-tab="cars"]');
    await tap(`[data-act="open-car"][data-id="${zoe.id}"]`);
    await tap('[data-act="car-view"][data-view="history"]');
    const rows = await page.evaluate(() => [...window.harness.panel.shadowRoot.querySelectorAll(".car-history .sessions li")].map((li) => ({ cls: li.className, when: li.querySelector(".when b").textContent, nums: li.querySelector(".nums").textContent.trim(), what: li.querySelector(".what span").textContent })));
    assert.equal(rows[0].cls, "elsewhere");
    assert.equal(rows[0].nums, "");
    assert.match(rows[0].what, /Charged elsewhere · 60 % → 80 %/);
    assert.equal(rows[1].when, "8–9");
    assert.match(rows[1].nums, /34/);
    // The car's sub-menu sits just above the tab bar on a phone.
    const [views, bar] = await page.evaluate(() => [".car-views", "nav.tabs"].map((s) => window.harness.panel.shadowRoot.querySelector(s).getBoundingClientRect().toJSON()));
    assert.ok(views.bottom <= bar.top && bar.top - views.bottom < 20, JSON.stringify([views, bar]));
  });
});

test("the week plan's next charges on Home and on a car without a plan of its own", async () => {
  const state = fixture("two-cars");
  const [a, b] = state.vehicles.map((v) => v.id);
  const charge = (start, end, kwh) => ({ start, end, kwh, cost: kwh, price: 1, why: "cheap", level: 80, guess: false, from: 0, to: 1 });
  state.week = {
    start: "2026-11-10T21:00:00+01:00",
    groups: [[a, b]],
    cars: {
      [a]: { charges: [charge("2026-11-13T11:00:00+01:00", "2026-11-13T14:00:00+01:00", 20)], target: 60, steer: true },
      [b]: { charges: [charge("2026-11-14T10:00:00+01:00", "2026-11-14T12:00:00+01:00", 8)], target: 60, steer: true },
    },
  };
  await withPanel(state, { size: DESKTOP }, async ({ page, tap }) => {
    await tap('.tabs button[data-tab="home"]');
    const shown = await page.evaluate(() => {
      const root = window.harness.panel.shadowRoot;
      return { head: root.querySelector(".tonight h2").textContent, rows: root.querySelectorAll(".tonight .tn-row").length, total: root.querySelector(".tonight .hint").textContent };
    });
    // Nothing in the next day: each car's next charge, from the week plan.
    assert.equal(shown.head, "Next charge");
    assert.equal(shown.rows, 2);
    assert.match(shown.total, /28/);
    await tap('.tabs button[data-tab="cars"]');
    const facts = await page.evaluate((id) => window.harness.panel.shadowRoot.querySelector(`.vcard[data-id="${id}"] .mini-facts`).textContent, a);
    assert.match(facts, /Next charge.*11–14/);
  });
});
