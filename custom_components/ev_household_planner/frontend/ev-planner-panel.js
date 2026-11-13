/* EV Planner – panel for Home Assistant. No build step, no dependencies.
   Derived from EV Guest's panel: the price clock, the battery and the price graph
   are the same; EV Planner adds the household's own cars, their rules and history. */

const TEXT = {
  da: {
    tab_cars: "Biler",
    tab_home: "Hjem",
    home_title: "Hjemmet nu",
    home_grid: "Elnettet",
    home_house: "Huset",
    home_limit: "Grænse {limit} pr. fase",
    home_used: "{used} af {limit} i brug",
    home_house_now: "Huset trækker {amps} nu",
    home_house_expected: "Huset ventes at trække {amps}",
    home_timeline: "Hvem får strømmen",
    home_timeline_hint: "Huset først, så bilerne – under grænsen på {limit} pr. fase.",
    home_why_first: "{name} lader først – den skal være klar kl. {time}.",
    home_why_turns: "Bilerne lader efter tur, fordi der ikke er plads til begge.",
    home_why_share: "Bilerne deler strømmen.",
    home_why_short: "{name} mangler {kwh} – der er ikke strøm nok til hele målet.",
    home_why_none: "Ingen biler skal lade lige nu.",
    home_no_meter: "Uden måler regner EV Planner med, at huset trækker {amps}. Tilføj en måler i indstillingerne, så lærer den husets forbrug.",
    home_idle: "venter",
    home_planned_at: "planlagt {time}",
    edit_open: "Tilpas",
    edit_things: "Ting",
    edit_wires: "Ledninger",
    edit_panels: "Solceller",
    edit_labels: "Mærkater",
    edit_hint_things: "Træk i en lader, elboksen, batteriet eller varmepumpen. Ting på en væg bliver på en væg.",
    edit_hint_wires: "Træk i et stykke ledning for at flytte det. Ledningen går altid lige.",
    edit_hint_panels: "Tryk på taget, eller mal hen over det, for at sætte paneler op eller tage dem ned.",
    edit_hint_labels: "Træk en mærkat derhen, hvor den ikke er i vejen.",
    edit_undo: "Fortryd",
    edit_reset_things: "Sæt tingene tilbage",
    edit_reset_wires: "Tegn alle selv igen",
    edit_reset_wire: "Tegn denne selv igen",
    edit_reset_panels: "Sæt panelerne tilbage",
    edit_reset_labels: "Placér dem selv igen",
    edit_cancel: "Annullér",
    edit_save: "Gem",
    edit_saved: "Huset er gemt",
    edit_count: "{n} paneler",
    home_done: "færdig",
    home_unplugged: "ikke sat til",
    home_solar: "Solceller",
    home_battery: "Husbatteri",
    home_heat: "Varmepumpe",
    home_buys: "køber {kw}",
    home_sells: "sender {kw} ud",
    home_charges: "lader {kw}",
    home_gives: "afgiver {kw}",
    rule_look: "Bilen i fanen Hjem",
    rule_spot: "Bilens plads i indkørslen",
    rule_spot_hint: "Hvor bilen holder i husets billede. Automatisk: foran sin lader.",
    spot_auto: "Automatisk",
    spot_left: "Venstre",
    spot_right: "Højre",
    rule_look_hint: "Sådan ser bilen ud i tegningen af huset.",
    body_mini: "Mini",
    body_sedan: "Sedan",
    body_suv: "SUV",
    body_estate: "Stationcar",
    body_van: "Minivan",
    body_photo: "Mit billede",
    paint_white: "Hvid",
    paint_black: "Sort",
    home_guard: "Vagten holder øje med måleren og skruer bilerne ned med det samme, hvis huset pludselig skal bruge mere.",
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
    setup_title: "Kom i gang",
    setup_text: "Det hele tilføjes under integrationen. Når en bil er sat i laderen, lægger EV Planner selv den første plan.",
    setup_count: "{done} af {all}",
    setup_optional: "Kan vente",
    setup_prices: "Elpriser",
    setup_prices_fix: "{sensor} har ingen priser, EV Planner kan læse. Vælg prissensoren fra jeres elpris-integration under integrationen: de tre prikker ud for EV Planner → Omkonfigurer.",
    setup_prices_text: "Prissensoren fra jeres elpris-integration, fx Nord Pool, Energi Data Service eller Strømligning.",
    setup_car: "En bil",
    setup_car_text: "Tilføj bil: batteriets størrelse, ladeeffekten og bilens sensorer for batteri og stik.",
    setup_charger: "En lader",
    setup_charger_text: "Tilføj lader: dér bilen lader. En lader med en kontakt kan starte og pause bilen.",
    setup_supply: "Husets forsyning",
    setup_supply_text: "Under stedet Hjem: hovedsikringen og en måler, så bilerne aldrig trækker mere, end huset kan give.",
    setup_energy: "Sol, husbatteri og varmepumpe",
    setup_energy_text: "Tilføj dem, I har: bilen lader på overskuddet fra solen, og huset regnes med i planen.",
    setup_notify: "Beskeder",
    setup_notify_text: "Under Konfigurer: de mobiler, der får besked om planen og om problemer.",
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
    control_retry: "Kommandoen gik ikke igennem. Prøver igen kl. {time}.",
    no_control_entity: "Der er ingen kontakt at styre opladningen med. Vælg en under bilens indstillinger.",
    note_limited: "Prisloftet tillader ikke hele ladningen.",
    note_min_only: "Kun minimumsniveauet nås under prisloftet.",
    note_short: "Ikke tid nok til at nå målet før kl. {time}.",
    note_short_plain: "Ikke tid nok til at nå målet før fristen.",
    note_opportunistic: "Opportunistisk: prisloftet er {price} lige nu.",
    note_joined: "Lader færdig i ét stræk: {extra} mere end den billigste plan.",
    why_planned: "Lader nu: {price}/kWh er blandt de billigste før {time}.",
    why_planned_plain: "Lader nu i den planlagte periode.",
    why_low_price: "Lader nu: prisen {price}/kWh er under din grænse på {level}.",
    why_low_soc: "Lader nu: batteriet er under {level}.",
    why_charge_now: "Lader nu, fordi du har valgt Lad nu.",
    why_waiting: "Venter: {window} er {diff}/kWh billigere end nu.",
    why_waiting_plain: "Venter på den planlagte periode {window}.",
    why_topup: "Venter med de sidste {from}–{to} til lige før afgang, så bilen ikke står fuld hele natten.",
    why_fallback: "Venter på priser. Kommer de ikke, lader den {window}, så bilen er klar.",
    why_keep_on: "Holder laderen tændt, så bilen kan forvarme fra nettet.",
    why_late: "Klar-tiden er gået, og bilen er ikke nået til {target}. Den lader videre, til den er der.",
    why_full: "Bilen har nået sit mål på {target}.",
    why_paused: "Sat på pause af dig.",
    why_busy: "Laderen bruges af en anden lige nu.",
    why_kept: "Planen bliver liggende: en ny ville kun spare få øre.",
    why_early: "Lader tidligt: højst {within}/kWh mere end den billigste plan.",
    glance_charge: "lader {window}",
    level_simple: "Enkel",
    level_smart: "Smart",
    level_expert: "Ekspert",
    level_label: "Hvor mange valg",
    level_more: "Regler som prisloft, lav pris og hellere tidligt finder du under Smart og Ekspert.",
    rule_early: "Hellere tidligt",
    rule_early_hint: "Lader så tidligt som muligt, når det højst koster lidt mere pr. kWh end den billigste plan.",
    rule_topup: "Top op før afgang",
    supply_note: "Fælles forsyning: {amps} nu · huset ventes at trække {house} af {limit}.",
    supply_wait: "Fælles forsyning: venter på sin tur · huset ventes at trække {house} af {limit}.",
    supply_short: "Fælles forsyning: der er ikke strøm nok til hele målet – {kwh} mangler.",
    rule_must: "Skal have til klar-tiden",
    rule_must_hint: "Ved fælles forsyning får alle biler først det, de skal have; så fyldes de op efter prioritet. 0 = hele målet.",
    priority_normal: "Normal",
    priority_first: "Først",
    rule_topup_hint: "Lader til {level} når det er billigst, og resten lige før klar-tiden.",
    notify_receipt: "Morgenkvittering og advarsler",
    notify_receipt_hint: "En besked ved klar-tiden om, hvordan det gik, og en advarsel hvis bilen ikke kan nå målet.",
    day_target: "Mål denne dag",
    day_target_usual: "Som normalt",
    note_car_limit: "Bilens egen ladegrænse er {limit}: den stopper der, selv om målet er {target}.",
    note_no_resume: "{name} starter ikke igen efter en pause, så den lader i ét stræk.",
    note_forecast_do: "Brug kendte priser",
    basis_forecast: "Prisprognose",
    basis_known: "Kendte priser",
    note_known_do: "Brug prognosen",
    try_again: "Prøv igen",
    rate_limited: "Bilen har fået mange kommandoer den sidste time; EV Planner venter lidt med den næste.",
    price_issue_stale: "Prissensoren har ingen priser for nu og frem. Tjek integrationen.",
    price_issue_gaps: "Der mangler priser i det næste døgn.",
    price_issue_unit: "Priserne ligner øre eller cent pr. kWh. Vælg en sensor med kr. (eller euro) pr. kWh.",
    curve_line: "Langsommere over {from}: {speed} %/t",
    margin_line: "Sigter efter at være færdig {minutes} min før klar-tiden (lært)",
    receipt_line: "Sidste morgen: {soc} kl. {time} (planlagt {planned})",
    receipt_late: "lidt for sent",
    periods_n: "{n} perioder",
    periods_one: "1 periode",
    charged_for: "ladet {time}",
    legend_charged: "Ladet",
    bill_line_periods: "Perioder: {periods}",
    guest_split_note: "Nogle biler starter ikke igen efter en pause. Er du i tvivl, så lad i ét stræk.",
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
    car_unknown: "Ukendt bil",
    who_guest: "Gæst tilsluttet",
    who_car: "{name} tilsluttet",
    who_title: "Bilen ved laderen",
    who_ask: "Der er sat en bil til, og EV Planner kan ikke se, hvilken det er.",
    who_pick: "Hvilken er det?",
    who_found: "{who}. EV Planner fandt den ud fra, hvor bilerne er, og hvem der blev sat til.",
    who_chosen: "{who}. Det har I selv valgt.",
    who_other: "Er det en anden?",
    who_pick_guest: "En gæst",
    finding_charger: "Finder laderen, bilen holder ved. Opladningen styres, når den er fundet.",

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
    ed_show: "Vis",
    bubble_starts: "starter {time}",
    bubble_until: "lader til {time}",
    bubble_add: "Tilføj",
    bubble_stop: "Stop",
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
    vstatus_charging_solar: "Lader på solen",
    vstatus_waiting_for_sun: "Venter på solen",
    vstatus_solar_only: "Lader kun på solen",
    vstatus_solar_expected: "Solen ventes at klare resten",
    rule_solar: "Lad på solen",
    rule_solar_hint_off: "Kun efter prisen. Slå til for at lade på det, huset ellers sender ud på nettet.",
    rule_solar_hint_surplus: "På overskuddet, når solen skinner. Planen sørger for resten til klar-tiden og regner med en del af solprognosen.",
    rule_solar_hint_only: "Kun på overskuddet fra solen. Bilen bliver ikke nødvendigvis klar.",
    solar_off: "Fra",
    solar_surplus: "Sol og plan",
    solar_only: "Kun sol",
    solar_note_on: "Lader på solen: {amps}{phases}.",
    solar_note_sold: "Solen sælges i stedet: I får {sold}/kWh for den, og planen lader for {plan}/kWh.",
    solar_note_waiting: "Venter på mere sol: der skal mindst {kw} overskud til at starte.",
    solar_note_expected: "Solprognosen lover nok sol før klar-tiden, så planen køber ikke fra nettet nu.",
    solar_phase_1: " på én fase",
    history_solar: "{pct} sol",
    vstatus_no_soc: "Mangler batteriniveau",
    vstatus_no_price_data: "Ingen priser",
    vstatus_not_enough_prices: "Venter på priser",
    vstatus_no_window: "Ingen ladeperiode før fristen",
    vstatus_limit_not_above_soc: "Allerede ved målet",
    vstatus_invalid_input: "Indstillingerne kan ikke bruges",

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
    control_has_backup: "med backup",
    control_on_backup: "backuppen har taget over",
    charger_not_found: "holder ikke ved en lader",
    control_car: "Bilen",
    control_charger: "Laderen",
    control_none: "Ingen (kun plan)",
    power: "Ladeeffekt",
    rules: "Regler",
    rule_min: "Minimum",
    rule_min_hint: "Nås altid, uanset prisen.",
    rule_ceiling: "Prisloft",
    rule_ceiling_hint: "Lad aldrig, når prisen er højere.",
    rule_ceiling_avg_hint: "Gennemsnittet frem til klar-tiden plus {pct}: følger dagens priser.",
    ceiling_fixed: "Fast pris",
    ceiling_relative: "Gennemsnit + %",
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
    rule_join: "Lad færdig i ét stræk",
    rule_join_hint: "Lad videre eller i én periode, når det højst koster så meget mere pr. kWh end den billigste plan. En anden bil, der er sat til samme lader, beholder sine timer.",
    rule_join_continuous: "Plantypen er Én periode, så bilen lader allerede i ét stræk.",
    rule_keep_on: "Hold laderen tændt",
    rule_late: "Lad videre efter klar-tiden",
    rule_late_hint: "Når bilen ikke nåede målet til klar-tiden, lader den videre til målet, så længe den sidder i. Slået fra venter den på næste plan.",
    rule_keep_on_hint: "Efter planen, så bilen kan forvarme fra nettet. Kun når bilen selv stopper ved målet: målet er 100 %, eller bilens egen grænse er målet. Ellers pauses den.",
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
    remove_guest: "Fjern gæst",
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
    charge_speed: "Ladehastighed",
    speed_measuring: "målt på denne ladning",
    speed_learned: "lært af {count} ladninger",
    speed_learned_one: "lært af 1 ladning",
    speed_imported: "fra EV Smart Charging",
    speed_estimated: "anslået, lærer når bilen er ladet 30 %",
    power_learned: "målt",
    settings_sources: "Opsætning",
    settings_notifications: "Notifikationer",
    notify_language: "Sprog i notifikationer",
    notify_language_hint: "Automatisk følger Home Assistants sprog (Indstillinger → System → Generelt).",
    lang_auto: "Automatisk",
    house_look: "Husets billede",
    house_look_hint: "Huset i fanen Hjem. Hvert sted har sit eget hus; biler, ladere, sol og batteri tegnes ind i det, og en administrator kan flytte dem i billedet.",
    house_classic: "Klassisk",
    house_angle: "Vinkelhus",
    house_long: "Længehus",
    house_tee: "T-hus",
    house_aitch: "H-hus",
    house_funkis: "Funkis",
    house_cabin: "Træsommerhus",
    house_hipped: "Valmet parcelhus",
    house_storey: "Halvandet plan",
    house_terrace: "Rækkehus",
    places: "Steder",
    place_home: "Hjem",
    lang_da: "Dansk",
    lang_en: "English",
    price_sensor: "Prissensor",
    notify_phones: "Mobiler",
    widgets_refresh: "Opdater widgets",
    not_set: "Ikke valgt",
    on: "Til",
    off: "Fra",
    change_in_ha: "Skift under Indstillinger → Enheder og tjenester → EV Planner. Prissensoren: de tre prikker → Omkonfigurer. Enhver elpris-integration med priser for i dag og i morgen kan bruges.",
    open_integration: "Åbn integrationen",
    app_title: "App på hjemmeskærmen",
    app_hint: "Åbn linket på telefonen og vælg Føj til hjemmeskærm.",
    open_app: "Åbn app",
    support_title: "Log og support",
    support_summary: "Eksportér alt til fejlfinding",
    support_hint: "Én fil med alt EV Planner ved og har gjort: indstillinger, planer, hvad den har lært, en uges hændelser (beslutninger, kommandoer, vagten, parring, beskeder), loggen, og alle entiteter den bruger med attributter og historik for de sidste 48 timer. Placeringer, nummerplader, stelnumre og nøgler er taget ud.",
    support_export: "Eksportér log",
    support_busy: "Samler …",
    support_failed: "Eksporten mislykkedes",
    support_also: "Den samme fil hentes også under Indstillinger → Enheder og tjenester → EV Planner → ⋮ → Hent diagnosticering.",
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
    tab_home: "Home",
    home_title: "The home now",
    home_grid: "Grid",
    home_house: "House",
    home_limit: "Limit {limit} per phase",
    home_used: "{used} of {limit} in use",
    home_house_now: "The house draws {amps} now",
    home_house_expected: "The house is expected to draw {amps}",
    home_timeline: "Who gets the current",
    home_timeline_hint: "The house first, then the cars – under the limit of {limit} per phase.",
    home_why_first: "{name} charges first – it must be ready at {time}.",
    home_why_turns: "The cars take turns, as there is no room for both.",
    home_why_share: "The cars share the current.",
    home_why_short: "{name} is {kwh} short – there is not enough current for the whole target.",
    home_why_none: "No car needs to charge now.",
    home_no_meter: "Without a meter EV Planner expects the house to draw {amps}. Add a meter in the settings and it learns what the house uses.",
    home_idle: "waiting",
    home_planned_at: "planned {time}",
    edit_open: "Edit",
    edit_things: "Things",
    edit_wires: "Wires",
    edit_panels: "Solar panels",
    edit_labels: "Labels",
    edit_hint_things: "Drag a charger, the box, the battery or the heat pump. Things on a wall stay on a wall.",
    edit_hint_wires: "Drag a stretch of wire to move it. A wire always runs straight.",
    edit_hint_panels: "Tap the roof, or draw across it, to put up or take down panels.",
    edit_hint_labels: "Drag a label to where it is not in the way.",
    edit_undo: "Undo",
    edit_reset_things: "Put things back",
    edit_reset_wires: "Draw them all again",
    edit_reset_wire: "Draw this one again",
    edit_reset_panels: "Put the panels back",
    edit_reset_labels: "Place them again",
    edit_cancel: "Cancel",
    edit_save: "Save",
    edit_saved: "The house is saved",
    edit_count: "{n} panels",
    home_done: "done",
    home_unplugged: "not plugged in",
    home_solar: "Solar panels",
    home_battery: "Home battery",
    home_heat: "Heat pump",
    home_buys: "buying {kw}",
    home_sells: "sending {kw} out",
    home_charges: "charging {kw}",
    home_gives: "giving {kw}",
    rule_look: "The car in the Home tab",
    rule_spot: "The car's place in the drive",
    rule_spot_hint: "Where the car stands in the picture of the house. Automatic: in front of its charger.",
    spot_auto: "Automatic",
    spot_left: "Left",
    spot_right: "Right",
    rule_look_hint: "How the car looks in the drawing of the house.",
    body_mini: "Small",
    body_sedan: "Saloon",
    body_suv: "SUV",
    body_estate: "Estate",
    body_van: "Van",
    body_photo: "My photo",
    paint_white: "White",
    paint_black: "Black",
    home_guard: "The guard watches the meter and turns the cars down at once if the house suddenly needs more.",
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
    setup_title: "Get started",
    setup_text: "Everything is added under the integration. When a car is plugged in, EV Planner makes the first plan by itself.",
    setup_count: "{done} of {all}",
    setup_optional: "Can wait",
    setup_prices: "Electricity prices",
    setup_prices_fix: "{sensor} has no prices EV Planner can read. Choose the price sensor from your price integration under the integration: the three dots by EV Planner → Reconfigure.",
    setup_prices_text: "The price sensor from your price integration, such as Nord Pool, Energi Data Service or Stromligning.",
    setup_car: "A car",
    setup_car_text: "Add car: the battery's size, the charging power and the car's sensors for battery and plug.",
    setup_charger: "A charger",
    setup_charger_text: "Add charger: where the car charges. A charger with a switch can start and pause the car.",
    setup_supply: "The house's supply",
    setup_supply_text: "Under the place Home: the main fuse and a meter, so the cars never draw more than the house can give.",
    setup_energy: "Sun, home battery and heat pump",
    setup_energy_text: "Add the ones you have: the car charges on the surplus from the sun, and the house is counted in the plan.",
    setup_notify: "Notifications",
    setup_notify_text: "Under Configure: the phones that are told about the plan and about problems.",
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
    control_retry: "The command did not get through. Trying again at {time}.",
    no_control_entity: "There is no switch to control charging with. Choose one in the car's options.",
    note_limited: "The price ceiling does not allow the full charge.",
    note_min_only: "Only the minimum level is reached under the price ceiling.",
    note_short: "Not enough time to reach the target by {time}.",
    note_short_plain: "Not enough time to reach the target before the deadline.",
    note_opportunistic: "Opportunistic: the price ceiling is {price} right now.",
    note_joined: "Finishing in one go: {extra} more than the cheapest plan.",
    why_planned: "Charging now: {price}/kWh is among the cheapest before {time}.",
    why_planned_plain: "Charging now, in the planned period.",
    why_low_price: "Charging now: {price}/kWh is below your limit of {level}.",
    why_low_soc: "Charging now: the battery is below {level}.",
    why_charge_now: "Charging now because you chose Charge now.",
    why_waiting: "Waiting: {window} is {diff}/kWh cheaper than now.",
    why_waiting_plain: "Waiting for the planned period {window}.",
    why_topup: "Saving the last {from}–{to} for just before departure, so the car does not stand full all night.",
    why_fallback: "Waiting for prices. If they do not come, it charges {window} so the car is ready.",
    why_keep_on: "Keeping the charger on, so the car can precondition from the grid.",
    why_late: "The ready-by time has passed and the car has not reached {target}. It charges on until it has.",
    why_full: "The car has reached its target of {target}.",
    why_paused: "Paused by you.",
    why_busy: "Someone else is using the charger right now.",
    why_kept: "The plan stays: a new one would save only a few cents.",
    why_early: "Charging early: at most {within}/kWh more than the cheapest plan.",
    glance_charge: "charges {window}",
    level_simple: "Simple",
    level_smart: "Smart",
    level_expert: "Expert",
    level_label: "How many choices",
    level_more: "Rules such as a price ceiling, a low price and prefer early are under Smart and Expert.",
    rule_early: "Prefer early",
    rule_early_hint: "Charges as early as possible when that costs at most a little more per kWh than the cheapest plan.",
    rule_topup: "Top up before departure",
    supply_note: "Shared supply: {amps} now · the house is expected to draw {house} of {limit}.",
    supply_wait: "Shared supply: waiting for its turn · the house is expected to draw {house} of {limit}.",
    supply_short: "Shared supply: not enough current for the whole target – {kwh} short.",
    rule_must: "Must have by the ready-by time",
    rule_must_hint: "On a shared supply every car first gets what it must have; then they fill up by priority. 0 = the whole target.",
    priority_normal: "Normal",
    priority_first: "First",
    rule_topup_hint: "Charges to {level} when it is cheapest, and the rest just before the ready-by time.",
    notify_receipt: "Morning receipt and warnings",
    notify_receipt_hint: "A message at the ready-by time on how it went, and a warning when the car cannot reach its target.",
    day_target: "Target this day",
    day_target_usual: "As usual",
    note_car_limit: "The car's own charge limit is {limit}: it stops there, even though the target is {target}.",
    note_no_resume: "{name} does not charge again after a pause, so it charges in one go.",
    note_forecast_do: "Use known prices",
    basis_forecast: "Price forecast",
    basis_known: "Known prices",
    note_known_do: "Use the forecast",
    try_again: "Try again",
    rate_limited: "The car has had many commands in the last hour; EV Planner waits a little before the next.",
    price_issue_stale: "The price sensor has no prices for now or later. Check the integration.",
    price_issue_gaps: "Prices are missing in the next day.",
    price_issue_unit: "The prices look like cents per kWh. Choose a sensor in your currency per kWh.",
    curve_line: "Slower above {from}: {speed} %/h",
    margin_line: "Aims to be done {minutes} min before the ready-by time (learned)",
    receipt_line: "Last morning: {soc} at {time} (planned {planned})",
    receipt_late: "a little late",
    periods_n: "{n} periods",
    periods_one: "1 period",
    charged_for: "charged {time}",
    legend_charged: "Charged",
    bill_line_periods: "Periods: {periods}",
    guest_split_note: "Some cars do not charge again after a pause. If in doubt, charge in one go.",
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
    car_unknown: "Unknown car",
    who_guest: "A guest is plugged in",
    who_car: "{name} is plugged in",
    who_title: "The car at the charger",
    who_ask: "A car was plugged in, and EV Planner cannot tell which one it is.",
    who_pick: "Which one is it?",
    who_found: "{who}. EV Planner found it from where the cars are and which one was plugged in.",
    who_chosen: "{who}. You chose it yourselves.",
    who_other: "Is it another one?",
    who_pick_guest: "A guest",
    finding_charger: "Finding the charger the car is at. Charging is controlled once it is found.",

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
    ed_show: "Show",
    bubble_starts: "starts {time}",
    bubble_until: "charging until {time}",
    bubble_add: "Add",
    bubble_stop: "Stop",
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
    vstatus_charging_solar: "Charging on the sun",
    vstatus_waiting_for_sun: "Waiting for the sun",
    vstatus_solar_only: "Charges only on the sun",
    vstatus_solar_expected: "The sun is expected to do the rest",
    rule_solar: "Charge on the sun",
    rule_solar_hint_off: "By price only. Turn it on to charge on what the house would send to the grid.",
    rule_solar_hint_surplus: "On the surplus when the sun shines. The plan sees to the rest by the ready-by time, and counts on part of the solar forecast.",
    rule_solar_hint_only: "Only on the surplus from the sun. The car may not be ready.",
    solar_off: "Off",
    solar_surplus: "Sun and plan",
    solar_only: "Only sun",
    solar_note_on: "Charging on the sun: {amps}{phases}.",
    solar_note_sold: "The sun is sold instead: it pays {sold}/kWh, and the plan charges for {plan}/kWh.",
    solar_note_waiting: "Waiting for more sun: it takes at least {kw} of surplus to start.",
    solar_note_expected: "The solar forecast promises enough sun before the ready-by time, so the plan buys nothing from the grid now.",
    solar_phase_1: " on one phase",
    history_solar: "{pct} sun",
    vstatus_no_soc: "Battery level missing",
    vstatus_no_price_data: "No prices",
    vstatus_not_enough_prices: "Waiting for prices",
    vstatus_no_window: "No charging window before the deadline",
    vstatus_limit_not_above_soc: "Already at the target",
    vstatus_invalid_input: "The settings cannot be used",

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
    control_has_backup: "with a backup",
    control_on_backup: "the backup has taken over",
    charger_not_found: "not at a charger",
    control_car: "The car",
    control_charger: "The charger",
    control_none: "None (plan only)",
    power: "Charging power",
    rules: "Rules",
    rule_min: "Minimum",
    rule_min_hint: "Always reached, whatever the price.",
    rule_ceiling: "Price ceiling",
    rule_ceiling_hint: "Never charge when the price is higher.",
    rule_ceiling_avg_hint: "The average up to the ready-by time plus {pct}: follows the day's prices.",
    ceiling_fixed: "Fixed price",
    ceiling_relative: "Average + %",
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
    rule_join: "Finish in one go",
    rule_join_hint: "Charge on, or in one period, when that costs at most this much more per kWh than the cheapest plan. Another car plugged in on the same charger keeps its hours.",
    rule_join_continuous: "The plan type is One period, so the car charges in one go already.",
    rule_keep_on: "Keep the charger on",
    rule_late: "Charge on after the ready-by time",
    rule_late_hint: "When the car did not reach the target by the ready-by time, it charges on to the target while plugged in. Off, it waits for the next plan.",
    rule_keep_on_hint: "After the plan, so the car can precondition from the grid. Only when the car stops at the target by itself: the target is 100 %, or the car's own limit is the target. Otherwise it is paused.",
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
    remove_guest: "Remove the guest",
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
    charge_speed: "Charging speed",
    speed_measuring: "measured on this charge",
    speed_learned: "learned from {count} charges",
    speed_learned_one: "learned from 1 charge",
    speed_imported: "from EV Smart Charging",
    speed_estimated: "estimated, learns once the car has charged 30 %",
    power_learned: "measured",
    settings_sources: "Setup",
    settings_notifications: "Notifications",
    notify_language: "Language of notifications",
    notify_language_hint: "Automatic follows Home Assistant's language (Settings → System → General).",
    lang_auto: "Automatic",
    house_look: "The picture of the house",
    house_look_hint: "The house in the Home tab. Each place has its own house; cars, chargers, sun and battery are drawn into it, and an administrator can move them in the picture.",
    house_classic: "Classic",
    house_angle: "Angle house",
    house_long: "Long house",
    house_tee: "T-house",
    house_aitch: "H-house",
    house_funkis: "Functionalist",
    house_cabin: "Wooden summer house",
    house_hipped: "Hipped bungalow",
    house_storey: "Storey and a half",
    house_terrace: "Terraced house",
    places: "Places",
    place_home: "Home",
    lang_da: "Dansk",
    lang_en: "English",
    price_sensor: "Price sensor",
    notify_phones: "Phones",
    widgets_refresh: "Refresh widgets",
    not_set: "Not set",
    on: "On",
    off: "Off",
    change_in_ha: "Change under Settings → Devices & services → EV Planner. The price sensor: the three dots → Reconfigure. Any price integration with prices for today and tomorrow can be used.",
    open_integration: "Open the integration",
    app_title: "App on the home screen",
    app_hint: "Open the link on your phone and choose Add to Home Screen.",
    open_app: "Open app",
    support_title: "Log and support",
    support_summary: "Export everything for troubleshooting",
    support_hint: "One file with everything EV Planner knows and has done: settings, plans, what it has learned, a week of events (decisions, commands, the guard, pairing, notifications), the log, and every entity it uses with attributes and history for the last 48 hours. Locations, number plates, VINs and keys are left out.",
    support_export: "Export log",
    support_busy: "Collecting …",
    support_failed: "The export failed",
    support_also: "The same file is also under Settings → Devices & services → EV Planner → ⋮ → Download diagnostics.",
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

/* Texts added in 2.3: the Home tab, the history, what EV Planner has learned, the car page's views. */
Object.assign(TEXT.da, {
  reminder_repeat: "Mind mig igen efter",
  reminder_repeat_hint: "0 = kun én gang. Påmindelsen kommer igen, indtil bilen er sat til – højst 3 gange om dagen.",
  ceiling_note: "Svagere farver: timer over prisloftet ({price}). Bilen lader ikke i dem.",
  home_now: "Lige nu",
  home_grid_now: "Net",
  home_house_now_short: "Huset",
  home_cars_now: "Biler",
  home_sun_now: "Sol",
  home_heat_now: "Varmepumpe",
  home_price_now: "Pris nu",
  home_outside: "Ude",
  home_today: "I dag",
  home_today_house: "Hele huset",
  home_today_cars: "Heraf biler",
  home_tonight: "I nat",
  home_tonight_none: "Ingen biler skal lade i nat.",
  home_tonight_total: "{kwh} for {cost} i alt",
  home_chargers: "Ladere",
  home_devices: "Målere",
  view_now: "Nu",
  view_rules: "Regler",
  view_history: "Historik",
  view_learned: "Lært",
  tile_time: "Tid og start",
  tile_price: "Pris",
  tile_battery: "Batteri",
  tile_sun: "Sol",
  tile_look: "Udseende",
  tile_notify: "Beskeder",
  tile_supply: "Fælles forsyning",
  tile_off: "Slået fra",
  tile_close: "Færdig",
  sum_ceiling_avg: "Loft gns. +{pct}",
  sum_ceiling_fixed: "Loft {price}",
  sum_low_price: "Lav pris {price}",
  sum_early: "Tidligt",
  sum_min: "Mindst {pct}",
  sum_low_soc: "Lad straks under {pct}",
  sum_topup: "Top op {pct}",
  sum_earliest: "Tidligst {time}",
  sum_join: "Saml perioder",
  sum_keep_on: "Lader altid tændt",
  sum_reminder: "Påmindelse {time}",
  sum_receipt: "Kvittering",
  sum_live: "Live",
  sum_must: "Skal have {pct}",
  sum_first: "Først i køen",
  hist_day: "Dag",
  hist_week: "Uge",
  hist_month: "Måned",
  hist_year: "År",
  hist_all: "Alle",
  hist_house: "Hele huset",
  hist_guests: "Gæster",
  hist_energy: "Energi",
  hist_cost: "Pris",
  hist_avg: "Gns. pris",
  hist_sessions: "Opladninger",
  hist_sun: "Fra solen",
  hist_none: "Ingen opladninger i perioden.",
  hist_export: "Eksportér CSV",
  csv_start: "Start",
  csv_end: "Slut",
  csv_car: "Bil eller gæst",
  csv_charger: "Lader",
  csv_energy: "kWh",
  csv_cost: "Pris",
  csv_currency: "Valuta",
  csv_start_soc: "Ladeniveau ved start (%)",
  csv_end_soc: "Ladeniveau ved slut (%)",
  csv_solar: "Heraf fra solen (kWh)",
  csv_source: "Målt med",
  csv_source_power: "Effektmåling",
  csv_source_meter: "Laderens elmåler",
  csv_source_soc: "Ladeniveau",
  csv_source_time: "Tid og ladeeffekt",
  hist_house_none: "Hele huset kræver en elmåler i Energi-dashboardet.",
  hist_cars_share: "Biler {pct} af huset",
  hist_prev: "Forrige",
  hist_next: "Næste",
  hist_week_of: "Uge {week}",
  learn_title: "Det har EV Planner lært",
  learn_speed: "Ladehastighed",
  learn_speed_text: "{speed} %/t · {kw} kW",
  learn_from: "lært af {n} opladninger",
  learn_from_one: "lært af 1 opladning",
  learn_estimated: "skønnet – lærer ved næste opladning",
  learn_curve: "Langsommere til sidst",
  learn_curve_text: "Over {from}: {speed} %/t",
  learn_margin: "Ekstra tid",
  learn_margin_text: "{minutes} min før klar-tiden",
  learn_habits: "Jeres vaner",
  learn_plug_in: "Sættes typisk til",
  learn_arrive: "Kommer typisk hjem med",
  learn_per_session: "Pr. opladning",
  learn_per_week: "Opladninger om ugen",
  learn_promise: "Holdt planen",
  learn_promise_text: "{ok} af {n} gange klar til tiden",
  learn_house: "Husets døgn",
  learn_house_text: "Gennemsnit pr. time de sidste 14 dage",
  learn_weather: "Vejret",
  learn_weather_text: "{amps} A mere pr. grad koldere",
  learn_weather_none: "Lærer stadig – kræver nogle dage med skiftende temperatur.",
  learn_sure: "Sikkerhed",
  learn_empty: "EV Planner har ikke lært noget endnu. Det kommer efter de første opladninger.",
  settings_house: "Hus og forsyning",
  settings_house_hint: "Fælles forsyning, sol, batteri, vejr og varmepumpe vælges i integrationens indstillinger.",
  settings_from_energy: "Fra Energi-dashboardet",
  open_settings: "Åbn",
  label_more: "Tryk for navn",
});
Object.assign(TEXT.en, {
  reminder_repeat: "Remind me again after",
  reminder_repeat_hint: "0 = only once. The reminder comes again until the car is plugged in – at most 3 times a day.",
  ceiling_note: "Fainter colours: hours above the price ceiling ({price}). The car does not charge in them.",
  home_now: "Right now",
  home_grid_now: "Grid",
  home_house_now_short: "House",
  home_cars_now: "Cars",
  home_sun_now: "Sun",
  home_heat_now: "Heat pump",
  home_price_now: "Price now",
  home_outside: "Outside",
  home_today: "Today",
  home_today_house: "Whole house",
  home_today_cars: "Of which cars",
  home_tonight: "Tonight",
  home_tonight_none: "No car needs to charge tonight.",
  home_tonight_total: "{kwh} for {cost} in all",
  home_chargers: "Chargers",
  home_devices: "Meters",
  view_now: "Now",
  view_rules: "Rules",
  view_history: "History",
  view_learned: "Learned",
  tile_time: "Time and start",
  tile_price: "Price",
  tile_battery: "Battery",
  tile_sun: "Sun",
  tile_look: "Look",
  tile_notify: "Messages",
  tile_supply: "Shared supply",
  tile_off: "Off",
  tile_close: "Done",
  sum_ceiling_avg: "Ceiling avg +{pct}",
  sum_ceiling_fixed: "Ceiling {price}",
  sum_low_price: "Low price {price}",
  sum_early: "Early",
  sum_min: "At least {pct}",
  sum_low_soc: "Charge at once below {pct}",
  sum_topup: "Top up {pct}",
  sum_earliest: "Not before {time}",
  sum_join: "Join periods",
  sum_keep_on: "Charger always on",
  sum_reminder: "Reminder {time}",
  sum_receipt: "Receipt",
  sum_live: "Live",
  sum_must: "Must have {pct}",
  sum_first: "First in line",
  hist_day: "Day",
  hist_week: "Week",
  hist_month: "Month",
  hist_year: "Year",
  hist_all: "All",
  hist_house: "Whole house",
  hist_guests: "Guests",
  hist_energy: "Energy",
  hist_cost: "Cost",
  hist_avg: "Avg. price",
  hist_sessions: "Charges",
  hist_sun: "From the sun",
  hist_none: "No charging in this period.",
  hist_export: "Export CSV",
  csv_start: "Start",
  csv_end: "End",
  csv_car: "Car or guest",
  csv_charger: "Charger",
  csv_energy: "kWh",
  csv_cost: "Cost",
  csv_currency: "Currency",
  csv_start_soc: "Charge level at start (%)",
  csv_end_soc: "Charge level at end (%)",
  csv_solar: "Of which from the sun (kWh)",
  csv_source: "Measured by",
  csv_source_power: "Power reading",
  csv_source_meter: "Charger meter",
  csv_source_soc: "Charge level",
  csv_source_time: "Time and charging power",
  hist_house_none: "The whole house needs an electricity meter in the Energy dashboard.",
  hist_cars_share: "Cars {pct} of the house",
  hist_prev: "Previous",
  hist_next: "Next",
  hist_week_of: "Week {week}",
  learn_title: "What EV Planner has learned",
  learn_speed: "Charging speed",
  learn_speed_text: "{speed} %/h · {kw} kW",
  learn_from: "learned from {n} charges",
  learn_from_one: "learned from 1 charge",
  learn_estimated: "estimated – learns at the next charge",
  learn_curve: "Slower at the end",
  learn_curve_text: "Above {from}: {speed} %/h",
  learn_margin: "Extra time",
  learn_margin_text: "{minutes} min before the ready-by time",
  learn_habits: "Your habits",
  learn_plug_in: "Usually plugged in",
  learn_arrive: "Usually home with",
  learn_per_session: "Per charge",
  learn_per_week: "Charges a week",
  learn_promise: "Kept the plan",
  learn_promise_text: "{ok} of {n} times ready on time",
  learn_house: "The house's day",
  learn_house_text: "Average per hour over the last 14 days",
  learn_weather: "The weather",
  learn_weather_text: "{amps} A more per degree colder",
  learn_weather_none: "Still learning – needs a few days of changing temperatures.",
  learn_sure: "Certainty",
  learn_empty: "EV Planner has not learned anything yet. That comes after the first charges.",
  settings_house: "House and supply",
  settings_house_hint: "Shared supply, sun, battery, weather and heat pump are chosen in the integration's settings.",
  settings_from_energy: "From the Energy dashboard",
  open_settings: "Open",
  label_more: "Tap for the name",
});

const CHARGER_PRESETS = [3.7, 7.4, 11, 22];
const DEADLINE_PRESETS = ["06:00", "07:00", "08:00"];
const MODES = ["smart", "charge_now", "pause", "off"];
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const OPPORTUNISTIC = ["off", "lower_ceiling", "follow_end_price"];
const TABS = ["cars", "home", "guest", "history", "settings"];
const TAB_KEY = "ev-planner-tab";
const CAR_KEY = "ev-planner-car";
const LEVEL_KEY = "ev-planner-level";
const LEVELS = ["simple", "smart", "expert"];
const PREVIEW_DELAY = 140;
const COMMIT_DELAY = 600;
const HISTORY_PAGE = 12;
const CAR_VIEWS = ["now", "rules", "history"];
const HIST_PERIODS = ["day", "week", "month", "year"];

/* Vehicle status → tone of the pill and the status line. */
/* 2.4: presets, the climate, the latest charge and the charge level ahead. */
Object.assign(TEXT.da, {
  notify_all: "Notifikationer",
  notify_all_hint: "Slå alle EV Planners beskeder til og fra – også med kontakten Notifikationer på enheden EV Planner, fx fra en automatisering, når I går i seng.",
  notify_all_off: "Slået fra",
  quiet_hours: "Stille timer",
  quiet_hours_hint: "Ingen beskeder i dette tidsrum, heller ikke opdateringer af live-beskeden. Planen og ladningen kører som normalt.",
  quiet_from: "Stille fra",
  quiet_to: "Stille til",
  quiet_summary: "stille {from}–{to}",
  quiet_title: "Stille timer {from}–{to}",
  quiet_off: "Ingen stille timer",
  notify_all_off_title: "Alle beskeder er slået fra",
  notify_household_link: "Telefoner, stille timer og sprog gælder alle biler · Indstillinger → Notifikationer",
  trip: "Næste tur",
  trip_morning: "I morgen tidlig",
  trip_afternoon: "I eftermiddag",
  trip_tomorrow_afternoon: "I morgen eftermiddag",
  trip_weekend: "Weekend",
  trip_holiday: "Ferie",
  trip_week: "Ugeplan",
  trip_home_day: "Hjem igen",
  trip_ready: "{when}, én gang – derefter ugeplanen igen.",
  trip_cheap_weekend: "Lader kun, når prisen højst er 10 % over den laveste kendte. Klar mandag morgen.",
  trip_cheap_holiday: "Lader kun i de 10 % billigste timer frem til hjemkomsten.",
  climate_start: "Start klima",
  climate_stop: "Stop klima",
  climate_busy: "Et øjeblik …",
  climate_calendar: "Kalenderen starter klimaet før afgang kl. {time}.",
  climate_auto_note: "Starter selv {min} min. før en tur fra kalenderen eller et forvalg, når det er koldt.",
  last_charge: "Seneste ladning",
  forecast_title: "Ladeniveau frem til afgang",
  forecast_label: "Forventet {pct} {when}",
  tile_climate: "Klima",
  sum_climate_auto: "starter selv",
  rule_morning_time: "Morgen",
  rule_morning_time_hint: "Klar-tiden for Morgen, Weekend og Ferie.",
  rule_midday_time: "Middag",
  rule_midday_time_hint: "Klar-tiden for Middag.",
  rule_evening_time: "Aften",
  rule_evening_time_hint: "Klar-tiden for Aften.",
  avg_price: "Pris pr. kWh",
  g_settings: "Lader og tid",
  cal_title: "Kalender",
  cal_intro: "Vælg de kalendere, jeres ture står i. Hver bil finder sine egne ture på sit ord i begivenheden.",
  cal_example: "klar kl. 7.15 med 80 %, bilen varmet op til 21,5°",
  cal_calendars: "Kalendere",
  cal_cars: "Bilernes ord",
  cal_word: "Ord",
  cal_no_trip: "Ingen tur de næste 36 timer",
  cal_none: "Home Assistant har ingen kalendere endnu. Tilføj fx Google Kalender eller en lokal kalender under Enheder og tjenester.",
  cal_guide: "Hvad kan man skrive?",
  cal_g_time: "Et klokkeslæt (7:15 eller 7.15) er afgangen. Uden står bilen klar ved begivenhedens start.",
  cal_g_target: "80% lader til 80 % til denne tur.",
  cal_g_full: "fuld lader til 100 %.",
  cal_g_climate: "klima varmer bilen op inden afgang, klima 21,5 til 21,5°.",
  cal_g_allday: "En heldagsbegivenhed tæller kun med et klokkeslæt. Ordet * betyder alle begivenheder.",
  src_calendar: "Kalender",
  src_trip: "Forvalg",
  src_week: "Ugeplan",
  next_title: "Næste afgang",
  next_in: "om {time}",
  next_charges: "Lader",
  next_nothing: "ingen ladning planlagt",
  back_to_week: "Tilbage til ugeplanen",
  now: "Nu",
  climate_running: "Kører",
  climate_off: "Slukket",
  climate_inside: "Inde {t}°",
  climate_if_cold: "når det er under {below}°",
  climate_car_temp: "Bilen bruger sin egen temperatur",
  climate_next: "Starter {day} kl. {time} til {temp}° ({why})",
  err_3: "Forbindelsen til Home Assistant blev afbrudt et øjeblik. Prøv igen.",
  sched_make_default: "Sæt som standard",
  sched_default_set: "Standard er nu {time}",
  sched_other_short: "Andet",
  sched_none_short: "Ingen",
  plan_type_hint: "Én periode lader i ét stræk; de billigste perioder kan dele ladningen op.",
  go_morning: "Morgen",
  go_midday: "Middag",
  go_evening: "Aften",
  go_cheap: "kun de billigste timer",
  week_off: "fri: {days}",
  details: "Detaljer",
  climate_label: "Klima",
  rule_afternoon_time: "Eftermiddag",
  rule_afternoon_time_hint: "Hvornår bilen skal være klar ved I eftermiddag og I morgen eftermiddag.",
  rule_climate_temp: "Temperatur",
  rule_climate_temp_hint: "Den temperatur, klimaet sættes til. Bilen afrunder til sine egne trin.",
  rule_climate_minutes: "Før afgang",
  rule_climate_minutes_hint: "Hvor længe før afgang klimaet starter af sig selv.",
  rule_climate_auto: "Start klima af sig selv",
  rule_climate_auto_hint: "Før en tur fra kalenderen eller et forvalg, når det er koldere end grænsen (fra vejret ved stedet). En kalenderbegivenhed med ordet klima starter det altid.",
  rule_climate_below: "Når det er koldere end",
  rule_climate_plugged: "Kun når bilen er sat i",
});
Object.assign(TEXT.en, {
  notify_all: "Notifications",
  notify_all_hint: "Turn all of EV Planner's messages on and off – also with the Notifications switch on the EV Planner device, e.g. from an automation when you go to bed.",
  notify_all_off: "Off",
  quiet_hours: "Quiet hours",
  quiet_hours_hint: "No messages in this time, nor updates of the live notification. The plan and the charging go on as usual.",
  quiet_from: "Quiet from",
  quiet_to: "Quiet until",
  quiet_summary: "quiet {from}–{to}",
  quiet_title: "Quiet hours {from}–{to}",
  quiet_off: "No quiet hours",
  notify_all_off_title: "All messages are off",
  notify_household_link: "Phones, quiet hours and language are for all cars · Settings → Notifications",
  trip: "Next trip",
  trip_morning: "Tomorrow morning",
  trip_afternoon: "This afternoon",
  trip_tomorrow_afternoon: "Tomorrow afternoon",
  trip_weekend: "Weekend",
  trip_holiday: "Holiday",
  trip_week: "Week plan",
  trip_home_day: "Home again",
  trip_ready: "{when}, once – then the week plan again.",
  trip_cheap_weekend: "Charges only when the price is at most 10 % above the lowest known. Ready Monday morning.",
  trip_cheap_holiday: "Charges only in the cheapest 10 % of the hours until you are home.",
  climate_start: "Start climate",
  climate_stop: "Stop climate",
  climate_busy: "One moment …",
  climate_calendar: "The calendar starts the climate before leaving at {time}.",
  climate_auto_note: "Starts by itself {min} min before a calendar trip or a preset, when it is cold.",
  last_charge: "Latest charge",
  forecast_title: "Charge level until departure",
  forecast_label: "Expected {pct} {when}",
  tile_climate: "Climate",
  sum_climate_auto: "starts by itself",
  rule_morning_time: "Morning",
  rule_morning_time_hint: "The ready-by time for Morning, Weekend and Holiday.",
  rule_midday_time: "Midday",
  rule_midday_time_hint: "The ready-by time for Midday.",
  rule_evening_time: "Evening",
  rule_evening_time_hint: "The ready-by time for Evening.",
  avg_price: "Price per kWh",
  g_settings: "Charger and time",
  cal_title: "Calendar",
  cal_intro: "Choose the calendars your trips are in. Each car finds its own trips by its word in the event.",
  cal_example: "ready at 7.15 with 80 %, the car warmed to 21.5°",
  cal_calendars: "Calendars",
  cal_cars: "The cars' words",
  cal_word: "Word",
  cal_no_trip: "No trip in the next 36 hours",
  cal_none: "Home Assistant has no calendars yet. Add e.g. Google Calendar or a local calendar under Devices & services.",
  cal_guide: "What can I write?",
  cal_g_time: "A time (7:15 or 7.15) is the departure. Without one, the car is ready at the event's start.",
  cal_g_target: "80% charges to 80 % for this trip.",
  cal_g_full: "full charges to 100 %.",
  cal_g_climate: "climate warms the car before leaving, climate 21,5 to 21.5°.",
  cal_g_allday: "An all-day event counts only with a time. The word * means every event.",
  src_calendar: "Calendar",
  src_trip: "Preset",
  src_week: "Week plan",
  next_title: "Next departure",
  next_in: "in {time}",
  next_charges: "Charges",
  next_nothing: "no charging planned",
  back_to_week: "Back to the week plan",
  now: "Now",
  climate_running: "Running",
  climate_off: "Off",
  climate_inside: "Inside {t}°",
  climate_if_cold: "when it is below {below}°",
  climate_car_temp: "The car uses its own temperature",
  climate_next: "Starts {day} at {time} at {temp}° ({why})",
  err_3: "The connection to Home Assistant was lost for a moment. Try again.",
  sched_make_default: "Make it the default",
  sched_default_set: "The usual time is now {time}",
  sched_other_short: "Other",
  sched_none_short: "None",
  plan_type_hint: "One period charges in one go; the cheapest periods may split the charge.",
  go_morning: "Morning",
  go_midday: "Midday",
  go_evening: "Evening",
  go_cheap: "cheapest hours only",
  week_off: "off: {days}",
  details: "Details",
  climate_label: "Climate",
  rule_afternoon_time: "Afternoon",
  rule_afternoon_time_hint: "When the car must be ready for This afternoon and Tomorrow afternoon.",
  rule_climate_temp: "Temperature",
  rule_climate_temp_hint: "The temperature the climate is set to. The car rounds it to its own steps.",
  rule_climate_minutes: "Before leaving",
  rule_climate_minutes_hint: "How long before leaving the climate starts by itself.",
  rule_climate_auto: "Start the climate by itself",
  rule_climate_auto_hint: "Before a calendar trip or a preset, when it is colder than the limit (from the weather at the place). A calendar event with the word climate always starts it.",
  rule_climate_below: "When it is colder than",
  rule_climate_plugged: "Only while plugged in",
});

/* The climate dial: an arc of 270° from the bottom left round to the bottom right, in a 240×220 box. */
function dialGeometry(min, max, temp) {
  const r = 92;
  const cx = 120;
  const cy = 118;
  const angle = (t) => (135 + ((t - min) / Math.max(0.1, max - min)) * 270) * (Math.PI / 180);
  const pt = (t) => [cx + r * Math.cos(angle(t)), cy + r * Math.sin(angle(t))];
  const arc = (from, to) => {
    const [x1, y1] = pt(from);
    const [x2, y2] = pt(Math.max(to, from + 0.001));
    const large = ((to - from) / Math.max(0.1, max - min)) * 270 > 180 ? 1 : 0;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  return { rail: arc(min, max), fill: arc(min, temp), knob: pt(temp) };
}

// 2.5: departures, messages and places in the household's settings.
Object.assign(TEXT.da, {
  settings_notifications: "Beskeder",
  notify_household_link: "Telefoner, stille timer og sprog gælder alle biler · Indstillinger → Beskeder",
  notify_missing: "Vælg telefoner under Indstillinger → Beskeder.",
  dep_title: "Afgange",
  dep_intro: "Det, bilerne kan vælge i dropdown på bilens side, ud over ugeplanen. Gælder alle biler. Ret, slet, flyt eller lav dine egne.",
  dep_week_hint: "Bilens egen plan pr. dag · fast",
  dep_add: "Ny afgang",
  dep_new: "Ny afgang",
  dep_name: "Navn",
  dep_time: "Klokken",
  dep_day: "Hvilken dag",
  dep_day_next: "Næste gang",
  dep_day_today: "I dag",
  dep_day_tomorrow: "I morgen",
  dep_day_date_short: "Dato vælges på bilen · {time}",
  dep_day_date_hint: "Hjem-datoen vælges på bilen, når Ferie vælges.",
  dep_price: "Pris",
  dep_price_normal: "Billigst før afgang",
  dep_price_lowest: "Kun laveste pris",
  dep_price_cheapest: "Kun billigste timer",
  dep_price_normal_short: "normal pris",
  dep_price_lowest_short: "laveste + {pct}",
  dep_price_cheapest_short: "billigste {pct} af timerne",
  dep_pct_lowest: "Op til over laveste kendte pris",
  dep_pct_cheapest: "Andel af timerne frem til afgang",
  dep_price_normal_hint: "Som enhver klar-tid: de billigste timer, så bilen når målet.",
  dep_price_lowest_hint: "Lader kun, når prisen er højst så meget over den laveste kendte pris. Bilen når måske ikke målet.",
  dep_price_cheapest_hint: "Lader kun i de billigste timer frem til afgang. Godt til lange perioder som en ferie.",
  dep_target: "Mål",
  dep_target_car: "Bilens eget",
  dep_target_fixed: "Fast",
  dep_up: "Flyt op",
  dep_down: "Flyt ned",
  dep_delete: "Slet",
  dep_done: "Færdig",
  wdn_mon: "Mandag",
  wdn_tue: "Tirsdag",
  wdn_wed: "Onsdag",
  wdn_thu: "Torsdag",
  wdn_fri: "Fredag",
  wdn_sat: "Lørdag",
  wdn_sun: "Søndag",
  notify_common: "For alle biler",
  notify_per_car: "Pr. bil",
  phones_none: "Home Assistant har ingen telefoner at sende til. Installer Home Assistant-appen på telefonen.",
  phones_hint: "Beskederne går til de valgte telefoner. Hver bil kan sende til færre.",
  sum_done: "når ladet",
  no_cars: "Ingen biler endnu.",
  places_title: "Steder",
  places_hint: "Sikring, målere og pris-sensor for et sted ændres under integrationen.",
  place_guard: "Vagt",
  place_guard_short: "med vagt",
  place_guard_hint: "Holder øje med måleren og skruer bilerne ned med det samme, hvis huset pludselig skal bruge mere.",
  place_guard_no_meter: "Kræver en strømmåler for stedet (vælges under integrationen).",
  place_wait: "Vent efter en spids",
  place_wait_hint: "Så længe vagten venter, før bilerne får mere igen. Sæt den lidt længere end tiden mellem husets spidser.",
  place_share: "Når der ikke er plads til alle",
  place_share_queue: "I kø",
  place_share_need: "Efter behov",
  place_share_queue_hint: "Den første bil får det, den skal bruge, så den næste.",
  place_share_need_hint: "Hver bil får en del efter, hvor meget den mangler.",
  place_no_supply: "Ingen fælles forsyning sat op for stedet.",
  place_own_price: "eget prisområde",
  price_add: "Lægges til hver pris",
  price_add_hint: "Fx afgifter og nettarif, når pris-sensoren kun har spotprisen. 0 når sensoren har den fulde pris.",
  price_add_sum: "+{price}/kWh",
  widgets_refresh_on: "opdaterer widgets",
  widgets_refresh_hint: "Beder iOS-appen opdatere sine widgets, når en bils status ændres (højst hvert 15. minut).",
  climate_entity: "Klima",
  climate_entity_hint: "Det, der starter bilens klima. Findes selv på bilens enhed; vælg et andet her.",
  climate_entity_none: "Ingen klima fundet på bilens enhed. Vælg det, der starter bilens klima (en klima-entitet, en knap eller et script).",
  climate_auto_found: "Bilens egen",
  climate_auto_pick: "Automatisk (ingen fundet)",
});
Object.assign(TEXT.en, {
  settings_notifications: "Messages",
  notify_household_link: "Phones, quiet hours and language are for all cars · Settings → Messages",
  notify_missing: "Choose phones under Settings → Messages.",
  dep_title: "Departures",
  dep_intro: "What the cars can pick in the dropdown on a car's page, besides the week plan. For all cars. Change, delete, move or make your own.",
  dep_week_hint: "The car's own plan per day · fixed",
  dep_add: "New departure",
  dep_new: "New departure",
  dep_name: "Name",
  dep_time: "Time",
  dep_day: "Which day",
  dep_day_next: "Next time",
  dep_day_today: "Today",
  dep_day_tomorrow: "Tomorrow",
  dep_day_date_short: "Date chosen on the car · {time}",
  dep_day_date_hint: "The day home is chosen on the car when Holiday is picked.",
  dep_price: "Price",
  dep_price_normal: "Cheapest before leaving",
  dep_price_lowest: "Lowest price only",
  dep_price_cheapest: "Cheapest hours only",
  dep_price_normal_short: "normal price",
  dep_price_lowest_short: "lowest + {pct}",
  dep_price_cheapest_short: "cheapest {pct} of hours",
  dep_pct_lowest: "Up to above the lowest known price",
  dep_pct_cheapest: "Share of the hours until leaving",
  dep_price_normal_hint: "As any ready-by time: the cheapest hours, so the car reaches its target.",
  dep_price_lowest_hint: "Charges only when the price is at most this much above the lowest known price. The car may not reach its target.",
  dep_price_cheapest_hint: "Charges only in the cheapest hours until leaving. Good for long stretches like a holiday.",
  dep_target: "Target",
  dep_target_car: "The car's own",
  dep_target_fixed: "Fixed",
  dep_up: "Move up",
  dep_down: "Move down",
  dep_delete: "Delete",
  dep_done: "Done",
  wdn_mon: "Monday",
  wdn_tue: "Tuesday",
  wdn_wed: "Wednesday",
  wdn_thu: "Thursday",
  wdn_fri: "Friday",
  wdn_sat: "Saturday",
  wdn_sun: "Sunday",
  notify_common: "For all cars",
  notify_per_car: "Per car",
  phones_none: "Home Assistant has no phones to send to. Install the Home Assistant app on the phone.",
  phones_hint: "Messages go to the phones chosen. Each car can send to fewer.",
  sum_done: "when charged",
  no_cars: "No cars yet.",
  places_title: "Places",
  places_hint: "A place's fuse, meters and price sensor are changed under the integration.",
  place_guard: "Guard",
  place_guard_short: "guarded",
  place_guard_hint: "Watches the meter and turns the cars down at once if the house suddenly needs more.",
  place_guard_no_meter: "Needs a current meter for the place (chosen under the integration).",
  place_wait: "Wait after a peak",
  place_wait_hint: "How long the guard waits before the cars get more again. Set it a little longer than the time between the house's peaks.",
  place_share: "When there is not room for all",
  place_share_queue: "In line",
  place_share_need: "By need",
  place_share_queue_hint: "The first car gets what it needs, then the next.",
  place_share_need_hint: "Each car gets a share by how much it lacks.",
  place_no_supply: "No shared supply set up for the place.",
  place_own_price: "own price area",
  price_add: "Added to every price",
  price_add_hint: "E.g. taxes and grid tariffs when the price sensor has the spot price only. 0 when the sensor has the full price.",
  price_add_sum: "+{price}/kWh",
  widgets_refresh_on: "refreshes widgets",
  widgets_refresh_hint: "Asks the iOS app to refresh its widgets when a car's status changes (at most every 15 minutes).",
  climate_entity: "Climate",
  climate_entity_hint: "What starts the car's climate. Found on the car's own device; choose another here.",
  climate_entity_none: "No climate found on the car's device. Choose what starts the car's climate (a climate entity, a button or a script).",
  climate_auto_found: "The car's own",
  climate_auto_pick: "Automatic (none found)",
});
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
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/></svg>',
  climate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a3.5 3.5 0 1 1-4 0z"/><path d="M12 11v5"/><path d="M17.5 6h2.5M17.5 9.5h2.5"/></svg>',
  history: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M8 11l4 4 4-4M5 13v6h14v-6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 8 21M12 3l4 18M7 8h10M6 13h12M9.5 21h5"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4.5 20 11"/><path d="M6.5 9.5V19h11V9.5"/><path d="M12.6 11.5 10.5 15h3l-2.1 3.5"/></svg>',
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
  learn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
  temp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 10v6"/></svg>',
  heat: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="10" cy="12" r="4"/><path d="M10 8v8M6 12h8M17 9h1M17 12h1"/></svg>',
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

/* ---------------------------------------------------------------- The home: a white clay house
   The house in isometric view, as calm as a clay model: soft shades, soft shadows, and thin
   lines of light where the current runs. Only what the home has is drawn: solar panels, the
   home battery, the heat pump, one or two chargers and one or two cars. A car's charging
   cable hangs from its charger to the car, or hangs rolled up on the wall when it is not
   plugged in. The scene is made once and kept, so its motion goes on while the panel redraws. */

const ClayScene = (() => {
  const S = 25;
  const C = Math.cos(Math.PI / 6);
  const W = 800;
  const H = 560;
  const OX = 400;
  const OY = 104;
  const CAM = [1, 1, 1.25];
  const P = (x, y, z = 0) => [(x - y) * C * S + OX, (x + y) * 0.5 * S - z * S + OY];
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const pts = (list) => list.map((p) => P(...p).map(f1).join(",")).join(" ");
  const poly = (list, attrs = "") => `<polygon points="${pts(list)}" ${attrs}/>`;
  const path3 = (list) => "M" + list.map((p) => P(...p).map(f1).join(" ")).join(" L");
  const plane = (o, du, dv) => {
    const a = P(...o);
    const b = P(o[0] + du[0], o[1] + du[1], o[2] + du[2]);
    const c = P(o[0] + dv[0], o[1] + dv[1], o[2] + dv[2]);
    return `matrix(${f1(b[0] - a[0])} ${f1(b[1] - a[1])} ${f1(c[0] - a[0])} ${f1(c[1] - a[1])} ${f1(a[0])} ${f1(a[1])})`;
  };
  const onY = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]);
  const onX = (x, y, z) => plane([x, y, z], [0, 1, 0], [0, 0, -1]);
  const onTop = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]);
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const toHex = (rgb) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

  const T = {
    top: "#FFFFFF", south: "#F4F5F7", east: "#D3D8E0", roofSouth: "#ECEEF2", roofBack: "#CDD2DA",
    glass: "#C9D1DB", glassHi: "#EEF2F6", ground: "#E1E5EB", shadow: "#46506A", line: "#C3C9D3",
    tree: ["#F3F4F6", "#DADDE3"], panel: "#2B3038", panelLine: "#4A5160",
  };
  const PAINT = { white: "#F7F8FA", black: "#2A2D33" };

  /* ------------------------------------------------------------ the cars: five kinds, by their sides */

  // Each kind by its side: [u from the nose, h up, how far the body draws in from its full width there].
  // cs: the foot of the windscreen; rs and re: where the roof begins and ends; ce: the foot of the rear window.
  // Proportions of each class of car; no maker's shapes or badges.
  const BODIES = {
    mini: { L: 4.42, Wd: 1.8, wheels: [0.8, 3.53], r: 0.335, cs: 7, rs: 10, re: 11, ce: 14, pillars: [0.52], pts: [[0.1, 0.3, 0.14], [0.02, 0.42, 0.17], [0, 0.55, 0.17], [0.05, 0.66, 0.14], [0.2, 0.75, 0.09], [0.5, 0.82, 0.05], [0.85, 0.87, 0.04], [1.1, 0.9, 0.07], [1.45, 1.1, 0.14], [1.8, 1.3, 0.2], [2.1, 1.41, 0.24], [3.35, 1.43, 0.25], [3.75, 1.36, 0.23], [4.1, 1.16, 0.18], [4.28, 0.98, 0.13], [4.38, 0.94, 0.12], [4.42, 0.8, 0.14], [4.41, 0.55, 0.15], [4.36, 0.4, 0.15], [4.25, 0.3, 0.13]] },
    sedan: { L: 4.72, Wd: 1.85, wheels: [0.97, 3.85], r: 0.345, cs: 7, rs: 10, re: 11, ce: 14, pillars: [0.48], glassRoof: true, pts: [[0.1, 0.28, 0.14], [0.02, 0.4, 0.17], [0, 0.5, 0.18], [0.06, 0.6, 0.15], [0.25, 0.69, 0.1], [0.6, 0.76, 0.06], [1.0, 0.82, 0.05], [1.25, 0.86, 0.07], [1.65, 1.08, 0.14], [2.05, 1.32, 0.21], [2.4, 1.42, 0.24], [3.05, 1.44, 0.25], [3.55, 1.35, 0.23], [3.95, 1.18, 0.19], [4.25, 1.03, 0.14], [4.55, 0.98, 0.1], [4.7, 0.94, 0.13], [4.72, 0.78, 0.15], [4.7, 0.52, 0.16], [4.62, 0.3, 0.14]] },
    suv: { L: 4.68, Wd: 1.84, wheels: [0.98, 3.82], r: 0.37, cs: 7, rs: 10, re: 11, ce: 14, pillars: [0.4, 0.76], cladding: true, rails: true, pts: [[0.08, 0.36, 0.12], [0.02, 0.5, 0.14], [0, 0.68, 0.14], [0.04, 0.84, 0.12], [0.22, 0.96, 0.08], [0.6, 1.02, 0.05], [0.95, 1.06, 0.05], [1.15, 1.08, 0.07], [1.45, 1.32, 0.13], [1.75, 1.58, 0.18], [2.0, 1.66, 0.2], [4.3, 1.68, 0.2], [4.48, 1.62, 0.18], [4.58, 1.45, 0.15], [4.62, 1.22, 0.11], [4.66, 1.12, 0.09], [4.68, 0.95, 0.11], [4.68, 0.62, 0.12], [4.66, 0.45, 0.12], [4.58, 0.36, 0.11]] },
    estate: { L: 4.93, Wd: 1.9, wheels: [1.0, 3.95], r: 0.35, cs: 7, rs: 10, re: 11, ce: 14, pillars: [0.4, 0.78], rails: true, pts: [[0.1, 0.29, 0.14], [0.02, 0.42, 0.17], [0, 0.53, 0.18], [0.06, 0.63, 0.15], [0.25, 0.72, 0.1], [0.62, 0.79, 0.06], [1.05, 0.85, 0.05], [1.3, 0.88, 0.07], [1.7, 1.1, 0.14], [2.1, 1.34, 0.21], [2.45, 1.44, 0.24], [4.25, 1.44, 0.24], [4.55, 1.36, 0.22], [4.78, 1.18, 0.18], [4.88, 1.02, 0.13], [4.92, 0.96, 0.11], [4.93, 0.82, 0.14], [4.92, 0.55, 0.15], [4.88, 0.4, 0.15], [4.8, 0.29, 0.13]] },
    van: { L: 4.71, Wd: 1.98, wheels: [0.88, 3.88], r: 0.385, cs: 7, rs: 10, re: 11, ce: 14, pillars: [0.3, 0.6, 0.86], pts: [[0.06, 0.4, 0.12], [0.01, 0.55, 0.14], [0, 0.75, 0.14], [0.03, 0.95, 0.12], [0.15, 1.07, 0.08], [0.35, 1.12, 0.05], [0.5, 1.14, 0.05], [0.6, 1.16, 0.07], [0.8, 1.42, 0.11], [1.05, 1.76, 0.15], [1.3, 1.9, 0.17], [4.45, 1.94, 0.17], [4.6, 1.88, 0.16], [4.67, 1.7, 0.14], [4.7, 1.45, 0.1], [4.71, 1.25, 0.09], [4.71, 1.0, 0.1], [4.71, 0.65, 0.11], [4.68, 0.48, 0.12], [4.6, 0.4, 0.12]] },
  };

  // Clay renders of each kind of car, made in the house's own view (true isometric, the same light).
  // Each picture covers the same box, measured from the car's far rear corner on the ground.
  const CAR_BOX = { x: -128, y: -58, w: 190, h: 160 };
  const CAR_PICTURES = { mini: CAR_BOX, sedan: CAR_BOX, suv: CAR_BOX, estate: CAR_BOX, van: CAR_BOX };
  const carPicture = (kind) => {
    try {
      const url = new URL(`./cars/${kind}.webp`, import.meta.url);
      url.search = new URL(import.meta.url).search;
      return url.href;
    } catch (_err) {
      return `/ev_household_planner_static/cars/${kind}.webp`;
    }
  };

  function shadow(ring, strength, blur = "cs-blur") {
    return poly(ring, `fill="${T.shadow}" fill-opacity="${strength}" filter="url(#${blur})"`);
  }

  // A car standing with its nose towards the viewer (+y), its right side (+x) showing. With ``image``
  // (the owner's own cut-out photo of the car), that photo stands there instead of a drawing.
  function car(x0, y0, kind, paintName, { charging = false, image = null } = {}) {
    const body = BODIES[kind] || BODIES.sedan;
    const { L, Wd, pts, cs, rs, re, ce } = body;
    const dark = paintName === "black";
    const paint = PAINT[paintName] || PAINT.white;
    const M = (u, w, h) => [x0 + w, y0 + L - u, h];
    const tone = (lit) => (dark ? mix("#08090B", paint, Math.min(1.35, lit)) : mix("#737C89", paint, Math.min(1, lit)));
    // The pictures bring their own shadow.
    let s = CAR_PICTURES[kind] && !image ? "" : shadow([M(-0.15, 0, 0), M(L + 0.15, 0, 0), M(L + 0.15, Wd + 0.1, 0), M(-0.15, Wd + 0.1, 0)], 0.42);
    if (!CAR_PICTURES[kind] || image) s += shadow([M(0.3, 0.25, 0), M(L - 0.3, 0.25, 0), M(L - 0.3, Wd - 0.25, 0), M(0.3, Wd - 0.25, 0)], 0.5, "cs-blur-s");
    if (charging) s += `<ellipse class="cs-carglow" transform="${onTop(x0 + Wd / 2, y0 + L / 2, 0)}" rx="${f1(Wd * 0.9)}" ry="${f1(L * 0.62)}" fill="url(#cs-glowg)"/>`;
    if (image) {
      const [cx, cy] = P(x0 + Wd / 2, y0 + L / 2, 0);
      const w = (L + Wd) * C * S * 1.05;
      return s + `<image href="${image}" x="${f1(cx - w / 2)}" y="${f1(cy - w * 0.62)}" width="${f1(w)}" height="${f1(w * 0.7)}" preserveAspectRatio="xMidYMax meet"/>`;
    }
    const picture = CAR_PICTURES[kind];
    if (picture) {
      const [ox, oy] = P(x0, y0, 0);
      return s + `<image href="${carPicture(kind)}" x="${f1(ox + picture.x)}" y="${f1(oy + picture.y)}" width="${f1(picture.w)}" height="${f1(picture.h)}"/>`;
    }
    const glassTop = dark ? "#3E4756" : "#262B33";
    const glassSide = dark ? "#333B48" : "#2B3038";
    // The far wheels peek out under the body.
    for (const u of body.wheels) s += `<g transform="${onX(x0 + 0.2, y0 + L - u, body.r)}"><circle r="${body.r}" fill="#16181B"/></g>`;
    // Bonnet, glass, roof, boot: facet by facet, lit by how each faces the sky.
    for (let k = 0; k < pts.length; k += 1) {
      const a = pts[k];
      const b = pts[(k + 1) % pts.length];
      const nu = -(b[1] - a[1]);
      const nh = b[0] - a[0];
      if (nu * -CAM[1] + nh * CAM[2] <= 0.001) continue;
      const len = Math.hypot(nu, nh) || 1;
      const lit = 0.62 + 0.48 * Math.max(0, nh / len);
      const quad = [M(a[0], a[2], a[1]), M(b[0], b[2], b[1]), M(b[0], Wd - b[2], b[1]), M(a[0], Wd - a[2], a[1])];
      const glassy = (k >= cs && k < rs) || (k >= re && k < ce) || (body.glassRoof && k >= rs && k < re);
      const fill = glassy ? glassTop : tone(lit);
      s += poly(quad, `fill="${fill}" stroke="${fill}" stroke-width=".6" stroke-linejoin="round"`);
    }
    // The front: a slim light at each corner, a dark panel between them, an intake low down, a plate.
    const onEdge = (k, t, w, lift = 0.004) => {
      const a = pts[k];
      const b = pts[k + 1];
      return M(a[0] + (b[0] - a[0]) * t - lift, w, a[1] + (b[1] - a[1]) * t);
    };
    const patch = (k, t0, t1, w0, w1, attrs) => poly([onEdge(k, t0, w0), onEdge(k, t1, w0), onEdge(k, t1, w1), onEdge(k, t0, w1)], attrs);
    const housing = dark ? "#3A3F47" : "#2C3036";
    for (const [w0, w1] of [[0.12, 0.55], [Wd - 0.55, Wd - 0.12]]) {
      s += patch(3, 0.05, 0.85, w0, w1, `fill="${housing}"`);
      s += patch(3, 0.35, 0.6, w0 + 0.04, w1 - 0.04, `fill="#F6F8FB" class="cs-lamp"`);
    }
    s += patch(2, 0.2, 0.9, 0.58, Wd - 0.58, `fill="${dark ? "#15171A" : "#23262B"}"`);
    s += patch(0, 0.25, 0.85, 0.4, Wd - 0.4, `fill="${dark ? "#121417" : "#2A2D33"}"`);
    s += patch(1, 0.3, 0.75, Wd / 2 - 0.26, Wd / 2 + 0.26, `fill="#F2F3F5"`);
    // A thin line of sky across the windscreen.
    const ws = (t, w) => M(pts[cs][0] + (pts[rs][0] - pts[cs][0]) * t, w, pts[cs][1] + (pts[rs][1] - pts[cs][1]) * t + 0.01);
    s += `<path d="${path3([ws(0.2, 0.3), ws(0.8, 0.75)])}" stroke="#fff" stroke-opacity="${dark ? 0.25 : 0.18}" stroke-width="2.2" stroke-linecap="round"/>`;
    if (body.rails) for (const w of [0.38, Wd - 0.38]) s += `<path d="${path3([M(pts[rs][0] + 0.12, w, pts[rs][1] + 0.06), M(pts[re][0] - 0.08, w, pts[re][1] + 0.06)])}" stroke="${dark ? "#4A4F57" : "#9AA2AD"}" stroke-width="1.8" stroke-linecap="round"/>`;
    // The right side, flat on its plane; where the body draws in, it shows a little higher and further back.
    const side = plane(M(0, Wd, 0), [0, -1, 0], [0, 0, -1]);
    const xy = ([u, h, d]) => [u - d, -(h + d)];
    const str = (list) => list.map(([a, b]) => `${f1(a)},${b.toFixed(2)}`).join(" ");
    const outline = str([...pts.slice(0, cs + 1), pts[ce], ...pts.slice(ce + 1)].map(xy));
    const cabin = str(pts.slice(cs, ce + 1).map(xy));
    const pane = str([
      xy([pts[cs][0] + 0.22, pts[cs][1] + 0.05, pts[cs][2]]),
      ...pts.slice(cs + 1, ce).map((p, i, all) => xy([p[0] + (i === 0 ? 0.05 : i === all.length - 1 ? -0.05 : 0), p[1] - 0.07, p[2]])),
      xy([pts[ce][0] - 0.2, pts[ce][1] + 0.05, pts[ce][2]]),
    ]);
    const roofAt = (t) => xy([pts[rs][0] + (pts[re][0] - pts[rs][0]) * t, pts[rs][1], pts[rs][2]]);
    const beltAt = (t) => xy([pts[cs][0] + (pts[ce][0] - pts[cs][0]) * t, pts[cs][1] + (pts[ce][1] - pts[cs][1]) * t, pts[cs][2]]);
    const cut = (a, b) => (a[0] + b[0]) / 2;
    const doorU = body.pillars.map((t) => cut(roofAt(t), beltAt(t)));
    const beltY = (u) => -(pts[cs][1] + ((pts[ce][1] - pts[cs][1]) * (u - pts[cs][0])) / (pts[ce][0] - pts[cs][0]) - 0.03);
    const sill = -(body.r + 0.1);
    const arch = body.cladding ? "#202327" : tone(0.38);
    // The mirror, standing out from the door.
    const mu = pts[cs][0] + 0.18;
    const mh = pts[cs][1] + 0.06;
    const mirror = str([xy([mu, mh, -0.14]), xy([mu + 0.26, mh, -0.12]), xy([mu + 0.24, mh + 0.13, -0.12]), xy([mu + 0.04, mh + 0.15, -0.14])]);
    s += `<g transform="${side}">
      <polygon points="${cabin}" fill="${tone(0.66)}"/>
      <polygon points="${pane}" fill="${glassSide}"/>
      <polygon points="${pane}" fill="url(#cs-pane)"/>
      ${body.pillars.map((t) => { const r = roofAt(t); const b = beltAt(t); return `<path d="M${f1(r[0] - 0.04)} ${(r[1] + 0.05).toFixed(2)} L${f1(b[0] - 0.08)} ${(b[1] - 0.03).toFixed(2)}" stroke="${tone(0.6)}" stroke-width=".085"/>`; }).join("")}
      <polygon points="${outline}" fill="${tone(0.9)}"/>
      <polygon points="${outline}" fill="url(#cs-side)"/>
      <path d="M${f1(xy(pts[4])[0])} ${(xy(pts[4])[1] + 0.1).toFixed(2)} C ${f1(L * 0.35)} ${(beltY(L * 0.35) + 0.09).toFixed(2)} ${f1(L * 0.7)} ${(beltY(L * 0.7) + 0.08).toFixed(2)} ${f1(xy(pts[ce])[0] + 0.1)} ${(xy(pts[ce])[1] + 0.12).toFixed(2)}" stroke="#fff" stroke-opacity="${dark ? 0.22 : 0.75}" stroke-width=".035" fill="none"/>
      ${[xy(pts[cs])[0] + 0.12, ...doorU.slice(0, -1).map((u) => u + 0.02), doorU[doorU.length - 1] + 0.02].map((u) => `<path d="M${f1(u)} ${beltY(u).toFixed(2)} V ${(sill - 0.02).toFixed(2)}" stroke="${tone(0.62)}" stroke-width=".016"/>`).join("")}
      ${doorU.map((u) => `<rect x="${f1(u - 0.42)}" y="${(beltY(u) + 0.13).toFixed(2)}" width=".2" height=".035" rx=".015" fill="${tone(0.66)}"/>`).join("")}
      <path d="M${f1(body.wheels[0] + body.r + 0.2)} ${sill.toFixed(2)} H ${f1(body.wheels[1] - body.r - 0.2)}" stroke="${body.cladding ? "#202327" : tone(0.62)}" stroke-width="${body.cladding ? 0.14 : 0.05}"/>
      <polygon points="${mirror}" fill="${tone(0.75)}"/>
      <path d="M${f1(mu + 0.04 + 0.14)} ${(-(mh + 0.14)).toFixed(2)} l.1 .06" stroke="#16181B" stroke-width=".04"/>
      ${body.wheels.map((u) => {
        const r = body.r;
        const spokes = [0, 72, 144, 216, 288].map((a) => { const t = (a * Math.PI) / 180; return `M${f1(u + Math.cos(t) * r * 0.16)} ${(-r + Math.sin(t) * r * 0.16).toFixed(3)} L${f1(u + Math.cos(t + 0.18) * r * 0.6)} ${(-r + Math.sin(t + 0.18) * r * 0.6).toFixed(3)} L${f1(u + Math.cos(t - 0.18) * r * 0.6)} ${(-r + Math.sin(t - 0.18) * r * 0.6).toFixed(3)} Z`; }).join(" ");
        return `<path d="M${f1(u - r - 0.13)} ${(-r + 0.07).toFixed(2)} A ${f1(r + 0.13)} ${f1(r + 0.13)} 0 0 1 ${f1(u + r + 0.13)} ${(-r + 0.07).toFixed(2)} Z" fill="${arch}"/>
        <circle cx="${f1(u)}" cy="${-r}" r="${r}" fill="#17191C"/>
        <circle cx="${f1(u)}" cy="${-r}" r="${f1(r * 0.86)}" fill="none" stroke="#2A2D32" stroke-width=".03"/>
        <circle cx="${f1(u)}" cy="${-r}" r="${f1(r * 0.66)}" fill="${dark ? "#2E3238" : "#3A3F46"}"/>
        <path d="${spokes}" fill="${dark ? "#5A616B" : "#C9CED6"}"/>
        <circle cx="${f1(u)}" cy="${-r}" r="${f1(r * 0.66)}" fill="none" stroke="${dark ? "#5A616B" : "#C9CED6"}" stroke-width=".035"/>
        <circle cx="${f1(u)}" cy="${-r}" r="${f1(r * 0.13)}" fill="${dark ? "#5A616B" : "#AEB5BF"}"/>`;
      }).join("")}
      <circle class="cs-port${charging ? " on" : ""}" cx="${f1(L - 0.78)}" cy="${(-(pts[ce][1] - 0.2)).toFixed(2)}" r=".055"/>
    </g>`;
    return s;
  }
  // Where each car's charging port is in its picture (pixels of the 570 × 480 render): on its right side, at the back.
  const PORTS = { mini: [462, 205], sedan: [470, 215], suv: [478, 195], estate: [470, 200], van: [478, 175] };
  // The port on the screen, for the cable.
  const portAt = (x0, y0, kind, image) => {
    const picture = CAR_PICTURES[kind];
    if (image || !picture) {
      const body = BODIES[kind] || BODIES.sedan;
      const c = body.pts[body.ce];
      return P(x0 + body.Wd - c[2] + 0.01, y0 + 0.78 + c[2], c[1] - 0.2 + c[2]);
    }
    const [ox, oy] = P(x0, y0, 0);
    const [px, py] = PORTS[kind] || PORTS.sedan;
    return [ox + picture.x + (px / 570) * picture.w, oy + picture.y + (py / 480) * picture.h];
  };

  /* ------------------------------------------------------------ the light */

  // Every surface has its colour by day, at dusk and at night; the scene slides between them with the sun.
  // The shadows never move: a soft one under the eaves on every wall, and one under the house.
  const MODES = [
    { // day
      bg: "#F2F3F6", ground: "#ECEEF2", drive: "#F7F8FA", wallS: "#D3D7DE", wallE: "#BDC3CC", door: "#E4E7EC", roof: "#FBFBFC", roofEdge: "#E3E6EB", roofBack: "#EEF0F3", roofW: "#F3F4F7", roofFar: "#E6E9EE", flat: "#F7F8F9",
      win: "#FFFFFF", frame: "#B9C0CA", eave: "#2F3746", eaveOp: 0.5, shadow: "#46506A", shadowOp: 0.3, device: "#3A3F47", deviceSide: "#2C3036", deviceTop: "#4C525B",
      flow: "#14B47C", tree: "#FAFAFB", treeShade: "#D3D8DF", panel: "#262C38", panelLine: "#4B5567", car: 1, lights: 0, stars: 0,
    },
    { // dusk
      bg: "#C9C2CC", ground: "#C3BCC6", drive: "#D2CCD3", wallS: "#ABA5B2", wallE: "#958FA0", door: "#BDB7C3", roof: "#E6DFE2", roofEdge: "#C4BCC4", roofBack: "#CFC8CF", roofW: "#D8D1D7", roofFar: "#C6BFC8", flat: "#DED7DB",
      win: "#FFE1A8", frame: "#8E8796", eave: "#251F30", eaveOp: 0.45, shadow: "#2E2740", shadowOp: 0.26, device: "#2F333B", deviceSide: "#24282E", deviceTop: "#3B4048",
      flow: "#22C48A", tree: "#DCD5DB", treeShade: "#9E97A6", panel: "#252833", panelLine: "#454A5A", car: 0.78, lights: 0.55, stars: 0,
    },
    { // night
      bg: "#151A22", ground: "#181D26", drive: "#232A34", wallS: "#394150", wallE: "#2D3440", door: "#4A5262", roof: "#5D6675", roofEdge: "#454D5A", roofBack: "#4C5462", roofW: "#535B69", roofFar: "#454C59", flat: "#535C6A",
      win: "#FFD48A", frame: "#2A2F38", eave: "#000000", eaveOp: 0.5, shadow: "#000000", shadowOp: 0.38, device: "#23272D", deviceSide: "#1B1E23", deviceTop: "#2C3036",
      flow: "#34D893", tree: "#3E4654", treeShade: "#2B313C", panel: "#171B23", panelLine: "#363E4C", car: 0.5, lights: 1, stars: 1,
    },
  ];
  function modeAt(k) {
    const [a, b, t] = k <= 0.5 ? [MODES[0], MODES[1], k / 0.5] : [MODES[1], MODES[2], (k - 0.5) / 0.5];
    const out = {};
    for (const key of Object.keys(a)) out[key] = typeof a[key] === "number" ? a[key] + (b[key] - a[key]) * t : mix(a[key], b[key], t);
    return out;
  }
  // Colour each part by its role.
  function paint(nodes, m) {
    for (const node of nodes) {
      const r = node.dataset.r;
      const k = Number(node.dataset.k || 1);
      if (r === "eave") {
        node.setAttribute("fill", m.eave);
        node.setAttribute("opacity", (m.eaveOp * k).toFixed(3));
      } else if (r === "shadow") {
        node.setAttribute("fill", m.shadow);
        node.setAttribute("opacity", (m.shadowOp * k).toFixed(3));
      } else if (r === "shadowLine") {
        node.setAttribute("stroke", m.shadow);
        node.setAttribute("opacity", (m.shadowOp * 1.8).toFixed(3));
      } else if (r === "groundStop") node.setAttribute("stop-color", m.ground);
      else if (r === "line") node.setAttribute("stroke", m.frame);
      else if (r === "flow") node.setAttribute("stroke", m.flow);
      else if (r === "flowGlow") {
        node.setAttribute("stroke", m.flow);
        node.setAttribute("opacity", (0.15 + 0.6 * m.lights).toFixed(2));
      } else if (r === "panel") {
        node.setAttribute("fill", m.panel);
        node.setAttribute("stroke", m.panelLine);
      } else if (m[r]) node.setAttribute("fill", m[r]);
    }
  }
  const R = (role, extra = "") => `data-r="${role}" ${extra}`;
  const rpoly = (list, role, extra = "") => `<polygon points="${pts(list)}" ${R(role, extra)}/>`;

  // Where the current comes from, in the colours of Home Assistant's Energy dashboard.
  const SOURCE = { sun: "#FFB224", grid: "#3B8BFF", sold: "#9A6BFF", battery: "#2FC7B5" };
  // What a charging cable shows, in the colours chargers and cars use.
  const STATUS = { unplugged: "#9AA6B4", connected: "#3B8BFF", planned: "#F5A524", charging: "#22C981", done: "#22C981" };

  /* ------------------------------------------------------------ cables */

  // A real cable: black rubber with a little light along its top.
  const rubber = (d, w = 4.4) => `<path d="${d}" fill="none" stroke="#14171C" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#59616D" stroke-width="1.1" stroke-linecap="round" opacity=".75" transform="translate(-.7 -.9)"/>`;

  // Plugged in: from the charger down onto the ground and up into the car's port, the plug coming in from the charger's side.
  function plugCable(a, q) {
    const dir = q[0] >= a[0] ? 1 : -1;
    const h = [q[0] - dir * 9.5, q[1] + (dir > 0 ? 1.2 : 0.5)];
    const gy = Math.max(a[1] + 30, h[1] - 8);
    const gx = a[0] + (h[0] - a[0]) * 0.4;
    const d = `M${f1(a[0])} ${f1(a[1])} C${f1(a[0])} ${f1(a[1] + (gy - a[1]) * 0.6)} ${f1(gx - (h[0] - a[0]) * 0.25)} ${f1(gy)} ${f1(gx)} ${f1(gy)} S${f1(h[0] - dir * 8)} ${f1(h[1] + 5)} ${f1(h[0])} ${f1(h[1])}`;
    const lift = dir > 0 ? -2.3 : -2.2;
    return {
      d,
      svg: `<path d="${d}" class="cs-cable-glow" fill="none" stroke-width="11" stroke-linecap="round" filter="url(#cs-pkglow)"/>${rubber(d)}<g class="cs-pk"></g>
        <path d="M${f1(h[0])} ${f1(h[1])} L${f1(q[0])} ${f1(q[1])}" stroke="#14171C" stroke-width="7.5" stroke-linecap="round"/>
        <path d="M${f1(h[0] + dir)} ${f1(h[1] + lift)} L${f1(q[0] - dir)} ${f1(q[1] + lift)}" stroke="#6B737F" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
        <circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="3.6" fill="none" stroke-width="1.8" class="cs-ring-led"/>`,
    };
  }

  /* ------------------------------------------------------------ the house */

  // A box with grey walls (the side towards the light a shade lighter).
  function box(x0, y0, z0, x1, y1, z1, roles = ["device", "deviceSide", "deviceTop"]) {
    let s = rpoly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], roles[0]);
    s += rpoly([[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], roles[1]);
    if (roles[2]) s += rpoly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], roles[2]);
    return s;
  }

  // A soft shadow on a wall just under the roof's edge: strips from the edge down, fading.
  function eaveShadow(a, b, depth) {
    let s = "";
    const n = 6;
    for (let i = 0; i < n; i += 1) {
      const z0 = (depth * i) / n;
      const z1 = (depth * (i + 1)) / n;
      s += `<polygon points="${pts([[a[0], a[1], a[2] - z0], [b[0], b[1], b[2] - z0], [b[0], b[1], b[2] - z1], [a[0], a[1], a[2] - z1]])}" ${R("eave", `data-k="${((1 - i / n) ** 1.6).toFixed(3)}"`)}/>`;
    }
    return s;
  }

  // The lit windows at night: drawn over the scene.
  let LIGHTS = [];
  function windowY(x0, x1, y, z0, z1, cols = 1) {
    let s = rpoly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], "frame");
    const g = [[x0 + 0.07, y, z0 + 0.07], [x1 - 0.07, y, z0 + 0.07], [x1 - 0.07, y, z1 - 0.07], [x0 + 0.07, y, z1 - 0.07]];
    s += rpoly(g, "win");
    LIGHTS.push(`<polygon points="${pts(g)}" fill="#FFD48A" filter="url(#cs-glowf)" opacity=".8"/>`);
    for (let c = 1; c < cols; c += 1) {
      const x = x0 + ((x1 - x0) / cols) * c;
      s += `<path d="${path3([[x, y + 0.01, z0 + 0.07], [x, y + 0.01, z1 - 0.07]])}" ${R("line", 'stroke-width="2.2"')}/>`;
    }
    return s;
  }

  function windowX(x, y0, y1, z0, z1, cols = 1, rows = 1) {
    let s = rpoly([[x, y1, z0], [x, y0, z0], [x, y0, z1], [x, y1, z1]], "frame");
    const g = [[x, y1 - 0.07, z0 + 0.07], [x, y0 + 0.07, z0 + 0.07], [x, y0 + 0.07, z1 - 0.07], [x, y1 - 0.07, z1 - 0.07]];
    s += rpoly(g, "win");
    LIGHTS.push(`<polygon points="${pts(g)}" fill="#FFD48A" filter="url(#cs-glowf)" opacity=".8"/>`);
    for (let c = 1; c < cols; c += 1) {
      const y = y1 - ((y1 - y0) / cols) * c;
      s += `<path d="${path3([[x + 0.01, y, z0 + 0.07], [x + 0.01, y, z1 - 0.07]])}" ${R("line", 'stroke-width="2.2"')}/>`;
    }
    for (let r = 1; r < rows; r += 1) {
      const z = z0 + ((z1 - z0) / rows) * r;
      s += `<path d="${path3([[x + 0.01, y1 - 0.07, z], [x + 0.01, y0 + 0.07, z]])}" ${R("line", 'stroke-width="2.2"')}/>`;
    }
    return s;
  }

  // A round clay tree.
  function tree(x, y, k = 1) {
    const [bx, by] = P(x, y, 0);
    const cy = by - 2.6 * S * k;
    const r = 1.25 * S * k;
    return `<ellipse cx="${f1(bx + 8)}" cy="${f1(by + 2)}" rx="${f1(26 * k)}" ry="${f1(10 * k)}" ${R("shadow", 'filter="url(#cs-blur)"')}/>
      <path d="M${f1(bx - 2)} ${f1(by)} L${f1(bx - 1)} ${f1(by - 50 * k)} L${f1(bx + 1)} ${f1(by - 50 * k)} L${f1(bx + 2)} ${f1(by)} Z" ${R("treeShade")}/>
      <circle cx="${f1(bx)}" cy="${f1(cy)}" r="${f1(r)}" ${R("treeShade")}/>
      <circle cx="${f1(bx - r * 0.12)}" cy="${f1(cy - r * 0.12)}" r="${f1(r * 0.86)}" ${R("tree")}/>`;
  }

  /* ------------------------------------------------------------ things a household can place */

  // A thing on a wall: u is its left edge as seen in the picture, z its bottom. A wall towards the road (S)
  // runs along x; a gable (E) runs along y, the other way, so "to the right" is -y there.
  const along = (wall, u, a) => (wall.kind === "S" ? u + a : u - a);
  const onWall = (wall, u, z, out = 0.02) => (wall.kind === "S" ? [u, wall.c + out, z] : [wall.c + out, u, z]);
  const outward = (wall) => (wall.kind === "S" ? [0, 1] : [1, 0]);
  // To the right in the picture, in the world.
  const rightward = (wall) => (wall.kind === "S" ? [1, 0] : [0, -1]);
  // The sizes of things on a wall (wide, tall, deep) and the heat pump's (wide, tall, deep).
  const SIZE = { gateway: [0.5, 0.6, 0.14], charger: [0.36, 0.65, 0.14], heat: [1.4, 0.97, 0.55] };

  function wallBox(wall, u, z0, w, h, d) {
    if (wall.kind === "S") return box(u, wall.c, z0, u + w, wall.c + d, z0 + h);
    return box(wall.c, u - w, z0, wall.c + d, u, z0 + h, ["deviceSide", "device", "deviceTop"]);
  }
  // Lays a drawing in metres on the front of a thing: x to the right, y down from its top.
  const onFront = (wall, u, ztop, d) => (wall.kind === "S" ? plane([u, wall.c + d + 0.001, ztop], [1, 0, 0], [0, 0, -1]) : plane([wall.c + d + 0.001, u, ztop], [0, -1, 0], [0, 0, -1]));

  function drawGateway(wall, t) {
    const [w, h, d] = SIZE.gateway;
    const [bx, by] = P(...onWall(wall, along(wall, t.u, 0.27), t.z + 0.5, d + 0.01));
    return wallBox(wall, t.u, t.z, w, h, d) + `<path d="M${f1(bx)} ${f1(by)} l-3 6 h3 l-2 6 l5 -8 h-3 l2 -4z" class="cs-bolt"/>`;
  }

  function drawCharger(wall, t) {
    const [w, h, d] = SIZE.charger;
    const a = along(wall, t.u, w / 2);
    return wallBox(wall, t.u, t.z, w, h, d) + `<path d="${path3([onWall(wall, a, t.z + 0.17, d + 0.01), onWall(wall, a, t.z + 0.5, d + 0.01)])}" class="cs-led" stroke-width="2.4" stroke-linecap="round"/>`;
  }

  function drawBattery(wall, t, size, soc) {
    const [w, h, d] = size;
    const level = Math.max(0.03, 0.9 * ((soc ?? 50) / 100));
    const x = w / 2 - 0.07;
    const n = (v) => v.toFixed(3);
    return wallBox(wall, t.u, t.z, w, h, d) + `<g transform="${onFront(wall, t.u, t.z + h, d)}">
      <rect x="${n(x)}" y=".2" width=".14" height=".96" rx=".06" fill="#23272D"/>
      <rect class="cs-glowbar" x="${n(x)}" y="${n(1.14 - level)}" width=".14" height="${n(level)}" rx=".06" fill="${SOURCE.battery}"/>
      <rect x="${n(x + 0.03)}" y="${n(1.15 - level)}" width=".08" height="${n(level - 0.02)}" rx=".04" fill="#9AF0E4"/>
    </g>`;
  }

  // The heat pump stands on the ground with its fan towards the road (S) or towards the gable's side (E).
  function drawHeat(t, face) {
    const [w, , d] = SIZE.heat;
    const { x, y } = t;
    const fan = `<circle cx=".55" cy=".48" r=".36" fill="#15181D"/>
      <g class="cs-fan"><path d="M.55 .48 C .6 .3 .72 .22 .8 .3 C .74 .4 .64 .46 .55 .48 Z M.55 .48 C .74 .55 .76 .7 .68 .76 C .6 .7 .56 .58 .55 .48 Z M.55 .48 C .42 .62 .3 .64 .28 .54 C .36 .48 .46 .47 .55 .48 Z" fill="#4A5059"/></g>
      <rect class="cs-heatled" x="1.08" y=".14" width=".22" height=".04" rx=".02"/>`;
    if (face === "E") {
      return `<polygon points="${pts([[x - 0.15, y - 0.2, 0], [x + d + 0.4, y - 0.2, 0], [x + d + 0.4, y + w + 0.4, 0], [x - 0.15, y + w + 0.4, 0]])}" ${R("shadow", 'filter="url(#cs-blur)"')}/>` +
        box(x, y, 0.08, x + d, y + w, 1.05) + `<g transform="${plane([x + d + 0.001, y + w, 1.05], [0, -1, 0], [0, 0, -1])}">${fan}</g>`;
    }
    return `<polygon points="${pts([[x - 0.15, y - 0.15, 0], [x + w + 0.45, y - 0.15, 0], [x + w + 0.45, y + d + 0.4, 0], [x - 0.15, y + d + 0.4, 0]])}" ${R("shadow", 'filter="url(#cs-blur)"')}/>` +
      box(x, y, 0.08, x + w, y + d, 1.05) + `<g transform="${plane([x, y + d + 0.001, 1.05], [1, 0, 0], [0, 0, -1])}">${fan}</g>`;
  }
  // Where the heat pump's wire comes in: low on its front, and the way out from it.
  const heatEnd = (t, face) => (face === "E" ? { p: [t.x + SIZE.heat[2] + 0.02, t.y + 0.7, 0.3], n: [1, 0] } : { p: [t.x + 0.7, t.y + SIZE.heat[2] + 0.02, 0.3], n: [0, 1] });

  // A cable rolled up where no car is plugged in: on a hook beside the charger ("side"), or under it ("under").
  function coilAt(wall, t, style) {
    const out = 0.14;
    const z0 = t.z;
    const at = (a, z) => P(...onWall(wall, along(wall, t.u, a), z, out));
    const ring = (a, z, r) => "M" + Array.from({ length: 33 }, (_, k) => {
      const q = (k / 32) * Math.PI * 2;
      return P(...onWall(wall, along(wall, t.u, a + r * Math.cos(q)), z + r * 1.05 * Math.sin(q), out)).map(f1).join(" ");
    }).join(" L") + "Z";
    const line = (p, q, c) => `M${f1(p[0])} ${f1(p[1])} C${f1(c[0])} ${f1(c[1])} ${f1(c[2])} ${f1(c[3])} ${f1(q[0])} ${f1(q[1])}`;
    if (style === "under") {
      const coil = [0, 1, 2].map((j) => ring(0.18, z0 - 0.29 - 0.02 * j, 0.25 - 0.02 * j)).join(" ");
      const D = at(0.34, z0 - 0.11);
      const E = at(0.38, z0 - 0.45);
      const F = at(0.39, z0 - 0.69);
      return `${rubber(coil, 3.8)}
        ${rubber(line(D, E, [D[0] + 2, D[1] + 4, E[0] - 1, E[1] - 4]))}
        <path d="M${f1(E[0])} ${f1(E[1])} L${f1(F[0])} ${f1(F[1])}" stroke="#14171C" stroke-width="7" stroke-linecap="round"/>
        <circle cx="${f1(E[0])}" cy="${f1(E[1] + 1)}" r="3.2" fill="none" stroke-width="1.6" class="cs-ring-led"/>`;
    }
    // Beside it: to the right when there is room on the wall, else to the left.
    const end = wall.kind === "S" ? wall.u1 : wall.u0;
    const roomRight = wall.kind === "S" ? end - along(wall, t.u, 1.38) : along(wall, t.u, 1.38) - end;
    const cx = roomRight >= 0 ? 1.03 : -0.68;
    const side = cx > 0 ? -0.28 : 0.28;
    const coil = [0, 1, 2].map((j) => ring(cx + 0.045 * j, z0 + 0.35 - 0.02 * j, 0.3 - 0.02 * j)).join(" ");
    const A = P(...onWall(wall, along(wall, t.u, 0.18), z0 - 0.03, 0.15));
    const Q = at(cx + side, z0 + 0.21);
    const D = at(cx + 0.18, z0 + 0.07);
    const E = at(cx + 0.22, z0 - 0.29);
    const F = at(cx + 0.23, z0 - 0.53);
    const K = at(cx, z0 + 0.67);
    return `<path d="M${f1(K[0] - 3)} ${f1(K[1] - 2)} h6 v6 h-6z" fill="#2A2F37"/>
      ${rubber(line(A, Q, [A[0], A[1] + 16, Q[0] + (side < 0 ? -8 : 8), Q[1] + 14]))}
      ${rubber(coil, 3.8)}
      ${rubber(line(D, E, [D[0] + 2, D[1] + 4, E[0] - 1, E[1] - 4]))}
      <path d="M${f1(E[0])} ${f1(E[1])} L${f1(F[0])} ${f1(F[1])}" stroke="#14171C" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${f1(E[0])}" cy="${f1(E[1] + 1)}" r="3.2" fill="none" stroke-width="1.6" class="cs-ring-led"/>`;
  }
  // Where a charger's cable leaves it, on the screen.
  const plugFrom = (wall, t) => P(...onWall(wall, along(wall, t.u, 0.18), t.z - 0.03, 0.15));

  // Solar panels in a grid on a roof: each cell that is on is a panel.
  function drawCells(roof, cells) {
    let s = "";
    for (const [c, r] of cells || []) {
      if (c >= roof.cols || r >= roof.rows) continue;
      s += rpoly(roof.quad(c, r), "panel", 'stroke-width=".8"');
    }
    if ((cells || []).length && roof.sheen) s += `<polygon class="cs-sheen" points="${pts(roof.sheen)}" fill="url(#cs-sheen)"/>`;
    return s;
  }

  /* ------------------------------------------------------------ wires the picture draws itself */

  const near = (a, b) => Math.abs(a - b) < 0.005;
  const same = (p, q) => near(p[0], q[0]) && near(p[1], q[1]) && near(p[2], q[2]);
  // How many coordinates two points differ in.
  const axes = (p, q) => [0, 1, 2].filter((k) => !near(p[k], q[k]));
  // No point twice in a row, and none in the middle of a straight stretch.
  function simplify(points) {
    const out = [];
    for (const p of points) if (!out.length || !same(out[out.length - 1], p)) out.push(p);
    for (let i = out.length - 2; i >= 1; i -= 1) {
      const a = out[i - 1];
      const b = out[i];
      const c = out[i + 1];
      const ab = axes(a, b);
      const bc = axes(b, c);
      if (ab.length === 1 && bc.length === 1 && ab[0] === bc[0] && Math.sign(b[ab[0]] - a[ab[0]]) === Math.sign(c[ab[0]] - b[ab[0]])) out.splice(i, 1);
    }
    return out;
  }
  // From p to q one coordinate at a time: down first when leaving something high, up last when arriving.
  function elbow(p, q) {
    const out = [];
    let c = [...p];
    for (const k of p[2] > q[2] + 0.01 ? [2, 1, 0] : [1, 0, 2]) {
      if (near(c[k], q[k])) continue;
      c = [...c];
      c[k] = q[k];
      out.push(c);
    }
    out.pop();
    return out;
  }
  // A wire someone drew, fixed to where its ends are now.
  function attach(points, start, end) {
    const mid = points.slice(1, -1).map((p) => [...p]);
    const out = [start];
    for (const p of mid) {
      if (axes(out[out.length - 1], p).length > 1) out.push(...elbow(out[out.length - 1], p));
      out.push(p);
    }
    if (axes(out[out.length - 1], end).length > 1) out.push(...elbow(out[out.length - 1], end));
    out.push(end);
    return simplify(out);
  }

  // Does a straight stretch on the ground run through a house?
  function crosses(p, q, rects) {
    for (const [x0, y0, x1, y1] of rects) {
      const ax = Math.min(p[0], q[0]);
      const bx = Math.max(p[0], q[0]);
      const ay = Math.min(p[1], q[1]);
      const by = Math.max(p[1], q[1]);
      if (Math.min(bx, x1 - 0.01) > Math.max(ax, x0 + 0.01) - 1e-9 && Math.min(by, y1 - 0.01) > Math.max(ay, y0 + 0.01) - 1e-9) return true;
    }
    return false;
  }
  // Along the ground from a to b (each a point at the foot of a wall, with the way out from it), round the houses.
  function groundPath(rects, a, na, b, nb, lane) {
    const A = na ? [a[0] + na[0] * lane, a[1] + na[1] * lane] : [a[0], a[1]];
    const B = nb ? [b[0] + nb[0] * lane, b[1] + nb[1] * lane] : [b[0], b[1]];
    const fy = Math.max(A[1], B[1]);
    const fx = Math.max(A[0], B[0]);
    const my = Math.max(...rects.map((r) => r[3])) + 0.6;
    const mx = Math.max(...rects.map((r) => r[2])) + 0.6;
    const ways = [
      [A, [B[0], A[1]], B],
      [A, [A[0], B[1]], B],
      [A, [A[0], fy], [B[0], fy], B],
      [A, [fx, A[1]], [fx, B[1]], B],
      [A, [A[0], my], [B[0], my], B],
      [A, [mx, A[1]], [mx, B[1]], B],
      [A, [A[0], my], [mx, my], [mx, B[1]], B],
      [A, [mx, A[1]], [mx, my], [B[0], my], B],
    ];
    const length = (w) => w.slice(1).reduce((t, p, i) => t + Math.abs(p[0] - w[i][0]) + Math.abs(p[1] - w[i][1]), 0);
    const clear = ways.filter((w) => w.slice(1).every((p, i) => !crosses(w[i], p, rects)));
    const way = (clear.length ? clear : ways).sort((x, y) => length(x) - length(y))[0];
    return way.map(([x, y]) => [x, y, 0.02]);
  }

  /* ------------------------------------------------------------ the classic house: a house with a flat-roofed garage */

  const CLASSIC = (() => {
    // The house, the garage, where the cars stand and where the chargers hang.
    const HOUSE = { x0: 6, x1: 14, y0: 2, y1: 8.6, h: 3.2, ridge: 5.75, over: 0.45, gable: 0.35 };
    const GARAGE = { x0: -1.4, x1: 6, y0: 4.4, y1: 9.8, h: 2.65 };
    const SLOTS = [{ x: -0.9, y: 10.3 }, { x: 3.05, y: 10.3 }];
    const BOX = [{ x: 1.45 }, { x: 5.4 }];

    // The walls things can hang on: the garage's front, the house's front, the house's gable.
    const WALLS = {
      s1: { kind: "S", c: GARAGE.y1, u0: GARAGE.x0 + 0.05, u1: GARAGE.x1 - 0.05, top: GARAGE.h - 0.3 },
      s2: { kind: "S", c: HOUSE.y1, u0: HOUSE.x0 + 0.05, u1: HOUSE.x1 - 0.05, top: 2.4 },
      e1: { kind: "E", c: HOUSE.x1, u0: HOUSE.y0 + 0.05, u1: HOUSE.y1 - 0.05, top: HOUSE.h - 0.4 },
    };
    const BATTERY = [0.8, 1.65, 0.32];
    const DEFAULTS = {
      gateway: { w: "s2", u: 9.4, z: 1.05 },
      battery: { w: "s2", u: 8.15, z: 0 },
      charger0: { w: "s1", u: BOX[0].x, z: 0.95 },
      charger1: { w: "s1", u: BOX[1].x, z: 0.95 },
      heat: { x: 14.55, y: 7.55 },
    };

    const ROOF = (() => {
      const Hh = HOUSE;
      const ym = (Hh.y0 + Hh.y1) / 2;
      const pitch = (Hh.ridge - Hh.h) / (ym - Hh.y0);
      const eave = Hh.h - Hh.over * pitch;
      // A point on the south roof: x along it, k from the eave (0) to the ridge (1).
      const at = (x, k, lift = 0.03) => [x, Hh.y1 + Hh.over + (ym - Hh.y1 - Hh.over) * k, eave + (Hh.ridge - eave) * k + lift];
      return { ym, eave, at, edge: 0.18 };
    })();

    // Where solar panels can lie: a grid on the house's roof and one on the garage's flat roof.
    const ROOFS = {
      roof: {
        cols: 7,
        rows: 4,
        def: [1, 2, 3].flatMap((r) => [0, 1, 2, 3, 4, 5, 6].map((c) => [c, r])),
        colX: (c) => 5.8 + 1.2 * (c + 0.5),
        quad: (c, r) => {
          const a = 5.8 + 1.2 * c + 0.04;
          const b = 5.8 + 1.2 * (c + 1) - 0.04;
          const t0 = 0.08 + 0.21 * r + 0.015;
          const t1 = 0.08 + 0.21 * (r + 1) - 0.015;
          return [ROOF.at(a, t0), ROOF.at(b, t0), ROOF.at(b, t1), ROOF.at(a, t1)];
        },
        // The lowest row is nearest the edge; the wire goes from there down over the edge to the house's front.
        prefer: "low",
        down: (c, r) => {
          const x = 5.8 + 1.2 * (c + 0.5);
          const { at, eave, edge } = ROOF;
          const z = eave - edge - HOUSE.over / 2 - 0.05;
          return { wall: "s2", u: x - HOUSE.over, z, points: [at(x, 0.08 + 0.21 * r + 0.015), at(x, 0), [x, HOUSE.y1 + HOUSE.over + 0.01, eave - edge], [x - HOUSE.over, HOUSE.y1 + 0.02, z]] };
        },
      },
      garage: {
        cols: 6,
        rows: 4,
        def: [],
        colX: (c) => GARAGE.x0 + 0.2 + (7 / 6) * (c + 0.5),
        quad: (c, r) => {
          const z = GARAGE.h + 0.22;
          const a = GARAGE.x0 + 0.2 + (7 / 6) * c + 0.05;
          const b = GARAGE.x0 + 0.2 + (7 / 6) * (c + 1) - 0.05;
          const y0 = GARAGE.y0 + 0.25 + 1.2 * r + 0.05;
          const y1 = GARAGE.y0 + 0.25 + 1.2 * (r + 1) - 0.05;
          return [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]];
        },
        // The front row is nearest the edge; the wire goes over the rim and down the garage's front.
        prefer: "high",
        down: (c, r) => {
          const x = GARAGE.x0 + 0.2 + (7 / 6) * (c + 0.5);
          const h = GARAGE.h;
          return { wall: "s1", u: x - 0.11, z: h - 0.13, points: [[x, GARAGE.y0 + 0.25 + 1.2 * (r + 1) - 0.05, h + 0.22], [x, GARAGE.y1 + 0.13, h + 0.22], [x, GARAGE.y1 + 0.13, h - 0.02], [x - 0.11, GARAGE.y1 + 0.02, h - 0.13]] };
        },
      },
    };

    function scene(m, pos) {
      const Hh = HOUSE;
      const G = GARAGE;
      const { ym, eave, at, edge } = ROOF;
      let s = "";
      // The drive and the path.
      s += rpoly([[G.x0, G.y1, 0], [G.x1, G.y1, 0], [G.x1, 15.6, 0], [G.x0, 15.6, 0]], "drive");
      s += rpoly([[9.0, Hh.y1, 0], [10.4, Hh.y1, 0], [10.4, 15.2, 0], [9.0, 15.2, 0]], "drive");
      // One big soft shadow under the house and the garage, darker where the walls meet the ground.
      s += `<polygon points="${pts([[G.x0 - 0.3, G.y0 - 0.6, 0], [Hh.x1 + 1.6, Hh.y0 - 0.8, 0], [Hh.x1 + 1.9, Hh.y1 + 0.6, 0], [G.x1, G.y1 + 0.5, 0], [G.x0 - 0.3, G.y1 + 0.4, 0]])}" ${R("shadow", 'filter="url(#cs-shadow)"')}/>`;
      for (const [a, b] of [[[G.x0, G.y1, 0], [G.x1, G.y1, 0]], [[G.x1, G.y1, 0], [G.x1, G.y0, 0]], [[Hh.x0, Hh.y1, 0], [Hh.x1, Hh.y1, 0]], [[Hh.x1, Hh.y1, 0], [Hh.x1, Hh.y0, 0]]]) {
        s += `<path d="${path3([a, b])}" ${R("shadowLine", 'stroke-width="7" stroke-linecap="round" filter="url(#cs-blur)" fill="none"')}/>`;
      }
      s += tree(-3.4, 2.4, 1) + tree(-2.2, 1.2, 0.75) + tree(19.2, 7.6, 0.85);
      // The garage: grey walls, a white flat roof with a rim, the roof's shadow under it.
      s += rpoly([[G.x0, G.y1, 0], [G.x1, G.y1, 0], [G.x1, G.y1, G.h], [G.x0, G.y1, G.h]], "wallS");
      s += rpoly([[G.x1, G.y1, 0], [G.x1, G.y0, 0], [G.x1, G.y0, G.h], [G.x1, G.y1, G.h]], "wallE");
      s += rpoly([[-0.9, G.y1 + 0.01, 0], [5.1, G.y1 + 0.01, 0], [5.1, G.y1 + 0.01, 2.15], [-0.9, G.y1 + 0.01, 2.15]], "door");
      for (let k = 1; k < 5; k += 1) s += `<path d="${path3([[-0.9, G.y1 + 0.02, k * 0.43], [5.1, G.y1 + 0.02, k * 0.43]])}" ${R("line", 'stroke-width=".8" stroke-opacity=".5"')}/>`;
      s += eaveShadow([G.x0, G.y1 + 0.003, G.h - 0.24], [G.x1, G.y1 + 0.003, G.h - 0.24], 0.7);
      s += eaveShadow([G.x1 + 0.003, G.y1, G.h - 0.24], [G.x1 + 0.003, G.y0, G.h - 0.24], 0.7);
      s += rpoly([[G.x0 - 0.12, G.y0 - 0.12, G.h + 0.16], [G.x1 + 0.12, G.y0 - 0.12, G.h + 0.16], [G.x1 + 0.12, G.y1 + 0.12, G.h + 0.16], [G.x0 - 0.12, G.y1 + 0.12, G.h + 0.16]], "flat");
      s += rpoly([[G.x0 + 0.15, G.y0 + 0.15, G.h + 0.161], [G.x1 - 0.12, G.y0 + 0.15, G.h + 0.161], [G.x1 - 0.12, G.y1 - 0.12, G.h + 0.161], [G.x0 + 0.15, G.y1 - 0.12, G.h + 0.161]], "roofEdge", 'opacity=".55"');
      s += rpoly([[G.x0 - 0.12, G.y1 + 0.12, G.h], [G.x1 + 0.12, G.y1 + 0.12, G.h], [G.x1 + 0.12, G.y1 + 0.12, G.h + 0.16], [G.x0 - 0.12, G.y1 + 0.12, G.h + 0.16]], "roofEdge");
      s += rpoly([[G.x1 + 0.12, G.y1 + 0.12, G.h], [G.x1 + 0.12, G.y0 - 0.12, G.h], [G.x1 + 0.12, G.y0 - 0.12, G.h + 0.16], [G.x1 + 0.12, G.y1 + 0.12, G.h + 0.16]], "roofEdge", 'style="filter:brightness(.92)"');
      if (m.solar) s += drawCells(ROOFS.garage, pos.cells.garage);
      // The house: the back of the roof, the walls, the windows, the roof's shadow, the roof.
      s += rpoly([[Hh.x0 - Hh.gable, Hh.y0 - Hh.over, eave], [Hh.x1 + Hh.gable, Hh.y0 - Hh.over, eave], [Hh.x1 + Hh.gable, ym, Hh.ridge], [Hh.x0 - Hh.gable, ym, Hh.ridge]], "roofBack");
      s += rpoly([[Hh.x0, Hh.y1, 0], [Hh.x1, Hh.y1, 0], [Hh.x1, Hh.y1, Hh.h], [Hh.x0, Hh.y1, Hh.h]], "wallS");
      s += rpoly([[Hh.x1, Hh.y1, 0], [Hh.x1, Hh.y0, 0], [Hh.x1, Hh.y0, Hh.h], [Hh.x1, ym, Hh.ridge], [Hh.x1, Hh.y1, Hh.h]], "wallE");
      s += windowX(Hh.x1 + 0.01, 3.2, 7.4, 0.7, 4.0, 2, 3);
      s += windowY(11.0, 13.4, Hh.y1 + 0.01, 0.75, 2.6, 2);
      s += windowY(6.55, 7.45, Hh.y1 + 0.01, 0.02, 2.25);
      s += eaveShadow([Hh.x0, Hh.y1 + 0.02, eave - edge - Hh.over / 2 - 0.02], [Hh.x1, Hh.y1 + 0.02, eave - edge - Hh.over / 2 - 0.02], 0.9);
      s += eaveShadow([Hh.x1 + 0.02, Hh.y1, Hh.h - 0.4], [Hh.x1 + 0.02, ym, Hh.ridge - 0.4], 0.8) + eaveShadow([Hh.x1 + 0.02, ym, Hh.ridge - 0.4], [Hh.x1 + 0.02, Hh.y0, Hh.h - 0.4], 0.8);
      // A home battery on a wall, and the heat pump.
      if (m.battery) s += `<g class="cs-thing" data-thing="battery">${drawBattery(WALLS[pos.battery.w], pos.battery, BATTERY, m.battery.soc)}</g>`;
      if (m.heat) s += `<g class="cs-thing" data-thing="heat">${drawHeat(pos.heat, "S")}</g>`;
      // The roof: the lightest surface, with a thick white edge.
      s += rpoly([[Hh.x0 - Hh.gable, Hh.y1 + Hh.over, eave], [Hh.x1 + Hh.gable, Hh.y1 + Hh.over, eave], [Hh.x1 + Hh.gable, ym, Hh.ridge], [Hh.x0 - Hh.gable, ym, Hh.ridge]], "roof");
      if (m.solar) s += drawCells(ROOFS.roof, pos.cells.roof);
      s += rpoly([[Hh.x0 - Hh.gable, Hh.y1 + Hh.over, eave], [Hh.x1 + Hh.gable, Hh.y1 + Hh.over, eave], [Hh.x1 + Hh.gable, Hh.y1 + Hh.over, eave - edge], [Hh.x0 - Hh.gable, Hh.y1 + Hh.over, eave - edge]], "roofEdge");
      s += rpoly([[Hh.x1 + Hh.gable, Hh.y1 + Hh.over, eave], [Hh.x1 + Hh.gable, ym, Hh.ridge], [Hh.x1 + Hh.gable, ym, Hh.ridge - 0.2], [Hh.x1 + Hh.gable, Hh.y1 + Hh.over, eave - 0.2]], "roofEdge", 'style="filter:brightness(.95)"');
      s += rpoly([[Hh.x1 + Hh.gable, ym, Hh.ridge], [Hh.x1 + Hh.gable, Hh.y0 - Hh.over, eave], [Hh.x1 + Hh.gable, Hh.y0 - Hh.over, eave - 0.2], [Hh.x1 + Hh.gable, ym, Hh.ridge - 0.2]], "roofEdge", 'style="filter:brightness(.9)"');
      s += `<path d="${path3([[Hh.x0 - Hh.gable, ym, Hh.ridge + 0.02], [Hh.x1 + Hh.gable, ym, Hh.ridge + 0.02]])}" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>`;
      // Light from the windows on the ground, and the lamps by the doors.
      LIGHTS.push(`<polygon points="${pts([[Hh.x1, 3.2, 0], [Hh.x1, 7.4, 0], [Hh.x1 + 2.6, 7.9, 0], [Hh.x1 + 2.6, 2.7, 0]])}" fill="#FFC86B" opacity=".28" filter="url(#cs-shadow)"/>`);
      LIGHTS.push(`<polygon points="${pts([[11.0, Hh.y1, 0], [13.4, Hh.y1, 0], [13.9, Hh.y1 + 2.3, 0], [10.5, Hh.y1 + 2.3, 0]])}" fill="#FFC86B" opacity=".28" filter="url(#cs-shadow)"/>`);
      for (const [x, y, z, rx] of [[5.5, G.y1, 2.3, 22], [7.85, Hh.y1, 2.4, 20]]) {
        const [lx, ly] = P(x, y, z);
        LIGHTS.push(`<ellipse cx="${f1(lx)}" cy="${f1(ly + 28)}" rx="${rx}" ry="${f1(rx * 0.55)}" fill="#FFC86B" opacity=".35" filter="url(#cs-glowf)"/><circle cx="${f1(lx)}" cy="${f1(ly)}" r="2.6" fill="#FFE2A8"/>`);
      }
      return s;
    }

    // Where the current runs, each wire drawn the way the current usually goes: from the sun and the grid into
    // the box, and out to the chargers, the heat pump and the battery.
    function routes(m, boxes) {
      const W = HOUSE.y1 + 0.02;
      const { at, eave, edge } = ROOF;
      const r = { grid: [[16.5, 11.6, 0.02], [9.65, 11.6, 0.02], [9.65, W, 0.02], [9.65, W, 1.05]] };
      // Straight up the wall from the box and over the roof's edge to the panels.
      const up = 9.65 + HOUSE.over;
      if (m.solar) r.sun = [at(up, 0.16), at(up, 0), [up, HOUSE.y1 + HOUSE.over + 0.01, eave - edge], [9.65, W, eave - edge - HOUSE.over / 2 - 0.05], [9.65, W, 1.65]];
      // Out of the box to the right, down, out from the wall and along to the heat pump.
      if (m.heat) r.heat = [[9.9, W, 1.35], [10.6, W, 1.35], [10.6, W, 0.02], [10.6, 9.25, 0.02], [15.25, 9.25, 0.02], [15.25, 8.12, 0.02], [15.25, 8.12, 0.3]];
      if (m.battery) r.battery = [[9.4, W, 1.5], [8.96, W, 1.5]];
      // Out of the box to the left, down to the ground and along the garage to each charger (beside a battery, straight down).
      const [left, z] = m.battery ? [9.12, 1.2] : [8.3, 1.35];
      boxes.forEach((_, i) => {
        const x = BOX[i].x + 0.18;
        r[`car${i}`] = [[9.4, W, z], [left, W, z], [left, W, 0.02], [left, 9.95, 0.02], [x, 9.95, 0.02], [x, GARAGE.y1 + 0.15, 0.02], [x, GARAGE.y1 + 0.15, 0.95]];
      });
      return r;
    }

    // Where each car stands: in front of its charger. With two chargers, the middle one's car to the left and the
    // corner one's to the right; with one, its car to the right and another car to the left.
    function placeCars(m) {
      const n = Math.min(2, m.chargers.length);
      const taken = [false, false];
      const boxes = [false, false];
      const out = m.cars.slice(0, 2).map((c) => ({ car: c, box: c.charger != null && c.charger < n ? c.charger : null, slot: null }));
      // Two cars cannot share a charger: the first one has it.
      for (const o of out) {
        if (o.box === null) continue;
        if (boxes[o.box]) o.box = null;
        else boxes[o.box] = true;
      }
      // A car with a place of its own (left or right, chosen on its page) stands there.
      for (const o of out) {
        const spot = o.car.spot;
        if ((spot === 0 || spot === 1) && !taken[spot]) {
          o.slot = spot;
          taken[spot] = true;
        }
      }
      // The others in front of their charger, or where there is room.
      for (const o of out) {
        if (o.slot !== null || o.box === null) continue;
        const slot = n === 2 ? o.box : 1;
        if (!taken[slot]) {
          o.slot = slot;
          taken[slot] = true;
        }
      }
      for (const o of out) {
        if (o.slot !== null) continue;
        o.slot = taken[1] ? 0 : 1;
        taken[o.slot] = true;
      }
      return out;
    }

    const anchors = (m, placed) => {
      const a = { home: [12.2, HOUSE.y1 + 0.01, 2.2], grid: [16.5, 11.6, 0.1] };
      if (m.solar) a.sun = [10.4, 7.0, 4.2];
      if (m.battery) a.battery = [8.55, HOUSE.y1 + 0.3, 1.9];
      if (m.heat) a.heat = [15.25, 7.8, 1.1];
      (placed || []).forEach((p, i) => {
        const b = BODIES[p.car.body] || BODIES.sedan;
        a[`car${i}`] = [SLOTS[p.slot].x + b.Wd * 0.3, SLOTS[p.slot].y + b.L * 0.95, 0]; // in the drive, in front of the car
      });
      return a;
    };

    const corners = (m) => {
      const list = [[-1.4, 4.4, 0], [-1.4, 15.4, 0], [5.4, 15.4, 0], [14.2, 2, 0], [14.6, 8.9, 0], [6, 2, 5.9], [14.3, 5.3, 5.9], [-1.4, 4.4, 3], [16.5, 11.6, 0]];
      if (m.heat) list.push([16.4, 8.4, 0]);
      return list;
    };
    return {
      SLOTS, BOX, scene, routes, placeCars, anchors, corners,
      walls: WALLS, defaults: DEFAULTS, roofs: ROOFS, battery: BATTERY, heatFace: "S", coil: "side", street: [16.5, 11.6],
      footprints: [[HOUSE.x0, HOUSE.y0, HOUSE.x1, HOUSE.y1], [GARAGE.x0, GARAGE.y0, GARAGE.x1, GARAGE.y1]],
      area: [-3, -1, 19, 15],
      ground: [7, 9, 430, 200],
      stars: [[30, 30], [90, 75], [150, 15], [210, 50], [400, 4], [470, 40], [540, 14], [600, 70], [660, 25], [690, 110], [640, 150]],
    };
  })();

  /* ------------------------------------------------------------ the angle house: two wings under one roof */

  const ANGLE = (() => {
    // Marielystvej 50 after HusCompagniet's drawings (case 703981): an L of two wings under one roof of 25°.
    // x runs west and y north, in metres, so the garage's corner is the one nearest.
    const NW = { x0: 0, x1: 21.35, y0: 10.68, y1: 19.19 };   // the wing along the road: garage, utility, hall, rooms
    const EW = { x0: 0, x1: 8.51, y0: 0, y1: 19.19 };        // the wing towards the garden: living room, bedrooms
    const RF = { e: 2.63, r: 4.84, o: 0.5, g: 0.3, edge: 0.18 };
    RF.pitch = (RF.r - RF.e) / ((NW.y1 - NW.y0) / 2 + RF.o);
    RF.wall = RF.e + RF.o * RF.pitch;
    const YM = (NW.y0 + NW.y1) / 2;
    const XM = (EW.x0 + EW.x1) / 2;
    const WALL = NW.y1;
    const DOORS = [[15.05, 17.58], [18.11, 20.64]];
    const SLOTS = [{ x: 15.39, y: WALL + 0.75 }, { x: 18.45, y: WALL + 0.75 }];
    const BOX = [{ x: 17.66 }, { x: 20.82 }];
    const GATE = 14.35;

    // The walls things can hang on: the long wall towards the road, the garage's gable, the wall to the yard.
    const WALLS = {
      s1: { kind: "S", c: WALL, u0: NW.x0 + 0.05, u1: NW.x1 - 0.05, top: RF.e - RF.edge - 0.3 },
      e1: { kind: "E", c: NW.x1, u0: NW.y0 + 0.05, u1: WALL - 0.05, top: RF.wall - 0.35 },
      e2: { kind: "E", c: EW.x1, u0: 4.07, u1: NW.y0 - 0.05, top: RF.wall - 0.35 },
    };
    const BATTERY = [0.6, 1.5, 0.3];
    const DEFAULTS = {
      gateway: { w: "s1", u: GATE - 0.25, z: 1.05 },
      battery: { w: "s1", u: 10.98, z: 0 },
      charger0: { w: "s1", u: BOX[0].x, z: 0.95 },
      charger1: { w: "s1", u: BOX[1].x, z: 0.95 },
      heat: { x: 21.55, y: 13.1 },
    };

    // The four slopes. J is where the two ridges meet; the hip runs from there to the north-east corner,
    // the valley to the inner corner.
    const ROOF = (() => {
      const { e, r, o, g } = RF;
      const J = [XM, YM, r];
      const hip = [EW.x0 - o, NW.y1 + o, e];
      const valley = [EW.x1 + o, NW.y0 - o, e];
      const west = NW.x1 + g;
      const south = EW.y0 - g;
      return {
        J, hip, valley, west, south,
        north: [[west, NW.y1 + o, e], hip, J, [west, YM, r]],
        back: [J, [west, YM, r], [west, NW.y0 - o, e], valley],
        east: [hip, J, [XM, south, r], [EW.x0 - o, south, e]],
        yard: [J, valley, [EW.x1 + o, south, e], [XM, south, r]],
        // A point on the slope towards the south (where solar panels belong): x along it, k from eave to ridge.
        at: (x, k, lift = 0.03) => [x, NW.y0 - o + (YM - NW.y0 + o) * k, e + (r - e) * k + lift],
      };
    })();

    // Where solar panels can lie: a grid on the slope towards the south. The wire goes over the ridge and down to the road.
    const STEP = 10.2 / 9;
    const ROOFS = {
      roof: {
        cols: 10,
        rows: 2,
        def: [0, 1].flatMap((r) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => [c, r])),
        colX: (c) => 10.4 + STEP * (c - 1 + 0.5),
        quad: (c, r) => {
          const a = 10.4 + STEP * (c - 1) + 0.04;
          const b = 10.4 + STEP * c - 0.04;
          const t0 = 0.14 + 0.37 * r + 0.015;
          const t1 = 0.14 + 0.37 * (r + 1) - 0.015;
          return [ROOF.at(a, t0), ROOF.at(b, t0), ROOF.at(b, t1), ROOF.at(a, t1)];
        },
        prefer: "high",
        down: (c, r) => {
          const x = 10.4 + STEP * (c - 1 + 0.5);
          const { e, o, edge } = RF;
          const z = e - edge - 0.3;
          return { wall: "s1", u: x, z, points: [ROOF.at(x, 0.14 + 0.37 * (r + 1) - 0.015), [x, YM, RF.r + 0.03], [x, WALL + o, e + 0.03], [x, WALL + o + 0.01, e - edge], [x, WALL + 0.02, z]] };
        },
      },
    };

    function scene(m, pos) {
      const { e, r, o, edge, wall } = RF;
      const Rf = ROOF;
      let s = "";
      // The drive from the road to the garage, the path to the front door, the terrace in the yard.
      s += rpoly([[14.75, WALL, 0], [20.95, WALL, 0], [20.95, 26.2, 0], [14.75, 26.2, 0]], "drive");
      s += rpoly([[9.5, WALL, 0], [10.9, WALL, 0], [10.9, 21.6, 0], [14.75, 21.6, 0], [14.75, 23.0, 0], [9.5, 23.0, 0]], "drive");
      s += rpoly([[EW.x1, 0, 0], [11.3, 0, 0], [11.3, NW.y0, 0], [EW.x1, NW.y0, 0]], "drive");
      // One big soft shadow under the house, darker where the walls meet the ground.
      s += `<polygon points="${pts([[-0.6, -0.8, 0], [9.4, -0.8, 0], [9.4, 9.8, 0], [22.6, 10.0, 0], [22.4, 19.9, 0], [-0.6, 19.9, 0]])}" ${R("shadow", 'filter="url(#cs-shadow)"')}/>`;
      for (const [a, b] of [[[NW.x0, WALL, 0], [NW.x1, WALL, 0]], [[NW.x1, WALL, 0], [NW.x1, NW.y0, 0]], [[EW.x1, NW.y0, 0], [EW.x1, 4.02, 0]]]) {
        s += `<path d="${path3([a, b])}" ${R("shadowLine", 'stroke-width="7" stroke-linecap="round" filter="url(#cs-blur)" fill="none"')}/>`;
      }
      s += tree(-3.2, 6.5, 1) + tree(-2.6, 13.5, 0.8) + tree(13.5, 3.2, 0.9) + tree(24.6, 12.2, 0.85);
      // The wing towards the garden, the furthest first: its far slope, the covered terrace, the wall to the yard.
      s += rpoly(Rf.east, "roofFar");
      s += rpoly([[4.43, 4.02, 0.02], [EW.x1, 4.02, 0.02], [EW.x1, 0, 0.02], [4.43, 0, 0.02]], "flat");
      s += rpoly([[4.43, 4.02, 0], [4.43, 0, 0], [4.43, 0, wall], [4.43, 4.02, wall]], "wallE", 'style="filter:brightness(.86)"');
      s += windowX(4.44, 1.0, 2.0, 0.05, 2.2);
      LIGHTS.pop();
      s += eaveShadow([4.44, 4.02, e], [4.44, 0, e], 1.5);
      s += rpoly([[EW.x1 - 0.22, 0.22, 0], [EW.x1, 0.22, 0], [EW.x1, 0.22, e], [EW.x1 - 0.22, 0.22, e]], "wallS");
      s += rpoly([[EW.x1, 0.22, 0], [EW.x1, 0, 0], [EW.x1, 0, e], [EW.x1, 0.22, e]], "wallE");
      s += rpoly([[EW.x1, NW.y0, 0], [EW.x1, 4.02, 0], [EW.x1, 4.02, wall], [EW.x1, NW.y0, wall]], "wallE");
      s += windowX(EW.x1 + 0.01, 4.73, 6.78, 0.05, 2.2, 2, 2);
      s += windowX(EW.x1 + 0.01, 8.4, 10.45, 0.05, 2.2, 2, 2);
      LIGHTS.pop();
      s += eaveShadow([EW.x1 + 0.02, NW.y0, e - edge - 0.02], [EW.x1 + 0.02, 4.02, e - edge - 0.02], 0.8);
      LIGHTS.push(`<polygon points="${pts([[EW.x1, 4.6, 0], [EW.x1, 6.9, 0], [EW.x1 + 2.6, 7.3, 0], [EW.x1 + 2.6, 4.2, 0]])}" fill="#FFC86B" opacity=".28" filter="url(#cs-shadow)"/>`);
      s += rpoly(Rf.yard, "roofW");
      s += rpoly([Rf.valley, [EW.x1 + o, Rf.south, e], [EW.x1 + o, Rf.south, e - edge], [Rf.valley[0], Rf.valley[1], e - edge]], "roofEdge", 'style="filter:brightness(.92)"');
      // The wing along the road: its slope towards the south, with the panels.
      s += rpoly(Rf.back, "roofBack");
      if (m.solar) s += drawCells(ROOFS.roof, pos.cells.roof);
      s += `<path d="${path3([Rf.J, Rf.valley])}" ${R("shadowLine", 'stroke-width="3" stroke-linecap="round" filter="url(#cs-blur-s)" fill="none"')}/>`;
      // Its walls: the long one towards the road and the garage's gable.
      s += rpoly([[NW.x0, WALL, 0], [NW.x1, WALL, 0], [NW.x1, WALL, wall], [NW.x0, WALL, wall]], "wallS");
      s += rpoly([[NW.x1, WALL, 0], [NW.x1, NW.y0, 0], [NW.x1, NW.y0, wall], [NW.x1, YM, r - 0.12], [NW.x1, WALL, wall]], "wallE");
      for (const [a, b] of DOORS) {
        s += rpoly([[a, WALL + 0.01, 0], [b, WALL + 0.01, 0], [b, WALL + 0.01, 2.12], [a, WALL + 0.01, 2.12]], "door");
        for (let k = 1; k < 4; k += 1) s += `<path d="${path3([[a, WALL + 0.02, k * 0.53], [b, WALL + 0.02, k * 0.53]])}" ${R("line", 'stroke-width=".8" stroke-opacity=".5"')}/>`;
      }
      s += windowY(11.69, 13.62, WALL + 0.01, 0.93, 2.19, 2);
      s += rpoly([[9.53, WALL + 0.01, 0.02], [10.5, WALL + 0.01, 0.02], [10.5, WALL + 0.01, 2.19], [9.53, WALL + 0.01, 2.19]], "door");
      s += windowY(10.5, 10.86, WALL + 0.01, 0.02, 2.19);
      s += windowY(6.65, 8.58, WALL + 0.01, 0.93, 2.19, 2);
      s += windowY(1.91, 3.84, WALL + 0.01, 0.93, 2.19, 2);
      s += windowX(NW.x1 + 0.01, 16.37, 17.88, 1.6, 2.19);
      s += windowX(NW.x1 + 0.01, 13.79, 15.3, 1.6, 2.19);
      s += rpoly([[NW.x1 + 0.01, 12.84, 0.02], [NW.x1 + 0.01, 11.81, 0.02], [NW.x1 + 0.01, 11.81, 2.19], [NW.x1 + 0.01, 12.84, 2.19]], "door", 'style="filter:brightness(.92)"');
      s += eaveShadow([NW.x0, WALL + 0.02, e - edge - 0.02], [NW.x1, WALL + 0.02, e - edge - 0.02], 0.9);
      s += eaveShadow([NW.x1 + 0.02, WALL, wall - 0.3], [NW.x1 + 0.02, YM, r - 0.42], 0.7) + eaveShadow([NW.x1 + 0.02, YM, r - 0.42], [NW.x1 + 0.02, NW.y0, wall - 0.3], 0.7);
      // A home battery on a wall (by default between the utility room's window and the front door), and the heat pump.
      if (m.battery) s += `<g class="cs-thing" data-thing="battery">${drawBattery(WALLS[pos.battery.w], pos.battery, BATTERY, m.battery.soc)}</g>`;
      if (m.heat) s += `<g class="cs-thing" data-thing="heat">${drawHeat(pos.heat, "E")}</g>`;
      // The slope towards the road: the lightest surface, with a thick white edge.
      s += rpoly(Rf.north, "roof");
      s += rpoly([[Rf.west, WALL + o, e], Rf.hip, [Rf.hip[0], Rf.hip[1], e - edge], [Rf.west, WALL + o, e - edge]], "roofEdge");
      s += rpoly([[Rf.west, WALL + o, e], [Rf.west, YM, r], [Rf.west, YM, r - 0.2], [Rf.west, WALL + o, e - 0.2]], "roofEdge", 'style="filter:brightness(.95)"');
      s += rpoly([[Rf.west, YM, r], [Rf.west, NW.y0 - o, e], [Rf.west, NW.y0 - o, e - 0.2], [Rf.west, YM, r - 0.2]], "roofEdge", 'style="filter:brightness(.9)"');
      s += `<path d="${path3([[Rf.west, YM, r + 0.02], [XM, YM, r + 0.02], [XM, Rf.south, r + 0.02]])}" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" fill="none" stroke-linejoin="round"/>`;
      s += `<path d="${path3([Rf.J, Rf.hip])}" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" fill="none"/>`;
      // Light from the windows on the ground, and the lamps by the doors.
      for (const [a, b] of [[11.69, 13.62], [6.65, 8.58], [1.91, 3.84]]) {
        LIGHTS.push(`<polygon points="${pts([[a, WALL, 0], [b, WALL, 0], [b + 0.4, WALL + 2.2, 0], [a - 0.4, WALL + 2.2, 0]])}" fill="#FFC86B" opacity=".26" filter="url(#cs-shadow)"/>`);
      }
      for (const [x, y, z, rx] of [[17.845, WALL, 2.35, 24], [11.15, WALL, 2.35, 20]]) {
        const [lx, ly] = P(x, y, z);
        LIGHTS.push(`<ellipse cx="${f1(lx)}" cy="${f1(ly + 30)}" rx="${rx}" ry="${f1(rx * 0.55)}" fill="#FFC86B" opacity=".35" filter="url(#cs-glowf)"/><circle cx="${f1(lx)}" cy="${f1(ly)}" r="2.6" fill="#FFE2A8"/>`);
      }
      return s;
    }

    // Where the current runs: from the road and the panels into the box, and out to the chargers, the heat pump and the battery.
    function routes(m, boxes) {
      const W = WALL + 0.02;
      const { e, r, o, edge } = RF;
      const out = { grid: [[GATE, 26.2, 0.02], [GATE, W, 0.02], [GATE, W, 1.05]] };
      if (m.solar) out.sun = [ROOF.at(GATE, 0.3), [GATE, YM, r + 0.03], [GATE, WALL + o, e + 0.03], [GATE, WALL + o + 0.01, e - edge], [GATE, W, e - edge - 0.3], [GATE, W, 1.65]];
      if (m.heat) out.heat = [[GATE + 0.25, W, 1.5], [GATE + 0.42, W, 1.5], [GATE + 0.42, W, 0.02], [GATE + 0.42, 19.42, 0.02], [22.45, 19.42, 0.02], [22.45, 13.8, 0.02], [22.12, 13.8, 0.02], [22.12, 13.8, 0.3]];
      if (m.battery) out.battery = [[GATE - 0.25, W, 1.3], [GATE - 0.45, W, 1.3], [GATE - 0.45, W, 0.02], [GATE - 0.45, 19.62, 0.02], [11.28, 19.62, 0.02], [11.28, 19.52, 0.3]];
      boxes.forEach((_, i) => {
        const x = BOX[i].x + 0.18;
        out[`car${i}`] = [[GATE + 0.25, W, 1.25], [GATE + 0.55, W, 1.25], [GATE + 0.55, W, 0.02], [GATE + 0.55, 19.58, 0.02], [x, 19.58, 0.02], [x, WALL + 0.15, 0.02], [x, WALL + 0.15, 0.95]];
      });
      return out;
    }

    // Where each car stands: in front of its charger. The charger between the doors has its car at the left door,
    // the one by the corner at the right door; a car without a charger takes the door that is free.
    function placeCars(m) {
      const n = Math.min(2, m.chargers.length);
      const taken = [false, false];
      const boxes = [false, false];
      const out = m.cars.slice(0, 2).map((c) => ({ car: c, box: c.charger != null && c.charger < n ? c.charger : null, slot: null }));
      // Two cars cannot share a charger: the first one has it.
      for (const o of out) {
        if (o.box === null) continue;
        if (boxes[o.box]) o.box = null;
        else boxes[o.box] = true;
      }
      // A car with a place of its own (left or right, chosen on its page) stands there.
      for (const o of out) {
        const spot = o.car.spot;
        if ((spot === 0 || spot === 1) && !taken[spot]) {
          o.slot = spot;
          taken[spot] = true;
        }
      }
      // The others in front of their charger, or where there is room.
      for (const o of out) {
        if (o.slot !== null || o.box === null) continue;
        const slot = o.box;
        if (!taken[slot]) {
          o.slot = slot;
          taken[slot] = true;
        }
      }
      for (const o of out) {
        if (o.slot !== null) continue;
        o.slot = taken[0] ? 1 : 0;
        taken[o.slot] = true;
      }
      return out;
    }

    const anchors = (m, placed) => {
      const a = { home: [7.6, WALL + 0.01, 2.3], grid: [GATE, 26.2, 0.1] };
      if (m.solar) a.sun = [15.5, 12.6, 3.9];
      if (m.battery) a.battery = [11.28, WALL + 0.3, 1.6];
      if (m.heat) a.heat = [22.1, 13.8, 1.1];
      (placed || []).forEach((p, i) => {
        const b = BODIES[p.car.body] || BODIES.sedan;
        a[`car${i}`] = [SLOTS[p.slot].x + b.Wd * 0.3, SLOTS[p.slot].y + b.L * 0.95, 0];
      });
      return a;
    };
    const corners = () => [[-0.6, 19.9, 0], [-0.6, -0.4, 2.6], [4.3, -0.4, 5.0], [11.3, 0, 0], [22.6, 10, 0], [21.4, 26.3, 0], [14.3, 26.3, 0], [4.3, 15, 5.0], [21.7, 15, 5.0]];
    return {
      SLOTS, BOX, scene, routes, placeCars, anchors, corners,
      walls: WALLS, defaults: DEFAULTS, roofs: ROOFS, battery: BATTERY, heatFace: "E", coil: "under", street: [GATE, 26.2],
      footprints: [[NW.x0, NW.y0, NW.x1, NW.y1], [EW.x0, EW.y0, EW.x1, EW.y1]],
      area: [-2, -2, 25, 26],
      ground: [10, 13, 760, 400],
      stars: [[-60, 60], [20, 5], [110, 70], [190, -20], [300, 30], [420, -30], [520, 40], [640, -10], [760, 50], [860, 10], [930, 90], [-120, 150]],
    };
  })();

  /* ------------------------------------------------------------ houses built from a plan */

  // A house from its plan: wings (each a box with a roof), the drive, where the cars stand and where
  // things hang. Wings are given from the furthest to the nearest. The walls one sees are those
  // towards the road (S, at a wing's y1) and the gables to the right (E, at its x1).
  function planned(plan) {
    const O = 0.45;
    const EDGE = 0.16;
    const wings = plan.wings;
    const ridge = (w) => w.h + (w.roof.rise || 0);
    // A wing's roof: where its eaves and its ridge run.
    const lines = (w) => {
      const r = w.roof;
      const along = r.axis === "y" ? [w.y0, w.y1] : [w.x0, w.x1];
      const a = along[0] - (r.val0 ? 0 : O);
      const b = along[1] + (r.val1 ? 0 : O);
      return { a, b, ra: r.val0 ? along[0] - r.val0 : a + (r.hip0 || 0), rb: r.val1 ? along[1] + r.val1 : b - (r.hip1 || 0), z: ridge(w), xm: (w.x0 + w.x1) / 2, ym: (w.y0 + w.y1) / 2 };
    };
    const wood = (w) => (w.wood ? 'style="filter:sepia(.5) saturate(1.3) brightness(.9)"' : "");

    // The roofs solar panels can lie on: a grid of cells on a slope one sees, or on a flat roof.
    const ROOFS = {};
    if (plan.solar) {
      const { wing, face, a, b, rows = 2, k0 = 0.14, k1 = 0.88, wall } = plan.solar;
      const w = wings[wing];
      const cols = Math.max(1, Math.round((b - a) / 1.13));
      const step = (b - a) / cols;
      const band = (k1 - k0) / rows;
      const { xm, ym, z } = lines(w);
      const top = w.h - EDGE - 0.3;
      if (face === "S") {
        const at = (x, k, lift = 0.03) => [x, w.y1 + O - (w.y1 + O - ym) * k, w.h + (z - w.h) * k + lift];
        ROOFS.roof = {
          cols, rows, prefer: "low",
          def: Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_c, c) => [c, r])).flat(),
          colX: (c) => a + step * (c + 0.5),
          quad: (c, r) => [at(a + step * c + 0.04, k0 + band * r + 0.015), at(a + step * (c + 1) - 0.04, k0 + band * r + 0.015), at(a + step * (c + 1) - 0.04, k0 + band * (r + 1) - 0.015), at(a + step * c + 0.04, k0 + band * (r + 1) - 0.015)],
          down: (c, r) => {
            const x = a + step * (c + 0.5);
            return { wall, u: x, z: top, points: [at(x, k0 + band * r + 0.015), [x, w.y1 + O, w.h + 0.03], [x, w.y1 + O + 0.01, w.h - EDGE], [x, w.y1 + 0.02, top]] };
          },
        };
      } else if (face === "E") {
        const at = (y, k, lift = 0.03) => [w.x1 + O - (w.x1 + O - xm) * k, y, w.h + (z - w.h) * k + lift];
        ROOFS.roof = {
          cols, rows, prefer: "low",
          def: Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_c, c) => [c, r])).flat(),
          colX: () => w.x1,
          quad: (c, r) => [at(b - step * c - 0.04, k0 + band * r + 0.015), at(b - step * (c + 1) + 0.04, k0 + band * r + 0.015), at(b - step * (c + 1) + 0.04, k0 + band * (r + 1) - 0.015), at(b - step * c - 0.04, k0 + band * (r + 1) - 0.015)],
          down: (c, r) => {
            const y = b - step * (c + 0.5);
            return { wall, u: y, z: top, points: [at(y, k0 + band * r + 0.015), [w.x1 + O, y, w.h + 0.03], [w.x1 + O + 0.01, y, w.h - EDGE], [w.x1 + 0.02, y, top]] };
          },
        };
      } else {
        // A flat roof: the cells lie on it, in rows from the road and back.
        const depth = Math.min(1.75, (w.y1 - w.y0 - 1.2) / rows);
        const y = (r) => w.y1 - 0.6 - depth * r;
        const zf = w.h + 0.22;
        ROOFS.roof = {
          cols, rows, prefer: "low",
          def: Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_c, c) => [c, r])).flat(),
          colX: (c) => a + step * (c + 0.5),
          quad: (c, r) => [[a + step * c + 0.04, y(r) - 0.04, zf], [a + step * (c + 1) - 0.04, y(r) - 0.04, zf], [a + step * (c + 1) - 0.04, y(r + 1) + 0.04, zf], [a + step * c + 0.04, y(r + 1) + 0.04, zf]],
          down: (c, r) => {
            const x = a + step * (c + 0.5);
            return { wall, u: x, z: w.h - 0.5, points: [[x, y(r) - 0.04, zf], [x, w.y1 + 0.02, zf], [x, w.y1 + 0.02, w.h - 0.5]] };
          },
        };
      }
    }

    function drawWing(w, i, m, pos) { // eslint-disable-line no-unused-vars
      const r = w.roof;
      const flat = r.type === "flat";
      const { a, b, ra, rb, z, xm, ym } = flat ? { xm: 0, ym: 0 } : lines(w);
      const tint = wood(w);
      let s = "";
      // The slope one does not see much of, first.
      if (!flat && r.axis === "x") {
        s += rpoly([[a, w.y0 - O, w.h], [b, w.y0 - O, w.h], [rb, ym, z], [ra, ym, z]], "roofBack");
        if (r.hip0) s += rpoly([[a, w.y0 - O, w.h], [a, w.y1 + O, w.h], [ra, ym, z]], "roofFar");
      } else if (!flat) {
        s += rpoly([[w.x0 - O, a, w.h], [w.x0 - O, b, w.h], [xm, rb, z], [xm, ra, z]], "roofFar");
        if (r.hip0) s += rpoly([[w.x0 - O, a, w.h], [w.x1 + O, a, w.h], [xm, ra, z]], "roofBack");
      }
      // The walls, with a gable's point where the roof ends in one.
      const south = [[w.x0, w.y1, 0], [w.x1, w.y1, 0], [w.x1, w.y1, w.h]];
      if (!flat && r.axis === "y" && !r.hip1 && !r.val1) south.push([xm, w.y1, z - 0.12]);
      south.push([w.x0, w.y1, w.h]);
      s += rpoly(south, "wallS", tint);
      const east = [[w.x1, w.y1, 0], [w.x1, w.y0, 0], [w.x1, w.y0, w.h]];
      if (!flat && r.axis === "x" && !r.hip1 && !r.val1) east.push([w.x1, ym, z - 0.12]);
      east.push([w.x1, w.y1, w.h]);
      s += rpoly(east, "wallE", tint);
      if (w.wood) {
        // Boards on end.
        let d = "";
        for (let x = w.x0 + 0.5; x < w.x1; x += 0.5) d += path3([[x, w.y1 + 0.01, 0], [x, w.y1 + 0.01, w.h]]);
        for (let y = w.y0 + 0.5; y < w.y1; y += 0.5) d += path3([[w.x1 + 0.01, y, 0], [w.x1 + 0.01, y, w.h]]);
        s += `<path d="${d}" ${R("line", 'stroke-width=".7" stroke-opacity=".45" fill="none"')}/>`;
      }
      // Garage doors, doors and windows.
      for (const [x0, x1] of w.gates || []) {
        s += rpoly([[x0, w.y1 + 0.01, 0], [x1, w.y1 + 0.01, 0], [x1, w.y1 + 0.01, 2.12], [x0, w.y1 + 0.01, 2.12]], "door");
        for (let k = 1; k < 4; k += 1) s += `<path d="${path3([[x0, w.y1 + 0.02, k * 0.53], [x1, w.y1 + 0.02, k * 0.53]])}" ${R("line", 'stroke-width=".8" stroke-opacity=".5"')}/>`;
      }
      for (const [x0, x1, top = 2.15] of w.doors || []) s += rpoly([[x0, w.y1 + 0.01, 0.02], [x1, w.y1 + 0.01, 0.02], [x1, w.y1 + 0.01, top], [x0, w.y1 + 0.01, top]], "door");
      for (const [x0, x1, z0 = 0.93, z1 = 2.19, cols = 1] of w.winS || []) {
        s += windowY(x0, x1, w.y1 + 0.01, z0, z1, cols);
        if (z0 < 2.5) LIGHTS.push(`<polygon points="${pts([[x0, w.y1, 0], [x1, w.y1, 0], [x1 + 0.4, w.y1 + 2.2, 0], [x0 - 0.4, w.y1 + 2.2, 0]])}" fill="#FFC86B" opacity=".24" filter="url(#cs-shadow)"/>`);
      }
      for (const [y0, y1, z0 = 0.93, z1 = 2.19, cols = 1, rows = 1] of w.winE || []) s += windowX(w.x1 + 0.01, y0, y1, z0, z1, cols, rows);
      for (const [y0, y1, top = 2.15] of w.doorsE || []) s += rpoly([[w.x1 + 0.01, y1, 0.02], [w.x1 + 0.01, y0, 0.02], [w.x1 + 0.01, y0, top], [w.x1 + 0.01, y1, top]], "door", 'style="filter:brightness(.92)"');
      // The roof's shadow on the walls.
      if (flat || r.axis === "x") s += eaveShadow([w.x0, w.y1 + 0.02, w.h - (flat ? 0 : EDGE) - 0.02], [w.x1, w.y1 + 0.02, w.h - (flat ? 0 : EDGE) - 0.02], flat ? 0.35 : 0.9);
      if (flat || r.axis === "y") s += eaveShadow([w.x1 + 0.02, w.y1, w.h - (flat ? 0 : EDGE) - 0.02], [w.x1 + 0.02, w.y0, w.h - (flat ? 0 : EDGE) - 0.02], flat ? 0.35 : 0.8);
      // The roof one sees.
      const cells = m.solar && plan.solar && plan.solar.wing === i ? drawCells(ROOFS.roof, pos.cells.roof) : "";
      if (flat) {
        const p = 0.22;
        s += rpoly([[w.x0, w.y1, w.h], [w.x1, w.y1, w.h], [w.x1, w.y1, w.h + p], [w.x0, w.y1, w.h + p]], "roofEdge");
        s += rpoly([[w.x1, w.y1, w.h], [w.x1, w.y0, w.h], [w.x1, w.y0, w.h + p], [w.x1, w.y1, w.h + p]], "roofEdge", 'style="filter:brightness(.92)"');
        s += rpoly([[w.x0, w.y0, w.h + p], [w.x1, w.y0, w.h + p], [w.x1, w.y1, w.h + p], [w.x0, w.y1, w.h + p]], "roof");
        s += rpoly([[w.x0 + 0.3, w.y0 + 0.3, w.h + p], [w.x1 - 0.3, w.y0 + 0.3, w.h + p], [w.x1 - 0.3, w.y1 - 0.3, w.h + p], [w.x0 + 0.3, w.y1 - 0.3, w.h + p]], "flat");
        s += cells;
      } else if (r.axis === "x") {
        s += rpoly([[a, w.y1 + O, w.h], [b, w.y1 + O, w.h], [rb, ym, z], [ra, ym, z]], "roof");
        s += cells;
        s += rpoly([[a, w.y1 + O, w.h], [b, w.y1 + O, w.h], [b, w.y1 + O, w.h - EDGE], [a, w.y1 + O, w.h - EDGE]], "roofEdge");
        if (r.hip1) {
          s += rpoly([[b, w.y0 - O, w.h], [b, w.y1 + O, w.h], [rb, ym, z]], "roofW");
          s += rpoly([[b, w.y1 + O, w.h], [b, w.y0 - O, w.h], [b, w.y0 - O, w.h - EDGE], [b, w.y1 + O, w.h - EDGE]], "roofEdge", 'style="filter:brightness(.92)"');
          s += `<path d="${path3([[b, w.y1 + O, w.h], [rb, ym, z]])}" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" fill="none"/>`;
        } else if (!r.val1) {
          s += rpoly([[b, w.y1 + O, w.h], [b, ym, z], [b, ym, z - 0.2], [b, w.y1 + O, w.h - 0.2]], "roofEdge", 'style="filter:brightness(.95)"');
          s += rpoly([[b, ym, z], [b, w.y0 - O, w.h], [b, w.y0 - O, w.h - 0.2], [b, ym, z - 0.2]], "roofEdge", 'style="filter:brightness(.9)"');
        }
        s += `<path d="${path3([[ra, ym, z + 0.02], [rb, ym, z + 0.02]])}" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" fill="none"/>`;
      } else {
        s += rpoly([[w.x1 + O, a, w.h], [w.x1 + O, b, w.h], [xm, rb, z], [xm, ra, z]], "roofW");
        s += cells;
        s += rpoly([[w.x1 + O, b, w.h], [w.x1 + O, a, w.h], [w.x1 + O, a, w.h - EDGE], [w.x1 + O, b, w.h - EDGE]], "roofEdge", 'style="filter:brightness(.92)"');
        if (r.hip1) {
          s += rpoly([[w.x0 - O, b, w.h], [w.x1 + O, b, w.h], [xm, rb, z]], "roof");
          s += rpoly([[w.x0 - O, b, w.h], [w.x1 + O, b, w.h], [w.x1 + O, b, w.h - EDGE], [w.x0 - O, b, w.h - EDGE]], "roofEdge");
        } else if (!r.val1) {
          s += rpoly([[w.x1 + O, b, w.h], [xm, b, z], [xm, b, z - 0.2], [w.x1 + O, b, w.h - 0.2]], "roofEdge");
          s += rpoly([[xm, b, z], [w.x0 - O, b, w.h], [w.x0 - O, b, w.h - 0.2], [xm, b, z - 0.2]], "roofEdge", 'style="filter:brightness(.96)"');
        }
        s += `<path d="${path3([[xm, ra, z + 0.02], [xm, rb, z + 0.02]])}" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" fill="none"/>`;
      }
      // A dormer in the slope towards the road: it stands where the slope is as high as its foot.
      for (const [x0, x1, z0, z1] of w.dormers || []) {
        const yAt = (zz) => w.y1 + O - ((zz - w.h) / r.rise) * (w.y1 + O - ym);
        const yf = yAt(z0);
        const yb = yAt(z1);
        s += rpoly([[x0, yf, z0], [x1, yf, z0], [x1, yf, z1], [x0, yf, z1]], "wallS");
        s += rpoly([[x1, yf, z0], [x1, yb, z1], [x1, yf, z1]], "wallE");
        s += windowY(x0 + 0.25, x1 - 0.25, yf + 0.01, z0 + 0.25, z1 - 0.2, 2);
        s += rpoly([[x0 - 0.15, yb, z1 + 0.02], [x1 + 0.15, yb, z1 + 0.02], [x1 + 0.15, yf + 0.25, z1 + 0.02], [x0 - 0.15, yf + 0.25, z1 + 0.02]], "roof");
        s += rpoly([[x0 - 0.15, yf + 0.25, z1 + 0.02], [x1 + 0.15, yf + 0.25, z1 + 0.02], [x1 + 0.15, yf + 0.25, z1 - 0.12], [x0 - 0.15, yf + 0.25, z1 - 0.12]], "roofEdge");
      }
      return s;
    }

    const WALLS = {};
    for (const [key, w] of Object.entries(plan.walls)) {
      const wing = wings[w.wing];
      WALLS[key] = w.kind === "S"
        ? { kind: "S", c: wing.y1, u0: (w.u0 ?? wing.x0) + 0.05, u1: (w.u1 ?? wing.x1) - 0.05, top: w.top ?? wing.h - EDGE - 0.3 }
        : { kind: "E", c: wing.x1, u0: (w.u0 ?? wing.y0) + 0.05, u1: (w.u1 ?? wing.y1) - 0.05, top: w.top ?? wing.h - EDGE - 0.3 };
    }
    const BATTERY = [0.6, 1.5, 0.3];
    const face = plan.heatFace || "E";

    function scene(m, pos) {
      let s = "";
      for (const [x0, y0, x1, y1] of plan.drive || []) s += rpoly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], "drive");
      for (const [x0, y0, x1, y1] of plan.deck || []) s += rpoly([[x0, y0, 0.02], [x1, y0, 0.02], [x1, y1, 0.02], [x0, y1, 0.02]], "flat");
      // A soft shadow under each wing, darker where the walls meet the ground.
      for (const w of wings) {
        s += `<polygon points="${pts([[w.x0 - 0.6, w.y0 - 0.8, 0], [w.x1 + 1.25, w.y0 - 0.8, 0], [w.x1 + 1.25, w.y1 + 0.75, 0], [w.x0 - 0.6, w.y1 + 0.75, 0]])}" ${R("shadow", 'filter="url(#cs-shadow)"')}/>`;
      }
      for (const w of wings) {
        s += `<path d="${path3([[w.x0, w.y1, 0], [w.x1, w.y1, 0], [w.x1, w.y0, 0]])}" ${R("shadowLine", 'stroke-width="7" stroke-linecap="round" stroke-linejoin="round" filter="url(#cs-blur)" fill="none"')}/>`;
      }
      for (const [x, y, k = 1] of plan.trees || []) s += tree(x, y, k);
      // The heat pump stands on the ground: it is drawn before the first wing that stands in front of it.
      const [hw, , hd] = SIZE.heat;
      const [hx, hy] = face === "E" ? [hd, hw] : [hw, hd];
      let heat = m.heat ? `<g class="cs-thing" data-thing="heat">${drawHeat(pos.heat, face)}</g>` : "";
      wings.forEach((w, i) => {
        if (heat && (w.x0 >= pos.heat.x + hx - 0.01 || w.y0 >= pos.heat.y + hy - 0.01)) {
          s += heat;
          heat = "";
        }
        s += drawWing(w, i, m, pos);
      });
      if (m.battery) s += `<g class="cs-thing" data-thing="battery">${drawBattery(WALLS[pos.battery.w], pos.battery, BATTERY, m.battery.soc)}</g>`;
      s += heat;
      for (const [x, y, z = 2.35, rx = 22] of plan.lamps || []) {
        const [lx, ly] = P(x, y, z);
        LIGHTS.push(`<ellipse cx="${f1(lx)}" cy="${f1(ly + 30)}" rx="${rx}" ry="${f1(rx * 0.55)}" fill="#FFC86B" opacity=".35" filter="url(#cs-glowf)"/><circle cx="${f1(lx)}" cy="${f1(ly)}" r="2.6" fill="#FFE2A8"/>`);
      }
      return s;
    }

    // The wires are drawn from where the things are (see wiresFor): here only which ones there are.
    function routes(m, boxes) {
      const out = { grid: [] };
      if (m.solar) out.sun = [];
      if (m.heat) out.heat = [];
      if (m.battery) out.battery = [];
      boxes.forEach((_, i) => {
        out[`car${i}`] = [];
      });
      return out;
    }

    const home = plan.home || [(WALLS.s1.u0 + WALLS.s1.u1) / 2, WALLS.s1.c + 0.01, 2.3];
    const anchors = (m, placed) => {
      const a = { home, grid: [plan.street[0], plan.street[1], 0.1] };
      if (m.solar && ROOFS.roof) {
        const q = ROOFS.roof.quad(Math.floor(ROOFS.roof.cols / 2), 0);
        a.sun = [q[0][0], q[0][1], q[0][2] + 0.6];
      }
      if (m.battery) a.battery = [0, 0, 0];
      if (m.heat) a.heat = [0, 0, 0];
      (placed || []).forEach((p, i) => {
        const b = BODIES[p.car.body] || BODIES.sedan;
        a[`car${i}`] = [plan.slots[p.slot].x + b.Wd * 0.3, plan.slots[p.slot].y + b.L * 0.95, 0];
      });
      return a;
    };
    const corners = () => {
      const out = [];
      for (const w of wings) {
        const top = w.roof.type === "flat" ? w.h + 0.3 : ridge(w);
        out.push([w.x0 - O, w.y1 + O, 0], [w.x1 + O, w.y1 + O, 0], [w.x1 + O, w.y0 - O, 0], [w.x0 - O, w.y0 - O, w.h], [w.x0, w.y0, top], [w.x1, w.y0, top], [w.x0, w.y1, top]);
      }
      for (const [x0, y0, x1, y1] of plan.drive || []) out.push([x0, y1, 0], [x1, y1, 0], [x1, y0, 0]);
      for (const [x, y] of plan.trees || []) out.push([x, y, 3]);
      // Room for the wire from the road and its label.
      out.push([plan.street[0] - 1, plan.street[1] + 1.2, 0], [plan.street[0] + 1, plan.street[1] + 1.2, 0]);
      return out;
    };
    const cx = (Math.min(...wings.map((w) => w.x0)) + Math.max(...wings.map((w) => w.x1))) / 2;
    const cy = (Math.min(...wings.map((w) => w.y0)) + Math.max(...wings.map((w) => w.y1))) / 2;
    return {
      SLOTS: plan.slots, BOX: plan.chargers.map((c) => ({ x: c.u })), scene, routes, placeCars: ANGLE.placeCars, anchors, corners,
      walls: WALLS, roofs: ROOFS, battery: BATTERY, heatFace: face, coil: "under", street: plan.street, auto: true,
      defaults: {
        gateway: { z: 1.05, ...plan.gateway },
        battery: { z: 0, ...plan.battery },
        charger0: { z: 0.95, ...plan.chargers[0] },
        charger1: { z: 0.95, ...plan.chargers[1] },
        heat: plan.heat,
      },
      footprints: wings.map((w) => [w.x0, w.y0, w.x1, w.y1]),
      area: [-3, -3, 28, 28],
      ground: [cx + 1, cy + 4, 760, 400],
      stars: ANGLE.stars,
    };
  }

  const GABLE = (rise, axis = "x", more = {}) => ({ type: "gable", axis, rise, ...more });
  const FLAT = { type: "flat" };

  const PLANS = {
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
  };

  const LAYOUTS = { classic: CLASSIC, angle: ANGLE, ...Object.fromEntries(Object.entries(PLANS).map(([key, plan]) => [key, planned(plan)])) };

  // Pulses of light along a wire: more and faster the more power, in the colours of where it comes from.
  const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function packets(g, d, kw, colours) {
    if (!g) return;
    const q = Math.round(Math.min(22, kw) * 2) / 2;
    const sig = q > 0.05 && d ? `${d.length}|${q}|${colours.join()}` : "";
    if (g.dataset.sig === sig) return;
    g.dataset.sig = sig;
    if (!sig) {
      g.innerHTML = "";
      return;
    }
    const speed = 16 + 7 * q;
    const step = Math.max(26, 54 - 2.4 * q);
    const period = step * colours.length;
    const dur = (period / speed).toFixed(2);
    const layer = (len, width, colour, phase, extra) => {
      const from = len + phase;
      const anim = REDUCED ? "" : `<animate attributeName="stroke-dashoffset" from="${from}" to="${from - period}" dur="${dur}s" repeatCount="indefinite"/>`;
      return `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len} ${period - len}" stroke-dashoffset="${from}" ${extra}>${anim}</path>`;
    };
    g.innerHTML = colours.map((c, i) => {
      const phase = i * step;
      return layer(18, 9, c, phase, 'opacity=".55" filter="url(#cs-pkglow)"') + layer(16, 3.2, c, phase, 'opacity=".55"') + layer(8, 3.4, c, phase, "") + layer(0.5, 3.8, "#FFFFFF", phase, 'opacity=".95"');
    }).join("");
  }

  /* ------------------------------------------------------------ where things are, and their wires */

  // Where each thing is: where the household placed it, or where the house puts it.
  function resolve(L, lay) {
    const things = lay.things || {};
    const pos = { moved: new Set() };
    for (const key of ["gateway", "battery", "charger0", "charger1"]) {
      const t = things[key];
      if (t && L.walls[t.w] && Number.isFinite(t.u) && Number.isFinite(t.z)) {
        pos[key] = { w: t.w, u: t.u, z: t.z };
        pos.moved.add(key);
      } else pos[key] = { ...L.defaults[key] };
    }
    const heat = things.heat;
    if (heat && Number.isFinite(heat.x) && Number.isFinite(heat.y)) {
      pos.heat = { x: heat.x, y: heat.y };
      pos.moved.add("heat");
    } else pos.heat = { ...L.defaults.heat };
    const panels = lay.panels || {};
    pos.cells = {};
    for (const [key, roof] of Object.entries(L.roofs)) {
      const cells = Array.isArray(panels[key]) ? panels[key] : roof.def;
      pos.cells[key] = cells.filter(([c, r]) => c < roof.cols && r < roof.rows);
    }
    pos.panelsChanged = !!lay.panels;
    return pos;
  }

  // Every wire: as the house draws it; drawn anew when a thing it goes to was moved; as someone drew it, with its
  // ends where the things are now.
  function wiresFor(L, m, boxes, pos, lay) {
    const out = L.routes(m, boxes);
    const gate = pos.gateway;
    const gw = L.walls[gate.w];
    const [gW, gH] = SIZE.gateway;
    const rects = L.footprints;
    const gateAt = onWall(gw, along(gw, gate.u, gW / 2), gate.z);
    // Out of the box's side towards a point, a little along the wall and down to the ground.
    const exit = (toward, lift) => {
      const r = rightward(gw);
      const dir = (toward[0] - gateAt[0]) * r[0] + (toward[1] - gateAt[1]) * r[1] >= 0 ? 1 : -1;
      const a = dir > 0 ? gW : 0;
      const leg = [onWall(gw, along(gw, gate.u, a), gate.z + lift), onWall(gw, along(gw, gate.u, a + dir * 0.35), gate.z + lift), onWall(gw, along(gw, gate.u, a + dir * 0.35), 0.02)];
      return { leg, foot: leg[2], n: outward(gw), dir };
    };
    const moved = pos.moved;
    const anew = (key) => L.auto || moved.has("gateway") || (key === "sun" ? pos.panelsChanged : moved.has(key === "heat" ? "heat" : key === "battery" ? "battery" : key.replace("car", "charger")));
    for (const key of Object.keys(out)) {
      if (!anew(key)) continue;
      if (key.startsWith("car")) {
        const t = pos[key.replace("car", "charger")];
        const w = L.walls[t.w];
        const a = along(w, t.u, 0.18);
        const top = onWall(w, a, t.z, 0.15);
        const foot = onWall(w, a, 0.02, 0.15);
        const e = exit(foot, 0.3);
        out[key] = simplify([...e.leg, ...groundPath(rects, e.foot, e.n, foot, outward(w), 0.15), foot, top]);
      } else if (key === "heat") {
        const end = heatEnd(pos.heat, L.heatFace);
        const foot = [end.p[0], end.p[1], 0.02];
        const e = exit(foot, 0.3);
        out.heat = simplify([...e.leg, ...groundPath(rects, e.foot, e.n, foot, end.n, 0.65), foot, end.p]);
      } else if (key === "battery") {
        const t = pos.battery;
        const bw = L.walls[t.w];
        const [bW, bH, bD] = L.battery;
        const centre = onWall(bw, along(bw, t.u, bW / 2), t.z);
        const gap = Math.hypot(centre[0] - gateAt[0], centre[1] - gateAt[1]);
        if (t.w === gate.w && gap < 1.8) {
          // Beside the box on the same wall: straight across.
          const z = Math.min(gate.z + 0.45, t.z + bH - 0.15);
          const e = exit(centre, 0.45);
          out.battery = [onWall(gw, along(gw, gate.u, e.dir > 0 ? gW : 0), z), onWall(bw, along(bw, t.u, e.dir > 0 ? 0 : bW), z)];
        } else {
          const front = onWall(bw, along(bw, t.u, bW / 2), 0.3, bD + 0.02);
          const foot = [front[0], front[1], 0.02];
          const e = exit(foot, 0.45);
          out.battery = simplify([...e.leg, ...groundPath(rects, e.foot, e.n, foot, outward(bw), 0.4), foot, front]);
        }
      } else if (key === "grid") {
        const bottom = onWall(gw, along(gw, gate.u, gW / 2), gate.z);
        const foot = onWall(gw, along(gw, gate.u, gW / 2), 0.02);
        const street = [L.street[0], L.street[1], 0.02];
        out.grid = simplify([...groundPath(rects, street, null, foot, outward(gw), 0), foot, bottom]);
      } else if (key === "sun") {
        // From the panel nearest the edge (and the box), over the edge and down the wall.
        const pick = Object.entries(L.roofs).find(([k]) => pos.cells[k].length);
        if (!pick) {
          delete out.sun;
          continue;
        }
        const [rk, roof] = pick;
        const cells = pos.cells[rk];
        const row = roof.prefer === "low" ? Math.min(...cells.map((c) => c[1])) : Math.max(...cells.map((c) => c[1]));
        const [c] = cells.filter((q) => q[1] === row).sort((p, q) => Math.abs(roof.colX(p[0]) - gateAt[0]) - Math.abs(roof.colX(q[0]) - gateAt[0]))[0];
        const down = roof.down(c, row);
        const dw = L.walls[down.wall];
        const top = onWall(gw, along(gw, gate.u, gW / 2), gate.z + gH);
        if (down.wall === gate.w) {
          out.sun = simplify([...down.points, onWall(gw, along(gw, gate.u, gW / 2), down.z), top]);
        } else {
          const foot = onWall(dw, down.u, 0.02);
          const in2 = onWall(gw, along(gw, gate.u, gW / 2 + 0.12), 0.02);
          out.sun = simplify([...down.points, foot, ...groundPath(rects, foot, outward(dw), in2, outward(gw), 0.3), in2, onWall(gw, along(gw, gate.u, gW / 2 + 0.12), gate.z)]);
        }
      }
    }
    // Wires someone drew: their own way, from where the wire starts now to where it ends now.
    for (const [key, points] of Object.entries(lay.wires || {})) {
      if (!out[key] || !Array.isArray(points) || points.length < 2) continue;
      out[key] = attach(points, out[key][0], out[key][out[key].length - 1]);
    }
    return out;
  }

  // From a point in the picture to a place on a wall, on the ground or on a level above it.
  const unS = (sx, sy, c) => {
    const x = (sx - OX) / (C * S) + c;
    return [x, ((x + c) * 0.5 * S + OY - sy) / S];
  };
  const unE = (sx, sy, c) => {
    const y = c - (sx - OX) / (C * S);
    return [y, ((c + y) * 0.5 * S + OY - sy) / S];
  };
  const unGround = (sx, sy, h = 0) => {
    const d = (sx - OX) / (C * S);
    const s = (sy - OY + h * S) / (0.5 * S);
    return [(s + d) / 2, (s - d) / 2];
  };
  const snap = (v, step = 0.05) => Math.round(v / step) * step;
  // Each way a point in the world moves in the picture.
  const AXIS = [[C * S, 0.5 * S], [-C * S, 0.5 * S], [0, -S]];

  /* ------------------------------------------------------------ the scene */

  function defs() {
    return `<defs>
      <linearGradient id="cs-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECEFF3"/><stop offset="1" stop-color="#DCE1E8"/></linearGradient>
      <radialGradient id="cs-ground" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${MODES[0].ground}" ${R("groundStop")}/><stop offset=".7" stop-color="${MODES[0].ground}" stop-opacity=".6" ${R("groundStop")}/><stop offset="1" stop-color="${MODES[0].ground}" stop-opacity="0" ${R("groundStop")}/></radialGradient>
      <linearGradient id="cs-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="cs-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
      <radialGradient id="cs-glowg"><stop offset="0" stop-color="${STATUS.charging}" stop-opacity=".5"/><stop offset="1" stop-color="${STATUS.charging}" stop-opacity="0"/></radialGradient>
      <filter id="cs-shadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="cs-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="cs-blur-s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
      <filter id="cs-glowf" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="cs-pkglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
      <linearGradient id="cs-pane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity=".04"/><stop offset=".55" stop-color="#fff" stop-opacity=".14"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>`;
  }

  // What each car on a charger shows, and the power of each wire, from the model.
  function statusOf(c) {
    if (!c.plugged) return "unplugged";
    if (c.charging) return "charging";
    if (c.status === "planned") return "planned";
    if (c.status === "completed") return "done";
    return "connected";
  }

  // The words of the editor, when the panel gives none.
  const EDIT_WORDS = {
    edit_open: "Edit", edit_things: "Things", edit_wires: "Wires", edit_panels: "Solar panels", edit_labels: "Labels",
    edit_hint_things: "Drag a charger, the box, the battery or the heat pump. Things on a wall stay on a wall.",
    edit_hint_wires: "Drag a stretch of wire to move it. A wire always runs straight.",
    edit_hint_panels: "Tap a place on a roof, or draw across it, to put up or take down panels.",
    edit_hint_labels: "Drag a label to where it is not in the way.",
    edit_undo: "Undo", edit_reset_things: "Put things back", edit_reset_wires: "Draw them all again", edit_reset_wire: "Draw this one again",
    edit_reset_panels: "Put the panels back", edit_reset_labels: "Place them again", edit_cancel: "Cancel", edit_save: "Save", edit_count: "{n} panels",
  };

  class Scene {
    constructor() {
      this.el = document.createElement("div");
      this.el.className = "cscene";
      this.key = "";
      this.light = null;
      this.edit = null;
      // The words, from the panel (set by it); English otherwise.
      this.t = (key, vars = {}) => String(EDIT_WORDS[key] || key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
      this.el.addEventListener("pointerdown", (e) => this._down(e));
      this.el.addEventListener("pointermove", (e) => this._move(e));
      this.el.addEventListener("pointerup", (e) => this._up(e));
      this.el.addEventListener("pointercancel", (e) => this._up(e));
      this.el.addEventListener("click", (e) => this._click(e));
    }

    // The layout of the house shown: what is being edited, or what was saved.
    get lay() {
      if (this.edit) return this.edit.layout;
      const m = this.model || {};
      return (m.layout && m.layout[m.layoutKey || m.house || "classic"]) || {};
    }

    _key(m) {
      return JSON.stringify([m.house || "classic", m.layoutKey || "", !!m.solar, !!m.battery, !!m.heat, m.chargers.length, m.cars.map((c) => [c.body, c.paint, c.image || "", !!c.plugged, c.charger, c.spot]), this.lay, this.edit ? [this.edit.tab, this.edit.sel] : null, !!m.canEdit]);
    }

    update(m) {
      this.model = m;
      const key = this._key(m);
      if (key !== this.key) {
        this.key = key;
        this._build(m);
      }
      this._live(m);
      this._labels(m);
    }

    // Drawn again at once (while a thing is dragged, at most once a frame).
    _redraw(now = false) {
      if (!this.model) return;
      const go = () => {
        this._frame = null;
        this.key = "";
        this.update(this.model);
      };
      if (now) go();
      else if (!this._frame) this._frame = requestAnimationFrame(go);
    }

    _build(m) {
      const L = (this.layout = LAYOUTS[m.house] || CLASSIC);
      const lay = this.lay;
      const boxes = m.chargers.slice(0, 2);
      const pos = (this.pos = resolve(L, lay));
      this.placed = L.placeCars(m);
      this.routes = wiresFor(L, m, boxes, pos, lay);
      LIGHTS = [];
      const [gx, gy] = P(L.ground[0], L.ground[1], 0);
      let s = `<rect x="-1500" y="-1500" width="4000" height="4000" ${R("bg")}/><ellipse cx="${f1(gx)}" cy="${f1(gy)}" rx="${L.ground[2]}" ry="${L.ground[3]}" fill="url(#cs-ground)"/>`;
      s += `<g class="cs-stars">${L.stars.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.7}" style="--d:${i * 0.7}s"/>`).join("")}</g>`;
      s += `<g class="cs-world">${L.scene(m, pos)}`;
      // The chargers: by default one in the middle of the garage, a second by its right-hand corner.
      boxes.forEach((_, i) => {
        const t = pos[`charger${i}`];
        s += `<g class="cs-charger cs-thing" data-i="${i}" data-thing="charger${i}">${drawCharger(L.walls[t.w], t)}</g>`;
      });
      // The wires: always green; the pulses in them show where the current goes.
      this.paths = {};
      for (const [k, r] of Object.entries(this.routes)) {
        const d = path3(r);
        this.paths[k] = d;
        this.paths[`${k}Back`] = path3([...r].reverse());
        s += `<g class="cs-wire" data-route="${k}"><path d="${d}" ${R("flowGlow", 'fill="none" stroke-width="7" stroke-linejoin="round" filter="url(#cs-glowf)"')}/><path d="${d}" ${R("flow", 'fill="none" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"')}/><g class="cs-pk"></g></g>`;
      }
      s += `<g class="cs-thing" data-thing="gateway">${drawGateway(L.walls[pos.gateway.w], pos.gateway)}</g>`;
      // A cable rolled up on the wall where no car is plugged in, behind the cars.
      const plugged = new Set(this.placed.filter((p) => p.box !== null && p.car.plugged).map((p) => p.box));
      boxes.forEach((_, i) => {
        const t = pos[`charger${i}`];
        if (!plugged.has(i)) s += `<g class="cs-coil" data-i="${i}">${coilAt(L.walls[t.w], t, L.coil)}</g>`;
      });
      // The cars, the far one first, then the cables of those plugged in.
      let cables = "";
      for (const p of [...this.placed].sort((a, b) => a.slot - b.slot)) {
        const slot = L.SLOTS[p.slot];
        const c = p.car;
        s += `<g class="cs-car">${car(slot.x, slot.y, c.body, c.paint, { charging: c.charging, image: c.image })}</g>`;
        if (c.plugged && p.box !== null) {
          const t = pos[`charger${p.box}`];
          const cable = plugCable(plugFrom(L.walls[t.w], t), portAt(slot.x, slot.y, c.body, c.image));
          this.paths[`cable${p.box}`] = cable.d;
          cables += `<g class="cs-cable" data-i="${p.box}">${cable.svg}</g>`;
        }
      }
      s += cables;
      s += `</g><g class="cs-lights">${LIGHTS.join("")}</g>`;
      if (this.edit) s += `<g class="cs-edit">${this._overlay(m, L, pos)}</g>`;
      if (!this.svg) {
        // The picture with its labels on top, and under it the editor's bar: the labels are placed in the picture alone.
        this.el.innerHTML = `<div class="cs-pic"><svg class="cs-main" viewBox="0 0 ${W} ${H}" aria-hidden="true"></svg><svg class="cs-leaders" viewBox="0 0 ${W} ${H}" aria-hidden="true"></svg><div class="cs-labels"></div></div><div class="cs-tools"></div>`;
        this.svg = this.el.querySelector("svg");
      }
      this.svg.innerHTML = defs() + s;
      this.roles = [...this.svg.querySelectorAll("[data-r]")];
      this.el.classList.toggle("editing", !!this.edit);
      this._tools(m);
      this.light = null;
      this._fit(true);
      if (!this.resize && window.ResizeObserver) {
        this.resize = new ResizeObserver(() => this._fit());
        this.resize.observe(this.el);
      }
    }

    // The house, the garage and the cars in the middle of the picture, with room above for the labels;
    // on a narrow screen closer in. While something is dragged the picture stays where it is.
    _fit(built = false) {
      if (this.drag && this.view && built) return;
      const narrow = (this.el.clientWidth || W) < 560;
      const m = this.model || { cars: [], heat: null };
      const L = this.layout || CLASSIC;
      const corners = L.corners(m);
      if (this.pos) {
        for (const key of ["gateway", "charger0", "charger1", "battery"]) {
          const t = this.pos[key];
          if (t && this.pos.moved.has(key)) corners.push(onWall(L.walls[t.w], t.u, t.z), onWall(L.walls[t.w], t.u, t.z + 1));
        }
        if (m.heat && this.pos.moved.has("heat")) corners.push([this.pos.heat.x, this.pos.heat.y, 0], [this.pos.heat.x + 1.4, this.pos.heat.y + 1.4, 1.1]);
      }
      const xy = corners.map((c) => P(...c));
      const x0 = Math.min(...xy.map((p) => p[0]));
      const x1 = Math.max(...xy.map((p) => p[0]));
      const y0 = Math.min(...xy.map((p) => p[1])) - (narrow ? 34 : 44);
      const y1 = Math.max(...xy.map((p) => p[1])) + (narrow ? 22 : 10);
      const ratio = narrow ? 1.32 : W / H;
      let w = x1 - x0 + (narrow ? 20 : 80);
      let h = y1 - y0;
      if (w / h < ratio) w = h * ratio;
      else h = w / ratio;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const view = [cx - w / 2, cy - h / 2, w, h].map((v) => Math.round(v));
      if (this.view && this.view.join() === view.join()) return;
      this.view = view;
      for (const svg of this.el.querySelectorAll(".cs-pic > svg")) svg.setAttribute("viewBox", view.join(" "));
      if (this.model) this._labels(this.model);
    }

    _live(m) {
      const flows = m.flows || {};
      // The light: from day (0) to night (1), with the sun.
      const k = Math.max(0, Math.min(1, Number(m.light) || 0));
      const look = modeAt(k);
      if (this.light === null || Math.abs(k - this.light) > 0.004) {
        const first = this.light === null;
        if (first) this.el.classList.add("cs-instant");
        this.light = k;
        paint(this.roles, look);
        this.el.style.background = look.bg;
        this.svg.querySelector(".cs-stars").setAttribute("opacity", look.stars.toFixed(2));
        this.svg.querySelector(".cs-lights").setAttribute("opacity", look.lights.toFixed(2));
        for (const c of this.svg.querySelectorAll(".cs-car")) c.style.filter = look.car < 0.99 ? `brightness(${look.car.toFixed(2)})` : "";
        this.el.classList.toggle("is-dark", k > 0.5);
        if (first) requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.remove("cs-instant")));
      }
      const sun = Math.max(0, Number(flows.sun) || 0);
      const bought = Math.max(0, -(Number(flows.grid) || 0));
      const battery = Number(flows.battery) || 0;
      this.el.classList.toggle("sun-on", sun > 0.05);
      this.el.classList.toggle("heat-on", (Number(flows.heat) || 0) > 0.05);
      // Where what the house uses comes from: the sun, the grid, the battery; a colour for each that counts.
      const from = [[SOURCE.sun, sun], [SOURCE.grid, bought], [SOURCE.battery, Math.max(0, -battery)]];
      const total = from.reduce((t, [, v]) => t + v, 0);
      let used = from.filter(([, v]) => total > 0 && v / total >= 0.2).map(([c]) => c);
      if (!used.length) used = [SOURCE.grid];
      const wire = (k2) => this.svg.querySelector(`.cs-wire[data-route="${k2}"] .cs-pk`);
      packets(wire("sun"), this.paths.sun, sun, [SOURCE.sun]);
      const grid = Number(flows.grid) || 0; // negative when the house buys
      packets(wire("grid"), grid > 0 ? this.paths.gridBack : this.paths.grid, Math.abs(grid), [grid > 0 ? SOURCE.sold : SOURCE.grid]);
      packets(wire("heat"), this.paths.heat, Number(flows.heat) || 0, used);
      packets(wire("battery"), battery < 0 ? this.paths.batteryBack : this.paths.battery, Math.abs(battery), battery < 0 ? [SOURCE.battery] : used);
      // Each charger: its car's state on the light, the ring by the plug and the glow round the cable.
      for (let i = 0; i < 2; i += 1) {
        const p = this.placed.find((q) => q.box === i);
        const kw = p ? Number(flows[`car${this.placed.indexOf(p)}`]) || 0 : 0;
        packets(wire(`car${i}`), this.paths[`car${i}`], kw, used);
        const state = p ? statusOf(p.car) : "unplugged";
        const colour = STATUS[state];
        for (const led of this.svg.querySelectorAll(`.cs-charger[data-i="${i}"] .cs-led, .cs-cable[data-i="${i}"] .cs-ring-led, .cs-coil[data-i="${i}"] .cs-ring-led`)) {
          led.setAttribute("stroke", colour);
          led.classList.toggle("pulse", state === "planned");
        }
        const cable = this.svg.querySelector(`.cs-cable[data-i="${i}"]`);
        if (!cable) continue;
        const glow = cable.querySelector(".cs-cable-glow");
        glow.setAttribute("stroke", colour);
        glow.setAttribute("opacity", ((state === "charging" ? 0.4 : 0.18) + 0.3 * look.lights).toFixed(2));
        cable.classList.toggle("pulse", state === "planned");
        packets(cable.querySelector(".cs-pk"), this.paths[`cable${i}`], kw, used);
      }
    }

    relabel() {
      if (this.model) this._labels(this.model);
    }

    // Where each label points: the house's own points, and the things where they are now.
    _anchors(m) {
      const L = this.layout || CLASSIC;
      const a = L.anchors(m, this.placed);
      const pos = this.pos;
      if (!pos) return a;
      if (a.battery) {
        const [bW, bH, bD] = L.battery;
        const w = L.walls[pos.battery.w];
        a.battery = onWall(w, along(w, pos.battery.u, bW / 2), pos.battery.z + bH + 0.25, bD);
      }
      if (a.heat) a.heat = L.heatFace === "E" ? [pos.heat.x + 0.55, pos.heat.y + 0.7, 1.1] : [pos.heat.x + 0.7, pos.heat.y + 0.25, 1.1];
      if (a.sun) {
        const quads = Object.entries(L.roofs).flatMap(([k, roof]) => pos.cells[k].map(([c, r]) => roof.quad(c, r))).flat();
        if (quads.length) a.sun = [0, 1, 2].map((i) => quads.reduce((t, q) => t + q[i], 0) / quads.length);
        else delete a.sun;
      }
      return a;
    }

    _labels(m) {
      const anchors = this._anchors(m);
      const placedLabels = this.lay.labels || {};
      const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
      const [vx, vy, vw, vh] = this.view || [0, 0, W, H];
      this.anchorAt = {};
      // Each label straight above its point; labels that would meet move up a step. A label someone placed stays put.
      const items = [];
      for (const label of m.labels || []) {
        const anchor = anchors[label.key];
        if (!anchor) continue;
        const [ax, ay] = P(...anchor);
        this.anchorAt[label.key] = [ax, ay];
        // The cars' labels sit in the drive in front of them, out of the way of the chargers and cables.
        const lift = label.key === "grid" ? 26 : label.key.startsWith("car") ? -14 : 34;
        // Kept inside the picture: half the label's width, roughly, in the picture's units.
        // A label that is tapped open shows its name and all of its text.
        const open = !!this.open?.has(label.key) && !this.edit;
        const text = open ? `${label.title} ${label.value}` : String(label.short ?? label.value);
        const half = ((text.length * 6.6 + (label.dir ? 54 : 40)) / 2) * (vw / (this.el.clientWidth || W));
        const own = placedLabels[label.key];
        const x = own ? ax + own[0] : ax;
        const y = own ? ay + own[1] : ay - lift;
        items.push({ label, ax, ay, half, fixed: !!own, x: Math.min(vx + vw - half, Math.max(vx + half, x)), y: own ? y : Math.max(vy + 14, y) });
      }
      // Labels that would meet: the lowest stays, the next one moves up over it. Measured in the
      // labels' real size, so it also holds on a phone, where a label is large against the picture.
      const unit = vw / (this.el.clientWidth || W);
      const tall = 27 * unit;
      const top = vy + tall / 2 + 2 * unit;
      const bottom = vy + vh - tall / 2 - 2 * unit;
      for (const item of items) item.y = Math.min(bottom, Math.max(top, item.y));
      // The placed ones first, so the others make room for them.
      items.sort((a, b) => Number(b.fixed) - Number(a.fixed) || b.y - a.y);
      // A hair less than a label's height, so one that was just moved a step clear counts as clear.
      const meets = (a, b) => Math.abs(a.x - b.x) < a.half + b.half + 3 * unit && Math.abs(a.y - b.y) < tall - 0.01;
      for (let i = 1; i < items.length; i += 1) {
        const b = items[i];
        if (b.fixed) continue;
        for (let turn = 0; turn < items.length; turn += 1) {
          const a = items.slice(0, i).find((other) => meets(other, b));
          if (!a) break;
          b.y = a.y - tall;
        }
        if (b.y < top) {
          // No room above: below the lowest one it meets instead.
          b.y = top;
          for (let turn = 0; turn < items.length; turn += 1) {
            const a = items.slice(0, i).find((other) => meets(other, b));
            if (!a) break;
            b.y = a.y + tall;
          }
        }
      }
      let lines = "";
      let html = "";
      const dragging = this.edit?.tab === "labels";
      for (const { label, ax, ay, x, y } of items) {
        const color = label.colour || (label.on ? (label.key === "sun" ? SOURCE.sun : STATUS.charging) : "#9AA3B2");
        lines += `<path d="M${f1(x)} ${f1(y + 9)} L${f1(ax)} ${f1(ay)}" class="cs-leader"/><circle cx="${f1(ax)}" cy="${f1(ay)}" r="2.6" fill="${color}" stroke="#fff" stroke-width="1.1"/>`;
        const left = (((x - vx) / vw) * 100).toFixed(2);
        const topPc = (((y - vy) / vh) * 100).toFixed(2);
        const pylon = `<svg class="cs-icon" viewBox="0 0 20 20" aria-hidden="true" style="stroke:${color}"><path d="M6 17 L9 3 L11 3 L14 17 M5 6.5 L15 6.5 M7.4 11 L12.6 11 M6 17 L12.4 9 M14 17 L7.6 9"/></svg>`;
        const ring = label.icon === "grid" ? pylon : Number.isFinite(label.bar) ? `<svg class="cs-ring" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" class="r0"/><circle cx="10" cy="10" r="7.5" class="r1" pathLength="100" style="stroke-dasharray:${Math.max(0, Math.min(100, label.bar)).toFixed(0)} 100${label.colour ? `;stroke:${label.colour}` : ""}"/></svg>` : `<span class="cs-dot"${label.colour ? ` style="background:${label.colour};box-shadow:0 0 6px ${label.colour}"` : ""}></span>`;
        const open = !!this.open?.has(label.key) && !this.edit;
        // In to the house points down, out to the grid points up.
        const arrow = label.dir && !open ? `<svg class="cs-icon cs-dir" viewBox="0 0 20 20" aria-hidden="true" style="stroke:${color}"><path d="${label.dir === "in" ? "M10 4 L10 16 M5 11 L10 16 L15 11" : "M10 16 L10 4 M5 9 L10 4 L15 9"}"/></svg>` : "";
        html += `<button class="cs-label ${label.on ? "on" : ""} ${label.key === "sun" ? "sun" : ""} ${open ? "open" : ""} ${dragging ? "drag" : ""}" ${this.edit ? "" : 'data-act="scene-label"'} data-key="${label.key}" data-dir="${label.dir || ""}" style="left:${left}%;top:${topPc}%" title="${esc(label.title)}" aria-expanded="${open}" aria-label="${esc(`${label.title}: ${label.value}`)}">${ring}${arrow}<span class="cs-t">${esc(label.title)}</span><span class="cs-v">${esc(open ? label.value : (label.short ?? label.value))}</span></button>`;
      }
      this.el.querySelector(".cs-leaders").innerHTML = lines;
      this.el.querySelector(".cs-labels").innerHTML = html;
    }

    /* ---------------------------------------------------------------- the editor */

    // What can be grabbed in the tab that is open: the things, the stretches of wire, the places for panels.
    _overlay(m, L, pos) {
      const tab = this.edit.tab;
      // At least 40 pixels to grab with a finger, however small the picture is.
      const view = this.view || [0, 0, W, H];
      const unit = view[2] / (this.el.clientWidth || W);
      const reach = 40 * unit;
      let s = "";
      if (tab === "things") {
        const keys = ["gateway", ...m.chargers.slice(0, 2).map((_, i) => `charger${i}`)];
        if (m.battery) keys.push("battery");
        if (m.heat) keys.push("heat");
        for (const key of keys) {
          const corners = this._corners(L, key, pos);
          const xy = corners.map((c) => P(...c));
          let x0 = Math.min(...xy.map((p) => p[0])) - 3;
          let y0 = Math.min(...xy.map((p) => p[1])) - 3;
          let x1 = Math.max(...xy.map((p) => p[0])) + 3;
          let y1 = Math.max(...xy.map((p) => p[1])) + 3;
          if (x1 - x0 < reach) [x0, x1] = [(x0 + x1 - reach) / 2, (x0 + x1 + reach) / 2];
          if (y1 - y0 < reach) [y0, y1] = [(y0 + y1 - reach) / 2, (y0 + y1 + reach) / 2];
          s += `<rect class="cs-hit ${this.edit.sel === key ? "sel" : ""}" data-thing="${key}" x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" rx="4"/>`;
        }
      } else if (tab === "wires") {
        for (const [key, route] of Object.entries(this.routes)) {
          const sel = this.edit.sel === key;
          s += `<path class="cs-route ${sel ? "sel" : ""}" d="${path3(route)}"/>`;
          route.forEach((p, i) => {
            if (i === route.length - 1) return;
            const q = route[i + 1];
            const d = path3([p, q]);
            const free = this._axisFor(L, p, q) !== null;
            s += `<path class="cs-seg ${free ? "" : "fixed"}" data-wire="${key}" data-seg="${i}" d="${d}" style="stroke-width:${f1(Math.max(14, reach * 0.7))}px"/>`;
            if (free) {
              const [mx, my] = P((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
              s += `<circle class="cs-grip ${sel ? "sel" : ""}" cx="${f1(mx)}" cy="${f1(my)}" r="${f1(Math.max(3.6, 7 * unit))}" data-wire="${key}" data-seg="${i}"/>`;
            }
          });
        }
      } else if (tab === "panels" && m.solar) {
        for (const [key, roof] of Object.entries(L.roofs)) {
          const on = new Set(pos.cells[key].map((c) => c.join()));
          for (let r = 0; r < roof.rows; r += 1) {
            for (let c = 0; c < roof.cols; c += 1) {
              s += `<polygon class="cs-cell ${on.has(`${c},${r}`) ? "on" : ""}" data-cell="${key}:${c}:${r}" points="${pts(roof.quad(c, r))}"/>`;
            }
          }
        }
      }
      return s;
    }

    // The corners of a thing, in the world.
    _corners(L, key, pos) {
      if (key === "heat") {
        const { x, y } = pos.heat;
        const [w, , d] = SIZE.heat;
        const [dx, dy] = L.heatFace === "E" ? [d, w] : [w, d];
        return [[x, y, 0], [x + dx, y, 0], [x, y + dy, 0], [x + dx, y + dy, 0], [x, y, 1.05], [x + dx, y + dy, 1.05], [x + dx, y, 1.05], [x, y + dy, 1.05]];
      }
      const t = pos[key];
      const wall = L.walls[t.w];
      const [w, h, d] = key === "battery" ? L.battery : key === "gateway" ? SIZE.gateway : SIZE.charger;
      const out = [];
      for (const a of [0, w]) for (const z of [t.z, t.z + h]) for (const o of [0, d]) out.push(onWall(wall, along(wall, t.u, a), z, o));
      return out;
    }

    // Which way a stretch of wire can be moved: across it, on the wall or the ground it lies on; null for one on a roof.
    _axisFor(L, p, q) {
      const ax = axes(p, q);
      if (ax.length !== 1) return null;
      const k = ax[0];
      const onGround = p[2] <= 0.05 && q[2] <= 0.05;
      const wall = Object.values(L.walls).find((w) => (w.kind === "S" ? Math.abs(p[1] - w.c) < 0.25 && Math.abs(q[1] - w.c) < 0.25 : Math.abs(p[0] - w.c) < 0.25 && Math.abs(q[0] - w.c) < 0.25));
      const high = Math.max(p[2], q[2]);
      if (k === 2) {
        if (!wall || high > wall.top + 0.6) return null;
        return wall.kind === "S" ? 0 : 1;
      }
      if (onGround) return k === 0 ? 1 : 0;
      if (wall && high <= wall.top + 0.6 && (wall.kind === "S" ? k === 0 : k === 1)) return 2;
      return null;
    }

    _point(e) {
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const m = this.svg.getScreenCTM();
      if (!m) return [0, 0];
      const p = pt.matrixTransform(m.inverse());
      return [p.x, p.y];
    }

    _remember() {
      this.edit.undo.push(JSON.stringify(this.edit.layout));
      if (this.edit.undo.length > 60) this.edit.undo.shift();
    }

    _down(e) {
      if (!this.edit || e.button > 0) return;
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      const el = target && target.closest ? target : null;
      if (!el || el.closest(".cs-tools")) return;
      const [sx, sy] = this._point(e);
      const L = this.layout;
      const lay = this.edit.layout;
      const tab = this.edit.tab;
      let drag = null;
      const thing = el.closest("[data-thing]");
      const seg = el.closest("[data-seg]");
      const cell = el.closest("[data-cell]");
      const label = el.closest(".cs-label");
      if (tab === "things" && thing) {
        const key = thing.dataset.thing;
        this._remember();
        this.edit.sel = key;
        if (key === "heat") {
          const [gx, gy] = unGround(sx, sy);
          drag = { kind: "thing", key, grab: [gx - this.pos.heat.x, gy - this.pos.heat.y] };
        } else {
          const t = this.pos[key];
          const wall = L.walls[t.w];
          const [u, z] = wall.kind === "S" ? unS(sx, sy, wall.c) : unE(sx, sy, wall.c);
          drag = { kind: "thing", key, grab: [u - t.u, z - t.z] };
        }
      } else if (tab === "wires" && seg) {
        const key = seg.dataset.wire;
        const i = Number(seg.dataset.seg);
        const route = this.routes[key].map((p) => [...p]);
        const axis = this._axisFor(L, route[i], route[i + 1]);
        this.edit.sel = key;
        if (axis === null) {
          this._redraw(true);
          return;
        }
        this._remember();
        // The ends of the wire stay where they are; so does a point it shares with a stretch on the roof.
        // A point stays and a new short stretch grows from it when it is an end, touches the roof, or its other
        // stretch does not run the way this one moves.
        const last = route.length - 1;
        const along1 = (p, q) => (axes(p, q).length === 1 ? axes(p, q)[0] : -1);
        const stays = (j, other) => j === 0 || j === last || this._axisFor(L, route[Math.min(j, other)], route[Math.max(j, other)]) === null || along1(route[j], route[other]) !== axis;
        const keepA = stays(i, i - 1);
        const keepB = stays(i + 1, i + 2);
        let a = i;
        if (keepA) {
          route.splice(a, 0, [...route[a]]);
          a += 1;
        }
        if (keepB) route.splice(a + 2, 0, [...route[a + 1]]);
        lay.wires = { ...(lay.wires || {}), [key]: route };
        drag = { kind: "wire", key, seg: a, axis, start: [sx, sy], base: route.map((p) => [...p]) };
      } else if (tab === "panels" && cell) {
        this._remember();
        const [roof, c, r] = cell.dataset.cell.split(":");
        const on = !cell.classList.contains("on");
        drag = { kind: "cells", on, done: new Set() };
        this._setCell(roof, Number(c), Number(r), on, drag);
      } else if (tab === "labels" && label) {
        const key = label.dataset.key;
        const anchor = this.anchorAt[key];
        if (!anchor) return;
        this._remember();
        const [vx, vy, vw, vh] = this.view;
        const x = vx + (parseFloat(label.style.left) / 100) * vw;
        const y = vy + (parseFloat(label.style.top) / 100) * vh;
        drag = { kind: "label", key, grab: [sx - x, sy - y] };
      }
      if (!drag) return;
      e.preventDefault();
      this.drag = drag;
      try {
        this.el.setPointerCapture(e.pointerId);
      } catch (err) {
        // A pointer that is gone already.
      }
      this._redraw(true);
    }

    _move(e) {
      const drag = this.drag;
      if (!drag || !this.edit) return;
      e.preventDefault();
      const [sx, sy] = this._point(e);
      const L = this.layout;
      const lay = this.edit.layout;
      if (drag.kind === "thing") {
        lay.things = { ...(lay.things || {}) };
        if (drag.key === "heat") {
          const [gx, gy] = unGround(sx, sy);
          lay.things.heat = this._ground(L, gx - drag.grab[0], gy - drag.grab[1]);
        } else {
          const placed = this._onWall(L, drag.key, sx, sy, drag.grab);
          if (placed) lay.things[drag.key] = placed;
        }
        this._redraw();
      } else if (drag.kind === "wire") {
        const [ux, uy] = AXIS[drag.axis];
        const delta = snap(((sx - drag.start[0]) * ux + (sy - drag.start[1]) * uy) / (ux * ux + uy * uy));
        const route = drag.base.map((p) => [...p]);
        for (const j of [drag.seg, drag.seg + 1]) route[j][drag.axis] = drag.base[j][drag.axis] + delta;
        // Not under the ground, and not through a house.
        if (route.some((p) => p[2] < 0.02)) return;
        const ground = route.slice(1).some((q, j) => route[j][2] <= 0.05 && q[2] <= 0.05 && crosses(route[j], q, L.footprints));
        if (ground) return;
        lay.wires = { ...(lay.wires || {}), [drag.key]: route };
        this._redraw();
      } else if (drag.kind === "cells") {
        const root = this.el.getRootNode();
        const hit = root.elementFromPoint ? root.elementFromPoint(e.clientX, e.clientY) : null;
        const cell = hit && hit.closest ? hit.closest("[data-cell]") : null;
        if (cell) {
          const [roof, c, r] = cell.dataset.cell.split(":");
          this._setCell(roof, Number(c), Number(r), drag.on, drag);
        }
      } else if (drag.kind === "label") {
        const anchor = this.anchorAt[drag.key];
        if (!anchor) return;
        lay.labels = { ...(lay.labels || {}), [drag.key]: [Math.round(sx - drag.grab[0] - anchor[0]), Math.round(sy - drag.grab[1] - anchor[1])] };
        this._labels(this.model);
      }
    }

    _up(e) {
      const drag = this.drag;
      if (!drag) return;
      this.drag = null;
      try {
        this.el.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Released already.
      }
      if (drag.kind === "wire" && this.edit) {
        const lay = this.edit.layout;
        const route = lay.wires?.[drag.key];
        if (route) lay.wires[drag.key] = simplify(route).map((p) => p.map((v) => Math.round(v * 100) / 100));
      }
      this._redraw(true);
    }

    // A thing on the wall the pointer is over, kept on the wall and off its edges.
    _onWall(L, key, sx, sy, grab) {
      const [w, h] = key === "battery" ? L.battery : key === "gateway" ? SIZE.gateway : SIZE.charger;
      const current = this.pos[key].w;
      const order = [current, ...Object.keys(L.walls).filter((k) => k !== current)];
      for (const wk of order) {
        const wall = L.walls[wk];
        const [pu, pz] = wall.kind === "S" ? unS(sx, sy, wall.c) : unE(sx, sy, wall.c);
        const [lo, hi] = wall.kind === "S" ? [wall.u0, wall.u1 - w] : [wall.u0 + w, wall.u1];
        const inside = pu >= wall.u0 - 0.3 && pu <= wall.u1 + 0.3 && pz >= -0.3 && pz <= wall.top + 0.6;
        if (!inside && wk !== current) continue;
        // On another wall it is grabbed by its middle.
        const [gu, gz] = wk === current ? grab : [wall.kind === "S" ? w / 2 : -w / 2, h / 2];
        const u = snap(Math.min(hi, Math.max(lo, pu - gu)));
        const z = snap(Math.min(Math.max(0, wall.top - h), Math.max(key === "battery" ? 0 : 0.3, pz - gz)));
        if (inside || wk === current) return { w: wk, u: Number(u.toFixed(2)), z: Number(z.toFixed(2)) };
      }
      return null;
    }

    // The heat pump on the ground: inside the picture's yard, and out of the houses.
    _ground(L, x, y) {
      const [ax0, ay0, ax1, ay1] = L.area;
      const [w, , d] = SIZE.heat;
      const [dx, dy] = L.heatFace === "E" ? [d, w] : [w, d];
      x = Math.min(ax1 - dx, Math.max(ax0, x));
      y = Math.min(ay1 - dy, Math.max(ay0, y));
      for (const [x0, y0, x1, y1] of L.footprints) {
        if (x + dx > x0 && x < x1 && y + dy > y0 && y < y1) {
          // Pushed out the shortest way: towards the road or the gable's side, the sides we can see.
          const toFront = y1 + 0.1 - y;
          const toSide = x1 + 0.1 - x;
          if (toFront <= toSide) y = y1 + 0.1;
          else x = x1 + 0.1;
        }
      }
      return { x: Number(snap(x).toFixed(2)), y: Number(snap(y).toFixed(2)) };
    }

    _setCell(roof, c, r, on, drag) {
      const id = `${roof}:${c}:${r}`;
      if (drag.done.has(id)) return;
      drag.done.add(id);
      const lay = this.edit.layout;
      const L = this.layout;
      const panels = { ...(lay.panels || {}) };
      for (const k of Object.keys(L.roofs)) if (!Array.isArray(panels[k])) panels[k] = this.pos.cells[k].map((q) => [...q]);
      const list = panels[roof].filter(([a, b]) => !(a === c && b === r));
      if (on) list.push([c, r]);
      panels[roof] = list;
      lay.panels = panels;
      this._redraw(true);
    }

    _click(e) {
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      const button = target && target.closest ? target.closest("[data-ed]") : null;
      if (!button) return;
      e.stopPropagation();
      const what = button.dataset.ed;
      const m = this.model;
      if (what === "open") {
        const saved = (m.layout && m.layout[m.layoutKey || m.house || "classic"]) || {};
        this.edit = { tab: "things", sel: null, undo: [], layout: JSON.parse(JSON.stringify(saved)) };
        this.view = null;
        this._redraw(true);
        return;
      }
      if (!this.edit) return;
      const lay = this.edit.layout;
      if (what === "tab") {
        this.edit.tab = button.dataset.tab;
        this.edit.sel = null;
      } else if (what === "undo") {
        const last = this.edit.undo.pop();
        if (last) this.edit.layout = JSON.parse(last);
      } else if (what === "reset") {
        this._remember();
        const tab = this.edit.tab;
        if (tab === "things") delete lay.things;
        else if (tab === "wires") delete lay.wires;
        else if (tab === "panels") delete lay.panels;
        else if (tab === "labels") delete lay.labels;
      } else if (what === "reset-wire" && this.edit.sel && lay.wires) {
        this._remember();
        delete lay.wires[this.edit.sel];
      } else if (what === "cancel") {
        this.edit = null;
        this.view = null;
      } else if (what === "save") {
        const layout = JSON.parse(JSON.stringify(lay));
        for (const k of Object.keys(layout)) if (!layout[k] || (typeof layout[k] === "object" && !Array.isArray(layout[k]) && !Object.keys(layout[k]).length)) delete layout[k];
        const house = m.layoutKey || m.house || "classic";
        const done = () => {
          // Shown as saved at once; the state from Home Assistant says the same a moment later.
          this.model.layout = { ...(this.model.layout || {}), [house]: layout };
          this.edit = null;
          this.view = null;
          this._redraw(true);
        };
        if (this.onSave) {
          button.disabled = true;
          Promise.resolve(this.onSave(layout, house)).then((ok) => (ok === false ? (button.disabled = false) : done()));
        } else done();
        return;
      }
      this._redraw(true);
    }

    // The button that opens the editor, and the editor's bar under the picture.
    _tools(m) {
      const tools = this.el.querySelector(".cs-tools");
      if (!tools) return;
      if (!this.edit) {
        tools.innerHTML = m.canEdit ? `<button class="cs-editbtn" data-ed="open" type="button"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${this.t("edit_open")}</button>` : "";
        return;
      }
      const tab = this.edit.tab;
      const tabs = ["things", "wires", ...(m.solar ? ["panels"] : []), "labels"];
      const count = m.solar ? Object.values(this.pos.cells).reduce((t, c) => t + c.length, 0) : 0;
      const reset = { things: "edit_reset_things", wires: "edit_reset_wires", panels: "edit_reset_panels", labels: "edit_reset_labels" }[tab];
      const own = tab === "wires" && this.edit.sel && this.edit.layout.wires?.[this.edit.sel];
      tools.innerHTML = `<div class="cs-bar">
        <div class="cs-tabs" role="tablist">${tabs.map((k) => `<button type="button" role="tab" data-ed="tab" data-tab="${k}" aria-selected="${k === tab}" class="${k === tab ? "on" : ""}">${this.t(`edit_${k}`)}</button>`).join("")}</div>
        <p class="cs-hint">${this.t(`edit_hint_${tab}`)}${tab === "panels" ? ` · ${this.t("edit_count", { n: count })}` : ""}</p>
        <div class="cs-acts">
          <button type="button" data-ed="undo" ${this.edit.undo.length ? "" : "disabled"}>${this.t("edit_undo")}</button>
          <button type="button" data-ed="reset">${this.t(reset)}</button>
          ${own ? `<button type="button" data-ed="reset-wire">${this.t("edit_reset_wire")}</button>` : ""}
          <span class="cs-gap"></span>
          <button type="button" data-ed="cancel">${this.t("edit_cancel")}</button>
          <button type="button" data-ed="save" class="primary">${this.t("edit_save")}</button>
        </div>
      </div>`;
    }
  }

  Scene.BODIES = Object.keys(BODIES);
  Scene.HOUSES = Object.keys(LAYOUTS);
  Scene.preview = (kind, paint) => {
    const body = BODIES[kind] || BODIES.sedan;
    const [cx, cy] = P(8.5, 2.6 + body.L / 2, 0.75);
    return `<svg viewBox="${f1(cx - 95)} ${f1(cy - 62)} 190 124" xmlns="http://www.w3.org/2000/svg">${defs()}<rect x="${f1(cx - 95)}" y="${f1(cy - 62)}" width="190" height="124" fill="url(#cs-bg)"/>${car(8.5 - body.Wd / 2, 2.6, kind, paint)}</svg>`;
  };
  return Scene;
})();

const CLAY_CSS = `
.cscene { position: relative; border-radius: 18px; overflow: hidden; container-type: inline-size; background: #F2F3F6; transition: background 1.5s; }
.cscene .cs-main [data-r] { transition: fill 1.5s, stroke 1.5s, opacity 1.5s, stop-color 1.5s; }
.cscene .cs-main .cs-stars, .cscene .cs-main .cs-lights, .cscene .cs-main .cs-car { transition: opacity 1.5s, filter 1.5s; }
.cscene.cs-instant, .cscene.cs-instant * { transition: none !important; }
.cscene .cs-stars circle { fill: #fff; }
.cscene.is-dark .cs-stars circle { animation: cs-twinkle 4s ease-in-out infinite; animation-delay: var(--d); }
@keyframes cs-twinkle { 50% { opacity: .25; } }
.cscene svg { display: block; width: 100%; height: auto; }
.cscene .cs-pic { position: relative; }
.cscene .cs-leaders { position: absolute; inset: 0; height: 100%; pointer-events: none; }
.cscene .cs-leader { stroke: #9AA3B2; stroke-width: 1.1; fill: none; }
.cscene .cs-led { stroke: #9AA6B4; }
.cscene .pulse { animation: cs-pulse 2.4s ease-in-out infinite; }
@keyframes cs-pulse { 50% { opacity: .35; } }
.cscene .cs-glowbar { filter: url(#cs-pkglow); opacity: .9; }
.cscene .cs-bolt { fill: #F5B92E; filter: drop-shadow(0 0 2px #F5B92E); }
.cscene .cs-heatled { fill: #5A616B; }
.cscene.heat-on .cs-heatled { fill: #22C981; filter: drop-shadow(0 0 2px #22C981); }
.cscene .cs-sheen { opacity: 0; }
.cscene.sun-on .cs-sheen { animation: cs-sheen 6s ease-in-out infinite; }
.cscene .cs-fan { transform-box: fill-box; transform-origin: center; animation: cs-spin 1.6s linear infinite; animation-play-state: paused; }
.cscene.heat-on .cs-fan { animation-play-state: running; }
.cscene .cs-carglow { animation: cs-breathe 2.4s ease-in-out infinite; }
.cscene .cs-labels { position: absolute; inset: 0; pointer-events: none; }
.cs-label { position: absolute; transform: translate(-50%, -50%); width: max-content; pointer-events: auto; cursor: pointer; border: 0; font: inherit;
  background: rgba(255,255,255,.94); color: #141A22; border-radius: 999px; padding: 3px 9px 3px 4px; font-size: 12px; font-weight: 600;
  display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(20,26,34,.14), 0 0 0 1px rgba(20,26,34,.06); backdrop-filter: blur(4px); animation: cs-pop .5s cubic-bezier(.2,.8,.2,1) both; transition: background 1.5s, color 1.5s; }
.is-dark .cs-label { background: rgba(23,28,36,.9); color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.06); }
.cs-label .cs-dot { width: 7px; height: 7px; border-radius: 50%; background: #9AA3B2; flex: none; margin-left: 4px; }
.cs-label.on .cs-dot { background: #22C981; box-shadow: 0 0 6px #22C981; }
.cs-label.on.sun .cs-dot { background: #FFB224; box-shadow: 0 0 6px #FFB224; }
.cs-label .cs-t { display: none; }
.cs-label.open .cs-t { display: inline; }
.cs-label .cs-v { color: #3A4250; font-variant-numeric: tabular-nums; }
.is-dark .cs-label .cs-v { color: #E3E7EC; }
.cs-label .cs-dir { width: 12px; height: 12px; margin-left: -2px; stroke-width: 2.2; }
.cs-label .cs-icon { width: 16px; height: 16px; flex: none; margin-left: 2px; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.cs-label .cs-ring { width: 18px; height: 18px; flex: none; transform: rotate(-90deg); }
.cs-label .cs-ring .r0 { fill: none; stroke: #DCE1E8; stroke-width: 3; }
.is-dark .cs-label .cs-ring .r0 { stroke: #3A3F47; }
.cs-label .cs-ring .r1 { fill: none; stroke: #22C981; stroke-width: 3; stroke-linecap: round; }
@keyframes cs-pop { from { opacity: 0; transform: translate(-50%, -30%) scale(.9); } }
@container (max-width: 560px) {
  .cs-label { font-size: 10.5px; padding: 2px 7px 2px 3px; gap: 4px; }
  .cs-label .cs-ring { width: 15px; height: 15px; }
}
/* The editor: a button to open it, what can be grabbed, and its bar under the picture. */
.cscene .cs-tools { position: relative; }
.cscene .cs-editbtn { position: absolute; right: 10px; bottom: calc(100% - 0px); transform: translateY(-10px); display: flex; align-items: center; gap: 5px; border: 0; border-radius: 999px; padding: 5px 11px 5px 9px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(255,255,255,.9); color: #141A22; box-shadow: 0 2px 8px rgba(20,26,34,.15); z-index: 2; }
.is-dark .cs-editbtn { background: rgba(23,28,36,.9); color: #fff; }
.cscene .cs-editbtn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.cscene.editing { user-select: none; -webkit-user-select: none; }
.cscene.editing .cs-main, .cscene.editing .cs-label { touch-action: none; }
.cscene.editing .cs-label:not(.drag) { pointer-events: none; }
.cscene.editing .cs-pk, .cscene.editing .cs-labels .cs-label:not(.drag) { opacity: .55; }
.cscene.editing .cs-pk { display: none; }
.cscene .cs-hit { fill: rgba(59,139,255,.06); stroke: #3B8BFF; stroke-width: 1.2; stroke-dasharray: 4 3; cursor: grab; }
.cscene .cs-hit.sel { fill: rgba(59,139,255,.16); stroke-dasharray: none; }
.cscene .cs-route { fill: none; stroke: #3B8BFF; stroke-width: 1; stroke-dasharray: 3 3; opacity: .5; pointer-events: none; }
.cscene .cs-route.sel { opacity: 1; stroke-width: 1.6; }
.cscene .cs-seg { fill: none; stroke: transparent; stroke-width: 14; cursor: grab; pointer-events: stroke; }
.cscene .cs-seg.fixed { cursor: default; }
.cscene .cs-grip { fill: #fff; stroke: #3B8BFF; stroke-width: 1.4; cursor: grab; }
.cscene .cs-grip.sel { fill: #3B8BFF; }
.cscene .cs-cell { fill: rgba(255,255,255,.03); stroke: rgba(59,139,255,.75); stroke-width: .8; stroke-dasharray: 3 2; cursor: pointer; }
.cscene .cs-cell.on { fill: rgba(59,139,255,.18); stroke-dasharray: none; }
.cs-label.drag { cursor: grab; outline: 1.5px dashed #3B8BFF; outline-offset: 2px; }
.cscene .cs-bar { display: grid; gap: 8px; padding: 10px 12px 12px; background: var(--card-background-color, #fff); color: var(--primary-text-color, #141A22); border-top: 1px solid var(--divider-color, rgba(0,0,0,.08)); }
.cscene .cs-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.cscene .cs-bar button { border: 1px solid var(--divider-color, rgba(0,0,0,.12)); background: transparent; color: inherit; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.cscene .cs-bar button:disabled { opacity: .4; cursor: default; }
.cscene .cs-tabs button.on, .cscene .cs-bar button.primary { background: var(--primary-color, #00B894); border-color: var(--primary-color, #00B894); color: var(--text-primary-color, #fff); }
.cscene .cs-hint { margin: 0; font-size: 12.5px; color: var(--secondary-text-color, #5B6676); }
.cscene .cs-acts { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.cscene .cs-gap { flex: 1; }
@keyframes cs-breathe { 50% { opacity: .45; } }
@keyframes cs-sheen { 0%, 60% { opacity: 0; } 80% { opacity: .5; } 100% { opacity: 0; } }
@keyframes cs-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .cscene * { animation: none !important; } }
`;

/* A state from EV Planner, or what changed since the last one (websocket.py, state_patch):
   the parts that are the same are kept as they are. */
function mergeState(last, message) {
  if (!message.patch || !last) return message.patch ? null : message;
  const next = { ...last, ...message.patch };
  for (const key of message.gone || []) delete next[key];
  for (const [key, changed] of Object.entries(message.items || {})) {
    next[key] = (last[key] || []).map((item) => changed[item.id] || item);
  }
  return next;
}

class EvPlannerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const tab = this._read(TAB_KEY);
    this._tab = TABS.includes(tab) ? tab : "cars";
    this._carId = this._read(CAR_KEY) || null;
    // How many choices the car page shows: Simple, Smart (as before) or Expert.
    const level = this._read(LEVEL_KEY);
    this._level = LEVELS.includes(level) ? level : "smart";
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
    this.toggleAttribute("dark", !!hass?.themes?.darkMode);
    this.toggleAttribute("light", hass?.themes?.darkMode === false);
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
    else if (kind === "charger" && id) [this._tab, this._carId, this._chargerId] = ["home", null, id];
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
    if (this._chargerId) return `charger/${encodeURIComponent(this._chargerId)}`;
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
    if (this._hass && !this._unsub && !this._subscribing) this._subscribe();
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
    // One subscription at a time: Home Assistant gives the panel `hass` and then puts it on the
    // page, and both ask for one. An answer that comes after the panel has left is given back.
    const ask = (this._subAsk = (this._subAsk || 0) + 1);
    this._subscribing = true;
    try {
      const unsub = await connection.subscribeMessage((event) => ask === this._subAsk && this._onState(event), { type: "ev_household_planner/subscribe", changes: true });
      if (ask === this._subAsk) this._unsub = unsub;
      else Promise.resolve(unsub()).catch(() => {});
    } catch (err) {
      if (ask === this._subAsk) this._showError(err);
    }
    if (ask === this._subAsk) this._subscribing = false;
  }

  _unsubscribe() {
    // A subscription still on its way is no longer wanted.
    this._subAsk = (this._subAsk || 0) + 1;
    this._subscribing = false;
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
    state = mergeState(this._state, state);
    if (!state) {
      // A change without the state it changes: ask again from the start.
      this._subscribe();
      return;
    }
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
    try {
      return await this._hass.callWS(message);
    } catch (err) {
      // 3: the connection to Home Assistant was lost (a phone waking up, a network change).
      // It comes back by itself in a moment: send the command once more then.
      if ((err?.code ?? err) !== 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return this._hass.callWS(message);
    }
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
    // A car's messages in Settings work on that car as its own page does.
    if (this._tab === "settings") return this._ncar ? this._car(this._ncar) : null;
    return this._tab === "cars" && this._carId ? this._car(this._carId) : null;
  }

  _charger(id) {
    return this._chargers.find((c) => c.id === id) || null;
  }

  get _currentCharger() {
    return this._tab === "home" && this._chargerId ? this._charger(this._chargerId) : null;
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
    if (this._tab === "cars") return this._carId ? `car:${this._carId}` : "cars";
    if (this._tab === "home" && this._chargerId) return `charger:${this._chargerId}`;
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
    if (this._popup) this._renderPopup();
    if (this._tab === "cars" && this.shadowRoot.querySelector(".car-page.view-now")) this._renderCarPage({ live: false });
    if (this._tab === "guest" && this.shadowRoot.querySelector(".guest-page")) {
      this._renderGuestHead();
      this._renderGuestInputs();
    }
  }

  _showError(err) {
    const code = err?.code || err?.error?.code || (typeof err === "number" ? err : undefined);
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
    this._sheet = null;
    this._chargerId = null;
    this._write(TAB_KEY, tab);
    this._syncPath();
    this._render();
    this.shadowRoot.querySelector(".content").scrollTop = 0;
  }

  _openCar(id, { render = true } = {}) {
    if (id !== this._carId) {
      this._carView = "now";
      this._sheet = null;
    }
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
    this._tab = "home";
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

  /* A sheet inside the page, so its buttons and fields work like the rest of the page. */
  _openSheet(name) {
    this._sheet = name || null;
    this._render();
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
    await this._run("mode", "ev_household_planner/vehicle_set", { vehicle_id: id, settings: { mode } });
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
    if (this._tab === "settings") this._render();
    else this._renderCarPage({ live: false });
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
      await this._ws("ev_household_planner/vehicle_set", { vehicle_id: id, settings: changes });
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
    if (this._tab === "settings") this._render();
    else this._renderCarPage();
  }

  async _loadCarPreview() {
    const id = this._vdraftId;
    if (!id || !Object.keys(this._vdraft).length) return;
    const settings = { ...this._vdraft };
    const ask = JSON.stringify([id, settings]);
    this._vpreviewAsk = ask;
    try {
      const result = await this._ws("ev_household_planner/vehicle_preview", { vehicle_id: id, settings });
      if (this._vpreviewAsk !== ask) return;
      this._vpreview = { id, ...result };
    } catch {
      if (this._vpreviewAsk === ask) this._vpreview = null;
    }
    if (this._drafting({ id })) this._renderCarPage();
  }

  /* A household setting shown at once, and stored (without a "saved" note, for many small changes). */
  _setHousehold(settings) {
    this._state = { ...this._state, settings: { ...(this._state.settings || {}), ...settings } };
    this._render();
    this._run("settings", "ev_household_planner/settings", { settings });
  }

  /* The departures, with one changed by ``fn`` (or the list by ``fn`` when no id is given). */
  _changeDeps(id, fn) {
    const list = (this._state.settings?.departures || []).map((d) => ({ ...d }));
    const next = id === null ? fn(list) : list.map((d) => (d.id === id ? fn(d) : d));
    this._setHousehold({ departures: next.map(({ name, ...d }) => (name ? { ...d, name } : d)) });
  }

  async _saveSettings(settings) {
    if (await this._run("settings", "ev_household_planner/settings", { settings })) this._toast(this._t("saved"));
  }

  async _deleteHistory(vehicleId, historyId) {
    const data = {};
    if (vehicleId) data.vehicle_id = vehicleId;
    if (historyId) data.history_id = historyId;
    await this._run("delete", "ev_household_planner/delete_history", data);
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
    if (this._tab === "home" && !this._homeShown) this._tab = "cars";
    if (this._tab === "guest") content.innerHTML = this._guestHtml();
    else if (this._tab === "home" && this._currentCharger) content.innerHTML = this._chargerPageHtml(this._currentCharger);
    else if (this._tab === "home") content.innerHTML = this._homeHtml();
    else if (this._tab === "history") content.innerHTML = this._historyHtml();
    else if (this._tab === "settings") content.innerHTML = this._settingsHtml();
    else if (car) content.innerHTML = this._carPageHtml(car);
    else if (this._currentCharger) content.innerHTML = this._chargerPageHtml(this._currentCharger);
    else content.innerHTML = this._overviewHtml();
    if (this._tab === "home" && !this._currentCharger) this._mountScene();
    if (this._tab === "history") this._afterHistory();
    if (this._tab === "home" && !this._currentCharger) this._afterHome();
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
    const problems = this._cars.filter((v) => this._troubled(v)).length;
    const html = TABS.filter((tab) => tab !== "home" || this._homeShown).map((tab) => {
      const on = this._tab === tab;
      const icon = { cars: "car", home: "home", guest: "guest", history: "history", settings: "settings" }[tab];
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
        else if (button.dataset.tab === "home" && this._tab === "home" && this._chargerId) this._openCharger(null);
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

  /* What a household sets up, in order: what is needed for a plan first, then what can wait. */
  _setupSteps() {
    const state = this._state || {};
    const sites = state.sites || [];
    const parts = sites.flatMap((site) => site.parts || []);
    return [
      // Done when prices can be read; a hole or an odd unit is said in the car's notes, not here.
      { key: "prices", need: true, done: !!state.config?.price_entity && (state.prices || []).length > 0 && state.price_issue !== "stale" },
      { key: "car", need: true, done: this._cars.length > 0 },
      { key: "charger", need: true, done: this._chargers.length > 0 },
      { key: "supply", done: !!state.supply || sites.some((site) => site.supply) },
      { key: "energy", done: parts.length > 0 || !!state.solar || !!state.heat_pump },
      { key: "notify", done: (state.config?.notify || []).length > 0 },
    ];
  }

  // Shown until there is a car, a charger and prices: the steps, with what is done ticked off.
  _setupHtml() {
    const steps = this._setupSteps();
    if (steps.every((step) => step.done || !step.need)) return "";
    const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12.5 3.6 3.6 7.4-8"/></svg>';
    const rows = steps
      .map((step, i) => `<li class="${step.done ? "done" : ""} ${step.need ? "" : "later"}" data-step="${step.key}"><span class="setup-mark">${step.done ? tick : i + 1}</span><span class="setup-what"><b>${this._t(`setup_${step.key}`)}${step.need || step.done ? "" : ` <small>${this._t("setup_optional")}</small>`}</b><span>${step.key === "prices" && !step.done && this._state.config?.price_entity ? this._t("setup_prices_fix", { sensor: esc(this._entityName(this._state.config.price_entity)) }) : this._t(`setup_${step.key}_text`)}</span></span></li>`)
      .join("");
    const done = steps.filter((step) => step.done).length;
    return `<section class="panel setup"><div class="panel-head"><h2>${MARK}<span>${this._t("setup_title")}</span></h2><span class="setup-count">${this._t("setup_count", { done, all: steps.length })}</span></div>
      <p class="hint">${this._t("setup_text")}</p><ol class="setup-steps">${rows}</ol>
      <a class="btn primary" href="/config/integrations/integration/ev_household_planner" target="_top">${ICONS.plus}<span>${this._t("open_integration")}</span></a></section>`;
  }

  _overviewHtml() {
    const cars = this._cars;
    const setup = this._setupHtml();
    const list = cars.length
      ? `<div class="cars-grid">${cars.map((v) => this._carCardHtml(v)).join("")}</div>`
      : setup
        ? ""
        : `<section class="empty panel">${MARK}<h2>${this._t("no_cars_title")}</h2><p>${this._t("no_cars_text")}</p>
          <a class="btn primary" href="/config/integrations/integration/ev_household_planner" target="_top">${ICONS.plus}<span>${this._t("add_car")}</span></a></section>`;
    return `<div class="page stack">${setup}${list}</div>`;
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
              ${!plan && v.plan_error && TEXT.en[`vstatus_${v.plan_error}`] ? `<div class="wide"><dd class="soft">${esc(this._t(`vstatus_${v.plan_error}`))}</dd></div>` : ""}
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

  /* Something to see to: a command that is tried again by itself is not, until it has failed a few times. */
  _troubled(v) {
    return !!(v.problem || (v.control_error && v.control_error !== "finding_charger" && !v.control_retry));
  }

  _statusTone(v) {
    if (this._troubled(v)) return "coral";
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
    if (v.control_error === "rate_limited") notes.push(["warn", this._t("rate_limited")]);
    else if (v.control_error === "finding_charger") notes.push(["info", this._t("finding_charger")]);
    else if (v.control_retry) notes.push(["info", this._t("control_retry", { time: this._time(v.control_retry) })]);
    else if (v.control_error) {
      const text = v.control_error === "no_control_entity" ? this._t("no_control_entity") : this._t("control_error", { error: v.control_error });
      notes.push(["bad", text]);
    }
    if (isNum(v.car_limit) && isNum(v.target) && Number(v.car_limit) + 0.5 < Number(v.target)) {
      notes.push(["warn", this._t("note_car_limit", { limit: this._pct(v.car_limit), target: this._pct(v.target) })]);
    }
    if (!compact && v.resumes === false) notes.push(["info", this._t("note_no_resume", { name: v.name }), "forget-resume"]);
    if (!compact && this._state.price_issue) notes.push(["warn", this._t(`price_issue_${this._state.price_issue}`)]);
    const solar = this._state.solar;
    if (!compact && solar && v.connected && ["surplus", "only"].includes(v.settings?.solar)) {
      const now = solar.cars?.[v.id];
      const sold = solar.sold?.[v.id];
      if (sold) notes.push(["info", this._t("solar_note_sold", { sold: this._money(sold.sold_for), plan: this._money(sold.plan) })]);
      else if (now?.on) {
        const amps = isNum(now.amps) ? `${Math.round(now.amps)} A` : "";
        notes.push(["info", this._t("solar_note_on", { amps, phases: now.phases === 1 ? this._t("solar_phase_1") : "" })]);
      } else if (v.plan_error === "solar_expected") notes.push(["info", this._t("solar_note_expected")]);
      else if (v.reason === "waiting") notes.push(["info", this._t("solar_note_waiting", { kw: v.has_current ? "4,1 kW" : `${String(v.charge_power ?? 11).replace(".", ",")} kW` })]);
    }
    const supply = this._state.supply;
    if (!compact && supply && v.connected && plan) {
      const amps = (a) => `${Math.round(Number(a))} A`;
      const house = isNum(supply.house_expected) ? amps(supply.house_expected) : "–";
      notes.push(["info", isNum(v.supply_amps)
        ? this._t("supply_note", { amps: amps(v.supply_amps), house, limit: amps(supply.limit) })
        : this._t("supply_wait", { house, limit: amps(supply.limit) })]);
      const short = supply.short?.[v.id];
      if (isNum(short)) notes.push(["warn", this._t("supply_short", { kwh: this._kwh(short) })]);
    }
    if (plan) {
      if (plan.min_only) notes.push(["warn", this._t("note_min_only")]);
      else if (plan.limited) notes.push(["warn", this._t("note_limited")]);
      if (plan.short) {
        const deadline = plan.deadline ?? v.deadline;
        notes.push(["warn", deadline ? this._t("note_short", { time: this._time(deadline) }) : this._t("note_short_plain")]);
      }
      if (!compact && plan.opportunistic && isNum(plan.ceiling)) notes.push(["info", this._t("note_opportunistic", { price: this._money(plan.ceiling) })]);
      if (!compact && plan.joined) notes.push(["info", this._t("note_joined", { extra: this._money(plan.joined_extra || 0) })]);
    }
    // Which prices the plan is made from, when it matters: one button, and what the other would cost.
    let basis = "";
    const known = !!v.settings?.known_prices;
    if (plan && (v.plan_forecast || known)) {
      const diff = isNum(v.plan_other_cost) && isNum(plan.cost) ? Number(v.plan_other_cost) - Number(plan.cost) : null;
      const cost = diff === null || Math.abs(diff) < 0.005 ? "" : `<span class="basis-diff ${diff < 0 ? "less" : "more"}">${diff < 0 ? "−" : "+"}${this._money(Math.abs(diff))}</span>`;
      basis = `<p class="basis"><span>${this._t(known ? "basis_known" : "basis_forecast")}</span><button class="btn ghost small" data-act="${known ? "forecast-prices" : "known-prices"}" data-id="${esc(v.id)}">${this._t(known ? "note_known_do" : "note_forecast_do")}${cost}</button></p>`;
    }
    if (!notes.length) return compact && !basis ? "" : `<div class="notes">${basis}</div>`;
    return `<div class="notes">${basis}${notes
      .map(
        ([kind, text, act, label]) =>
          `<p class="note-line ${kind}">${ICONS[kind === "info" ? "info" : "warn"]}<span>${esc(text)}</span>${
            act ? `<button class="btn ghost small" data-act="${act}" data-id="${esc(v.id)}">${label || this._t("try_again")}</button>` : ""
          }</p>`,
      )
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
      const result = await this._ws("ev_household_planner/restore_image", { target_id: id });
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
    const result = await this._ws("ev_household_planner/set_image", { target_id: id, image_id: item.id, cutout });
    this._dropImages(result?.unused);
    return result;
  }

  _refreshPhotos() {
    if (this._currentCar) this._update();
    else this._render();
  }

  async _removePhoto(id) {
    try {
      const result = await this._ws("ev_household_planner/set_image", { target_id: id, image_id: null });
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
          const plugged = this._chargerWho(c);
          const model = c.model?.startsWith("generic_") ? this._t(`model_${c.model}`) : c.model_title;
          const details = [this._chargerSite(c), model, isNum(c.power) ? `${this._num(c.power)} kW` : "", plugged].filter(Boolean).join(" · ");
          return `<li class="ctl-${esc(c.control || "released")}">${this._photoHtml(c.id, c.image, chargerArt(c.style), { small: true, original: c.image_original })}
            <button class="ch-open" data-act="open-charger" data-id="${esc(c.id)}" data-f="ch-${esc(c.id)}" aria-label="${esc(this._t("open_charger", { name: c.name }))}"><strong><i aria-hidden="true"></i>${esc(c.name)}</strong><span>${esc(details)}</span></button>
            <b>${esc(text)}</b></li>`;
        })
        .join("")}</ul>
    </section>`;
  }

  /* Who is at a charger: the car's name, the guest, an unknown car, or just whether a car is plugged in. */
  _chargerWho(c) {
    if (c.unknown) return this._t("car_unknown");
    if (c.occupant === "guest") return this._t("who_guest");
    const car = c.occupant ? this._cars.find((v) => v.id === c.occupant) : null;
    if (car) return this._t("who_car", { name: car.name });
    return c.connected === true ? this._t("car_plugged") : c.connected === false ? this._t("car_unplugged") : "";
  }

  /* The place a charger is at, when it is not the home. */
  _chargerSite(c) {
    return (this._state?.sites || []).find((site) => site.id === c.site && !site.home)?.name || "";
  }

  /* On a charger's page: who is at it, and the cars it can be when EV Planner got it wrong or cannot tell. */
  _chargerWhoHtml(c) {
    const floating = this._cars.filter((v) => v.finds_charger);
    if (!c.unknown && !(c.occupant && c.found_by)) return "";
    const ids = c.unknown ? c.choices || [] : floating.filter((v) => v.id !== c.occupant && !v.charger).map((v) => v.id);
    const cars = ids.map((id) => this._cars.find((v) => v.id === id)).filter(Boolean);
    const chip = (who, name) =>
      `<button data-act="occupant" data-id="${esc(c.id)}" data-who="${esc(who)}" data-f="who-${esc(c.id)}-${esc(who)}">${esc(name)}</button>`;
    const chips = [...cars.map((v) => chip(v.id, v.name)), c.occupant === "guest" ? "" : chip("guest", this._t("who_pick_guest"))].join("");
    const text = c.unknown ? this._t("who_ask") : this._t(`who_${c.found_by === "chosen" ? "chosen" : "found"}`, { who: this._chargerWho(c) });
    return `<section class="panel who ${c.unknown ? "ask" : ""}">
      <h2>${ICONS.car}<span>${esc(c.unknown ? this._t("car_unknown") : this._t("who_title"))}</span></h2>
      <p>${esc(text)}</p>
      ${chips ? `<p class="hint">${esc(c.unknown ? this._t("who_pick") : this._t("who_other"))}</p><div class="chips">${chips}</div>` : ""}
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
    const plugged = this._chargerWho(c);
    const details = [this._chargerSite(c), model, isNum(c.power) ? `${this._num(c.power)} kW` : "", plugged].filter(Boolean).join(" · ");
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
      ${this._chargerWhoHtml(c)}
      <h2 class="section-title">${ICONS.car}<span>${this._t("charger_cars")}</span></h2>
      ${cars.length ? `<div class="cars-grid">${cars.map((v) => this._carCardHtml(v)).join("")}</div>` : `<p class="hint">${this._t("charger_no_cars")}</p>`}
      ${g && (!g.charger || g.charger.id === c.id) ? `<div class="side-grid">${this._guestCardHtml()}</div>` : ""}
    </div>`;
  }

  // ------------------------------------------------------------------ the price clock (shared)

  /* Prices from now and one day ahead: the ring of the clock. */
  /* The prices where the open car is (a place of its own may have its own), else the household's. */
  _prices() {
    return this._currentCar?.prices || this._state?.prices || [];
  }

  _dayPrices() {
    const now = Date.now();
    const end = now + 24 * 3600 * 1000;
    return this._prices().filter((p) => new Date(p.end).getTime() > now && new Date(p.start).getTime() < end);
  }

  /* The ceiling to draw: the one the plan used (after opportunistic charging), or the setting. */
  _ceilingOf(v, settings, plan) {
    if (plan && isNum(plan.ceiling)) return Number(plan.ceiling);
    if (settings?.price_ceiling_enabled && !settings.price_ceiling_relative && isNum(settings.price_ceiling)) return Number(settings.price_ceiling);
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
    // The price ceiling as a thin ring: bars that reach past it are the hours the car leaves out.
    if (!mini && ceiling !== null && max > min && ceiling > min && ceiling < max) {
      const rc = inner + 8 + ((ceiling - min) / (max - min)) * (outer - inner - 8);
      html += `<circle class="ceil-ring" cx="${cx}" cy="${cy}" r="${rc.toFixed(1)}"><title>${this._money(ceiling)}</title></circle>`;
    }
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
    // Three numbers (the dial has the price, the window and the saving); the guest's measured ones after them.
    const compact = this._tab === "cars" || this._tab === "guest";
    const items = compact
      ? [
          [this._t("duration"), this._duration(plan.minutes)],
          [this._t("energy"), this._kwh(plan.energy)],
          [this._t("avg_price"), Number(plan.energy) > 0 && isNum(plan.cost) ? `${this._money(plan.cost / plan.energy)}/kWh` : "–"],
          ...(this._tab === "guest" ? extra : []),
        ]
      : [
          [this._t("start"), `${this._day(plan.segments[0].start)} ${this._time(plan.segments[0].start)}`],
          [this._t("end"), `${this._day(plan.segments.at(-1).end)} ${this._time(plan.segments.at(-1).end)}`],
          [this._t("duration"), this._duration(plan.minutes)],
          [this._t("energy"), this._kwh(plan.energy)],
          [this._t("cost"), this._money(plan.cost)],
          [this._t("savings"), isNum(plan.savings) ? this._money(plan.savings) : "–"],
          [this._t("speed"), `${this._num(plan.speed)} %/${this._t("hours_short")}`],
          ...extra,
        ];
    box.innerHTML = `<dl class="${plan.preview ? "is-preview" : ""}${compact ? " three" : ""}">${items
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("")}</dl>${
      plan.savings > 0.005 && !plan.preview && !compact
        ? `<p class="save-note">${this._t("save", { amount: this._money(plan.savings) })}${compact ? "" : ` ${this._t("save_vs")}`}</p>`
        : ""
    }`;
  }

  /* The two-day price graph with the charging periods, the deadline, the ceiling and now. */
  _renderTimeline(plan, { deadline = null, ceiling = null, actual = [] } = {}) {
    const svg = this.shadowRoot.querySelector(".timeline");
    if (!svg) return;
    const prices = this._prices();
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

    // When it really charged: a band along the bottom.
    let charged = 0;
    for (const period of actual) {
      const a = clamp(x(new Date(period.start).getTime()), 0, W);
      const b = clamp(x(new Date(period.end).getTime()), 0, W);
      if (b <= a) continue;
      charged += 1;
      html += `<rect x="${a}" y="${H - bottom + 3}" width="${Math.max(3, b - a)}" height="6" rx="3" class="tl-done"/>`;
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
    this.shadowRoot.querySelector(".done-key")?.toggleAttribute("hidden", !charged);
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
          <span class="done-key"><i class="sw done"></i>${this._t("legend_charged")}</span>
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
      targetSteps: Array.isArray(v.target_steps) ? v.target_steps.map(Number) : null,
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
      if (this._tab !== "guest" && !model.canNow && !known) lines.push(this._t("soc_from_car"));
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
      const value = clamp(model.soc === null ? v : Math.max(v, model.soc + 1), 0, 100);
      return snapTarget(model, value);
    };
    // The car's own limit takes steps (a Skoda: tens from 50 %): the target goes in the same steps.
    const snapTarget = (model, value) => {
      const steps = model.targetSteps;
      if (!steps || !(steps[2] > 1)) return value;
      const [low, high, step] = steps;
      return clamp(low + Math.round((value - low) / step) * step, low, high);
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
        const step = key === model.targetKey && model.targetSteps?.[2] > 1 ? model.targetSteps[2] * Math.sign(delta) : delta;
        model.set({ [key]: bound(model, key, current + step) });
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
      else if (model.canTarget && (model.soc === null || v > model.soc)) model.set({ [model.targetKey]: snapTarget(model, v) });
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
    const view = this._embed ? "now" : CAR_VIEWS.includes(this._carView) ? this._carView : "now";
    const views = this._embed
      ? ""
      : `<nav class="car-views segmented" role="tablist" aria-label="${esc(v.name)}">${CAR_VIEWS.map(
          (k) => `<button role="tab" data-act="car-view" data-view="${k}" data-f="cv-${k}" aria-selected="${k === view}" class="${k === view ? "on" : ""}">${this._t(`view_${k}`)}</button>`,
        ).join("")}</nav>`;
    if (view === "rules") {
      return `<div class="page stack car-page view-rules" data-id="${esc(v.id)}">
        <header class="car-head"></header>${views}
        <div class="tiles"></div>
        <div class="sheet-slot"></div>
      </div>`;
    }
    if (view === "history") {
      return `<div class="page stack car-page view-history" data-id="${esc(v.id)}">
        <header class="car-head"></header>${views}
        ${this._learnedCarHtml(v)}
        ${this._carHistoryHtml(v)}
      </div>`;
    }
    return `<div class="page car-page view-now" data-id="${esc(v.id)}">
      <header class="car-head"></header>${views}

      <div class="col left">
        <section class="hero">
          <div class="dial-wrap">
            <svg class="dial big" viewBox="0 0 400 400" role="img" aria-label="${this._t("prices_title")}"></svg>
            <div class="dial-center big"></div>
          </div>
          <div class="status-line"></div>
          <div class="glance"></div>
        </section>
        <div class="car-notes"></div>
      </div>

      <div class="col right">
        <section class="panel charging">
          <h2>${ICONS.plan}<span>${this._t("charge")}</span></h2>
          ${this._modesHtml(v, { large: true })}
          ${this._batteryHtml()}
          <div class="go-box"></div>
          <details class="more week-more">
            <summary>${ICONS.calendar}<span>${this._t("schedule")}</span><small class="week-sum"></small></summary>
            <div class="schedule-box"></div>
          </details>
          <details class="more info-more">
            <summary>${ICONS.info}<span>${this._t("details")}</span></summary>
            <div class="car-info"></div>
          </details>
        </section>
      </div>

      <div class="car-stats">
        <section class="panel facts" hidden></section>
        <section class="panel forecast" hidden></section>
        <section class="panel last-charge" hidden></section>
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
    if (this._popup) this._renderPopup();

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

    if (root.querySelector(".car-page.view-rules")) {
      this._renderRules(v, s);
      return;
    }
    if (!root.querySelector(".car-page.view-now")) return;
    this._renderBattery();
    root.querySelector(".car-page .flow")?.classList.toggle("on", v.control === "charge");
    this._renderReadyChips("car", s.use_ready_by !== false, s.ready_by);
    this._renderSegmented('.plan-type[data-scope="car"]', Boolean(s.continuous));

    const schedule = s.schedule || {};
    this._patch(
      root.querySelector(".schedule-box"),
      JSON.stringify([schedule, s.ready_by, s.use_ready_by, this._schedDay, s.day_targets, s.day_climate, s.climate_temperature, v.climate, v.target_steps, s.target_soc, lang]),
      this._scheduleHtml(s, v),
    );
    this._patch(
      root.querySelector(".go-box"),
      JSON.stringify([v.trip, v.deadline, this._state.settings?.departures, this._weekSummary(s), this._tripPick, v.climate, s.climate_temperature, this._busy, lang]),
      this._goHtml(v, s),
    );
    const weekSum = root.querySelector(".week-sum");
    if (weekSum) weekSum.textContent = this._weekSummary(s);
    const last = root.querySelector(".last-charge");
    if (last) {
      const entry = (v.history || [])[0];
      last.hidden = !entry;
      this._patch(last, JSON.stringify([entry?.id, lang]), entry ? this._lastChargeHtml(entry) : "");
    }
    this._patch(
      root.querySelector(".car-info"),
      JSON.stringify([v.calendar, v.control_source, v.control_backup, v.paused_by, v.finds_charger, v.charger, v.power, v.capacity, v.charge_speed, v.charge_speed_source, v.charge_speed_learned_from, v.charge_power_source, v.curve, v.margin, v.receipt, lang]),
      this._carInfoHtml(v),
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
    if (!root.querySelector(".car-page.view-now")) return;
    const shown = this._carShown(v);
    const s = this._vs(v);
    const ceiling = this._ceilingOf(v, s, shown.plan);
    this._renderDial(shown.plan, { deadline: shown.deadline, flow: v.control === "charge", ceiling });
    const [kind, text] = this._carStatus(v, shown);
    this._renderStatusLine(kind, text);
    const extra = shown.plan && isNum(shown.plan.end_soc) ? [[this._t("target"), this._pct(shown.plan.end_soc)]] : [];
    this._renderFacts(shown.plan, extra);
    const forecast = root.querySelector(".car-page .forecast");
    if (forecast) {
      const points = this._socForecast(v, shown);
      forecast.hidden = !points;
      this._patch(forecast, JSON.stringify([points, this._lang]), points ? this._forecastHtml(points, shown.deadline) : "");
    }
    this._patch(root.querySelector(".car-notes"), JSON.stringify([v.problem, v.control_error, v.control_retry, v.car_limit, v.target, v.resumes, this._state.price_issue, this._state.supply, v.supply_amps, v.connected, v.plan_forecast, v.plan_other_cost, shown.plan?.cost, v.settings?.known_prices, shown.plan && [shown.plan.limited, shown.plan.min_only, shown.plan.short, shown.plan.opportunistic, shown.plan.ceiling], shown.deadline, this._lang]), this._notesHtml(v, shown.plan ? { ...shown.plan, deadline: shown.deadline } : null, { compact: true }));
    const glance = root.querySelector(".car-page .glance");
    if (glance) this._patch(glance, JSON.stringify([shown.deadline, shown.preview, shown.plan?.end_soc, v.target, v.calendar?.start, v.trip, this._lang]), this._glanceHtml(v, shown));
    this._renderTimeline(shown.plan, { deadline: shown.deadline, ceiling: s.price_ceiling_enabled || shown.plan?.opportunistic ? ceiling : null, actual: this._chargedPeriods(v) });
    root.querySelector(".ceiling-key")?.toggleAttribute("hidden", !(s.price_ceiling_enabled || shown.plan?.opportunistic));
    const note = root.querySelector(".car-page .ceil-note");
    if (note) {
      const prices = this._dayPrices().map((p) => p.price);
      const faded = ceiling !== null && prices.some((p) => p > ceiling);
      note.hidden = !faded;
      if (faded) note.textContent = this._t("ceiling_note", { price: this._money(ceiling) });
    }
  }

  /* Departure: one dropdown (the week plan, or once: the household's departures), and the climate. */
  _goHtml(v, s) {
    const trip = v.trip;
    const deps = this._state.settings?.departures || [];
    const kinds = deps.map((d) => d.id);
    const label = (d) => (d.id === "holiday" ? this._depName(d) : `${this._depName(d)} · ${this._depWhen(d)}`);
    if (this._tripPick !== undefined && (trip?.kind || "") === this._tripPick && (this._tripPick !== "holiday" || trip)) this._tripPick = undefined;
    const current = this._tripPick !== undefined ? this._tripPick : trip?.kind || "";
    const options = [
      `<option value=""${current ? "" : " selected"}>${esc(`${this._t("trip_week")} · ${this._weekSummary(s)}`)}</option>`,
      ...deps.map((d) => `<option value="${esc(d.id)}"${d.id === current ? " selected" : ""}>${esc(label(d))}</option>`),
      // A trip set before its departure was removed, or by an action with a kind the list does not have.
      trip && !kinds.includes(trip.kind) ? `<option value="${esc(trip.kind)}" selected>${esc(this._depName({ id: trip.kind }))}</option>` : "",
    ].join("");
    const min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const date =
      current === "holiday"
        ? `<label class="go-date"><span>${this._t("trip_home_day")}</span><input type="date" min="${min}" data-trip-date="1" value="${esc(trip?.day || "")}"></label>`
        : "";
    const c = v.climate;
    let climate = "";
    if (c) {
      const on = c.on === true;
      const temp = isNum(s.climate_temperature) ? `${String(Number(s.climate_temperature)).replace(".", this._lang === "da" ? "," : ".")}°` : "";
      const label = this._t(on ? "climate_stop" : "climate_start");
      climate = `<button class="climate-btn${on ? " on" : ""}" data-act="climate-open" data-f="climate" aria-pressed="${on}" aria-haspopup="dialog" aria-label="${esc(`${this._t("climate_label")}: ${label}`)}">${ICONS.climate}<span>${esc(temp || this._t("climate_label"))}</span></button>`;
    }

    return `<div class="go-row">
        <label class="go-pick">${ICONS.history}<select data-trip-select="1" aria-label="${esc(this._t("trip"))}">${options}</select>${ICONS.back}</label>
        ${climate}
      </div>
      ${date}
`;
  }

  /* The week plan, in a few words: "07.00 · fri: lø sø". */
  _weekSummary(s) {
    if (s.use_ready_by === false) return this._t("no_deadline_short");
    const schedule = s.schedule || {};
    const off = WEEKDAYS.filter((day) => schedule[day] === "none");
    const time = this._hhmm(s.ready_by || "07:00");
    return off.length ? `${time} · ${this._t("week_off", { days: off.map((day) => this._t(`day_${day}`)).join(" ") })}` : time;
  }

  /* At a glance, as chips: ready by, to what, for how much, and when it charges. */
  _glanceHtml(v, shown) {
    const plan = shown.plan;
    const target = plan && isNum(plan.end_soc) ? plan.end_soc : v.target;
    const ready = this._readyText(shown.deadline);
    const text = ready.charAt(0).toUpperCase() + ready.slice(1);
    // The ready-by time says where it comes from, and opens the next departure.
    const source = this._nextSource(v);
    const icon = source.kind === "calendar" || source.kind === "week" ? ICONS.calendar : ICONS.history;
    const when = shown.deadline && !shown.preview
      ? `<button class="g-chip g-next" data-act="next-open" aria-haspopup="dialog">${icon}<b>${esc(text)}</b>${source.label ? `<em>${esc(source.label)}</em>` : ""}${ICONS.back}</button>`
      : `<span class="g-chip">${ICONS.history}<b>${esc(text)}</b></span>`;
    return `${when}${isNum(target) ? `<span class="g-chip">${ICONS.charge}<b>${esc(this._pct(target))}</b></span>` : ""}`;
  }

  async _setTrip(kind, date) {
    const v = this._currentCar;
    if (!v) return;
    // What was picked shows at once; the car's trip follows when Home Assistant has it.
    // The list keeps the focus after a choice, and a box with the focus is not drawn again: let go of it.
    this.shadowRoot.activeElement?.blur?.();
    this._tripPick = kind || "";
    this._renderCarPage({ live: false });
    if (kind === "holiday" && !date) return;
    await this._run("trip", "ev_household_planner/vehicle_trip", { vehicle_id: v.id, kind: kind || null, date: date || null });
  }

  /* Where the next ready-by time comes from: the calendar, a preset or the week plan. */
  _nextSource(v) {
    const at = v.deadline ? new Date(v.deadline).getTime() : null;
    const same = (iso) => iso && at !== null && Math.abs(new Date(iso).getTime() - at) < 60000;
    if (same(v.calendar?.start)) return { kind: "calendar", label: this._t("src_calendar") };
    if (v.trip && same(v.trip.at)) {
      const dep = (this._state.settings?.departures || []).find((d) => d.id === v.trip.kind) || { id: v.trip.kind };
      return { kind: "trip", label: this._depName(dep) || this._t("src_trip") };
    }
    if (at !== null) return { kind: "week", label: this._t("src_week") };
    return { kind: "none", label: "" };
  }

  /* The climate before the next departure, if any: when it starts and at what. */
  _nextClimate(v, s) {
    if (!v.climate || !v.deadline) return null;
    const at = new Date(v.deadline);
    const minutes = Number(s.climate_minutes) || 15;
    const start = new Date(at.getTime() - minutes * 60000);
    const source = this._nextSource(v).kind;
    const usual = Number(s.climate_temperature) || 21;
    if (source === "calendar" && v.calendar?.climate) {
      return { start, temp: typeof v.calendar.climate === "number" ? v.calendar.climate : usual, why: this._t("src_calendar") };
    }
    const day = WEEKDAYS[(at.getDay() + 6) % 7];
    if (source === "week" && isNum((s.day_climate || {})[day])) return { start, temp: Number(s.day_climate[day]), why: this._t("src_week") };
    if (s.climate_auto && (source === "calendar" || source === "trip")) return { start, temp: usual, why: this._t("climate_if_cold", { below: s.climate_below ?? 5 }) };
    return null;
  }

  /* Popups over the car's page: the next departure, and the climate. Drawn again with new state while open. */
  _openPopup(kind) {
    this._popup = { kind, car: this._carId, opener: this.shadowRoot.activeElement };
    this._popTemp = null;
    this._renderPopup();
  }

  _closePopup() {
    const opener = this._popup?.opener;
    this._popup = null;
    const root = this.shadowRoot.querySelector(".sheet-root");
    if (root) root.innerHTML = "";
    opener?.focus?.();
  }

  _renderPopup() {
    const popup = this._popup;
    const root = this.shadowRoot.querySelector(".sheet-root");
    if (!popup || !root) return;
    const v = this._cars.find((car) => car.id === popup.car);
    if (!v) return this._closePopup();
    const s = this._vs(v);
    const html = popup.kind === "climate" ? this._climatePopupHtml(v, s) : this._nextPopupHtml(v, s);
    const key = JSON.stringify([popup.kind, html.length, html]);
    if (root.dataset.key === key && root.firstChild) return;
    if (this._dialDragging) return; // not while a finger is on the dial
    const hadFocus = root.contains(this.shadowRoot.activeElement) ? this.shadowRoot.activeElement?.dataset?.f : null;
    root.dataset.key = key;
    root.innerHTML = `<div class="scrim" data-pop="close"></div>
      <div class="sheet pop-${popup.kind}" role="dialog" aria-modal="true" aria-label="${esc(popup.kind === "climate" ? this._t("climate_label") : this._t("next_title"))}">
        <header><h2>${popup.kind === "climate" ? `${ICONS.climate}<span>${esc(v.name)}</span>` : `${ICONS.calendar}<span>${this._t("next_title")}</span>`}</h2>
          <button class="icon close" data-pop="close" data-f="pop-close" aria-label="${this._t("close")}">${ICONS.close}</button></header>
        ${html}
      </div>`;
    root.onclick = (ev) => this._onPopupClick(ev, v);
    root.onkeydown = (ev) => ev.key === "Escape" && this._closePopup();
    if (popup.kind === "climate") this._wireDial(root, v);
    root.querySelector(hadFocus ? `[data-f="${cssId(hadFocus)}"]` : ".close")?.focus();
  }

  _nextPopupHtml(v, s) {
    const source = this._nextSource(v);
    const at = new Date(v.deadline);
    const now = Date.now();
    const left = Math.max(0, Math.round((at.getTime() - now) / 60000));
    const plan = v.plan;
    const target = plan && isNum(plan.end_soc) ? plan.end_soc : v.target;
    const climate = this._nextClimate(v, s);
    const what = {
      calendar: v.calendar?.summary ? `“${v.calendar.summary}”` : this._t("src_calendar"),
      trip: source.label,
      week: this._weekdayName(WEEKDAYS[(at.getDay() + 6) % 7]),
    }[source.kind] || "";
    // A timeline from now to the departure: when it charges, and when the climate starts.
    const span = Math.max(1, at.getTime() - now);
    const pos = (t) => clamp(((t - now) / span) * 100, 0, 100);
    const segs = (plan?.segments || [])
      .map((seg) => [pos(new Date(seg.start).getTime()), pos(new Date(seg.end).getTime())])
      .filter(([a, b]) => b > a)
      .map(([a, b]) => `<i class="seg" style="left:${a.toFixed(2)}%;width:${(b - a).toFixed(2)}%"></i>`)
      .join("");
    const clim = climate ? `<i class="clim" style="left:${pos(climate.start.getTime()).toFixed(2)}%;width:${(100 - pos(climate.start.getTime())).toFixed(2)}%"></i>` : "";
    const chips = [
      [ICONS.charge, this._pct(target)],
      plan && isNum(plan.cost) && !plan.fallback ? [ICONS.receipt, this._money(plan.cost)] : null,
      plan && isNum(plan.energy) ? [ICONS.plan, this._kwh(plan.energy)] : null,
      climate ? [ICONS.climate, `${String(climate.temp).replace(".", this._lang === "da" ? "," : ".")}° · ${this._time(climate.start.toISOString())}`] : null,
    ].filter(Boolean);
    return `<div class="next-hero">
        <span class="src src-${source.kind}">${source.kind === "trip" ? ICONS.history : ICONS.calendar}${esc(source.label)}</span>
        <p class="next-when">${esc(this._weekdayName(WEEKDAYS[(at.getDay() + 6) % 7]))} ${esc(this._time(v.deadline))}</p>
        <p class="next-left">${esc(this._t("next_in", { time: this._duration(left) }))}</p>
        ${what && source.kind !== "trip" ? `<p class="next-what">${esc(what)}</p>` : ""}
        ${source.kind === "trip" && ["weekend", "holiday"].includes(v.trip?.kind) ? `<p class="next-what">${esc(this._t(`trip_cheap_${v.trip.kind}`))}</p>` : ""}
      </div>
      <div class="next-chips">${chips.map(([icon, text]) => `<span class="g-chip">${icon}<b>${esc(text)}</b></span>`).join("")}</div>
      <div class="next-line" aria-hidden="true">
        <div class="track">${segs}${clim}</div>
        <div class="ends"><span>${this._t("now")}</span><span>${esc(this._time(v.deadline))}</span></div>
      </div>
      <p class="next-legend"><i class="dot seg"></i>${this._t("next_charges")}${plan?.segments?.length ? ` ${esc(this._windows(plan.segments))}` : ` – ${this._t("next_nothing")}`}${climate ? ` &nbsp; <i class="dot clim"></i>${this._t("climate_label")} (${esc(climate.why)})` : ""}</p>
      ${source.kind === "trip" ? `<div class="actions"><button class="btn ghost" data-pop="week">${ICONS.calendar}<span>${this._t("back_to_week")}</span></button></div>` : ""}`;
  }

  /* The climate: a dial for the temperature, a big start/stop, and when it starts by itself. */
  _climatePopupHtml(v, s) {
    const c = v.climate;
    const state = c?.entity ? this._hass?.states?.[c.entity] : null;
    const a = state?.attributes || {};
    const isClimate = c?.entity?.startsWith("climate.");
    const min = isClimate && isNum(a.min_temp) ? Number(a.min_temp) : 16;
    const max = isClimate && isNum(a.max_temp) ? Number(a.max_temp) : 30;
    const step = isClimate && isNum(a.target_temp_step) ? Number(a.target_temp_step) : 0.5;
    const temp = clamp(this._popTemp ?? (Number(s.climate_temperature) || 21), min, max);
    const on = c?.on === true;
    const inside = isNum(a.current_temperature) ? Number(a.current_temperature) : null;
    const fmt = (t) => String(Math.round(t * 10) / 10).replace(".", this._lang === "da" ? "," : ".");
    const g = dialGeometry(min, max, temp);
    const cx = 120;
    const cy = 118;
    if (!isClimate) {
      // A switch, button or script starts the car's climate at the car's own temperature.
      return `<div class="dial plain${on ? " on" : ""}">
        <div class="plain-state">${ICONS.climate}<b>${esc(this._t(on ? "climate_running" : c?.on === false ? "climate_off" : "climate_label"))}</b><small>${esc(this._t("climate_car_temp"))}</small></div>
        <div class="dial-steps">
          <button class="power${on ? " on" : ""}" data-pop="power" data-f="pop-power" aria-pressed="${on}"${this._busy === "climate" ? " disabled" : ""}>${ICONS.climate}<span>${this._t(on ? "climate_stop" : "climate_start")}</span></button>
        </div>
      </div>${this._climateAutoHtml(v, s, fmt)}`;
    }
    return `<div class="dial${on ? " on" : ""}" data-min="${min}" data-max="${max}" data-step="${step}">
        <svg viewBox="0 0 240 220" role="slider" tabindex="0" aria-label="${this._t("rule_climate_temp")}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${temp}" data-f="dial">
          <defs><linearGradient id="clim-g" x1="0" x2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset=".5" stop-color="#F59E0B"/><stop offset="1" stop-color="#EF4444"/></linearGradient></defs>
          <path class="rail" d="${g.rail}"/>
          <path class="fill" d="${g.fill}"/>
          <circle class="knob" cx="${g.knob[0].toFixed(1)}" cy="${g.knob[1].toFixed(1)}" r="13"/>
          <text class="t" x="${cx}" y="${cy + 6}" text-anchor="middle">${fmt(temp)}°</text>
          <text class="sub" x="${cx}" y="${cy + 34}" text-anchor="middle">${esc(on ? this._t("climate_running") : inside !== null ? this._t("climate_inside", { t: fmt(inside) }) : this._t("climate_off"))}</text>
        </svg>
        <div class="dial-steps">
          <button class="round" data-pop="minus" data-f="pop-minus" aria-label="−">−</button>
          <button class="power${on ? " on" : ""}" data-pop="power" data-f="pop-power" aria-pressed="${on}"${this._busy === "climate" ? " disabled" : ""}>${ICONS.climate}<span>${this._t(on ? "climate_stop" : "climate_start")}</span></button>
          <button class="round" data-pop="plus" data-f="pop-plus" aria-label="+">+</button>
        </div>
      </div>${this._climateAutoHtml(v, s, fmt)}`;
  }

  _climateAutoHtml(v, s, fmt) {
    const next = this._nextClimate(v, s);
    const minutes = Number(s.climate_minutes) || 15;
    return `<div class="clim-auto">
        <div class="row"><span>${this._t("rule_climate_auto")}</span><button class="switch" role="switch" data-pop="auto" data-f="pop-auto" aria-checked="${Boolean(s.climate_auto)}" aria-label="${esc(this._t("rule_climate_auto"))}"><i></i></button></div>
        <div class="row"><span>${this._t("rule_climate_minutes")}</span><div class="segmented">${[5, 10, 15, 30]
          .map((m) => `<button data-pop="minutes" data-m="${m}" class="${m === minutes ? "on" : ""}" aria-pressed="${m === minutes}">${m}</button>`)
          .join("")}</div></div>
        ${next ? `<p class="clim-next">${ICONS.history}<span>${esc(this._t("climate_next", { day: this._day(next.start.toISOString()).toLowerCase(), time: this._time(next.start.toISOString()), temp: fmt(next.temp), why: next.why }))}</span></p>` : ""}
      </div>`;
  }

  _wireDial(root, v) {
    const dial = root.querySelector(".dial");
    const svg = dial?.querySelector("svg");
    if (!svg) return;
    const min = Number(dial.dataset.min);
    const max = Number(dial.dataset.max);
    const step = Number(dial.dataset.step) || 0.5;
    const fmt = (t) => String(Math.round(t * 10) / 10).replace(".", this._lang === "da" ? "," : ".");
    const fromPoint = (ev) => {
      const box = svg.getBoundingClientRect();
      const x = ((ev.clientX - box.left) / box.width) * 240 - 120;
      const y = ((ev.clientY - box.top) / box.height) * 220 - 118;
      let deg = ((Math.atan2(y, x) * 180) / Math.PI - 135 + 720) % 360;
      if (deg > 270) deg = deg > 315 ? 0 : 270;
      return clamp(Math.round((min + (deg / 270) * (max - min)) / step) * step, min, max);
    };
    // While a finger is on the dial only the arc, the knob and the number move.
    const update = (t) => {
      this._popTemp = t;
      const g = dialGeometry(min, max, t);
      svg.querySelector(".fill").setAttribute("d", g.fill);
      svg.querySelector(".knob").setAttribute("cx", g.knob[0].toFixed(1));
      svg.querySelector(".knob").setAttribute("cy", g.knob[1].toFixed(1));
      svg.querySelector(".t").textContent = `${fmt(t)}°`;
      svg.setAttribute("aria-valuenow", String(t));
    };
    svg.onpointerdown = (ev) => {
      ev.preventDefault();
      svg.setPointerCapture(ev.pointerId);
      this._dialDragging = true;
      update(fromPoint(ev));
    };
    svg.onpointermove = (ev) => {
      if (this._dialDragging) update(fromPoint(ev));
    };
    const end = () => {
      if (!this._dialDragging) return;
      this._dialDragging = false;
      this._saveClimateTemp(v, this._popTemp);
    };
    svg.onpointerup = end;
    svg.onpointercancel = end;
    svg.onkeydown = (ev) => {
      const delta = ev.key === "ArrowUp" || ev.key === "ArrowRight" ? step : ev.key === "ArrowDown" || ev.key === "ArrowLeft" ? -step : 0;
      if (!delta) return;
      ev.preventDefault();
      update(clamp((this._popTemp ?? (Number(this._vs(v).climate_temperature) || 21)) + delta, min, max));
      this._saveClimateTemp(v, this._popTemp);
    };
  }

  _saveClimateTemp(v, temp) {
    clearTimeout(this._popTempTimer);
    this._popTempTimer = setTimeout(() => {
      this._vchange({ climate_temperature: temp });
      // A climate that runs gets the new temperature at once.
      if (v.climate?.on === true && v.climate.entity?.startsWith("climate.")) {
        this._run("climate", "ev_household_planner/vehicle_climate", { vehicle_id: v.id, on: true, temperature: temp });
      }
      setTimeout(() => {
        if (!this._dialDragging) this._popTemp = null;
      }, 3000);
    }, 400);
  }

  _onPopupClick(ev, v) {
    const target = ev.target.closest("[data-pop]");
    if (!target) return;
    const s = this._vs(v);
    const dial = this.shadowRoot.querySelector(".sheet-root .dial");
    const step = Number(dial?.dataset.step) || 0.5;
    const nudge = (d) => {
      const t = clamp((this._popTemp ?? (Number(s.climate_temperature) || 21)) + d, Number(dial?.dataset.min) || 10, Number(dial?.dataset.max) || 32);
      this._popTemp = t;
      this._renderPopup();
      this._saveClimateTemp(v, t);
    };
    switch (target.dataset.pop) {
      case "close":
        this._closePopup();
        break;
      case "minus":
        nudge(-step);
        break;
      case "plus":
        nudge(step);
        break;
      case "power": {
        const on = v.climate?.on !== true;
        this._run("climate", "ev_household_planner/vehicle_climate", {
          vehicle_id: v.id,
          on,
          temperature: on ? this._popTemp ?? (Number(s.climate_temperature) || 21) : null,
        });
        break;
      }
      case "auto":
        this._vchange({ climate_auto: !s.climate_auto });
        break;
      case "minutes":
        this._vchange({ climate_minutes: Number(target.dataset.m) });
        break;
      case "week":
        this._closePopup();
        this._setTrip(null);
        break;
    }
  }

  async _climate(on) {
    const v = this._currentCar;
    if (!v) return;
    await this._run("climate", "ev_household_planner/vehicle_climate", { vehicle_id: v.id, on });
  }

  /* The latest charge: when, how much, what it cost. */
  _lastChargeHtml(e) {
    const soc = isNum(e.start_soc) && isNum(e.end_soc) ? `${this._pct(e.start_soc)} → ${this._pct(e.end_soc)}` : "";
    const price = isNum(e.cost) && Number(e.energy) > 0 ? `${this._money(e.cost / e.energy)}/kWh` : "";
    return `<h2>${ICONS.history}<span>${this._t("last_charge")}</span></h2>
      <div class="last-row">
        <div class="when"><b>${new Date(e.start).getDate()}</b><span>${new Intl.DateTimeFormat(this._locale, { month: "short" }).format(new Date(e.start))}</span></div>
        <div class="what"><strong>${this._time(e.start)}–${this._time(e.end)}</strong><span>${esc([soc, price].filter(Boolean).join(" · "))}</span></div>
        <div class="nums"><b>${this._money(e.cost)}</b><span>${this._kwh(e.energy)}</span></div>
      </div>`;
  }

  /* The charge level from now to the ready-by time, as the plan has it: flat while waiting, up while charging. */
  _socForecast(v, shown) {
    const plan = shown.plan;
    const start = isNum(v.soc) ? Number(v.soc) : null;
    if (!plan || start === null || !isNum(plan.end_soc) || !(plan.segments || []).length) return null;
    const now = Date.now();
    const segs = plan.segments
      .map((seg) => [Math.max(now, new Date(seg.start).getTime()), new Date(seg.end).getTime()])
      .filter(([a, b]) => b > a);
    if (!segs.length) return null;
    const end = Math.max(segs.at(-1)[1], shown.deadline ? new Date(shown.deadline).getTime() : 0);
    const total = segs.reduce((sum, [a, b]) => sum + (b - a), 0);
    const rise = Math.max(0, Number(plan.end_soc) - start);
    const points = [[now, start]];
    let soc = start;
    for (const [a, b] of segs) {
      points.push([a, soc]);
      soc += (rise * (b - a)) / total;
      points.push([b, soc]);
    }
    points.push([end, soc]);
    return points.map(([t, value]) => [t, Math.round(value * 10) / 10]);
  }

  _forecastHtml(points, deadline) {
    const w = 320;
    const h = 120;
    const pad = { l: 38, r: 10, t: 10, b: 22 };
    const t0 = points[0][0];
    const t1 = points.at(-1)[0];
    const lo = Math.max(0, Math.floor(Math.min(...points.map((p) => p[1])) / 10) * 10 - 10);
    const hi = Math.min(100, Math.ceil(Math.max(...points.map((p) => p[1])) / 10) * 10 + 10);
    const x = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (w - pad.l - pad.r);
    const y = (v) => pad.t + (1 - (v - lo) / Math.max(1, hi - lo)) * (h - pad.t - pad.b);
    const line = points.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const area = `${line} L${x(t1).toFixed(1)} ${y(lo).toFixed(1)} L${x(t0).toFixed(1)} ${y(lo).toFixed(1)} Z`;
    const grid = [lo, Math.round((lo + hi) / 2), hi]
      .map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${pad.l - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${v}%</text>`)
      .join("");
    const ticks = [t0, (t0 + t1) / 2, t1]
      .map((t, i) => `<text x="${x(t).toFixed(1)}" y="${h - 6}" text-anchor="${["start", "middle", "end"][i]}">${esc(this._time(new Date(t).toISOString()))}</text>`)
      .join("");
    const lastPoint = points.at(-1);
    return `<h2>${ICONS.charge}<span>${this._t("forecast_title")}</span></h2>
      <svg class="soc-forecast" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(this._t("forecast_label", { pct: this._pct(lastPoint[1]), when: this._readyText(deadline) }))}">
        <g class="grid">${grid}</g>
        <path class="area" d="${area}"/>
        <path class="line" d="${line}"/>
        <circle cx="${x(lastPoint[0]).toFixed(1)}" cy="${y(lastPoint[1]).toFixed(1)}" r="3.5"/>
        <g class="ticks">${ticks}</g>
      </svg>`;
  }

  /* One line to read at a glance: "Klar kl. 07.00 · 80 % · 34,00 kr. · lader 01.00–04.00". */
  _glanceText(v, shown) {
    const plan = shown.plan;
    const parts = [this._readyText(shown.deadline)];
    const target = plan && isNum(plan.end_soc) ? plan.end_soc : v.target;
    if (isNum(target)) parts.push(this._pct(target));
    if (plan && !plan.fallback && isNum(plan.cost)) parts.push(this._money(plan.cost));
    if (plan) parts.push(this._t("glance_charge", { window: this._windows(plan.segments) }));
    const text = parts.join(" · ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /* "01.00–02.00 og 03.00–04.00" */
  _windows(segments) {
    const list = (segments || []).slice(0, 3).map((seg) => `${this._time(seg.start)}–${this._time(seg.end)}`);
    if ((segments || []).length > 3) list[list.length - 1] += " …";
    if (list.length < 2) return list[0] || "";
    return `${list.slice(0, -1).join(", ")} ${this._lang === "da" ? "og" : "and"} ${list.at(-1)}`;
  }

  /* Why the car does what it does now, in a sentence with the numbers behind it. */
  _whyText(v, plan) {
    const reason = v.reason;
    const s = this._vs(v);
    const prices = this._dayPrices();
    const now = prices[0]?.price;
    const deadline = v.deadline ? this._time(v.deadline) : "";
    const notes = [];
    if (plan?.kept) notes.push(this._t("why_kept"));
    if (plan?.early) notes.push(this._t("why_early", { within: this._money(s.early_within) }));
    let text = "";
    if (reason === "charge_now") text = this._t("why_charge_now");
    else if (reason === "low_soc") text = this._t("why_low_soc", { level: this._pct(s.low_soc_level) });
    else if (reason === "low_price") text = this._t("why_low_price", { price: this._money(now), level: this._money(s.low_price_level) });
    else if (reason === "keep_on") text = this._t("why_keep_on");
    else if (reason === "late") text = this._t("why_late", { target: this._pct(v.target) });
    else if (reason === "full") text = this._t("why_full", { target: this._pct(v.target) });
    else if (reason === "paused") text = this._t("why_paused");
    else if (reason === "charger_busy") text = this._t("why_busy");
    else if (reason === "planned") {
      text = isNum(now) && deadline ? this._t("why_planned", { price: this._money(now), time: deadline }) : this._t("why_planned_plain");
    } else if (reason === "waiting" && plan) {
      const upcoming = plan.segments.filter((seg) => new Date(seg.end).getTime() > Date.now());
      const window = this._windows(upcoming);
      if (plan.fallback) text = this._t("why_fallback", { window });
      else if (plan.topup && isNum(s.topup_level)) {
        text = this._t("why_topup", { from: this._pct(Math.max(Number(s.topup_level), Number(v.soc) || 0)), to: this._pct(v.target) });
      } else {
        const diff = isNum(now) && isNum(plan.average_price) ? now - plan.average_price : null;
        text = diff !== null && diff > 0.005 ? this._t("why_waiting", { window, diff: this._money(diff) }) : this._t("why_waiting_plain", { window });
      }
    }
    return [text, ...notes].filter(Boolean).join(" ");
  }

  /* When the car charged: the periods of the charge going on, and of the last one. */
  _chargedPeriods(v) {
    const periods = [...(v.session?.periods || [])];
    const last = (v.history || [])[0];
    if (last?.periods) periods.push(...last.periods);
    const nowIso = new Date().toISOString();
    return periods.filter((p) => p && p.start).map((p) => ({ start: p.start, end: p.end || nowIso }));
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
  /* The week plan: pick a day, then its departure, its target and its climate. */
  _scheduleHtml(s, v) {
    const schedule = s.schedule || {};
    const off = s.use_ready_by === false;
    const targets = s.day_targets || {};
    const climates = s.day_climate || {};
    const today = WEEKDAYS[(new Date().getDay() + 6) % 7];
    const day = WEEKDAYS.includes(this._schedDay) ? this._schedDay : today;
    const valueOf = (d) => (off ? "none" : schedule[d] || "default");
    const usual = this._hhmm(s.ready_by || "07:00");
    const days = WEEKDAYS.map((d) => {
      const value = valueOf(d);
      const time = value === "default" ? usual : value === "none" ? "–" : this._hhmm(value);
      const marks = value === "none" ? "" : `${isNum(targets[d]) ? `<em>${Math.round(targets[d])}%</em>` : ""}${isNum(climates[d]) && v?.climate ? ICONS.climate : ""}`;
      const cls = [value === "default" ? "std" : value === "none" ? "none" : "own", d === day ? "open" : ""].join(" ");
      return `<button class="day ${cls}" data-act="sched-day" data-day="${d}" data-f="sched-${d}" aria-pressed="${d === day}"
        aria-label="${esc(`${this._t(`dayl_${d}`)}: ${value === "none" ? this._t("no_deadline") : time}`)}"><b>${this._t(`day_${d}`)}</b><span>${time}</span><i class="marks">${marks}</i></button>`;
    }).join("");
    const value = valueOf(day);
    const kind = value === "default" || value === "none" ? value : "other";
    const seg = (options, act, current) =>
      `<div class="segmented day-seg" role="radiogroup">${options
        .map(([key, label]) => `<button role="radio" data-act="${act}" data-value="${key}" aria-checked="${key === current}" class="${key === current ? "on" : ""}">${esc(label)}</button>`)
        .join("")}</div>`;
    const rows = [];
    rows.push(`<div class="day-row"><span>${ICONS.history}</span>${seg(
      [
        ["default", usual],
        ["other", this._t("sched_other_short")],
        ["none", this._t("sched_none_short")],
      ],
      "sched-kind",
      kind,
    )}</div>`);
    if (kind === "other") {
      rows.push(`<div class="day-row sub"><label class="chip-input time"><input type="time" step="900" data-sched="${day}" value="${esc(value)}" aria-label="${this._t("schedule_other")}"></label>
        <button class="btn ghost small" data-act="sched-default" data-time="${esc(value)}">${this._t("sched_make_default")}</button></div>`);
    }
    if (kind !== "none") {
      const steps = Array.isArray(v?.target_steps) ? v.target_steps.map(Number) : null;
      const step = steps && steps[2] > 1 ? steps[2] : 5;
      const own = targets[day];
      const shown = isNum(own) ? Number(own) : Number(s.target_soc) || 80;
      rows.push(`<div class="day-row"><span>${ICONS.charge}</span>
        <input type="range" class="day-range" min="${steps ? steps[0] : 10}" max="${steps ? steps[1] : 100}" step="${step}" value="${shown}" data-daytarget="${day}" aria-label="${esc(this._t("day_target"))}">
        <b class="day-val${isNum(own) ? "" : " soft"}">${Math.round(shown)} %</b>
        ${isNum(own) ? `<button class="icon-x" data-act="day-target-clear" data-day="${day}" aria-label="${esc(this._t("day_target_usual"))}" title="${esc(this._t("day_target_usual"))}">${ICONS.close}</button>` : ""}</div>`);
      if (v?.climate) {
        const temp = climates[day];
        const on = isNum(temp);
        rows.push(`<div class="day-row"><span>${ICONS.climate}</span>
          <button class="switch" role="switch" data-act="day-climate" data-day="${day}" aria-checked="${on}" aria-label="${esc(this._t("climate_label"))}"><i></i></button>
          ${on ? `<label class="unit-input small"><input type="number" inputmode="decimal" step="0.5" min="10" max="32" data-dayclimate="${day}" value="${esc(temp)}" aria-label="${esc(this._t("rule_climate_temp"))}"><span>°</span></label>` : `<small class="soft">${this._t("climate_label")}</small>`}</div>`);
      }
    }
    return `<div class="week ${off ? "dim" : ""}">${days}</div>
      <div class="day-card"><p class="day-title">${esc(this._weekdayName(day))}</p>${rows.join("")}</div>`;
  }

  /* "Fredag" / "Friday". */
  _weekdayName(day) {
    const monday = new Date(2026, 0, 5);
    const date = new Date(monday.getTime() + WEEKDAYS.indexOf(day) * 86400000);
    const name = new Intl.DateTimeFormat(this._locale, { weekday: "long" }).format(date);
    return name.charAt(0).toUpperCase() + name.slice(1);
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
    const backup = v.control_backup ? ` (${this._t(v.paused_by && v.paused_by !== v.control_source ? "control_on_backup" : "control_has_backup")})` : "";
    const source = `${this._t(`control_${v.control_source || "none"}`)}${backup}`;
    const charger = [
      v.charger?.name || (v.finds_charger ? this._t("charger_not_found") : ""),
      isNum(v.power) ? `${this._num(v.power)} kW${v.charge_power_source === "learned" ? ` (${this._t("power_learned")})` : ""}` : "",
      isNum(v.capacity) ? `${this._t("battery_size")} ${this._kwh(v.capacity, 1)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(`<p class="info-line">${ICONS.charger}<span>${this._t("control_source")}: <b>${esc(source)}</b>${charger ? ` · ${esc(charger)}` : ""}</span></p>`);
    if (isNum(v.charge_speed)) {
      const count = Number(v.charge_speed_learned_from) || 0;
      const from =
        v.charge_speed_source === "learned"
          ? count === 1 ? this._t("speed_learned_one") : this._t("speed_learned", { count })
          : this._t(`speed_${v.charge_speed_source || "estimated"}`);
      lines.push(`<p class="info-line">${ICONS.charge}<span>${this._t("charge_speed")}: <b>${this._num(v.charge_speed)} %/${this._t("hours_short")}</b> · ${esc(from)}</span></p>`);
    }
    const curve = v.curve || {};
    for (const key of ["80-90", "90-100"]) {
      if (isNum(curve[key]) && isNum(v.charge_speed) && curve[key] < Number(v.charge_speed) * 0.9) {
        lines.push(`<p class="info-line">${ICONS.charge}<span>${esc(this._t("curve_line", { from: this._pct(Number(key.split("-")[0])), speed: this._num(curve[key]) }))}</span></p>`);
      }
    }
    if (Number(v.margin) > 0) lines.push(`<p class="info-line">${ICONS.history}<span>${esc(this._t("margin_line", { minutes: v.margin }))}</span></p>`);
    const receipt = v.receipt;
    if (receipt && isNum(receipt.soc)) {
      const text = this._t("receipt_line", { soc: this._pct(receipt.soc), time: this._time(receipt.at), planned: this._pct(receipt.planned_soc) });
      lines.push(`<p class="info-line">${ICONS.receipt}<span>${esc(text)}${receipt.late ? ` · <b>${this._t("receipt_late")}</b>` : ""}</span></p>`);
    }
    return lines.join("");
  }

  _ruleValues(s) {
    return [
      "min_soc", "must_soc", "priority", "price_ceiling_enabled", "price_ceiling", "price_ceiling_relative", "price_ceiling_above", "low_price_charging", "low_price_level", "low_soc_charging", "low_soc_level",
      "opportunistic", "opportunistic_level", "follow_level", "keep_charger_on", "charge_on_late", "use_earliest_start", "earliest_start",
      "morning_time", "midday_time", "evening_time", "climate_temperature", "climate_minutes", "climate_auto", "climate_below", "climate_plugged_only",
      "join_period", "join_within", "continuous", "prefer_early", "early_within", "topup", "topup_level",
      "solar", "body", "paint", "spot",
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

  /* The car's rules in groups: each group is a tile with a short summary, and opens as a sheet. */
  _ruleGroups(v, s) {
    const price = `${this._unit}/kWh`;
    const groups = { time: [], price: [], battery: [], climate: [], supply: [], sun: [], look: [] };
    groups.battery.push(
      this._ruleRow({
        icon: "charge",
        title: this._t("rule_min"),
        hint: this._t("rule_min_hint"),
        control: this._valueHtml("min_soc", s.min_soc, { unit: "%", label: this._t("rule_min") }),
      }),
    );
    groups.price.push(
      this._ruleRow({
        icon: "rules",
        title: this._t("rule_ceiling"),
        hint: s.price_ceiling_enabled && s.price_ceiling_relative
          ? this._t("rule_ceiling_avg_hint", { pct: this._pct(s.price_ceiling_above) })
          : this._t("rule_ceiling_hint"),
        off: !s.price_ceiling_enabled,
        control: this._switchHtml("price_ceiling_enabled", s.price_ceiling_enabled, this._t("rule_ceiling")),
        extra: s.price_ceiling_enabled
          ? `<div class="rule-under"><div class="segmented opp" role="radiogroup" aria-label="${this._t("rule_ceiling")}">${[false, true].map(
              (rel) => `<button role="radio" data-act="ceilmode" data-value="${rel ? 1 : 0}" data-f="ceil-${rel ? "avg" : "fixed"}" aria-checked="${Boolean(s.price_ceiling_relative) === rel}" class="${Boolean(s.price_ceiling_relative) === rel ? "on" : ""}">${this._t(rel ? "ceiling_relative" : "ceiling_fixed")}</button>`,
            ).join("")}</div>${s.price_ceiling_relative
              ? this._valueHtml("price_ceiling_above", s.price_ceiling_above, { unit: "%", step: 1, min: 0, max: 200, label: this._t("ceiling_relative") })
              : this._valueHtml("price_ceiling", s.price_ceiling, { unit: price, step: 0.01, min: -5, max: 20, label: this._t("rule_ceiling") })}</div>`
          : "",
      }),
    );
    groups.price.push(
      this._ruleRow({
        icon: "lowprice",
        title: this._t("rule_low_price"),
        hint: this._t("rule_low_price_hint"),
        off: !s.low_price_charging,
        control: `${s.low_price_charging ? this._valueHtml("low_price_level", s.low_price_level, { unit: price, step: 0.01, min: -5, max: 20, label: this._t("rule_low_price") }) : ""}${this._switchHtml("low_price_charging", s.low_price_charging, this._t("rule_low_price"))}`,
      }),
    );
    groups.battery.push(
      this._ruleRow({
        icon: "boost",
        title: this._t("rule_low_soc"),
        hint: this._t("rule_low_soc_hint"),
        off: !s.low_soc_charging,
        control: `${s.low_soc_charging ? this._valueHtml("low_soc_level", s.low_soc_level, { unit: "%", label: this._t("rule_low_soc") }) : ""}${this._switchHtml("low_soc_charging", s.low_soc_charging, this._t("rule_low_soc"))}`,
      }),
    );
    groups.price.push(
      this._ruleRow({
        icon: "history",
        title: this._t("rule_early"),
        hint: this._t("rule_early_hint"),
        off: !s.prefer_early,
        control: `${s.prefer_early ? this._valueHtml("early_within", s.early_within, { unit: price, step: 0.01, min: 0, max: 2, label: this._t("rule_early") }) : ""}${this._switchHtml("prefer_early", s.prefer_early, this._t("rule_early"))}`,
      }),
    );
    groups.battery.push(
      this._ruleRow({
        icon: "depart",
        title: this._t("rule_topup"),
        hint: this._t("rule_topup_hint", { level: this._pct(s.topup_level ?? 80) }),
        off: !s.topup,
        control: `${s.topup ? this._valueHtml("topup_level", s.topup_level ?? 80, { unit: "%", min: 10, max: 100, label: this._t("rule_topup") }) : ""}${this._switchHtml("topup", s.topup, this._t("rule_topup"))}`,
      }),
    );
    {
      const bodies = v?.image_original ? [...ClayScene.BODIES, "photo"] : ClayScene.BODIES;
      const body = bodies.includes(s.body) ? s.body : "sedan";
      const paint = s.paint === "black" ? "black" : "white";
      const seg = (act, values, current, label) => `<div class="segmented opp" role="radiogroup" aria-label="${label}">${values.map(
        (value) => `<button role="radio" data-act="${act}" data-value="${value}" data-f="${act}-${value}" aria-checked="${value === current}" class="${value === current ? "on" : ""}">${this._t(`${act}_${value}`)}</button>`,
      ).join("")}</div>`;
      groups.look.push(
        this._ruleRow({
          icon: "car",
          title: this._t("rule_look"),
          hint: this._t("rule_look_hint"),
          control: "",
          extra: `<div class="rule-under carlook">${seg("body", bodies, body, this._t("rule_look"))}</div>`,
        }),
        this._ruleRow({
          icon: "home",
          title: this._t("rule_spot"),
          hint: this._t("rule_spot_hint"),
          control: "",
          extra: `<div class="rule-under carlook">${seg("spot", ["auto", "left", "right"], ["left", "right"].includes(s.spot) ? s.spot : "auto", this._t("rule_spot"))}</div>`,
        }),
      );
    }
    if (this._state.solar) {
      const mode = ["surplus", "only"].includes(s.solar) ? s.solar : "off";
      groups.sun.push(
        this._ruleRow({
          icon: "sun",
          title: this._t("rule_solar"),
          hint: this._t(`rule_solar_hint_${mode}`),
          off: mode === "off",
          control: "",
          extra: `<div class="rule-under"><div class="segmented opp" role="radiogroup" aria-label="${this._t("rule_solar")}">${["off", "surplus", "only"].map(
            (m) => `<button role="radio" data-act="solar" data-value="${m}" data-f="solar-${m}" aria-checked="${m === mode}" class="${m === mode ? "on" : ""}">${this._t(`solar_${m}`)}</button>`,
          ).join("")}</div></div>`,
        }),
      );
    }
    if (this._state.supply) {
      const prio = s.priority === "first" ? "first" : "normal";
      groups.supply.push(
        this._ruleRow({
          icon: "rules",
          title: this._t("rule_must"),
          hint: this._t("rule_must_hint"),
          control: this._valueHtml("must_soc", s.must_soc ?? 0, { unit: "%", min: 0, max: 100, label: this._t("rule_must") }),
          extra: `<div class="rule-under"><div class="segmented opp" role="radiogroup" aria-label="${this._t("rule_must")}">${["normal", "first"].map(
            (p) => `<button role="radio" data-act="prio" data-value="${p}" data-f="prio-${p}" aria-checked="${p === prio}" class="${p === prio ? "on" : ""}">${this._t(`priority_${p}`)}</button>`,
          ).join("")}</div></div>`,
        }),
      );
    }
    groups.price.push(
      this._ruleRow({
        icon: "plan",
        title: this._t("rule_join"),
        hint: s.continuous ? this._t("rule_join_continuous") : this._t("rule_join_hint"),
        off: !s.join_period || s.continuous,
        control: `${s.join_period && !s.continuous ? this._valueHtml("join_within", s.join_within, { unit: price, step: 0.01, min: 0, max: 2, label: this._t("rule_join") }) : ""}${this._switchHtml("join_period", s.join_period, this._t("rule_join"))}`,
      }),
    );
    groups.price.push(this._opportunisticHtml(s));
    groups.time.push(
      this._ruleRow({
        icon: "charger",
        title: this._t("rule_keep_on"),
        hint: this._t("rule_keep_on_hint"),
        off: !s.keep_charger_on,
        control: this._switchHtml("keep_charger_on", s.keep_charger_on, this._t("rule_keep_on")),
      }),
      this._ruleRow({
        icon: "boost",
        title: this._t("rule_late"),
        hint: this._t("rule_late_hint"),
        off: s.charge_on_late === false,
        control: this._switchHtml("charge_on_late", s.charge_on_late !== false, this._t("rule_late")),
      }),
    );
    groups.time.push(
      this._ruleRow({
        icon: "plan",
        title: this._t("mode"),
        hint: this._t("plan_type_hint"),
        control: `<div class="segmented" role="radiogroup" aria-label="${this._t("mode")}">${[
          ["continuous", this._t("continuous")],
          ["split", this._t("split")],
        ]
          .map(([mode, label]) => {
            const on = (mode === "continuous") === Boolean(s.continuous);
            return `<button role="radio" data-act="car-cont" data-mode="${mode}" aria-checked="${on}" class="${on ? "on" : ""}">${label}</button>`;
          })
          .join("")}</div>`,
      }),
    );
    groups.climate.push(this._climateEntityRow(v, s));
    if (v.climate) {
      groups.climate.push(
        this._ruleRow({
          icon: "climate",
          title: this._t("rule_climate_temp"),
          hint: this._t("rule_climate_temp_hint"),
          control: this._valueHtml("climate_temperature", s.climate_temperature ?? 21, { unit: "°", step: 0.5, min: 10, max: 32, label: this._t("rule_climate_temp") }),
        }),
        this._ruleRow({
          icon: "history",
          title: this._t("rule_climate_minutes"),
          hint: this._t("rule_climate_minutes_hint"),
          control: this._valueHtml("climate_minutes", s.climate_minutes ?? 15, { unit: this._t("minutes_short"), step: 5, min: 5, max: 60, label: this._t("rule_climate_minutes") }),
        }),
        this._ruleRow({
          icon: "climate",
          title: this._t("rule_climate_auto"),
          hint: this._t("rule_climate_auto_hint"),
          off: !s.climate_auto,
          control: this._switchHtml("climate_auto", s.climate_auto, this._t("rule_climate_auto")),
          extra: s.climate_auto
            ? `<div class="rule-under"><div class="inline-values"><span>${this._t("rule_climate_below")}</span>${this._valueHtml("climate_below", s.climate_below ?? 5, { unit: "°", step: 1, min: -30, max: 40, label: this._t("rule_climate_below") })}</div>
               <div class="inline-values"><span>${this._t("rule_climate_plugged")}</span>${this._switchHtml("climate_plugged_only", s.climate_plugged_only !== false, this._t("rule_climate_plugged"))}</div></div>`
            : "",
        }),
      );
    }
    groups.time.unshift(
      this._ruleRow({
        icon: "history",
        title: this._t("rule_earliest"),
        hint: this._t("rule_earliest_hint"),
        off: !s.use_earliest_start,
        control: `${s.use_earliest_start ? `<label class="chip-input time on"><input type="time" step="900" data-set="earliest_start" data-type="time" value="${esc(s.earliest_start || "18:00")}" aria-label="${this._t("rule_earliest")}"></label>` : ""}${this._switchHtml("use_earliest_start", s.use_earliest_start, this._t("rule_earliest"))}`,
      }),
    );
    const pct = (x) => this._pct(x);
    const money = (x) => this._money(x);
    const on = (list) => list.filter(Boolean).join(" · ");
    const summary = {
      time: on([s.use_earliest_start && this._t("sum_earliest", { time: this._hhmm(s.earliest_start || "18:00") }), s.keep_charger_on && this._t("sum_keep_on")]),
      price: on([
        s.price_ceiling_enabled && (s.price_ceiling_relative ? this._t("sum_ceiling_avg", { pct: pct(s.price_ceiling_above) }) : this._t("sum_ceiling_fixed", { price: money(s.price_ceiling) })),
        s.low_price_charging && this._t("sum_low_price", { price: money(s.low_price_level) }),
        s.prefer_early && this._t("sum_early"),
        s.join_period && !s.continuous && this._t("sum_join"),
      ]),
      battery: on([
        isNum(s.min_soc) && Number(s.min_soc) > 0 && this._t("sum_min", { pct: pct(s.min_soc) }),
        s.low_soc_charging && this._t("sum_low_soc", { pct: pct(s.low_soc_level) }),
        s.topup && this._t("sum_topup", { pct: pct(s.topup_level ?? 80) }),
      ]),
      supply: on([Number(s.must_soc) > 0 && this._t("sum_must", { pct: pct(s.must_soc) }), s.priority === "first" && this._t("sum_first")]),
      sun: ["surplus", "only"].includes(s.solar) ? this._t(`solar_${s.solar}`) : "",
      climate: v.climate ? on([`${s.climate_temperature ?? 21}°`, s.climate_auto && this._t("sum_climate_auto")]) : "",
      look: this._t(`body_${ClayScene.BODIES.includes(s.body) || s.body === "photo" ? s.body : "sedan"}`),
      notify: on([
        s.reminder && this._t("sum_reminder", { time: this._hhmm(s.reminder_time || "16:00") }),
        s.notify_receipt !== false && this._t("sum_receipt"),
        s.live_notification && this._t("sum_live"),
        this._state.settings?.quiet_enabled && this._t("quiet_summary", { from: this._hhmm(this._state.settings.quiet_from || "22:00"), to: this._hhmm(this._state.settings.quiet_to || "06:00") }),
      ]),
    };
    const icons = { time: "history", price: "lowprice", battery: "charge", climate: "climate", supply: "rules", sun: "sun", look: "car", notify: "bell" };
    const list = ["price", "battery", "time", "climate", "notify", "supply", "sun", "look"]
      .map((key) => ({ key, icon: icons[key], title: this._t(`tile_${key}`), summary: summary[key], rows: key === "notify" ? null : groups[key] }))
      .filter((g) => g.rows === null || g.rows.length);
    return list;
  }

  /* Which entity starts the car's climate: found on the car's own device, or one chosen here. */
  _climateEntityRow(v, s) {
    const states = this._hass?.states || {};
    const chosen = String(s.climate_entity || "");
    const now = v.climate?.entity || "";
    const fits = (id) => id.startsWith("climate.") || (/^(button|input_button|switch|script|input_boolean)\./.test(id) && /climat|klima|hvac|preheat|precondition|heat|air_condition|defrost|_ac\b/.test(id));
    const list = [...new Set([...Object.keys(states).filter(fits), ...(chosen ? [chosen] : [])])].sort();
    const name = (id) => states[id]?.attributes?.friendly_name || id;
    const auto = !chosen && now ? `${this._t("climate_auto_found")}: ${name(now)}` : this._t("climate_auto_pick");
    const options = [`<option value=""${chosen ? "" : " selected"}>${esc(auto)}</option>`, ...list.map((id) => `<option value="${esc(id)}"${id === chosen ? " selected" : ""}>${esc(name(id))}</option>`)].join("");
    return this._ruleRow({
      icon: "climate",
      title: this._t("climate_entity"),
      hint: now ? this._t("climate_entity_hint") : this._t("climate_entity_none"),
      off: !now,
      control: "",
      extra: `<div class="rule-under"><label class="select-wrap"><select data-climate-entity="${esc(v.id)}" aria-label="${esc(this._t("climate_entity"))}">${options}</select></label></div>`,
    });
  }

  /* The rules view: tiles, and the open one as a sheet over the page. */
  _renderRules(v, s) {
    const root = this.shadowRoot;
    const groups = this._ruleGroups(v, s);
    const lang = this._lang;
    this._patch(
      root.querySelector(".car-page .tiles"),
      JSON.stringify([groups.map((g) => [g.key, g.summary]), lang, this._sheet]),
      `<div class="tile-grid">${groups
        .map(
          (g) => `<button class="tile${g.summary ? "" : " off"}" ${g.key === "notify" ? `data-act="goto-settings" data-tile="notifications" data-car="${esc(v.id)}"` : `data-act="tile" data-tile="${g.key}" aria-haspopup="dialog"`} data-f="tile-${g.key}">
            <span class="tile-icon">${ICONS[g.icon] || ""}</span>
            <span class="tile-text"><strong>${esc(g.title)}</strong><small>${esc(g.summary || this._t("tile_off"))}</small></span>
            <span class="tile-go">${ICONS.back}</span></button>`,
        )
        .join("")}</div>`,
    );
    const open = groups.find((g) => g.key === this._sheet && g.key !== "notify");
    const body = !open || open.key === "notify" ? "" : open.rows.join("");
    this._patch(
      root.querySelector(".car-page .sheet-slot"),
      JSON.stringify([this._sheet, this._ruleValues(s), s.reminder, s.reminder_time, s.reminder_soc, s.reminder_price_enabled, s.reminder_price, s.reminder_days, s.reminder_repeat, s.reminder_horizon, s.notify_targets, s.live_notification, s.notify_done, s.notify_receipt, this._state.config?.notify, this._currency, lang]),
      open
        ? `<div class="scrim in-page" data-act="sheet-close"></div>
          <div class="sheet in-page" role="dialog" aria-modal="true" aria-label="${esc(open.title)}">
            <header><h2>${ICONS[open.icon] || ""}<span>${esc(open.title)}</span></h2><button class="btn ghost small" data-act="sheet-close" data-f="sheet-close">${this._t("tile_close")}</button></header>
            <div class="sheet-body">${body}</div>
          </div>`
        : "",
    );
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

  _notifyHtml(s, { inSettings = false } = {}) {
    const missing = !inSettings && !(this._state.config?.notify || []).length;
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
    return `${missing ? `<p class="note-line warn">${ICONS.info}<span>${this._t("notify_missing")}</span></p>` : ""}
      ${this._ruleRow({
        icon: "bell",
        title: this._t("reminder"),
        hint: this._t("reminder_hint", { time: this._hhmm(s.reminder_time || "16:00"), soc: this._pct(s.reminder_soc) }),
        off: !s.reminder,
        extra: reminderExtra,
        control: this._switchHtml("reminder", s.reminder, this._t("reminder")),
      })}
      ${this._ruleRow({ icon: "receipt", title: this._t("notify_receipt"), hint: this._t("notify_receipt_hint"), off: s.notify_receipt === false, control: this._switchHtml("notify_receipt", s.notify_receipt !== false, this._t("notify_receipt")) })}
      ${this._ruleRow({ icon: "charge", title: this._t("live"), off: !s.live_notification, control: this._switchHtml("live_notification", s.live_notification, this._t("live")) })}
      ${this._ruleRow({ icon: "depart", title: this._t("notify_done"), off: !s.notify_done, control: this._switchHtml("notify_done", s.notify_done, this._t("notify_done")) })}
      ${targets}
      ${inSettings ? "" : this._householdNotifyLink()}`;
  }

  /* In a car's messages: what the household decides for all of them (all on/off, quiet hours), and where. */
  _householdNotifyLink() {
    const settings = this._state.settings || {};
    const quiet = settings.quiet_enabled ? this._t("quiet_title", { from: this._hhmm(settings.quiet_from || "22:00"), to: this._hhmm(settings.quiet_to || "06:00") }) : this._t("quiet_off");
    const state = settings.notify_enabled === false ? this._t("notify_all_off_title") : quiet;
    return `<button class="link-row" data-act="goto-settings" data-tile="notifications" data-f="goto-notify">${ICONS.history}<span><strong>${esc(state)}</strong><small>${esc(this._t("notify_household_link"))}</small></span>${ICONS.back}</button>`;
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
        <div class="glance"></div>
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
        </div>
        <details class="more g-more">
          <summary>${ICONS.rules}<span>${this._t("g_settings")}</span><small class="g-sum"></small></summary>
          <div class="fields">
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
          <small class="hint split-note" hidden>${this._t("guest_split_note")}</small>
        </div>
          </div>
        </details>

        <div class="actions g-actions">
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
    root.querySelector(".split-note")?.toggleAttribute("hidden", inputs.continuous_charging_preferred !== false);

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
    // With a guest filled in, the button takes them away (their charge stays in the history).
    const fresh = root.querySelector(".new-guest");
    if (fresh) {
      const someone = Boolean(inputs.license_plate || hasSegments(g.plan) || g.car?.name || g.results?.car_name);
      const word = this._t(someone ? "remove_guest" : "new_guest");
      this._patch(fresh, word, `${ICONS[someone ? "close" : "plus"] || ICONS.plus}<span>${esc(word)}</span>`);
    }
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
    // At a glance: ready by and to what; and the settings in one line where they fold away.
    const root = this.shadowRoot;
    const inputs = this._gin;
    const ready = deadline ? this._readyText(deadline) : this._t("no_deadline_short");
    const glance = root.querySelector(".guest-page .glance");
    if (glance) {
      const target = plan && isNum(plan.end_soc) ? plan.end_soc : inputs.charge_limit;
      this._patch(
        glance,
        JSON.stringify([ready, target, this._lang]),
        `<span class="g-chip">${ICONS.history}<b>${esc(ready.charAt(0).toUpperCase() + ready.slice(1))}</b></span>${isNum(target) ? `<span class="g-chip">${ICONS.charge}<b>${esc(this._pct(target))}</b></span>` : ""}`,
      );
    }
    const sum = root.querySelector(".guest-page .g-sum");
    if (sum) {
      sum.textContent = [
        isNum(inputs.charger_power) ? `${this._num(inputs.charger_power, 1)} kW` : "",
        inputs.use_completion_time === false ? this._t("no_deadline_short") : this._hhmm(inputs.charge_completion_time || "07:00"),
        this._t(inputs.continuous_charging_preferred === false ? "split" : "continuous"),
      ]
        .filter(Boolean)
        .join(" · ");
    }
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
    await this._run("lookup", "ev_household_planner/guest_lookup");
  }

  async _guestPlan() {
    await this._gcommit(this._gdraft);
    if (await this._run("calculate", "ev_household_planner/guest_plan")) {
      this._gpreview = null;
      this._renderLive();
    }
  }

  async _guestChargeNow() {
    await this._gcommit(this._gdraft);
    if (await this._run("charge_now", "ev_household_planner/guest_charge_now")) {
      this._gpreview = null;
      this._renderLive();
    }
  }

  async _newGuest() {
    this._gdraft = {};
    this._gpreview = null;
    await this._run("new_guest", "ev_household_planner/guest_new");
  }

  /* Store changed guest inputs. While a plan exists, the change is shown as a preview first. */
  async _gcommit(inputs) {
    clearTimeout(this._gcommitTimer);
    const changes = Object.fromEntries(Object.entries(inputs).filter(([, v]) => v !== undefined));
    if (!Object.keys(changes).length) return;
    try {
      await this._ws("ev_household_planner/guest_set", { inputs: changes });
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
      const result = await this._ws("ev_household_planner/guest_preview", { inputs: this._guestWsInputs(inputs) });
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
      "charge_completion_time",
      "use_completion_time",
      "continuous_charging_preferred",
      "charger",
    ];
    return Object.fromEntries(keys.filter((key) => inputs[key] !== undefined && inputs[key] !== null).map((key) => [key, inputs[key]]));
  }

  // ------------------------------------------------------------------ history


  /* ---------------------------------------------------------------- Home: the supply, the house and the cars */

  _carColor(index) {
    return ["var(--evp-a)", "var(--evp-b)", "var(--evp-coral)", "var(--evp-sand)"][index % 4];
  }

  get _homeShown() {
    return !!(this._state?.supply || this._state?.solar || this._state?.home || this._cars.length || this._chargers.length);
  }

  /* The house is made once and moved into each fresh page, so its motion goes on. */
  _mountScene() {
    const slot = this.shadowRoot.querySelector(".scene-slot");
    if (!slot) return;
    if (!this._scene) {
      this._scene = new ClayScene();
      this._scene.t = (key, vars) => this._t(key, vars);
      // Where an administrator placed things, saved for this house; the other house keeps its own.
      this._scene.onSave = async (layout, house) => {
        const all = { ...(this._state.layout || {}) };
        if (Object.keys(layout).length) all[house] = layout;
        else delete all[house];
        if (!(await this._run("layout", "ev_household_planner/layout", { layout: all }))) return false;
        this._state = { ...this._state, layout: all };
        this._toast(this._t("edit_saved"));
        return true;
      };
    }
    slot.appendChild(this._scene.el);
    this._scene.update(this._sceneModel());
  }

  /* The place the Home tab shows: the home, or another place the household has chosen to look at. */
  _placeNow() {
    const sites = this._state?.sites || [];
    return sites.find((site) => site.id === this._place) || sites.find((site) => site.home) || { id: "home", home: true, name: "" };
  }

  /* The house a place is drawn as: the one chosen for it, else the classic house (a summer house: the cabin). */
  _houseOf(site) {
    const settings = this._state?.settings || {};
    const chosen = site.home ? settings.house : settings.houses?.[site.id];
    return ClayScene.HOUSES.includes(chosen) ? chosen : site.home ? "classic" : "cabin";
  }

  _sceneModel() {
    const place = this._placeNow();
    const supply = place.home ? this._state.supply : place.supply;
    const solar = place.home ? this._state.solar : place.solar;
    const phases = Number(supply?.phases) || 3;
    const kwOfAmps = (a) => (Number(a) || 0) * 0.23 * phases;
    const power = (kw) => (Math.abs(kw) < 1 ? `${Math.round(Math.abs(kw) * 1000)} W` : `${this._num(Math.abs(kw), 1)} kW`);
    // The picture is of one place: the chargers and cars that are there.
    const chargers = this._chargers.filter((c) => (c.site ?? "home") === place.id).slice(0, 2);
    const cars = this._cars.filter((v) => v.home !== false && (v.site ?? "home") === place.id).slice(0, 2);
    const carKw = (v) => {
      if (!v.charging) return 0;
      const amps = supply?.cars_now?.[v.id] ?? solar?.cars?.[v.id]?.amps;
      return isNum(amps) ? kwOfAmps(amps) : Number(v.charge_power) || 0;
    };
    const carsKw = cars.reduce((sum, v) => sum + carKw(v), 0);
    const home = (place.home ? this._state.home : place.energy) || {};
    const heatPump = place.home ? this._state.heat_pump : null;
    const sunKw = isNum(solar?.solar_kw) ? Number(solar.solar_kw) : isNum(home.solar_kw) ? Number(home.solar_kw) : null;
    const battery = solar?.battery || null;
    const gridKw = isNum(solar?.grid_kw)
      ? Number(solar.grid_kw)
      : isNum(home.grid_kw) ? Number(home.grid_kw)
      : supply && isNum(supply.house_now) ? kwOfAmps(supply.house_now) + carsKw : null;
    let houseKw = null;
    if (isNum(solar?.grid_kw)) houseKw = Math.max(0, Number(solar.grid_kw) + (sunKw || 0) - (Number(battery?.kw) || 0) - carsKw);
    else if (isNum(home.house_kw)) houseKw = Number(home.house_kw);
    else if (supply && isNum(supply.house_now)) houseKw = kwOfAmps(supply.house_now);
    const heatKw = isNum(heatPump?.kw) ? Number(heatPump.kw) : isNum(home.heat_pump_kw) ? Number(home.heat_pump_kw) : null;
    const flows = { sun: sunKw || 0, battery: Number(battery?.kw) || 0, home: houseKw || 0, grid: gridKw === null ? 0 : -gridKw, heat: heatKw || 0 };
    const labels = [];
    if (heatKw !== null) labels.push({ key: "heat", title: this._t("home_heat"), value: power(heatKw), short: power(heatKw), on: heatKw > 0.05 });
    if (solar || isNum(home.solar_kw)) labels.push({ key: "sun", title: this._t("home_solar"), value: sunKw === null ? "–" : power(sunKw), short: sunKw === null ? "–" : power(sunKw), on: (sunKw || 0) > 0.05 });
    labels.push({ key: "home", title: this._t("home_house"), value: houseKw === null ? "–" : power(houseKw), short: houseKw === null ? "–" : power(houseKw), on: (houseKw || 0) > 0.05 });
    if (battery) {
      const kw = Number(battery.kw) || 0;
      const soc = isNum(battery.soc) ? this._pct(battery.soc) : "–";
      const doing = Math.abs(kw) < 0.05 ? "" : ` · ${this._t(kw > 0 ? "home_charges" : "home_gives", { kw: power(kw) })}`;
      labels.push({ key: "battery", title: this._t("home_battery"), value: `${soc}${doing}`, short: soc, on: Math.abs(kw) > 0.05, bar: isNum(battery.soc) ? Number(battery.soc) : undefined });
    }
    if (gridKw !== null) {
      const text = Math.abs(gridKw) < 0.05 ? "0 W" : this._t(gridKw > 0 ? "home_buys" : "home_sells", { kw: power(gridKw) });
      // Blue when the house buys, purple when it sells: the colours of the Energy dashboard.
      const colour = gridKw > 0.05 ? "#3B8BFF" : gridKw < -0.05 ? "#9A6BFF" : "#9AA6B4";
      // Closed: the pylon, an arrow in or out and the power. The words come when it is tapped.
      const dir = gridKw > 0.05 ? "in" : gridKw < -0.05 ? "out" : null;
      labels.push({ key: "grid", title: this._t("home_grid"), value: text, short: Math.abs(gridKw) < 0.05 ? "0 W" : power(Math.abs(gridKw)), on: Math.abs(gridKw) > 0.05, colour, icon: "grid", dir });
    }
    const sun = this._hass?.states?.["sun.sun"];
    const elevation = Number(sun?.attributes?.elevation);
    // From day (0) to night (1): day above 6°, night below −6°, gliding between them.
    const light = !Number.isFinite(elevation) ? (sun?.state === "below_horizon" ? 1 : 0) : clamp((6 - elevation) / 12, 0, 1);
    const model = {
      house: this._houseOf(place),
      // Another place has its own layout of its house.
      layoutKey: place.home ? this._houseOf(place) : `${this._houseOf(place)}@${place.id}`,
      // Where things were placed in each house, and whether this user may place them.
      layout: this._state.layout || {},
      canEdit: !!this._hass?.user?.is_admin,
      light,
      solar: solar || isNum(home.solar_kw) ? { kw: sunKw } : null,
      battery,
      heat: heatPump || (heatKw !== null ? { kw: heatKw } : null),
      chargers,
      cars: [],
      flows,
      labels,
    };
    cars.forEach((v, i) => {
      const kw = carKw(v);
      const soc = isNum(v.soc) ? this._pct(v.soc) : "";
      const plugged = v.connected === true || (v.connected == null && !!v.charging);
      const charger = chargers.findIndex((c) => c.id === v.charger?.id);
      const settings = v.settings || {};
      const photo = settings.body === "photo" && v.image_original ? v.image : null;
      model.cars.push({
        id: v.id,
        image: photo,
        body: photo || !ClayScene.BODIES.includes(settings.body) ? "sedan" : settings.body,
        paint: settings.paint === "black" ? "black" : "white",
        spot: settings.spot === "left" ? 0 : settings.spot === "right" ? 1 : null,
        plugged,
        charging: kw > 0.05,
        status: v.status,
        charger: charger >= 0 ? charger : i,
      });
      flows[`car${i}`] = kw;
      // The car's label in the colour of its cable: grey, blue when plugged in, yellow when planned, green when charging or done.
      const start = v.status === "planned" && hasSegments(v.plan) ? v.plan.segments[0].start : null;
      const doing = kw > 0.05 ? power(kw) : !plugged ? this._t("home_unplugged") : start ? this._t("home_planned_at", { time: this._time(start) }) : v.status === "completed" ? this._t("home_done") : this._t("home_idle");
      const colour = !plugged ? "#9AA6B4" : kw > 0.05 || v.status === "completed" ? "#22C981" : start ? "#F5A524" : "#3B8BFF";
      labels.push({ key: `car${i}`, title: v.name, value: [soc, doing].filter(Boolean).join(" · "), short: soc || doing, on: kw > 0.05, colour, bar: isNum(v.soc) ? Number(v.soc) : undefined });
    });
    return model;
  }

  // ------------------------------------------------------------------ the Home tab

  _homeHtml() {
    const supply = this._state.supply;
    const sites = this._state.sites || [];
    const place = this._placeNow();
    // More than one place: which one the picture shows.
    const places = sites.length > 1
      ? `<div class="chips places" role="group" aria-label="${esc(this._t("places"))}">${sites.map((site) => `<button data-act="place" data-id="${esc(site.id)}" data-f="place-${esc(site.id)}" class="${site.id === place.id ? "on" : ""}" aria-pressed="${site.id === place.id}">${esc(site.name || this._t("place_home"))}</button>`).join("")}</div>`
      : "";
    const scene = `<section class="panel home-flow">${places}<div class="scene-slot" role="img" aria-label="${esc(this._t("home_title"))}"></div>`;
    const now = this._homeNowHtml();
    const tonight = this._tonightHtml();
    const today = this._state.home?.history ? `<section class="panel home-today"><div class="panel-head"><h2>${ICONS.history}<span>${esc(this._t("home_today"))}</span></h2></div><div class="today-body">${this._todayBodyHtml()}</div></section>` : "";
    const chargers = this._chargersHtml();
    let shared = "";
    if (supply) shared = this._supplyHtml(supply);
    // The household's other places, each with its own supply.
    for (const site of this._state.sites || []) if (site.supply && !site.home) shared += this._supplyHtml(site.supply, site);
    return `<div class="home-page">${scene}${now}</section>${tonight}${shared}${today}${chargers}</div>`;
  }

  /* Live numbers under the house: only those the home has. */
  _homeNowHtml() {
    const place = this._placeNow();
    const h = (place.home ? this._state.home : place.energy) || {};
    const power = (kw) => (Math.abs(kw) < 1 ? `${Math.round(Math.abs(kw) * 1000)} W` : `${this._num(Math.abs(kw), 1)} kW`);
    const chips = [];
    const add = (icon, label, value, cls = "") => chips.push(`<div class="now-chip ${cls}"><span class="nc-icon">${ICONS[icon] || ""}</span><span class="nc-text"><small>${esc(label)}</small><b>${esc(value)}</b></span></div>`);
    if (isNum(h.grid_kw)) add("grid", this._t("home_grid_now"), `${h.grid_kw < -0.05 ? "−" : ""}${power(h.grid_kw)}`, h.grid_kw < -0.05 ? "good" : "");
    if (isNum(h.house_kw)) add("home", this._t("home_house_now_short"), power(h.house_kw));
    if (isNum(h.cars_kw) && (h.cars_kw > 0.05 || this._cars.some((v) => v.charging))) add("car", this._t("home_cars_now"), power(h.cars_kw), h.cars_kw > 0.05 ? "live" : "");
    if (isNum(h.solar_kw)) add("sun", this._t("home_sun_now"), power(h.solar_kw), h.solar_kw > 0.05 ? "sun" : "");
    if (isNum(h.heat_pump_kw)) add("heat", this._t("home_heat_now"), power(h.heat_pump_kw));
    const price = this._priceNow();
    if (price !== null) add("lowprice", this._t("home_price_now"), `${this._money(price)}/kWh`);
    if (isNum(h.temperature)) add("temp", this._t("home_outside"), `${this._num(h.temperature, 1)} °C`);
    return chips.length ? `<div class="now-chips">${chips.join("")}</div>` : "";
  }

  _priceNow() {
    const now = Date.now();
    const slot = (this._state.prices || []).find((p) => new Date(p.start).getTime() <= now && new Date(p.end).getTime() > now);
    return slot && isNum(slot.price) ? Number(slot.price) : null;
  }

  /* Tonight: every car's plan on one line of time, over the prices. */
  _tonightHtml() {
    const cars = this._cars.filter((v) => hasSegments(v.plan));
    const head = `<div class="panel-head"><h2>${ICONS.plan}<span>${esc(this._t("home_tonight"))}</span></h2></div>`;
    if (!cars.length) return `<section class="panel tonight">${head}<p class="hint">${esc(this._t("home_tonight_none"))}</p></section>`;
    const t0 = Date.now();
    const ends = cars.map((v) => new Date(v.plan.segments.at(-1).end).getTime());
    const t1 = Math.max(t0 + 8 * 3600e3, ...ends) + 1800e3;
    const span = t1 - t0;
    const x = (t) => ((clamp(t, t0, t1) - t0) / span) * 100;
    const prices = (this._state.prices || []).filter((p) => new Date(p.end).getTime() > t0 && new Date(p.start).getTime() < t1);
    const values = prices.map((p) => p.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bars = prices
      .map((p, i) => {
        const a = x(new Date(p.start).getTime());
        const b = x(new Date(p.end).getTime());
        const t = max > min ? (p.price - min) / (max - min) : 0.5;
        return `<i style="left:${a.toFixed(2)}%;width:${Math.max(0.2, b - a - 0.25).toFixed(2)}%;height:${(25 + t * 75).toFixed(0)}%;background:${priceColor(t)};--d:${i * 25}ms" title="${esc(`${this._time(p.start)}: ${this._money(p.price)}`)}"></i>`;
      })
      .join("");
    const rows = cars
      .map((v, i) => {
        const segs = v.plan.segments
          .map((seg, k) => {
            const a = x(new Date(seg.start).getTime());
            const b = x(new Date(seg.end).getTime());
            return `<i style="left:${a.toFixed(2)}%;width:${Math.max(0.6, b - a).toFixed(2)}%;background:${this._carColor(i)};--d:${200 + k * 80}ms"></i>`;
          })
          .join("");
        return `<div class="tn-row"><span class="tn-name"><em style="background:${this._carColor(i)}"></em><span>${esc(v.name)}</span></span><div class="tn-track">${segs}</div><span class="tn-cost">${this._money(v.plan.cost)}</span></div>`;
      })
      .join("");
    // Room for about six labels: every 3 hours on a night, every 6, 12 or 24 over days (midnight as the day).
    const hours = span / 3600e3;
    const every = hours <= 18 ? 3 : hours <= 36 ? 6 : hours <= 72 ? 12 : 24;
    const dayName = new Intl.DateTimeFormat(this._locale, { weekday: "short" });
    const ticks = [];
    for (let t = Math.ceil(t0 / 3600e3) * 3600e3; t < t1; t += 3600e3) {
      const date = new Date(t);
      const hour = date.getHours();
      if (hour % every !== 0 || x(t) > 96) continue;
      const label = hour === 0 && every >= 6 ? dayName.format(date).replace(".", "") : String(hour).padStart(2, "0");
      ticks.push(`<span style="left:${x(t).toFixed(2)}%">${esc(label)}</span>`);
    }
    const energy = cars.reduce((sum, v) => sum + (Number(v.plan.energy) || 0), 0);
    const cost = cars.reduce((sum, v) => sum + (Number(v.plan.cost) || 0), 0);
    return `<section class="panel tonight">${head}
      <div class="tn-chart"><div class="tn-prices">${bars}</div>${rows}<div class="tn-axis">${ticks.join("")}</div></div>
      <p class="hint">${esc(this._t("home_tonight_total", { kwh: this._kwh(energy), cost: this._money(cost) }))}</p></section>`;
  }

  /* The shared supply of a place: the home's, or (with ``site``) another place's. */
  _supplyHtml(supply, site = null) {
    const amps = (a) => `${Math.round(Number(a))} A`;
    const cars = this._cars.filter((v) => v.connected && (v.site ?? "home") === (site?.id ?? "home"));
    const house = isNum(supply.house_now) ? Number(supply.house_now) : isNum(supply.house_expected) ? Number(supply.house_expected) : 0;
    const carAmps = (v) => Number(supply.cars_now?.[v.id] ?? (v.charging ? supply.cars?.[v.id] : 0) ?? 0) || 0;
    const used = house + cars.reduce((sum, v) => sum + carAmps(v), 0);
    const limit = Number(supply.limit);
    const share = Math.min(1, used / limit);
    const gauge = `<div class="home-gauge" role="img" aria-label="${esc(this._t("home_used", { used: amps(used), limit: amps(limit) }))}">
        <div class="hg-house" style="width:${Math.min(100, (house / limit) * 100)}%"></div>${cars.map((v, i) => `<div style="width:${Math.min(100, (carAmps(v) / limit) * 100)}%;background:${this._carColor(i)}"></div>`).join("")}
      </div><div class="home-gauge-text"><span>${esc(this._t("home_used", { used: amps(used), limit: amps(limit) }))}</span><span class="${share > 0.95 ? "bad-text" : ""}">${esc(this._t("home_limit", { limit: amps(limit) }))}</span></div>`;
    const rows = supply.timeline || [];
    let chart = "";
    if (rows.length) {
      const cw = 340, ch = 150, bw = cw / rows.length;
      const y = (a) => ch - (a / limit) * (ch - 10);
      chart += `<line class="tl-limit" x1="0" x2="${cw}" y1="${y(limit)}" y2="${y(limit)}"/>`;
      rows.forEach((r, i) => {
        let top = ch;
        const parts = [[r.house, "var(--evp-line)"], ...cars.map((v, j) => [r.cars?.[v.id] || 0, this._carColor(j)])];
        for (const [a, color] of parts) {
          if (!a) continue;
          const h = (a / limit) * (ch - 10);
          top -= h;
          chart += `<rect x="${(i * bw + 1).toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" style="fill:${color}"/>`;
        }
        if (i % Math.max(1, Math.round(rows.length / 5)) === 0) chart += `<text class="tl-x" x="${(i * bw).toFixed(1)}" y="${ch + 14}">${esc(this._time(r.start))}</text>`;
      });
      chart = `<svg class="home-chart" viewBox="0 0 ${cw} ${ch + 18}" role="img" aria-label="${esc(this._t("home_timeline"))}">${chart}</svg>`;
    }
    const why = [];
    const charging = cars.filter((v) => rows.some((r) => r.cars?.[v.id]));
    if (!charging.length) why.push(this._t("home_why_none"));
    {
      const first = [...charging].sort((a, b) => rows.findIndex((r) => r.cars?.[a.id]) - rows.findIndex((r) => r.cars?.[b.id]))[0];
      const together = rows.some((r) => charging.filter((v) => r.cars?.[v.id]).length > 1);
      if (charging.length > 1) why.push(together ? this._t("home_why_share") : this._t("home_why_turns"));
      if (charging.length > 1 && first?.deadline) why.push(this._t("home_why_first", { name: first.name, time: this._time(first.deadline) }));
    }
    for (const v of cars) if (isNum(supply.short?.[v.id])) why.push(this._t("home_why_short", { name: v.name, kwh: this._kwh(supply.short[v.id]) }));
    if (supply.guard) why.push(this._t("home_guard"));
    const legend = `<div class="home-legend"><span><i style="background:var(--evp-line)"></i>${esc(this._t("home_house"))}</span>${cars.map((v, i) => `<span><i style="background:${this._carColor(i)}"></i>${esc(v.name)}</span>`).join("")}</div>`;
    return `<section class="panel"><div class="panel-head"><h2>${ICONS.rules}<span>${esc(site ? `${this._t("home_timeline")}: ${site.name}` : this._t("home_timeline"))}</span></h2></div>
        ${gauge}
        <p class="hint">${esc(isNum(supply.house_now) ? this._t("home_house_now", { amps: amps(supply.house_now) }) : supply.meter ? this._t("home_house_expected", { amps: amps(house) }) : this._t("home_no_meter", { amps: amps(house) }))}</p>
        <p class="hint">${esc(this._t("home_timeline_hint", { limit: amps(limit) }))}</p>
        ${chart}${legend}
        ${why.map((t) => `<p class="why">${esc(t)}</p>`).join("")}
      </section>`;
  }

  /* Today: the whole house from Home Assistant's statistics, and the cars' part of it. */
  _todayBodyHtml() {
    const data = this._houseData?.[this._histKey("day", 0)];
    if (!data) return `<p class="hint">…</p>`;
    const kwh = data.rows.reduce((sum, r) => sum + (Number(r.kwh) || 0), 0);
    const costs = data.rows.map((r) => r.cost).filter(isNum);
    const cost = costs.length ? costs.reduce((a, b) => a + Number(b), 0) : null;
    const [start, end] = this._histRange("day", 0);
    const cars = this._sessionsIn(start, end).reduce((sum, e) => sum + (Number(e.energy) || 0), 0);
    const share = kwh > 0 ? Math.min(100, (cars / kwh) * 100) : 0;
    const peak = Math.max(0.01, ...data.rows.map((r) => Number(r.kwh) || 0));
    const hours = Array.from({ length: 24 }, (_, h) => {
      const row = data.rows.find((r) => new Date(r.start).getHours() === h);
      const value = row ? Number(row.kwh) || 0 : 0;
      return `<i style="height:${((value / peak) * 100).toFixed(1)}%;--d:${h * 20}ms" title="${esc(`${String(h).padStart(2, "0")}: ${this._kwh(value, 2)}`)}"></i>`;
    }).join("");
    return `<dl class="today-nums">
        <div><dt>${esc(this._t("home_today_house"))}</dt><dd data-count="${kwh.toFixed(2)}" data-unit="kwh">${this._kwh(kwh)}</dd></div>
        ${cost !== null ? `<div><dt>${esc(this._t("hist_cost"))}</dt><dd>${this._money(cost)}</dd></div>` : ""}
        <div><dt>${esc(this._t("home_today_cars"))}</dt><dd>${this._kwh(cars)} · ${this._pct(share)}</dd></div>
      </dl>
      <div class="share-bar"><i style="width:${share.toFixed(1)}%"></i></div>
      <div class="hour-bars" aria-hidden="true">${hours}</div>`;
  }

  async _afterHome() {
    this._countAll();
    if (!this._state.home?.history) return;
    const key = this._histKey("day", 0);
    const fresh = this._houseAt?.[key] && Date.now() - this._houseAt[key] < 10 * 60e3;
    if (fresh) return;
    await this._loadHouse("day", 0);
    this._patch(this.shadowRoot.querySelector(".home-today .today-body"), `today:${this._houseAt?.[key]}:${this._lang}`, this._todayBodyHtml());
  }

  // ------------------------------------------------------------------ the history

  /* Where a period begins and ends: ``offset`` periods back from the current one. */
  _histRange(period, offset = 0) {
    const now = new Date();
    let start;
    let end;
    if (period === "day") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    } else if (period === "week") {
      const monday = (now.getDay() + 6) % 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - monday + offset * 7);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    } else if (period === "year") {
      start = new Date(now.getFullYear() + offset, 0, 1);
      end = new Date(start.getFullYear() + 1, 0, 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    }
    return [start, end];
  }

  _histKey(period, offset) {
    const [start] = this._histRange(period, offset);
    return `${period}:${start.toISOString()}`;
  }

  /* The buckets of a period: hours of a day, days of a week or month, months of a year. */
  _buckets(period, start, end) {
    const out = [];
    let t = new Date(start);
    while (t < end) {
      const next =
        period === "day" ? new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours() + 1)
        : period === "year" ? new Date(t.getFullYear(), t.getMonth() + 1, 1)
        : new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
      out.push([new Date(t), next]);
      t = next;
    }
    return out;
  }

  _bucketLabel(period, start) {
    if (period === "day") return String(start.getHours()).padStart(2, "0");
    if (period === "week") return new Intl.DateTimeFormat(this._locale, { weekday: "short" }).format(start).replace(".", "");
    if (period === "year") return new Intl.DateTimeFormat(this._locale, { month: "short" }).format(start).replace(".", "").slice(0, 3);
    return String(start.getDate());
  }

  _periodTitle(period, start, end) {
    const f = (opts, d) => new Intl.DateTimeFormat(this._locale, opts).format(d);
    if (period === "day") return f({ weekday: "long", day: "numeric", month: "long" }, start);
    if (period === "week") {
      const thursday = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 3);
      const first = new Date(thursday.getFullYear(), 0, 4);
      const week = 1 + Math.round(((thursday - first) / 86400e3 - 3 + ((first.getDay() + 6) % 7)) / 7);
      return `${this._t("hist_week_of", { week })} · ${f({ day: "numeric", month: "short" }, start)}–${f({ day: "numeric", month: "short" }, new Date(end - 1))}`;
    }
    if (period === "year") return String(start.getFullYear());
    return f({ month: "long", year: "numeric" }, start);
  }

  /* Who is in a scope: [{key, name, color, sessions}] for the cars, and the guests. */
  _scopeSeries(scope) {
    const cars = this._cars;
    const guestEntries = (this._guest?.history || []).map((e) => ({ ...e, energy: (e.measured_energy ?? e.energy) || 0, cost: (e.measured_cost ?? e.cost) || 0, guest: true }));
    const series = [];
    const chargerId = scope.startsWith("charger:") ? scope.slice(8) : null;
    const charger = chargerId ? this._charger(chargerId) : null;
    cars.forEach((v, i) => {
      if (scope.startsWith("car:") && scope !== `car:${v.id}`) return;
      if (chargerId && v.charger?.id !== chargerId) return;
      if (scope === "guests") return;
      series.push({ key: v.id, name: v.name, color: this._carColor(i), sessions: v.history || [], months: v.months || {}, car: v });
    });
    if (scope === "all" || scope === "guests" || scope === "house" || (charger && guestEntries.some((e) => e.charger === charger.name))) {
      const entries = charger ? guestEntries.filter((e) => e.charger === charger.name) : guestEntries;
      if (entries.length) series.push({ key: "guest", name: this._t("hist_guests"), color: "var(--evp-sand)", sessions: entries, months: null });
    }
    return series;
  }

  _sessionsIn(start, end, scope = "all") {
    const out = [];
    for (const s of this._scopeSeries(scope)) for (const e of s.sessions) {
      const t = new Date(e.start).getTime();
      if (t >= start.getTime() && t < end.getTime()) out.push({ ...e, series: s });
    }
    return out.sort((a, b) => new Date(b.start) - new Date(a.start));
  }

  async _loadHouse(period, offset) {
    const key = this._histKey(period, offset);
    const [start, end] = this._histRange(period, offset);
    this._houseData = this._houseData || {};
    this._houseAt = this._houseAt || {};
    try {
      this._houseData[key] = await this._ws("ev_household_planner/history", { period, start: start.toISOString(), end: end.toISOString() });
    } catch (_err) {
      this._houseData[key] = { rows: [], typical_day: [] };
    }
    this._houseAt[key] = Date.now();
    return this._houseData[key];
  }

  _historyHtml() {
    const view = this._histView === "learned" ? "learned" : "history";
    const switcher = `<nav class="segmented hist-views" role="tablist">${["history", "learned"]
      .map((k) => `<button role="tab" data-act="hist-view" data-value="${k}" data-f="hv-${k}" aria-selected="${k === view}" class="${k === view ? "on" : ""}">${this._t(k === "history" ? "view_history" : "view_learned")}</button>`)
      .join("")}</nav>`;
    if (view === "learned") return `<div class="page stack hist-page">${switcher}${this._learnedHtml()}</div>`;
    const cars = this._cars;
    const guestHistory = this._guest?.history || [];
    if (!cars.some((v) => (v.history || []).length || Object.keys(v.months || {}).length) && !guestHistory.length && !this._state.home?.history) {
      return `<div class="page stack hist-page">${switcher}<section class="empty">${MARK}<p>${this._t(cars.length ? "car_history_empty" : "history_empty")}</p></section></div>`;
    }
    const period = HIST_PERIODS.includes(this._histPeriod) ? this._histPeriod : "month";
    const offset = Math.min(0, this._histOffset || 0);
    const scopes = [["all", this._t("hist_all")], ...cars.map((v) => [`car:${v.id}`, v.name]), ...this._chargers.map((c) => [`charger:${c.id}`, c.name])];
    if (guestHistory.length) scopes.push(["guests", this._t("hist_guests")]);
    if (this._state.home?.history) scopes.push(["house", this._t("hist_house")]);
    const scope = scopes.some(([k]) => k === this._histScope) ? this._histScope : "all";
    const [start, end] = this._histRange(period, offset);
    const controls = `<div class="hist-controls">
        <div class="segmented hist-period" role="radiogroup">${HIST_PERIODS.map((p) => `<button role="radio" data-act="hist-period" data-value="${p}" data-f="hp-${p}" aria-checked="${p === period}" class="${p === period ? "on" : ""}">${this._t(`hist_${p}`)}</button>`).join("")}</div>
        <div class="chips hist-scope">${scopes.map(([k, name]) => `<button data-act="hist-scope" data-value="${esc(k)}" data-f="hs-${esc(k)}" class="${k === scope ? "on" : ""}" aria-pressed="${k === scope}">${esc(name)}</button>`).join("")}</div>
        <div class="hist-nav"><button class="icon" data-act="hist-move" data-step="-1" data-f="hm-prev" aria-label="${this._t("hist_prev")}">${ICONS.back}</button>
          <strong>${esc(this._periodTitle(period, start, end))}</strong>
          <button class="icon fwd" data-act="hist-move" data-step="1" data-f="hm-next" aria-label="${this._t("hist_next")}" ${offset >= 0 ? "disabled" : ""}>${ICONS.back}</button></div>
      </div>`;
    return `<div class="page stack hist-page">${switcher}${controls}<div class="hist-body" data-scope="${esc(scope)}">${this._histBodyHtml(period, offset, scope)}</div></div>`;
  }

  _histBodyHtml(period, offset, scope) {
    const [start, end] = this._histRange(period, offset);
    const buckets = this._buckets(period, start, end);
    const series = this._scopeSeries(scope);
    const house = scope === "house" ? this._houseData?.[this._histKey(period, offset)] : null;
    if (scope === "house" && !house) return `<p class="hint">…</p>`;
    // Energy and cost per bucket and series.
    const grid = buckets.map(() => ({}));
    let energy = 0;
    let cost = 0;
    let sun = 0;
    let count = 0;
    const indexOf = (t) => buckets.findIndex(([a, b]) => t >= a.getTime() && t < b.getTime());
    for (const s of series) {
      if (period === "year" && s.months) {
        for (const [key, m] of Object.entries(s.months)) {
          const [y, mo] = key.split("-").map(Number);
          const i = indexOf(new Date(y, mo - 1, 1).getTime());
          if (i < 0) continue;
          grid[i][s.key] = (grid[i][s.key] || 0) + (Number(m.energy) || 0);
          energy += Number(m.energy) || 0;
          cost += Number(m.cost) || 0;
          count += Number(m.sessions) || 0;
        }
        continue;
      }
      for (const e of s.sessions) {
        const i = indexOf(new Date(e.start).getTime());
        if (i < 0) continue;
        grid[i][s.key] = (grid[i][s.key] || 0) + (Number(e.energy) || 0);
        energy += Number(e.energy) || 0;
        cost += Number(e.cost) || 0;
        sun += Number(e.solar) || 0;
        count += 1;
      }
    }
    let houseRows = null;
    if (house) {
      houseRows = buckets.map(([a, b]) => house.rows.filter((r) => { const t = new Date(r.start).getTime(); return t >= a.getTime() && t < b.getTime(); }).reduce((sum, r) => sum + (Number(r.kwh) || 0), 0));
    }
    const houseKwh = houseRows ? houseRows.reduce((a, b) => a + b, 0) : null;
    const houseCost = house ? house.rows.map((r) => r.cost).filter(isNum).reduce((a, b) => a + Number(b), 0) : null;
    // The numbers that count up.
    const nums = [];
    const num = (label, value, kind, cls = "") => nums.push(`<div class="${cls}"><dt>${esc(label)}</dt><dd data-count="${Number(value).toFixed(3)}" data-unit="${kind}">${kind === "kwh" ? this._kwh(value) : kind === "money" ? this._money(value) : kind === "pct" ? this._pct(value) : this._num(value, 0)}</dd></div>`);
    if (houseKwh !== null) {
      num(this._t("hist_house"), houseKwh, "kwh");
      if (houseCost) num(this._t("hist_cost"), houseCost, "money");
      num(this._t("home_today_cars"), energy, "kwh");
      if (houseKwh > 0) num(this._t("hist_cars_share", { pct: "" }).replace(/\s+$/, ""), Math.min(100, (energy / houseKwh) * 100), "pct");
    } else {
      num(this._t("hist_energy"), energy, "kwh");
      num(this._t("hist_cost"), cost, "money");
      if (energy > 0) num(this._t("hist_avg"), cost / energy, "money", "small");
      num(this._t("hist_sessions"), count, "n");
      if (sun > 0.05 && energy > 0) num(this._t("hist_sun"), Math.min(100, (sun / energy) * 100), "pct", "sun");
    }
    // The chart: one bar per bucket, the cars stacked, the rest of the house behind them.
    const totals = buckets.map((_, i) => Object.values(grid[i]).reduce((a, b) => a + b, 0));
    const peak = Math.max(0.1, ...totals, ...(houseRows || []));
    const n = buckets.length;
    const cw = 600;
    const ch = 180;
    const gap = n > 24 ? 2 : 4;
    const bw = cw / n;
    let bars = "";
    const axis = [];
    for (const f of [0.25, 0.5, 0.75, 1]) bars += `<line class="hb-grid" x1="0" x2="${cw}" y1="${(ch - f * ch).toFixed(1)}" y2="${(ch - f * ch).toFixed(1)}"/>`;
    buckets.forEach(([a], i) => {
      const x = i * bw + gap / 2;
      const w = Math.max(1, bw - gap);
      if (houseRows) {
        const h = (houseRows[i] / peak) * ch;
        bars += `<rect class="hb-bar house" x="${x.toFixed(1)}" y="${(ch - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(4, w / 3).toFixed(1)}" style="--d:${i * 18}ms"><title>${esc(`${this._bucketLabel(period, a)}: ${this._kwh(houseRows[i], 2)}`)}</title></rect>`;
      }
      let top = ch;
      for (const s of series) {
        const value = grid[i][s.key] || 0;
        if (!value) continue;
        const h = (value / peak) * ch;
        top -= h;
        bars += `<rect class="hb-bar" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(4, w / 3).toFixed(1)}" style="fill:${s.color};--d:${i * 18 + 120}ms"><title>${esc(`${s.name} · ${this._bucketLabel(period, a)}: ${this._kwh(value, 1)}`)}</title></rect>`;
      }
      const every = n > 24 ? 5 : n > 12 ? 3 : 1;
      if (i % every === 0) axis.push(`<span style="left:${(((x + w / 2) / cw) * 100).toFixed(2)}%">${esc(this._bucketLabel(period, a))}</span>`);
    });
    const chart = `<svg class="hist-chart" viewBox="0 -6 ${cw} ${ch + 8}" preserveAspectRatio="none" role="img" aria-label="${esc(this._periodTitle(period, start, end))}">${bars}</svg><div class="hb-axis">${axis.join("")}</div>
      <div class="home-legend">${houseRows ? `<span><i style="background:var(--evp-line)"></i>${esc(this._t("hist_house"))}</span>` : ""}${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>`;
    // A year: every day as a square, coloured by how much was charged.
    let calendar = "";
    if (period === "year" && scope !== "house") {
      const days = new Map();
      for (const s of series) for (const e of s.sessions) {
        const d = new Date(e.start);
        if (d < start || d >= end) continue;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        days.set(key, (days.get(key) || 0) + (Number(e.energy) || 0));
      }
      const most = Math.max(0.1, ...days.values());
      const first = (start.getDay() + 6) % 7;
      let cells = "";
      for (let k = 0, t = new Date(start); t < end; k += 1, t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)) {
        const value = days.get(`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`) || 0;
        const col = Math.floor((k + first) / 7);
        const row = (k + first) % 7;
        cells += `<rect x="${col * 11}" y="${row * 11}" width="9" height="9" rx="2" class="cal-day" style="fill-opacity:${value ? (0.25 + 0.75 * (value / most)).toFixed(2) : 1};${value ? "fill:var(--evp-a)" : ""};--d:${col * 12}ms"><title>${esc(`${this._date(t.toISOString())}: ${this._kwh(value)}`)}</title></rect>`;
      }
      calendar = `<div class="cal-wrap"><svg class="cal" viewBox="0 0 ${54 * 11} 77" aria-hidden="true">${cells}</svg></div>`;
    }
    // The charges in the period.
    const sessions = scope === "house" ? [] : this._sessionsIn(start, end, scope);
    const list = sessions.length
      ? `<ul class="sessions">${sessions.slice(0, 40).map((e) => (e.series.car ? this._carSessionHtml(e.series.car, e, { name: scope === "all" || scope.startsWith("charger:") }) : this._guestSessionHtml(e))).join("")}</ul>`
      : scope === "house" ? "" : `<p class="hint">${esc(this._t("hist_none"))}</p>`;
    const empty = scope === "house" && !house.rows.length ? `<p class="hint">${esc(this._t("hist_house_none"))}</p>` : "";
    const exportButton = sessions.length
      ? `<div class="row-buttons"><button class="btn ghost" data-act="hist-export" data-f="hist-export">${ICONS.download}<span>${esc(this._t("hist_export"))}</span></button></div>`
      : "";
    return `<section class="panel hist-hero"><dl class="hist-nums">${nums.join("")}</dl>${empty}${chart}${calendar}</section>${list}${exportButton}`;
  }

  /* The charges of the period and scope shown, as a CSV file: {name, text}. Danish spreadsheets
     read ";" between the columns and a decimal comma; the others "," and a decimal point. */
  _historyCsv() {
    const scope = this.shadowRoot.querySelector(".hist-body")?.dataset.scope || "all";
    const period = HIST_PERIODS.includes(this._histPeriod) ? this._histPeriod : "month";
    const [start, end] = this._histRange(period, Math.min(0, this._histOffset || 0));
    const danish = this._lang === "da";
    const sep = danish ? ";" : ",";
    const pad = (n) => String(n).padStart(2, "0");
    const day = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const when = (iso) => {
      const d = new Date(iso);
      return !iso || Number.isNaN(d.getTime()) ? "" : `${day(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const num = (value, digits = 2) => (isNum(value) ? Number(value).toFixed(digits).replace(".", danish ? "," : ".") : "");
    const quoted = (value) => (value.includes(sep) || /["\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    // A name that begins like a formula gets an apostrophe, so the spreadsheet shows it as text.
    const word = (value) => {
      const t = String(value ?? "");
      return quoted(/^[=+\-@\t\r]/.test(t) ? `'${t}` : t);
    };
    const head = ["start", "end", "car", "charger", "energy", "cost", "currency", "start_soc", "end_soc", "solar", "source"].map((k) => word(this._t(`csv_${k}`)));
    const rows = this._sessionsIn(start, end, scope).map((e) => {
      const v = e.series.car;
      const name = v ? v.name : `${this._t("guest_card")}: ${[e.car, e.plate].filter(Boolean).join(" ") || this._t("unknown_car")}`;
      const source = e.source ? TEXT.en[`csv_source_${e.source}`] ? this._t(`csv_source_${e.source}`) : e.source : "";
      return [
        when(e.start),
        when(e.end),
        word(name),
        word(v ? v.charger?.name : e.charger),
        quoted(num(e.energy)),
        quoted(num(e.cost)),
        word((v ? null : e.currency) || this._currency),
        // A guest's entry has the level the guest typed in at the start, and no level at the end.
        quoted(num(v ? e.start_soc : e.soc, 0)),
        quoted(num(v ? e.end_soc : null, 0)),
        quoted(v ? num(e.solar) : ""),
        word(source),
      ].join(sep);
    });
    return { name: `ev-planner-${day(start)}-${day(new Date(end.getTime() - 1))}.csv`, text: [head.join(sep), ...rows].join("\r\n") + "\r\n" };
  }

  /* The support export: the integration's diagnostics (everything EV Planner knows, see support.py), as a file. */
  async _exportSupport() {
    if (this._exporting) return;
    this._exporting = true;
    this._exportError = "";
    this._render();
    try {
      const entry = this._state?.entry_id;
      if (!entry) throw new Error("no entry");
      const response = await this._hass.fetchWithAuth(`/api/diagnostics/config_entry/${entry}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
      this._download(blob, `ev-planner-support-${stamp}.json`);
    } catch (err) {
      this._exportError = String(err?.message || err);
    } finally {
      this._exporting = false;
      this._render();
    }
  }

  _download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.hidden = true;
    this.shadowRoot.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* Download the CSV: a link to the file in memory, clicked once. The mark first tells Excel it is UTF-8. */
  _exportHistory() {
    const csv = this._historyCsv();
    const url = URL.createObjectURL(new Blob(["\ufeff", csv.text], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = csv.name;
    link.hidden = true;
    this.shadowRoot.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  _guestSessionHtml(e) {
    return `<li>
      <div class="when"><b>${new Date(e.start).getDate()}</b><span>${new Intl.DateTimeFormat(this._locale, { month: "short" }).format(new Date(e.start))}</span></div>
      <div class="what"><strong>${esc(e.car || this._t("unknown_car"))}</strong><span>${e.plate ? `<em class="mini-plate">${esc(e.plate)}</em>` : ""}${this._time(e.start)}–${this._time(e.end)}</span></div>
      <div class="nums"><b>${this._money(e.cost)}</b><span>${this._kwh(e.energy)}</span></div>
      <div class="row-actions"><button class="icon" data-act="bill" data-id="${esc(e.id)}" aria-label="${this._t("bill")}">${ICONS.receipt}</button></div>
    </li>`;
  }

  async _afterHistory() {
    this._countAll();
    if (this._histView === "learned") {
      if (!this._state.home?.history) return;
      const key = this._histKey("day", 0);
      if (!this._houseData?.[key]) {
        await this._loadHouse("day", 0);
        if (this._tab === "history" && this._histView === "learned") this._render();
      }
      return;
    }
    const scope = this.shadowRoot.querySelector(".hist-body")?.dataset.scope;
    if (scope !== "house") return;
    const period = HIST_PERIODS.includes(this._histPeriod) ? this._histPeriod : "month";
    const offset = Math.min(0, this._histOffset || 0);
    const key = this._histKey(period, offset);
    if (this._houseData?.[key] && Date.now() - this._houseAt[key] < 10 * 60e3) return;
    await this._loadHouse(period, offset);
    if (this._tab === "history" && this._histScope === "house") this._render();
  }

  /* Numbers that count up from nothing the first time they are shown. */
  _countAll() {
    const seen = (this._counted = this._counted || new Set());
    for (const el of this.shadowRoot.querySelectorAll("[data-count]")) {
      const key = `${this._tab}:${el.closest("div")?.querySelector("dt")?.textContent}:${el.dataset.count}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const value = Number(el.dataset.count);
      const unit = el.dataset.unit;
      const format = (x) => (unit === "kwh" ? this._kwh(x) : unit === "money" ? this._money(x) : unit === "pct" ? this._pct(x) : this._num(x, 0));
      if (typeof requestAnimationFrame === "undefined" || !isNum(value)) continue;
      const t0 = performance.now();
      const step = (now) => {
        const k = clamp((now - t0) / 900, 0, 1);
        el.textContent = format(value * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  // ------------------------------------------------------------------ what EV Planner has learned

  _learnedHtml() {
    const cars = this._cars;
    const parts = cars.map((v) => this._learnedCarHtml(v, { title: true }));
    parts.push(this._learnedHouseHtml());
    const body = parts.filter(Boolean).join("");
    return `<h2 class="section-title">${ICONS.learn}<span>${esc(this._t("learn_title"))}</span></h2>${body || `<p class="hint">${esc(this._t("learn_empty"))}</p>`}`;
  }

  /* How sure: five dots, one for each few observations. */
  _sureHtml(count, per = 2) {
    const filled = Math.max(0, Math.min(5, Math.round((Number(count) || 0) / per)));
    return `<span class="sure" title="${esc(this._t("learn_sure"))}" aria-label="${esc(this._t("learn_sure"))} ${filled}/5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < filled ? "on" : ""}" style="--d:${i * 90}ms"></i>`).join("")}</span>`;
  }

  _learnedCarHtml(v, { title = false } = {}) {
    const cards = [];
    const history = v.history || [];
    // Charging speed: a gauge.
    if (isNum(v.charge_speed)) {
      const learned = v.charge_speed_source === "learned";
      const count = Number(v.charge_speed_learned_from) || 0;
      const from = learned ? (count === 1 ? this._t("learn_from_one") : this._t("learn_from", { n: count })) : this._t("learn_estimated");
      const share = clamp(Number(v.charge_speed) / 40, 0.03, 1);
      const arc = (k) => {
        const a = Math.PI * (1 - k);
        return [60 + 48 * Math.cos(a), 60 - 48 * Math.sin(a)];
      };
      const [ex, ey] = arc(share);
      cards.push(`<div class="learn-card">
        <svg class="gauge" viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" class="g-track"/><path d="M12 60 A48 48 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" class="g-fill" pathLength="1"/></svg>
        <div><small>${esc(this._t("learn_speed"))}</small><b>${esc(this._t("learn_speed_text", { speed: this._num(v.charge_speed), kw: this._num(v.charge_power ?? v.power) }))}</b>
        <span class="soft">${esc(from)}</span>${learned ? this._sureHtml(count, 1) : ""}</div></div>`);
    }
    // Slower at the end: the speed in each band.
    const curve = v.curve || {};
    const bands = ["80-90", "90-100"].filter((k) => isNum(curve[k]));
    if (bands.length && isNum(v.charge_speed)) {
      const top = Math.max(Number(v.charge_speed), ...bands.map((k) => Number(curve[k])));
      const bars = [["0-80", Number(v.charge_speed)], ...bands.map((k) => [k, Number(curve[k])])]
        .map(([k, val], i) => `<div class="cb"><b>${this._num(val)}</b><i style="height:${Math.max(4, (val / top) * 56).toFixed(0)}px;--d:${i * 120}ms"></i><span>${esc(k.replace("-", "–"))} %</span></div>`)
        .join("");
      cards.push(`<div class="learn-card"><div class="curve-bars">${bars}</div><div><small>${esc(this._t("learn_curve"))}</small>
        <b>${esc(bands.map((k) => this._t("learn_curve_text", { from: this._pct(Number(k.split("-")[0])), speed: this._num(curve[k]) })).join(" · "))}</b></div></div>`);
    }
    // When the car charges: a clock of the hours it has charged in.
    if (history.length >= 2) {
      const hours = new Array(24).fill(0);
      for (const e of history) {
        const periods = e.periods?.length ? e.periods : [{ start: e.start, end: e.end }];
        for (const p of periods) {
          for (let t = new Date(p.start).getTime(); t < new Date(p.end).getTime(); t += 1800e3) hours[new Date(t).getHours()] += 0.5;
        }
      }
      const most = Math.max(0.5, ...hours);
      const spokes = hours
        .map((value, h) => {
          const len = 10 + (value / most) * 34;
          const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
          const x2 = 60 + Math.cos(a) * (14 + len);
          const y2 = 60 + Math.sin(a) * (14 + len);
          return `<line x1="${(60 + Math.cos(a) * 14).toFixed(1)}" y1="${(60 + Math.sin(a) * 14).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="spoke${value ? " on" : ""}" style="--d:${h * 30}ms"/>`;
        })
        .join("");
      const median = (list) => {
        const sorted = list.filter(isNum).map(Number).sort((a, b) => a - b);
        return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
      };
      const startMinutes = median(history.map((e) => { const d = new Date(e.start); return d.getHours() * 60 + d.getMinutes(); }));
      const arrive = median(history.map((e) => e.start_soc));
      const perSession = history.reduce((sum, e) => sum + (Number(e.energy) || 0), 0) / history.length;
      const first = Math.min(...history.map((e) => new Date(e.start).getTime()));
      const weeks = Math.max(1, (Date.now() - first) / (7 * 86400e3));
      const hhmm = startMinutes === null ? "–" : `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(Math.round(startMinutes % 60 / 15) * 15 % 60).padStart(2, "0")}`;
      cards.push(`<div class="learn-card wide">
        <svg class="hour-clock" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="12" class="hc-face"/>${spokes}
          ${[0, 6, 12, 18].map((h) => { const a = (h / 24) * Math.PI * 2 - Math.PI / 2; return `<text x="${(60 + Math.cos(a) * 54).toFixed(1)}" y="${(60 + Math.sin(a) * 54 + 3).toFixed(1)}">${String(h).padStart(2, "0")}</text>`; }).join("")}</svg>
        <dl class="habits">
          <div><dt>${esc(this._t("learn_plug_in"))}</dt><dd>${esc(this._hhmm(hhmm))}</dd></div>
          <div><dt>${esc(this._t("learn_arrive"))}</dt><dd>${this._pct(arrive)}</dd></div>
          <div><dt>${esc(this._t("learn_per_session"))}</dt><dd>${this._kwh(perSession)}</dd></div>
          <div><dt>${esc(this._t("learn_per_week"))}</dt><dd>${this._num(history.length / weeks, 1)}</dd></div>
        </dl>${this._sureHtml(history.length, 3)}</div>`);
    }
    if (Number(v.margin) > 0) cards.push(`<div class="learn-card"><div><small>${esc(this._t("learn_margin"))}</small><b>${esc(this._t("learn_margin_text", { minutes: v.margin }))}</b></div></div>`);
    if (v.receipt && isNum(v.receipt.soc)) {
      const r = v.receipt;
      const ok = !r.late;
      cards.push(`<div class="learn-card"><div class="promise ${ok ? "ok" : "late"}"><b>${this._pct(r.soc)}</b><span>/ ${this._pct(r.planned_soc)}</span></div>
        <div><small>${esc(this._t("learn_promise"))}</small><b>${esc(this._t("receipt_line", { soc: this._pct(r.soc), time: this._time(r.at), planned: this._pct(r.planned_soc) }))}</b></div></div>`);
    }
    if (!cards.length) return title ? "" : `<p class="hint">${esc(this._t("learn_empty"))}</p>`;
    return `<section class="panel learn">${title ? `<h2>${ICONS.car}<span>${esc(v.name)}</span></h2>` : `<h2>${ICONS.learn}<span>${esc(this._t("learn_title"))}</span></h2>`}<div class="learn-grid">${cards.join("")}</div></section>`;
  }

  _learnedHouseHtml() {
    const cards = [];
    const typical = this._houseData?.[this._histKey("day", 0)]?.typical_day || [];
    if (typical.some(isNum)) {
      const most = Math.max(0.05, ...typical.filter(isNum));
      const spokes = typical
        .map((value, h) => {
          const len = 6 + ((Number(value) || 0) / most) * 38;
          const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
          return `<line x1="${(60 + Math.cos(a) * 14).toFixed(1)}" y1="${(60 + Math.sin(a) * 14).toFixed(1)}" x2="${(60 + Math.cos(a) * (14 + len)).toFixed(1)}" y2="${(60 + Math.sin(a) * (14 + len)).toFixed(1)}" class="spoke on house" style="--d:${h * 30}ms"><title>${String(h).padStart(2, "0")}: ${this._kwh(value, 2)}</title></line>`;
        })
        .join("");
      const sum = typical.filter(isNum).reduce((a, b) => a + Number(b), 0);
      cards.push(`<div class="learn-card wide"><svg class="hour-clock" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="12" class="hc-face"/>${spokes}
        ${[0, 6, 12, 18].map((h) => { const a = (h / 24) * Math.PI * 2 - Math.PI / 2; return `<text x="${(60 + Math.cos(a) * 54).toFixed(1)}" y="${(60 + Math.sin(a) * 54 + 3).toFixed(1)}">${String(h).padStart(2, "0")}</text>`; }).join("")}</svg>
        <div><small>${esc(this._t("learn_house"))}</small><b>${this._kwh(sum)} / ${esc(this._t("hist_day").toLowerCase())}</b><span class="soft">${esc(this._t("learn_house_text"))}</span></div></div>`);
    }
    const weather = this._state.supply?.weather;
    if (weather) {
      const slope = weather.slope;
      cards.push(`<div class="learn-card"><div class="thermo"><b>${isNum(weather.now) ? `${this._num(weather.now, 1)}°` : "–"}</b></div><div><small>${esc(this._t("learn_weather"))}</small>
        <b>${esc(isNum(slope) ? this._t("learn_weather_text", { amps: this._num(-slope, 2) }) : this._t("learn_weather_none"))}</b></div></div>`);
    }
    if (!cards.length) return "";
    return `<section class="panel learn"><h2>${ICONS.home}<span>${esc(this._t("home_house"))}</span></h2><div class="learn-grid">${cards.join("")}</div></section>`;
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

  _carSessionHtml(v, e, { name = false } = {}) {
    const parts = [];
    if (name) parts.push(v.name);
    if (isNum(e.start_soc) || isNum(e.end_soc)) parts.push(`${this._pct(e.start_soc)} → ${this._pct(e.end_soc)}`);
    const periods = (e.periods || []).length;
    if (periods > 1) parts.push(this._t("periods_n", { n: periods }));
    if (isNum(e.charging_minutes) && e.charging_minutes > 0) parts.push(this._t("charged_for", { time: this._duration(e.charging_minutes) }));
    if (isNum(e.solar) && e.solar > 0.05 && e.energy > 0) parts.push(this._t("history_solar", { pct: this._pct(Math.min(100, (e.solar / e.energy) * 100)) }));
    const soc = parts.join(" · ");
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
      ...((entry.periods || []).length > 1
        ? [this._t("bill_line_periods", { periods: entry.periods.map((p) => `${this._time(p.start)}–${this._time(p.end)}`).join(", ") })]
        : []),
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
    const appUrl = `${location.origin}${this._panel?.config?.app_url || "/ev_planner_app"}/app.html`;
    const lines = (list) => list.filter(Boolean).join(" · ");
    const sections = {
      departures: this._departuresTile(settings),
      calendar: this._calendarTile(settings),
      notifications: this._notifyTile(settings, config),
      places: this._placesTile(settings),
      billing: {
        icon: "receipt",
        title: this._t("settings_billing"),
        summary: lines([
          isNum(settings.bill_price) && `${this._money(settings.bill_price)}/kWh`,
          Number(settings.price_add) ? this._t("price_add_sum", { price: this._money(settings.price_add) }) : "",
          settings.payment_text && this._t("payment_text"),
        ]),
        body: `<label class="field col"><span>${this._t("price_add")}</span>
          <div class="unit-input"><input id="price-add" type="number" min="-100" max="100" step="0.01" inputmode="decimal" value="${esc(settings.price_add ?? 0)}"><span>${esc(this._unit)}/kWh</span></div>
          <small>${this._t("price_add_hint")}</small></label>
        <label class="field col"><span>${this._t("bill_rate")}</span>
          <div class="unit-input"><input id="bill-rate" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(settings.bill_price ?? "")}"><span>${esc(this._unit)}/kWh</span></div>
          <small>${this._t("bill_rate_hint")}</small></label>
        <label class="field col"><span>${this._t("payment_text")}</span>
          <input id="payment-text" type="text" maxlength="200" value="${esc(settings.payment_text || "")}">
          <small>${this._t("payment_hint")}</small></label>
        <dl class="sources"><div><dt>${this._t("price_sensor")}</dt><dd>${esc(this._entityName(config.price_entity))}</dd></div></dl>
        <p class="hint">${this._t("change_in_ha")} <a href="/config/integrations/integration/ev_household_planner" target="_top">${this._t("open_integration")}</a></p>`,
      },
      app: {
        icon: "share",
        title: this._t("app_title"),
        summary: lines([this._t("widgets_title"), settings.update_widgets && this._t("widgets_refresh_on")]),
        body: `<p class="hint">${this._t("app_hint")}</p>
        <a class="btn ghost" href="${esc(appUrl)}" target="_blank" rel="noopener">${ICONS.share}<span>${this._t("open_app")}</span></a>
        <h3>${this._t("widgets_title")}</h3>
        <p class="hint">${esc(this._t("widgets_text"))}</p>
        ${this._ruleRow({ icon: "history", title: this._t("widgets_refresh"), hint: this._t("widgets_refresh_hint"), off: !settings.update_widgets, control: `<button class="switch" role="switch" data-act="hh-toggle" data-key="update_widgets" data-f="hh-update_widgets" aria-checked="${Boolean(settings.update_widgets)}" aria-label="${esc(this._t("widgets_refresh"))}"><i></i></button>` })}`,
      },
      support: {
        icon: "download",
        title: this._t("support_title"),
        summary: this._t("support_summary"),
        body: `<p class="hint">${this._t("support_hint")}</p>
        <button class="btn" data-act="support-export" data-f="support-export"${this._exporting ? " disabled" : ""}>${ICONS.download}<span>${this._t(this._exporting ? "support_busy" : "support_export")}</span></button>
        ${this._exportError ? `<p class="hint warn-text">${this._t("support_failed")}: ${esc(this._exportError)}</p>` : ""}
        <p class="hint">${this._t("support_also")}</p>`,
      },
    };
    const open = sections[this._sheet];
    const tiles = Object.entries(sections)
      .map(
        ([key, g]) => `<button class="tile" data-act="tile" data-tile="${key}" data-f="tile-${key}" aria-haspopup="dialog">
          <span class="tile-icon">${ICONS[g.icon] || ""}</span>
          <span class="tile-text"><strong>${esc(g.title)}</strong><small>${esc(g.summary || "")}</small></span>
          <span class="tile-go">${ICONS.back}</span></button>`,
      )
      .join("");
    const sheet = open
      ? `<div class="scrim in-page" data-act="sheet-close"></div>
        <div class="sheet in-page" role="dialog" aria-modal="true" aria-label="${esc(open.title)}">
          <header><h2>${ICONS[open.icon] || ""}<span>${esc(open.title)}</span></h2><button class="btn ghost small" data-act="sheet-close" data-f="sheet-close">${this._t("tile_close")}</button></header>
          <div class="sheet-body">${open.body}</div>
        </div>`
      : "";
    return `<div class="page settings-page"><div class="tile-grid">${tiles}</div>${sheet}</div>`;
  }

  /* A departure's name: its own, or the default's in the panel's language. */
  _depName(d) {
    if (d?.name) return d.name;
    const own = { morning: "go_morning", midday: "go_midday", evening: "go_evening" }[d?.id];
    if (own) return this._t(own);
    const key = `trip_${d?.id}`;
    return TEXT[this._lang]?.[key] || TEXT.en[key] ? this._t(key) : String(d?.id || "");
  }

  /* When a departure is: "next time 06.00", "tomorrow 17.00", "Monday 06.00", "on the day chosen". */
  _depWhen(d) {
    const time = this._hhmm(d.time || "06:00");
    if (d.day === "date") return this._t("dep_day_date_short", { time });
    if (WEEKDAYS.includes(d.day)) return `${this._t(`wdn_${d.day}`)} ${time}`;
    return `${this._t(`dep_day_${d.day || "next"}`)} ${time}`;
  }

  _depPrice(d) {
    if (d.price === "lowest") return this._t("dep_price_lowest_short", { pct: this._pct(d.pct ?? 10) });
    if (d.price === "cheapest") return this._t("dep_price_cheapest_short", { pct: this._pct(d.pct ?? 10) });
    return this._t("dep_price_normal_short");
  }

  /* Settings → Departures: the household's list for every car's dropdown; the week plan and the holiday stay. */
  _departuresTile(settings) {
    const list = settings.departures || [];
    const open = this._depOpen;
    const seg = (field, values, current, label) => `<div class="segmented opp" role="radiogroup" aria-label="${esc(label)}">${values
      .map(([value, text]) => `<button role="radio" data-act="dep-set" data-dep-id="${esc(open)}" data-field="${field}" data-value="${esc(value)}" data-f="dep-${field}-${esc(value)}" aria-checked="${value === current}" class="${value === current ? "on" : ""}">${esc(text)}</button>`)
      .join("")}</div>`;
    const form = (d, i) => {
      const holiday = d.id === "holiday";
      const day = d.day || "next";
      const days = holiday
        ? `<small class="hint">${this._t("dep_day_date_hint")}</small>`
        : `${seg("day", [["next", this._t("dep_day_next")], ["today", this._t("dep_day_today")], ["tomorrow", this._t("dep_day_tomorrow")]], day, this._t("dep_day"))}
          <div class="chips days">${WEEKDAYS.map((w) => `<button data-act="dep-set" data-dep-id="${esc(d.id)}" data-field="day" data-value="${w}" data-f="dep-day-${w}" class="${day === w ? "on" : ""}" aria-pressed="${day === w}" aria-label="${esc(this._t(`wdn_${w}`))}">${this._t(`day_${w}`)}</button>`).join("")}</div>`;
      const price = d.price || "normal";
      const fixed = isNum(d.target);
      return `<div class="dep-form">
        <div class="dep-two">
          <label class="field col"><span>${this._t("dep_name")}</span><input type="text" maxlength="40" data-dep="name" data-dep-id="${esc(d.id)}" value="${esc(this._depName(d))}"></label>
          <label class="field col"><span>${this._t("dep_time")}</span><input type="time" step="900" data-dep="time" data-dep-id="${esc(d.id)}" value="${esc(d.time || "06:00")}"></label>
        </div>
        <div class="field col"><span>${this._t("dep_day")}</span>${days}</div>
        <div class="field col"><span>${this._t("dep_price")}</span>
          ${seg("price", [["normal", this._t("dep_price_normal")], ["lowest", this._t("dep_price_lowest")], ["cheapest", this._t("dep_price_cheapest")]], price, this._t("dep_price"))}
          ${price === "normal" ? "" : `<div class="inline-values"><span>${this._t(price === "lowest" ? "dep_pct_lowest" : "dep_pct_cheapest")}</span><label class="unit-input small"><input type="number" min="1" max="100" step="1" data-dep="pct" data-dep-id="${esc(d.id)}" value="${esc(d.pct ?? 10)}" aria-label="${esc(this._t("dep_price"))}"><span>%</span></label></div>`}
          <small class="hint">${this._t(`dep_price_${price}_hint`)}</small></div>
        <div class="field col"><span>${this._t("dep_target")}</span>
          ${seg("target", [["car", this._t("dep_target_car")], ["fixed", this._t("dep_target_fixed")]], fixed ? "fixed" : "car", this._t("dep_target"))}
          ${fixed ? `<div class="inline-values"><label class="unit-input small"><input type="number" min="10" max="100" step="5" data-dep="target" data-dep-id="${esc(d.id)}" value="${esc(d.target)}" aria-label="${esc(this._t("dep_target"))}"><span>%</span></label></div>` : ""}</div>
        <div class="dep-actions">
          <button class="btn ghost small" data-act="dep-move" data-dep-id="${esc(d.id)}" data-dir="-1" data-f="dep-up"${i === 0 ? " disabled" : ""} aria-label="${esc(this._t("dep_up"))}">↑</button>
          <button class="btn ghost small" data-act="dep-move" data-dep-id="${esc(d.id)}" data-dir="1" data-f="dep-down"${i === list.length - 1 ? " disabled" : ""} aria-label="${esc(this._t("dep_down"))}">↓</button>
          <span class="grow"></span>
          ${holiday ? "" : `<button class="btn ghost small danger" data-act="dep-del" data-dep-id="${esc(d.id)}" data-f="dep-del">${this._t("dep_delete")}</button>`}
          <button class="btn small" data-act="dep-open" data-dep-id="" data-f="dep-done">${this._t("dep_done")}</button>
        </div>
      </div>`;
    };
    const rows = list
      .map((d, i) => {
        const on = d.id === open;
        return `<div class="dep-row${on ? " open" : ""}">
          <button class="dep-head" data-act="dep-open" data-dep-id="${on ? "" : esc(d.id)}" data-f="dep-${esc(d.id)}" aria-expanded="${on}">
            <span class="dep-text"><strong>${esc(this._depName(d))}</strong><small>${esc([this._depWhen(d), this._depPrice(d), isNum(d.target) ? this._pct(d.target) : ""].filter(Boolean).join(" · "))}</small></span>
            ${d.id === "holiday" ? "" : `<span class="dep-time">${esc(this._hhmm(d.time || "06:00"))}</span>`}
          </button>
          ${on ? form(d, i) : ""}
        </div>`;
      })
      .join("");
    return {
      icon: "history",
      title: this._t("dep_title"),
      summary: list.filter((d) => d.id !== "holiday").map((d) => this._depName(d)).join(", "),
      body: `<p class="hint">${this._t("dep_intro")}</p>
        <div class="dep-list">
          <div class="dep-row locked"><div class="dep-head static"><span class="dep-text"><strong>${this._t("trip_week")}</strong><small>${this._t("dep_week_hint")}</small></span></div></div>
          ${rows}
        </div>
        <button class="btn ghost" data-act="dep-add" data-f="dep-add">${ICONS.plus || "+"}<span>${this._t("dep_add")}</span></button>`,
    };
  }

  /* Settings → Messages: what is for all cars at the top, then each car's own. */
  _notifyTile(settings, config) {
    const lines = (list) => list.filter(Boolean).join(" · ");
    const phones = config.notify || [];
    const all = [...new Set([...(config.notify_all || []), ...phones])];
    const names = config.notify_names || {};
    const phoneChips = all.length
      ? `<div class="chips">${all
          .map((phone) => {
            const on = phones.includes(phone);
            return `<button data-act="phone-toggle" data-phone="${esc(phone)}" data-f="ph-${esc(phone)}" class="${on ? "on" : ""}" aria-pressed="${on}">${esc(names[phone] || phone)}</button>`;
          })
          .join("")}</div>`
      : `<p class="hint">${this._t("phones_none")}</p>`;
    const cars = this._cars
      .map((v) => {
        const s = this._vs(v);
        const on = this._ncarOpen === v.id;
        const summary = lines([
          s.reminder && this._t("sum_reminder", { time: this._hhmm(s.reminder_time || "16:00") }),
          s.notify_receipt !== false && this._t("sum_receipt"),
          s.live_notification && this._t("sum_live"),
          s.notify_done && this._t("sum_done"),
        ]) || this._t("tile_off");
        return `<div class="ncar${on ? " open" : ""}">
          <button class="dep-head" data-act="ncar-open" data-car="${on ? "" : esc(v.id)}" data-f="ncar-${esc(v.id)}" aria-expanded="${on}">
            <span class="dep-text"><strong>${esc(v.name)}</strong><small>${esc(summary)}</small></span><span class="tile-go">${ICONS.back}</span>
          </button>
          ${on ? `<div class="ncar-body" data-ncar="${esc(v.id)}">${this._notifyHtml(s, { inSettings: true })}</div>` : ""}
        </div>`;
      })
      .join("");
    return {
      icon: "bell",
      title: this._t("settings_notifications"),
      summary: lines([
        settings.notify_enabled === false ? this._t("notify_all_off") : "",
        settings.notify_enabled !== false && settings.quiet_enabled && this._t("quiet_summary", { from: this._hhmm(settings.quiet_from || "22:00"), to: this._hhmm(settings.quiet_to || "06:00") }),
        phones.length ? phones.map((n) => names[n] || n).join(", ") : this._t("not_set"),
      ]),
      body: `<h3 class="sheet-sub">${this._t("notify_common")}</h3>
        ${this._ruleRow({ icon: "bell", title: this._t("notify_all"), hint: this._t("notify_all_hint"), off: settings.notify_enabled === false, control: `<button class="switch" role="switch" data-act="hh-toggle" data-key="notify_enabled" data-f="hh-notify_enabled" aria-checked="${settings.notify_enabled !== false}" aria-label="${esc(this._t("notify_all"))}"><i></i></button>` })}
        ${this._ruleRow({
          icon: "history",
          title: this._t("quiet_hours"),
          hint: this._t("quiet_hours_hint"),
          off: !settings.quiet_enabled,
          control: `${settings.quiet_enabled ? `<label class="chip-input time on"><input type="time" step="900" id="quiet-from" value="${esc(settings.quiet_from || "22:00")}" aria-label="${this._t("quiet_from")}"></label><span class="dash">–</span><label class="chip-input time on"><input type="time" step="900" id="quiet-to" value="${esc(settings.quiet_to || "06:00")}" aria-label="${this._t("quiet_to")}"></label>` : ""}<button class="switch" role="switch" data-act="hh-toggle" data-key="quiet_enabled" data-f="hh-quiet_enabled" aria-checked="${Boolean(settings.quiet_enabled)}" aria-label="${esc(this._t("quiet_hours"))}"><i></i></button>`,
        })}
        <div class="field col"><span>${this._t("notify_phones")}</span>${phoneChips}<small>${this._t("phones_hint")}</small></div>
        <div class="field col"><span>${this._t("notify_language")}</span>
          <div class="chips">${["auto", "da", "en"]
            .map((code) => {
              const on = (settings.language || "auto") === code;
              return `<button data-act="notify-lang" data-lang="${code}" data-f="nl-${code}" class="${on ? "on" : ""}" aria-pressed="${on}">${this._t(`lang_${code}`)}</button>`;
            })
            .join("")}</div>
          <small>${this._t("notify_language_hint")}</small></div>
        <h3 class="sheet-sub">${this._t("notify_per_car")}</h3>
        <div class="dep-list">${cars || `<p class="hint">${this._t("no_cars")}</p>`}</div>`,
    };
  }

  /* Settings → Places: each place's prices, guard, how the cars share it, and its house. */
  _placesTile(settings) {
    const supply = this._state.supply;
    const sites = this._state.sites?.length ? this._state.sites : [{ id: "home", home: true, name: "", supply, guard: Boolean(supply?.guard), has_meter: Boolean(supply?.meter), wait: 10, share: "queue" }];
    const many = sites.length > 1;
    const body = sites
      .map((site) => {
        const now = this._houseOf(site);
        const house = ClayScene.HOUSES.map((code) => `<button data-act="house-look" data-site="${esc(site.id)}" data-house="${code}" data-f="hl-${esc(site.id)}-${code}" class="${now === code ? "on" : ""}" aria-pressed="${now === code}">${this._t(`house_${code}`)}</button>`).join("");
        const supply = site.supply;
        const wait = Number(site.wait) || 10;
        const share = site.share === "need" ? "need" : "queue";
        const guard = supply
          ? `${this._ruleRow({
              icon: "rules",
              title: this._t("place_guard"),
              hint: site.has_meter ? this._t("place_guard_hint") : this._t("place_guard_no_meter"),
              off: !site.guard,
              control: site.has_meter ? `<button class="switch" role="switch" data-act="place-set" data-site="${esc(site.id)}" data-key="supply_guard" data-value="${site.guard ? "" : "1"}" data-f="pg-${esc(site.id)}" aria-checked="${Boolean(site.guard)}" aria-label="${esc(this._t("place_guard"))}"><i></i></button>` : "",
              extra: site.guard
                ? `<div class="rule-under"><div class="inline-values"><span>${this._t("place_wait")}</span><div class="chips">${[5, 10, 15, 20, 30]
                    .map((m) => `<button data-act="place-set" data-site="${esc(site.id)}" data-key="supply_wait" data-value="${m}" data-f="pw-${esc(site.id)}-${m}" class="${wait === m ? "on" : ""}" aria-pressed="${wait === m}">${m} ${this._t("minutes_short")}</button>`)
                    .join("")}</div></div><small class="hint">${this._t("place_wait_hint")}</small></div>`
                : "",
            })}
            ${this._ruleRow({
              icon: "plan",
              title: this._t("place_share"),
              hint: this._t(`place_share_${share}_hint`),
              control: "",
              extra: `<div class="rule-under"><div class="segmented opp" role="radiogroup" aria-label="${esc(this._t("place_share"))}">${["queue", "need"]
                .map((v) => `<button role="radio" data-act="place-set" data-site="${esc(site.id)}" data-key="supply_share" data-value="${v}" data-f="ps-${esc(site.id)}-${v}" aria-checked="${v === share}" class="${v === share ? "on" : ""}">${this._t(`place_share_${v}`)}</button>`)
                .join("")}</div></div>`,
            })}`
          : `<p class="hint">${this._t("place_no_supply")}</p>`;
        return `<div class="place-card">
          ${many ? `<h3 class="sheet-sub">${esc(site.name || this._t("place_home"))}</h3>` : ""}
          <dl class="sources">
            <div><dt>${this._t("price_sensor")}</dt><dd>${esc(this._entityName(site.price_entity || this._state.config?.price_entity))}${site.own_price ? ` <span class="tag">${this._t("place_own_price")}</span>` : ""}</dd></div>
            <div><dt>${this._t("tile_supply")}</dt><dd>${supply ? `${Math.round(supply.limit)} A · ${supply.phases} ${this._lang === "da" ? "faser" : "phases"}` : this._t("off")}</dd></div>
          </dl>
          ${guard}
          <div class="field col"><span>${this._t("house_look")}</span><div class="chips">${house}</div></div>
        </div>`;
      })
      .join("");
    return {
      icon: "home",
      title: this._t("places_title"),
      summary: sites
        .map((site) => [site.name || this._t("place_home"), site.guard && this._t("place_guard_short")].filter(Boolean).join(" "))
        .join(" · "),
      body: `${body}
        <p class="hint">${this._t("places_hint")} <a href="/config/integrations/integration/ev_household_planner" target="_top">${this._t("open_integration")}</a></p>`,
    };
  }

  /* The household's calendars, and the word that marks each car's trips in them. */
  _calendarTile(settings) {
    const chosen = new Set(settings.calendars || []);
    const states = this._hass?.states || {};
    const all = Object.keys(states)
      .filter((entity) => entity.startsWith("calendar."))
      .sort((a, b) => String(states[a].attributes?.friendly_name || a).localeCompare(String(states[b].attributes?.friendly_name || b)));
    for (const entity of chosen) if (!all.includes(entity)) all.push(entity);
    const name = (entity) => states[entity]?.attributes?.friendly_name || entity;
    const list = all.length
      ? all
          .map((entity) => {
            const on = chosen.has(entity);
            return `<div class="cal-row"><span>${ICONS.calendar}<b>${esc(name(entity))}</b></span>
              <button class="switch" role="switch" data-act="cal-toggle" data-entity="${esc(entity)}" aria-checked="${on}" aria-label="${esc(name(entity))}"><i></i></button></div>`;
          })
          .join("")
      : `<p class="hint">${this._t("cal_none")}</p>`;
    const cars = this._cars
      .map((v) => {
        const own = String(this._vs(v).calendar_keyword || "");
        const fallback = String(v.name || "").split(/\s+/).find((w) => w.length >= 2) || "";
        const next = v.calendar?.start ? `${this._day(v.calendar.start)} ${this._time(v.calendar.start)}` : this._t("cal_no_trip");
        return `<div class="cal-car"><b>${esc(v.name)}</b>
          <label class="cal-word"><span>${this._t("cal_word")}</span><input type="text" maxlength="40" data-calkw="${esc(v.id)}" value="${esc(own)}" placeholder="${esc(fallback)}" aria-label="${esc(`${v.name}: ${this._t("cal_word")}`)}"></label>
          <small>${ICONS.history}${esc(next)}</small></div>`;
      })
      .join("");
    const example = `${(this._cars[0]?.name || "Elroq").split(/\s+/)[0]} 7:15 80% klima 21,5`;
    return {
      icon: "calendar",
      title: this._t("cal_title"),
      summary: chosen.size ? [...chosen].map(name).join(", ") : this._t("not_set"),
      body: `<p class="hint">${esc(this._t("cal_intro"))}</p>
        <div class="cal-example"><code>${esc(example)}</code><small>${esc(this._t("cal_example"))}</small></div>
        <div class="field col"><span>${this._t("cal_calendars")}</span>${list}</div>
        <div class="field col"><span>${this._t("cal_cars")}</span>${cars}</div>
        <details class="more"><summary>${ICONS.info}<span>${this._t("cal_guide")}</span></summary>
          <ul class="cal-guide">${["cal_g_time", "cal_g_target", "cal_g_full", "cal_g_climate", "cal_g_allday"].map((k) => `<li>${this._t(k)}</li>`).join("")}</ul></details>`,
    };
  }

  // ------------------------------------------------------------------ events

  /* One click handler for the whole page: buttons say what they do with data-act. */
  _onClick(ev) {
    const button = ev.target.closest("[data-act]");
    if (!button || button.disabled) return;
    const act = button.dataset.act;
    const id = button.dataset.id;
    this._ncar = this._tab === "settings" ? button.closest("[data-ncar]")?.dataset.ncar || null : null;
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
      case "occupant":
        this._ws("ev_household_planner/charger_occupant", { charger_id: id, occupant: button.dataset.who || null }).catch((err) => this._showError(err));
        break;
      case "tab":
        this._setTab(button.dataset.tab);
        break;
      case "car-view":
        this._carView = CAR_VIEWS.includes(button.dataset.view) ? button.dataset.view : "now";
        this._sheet = null;
        this._lastView = null;
        this._render();
        this.shadowRoot.querySelector(`[data-f="cv-${this._carView}"]`)?.focus({ preventScroll: true });
        break;
      case "goto-settings":
        if (button.dataset.car) this._ncarOpen = button.dataset.car;
        this._setTab("settings");
        this._sheet = button.dataset.tile;
        this._render();
        this.shadowRoot.querySelector('[data-f="sheet-close"]')?.focus();
        break;
      case "tile":
        this._sheet = button.dataset.tile;
        if (this._tab === "settings") this._render();
        else this._renderCarPage({ live: false });
        this.shadowRoot.querySelector('[data-f="sheet-close"]')?.focus();
        break;
      case "sheet-close": {
        const was = this._sheet;
        this._sheet = null;
        if (this._tab === "settings") this._render();
        else this._renderCarPage({ live: false });
        this.shadowRoot.querySelector(`[data-f="tile-${was}"]`)?.focus();
        break;
      }
      case "hist-period":
        this._histPeriod = HIST_PERIODS.includes(button.dataset.value) ? button.dataset.value : "month";
        this._histOffset = 0;
        this._render();
        break;
      case "hist-scope":
        this._histScope = button.dataset.value || "all";
        this._render();
        break;
      case "hist-move":
        this._histOffset = Math.min(0, (this._histOffset || 0) + Number(button.dataset.step || 0));
        this._render();
        break;
      case "hist-view":
        this._histView = button.dataset.value === "learned" ? "learned" : "history";
        this._render();
        break;
      case "hist-export":
        this._exportHistory();
        break;
      case "trip":
        this._setTrip(button.dataset.kind || null);
        break;
      case "climate":
        this._climate(button.dataset.on === "1");
        break;
      case "climate-open":
        this._openPopup("climate");
        break;
      case "next-open":
        this._openPopup("next");
        break;
      case "hh-toggle": {
        const key = button.dataset.key;
        const settings = this._state.settings || {};
        const now = key === "notify_enabled" ? settings.notify_enabled !== false : Boolean(settings[key]);
        this._saveSettings({ [key]: !now });
        break;
      }
      case "dep-open":
        this._depOpen = button.dataset.depId || null;
        this._render();
        this.shadowRoot.querySelector(`[data-f="dep-${this._depOpen || button.closest(".dep-row")?.querySelector(".dep-head")?.dataset.f?.slice(4) || ""}"]`)?.focus();
        break;
      case "dep-add": {
        const id = `d${Date.now().toString(36)}`;
        this._depOpen = id;
        this._changeDeps(null, (list) => {
          const at = list.findIndex((d) => d.id === "holiday");
          const item = { id, name: this._t("dep_new"), day: "tomorrow", time: "17:00", price: "normal", pct: 10 };
          return at < 0 ? [...list, item] : [...list.slice(0, at), item, ...list.slice(at)];
        });
        break;
      }
      case "dep-del":
        this._depOpen = null;
        this._changeDeps(null, (list) => list.filter((d) => d.id !== button.dataset.depId));
        break;
      case "dep-move":
        this._changeDeps(null, (list) => {
          const i = list.findIndex((d) => d.id === button.dataset.depId);
          const j = i + Number(button.dataset.dir);
          if (i < 0 || j < 0 || j >= list.length) return list;
          [list[i], list[j]] = [list[j], list[i]];
          return list;
        });
        break;
      case "dep-set": {
        const field = button.dataset.field;
        const value = button.dataset.value;
        this._changeDeps(button.dataset.depId, (d) => {
          if (field === "target") return value === "fixed" ? { ...d, target: isNum(d.target) ? d.target : 80 } : { ...d, target: null };
          return { ...d, [field]: value };
        });
        break;
      }
      case "ncar-open":
        this._ncarOpen = button.dataset.car || null;
        this._render();
        break;
      case "phone-toggle": {
        const phones = new Set(this._state.config?.notify || []);
        if (phones.has(button.dataset.phone)) phones.delete(button.dataset.phone);
        else phones.add(button.dataset.phone);
        this._state = { ...this._state, config: { ...(this._state.config || {}), notify: [...phones] } };
        this._setHousehold({ phones: [...phones] });
        break;
      }
      case "place-set": {
        const site = button.dataset.site;
        const key = button.dataset.key;
        const raw = button.dataset.value;
        const value = key === "supply_guard" ? raw === "1" : key === "supply_wait" ? Number(raw) : raw;
        const places = { ...(this._state.settings?.places || {}) };
        places[site] = { ...(places[site] || {}), [key]: value };
        const field = { supply_guard: "guard", supply_wait: "wait", supply_share: "share" }[key];
        this._state = { ...this._state, sites: (this._state.sites || []).map((x) => (x.id === site ? { ...x, [field]: value } : x)) };
        this._setHousehold({ places });
        break;
      }
      case "cal-toggle": {
        const now = new Set(this._state.settings?.calendars || []);
        const entity = button.dataset.entity;
        if (now.has(entity)) now.delete(entity);
        else now.add(entity);
        this._saveSettings({ calendars: [...now] });
        break;
      }
      case "support-export":
        this._exportSupport();
        break;
      case "scene-label": {
        const open = (this._scene.open = this._scene.open || new Set());
        if (open.has(button.dataset.key)) open.delete(button.dataset.key);
        else open.add(button.dataset.key);
        // Laid out again: an open label is wider, and the others make room.
        this._scene.relabel();
        break;
      }
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
        this._schedDay = button.dataset.day;
        this._renderCarPage({ live: false });
        break;
      case "sched-kind":
        if (s) {
          const day = WEEKDAYS.includes(this._schedDay) ? this._schedDay : WEEKDAYS[(new Date().getDay() + 6) % 7];
          const now = (s.schedule || {})[day];
          const own = now && now !== "default" && now !== "none" ? now : s.ready_by || "07:00";
          const value = button.dataset.value === "other" ? own : button.dataset.value;
          this._vchange({ use_ready_by: true, schedule: { ...(s.schedule || {}), [day]: value } });
        }
        break;
      case "sched-default": {
        // The time as it is in the field now, also when it was just changed and not yet saved.
        const time = (this.shadowRoot.querySelector(".schedule-box [data-sched]")?.value || button.dataset.time || "").slice(0, 5);
        if (s && time) {
          const day = WEEKDAYS.includes(this._schedDay) ? this._schedDay : WEEKDAYS[(new Date().getDay() + 6) % 7];
          this._vchange({ use_ready_by: true, ready_by: time, schedule: { ...(s.schedule || {}), [day]: "default" } });
          this._toast(this._t("sched_default_set", { time: this._hhmm(time) }));
        }
        break;
      }
      case "day-climate":
        if (s) {
          const day = button.dataset.day;
          const climates = { ...(s.day_climate || {}) };
          if (isNum(climates[day])) delete climates[day];
          else climates[day] = Number(s.climate_temperature) || 21;
          this._vchange({ day_climate: climates });
        }
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
      case "house-look":
        // Nothing keeps the focus, so the page is drawn again with the new choice (see _updateMode).
        // Not only the button: on an iPhone a tap leaves the focus where it was.
        this.shadowRoot.activeElement?.blur();
        if (!button.dataset.site || button.dataset.site === "home") this._saveSettings({ house: button.dataset.house });
        else this._saveSettings({ houses: { ...(this._state.settings?.houses || {}), [button.dataset.site]: button.dataset.house } });
        break;
      case "place":
        this.shadowRoot.activeElement?.blur();
        this._place = id;
        this._render();
        break;
      case "notify-lang":
        this.shadowRoot.activeElement?.blur();
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
      case "prio":
        this._vchange({ priority: button.dataset.value });
        break;
      case "solar":
        this._vchange({ solar: button.dataset.value });
        break;
      case "body":
        this._vchange({ body: button.dataset.value });
        break;
      case "spot":
        this._vchange({ spot: button.dataset.value });
        break;
      case "paint":
        this._vchange({ paint: button.dataset.value });
        break;
      case "ceilmode":
        this._vchange({ price_ceiling_relative: button.dataset.value === "1" });
        break;
      case "level":
        this._level = LEVELS.includes(button.dataset.level) ? button.dataset.level : "smart";
        this._write(LEVEL_KEY, this._level === "smart" ? null : this._level);
        this._renderCarPage({ live: false });
        break;
      case "day-target-clear":
        if (s) {
          const targets = { ...(s.day_targets || {}) };
          delete targets[button.dataset.day];
          this._vchange({ day_targets: targets });
        }
        break;
      case "known-prices":
      case "forecast-prices":
        this._run("prices", "ev_household_planner/vehicle_set", { vehicle_id: id, settings: { known_prices: act === "known-prices" } });
        break;
      case "forget-resume":
        this._run("forget", "ev_household_planner/vehicle_set", { vehicle_id: id, settings: { forget_resume: true } });
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
        this._run("stop", "ev_household_planner/guest_stop");
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
    this._ncar = this._tab === "settings" ? el.closest("[data-ncar]")?.dataset.ncar || null : null;
    if (el.dataset.dep) {
      const field = el.dataset.dep;
      const raw = el.value;
      if (field === "time" && !/^\d{2}:\d{2}/.test(raw)) return;
      if ((field === "pct" || field === "target") && !isNum(raw)) return;
      const value = field === "time" ? raw.slice(0, 5) : field === "pct" ? clamp(Number(raw), 1, 100) : field === "target" ? clamp(Number(raw), 10, 100) : raw.trim().slice(0, 40);
      this._changeDeps(el.dataset.depId, (d) => ({ ...d, [field]: value }));
      return;
    }
    if (el.dataset.climateEntity) {
      this._run("settings", "ev_household_planner/vehicle_set", { vehicle_id: el.dataset.climateEntity, settings: { climate_entity: el.value } }).then(
        (ok) => ok && this._toast(this._t("saved")),
      );
      return;
    }
    if (el.id === "price-add") {
      if (isNum(el.value)) this._setHousehold({ price_add: clamp(Number(el.value), -100, 100) });
      return;
    }
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
      if (v && el.value) this._vchange({ use_ready_by: true, schedule: { ...(this._vs(v).schedule || {}), [el.dataset.sched]: el.value.slice(0, 5) } });
    } else if (el.dataset.daytarget) {
      const v = this._currentCar;
      if (v && isNum(el.value)) {
        const value = clamp(Math.round(Number(el.value)), 10, 100);
        this._vchange({ day_targets: { ...(this._vs(v).day_targets || {}), [el.dataset.daytarget]: value } });
      }
    } else if (el.dataset.dayclimate) {
      const v = this._currentCar;
      if (v && isNum(el.value)) {
        const value = clamp(Math.round(Number(el.value) * 2) / 2, 10, 32);
        this._vchange({ day_climate: { ...(this._vs(v).day_climate || {}), [el.dataset.dayclimate]: value } });
      }
    } else if (el.dataset.calkw) {
      this._run("settings", "ev_household_planner/vehicle_set", { vehicle_id: el.dataset.calkw, settings: { calendar_keyword: el.value.trim() } }).then(
        (ok) => ok && this._toast(this._t("saved")),
      );
    } else if (el.dataset.tripSelect) {
      this._setTrip(el.value || null);
    } else if (el.dataset.tripDate) {
      if (el.value) this._setTrip("holiday", el.value);
    } else if (el.dataset.set) {
      this._setFromInput(el, true);
    } else if (el.id === "quiet-from" || el.id === "quiet-to") {
      if (el.value) this._saveSettings({ [el.id === "quiet-from" ? "quiet_from" : "quiet_to"]: el.value.slice(0, 5) });
    } else if (el.id === "bill-rate") {
      this._saveSettings({ bill_price: el.value === "" ? null : Number(el.value) });
    } else if (el.id === "payment-text") {
      this._saveSettings({ payment_text: el.value });
    }
  }

  _onInput(ev) {
    const el = ev.target;
    this._ncar = this._tab === "settings" ? el.closest("[data-ncar]")?.dataset.ncar || null : null;
    if (el.id === "plate") {
      el.value = el.value.toUpperCase();
    } else if (el.type === "range") {
      if (el.dataset.set) this._setFromInput(el, false);
    }
  }

  _onKey(ev) {
    if (ev.target.id === "plate" && ev.key === "Enter" && this._guest?.lookup) this._lookup();
    if (ev.key === "Escape" && this._sheet) this.shadowRoot.querySelector('[data-act="sheet-close"][data-f]')?.click();
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
  /* A surface nothing shows through, for what lies over the page (sheets, the tab bar): the card's
     colour over the page's colour over a solid one, because a theme with glass cards has a see-through card colour. */
  --evp-base: #fff;
  --evp-solid: linear-gradient(var(--evp-card), var(--evp-card)), linear-gradient(var(--evp-bg), var(--evp-bg)), linear-gradient(var(--evp-base), var(--evp-base));
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
/* The list a select opens is drawn by the browser (on a PC a white box): its options get the
   panel's own colours, or the light text of the dark theme is unreadable on it. */
select option, select optgroup { background-color: var(--evp-card); color: var(--evp-ink); }
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
.content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px 20px calc(32px + var(--evp-safe-bottom)); }
/* In Home Assistant's sidebar the box around the panel has no height of its own, so
   "100%" would let the panel grow with its content and the page scroll instead of the
   content (on a PC the mouse wheel then did nothing). Fill the screen instead, less the
   safe areas Home Assistant pads that box with. */
:host(ev-planner-panel:not([app]):not([embed])) { height: calc(100dvh - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px)); }
/* The home-screen app: the page never bounces or moves, only the content scrolls. */
:host([dark]) { --evp-base: #1c1c1e; }
@media (prefers-color-scheme: dark) { :host(:not([light])) { --evp-base: #1c1c1e; } }
:host([app]) .content { overscroll-behavior: none; }
/* In a pop-up from a dashboard card: one view, without the header and the tabs. */
:host([embed]) { background: none; }
:host([embed]) .content { overscroll-behavior: contain; }
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
.setup .panel-head { justify-content: space-between; }
.setup-count { color: var(--evp-soft); font-size: 13px; font-variant-numeric: tabular-nums; }
.setup-steps { list-style: none; margin: 14px 0 18px; padding: 0; display: grid; gap: 12px; }
.setup-steps li { display: flex; gap: 12px; align-items: flex-start; }
.setup-mark { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700; color: var(--evp-soft); border: 1.5px solid color-mix(in srgb, var(--evp-soft) 45%, transparent); }
.setup-mark svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.setup-steps li.done .setup-mark { color: #fff; background: var(--evp-good, #22C981); border-color: transparent; }
.setup-what { display: grid; gap: 2px; min-width: 0; }
.setup-what b { font-weight: 600; }
.setup-what b small { font-weight: 500; color: var(--evp-soft); margin-left: 6px; }
.setup-what > span { color: var(--evp-soft); font-size: 14px; line-height: 1.4; }
.setup-steps li.done .setup-what b { color: var(--evp-soft); }
.setup .btn.primary { display: inline-flex; flex: none; }
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
.link-row { display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 10px; padding: 12px 14px; border: 1px solid var(--evp-line); border-radius: 14px; background: color-mix(in srgb, var(--evp-ink) 3%, transparent); text-align: left; cursor: pointer; }
.link-row:hover { background: color-mix(in srgb, var(--evp-a) 10%, transparent); }
.link-row:focus-visible { outline: 2px solid var(--evp-accent); outline-offset: 2px; }
.link-row > svg { width: 20px; height: 20px; flex: none; fill: none; stroke: var(--evp-accent); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.link-row > svg:last-child { transform: rotate(180deg); stroke: var(--evp-soft); width: 16px; height: 16px; }
.link-row span { flex: 1; min-width: 0; display: grid; gap: 2px; }
.link-row strong { font-weight: 600; }
.link-row small { color: var(--evp-soft); font-size: 13px; line-height: 1.35; }
.note-line { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; }
.note-line svg { width: 18px; height: 18px; flex: none; margin-top: 1px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.note-line.bad { color: color-mix(in srgb, #B42318 62%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-coral) 13%, transparent); }
.note-line.warn { color: color-mix(in srgb, #8A5A00 62%, var(--evp-ink)); background: color-mix(in srgb, var(--evp-sand) 18%, transparent); }
.note-line.bad svg { stroke: var(--evp-coral); }
.note-line.warn svg { stroke: #C98A00; }
.note-line.info { color: var(--evp-soft); background: color-mix(in srgb, var(--evp-a) 8%, transparent); }
.note-line a { color: inherit; font-weight: 600; }
.info-line { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; color: var(--evp-soft); font-size: 14px; line-height: 1.4; min-width: 0; }
.info-line span { min-width: 0; overflow-wrap: anywhere; }
.info-line svg { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.info-line b { color: var(--evp-ink); font-weight: 600; }
.info-line span { min-width: 0; overflow-wrap: anywhere; }
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
.who p { margin: 0 0 8px; }
.who.ask { border-color: var(--evp-sand, #E9B949); }
.who .chips { margin-top: 6px; }
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
.dial .window.sweep { stroke-dasharray: 1; stroke-dashoffset: 1; animation: win-sweep 1.1s cubic-bezier(.6,0,.2,1) forwards; animation-delay: calc(var(--i) * 120ms); }
.dial .window.preview { stroke-dasharray: .018 .014; opacity: .85; }
.dial .window.past { opacity: .35; }
.dial .window-glow { fill: none; stroke: #A3E635; stroke-width: 18; stroke-linecap: round; opacity: .35; }
.dial .window-glow.preview { opacity: .12; }
.dial .window-flow { fill: none; stroke: #fff; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 2 16; opacity: .85; animation: flow 1.2s linear infinite; }
@keyframes win-sweep { to { stroke-dashoffset: 0; } }
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
.car-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
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
.sheet-body .rule:has(.unit-input, .chip-input) .rule-ctl { justify-self: stretch; }
.rule-full { grid-column: 2 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 8px; }
.rule.wide { grid-template-columns: 28px 1fr; }
.opp-level { display: inline-flex; align-items: center; gap: 8px; color: var(--evp-soft); font-size: 14px; }
.inline-values { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; color: var(--evp-soft); font-size: 14px; }
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
.chips.places { margin-bottom: 10px; }
.place-name { display: block; margin: 8px 0 4px; }
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
.glance { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 14px 0 4px; }
.g-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; background: color-mix(in srgb, var(--evp-ink) 6%, transparent); font-size: 14px; font-variant-numeric: tabular-nums; }
.g-chip b { font-weight: 600; }
.g-next { border: 0; color: var(--evp-ink); font: inherit; font-size: 14px; cursor: pointer; background: color-mix(in srgb, var(--evp-a) 14%, transparent); }
.g-next em { font-style: normal; font-size: 12px; color: var(--evp-soft); }
.g-chip.g-next svg:last-child { width: 12px; height: 12px; stroke: var(--evp-soft); transform: rotate(180deg); }
.g-chip svg { width: 16px; height: 16px; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.go-row { display: flex; gap: 8px; align-items: stretch; margin-top: 14px; }
.go-pick { flex: 1 1 auto; min-width: 0; position: relative; display: flex; align-items: center; gap: 10px; padding: 0 12px; border-radius: 14px; background: color-mix(in srgb, var(--evp-ink) 6%, transparent); }
.go-pick > svg { width: 18px; height: 18px; flex: none; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.go-pick > svg:last-child { width: 14px; height: 14px; stroke: var(--evp-soft); transform: rotate(-90deg); pointer-events: none; }
.go-pick select { flex: 1; min-width: 0; appearance: none; -webkit-appearance: none; border: 0; background: transparent; color: var(--evp-ink); font: inherit; font-size: 16px; font-weight: 600; padding: 12px 0; outline: 0; cursor: pointer; }
.climate-btn { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 14px; border: 0; background: color-mix(in srgb, var(--evp-ink) 6%, transparent); color: var(--evp-ink); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; font-variant-numeric: tabular-nums; }
.climate-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.climate-btn.on { background: #E8590C; color: #fff; }
.go-date { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 6px 12px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--evp-ink) 14%, transparent); background: var(--evp-card); color: var(--evp-ink); }
.go-date span { color: var(--evp-soft); font-size: 14px; }
.go-date input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--evp-ink); font: inherit; font-size: 15px; font-weight: 600; outline: 0; }
.actions.g-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
.g-actions .calc { grid-column: 1 / -1; }
.g-actions .btn { justify-content: center; }
.guest-page .g-more { margin-top: 12px; }
/* ---------- settings: departures, a car's messages, places */
.dep-list { display: grid; gap: 8px; }
.dep-row, .ncar { border: 1px solid var(--evp-line); border-radius: 14px; background: color-mix(in srgb, var(--evp-ink) 2%, transparent); overflow: hidden; }
.dep-row.locked { border-style: dashed; background: transparent; }
.dep-row.open, .ncar.open { border-color: color-mix(in srgb, var(--evp-a) 55%, var(--evp-line)); background: var(--evp-card); }
.dep-head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border: 0; background: none; text-align: left; cursor: pointer; }
.dep-head.static { cursor: default; }
.dep-head:focus-visible { outline: 2px solid var(--evp-accent); outline-offset: -2px; border-radius: 14px; }
.dep-text { flex: 1; min-width: 0; display: grid; gap: 2px; }
.dep-text strong { font-weight: 600; overflow-wrap: anywhere; }
.dep-text small { color: var(--evp-soft); font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
.dep-time { flex: none; font-variant-numeric: tabular-nums; font-weight: 600; font-size: 14px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--evp-line); background: var(--evp-card); }
.ncar .tile-go svg { transition: transform .15s; }
.ncar.open .tile-go svg { transform: rotate(90deg); }
.dep-form, .ncar-body { display: grid; gap: 14px; padding: 4px 14px 14px; }
.dep-two { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 10px; }
.dep-two input, .dep-form .field input[type="text"], .dep-form .field input[type="time"] { width: 100%; min-width: 0; padding: 9px 12px; border: 1px solid var(--evp-line); border-radius: 10px; background: var(--evp-card); }
.dep-form .chips.days { margin-top: 6px; }
.dep-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dep-actions .grow { flex: 1; }
.sheet-sub { margin: 6px 0 0; font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--evp-soft); }
.place-card { display: grid; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--evp-ink) 7%, transparent); }
.place-card:last-of-type { border-bottom: 0; }
.tag { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--evp-a) 16%, transparent); color: var(--evp-ink); }
.select-wrap { display: block; }
.select-wrap select { width: 100%; max-width: 100%; padding: 9px 12px; border: 1px solid var(--evp-line); border-radius: 10px; background: var(--evp-card); }
@media (max-width: 520px) { .dep-two { grid-template-columns: minmax(0, 1fr); } }
.cal-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid color-mix(in srgb, var(--evp-ink) 7%, transparent); }
.cal-row > span { display: flex; align-items: center; gap: 8px; min-width: 0; }
.cal-row > span b { font-weight: 500; overflow-wrap: anywhere; }
.cal-row svg, .cal-car small svg { width: 17px; height: 17px; flex: none; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.cal-car { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid color-mix(in srgb, var(--evp-ink) 7%, transparent); }
.cal-car small { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; color: var(--evp-soft); }
.cal-word { display: flex; align-items: center; gap: 8px; }
.cal-word span { color: var(--evp-soft); font-size: 13px; }
.cal-car > b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cal-word input { width: 110px; padding: 7px 10px; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--evp-ink) 14%, transparent); background: var(--evp-card); color: var(--evp-ink); font: inherit; }
.cal-example { display: grid; gap: 4px; margin: 4px 0 10px; padding: 12px; border-radius: 12px; background: color-mix(in srgb, var(--evp-a) 9%, transparent); }
.cal-example code { font-size: 16px; font-weight: 600; font-family: inherit; background: none; padding: 0; }
.cal-example small { color: var(--evp-soft); }
.cal-guide { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 6px; color: var(--evp-soft); font-size: 14px; }
.go-when { margin: 6px 4px 0; color: var(--evp-soft); font-size: 13px; }
.go-when.as-link { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0 0; padding: 9px 12px; border: 0; border-radius: 12px; background: color-mix(in srgb, var(--evp-a) 9%, transparent); color: var(--evp-ink); font: inherit; font-size: 14px; text-align: left; cursor: pointer; }
.go-when.as-link svg { width: 17px; height: 17px; flex: none; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.go-when.as-link span { flex: 1; min-width: 0; font-weight: 600; }
.go-when.as-link em { font-style: normal; color: var(--evp-soft); font-size: 12px; }
.go-when.as-link svg:last-child { width: 13px; height: 13px; stroke: var(--evp-soft); transform: rotate(180deg); }
.sheet header h2 { display: flex; align-items: center; gap: 8px; min-width: 0; }
.sheet header h2 svg { width: 20px; height: 20px; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.next-hero { text-align: center; margin: 14px 0 6px; }
.next-hero .src { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; font-size: 13px; font-weight: 600; background: color-mix(in srgb, var(--evp-a) 14%, transparent); color: var(--evp-ink); }
.next-hero .src svg { width: 15px; height: 15px; fill: none; stroke: var(--evp-a); stroke-width: 2; }
.next-when { margin: 10px 0 0; font-size: 30px; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.next-left { margin: 2px 0 0; color: var(--evp-soft); }
.next-what { margin: 10px auto 0; max-width: 34ch; font-size: 15px; overflow-wrap: anywhere; }
.next-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 14px 0; }
.next-line .track { position: relative; height: 14px; border-radius: 999px; background: color-mix(in srgb, var(--evp-ink) 8%, transparent); overflow: hidden; }
.next-line .seg, .next-legend .dot.seg { background: var(--evp-a); }
.next-line .clim, .next-legend .dot.clim { background: #E8590C; }
.next-line .track i { position: absolute; top: 0; bottom: 0; border-radius: 999px; }
.next-line .ends { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: var(--evp-soft); font-variant-numeric: tabular-nums; }
.next-legend { margin: 10px 0 0; font-size: 13px; color: var(--evp-soft); }
.next-legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: 0; }
.sheet .actions { margin-top: 16px; display: flex; gap: 8px; }
.dial { display: grid; justify-items: center; margin-top: 4px; user-select: none; -webkit-user-select: none; }
.dial svg { width: min(300px, 80vw); height: auto; touch-action: none; cursor: pointer; outline: 0; }
.dial .rail { fill: none; stroke: color-mix(in srgb, var(--evp-ink) 10%, transparent); stroke-width: 18; stroke-linecap: round; }
.dial .fill { fill: none; stroke: url(#clim-g); stroke-width: 18; stroke-linecap: round; }
.dial .knob { fill: #fff; stroke: var(--evp-ink); stroke-width: 3; filter: drop-shadow(0 2px 4px rgba(0,0,0,.25)); }
.dial .t { font-size: 46px; font-weight: 650; fill: var(--evp-ink); letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.dial .sub { font-size: 14px; fill: var(--evp-soft); }
.dial.on .sub { fill: #E8590C; font-weight: 600; }
.dial.on .fill { filter: drop-shadow(0 0 8px rgba(232, 89, 12, .45)); }
.dial.plain { padding: 18px 0 6px; gap: 18px; }
.plain-state { display: grid; justify-items: center; gap: 4px; }
.plain-state svg { width: 64px; height: 64px; fill: none; stroke: var(--evp-soft); stroke-width: 1.4; }
.dial.plain.on .plain-state svg { stroke: #E8590C; }
.plain-state b { font-size: 22px; }
.plain-state small { color: var(--evp-soft); }
.dial.plain .dial-steps { margin-top: 0; }
.dial-steps { display: flex; align-items: center; gap: 14px; margin-top: -8px; }
.dial-steps .round { width: 48px; height: 48px; border-radius: 50%; border: 0; background: color-mix(in srgb, var(--evp-ink) 7%, transparent); color: var(--evp-ink); font-size: 24px; font-weight: 500; cursor: pointer; }
.dial-steps .power { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 24px; border-radius: 999px; border: 0; background: var(--evp-a); color: #fff; font: inherit; font-size: 16px; font-weight: 650; cursor: pointer; }
.dial-steps .power svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; }
.dial-steps .power.on { background: #E8590C; color: #fff; box-shadow: 0 6px 20px rgba(232, 89, 12, .35); }
.clim-auto { margin-top: 18px; display: grid; gap: 12px; border-top: 1px solid color-mix(in srgb, var(--evp-ink) 9%, transparent); padding-top: 14px; }
.clim-auto .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.clim-auto .segmented button { padding: 6px 12px; }
.clim-next { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; color: var(--evp-soft); }
.clim-next svg { width: 16px; height: 16px; flex: none; fill: none; stroke: var(--evp-a); stroke-width: 1.9; }
.week .day { position: relative; padding: 7px 0 14px; }
.week .day .marks { position: absolute; bottom: 2px; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 2px; font-style: normal; font-size: 9px; line-height: 1; height: 10px; }
.week .day .marks em { font-style: normal; font-weight: 600; }
.week .day .marks svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 2.2; }
.day-card { margin-top: 10px; padding: 12px; border-radius: 14px; background: color-mix(in srgb, var(--evp-ink) 4%, transparent); display: grid; gap: 10px; }
.day-title { margin: 0; font-weight: 600; }
.day-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.day-row > span:first-child { display: grid; place-items: center; width: 22px; flex: none; }
.day-row > span:first-child svg { width: 18px; height: 18px; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.day-row.sub { padding-left: 32px; flex-wrap: wrap; gap: 8px; }
.day-row.sub .chip-input { padding: 6px 12px; border: 1px solid color-mix(in srgb, var(--evp-ink) 14%, transparent); border-radius: 12px; background: var(--evp-card); }
.day-row.sub .chip-input input { color: var(--evp-ink); font-weight: 600; }
.day-seg { flex: 1; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
.day-seg button { white-space: nowrap; }
.day-range { flex: 1; min-width: 0; accent-color: var(--evp-a); }
.day-val { min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; }
.day-val.soft, .day-row .soft { color: var(--evp-soft); font-weight: 400; }
.icon-x { border: 0; background: transparent; color: var(--evp-soft); padding: 4px; cursor: pointer; display: grid; place-items: center; }
.icon-x svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; }
details.more { margin-top: 14px; border-top: 1px solid color-mix(in srgb, var(--evp-ink) 9%, transparent); }
details.more > summary { list-style: none; display: flex; align-items: center; gap: 10px; padding: 12px 2px 4px; cursor: pointer; font-weight: 600; }
details.more > summary::-webkit-details-marker { display: none; }
details.more > summary::after { content: ""; margin-left: auto; width: 8px; height: 8px; border-right: 2px solid var(--evp-soft); border-bottom: 2px solid var(--evp-soft); transform: rotate(45deg); transition: transform .2s; }
details.more[open] > summary::after { transform: rotate(225deg); }
details.more > summary svg { width: 18px; height: 18px; fill: none; stroke: var(--evp-a); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
details.more > summary small { color: var(--evp-soft); font-weight: 400; font-size: 13px; }
details.more .fields { margin-top: 8px; }
.chip-input.date { margin-top: 8px; gap: 8px; }
.chip-input.date span { color: var(--evp-soft); font-size: 13px; }
.chip-input.date input { width: auto; text-align: left; }
.trip-note { display: block; margin-top: 6px; }
.climate-box:empty { display: none; }
.climate { display: grid; gap: 6px; margin: 4px 0 14px; }
.climate-btn { justify-self: start; }
.climate-btn em { font-style: normal; font-variant-numeric: tabular-nums; opacity: .75; margin-left: 2px; }
.last-row { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; }
.soc-forecast { width: 100%; height: auto; display: block; }
.soc-forecast .grid line { stroke: color-mix(in srgb, var(--evp-ink) 10%, transparent); stroke-width: 1; }
.soc-forecast text { fill: var(--evp-soft); font-size: 10px; font-variant-numeric: tabular-nums; }
.soc-forecast .area { fill: color-mix(in srgb, var(--evp-a) 16%, transparent); }
.soc-forecast .line { fill: none; stroke: var(--evp-a); stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
.soc-forecast circle { fill: var(--evp-a); }
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

.home-page { display: grid; gap: 14px; }
${CLAY_CSS}
.home-flow .cscene { margin: 4px auto 12px; max-width: 980px; }
.carlook { display: flex; flex-wrap: wrap; gap: 8px; }
.home-gauge { display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: color-mix(in srgb, var(--evp-ink) 8%, transparent); margin-top: 6px; }
.home-gauge .hg-house { background: var(--evp-line); }
.home-gauge-text { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; color: var(--evp-soft); margin-top: 6px; font-variant-numeric: tabular-nums; }
.bad-text { color: var(--evp-bad); }
.home-chart { width: 100%; height: auto; display: block; margin-top: 6px; }
.home-chart .tl-limit { stroke: var(--evp-bad); stroke-width: 1.5; stroke-dasharray: 5 4; }
.home-chart .tl-x { font-size: 10px; fill: var(--evp-soft); }
.home-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: var(--evp-soft); margin-top: 8px; }
.home-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
  .rule-under { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }
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
.basis { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 14px; color: var(--evp-soft); }
.basis .btn.small { margin-left: auto; display: inline-flex; gap: 8px; align-items: baseline; }
.basis-diff { font-variant-numeric: tabular-nums; font-weight: 600; }
.basis-diff.less { color: var(--evp-good, #0F9D6B); }
.basis-diff.more { color: var(--evp-soft); }
.btn.small { padding: 5px 10px; border-radius: 9px; font-size: 13px; margin-left: auto; flex: none; }
.car-page .glance { margin: 12px 0 0; }
.car-page .why { margin: 6px auto 0; max-width: 46ch; font-size: 14px; line-height: 1.45; color: var(--evp-soft); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.panel-head h2 { margin: 0; }
.segmented.level button { padding: 6px 12px; font-size: 13px; }
.day-target { margin-top: 10px; }
.timeline .tl-done { fill: var(--evp-a); opacity: .9; }
.sw.done { background: var(--evp-a); border-radius: 3px; height: 6px; }
.icon { border: 0; background: transparent; width: 40px; height: 40px; border-radius: 10px; display: grid; place-content: center; cursor: pointer; color: var(--evp-soft); }
.icon:hover { background: color-mix(in srgb, var(--evp-ink) 6%, transparent); color: var(--evp-ink); }
.icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* ---------- facts */
.facts dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 14px 18px; margin: 0; }
.facts dt { color: var(--evp-soft); font-size: 13px; }
.facts dd { margin: 2px 0 0; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.facts dl.is-preview dd { color: var(--evp-soft); }
.save-note { margin: 14px 0 0; color: var(--evp-good); font-weight: 500; }
.facts dl.three { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.facts dl.three dd { font-size: 17px; }
.car-stats { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); align-items: start; }
.car-stats .panel[hidden] { display: none; }

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
.sheet { position: fixed; z-index: 21; left: 50%; bottom: 0; transform: translateX(-50%); width: min(520px, 100%); background: var(--evp-solid); border-radius: 22px 22px 0 0;
  padding: 18px 20px calc(22px + var(--evp-safe-bottom)); animation: up .3s cubic-bezier(.2,.8,.2,1); max-height: 90vh; overflow: auto; }
.sheet header { display: flex; justify-content: space-between; align-items: center; }
@media (min-width: 861px) {
  .sheet { bottom: auto; top: 50%; transform: translate(-50%, -50%); border-radius: 22px; max-height: min(86vh, 86dvh); padding-bottom: 22px; animation: fade .2s; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
}
.sheet h2 { margin: 0; font-size: 18px; }
.receipt { margin: 10px 0 16px; padding: 18px; border-radius: 16px; background: color-mix(in srgb, var(--evp-a) 7%, transparent); }
.receipt .amount { margin: 0; font-size: 36px; font-weight: 650; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.receipt .sub { margin: 4px 0 12px; color: var(--evp-soft); display: flex; gap: 8px; align-items: center; }
.receipt pre { margin: 0; white-space: pre-wrap; font: inherit; font-size: 14px; line-height: 1.55; }
.sheet .segmented { margin-bottom: 4px; }
@keyframes fade { from { opacity: 0; } }
@keyframes up { from { transform: translate(-50%, 100%); } }


/* ---------- 2.3: views, tiles and sheets */
.app { overflow-x: clip; }
.content { overflow-x: hidden; }
.car-views { width: 100%; grid-column: 1 / -1; }
.car-views button, .hist-views button { padding: 9px 10px; font-weight: 600; }
.hist-views { width: 100%; }
.tile-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); grid-column: 1 / -1; }
.tile { display: grid; grid-template-columns: 40px 1fr 18px; align-items: center; gap: 12px; text-align: left; padding: 14px 14px 14px 12px; cursor: pointer;
  background: var(--evp-card); color: var(--evp-ink); border: 1px solid var(--ha-card-border-color, var(--evp-line)); border-radius: var(--evp-radius);
  transition: transform .15s, box-shadow .2s; animation: tile-in .45s cubic-bezier(.2,.8,.2,1) both; }
.tile:nth-child(2) { animation-delay: 40ms; } .tile:nth-child(3) { animation-delay: 80ms; } .tile:nth-child(4) { animation-delay: 120ms; }
.tile:nth-child(5) { animation-delay: 160ms; } .tile:nth-child(6) { animation-delay: 200ms; } .tile:nth-child(7) { animation-delay: 240ms; }
.tile:hover { box-shadow: 0 8px 24px -14px rgba(0,0,0,.45); }
.tile:active { transform: scale(.985); }
.tile:focus-visible { outline: 2px solid var(--evp-accent); outline-offset: 2px; }
.tile-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-content: center; background: color-mix(in srgb, var(--evp-a) 14%, transparent); }
.tile-icon svg { width: 20px; height: 20px; fill: none; stroke: var(--evp-a); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.tile.off .tile-icon { background: color-mix(in srgb, var(--evp-ink) 6%, transparent); }
.tile.off .tile-icon svg { stroke: var(--evp-soft); }
.tile-text { display: grid; gap: 2px; min-width: 0; }
.tile-text strong { font-size: 15px; font-weight: 600; }
.tile-text small { color: var(--evp-soft); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile-go svg { width: 16px; height: 16px; transform: rotate(180deg); fill: none; stroke: var(--evp-soft); stroke-width: 2; }
.sheet.in-page { display: grid; gap: 12px; }
.sheet.in-page header { position: sticky; top: -18px; background: var(--evp-solid); padding: 4px 0 8px; z-index: 1; }
.sheet.in-page h2 { display: flex; align-items: center; gap: 8px; }
.sheet.in-page h2 svg { width: 20px; height: 20px; fill: none; stroke: var(--evp-a); stroke-width: 1.8; }
.sheet-body { display: grid; gap: 4px; }
.sheet-body .rule { border-top: 1px solid var(--evp-line); padding-top: 12px; }
.sheet-body .rule:first-child { border-top: 0; padding-top: 0; }
.sheet-body .rule:has(.unit-input, .chip-input) .rule-ctl { grid-column: 2 / -1; grid-row: 2; justify-content: flex-start; }
.sheet-body .rule:has(.unit-input, .chip-input) .rule-ctl .switch { margin-left: auto; }
@keyframes tile-in { from { opacity: 0; transform: translateY(8px); } }
.dial .ceil-ring { fill: none; stroke: var(--evp-ink); stroke-opacity: .55; stroke-width: 1.4; stroke-dasharray: 3 4; }
.ceil-note { color: var(--evp-soft); font-size: 13px; margin: 6px 0 0; text-align: center; }

/* ---------- 2.3: the Home tab */
.home-page { display: grid; gap: 14px; max-width: 1180px; margin: 0 auto; grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 1000px) {
  .home-page { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); }
  .home-page > .home-flow { grid-row: span 4; }
}
.home-flow { padding: 12px; }
.now-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 12px; }
.now-chip { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 14px; background: color-mix(in srgb, var(--evp-ink) 5%, transparent); animation: tile-in .5s both; }
.now-chip .nc-icon svg { width: 18px; height: 18px; fill: none; stroke: var(--evp-soft); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.now-chip .nc-text { display: grid; line-height: 1.15; min-width: 0; }
.now-chip small { color: var(--evp-soft); font-size: 11.5px; }
.now-chip b { font-size: 15px; font-weight: 650; font-variant-numeric: tabular-nums; white-space: nowrap; }
.now-chip.live .nc-icon svg, .now-chip.good .nc-icon svg { stroke: var(--evp-a); }
.now-chip.sun .nc-icon svg { stroke: #F5B92E; }
.tn-chart { position: relative; display: grid; gap: 8px; padding-top: 40px; }
.tn-prices { position: absolute; left: 112px; right: 82px; top: 0; height: 30px; }
.tn-prices i { position: absolute; bottom: 0; border-radius: 3px 3px 0 0; opacity: .75; transform-origin: bottom; animation: grow .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.tn-row { display: grid; grid-template-columns: 104px 1fr 74px; align-items: center; gap: 8px; }
.tn-name { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; min-width: 0; white-space: nowrap; overflow: hidden; }
/* The name in a box of its own: a long name ends in "…" (a flex box cannot do that to its own text). */
.tn-name span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.tn-name em { width: 9px; height: 9px; border-radius: 3px; flex: none; }
.tn-track { position: relative; height: 14px; border-radius: 7px; background: color-mix(in srgb, var(--evp-ink) 6%, transparent); overflow: hidden; }
.tn-track i { position: absolute; top: 0; bottom: 0; border-radius: 7px; transform-origin: left; animation: sweep .7s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.tn-cost { font-size: 12.5px; font-variant-numeric: tabular-nums; text-align: right; color: var(--evp-soft); white-space: nowrap; }
.tn-axis { position: relative; height: 14px; margin: 0 82px 0 112px; }
.tn-axis span { position: absolute; transform: translateX(-50%); font-size: 11px; color: var(--evp-soft); }
.today-nums { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px; margin: 0 0 12px; }
.today-nums dt, .hist-nums dt { color: var(--evp-soft); font-size: 12.5px; }
.today-nums dd, .hist-nums dd { margin: 2px 0 0; font-size: 22px; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.share-bar { height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--evp-ink) 7%, transparent); overflow: hidden; }
.share-bar i { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--evp-a), var(--evp-b)); transform-origin: left; animation: sweep .9s cubic-bezier(.2,.8,.2,1) both; }
.hour-bars { display: flex; align-items: flex-end; gap: 3px; height: 64px; margin-top: 14px; }
.hour-bars i { flex: 1; min-height: 2px; border-radius: 3px 3px 1px 1px; background: color-mix(in srgb, var(--evp-a) 65%, var(--evp-line)); transform-origin: bottom; animation: grow .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
@keyframes grow { from { transform: scaleY(0); } }
@keyframes sweep { from { transform: scaleX(0); } }

/* ---------- 2.3: the history */
.hist-page { max-width: 980px; }
.hist-controls { display: grid; gap: 10px; }
.hist-period { width: 100%; }
.hist-scope { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; scrollbar-width: none; }
.hist-scope button { white-space: nowrap; }
.hist-nav { display: grid; grid-template-columns: 36px 1fr 36px; align-items: center; text-align: center; }
.hist-nav strong { font-size: 15px; text-transform: capitalize; }
.hist-nav .icon { width: 36px; height: 36px; border: 0; background: transparent; cursor: pointer; display: grid; place-content: center; color: var(--evp-ink); }
.hist-nav .icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; }
.hist-nav .fwd svg { transform: rotate(180deg); }
.hist-nav .icon:disabled { opacity: .3; cursor: default; }
.hist-nums { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 0 0 14px; }
.hist-nums .small dd { font-size: 18px; }
.hist-nums .sun dd { color: #D99A00; }
.hist-chart { width: 100%; height: 190px; overflow: visible; display: block; }
.hb-axis { position: relative; height: 18px; margin-top: 4px; }
.hb-axis span { position: absolute; transform: translateX(-50%); font-size: 11.5px; color: var(--evp-soft); white-space: nowrap; }
.hist-chart .hb-grid { stroke: var(--evp-line); stroke-width: 1; }
.hist-chart .hb-bar { transform-box: fill-box; transform-origin: bottom; animation: grow .7s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.hist-chart .hb-bar.house { fill: color-mix(in srgb, var(--evp-ink) 13%, transparent); }

.cal-wrap { overflow-x: auto; margin-top: 14px; }
.cal { width: 100%; min-width: 480px; height: auto; }
.cal .cal-day { fill: color-mix(in srgb, var(--evp-ink) 7%, transparent); animation: tile-in .5s both; animation-delay: var(--d); }

/* ---------- 2.3: what EV Planner has learned */
.learn-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.learn-card { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 16px; background: color-mix(in srgb, var(--evp-ink) 4%, transparent); animation: tile-in .5s both; }
.learn-card.wide { grid-column: 1 / -1; flex-wrap: wrap; }
.learn-card > div { display: grid; gap: 3px; min-width: 0; }
.learn-card > .curve-bars { display: flex; }
.learn-card small { color: var(--evp-soft); font-size: 12.5px; }
.learn-card b { font-size: 15px; font-weight: 650; }
.learn-card .soft { color: var(--evp-soft); font-size: 13px; }
.gauge { width: 96px; flex: none; }
.gauge .g-track { fill: none; stroke: color-mix(in srgb, var(--evp-ink) 10%, transparent); stroke-width: 10; stroke-linecap: round; }
.gauge .g-fill { fill: none; stroke: url(#evp-win); stroke: var(--evp-a); stroke-width: 10; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.1s .15s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.curve-bars { display: flex; align-items: stretch; gap: 8px; height: 96px; flex: none; }
.curve-bars .cb { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 3px; width: 44px; }
.curve-bars i { display: block; width: 24px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, var(--evp-b), var(--evp-a)); transform-origin: bottom; animation: grow .7s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); max-height: 60px; }
.curve-bars span { font-size: 10px; color: var(--evp-soft); white-space: nowrap; }
.curve-bars b { font-size: 11px; }
.hour-clock { width: 130px; flex: none; }
.hour-clock .hc-face { fill: color-mix(in srgb, var(--evp-ink) 6%, transparent); }
.hour-clock .spoke { stroke: color-mix(in srgb, var(--evp-ink) 10%, transparent); stroke-width: 4; stroke-linecap: round; }
.hour-clock .spoke.on { stroke: var(--evp-a); animation: spoke .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d); }
.hour-clock .spoke.house { stroke: color-mix(in srgb, var(--evp-sand) 85%, var(--evp-ink)); }
.hour-clock text { font-size: 8px; fill: var(--evp-soft); text-anchor: middle; }
@keyframes spoke { from { opacity: 0; } }
.habits { display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 10px 18px; margin: 0; flex: 1; }
.habits dt { color: var(--evp-soft); font-size: 12px; }
.habits dd { margin: 2px 0 0; font-size: 16px; font-weight: 650; }
.sure { display: inline-flex; gap: 4px; align-items: center; }
.sure i { width: 7px; height: 7px; border-radius: 50%; background: color-mix(in srgb, var(--evp-ink) 12%, transparent); animation: tile-in .4s both; animation-delay: var(--d); }
.sure i.on { background: var(--evp-a); }
.promise { display: flex; align-items: baseline; gap: 4px; flex: none; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--evp-a) 14%, transparent); }
.promise.late { background: color-mix(in srgb, var(--evp-coral) 14%, transparent); }
.promise b { font-size: 22px; }
.promise span { color: var(--evp-soft); font-size: 12px; }
.thermo { width: 54px; height: 54px; border-radius: 50%; flex: none; display: grid; place-content: center; background: conic-gradient(from 200deg, #4BA3FF, var(--evp-a), #F5B92E, var(--evp-coral)); }
.thermo b { width: 42px; height: 42px; border-radius: 50%; display: grid; place-content: center; background: var(--evp-card); font-size: 13px; }

/* ---------- narrow screens */
@media (max-width: 860px) {
  .content { padding: 14px 12px calc(96px + var(--evp-safe-bottom)); }
  .page { grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .col { gap: 14px; }
  .cars-grid, .side-grid { gap: 14px; }
  .tabs { position: fixed; left: 0; right: 0; bottom: 0; justify-self: stretch; justify-content: space-around; background: var(--evp-solid); border-top: 1px solid var(--evp-line); padding: 6px 8px calc(6px + var(--evp-safe-bottom)); z-index: 5; isolation: isolate; }
  /* A sheet that opens in the page lies over the tab bar, not under it. */
  .content:has(.sheet.in-page) { position: relative; z-index: 13; }
  /* The tabs sit in the header: above everything on the page, below the sheets. */
  .bar { z-index: 12; }
  .toast { z-index: 14; }
  .tn-prices { left: 86px; right: 74px; }
  .tn-row { grid-template-columns: 80px 1fr 68px; gap: 6px; }
  .tn-axis { margin: 0 74px 0 86px; }
  .car-head { display: grid; grid-template-columns: auto auto minmax(0, 1fr); column-gap: 10px; row-gap: 4px; }
  .car-head .pill { grid-column: 3; justify-self: start; }
  .car-title h1 { font-size: 20px; }
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
export { EvPlannerPanel, TEXT, STYLE, ICONS, MARK, MODES, MODE_ICONS, chargerArt, esc, clamp, isNum, hasSegments, cssId };
// For the tests of the house's picture; nothing else uses it.
export { ClayScene as _ClayScene };
