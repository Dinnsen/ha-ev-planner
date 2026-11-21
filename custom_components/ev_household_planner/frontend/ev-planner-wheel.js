/* Drejeskiven and Husets hjul (2.5.0b55): the household on a turntable in EV Planner's clay world, the next 36 hours
   as a ring round it. Drejeskiven on Forside has the cars, each with a track in the ring; Husets hjul on Huset has
   the whole house in its design from Husets billede, with the sun, the battery, the heat pump and the cars, and the
   energy running between them as light. Both turn slowly, and a drag across them looks ahead in time.
   The panel hands each its model (the prices, the cars' plans and departures, the house now) and is told what
   was tapped by an "evp-wheel" event; nothing here changes anything in Home Assistant. */

const C30 = Math.cos(Math.PI / 6);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const css = (c, a = 1) => `rgba(${c.map((v) => Math.round(clamp(v, 0, 255))).join(",")},${a})`;

/* The light of an hour: the sky's two colours, how much daylight, and the lamps; by the day's sunrise and sunset. */
function lightAt(h, RISE = 8, SET = 16) {
  const t = ((h % 24) + 24) % 24;
  const stops = [[0, [8, 11, 34], [16, 18, 52], .3], [RISE - 1.2, [18, 20, 58], [44, 34, 80], .34], [RISE, [92, 74, 136], [246, 160, 120], .62], [RISE + 1.4, [96, 150, 214], [190, 218, 240], 1],
    [SET - 1.2, [90, 140, 205], [200, 214, 232], 1], [SET, [80, 62, 128], [250, 150, 100], .66], [SET + 1.3, [20, 22, 60], [58, 40, 90], .36], [24, [8, 11, 34], [16, 18, 52], .3]];
  let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const [t0, a0, b0, l0] = stops[i], [t1, a1, b1, l1] = stops[i + 1], k = clamp((t - t0) / (t1 - t0 || 1), 0, 1);
  const top = a0.map((v, j) => lerp(v, a1[j], k)), bot = b0.map((v, j) => lerp(v, b1[j], k));
  const amb = lerp(l0, l1, k);
  return { top, bot, amb, night: amb < .5, h };
}

/* ---------- the projection and the painter */
function World(ctx, ox, oy, s, light, spin = 0) {
  const L = [-.45, .89];
  // spin turns the whole world about 0,0 (a turntable): positions, which faces are seen, and the drawing order
  const SC = Math.cos(spin), SS = Math.sin(spin);
  const R2 = (x, y) => (spin ? [x * SC - y * SS, x * SS + y * SC] : [x, y]);
  const P = (x, y, z = 0) => { const [a, b] = R2(x, y); return [ox + (a - b) * C30 * s, oy + (a + b) * .5 * s - z * s]; };
  const D = (x, y) => { const [a, b] = R2(x, y); return a + b; };
  // A clay colour under the hour's light: dimmed and tinted by the sky at night.
  const lit = (rgb, bright) => {
    const a = light.amb, tint = light.bot;
    return rgb.map((v, i) => v * bright * (.38 + .62 * a) + tint[i] * (1 - a) * .32);
  };
  const items = [];
  const add = (depth, draw) => items.push([depth, draw]);
  const poly = (pts, fill, stroke) => {
    ctx.beginPath(); pts.forEach(([x, y, z], i) => { const [sx, sy] = P(x, y, z); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke || fill; ctx.lineWidth = .7; ctx.lineJoin = "round"; ctx.stroke();
  };
  /* A box, turned by rot about (rx, ry): the faces that look at the viewer, shaded by the light. */
  function box(x, y, z, w, d, h, color, o = {}) {
    const rgb = typeof color === "string" ? hexRgb(color) : color, rot = o.rot || 0;
    const rx = o.rx ?? x + w / 2, ry = o.ry ?? y + d / 2, cs = Math.cos(rot), sn = Math.sin(rot);
    const T = (px, py) => [rx + (px - rx) * cs - (py - ry) * sn, ry + (px - rx) * sn + (py - ry) * cs];
    const c = (ix, iy, iz) => [...T(x + ix * w, y + iy * d), z + iz * h];
    const cs2 = Math.cos(rot + spin), sn2 = Math.sin(rot + spin), N = (nx, ny) => [nx * cs2 - ny * sn2, nx * sn2 + ny * cs2];
    const faces = [
      [[c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)], N(1, 0), o.fx],
      [[c(0, 0, 0), c(0, 1, 0), c(0, 1, 1), c(0, 0, 1)], N(-1, 0), o.fmx],
      [[c(0, 1, 0), c(1, 1, 0), c(1, 1, 1), c(0, 1, 1)], N(0, 1), o.fy],
      [[c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)], N(0, -1), o.fmy],
    ];
    const [cx, cy] = T(x + w / 2, y + d / 2);
    add(o.depth ?? D(cx, cy) + (z + h / 2) * .02, () => {
      ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
      for (const [pts, n, paint] of faces) {
        if (n[0] + n[1] <= .001) continue;
        const b = .7 + .3 * Math.max(0, n[0] * L[0] + n[1] * L[1]);
        poly(pts, o.emit ? css(rgb) : css(lit(rgb, b)));
        if (paint) paint(pts, n);
      }
      if (!o.noTop) {
        const top = [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)];
        poly(top, o.emit ? css(rgb) : css(lit(rgb, 1.08)));
        if (o.ftop) o.ftop(top);
        // the clay's soft edge catching light
        ctx.strokeStyle = `rgba(255,255,255,${.1 + .12 * light.amb})`; ctx.lineWidth = .8; ctx.beginPath();
        const [a1, a2] = [P(...top[3]), P(...top[2])]; ctx.moveTo(...a1); ctx.lineTo(...a2); const a3 = P(...top[1]); ctx.lineTo(...a3); ctx.stroke();
      }
      ctx.restore();
    });
  }
  /* A soft shadow on the ground. */
  function shadow(x, y, w, d, depth = -999, a = .32, z = 0) {
    add(depth, () => {
      const [sx, sy] = P(x + w / 2 + .25, y + d / 2 + .25, z), r = (w + d) * C30 * s * .55;
      const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, r); g.addColorStop(0, `rgba(0,0,0,${a * (.55 + .45 * light.amb)})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * .55, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  /* A flat area on the ground (grass, asphalt). */
  function flat(x, y, w, d, color, depth = -1000) { add(depth, () => poly([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]], css(lit(hexRgb(color), 1)))); }
  /* A glowing point: lamps, chargers' screens, windows at night. */
  function glow(x, y, z, r, rgb, a = 1, depth) {
    add(depth ?? D(x, y) + 50, () => { const [sx, sy] = P(x, y, z), g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * s); g.addColorStop(0, css(rgb, .55 * a)); g.addColorStop(1, css(rgb, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * s, 0, Math.PI * 2); ctx.fill(); });
  }
  /* The house: walls, a gable roof along x, windows that light up in the evening. */
  function house(x, y, w = 5, d = 4, hgt = 2.4, o = {}) {
    const wall = o.wall || "#e8ecf2", roof = o.roof || "#3a4256", windows = o.lit ?? light.night;
    shadow(x, y, w, d, x + y - 1, .4);
    box(x, y, 0, w, d, hgt, wall, {
      fy: (pts) => { for (let i = 0; i < (o.wins ?? 3); i++) win([x + .6 + i * 1.5, y + d], "y"); door([x + w - 1.2, y + d]); },
      fx: () => { win([x + w, y + .8], "x"); win([x + w, y + 2.2], "x"); },
    });
    function win([wx, wy], side) {
      const q = side === "y" ? [[wx, wy, .9], [wx + .8, wy, .9], [wx + .8, wy, 1.7], [wx, wy, 1.7]] : [[wx, wy, .9], [wx, wy + .8, .9], [wx, wy + .8, 1.7], [wx, wy, 1.7]];
      if (windows) { ctx.save(); ctx.shadowColor = "#ffb547"; ctx.shadowBlur = 12; poly(q, "#ffd27a"); ctx.restore(); }
      else poly(q, css(lit([120, 146, 180], 1)));
    }
    function door([dx, dy]) { poly([[dx, dy, 0], [dx + .7, dy, 0], [dx + .7, dy, 1.6], [dx, dy, 1.6]], css(lit([70, 80, 104], 1))); }
    // the roof: two slopes along x, the gable at the +x end
    const rz = hgt, rh = 1.5, ov = .25, mid = y + d / 2;
    add(x + y + w / 2 + d / 2 + .5, () => {
      const r = hexRgb(roof);
      poly([[x - ov, mid, rz + rh], [x + w + ov, mid, rz + rh], [x + w + ov, y + d + ov, rz - .15], [x - ov, y + d + ov, rz - .15]], css(lit(r, 1)));
      poly([[x + w, y, rz], [x + w, y + d, rz], [x + w, mid, rz + rh]], css(lit(hexRgb(wall), .84)));
      ctx.strokeStyle = `rgba(255,255,255,${.12 + .1 * light.amb})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P(x - ov, mid, rz + rh)); ctx.lineTo(...P(x + w + ov, mid, rz + rh)); ctx.stroke();
    });
    if (o.solar) add(x + y + w / 2 + d / 2 + .6, () => { const k = o.shine || 0, pc = [40, 56, 96].map((v, j) => lerp(v, [126, 156, 236][j], k)); ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; if (k > .05) { ctx.shadowColor = `rgba(255,214,92,${.8 * k})`; ctx.shadowBlur = 10 * k; } for (let i = 0; i < (o.panels ?? 4); i++) poly([[x + .5 + i * 1.1, mid + .25, rz + rh - .12], [x + 1.4 + i * 1.1, mid + .25, rz + rh - .12], [x + 1.4 + i * 1.1, y + d - .1, rz + .05], [x + .5 + i * 1.1, y + d - .1, rz + .05]], css(lit(pc, 1.1)), `rgba(255,236,170,${.15 + .4 * k})`); ctx.restore(); });
  }
  /* A wall charger on a post; its screen glows in the charging car's colour. */
  function charger(x, y, on, t = 0) {
    shadow(x - .1, y - .1, .5, .4, x + y - .5, .3);
    box(x, y, 0, .32, .26, 1.25, "#1d2333", { fx: on ? (pts) => {} : null });
    const col = on ? hexRgb(on) : [70, 80, 104];
    box(x + .33, y + .04, .82, .01, .18, .2, col, { emit: !!on, noTop: true });
    if (on) glow(x + .34, y + .13, .92, .9 + .25 * Math.sin(t * .006), col, 1, x + y + 60);
  }
  /* A car in clay: its side profile lofted across its width, front towards +x, turned by rot about its middle.
     The faces that look at the viewer are drawn far to near and shaded by the light; the glass is where the
     profile climbs over the cabin; wheels, lights and the car's own colour go on the near side. */
  const PROFILES = {
    sedan: { L: 4.7, W: 1.84, belt: .95, wheels: [1.0, 3.8], r: .34, pts: [[0, .3, .12], [0, .62, .15], [.3, .78, .08], [1.0, .86, .05], [1.55, 1.08, .15], [2.15, 1.42, .25], [3.0, 1.44, .26], [3.5, 1.3, .23], [3.95, 1.0, .14], [4.5, .9, .1], [4.7, .72, .14], [4.66, .32, .13]] },
    suv: { L: 4.68, W: 1.9, belt: 1.12, wheels: [1.0, 3.8], r: .38, pts: [[0, .36, .12], [0, .96, .12], [.2, 1.06, .07], [.65, 1.12, .06], [.95, 1.6, .18], [1.35, 1.7, .21], [3.95, 1.7, .21], [4.2, 1.28, .12], [4.6, 1.14, .09], [4.68, .92, .11], [4.66, .38, .12]] },
  };
  function car(x, y, c, o = {}) {
    const pf = PROFILES[c.kind] || PROFILES.sedan, Lc = pf.L, Wc = pf.W, rot = o.rot || 0, alpha = o.alpha;
    const rx = x + Lc / 2, ry = y + Wc / 2, cs = Math.cos(rot), sn = Math.sin(rot);
    const z0 = o.z || 0, T = (px, py, pz) => [rx + (px - Lc / 2) * cs - (py - Wc / 2) * sn, ry + (px - Lc / 2) * sn + (py - Wc / 2) * cs, pz + z0];
    const paint = hexRgb(c.paint), glassRgb = [38, 48, 72], d0 = o.depth ?? D(rx, ry);
    const cv2 = Math.cos(rot + spin), sv2 = Math.sin(rot + spin); // how the car faces the viewer, the turntable included
    const V = [.62, .62, .48], LT = [-.42, .55, .72];
    const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    shadow(rx - Lc / 2 - .1, ry - Wc / 2 - .1, Lc + .2, Wc + .2, d0 - 3, .5 * (alpha ?? 1), z0);
    add(d0, () => {
      ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
      const P3 = (p) => P(...T(...p));
      const pts = pf.pts, n = pts.length, quads = [];
      for (let i = 0; i < n - 1; i++) {
        const [x0, z0, i0] = pts[i], [x1, z1, i1] = pts[i + 1], dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) || 1;
        const nl = [-dz / len, 0, dx / len], nw = [nl[0] * cv2, nl[0] * sv2, nl[2]];
        if (dot3(nw, V) <= 0) continue;
        const glass = Math.min(z0, z1) >= pf.belt - .02 && Math.abs(dz / len) > .28;
        const b = .62 + .38 * Math.max(0, dot3(nw, LT));
        const q = [[x0, i0, z0], [x1, i1, z1], [x1, Wc - i1, z1], [x0, Wc - i0, z0]].map((p) => T(...p));
        quads.push([q.reduce((t, p) => t + p[0] + p[1] + p[2] * .3, 0) / 4, q, glass ? glassRgb : paint, b, glass]);
      }
      quads.sort((a, b2) => a[0] - b2[0]);
      for (const [, q, rgb, b, glass] of quads) { poly(q, css(lit(rgb, b * (glass ? 1.15 : 1)))); if (glass) { ctx.strokeStyle = `rgba(255,255,255,${.08 + .1 * light.amb})`; ctx.lineWidth = .8; ctx.stroke(); } }
      // the near side: the profile at the side that looks at the viewer
      const near = (-sv2 + cv2) >= 0 ? 1 : -1; // +y side seen when (0,1) turned points to the viewer
      const ny = near > 0 ? [-sv2, cv2, 0] : [sv2, -cv2, 0];
      const sideY = (inset) => (near > 0 ? Wc - inset : inset);
      const sb = .62 + .38 * Math.max(0, dot3(ny, LT));
      const side = pts.map(([px, pz, pi]) => [px, sideY(pi), pz]);
      ctx.beginPath(); side.forEach((p, i) => { const [sx, sy] = P3(p); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }); ctx.closePath();
      const [gx0, gy0] = P3([0, sideY(.1), 1.4]), [gx1, gy1] = P3([0, sideY(.1), .3]);
      const sg = ctx.createLinearGradient(gx0, gy0, gx1, gy1); sg.addColorStop(0, css(lit(paint, sb * 1.08))); sg.addColorStop(1, css(lit(paint, sb * .78)));
      ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = css(lit(paint, sb * .7)); ctx.lineWidth = .7; ctx.stroke();
      // the side windows: the profile above the belt, drawn a little inside
      const cab = pts.filter(([, pz]) => pz > pf.belt + .05);
      if (cab.length > 1) {
        const first = cab[0][0] + .12, last = cab[cab.length - 1][0] - .12, top = cab.map(([px, pz, pi]) => [clamp(px, first, last), pz - .08, pi + .02]);
        const win = [[first, sideY(.15), pf.belt + .04], ...top.map(([px, pz, pi]) => [px, sideY(pi + .01), pz]), [last, sideY(.15), pf.belt + .04]];
        ctx.beginPath(); win.forEach((p, i) => { const [sx, sy] = P3(p); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }); ctx.closePath();
        const [wx0, wy0] = P3([first, sideY(.2), pf.belt + .5]), [wx1, wy1] = P3([last, sideY(.2), pf.belt]);
        const wg = ctx.createLinearGradient(wx0, wy0, wx1, wy1); wg.addColorStop(0, css(lit([96, 116, 156], 1))); wg.addColorStop(1, css(lit([28, 36, 56], 1)));
        ctx.fillStyle = wg; ctx.fill();
        const px = (pf.wheels[0] + pf.wheels[1]) / 2; ctx.strokeStyle = css(lit(paint, sb * .8)); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P3([px, sideY(.16), pf.belt + .02])); ctx.lineTo(...P3([px, sideY(.2), pf.belt + .5])); ctx.stroke();
      }
      // the car's own colour along the sill
      ctx.strokeStyle = c.color; ctx.lineWidth = Math.max(1.4, s * .08); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...P3([.5, sideY(.1), .46])); ctx.lineTo(...P3([Lc - .5, sideY(.1), .46])); ctx.stroke();
      // the wheels on the near side
      for (const wx of pf.wheels) {
        const ring = (r, yy) => { ctx.beginPath(); for (let k = 0; k <= 20; k++) { const a = (k / 20) * Math.PI * 2, [sx, sy] = P3([wx + Math.cos(a) * r, yy, pf.r + Math.sin(a) * r]); k ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); } ctx.closePath(); };
        ring(pf.r, sideY(.06)); ctx.fillStyle = "#0d0f14"; ctx.fill();
        ring(pf.r * .58, sideY(.02)); const [hx, hy] = P3([wx - .05, sideY(.02), pf.r + .06]), rg = ctx.createRadialGradient(hx, hy, .5, hx, hy, pf.r * s * .7); rg.addColorStop(0, css(lit([220, 226, 236], 1))); rg.addColorStop(1, css(lit([90, 100, 118], 1))); ctx.fillStyle = rg; ctx.fill();
      }
      // the lights: front when the front looks at us, rear lights otherwise
      const frontSeen = cv2 + sv2 > -.3, rearSeen = -(cv2 + sv2) > -.3;
      if (frontSeen) for (const yy of [.32, Wc - .32]) {
        const [hx, hy] = P3([Lc - .03, yy, pf.pts[pf.pts.length - 2][1] - .05]);
        ctx.fillStyle = o.lights ? "#fff4cf" : css(lit([232, 238, 246], 1)); if (o.lights) { ctx.shadowColor = "#ffe9a8"; ctx.shadowBlur = 14; }
        ctx.beginPath(); ctx.ellipse(hx, hy, Math.max(1.6, s * .11), Math.max(1, s * .06), 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      if (rearSeen) for (const yy of [.3, Wc - .3]) { const [hx, hy] = P3([.02, yy, .66]); ctx.fillStyle = "#ff4b3e"; ctx.shadowColor = "#ff4b3e"; ctx.shadowBlur = o.lights ? 10 : 0; ctx.beginPath(); ctx.ellipse(hx, hy, Math.max(1.6, s * .1), Math.max(1, s * .05), 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
      ctx.restore();
    });
    if (o.lights) add(d0 + .5, () => {
      const P2 = (px, py) => P(...T(px, py, 0).slice(0, 2), z0);
      const a1 = P2(Lc, .2), b1 = P2(Lc, Wc - .2), a2 = P2(Lc + 4, -.8), b2 = P2(Lc + 4, Wc + .8);
      const g = ctx.createLinearGradient(...a1, ...a2); g.addColorStop(0, "rgba(255,236,180,.32)"); g.addColorStop(1, "rgba(255,236,180,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(...a1); ctx.lineTo(...a2); ctx.lineTo(...b2); ctx.lineTo(...b1); ctx.fill();
    });
    return { port: T(.45, (-sv2 + cv2) >= 0 ? Wc : 0, .78), front: T(Lc, Wc / 2, 0) };
  }
  /* A cable from the charger to a car: light running along it while it charges. */
  function cable(from, to, col, t, depth) {
    add(depth, () => {
      const [ax, ay] = P(...from), [bx, by] = P(...to), my = Math.max(ay, by) + 18;
      ctx.save(); ctx.strokeStyle = "#11141c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(ax, my, bx, my, bx, by); ctx.stroke();
      if (col) { ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.setLineDash([3, 6]); ctx.lineDashOffset = -t * .04; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.stroke(); }
      ctx.restore();
    });
  }
  function tree(x, y, hgt = 2.6) {
    shadow(x - .5, y - .5, 1.4, 1.4, x + y - .3, .35);
    box(x, y, 0, .22, .22, hgt * .35, "#5b4636", { depth: x + y });
    add(x + y + .2, () => {
      const [sx, sy] = P(x + .11, y + .11, hgt * .35), r = hgt * .32 * s;
      const g = ctx.createRadialGradient(sx - r * .3, sy - r * 1.1, r * .2, sx, sy - r * .8, r * 1.2);
      const base = lit([62, 104, 82], 1);
      g.addColorStop(0, css(base.map((v) => v * 1.25))); g.addColorStop(1, css(base.map((v) => v * .7)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, sy - r * .8, r * .75, r, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  function lamp(x, y, t) {
    box(x, y, 0, .12, .12, 2.6, "#2a3046", { depth: x + y });
    box(x - .2, y - .05, 2.6, .5, .22, .1, "#2a3046", { depth: x + y + .01 });
    if (light.night) { glow(x + .05, y + .05, 2.55, 2.2, [255, 200, 120], .8 + .1 * Math.sin(t * .003 + x), x + y + 40); add(-998, () => { const [sx, sy] = P(x + .05, y + .05, 0), g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 2 * s); g.addColorStop(0, "rgba(255,200,120,.22)"); g.addColorStop(1, "rgba(255,200,120,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, sy, 2 * s, 1.1 * s, 0, 0, Math.PI * 2); ctx.fill(); }); }
  }
  function draw() { items.sort((a, b) => a[0] - b[0]); for (const [, f] of items) f(); }
  return { P, D, R2, spin, box, shadow, flat, glow, house, charger, car, cable, tree, lamp, draw, add, poly, lit, ctx, s };
}

/* ---------- the sky behind a scene */
function sky(ctx, w, h, light, t, stars = true) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, css(light.top)); g.addColorStop(1, css(light.bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (light.night && stars) for (let i = 0; i < 44; i++) { ctx.fillStyle = `rgba(255,255,255,${.25 + .4 * Math.abs(Math.sin(t * .0015 + i * 1.3))})`; ctx.fillRect((i * 83.7) % w, (i * 41.9) % (h * .55), 1.3, 1.3); }
}
function moonOrSun(ctx, x, y, light, r = 14) {
  if (light.night) {
    ctx.fillStyle = "rgba(255,243,207,.14)"; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff3cf"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(light.top); ctx.beginPath(); ctx.arc(x + r * .45, y - r * .25, r * .9, 0, Math.PI * 2); ctx.fill();
  } else {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r * 3.2); g.addColorStop(0, "rgba(255,240,190,1)"); g.addColorStop(.3, "rgba(255,214,107,.8)"); g.addColorStop(1, "rgba(255,214,107,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
  }
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* A canvas at the screen's sharpness, drawn only while it is seen. Its height is read once: setting cv.height
   writes the attribute back, and a phone fires resize on every scroll. */
const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function stage(cv, draw) {
  let S = null, seen = true, raf = 0;
  const H = Number(cv.getAttribute("height")) || 400;
  cv.style.height = `${H}px`;
  const size = () => { const r = cv.getBoundingClientRect(), dpr = Math.min(2.5, devicePixelRatio || 1); if (S && Math.abs(S.w - r.width) < 1) return; cv.width = Math.round(r.width * dpr); cv.height = Math.round(H * dpr); const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); S = { ctx, w: r.width, h: H }; };
  const loop = (t) => {
    raf = 0;
    // a wheel taken off the page (another tab) stops; it starts again when it is seen
    if (!cv.isConnected) return;
    if (!S || Math.abs(cv.clientWidth - S.w) >= 1) size();
    if (S.w > 0) { S.ctx.clearRect(0, 0, S.w, S.h); try { draw(S, t); } catch (err) { console.error("EV Planner: the wheel", err); return; } }
    if (!reduce && seen) raf = requestAnimationFrame(loop);
  };
  if (typeof IntersectionObserver === "function") new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "120px" }).observe(cv);
  addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(loop); });
  return { redraw: () => { if (!raf) raf = requestAnimationFrame(loop); } };
}

/* ---------- the ten house designs EV Planner draws under Husets billede, as plans in metres (x along the road, y towards
   it, so the walls marked S and E face the viewer). The eight planned ones are copied from the panel; Klassisk
   and Vinkelhus are written out the same way. */
const GABLE = (rise, axis = "x", more = {}) => ({ type: "gable", axis, rise, ...more });
const FLAT = { type: "flat" };
const DESIGNS = {
    // One long house under a saddle roof, with a flat-roofed garage at its end.
    long: {
      wings: [
        { x0: 0, y0: 0, x1: 18, y1: 7.5, h: 2.6, roof: GABLE(2.5), winS: [[1.2, 2.8], [3.6, 5.6, 0.93, 2.19, 2], [9.2, 11.4, 0.93, 2.19, 2], [12.2, 14.2, 0.93, 2.19, 2]], doors: [[7, 8]] },
        { x0: 18, y0: 1.3, x1: 24.6, y1: 7.5, h: 2.5, roof: FLAT, gates: [[18.4, 20.9], [21.4, 23.9]], winE: [[3, 4.6, 1.5, 2.1]] },
      ],
      walls: { s1: { kind: "S", wing: 0, u1: 24.6, top: 2.1 }, e1: { kind: "E", wing: 1 } },
      drive: [[18.1, 7.5, 24.4, 15.2], [6.8, 7.5, 8.2, 11], [6.8, 9.6, 18.1, 11]],
      slots: [{ x: 18.74, y: 8.25 }, { x: 21.74, y: 8.25 }],
      chargers: [{ w: "s1", u: 20.97 }, { w: "s1", u: 24.0 }],
      gateway: { w: "s1", u: 17.2 }, battery: { w: "s1", u: 16.2 }, heat: { x: 24.85, y: 4.2 }, street: [17.45, 15.2],
      solar: { wing: 0, face: "S", a: 8.2, b: 17.3, wall: "s1" },
      trees: [[-2.6, 5, 1], [-2, 12.5, 0.85], [12, -2.4, 0.9], [27.5, 3, 0.85]],
      lamps: [[8.3, 7.5], [21.15, 7.5]],
    },
    // A long house with a wing towards the road: the garage is in the wing.
    tee: {
      wings: [
        { x0: 0, y0: 0, x1: 16, y1: 7, h: 2.6, roof: GABLE(2.4), winS: [[1, 2.8, 0.93, 2.19, 2], [3.6, 5, 0.93, 2.19], [6.4, 8.4, 0.93, 2.19, 2]], doors: [[5.2, 6.2]], winE: [[2, 4, 0.93, 2.19, 2]] },
        { x0: 9.5, y0: 7, x1: 16, y1: 13.5, h: 2.6, roof: GABLE(2.2, "y", { val0: 3.2 }), gates: [[9.8, 12.2], [12.7, 15.1]], winE: [[9.4, 11, 1.5, 2.1]] },
      ],
      walls: { s1: { kind: "S", wing: 1 }, e1: { kind: "E", wing: 1 }, s2: { kind: "S", wing: 0, u1: 9.5 } },
      drive: [[9.5, 13.5, 16.3, 21], [5, 7, 6.4, 17], [5, 15.6, 9.5, 17]],
      slots: [{ x: 10.1, y: 14.25 }, { x: 13.0, y: 14.25 }],
      chargers: [{ w: "s1", u: 12.27 }, { w: "s1", u: 15.3 }],
      gateway: { w: "e1", u: 13.0 }, battery: { w: "e1", u: 11.6 }, heat: { x: 16.25, y: 2.4 }, street: [17.4, 21],
      solar: { wing: 0, face: "S", a: 0.6, b: 8.6, wall: "s2" },
      trees: [[-2.6, 4, 1], [-1.6, 12, 0.9], [20, 1, 0.9], [3, 20, 0.85]],
      lamps: [[6.35, 7], [12.45, 13.5]],
    },
    // Two wings with a link between them: the garage is in the wing to the right.
    aitch: {
      wings: [
        { x0: 0, y0: 0, x1: 6, y1: 16, h: 2.6, roof: GABLE(2.1, "y"), winS: [[1, 2.4], [3.4, 5]], winE: [[1.5, 3.5, 0.93, 2.19, 2], [11.2, 13, 0.93, 2.19, 2], [13.6, 15.2]] },
        { x0: 6, y0: 5.5, x1: 12, y1: 10, h: 2.6, roof: GABLE(1.5, "x", { val0: 2.1, val1: 2.1 }), winS: [[7, 9.4, 0.3, 2.2, 2]], doors: [[9.9, 10.9]] },
        { x0: 12, y0: 0, x1: 18.5, y1: 16, h: 2.6, roof: GABLE(2.2, "y"), gates: [[12.3, 14.7], [15.2, 17.6]], winE: [[1.5, 3.5, 0.93, 2.19, 2], [5, 7.4, 0.93, 2.19, 2], [9, 10.4]] },
      ],
      walls: { s1: { kind: "S", wing: 2 }, e1: { kind: "E", wing: 2 } },
      drive: [[12, 16, 18.8, 23.5], [8.6, 10, 10.9, 17.4], [8.6, 16, 12, 17.4]],
      slots: [{ x: 12.6, y: 16.75 }, { x: 15.5, y: 16.75 }],
      chargers: [{ w: "s1", u: 14.77 }, { w: "s1", u: 17.75 }],
      gateway: { w: "e1", u: 15.2 }, battery: { w: "e1", u: 13.2 }, heat: { x: 18.75, y: 5.6 }, street: [19.9, 23.5],
      solar: { wing: 2, face: "E", a: 1, b: 11.5, wall: "e1" },
      trees: [[-2.6, 6, 1], [3, 20, 0.9], [9, 13.5, 0.7], [22.5, 2, 0.9]],
      lamps: [[11.05, 10], [14.95, 16]],
    },
    // White boxes with flat roofs, one of them in two storeys, the garage built in.
    funkis: {
      wings: [
        { x0: 0, y0: 0, x1: 8, y1: 9, h: 5.7, roof: FLAT, winS: [[0.9, 4.2, 0.4, 2.4, 3], [0.9, 7.1, 3.3, 5.1, 4]], doors: [[5.6, 6.6, 2.3]], winE: [[1.5, 4.5, 3.3, 5.1, 2], [5.5, 8, 3.3, 5.1, 2]] },
        { x0: 8, y0: 2, x1: 15.5, y1: 9, h: 2.9, roof: FLAT, gates: [[8.4, 10.9], [11.4, 13.9]], winE: [[3, 5, 1, 2.2, 2], [6, 8, 1, 2.2, 2]] },
      ],
      walls: { s1: { kind: "S", wing: 0, u1: 15.5, top: 2.5 }, e1: { kind: "E", wing: 1 } },
      drive: [[8.1, 9, 14.4, 16.5], [5.4, 9, 6.8, 12.6], [5.4, 11.2, 8.1, 12.6]],
      slots: [{ x: 8.74, y: 9.75 }, { x: 11.74, y: 9.75 }],
      chargers: [{ w: "s1", u: 10.97 }, { w: "s1", u: 14.1 }],
      gateway: { w: "s1", u: 7.2 }, battery: { w: "s1", u: 4.55 }, heat: { x: 15.75, y: 4 }, street: [7.45, 16.5],
      solar: { wing: 0, face: "top", a: 0.6, b: 7.4, wall: "s1", rows: 3 },
      trees: [[-2.6, 5, 1], [2.5, 13, 0.9], [18.5, 0, 0.9], [-1, -2.5, 0.8]],
      lamps: [[6.85, 9, 2.6], [11.15, 9]],
    },
    // A low summer house in wood, with a shed the chargers hang on.
    cabin: {
      wings: [
        { x0: 0, y0: 0, x1: 10, y1: 6.5, h: 2.3, wood: true, roof: GABLE(1.9), winS: [[0.9, 2.3, 0.8, 1.9], [3.4, 7.2, 0.1, 2, 3]], doors: [[8.2, 9.1, 2]], winE: [[2.2, 4.4, 0.8, 1.9, 2]] },
        { x0: 11.6, y0: 2.4, x1: 16, y1: 6.5, h: 2.2, wood: true, roof: GABLE(1.0), doorsE: [[3.4, 4.3, 1.95]] },
      ],
      walls: { s1: { kind: "S", wing: 1 }, e1: { kind: "E", wing: 1 }, s2: { kind: "S", wing: 0 } },
      drive: [[11, 6.5, 16.6, 13.5]],
      deck: [[-0.6, 6.5, 10.4, 10]],
      slots: [{ x: 11.5, y: 7.25 }, { x: 14.0, y: 7.25 }],
      chargers: [{ w: "s1", u: 13.2 }, { w: "s1", u: 15.3 }],
      gateway: { w: "s1", u: 11.8 }, battery: { w: "e1", u: 6.2 }, heat: { x: 16.25, y: 2.6 }, street: [10.75, 13.5],
      solar: { wing: 0, face: "S", a: 0.8, b: 9.2, wall: "s2" },
      trees: [[-2.6, 2, 1.1], [-2.2, 9.5, 0.9], [4, -2.6, 1], [13.5, -1.2, 1.05], [19.5, 4.5, 0.95], [7, 13, 0.8]],
      lamps: [[7.9, 6.5, 2.1, 18]],
      home: [5, 6.51, 2.1],
    },
    // A bungalow under a hipped roof, as they were built in the sixties and seventies, with a flat-roofed garage.
    hipped: {
      wings: [
        { x0: 0, y0: 0, x1: 15, y1: 9, h: 2.6, roof: GABLE(2.5, "x", { hip0: 4.9, hip1: 4.9 }), winS: [[1, 3, 0.93, 2.19, 2], [4, 5.4], [8.8, 12.4, 0.5, 2.19, 3]], doors: [[6.5, 7.5]] },
        { x0: 15, y0: 2.5, x1: 21.3, y1: 9, h: 2.5, roof: FLAT, gates: [[15.3, 17.8], [18.3, 20.8]], winE: [[4.4, 6, 1.5, 2.1]] },
      ],
      walls: { s1: { kind: "S", wing: 0, u1: 21.3, top: 2.1 }, e1: { kind: "E", wing: 1 } },
      drive: [[15, 9, 21.2, 16], [6.3, 9, 7.7, 12.6], [6.3, 11.2, 15, 12.6]],
      slots: [{ x: 15.64, y: 9.75 }, { x: 18.64, y: 9.75 }],
      chargers: [{ w: "s1", u: 17.87 }, { w: "s1", u: 20.87 }],
      gateway: { w: "s1", u: 14.3 }, battery: { w: "s1", u: 13.2 }, heat: { x: 21.55, y: 5 }, street: [14.55, 16],
      solar: { wing: 0, face: "S", a: 4.6, b: 10.4, wall: "s1", k1: 0.8 },
      trees: [[-2.6, 6, 1], [2, 13.5, 0.9], [10, -2.6, 0.9], [24.5, 3, 0.85]],
      lamps: [[7.8, 9], [18.05, 9]],
    },
    // A house with a steep roof and a dormer, and a garage of its own.
    storey: {
      wings: [
        { x0: 0, y0: 0, x1: 11, y1: 8.5, h: 2.9, roof: GABLE(4.2), winS: [[1, 2.6, 0.93, 2.3, 2], [3.2, 4.4, 0.93, 2.3], [7, 8.4, 0.93, 2.3], [9, 10.2, 0.93, 2.3]], doors: [[5.1, 6.1, 2.25]], winE: [[1.5, 3, 0.93, 2.3], [5.5, 7, 0.93, 2.3], [3.5, 5, 3.6, 5]], dormers: [[1.3, 3.7, 3.9, 5.5]] },
        { x0: 12.5, y0: 2, x1: 19, y1: 8.5, h: 2.5, roof: GABLE(1.5, "y"), gates: [[12.8, 15.2], [15.7, 18.1]] },
      ],
      walls: { s1: { kind: "S", wing: 1 }, e1: { kind: "E", wing: 1 }, s2: { kind: "S", wing: 0 } },
      drive: [[12.3, 8.5, 19.3, 16], [4.9, 8.5, 6.3, 12.4], [4.9, 11, 12.3, 12.4]],
      slots: [{ x: 13.1, y: 9.25 }, { x: 16.0, y: 9.25 }],
      chargers: [{ w: "s1", u: 15.27 }, { w: "s1", u: 18.25 }],
      gateway: { w: "e1", u: 7.6 }, battery: { w: "e1", u: 5.8 }, heat: { x: 19.25, y: 2.2 }, street: [20.4, 16],
      solar: { wing: 0, face: "S", a: 4.6, b: 10.6, wall: "s2", k0: 0.2, k1: 0.8 },
      trees: [[-2.6, 4, 1], [1, 13, 0.95], [8, -2.6, 0.9], [22.5, 4, 0.85]],
      lamps: [[6.4, 8.5, 2.5], [15.45, 8.5]],
    },
    // A terraced house in two storeys: the one in the middle, with the neighbours on both sides.
    terrace: {
      wings: [
        { x0: -6, y0: 0, x1: 0, y1: 9, h: 5.4, roof: GABLE(2.3, "x", { val1: 0.01 }), winS: [[-5.5, -4.4, 1.1, 2.3], [-5.2, -3.4, 3.4, 4.7, 2], [-2.6, -0.8, 3.4, 4.7, 2]], doors: [[-2.8, -1.8]] },
        { x0: 0, y0: 0, x1: 6, y1: 9, h: 5.4, roof: GABLE(2.3, "x", { val0: 0.01, val1: 0.01 }), winS: [[0.5, 1.6, 1.1, 2.3], [0.8, 2.6, 3.4, 4.7, 2], [3.4, 5.2, 3.4, 4.7, 2]], doors: [[3.2, 4.2]] },
        { x0: 6, y0: 0, x1: 12, y1: 9, h: 5.4, roof: GABLE(2.3, "x", { val0: 0.01 }), winS: [[6.5, 7.6, 1.1, 2.3], [6.8, 8.6, 3.4, 4.7, 2], [9.4, 11.2, 3.4, 4.7, 2]], doors: [[9.2, 10.2]], winE: [[2, 3.6, 3.4, 4.7, 2], [5.5, 7, 0.93, 2.3]] },
      ],
      walls: { s1: { kind: "S", wing: 1, top: 2.6 } },
      drive: [[0.2, 9, 5.8, 15.5], [-6.5, 15.5, 12.5, 18.5]],
      slots: [{ x: 0.5, y: 9.75 }, { x: 3.3, y: 9.75 }],
      chargers: [{ w: "s1", u: 2.6 }, { w: "s1", u: 5.3 }],
      gateway: { w: "s1", u: 4.45 }, battery: { w: "s1", u: 1.8 }, heat: { x: 6.3, y: 9.15 }, heatFace: "S", street: [4.7, 15.5],
      solar: { wing: 1, face: "S", a: 0.3, b: 5.7, wall: "s1" },
      trees: [[-9, 4, 0.95], [15.5, 3, 0.9], [-4, 13, 0.8], [10.5, 13, 0.8]],
      lamps: [[4.35, 9, 2.5, 18]],
    },
  // A house and a flat-roofed garage beside it.
  classic: {
    wings: [
      { x0: 6, y0: 2, x1: 14, y1: 8.6, h: 3.2, roof: GABLE(2.55), winS: [[8, 9.8, 0.93, 2.19, 2], [11, 13.4, 0.75, 2.6, 2]], doors: [[6.55, 7.45]], winE: [[3.2, 7.4, 0.7, 2.6, 3]] },
      { x0: -1.4, y0: 4.4, x1: 6, y1: 9.8, h: 2.65, roof: FLAT, gates: [[-1.15, 1.3], [2.8, 5.25]] },
    ],
    walls: { s1: { kind: "S", wing: 1 }, s2: { kind: "S", wing: 0 }, e1: { kind: "E", wing: 0 } },
    slots: [{ x: -0.9, y: 10.3 }, { x: 3.05, y: 10.3 }],
    chargers: [{ w: "s1", u: 1.45 }, { w: "s1", u: 5.4 }],
    gateway: { w: "s2", u: 9.4 }, battery: { w: "s2", u: 8.15 }, heat: { x: 14.55, y: 7.55 }, heatFace: "S",
    solar: { wing: 0, face: "S", a: 6.6, b: 13.4 },
  },
  // Marielystvej 50: an L of two wings under one roof of 25°, the garage at the end of the wing along the road.
  angle: {
    wings: [
      { x0: 0, y0: 0, x1: 8.51, y1: 10.68, h: 2.63, roof: GABLE(2.21, "y", { val1: 4.25 }), winE: [[4.73, 6.78, 0.05, 2.2, 2], [8.4, 10.45, 0.05, 2.2, 2]] },
      { x0: 0, y0: 10.68, x1: 21.35, y1: 19.19, h: 2.63, roof: GABLE(2.21), winS: [[1.91, 3.84, 0.93, 2.19, 2], [6.65, 8.58, 0.93, 2.19, 2], [10.5, 10.86, 0.02, 2.19], [11.69, 13.62, 0.93, 2.19, 2]], doors: [[13.85, 14.85]], gates: [[15.05, 17.58], [18.11, 20.64]], winE: [[13.79, 15.3, 1.6, 2.19], [16.37, 17.88, 1.6, 2.19]] },
    ],
    walls: { s1: { kind: "S", wing: 1 }, e1: { kind: "E", wing: 1 } },
    slots: [{ x: 15.39, y: 19.94 }, { x: 18.45, y: 19.94 }],
    chargers: [{ w: "s1", u: 17.66 }, { w: "s1", u: 20.82 }],
    gateway: { w: "s1", u: 14.1 }, battery: { w: "s1", u: 10.98 }, heat: { x: 21.55, y: 13.1 },
    solar: { wing: 1, face: "S", a: 1.2, b: 13.2 },
  },
};

/* Where the things of a design stand, moved so the middle of it all is at 0,0: the wings, the two parking
   places, the chargers, battery and gateway on their walls, the heat pump, the solar panels; and how far
   from the middle the furthest corner is, so the disc can be made just big enough. */
function layoutOf(key) {
  const D = DESIGNS[key], W = D.wings;
  const wallPt = ({ w, u }, out = 0) => { const wl = D.walls[w], g = W[wl.wing]; return wl.kind === "S" ? { x: u, y: g.y1 + out, kind: "S" } : { x: g.x1 + out, y: u, kind: "E" }; };
  const rects = [...W.map((g) => [g.x0, g.y0, g.x1, g.y1]), ...D.slots.map((s) => [s.x, s.y, s.x + 1.9, s.y + 4.7]), [D.heat.x - .6, D.heat.y - .6, D.heat.x + .6, D.heat.y + .6]];
  const x0 = Math.min(...rects.map((r) => r[0])), y0 = Math.min(...rects.map((r) => r[1])), x1 = Math.max(...rects.map((r) => r[2])), y1 = Math.max(...rects.map((r) => r[3]));
  // the smallest circle round all the corners: the disc is no bigger than it must be
  const pts = rects.flatMap(([a, b, c, d]) => [[a, b], [c, b], [a, d], [c, d]]);
  const holds = (C) => pts.every(([x, y]) => Math.hypot(x - C[0], y - C[1]) <= C[2] + 1e-6);
  let best = [(x0 + x1) / 2, (y0 + y1) / 2, Infinity];
  const tryC = (C) => { if (C && C[2] < best[2] && holds(C)) best = C; };
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const [a, b] = [pts[i], pts[j]]; tryC([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(a[0] - b[0], a[1] - b[1]) / 2]);
    for (let k = j + 1; k < pts.length; k++) {
      const c = pts[k], d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])); if (Math.abs(d) < 1e-9) continue;
      const A = a[0] ** 2 + a[1] ** 2, B = b[0] ** 2 + b[1] ** 2, Cc = c[0] ** 2 + c[1] ** 2;
      const ux = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + Cc * (a[1] - b[1])) / d, uy = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + Cc * (b[0] - a[0])) / d;
      tryC([ux, uy, Math.hypot(a[0] - ux, a[1] - uy)]);
    }
  }
  const [cx, cy, r] = best;
  return { D, key, cx, cy, r, wallPt, slots: D.slots, chargers: D.chargers.map((c) => wallPt(c)), battery: wallPt(D.battery), gateway: wallPt(D.gateway), heat: { ...D.heat, face: D.heatFace || "E" } };
}

/* A design in clay: walls with their windows, doors and garage doors, the roofs (gabled, hipped, flat, joined
   to the next wing where they meet), and the solar panels on the slope the panel puts them on. */
function drawDesign(Wd, L, o) {
  const { P, box, poly, lit, ctx, add } = Wd, D = L.D, dx = -L.cx, dy = -L.cy, O = .45, light = o.light;
  const night = light.night, wallC = (g) => (g.wood ? "#b48a62" : "#e8ecf2"), roofC = (g) => (g.wood ? [92, 74, 62] : [58, 66, 86]);
  const glass = (q) => { if (night) { ctx.save(); ctx.shadowColor = "#ffb547"; ctx.shadowBlur = 10; poly(q, "#ffd27a"); ctx.restore(); } else poly(q, css(lit([120, 146, 180], 1))); };
  D.wings.forEach((g, wi) => {
    const x0 = g.x0 + dx, x1 = g.x1 + dx, y0 = g.y0 + dy, y1 = g.y1 + dy, h = g.h, r = g.roof, nb = o.dim && o.dim(wi);
    Wd.shadow(x0, y0, x1 - x0, y1 - y0, -990, .4);
    box(x0, y0, 0, x1 - x0, y1 - y0, h, nb ? "#c9ced8" : wallC(g), {
      alpha: o.alpha,
      fy: () => {
        const Y = y1 + .01;
        for (const [a, b, z0 = .93, z1 = 2.19] of g.winS || []) glass([[a + dx, Y, z0], [b + dx, Y, z0], [b + dx, Y, z1], [a + dx, Y, z1]]);
        for (const [a, b, z1 = 2.1] of g.doors || []) poly([[a + dx, Y, 0], [b + dx, Y, 0], [b + dx, Y, z1], [a + dx, Y, z1]], css(lit([70, 80, 104], 1)));
        for (const [a, b] of g.gates || []) { poly([[a + dx, Y, 0], [b + dx, Y, 0], [b + dx, Y, 2.1], [a + dx, Y, 2.1]], css(lit([196, 202, 214], 1))); for (let k = 1; k < 4; k++) poly([[a + dx, Y, k * .52], [b + dx, Y, k * .52], [b + dx, Y, k * .52 + .04], [a + dx, Y, k * .52 + .04]], css(lit([150, 158, 176], 1))); }
      },
      // the back and the far gable, seen when the disc turns: the same windows, no doors
      fmy: () => { const Y = y0 - .01; for (const [a, b, z0 = .93, z1 = 2.19] of g.winS || []) glass([[a + dx, Y, z0], [b + dx, Y, z0], [b + dx, Y, z1], [a + dx, Y, z1]]); },
      fmx: () => { const X = x0 - .01; for (const [a, b, z0 = .93, z1 = 2.19] of g.winE || []) glass([[X, a + dy, z0], [X, b + dy, z0], [X, b + dy, z1], [X, a + dy, z1]]); },
      fx: () => {
        const X = x1 + .01;
        for (const [a, b, z0 = .93, z1 = 2.19] of g.winE || []) glass([[X, a + dy, z0], [X, b + dy, z0], [X, b + dy, z1], [X, a + dy, z1]]);
        for (const [a, b, z1 = 2.1] of g.doorsE || []) poly([[X, a + dy, 0], [X, b + dy, 0], [X, b + dy, z1], [X, a + dy, z1]], css(lit([70, 80, 104], 1)));
      },
    });
    const rc = roofC(g), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    if (r.type === "flat") box(x0 - .12, y0 - .12, h - .18, x1 - x0 + .24, y1 - y0 + .24, .2, rc, { alpha: o.alpha });
    // the faces of a roof, each seen only when it turns towards the viewer, shaded by where the light comes from
    const VIEW = [.62, .62, .48], LT = [-.42, .55, .72];
    const faceOf = (pts, rgb, centre) => {
      const [p0, p1, p2] = pts, u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const fc = pts.reduce((t, p) => [t[0] + p[0] / pts.length, t[1] + p[1] / pts.length, t[2] + p[2] / pts.length], [0, 0, 0]);
      if (n[0] * (fc[0] - centre[0]) + n[1] * (fc[1] - centre[1]) + n[2] * (fc[2] - centre[2]) < 0) n = n.map((q) => -q);
      const len = Math.hypot(...n) || 1, [rx, ry] = Wd.R2(n[0] / len, n[1] / len), nn = [rx, ry, n[2] / len];
      const seen = nn[0] * VIEW[0] + nn[1] * VIEW[1] + nn[2] * VIEW[2] > .01;
      return { pts, rgb, seen, b: .78 + .32 * Math.max(0, nn[0] * LT[0] + nn[1] * LT[1] + nn[2] * LT[2]) };
    };
    const faces = [];
    let solarFace = null;
    if (r.type !== "flat") {
      const z = h + r.rise, X = r.axis !== "y";
      const along = X ? [x0, x1] : [y0, y1], a = along[0] - (r.val0 ? 0 : O), b = along[1] + (r.val1 ? 0 : O);
      const ra = r.val0 ? along[0] - r.val0 : a + (r.hip0 || 0), rb = r.val1 ? along[1] + r.val1 : b - (r.hip1 || 0);
      const m = X ? my : mx, n0 = (X ? y0 : x0) - O, n1 = (X ? y1 : x1) + O;
      const pt = (u, v, zz) => (X ? [u, v, zz] : [v, u, zz]); // u along the ridge, v across it
      const centre = [mx, my, h + r.rise / 3], wallRgb = hexRgb(nb ? "#c9ced8" : wallC(g));
      faces.push(faceOf([pt(a, n0, h), pt(b, n0, h), pt(rb, m, z), pt(ra, m, z)], rc, centre));
      faces.push(faceOf([pt(a, n1, h), pt(b, n1, h), pt(rb, m, z), pt(ra, m, z)], rc, centre));
      solarFace = faces[1];
      for (const [end, ridgeEnd, hip, val, wallAt] of [[a, ra, r.hip0, r.val0, along[0]], [b, rb, r.hip1, r.val1, along[1]]]) {
        if (val) continue;
        if (hip) faces.push(faceOf([pt(end, n0, h), pt(end, n1, h), pt(ridgeEnd, m, z)], rc, centre));
        else faces.push(faceOf([pt(wallAt, X ? y0 : x0, h), pt(wallAt, X ? y1 : x1, h), pt(wallAt, m, z)], wallRgb, centre));
      }
    }
    add(Wd.D(mx, my) + .5, () => {
      ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
      for (const f of faces) if (f.seen) poly(f.pts, css(lit(f.rgb, f.b)));
      // the solar panels, on the slope or the flat roof the design has room for, when that side is seen
      const S = D.solar;
      if (o.solar && S && S.wing === wi && (r.type === "flat" || (solarFace && solarFace.seen))) {
        const rows = S.rows || 2, cols = Math.max(1, Math.round((S.b - S.a) / 1.13)), step = (S.b - S.a) / cols, k0 = S.k0 ?? .14, k1 = S.k1 ?? .88, sh = o.shine || 0;
        const pc = [40, 56, 96].map((v, j) => lerp(v, [126, 156, 236][j], sh));
        if (sh > .05) { ctx.shadowColor = `rgba(255,214,92,${.8 * sh})`; ctx.shadowBlur = 8 * sh; }
        const at = (u, k) => {
          if (r.type === "flat") return [u + dx, lerp(y0 + .6, y1 - .6, k), h + .06];
          const z = h + r.rise;
          if (S.face === "E") return [lerp(x1 + O, mx, k), u + dy, lerp(h, z, k)];
          return [u + dx, lerp(y1 + O, my, k), lerp(h, z, k)];
        };
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const u0 = S.a + i * step + .06, u1 = S.a + (i + 1) * step - .06, ka = k0 + ((k1 - k0) * j) / rows + .02, kb = k0 + ((k1 - k0) * (j + 1)) / rows - .02;
          poly([at(u0, ka), at(u1, ka), at(u1, kb), at(u0, kb)], css(lit(pc, 1.1)), `rgba(255,236,170,${.15 + .4 * sh})`);
        }
      }
      ctx.restore();
    });
  });
}

/* ---------- the words */
const TEXT = {
  da: {
    now: "NU", span_now: "nu", ahead: "Se frem", ahead_now: "nu", back: "Nu", ahead_hint: "Sådan ser det ud da · træk tilbage for nu",
    today: "i dag", tomorrow: "i morgen", after: "i overmorgen",
    out: "{car} ude", out_till: "{car} ude · hjem {t}", leaves: "{car} kører {t}", leaves_pct: "{car} kører {t} · {pct}",
    charges: "{car} lader {span}", charges_to: "{car} lader {span} → {pct}",
    holo_live: "{car} · {kw} · {price}", holo_plan: "{car} lader · {price}", holo_wait: "{car} venter på billig strøm", holo_free: "Laderen er ledig",
    all_ok: "Alt er klar", missing: "Noget mangler", is_charging: "{car} lader", is_plugged: "{car} er i kablet", none_charging: "Ingen lader",
    tier_lo: "billigt", tier_mid: "normalt", tier_hi: "dyrt", is_tier: "{price} er {tier}",
    st_charging: "lader", st_plugged: "i kablet", st_home: "hjemme", st_out: "ude",
    d_charging: "lader nu", d_plugged: "i kablet, venter på billig strøm", d_home: "hjemme, ikke i kablet", d_out: "ude",
    ready: "Klar", short: "Mangler", trip_pct: "turen {pct}",
    s_charge: "Lader", s_charge_to: "Lader til {pct}", s_leaves: "Kører", s_with: "med {pct}", s_done: "færdig {t}",
    a_now: "Lad nu", a_ready: "Klar kl.", a_climate: "Klima", a_open: "Åbn bilen",
    next: "Det næste", nothing: "Intet planlagt de næste 36 timer",
    sun: "Sol", battery: "Batteri", heat: "Varmepumpe", grid: "Nettet", price: "Pris",
    buys: "Køber {kw} · {price}", sells: "Sælger {kw}", balance: "Huset klarer sig selv",
    sun_on: "giver strøm", sun_off: "ingen sol", b_charge: "lader", b_give: "leverer", b_idle: "venter", h_on: "varmer", h_off: "slukket", g_buy: "køber", g_sell: "sælger", g_even: "i balance",
    sun_day: "Sol {day} · {kwh}", sun_now: "Sol nu–{t} · {kwh}", s_sun: "Solen giver strøm", s_sun_detail: "{kwh} efter prognosen, mest kl. {t}",
    day36: "De næste 36 timer", r_sun: "fra solen efter prognosen", r_car: "til {car} · {price}/kWh", r_cheap: "billigst {span}", r_dear: "dyrest {span}", r_house: "huset bruger nu",
    own_battery: "Batteriet styres af sig selv, ikke af EV Planner. Her er det lige nu.", own_heat: "Varmepumpen styres af sig selv, ikke af EV Planner. Her er den lige nu.",
    own_grid: "Nettet tager det, sol og batteri ikke dækker. Kanten af skiven lyser i timens pris.", own_sun: "Solen efter Energi-dashboardets prognose.",
    one_cable: "Én lader til to biler: den bil, der sidder i kablet, beholder det om natten.", inside: "{t}",
    label_cars: "Drejeskiven: bilerne på en skive, ringen om den er de næste 36 timer. Træk til siden for at se frem. Tryk på en bil for dens plan.",
    label_house: "Husets hjul: huset på en skive, ringen om den er de næste 36 timer. Træk til siden for at se frem. Tryk på en ting for at se den.",
  },
  en: {
    now: "NOW", span_now: "now", ahead: "Look ahead", ahead_now: "Now", back: "Now", ahead_hint: "How it will look · drag back for now",
    today: "today", tomorrow: "tomorrow", after: "the day after",
    out: "{car} out", out_till: "{car} out · home {t}", leaves: "{car} leaves {t}", leaves_pct: "{car} leaves {t} · {pct}",
    charges: "{car} charges {span}", charges_to: "{car} charges {span} → {pct}",
    holo_live: "{car} · {kw} · {price}", holo_plan: "{car} charges · {price}", holo_wait: "{car} waits for cheap power", holo_free: "The charger is free",
    all_ok: "All ready", missing: "Something is short", is_charging: "{car} charges", is_plugged: "{car} is plugged in", none_charging: "Nothing charges",
    tier_lo: "cheap", tier_mid: "normal", tier_hi: "dear", is_tier: "{price} is {tier}",
    st_charging: "charging", st_plugged: "plugged in", st_home: "home", st_out: "out",
    d_charging: "charging now", d_plugged: "plugged in, waiting for cheap power", d_home: "home, not plugged in", d_out: "out",
    ready: "Ready", short: "Short", trip_pct: "the trip {pct}",
    s_charge: "Charges", s_charge_to: "Charges to {pct}", s_leaves: "Leaves", s_with: "with {pct}", s_done: "done {t}",
    a_now: "Charge now", a_ready: "Ready by", a_climate: "Climate", a_open: "Open the car",
    next: "Next", nothing: "Nothing planned in the next 36 hours",
    sun: "Sun", battery: "Battery", heat: "Heat pump", grid: "Grid", price: "Price",
    buys: "Buys {kw} · {price}", sells: "Sells {kw}", balance: "The house manages on its own",
    sun_on: "giving power", sun_off: "no sun", b_charge: "charging", b_give: "giving", b_idle: "waiting", h_on: "heating", h_off: "off", g_buy: "buying", g_sell: "selling", g_even: "in balance",
    sun_day: "Sun {day} · {kwh}", sun_now: "Sun now–{t} · {kwh}", s_sun: "The sun gives power", s_sun_detail: "{kwh} by the forecast, most at {t}",
    day36: "The next 36 hours", r_sun: "from the sun by the forecast", r_car: "to {car} · {price}/kWh", r_cheap: "cheapest {span}", r_dear: "dearest {span}", r_house: "the house uses now",
    own_battery: "The battery runs itself, not EV Planner. This is it now.", own_heat: "The heat pump runs itself, not EV Planner. This is it now.",
    own_grid: "The grid gives what the sun and the battery do not. The disc's edge glows in the hour's price.", own_sun: "The sun by the Energy dashboard's forecast.",
    one_cable: "One charger for two cars: the car on the cable keeps it through the night.", inside: "{t}",
    label_cars: "The turntable: the cars on a disc, the ring round it the next 36 hours. Drag sideways to look ahead. Tap a car for its plan.",
    label_house: "The house's wheel: the house on a disc, the ring round it the next 36 hours. Drag sideways to look ahead. Tap a thing to see it.",
  },
};
const fill = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_m, k) => (v[k] ?? ""));
const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const WHEEL_CSS = `
  :host { display: block; position: relative; color: var(--x-ink, #f1f3ff); font-family: var(--x-text, Inter, system-ui, sans-serif); }
  canvas { display: block; width: 100%; touch-action: pan-y; cursor: grab; border-radius: 22px; -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%); mask-image: linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%); }
  .scrub { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 10px; margin: 4px 2px 6px; }
  .scrub label { font: 600 10.5px/1 var(--x-mono, ui-monospace, monospace); letter-spacing: .1em; text-transform: uppercase; color: var(--x-soft, #9ba2c6); }
  .scrub input { width: 100%; accent-color: var(--x-acc, #ffb547); }
  .scrub output { font: 800 13px/1 var(--x-display, inherit); min-width: 70px; text-align: right; }
  .scrub button { border: 1px solid var(--x-line2, rgba(214,222,255,.2)); background: transparent; color: var(--x-ink, inherit); border-radius: 999px; padding: 5px 11px; font: 700 12px var(--x-text, Inter, system-ui, sans-serif); cursor: pointer; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0 2px 10px; font: 600 10.5px/1.4 var(--x-text, Inter, system-ui, sans-serif); color: var(--x-soft, #9ba2c6); }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .legend i { width: 14px; height: 6px; border-radius: 3px; background: var(--c); }
  .pills { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 8px; }
  .pill { display: grid; gap: 2px; text-align: left; padding: 10px 12px; border-radius: 16px; border: 1px solid var(--x-line, rgba(214,222,255,.12)); background: var(--x-card2, rgba(255,255,255,.04)); color: inherit; font: inherit; cursor: pointer; position: relative; overflow: hidden; }
  .pill i { position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: var(--c); }
  .pill b { font: 800 16px/1.1 var(--x-display, inherit); font-variant-numeric: tabular-nums; }
  .pill small { font-size: 11.5px; color: var(--x-soft, #9ba2c6); line-height: 1.25; }
  .pill[aria-pressed="true"] { border-color: var(--c); box-shadow: 0 0 0 1px var(--c); }
  .box { margin-top: 12px; padding: 12px 14px; border-radius: 18px; background: var(--x-card2, rgba(255,255,255,.04)); border: 1px solid var(--x-line, rgba(214,222,255,.12)); }
  .box h3 { margin: 0 0 8px; font: 800 14px var(--x-display, inherit); }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  li { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 2px 10px; font-size: 12.5px; padding-left: 10px; border-left: 3px solid var(--c, var(--x-line2)); }
  li time { white-space: nowrap; font: 600 10px/1.5 var(--x-mono, ui-monospace, monospace); color: var(--x-soft, #9ba2c6); text-transform: uppercase; }
  li span { color: var(--x-soft, #9ba2c6); grid-column: 2; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .head small { display: block; font: 700 12px var(--x-text, Inter, system-ui, sans-serif); color: var(--c); }
  .head b { display: block; font: 900 30px/1 var(--x-display, inherit); letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .head span { font-size: 12px; color: var(--x-soft, #9ba2c6); }
  .ready { display: flex; align-items: center; gap: 8px; padding: 7px 11px; border-radius: 14px; background: color-mix(in srgb, var(--x-good, #3ee08f) 16%, transparent); color: var(--x-good, #3ee08f); font: 800 13px/1.1 var(--x-display, inherit); }
  .ready.no { background: color-mix(in srgb, var(--x-coral, #ff7a6b) 16%, transparent); color: var(--x-coral, #ff7a6b); }
  .ready small { display: block; font: 600 11px var(--x-text, Inter, system-ui, sans-serif); color: var(--x-soft, #9ba2c6); }
  .bar { position: relative; height: 10px; border-radius: 5px; background: var(--x-well, rgba(255,255,255,.08)); margin: 20px 0 6px; }
  .bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 5px; background: var(--c); }
  .bar i.plan { opacity: .45; border-radius: 0 5px 5px 0; }
  .bar em { position: absolute; top: -5px; bottom: -5px; width: 2px; background: var(--x-ink, #fff); font-style: normal; }
  .bar em span { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); white-space: nowrap; font: 600 9.5px var(--x-mono, monospace); color: var(--x-soft, #9ba2c6); margin-bottom: 2px; }
  .note { margin: 10px 0 0; font-size: 12.5px; color: var(--x-soft, #9ba2c6); line-height: 1.45; }
  .steps { margin-top: 12px; }
  .acts { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
  .acts button { min-height: 38px; border-radius: 12px; border: 1px solid var(--x-line2, rgba(214,222,255,.2)); background: transparent; color: inherit; font: 600 12px var(--x-text, Inter, system-ui, sans-serif); cursor: pointer; }
  .acts button.open { background: var(--x-acc, #ffb547); color: var(--x-acc-ink, #2a1700); border: 0; font-weight: 700; }
  .day { display: grid; gap: 7px; }
  .day div { display: grid; grid-template-columns: 10px 78px minmax(0, 1fr); gap: 8px; align-items: baseline; font-size: 12.5px; }
  .day i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); align-self: center; }
  .day b { font: 800 13px var(--x-display, inherit); font-variant-numeric: tabular-nums; }
  .day span { color: var(--x-soft, #9ba2c6); }
  button:focus-visible { outline: 2px solid var(--x-acc, #ffb547); outline-offset: 2px; }
  [hidden] { display: none !important; }
`;

/* ---------- the element */
class EvPlannerWheel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.st = { T: null, V: null, focus: null, cam: { z: 1, x: 0, y: 0 }, spin: 0, last: 0, born: {}, hits: [], drag: null };
    this.m = null;
  }

  get mode() { return this.getAttribute("mode") === "house" ? "house" : "cars"; }

  set model(m) {
    const first = !this.m;
    const offset = this.st.V != null && this.st.T != null ? this.st.V - this.st.T : 0;
    const before = this.m ? new Set(this._ids()) : null;
    this.m = m;
    this._prepare();
    this.st.T = m.nowH;
    this.st.V = m.nowH + clamp(offset, 0, 35.5);
    if (before) for (const id of this._ids()) if (!before.has(id)) this.st.born[id] = performance.now();
    if (this.st.focus && !this._ids().includes(this.st.focus) && this.st.focus !== "grid" && this.st.focus !== "sun") this.st.focus = null;
    if (first) this._build();
    this._ui();
    this._S?.redraw();
  }

  _t(key, v) { return fill((TEXT[this.m?.lang] || TEXT.da)[key] ?? TEXT.da[key] ?? key, v); }

  /* ---------- what the model says, made easy to ask */
  _prepare() {
    const m = this.m;
    m.cars = (m.cars || []).slice(0, 2);
    for (const c of m.cars) {
      c.charges = (c.charges || []).filter((x) => x.b > m.nowH - .05).sort((a, b) => a.a - b.a);
      c.deps = (c.deps || []).filter((d) => d.h > m.nowH).sort((a, b) => a.h - b.h);
      c.leave = c.here && c.deps.length ? c.deps[0].h : Infinity;
      // the level through the hours: now, then each charge lifting it to its level
      const pts = [[m.nowH, Number(c.soc) || 0]];
      let lv = Number(c.soc) || 0;
      for (const x of c.charges) { const a = Math.max(x.a, m.nowH); pts.push([a, lv]); if (Number.isFinite(x.level)) lv = Math.max(lv, x.level); pts.push([Math.max(a, x.b), lv]); }
      c.pts = pts;
    }
    if (this.mode === "house") { this.lay = layoutOf(DESIGNS[m.house?.design] ? m.house.design : "classic"); this._geometry(); }
  }
  _ids() { const m = this.m; if (!m) return []; const ids = m.cars.map((c) => c.id); if (this.mode === "house") { if (m.house?.sun) ids.unshift("sun"); if (m.house?.battery) ids.push("battery"); if (m.house?.heat) ids.push("heat"); } return ids; }
  _priceAt(h) { const x = this.m.prices?.[Math.floor(h)]; return x && Number.isFinite(x.p) ? x.p : null; }
  _priceRgb(p) {
    if (p == null) return [120, 130, 160];
    const { lo, hi } = this.m, k = clamp((p - lo) / (hi - lo || 1), 0, 1), a = [62, 224, 143], md = [245, 185, 74], d = [255, 122, 107];
    return k < .5 ? a.map((v, i) => lerp(v, md[i], k * 2)) : md.map((v, i) => lerp(v, d[i], (k - .5) * 2));
  }
  _tier(p) { const { lo, hi } = this.m, k = (p - lo) / (hi - lo || 1); return k < .33 ? "lo" : k < .66 ? "mid" : "hi"; }
  _hhmm(h) { const sep = this.m.lang === "da" ? "." : ":", t = ((h % 24) + 24) % 24, hh = Math.floor(t), mm = Math.round((t - hh) * 60); return `${String(mm === 60 ? (hh + 1) % 24 : hh).padStart(2, "0")}${sep}${String(mm % 60).padStart(2, "0")}`; }
  _tt(h) { return Math.abs(h - Math.round(h)) < .02 ? String(((Math.round(h) % 24) + 24) % 24).padStart(2, "0") : this._hhmm(h); }
  _rel(h) { return [this._t("today"), this._t("tomorrow"), this._t("after")][clamp(Math.floor(h / 24) - Math.floor(this.st.T / 24), 0, 2)]; }
  _relP(h) { return Math.floor(h / 24) > Math.floor(this.st.T / 24) ? `${this._rel(h)} ` : ""; }
  _span(a, b) { return a <= this.st.T + .05 ? `${this._t("span_now")}–${this._tt(b)}` : `${this._relP(a)}${this._tt(a)}–${this._tt(b)}`; }
  _when(h) { return `${this._rel(h)} ${this._hhmm(h)}`; }
  _pct(v) { return `${Math.round(v)} %`; }
  _kw(v) { return `${this.m.num(Math.abs(v), 1)} kW`; }
  _price(p) { return p == null ? "–" : this.m.money(p); }
  _short(c) { return String(c.name).split(" ")[0]; }

  _charging(c, h) { return c.charges.some((x) => h >= x.a && h < x.b) || (c.charging && h < this.st.T + .25 && h >= this.st.T - .01); }
  _home(c, h) { return this._charging(c, h) || (c.here && h < c.leave); }
  _plugged(c, h) { return this._charging(c, h) || (c.plugged && c.here && h < c.leave && h < this.st.T + 18); }
  _level(c, h) { const P = c.pts; if (h <= P[0][0]) return P[0][1]; for (let i = 0; i < P.length - 1; i++) if (h >= P[i][0] && h <= P[i + 1][0]) return lerp(P[i][1], P[i + 1][1], (h - P[i][0]) / (P[i + 1][0] - P[i][0] || 1)); return P[P.length - 1][1]; }
  _readyFor(c) { const d = c.deps.find((x) => Number.isFinite(x.pct)); return d ? { d, ok: this._level(c, d.h - .01) >= d.pct - .5 } : null; }
  _sunAt(h) { const L = this.m.house?.sun?.hours; if (!L) return 0; const x = L.find((q) => h >= q.h && h < q.h + 1); return x ? x.kw : 0; }

  /* the periods in the ring, each with one sentence */
  _periods(id) {
    const T = this.st.T, E = T + 36, out = [];
    const c = this.m.cars.find((x) => x.id === id);
    if (c) {
      const name = this._short(c);
      if (!c.here) {
        const back = c.charges.find((x) => x.a > T)?.a;
        out.push({ id, kind: "out", a: T, b: back ?? E, txt: back ? this._t("out_till", { car: name, t: this._hhmm(back) }) : this._t("out", { car: name }) });
      } else if (c.leave < E) {
        const d = c.deps[0];
        out.push({ id, kind: "out", a: c.leave, b: E, txt: Number.isFinite(d.pct) ? this._t("leaves_pct", { car: name, t: this._hhmm(c.leave), pct: this._pct(this._level(c, c.leave - .01)) }) : this._t("leaves", { car: name, t: this._hhmm(c.leave) }) });
      }
      for (const x of c.charges) if (x.b > T && x.a < E) {
        const lv = Number.isFinite(x.level) ? this._pct(Math.max(this._level(c, x.b), x.level)) : null;
        out.push({ id, kind: "charge", a: Math.max(x.a, T), b: Math.min(x.b, E), txt: this._t(lv ? "charges_to" : "charges", { car: name, span: this._span(Math.max(x.a, T), x.b), pct: lv }) });
      }
    }
    if (id === "sun" && this.m.house?.sun?.hours) {
      let cur = null;
      for (let h = Math.floor(T); h < E; h++) {
        const kw = this._sunAt(h), on = kw > .05;
        if (on && !cur) cur = { a: Math.max(h, T), b: h + 1, e: 0, top: h, max: 0 };
        if (on) { cur.b = h + 1; cur.e += kw; if (kw > cur.max) { cur.max = kw; cur.top = h; } }
        if ((!on || h === Math.ceil(E) - 1) && cur) {
          const kwh = `${this.m.num(cur.e, cur.e < 10 ? 1 : 0)} kWh`;
          out.push({ id, kind: "sun", a: cur.a, b: cur.b, kwh, top: cur.top, txt: cur.a <= T + .05 ? this._t("sun_now", { t: this._tt(cur.b), kwh }) : this._t("sun_day", { day: this._rel(cur.a), kwh }) });
          cur = null;
        }
      }
    }
    return out;
  }

  _colorOf(id) { const c = this.m.cars.find((x) => x.id === id); return c ? c.color : { sun: "#ffd45c", battery: "#6ee7b0", heat: "#ff8a5c", grid: "#9fb4ff" }[id] || "#9fb4ff"; }
  _nameOf(id) { const c = this.m.cars.find((x) => x.id === id); return c ? this._short(c) : this._t(id); }
  _tracks() { const ids = this.m.cars.map((c) => c.id); if (this.mode === "house" && this.m.house?.sun?.hours) ids.unshift("sun"); return ids; }

  /* ---------- the page around the stage */
  _build() {
    const root = this.shadowRoot;
    root.innerHTML = `<style>${WHEEL_CSS}</style>
      <canvas height="${this.mode === "house" ? 420 : 380}" role="img"></canvas>
      <div class="scrub"><label for="ahead"></label><input id="ahead" type="range" min="0" max="35" step="0.25" value="0"><output></output><button type="button" class="back" hidden></button></div>
      <div class="legend"></div>
      <div class="pills"></div>
      <div class="box detail" hidden></div>
      <div class="box nextbox"><h3></h3><ol class="next"></ol></div>
      <div class="box daybox" hidden><h3></h3><div class="day"></div></div>`;
    const cv = root.querySelector("canvas");
    this.cv = cv;
    this._S = stage(cv, (S, t) => this._draw(S, t));
    root.querySelector("#ahead").addEventListener("input", (e) => this._view(this.st.T + Number(e.target.value)));
    root.querySelector(".back").addEventListener("click", () => this._view(this.st.T));
    root.querySelector(".pills").addEventListener("click", (e) => { const b = e.target.closest(".pill"); if (b) this._focus(this.st.focus === b.dataset.id ? null : b.dataset.id); });
    root.querySelector(".detail").addEventListener("click", (e) => { const b = e.target.closest("button[data-a]"); if (b) this._act(b.dataset.a, b.dataset.id); });
    cv.addEventListener("pointerdown", (e) => { this.st.drag = { x: e.clientX, y: e.clientY, V: this.st.V, moved: false }; });
    cv.addEventListener("pointermove", (e) => {
      const d = this.st.drag; if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - d.y)) { d.moved = true; try { cv.setPointerCapture(e.pointerId); } catch (_err) { /* a mouse */ } }
      if (d.moved) this._view(clamp(d.V + (dx / (cv.clientWidth || 1)) * 22, this.st.T, this.st.T + 35.5));
    });
    cv.addEventListener("pointercancel", () => { this.st.drag = null; });
    cv.addEventListener("pointerup", (e) => {
      const d = this.st.drag; this.st.drag = null; if (!d || d.moved) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = this.st.hits.map(([id, hx, hy]) => [id, Math.hypot(hx - x, hy - y)]).sort((a, b) => a[1] - b[1])[0];
      this._focus(hit && hit[1] < (this.mode === "house" ? 40 : 70) ? (this.st.focus === hit[0] ? null : hit[0]) : null);
    });
  }
  _view(h) { this.st.V = h; this._ui(); this._S.redraw(); }
  _focus(id) { this.st.focus = id; this._ui(); this._S.redraw(); }
  _act(a, id) {
    if (this.st.V > this.st.T + .01) this._view(this.st.T);
    this.dispatchEvent(new CustomEvent("evp-wheel", { detail: { act: a, id }, bubbles: true, composed: true }));
  }

  _ui() {
    const root = this.shadowRoot, m = this.m, T = this.st.T, V = this.st.V;
    if (!root.querySelector(".pills")) return;
    this.cv.setAttribute("aria-label", this._t(this.mode === "house" ? "label_house" : "label_cars"));
    root.querySelector("label").textContent = this._t("ahead");
    root.querySelector("#ahead").value = String(V - T);
    root.querySelector("output").textContent = V <= T + .01 ? this._t("ahead_now") : this._when(V);
    const back = root.querySelector(".back"); back.textContent = this._t("back"); back.hidden = V <= T + .01;
    root.querySelector(".legend").innerHTML = [["price", "linear-gradient(90deg,#3ee08f,#f5b94a,#ff7a6b)", this._t("price")], ...this._tracks().map((id) => [id, this._colorOf(id), this._nameOf(id)])].map(([, c, n]) => `<span style="--c:${c}"><i></i>${escH(n)}</span>`).join("");
    const pills = this.mode === "house" ? [...(m.house?.sun ? ["sun"] : []), ...(m.house?.battery ? ["battery"] : []), ...(m.house?.heat ? ["heat"] : []), ...m.cars.map((c) => c.id), "grid"] : m.cars.map((c) => c.id);
    root.querySelector(".pills").innerHTML = pills.map((id) => this._pill(id, V)).join("");
    root.querySelector(".nextbox h3").textContent = this._t("next");
    root.querySelector(".next").innerHTML = this._nextList(V);
    const day = root.querySelector(".daybox");
    day.hidden = this.mode !== "house";
    if (this.mode === "house") { day.querySelector("h3").textContent = this._t("day36"); day.querySelector(".day").innerHTML = this._dayBox(); }
    this._detail();
  }
  _pill(id, V) {
    const m = this.m, c = m.cars.find((x) => x.id === id), now = V <= this.st.T + .05, H = m.house || {};
    let val;
    if (c) val = [this._pct(this._level(c, V)), this._charging(c, V) ? this._t("st_charging") : !this._home(c, V) ? this._t("st_out") : this._plugged(c, V) ? this._t("st_plugged") : this._t("st_home")];
    else if (id === "sun") { const kw = now ? H.sun.kw ?? this._sunAt(V) : this._sunAt(V); val = [this._kw(kw || 0), (kw || 0) > .05 ? this._t("sun_on") : this._t("sun_off")]; }
    else if (id === "battery") { const b = H.battery; val = [Number.isFinite(b.soc) ? this._pct(b.soc) : "–", Math.abs(b.kw || 0) < .05 ? this._t("b_idle") : this._t(b.kw > 0 ? "b_charge" : "b_give")]; }
    else if (id === "heat") { const k = H.heat.kw || 0; val = [this._kw(k), k > .05 ? this._t("h_on") : this._t("h_off")]; }
    else { const g = this._gridAt(V); val = [g == null ? "–" : this._kw(g), g == null ? "" : g > .05 ? this._t("g_buy") : g < -.05 ? this._t("g_sell") : this._t("g_even")]; }
    return `<button class="pill" type="button" data-id="${escH(id)}" style="--c:${this._colorOf(id)}" aria-pressed="${this.st.focus === id}"><i></i><b>${escH(val[0])}</b><small>${escH(this._nameOf(id))}${val[1] ? ` · ${escH(val[1])}` : ""}</small></button>`;
  }
  _gridAt(V) {
    const H = this.m.house || {};
    if (V <= this.st.T + .05) return Number.isFinite(H.gridKw) ? H.gridKw : null;
    // ahead: what the plans and the forecast say, the house as it is now
    const cars = this.m.cars.reduce((t, c) => t + (this._charging(c, V) ? c.power || 11 : 0), 0);
    return (Number.isFinite(H.houseKw) ? H.houseKw : .6) + cars - this._sunAt(V);
  }
  _nextList(V) {
    const items = [];
    for (const c of this.m.cars) {
      for (const x of c.charges) if (x.a > V + .05) items.push({ h: x.a, c: c.color, b: `${this._short(c)} · ${Number.isFinite(x.level) ? this._t("s_charge_to", { pct: this._pct(x.level) }) : this._t("s_charge")}`, s: `${this._tt(x.a)}–${this._tt(x.b)} · ${this._price(this._priceAt(x.a))}` });
      for (const d of c.deps) if (d.h > V) items.push({ h: d.h, c: c.color, b: `${this._short(c)} · ${this._t("s_leaves")}`, s: this._t("s_with", { pct: this._pct(this._level(c, d.h - .01)) }) });
    }
    if (this.mode === "house") for (const p of this._periods("sun")) if (p.a > V + .05) items.push({ h: p.a, c: "#ffd45c", b: this._t("s_sun"), s: this._t("s_sun_detail", { kwh: p.kwh, t: this._tt(p.top) }) });
    const list = items.filter((x) => x.h < this.st.T + 36).sort((a, b) => a.h - b.h).slice(0, 3);
    if (!list.length) return `<li><time>–</time><b>${escH(this._t("nothing"))}</b></li>`;
    return list.map((x) => `<li style="--c:${x.c}"><time>${escH(this._when(x.h))}</time><b>${escH(x.b)}</b><span>${escH(x.s)}</span></li>`).join("");
  }
  _dayBox() {
    const T = this.st.T, rows = [];
    const sun = this._periods("sun").reduce((t, p) => t + parseFloat(String(p.kwh).replace(",", ".")), 0);
    if (this.m.house?.sun?.hours) rows.push(["#ffd45c", `${this.m.num(sun, sun < 10 ? 1 : 0)} kWh`, this._t("r_sun")]);
    for (const c of this.m.cars) {
      let kwh = 0, cost = 0;
      for (const x of c.charges) if (x.b > T && x.a < T + 36) { kwh += Number(x.kwh) || 0; cost += Number(x.cost) || 0; }
      if (kwh > 0) rows.push([c.color, `${this.m.num(kwh, 0)} kWh`, this._t("r_car", { car: this._short(c), price: this._price(cost / kwh) })]);
    }
    const hours = [];
    for (let h = Math.floor(T) + 1; h < T + 36; h++) { const p = this._priceAt(h); if (p != null) hours.push([h, p]); }
    if (hours.length > 3) {
      const best = (sign) => { let bi = 0, bv = Infinity; for (let i = 0; i + 1 < hours.length; i++) { const v = sign * (hours[i][1] + hours[i + 1][1]); if (hours[i + 1][0] === hours[i][0] + 1 && v < bv) { bv = v; bi = i; } } return hours[bi]; };
      const lo = best(1), hi = best(-1);
      rows.push(["#3ee08f", this._price(lo[1]), this._t("r_cheap", { span: `${this._relP(lo[0])}${this._tt(lo[0])}–${this._tt(lo[0] + 2)}` })]);
      rows.push(["#ff7a6b", this._price(hi[1]), this._t("r_dear", { span: `${this._relP(hi[0])}${this._tt(hi[0])}–${this._tt(hi[0] + 2)}` })]);
    }
    if (Number.isFinite(this.m.house?.houseKw)) rows.push(["#9fb4ff", this._kw(this.m.house.houseKw), this._t("r_house")]);
    return rows.map(([c, v, s]) => `<div style="--c:${c}"><i></i><b>${escH(v)}</b><span>${escH(s)}</span></div>`).join("");
  }
  _detail() {
    const box = this.shadowRoot.querySelector(".detail"), id = this.st.focus, V = this.st.V, m = this.m;
    this.shadowRoot.querySelector(".nextbox").hidden = !!id;
    if (!id) { box.hidden = true; box.innerHTML = ""; return; }
    const c = m.cars.find((x) => x.id === id), col = this._colorOf(id);
    let html = "";
    if (c) {
      const lv = this._level(c, V), state = this._charging(c, V) ? this._t("d_charging") : !this._home(c, V) ? this._t("d_out") : this._plugged(c, V) ? this._t("d_plugged") : this._t("d_home");
      const r = this._readyFor(c);
      const steps = [];
      for (const x of c.charges) if (x.b > V) steps.push({ h: x.a, at: x.a <= V ? this._t("ahead_now") : this._when(x.a), b: Number.isFinite(x.level) ? this._t("s_charge_to", { pct: this._pct(x.level) }) : this._t("s_charge"), s: x.a <= V ? this._t("s_done", { t: this._hhmm(x.b) }) : `${this._tt(x.a)}–${this._tt(x.b)} · ${this._price(this._priceAt(x.a))}` });
      for (const d of c.deps) if (d.h > V) steps.push({ h: d.h, at: this._when(d.h), b: this._t("s_leaves"), s: this._t("s_with", { pct: this._pct(this._level(c, d.h - .01)) }) });
      steps.sort((a, b) => a.h - b.h);
      const atTrip = r ? Math.round(this._level(c, r.d.h - .01)) : null;
      html = `<div class="head" style="--c:${col}"><div><small>${escH(c.name)}</small><b>${escH(this._pct(lv))}</b><span>${escH(state)}</span></div>
          ${r ? `<div class="ready${r.ok ? "" : " no"}"><span>${escH(this._t(r.ok ? "ready" : "short"))}<small>${escH(this._when(r.d.h))}</small></span></div>` : ""}</div>
        ${r ? `<div class="bar" style="--c:${col}"><i style="width:${clamp(lv, 0, 100)}%"></i><i class="plan" style="left:${clamp(lv, 0, 100)}%;width:${clamp(atTrip - lv, 0, 100 - lv)}%"></i><em style="left:${clamp(r.d.pct, 0, 100)}%"><span>${escH(this._t("trip_pct", { pct: this._pct(r.d.pct) }))}</span></em></div>` : ""}
        ${m.cars.length > 1 && m.chargers < 2 ? `<p class="note">${escH(this._t("one_cable"))}</p>` : ""}
        ${steps.length ? `<ol class="steps">${steps.slice(0, 4).map((x) => `<li style="--c:${col}"><time>${escH(x.at)}</time><b>${escH(x.b)}</b><span>${escH(x.s)}</span></li>`).join("")}</ol>` : `<p class="note">${escH(this._t("nothing"))}</p>`}
        <div class="acts"><button type="button" data-a="quick-now" data-id="${escH(id)}">${escH(this._t("a_now"))}</button><button type="button" data-a="quick-ready" data-id="${escH(id)}">${escH(this._t("a_ready"))}</button>${c.climate ? `<button type="button" data-a="quick-climate" data-id="${escH(id)}">${escH(this._t("a_climate"))}</button>` : ""}<button type="button" class="open" data-a="open-car" data-id="${escH(id)}">${escH(this._t("a_open"))}</button></div>`;
    } else {
      const H = m.house || {};
      const val = { sun: this._kw(V <= this.st.T + .05 ? H.sun?.kw ?? 0 : this._sunAt(V)), battery: Number.isFinite(H.battery?.soc) ? this._pct(H.battery.soc) : "–", heat: this._kw(H.heat?.kw || 0), grid: (() => { const g = this._gridAt(V); return g == null ? "–" : this._kw(g); })() }[id];
      const words = { sun: "own_sun", battery: "own_battery", heat: "own_heat", grid: "own_grid" }[id];
      const steps = id === "sun" ? this._periods("sun").filter((p) => p.b > V).map((p) => `<li style="--c:${col}"><time>${escH(p.a <= V ? this._t("ahead_now") : this._when(p.a))}</time><b>${escH(this._t("s_sun"))}</b><span>${escH(this._t("s_sun_detail", { kwh: p.kwh, t: this._tt(p.top) }))}</span></li>`).join("") : "";
      html = `<div class="head" style="--c:${col}"><div><small>${escH(this._t(id))}</small><b>${escH(val)}</b></div></div><p class="note">${escH(this._t(words))}</p>${steps ? `<ol class="steps">${steps}</ol>` : ""}`;
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  /* ---------- the house's things, where they stand on the disc (the house in metres, its middle at 0,0) */
  _geometry() {
    const L = this.lay, dx = -L.cx, dy = -L.cy, n = this._tracks().length, tw = Math.min(.04, .14 / Math.max(1, n));
    const RAD = (L.r + .8) / (1 - .06 - n * tw * 1.3 - .02);
    const onWall = (p, w, d) => (p.kind === "S" ? { x: p.x - w / 2 + dx, y: p.y + dy, w, d } : { x: p.x + dx, y: p.y - w / 2 + dy, w: d, d: w });
    const hf = L.heat.face, hp = hf === "S" ? { x: L.heat.x - .7 + dx, y: L.heat.y - .3 + dy, w: 1.4, d: .6 } : { x: L.heat.x - .3 + dx, y: L.heat.y - .7 + dy, w: .6, d: 1.4 };
    const S = L.D.solar, wing = S && L.D.wings[S.wing];
    let sunP = [0, 0, 3];
    if (wing) {
      const x0 = wing.x0 + dx, x1 = wing.x1 + dx, y0 = wing.y0 + dy, y1 = wing.y1 + dy, z = wing.h + (wing.roof.rise || 0) / 2, mid = (S.a + S.b) / 2;
      sunP = wing.roof.type === "flat" ? [mid + dx, (y0 + y1) / 2, wing.h + .3] : S.face === "E" ? [x1 - (x1 - x0) / 4, mid + dy, z] : [mid + dx, y1 - (y1 - y0) / 4, z];
    }
    this.G = { RAD, tw, sc: RAD / 6.6, bat: onWall(L.battery, 1.1, .45), gw: onWall(L.gateway, .6, .25), hp, hf, chg: L.chargers.map((p) => onWall(p, .45, .2)), slots: L.slots.map((s) => ({ x: s.x + dx, y: s.y + dy })), sunP };
  }
  _nodes() {
    const G = this.G, n = { sun: G.sunP, hub: [G.gw.x + G.gw.w / 2, G.gw.y + G.gw.d / 2, 1.4], grid: [G.gw.x + G.gw.w / 2, G.gw.y + G.gw.d / 2, 1.4], battery: [G.bat.x + G.bat.w / 2, G.bat.y + G.bat.d / 2, 2.0], heat: [G.hp.x + G.hp.w / 2, G.hp.y + G.hp.d / 2, 1.1] };
    this.m.cars.forEach((c, k) => { const sl = G.slots[k]; if (sl) n[c.id] = [sl.x + .95, sl.y + 2.35, .9]; });
    return n;
  }

  /* ---------- drawing: the disc and the ring are shared; what stands on the disc is each mode's own */
  _draw(S, t) {
    const st = this.st, m = this.m;
    if (!m || st.T == null) return;
    const { ctx, w, h } = S, dt = st.last ? Math.min(.05, (t - st.last) / 1000) : 0; st.last = t;
    const V = st.V, light = lightAt(V, m.rise ?? 8, m.set ?? 16), house = this.mode === "house";
    const RAD = house ? this.G.RAD : 5.4, sc = RAD / (house ? 6.6 : 5.4);
    // the camera: in to the chosen thing, out again when nothing is chosen
    let want = { z: house ? 1.18 : 1, x: 0, y: 0 };
    if (st.focus) {
      const p = house ? this._nodes()[st.focus === "grid" ? "hub" : st.focus] : this._spot(st.focus);
      if (p) { const c = Math.cos(st.spin), s2 = Math.sin(st.spin); want = { z: house ? (this.m.cars.some((x) => x.id === st.focus) ? 1.9 : st.focus === "sun" ? 1.6 : 2.3) : 1.32, x: house ? p[0] * c - p[1] * s2 : p[0], y: house ? p[0] * s2 + p[1] * c : p[1] }; }
    }
    for (const k of ["z", "x", "y"]) st.cam[k] = lerp(st.cam[k], want[k], reduce ? 1 : Math.min(1, dt * 4));
    if (!reduce && !st.focus && !st.drag) st.spin += dt * (house ? .07 : .1);
    sky(ctx, w, h, light, t);
    moonOrSun(ctx, w * .84, 60, light, 12);
    const s = (w * .43) / (1.2247 * RAD) * st.cam.z;
    const ox = w / 2 - (st.cam.x - st.cam.y) * C30 * s, oy = h * .58 - (st.cam.x + st.cam.y) * .5 * s;
    const W = World(ctx, ox, oy, s, light), P = W.P;
    const SIDE = .42 * sc, TOP = house ? 0 : .42;
    const circle = (r, z, a0 = 0, a1 = Math.PI * 2, n = 96) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [Math.cos(a) * r, Math.sin(a) * r, z]; });
    const path = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P(...p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); };
    const fade = (id) => (st.born[id] == null ? 1 : clamp((t - st.born[id]) / 900, 0, 1));
    const dimOf = (id) => (st.focus && st.focus !== id ? .4 : 1);
    const ang = (hh) => Math.PI / 4 + ((hh - st.T) / 36) * Math.PI * 2;
    const priceNow = this._priceRgb(this._priceAt(V));
    // the floor, the disc's side with its edge in the hour's price colour, the top
    W.add(-2000, () => { const [cx, cy] = P(0, 0, TOP - SIDE); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(cx, cy + 10, RAD * 1.27 * s, RAD * .74 * s, 0, 0, Math.PI * 2); ctx.fill(); });
    W.add(-1900, () => {
      path([...circle(RAD, TOP - SIDE, -Math.PI / 4, Math.PI * 3 / 4), ...circle(RAD, TOP, -Math.PI / 4, Math.PI * 3 / 4).reverse()]); ctx.closePath();
      const [ax, ay] = P(-RAD, RAD, 0), [bx, by] = P(RAD, -RAD, 0), g = ctx.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, css(W.lit([48, 56, 96], 1.05))); g.addColorStop(1, css(W.lit([26, 31, 60], 1))); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.strokeStyle = css(priceNow, .75 + .25 * Math.sin(t * .003)); ctx.lineWidth = 2.2; ctx.shadowColor = css(priceNow); ctx.shadowBlur = 12;
      path(circle(RAD - .02, TOP - SIDE / 2, -Math.PI / 4, Math.PI * 3 / 4)); ctx.stroke(); ctx.restore();
      path(circle(RAD, TOP)); ctx.closePath();
      const [cx, cy] = P(-RAD * .25, -RAD * .25, TOP), tg = ctx.createRadialGradient(cx, cy, 4, cx, cy, RAD * 1.6 * s);
      if (house) { tg.addColorStop(0, css(W.lit([70, 98, 84], 1.1))); tg.addColorStop(1, css(W.lit([36, 52, 58], 1))); }
      else { tg.addColorStop(0, css(W.lit([78, 88, 140], 1.1))); tg.addColorStop(1, css(W.lit([36, 42, 80], 1))); }
      ctx.fillStyle = tg; ctx.fill();
    });
    // the ring: the price outermost, a track for each car (and the sun on Huset) inside it
    const ids = this._tracks(), tracks = {};
    let inner;
    if (house) {
      const TW = this.G.tw * RAD, GAP = TW * .3;
      tracks.price = [RAD * .955, RAD * .995];
      ids.forEach((id, k) => { const r1 = RAD * .948 - k * (TW + GAP); tracks[id] = [r1 - TW, r1]; });
      inner = RAD * .948 - ids.length * (TW + GAP);
      W.add(-1850, () => { path(circle(inner - .3 * sc, .005)); ctx.closePath(); ctx.fillStyle = css(W.lit([62, 70, 104], 1), .55); ctx.fill(); });
    } else {
      tracks.price = [RAD - .32, RAD - .08];
      ids.forEach((id, k) => { tracks[id] = [RAD - .66 - k * .34, RAD - .42 - k * .34]; });
      inner = RAD - .42 - ids.length * .34 - .24;
    }
    const seg = (r0, r1, a0, a1) => [...circle(r1, TOP + .01, a0, a1, 6), ...circle(r0, TOP + .01, a1, a0, 6)];
    const fillSeg = (pts, style, depth, glow) => W.add(depth, () => { ctx.save(); path(pts); ctx.closePath(); if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 10; } ctx.fillStyle = style; ctx.fill(); ctx.restore(); });
    const look = (id, hm) => {
      if (id === "sun") { const kw = this._sunAt(hm); return kw > .05 ? [[255, 212, 92], .25 + .75 * Math.min(1, kw / Math.max(1, this.m.house.sun.peak || 3)), true] : [[255, 255, 255], .06]; }
      const c = m.cars.find((x) => x.id === id);
      return this._charging(c, hm) ? [hexRgb(c.color), .9, true] : this._home(c, hm) ? [[255, 255, 255], .1] : [[0, 0, 0], .3];
    };
    const STEP = .5;
    for (let k = 0; k < 36 / STEP; k++) {
      const h0 = st.T + k * STEP, a0 = ang(h0) + .012, a1 = ang(h0 + STEP) - .012, mid = (a0 + a1) / 2, depth = -1800 + (Math.cos(mid) + Math.sin(mid)) * 5;
      const seen = h0 + STEP <= V ? .45 : 1, p = this._priceAt(h0 + STEP / 2);
      fillSeg(seg(...tracks.price, a0, a1), css(this._priceRgb(p), (p == null ? .25 : .78) * seen), depth);
      for (const id of ids) {
        const [rgb, a, live] = look(id, h0 + STEP / 2), d = dimOf(id) * seen * fade(id);
        fillSeg(seg(...tracks[id], a0, a1), css(rgb, a * d * (live ? .8 + .2 * Math.sin(t * .006 - k * .5) : 1)), depth + .1, live && d > .5 ? css(rgb) : null);
      }
      const hh = ((h0 % 24) + 24) % 24;
      if (Math.abs(hh % 6) < .01) W.add(-1700, () => {
        const midn = hh === 0, [x, y] = P(Math.cos(a0) * RAD * 1.08, Math.sin(a0) * RAD * 1.08, TOP - SIDE / 2);
        ctx.font = `${midn ? 800 : 600} ${midn ? 10 : 9.5}px ${midn ? "'Schibsted Grotesk', Inter, sans-serif" : "'JetBrains Mono', ui-monospace, monospace"}`;
        ctx.fillStyle = midn ? "#fff" : "rgba(241,243,255,.6)"; ctx.textAlign = "center";
        const word = midn ? String(m.days?.[clamp(Math.floor(h0 / 24), 0, 2)] || "").toUpperCase() : String(hh).padStart(2, "0"), half = ctx.measureText(word).width / 2 + 4;
        ctx.fillText(word, clamp(x, half, w - half), y + 4);
      });
    }
    W.add(-1650, () => {
      const notch = (hh, col) => { const a = ang(hh), [x0, y0] = P(Math.cos(a) * inner, Math.sin(a) * inner, TOP + .02), [x1, y1] = P(Math.cos(a) * RAD * 1.02, Math.sin(a) * RAD * 1.02, TOP + .02); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); return [x1, y1]; };
      notch(st.T, "#ffb547");
      const a = ang(st.T), [lx, ly] = P(Math.cos(a) * RAD * 1.13, Math.sin(a) * RAD * 1.13, TOP - SIDE / 2);
      ctx.font = "800 11px 'Schibsted Grotesk', Inter, sans-serif"; ctx.fillStyle = "#ffcf85"; ctx.textAlign = "center"; ctx.fillText(`${this._t("now")} ${this._hhmm(st.T)}`, lx, ly + 10);
      if (V > st.T + .01) { const [x, y] = notch(V, "#ffffff"); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    });
    W.draw();
    const placed = [];
    if (house) this._drawHouse({ ctx, w, h, t, s, ox, oy, light, V, fade, dimOf, placed });
    else this._drawCars({ ctx, w, h, t, s, ox, oy, light, V, fade, dimOf, placed, TOP });
    // the labels: the chosen thing's periods, or the next few; at the sides of the stage
    let L = (st.focus && ids.includes(st.focus) ? [st.focus] : ids).flatMap((id) => this._periods(id)).filter((p) => p.b > V);
    if (!st.focus || !ids.includes(st.focus)) L = L.sort((a, b) => a.a - b.a).slice(0, 3);
    const free = (r) => !placed.some((q) => r[0] < q[0] + q[2] + 3 && r[0] + r[2] + 3 > q[0] && r[1] < q[1] + q[3] + 2 && r[1] + r[3] + 2 > q[1]);
    ctx.font = "700 10px Inter, system-ui, sans-serif";
    for (const p of L) {
      if (!tracks[p.id]) continue;
      const a = ang((Math.max(p.a, st.T) + Math.min(p.b, st.T + 36)) / 2), r = (tracks[p.id][0] + tracks[p.id][1]) / 2, col = this._colorOf(p.id);
      const [ax, ay] = P(Math.cos(a) * r, Math.sin(a) * r, TOP + .02);
      const tw = ctx.measureText(p.txt).width + 16, th = 18, left = ax < w / 2, x = left ? 6 : w - tw - 6;
      let y = clamp(ay - th / 2, 36, h - 60);
      for (let g = 0; g < 16 && !free([x, y, tw, th]); g++) y += (g % 2 ? 1 : -1) * (g + 1) * (th + 4);
      placed.push([x, y, tw, th]);
      ctx.save(); ctx.globalAlpha = fade(p.id) * (st.focus && st.focus !== p.id ? .35 : 1);
      ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(left ? x + tw : x, y + th / 2); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ax, ay, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(12,15,36,.92)"; roundRect(ctx, x, y, tw, th, 9); ctx.fill(); ctx.strokeStyle = col; if (p.kind === "out") ctx.setLineDash([3, 2]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(p.txt, x + 8, y + 12.5);
      ctx.restore();
    }
    if (V > st.T + .01) {
      ctx.textAlign = "center"; ctx.font = "900 28px 'Schibsted Grotesk', Inter, sans-serif"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 12;
      const day = String(m.days?.[clamp(Math.floor(V / 24), 0, 2)] || "");
      ctx.fillText(`${day.charAt(0).toUpperCase()}${day.slice(1)} ${this._hhmm(V)}`, w / 2, h - 40); ctx.shadowBlur = 0;
      ctx.font = "600 11px Inter, system-ui, sans-serif"; ctx.fillStyle = "rgba(241,243,255,.85)"; ctx.fillText(this._t("ahead_hint"), w / 2, h - 22);
    }
  }

  /* Drejeskiven: the cars on the disc, the charger between them with its little display */
  _spot(id) { const k = this.m.cars.findIndex((c) => c.id === id); if (k < 0) return null; const p = [[-.2, -1.5], [-.2, 1.6]][k], c = Math.cos(this.st.spin), s = Math.sin(this.st.spin); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  _drawCars({ ctx, w, t, s, ox, oy, light, V, fade, dimOf, placed, TOP }) {
    const st = this.st, m = this.m, W = World(ctx, ox, oy, s, light), P = W.P;
    const rotP = ([x, y]) => [x * Math.cos(st.spin) - y * Math.sin(st.spin), x * Math.sin(st.spin) + y * Math.cos(st.spin)];
    const [cxw, cyw] = rotP([-3.1, .05]);
    const two = m.chargers >= 2 && m.cars.length > 1;
    const live = m.cars.find((c) => this._charging(c, V)), onCable = live || m.cars.find((c) => this._plugged(c, V));
    W.box(cxw - .17, cyw - .14, TOP, .34, .28, 1.35, "#1d2333", { rot: st.spin, depth: cxw + cyw + 1 });
    W.glow(cxw, cyw, TOP + 1.15, live ? 1.1 + .25 * Math.sin(t * .006) : .5, live ? hexRgb(live.color) : onCable ? [140, 150, 180] : [70, 80, 104], live ? 1 : .4, cxw + cyw + 60);
    let chg2 = null;
    if (two) { chg2 = rotP([3.0, .05]); W.box(chg2[0] - .17, chg2[1] - .14, TOP, .34, .28, 1.35, "#1d2333", { rot: st.spin, depth: chg2[0] + chg2[1] + 1 }); }
    st.hits = [];
    m.cars.forEach((c, k) => {
      const [wx, wy] = rotP([[-.2, -1.5], [-.2, 1.6]][k]), pf = c.kind === "suv" ? [4.68, 1.9] : [4.7, 1.84];
      const home = this._home(c, V), leaving = c.here && V >= c.leave && V < c.leave + .6;
      let alpha = 1, drive = 0;
      if (leaving) drive = reduce ? .3 : (t * .00022) % 1;
      if (!home && !leaving) alpha = .22 + .06 * Math.sin(t * .004);
      if (st.born[c.id] != null && home) alpha = Math.min(alpha, clamp((t - st.born[c.id]) / 1400, .25, 1));
      alpha *= dimOf(c.id) < 1 ? .45 : 1;
      if (leaving) alpha *= drive > .75 ? (1 - drive) * 4 : 1;
      const fwd = [Math.cos(st.spin), Math.sin(st.spin)], dx = fwd[0] * drive * 9, dy = fwd[1] * drive * 9;
      const r = W.car(wx - pf[0] / 2 + dx, wy - pf[1] / 2 + dy, c, { rot: st.spin, z: drive > .45 ? TOP * (1 - (drive - .45) * 4) : TOP, alpha, lights: light.night || leaving });
      const mine = two ? (c.charger === 1 ? chg2 : [cxw, cyw]) : [cxw, cyw];
      const cableHere = two ? this._plugged(c, V) : onCable && onCable.id === c.id;
      if (cableHere && !leaving && mine) W.cable([mine[0] + .1, mine[1] + .1, TOP + .7], r.port, this._charging(c, V) ? c.color : null, t, wx + wy + 3);
      st.hits.push([c.id, ...P(wx + dx, wy + dy, TOP + .7)]);
      c._top = P(wx + dx, wy + dy, TOP + 1.6);
    });
    if (light.night) W.add(900, () => {
      for (const c of m.cars) {
        if (!this._home(c, V)) continue;
        const [lx, ly] = rotP([[-.2, -1.5], [-.2, 1.6]][m.cars.indexOf(c)]), [x, y] = P(lx, ly, TOP);
        const pool = ctx.createRadialGradient(x, y, 0, x, y, 60); pool.addColorStop(0, "rgba(255,214,150,.14)"); pool.addColorStop(1, "rgba(255,214,150,0)");
        ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(x, y, 60, 30, 0, 0, Math.PI * 2); ctx.fill();
      }
    });
    W.draw();
    if (live && live._top && !reduce) {
      const [x, y] = live._top;
      for (let i = 0; i < 6; i++) { const k = (t * .0006 + i / 6) % 1; ctx.fillStyle = css(hexRgb(live.color), 1 - k); ctx.beginPath(); ctx.arc(x - 18 + i * 7, y - k * 26, 1.8, 0, Math.PI * 2); ctx.fill(); }
    }
    // the charger's display: who charges, at what power and price; who waits; or that it is free
    const [x, y0] = P(cxw, cyw, TOP + 1.9), y = y0 + (reduce ? 0 : Math.sin(t * .002) * 2), now = V <= st.T + .05, p = this._priceAt(V);
    const txt = live ? (now && Number.isFinite(live.kw) && live.kw > 0 ? this._t("holo_live", { car: this._short(live), kw: this._kw(live.kw), price: this._price(p) }) : this._t("holo_plan", { car: this._short(live), price: this._price(p) })) : onCable ? this._t("holo_wait", { car: this._short(onCable) }) : this._t("holo_free");
    ctx.font = "700 10px Inter, system-ui, sans-serif"; const tw = ctx.measureText(txt).width + 22, hx = clamp(x, tw / 2 + 6, w - tw / 2 - 6);
    ctx.fillStyle = "rgba(10,13,30,.8)"; roundRect(ctx, hx - tw / 2, y - 20, tw, 20, 10); ctx.fill();
    ctx.strokeStyle = live ? live.color : "rgba(214,222,255,.25)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = live ? live.color : "rgba(214,222,255,.5)"; ctx.beginPath(); ctx.arc(hx - tw / 2 + 9, y - 10, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(txt, hx - tw / 2 + 16, y - 6.5);
    placed.push([hx - tw / 2, y - 22, tw, 24]);
  }

  /* Husets hjul: the house in its design, turning; the things on their walls; the energy as light */
  _drawHouse({ ctx, w, h, t, s, ox, oy, light, V, fade, dimOf, placed }) {
    const st = this.st, m = this.m, G = this.G, H = m.house || {}, now = V <= st.T + .05;
    const Ws = World(ctx, ox, oy, s, light, st.spin), Q = Ws.P;
    const sunKw = now ? H.sun?.kw ?? this._sunAt(V) : this._sunAt(V);
    const own = this.lay.D.walls.s1?.wing ?? 0;
    drawDesign(Ws, this.lay, { light, solar: !!H.sun, shine: Math.min(1, (sunKw || 0) / 2.5), dim: this.lay.key === "terrace" ? (wi) => wi !== own : null });
    const priceNow = this._priceRgb(this._priceAt(V)), gw = G.gw;
    Ws.box(gw.x, gw.y, 1.05, gw.w, gw.d, .55, "#59627e", { depth: Ws.D(gw.x, gw.y) + 2 });
    if (H.battery) {
      const b = G.bat, Sw = this.lay.battery.kind === "S", soc = Number(H.battery.soc) || 0, kw = Number(H.battery.kw) || 0, col = kw < -.05 ? [182, 156, 255] : [110, 231, 176];
      Ws.box(b.x, b.y, 0, b.w, b.d, 2.0, "#2b3350", { depth: Ws.D(b.x, b.y) + 2, alpha: fade("battery") * (dimOf("battery") < 1 ? .55 : 1), [Sw ? "fy" : "fx"]: () => {
        const q = (u0, u1, z0, z1) => (Sw ? [[b.x + u0, b.y + b.d + .01, z0], [b.x + u1, b.y + b.d + .01, z0], [b.x + u1, b.y + b.d + .01, z1], [b.x + u0, b.y + b.d + .01, z1]] : [[b.x + b.w + .01, b.y + u0, z0], [b.x + b.w + .01, b.y + u1, z0], [b.x + b.w + .01, b.y + u1, z1], [b.x + b.w + .01, b.y + u0, z1]]);
        Ws.poly(q(.4, .7, .2, 1.8), "rgba(0,0,0,.35)");
        ctx.save(); if (Math.abs(kw) > .05) { ctx.shadowColor = css(col); ctx.shadowBlur = 10 + 4 * Math.sin(t * .006); }
        Ws.poly(q(.4, .7, .2, .2 + 1.6 * clamp(soc, 0, 100) / 100), css(col)); ctx.restore();
      } });
    }
    if (H.heat) {
      const u = G.hp, Sf = G.hf === "S", kw = Number(H.heat.kw) || 0, spin = reduce ? 0 : t * .0004 * (kw / .5);
      Ws.shadow(u.x, u.y, u.w, u.d, -990, .3);
      Ws.box(u.x, u.y, 0, u.w, u.d, 1.1, "#dfe4ec", { alpha: fade("heat") * (dimOf("heat") < 1 ? .55 : 1), [Sf ? "fy" : "fx"]: () => {
        const pt = (a, zz) => (Sf ? [u.x + a, u.y + u.d + .01, zz] : [u.x + u.w + .01, u.y + a, zz]);
        Ws.poly(Array.from({ length: 25 }, (_, k) => { const a = (k / 24) * Math.PI * 2; return pt(.5 + Math.cos(a) * .38, .55 + Math.sin(a) * .38); }), css(Ws.lit([40, 46, 62], 1)));
        ctx.strokeStyle = kw > .05 ? "rgba(255,160,110,.9)" : "rgba(160,180,255,.5)"; ctx.lineWidth = 1.6;
        for (let k = 0; k < 3; k++) { const a = spin + (k * Math.PI * 2) / 3, [x0, y0] = Q(...pt(.5, .55)), [x1, y1] = Q(...pt(.5 + Math.cos(a) * .34, .55 + Math.sin(a) * .34)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      } });
      if (kw > .05) Ws.glow(u.x + u.w / 2, u.y + u.d / 2, .8, 1.4 + .2 * Math.sin(t * .005), [255, 138, 92], .6 * fade("heat"), Ws.D(u.x, u.y) + 30);
    }
    const ports = {};
    if (m.cars.length) {
      G.chg.slice(0, clamp(m.chargers || 1, 1, 2)).forEach((c, k) => {
        const on = m.cars.find((car) => (m.chargers >= 2 ? (car.charger === 1 ? 1 : 0) === k : k === 0) && this._charging(car, V));
        Ws.box(c.x, c.y, 1.0, c.w, c.d, .6, "#1d2333", { depth: Ws.D(c.x, c.y) + 2.5 });
        Ws.glow(c.x + c.w / 2, c.y + c.d / 2, 1.3, on ? .9 + .2 * Math.sin(t * .006) : .35, on ? hexRgb(on.color) : [70, 80, 104], on ? 1 : .5, Ws.D(c.x, c.y) + 60);
      });
      m.cars.forEach((c, k) => {
        const sl = G.slots[k]; if (!sl) return;
        const home = this._home(c, V), pf = c.kind === "suv" ? [4.68, 1.9] : [4.7, 1.84], cx = sl.x + .95, cy = sl.y + 2.35;
        const r = Ws.car(cx - pf[0] / 2, cy - pf[1] / 2, c, { rot: Math.PI / 2, alpha: (home ? 1 : .24 + .06 * Math.sin(t * .004)) * fade(c.id) * (dimOf(c.id) < 1 ? .5 : 1), lights: light.night && home });
        ports[c.id] = r.port;
        const holder = m.chargers >= 2 || !m.cars.some((x) => x !== c && (this._charging(x, V) || (this._plugged(x, V) && !this._charging(c, V))));
        if (this._plugged(c, V) && holder) { const ch = G.chg[m.chargers >= 2 && c.charger === 1 ? 1 : 0]; Ws.cable([ch.x + ch.w / 2, ch.y + ch.d, 1.1], r.port, this._charging(c, V) ? c.color : null, t, Ws.D(cx, cy) + 3); }
      });
    }
    Ws.draw();
    // the energy: from where it comes to where it goes, through the house's board; now from the meters, ahead from the plans and the forecast
    const node = this._nodes(), flows = [];
    const grid = this._gridAt(V) ?? 0, bat = now ? Number(H.battery?.kw) || 0 : 0, heat = now ? Number(H.heat?.kw) || 0 : 0;
    const carsKw = m.cars.map((c) => [c, this._charging(c, V) ? (now && Number.isFinite(c.kw) && c.kw > 0 ? c.kw : c.power || 11) : 0]);
    if (sunKw > .05) flows.push(["sun", "hub", sunKw, [255, 212, 92]]);
    if (bat < -.05) flows.push(["battery", "hub", -bat, [182, 156, 255]]);
    if (grid > .05) flows.push(["grid", "hub", grid, priceNow]);
    if (grid < -.05) flows.push(["hub", "grid", -grid, [255, 212, 92]]);
    if (bat > .05) flows.push(["hub", "battery", bat, sunKw > grid ? [255, 212, 92] : priceNow]);
    const mix = sunKw > grid ? [255, 212, 92] : priceNow;
    if (heat > .05 && H.heat) flows.push(["hub", "heat", heat, mix]);
    for (const [c, kw] of carsKw) if (kw > 0) flows.push(["hub", c.id, kw, mix]);
    const scr = (k) => (ports[k] ? Q(...ports[k]) : node[k] ? Q(...node[k]) : null);
    for (const [a, b, v, col] of flows) {
      const A = scr(a), B = scr(b); if (!A || !B) continue;
      const [ax, ay] = A, [bx, by] = B, mx = (ax + bx) / 2, my = Math.min(ay, by) - 24 - Math.abs(ax - bx) * .08;
      const involved = !st.focus || st.focus === a || st.focus === b;
      ctx.save(); ctx.globalAlpha = involved ? 1 : .2;
      ctx.strokeStyle = css(col, .28); ctx.lineWidth = 1.2 + Math.min(5, v) * .5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
      const n = clamp(Math.round(v * 1.6), 1, 9), speed = .00018 * (.7 + Math.min(10, v) * .12);
      ctx.fillStyle = css(col); ctx.shadowColor = css(col); ctx.shadowBlur = 8;
      for (let j = 0; j < n; j++) { const q = reduce ? (j + .5) / n : (t * speed + j / n) % 1, x = (1 - q) * (1 - q) * ax + 2 * (1 - q) * q * mx + q * q * bx, y = (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * my + q * q * by; ctx.beginPath(); ctx.arc(x, y, 1.6 + Math.min(4, v) * .3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // the house's word, over the roof
    const holo = grid > .05 ? this._t("buys", { kw: this._kw(grid), price: this._price(this._priceAt(V)) }) : grid < -.05 ? this._t("sells", { kw: this._kw(grid) }) : this._t("balance");
    const top = Math.max(...this.lay.D.wings.map((g) => g.h + (g.roof.rise || 0)));
    const [hx0, hy0] = Q(0, 0, top + 2.2), hy = Math.max(30, hy0) + (reduce ? 0 : Math.sin(t * .002) * 2);
    ctx.font = "700 10.5px Inter, system-ui, sans-serif"; const tw = ctx.measureText(holo).width + 24, hx = clamp(hx0, tw / 2 + 6, w - tw / 2 - 6);
    ctx.fillStyle = "rgba(10,13,30,.82)"; roundRect(ctx, hx - tw / 2, hy - 22, tw, 22, 11); ctx.fill();
    const hc = grid > .05 ? priceNow : [255, 212, 92]; ctx.strokeStyle = css(hc, .8); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = css(hc); ctx.beginPath(); ctx.arc(hx - tw / 2 + 10, hy - 11, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(holo, hx - tw / 2 + 18, hy - 7);
    placed.push([hx - tw / 2, hy - 22, tw, 24]);
    // small tags: the battery's level, the heat pump's power (now only: EV Planner does not plan them)
    const free = (r) => !placed.some((q) => r[0] < q[0] + q[2] + 3 && r[0] + r[2] + 3 > q[0] && r[1] < q[1] + q[3] + 2 && r[1] + r[3] + 2 > q[1]);
    const tag = (wp, txt, col) => {
      let [x, y] = Q(...wp); ctx.font = "800 10px 'Schibsted Grotesk', Inter, sans-serif"; const tw2 = ctx.measureText(txt).width + 12;
      for (let g = 0; g < 6 && !free([x - tw2 / 2, y - 16, tw2, 16]); g++) y -= 18;
      ctx.fillStyle = "rgba(10,13,30,.78)"; roundRect(ctx, x - tw2 / 2, y - 16, tw2, 16, 8); ctx.fill(); ctx.fillStyle = col; ctx.textAlign = "center"; ctx.fillText(txt, x, y - 4.5);
      placed.push([x - tw2 / 2, y - 16, tw2, 16]);
    };
    if (now && H.battery && Number.isFinite(H.battery.soc)) tag([G.bat.x + G.bat.w / 2, G.bat.y + G.bat.d / 2, 3.2], this._pct(H.battery.soc), "#6ee7b0");
    if (now && H.heat) tag([G.hp.x + G.hp.w / 2, G.hp.y + G.hp.d / 2, 2.4], this._kw(H.heat.kw || 0), "#ffb38a");
    st.hits = Object.entries(node).filter(([id]) => id !== "hub" && (id === "grid" || (id === "sun" && H.sun) || (id === "battery" && H.battery) || (id === "heat" && H.heat) || m.cars.some((c) => c.id === id))).map(([id, p]) => [id, ...Q(...p)]);
  }
}

if (!customElements.get("ev-planner-wheel")) customElements.define("ev-planner-wheel", EvPlannerWheel);
export { DESIGNS, layoutOf, lightAt };
