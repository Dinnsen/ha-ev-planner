/* Runs in the test page: goes through every page of the panel and looks at each one.
   Returns {views, problems, unknown}: the pages seen, what was wrong with them, and the
   commands the stand-in Home Assistant could not answer. */

export async function walkPanel({ lang }) {
  const harness = window.harness;
  const panel = harness.panel;
  const root = panel.shadowRoot;
  const { TEXT } = await harness.loadPanel();
  // A text that is shown as its own key was not translated.
  const keys = new Set(Object.keys({ ...TEXT.en, ...TEXT.da }).filter((key) => TEXT[lang][key] !== key));
  const views = [];
  const problems = [];
  // Long enough for an answer from "Home Assistant" to be drawn.
  const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

  const check = async (view) => {
    await settle();
    views.push(view);
    for (const { text, where } of harness.texts(panel)) {
      if (/\bundefined\b|\bNaN\b|\bnull\b|\[object /.test(text)) problems.push(`${view}: "${text.slice(0, 80)}" (${where})`);
      else if (keys.has(text)) problems.push(`${view}: not translated: "${text}" (${where})`);
    }
    for (const attribute of harness.brokenAttributes(panel)) problems.push(`${view}: ${attribute}`);
    const page = document.scrollingElement;
    if (page.scrollWidth > page.clientWidth) problems.push(`${view}: the document is ${page.scrollWidth}px wide in a ${page.clientWidth}px window`);
    const content = root.querySelector(".content");
    if (content.scrollWidth > content.clientWidth) problems.push(`${view}: the page is ${content.scrollWidth}px wide in ${content.clientWidth}px`);
  };

  const click = (selector) => {
    const el = root.querySelector(selector);
    if (!el) {
      problems.push(`${views.at(-1) || "start"}: nothing to tap at ${selector}`);
      return false;
    }
    el.click();
    return true;
  };
  const values = (selector, name) => [...root.querySelectorAll(selector)].map((el) => el.dataset[name]);
  const tab = (name) => click(`.tabs button[data-tab="${name}"]`);
  // Every tile on the page: open its sheet, look, and close it again.
  const tiles = async (view) => {
    for (const tile of values('[data-act="tile"]', "tile")) {
      if (!click(`[data-act="tile"][data-tile="${tile}"]`)) continue;
      await check(`${view} › ${tile}`);
      click('[data-act="sheet-close"][data-f]');
    }
  };

  for (let i = 0; i < 100 && !root.querySelector(".tabs button"); i += 1) await settle();

  // Home: the house, each label opened, and each charger's page.
  if (root.querySelector('.tabs button[data-tab="home"]')) {
    tab("home");
    await check("home");
    for (const key of values(".cs-label", "key")) click(`.cs-label[data-key="${key}"]`);
    await check("home, labels open");
    for (const id of values('[data-act="open-charger"]', "id")) {
      if (!click(`[data-act="open-charger"][data-id="${id}"]`)) continue;
      await check(`charger ${id}`);
      tab("home");
    }
  }

  // Cars: the overview, and each car's three views with every tile of the rules.
  tab("cars");
  await check("cars");
  for (const id of harness.state.vehicles.map((v) => v.id)) {
    if (!click(`[data-act="open-car"][data-id="${id}"]`)) continue;
    for (const view of ["now", "rules", "history"]) {
      if (!click(`[data-act="car-view"][data-view="${view}"]`)) continue;
      await check(`car ${id} › ${view}`);
      if (view === "rules") await tiles(`car ${id} › rules`);
    }
    tab("cars");
  }

  tab("guest");
  await check("guest");

  // History: every period and every scope, and what EV Planner has learned.
  tab("history");
  await check("history");
  for (const period of values('[data-act="hist-period"]', "value")) {
    click(`[data-act="hist-period"][data-value="${period}"]`);
    await check(`history › ${period}`);
    if (root.querySelector('[data-act="hist-move"][data-step="-1"]')) {
      click('[data-act="hist-move"][data-step="-1"]');
      await check(`history › ${period} before`);
    }
  }
  if (root.querySelector('[data-act="hist-period"][data-value="month"]')) click('[data-act="hist-period"][data-value="month"]');
  for (const scope of values('[data-act="hist-scope"]', "value")) {
    click(`[data-act="hist-scope"][data-value="${scope}"]`);
    await check(`history › ${scope}`);
  }
  click('[data-act="hist-view"][data-value="learned"]');
  await check("history › learned");
  click('[data-act="hist-view"][data-value="history"]');

  tab("settings");
  await check("settings");
  await tiles("settings");

  return { views, problems: [...new Set(problems)], unknown: harness.unknown };
}
