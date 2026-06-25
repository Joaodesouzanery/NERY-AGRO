export type MapBaseStyle = "map" | "satellite";

const mapStyleUrl = import.meta.env.VITE_MAP_STYLE_URL;
const satelliteTile =
  import.meta.env.VITE_SATELLITE_TILE_URL ||
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
// Esri World Imagery serves a "Map data not yet available" placeholder beyond
// its deepest level. Capping the source maxzoom makes MapLibre overzoom (scale)
// the last real tile instead, so zooming in close still shows imagery.
const satelliteMaxZoom = Number(import.meta.env.VITE_SATELLITE_MAX_ZOOM) || 19;

// Detailed street basemap (CARTO Voyager), matching the control-tower map.
// The previous default (MapLibre demo tiles) was only a schematic world outline.
const cartoStreetStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

// Nominatim-compatible geocoder. Free by default; override with a contracted
// service via VITE_MAP_GEOCODER_URL (expects the same response shape).
const geocoderBase =
  import.meta.env.VITE_MAP_GEOCODER_URL || "https://nominatim.openstreetmap.org/search";

export type GeocodeResult = { center: [number, number]; label: string };

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const term = query.trim();
  if (!term) return null;
  const url = new URL(geocoderBase);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "pt-BR");
  url.searchParams.set("q", term);
  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Falha ao consultar o serviço de busca.");
  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  const first = results?.[0];
  if (!first) return null;
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { center: [lng, lat], label: first.display_name };
}

export const mapProvider = {
  style(style: MapBaseStyle): StyleSpecification | string {
    if (style === "map") return mapStyleUrl || cartoStreetStyle;
    return {
      version: 8,
      sources: {
        satellite: {
          type: "raster",
          tiles: [satelliteTile],
          tileSize: 256,
          maxzoom: satelliteMaxZoom,
          attribution: "Tiles © Esri",
        },
      },
      layers: [{ id: "satellite", type: "raster", source: "satellite" }],
    };
  },
};
import type { StyleSpecification } from "maplibre-gl";
