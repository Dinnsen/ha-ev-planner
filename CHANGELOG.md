# Changelog

All notable changes to EV Planner. The version is the one in `custom_components/ev_planner/manifest.json`.

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
