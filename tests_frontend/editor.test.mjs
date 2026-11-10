/* Placing things in the house picture: an administrator moves a charger, draws a wire, puts up
   solar panels and moves a label; what is saved is what was placed, each wire still runs straight,
   and someone who is not an administrator sees no editor. */

import assert from "node:assert/strict";
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

async function withHome(name, options, run) {
  const state = fixture(name);
  if (options.house) state.settings = { ...state.settings, house: options.house };
  const { page, context, errors } = await openPage(browser, server.url, { now: state.now, size: options.size || DESKTOP });
  const inside = (selector) => page.locator(`ev-planner-panel ${selector}`).first();
  // A drag with the mouse in small steps, from the middle of what the selector finds.
  const drag = async (selector, dx, dy) => {
    const box = await inside(selector).boundingBox();
    assert.ok(box, `${selector} is on the page`);
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 6; i += 1) await page.mouse.move(x + (dx * i) / 6, y + (dy * i) / 6);
    await page.mouse.up();
  };
  const layouts = () => page.evaluate((t) => window.harness.calls.filter((c) => c.type === t).map((c) => c.layout), `${DOMAIN}/layout`);
  try {
    await page.evaluate(([s, admin]) => window.harness.mountPanel(s, { lang: "en", admin }).then(() => null), [state, options.admin !== false]);
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector(".tabs button"));
    await inside('.tabs button[data-tab="home"]').click();
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector(".cscene .cs-wire"));
    await run({ page, inside, drag, layouts, state });
    assert.deepEqual(errors, [], "nothing in the console");
    assert.deepEqual(await page.evaluate(() => window.harness.unknown), [], "every command had an answer");
  } catch (err) {
    await keepPicture(page, `editor ${err.message.slice(0, 40)}`);
    throw err;
  } finally {
    await context.close();
  }
}

// Each stretch of a wire runs along one direction: a wire never runs crooked off the roof.
function straight(route) {
  return route.slice(1).every((q, i) => {
    const p = route[i];
    const moves = [0, 1, 2].filter((k) => Math.abs(p[k] - q[k]) > 0.005).length;
    return moves === 1 || (moves > 1 && Math.max(p[2], q[2]) > 2);
  });
}

test("an administrator moves a charger and draws a wire; what was placed is saved", async () => {
  await withHome("shared-supply", {}, async ({ page, inside, drag, layouts }) => {
    await inside(".cs-editbtn").click();
    await page.waitForFunction(() => window.harness.panel.shadowRoot.querySelector(".cs-bar .cs-tabs"));
    await drag('.cs-hit[data-thing="charger0"]', -40, -10);
    // The wire to the charger follows it, straight.
    const route = await page.evaluate(() => window.harness.panel._scene.routes.car0);
    assert.ok(straight(route), `the charger's wire runs straight: ${JSON.stringify(route)}`);
    await inside('[data-ed="tab"][data-tab="wires"]').click();
    await drag('.cs-grip[data-wire="grid"]', 0, 30);
    await inside('[data-ed="save"]').click();
    await page.waitForFunction(() => !window.harness.panel.shadowRoot.querySelector(".cs-bar"));
    const [saved] = await layouts();
    const own = saved.classic || saved.angle;
    assert.ok(own.things.charger0, "the charger's place is saved");
    assert.equal(own.things.charger0.w, "s1", "on the garage's wall");
    assert.ok(own.wires.grid && straight(own.wires.grid), "the wire someone drew is saved, straight");
    // Shown as it was saved, and the editor is closed.
    const shown = await page.evaluate(() => window.harness.panel._scene.routes.grid);
    assert.deepEqual(shown[1].map((v) => Math.round(v * 100) / 100), own.wires.grid[1]);
  });
});

test("solar panels are put up and taken down by tapping the roof; labels are moved out of the way", async () => {
  await withHome("shared-supply", { size: PHONE }, async ({ page, inside, drag, layouts }) => {
    const solar = await page.evaluate(() => !!window.harness.panel._scene.model.solar);
    await inside(".cs-editbtn").click();
    if (solar) {
      await inside('[data-ed="tab"][data-tab="panels"]').click();
      const count = () => page.evaluate(() => window.harness.panel.shadowRoot.querySelectorAll(".cs-cell.on").length);
      // A place on the roof that can be tapped where it is seen: on (a panel) or off.
      const tapCell = async (on) => {
        const point = await page.evaluate((wanted) => {
          const root = window.harness.panel.shadowRoot;
          for (const cell of root.querySelectorAll(".cs-cell")) {
            if (cell.classList.contains("on") !== wanted) continue;
            const r = cell.getBoundingClientRect();
            const x = r.left + r.width / 2;
            const y = r.top + r.height / 2;
            if (root.elementFromPoint(x, y) === cell) return [x, y];
          }
          return null;
        }, on);
        assert.ok(point, "a place on the roof to tap");
        await page.mouse.click(point[0], point[1]);
      };
      const before = await count();
      await tapCell(true);
      assert.equal(await count(), before - 1, "a panel taken down");
      await tapCell(false);
      await tapCell(false);
      assert.equal(await count(), before + 1, "two put up");
    }
    await inside('[data-ed="tab"][data-tab="labels"]').click();
    await drag('.cs-label[data-key="home"]', -30, -40);
    await inside('[data-ed="save"]').click();
    await page.waitForFunction(() => !window.harness.panel.shadowRoot.querySelector(".cs-bar"));
    const [saved] = await layouts();
    const own = saved.classic || saved.angle;
    assert.ok(Array.isArray(own.labels.home), "the label's place is saved");
    if (solar) assert.ok(Array.isArray(own.panels.roof), "the panels are saved");
  });
});

test("on a phone the labels stay where they are in the picture while it is edited, and can be dragged by touch", async () => {
  await withHome("shared-supply", { size: PHONE, house: "angle" }, async ({ page, inside, layouts }) => {
    const labels = () => page.evaluate(() => [...window.harness.panel.shadowRoot.querySelectorAll(".cs-label")].map((l) => {
      const r = l.getBoundingClientRect();
      return [l.dataset.key, Math.round(r.x), Math.round(r.y), Math.round(r.bottom)];
    }));
    const before = await labels();
    await inside(".cs-editbtn").click();
    const editing = await labels();
    assert.deepEqual(editing.map(([k, x, y]) => [k, x, y]), before.map(([k, x, y]) => [k, x, y]), "the labels do not move when the editor opens");
    const bar = await page.evaluate(() => window.harness.panel.shadowRoot.querySelector(".cs-bar").getBoundingClientRect().top);
    for (const [key, , , bottom] of editing) assert.ok(bottom <= bar + 1, `${key} lies in the picture, not on the editor's bar`);
    await inside('[data-ed="tab"][data-tab="labels"]').click();
    // A finger on the label of the grid, moved down and to the left.
    const box = await inside('.cs-label[data-key="grid"]').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i += 1) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 4 * i, y: y + 3 * i }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const moved = await labels();
    const at = (list) => list.find(([k]) => k === "grid");
    assert.ok(Math.abs(at(moved)[1] - (at(editing)[1] - 32)) <= 3, "the label follows the finger");
    await inside('[data-ed="save"]').click();
    await page.waitForFunction(() => !window.harness.panel.shadowRoot.querySelector(".cs-bar"));
    const [saved] = await layouts();
    assert.ok(Array.isArray(saved.angle.labels.grid), "the label's place is saved");
    const after = await labels();
    assert.deepEqual(at(after).slice(0, 3), at(moved).slice(0, 3), "and it stays there after saving");
  });
});

test("undo and cancel leave the house as it was", async () => {
  await withHome("shared-supply", { house: "angle" }, async ({ page, inside, drag, layouts }) => {
    const drawn = () => page.evaluate(() => JSON.stringify([window.harness.panel._scene.routes, window.harness.panel._scene.pos.gateway]));
    const before = await drawn();
    await inside(".cs-editbtn").click();
    await drag('.cs-hit[data-thing="gateway"]', 60, 0);
    await inside('[data-ed="undo"]').click();
    assert.deepEqual(await page.evaluate(() => window.harness.panel._scene.edit.layout), {});
    await drag('.cs-hit[data-thing="gateway"]', 60, 0);
    await inside('[data-ed="cancel"]').click();
    assert.deepEqual(await layouts(), [], "nothing was saved");
    assert.equal(await page.evaluate(() => window.harness.panel._scene.edit), null);
    assert.equal(await drawn(), before, "the house is drawn as before");
  });
});

test("someone who is not an administrator sees no editor", async () => {
  await withHome("shared-supply", { admin: false }, async ({ page }) => {
    assert.equal(await page.evaluate(() => window.harness.panel.shadowRoot.querySelectorAll(".cs-editbtn").length), 0);
  });
});
