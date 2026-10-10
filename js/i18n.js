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
