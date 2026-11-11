/* What every test file needs: Playwright, one Chromium, a small web server for the test page
   and the frontend, and pages with the clock, the language and the size set. */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
export const ROOT = dirname(HERE);
export const FRONTEND = join(ROOT, "custom_components", "ev_household_planner", "frontend");
export const FAILURES = join(HERE, "failures");

export const PHONE = { width: 390, height: 844 };
export const DESKTOP = { width: 1280, height: 800 };
export const FIXTURES = ["empty", "two-cars", "two-chargers", "shared-supply", "guest-charging", "trouble"];

export function fixture(name) {
  return JSON.parse(readFileSync(join(HERE, "fixtures", `${name}.json`), "utf8"));
}

/* Playwright from node_modules (npm ci), else the one installed for the whole machine. */
async function loadPlaywright() {
  // Browsers that are already on the machine, where there are any.
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync("/opt/pw-browsers")) process.env.PLAYWRIGHT_BROWSERS_PATH = "/opt/pw-browsers";
  try {
    return await import("playwright");
  } catch {
    const roots = (process.env.NODE_PATH || "").split(":").filter(Boolean);
    try {
      roots.push(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim());
    } catch {
      /* no npm: NODE_PATH alone */
    }
    const found = createRequire(import.meta.url).resolve("playwright", { paths: roots });
    const module = await import(pathToFileURL(found).href);
    return module.default?.chromium ? module.default : module;
  }
}

export async function launch() {
  const { chromium } = await loadPlaywright();
  return chromium.launch({ headless: true });
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml",
};

/* Serves this directory at / and the integration's frontend at /frontend/. Returns {url, close}. */
export async function serve() {
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const [base, rest] = path.startsWith("/frontend/") ? [FRONTEND, path.slice("/frontend/".length)] : [HERE, path.slice(1) || "harness.html"];
    const file = normalize(join(base, rest));
    if (!file.startsWith(base + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(body);
    } catch {
      response.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/* The test page in a window of its own: {page, context, errors, requests}. `errors` collects what the
   console and the page complain about, `requests` the path (and query) of everything the page fetches.
   `now` freezes the clock at a fixture's moment, so the plans and prices are always "tonight". */
export async function openPage(browser, url, { size = DESKTOP, lang = "en", dark = false, now = null, scale = 1, motion = false } = {}) {
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: scale,
    isMobile: size.width < 600,
    hasTouch: size.width < 600,
    locale: lang === "da" ? "da-DK" : "en-GB",
    timezoneId: "Europe/Copenhagen",
    colorScheme: dark ? "dark" : "light",
    // In the tests the page stands still: nothing is caught halfway through a movement.
    reducedMotion: motion ? "no-preference" : "reduce",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()} (${message.location().url || ""})`);
  });
  page.on("pageerror", (error) => errors.push(`uncaught: ${error.stack || error.message}`));
  page.on("requestfailed", (request) => errors.push(`failed: ${request.url()}`));
  page.on("request", (request) => requests.push(new URL(request.url()).pathname + new URL(request.url()).search));
  if (now) await page.clock.setFixedTime(new Date(now));
  await page.goto(`${url}/harness.html`);
  await page.waitForFunction(() => window.harnessReady === true);
  return { page, context, errors, requests };
}

/* A picture of the page for the report of a failed run (uploaded by the workflow). */
export async function keepPicture(page, name) {
  try {
    mkdirSync(FAILURES, { recursive: true });
    await page.screenshot({ path: join(FAILURES, `${name.replace(/[^\w.-]+/g, "_")}.png`), fullPage: false });
  } catch {
    /* the page is gone */
  }
}

/* Run `work` over `items`, a few at a time. */
export async function pool(items, size, work) {
  const queue = [...items];
  const results = [];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        results.push(await work(item));
      }
    }),
  );
  return results;
}
