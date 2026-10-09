/* global L */
import { BERLIN_CENTER, DEFAULT_RADIUS_M, RADIUS_OPTIONS_M } from './config.js';
import { fetchVizFeeds, fetchPlanbNear } from './sources.js';
import { anchorOf, distanceToGeometryM } from './geo.js';

const COLORS = { closure: '#d7263d', partial: '#f46036', works: '#e2a600', other: '#7b4fb3' };
const CATEGORY_LABEL = { closure: 'Closure', partial: 'Lane restriction', works: 'Works', other: 'Other' };
const SOURCE_LABEL = {
  viz: 'VIZ Verkehrsredaktion',
  tic: 'VIZ Landesmeldestelle',
  planb: 'Planbare Ereignisse (GDI Berlin)',
};
// Short English hints for the most common German terms.
const GLOSS = {
  Vollsperrung: 'full closure',
  Fahrtrichtungssperrung: 'one direction closed',
  'keine Sperrung': 'no closure',
  Haltverbote: 'no-parking zone',
  'keine Fahrbahn-Einschränkung': 'no carriageway restriction',
  Fahrbahneinengung: 'carriageway narrowed',
  'Fahrstreifen-Reduzierung': 'fewer lanes',
  'Fahrstreifen-Verschwenkung': 'lanes shifted',
  Gehwegvollsperrung: 'sidewalk closed',
  'Vollsperrung beider Fahrbahnen': 'full closure, both directions',
  'Sperrung einer Fahrtrichtung': 'one direction closed',
  Gegenverkehrsregelung: 'alternating one-lane traffic',
  Baustelle: 'construction site',
  Bauarbeiten: 'construction work',
  Arbeitsstelle: 'work site',
  Sperrung: 'closure',
  Gefahr: 'hazard',
  Störung: 'disruption',
  Beidseitig: 'both directions',
};

const state = {
  origin: [BERLIN_CENTER[1], BERLIN_CENTER[0]], // [lng, lat]
  originLabel: 'Berlin centre',
  radius: DEFAULT_RADIUS_M,
  vizItems: [],
  planbItems: [],
  planbKey: null,
  layers: new Map(),
};

const $ = (sel) => document.querySelector(sel);
const els = {
  locate: $('#locate'),
  radius: $('#radius'),
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
  if (els.status.dataset.kind !== 'error') setStatus('');
  setOrigin([e.latlng.lng, e.latlng.lat], 'Picked point');
});

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const withGloss = (term) => (term && GLOSS[term] ? `${esc(term)} <span class="gloss">(${GLOSS[term]})</span>` : esc(term));

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
function fmtDate(d) {
  if (!d) return 'unknown';
  return d.getHours() === 0 && d.getMinutes() === 0 ? dateFmt.format(d) : dateTimeFmt.format(d);
}
const fmtDistance = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);

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
  if (s === 'ended') return 'ended';
  if (s === 'upcoming') {
    const d = daysUntil(item.start, now);
    return d === 0 ? 'starts today' : d === 1 ? 'starts tomorrow' : `starts in ${d} days`;
  }
  if (!item.end) return 'no end date';
  const d = daysUntil(item.end, now);
  return d === 0 ? 'ends today' : d === 1 ? 'ends tomorrow' : `${d} days left`;
}

function popupHtml(item) {
  const rows = [];
  if (item.reason) rows.push(`<p class="reason">${esc(item.reason)}</p>`);
  const meta = [];
  if (item.restriction) meta.push(['Restriction', withGloss(item.restriction)]);
  if (item.lanes) meta.push(['Lanes', `${item.lanes.closed} of ${item.lanes.total} closed`]);
  if (item.direction) meta.push(['Direction', withGloss(item.direction)]);
  meta.push(['Start', esc(fmtDate(item.start))]);
  meta.push(['Planned end', `${esc(fmtDate(item.end))} <span class="gloss">· ${timeHint(item)}</span>`]);
  return `
    <div class="popup">
      <div class="badge" style="background:${COLORS[item.category]}">${withGloss(item.kind) || CATEGORY_LABEL[item.category]}</div>
      <h3>${esc(item.street)}</h3>
      ${item.section ? `<div class="section">${esc(item.section)}</div>` : ''}
      ${rows.join('')}
      <dl>${meta.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
      <div class="source">Source: ${SOURCE_LABEL[item.source]}${
        item.updated ? ` · updated ${esc(dateFmt.format(item.updated))}` : ''
      }</div>
    </div>`;
}

function setStatus(msg, kind = 'info') {
  els.status.textContent = msg;
  els.status.dataset.kind = kind;
  els.status.hidden = !msg;
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
    group.bindPopup(popupHtml(item), { maxWidth: 320 });
    group.addTo(resultsLayer);
    state.layers.set(item.id, group);
  }

  els.summary.textContent = `${state.originLabel}: ${items.length} within ${fmtDistance(state.radius)}`;
  els.list.innerHTML = items.length
    ? items
        .map(
          (i) => `
      <li data-id="${esc(i.id)}" tabindex="0">
        <span class="dot" style="background:${COLORS[i.category]}"></span>
        <div class="body">
          <div class="title">${esc(i.street)}</div>
          ${i.section ? `<div class="sub">${esc(i.section)}</div>` : ''}
          <div class="sub">${esc(i.reason || i.restriction || i.kind)}</div>
          <div class="meta">${fmtDistance(i.distance)} · ${esc(fmtDate(i.start))} → ${esc(fmtDate(i.end))} · <span class="st-${statusOf(i)}">${timeHint(i)}</span></div>
        </div>
      </li>`,
        )
        .join('')
    : '<li class="empty">Nothing reported here. Try a larger radius or another spot.</li>';
}

function pinStyle(color) {
  return { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 };
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
    setStatus('Could not load the planned-works layer (GDI Berlin). Showing VIZ data only.', 'warn');
  }
}

async function setOrigin(lngLat, label) {
  state.origin = lngLat;
  state.originLabel = label;
  render(); // show VIZ results immediately, permits follow
  await refreshPlanb();
  render();
}

function locate() {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not available in this browser — tap the map to pick a point.', 'warn');
    return;
  }
  setStatus('Finding your location…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setStatus('');
      const lngLat = [pos.coords.longitude, pos.coords.latitude];
      map.setView([lngLat[1], lngLat[0]], 16);
      setOrigin(lngLat, 'Your location');
    },
    (err) => setStatus(`Couldn't get your location (${err.message}). Tap the map to pick a point.`, 'warn'),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

// ---------- wiring ----------
els.radius.innerHTML = RADIUS_OPTIONS_M.map(
  (r) => `<option value="${r}" ${r === state.radius ? 'selected' : ''}>${fmtDistance(r)}</option>`,
).join('');
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
  setStatus('Loading Berlin construction & closure data…');
  render();
  try {
    const { items, errors } = await fetchVizFeeds();
    state.vizItems = items;
    setStatus(errors.length ? 'One of the VIZ feeds failed to load; results may be incomplete.' : '', 'warn');
  } catch (err) {
    console.error(err);
    setStatus(`Could not load VIZ data: ${err.message}`, 'error');
  }
  await refreshPlanb();
  render();
  locate();
})();
