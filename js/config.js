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
};

export const BERLIN_CENTER = [52.52, 13.405];
export const DEFAULT_RADIUS_M = 500;
export const RADIUS_OPTIONS_M = [250, 500, 1000, 2000];
