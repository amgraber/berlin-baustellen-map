// UI language (English default, German toggle) and UI strings.
// Data texts are translated separately in translate-de-en.js.

export const LANGS = ['en', 'de'];
const STORAGE_KEY = 'lang';

const STRINGS = {
  en: {
    title: 'Construction nearby',
    locate: '📍 My location',
    radius: 'Radius',
    langToggle: 'Language',
    mapLabel: 'Map. Tap anywhere to check that spot.',
    filters: 'Filters & legend',
    showPlanb: 'Include all permitted works (GDI “Planbare Ereignisse”)',
    showParking: '…including no-parking-zone-only permits',
    showEnded: 'Show ended',
    legendClosure: 'Closure',
    legendPartial: 'Lane / partial restriction',
    legendWorks: 'Construction / works',
    legendOther: 'Other (hazard, disruption)',
    hint: 'Tap the map to check any spot.',
    summary: '{label}: {n} within {r}',
    originCentre: 'Berlin centre',
    originPicked: 'Picked point',
    originYou: 'Your location',
    empty: 'Nothing reported here. Try a larger radius or another spot.',
    loading: 'Loading Berlin construction & closure data…',
    locating: 'Finding your location…',
    geoUnavailable: 'Geolocation is not available in this browser. Tap the map to pick a point.',
    geoFailed: "Couldn't get your location ({msg}). Tap the map to pick a point.",
    vizPartial: 'One of the VIZ feeds failed to load; results may be incomplete.',
    vizFailed: 'Could not load VIZ data: {msg}',
    planbFailed: 'Could not load the planned-works layer (GDI Berlin). Showing VIZ data only.',
    restriction: 'Restriction',
    lanes: 'Lanes',
    lanesClosed: '{closed} of {total} closed',
    direction: 'Direction',
    start: 'Start',
    plannedEnd: 'Planned end',
    source: 'Source',
    updated: 'updated {date}',
    original: 'Original (German)',
    unknown: 'unknown',
    startsToday: 'starts today',
    startsTomorrow: 'starts tomorrow',
    startsIn: 'starts in {n} days',
    ended: 'ended',
    noEnd: 'no end date',
    endsToday: 'ends today',
    endsTomorrow: 'ends tomorrow',
    daysLeft: '{n} days left',
    catClosure: 'Closure',
    catPartial: 'Lane restriction',
    catWorks: 'Works',
    catOther: 'Other',
    showProjects: 'Show what’s being built (OpenStreetMap, infraVelo)',
    legendProject: 'Project: what’s being built',
    whyTitle: 'Why? Nearby project, possibly the reason',
    whyNone: 'No matching project found nearby. The sources don’t say who is building what here.',
    projectUnnamed: 'Unnamed construction site',
    projectType: 'Building',
    builder: 'Developer / client',
    status: 'Status',
    schedule: 'Schedule',
    opening: 'Planned opening',
    openingPast: '{date} (already passed, data may be outdated)',
    website: 'Website',
    viewOnOsm: 'View / fix on OpenStreetMap',
    translate: 'Translate',
    projectsFailed: 'Could not load the project layer (OpenStreetMap / infraVelo).',
    projectSourceOsm: 'OpenStreetMap contributors',
    projectSourceCycle: 'infraVelo / GDI Berlin “Radverkehrsmaßnahmen”',
    lastEdited: 'last edited {date}',
  },
  de: {
    title: 'Baustellen in der Nähe',
    locate: '📍 Mein Standort',
    radius: 'Umkreis',
    langToggle: 'Sprache',
    mapLabel: 'Karte. Tippe auf einen Ort, um ihn zu prüfen.',
    filters: 'Filter & Legende',
    showPlanb: 'Alle genehmigten Arbeiten einbeziehen (GDI „Planbare Ereignisse“)',
    showParking: '…auch reine Halteverbotszonen',
    showEnded: 'Beendete anzeigen',
    legendClosure: 'Sperrung',
    legendPartial: 'Fahrstreifen- / Teilsperrung',
    legendWorks: 'Baustelle / Arbeiten',
    legendOther: 'Sonstiges (Gefahr, Störung)',
    hint: 'Tippe auf die Karte, um einen beliebigen Ort zu prüfen.',
    summary: '{label}: {n} im Umkreis von {r}',
    originCentre: 'Berlin-Zentrum',
    originPicked: 'Gewählter Punkt',
    originYou: 'Dein Standort',
    empty: 'Hier ist nichts gemeldet. Versuche einen größeren Umkreis oder einen anderen Ort.',
    loading: 'Lade Berliner Baustellen- und Sperrungsdaten…',
    locating: 'Standort wird ermittelt…',
    geoUnavailable: 'Standortbestimmung ist in diesem Browser nicht verfügbar. Tippe auf die Karte, um einen Ort zu wählen.',
    geoFailed: 'Standort konnte nicht ermittelt werden ({msg}). Tippe auf die Karte, um einen Ort zu wählen.',
    vizPartial: 'Einer der VIZ-Datensätze konnte nicht geladen werden; die Ergebnisse sind evtl. unvollständig.',
    vizFailed: 'VIZ-Daten konnten nicht geladen werden: {msg}',
    planbFailed: 'Die Ebene „Planbare Ereignisse“ (GDI Berlin) konnte nicht geladen werden. Es werden nur VIZ-Daten angezeigt.',
    restriction: 'Einschränkung',
    lanes: 'Fahrstreifen',
    lanesClosed: '{closed} von {total} gesperrt',
    direction: 'Richtung',
    start: 'Beginn',
    plannedEnd: 'Geplantes Ende',
    source: 'Quelle',
    updated: 'aktualisiert {date}',
    original: 'Original',
    unknown: 'unbekannt',
    startsToday: 'beginnt heute',
    startsTomorrow: 'beginnt morgen',
    startsIn: 'beginnt in {n} Tagen',
    ended: 'beendet',
    noEnd: 'kein Enddatum',
    endsToday: 'endet heute',
    endsTomorrow: 'endet morgen',
    daysLeft: 'noch {n} Tage',
    catClosure: 'Sperrung',
    catPartial: 'Fahrstreifensperrung',
    catWorks: 'Arbeiten',
    catOther: 'Sonstiges',
    showProjects: 'Zeigen, was gebaut wird (OpenStreetMap, infraVelo)',
    legendProject: 'Projekt: was hier gebaut wird',
    whyTitle: 'Warum? Projekt in der Nähe, möglicherweise der Grund',
    whyNone: 'Kein passendes Projekt in der Nähe gefunden. Die Quellen sagen nicht, wer hier was baut.',
    projectUnnamed: 'Baustelle ohne Namen',
    projectType: 'Vorhaben',
    builder: 'Bauherr / Entwickler',
    status: 'Status',
    schedule: 'Zeitraum',
    opening: 'Geplante Eröffnung',
    openingPast: '{date} (bereits vorbei, Daten evtl. veraltet)',
    website: 'Website',
    viewOnOsm: 'Auf OpenStreetMap ansehen / korrigieren',
    translate: 'Übersetzen',
    projectsFailed: 'Die Projektebene (OpenStreetMap / infraVelo) konnte nicht geladen werden.',
    projectSourceOsm: 'OpenStreetMap-Mitwirkende',
    projectSourceCycle: 'infraVelo / GDI Berlin „Radverkehrsmaßnahmen“',
    lastEdited: 'zuletzt bearbeitet {date}',
  },
};

function initialLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(stored)) return stored;
  } catch {
    // storage unavailable (private mode etc.): fall through to the default
  }
  return 'en';
}

let lang = initialLang();

export const getLang = () => lang;

export function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // not persisted; fine for this session
  }
}

export function t(key, vars = {}) {
  const template = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export const locale = () => (lang === 'de' ? 'de-DE' : 'en-GB');

// OSM construction=* values (plus a few derived keys) → label per language.
const PROJECT_TYPES = {
  residential: ['Residential building', 'Wohngebäude'],
  apartments: ['Apartment building', 'Mehrfamilienhaus'],
  house: ['House', 'Haus'],
  detached: ['Detached house', 'Einfamilienhaus'],
  semidetached_house: ['Semi-detached houses', 'Doppelhaus'],
  terrace: ['Terraced houses', 'Reihenhäuser'],
  commercial: ['Commercial building', 'Gewerbebau'],
  office: ['Office building', 'Bürogebäude'],
  retail: ['Retail building', 'Einzelhandel'],
  hotel: ['Hotel', 'Hotel'],
  industrial: ['Industrial building', 'Industriebau'],
  school: ['School', 'Schule'],
  education: ['Education building', 'Bildungsbau'],
  university: ['University building', 'Universitätsgebäude'],
  kindergarten: ['Kindergarten', 'Kita'],
  hospital: ['Hospital', 'Krankenhaus'],
  community_centre: ['Community centre', 'Gemeinschaftszentrum'],
  parking: ['Car park', 'Parkhaus / Parkplatz'],
  memorial: ['Memorial', 'Denkmal'],
  reservoir: ['Reservoir / basin', 'Becken'],
  building: ['Building', 'Gebäude'],
  site: ['Construction site', 'Baustelle'],
  road: ['Road construction', 'Straßenbau'],
  road_primary: ['Main road construction', 'Bau Hauptstraße'],
  road_secondary: ['Road construction', 'Straßenbau'],
  road_tertiary: ['Road construction', 'Straßenbau'],
  road_residential: ['Residential street construction', 'Bau Wohnstraße'],
  road_unclassified: ['Road construction', 'Straßenbau'],
  road_service: ['Access road construction', 'Bau Zufahrt'],
  road_living_street: ['Traffic-calmed street', 'Verkehrsberuhigter Bereich'],
  motorway: ['Motorway construction (A100 etc.)', 'Autobahnbau'],
  motorway_link: ['Motorway ramp construction', 'Bau Autobahnrampe'],
  primary_link: ['Road ramp construction', 'Bau Zufahrtsrampe'],
  footway: ['Footpath construction', 'Gehwegbau'],
  path: ['Path construction', 'Wegebau'],
  pedestrian: ['Pedestrian zone', 'Fußgängerzone'],
  steps: ['Steps', 'Treppe'],
  cycleway: ['Cycle path construction', 'Radwegbau'],
  rail: ['Railway construction', 'Bahnbau'],
  railway: ['Railway construction', 'Bahnbau'],
  light_rail: ['S-Bahn construction', 'S-Bahn-Bau'],
  subway: ['U-Bahn construction', 'U-Bahn-Bau'],
  tram: ['Tram line construction', 'Straßenbahnbau'],
};

export function projectTypeLabel(type) {
  const entry = PROJECT_TYPES[type];
  return entry ? entry[lang === 'de' ? 1 : 0] : null;
}
