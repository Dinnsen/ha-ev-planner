/* Husets døgn (a preview): a day of a house with solar panels, a home battery, a heat pump and two cars,
   drawn as a flower with a petal an hour. The days are simulated, one for each season; nothing here is
   the household's own. Opened from the profile menu; it is a page of its own and fetched when opened. */

const TEXT = {
  da: {
    kicker: "EV Planner · Preview",
    title: "Husets døgn",
    close: "Luk",
    play: "Afspil",
    stop: "Stop",
    play_label: "Afspil døgnet time for time",
    stop_label: "Stop afspilningen",
    seasons_label: "Årstid",
    winter: "Vinter",
    spring: "Forår",
    summer: "Sommer",
    autumn: "Efterår",
    winter_day: "En dag i januar",
    spring_day: "En dag i april",
    summer_day: "En dag i juli",
    autumn_day: "En dag i oktober",
    headline: "{day} · {self} % selvforsynet · sparet {saved}",
    q1: "NAT",
    q2: "MORGEN",
    q3: "EFTERMIDDAG",
    q4: "AFTEN",
    key_sun: "Sol brugt",
    key_batt: "Batteri",
    key_buy: "Købt",
    key_sell: "Solgt",
    key_gave: "Solen gav",
    key_price: "Pris",
    hint: "Et blad pr. time, midnat øverst · træk rundt for at gå i døgnet",
    help: "Sådan læser du et blad",
    help_text:
      "Et blad er en time. Jo længere det vokser ud, jo mere strøm kom ind i huset. Farverne viser, hvor den kom fra. Den gule linje er det, solen gav: ligger den uden for bladet, gav solen mere, end huset brugte, så lades batteriet, eller strømmen sælges. Ringen om huset er timens pris.",
    a_sun: "brugt fra solen",
    a_batt: "fra batteriet",
    a_buy: "købt",
    a_gave: "det solen gav",
    a_sell: "solgt",
    a_house: "huset",
    a_aria: "Et blad er en time. Fra midten og ud: brugt fra solen, fra batteriet, og købt. Bag det står det, solen gav, og uden for kanten det solgte.",
    at: "Kl.",
    forecast: "Prognose",
    cheap: "billig",
    normal: "almindelig",
    dear: "dyr",
    kwh_sold: "kWh solgt",
    kwh_bought: "kWh købt",
    own: "selvforsynet",
    battery: "Batteri {pct} %",
    s_sun: "solen gav {v} kWh",
    s_charge: "{v} gik i batteriet",
    s_grid_charge: "batteriet blev ladet med {v} billigt",
    s_give: "batteriet gav {v}",
    s_heat: "varmepumpen tog {v}",
    s_car: "bilerne fik {v}",
    s_sell: "{v} blev solgt for {money}",
    s_buy: "{v} blev købt for {money}",
    quiet: "En stille time.",
    house_at: "Huset {when}kl. {h}: {said}",
    in_forecast: "i prognosen ",
    c_buy: "Køber",
    c_sell: "Sælger",
    c_batt: "Batteri",
    c_charge: "Lader op",
    c_give: "Giver",
    c_sun: "Sol",
    c_heat: "Varmepumpe",
    c_car: "Bil",
    bought: "Købt",
    sold: "Solgt",
    saved: "Sparet",
    saved_by: "sol + batteri",
    moments: "Dagens øjeblikke",
    m_car_night: "Bilerne lader om natten",
    m_car_night_t: "{v} kWh i de billigste timer, til {lo}–{hi}.",
    m_night_both: "Bilerne og batteriet lader om natten",
    m_night_both_t: "{car} kWh til bilerne og {batt} kWh til batteriet i de billigste timer.",
    m_grid_batt: "Batteriet lader billigt",
    m_grid_batt_t: "{v} kWh om natten, til brug når strømmen er dyr.",
    m_peak: "Solen topper",
    m_peak_t: "{v} kWh på en time – huset, bilerne og batteriet får alle.",
    m_car_sun: "Bilerne lader på solen",
    m_car_sun_t: "{v} kWh midt på dagen, {pct} % af det fra taget.",
    m_sell: "Batteriet er fuldt, huset sælger",
    m_sell_t: "{v} kWh solgt i timen, {all} kWh hele dagen.",
    m_evening: "Batteriet tager aftenen",
    m_evening_t: "{v} kWh, mens strømmen koster op til {hi}.",
    m_heat: "Varmepumpen arbejder hårdest",
    m_heat_t: "{v} kWh på en time, {all} kWh hele døgnet.",
    m_dear: "Dagens dyreste time",
    m_dear_t: "{price} pr. kWh – huset købte kun {v} kWh.",
    river: "Hvor strømmen kom fra – og gik hen",
    river_sub: "Hele dagen · bredden er kWh",
    r_sun: "Sol",
    r_batt: "Batteri",
    r_grid: "Købt",
    r_house: "Huset",
    r_heat: "Varmepumpe",
    r_car: "Biler",
    r_charge: "Til batteri",
    r_sell: "Solgt",
    river_aria: "Hele dagen: sol {sun}, batteri {batt}, købt {buy} kWh, til huset, varmepumpen, bilerne, batteriet og salg.",
    river_cars: "{pct} % af bilernes strøm kom fra solen.",
    river_batt: "Batteriet flyttede {v} kWh til de dyre timer.",
    story_label: "Dagen",
    st_sun: "Solen gav {v} kWh, og huset brugte {pct} % af den selv.",
    st_store: "{v} kWh blev gemt i batteriet til de dyre timer.",
    st_heat: "Varmepumpen tog {v} kWh.",
    st_cars: "Bilerne fik {v} kWh, {pct} % af det i nattens billigste timer.",
    st_cars_sun: "Bilerne fik {v} kWh, {pct} % af det fra solen.",
    st_self: "I alt klarede huset {pct} % af sit forbrug selv.",
    dial: "Døgnet som en blomst, et blad for hver time. {hour}.",
    sample: "Simulerede døgn – ikke dit hjem.",
  },
  en: {
    kicker: "EV Planner · Preview",
    title: "The house's day",
    close: "Close",
    play: "Play",
    stop: "Stop",
    play_label: "Play the day hour by hour",
    stop_label: "Stop playing",
    seasons_label: "Season",
    winter: "Winter",
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter_day: "A day in January",
    spring_day: "A day in April",
    summer_day: "A day in July",
    autumn_day: "A day in October",
    headline: "{day} · {self} % self-sufficient · saved {saved}",
    q1: "NIGHT",
    q2: "MORNING",
    q3: "AFTERNOON",
    q4: "EVENING",
    key_sun: "Sun used",
    key_batt: "Battery",
    key_buy: "Bought",
    key_sell: "Sold",
    key_gave: "Sun gave",
    key_price: "Price",
    hint: "A petal an hour, midnight at the top · drag round to move through the day",
    help: "How to read a petal",
    help_text:
      "A petal is an hour. The further it grows out, the more power came into the house. The colours show where it came from. The yellow line is what the sun gave: outside the petal, the sun gave more than the house used, so the battery is charged or the power is sold. The ring round the house is the hour's price.",
    a_sun: "used from the sun",
    a_batt: "from the battery",
    a_buy: "bought",
    a_gave: "what the sun gave",
    a_sell: "sold",
    a_house: "the house",
    a_aria: "A petal is an hour. From the middle out: used from the sun, from the battery, and bought. Behind it what the sun gave, and outside the rim what was sold.",
    at: "",
    forecast: "Forecast",
    cheap: "cheap",
    normal: "ordinary",
    dear: "dear",
    kwh_sold: "kWh sold",
    kwh_bought: "kWh bought",
    own: "self-sufficient",
    battery: "Battery {pct} %",
    s_sun: "the sun gave {v} kWh",
    s_charge: "{v} went into the battery",
    s_grid_charge: "the battery was charged with {v} cheaply",
    s_give: "the battery gave {v}",
    s_heat: "the heat pump took {v}",
    s_car: "the cars got {v}",
    s_sell: "{v} was sold for {money}",
    s_buy: "{v} was bought for {money}",
    quiet: "A quiet hour.",
    house_at: "The house {when}at {h}: {said}",
    in_forecast: "in the forecast ",
    c_buy: "Buying",
    c_sell: "Selling",
    c_batt: "Battery",
    c_charge: "Charging",
    c_give: "Giving",
    c_sun: "Sun",
    c_heat: "Heat pump",
    c_car: "Car",
    bought: "Bought",
    sold: "Sold",
    saved: "Saved",
    saved_by: "sun + battery",
    moments: "The day's moments",
    m_car_night: "The cars charge at night",
    m_car_night_t: "{v} kWh in the cheapest hours, at {lo}–{hi}.",
    m_night_both: "The cars and the battery charge at night",
    m_night_both_t: "{car} kWh for the cars and {batt} kWh for the battery in the cheapest hours.",
    m_grid_batt: "The battery charges cheaply",
    m_grid_batt_t: "{v} kWh at night, for when power is dear.",
    m_peak: "The sun peaks",
    m_peak_t: "{v} kWh in an hour – the house, the cars and the battery all get some.",
    m_car_sun: "The cars charge on the sun",
    m_car_sun_t: "{v} kWh in the middle of the day, {pct} % of it from the roof.",
    m_sell: "The battery is full, the house sells",
    m_sell_t: "{v} kWh sold in the hour, {all} kWh all day.",
    m_evening: "The battery takes the evening",
    m_evening_t: "{v} kWh while power costs up to {hi}.",
    m_heat: "The heat pump works hardest",
    m_heat_t: "{v} kWh in an hour, {all} kWh all day.",
    m_dear: "The day's dearest hour",
    m_dear_t: "{price} a kWh – the house bought only {v} kWh.",
    river: "Where the power came from – and went",
    river_sub: "All day · the width is kWh",
    r_sun: "Sun",
    r_batt: "Battery",
    r_grid: "Bought",
    r_house: "House",
    r_heat: "Heat pump",
    r_car: "Cars",
    r_charge: "To battery",
    r_sell: "Sold",
    river_aria: "All day: sun {sun}, battery {batt}, bought {buy} kWh, to the house, the heat pump, the cars, the battery and sale.",
    river_cars: "{pct} % of the cars' power came from the sun.",
    river_batt: "The battery moved {v} kWh to the dear hours.",
    story_label: "The day",
    st_sun: "The sun gave {v} kWh, and the house used {pct} % of it itself.",
    st_store: "{v} kWh was kept in the battery for the dear hours.",
    st_heat: "The heat pump took {v} kWh.",
    st_cars: "The cars got {v} kWh, {pct} % of it in the night's cheapest hours.",
    st_cars_sun: "The cars got {v} kWh, {pct} % of it from the sun.",
    st_self: "In all the house covered {pct} % of its use itself.",
    dial: "The day as a flower, a petal for each hour. {hour}.",
    sample: "Simulated days – not your home.",
  },
};

/* The four days, an hour a value (kWh), with the hour's price. A house with 10 kWh of battery, about
   6 kW of panels, a heat pump and two cars; in winter the battery is also charged in the cheap night. */
const HOUSE = [0.3, 0.3, 0.25, 0.25, 0.25, 0.35, 0.6, 0.8, 0.6, 0.45, 0.4, 0.45, 0.5, 0.45, 0.4, 0.5, 0.8, 1.3, 1.5, 1.4, 1.2, 0.9, 0.6, 0.4];
const ZERO = Array(24).fill(0);
export const SEASONS = {
  winter: {
    start: 25,
    gridCharge: 2,
    sun: [0, 0, 0, 0, 0, 0, 0, 0, 0.05, 0.3, 0.7, 1.0, 1.1, 0.9, 0.5, 0.15, 0.02, 0, 0, 0, 0, 0, 0, 0],
    house: [0.3, 0.3, 0.25, 0.25, 0.25, 0.35, 0.7, 0.9, 0.6, 0.45, 0.4, 0.45, 0.5, 0.45, 0.45, 0.6, 0.9, 1.4, 1.6, 1.5, 1.3, 1.0, 0.6, 0.4],
    heat: [1.1, 1.1, 1.0, 1.0, 1.2, 1.4, 1.6, 1.5, 1.2, 1.0, 0.9, 0.8, 0.8, 0.8, 0.9, 1.0, 1.2, 1.4, 1.5, 1.5, 1.4, 1.3, 1.2, 1.1],
    car: [0, 3.6, 3.6, 3.6, 3.0, ...ZERO.slice(5)],
    price: [1.9, 1.75, 1.68, 1.7, 1.8, 2.05, 2.6, 3.1, 2.9, 2.5, 2.3, 2.2, 2.1, 2.15, 2.3, 2.6, 3.0, 3.5, 3.6, 3.3, 2.9, 2.5, 2.2, 2.0],
  },
  spring: {
    start: 30,
    sun: [0, 0, 0, 0, 0, 0, 0.05, 0.3, 0.9, 1.8, 2.8, 3.4, 3.7, 3.6, 3.2, 2.5, 1.6, 0.8, 0.25, 0.03, 0, 0, 0, 0],
    house: HOUSE,
    heat: [0.45, 0.45, 0.45, 0.45, 0.5, 0.6, 0.7, 0.6, 0.45, 0.3, 0.2, 0.15, 0.15, 0.15, 0.15, 0.2, 0.3, 0.4, 0.5, 0.55, 0.55, 0.5, 0.5, 0.45],
    car: [0, 2.6, 2.6, 1.6, 0, 0, 0, 0, 0, 0, 0, 1.2, 1.8, 1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    price: [1.32, 1.21, 1.16, 1.18, 1.25, 1.42, 1.85, 2.11, 1.92, 1.58, 1.31, 1.12, 1.02, 1.05, 1.16, 1.44, 1.91, 2.32, 2.41, 2.18, 1.9, 1.65, 1.48, 1.4],
  },
  summer: {
    start: 45,
    sun: [0, 0, 0, 0, 0.05, 0.3, 0.9, 1.7, 2.6, 3.5, 4.3, 4.8, 5.0, 4.9, 4.6, 4.0, 3.2, 2.3, 1.4, 0.6, 0.15, 0.02, 0, 0],
    house: [0.3, 0.25, 0.25, 0.25, 0.25, 0.3, 0.5, 0.7, 0.5, 0.4, 0.4, 0.45, 0.5, 0.45, 0.4, 0.45, 0.6, 0.9, 1.0, 0.9, 0.8, 0.7, 0.5, 0.4],
    heat: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, 0.05, 0.6, 0.7, 0.05, 0.05, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05],
    car: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.4, 3.4, 3.4, 3.4, 2.4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    price: [1.1, 1.0, 0.95, 0.95, 1.0, 1.1, 1.35, 1.55, 1.3, 0.95, 0.7, 0.5, 0.4, 0.42, 0.55, 0.8, 1.2, 1.65, 1.8, 1.7, 1.5, 1.3, 1.2, 1.15],
  },
  autumn: {
    start: 30,
    sun: [0, 0, 0, 0, 0, 0, 0, 0.05, 0.3, 0.9, 1.6, 2.1, 2.3, 2.1, 1.6, 0.9, 0.3, 0.05, 0, 0, 0, 0, 0, 0],
    house: HOUSE,
    heat: [0.6, 0.6, 0.6, 0.6, 0.7, 0.8, 0.9, 0.8, 0.6, 0.5, 0.4, 0.35, 0.35, 0.35, 0.4, 0.45, 0.55, 0.7, 0.8, 0.8, 0.75, 0.7, 0.65, 0.6],
    car: [0, 3.0, 3.0, 3.0, 1.5, ...ZERO.slice(5)],
    price: [1.6, 1.48, 1.42, 1.45, 1.55, 1.8, 2.35, 2.7, 2.45, 2.1, 1.9, 1.8, 1.72, 1.75, 1.85, 2.1, 2.6, 3.05, 3.15, 2.85, 2.5, 2.2, 1.95, 1.75],
  },
};
export const SEASON_ORDER = ["winter", "spring", "summer", "autumn"];

/* The season of a date: winter Dec–Feb, spring Mar–May, summer Jun–Aug, autumn Sep–Nov. */
export function seasonOf(date = new Date()) {
  return SEASON_ORDER[Math.floor(((date.getMonth() + 1) % 12) / 3)];
}

/* The hours of a season's day: where the sun went, what the battery did, what was bought and sold.
   The battery is charged by the sun's surplus (and, in winter, in the night's three cheapest hours)
   and gives in the day's eight dearest hours, unless the cars charge. */
export function makeDay(season) {
  const cap = 10;
  let soc = (season.start / 100) * cap;
  const dear = [...season.price].sort((a, b) => a - b)[15];
  const night = season.gridCharge ? [0, 1, 2, 3, 4, 5].sort((a, b) => season.price[a] - season.price[b]).slice(0, 3) : [];
  return season.sun.map((sun, h) => {
    const house = season.house[h], heat = season.heat[h], car = season.car[h];
    const use = house + heat + car;
    let charge = 0, gridIn = 0, give = 0, buy = 0, sell = 0, fromSun = 0;
    if (sun >= use) {
      fromSun = use;
      charge = Math.min(sun - use, 3, Math.max(0, cap * 0.95 - soc) / 0.95);
      soc += charge * 0.95;
      sell = sun - use - charge;
    } else {
      fromSun = sun;
      const need = use - sun;
      give = season.price[h] > dear && car === 0 ? Math.max(0, Math.min(need, 2, soc - cap * 0.15)) : 0;
      soc -= give;
      buy = need - give;
    }
    if (night.includes(h)) {
      gridIn = Math.max(0, Math.min(season.gridCharge, (cap * 0.95 - soc) / 0.95));
      soc += gridIn * 0.95;
      buy += gridIn;
    }
    const price = season.price[h];
    return { h, sun, use, house, heat, car, fromSun, give, charge, gridIn, buy, sell, price, sellPrice: price * 0.4, soc: (soc / cap) * 100 };
  });
}

const C = { sun: "#f5b52e", batt: "#2cc9a8", buy: "#4d8dff", sell: "#a678ff", car: "#56d68f", heat: "#ff7a59" };
const CX = 180, CY = 180, R0 = 76, RIM = 152;
const ang = (t) => (t / 24) * Math.PI * 2 - Math.PI / 2;
const at = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
const pt = (r, a) => at(r, a).map((v) => v.toFixed(2)).join(" ");
const f1 = (v) => v.toFixed(1);
const pad = (h) => String(((h % 24) + 24) % 24).padStart(2, "0");
const sum = (list, f) => list.reduce((s, x) => s + f(x), 0);
const wedge = (h, ra, rb) => {
  if (rb - ra < 0.3) return "";
  const a0 = ang(h) + 0.012, a1 = ang(h + 1) - 0.012;
  return `M${pt(ra, a0)} L${pt(rb, a0)} A${rb} ${rb} 0 0 1 ${pt(rb, a1)} L${pt(ra, a1)} A${ra} ${ra} 0 0 0 ${pt(ra, a0)} Z `;
};
const smooth = (pts, from, to) => {
  let d = "";
  for (let i = from; i < to; i += 1) {
    const p0 = pts[(i - 1 + 24) % 24], p1 = pts[i % 24], p2 = pts[(i + 1) % 24], p3 = pts[(i + 2) % 24];
    if (i === from) d += `M${f1(p1[0])} ${f1(p1[1])}`;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
};
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* What stays the same all day: the money, the moments, the river and the story. */
export function dayFigures(day, tr, fmt) {
  const { n1, money: cash } = fmt;
  // A sum of ten or more without øre, so the day's money fits its box.
  const money = (v) => cash(v, Math.abs(v) >= 10 ? 0 : 2);
  const all = (f) => sum(day, f);
  const sunAll = all((x) => x.sun), useAll = all((x) => x.use), carAll = all((x) => x.car), heatAll = all((x) => x.heat);
  const buyAll = all((x) => x.buy), sellAll = all((x) => x.sell), chargeAll = all((x) => x.charge), gridAll = all((x) => x.gridIn), giveAll = all((x) => x.give);
  const selfPct = Math.round(Math.max(0, 1 - (buyAll - gridAll) / Math.max(0.01, useAll)) * 100);
  const saved = all((x) => (x.fromSun + x.give - x.gridIn) * x.price);
  const moneyFigs = {
    bought: money(all((x) => x.buy * x.price)), boughtKwh: `${n1(buyAll)} kWh`,
    sold: money(all((x) => x.sell * x.sellPrice)), soldKwh: `${n1(sellAll)} kWh`,
    saved: money(saved),
  };

  // The moments, found in the day itself: the first four that are there, in the order of the day.
  const span = (list) => [list[0].h, list[list.length - 1].h + 1];
  const carNight = day.filter((x) => x.h < 7 && x.car > 0);
  const gridNight = day.filter((x) => x.gridIn > 0.05);
  const peak = day.reduce((a, b) => (b.sun > a.sun ? b : a));
  const carSun = day.filter((x) => x.h >= 8 && x.h < 18 && x.car > 0);
  const sellTop = day.reduce((a, b) => (b.sell > a.sell ? b : a));
  const evening = day.filter((x) => x.h >= 12 && x.give > 0.05);
  const heatTop = day.reduce((a, b) => (b.heat > a.heat ? b : a));
  const dear = day.reduce((a, b) => (b.price > a.price ? b : a));
  // Each with a rank: the first four that do not sit on top of each other on the ring are shown.
  const found = [];
  const add = (rank, at, color, title, text) => found.push({ rank, at, color, title, text });
  const carsAtNight = sum(carNight, (x) => x.car) > 0.5;
  if (carsAtNight && gridAll > 0.3) {
    // The cars and the battery in the same cheap night: one moment.
    const both = day.filter((x) => (x.h < 7 && x.car > 0) || x.gridIn > 0.05);
    add(1, span(both), C.car, tr("m_night_both"), tr("m_night_both_t", { car: n1(sum(carNight, (x) => x.car)), batt: n1(gridAll) }));
  } else {
    if (carsAtNight)
      add(1, span(carNight), C.car, tr("m_car_night"), tr("m_car_night_t", { v: n1(sum(carNight, (x) => x.car)), lo: money(Math.min(...carNight.map((x) => x.price))), hi: money(Math.max(...carNight.map((x) => x.price))) }));
    if (gridAll > 0.3) add(2, span(gridNight), C.batt, tr("m_grid_batt"), tr("m_grid_batt_t", { v: n1(gridAll) }));
  }
  if (heatTop.heat > 0.8) add(heatTop.heat > peak.sun ? 2.5 : 7, [heatTop.h, heatTop.h + 1], C.heat, tr("m_heat"), tr("m_heat_t", { v: n1(heatTop.heat), all: n1(heatAll) }));
  if (peak.sun > 0.3) add(3, [peak.h, peak.h + 1], C.sun, tr("m_peak"), tr("m_peak_t", { v: n1(peak.sun) }));
  if (sellAll > 0.2) add(4, [sellTop.h, sellTop.h + 1], C.sell, tr("m_sell"), tr("m_sell_t", { v: n1(sellTop.sell), all: n1(sellAll) }));
  if (sum(evening, (x) => x.give) > 0.3) add(5, span(evening), C.batt, tr("m_evening"), tr("m_evening_t", { v: n1(sum(evening, (x) => x.give)), hi: money(Math.max(...evening.map((x) => x.price))) }));
  if (sum(carSun, (x) => x.car) > 0.5) {
    const sunShare = sum(carSun, (x) => (x.use > 0 ? (x.car * x.fromSun) / x.use : 0)) / sum(carSun, (x) => x.car);
    add(sunShare > 0.6 ? 2.8 : 6, span(carSun), C.car, tr("m_car_sun"), tr("m_car_sun_t", { v: n1(sum(carSun, (x) => x.car)), pct: Math.round(sunShare * 100) }));
  }
  add(8, [dear.h, dear.h + 1], "#ff6b57", tr("m_dear"), tr("m_dear_t", { price: money(dear.price), v: n1(dear.buy) }));
  const middle = (m) => (m.at[0] + m.at[1]) / 2;
  const apart = (a, b) => { const d = Math.abs(middle(a) - middle(b)) % 24; return Math.min(d, 24 - d) >= 1.5; };
  const moments = [];
  for (const m of found.sort((a, b) => a.rank - b.rank)) if (moments.length < 4 && moments.every((o) => apart(o, m))) moments.push(m);
  moments.sort((a, b) => a.at[0] - b.at[0]);

  // The river: every source to every use, the width in kWh.
  const parts = (x, total) => (x.use > 0 ? { house: (total * x.house) / x.use, heat: (total * x.heat) / x.use, car: (total * x.car) / x.use } : { house: 0, heat: 0, car: 0 });
  const F = {};
  for (const src of ["sun", "batt", "grid"]) F[src] = { house: 0, heat: 0, car: 0, charge: 0, sell: 0 };
  for (const x of day) {
    for (const [src, total] of [["sun", x.fromSun], ["batt", x.give], ["grid", x.buy - x.gridIn]]) {
      const p = parts(x, total);
      F[src].house += p.house; F[src].heat += p.heat; F[src].car += p.car;
    }
    F.sun.charge += x.charge; F.sun.sell += x.sell; F.grid.charge += x.gridIn;
  }
  const srcTotal0 = (src) => ["house", "heat", "car", "charge", "sell"].reduce((t, d) => t + F[src][d], 0);
  const dstTotal0 = (d) => ["sun", "batt", "grid"].reduce((t, src) => t + F[src][d], 0);
  // Only what the day had: a source or a use of nothing is left out.
  const srcs = ["sun", "batt", "grid"].filter((src) => srcTotal0(src) >= 0.05);
  const dsts = ["house", "heat", "car", "charge", "sell"].filter((d) => dstTotal0(d) >= 0.05);
  const srcTotal = (src) => dsts.reduce((t, d) => t + F[src][d], 0);
  const dstTotal = (d) => srcs.reduce((t, src) => t + F[src][d], 0);
  const biggest = Math.max(sum(srcs, srcTotal), sum(dsts, dstTotal));
  const s = Math.min(5.2, 250 / Math.max(1, biggest)), gap = 12, L = 66, R = 234, W = 326;
  const leftY = {}, rightY = {};
  let y = 6;
  for (const src of srcs) { leftY[src] = y; y += Math.max(srcTotal(src) * s, 2) + gap; }
  const leftH = y - gap + 6;
  y = 6;
  for (const d of dsts) { rightY[d] = y; y += Math.max(dstTotal(d) * s, 2) + gap; }
  const H = Math.ceil(Math.max(leftH, y - gap + 6)) + 8;
  const rv = { sun: "", batt: "", grid: "", sunLine: "", battLine: "", gridLine: "", nodesLeft: "", nodesRight: "" };
  const lc = { ...leftY }, rc = { ...rightY };
  const mid = (L + R) / 2;
  for (const d of dsts) {
    for (const src of srcs) {
      const w = F[src][d] * s;
      if (w < 0.4) continue;
      const ly = lc[src], ry = rc[d];
      lc[src] += w; rc[d] += w;
      rv[src] += `M${L} ${f1(ly)} C${mid} ${f1(ly)} ${mid} ${f1(ry)} ${R} ${f1(ry)} L${R} ${f1(ry + w)} C${mid} ${f1(ry + w)} ${mid} ${f1(ly + w)} ${L} ${f1(ly + w)} Z `;
      const cl = ly + w / 2, cr = ry + w / 2;
      rv[`${src}Line`] += `M${L} ${f1(cl)} C${mid} ${f1(cl)} ${mid} ${f1(cr)} ${R} ${f1(cr)} `;
    }
  }
  for (const src of srcs) rv.nodesLeft += `M${L - 5} ${f1(leftY[src])} h5 v${f1(Math.max(2, srcTotal(src) * s))} h-5 Z `;
  for (const d of dsts) rv.nodesRight += `M${R} ${f1(rightY[d])} h5 v${f1(Math.max(2, dstTotal(d) * s))} h-5 Z `;
  // Each label beside its band, and never on top of the one above it.
  const below = { true: -Infinity, false: -Infinity };
  const lab = (top, height, x, name, value, color, end) => {
    const y0 = Math.max(top + height / 2 - 2, below[end] + 30);
    below[end] = y0;
    return { x, y: f1(y0), y2: f1(y0 + 14), name, v: n1(value), color, end };
  };
  const INK = { sun: "#ffd98a", batt: "#8ff0da", grid: "#a9c6ff", house: "#cfdbd5", heat: "#ffb4a0", car: "#a6f0c6", charge: "#8ff0da", sell: "#d3bfff" };
  const labels = [
    ...srcs.map((src) => lab(leftY[src], srcTotal(src) * s, L - 10, tr(`r_${src}`), srcTotal(src), INK[src], true)),
    ...dsts.map((d) => lab(rightY[d], dstTotal(d) * s, R + 11, tr(`r_${d}`), dstTotal(d), INK[d], false)),
  ];
  const lowest = Math.max(...labels.map((l) => Number(l.y2))) + 6;
  const riverText = [carAll > 0.1 && F.sun.car / carAll >= 0.05 && tr("river_cars", { pct: Math.round((F.sun.car / carAll) * 100) }), giveAll > 0.1 && tr("river_batt", { v: n1(giveAll) })].filter(Boolean).join(" ");
  const river = { ...rv, h: Math.max(H, Math.ceil(lowest)), box: `0 0 ${W} ${Math.max(H, Math.ceil(lowest))}`, labels, aria: tr("river_aria", { sun: n1(sunAll), batt: n1(giveAll), buy: n1(buyAll) }), text: riverText };

  // The day told in one breath.
  const nightCar = sum(day, (x) => (x.h < 7 ? x.car : 0));
  const story = [
    sunAll > 0.1 && tr("st_sun", { v: n1(sunAll), pct: Math.round(((sunAll - sellAll) / sunAll) * 100) }),
    chargeAll + gridAll > 0.3 && tr("st_store", { v: n1(chargeAll + gridAll) }),
    heatAll > useAll * 0.3 && tr("st_heat", { v: n1(heatAll) }),
    carAll > 0.1 && (nightCar >= carAll / 2 ? tr("st_cars", { v: n1(carAll), pct: Math.round((nightCar / carAll) * 100) }) : tr("st_cars_sun", { v: n1(carAll), pct: Math.round((F.sun.car / carAll) * 100) })),
    tr("st_self", { pct: selfPct }),
  ].filter(Boolean).join(" ");

  // The day's light: when the sun came up and went down, for the sky of the scene.
  const lit = day.filter((x) => x.sun > 0);
  const rise = lit.length ? lit[0].h : 8, set = lit.length ? lit[lit.length - 1].h + 1 : 16;
  // The petals' scale: the biggest hour fits inside the rim.
  const most = Math.max(...day.map((x) => Math.max(x.use + x.gridIn, x.sun)));
  const k = Math.min(19, (RIM - 4 - R0) / Math.max(0.1, most));
  return { selfPct, money: moneyFigs, savedValue: saved, moments, river, story, rise, set, k, median: [...day.map((x) => x.price)].sort((a, b) => a - b) };
}

/* What changes with the picked hour: the petals, the hand, the house and the scene of the hour. */
export function hourFigures(day, figs, hf, nowH, tr, fmt) {
  const { n1, money } = fmt;
  const k = figs.k;
  const pick = day[Math.min(23, Math.floor(hf))];
  const P = { sunArea: "", sunLinePast: "", sunLineFuture: "", sunPast: "", sunFuture: "", battPast: "", battFuture: "", buyPast: "", buyFuture: "", sellPast: "", sellFuture: "", pick: "" };
  const sunPts = day.map((x) => at(R0 + x.sun * k, ang(x.h + 0.5)));
  const lit = day.filter((x) => x.sun > 0).map((x) => x.h);
  if (lit.length) {
    const first = Math.max(0, lit[0] - 1), last = Math.min(23, lit[lit.length - 1] + 1);
    const nowI = Math.max(first, Math.min(last, Math.floor(nowH - 0.5)));
    P.sunLinePast = nowI > first ? smooth(sunPts, first, nowI) : "";
    P.sunLineFuture = nowI < last ? smooth(sunPts, nowI, last) : "";
    P.sunArea = `${smooth(sunPts, first, last)} L${at(R0, ang(last + 0.5)).map(f1).join(" ")} A${R0} ${R0} 0 ${last - first > 12 ? 1 : 0} 0 ${at(R0, ang(first + 0.5)).map(f1).join(" ")} Z`;
  }
  for (const x of day) {
    const t = x.h <= nowH ? "Past" : "Future";
    let r = R0;
    P[`sun${t}`] += wedge(x.h, r, (r += x.fromSun * k));
    P[`batt${t}`] += wedge(x.h, r, (r += x.give * k));
    P[`buy${t}`] += wedge(x.h, r, (r += x.buy * k));
    if (x.sell > 0.02) P[`sell${t}`] += wedge(x.h, RIM, RIM + 4 + Math.min(x.sell, 5) * 3.5);
  }
  const top = Math.max(R0 + (pick.use + pick.gridIn) * k, R0 + pick.sun * k, pick.sell > 0.02 ? RIM + 4 + Math.min(pick.sell, 5) * 3.5 : 0) + 3;
  P.pick = wedge(pick.h, R0 - 3, top);

  const sorted = figs.median, q1 = sorted[7], q2 = sorted[15];
  const price = { lo: "", mid: "", hi: "" };
  for (const x of day) price[x.price <= q1 ? "lo" : x.price <= q2 ? "mid" : "hi"] += wedge(x.h, 64, 70.5);

  const ah = ang(hf);
  const [hx1, hy1] = at(64, ah), [hx2, hy2] = at(160, ah);
  const daylight = pick.sun > 0.05;
  const hand = { x1: f1(hx1), y1: f1(hy1), x2: f1(hx2), y2: f1(hy2), sky: `translate(${f1(hx2)} ${f1(hy2)})`, skyColor: daylight ? "#f5b52e" : "#9fb0ff", sunOn: daylight ? 1 : 0, moonOn: daylight ? 0 : 1 };

  // The streams of the picked hour.
  const dots = [];
  const stream = (value, color, from, to, spread) => {
    if (value < 0.05) return;
    const count = Math.min(7, 2 + Math.round(value * 1.6));
    const dur = Math.max(0.8, 2.0 - value * 0.25);
    const a = ah + spread;
    const [x0, y0] = at(from, a), [x1, y1] = at(to, a);
    const size = value > 2 ? 8 : 6;
    for (let i = 0; i < count; i += 1) {
      dots.push(`width:${size}px;height:${size}px;margin:-${size / 2}px 0 0 -${size / 2}px;background:${color};box-shadow:0 0 12px ${color};offset-path:path('M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y1)}');animation-duration:${dur.toFixed(2)}s;animation-delay:${(-(dur * i) / count).toFixed(2)}s`);
    }
  };
  stream(pick.fromSun, C.sun, R0 + pick.use * k + 8, 62, -0.07);
  stream(pick.give, C.batt, 30, 62, 0.07);
  stream(pick.buy - pick.gridIn, C.buy, R0 + pick.use * k + 8, 62, 0.07);
  stream(pick.gridIn, C.buy, R0 + (pick.use + pick.gridIn) * k + 8, 26, 0);
  stream(pick.charge, C.batt, 62, 26, -0.07);
  stream(pick.sell, C.sell, 62, RIM + 20, 0);

  // The battery as water in the house, and a ring that is the hour's own share.
  const level = 58 - (pick.soc / 100) * 116;
  const wavePath = (lv, amp) => {
    let d = `M-60 ${f1(lv)}`;
    for (let x = -60; x < 180; x += 30) d += ` Q${x + 15} ${f1(((x + 60) / 30) % 2 === 0 ? lv - amp : lv + amp)} ${x + 30} ${f1(lv)}`;
    return `${d} V62 H-60 Z`;
  };
  const own = pick.use > 0 ? (pick.fromSun + pick.give) / pick.use : 0;
  const ringLen = 2 * Math.PI * 60;
  const future = pick.h > nowH;
  const when = (h) => `${future ? `${tr("forecast")} ` : tr("at") ? `${tr("at")} ` : ""}${pad(h)}–${pad(h + 1)}`;
  let big, word, wordColor;
  if (pick.sell > 0.05) [big, word, wordColor] = [n1(pick.sell), tr("kwh_sold"), "#d3bfff"];
  else if (pick.buy > 0.05) [big, word, wordColor] = [n1(pick.buy), tr("kwh_bought"), "#a9c6ff"];
  else [big, word, wordColor] = [`${Math.round(own * 100)} %`, tr("own"), "#ffd98a"];
  const orb = {
    wave: wavePath(level, 4), wave2: wavePath(level - 3, 3), when: when(pick.h), big, word, wordStyle: `color:${wordColor}`,
    battery: tr("battery", { pct: Math.round(pick.soc) }), ring: own > 0.5 ? "#f5b52e" : "#4d8dff", ringDash: `${f1(ringLen * Math.max(0.02, own))} ${f1(ringLen)}`,
  };

  // The sky of the hour, from the day's own sunrise and sunset.
  const t = hf, rise = figs.rise - 0.5, set = figs.set + 0.5;
  const glow = t < rise - 1.5 || t >= set + 3 ? "#2f43a8" : t < rise + 1.5 ? "#ff8a5c" : t < set - 2.5 ? "#ffc94a" : t < set + 0.5 ? "#ff6f6b" : "#8a4fd1";
  const glowStyle = `background:radial-gradient(circle at 50% 50%, ${glow}66 0%, ${glow}1f 45%, transparent 70%)`;
  const SKY = t < rise - 1.5 || t >= set + 3 ? ["#0b1330", "#1b2a55"] : t < rise + 1 ? ["#2a2e63", "#f08a5d"] : t < rise + 3.5 ? ["#5c9bd6", "#f6c99a"] : t < set - 2.5 ? ["#3e8fd9", "#a8d6f5"] : t < set ? ["#4a6fb5", "#f3a06a"] : t < set + 1.5 ? ["#2b2d6e", "#c45a7c"] : ["#121a3d", "#3a3577"];

  // The picked hour, in one sentence.
  const said = [];
  if (pick.sun > 0.05) said.push(tr("s_sun", { v: n1(pick.sun) }));
  if (pick.charge > 0.05) said.push(tr("s_charge", { v: n1(pick.charge) }));
  if (pick.gridIn > 0.05) said.push(tr("s_grid_charge", { v: n1(pick.gridIn) }));
  if (pick.give > 0.05) said.push(tr("s_give", { v: n1(pick.give) }));
  if (pick.heat > 0.8) said.push(tr("s_heat", { v: n1(pick.heat) }));
  if (pick.car > 0.05) said.push(tr("s_car", { v: n1(pick.car) }));
  if (pick.sell > 0.05) said.push(tr("s_sell", { v: n1(pick.sell), money: money(pick.sell * pick.sellPrice) }));
  if (pick.buy > 0.05) said.push(tr("s_buy", { v: n1(pick.buy), money: money(pick.buy * pick.price) }));
  const sentence = said.length ? `${said.join(", ").replace(/^./, (c) => c.toUpperCase())}.`.replace(/\.\.$/, ".") : tr("quiet");
  const tier = pick.price <= q1 ? [tr("cheap"), "#3ccf91"] : pick.price <= q2 ? [tr("normal"), "#d9c35a"] : [tr("dear"), "#ff6b57"];
  const hour = {
    title: when(pick.h),
    price: `${money(pick.price)} · ${tier[0]}`,
    priceStyle: `background:${tier[1]}2e;box-shadow:inset 0 0 0 1px ${tier[1]}77`,
    text: sentence,
    aria: tr("house_at", { when: future ? tr("in_forecast") : "", h: pad(pick.h), said: sentence }),
  };

  // The scene: the sun or the moon on its arc, the battery's level, the wires.
  const isDay = t >= rise && t < set;
  const len = set - rise;
  const arcT = isDay ? (t - rise) / len : (((t - set) % 24) + 24) % 24 / (24 - len);
  const sx = 26 + arcT * 274, sy = 58 - Math.sin(arcT * Math.PI) * 40;
  const battH = Math.max(2, (pick.soc / 100) * 34);
  const sunOn = pick.sun > 0.05;
  const dur = (v) => `${Math.max(0.35, 1.4 - v * 0.22).toFixed(2)}s`;
  const charging = pick.charge + pick.gridIn;
  const scene = {
    skyTop: SKY[0], skyLow: SKY[1], stars: isDay ? 0 : 1, clouds: isDay ? 1 : 0.25,
    sunAt: `translate(${f1(sx)} ${f1(sy)})`, orbColor: isDay ? "#ffd36b" : "#dfe6ff", sunOn: isDay ? 1 : 0, moonOn: isDay ? 0 : 1,
    beam: sunOn ? `M${f1(sx)} ${f1(sy + 10)} L163 72` : "M0 0", beamStyle: `opacity:${sunOn ? 0.9 : 0};animation-duration:${dur(pick.sun)}`,
    glint: sunOn ? 1 : 0, window: isDay ? "#a9c7d8" : "#ffd27a",
    battY: f1(132 - battH), battH: f1(battH), battBolt: charging + pick.give > 0.05 ? 1 : 0,
    fanStyle: `animation-duration:${Math.max(0.25, 2.4 - pick.heat * 1.5).toFixed(2)}s;animation-play-state:${pick.heat > 0.05 ? "running" : "paused"}`,
    carOn: pick.car > 0.05 ? 1 : 0,
  };
  const wire = (back, value) => `opacity:${value > 0.05 ? 1 : 0};animation-duration:${dur(value)};animation-name:${back ? "evp-runback" : "evp-run"}`;
  const gridIn = pick.buy > 0.05, gridOut = pick.sell > 0.05;
  const wires = {
    grid: wire(gridOut, gridIn ? pick.buy : pick.sell), gridColor: gridOut ? "#b38bff" : "#6fa3ff", gridOn: gridIn || gridOut ? 1 : 0,
    batt: wire(charging > 0.05, pick.give > 0.05 ? pick.give : charging),
    heat: wire(false, pick.heat),
    car: wire(false, pick.car),
  };
  const chip = (label, value, color, on) => ({ label, value, style: `background:${on ? `${color}24` : "rgba(238,243,240,.04)"}`, ink: `color:${on ? color : "#8fa39a"}` });
  const chips = [
    chip(gridOut ? tr("c_sell") : tr("c_buy"), n1(gridOut ? pick.sell : pick.buy), gridOut ? "#c9adff" : "#a9c6ff", gridIn || gridOut),
    chip(charging > 0.05 ? tr("c_charge") : pick.give > 0.05 ? tr("c_give") : tr("c_batt"), `${Math.round(pick.soc)} %`, "#8ff0da", charging + pick.give > 0.05),
    chip(tr("c_sun"), n1(pick.sun), "#ffd98a", sunOn),
    chip(tr("c_heat"), n1(pick.heat), "#ffb4a0", pick.heat > 0.05),
    chip(tr("c_car"), n1(pick.car), "#a6f0c6", pick.car > 0.05),
  ];

  const moments = figs.moments.map((m) => {
    const on = hf >= m.at[0] && hf < m.at[1];
    return { style: `border-color:${on ? `${m.color}99` : "rgba(238,243,240,.08)"};background:${on ? `${m.color}1f` : "rgba(238,243,240,.04)"}` };
  });
  return { petals: P, price, hand, dots, orb, glowStyle, hour, scene, wires, chips, moments, dial: tr("dial", { hour: hour.title }) };
}

/* The marks of the moments on the inner ring. */
const markAt = (m) => {
  const [x, y] = at(67, ang((m.at[0] + m.at[1]) / 2));
  return { x: f1(x), y: f1(y), ty: f1(y + 3.2) };
};

const STYLE = `
:host { display: block; color: #eef3f0; font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
* { box-sizing: border-box; }
@property --evp-sweep { syntax: '<percentage>'; inherits: false; initial-value: 100%; }
@keyframes evp-sweep { from { --evp-sweep: 0%; } to { --evp-sweep: 100%; } }
@keyframes evp-flow { from { offset-distance: 0%; opacity: 0; transform: scale(.5); } 15% { opacity: 1; transform: scale(1); } 85% { opacity: 1; } to { offset-distance: 100%; opacity: 0; transform: scale(.6); } }
@keyframes evp-wave { from { transform: translateX(0); } to { transform: translateX(-60px); } }
@keyframes evp-wave2 { from { transform: translateX(-30px); } to { transform: translateX(-90px); } }
@keyframes evp-breathe { 0%, 100% { opacity: .6; transform: scale(1); } 50% { opacity: .9; transform: scale(1.05); } }
@keyframes evp-ping { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.2); opacity: 0; } }
@keyframes evp-stream { to { stroke-dashoffset: -42; } }
@keyframes evp-layer { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
@keyframes evp-spin { to { transform: rotate(360deg); } }
@keyframes evp-run { to { stroke-dashoffset: -20; } }
@keyframes evp-runback { to { stroke-dashoffset: 20; } }
@keyframes evp-fan { to { transform: rotate(360deg); } }
@keyframes evp-blink { 0%, 100% { fill-opacity: 1; } 50% { fill-opacity: .25; } }
@keyframes evp-glint { 0% { transform: skewX(-35deg) translateX(0); } 60%, 100% { transform: skewX(-35deg) translateX(120px); } }
@keyframes evp-cloud { from { transform: translateX(-20px); } to { transform: translateX(20px); } }
@keyframes evp-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.sweep { position: absolute; inset: 0; -webkit-mask-image: conic-gradient(from 0deg at 50% 50%, #000 var(--evp-sweep), transparent var(--evp-sweep)); mask-image: conic-gradient(from 0deg at 50% 50%, #000 var(--evp-sweep), transparent var(--evp-sweep)); animation: evp-sweep 1.8s cubic-bezier(.45,.05,.25,1) both; }
.wave { animation: evp-wave 3.6s linear infinite; }
.wave2 { animation: evp-wave2 5.2s linear infinite; }
.glow { position: absolute; inset: 14px; border-radius: 50%; filter: blur(20px); transition: background .8s ease; animation: evp-breathe 6s ease-in-out infinite; }
.ping { animation: evp-ping 2.4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.stream { stroke-dasharray: 1.5 12.5; animation: evp-stream 1.4s linear infinite; }
.layer { animation: evp-layer .7s cubic-bezier(.2,.8,.2,1) both; transform-box: view-box; transform-origin: 22px 80px; }
.rays { animation: evp-spin 24s linear infinite; transform-box: fill-box; transform-origin: center; }
.run { animation: evp-run 1s linear infinite; }
.fan { transform-box: view-box; transform-origin: 228px 118px; animation: evp-fan 1.6s linear infinite; }
.blink { animation: evp-blink 1.4s ease-in-out infinite; }
.glint { animation: evp-glint 3.2s ease-in-out infinite; }
.cloud { animation: evp-cloud 14s ease-in-out infinite alternate; }
.dot { position: absolute; left: 0; top: 0; border-radius: 50%; offset-rotate: 0deg; pointer-events: none; animation-name: evp-flow; animation-timing-function: linear; animation-iteration-count: infinite; }
@media (prefers-reduced-motion: reduce) { .sweep, .wave, .wave2, .glow, .ping, .stream, .layer, .rays, .run, .fan, .blink, .glint, .cloud, .dot, .root > * { animation: none !important; } .dot { opacity: 0; } }
button { font: inherit; color: inherit; }
button:focus-visible { outline: 2px solid #eef3f0; outline-offset: 2px; }
.root { width: min(100%, 420px); margin: 0 auto; padding: 18px max(16px, env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); display: flex; flex-direction: column; gap: 16px; }
.root > * { flex-shrink: 0; animation: evp-in .5s cubic-bezier(.2,.8,.2,1) both; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 0 4px; }
.head-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.kicker { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #8fa39a; }
.kicker b { color: #7fe0c0; }
h1 { margin: 0; font-family: "Space Grotesk", Inter, sans-serif; font-size: 30px; font-weight: 600; letter-spacing: -.02em; line-height: 1.05; text-wrap: balance; }
.headline { font-size: 13px; color: #a7b5ad; }
.head-btns { display: flex; gap: 8px; flex: none; }
.pill { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; min-width: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(238,243,240,.18); background: rgba(238,243,240,.06); font-weight: 600; font-size: 13px; cursor: pointer; }
.pill.icon { padding: 0; }
.pill svg { flex: none; }
.seasons { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 999px; background: rgba(238,243,240,.06); border: 1px solid rgba(238,243,240,.08); }
.seasons button { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; border: 0; border-radius: 999px; background: transparent; color: #a7b5ad; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .3s ease, color .3s ease; min-width: 0; }
.seasons button[aria-pressed="true"] { background: #eef3f0; color: #070b0a; }
.seasons svg { flex: none; }
.flower-wrap { position: relative; width: 100%; max-width: 360px; align-self: center; }
.flower { position: absolute; left: 0; top: 0; width: 360px; height: 360px; transform-origin: 0 0; }
.flower > svg, .flower > .scrub { position: absolute; inset: 0; }
.center { position: absolute; left: 124px; top: 124px; width: 112px; height: 112px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; text-align: center; pointer-events: none; }
.center .when { font-size: 11px; font-weight: 600; color: #e1ece7; font-variant-numeric: tabular-nums; text-shadow: 0 1px 6px rgba(0,0,0,.7); }
.center b { font-family: "Space Grotesk", Inter, sans-serif; font-size: 27px; font-weight: 600; line-height: 1.05; letter-spacing: -.02em; font-variant-numeric: tabular-nums; text-shadow: 0 1px 10px rgba(0,0,0,.65); }
.center .word { font-size: 11px; font-weight: 700; text-shadow: 0 1px 6px rgba(0,0,0,.7); }
.center .batt { font-size: 10px; color: #e1ece7; text-shadow: 0 1px 6px rgba(0,0,0,.8); font-variant-numeric: tabular-nums; }
.scrub { border-radius: 50%; touch-action: none; cursor: grab; }
.keys { display: flex; flex-direction: column; gap: 8px; margin-top: -4px; }
.key { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 12px; font-size: 11px; color: #cfdbd5; }
.key span { display: inline-flex; align-items: center; gap: 5px; }
.key i { width: 10px; height: 10px; border-radius: 3px; }
.hint-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
.hint { margin: 0; text-align: center; font-size: 12px; color: #8fa39a; }
.help { flex: none; width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(238,243,240,.25); background: transparent; color: #cfdbd5; font-size: 12px; font-weight: 700; cursor: pointer; display: grid; place-items: center; padding: 0; }
.help[aria-expanded="true"] { background: #eef3f0; color: #070b0a; }
.bubble[hidden] { display: none; }
.bubble { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 22px; background: rgba(238,243,240,.07); border: 1px solid rgba(238,243,240,.12); }
.bubble svg { width: 100%; height: auto; }
.bubble p { margin: 0; font-size: 12px; line-height: 1.5; color: #a7b5ad; }
.card { display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 24px; background: rgba(238,243,240,.05); border: 1px solid rgba(238,243,240,.08); overflow: hidden; }
.hour-card { height: 372px; }
.hour-top { flex: none; height: 26px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hour-top b { font-family: "Space Grotesk", Inter, sans-serif; font-size: 17px; font-weight: 600; font-variant-numeric: tabular-nums; }
.tier { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; transition: background .4s ease, box-shadow .4s ease; }
.scene { flex: none; position: relative; height: 176px; border-radius: 18px; overflow: hidden; }
.scene svg { display: block; width: 100%; height: 176px; }
.chips { flex: none; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; height: 48px; }
.chip { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border-radius: 12px; min-width: 0; transition: background .4s ease; }
.chip span { font-size: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; padding: 0 2px; }
.chip b { font-family: "Space Grotesk", Inter, sans-serif; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.said { flex: none; margin: 0; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 13px; line-height: 20px; color: #cfdbd5; }
.money { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.money div { display: flex; flex-direction: column; gap: 4px; padding: 14px 12px; border-radius: 20px; min-width: 0; }
.money span { font-size: 11px; font-weight: 600; }
.money b { font-family: "Space Grotesk", Inter, sans-serif; font-size: 19px; line-height: 1.15; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.money small { font-size: 11px; color: #a7b5ad; font-variant-numeric: tabular-nums; }
.label { padding: 0 4px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #8fa39a; }
.moments { display: flex; flex-direction: column; gap: 6px; }
.moment { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 56px; padding: 10px 12px; border-radius: 18px; border: 1px solid rgba(238,243,240,.08); background: rgba(238,243,240,.04); cursor: pointer; text-align: left; transition: background .3s ease, border-color .3s ease; }
.moment .n { flex: none; width: 22px; height: 22px; border-radius: 50%; background: #eef3f0; color: #070b0a; font-weight: 700; font-size: 11px; display: grid; place-items: center; }
.moment .bar { flex: none; width: 4px; align-self: stretch; border-radius: 2px; }
.moment .txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.moment .txt b { font-size: 13px; font-weight: 600; }
.moment .txt span { font-size: 12px; line-height: 1.4; color: #a7b5ad; }
.moment .at { margin-left: auto; flex: none; font-size: 12px; font-weight: 600; color: #cfdbd5; font-variant-numeric: tabular-nums; }
.river svg { width: 100%; height: auto; }
.river b { font-family: "Space Grotesk", Inter, sans-serif; font-size: 17px; font-weight: 600; }
.river .sub { font-size: 12px; color: #8fa39a; }
.river p { margin: 0; font-size: 12px; line-height: 1.5; color: #a7b5ad; }
.story { padding: 16px; border-radius: 22px; background: linear-gradient(150deg, rgba(245,181,46,.12), rgba(77,141,255,.08) 60%, rgba(166,120,255,.10)); display: flex; flex-direction: column; gap: 10px; }
.story p { margin: 0; font-family: "Space Grotesk", Inter, sans-serif; font-size: 18px; line-height: 1.35; font-weight: 500; letter-spacing: -.01em; }
.sample { margin: 0; padding: 0 4px; font-size: 11px; color: #6f8279; }
`;

const ICON = {
  play: "M3 1.5 L12 7 L3 12.5 Z",
  stop: "M3 2 H5.5 V12 H3 Z M8.5 2 H11 V12 H8.5 Z",
  close: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5" stroke="#eef3f0" stroke-width="1.8" stroke-linecap="round"/></svg>',
  winter: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M7 1v12M1.8 4l10.4 6M1.8 10l10.4-6M5.3 1.8 7 3.4l1.7-1.6M5.3 12.2 7 10.6l1.7 1.6"/></svg>',
  spring: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13V7M7 7c0-3 2-5 5-5 0 3-2 5-5 5ZM7 9C7 6.8 5.4 5 3 5c0 2.4 1.6 4 4 4Z"/></svg>',
  summer: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="7" cy="7" r="2.6"/><path d="M7 .9v1.6M7 11.5v1.6M.9 7h1.6M11.5 7h1.6M2.7 2.7l1.1 1.1M10.2 10.2l1.1 1.1M2.7 11.3l1.1-1.1M10.2 3.8l1.1-1.1"/></svg>',
  autumn: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12 12 2M12 2c-6 0-9 3-9 7v1h1c4 0 8-3 8-8Z"/></svg>',
};

/* The page: a template with bindings (b-attr="path" sets an attribute, b-text="path" the text) that are
   filled with the figures of the picked hour, so a change of hour touches only what changed. */
function template(tr, figs) {
  const marks = figs.moments.map((m, i) => {
    const p = markAt(m);
    return `${i === 0 ? `<circle cx="${p.x}" cy="${p.y}" r="7" fill="none" stroke="#eef3f0" class="ping"></circle>` : ""}<circle cx="${p.x}" cy="${p.y}" r="7" fill="#eef3f0"></circle><text x="${p.x}" y="${p.ty}" text-anchor="middle" font-size="9" font-weight="700" fill="#070b0a">${i + 1}</text>`;
  }).join("");
  const q = (id, key) => `<text font-size="9" font-weight="700" letter-spacing="2.4" fill="#6f8279"><textPath href="#evp-${id}" startOffset="50%" text-anchor="middle">${esc(tr(key))}</textPath></text>`;
  const r = figs.river;
  const riverLabels = r.labels.map((l) => `<text x="${l.x}" y="${l.y}"${l.end ? ' text-anchor="end"' : ""} font-size="11" font-weight="600" fill="${l.color}">${esc(l.name)}</text><text x="${l.x}" y="${l.y2}"${l.end ? ' text-anchor="end"' : ""} font-size="12" font-weight="700" fill="#eef3f0" font-family="Space Grotesk, Inter, sans-serif">${esc(l.v)}</text>`).join("");
  const moments = figs.moments.map((m, i) => `<button type="button" class="moment" data-moment="${i}" b-style="moments.${i}.style">
      <span class="n">${i + 1}</span><span class="bar" style="background:${m.color}"></span>
      <span class="txt"><b>${esc(m.title)}</b><span>${esc(m.text)}</span></span><span class="at">${pad(m.at[0])}–${pad(m.at[1])}</span></button>`).join("");
  const chips = [0, 1, 2, 3, 4].map((i) => `<div class="chip" b-style="chips.${i}.style"><span b-style="chips.${i}.ink" b-text="chips.${i}.label"></span><b b-text="chips.${i}.value"></b></div>`).join("");
  // One petal taken apart, pointing right from the house.
  const A = (rr, deg) => [22 + rr * Math.cos((deg * Math.PI) / 180), 80 + rr * Math.sin((deg * Math.PI) / 180)];
  const aw = (ra, rb) => {
    const [x0, y0] = A(ra, -14), [x1, y1] = A(rb, -14), [x2, y2] = A(rb, 14), [x3, y3] = A(ra, 14);
    return `M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y1)} A${rb} ${rb} 0 0 1 ${f1(x2)} ${f1(y2)} L${f1(x3)} ${f1(y3)} A${ra} ${ra} 0 0 0 ${f1(x0)} ${f1(y0)} Z`;
  };
  const arcA = (rr, d) => { const [x0, y0] = A(rr, -d), [x1, y1] = A(rr, d); return `M${f1(x0)} ${f1(y0)} A${rr} ${rr} 0 0 1 ${f1(x1)} ${f1(y1)}`; };
  const lead = (rr, deg, tx, ty) => { const [x, y] = A(rr, deg); return `M${f1(x)} ${f1(y)} L${tx} ${ty} `; };
  const day = (key) => `<button type="button" data-season="${key}" aria-pressed="false">${ICON[key]}<span>${esc(tr(key))}</span></button>`;
  return `
  <div class="root">
    <div class="head">
      <div class="head-text">
        <span class="kicker">${esc(tr("kicker"))}</span>
        <h1>${esc(tr("title"))}</h1>
        <span class="headline" b-text="headline"></span>
      </div>
      <div class="head-btns">
        <button type="button" class="pill play" data-act="play" b-aria-label="playLabel"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path b-d="playIcon" fill="#eef3f0"></path></svg><span b-text="playText"></span></button>
        <button type="button" class="pill icon" data-act="close" aria-label="${esc(tr("close"))}">${ICON.close}</button>
      </div>
    </div>
    <div class="seasons" role="group" aria-label="${esc(tr("seasons_label"))}">${SEASON_ORDER.map(day).join("")}</div>

    <div class="flower-wrap">
      <div class="flower">
        <div class="glow" aria-hidden="true" b-style="glowStyle"></div>
        <div class="sweep">
          <svg width="360" height="360" viewBox="0 0 360 360" aria-hidden="true">
            <path b-d="petals.sunArea" fill="#f5b52e" fill-opacity=".10"></path>
            <path b-d="petals.sunPast" fill="#f5b52e"></path>
            <path b-d="petals.battPast" fill="#2cc9a8"></path>
            <path b-d="petals.buyPast" fill="#4d8dff"></path>
            <path b-d="petals.sellPast" fill="#a678ff"></path>
            <g opacity=".34">
              <path b-d="petals.sunFuture" fill="#f5b52e"></path>
              <path b-d="petals.battFuture" fill="#2cc9a8"></path>
              <path b-d="petals.buyFuture" fill="#4d8dff"></path>
              <path b-d="petals.sellFuture" fill="#a678ff"></path>
            </g>
            <path b-d="petals.sunLinePast" fill="none" stroke="#ffd36b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
            <path b-d="petals.sunLineFuture" fill="none" stroke="#ffd36b" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"></path>
          </svg>
        </div>
        <svg width="360" height="360" viewBox="0 0 360 360" role="img" b-aria-label="dial" font-family="Inter, sans-serif">
          <defs>
            <clipPath id="evp-orb"><circle cx="0" cy="0" r="58"></circle></clipPath>
            <linearGradient id="evp-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46e6c3"></stop><stop offset="1" stop-color="#0c7d69"></stop></linearGradient>
            <radialGradient id="evp-orbfill" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#1f2d28"></stop><stop offset="1" stop-color="#0a110f"></stop></radialGradient>
          </defs>
          <circle cx="180" cy="180" r="152" fill="none" stroke="rgba(238,243,240,.10)" stroke-width="1" stroke-dasharray="1 5"></circle>
          <path b-d="price.lo" fill="#3ccf91"></path>
          <path b-d="price.mid" fill="#d9c35a"></path>
          <path b-d="price.hi" fill="#ff6b57"></path>
          <path id="evp-q1" d="${quarterArc(0.7, 5.3, 167, false)}" fill="none"></path>
          <path id="evp-q2" d="${quarterArc(6.7, 11.3, 175, true)}" fill="none"></path>
          <path id="evp-q3" d="${quarterArc(12.7, 17.3, 175, true)}" fill="none"></path>
          <path id="evp-q4" d="${quarterArc(18.7, 23.3, 167, false)}" fill="none"></path>
          ${q("q1", "q1")}${q("q2", "q2")}${q("q3", "q3")}${q("q4", "q4")}
          <path b-d="petals.pick" fill="rgba(238,243,240,.06)" stroke="#eef3f0" stroke-width="1.6" stroke-linejoin="round"></path>
          <text x="180" y="16" text-anchor="middle" font-size="10" font-weight="600" fill="#8fa39a">00</text>
          <text x="350" y="184" text-anchor="end" font-size="10" font-weight="600" fill="#8fa39a">06</text>
          <text x="180" y="354" text-anchor="middle" font-size="10" font-weight="600" fill="#8fa39a">12</text>
          <text x="10" y="184" font-size="10" font-weight="600" fill="#8fa39a">18</text>
          <line b-x1="hand.x1" b-y1="hand.y1" b-x2="hand.x2" b-y2="hand.y2" stroke="#eef3f0" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 4"></line>
          <g b-transform="hand.sky">
            <circle r="11" fill="#070b0a" b-stroke="hand.skyColor" stroke-width="1.6"></circle>
            <g class="rays" b-opacity="hand.sunOn"><path d="M0 -8 V-6 M0 6 V8 M-8 0 H-6 M6 0 H8 M-5.7 -5.7 L-4.2 -4.2 M4.2 4.2 L5.7 5.7 M-5.7 5.7 L-4.2 4.2 M4.2 -4.2 L5.7 -5.7" stroke="#f5b52e" stroke-width="1.6" stroke-linecap="round"></path></g>
            <circle r="3.4" fill="#f5b52e" b-opacity="hand.sunOn"></circle>
            <path d="M2.5 -5.5 A6 6 0 1 0 5.5 3 A4.6 4.6 0 0 1 2.5 -5.5 Z" fill="#c9d4ff" b-opacity="hand.moonOn"></path>
          </g>
          <g class="marks" b-opacity="marksOn" style="transition: opacity .6s ease">${marks}</g>
          <g transform="translate(180,180)">
            <circle r="60" fill="url(#evp-orbfill)" stroke="rgba(238,243,240,.18)" stroke-width="1"></circle>
            <g clip-path="url(#evp-orb)">
              <g class="wave2"><path b-d="orb.wave2" fill="#46e6c3" fill-opacity=".28"></path></g>
              <g class="wave"><path b-d="orb.wave" fill="url(#evp-liquid)" fill-opacity=".9"></path></g>
            </g>
            <circle r="60" fill="none" b-stroke="orb.ring" stroke-width="2.4" stroke-linecap="round" b-stroke-dasharray="orb.ringDash" transform="rotate(-90)" style="transition: stroke-dasharray .4s ease"></circle>
          </g>
        </svg>
        <div class="dots" aria-hidden="true"></div>
        <div class="center">
          <span class="when" b-text="orb.when"></span>
          <b b-text="orb.big"></b>
          <span class="word" b-style="orb.wordStyle" b-text="orb.word"></span>
          <span class="batt" b-text="orb.battery"></span>
        </div>
        <div class="scrub" aria-hidden="true"></div>
      </div>
    </div>

    <div class="keys">
      <div class="key">
        <span><i style="background:#f5b52e"></i>${esc(tr("key_sun"))}</span>
        <span><i style="background:#2cc9a8"></i>${esc(tr("key_batt"))}</span>
        <span><i style="background:#4d8dff"></i>${esc(tr("key_buy"))}</span>
        <span><i style="background:#a678ff"></i>${esc(tr("key_sell"))}</span>
        <span><i style="width:14px;height:2px;border-radius:1px;background:#ffd36b"></i>${esc(tr("key_gave"))}</span>
        <span><i style="width:22px;height:6px;border-radius:3px;background:linear-gradient(90deg,#3ccf91,#d9c35a,#ff6b57)"></i>${esc(tr("key_price"))}</span>
      </div>
      <div class="hint-row"><p class="hint">${esc(tr("hint"))}</p><button type="button" class="help" data-act="help" aria-expanded="false" aria-label="${esc(tr("help"))}">?</button></div>
      <div class="bubble" hidden>
        <b>${esc(tr("help"))}</b>
        <svg viewBox="0 0 326 160" role="img" aria-label="${esc(tr("a_aria"))}" font-family="Inter, sans-serif">
          <path class="layer" style="animation-delay:.1s" d="${aw(24, 236)}" fill="#f5b52e" fill-opacity=".10"></path>
          <path class="layer" style="animation-delay:.2s" d="${arcA(236, 14)}" fill="none" stroke="#ffd36b" stroke-width="2" stroke-linecap="round"></path>
          <path class="layer" style="animation-delay:.3s" d="${aw(24, 104)}" fill="#f5b52e"></path>
          <path class="layer" style="animation-delay:.5s" d="${aw(104, 150)}" fill="#2cc9a8"></path>
          <path class="layer" style="animation-delay:.7s" d="${aw(150, 204)}" fill="#4d8dff"></path>
          <path class="layer" style="animation-delay:.9s" d="${aw(258, 296)}" fill="#a678ff"></path>
          <path d="${arcA(250, 22)}" fill="none" stroke="rgba(238,243,240,.35)" stroke-dasharray="1 4"></path>
          <path d="${lead(66, -8, 88, 26) + lead(128, 8, 150, 140) + lead(178, -8, 196, 26) + lead(225, 8, 236, 140) + lead(278, -8, 290, 26)}" fill="none" stroke="rgba(238,243,240,.4)" stroke-width="1"></path>
          <circle cx="22" cy="80" r="16" fill="#0f1a16" stroke="rgba(238,243,240,.25)"></circle>
          <path d="M16 81 L22 75 L28 81 M18 79.5 V86 H26 V79.5" fill="none" stroke="#eef3f0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>
          <text x="88" y="20" font-size="11" fill="#ffd98a" text-anchor="middle">${esc(tr("a_sun"))}</text>
          <text x="150" y="152" font-size="11" fill="#8ff0da" text-anchor="middle">${esc(tr("a_batt"))}</text>
          <text x="196" y="20" font-size="11" fill="#a9c6ff" text-anchor="middle">${esc(tr("a_buy"))}</text>
          <text x="236" y="152" font-size="11" fill="#ffd98a" fill-opacity=".85" text-anchor="middle">${esc(tr("a_gave"))}</text>
          <text x="290" y="20" font-size="11" fill="#d3bfff" text-anchor="middle">${esc(tr("a_sell"))}</text>
          <text x="22" y="112" font-size="10" fill="#8fa39a" text-anchor="middle">${esc(tr("a_house"))}</text>
        </svg>
        <p>${esc(tr("help_text"))}</p>
      </div>
    </div>

    <div class="card hour-card">
      <div class="hour-top"><b b-text="hour.title"></b><span class="tier" b-style="hour.priceStyle" b-text="hour.price"></span></div>
      <div class="scene">
        <svg viewBox="0 0 326 176" preserveAspectRatio="xMidYMid slice" role="img" b-aria-label="hour.aria">
          <defs>
            <linearGradient id="evp-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" b-stop-color="scene.skyTop" style="transition: stop-color .8s ease"></stop>
              <stop offset="1" b-stop-color="scene.skyLow" style="transition: stop-color .8s ease"></stop>
            </linearGradient>
            <linearGradient id="evp-panel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22355f"></stop><stop offset="1" stop-color="#101a33"></stop></linearGradient>
            <linearGradient id="evp-glintg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"></stop><stop offset=".5" stop-color="#ffffff" stop-opacity=".75"></stop><stop offset="1" stop-color="#ffffff" stop-opacity="0"></stop></linearGradient>
            <linearGradient id="evp-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ece6"></stop><stop offset="1" stop-color="#c9cfc8"></stop></linearGradient>
            <linearGradient id="evp-cell" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0c7d69"></stop><stop offset="1" stop-color="#46e6c3"></stop></linearGradient>
            <clipPath id="evp-roof"><path d="M128 84 L163 58 L198 84 Z"></path></clipPath>
            <clipPath id="evp-batt"><rect x="84" y="98" width="24" height="34" rx="4"></rect></clipPath>
          </defs>
          <rect x="0" y="0" width="326" height="176" fill="url(#evp-sky)"></rect>
          <g b-opacity="scene.stars" fill="#ffffff" style="transition: opacity .8s ease">
            <circle cx="24" cy="18" r="1"></circle><circle cx="66" cy="34" r=".8"></circle><circle cx="118" cy="14" r="1.1"></circle>
            <circle cx="210" cy="22" r=".9"></circle><circle cx="252" cy="10" r="1.2"></circle><circle cx="300" cy="30" r=".8"></circle>
            <circle cx="160" cy="36" r=".7"></circle><circle cx="280" cy="52" r=".9"></circle><circle cx="40" cy="56" r=".7"></circle>
          </g>
          <g class="cloud" b-opacity="scene.clouds">
            <path d="M40 46 a10 10 0 0 1 18 -4 a8 8 0 0 1 14 5 a6 6 0 0 1 -2 12 h-28 a7 7 0 0 1 -2 -13 Z" fill="#ffffff" fill-opacity=".55"></path>
            <path d="M210 30 a8 8 0 0 1 14 -3 a6 6 0 0 1 11 4 a5 5 0 0 1 -2 9 h-22 a5.5 5.5 0 0 1 -1 -10 Z" fill="#ffffff" fill-opacity=".4"></path>
          </g>
          <g b-transform="scene.sunAt" style="transition: transform .5s ease">
            <circle r="22" b-fill="scene.orbColor" fill-opacity=".18"></circle>
            <g class="rays" b-opacity="scene.sunOn"><path d="M0 -19 V-14 M0 14 V19 M-19 0 H-14 M14 0 H19 M-13.4 -13.4 L-10 -10 M10 10 L13.4 13.4 M-13.4 13.4 L-10 10 M10 -10 L13.4 -13.4" stroke="#ffd36b" stroke-width="2" stroke-linecap="round"></path></g>
            <circle r="9" b-fill="scene.orbColor"></circle>
            <circle r="7" cx="4" cy="-3" b-fill="scene.skyTop" b-opacity="scene.moonOn"></circle>
          </g>
          <path b-d="scene.beam" stroke="#ffd36b" stroke-width="1.4" stroke-dasharray="2 6" class="run" b-style="scene.beamStyle" fill="none"></path>
          <path d="M0 132 Q163 124 326 132 V176 H0 Z" fill="#14201b"></path>
          <path d="M0 132 Q163 124 326 132" fill="none" stroke="rgba(238,243,240,.10)"></path>
          <path d="M30 132 V146 H150 V132" fill="none" stroke="rgba(238,243,240,.10)" stroke-width="5" stroke-linejoin="round"></path>
          <path d="M96 132 V142 H156 V132" fill="none" stroke="rgba(238,243,240,.10)" stroke-width="5" stroke-linejoin="round"></path>
          <path d="M232 132 V142 H172 V132" fill="none" stroke="rgba(238,243,240,.10)" stroke-width="5" stroke-linejoin="round"></path>
          <path d="M292 132 V150 H176 V132" fill="none" stroke="rgba(238,243,240,.10)" stroke-width="5" stroke-linejoin="round"></path>
          <path d="M30 132 V146 H150 V132" fill="none" b-stroke="wires.gridColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 7" class="run" b-style="wires.grid"></path>
          <path d="M96 132 V142 H156 V132" fill="none" stroke="#46e6c3" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 7" class="run" b-style="wires.batt"></path>
          <path d="M172 132 V142 H232 V132" fill="none" stroke="#ff8a6b" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 7" class="run" b-style="wires.heat"></path>
          <path d="M176 132 V150 H292 V132" fill="none" stroke="#6ee6a2" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 7" class="run" b-style="wires.car"></path>
          <g transform="translate(30 0)" stroke="#9fb0c8" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M-12 132 L-3 72 L3 72 L12 132 M-8 106 L8 106 M-10 120 L10 120 M-6 90 L6 90 M-9 106 L6 90 M9 106 L-6 90 M-11 120 L8 106 M11 120 L-8 106"></path>
            <path d="M-16 80 H16 M-12 76 V82 M12 76 V82"></path>
            <path d="M-16 80 Q-40 70 -60 78 M16 80 Q40 70 60 76" stroke-width="1" stroke-opacity=".5"></path>
          </g>
          <circle cx="30" cy="70" r="3" b-fill="wires.gridColor" b-opacity="wires.gridOn" class="blink"></circle>
          <g>
            <rect x="82" y="96" width="28" height="38" rx="5" fill="#1d2a26" stroke="rgba(238,243,240,.35)" stroke-width="1.2"></rect>
            <g clip-path="url(#evp-batt)"><rect x="84" b-y="scene.battY" width="24" b-height="scene.battH" fill="url(#evp-cell)" style="transition: y .5s ease, height .5s ease"></rect></g>
            <rect x="90" y="92" width="12" height="4" rx="1.5" fill="rgba(238,243,240,.45)"></rect>
            <path d="M98 104 L93 114 H98 L95 123 L102 111 H97 Z" fill="#eef3f0" b-opacity="scene.battBolt" class="blink"></path>
          </g>
          <g>
            <path d="M132 84 H194 V132 H132 Z" fill="url(#evp-wall)"></path>
            <path d="M124 86 L163 54 L202 86" fill="none" stroke="#7b5a4a" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"></path>
            <path d="M128 84 L163 58 L198 84 Z" fill="#8d6a58"></path>
            <g clip-path="url(#evp-roof)">
              <path d="M141 80 L156 68 L170 68 L156 80 Z M159 80 L173 68 L187 68 L174 80 Z" fill="url(#evp-panel)" stroke="#3a5a99" stroke-width=".6"></path>
              <rect class="glint" x="120" y="60" width="16" height="30" fill="url(#evp-glintg)" b-opacity="scene.glint" transform="skewX(-35)"></rect>
            </g>
            <rect x="157" y="108" width="12" height="24" rx="1.5" fill="#5a4034"></rect>
            <rect x="138" y="96" width="14" height="12" rx="1.5" b-fill="scene.window" style="transition: fill .8s ease"></rect>
            <rect x="174" y="96" width="14" height="12" rx="1.5" b-fill="scene.window" style="transition: fill .8s ease"></rect>
            <rect x="138" y="96" width="14" height="12" rx="1.5" fill="none" stroke="#7a6a60" stroke-width="1"></rect>
            <rect x="174" y="96" width="14" height="12" rx="1.5" fill="none" stroke="#7a6a60" stroke-width="1"></rect>
          </g>
          <g>
            <rect x="214" y="104" width="38" height="28" rx="4" fill="#d9ddd7" stroke="#9aa39c" stroke-width="1"></rect>
            <circle cx="228" cy="118" r="10" fill="#3a4540"></circle>
            <g class="fan" b-style="scene.fanStyle"><path d="M228 118 C228 112 232 109 234 110 C233 114 230 116 228 118 Z M228 118 C234 118 237 122 236 124 C232 123 230 120 228 118 Z M228 118 C228 124 224 127 222 126 C223 122 226 120 228 118 Z M228 118 C222 118 219 114 220 112 C224 113 226 116 228 118 Z" fill="#c9d2cc"></path></g>
            <circle cx="228" cy="118" r="2" fill="#eef3f0"></circle>
            <path d="M243 110 V126 M247 110 V126" stroke="#9aa39c" stroke-width="1.2" stroke-linecap="round"></path>
          </g>
          <g>
            <path d="M266 126 V118 Q268 112 276 111 L284 104 Q287 102 292 102 H304 Q309 102 312 106 L317 112 Q322 113 322 118 V126 Z" fill="#2cc9a8"></path>
            <path d="M286 106 Q288 104 292 104 H300 L303 111 H281 Z M305 104 Q308 104 310 107 L313 111 H306 Z" fill="#0d2a24"></path>
            <circle cx="277" cy="127" r="6" fill="#1b2420" stroke="#7d8a83" stroke-width="2"></circle>
            <circle cx="310" cy="127" r="6" fill="#1b2420" stroke="#7d8a83" stroke-width="2"></circle>
            <circle cx="270" cy="116" r="2.4" fill="#6ee6a2" b-opacity="scene.carOn" class="blink"></circle>
            <path d="M268 120 Q262 128 270 136" fill="none" stroke="#1b2420" stroke-width="2"></path>
          </g>
        </svg>
      </div>
      <div class="chips">${chips}</div>
      <p class="said" b-text="hour.text"></p>
    </div>

    <div class="money">
      <div style="background:linear-gradient(160deg, rgba(77,141,255,.24), rgba(77,141,255,.05))"><span style="color:#a9c6ff">${esc(tr("bought"))}</span><b>${esc(figs.money.bought)}</b><small>${esc(figs.money.boughtKwh)}</small></div>
      <div style="background:linear-gradient(160deg, rgba(166,120,255,.26), rgba(166,120,255,.05))"><span style="color:#d3bfff">${esc(tr("sold"))}</span><b>${esc(figs.money.sold)}</b><small>${esc(figs.money.soldKwh)}</small></div>
      <div style="background:linear-gradient(160deg, rgba(245,181,46,.28), rgba(44,201,168,.08))"><span style="color:#ffd98a">${esc(tr("saved"))}</span><b>${esc(figs.money.saved)}</b><small>${esc(tr("saved_by"))}</small></div>
    </div>

    <div class="moments"><span class="label">${esc(tr("moments"))}</span>${moments}</div>

    <div class="card river">
      <b>${esc(tr("river"))}</b>
      <span class="sub">${esc(tr("river_sub"))}</span>
      <svg viewBox="${r.box}" role="img" aria-label="${esc(r.aria)}" font-family="Inter, sans-serif">
        <path d="${r.sun}" fill="#f5b52e" fill-opacity=".5"></path>
        <path d="${r.batt}" fill="#2cc9a8" fill-opacity=".5"></path>
        <path d="${r.grid}" fill="#4d8dff" fill-opacity=".5"></path>
        <path class="stream" d="${r.sunLine}" fill="none" stroke="#fff3cf" stroke-width="2" stroke-linecap="round"></path>
        <path class="stream" d="${r.battLine}" fill="none" stroke="#d8fff5" stroke-width="2" stroke-linecap="round"></path>
        <path class="stream" d="${r.gridLine}" fill="none" stroke="#dbe7ff" stroke-width="2" stroke-linecap="round"></path>
        <path d="${r.nodesLeft}" fill="#eef3f0"></path>
        <path d="${r.nodesRight}" fill="#eef3f0"></path>
        ${riverLabels}
      </svg>
      ${r.text ? `<p>${esc(r.text)}</p>` : ""}
    </div>

    <div class="story"><span class="label" style="padding:0;color:#cfdbd5">${esc(tr("story_label"))}</span><p>${esc(figs.story)}</p></div>
    <p class="sample">${esc(tr("sample"))}</p>
  </div>`;
}

function quarterArc(h0, h1, r, back) {
  const a0 = ang(h0), a1 = ang(h1);
  const [x0, y0] = at(r, back ? a1 : a0), [x1, y1] = at(r, back ? a0 : a1);
  return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 0 ${back ? 0 : 1} ${f1(x1)} ${f1(y1)}`;
}

const get = (obj, path) => path.split(".").reduce((value, key) => (value == null ? value : value[key]), obj);

class EvPlannerHouseDay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._lang = "da";
    this._money = null;
    this._season = seasonOf();
    this._hour = 0;
    this._playing = false;
    this._intro = true;
    this._timer = null;
    this._binds = [];
    this._built = false;
  }

  /* lang ("da" or "en"), money (a value to text, in the household's currency), season (to start with). */
  set options({ lang, money, season } = {}) {
    if (lang) this._lang = lang === "da" ? "da" : "en";
    if (typeof money === "function") this._money = money;
    if (SEASONS[season]) this._season = season;
    if (this.isConnected) this._build();
  }

  get season() {
    return this._season;
  }

  connectedCallback() {
    if (!this._built) this._build();
    this._resize = new ResizeObserver(() => this._fit());
    const wrap = this.shadowRoot.querySelector(".flower-wrap");
    if (wrap) this._resize.observe(wrap);
  }

  disconnectedCallback() {
    this._stopTimer();
    this._resize?.disconnect();
  }

  _tr(key, vars = {}) {
    const text = TEXT[this._lang]?.[key] ?? TEXT.en[key] ?? key;
    // A sum of money that ends with a full stop ("kr.") at the end of a sentence: one full stop.
    return text.replace(/\{(\w+)\}/g, (_m, name) => (vars[name] ?? "")).replace(/\.\.(?!\.)/g, ".");
  }

  _fmt() {
    const da = this._lang === "da";
    const n1 = (v) => (da ? f1(v).replace(".", ",") : f1(v));
    const money = this._money || ((v, digits = 2) => `${v.toLocaleString(da ? "da-DK" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits })} kr.`);
    return { n1, money };
  }

  /* A season's day: the page drawn once, then the hand sweeps from midnight to the time of day. */
  _build() {
    this._stopTimer();
    this._built = true;
    const tr = (key, vars) => this._tr(key, vars);
    this._day = makeDay(SEASONS[this._season]);
    this._figs = dayFigures(this._day, tr, this._fmt());
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>${template(tr, this._figs)}`;
    this._binds = [];
    for (const el of this.shadowRoot.querySelectorAll("*")) {
      for (const attr of [...el.attributes]) {
        if (!attr.name.startsWith("b-")) continue;
        this._binds.push({ el, name: attr.name.slice(2), path: attr.value, last: undefined });
        el.removeAttribute(attr.name);
      }
    }
    for (const button of this.shadowRoot.querySelectorAll("[data-season]")) button.setAttribute("aria-pressed", String(button.dataset.season === this._season));
    this._wire();
    if (this._resize) {
      this._resize.disconnect();
      this._resize.observe(this.shadowRoot.querySelector(".flower-wrap"));
    }
    this._fit();
    const now = new Date();
    this._nowH = now.getHours() + now.getMinutes() / 60;
    this._hour = 0;
    this._intro = true;
    this._paint();
    const start = Date.now(), target = this._nowH;
    const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      this._hour = target;
      this._intro = false;
      this._paint();
      return;
    }
    this._timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 1800);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this._hour = target * eased;
      this._intro = t < 1;
      this._paint();
      if (t >= 1) this._stopTimer();
    }, 30);
  }

  /* The flower is drawn at 360 px and made smaller where the page is narrower. */
  _fit() {
    const wrap = this.shadowRoot.querySelector(".flower-wrap"), flower = this.shadowRoot.querySelector(".flower");
    if (!wrap || !flower) return;
    const width = wrap.clientWidth || 360;
    const scale = Math.min(1, width / 360);
    flower.style.transform = `scale(${scale})`;
    wrap.style.height = `${360 * scale}px`;
  }

  _wire() {
    const root = this.shadowRoot;
    root.querySelector('[data-act="close"]').addEventListener("click", () => this.dispatchEvent(new CustomEvent("evp-close", { bubbles: true, composed: true })));
    root.querySelector('[data-act="play"]').addEventListener("click", () => this._togglePlay());
    const help = root.querySelector('[data-act="help"]'), bubble = root.querySelector(".bubble");
    help.addEventListener("click", () => {
      bubble.hidden = !bubble.hidden;
      help.setAttribute("aria-expanded", String(!bubble.hidden));
    });
    for (const button of root.querySelectorAll("[data-season]")) {
      button.addEventListener("click", () => {
        if (button.dataset.season === this._season) return;
        this._season = button.dataset.season;
        this._build();
        this.dispatchEvent(new CustomEvent("evp-season", { detail: { season: this._season }, bubbles: true, composed: true }));
      });
    }
    for (const button of root.querySelectorAll("[data-moment]")) {
      button.addEventListener("click", () => {
        const m = this._figs.moments[Number(button.dataset.moment)];
        this._stop();
        this._hour = m.at[0] + Math.min(0.5, (m.at[1] - m.at[0]) / 2);
        this._paint();
      });
    }
    const scrub = root.querySelector(".scrub");
    let drag = false;
    const move = (ev) => {
      const box = scrub.getBoundingClientRect();
      const dx = ev.clientX - (box.left + box.width / 2), dy = ev.clientY - (box.top + box.height / 2);
      let a = Math.atan2(dx, -dy);
      if (a < 0) a += Math.PI * 2;
      this._hour = (a / (Math.PI * 2)) * 24;
      this._intro = false;
      this._paint();
    };
    scrub.addEventListener("pointerdown", (ev) => { drag = true; this._stop(); scrub.setPointerCapture?.(ev.pointerId); move(ev); });
    scrub.addEventListener("pointermove", (ev) => { if (drag) move(ev); });
    const up = () => { drag = false; };
    scrub.addEventListener("pointerup", up);
    scrub.addEventListener("pointercancel", up);
  }

  _stopTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  _stop() {
    this._stopTimer();
    this._playing = false;
    this._intro = false;
  }

  _togglePlay() {
    if (this._playing) {
      this._stop();
      this._paint();
      return;
    }
    this._stop();
    this._playing = true;
    this._hour = 0;
    this._timer = setInterval(() => {
      const next = this._hour + 0.15;
      if (next >= 24) {
        this._stop();
        this._hour = this._nowH;
      } else this._hour = next;
      this._paint();
    }, 70);
    this._paint();
  }

  /* The picked hour onto the page: only what changed is written. */
  _paint() {
    const tr = (key, vars) => this._tr(key, vars);
    const hf = ((this._hour % 24) + 24) % 24;
    const v = hourFigures(this._day, this._figs, hf, this._nowH, tr, this._fmt());
    v.marksOn = this._intro ? 0 : 1;
    v.headline = tr("headline", { day: tr(`${this._season}_day`), self: this._figs.selfPct, saved: this._figs.money.saved });
    v.playText = tr(this._playing ? "stop" : "play");
    v.playLabel = tr(this._playing ? "stop_label" : "play_label");
    v.playIcon = this._playing ? ICON.stop : ICON.play;
    for (const bind of this._binds) {
      const value = get(v, bind.path);
      const text = value == null ? "" : String(value);
      if (text === bind.last) continue;
      bind.last = text;
      if (bind.name === "text") bind.el.textContent = text;
      else bind.el.setAttribute(bind.name, text);
    }
    // The streams: a dot each, kept (and only restyled) while their number stays.
    const box = this.shadowRoot.querySelector(".dots");
    if (!box) return;
    while (box.children.length > v.dots.length) box.lastChild.remove();
    while (box.children.length < v.dots.length) {
      const dot = document.createElement("span");
      dot.className = "dot";
      box.appendChild(dot);
    }
    v.dots.forEach((style, i) => {
      const dot = box.children[i];
      if (dot.getAttribute("style") !== style) dot.setAttribute("style", style);
    });
  }
}

if (!customElements.get("ev-planner-houseday")) customElements.define("ev-planner-houseday", EvPlannerHouseDay);
