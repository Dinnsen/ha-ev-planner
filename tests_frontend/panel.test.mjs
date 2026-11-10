/* The panel with every fixture, on a phone and on a desktop, in Danish and English, light and
   dark: every page is drawn without an error, without anything wider than the screen, and
   without "undefined", "NaN" or a text that was not translated. */

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { DESKTOP, FIXTURES, PHONE, fixture, keepPicture, launch, openPage, serve } from "./lib/setup.mjs";
import { walkPanel } from "./lib/walk.mjs";

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

/* The pages every household has; a household with cars has more. */
const ALWAYS = ["cars", "guest", "history", "history › learned", "settings"];

describe("the panel draws every page", { concurrency: 4 }, () => {
  for (const name of FIXTURES) {
    for (const [device, size] of [["phone", PHONE], ["desktop", DESKTOP]]) {
      for (const lang of ["da", "en"]) {
        for (const dark of [false, true]) {
          const title = `${name}, ${device}, ${lang}, ${dark ? "dark" : "light"}`;
          test(title, async () => {
            const state = fixture(name);
            const { page, context, errors } = await openPage(browser, server.url, { size, lang, dark, now: state.now });
            try {
              await page.evaluate(([s, options]) => window.harness.mountPanel(s, options).then(() => null), [state, { lang, dark }]);
              const result = await page.evaluate(walkPanel, { lang });
              const wrong = [...errors, ...result.problems, ...result.unknown.map((type) => `no answer for ${type}`)];
              if (wrong.length) await keepPicture(page, `panel ${title}`);
              assert.deepEqual(wrong, []);
              for (const view of ALWAYS) assert.ok(result.views.includes(view), `${view} was shown`);
              for (const v of state.vehicles) {
                for (const view of ["now", "rules", "history"]) assert.ok(result.views.includes(`car ${v.id} › ${view}`), `${v.name}: ${view} was shown`);
              }
              if (state.vehicles.length || state.chargers.length) assert.ok(result.views.includes("home"), "home was shown");
            } finally {
              await context.close();
            }
          });
        }
      }
    }
  }
});
