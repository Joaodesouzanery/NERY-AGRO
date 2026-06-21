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
