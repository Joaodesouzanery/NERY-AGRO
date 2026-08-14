import { InteractiveMap } from "@/components/interactive-map";

export type CartoMapTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

export type MapPoint = {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
  x?: number;
  y?: number;
  tone?: CartoMapTone;
  caption?: string;
  status?: string;
  description?: string;
  category?: string;
  icon?: string;
  iconKey?: string;
  clusterable?: boolean;
  /**
   * Série temporal REAL do ponto, quando a origem souber informá-la. Opcional
   * de propósito: sem série o painel não desenha gráfico nenhum — antes havia
   * um gerador aleatório fingindo medição em modo REAL.
   */
  series?: Array<{ label: string; valor: number }>;
  sourceModule?: string;
  moduleId?: string;
  moduleLabel?: string;
  severity?: "info" | "warning" | "danger" | "success";
  recordId?: string;
  recordModule?: string;
  href?: string;
  summary?: string;
  metrics?: Record<string, string | number | undefined>;
  meta?: Record<string, string | number | undefined>;
};

export type MapRouteGeometry =
  | { type: "LineString"; coordinates: Array<[number, number]> }
  | { type: "Polygon"; coordinates: Array<Array<[number, number]>> };

export type MapRoute = {
  id: string;
  label?: string;
  points: Array<{ lat?: number; lng?: number; x?: number; y?: number }>;
  geometry?: MapRouteGeometry;
  shape?: "line" | "polygon";
  tone?: CartoMapTone;
  status?: string;
  description?: string;
  category?: string;
  sourceModule?: string;
  moduleId?: string;
  moduleLabel?: string;
  href?: string;
  meta?: Record<string, string | number | undefined>;
};

export type CartoPoint = Omit<MapPoint, "id"> & { id?: string };
export type CartoRoute = Omit<MapRoute, "id"> & { id?: string };

type CartoMapProps = {
  region?: "brazil" | "brazilFocus" | "world" | "europe" | "fixed";
  variant?: "dark" | "voyager" | "positron" | "satellite";
  centerLabel?: string;
  route?: Array<{ x: number; y: number }>;
  routes?: CartoRoute[] | MapRoute[];
  points?: CartoPoint[] | MapPoint[];
  className?: string;
  interactive?: boolean;
  showLegend?: boolean;
  attribution?: boolean;
  onPointClick?: (point: MapPoint) => void;
  onRouteClick?: (route: MapRoute) => void;
};

const fallbackBoundsByRegion = {
  brazil: { west: -74, south: -34, east: -34, north: 6 },
  brazilFocus: { west: -58, south: -32, east: -38, north: -8 },
  world: { west: -180, south: -60, east: 180, north: 75 },
  europe: { west: -12, south: 35, east: 32, north: 62 },
  fixed: { west: -46.72, south: -23.62, east: -46.54, north: -23.48 },
};

export function CartoMap({
  region = "fixed",
  variant = "voyager",
  centerLabel = "Operação AgroTorre",
  route = [],
  routes = [],
  points = [],
  className,
  interactive = true,
  showLegend = false,
  attribution = true,
  onPointClick,
  onRouteClick,
}: CartoMapProps) {
  const mapPoints = points.map((point, index) => ({
    ...point,
    id: point.id ?? `point-${index}`,
  })) as MapPoint[];

  const mapRoutes = routes.length
    ? (routes.map((item, index) => ({
        ...item,
        id: item.id ?? `route-${index}`,
      })) as MapRoute[])
    : route.length
      ? [{ id: "primary-route", label: "Rota cadastrada", points: route, tone: "primary" as const }]
      : [];

  return (
    <InteractiveMap
      variant={variant}
      centerLabel={centerLabel}
      points={mapPoints}
      routes={mapRoutes}
      className={className}
      interactive={interactive}
      showLegend={showLegend}
      attribution={attribution}
      onPointClick={onPointClick}
      onRouteClick={onRouteClick}
      fallbackBounds={fallbackBoundsByRegion[region]}
    />
  );
}
