// Fetching + normalising the three Berlin data sources into one item shape:
//
// {
//   id, source: 'viz' | 'tic' | 'planb',
//   kind,          // source's own type label, e.g. "Baustelle", "Sperrung", "Arbeitsstelle"
//   category,      // 'closure' | 'partial' | 'works' | 'other' (used for pin colour)
//   street, section,
//   reason,        // free-text description / reason, if the source has one
//   restriction,   // e.g. "Vollsperrung", "Fahrstreifen-Reduzierung"
//   lanes,         // { closed, total } or null
//   direction, start, end (Date | null), updated (Date | null),
//   geometry,      // GeoJSON geometry, WGS84
// }
//
// The normalise* functions are pure so they can be unit-tested and reused by a
// future server-side cache job.

import { SOURCES } from './config.js';
import { bboxAround, allPositions } from './geo.js';

// Accepts "2026-10-28T17:00", "28.10.2026 17:00", "28.10.2026" (+ optional
// separate time "07:00"). Times without offset are Berlin local time.
export function parseDate(value, time) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (m) {
    const [, d, mo, y, hh, mm] = m;
    let h = hh, mi = mm;
    const t = time && String(time).match(/^(\d{1,2}):(\d{2})/);
    if (!h && t) [, h, mi] = t;
    return new Date(+y, +mo - 1, +d, +(h ?? 0), +(mi ?? 0));
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (m) {
    const [, y, mo, d, h, mi] = m;
    return new Date(+y, +mo - 1, +d, +(h ?? 0), +(mi ?? 0));
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function categorize({ kind = '', restriction = '', reason = '' }) {
  // Drop negations like "keine Sperrung" / "keine Fahrbahn-Einschränkung" first.
  const text = `${kind} ${restriction} ${reason}`.toLowerCase().replace(/keine [\wäöüß-]+/g, '');
  if (/vollsperrung|vollständig gesperrt|beider fahrbahnen/.test(text)) return 'closure';
  if (/fahrtrichtung|fahrstreifen|verengt|einengung|reduzierung|verschwenkung|gegenverkehr|gehwegvollsperrung/.test(text))
    return 'partial';
  if (/sperrung|gesperrt/.test(text)) return 'closure';
  if (/baustelle|bauarbeit|arbeitsstelle/.test(text)) return 'works';
  return 'other';
}

const stripBerlin = (s) => (s ?? '').replace(/^Berlin,\s*/, '').trim();

export function normalizeViz(feature) {
  const p = feature.properties;
  const item = {
    id: `viz:${p.id}`,
    source: 'viz',
    lmsId: p.lms_id ?? null,
    kind: p.subtype ?? '',
    street: p.street ?? '',
    section: p.section ?? '',
    reason: p.content ?? '',
    restriction: p.severity ?? '',
    lanes: Number.isFinite(p.total_lanes) ? { closed: p.closed_lanes, total: p.total_lanes } : null,
    direction: p.direction ?? '',
    start: parseDate(p.validity?.from),
    end: parseDate(p.validity?.to),
    updated: p.tstore ? new Date(p.tstore) : null,
    geometry: feature.geometry,
  };
  item.category = categorize(item);
  return item;
}

export function normalizeTic(feature) {
  const p = feature.properties;
  const street = stripBerlin(p.street);
  const section = stripBerlin(p.section);
  const item = {
    id: `tic:${p.id}`,
    source: 'tic',
    kind: p.subtype ?? '',
    street,
    section: section === street ? '' : section,
    reason: p.content ?? '',
    restriction: p.severity ?? '',
    lanes: null,
    direction: p.direction ?? '',
    start: parseDate(p.validity?.from),
    end: parseDate(p.validity?.to),
    updated: p.tstore ? new Date(p.tstore) : null,
    geometry: feature.geometry,
  };
  item.category = categorize(item);
  return item;
}

export function normalizePlanb(feature) {
  const p = feature.properties;
  let section = '';
  if (p.von_str && p.bis_str) section = `zwischen ${p.von_str} und ${p.bis_str}`;
  else if (p.von_str) section = `Höhe ${p.von_str}`;
  if (p.von_hausnr) {
    // House numbers sometimes contain street names in the source data.
    const range = `${p.von_hausnr}${p.bis_hausnr && p.bis_hausnr !== p.von_hausnr ? `–${p.bis_hausnr}` : ''}`;
    section += `${section ? ', ' : ''}${/^\d/.test(p.von_hausnr) ? `Nr. ${range}` : range}`;
  }
  const district = [p.ortsteil, p.bezirk].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const item = {
    id: `planb:${feature.id ?? p.importid}`,
    source: 'planb',
    kind: p.ereignis ?? '',
    street: [p.strasse, district && `(${district})`].filter(Boolean).join(' '),
    section,
    reason: '', // this dataset carries no free-text reason
    restriction: p.einschr ?? '',
    lanes: null,
    direction: '',
    // tat_* = actual dates, when reported; dat_* = permitted/planned dates.
    start: parseDate(p.tat_beg, p.tat_beg_uhr) ?? parseDate(p.dat_beginn, p.uhr_beginn),
    end: parseDate(p.tat_ende, p.tat_end_uhr) ?? parseDate(p.dat_ende, p.uhr_ende),
    updated: null,
    geometry: feature.geometry,
  };
  item.category = categorize(item);
  return item;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// Both VIZ feeds, merged. The Verkehrsredaktion feed is a richer subset of the
// Landesmeldestelle feed, linked via `lms_id`, so TIC records that already have
// a VIZ counterpart are dropped.
export async function fetchVizFeeds() {
  const [viz, tic] = await Promise.allSettled([getJson(SOURCES.viz), getJson(SOURCES.tic)]);
  const errors = [viz, tic].filter((r) => r.status === 'rejected').map((r) => r.reason);
  const vizItems = viz.status === 'fulfilled' ? viz.value.features.filter((f) => f.geometry).map(normalizeViz) : [];
  const ticItems = tic.status === 'fulfilled' ? tic.value.features.filter((f) => f.geometry).map(normalizeTic) : [];
  const covered = new Set(vizItems.map((i) => i.lmsId).filter(Boolean).map((id) => `tic:${id}`));
  const items = [...vizItems, ...ticItems.filter((i) => !covered.has(i.id))];
  if (!items.length && errors.length) throw errors[0];
  return { items, errors };
}

// Planned works around a point, queried by bounding box (the full layer is ~8k
// polygons, too heavy to load at once).
export async function fetchPlanbNear(lngLat, radiusM) {
  const [minLat, minLng, maxLat, maxLng] = bboxAround(lngLat, radiusM);
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: 'planb_ereignisse:ereignisse',
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    count: '2000',
    // WFS 2.0 + urn CRS => lat/lng axis order.
    bbox: `${minLat},${minLng},${maxLat},${maxLng},urn:ogc:def:crs:EPSG::4326`,
  });
  const data = await getJson(`${SOURCES.planbWfs}?${params}`);
  return data.features.filter((f) => f.geometry).map(normalizePlanb);
}

// ---------- "what's being built" projects ----------
//
// Project shape:
// {
//   id, source: 'osm' | 'cycle',
//   title,        // name, or null when the source has none
//   type,         // machine key, e.g. 'residential', 'primary', 'subway', or the
//                 // German infraVelo measure type ('Radfahrstreifen', …)
//   description,  // free text (German), may be ''
//   builder,      // developer / operator / client
//   status,       // infraVelo status ('In Bau', 'In Planung', 'Vorgesehen') or ''
//   start, end,   // free-form strings ('2. Quartal 2027', '2026-09-30') or ''
//   website, osmUrl, geometry,
// }

// Overpass `out geom` element → GeoJSON geometry.
export function osmGeometry(el) {
  if (el.type === 'node') return { type: 'Point', coordinates: [el.lon, el.lat] };
  if (el.type === 'way' && el.geometry) {
    const coords = el.geometry.map((p) => [p.lon, p.lat]);
    const closed = coords.length > 3 && coords[0][0] === coords.at(-1)[0] && coords[0][1] === coords.at(-1)[1];
    const isArea = closed && !el.tags?.highway && !el.tags?.railway;
    return isArea ? { type: 'Polygon', coordinates: [coords] } : { type: 'LineString', coordinates: coords };
  }
  if (el.type === 'relation' && el.members) {
    const outers = el.members
      .filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry)
      .map((m) => m.geometry.map((p) => [p.lon, p.lat]));
    const closed = outers.filter((c) => c.length > 3 && c[0][0] === c.at(-1)[0] && c[0][1] === c.at(-1)[1]);
    if (closed.length) return { type: 'MultiPolygon', coordinates: closed.map((c) => [c]) };
    if (outers.length) return { type: 'MultiLineString', coordinates: outers };
  }
  if (el.center) return { type: 'Point', coordinates: [el.center.lon, el.center.lat] };
  return null;
}

export function normalizeOsm(el) {
  const tg = el.tags ?? {};
  const kind = ['highway', 'railway', 'building', 'landuse'].find((k) => tg[k] === 'construction') ?? 'landuse';
  // construction=* says what it will become; fall back to the main tag family.
  let type = tg.construction && tg.construction !== 'yes' ? tg.construction : { highway: 'road', railway: 'rail', building: 'building', landuse: 'site' }[kind];
  if (kind === 'highway' && ['primary', 'secondary', 'tertiary', 'residential', 'service', 'unclassified', 'living_street'].includes(type)) type = `road_${type}`;
  return {
    id: `osm:${el.type}/${el.id}`,
    source: 'osm',
    title: tg.name ?? tg['construction:name'] ?? null,
    type,
    description: [tg.description, tg.note].filter(Boolean).join(' · '),
    builder: tg.developer ?? tg.operator ?? '',
    status: '',
    start: tg.start_date ?? '',
    end: tg.opening_date ?? '',
    website: tg.website ?? tg['contact:website'] ?? tg.url ?? '',
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    updated: el.timestamp ? new Date(el.timestamp) : null,
    geometry: osmGeometry(el),
  };
}

// Generic OSM construction types that say nothing about what is being built.
const VAGUE_OSM_TYPES = new Set(['site', 'building', 'footway', 'path', 'steps', 'service', 'road', 'road_service', 'track', 'parking']);

// Whether a project tells the viewer something beyond "there is a site here".
export function isInformative(project) {
  if (project.source !== 'osm') return true;
  return Boolean(project.title || project.description || project.builder || project.website || !VAGUE_OSM_TYPES.has(project.type));
}

export function normalizeCycle(feature) {
  const p = feature.properties;
  const types = [1, 2, 3, 4, 5].map((i) => p[`massnahmen_typ${i}`]).filter(Boolean);
  return {
    id: `cycle:${p.projektnummer ?? feature.id}`,
    source: 'cycle',
    title: (p.strassenname ?? '').split('_').filter(Boolean).join(' / ') || null,
    type: types[0] ?? 'Radverkehrsanlage',
    types,
    description: (p.projektbeschreibung_lang ?? '').trim(),
    builder: p.bauherr ?? '',
    status: p.status ?? '',
    start: p.baustart ?? '',
    end: p.bauende ?? '',
    website: '',
    osmUrl: '',
    updated: null,
    geometry: feature.geometry,
  };
}

async function fetchOsmProjects([minLat, minLng, maxLat, maxLng]) {
  const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
  const query = `[out:json][timeout:25];
(
  nwr["landuse"="construction"](${bbox});
  nwr["building"="construction"](${bbox});
  nwr["highway"="construction"](${bbox});
  nwr["railway"="construction"](${bbox});
);
out geom meta;`;
  let res;
  for (const url of [SOURCES.overpass, SOURCES.overpassMirror]) {
    res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: query }) }).catch(() => null);
    if (res?.ok) break;
  }
  if (!res?.ok) throw new Error(`${res?.status ?? 'network error'} for Overpass`);
  const data = await res.json();
  return data.elements.map(normalizeOsm).filter((p) => p.geometry && isInformative(p));
}

async function fetchCycleProjects([minLat, minLng, maxLat, maxLng]) {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: 'radverkehrsmassnahmen:radverkehrsmassnahmen',
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox: `${minLat},${minLng},${maxLat},${maxLng},urn:ogc:def:crs:EPSG::4326`,
  });
  const data = await getJson(`${SOURCES.cycleWfs}?${params}`);
  return data.features
    .filter((f) => f.geometry && f.properties.status !== 'Abgeschlossen')
    .map(normalizeCycle);
}

// Daily snapshot written by scripts/fetch-projects.mjs. Loaded once; null if
// it doesn't exist (e.g. local dev without `npm run fetch-data`).
let snapshot;
async function loadSnapshot() {
  if (snapshot === undefined) {
    snapshot = fetch(SOURCES.projectsSnapshot)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && { ...data, items: data.items.map((p) => ({ ...p, updated: p.updated ? new Date(p.updated) : null })) })
      .catch(() => null);
  }
  return snapshot;
}

const inBbox = ([minLat, minLng, maxLat, maxLng]) => (p) =>
  allPositions(p.geometry).some(([lng, lat]) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng);

// Projects around a point, with a margin so closures at the edge of the
// radius can still be matched to a project just outside it. Uses the daily
// snapshot when available, otherwise queries Overpass + WFS live.
export async function fetchProjectsNear(lngLat, radiusM) {
  const bbox = bboxAround(lngLat, radiusM + 150);
  const snap = await loadSnapshot();
  if (snap) return { items: snap.items.filter(inBbox(bbox)), errors: [], generated: snap.generated };
  const results = await Promise.allSettled([fetchOsmProjects(bbox), fetchCycleProjects(bbox)]);
  const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
  const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  if (!items.length && errors.length === results.length) throw errors[0];
  return { items, errors };
}
