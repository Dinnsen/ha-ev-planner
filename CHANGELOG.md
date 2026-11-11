# Changelog

All notable changes to EV Planner. The version is the one in `custom_components/ev_household_planner/manifest.json`.

## [2.3.0b10] - 2026-11-11

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **The home is a place, and the sun, a home battery and a heat pump are parts of their own.** What was one long form under *Configure* is now added under the integration, like cars and chargers: places (*Home*, and say a *Vacation house*), each with its supply and its meter to the grid, and solar panels, a home battery and a heat pump, each at a place. *Configure* keeps what is the whole household's: currency, notifications and what is added to every price.
- **Your settings are moved for you.** The first time this version starts, your home becomes the place *Home* with your supply and grid settings, and your solar panels, home battery and heat pump become parts of it. Nothing has to be set again, and no entity changes.
- **A summer house can have its own sun, home battery and heat pump.** A car there charges on that place's surplus, and its energy is counted at that place's price for what it sells.

## [2.3.0b9] - 2026-11-11

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **A car that finds its charger.** A car that uses more than one charger gets *Found each time* as its charger. When a charger gets a car, EV Planner finds out which one it is from where the cars are and which of them says it is plugged in; two cars it could be are told apart by which charger gives power. A car that reports slowly can be asked at once (*Ask the car now*: a button, a script or an entity of the car's integration). When the car cannot be told, the household is asked on its phones (which car, or a guest), and the charger shows *Unknown car* and is left alone until then. The answer can also be given, and changed, on the charger's page.
- **Places.** A place with chargers besides the home, a summer house say, is added under the integration, with its zone and its own supply limit and meter. A car at the place is planned on that place's supply, and finds the charger there.
- **A backup for start and pause.** With *The other one is the backup*, the car's own switch steps in when the charger does not answer, and the other way round. What paused the car starts it again.
- **Sharing by need** on a shared supply: cars share an hour there is not room for all of them in by the kWh each lacks, never less than 6 A each. Chosen under *Sharing between the cars*; in line, as before, is still the default.
- **Peblar**, also the chargers Peblar builds for OK: the charger's device fills in its switch, current limit, power, energy meter and status, for Peblar's own integration and the community ones.
- A charger's *Power now*, and its current limit, are found from its device.

### Changed
- **A new car is started and paused by its charger** when the chargers have a switch, with the car's own switch as the backup. A charger is more often there to answer than a car. Cars already set up are not changed.
- **A car is paused at most three times in ten minutes:** a start waits when the next pause would be one too many (Peblar's own limit). A pause is always sent.
- **Zaptec's current is raised at most every 15 minutes,** as Zaptec asks; it is still lowered at once for the house.
- The sun on the roof, and the picture in the Home tab, are for the cars at home, not for a car at another place.

## [2.3.0b8] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Fixed
- **The charging window on the clock was only a blur.** When the plan changed, the window should sweep in, but two animations had the same name and the wrong one won: the sharp arc never came, and only its glow was left. The window is drawn in full again.
- **An error that stayed after it no longer mattered.** When a command to the car did not get through, the error stayed on the car's card, with the red line and the number on *Cars*, also after the car was set to *Off*, or when the car was already as EV Planner wanted. The error, and the repair in Settings, now go away when EV Planner lets go of the car or there is nothing more to send.

### Changed
- **A command that did not get through is first tried again quietly.** A Tesla that is just plugged in is often not awake yet, and the first command does not get through. The card now says when it is tried again, without red. Only when it has failed three times in a row is it shown as a problem, the same moment it becomes a repair in Settings.

## [2.3.0b7] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Fixed
- **The editor of the house picture on a phone.** While editing, the labels lay down over the editor's bar instead of in the picture, so most of them could not be seen, the one that could was in the wrong place, and where it was dragged to was not where it ended up. The labels now stay where they are in the picture while it is edited, and stay where they were put after saving.
- **Easier to grab with a finger:** the chargers, the box, the battery and the heat pump, and the stretches of wire, can be grabbed in an area of at least 40 pixels, and the labels do not get in the way while things or wires are moved.

## [2.3.0b6] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **Place things in the house picture yourself.** An administrator taps *Edit* on the picture in the Home tab:
  - *Things:* drag a charger, the box where the current comes in, the home battery or the heat pump. Things on a wall stay on a wall and can move to another wall; the heat pump stands on the ground, outside the house. The wires to a thing that was moved are drawn anew, straight and round the house.
  - *Wires:* drag a stretch of wire to move it; the wire stays straight and its ends stay on their things. *Draw this one again* gives back the picture's own way.
  - *Solar panels:* tap the roof, or draw across it, to put panels up or take them down; on the classic house also on the garage's flat roof.
  - *Labels:* drag a label to where it is not in the way; the others make room for it.
  - Undo, put back, cancel and save. It is saved in EV Planner for each house, so it looks the same on every device and for everyone.

### Fixed
- The icons in the house picture's labels could be drawn too small after the picture changed size.

## [2.3.0b5] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **Smaller labels in the house picture.** The grid shows its pylon, an arrow (down: in to the house, up: out to the grid) and the power; a car shows its charge level. Tap a label for its name and the rest: *buying* or *sending out*, the charging power or when the plan starts. The labels no longer lie over the cars on a phone, and the others make room when one is opened.

## [2.3.0b4] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **A car's place in the drive.** On the car's page, under *Rules*: *Automatic* (in front of its charger), *Left* or *Right*. The house picture shows the car there.

### Fixed
- **Sheets and the tab bar could be seen through** with a theme with glass cards: the text behind showed through them. They are solid now, in light and dark.
- **A sheet in Settings lay under the tab bar on a phone**, so its last lines could not be read. It lies over the tab bar now.

### Changed
- **The panel and the cards get only what changed.** The whole state is sent once when they open; after that only the parts that changed, and of the cars and chargers only the ones that did. Nothing is sent when nothing changed. Less to send and to read on a phone, most of all with two days of quarter-hour prices.

## [2.3.0b3] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **Two houses to choose between.** *Settings → House* has the classic house and a new *angle house*: an L-shaped house seen with the garage nearest, with the same clay look, day and night, wires, cables and labels.
- **A price for what you sell** (options, *The sun and the home battery*), as a number or a sensor: a charge's kWh from the sun cost that in the history, instead of nothing.
- **An amount added to every price** (options), for a price sensor with only the spot price.
- **Export CSV** in the History tab: the period you are looking at, one line per charge, with the part from the sun. In Danish with ";" and decimal commas, so Excel opens it directly.
- **A repair when a car cannot be controlled:** after three failed commands in a row. It goes away by itself when a command works.
- **The simulator** has cars whose cloud is down, cars that answer slowly and show an old charge level, and a supply meter that freezes. The panel and the cards have their own tests, run in a browser before every release.

### Changed
- **A stop from the guard always goes out**, also when the hour's commands are used up: the last of the twelve is kept for a stop.
- **A command that fails is tried again later and later** (1, 2, 5, 10 and 15 minutes) instead of every minute, and a command that gets no answer is given up after 30 seconds.
- **A car that was paused rests two minutes** before it is started again, unless you ask by hand.
- **A supply meter that has not reported for five minutes is not trusted**, even if it still shows a number: the cars go to the least current.
- **What was held back is remembered across a restart:** the heat pump, a charger's current and the phases are released again after Home Assistant has restarted.
- **A charger's current is only sent when it changes** when charging on the sun, not every minute.
- **Lighter on Home Assistant:** the prices are read once and reused, a charger's energy meter no longer makes a new plan each time it counts, and the counters are saved every two minutes while charging instead of every second.
- **The dashboard cards load by themselves**; the panel's code is fetched only when a card opens a pop-up.
- **A release is only made when the tests, the simulator and the panel's tests pass.**
- The supply meter is picked among current sensors only.

### Fixed
- Two evaluations could run at the same time and send the same command twice.
- The guard could count a car as stopped when its stop had failed.
- Times across the change to and from summer time are counted in real time everywhere.
- The panel listened to EV Planner twice each time it was opened, and drew everything twice.
- A choice in *Settings* (the house, the language of notifications) shows at once on an iPhone.
- The labels in the house picture no longer cover each other on a phone, and *Price now* fits in its field.
- Long car names in *Tonight* end in "…" instead of being cut.

## [2.3.0b2] - 2026-11-10

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **A new house picture.** Grey walls, a white roof, dark solar panels and soft shadows under the eaves that stay put all day. The picture slides from day over dusk to night with the sun (day above 6°, night below −6°): warm windows, lamps by the doors and stars at night.
- **The wires are green and show where the current goes.** Pulses of light run along them in the colours of the Energy dashboard: yellow from the sun, blue bought from the grid, purple sold, turquoise from the home battery. The more power, the more and faster pulses; when the house uses both sun and grid, they take turns. The wire to the grid ends in its label with a pylon and *buying* or *selling*.
- **The wires run like real ones:** from the panels straight down the wall into the box, out of the box to the left and along the garage to the chargers, out to the right and along to the heat pump.
- **Real charging cables.** A black cable with a plug into the car's port, or rolled up on a hook beside the charger when no car is plugged in. The charger's light, a ring by the plug and the car's label show the state: grey not plugged in, blue plugged in, yellow (slowly pulsing) planned with its start time, green charging or done.
- **Two chargers:** one in the middle of the garage and one by its right-hand corner, each car in front of its own charger. The cars' labels sit in the drive in front of them.

## [2.3.0b1] - 2026-11-09

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **The weather in the house's forecast.** Pick a weather entity under *Shared supply* (with only one, it is suggested). EV Planner learns how much more the house draws for each degree colder, from its own hours, and counts on the night's temperature: a cold night after mild weeks plans less for the cars and starts sooner, a mild night after cold weeks more. In the simulator a cold night was 3 A less wrong on average and both cars were ready; without the weather one stopped at 72 %.
- **A heat pump.** Its power (shown in the Home tab), and a switch that holds it back: when even the least current is too much, the guard holds the heat pump back for at most 15 minutes, at most twice a night, before it stops a car. Off unless you pick the switch.
- **The Energy dashboard is read by itself.** The grid's power, the sun, the home battery and the devices with their power show in the Home tab without choosing anything again. A device called *Heat pump* or *Varmepumpe* is the heat pump.
- **The Home tab** shows what the home draws right now (grid, house, cars, sun, heat pump, the price and the temperature outside), tonight's plans of all cars on one line of time over the prices, today's use of the whole house with the cars' part of it, and the chargers.
- **The house by day and by night.** The picture follows the sun: light by day, warm at dusk, dark at night with lit windows and a lamp over the garage.
- **History by day, week, month and year**, for all, one car, one charger, the guests or the whole house (from Home Assistant's statistics), with numbers that count up, bars that grow and, for a year, every day as a square.
- **What EV Planner has learned:** each car's charging speed, how it slows down near full, when it usually charges and with how much, extra time and how the last morning went; the house's day and its answer to the cold. With how sure it is.

### Changed
- **The car page has three views:** *Now* (the clock and the plan), *Rules* (tiles that say what is on and open as a sheet) and *History* (what it has learned and its charges).
- **Settings are tiles** that open as sheets.
- **The Cars tab shows only the cars.** The guest is under *Guest*, the chargers are in the Home tab.
- **The price clock shows the price ceiling** as a thin ring, and says why some hours are faint: they are above the ceiling.
- **Labels in the house picture are small** and sit straight above what they belong to; tap one for its name. The house stands in the middle of the picture, with more contrast.
- *Repeat every* for the plug-in reminder is now called *Remind me again after*, and says what it does.

### Fixed
- The app could be moved sideways on a phone, and the page could show over the tab bar.

## [2.2.0b5] - 2026-11-09

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **The cars in the Home tab** are new clay models of modern electric cars, made in the same view and light as the house, so they stand on the drive instead of being pasted onto it: real side windows, a closed front with a slim light across it, a light bar at the back and aero wheels; the SUV has black trim and roof rails. Each kind keeps its own colour, and the car brings its own soft shadow.

## [2.2.0b4] - 2026-11-09

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **The cars in the Home tab** are clay renders now, one for each kind: small car, saloon, SUV, estate and van, each in its own colour. They stand where the drawn cars stood, with their own soft shadow; your own cut-out photo can still take a car's place.

## [2.2.0b3] - 2026-11-09

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **Charging on the sun** (options, *The sun and the home battery*): with a sensor for the power to and from the grid, a car set to *Sun and plan* or *Only sun* charges on what the house would otherwise send to the grid. It starts after a minute of enough sun, stops after four minutes without, and its current follows the surplus: down at once when the house would buy, up only when the sun has stayed for a while, so a passing cloud does not switch it on and off. *Sun and plan* still makes sure the car is ready by its ready-by time; *Only sun* makes no plan from the grid.
- **One or three phases:** with a phase switch on the car or the charger, a car on the sun charges on one phase from about 1.4 kW instead of 4.1 kW.
- **The home battery:** below the level you set it keeps the sun it takes, above it the cars may have it, and a battery that discharges is never counted as sun. A switch that holds the battery can be turned on while a car charges from the grid, so the battery does not empty itself into the car.
- **The solar forecast:** with a forecast in the Energy dashboard (Forecast.Solar, Solcast), a car on *Sun and plan* counts on half of the sun promised before its ready-by time (less what the house uses) and buys that much less from the grid. If the forecast covers it all, the car waits for the sun.
- **The sun's share** of each charge in the history; what came from the sun costs nothing.
- **The Home tab**, redrawn as a calm white house: the grid, the house, solar panels, the home battery, the heat pump, up to two chargers and two cars, each only when you have it. Lines light up where the current runs, a car's charging cable lies across the drive to the car, or hangs rolled up beside the charger when the car is not plugged in. The chargers, the home battery, the heat pump and the panels are dark grey, with lights that show what they do. Each car can be a small car, a saloon, an SUV, an estate or a van, in white or black, or your own cut-out photo of it (the car's page, *The car in the Home tab*).

### Development
- The simulator runs days with the sun: a clear June day, passing clouds, a small spring roof with and without a phase switch, a home battery that comes first, a battery held at night, and a weekend that waits for a sunny forecast. A run fails when the current changes more than 12 times in an hour, the car is started more than 8 times, it is not ready, or *Only sun* takes more than a tenth from the grid.

## [2.2.0b2] - 2026-11-09

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **The Home tab** in the panel, when a shared supply is set up: the grid, the house and the cars with the current flowing between them, how much of the limit is in use, and a timeline of who gets the current through the night, with a line on why.
- **Easee chargers** are controlled through Easee's own action: pick any sensor of the charger as its charging current (no number is needed). EV Planner sets the charger's current with a time limit of 30 minutes and sends it again every 15, so the charger goes back to its own setting if Home Assistant stops.
- **The guard** (options, *Shared supply*, off by default): with a meter and a current setting, EV Planner watches the meter and turns the cars down at once when the house and the cars draw more than the limit, the last in line first, and lets the plan raise them again after two minutes. If the meter stops reporting, the cars go to the least they can take until it is back. It is not a fuse: leave it off if an Equalizer or the charger already balances the load.

### Development
- The simulator runs nights without an Equalizer, where only the guard turns the cars down: a house with a washing machine, a dryer, a kettle and a water heater during the night, the same with Easee's cloud delay, a meter that drops out for 40 minutes, and the same night without the guard for comparison. A guard that leaves the house over the fuse for more than two minutes after the delay, or changes a car's current more than 12 times in an hour, fails the run.

## [2.2.0b1] - 2026-11-09

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **Shared supply: several cars behind one fuse** (options, *Shared supply*). Set the most the house may draw per phase (e.g. 23 A on a 25 A supply, or the circuit the chargers share), the phases, and a meter if you have one (current per phase, from a HAN/P1 reader, a Shelly EM or an Equalizer). The plugged-in cars are then planned together under the limit, a slot at a time, cheapest first. The house comes first: what it is expected to draw is taken from the limit, learned from the meter hour by hour, apart for the cheap hours (a heat pump on a price plan runs then); without a meter, a fixed reserve.
- **Must have and priority** per car: every car first gets what it must have by its ready-by time, then the cars fill up by priority (*Normal* or *First*). Asking for 100 % makes it a must.
- **Charging current:** a car or charger with a current setting (the car's charging amps, the charger's current limit) is told how many amps its share is in each slot. A charger that can only be switched on and off takes its turn instead.
- **An hour to spare:** on a shared supply a plan aims to be done an hour before the ready-by time, so the house can take what it needs on the way; the last hour catches up.
- The panel shows each car's share and what the house is expected to draw, and says when there is not enough current for the whole target.

EV Planner plans under the limit; it does not protect the fuse. A charger's own load balancing (an Easee Equalizer, say) does that, and when it turns a car down, the next plan follows the car's measured speed.

### Development
- The simulator runs two cars behind one fuse with an Equalizer: a house with room for both, a heat pump that runs in the cheap hours, and a night with too little for both (the first car first, the other its must).
- The release workflow publishes beta versions as pre-releases.

## [2.1.2] - 2026-11-09

### Fixed
- **The price ceiling in the panel on a phone:** the choice between a fixed price and the average + % sits under the rule as two buttons, with the value next to them, instead of squeezing the text into a narrow column.

## [2.1.1] - 2026-11-09

### Added
- **A price ceiling that follows the prices:** instead of a fixed price, the ceiling can be the average price up to the ready-by time plus a percentage (switch *Price ceiling: average + %* and number *Price ceiling above average*). On a dear day it rises with the prices, so the car still charges; on a cheap day it falls. Before, this took an automation (from the community).

## [2.1.0] - 2026-11-09

### Added
- **History per plug-in.** With a plug sensor, a charge goes to the history when the car is unplugged (for two minutes): one entry with its charging periods and charging time, instead of one entry per pause and small "49 % → 49 %" entries. Without a plug sensor, a blip joins the next charge or is left out.
- **The charging curve.** The speed is learned per band of the charge level, so a plan to 100 % gives a car that slows down near the top the time it needs.
- **A learned margin.** A morning the car was not quite ready makes the next plans finish earlier (in quarters, at most an hour); three mornings on time bring it back.
- **Morning receipt and warnings** (on by default): at the ready-by time, how it went; and a warning, with *Charge now*, when a plugged-in car cannot reach its target in time.
- **Prefer early:** the plan that is done soonest within a few øre per kWh of the cheapest (from the community).
- **Top up before departure:** to a level at the cheapest prices, the rest just before the ready-by time (from the community).
- **A target per weekday** in the week plan.
- **ENTSO-e, GE-Spot and generic price sensors** (lists with a start and a price), with cents per kWh turned into the currency. The panel says when prices have stopped, have holes or look like øre/cents.
- **A plan when prices do not come:** waiting for prices, a car with a ready-by time charges just in time anyway if they never arrive.
- **Other country** in the setup: everything works outside Denmark; only the guest's license plate lookup is Danish.
- **Add a car from its device:** its charge level, limit, plug, charging, location, power and charge switch are found and filled in.
- **Panel:** a line to read at a glance, *why* the car does what it does now, when it really charged in the price graph, *Simple / Smart / Expert*, the learned curve, margin and last morning, and periods in the history.

### Changed
- **The first night:** before a car has shown its speed, the estimate leaves 10 % for charging losses (11 kW and 77 kWh is 12.9 %/h, was 14.3 %/h), so a first night no longer ends a few percent short.
- **A plan does not move for a few øre:** a new price or reading keeps the plan from before unless a new one saves more than 0.50 (or 2 %).
- **Commands that do not take** are sent again after 6 and 12 minutes before a problem is reported, then now and then; at most 12 per car per hour.
- **A car that does not charge again after a pause** in its plan is learned (the second time) and then charges in one go; *Try again* on its page forgets it.

### Fixed
- **Guest bill with a plan in two periods** (from the community): a charger that says "no car" while charging is paused no longer ends the guest; *Plan again* or *Charge now* while the guest charges keeps what was charged on the bill; unplugging without an energy meter bills the share that was charged, not the whole plan. The bill lists the periods.
- **Energy of a short charge:** a charge of a few seconds no longer counts a whole minute.
- **The night the clocks go back:** a charge through the repeated hour is counted in full (time that passed is measured in UTC).
- **A charge without prices holds still:** its end no longer moves a few minutes every time the charge level rises.
- **A plug that blinks while the car charges** (reads unplugged for a moment) no longer drops the plan and pauses the charge: while charging, an unplug counts after two minutes.

### Development
- **A simulator** (`sim/`) runs nights through EV Planner minute by minute against a simulated car (charging curve, sensors that drop out, a car that does not start again after a pause), checks the rules that must never break, and compares with 2.0.1 on every push.

## [2.0.1] - 2026-11-08

### Fixed
- **Dashboard cards were as tall as the screen** (since 1.2.3). The cards share the panel's style, and the rule from 1.2.3 that makes the panel fill the screen reached the cards too. It now applies to the panel only; the panel still scrolls with the mouse wheel.

### Changed
- **HACS is the Marketplace** in Home Assistant 2026.11, and EV Planner is in its catalog: install it under *Settings → Marketplace* (search *EV Planner*). The README, the button and the texts say Marketplace; no custom repository is needed.

## [2.0.0] - 2026-11-05

### Changed – read this when you update from 1.x
- **New domain: `ev_household_planner`** (it was `ev_planner`, which another integration in HACS' default list uses, installing to the same folder). The name EV Planner, the panel, the dashboard cards, the home-screen app and the entity ids stay the same.
- **Moving from 1.x:** update in HACS and restart; EV Planner 1.x goes on working. Then add EV Planner under *Settings → Devices & services*: it offers to move the 1.x household with everything in it – setup, cars, chargers, settings, plans, history, learning, photos – and the entities with their entity ids, so dashboards and automations that use them go on working. Delete `config/custom_components/ev_planner` afterwards and restart; a repair reminds you while it is there.
- **Actions** are now `ev_household_planner.*` instead of `ev_planner.*`: change automations and scripts that call them. The blueprint picks the new domain's sensors.
- Installation through HACS search comes first in the README; the custom repository is the fallback.

### Rolling back
- Install 1.2.3 again in HACS: until the household is moved, 1.x is untouched.

## [1.2.3] - 2026-11-04

### Fixed
- **Scrolling with the mouse wheel in the panel on a PC** (#6). In Home Assistant's sidebar the box around the panel has no height of its own, so the panel grew with its content and the page scrolled instead of the panel; on a PC the mouse wheel then did nothing, only dragging the scroll bar worked. The panel now fills the screen, and its content scrolls under the header as intended. A new page also starts at the top again.

### Changed
- HACS installs EV Planner from the release zip, so the downloads are counted. The README shows the downloads and a Buy Me a Coffee link.

## [1.2.2] - 2026-10-29

### Fixed
- **A charge no longer starts and stops every few minutes.** A plan made again in the middle of a minute could only begin at the next minute, so a period that had begun moved on a minute each time the plan was made again, and the car was switched on for a few seconds every three minutes. A plan now begins from the minute that is running.

### Changed
- **Charging is planned in whole quarters of an hour**, like EV Smart Charging: no period of a minute or two, and a little to spare for the time a car takes to start. A car stops by itself at its limit, so the quarter it does not need in full costs nothing. Plan cost and energy are for the planned time.

## [1.2.1] - 2026-10-28

### Fixed
- **A restart no longer pauses a charge.** The plan is stored, so a car charging when Home Assistant restarts (for example for an update) goes on in the plan it was charging in. Before, the plan was made again and could only start at the next whole minute, so the car was paused for a minute or two and a "paused" message was sent.
- While a car's own sensors are unavailable (its integration is starting), a charge going on is neither ended nor reported as paused.
- **The "paused" message is removed when the car charges again**, so it never stays on the phones while the car charges.
- **Learning:** a falling charge level starts the measurement over completely. Time a car was active without charging (warming up from the battery) no longer counts towards the next learned speed.

## [1.2.0] - 2026-10-24

### Added
- **EV Planner learns how fast each car charges.** Plans are made from the charging speed in % per hour that the car shows, like EV Smart Charging, instead of from the battery capacity, the charging power and a guessed efficiency. A charge in which the level rose at least 30 % teaches the speed, measured over the time the car actually charged; a new charge moves it 30 % of the way. Once a charge has risen 30 %, the plan follows the speed it shows. Until a car has shown anything, the charging power against the battery capacity is the estimate. The status sensor shows `charge_speed`, `charge_speed_source` and `charge_speed_learned_from`, and the panel shows the speed under the car.
- **Charging power sensor** (optional) for a car: its own charging power in kW. EV Planner learns the power from it (`charge_power`, `charge_power_source`) and counts the energy per month with it.

### Changed
- The energy and cost of a plan are the charging time at the charging power.
- A car imported from EV Smart Charging starts with its speed in % per hour. Its charging power is no longer worked out from that speed with an assumed 75 kWh battery, which gave cars too high a power.
- Changing a car's battery capacity or charging power in its setup starts learning over.

### Removed
- **Charging efficiency**, for cars and the guest, with `number.<car>_charging_efficiency` and `number.guest_car_charging_efficiency`. The speed the car shows includes its losses. The entities are removed on update.

## [1.1.1] - 2026-10-24

### Fixed
- **Finish in one go only keeps clear of a car that is plugged in.** 1.1.0 also kept clear of the periods of a car at home without a cable, which on a charger with one cable stopped the car that is plugged in from finishing. Now the car that is plugged in charges in its own plan, as before.

## [1.1.0] - 2026-10-24

### Added
- **Finish in one go** (*Lad færdig i ét stræk*), per car under *Rules*, and as `switch.<car>_finish_in_one_period` and `number.<car>_one_period_price_difference`: when charging on now, or in one period, costs at most the set amount more per kWh than the cheapest plan (0.05 by default), the car charges in one go instead of stopping at dawn and finishing the next night for a few øre less. The plan says so, with what it costs more. It never takes the periods another car plugged in on the same charger has planned.

### Changed
- When a plan ends, the car is planned again before EV Planner acts, so a car that goes on charging is not paused and started again in between.

## [1.0.0] - 2026-10-23

The first stable version, for HACS' default list. Nothing changed since 0.8.0: settings, plans and history carry over, and 0.8.0 can be installed again.

## [0.8.0] - 2026-10-23

### Added
- **Cards for your own dashboards**, included in the integration – no resource to add, nothing to install in HACS. Under *Add card* (search *EV Planner*), with a visual editor:
  - **Household:** all cars, the guest and the chargers on one line, with charge level and status.
  - **Car:** one car with battery, target, when it charges, cost and savings.
  - **Car, large:** the car card from EV Planner's overview, with the price clock and the mode buttons, which work on the card.
  - **Guest:** *Add guest*, then the plate, the car, the plan and the cost, with *Stop charging* and *Bill*.
  - **Charger:** what it is doing, for whom, and who is next.
  - **Bubble:** a car, the guest or a charger as one Bubble Card button, with Bubble Card's measures and `--bubble-*` variables: the charge level fills it like a slider, with the target marked, and sub-buttons for the cost and the mode (a menu with *Smart*, *Charge now*, *Pause*, *Off*), *Add*/*Stop*/*Bill* for the guest and the power for a charger.
  The cards use the panel's own drawing and texts, so they look and update exactly like it, and all cards on a page share one connection.
- **The cards and the pop-up follow the theme:** Home Assistant's card and dialog variables, Bubble Card's variables (also for the pop-up, so it matches Bubble pop-ups), and Theme Studio's glass blur, raised surface, chip radius and pop-up border and shadow.
- **A pop-up from every card** (`tap_action: popup`, the default) with the page of that car, the guest or the charger: price clock, battery with handles, ready by, weekly plan and plan type for a car, and everything for the guest. It is Home Assistant's own dialog, so it opens above everything, also inside a Bubble Card pop-up, and closes with the back button or by pulling it down. `tap_action: panel` opens EV Planner on that page instead.
- **A page per charger** in the panel (tap its name on the overview): what it is doing, who is next and the cars that use it.
- **Addresses for the panel's pages:** `/ev-planner/car/<id>`, `/ev-planner/charger/<id>`, `/ev-planner/guest`, `/ev-planner/history`, `/ev-planner/settings`. The address follows what is shown, so a reload or a link opens the same page. In the home-screen app: `app.html#car/<id>` and so on.

### Fixed
- **The home-screen app no longer moves on iPhone.** Tapping a time or number field on a car's page (14 px text) made iOS zoom in, after which the whole page could be dragged around. Fields are now 16 px on touch screens, the app cannot zoom, the page itself never scrolls or bounces – only its content scrolls – and pull to refresh only starts at the very top, not when you scroll back up.

## [0.7.6] - 2026-10-21

### Fixed
- **The plan in a message names each charging period.** A plan in two parts read *tomorrow 04.00-14.00*, which looked like ten hours of charging. It now reads *tonight 04.00-04.41 and tomorrow 12.00-14.00* (*i nat … og i morgen …*); hours after midnight are *tonight* when it is afternoon or evening.
- **Status *Charging* when the car charges anyway.** A car that charges while EV Planner waits (started from the charger's or the car's app, or a car EV Planner does not control) showed *Planned*; it now shows *Charging*.

## [0.7.5] - 2026-10-21

### Fixed
- **A charge without a deadline no longer waits for tomorrow's forecast.** Without a deadline the plan looked 24 hours ahead from *now*, forecast prices included. After midnight the window reached a little further into the (cheaper) Carnot forecast for the next night every few minutes, so the start crept later and later, and at 02:53 the rest of the charge was moved to the next night: the car stopped at 73 % instead of 100 %. A plan without a deadline now only uses published prices, and its window ends on a whole price slot, so it no longer creeps. With a deadline after the published prices, forecasts are still used to reach it.
- **"Charged" message when a charge stops early.** A charge that stops before the target now says *Paused at 73 % of 100 % … Charges on tomorrow 04.28-05.53* instead of *Charged to 73 %*.

## [0.7.4] - 2026-10-20

### Fixed
- **Icons on iPhone notifications.** iOS draws the icon as a glyph on a round coloured badge, and both were sent in the same colour, so only a coloured circle showed. The glyph is now white.

### Added
- **Language of notifications** under *Settings → Notifications*: automatic (Home Assistant's language), Danish or English, so a household can get Danish messages with Home Assistant in English. `sensor.<car>_summary` (the line for phone widgets) follows it too, also when it shows the car's status in words.

## [0.7.3] - 2026-10-20

### Fixed
- **The wand no longer spoils photos.** Cutting a background left a dark (or light) rim around the car and frayed, speckled tyres and shadows. The cut now follows a smoothed outline, softens the edge and takes the background's colour out of it, and drops loose specks.

### Added
- **Undo for a cut-out.** The photo as uploaded is always kept: an arrow on the photo brings it back, and the wand always works from it, never from an earlier cut-out. A new photo with a plain background is saved as it is, and its cut-out is shown, with the arrow to go back.
- `ev_planner/restore_image` websocket command, and `image_original` on each car and charger in `ev_planner/state`.

## [0.7.2] - 2026-10-20

### Fixed
- A photo with a transparent background came out black: photos were always saved as JPEG. Transparency is now kept (PNG).

### Added
- **Photos look good on any card:** a plain background (black, white or any one colour) is removed when a photo is added, the car or charger is trimmed to fill the frame, and photos sit on a soft "studio" background in light and dark themes. A wand on the car's photo removes the background of a photo that is already there (the original is kept in Home Assistant).
- Car photos are shown wide, like cars.

## [0.7.1] - 2026-10-19

### Added
- `binary_sensor.<car>_charge_now` now has every attribute of EV Smart Charging's charging sensor (`current_price`, `ev_soc`, `ev_target_soc`, `charging_number_of_hours`, `opportunistic`), so dashboards made for EV Smart Charging work by changing the entity.

## [0.7.0] - 2026-10-19

### Added
- **Plug-in reminder, your way:** choose the **days** (e.g. only Sunday to Thursday), **repeat** it every so many minutes while the car is still not plugged in (at most 3 repeats a day), and for *only at a low price* **how far ahead** to look for the cheap hour (1–48 hours).
- **Phones per car:** choose which of the household's phones get the messages about each car (reminder, live notification, charged, problems). All of them by default.

### Changed
- **Charging away from home is never touched.** With an *at home* entity, an unknown or unavailable location now counts as away, so a charge on the road is not paused when the car's location sensor drops out.

## [0.6.0] - 2026-10-19

Everything a typical Node-RED / EV Smart Charging setup does around the car is now in EV Planner itself.

### Added
- **Checks that a pause takes, too:** when a car keeps charging after it was paused (for example a car that starts by itself when plugged in, while its switch already says off), EV Planner pauses it again after a few minutes and then reports it: "... should be paused, but it is still charging".
- **Plug-in reminder only at a low price:** an option (switch and number per car, and in the panel) to remind only when the cheapest price of the coming day is below a limit. The reminder now also tells the cheapest price and when it is.

### Changed
- A car that is (nearly) full and does not draw power is not reported as a charging problem.

## [0.5.1] - 2026-10-19

### Added
- **Stop the guest's charge:** while the guest charges, *Charge now* turns into *Stop charging* (also a button entity and `ev_planner.guest_stop`). What was charged goes to the history, marked *Stopped*, and the charger stays paused for the guest car until it is unplugged – or, without a plugged-in sensor, until the charge would have ended. New guest status *Stopped*.

## [0.5.0] - 2026-10-19

### Fixed
- A car without a ready-by time planned with Energi Data Service's week-long price forecast and could pick next Sunday. Without a deadline a car now looks at most 24 hours ahead, a published price always wins over a forecast for the same hour, and opportunistic charging only looks at published prices.

### Added
- **Battery capacity from the car:** an optional sensor (kWh, Wh or MWh) replaces the number from the setup while it has a value. Every car is still set up the same way.
- **Guest *Charge now*:** charges the guest car right away to its target, whatever the price, with the charger, meter and history working as for a plan (button, panel and `ev_planner.guest_charge_now`).
- **Photos** of cars and chargers in the panel, stored with Home Assistant's image upload and shown as the entity picture of the car's status and the charger's control sensor.
- **Chargers by brand and model:** pick the charger's device and/or one of about 40 known chargers; EV Planner fills in the power, switch, energy meter and plugged-in sensor, and the panel draws the kind of charger.

## [0.4.0] - 2026-10-19

The first release. It contains all four planned milestones.

### 0.1 – Foundation: plans for your own cars
- A household (one config entry) with **cars and chargers as subentries**: *Add car* and *Add charger* on the integration's page.
- **Start a car from EV Smart Charging**: sensors, charge switch and settings are copied; EV Smart Charging is not changed.
- EV Guest's planner for each car: cheapest one period or cheapest periods before the deadline, minute by minute, with charging losses, cost and savings.
- Status, plan, cost, savings and a *Charger control* sensor per car; `binary_sensor.<car>_charge_now` with `charging_schedule` and `raw_two_days` like EV Smart Charging.
- The **EV Planner panel** in the sidebar and as a home-screen app, with the new logo and icon.

### 0.2 – Control and EV Smart Charging's rules
- **Who starts and stops charging, per car:** the car, the charger, or neither (plan only).
- Modes: Smart, Charge now, Pause, Off.
- Minimum level, price ceiling, charge at a low price, charge at a low battery, opportunistic charging (lower the ceiling, or follow the last known price), earliest start, keep the charger on.
- A car that starts by itself when plugged in is paused right away; a charge started by hand is left alone.
- **Checks that charging started**, tries once more, then reports it (`binary_sensor.<car>_charging_problem` and a message).
- Blueprint *EV Planner – charger follows the plan*.

### 0.3 – The guest
- EV Guest's guest flow on a chosen charger: license plate lookup, plan, bill and history.
- **Sharing a charger:** the guest has it during the guest session; among the household's cars the one that must be ready first plans first.
- `sensor.<charger>_charger_control` says what each charger should do, and for whom.

### 0.4 – Everyday
- **Ready by per weekday**, and **trips from a calendar** (with a target such as "90 %").
- **Plug-in reminder** with *Charge now* / *Follow the plan* buttons, **live notifications** while charging (iOS Live Activities, Android Live Updates), and a **message when charged** – all with icons.
- **iOS widgets**: `sensor.<car>_summary`, and an option to refresh widgets when a status changes.
- Energy, cost and sessions per car and month.
