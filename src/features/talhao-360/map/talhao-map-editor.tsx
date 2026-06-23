import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  Layers3,
  MapPinned,
  MousePointer2,
  Plus,
  Redo2,
  Save,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type { GeoJSONSource, Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import {
  closeRing,
  isValidPolygon,
  parsePolygon,
  polygonAreaHa,
  polygonCentroid,
  polygonPerimeterKm,
  polygonPoints,
  polygonsOverlap,
  polygonWithin,
} from "./geometry";
import { geocode, mapProvider, type MapBaseStyle } from "./provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type EditorMode = "select" | "farm" | "field";
type Snapshot = { points: Array<[number, number]>; closed: boolean };

// Translucent blue for the farm perimeter draft (the saved farm stays subtle so
// talhões drawn inside remain visible).
const FARM_DRAFT_COLOR = "#38bdf8";
const DEFAULT_FIELD_COLOR = "#16a34a";

type Props = {
  talhao: TalhaoRecord;
  talhoes: TalhaoRecord[];
  newFieldColor?: string;
  disabled?: boolean;
  // Farm-level mode (the hub map): hides the per-talhão actions and focuses on
  // drawing the farm perimeter and creating new talhões.
  farmLevel?: boolean;
  // Bumping this value makes the editor jump into "draw a new talhão" mode
  // (used by the create dialog's "Desenhar no mapa" button).
  drawFieldSignal?: number;
  // Bumping this value makes the editor jump into "draw/edit farm" mode.
  drawFarmSignal?: number;
  onSelectField?: (fieldId: string) => void;
  onSaveField: (
    geometry: GeoJSON.Polygon,
    metrics: { areaHa: number; perimeterKm: number },
  ) => void;
  onSaveFarm: (geometry: GeoJSON.Polygon, metrics: { areaHa: number; perimeterKm: number }) => void;
  onCreateField: (
    geometry: GeoJSON.Polygon,
    metrics: { areaHa: number; perimeterKm: number },
  ) => void;
  onDeleteField?: () => void;
  onDeleteFarm?: () => void;
};

export function TalhaoMapEditor({
  talhao,
  talhoes,
  newFieldColor,
  disabled,
  farmLevel,
  drawFieldSignal,
  drawFarmSignal,
  onSelectField,
  onSaveField,
  onSaveFarm,
  onCreateField,
  onDeleteField,
  onDeleteFarm,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [style, setStyle] = useState<MapBaseStyle>("satellite");
  const [mode, setMode] = useState<EditorMode>("select");
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<null | "field" | "farm">(null);
  const fieldPoints = useMemo(
    () => polygonPoints(parsePolygon(talhao.payload.geometry_geojson)),
    [talhao.payload.geometry_geojson],
  );
  const farmPoints = useMemo(
    () => polygonPoints(parsePolygon(talhao.payload.farm_geometry_geojson)),
    [talhao.payload.farm_geometry_geojson],
  );
  const [points, setPoints] = useState<Array<[number, number]>>(fieldPoints);
  // A polygon is only "closed" (area finalized) once the user joins the last
  // vertex back to the first. Existing geometry loads already closed.
  const [closed, setClosed] = useState(fieldPoints.length >= 3);
  const [history, setHistory] = useState<Snapshot[]>([
    { points: fieldPoints, closed: fieldPoints.length >= 3 },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  // Color used to fill the in-progress (and closed) draft polygon.
  const [draftColor, setDraftColor] = useState(
    talhao.payload.cor_mapa || newFieldColor || DEFAULT_FIELD_COLOR,
  );
  const pointsRef = useRef(points);
  const closedRef = useRef(closed);
  const draftColorRef = useRef(draftColor);
  const modeRef = useRef(mode);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const onSelectFieldRef = useRef(onSelectField);
  const disabledRef = useRef(disabled);
  const talhoesRef = useRef(talhoes);
  const styleRef = useRef(style);
  const farmPointsRef = useRef(farmPoints);
  const talhaoIdRef = useRef(talhao.id);

  const areaHa = closed ? polygonAreaHa(points) : 0;
  const perimeterKm = closed ? polygonPerimeterKm(points) : 0;
  const valid = closed && isValidPolygon(points);
  const containmentValid =
    mode !== "field" || farmPoints.length < 3 || polygonWithin(points, farmPoints);
  const overlap = useMemo(
    () =>
      mode === "field" &&
      talhoes.some((item) => {
        if (item.id === talhao.id) return false;
        return polygonsOverlap(points, polygonPoints(parsePolygon(item.payload.geometry_geojson)));
      }),
    [mode, points, talhao.id, talhoes],
  );

  const commit = (nextPoints: Array<[number, number]>, nextClosed: boolean) => {
    const snapshot: Snapshot = { points: nextPoints, closed: nextClosed };
    const nextHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), snapshot];
    pointsRef.current = nextPoints;
    closedRef.current = nextClosed;
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setPoints(nextPoints);
    setClosed(nextClosed);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const restore = (snapshot: Snapshot, index: number) => {
    pointsRef.current = snapshot.points;
    closedRef.current = snapshot.closed;
    historyIndexRef.current = index;
    setPoints(snapshot.points);
    setClosed(snapshot.closed);
    setHistoryIndex(index);
  };

  const activateMode = (nextMode: EditorMode, useExisting = true) => {
    const next =
      nextMode === "farm"
        ? useExisting
          ? farmPoints
          : []
        : nextMode === "field"
          ? useExisting
            ? fieldPoints
            : []
          : fieldPoints;
    const nextClosed = next.length >= 3;
    const snapshot: Snapshot = { points: next, closed: nextClosed };
    // Farm draft is blue; editing a field keeps its own color; a brand-new field
    // takes the next distinct color.
    const nextColor =
      nextMode === "farm"
        ? FARM_DRAFT_COLOR
        : nextMode === "field"
          ? useExisting
            ? talhao.payload.cor_mapa || newFieldColor || DEFAULT_FIELD_COLOR
            : newFieldColor || DEFAULT_FIELD_COLOR
          : draftColorRef.current;
    setMode(nextMode);
    modeRef.current = nextMode;
    setPoints(next);
    pointsRef.current = next;
    setClosed(nextClosed);
    closedRef.current = nextClosed;
    setDraftColor(nextColor);
    draftColorRef.current = nextColor;
    setHistory([snapshot]);
    historyRef.current = [snapshot];
    setHistoryIndex(0);
    historyIndexRef.current = 0;
  };

  useEffect(() => {
    pointsRef.current = points;
    closedRef.current = closed;
    draftColorRef.current = draftColor;
    modeRef.current = mode;
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [closed, draftColor, history, historyIndex, mode, points]);

  // Keep callback/prop refs fresh without re-creating the map (which would
  // otherwise stack duplicate click listeners on every parent re-render).
  useEffect(() => {
    onSelectFieldRef.current = onSelectField;
    disabledRef.current = disabled;
    talhoesRef.current = talhoes;
    styleRef.current = style;
    farmPointsRef.current = farmPoints;
    talhaoIdRef.current = talhao.id;
  });

  // Start drawing a new talhão when the parent bumps drawFieldSignal.
  const drawSignalRef = useRef(drawFieldSignal);
  useEffect(() => {
    if (drawFieldSignal === undefined || drawFieldSignal === drawSignalRef.current) return;
    drawSignalRef.current = drawFieldSignal;
    activateMode("field", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFieldSignal]);

  // Start drawing/editing the farm perimeter when the parent bumps drawFarmSignal.
  const drawFarmSignalRef = useRef(drawFarmSignal);
  useEffect(() => {
    if (drawFarmSignal === undefined || drawFarmSignal === drawFarmSignalRef.current) return;
    drawFarmSignalRef.current = drawFarmSignal;
    activateMode("farm");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFarmSignal]);

  // Install our overlay sources + layers. Reusable so it runs on the initial
  // load and again after setStyle (which wipes style-owned sources/layers).
  // Reads live values from refs, so it stays stable across renders.
  const installOverlays = useCallback((map: MapLibreMap) => {
    if (map.getSource("draft")) return;
    map.addSource("farm", { type: "geojson", data: farmCollection(farmPointsRef.current) });
    map.addLayer({
      id: "farm-fill",
      type: "fill",
      source: "farm",
      paint: { "fill-color": "#ffffff", "fill-opacity": 0.06 },
    });
    map.addLayer({
      id: "farm-line",
      type: "line",
      source: "farm",
      paint: { "line-color": "#ffffff", "line-width": 3, "line-dasharray": [2, 1] },
    });
    map.addSource("talhoes", {
      type: "geojson",
      data: collection(talhoesRef.current, talhaoIdRef.current),
    });
    map.addLayer({
      id: "talhoes-fill",
      type: "fill",
      source: "talhoes",
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#16a34a"],
        "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.52, 0.32],
      },
    });
    map.addLayer({
      id: "talhoes-line",
      type: "line",
      source: "talhoes",
      paint: {
        "line-color": ["case", ["==", ["get", "selected"], true], "#ffffff", ["get", "color"]],
        "line-width": ["case", ["==", ["get", "selected"], true], 4, 2],
      },
    });
    map.addSource("draft", {
      type: "geojson",
      data: draftCollection(
        pointsRef.current,
        modeRef.current,
        closedRef.current,
        draftColorRef.current,
      ),
    });
    map.addLayer({
      id: "draft-fill",
      type: "fill",
      source: "draft",
      paint: {
        "fill-color": ["coalesce", ["get", "color"], DEFAULT_FIELD_COLOR],
        "fill-opacity": 0.45,
      },
    });
    map.addLayer({
      id: "draft-line",
      type: "line",
      source: "draft",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#ffffff"],
        "line-width": 3,
        "line-dasharray": [2, 1],
      },
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (disposed) return;
      const allPoints = farmPoints.length ? farmPoints : fieldPoints;
      const map = new maplibregl.Map({
        container,
        style: mapProvider.style(styleRef.current),
        center: polygonCentroid(allPoints),
        zoom: allPoints.length ? 14 : 11,
        attributionControl: {},
      });
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
      mapRef.current = map;
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 8,
      });
      // Add a vertex where the user clicks. MapLibre's own click event gives an
      // accurate lng/lat, ignores drag-pans, and is torn down with map.remove().
      // A closed polygon no longer accepts new vertices (edit by dragging).
      map.on("click", (event) => {
        if (modeRef.current === "select" || disabledRef.current || closedRef.current) return;
        commit([...pointsRef.current, [event.lngLat.lng, event.lngLat.lat]], false);
      });

      // Delegated layer interactions: registered once, they keep working after
      // setStyle re-creates the layers (MapLibre queries features at event time).
      map.on("mousemove", "talhoes-fill", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature) return;
        popupRef.current
          ?.setLngLat(event.lngLat)
          .setHTML(String(feature.properties?.html ?? ""))
          .addTo(map);
      });
      map.on("mouseleave", "talhoes-fill", () => {
        map.getCanvas().style.cursor = modeRef.current === "select" ? "" : "crosshair";
        popupRef.current?.remove();
      });
      map.on("click", "talhoes-fill", (event) => {
        if (modeRef.current !== "select") return;
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") onSelectFieldRef.current?.(id);
      });

      map.on("load", () => installOverlays(map));
    });
    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [farmPoints, fieldPoints, installOverlays, talhao.id]);

  // Switch the basemap in place. Recreating the map would reset the camera and
  // wipe the in-progress drawing; setStyle keeps both (markers are DOM elements,
  // and the overlays are re-installed once the new style finishes loading).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mapProvider.style(style));
    const onStyleLoad = () => installOverlays(map);
    map.once("style.load", onStyleLoad);
    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [installOverlays, style]);

  // Refresh the neighbouring talhões layer without rebuilding the whole map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () =>
      (map.getSource("talhoes") as GeoJSONSource | undefined)?.setData(
        collection(talhoesRef.current, talhao.id),
      );
    if (map.isStyleLoaded()) update();
    else map.once("load", update);
  }, [talhoes, talhao.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    const render = () => {
      if (cancelled) return;
      map.getCanvas().style.cursor = mode === "select" ? "" : "crosshair";
      (map.getSource("draft") as GeoJSONSource | undefined)?.setData(
        draftCollection(points, mode, closed, draftColor),
      );
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (mode === "select") return;
      void import("maplibre-gl").then(({ default: maplibregl }) => {
        if (!mapRef.current || cancelled) return;
        const created: Marker[] = [];
        // Vertex handles: drag to move, right-click to remove.
        points.forEach((point, index) => {
          const isFirst = index === 0;
          const marker = new maplibregl.Marker({
            draggable: !disabled,
            color: isFirst ? "#f59e0b" : "#ffffff",
          })
            .setLngLat(point)
            .addTo(mapRef.current as MapLibreMap);
          const element = marker.getElement();
          if (isFirst && !closed) {
            // While open, the amber first vertex is the "close" handle.
            element.style.cursor = "pointer";
            element.title = "Clique para fechar o polígono";
            element.addEventListener("click", (event) => {
              event.stopPropagation();
              if (pointsRef.current.length >= 3 && !closedRef.current) {
                commit(pointsRef.current, true);
              }
            });
          } else if (!disabled) {
            element.title = "Arraste para mover · clique direito para remover";
          }
          if (!disabled) {
            element.addEventListener("contextmenu", (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (pointsRef.current.length > 3) {
                commit(
                  pointsRef.current.filter((_, idx) => idx !== index),
                  closedRef.current,
                );
              }
            });
          }
          marker.on("dragend", () => {
            const next = [...pointsRef.current];
            const location = marker.getLngLat();
            next[index] = [location.lng, location.lat];
            commit(next, closedRef.current);
          });
          created.push(marker);
        });
        // Midpoint handles on a closed ring: click to insert a vertex on that
        // edge, so a finished perimeter can still be reshaped in detail.
        if (closed && !disabled && points.length >= 3) {
          points.forEach((point, index) => {
            const neighbour = points[(index + 1) % points.length];
            const mid: [number, number] = [
              (point[0] + neighbour[0]) / 2,
              (point[1] + neighbour[1]) / 2,
            ];
            const element = document.createElement("div");
            element.title = "Clique para adicionar um vértice aqui";
            element.style.cssText =
              "width:12px;height:12px;border-radius:9999px;background:rgba(255,255,255,0.7);border:2px solid #0f172a;cursor:copy;box-shadow:0 0 0 1px rgba(255,255,255,0.55)";
            element.addEventListener("click", (event) => {
              event.stopPropagation();
              const current = [...pointsRef.current];
              const a = current[index];
              const b = current[(index + 1) % current.length];
              current.splice(index + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
              commit(current, closedRef.current);
            });
            created.push(
              new maplibregl.Marker({ element })
                .setLngLat(mid)
                .addTo(mapRef.current as MapLibreMap),
            );
          });
        }
        markersRef.current = created;
      });
    };
    if (map.isStyleLoaded()) render();
    else map.once("load", render);
    return () => {
      cancelled = true;
      map.off("load", render);
    };
  }, [closed, disabled, draftColor, mode, points]);

  const geometry = (): GeoJSON.Polygon => ({
    type: "Polygon",
    coordinates: [closeRing(points)],
  });

  const exportGeoJson = () => {
    if (!valid) return toast.error("Finalize um polígono válido antes de exportar.");
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: geometry(),
      properties: {
        tipo: mode === "farm" ? "fazenda" : "talhao",
        nome: mode === "farm" ? talhao.payload.fazenda : talhao.payload.talhao,
        area_ha: areaHa,
        perimetro_km: perimeterKm,
      },
    };
    const blob = new Blob([JSON.stringify(feature, null, 2)], { type: "application/geo+json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${mode === "farm" ? "fazenda" : talhao.payload.codigo || "talhao"}.geojson`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const [searching, setSearching] = useState(false);
  const locate = async () => {
    const term = query.trim();
    if (!term) return;
    // "lat, lng" → fly straight to the coordinates.
    const [first, second] = term.split(",").map((value) => Number(value.trim()));
    if (Number.isFinite(first) && Number.isFinite(second)) {
      mapRef.current?.flyTo({ center: [second, first], zoom: 15 });
      return;
    }
    // Otherwise treat it as a place/city name and geocode it.
    setSearching(true);
    try {
      const result = await geocode(term);
      if (!result) {
        toast.info("Local não encontrado. Tente incluir o estado, ex.: “Rio Verde, GO”.");
        return;
      }
      mapRef.current?.flyTo({ center: result.center, zoom: 12 });
      toast.success(`Centralizado em ${result.label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao buscar o local.");
    } finally {
      setSearching(false);
    }
  };

  const canSave = valid && containmentValid && !overlap && !disabled;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="relative min-h-[600px] overflow-hidden rounded-xl border border-border bg-slate-950">
        <div className="absolute inset-0">
          <div ref={containerRef} className="h-full w-full" />
        </div>
        <div className="absolute left-3 right-16 top-3 z-10 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2 rounded-lg border border-white/15 bg-slate-950/90 p-2 backdrop-blur">
            <Tool
              active={mode === "select"}
              onClick={() => activateMode("select")}
              icon={MousePointer2}
            >
              Selecionar
            </Tool>
            <Tool active={mode === "farm"} onClick={() => activateMode("farm")} icon={MapPinned}>
              {farmPoints.length >= 3 ? "Editar fazenda" : "Desenhar fazenda"}
            </Tool>
            {!farmLevel && (
              <Tool active={mode === "field"} onClick={() => activateMode("field")} icon={Plus}>
                Editar talhão
              </Tool>
            )}
            <Tool onClick={() => activateMode("field", false)} icon={Plus}>
              Novo desenho
            </Tool>
            <Tool
              disabled={mode === "select" || closed || points.length < 3}
              onClick={() => commit(points, true)}
              icon={Check}
            >
              Fechar polígono
            </Tool>
            <Tool
              disabled={historyIndex === 0 || mode === "select"}
              onClick={() => restore(history[historyIndex - 1], historyIndex - 1)}
              icon={Undo2}
            >
              Desfazer
            </Tool>
            <Tool
              disabled={historyIndex >= history.length - 1 || mode === "select"}
              onClick={() => restore(history[historyIndex + 1], historyIndex + 1)}
              icon={Redo2}
            >
              Refazer
            </Tool>
            <Tool disabled={mode === "select"} onClick={() => commit([], false)} icon={Trash2}>
              Limpar
            </Tool>
            <Tool
              onClick={() => setStyle((value) => (value === "map" ? "satellite" : "map"))}
              icon={Layers3}
            >
              {style === "map" ? "Satélite" : "Mapa"}
            </Tool>
          </div>
          <div className="flex h-11 min-w-64 flex-1 rounded-lg border border-white/15 bg-slate-950/90 p-1 backdrop-blur">
            <input
              aria-label="Buscar cidade ou coordenadas"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void locate();
              }}
              placeholder="Cidade ou latitude, longitude"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => void locate()}
              disabled={searching}
              className="grid w-9 place-items-center rounded-md text-white hover:bg-white/10 disabled:opacity-50"
              aria-label="Localizar"
            >
              <Search className={cn("h-4 w-4", searching && "animate-pulse")} />
            </button>
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">
          {mode === "farm" ? "Perímetro da fazenda" : "Talhão selecionado"}
        </div>
        <h3 className="mt-2 text-lg font-semibold">
          {mode === "farm" ? talhao.payload.fazenda : talhao.payload.talhao}
        </h3>
        <p className="text-sm text-muted-foreground">
          {mode === "select"
            ? "Clique em um polígono para selecioná-lo"
            : closed
              ? "Arraste os pontos para mover · clique nas alças claras das arestas para inserir · clique direito para remover"
              : "Clique no mapa para adicionar pontos e no 1º ponto (âmbar) para fechar"}
        </p>
        <div className="mt-5 grid gap-3">
          <Stat label="Modo" value={modeLabel(mode)} />
          <Stat label="Vértices" value={String(points.length)} />
          <Stat label="Área calculada" value={closed ? `${format(areaHa)} ha` : "—"} />
          <Stat label="Perímetro" value={closed ? `${format(perimeterKm)} km` : "—"} />
          {mode !== "farm" && <Stat label="Status" value={talhao.payload.status || "—"} />}
        </div>
        {mode !== "select" && (
          <div className="mt-4 space-y-2 text-xs">
            {!closed ? (
              <div className="text-amber-600">
                ●{" "}
                {points.length < 3
                  ? "Adicione pelo menos 3 pontos"
                  : "Clique no 1º ponto (âmbar) para fechar o polígono"}
              </div>
            ) : (
              <Validation valid={valid} text={valid ? "Geometria válida" : "Polígono inválido"} />
            )}
            {closed && mode === "field" && farmPoints.length > 0 && (
              <Validation
                valid={containmentValid}
                text={containmentValid ? "Dentro da fazenda" : "Fora do perímetro da fazenda"}
              />
            )}
            {closed && mode === "field" && (
              <Validation
                valid={!overlap}
                text={overlap ? "Sobrepõe outro talhão" : "Sem sobreposição"}
              />
            )}
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Arraste os pontos para mover, clique nas alças das arestas para inserir um vértice e use o
          clique direito para remover. O cálculo é feito no navegador e salvo junto ao GeoJSON.
        </p>
        {mode === "farm" && (
          <>
            <Action
              disabled={!canSave}
              onClick={() => onSaveFarm(geometry(), { areaHa, perimeterKm })}
              icon={Save}
            >
              Salvar perímetro da fazenda
            </Action>
            {onDeleteFarm && talhao.payload.farm_geometry_geojson && (
              <Action
                destructive
                disabled={disabled}
                onClick={() => setConfirmDelete("farm")}
                icon={Trash2}
              >
                Excluir perímetro da fazenda
              </Action>
            )}
          </>
        )}
        {mode === "field" && (
          <>
            {!farmLevel && (
              <Action
                disabled={!canSave}
                onClick={() => onSaveField(geometry(), { areaHa, perimeterKm })}
                icon={Save}
              >
                Salvar no talhão atual
              </Action>
            )}
            <Action
              secondary={!farmLevel}
              disabled={!canSave}
              onClick={() => onCreateField(geometry(), { areaHa, perimeterKm })}
              icon={Plus}
            >
              {farmLevel ? "Cadastrar este talhão" : "Criar novo talhão"}
            </Action>
            {!farmLevel && onDeleteField && talhao.payload.geometry_geojson && (
              <Action
                destructive
                disabled={disabled}
                onClick={() => setConfirmDelete("field")}
                icon={Trash2}
              >
                Excluir marcação do talhão
              </Action>
            )}
          </>
        )}
        <Action secondary disabled={!valid} onClick={exportGeoJson} icon={Download}>
          Exportar GeoJSON
        </Action>
      </aside>

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete === "farm"
                ? "Excluir o perímetro da fazenda?"
                : "Excluir a marcação do talhão?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete === "farm"
                ? "O desenho do perímetro será removido de todos os talhões desta fazenda. Os talhões em si não são apagados."
                : "O polígono desenhado deste talhão será removido. O cadastro do talhão é mantido."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete === "farm") onDeleteFarm?.();
                else if (confirmDelete === "field") onDeleteField?.();
                commit([], false);
                setConfirmDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function collection(talhoes: TalhaoRecord[], selectedId: string): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: talhoes.flatMap((item) => {
      const geometry = parsePolygon(item.payload.geometry_geojson);
      if (!geometry) return [];
      const alert = item.payload.alerta_principal || "Sem alerta principal";
      return [
        {
          type: "Feature",
          geometry,
          properties: {
            id: item.id,
            selected: item.id === selectedId,
            color: item.payload.cor_mapa || "#16a34a",
            html:
              `<strong>${escapeHtml(item.payload.talhao)}</strong>` +
              `<div>${escapeHtml(item.payload.area_ha || "—")} ha · ${escapeHtml(item.payload.cultura || "Sem cultura")}</div>` +
              `<div>${escapeHtml(item.payload.safra || "Sem safra")} · ${escapeHtml(item.payload.ciclo_atual || "Sem ciclo")}</div>` +
              `<div>Status: ${escapeHtml(item.payload.status || "—")} · ${escapeHtml(item.payload.vocacao || "Agricultura")}</div>` +
              `<div>Alerta: ${escapeHtml(alert)}</div>`,
          },
        } satisfies GeoJSON.Feature,
      ];
    }),
  };
}

function farmCollection(points: Array<[number, number]>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features:
      points.length >= 3 ? [{ type: "Feature", properties: {}, geometry: polygon(points) }] : [],
  };
}

function draftCollection(
  points: Array<[number, number]>,
  mode: EditorMode = "field",
  closed = false,
  color = "#16a34a",
): GeoJSON.FeatureCollection {
  if (points.length < 2) return { type: "FeatureCollection", features: [] };
  // While open, render the path as a line; only a closed ring becomes a filled
  // polygon (the fill layer ignores LineString geometry).
  const geometry: GeoJSON.Geometry =
    closed && points.length >= 3 ? polygon(points) : { type: "LineString", coordinates: points };
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: { mode, color }, geometry }],
  };
}

function polygon(points: Array<[number, number]>): GeoJSON.Polygon {
  return { type: "Polygon", coordinates: [closeRing(points)] };
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
        active && "border-emerald-400 bg-emerald-600",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function Action({
  icon: Icon,
  children,
  disabled,
  secondary,
  destructive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
  secondary?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium disabled:opacity-50",
        destructive
          ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
          : secondary
            ? "border border-border"
            : "bg-primary text-primary-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
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

function Validation({ valid, text }: { valid: boolean; text: string }) {
  return <div className={valid ? "text-emerald-600" : "text-destructive"}>● {text}</div>;
}

function format(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function modeLabel(mode: EditorMode) {
  if (mode === "farm") return "Fazenda";
  if (mode === "field") return "Talhão";
  return "Seleção";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
