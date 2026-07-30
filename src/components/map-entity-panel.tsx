import { useState } from "react";
import { X, ExternalLink, AlertTriangle, ChevronRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MapPoint } from "@/components/carto-map";
import type { ControlAlert } from "@/lib/connected-agro-data";
import { cn } from "@/lib/utils";

type Tab = "resumo" | "alertas" | "detalhes";

// Acento neutro (mono-dark) sobre o overlay escuro do mapa.
const GREEN = "#e5e7eb";

const toneBg: Record<string, string> = {
  primary: "bg-blue-500/20 text-blue-300",
  success: "bg-green-500/20 text-green-300",
  warning: "bg-amber-500/20 text-amber-300",
  danger: "bg-rose-500/20 text-rose-300",
  info: "bg-cyan-500/20 text-cyan-300",
  neutral: "bg-slate-500/20 text-slate-300",
};

const toneDot: Record<string, string> = {
  primary: "#4f8cff",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  neutral: "#64748b",
};

export function MapEntityPanel({
  point,
  alerts,
  onClose,
}: {
  point: MapPoint | null;
  alerts: ControlAlert[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("resumo");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!point) return null;

  const tone = point.tone ?? "primary";
  const dotColor = toneDot[tone] ?? toneDot.primary;
  const metaRows = Object.entries(point.meta ?? {}).filter(([, v]) => v !== undefined && v !== "");
  const metricsRows = Object.entries(point.metrics ?? {}).filter(
    ([, v]) => v !== undefined && v !== "",
  );

  const pointAlerts = alerts.filter(
    (a) =>
      !dismissed.has(a.id) &&
      (a.source?.toLowerCase().includes(point.sourceModule ?? "__none__") ||
        a.source?.toLowerCase().includes((point.moduleId ?? "__none__").toLowerCase()) ||
        a.source?.toLowerCase().includes((point.label ?? "").toLowerCase())),
  );

  // Série real do ponto, quando quem o criou souber informá-la. Aqui havia um
  // gerador aleatório cujo ruído virava o gráfico "Atividade" e o selo
  // "Acima da baseline" — em modo REAL, como se fosse medição.
  const activityData = point.series ?? [];
  const baseline =
    activityData.slice(0, -1).reduce((s, d) => s + d.valor, 0) /
    Math.max(1, activityData.length - 1);
  const latest = activityData[activityData.length - 1]?.valor ?? 0;
  const anomaly = activityData.length > 1 && latest > baseline * 1.5;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumo", label: "RESUMO" },
    { id: "alertas", label: "ALERTAS", count: pointAlerts.length },
    { id: "detalhes", label: "DETALHES" },
  ];

  return (
    <>
      {/* Backdrop click area */}
      <div className="absolute inset-0 z-30" onClick={onClose} />

      {/* Panel */}
      <div className="pointer-events-auto absolute bottom-0 right-0 top-0 z-40 flex w-full flex-col overflow-hidden border-l border-white/10 bg-slate-950/96 shadow-2xl backdrop-blur sm:w-[380px]">
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 p-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: `${dotColor}33`, color: dotColor }}
            >
              {(point.label ?? "P").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading truncate text-base font-bold text-white">
                {point.label}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                {point.caption ?? point.sourceModule ?? "Entidade operacional"}
              </div>
              {(point.severity || tone !== "neutral") && (
                <span
                  className={cn(
                    "mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    toneBg[tone] ?? toneBg.neutral,
                  )}
                >
                  {point.severity ?? tone}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-0 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold tracking-widest transition",
                tab === t.id ? "border-b-2 text-white" : "text-slate-500 hover:text-slate-300",
              )}
              style={tab === t.id ? { borderBottomColor: GREEN, color: "white" } : undefined}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-300">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "resumo" && (
            <div className="space-y-5 p-4">
              {/* Description */}
              {(point.description || point.summary) && (
                <p className="text-xs leading-relaxed text-slate-300">
                  {point.description ?? point.summary}
                </p>
              )}

              {/* Metrics grid */}
              {(metaRows.length > 0 || metricsRows.length > 0) && (
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Detalhes
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[...metaRows, ...metricsRows].map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-md border border-white/8 bg-white/5 px-3 py-2"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">
                          {key.replace(/_/g, " ")}
                        </div>
                        <div className="mt-0.5 truncate text-xs font-semibold text-white">
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Atividade — só com série real; sem dado, sem gráfico. */}
              {activityData.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Atividade
                    </div>
                    {anomaly && (
                      <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Acima da baseline
                      </span>
                    )}
                  </div>
                  <div className="h-32 rounded-lg border border-white/8 bg-white/3 p-2">
                    <ResponsiveContainer>
                      <AreaChart
                        data={activityData}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor={anomaly ? "#f59e0b" : GREEN}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={anomaly ? "#f59e0b" : GREEN}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748b" }}
                        />
                        <YAxis
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748b" }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                          labelStyle={{ color: "#94a3b8" }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <ReferenceLine
                          y={baseline}
                          stroke="#64748b"
                          strokeDasharray="4 4"
                          label={{
                            value: "baseline",
                            fill: "#64748b",
                            fontSize: 9,
                            position: "insideTopRight",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="valor"
                          stroke={anomaly ? "#f59e0b" : GREEN}
                          strokeWidth={2}
                          fill="url(#areaGrad)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Observations / mini alerts */}
              {pointAlerts.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Observações
                  </div>
                  <div className="space-y-2">
                    {pointAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-white">{alert.title}</p>
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                              alert.severity === "danger"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300",
                            )}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">{alert.source}</p>
                        <div className="mt-2 flex gap-2">
                          {point.href && (
                            <a
                              href={point.href}
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold transition hover:bg-white/10"
                              style={{ borderColor: GREEN, color: GREEN }}
                            >
                              Revisar
                              <ChevronRight className="h-2.5 w-2.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                            className="rounded border border-white/15 px-2 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-white/10"
                          >
                            Dispensar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open module */}
              {point.href && (
                <a
                  href={point.href}
                  className="flex w-full items-center justify-between rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
                >
                  Abrir módulo
                  <ExternalLink className="h-3.5 w-3.5" style={{ color: GREEN }} />
                </a>
              )}
            </div>
          )}

          {tab === "alertas" && (
            <div className="space-y-3 p-4">
              {pointAlerts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Nenhum alerta ativo para este ponto.
                </div>
              ) : (
                pointAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          alert.severity === "danger"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300",
                        )}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{alert.source}</p>
                    <div className="mt-3 flex gap-2">
                      {point.href && (
                        <a
                          href={point.href}
                          className="inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/10"
                          style={{ borderColor: GREEN, color: GREEN }}
                        >
                          Revisar
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                      <button
                        onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                        className="rounded border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/10"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "detalhes" && (
            <div className="space-y-2 p-4">
              {[
                ["ID", point.id],
                ["Módulo", point.sourceModule ?? point.moduleId],
                ["Tom", point.tone],
                ["Categoria", point.category],
                ["Severidade", point.severity],
                ["Record ID", point.recordId],
                ["Record Módulo", point.recordModule],
                ["Lat", point.lat],
                ["Lng", point.lng],
                ["href", point.href],
              ]
                .filter(([, v]) => v !== undefined && v !== "")
                .map(([key, val]) => (
                  <div key={String(key)} className="flex items-start justify-between gap-3 text-xs">
                    <span className="uppercase tracking-wide text-slate-500">{key}</span>
                    <span className="text-right font-mono text-slate-200 break-all">
                      {String(val)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
