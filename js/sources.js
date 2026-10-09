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
import { bboxAround } from './geo.js';

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
  if (p.von_hausnr) section += `${section ? ', ' : ''}Nr. ${p.von_hausnr}${p.bis_hausnr ? `–${p.bis_hausnr}` : ''}`;
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
