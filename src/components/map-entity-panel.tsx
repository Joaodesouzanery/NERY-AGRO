import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ExternalLink, ChevronRight } from "lucide-react";
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

  // Alertas DESTE registro.
  //
  // Antes o casamento era por MÓDULO — todo ponto de campo recebia todos os
  // alertas de campo, e uma das cláusulas era `includes("")`, sempre verdadeira:
  // bastava um rótulo vazio para os 12 alertas colarem num ponto só. O painel
  // ficava cheio de coisa que não era daquele lugar, o que é pior que vazio.
  //
  // `recordId` vem preenchido nas famílias de alerta que nascem de um registro
  // (operações, financeiro, campo). Os agregados — saldo de caixas por fazenda,
  // contrato vencendo — não pertencem a nenhum ponto e ficam só na fila de ações.
  // Linhas da aba DETALHES: o que é do usuário, não o que é da implementação.
  // `status` e `moduleLabel` existiam no ponto e não apareciam em lugar nenhum
  // do painel; `meta` e `metrics` carregam o payload do registro.
  const detalhes: Array<[string, string]> = [
    ...(point.moduleLabel ? ([["Módulo", point.moduleLabel]] as Array<[string, string]>) : []),
    ...(point.status ? ([["Situação", point.status]] as Array<[string, string]>) : []),
    ...metaRows.map(([k, v]) => [k, String(v)] as [string, string]),
    ...metricsRows.map(([k, v]) => [k, String(v)] as [string, string]),
  ];

  // "Revisar" levava à rota genérica do módulo — exatamente o que "Abrir
  // módulo" já fazia, dois botões para a mesma coisa. Com `recordModule` e
  // `recordId` dá para abrir O REGISTRO. Onde a rota de detalhe não existe,
  // cai no módulo, que continua sendo melhor que nada.
  const linkRevisar =
    point.recordModule === "rdc-ficha" && point.recordId
      ? `/rdc/${point.recordId}`
      : point.recordModule === "talhao360" && point.recordId
        ? `/campo/talhoes/${point.recordId}`
        : (point.href ?? "");

  const pointAlerts = point.recordId
    ? alerts.filter((a) => !dismissed.has(a.id) && a.recordId === point.recordId)
    : [];

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumo", label: "RESUMO" },
    { id: "alertas", label: "ALERTAS", count: pointAlerts.length },
    { id: "detalhes", label: "DETALHES" },
  ];

  return (
    <>
      {/* Fecha ao clicar fora. `bottom-14` deixa a barra de CAMADAS de fora:
          cobrindo-a, o primeiro clique numa camada só fechava o painel. */}
      <div className="absolute inset-x-0 bottom-14 top-0 z-30" onClick={onClose} />

      {/* No celular o painel ocupava a tela INTEIRA e o mapa sumia — quem clica
          num pino quer ver o pino no contexto. Vira folha de ~70% da altura,
          ancorada embaixo; a partir de sm volta a ser a coluna lateral. */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 top-[30%] z-40 flex flex-col overflow-hidden rounded-t-xl border-t border-white/10 bg-slate-950/96 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-0 sm:top-0 sm:w-[400px] sm:rounded-none sm:border-l sm:border-t-0">
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
                  {/* Lista densa, não grade de cartões: em 380px a grade de 2
                      colunas gastava a dobra inteira com 8 campos, e um ponto de
                      carga tem bem mais que isso. */}
                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-white/8 sm:grid-cols-2">
                    {[...metaRows, ...metricsRows].map(([key, val]) => (
                      <div key={key} className="bg-white/5 px-3 py-1.5">
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
                          {linkRevisar && (
                            <Link
                              to={linkRevisar}
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold transition hover:bg-white/10"
                              style={{ borderColor: GREEN, color: GREEN }}
                            >
                              Revisar
                              <ChevronRight className="h-2.5 w-2.5" />
                            </Link>
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
                <Link
                  to={point.href}
                  className="flex w-full items-center justify-between rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
                >
                  Abrir módulo
                  <ExternalLink className="h-3.5 w-3.5" style={{ color: GREEN }} />
                </Link>
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
                    {alert.description && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {alert.description}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-500">{alert.source}</p>
                    <div className="mt-3 flex gap-2">
                      {linkRevisar && (
                        <Link
                          to={linkRevisar}
                          className="inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/10"
                          style={{ borderColor: GREEN, color: GREEN }}
                        >
                          Revisar
                          <ChevronRight className="h-3 w-3" />
                        </Link>
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
            <div className="space-y-1 p-4">
              {/* Esta aba era um dump de depuração exposto ao usuário: ID
                  interno, "Tom", Record ID, Lat, Lng e href em fonte mono.
                  Nada disso é dele. Agora mostra o registro por extenso — os
                  campos que estavam sendo descartados na montagem do ponto. */}
              {detalhes.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500">
                  Sem detalhes adicionais para este ponto.
                </p>
              ) : (
                detalhes.map(([rotulo, valor]) => (
                  <div
                    key={rotulo}
                    className="flex items-start justify-between gap-3 border-b border-white/5 py-1.5 text-xs last:border-0"
                  >
                    <span className="shrink-0 text-slate-400">{rotulo}</span>
                    <span className="text-right text-slate-100">{valor}</span>
                  </div>
                ))
              )}
              {(point.lat !== undefined || point.lng !== undefined) && (
                <p className="pt-3 text-[10px] text-slate-500">
                  {point.lat?.toFixed(4)}, {point.lng?.toFixed(4)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
