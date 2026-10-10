/* global L */
import { BERLIN_CENTER, DEFAULT_RADIUS_M, RADIUS_OPTIONS_M } from './config.js';
import { fetchVizFeeds, fetchPlanbNear } from './sources.js';
import { anchorOf, distanceToGeometryM } from './geo.js';
import { t, getLang, setLang, locale } from './i18n.js';
import { translateText, translateLocation, translateTerm } from './translate-de-en.js';

const COLORS = { closure: '#d7263d', partial: '#f46036', works: '#e2a600', other: '#7b4fb3' };
const CATEGORY_KEY = { closure: 'catClosure', partial: 'catPartial', works: 'catWorks', other: 'catOther' };
const SOURCE_LABEL = {
  viz: 'VIZ Verkehrsredaktion',
  tic: 'VIZ Landesmeldestelle',
  planb: 'Planbare Ereignisse (GDI Berlin)',
};

const state = {
  origin: [BERLIN_CENTER[1], BERLIN_CENTER[0]], // [lng, lat]
  originKey: 'originCentre',
  radius: DEFAULT_RADIUS_M,
  vizItems: [],
  planbItems: [],
  planbKey: null,
  layers: new Map(),
  status: null, // { key, vars, kind }
};

const $ = (sel) => document.querySelector(sel);
const els = {
  locate: $('#locate'),
  radius: $('#radius'),
  langButtons: document.querySelectorAll('[data-lang]'),
  showPlanb: $('#show-planb'),
  showParking: $('#show-parking'),
  showEnded: $('#show-ended'),
  status: $('#status'),
  list: $('#list'),
  summary: $('#summary'),
};

// ---------- map ----------
const map = L.map('map', { zoomControl: true }).setView(BERLIN_CENTER, 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Data: <a href="https://viz.berlin.de">VIZ Berlin</a>, <a href="https://gdi.berlin.de">GDI Berlin</a> (dl-de/by-2-0)',
}).addTo(map);
const resultsLayer = L.layerGroup().addTo(map);
const originMarker = L.circleMarker([0, 0], {
  radius: 8, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1,
}).addTo(map);
const radiusCircle = L.circle([0, 0], {
  radius: state.radius, color: '#1a73e8', weight: 1, fillOpacity: 0.04, interactive: false,
}).addTo(map);

map.on('click', (e) => {
  if (state.status?.kind !== 'error') setStatus(null);
  setOrigin([e.latlng.lng, e.latlng.lat], 'originPicked');
});

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const isEn = () => getLang() === 'en';

// Display text for a data field in the current language. In English, falls
// back to the German original when the translator doesn't cover it.
const memo = new Map();
function localized(kind, text) {
  if (!text || !isEn()) return text;
  const key = `${kind}\u0000${text}`;
  if (!memo.has(key)) {
    const fn = { text: translateText, location: translateLocation, term: translateTerm }[kind];
    memo.set(key, fn(text) ?? text);
  }
  return memo.get(key);
}

// A short label, with the German original as a muted hint in English mode.
function termHtml(term) {
  if (!term) return '';
  const shown = localized('term', term);
  return shown !== term ? `${esc(shown)} <span class="gloss">(${esc(term)})</span>` : esc(term);
}

function fmtDate(d) {
  if (!d) return t('unknown');
  const dateOnly = d.getHours() === 0 && d.getMinutes() === 0;
  return new Intl.DateTimeFormat(locale(), {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(d);
}

function fmtDistance(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(m / 1000)} km`;
}

function statusOf(item, now = new Date()) {
  if (item.start && item.start > now) return 'upcoming';
  if (item.end && item.end < now) return 'ended';
  return 'active';
}

// Whole calendar days from `now` to `date` (0 = today, 1 = tomorrow).
function daysUntil(date, now) {
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((midnight(date) - midnight(now)) / 86400000);
}

function timeHint(item, now = new Date()) {
  const s = statusOf(item, now);
  if (s === 'ended') return t('ended');
  if (s === 'upcoming') {
    const n = daysUntil(item.start, now);
    return n === 0 ? t('startsToday') : n === 1 ? t('startsTomorrow') : t('startsIn', { n });
  }
  if (!item.end) return t('noEnd');
  const n = daysUntil(item.end, now);
  return n === 0 ? t('endsToday') : n === 1 ? t('endsTomorrow') : t('daysLeft', { n });
}

function popupHtml(item) {
  const reason = localized('text', item.reason);
  const section = localized('location', item.section);
  const meta = [];
  if (item.restriction) meta.push([t('restriction'), termHtml(item.restriction)]);
  if (item.lanes) meta.push([t('lanes'), esc(t('lanesClosed', item.lanes))]);
  if (item.direction) meta.push([t('direction'), termHtml(item.direction)]);
  meta.push([t('start'), esc(fmtDate(item.start))]);
  meta.push([t('plannedEnd'), `${esc(fmtDate(item.end))} <span class="gloss">· ${esc(timeHint(item))}</span>`]);
  // In English, keep the original German visible: it's what's on the street signs.
  const originals = [item.section !== section && item.section, item.reason !== reason && item.reason].filter(Boolean);
  return `
    <div class="popup">
      <div class="badge" style="background:${COLORS[item.category]}">${termHtml(item.kind) || esc(t(CATEGORY_KEY[item.category]))}</div>
      <h3>${esc(localized('location', item.street))}</h3>
      ${section ? `<div class="section">${esc(section)}</div>` : ''}
      ${reason ? `<p class="reason">${esc(reason)}</p>` : ''}
      <dl>${meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>
      ${originals.length ? `<details class="original"><summary>${esc(t('original'))}</summary>${originals.map((o) => `<p>${esc(o)}</p>`).join('')}</details>` : ''}
      <div class="source">${esc(t('source'))}: ${SOURCE_LABEL[item.source]}${
        item.updated ? ` · ${esc(t('updated', { date: fmtDate(new Date(item.updated.toDateString())) }))}` : ''
      }</div>
    </div>`;
}

function setStatus(key, vars = {}, kind = 'info') {
  state.status = key ? { key, vars, kind } : null;
  renderStatus();
}

function renderStatus() {
  const s = state.status;
  els.status.hidden = !s;
  if (!s) return;
  els.status.textContent = t(s.key, s.vars);
  els.status.dataset.kind = s.kind;
}

// Static text in index.html, marked with data-i18n / data-i18n-aria.
function renderStaticText() {
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  els.langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  const selected = state.radius;
  els.radius.innerHTML = RADIUS_OPTIONS_M.map(
    (r) => `<option value="${r}" ${r === selected ? 'selected' : ''}>${fmtDistance(r)}</option>`,
  ).join('');
  document.title = `${t('title')} · Berlin`;
}

// ---------- core ----------
function visibleItems() {
  const now = new Date();
  const pool = [...state.vizItems, ...(els.showPlanb.checked ? state.planbItems : [])];
  return pool
    .filter((i) => els.showEnded.checked || statusOf(i, now) !== 'ended')
    .filter((i) => els.showParking.checked || i.restriction !== 'Haltverbote')
    .map((i) => ({ ...i, distance: distanceToGeometryM(state.origin, i.geometry) }))
    .filter((i) => i.distance <= state.radius)
    .sort((a, b) => a.distance - b.distance);
}

function pinStyle(color) {
  return { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 };
}

function render() {
  const [lng, lat] = state.origin;
  originMarker.setLatLng([lat, lng]);
  radiusCircle.setLatLng([lat, lng]).setRadius(state.radius);
  resultsLayer.clearLayers();
  state.layers.clear();

  const items = visibleItems();
  for (const item of items) {
    const color = COLORS[item.category];
    const group = L.featureGroup();
    L.geoJSON(item.geometry, {
      style: { color, weight: 5, opacity: 0.8, fillOpacity: 0.25 },
      pointToLayer: (_f, latlng) => L.circleMarker(latlng, pinStyle(color)),
    }).addTo(group);
    const hasPoint =
      item.geometry.type === 'Point' ||
      (item.geometry.type === 'GeometryCollection' && item.geometry.geometries.some((g) => g.type === 'Point'));
    if (!hasPoint) {
      const [aLng, aLat] = anchorOf(item.geometry);
      L.circleMarker([aLat, aLng], pinStyle(color)).addTo(group);
    }
    group.bindPopup(() => popupHtml(item), { maxWidth: 320 });
    group.addTo(resultsLayer);
    state.layers.set(item.id, group);
  }

  els.summary.textContent = t('summary', { label: t(state.originKey), n: items.length, r: fmtDistance(state.radius) });
  els.list.innerHTML = items.length
    ? items
        .map((i) => {
          const section = localized('location', i.section);
          const detail = i.reason ? localized('text', i.reason) : i.restriction ? localized('term', i.restriction) : localized('term', i.kind);
          return `
      <li data-id="${esc(i.id)}" tabindex="0">
        <span class="dot" style="background:${COLORS[i.category]}"></span>
        <div class="body">
          <div class="title">${esc(localized('location', i.street))}</div>
          ${section ? `<div class="sub">${esc(section)}</div>` : ''}
          <div class="sub">${esc(detail)}</div>
          <div class="meta">${fmtDistance(i.distance)} · ${esc(fmtDate(i.start))} → ${esc(fmtDate(i.end))} · <span class="st-${statusOf(i)}">${esc(timeHint(i))}</span></div>
        </div>
      </li>`;
        })
        .join('')
    : `<li class="empty">${esc(t('empty'))}</li>`;
}

async function refreshPlanb() {
  if (!els.showPlanb.checked) return;
  const key = `${state.origin.join(',')}|${state.radius}`;
  if (key === state.planbKey) return;
  state.planbKey = key;
  try {
    const items = await fetchPlanbNear(state.origin, state.radius);
    if (key === state.planbKey) state.planbItems = items;
  } catch (err) {
    console.error(err);
    state.planbItems = [];
    setStatus('planbFailed', {}, 'warn');
  }
}

async function setOrigin(lngLat, originKey) {
  state.origin = lngLat;
  state.originKey = originKey;
  render(); // show VIZ results immediately, permits follow
  await refreshPlanb();
  render();
}

function locate() {
  if (!navigator.geolocation) {
    setStatus('geoUnavailable', {}, 'warn');
    return;
  }
  setStatus('locating');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setStatus(null);
      const lngLat = [pos.coords.longitude, pos.coords.latitude];
      map.setView([lngLat[1], lngLat[0]], 16);
      setOrigin(lngLat, 'originYou');
    },
    (err) => setStatus('geoFailed', { msg: err.message }, 'warn'),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function switchLang(next) {
  if (next === getLang()) return;
  setLang(next);
  map.closePopup();
  renderStaticText();
  renderStatus();
  render();
}

// ---------- wiring ----------
els.radius.addEventListener('change', async () => {
  state.radius = Number(els.radius.value);
  render();
  await refreshPlanb();
  render();
});
els.showPlanb.addEventListener('change', async () => {
  els.showParking.disabled = !els.showPlanb.checked;
  render();
  await refreshPlanb();
  render();
});
els.showParking.addEventListener('change', render);
els.showEnded.addEventListener('change', render);
els.locate.addEventListener('click', locate);
els.langButtons.forEach((b) => b.addEventListener('click', () => switchLang(b.dataset.lang)));

function openFromList(e) {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const layer = state.layers.get(li.dataset.id);
  if (!layer) return;
  map.fitBounds(layer.getBounds(), { maxZoom: 17, padding: [40, 40] });
  layer.openPopup(layer.getBounds().getCenter());
  document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
els.list.addEventListener('click', openFromList);
els.list.addEventListener('keydown', (e) => e.key === 'Enter' && openFromList(e));

// ---------- boot ----------
(async () => {
  setLang(getLang()); // sync <html lang>
  renderStaticText();
  setStatus('loading');
  render();
  try {
    const { items, errors } = await fetchVizFeeds();
    state.vizItems = items;
    setStatus(errors.length ? 'vizPartial' : null, {}, 'warn');
  } catch (err) {
    console.error(err);
    setStatus('vizFailed', { msg: err.message }, 'error');
  }
  await refreshPlanb();
  render();
  locate();
})();
