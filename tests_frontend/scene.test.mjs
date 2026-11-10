/* The house on the Home tab (ClayScene): both houses, with and without solar panels, a home
   battery and a heat pump, with no, one or two chargers, and with no, one or two cars in every
   state. Each picture must build, with whole numbers in every line, a cable for each car that
   is plugged in, a rolled-up cable on each free charger, and every label inside the picture
   where it can be read. */

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { launch, openPage, serve } from "./lib/setup.mjs";

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

/* Runs in the test page: builds every picture of one house at one width; returns {count, problems}. */
async function buildAll({ house, width }) {
  const harness = window.harness;
  const { _ClayScene: ClayScene, STYLE } = await harness.loadPanel();
  // The picture inside a shadow root with the panel's own style, as on the Home tab.
  const host = document.body.appendChild(document.createElement("div"));
  host.style.width = `${width}px`;
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${STYLE}</style><section class="panel home-flow"><div class="scene-slot"></div></section>`;
  const slot = root.querySelector(".scene-slot");

  const STATES = {
    unplugged: { plugged: false, charging: false, status: "unplugged", label: "64 %" },
    charging: { plugged: true, charging: true, status: "charging", label: "27 % · 10.8 kW" },
    planned: { plugged: true, charging: false, status: "planned", label: "61 % · Starts 22:00" },
    completed: { plugged: true, charging: false, status: "completed", label: "80 % · Done" },
    waiting: { plugged: true, charging: false, status: "no_plan", label: "55 %" },
  };
  const names = Object.keys(STATES);
  // No car, one car on either charger, two cars on a charger each, crossed over, or on the same one.
  const line = [[]];
  for (const a of names) for (const box of [0, 1]) line.push([[a, box]]);
  for (const a of names) for (const b of names) for (const boxes of [[0, 1], [1, 0], [0, 0]]) line.push([[a, boxes[0]], [b, boxes[1]]]);

  const problems = [];
  const overlaps = [];
  let covered = 0;
  let count = 0;
  for (const solar of [false, true]) for (const battery of [false, true]) for (const heat of [false, true]) for (const chargers of [0, 1, 2]) {
    for (const cars of line) {
      count += 1;
      const what = `${house} ${width}px, ${[solar && "solar", battery && "battery", heat && "heat pump"].filter(Boolean).join("+") || "plain"}, ${chargers} chargers, cars: ${cars.map(([s, box]) => `${s}@${box}`).join(" ") || "none"}`;
      const flows = { sun: solar ? 3.2 : 0, battery: battery ? (count % 2 ? 1.1 : -0.8) : 0, home: 1.4, grid: count % 3 ? -4.6 : 2.2, heat: heat ? 1.8 : 0 };
      const labels = [];
      if (heat) labels.push({ key: "heat", title: "Heat pump", value: "1.8 kW", short: "1.8 kW", on: true });
      if (solar) labels.push({ key: "sun", title: "Solar", value: "3.2 kW", short: "3.2 kW", on: true });
      labels.push({ key: "home", title: "The house", value: "1.4 kW", short: "1.4 kW", on: true });
      if (battery) labels.push({ key: "battery", title: "Battery", value: "62 % · charging 1.1 kW", short: "62 %", on: true, bar: 62 });
      labels.push({ key: "grid", title: "The grid", value: "Buying 4.6 kW", short: "4.6 kW", on: true, colour: "#3B8BFF", icon: "grid", dir: "in" });
      const model = {
        house,
        light: count % 2,
        solar: solar ? { kw: 3.2 } : null,
        battery: battery ? { kw: flows.battery, soc: 62 } : null,
        heat: heat ? { kw: 1.8 } : null,
        chargers: Array.from({ length: chargers }, (_, i) => ({ id: `charger${i}`, name: `Charger ${i + 1}` })),
        cars: cars.map(([state, box], i) => ({
          id: `car${i}`, image: null, body: ClayScene.BODIES[(count + i) % ClayScene.BODIES.length], paint: (count + i) % 2 ? "black" : "white",
          plugged: STATES[state].plugged, charging: STATES[state].charging, status: STATES[state].status, charger: box,
        })),
        flows,
        labels,
      };
      cars.forEach(([state], i) => {
        flows[`car${i}`] = STATES[state].charging ? 10.8 : 0;
        labels.push({ key: `car${i}`, title: `Car ${i + 1}`, value: STATES[state].label, short: STATES[state].label, on: STATES[state].charging, colour: "#22C981", bar: 50 });
      });

      const fail = (text) => problems.length < 40 && problems.push(`${what}: ${text}`);
      let scene;
      try {
        // A new picture each time, as when the panel is opened.
        scene = new ClayScene();
        slot.replaceChildren(scene.el);
        scene.update(model);
      } catch (err) {
        fail(`does not build: ${err.message}`);
        continue;
      }
      const el = scene.el;
      for (const attribute of harness.brokenAttributes(el)) fail(attribute);

      // The wires: one for each thing the house has, each a line of whole numbers.
      const wanted = ["grid", solar && "sun", heat && "heat", battery && "battery", ...Array.from({ length: chargers }, (_, i) => `car${i}`)].filter(Boolean).sort();
      const wires = [...el.querySelectorAll(".cs-wire")];
      const got = wires.map((w) => w.dataset.route).sort();
      if (got.join() !== wanted.join()) fail(`wires ${got.join()} and not ${wanted.join()}`);
      for (const path of el.querySelectorAll(".cs-wire path, .cs-cable path, .cs-coil path, .cs-leaders path")) {
        const d = path.getAttribute("d") || "";
        const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
        if (numbers.length < 4 || !numbers.every((n) => Number.isFinite(Number(n))) || /[^MLCQSTHVAZmlcqsthvaz\d\s.,e+-]/.test(d)) fail(`a path is not a line: "${d.slice(0, 60)}"`);
        else if (path.getTotalLength() <= 0) fail(`a path has no length: "${d.slice(0, 60)}"`);
      }

      // The cables: the first car to stand at a charger is plugged into it, when it is plugged in at all.
      const holder = {};
      cars.forEach(([state, box], i) => {
        if (box < chargers && !(box in holder)) holder[box] = STATES[state].plugged ? i : -1;
      });
      for (let box = 0; box < 2; box += 1) {
        const cable = el.querySelectorAll(`.cs-cable[data-i="${box}"]`).length;
        const coil = el.querySelectorAll(`.cs-coil[data-i="${box}"]`).length;
        const plugged = box < chargers && holder[box] >= 0;
        if (cable !== (plugged ? 1 : 0)) fail(`charger ${box} has ${cable} cables to a car, expected ${plugged ? 1 : 0}`);
        if (coil !== (box < chargers && !plugged ? 1 : 0)) fail(`charger ${box} has ${coil} rolled-up cables, expected ${box < chargers && !plugged ? 1 : 0}`);
      }
      if (el.querySelectorAll(".cs-charger").length !== chargers) fail(`${el.querySelectorAll(".cs-charger").length} chargers drawn`);
      if (el.querySelectorAll(".cs-car").length !== cars.length) fail(`${el.querySelectorAll(".cs-car").length} cars drawn`);

      // The labels: one for each, inside the picture.
      const frame = el.getBoundingClientRect();
      if (frame.width < 100 || frame.height < 100) fail(`the picture is ${frame.width}x${frame.height}`);
      const shown = [...el.querySelectorAll(".cs-label")];
      if (shown.length !== labels.length) fail(`${shown.length} labels for ${labels.length} things`);
      const boxes = shown.map((label) => label.getBoundingClientRect());
      const value = (label) => label.querySelector(".cs-v").textContent;
      let hidden = false;
      boxes.forEach((a, i) => {
        for (let j = 0; j < i; j += 1) {
          const b = boxes[j];
          const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          // A few pixels of each other's rounded ends hide nothing.
          if (across <= 6 || down <= 4) continue;
          hidden = true;
          if (overlaps.length < 3) overlaps.push(`${what}: "${value(shown[j])}" (${shown[j].dataset.key}) and "${value(shown[i])}" (${shown[i].dataset.key}) cover each other by ${Math.round(across)}x${Math.round(down)}px`);
        }
      });
      if (hidden) covered += 1;
      for (const label of shown) {
        const box = label.getBoundingClientRect();
        if (box.left < frame.left - 0.5 || box.right > frame.right + 0.5 || box.top < frame.top - 0.5 || box.bottom > frame.bottom + 0.5) {
          fail(`the label "${value(label)}" (${label.dataset.key}) sticks out: ${Math.round(box.left - frame.left)}..${Math.round(box.right - frame.left)} of ${Math.round(frame.width)} across, ${Math.round(box.top - frame.top)}..${Math.round(box.bottom - frame.top)} of ${Math.round(frame.height)} down`);
        }
      }
    }
  }
  host.remove();
  return { count, problems, overlaps, covered };
}

/* Known, and not fixed yet: on a narrow screen the angle house's labels for the grid and the cars
   are put on top of each other (the classic house keeps them apart at every width). */

describe("the house's picture", { concurrency: 2 }, () => {
  for (const house of ["classic", "angle"]) {
    // As wide as on a phone and as on a desktop.
    for (const width of [366, 900]) {
      test(`${house} at ${width}px: every combination builds`, async (t) => {
        const { page, context, errors } = await openPage(browser, server.url);
        let result;
        try {
          result = await page.evaluate(buildAll, { house, width });
        } finally {
          await context.close();
        }
        assert.deepEqual([...errors, ...result.problems], []);
        assert.equal(result.count, 8 * 3 * (1 + 10 + 75), "every combination was built");
        await t.test("no label covers another", () => {
          assert.equal(result.covered, 0, `in ${result.covered} of ${result.count} pictures, the first: ${result.overlaps[0]}`);
        });
      });
    }
  }
});
