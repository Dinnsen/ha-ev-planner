# Changelog

All notable changes to EV Planner. The version is the one in `custom_components/ev_planner/manifest.json`.

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
