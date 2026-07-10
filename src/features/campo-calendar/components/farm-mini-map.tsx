// Mapa resumido dos talhões: SVG leve projetado do GeoJSON do Talhão 360
// (via adapter) — sem editor e sem MapLibre. Clique filtra o Calendário.
import { useMemo } from "react";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarTalhao } from "@/features/campo-calendar/types/domain";

const VIEW_W = 100;
const VIEW_H = 64;
const PAD = 4;

type Projected = {
  talhao: CalendarTalhao;
  points: string;
  labelX: number;
  labelY: number;
};

function projectTalhoes(talhoes: CalendarTalhao[]): Projected[] {
  const withGeometry = talhoes.filter((talhao) => talhao.geometry?.coordinates?.[0]?.length);
  if (!withGeometry.length) return [];

  const allPoints = withGeometry.flatMap((talhao) => talhao.geometry!.coordinates[0]);
  const lons = allPoints.map((point) => point[0]);
  const lats = allPoints.map((point) => point[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const spanLon = Math.max(maxLon - minLon, 1e-9);
  const spanLat = Math.max(maxLat - minLat, 1e-9);

  const toX = (lon: number) => PAD + ((lon - minLon) / spanLon) * (VIEW_W - PAD * 2);
  const toY = (lat: number) => PAD + ((maxLat - lat) / spanLat) * (VIEW_H - PAD * 2);

  return withGeometry.map((talhao) => {
    const ring = talhao.geometry!.coordinates[0];
    const points = ring.map((point) => `${toX(point[0]).toFixed(2)},${toY(point[1]).toFixed(2)}`);
    const labelX = ring.reduce((sum, point) => sum + toX(point[0]), 0) / ring.length;
    const labelY = ring.reduce((sum, point) => sum + toY(point[1]), 0) / ring.length;
    return { talhao, points: points.join(" "), labelX, labelY };
  });
}

export function FarmMiniMap({
  talhoes,
  selectedId,
  onSelect,
  className,
}: {
  talhoes: CalendarTalhao[];
  selectedId?: string;
  onSelect: (talhaoId?: string) => void;
  className?: string;
}) {
  const projected = useMemo(() => projectTalhoes(talhoes), [talhoes]);

  if (!projected.length) {
    return (
      <div
        className={cn(
          "flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <MapPinned className="mb-2 h-4 w-4" />
        Talhões sem geometria — desenhe no Talhão 360 para ver o mapa resumido.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="Mapa resumido dos talhões (clique para filtrar)"
      className={cn("h-44 w-full rounded-xl border border-border bg-muted/20", className)}
    >
      {projected.map(({ talhao, points, labelX, labelY }) => {
        const active = selectedId === talhao.id;
        return (
          <g
            key={talhao.id}
            className="cursor-pointer"
            onClick={() => onSelect(active ? undefined : talhao.id)}
          >
            <polygon
              points={points}
              fill={talhao.corMapa || "var(--color-primary)"}
              fillOpacity={active ? 0.85 : selectedId ? 0.25 : 0.55}
              stroke={active ? "var(--color-foreground)" : "var(--color-background)"}
              strokeWidth={active ? 0.8 : 0.4}
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={3.4}
              fontWeight={700}
              fill="var(--color-foreground)"
              pointerEvents="none"
            >
              {talhao.nome}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
