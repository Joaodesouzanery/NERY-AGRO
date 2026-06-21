import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-D1uahgUG.mjs";
import { U as Navigation, Z as RadioTower } from "../_libs/lucide-react.mjs";
const toneColor = {
  primary: "#4f8cff",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  neutral: "#64748b"
};
const moduleIconConfig = {
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
  "analise-solo": { label: "A", color: "#f97316" }
};
const mapIconConfig = {
  ...moduleIconConfig,
  torre: { label: "CT", color: "#60a5fa" },
  logistica: { label: "TR", color: "#3b82f6" },
  financeiro: { label: "$", color: "#22c55e" },
  campo: { label: "AG", color: "#84cc16" },
  pecuaria: { label: "QR", color: "#a855f7" },
  sustentabilidade: { label: "CO2", color: "#10b981" },
  inteligencia: { label: "AI", color: "#06b6d4" },
  cogs: { label: "COG", color: "#f59e0b" },
  otimizacao: { label: "COG", color: "#f59e0b" }
};
const defaultFallbackBounds = {
  west: -46.72,
  south: -23.62,
  east: -46.54,
  north: -23.48
};
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function lngLatFrom(point, fallbackBounds = defaultFallbackBounds) {
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
function mapStyle(variant) {
  if (variant === "satellite") {
    return {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 256,
          attribution: "Tiles &copy; Esri"
        }
      },
      layers: [{ id: "satellite", type: "raster", source: "satellite" }]
    };
  }
  const cartoVariant = variant === "dark" ? "dark_all" : variant === "positron" ? "light_all" : "rastertiles/voyager";
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
          `https://d.basemaps.cartocdn.com/${cartoVariant}/{z}/{x}/{y}@2x.png`
        ],
        tileSize: 256,
        attribution: "&copy; CARTO &copy; OpenStreetMap contributors"
      }
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }]
  };
}
function fallbackRasterStyle() {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osmFallback: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors"
      }
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
          "raster-saturation": -0.75
        }
      }
    ]
  };
}
function glyphFor(point) {
  const raw = String(
    point.iconKey ?? point.moduleId ?? point.icon ?? point.category ?? point.sourceModule ?? point.meta?.tipo ?? ""
  ).toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
  return mapIconConfig[raw]?.label ?? raw.slice(0, 2).toUpperCase() ?? "P";
}
function iconKeyFor(point) {
  const raw = String(
    point.iconKey ?? point.moduleId ?? point.icon ?? point.category ?? point.sourceModule ?? "alerta"
  ).toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
  return mapIconConfig[raw] ? raw : "alerta";
}
function iconSvg(key) {
  const config = mapIconConfig[key] ?? mapIconConfig.alerta;
  const text = escapeHtml(config.label);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.4" flood-color="#020617" flood-opacity=".55"/>
      </filter>
      <path filter="url(#s)" d="M21 3c8.2 0 14.8 6.4 14.8 14.2 0 10.2-14.8 18.8-14.8 18.8S6.2 27.4 6.2 17.2C6.2 9.4 12.8 3 21 3Z" fill="${config.color}" stroke="#ffffff" stroke-width="2.6"/>
      <circle cx="21" cy="17" r="10.5" fill="rgba(2,6,23,.3)"/>
      <path d="M13 26h16" stroke="rgba(255,255,255,.85)" stroke-width="2" stroke-linecap="round"/>
      <text x="21" y="20.4" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="${config.label.length > 2 ? 7.6 : config.label.length > 1 ? 9.4 : 12.8}" font-weight="800" fill="white" stroke="rgba(2,6,23,.55)" stroke-width="0.5">${text}</text>
    </svg>
  `)}`;
}
function popupHtml(title, description, rows = [], href) {
  const rowHtml = rows.map(
    ([key, value]) => `<div class="nery-map-popup-row"><span>${escapeHtml(key.replace(/_/g, " "))}</span><strong>${escapeHtml(value)}</strong></div>`
  ).join("");
  return `
    <div class="nery-map-popup">
      <div class="nery-map-popup-title">${escapeHtml(title)}</div>
      ${description ? `<div class="nery-map-popup-desc">${escapeHtml(description)}</div>` : ""}
      ${rowHtml ? `<div class="nery-map-popup-list">${rowHtml}</div>` : ""}
      ${href ? `<a class="nery-map-popup-link" href="${escapeHtml(href)}">Abrir modulo</a>` : ""}
    </div>
  `;
}
function pointCollection(points, fallbackBounds) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => {
      const coordinates = lngLatFrom(point, fallbackBounds);
      if (!coordinates) return null;
      const tone = point.tone ?? "primary";
      const metrics = Object.entries(point.metrics ?? {}).filter(
        ([, value]) => value !== void 0 && value !== ""
      );
      const rows = {
        ...point.moduleLabel ? { Modulo: point.moduleLabel } : {},
        ...point.status ? { Status: point.status } : {},
        ...point.severity ? { Severidade: point.severity } : {},
        ...Object.fromEntries(metrics),
        ...point.meta ?? {}
      };
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates },
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
          meta: JSON.stringify(rows)
        }
      };
    }).filter((feature) => Boolean(feature))
  };
}
function routeCollection(routes, fallbackBounds) {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => {
      if (route.geometry?.type === "LineString") {
        const coordinates2 = route.geometry.coordinates;
        return routeFeature(route, { type: "LineString", coordinates: coordinates2 });
      }
      if (route.geometry?.type === "Polygon") {
        const coordinates2 = route.geometry.coordinates;
        return routeFeature(route, { type: "Polygon", coordinates: coordinates2 });
      }
      const coordinates = route.points.map((point) => lngLatFrom(point, fallbackBounds)).filter((coord) => Boolean(coord));
      if (coordinates.length < 2) return null;
      if ((route.shape === "polygon" || route.points.length >= 3) && coordinates.length >= 3) {
        const ring = [...coordinates];
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
        return routeFeature(route, { type: "Polygon", coordinates: [ring] });
      }
      return routeFeature(route, { type: "LineString", coordinates });
    }).filter((feature) => Boolean(feature))
  };
}
function routeFeature(route, geometry) {
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
      meta: JSON.stringify(route.meta ?? {})
    }
  };
}
function allCoordinates(points, routes) {
  const coords = [];
  points.features.forEach((feature) => coords.push(feature.geometry.coordinates));
  routes.features.forEach((feature) => {
    if (feature.geometry.type === "LineString") coords.push(...feature.geometry.coordinates);
    else feature.geometry.coordinates.forEach((ring) => coords.push(...ring));
  });
  return coords;
}
function parseMeta(value) {
  try {
    return Object.entries(JSON.parse(String(value || "{}")));
  } catch {
    return [];
  }
}
function featureRows(feature) {
  return parseMeta(feature.properties?.meta);
}
function addLayerIfMissing(map, layer) {
  if (!map.getLayer(layer.id)) map.addLayer(layer);
}
async function addLayers(map) {
  await addModuleIcons(map);
  if (!map.getSource("routes")) {
    map.addSource("routes", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }
  if (!map.getSource("points")) {
    map.addSource("points", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 56
    });
  }
  addLayerIfMissing(map, {
    id: "route-fill",
    type: "fill",
    source: "routes",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.18
    }
  });
  addLayerIfMissing(map, {
    id: "route-outline",
    type: "line",
    source: "routes",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": ["get", "color"],
      "line-width": 2,
      "line-opacity": 0.9
    }
  });
  addLayerIfMissing(map, {
    id: "route-line",
    type: "line",
    source: "routes",
    filter: ["==", ["geometry-type"], "LineString"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 10, 4, 15, 7],
      "line-opacity": 0.86
    }
  });
  addLayerIfMissing(map, {
    id: "clusters",
    type: "circle",
    source: "points",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#3b82f6", 8, "#f59e0b", 18, "#ef4444"],
      "circle-radius": ["step", ["get", "point_count"], 18, 8, 23, 18, 30],
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.85)"
    }
  });
  addLayerIfMissing(map, {
    id: "cluster-count",
    type: "symbol",
    source: "points",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
      "text-size": 12,
      "text-allow-overlap": true
    },
    paint: { "text-color": "#ffffff" }
  });
  addLayerIfMissing(map, {
    id: "unclustered-point-halo",
    type: "circle",
    source: "points",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "rgba(2,6,23,0.62)",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 15, 10, 19, 15, 24],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "rgba(255,255,255,0.4)",
      "circle-opacity": 0.88
    }
  });
  addLayerIfMissing(map, {
    id: "unclustered-point",
    type: "symbol",
    source: "points",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["get", "iconKey"],
      "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.72, 10, 0.95, 15, 1.15],
      "icon-allow-overlap": false,
      "icon-ignore-placement": false,
      "symbol-sort-key": [
        "case",
        ["==", ["get", "tone"], "danger"],
        10,
        ["==", ["get", "tone"], "warning"],
        8,
        1
      ]
    }
  });
  addLayerIfMissing(map, {
    id: "point-label",
    type: "symbol",
    source: "points",
    filter: ["!", ["has", "point_count"]],
    minzoom: 9,
    layout: {
      "text-field": ["get", "label"],
      "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 14, 12],
      "text-offset": [0, 1.45],
      "text-anchor": "top",
      "text-max-width": 12,
      "text-optional": true,
      "text-allow-overlap": false,
      "text-ignore-placement": false
    },
    paint: {
      "text-color": "#f8fafc",
      "text-halo-color": "rgba(2,6,23,0.88)",
      "text-halo-width": 1.3
    }
  });
}
function addModuleIcons(map) {
  const pending = Object.keys(mapIconConfig).filter((key) => !map.hasImage(key)).map(
    (key) => new Promise((resolve) => {
      const image = new Image(42, 42);
      image.onload = () => {
        if (!map.hasImage(key)) map.addImage(key, image, { pixelRatio: 2 });
        resolve();
      };
      image.onerror = () => resolve();
      image.src = iconSvg(key);
    })
  );
  return Promise.all(pending).then(() => void 0);
}
function InteractiveMap({
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
  onRouteClick
}) {
  const containerRef = reactExports.useRef(null);
  const mapRef = reactExports.useRef(null);
  const loadedRef = reactExports.useRef(false);
  const fallbackAppliedRef = reactExports.useRef(false);
  const [lastUpdated, setLastUpdated] = reactExports.useState(() => /* @__PURE__ */ new Date());
  const [mapStatus, setMapStatus] = reactExports.useState("loading");
  const pointData = reactExports.useMemo(
    () => pointCollection(points, fallbackBounds),
    [points, fallbackBounds]
  );
  const routeData = reactExports.useMemo(
    () => routeCollection(routes, fallbackBounds),
    [routes, fallbackBounds]
  );
  const pointLookup = reactExports.useMemo(() => new Map(points.map((point) => [point.id, point])), [points]);
  const routeLookup = reactExports.useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);
  const callbacksRef = reactExports.useRef({ onPointClick, onRouteClick, pointLookup, routeLookup });
  const dataRef = reactExports.useRef({ pointData, routeData, fitToData });
  reactExports.useEffect(() => {
    callbacksRef.current = { onPointClick, onRouteClick, pointLookup, routeLookup };
  }, [onPointClick, onRouteClick, pointLookup, routeLookup]);
  reactExports.useEffect(() => {
    dataRef.current = { pointData, routeData, fitToData };
  }, [fitToData, pointData, routeData]);
  reactExports.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let resizeObserver;
    let map = null;
    fallbackAppliedRef.current = false;
    loadedRef.current = false;
    setMapStatus("loading");
    const safeResize = () => {
      requestAnimationFrame(() => {
        if (!disposed) map?.resize();
      });
    };
    void import("../_libs/maplibre-gl.mjs").then(function(n) {
      return n.m;
    }).then(({ default: maplibregl }) => {
      if (disposed || !containerRef.current) return;
      map = new maplibregl.Map({
        container,
        style: mapStyle(variant),
        center: [-51.9253, -14.235],
        zoom: variant === "satellite" ? 12 : 3.4,
        minZoom: 2,
        maxZoom: 18,
        attributionControl: attribution ? {} : false,
        interactive
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
        syncData(map, current.pointData, current.routeData, current.fitToData);
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
          console.warn("[NeryMap] Tile/style falhou; usando fallback OpenStreetMap.", message);
          map.once("style.load", () => void hydrateMap());
          map.setStyle(fallbackRasterStyle());
          return;
        }
        console.warn("[NeryMap] Falha no MapLibre.", message);
        setMapStatus("error");
      });
      map.on("click", "clusters", (event) => {
        if (!map) return;
        const feature = map.queryRenderedFeatures(event.point, { layers: ["clusters"] })[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource("points");
        if (clusterId === void 0 || !source) return;
        source.getClusterExpansionZoom(Number(clusterId)).then((zoom) => {
          if (feature.geometry.type !== "Point" || !map) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
      });
      function pointPopup(event) {
        if (!map) return;
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const point = callbacksRef.current.pointLookup.get(String(feature.properties?.id ?? ""));
        if (point) {
          callbacksRef.current.onPointClick?.(point);
          if (callbacksRef.current.onPointClick) return;
        }
        const rows = featureRows(feature);
        new maplibregl.Popup({ closeButton: true, maxWidth: "320px" }).setLngLat(feature.geometry.coordinates).setHTML(
          popupHtml(
            String(feature.properties?.label ?? "Ponto"),
            String(
              feature.properties?.summary || feature.properties?.description || feature.properties?.caption || ""
            ),
            rows,
            String(feature.properties?.href || "")
          )
        ).addTo(map);
      }
      function routePopup(event) {
        if (!map) return;
        const feature = event.features?.[0];
        if (!feature) return;
        const route = callbacksRef.current.routeLookup.get(String(feature.properties?.id ?? ""));
        if (route) callbacksRef.current.onRouteClick?.(route);
        new maplibregl.Popup({ closeButton: true, maxWidth: "320px" }).setLngLat(event.lngLat).setHTML(
          popupHtml(
            String(feature.properties?.label ?? "Rota"),
            String(feature.properties?.description ?? ""),
            featureRows(feature),
            String(feature.properties?.href || "")
          )
        ).addTo(map);
      }
      map.on("click", "unclustered-point", pointPopup);
      map.on("click", "unclustered-point-halo", pointPopup);
      map.on("click", "point-label", pointPopup);
      map.on("click", "route-line", routePopup);
      map.on("click", "route-fill", routePopup);
      map.on("click", "route-outline", routePopup);
      const pointerLayers = [
        "clusters",
        "unclustered-point",
        "unclustered-point-halo",
        "point-label",
        "route-line",
        "route-fill",
        "route-outline"
      ];
      pointerLayers.forEach((layer) => {
        map?.on("mouseenter", layer, () => {
          map?.getCanvas().style.setProperty("cursor", "pointer");
        });
        map?.on("mouseleave", layer, () => {
          map?.getCanvas().style.setProperty("cursor", "");
        });
      });
    }).catch((error) => {
      console.warn("[NeryMap] MapLibre nao carregou no cliente.", error);
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
  reactExports.useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    syncData(map, pointData, routeData, fitToData);
    setLastUpdated(/* @__PURE__ */ new Date());
  }, [fitToData, pointData, routeData]);
  const hasSpatialData = pointData.features.length > 0 || routeData.features.length > 0;
  const sourceLabel = variant === "satellite" ? "Esri World Imagery" : "CARTO / OpenStreetMap";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "relative min-h-[380px] overflow-hidden rounded-xl border border-border bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.12)]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, className: "absolute inset-0" }),
        mapStatus !== "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-white/15 bg-slate-950/78 px-3 py-2 text-[11px] text-white/80 shadow-xl backdrop-blur", children: [
          mapStatus === "loading" && "Carregando mapa...",
          mapStatus === "fallback" && "Carregando mapa alternativo...",
          mapStatus === "error" && "Tiles indisponiveis no momento"
        ] }),
        (title || subtitle || stats.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950/90 via-slate-950/45 to-transparent p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          (title || subtitle) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md rounded-lg border border-white/20 bg-slate-950/82 px-3 py-2 text-white shadow-xl backdrop-blur", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Navigation, { className: "h-3.5 w-3.5 text-blue-300" }),
              title ?? centerLabel
            ] }),
            subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[11px] text-white/72", children: subtitle })
          ] }),
          stats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 lg:flex", children: stats.map((stat) => {
            const tone = stat.tone ?? "neutral";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "min-w-[108px] rounded-lg border border-white/20 bg-slate-950/82 px-3 py-2 text-white shadow-xl backdrop-blur",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-white/65", children: stat.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "mt-1 text-lg font-semibold",
                      style: { color: toneColor[tone] },
                      children: stat.value
                    }
                  )
                ]
              },
              stat.label
            );
          }) })
        ] }) }),
        centerLabel && !title && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-white/20 bg-slate-950/82 px-2 py-1 text-xs font-medium text-white shadow-sm backdrop-blur", children: centerLabel }),
        showLegend && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 rounded-lg border border-white/20 bg-slate-950/82 px-3 py-2 text-[10px] text-white backdrop-blur", children: ["primary", "success", "warning", "danger", "info"].map((tone) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "h-2.5 w-2.5 rounded-full",
              style: { backgroundColor: toneColor[tone] }
            }
          ),
          tone
        ] }, tone)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute bottom-3 right-3 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-white/20 bg-slate-950/82 px-2.5 py-1.5 text-[10px] text-white/75 backdrop-blur", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RadioTower, { className: "h-3 w-3 text-emerald-300" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: sourceLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/45", children: [
            "Atualizado ",
            lastUpdated.toLocaleTimeString("pt-BR")
          ] })
        ] }),
        !hasSpatialData && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-4 bottom-14 z-20 rounded-lg border border-white/20 bg-slate-950/88 px-4 py-3 text-xs text-white/78 backdrop-blur", children: "Nenhuma coordenada disponivel para desenhar pontos, talhoes ou rotas. Os registros continuam salvos normalmente; adicione GPS ou latitude/longitude para ativa-los no mapa." })
      ]
    }
  );
}
function syncData(map, pointData, routeData, fitToData) {
  const pointSource = map.getSource("points");
  const routeSource = map.getSource("routes");
  pointSource?.setData(pointData);
  routeSource?.setData(routeData);
  if (!fitToData) return;
  const coords = allCoordinates(pointData, routeData);
  if (!coords.length) return;
  const [[firstLng, firstLat]] = coords;
  const [west, south, east, north] = coords.reduce(
    ([minLng, minLat, maxLng, maxLat], [lng, lat]) => [
      Math.min(minLng, lng),
      Math.min(minLat, lat),
      Math.max(maxLng, lng),
      Math.max(maxLat, lat)
    ],
    [firstLng, firstLat, firstLng, firstLat]
  );
  const nextBounds = [
    [west, south],
    [east, north]
  ];
  map.fitBounds(nextBounds, {
    padding: 72,
    maxZoom: coords.length === 1 ? 12 : 9.5,
    duration: 700
  });
}
export {
  InteractiveMap as I
};
