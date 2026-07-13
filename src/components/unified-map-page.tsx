import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ChevronDown,
  ChevronUp,
  Leaf,
  Map,
  QrCode,
  Sprout,
  Truck,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { InteractiveMap } from "@/components/interactive-map";
import { MapEntityPanel } from "@/components/map-entity-panel";
import { buildUnifiedMapModel, useConnectedAgroData } from "@/lib/connected-agro-data";
import type { MapPoint } from "@/components/carto-map";
import { Link } from "@tanstack/react-router";
import { buildRdcDailySummary, latestFichaDate, localToday } from "@/features/rdc/api/services";
import { demoRdcRecords } from "@/features/rdc/data/mocks";
import { MeasureAreaButton } from "@/features/talhao-360/components/measure-area-dialog";
import { cn } from "@/lib/utils";

const moduleIcon = {
  logistica: Truck,
  financeiro: Wallet,
  campo: Sprout,
  pecuaria: QrCode,
  sustentabilidade: Leaf,
  inteligencia: BarChart3,
  cogs: Calculator,
};

// Mesma paleta dos pinos do mapa (mapIconConfig em interactive-map.tsx) — a barra
// inferior de módulos funciona como legenda de cores das categorias do mapa.
const moduleColor: Record<string, string> = {
  logistica: "#3b82f6",
  financeiro: "#22c55e",
  campo: "#84cc16",
  pecuaria: "#a855f7",
  sustentabilidade: "#10b981",
  inteligencia: "#06b6d4",
  cogs: "#f59e0b",
};

export function UnifiedMapPage({
  heightClassName = "h-[calc(100svh-3.5rem)] md:h-svh",
}: {
  heightClassName?: string;
} = {}) {
  const { snapshot, loading, demoMode, lastUpdatedAt } = useConnectedAgroData();
  const model = buildUnifiedMapModel(snapshot, lastUpdatedAt);
  const lastSync = model.lastUpdatedAt
    ? new Date(model.lastUpdatedAt).toLocaleTimeString("pt-BR")
    : "--:--";
  const [alertsCollapsed, setAlertsCollapsed] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const rdcDate = demoMode ? latestFichaDate(demoRdcRecords) : localToday();
  const rdcSummary = buildRdcDailySummary(demoMode ? demoRdcRecords : snapshot.field, rdcDate);

  // Filtro + legenda: categorias ocultas (vazio = tudo visível).
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggleModule = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const visiblePoints = model.points.filter(
    (point) => !(point.moduleId && hidden.has(point.moduleId)),
  );
  const visibleRoutes = hidden.has("logistica") ? [] : model.routes;

  return (
    <div
      className={cn(
        "relative flex min-h-[540px] flex-col overflow-hidden bg-slate-950 text-white",
        heightClassName,
      )}
    >
      <div className="relative min-h-0 flex-1">
        <InteractiveMap
          points={visiblePoints}
          routes={visibleRoutes}
          variant="dark"
          className="h-full min-h-full rounded-none border-0"
          fitToData
          attribution
          onPointClick={(point) => {
            setSelectedPoint(point);
            setAlertsCollapsed(true);
          }}
        />

        {/* KPI strip */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-slate-900/88 backdrop-blur">
          <div className="grid grid-cols-3 md:grid-cols-6">
            {model.kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="min-w-0 border-r border-white/10 px-2 py-2 last:border-r-0 sm:px-3 md:px-4 md:py-2.5"
              >
                <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                  {kpi.label}
                </div>
                <div
                  className={cn(
                    "mt-1 truncate text-sm font-semibold sm:text-base md:text-lg",
                    kpi.tone === "success" && "text-emerald-300",
                    kpi.tone === "warning" && "text-amber-300",
                    kpi.tone === "danger" && "text-rose-300",
                    kpi.tone === "primary" && "text-green-300",
                    kpi.tone === "info" && "text-cyan-300",
                  )}
                >
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info card (hidden when panel open) */}
        {!selectedPoint && (
          <div className="pointer-events-none absolute left-4 top-28 z-20 hidden max-w-sm rounded-lg border border-white/15 bg-slate-950/82 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur md:block">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Map className="h-4 w-4 text-green-300" />
              Mapa operacional unico
            </div>
            <p className="mt-1 leading-5 text-slate-300">
              {loading
                ? "Sincronizando dados..."
                : "Clique nos icones, clusters e rotas para ver detalhes e abrir o modulo relacionado."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded border border-white/15 bg-white/10 px-2 py-1">
                {demoMode ? "DEMO" : "REAL"}
              </span>
              <span className="rounded border border-white/15 bg-white/10 px-2 py-1">
                Atualizado {lastSync}
              </span>
            </div>
          </div>
        )}

        {/* RDC — resumo do dia */}
        {!selectedPoint && (
          <Link
            to="/rdc"
            preload="intent"
            className="pointer-events-auto absolute right-4 top-28 z-20 hidden w-56 rounded-lg border border-white/15 bg-slate-950/82 p-3 text-slate-200 shadow-2xl backdrop-blur transition hover:bg-slate-900/90 md:block"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ClipboardList className="h-4 w-4 text-green-300" />
              RDC de hoje
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: "Fichas", value: rdcSummary.fichas },
                { label: "Itens", value: rdcSummary.itens },
                { label: "Ocorrências", value: rdcSummary.ocorrencias, warn: true },
                { label: "Talhões", value: rdcSummary.talhoesTocados },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </div>
                  <div
                    className={cn(
                      "text-base font-semibold text-white",
                      stat.warn && stat.value > 0 && "text-amber-300",
                    )}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-green-300">Abrir diário →</div>
          </Link>
        )}

        {/* Medir/Desenhar área — abre o editor de mapa (mede ha/perímetro; salva talhão) */}
        {!selectedPoint && (
          <div className="pointer-events-auto absolute bottom-4 left-4 z-30">
            <MeasureAreaButton className="border-white/15 bg-slate-950/85 text-white backdrop-blur hover:bg-slate-900/90" />
          </div>
        )}

        {/* Alerts panel (hidden when entity panel open) */}
        {!selectedPoint && (
          <div
            className={cn(
              "absolute bottom-4 right-4 z-20 hidden w-80 rounded-lg border border-white/15 bg-slate-950/86 shadow-2xl backdrop-blur lg:block",
              alertsCollapsed ? "p-0" : "p-3",
            )}
          >
            <button
              type="button"
              onClick={() => setAlertsCollapsed((value) => !value)}
              className={cn(
                "flex w-full items-center gap-2 text-left text-sm font-semibold",
                alertsCollapsed ? "px-3 py-2" : "mb-2",
              )}
            >
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              Alertas recentes
              {model.alerts.length > 0 && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                  {model.alerts.length}
                </span>
              )}
              <span className="ml-auto text-slate-400">
                {alertsCollapsed ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
            {!alertsCollapsed && (
              <div className="max-h-44 space-y-2 overflow-y-auto">
                {model.alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-2"
                  >
                    <div className="truncate text-xs font-semibold">{alert.title}</div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span className="truncate">{alert.source}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5",
                          alert.severity === "danger"
                            ? "bg-rose-500/20 text-rose-200"
                            : "bg-amber-500/20 text-amber-200",
                        )}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
                {model.alerts.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Nenhum alerta ativo.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra de filtros + legenda (sempre visível, no fluxo — não corta) */}
      <div className="shrink-0 border-t border-white/10 bg-slate-950/95 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Camadas
          </span>
          {model.moduleCounts.map((module) => {
            const Icon = moduleIcon[module.id as keyof typeof moduleIcon] ?? AlertTriangle;
            const off = hidden.has(module.id);
            const color = moduleColor[module.id] ?? "#86efac";
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => toggleModule(module.id)}
                aria-pressed={!off}
                title={off ? `Mostrar ${module.label}` : `Ocultar ${module.label}`}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition",
                  off
                    ? "border-white/10 text-slate-500"
                    : "border-white/15 bg-white/10 text-slate-100 hover:bg-white/15",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: off ? "#475569" : color }}
                />
                <Icon className="h-3.5 w-3.5" style={{ color: off ? "#64748b" : color }} />
                <span className={cn(off && "line-through")}>{module.label}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {module.value}
                </span>
              </button>
            );
          })}
          {hidden.size > 0 && (
            <button
              type="button"
              onClick={() => setHidden(new Set())}
              className="ml-1 inline-flex h-8 items-center rounded-md px-2 text-[11px] font-medium text-green-300 hover:text-green-200"
            >
              Mostrar tudo
            </button>
          )}
        </div>
      </div>

      {/* Gotham-style entity panel */}
      <MapEntityPanel
        point={selectedPoint}
        alerts={model.alerts}
        onClose={() => setSelectedPoint(null)}
      />
    </div>
  );
}
