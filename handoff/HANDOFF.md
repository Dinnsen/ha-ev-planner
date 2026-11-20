# Handoff: EV Planner b48 – "alle sider 1:1 som artefakten"

This file is for the next Claude session. Reply to the user in Danish. Do not spawn subagents.

## Standing rules
- Reply in Danish. Little descriptive text in the UI; put explanations behind a "?" button with a small popup.
- Messages for the tester Frank go in a code block, as short bullets. Never store or use Frank's phone number.
- The user's e-mail is private: never send it to external services. The OK Charger config entry title contains a third person's e-mail: never repeat it.
- The user approved building and releasing betas without asking ("spørg ikke igen").
- Git author: `-c user.name=Claude -c user.email=noreply@anthropic.com`. End every commit message with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```

## Release workflow
1. Run `ruff check .`.
2. Run the frontend tests: `NODE_PATH=$(npm root -g) node --test tests_frontend/*.test.mjs` (about 160 s). Python tests only run in CI, because freezegun is missing locally.
3. Bump `custom_components/ev_household_planner/manifest.json` to 2.5.0bNN.
4. Add a `## [2.5.0bNN] - date` entry at the top of CHANGELOG.md.
5. Create branch `bNN-name`, commit and push. Wait until CI is green on that SHA.
6. `git checkout main && git merge --ff-only <branch> && git push`.
7. The Release workflow publishes the release. Poll with `gh api repos/Dinnsen/ha-ev-planner/releases/tags/v2.5.0bNN -q '.assets|length'`. GraphQL (`gh release view`) is blocked.
8. In HA (HAcdi MCP), call `ha_manage_hacs` `update_information` for repository 1425354122, then `download` with version `v2.5.0bNN`.
9. Call `ha_restart(confirm=true)`. Wait about 3 minutes; calls return Bad Gateway meanwhile.
10. Check the logs with `ha_get_logs` (source `system` and source `error_log`, search `ev_household_planner`).

## Status
- **b44–b47 are released and installed.** b47 is running, and its logs are clean.
  - b46: Auto/Fast targets (`day_fixed` setting), and the battery level line over the price graph.
  - b47: the quick menu, `now_target` (Lad nu to a level), the profile menu as tiles from the top, and "Toppen" under Look.
- **The user is unhappy with b44–b47.** Their feedback (2026-11-20):
  1. The header is wrong. A separate app bar still shows the logo, menu and profile above the hero. The header must be the top itself: logo, menu and profile inside the hero, exactly like Middagsro and Hverdagsro. See `Dinnsen/ha-middagsro` `middagsro-panel.js`, around line 3971 (`header.hdr` with toolbar, `hdr-body` and `nav.tabs`) and CSS around line 9765.
     - PC: the tabs are glass pills at the bottom of the header; the active one is white.
     - Phone (≤700 px): the tabs are a floating glass bar at the bottom.
  2. The PC menu layout is not what they asked for (see point 1).
  3. It must work on PC, tablet and iPhone. Today it only works on iPhone.
  4. Every page must be **1:1 the artifact's layout and design**: Huset, Biler, bilens egen side, Quick-menu, Insight-popup, Profilmenu and Look.
     - The sub-pages' small top looks bad on PC: dots stretched across the whole width, and the house tiny at the far right.
     - Insight-popup does not exist yet. Today the hero pill goes to the Læring tab.
  5. Also in b48: the week plan editor (Klar kl. Ingen/Standard/Andet, Mål Auto/Fast, Gælder Kun dd/mm / Hver ugedag, Klima), climate per departure in Afgange, the Insight bars explained, and Regler/Historik as cards.

## The design (the source of truth)
- The design artifact: https://claude.ai/artifact/UArez7pjthNpsMrYpSqm5U
- A copy of the files is in `handoff/design/*.dc.html`. Each file has inline styles plus a `renderVals()` script; read both.
- The boards are 390 px wide (phone):

  | Board | Page |
  |---|---|
  | Main | Huset |
  | Biler | Biler |
  | Bil | Bilens egen side |
  | Quick | Quick-menu |
  | Insight | Insight-popup |
  | Menu | Profilmenu |
  | Udseende | Look |

- Palette: bg #0d1014, card #161a21 (radius 26, border rgba(255,255,255,.07)), ink #eef2f5, soft #a3adb8, accent #2fd3a3 / #6fe8c4, violet #c3b5ff, warn #f5b94a, brand gradient #19b6a5→#6e4aff.
- Fonts: Bricolage Grotesque for display, Inter for text.
- PC/tablet: the same design language inside a centred column of at most 1180 px. The cards sit in a grid, and the top follows Middagsro's big/small header.

## Work in progress (not committed to main)
### Backend, uncommitted in the working tree on branch `b48-wip`
- `TRIP_ONCE = "once"` (const.py). `vehicle_trip` takes `time` (HH:MM); with kind `once` plus `date` and `time`, it sets a one-off departure on that day (household.py `async_set_trip`).
- A test is added in `tests/test_trips.py`. It has not been run locally; CI will run it.

### Frontend draft
`handoff/b48-pages.js` is a big `Object.assign(EvPlannerPanel.prototype, {...})` draft with all the new page renderers:
- **Shell:** `_xPark` / `_xDock` move the persistent `.bar` (brand, menu, profile) into `.x-top .x-dock`, and `nav.tabs` into `.x-tabs` on PC.
- **Tops:** `_xHomeTop`, `_xSmallTop`, `_xCarTop`.
- **Huset:** `_xHomeHtml` (I aften-link, I dag, Hvem får strømmen).
- **Biler:** `_xCarsHtml` (issue card, I aften, Bilernes uge with graph and grid, editor `_xEditorHtml`/`_xEditorAct`/`_xEditorTime`, `_xDeps`).
- **Car page:** `_xCarHtml` (views, Næste afgang card with dial, slider and modes; `_xPriceHtml`; `_xDepsHtml`; `_xHistCard`; `_xRulesHtml`).
- **Popups and Look:** `_xQuickHtml` / `_renderQuick` / `_onQuickClick`, `_xInsightHtml`, `_xProfHtml`, `_xLookHtml`.

The draft is not wired in and not tested. Known fixes needed:
- `_xDayShort` must accept a Date as well as an ISO string.
- Remove the odd expression in the "Kun …" label.

### Still to do
1. Paste the draft into `custom_components/ev_household_planner/frontend/ev-planner-panel.js`, after the class and before `const STYLE`. It uses `EvPlannerPanel`, `TABS`, `CAR_VIEWS`, `ClayScene`, `miniFit`, `isoWeek`, `dayNow`, `ZD`, `znow`, `esc`, `isNum`, `clamp`, `hasSegments`, `WEEKDAYS`, `ICONS` and `MARK`.
2. **Shell (`_renderShell`, ~line 6230):**
   - The bar becomes menu slot + `button.brand` (XMARK + "EV Planner") + spacer + `prof-wrap`.
   - Move `nav.tabs` out of the bar into `.app`.
   - Add a persistent `button.qfab` with `data-act="quick-open"`, and click handling on `.app` for it.
   - The profile menu uses `_xProfHtml()` with a scrim.
   - Register a `matchMedia("(min-width:701px)")` listener that calls `_xDock`.
   - Load `_xFonts()` for the evp look.
3. **`_render` (~6503):**
   - Call `_xPark()` before content is replaced.
   - Use `_xHomeHtml`, `_xCarsHtml` and `_xCarHtml`; other pages go through `_xPage(title, oldHtml)`; Settings with `_sheet === "look"` goes to `_xLookHtml`.
   - Then call `_xDock()`, mount the scene (`.scene-slot`), `_xMountMini` (`.x-pic`), `_paintTonight` (`.tn-pic`, now on both Huset and Biler) and `_xMountLook`.
   - Remove the old `.qfab` insert and the mini-hero insert.
   - `_renderTabs` uses `_xTabsHtml()`.
4. **`_renderCarPage` / `_renderCarLive`:**
   - `_patch` `.x-nexthead` with `_xNextHead(v, shown)`, `.x-price-body` with `_xPriceHtml(v, shown)` and `.x-deps-body` with `_xDepsHtml(v)`.
   - Call `_xSlider(this._batteryModel())` after `_renderBattery`.
   - `_renderRules` outputs `_xRulesHtml(v, s, groups)` into `.tiles`.
   - The mode buttons are now `.x-modes button` (`aria-pressed`).
   - Remove `.car-head`.
5. **`_batteryModel`:** when `v.mode === "charge_now"`, `limit` = `now_target`, and moving the handle sets `now_target`.
6. **`_onClick`, new actions:**
   - Navigation: `x-tab` (`_setTab(button.dataset.tab)`), `insight-open` (`_xInsightOpen`), `x-pop` (toggle `this._xPop`, then render).
   - Biler week editor: `x-cell` (`this._xSel = {car, k}`), `x-ed-close`, and the edits `x-kind`, `x-mode`, `x-step`, `x-scope`, `x-clim`, `x-make-std` (all go to `_xEditorAct`).
   - Car page departures: `x-dep` (`this._xDepOpen = {car, k}` toggle).
   - Look: `x-body` (`_xSet(v, {body})`), `x-theme` (`_setTheme`), `x-look-back`, `x-look-light`.
   - `_onChange`: `[data-x-time]` goes to `_xEditorTime`.
7. **Theme:**
   - Add the new look `"evp"` (default) to `_looks()`.
   - `_applyTheme` reads the user data key `ev_planner_theme` and sets the `xlight` attribute plus `dark`/`light` from `_xDark()`.
8. **CSS:** a large new block is still to write.
   - Tokens `--x-*` on `:host`, with a light variant under `:host([look="evp"][xlight])`. Other looks map `--x-*` to `--evp-*`.
   - Classes used in the draft: `.x-top` (big/small/car/look, day/night), `.x-in`, `.x-dock`, `.x-tabs`, `.x-hello`, `.x-stage`, `.x-arc`/`.x-bead`/`.x-lab`, `.x-house`, `.x-card`, `.x-hero-card`, `.x-head`, `.x-seg`, `.x-sw`, `.x-ed`, `.x-cell`, `.x-wk`, `.x-dep`, `.x-quick`, `.x-qtile`, `.x-insight`, `.x-look`, and the others.
   - Phone sizes come from the design files; PC sizes follow Middagsro.
9. **Texts:** all new keys (`x_*`, `look_evp`, `x_theme_*`, …) in both da and en. `tests_frontend/texts.test.mjs` checks that both languages have them.
10. **Tests:** update the frontend tests that use old classes (`.tn-card`, `.wk-cell`, `.week-more`, `.target-label .tgt-chip`, `.qfab`, `.pop-quick`, `.prof-tiles`, `.ev-top`, `.mini-hero`, `.charging h2 .steer-pill`, `.timeline .tl-level`), and add tests for the new pages.
11. **Visual check:**
    - Screenshot at 390, 820 and 1440 px wide, in both light and dark.
    - The harness is `tests_frontend/harness.html`; there is a screenshots script in `tests_frontend/screenshots.mjs`.
    - Compare with the design boards.
12. Release b48 with the workflow above, then tell the user in a few short lines.
