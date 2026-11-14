/* The dashboard cards: loading them costs little (the panel's code is fetched when the first
   card is shown, not before), and each card draws with a household's state. */

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { DESKTOP, PHONE, fixture, keepPicture, launch, openPage, serve } from "./lib/setup.mjs";

const DOMAIN = "ev_household_planner";
const PANEL = "/frontend/ev-planner-panel.js?v=test";
const CARDS = "/frontend/ev-planner-cards.js?v=test";
const TAGS = ["household", "car", "car-large", "guest", "charger", "bubble", "climate", "climate-tile", "climate-bubble", "learning", "place"].map((kind) => `ev-planner-${kind}-card`);

/* Every card, as a dashboard would configure it for the two-cars household. */
const CONFIGS = [
  ["ev-planner-household-card", {}, "Tesla Model Y"],
  ["ev-planner-car-card", { vehicle: "tesla_model_y" }, "Tesla Model Y"],
  ["ev-planner-car-large-card", { vehicle: "renault_zoe" }, "Renault Zoe"],
  ["ev-planner-guest-card", {}, null],
  ["ev-planner-charger-card", { charger: "garage" }, "Garage"],
  ["ev-planner-bubble-card", { vehicle: "tesla_model_y" }, "Tesla Model Y"],
  ["ev-planner-bubble-card", { charger: "garage", name: "Wallbox" }, "Wallbox"],
  ["ev-planner-bubble-card", { guest: true }, null],
  ["ev-planner-car-card", { vehicle: "sold_last_year" }, "sold_last_year"],
  ["ev-planner-climate-card", { vehicle: "tesla_model_y" }, "Tesla Model Y"],
  ["ev-planner-climate-tile-card", { vehicle: "tesla_model_y" }, "Tesla Model Y"],
  ["ev-planner-climate-bubble-card", { vehicle: "tesla_model_y" }, "Tesla Model Y"],
  ["ev-planner-learning-card", { vehicle: "tesla_model_y" }, null],
  ["ev-planner-place-card", {}, null],
];

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

async function withPage(options, run) {
  const state = fixture("two-cars");
  // The Tesla's climate is on, for the climate cards.
  state.vehicles.find((v) => v.id === "tesla_model_y").climate = { entity: "climate.tesla_model_y", on: true, started_at: null, inside: 14.5, outside: 6 };
  const opened = await openPage(browser, server.url, { now: state.now, ...options });
  try {
    await run({ ...opened, state });
    assert.deepEqual(opened.errors, [], "nothing in the console");
  } catch (err) {
    await keepPicture(opened.page, `cards ${err.message.slice(0, 40)}`);
    throw err;
  } finally {
    await opened.context.close();
  }
}

/* Runs in the page: all the cards on the page, drawn. */
async function mountAll([state, configs, lang]) {
  const harness = window.harness;
  await harness.loadCards();
  harness.makeHass(state, { lang });
  const cards = configs.map(([type, config]) => harness.mountCard(type, config));
  for (let i = 0; i < 200 && cards.some((card) => !card.shadowRoot.querySelector("ha-card").childElementCount); i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  return cards.map((card) => card.shadowRoot.querySelector("ha-card").childElementCount);
}

test("loading the cards does not fetch the panel; the first card on the page does", async () => {
  await withPage({}, async ({ page, requests, state }) => {
    const before = await page.evaluate(async (tags) => {
      await window.harness.loadCards();
      return {
        defined: [...tags, "ev-planner-dialog", "ev-planner-card-editor"].filter((tag) => customElements.get(tag)),
        panel: Boolean(customElements.get("ev-planner-panel")),
        picker: window.customCards,
      };
    }, TAGS);
    // Registered at once, for dashboards and for the card picker.
    assert.deepEqual(before.defined, [...TAGS, "ev-planner-dialog", "ev-planner-card-editor"]);
    assert.deepEqual(before.picker.map((card) => card.type), TAGS);
    for (const card of before.picker) {
      assert.match(card.name, /^EV Planner – \S/);
      assert.ok(card.description.length > 10 && card.preview === true, `${card.type} is described`);
    }
    assert.ok(requests.includes(CARDS));
    assert.deepEqual(requests.filter((path) => path.includes("ev-planner-panel")), [], "the panel was not fetched with the cards");
    assert.equal(before.panel, false);

    // A card that is made and configured, but not on a page, still costs nothing.
    const made = await page.evaluate(async (s) => {
      window.harness.makeHass(s);
      const card = document.createElement("ev-planner-car-card");
      card.setConfig({ type: "custom:ev-planner-car-card", vehicle: "tesla_model_y" });
      card.hass = window.harness.hass;
      window.pending = card;
      const stub = await customElements.get("ev-planner-bubble-card").getStubConfig(window.harness.hass);
      let refused = "";
      try {
        card.setConfig({ type: "custom:ev-planner-car-card" });
      } catch (err) {
        refused = err.message;
      }
      return { size: card.getCardSize(), stub, refused, editor: customElements.get("ev-planner-car-card").getConfigElement().localName };
    }, state);
    assert.deepEqual(made, { size: 3, stub: { vehicle: "renault_zoe" }, refused: "Choose a car (vehicle)", editor: "ev-planner-card-editor" });
    assert.deepEqual(requests.filter((path) => path.includes("ev-planner-panel")), []);

    // On the page: now the panel's code comes, once, from the address the panel itself uses.
    await page.evaluate(() => {
      window.pending.setConfig({ type: "custom:ev-planner-car-card", vehicle: "tesla_model_y" });
      document.body.appendChild(window.pending);
      document.body.appendChild(document.createElement("ev-planner-guest-card")).hass = window.harness.hass;
    });
    await page.waitForFunction(() => window.pending.shadowRoot.querySelector("ha-card .evc"), null, { timeout: 5000 });
    assert.deepEqual(requests.filter((path) => path.includes("ev-planner-panel")), [PANEL]);
    assert.match(await page.evaluate(() => window.pending.shadowRoot.textContent), /Tesla Model Y/);
  });
});

describe("every card draws", { concurrency: 4 }, () => {
  for (const [device, size] of [["phone", PHONE], ["desktop", DESKTOP]]) {
    for (const lang of ["da", "en"]) {
      test(`${device}, ${lang}`, async () => {
        await withPage({ size, lang }, async ({ page, state }) => {
          const drawn = await page.evaluate(mountAll, [state, CONFIGS, lang]);
          assert.ok(drawn.every((count) => count > 0), `every card has content: ${drawn.join()}`);
          const seen = await page.evaluate(async ([tags, lang]) => {
            const harness = window.harness;
            const { TEXT } = await harness.loadPanel();
            const keys = new Set(Object.keys({ ...TEXT.en, ...TEXT.da }).filter((key) => TEXT[lang][key] !== key));
            const problems = [];
            const cards = [...document.querySelectorAll(tags.join(","))];
            for (const card of cards) {
              const name = `${card.localName} ${JSON.stringify(card._config)}`;
              for (const { text, where } of harness.texts(card)) {
                if (/\bundefined\b|\bNaN\b|\bnull\b|\[object /.test(text)) problems.push(`${name}: "${text}" (${where})`);
                else if (keys.has(text)) problems.push(`${name}: not translated: "${text}"`);
              }
              for (const attribute of harness.brokenAttributes(card)) problems.push(`${name}: ${attribute}`);
              const inner = card.shadowRoot.querySelector("ha-card");
              // The household card scrolls sideways when the line is long; nothing else is wider than its card.
              if (inner.scrollWidth > inner.clientWidth + 1) problems.push(`${name}: ${inner.scrollWidth}px of content in ${inner.clientWidth}px`);
              if (card.shadowRoot.querySelector(".evc-loading")) problems.push(`${name}: still loading`);
            }
            const page = document.scrollingElement;
            if (page.scrollWidth > page.clientWidth) problems.push(`the document is ${page.scrollWidth}px wide in a ${page.clientWidth}px window`);
            return { problems, texts: cards.map((card) => card.shadowRoot.textContent.replace(/\s+/g, " ").trim()), subscriptions: harness.calls.filter((c) => c.type.endsWith("/subscribe")).length };
          }, [TAGS, lang]);
          assert.deepEqual(seen.problems, []);
          CONFIGS.forEach(([type, , expected], i) => {
            if (expected) assert.ok(seen.texts[i].includes(expected), `${type} shows "${expected}": ${seen.texts[i].slice(0, 120)}`);
          });
          assert.match(seen.texts[1], /27 %/);
          assert.match(seen.texts[5], /27 % → 90 %/);
          // All cards on a page share one connection to EV Planner.
          assert.equal(seen.subscriptions, 1);
        });
      });
    }
  }
});

test("the Bubble card's menu sets the mode, and a tap on a card opens the car in a pop-up", async () => {
  await withPage({ size: PHONE }, async ({ page, state }) => {
    await page.evaluate(mountAll, [state, CONFIGS, "en"]);
    await page.locator('ev-planner-bubble-card [data-act="bub-modes"]').click();
    await page.locator('ev-planner-bubble-card .bub-menu [data-mode="charge_now"]').click();
    await page.waitForFunction((type) => window.harness.calls.some((c) => c.type === type), `${DOMAIN}/vehicle_set`, { timeout: 5000 });
    assert.deepEqual(
      await page.evaluate((type) => window.harness.calls.filter((c) => c.type === type), `${DOMAIN}/vehicle_set`),
      [{ type: `${DOMAIN}/vehicle_set`, vehicle_id: "tesla_model_y", settings: { mode: "charge_now" }, entry_id: state.entry_id }],
    );

    await page.locator("ev-planner-car-card .evc").first().click();
    await page.waitForFunction(() => document.querySelector("ev-planner-dialog")?.shadowRoot.querySelector("ev-planner-panel")?.shadowRoot.querySelector(".car-page"), null, { timeout: 5000 });
    const popup = await page.evaluate(() => {
      const dialog = document.querySelector("ev-planner-dialog");
      const panel = dialog.shadowRoot.querySelector("ev-planner-panel");
      return { id: panel.shadowRoot.querySelector(".car-page").dataset.id, embed: panel.hasAttribute("embed"), link: dialog.shadowRoot.querySelector("a.open").getAttribute("href") };
    });
    assert.deepEqual(popup, { id: "tesla_model_y", embed: true, link: "/ev-planner/car/tesla_model_y" });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector("ev-planner-dialog").hidden === true, null, { timeout: 5000 });
  });
});

test("the pop-up and the card editor fetch the panel themselves when no card has", async () => {
  await withPage({ lang: "da" }, async ({ page, requests, state }) => {
    const result = await page.evaluate(async (s) => {
      const harness = window.harness;
      // Home Assistant's form, which is not here: it only keeps what the editor gives it.
      customElements.define("ha-form", class extends HTMLElement {});
      await harness.loadCards();
      harness.makeHass(s, { lang: "da" });
      const editor = document.body.appendChild(document.createElement("ev-planner-card-editor"));
      editor.setConfig({ type: "custom:ev-planner-car-card", vehicle: "tesla_model_y" });
      editor.hass = harness.hass;
      const early = Boolean(customElements.get("ev-planner-panel"));
      for (let i = 0; i < 200 && !(editor.querySelector("ha-form")?.schema?.[0]?.selector.select.options.length); i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
      const form = editor.querySelector("ha-form");
      const changed = new Promise((resolve) => editor.addEventListener("config-changed", (ev) => resolve(ev.detail.config), { once: true }));
      form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { vehicle: "renault_zoe", name: "", tap_action: "popup" } } }));

      const dialog = document.body.appendChild(document.createElement("ev-planner-dialog"));
      dialog.showDialog({ view: "guest", title: "Gæst", hass: harness.hass });
      for (let i = 0; i < 200 && !dialog.shadowRoot.querySelector("ev-planner-panel")?.shadowRoot.querySelector(".guest-page"); i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        early,
        fields: form.schema.map((item) => item.name),
        cars: form.schema[0].selector.select.options,
        labels: form.schema.map((item) => form.computeLabel(item)),
        data: form.data,
        changed: await changed,
        guest: Boolean(dialog.shadowRoot.querySelector("ev-planner-panel")?.shadowRoot.querySelector(".guest-page")),
        open: dialog.shadowRoot.querySelector("a.open")?.textContent,
      };
    }, state);
    assert.equal(result.early, false, "the editor was made before the panel was fetched");
    assert.deepEqual(result.fields, ["vehicle", "name", "tap_action"]);
    assert.deepEqual(result.cars, [{ value: "renault_zoe", label: "Renault Zoe" }, { value: "tesla_model_y", label: "Tesla Model Y" }]);
    assert.deepEqual(result.labels, ["Bil", "Navn (valgfrit)", "Tryk på kortet"]);
    assert.equal(result.data.vehicle, "tesla_model_y");
    assert.deepEqual(result.changed, { type: "custom:ev-planner-car-card", vehicle: "renault_zoe" });
    assert.equal(result.guest, true, "the pop-up shows the guest page");
    assert.match(result.open, /Åbn i EV Planner/);
    assert.deepEqual(requests.filter((path) => path.includes("ev-planner-panel")), [PANEL]);
  });
});
