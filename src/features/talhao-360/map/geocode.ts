// Geocoding gratuito via Nominatim (OpenStreetMap) — sem API key.
// Uso de baixo volume (busca manual do usuário). O navegador envia Referer/UA.

export type GeocodeResult = { label: string; lat: number; lng: number };

export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=pt-BR&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Falha na busca de local.");
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data
    .map((item) => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}
