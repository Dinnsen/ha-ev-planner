/* Writes the states in fixtures/*.json: what "ev_household_planner/subscribe" sends the panel.
   The shape follows panel_state() in websocket.py. Every fixture is one evening, Tuesday
   10 November 2026 at 21:40 in Denmark; the tests set the browser's clock to its "now".

   Run it again after changing it:  node tests_frontend/make-fixtures.mjs */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const TODAY = [2026, 11, 10];
const pad = (n) => String(n).padStart(2, "0");
// Summer time ended on 25 October 2026.
const zoneOf = (year, month, day) => (year === 2026 && (month < 10 || (month === 10 && day < 25)) ? "+02:00" : "+01:00");

/* A moment as Home Assistant writes it: at(0, "21:40") is today, at(1, "07:00") tomorrow. */
function at(day, hhmm) {
  const date = new Date(Date.UTC(TODAY[0], TODAY[1] - 1, TODAY[2] + day));
  const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  return `${y}-${pad(m)}-${pad(d)}T${hhmm}:00${zoneOf(y, m, d)}`;
}
const NOW = at(0, "21:40");
const plusMinutes = (iso, minutes) => {
  const zone = iso.slice(-6);
  const t = new Date(new Date(iso).getTime() + minutes * 60000 + Number(zone.slice(0, 3)) * 3600000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:00${zone}`;
};
const round = (value, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;

/* A windy night: dear at dinner time, cheap from nine in the evening, dear again in the morning. */
const BY_HOUR = [0.39, 0.44, 0.52, 0.61, 0.74, 0.98, 1.6, 2.41, 2.68, 2.3, 1.96, 1.8, 1.71, 1.69, 1.78, 2.04, 2.52, 3.18, 3.36, 3.02, 1.94, 0.62, 0.48, 0.41];

/* 36 hours of prices, from noon today to midnight tomorrow. */
function prices() {
  const out = [];
  for (let h = 12; h < 48; h += 1) {
    const day = Math.floor(h / 24);
    const price = round(BY_HOUR[h % 24] * (day ? 1.07 : 1), 4);
    out.push({ start: at(day, `${pad(h % 24)}:00`), end: at(h % 24 === 23 ? day + 1 : day, `${pad((h + 1) % 24)}:00`), price });
  }
  return out;
}

const SETTINGS = {
  mode: "smart", target_soc: 80, manual_soc: 50, min_soc: 0, ready_by: "07:00", use_ready_by: true, schedule: {},
  earliest_start: "18:00", use_earliest_start: false, continuous: false, join_enabled: false, join_within: 0.05,
  price_ceiling_enabled: false, price_ceiling: 2, price_ceiling_relative: false, price_ceiling_above: 10,
  low_price_charging: false, low_price_level: 0.3, low_soc_charging: false, low_soc_level: 20,
  opportunistic: "off", opportunistic_level: 50, follow_level: 90, keep_on: false,
  reminder: false, reminder_time: "16:00", reminder_soc: 60, reminder_price_enabled: false, reminder_price: 2.2,
  reminder_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], reminder_repeat: 0, reminder_horizon: 24,
  notify_targets: [], live: false, notify_done: false, notify_receipt: true,
  early_enabled: false, early_within: 0.02, topup_enabled: false, topup_level: 80, must_soc: 0,
  priority: "normal", solar: "off", body: "sedan", paint: "white", spot: "auto", day_targets: {},
};

function plan(segments, extra = {}) {
  const minutes = segments.reduce((sum, seg) => sum + (new Date(seg.end) - new Date(seg.start)) / 60000, 0);
  return {
    segments, start: segments[0].start, end: segments.at(-1).end,
    cost: 0, energy: 0, battery_energy: 0, minutes, mode: segments.length > 1 ? "split" : "continuous",
    speed: 13.2, end_soc: 80, savings: 0, charge_now_cost: 0, average_price: 0.5, ceiling: null,
    opportunistic: false, limited: false, min_only: false, short: false, joined: false, joined_extra: null,
    early: false, topup: false, fallback: false, kept: false,
    ...extra,
  };
}

/* One finished charge in a car's history, as Vehicle.end_session() stores it. */
function charge(id, start, minutes, energy, cost, startSoc, endSoc, extra = {}) {
  const end = plusMinutes(start, minutes);
  return {
    id, start, end, energy, cost, start_soc: startSoc, end_soc: endSoc, reason: "planned",
    periods: [{ start, end }], charging_minutes: minutes, plugged: true, source: "power", solar: 0,
    ...extra,
  };
}

function months(list) {
  const out = {};
  for (const [key, energy, cost, sessions, solar] of list) out[key] = { energy, cost, sessions, ...(solar ? { solar } : {}) };
  return out;
}

function vehicle(id, name, extra = {}) {
  const base = {
    id, name, image: null, image_original: null,
    status: "unplugged", reason: "unplugged", supply_amps: null, has_current: false,
    control: "released", control_source: "charger", control_error: null, problem: false,
    paused_by: null, control_backup: false, finds_charger: false, site: "home",
    mode: "smart", soc: 60, soc_source: "sensor", target: 80, target_editable: true, car_limit: null, day_target: null,
    capacity: 75, power: 11,
    charge_speed: 13.2, charge_speed_source: "estimated", charge_speed_learned_from: 0,
    charge_power: 11, charge_power_source: "configured", measured_rise: 0,
    resumes: null, curve: {}, margin: 0, receipt: null, session: null,
    connected: false, home: true, charging: false, charger: null,
    deadline: at(1, "07:00"), calendar: null,
    plan: null, plan_error: null, month: { energy: 0, cost: 0, sessions: 0 }, months: {}, history: [],
  };
  const out = { ...base, ...extra, settings: { ...SETTINGS, ...(extra.settings || {}) } };
  out.settings.mode = out.mode;
  out.settings.target_soc = out.target;
  const key = `${TODAY[0]}-${pad(TODAY[1])}`;
  if (out.months[key]) out.month = out.months[key];
  return out;
}

function charger(id, name, extra = {}) {
  return {
    id, name, power: 11, control: "released", holder: null, connected: false, has_switch: true, has_meter: false,
    site: "home", occupant: null, found_by: null, unknown: false, choices: [], has_plug_sensor: true,
    image: null, image_original: null, model: "zaptec_go", model_title: "Go", style: "slim",
    ...extra,
  };
}

function guest(extra = {}) {
  return {
    status: "ready", error: null, error_detail: null, charge_now: false, control: "released", release: null, plan_locked: false,
    inputs: {
      license_plate: "", soc: 20, battery_capacity: 77, charger_power: 11, charge_limit: 80,
      charge_completion_time: "07:00", use_completion_time: true, continuous_charging_preferred: true, charger: null,
    },
    charger: null,
    car: { brand: null, model: null, variant: null, battery: null, model_year: null, match_score: null, looked_up: null },
    plan: {
      segments: [], mode: "continuous", speed: null, minutes: null, cost: null, energy: null, savings: null,
      charge_now_cost: null, average_price: null, calculated: null, info: null, measured_energy: null, measured_cost: null, progress: null,
    },
    lookup: true, energy_entity: null, service_health: {}, history: [],
    ...extra,
  };
}

/* A guest's finished charge, as GuestSession._maybe_record() stores it. */
function guestCharge(id, start, minutes, energy, cost, extra = {}) {
  const end = plusMinutes(start, minutes);
  return {
    plate: "CX48213", car: "Kia e-Niro", variant: "64 kWh", soc: 35, limit: 80, energy, battery_energy: round(energy * 0.9),
    cost, savings: round(cost * 0.6), mode: "continuous", currency: "DKK", charger: "Garage",
    inputs: { soc: 35, battery_capacity: 64, charger_power: 11, charge_limit: 80, charge_completion_time: "07:00", use_completion_time: true, continuous_charging_preferred: true },
    id, start, end, periods: [{ start, end }], measured_energy: null, measured_cost: null,
    ...extra,
  };
}

function state(extra = {}) {
  return {
    entry_id: "01JEVPLANNERTESTENTRY00000",
    title: "EV Planner",
    now: NOW,
    currency: "DKK",
    prices: prices(),
    price_issue: null,
    supply: null, solar: null, heat_pump: null, home: null,
    vehicles: [], chargers: [], sites: [],
    guest: guest(),
    settings: {},
    config: {
      price_entity: "sensor.energi_data_service",
      notify: ["notify.mobile_app_pixel_9"],
      notify_names: { "notify.mobile_app_pixel_9": "Pixel 9" },
      update_widgets: false,
    },
    ...extra,
  };
}

/* ------------------------------------------------------------------ the cars the fixtures share */

/* Charging since nine on a plan to half past two: from 18 % to 90 %. */
function teslaCharging(extra = {}) {
  const segments = [{ start: at(0, "21:00"), end: at(1, "02:30") }];
  return vehicle("tesla_model_y", "Tesla Model Y", {
    status: "charging", reason: "planned", control: "charge", control_source: "car",
    soc: 27, target: 90, capacity: 75, connected: true, charging: true,
    charge_speed: 13.4, charge_speed_source: "learned", charge_speed_learned_from: 6, charge_power: 10.8, charge_power_source: "learned", measured_rise: 8.9,
    resumes: true, curve: { "80-90": 9.8, "90-100": 5.1 }, margin: 15,
    receipt: { at: at(0, "07:00"), soc: 79.5, planned_soc: 80, target: 80, energy: 31.4, cost: 24.9, late: false, margin: 15 },
    session: { start: at(0, "21:00"), start_soc: 18, energy: 7.2, cost: 4.46, charging: true, periods: [{ start: at(0, "21:00"), end: null }], charging_minutes: 40 },
    charger: { id: "garage", name: "Garage" },
    plan: plan(segments, { cost: 29.36, energy: 60, battery_energy: 54, speed: 13.4, end_soc: 90, savings: 46.1, charge_now_cost: 75.46, average_price: 0.4893 }),
    settings: { body: "suv", paint: "white", continuous: true },
    months: months([["2026-07", 212.4, 301.2, 9], ["2026-08", 188.1, 254.7, 8], ["2026-09", 241.6, 398.3, 10], ["2026-10", 263.9, 441.5, 11], ["2026-11", 96.3, 121.84, 3]]),
    history: [
      charge("t-1108", at(-2, "01:00"), 185, 34.1, 41.27, 38, 80),
      charge("t-1105", at(-5, "23:30"), 240, 43.6, 58.9, 26, 80, { periods: [{ start: at(-5, "23:30"), end: at(-4, "01:30") }, { start: at(-4, "03:00"), end: at(-4, "05:00") }], charging_minutes: 210 }),
      charge("t-1102", at(-8, "02:15"), 105, 18.6, 21.67, 57, 80),
      charge("t-1029", at(-12, "00:45"), 200, 36.2, 62.4, 35, 80),
      charge("t-1024", at(-17, "01:30"), 170, 31.0, 49.8, 41, 80),
      charge("t-1019", at(-22, "23:15"), 260, 47.3, 80.1, 21, 80),
      charge("t-1013", at(-28, "02:00"), 150, 27.4, 45.3, 46, 80),
      charge("t-1007", at(-34, "01:15"), 190, 34.9, 58.6, 37, 80),
    ],
    ...extra,
  });
}

/* At home, not plugged in. */
function zoeUnplugged(extra = {}) {
  return vehicle("renault_zoe", "Renault Zoe", {
    status: "unplugged", reason: "unplugged", control_source: "charger",
    soc: 64, target: 80, capacity: 52, power: 11, charge_speed: 19, charge_power: 11,
    charger: { id: "garage", name: "Garage" },
    settings: { body: "mini", paint: "black" },
    months: months([["2026-09", 118.2, 188.4, 7], ["2026-10", 131.7, 214.9, 8], ["2026-11", 40.9, 47.15, 2]]),
    history: [
      charge("z-1109", at(-1, "02:00"), 110, 19.8, 22.4, 44, 80, { source: "soc" }),
      charge("z-1104", at(-6, "13:10"), 125, 21.1, 24.75, 39, 78, { reason: "charge_now", source: "time", solar: 6.3 }),
      charge("z-1030", at(-11, "01:00"), 130, 23.4, 39.1, 36, 80),
      charge("z-1022", at(-19, "02:30"), 95, 17.2, 28.8, 48, 80),
      charge("z-1015", at(-26, "00:30"), 140, 25.3, 43.9, 33, 80),
    ],
    ...extra,
  });
}

const GUEST_NOV = guestCharge("g-1107", at(-3, "19:20"), 170, 31.2, 61.4);

/* ------------------------------------------------------------------ the fixtures */

const FIXTURES = {
  /* (a) Just installed: no car and no charger yet. */
  empty: state(),

  /* (b) Two cars on one charger: one charges on its plan, the other is not plugged in. */
  "two-cars": state({
    vehicles: [zoeUnplugged(), teslaCharging()],
    chargers: [charger("garage", "Garage", { control: "charge", holder: "Tesla Model Y", connected: true })],
    guest: guest({ history: [GUEST_NOV] }),
    settings: { bill_price: 2.5, payment_text: "MobilePay 12 34 56 78", language: "auto" },
  }),

  /* Two chargers at home and one at the summer house. The cars' chargers are found each time: the
     Tesla was found at the garage, and the carport has a car nobody has told which. */
  "two-chargers": state({
    vehicles: [
      zoeUnplugged({ finds_charger: true, charger: null, connected: true, status: "waiting", reason: "waiting", control_error: "finding_charger" }),
      teslaCharging({ finds_charger: true, control_source: "charger", control_backup: true }),
    ],
    chargers: [
      charger("garage", "Garage", { control: "charge", holder: "Tesla Model Y", connected: true, occupant: "tesla_model_y", found_by: "found" }),
      charger("carport", "Carport", { connected: true, unknown: true, choices: ["renault_zoe"] }),
      charger("cabin", "Skur", { site: "summer", connected: false }),
    ],
    sites: [
      { id: "home", name: "Hjem", home: true, zone: "zone.home", parts: [], supply: null, solar: null, energy: null },
      { id: "summer", name: "Sommerhus", home: false, zone: "zone.sommerhus", parts: ["solar"], supply: null, solar: null, energy: { grid_kw: -0.6, house_kw: 0.4, solar_kw: 1.0 } },
    ],
  }),

  /* (c) The cars share the house's supply: a guard on the meter, solar panels, a home battery
     and a heat pump, and a charger for each car. */
  "shared-supply": (() => {
    const hours = Array.from({ length: 14 }, (_, i) => 21 + i);
    const zoePlan = [{ start: at(0, "22:00"), end: at(0, "23:00") }, { start: at(1, "02:30"), end: at(1, "03:30") }];
    const timeline = hours.map((h) => {
      const day = Math.floor(h / 24);
      const hour = h % 24;
      const cars = {};
      if (h < 26) cars.tesla_model_y = h === 22 ? 9 : 16;
      else if (h === 26) cars.tesla_model_y = 8;
      if (h === 22 || h === 26 || h === 27) cars.renault_zoe = h === 22 ? 9 : 10;
      return { start: at(day, `${pad(hour)}:00`), end: at(hour === 23 ? day + 1 : day, `${pad((hour + 1) % 24)}:00`), limit: 25, house: [6.4, 5.9, 4.8, 3.9, 3.6, 3.4, 3.4, 3.6, 4.4, 6.8, 8.2, 7.1, 5.6, 5.2][h - 21], cars };
    });
    return state({
      supply: {
        limit: 25, phases: 3, meter: true, house_now: 6.4, house_expected: 5.9,
        cars: { tesla_model_y: 16, renault_zoe: 0 }, short: {}, cars_now: { tesla_model_y: 15.8 },
        guard: true, timeline, weather: { now: 6.5, slope: -0.21 },
      },
      solar: {
        grid_kw: 14.1, solar_kw: 0, battery: { kw: -1.2, soc: 62 },
        cars: { tesla_model_y: { on: false, amps: 0, phases: 3 } }, forecast_left_today: 0,
      },
      heat_pump: { kw: 1.8, held: false, held_until: null, holds_tonight: 1 },
      home: {
        grid_kw: 14.1, solar_kw: 0, battery_kw: -1.2, cars_kw: 10.9, house_kw: 4.4, heat_pump_kw: 1.8, temperature: 6.5,
        devices: [{ name: "Varmepumpe", kw: 1.8 }, { name: "Opvaskemaskine", kw: 0.9 }], history: true,
      },
      vehicles: [
        zoeUnplugged({
          status: "planned", reason: "waiting", control: "pause", connected: true, soc: 61, supply_amps: 0, has_current: true,
          charger: { id: "carport", name: "Carport" }, settings: { body: "mini", paint: "black", solar: "surplus" },
          plan: plan(zoePlan, { cost: 5.72, energy: 11, battery_energy: 9.9, speed: 19, end_soc: 80, savings: 9.3, charge_now_cost: 15.02, average_price: 0.52, limited: true }),
        }),
        teslaCharging({ supply_amps: 16, has_current: true }),
      ],
      chargers: [
        charger("garage", "Garage", { control: "charge", holder: "Tesla Model Y", connected: true, has_meter: true }),
        charger("carport", "Carport", { control: "pause", holder: "Renault Zoe", connected: true, model: "wallbox_pulsar_plus", model_title: "Pulsar Plus", style: "box" }),
      ],
      guest: guest({ history: [GUEST_NOV] }),
      settings: { language: "auto", house: "classic" },
    });
  })(),

  /* (d) A guest charges on the charger; the household's car waits for its turn. */
  "guest-charging": (() => {
    const segments = [{ start: at(0, "21:00"), end: at(0, "23:50") }];
    const info = guestCharge("", at(0, "21:00"), 170, 31.2, 16.4);
    delete info.id;
    return state({
      vehicles: [
        teslaCharging({
          status: "charger_busy", reason: "charger_busy", control: "pause", charging: false, soc: 52, target: 80, session: null,
          plan: plan([{ start: at(0, "23:50"), end: at(1, "02:10") }], { cost: 11.2, energy: 23.3, battery_energy: 21, speed: 13.4, end_soc: 80, savings: 14.9, charge_now_cost: 26.1, average_price: 0.48 }),
        }),
      ],
      chargers: [charger("garage", "Garage", { control: "charge", holder: "guest", connected: true })],
      guest: guest({
        status: "charging", control: "charge", plan_locked: true,
        inputs: {
          license_plate: "CX48213", soc: 35, battery_capacity: 64, charger_power: 11, charge_limit: 80,
          charge_completion_time: "07:00", use_completion_time: true, continuous_charging_preferred: true, charger: "garage",
        },
        charger: { id: "garage", name: "Garage", power: 11 },
        car: { brand: "Kia", model: "e-Niro", variant: "64 kWh", battery: 64, model_year: 2021, match_score: 0.93, looked_up: at(0, "20:52") },
        plan: {
          segments, mode: "continuous", speed: 15.5, minutes: 170, cost: 16.4, energy: 31.2, savings: 22.1, charge_now_cost: 38.5,
          average_price: 0.5256, calculated: at(0, "20:54"), info, measured_energy: null, measured_cost: null,
          progress: { soc: 45.3, source: "estimate", planned_soc: 45.3, behind_plan: false },
        },
        history: [GUEST_NOV, guestCharge("g-1018", at(-23, "18:40"), 150, 27.5, 74.3, { plate: "BT61907", car: "Volkswagen ID.4", variant: "Pro", mode: "now", stopped: true })],
      }),
      settings: { bill_price: 2.5, payment_text: "MobilePay 12 34 56 78" },
    });
  })(),

  /* (e) Trouble: the price sensor has stopped, one car does not do as told, and another has
     no charge level and nothing to switch it with. */
  trouble: state({
    prices: [],
    price_issue: "stale",
    vehicles: [
      vehicle("ioniq_5", "Ioniq 5", {
        status: "no_soc", reason: "waiting", control_source: "none", control_error: "no_control_entity",
        soc: null, soc_source: "sensor", connected: null, charger: { id: "garage", name: "Garage" },
        plan_error: null, deadline: null, settings: { body: "estate", use_ready_by: false },
      }),
      teslaCharging({
        status: "no_price_data", reason: "waiting", control: "released", control_error: "Service switch.turn_off not found",
        problem: true, charging: true, plan: null, plan_error: "no_price_data", resumes: false,
        session: { start: at(0, "19:05"), start_soc: 18, energy: 9.9, cost: 0, charging: true, periods: [{ start: at(0, "19:05"), end: null }], charging_minutes: 155 },
      }),
    ],
    chargers: [charger("garage", "Garage", { connected: true, has_switch: false })],
  }),
};

mkdirSync(OUT, { recursive: true });
for (const [name, value] of Object.entries(FIXTURES)) {
  writeFileSync(join(OUT, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
}
console.log(`Wrote ${Object.keys(FIXTURES).length} fixtures to ${OUT}`);
