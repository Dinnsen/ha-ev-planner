/* EV Planner – panel for Home Assistant. No build step, no dependencies.
   Derived from EV Guest's panel: the price clock, the battery and the price graph
   are the same; EV Planner adds the household's own cars, their rules and history. */

const TEXT = {
  da: {
    tab_cars: "Biler",
    tab_guest: "Gæst",
    tab_history: "Historik",
    tab_settings: "Indstillinger",
    loading: "Henter EV Planner …",
    back: "Biler",
    back_label: "Tilbage til bilerne",
    open_car: "Åbn {name}",

    // Overview
    no_cars_title: "Ingen biler endnu",
    no_cars_text: "Tilføj en bil under Indstillinger → Enheder og tjenester → EV Planner → Tilføj bil.",
    add_car: "Tilføj bil",
    connected: "Tilsluttet",
    not_connected: "Ikke tilsluttet",
    away: "Ikke hjemme",
    ready_at: "klar kl. {time}",
    ready_at_day: "klar {day} kl. {time}",
    no_deadline_short: "ingen frist",
    mode_label: "Tilstand",
    mode_smart: "Smart",
    mode_charge_now: "Lad nu",
    mode_pause: "Pause",
    mode_off: "Fra",
    problem: "Bilen skulle lade, men gør det ikke. Tjek bilen og laderen.",
    control_error: "Kunne ikke styre opladningen: {error}",
    no_control_entity: "Der er ingen kontakt at styre opladningen med. Vælg en under bilens indstillinger.",
    note_limited: "Prisloftet tillader ikke hele ladningen.",
    note_min_only: "Kun minimumsniveauet nås under prisloftet.",
    note_short: "Ikke tid nok til at nå målet før kl. {time}.",
    note_short_plain: "Ikke tid nok til at nå målet før fristen.",
    note_opportunistic: "Opportunistisk: prisloftet er {price} lige nu.",
    guest_card: "Gæst",
    guest_none: "Ingen gæst lige nu",
    guest_start: "Start gæsteopladning",
    guest_open: "Åbn gæst",
    chargers: "Ladere",
    charger_released: "Frigivet",
    charger_charge: "Lader",
    charger_pause: "Pause",
    charger_for: "{state} for {name}",
    holder_guest: "gæsten",
    car_plugged: "Bil tilsluttet",
    car_unplugged: "Ingen bil",

    // Charger page, pop-ups and dashboard cards
    charger_cars: "Biler på laderen",
    charger_no_cars: "Ingen biler bruger denne lader.",
    charger_free: "Ledig",
    charger_next: "Næste: {name} kl. {time}",
    open_charger: "Åbn {name}",
    back_to: "Tilbage",
    open_in_panel: "Åbn i EV Planner",
    more_in_panel: "Regler, ugeplan og påmindelser finder du i EV Planner.",
    guest_add: "Tilføj gæst",
    guest_plan_line: "{time} · {cost}",
    card_household: "EV Planner – husstand",
    card_household_desc: "Alle biler, gæsten og laderne på én linje.",
    card_car: "EV Planner – bil",
    card_car_desc: "En bil: batteri, mål, start og pris.",
    card_car_large: "EV Planner – bil, stor",
    card_car_large_desc: "Som bilkortet i EV Planner: prisur, batteri og tilstand.",
    card_guest: "EV Planner – gæst",
    card_guest_desc: "Gæstebilen: tilføj gæst, plan og opladning.",
    card_charger: "EV Planner – lader",
    card_charger_desc: "En lader: hvem der lader, og hvem der er næste.",
    card_missing: "EV Planner er ikke sat op.",
    card_unknown: "Findes ikke længere i EV Planner: {id}",
    ed_vehicle: "Bil",
    ed_charger: "Lader",
    ed_tap: "Tryk på kortet",
    ed_name: "Navn (valgfrit)",
    ed_show_cars: "Vis bilerne",
    ed_show_guest: "Vis gæsten",
    ed_show_chargers: "Vis laderne",
    tap_popup: "Åbn pop-up",
    tap_panel: "Åbn EV Planner",
    tap_none: "Ingenting",

    // Vehicle statuses (const.py VEHICLE_STATUS_OPTIONS)
    vstatus_off: "Fra",
    vstatus_paused: "Pause",
    vstatus_unplugged: "Ikke tilsluttet",
    vstatus_planned: "Planlagt",
    vstatus_charging: "Lader",
    vstatus_charging_now: "Lader nu",
    vstatus_charging_low_soc: "Lavt batteri: lader",
    vstatus_charging_low_price: "Billig strøm: lader",
    vstatus_keeping_on: "Holder laderen tændt",
    vstatus_completed: "Ladet",
    vstatus_no_plan: "Ingen plan",
    vstatus_charger_busy: "Laderen er optaget",
    vstatus_no_soc: "Mangler batteriniveau",
    vstatus_no_price_data: "Ingen priser",
    vstatus_not_enough_prices: "Venter på priser",
    vstatus_no_window: "Ingen ladeperiode før fristen",

    // Car page
    soc_missing: "Mangler batteriniveau",
    soc_from_car: "Nu kommer fra bilen",
    target_from_car: "Målet følger bilens egen ladegrænse",
    min_mark: "Min. {pct}",
    schedule: "Ugeplan",
    schedule_hint: "Ugeplanen bruges kun, når der er en frist.",
    schedule_default: "Std.",
    schedule_use_default: "Standard ({time})",
    schedule_other: "Andet tidspunkt",
    schedule_for: "Klar kl. om {day}",
    day_mon: "Man",
    day_tue: "Tir",
    day_wed: "Ons",
    day_thu: "Tor",
    day_fri: "Fre",
    day_sat: "Lør",
    day_sun: "Søn",
    dayl_mon: "mandagen",
    dayl_tue: "tirsdagen",
    dayl_wed: "onsdagen",
    dayl_thu: "torsdagen",
    dayl_fri: "fredagen",
    dayl_sat: "lørdagen",
    dayl_sun: "søndagen",
    calendar_trip: "Tur i kalenderen: {summary} {when}",
    calendar_target: ", mål {target}",
    calendar_when: "{day} kl. {time}",
    control_source: "Styring",
    control_car: "Bilen",
    control_charger: "Laderen",
    control_none: "Ingen (kun plan)",
    power: "Ladeeffekt",
    rules: "Regler",
    rule_min: "Minimum",
    rule_min_hint: "Nås altid, uanset prisen.",
    rule_ceiling: "Prisloft",
    rule_ceiling_hint: "Lad aldrig, når prisen er højere.",
    rule_low_price: "Lad ved lav pris",
    rule_low_price_hint: "Lad med det samme, når prisen er på eller under.",
    rule_low_soc: "Lad ved lavt batteri",
    rule_low_soc_hint: "Lad med det samme under dette niveau.",
    rule_opp: "Opportunistisk",
    opp_off: "Fra",
    opp_lower: "Sænk loftet",
    opp_follow: "Følg slutprisen",
    opp_off_hint: "Prisloftet bruges, som det er.",
    opp_lower_hint: "Er den sidste kendte pris under {pct} af prisloftet, sænkes loftet dertil – billige priser er på vej.",
    opp_follow_hint: "Prisloftet bliver {pct} af den sidste kendte pris.",
    opp_needs_ceiling: "Kræver et prisloft.",
    opp_level: "Niveau",
    rule_keep_on: "Hold laderen tændt",
    rule_keep_on_hint: "Efter planen, så bilen kan forvarme fra nettet.",
    rule_earliest: "Tidligste start",
    rule_earliest_hint: "Start ikke opladningen før dette tidspunkt.",
    notifications: "Notifikationer",
    reminder: "Påmindelse",
    reminder_hint: "Kl. {time}, hvis bilen er under {soc} og ikke tilsluttet.",
    reminder_time: "Kl.",
    reminder_soc: "Under",
    reminder_price: "Kun når prisen kommer under",
    reminder_days: "Dage",
    reminder_repeat: "Gentag hvert",
    reminder_repeat_hint: "0 = kun én gang. Højst 3 gentagelser om dagen.",
    reminder_horizon: "inden for",
    hours_short: "t",
    minutes_short: "min",
    notify_to: "Send til",
    notify_to_hint: "Gælder alle beskeder om bilen.",
    reminder_price_hint: "Billigste pris det næste døgn skal være under grænsen.",
    live: "Live-notifikation mens den lader",
    notify_done: "Besked når den er ladet",
    notify_missing: "Vælg mobiler under integrationens indstillinger.",
    ceiling_line: "Prisloft",

    // Guest (EV Guest)
    guest: "Gæstebil",
    charge_point: "Ladepunkt",
    plate_placeholder: "AB 12 345",
    lookup: "Slå op",
    looking_up: "Slår op …",
    lookup_needs_key: "Opslag på nummerplade kræver en gratis MotorAPI-nøgle.",
    add_key: "Tilføj nøgle",
    no_car: "Skriv nummerpladen og slå bilen op – eller sæt batteriet selv herunder.",
    no_car_nokey: "Sæt bilens batteri herunder.",
    battery: "Batteri",
    match: "Match",
    match_hint: "Hvor sikkert batteriet passer til bilen",
    model_year: "Årgang",
    charge: "Opladning",
    now_level: "Nu",
    target: "Mål",
    add_energy: "{kwh} i batteriet",
    charger: "Ladeeffekt",
    custom: "Andet",
    ready_by: "Klar kl.",
    no_deadline: "Ingen frist",
    mode: "Plan",
    continuous: "Én periode",
    split: "Billigste perioder",
    calculate: "Beregn plan",
    recalculate: "Beregn igen",
    calculating: "Beregner …",
    new_guest: "Ny gæst",
    guest_charge_now: "Lad nu",
    charging_now_busy: "Starter …",
    charge_now_tag: "Lad nu",
    photo_add: "Tilføj billede",
    photo_change: "Skift billede",
    photo_remove: "Fjern billede",
    photo_saved: "Billedet er gemt",
    photo_saved_cut: "Baggrunden er fjernet – pilen på billedet fortryder",
    photo_cut: "Fjern baggrunden",
    photo_cutting: "Fjerner baggrunden …",
    photo_no_background: "Billedet har ikke en ensfarvet baggrund, der kan fjernes",
    photo_undo: "Fortryd: brug billedet med baggrund",
    photo_restored: "Billedet med baggrund er tilbage",
    photo_removed: "Billedet er fjernet",
    photo_uploading: "Gemmer billedet …",
    photo_failed: "Billedet kunne ikke gemmes: {detail}",
    battery_size: "Batteri",
    model_generic_box: "Ladeboks",
    model_generic_post: "Ladestander",
    model_generic_portable: "Mobil lader",
    model_generic_socket: "Stikkontakt",
    preview: "Forslag",
    changed: "Inputtet er ændret. Beregn igen for at bruge det.",
    price_now: "pr. kWh nu",
    cheapest_at: "Billigst kl. {time}",
    no_prices: "Ingen priser",
    save: "Du sparer {amount}",
    save_short: "Sparer {amount}",
    save_vs: "i forhold til at lade med det samme",
    start: "Start",
    end: "Slut",
    duration: "Tid",
    energy: "Energi",
    cost: "Pris",
    savings: "Besparelse",
    speed: "Hastighed",
    measured: "Målt",
    measured_cost: "Målt pris",
    starts_in: "Starter om {time}",
    charging_until: "Lader – færdig kl. {time}",
    paused_until: "Pause – lader igen kl. {time}",
    completed_at: "Færdig kl. {time}",
    unplugged_at: "Bilen blev koblet fra kl. {time} – laderen er frigivet",
    status_ready: "Klar til en plan",
    status_planned: "Planlagt",
    status_charging: "Lader",
    status_completed: "Afsluttet",
    status_stopped: "Stoppet",
    stopped_at: "Stoppet kl. {time}",
    guest_stop: "Stop ladning",
    stopping: "Stopper …",
    stopped_tag: "Stoppet",
    est_level: "ca. {pct} nu",
    est_level_measured: "ca. {pct} nu, målt",
    behind_plan: "Bilen lader langsommere end planlagt – den når måske ikke målet.",
    prices_title: "Elpris de næste døgn",
    today: "I dag",
    tomorrow: "I morgen",
    day_after: "Overmorgen",
    charging_window: "Opladning",
    deadline: "Frist",
    now: "Nu",
    per_kwh: "pr. kWh",

    // History
    history_empty: "Afsluttede opladninger kommer her, med energi og pris – klar til at afregne med gæsten.",
    car_history_empty: "Afsluttede opladninger kommer her.",
    guests: "Gæster",
    this_month: "Denne måned",
    charges: "Opladninger",
    months_title: "Pris pr. måned",
    show_more: "Vis flere",
    delete_car_history: "Slet bilens historik",
    confirm_delete_car: "Slet alle opladninger for {name}?",
    sessions: "{n} opladninger",
    session: "1 opladning",
    total_energy: "Energi i alt",
    total_cost: "Pris i alt",
    total_saved: "Sparet i alt",
    bill: "Afregn",
    delete: "Slet",
    delete_all: "Slet hele historikken",
    confirm_delete_all: "Slet alle afsluttede gæsteopladninger?",
    unknown_car: "Ukendt bil",
    bill_title: "Afregning",
    bill_text_intro: "Opladning af {car}",
    bill_line_energy: "Energi: {kwh}",
    bill_line_price: "Pris: {amount}",
    bill_line_rate: "({rate} pr. kWh)",
    bill_line_date: "Dato: {date}",
    copy: "Kopiér",
    copied: "Kopieret",
    share: "Del",
    close: "Luk",
    by_actual: "Faktisk elpris",
    by_rate: "Fast pris pr. kWh",

    // Settings
    settings_billing: "Afregning med gæster",
    bill_rate: "Pris pr. kWh",
    bill_rate_hint: "Tom: brug den faktiske elpris fra planen eller elmåleren.",
    payment_text: "Betalingsoplysninger",
    payment_hint: "Kommer med i afregningen, fx MobilePay-nummer.",
    settings_guest: "Gæsteopladning",
    efficiency: "Ladeeffektivitet",
    efficiency_hint: "Andelen af strømmen, der ender i batteriet. 90 % passer til de fleste biler.",
    settings_sources: "Opsætning",
    settings_notifications: "Notifikationer",
    notify_language: "Sprog i notifikationer",
    notify_language_hint: "Automatisk følger Home Assistants sprog (Indstillinger → System → Generelt).",
    lang_auto: "Automatisk",
    lang_da: "Dansk",
    lang_en: "English",
    price_sensor: "Prissensor",
    notify_phones: "Mobiler",
    widgets_refresh: "Opdater widgets",
    not_set: "Ikke valgt",
    on: "Til",
    off: "Fra",
    change_in_ha: "Skift under Indstillinger → Enheder og tjenester → EV Planner.",
    open_integration: "Åbn integrationen",
    app_title: "App på hjemmeskærmen",
    app_hint: "Åbn linket på telefonen og vælg Føj til hjemmeskærm.",
    open_app: "Åbn app",
    widgets_title: "Widgets",
    widgets_text: "iOS: Tilføj et Home Assistant-widget (Brugerdefineret, Gauge eller Sensorer) og vælg fx sensor.<bil>_summary, sensor.<bil>_status og din bils batteri.",
    saved: "Gemt",

    // Errors
    err_invalid_input: "Batterikapacitet og ladeeffekt skal være over 0.",
    err_limit_not_above_soc: "Målet skal være højere end bilens ladeniveau nu.",
    err_no_price_data: "Prissensoren har ingen priser lige nu.",
    err_not_enough_prices: "Der er endnu ikke priser nok før fristen. EV Planner beregner selv, når priserne kommer (typisk efter kl. 13).",
    err_no_window: "Opladningen kan ikke nå at blive færdig før fristen. Hæv ladeeffekten, sænk målet eller flyt fristen.",
    err_license_plate_required: "Skriv en nummerplade først.",
    err_motorapi_key_missing: "Opslag kræver en MotorAPI-nøgle.",
    err_invalid_api_key: "MotorAPI afviste nøglen. Home Assistant beder dig om en ny.",
    err_vehicle_not_found: "Der findes ingen bil med den nummerplade.",
    err_lookup_failed: "Opslaget fejlede. Prøv igen om lidt.",
    err_entry_not_found: "EV Planner er ikke sat op.",
    err_car_not_found: "Bilen findes ikke længere i EV Planner.",
    err_invalid_mode: "Ukendt tilstand.",
    err_unknown: "Noget gik galt: {detail}",
    hours_short: "t",
    minutes_short: "min",
  },
  en: {
    tab_cars: "Cars",
    tab_guest: "Guest",
    tab_history: "History",
    tab_settings: "Settings",
    loading: "Loading EV Planner …",
    back: "Cars",
    back_label: "Back to the cars",
    open_car: "Open {name}",

    no_cars_title: "No cars yet",
    no_cars_text: "Add a car under Settings → Devices & services → EV Planner → Add car.",
    add_car: "Add car",
    connected: "Plugged in",
    not_connected: "Not plugged in",
    away: "Away",
    ready_at: "ready by {time}",
    ready_at_day: "ready {day} {time}",
    no_deadline_short: "no deadline",
    mode_label: "Mode",
    mode_smart: "Smart",
    mode_charge_now: "Charge now",
    mode_pause: "Pause",
    mode_off: "Off",
    problem: "The car should be charging, but it is not. Check the car and the charger.",
    control_error: "Could not control charging: {error}",
    no_control_entity: "There is no switch to control charging with. Choose one in the car's options.",
    note_limited: "The price ceiling does not allow the full charge.",
    note_min_only: "Only the minimum level is reached under the price ceiling.",
    note_short: "Not enough time to reach the target by {time}.",
    note_short_plain: "Not enough time to reach the target before the deadline.",
    note_opportunistic: "Opportunistic: the price ceiling is {price} right now.",
    guest_card: "Guest",
    guest_none: "No guest right now",
    guest_start: "Start guest charging",
    guest_open: "Open guest",
    chargers: "Chargers",
    charger_released: "Released",
    charger_charge: "Charging",
    charger_pause: "Paused",
    charger_for: "{state} for {name}",
    holder_guest: "the guest",
    car_plugged: "Car plugged in",
    car_unplugged: "No car",

    // Charger page, pop-ups and dashboard cards
    charger_cars: "Cars on this charger",
    charger_no_cars: "No car uses this charger.",
    charger_free: "Free",
    charger_next: "Next: {name} at {time}",
    open_charger: "Open {name}",
    back_to: "Back",
    open_in_panel: "Open in EV Planner",
    more_in_panel: "Rules, the weekly plan and reminders are in EV Planner.",
    guest_add: "Add guest",
    guest_plan_line: "{time} · {cost}",
    card_household: "EV Planner – household",
    card_household_desc: "All cars, the guest and the chargers on one line.",
    card_car: "EV Planner – car",
    card_car_desc: "One car: battery, target, start and cost.",
    card_car_large: "EV Planner – car, large",
    card_car_large_desc: "Like the car card in EV Planner: price clock, battery and mode.",
    card_guest: "EV Planner – guest",
    card_guest_desc: "The guest car: add a guest, the plan and charging.",
    card_charger: "EV Planner – charger",
    card_charger_desc: "One charger: who charges and who is next.",
    card_missing: "EV Planner is not set up.",
    card_unknown: "No longer in EV Planner: {id}",
    ed_vehicle: "Car",
    ed_charger: "Charger",
    ed_tap: "Tapping the card",
    ed_name: "Name (optional)",
    ed_show_cars: "Show the cars",
    ed_show_guest: "Show the guest",
    ed_show_chargers: "Show the chargers",
    tap_popup: "Opens a pop-up",
    tap_panel: "Opens EV Planner",
    tap_none: "Does nothing",

    vstatus_off: "Off",
    vstatus_paused: "Paused",
    vstatus_unplugged: "Not plugged in",
    vstatus_planned: "Planned",
    vstatus_charging: "Charging",
    vstatus_charging_now: "Charging now",
    vstatus_charging_low_soc: "Low battery: charging",
    vstatus_charging_low_price: "Cheap power: charging",
    vstatus_keeping_on: "Keeping the charger on",
    vstatus_completed: "Charged",
    vstatus_no_plan: "No plan",
    vstatus_charger_busy: "Charger in use",
    vstatus_no_soc: "Battery level missing",
    vstatus_no_price_data: "No prices",
    vstatus_not_enough_prices: "Waiting for prices",
    vstatus_no_window: "No charging window before the deadline",

    soc_missing: "Battery level missing",
    soc_from_car: "Now comes from the car",
    target_from_car: "The target follows the car's own charge limit",
    min_mark: "Min. {pct}",
    schedule: "Week plan",
    schedule_hint: "The week plan is only used with a deadline.",
    schedule_default: "Std.",
    schedule_use_default: "Default ({time})",
    schedule_other: "Other time",
    schedule_for: "Ready by on {day}",
    day_mon: "Mon",
    day_tue: "Tue",
    day_wed: "Wed",
    day_thu: "Thu",
    day_fri: "Fri",
    day_sat: "Sat",
    day_sun: "Sun",
    dayl_mon: "Mondays",
    dayl_tue: "Tuesdays",
    dayl_wed: "Wednesdays",
    dayl_thu: "Thursdays",
    dayl_fri: "Fridays",
    dayl_sat: "Saturdays",
    dayl_sun: "Sundays",
    calendar_trip: "Trip in the calendar: {summary} {when}",
    calendar_target: ", target {target}",
    calendar_when: "{day} at {time}",
    control_source: "Control",
    control_car: "The car",
    control_charger: "The charger",
    control_none: "None (plan only)",
    power: "Charging power",
    rules: "Rules",
    rule_min: "Minimum",
    rule_min_hint: "Always reached, whatever the price.",
    rule_ceiling: "Price ceiling",
    rule_ceiling_hint: "Never charge when the price is higher.",
    rule_low_price: "Charge at a low price",
    rule_low_price_hint: "Charge right away when the price is at or below.",
    rule_low_soc: "Charge at a low battery",
    rule_low_soc_hint: "Charge right away below this level.",
    rule_opp: "Opportunistic",
    opp_off: "Off",
    opp_lower: "Lower ceiling",
    opp_follow: "Follow end price",
    opp_off_hint: "The price ceiling is used as it is.",
    opp_lower_hint: "When the last known price is below {pct} of the ceiling, the ceiling drops to that – cheap prices are coming.",
    opp_follow_hint: "The ceiling becomes {pct} of the last known price.",
    opp_needs_ceiling: "Needs a price ceiling.",
    opp_level: "Level",
    rule_keep_on: "Keep the charger on",
    rule_keep_on_hint: "After the plan, so the car can precondition from the grid.",
    rule_earliest: "Earliest start",
    rule_earliest_hint: "Do not start charging before this time.",
    notifications: "Notifications",
    reminder: "Reminder",
    reminder_hint: "At {time} when the car is below {soc} and not plugged in.",
    reminder_time: "At",
    reminder_soc: "Below",
    reminder_price: "Only when the price drops below",
    reminder_days: "Days",
    reminder_repeat: "Repeat every",
    reminder_repeat_hint: "0 = only once. At most 3 repeats a day.",
    reminder_horizon: "within",
    hours_short: "h",
    minutes_short: "min",
    notify_to: "Send to",
    notify_to_hint: "For all messages about the car.",
    reminder_price_hint: "The cheapest price in the coming day must be below the limit.",
    live: "Live notification while charging",
    notify_done: "Message when charged",
    notify_missing: "Choose phones in the integration's options.",
    ceiling_line: "Ceiling",

    guest: "Guest car",
    charge_point: "Charger",
    plate_placeholder: "AB 12 345",
    lookup: "Look up",
    looking_up: "Looking up …",
    lookup_needs_key: "License plate lookup needs a free MotorAPI key.",
    add_key: "Add key",
    no_car: "Enter the license plate and look up the car – or set the battery yourself below.",
    no_car_nokey: "Set the car's battery below.",
    battery: "Battery",
    match: "Match",
    match_hint: "How sure the battery match is",
    model_year: "Year",
    charge: "Charging",
    now_level: "Now",
    target: "Target",
    add_energy: "{kwh} into the battery",
    charger: "Charger power",
    custom: "Other",
    ready_by: "Ready by",
    no_deadline: "No deadline",
    mode: "Plan",
    continuous: "One period",
    split: "Cheapest periods",
    calculate: "Make plan",
    recalculate: "Plan again",
    calculating: "Planning …",
    new_guest: "New guest",
    guest_charge_now: "Charge now",
    charging_now_busy: "Starting …",
    charge_now_tag: "Charge now",
    photo_add: "Add photo",
    photo_change: "Change photo",
    photo_remove: "Remove photo",
    photo_saved: "The photo is saved",
    photo_saved_cut: "The background is removed – the arrow on the photo undoes it",
    photo_cut: "Remove the background",
    photo_cutting: "Removing the background …",
    photo_no_background: "The photo has no plain background to remove",
    photo_undo: "Undo: use the photo with its background",
    photo_restored: "The photo with its background is back",
    photo_removed: "The photo is removed",
    photo_uploading: "Saving the photo …",
    photo_failed: "The photo could not be saved: {detail}",
    battery_size: "Battery",
    model_generic_box: "Wall charger",
    model_generic_post: "Charging post",
    model_generic_portable: "Portable charger",
    model_generic_socket: "Household socket",
    preview: "Preview",
    changed: "The inputs changed. Plan again to use them.",
    price_now: "per kWh now",
    cheapest_at: "Cheapest at {time}",
    no_prices: "No prices",
    save: "You save {amount}",
    save_short: "Saves {amount}",
    save_vs: "compared with charging right away",
    start: "Start",
    end: "End",
    duration: "Time",
    energy: "Energy",
    cost: "Cost",
    savings: "Savings",
    speed: "Speed",
    measured: "Measured",
    measured_cost: "Measured cost",
    starts_in: "Starts in {time}",
    charging_until: "Charging – done at {time}",
    paused_until: "Paused – charging again at {time}",
    completed_at: "Done at {time}",
    unplugged_at: "The car was unplugged at {time} – the charger is released",
    status_ready: "Ready for a plan",
    status_planned: "Planned",
    status_charging: "Charging",
    status_completed: "Completed",
    status_stopped: "Stopped",
    stopped_at: "Stopped at {time}",
    guest_stop: "Stop charging",
    stopping: "Stopping …",
    stopped_tag: "Stopped",
    est_level: "about {pct} now",
    est_level_measured: "about {pct} now, measured",
    behind_plan: "The car charges slower than planned – it may not reach the target.",
    prices_title: "Electricity price, the next days",
    today: "Today",
    tomorrow: "Tomorrow",
    day_after: "Day after",
    charging_window: "Charging",
    deadline: "Deadline",
    now: "Now",
    per_kwh: "per kWh",

    history_empty: "Finished charges show up here, with energy and cost – ready to settle up with your guest.",
    car_history_empty: "Finished charges show up here.",
    guests: "Guests",
    this_month: "This month",
    charges: "Charges",
    months_title: "Cost per month",
    show_more: "Show more",
    delete_car_history: "Delete the car's history",
    confirm_delete_car: "Delete all charges of {name}?",
    sessions: "{n} charges",
    session: "1 charge",
    total_energy: "Total energy",
    total_cost: "Total cost",
    total_saved: "Total saved",
    bill: "Bill",
    delete: "Delete",
    delete_all: "Delete all history",
    confirm_delete_all: "Delete all finished guest charges?",
    unknown_car: "Unknown car",
    bill_title: "Bill",
    bill_text_intro: "Charging of {car}",
    bill_line_energy: "Energy: {kwh}",
    bill_line_price: "Price: {amount}",
    bill_line_rate: "({rate} per kWh)",
    bill_line_date: "Date: {date}",
    copy: "Copy",
    copied: "Copied",
    share: "Share",
    close: "Close",
    by_actual: "Actual electricity price",
    by_rate: "Fixed price per kWh",

    settings_billing: "Billing guests",
    bill_rate: "Price per kWh",
    bill_rate_hint: "Empty: use the actual price from the plan or the energy meter.",
    payment_text: "Payment details",
    payment_hint: "Added to the bill, e.g. a phone number for payment.",
    settings_guest: "Guest charging",
    efficiency: "Charging efficiency",
    efficiency_hint: "The share of the energy that ends up in the battery. 90 % suits most cars.",
    settings_sources: "Setup",
    settings_notifications: "Notifications",
    notify_language: "Language of notifications",
    notify_language_hint: "Automatic follows Home Assistant's language (Settings → System → General).",
    lang_auto: "Automatic",
    lang_da: "Dansk",
    lang_en: "English",
    price_sensor: "Price sensor",
    notify_phones: "Phones",
    widgets_refresh: "Refresh widgets",
    not_set: "Not set",
    on: "On",
    off: "Off",
    change_in_ha: "Change under Settings → Devices & services → EV Planner.",
    open_integration: "Open the integration",
    app_title: "App on the home screen",
    app_hint: "Open the link on your phone and choose Add to Home Screen.",
    open_app: "Open app",
    widgets_title: "Widgets",
    widgets_text: "iOS: Add a Home Assistant widget (Custom, Gauge or Sensors) and pick e.g. sensor.<car>_summary, sensor.<car>_status and your car's battery.",
    saved: "Saved",

    err_invalid_input: "Battery capacity and charger power must be above 0.",
    err_limit_not_above_soc: "The target must be above the car's charge level now.",
    err_no_price_data: "The price sensor has no prices right now.",
    err_not_enough_prices: "Not enough prices before the deadline yet. EV Planner plans by itself when they arrive (usually after 13:00).",
    err_no_window: "Charging can't finish before the deadline. Raise the charger power, lower the target or move the deadline.",
    err_license_plate_required: "Enter a license plate first.",
    err_motorapi_key_missing: "Lookup needs a MotorAPI key.",
    err_invalid_api_key: "MotorAPI rejected the key. Home Assistant asks you for a new one.",
    err_vehicle_not_found: "No car has that license plate.",
    err_lookup_failed: "The lookup failed. Try again shortly.",
    err_entry_not_found: "EV Planner is not set up.",
    err_car_not_found: "This car is no longer part of EV Planner.",
    err_invalid_mode: "Unknown mode.",
    err_unknown: "Something went wrong: {detail}",
    hours_short: "h",
    minutes_short: "min",
  },
};

const CHARGER_PRESETS = [3.7, 7.4, 11, 22];
const DEADLINE_PRESETS = ["06:00", "07:00", "08:00"];
const MODES = ["smart", "charge_now", "pause", "off"];
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const OPPORTUNISTIC = ["off", "lower_ceiling", "follow_end_price"];
const TABS = ["cars", "guest", "history", "settings"];
const TAB_KEY = "ev-planner-tab";
const CAR_KEY = "ev-planner-car";
const PREVIEW_DELAY = 140;
const COMMIT_DELAY = 600;
const HISTORY_PAGE = 12;

/* Vehicle status → tone of the pill and the status line. */
const STATUS_TONE = {
  planned: "teal",
  charging: "teal",
  charging_now: "teal",
  charging_low_soc: "teal",
  charging_low_price: "teal",
  keeping_on: "teal",
  completed: "teal",
  unplugged: "sand",
  no_plan: "sand",
  charger_busy: "sand",
  not_enough_prices: "sand",
  no_soc: "coral",
  no_price_data: "coral",
  no_window: "coral",
  off: "grey",
  paused: "grey",
};

const ICONS = {
  charge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.5 6 13.2h5.2L10 21.5l7-10.7h-5.2z"/></svg>',
  history: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11.5 6.6 7a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11.5"/><rect x="3.5" y="11.5" width="17" height="5.5" rx="1.5"/><path d="M6.5 17v2.5M17.5 17v2.5M7 14.2h.01M17 14.2h.01"/></svg>',
  guest: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M18 8v6M15 11h6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke-opacity=".35"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" stroke-width="2.6"/><path d="M12.6 8.3 10.2 12.3h3.2l-1.2 3.5"/></svg>',
  depart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20.5V4M6 4.5h11l-2.2 3.7L17 12H6"/></svg>',
  rules: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h17" stroke-dasharray="2.2 2.4"/><path d="M6.5 20v-6M10.5 20v-9.5M14.5 20v-4M18.5 20v-7.5"/></svg>',
  lowprice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 3.5h7.9v7.9l-9 9a1.5 1.5 0 0 1-2.1 0l-5.8-5.8a1.5 1.5 0 0 1 0-2.1z"/><circle cx="16.3" cy="7.7" r="1.3"/></svg>',
  charger: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="10" height="17" rx="2"/><path d="M14 9h1.5a2 2 0 0 1 2 2v4.5a1.5 1.5 0 0 0 3 0V8.5L18.8 6.5M9.6 7.5 7.6 11h3l-2 3.5"/></svg>',
  boost: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.5 6 13.2h5.2L10 21.5l7-10.7h-5.2z"/><path d="M19.5 4.5v4M17.5 6.5h4" stroke-width="1.6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.8a2 2 0 0 0 4 0"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
  off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v8"/><path d="M7 6.5a7 7 0 1 0 10 0"/></svg>',
  warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  wand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 11-11M14 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1zM19 11l.6-1.2L21 9.2l-1.4-.6L19 7.4l-.6 1.2-1.4.6 1.4.6zM8 4l.5-1 .5 1 1 .5-1 .5L8.5 6 8 5l-1-.5z"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.8" r="3.3"/></svg>',
};

/* Our own drawings of the kinds of chargers (no manufacturer photos), by catalog style. */
const CHARGER_ART = {
  box: `<rect x="14" y="8" width="36" height="42" rx="7"/><rect x="22" y="16" width="20" height="10" rx="2.5" class="glass"/><circle cx="32" cy="36" r="4" class="led"/><path d="M32 50v4a6 6 0 0 0 6 6h10"/>`,
  slim: `<rect x="21" y="4" width="22" height="50" rx="7"/><path d="M27 14h10" class="led"/><circle cx="32" cy="30" r="5" class="glass"/><path d="M32 54v3a5 5 0 0 0 5 5h12"/>`,
  round: `<circle cx="32" cy="28" r="20"/><circle cx="32" cy="28" r="11" class="glass"/><path d="M28 28h8" class="led"/><path d="M32 48v6a6 6 0 0 0 6 6h10"/>`,
  post: `<rect x="22" y="4" width="20" height="44" rx="5"/><rect x="26" y="10" width="12" height="8" rx="2" class="glass"/><circle cx="32" cy="26" r="2.6" class="led"/><path d="M18 60h28M26 48v12M38 48v12"/>`,
  portable: `<rect x="12" y="22" width="26" height="18" rx="5"/><path d="M18 31h6" class="led"/><path d="M38 31h6a6 6 0 0 1 6 6v8M6 31h6"/><rect x="45" y="45" width="10" height="9" rx="2.5" class="glass"/><path d="M2 27v8"/>`,
  socket: `<rect x="12" y="12" width="40" height="40" rx="9"/><circle cx="32" cy="32" r="13" class="glass"/><circle cx="27" cy="32" r="1.8" class="led"/><circle cx="37" cy="32" r="1.8" class="led"/>`,
};

function chargerArt(style) {
  return `<svg class="art" viewBox="0 0 64 64" aria-hidden="true">${CHARGER_ART[style] || CHARGER_ART.box}</svg>`;
}

/* Make a photo fit for a card: at most 1280 px, and a normal photo stays a JPEG.
   With cutout, a plain background (black, white or any one colour) is also cut
   away and the subject trimmed to fill the frame (PNG, see-through). Returns
   { blob, cut }: the photo, and the cut-out or null when there was no plain
   background to remove. The photo itself is never changed, so a cut can be undone. */
async function preparePhoto(source, { cutout = true, max = 1280 } = {}) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch (err) {
    if (["image/jpeg", "image/png", "image/gif"].includes(source.type)) return { blob: source, cut: null };
    throw err;
  }
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const transparent = hasTransparency(img);
  const blob = await canvasBlob(canvas, transparent);
  if (!cutout || transparent || !removePlainBackground(img)) return { blob, cut: null };
  const cutCanvas = document.createElement("canvas");
  cutCanvas.width = canvas.width;
  cutCanvas.height = canvas.height;
  cutCanvas.getContext("2d").putImageData(img, 0, 0);
  return { blob, cut: await canvasBlob(trimmed(cutCanvas, img), true) };
}

function canvasBlob(canvas, transparent) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("image"))),
      transparent ? "image/png" : "image/jpeg",
      transparent ? undefined : 0.9,
    ),
  );
}

/* Trim the see-through edges away, keeping a little air around the subject. */
function trimmed(canvas, img) {
  const box = opaqueBox(img);
  if (!box) return canvas;
  const pad = Math.round(Math.max(box.w, box.h) * 0.04);
  const out = document.createElement("canvas");
  out.width = box.w + pad * 2;
  out.height = box.h + pad * 2;
  out.getContext("2d").drawImage(canvas, box.x, box.y, box.w, box.h, pad, pad, box.w, box.h);
  return out;
}

function hasTransparency(img) {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) return true;
  return false;
}

/* Cut away a plain background (black, white or any one colour) that touches the
   edges. Works on ImageData in place and returns true when it removed one.
   - the background colour is the median of the border, and most of the border must be it;
   - a flood fill from the border takes what is clearly background (on a lightly
     blurred copy, so JPEG noise and dithering do not leave specks);
   - a narrow band along the cut gets a soft edge, and the colour of the
     background is taken out of those pixels, so there is no dark or light rim;
   - loose specks that are left are dropped. */
function removePlainBackground(img) {
  const { width: w, height: h, data: d } = img;
  const n = w * h;
  if (w < 16 || h < 16) return false;
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  const median = (c) => {
    const values = border.map((p) => d[p * 4 + c]).sort((a, b) => a - b);
    return values[values.length >> 1];
  };
  const bg = [median(0), median(1), median(2)];
  // A lightly blurred copy, so noise does not decide where the edge goes.
  const dist = new Float32Array(n);
  const B = Math.min(w, h) > 400 ? 2 : 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, k = 0;
      for (let yy = Math.max(0, y - B); yy <= Math.min(h - 1, y + B); yy++) {
        for (let xx = Math.max(0, x - B); xx <= Math.min(w - 1, x + B); xx++) {
          const q = (yy * w + xx) * 4;
          r += d[q]; g += d[q + 1]; b += d[q + 2]; k++;
        }
      }
      const dr = r / k - bg[0], dg = g / k - bg[1], db = b / k - bg[2];
      dist[y * w + x] = Math.sqrt(dr * dr + dg * dg + db * db);
    }
  }
  // Only a plain background: nearly the whole border is that one colour.
  let plain = 0;
  for (const p of border) if (dist[p] < 24) plain++;
  if (plain < border.length * 0.85) return false;
  const light = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2];
  // What is surely background, and from where on it is surely the subject.
  const low = light < 60 ? 12 : light > 200 ? 16 : 20;
  const high = low * 3.5;
  const removed = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (const p of border) if (!removed[p] && dist[p] <= low) { removed[p] = 1; queue[tail++] = p; }
  const each = (p, fn) => {
    const x = p % w;
    if (x > 0) fn(p - 1);
    if (x < w - 1) fn(p + 1);
    if (p >= w) fn(p - w);
    if (p < n - w) fn(p + w);
  };
  while (head < tail) {
    const p = queue[head++];
    each(p, (q) => {
      if (!removed[q] && dist[q] <= low) { removed[q] = 1; queue[tail++] = q; }
    });
  }
  // Nothing much, or everything, removed: leave the photo as it is.
  if (tail < n * 0.03 || tail > n * 0.97) return false;

  // Smooth the outline: a pixel follows what most of its neighbourhood is.
  const R = Math.max(2, Math.round(Math.min(w, h) / 200));
  const side = 2 * R + 1;
  for (let pass = 0; pass < 2; pass++) {
    const sum = new Int32Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += removed[y * w + x];
        sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row;
      }
    }
    const next = removed.slice();
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1);
        const count = sum[y1 * (w + 1) + x1] - sum[y0 * (w + 1) + x1] - sum[y1 * (w + 1) + x0] + sum[y0 * (w + 1) + x0];
        const area = (y1 - y0) * (x1 - x0);
        if (count === 0 || count === area) continue;
        const p = y * w + x;
        // Only where it looks like the background can a pixel become background.
        if (count * 2 > area && dist[p] < low * 3.5) next[p] = 1;
        else if (count * 2 < area) next[p] = 0;
      }
    }
    removed.set(next);
  }

  // Drop specks: keep the subject (the largest piece) and any piece of a fair size.
  const piece = new Int32Array(n).fill(-1);
  const sizes = [];
  for (let p = 0; p < n; p++) {
    if (removed[p] || piece[p] >= 0) continue;
    const id = sizes.length;
    head = tail = 0;
    queue[tail++] = p;
    piece[p] = id;
    while (head < tail) {
      each(queue[head++], (q) => {
        if (!removed[q] && piece[q] < 0) { piece[q] = id; queue[tail++] = q; }
      });
    }
    sizes.push(tail);
  }
  const largest = Math.max(...sizes);
  const keep = sizes.map((size) => size >= largest * 0.02 && size >= n * 0.0005);
  for (let p = 0; p < n; p++) if (!removed[p] && !keep[piece[p]]) removed[p] = 1;

  // How far each kept pixel is from the background (up to the width of the soft edge).
  const BAND = 3;
  const far = new Uint8Array(n).fill(255);
  head = tail = 0;
  for (let p = 0; p < n; p++) {
    if (removed[p]) continue;
    let edge = false;
    each(p, (q) => { if (removed[q]) edge = true; });
    if (edge) { far[p] = 1; queue[tail++] = p; }
  }
  while (head < tail) {
    const p = queue[head++];
    if (far[p] >= BAND) continue;
    each(p, (q) => {
      if (!removed[q] && far[q] === 255) { far[q] = far[p] + 1; queue[tail++] = q; }
    });
  }
  const alpha = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    if (removed[p]) continue;
    if (far[p] > BAND) { alpha[p] = 1; continue; }
    // Close to the background: as see-through as the pixel looks like background.
    const t = Math.min(1, Math.max(0, (dist[p] - low) / (high - low)));
    alpha[p] = Math.max(t * t * (3 - 2 * t), (far[p] - 1) / BAND);
  }
  // A light blur of the edge, so it is not jagged.
  const soft = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    if (far[p] > BAND + 1 && !removed[p]) { soft[p] = 1; continue; }
    const x = p % w;
    let sum = alpha[p] * 4, k = 4;
    each(p, (q) => { sum += alpha[q]; k++; });
    if (x > 0 && p >= w) { sum += alpha[p - w - 1] * 0.5; k += 0.5; }
    if (x < w - 1 && p >= w) { sum += alpha[p - w + 1] * 0.5; k += 0.5; }
    if (x > 0 && p < n - w) { sum += alpha[p + w - 1] * 0.5; k += 0.5; }
    if (x < w - 1 && p < n - w) { sum += alpha[p + w + 1] * 0.5; k += 0.5; }
    soft[p] = Math.min(alpha[p] > 0 ? 1 : 0.5, sum / k);
  }
  for (let p = 0; p < n; p++) {
    const a = soft[p];
    const i = p * 4;
    if (a < 0.02) { d[i + 3] = 0; continue; }
    if (a < 0.999) {
      // Take the background's colour out of a see-through pixel, so no rim is left.
      for (let c = 0; c < 3; c++) d[i + c] = Math.round(Math.min(255, Math.max(0, (d[i + c] - (1 - a) * bg[c]) / a)));
    }
    d[i + 3] = Math.round(a * 255);
  }
  return true;
}

/* The part of the picture that is not transparent. */
function opaqueBox(img) {
  const { width: w, height: h, data: d } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* Each mode's icon in the segmented control. */
const MODE_ICONS = { smart: "plan", charge_now: "boost", pause: "pause", off: "off" };

const MARK = `<svg viewBox="0 0 256 256" aria-hidden="true">
  <defs><linearGradient id="evp-mark" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#00B894"/><stop offset="1" stop-color="#A3E635"/></linearGradient></defs>
  <path class="seg" style="--k:0" d="M132.59 11.09 A117 117 0 0 1 182.48 24.46 L167.58 52.78 A85 85 0 0 0 131.34 43.07Z" fill="#00b894"/>
  <path class="seg" style="--k:1" d="M190.43 29.05 A117 117 0 0 1 226.95 65.57 L199.89 82.64 A85 85 0 0 0 173.36 56.11Z" fill="#52cf64"/>
  <path class="seg" style="--k:2" d="M231.54 73.52 A117 117 0 0 1 244.91 123.41 L212.93 124.66 A85 85 0 0 0 203.22 88.42Z" fill="#a3e635"/>
  <path d="M244.91 132.59 A117 117 0 0 1 231.54 182.48 L203.22 167.58 A85 85 0 0 0 212.93 131.34Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M226.95 190.43 A117 117 0 0 1 190.43 226.95 L173.36 199.89 A85 85 0 0 0 199.89 173.36Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M182.48 231.54 A117 117 0 0 1 132.59 244.91 L131.34 212.93 A85 85 0 0 0 167.58 203.22Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M123.41 244.91 A117 117 0 0 1 73.52 231.54 L88.42 203.22 A85 85 0 0 0 124.66 212.93Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M65.57 226.95 A117 117 0 0 1 29.05 190.43 L56.11 173.36 A85 85 0 0 0 82.64 199.89Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M24.46 182.48 A117 117 0 0 1 11.09 132.59 L43.07 131.34 A85 85 0 0 0 52.78 167.58Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M11.09 123.41 A117 117 0 0 1 24.46 73.52 L52.78 88.42 A85 85 0 0 0 43.07 124.66Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M29.05 65.57 A117 117 0 0 1 65.57 29.05 L82.64 56.11 A85 85 0 0 0 56.11 82.64Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M73.52 24.46 A117 117 0 0 1 123.41 11.09 L124.66 43.07 A85 85 0 0 0 88.42 52.78Z" fill="currentColor" fill-opacity=".22"/>
  <path d="M141 50 L84 140 H124 L111 206 L172 112 H132 Z" fill="url(#evp-mark)" stroke="url(#evp-mark)" stroke-width="8" stroke-linejoin="round" transform="translate(128 128) scale(0.82) translate(-128 -128)"/>
</svg>`;

/* Gradients and filters of the clocks and the price graph, inside each SVG (references across SVGs are unreliable in a shadow root). */
const DIAL_DEFS = `<defs><linearGradient id="evp-win" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#00B894"/><stop offset="1" stop-color="#A3E635"/></linearGradient>
  <filter id="evp-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
const TIMELINE_DEFS = `<defs><linearGradient id="evp-tw" x1="0" x2="1"><stop offset="0" stop-color="#00B894"/><stop offset="1" stop-color="#A3E635"/></linearGradient></defs>`;

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cssId = (value) =>
  typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&");
const isNum = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
const hasSegments = (plan) => Boolean(plan && Array.isArray(plan.segments) && plan.segments.length);

/* Price colour: cheap teal, middle sand, expensive coral – relative to the shown prices. */
function priceColor(t) {
  const stops = [
    [0, [0, 184, 148]],
    [0.5, [233, 185, 73]],
    [1, [228, 87, 46]],
  ];
  t = clamp(Number.isFinite(t) ? t : 0.5, 0, 1);
  const i = t <= 0.5 ? 0 : 1;
  const [t0, c0] = stops[i];
  const [t1, c1] = stops[i + 1];
  const k = (t - t0) / (t1 - t0);
  const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/* A point on a circle; 0 h is at the top, like a 24-hour clock. */
function polar(cx, cy, r, hours) {
  const a = ((hours / 24) * 360 - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, r, fromH, toH) {
  const span = clamp(toH - fromH, 0, 23.999);
  const [x1, y1] = polar(cx, cy, r, fromH);
  const [x2, y2] = polar(cx, cy, r, fromH + span);
  const large = span > 12 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/* The next moment at HH:MM (today, or tomorrow when it has passed). */
function nextAt(hhmm, from = new Date()) {
  const [hh, mm] = String(hhmm || "07:00").split(":").map(Number);
  const moment = new Date(from);
  moment.setHours(hh || 0, mm || 0, 0, 0);
  if (moment <= from) moment.setDate(moment.getDate() + 1);
  return moment;
}

const WEEKDAY_OF_JS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

class EvPlannerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const tab = this._read(TAB_KEY);
    this._tab = TABS.includes(tab) ? tab : "cars";
    this._carId = this._read(CAR_KEY) || null;
    // A charger's page, the route Home Assistant opened the panel on, and the view of a pop-up.
    this._chargerId = null;
    this._routePath = null;
    this._embed = null;
    this._state = null;
    this._busy = null;
    this._message = null;
    this._unsub = null;
    this._tick = null;
    this._animatePlan = false;
    this._lastPlanKey = null;
    this._lastView = null;
    this._shown = new Set();
    // The car page: settings being changed, and the plan they would give.
    this._vdraft = {};
    this._vdraftId = null;
    this._vpreview = null;
    this._vcommitting = false;
    this._schedDay = null;
    // The guest page (EV Guest): inputs being changed, and their preview.
    this._gdraft = {};
    this._gpreview = null;
    // "Other" time chips that are open, per page.
    this._customTime = {};
    this._historyMore = new Set();
  }

  // ------------------------------------------------------------------ Home Assistant wiring

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (first) {
      this._renderShell();
      this._subscribe();
    }
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
    this.toggleAttribute("narrow", Boolean(narrow));
  }

  set panel(panel) {
    this._panel = panel;
  }

  /* The path after /ev-planner: /car/<id>, /charger/<id>, /guest, /history or /settings.
     Dashboard cards link straight to a car, a charger or the guest this way. */
  set route(route) {
    this._route = route;
    const path = String(route?.path || "");
    if (path === this._routePath) return;
    this._routePath = path;
    if (!this._embed) this._applyPath(path);
  }

  /* Shown in a pop-up from a dashboard card: one view ("car/<id>", "guest", "charger/<id>")
     without the header and tabs. Nothing is remembered for the panel. */
  set embed(embed) {
    this._embed = embed?.view ? { view: String(embed.view) } : null;
    this.toggleAttribute("embed", Boolean(this._embed));
    if (this._embed) this._applyPath(this._embed.view);
  }

  _applyPath(path) {
    const [kind, raw] = String(path || "").replace(/^\/+/, "").split("/");
    const id = raw ? decodeURIComponent(raw) : null;
    if (kind === "car" && id) [this._tab, this._carId, this._chargerId] = ["cars", id, null];
    else if (kind === "charger" && id) [this._tab, this._carId, this._chargerId] = ["cars", null, id];
    else if (TABS.includes(kind)) [this._tab, this._carId, this._chargerId] = [kind, null, null];
    else return false;
    this._dropDraft();
    this._markDrilled();
    if (this._state && this.shadowRoot.querySelector(".content")) {
      this._render();
      this.shadowRoot.querySelector(".content").scrollTop = 0;
    }
    return true;
  }

  /* The path of what is shown now, as in _applyPath. */
  get _path() {
    if (this._tab === "cars" && this._carId) return `car/${encodeURIComponent(this._carId)}`;
    if (this._tab === "cars" && this._chargerId) return `charger/${encodeURIComponent(this._chargerId)}`;
    return this._tab;
  }

  /* Keep the address bar on what is shown, so a reload or a shared link opens the same page. */
  _syncPath() {
    if (this._embed) {
      this._markDrilled();
      return;
    }
    const prefix = this._route?.prefix;
    if (!prefix || typeof history === "undefined") return;
    const path = this._path === "cars" ? "" : `/${this._path}`;
    this._routePath = path;
    if (location.pathname !== `${prefix}${path}`) history.replaceState(history.state, "", `${prefix}${path}${location.search}`);
  }

  /* In a pop-up, a back button appears once you move on from the view it opened on. */
  _markDrilled() {
    if (!this._embed) return;
    this.toggleAttribute("drilled", this._path !== this._embed.view.replace(/^\/+/, ""));
  }

  connectedCallback() {
    clearInterval(this._tick);
    this._tick = setInterval(() => this._state && this._onTick(), 30000);
    if (this._hass && !this._unsub) this._subscribe();
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._unsubscribe();
  }

  get _lang() {
    const lang = (this._hass?.locale?.language || this._hass?.language || (typeof navigator !== "undefined" && navigator.language) || "en").slice(0, 2);
    return TEXT[lang] ? lang : "en";
  }

  _t(key, vars = {}) {
    const text = TEXT[this._lang][key] ?? TEXT.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  }

  _read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  _write(key, value) {
    if (this._embed) return;
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      /* private mode */
    }
  }

  async _subscribe() {
    this._unsubscribe();
    const connection = this._hass?.connection;
    if (!connection) return;
    try {
      this._unsub = await connection.subscribeMessage((event) => this._onState(event), { type: "ev_planner/subscribe" });
    } catch (err) {
      this._showError(err);
    }
  }

  _unsubscribe() {
    if (this._unsub) {
      const unsub = this._unsub;
      this._unsub = null;
      Promise.resolve(unsub()).catch(() => {});
    }
  }

  _onState(state) {
    if (state.reload) {
      // The household reloads after a car is added or the options change; subscribe again.
      this._unsubscribe();
      clearTimeout(this._reloadTimer);
      this._reloadTimer = setTimeout(() => this._subscribe(), 1000);
      return;
    }
    const first = !this._state;
    this._state = state;
    if (this._carId && !this._car(this._carId)) this._openCar(null, { render: false });
    if (this._chargerId && !this._charger(this._chargerId)) this._chargerId = null;
    if (first) {
      this._render();
      return;
    }
    const planKey = this._viewPlanKey();
    if (planKey !== this._lastPlanKey) {
      this._animatePlan = planKey !== "[]";
      this._lastPlanKey = planKey;
    }
    const mode = this._updateMode();
    if (mode === "update") this._update();
    else if (mode === "render") this._render();
    else this._renderTabs();
  }

  /* How a new state reaches the page: in place where people type and drag, else a fresh render. */
  _updateMode() {
    const root = this.shadowRoot;
    if (this._tab === "cars" && this._carId && root.querySelector(`.car-page[data-id="${cssId(this._carId)}"]`)) return "update";
    if (this._tab === "guest" && root.querySelector(".guest-page")) return "update";
    if (this._tab === "settings" && root.activeElement?.closest?.(".content")) return "skip";
    return "render";
  }

  _update() {
    this._renderTabs();
    if (this._tab === "guest") {
      this._renderGuestHead();
      this._renderGuestInputs();
      this._renderLive();
    } else {
      this._renderCarPage();
    }
  }

  /* Every 30 s: move the hands of the clocks and the "now" line. */
  _onTick() {
    if (this._tab === "cars" && !this._carId) this._render();
    else this._renderLive();
    this._markDrilled();
  }

  async _ws(type, data = {}) {
    const message = { type, ...data };
    if (this._state?.entry_id) message.entry_id = this._state.entry_id;
    return this._hass.callWS(message);
  }

  // ------------------------------------------------------------------ state helpers

  get _cars() {
    return this._state?.vehicles || [];
  }

  get _chargers() {
    return this._state?.chargers || [];
  }

  get _guest() {
    return this._state?.guest || null;
  }

  _car(id) {
    return this._cars.find((v) => v.id === id) || null;
  }

  get _currentCar() {
    return this._tab === "cars" && this._carId ? this._car(this._carId) : null;
  }

  _charger(id) {
    return this._chargers.find((c) => c.id === id) || null;
  }

  get _currentCharger() {
    return this._tab === "cars" && !this._carId && this._chargerId ? this._charger(this._chargerId) : null;
  }

  /* The car's settings with the changes not stored yet. */
  _vs(v) {
    const draft = this._vdraftId === v.id ? this._vdraft : {};
    return { ...(v.settings || {}), ...draft };
  }

  _drafting(v) {
    return this._vdraftId === v.id && (Object.keys(this._vdraft).length > 0 || this._vcommitting);
  }

  _viewKey() {
    if (this._tab === "cars") return this._carId ? `car:${this._carId}` : this._chargerId ? `charger:${this._chargerId}` : "cars";
    return this._tab;
  }

  _viewPlanKey() {
    if (this._tab === "guest") return JSON.stringify(this._guest?.plan?.segments || []);
    const v = this._currentCar;
    return JSON.stringify(v?.plan?.segments || []);
  }

  /* True the first time a part is drawn, so its bars grow in once and not on every update. */
  _intro(key) {
    if (this._shown.has(key) || reducedMotion()) return false;
    this._shown.add(key);
    return true;
  }

  // ------------------------------------------------------------------ actions

  async _run(name, type, data) {
    this._busy = name;
    this._message = null;
    this._renderBusy();
    try {
      await this._ws(type, data);
      return true;
    } catch (err) {
      this._showError(err);
      return false;
    } finally {
      this._busy = null;
      this._renderBusy();
    }
  }

  _renderBusy() {
    this._renderToast();
    if (this._tab === "guest" && this.shadowRoot.querySelector(".guest-page")) {
      this._renderGuestHead();
      this._renderGuestInputs();
    }
  }

  _showError(err) {
    const code = err?.code || err?.error?.code;
    const key = `err_${code}`;
    // The backend sends a translated message; known codes get the panel's own wording.
    const text = TEXT.en[key] ? this._t(key) : err?.message || this._t("err_unknown", { detail: code || String(err) });
    this._message = { kind: "error", text };
    if (this._state) this._renderToast();
    else {
      const p = this.shadowRoot.querySelector(".loading p");
      if (p) p.textContent = text;
    }
  }

  _toast(text) {
    this._message = { kind: "ok", text };
    this._renderToast();
  }

  _setTab(tab) {
    if (!TABS.includes(tab)) return;
    this._tab = tab;
    this._chargerId = null;
    this._write(TAB_KEY, tab);
    this._syncPath();
    this._render();
    this.shadowRoot.querySelector(".content").scrollTop = 0;
  }

  _openCar(id, { render = true } = {}) {
    this._carId = id;
    if (id) this._chargerId = null;
    this._write(CAR_KEY, id || "");
    if (render) this._syncPath();
    this._dropDraft();
    this._schedDay = null;
    this._customTime.car = false;
    if (render) {
      this._render();
      this.shadowRoot.querySelector(".content").scrollTop = 0;
    }
  }

  _openCharger(id) {
    this._tab = "cars";
    this._chargerId = id;
    this._carId = null;
    this._write(CAR_KEY, "");
    this._syncPath();
    this._render();
    this.shadowRoot.querySelector(".content").scrollTop = 0;
  }

  /* Back from a car or charger page: in a pop-up to the view it opened on, else to the cars. */
  _back() {
    if (this._embed) {
      this._applyPath(this._embed.view);
      return;
    }
    if (this._carId) this._openCar(null);
    else this._openCharger(null);
  }

  _dropDraft() {
    clearTimeout(this._vcommitTimer);
    clearTimeout(this._vpreviewTimer);
    this._vdraft = {};
    this._vdraftId = null;
    this._vpreview = null;
    this._vcommitting = false;
  }

  /* A mode button: stored at once. */
  async _setMode(id, mode) {
    const v = this._car(id);
    if (!v || !MODES.includes(mode)) return;
    this.shadowRoot.querySelectorAll(`.modes[data-id="${cssId(id)}"] button`).forEach((b) => {
      b.classList.toggle("on", b.dataset.mode === mode);
      b.setAttribute("aria-checked", b.dataset.mode === mode);
    });
    await this._run("mode", "ev_planner/vehicle_set", { vehicle_id: id, settings: { mode } });
  }

  /* A car setting changed: preview the plan now, store it shortly after. */
  _vchange(changes, { commit = true } = {}) {
    const v = this._currentCar;
    if (!v) return;
    if (this._vdraftId !== v.id) {
      this._dropDraft();
      this._vdraftId = v.id;
    }
    Object.assign(this._vdraft, changes);
    this._renderCarPage({ live: false });
    clearTimeout(this._vpreviewTimer);
    this._vpreviewTimer = setTimeout(() => this._loadCarPreview(), PREVIEW_DELAY);
    if (commit) {
      clearTimeout(this._vcommitTimer);
      this._vcommitTimer = setTimeout(() => this._vcommit(), COMMIT_DELAY);
    }
  }

  async _vcommit() {
    clearTimeout(this._vcommitTimer);
    const id = this._vdraftId;
    const changes = { ...this._vdraft };
    if (!id || !Object.keys(changes).length) return;
    this._vcommitting = true;
    try {
      await this._ws("ev_planner/vehicle_set", { vehicle_id: id, settings: changes });
    } catch (err) {
      this._showError(err);
    }
    this._vcommitting = false;
    if (this._vdraftId !== id) return;
    // Keep what changed again while this was being stored.
    for (const [key, value] of Object.entries(changes)) {
      if (JSON.stringify(this._vdraft[key]) === JSON.stringify(value)) delete this._vdraft[key];
    }
    if (!Object.keys(this._vdraft).length) this._vpreview = null;
    this._renderCarPage();
  }

  async _loadCarPreview() {
    const id = this._vdraftId;
    if (!id || !Object.keys(this._vdraft).length) return;
    const settings = { ...this._vdraft };
    const ask = JSON.stringify([id, settings]);
    this._vpreviewAsk = ask;
    try {
      const result = await this._ws("ev_planner/vehicle_preview", { vehicle_id: id, settings });
      if (this._vpreviewAsk !== ask) return;
      this._vpreview = { id, ...result };
    } catch {
      if (this._vpreviewAsk === ask) this._vpreview = null;
    }
    if (this._drafting({ id })) this._renderCarPage();
  }

  async _saveSettings(settings) {
    if (await this._run("settings", "ev_planner/settings", { settings })) this._toast(this._t("saved"));
  }

  async _deleteHistory(vehicleId, historyId) {
    const data = {};
    if (vehicleId) data.vehicle_id = vehicleId;
    if (historyId) data.history_id = historyId;
    await this._run("delete", "ev_planner/delete_history", data);
  }

  // ------------------------------------------------------------------ formatting

  get _locale() {
    return this._lang === "da" ? "da-DK" : this._hass?.locale?.language || "en-GB";
  }

  get _currency() {
    return this._state?.currency || "DKK";
  }

  _money(value, digits = 2) {
    if (!isNum(value)) return "–";
    try {
      return new Intl.NumberFormat(this._locale, {
        style: "currency",
        currency: this._currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);
    } catch {
      return `${Number(value).toFixed(digits)} ${this._currency}`;
    }
  }

  /* The currency's short unit, for inputs: "kr." for DKK in Danish. */
  get _unit() {
    try {
      const part = new Intl.NumberFormat(this._locale, { style: "currency", currency: this._currency })
        .formatToParts(1)
        .find((p) => p.type === "currency");
      return part?.value || this._currency;
    } catch {
      return this._currency;
    }
  }

  _num(value, digits = 1) {
    if (!isNum(value)) return "–";
    return new Intl.NumberFormat(this._locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  }

  _pct(value) {
    return isNum(value) ? `${Math.round(Number(value))} %` : "–";
  }

  _kwh(value, digits = 1) {
    return `${this._num(value, digits)} kWh`;
  }

  _time(iso) {
    if (!iso) return "–";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "–";
    return new Intl.DateTimeFormat(this._locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  }

  /* "07:00" as shown: 07.00 in Danish. */
  _hhmm(value) {
    const [hh, mm] = String(value || "").split(":");
    if (!isNum(hh) || !isNum(mm)) return "–";
    const sep = this._lang === "da" ? "." : ":";
    return `${String(hh).padStart(2, "0")}${sep}${String(mm).padStart(2, "0").slice(0, 2)}`;
  }

  _day(iso) {
    const date = new Date(iso);
    const today = new Date();
    const start = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((start(date) - start(today)) / 86400000);
    if (diff === 0) return this._t("today");
    if (diff === 1) return this._t("tomorrow");
    if (diff === 2) return this._t("day_after");
    return new Intl.DateTimeFormat(this._locale, { weekday: "long" }).format(date);
  }

  _date(iso) {
    return new Intl.DateTimeFormat(this._locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  }

  _duration(minutes) {
    if (!isNum(minutes)) return "–";
    const total = Math.round(minutes);
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return `${m} ${this._t("minutes_short")}`;
    return m ? `${h} ${this._t("hours_short")} ${m} ${this._t("minutes_short")}` : `${h} ${this._t("hours_short")}`;
  }

  /* "klar kl. 07.00" – with the day when it is not within the next day. */
  _readyText(deadline) {
    if (!deadline) return this._t("no_deadline_short");
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms > 20 * 3600000) return this._t("ready_at_day", { day: this._day(deadline).toLowerCase(), time: this._time(deadline) });
    return this._t("ready_at", { time: this._time(deadline) });
  }

  _entityName(entityId) {
    if (!entityId) return this._t("not_set");
    const state = this._hass?.states?.[entityId];
    return state?.attributes?.friendly_name ? `${state.attributes.friendly_name} (${entityId})` : entityId;
  }

  // ------------------------------------------------------------------ rendering

  _renderShell() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="app">
        <header class="bar">
          <div class="menu"></div>
          <div class="brand">${MARK}<span>EV Planner</span></div>
          <nav class="tabs" role="tablist" aria-label="EV Planner"></nav>
        </header>
        <main class="content"><div class="loading">${MARK}<p>${this._t("loading")}</p></div></main>
        <div class="toast" role="status" aria-live="polite"></div>
        <div class="sheet-root"></div>
      </div>`;
    if (customElements.get("ha-menu-button")) {
      this._menu = document.createElement("ha-menu-button");
      this._menu.hass = this._hass;
      this._menu.narrow = this._narrow;
      this.shadowRoot.querySelector(".menu").appendChild(this._menu);
    }
    const content = this.shadowRoot.querySelector(".content");
    content.addEventListener("click", (ev) => this._onClick(ev));
    content.addEventListener("change", (ev) => this._onChange(ev));
    content.addEventListener("input", (ev) => this._onInput(ev));
    content.addEventListener("keydown", (ev) => this._onKey(ev));
  }

  _render() {
    if (!this._state) return;
    const content = this.shadowRoot.querySelector(".content");
    const view = this._viewKey();
    if (view !== this._lastView) {
      // A new page: its clock sweeps in once.
      this._lastView = view;
      this._lastPlanKey = this._viewPlanKey();
      this._animatePlan = this._lastPlanKey !== "[]";
    }
    this._renderTabs();
    // Keep the focus on the same control across a fresh render.
    const focus = this.shadowRoot.activeElement?.dataset?.f;
    const car = this._currentCar;
    if (this._tab === "guest") content.innerHTML = this._guestHtml();
    else if (this._tab === "history") content.innerHTML = this._historyHtml();
    else if (this._tab === "settings") content.innerHTML = this._settingsHtml();
    else if (car) content.innerHTML = this._carPageHtml(car);
    else if (this._currentCharger) content.innerHTML = this._chargerPageHtml(this._currentCharger);
    else content.innerHTML = this._overviewHtml();
    if (this._tab === "guest") {
      this._bindBattery();
      this._renderGuestHead();
      this._renderGuestInputs();
      this._renderLive();
      if (!this._gpreview && this._state.prices.length) this._loadGuestPreview();
    } else if (car) {
      this._bindBattery();
      this._renderCarPage();
    }
    this._animatePlan = false;
    if (focus) content.querySelector(`[data-f="${cssId(focus)}"]`)?.focus({ preventScroll: true });
    this._renderToast();
  }

  _renderTabs() {
    const nav = this.shadowRoot.querySelector(".tabs");
    const problems = this._cars.filter((v) => v.problem || v.control_error).length;
    const html = TABS.map((tab) => {
      const on = this._tab === tab;
      const icon = { cars: "car", guest: "guest", history: "history", settings: "settings" }[tab];
      const badge = tab === "cars" && problems ? `<em class="bad" aria-label="${problems}">${problems}</em>` : "";
      return `<button role="tab" data-tab="${tab}" aria-selected="${on}" class="${on ? "on" : ""}">${ICONS[icon]}<span>${this._t(`tab_${tab}`)}</span>${badge}</button>`;
    }).join("");
    if (nav.dataset.key === html) return;
    nav.dataset.key = html;
    nav.innerHTML = html;
    nav.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", () => {
        // The Cars tab from a car page goes back to the overview.
        if (button.dataset.tab === "cars" && this._tab === "cars" && this._carId) this._openCar(null);
        else if (button.dataset.tab === "cars" && this._tab === "cars" && this._chargerId) this._openCharger(null);
        else this._setTab(button.dataset.tab);
      }),
    );
  }

  _renderToast() {
    const toast = this.shadowRoot.querySelector(".toast");
    if (!this._message) {
      toast.className = "toast";
      toast.textContent = "";
      return;
    }
    toast.className = `toast show ${this._message.kind}`;
    toast.innerHTML = `<span>${esc(this._message.text)}</span><button aria-label="${this._t("close")}">${ICONS.close}</button>`;
    toast.querySelector("button").addEventListener("click", () => {
      this._message = null;
      this._renderToast();
    });
    clearTimeout(this._toastTimer);
    if (this._message.kind !== "error") this._toastTimer = setTimeout(() => ((this._message = null), this._renderToast()), 2500);
  }

  /* Replace a part of the page when its content changed, keeping the focus – but never while someone types in it. */
  _patch(box, key, html) {
    if (!box || box.dataset.key === key) return false;
    const active = this.shadowRoot.activeElement;
    if (active && box.contains(active) && active.matches("input, select, textarea")) return false;
    const focus = active && box.contains(active) ? active.dataset.f : null;
    box.dataset.key = key;
    box.innerHTML = html;
    if (focus) box.querySelector(`[data-f="${cssId(focus)}"]`)?.focus();
    return true;
  }

  // ------------------------------------------------------------------ cars (overview)

  _overviewHtml() {
    const cars = this._cars;
    const list = cars.length
      ? `<div class="cars-grid">${cars.map((v) => this._carCardHtml(v)).join("")}</div>`
      : `<section class="empty panel">${MARK}<h2>${this._t("no_cars_title")}</h2><p>${this._t("no_cars_text")}</p>
          <a class="btn primary" href="/config/integrations/integration/ev_planner" target="_top">${ICONS.plus}<span>${this._t("add_car")}</span></a></section>`;
    return `<div class="page stack">${list}
      <div class="side-grid">${this._guestCardHtml()}${this._chargersHtml()}</div></div>`;
  }

  _carCardHtml(v) {
    const plan = hasSegments(v.plan) ? v.plan : null;
    const settings = v.settings || {};
    const tone = this._statusTone(v);
    return `<article class="vcard tone-${tone}" data-id="${esc(v.id)}">
      <button class="vcard-open" data-act="open-car" data-id="${esc(v.id)}" data-f="open-${esc(v.id)}" aria-label="${esc(this._t("open_car", { name: v.name }))}">
        <div class="vcard-head">
          <div class="vcard-title">${v.image ? `<img class="avatar" src="${esc(v.image)}" alt="" loading="lazy">` : ICONS.car}<div><strong>${esc(v.name)}</strong><span>${esc(this._carSubline(v))}</span></div></div>
          <span class="pill ${tone}">${esc(this._statusText(v))}</span>
        </div>
        <div class="vcard-body">
          <div class="dial-wrap mini">
            <svg class="dial mini" viewBox="0 0 400 400" aria-hidden="true">${this._dialMarkup({
              plan,
              deadline: v.deadline,
              flow: v.control === "charge" && plan,
              ceiling: this._ceilingOf(v, settings, plan),
              mini: true,
              intro: this._intro(`mini:${v.id}`),
            })}</svg>
            <div class="dial-center mini">${this._miniCenterHtml(plan)}</div>
          </div>
          <div class="vcard-side">
            ${this._miniBatteryHtml(v)}
            <dl class="mini-facts">
              ${plan ? `<div><dt>${this._t("energy")}</dt><dd>${this._kwh(plan.energy)}</dd></div>` : ""}
              ${plan && plan.savings > 0.005 ? `<div><dt>${this._t("savings")}</dt><dd class="good">${this._money(plan.savings)}</dd></div>` : ""}
              ${!plan && v.plan_error ? `<div class="wide"><dd class="soft">${esc(this._t(`vstatus_${v.plan_error}`))}</dd></div>` : ""}
            </dl>
          </div>
        </div>
      </button>
      ${this._modesHtml(v)}
      ${this._notesHtml(v, plan, { compact: true })}
    </article>`;
  }

  _miniCenterHtml(plan) {
    if (plan) {
      return `<strong class="big">${this._money(plan.cost)}</strong>
        <span class="range">${this._time(plan.start || plan.segments[0].start)}–${this._time(plan.end || plan.segments.at(-1).end)}</span>`;
    }
    const prices = this._dayPrices();
    if (!prices.length) return `<span class="range">${this._t("no_prices")}</span>`;
    return `<strong class="big">${this._money(prices[0].price)}</strong><span class="range">${this._t("price_now")}</span>`;
  }

  /* "Tilsluttet · klar kl. 07.00" */
  _carSubline(v) {
    const parts = [];
    if (v.home === false) parts.push(this._t("away"));
    else if (v.connected === true) parts.push(this._t("connected"));
    else if (v.connected === false) parts.push(this._t("not_connected"));
    if (v.mode !== "off") parts.push(this._readyText(v.deadline));
    return parts.join(" · ");
  }

  _statusTone(v) {
    if (v.problem || v.control_error) return "coral";
    return STATUS_TONE[v.status] || "grey";
  }

  _statusText(v) {
    return TEXT.en[`vstatus_${v.status}`] ? this._t(`vstatus_${v.status}`) : String(v.status || "–");
  }

  _miniBatteryHtml(v) {
    const soc = isNum(v.soc) ? Number(v.soc) : null;
    const target = isNum(v.target) ? Number(v.target) : 80;
    if (soc === null) return `<div class="mini-batt missing"><div class="mb-cells"></div><p>${this._t("soc_missing")} → ${this._pct(target)}</p></div>`;
    const gain = (Number(v.capacity) || 0) * Math.max(0, target - soc) / 100;
    return `<div class="mini-batt">
      <div class="mb-cells" role="img" aria-label="${this._pct(soc)} → ${this._pct(target)}">
        <i class="mb-now" style="width:${clamp(soc, 0, 100)}%"></i>
        <i class="mb-target" style="left:${clamp(soc, 0, 100)}%;width:${clamp(target - soc, 0, 100 - soc)}%"></i>
        ${v.control === "charge" ? `<i class="mb-flow" style="left:${clamp(soc, 0, 100)}%;width:${clamp(target - soc, 0, 100 - soc)}%"></i>` : ""}
      </div>
      <p><b>${this._pct(soc)}</b> → <b>${this._pct(target)}</b>${gain > 0.05 ? ` <span>+${this._kwh(gain)}</span>` : ""}</p>
    </div>`;
  }

  _modesHtml(v, { large = false } = {}) {
    const mode = (v.id === this._vdraftId && this._vdraft.mode) || v.mode;
    return `<div class="segmented modes ${large ? "large" : ""}" role="radiogroup" aria-label="${this._t("mode_label")}" data-id="${esc(v.id)}">${MODES.map(
      (m) => `<button role="radio" data-act="mode" data-id="${esc(v.id)}" data-mode="${m}" data-f="mode-${esc(v.id)}-${m}" aria-label="${this._t(`mode_${m}`)}" aria-checked="${mode === m}" class="${mode === m ? "on" : ""} m-${m}">${ICONS[MODE_ICONS[m]]}<span>${this._t(`mode_${m}`)}</span></button>`,
    ).join("")}</div>`;
  }

  /* Warnings and notes for a car: problems in coral, plan limits in sand. */
  _notesHtml(v, plan, { compact = false } = {}) {
    const notes = [];
    if (v.problem) notes.push(["bad", this._t("problem")]);
    if (v.control_error) {
      const text = v.control_error === "no_control_entity" ? this._t("no_control_entity") : this._t("control_error", { error: v.control_error });
      notes.push(["bad", text]);
    }
    if (plan) {
      if (plan.min_only) notes.push(["warn", this._t("note_min_only")]);
      else if (plan.limited) notes.push(["warn", this._t("note_limited")]);
      if (plan.short) {
        const deadline = plan.deadline ?? v.deadline;
        notes.push(["warn", deadline ? this._t("note_short", { time: this._time(deadline) }) : this._t("note_short_plain")]);
      }
      if (!compact && plan.opportunistic && isNum(plan.ceiling)) notes.push(["info", this._t("note_opportunistic", { price: this._money(plan.ceiling) })]);
    }
    if (!notes.length) return compact ? "" : `<div class="notes"></div>`;
    return `<div class="notes">${notes
      .map(([kind, text]) => `<p class="note-line ${kind}">${ICONS[kind === "info" ? "info" : "warn"]}<span>${esc(text)}</span></p>`)
      .join("")}</div>`;
  }

  _guestCardHtml() {
    const g = this._guest;
    if (!g) return "";
    const plate = g.inputs?.license_plate || "";
    const car = [g.car?.brand, g.car?.model].filter(Boolean).join(" ");
    const hasPlan = hasSegments(g.plan);
    const status = g.error ? this._t(`err_${g.error}`) : this._t(`status_${g.status}`) || g.status;
    const active = hasPlan || plate;
    return `<section class="panel guest-card">
      <h2>${ICONS.guest}<span>${this._t("guest_card")}</span></h2>
      <div class="guest-line">
        ${plate ? `<em class="mini-plate">${esc(plate)}</em>` : ""}
        <div><strong>${esc(car || (plate ? this._t("unknown_car") : this._t("guest_none")))}</strong>
          ${active ? `<span class="${g.error ? "bad-text" : ""}">${esc(status)}${hasPlan ? ` · ${this._time(g.plan.segments[0].start)}–${this._time(g.plan.segments.at(-1).end)} · ${this._money(g.plan.cost)}` : ""}</span>` : ""}</div>
      </div>
      <button class="btn ${active ? "ghost" : "primary"}" data-act="tab" data-tab="guest">${ICONS[active ? "guest" : "plus"]}<span>${this._t(active ? "guest_open" : "guest_start")}</span></button>
    </section>`;
  }

  /* A car's or charger's picture; tapping it picks a new photo, the small cross removes it,
     the wand cuts a plain background away and the arrow undoes that. */
  _photoHtml(id, image, fallback, { small = false, wide = false, original = null } = {}) {
    const busy = this._busy === `photo:${id}`;
    const label = this._t(image ? "photo_change" : "photo_add");
    const button = (act, icon, text) =>
      `<button class="photo-${act}" data-act="photo-${act}" data-id="${esc(id)}" aria-label="${text}" title="${text}" ${busy ? "disabled" : ""}>${icon}</button>`;
    return `<span class="photo ${small ? "small" : ""} ${wide ? "wide" : ""} ${image ? "has" : ""} ${busy ? "busy" : ""}">
      <button class="photo-pick" data-act="photo" data-id="${esc(id)}" data-f="photo-${esc(id)}" aria-label="${label}" title="${label}" ${busy ? "disabled" : ""}>
        ${image ? `<img src="${esc(image)}" alt="" loading="lazy">` : fallback}<i class="cam">${ICONS.camera}</i>
      </button>
      ${image ? button("del", ICONS.close, this._t("photo_remove")) : ""}
      ${image && !small && !original ? button("cut", ICONS.wand, this._t("photo_cut")) : ""}
      ${original ? button("undo", ICONS.undo, this._t("photo_undo")) : ""}
    </span>`;
  }

  _photoOf(id) {
    return [...this._cars, ...this._chargers].find((item) => item.id === id) || {};
  }

  _pickPhoto(id) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) this._uploadPhoto(id, file);
    });
    input.click();
  }

  /* A new photo is saved as it is; when it has a plain background, a cut-out of
     it is shown instead, and the arrow on the photo brings the photo back. */
  async _uploadPhoto(id, file) {
    await this._photoWork(id, "photo_uploading", async () => {
      const { blob, cut } = await preparePhoto(file);
      await this._savePhoto(id, blob, false);
      if (cut) await this._savePhoto(id, cut, true);
      return cut ? "photo_saved_cut" : "photo_saved";
    });
  }

  /* Cut the background out of the photo. It is always made from the photo as it
     was uploaded, which is kept, so the cut can be undone. */
  async _cutPhoto(id) {
    const { image, image_original: original } = this._photoOf(id);
    const source = original || image;
    if (!source) return;
    await this._photoWork(id, "photo_cutting", async () => {
      const response = await this._hass.fetchWithAuth(source.replace(/\/\d+x\d+$/, "/original"));
      if (!response.ok) throw new Error(String(response.status));
      const { cut } = await preparePhoto(await response.blob());
      if (!cut) return "photo_no_background";
      await this._savePhoto(id, cut, true);
      return "photo_saved_cut";
    });
  }

  async _undoPhoto(id) {
    await this._photoWork(id, null, async () => {
      const result = await this._ws("ev_planner/restore_image", { target_id: id });
      this._dropImages(result?.unused);
      return "photo_restored";
    });
  }

  async _photoWork(id, busyText, work) {
    this._busy = `photo:${id}`;
    if (busyText) this._message = { kind: "ok", text: this._t(busyText) };
    this._refreshPhotos();
    try {
      this._toast(this._t(await work()));
    } catch (err) {
      this._message = { kind: "error", text: this._t("photo_failed", { detail: err?.message || String(err) }) };
      this._renderToast();
    } finally {
      this._busy = null;
      this._refreshPhotos();
    }
  }

  async _savePhoto(id, blob, cutout) {
    const form = new FormData();
    form.append("file", blob, blob.type === "image/png" ? "ev-planner.png" : "ev-planner.jpg");
    const response = await this._hass.fetchWithAuth("/api/image/upload", { method: "POST", body: form });
    if (!response.ok) throw new Error((await response.text()) || String(response.status));
    const item = await response.json();
    const result = await this._ws("ev_planner/set_image", { target_id: id, image_id: item.id, cutout });
    this._dropImages(result?.unused);
    return result;
  }

  _refreshPhotos() {
    if (this._currentCar) this._update();
    else this._render();
  }

  async _removePhoto(id) {
    try {
      const result = await this._ws("ev_planner/set_image", { target_id: id, image_id: null });
      this._dropImages(result?.unused);
      this._toast(this._t("photo_removed"));
    } catch (err) {
      this._showError(err);
    }
  }

  /* Photos nothing shows any more are deleted from Home Assistant. */
  _dropImages(imageIds) {
    for (const imageId of imageIds || []) this._hass.callWS({ type: "image/delete", image_id: imageId }).catch(() => {});
  }

  _chargersHtml() {
    const chargers = this._chargers;
    if (!chargers.length) return "";
    return `<section class="panel chargers">
      <h2>${ICONS.charger}<span>${this._t("chargers")}</span></h2>
      <ul>${chargers
        .map((c) => {
          const state = this._t(`charger_${c.control || "released"}`);
          const holder = c.holder === "guest" ? this._t("holder_guest") : c.holder;
          const text = holder && c.control !== "released" ? this._t("charger_for", { state, name: holder }) : state;
          const plugged = c.connected === true ? this._t("car_plugged") : c.connected === false ? this._t("car_unplugged") : "";
          const model = c.model?.startsWith("generic_") ? this._t(`model_${c.model}`) : c.model_title;
          const details = [model, isNum(c.power) ? `${this._num(c.power)} kW` : "", plugged].filter(Boolean).join(" · ");
          return `<li class="ctl-${esc(c.control || "released")}">${this._photoHtml(c.id, c.image, chargerArt(c.style), { small: true, original: c.image_original })}
            <button class="ch-open" data-act="open-charger" data-id="${esc(c.id)}" data-f="ch-${esc(c.id)}" aria-label="${esc(this._t("open_charger", { name: c.name }))}"><strong><i aria-hidden="true"></i>${esc(c.name)}</strong><span>${esc(details)}</span></button>
            <b>${esc(text)}</b></li>`;
        })
        .join("")}</ul>
    </section>`;
  }

  /* What a charger is doing, in words: "Lader for Mercedes EQB", "Ledig". */
  _chargerStateText(c) {
    const state = this._t(`charger_${c.control || "released"}`);
    const holder = c.holder === "guest" ? this._t("holder_guest") : c.holder;
    if (holder && c.control !== "released") return this._t("charger_for", { state, name: holder });
    return c.control === "released" ? this._t("charger_free") : state;
  }

  /* The car that charges next on a charger: the earliest plan still to come. */
  _chargerNext(c) {
    const now = Date.now();
    const plans = this._cars
      .filter((v) => v.charger?.id === c.id && hasSegments(v.plan))
      .map((v) => ({ name: v.name, start: v.plan.segments.find((seg) => new Date(seg.end).getTime() > now)?.start }))
      .filter((item) => item.start);
    const g = this._guest;
    if (g && g.charger?.id === c.id && hasSegments(g.plan) && g.status === "planned") {
      const start = g.plan.segments.find((seg) => new Date(seg.end).getTime() > now)?.start;
      if (start) plans.push({ name: this._t("holder_guest"), start });
    }
    plans.sort((a, b) => new Date(a.start) - new Date(b.start));
    return plans[0] || null;
  }

  _chargerPageHtml(c) {
    const cars = this._cars.filter((v) => v.charger?.id === c.id);
    const g = this._guest;
    const model = c.model?.startsWith("generic_") ? this._t(`model_${c.model}`) : c.model_title;
    const plugged = c.connected === true ? this._t("car_plugged") : c.connected === false ? this._t("car_unplugged") : "";
    const details = [model, isNum(c.power) ? `${this._num(c.power)} kW` : "", plugged].filter(Boolean).join(" · ");
    const next = this._chargerNext(c);
    const tone = c.control === "charge" ? "teal" : c.control === "pause" ? "sand" : "grey";
    return `<div class="page stack charger-page" data-id="${esc(c.id)}">
      <header class="car-head">
        <button class="icon back" data-act="back" data-f="back" aria-label="${this._t("back_to")}">${ICONS.back}</button>
        ${this._photoHtml(c.id, c.image, chargerArt(c.style), { wide: true, original: c.image_original })}
        <div class="car-title"><h1>${esc(c.name)}</h1><span>${esc(details)}</span></div>
        <span class="pill ${tone}">${esc(this._chargerStateText(c))}</span>
      </header>
      ${next ? `<p class="charger-next">${ICONS.plan}<span>${esc(this._t("charger_next", { name: next.name, time: this._time(next.start) }))}</span></p>` : ""}
      <h2 class="section-title">${ICONS.car}<span>${this._t("charger_cars")}</span></h2>
      ${cars.length ? `<div class="cars-grid">${cars.map((v) => this._carCardHtml(v)).join("")}</div>` : `<p class="hint">${this._t("charger_no_cars")}</p>`}
      ${g && (!g.charger || g.charger.id === c.id) ? `<div class="side-grid">${this._guestCardHtml()}</div>` : ""}
    </div>`;
  }

  // ------------------------------------------------------------------ the price clock (shared)

  /* Prices from now and one day ahead: the ring of the clock. */
  _dayPrices() {
    const now = Date.now();
    const end = now + 24 * 3600 * 1000;
    return (this._state?.prices || []).filter((p) => new Date(p.end).getTime() > now && new Date(p.start).getTime() < end);
  }

  /* The ceiling to draw: the one the plan used (after opportunistic charging), or the setting. */
  _ceilingOf(v, settings, plan) {
    if (plan && isNum(plan.ceiling)) return Number(plan.ceiling);
    if (settings?.price_ceiling_enabled && isNum(settings.price_ceiling)) return Number(settings.price_ceiling);
    return null;
  }

  /* The inside of a 24-hour price clock: ticks, price bars, the charging arcs, the deadline and the hand.
     The same drawing makes the big clock and the small ones on the car cards. */
  _dialMarkup({ plan, deadline, flow = false, ceiling = null, mini = false, intro = false }) {
    const now = new Date();
    const nowMs = now.getTime();
    const nowH = now.getHours() + now.getMinutes() / 60;
    const end = nowMs + 24 * 3600 * 1000;
    const prices = this._dayPrices();
    const values = prices.map((p) => p.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const cx = 200;
    const cy = 200;
    let html = DIAL_DEFS;

    // Hour ticks and labels of a 24-hour clock.
    html += `<g class="${intro ? "intro" : ""}"><circle cx="${cx}" cy="${cy}" r="118" class="face"/>`;
    for (let h = 0; h < 24; h++) {
      if (mini && h % 6) continue;
      const [x1, y1] = polar(cx, cy, 196, h);
      const [x2, y2] = polar(cx, cy, h % 6 === 0 ? 188 : 192, h);
      html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick ${h % 6 === 0 ? "major" : ""}"/>`;
    }
    if (!mini) {
      for (const h of [0, 6, 12, 18]) {
        const [x, y] = polar(cx, cy, 106, h);
        html += `<text x="${x}" y="${y}" class="hour" dominant-baseline="central" text-anchor="middle">${String(h).padStart(2, "0")}</text>`;
      }
    }

    // Prices as bars around the clock, from now and one day ahead. Bars above the ceiling are faded.
    const inner = 142;
    const outer = 184;
    prices.forEach((p, i) => {
      const from = Math.max(new Date(p.start).getTime(), nowMs);
      const to = Math.min(new Date(p.end).getTime(), end);
      const fromH = nowH + (from - nowMs) / 3600000;
      const toH = nowH + (to - nowMs) / 3600000;
      if (toH <= fromH) return;
      const t = max > min ? (p.price - min) / (max - min) : 0.5;
      const r = inner + 8 + t * (outer - inner - 8);
      const gap = Math.min(0.04, (toH - fromH) * 0.12);
      const a1 = polar(cx, cy, inner, fromH + gap);
      const a2 = polar(cx, cy, r, fromH + gap);
      const b1 = polar(cx, cy, r, toH - gap);
      const b2 = polar(cx, cy, inner, toH - gap);
      const large = toH - fromH > 12 ? 1 : 0;
      const over = ceiling !== null && p.price > ceiling ? " over" : "";
      html += `<path class="bar${over}" style="fill:${priceColor(t)};--d:${(i * 8).toFixed(0)}ms" d="M${a1} L${a2} A${r} ${r} 0 ${large} 1 ${b1} L${b2} A${inner} ${inner} 0 ${large} 0 ${a1}Z">${mini ? "" : `<title>${this._time(p.start)}: ${this._money(p.price)}</title>`}</path>`;
    });
    html += `</g>`;

    // The charging windows as the lit arc of the logo.
    if (hasSegments(plan)) {
      plan.segments.forEach((seg, index) => {
        const startMs = new Date(seg.start).getTime();
        const endMs = Math.min(new Date(seg.end).getTime(), startMs + 23.9 * 3600000);
        if (startMs >= end) return;
        const past = endMs <= nowMs;
        const fromH = new Date(startMs).getHours() + new Date(startMs).getMinutes() / 60;
        const d = arcPath(cx, cy, 128, fromH, fromH + (endMs - startMs) / 3600000);
        const sweep = this._animatePlan && !plan.preview && !reducedMotion() ? " sweep" : "";
        const cls = plan.preview ? "window preview" : `window${past ? " past" : ""}${sweep}`;
        if (!past && !mini) html += `<path d="${d}" class="window-glow ${plan.preview ? "preview" : ""}" filter="url(#evp-glow)"/>`;
        html += `<path d="${d}" class="${cls}" pathLength="1" style="--i:${index}"/>`;
        if (flow && !plan.preview && startMs <= nowMs && nowMs < endMs) html += `<path d="${d}" class="window-flow"/>`;
      });
    }

    // Deadline flag, when it falls within the coming day.
    const dl = deadline ? new Date(deadline) : null;
    if (dl && !Number.isNaN(dl.getTime()) && dl.getTime() > nowMs && dl.getTime() <= end) {
      const h = dl.getHours() + dl.getMinutes() / 60;
      const [x1, y1] = polar(cx, cy, 116, h);
      const [x2, y2] = polar(cx, cy, 198, h);
      const [fx, fy] = polar(cx, cy, 206, h);
      html += `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="deadline-line"/><circle cx="${fx}" cy="${fy}" r="${mini ? 9 : 5}" class="deadline-dot">${mini ? "" : `<title>${this._t("deadline")} ${this._time(deadline)}</title>`}</circle></g>`;
    }

    // Now hand.
    const [nx1, ny1] = polar(cx, cy, 112, nowH);
    const [nx2, ny2] = polar(cx, cy, 196, nowH);
    html += `<g><line x1="${nx1}" y1="${ny1}" x2="${nx2}" y2="${ny2}" class="needle"/><circle cx="${nx2}" cy="${ny2}" r="${mini ? 9 : 4.5}" class="needle-dot"/></g>`;
    return html;
  }

  _renderDial(plan, { deadline, flow, ceiling }) {
    const svg = this.shadowRoot.querySelector(".dial.big");
    if (!svg) return;
    svg.innerHTML = this._dialMarkup({ plan, deadline, flow, ceiling, intro: this._intro(`dial:${this._viewKey()}`) });
    this._renderDialCenter(plan);
  }

  _renderDialCenter(plan) {
    const box = this.shadowRoot.querySelector(".dial-center.big");
    if (!box) return;
    const prices = this._dayPrices();
    if (hasSegments(plan)) {
      const savings = plan.savings;
      box.innerHTML = `
        ${plan.preview ? `<span class="tag">${this._t("preview")}</span>` : ""}
        <strong class="big">${this._money(plan.cost)}</strong>
        <span class="range">${this._time(plan.segments[0].start)}–${this._time(plan.segments.at(-1).end)}</span>
        ${savings > 0.005 ? `<span class="save">${this._t("save", { amount: this._money(savings) })}</span>` : ""}`;
      if (this._animatePlan && !plan.preview && !reducedMotion()) this._countUp(box.querySelector(".big"), plan.cost);
      return;
    }
    if (!prices.length) {
      box.innerHTML = `<strong class="big muted">${this._t("no_prices")}</strong>`;
      return;
    }
    const cheapest = prices.reduce((a, b) => (b.price < a.price ? b : a), prices[0]);
    box.innerHTML = `
      <strong class="big">${this._money(prices[0].price)}</strong>
      <span class="range">${this._t("price_now")}</span>
      <span class="save">${this._t("cheapest_at", { time: this._time(cheapest.start) })}</span>`;
  }

  _countUp(el, value) {
    if (!el || !isNum(value)) return;
    const startTime = performance.now();
    const duration = 900;
    const step = (now) => {
      const k = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = this._money(value * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _renderStatusLine(kind, text) {
    const box = this.shadowRoot.querySelector(".status-line");
    if (!box) return;
    box.className = `status-line ${kind}`;
    box.innerHTML = `<i></i><span>${esc(text)}</span>`;
  }

  /* "Starts in 3 h", "Charging – done at 05.40" or "Paused – charging again at 02.00". */
  _planTiming(segments, charging) {
    const now = Date.now();
    const segs = (segments || []).map((seg) => ({ start: new Date(seg.start).getTime(), end: new Date(seg.end).getTime() }));
    if (!segs.length) return "";
    if (charging) return this._t("charging_until", { time: this._time(segments.at(-1).end) });
    const next = segs.find((seg) => seg.start > now);
    const started = segs.some((seg) => seg.start <= now);
    if (started && next) return this._t("paused_until", { time: this._time(new Date(next.start).toISOString()) });
    if (next) return this._t("starts_in", { time: this._duration((next.start - now) / 60000) });
    return "";
  }

  _renderFacts(plan, extra = []) {
    const box = this.shadowRoot.querySelector(".facts");
    if (!box) return;
    if (!hasSegments(plan)) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const items = [
      [this._t("start"), `${this._day(plan.segments[0].start)} ${this._time(plan.segments[0].start)}`],
      [this._t("end"), `${this._day(plan.segments.at(-1).end)} ${this._time(plan.segments.at(-1).end)}`],
      [this._t("duration"), this._duration(plan.minutes)],
      [this._t("energy"), this._kwh(plan.energy)],
      [this._t("cost"), this._money(plan.cost)],
      [this._t("savings"), isNum(plan.savings) ? this._money(plan.savings) : "–"],
      [this._t("speed"), `${this._num(plan.speed)} %/${this._t("hours_short")}`],
      ...extra,
    ];
    box.innerHTML = `<dl class="${plan.preview ? "is-preview" : ""}">${items
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("")}</dl>${
      plan.savings > 0.005 && !plan.preview ? `<p class="save-note">${this._t("save", { amount: this._money(plan.savings) })} ${this._t("save_vs")}</p>` : ""
    }`;
  }

  /* The two-day price graph with the charging periods, the deadline, the ceiling and now. */
  _renderTimeline(plan, { deadline = null, ceiling = null } = {}) {
    const svg = this.shadowRoot.querySelector(".timeline");
    if (!svg) return;
    const prices = this._state.prices || [];
    const empty = this.shadowRoot.querySelector(".prices .empty-note");
    if (empty) empty.hidden = prices.length > 0;
    svg.closest(".timeline-wrap")?.toggleAttribute("hidden", !prices.length);
    if (!prices.length) {
      svg.innerHTML = "";
      return;
    }
    // Draw in the graph's own pixels, so the text is not stretched on a phone.
    const W = Math.round(clamp(svg.clientWidth || 1000, 280, 2000));
    const H = 220;
    const top = 26;
    const bottom = 30;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const t0 = new Date(prices[0].start).getTime();
    const t1 = new Date(prices.at(-1).end).getTime();
    const x = (ms) => ((ms - t0) / (t1 - t0 || 1)) * W;
    const values = prices.map((p) => p.price);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    // A ceiling a little above the prices still fits; far above it is left out.
    const showCeiling = ceiling !== null && ceiling >= Math.min(0, lo) && ceiling <= hi * 1.6 + 0.01;
    const min = Math.min(0, lo);
    const max = Math.max(hi, showCeiling ? ceiling : hi);
    const y = (v) => H - bottom - ((v - min) / (max - min || 1)) * (H - top - bottom);
    let html = TIMELINE_DEFS;

    // Day bands.
    const days = new Map();
    for (const p of prices) {
      const d = new Date(p.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!days.has(key)) days.set(key, p.start);
    }
    [...days.values()].forEach((iso, i) => {
      const startMs = Math.max(new Date(new Date(iso).setHours(0, 0, 0, 0)).getTime(), t0);
      const xs = x(startMs);
      if (i % 2) html += `<rect x="${xs}" y="0" width="${Math.max(0, Math.min(W - xs, x(startMs + 86400000) - xs))}" height="${H - bottom}" class="day-band"/>`;
      html += `<text x="${xs + 8}" y="16" class="day">${esc(this._day(iso))}</text>`;
    });

    // Charging windows under the bars.
    if (hasSegments(plan)) {
      for (const seg of plan.segments) {
        const a = clamp(x(new Date(seg.start).getTime()), 0, W);
        const b = clamp(x(new Date(seg.end).getTime()), 0, W);
        if (b <= a) continue;
        html += `<rect x="${a}" y="${top - 6}" width="${Math.max(2, b - a)}" height="${H - bottom - top + 6}" rx="6" class="tl-window ${plan.preview ? "preview" : ""}"/>`;
      }
    }

    // Bars.
    prices.forEach((p, i) => {
      const a = x(new Date(p.start).getTime());
      const b = x(new Date(p.end).getTime());
      const w = Math.max(1, b - a - (b - a > 6 ? 1.5 : 0.4));
      const t = hi > lo ? (p.price - lo) / (hi - lo) : 0.5;
      const yy = y(Math.max(p.price, min));
      html += `<rect x="${a}" y="${Math.min(yy, y(0))}" width="${w}" height="${Math.abs(y(0) - yy)}" rx="${Math.min(3, w / 3)}" class="tl-bar" style="fill:${priceColor(t)};--d:${i * 4}ms" data-i="${i}"/>`;
    });

    // Axis hours.
    for (let ms = Math.ceil(t0 / 3600000) * 3600000; ms <= t1; ms += 3600000) {
      const d = new Date(ms);
      const every = W < 600 ? 12 : 6;
      if (d.getMinutes() !== 0 || d.getHours() % every || x(ms) < 14 || x(ms) > W - 14) continue;
      html += `<text x="${x(ms)}" y="${H - 9}" class="axis" text-anchor="middle">${String(d.getHours()).padStart(2, "0")}</text>`;
    }

    // Ceiling, deadline and now.
    if (showCeiling) {
      const yc = y(ceiling);
      html += `<line x1="0" x2="${W}" y1="${yc}" y2="${yc}" class="tl-ceiling"/><text x="${W - 6}" y="${yc - 6}" class="tl-ceiling-label" text-anchor="end">${esc(this._t("ceiling_line"))} ${esc(this._money(ceiling))}</text>`;
    }
    const dl = deadline ? new Date(deadline).getTime() : NaN;
    if (Number.isFinite(dl) && dl >= t0 && dl <= t1) {
      html += `<line x1="${x(dl)}" x2="${x(dl)}" y1="${top - 8}" y2="${H - bottom}" class="tl-deadline"/>`;
    }
    const nowMs = Date.now();
    if (nowMs >= t0 && nowMs <= t1) {
      html += `<line x1="${x(nowMs)}" x2="${x(nowMs)}" y1="${top - 8}" y2="${H - bottom}" class="tl-now"/><text x="${x(nowMs) + 5}" y="${top - 1}" class="tl-now-label">${this._t("now")}</text>`;
    }
    svg.innerHTML = html;
    svg.classList.toggle("intro", this._intro(`tl:${this._viewKey()}`));
    this._bindScrub(svg, prices, t0, t1);
  }

  _bindScrub(svg, prices, t0, t1) {
    const scrub = this.shadowRoot.querySelector(".scrub");
    const show = (clientX) => {
      const rect = svg.getBoundingClientRect();
      const k = clamp((clientX - rect.left) / rect.width, 0, 1);
      const ms = t0 + k * (t1 - t0);
      const p = prices.find((item) => new Date(item.start).getTime() <= ms && ms < new Date(item.end).getTime());
      if (!p) return;
      scrub.hidden = false;
      scrub.style.left = `${clamp(k * 100, 8, 92)}%`;
      scrub.innerHTML = `<b>${this._money(p.price)}</b><span>${esc(this._day(p.start))} ${this._time(p.start)}–${this._time(p.end)}</span>`;
      svg.querySelectorAll(".tl-bar.hot").forEach((el) => el.classList.remove("hot"));
      svg.querySelector(`.tl-bar[data-i="${prices.indexOf(p)}"]`)?.classList.add("hot");
    };
    const hide = () => {
      scrub.hidden = true;
      svg.querySelectorAll(".tl-bar.hot").forEach((el) => el.classList.remove("hot"));
    };
    svg.onpointermove = (ev) => show(ev.clientX);
    svg.onpointerdown = (ev) => show(ev.clientX);
    svg.onpointerleave = hide;
  }

  _pricesHtml({ ceiling = false } = {}) {
    return `<section class="panel prices">
        <h2>${this._t("prices_title")}</h2>
        <p class="hint empty-note" hidden>${this._t("err_no_price_data")}</p>
        <div class="timeline-wrap">
          <svg class="timeline" preserveAspectRatio="none" role="img" aria-label="${this._t("prices_title")}"></svg>
          <div class="scrub" hidden></div>
        </div>
        <div class="legend">
          <span><i class="sw window"></i>${this._t("charging_window")}</span>
          <span><i class="sw scale"></i>${this._t("per_kwh")}</span>
          ${ceiling ? `<span class="ceiling-key"><i class="sw ceiling"></i>${this._t("ceiling_line")}</span>` : ""}
        </div>
      </section>`;
  }

  /* Dial, status, facts and timeline of the page shown: everything that depends on the plan or the clock. */
  _renderLive() {
    if (this._tab === "guest") this._renderGuestLive();
    else if (this._currentCar) this._renderCarLive(this._currentCar);
    this._animatePlan = false;
  }

  // ------------------------------------------------------------------ battery (shared)

  /* What the battery on the page shows and which handles can move. */
  _batteryModel() {
    if (this._tab === "guest") {
      const inputs = this._gin;
      return {
        soc: Number(inputs.soc ?? 20),
        limit: Number(inputs.charge_limit ?? 80),
        capacity: Number(inputs.battery_capacity ?? 0),
        nowKey: "soc",
        targetKey: "charge_limit",
        canNow: true,
        canTarget: true,
        set: (changes, opts) => this._gchange(changes, opts),
        commit: () => this._gcommit({ ...this._gdraft }),
      };
    }
    const v = this._currentCar;
    if (!v) return null;
    const s = this._vs(v);
    const draft = this._vdraftId === v.id ? this._vdraft : {};
    const manual = v.soc_source !== "sensor";
    const soc = manual ? draft.manual_soc ?? v.soc ?? s.manual_soc : v.soc;
    return {
      soc: isNum(soc) ? Number(soc) : null,
      limit: Number(draft.target_soc ?? v.target ?? s.target_soc ?? 80),
      capacity: Number(v.capacity) || 0,
      min: Number(s.min_soc) || 0,
      nowKey: "manual_soc",
      targetKey: "target_soc",
      canNow: manual,
      canTarget: v.target_editable !== false,
      set: (changes, opts) => this._vchange(changes, opts),
      commit: () => this._vcommit(),
    };
  }

  _batteryHtml() {
    return `<div class="battery" role="group" aria-label="${this._t("charge")}">
        <div class="cells">
          <div class="fill-target"></div>
          <div class="fill-now"></div>
          <div class="flow"></div>
          <div class="ticks">${[20, 40, 60, 80].map((v) => `<i style="left:${v}%"></i>`).join("")}</div>
          <i class="min-mark" hidden></i>
          <button class="handle now" role="slider" aria-label="${this._t("now_level")}" aria-valuemin="0" aria-valuemax="100"></button>
          <button class="handle target" role="slider" aria-label="${this._t("target")}" aria-valuemin="0" aria-valuemax="100"></button>
        </div>
        <div class="nub"></div>
      </div>
      <div class="battery-legend">
        <span class="now-label"></span><span class="gain"></span><span class="target-label"></span>
      </div>
      <p class="hint battery-hint"></p>`;
  }

  /* The parts of the battery that change while dragging, without rebuilding the page. */
  _renderBattery() {
    const root = this.shadowRoot;
    const model = this._batteryModel();
    if (!model || !root.querySelector(".battery")) return;
    const known = model.soc !== null;
    const soc = known ? clamp(model.soc, 0, 100) : 0;
    const limit = clamp(model.limit, 0, 100);
    root.querySelector(".fill-now").style.width = `${soc}%`;
    const target = root.querySelector(".fill-target");
    target.style.left = `${soc}%`;
    target.style.width = `${Math.max(0, limit - soc)}%`;
    root.querySelector(".flow").style.cssText = `left:${soc}%;width:${Math.max(0, limit - soc)}%`;
    const now = root.querySelector(".handle.now");
    now.hidden = !known;
    now.style.left = `${soc}%`;
    now.setAttribute("aria-valuenow", Math.round(soc));
    now.setAttribute("aria-readonly", String(!model.canNow));
    now.classList.toggle("fixed", !model.canNow);
    now.tabIndex = model.canNow ? 0 : -1;
    now.dataset.label = `${Math.round(soc)} %`;
    const tgt = root.querySelector(".handle.target");
    tgt.style.left = `${limit}%`;
    tgt.setAttribute("aria-valuenow", Math.round(limit));
    tgt.setAttribute("aria-readonly", String(!model.canTarget));
    tgt.classList.toggle("fixed", !model.canTarget);
    tgt.tabIndex = model.canTarget ? 0 : -1;
    tgt.dataset.label = `${Math.round(limit)} %`;
    const minMark = root.querySelector(".min-mark");
    if (minMark) {
      minMark.hidden = !(model.min > 0);
      minMark.style.left = `${clamp(model.min || 0, 0, 100)}%`;
      minMark.title = this._t("min_mark", { pct: this._pct(model.min) });
    }
    root.querySelector(".now-label").innerHTML = known ? `${this._t("now_level")} <b>${Math.round(soc)} %</b>` : `<b class="bad-text">${this._t("soc_missing")}</b>`;
    root.querySelector(".target-label").innerHTML = `${this._t("target")} <b>${Math.round(limit)} %</b>`;
    const gain = known ? (model.capacity * Math.max(0, limit - soc)) / 100 : 0;
    root.querySelector(".gain").textContent = gain > 0 ? `+${this._t("add_energy", { kwh: this._kwh(gain) })}` : "";
    const hint = root.querySelector(".battery-hint");
    if (hint) {
      const lines = [];
      if (this._tab !== "guest" && !model.canNow && known) lines.push(this._t("soc_from_car"));
      if (this._tab !== "guest" && !model.canTarget) lines.push(this._t("target_from_car"));
      hint.textContent = lines.join(" · ");
    }
  }

  _bindBattery() {
    const root = this.shadowRoot;
    const cells = root.querySelector(".cells");
    if (!cells) return;
    const valueAt = (clientX) => {
      const rect = cells.getBoundingClientRect();
      return Math.round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
    };
    // Keep Now below the target and the target above Now.
    const bound = (model, key, v) => {
      if (key === model.nowKey) return clamp(Math.min(v, model.limit - 1), 0, 100);
      return clamp(model.soc === null ? v : Math.max(v, model.soc + 1), 0, 100);
    };
    const can = (model, key) => (key === model.nowKey ? model.canNow : model.canTarget);
    const drag = (handle, which) => {
      handle.addEventListener("pointerdown", (ev) => {
        const model = this._batteryModel();
        const key = model?.[which];
        if (!model || !can(model, key)) return;
        ev.preventDefault();
        ev.stopPropagation();
        handle.setPointerCapture(ev.pointerId);
        handle.classList.add("dragging");
        const move = (e) => {
          const m = this._batteryModel();
          if (m) m.set({ [key]: bound(m, key, valueAt(e.clientX)) }, { commit: false });
        };
        const up = () => {
          handle.classList.remove("dragging");
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", up);
          handle.removeEventListener("pointercancel", up);
          this._batteryModel()?.commit();
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", up);
        handle.addEventListener("pointercancel", up);
      });
      handle.addEventListener("keydown", (ev) => {
        const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[ev.key];
        const model = this._batteryModel();
        const key = model?.[which];
        if (!delta || !model || !can(model, key)) return;
        ev.preventDefault();
        const current = key === model.nowKey ? model.soc ?? 0 : model.limit;
        model.set({ [key]: bound(model, key, current + delta) });
      });
    };
    drag(root.querySelector(".handle.now"), "nowKey");
    drag(root.querySelector(".handle.target"), "targetKey");
    // A tap on the battery moves the closest handle that may move.
    cells.addEventListener("pointerdown", (ev) => {
      if (ev.target.classList.contains("handle")) return;
      const model = this._batteryModel();
      if (!model) return;
      const v = valueAt(ev.clientX);
      const nearNow = model.soc !== null && Math.abs(v - model.soc) <= Math.abs(v - model.limit);
      if (nearNow && model.canNow && v < model.limit) model.set({ [model.nowKey]: v });
      else if (model.canTarget && (model.soc === null || v > model.soc)) model.set({ [model.targetKey]: v });
    });
  }

  /* "Klar kl." chips: 06.00 / 07.00 / 08.00 / Andet / Ingen frist. */
  _readyChipsHtml(scope) {
    return `<div class="chips deadline" data-scope="${scope}">
        ${DEADLINE_PRESETS.map((t) => `<button data-act="${scope}-ready" data-time="${t}" data-f="${scope}-ready-${t}">${this._hhmm(t)}</button>`).join("")}
        <button data-act="${scope}-ready" data-time="custom" data-f="${scope}-ready-custom" class="custom-time">${this._t("custom")}</button>
        <label class="chip-input time" hidden><input type="time" step="900" data-ready="${scope}" aria-label="${this._t("ready_by")}"></label>
        <button data-act="${scope}-ready" data-time="none" data-f="${scope}-ready-none" class="none">${this._t("no_deadline")}</button>
      </div>`;
  }

  _renderReadyChips(scope, useDeadline, time) {
    const root = this.shadowRoot;
    const box = root.querySelector(`.deadline[data-scope="${scope}"]`);
    if (!box) return;
    time = String(time || "07:00").slice(0, 5);
    const preset = DEADLINE_PRESETS.includes(time);
    const custom = this._customTime[scope] || (useDeadline && !preset);
    box.querySelectorAll("button").forEach((b) => {
      const kind = b.dataset.time;
      const on = kind === "none" ? !useDeadline : kind === "custom" ? false : useDeadline && kind === time && !this._customTime[scope];
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
      if (kind === "custom") b.hidden = custom;
    });
    const input = box.querySelector("input");
    if (root.activeElement !== input) input.value = time;
    input.parentElement.hidden = !custom;
    input.parentElement.classList.toggle("on", custom && useDeadline);
  }

  _renderSegmented(selector, continuous) {
    this.shadowRoot.querySelectorAll(`${selector} button`).forEach((b) => {
      const on = (b.dataset.mode === "continuous") === continuous;
      b.classList.toggle("on", on);
      b.setAttribute("aria-checked", on);
    });
  }

  _planTypeHtml(scope) {
    return `<div class="segmented plan-type" data-scope="${scope}" role="radiogroup" aria-label="${this._t("mode")}">
        <button role="radio" data-act="${scope}-cont" data-mode="continuous">${this._t("continuous")}</button>
        <button role="radio" data-act="${scope}-cont" data-mode="split">${this._t("split")}</button>
      </div>`;
  }

  // ------------------------------------------------------------------ car page

  _carPageHtml(v) {
    return `<div class="page car-page" data-id="${esc(v.id)}">
      <header class="car-head"></header>

      <div class="col left">
        <section class="hero">
          <div class="dial-wrap">
            <svg class="dial big" viewBox="0 0 400 400" role="img" aria-label="${this._t("prices_title")}"></svg>
            <div class="dial-center big"></div>
          </div>
          <div class="status-line"></div>
        </section>
        <div class="car-notes"></div>
        <section class="panel facts" hidden></section>
      </div>

      <div class="col right">
        <section class="panel charging">
          <h2>${ICONS.plan}<span>${this._t("charge")}</span></h2>
          ${this._modesHtml(v, { large: true })}
          ${this._batteryHtml()}
          <div class="fields">
            <div class="field">
              <span>${this._t("ready_by")}</span>
              ${this._readyChipsHtml("car")}
            </div>
            <div class="field schedule-field">
              <span>${this._t("schedule")}</span>
              <div class="schedule-box"></div>
            </div>
            <div class="field">
              <span>${this._t("mode")}</span>
              ${this._planTypeHtml("car")}
            </div>
          </div>
          <div class="car-info"></div>
        </section>

        <section class="panel rules">
          <h2>${ICONS.rules}<span>${this._t("rules")}</span></h2>
          <div class="rules-body"></div>
        </section>

        <section class="panel notify">
          <h2>${ICONS.bell}<span>${this._t("notifications")}</span></h2>
          <div class="notify-body"></div>
        </section>
      </div>

      ${this._pricesHtml({ ceiling: true })}
    </div>`;
  }

  /* Update the car page in place, so typing, dragging and animations are not interrupted. */
  _renderCarPage({ live = true } = {}) {
    const v = this._currentCar;
    const root = this.shadowRoot;
    if (!v || !root.querySelector(".car-page")) return;
    const s = this._vs(v);
    const lang = this._lang;

    const sub = this._carSubline(v);
    const tone = this._statusTone(v);
    this._patch(
      root.querySelector(".car-head"),
      JSON.stringify([v.name, v.status, sub, tone, lang, v.image, this._busy === `photo:${v.id}`]),
      `<button class="icon back" data-act="back" data-f="back" aria-label="${this._t("back_label")}">${ICONS.back}</button>
       ${this._photoHtml(v.id, v.image, ICONS.car, { wide: true, original: v.image_original })}
       <div class="car-title"><h1>${esc(v.name)}</h1><span>${esc(sub)}</span></div>
       <span class="pill ${tone}">${esc(this._statusText(v))}</span>`,
    );

    const mode = v.mode;
    root.querySelectorAll(".car-page .modes button").forEach((b) => {
      b.classList.toggle("on", b.dataset.mode === mode);
      b.setAttribute("aria-checked", b.dataset.mode === mode);
    });

    this._renderBattery();
    root.querySelector(".car-page .flow")?.classList.toggle("on", v.control === "charge");
    this._renderReadyChips("car", s.use_ready_by !== false, s.ready_by);
    this._renderSegmented('.plan-type[data-scope="car"]', Boolean(s.continuous));

    const schedule = s.schedule || {};
    this._patch(
      root.querySelector(".schedule-box"),
      JSON.stringify([schedule, s.ready_by, s.use_ready_by, this._schedDay, lang]),
      this._scheduleHtml(s),
    );
    this._patch(root.querySelector(".car-info"), JSON.stringify([v.calendar, v.control_source, v.charger, v.power, v.capacity, lang]), this._carInfoHtml(v));
    this._patch(root.querySelector(".rules-body"), JSON.stringify([this._ruleValues(s), this._currency, lang]), this._rulesHtml(v, s));
    this._patch(
      root.querySelector(".notify-body"),
      JSON.stringify([s.reminder, s.reminder_time, s.reminder_soc, s.reminder_price_enabled, s.reminder_price, s.reminder_days, s.reminder_repeat, s.reminder_horizon, s.notify_targets, this._state.config?.notify_names, s.live_notification, s.notify_done, this._state.config?.notify, lang]),
      this._notifyHtml(s),
    );
    if (live) this._renderCarLive(v);
  }

  /* The plan shown on the car page: the preview while settings are being changed, else the car's plan. */
  _carShown(v) {
    const preview = this._vpreview && this._vpreview.id === v.id && this._drafting(v) ? this._vpreview : null;
    if (preview) {
      return {
        plan: hasSegments(preview.plan) ? { ...preview.plan, preview: true } : null,
        deadline: preview.deadline,
        error: preview.error,
        preview: true,
      };
    }
    return { plan: hasSegments(v.plan) ? { ...v.plan, preview: false } : null, deadline: v.deadline, error: null, preview: false };
  }

  _renderCarLive(v) {
    const root = this.shadowRoot;
    if (!root.querySelector(".car-page")) return;
    const shown = this._carShown(v);
    const s = this._vs(v);
    const ceiling = this._ceilingOf(v, s, shown.plan);
    this._renderDial(shown.plan, { deadline: shown.deadline, flow: v.control === "charge", ceiling });
    const [kind, text] = this._carStatus(v, shown);
    this._renderStatusLine(kind, text);
    const extra = shown.plan && isNum(shown.plan.end_soc) ? [[this._t("target"), this._pct(shown.plan.end_soc)]] : [];
    this._renderFacts(shown.plan, extra);
    this._patch(root.querySelector(".car-notes"), JSON.stringify([v.problem, v.control_error, shown.plan && [shown.plan.limited, shown.plan.min_only, shown.plan.short, shown.plan.opportunistic, shown.plan.ceiling], shown.deadline, this._lang]), this._notesHtml(v, shown.plan ? { ...shown.plan, deadline: shown.deadline } : null));
    this._renderTimeline(shown.plan, { deadline: shown.deadline, ceiling: s.price_ceiling_enabled || shown.plan?.opportunistic ? ceiling : null });
    root.querySelector(".ceiling-key")?.toggleAttribute("hidden", !(s.price_ceiling_enabled || shown.plan?.opportunistic));
  }

  /* The status line under the clock: what happens now, in the tone of the status pill. */
  _carStatus(v, shown) {
    if (shown.error) return ["error", this._t(`err_${shown.error}`)];
    // A problem is explained in the notes below the clock; the line only says the status.
    if (v.problem) return ["error", this._statusText(v)];
    const charging = v.control === "charge";
    let text = this._statusText(v);
    if (["no_price_data", "not_enough_prices", "no_window"].includes(v.status)) text = this._t(`err_${v.status}`);
    const plan = shown.plan;
    if (plan && (v.status === "planned" || (v.status === "charging" && charging))) {
      const timing = this._planTiming(plan.segments, v.status === "charging");
      if (timing) text = v.status === "planned" ? `${text} · ${timing}` : timing;
    }
    if (shown.preview && plan) text = `${this._t("preview")} · ${this._planTiming(plan.segments, false) || this._statusText(v)}`;
    const tone = this._statusTone(v);
    const kind = shown.preview ? "planned" : charging ? "charging" : v.status === "completed" ? "completed" : { teal: "planned", sand: "sand", coral: "error" }[tone] || "grey";
    return [kind, text];
  }

  /* Man–Søn: each day's ready-by time, with a small picker for the chosen day. */
  _scheduleHtml(s) {
    const schedule = s.schedule || {};
    const disabled = s.use_ready_by === false;
    const chips = WEEKDAYS.map((day) => {
      const value = schedule[day] || "default";
      const shown = value === "default" ? this._hhmm(s.ready_by) : value === "none" ? "–" : this._hhmm(value);
      const cls = [value === "default" ? "std" : value === "none" ? "none" : "own", this._schedDay === day ? "open" : ""].join(" ");
      return `<button class="day ${cls}" data-act="sched-day" data-day="${day}" data-f="sched-${day}" aria-expanded="${this._schedDay === day}"
        aria-label="${esc(`${this._t(`day_${day}`)}: ${value === "none" ? this._t("no_deadline") : shown}`)}"><b>${this._t(`day_${day}`)}</b><span>${shown}</span></button>`;
    }).join("");
    let picker = "";
    if (this._schedDay) {
      const day = this._schedDay;
      const value = schedule[day] || "default";
      const own = value !== "default" && value !== "none";
      picker = `<div class="sched-picker" role="group" aria-label="${esc(this._t("schedule_for", { day: this._t(`dayl_${day}`) }))}">
        <p>${esc(this._t("schedule_for", { day: this._t(`dayl_${day}`) }))}</p>
        <div class="chips">
          <button data-act="sched-set" data-value="default" data-f="sched-std" class="${value === "default" ? "on" : ""}" aria-pressed="${value === "default"}">${this._t("schedule_use_default", { time: this._hhmm(s.ready_by) })}</button>
          <label class="chip-input time ${own ? "on" : ""}"><input type="time" step="900" data-sched="${day}" value="${own ? esc(value) : esc(s.ready_by || "07:00")}" aria-label="${this._t("schedule_other")}"></label>
          <button data-act="sched-set" data-value="none" data-f="sched-none" class="none ${value === "none" ? "on" : ""}" aria-pressed="${value === "none"}">${this._t("no_deadline")}</button>
        </div>
      </div>`;
    }
    return `<div class="week ${disabled ? "dim" : ""}">${chips}</div>${disabled ? `<small class="hint">${this._t("schedule_hint")}</small>` : ""}${picker}`;
  }

  _carInfoHtml(v) {
    const lines = [];
    const cal = v.calendar;
    if (cal && cal.start) {
      const when = this._t("calendar_when", { day: this._day(cal.start).toLowerCase(), time: this._time(cal.start) });
      const target = isNum(cal.target) ? this._t("calendar_target", { target: this._pct(cal.target) }) : "";
      const text = `${this._t("calendar_trip", { summary: cal.summary || "", when })}${target}`;
      lines.push(`<p class="info-line cal">${ICONS.calendar}<span>${esc(text)}</span></p>`);
    }
    const source = this._t(`control_${v.control_source || "none"}`);
    const charger = [
      v.charger?.name,
      isNum(v.power) ? `${this._num(v.power)} kW` : "",
      isNum(v.capacity) ? `${this._t("battery_size")} ${this._kwh(v.capacity, 1)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(`<p class="info-line">${ICONS.charger}<span>${this._t("control_source")}: <b>${esc(source)}</b>${charger ? ` · ${esc(charger)}` : ""}</span></p>`);
    return lines.join("");
  }

  _ruleValues(s) {
    return [
      "min_soc", "price_ceiling_enabled", "price_ceiling", "low_price_charging", "low_price_level", "low_soc_charging", "low_soc_level",
      "opportunistic", "opportunistic_level", "follow_level", "keep_charger_on", "use_earliest_start", "earliest_start", "charging_efficiency",
    ].map((key) => s[key]);
  }

  _switchHtml(key, on, label) {
    return `<button class="switch" role="switch" data-act="toggle" data-key="${key}" data-f="sw-${key}" aria-checked="${Boolean(on)}" aria-label="${esc(label)}"><i></i></button>`;
  }

  /* A small number field with its unit; stored on change. */
  _valueHtml(key, value, { unit, step = 1, min = 0, max = 100, label }) {
    return `<label class="unit-input small"><input type="number" inputmode="decimal" data-set="${key}" data-min="${min}" data-max="${max}" step="${step}" min="${min}" max="${max}"
      value="${isNum(value) ? esc(value) : ""}" aria-label="${esc(label)}"><span>${esc(unit)}</span></label>`;
  }

  _ruleRow({ icon, title, hint, control, extra = "", off = false }) {
    return `<div class="rule ${off ? "off" : ""}">
      <span class="rule-icon">${ICONS[icon] || ""}</span>
      <div class="rule-text"><strong>${esc(title)}</strong>${hint ? `<small>${esc(hint)}</small>` : ""}${extra}</div>
      <div class="rule-ctl">${control}</div>
    </div>`;
  }

  _rulesHtml(v, s) {
    const price = `${this._unit}/kWh`;
    const rows = [];
    rows.push(
      this._ruleRow({
        icon: "charge",
        title: this._t("rule_min"),
        hint: this._t("rule_min_hint"),
        control: this._valueHtml("min_soc", s.min_soc, { unit: "%", label: this._t("rule_min") }),
      }),
    );
    rows.push(
      this._ruleRow({
        icon: "rules",
        title: this._t("rule_ceiling"),
        hint: this._t("rule_ceiling_hint"),
        off: !s.price_ceiling_enabled,
        control: `${s.price_ceiling_enabled ? this._valueHtml("price_ceiling", s.price_ceiling, { unit: price, step: 0.01, min: -5, max: 20, label: this._t("rule_ceiling") }) : ""}${this._switchHtml("price_ceiling_enabled", s.price_ceiling_enabled, this._t("rule_ceiling"))}`,
      }),
    );
    rows.push(
      this._ruleRow({
        icon: "lowprice",
        title: this._t("rule_low_price"),
        hint: this._t("rule_low_price_hint"),
        off: !s.low_price_charging,
        control: `${s.low_price_charging ? this._valueHtml("low_price_level", s.low_price_level, { unit: price, step: 0.01, min: -5, max: 20, label: this._t("rule_low_price") }) : ""}${this._switchHtml("low_price_charging", s.low_price_charging, this._t("rule_low_price"))}`,
      }),
    );
    rows.push(
      this._ruleRow({
        icon: "boost",
        title: this._t("rule_low_soc"),
        hint: this._t("rule_low_soc_hint"),
        off: !s.low_soc_charging,
        control: `${s.low_soc_charging ? this._valueHtml("low_soc_level", s.low_soc_level, { unit: "%", label: this._t("rule_low_soc") }) : ""}${this._switchHtml("low_soc_charging", s.low_soc_charging, this._t("rule_low_soc"))}`,
      }),
    );
    rows.push(this._opportunisticHtml(s));
    rows.push(
      this._ruleRow({
        icon: "charger",
        title: this._t("rule_keep_on"),
        hint: this._t("rule_keep_on_hint"),
        off: !s.keep_charger_on,
        control: this._switchHtml("keep_charger_on", s.keep_charger_on, this._t("rule_keep_on")),
      }),
    );
    rows.push(
      this._ruleRow({
        icon: "history",
        title: this._t("rule_earliest"),
        hint: this._t("rule_earliest_hint"),
        off: !s.use_earliest_start,
        control: `${s.use_earliest_start ? `<label class="chip-input time on"><input type="time" step="900" data-set="earliest_start" data-type="time" value="${esc(s.earliest_start || "18:00")}" aria-label="${this._t("rule_earliest")}"></label>` : ""}${this._switchHtml("use_earliest_start", s.use_earliest_start, this._t("rule_earliest"))}`,
      }),
    );
    const eff = isNum(s.charging_efficiency) ? Number(s.charging_efficiency) : 90;
    rows.push(`<label class="field col eff-field"><span>${this._t("efficiency")} <b class="eff-value">${Math.round(eff)} %</b></span>
        <input type="range" min="50" max="100" step="1" value="${eff}" data-set="charging_efficiency" data-range="1" aria-label="${this._t("efficiency")}">
        <small>${this._t("efficiency_hint")}</small></label>`);
    return rows.join("");
  }

  _opportunisticHtml(s) {
    const value = OPPORTUNISTIC.includes(s.opportunistic) ? s.opportunistic : "off";
    const labels = { off: "opp_off", lower_ceiling: "opp_lower", follow_end_price: "opp_follow" };
    const levelKey = value === "follow_end_price" ? "follow_level" : "opportunistic_level";
    const level = s[levelKey];
    let hint = this._t("opp_off_hint");
    if (value === "lower_ceiling") hint = this._t("opp_lower_hint", { pct: this._pct(level) });
    if (value === "follow_end_price") hint = this._t("opp_follow_hint", { pct: this._pct(level) });
    const needsCeiling = value === "lower_ceiling" && !s.price_ceiling_enabled;
    const segmented = `<div class="segmented opp" role="radiogroup" aria-label="${this._t("rule_opp")}">${OPPORTUNISTIC.map(
      (o) => `<button role="radio" data-act="opp" data-value="${o}" data-f="opp-${o}" aria-checked="${o === value}" class="${o === value ? "on" : ""}">${this._t(labels[o])}</button>`,
    ).join("")}</div>`;
    const levelInput = value === "off" ? "" : `<div class="opp-level"><span>${this._t("opp_level")}</span>${this._valueHtml(levelKey, level, { unit: "%", max: levelKey === "follow_level" ? 200 : 100, label: this._t("opp_level") })}</div>`;
    return `<div class="rule wide ${value === "off" ? "off" : ""}">
      <span class="rule-icon">${ICONS.plan}</span>
      <div class="rule-text"><strong>${this._t("rule_opp")}</strong><small>${esc(hint)}</small>${needsCeiling ? `<small class="warn-text">${this._t("opp_needs_ceiling")}</small>` : ""}</div>
      <div class="rule-full">${segmented}${levelInput}</div>
    </div>`;
  }

  _notifyHtml(s) {
    const missing = !(this._state.config?.notify || []).length;
    const reminderExtra = s.reminder
      ? `<div class="inline-values">
          <span>${this._t("reminder_time")}</span><label class="chip-input time on"><input type="time" step="900" data-set="reminder_time" data-type="time" value="${esc(s.reminder_time || "16:00")}" aria-label="${this._t("reminder_time")}"></label>
          <span>${this._t("reminder_soc")}</span>${this._valueHtml("reminder_soc", s.reminder_soc, { unit: "%", label: this._t("reminder_soc") })}
        </div>
        <div class="inline-values">
          <span>${this._t("reminder_days")}</span>
          <div class="chips days">${WEEKDAYS.map((day) => {
            const on = (s.reminder_days || WEEKDAYS).includes(day);
            return `<button data-act="rem-day" data-day="${day}" data-f="rem-${day}" class="${on ? "on" : ""}" aria-pressed="${on}" aria-label="${esc(this._t(`dayl_${day}`))}">${this._t(`day_${day}`)}</button>`;
          }).join("")}</div>
        </div>
        <div class="inline-values">
          <span>${this._t("reminder_repeat")}</span>${this._valueHtml("reminder_repeat", s.reminder_repeat ?? 0, { unit: this._t("minutes_short"), step: 5, min: 0, max: 240, label: this._t("reminder_repeat") })}
          <small class="hint">${this._t("reminder_repeat_hint")}</small>
        </div>
        <div class="inline-values">
          <span>${this._t("reminder_price")}</span>
          ${s.reminder_price_enabled ? this._valueHtml("reminder_price", s.reminder_price, { unit: `${this._unit}/kWh`, step: 0.01, min: -5, max: 20, label: this._t("reminder_price") }) : ""}
          ${s.reminder_price_enabled ? `<span>${this._t("reminder_horizon")}</span>${this._valueHtml("reminder_horizon", s.reminder_horizon ?? 24, { unit: this._t("hours_short"), step: 1, min: 1, max: 48, label: this._t("reminder_horizon") })}` : ""}
          ${this._switchHtml("reminder_price_enabled", s.reminder_price_enabled, this._t("reminder_price"))}
        </div>`
      : "";
    const phones = this._state.config?.notify || [];
    const names = this._state.config?.notify_names || {};
    const chosen = s.notify_targets?.length ? s.notify_targets : phones;
    const targets =
      phones.length > 1
        ? `<div class="notify-to"><span>${this._t("notify_to")}</span><div class="chips">${phones
            .map((phone) => {
              const on = chosen.includes(phone);
              return `<button data-act="notify-to" data-phone="${esc(phone)}" data-f="nt-${esc(phone)}" class="${on ? "on" : ""}" aria-pressed="${on}">${esc(names[phone] || phone)}</button>`;
            })
            .join("")}</div><small class="hint">${this._t("notify_to_hint")}</small></div>`
        : "";
    return `${missing ? `<p class="note-line warn">${ICONS.info}<span>${this._t("notify_missing")} <a href="/config/integrations/integration/ev_planner" target="_top">${this._t("open_integration")}</a></span></p>` : ""}
      ${this._ruleRow({
        icon: "bell",
        title: this._t("reminder"),
        hint: this._t("reminder_hint", { time: this._hhmm(s.reminder_time || "16:00"), soc: this._pct(s.reminder_soc) }),
        off: !s.reminder,
        extra: reminderExtra,
        control: this._switchHtml("reminder", s.reminder, this._t("reminder")),
      })}
      ${this._ruleRow({ icon: "charge", title: this._t("live"), off: !s.live_notification, control: this._switchHtml("live_notification", s.live_notification, this._t("live")) })}
      ${this._ruleRow({ icon: "depart", title: this._t("notify_done"), off: !s.notify_done, control: this._switchHtml("notify_done", s.notify_done, this._t("notify_done")) })}
      ${targets}`;
  }

  // ------------------------------------------------------------------ guest (EV Guest)

  /* The guest inputs with the changes not stored yet. */
  get _gin() {
    return { ...(this._guest?.inputs || {}), ...this._gdraft };
  }

  /* True when the stored guest plan was made with other inputs than shown now. */
  get _gstale() {
    const g = this._guest;
    const info = g?.plan?.info;
    if (!info || !hasSegments(g.plan) || g.plan_locked) return false;
    const used = info.inputs || { soc: info.soc, charge_limit: info.limit };
    const inputs = this._gin;
    return (
      Object.keys(this._gdraft).length > 0 ||
      Object.entries(used).some(([key, value]) => String(value) !== String(inputs[key]))
    );
  }

  _guestHtml() {
    const g = this._guest;
    const lookingUp = this._busy === "lookup";
    const plate = this._gin.license_plate || "";
    const chargers = this._chargers;
    return `<div class="page guest-page">
      <div class="col left">
      <section class="hero">
        <div class="dial-wrap">
          <svg class="dial big" viewBox="0 0 400 400" role="img" aria-label="${this._t("prices_title")}"></svg>
          <div class="dial-center big"></div>
        </div>
        <div class="status-line"></div>
      </section>
      <section class="panel facts" hidden></section>
      </div>

      <div class="col right">
      <section class="panel guest">
        <h2>${ICONS.guest}<span>${this._t("guest")}</span></h2>
        <div class="plate-row">
          <label class="plate ${lookingUp ? "scanning" : ""}">
            <span class="eu" aria-hidden="true"><i></i>DK</span>
            <input id="plate" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="10"
              placeholder="${this._t("plate_placeholder")}" value="${esc(plate)}" aria-label="${this._t("guest")}">
            <span class="scan" aria-hidden="true"></span>
          </label>
          ${g?.lookup ? `<button class="btn lookup" data-act="lookup" ${lookingUp ? "disabled" : ""}>${ICONS.search}<span>${lookingUp ? this._t("looking_up") : this._t("lookup")}</span></button>` : ""}
        </div>
        <div class="guest-body"></div>
        <div class="field battery-field">
          <span>${this._t("battery")}</span>
          <div class="stepper" data-key="battery_capacity" data-step="0.5" data-min="1" data-max="300">
            <button data-act="step" data-dir="-1" aria-label="−">−</button><output></output><button data-act="step" data-dir="1" aria-label="+">+</button>
          </div>
        </div>
      </section>

      <section class="panel charging">
        <h2>${ICONS.plan}<span>${this._t("charge")}</span></h2>
        ${this._batteryHtml()}
        <div class="fields">
        ${
          chargers.length > 1
            ? `<div class="field">
          <span>${this._t("charge_point")}</span>
          <div class="chips charger-pick">${chargers
            .map((c) => `<button data-act="g-charger" data-id="${esc(c.id)}" data-f="gc-${esc(c.id)}">${esc(c.name)}</button>`)
            .join("")}</div>
        </div>`
            : ""
        }
        <div class="field">
          <span>${this._t("charger")}</span>
          <div class="chips power">
            ${CHARGER_PRESETS.map((kw) => `<button data-act="g-power" data-kw="${kw}">${this._num(kw, 1)} kW</button>`).join("")}
            <label class="chip-input kw"><input type="number" min="0.1" max="350" step="0.1" inputmode="decimal" data-gpower="1" placeholder="${this._t("custom")}" aria-label="${this._t("charger")}"><span>kW</span></label>
          </div>
        </div>

        <div class="field">
          <span>${this._t("ready_by")}</span>
          ${this._readyChipsHtml("g")}
        </div>

        <div class="field">
          <span>${this._t("mode")}</span>
          ${this._planTypeHtml("g")}
        </div>
        </div>

        <div class="actions">
          <button class="btn primary calc" data-act="g-plan">${ICONS.charge}<span></span></button>
          <button class="btn ghost charge-now" data-act="g-now">${ICONS.boost}<span>${this._t("guest_charge_now")}</span></button>
          <button class="btn ghost new-guest" data-act="g-new">${ICONS.plus}<span>${this._t("new_guest")}</span></button>
        </div>
        <p class="note"></p>
      </section>
      </div>

      ${this._pricesHtml()}
    </div>`;
  }

  /* Plate, lookup button and the found car. */
  _renderGuestHead() {
    const root = this.shadowRoot;
    const g = this._guest;
    const box = root.querySelector(".guest-body");
    if (!box || !g) return;
    const plate = root.querySelector("#plate");
    if (plate && root.activeElement !== plate) plate.value = this._gin.license_plate || "";
    root.querySelector(".plate")?.classList.toggle("scanning", this._busy === "lookup");
    const lookup = root.querySelector(".lookup");
    if (lookup) {
      lookup.disabled = this._busy === "lookup";
      lookup.querySelector("span").textContent = this._busy === "lookup" ? this._t("looking_up") : this._t("lookup");
    }
    this._patch(box, JSON.stringify([g.car, g.lookup, this._lang]), this._guestBodyHtml());
  }

  _guestBodyHtml() {
    const g = this._guest;
    const car = g.car || {};
    const hasCar = car.brand || car.model;
    if (!hasCar) return `<p class="hint">${this._t(g.lookup ? "no_car" : "no_car_nokey")}</p>`;
    return `<div class="car reveal">
        <div class="car-name"><strong>${esc([car.brand, car.model].filter(Boolean).join(" "))}</strong>
          <span>${esc([car.variant, car.model_year ? `${this._t("model_year")} ${car.model_year}` : ""].filter(Boolean).join(", "))}</span></div>
        ${isNum(car.match_score) ? this._matchRing(car.match_score) : ""}
      </div>`;
  }

  _matchRing(score) {
    const pct = clamp(Number(score), 0, 100);
    const c = 2 * Math.PI * 16;
    return `<div class="match" title="${this._t("match_hint")}">
      <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" class="track"/><circle cx="20" cy="20" r="16" class="val"
        style="stroke-dasharray:${((pct / 100) * c).toFixed(1)} ${c.toFixed(1)}"/></svg>
      <span><b>${Math.round(pct)}</b>${this._t("match")}</span></div>`;
  }

  /* The parts of the guest page that change while dragging, without rebuilding the page. */
  _renderGuestInputs() {
    const root = this.shadowRoot;
    const g = this._guest;
    if (!g || !root.querySelector(".guest-page")) return;
    const inputs = this._gin;
    this._renderBattery();

    const stepper = root.querySelector('.stepper[data-key="battery_capacity"] output');
    if (stepper) stepper.textContent = this._kwh(inputs.battery_capacity, 1);

    const chargerId = inputs.charger || g.charger?.id;
    root.querySelectorAll(".charger-pick button").forEach((b) => {
      const on = b.dataset.id === chargerId;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });

    const kw = Number(inputs.charger_power);
    let preset = false;
    root.querySelectorAll(".power button").forEach((b) => {
      const on = Math.abs(Number(b.dataset.kw) - kw) < 0.01;
      preset ||= on;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    const custom = root.querySelector(".power input");
    if (custom && root.activeElement !== custom) custom.value = preset || !isNum(kw) ? "" : kw;
    custom?.parentElement.classList.toggle("on", !preset);

    this._renderReadyChips("g", inputs.use_completion_time !== false, inputs.charge_completion_time);
    this._renderSegmented('.plan-type[data-scope="g"]', inputs.continuous_charging_preferred !== false);

    const calc = root.querySelector(".calc");
    calc.querySelector("span").textContent =
      this._busy === "calculate" ? this._t("calculating") : hasSegments(g.plan) ? this._t("recalculate") : this._t("calculate");
    calc.disabled = this._busy === "calculate" || this._busy === "charge_now";
    // While the guest charges, the button stops it; otherwise it starts charging now.
    const now = root.querySelector(".charge-now");
    const stop = Boolean(g.charge_now);
    const label =
      this._busy === "charge_now"
        ? this._t("charging_now_busy")
        : this._busy === "stop"
          ? this._t("stopping")
          : this._t(stop ? "guest_stop" : "guest_charge_now");
    this._patch(now, JSON.stringify([stop, label]), `${ICONS[stop ? "pause" : "boost"]}<span>${esc(label)}</span>`);
    now.dataset.act = stop ? "g-stop" : "g-now";
    now.classList.toggle("stop", stop);
    now.disabled = Boolean(this._busy);
    calc.classList.toggle("pulse", this._gstale);
    root.querySelector(".guest-page .note").textContent = this._gstale ? this._t("changed") : "";
  }

  _guestShown() {
    const g = this._guest;
    const plan = g.plan;
    const usePreview = this._gpreview && (this._gstale || !hasSegments(plan)) && !g.plan_locked;
    if (usePreview && !this._gpreview.error && hasSegments(this._gpreview)) return { ...this._gpreview, preview: true };
    if (hasSegments(plan)) return { ...plan, preview: false };
    return null;
  }

  /* The guest's deadline as a moment: after the plan's end when there is one. */
  _guestDeadline(plan) {
    const inputs = this._gin;
    if (inputs.use_completion_time === false) return null;
    // The first ready-by time at or after the plan's end (EV Guest), or after now without a plan.
    const from = hasSegments(plan) ? new Date(new Date(plan.segments.at(-1).end).getTime() - 1) : new Date();
    return nextAt(inputs.charge_completion_time || "07:00", from).toISOString();
  }

  _renderGuestLive() {
    const g = this._guest;
    if (!g || !this.shadowRoot.querySelector(".guest-page")) return;
    const plan = this._guestShown();
    const deadline = this._guestDeadline(plan);
    this._renderDial(plan, { deadline, flow: g.charge_now });
    this._renderGuestStatus();
    const extra = [];
    if (plan && !plan.preview && g.energy_entity && isNum(g.plan.measured_energy)) {
      extra.push([this._t("measured"), this._kwh(g.plan.measured_energy, 2)]);
      extra.push([this._t("measured_cost"), this._money(g.plan.measured_cost)]);
    }
    this._renderFacts(plan, extra);
    this._renderTimeline(plan, { deadline: plan ? deadline : null });
    this._renderGuestBatteryLive();
  }

  _renderGuestStatus() {
    const g = this._guest;
    let text = "";
    let kind = g.status;
    const segments = g.plan?.segments || [];
    if (g.error) {
      text = this._t(`err_${g.error}`);
      kind = "error";
    } else if (g.status === "charging" && segments.length) {
      text = this._planTiming(segments, true);
    } else if (g.status === "planned") {
      text = this._planTiming(segments, false) || this._t("status_planned");
    } else if (g.status === "stopped" && segments.length) {
      text = this._t("stopped_at", { time: this._time(segments.at(-1).end) });
    } else if (g.status === "completed" && segments.length) {
      text =
        g.release && g.release.reason === "unplugged"
          ? this._t("unplugged_at", { time: this._time(g.release.at) })
          : this._t("completed_at", { time: this._time(segments.at(-1).end) });
    } else {
      text = this._t("status_ready");
    }
    if (!g.error && g.plan?.progress?.behind_plan) {
      text = `${text} ${this._t("behind_plan")}`.trim();
      kind = "behind";
    }
    this._renderStatusLine(kind, text);
  }

  /* While charging: the battery fills as time passes, from the plan's start level. */
  _renderGuestBatteryLive() {
    const root = this.shadowRoot;
    const g = this._guest;
    const info = g.plan?.info;
    const flow = root.querySelector(".guest-page .flow");
    if (!flow) return;
    flow.classList.toggle("on", Boolean(g.charge_now));
    const est = root.querySelector(".battery-legend .gain");
    if (!g.charge_now || !info || !g.plan.speed) return;
    // With an energy meter the estimate follows the energy actually delivered.
    const progress = g.plan.progress;
    if (progress && progress.source === "meter") {
      const pct = clamp(Number(progress.soc), 0, 100);
      root.querySelector(".fill-now").style.width = `${pct}%`;
      if (est) est.textContent = this._t("est_level_measured", { pct: `${Math.round(pct)} %` });
      return;
    }
    const now = Date.now();
    let hours = 0;
    for (const seg of g.plan.segments) {
      const a = new Date(seg.start).getTime();
      const b = new Date(seg.end).getTime();
      hours += Math.max(0, Math.min(now, b) - a) / 3600000;
    }
    const pct = clamp(Number(info.soc) + hours * g.plan.speed, 0, Number(info.limit));
    root.querySelector(".fill-now").style.width = `${pct}%`;
    if (est) est.textContent = this._t("est_level", { pct: `${Math.round(pct)} %` });
  }

  async _lookup() {
    const plate = this.shadowRoot.querySelector("#plate")?.value ?? "";
    await this._gcommit({ license_plate: plate });
    await this._run("lookup", "ev_planner/guest_lookup");
  }

  async _guestPlan() {
    await this._gcommit(this._gdraft);
    if (await this._run("calculate", "ev_planner/guest_plan")) {
      this._gpreview = null;
      this._renderLive();
    }
  }

  async _guestChargeNow() {
    await this._gcommit(this._gdraft);
    if (await this._run("charge_now", "ev_planner/guest_charge_now")) {
      this._gpreview = null;
      this._renderLive();
    }
  }

  async _newGuest() {
    this._gdraft = {};
    this._gpreview = null;
    await this._run("new_guest", "ev_planner/guest_new");
  }

  /* Store changed guest inputs. While a plan exists, the change is shown as a preview first. */
  async _gcommit(inputs) {
    clearTimeout(this._gcommitTimer);
    const changes = Object.fromEntries(Object.entries(inputs).filter(([, v]) => v !== undefined));
    if (!Object.keys(changes).length) return;
    try {
      await this._ws("ev_planner/guest_set", { inputs: changes });
      for (const [key, value] of Object.entries(changes)) if (this._gdraft[key] === value) delete this._gdraft[key];
    } catch (err) {
      this._showError(err);
    }
  }

  _gchange(inputs, { commit = true } = {}) {
    Object.assign(this._gdraft, inputs);
    this._renderGuestInputs();
    clearTimeout(this._gpreviewTimer);
    this._gpreviewTimer = setTimeout(() => this._loadGuestPreview(), PREVIEW_DELAY);
    if (commit) {
      clearTimeout(this._gcommitTimer);
      this._gcommitTimer = setTimeout(() => this._gcommit({ ...this._gdraft }), COMMIT_DELAY);
    }
  }

  async _loadGuestPreview() {
    const inputs = { ...this._gin };
    delete inputs.license_plate;
    const ask = JSON.stringify(inputs);
    this._gpreviewAsk = ask;
    try {
      const result = await this._ws("ev_planner/guest_preview", { inputs: this._guestWsInputs(inputs) });
      if (this._gpreviewAsk !== ask) return;
      this._gpreview = result;
    } catch {
      this._gpreview = null;
    }
    this._renderLive();
  }

  _guestWsInputs(inputs) {
    const keys = [
      "soc",
      "charge_limit",
      "battery_capacity",
      "charger_power",
      "charging_efficiency",
      "charge_completion_time",
      "use_completion_time",
      "continuous_charging_preferred",
      "charger",
    ];
    return Object.fromEntries(keys.filter((key) => inputs[key] !== undefined && inputs[key] !== null).map((key) => [key, inputs[key]]));
  }

  // ------------------------------------------------------------------ history

  _historyHtml() {
    const cars = this._cars;
    const guestHistory = this._guest?.history || [];
    const carsWithData = cars.filter((v) => (v.history || []).length || Object.keys(v.months || {}).length);
    if (!carsWithData.length && !guestHistory.length) {
      return `<section class="empty">${MARK}<p>${this._t(cars.length ? "car_history_empty" : "history_empty")}</p></section>`;
    }
    return `<div class="page stack">
      ${carsWithData.map((v) => this._carHistoryHtml(v)).join("")}
      ${guestHistory.length ? this._guestHistoryHtml(guestHistory) : ""}
    </div>`;
  }

  _carHistoryHtml(v) {
    const month = v.month || { energy: 0, cost: 0, sessions: 0 };
    const history = v.history || [];
    const all = this._historyMore.has(v.id);
    const shown = all ? history : history.slice(0, HISTORY_PAGE);
    return `<section class="car-history">
      <h2 class="section-title">${ICONS.car}<span>${esc(v.name)}</span></h2>
      <div class="panel totals">
        <p class="count">${this._t("this_month")}</p>
        <dl>
          <div><dt>${this._t("energy")}</dt><dd>${this._kwh(month.energy, 0)}</dd></div>
          <div><dt>${this._t("cost")}</dt><dd>${this._money(month.cost)}</dd></div>
          <div><dt>${this._t("charges")}</dt><dd>${this._num(month.sessions, 0)}</dd></div>
        </dl>
        ${this._monthsChartHtml(v.months || {})}
      </div>
      ${
        history.length
          ? `<ul class="sessions">${shown.map((e) => this._carSessionHtml(v, e)).join("")}</ul>
        <div class="row-buttons">
          ${history.length > shown.length ? `<button class="btn ghost" data-act="more" data-id="${esc(v.id)}"><span>${this._t("show_more")}</span></button>` : ""}
          <button class="btn ghost danger" data-act="del-car-all" data-id="${esc(v.id)}">${ICONS.trash}<span>${this._t("delete_car_history")}</span></button>
        </div>`
          : `<p class="hint">${this._t("car_history_empty")}</p>`
      }
    </section>`;
  }

  /* Cost per month, the last twelve months, as small bars. */
  _monthsChartHtml(months) {
    const keys = Object.keys(months).sort().slice(-12);
    if (keys.length < 2) return "";
    const peak = Math.max(...keys.map((k) => Number(months[k].cost) || 0), 0.01);
    const label = (key) => {
      const [y, m] = key.split("-").map(Number);
      return new Intl.DateTimeFormat(this._locale, { month: "short" }).format(new Date(y, m - 1, 1)).replace(".", "");
    };
    const summary = keys.map((k) => `${label(k)} ${this._money(months[k].cost)}`).join(", ");
    return `<div class="months" role="img" aria-label="${esc(`${this._t("months_title")}: ${summary}`)}">
      <p class="months-title">${this._t("months_title")}</p>
      <div class="month-bars">${keys
        .map((k, i) => {
          const cost = Number(months[k].cost) || 0;
          return `<div class="mb" title="${esc(`${label(k)}: ${this._money(cost)} · ${this._kwh(months[k].energy, 0)}`)}">
            <span class="mb-val">${this._money(cost, 0)}</span>
            <i style="height:${((cost / peak) * 100).toFixed(1)}%;--d:${i * 40}ms"></i>
            <span class="mb-label">${esc(label(k))}</span></div>`;
        })
        .join("")}</div>
    </div>`;
  }

  _carSessionHtml(v, e) {
    const soc = isNum(e.start_soc) || isNum(e.end_soc) ? `${this._pct(e.start_soc)} → ${this._pct(e.end_soc)}` : "";
    return `<li>
      <div class="when"><b>${new Date(e.start).getDate()}</b><span>${new Intl.DateTimeFormat(this._locale, { month: "short" }).format(new Date(e.start))}</span></div>
      <div class="what">
        <strong>${this._time(e.start)}–${this._time(e.end)}</strong>
        <span>${esc(soc)}</span>
      </div>
      <div class="nums"><b>${this._money(e.cost)}</b><span>${this._kwh(e.energy)}</span></div>
      <div class="row-actions">
        <button class="icon" data-act="del" data-vid="${esc(v.id)}" data-id="${esc(e.id)}" aria-label="${this._t("delete")}">${ICONS.trash}</button>
      </div>
    </li>`;
  }

  _guestHistoryHtml(history) {
    const energyOf = (e) => (e.measured_energy ?? e.energy) || 0;
    const costOf = (e) => (e.measured_cost ?? e.cost) || 0;
    const totals = history.reduce(
      (acc, e) => ({ energy: acc.energy + energyOf(e), cost: acc.cost + costOf(e), saved: acc.saved + (e.savings || 0) }),
      { energy: 0, cost: 0, saved: 0 },
    );
    const recent = history.slice(0, 12).reverse();
    const peak = Math.max(...recent.map(energyOf), 1);
    return `<section class="guest-history">
      <h2 class="section-title">${ICONS.guest}<span>${this._t("guests")}</span></h2>
      <div class="panel totals">
        <p class="count">${history.length === 1 ? this._t("session") : this._t("sessions", { n: history.length })}</p>
        <dl>
          <div><dt>${this._t("total_energy")}</dt><dd>${this._kwh(totals.energy, 0)}</dd></div>
          <div><dt>${this._t("total_cost")}</dt><dd>${this._money(totals.cost)}</dd></div>
          <div><dt>${this._t("total_saved")}</dt><dd class="good">${this._money(totals.saved)}</dd></div>
        </dl>
        <div class="spark" aria-hidden="true">${recent
          .map((e, i) => `<i style="height:${((energyOf(e) / peak) * 100).toFixed(1)}%;--d:${i * 40}ms" title="${this._kwh(energyOf(e))}"></i>`)
          .join("")}</div>
      </div>
      <ul class="sessions">${history
        .map(
          (e) => `<li>
            <div class="when"><b>${new Date(e.start).getDate()}</b><span>${new Intl.DateTimeFormat(this._locale, { month: "short" }).format(new Date(e.start))}</span></div>
            <div class="what">
              <strong>${esc(e.car || this._t("unknown_car"))}</strong>
              <span>${e.plate ? `<em class="mini-plate">${esc(e.plate)}</em>` : ""}${e.mode === "now" ? `<em class="tag-now">${ICONS.boost}${this._t("charge_now_tag")}</em>` : ""}${e.stopped ? `<em class="tag-now stopped">${this._t("stopped_tag")}</em>` : ""}${this._time(e.start)}–${this._time(e.end)}</span>
            </div>
            <div class="nums"><b>${this._money(costOf(e))}</b><span>${this._kwh(energyOf(e))}</span></div>
            <div class="row-actions">
              <button class="icon" data-act="bill" data-id="${esc(e.id)}" aria-label="${this._t("bill")}">${ICONS.receipt}</button>
              <button class="icon" data-act="del" data-id="${esc(e.id)}" aria-label="${this._t("delete")}">${ICONS.trash}</button>
            </div>
          </li>`,
        )
        .join("")}</ul>
      <div class="row-buttons"><button class="btn ghost danger" data-act="del-all">${ICONS.trash}<span>${this._t("delete_all")}</span></button></div>
    </section>`;
  }

  _billText(entry, byRate) {
    const settings = this._state.settings || {};
    const energy = (entry.measured_energy ?? entry.energy) || 0;
    const rate = Number(settings.bill_price);
    const amount = byRate && rate > 0 ? energy * rate : (entry.measured_cost ?? entry.cost) || 0;
    const car = [entry.car, entry.plate].filter(Boolean).join(" – ") || this._t("unknown_car");
    const lines = [
      this._t("bill_text_intro", { car }),
      this._t("bill_line_date", { date: this._date(entry.start) }),
      this._t("bill_line_energy", { kwh: this._kwh(energy, 2) }),
      `${this._t("bill_line_price", { amount: this._money(amount) })}${byRate && rate > 0 ? ` ${this._t("bill_line_rate", { rate: this._money(rate) })}` : ""}`,
    ];
    if (settings.payment_text) lines.push("", settings.payment_text);
    return { text: lines.join("\n"), amount, energy };
  }

  _openBill(entry) {
    if (!entry) return;
    const settings = this._state.settings || {};
    let byRate = Number(settings.bill_price) > 0;
    const root = this.shadowRoot.querySelector(".sheet-root");
    const opener = this.shadowRoot.activeElement;
    const close = () => {
      root.innerHTML = "";
      opener?.focus?.();
    };
    const render = () => {
      const bill = this._billText(entry, byRate);
      root.innerHTML = `<div class="scrim"></div>
        <div class="sheet" role="dialog" aria-modal="true" aria-label="${this._t("bill_title")}">
          <header><h2>${this._t("bill_title")}</h2><button class="icon close" aria-label="${this._t("close")}">${ICONS.close}</button></header>
          <div class="receipt">
            <p class="amount">${this._money(bill.amount)}</p>
            <p class="sub">${esc(entry.car || this._t("unknown_car"))}${entry.plate ? ` <em class="mini-plate">${esc(entry.plate)}</em>` : ""}</p>
            <pre>${esc(bill.text)}</pre>
          </div>
          ${
            Number(settings.bill_price) > 0
              ? `<div class="segmented"><button class="${byRate ? "" : "on"}" data-rate="0">${this._t("by_actual")}</button><button class="${byRate ? "on" : ""}" data-rate="1">${this._t("by_rate")}</button></div>`
              : ""
          }
          <div class="actions">
            <button class="btn primary copy">${ICONS.copy}<span>${this._t("copy")}</span></button>
            ${navigator.share ? `<button class="btn ghost share">${ICONS.share}<span>${this._t("share")}</span></button>` : ""}
          </div>
        </div>`;
      root.querySelector(".scrim").onclick = close;
      root.querySelector(".close").onclick = close;
      root.querySelector(".sheet").onkeydown = (ev) => ev.key === "Escape" && close();
      root.querySelectorAll("[data-rate]").forEach((b) => (b.onclick = () => ((byRate = b.dataset.rate === "1"), render())));
      root.querySelector(".copy").onclick = async () => {
        try {
          await navigator.clipboard.writeText(bill.text);
          this._toast(this._t("copied"));
        } catch {
          /* clipboard not allowed */
        }
      };
      const share = root.querySelector(".share");
      if (share) share.onclick = () => navigator.share({ text: bill.text }).catch(() => {});
      root.querySelector(".close").focus();
    };
    render();
  }

  // ------------------------------------------------------------------ settings

  _settingsHtml() {
    const s = this._state;
    const settings = s.settings || {};
    const config = s.config || {};
    const notify = config.notify || [];
    const eff = this._gin.charging_efficiency ?? 90;
    const appUrl = `${location.origin}${this._panel?.config?.app_url || "/ev_planner_app"}/app.html`;
    return `<div class="page settings-page">
      <section class="panel">
        <h2>${ICONS.receipt}<span>${this._t("settings_billing")}</span></h2>
        <label class="field col"><span>${this._t("bill_rate")}</span>
          <div class="unit-input"><input id="bill-rate" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(settings.bill_price ?? "")}"><span>${esc(this._unit)}/kWh</span></div>
          <small>${this._t("bill_rate_hint")}</small></label>
        <label class="field col"><span>${this._t("payment_text")}</span>
          <input id="payment-text" type="text" maxlength="200" value="${esc(settings.payment_text || "")}">
          <small>${this._t("payment_hint")}</small></label>
      </section>
      <section class="panel">
        <h2>${ICONS.bell}<span>${this._t("settings_notifications")}</span></h2>
        <div class="field col"><span>${this._t("notify_language")}</span>
          <div class="chips">${["auto", "da", "en"]
            .map((code) => {
              const on = (settings.language || "auto") === code;
              return `<button data-act="notify-lang" data-lang="${code}" data-f="nl-${code}" class="${on ? "on" : ""}" aria-pressed="${on}">${this._t(`lang_${code}`)}</button>`;
            })
            .join("")}</div>
          <small>${this._t("notify_language_hint")}</small></div>
      </section>
      <section class="panel">
        <h2>${ICONS.guest}<span>${this._t("settings_guest")}</span></h2>
        <label class="field col"><span>${this._t("efficiency")} <b class="eff-value">${Math.round(eff)} %</b></span>
          <input id="g-efficiency" type="range" min="50" max="100" step="1" value="${esc(eff)}">
          <small>${this._t("efficiency_hint")}</small></label>
      </section>
      <section class="panel">
        <h2>${ICONS.settings}<span>${this._t("settings_sources")}</span></h2>
        <dl class="sources">
          <div><dt>${this._t("price_sensor")}</dt><dd>${esc(this._entityName(config.price_entity))}</dd></div>
          <div><dt>${this._t("notify_phones")}</dt><dd>${notify.length ? notify.map((n) => `<code>${esc(n)}</code>`).join(" ") : this._t("not_set")}</dd></div>
          <div><dt>${this._t("widgets_refresh")}</dt><dd>${config.update_widgets ? this._t("on") : this._t("off")}</dd></div>
        </dl>
        <p class="hint">${this._t("change_in_ha")} <a href="/config/integrations/integration/ev_planner" target="_top">${this._t("open_integration")}</a></p>
      </section>
      <section class="panel">
        <h2>${ICONS.share}<span>${this._t("app_title")}</span></h2>
        <p class="hint">${this._t("app_hint")}</p>
        <a class="btn ghost" href="${esc(appUrl)}" target="_blank" rel="noopener">${ICONS.share}<span>${this._t("open_app")}</span></a>
        <h3>${this._t("widgets_title")}</h3>
        <p class="hint">${esc(this._t("widgets_text"))}</p>
      </section>
    </div>`;
  }

  // ------------------------------------------------------------------ events

  /* One click handler for the whole page: buttons say what they do with data-act. */
  _onClick(ev) {
    const button = ev.target.closest("[data-act]");
    if (!button || button.disabled) return;
    const act = button.dataset.act;
    const id = button.dataset.id;
    const v = this._currentCar;
    const s = v ? this._vs(v) : null;
    switch (act) {
      case "open-car":
        this._openCar(id);
        break;
      case "back":
        this._back();
        break;
      case "open-charger":
        this._openCharger(id);
        break;
      case "tab":
        this._setTab(button.dataset.tab);
        break;
      case "mode":
        this._setMode(id, button.dataset.mode);
        break;
      case "car-ready":
        this._readyClick("car", button, (time) =>
          time === "none" ? { use_ready_by: false } : { use_ready_by: true, ready_by: time },
        );
        break;
      case "car-cont":
        this._vchange({ continuous: button.dataset.mode === "continuous" });
        break;
      case "sched-day":
        this._schedDay = this._schedDay === button.dataset.day ? null : button.dataset.day;
        this._renderCarPage({ live: false });
        break;
      case "sched-set":
        if (s && this._schedDay) {
          const day = this._schedDay;
          this._schedDay = null;
          this._vchange({ schedule: { ...(s.schedule || {}), [day]: button.dataset.value } });
          this.shadowRoot.querySelector(`[data-f="sched-${day}"]`)?.focus();
        }
        break;
      case "toggle":
        if (s) this._vchange({ [button.dataset.key]: !s[button.dataset.key] });
        break;
      case "rem-day":
        if (s) {
          const days = new Set(s.reminder_days || WEEKDAYS);
          if (days.has(button.dataset.day)) days.delete(button.dataset.day);
          else days.add(button.dataset.day);
          this._vchange({ reminder_days: WEEKDAYS.filter((day) => days.has(day)) });
        }
        break;
      case "notify-lang":
        button.blur();
        this._saveSettings({ language: button.dataset.lang });
        break;
      case "notify-to":
        if (s) {
          const phones = this._state.config?.notify || [];
          const set = new Set(s.notify_targets?.length ? s.notify_targets : phones);
          if (set.has(button.dataset.phone)) set.delete(button.dataset.phone);
          else set.add(button.dataset.phone);
          // At least one phone; all of them is stored as "all", so new phones are included.
          if (set.size) this._vchange({ notify_targets: set.size === phones.length ? [] : phones.filter((p) => set.has(p)) });
        }
        break;
      case "opp":
        this._vchange({ opportunistic: button.dataset.value });
        break;
      case "lookup":
        this._lookup();
        break;
      case "g-plan":
        this._guestPlan();
        break;
      case "g-new":
        this._newGuest();
        break;
      case "g-now":
        this._guestChargeNow();
        break;
      case "g-stop":
        this._run("stop", "ev_planner/guest_stop");
        break;
      case "photo":
        this._pickPhoto(id);
        break;
      case "photo-del":
        this._removePhoto(id);
        break;
      case "photo-cut":
        this._cutPhoto(id);
        break;
      case "photo-undo":
        this._undoPhoto(id);
        break;
      case "g-power":
        this._gchange({ charger_power: Number(button.dataset.kw) });
        break;
      case "g-charger":
        this._pickGuestCharger(id);
        break;
      case "g-ready":
        this._readyClick("g", button, (time) =>
          time === "none" ? { use_completion_time: false } : { use_completion_time: true, charge_completion_time: time },
        );
        break;
      case "g-cont":
        this._gchange({ continuous_charging_preferred: button.dataset.mode === "continuous" });
        break;
      case "step":
        this._stepBattery(button);
        break;
      case "bill":
        this._openBill((this._guest?.history || []).find((e) => e.id === id));
        break;
      case "del":
        this._deleteHistory(button.dataset.vid, id);
        break;
      case "del-all":
        if (confirm(this._t("confirm_delete_all"))) this._deleteHistory(null, null);
        break;
      case "del-car-all": {
        const car = this._car(id);
        if (car && confirm(this._t("confirm_delete_car", { name: car.name }))) this._deleteHistory(id, null);
        break;
      }
      case "more":
        this._historyMore.add(id);
        this._render();
        break;
      default:
        break;
    }
  }

  /* A "Klar kl." chip: a preset, no deadline, or "Other", which opens a time field. */
  _readyClick(scope, button, changes) {
    const time = button.dataset.time;
    const set = scope === "car" ? (c) => this._vchange(c) : (c) => this._gchange(c);
    if (time === "custom") {
      this._customTime[scope] = true;
      if (scope === "car") this._renderCarPage({ live: false });
      else this._renderGuestInputs();
      this.shadowRoot.querySelector(`.deadline[data-scope="${scope}"] input`)?.focus();
      return;
    }
    this._customTime[scope] = false;
    set(changes(time));
  }

  /* A guest charger chip: the charger, and its power when it is known. */
  _pickGuestCharger(id) {
    const charger = this._chargers.find((c) => c.id === id);
    const changes = { charger: id };
    if (charger && isNum(charger.power) && Number(charger.power) > 0) changes.charger_power = Number(charger.power);
    this._gchange(changes);
  }

  _stepBattery(button) {
    const box = button.closest(".stepper");
    const key = box.dataset.key;
    const step = Number(box.dataset.step);
    const value = clamp(Number(this._gin[key] || 0) + step * Number(button.dataset.dir), Number(box.dataset.min), Number(box.dataset.max));
    this._gchange({ [key]: Math.round(value * 10) / 10 });
  }

  _onChange(ev) {
    const el = ev.target;
    if (el.id === "plate") {
      this._gcommit({ license_plate: el.value });
    } else if (el.dataset.gpower) {
      const value = Number(el.value);
      if (value > 0) this._gchange({ charger_power: value });
    } else if (el.dataset.ready === "car") {
      if (el.value) this._vchange({ use_ready_by: true, ready_by: el.value });
    } else if (el.dataset.ready === "g") {
      if (el.value) this._gchange({ use_completion_time: true, charge_completion_time: el.value });
    } else if (el.dataset.sched) {
      const v = this._currentCar;
      if (v && el.value) this._vchange({ schedule: { ...(this._vs(v).schedule || {}), [el.dataset.sched]: el.value } });
    } else if (el.dataset.set) {
      this._setFromInput(el, true);
    } else if (el.id === "bill-rate") {
      this._saveSettings({ bill_price: el.value === "" ? null : Number(el.value) });
    } else if (el.id === "payment-text") {
      this._saveSettings({ payment_text: el.value });
    } else if (el.id === "g-efficiency") {
      this._gcommit({ charging_efficiency: Number(el.value) }).then(() => this._toast(this._t("saved")));
    }
  }

  _onInput(ev) {
    const el = ev.target;
    if (el.id === "plate") {
      el.value = el.value.toUpperCase();
    } else if (el.type === "range") {
      const label = el.closest(".field")?.querySelector(".eff-value");
      if (label) label.textContent = `${el.value} %`;
      if (el.dataset.set) this._setFromInput(el, false);
    }
  }

  _onKey(ev) {
    if (ev.target.id === "plate" && ev.key === "Enter" && this._guest?.lookup) this._lookup();
  }

  /* A rule's value field: a time or a number within its limits. Empty or invalid input is ignored. */
  _setFromInput(el, commit) {
    const key = el.dataset.set;
    if (el.dataset.type === "time") {
      if (/^\d{2}:\d{2}/.test(el.value)) this._vchange({ [key]: el.value.slice(0, 5) }, { commit });
      return;
    }
    if (el.value === "" || !isNum(el.value)) return;
    const value = clamp(Number(el.value), Number(el.dataset.min ?? -Infinity), Number(el.dataset.max ?? Infinity));
    if (String(value) !== el.value && commit) el.value = value;
    this._vchange({ [key]: value }, { commit });
  }
}

const STYLE = `
:host {
  --evp-a: #00B894;
  --evp-b: #A3E635;
  --evp-brand-ink: #0F172A;
  --evp-sand: #E9B949;
  --evp-coral: #E4572E;
  --evp-ink: var(--primary-text-color, #1c1c1c);
  --evp-soft: var(--secondary-text-color, #5e5e5e);
  --evp-card: var(--card-background-color, #fff);
  --evp-bg: var(--primary-background-color, #fafafa);
  --evp-line: var(--divider-color, rgba(0,0,0,.12));
  /* A soft "studio floor" behind photos, in light and dark themes. */
  --evp-photo-bg: radial-gradient(120% 90% at 50% 100%, color-mix(in srgb, var(--evp-ink) 11%, transparent), color-mix(in srgb, var(--evp-ink) 3%, transparent) 72%);
  --evp-accent: var(--primary-color, #009ac7);
  --evp-radius: var(--ha-card-border-radius, 16px);
  --evp-good: #0E9F6E;
  --evp-bad: var(--error-color, #db4437);
  --evp-safe-top: 0px;
  --evp-safe-bottom: 0px;
  display: block;
  height: 100%;
  background: var(--evp-bg);
  color: var(--evp-ink);
  font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
  -webkit-font-smoothing: antialiased;
}
* { box-sizing: border-box; }
button, input, select { font: inherit; color: inherit; }
svg { display: block; }
a { color: var(--evp-accent); }
code { font-size: 13px; background: color-mix(in srgb, var(--evp-ink) 6%, transparent); border-radius: 6px; padding: 1px 6px; }
.app { display: flex; flex-direction: column; height: 100%; }

/* ---------- header */
.bar {
  position: sticky; top: 0; z-index: 4;
  display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 8px;
  padding: calc(6px + var(--evp-safe-top)) 16px 6px 4px;
  min-height: 56px;
  background: var(--app-header-background-color, var(--evp-card));
  color: var(--app-header-text-color, var(--evp-ink));
  border-bottom: 1px solid var(--app-header-border-bottom, var(--evp-line));
}
.menu:empty { width: 8px; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; letter-spacing: -.01em; white-space: nowrap; }
.brand svg { width: 28px; height: 28px; }
.tabs { display: flex; gap: 4px; justify-self: end; }
.tabs button {
  position: relative; display: flex; align-items: center; gap: 8px;
  border: 0; background: transparent; padding: 8px 14px; border-radius: 999px; cursor: pointer;
  color: var(--evp-soft); font-weight: 500;
}
.tabs button svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.tabs button.on { color: var(--evp-ink); background: color-mix(in srgb, var(--evp-a) 14%, transparent); }
.tabs button em { font-style: normal; font-size: 11px; font-weight: 600; background: var(--evp-line); border-radius: 999px; padding: 1px 6px; }
.tabs button em.bad { background: var(--evp-coral); color: #fff; }
.tabs button:focus-visible, .btn:focus-visible, .chips button:focus-visible, .segmented button:focus-visible, .handle:focus-visible,
.icon:focus-visible, .switch:focus-visible, .vcard-open:focus-visible, .week .day:focus-visible, .stepper button:focus-visible {
  outline: 2px solid var(--evp-accent); outline-offset: 2px;
}

/* ---------- layout */
.content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 20px 20px calc(32px + var(--evp-safe-bottom)); }
/* The home-screen app: the page never bounces or moves, only the content scrolls. */
:host([app]) .content { overscroll-behavior: none; }
/* In a pop-up from a dashboard card: one view, without the header and the tabs. */
:host([embed]) header.bar { display: none; }
:host([embed]) .content { padding-bottom: calc(24px + var(--evp-safe-bottom)); }
:host([embed]:not([drilled])) .car-head .back { display: none; }
:host([embed]) .car-page .rules, :host([embed]) .car-page .notify, :host([embed]) .car-page > .prices { display: none; }
.page {
  display: grid; gap: 18px; align-content: start;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  max-width: 1180px; width: 100%; margin: 0 auto;
}
.page.stack, .settings-page { grid-template-columns: minmax(0, 1fr); }
.settings-page { max-width: 760px; }
.col { display: grid; gap: 18px; align-content: start; min-width: 0; }
.col > *, .field > *, .plate-row > * { min-width: 0; }
.page > :not(.col) { grid-column: 1 / -1; }
.panel {
  background: var(--evp-card); border-radius: var(--evp-radius);
  box-shadow: var(--ha-card-box-shadow, none); border: 1px solid var(--ha-card-border-color, var(--evp-line));
  padding: 18px 20px 20px;
}
.panel h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font-size: 16px; font-weight: 600; letter-spacing: -.005em; }
.panel h2 svg, .section-title svg { width: 20px; height: 20px; flex: none; fill: none; stroke: var(--evp-a); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.panel h3 { margin: 22px 0 0; font-size: 15px; font-weight: 600; }
.section-title { display: flex; align-items: center; gap: 8px; margin: 6px 0 12px; font-size: 18px; font-weight: 600; }
.hint, .note { color: var(--evp-soft); font-size: 14px; line-height: 1.45; margin: 10px 0 0; max-width: 60ch; }
.hint:empty, .note:empty { display: none; }
.good { color: var(--evp-good); }
.bad-text { color: var(--evp-bad); }
.warn-text { color: #B7791F; }
.soft { color: var(--evp-soft); }
.loading, .empty { grid-column: 1 / -1; display: grid; justify-items: center; gap: 14px; padding: 80px 20px; color: var(--evp-soft); text-align: center; }
.empty.panel { padding: 48px 20px; color: var(--evp-ink); }
.empty.panel h2 { margin: 0; justify-content: center; }
.empty.panel p { color: var(--evp-soft); margin: 0; }
.empty .btn.primary { flex: none; }
.loading svg, .empty > svg { width: 72px; height: 72px; }
.loading .seg { animation: seg 1.2s ease-in-out infinite; animation-delay: calc(var(--k) * 150ms); }
.empty p { max-width: 46ch; line-height: 1.5; }
@keyframes seg { 50% { opacity: .25; } }

/* ---------- pills, notes */
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; white-space: nowrap; }
.pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.pill.teal { color: color-mix(in srgb, #0B8A6F 75%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-a) 15%, transparent); }
.pill.sand { color: color-mix(in srgb, #A06B00 75%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-sand) 22%, transparent); }
.pill.coral { color: color-mix(in srgb, #C2410C 75%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-coral) 16%, transparent); }
.pill.grey { color: var(--evp-soft); background: color-mix(in srgb, var(--evp-ink) 7%, transparent); }
.notes { display: grid; gap: 8px; }
.notes:empty { display: none; }
.note-line { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; }
.note-line svg { width: 18px; height: 18px; flex: none; margin-top: 1px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.note-line.bad { color: color-mix(in srgb, #B42318 62%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-coral) 13%, transparent); }
.note-line.warn { color: color-mix(in srgb, #8A5A00 62%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-sand) 18%, transparent); }
.note-line.bad svg { stroke: var(--evp-coral); }
.note-line.warn svg { stroke: #C98A00; }
.note-line.info { color: var(--evp-soft); background: color-mix(in srgb, var(--evp-a) 8%, transparent); }
.note-line a { color: inherit; font-weight: 600; }
.info-line { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; color: var(--evp-soft); font-size: 14px; line-height: 1.4; }
.info-line svg { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.info-line b { color: var(--evp-ink); font-weight: 600; }
.info-line.cal { color: var(--evp-ink); }
.info-line.cal svg { stroke: var(--evp-a); }

/* ---------- overview */
.cars-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); }
.side-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); align-items: start; }
.vcard {
  display: grid; gap: 12px; align-content: start; background: var(--evp-card); border-radius: var(--evp-radius);
  border: 1px solid var(--ha-card-border-color, var(--evp-line)); box-shadow: var(--ha-card-box-shadow, none); padding: 14px 16px 16px;
  position: relative; overflow: hidden;
}
.vcard::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px; background: var(--tone, transparent); }
.vcard.tone-teal { --tone: linear-gradient(90deg, #00B894, #A3E635); }
.vcard.tone-sand { --tone: var(--evp-sand); }
.vcard.tone-coral { --tone: var(--evp-coral); }
.vcard-open { display: grid; gap: 10px; width: 100%; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; border-radius: 12px; }
.vcard-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.vcard-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.vcard-title > svg { width: 26px; height: 26px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; color: var(--evp-soft); }
.vcard-title div { display: grid; min-width: 0; }
.vcard-title .avatar { width: 68px; height: 46px; flex: none; border-radius: 12px; object-fit: contain; padding: 2px; box-sizing: border-box; background: var(--evp-photo-bg); filter: drop-shadow(0 2px 3px rgba(0,0,0,.18)); }
.photo { position: relative; flex: none; display: inline-grid; }
.photo-pick { position: relative; width: 52px; height: 52px; padding: 0; border: 1px solid var(--evp-line); border-radius: 14px; background: color-mix(in srgb, var(--evp-ink) 4%, transparent); color: var(--evp-soft); cursor: pointer; overflow: hidden; display: grid; place-items: center; }
.photo.small .photo-pick { width: 44px; height: 44px; border-radius: 12px; }
.photo-pick img { width: 100%; height: 100%; object-fit: contain; padding: 3px; box-sizing: border-box; display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,.18)); }
.photo.has .photo-pick { background: var(--evp-photo-bg); }
.photo.wide .photo-pick { width: 84px; height: 56px; }
.photo-cut { position: absolute; bottom: -6px; right: -6px; width: 22px; height: 22px; padding: 0; border-radius: 50%; border: 1px solid var(--evp-line); background: var(--evp-card, var(--card-background-color, #fff)); color: var(--evp-a); cursor: pointer; display: grid; place-items: center; opacity: 0; transition: opacity .15s; }
.photo-cut svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.photo:hover .photo-cut, .photo:focus-within .photo-cut { opacity: 1; }
.photo-undo { position: absolute; bottom: -6px; left: -6px; width: 22px; height: 22px; padding: 0; border-radius: 50%; border: 1px solid var(--evp-line); background: var(--evp-card, var(--card-background-color, #fff)); color: var(--evp-a); cursor: pointer; display: grid; place-items: center; opacity: 0; transition: opacity .15s; }
.photo-undo svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.photo:hover .photo-undo, .photo:focus-within .photo-undo { opacity: 1; }
@media (hover: none) { .photo-cut, .photo-undo { opacity: 1; } }
.photo-pick > svg { width: 60%; height: 60%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.photo-pick > svg.art { width: 80%; height: 80%; stroke-width: 2.6; }
.photo-pick > svg.art .glass { fill: color-mix(in srgb, var(--evp-a) 18%, transparent); }
.photo-pick > svg.art .led { stroke: var(--evp-a); fill: var(--evp-a); }
.photo-pick .cam { position: absolute; right: 2px; bottom: 2px; width: 18px; height: 18px; border-radius: 6px; display: grid; place-items: center; background: var(--evp-card, var(--card-background-color, #fff)); color: var(--evp-ink); opacity: 0; transition: opacity .15s; }
.photo-pick .cam svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.photo-pick:hover .cam, .photo-pick:focus-visible .cam, .photo:not(.has) .cam { opacity: 1; }
.photo.busy .photo-pick { animation: seg 1.2s ease-in-out infinite; }
.photo-del { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; padding: 0; border-radius: 50%; border: 1px solid var(--evp-line); background: var(--evp-card, var(--card-background-color, #fff)); color: var(--evp-soft); cursor: pointer; display: grid; place-items: center; opacity: 0; transition: opacity .15s; }
.photo-del svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.photo:hover .photo-del, .photo:focus-within .photo-del { opacity: 1; }
@media (hover: none) { .photo-del { opacity: 1; } .photo-pick .cam { opacity: 1; } }
.tag-now { display: inline-flex; align-items: center; gap: 2px; margin-right: 6px; font-style: normal; font-size: 12px; color: var(--evp-a); }
.notify-to { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid var(--evp-line); }
.notify-to > span { font-size: 14px; font-weight: 600; }
.chips.days button { min-width: 40px; padding-inline: 8px; }
.tag-now.stopped { color: var(--evp-soft); }
.charge-now.stop { border-color: var(--evp-ink); }
.tag-now svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
.vcard-title strong { font-size: 18px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vcard-title span { color: var(--evp-soft); font-size: 13px; }
.vcard-body { display: grid; grid-template-columns: 148px 1fr; gap: 14px; align-items: center; }
.vcard-side { display: grid; gap: 10px; min-width: 0; }
.mini-facts { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
.mini-facts dt { color: var(--evp-soft); font-size: 12px; }
.mini-facts dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
.mini-facts .wide { grid-column: 1 / -1; }
.mini-facts .wide dd { font-weight: 500; font-size: 13px; }
.mini-batt p { margin: 6px 0 0; font-size: 13px; color: var(--evp-soft); font-variant-numeric: tabular-nums; }
.mini-batt p b { color: var(--evp-ink); }
.mini-batt p span { color: var(--evp-ink); font-weight: 500; margin-left: 4px; }
.mb-cells { position: relative; height: 18px; border-radius: 6px; border: 2px solid var(--evp-ink); background: color-mix(in srgb, var(--evp-ink) 4%, transparent); overflow: hidden; }
.mb-cells i { position: absolute; top: 2px; bottom: 2px; border-radius: 3px; }
.mb-now { left: 2px; max-width: calc(100% - 4px); background: linear-gradient(90deg, #00B894, #3CCB7F); }
.mb-target { background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--evp-b) 55%, transparent) 0 4px, color-mix(in srgb, var(--evp-b) 20%, transparent) 4px 8px); }
.mb-flow { background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent) no-repeat; background-size: 40% 100%; animation: charge 1.8s linear infinite; }
.mini-batt.missing .mb-cells { border-style: dashed; opacity: .6; }
.guest-card .guest-line { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.guest-line div { display: grid; gap: 2px; min-width: 0; }
.guest-line strong { font-weight: 600; }
.guest-line span { color: var(--evp-soft); font-size: 13px; font-variant-numeric: tabular-nums; }
.guest-card .btn { width: 100%; }
.chargers ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.chargers li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--evp-line); }
.chargers li:first-child { border-top: 0; padding-top: 0; }
.chargers li strong > i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; vertical-align: 2px; border-radius: 50%; background: var(--evp-soft); opacity: .5; }
.chargers li.ctl-charge strong > i { background: var(--evp-b); opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--evp-b) 70%, transparent); animation: ping 1.6s ease-out infinite; }
.chargers li.ctl-pause strong > i { background: var(--evp-sand); opacity: 1; }
.chargers li div { display: grid; min-width: 0; }
.ch-open { display: grid; min-width: 0; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; border-radius: 8px; color: inherit; }
.ch-open:focus-visible { outline: 2px solid var(--evp-accent); outline-offset: 2px; }
.ch-open span { color: var(--evp-soft); font-size: 13px; }
.charger-page .car-head .photo-pick > svg.art { width: 70%; height: 70%; }
.charger-page .car-head .pill { white-space: normal; text-align: left; }
.charger-next { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--evp-ink); font-weight: 500; }
.charger-next svg { width: 20px; height: 20px; flex: none; fill: none; stroke: var(--evp-a); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.chargers li span { color: var(--evp-soft); font-size: 13px; }
.chargers li b { font-weight: 500; font-size: 14px; text-align: right; }

/* ---------- mode control */
.segmented.modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; width: 100%; }
.segmented.modes button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 8px; min-width: 0; white-space: nowrap; }
.modes button span { overflow: hidden; text-overflow: ellipsis; }
.modes button svg { width: 17px; height: 17px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.segmented.modes .m-off { font-size: 13px; padding: 8px 10px; }
.vcard .modes .m-off span { display: none; }
.modes .m-off svg { width: 15px; height: 15px; }
.modes button.on.m-smart { color: #0B8A6F; }
.modes button.on.m-charge_now { color: #4D7C0F; }
.modes button.on.m-pause { color: #A06B00; }
.modes.large { margin-bottom: 4px; }
.segmented.modes.large button { padding: 10px 10px; }

/* ---------- dial (the signature) */
.hero { position: relative; display: grid; justify-items: center; align-content: start; gap: 10px; padding-top: 4px; }
.dial-wrap { position: relative; width: min(100%, 460px); aspect-ratio: 1; }
.dial-wrap.mini { width: 148px; }
.dial { width: 100%; height: 100%; overflow: visible; }
.dial .face { fill: color-mix(in srgb, var(--evp-ink) 3%, transparent); stroke: var(--evp-line); }
.dial .tick { stroke: var(--evp-soft); stroke-opacity: .35; stroke-width: 1.2; }
.dial .tick.major { stroke-opacity: .8; stroke-width: 2; }
.dial .hour { font-size: 13px; fill: var(--evp-soft); font-variant-numeric: tabular-nums; }
.dial .bar { opacity: .92; transform-origin: 200px 200px; }
.dial .bar.over { opacity: .3; }
.dial .intro .bar { animation: bar-in .7s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.dial .bar:hover { opacity: 1; }
@keyframes bar-in { from { opacity: 0; transform: scale(.82); } }
.dial .window { fill: none; stroke: url(#evp-win); stroke-width: 18; stroke-linecap: round; }
.dial .window.sweep { stroke-dasharray: 1; stroke-dashoffset: 1; animation: sweep 1.1s cubic-bezier(.6,0,.2,1) forwards; animation-delay: calc(var(--i) * 120ms); }
.dial .window.preview { stroke-dasharray: .018 .014; opacity: .85; }
.dial .window.past { opacity: .35; }
.dial .window-glow { fill: none; stroke: #A3E635; stroke-width: 18; stroke-linecap: round; opacity: .35; }
.dial .window-glow.preview { opacity: .12; }
.dial .window-flow { fill: none; stroke: #fff; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 2 16; opacity: .85; animation: flow 1.2s linear infinite; }
@keyframes sweep { to { stroke-dashoffset: 0; } }
@keyframes flow { to { stroke-dashoffset: -18; } }
.dial .needle { stroke: var(--evp-ink); stroke-width: 2.5; stroke-linecap: round; }
.dial .needle-dot { fill: var(--evp-ink); }
.dial .deadline-line { stroke: var(--evp-ink); stroke-width: 1.5; stroke-dasharray: 3 4; opacity: .55; }
.dial .deadline-dot { fill: var(--evp-card); stroke: var(--evp-ink); stroke-width: 2.5; }
.dial.mini .window { stroke-width: 26; }
.dial.mini .window-flow { stroke-width: 7; stroke-dasharray: 3 22; }
.dial.mini .needle { stroke-width: 6; }
.dial.mini .deadline-line { stroke-width: 4; stroke-dasharray: 8 8; }
.dial.mini .deadline-dot { stroke-width: 5; }
.dial.mini .tick { stroke-width: 5; }
.dial-center {
  position: absolute; inset: 31%; display: grid; place-content: center; justify-items: center; text-align: center; gap: 4px;
  pointer-events: none;
}
.dial-center .big { font-size: clamp(26px, 6.2vw, 40px); font-weight: 650; letter-spacing: -.03em; font-variant-numeric: tabular-nums; line-height: 1.05; }
.dial-center .big.muted { font-size: 18px; color: var(--evp-soft); }
.dial-center .range { color: var(--evp-soft); font-variant-numeric: tabular-nums; font-size: 15px; }
.dial-center .save { color: var(--evp-good); font-weight: 600; font-size: 14px; }
.dial-center .tag { font-size: 12px; font-weight: 600; color: var(--evp-a); background: color-mix(in srgb, var(--evp-a) 14%, transparent); padding: 2px 8px; border-radius: 999px; }
.dial-center.mini { inset: 24%; gap: 1px; }
.dial-center.mini .big { font-size: 15px; letter-spacing: -.02em; white-space: nowrap; }
.dial-center.mini .range { font-size: 11px; white-space: nowrap; }
.status-line { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 999px; background: var(--evp-card); border: 1px solid var(--evp-line); font-weight: 500; max-width: 100%; }
.status-line i { width: 10px; height: 10px; flex: none; border-radius: 50%; background: var(--evp-soft); }
.status-line.planned i { background: var(--evp-a); }
.status-line.sand i { background: var(--evp-sand); }
.status-line.charging i { background: var(--evp-b); box-shadow: 0 0 0 0 color-mix(in srgb, var(--evp-b) 70%, transparent); animation: ping 1.6s ease-out infinite; }
.status-line.completed i { background: var(--evp-good); }
.status-line.error, .status-line.behind { border-color: color-mix(in srgb, var(--evp-bad) 45%, transparent); }
.status-line.error i, .status-line.behind i { background: var(--evp-bad); }
.status-line span { line-height: 1.35; }
@keyframes ping { to { box-shadow: 0 0 0 10px transparent; } }

/* ---------- car page */
.car-head { display: flex; align-items: center; gap: 10px; }
.car-head .back { flex: none; }
.car-title { display: grid; min-width: 0; flex: 1; }
.car-title h1 { margin: 0; font-size: 22px; font-weight: 650; letter-spacing: -.015em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.car-title span { color: var(--evp-soft); font-size: 14px; }
.car-notes:empty { display: none; }
.week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.week.dim { opacity: .5; }
.week .day { display: grid; justify-items: center; gap: 1px; padding: 6px 0; border: 1px solid var(--evp-line); border-radius: 10px; background: transparent; cursor: pointer; font-variant-numeric: tabular-nums; min-width: 0; }
.week .day b { font-size: 12px; font-weight: 600; color: var(--evp-soft); }
.week .day span { font-size: 13px; }
.week .day.std span { color: var(--evp-soft); }
.week .day.own { border-color: var(--evp-ink); }
.week .day.none span { color: var(--evp-soft); }
.week .day.open { background: var(--evp-ink); color: var(--evp-card); border-color: var(--evp-ink); }
.week .day.open b, .week .day.open span { color: inherit; }
.sched-picker { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: color-mix(in srgb, var(--evp-ink) 4%, transparent); }
.sched-picker p { margin: 0 0 8px; font-size: 13px; color: var(--evp-soft); }
.rule { display: grid; grid-template-columns: 28px 1fr auto; gap: 4px 12px; align-items: center; padding: 12px 0; border-top: 1px solid var(--evp-line); }
.rule:first-child { border-top: 0; padding-top: 0; }
.rule-icon svg { width: 22px; height: 22px; fill: none; stroke: var(--evp-a); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.rule.off .rule-icon svg { stroke: var(--evp-soft); }
.rule-text { display: grid; gap: 2px; min-width: 0; }
.rule-text strong { font-weight: 600; font-size: 15px; }
.rule-text small { color: var(--evp-soft); font-size: 13px; line-height: 1.4; }
.rule-ctl { display: flex; align-items: center; gap: 10px; justify-self: end; }
.rule-full { grid-column: 2 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 8px; }
.rule.wide { grid-template-columns: 28px 1fr; }
.opp-level { display: inline-flex; align-items: center; gap: 8px; color: var(--evp-soft); font-size: 14px; }
.inline-values { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; color: var(--evp-soft); font-size: 14px; }
.eff-field { margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--evp-line); }
.switch { position: relative; flex: none; width: 46px; height: 28px; border-radius: 999px; border: 0; padding: 0; cursor: pointer; background: color-mix(in srgb, var(--evp-ink) 18%, transparent); transition: background .2s; }
.switch i { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s cubic-bezier(.2,.8,.2,1); }
.switch[aria-checked="true"] { background: linear-gradient(90deg, #00B894, #A3E635); }
.switch[aria-checked="true"] i { transform: translateX(18px); }

/* ---------- guest */
.plate-row { display: flex; gap: 10px; align-items: stretch; }
.plate {
  position: relative; flex: 1; display: flex; align-items: stretch; min-width: 0; overflow: hidden;
  background: #fff; border: 3px solid #C8102E; border-radius: 10px; height: 60px;
  box-shadow: inset 0 0 0 2px #fff, 0 1px 2px rgba(0,0,0,.15);
}
.plate .eu { display: grid; align-content: end; justify-items: center; width: 34px; padding: 0 0 6px; background: #003399; color: #fff; font-weight: 700; font-size: 13px; letter-spacing: .02em; }
.plate .eu i { width: 16px; height: 16px; margin-bottom: 8px; border-radius: 50%; border: 2px dotted #FFCC00; }
.plate input {
  flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #111;
  font-family: "DIN Alternate", "DIN Condensed", "Barlow Condensed", "Roboto Condensed", "Arial Narrow", sans-serif;
  font-weight: 700; font-size: 32px; letter-spacing: .08em; text-transform: uppercase; padding: 0 12px; text-align: center;
}
.plate input::placeholder { color: #c4c4c4; }
.plate:focus-within { outline: 2px solid var(--evp-accent); outline-offset: 3px; }
.plate .scan { position: absolute; inset: 0 0 0 34px; pointer-events: none; opacity: 0; }
.plate.scanning .scan { opacity: 1; background: linear-gradient(90deg, transparent, rgba(0,184,148,.35), transparent); background-size: 40% 100%; background-repeat: no-repeat; animation: scan 1s linear infinite; }
@keyframes scan { from { background-position: -40% 0; } to { background-position: 140% 0; } }
.car { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: color-mix(in srgb, var(--evp-a) 7%, transparent); }
.car.reveal { animation: rise .5s cubic-bezier(.2,.8,.2,1); }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }
.car-name { display: grid; gap: 2px; min-width: 0; }
.car-name strong { font-size: 18px; font-weight: 600; }
.car-name span { color: var(--evp-soft); font-size: 14px; }
.match { position: relative; width: 52px; height: 52px; flex: none; }
.match svg { width: 52px; height: 52px; transform: rotate(-90deg); }
.match circle { fill: none; stroke-width: 4; }
.match .track { stroke: var(--evp-line); }
.match .val { stroke: var(--evp-a); stroke-linecap: round; transition: stroke-dasharray .8s ease; }
.match span { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; font-size: 9px; color: var(--evp-soft); line-height: 1.1; }
.match b { font-size: 14px; color: var(--evp-ink); }

/* ---------- fields */
.field { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 12px; margin-top: 16px; }
.field > span { color: var(--evp-soft); font-size: 14px; }
.field.col { grid-template-columns: 1fr; gap: 6px; }
.field small { color: var(--evp-soft); font-size: 13px; line-height: 1.4; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button, .chip-input {
  border: 1px solid var(--evp-line); background: transparent; border-radius: 999px; padding: 7px 13px; cursor: pointer;
  font-variant-numeric: tabular-nums; transition: background .15s, border-color .15s, color .15s;
}
.chips button.on, .chip-input.on { background: var(--evp-ink); color: var(--evp-card); border-color: var(--evp-ink); }
.chips .none { color: var(--evp-soft); }
.chips .none.on { color: var(--evp-card); }
.chip-input { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; }
.chip-input input { width: 54px; border: 0; background: transparent; outline: 0; padding: 3px 0; text-align: right; }
.chip-input.time input { width: auto; text-align: left; }
.chip-input.kw input:placeholder-shown { width: 52px; text-align: center; }
.chip-input.kw input:placeholder-shown + span { display: none; }
.chip-input:focus-within { outline: 2px solid var(--evp-accent); outline-offset: 2px; }
.chip-input input::-webkit-outer-spin-button, .chip-input input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.chip-input input[type="number"] { -moz-appearance: textfield; }
.chip-input.on input { color: inherit; }
.chip-input.on input::-webkit-calendar-picker-indicator { filter: invert(1); }
.segmented { display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; max-width: 100%; justify-self: start; background: color-mix(in srgb, var(--evp-ink) 6%, transparent); border-radius: 12px; padding: 3px; }
.segmented button { border: 0; background: transparent; padding: 8px 14px; border-radius: 9px; cursor: pointer; color: var(--evp-soft); font-weight: 500; }
.segmented button.on { background: var(--evp-card); color: var(--evp-ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.segmented.opp button { padding: 7px 12px; font-size: 14px; }
.stepper { display: inline-flex; align-items: center; border: 1px solid var(--evp-line); border-radius: 12px; overflow: hidden; justify-self: start; }
.stepper button { border: 0; background: transparent; width: 40px; height: 38px; cursor: pointer; font-size: 18px; }
.stepper button:hover { background: color-mix(in srgb, var(--evp-ink) 6%, transparent); }
.stepper output { min-width: 92px; text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; }
input[type="text"], .unit-input { border: 1px solid var(--evp-line); border-radius: 10px; padding: 10px 12px; background: transparent; width: 100%; }
.unit-input { display: flex; align-items: center; gap: 8px; padding: 0 12px; }
.unit-input input { flex: 1; min-width: 0; border: 0; padding: 10px 0; outline: 0; background: transparent; }
.unit-input span { color: var(--evp-soft); white-space: nowrap; }
.unit-input:focus-within { outline: 2px solid var(--evp-accent); outline-offset: 1px; }
.unit-input.small { width: auto; padding: 0 10px; gap: 4px; border-radius: 999px; }
.unit-input.small input { width: 56px; flex: none; padding: 6px 0; text-align: right; font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
.unit-input.small input::-webkit-outer-spin-button, .unit-input.small input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.unit-input.small span { font-size: 13px; }
input[type="range"] { width: 100%; accent-color: var(--evp-a); }

/* ---------- battery */
.battery { display: flex; align-items: center; gap: 4px; margin-top: 18px; touch-action: none; }
.cells {
  position: relative; flex: 1; height: 64px; border-radius: 14px; border: 2.5px solid var(--evp-ink);
  background: color-mix(in srgb, var(--evp-ink) 4%, transparent); cursor: pointer;
}
.nub { width: 7px; height: 24px; border-radius: 0 4px 4px 0; background: var(--evp-ink); }
.fill-now, .fill-target, .flow { position: absolute; top: 4px; bottom: 4px; border-radius: 9px; }
.fill-now { left: 4px; max-width: calc(100% - 8px); background: linear-gradient(90deg, #00B894, #3CCB7F); transition: width .25s ease; }
.fill-target {
  background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--evp-b) 45%, transparent) 0 6px, color-mix(in srgb, var(--evp-b) 18%, transparent) 6px 12px);
  margin-right: 4px;
}
.flow { opacity: 0; pointer-events: none; }
.flow.on { opacity: 1; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent) no-repeat; background-size: 30% 100%; animation: charge 1.8s linear infinite; }
@keyframes charge { from { background-position: -30% 0; } to { background-position: 130% 0; } }
.ticks i { position: absolute; top: 18px; bottom: 18px; width: 1.5px; background: var(--evp-ink); opacity: .12; }
.min-mark { position: absolute; top: -6px; bottom: -6px; width: 0; border-left: 2px dashed var(--evp-coral); opacity: .8; pointer-events: none; }
.handle {
  position: absolute; top: 50%; width: 30px; height: 46px; margin: -23px 0 0 -15px; border-radius: 10px; padding: 0;
  background: var(--evp-card); border: 2.5px solid var(--evp-ink); cursor: grab; touch-action: none; z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,.18); transition: transform .12s;
}
.handle::after { content: attr(data-label); position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%); font-size: 13px; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; opacity: 0; transition: opacity .15s; }
.handle.dragging { cursor: grabbing; transform: scale(1.08); }
.handle.dragging::after, .handle:focus-visible::after { opacity: 1; }
.handle.target { border-color: #5FA21B; }
.handle.fixed { cursor: default; width: 6px; margin-left: -3px; height: 52px; margin-top: -26px; border-radius: 3px; border-width: 0; background: var(--evp-ink); box-shadow: none; }
.handle.target.fixed { background: #5FA21B; }
.battery-legend { display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; font-size: 14px; color: var(--evp-soft); font-variant-numeric: tabular-nums; }
.battery-legend b { color: var(--evp-ink); }
.battery-legend .gain { color: var(--evp-ink); font-weight: 500; text-align: center; }
.battery-hint { margin-top: 4px; font-size: 13px; }

/* ---------- buttons */
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.row-buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; padding: 12px 18px;
  border: 1px solid var(--evp-line); background: transparent; cursor: pointer; font-weight: 600; text-decoration: none; color: var(--evp-ink);
}
.btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.btn:disabled { opacity: .5; cursor: default; }
.btn.primary { flex: 1; min-width: 180px; border: 0; color: #08281F; background: linear-gradient(90deg, #00B894, #A3E635); box-shadow: 0 6px 18px -8px rgba(0,184,148,.8); }
.btn.primary svg path[d^="M13 2.5"] { fill: currentColor; stroke: none; }
.btn.primary.pulse { animation: nudge 1.8s ease-in-out infinite; }
@keyframes nudge { 50% { box-shadow: 0 0 0 6px rgba(163,230,53,.25); } }
.btn.lookup { white-space: nowrap; }
.btn.danger { color: var(--evp-bad); }
.icon { border: 0; background: transparent; width: 40px; height: 40px; border-radius: 10px; display: grid; place-content: center; cursor: pointer; color: var(--evp-soft); }
.icon:hover { background: color-mix(in srgb, var(--evp-ink) 6%, transparent); color: var(--evp-ink); }
.icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* ---------- facts */
.facts dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 14px 18px; margin: 0; }
.facts dt { color: var(--evp-soft); font-size: 13px; }
.facts dd { margin: 2px 0 0; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.facts dl.is-preview dd { color: var(--evp-soft); }
.save-note { margin: 14px 0 0; color: var(--evp-good); font-weight: 500; }

/* ---------- timeline */
.timeline-wrap { position: relative; }
.timeline { width: 100%; height: 220px; touch-action: pan-y; }
.timeline .day-band { fill: color-mix(in srgb, var(--evp-ink) 3.5%, transparent); }
.timeline .day { font-size: 13px; fill: var(--evp-soft); font-weight: 500; }
.timeline .axis { font-size: 12px; fill: var(--evp-soft); font-variant-numeric: tabular-nums; }
.timeline .tl-bar { opacity: .88; transform-box: fill-box; transform-origin: bottom; }
.timeline.intro .tl-bar { animation: grow .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.timeline .tl-bar.hot { opacity: 1; stroke: var(--evp-ink); stroke-width: 1.5; }
@keyframes grow { from { transform: scaleY(0); } }
.timeline .tl-window { fill: color-mix(in srgb, var(--evp-b) 28%, transparent); stroke: url(#evp-tw); stroke-width: 2; }
.timeline .tl-window.preview { stroke-dasharray: 5 5; fill: color-mix(in srgb, var(--evp-b) 14%, transparent); }
.timeline .tl-now { stroke: var(--evp-ink); stroke-width: 2; }
.timeline .tl-now-label { font-size: 12px; font-weight: 600; fill: var(--evp-ink); }
.timeline .tl-deadline { stroke: var(--evp-ink); stroke-width: 1.5; stroke-dasharray: 4 4; opacity: .55; }
.timeline .tl-ceiling { stroke: var(--evp-coral); stroke-width: 1.5; stroke-dasharray: 7 5; }
.timeline .tl-ceiling-label { font-size: 12px; font-weight: 600; fill: var(--evp-coral); }
.scrub { position: absolute; top: 2px; transform: translateX(-50%); background: var(--evp-ink); color: var(--evp-card); border-radius: 10px; padding: 6px 10px; display: grid; font-size: 12px; pointer-events: none; white-space: nowrap; }
.scrub b { font-size: 14px; }
[hidden] { display: none !important; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 18px; color: var(--evp-soft); font-size: 13px; margin-top: 6px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 18px; height: 10px; border-radius: 3px; display: inline-block; }
.sw.window { background: color-mix(in srgb, var(--evp-b) 35%, transparent); border: 1.5px solid #6CC24A; }
.sw.scale { background: linear-gradient(90deg, rgb(0,184,148), rgb(233,185,73), rgb(228,87,46)); }
.sw.ceiling { height: 0; border-radius: 0; border-top: 2px dashed var(--evp-coral); }

/* ---------- history */
.car-history, .guest-history { display: grid; gap: 10px; }
.totals .count { margin: 0 0 10px; color: var(--evp-soft); }
.totals dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 0; }
.totals dt { color: var(--evp-soft); font-size: 13px; }
.totals dd { margin: 2px 0 0; font-size: 22px; font-weight: 650; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.totals dd.good { color: var(--evp-good); }
.spark { display: flex; align-items: flex-end; gap: 6px; height: 56px; margin-top: 16px; }
.spark i { flex: 1; border-radius: 4px 4px 2px 2px; background: linear-gradient(0deg, #00B894, #A3E635); transform-origin: bottom; animation: grow .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.months { margin-top: 18px; }
.months-title { margin: 0 0 8px; color: var(--evp-soft); font-size: 13px; }
.month-bars { display: flex; align-items: stretch; gap: 6px; height: 120px; }
.month-bars .mb { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
.month-bars .mb i { width: 100%; max-width: 44px; min-height: 2px; border-radius: 4px 4px 2px 2px; background: linear-gradient(0deg, #00B894, #A3E635); transform-origin: bottom; animation: grow .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.month-bars .mb:last-child i { box-shadow: 0 0 0 2px color-mix(in srgb, var(--evp-a) 35%, transparent); }
.mb-val { font-size: 11px; color: var(--evp-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mb-label { font-size: 12px; color: var(--evp-soft); }
.sessions { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.sessions li { display: grid; grid-template-columns: 52px 1fr auto auto; align-items: center; gap: 14px; background: var(--evp-card); border: 1px solid var(--evp-line); border-radius: 14px; padding: 12px 10px 12px 14px; }
.when { display: grid; justify-items: center; line-height: 1.1; }
.when b { font-size: 22px; }
.when span { color: var(--evp-soft); font-size: 12px; }
.what { display: grid; gap: 4px; min-width: 0; }
.what strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.what span { color: var(--evp-soft); font-size: 13px; display: flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; }
.mini-plate { font-style: normal; font-size: 12px; font-weight: 700; letter-spacing: .06em; color: #111; background: #fff; border: 1.5px solid #C8102E; border-left: 6px solid #003399; border-radius: 4px; padding: 0 5px; white-space: nowrap; }
.nums { display: grid; justify-items: end; font-variant-numeric: tabular-nums; }
.nums span { color: var(--evp-soft); font-size: 13px; }
.row-actions { display: flex; }

/* ---------- settings */
.sources { margin: 0; display: grid; gap: 10px; }
.sources div { display: grid; grid-template-columns: 160px 1fr; gap: 10px; }
.sources dt { color: var(--evp-soft); }
.sources dd { margin: 0; word-break: break-word; display: flex; flex-wrap: wrap; gap: 6px; }

/* ---------- toast and sheet */
.toast { position: fixed; left: 50%; bottom: calc(20px + var(--evp-safe-bottom)); transform: translate(-50%, 140%); z-index: 10; display: flex; align-items: center; gap: 10px;
  background: var(--evp-ink); color: var(--evp-card); border-radius: 14px; padding: 10px 8px 10px 16px; max-width: min(92vw, 560px); transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.toast:not(.show) { visibility: hidden; }
.toast.show { transform: translate(-50%, 0); }
.toast.error { background: var(--evp-bad); color: #fff; }
.toast button { border: 0; background: transparent; color: inherit; width: 32px; height: 32px; display: grid; place-content: center; cursor: pointer; }
.toast svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
.scrim { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 20; animation: fade .2s; }
.sheet { position: fixed; z-index: 21; left: 50%; bottom: 0; transform: translateX(-50%); width: min(520px, 100%); background: var(--evp-card); border-radius: 22px 22px 0 0;
  padding: 18px 20px calc(22px + var(--evp-safe-bottom)); animation: up .3s cubic-bezier(.2,.8,.2,1); max-height: 90vh; overflow: auto; }
.sheet header { display: flex; justify-content: space-between; align-items: center; }
.sheet h2 { margin: 0; font-size: 18px; }
.receipt { margin: 10px 0 16px; padding: 18px; border-radius: 16px; background: color-mix(in srgb, var(--evp-a) 7%, transparent); }
.receipt .amount { margin: 0; font-size: 36px; font-weight: 650; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.receipt .sub { margin: 4px 0 12px; color: var(--evp-soft); display: flex; gap: 8px; align-items: center; }
.receipt pre { margin: 0; white-space: pre-wrap; font: inherit; font-size: 14px; line-height: 1.55; }
.sheet .segmented { margin-bottom: 4px; }
@keyframes fade { from { opacity: 0; } }
@keyframes up { from { transform: translate(-50%, 100%); } }

/* ---------- narrow screens */
@media (max-width: 860px) {
  .content { padding: 14px 12px calc(96px + var(--evp-safe-bottom)); }
  .page { grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .col { gap: 14px; }
  .cars-grid, .side-grid { gap: 14px; }
  .tabs { position: fixed; left: 0; right: 0; bottom: 0; justify-self: stretch; justify-content: space-around; background: var(--evp-card); border-top: 1px solid var(--evp-line); padding: 6px 8px calc(6px + var(--evp-safe-bottom)); z-index: 5; }
  .tabs button { flex-direction: column; gap: 2px; font-size: 12px; padding: 6px 10px; border-radius: 12px; }
  .tabs button em { position: absolute; top: 2px; right: 6px; }
  .bar { grid-template-columns: auto 1fr; }
  .field { grid-template-columns: 1fr; gap: 8px; }
  .panel { padding: 16px; }
  .vcard-body { grid-template-columns: 128px 1fr; gap: 12px; }
  .dial-wrap.mini { width: 128px; }
  .dial-center.mini .big { font-size: 14px; }
  .sessions li { grid-template-columns: 44px 1fr auto; }
  .row-actions { grid-column: 2 / -1; justify-content: flex-end; margin-top: -6px; }
  .totals dd { font-size: 18px; }
  .sources div { grid-template-columns: 1fr; gap: 2px; }
  .toast { bottom: calc(84px + var(--evp-safe-bottom)); }
  .rule { grid-template-columns: 24px 1fr auto; gap: 4px 10px; }
  .rule-ctl { flex-wrap: wrap; justify-content: flex-end; }
  .rule.wide { grid-template-columns: 24px 1fr; }
  .rule-full { grid-column: 1 / -1; }
  .segmented.opp { width: 100%; }
  .segmented.opp button { padding: 7px 6px; font-size: 13px; }
  .month-bars .mb-val { display: none; }
}
@media (max-width: 420px) {
  .segmented.modes button { gap: 4px; padding: 8px 4px; font-size: 13px; }
  .segmented.modes .m-off span { display: none; }
  .week .day span { font-size: 11px; }
}
/* Touch screens: fields of at least 16 px, so iOS does not zoom in when one is tapped. */
@media (pointer: coarse) {
  input:not(#plate), select, textarea { font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
`;

if (!customElements.get("ev-planner-panel")) customElements.define("ev-planner-panel", EvPlannerPanel);

// Shared with the dashboard cards (ev-planner-cards.js), so they look and read exactly like the panel.
export { EvPlannerPanel, TEXT, STYLE, ICONS, MARK, MODES, chargerArt, esc, clamp, isNum, hasSegments, cssId };
