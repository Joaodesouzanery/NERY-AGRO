import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  MapGeoJSONFeature,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  StyleSpecification,
} from "maplibre-gl";
import { Navigation, RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartoMapTone, MapPoint, MapRoute } from "@/components/carto-map";

type MapStat = {
  label: string;
  value: string | number;
  tone?: CartoMapTone;
};

export type InteractiveMapVariant = "dark" | "voyager" | "positron" | "satellite";

type InteractiveMapProps = {
  points?: MapPoint[];
  routes?: MapRoute[];
  stats?: MapStat[];
  className?: string;
  title?: string;
  subtitle?: string;
  centerLabel?: string;
  variant?: InteractiveMapVariant;
  interactive?: boolean;
  showLegend?: boolean;
  attribution?: boolean;
  fitToData?: boolean;
  onPointClick?: (point: MapPoint) => void;
  onRouteClick?: (route: MapRoute) => void;
  fallbackBounds?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
};

type PointFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, string | number | boolean>;
};

type RouteFeature = {
  type: "Feature";
  geometry:
    | { type: "LineString"; coordinates: Array<[number, number]> }
    | { type: "Polygon"; coordinates: Array<Array<[number, number]>> };
  properties: Record<string, string | number | boolean>;
};

type FeatureCollection<T> = {
  type: "FeatureCollection";
  features: T[];
};

const toneColor: Record<CartoMapTone, string> = {
  primary: "#4f8cff",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  neutral: "#64748b",
};

const moduleIconConfig: Record<string, { label: string; color: string }> = {
  torre: { label: "⌁", color: "#60a5fa" },
  logistica: { label: "↗", color: "#3b82f6" },
  financeiro: { label: "$", color: "#22c55e" },
  campo: { label: "⌂", color: "#84cc16" },
  pecuaria: { label: "QR", color: "#a855f7" },
  sustentabilidade: { label: "♻", color: "#10b981" },
  inteligencia: { label: "!", color: "#06b6d4" },
  cogs: { label: "C", color: "#f59e0b" },
  alerta: { label: "!", color: "#ef4444" },
  talhao: { label: "T", color: "#84cc16" },
  areas: { label: "T", color: "#84cc16" },
  insumos: { label: "I", color: "#22c55e" },
  lotes: { label: "L", color: "#06b6d4" },
  pragas: { label: "P", color: "#ef4444" },
  solo: { label: "S", color: "#a16207" },
  irrigacao: { label: "R", color: "#0ea5e9" },
  meteorologia: { label: "C", color: "#38bdf8" },
  maquinario: { label: "M", color: "#64748b" },
  estimativa: { label: "F", color: "#f59e0b" },
  planejamento: { label: "N", color: "#22c55e" },
  modelo: { label: "D", color: "#8b5cf6" },
  "analise-solo": { label: "A", color: "#f97316" },
};

const mapIconConfig: Record<string, { label: string; color: string }> = {
  ...moduleIconConfig,
  torre: { label: "CT", color: "#60a5fa" },
  logistica: { label: "TR", color: "#3b82f6" },
  financeiro: { label: "$", color: "#22c55e" },
  campo: { label: "AG", color: "#84cc16" },
  pecuaria: { label: "QR", color: "#a855f7" },
  sustentabilidade: { label: "CO2", color: "#10b981" },
  inteligencia: { label: "AI", color: "#06b6d4" },
  cogs: { label: "COG", color: "#f59e0b" },
  otimizacao: { label: "COG", color: "#f59e0b" },
  equipe: { label: "EQ", color: "#f472b6" },
  vendas: { label: "VD", color: "#f472b6" },
  cliente: { label: "CL", color: "#38bdf8" },
  base: { label: "BS", color: "#94a3b8" },
  fornecedor: { label: "FR", color: "#f59e0b" },
};

// Nome amigável por categoria, usado na legenda do mapa operacional.
const categoryNames: Record<string, string> = {
  torre: "Torre de Controle",
  logistica: "Logística / Cargas",
  financeiro: "Financeiro",
  campo: "Campo",
  pecuaria: "Pecuária",
  sustentabilidade: "Emissão de Carbono",
  inteligencia: "Inteligência",
  cogs: "COGS",
  otimizacao: "COGS",
  equipe: "Equipe & Vendas",
  vendas: "Vendas",
  cliente: "Cliente",
  base: "CD / Base",
  fornecedor: "Fornecedor",
  alerta: "Alerta",
  talhao: "Talhão",
  areas: "Talhão / Áreas",
  insumos: "Insumos",
  lotes: "Lotes",
  pragas: "Pragas",
  solo: "Solo",
  "analise-solo": "Análise de solo",
  irrigacao: "Irrigação",
  meteorologia: "Meteorologia",
  maquinario: "Maquinário",
  estimativa: "Estimativa de safra",
  planejamento: "Planejamento",
  modelo: "Modelo",
};

const defaultFallbackBounds = {
  west: -46.72,
  south: -23.62,
  east: -46.54,
  north: -23.48,
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function lngLatFrom(
  point: { lat?: number; lng?: number; x?: number; y?: number },
  fallbackBounds = defaultFallbackBounds,
): [number, number] | null {
  if (isFiniteNumber(point.lat) && isFiniteNumber(point.lng)) {
    return [point.lng, point.lat];
  }

  if (isFiniteNumber(point.x) && isFiniteNumber(point.y)) {
    const x = clamp(point.x, 0, 100) / 100;
    const y = clamp(point.y, 0, 100) / 100;
    const lng = fallbackBounds.west + (fallbackBounds.east - fallbackBounds.west) * x;
    const lat = fallbackBounds.north - (fallbackBounds.north - fallbackBounds.south) * y;
    return [lng, lat];
  }

  return null;
}

function mapStyle(variant: InteractiveMapVariant): StyleSpecification {
  if (variant === "satellite") {
    return {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles &copy; Esri",
        },
      },
      layers: [{ id: "satellite", type: "raster", source: "satellite" }],
    };
  }

  const cartoVariant =
    variant === "dark" ? "dark_all" : variant === "positron" ? "light_all" : "rastertiles/voyager";

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      carto: {
        type: "raster",
        tiles: [
          `https://a.basemaps.cartocdn.com/${cartoVariant}/{z}/{x}/{y}@2x.png`,
          `https://b.basemaps.cartocdn.com/${cartoVariant}/{z}/{x}/{y}@2x.png`,
          `https://c.basemaps.cartocdn.com/${cartoVariant}/{z}/{x}/{y}@2x.png`,
          `https://d.basemaps.cartocdn.com/${cartoVariant}/{z}/{x}/{y}@2x.png`,
        ],
        tileSize: 256,
        attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  };
}

function fallbackRasterStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osmFallback: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm-fallback",
        type: "raster",
        source: "osmFallback",
        paint: {
          "raster-brightness-min": 0.04,
          "raster-brightness-max": 0.38,
          "raster-contrast": 0.15,
          "raster-saturation": -0.75,
        },
      },
    ],
  };
}

function glyphFor(point: MapPoint) {
  const raw = String(
    point.iconKey ??
      point.moduleId ??
      point.icon ??
      point.category ??
      point.sourceModule ??
      point.meta?.tipo ??
      "",
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return mapIconConfig[raw]?.label ?? raw.slice(0, 2).toUpperCase() ?? "P";
}

function iconKeyFor(point: MapPoint) {
  const raw = String(
    point.iconKey ??
      point.moduleId ??
      point.icon ??
      point.category ??
      point.sourceModule ??
      "alerta",
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return mapIconConfig[raw] ? raw : "alerta";
}

// Ícones pictográficos (estilo lucide, traço branco, viewBox 24x24) desenhados
// dentro do pino — no lugar das letrinhas.
const ICON_PATHS: Record<string, string> = {
  truck:
    '<path d="M2 7.5h11v9H2z"/><path d="M13 10.5h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>',
  warehouse: '<path d="M3 21V8.5l9-4 9 4V21"/><path d="M7 21v-7h10v7"/><path d="M7 17h10"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  sprout:
    '<path d="M12 20v-9"/><path d="M12 13c3.5 0 6-2.2 6-5.5C14.5 7.5 12 9.7 12 13z"/><path d="M12 15c0-3-2.3-5.2-5.5-5.2C6.5 12.8 8.8 15 12 15z"/>',
  leaf: '<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19c3.5-3.8 7.5-6 11.5-7"/>',
  qr: '<path d="M4 4h6v6H4z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6H4z"/><path d="M14 14h2v2"/><path d="M20 14v2"/><path d="M14 18v2"/><path d="M18 18h2v2"/>',
  dollar:
    '<path d="M12 3v18"/><path d="M16.5 7.5C16.5 5.5 14.5 4.5 12 4.5S7.5 5.5 7.5 7.5 9.5 10.5 12 10.5s4.5 1 4.5 3.5S14.5 19.5 12 19.5 7.5 18.5 7.5 16.5"/>',
  barchart: '<path d="M5 21V10"/><path d="M12 21V4"/><path d="M19 21v-7"/>',
  calculator:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01"/>',
  alert: '<path d="M12 4 2.5 20.5h19z"/><path d="M12 10.5v4"/><path d="M12 17.5h.01"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  droplet: '<path d="M12 3.5s6 5.8 6 10.5a6 6 0 0 1-12 0c0-4.7 6-10.5 6-10.5z"/>',
  cloud: '<path d="M7.5 18.5a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.5 11a3.5 3.5 0 0 1-.5 6.97z"/>',
  wrench:
    '<path d="M15.5 6.5a3.6 3.6 0 0 1-4.7 4.7L5 17l2 2 5.8-5.8a3.6 3.6 0 0 1 4.7-4.7l-2.4 2.4-1.6-1.6z"/>',
  calendar:
    '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/>',
  factory: '<path d="M3 21V11l5 3.2V11l5 3.2V6.5h6V21z"/><path d="M3 21h18"/>',
  broadcast:
    '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.6 5.6 0 0 0 0 8"/><path d="M16 8a5.6 5.6 0 0 1 0 8"/><path d="M5.5 5.5a9 9 0 0 0 0 13"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6"/><path d="M18 19a5.5 5.5 0 0 0-3-4.9"/>',
};

const KEY_TO_ICON: Record<string, string> = {
  torre: "broadcast",
  logistica: "truck",
  financeiro: "dollar",
  campo: "sprout",
  pecuaria: "qr",
  sustentabilidade: "leaf",
  inteligencia: "barchart",
  cogs: "calculator",
  otimizacao: "calculator",
  alerta: "alert",
  talhao: "sprout",
  areas: "sprout",
  insumos: "sprout",
  lotes: "qr",
  pragas: "alert",
  solo: "layers",
  "analise-solo": "layers",
  irrigacao: "droplet",
  meteorologia: "cloud",
  maquinario: "wrench",
  estimativa: "barchart",
  planejamento: "calendar",
  modelo: "factory",
  equipe: "users",
  vendas: "users",
  // entidades de rede (origem/destino/base dos mapas de logística)
  cliente: "home",
  base: "warehouse",
  fornecedor: "warehouse",
};

function iconSvg(key: string) {
  const config = mapIconConfig[key] ?? mapIconConfig.alerta;
  const inner = ICON_PATHS[KEY_TO_ICON[key] ?? "alert"] ?? ICON_PATHS.alert;
  // Pino maior (raster 48px), com disco branco interno + pictograma na cor da
  // categoria — assim a cor "sobrevive" mesmo quando o ícone fica pequeno no
  // zoom afastado (o que o usuário precisava: identificar a categoria só de olhar).
  const scale = 0.62;
  const tx = 21 - 12 * scale;
  const ty = 16 - 12 * scale;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 42 42">
      <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.4" flood-color="#020617" flood-opacity=".55"/>
      </filter>
      <path filter="url(#s)" d="M21 3c8.2 0 14.8 6.4 14.8 14.2 0 10.2-14.8 18.8-14.8 18.8S6.2 27.4 6.2 17.2C6.2 9.4 12.8 3 21 3Z" fill="${config.color}" stroke="#ffffff" stroke-width="3"/>
      <circle cx="21" cy="16" r="8" fill="#ffffff"/>
      <g transform="translate(${tx} ${ty}) scale(${scale})" fill="none" stroke="${config.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
    </svg>
  `)}`;
}

function popupHtml(
  title: string,
  description?: string,
  rows: Array<[string, unknown]> = [],
  href?: string,
) {
  const rowHtml = rows
    .map(
      ([key, value]) =>
        `<div class="nery-map-popup-row"><span>${escapeHtml(key.replace(/_/g, " "))}</span><strong>${escapeHtml(value)}</strong></div>`,
    )
    .join("");

  return `
    <div class="nery-map-popup">
      <div class="nery-map-popup-title">${escapeHtml(title)}</div>
      ${description ? `<div class="nery-map-popup-desc">${escapeHtml(description)}</div>` : ""}
      ${rowHtml ? `<div class="nery-map-popup-list">${rowHtml}</div>` : ""}
      ${href ? `<a class="nery-map-popup-link" href="${escapeHtml(href)}">Abrir modulo</a>` : ""}
    </div>
  `;
}

function pointCollection(
  points: MapPoint[],
  fallbackBounds?: InteractiveMapProps["fallbackBounds"],
): FeatureCollection<PointFeature> {
  return {
    type: "FeatureCollection",
    features: points
      .map((point): PointFeature | null => {
        const coordinates = lngLatFrom(point, fallbackBounds);
        if (!coordinates) return null;

        const tone = point.tone ?? "primary";
        const metrics = Object.entries(point.metrics ?? {}).filter(
          ([, value]) => value !== undefined && value !== "",
        );
        const rows = {
          ...(point.moduleLabel ? { Modulo: point.moduleLabel } : {}),
          ...(point.status ? { Status: point.status } : {}),
          ...(point.severity ? { Severidade: point.severity } : {}),
          ...Object.fromEntries(metrics),
          ...(point.meta ?? {}),
        };
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates },
          properties: {
            id: point.id,
            label: point.label,
            caption: point.caption ?? point.status ?? "",
            description: point.description ?? "",
            summary: point.summary ?? "",
            href: point.href ?? "",
            iconKey: iconKeyFor(point),
            tone,
            color: toneColor[tone],
            glyph: glyphFor(point),
            meta: JSON.stringify(rows),
          },
        };
      })
      .filter((feature): feature is PointFeature => Boolean(feature)),
  };
}

function routeCollection(
  routes: MapRoute[],
  fallbackBounds?: InteractiveMapProps["fallbackBounds"],
): FeatureCollection<RouteFeature> {
  return {
    type: "FeatureCollection",
    features: routes
      .map((route) => {
        if (route.geometry?.type === "LineString") {
          const coordinates = route.geometry.coordinates as Array<[number, number]>;
          return routeFeature(route, { type: "LineString", coordinates });
        }

        if (route.geometry?.type === "Polygon") {
          const coordinates = route.geometry.coordinates as Array<Array<[number, number]>>;
          return routeFeature(route, { type: "Polygon", coordinates });
        }

        const coordinates = route.points
          .map((point) => lngLatFrom(point, fallbackBounds))
          .filter((coord): coord is [number, number] => Boolean(coord));

        if (coordinates.length < 2) return null;

        if ((route.shape === "polygon" || route.points.length >= 3) && coordinates.length >= 3) {
          const ring = [...coordinates];
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
          return routeFeature(route, { type: "Polygon", coordinates: [ring] });
        }

        return routeFeature(route, { type: "LineString", coordinates });
      })
      .filter((feature): feature is RouteFeature => Boolean(feature)),
  };
}

function routeFeature(route: MapRoute, geometry: RouteFeature["geometry"]): RouteFeature {
  const tone = route.tone ?? "primary";
  return {
    type: "Feature",
    geometry,
    properties: {
      id: route.id,
      label: route.label ?? "Rota",
      description: route.description ?? route.status ?? "",
      href: route.href ?? "",
      tone,
      color: toneColor[tone],
      meta: JSON.stringify(route.meta ?? {}),
    },
  };
}

function allCoordinates(
  points: FeatureCollection<PointFeature>,
  routes: FeatureCollection<RouteFeature>,
) {
  const coords: Array<[number, number]> = [];
  points.features.forEach((feature) => coords.push(feature.geometry.coordinates));
  routes.features.forEach((feature) => {
    if (feature.geometry.type === "LineString") coords.push(...feature.geometry.coordinates);
    else feature.geometry.coordinates.forEach((ring) => coords.push(...ring));
  });
  return coords;
}

function parseMeta(value: unknown) {
  try {
    return Object.entries(JSON.parse(String(value || "{}"))) as Array<[string, unknown]>;
  } catch {
    return [];
  }
}

function featureRows(feature: MapGeoJSONFeature) {
  return parseMeta(feature.properties?.meta);
}

function addLayerIfMissing(map: MapLibreMap, layer: Parameters<MapLibreMap["addLayer"]>[0]) {
  if (!map.getLayer(layer.id)) map.addLayer(layer);
}

async function addLayers(map: MapLibreMap): Promise<void> {
  await addModuleIcons(map);
  if (!map.getSource("routes")) {
    map.addSource("routes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getSource("points")) {
    map.addSource("points", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 48,
    });
  }

  addLayerIfMissing(map, {
    id: "route-fill",
    type: "fill",
    source: "routes",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.18,
    },
  });

  addLayerIfMissing(map, {
    id: "route-outline",
    type: "line",
    source: "routes",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": ["get", "color"],
      "line-width": 2,
      "line-opacity": 0.9,
    },
  });

  // Casing (linha escura por baixo) — dá contraste e faz as rotas "saltarem".
  addLayerIfMissing(map, {
    id: "route-line-casing",
    type: "line",
    source: "routes",
    filter: ["==", ["geometry-type"], "LineString"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "rgba(2,6,23,0.85)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 4, 10, 8, 15, 12],
      "line-opacity": 0.9,
    },
  });

  addLayerIfMissing(map, {
    id: "route-line",
    type: "line",
    source: "routes",
    filter: ["==", ["geometry-type"], "LineString"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 2.5, 10, 5, 15, 8],
      "line-opacity": 0.95,
    },
  });

  addLayerIfMissing(map, {
    id: "clusters",
    type: "circle",
    source: "points",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#3b82f6", 8, "#f59e0b", 18, "#ef4444"],
      "circle-radius": ["step", ["get", "point_count"], 22, 8, 28, 18, 36],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "rgba(255,255,255,0.9)",
    },
  });

  addLayerIfMissing(map, {
    id: "cluster-count",
    type: "symbol",
    source: "points",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
      "text-size": 14,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  });

  addLayerIfMissing(map, {
    id: "unclustered-point",
    type: "symbol",
    source: "points",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["get", "iconKey"],
      "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 1.4, 6, 1.55, 10, 1.8, 15, 2.3],
      // Pinos sempre visíveis (não some por colisão em zoom afastado). O
      // clustering já resolve densidade; pinos isolados aparecem sempre.
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "symbol-sort-key": [
        "case",
        ["==", ["get", "tone"], "danger"],
        10,
        ["==", ["get", "tone"], "warning"],
        8,
        1,
      ],
    },
  });

  addLayerIfMissing(map, {
    id: "point-label",
    type: "symbol",
    source: "points",
    filter: ["!", ["has", "point_count"]],
    minzoom: 7,
    layout: {
      // Em zoom afastado não mostra texto (a categoria já é a cor + o pictograma
      // do pino); ao aproximar (zoom ≥7) aparece o nome completo do ponto.
      "text-field": ["step", ["zoom"], "", 7, ["get", "label"]],
      "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 7, 10, 14, 12],
      "text-offset": [0, 1.6],
      "text-anchor": "top",
      "text-max-width": 8,
      "text-optional": true,
      "text-allow-overlap": false,
      "text-ignore-placement": false,
    },
    paint: {
      "text-color": ["get", "color"],
      "text-halo-color": "rgba(2,6,23,0.92)",
      "text-halo-width": 1.6,
    },
  });
}

function addModuleIcons(map: MapLibreMap): Promise<void> {
  const pending = Object.keys(mapIconConfig)
    .filter((key) => !map.hasImage(key))
    .map(
      (key) =>
        new Promise<void>((resolve) => {
          const image = new Image(48, 48);
          image.onload = () => {
            if (!map.hasImage(key)) map.addImage(key, image, { pixelRatio: 2 });
            resolve();
          };
          image.onerror = () => resolve();
          image.src = iconSvg(key);
        }),
    );
  return Promise.all(pending).then(() => undefined);
}

export function InteractiveMap({
  points = [],
  routes = [],
  stats = [],
  className,
  title,
  subtitle,
  centerLabel,
  variant = "dark",
  interactive = true,
  showLegend = false,
  attribution = true,
  fitToData = true,
  fallbackBounds = defaultFallbackBounds,
  onPointClick,
  onRouteClick,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  // A câmera é enquadrada UMA vez (quando surge o primeiro dado); depois disso o
  // mapa nunca mais se move sozinho — trocar de filtro ou dar zoom não "reseta".
  const didFitRef = useRef(false);
  const fallbackAppliedRef = useRef(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");

  const pointData = useMemo(
    () => pointCollection(points, fallbackBounds),
    [points, fallbackBounds],
  );
  const routeData = useMemo(
    () => routeCollection(routes, fallbackBounds),
    [routes, fallbackBounds],
  );
  // Categorias realmente presentes nos pontos → legenda com cor + nome amigável.
  const legendItems = useMemo(() => {
    const seen = new Map<string, { key: string; color: string; label: string }>();
    points.forEach((point) => {
      const key = iconKeyFor(point);
      if (!seen.has(key)) {
        seen.set(key, {
          key,
          color: mapIconConfig[key]?.color ?? toneColor.neutral,
          label: categoryNames[key] ?? mapIconConfig[key]?.label ?? key,
        });
      }
    });
    return [...seen.values()];
  }, [points]);
  const pointLookup = useMemo(() => new Map(points.map((point) => [point.id, point])), [points]);
  const routeLookup = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);
  const callbacksRef = useRef({ onPointClick, onRouteClick, pointLookup, routeLookup });
  const dataRef = useRef({ pointData, routeData, fitToData });

  useEffect(() => {
    callbacksRef.current = { onPointClick, onRouteClick, pointLookup, routeLookup };
  }, [onPointClick, onRouteClick, pointLookup, routeLookup]);

  useEffect(() => {
    dataRef.current = { pointData, routeData, fitToData };
  }, [fitToData, pointData, routeData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    let map: MapLibreMap | null = null;
    fallbackAppliedRef.current = false;
    loadedRef.current = false;
    setMapStatus("loading");

    const safeResize = () => {
      requestAnimationFrame(() => {
        if (!disposed) map?.resize();
      });
    };

    void import("maplibre-gl")
      .then(({ default: maplibregl }) => {
        if (disposed || !containerRef.current) return;

        map = new maplibregl.Map({
          container,
          style: mapStyle(variant),
          center: [-51.9253, -14.235],
          zoom: variant === "satellite" ? 12 : 3.4,
          minZoom: 2,
          maxZoom: 18,
          attributionControl: attribution ? {} : false,
          interactive,
        });

        mapRef.current = map;
        resizeObserver = new ResizeObserver(safeResize);
        resizeObserver.observe(container);

        if (interactive) {
          map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-left");
          map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");
        }

        const hydrateMap = async () => {
          if (!map || disposed) return;
          const current = dataRef.current;
          loadedRef.current = true;
          await addLayers(map);
          if (!map || disposed) return;
          if (
            syncData(
              map,
              current.pointData,
              current.routeData,
              current.fitToData && !didFitRef.current,
            )
          ) {
            didFitRef.current = true;
          }
          setMapStatus(fallbackAppliedRef.current ? "fallback" : "ready");
          safeResize();
          window.setTimeout(safeResize, 50);
          window.setTimeout(safeResize, 200);
          window.setTimeout(safeResize, 500);
        };

        map.once("load", () => void hydrateMap());
        map.on("idle", safeResize);
        map.on("error", (event) => {
          const message = event?.error?.message ?? "Erro ao carregar mapa";
          if (!fallbackAppliedRef.current && variant !== "satellite" && map) {
            fallbackAppliedRef.current = true;
            setMapStatus("fallback");
            console.warn(
              "[AgroTorreMap] Tile/style falhou; usando fallback OpenStreetMap.",
              message,
            );
            map.once("style.load", () => void hydrateMap());
            map.setStyle(fallbackRasterStyle());
            return;
          }
          console.warn("[AgroTorreMap] Falha no MapLibre.", message);
          setMapStatus("error");
        });

        map.on("click", "clusters", (event: MapLayerMouseEvent) => {
          if (!map) return;
          const feature = map.queryRenderedFeatures(event.point, { layers: ["clusters"] })[0];
          const clusterId = feature?.properties?.cluster_id;
          const source = map.getSource("points") as GeoJSONSource | undefined;
          if (clusterId === undefined || !source) return;

          source.getClusterExpansionZoom(Number(clusterId)).then((zoom) => {
            if (feature.geometry.type !== "Point" || !map) return;
            map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
          });
        });

        function pointPopup(event: MapLayerMouseEvent) {
          if (!map) return;
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;
          const point = callbacksRef.current.pointLookup.get(String(feature.properties?.id ?? ""));
          if (point) {
            callbacksRef.current.onPointClick?.(point);
            // If a click handler is wired, skip the native popup (panel replaces it).
            if (callbacksRef.current.onPointClick) return;
          }
          const rows = featureRows(feature);
          new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
            .setLngLat(feature.geometry.coordinates as [number, number])
            .setHTML(
              popupHtml(
                String(feature.properties?.label ?? "Ponto"),
                String(
                  feature.properties?.summary ||
                    feature.properties?.description ||
                    feature.properties?.caption ||
                    "",
                ),
                rows,
                String(feature.properties?.href || ""),
              ),
            )
            .addTo(map);
        }

        function routePopup(event: MapLayerMouseEvent) {
          if (!map) return;
          const feature = event.features?.[0];
          if (!feature) return;
          const route = callbacksRef.current.routeLookup.get(String(feature.properties?.id ?? ""));
          if (route) callbacksRef.current.onRouteClick?.(route);
          new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
            .setLngLat(event.lngLat)
            .setHTML(
              popupHtml(
                String(feature.properties?.label ?? "Rota"),
                String(feature.properties?.description ?? ""),
                featureRows(feature),
                String(feature.properties?.href || ""),
              ),
            )
            .addTo(map);
        }

        map.on("click", "unclustered-point", pointPopup);
        map.on("click", "point-label", pointPopup);
        map.on("click", "route-line", routePopup);
        map.on("click", "route-fill", routePopup);
        map.on("click", "route-outline", routePopup);

        const pointerLayers = [
          "clusters",
          "unclustered-point",
          "point-label",
          "route-line",
          "route-fill",
          "route-outline",
        ];
        pointerLayers.forEach((layer) => {
          map?.on("mouseenter", layer, () => {
            map?.getCanvas().style.setProperty("cursor", "pointer");
          });
          map?.on("mouseleave", layer, () => {
            map?.getCanvas().style.setProperty("cursor", "");
          });
        });
      })
      .catch((error) => {
        console.warn("[AgroTorreMap] MapLibre nao carregou no cliente.", error);
        setMapStatus("error");
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      loadedRef.current = false;
      map?.remove();
      mapRef.current = null;
    };
  }, [attribution, interactive, variant]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    // Só enquadra na primeira vez que há dado; depois nunca puxa a câmera de volta.
    if (syncData(map, pointData, routeData, fitToData && !didFitRef.current)) {
      didFitRef.current = true;
    }
    setLastUpdated(new Date());
  }, [fitToData, pointData, routeData]);

  const hasSpatialData = pointData.features.length > 0 || routeData.features.length > 0;
  const sourceLabel = variant === "satellite" ? "Esri World Imagery" : "CARTO / OpenStreetMap";

  return (
    <div
      role="region"
      aria-label={title ? `Mapa: ${title}` : "Mapa operacional"}
      className={cn(
        "relative min-h-[380px] overflow-hidden rounded-xl border border-border bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {mapStatus !== "ready" && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-white/15 bg-slate-950/78 px-3 py-2 text-[11px] text-white/80 shadow-xl backdrop-blur">
          {mapStatus === "loading" && "Carregando mapa..."}
          {mapStatus === "fallback" && "Carregando mapa alternativo..."}
          {mapStatus === "error" && "Tiles indisponiveis no momento"}
        </div>
      )}

      {(title || subtitle || stats.length > 0) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950/90 via-slate-950/45 to-transparent p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {(title || subtitle) && (
              <div className="max-w-md rounded-lg border border-white/20 bg-slate-950/82 px-3 py-2 text-white shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Navigation className="h-3.5 w-3.5 text-blue-300" />
                  {title ?? centerLabel}
                </div>
                {subtitle && <div className="mt-0.5 text-[11px] text-white/72">{subtitle}</div>}
              </div>
            )}

            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-2 lg:flex">
                {stats.map((stat) => {
                  const tone = stat.tone ?? "neutral";
                  return (
                    <div
                      key={stat.label}
                      className="min-w-[108px] rounded-lg border border-white/20 bg-slate-950/82 px-3 py-2 text-white shadow-xl backdrop-blur"
                    >
                      <div className="text-[10px] text-white/65">{stat.label}</div>
                      <div
                        className="mt-1 text-lg font-semibold"
                        style={{ color: toneColor[tone] }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {centerLabel && !title && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-white/20 bg-slate-950/82 px-2 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
          {centerLabel}
        </div>
      )}

      {showLegend && legendItems.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[260px] rounded-lg border border-white/20 bg-slate-950/82 px-3 py-2 text-[10px] text-white backdrop-blur">
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-white/55">
            Legenda
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {legendItems.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/70"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-white/20 bg-slate-950/82 px-2.5 py-1.5 text-[10px] text-white/75 backdrop-blur">
        <RadioTower className="h-3 w-3 text-emerald-300" />
        <span>{sourceLabel}</span>
        <span className="text-white/45">Atualizado {lastUpdated.toLocaleTimeString("pt-BR")}</span>
      </div>

      {!hasSpatialData && (
        <div className="pointer-events-none absolute inset-x-4 bottom-14 z-20 rounded-lg border border-white/20 bg-slate-950/88 px-4 py-3 text-xs text-white/78 backdrop-blur">
          Nenhuma coordenada disponivel para desenhar pontos, talhoes ou rotas. Os registros
          continuam salvos normalmente; adicione GPS ou latitude/longitude para ativa-los no mapa.
        </div>
      )}
    </div>
  );
}

// Retorna true se enquadrou a câmera (fitBounds) — o chamador usa isso para só
// enquadrar uma vez.
function syncData(
  map: MapLibreMap,
  pointData: FeatureCollection<PointFeature>,
  routeData: FeatureCollection<RouteFeature>,
  fitToData: boolean,
): boolean {
  const pointSource = map.getSource("points") as GeoJSONSource | undefined;
  const routeSource = map.getSource("routes") as GeoJSONSource | undefined;
  pointSource?.setData(pointData as GeoJSON.FeatureCollection);
  routeSource?.setData(routeData as GeoJSON.FeatureCollection);

  if (!fitToData) return false;
  const coords = allCoordinates(pointData, routeData);
  if (!coords.length) return false;

  const [[firstLng, firstLat]] = coords;
  const [west, south, east, north] = coords.reduce(
    ([minLng, minLat, maxLng, maxLat], [lng, lat]) => [
      Math.min(minLng, lng),
      Math.min(minLat, lat),
      Math.max(maxLng, lng),
      Math.max(maxLat, lat),
    ],
    [firstLng, firstLat, firstLng, firstLat],
  );
  const nextBounds = [
    [west, south],
    [east, north],
  ] as LngLatBoundsLike;
  map.fitBounds(nextBounds, {
    padding: 72,
    maxZoom: coords.length === 1 ? 12 : 9.5,
    duration: 700,
  });
  return true;
}
