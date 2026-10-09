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
