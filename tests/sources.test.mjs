// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, categorize, normalizeViz, normalizeTic, normalizePlanb } from '../js/sources.js';
import { distanceToGeometryM, anchorOf, haversineM } from '../js/geo.js';

test('parseDate handles all source formats', () => {
  assert.deepEqual(parseDate('2026-10-28T17:00'), new Date(2026, 9, 28, 17, 0));
  assert.deepEqual(parseDate('18.12.2026 23:59'), new Date(2026, 11, 18, 23, 59));
  assert.deepEqual(parseDate('01.03.2022'), new Date(2022, 2, 1));
  assert.deepEqual(parseDate('01.03.2022', '07:30'), new Date(2022, 2, 1, 7, 30));
  assert.equal(parseDate(''), null);
  assert.equal(parseDate(null), null);
});

test('categorize maps German labels to pin categories', () => {
  assert.equal(categorize({ kind: 'Sperrung', restriction: 'Vollsperrung' }), 'closure');
  assert.equal(categorize({ kind: 'Sperrung', restriction: 'Fahrtrichtungssperrung' }), 'partial');
  assert.equal(categorize({ kind: 'Gefahr', reason: 'Fahrbahn auf einen Fahrstreifen verengt' }), 'partial');
  assert.equal(categorize({ kind: 'Sperrung', reason: 'gesperrt, Bauarbeiten' }), 'closure');
  assert.equal(categorize({ kind: 'Baustelle', restriction: 'keine Sperrung' }), 'works');
  assert.equal(categorize({ kind: 'Arbeitsstelle', restriction: 'Haltverbote' }), 'works');
  assert.equal(categorize({ kind: 'Störung' }), 'other');
});

const point = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

test('normalizeViz keeps lanes, ISO dates and lms_id', () => {
  const item = normalizeViz({
    type: 'Feature',
    properties: {
      id: '17/2025', lms_id: 'LMS-BR/1', subtype: 'Sperrung', severity: 'Vollsperrung',
      direction: 'Beidseitig', street: 'Schiffbauerdamm (Mitte)', section: 'zwischen A und B',
      total_lanes: 2, closed_lanes: 2, content: 'Leitungsbau',
      validity: { from: '2025-07-09T07:00', to: '2026-10-28T17:00' }, tstore: '2026-06-23T15:52:40Z',
    },
    geometry: { type: 'GeometryCollection', geometries: [point(13.38, 52.52)] },
  });
  assert.equal(item.id, 'viz:17/2025');
  assert.equal(item.lmsId, 'LMS-BR/1');
  assert.deepEqual(item.lanes, { closed: 2, total: 2 });
  assert.equal(item.category, 'closure');
  assert.deepEqual(item.end, new Date(2026, 9, 28, 17, 0));
});

test('normalizeTic strips "Berlin, " and dedupes section', () => {
  const item = normalizeTic({
    properties: {
      id: 'LMS-BR/2', subtype: 'Sperrung', severity: null,
      street: 'Berlin, Taubenstraße zwischen X und Y', section: 'Berlin, Taubenstraße zwischen X und Y',
      content: 'gesperrt, Bauarbeiten', validity: { from: '05.10.2026 07:00', to: '' },
    },
    geometry: point(13.39, 52.51),
  });
  assert.equal(item.street, 'Taubenstraße zwischen X und Y');
  assert.equal(item.section, '');
  assert.equal(item.end, null);
  assert.equal(item.category, 'closure');
});

test('normalizePlanb builds location text and prefers actual dates', () => {
  const item = normalizePlanb({
    id: 'ereignisse.1',
    properties: {
      strasse: 'Unter den Linden', bezirk: 'Mitte', ortsteil: 'Mitte', von_str: 'Charlottenstraße', bis_str: null,
      ereignis: 'Arbeitsstelle', einschr: 'Fahrstreifen-Reduzierung',
      dat_beginn: '01.03.2022', dat_ende: '19.12.2026', tat_beg: '05.03.2022', tat_ende: null,
    },
    geometry: { type: 'MultiPolygon', coordinates: [[[[13.39, 52.51], [13.4, 52.51], [13.4, 52.52], [13.39, 52.51]]]] },
  });
  assert.equal(item.street, 'Unter den Linden (Mitte)');
  assert.equal(item.section, 'Höhe Charlottenstraße');
  assert.deepEqual(item.start, new Date(2022, 2, 5));
  assert.deepEqual(item.end, new Date(2026, 11, 19));
  assert.equal(item.category, 'partial');
});

test('geo helpers', () => {
  // ~111 m per 0.001° latitude
  assert.ok(Math.abs(haversineM([13.4, 52.5], [13.4, 52.501]) - 111) < 1);
  const line = { type: 'LineString', coordinates: [[13.4, 52.5], [13.41, 52.5]] };
  assert.ok(distanceToGeometryM([13.41, 52.5], line) < 1);
  const [aLng, aLat] = anchorOf(line);
  assert.ok(Math.abs(aLng - 13.405) < 1e-9 && aLat === 52.5);
  assert.deepEqual(
    anchorOf({ type: 'GeometryCollection', geometries: [line, point(1, 2)] }),
    [1, 2],
  );
});

import { translateText, translateLocation, translateTerm } from '../js/translate-de-en.js';

test('translateText covers common VIZ phrases and falls back on unknown text', () => {
  assert.equal(
    translateText('Leitungsbau, Vollsperrung für Kfz-Verkehr. Im Anschluss folgen weitere Arbeiten'),
    'Utility line construction, fully closed to motor vehicles. Further works will follow',
  );
  assert.equal(translateText('Fahrbahn auf einen Fahrstreifen je Richtung verengt'), 'Carriageway narrowed to one lane in each direction');
  assert.equal(translateText('Das Linksabbiegen in den Mehringdamm ist nicht möglich'), 'No left turn into Mehringdamm');
  assert.equal(translateText('Vollsperrung für den Kfz-, Rad- und Fußverkehr'), 'Fully closed to vehicles, bikes and pedestrians');
  assert.equal(translateText('rechter Fahrstreifen gesperrt, vorübergehende Beschränkung des zulässigen Gesamtgewichts auf 2,8 t'), 'Right lane closed, temporary weight limit 2.8 t');
  assert.equal(translateText('Etwas völlig Unbekanntes, gesperrt'), null);
});

test('translateLocation translates connectors but keeps street names', () => {
  assert.equal(translateLocation('in beiden Richtungen zwischen Luisenstraße und Albrechtstraße'), 'in both directions between Luisenstraße and Albrechtstraße');
  assert.equal(translateLocation('Richtung Unter den Linden zwischen Französische Straße und Weidendammer Brücke'), 'towards Unter den Linden between Französische Straße and Weidendammer Brücke');
  assert.equal(translateLocation('Manfred-von-Richthofen-Straße (Tempelhof)'), 'Manfred-von-Richthofen-Straße (Tempelhof)');
  assert.equal(translateTerm('Vollsperrung'), 'Full closure');
});

import { geometryDistanceM } from '../js/geo.js';

test('geometryDistanceM: inside polygon, near a segment, far away', () => {
  const square = { type: 'Polygon', coordinates: [[[13.40, 52.50], [13.41, 52.50], [13.41, 52.51], [13.40, 52.51], [13.40, 52.50]]] };
  assert.equal(geometryDistanceM(point(13.405, 52.505), square), 0);
  // ~0.0003° lat ≈ 33 m south of the bottom edge, mid-segment (no vertex nearby)
  const d = geometryDistanceM(point(13.405, 52.4997), square);
  assert.ok(d > 30 && d < 37, `got ${d}`);
  assert.ok(geometryDistanceM(point(13.5, 52.6), square) > 5000);
});

import { normalizeOsm, normalizeCycle, isInformative, osmGeometry } from '../js/sources.js';

test('normalizeOsm: building site with developer, polygon geometry', () => {
  const p = normalizeOsm({
    type: 'way', id: 1, timestamp: '2026-05-01T10:00:00Z',
    tags: { building: 'construction', construction: 'residential', name: 'The Mind', operator: 'OTTO WULFF', website: 'https://x.de' },
    geometry: [{ lat: 52.5, lon: 13.4 }, { lat: 52.5, lon: 13.41 }, { lat: 52.51, lon: 13.41 }, { lat: 52.5, lon: 13.4 }],
  });
  assert.equal(p.title, 'The Mind');
  assert.equal(p.type, 'residential');
  assert.equal(p.builder, 'OTTO WULFF');
  assert.equal(p.geometry.type, 'Polygon');
  assert.equal(p.osmUrl, 'https://www.openstreetmap.org/way/1');
  assert.ok(isInformative(p));
});

test('normalizeOsm: roads stay lines; vague unnamed sites are not informative', () => {
  const road = normalizeOsm({ type: 'way', id: 2, tags: { highway: 'construction', construction: 'primary' }, geometry: [{ lat: 52.5, lon: 13.4 }, { lat: 52.5, lon: 13.41 }] });
  assert.equal(road.type, 'road_primary');
  assert.equal(road.geometry.type, 'LineString');
  assert.ok(isInformative(road));
  const vague = normalizeOsm({ type: 'node', id: 3, lat: 52.5, lon: 13.4, tags: { landuse: 'construction' } });
  assert.equal(vague.type, 'site');
  assert.equal(isInformative(vague), false);
  assert.equal(osmGeometry({ type: 'relation', id: 4, center: { lat: 1, lon: 2 } }).type, 'Point');
});

test('normalizeCycle: infraVelo project fields', () => {
  const p = normalizeCycle({
    properties: {
      projektnummer: '9010002', strassenname: 'Karl-Marx-Allee_Straußberger Platz', status: 'In Bau', bauherr: 'Bezirksamt Mitte',
      baustart: '2. Quartal 2026', bauende: '4. Quartal 2027', projektbeschreibung_lang: ' Geschützte Radfahrstreifen. ',
      massnahmen_typ1: 'Geschützter Radfahrstreifen', massnahmen_typ2: 'Fahrradstraße',
    },
    geometry: { type: 'MultiLineString', coordinates: [[[13.4, 52.5], [13.41, 52.5]]] },
  });
  assert.equal(p.title, 'Karl-Marx-Allee / Straußberger Platz');
  assert.deepEqual(p.types, ['Geschützter Radfahrstreifen', 'Fahrradstraße']);
  assert.equal(p.description, 'Geschützte Radfahrstreifen.');
  assert.equal(p.status, 'In Bau');
});
