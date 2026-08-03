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

        {/* Mapa realmente vazio precisa dizer por quê. Antes nunca ficava vazio:
            oito pinos de módulo em coordenadas fixas (SP, Brasília, Manaus…)
            garantiam movimento na tela mesmo sem um registro no banco. */}
        {model.points.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
            <div className="pointer-events-auto max-w-sm border border-white/15 bg-slate-900/90 p-5 text-center backdrop-blur">
              <p className="text-sm font-semibold">Nada para mostrar no mapa ainda</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                Os pinos vêm de dados com coordenada: cargas, bases, talhões e remessas. Cadastre
                registros ou informe as coordenadas das fazendas em Logística → Remessa.
              </p>
            </div>
          </div>
        )}

        {/* KPI strip — uma linha só; rola na horizontal quando não cabe (mobile) */}
        <div className="pointer-events-auto absolute inset-x-0 top-0 z-20 overflow-x-auto border-b border-white/10 bg-slate-900/88 backdrop-blur">
          <div className="grid auto-cols-[minmax(112px,1fr)] grid-flow-col">
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
              Mapa operacional único
            </div>
            <p className="mt-1 leading-5 text-slate-300">
              {loading
                ? "Sincronizando dados..."
                : "Clique nos ícones, clusters e rotas para ver detalhes e abrir o módulo relacionado."}
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
      </div>

      {/* Barra inferior (no fluxo, não sobrepõe o mapa): camadas à esquerda,
          Medir + Alertas à direita — libera os cantos do mapa (zoom/atribuição). */}
      <div className="shrink-0 border-t border-white/10 bg-slate-950/95 px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
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

          {/* Ações — Medir/Desenhar + Alertas (popover abre para cima) */}
          <div className="flex shrink-0 items-center gap-2">
            <MeasureAreaButton className="h-8 border-white/15 bg-white/10 text-slate-100 hover:bg-white/15" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setAlertsCollapsed((value) => !value)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 text-[11px] font-medium text-slate-100 transition hover:bg-white/15"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                Alertas
                {model.alerts.length > 0 && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                    {model.alerts.length}
                  </span>
                )}
                {alertsCollapsed ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
              {!alertsCollapsed && (
                <div className="absolute bottom-full right-0 z-30 mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-white/15 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
                  <div className="mb-2 text-sm font-semibold">Alertas recentes</div>
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {model.alerts.slice(0, 8).map((alert) => (
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
                </div>
              )}
            </div>
          </div>
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
