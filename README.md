# berlin-baustellen-map

*(working title, so rename freely)*

**What's being built here, why, and until when?** You stand somewhere in Berlin (or tap a spot on the map) and see nearby construction sites and road/lane closures from Berlin's official open data. Each one shows the reason for the work, the start date and the planned end date.

**Live demo:** https://amgraber.github.io/berlin-baustellen-map/

This is a prototype for testing the idea. It is a static site with no backend and no build step.

## Features

- Uses your location (browser geolocation), or you tap anywhere on the map to check that spot.
- Radius of 250 m to 2 km. Results are listed by distance and drawn on an OpenStreetMap/Leaflet map.
- Closures are drawn as lines or areas, not just pins, so you can see which stretch of road is affected.
- Tap a pin or list entry to see the reason/description, restriction type (with a short English gloss), lanes closed, direction, start, planned end, days remaining, and the data source.
- Pin colours: 🔴 closure · 🟠 lane/partial restriction · 🟡 construction/works · 🟣 other (hazard, disruption).
- Filters: hide or show ended items, the permit layer, and permits that are only no-parking zones.

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

Map tiles: © OpenStreetMap contributors.

## Run locally

You need any static file server, because ES modules don't load from `file://`.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Browser geolocation works on `localhost` and on HTTPS (e.g. GitHub Pages), but not over plain HTTP on your LAN IP. To test on your phone, use the GitHub Pages link.

Unit tests for the parsing/normalising code (Node 18+):

```bash
npm test
```

## Code layout

```
index.html          page shell (Leaflet from unpkg CDN)
css/style.css
js/config.js        source URLs + defaults   ← swap for cached URLs later
js/sources.js       fetch + normalise each source into one item shape (pure normalisers)
js/geo.js           distance / bbox helpers
js/app.js           map, list, popups, filters
tests/              node:test unit tests
```

All source-specific quirks (date formats, field names, deduplication) live in `js/sources.js`. The UI only sees the normalised item shape documented at the top of that file.

## Current limitations

- **No caching/backend yet.** Every page load fetches about 1.3 MB from VIZ directly, plus one WFS query per point you pick.
- **Possible duplicates between the VIZ feeds and the permit layer.** The same site can appear once from VIZ (with a reason) and once as a permit (with the restriction type), because they share no common ID. Matching them by geometry and dates is a possible next step.
- **The "reason" is often thin.** VIZ gives short German phrases such as *Leitungsbau* or *Brückenarbeiten*. Permits give no reason at all, and nothing says *who* is building *what* (e.g. "BVG tram track renewal"). That would need other sources, such as district (Bezirk) permits, BVG, Berliner Wasserbetriebe or Vattenfall announcements.
- "Planned end" is the end date as reported. Works often overrun, and the sources don't track that.
- Distance is measured to the nearest vertex of a site's geometry. That is good at street scale but approximate for very long, sparse lines.
- The UI is in English while the data is in German; only common terms get an English gloss.
- It depends on the unpkg CDN for Leaflet and on OSM's public tile server. OSM tiles are fine for a prototype, but heavy use needs a tile provider.

## Next step: daily cache

The data doesn't need to be fetched more than about once a day per user. The code is set up so that you can add a cache without touching the UI:

1. Add a scheduled job, e.g. a GitHub Action on `cron: '0 4 * * *'`, a Cloudflare Worker cron, or a small serverless function. The job:
   - downloads both VIZ feeds,
   - optionally downloads the full `planb_ereignisse` layer (no bbox, ~8k features) and filters out ended items,
   - optionally runs the same `normalize*` functions from `js/sources.js` in Node, so the merging/deduplication happens server-side,
   - writes `data/viz.json`, `data/tic.json` and `data/planb.json`, then commits them or uploads them to storage.
2. Point `SOURCES` in `js/config.js` at those files. For the permit layer, swap `fetchPlanbNear` for a version that loads the cached file once and filters by distance on the client.

## License

Code: MIT. Data: dl-de/by-2-0 (see above).
