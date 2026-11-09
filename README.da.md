<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/logo-dark.png">
    <img src="docs/images/logo.png" alt="EV Planner" width="420">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/Dinnsen/ha-ev-planner/releases"><img alt="Version" src="https://img.shields.io/github/v/release/Dinnsen/ha-ev-planner?style=flat-square&label=version&color=00B894"></a>
  <a href="https://github.com/Dinnsen/ha-ev-planner/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/Dinnsen/ha-ev-planner/total?style=flat-square&label=downloads&color=00B894"></a>
  <a href="https://my.home-assistant.io/redirect/marketplace_repository/?owner=Dinnsen&repository=ha-ev-planner&category=integration"><img alt="Marketplace" src="https://img.shields.io/badge/Marketplace-default-41BDF5?style=flat-square&logo=homeassistant&logoColor=white"></a>
  <img alt="Home Assistant 2026.3+" src="https://img.shields.io/badge/Home%20Assistant-2026.3%2B-18BCF2?style=flat-square&logo=homeassistant&logoColor=white">
  <a href="https://github.com/Dinnsen/ha-ev-planner/actions/workflows/tests.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/Dinnsen/ha-ev-planner/tests.yml?branch=main&style=flat-square&label=tests"></a>
  <a href="LICENSE"><img alt="Licens: MIT" src="https://img.shields.io/badge/licens-MIT-97ca00?style=flat-square"></a>
  <a href="https://buymeacoffee.com/dinnsen"><img alt="Buy Me a Coffee" src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-ffdd00?style=flat-square&logo=buymeacoffee&logoColor=black"></a>
</p>

# EV Planner til Home Assistant

🇬🇧 [Read in English](README.md)

EV Planner lader husstandens elbiler, når strømmen er billigst, og tager sig stadig af gæsten, der kommer i elbil. Den læser elpriserne, hver bils batteriniveau og ladegrænse, og hvornår bilen skal være klar, og planlægger den billigste ladning. Derefter starter og pauser den ladningen via bilen eller laderen – eller, for en bil ingen af dem kan styre, planlægger den, minder dig om stikket og fortæller, hvad der sker.

EV Planner er bygget på [EV Guest](https://github.com/Dinnsen/EV-Guest) (planlæggeren, prisuret og gæsteflowet) og kan alt det, [EV Smart Charging](https://github.com/jonasbkarlsson/ev_smart_charging) kan, og mere til.

## Funktioner

- **Så mange biler og ladepunkter, I har.** Biler og ladepunkter tilføjes på integrationens side. Biler på samme ladepunkt deler det: den, der skal være klar først, får det først, og en gæst har det under gæstesessionen.
- **I vælger per bil, hvem der starter og stopper ladningen:** bilen (dens ladekontakt), laderen (dens kontakt) eller ingen – så planlægger EV Planner, minder jer om stikket og udsender en *Ladestyring*-sensor til egne automationer.
- **Den billigste plan** ud fra kvarter- eller timepriser: i hele kvarterer (som EV Smart Charging), én periode eller de billigste perioder, med pris og besparelse. Bilen stopper selv ved sin grænse, så det kvarter, den ikke bruger helt, koster ingenting.
- **Lærer hvor hurtigt hver bil lader.** Planen regnes ud fra den ladehastighed i % pr. time, bilen selv viser. En bil, der trækker mindre end indstillet, eller et batteri, der ikke har den størrelse, I troede, får stadig en plan, der er lang nok. Intet at indstille: ingen effektivitet, intet gætteri. En ladning tæller, når niveauet er steget mindst 30 %, og under ladningen følger planen den hastighed, bilen viser. Med bilens sensor for ladeeffekt lærer EV Planner også effekten og tæller energien med den.
- **Klar kl.** et tidspunkt, per ugedag (gerne med sit eget mål, fx fredag 100 %), eller efter en tur i kalenderen ("Aarhus 90 %" lader til 90 %).
- **Lærer bilens ladekurve:** mange biler lader langsommere til sidst, så hastigheden læres i hvert bånd af ladeniveauet (0–50, 50–80, 80–90, 90–100 %), og en plan til 100 % giver de sidste procent den tid, de tager. En morgen, hvor bilen ikke helt nåede det, får de næste planer til at slutte lidt før (i kvarterer, højst en time); tre morgener til tiden flytter det tilbage.
- **Hellere tidligt:** den plan, der er færdig først, når den højst koster et par øre mere pr. kWh end den billigste – næsten ens priser skubber ikke ladningen langt ud på natten.
- **Top op før afgang:** lad fx til 80 % når det er billigst og resten lige før klar-tiden, så bilen ikke står på 100 % hele natten.
- **En plan, der ikke flytter sig for få øre:** en ny pris eller måling beholder planen, medmindre en ny sparer mere end 0,50 kr. (eller 2 %).
- **Regler fra EV Smart Charging:** minimumsniveau uanset pris, prisloft (fast pris, eller gennemsnittet frem til klar-tiden plus en procent), lad ved lav pris, lad ved lavt batteri, opportunistisk ladning, tidligste start og hold laderen tændt (forvarmning fra nettet).
- **Lad færdig i ét stræk:** Når det højst koster et valgt beløb mere pr. kWh (fx 0,05 kr.) at lade videre nu eller i én periode end den billigste plan, lader bilen færdig i ét stræk i stedet for at stoppe ved daggry og lade det sidste næste nat for et par øre mindre. En anden bil, der er sat til samme lader, beholder de timer, den har planlagt. En bil uden stik holder ingen timer fri, for på en lader med ét kabel er det bilen, der er sat til, der lader i sin plan.
- **Tilstande:** Smart, Lad nu (tilbage til Smart, når bilen er fuld eller taget ud), Pause, Fra.
- **Tjekker at ladningen startede:** prøver igen efter 6 og 12 minutter, giver så besked og prøver af og til igen. Højst 12 kommandoer pr. bil i timen. En bil, der ikke starter igen efter en pause i planen (nogle biler skal have stikket sat i igen), bliver lært og lader så i ét stræk.
- **Klar uden priser:** mens den venter på priser, har en bil med klar-tid en plan, der slutter lige før, hvis priserne aldrig kommer. Rigtige priser erstatter den.
- **Påmindelse om stikket** med knapperne *Lad nu* og *Følg planen*, **live-notifikationer** mens bilen lader (Live Activities på iPhone, Live Updates på Android), **besked når bilen er ladet** og en **morgenkvittering** ved klar-tiden med en advarsel, hvis bilen ikke kan nå målet – alle med ikoner.
- **Gæstebilen** præcis som i EV Guest: opslag på nummerplade, prisur, regning og historik – og *Lad nu*, der lader med det samme og gemmes i historikken. En plan i to perioder kommer med på regningen for begge, og en ny plan, mens gæsten lader, beholder det, der allerede er ladet.
- **Historik pr. tilkobling:** med en stik-sensor kommer en ladning i historikken, når bilen tages ud – én linje med dens perioder, ikke én pr. pause.
- **Billeder** af jeres biler og ladere (tryk på billedet i panelet), og tegninger af ca. 40 kendte ladere.
- **Statistik:** energi, pris og ladninger per bil og måned.
- **Panel** i sidebjælken og som app på hjemmeskærmen, på dansk og engelsk, lyst og mørkt. Bilens side viser med ét blik, hvornår den er klar, til hvad, for hvor meget og hvornår den lader, og *hvorfor* den gør det, den gør nu; prisgrafen viser, hvornår den faktisk ladede. *Enkel*, *Smart* og *Ekspert* viser færre eller flere valg.
- **Priser fra** Energi Data Service, Nord Pool, ENTSO-e, GE-Spot eller enhver sensor med en liste af priser med start og pris.

## Installation

[![Åbn EV Planner i Marketplace i din Home Assistant.](https://img.shields.io/badge/%C3%85bn%20i-Marketplace-41BDF5?style=for-the-badge&logo=homeassistant&logoColor=white)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=Dinnsen&repository=ha-ev-planner&category=integration)

1. **Indstillinger → Marketplace**, søg efter **EV Planner**, og installér den (eller brug knappen ovenfor).
2. Genstart Home Assistant, hvis den beder om det.

Før Home Assistant 2026.11 hed Marketplace HACS: søg efter **EV Planner** der, og hent den.

### Opdatering fra EV Planner 1.x

Fra version 2.0 er EV Planners domæne `ev_household_planner` (før `ev_planner`, som en anden integration i Marketplace bruger). Navnet, panelet, kortene og entitets-id'erne er de samme.

1. Opdatér EV Planner i Marketplace, og genstart Home Assistant. EV Planner 1.x kører videre indtil næste trin.
2. **Indstillinger → Enheder og tjenester → Tilføj integration → EV Planner.** EV Planner tilbyder at flytte husstanden fra 1.x: opsætning, biler, ladepunkter, indstillinger, planer, historik, læring og billeder, og entiteterne med deres entitets-id'er, så dashboards og automationer, der bruger dem, virker som før.
3. Slet mappen `config/custom_components/ev_planner`, og genstart Home Assistant. En reparation minder dig om det, så længe den ligger der.

Handlingerne hedder nu `ev_household_planner.*` i stedet for `ev_planner.*`: ret automationer og scripts, der bruger dem.

## Opsætning

1. **Indstillinger → Enheder og tjenester → Tilføj integration → EV Planner.** Vælg prissensor og valuta. MotorAPI-nøglen bruges kun til gæstebiler. Uden for Danmark: vælg *Andet land* – så indtastes gæstens batteri og ladeeffekt i hånden.
2. **Tilføj ladepunkt** for hvert ladepunkt. Vælg laderens enhed i Home Assistant og/eller mærke og model, så udfylder EV Planner effekt, kontakt, energimåler og *bil tilsluttet*-sensor, som I kan rette.
3. **Tilføj bil** for hver bil (alle biler sættes op ens). Vælg bilens enhed i Home Assistant, så finder EV Planner ladeniveau, ladegrænse, stik, ladning, placering og ladekontakt: batterikapacitet (et tal eller en sensor fra bilen), bilens sensorer (alle valgfri, også ladeeffekt i kW), ladeeffekt (et udgangspunkt, indtil bilen har vist den), ladepunkt, og hvem der starter og stopper ladningen. Har I EV Smart Charging, kan I starte fra den bil derfra – også med dens ladehastighed i % pr. time.
4. **Konfigurer**: hvilke mobiler der får beskeder, og om iOS-widgets skal opdateres.

## Fra EV Smart Charging

Når I tilføjer en bil, kan I starte fra en bil i EV Smart Charging: sensorer, ladekontakt og indstillinger kopieres. EV Smart Charging ændres ikke. Kør begge en tid med *ingen* styring i EV Planner, sammenlign planerne, og slå så styringen til i EV Planner og *Smart charging activated* fra i EV Smart Charging.

## Kort til dashboards

<img src="docs/images/cards-da.png" alt="EV Planners kort på et dashboard på telefonen, og pop-up'en for en bil" width="100%">

EV Planner har seks kort til jeres egne dashboards. De følger med integrationen – der skal ikke tilføjes en ressource eller installeres andet – og findes under **Tilføj kort** (søg på *EV Planner*), med en visuel editor, hvor I vælger bil eller lader. De bruger panelets egen tegning, så de ser ud og opdateres præcis som det.

| Kort | | Bredde |
| --- | --- | --- |
| **Husstand** `custom:ev-planner-household-card` | Alle biler, gæsten og laderne på én linje med ladeniveau og status. Til en forside med lidt plads. | Hel |
| **Bil** `custom:ev-planner-car-card` | En bil: batteri, mål, hvornår den lader, pris og besparelse. | Halv |
| **Bil, stor** `custom:ev-planner-car-large-card` | Bilkortet fra EV Planners oversigt: lille prisur, batteri og tilstandsknapperne, som virker direkte på kortet. | Hel |
| **Gæst** `custom:ev-planner-guest-card` | *Tilføj gæst*, når der ingen er, ellers nummerplade, bil, plan og pris – med *Stop ladning*, mens den lader, og *Afregn*, når den er færdig. | Halv |
| **Lader** `custom:ev-planner-charger-card` | En lader: hvad den gør, for hvem, og hvem der er den næste. | Halv |
| **Bubble** `custom:ev-planner-bubble-card` | En bil, gæsten eller en lader som én [Bubble Card](https://github.com/Clooos/Bubble-Card)-knap, der passer ind mellem jeres Bubble-kort. Se nedenfor. | Én række |

**Tryk på et kort** åbner en pop-up med bilens, gæstens eller laderens side: prisuret, batteriet med håndtag, klar kl., ugeplanen og plantypen for en bil; det hele for gæsten; og bilerne på en lader, som man kan trykke videre på. Regler og beskeder ligger i EV Planner – pop-up'ens **Åbn i EV Planner** går dertil. Pop-up'en er Home Assistants egen dialog, så den ligger over alt andet (også inde i en Bubble Card pop-up) og lukkes med tilbage-knappen eller ved at trække den ned på telefonen.

```yaml
type: custom:ev-planner-car-card
vehicle: 01M59TAC12D9P50SH4HK4RN1JA   # editoren udfylder den
name: Tesla                           # valgfrit
tap_action: popup                     # popup (standard), panel eller none
```

`tap_action: panel` åbner EV Planner direkte på bilen, laderen eller gæsten i stedet for pop-up'en. Husstandskortet har `show_cars`, `show_guest` og `show_chargers` (alle `true` som standard). Panelets sider har hver sin adresse: `/ev-planner/car/<id>`, `/ev-planner/charger/<id>`, `/ev-planner/guest`, `/ev-planner/history` og `/ev-planner/settings`.

### Bubble-kortet

<img src="docs/images/bubble-da.png" alt="EV Planners Bubble-kort for to biler, gæsten og en lader i et Theme Studio-tema, lyst og mørkt" width="100%">

Bubble-kortet har Bubble Cards mål (én række på 50 px, rundt ikon, navn og status, sub-knapper til højre) og læser de samme `--bubble-*`-variabler, så et tema, der styler Bubble Card, også styler det. Bubble Card behøver ikke at være installeret.

- **En bil:** ladeniveauet fylder knappen som en Bubble-slider, en tynd streg viser målet, og der løber et lys gennem fyldet, mens den lader. Sub-knapperne er planens pris og tilstanden, som åbner en menu med *Smart*, *Lad nu*, *Pause* og *Fra*.
- **Gæsten:** *Tilføj*, når der ingen er; ellers nummerplade, bil, status og niveauer – med *Stop*, mens den lader, og *Afregn*, når den er færdig.
- **En lader:** hvem den lader for, eller hvem der er den næste, og effekten, mens den lader – så er hele knappen fyldt, som en Bubble-kontakt, der er tændt.

```yaml
type: custom:ev-planner-bubble-card
vehicle: 01M59TAC12D9P50SH4HK4RN1JA   # eller charger: <id>, eller guest: true
```

### Temaer

Kortene følger jeres tema uden card-mod: Home Assistants egne variabler for kort og dialoger, Bubble Cards `--bubble-*`-variabler for Bubble-kortet, menuen og pop-up'en, og [Theme Studio](https://github.com/Dinnsen/theme-studio)s glas-slør, hævede flade, chip-hjørner og pop-up-kant og -skygge. Den [engelske README](README.md#themes) har den fulde liste.

## Widgets

En integration kan ikke selv lægge widgets på telefonen, men companion-appens widgets kan vise EV Planner: på iOS fx et *Brugerdefineret*-, *Gauge*- eller *Sensorer*-widget med `sensor.<bil>_summary`, `sensor.<bil>_status` og bilens batteri. Slå **Opdater iOS-widgets** til under **Konfigurer**.

## Fjern integrationen

Fjern EV Planner under **Indstillinger → Enheder og tjenester**. Indstillinger, planer og historik slettes med den. Bilerne og ladepunkterne ændres ikke.

## Tak til

[EV Smart Charging](https://github.com/jonasbkarlsson/ev_smart_charging) af Jonas Karlsson, som viste vejen for prisstyret opladning i Home Assistant. Flere af reglerne og *Fra EV Smart Charging* bygger på dens idéer.

Se den [engelske README](README.md) for entiteter, handlinger, begrænsninger og fejlfinding.
