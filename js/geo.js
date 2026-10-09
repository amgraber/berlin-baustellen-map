// Small geometry helpers. Coordinates follow GeoJSON order: [lng, lat].

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineM([lng1, lat1], [lng2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// Flattens any GeoJSON geometry (incl. GeometryCollection) into a list of positions.
export function allPositions(geometry) {
  if (!geometry) return [];
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates;
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    case 'GeometryCollection':
      return geometry.geometries.flatMap(allPositions);
    default:
      return [];
  }
}

// A single representative point for the pin: the first explicit Point if there
// is one, otherwise the centre of the bounding box.
export function anchorOf(geometry) {
  if (geometry?.type === 'Point') return geometry.coordinates;
  if (geometry?.type === 'GeometryCollection') {
    const point = geometry.geometries.find((g) => g.type === 'Point');
    if (point) return point.coordinates;
  }
  const pts = allPositions(geometry);
  if (!pts.length) return null;
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
}

// Distance from `origin` to the nearest vertex of `geometry`. Good enough for
// street-scale closures; long lines are densely sampled in the source data.
export function distanceToGeometryM(origin, geometry) {
  let best = Infinity;
  for (const p of allPositions(geometry)) best = Math.min(best, haversineM(origin, p));
  return best;
}

// Bounding box around a point, as [minLat, minLng, maxLat, maxLng].
export function bboxAround([lng, lat], radiusM) {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLng = dLat / Math.cos(toRad(lat));
  return [lat - dLat, lng - dLng, lat + dLat, lng + dLng];
}
