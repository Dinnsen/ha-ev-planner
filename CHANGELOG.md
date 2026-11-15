# Changelog

All notable changes to EV Planner. The version is the one in `custom_components/ev_household_planner/manifest.json`.

## [2.5.0b24] - 2026-11-15

### Fixed

- **"Insight is still learning your rhythm" after a restart.** Tonight's choice is kept from the evening and not changed in the night window, but a restart in the window forgot it until 07:00: the page said it was still learning, and "Wait, or charge" said 0 %. It is read back from the evening. A new choice of how careful is looked at again at once, also in the window.
- **A car's own charge limit with EV Planner's own steps.** A limit set in the car or its app before EV Planner started (or that the car never took from EV Planner) was not followed: Frank's Elroq stood at 80 % in the car and 90 % in EV Planner. The car's limit is now compared with what EV Planner set, and followed when they differ, except just after EV Planner sent a new one.
- **The guard gave a charger its current back only through the plan.** A car on *Charge now* (or charging outside its plan) has nothing in the plan to be raised by: Frank's charger stayed at 12 A after a peak. The guard now keeps, for each charger it turns down, what it was at, and gives it back when the house has left room for it for three minutes, whoever charges there (at most every ten minutes for one charger, and not just after the meter was gone, so a house that comes and goes does not make it go up and down). A car whose shared plan has amps for it now gets them from the plan.
- **"Plugged in at Garagelader" for a car at another charger, before it was known.** While the car says it is plugged in and its charger says no car is, the charger is not named. The time it has been so is kept over a restart, so a restart does not start the five minutes again.

### Changed

- **The cars' week and the timeline** expect each car's use by weekday (what that weekday has taken), not one day's average for all. A car that is expected to charge is charged as far as the day and the way take (a hard day tomorrow with the reserve, and a typical day after), and all the way to its target on a cheap day; the timeline's expected battery rises with the charging planned tonight and expected on the days after.
- **A day's price** is the cheapest three hours from noon to noon the next day, at the hours a car is usually home (charging by day counts too), with the hour it is cheapest; the colours compare the week's days with each other and are stronger.
- **"The log goes, what is learned stays"** shows the log as it is: a square for each of the 90 days (darker: driven farther; hold a finger on one to read it), the day that goes tonight, and what is learned from them: each car's week rhythm, use and cold, the forecast's error and the prices kept.
- **The guest's battery.** The register's model year is often missing; the year of first registration is used. A battery that the car's VIN gives (NHTSA) comes before the dataset's guess, and a motor power given as the variant ("208 KW") no longer spoils the match. When the data cannot tell the batteries apart, the possible ones are shown to choose from, and the battery chosen for a number plate is kept for the next time that car is looked up.

## [2.5.0b23] - 2026-11-15

### Added

- **How careful, in one slider (Learning → Learned).** From »Bold« to »Every night«, with what each choice would have done on the household's own 90 days: how many nights a week the charger is used, which car, how often a battery would have gone under 5 %, and the battery in the morning. A »?« opens the whole explanation and the 90 nights week by week. The same six choices are under Settings → Insight, in place of »Always have enough for«. Before, a car got the charger nearly every night whatever the level was set to, and every day after tomorrow was counted as a hard day; now a car charges the night it must, or when the cars would otherwise meet at the charger, and the days in between count as typical days. »Every night« keeps the old way. With »Let the plan wait for a cheaper night« on, a night no car needs the charger holds them at their floor.
- **The cars by their sides in the evening's picture**, drawn from the body and colour chosen for each car and standing left and right as at home. The battery fills the body from left to right; the dashed line is what a hard day takes.
- **The cable shows what to do.** It sits in the car that is plugged in (with the power running in it while it charges); when the car that should have the charger is not plugged in, the plug goes out to it and back, the cable stretching and swinging loose, and its port pulses. The steps under the picture are gone: one line says what to do, and warns when both cars need the night.

### Changed

- **The cars' week** is smaller and calmer: short day names, »now« as a small pill, each car a small battery filled to the expected level (with a bolt and an edge the night it charges), and the night's price as a bar in muted green, yellow or red for a cheap, ordinary or dear night; the cheapest has a ring. The chosen evening's figures (each car and the night's price) stand on one line.
- **The three answers** stand on one line as rings that fill as they come in, and their sheets open between the top bar and the tab bar, scrolling inside, so nothing hides under the tabs.
- **The map:** a place that is tapped (on the map or in the list) brings the map to its road, drawn white on top of the others; on a phone one finger scrolls the page and two move and zoom the map. The trip's box folds away, and has a Top 10 of the places driven to most.
- **Charts are read with a held finger.** Rest a finger on a chart for a moment and slide: the page stays put and whatever is under the finger (or the nearest dot) shows at once, without marking text. The week's clock, every trip, km a week, use per day, the price's rhythm, every charge, said and done, and the coming days' prices.

### Fixed

- **The target slider did not follow a limit changed in the car.** With EV Planner's own steps (1, 5 or 10 %), a charge limit set in the car or its app stayed at EV Planner's old target (90 % in the panel, 80 % in the car). A change made in the car is now the new target; EV Planner's own setting, and the car's late report of the old value just after it, are not taken for one.
- **"Plugged in at Garagelader" for a car at another charger.** A car whose own cable sensor says plugged in, while its charger has said for five minutes that no car is, is at a charger EV Planner does not know (a public one, or one not added). It now says "Plugged in at another charger", gets no plan, and is not paused or counted there. It stays there until its cable comes out, so a car plugged in at its charger meanwhile is known to be the other car: Frank's Elroq at the garage charger was shown as the Epiq (plugged in at a Clever charger), and the charger charged the Elroq though it was set to pause.
- **A charger that starts by itself when a car is plugged in** is now told again what the plan says (a pause sent while no car was there is not taken as done).
- **The guard did not turn down a charger charging a car it did not know.** The supply is what counts: every charger at the place that draws power while none of the household's charging cars is at it (a car taken for another, a car EV Planner does not know, a renter's) is now turned down like a guest's charger when the house goes over the limit, and given its current back when the peak is over. Each charger turned down is given back its own.

## [2.5.0b22] - 2026-11-15

### Fixed

- **"Not quite ready" of a car that was ready.** A target raised and then lowered again in the evening (to where the car already was, so nothing was left to charge) left the first promise standing: the morning said "80 % of 90 % (planned 90 %)" and the car was taught to finish an hour earlier from then on. The promise now follows the target down. Found in Frank's support file.

## [2.5.0b21] - 2026-11-15

### Fixed

- **The map under Driving showed "API KEY REQUIRED"** over every tile: CARTO's tiles, which Home Assistant's own map used until this autumn, now ask for a key. The map is now OpenStreetMap fetched through Home Assistant's own map tiles, as its own map is, toned down to a light style (dark in the dark theme). Where Home Assistant has no such tiles (before 2026.9) the roads and places are drawn without a map under them.

## [2.5.0b20] - 2026-11-15

### Added

- **A real map under Driving**, in a light style (dark in the dark theme). It shows home, the places the car goes to, each with how many times it was driven to in 90 days, and the chosen trip's road. It is dragged to move and zoomed with + and − or two fingers. The places are found from the car's position on the days Home Assistant still has it (about 10), and a place that lies in one of your zones has the zone's name; older trips of the same length are counted to the same place.
- **A tap on a place on the map chooses it**, with its name ready to be written. A name is kept with the place's position, so the place stays on the map when Home Assistant no longer has the positions. Trips that cannot be placed are listed under the map and can be named there.
- **A known trip through the 90 days**: under the map, every time the chosen route was driven, out and home: how often, kWh a trip and per 100 km on average, the lowest and the highest, the usual departure, what a trip costs in power, km and kWh in all, and each trip's use as a dot coloured by the temperature. A tap on a dot chooses that trip.
- **The home button shows by itself** where Home Assistant's own menu is hidden for the user (the sidebar set to always hidden, or a kiosk), not only with `?home`.

### Fixed

- **"Target steps" did not move when another step was chosen** (a car's rules → Battery): the choice was stored, but the row was not drawn again until the sheet was closed and opened. Reported by Frank.

## [2.5.0b19] - 2026-11-15

### Added

- **The cars' week**, over the timeline in Learning's overview: the coming seven evenings in one small table, with each battery's expected level and a bolt on the car expected to get the charger that night, and the night's price under each day (the cheapest marked). A tap on an evening shows it.
- **A trip made often can be given a name** (Driving → the map → "Name this trip"). Every trip of that length then has the name, on the map and in the lists. The names are kept with the household's settings.

### Changed

- **Fewer buttons on the timeline.** Both cars are drawn together, each in its own colour, so there is no car to choose; the zoom is a + and a − on the chart, with "now" to come back; the row of jumps is gone.
- **The top of the overview** shows the evening as a badge and the night's price beside the last nights', saying whether it is a cheap, an ordinary or a dear night.
- **Driving opens with 90 days at a glance** in one small card (how far, week by week, and what a kilometre takes, from the lowest to the highest), then the map, then the use per day.
- "A hard day" can be set anywhere from 50 to 95 % of the days.

### Fixed

- **The coming days' price showed only today and tomorrow**, without the forecast, so there was no uncertainty, no "Ways it may go" and no probability. The panel's own prices stop at tomorrow; Learning now gets every price the sensor has, its forecast included.

## [2.5.0b18] - 2026-11-15

### Fixed

- **Learning: a car whose energy meter misses its charging** (seen on a Mercedes, where the meter rose 1 kWh in three days) now has its charging read from the battery rising while the car stands still, so its charges, their price and its share of the power are shown.
- **Learning: a long trip with a fast charge on the way** counts what was charged on the way as used, so its kWh per 100 km is no longer far too low.

## [2.5.0b17] - 2026-11-15

### Added

- **Tonight in a picture**, at the top of Learning's overview: one line saying what to do ("Plug in the Mercedes this evening"), the cars drawn filled to their level with the hard day's floor as a mark, the cable going to the car that gets the charger, the night's prices with the hours the plan charges in, and up to three steps.

### Changed

- **Learning is drawn as it was designed.** The page is the design itself, with your own figures: the same cards, colours, charts and movement in *Overview*, *Driving*, *Power* and *Learned*. Under *Power*, "Ways it may go" is again 500 possible weeks flowing out from now, green under the price you set with the red line, amber above and red far above.
- **Trips and charging from before the log** are read from Home Assistant's own hourly statistics (odometer, battery, energy and temperature, 90 days): each stretch the odometer moved is a trip, to the hour, and each stretch the energy meter rose is a charge. Places are only known for trips logged while Insight has been on; the older ones are gathered on the map by how far they went.
- With Insight on, the history (the list, the export, deleting, the guest's bill) and the page of what is learned about the charging open from *Power* and *Learned*, with a way back. With Insight off they are the tab, as before.
- The learning centre is a file of its own, fetched the first time the tab is opened with Insight on. It stays in place while EV Planner sends new figures, so a chart being read or a timeline being dragged is not drawn over.

## [2.5.0b16] - 2026-11-15

### Changed

- **Learning has four parts**: *Overview*, *Driving*, *Power* (charging and prices together) and *Learned* (what is learned and how it has held).
- **The overview is a timeline**: what happened to the left (price, battery, driving, charging), now in the middle, and what is expected to the right (the price forecast with its uncertainty, the battery on a typical and on a hard day, tonight's charge). It is dragged sideways, zooms between day, week and month, and jumps to tonight, the next cheap night, the cheapest night, the longest trip and the last charge. A tap on a day shows that day. Three answers stand under it: tonight's car, what it has cost, and how well EV Planner knows the household.
- **The coming days' price three ways** (under Power): the forecast with bands for 5 and 8 of 10 outcomes; 22 ways the prices may go, drawn one after the other, green where they end cheaper than tonight and red where dearer; and how likely each coming night is to be cheaper.

## [2.5.0b15] - 2026-11-15

### Changed

- **History is now Learning**: one tab with everything EV Planner knows about the cars, in one row of six parts. *Overview* (tonight's car and the last 30 days), *Charging* (the history as before: each charge, the export, deleting, the guest's bill; and what each car charged each day), *Cars*, *Prices*, *Learned* (the charging speed and curve as before, with the week's rhythm, the cold and the forecast's error) and *Ahead*. With Insight off, Charging and Learned are as they were, and the other four are dimmed.
- **Fewer words on the page.** A card's explanation is behind its "?".

## [2.5.0b14] - 2026-11-15

### Added

- **Insight has its own page** (History → Insight, when Insight is on), in six parts. *Together*: tonight's choice of car, the last 30 days of driving for each car against the night's price. *Cars*: when each car leaves home through the week, 90 days of driving, the week as it is learned, and the latest trips with their places, km, kWh and temperature. *Prices*: the night's price and the day's mean for 90 days, the night's price by weekday, and the forecast's error for each day ahead. *Charging*: what each car charged each day, and about what it cost. *Learning*: how far each thing learned has come, and what the cold costs. *Ahead*: how likely a cheaper night is, and the ledger of what was expected against what happened.

## [2.5.0b13] - 2026-11-15

### Added

- **A way back to Home Assistant's front page.** Opened from a shortcut with `?home` at the end (`/ev-planner?home`), the panel shows a home button in its top bar: for a tablet on the wall, where Home Assistant's own menu is hidden.

### Fixed

- **A tall sheet went up under the top bar** on a phone, so its title and its Done button could not be reached. A sheet now stops under the bar.
- **"Other cars charge at once"** is called **Open charger**, with a short explanation: cars that are not yours charge right away, with no questions asked.

## [2.5.0b12] - 2026-11-15

### Fixed

- **Insight's fetch of older prices was still turned away.** Energi Data Service says how long to wait, and Insight now waits that long. What is fetched is kept as it comes, so a fetch that is stopped goes on from where it was instead of starting over.

## [2.5.0b11] - 2026-11-15

### Fixed

- **Insight's first fetch of older prices was turned away** by Energi Data Service for asking too fast. It asks for one period at a time now, with a pause between, waits longer when it is told to, and tries again an hour later if it still fails.
- **Tonight's expectation was made before the cars' older days were read**, and said "still learning" for the first hour. It is made again as soon as they are in.

## [2.5.0b10] - 2026-11-15

Insight: EV Planner writes down what the cars do, learns their rhythm, and says each evening which car should have the charger. All of it is off until it is turned on, and the plan only follows it when that is turned on too.

### Added

- **Insight** (Settings → Insight, and switches on the household's device). With it on, EV Planner keeps a log: each trip with its times, places (the names of zones, never coordinates), distance and charge levels for 90 days; one line for each car and day (km, kWh used and charged, temperature, first departure) for two years; the price of each hour for two years; and the price forecast as it looked each day for half a year.
- **The first time, it reads what is already there.** The cars' odometer, battery, charged energy and outside temperature are found on the device the battery sensor belongs to (by what kind of sensor they are, not by their names), and their history is read from Home Assistant's long-term statistics. Two years of spot prices are fetched from Energi Data Service when the price sensor says which price area it is in, and recalculated to the household's price with the sensor's tariffs.
- **What it learns**: what each weekday takes of each car (a typical day and a hard day), what a km costs and how much more in the cold, and how far off the price forecast is for each day ahead.
- **Which car gets the charger tonight.** For cars that share a charger, Insight works out how many nights each can do without it and still have enough for a hard day. The one that reaches its floor first gets the charger; a trip in the calendar comes before the pattern; and when both can wait and a cheaper night is likely, no car needs it. A message says so each evening (off until turned on), only when the right car is not already plugged in, and warns when both need the same night.
- **Do not swap cars at night**: between two times of the household's choosing, the evening's choice stands.
- **Let the plan wait for a cheaper night** (off until turned on): a night Insight waits, the cars charge no further than what a hard day takes. A trip or a calendar's target is never held back, and the car's lowest level is never gone under. The expectation never lowers a car under a hard day: simulated on a household's real driving, charging only what tomorrow looked like left a car short some thirty mornings a year.
- **A ledger**: each evening's expectation is kept and scored against what the cars did. When it has held for three weeks, the household is told once, with what waiting could have saved.

## [2.5.0b9] - 2026-11-14

After a review of the whole of EV Planner. Nothing new to learn: what was wrong, and what could go wrong.

### Changed

- **A shared supply follows each car's own rules.** With a supply set up, the cars are planned together, and that plan took every hour before the ready-by time: a car's price ceiling, its earliest start and "published prices only" did not count. They do now, as far as the car's target allows: the hours its rules allow are used first, and only what is still missing comes in the others. The target comes first. A departure that charges at the cheapest prices only (Weekend, Holiday) still never goes over them.
- **The guard also turns a guest down.** When the house goes over its supply and the household's own cars are at their least (or none of them charges), the guest's charger is turned down, when its current can be set, and else paused for five minutes, when it has a switch. It gets back what was taken when the peak is over.
- **Every time in the panel is Home Assistant's**, also when the panel is opened from another time zone (on a trip): the times of the plans then fit the ready-by times.
- **A car a tenth of a percent from its target is full** (99.9 of 100 %): it is not started for a few minutes more.

### Fixed

- **A rule changed just before leaving the car's page was lost**: a change is stored after a moment, and going back, to another car or another tab within that moment threw it away. It is stored at once now.
- **The guest's preview** showed the old plan after the departure, the price ceiling or the target's step was changed.
- **The app on the home screen** had no photo upload, no support export, no calendars to choose, no climate to choose and no way to place the house, and its house stood in daylight at night. Pulling a sheet down to close it there no longer refreshes the page as well.
- **The support export** left the names of calendar events and of zones in (where a car or a person is: at home or not is kept, a zone's name is not).
- **A calendar that does not answer** no longer takes the trip away: the trip known from before stays until the calendar answers again, and one calendar that is away does not hide the others.
- **A car's or a charger's integration that fails in its own way** (not as Home Assistant's errors) stopped the whole round of decisions; every command to a car, a charger, a home battery and a phase switch now has a time limit and takes any failure as a failure.
- **A price ceiling under every price** said "No charging window"; it says that every price is over the ceiling.
- **The night winter time begins**, with a price sensor whose times have no offset: one of the two hours at 02:00, and its price, was lost.
- **A charger that is away** was asked to change its current at every check while idle; the guard wrote in the event log at every check while its meter had no reading.
- **The climate card**: the mouse wheel over the temperature sent a command to the car for every step; the steps of one turn are sent once.
- **In the panel**: a command that starts or stops something is not sent a second time when the connection was lost for a moment (a setting still is); a household setting that could not be stored no longer stands as if it was; the history of a charger shows the charges that happened at it; the day home for a holiday is counted in local time; the note about waiting for the sun gave 4.1 kW also for a supply of one phase.
- **Setup**: a supply under 6 A (the least a charger gives) is not accepted; a car whose charger was deleted, and two cars that share one battery sensor, get a repair that says so; a charger whose model is not known is not shown as the brand's first model; and a charger named "Carport" no longer makes every sensor look like a plug sensor.
- **Behind the scenes**: the panel and each card left a listener behind every time they were opened; the state was made once for each of them at every update (now once for all); a plan that is only tried out no longer writes in the event log; the status sensor's level and ceiling are not kept in the recorder minute by minute; a stored reminder time that cannot be read no longer stops the start; the event log's times are compared as moments, not as text.

## [2.5.0b8] - 2026-11-14

### Added

- **The last charge as sensors**, per car: energy (kWh), cost and price per kWh, for dashboards and automations. They change when a charge ends.
- **Messages while the car is away** can be turned off per car (Settings → Messages): no messages about a car that is at none of the household's places, charging on the road, say. Needs a location for the car.
- **Swipes.** A sheet or pop-up is closed by a swipe down (the cards' pop-up from anywhere in it, when its page is at the top); the tabs are changed by a swipe to the side; and the climate's temperature by a swipe across its number, or the mouse's wheel, a step at a time, in EV Planner and on the climate card.

### Fixed

- **"Cannot reach 100 %" for a car at 99 %**: a full car that warms its cabin before it leaves drops a point; the warning is no longer sent for a car within two points of its target (the morning's message counts that as reached, too).

### Changed

- **The supply's limit is asked for as the main fuse's size** (25 A for a 25 A fuse): with a meter and the guard, EV Planner itself keeps 2 A free when it turns a car up, so a limit set to 23 A gave up 2 A twice.

## [2.5.0b7] - 2026-11-14

### Fixed

- **The place card's labels** (what the grid, the house and the cars draw) no longer jump: a dashboard gets an update for every entity that changes anywhere in the house, and each one drew the labels anew, so they popped in again several times a second. A label that stays is now kept, and only its text changes.

## [2.5.0b6] - 2026-11-14

### Fixed

- **The clay car on the climate cards** was grey and flat in Home Assistant: a car's id there starts with a digit, and the escaped id (with a space in it) kept the drawing from finding its colours, glass and shadows. It is white clay with soft shadows, as in EV Planner.

## [2.5.0b5] - 2026-11-14

### Fixed

- **The climate Bubble card** shows the air moving in its little car while the climate is on, as the large and the small climate card do.
- **The climate cards** keep to the rows they are given in a sections view: the cabin shrinks instead of the card running over the card below.
- **The small car card** at half a column: the status goes under the name, so the name is no longer cut to a letter.

## [2.5.0b4] - 2026-11-14

### Added

- **New dashboard cards:** *Climate* (the clay car, the temperature, inside and outside, on and off, and when it starts by itself), *Climate, small* (a square: a tap turns it on and off, holding opens the car), *Climate, Bubble*, *What it learned* (as on the car's history page) and *Place* (a place's house, its numbers and its chargers, with a tab for each place). The Bubble card for a car can have a climate button (`climate: true`), and the household card can show one place (`place:`).
- **The whole planner as a card** (`custom:ev-planner-app-card`): all of EV Planner in a dashboard view of the *Panel* type, with its own tabs, so a tablet or a phone without Home Assistant's sidebar has it among the dashboard's tabs and comes back with them. The address does not change; `view:` opens it at a page.
- **Target steps** (a car's rules, *Battery*): *The car's* (as before: the target follows the car's own charge limit and its steps), or EV Planner's own steps of 1, 5 or 10 %. With your own steps EV Planner stops the car at the target, and sets the car's limit to the step above as a safety net (80 % for a target of 75 % on a car that takes tens). The guest has steps of 1, 5 or 10 % too.
- **The guest** can be ready by one of the household's departures (one with a price charges only in its cheapest hours), and can have a price ceiling.
- **History:** each charge shows the charger and what it cost per kWh.

### Changed

- **The climate** is a clay model like the houses: white, soft shadows, light glass, no dark background; the air is orange or blue. It shows the temperature inside (the climate's own, or the car's inside sensor) and outside (the car's sensor, else the place's).
- **The guard** waits out a short peak: a small overload (up to 20 % over the limit) must last 30 seconds before it turns a car down; a large one is cut at once. It reads what a car draws from its charger's own power sensor (which reports every few seconds), not the car's cloud, and gives a car back what it took as soon as the meter has shown room for three minutes, also at a Zaptec.
- **A charger no car is charging at** is set to what the place has room for, at most its full current: back to full when the house is quiet, lower while the oven is on, so a car plugged in later starts at what it may take.
- **A car whose current is set** is planned at its full current, not at what it was measured at while it was turned down; a charge that was turned down teaches nothing (its speed and power were what it was given). The first days, with a meter and the guard, the house is counted at what it has drawn of late, not the full reserve.
- **The Home tab** shows only the chosen place's cars, chargers and supply: the summer house's charger is under the summer house.
- **A car that cannot be paused low** (a Mercedes: its charge limit goes no lower than 50 %) is planned to charge there at once, as it does, and says so in its rules.
- **A guest's plan at a charger that cannot tell whether a car is plugged in** lets go when a car of the household is plugged in there after it: one cable, one car.
- The menu button of Home Assistant is there also when EV Planner is opened straight at its address.

### Fixed

- *"cannot reach 80 % by 15.00: about 80 %"*: the joint plan aims an hour early, and what it left for that hour was counted as missing. Now a car is short only when it cannot be charged by the ready-by time itself, a percent of the battery or more, and never when it would reach the target as rounded.
- A guest who had driven off was forgotten again every minute, which wiped a new guest's plate.
- The support export keeps a meter's peak within a minute, and a departure's time in the event log no longer replaces when it was set.

## [2.5.0b3] - 2026-11-14

### Changed

- **The climate** is the car seen from above, its roof off as in Tesla's app: soft bands of air stream from the vents over the seats and sway slowly, warm orange (with the windshield glowing) while it heats, ice blue while it cools, calmer as the cabin nears the temperature. Under it: on/off, the temperature with arrows, and the car's own inside temperature. Changing the temperature no longer starts the picture over.
- **The price graph** can be used: tap an hour and it stays picked (tap it again to let go), drag along it to move; the bubble shows the price, the time, how far below or above the average it is, and whether the car charges then. The forecast is paler, after a line where it starts, and *Known prices* / *With forecast* switches between them. A long press no longer selects text.
- **A car's card** shows which charger it is plugged in at, keeps its status badge top right (the name and its line wrap beside it), shows the whole *Charge now*, and, with nothing planned, the latest charge: kWh, what it cost and when.
- **The guest:** *Plan again* stays on top, and under it *Smart*, *Charge now*, *Stop* and *Remove*, as on a car.
- **Settings → Places:** the long explanations are behind a small *?*; *House shape* has a heading and a picture of each house, two in a row.
- **Settings → Calendar:** *Which word belongs to which car?*, the words to write in bold, and examples with your cars' own words.

### Fixed

- A settings sheet no longer jumps to the top (and slides in again) when something in it is changed, e.g. a departure.
- The calendar trip in a car's *Details* stayed inside the card; the week plan in the dropdown is just *Week plan*, so the dropdown does not widen the card.

## [2.5.0b2] - 2026-11-13

### Added

- **A place you let out** (*Settings → Places → Other cars charge at once*): the charger is left on whenever no car of the household has it, so a renter's car charges as soon as it is plugged in, and the household is not asked which car it is. A household car that paused the charger before it left hands it back on. The household's own cars are still found and follow their plans.

## [2.5.0b1] - 2026-11-13

Every setting has one place: Home Assistant for what is connected, the panel for how it behaves.

### Added

- **Departures**, under *Settings → Departures* in the panel: the household's list of what every car's dropdown offers besides the week plan. Each has a name, a day (next time, today, tomorrow or a weekday), a time, how cheaply it charges (the cheapest hours before it; only up to X % above the lowest published price; or only the cheapest X % of the hours) and maybe its own target. Change, delete, move or add your own – *Tomorrow afternoon 17:00* is there from the start. The weekend's behaviour can be changed too; *Week plan* and *Holiday* are always there. The cars' own morning, midday and evening times become the household's.
- **Prices per place:** a place (a summer house in another price area) can have its own price sensor; a car there is planned, and its charging counted, at that place's prices.
- **Settings → Places** in the panel: for each place its prices, the guard (on or off, and how long it waits after a peak), how the cars share it, and its house. *House and supply* and *Setup* are folded into it.

### Changed

- **Messages in one place**, under *Settings → Messages*: at the top what is for all cars – all messages on or off, the quiet hours, the phones (chosen here now, not under *Configure*) and the language – and then each car's own messages. A car's *Rules → Messages* tile leads there with that car open.
- **The car's climate** is always under *Rules → Climate*, where its entity can be chosen (or left to be found on the car's device); the car's setup no longer asks for it.
- **What is added to every price** is set under *Settings → Billing guests*, and **Refresh iOS widgets** under *Settings → App on the home screen*. *Configure* under the integration has only the currency left.
- The guard, its wait and the sharing are no longer in the place's setup; a place's setup asks for its own price sensor instead. Everything set before moves by itself.
- The action `ev_household_planner.set_trip` takes the id of any departure, your own too.

## [2.4.0b9] - 2026-11-13

### Changed

- **The car's climate is found by itself** on the car's own device (a Skoda's `climate.…_air_conditioning`, a Tesla's climate) when none is chosen in the car's setup, so the climate button and its rules show up without setting anything.
- **A car's messages show the household's**: a line at the bottom of *Rules → Messages* with the quiet hours (or that all messages are off) leads to *Settings → Notifications*, where the phones, the quiet hours and the language are set for all cars.

### Fixed

- **A car that still says it is plugged in after the plug came out** at its charger is asked to report, after half a minute and after two minutes (two calls, for cars whose cloud allows few), so the car and the charger are free again without waiting for the car's cloud.
- The lists that open from a dropdown (the departure on the car's page) were light text on a white box on a PC; they now have the panel's colours.

## [2.4.0b8] - 2026-11-13

### Changed

- **Calendars for the whole household**, under *Settings → Calendar* in the panel: as many as you like. Each car finds its trips by its word in the event – the first word of its name (`Tesla`, `Elroq`) unless you choose another. A calendar from a car's setup moves there by itself, with the car's keyword (or `*`, every event, when it had none); the car's setup no longer asks for one.
- **The guest's page** is laid out as the car's: the ready-by time and the target at the top, three numbers, the charger, the time and the plan folded under *Charger and time*, and the buttons in two rows.

### Fixed

- The hours under *Tonight* on the Home tab no longer run into each other when a plan spans days: every 3, 6, 12 or 24 hours, with the day at midnight.

## [2.4.0b7] - 2026-11-13

### Changed

- The ready-by time at the top of the car's page is the one that shows where it comes from (calendar, preset or week plan) and opens the next departure; the second line under the departure list is gone.

## [2.4.0b6] - 2026-11-13

### New

- **The next departure, at a glance.** Under the departure list, the ready-by time shows where it comes from (calendar, preset or week plan); a tap opens it: the day and time, how long until then, the calendar event, the target, the cost, the climate, and a line from now to the departure with when the car charges and when the climate starts.
- **A climate control.** The climate button opens it instead of starting the climate: a dial for the temperature (drag it, or − and +), a big *Start/Stop*, the temperature inside when the car tells it, and when the climate starts by itself. A car whose climate is a button or a switch (Mercedes) gets the big button and its own temperature.

### Fixed

- A long calendar title no longer runs out of the car's details.

## [2.4.0b5] - 2026-11-13

### New

- **How long the guard waits after a peak** before it turns the cars up again is set on the place's supply (*Guard: wait after a peak*, 5–30 min, 10 by default). Longer is calmer for appliances that come and go every few minutes; shorter lets the cars use the room sooner. Turning down is always at once.

### Fixed

- A car already at its target showed `vstatus_limit_not_above_soc` on the Cars tab instead of *Already at the target*.

## [2.4.0b4] - 2026-11-13

### Fixed

- The holiday's date comes and goes at once: the departure list let the page wait until it lost the focus.
- *Make it the default* takes the time in the field, also one just changed.

## [2.4.0b3] - 2026-11-13

### Changed

- **The week plan in a few taps:** pick a day, then its departure (the usual time, *Other* or *None*), its target on a slider and, with a climate, whether to warm the car and to what. *Other* can be made the usual time. The days show their time, target and climate at a glance. The one *Ready by* for every day is gone, and *One period / Cheapest periods* has moved to *Rules → Time*.
- **The climate per weekday:** a day of the week plan with the climate on starts it before leaving, as a calendar event does.
- **A start button for the climate with a stop button beside it** (Mercedes: *Preclimate start* and *Preclimate stop*) is stopped with it, and its status sensor tells whether it runs.

### Fixed

- Choosing *Holiday* shows its date at once, and choosing something else takes it away at once.
- A lost connection to Home Assistant (a phone waking up) no longer shows "Something went wrong: 3": the command is sent again when the connection is back.

## [2.4.0b2] - 2026-11-13

### New

- **Quiet hours** for notifications (e.g. 22:00–06:00) under *Settings → Notifications*: no messages then, nor updates of the live notification, which is taken away and comes back silently in the morning. The plan and the charging go on as usual.
- **A switch for all notifications** on the new *EV Planner* device, with the quiet hours' switch and times: turn them off from an automation when the house goes to sleep.

### Changed

- **A calmer car page.** At a glance: the dial, when it is ready and to what. The departure is one dropdown (*Week plan*, *Morning*, *Midday*, *Evening*, *Weekend*, *Holiday*) next to the climate button; the week plan and the details fold away. Time, energy and price per kWh, the charge level ahead and the latest charge follow below. Informational notes are gone; warnings stay.
- **Morning, Midday and Evening** (06:00, 12:00 and 17:00 under *Rules → Time*) are the next of that time; *This afternoon* and *Tomorrow afternoon* are only left for the action.
- The holiday's date field is readable in every theme.
- **A simpler calendar:** `Elroq 7:15 80% klima 21,5` – a time in the event is the departure, and the number after `klima` the temperature; no `°` or `afgang` needed (they still work).

## [2.4.0b1] - 2026-11-13

### New

- **Presets** on the car's page: *Tomorrow morning*, *This afternoon*, *Tomorrow afternoon*, *Weekend* and *Holiday*, once, then the week plan again. *Weekend* charges only when the price is at most 10 % above the lowest published, ready Monday morning; *Holiday* only in the cheapest tenth of the hours, ready the morning you are home. The morning and afternoon times are under *Rules → Time* (06:00 and 15:00). The minimum level still applies, and an earlier calendar trip still wins.
- **The car's climate.** Give the car a climate entity (or a switch, button or script) under its settings: the car's page gets a *Start climate* button, at the temperature under *Rules → Climate*. A climate entity is set to its heating mode (e.g. *heat_cool*) and the temperature in the car's own steps. *Start the climate by itself* (off by default) starts it before a calendar trip or a preset when it is colder than a limit, and by default only while the car is plugged in.
- **More words in a calendar event:** `fuld`/`full` charges to 100 %, `afgang 7:30`/`leave 7:30` is the departure when it is not the event's start (also in an all-day event), and `klima`/`forvarm`/`preheat` with an optional temperature (`klima 22°`) warms the car before it leaves. The README has a guide with examples, in English and Danish.
- **The latest charge** and **the charge level until departure**, as a graph, on the car's page.
- **Actions** `ev_household_planner.set_trip` and `ev_household_planner.climate`, for dashboards and automations (a button on the wall, *preheat when the alarm goes off*).
- Setting up a car from its device also finds its climate and its *refresh* button.

## [2.3.1b1] - 2026-11-13

### Fixed

- **A car with its own charger is asked to report.** When the charger sees a plug and the car's cloud has not said so yet, the car is asked to report after 30 seconds, two and eight minutes (and no more once it has answered, as some car clouds allow few calls), also when it always uses that charger. Until it answers, the charger's plug counts: the car is plugged in.
- **Never under 6 A.** A charger whose current goes down to 0 A (a Zaptec Go 2) was turned down below what a car charges on; the guard now stops at 6 A and pauses the car when that is still too much.
- **Up only into room that was free all the last ten minutes**, less 2 A, so a kettle or an oven that comes and goes does not make the guard turn the cars up and down. The plan leaves the 2 A out too, so it is long enough.
- *Keep the charger on* only after the car's own plan in the same plug-in.
- A car's current setting that is another charger's is not used for the car.
- The target slider moves in the car's own steps (a Skoda: tens), and the target sent to the car is rounded up to one.
- The forms no longer say *(beta)*.

### New

- **Charge on after the ready-by time** when the target was not reached, while the car is plugged in (a rule, on by default). Not for a car plugged in just before the ready-by time, nor one left to the sun.
- **The charger's energy meter counts the car's charge**, when the charger has one and it is the car's charger: what the meter counts is what is paid for. The history shows *Charger meter* as the source.
- **Log and support** under *Settings*: one file with everything EV Planner knows and has done, for a question or a bug report. The settings, the plans, what it has learned about each car, a week of events (plug-ins, plans, decisions, commands, the guard, pairing, notifications, settings changes), its log lines, and every entity it uses and its own, with their attributes and the last 48 hours of history. Locations, number plates, VINs and keys are left out. The same file is the integration's diagnostics.
- A guest who unplugged after the charge is cleared after half an hour; the charge stays in the history. The button says *Remove the guest* while one is filled in.

## [2.3.0] - 2026-11-12

Everything from the 2.2 and 2.3 betas, for those coming from 2.1.2. The betas below list each change.

### Coming from 2.1.2

- **Nothing to do.** Your cars, chargers, settings, plans, history and entities stay as they are; the entity ids do not change. Your home becomes the place *Home* under the integration by itself.
- **The Home tab** is new in the panel: your house as a clay model, by day and by night, with the cars, chargers, the sun, a home battery and a heat pump. Ten houses to choose from under *Settings → House*.
- **Configure** now has only the currency, the phones, the iOS widgets and an amount added to every price. A shared supply is set on the place *Home*; solar panels, a home battery and a heat pump are added under the integration (*Add solar panels*, ...).

### New

- **A shared supply.** Several cars behind one fuse are planned together under a limit per phase, in line or by need. The *guard* watches the meter and turns the cars down within the minute when the house needs more, holds a heat pump back if it may, and pauses a car as the last thing. Easee's own dynamic limit is used, so the charger falls back by itself if Home Assistant stops.
- **The sun and the home battery.** A car can charge on the surplus (*Sun and plan* or *Only sun*), amp by amp and on one phase when the sun is small, with the home battery first. The surplus is sold instead when a kWh sells for more than the car's plan pays at night. The history shows each charge's share of sun.
- **Places, and cars that find their charger.** A summer house with its own chargers, supply, sun and picture. A car that uses several chargers is found at the one it is plugged in to, by its location, the plugs and the chargers' power, and you are asked on your phones when it cannot be told.
- **The charger and the car back each other up.** When one does not answer a start or a pause, the other one's switch does it.
- **Known prices or the forecast.** A plan for a ready-by time days ahead can use the price forecast, or only the published prices; the button shows what the other would cost.
- **Get started** on the Cars tab for a new household, with what is done ticked off.
- **History** by day, week, month or year for each car, charger, the guests or the whole house, with *Export CSV*; and what EV Planner has learned about each car.
- **The car's page** in three views (*Now*, *Rules*, *History*), and *Settings* as tiles.
- **A price for what you sell** and **an amount added to every price**, for sensors without tariffs.
- **Peblar** (also OK's chargers), **Zaptec** and about 40 other chargers are filled in from their device, with the care each one needs (Peblar: at most three pauses in ten minutes; Zaptec: raised at most every 15 minutes).

### Safer

- A command that fails is tried again later and later, a stop from the guard always goes out, and what was held back is remembered across a restart.
- *Keep the charger on* only leaves a car on when it stops at its target by itself.
- Every release has passed the tests, the panel's tests, 72 simulated nights and days, and an upgrade from the last release.

## [2.3.0b17] - 2026-11-12

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **Known prices or the forecast: one line and one button.** The long notes are gone. The car's card and page show which prices the plan is made from (*Price forecast* or *Known prices*) and a button to change, with what the charge would cost more or less on the other.

## [2.3.0b16] - 2026-11-12

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **A plan that builds on the price forecast says so.** When the ready-by time is further ahead than the published prices (a Friday without a ready-by time, and the next is Monday), the cheapest hours can be ones that only have a forecast. The car's page and card now say that it is a plan for now, made again when the prices come.
- **Use known prices.** A button on that note makes the car's plan from the published prices only: it is charged in the cheapest hours there are prices for, by the ready-by time or by the end of the known prices when that comes first. *Use the forecast* turns it back.

## [2.3.0b15] - 2026-11-12

Beta: only those who show beta versions in the Marketplace get it.

### Changed
- **Zaptec on the sun.** A Zaptec charger's current is raised at most every 15 minutes when it follows the surplus too, as it already was under a shared supply. It is still lowered at once.

### Added
- **The rules and their times** in the README: what EV Planner does by itself and how long it waits, for the shared supply and the guard, the sun, and starting and pausing, in three tables.

## [2.3.0b14] - 2026-11-12

Beta: only those who show beta versions in the Marketplace get it.

### Fixed
- **Keep the charger on does not charge a car past its target.** At the target, a car with *Keep the charger on* was turned on again, and a car whose own limit is higher than the target then charged on to that limit. It is now only left on when it stops at the target by itself: the target is 100 %, or the car's own limit is the target. Otherwise it is paused there.

## [2.3.0b13] - 2026-11-12

Beta: only those who show beta versions in the Marketplace get it.

### Fixed
- **Any price integration, and no integration's name filled in.** Setting up EV Planner suggested `sensor.energi_data_service` whether it was there or not, which read as if Energi Data Service was needed. The form now suggests a sensor in your Home Assistant that has prices EV Planner can read (Nord Pool, Energi Data Service, Stromligning, ENTSO-e, Tibber and others), or none, and the error says what to choose.
- **Where the price sensor is changed** is said where it is shown: under the integration, the three dots by EV Planner → *Reconfigure*.
- **Get started is not shown to a household that is set up.** It could come back with *Electricity prices* unticked while the prices had a hole or an odd unit. It now only asks for prices when none can be read, and then names the sensor and where to change it.
- **A limit of 0 % is not a flat battery.** The numbers for a car's levels (target, minimum, *must have by the ready-by time*, ...) and the guest's had the battery class, so cards that list low batteries showed them as one.
- **Sheets on a wide screen** open in the middle of the screen, not at its bottom edge.

## [2.3.0b12] - 2026-11-11

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **Get started.** A new household sees what to set up, in order, on the Cars tab: prices, a car and a charger first, then the house's supply, the sun, a home battery and a heat pump, and notifications, with what is done ticked off. It is gone when there is a car, a charger and prices.
- The simulator runs nights with two places and cars that find their charger: at home and at the summer house on its own fuse, chargers that are swapped, and a charger or a car that does not answer all night, where the other one's switch does the work. And nights where two cars share a tight supply by need.

### Fixed
- **The guard looks at the meter again each minute.** It acted when the meter's number changed; a meter that stayed on the same too-high number gave it nothing new to act on, and the cars could stay over the limit until the plan was made again. Found by the simulator.
- **The guard turns down the car that has just been started.** When two cars changed places at the top of the hour, the guard could turn down the one that was on its way off, as its sensor still said it charged, and leave the one that had just started.

## [2.3.0b11] - 2026-11-11

Beta: only those who show beta versions in the Marketplace get it.

### Added
- **Eight more houses** for the picture in the Home tab: the long house, the T-house, the H-house, the functionalist house, the wooden summer house, the hipped bungalow, the storey and a half, and the terraced house. Each has its own garage or carport, driveway, roof for the solar panels and places for the chargers, the home battery and the heat pump, and all of it can be moved with *Edit* as before.
- **Each place has its own picture and its own house.** With more than one place, the Home tab has a button for each: the picture, the chargers, the cars and the numbers are then that place's. The house is chosen for each place under *Settings → House* (a new place starts as the wooden summer house), and what is moved in the picture is saved for each place.
- **The surplus is sold when that pays more than the plan costs** ([#12](https://github.com/Dinnsen/ha-ev-planner/issues/12)). A car on *Sun and plan* leaves the surplus to the grid while a kWh is sold for more than the car's plan pays for one in its cheap hours, and says so. *Only sun* is not changed: that car has no plan to charge on instead. The price you sell for is set under the place's solar panels.

### Fixed
- Two labels in the picture could end on top of each other on a phone when a third was just below them.

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
