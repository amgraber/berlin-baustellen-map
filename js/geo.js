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

// ---------- proximity between two geometries ----------

// Local equirectangular projection to metres (fine at city scale).
function projector([lng0, lat0]) {
  const kx = (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(toRad(lat0));
  const ky = (Math.PI / 180) * EARTH_RADIUS_M;
  return ([lng, lat]) => [(lng - lng0) * kx, (lat - lat0) * ky];
}

// Segments ([a, b] pairs) and polygon rings of a geometry.
function parts(geometry) {
  const segs = [];
  const rings = [];
  const points = [];
  const line = (coords) => {
    for (let i = 1; i < coords.length; i++) segs.push([coords[i - 1], coords[i]]);
    if (coords.length === 1) points.push(coords[0]);
  };
  const walk = (g) => {
    if (!g) return;
    switch (g.type) {
      case 'Point': points.push(g.coordinates); break;
      case 'MultiPoint': points.push(...g.coordinates); break;
      case 'LineString': line(g.coordinates); break;
      case 'MultiLineString': g.coordinates.forEach(line); break;
      case 'Polygon': g.coordinates.forEach(line); rings.push(g.coordinates[0]); break;
      case 'MultiPolygon': g.coordinates.forEach((p) => { p.forEach(line); rings.push(p[0]); }); break;
      case 'GeometryCollection': g.geometries.forEach(walk); break;
      default: break;
    }
  };
  walk(geometry);
  return { segs, rings, points };
}

function pointSegDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Shortest distance in metres between two GeoJSON geometries (0 if they touch,
// or one lies inside a polygon of the other).
export function geometryDistanceM(a, b) {
  const origin = allPositions(a)[0] ?? allPositions(b)[0];
  if (!origin) return Infinity;
  const proj = projector(origin);
  const pa = parts(a), pb = parts(b);
  const P = (x) => x.map(proj);
  const A = { segs: pa.segs.map(P), rings: pa.rings.map(P), pts: [...pa.points, ...pa.segs.flat()].map(proj) };
  const B = { segs: pb.segs.map(P), rings: pb.rings.map(P), pts: [...pb.points, ...pb.segs.flat()].map(proj) };
  if (A.pts.some((p) => B.rings.some((r) => inRing(p, r)))) return 0;
  if (B.pts.some((p) => A.rings.some((r) => inRing(p, r)))) return 0;
  let best = Infinity;
  const near = (pts, segs) => {
    for (const p of pts) {
      if (!segs.length) continue;
      for (const [s, e] of segs) best = Math.min(best, pointSegDist(p, s, e));
    }
  };
  near(A.pts, B.segs);
  near(B.pts, A.segs);
  if (best === Infinity) {
    for (const p of A.pts) for (const q of B.pts) best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]));
  }
  return best;
}
