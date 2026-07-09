import type { MapBaseStyle } from "@/features/talhao-360/types/domain";

const cartoTiles = [
  "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
  "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
  "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
  "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
];

const esriSatelliteTiles = [
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

const esriTransportationTiles = [
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
];

const esriPlacesTiles = [
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
];

export const mapStyleLabels: Record<MapBaseStyle, string> = {
  satellite: "Satélite",
  map: "Mapa",
  hybrid: "Híbrido",
};

export function talhaoMapStyle(style: MapBaseStyle) {
  if (style === "map") {
    return {
      version: 8 as const,
      sources: {
        carto: {
          type: "raster" as const,
          tiles: cartoTiles,
          tileSize: 256,
          attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
        },
      },
      layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
    };
  }

  const sources = {
    satellite: {
      type: "raster" as const,
      tiles: esriSatelliteTiles,
      tileSize: 256,
      attribution: "Tiles &copy; Esri",
    },
    transportation: {
      type: "raster" as const,
      tiles: esriTransportationTiles,
      tileSize: 256,
      attribution: "Reference &copy; Esri",
    },
    places: {
      type: "raster" as const,
      tiles: esriPlacesTiles,
      tileSize: 256,
      attribution: "Reference &copy; Esri",
    },
  };

  return {
    version: 8 as const,
    sources,
    layers:
      style === "hybrid"
        ? [
            { id: "satellite", type: "raster" as const, source: "satellite" },
            { id: "transportation", type: "raster" as const, source: "transportation" },
            { id: "places", type: "raster" as const, source: "places" },
          ]
        : [{ id: "satellite", type: "raster" as const, source: "satellite" }],
  };
}

export function nextMapStyle(style: MapBaseStyle): MapBaseStyle {
  if (style === "satellite") return "map";
  if (style === "map") return "hybrid";
  return "satellite";
}
