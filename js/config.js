// Data source URLs. All are free, need no API key, and send
// `Access-Control-Allow-Origin: *`, so the browser can fetch them directly.
//
// To add a daily cache later, point these at your cached copies
// (e.g. './data/viz.json' written by a scheduled job) — nothing else changes.
export const SOURCES = {
  // VIZ "Verkehrsredaktion" feed: curated subset with lane counts, reasons, ISO dates.
  viz: 'https://api.viz.berlin.de/daten/baustellen_sperrungen_viz.json',
  // VIZ "Landesmeldestelle" feed: larger raw feed, fewer details, German dates.
  tic: 'https://api.viz.berlin.de/tic3/baustellen_sperrungen_tic.json',
  // GDI Berlin WFS "Planbare Ereignisse im öffentlichen Straßenland" (~8k permitted works).
  planbWfs: 'https://gdi.berlin.de/services/wfs/planb_ereignisse',

  // "What's being built" sources, used to explain closures:
  // OpenStreetMap construction sites (buildings, roads, rail) via Overpass API.
  overpass: 'https://overpass-api.de/api/interpreter',
  overpassMirror: 'https://overpass.kumi.systems/api/interpreter',
  // GDI Berlin WFS "Radverkehrsmaßnahmen (seit 2021)": infraVelo cycle-infrastructure projects.
  cycleWfs: 'https://gdi.berlin.de/services/wfs/radverkehrsmassnahmen',
  // Daily snapshot of both project sources (scripts/fetch-projects.mjs). The
  // app falls back to the live queries above when it's missing.
  projectsSnapshot: './data/projects.json',
};

// Max distance (m) between a closure and a project for them to be shown as related.
export const RELATED_PROJECT_MAX_M = 40;

export const BERLIN_CENTER = [52.52, 13.405];
export const DEFAULT_RADIUS_M = 500;
export const RADIUS_OPTIONS_M = [250, 500, 1000, 2000];
