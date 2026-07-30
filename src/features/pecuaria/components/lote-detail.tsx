import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Scale, TrendingUp, Users } from "lucide-react";
import { RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { chartColors } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";
import { Tag } from "@/features/pecuaria/components/tag";
import {
  desvioGmdTag,
  emCarencia,
  projecaoAbate,
  ultimoPeso,
} from "@/features/pecuaria/lib/derived";
import {
  FASE_LABEL,
  SISTEMA_LABEL,
  type Fase,
  type GmdAnimal,
  type PecAnimal,
  type PecEventoSanitario,
  type PecLote,
  type PecPesagem,
  type Sistema,
} from "@/features/pecuaria/types/domain";

type SubTab = "desempenho" | "animais" | "sanidade" | "nutricao" | "custos" | "rastreabilidade";

const SUB_TABS: { id: SubTab; label: string; placeholder?: boolean }[] = [
  { id: "desempenho", label: "Desempenho" },
  { id: "animais", label: "Animais" },
  { id: "sanidade", label: "Sanidade" },
  { id: "nutricao", label: "Nutrição", placeholder: true },
  { id: "custos", label: "Custos", placeholder: true },
  { id: "rastreabilidade", label: "Rastreabilidade", placeholder: true },
];

export function LoteDetail({
  lote,
  animais,
  pesagensMap,
  gmdMap,
  carenciaMap,
  sanitarios,
  onBack,
}: {
  lote: PecLote;
  animais: PecAnimal[];
  pesagensMap: Map<string, PecPesagem[]>;
  gmdMap: Map<string, GmdAnimal>;
  carenciaMap: Map<string, string>;
  sanitarios: PecEventoSanitario[];
  onBack: () => void;
}) {
  const [sub, setSub] = useState<SubTab>("desempenho");

  const animaisDoLote = useMemo(
    () => animais.filter((a) => a.lote_id === lote.id),
    [animais, lote.id],
  );

  const pesoMedio = useMemo(() => {
    const pesos = animaisDoLote
      .map((a) => ultimoPeso(pesagensMap.get(a.id) ?? []))
      .filter((v): v is number => v !== null);
    return pesos.length ? pesos.reduce((s, v) => s + v, 0) / pesos.length : null;
  }, [animaisDoLote, pesagensMap]);

  const gmdMedioLote = useMemo(() => {
    const gmds = animaisDoLote
      .map((a) => gmdMap.get(a.id)?.gmd_medio ?? null)
      .filter((v): v is number => v !== null);
    return gmds.length ? gmds.reduce((s, v) => s + v, 0) / gmds.length : null;
  }, [animaisDoLote, gmdMap]);

  const projecao = projecaoAbate(pesoMedio, lote.peso_alvo_kg, gmdMedioLote);

  // Evolução do peso médio do lote por mês (pesagens reais).
  const serieMensal = useMemo(() => {
    const buckets = new Map<string, { soma: number; n: number }>();
    for (const a of animaisDoLote) {
      for (const p of pesagensMap.get(a.id) ?? []) {
        const mes = p.data.slice(0, 7);
        const b = buckets.get(mes) ?? { soma: 0, n: 0 };
        b.soma += p.peso_kg;
        b.n += 1;
        buckets.set(mes, b);
      }
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, b]) => ({ mes: mes.slice(2), peso: Math.round(b.soma / b.n) }));
  }, [animaisDoLote, pesagensMap]);

  const fmtGmd = (v: number | null) =>
    v === null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg/dia`;

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos lotes
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{lote.nome}</h2>
          {lote.fase && <Tag tone="primary">{FASE_LABEL[lote.fase as Fase]}</Tag>}
          {lote.sistema && <Tag tone="neutral">{SISTEMA_LABEL[lote.sistema as Sistema]}</Tag>}
        </div>
        <RichTabKpis
          className="mt-4"
          kpis={[
            { label: "Cabeças", value: animaisDoLote.length, icon: Users },
            {
              label: "Peso médio",
              value:
                pesoMedio !== null ? `${Math.round(pesoMedio).toLocaleString("pt-BR")} kg` : "—",
              icon: Scale,
            },
            { label: "GMD médio", value: fmtGmd(gmdMedioLote), icon: TrendingUp },
            {
              label: "Abate projetado",
              value: projecao ? projecao.data : "—",
              hint: projecao ? `em ~${projecao.dias} dias` : "sem GMD/alvo",
            },
            { label: "Custo/@", value: "—", hint: "Fase 5" },
            { label: "Margem", value: "—", hint: "Fase 5" },
          ]}
        />
      </header>

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition",
              sub === t.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {sub === "desempenho" && (
        <RichTabPanel
          title="Evolução do peso médio"
          description={
            projecao
              ? `Projeção até ${lote.peso_alvo_kg ?? "—"} kg no ritmo atual → ${projecao.data}`
              : "Sem GMD ou peso alvo para projetar o abate"
          }
        >
          {serieMensal.length >= 2 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={serieMensal} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                <XAxis dataKey="mes" fontSize={11} stroke={chartColors.mutedFg} />
                <YAxis fontSize={11} stroke={chartColors.mutedFg} />
                <Tooltip />
                {lote.peso_alvo_kg != null && (
                  <ReferenceLine
                    y={lote.peso_alvo_kg}
                    stroke={chartColors.c3}
                    strokeDasharray="4 4"
                    label={{ value: "alvo", fontSize: 10, fill: chartColors.mutedFg }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Sem histórico suficiente"
              description="São necessárias pesagens em ao menos 2 meses."
              icon={Scale}
            />
          )}
        </RichTabPanel>
      )}

      {sub === "animais" && (
        <RichTabPanel
          title="Animais do lote"
          description="Ordenados pelo desvio do GMD individual vs. média do lote"
        >
          {animaisDoLote.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-2">Brinco</th>
                    <th className="p-2">Últ. peso</th>
                    <th className="p-2">GMD</th>
                    <th className="p-2">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...animaisDoLote]
                    .map((a) => ({
                      a,
                      gmd: gmdMap.get(a.id)?.gmd_medio ?? null,
                      peso: ultimoPeso(pesagensMap.get(a.id) ?? []),
                    }))
                    .sort((x, y) => (y.gmd ?? -Infinity) - (x.gmd ?? -Infinity))
                    .map(({ a, gmd, peso }) => {
                      const tag = desvioGmdTag(gmd, gmdMedioLote);
                      const carencia = emCarencia(carenciaMap.get(a.id) ?? null);
                      return (
                        <tr key={a.id}>
                          <td className="p-2 font-medium">{a.brinco_visual ?? "—"}</td>
                          <td className="p-2 tabular-nums">
                            {peso !== null ? `${peso.toLocaleString("pt-BR")} kg` : "—"}
                          </td>
                          <td className="p-2 tabular-nums">{fmtGmd(gmd)}</td>
                          <td className="p-2">
                            {carencia ? (
                              <Tag tone="danger">Carência</Tag>
                            ) : tag === "destaque" ? (
                              <Tag tone="success">Destaque</Tag>
                            ) : tag === "investigar" ? (
                              <Tag tone="warning">Investigar</Tag>
                            ) : (
                              <Tag tone="neutral">Normal</Tag>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Lote sem animais" icon={Users} />
          )}
        </RichTabPanel>
      )}

      {sub === "sanidade" && (
        <RichTabPanel title="Sanidade do lote" description="Protocolos aplicados ao lote">
          {(() => {
            const eventos = sanitarios.filter((s) => s.lote_id === lote.id);
            return eventos.length ? (
              <ul className="divide-y divide-border text-sm">
                {eventos.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <span>{[s.tipo, s.produto].filter(Boolean).join(" — ") || "Evento"}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="tabular-nums">{s.data}</span>
                      {s.libera_em && emCarencia(s.libera_em) && (
                        <Tag tone="danger">carência até {s.libera_em}</Tag>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Sem eventos sanitários no lote" icon={Scale} />
            );
          })()}
        </RichTabPanel>
      )}

      {SUB_TABS.find((t) => t.id === sub)?.placeholder && (
        <RichTabPanel
          title={SUB_TABS.find((t) => t.id === sub)?.label ?? ""}
          description="Em construção"
        >
          <EmptyState title="Em construção" description="Chega numa próxima fase do rollout." />
        </RichTabPanel>
      )}
    </div>
  );
}
