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
} from "lucide-react";
import { InteractiveMap } from "@/components/interactive-map";
import { MapEntityPanel } from "@/components/map-entity-panel";
import { buildUnifiedMapModel, useConnectedAgroData } from "@/lib/connected-agro-data";
import type { MapPoint } from "@/components/carto-map";
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

export function UnifiedMapPage() {
  const { snapshot, loading, demoMode, lastUpdatedAt } = useConnectedAgroData();
  const model = buildUnifiedMapModel(snapshot, lastUpdatedAt);
  const lastSync = model.lastUpdatedAt
    ? new Date(model.lastUpdatedAt).toLocaleTimeString("pt-BR")
    : "--:--";
  const [alertsCollapsed, setAlertsCollapsed] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  return (
    <div className="relative h-[calc(100svh-56px)] min-h-[540px] overflow-hidden bg-slate-950 text-white">
      <InteractiveMap
        points={model.points}
        routes={model.routes}
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
              className="min-w-0 border-r border-white/10 px-3 py-2.5 last:border-r-0 md:px-4"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {kpi.label}
              </div>
              <div
                className={cn(
                  "mt-1 truncate text-base font-semibold md:text-lg",
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

      {/* Module counts bottom bar */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-[calc(100vw-2rem)] rounded-lg border border-white/15 bg-slate-950/86 p-2 shadow-2xl backdrop-blur lg:max-w-[calc(100vw-24rem)]">
        <div className="flex max-w-full flex-wrap gap-1.5">
          {model.moduleCounts.map((module) => {
            const Icon = moduleIcon[module.id as keyof typeof moduleIcon] ?? AlertTriangle;
            return (
              <a
                key={module.id}
                href={module.href}
                className="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2 text-[11px] font-medium text-slate-200 transition hover:bg-white/15"
              >
                <Icon className="h-3.5 w-3.5 text-green-300" />
                {module.label}
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {module.value}
                </span>
              </a>
            );
          })}
        </div>
      </div>

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
                <div className="py-6 text-center text-xs text-slate-400">Nenhum alerta ativo.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gotham-style entity panel */}
      <MapEntityPanel
        point={selectedPoint}
        alerts={model.alerts}
        onClose={() => setSelectedPoint(null)}
      />
    </div>
  );
}
