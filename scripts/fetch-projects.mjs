// Builds data/projects.json: every "what's being built" project in Berlin
// (OpenStreetMap construction sites + active infraVelo cycle projects),
// normalised with the same code the browser uses. Run daily (see
// .github/workflows/pages.yml) or locally: `npm run fetch-data`.
import { mkdir, writeFile } from 'node:fs/promises';
import { SOURCES } from '../js/config.js';
import { normalizeOsm, normalizeCycle, isInformative } from '../js/sources.js';

const UA = 'berlin-baustellen-map/0.1 (+https://github.com/amgraber/berlin-baustellen-map)';
const OVERPASS_MIRRORS = [SOURCES.overpass, 'https://overpass.kumi.systems/api/interpreter'];

const OSM_QUERY = `[out:json][timeout:180];
area["name"="Berlin"]["admin_level"="4"]->.berlin;
(
  nwr["landuse"="construction"](area.berlin);
  nwr["building"="construction"](area.berlin);
  nwr["highway"="construction"](area.berlin);
  nwr["railway"="construction"](area.berlin);
);
out geom meta;`;

async function fetchOsm() {
  let lastError;
  for (const url of OVERPASS_MIRRORS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'User-Agent': UA, Accept: 'application/json' },
          body: new URLSearchParams({ data: OSM_QUERY }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);
        const data = await res.json();
        return data.elements.map(normalizeOsm).filter((p) => p.geometry && isInformative(p));
      } catch (err) {
        lastError = err;
        console.warn(`Overpass attempt ${attempt} via ${url} failed: ${err.message}`);
        await new Promise((r) => setTimeout(r, 10000 * attempt));
      }
    }
  }
  throw lastError;
}

async function fetchCycle() {
  const params = new URLSearchParams({
    service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeNames: 'radverkehrsmassnahmen:radverkehrsmassnahmen',
    outputFormat: 'application/json', srsName: 'EPSG:4326',
  });
  const res = await fetch(`${SOURCES.cycleWfs}?${params}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from cycle WFS`);
  const data = await res.json();
  return data.features.filter((f) => f.geometry && f.properties.status !== 'Abgeschlossen').map(normalizeCycle);
}

// Round coordinates to ~1 m to keep the file small.
const round = (v) => (Array.isArray(v) ? v.map(round) : typeof v === 'number' ? Math.round(v * 1e5) / 1e5 : v);
const slim = (p) => ({ ...p, geometry: { ...p.geometry, coordinates: round(p.geometry.coordinates) } });

const [osm, cycle] = await Promise.all([fetchOsm(), fetchCycle()]);
const out = { generated: new Date().toISOString(), counts: { osm: osm.length, cycle: cycle.length }, items: [...osm, ...cycle].map(slim) };
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/projects.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote data/projects.json: ${osm.length} OSM + ${cycle.length} cycle projects`);
