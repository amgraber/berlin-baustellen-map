/* global L */
import { BERLIN_CENTER, DEFAULT_RADIUS_M, RADIUS_OPTIONS_M, RELATED_PROJECT_MAX_M } from './config.js';
import { fetchVizFeeds, fetchPlanbNear, fetchProjectsNear } from './sources.js';
import { anchorOf, distanceToGeometryM, geometryDistanceM } from './geo.js';
import { t, getLang, setLang, locale, projectTypeLabel } from './i18n.js';
import { translateText, translateLocation, translateTerm } from './translate-de-en.js';

const COLORS = { closure: '#d7263d', partial: '#f46036', works: '#e2a600', other: '#7b4fb3', project: '#0b7a75' };
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
  projects: [],
  projectsKey: null,
  projectsLoaded: false,
  related: new Map(), // closure id → [{ project, distance }]
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
  showProjects: $('#show-projects'),
  status: $('#status'),
  list: $('#list'),
  summary: $('#summary'),
};

// ---------- map ----------
const map = L.map('map', { zoomControl: true }).setView(BERLIN_CENTER, 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Data: <a href="https://viz.berlin.de">VIZ Berlin</a>, <a href="https://gdi.berlin.de">GDI Berlin</a>, <a href="https://www.infravelo.de">infraVelo</a> (dl-de/by-2-0)',
}).addTo(map);
const projectsLayer = L.layerGroup().addTo(map);
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

// Link to machine-translate long German free text (only opened on click).
function translateLinkHtml(text) {
  if (!isEn() || !text) return '';
  const url = `https://translate.google.com/?sl=de&tl=en&op=translate&text=${encodeURIComponent(text.slice(0, 1500))}`;
  return ` <a class="translate" href="${esc(url)}" target="_blank" rel="noopener">${esc(t('translate'))} ↗</a>`;
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

// "2. Quartal 2027" → "Q2 2027" in English.
const fmtQuarter = (s) => (s && isEn() ? s.replace(/^(\d)\. Quartal (\d{4})$/, 'Q$1 $2') : s);

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

// ---------- projects ("what's being built") ----------
function projectTypeText(p) {
  if (p.source === 'cycle') return (p.types?.length ? p.types : [p.type]).map((x) => localized('term', x)).join(', ');
  return projectTypeLabel(p.type) ?? p.type;
}

const projectTitle = (p) => p.title ?? (projectTypeText(p) || t('projectUnnamed'));

function openingHtml(p) {
  if (!p.end) return '';
  const year = Number(String(p.end).slice(0, 4));
  if (p.source === 'osm' && year && year < new Date().getFullYear()) return esc(t('openingPast', { date: p.end }));
  return esc(fmtQuarter(p.end));
}

function projectPopupHtml(p) {
  const meta = [];
  meta.push([t('projectType'), esc(projectTypeText(p))]);
  if (p.builder) meta.push([t('builder'), esc(p.builder)]);
  if (p.status) meta.push([t('status'), termHtml(p.status)]);
  if (p.source === 'cycle' && (p.start || p.end)) meta.push([t('schedule'), `${esc(fmtQuarter(p.start) || '?')} → ${esc(fmtQuarter(p.end) || '?')}`]);
  if (p.source === 'osm' && p.end) meta.push([t('opening'), openingHtml(p)]);
  if (p.website) meta.push([t('website'), `<a href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40))}</a>`]);
  const description = p.description
    ? `<p class="reason">${esc(p.description)}${/[äöüß]|\b(der|die|und|wird)\b/i.test(p.description) ? translateLinkHtml(p.description) : ''}</p>`
    : '';
  const source =
    p.source === 'osm'
      ? `${esc(t('projectSourceOsm'))}${p.updated ? ` · ${esc(t('lastEdited', { date: fmtDate(new Date(p.updated.toDateString())) }))}` : ''} · <a href="${esc(p.osmUrl)}" target="_blank" rel="noopener">${esc(t('viewOnOsm'))}</a>`
      : esc(t('projectSourceCycle'));
  return `
    <div class="popup">
      <div class="badge" style="background:${COLORS.project}">${esc(t('legendProject'))}</div>
      <h3>${esc(projectTitle(p))}</h3>
      ${description}
      <dl>${meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>
      <div class="source">${source}</div>
    </div>`;
}

// Projects whose geometry is within RELATED_PROJECT_MAX_M of a closure.
function relatedProjects(item) {
  if (!state.related.has(item.id)) {
    const hits = state.projects
      .map((project) => ({ project, distance: geometryDistanceM(item.geometry, project.geometry) }))
      .filter((r) => r.distance <= RELATED_PROJECT_MAX_M)
      // Named / described projects first, then nearest.
      .sort((a, b) => !!b.project.title - !!a.project.title || a.distance - b.distance);
    state.related.set(item.id, hits);
  }
  return state.related.get(item.id);
}

// Closures caused by events/incidents: a nearby building site isn't the reason.
const EVENT_REASON = /veranstaltung|fußballspiel|demonstration|unfall|konzert|marathon|polizei|rettungs|stau\b/i;
const explainable = (item) => !EVENT_REASON.test(`${item.kind} ${item.reason}`);

function whyHtml(item) {
  if (!els.showProjects.checked || !state.projectsLoaded || !explainable(item)) return '';
  const hits = relatedProjects(item).slice(0, 3);
  if (!hits.length) return `<div class="why none"><strong>${esc(t('whyTitle'))}:</strong> ${esc(t('whyNone'))}</div>`;
  return `
    <div class="why">
      <strong>${esc(t('whyTitle'))}:</strong>
      <ul>${hits
        .map(
          ({ project: p }) =>
            `<li><a href="#" data-open="${esc(p.id)}">${esc(projectTitle(p))}</a> · ${esc(
              [p.title ? projectTypeText(p) : '', p.builder, p.status && localized('term', p.status)].filter(Boolean).join(' · '),
            )}</li>`,
        )
        .join('')}</ul>
    </div>`;
}

// ---------- closures ----------
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
      ${reason ? `<p class="reason">${esc(reason)}${reason === item.reason ? translateLinkHtml(item.reason) : ''}</p>` : ''}
      ${whyHtml(item)}
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

function visibleProjects() {
  if (!els.showProjects.checked) return [];
  return state.projects
    .map((p) => ({ ...p, distance: distanceToGeometryM(state.origin, p.geometry) }))
    .filter((p) => p.distance <= state.radius);
}

function pinStyle(color) {
  return { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 };
}

const hasPoint = (g) => g.type === 'Point' || (g.type === 'GeometryCollection' && g.geometries.some((x) => x.type === 'Point'));

function drawFeature(item, color, layer, popup, { dashed = false } = {}) {
  const group = L.featureGroup();
  L.geoJSON(item.geometry, {
    style: dashed
      ? { color, weight: 3, opacity: 0.9, dashArray: '6 5', fillOpacity: 0.08 }
      : { color, weight: 5, opacity: 0.8, fillOpacity: 0.25 },
    pointToLayer: (_f, latlng) => L.circleMarker(latlng, pinStyle(color)),
  }).addTo(group);
  if (!hasPoint(item.geometry)) {
    const [aLng, aLat] = anchorOf(item.geometry);
    L.circleMarker([aLat, aLng], pinStyle(color)).addTo(group);
  }
  group.bindPopup(popup, { maxWidth: 340 });
  group.addTo(layer);
  state.layers.set(item.id, group);
}

function listEntryHtml(entry) {
  if (entry.kind === 'project') {
    const p = entry.item;
    const sub = [p.title ? projectTypeText(p) : '', p.builder].filter(Boolean).join(' · ');
    const when = p.source === 'cycle' ? [localized('term', p.status), p.end && `→ ${fmtQuarter(p.end)}`].filter(Boolean).join(' ') : p.end ? `→ ${p.end}` : '';
    return `
      <li data-id="${esc(p.id)}" tabindex="0" class="project">
        <span class="dot square" style="background:${COLORS.project}"></span>
        <div class="body">
          <div class="title">${esc(projectTitle(p))}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
          <div class="meta">${fmtDistance(p.distance)} · ${esc(t('legendProject'))}${when ? ` · ${esc(when)}` : ''}</div>
        </div>
      </li>`;
  }
  const i = entry.item;
  const section = localized('location', i.section);
  const detail = i.reason ? localized('text', i.reason) : i.restriction ? localized('term', i.restriction) : localized('term', i.kind);
  const why = els.showProjects.checked && state.projectsLoaded && explainable(i) ? relatedProjects(i)[0]?.project : null;
  return `
    <li data-id="${esc(i.id)}" tabindex="0">
      <span class="dot" style="background:${COLORS[i.category]}"></span>
      <div class="body">
        <div class="title">${esc(localized('location', i.street))}</div>
        ${section ? `<div class="sub">${esc(section)}</div>` : ''}
        <div class="sub">${esc(detail)}</div>
        ${why ? `<div class="why-line">↳ ${esc(projectTitle(why))}${why.title ? ` · ${esc(projectTypeText(why))}` : ''}</div>` : ''}
        <div class="meta">${fmtDistance(i.distance)} · ${esc(fmtDate(i.start))} → ${esc(fmtDate(i.end))} · <span class="st-${statusOf(i)}">${esc(timeHint(i))}</span></div>
      </div>
    </li>`;
}

function render() {
  const [lng, lat] = state.origin;
  originMarker.setLatLng([lat, lng]);
  radiusCircle.setLatLng([lat, lng]).setRadius(state.radius);
  resultsLayer.clearLayers();
  projectsLayer.clearLayers();
  state.layers.clear();

  const projects = visibleProjects();
  for (const p of projects) drawFeature(p, COLORS.project, projectsLayer, () => projectPopupHtml(p), { dashed: true });
  const items = visibleItems();
  for (const item of items) drawFeature(item, COLORS[item.category], resultsLayer, () => popupHtml(item));

  const entries = [
    ...items.map((item) => ({ kind: 'closure', item, distance: item.distance })),
    ...projects.map((item) => ({ kind: 'project', item, distance: item.distance })),
  ].sort((a, b) => a.distance - b.distance);

  els.summary.textContent = t('summary', { label: t(state.originKey), n: items.length, r: fmtDistance(state.radius) });
  els.list.innerHTML = entries.length ? entries.map(listEntryHtml).join('') : `<li class="empty">${esc(t('empty'))}</li>`;
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

async function refreshProjects() {
  if (!els.showProjects.checked) return;
  const key = `${state.origin.join(',')}|${state.radius}`;
  if (key === state.projectsKey) return;
  state.projectsKey = key;
  try {
    const { items, errors } = await fetchProjectsNear(state.origin, state.radius);
    if (key !== state.projectsKey) return;
    state.projects = items;
    state.projectsLoaded = true;
    state.related.clear();
    if (errors.length) {
      console.warn(errors);
      setStatus('projectsFailed', {}, 'warn');
    }
  } catch (err) {
    console.error(err);
    state.projects = [];
    state.projectsLoaded = false;
    setStatus('projectsFailed', {}, 'warn');
  }
}

// Fetch the per-point layers in parallel, then redraw.
async function refreshNearby() {
  await Promise.all([refreshPlanb(), refreshProjects()]);
  render();
}

async function setOrigin(lngLat, originKey) {
  state.origin = lngLat;
  state.originKey = originKey;
  render(); // show VIZ results immediately, the other layers follow
  await refreshNearby();
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

function openItem(id) {
  const layer = state.layers.get(id);
  if (!layer) return;
  map.fitBounds(layer.getBounds(), { maxZoom: 17, padding: [40, 40] });
  layer.openPopup(layer.getBounds().getCenter());
}

// ---------- wiring ----------
els.radius.addEventListener('change', async () => {
  state.radius = Number(els.radius.value);
  render();
  await refreshNearby();
});
els.showPlanb.addEventListener('change', async () => {
  els.showParking.disabled = !els.showPlanb.checked;
  render();
  await refreshNearby();
});
els.showProjects.addEventListener('change', async () => {
  render();
  await refreshNearby();
});
els.showParking.addEventListener('change', render);
els.showEnded.addEventListener('change', render);
els.locate.addEventListener('click', locate);
els.langButtons.forEach((b) => b.addEventListener('click', () => switchLang(b.dataset.lang)));

function openFromList(e) {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  openItem(li.dataset.id);
  document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
els.list.addEventListener('click', openFromList);
els.list.addEventListener('keydown', (e) => e.key === 'Enter' && openFromList(e));
// "Why?" links inside popups jump to the related project.
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-open]');
  if (!link) return;
  e.preventDefault();
  openItem(link.dataset.open);
});

// ---------- boot ----------
(async () => {
  setLang(getLang()); // sync <html lang>
  renderStaticText();
  setStatus('loading');
  render();
  const nearby = refreshNearby();
  try {
    const { items, errors } = await fetchVizFeeds();
    state.vizItems = items;
    setStatus(errors.length ? 'vizPartial' : null, {}, 'warn');
  } catch (err) {
    console.error(err);
    setStatus('vizFailed', { msg: err.message }, 'error');
  }
  await nearby;
  render();
  locate();
})();
