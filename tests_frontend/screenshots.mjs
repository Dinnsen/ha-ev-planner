/* The pictures of the panel in the README: writes docs/images/panel-*.png from the tests' own
   page and fixtures, so they always show the panel as it is.

   Run it with:  node tests_frontend/screenshots.mjs */

import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { DESKTOP, PHONE, ROOT, fixture, launch, openPage, serve } from "./lib/setup.mjs";

const OUT = join(ROOT, "docs", "images");

/* file, fixture, language, size, the taps that lead to the page, and changes to the state. */
const SHOTS = [
  { file: "panel-home-da.png", state: "shared-supply", lang: "da", taps: ['.tabs button[data-tab="home"]'] },
  { file: "panel-home-en.png", state: "shared-supply", lang: "en", taps: ['.tabs button[data-tab="home"]'] },
  { file: "panel-car-da.png", state: "two-cars", lang: "da", taps: ['.tabs button[data-tab="cars"]', '[data-act="open-car"][data-id="tesla_model_y"]'] },
  { file: "panel-car-en.png", state: "two-cars", lang: "en", taps: ['.tabs button[data-tab="cars"]', '[data-act="open-car"][data-id="tesla_model_y"]'] },
  { file: "panel-history-en.png", state: "two-cars", lang: "en", taps: ['.tabs button[data-tab="history"]'] },
  { file: "panel-home-angle-en.png", state: "shared-supply", lang: "en", taps: ['.tabs button[data-tab="home"]'], change: (s) => (s.settings.house = "angle") },
  { file: "panel-home-desktop-en.png", state: "shared-supply", lang: "en", size: DESKTOP, scale: 1, taps: ['.tabs button[data-tab="home"]'] },
];

mkdirSync(OUT, { recursive: true });
const browser = await launch();
const server = await serve();
let failed = false;
try {
  for (const shot of SHOTS) {
    const state = fixture(shot.state);
    shot.change?.(state);
    const { page, context, errors } = await openPage(browser, server.url, {
      size: shot.size || PHONE,
      scale: shot.scale || 2,
      lang: shot.lang,
      now: state.now,
      motion: true,
    });
    await page.evaluate(([s, lang]) => window.harness.mountPanel(s, { lang }).then(() => null), [state, shot.lang]);
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector(".tabs button"));
    for (const tap of shot.taps) await page.locator(`ev-planner-panel ${tap}`).first().click();
    // The clock sweeps in, the numbers count up and the bars grow: wait until all is still.
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(OUT, shot.file) });
    console.log(`${shot.file}${errors.length ? `  ! ${errors.join("; ")}` : ""}`);
    failed ||= errors.length > 0;
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
if (failed) process.exitCode = 1;
