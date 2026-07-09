import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { talhaoMapStyle } from "@/features/talhao-360/map/map-styles";
import { cn } from "@/lib/utils";

export function TalhaoMapOverview({
  talhoes,
  farmGeometry,
  selectedId,
  onSelect,
  className,
}: {
  talhoes: TalhaoRecord[];
  farmGeometry?: GeoJSON.Polygon | null;
  selectedId?: string | null;
  onSelect?: (fieldId: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;

    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (disposed) return;
      const data = collection(talhoes, selectedId);
      const map = new maplibregl.Map({
        container,
        style: talhaoMapStyle("hybrid"),
        center: [-50.94, -17.79],
        zoom: 12,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        maxWidth: "280px",
      });

      map.on("load", () => {
        map.addSource("farm-overview", {
          type: "geojson",
          data: farmGeometry ? polygonCollection(farmGeometry) : emptyCollection(),
        });
        map.addLayer({
          id: "farm-overview-fill",
          type: "fill",
          source: "farm-overview",
          paint: { "fill-color": "#f59e0b", "fill-opacity": 0.12 },
        });
        map.addLayer({
          id: "farm-overview-line",
          type: "line",
          source: "farm-overview",
          paint: { "line-color": "#fbbf24", "line-width": 3, "line-dasharray": [2, 1] },
        });
        map.addSource("talhao-overview", { type: "geojson", data });
        map.addLayer({
          id: "talhao-overview-fill",
          type: "fill",
          source: "talhao-overview",
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#16a34a"],
            "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.58, 0.38],
          },
        });
        map.addLayer({
          id: "talhao-overview-line",
          type: "line",
          source: "talhao-overview",
          paint: {
            "line-color": ["case", ["==", ["get", "selected"], true], "#ffffff", ["get", "color"]],
            "line-width": ["case", ["==", ["get", "selected"], true], 4, 2.5],
          },
        });

        const bounds = new maplibregl.LngLatBounds();
        if (farmGeometry) {
          for (const coordinate of farmGeometry.coordinates[0]) {
            bounds.extend([coordinate[0], coordinate[1]]);
          }
        }
        for (const feature of data.features) {
          for (const coordinate of feature.geometry.coordinates[0]) {
            bounds.extend([coordinate[0], coordinate[1]]);
          }
        }
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 55, maxZoom: 15, duration: 0 });

        map.on("mousemove", "talhao-overview-fill", (event) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = event.features?.[0];
          if (!feature) return;
          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<strong>${escapeHtml(String(feature.properties?.name ?? "Talhão"))}</strong>` +
                `<div>${escapeHtml(String(feature.properties?.area ?? "Área não informada"))}</div>` +
                `<div>${escapeHtml(String(feature.properties?.crop ?? "Sem cultura"))} · ${escapeHtml(String(feature.properties?.season ?? "Sem safra"))}</div>` +
                `<div>Status: ${escapeHtml(String(feature.properties?.status ?? "Não informado"))}</div>` +
                `<div>Alerta: ${escapeHtml(String(feature.properties?.alert ?? "Sem alerta crítico"))}</div>`,
            )
            .addTo(map);
        });
        map.on("mouseleave", "talhao-overview-fill", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
        map.on("click", "talhao-overview-fill", (event) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") onSelect?.(id);
        });
      });
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [farmGeometry, onSelect, selectedId, talhoes]);

  const mapped = talhoes.filter((item) => parsePolygon(item.payload.geometry_geojson)).length;

  return (
    <div
      className={cn(
        "relative min-h-[360px] overflow-hidden rounded-xl border border-border bg-slate-900",
        className,
      )}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-white/20 bg-slate-950/85 px-3 py-2 text-white shadow-lg backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Mapa da fazenda
        </div>
        <div className="mt-0.5 text-sm font-medium">
          {mapped} de {talhoes.length} talhões mapeados
        </div>
      </div>
      {mapped === 0 && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/80 p-8 text-center text-white">
          <div>
            <div className="font-semibold">Nenhum talhão desenhado</div>
            <p className="mt-1 max-w-sm text-sm text-slate-300">
              Cadastre primeiro o perímetro da fazenda e depois desenhe cada talhão no Talhão 360°.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function collection(
  talhoes: TalhaoRecord[],
  selectedId?: string | null,
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
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
            area: item.payload.area_ha ? `${item.payload.area_ha} ha` : "Área não informada",
            crop: item.payload.cultura,
            season: item.payload.safra,
            status: item.payload.status,
            alert: item.payload.alerta_principal || "Monitorar pragas",
          },
        } satisfies GeoJSON.Feature<GeoJSON.Polygon>,
      ];
    }),
  };
}

function polygonCollection(geometry: GeoJSON.Polygon): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry, properties: {} }] };
}

function emptyCollection(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return { type: "FeatureCollection", features: [] };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
