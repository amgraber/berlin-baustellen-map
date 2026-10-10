# berlin-baustellen-map

*(working title, so rename freely)*

**What's being built here, why, and until when?** You stand somewhere in Berlin (or tap a spot on the map) and see nearby construction sites and road/lane closures from Berlin's official open data. Each one shows the reason for the work, the start date and the planned end date.

**Live demo:** https://amgraber.github.io/berlin-baustellen-map/

This is a prototype for testing the idea. It is a static site with no backend and no build step.

## Features

- Uses your location (browser geolocation), or you tap anywhere on the map to check that spot.
- Radius of 250 m to 2 km. Results are listed by distance and drawn on an OpenStreetMap/Leaflet map.
- Closures are drawn as lines or areas, not just pins, so you can see which stretch of road is affected.
- Tap a pin or list entry to see the reason/description, restriction type, lanes closed, direction, start, planned end, days remaining, and the data source.
- **"Why?"**: each closure is matched to construction projects within 40 m (named buildings, road/rail/U-Bahn projects from OpenStreetMap, and infraVelo cycle projects), e.g. *"Sidewalk closed → The Berlinian · office building · Commerz Real"*. Projects also have their own teal pins with the developer, description, schedule/opening date and website.
- **English by default, with an EN/DE toggle.** The German data is translated offline (no external service) by a phrase dictionary plus pattern rules (`js/translate-de-en.js`). It covers about 98% of the current VIZ texts; anything it can't translate stays in German, and the German original is always one tap away (it's what's on the street signs). Long German project descriptions get a "Translate ↗" link.
- Pin colours: 🔴 closure · 🟠 lane/partial restriction · 🟡 construction/works · 🟣 other (hazard, disruption) · 🟩 project (what's being built).
- Filters: projects layer, permit layer, permits that are only no-parking zones, ended items.

## Data sources (checked 2026-10-09)

The app uses three sources. None of them needs an API key or registration. All three send `Access-Control-Allow-Origin: *`, so the browser can fetch them directly. None publishes a rate limit, and no rate-limit headers were returned. Please be polite anyway, and see [Daily cache](#next-step-daily-cache).

### 1. VIZ Berlin: "Baustellen, Sperrungen und sonstige Störungen von besonderem verkehrlichem Interesse"

Catalogue entry: [daten.berlin.de](https://daten.berlin.de/datensaetze/baustellen-sperrungen-und-sonstige-storungen-von-besonderem-verkehrlichem-interesse). The machine-readable metadata is at the CKAN API behind the portal:
`https://datenregister.berlin.de/api/3/action/package_show?id=baustellen-sperrungen-und-sonstige-storungen-von-besonderem-verkehrlichem-interesse`

According to the dataset description, a technical defect and an ongoing system migration mean there are currently **two parallel GeoJSON feeds**:

| Feed | URL | Size | Notes |
|---|---|---|---|
| Verkehrsredaktion (editorial) | `https://api.viz.berlin.de/daten/baustellen_sperrungen_viz.json` | ~240 features, ~0.5 MB | Curated subset with extra detail: `total_lanes`/`closed_lanes`, `severity`, `direction`, ISO dates (`2026-10-28T17:00`), and `lms_id` linking to the other feed |
| Landesmeldestelle (raw) | `https://api.viz.berlin.de/tic3/baustellen_sperrungen_tic.json` | ~390 features, ~0.8 MB | Larger and less detailed; German dates (`28.10.2026 23:59`), `severity` is always `null` |

- Format: GeoJSON `FeatureCollection` in WGS84. Most geometries are a `GeometryCollection` with a `Point` and the affected `LineString`s.
- Both files were modified within the hour when checked, so they are updated several times a day.
- License: [Datenlizenz Deutschland – Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0) (dl-de/by-2-0). Attribution: *Verkehrsinformationszentrale Berlin (VIZ)*.
- The app loads both feeds, keeps every editorial record, and adds raw records whose `id` is not already covered by an editorial record's `lms_id`.
- ⚠️ The older URL `https://api.viz.berlin.de/daten/baustellen_sperrungen.json`, which is still referenced in many places, **is frozen at 2 July 2025**. Do not use it.

### 2. GDI Berlin WFS: "Planbare Ereignisse im öffentlichen Straßenland"

The VIZ feeds only cover works "of special traffic interest". This layer adds **all ~8,300 permitted works** in public street space, which includes the small, unsigned sites this project is about. It has no free-text reason, but it does have the restriction type (`einschr`, e.g. *Fahrstreifen-Reduzierung*, *Gehwegvollsperrung*, *Haltverbote*) and permitted/actual dates.

- Service: `https://gdi.berlin.de/services/wfs/planb_ereignisse` (WFS 2.0, layer `planb_ereignisse:ereignisse`)
- The app queries only a bounding box around the selected point:
  ```
  https://gdi.berlin.de/services/wfs/planb_ereignisse?service=WFS&version=2.0.0&request=GetFeature
    &typeNames=planb_ereignisse:ereignisse&outputFormat=application/json&srsName=EPSG:4326
    &bbox=52.49,13.40,52.51,13.43,urn:ogc:def:crs:EPSG::4326
  ```
  (With the `urn:` CRS, the bbox axis order is lat,lng.)
- License: dl-de/by-2-0, via [daten.berlin.de](https://daten.berlin.de/datensaetze/planbare-ereignisse-im-offentlichen-strassenland-wfs-2c6359e2).

### 3. What's being built: OpenStreetMap construction sites

The traffic sources describe the *closure* (e.g. "Hochbauarbeiten", building construction) but not *what* is being built. OpenStreetMap volunteers map construction sites with `landuse/building/highway/railway=construction`, often adding `name`, `construction=*` (residential, office, school, subway…), `operator`/`developer`, `opening_date`, `website` and notes. Berlin has about 2,300 such objects; about 1,100 carry useful information (the rest are unnamed generic sites, which the app skips).

- Fetched via the [Overpass API](https://overpass-api.de) (free, no key, CORS open). The public instance often returns `504` under load, so the app does **not** query it per click. A daily snapshot is built instead (see [Daily snapshot](#daily-snapshot)), with live Overpass plus a mirror as fallback.
- License: ODbL, © OpenStreetMap contributors. Quality varies: some entries are outdated (the app flags opening dates in the past), and you can fix them on openstreetmap.org (each popup links there).

### 4. What's being built: infraVelo cycle-infrastructure projects

GDI Berlin WFS **"Radverkehrsmaßnahmen (seit 2021)"** (`https://gdi.berlin.de/services/wfs/radverkehrsmassnahmen`, layer `radverkehrsmassnahmen:radverkehrsmassnahmen`), sourced from infraVelo's project database. It has full German project descriptions, the client (Bezirksamt/SenMVKU), status (*In Bau*, *In Planung*, *Vorgesehen*) and start/end quarters. About 60 projects are not yet completed. License: dl-de/by-2-0.

### Sources checked and not (yet) used

| Source | Why not |
|---|---|
| **infrest Baustellenatlas / "BaustellenInformationsSystem" app** | The best source for utility works (*Leitungsarbeiten*), which are the most common unexplained reason: Berliner Wasserbetriebe, Stromnetz Berlin, NBB (gas), BEW (district heating), BVG and some districts enter all their works here, including the client and the purpose. **No public API or open data**; it's only reachable via the app. Worth asking infrest for data access: service@infrest.de |
| Utility websites (BWB, Stromnetz Berlin, BEW, BVG tram projects) | Only individual project pages or PDFs, no machine-readable feeds |
| GDI "Bebauungsplanverfahren" (development plans) | Gives the zoned use (e.g. *allgemeines Wohngebiet*) and a PDF, but plans cover large areas and are often decades old, so they're a weak signal for a specific site |
| GDI "BVG: Gestörtes ÖPNV-Netz" | Only the affected line geometry, no reasons |
| "Schulbaumaßnahmen" (XLSX) | School construction list with no coordinates (would need geocoding); a possible future addition |

Map tiles: © OpenStreetMap contributors.

## Run locally

You need any static file server, because ES modules don't load from `file://`.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Browser geolocation works on `localhost` and on HTTPS (e.g. GitHub Pages), but not over plain HTTP on your LAN IP. To test on your phone, use the GitHub Pages link.

Without `data/projects.json`, the app queries Overpass/WFS live (slower, and Overpass is sometimes down). To build the snapshot locally:

```bash
npm run fetch-data
```

Unit tests (Node 18+):

```bash
npm test
```

## Code layout

```
index.html          page shell (Leaflet from unpkg CDN)
css/style.css
js/config.js            source URLs + defaults
js/sources.js           fetch + normalise each source (pure normalisers, shared with the snapshot script)
js/geo.js               distance / bbox / geometry-to-geometry proximity
js/i18n.js              UI strings (EN/DE) and project type labels
js/translate-de-en.js   offline German→English for the data texts
js/app.js               map, list, popups, filters, "why" matching
scripts/fetch-projects.mjs   builds data/projects.json (daily, in CI)
.github/workflows/pages.yml  tests, builds the snapshot, deploys to GitHub Pages
tests/                  node:test unit tests
```

All source-specific quirks (date formats, field names, deduplication) live in `js/sources.js`. The UI only sees the normalised item shape documented at the top of that file.

## Current limitations

- **The "why" is only partly solved.** On 2026-10-10, **26% of active VIZ closures** had a named or described project within 40 m. Most of the rest are utility works (*Leitungsarbeiten*, *Fernwärme*, *Stromleitungsbau*, …), whose purpose is only in the non-public infrest Baustellenatlas (see above). The matching is by proximity only, so a nearby project is labelled "possibly the reason", and some matches are coincidences. Closures caused by events (football, demonstrations, accidents) are never matched.
- **VIZ data isn't cached yet.** Every page load fetches about 1.3 MB from VIZ directly, plus one WFS query per point you pick. Projects come from the daily snapshot.
- **Possible duplicates between the VIZ feeds and the permit layer.** The same site can appear once from VIZ (with a reason) and once as a permit (with the restriction type), because they share no common ID. Matching them by geometry and dates is a possible next step.
- **The "reason" is often thin.** VIZ gives short German phrases such as *Leitungsbau* or *Brückenarbeiten*. Permits give no reason at all, and nothing says *who* is building *what* (e.g. "BVG tram track renewal"). That would need other sources, such as district (Bezirk) permits, BVG, Berliner Wasserbetriebe or Vattenfall announcements.
- "Planned end" is the end date as reported. Works often overrun, and the sources don't track that.
- Distance is measured to the nearest vertex of a site's geometry. That is good at street scale but approximate for very long, sparse lines.
- The offline translation is phrase-based. New wording in the VIZ feed stays German until a phrase is added to `js/translate-de-en.js`, which is easy to extend.
- It depends on the unpkg CDN for Leaflet and on OSM's public tile server. OSM tiles are fine for a prototype, but heavy use needs a tile provider.

## Daily snapshot

`.github/workflows/pages.yml` runs on every push and daily at 03:30 UTC. It runs the tests, builds `data/projects.json` with `scripts/fetch-projects.mjs` (using the same normalisers as the browser), and deploys the site to GitHub Pages. If Overpass is down, it still deploys, and the app falls back to live queries.

The VIZ feeds could be cached the same way: add them to the script and point `SOURCES.viz` / `SOURCES.tic` in `js/config.js` at the cached files.

## License

Code: MIT. Data: dl-de/by-2-0 (VIZ, GDI Berlin, infraVelo) and ODbL (© OpenStreetMap contributors).
