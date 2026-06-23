const earthRadius = 6_371_008.8;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function closeRing(points: Array<[number, number]>) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points.at(-1);
  if (first[0] === last?.[0] && first[1] === last?.[1]) return points;
  return [...points, first];
}

export function polygonAreaHa(points: Array<[number, number]>) {
  const ring = closeRing(points);
  if (ring.length < 4) return 0;
  let total = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lng1, lat1] = ring[index];
    const [lng2, lat2] = ring[index + 1];
    total += radians(lng2 - lng1) * (2 + Math.sin(radians(lat1)) + Math.sin(radians(lat2)));
  }
  return Math.abs((total * earthRadius * earthRadius) / 2) / 10_000;
}

export function polygonPerimeterKm(points: Array<[number, number]>) {
  const ring = closeRing(points);
  let meters = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lng1, lat1] = ring[index];
    const [lng2, lat2] = ring[index + 1];
    const dLat = radians(lat2 - lat1);
    const dLng = radians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
    meters += earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return meters / 1000;
}

export function parsePolygon(value?: string): GeoJSON.Polygon | null {
  if (!value) return null;
  try {
    const geometry = JSON.parse(value) as GeoJSON.Polygon;
    if (geometry.type !== "Polygon" || !geometry.coordinates?.[0]?.length) return null;
    return geometry;
  } catch {
    return null;
  }
}

export function polygonPoints(geometry?: GeoJSON.Polygon | null) {
  return (geometry?.coordinates[0]?.slice(0, -1) ?? []) as Array<[number, number]>;
}

export function polygonCentroid(points: Array<[number, number]>): [number, number] {
  if (!points.length) return [-50.94, -17.79];
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ];
}

export function isValidPolygon(points: Array<[number, number]>) {
  if (points.length < 3 || polygonAreaHa(points) <= 0) return false;
  const ring = closeRing(points);
  for (let first = 0; first < ring.length - 1; first += 1) {
    for (let second = first + 1; second < ring.length - 1; second += 1) {
      if (Math.abs(first - second) <= 1) continue;
      if (first === 0 && second === ring.length - 2) continue;
      if (segmentsIntersect(ring[first], ring[first + 1], ring[second], ring[second + 1]))
        return false;
    }
  }
  return true;
}

export function pointInPolygon(point: [number, number], polygon: Array<[number, number]>) {
  let inside = false;
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const [currentX, currentY] = polygon[current];
    const [previousX, previousY] = polygon[previous];
    const crosses =
      currentY > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - currentX) * (point[1] - currentY)) / (previousY - currentY || 1e-12) +
          currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function polygonWithin(inner: Array<[number, number]>, outer: Array<[number, number]>) {
  return (
    inner.length >= 3 && outer.length >= 3 && inner.every((point) => pointInPolygon(point, outer))
  );
}

export function polygonsOverlap(first: Array<[number, number]>, second: Array<[number, number]>) {
  if (first.some((point) => pointInPolygon(point, second))) return true;
  if (second.some((point) => pointInPolygon(point, first))) return true;
  const firstRing = closeRing(first);
  const secondRing = closeRing(second);
  for (let a = 0; a < firstRing.length - 1; a += 1) {
    for (let b = 0; b < secondRing.length - 1; b += 1) {
      if (segmentsIntersect(firstRing[a], firstRing[a + 1], secondRing[b], secondRing[b + 1]))
        return true;
    }
  }
  return false;
}

function segmentsIntersect(
  firstStart: [number, number],
  firstEnd: [number, number],
  secondStart: [number, number],
  secondEnd: [number, number],
) {
  const orientation = (start: [number, number], middle: [number, number], end: [number, number]) =>
    Math.sign(
      (middle[1] - start[1]) * (end[0] - middle[0]) - (middle[0] - start[0]) * (end[1] - middle[1]),
    );
  return (
    orientation(firstStart, firstEnd, secondStart) !==
      orientation(firstStart, firstEnd, secondEnd) &&
    orientation(secondStart, secondEnd, firstStart) !==
      orientation(secondStart, secondEnd, firstEnd)
  );
}
