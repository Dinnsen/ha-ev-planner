/* EV Planner - the learning centre: Overview (tonight and the timeline), Driving, Power and Learned.
   Drawn from Insight's log, Home Assistant's own hourly statistics and the price sensor.
   A file of its own, fetched the first time the Learning tab is opened with Insight on. */

const CSS = `:host {
  --bg: #f3f5f4; --card: #ffffff; --ink: #14201c; --soft: #5c6b66; --faint: #8b9893; --line: #dde4e1; --well: #eef2f0;
  --accent: #00a383; --accent-ink: #00745d; --fc: #d99600; --band: rgba(217,150,0,.16); --band2: rgba(217,150,0,.30);
  --bad: #d4513f; --car2: #5b6ee8; --cold: #3f8fd6; --sun: #e9a500; --path: rgba(20,32,28,.22); --soc: rgba(0,163,131,.16);
  --shadow: 0 1px 2px rgba(20,32,28,.05), 0 8px 28px rgba(20,32,28,.06);
  display: block; color: var(--ink); font: 15px/1.5 Inter, var(--ha-font-family-body, Roboto), system-ui, sans-serif; -webkit-text-size-adjust: 100%;
}
:host([dark]) {
  --bg: #0e1312; --card: #161d1b; --ink: #edf3f1; --soft: #9caba6; --faint: #6f7d78; --line: #26312e; --well: #1c2523;
  --accent: #20d3a8; --accent-ink: #7be8cd; --fc: #f2b838; --band: rgba(242,184,56,.14); --band2: rgba(242,184,56,.28);
  --bad: #ff7a66; --car2: #8f9dff; --cold: #6db4f2; --sun: #ffc83d; --path: rgba(237,243,241,.20); --soc: rgba(32,211,168,.16);
  --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 30px rgba(0,0,0,.35); color-scheme: dark }
[hidden] { display: none !important; }
.wrap { max-width: 1080px; margin: 0 auto; display: grid; gap: 18px; }
button { -webkit-tap-highlight-color: transparent; }
h1, h2, h3 { font-family: "Space Grotesk", Inter, system-ui, sans-serif; text-wrap: balance; margin: 0; letter-spacing: -.01em; }
h2 { font-size: 19px; font-weight: 600; }
h3 { font-size: 14px; font-weight: 600; }
p { margin: 0; }
.tag { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-ink); font-weight: 600; }
.demo, .small { font-size: 12.5px; color: var(--soft); }
.card { background: var(--card); border-radius: 22px; padding: 20px; box-shadow: var(--shadow); display: grid; gap: 14px; min-width: 0; align-content: start; }
.row { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; justify-content: space-between; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button, .btn { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid var(--line); background: transparent; color: var(--ink); border-radius: 999px; padding: 7px 13px; cursor: pointer; }
.chips button.on { background: var(--ink); color: var(--card); border-color: var(--ink); }
button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
nav.tabs { position: sticky; top: 0; z-index: 5; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); margin-inline: -6px; padding: 8px 6px; border-radius: 18px; overflow-x: auto; }
nav.tabs div { display: flex; gap: 6px; width: max-content; }
nav.tabs button { font: 600 14px "Space Grotesk", Inter, sans-serif; border: 0; background: transparent; color: var(--soft); padding: 9px 15px; border-radius: 999px; cursor: pointer; white-space: nowrap; display: flex; gap: 7px; align-items: center; }
nav.tabs button.on { background: var(--ink); color: var(--card); }
nav.tabs button i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); display: inline-block; }
nav.tabs button.dim i { background: var(--faint); }
.panel { display: grid; gap: 18px; animation: rise .45s cubic-bezier(.2,.8,.2,1); }
.panel[hidden] { display: none !important; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } }
.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: 18px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.kpi { background: var(--well); border-radius: 16px; padding: 12px 14px; min-width: 0; }
.kpi small { display: block; color: var(--soft); font-size: 11.5px; }
.kpi b { font: 600 24px/1.2 "Space Grotesk", Inter, sans-serif; font-variant-numeric: tabular-nums; }
.kpi span { font-size: 11.5px; color: var(--soft); display: block; }
.hero { font: 600 clamp(20px, 3.4vw, 28px)/1.25 "Space Grotesk", Inter, sans-serif; text-wrap: balance; }
.hero em { font-style: normal; color: var(--accent-ink); }
.hero .w { color: var(--fc); }
svg { display: block; width: 100%; height: auto; overflow: visible; }
svg text { font-family: Inter, system-ui, sans-serif; font-size: 11px; fill: var(--faint); }
.grid { stroke: var(--line); stroke-width: 1; }
.known { fill: none; stroke: var(--ink); stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
.median { fill: none; stroke: var(--fc); stroke-width: 2.2; stroke-dasharray: 5 4; stroke-linecap: round; }
.band80 { fill: var(--band); } .band50 { fill: var(--band2); }
.draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.4s cubic-bezier(.3,.7,.2,1) forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.fan { transform-origin: left center; animation: fan 1.1s .3s cubic-bezier(.2,.8,.2,1) both; }
@keyframes fan { from { opacity: 0; transform: scaleX(.02); } }
.grow { transform-box: fill-box; transform-origin: bottom; animation: grow .8s cubic-bezier(.2,.8,.2,1) both; }
@keyframes grow { from { transform: scaleY(0); } }
.pop { transform-box: fill-box; transform-origin: center; animation: popin .5s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes popin { from { transform: scale(0); opacity: 0; } }
.flow { fill: none; stroke-linecap: butt; opacity: .5; }
.flowdash { fill: none; stroke: var(--card); stroke-width: 2; stroke-dasharray: 2 14; opacity: .7; animation: dash 1.2s linear infinite; }
@keyframes dash { to { stroke-dashoffset: -16; } }
.wk { position: relative; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.wk canvas { position: absolute; left: 0; top: 0; width: 100%; pointer-events: none; }
.wk svg { position: relative; }
.tline { stroke: var(--bad); stroke-width: 1.5; stroke-dasharray: 2 4; }
.thandle { fill: var(--bad); cursor: ns-resize; } .thandle-t { fill: #fff; font-size: 11px; font-weight: 600; pointer-events: none; }
.scrub { stroke: var(--ink); stroke-width: 1; opacity: .5; }
.now { stroke: var(--accent); stroke-width: 1.5; }
.tip { position: absolute; pointer-events: none; background: var(--ink); color: var(--card); border-radius: 12px; padding: 8px 11px; font-size: 12px; line-height: 1.45; transform: translate(-50%, -100%); white-space: nowrap; z-index: 2; }
.tip b { font-variant-numeric: tabular-nums; }
.cap rect { fill: var(--card); stroke: var(--line); stroke-width: 1; filter: drop-shadow(0 4px 10px rgba(0,0,0,.10)); }
.cap text { fill: var(--ink); } .cap .l2 { fill: var(--soft); } .cap .trk { fill: none; stroke: var(--well); stroke-width: 3.5; } .cap .ring { fill: none; stroke-width: 3.5; stroke-linecap: round; }
.cap.ghost rect { stroke-dasharray: 4 3; fill: transparent; filter: none; }
.pbar { fill: var(--accent); opacity: .5; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--soft); }
.legend i { display: inline-block; width: 18px; height: 3px; border-radius: 2px; vertical-align: middle; margin-right: 6px; background: var(--ink); }
.legend i.f { background: repeating-linear-gradient(90deg, var(--fc) 0 5px, transparent 5px 8px); }
.legend i.b { height: 10px; background: var(--band2); } .legend i.dot { width: 9px; height: 9px; border-radius: 50%; }
.detail { background: var(--well); border-radius: 16px; padding: 14px; display: grid; gap: 10px; }
.facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 12px; font-size: 12px; color: var(--soft); }
.facts b { display: block; color: var(--ink); font: 600 15px "Space Grotesk", sans-serif; font-variant-numeric: tabular-nums; }
.model { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid var(--line); }
.model:first-of-type { border-top: 0; }
.model p { font-size: 12.5px; color: var(--soft); }
.model .ringv { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; transition: stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1); }
.model .ringt { fill: none; stroke: var(--well); stroke-width: 5; }
.model.off { opacity: .45; }
.sw { width: 46px; height: 28px; border-radius: 999px; border: 0; background: var(--line); position: relative; cursor: pointer; flex: none; transition: background .2s; }
.sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s cubic-bezier(.2,.8,.2,1); }
.sw[aria-checked="true"] { background: var(--accent); } .sw[aria-checked="true"]::after { transform: translateX(18px); }
.dial { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 16px; align-items: center; }
.dial svg { width: 132px; height: 132px; }
.dial .track { fill: none; stroke: var(--well); stroke-width: 12; }
.dial .val { fill: none; stroke: var(--accent); stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1), stroke .3s; }
.dial .mark { stroke: var(--ink); stroke-width: 2.5; transition: transform .4s; transform-origin: 66px 66px; }
.big { font: 600 26px/1 "Space Grotesk", Inter, sans-serif; fill: var(--ink); }
.verdict { font: 600 18px/1.25 "Space Grotesk", Inter, sans-serif; }
label.slide { display: grid; gap: 6px; font-size: 13px; color: var(--soft); } label.slide b { color: var(--ink); font-variant-numeric: tabular-nums; }
input[type=range] { width: 100%; accent-color: var(--accent); }
.ready { height: 12px; border-radius: 6px; background: var(--well); overflow: hidden; } .ready i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, var(--fc), var(--accent)); transition: width 1.2s cubic-bezier(.2,.8,.2,1); }
table { border-collapse: collapse; width: 100%; font-size: 13px; } th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; } th { color: var(--soft); font-weight: 500; font-size: 12px; }
.scroll { overflow-x: auto; }
.hit { cursor: pointer; }
@media (max-width: 520px) { .dial { grid-template-columns: 1fr; justify-items: start; } .card { padding: 16px; border-radius: 18px; } .facts { grid-template-columns: 1fr 1fr; } .model { grid-template-columns: 44px minmax(0, 1fr) auto; } }
.calm .draw, .calm .fan, .calm .grow, .calm .pop, .calm .panel, .calm .hfill { animation: none; stroke-dashoffset: 0; }
@media (prefers-reduced-motion: reduce) { .draw, .fan, .grow, .pop, .flowdash, .panel, .hfill, .hglow, .hdash { animation: none; stroke-dashoffset: 0; } }

.chk { display: grid; gap: 0; } .chk > div { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 10px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 13px; } .chk > div:first-child { border-top: 0; }
.chk i { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font: 600 12px/1 Inter, sans-serif; font-style: normal; color: #fff; background: var(--accent); margin-top: 1px; }
.chk i.new { background: var(--car2); } .chk i.gap { background: var(--sun); color: #201a00; } .chk small { display: block; color: var(--soft); font-size: 12px; overflow-wrap: anywhere; } .chk code { font-size: 11.5px; }
.card p.small { display: none; }
.card.help-open p.small { display: block; background: var(--well); border-radius: 12px; padding: 10px 12px; }
.q { flex: none; width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--line); background: transparent; color: var(--soft); font: 600 13px/1 Inter, sans-serif; cursor: pointer; margin-left: 8px; vertical-align: middle; }
.card.help-open .q { background: var(--ink); color: var(--card); border-color: var(--ink); }
.tl-card { gap: 12px; }
#tl { width: max-content; } #tl svg { display: block; }
.tl-scroll { overflow-x: auto; border-radius: 14px; background: var(--well); scrollbar-width: thin; }
.tl-d { fill: transparent; cursor: pointer; } .tl-d.we { fill: var(--ink); fill-opacity: .035; } .tl-d.on { fill: var(--accent); fill-opacity: .12; }
.tl-t { font: 500 10.5px Inter, sans-serif; fill: var(--soft); pointer-events: none; } .tl-t.now { fill: var(--ink); font-weight: 600; }
.tl-p { fill: none; stroke: var(--ink); stroke-width: 1.6; } .tl-pf { fill: none; stroke: var(--fc); stroke-width: 1.6; stroke-dasharray: 4 3; } .tl-band { fill: var(--fc); fill-opacity: .18; }
.tl-b { fill: none; stroke: var(--accent); stroke-width: 2.2; } .tl-bf { fill: none; stroke: var(--accent); stroke-width: 1.6; stroke-dasharray: 4 3; } .tl-bband { fill: var(--accent); fill-opacity: .16; }
.tl-min { stroke: var(--bad); stroke-width: 1; stroke-dasharray: 2 4; opacity: .6; } .tl-c { fill: var(--accent); } .tl-c.plan { fill: none; stroke: var(--accent); stroke-width: 1.6; stroke-dasharray: 3 2; }
.tl-trip { fill: var(--car2); } .tl-now { stroke: var(--ink); stroke-width: 1.5; }
#tl svg path, #tl svg line, #tl svg circle, #tl svg text { pointer-events: none; }
.tl-day { display: grid; gap: 8px; } .tl-day > b { font: 600 16px "Space Grotesk", sans-serif; }
.tl-three { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 14px; }
.tl-q { font: inherit; color: inherit; text-align: left; cursor: pointer; display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 14px; align-items: center; padding: 18px; border-radius: 22px; border: 1px solid var(--line); background: var(--card); }
.tl-q svg { width: 48px; height: 48px; } .tl-q .ringt { fill: none; stroke: var(--well); stroke-width: 4; } .tl-q .ringv { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; }
.tl-q span { display: grid; gap: 2px; min-width: 0; } .tl-q small, .tl-q i { font-size: 12.5px; color: var(--soft); font-style: normal; } .tl-q b { font: 600 20px/1.2 "Space Grotesk", sans-serif; }
.tl-sheet { position: fixed; inset: 0; z-index: 30; background: rgba(0,0,0,.45); display: grid; align-items: end; justify-items: center; }
.tl-sheet-in { width: min(560px, 100%); max-height: 80vh; overflow: auto; background: var(--card); border-radius: 24px 24px 0 0; padding: 20px; display: grid; gap: 14px; }
.note { color: var(--soft); font-size: 13.5px; padding: 18px 4px; text-align: center; }
.hero-card { gap: 12px; }
.hsub { color: var(--soft); font-size: 14px; margin-top: -6px; }
.hgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 14px 28px; align-items: center; }
.hside { display: grid; gap: 10px; min-width: 0; }
.hscene { max-width: 560px; margin: 0 auto; width: 100%; }
.hrow { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 8px; align-items: start; max-width: 560px; margin: -4px auto 0; width: 100%; }
.hcar { display: grid; gap: 1px; min-width: 0; } .hcar.r { text-align: right; }
.hcar strong { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hcar b { font: 600 24px/1.15 "Space Grotesk", Inter, sans-serif; font-variant-numeric: tabular-nums; }
.hcar small { font-size: 12px; color: var(--soft); } .hcar.pick small { color: var(--accent-ink); font-weight: 600; }
.hmid { font-size: 11.5px; color: var(--soft); text-align: center; padding-top: 2px; white-space: nowrap; }
.hrib { background: var(--well); border-radius: 16px; padding: 10px 12px 6px; display: grid; gap: 4px; }
.hrib .row { font-size: 12.5px; color: var(--soft); } .hrib .row b { color: var(--ink); font: 600 15px "Space Grotesk", Inter, sans-serif; }
.hsteps { display: grid; gap: 8px; }
.hstep { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; align-items: center; background: var(--well); border-radius: 14px; padding: 10px 12px; font-size: 13px; font-weight: 600; }
.hstep i { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: #fff; font: 600 13px/1 "Space Grotesk", Inter, sans-serif; font-style: normal; }
.hstep.warn i { background: var(--sun); color: #201a00; } .hstep small { display: block; color: var(--soft); font-size: 12px; font-weight: 400; }
.hbody { fill: var(--well); } .hline { fill: none; stroke: var(--ink); stroke-width: 2.4; stroke-linejoin: round; } .hwin { fill: var(--card); opacity: .6; }
.hwheel { fill: var(--ink); } .hhub { fill: var(--well); } .hground { stroke: var(--line); stroke-width: 2; stroke-linecap: round; }
.hfloor { stroke: var(--bad); stroke-width: 2.4; stroke-dasharray: 4 4; }
.hpost { fill: var(--ink); } .hscreen { fill: var(--accent); } .hbolt { fill: var(--card); }
.hcable { fill: none; stroke: var(--faint); stroke-width: 3; stroke-linecap: round; } .hcable.live { stroke: var(--accent); }
.hdash { fill: none; stroke: var(--card); stroke-width: 1.6; stroke-dasharray: 2 9; stroke-linecap: round; animation: hdash 1s linear infinite; } @keyframes hdash { to { stroke-dashoffset: -11; } }
.hglow { animation: hglow 2.4s ease-in-out infinite; } @keyframes hglow { 50% { opacity: .35; } }
.hfill { transform-box: fill-box; transform-origin: left; animation: hfill 1.2s cubic-bezier(.2,.8,.2,1) both; } @keyframes hfill { from { transform: scaleX(0); } }
.hstar { fill: var(--faint); } .hmoon { fill: var(--sun); }
.hhead { display: flex; align-items: center; gap: 12px; }
.hbadge { width: 44px; height: 44px; border-radius: 15px; background: linear-gradient(145deg, #17264a, #40307a); display: grid; place-items: center; flex: none; }
.hbadge svg { width: 24px; height: 24px; fill: #ffd76a; }
.hwhen { display: grid; line-height: 1.25; min-width: 0; flex: 1; } .hwhen b { font: 600 18px "Space Grotesk", Inter, sans-serif; } .hwhen small { color: var(--soft); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hprice { display: flex; align-items: center; gap: 10px; background: var(--well); border-radius: 15px; padding: 7px 12px; flex: none; }
.hprice b { font: 600 16px/1.2 "Space Grotesk", Inter, sans-serif; display: block; white-space: nowrap; font-variant-numeric: tabular-nums; } .hprice small { font-size: 11.5px; color: var(--soft); white-space: nowrap; font-weight: 600; }
.hprice.good small { color: var(--accent-ink); } .hprice.bad small { color: var(--bad); } .hprice.mid small { color: var(--fc); }
.hspark { height: 28px; flex: none; } .hspark rect { fill: var(--faint); opacity: .45; } .hspark rect.good { fill: var(--accent); opacity: 1; } .hspark rect.mid { fill: var(--fc); opacity: 1; } .hspark rect.bad { fill: var(--bad); opacity: 1; }
.wkp { display: grid; grid-template-columns: auto repeat(7, minmax(0, 1fr)); gap: 3px; min-width: 0; }
.wkp-lab, .wkp-col { display: grid; grid-template-rows: 16px 18px; grid-auto-rows: 24px; gap: 4px; min-width: 0; padding: 5px 2px; }
.wkp-col { font: inherit; color: inherit; border: 0; background: transparent; border-radius: 12px; cursor: pointer; text-align: center; }
.wkp-lab { padding-right: 6px; max-width: clamp(58px, 24vw, 130px); }
.wkp-col.on { background: var(--soc); }
.wkp b { font: 600 11.5px "Space Grotesk", Inter, sans-serif; align-self: center; white-space: nowrap; }
.wkp i { font-style: normal; font-size: 11px; color: var(--soft); font-variant-numeric: tabular-nums; align-self: center; white-space: nowrap; border-radius: 999px; }
.wkp i.fc { font-style: italic; opacity: .75; } .wkp i.best { color: var(--card); background: var(--accent); font-weight: 600; font-style: normal; opacity: 1; }
.wkp u { text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 2px; border-radius: 8px; font-size: 11.5px; font-weight: 600; font-variant-numeric: tabular-nums; min-width: 0; overflow: hidden; background: linear-gradient(90deg, color-mix(in srgb, var(--c, var(--line)) 30%, transparent) var(--l, 0%), var(--well) var(--l, 0%)); }
.wkp u.chg { background: var(--c); color: var(--card); } .wkp u svg { width: 7px; height: 10px; fill: currentColor; flex: none; }
.wkp-lab u { background: none; display: block; font-weight: 500; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 24px; text-align: left; }
.wkp-lab s, .kpi small s { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
.tl-wrap { position: relative; min-width: 0; }
.tl-ctl { position: absolute; right: 8px; top: 24px; display: grid; gap: 6px; }
.tl-ctl button { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); background: var(--card); color: var(--ink); font: 600 16px/1 Inter, system-ui, sans-serif; cursor: pointer; padding: 0; box-shadow: var(--shadow); }
.tl-ctl button[data-tlnow] { font-size: 10.5px; } .tl-ctl button:disabled { opacity: .35; cursor: default; }
.sumg { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 12px 20px; align-items: end; }
.sumbig b { font: 600 36px/1 "Space Grotesk", Inter, sans-serif; font-variant-numeric: tabular-nums; } .sumbig span, .sumeff span { font: 600 14px "Space Grotesk", Inter, sans-serif; margin-left: 5px; color: var(--soft); }
.sumbig small, .sumwk small { display: block; font-size: 12px; color: var(--soft); margin-top: 3px; }
.sumeff b { font: 600 22px/1 "Space Grotesk", Inter, sans-serif; font-variant-numeric: tabular-nums; } .sumeff svg { max-width: 190px; margin-top: 6px; }
.sumwk { grid-column: 1 / -1; position: relative; } .sumwk svg { height: 62px; } .sumwk small { display: flex; justify-content: space-between; margin-top: 0; }
@media (min-width: 760px) { .sumg { grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, .9fr); } .sumwk { grid-column: 2; grid-row: 1; } .sumeff { grid-column: 3; grid-row: 1; } }
.nm { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0; }
.nm input { font: inherit; font-size: 14px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); color: var(--ink); min-width: 0; flex: 1 1 130px; }
.btn.on { background: var(--ink); color: var(--card); border-color: var(--ink); }
.rmap { position: relative; overflow: hidden; border-radius: 16px; background: var(--well); touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; }
.rmap.drag { cursor: grabbing; }
.rmove, .rtiles { position: absolute; left: 0; top: 0; }
.rtiles img { position: absolute; width: 256px; height: 256px; max-width: none; pointer-events: none; }
.rtiles { filter: grayscale(.8) brightness(1.05) contrast(.92); }
:host([dark]) .rtiles { filter: invert(1) hue-rotate(180deg) grayscale(.7) brightness(.85) contrast(.9); }
.rsvg { position: absolute; left: 0; top: 0; overflow: hidden; }
.rsvg text { font-size: 11.5px; font-weight: 600; fill: var(--ink); paint-order: stroke; stroke: var(--card); stroke-width: 3.5px; stroke-linejoin: round; }
.rmap .tl-ctl { top: 8px; }
.rattr { position: absolute; left: 6px; bottom: 4px; font-size: 9.5px; color: var(--soft); background: color-mix(in srgb, var(--card) 72%, transparent); padding: 1px 5px; border-radius: 6px; text-decoration: none; }
#places:empty { display: none; } #places { align-items: center; }
.detail .tag { font-size: 11px; } .rhist { margin: -2px 0 2px; } .rhist text { font-size: 9.5px; }
.tl-sheet-in { padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
`;

/* Small tools. */
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (a, f = (x) => x) => a.reduce((t, v) => t + (Number(f(v)) || 0), 0);
const mean = (a) => (a.length ? sum(a) / a.length : 0);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[clamp(Math.round(p * (s.length - 1)), 0, s.length - 1)] : 0; };
const pad = (v) => String(v).padStart(2, "0");
const mod = (v, n) => ((v % n) + n) % n;
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const arc = (cx, cy, r0, r1, a0, a1) => { const p = (rr, a) => `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; return `M${p(r0, a0)}L${p(r1, a0)}A${r1} ${r1} 0 0 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`; };
const nice = (top) => { const raw = top / 3, pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6))), k = raw / pow; return (k >= 5 ? 5 : k >= 2 ? 2 : 1) * pow; };
const DAY = 86400000;
/* The map: Web Mercator, as every tiled map uses. */
const merc = (p, z) => { const n = 256 * 2 ** z, k = Math.sin((clamp(p.lat, -85, 85) * Math.PI) / 180); return [((p.lon + 180) / 360) * n, (0.5 - Math.log((1 + k) / (1 - k)) / (4 * Math.PI)) * n]; };
const unmerc = (x, y, z) => { const n = 256 * 2 ** z; return { lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI, lon: (x / n) * 360 - 180 }; };
const distKm = (a, b) => { const r = Math.PI / 180, dx = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r), dy = (b.lat - a.lat) * r; return 6371 * Math.sqrt(dx * dx + dy * dy); };
const thin = (list, most) => { if (list.length <= most) return list; const k = (list.length - 1) / (most - 1); return Array.from({ length: most }, (_, i) => list[Math.round(i * k)]); };
const N = 90;
const CAR_BODY = "M6 66Q6 50 24 46L62 40Q84 14 118 12L150 12Q178 14 196 38L214 44Q226 48 226 62L226 68Q226 76 218 76L14 76Q6 76 6 68Z";
const CAR_WIN = "M72 40Q90 20 118 18L132 18L132 40ZM138 18L150 18Q170 20 186 40L138 40Z";

function boot(host, root) {
  const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (n) => getComputedStyle(host).getPropertyValue(n).trim();
  const S = { tab: "plan", car: null, view: "fan", T: null, pickTrip: null };
  const tlS = { z: 1, day: 0, left: null, at: null };
  const charts = {};
  let IN = null, DATA = {}, da = true, built = false, wrap = null, raf = 0;
  let WD, WDL, TODAY, NOWH, ids, CARS, temp, night, avg, PD, trips, charges, daily, L, PLACES, HOME, OTHER;
  let H, START, K, KW, price, sigma, TL, priceH, fcH, PLAN;
  const tr = (a, b) => (da ? a : b);
  const nf = (v, d = 0) => (v == null || !Number.isFinite(Number(v)) ? "–" : Number(v).toFixed(d).replace(".", da ? "," : "."));
  const kr = (v, d = 2) => nf(v, d);
  const money = (v, d = 2) => (v == null || !Number.isFinite(Number(v)) ? "–" : IN.money(Number(v), d));
  const dateOf = (d) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - (N - d));
  const isoOf = (d) => { const t = dateOf(d); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
  const dIdx = (iso) => N - Math.round((TODAY - new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))) / DAY);
  const dm = (d) => { const t = dateOf(d); return `${t.getDate()}/${t.getMonth() + 1}`; };
  const hm = (min) => `${pad(Math.floor(min / 60) % 24)}.${pad(Math.round(min) % 60)}`;
  const when = (t) => (t.est ? `${tr("ca. kl.", "about")} ${pad(Math.floor(t.dep / 60))}` : `${tr("kl.", "at")} ${hm(t.dep)}`);
  const hourOf = (i) => (START + i) % 24, dayOf = (i) => Math.floor((START + i) / 24), wdOf = (i) => (TODAY.getDay() + dayOf(i)) % 7;
  const label = (i) => `${WD[wdOf(i)]} ${pad(hourOf(i))}.00`;
  const tempCol = (T) => { if (T == null) return "var(--faint)"; const k = clamp((T + 2) / 20, 0, 1); return `color-mix(in srgb, var(--sun) ${(k * 100).toFixed(0)}%, var(--cold))`; };
  const say = (act, value) => host.dispatchEvent(new CustomEvent("evp-insight", { detail: { act, value }, bubbles: true, composed: true }));
  // The night's price of a day: the cheapest three hours from the evening on.
  const nightOf = (d) => { const [w0, w1] = IN.window || [21, 7], span = mod(w1 - w0, 24) || 10, list = []; for (let h = d * 24 + w0; h < d * 24 + w0 + span; h += 1) { const p = priceH.get(h); if (p != null) list.push(p); } list.sort((a, b) => a - b); return list.length >= 3 ? (list[0] + list[1] + list[2]) / 3 : (PD[isoOf(N + d)] || {}).night ?? null; };
  const inWindow = (hod) => { const [a, b] = IN.window || [21, 7]; return a < b ? hod >= a && hod < b : hod >= a || hod < b; };

  /* ---------- what is known: Insight's days, Home Assistant's hourly statistics, the price sensor */
  function load() {
    da = IN.lang === "da";
    DATA = IN.insight || {};
    WD = da ? ["søn", "man", "tir", "ons", "tor", "fre", "lør"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    WDL = da ? ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    HOME = tr("Hjem", "Home"); OTHER = tr("Andre steder", "Elsewhere");
    const now = new Date(IN.now);
    TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    NOWH = (now - TODAY) / 3600000;
    const hNow = Math.floor(NOWH);
    const live = Object.fromEntries((IN.cars || []).map((c) => [c.id, c]));
    const COLS = ["var(--accent)", "var(--car2)", "var(--fc)", "var(--cold)", "var(--bad)"];
    ids = Object.keys(DATA.cars || {});
    CARS = {};
    ids.forEach((id, k) => { const d = (DATA.detail || {})[id] || {}; CARS[id] = { id, name: DATA.cars[id].name || (live[id] || {}).name || id, cap: Number((live[id] || {}).capacity) || 60, col: COLS[k % COLS.length], base: (d.kwh_km || 0) * 100, cold: d.cold || 0, days: d.days || {}, week: d.week || [], detail: d, live: live[id] || {}, src: DATA.cars[id].sources || {}, known: DATA.cars[id].days || 0 }; });
    if (!ids.includes(S.car)) S.car = ids[0] || null;
    PD = DATA.price_days || {};
    temp = []; night = []; avg = [];
    for (let d = 0; d <= N; d += 1) { const iso = isoOf(d); let T = null; for (const id of ids) { const v = (CARS[id].days[iso] || {}).temp; if (v != null) { T = v; break; } } temp.push(T); night.push((PD[iso] || {}).night ?? null); avg.push((PD[iso] || {}).mean ?? null); }
    const t0 = TODAY.getTime();
    const hmap = (id, key, ok) => { const m = new Map(); for (const row of (id && (IN.stats || {})[id]) || []) { const v = row[key]; if (v == null || !ok(v)) continue; m.set(Math.floor((IN.wall(row.start) - t0) / 3600000 + 1e-6), v); } return m; };
    // Prices by the hour: the kept ones, then what the price sensor has from now on.
    priceH = new Map(); fcH = new Set();
    for (const [iso, list] of Object.entries(DATA.price_hours || {})) { const day = dIdx(iso) - N; (list || []).slice(0, 24).forEach((p, h) => { if (p != null) priceH.set(day * 24 + h, p); }); }
    // From now on: the panel's own prices reach tomorrow; Insight sends every price the sensor has, its forecast included.
    const ahead = new Map();
    const take = (t, p, guess) => { if (p == null || !Number.isFinite(t)) return; const h = Math.floor((t - t0) / 3600000 + 1e-6); if (!ahead.has(h)) ahead.set(h, { known: [], guess: [] }); ahead.get(h)[guess ? "guess" : "known"].push(p); };
    for (const slot of IN.prices || []) take(slot.t, slot.price, slot.forecast);
    for (const slot of DATA.ahead || []) take(IN.wall(slot.start), slot.price, slot.forecast);
    for (const [h, x] of ahead) { if (x.known.length) priceH.set(h, mean(x.known)); else { priceH.set(h, mean(x.guess)); fcH.add(h); } }
    const errors = DATA.errors || [];
    START = hNow; price = []; sigma = [];
    for (let i = 0; i < 168; i += 1) { const p = priceH.get(hNow + i); if (p == null) break; price.push(p); }
    H = price.length;
    K = H; for (let i = 0; i < H; i += 1) if (fcH.has(hNow + i)) { K = i; break; }
    const ptop = Math.max(0.01, ...price);
    for (let i = 0; i < H; i += 1) { const lead = i < K ? 0 : Math.floor((i - K) / 24) + 1; sigma.push(lead ? (errors[Math.min(5, lead - 1)] ?? 0.2) * Math.max(price[i], ptop * 0.15) : 0); }
    KW = Number(IN.homeKw) || 11;
    if (S.T == null && H) S.T = Math.round(((DATA.tonight || {}).price ?? q(price, 0.3)) * 20) / 20;

    /* Trips: the logged ones, and before them each stretch of hours the odometer moved. */
    trips = []; charges = [];
    const place = (name) => (name === "home" ? HOME : !name || name === "not_home" || name === "away" ? tr("Ude", "Away") : String(name));
    const near = (m, h, back, span) => { for (let k = 0; k <= span; k += 1) { const v = m.get(h + (back ? -k : k)); if (v != null) return v; } return null; };
    for (const id of ids) {
      const c = CARS[id];
      const odo = hmap(c.src.odometer, "change", (v) => v > 0 && v < 400), soc = hmap(c.src.soc, "mean", (v) => v >= 0 && v <= 100), meter = hmap(c.src.energy, "change", (v) => v > 0.05 && v < 150), tm = hmap(c.src.temperature, "mean", (v) => v > -40 && v < 55);
      c.socH = soc;
      // Charging is also seen as the battery rising while the car stands still. Where the car's energy meter
      // misses most of that (some cars' meters do), the battery's own rise is what counts.
      const rise = new Map();
      for (const [h, v] of soc) { const before = soc.get(h - 1); if (before != null && v - before > 0.8 && !(odo.get(h) > 1)) rise.set(h, ((v - before) / 100) * c.cap); }
      const en = sum([...meter.values()]) < 0.5 * sum([...rise.values()]) ? rise : meter;
      const logged = {};
      for (const t of DATA.trips || []) {
        if (t.vehicle !== id || !t.start) continue;
        const a = new Date(IN.wall(t.start)), b = new Date(IN.wall(t.end || t.start)), d = N + Math.floor((a - TODAY) / DAY);
        if (d < 0 || d > N) continue;
        const km = Number(t.km) || 0, kwh = t.kwh != null ? Number(t.kwh) : (km * (c.base || 18)) / 100, dep = a.getHours() * 60 + a.getMinutes();
        (logged[d] ||= []).push({ car: id, d, dep, arr: dep + Math.max(1, (b - a) / 60000), from: place(t.from), to: place(t.to), km, kwh, eff: km > 0.5 ? (kwh / km) * 100 : c.base || 18, soc0: t.soc_start ?? null, soc1: t.soc_end ?? null, temp: t.temp ?? temp[d], zone: true });
      }
      const runs = []; let run = null;
      for (let h = -N * 24; h <= hNow; h += 1) { const km = odo.get(h) || 0; if (km >= 0.3) { if (run) { run.h1 = h; run.km += km; } else run = { h0: h, h1: h, km }; } else if (run) { runs.push(run); run = null; } }
      if (run) runs.push(run);
      if (!odo.size) for (let d = 0; d < N; d += 1) { const day = c.days[isoOf(d)] || {}; if ((day.km || 0) >= 1) runs.push({ h0: (d - N) * 24 + Math.floor(day.out ?? 12), h1: (d - N) * 24 + Math.floor(day.out ?? 12), km: day.km, whole: day.used }); }
      const est = [];
      for (const r of runs) {
        if (r.km < 1) continue;
        const d = N + Math.floor(r.h0 / 24);
        if (logged[d]) continue;
        const s0 = near(soc, r.h0 - 1, true, 5), s1 = near(soc, r.h1 + 1, false, 2), day = c.days[isoOf(d)] || {};
        const dayEff = day.km > 5 && day.used > 0 ? (day.used / day.km) * 100 : c.base || 18;
        // What the battery fell, and what was charged on the way.
        let onWay = 0; for (let h = r.h0; h <= r.h1; h += 1) onWay += meter.get(h) || 0;
        let kwh = r.whole > 0 ? r.whole : s0 != null && s1 != null ? ((s0 - s1) / 100) * c.cap + onWay * 0.9 : null;
        if (kwh == null || kwh <= 0 || (kwh / r.km) * 100 < 6 || (kwh / r.km) * 100 > 60) kwh = (r.km * clamp(dayEff, 8, 45)) / 100;
        const hod = mod(r.h0, 24), dep = hod * 60 + 20;
        est.push({ car: id, d, dep, arr: Math.min((hod + r.h1 - r.h0 + 1) * 60 - 5, dep + Math.max(8, r.km * 1.1)), km: r.km, kwh, eff: (kwh / r.km) * 100, soc0: s0, soc1: s1, temp: tm.get(r.h0) ?? temp[Math.min(d, N)], est: true, h0: r.h0, h1: r.h1 });
      }
      // Where the car was, for the days Home Assistant still has its positions: each stretch gets its road and where it went.
      const home = IN.home && Number.isFinite(IN.home.lat) && Number.isFinite(IN.home.lon) ? IN.home : null;
      const track = ((IN.tracks || {})[c.src.tracker] || []).map(([ms, lat, lon]) => ({ h: (IN.wall(ms) - t0) / 3600000, lat, lon })).filter((p) => Number.isFinite(p.h) && Number.isFinite(p.lat) && Number.isFinite(p.lon)).sort((a, b) => a.h - b.h);
      if (track.length > 1) {
        let i0 = 0;
        for (const t of [...est].sort((a, b) => a.h0 - b.h0)) {
          if (t.h1 + 1 < track[0].h) continue;
          while (i0 < track.length && track[i0].h < t.h0) i0 += 1;
          const pts = []; if (i0 > 0) pts.push(track[i0 - 1]);
          for (let i = i0; i < track.length && track[i].h < t.h1 + 1; i += 1) pts.push(track[i]);
          if (pts.length < 2) continue;
          t.route = thin(pts, 80); t.b = pts[pts.length - 1];
          const far = home ? pts.reduce((m, p) => (distKm(p, home) > distKm(m, home) ? p : m)) : t.b;
          // Out and home again within the stretch: it went to the farthest point.
          t.dest = home && distKm(t.b, home) < 0.25 ? (distKm(far, home) > 0.3 ? far : null) : t.b;
        }
      }
      // Where the stretches went is not known, so they are told apart by how far: out, on, and back home.
      const byDay = {}; for (const t of est) (byDay[t.d] ||= []).push(t);
      const outs = [];
      for (const list of Object.values(byDay)) { let at = null; list.forEach((t, k) => { const last = k === list.length - 1; if (!at) { t.leg = "out"; at = t; outs.push(t); } else if (last || Math.abs(t.km - at.km) <= Math.max(2, at.km * 0.25)) { t.leg = "back"; t.from0 = at; at = null; } else { t.leg = "on"; t.from0 = at; at = t; outs.push(t); } }); }
      const groups = [];
      for (const t of [...outs].sort((a, b) => a.km - b.km)) { const g = groups[groups.length - 1]; if (g && t.km - g.km <= Math.max(1.5, g.km * 0.12)) { g.list.push(t); g.km = mean(g.list.map((x) => x.km)); } else groups.push({ km: t.km, list: [t] }); }
      const top = [...groups].sort((a, b) => b.list.length - a.list.length).slice(0, 6);
      // A place has the name the household gave it, else the zone it lies in, else the zone a logged trip of that length went to, else how far it is.
      const given = (IN.names || {})[id] || [], zones = (IN.zones || []).filter((z) => !z.home && Number.isFinite(z.lat) && Number.isFinite(z.lon) && !(home && distKm(z, home) < 0.3));
      for (const g of groups) {
        const ds = g.list.map((t) => t.dest).filter(Boolean);
        if (ds.length) g.pos = { lat: q(ds.map((p) => p.lat), 0.5), lon: q(ds.map((p) => p.lon), 0.5) };
        const fits = (km) => Math.abs(km - g.km) <= Math.max(1.5, g.km * 0.12), own = given.find((x) => fits(Number(x.km))), inZone = g.pos ? zones.find((z) => distKm(g.pos, z) * 1000 <= Math.max(Number(z.radius) || 0, 150)) : null, zone = Object.values(logged).flat().find((t) => t.from === HOME && t.to !== HOME && fits(t.km));
        if (!g.pos && own && Number.isFinite(Number(own.lat)) && Number.isFinite(Number(own.lon))) g.pos = { lat: Number(own.lat), lon: Number(own.lon) };
        g.custom = Boolean(own); g.name = own ? String(own.name) : inZone ? String(inZone.name) : zone ? zone.to : g.pos || top.includes(g) ? `≈ ${nf(g.km, g.km < 10 ? 1 : 0)} km` : OTHER;
        for (const t of g.list) { t.to = g.name; t.place = g; }
      }
      for (const t of est) { if (t.leg === "out") t.from = HOME; else if (t.leg === "back") { t.from = t.from0.to; t.to = HOME; t.place = t.from0.place; } else t.from = t.from0.to; delete t.from0; }
      // The places this car goes to, the most visited first: those of one name are one place.
      const byName = new Map(), spot = (name) => { if (!byName.has(name)) byName.set(name, { name, list: [], custom: false, pos: null, groups: [] }); return byName.get(name); };
      for (const g of groups) { if (g.name === OTHER) continue; const p = spot(g.name); p.list.push(...g.list); p.groups.push(g); p.custom = p.custom || g.custom; p.pos = p.pos || g.pos || null; g.shown = p; }
      for (const t of Object.values(logged).flat()) { if (t.to === HOME || t.to === tr("Ude", "Away")) continue; const p = spot(t.to), z = zones.find((x) => x.name === t.to); p.list.push(t); if (!p.pos && z) p.pos = { lat: z.lat, lon: z.lon }; }
      c.places = [...byName.values()].map((p) => { const last = [...p.list].sort((a, b) => b.d - a.d || b.dep - a.dep)[0], road = [...p.list].sort((a, b) => b.d - a.d).find((t) => t.route); return Object.assign(p, { km: mean(p.list.map((t) => t.km)), count: p.list.length, last, route: road ? road.route : null }); }).sort((a, b) => b.count - a.count);
      trips.push(...Object.values(logged).flat(), ...est);
      /* Charging: each stretch of hours the car's energy meter rose. */
      const sess = []; let cur = null;
      for (let h = -N * 24; h <= hNow; h += 1) { const k = en.get(h) || 0; if (k <= 0.2) continue; if (cur && h - cur.h1 <= 2) { cur.h1 = h; cur.kwh += k; cur.max = Math.max(cur.max, k); cur.hours.push([h, k]); } else { if (cur) sess.push(cur); cur = { h0: h, h1: h, kwh: k, max: k, hours: [[h, k]] }; } }
      if (cur) sess.push(cur);
      if (!en.size) for (let d = 0; d < N; d += 1) { const k = (c.days[isoOf(d)] || {}).charged || 0; if (k > 1) sess.push({ h0: (d - N) * 24 + 1, h1: (d - N) * 24 + 1 + Math.floor(k / KW), kwh: k, max: 0, hours: [] }); }
      for (const s of sess) {
        if (s.kwh < 1) continue;
        const d = N + Math.floor(s.h0 / 24), hod = mod(s.h0, 24);
        const own = (c.live.history || []).find((e) => Math.abs((e.start - t0) / 3600000 - s.h0) <= 2 && e.energy > 0 && e.cost > 0);
        // Away at a fast charger: far more in an hour than the charger at home gives, by day, and not a charge EV Planner ran itself.
        const fast = !own && s.max > KW * 2 && hod >= 5 && hod < 22;
        let cost = 0, got = 0; for (const [h, k] of s.hours) { const p = priceH.get(h); if (p != null) { cost += p * k; got += k; } }
        let p = got > s.kwh * 0.6 ? cost / got : (PD[isoOf(hod < 12 ? d - 1 : d)] || {}).night ?? (PD[isoOf(d)] || {}).mean ?? null;
        if (own) p = own.cost / own.energy;
        if (!s.hours.length) for (let k = 0; k < Math.ceil(s.kwh / KW); k += 1) s.hours.push([s.h0 + k, Math.min(KW, s.kwh - k * KW)]);
        charges.push({ car: id, d, h: s.h0, len: s.h1 - s.h0 + 1, hour: hod, kwh: s.kwh, where: fast ? "fast" : "home", price: fast ? null : p, avg: (PD[isoOf(Math.min(d, N))] || {}).mean ?? null, soc1: near(soc, s.h1 + 1, false, 2), hours: s.hours });
      }
    }
    trips.sort((a, b) => a.d - b.d || a.dep - b.dep).forEach((t, i) => (t.id = i));
    charges.sort((a, b) => a.h - b.h);
    daily = {}; for (const id of ids) daily[id] = Array.from({ length: N }, (_, d) => Number((CARS[id].days[isoOf(d)] || {}).used) || 0);
    // The places on the map: home in the middle, the others around it, the far ones furthest out.
    const names = [...new Set(trips.flatMap((t) => [t.from, t.to]))].filter((n) => n && n !== HOME);
    const far = (n) => mean(trips.filter((t) => t.to === n || t.from === n).map((t) => t.km));
    names.sort((a, b) => far(a) - far(b));
    const ANG = [-40, -140, 25, -90, 165, -10, -165, 60, 120, -115, -65, 95];
    PLACES = { [HOME]: [47, 60] };
    names.forEach((n, k) => { const a = (ANG[k % ANG.length] * Math.PI) / 180, r = 17 + 27 * (names.length > 1 ? k / (names.length - 1) : 0.5); PLACES[n] = [clamp(47 + r * Math.cos(a) * 1.25, 8, 92), clamp(60 + r * Math.sin(a), 10, 90)]; });
    /* What is learned from them. */
    const learn = (id) => {
      const mine = trips.filter((t) => t.car === id && t.d < N), byWd = [...Array(7)].map(() => []), awayP = [...Array(7)].map(() => Array(24).fill(0)), nWd = Array(7).fill(0), deps = [...Array(7)].map(() => []);
      const perDay = {}; for (const t of mine) (perDay[t.d] ||= []).push(t);
      for (let d = 0; d < N; d += 1) {
        const wd = dateOf(d).getDay(); nWd[wd] += 1; byWd[wd].push(daily[id][d]);
        const hours = new Set(); let out = null;
        for (const t of perDay[d] || []) { deps[wd].push(t.dep); for (let h = Math.floor(t.dep / 60); h <= Math.floor(Math.min(1439, t.arr) / 60); h += 1) hours.add(h); if (t.to !== HOME) out = out || t; else if (out) { for (let h = Math.floor(out.arr / 60); h <= Math.floor(t.dep / 60); h += 1) hours.add(h); out = null; } }
        hours.forEach((h) => { if (h >= 0 && h < 24) awayP[wd][h] += 1; });
      }
      awayP.forEach((row, wd) => row.forEach((v, h) => (row[h] = v / Math.max(1, nWd[wd]))));
      return { mine, byWd, awayP, deps, mu: byWd.map(mean), lo: byWd.map((a) => q(a, 0.1)), hi: byWd.map((a) => q(a, 0.9)) };
    };
    L = {}; for (const id of ids) L[id] = learn(id);

    /* The timeline: three weeks back, now, a week ahead. */
    const H0 = -21 * 24, H1 = 7 * 24, hours = [];
    for (let h = H0; h < H1; h += 1) hours.push({ h, hod: mod(h, 24), day: Math.floor(h / 24), price: priceH.get(h) ?? null });
    const priced = hours.filter((x) => x.price != null), firstFc = priced.find((x) => fcH.has(x.h));
    const kn = firstFc ? firstFc.h : priced.length ? priced[priced.length - 1].h + 1 : hNow;
    const cars = {};
    for (const id of ids) {
      const c = CARS[id], lvl = Number.isFinite(Number(c.live.soc)) && c.live.soc !== null ? Number(c.live.soc) : near(c.socH, hNow, true, 48);
      const soc = hours.map((x) => (x.h < hNow ? c.socH.get(x.h) ?? null : x.h === hNow ? lvl : null));
      const exp = [], hard = []; let a = lvl, b = lvl;
      for (const x of hours) { if (x.h < hNow || lvl == null) { exp.push(null); hard.push(null); continue; } if (x.hod === 7 && x.h > hNow) { const w = c.week[mod(new Date(t0 + x.day * DAY + DAY / 2).getDay() + 6, 7)] || {}; a -= ((w.p50 || 0) / c.cap) * 100; b -= ((w.p90 || 0) / c.cap) * 100; } exp.push(clamp(a, 0, 100)); hard.push(clamp(b, 0, 100)); }
      const plan = ((c.live.plan || {}).segments || []).map((s) => ({ h: (s.start - t0) / 3600000, len: Math.max(0.25, (s.end - s.start) / 3600000) })).filter((s) => s.h + s.len > NOWH && s.h < H1);
      cars[id] = { id, name: c.name, cap: c.cap, soc, exp, hard, level: lvl, min: Number((c.live || {}).min_soc) || 0, plan, trips: trips.filter((t) => t.car === id && t.d >= N - 21).map((t) => ({ ...t, h: (t.d - N) * 24 + t.dep / 60 })), charges: charges.filter((x) => x.car === id && x.h >= H0) };
    }
    TL = { hours, cars, H0, H1, now: NOWH, kn, errors };

    /* The coming week for the cars: each evening's level, and which car is expected to get the charger each night.
       Tonight is Insight's own choice; the nights after follow the same rule on a typical day's driving. */
    const tn = DATA.tonight || {}, share = (tn.groups || []).map((g) => (g.cars || []).filter((id) => CARS[id])).filter((g) => g.length);
    for (const id of ids) if (!share.some((g) => g.includes(id))) share.push([id]);
    const st = {}, cells = {};
    for (const id of ids) { const lvl = cars[id].level; st[id] = { kwh: lvl == null ? null : (lvl / 100) * CARS[id].cap, target: ((Number(CARS[id].live.target) || 80) / 100) * CARS[id].cap, knows: CARS[id].week.length === 7 }; cells[id] = []; }
    const wkOf = (id, d) => CARS[id].week[mod(new Date(t0 + d * DAY + DAY / 2).getDay() + 6, 7)] || {};
    const floor = (id, d) => Math.min(st[id].target, (wkOf(id, d).p90 || 0) + 0.1 * CARS[id].cap);
    const reach = (id, n) => { let left = st[id].kwh, k = 0; for (; k < 4; k += 1) { if (left < floor(id, n + 1 + k) - 1e-6) break; left -= wkOf(id, n + 1 + k).p90 || 0; } return k; };
    const nights = [];
    for (let n = 0; n < 7; n += 1) {
      const picks = new Set();
      for (const g of share) {
        const able = g.filter((id) => st[id].kwh != null && st[id].knows);
        if (n === 0 && (tn.groups || []).length) { const real = (tn.groups || []).find((x) => (x.cars || []).some((id) => g.includes(id))); if (real && real.pick && g.includes(real.pick)) picks.add(real.pick); continue; }
        // A car charges the night it must; when two would need the same night after this one, one of them goes now.
        const must = able.filter((id) => st[id].kwh < floor(id, n + 1) - 1e-6), soon = able.filter((id) => reach(id, n) <= 1 && st[id].kwh < st[id].target - 0.5);
        const lack = (id) => (floor(id, n + 1) - st[id].kwh) / CARS[id].cap;
        const pick = must.length ? must.sort((a, b) => lack(b) - lack(a))[0] : soon.length > 1 ? soon.sort((a, b) => st[a].kwh / CARS[a].cap - st[b].kwh / CARS[b].cap)[0] : null;
        if (pick) picks.add(pick);
      }
      for (const id of ids) {
        const x = st[id], shown = x.kwh == null || (n > 0 && !x.knows) ? null : (x.kwh / CARS[id].cap) * 100;
        cells[id].push({ level: shown, charge: picks.has(id) });
        if (x.kwh == null) continue;
        if (picks.has(id)) x.kwh = Math.max(x.kwh, x.target);
        x.kwh = Math.max(0, x.kwh - (wkOf(id, n + 1).p50 || 0));
      }
      nights.push({ n, wd: new Date(t0 + n * DAY + DAY / 2).getDay(), price: n === 0 ? tn.price ?? nightOf(0) : nightOf(n), fc: fcH.has(n * 24 + (IN.window || [21])[0] + 3) });
    }
    PLAN = { nights, cells, cars: ids.filter((id) => st[id].kwh != null) };
  }

  /* ---------- the page */
  function build() {
    built = true;
    const HTML = `<div class="wrap">
  <nav class="tabs" aria-label="${tr("Områder", "Parts")}"><div id="tabs"></div></nav>
  <div class="panel" id="p-plan">
    <section class="card hero-card" id="hero"></section>
    <section class="card tl-card">
      <div class="row"><h2>${tr("Ugen for bilerne", "The cars' week")}</h2></div>
      <div class="wkp" id="wkp"></div>
      <div class="tl-wrap"><div class="tl-scroll" id="tl-scroll"><div id="tl"></div></div><div class="tl-ctl"><button data-tlz="1" aria-label="${tr("Zoom ind", "Zoom in")}">+</button><button data-tlz="-1" aria-label="${tr("Zoom ud", "Zoom out")}">−</button><button data-tlnow aria-label="${tr("Til nu", "To now")}">${tr("nu", "now")}</button></div></div>
      <div class="legend" id="tl-legend"></div>
      <div class="tl-day" id="tl-day"></div>
      <p class="small">${tr("Øverst de næste syv aftener: hvad hvert batteri forventes at stå på, og hvilken bil der forventes at få laderen den nat (fyldt felt med lyn). Tallet under dagen er nattens pris; den billigste er fremhævet. Tryk på en aften for at se den. Herunder tre uger bagud og en uge frem: træk sidelæns, zoom med + og −, og tryk på en dag.", "At the top the coming seven evenings: where each battery is expected to be, and which car is expected to get the charger that night (a filled field with a bolt). The figure under the day is the night's price; the cheapest is marked. Tap an evening to see it. Below, three weeks back and a week ahead: drag sideways, zoom with + and −, and tap a day.")}</p>
    </section>
    <div class="tl-three" id="tl-three"></div>
    <div class="tl-sheet" id="tl-sheet" hidden><div class="tl-sheet-in"><div class="row"><h2 id="tl-sheet-h"></h2><button class="btn" id="tl-close">${tr("Luk", "Close")}</button></div><div id="tl-sheet-b"></div></div></div>
  </div>
  <div class="panel" id="p-bil" hidden>
    <section class="card">
      <div class="row"><h2>${tr("90 dage med bilen", "90 days with the car")}</h2><div class="chips" id="carsel" role="group" aria-label="${tr("Bil", "Car")}"></div></div>
      <div class="sumg" id="sum-bil"></div>
    </section>
    <section class="card"><div class="row"><h2>${tr("Kortet over turene", "The map of the trips")}</h2><span class="demo">${tr("tykkere streg = oftere", "thicker line = more often")}</span></div><div id="map"></div><div class="chips" id="places"></div><div class="detail" id="trip"></div><p class="small">${tr("Tryk på et sted på kortet for at vælge det og give det et navn; tallet er, hvor mange gange der er kørt dertil på 90 dage. Stederne findes ud fra bilens position de dage, Home Assistant stadig har den (ca. 10), og ældre ture af samme længde regnes til samme sted. Ture, der ikke kan placeres, står under kortet. Kortet er OpenStreetMap, hentet gennem Home Assistant ligesom dets eget kort.", "Tap a place on the map to choose it and give it a name; the figure is how many times it was driven to in 90 days. The places are found from the car's position on the days Home Assistant still has it (about 10), and older trips of the same length are counted to the same place. Trips that cannot be placed are listed under the map. The map is OpenStreetMap, fetched through Home Assistant as its own map is.")}</p></section>
    <section class="card"><div class="row"><h2>${tr("Forbrug pr. dag", "Use per day")}</h2><span class="demo" id="daily-t"></span></div><div class="scroll"><div id="daily" style="position:relative;min-width:640px"></div></div></section>
    <div class="two">
      <section class="card"><div class="row"><h2>${tr("Ugeuret", "The week's clock")}</h2><span class="demo">${tr("hvornår bilen er væk", "when the car is away")}</span></div><div id="clock" style="max-width:420px;margin:0 auto;width:100%;position:relative"></div><p class="small">${tr("Inderst mandag, yderst søndag. Jo mørkere felt, jo oftere er bilen ude i den time. Peg på et felt.", "Monday innermost, Sunday outermost. The darker a field, the more often the car is out that hour. Point at a field.")}</p></section>
      <section class="card"><div class="row"><h2>${tr("Hver tur i 90 dage", "Every trip in 90 days")}</h2><span class="demo">${tr("størrelse: kWh · farve: temperatur ude", "size: kWh · colour: temperature outside")}</span></div><div class="scroll"><div id="trips" style="position:relative;min-width:640px"></div></div><p class="small">${tr("Vandret er datoen, lodret afgangen. Tryk på en tur for at se den på kortet. De lodrette striber er hverdagenes faste rytme; de enlige store prikker er de lange ture.", "Across is the date, up the departure. Tap a trip to see it on the map. The stripes are the weekdays' rhythm; the single large dots are the long trips.")}</p></section>
    </div>
  </div>
  <div class="panel" id="p-pris" hidden>
    <section class="card">
      <div class="row"><h2>${tr("De næste dage", "The coming days")}</h2><div class="chips" id="view" role="group" aria-label="${tr("Visning", "View")}"><button data-v="fan" class="on">${tr("Udsigt", "Outlook")}</button><button data-v="paths">${tr("Mulige forløb", "Ways it may go")}</button><button data-v="prob">${tr("Sandsynlighed", "Probability")}</button></div></div>
      <div class="wk" id="wk-pris" aria-label="${tr("Elpris og prognose time for time", "Price and forecast hour by hour")}"></div>
      <div class="note" id="fc-none" hidden>${tr("Prissensoren har ingen prognose ud over de offentliggjorte priser, så usikkerheden kan ikke vises her.", "The price sensor has no forecast past the published prices, so the uncertainty cannot be shown here.")}</div>
      <p class="small" id="view-t"></p>
    </section>
    <div class="two">
      <section class="card"><h2>${tr("Hvor godt rammer prognosen?", "How well does the forecast hit?")}</h2><p class="small">${tr("Målt mod de rigtige priser, efter hvor langt frem den så. Det er denne fejl, sandsynligheden regnes ud fra.", "Measured against the real prices, by how far ahead it looked. The probability is worked out from this error.")}</p><div id="acc"></div></section>
      <section class="card"><h2>${tr("Prisens døgnrytme", "The price's rhythm")}</h2><p class="small">${tr("Lært af de gemte priser: hvornår på ugen strømmen plejer at være billigst (grøn) og dyrest (rød).", "Learned from the kept prices: when in the week power tends to be cheapest (green) and dearest (red).")}</p><div id="rhythm" style="position:relative"></div></section>
    </div>
  </div>
  <div class="panel" id="p-lad" hidden>
    <section class="card"><div class="kpis" id="kpi-lad"></div></section>
    <section class="card"><div class="row"><h2>${tr("Hvor strømmen kom fra, og hvad den blev til", "Where the power came from, and what it became")}</h2><span class="demo">${tr("kWh på 90 dage", "kWh in 90 days")}</span></div><div class="scroll"><div id="flow" style="min-width:560px"></div></div></section>
    <div class="two">
      <section class="card"><div class="row"><h2>${tr("Hvornår der lades", "When they charge")}</h2><span class="demo">${tr("kWh pr. klokketime", "kWh by hour of the day")}</span></div><div id="when" style="max-width:340px;margin:0 auto;width:100%"></div><p class="small" id="when-t"></p></section>
      <section class="card"><div class="row"><h2>${tr("Hver ladning", "Every charge")}</h2><span class="demo">${tr("højde: pris betalt · størrelse: kWh", "height: price paid · size: kWh")}</span></div><div id="sessions" style="position:relative"></div><div class="legend" id="sess-l"></div></section>
    </div>
    <section class="card"><div class="row"><h2>${tr("Hver ladning, som i Historik", "Every charge, as in History")}</h2><div class="chips"><button data-open="history">${tr("Eksportér CSV", "Export CSV")}</button><button data-open="history">${tr("Vælg og slet", "Choose and delete")}</button></div></div>
      <div class="scroll" id="hist"></div><p class="small">${tr("Listen, eksporten, sletningen og gæstens regning er de samme som før. Knapperne åbner dem.", "The list, the export, deleting and the guest's bill are as before. The buttons open them.")}</p></section>
  </div>
  <div class="panel" id="p-laer" hidden>
    <section class="card"><div class="row"><h2>${tr("Det har systemet lært", "This is what it has learned")}</h2><span class="demo">${tr("ringen viser, hvor moden hver model er", "the ring shows how ripe each model is")}</span></div><div id="models"></div></section>
    <div class="two">
      <section class="card"><div class="row"><h2>${tr("Afgangstider, dag for dag", "Departures, day by day")}</h2><div class="chips" id="carsel2" role="group" aria-label="${tr("Bil", "Car")}"></div></div><div id="ridge"></div><p class="small">${tr("Hver bølge er en ugedag. Smal og høj betyder fast rytme, bred og flad betyder, at dagen er svær at forudsige.", "Each wave is a weekday. Narrow and tall is a steady rhythm; wide and flat is a day that is hard to foresee.")}</p></section>
      <section class="card"><div class="row"><h2>${tr("Kulde koster", "Cold costs")}</h2><span class="demo">${tr("kWh pr. 100 km mod temperatur", "kWh per 100 km against temperature")}</span></div><div id="cold"></div><p class="small" id="cold-t"></p></section>
    </div>
    <section class="card"><div class="row"><h2>${tr("Loggen slettes, det lærte bliver", "The log goes, what is learned stays")}</h2><span class="demo">${tr("90 dage ind, mønstre ud", "90 days in, patterns out")}</span></div><div class="scroll"><div id="conveyor" style="min-width:560px"></div></div>
      <div class="two" style="gap:10px"><p class="small"><b style="color:var(--ink)">${tr("Slettes efter 90 dage:", "Gone after 90 days:")}</b> ${tr("hver enkelt tur med tid, sted, forbrug, batteri og temperatur.", "each trip with its time, place, use, battery and temperature.")}</p><p class="small"><b style="color:var(--ink)">${tr("Bliver:", "Stays:")}</b> ${tr("dagens tal uden steder (km, kWh og temperatur) og elpriserne i to år, og de mønstre der læres af dem.", "each day's figures without places (km, kWh and temperature) and the prices for two years, and the patterns learned from them.")}</p></div>
    </section>
    <section class="card"><div class="row"><h2>${tr("Lært om selve opladningen", "Learned about the charging itself")}</h2><div class="chips"><button data-open="learned">${tr("Se alt lært", "See all that is learned")}</button></div></div><div class="chk" id="learned"></div></section>
  </div>
  <div class="panel" id="p-forud" hidden>
    <section class="card"><div class="row"><h2>${tr("Sagt og sket: forbrug de sidste 30 dage", "Said and done: use in the last 30 days")}</h2><span class="demo" id="bt-t"></span></div><div class="scroll"><div id="backtest" style="position:relative;min-width:640px"></div></div><p class="small">${tr("Båndet er, hvad systemet dagen før sagde, bilen ville bruge (8 af 10 gange). Prikken er, hvad den brugte. Røde prikker faldt udenfor.", "The band is what it said the day before the car would use (8 times of 10). The dot is what it used. Red dots fell outside.")}</p></section>
    <div class="two">
      <section class="card"><h2>${tr("Holder sandsynligheden, hvad den lover?", "Does the probability keep its word?")}</h2><p class="small">${tr("Når systemet siger 80 %, skal det ske cirka 8 af 10 gange. Søjlen er, hvor ofte det skete; stregen er, hvad der blev lovet.", "When it says 80 %, it should happen about 8 times of 10. The bar is how often it did; the line is what was promised.")}</p><div id="calib"></div></section>
      <section class="card">
        <h2>${tr("Vent, eller lad på de kendte priser?", "Wait, or charge at the known prices?")}</h2>
        <div class="dial"><svg viewBox="0 0 132 132" role="img" aria-label="${tr("Sandsynlighed", "Probability")}"><circle class="track" cx="66" cy="66" r="54"/><circle id="dialv" class="val" cx="66" cy="66" r="54" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 66 66)"/><line id="dialm" class="mark" x1="66" y1="2" x2="66" y2="22"/><text id="dialt" class="big" x="66" y="75" text-anchor="middle" style="font-size:26px;fill:var(--ink)">0 %</text></svg>
          <div style="display:grid;gap:6px"><p class="verdict" id="verdict"></p><p class="small" id="why" style="display:block;background:none;padding:0"></p></div></div>
        <label class="slide"><span>${tr("En svær dag er en, som", "A hard day is one that")} <b id="lvl-t"></b> ${tr("af dagene ligger under", "of the days stay under")}</span><input type="range" id="lvl" min="50" max="95" step="5" value="90"></label>
      </section>
    </div>
    <section class="card"><div class="row"><h2>${tr("Skyggeregnskabet", "The shadow ledger")}</h2><span class="demo">${tr("hvad forudsigelserne ville have gjort", "what the predictions would have done")}</span></div><div class="scroll"><div id="ledger" style="position:relative;min-width:640px"></div></div><div class="ready"><i id="ready" style="width:0%"></i></div><p class="hero" id="ledger-t" style="font-size:clamp(17px,2.6vw,21px)"></p><p class="small">${tr("Regnskabet kører altid i baggrunden, når Indsigt er slået til. Hver aften gemmes, hvad der forventes, og bagefter sammenlignes med de rigtige priser og det rigtige forbrug.", "The ledger always runs in the background while Insight is on. Each evening what is expected is kept, and afterwards it is held against the real prices and the real use.")}</p></section>
  </div>
</div>`;
    root.innerHTML = `<style>${CSS}</style>${HTML}`;
    wrap = $(".wrap");
    for (const k of Object.keys(charts)) delete charts[k];
    tlS.left = null;
    // Explanations stay out of the way: a "?" on the card opens them.
    for (const card of $$(".card")) {
      if (!$("p.small", card)) continue;
      const head = $("h2", card) || $(".tag", card) || $(".hero", card);
      if (!head) continue;
      const b = document.createElement("button"); b.className = "q"; b.type = "button"; b.textContent = "?"; b.setAttribute("aria-label", tr("Forklaring", "Explanation")); b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", (ev) => { ev.stopPropagation(); const open = card.classList.toggle("help-open"); b.setAttribute("aria-expanded", String(open)); });
      head.appendChild(b);
    }
    $("#lvl").addEventListener("change", (ev) => say("level", +ev.target.value));
    $("#lvl").addEventListener("input", (ev) => { $("#lvl-t").textContent = `${ev.target.value} %`; });
  }

  /* ---------- the week chart: the prices ahead three ways */
  const viewText = () => ({ fan: tr("Udsigt: prognosen med bånd for 50 % og 80 % af udfaldene. Træk i den røde linje for at sætte en pris, og peg på en time.", "Outlook: the forecast with bands for 50 % and 80 % of the outcomes. Drag the red line to set a price, and point at an hour."), paths: tr("Mulige forløb: 500 uger, der kunne ske, flyder ud fra nu. Tæt strøm er sikker, bred strøm er usikker. Grønne prikker er under den røde linje.", "Ways it may go: 500 weeks that could happen, flowing out from now. A tight stream is sure, a wide one unsure. Green dots are under the red line."), prob: tr("Sandsynlighed: søjlerne viser chancen, time for time, for at prisen kommer under den røde linje. Træk i linjen, og se søjlerne flytte sig.", "Probability: the bars show the chance, hour by hour, of the price coming under the red line. Drag the line and watch the bars move.") })[S.view];
  const sample = (rr) => { const shift = Array.from({ length: 9 }, () => gauss(rr)); let e = 0; return price.map((p, i) => { if (i < K) return p; e = 0.75 * e + 0.66 * gauss(rr); return Math.max(0, p + sigma[i] * (0.72 * shift[Math.min(8, dayOf(i))] + 0.69 * e)); }); };
  function weekChart(id, o) {
    const el = $(id), st = (charts[id] ||= { first: true, drag: false, parts: [], geo: null });
    if (H < 2) { el.innerHTML = `<p class="note">${tr("Prissensoren har ingen priser lige nu.", "The price sensor has no prices right now.")}</p>`; st.geo = null; return; }
    const W = Math.max(320, el.clientWidth), small = W < 560, Top = 14, PH = small ? 190 : 250, Hh = Top + PH + 24, Lx = 34, R = small ? 10 : 34;
    const max = Math.max(...price.map((p, i) => p + 1.35 * sigma[i])) * 1.08, step = nice(max);
    const x = (i) => Lx + (i / (H - 1)) * (W - Lx - R), y = (v) => Top + (1 - clamp(v, 0, max) / max) * PH, cw = (W - Lx - R) / (H - 1);
    st.geo = { W, Hh, L: Lx, R, x, y, max, Top, PH };
    const line = (from, to, f) => { let s = ""; for (let i = from; i <= to; i += 1) s += `${i === from ? "M" : "L"}${x(i).toFixed(1)} ${y(f(i)).toFixed(1)}`; return s; };
    const k0 = Math.max(0, K - 1);
    const area = (z) => { if (K >= H) return ""; let s = ""; for (let i = k0; i < H; i += 1) s += `${i === k0 ? "M" : "L"}${x(i).toFixed(1)} ${y(price[i] + z * sigma[i]).toFixed(1)}`; for (let i = H - 1; i >= k0; i -= 1) s += `L${x(i).toFixed(1)} ${y(Math.max(0, price[i] - z * sigma[i])).toFixed(1)}`; return `${s}Z`; };
    let g = "";
    for (let v = 0; v <= max; v += step) g += `<line class="grid" x1="${Lx}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${Lx - 6}" y="${y(v) + 4}" text-anchor="end">${nf(v, step < 1 ? (step < 0.1 ? 2 : 1) : 0)}</text>`;
    for (let i = 0; i < H; i += 1) { if (hourOf(i) === 0) g += `<line class="grid" x1="${x(i)}" x2="${x(i)}" y1="${Top}" y2="${Hh - 24}"/>`; if (hourOf(i) === 12) g += `<text x="${x(i)}" y="${Hh - 8}" text-anchor="middle">${WD[wdOf(i)]}</text>`; }
    let body = "";
    if (o.view === "fan" && K < H) body = `<g class="${st.first ? "fan" : ""}"><path class="band80" d="${area(1.2816)}"/><path class="band50" d="${area(0.6745)}"/></g>`;
    if (o.view === "prob") for (let i = 0; i < H; i += 1) { const p = sigma[i] ? phi((S.T - price[i]) / sigma[i]) : price[i] <= S.T ? 1 : 0; body += `<rect class="pbar" x="${x(i) - cw / 2}" width="${cw + 0.4}" y="${Top + (1 - p) * PH}" height="${p * PH}"/>`; }
    const dim = o.view === "prob" ? ' style="opacity:.35"' : "", anim = st.first ? " draw" : "";
    const keep = el.querySelector("canvas") || document.createElement("canvas");
    el.innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" role="img"><g>${g}<text x="${Lx - 6}" y="${Top - 4}" text-anchor="end">${esc(IN.unit || "")}</text></g>${body}
      <g${dim}>${K < H ? `<path class="median${anim}" ${st.first ? 'pathLength="1" style="stroke-dasharray:1;animation-delay:.4s"' : ""} d="${line(k0, H - 1, (i) => price[i])}"/>` : ""}<path class="known${anim}" ${st.first ? 'pathLength="1"' : ""} d="${line(0, K >= H ? H - 1 : k0, (i) => price[i])}"/></g>
      ${K < H ? `<line class="now" x1="${x(k0)}" x2="${x(k0)}" y1="${Top}" y2="${Top + PH}"/><text x="${x(k0) + 4}" y="${Top + PH - 5}">${tr("prognose", "forecast")} →</text>` : ""}
      ${o.threshold ? `<line class="tline" x1="${Lx}" x2="${W - R}" y1="${y(S.T)}" y2="${y(S.T)}"/><g><rect class="thandle" x="${W - R - 70}" y="${y(S.T) - 11}" width="70" height="22" rx="11"/><text class="thandle-t" x="${W - R - 35}" y="${y(S.T) + 4}" text-anchor="middle">${esc(money(S.T))}</text></g>` : ""}
      <line class="scrub" data-scrub y1="${Top}" y2="${Hh - 24}" x1="-99" x2="-99" style="opacity:0"/></svg><div class="tip" hidden></div>`;
    el.insertBefore(keep, el.firstChild); keep.style.visibility = o.view === "paths" ? "visible" : "hidden";
    st.first = false; st.o = o;
    if (!st.wired) {
      st.wired = true;
      const at = (ev) => { const b = el.getBoundingClientRect(), gg = st.geo, px = ((ev.clientX - b.left) / b.width) * gg.W, py = ((ev.clientY - b.top) / b.width) * gg.W; return { py, i: clamp(Math.round(((px - gg.L) / (gg.W - gg.L - gg.R)) * (H - 1)), 0, H - 1) }; };
      el.addEventListener("pointerdown", (ev) => { if (!st.geo) return; const { py } = at(ev), gg = st.geo; if (st.o.threshold && Math.abs(py - gg.y(S.T)) < 16) { st.drag = true; el.setPointerCapture(ev.pointerId); el.style.touchAction = "none"; } });
      el.addEventListener("pointermove", (ev) => {
        if (!st.geo) return;
        const { py, i } = at(ev), gg = st.geo;
        if (st.drag) { const unit = gg.max > 5 ? 0.1 : gg.max > 0.6 ? 0.05 : 0.005; S.T = Math.round(clamp((1 - (py - gg.Top) / gg.PH) * gg.max, gg.max * 0.03, gg.max * 0.97) / unit) * unit; render(true); return; }
        if (ev.pointerType === "touch" && !ev.buttons) return;
        const t = $(".tip", el), s = $("[data-scrub]", el); if (!t || !s) return; s.setAttribute("x1", gg.x(i)); s.setAttribute("x2", gg.x(i)); s.style.opacity = ""; t.hidden = false;
        t.style.left = `${clamp(gg.x(i), 100, el.clientWidth - 100)}px`; t.style.top = `${Math.max(gg.Top + 46, gg.y(price[i] + 1.3 * sigma[i]) - 8)}px`;
        const p = sigma[i] ? phi((S.T - price[i]) / sigma[i]) * 100 : price[i] <= S.T ? 100 : 0;
        t.innerHTML = `${label(i)}<br><b>${esc(money(price[i]))}</b> · ${sigma[i] ? `${tr("8 af 10 gange", "8 times of 10")} ${kr(Math.max(0, price[i] - 1.2816 * sigma[i]))}–${kr(price[i] + 1.2816 * sigma[i])}` : tr("kendt pris", "known price")}${st.o.threshold ? `<br>${tr("Under", "Under")} ${esc(money(S.T))}: <b>${p.toFixed(0)} %</b>` : ""}`;
      });
      const up = () => { st.drag = false; el.style.touchAction = ""; };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
      el.addEventListener("pointerleave", () => { const t = $(".tip", el); if (t && !st.drag) t.hidden = true; });
    }
  }
  // The river of possible weeks: each dot follows one way the prices may go.
  function river() {
    raf = 0;
    const st = charts["#wk-pris"], c = st && $("#wk-pris canvas");
    if (!host.isConnected || !c || !st.geo || S.tab !== "lad" || S.view !== "paths" || K >= H) return;
    const gg = st.geo, dpr = Math.min(2, devicePixelRatio || 1);
    if (c.width !== Math.round(gg.W * dpr) || c.height !== Math.round(gg.Hh * dpr)) { c.width = Math.round(gg.W * dpr); c.height = Math.round(gg.Hh * dpr); }
    if (!st.parts.length || st.partsFor !== price) { const rr = rng(900); st.partsFor = price; st.parts = Array.from({ length: 500 }, () => ({ path: sample(rr), t: K - 1 + rr() * (H - K), v: 0.16 + rr() * 0.2 })); }
    c.style.height = `${gg.Hh}px`;
    const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(0, 0, gg.W, gg.Hh); g.globalCompositeOperation = "source-over";
    const [low, mid, high] = [css("--accent"), css("--fc"), css("--bad")]; g.globalAlpha = 0.7;
    for (const p of st.parts) { p.t += p.v; if (p.t >= H - 1) p.t = Math.max(0, K - 1); const i = Math.floor(p.t), f = p.t - i, v = p.path[i] + ((p.path[i + 1] ?? p.path[i]) - p.path[i]) * f; g.fillStyle = v <= S.T ? low : v > S.T + gg.max * 0.27 ? high : mid; g.fillRect(gg.x(p.t), gg.y(v), 1.7, 1.7); }
    g.globalAlpha = 1;
    if (still) return;
    raf = requestAnimationFrame(river);
  }

  /* ---------- small helpers for the other pictures */
  const tipOn = (el, sel, text) => {
    let t = $(".tip", el); if (!t) { t = document.createElement("div"); t.className = "tip"; t.hidden = true; el.appendChild(t); }
    el.onpointermove = (ev) => { const hit = ev.target.closest(sel); if (!hit) { t.hidden = true; return; } const b = el.getBoundingClientRect(); t.hidden = false; t.innerHTML = text(hit); t.style.left = `${clamp(ev.clientX - b.left, 90, Math.max(90, b.width - 90))}px`; t.style.top = `${ev.clientY - b.top - 12}px`; };
    el.onpointerleave = () => (t.hidden = true);
  };
  const countUp = (el, to, fmt) => { if (!el) return; if (still || wrap.classList.contains("calm") || !Number.isFinite(to)) { el.textContent = fmt(to); return; } const t0 = performance.now(); const tick = (now) => { const k = Math.min(1, (now - t0) / 900); el.textContent = fmt(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
  const kpis = (id, items) => { $(id).innerHTML = items.map((k, n) => `<div class="kpi"><small>${k[0]}</small><b data-n="${n}">${k[2](0)}</b><span>${k[3] || ""}</span></div>`).join(""); items.forEach((k, n) => countUp($(`${id} [data-n="${n}"]`), k[1], k[2])); };
  const none = (text) => `<p class="note">${text}</p>`;
  // A wide chart scrolls sideways; a line of text in its place does not need the width.
  const empty = (sel, text) => { const el = $(sel); if (el.dataset.mw == null) el.dataset.mw = el.style.minWidth; el.style.minWidth = "0"; el.innerHTML = none(text); };
  const wide = (sel) => { const el = $(sel); if (el.dataset.mw != null) el.style.minWidth = el.dataset.mw; return el; };
  const carChips = (sel) => { const el = $(sel); if (el) el.innerHTML = ids.length > 1 ? ids.map((k) => `<button data-car="${esc(k)}" class="${k === S.car ? "on" : ""}">${esc(CARS[k].name)}</button>`).join("") : ""; };

  /* ---------- Overview: tonight, in a picture */
  function hero() {
    const el = $("#hero"), tn = DATA.tonight || {}, groups = tn.groups || [];
    const g = groups.find((x) => (x.cars || []).length > 1) || groups[0] || {};
    const list = ((g.cars && g.cars.length ? g.cars : ids) || []).filter((id) => CARS[id]);
    const shown = list.slice(0, 2), pick = CARS[g.pick] ? g.pick : null, [w0, w1] = IN.window || [21, 7];
    const info = (id) => { const c = CARS[id], o = (tn.cars || {})[id] || {}, lvl = TL.cars[id].level; return { c, o, lvl, plugged: c.live.connected === true, charging: c.live.charging === true }; };
    const other = list.filter((id) => id !== pick).map(info);
    const p = pick ? info(pick) : null;
    const nights = (n) => (n === 1 ? tr("1 nat", "1 night") : `${n} ${tr("nætter", "nights")}`);
    // What happens, in one line.
    let head, sub;
    const why = { needed: tr("Den har ikke nok til en svær dag i morgen.", "It does not have enough for a hard day tomorrow."), soonest: tr("Den rammer bunden først.", "It reaches its floor first."), apart: tr("Så skal bilerne ikke lade samme nat senere.", "Then the cars will not need the same night later."), cheaper: tr(`En billigere nat er ${Math.round((g.chance || 0) * 100)} % sandsynlig.`, `A cheaper night is ${Math.round((g.chance || 0) * 100)} % likely.`), full: tr("Batterierne er fyldt til det, I har bedt om.", "The batteries are filled to what you asked for."), learning: tr("Der skal mindst 28 dages kørsel til, før der anbefales noget.", "It takes at least 28 days of driving before anything is recommended.") }[g.reason] || "";
    if (p && p.plugged) head = tr(`<em>${esc(p.c.name)}</em> sidder i og får laderen i nat.`, `<em>${esc(p.c.name)}</em> is plugged in and has the charger tonight.`);
    else if (p) head = tr(`Sæt <em>${esc(p.c.name)}</em> i laderen i aften.`, `Plug in <em>${esc(p.c.name)}</em> this evening.`);
    else if (g.wait) head = tr("Ingen bil behøver laderen i nat. <em>Vent på en billigere nat.</em>", "No car needs the charger tonight. <em>Wait for a cheaper night.</em>");
    else if (g.reason === "learning" || !groups.length) head = tr("Indsigt <em>lærer stadig</em> jeres rytme.", "Insight is <em>still learning</em> your rhythm.");
    else head = tr("Ingen bil behøver laderen i nat.", "No car needs the charger tonight.");
    sub = why;
    if (p && other.length && other[0].o.reach != null) sub += ` ${tr(`${other[0].c.name} kan vente ${nights(other[0].o.reach)}.`, `${other[0].c.name} can wait ${nights(other[0].o.reach)}.`)}`;
    // The picture: the cars filled to their level, the hard day's floor as a mark, and the cable to the one that gets the charger.
    const car = (id, k) => {
      const { c, o, lvl } = info(id), flip = k === 1, x0 = flip ? 249 : 8, pct = clamp(lvl ?? 0, 0, 100), fl = o.floor_pct != null ? clamp(o.floor_pct, 0, 100) : null;
      return `<g transform="translate(${x0} 58) scale(.62)${flip ? " translate(232 0) scale(-1 1)" : ""}"><clipPath id="hc${k}"><path d="${CAR_BODY}"/></clipPath><path class="hbody" d="${CAR_BODY}"/><g clip-path="url(#hc${k})"><rect class="hfill" x="6" y="8" width="${(220 * pct) / 100}" height="72" fill="${c.col}" opacity=".9"/><path class="hwin" d="${CAR_WIN}"/>${fl != null ? `<line class="hfloor" x1="${6 + (220 * fl) / 100}" x2="${6 + (220 * fl) / 100}" y1="8" y2="80"/>` : ""}</g><path class="hline" d="${CAR_BODY}"/><circle class="hwheel" cx="56" cy="76" r="15"/><circle class="hhub" cx="56" cy="76" r="6"/><circle class="hwheel" cx="180" cy="76" r="15"/><circle class="hhub" cx="180" cy="76" r="6"/></g>`;
    };
    const k = pick ? shown.indexOf(pick) : -1, cable = k === 0 ? "M190 84C172 84 168 100 150 96" : k === 1 ? "M210 84C228 84 232 100 250 96" : "M210 84C224 92 224 108 212 114";
    const stars = [[30, 18], [72, 34], [118, 12], [160, 30], [244, 16], [290, 36], [332, 14], [372, 30]].map(([sx, sy], n) => `<circle class="hstar${still ? "" : " hglow"}" style="animation-delay:${n * 0.3}s" cx="${sx}" cy="${sy}" r="1.4"/>`).join("");
    const scene = `<svg viewBox="0 0 400 124" role="img" aria-label="${tr("Biler og lader i aften", "Cars and charger tonight")}">${stars}<path class="hmoon" d="M206 10a11 11 0 1 0 9 17a9 9 0 0 1-9-17Z"/>
      <line class="hground" x1="4" x2="396" y1="116" y2="116"/>${shown.map(car).join("")}
      <rect class="hpost" x="190" y="62" width="20" height="54" rx="6"/><rect class="hscreen${pick && !still ? " hglow" : ""}" x="194" y="67" width="12" height="12" rx="3"/><path class="hbolt" d="M201 69l-4 5h3l-1 4 4-5h-3Z"/>
      <path class="hcable${k >= 0 ? " live" : ""}" d="${cable}"/>${k >= 0 && !still ? `<path class="hdash" d="${cable}"/>` : ""}</svg>`;
    const tell = (id, kk) => { const { c, o, lvl } = info(id), is = id === pick; const note = is ? tr("får laderen i nat", "gets the charger tonight") : o.reach != null ? (o.reach > 0 ? tr(`kan vente ${nights(o.reach)}`, `can wait ${nights(o.reach)}`) : tr("skal også lade i nat", "must also charge tonight")) : tr("lærer stadig", "still learning"); return `<div class="hcar${kk ? " r" : ""}${is ? " pick" : ""}"><strong>${esc(c.name)}</strong><b>${lvl == null ? "–" : `${nf(lvl)} %`}</b><small>${note}</small></div>`; };
    // The night's prices: the hours the plan charges in, or the cheapest three.
    const from = 16, bars = []; for (let n = 0; n < 20; n += 1) { const h = from + n; bars.push({ h, hod: h % 24, p: priceH.get(h) ?? null, fc: fcH.has(h) }); }
    const plan = pick ? TL.cars[pick].plan : [], planned = (h) => plan.some((s) => h + 1 > s.h && h < s.h + s.len);
    const nightBars = bars.filter((b) => b.p != null && inWindow(b.hod) && b.h >= Math.floor(NOWH));
    const cheap = new Set(plan.length ? bars.filter((b) => planned(b.h)).map((b) => b.h) : [...nightBars].sort((a, b) => a.p - b.p).slice(0, 3).map((b) => b.h));
    const ptop = Math.max(0.01, ...bars.map((b) => b.p || 0)), runs = [...cheap].sort((a, b) => a - b), span = runs.length ? `${pad(runs[0] % 24)}–${pad((runs[runs.length - 1] + 1) % 24)}` : null;
    const cheapP = runs.length ? mean(runs.map((h) => priceH.get(h)).filter((v) => v != null)) : null;
    const rib = bars.some((b) => b.p != null) ? `<div class="hrib"><div class="row"><span>${tr("Nattens priser", "Tonight's prices")}</span>${span ? `<span>${plan.length ? tr("lader", "charges") : tr("billigst", "cheapest")} <b>${tr("kl.", "")} ${span}</b> · ${esc(money(cheapP))}</span>` : ""}</div>
      <svg viewBox="0 0 400 62" role="img" aria-label="${tr("Nattens priser", "Tonight's prices")}">${bars.map((b, n) => { if (b.p == null) return ""; const hh = Math.max(3, (b.p / ptop) * 40), on = cheap.has(b.h); return `<rect class="${st0() ? "grow" : ""}" style="animation-delay:${n * 25}ms" x="${n * 20 + 2}" y="${44 - hh}" width="16" height="${hh}" rx="4" fill="${on ? "var(--accent)" : b.fc ? "var(--fc)" : "var(--ink)"}" opacity="${on ? 1 : inWindow(b.hod) ? 0.34 : 0.14}"/>`; }).join("")}
      ${bars.filter((b) => b.hod % 3 === 0).map((b) => `<text x="${(b.h - from) * 20 + 10}" y="59" text-anchor="middle">${pad(b.hod)}</text>`).join("")}
      <line x1="${(mod(w0 - from, 24)) * 20}" x2="${Math.min(400, (mod(w0 - from, 24) + mod(w1 - w0, 24)) * 20)}" y1="47.5" y2="47.5" stroke="var(--ink)" stroke-width="1.5" opacity=".5"/></svg></div>` : "";
    // What to do, in up to three steps.
    const steps = [];
    const lp = pick ? CARS[pick].live.plan : null;
    if (p && !p.plugged) steps.push([tr(`Sæt kablet i ${p.c.name}`, `Plug in ${p.c.name}`), tr(`før kl. ${pad(w0)}`, `before ${pad(w0)}:00`)]);
    if (p && p.plugged) steps.push([tr(`${p.c.name} sidder i`, `${p.c.name} is plugged in`), tr("intet at gøre", "nothing to do")]);
    if (p && span) steps.push([tr(`Lader kl. ${span}`, `Charges ${span}`), lp && lp.energy ? `${nf(lp.energy)} kWh · ${esc(money(lp.cost, 0))}` : tr(`de billigste timer, ${money(cheapP)}`, `the cheapest hours, ${money(cheapP)}`)]);
    if (g.both) steps.push([tr("Begge biler skal lade i nat", "Both cars need tonight"), tr(`lad den anden om dagen, eller byt før kl. ${pad(w0)}`, `charge the other by day, or swap before ${pad(w0)}:00`), true]);
    else if (p && other.length) steps.push([esc(other[0].c.name), other[0].o.reach != null ? tr(`klarer sig ${nights(other[0].o.reach)} endnu`, `is fine for ${nights(other[0].o.reach)} more`) : ""]);
    if (!p && g.wait) steps.push([tr("Lad kablet hænge", "Leave the cable"), tr(`en billigere nat er ${Math.round((g.chance || 0) * 100)} % sandsynlig`, `a cheaper night is ${Math.round((g.chance || 0) * 100)} % likely`)]);
    // The head: this evening, and the night's price against the last nights.
    const ref = night.filter((v) => v != null), tp = tn.price ?? nightOf(0), tier = tp == null || ref.length < 10 ? "" : tp <= q(ref, 0.33) ? "good" : tp >= q(ref, 0.67) ? "bad" : "mid";
    const tierT = { good: tr("en billig nat", "a cheap night"), mid: tr("en almindelig nat", "an ordinary night"), bad: tr("en dyr nat", "a dear night") }[tier] || tr("nattens pris", "the night's price");
    const sp = [...ref.slice(-6), tp].filter((v) => v != null), sptop = Math.max(0.01, ...sp);
    const spark = sp.length > 2 ? `<svg class="hspark" style="width:${sp.length * 8}px" viewBox="0 0 ${sp.length * 8} 28" aria-hidden="true">${sp.map((v, n) => { const hh = Math.max(3, (v / sptop) * 26); return `<rect x="${n * 8 + 1}" y="${28 - hh}" width="5.5" height="${hh}" rx="2.5" class="${n === sp.length - 1 ? tier || "mid" : ""}"/>`; }).join("")}</svg>` : "";
    el.innerHTML = `<div class="hhead"><span class="hbadge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3a9 9 0 1 0 7 14.5A8 8 0 0 1 14 3Z"/><circle cx="5.5" cy="5" r="1"/><circle cx="19" cy="8" r=".8"/></svg></span><div class="hwhen"><b>${tr("I aften", "Tonight")}</b><small>${WDL[TODAY.getDay()]} ${TODAY.getDate()}/${TODAY.getMonth() + 1}</small></div>${tp != null ? `<div class="hprice ${tier}">${spark}<div><b>${esc(money(tp))}</b><small>${tierT}</small></div></div>` : ""}</div>
      <p class="hero">${head}</p>${sub ? `<p class="hsub">${esc(sub)}</p>` : ""}
      <div class="hgrid">${shown.length ? `<div class="hside"><div class="hscene">${scene}</div><div class="hrow">${tell(shown[0], 0)}<div class="hmid">${tr("skift ikke bil", "no swap")}<br>${pad(w0)}–${pad(w1)}</div>${shown[1] ? tell(shown[1], 1) : "<div></div>"}</div></div>` : ""}
      <div class="hside">${rib}${steps.length ? `<div class="hsteps">${steps.map(([a, b, warn], n) => `<div class="hstep${warn ? " warn" : ""}"><i>${warn ? "!" : n + 1}</i><div>${a}<small>${b}</small></div></div>`).join("")}</div>` : ""}</div></div>`;
  }
  const st0 = () => !wrap.classList.contains("calm");

  /* ---------- Overview: the week for the cars, and the timeline */
  function ugeplan() {
    const el = $("#wkp"), P = PLAN;
    if (!P.cars.length) { el.innerHTML = ""; return; }
    const priced = P.nights.filter((n) => n.price != null), best = priced.length > 1 ? priced.reduce((a, b) => (b.price < a.price ? b : a)).n : -1;
    const bolt = '<svg viewBox="0 0 10 14" aria-hidden="true"><path d="M6 0L0 8h4l-1 6 7-9H6Z"/></svg>';
    el.innerHTML = `<div class="wkp-lab"><b></b><i>${esc(IN.unit || "")}</i>${P.cars.map((id) => `<u><s style="background:${CARS[id].col}"></s>${esc(CARS[id].name)}</u>`).join("")}</div>
      ${P.nights.map((n) => `<button class="wkp-col${tlS.day === n.n ? " on" : ""}" data-wkp="${n.n}" aria-pressed="${tlS.day === n.n}"><b>${n.n === 0 ? tr("i nat", "tonight") : WD[n.wd]}</b><i class="${n.n === best ? "best" : ""}${n.fc ? " fc" : ""}">${n.price == null ? "–" : kr(n.price)}</i>${P.cars.map((id) => { const c = P.cells[id][n.n]; return c.level == null ? "<u>–</u>" : `<u class="${c.charge ? "chg" : ""}" style="--c:${CARS[id].col};--l:${clamp(c.level, 0, 100).toFixed(0)}%" title="${esc(CARS[id].name)}: ${c.level.toFixed(0)} %${c.charge ? ` · ${tr("lader", "charges")}` : ""}">${c.charge ? bolt : ""}${c.level.toFixed(0)}</u>`; }).join("")}</button>`).join("")}`;
  }
  function tidslinje() {
    hero(); ugeplan();
    const Z = [1.6, 4.2, 13], w = Z[tlS.z];
    if (!ids.length) { $("#tl").innerHTML = none(tr("Ingen biler endnu.", "No cars yet.")); return; }
    const n = TL.hours.length, W = Math.round(n * w), X = (h) => (h - TL.H0) * w, rows = ids.length;
    const PT = 26, PH = 104, BT = PT + PH + 30, BH = 80, CT = BT + BH + 12, Ht = CT + rows * 10 + 16, pmax = Math.max(0.01, ...TL.hours.map((x) => x.price || 0)) * 1.12, py = (v) => PT + PH - (clamp(v, 0, pmax) / pmax) * PH, by = (v) => BT + BH - (v / 100) * BH;
    const dayDate = (d) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + d), dayName = (d) => { const t = dayDate(d); return `${WD[t.getDay()]} ${t.getDate()}/${t.getMonth() + 1}`; };
    const path = (list, f) => { let d = ""; list.forEach((x, i) => { d += `${i ? "L" : "M"}${X(x.h).toFixed(1)} ${f(x, i).toFixed(1)}`; }); return d; };
    const kn = TL.kn, sig = (h) => (h < kn ? 0 : TL.errors[Math.min(5, Math.floor((h - kn) / 24))] ?? 0.2);
    let g = "";
    for (let d = -21; d < 7; d += 1) { const x = X(d * 24), wd = dayDate(d).getDay(); g += `<rect x="${x}" y="0" width="${24 * w}" height="${Ht}" class="tl-d ${d === tlS.day ? "on" : ""} ${wd === 0 || wd === 6 ? "we" : ""}" data-day="${d}"/>`; if (w * 24 > 34 || wd === 1) g += `<text x="${x + 4}" y="14" class="tl-t">${w * 24 > 60 ? dayName(d) : dayName(d).split(" ")[1]}</text>`; }
    const known = TL.hours.filter((x) => x.price != null && x.h < kn), fut = TL.hours.filter((x) => x.price != null && x.h >= kn - 1);
    if (fut.length > 2) g += `<path class="tl-band" d="${path(fut, (x) => py(x.price * (1 + 1.3 * sig(x.h))))}${[...fut].reverse().map((x) => `L${X(x.h).toFixed(1)} ${py(x.price * (1 - 1.3 * sig(x.h))).toFixed(1)}`).join("")}Z"/>`;
    g += `<path class="tl-p" d="${path(known, (x) => py(x.price))}"/>${fut.length > 1 ? `<path class="tl-pf" d="${path(fut, (x) => py(x.price))}"/>` : ""}`;
    // Each car in its own colour: the level as it was, as it is expected (a typical day and a hard one), its trips and its charging.
    ids.forEach((id, k) => {
      const car = TL.cars[id], col = CARS[id].col;
      const futB = TL.hours.map((x, i) => ({ h: x.h, a: car.exp[i], b: car.hard[i] })).filter((x) => x.a != null);
      if (futB.length > 1) g += `<path class="tl-bband" style="fill:${col};fill-opacity:${rows > 1 ? 0.1 : 0.16}" d="${path(futB, (x) => by(x.a))}${[...futB].reverse().map((x) => `L${X(x.h).toFixed(1)} ${by(x.b).toFixed(1)}`).join("")}Z"/><path class="tl-bf" style="stroke:${col}" d="${path(futB, (x) => by(x.a))}"/>`;
      let last = null; const pts = []; TL.hours.forEach((x, i) => { const v = car.soc[i]; if (v != null) { last = { h: x.h, v }; pts.push(last); } else if (last && x.h < TL.now && x.h - last.h <= 12) pts.push({ h: x.h, v: last.v }); });
      if (pts.length > 1) g += `<path class="tl-b" style="stroke:${col}" d="${path(pts, (x) => by(x.v))}"/>`;
      for (const c of car.charges) g += `<rect x="${X(c.h)}" y="${CT + k * 10}" width="${Math.max(3, c.len * w)}" height="7" rx="3" style="fill:${col}"/>`;
      for (const t of car.trips) g += `<circle cx="${X(t.h)}" cy="${BT - 18 + k * 9}" r="${clamp(1.6 + t.km / 50, 2.2, 6)}" style="fill:${col}"/>`;
      const planned = car.plan.length ? car.plan.map((s) => [Math.max(s.h, TL.now), s.len]) : [];
      PLAN.nights.forEach((nn) => { if (PLAN.cells[id] && PLAN.cells[id][nn.n].charge && !(nn.n === 0 && planned.length)) planned.push([nn.n * 24 + 25, 4]); });
      for (const [h, len] of planned) g += `<rect x="${X(h)}" y="${CT + k * 10}" width="${Math.max(4, len * w)}" height="7" rx="3" class="tl-c plan" style="stroke:${col}"/>`;
    });
    g += `<line x1="${X(TL.now)}" x2="${X(TL.now)}" y1="0" y2="${Ht}" class="tl-now"/><text x="${X(TL.now) + 5}" y="${Ht - 4}" class="tl-t now">${tr("nu", "now")}</text>`;
    const sc = $("#tl-scroll"), keep = sc.dataset.zoom === String(tlS.z) && tlS.left != null ? tlS.left : null;
    $("#tl").innerHTML = `<svg width="${W}" height="${Ht}" style="width:${W}px;height:${Ht}px;max-width:none" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="${tr("Tidslinje", "Timeline")}">${g}</svg>`;
    const go = (h) => { sc.scrollLeft = clamp(X(h) - sc.clientWidth * 0.5, 0, W); };
    if (keep == null) { sc.dataset.zoom = String(tlS.z); if (sc.clientWidth) { go(tlS.at ?? TL.now); tlS.left = sc.scrollLeft; } } else sc.scrollLeft = keep;
    if (!sc.dataset.wired) { sc.dataset.wired = "1"; sc.addEventListener("scroll", () => { if (sc.clientWidth) { tlS.left = sc.scrollLeft; tlS.at = TL.H0 + (sc.scrollLeft + sc.clientWidth * 0.5) / Z[tlS.z]; } }, { passive: true }); }
    $$(".tl-ctl [data-tlz]").forEach((b) => { b.disabled = tlS.z + Number(b.dataset.tlz) < 0 || tlS.z + Number(b.dataset.tlz) > 2; });
    $("#tl-legend").innerHTML = `<span><i></i>${tr("Pris", "Price")}</span><span><i class="f"></i>${tr("Prisprognose", "Price forecast")}</span>${ids.map((id) => `<span><i style="background:${CARS[id].col}"></i>${esc(CARS[id].name)}</span>`).join("")}<span><i class="f" style="background:repeating-linear-gradient(90deg, var(--soft) 0 5px, transparent 5px 8px)"></i>${tr("Forventet", "Expected")}</span><span><i class="dot" style="background:var(--soft)"></i>${tr("Tur", "Trip")}</span><span><i class="b" style="background:var(--soft)"></i>${tr("Ladning", "Charging")}</span>`;
    // The chosen day, for each car.
    const tn = DATA.tonight || {}, d = tlS.day, np = nightOf(d), tnp = nightOf(0), [w0] = IN.window || [21, 7];
    const chance = np != null && tnp != null && d > 0 ? Math.round(100 * phi((tnp - np) / (Math.max(0.03, sig(d * 24 + 24) || 0.1) * np))) : null;
    const nightsT = (k) => (k == null ? "–" : k === 1 ? tr("1 nat", "1 night") : `${k} ${tr("nætter", "nights")}`);
    const facts = ids.map((id) => {
      const car = TL.cars[id], c = CARS[id], name = `<s style="background:${c.col}"></s>${esc(c.name)}`, cell = PLAN.cells[id] && PLAN.cells[id][d];
      if (d > 0) { const wk = c.week[mod(dayDate(d).getDay() + 6, 7)] || {}; return [name, c.week.length ? `${nf(wk.p50)} kWh` : "–", `${tr("svær dag", "a hard day")} ${nf(wk.p90)} kWh${cell && cell.charge ? ` · ${tr("lader natten efter", "charges that night")}` : ""}`]; }
      if (d === 0) { const o = (tn.cars || {})[id] || {}, grp = (tn.groups || []).find((x) => (x.cars || []).includes(id)) || {}; return [name, car.level == null ? "–" : `${nf(car.level)} %`, grp.pick === id ? tr("får laderen i nat", "gets the charger tonight") : o.reach != null ? `${tr("kan vente", "can wait")} ${nightsT(o.reach)}` : ""]; }
      const dt = car.trips.filter((t) => Math.floor(t.h / 24) === d), ch = car.charges.filter((x) => Math.floor(x.h / 24) === d);
      return [name, `${nf(sum(dt, (t) => t.km))} km`, `${nf(sum(dt, (t) => t.kwh), 1)} kWh ${tr("brugt", "used")}${ch.length ? ` · ${tr("ladet", "charged")} ${nf(sum(ch, (x) => x.kwh), 1)} kWh` : ""}`];
    });
    facts.push([tr("Nattens pris", "The night's price"), money(np ?? (d === 0 ? tn.price : null)), np == null ? "" : d * 24 + w0 >= kn ? tr("prognose", "forecast") : d >= 0 ? tr("kendt", "known") : ""]);
    if (d > 0) facts.push([tr("Billigere end i nat", "Cheaper than tonight"), chance == null ? "–" : `${clamp(chance, 1, 99)} %`, tr("sandsynlighed", "probability")]);
    $("#tl-day").innerHTML = `<b>${d === 0 ? tr("I dag", "Today") : `${WDL[dayDate(d).getDay()]} ${dayDate(d).getDate()}/${dayDate(d).getMonth() + 1}`}</b><div class="kpis">${facts.map(([a, v, c]) => `<div class="kpi"><small>${a}</small><b style="font-size:19px">${v}</b><span>${c}</span></div>`).join("")}</div>`;
    // Three answers.
    const all = charges.filter((c) => c.h >= TL.H0 && c.price != null), kwh = sum(all, (c) => c.kwh), cost = sum(all, (c) => c.kwh * c.price);
    const nightK = sum(charges.filter((c) => c.h >= TL.H0).flatMap((c) => c.hours), ([h, k]) => (inWindow(mod(h, 24)) ? k : 0)), allK = sum(charges.filter((c) => c.h >= TL.H0), (c) => c.kwh);
    const back = ids.flatMap((id) => CARS[id].detail.backtest || []), hits = back.filter((r) => r.actual <= r.p90 + 0.05).length;
    const g0 = (tn.groups || []).find((x) => (x.cars || []).length > 1) || (tn.groups || [])[0] || {};
    const three = [["aften", tr("I aften", "Tonight"), g0.pick && CARS[g0.pick] ? tr(`${esc(CARS[g0.pick].name)} skal have laderen`, `${esc(CARS[g0.pick].name)} should have the charger`) : g0.wait ? tr("Vent på en billigere nat", "Wait for a cheaper night") : tr("Ingen behøver laderen", "No car needs the charger"), { needed: tr("har ikke nok til en svær dag", "not enough for a hard day"), soonest: tr("den rammer bunden først", "it reaches its floor first"), apart: tr("så de ikke mødes ved laderen", "so they do not meet at the charger"), cheaper: tr(`${Math.round((g0.chance || 0) * 100)} % chance for billigere`, `${Math.round((g0.chance || 0) * 100)} % chance of cheaper`), full: tr("batterierne er fyldt", "the batteries are full"), learning: tr("lærer stadig", "still learning") }[g0.reason] || "", 1],
      ["kost", tr("Hvad har det kostet?", "What has it cost?"), kwh ? money(cost, 0) : "–", kwh ? `${nf(kwh)} kWh ${tr("på 3 uger", "in 3 weeks")} · ${money(cost / kwh)}/kWh` : tr("ingen ladning set de sidste 3 uger", "no charging seen in the last 3 weeks"), allK ? nightK / allK : 0],
      ["kender", tr("Hvor godt kender den jer?", "How well does it know you?"), back.length ? `${Math.round((hits / back.length) * 100)} %` : "–", back.length ? tr(`ramt rigtigt ${hits} af ${back.length} dage`, `right on ${hits} of ${back.length} days`) : tr("lærer stadig", "still learning"), back.length ? hits / back.length : 0]];
    $("#tl-three").innerHTML = three.map(([key, a, v, c, share]) => `<button class="tl-q" data-tlsheet="${key}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="ringt"/><circle cx="18" cy="18" r="15" class="ringv" pathLength="100" stroke-dasharray="${Math.round(clamp(share, 0, 1) * 100)} 100" transform="rotate(-90 18 18)"/></svg><span><small>${a}</small><b>${v}</b><i>${c}</i></span></button>`).join("");
    tlS.go = go;
  }
  const SHEETS = {
    aften: [() => tr("I aften", "Tonight"), () => { const tn = DATA.tonight || {}; return `<div class="chk">${ids.map((id) => { const c = CARS[id], o = (tn.cars || {})[id] || {}, lvl = TL.cars[id].level; return `<div><i class="${o.reach === 0 ? "gap" : ""}">${o.reach === 0 ? "!" : "✓"}</i><div><b>${esc(c.name)}: ${lvl == null ? "–" : `${nf(lvl)} %`} ${tr("i batteriet", "in the battery")}</b><small>${tr("typisk dag", "a typical day")} ${nf(o.p50)} kWh · ${tr("svær dag", "a hard day")} ${nf(o.p90)} kWh · ${tr("kan vente", "can wait")} ${o.reach == null ? "–" : o.reach} ${tr("nætter", "nights")}</small></div></div>`; }).join("")}</div>`; }],
    kost: [() => tr("Hvad har det kostet?", "What has it cost?"), () => { const rows = [...charges].filter((c) => c.h >= TL.H0).sort((a, b) => b.h - a.h).slice(0, 8); return `${rows.length ? `<div class="scroll"><table><tr><th>${tr("Hvornår", "When")}</th><th>${tr("Bil", "Car")}</th><th>kWh</th><th>${tr("Pris pr. kWh", "Price per kWh")}</th><th>${tr("I alt", "Total")}</th></tr>${rows.map((x) => `<tr><td>${WD[dateOf(x.d).getDay()]} ${dm(x.d)} ${tr("kl.", "")} ${pad(x.hour)}</td><td>${esc(CARS[x.car].name)}</td><td>${nf(x.kwh, 1)}</td><td>${x.price == null ? tr("ude", "away") : esc(money(x.price))}</td><td>${x.price == null ? "–" : esc(money(x.kwh * x.price))}</td></tr>`).join("")}</table></div>` : none(tr("Ingen ladning set de sidste 3 uger.", "No charging seen in the last 3 weeks."))}<div class="chips" style="margin-top:10px"><button data-open="history">${tr("Eksportér CSV", "Export CSV")}</button><button data-open="history">${tr("Vælg og slet", "Choose and delete")}</button><button data-open="history">${tr("Gæstens regning", "The guest's bill")}</button></div>`; }],
    kender: [() => tr("Hvor godt kender den jer?", "How well does it know you?"), () => { const sc = DATA.score || {}, row = (ok, a, b) => `<div><i class="${ok ? "" : "gap"}">${ok ? "✓" : "!"}</i><div><b>${a}</b><small>${b}</small></div></div>`; const back = ids.flatMap((id) => CARS[id].detail.backtest || []), hits = back.filter((r) => r.actual <= r.p90 + 0.05).length; return `<div class="chk">${ids.map((id) => row(CARS[id].known >= 28, `${tr("Ugens rytme", "The week's rhythm")} · ${esc(CARS[id].name)}`, `${CARS[id].known} ${tr("dage", "days")} · ${CARS[id].known >= 28 ? tr("moden", "ripe") : tr("moden efter 28", "ripe after 28")}`)).join("")}${ids.filter((id) => CARS[id].cold > 0).map((id) => row(true, `${tr("Kuldens pris", "The cost of cold")} · ${esc(CARS[id].name)}`, `+${nf(CARS[id].cold * 100, 1)} % ${tr("pr. grad under 15 °C", "per degree under 15 °C")}`)).join("")}${(IN.cars || []).filter((v) => Number.isFinite(Number(v.charge_speed)) && v.charge_speed != null).map((v) => row(v.charge_speed_source === "learned", `${tr("Ladehastighed", "Charging speed")} · ${esc(v.name)}`, `${nf(v.charge_speed, 1)} % ${tr("i timen", "an hour")} · ${v.charge_speed_source === "learned" ? tr("målt", "measured") : tr("regnet ud, indtil der er målt", "worked out, until measured")}`)).join("")}${row((DATA.forecasts || 0) >= 14, tr("Prisprognosens fejl", "The forecast's error"), `${DATA.forecasts || 0} ${tr("dage gemt", "days kept")}${(DATA.forecasts || 0) >= 14 ? "" : ` · ${tr("brugbar efter ca. 2 uger", "usable after about 2 weeks")}`}`)}${row(back.length > 0, tr("Sagt og sket", "Said and done"), back.length ? tr(`${hits} af ${back.length} dage under den svære dag`, `${hits} of ${back.length} days under the hard day`) : sc.scored ? `${sc.hits}/${sc.scored}` : tr("ingen dage endnu", "no days yet"))}</div>`; }],
  };

  /* ---------- Driving: the real map. Home, the places the car goes to with how often, and the chosen trip's road. */
  let asked = false;
  function kort(c, places, pick, home) {
    const el = $("#map"), W = Math.max(260, el.clientWidth || 320), Hh = Math.round(clamp(W * 0.62, 230, 420)), shown = places.filter((p) => p.pos);
    const sel = pick.place && pick.place.shown ? pick.place.shown : places.find((p) => p.list.includes(pick)) || null;
    if (!S.map || S.map.car !== c.id) {
      // The first look: home and the nearest places, as many as most of the trips go to. A far one now and then is found by zooming out.
      const near = [...shown].sort((a, b) => distKm(a.pos, home) - distKm(b.pos, home)), all = sum(near, (p) => p.count), fit = [home];
      let seen = 0; for (const p of near) { fit.push(p.pos); seen += p.count; if (seen >= all * 0.85) break; }
      let z = 15, box = null;
      for (; z > 3; z -= 1) { const xy = fit.map((p) => merc(p, z)), xs = xy.map((v) => v[0]), ys = xy.map((v) => v[1]); box = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; if (box[1] - box[0] <= W - 110 && box[3] - box[2] <= Hh - 90) break; }
      S.map = { car: c.id, z, ...unmerc((box[0] + box[1]) / 2, (box[2] + box[3]) / 2, z) };
    }
    const z = S.map.z, n = 2 ** z, [cx, cy] = merc(S.map, z), x0 = cx - W / 2, y0 = cy - Hh / 2, P = (p) => { const [x, y] = merc(p, z); return [x - x0, y - y0]; };
    let tiles = "";
    for (let tx = Math.floor(x0 / 256); tx * 256 < x0 + W; tx += 1) for (let ty = Math.floor(y0 / 256); ty * 256 < y0 + Hh; ty += 1) { if (ty < 0 || ty >= n) continue; if (IN.tiles) tiles += `<img alt="" draggable="false" src="${esc(IN.tiles.replace("{z}", z).replace("{x}", mod(tx, n)).replace("{y}", ty))}" style="left:${Math.round(tx * 256 - x0)}px;top:${Math.round(ty * 256 - y0)}px">`; }
    const line = (pts) => pts.map((p, i) => { const [x, y] = P(p); return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }).join("");
    const roads = shown.map((p) => `<path class="hit" data-mp="${places.indexOf(p)}" d="${line(p.route || [home, p.pos])}" fill="none" stroke="${c.col}" stroke-width="${Math.min(8, 2 + Math.sqrt(p.count) * 0.8).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity=".42"/>`).join("");
    const [hx, hy] = P(home);
    const mine = pick.route ? line(pick.route) : sel && sel.pos ? line(sel.route || [home, sel.pos]) : "";
    // Each place's name beside it, on the side with room; where two would lie over each other, the lesser one keeps only its count.
    const taken = [[hx + 10, hy - 9, hx + 14 + HOME.length * 7, hy + 9]], over = (b) => taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    const marks = [...shown].sort((a, b) => (b === sel) - (a === sel) || b.count - a.count).map((p) => {
      const [x, y] = P(p.pos), on = p === sel;
      if (x < -20 || y < -20 || x > W + 20 || y > Hh + 20) return "";
      let text = `${p.name} · ${p.count}×`, side = 0;
      const boxOf = (t, left) => (left ? [x - 13 - t.length * 6.6, y - 9, x - 9, y + 9] : [x + 9, y - 9, x + 13 + t.length * 6.6, y + 9]);
      const tries = [[text, x > W - 130], [text, !(x > W - 130)], [`${p.count}×`, false], [`${p.count}×`, true]].find(([t, left]) => { const b = boxOf(t, left); return b[0] > 2 && b[2] < W - 2 && !over(b); }) || [`${p.count}×`, false];
      [text, side] = tries; taken.push(boxOf(text, side));
      return `<g class="hit" data-mp="${places.indexOf(p)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 7.5 : 6}" fill="${on ? "var(--ink)" : "var(--card)"}" stroke="${on ? "var(--card)" : c.col}" stroke-width="2.5"/><text x="${(x + (side ? -11 : 11)).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${side ? "end" : "start"}">${esc(text)}</text></g>`;
    }).reverse().join("");
    el.innerHTML = `<div class="rmap" style="height:${Hh}px"><div class="rmove"><div class="rtiles">${tiles}</div><svg class="rsvg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" style="width:${W}px;height:${Hh}px" role="img" aria-label="${tr("Kort over turene", "Map of the trips")}">${roads}${mine ? `<path class="${st0() ? "draw" : ""}" pathLength="1" d="${mine}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      <circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="8" fill="var(--ink)" stroke="var(--card)" stroke-width="2.5"/><text x="${(hx + 12).toFixed(1)}" y="${(hy + 4).toFixed(1)}">${esc(HOME)}</text>${marks}</svg></div>
      <div class="tl-ctl"><button data-mz="1" aria-label="${tr("Zoom ind", "Zoom in")}">+</button><button data-mz="-1" aria-label="${tr("Zoom ud", "Zoom out")}">−</button><button data-mz="0" aria-label="${tr("Vis det hele", "Show it all")}">⤢</button></div>
      ${IN.tiles ? '<a class="rattr" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>' : ""}</div>`;
    // Dragged to move, pinched or + and − to zoom; a tap on a place chooses it, with its name ready to be written.
    const box = $(".rmap", el), move = $(".rmove", el), fingers = new Map();
    for (const img of $$(".rtiles img", el)) img.addEventListener("error", () => img.remove());
    let from = null, gap = 0, hit = null;
    const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const again = () => { wrap.classList.add("calm"); biler(); };
    const zoom = (by) => { const next = clamp(S.map.z + by, 3, 18); if (next === S.map.z) return; S.map.z = next; again(); };
    box.addEventListener("pointerdown", (ev) => { if (ev.target.closest("[data-mz], .rattr")) return; fingers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); hit = ev.target.closest("[data-mp]"); if (fingers.size === 1) from = { x: ev.clientX, y: ev.clientY, moved: false }; else { from = null; gap = spread(); move.style.transform = ""; } try { box.setPointerCapture(ev.pointerId); } catch (_err) { /* a pointer that is already gone */ } });
    box.addEventListener("pointermove", (ev) => {
      if (!fingers.has(ev.pointerId)) return;
      fingers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (fingers.size === 2 && gap) { const now = spread(); if (now > gap * 1.5) { fingers.clear(); zoom(1); } else if (now < gap / 1.5) { fingers.clear(); zoom(-1); } return; }
      if (!from) return;
      const dx = ev.clientX - from.x, dy = ev.clientY - from.y;
      if (!from.moved && Math.hypot(dx, dy) < 6) return;
      from.moved = true; box.classList.add("drag"); move.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    const done = (ev) => {
      if (!fingers.has(ev.pointerId)) return;
      fingers.delete(ev.pointerId);
      const was = from; from = null; box.classList.remove("drag");
      if (!was) return;
      if (was.moved) { Object.assign(S.map, unmerc(cx - (ev.clientX - was.x), cy - (ev.clientY - was.y), z)); again(); return; }
      if (hit && ev.type === "pointerup") { const p = places[+hit.dataset.mp]; if (p && p.last) { S.pickTrip = p.last.id; S.naming = !p.last.zone; render(true); } }
    };
    box.addEventListener("pointerup", done); box.addEventListener("pointercancel", done);
    box.addEventListener("click", (ev) => { const b = ev.target.closest("[data-mz]"); if (!b) return; ev.stopPropagation(); if (b.dataset.mz === "0") { S.map = null; again(); } else zoom(Number(b.dataset.mz)); });
  }

  /* ---------- Driving */
  function biler() {
    carChips("#carsel");
    const car = S.car, m = L[car], c = CARS[car];
    if (!c) { $("#sum-bil").innerHTML = none(tr("Ingen biler endnu.", "No cars yet.")); return; }
    const mine = m.mine, long = mine.filter((t) => t.km > 10), km = sum(mine, (t) => t.km), kwh = sum(mine, (t) => t.kwh);
    // 90 days at a glance: how far, week by week, and what a kilometre takes.
    const weeks = Array.from({ length: Math.ceil(N / 7) }, () => 0); for (const t of mine) weeks[Math.min(weeks.length - 1, Math.floor(t.d / 7))] += t.km;
    const wtop = Math.max(1, ...weeks), bwk = 260 / weeks.length, effs = long.map((t) => t.eff), e0 = effs.length ? q(effs, 0.03) : 0, e1 = effs.length ? q(effs, 0.97) : 0, e25 = q(effs, 0.25), e75 = q(effs, 0.75), em = km ? (kwh / km) * 100 : null, ex = (v) => 6 + (e1 > e0 ? clamp((v - e0) / (e1 - e0), 0, 1) : 0.5) * 148;
    $("#sum-bil").innerHTML = `<div class="sumbig"><b id="sum-km">0</b><span>km</span><small>${mine.length} ${tr("ture", "trips")} · ${nf(kwh)} kWh · ${nf(km / N)} km ${tr("om dagen", "a day")}</small></div>
      <div class="sumeff"><b>${nf(em, 1)}</b><span>kWh/100 km</span>${effs.length > 2 ? `<svg viewBox="0 0 160 30" role="img" aria-label="${tr("Lavest til højest", "Lowest to highest")}"><rect x="6" y="6" width="148" height="6" rx="3" fill="var(--well)"/><rect x="${ex(e25)}" y="6" width="${Math.max(2, ex(e75) - ex(e25))}" height="6" rx="3" fill="${c.col}" opacity=".45"/><circle cx="${ex(em)}" cy="9" r="5.5" fill="${c.col}" stroke="var(--card)" stroke-width="2"/><text x="6" y="27">${e0.toFixed(0)}</text><text x="154" y="27" text-anchor="end">${e1.toFixed(0)}</text></svg>` : ""}</div>
      <div class="sumwk" id="sum-wk"><svg viewBox="0 0 260 62" preserveAspectRatio="none" role="img" aria-label="${tr("km pr. uge", "km a week")}">${weeks.map((v, k) => { const hh = Math.max(2, (v / wtop) * 46); return `<rect class="hit grow" style="animation-delay:${k * 30}ms" data-wk="${k}" x="${k * bwk + 2}" y="${48 - hh}" width="${bwk - 4}" height="${hh}" rx="4" fill="${c.col}" opacity="${k === weeks.length - 1 ? 1 : 0.55}"/>`; }).join("")}</svg><small><span>${dm(0)}</span><span>${tr("km pr. uge", "km a week")}</span><span>${tr("nu", "now")}</span></small></div>`;
    countUp($("#sum-km"), km, (v) => Math.round(v).toLocaleString(da ? "da-DK" : "en-GB"));
    tipOn($("#sum-wk"), "[data-wk]", (el) => { const k = +el.dataset.wk; return `${tr("ugen fra", "the week from")} ${dm(k * 7)}<br><b>${nf(weeks[k])} km</b>`; });
    // the map
    const pick = trips[S.pickTrip] && trips[S.pickTrip].car === car ? trips[S.pickTrip] : [...long].sort((a, b) => b.d - a.d || b.dep - a.dep)[0] || mine[mine.length - 1];
    if (!pick) { $("#map").innerHTML = none(tr("Kortet tegnes, når den første tur er set.", "The map is drawn when the first trip is seen.")); $("#trip").innerHTML = ""; $("#trip").hidden = true; }
    else {
      $("#trip").hidden = false;
      const places = c.places || [], located = places.filter((p) => p.pos), homeAt = IN.home && Number.isFinite(IN.home.lat) && Number.isFinite(IN.home.lon) ? IN.home : null;
      if (!IN.tracks && !asked) { asked = true; say("tracks"); }
      if (homeAt && located.length) kort(c, places, pick, homeAt);
      else {
        const edges = {}; for (const t of mine) { const key = [t.from, t.to].sort().join("|"); edges[key] = (edges[key] || 0) + 1; }
        const P = (n) => (PLACES[n] || PLACES[HOME]).map((v, k) => (k ? v * 2.6 + 6 : v * 4.2 + 10)), curve = (a, b) => { const [x1, y1] = P(a), [x2, y2] = P(b), mx = (x1 + x2) / 2 + (y2 - y1) * 0.14, my = (y1 + y2) / 2 - (x2 - x1) * 0.14; return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
        const used = new Set(mine.flatMap((t) => [t.from, t.to]));
        $("#map").innerHTML = `<svg viewBox="0 0 440 250"><path d="M0 190Q90 150 150 200T300 210T440 170V250H0Z" fill="var(--well)"/><path d="M330 0Q350 60 420 70L440 60V0Z" fill="var(--well)"/>
          ${Object.entries(edges).map(([key, n]) => { const [a, b] = key.split("|"); return a === b ? "" : `<path d="${curve(a, b)}" fill="none" stroke="${c.col}" stroke-width="${Math.min(9, 1 + Math.sqrt(n) * 0.9).toFixed(1)}" opacity=".28" stroke-linecap="round"/>`; }).join("")}
          <path id="route" class="draw" pathLength="1" d="${curve(pick.from, pick.to)}" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>
          ${still ? "" : `<circle r="5" fill="${c.col}" stroke="var(--card)" stroke-width="2"><animateMotion dur="2.4s" repeatCount="indefinite" path="${curve(pick.from, pick.to)}"/></circle>`}
          ${[...used].map((n) => { const [px, py] = P(n); return `<circle cx="${px}" cy="${py}" r="${n === HOME ? 7 : 5}" fill="${n === pick.from || n === pick.to ? "var(--ink)" : "var(--card)"}" stroke="var(--ink)" stroke-width="1.5"/><text x="${px}" y="${py - 11}" text-anchor="middle" style="fill:var(--ink);font-weight:500">${esc(n)}</text>`; }).join("")}</svg>`;
      }
      const lost = homeAt && located.length ? places.filter((p) => !p.pos) : [];
      $("#places").innerHTML = lost.length ? `<span class="demo">${tr("Uden sted på kortet:", "Not placed on the map:")}</span>${lost.map((p) => `<button data-place="${places.indexOf(p)}" class="${pick.place && pick.place.shown === p ? "on" : ""}">${esc(p.name)} · ${p.count}×</button>`).join("")}` : "";
      const np = mean(night.filter((v) => v != null));
      // A trip made often can be given a name: it is known by how far it goes.
      const place = pick.place || null, often = place ? (place.shown ? place.shown.count : place.list.length) : 1, typing = S.naming && root.activeElement && root.activeElement.id === "nm-in";
      const naming = pick.zone ? "" : S.naming
        ? `<form class="nm" id="nm"><input id="nm-in" maxlength="30" value="${place && place.custom ? esc(place.name) : ""}" placeholder="${tr("fx Arbejde", "e.g. Work")}" aria-label="${tr("Turens navn", "The trip's name")}"><button class="btn on" type="submit">${tr("Gem", "Save")}</button><button class="btn" type="button" data-name="cancel">${tr("Fortryd", "Cancel")}</button></form>`
        : `<div class="nm"><button class="btn" data-name="open">✎ ${place && place.custom ? tr("Skift navn", "Change the name") : tr("Giv turen et navn", "Name this trip")}</button></div>`;
      // The trip through the 90 days: every time it was driven, out and home, with what it took.
      const ref = place && place.name !== OTHER ? place.shown || place : null;
      const legs = ref ? mine.filter((t) => t.place && (t.place.shown || t.place) === ref) : pick.zone ? mine.filter((t) => t.zone && [t.from, t.to].sort().join("|") === [pick.from, pick.to].sort().join("|")) : [pick];
      let route = "";
      if (legs.length > 1) {
        const lk = sum(legs, (t) => t.km), lw = sum(legs, (t) => t.kwh), le = legs.map((t) => t.eff).filter((v) => v > 0), outs = legs.filter((t) => t.to !== HOME), dep = outs.length ? q(outs.map((t) => t.dep), 0.5) : null;
        const lo = Math.min(...le), hi = Math.max(...le), span = Math.max(1, hi - lo), XR = (d) => 8 + (d / (N - 1)) * 384, YR = (e) => 8 + (1 - (e - lo) / span) * 44, avgE = lk ? (lw / lk) * 100 : mean(le);
        route = `<span class="tag">${tr(`Alle ${legs.length} ture på ruten`, `All ${legs.length} trips on the route`)}</span>
          <div class="facts"><span><b>${often}×</b>${tr("kørt på 90 dage", "driven in 90 days")}</span><span><b>${nf(lw / legs.length, 1)} kWh</b>${tr("i snit pr. tur", "on average a trip")}</span><span><b>${nf(avgE, 1)}</b>${tr("kWh pr. 100 km i snit", "kWh per 100 km on average")}</span><span><b>${nf(lo)}–${nf(hi)}</b>${tr("lavest–højest pr. 100 km", "lowest–highest per 100 km")}</span><span><b>${dep == null ? "–" : `${tr("ca.", "about")} ${pad(Math.floor(dep / 60))}`}</b>${tr("typisk afgang", "usual departure")}</span><span><b>${np ? esc(money((lw / legs.length) * np, 0)) : "–"}</b>${tr("strøm pr. tur, ca.", "power a trip, about")}</span><span><b>${nf(lk)} km</b>${tr("i alt", "in all")}</span><span><b>${nf(lw)} kWh</b>${tr("i alt", "in all")}</span></div>
          <svg class="rhist" viewBox="0 0 400 74" role="img" aria-label="${tr("Forbrug pr. tur gennem 90 dage", "Use per trip through 90 days")}"><line x1="8" x2="392" y1="${YR(avgE).toFixed(1)}" y2="${YR(avgE).toFixed(1)}" stroke="var(--ink)" stroke-dasharray="4 4" opacity=".6"/>${legs.map((t) => `<circle class="hit" data-trip="${t.id}" cx="${XR(t.d).toFixed(1)}" cy="${YR(clamp(t.eff, lo, hi)).toFixed(1)}" r="${t === pick ? 5.5 : 3.6}" fill="${tempCol(t.temp)}" opacity="${t === pick ? 1 : 0.75}" ${t === pick ? 'stroke="var(--ink)" stroke-width="2"' : ""}/>`).join("")}<text x="8" y="72">${dm(0)}</text><text x="200" y="72" text-anchor="middle">${tr("kWh pr. 100 km, tur for tur · farve: temperatur", "kWh per 100 km, trip by trip · colour: temperature")}</text><text x="392" y="72" text-anchor="end">${tr("i går", "yesterday")}</text></svg>
          <span class="tag">${tr("Den valgte tur", "The chosen trip")}</span>`;
      }
      if (!typing) $("#trip").innerHTML = `<div class="row"><h3>${esc(pick.from)} → ${esc(pick.to)}</h3><span class="demo">${WDL[dateOf(pick.d).getDay()]} ${dm(pick.d)}</span></div>${naming}${route}<div class="facts"><span><b>${pick.est ? `${tr("ca.", "about")} ${pad(Math.floor(pick.dep / 60))}` : `${hm(pick.dep)}–${hm(pick.arr)}`}</b>${pick.est ? tr("afgang, på timen", "departure, to the hour") : tr("afgang–ankomst", "departure–arrival")}</span><span><b>${nf(pick.km)} km</b>${pick.est ? tr("fra kilometertælleren", "from the odometer") : `${Math.round(pick.arr - pick.dep)} min`}</span><span><b>${nf(pick.kwh, 1)} kWh</b>${nf(pick.eff, 1)} ${tr("pr. 100 km", "per 100 km")}</span><span><b>${pick.soc0 == null || pick.soc1 == null ? "–" : `${nf(pick.soc0)} → ${nf(pick.soc1)} %`}</b>${tr("batteri", "battery")}</span><span><b>${pick.temp == null ? "–" : `${Math.round(pick.temp) + 0}°`}</b>${tr("ude", "outside")}</span><span><b>${np ? esc(money(pick.kwh * np, 0)) : "–"}</b>${tr("strøm, ca.", "power, about")}</span></div>`;
      S.pickNow = pick.id;
    }
    // per day
    const dd = daily[car], top = Math.max(1, ...dd) * 1.05, X2 = (d) => 40 + (d / N) * 850, Y2 = (v) => 14 + (1 - v / top) * 150, tk = temp.slice(0, N).filter((v) => v != null), t0 = tk.length ? Math.min(...tk) - 1 : 0, t1 = tk.length ? Math.max(...tk) + 1 : 1, YT = (T) => 14 + (1 - (T - t0) / (t1 - t0)) * 150, bw = 850 / N - 1.5;
    let tp = "", pen = false; temp.slice(0, N).forEach((T, d) => { if (T == null) { pen = false; return; } tp += `${pen ? "L" : "M"}${(X2(d) + bw / 2).toFixed(1)} ${YT(T).toFixed(1)}`; pen = true; });
    $("#daily").innerHTML = `<svg viewBox="0 0 900 190">${[0, 0.5, 1].map((k) => `<line class="grid" x1="40" x2="890" y1="${Y2(top * k)}" y2="${Y2(top * k)}"/><text x="34" y="${Y2(top * k) + 4}" text-anchor="end">${(top * k).toFixed(0)}</text>`).join("")}
      ${dd.map((v, d) => `<rect class="hit grow" style="animation-delay:${d * 6}ms" data-d="${d}" x="${X2(d)}" width="${bw}" y="${Y2(v)}" height="${Math.max(0.5, 164 - Y2(v))}" rx="1.5" fill="${c.col}" opacity="${[0, 6].includes(dateOf(d).getDay()) ? 0.45 : 0.85}"/>`).join("")}
      ${tp ? `<path class="draw" pathLength="1" d="${tp}" fill="none" stroke="var(--cold)" stroke-width="1.6"/>` : ""}
      <line x1="40" x2="890" y1="${Y2(mean(dd))}" y2="${Y2(mean(dd))}" stroke="var(--ink)" stroke-dasharray="4 4"/>
      ${[0, 15, 30, 45, 60, 75].map((d) => `<text x="${X2(d)}" y="184" >${dm(d)}</text>`).join("")}</svg>`;
    $("#daily-t").textContent = `${tr("snit", "mean")} ${nf(mean(dd), 1)} kWh (${tr("stiplet", "dashed")}) · ${tr("højest", "highest")} ${nf(Math.max(0, ...dd))} kWh${tp ? ` · ${tr("blå streg: temperatur", "blue line: temperature")}` : ""}`;
    tipOn($("#daily"), "[data-d]", (el) => { const d = +el.dataset.d; return `${WD[dateOf(d).getDay()]} ${dm(d)}<br><b>${nf(dd[d], 1)} kWh</b>${temp[d] == null ? "" : ` · ${temp[d].toFixed(0)}° ${tr("ude", "outside")}`}`; });
    // the week clock
    let s = ""; const order = [1, 2, 3, 4, 5, 6, 0];
    order.forEach((wd, ring) => { const r0 = 46 + ring * 19, r1 = r0 + 17; for (let h = 0; h < 24; h += 1) { const a0 = ((h / 24) * 2 - 0.5) * Math.PI + 0.012, a1 = (((h + 1) / 24) * 2 - 0.5) * Math.PI - 0.012, p = m.awayP[wd][h]; s += `<path class="hit pop" style="animation-delay:${(ring * 24 + h) * 3}ms" data-wd="${wd}" data-h="${h}" d="${arc(200, 200, r0, r1, a0, a1)}" fill="${p > 0.02 ? c.col : "var(--well)"}" opacity="${p > 0.02 ? 0.15 + Math.min(1, p) * 0.85 : 1}"/>`; } });
    for (const h of [0, 6, 12, 18]) { const a = ((h / 24) * 2 - 0.5) * Math.PI; s += `<text x="${200 + 192 * Math.cos(a)}" y="${200 + 192 * Math.sin(a) + 4}" text-anchor="middle">${pad(h)}</text>`; }
    $("#clock").innerHTML = `<svg viewBox="0 0 400 400">${s}<text x="200" y="196" text-anchor="middle" style="font:600 22px 'Space Grotesk',Inter,sans-serif;fill:var(--ink)">${(mean(m.awayP.flat()) * 100).toFixed(0)} %</text><text x="200" y="213" text-anchor="middle">${tr("af tiden ude", "of the time out")}</text></svg>`;
    tipOn($("#clock"), "[data-wd]", (el) => { const wd = +el.dataset.wd, h = +el.dataset.h; return `${WDL[wd]} ${tr("kl.", "")} ${pad(h)}–${pad(h + 1)}<br>${tr("ude", "out")} <b>${(m.awayP[wd][h] * 100).toFixed(0)} %</b> ${tr("af gangene", "of the times")}`; });
    // every trip
    const W = 900, Hh = 300, X = (d) => 40 + (d / (N - 1)) * 850, Y = (min) => 14 + ((min - 300) / (1380 - 300)) * 262;
    let g = ""; for (const h of [6, 9, 12, 15, 18, 21]) g += `<line class="grid" x1="40" x2="890" y1="${Y(h * 60)}" y2="${Y(h * 60)}"/><text x="34" y="${Y(h * 60) + 4}" text-anchor="end">${pad(h)}</text>`;
    for (let d = 0; d < N; d += 15) g += `<text x="${X(d)}" y="${Hh - 4}" text-anchor="middle">${dm(d)}</text>`;
    if (!mine.length) empty("#trips", tr("Ingen ture set endnu.", "No trips seen yet."));
    else wide("#trips").innerHTML = `<svg viewBox="0 0 ${W} ${Hh}">${g}${mine.map((t) => `<circle class="hit" data-trip="${t.id}" cx="${X(t.d).toFixed(1)}" cy="${Y(clamp(t.dep, 300, 1380)).toFixed(1)}" r="${(2 + Math.sqrt(Math.max(0, t.kwh)) * 1.9).toFixed(1)}" fill="${tempCol(t.temp)}" opacity="${S.pickTrip === t.id ? 1 : 0.62}" ${S.pickTrip === t.id ? 'stroke="var(--ink)" stroke-width="2"' : ""}/>`).join("")}</svg>`;
    tipOn($("#trips"), "[data-trip]", (el) => { const t = trips[+el.dataset.trip]; return `${WD[dateOf(t.d).getDay()]} ${dm(t.d)} ${when(t)}<br>${esc(t.from)} → ${esc(t.to)} · <b>${nf(t.kwh, 1)} kWh</b>`; });
  }

  /* ---------- Power: the prices */
  function priser() {
    weekChart("#wk-pris", { view: S.view, threshold: true });
    $("#fc-none").hidden = !(H >= 2 && K >= H);
    $("#view-t").textContent = viewText();
    $$("#view button").forEach((b) => b.classList.toggle("on", b.dataset.v === S.view));
    const err = DATA.errors || [];
    $("#acc").innerHTML = `<svg viewBox="0 0 320 150">${[1, 2, 3, 4, 5, 6].map((d, k) => { const e = err[k] ?? 0.2, hit = clamp(100 - e * 100, 5, 100), w = (hit / 100) * 190; return `<text x="0" y="${k * 23 + 16}">${d} ${d === 1 ? tr("dag", "day") : tr("dage", "days")} ${tr("frem", "ahead")}</text><rect x="84" y="${k * 23 + 6}" width="190" height="12" rx="6" fill="var(--well)"/><rect class="fan" style="animation-delay:${k * 0.08}s" x="84" y="${k * 23 + 6}" width="${w}" height="12" rx="6" fill="var(--fc)"/><text x="${90 + w}" y="${k * 23 + 16}" style="fill:var(--ink);font-weight:600">± ${(e * 100).toFixed(0)} %</text>`; }).join("")}<text x="84" y="148">${tr("typisk afvigelse", "typical miss")} · ${DATA.forecasts || 0} ${tr("dages prognoser gemt", "days of forecasts kept")}</text></svg>`;
    const rh = DATA.rhythm || [], flat = rh.flat().filter((v) => v != null);
    if (!flat.length) { $("#rhythm").innerHTML = none(tr("Ingen priser gemt endnu.", "No prices kept yet.")); return; }
    const lo = Math.min(...flat), hi = Math.max(...flat), cell = 320 / 24;
    $("#rhythm").innerHTML = `<svg viewBox="0 0 356 150">${[1, 2, 3, 4, 5, 6, 0].map((wd, row) => `<text x="0" y="${row * 18 + 13}">${WD[wd]}</text>` + [...Array(24).keys()].map((h) => { const v = (rh[row] || [])[h]; if (v == null) return ""; const k = clamp((v - lo) / (hi - lo || 1), 0, 1); return `<rect class="hit pop" style="animation-delay:${(row * 24 + h) * 3}ms" data-v="${v}" data-l="${WDL[wd]} ${tr("kl.", "")} ${pad(h)}" x="${32 + h * cell}" y="${row * 18 + 2}" width="${cell - 1.5}" height="15" rx="3" fill="color-mix(in srgb, var(--bad) ${(k * 100).toFixed(0)}%, var(--accent))" opacity="${0.35 + Math.abs(k - 0.5) * 1.3}"/>`; }).join("")).join("")}${[0, 6, 12, 18].map((h) => `<text x="${32 + h * cell}" y="142">${pad(h)}</text>`).join("")}</svg>`;
    tipOn($("#rhythm"), "[data-v]", (el) => `${el.dataset.l}<br>${tr("plejer at koste", "tends to cost")} <b>${esc(money(+el.dataset.v))}</b>`);
  }

  /* ---------- Power: the charging */
  function ladning() {
    const list = charges.filter((c) => c.d < N), tot = sum(list, (c) => c.kwh), paidList = list.filter((c) => c.price != null), paidK = sum(paidList, (c) => c.kwh), paid = sum(paidList, (c) => c.kwh * c.price), both = paidList.filter((c) => c.avg != null), market = sum(both, (c) => c.kwh * c.avg), paidB = sum(both, (c) => c.kwh * c.price), home = sum(list.filter((c) => c.where === "home"), (c) => c.kwh);
    kpis("#kpi-lad", [[tr("Ladet på 90 dage", "Charged in 90 days"), tot, (v) => `${v.toFixed(0)} kWh`, `${list.length} ${tr("ladninger", "charges")}`], [tr("Betalt hjemme", "Paid at home"), paid, (v) => money(v, 0), paidK ? `${money(paid / paidK)} ${tr("pr. kWh", "per kWh")}` : ""], [tr("Mod døgnets snitpris", "Against the day's mean"), market ? (1 - paidB / market) * 100 : NaN, (v) => (market ? `${v.toFixed(0)} % ${tr("billigere", "cheaper")}` : "–"), market ? `${tr("sparet", "saved")} ${money(market - paidB, 0)}` : ""], [tr("Hjemme", "At home"), tot ? (home / tot) * 100 : NaN, (v) => (tot ? `${v.toFixed(0)} %` : "–"), tr("resten på lynlader", "the rest at fast chargers")]]);
    if (!list.length) { for (const id of ["#flow", "#when", "#sessions"]) empty(id, tr("Ingen ladning set endnu.", "No charging seen yet.")); $("#when-t").textContent = ""; $("#sess-l").innerHTML = ""; histTable(); return; }
    // the flow: sources → cars → what it became
    const NIGHT = tr("Om natten", "At night"), REST = tr("Øvrige timer", "Other hours"), FAST = tr("Lynlader", "Fast charger"), DRIVE = tr("Kørsel", "Driving"), LOSS = tr("Tab og stilstand", "Loss and standing");
    const src = { [NIGHT]: 0, [REST]: 0, [FAST]: 0 }, to = {}; for (const id of ids) to[id] = { ...src };
    for (const c of list) { if (c.where === "fast") { to[c.car][FAST] += c.kwh; continue; } for (const [h, k] of c.hours) to[c.car][inWindow(mod(h, 24)) ? NIGHT : REST] += k; }
    const carTot = {}, uses = {}; for (const id of ids) { carTot[id] = sum(Object.values(to[id])); const drive = Math.min(carTot[id], sum(daily[id])); uses[id] = { [DRIVE]: drive, [LOSS]: carTot[id] - drive }; }
    const cols = { [NIGHT]: "var(--accent)", [REST]: "var(--fc)", [FAST]: "var(--bad)", [DRIVE]: "var(--ink)", [LOSS]: "var(--faint)" };
    const all = sum(Object.values(carTot)) || 1, scale = 190 / all, stack = (items, x0, gap) => { let y0 = 12; return items.map(([name, v]) => { const o = { name, v, x: x0, y: y0, h: Math.max(2, v * scale), used: 0, used2: 0 }; y0 += o.h + gap; return o; }); };
    const A = stack(Object.keys(src).map((k) => [k, sum(ids, (id) => to[id][k])]).filter((x) => x[1] > 0.5), 120, 10), B = stack(ids.filter((id) => carTot[id] > 0.5).map((id) => [id, carTot[id]]), 330, 34), C = stack([DRIVE, LOSS].map((k) => [k, sum(ids, (id) => uses[id][k])]).filter((x) => x[1] > 0.5), 540, 16);
    const link = (a, b, v, col, aKey = "used", bKey = "used") => { const h = v * scale, y1 = a.y + a[aKey] + h / 2, y2 = b.y + b[bKey] + h / 2; a[aKey] += h; b[bKey] += h; const d = `M${a.x + 12} ${y1}C${(a.x + b.x) / 2 + 6} ${y1} ${(a.x + b.x) / 2 + 6} ${y2} ${b.x} ${y2}`; return h < 0.6 ? "" : `<path class="flow" d="${d}" stroke="${col}" stroke-width="${h}"/>${h > 5 && !still ? `<path class="flowdash" d="${d}"/>` : ""}`; };
    let links = ""; for (const a of A) for (const b of B) links += link(a, b, to[b.name][a.name], cols[a.name]);
    for (const b of B) for (const cc of C) links += link(b, cc, uses[b.name][cc.name], CARS[b.name].col, "used2", "used");
    const box = (o, name, col, side) => `<rect x="${o.x}" y="${o.y}" width="12" height="${o.h}" rx="3" fill="${col}"/><text x="${side < 0 ? o.x - 8 : o.x + 20}" y="${o.y + o.h / 2 - 2}" text-anchor="${side < 0 ? "end" : "start"}" style="fill:var(--ink);font-weight:600;font-size:12px">${esc(name)}</text><text x="${side < 0 ? o.x - 8 : o.x + 20}" y="${o.y + o.h / 2 + 12}" text-anchor="${side < 0 ? "end" : "start"}">${o.v.toFixed(0)} kWh</text>`;
    const bottom = Math.max(...[A, B, C].map((s) => (s.length ? s[s.length - 1].y + s[s.length - 1].h : 0)));
    wide("#flow").innerHTML = `<svg viewBox="0 0 680 ${bottom + 16}">${links}${A.map((a) => box(a, a.name, cols[a.name], -1)).join("")}${B.map((b) => box(b, CARS[b.name].name, CARS[b.name].col, 1)).join("")}${C.map((cc) => box(cc, cc.name, cols[cc.name], 1)).join("")}</svg>`;
    // when
    const byH = Array(24).fill(0); for (const c of list) for (const [h, k] of c.hours) byH[mod(h, 24)] += k;
    const mx = Math.max(0.01, ...byH), nightShare = sum(byH.filter((_, h) => inWindow(h))) / (sum(byH) || 1);
    wide("#when").innerHTML = `<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="52" fill="var(--well)"/>${byH.map((v, h) => { const a0 = ((h / 24) * 2 - 0.5) * Math.PI + 0.02, a1 = (((h + 1) / 24) * 2 - 0.5) * Math.PI - 0.02; return `<path d="${arc(150, 150, 56, 132, a0, a1)}" fill="var(--well)" opacity=".5"/><path class="pop" style="animation-delay:${h * 25}ms" d="${arc(150, 150, 56, 56 + Math.max(1, (v / mx) * 76), a0, a1)}" fill="${inWindow(h) ? "var(--accent)" : "var(--fc)"}"/>`; }).join("")}${[0, 6, 12, 18].map((h) => { const a = ((h / 24) * 2 - 0.5) * Math.PI; return `<text x="${150 + 143 * Math.cos(a)}" y="${150 + 143 * Math.sin(a) + 4}" text-anchor="middle">${pad(h)}</text>`; }).join("")}<text x="150" y="147" text-anchor="middle" style="font:600 20px 'Space Grotesk',Inter,sans-serif;fill:var(--ink)">${(nightShare * 100).toFixed(0)} %</text><text x="150" y="163" text-anchor="middle">${tr("om natten", "at night")}</text></svg>`;
    $("#when-t").textContent = tr(`Mest strøm går i bilerne kl. ${pad(byH.indexOf(Math.max(...byH)))}–${pad((byH.indexOf(Math.max(...byH)) + 1) % 24)}.`, `Most power goes into the cars at ${pad(byH.indexOf(Math.max(...byH)))}–${pad((byH.indexOf(Math.max(...byH)) + 1) % 24)}.`);
    // every session
    const ptop = Math.max(0.01, ...paidList.map((c) => c.price), ...avg.slice(0, N).filter((v) => v != null)) * 1.1, pstep = nice(ptop), X = (d) => 34 + (d / (N - 1)) * 400, Y = (p) => 12 + (1 - clamp(p, 0, ptop) / ptop) * 190;
    let ap = "", pen = false; avg.slice(0, N).forEach((v, d) => { if (v == null) { pen = false; return; } ap += `${pen ? "L" : "M"}${X(d).toFixed(1)} ${Y(v).toFixed(1)}`; pen = true; });
    let grid = ""; for (let v = 0; v <= ptop; v += pstep) grid += `<line class="grid" x1="34" x2="434" y1="${Y(v)}" y2="${Y(v)}"/><text x="28" y="${Y(v) + 4}" text-anchor="end">${nf(v, pstep < 1 ? (pstep < 0.1 ? 2 : 1) : 0)}</text>`;
    wide("#sessions").innerHTML = `<svg viewBox="0 0 444 226">${grid}<path d="${ap}" fill="none" stroke="var(--faint)" stroke-width="1.2"/>
      ${paidList.map((c, n) => `<circle class="hit pop" style="animation-delay:${n * 12}ms" data-c="${n}" cx="${X(c.d).toFixed(1)}" cy="${Y(c.price).toFixed(1)}" r="${(2.5 + Math.sqrt(c.kwh) * 1.25).toFixed(1)}" fill="${CARS[c.car].col}" opacity=".7"/>`).join("")}${[0, 30, 60, 89].map((d) => `<text x="${X(d)}" y="222" text-anchor="middle">${dm(d)}</text>`).join("")}</svg>`;
    $("#sess-l").innerHTML = `${ids.map((id) => `<span><i class="dot" style="background:${CARS[id].col}"></i>${esc(CARS[id].name)}</span>`).join("")}<span><i style="background:var(--faint)"></i>${tr("Dagens snitpris", "The day's mean price")}</span>`;
    tipOn($("#sessions"), "[data-c]", (el) => { const c = paidList[+el.dataset.c]; return `${esc(CARS[c.car].name)} · ${WD[dateOf(c.d).getDay()]} ${dm(c.d)} ${tr("kl.", "")} ${pad(c.hour)}<br><b>${c.kwh.toFixed(0)} kWh</b> ${tr("til", "at")} ${esc(money(c.price))}${c.avg == null ? "" : `<br>${tr("døgnets snit", "the day's mean")} ${esc(money(c.avg))}`}`; });
    histTable();
  }
  function histTable() {
    const rows = (IN.cars || []).flatMap((v) => (v.history || []).map((e) => ({ ...e, name: v.name }))).filter((e) => e.energy > 0).sort((a, b) => b.start - a.start).slice(0, 6);
    const stamp = (ms) => { const t = new Date(ms); return `${WD[t.getDay()]} ${t.getDate()}/${t.getMonth() + 1} ${pad(t.getHours())}.${pad(t.getMinutes())}`; };
    $("#hist").innerHTML = rows.length ? `<table style="min-width:520px"><tr><th>${tr("Hvornår", "When")}</th><th>${tr("Bil", "Car")}</th><th>kWh</th><th>${tr("Pris pr. kWh", "Price per kWh")}</th><th>${tr("I alt", "Total")}</th></tr>${rows.map((e) => `<tr><td>${stamp(e.start)}${e.end ? `–${pad(new Date(e.end).getHours())}.${pad(new Date(e.end).getMinutes())}` : ""}</td><td>${esc(e.name)}</td><td>${nf(e.energy, 1)}</td><td>${e.cost != null && e.energy ? esc(money(e.cost / e.energy)) : "–"}</td><td>${e.cost != null ? esc(money(e.cost)) : "–"}</td></tr>`).join("")}</table>` : none(tr("EV Planner har ikke styret en ladning endnu.", "EV Planner has not run a charge yet."));
  }

  /* ---------- Learned */
  function laering() {
    carChips("#carsel2");
    const least = ids.length ? Math.min(...ids.map((id) => CARS[id].known)) : 0, measured = sum(IN.cars || [], (v) => (v.charge_speed_source === "learned" ? Number(v.charge_speed_learned_from) || 1 : 0));
    const MODELS = [[tr("Køremønster", "Driving pattern"), tr("Hvornår hver bil kører, pr. ugedag og time.", "When each car drives, by weekday and hour."), least, 42, tr("dages data", "days of data")], [tr("Forbrug og temperatur", "Use and temperature"), tr("kWh pr. dag og hvad kulden koster.", "kWh a day and what the cold costs."), least, 56, tr("dages data", "days of data")], [tr("Prisprognosens fejl", "The forecast's error"), tr("Hvor langt prognosen plejer at ligge fra den rigtige pris.", "How far the forecast tends to be from the real price."), DATA.forecasts || 0, 30, tr("dages prognoser", "days of forecasts")], [tr("Ladehastighed og tab", "Charging speed and loss"), tr("Hvad laderen faktisk giver, og hvad der går tabt.", "What the charger really gives, and what is lost."), measured, 5, tr("ladninger målt", "charges measured")]];
    $("#models").innerHTML = MODELS.map(([name, text, have, need, unit]) => { const pct = Math.min(100, (have / need) * 100); return `<div class="model"><svg viewBox="0 0 54 54"><circle class="ringt" cx="27" cy="27" r="22"/><circle class="ringv" cx="27" cy="27" r="22" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - pct}" transform="rotate(-90 27 27)"/><text x="27" y="31" text-anchor="middle" style="font:600 12px 'Space Grotesk',Inter,sans-serif;fill:var(--ink)">${pct >= 100 ? "✓" : pct.toFixed(0)}</text></svg><div><h3>${name}</h3><p>${text} ${have} ${unit}, ${tr("moden efter", "ripe after")} ${need}.</p></div></div>`; }).join("");
    const m = L[S.car], c = CARS[S.car];
    if (!m) { $("#ridge").innerHTML = ""; $("#cold").innerHTML = ""; return; }
    const X = (min) => 46 + ((min - 300) / 1020) * 380, wide = m.mine.some((t) => !t.est) ? 18 : 28;
    const dens = (arr) => { const out = []; for (let t = 300; t <= 1320; t += 10) out.push(sum(arr, (v) => Math.exp(-((t - v) ** 2) / (2 * wide ** 2)))); return out; };
    const all = [1, 2, 3, 4, 5, 6, 0].map((wd) => dens(m.deps[wd])), top = Math.max(0.001, ...all.flat());
    $("#ridge").innerHTML = `<svg viewBox="0 0 440 250">${[6, 9, 12, 15, 18, 21].map((h) => `<line class="grid" x1="${X(h * 60)}" x2="${X(h * 60)}" y1="8" y2="226"/><text x="${X(h * 60)}" y="244" text-anchor="middle">${pad(h)}</text>`).join("")}${all.map((d, row) => { const base = 44 + row * 30; return `<text x="0" y="${base}">${WD[[1, 2, 3, 4, 5, 6, 0][row]]}</text><path class="grow" style="animation-delay:${row * 0.07}s" d="M${X(300)} ${base}${d.map((v, k) => `L${X(300 + k * 10).toFixed(1)} ${(base - (v / top) * 40).toFixed(1)}`).join("")}L${X(1320)} ${base}Z" fill="${c.col}" fill-opacity=".35" stroke="${c.col}" stroke-width="1.5"/>`; }).join("")}</svg>`;
    const dots = Object.values(c.days).filter((d) => (d.km || 0) >= 15 && d.used > 0 && d.temp != null).map((d) => [d.temp, (d.used / d.km) * 100]).filter(([, e]) => e > 8 && e < 45);
    if (dots.length < 5) { $("#cold").innerHTML = none(tr("For få dage med både temperatur og kørsel endnu.", "Too few days with both temperature and driving yet.")); $("#cold-t").textContent = ""; }
    else {
      const T0 = Math.floor(Math.min(0, ...dots.map((d) => d[0])) / 5) * 5, T1 = Math.ceil(Math.max(20, ...dots.map((d) => d[0])) / 5) * 5, E1 = Math.ceil(Math.max(26, q(dots.map((d) => d[1]), 0.97)) / 4) * 4, E0 = 8;
      const XT = (T) => 40 + ((T - T0) / (T1 - T0)) * 380, YE = (e) => 10 + (1 - (clamp(e, E0, E1) - E0) / (E1 - E0)) * 190, eff = (T) => c.base * (1 + c.cold * Math.max(0, 15 - T));
      const ticksE = []; for (let v = E0; v <= E1; v += (E1 - E0) / 4) ticksE.push(v); const ticksT = []; for (let T = T0; T <= T1; T += 5) ticksT.push(T);
      $("#cold").innerHTML = `<svg viewBox="0 0 440 232">${ticksE.map((v) => `<line class="grid" x1="40" x2="420" y1="${YE(v)}" y2="${YE(v)}"/><text x="34" y="${YE(v) + 4}" text-anchor="end">${v.toFixed(0)}</text>`).join("")}${ticksT.map((T) => `<text x="${XT(T)}" y="226" text-anchor="middle">${T}°</text>`).join("")}
        ${dots.map(([T, e], n) => `<circle class="pop" style="animation-delay:${n * 5}ms" cx="${XT(T).toFixed(1)}" cy="${YE(e).toFixed(1)}" r="3" fill="${tempCol(T)}" opacity=".7"/>`).join("")}
        ${c.base ? `<path class="draw" pathLength="1" style="animation-delay:.6s" d="M${XT(T0)} ${YE(eff(T0))}L${XT(15)} ${YE(eff(15))}L${XT(T1)} ${YE(eff(T1))}" stroke="var(--ink)" stroke-width="2.4" fill="none"/>` : ""}</svg>`;
      $("#cold-t").textContent = c.base ? tr(`Lært: ${nf(c.base, 1)} kWh pr. 100 km ved 15° og varmere, og hver grad koldere koster ${nf(c.cold * 100, 1)} % mere. Ved 0° bruger ${c.name} ${nf(c.cold * 1500)} % mere end ved 15°.`, `Learned: ${nf(c.base, 1)} kWh per 100 km at 15° and warmer, and each degree colder costs ${nf(c.cold * 100, 1)} % more. At 0° ${c.name} uses ${nf(c.cold * 1500)} % more than at 15°.`) : "";
    }
    const dotsK = [...Array(90).keys()].map((n) => `<rect x="${20 + n * 5.4}" y="${24 + (n % 3) * 9}" width="3.6" height="6" rx="1.5" fill="var(--accent)" opacity="${0.25 + (n / 90) * 0.7}">${still ? "" : `<animate attributeName="opacity" values="${0.25 + (n / 90) * 0.7};1;${0.25 + (n / 90) * 0.7}" dur="3s" begin="${(n / 90) * 3}s" repeatCount="indefinite"/>`}</rect>`).join("");
    $("#conveyor").innerHTML = `<svg viewBox="0 0 700 92"><text x="20" y="14">${tr("for 90 dage siden", "90 days ago")}</text><text x="506" y="14" text-anchor="end">${tr("i går", "yesterday")}</text>${dotsK}<path d="M12 22v34" stroke="var(--bad)" stroke-width="2" stroke-dasharray="3 3"/><text x="20" y="72" style="fill:var(--bad)">← ${tr("ture ældre end 90 dage slettes hver nat", "trips older than 90 days are removed each night")}</text>
      <path d="M512 38h46" stroke="var(--ink)" stroke-width="1.5" marker-end="url(#arr)"/><defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--ink)"/></marker></defs>
      <rect x="566" y="12" width="118" height="54" rx="14" fill="var(--well)" stroke="var(--accent)" stroke-width="1.5"/><text x="625" y="35" text-anchor="middle" style="fill:var(--ink);font-weight:600;font-size:13px">${tr("Det lærte", "What is learned")}</text><text x="625" y="52" text-anchor="middle">${tr("mønstre, ingen steder", "patterns, no places")}</text><text x="625" y="84" text-anchor="middle">${tr("bliver, til I sletter det", "stays until you remove it")}</text></svg>`;
    // what EV Planner already learned about the charging
    const vs = IN.cars || [], has = (v) => v != null && Number.isFinite(Number(v));
    const row = (ok, a, b) => `<div><i class="${ok ? "" : "gap"}">${ok ? "✓" : "!"}</i><div><b>${a}</b><small>${b}</small></div></div>`;
    const speeds = vs.filter((v) => has(v.charge_speed)), curves = vs.filter((v) => v.curve && Object.values(v.curve).some(has)), margins = vs.filter((v) => has(v.margin) && Number(v.margin) > 0);
    $("#learned").innerHTML = [
      row(speeds.some((v) => v.charge_speed_source === "learned"), tr("Ladehastighed", "Charging speed"), speeds.length ? `${speeds.map((v) => `${esc(v.name)} ${nf(v.charge_speed, 1)} % ${tr("i timen", "an hour")}`).join(", ")}. ${tr("Målt på de seneste ladninger, når der er nogen; ellers regnet ud fra laderens effekt.", "Measured on the latest charges when there are any; otherwise worked out from the charger's power.")}` : tr("Læres af de første ladninger.", "Learned from the first charges.")),
      row(curves.length > 0, tr("Ladekurve", "Charging curve"), curves.length ? curves.map((v) => `${esc(v.name)}: ${Object.entries(v.curve).filter(([, x]) => has(x)).map(([k, x]) => `${k.replace("-", "–")} % ${nf(x, 1)} %/t`).join(", ")}`).join(" · ") : tr("Hvor meget langsommere bilen lader over 80 %, så planen starter tidligt nok.", "How much slower the car charges above 80 %, so the plan starts early enough.")),
      row(margins.length > 0, tr("Margin", "Margin"), margins.length ? margins.map((v) => `${esc(v.name)} ${nf(v.margin)} min`).join(", ") : tr("Hvor mange minutter bilen plejer at være forsinket i forhold til planen.", "How many minutes the car tends to be behind the plan.")),
      row(true, tr("Efter en pause", "After a pause"), tr("Om bilen selv går i gang igen, eller skal vækkes.", "Whether the car starts again by itself or must be woken.")),
      row(true, tr("Husets typiske døgn", "The house's typical day"), tr("Bruges af vagten, når hovedsikring og måler er sat op.", "Used by the guard when the main fuse and the meter are set up.")),
    ].join("");
  }

  /* ---------- Learned: said and done */
  function forudsigelse() {
    const c = CARS[S.car], rows = c ? c.detail.backtest || [] : [];
    if (!rows.length) { empty("#backtest", tr("Der skal 28 dages kørsel til, før forudsigelserne kan prøves af.", "It takes 28 days of driving before the predictions can be tested.")); $("#bt-t").textContent = ""; }
    else {
      const out = (x) => x.actual < x.p10 - 0.05 || x.actual > x.p90 + 0.05, hit = rows.filter((x) => !out(x)).length, top = Math.max(1, ...rows.map((x) => Math.max(x.p90, x.actual))) * 1.05, X = (k) => 40 + ((k + 0.5) / rows.length) * 840, Y = (v) => 12 + (1 - v / top) * 170, bw = clamp(700 / rows.length, 6, 18);
      wide("#backtest").innerHTML = `<svg viewBox="0 0 900 214">${[0, 0.5, 1].map((k) => `<line class="grid" x1="40" x2="880" y1="${Y(top * k)}" y2="${Y(top * k)}"/><text x="34" y="${Y(top * k) + 4}" text-anchor="end">${(top * k).toFixed(0)}</text>`).join("")}
        ${rows.map((x, k) => { const d = dIdx(x.day); return `<rect class="grow" style="animation-delay:${k * 18}ms" x="${X(k) - bw / 2}" width="${bw}" y="${Y(x.p90)}" height="${Math.max(2, Y(x.p10) - Y(x.p90))}" rx="5" fill="var(--band2)"/><circle class="hit pop" style="animation-delay:${300 + k * 18}ms" data-k="${k}" cx="${X(k)}" cy="${Y(x.actual)}" r="4.5" fill="${out(x) ? "var(--bad)" : "var(--ink)"}" stroke="var(--card)" stroke-width="1.5"/>${k % 5 === 0 ? `<text x="${X(k)}" y="206" text-anchor="middle">${WD[dateOf(d).getDay()]} ${dm(d)}</text>` : ""}`; }).join("")}</svg>`;
      $("#bt-t").textContent = `${c.name} · ${tr(`${hit} af ${rows.length} dage inden for båndet`, `${hit} of ${rows.length} days inside the band`)} (${((hit / rows.length) * 100).toFixed(0)} %, ${tr("lovet", "promised")} 80 %)`;
      tipOn($("#backtest"), "[data-k]", (el) => { const x = rows[+el.dataset.k], d = dIdx(x.day); return `${WDL[dateOf(d).getDay()]} ${dm(d)}<br>${tr("sagt", "said")} <b>${nf(x.p10)}–${nf(x.p90)} kWh</b> · ${tr("sket", "done")} <b>${nf(x.actual, 1)}</b>`; });
    }
    const cal = c ? (c.detail.calibration || []).map((x) => [x.said * 100, x.hit * 100]) : [];
    $("#calib").innerHTML = cal.length ? `<svg viewBox="0 0 320 170">${cal.map(([said, did], k) => { const x0 = 24 + k * 58, h = (did / 100) * 120; return `<rect class="grow" style="animation-delay:${k * 0.08}s" x="${x0}" y="${138 - h}" width="40" height="${h}" rx="6" fill="${Math.abs(said - did) <= 6 ? "var(--accent)" : "var(--fc)"}"/><line x1="${x0 - 5}" x2="${x0 + 45}" y1="${138 - said * 1.2}" y2="${138 - said * 1.2}" stroke="var(--ink)" stroke-width="2"/><text x="${x0 + 20}" y="${138 - h - 6}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${did.toFixed(0)} %</text><text x="${x0 + 20}" y="156" text-anchor="middle">${tr("sagt", "said")} ${said.toFixed(0)} %</text>`; }).join("")}</svg>` : none(tr("Kommer, når forudsigelserne er prøvet af.", "Comes when the predictions have been tested."));
    // the decision tonight
    const tn = DATA.tonight || {}, groups = tn.groups || [], g = groups.find((x) => (x.cars || []).length > 1) || groups[0] || {}, p = Math.round(Math.max(0, ...groups.map((x) => x.chance || 0)) * 100), wait = groups.some((x) => x.wait);
    $("#dialv").style.strokeDashoffset = String(100 - p); $("#dialv").style.stroke = wait ? "var(--accent)" : "var(--fc)"; $("#dialm").style.transform = "rotate(252deg)"; $("#dialt").textContent = `${p} %`;
    $("#verdict").textContent = wait ? tr("Venter på en billigere nat", "Waits for a cheaper night") : g.pick && CARS[g.pick] ? tr(`${CARS[g.pick].name} lader i nat`, `${CARS[g.pick].name} charges tonight`) : tr("Ingen ladning nødvendig i nat", "No charging needed tonight");
    $("#verdict").style.color = wait ? "var(--accent-ink)" : "var(--fc)";
    $("#why").textContent = `${tr(`Det er ${p} % sandsynligt, at en af de næste nætter bliver billigere end i nat`, `It is ${p} % likely that one of the coming nights is cheaper than tonight`)}${tn.price != null ? ` (${money(tn.price)})` : ""}. ${tr("Grænsen for at vente er 70 %, og kun når bilerne kan klare en svær dag imens.", "The limit for waiting is 70 %, and only when the cars can manage a hard day meanwhile.")}${IN.use ? "" : ` ${tr("Planen følger ikke dette endnu; det er slået fra under Indstillinger.", "The plan does not follow this yet; it is off in Settings.")}`}`;
    const lvl = clamp(Math.round((Number(IN.level) || 90) / 5) * 5, 50, 95);
    if (root.activeElement !== $("#lvl")) $("#lvl").value = String(lvl);
    $("#lvl-t").textContent = `${$("#lvl").value} %`;
    // the shadow ledger
    const sc = DATA.score || {}, led = Object.entries(DATA.ledger || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)), [w0, w1] = IN.window || [21, 7];
    const pts = [];
    for (const [iso, entry] of led) { const d = dIdx(iso); if (d + 1 > N - 1 || d < 0) continue; const got = sum(Object.keys(entry.cars || {}), (id) => ((CARS[id] || { days: {} }).days[isoOf(d + 1)] || {}).charged || 0), p0 = entry.price ?? (PD[iso] || {}).night; if (p0 == null) continue; const later = [1, 2, 3].map((k) => (PD[isoOf(d + k)] || {}).night).filter((v) => v != null); pts.push({ d, a: got * p0, b: got * (entry.wait && later.length ? Math.min(p0, ...later) : p0) }); }
    if (pts.length < 2) empty("#ledger", tr(`Regnskabet er lige begyndt: ${led.length} ${led.length === 1 ? "aften" : "aftener"} er gemt. Hver aften gemmes, hvad der forventes, og dagen efter, hvad der skete.`, `The ledger has just begun: ${led.length} ${led.length === 1 ? "evening is" : "evenings are"} kept. Each evening what is expected is kept, and the day after what happened.`));
    else {
      const a = [0], b = [0]; for (const x of pts) { a.push(a[a.length - 1] + x.a); b.push(b[b.length - 1] + x.b); }
      const n = pts.length, topL = Math.max(1, a[n]) * 1.05, XL = (k) => 40 + (k / n) * 840, YL = (v) => 10 + (1 - v / topL) * 150, path = (arr) => arr.map((v, k) => `${k ? "L" : "M"}${XL(k).toFixed(1)} ${YL(v).toFixed(1)}`).join("");
      wide("#ledger").innerHTML = `<svg viewBox="0 0 900 190"><path d="${path(a)}${[...b].reverse().map((v, k) => `L${XL(n - k).toFixed(1)} ${YL(v).toFixed(1)}`).join("")}Z" fill="var(--soc)" class="fan"/><path class="draw" pathLength="1" d="${path(a)}" fill="none" stroke="var(--soft)" stroke-width="2"/><path class="draw" pathLength="1" style="animation-delay:.4s" d="${path(b)}" fill="none" stroke="var(--accent)" stroke-width="2.6"/>
        <text x="${XL(n)}" y="${YL(a[n]) - 6}" text-anchor="end" style="fill:var(--ink)">${tr("som ladet", "as charged")}: ${esc(money(a[n], 0))}</text><text x="${XL(n)}" y="${YL(b[n]) + 24}" text-anchor="end" style="fill:var(--accent-ink);font-weight:600">${tr("med forudsigelser", "with predictions")}: ${esc(money(b[n], 0))}</text><text x="${XL(0)}" y="184">${dm(pts[0].d)}</text><text x="${XL(n)}" y="184" text-anchor="end">${dm(pts[n - 1].d)}</text></svg>`;
    }
    $("#ready").style.width = `${sc.ripe ? 100 : clamp(((sc.scored || 0) / 21) * 100, 4, 95)}%`;
    $("#ledger-t").innerHTML = sc.scored ? tr(`${sc.hits} af ${sc.scored} dage holdt den svære dag (<em>${Math.round((sc.rate || 0) * 100)} %</em>). At vente ville have sparet <em>${esc(money(sc.saved || 0, 0))}</em> på ${sc.waits || 0} nætter.${sc.ripe ? "" : " Ikke moden endnu."}`, `${sc.hits} of ${sc.scored} days stayed under the hard day (<em>${Math.round((sc.rate || 0) * 100)} %</em>). Waiting would have saved <em>${esc(money(sc.saved || 0, 0))}</em> on ${sc.waits || 0} nights.${sc.ripe ? "" : " Not ripe yet."}`) : tr(`Ikke moden endnu: ${led.length} ${led.length === 1 ? "aften" : "aftener"} er gemt, og systemet vil se 21 dage, før det anbefaler noget.`, `Not ripe yet: ${led.length} ${led.length === 1 ? "evening is" : "evenings are"} kept, and it wants to see 21 days before it recommends anything.`);
    void w0; void w1;
  }

  /* ---------- the whole page */
  const TABS = () => [["plan", tr("Overblik", "Overview")], ["bil", tr("Kørsel", "Driving")], ["lad", tr("Strøm", "Power")], ["laer", tr("Lært", "Learned")]];
  const GROUP = { plan: ["plan"], bil: ["bil"], lad: ["pris", "lad"], laer: ["laer", "forud"] };
  const PANELS = ["plan", "bil", "pris", "lad", "laer", "forud"];
  function render(calm = false) {
    if (!built || !IN) return;
    wrap.classList.toggle("calm", calm);
    $("#tabs").innerHTML = TABS().map(([k, name]) => `<button data-tab="${k}" class="${S.tab === k ? "on" : ""}"><i></i>${name}</button>`).join("");
    for (const k of PANELS) $(`#p-${k}`).hidden = !GROUP[S.tab].includes(k);
    const draw = { bil: biler, pris: priser, lad: ladning, laer: laering, forud: forudsigelse, plan: tidslinje };
    for (const k of GROUP[S.tab]) draw[k]();
    if (!raf && !still) raf = requestAnimationFrame(river); else if (still) river();
  }
  root.addEventListener("click", (ev) => {
    if (!built) return;
    const t = ev.target.closest("[data-wkp],[data-tlz],[data-tlnow],[data-day],[data-tlsheet],#tl-close,#tl-sheet,[data-open],[data-tab],[data-car],[data-v],[data-trip],[data-name],[data-place]");
    if (!t) return;
    if (t.dataset.open) { $("#tl-sheet").hidden = true; say("open", t.dataset.open); return; }
    if (t.dataset.place) { const p = ((CARS[S.car] || {}).places || [])[+t.dataset.place]; if (p && p.last) { S.pickTrip = p.last.id; S.naming = !p.last.zone; render(true); } return; }
    if (t.dataset.name) { S.naming = t.dataset.name === "open"; render(true); if (S.naming) $("#nm-in")?.focus(); return; }
    if (t.dataset.wkp) { tlS.day = +t.dataset.wkp; tlS.at = tlS.day * 24 + 18; tlS.left = null; }
    else if (t.dataset.tlz) { tlS.z = clamp(tlS.z + Number(t.dataset.tlz), 0, 2); tlS.left = null; }
    else if ("tlnow" in t.dataset) { tlS.day = 0; tlS.at = null; tlS.left = null; }
    else if (t.dataset.day) tlS.day = +t.dataset.day;
    else if (t.dataset.tlsheet) { const [h, body] = SHEETS[t.dataset.tlsheet]; $("#tl-sheet-h").textContent = h(); $("#tl-sheet-b").innerHTML = body(); $("#tl-sheet").hidden = false; return; }
    else if (t.id === "tl-close" || t.id === "tl-sheet") { if (t.id === "tl-sheet" && ev.target !== t) return; $("#tl-sheet").hidden = true; return; }
    else if (t.dataset.tab) { S.tab = t.dataset.tab; for (const id of Object.keys(charts)) charts[id].first = true; render(false); if (host.getBoundingClientRect().top < 0) host.scrollIntoView({ block: "start" }); return; }
    else if (t.dataset.car) { S.car = t.dataset.car; S.pickTrip = null; S.naming = false; render(false); return; }
    else if (t.dataset.v) { S.view = t.dataset.v; }
    else if (t.dataset.trip) { S.pickTrip = +t.dataset.trip; S.naming = false; }
    render(true);
  });
  // A trip's name: kept with the household's settings, by the car and how far the trip goes.
  root.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const pick = trips[S.pickNow], input = $("#nm-in");
    if (!pick || !input) return;
    const km = Math.round((pick.place ? pick.place.km : pick.km) * 10) / 10, name = input.value.trim().slice(0, 30);
    const list = ((IN.names || {})[pick.car] || []).filter((x) => Math.abs(Number(x.km) - km) > Math.max(1.5, km * 0.12));
    const at = pick.place && pick.place.pos ? { lat: Math.round(pick.place.pos.lat * 1e5) / 1e5, lon: Math.round(pick.place.pos.lon * 1e5) / 1e5 } : {};
    if (name) list.push({ km, name, ...at });
    IN.names = { ...(IN.names || {}), [pick.car]: list };
    S.naming = false;
    say("names", IN.names);
    load(); render(true);
  });
  let width = 0;
  const watch = new ResizeObserver(() => { const w = host.clientWidth; if (!w || Math.abs(w - width) < 2) return; const first = !width; width = w; if (built && IN) render(!first); });
  watch.observe(host);

  return {
    update(input, fresh) {
      const again = built && IN && IN.lang !== input.lang;
      IN = input;
      if (!IN.insight || !IN.insight.cars) { if (!built) root.innerHTML = `<style>${CSS}</style><p class="note">${IN.lang === "da" ? "Henter …" : "Loading …"}</p>`; return; }
      load();
      if (!built || again) { build(); render(false); } else render(!fresh);
    },
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; },
    start() { if (built && IN) render(true); },
  };
}

class EvPlannerInsight extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._app = boot(this, this.shadowRoot);
    this._key = "";
  }

  /* What the panel knows. Drawn again only when something that is shown has changed. */
  set input(value) {
    this.toggleAttribute("dark", !!value.dark);
    const key = JSON.stringify([value.lang, value.dark, value.insightAt, value.statsAt, Math.floor(value.now / 3600000), value.level, value.use, (value.cars || []).map((c) => [c.id, Math.round(Number(c.soc) || 0), c.connected, c.charging, c.plan && c.plan.segments.length, (c.history || []).length]), (value.prices || []).length, value.names, value.tracksAt, (value.zones || []).length, value.tiles]);
    if (key === this._key) return;
    const fresh = !this._key;
    this._key = key;
    this._app.update(value, fresh);
  }

  connectedCallback() { this._app.start(); }
  disconnectedCallback() { this._app.stop(); }
}

if (!customElements.get("ev-planner-insight")) customElements.define("ev-planner-insight", EvPlannerInsight);
