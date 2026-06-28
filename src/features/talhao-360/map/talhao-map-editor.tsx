import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Layers3, LocateFixed, Redo2, Save, Search, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { closeRing, parsePolygon, polygonAreaHa, polygonPerimeterKm } from "./geometry";
import { geocodePlace } from "./geocode";
import { cn } from "@/lib/utils";

type Props = {
  talhao: TalhaoRecord;
  talhoes: TalhaoRecord[];
  disabled?: boolean;
  onSave: (geometry: GeoJSON.Polygon, metrics: { areaHa: number; perimeterKm: number }) => void;
};

const baseStyles = {
  map: "https://demotiles.maplibre.org/style.json",
  satellite: {
    version: 8 as const,
    sources: {
      satellite: {
        type: "raster" as const,
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles © Esri",
      },
    },
    layers: [{ id: "satellite", type: "raster" as const, source: "satellite" }],
  },
};

export function TalhaoMapEditor({ talhao, talhoes, disabled, onSave }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [style, setStyle] = useState<"map" | "satellite">("satellite");
  const initial = useMemo(
    () =>
      (parsePolygon(talhao.payload.geometry_geojson)?.coordinates[0]?.slice(0, -1) ?? []) as Array<
        [number, number]
      >,
    [talhao.payload.geometry_geojson],
  );
  const [points, setPoints] = useState<Array<[number, number]>>(initial);
  const [history, setHistory] = useState<Array<Array<[number, number]>>>([initial]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const pointsRef = useRef(points);
  const drawingRef = useRef(drawing);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  const areaHa = polygonAreaHa(points);
  const perimeterKm = polygonPerimeterKm(points);

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
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [drawing, history, historyIndex, points]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (disposed) return;
      const map = new maplibregl.Map({
        container,
        style: style === "satellite" ? baseStyles.satellite : baseStyles.map,
        center: pointsRef.current[0] ?? [-50.94, -17.79],
        zoom: pointsRef.current.length ? 14 : 11,
      });
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
      mapRef.current = map;
      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 8,
      });

      map.on("load", () => {
        map.addSource("talhoes", {
          type: "geojson",
          data: collection(talhoes, talhao.id),
        });
        map.addLayer({
          id: "talhoes-fill",
          type: "fill",
          source: "talhoes",
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#16a34a"],
            "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.42, 0.22],
          },
        });
        map.addLayer({
          id: "talhoes-line",
          type: "line",
          source: "talhoes",
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#16a34a"],
            "line-width": ["case", ["==", ["get", "selected"], true], 4, 2],
          },
        });
        map.addSource("draft", {
          type: "geojson",
          data: draftCollection(pointsRef.current),
        });
        map.addLayer({
          id: "draft-fill",
          type: "fill",
          source: "draft",
          paint: { "fill-color": "#22c55e", "fill-opacity": 0.28 },
        });
        map.addLayer({
          id: "draft-line",
          type: "line",
          source: "draft",
          paint: { "line-color": "#f8fafc", "line-width": 3, "line-dasharray": [2, 1] },
        });

        map.on("mousemove", "talhoes-fill", (event) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = event.features?.[0];
          if (!feature) return;
          const coordinates = event.lngLat;
          hoverPopup
            .setLngLat(coordinates)
            .setHTML(
              `<strong>${String(feature.properties?.name ?? "Talhão")}</strong><br/><small>${String(feature.properties?.summary ?? "")}</small>`,
            )
            .addTo(map);
        });
        map.on("mouseleave", "talhoes-fill", () => {
          map.getCanvas().style.cursor = "";
          hoverPopup.remove();
        });
      });

      map.on("click", (event) => {
        if (!drawingRef.current || disabled) return;
        commit([...pointsRef.current, [event.lngLat.lng, event.lngLat.lat]]);
      });
    });
    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [disabled, style, talhao.id, talhoes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("draft") as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData(draftCollection(points));
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!mapRef.current) return;
      const m = mapRef.current as MapLibreMap;

      // Vértices (pontos brancos): arrastar = mover · clique-direito = remover.
      points.forEach((point, index) => {
        const marker = new maplibregl.Marker({ draggable: !disabled, color: "#ffffff" })
          .setLngLat(point)
          .addTo(m);
        marker.on("dragend", () => {
          const next = [...pointsRef.current];
          const location = marker.getLngLat();
          next[index] = [location.lng, location.lat];
          commit(next);
        });
        if (!disabled) {
          marker.getElement().addEventListener("contextmenu", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (pointsRef.current.length <= 3) {
              toast.info("O talhão precisa de pelo menos 3 vértices.");
              return;
            }
            commit(pointsRef.current.filter((_, i) => i !== index));
          });
        }
        markersRef.current.push(marker);
      });

      // Pontos médios "+": clicar insere um vértice na aresta (depois é só arrastar
      // o ponto branco). Permite ajustar cada linha até o talhão ficar igual ao real.
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
            "width:16px;height:16px;border-radius:9999px;border:1.5px solid #0f172a;background:rgba(255,255,255,.8);color:#0f172a;font-size:13px;line-height:1;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;";
          el.addEventListener("click", (event) => {
            event.stopPropagation();
            const next = [...pointsRef.current];
            next.splice(insertIndex, 0, mid);
            commit(next);
          });
          markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat(mid).addTo(m));
        }
      }
    });
  }, [points, disabled, drawing]);

  // Cursor de mira enquanto desenha (deixa claro que é só clicar no mapa).
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
      toast.success(`📍 ${first.label.slice(0, 64)}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const exportGeoJson = () => {
    if (points.length < 3) return toast.error("Desenhe ao menos três vértices.");
    const geometry: GeoJSON.Polygon = { type: "Polygon", coordinates: [closeRing(points)] };
    const blob = new Blob([JSON.stringify(geometry, null, 2)], { type: "application/geo+json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${talhao.payload.codigo || talhao.payload.talhao}.geojson`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div className="relative min-h-[540px] overflow-hidden rounded-xl border border-border bg-slate-950">
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {/* Busca de local — leva o mapa até a sua cidade/fazenda/endereço */}
        <form
          onSubmit={handleSearch}
          className="absolute left-3 top-3 z-10 flex w-[min(360px,calc(100%-110px))] items-center gap-2 rounded-lg border border-white/15 bg-slate-950/85 p-1.5 backdrop-blur"
        >
          <Search className="ml-1 h-4 w-4 shrink-0 text-white/70" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cidade, endereço ou fazenda…"
            className="h-8 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="h-8 shrink-0 rounded-md bg-white px-3 text-xs font-medium text-slate-900 disabled:opacity-50"
          >
            {searching ? "…" : "Ir"}
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
          <Tool
            onClick={() => setStyle((value) => (value === "map" ? "satellite" : "map"))}
            icon={Layers3}
          >
            {style === "map" ? "Satélite" : "Mapa"}
          </Tool>
        </div>

        {drawing && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-md border border-white/15 bg-slate-950/85 px-3 py-1.5 text-xs text-white backdrop-blur">
            Clique no mapa para marcar os vértices do talhão
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">
          Talhão selecionado
        </div>
        <h3 className="mt-2 text-lg font-semibold">{talhao.payload.talhao}</h3>
        <p className="text-sm text-muted-foreground">{talhao.payload.codigo}</p>
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
          <Stat label="Cultura" value={talhao.payload.cultura || "—"} />
          <Stat label="Safra" value={talhao.payload.safra || "—"} />
          <Stat label="Status" value={talhao.payload.status || "—"} />
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          <strong>Desenhar</strong>: clique no mapa para marcar os vértices. Depois,{" "}
          <strong>arraste</strong> os pontos brancos para mover, clique no <strong>+</strong> entre
          eles para inserir um vértice e <strong>clique com o botão direito</strong> num ponto para
          removê-lo — ajuste cada linha até o talhão ficar igual à fazenda vista de cima.
        </p>
        <button
          type="button"
          disabled={disabled || points.length < 3}
          onClick={() =>
            onSave({ type: "Polygon", coordinates: [closeRing(points)] }, { areaHa, perimeterKm })
          }
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Salvar GeoJSON
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

function collection(talhoes: TalhaoRecord[], selectedId: string): GeoJSON.FeatureCollection {
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
  return {
    type: "FeatureCollection",
    features:
      points.length >= 3
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [closeRing(points)] },
            },
          ]
        : [],
  };
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
