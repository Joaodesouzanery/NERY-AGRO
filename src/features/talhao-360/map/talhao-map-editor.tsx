import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Layers3, LocateFixed, Redo2, Save, Search, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import type { MapBaseStyle, TalhaoRecord } from "@/features/talhao-360/types/domain";
import {
  closeRing,
  parsePolygon,
  polygonAreaHa,
  polygonOutsideVertexCount,
  polygonPerimeterKm,
  polygonPoints,
} from "./geometry";
import { geocodePlace } from "./geocode";
import { mapStyleLabels, nextMapStyle, talhaoMapStyle } from "./map-styles";
import { cn } from "@/lib/utils";

type SaveMetrics = { areaHa: number; perimeterKm: number; outsideVertices: number };

type Props = {
  geometry?: GeoJSON.Polygon | null;
  farmGeometry?: GeoJSON.Polygon | null;
  talhoes: TalhaoRecord[];
  selectedTalhaoId?: string | null;
  disabled?: boolean;
  mode?: "talhao" | "farm";
  kicker?: string; // rótulo do topo da barra lateral (default depende do mode)
  title: string;
  subtitle?: string;
  exportName: string;
  saveLabel: string;
  onSave: (geometry: GeoJSON.Polygon, metrics: SaveMetrics) => void;
};

export function TalhaoMapEditor({
  geometry,
  farmGeometry,
  talhoes,
  selectedTalhaoId,
  disabled,
  mode = "talhao",
  kicker,
  title,
  subtitle,
  exportName,
  saveLabel,
  onSave,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const loadedRef = useRef(false);
  const initialStyleRef = useRef<MapBaseStyle>("satellite");
  const [style, setStyle] = useState<MapBaseStyle>("satellite");
  const initial = useMemo(() => polygonPoints(geometry), [geometry]);
  const [points, setPoints] = useState<Array<[number, number]>>(initial);
  const [history, setHistory] = useState<Array<Array<[number, number]>>>([initial]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const pointsRef = useRef(points);
  const drawingRef = useRef(drawing);
  const disabledRef = useRef(disabled);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const contextRef = useRef({ talhoes, selectedTalhaoId, farmGeometry, mode });

  const areaHa = polygonAreaHa(points);
  const perimeterKm = polygonPerimeterKm(points);
  const draftGeometry: GeoJSON.Polygon | null =
    points.length >= 3 ? { type: "Polygon", coordinates: [closeRing(points)] } : null;
  const outsideVertices =
    mode === "talhao" && draftGeometry && farmGeometry
      ? polygonOutsideVertexCount(draftGeometry, farmGeometry)
      : 0;

  const commit = (next: Array<[number, number]>) => {
    const nextHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), next];
    pointsRef.current = next;
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setPoints(next);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  useEffect(() => {
    pointsRef.current = points;
    drawingRef.current = drawing;
    disabledRef.current = disabled;
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
    contextRef.current = { talhoes, selectedTalhaoId, farmGeometry, mode };
  }, [
    disabled,
    drawing,
    farmGeometry,
    history,
    historyIndex,
    mode,
    points,
    selectedTalhaoId,
    talhoes,
  ]);

  useEffect(() => {
    setPoints(initial);
    setHistory([initial]);
    setHistoryIndex(0);
    pointsRef.current = initial;
    historyRef.current = [initial];
    historyIndexRef.current = 0;
  }, [initial]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;

    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (disposed) return;
      const firstPoint = pointsRef.current[0];
      const map = new maplibregl.Map({
        container,
        style: talhaoMapStyle(initialStyleRef.current),
        center: firstPoint ?? [-50.94, -17.79],
        zoom: pointsRef.current.length ? 14 : 11,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserLocation: true,
        }),
        "top-right",
      );
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 8,
      });

      map.on("load", () => {
        loadedRef.current = true;
        hydrateMap(map);
        syncSources(map, pointsRef.current, contextRef.current);
        renderMarkers(
          map,
          pointsRef.current,
          disabledRef.current,
          drawingRef.current,
          commit,
          markersRef,
        );
        fitInitialBounds(map, pointsRef.current, contextRef.current);
      });

      map.on("click", (event) => {
        if (!drawingRef.current || disabledRef.current) return;
        commit([...pointsRef.current, [event.lngLat.lng, event.lngLat.lat]]);
      });
      map.on("mousemove", "talhoes-fill", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature) return;
        hoverPopup
          .setLngLat(event.lngLat)
          .setHTML(
            `<strong>${escapeHtml(String(feature.properties?.name ?? "Talhão"))}</strong><br/><small>${escapeHtml(String(feature.properties?.summary ?? ""))}</small>`,
          )
          .addTo(map);
      });
      map.on("mouseleave", "talhoes-fill", () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });

      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => map.resize());
      });
      resizeObserver.observe(container);
    });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      clearMarkers(markersRef);
      mapRef.current?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const camera = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };
    map.once("style.load", () => {
      hydrateMap(map);
      map.jumpTo(camera);
      syncSources(map, pointsRef.current, contextRef.current);
    });
    map.setStyle(talhaoMapStyle(style));
  }, [style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    syncSources(map, points, contextRef.current);
    renderMarkers(map, points, disabled, drawing, commit, markersRef);
  }, [points, disabled, drawing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    syncSources(map, pointsRef.current, contextRef.current);
  }, [talhoes, selectedTalhaoId, farmGeometry, mode]);

  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = drawing ? "crosshair" : "";
  }, [drawing]);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const results = await geocodePlace(search);
      if (!results.length) {
        toast.info("Nenhum local encontrado. Tente cidade/UF ou um endereço.");
        return;
      }
      const first = results[0];
      mapRef.current?.flyTo({ center: [first.lng, first.lat], zoom: 15 });
      toast.success(first.label.slice(0, 64));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const exportGeoJson = () => {
    if (!draftGeometry) return toast.error("Desenhe ao menos três vértices.");
    const blob = new Blob([JSON.stringify(draftGeometry, null, 2)], {
      type: "application/geo+json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${exportName || "perimetro"}.geojson`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div className="relative min-h-[540px] overflow-hidden rounded-xl border border-border bg-slate-950">
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        <form
          onSubmit={handleSearch}
          className="absolute left-3 top-3 z-10 flex w-[min(360px,calc(100%-110px))] items-center gap-2 rounded-lg border border-white/15 bg-slate-950/85 p-1.5 backdrop-blur"
        >
          <Search className="ml-1 h-4 w-4 shrink-0 text-white/70" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cidade, endereço ou fazenda..."
            className="h-8 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="h-8 shrink-0 rounded-md bg-white px-3 text-xs font-medium text-slate-900 disabled:opacity-50"
          >
            {searching ? "..." : "Ir"}
          </button>
        </form>

        <div className="absolute left-3 top-[58px] z-10 flex max-w-[calc(100%-24px)] flex-wrap gap-2 rounded-lg border border-white/15 bg-slate-950/85 p-2 backdrop-blur">
          <Tool active={drawing} onClick={() => setDrawing((value) => !value)} icon={LocateFixed}>
            {drawing ? "Finalizar desenho" : "Desenhar"}
          </Tool>
          <Tool
            disabled={historyIndex === 0}
            onClick={() => {
              const next = historyIndex - 1;
              setHistoryIndex(next);
              setPoints(history[next]);
            }}
            icon={Undo2}
          >
            Desfazer
          </Tool>
          <Tool
            disabled={historyIndex >= history.length - 1}
            onClick={() => {
              const next = historyIndex + 1;
              setHistoryIndex(next);
              setPoints(history[next]);
            }}
            icon={Redo2}
          >
            Refazer
          </Tool>
          <Tool onClick={() => commit([])} icon={Trash2}>
            Limpar
          </Tool>
          <Tool onClick={() => setStyle((value) => nextMapStyle(value))} icon={Layers3}>
            {mapStyleLabels[style]}
          </Tool>
        </div>

        {drawing && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-md border border-white/15 bg-slate-950/85 px-3 py-1.5 text-xs text-white backdrop-blur">
            Clique no mapa para marcar os vértices
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">
          {kicker ?? (mode === "farm" ? "Perímetro da fazenda" : "Talhão selecionado")}
        </div>
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-5 grid gap-3">
          <Stat label="Vértices" value={String(points.length)} />
          <Stat
            label="Área calculada"
            value={`${areaHa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`}
          />
          <Stat
            label="Perímetro"
            value={`${perimeterKm.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`}
          />
          <Stat label="Mapa base" value={mapStyleLabels[style]} />
        </div>
        {outsideVertices > 0 && (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            {outsideVertices} vértice(s) do talhão estão fora do perímetro da fazenda. Revise antes
            de salvar.
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          <strong>Desenhar</strong>: clique no mapa para marcar os vértices. Depois,{" "}
          <strong>arraste</strong> os pontos brancos, clique no <strong>+</strong> entre eles para
          inserir vértice e use <strong>clique direito</strong> num ponto para removê-lo.
        </p>
        <button
          type="button"
          disabled={disabled || !draftGeometry}
          onClick={() =>
            draftGeometry && onSave(draftGeometry, { areaHa, perimeterKm, outsideVertices })
          }
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={exportGeoJson}
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Exportar GeoJSON
        </button>
      </aside>
    </div>
  );
}

function hydrateMap(map: MapLibreMap) {
  if (!map.getSource("farm-perimeter")) {
    map.addSource("farm-perimeter", { type: "geojson", data: emptyCollection() });
  }
  if (!map.getLayer("farm-perimeter-fill")) {
    map.addLayer({
      id: "farm-perimeter-fill",
      type: "fill",
      source: "farm-perimeter",
      paint: { "fill-color": "#f59e0b", "fill-opacity": 0.12 },
    });
  }
  if (!map.getLayer("farm-perimeter-line")) {
    map.addLayer({
      id: "farm-perimeter-line",
      type: "line",
      source: "farm-perimeter",
      paint: { "line-color": "#fbbf24", "line-width": 3, "line-dasharray": [2, 1] },
    });
  }
  if (!map.getSource("talhoes")) {
    map.addSource("talhoes", { type: "geojson", data: emptyCollection() });
  }
  if (!map.getLayer("talhoes-fill")) {
    map.addLayer({
      id: "talhoes-fill",
      type: "fill",
      source: "talhoes",
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#16a34a"],
        "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.42, 0.22],
      },
    });
  }
  if (!map.getLayer("talhoes-line")) {
    map.addLayer({
      id: "talhoes-line",
      type: "line",
      source: "talhoes",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#16a34a"],
        "line-width": ["case", ["==", ["get", "selected"], true], 4, 2],
      },
    });
  }
  if (!map.getSource("draft")) {
    map.addSource("draft", { type: "geojson", data: emptyCollection() });
  }
  if (!map.getLayer("draft-fill")) {
    map.addLayer({
      id: "draft-fill",
      type: "fill",
      source: "draft",
      paint: { "fill-color": "#22c55e", "fill-opacity": 0.28 },
    });
  }
  if (!map.getLayer("draft-line")) {
    map.addLayer({
      id: "draft-line",
      type: "line",
      source: "draft",
      paint: { "line-color": "#f8fafc", "line-width": 3, "line-dasharray": [2, 1] },
    });
  }
}

function syncSources(
  map: MapLibreMap,
  points: Array<[number, number]>,
  context: {
    talhoes: TalhaoRecord[];
    selectedTalhaoId?: string | null;
    farmGeometry?: GeoJSON.Polygon | null;
    mode: "talhao" | "farm";
  },
) {
  const { talhoes, selectedTalhaoId, farmGeometry, mode } = context;
  const farmSource = map.getSource("farm-perimeter") as GeoJSONSource | undefined;
  farmSource?.setData(
    mode === "talhao" && farmGeometry ? polygonCollection(farmGeometry, {}) : emptyCollection(),
  );
  const talhoesSource = map.getSource("talhoes") as GeoJSONSource | undefined;
  talhoesSource?.setData(talhaoCollection(talhoes, selectedTalhaoId));
  const draftSource = map.getSource("draft") as GeoJSONSource | undefined;
  draftSource?.setData(draftCollection(points));
}

function fitInitialBounds(
  map: MapLibreMap,
  points: Array<[number, number]>,
  context: {
    talhoes: TalhaoRecord[];
    selectedTalhaoId?: string | null;
    farmGeometry?: GeoJSON.Polygon | null;
  },
) {
  const coords = [
    ...pointsFromCollection(draftCollection(points)),
    ...pointsFromCollection(talhaoCollection(context.talhoes, context.selectedTalhaoId)),
    ...pointsFromCollection(
      context.farmGeometry ? polygonCollection(context.farmGeometry, {}) : emptyCollection(),
    ),
  ];
  if (!coords.length) return;
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
  map.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    { padding: 70, maxZoom: 15, duration: 0 },
  );
}

function clearMarkers(markersRef: React.MutableRefObject<Marker[]>) {
  markersRef.current.forEach((marker) => marker.remove());
  markersRef.current = [];
}

function renderMarkers(
  map: MapLibreMap,
  points: Array<[number, number]>,
  disabled: boolean | undefined,
  drawing: boolean,
  commit: (next: Array<[number, number]>) => void,
  markersRef: React.MutableRefObject<Marker[]>,
) {
  clearMarkers(markersRef);
  void import("maplibre-gl").then(({ default: maplibregl }) => {
    if (!mapRefIs(map)) return;
    points.forEach((point, index) => {
      const marker = new maplibregl.Marker({ draggable: !disabled, color: "#ffffff" })
        .setLngLat(point)
        .addTo(map);
      marker.on("dragend", () => {
        const next = [...points];
        const location = marker.getLngLat();
        next[index] = [location.lng, location.lat];
        commit(next);
      });
      if (!disabled) {
        marker.getElement().addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (points.length <= 3) {
            toast.info("O polígono precisa de pelo menos 3 vértices.");
            return;
          }
          commit(points.filter((_, i) => i !== index));
        });
      }
      markersRef.current.push(marker);
    });

    if (!disabled && !drawing && points.length >= 2) {
      const edges = points.length >= 3 ? points.length : points.length - 1;
      for (let i = 0; i < edges; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const insertIndex = i + 1;
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", "Inserir vértice");
        el.title = "Inserir vértice aqui";
        el.textContent = "+";
        el.style.cssText =
          "width:16px;height:16px;border-radius:9999px;border:1.5px solid #0f172a;background:rgba(255,255,255,.86);color:#0f172a;font-size:13px;line-height:1;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;";
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          const next = [...points];
          next.splice(insertIndex, 0, mid);
          commit(next);
        });
        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat(mid).addTo(map));
      }
    }
  });
}

function mapRefIs(map: MapLibreMap) {
  return Boolean(map);
}

function talhaoCollection(
  talhoes: TalhaoRecord[],
  selectedId?: string | null,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: talhoes.flatMap((item) => {
      const geometry = parsePolygon(item.payload.geometry_geojson);
      if (!geometry) return [];
      return [
        {
          type: "Feature",
          geometry,
          properties: {
            id: item.id,
            selected: item.id === selectedId,
            color: item.payload.cor_mapa || "#16a34a",
            name: item.payload.talhao,
            summary: `${item.payload.area_ha || "—"} ha · ${item.payload.cultura || "Sem cultura"} · ${item.payload.status || "Sem status"}`,
          },
        } satisfies GeoJSON.Feature,
      ];
    }),
  };
}

function draftCollection(points: Array<[number, number]>): GeoJSON.FeatureCollection {
  return points.length >= 3
    ? polygonCollection({ type: "Polygon", coordinates: [closeRing(points)] }, {})
    : emptyCollection();
}

function polygonCollection(
  geometry: GeoJSON.Polygon,
  properties: Record<string, string | number | boolean>,
): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry, properties }] };
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function pointsFromCollection(collection: GeoJSON.FeatureCollection) {
  return collection.features.flatMap((feature) => {
    if (feature.geometry.type !== "Polygon") return [];
    return feature.geometry.coordinates[0] as Array<[number, number]>;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function Tool({
  icon: Icon,
  children,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-slate-900/90 px-3 text-xs font-medium text-white disabled:opacity-40",
        active && "bg-emerald-600",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}
