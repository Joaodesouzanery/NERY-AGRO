import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Database,
  Factory,
  Gauge,
  LineChart,
  Link2,
  Plug,
  RefreshCw,
  ScanSearch,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildCogsModel,
  buildFieldMarginModel,
  type CogsModel,
  useConnectedAgroData,
} from "@/lib/connected-agro-data";
import type { FieldMargin } from "@/lib/cost-center-metrics";
import { EmptyState } from "@/components/empty-state";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/otimizacao-cogs")({
  head: () => ({
    meta: [
      { title: "Otimização de COGS - AgroTorre" },
      {
        name: "description",
        content:
          "Custo de mercadoria vendida e custo de servir com visibilidade por etapa, SKU, região, processo e cenário.",
      },
    ],
  }),
  component: CogsPage,
});

const AREA = "cogs";

const modules: OperationModuleConfig[] = [
  {
    id: "etapas",
    label: "Etapas de Produção",
    shortLabel: "Etapas",
    description: "Custo por etapa, da matéria-prima à entrega final.",
    icon: Factory,
    fields: [
      { key: "produto", label: "Produto/SKU" },
      { key: "etapa", label: "Etapa" },
      { key: "familia", label: "Família" },
      { key: "planta", label: "Planta/Base" },
      { key: "regiao", label: "Região" },
      { key: "custo", label: "Custo", type: "number" },
      { key: "volume", label: "Volume", type: "number" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "fontes",
    label: "Fontes de Custo",
    shortLabel: "Fontes",
    description: "ERP, MES, WMS, financeiro, campo, frete e perdas em um modelo unificado.",
    icon: Database,
    fields: [
      { key: "fonte", label: "Fonte" },
      { key: "tipo", label: "Tipo" },
      { key: "modulo_origem", label: "Módulo origem" },
      { key: "campo_chave", label: "Campo chave" },
      { key: "periodo", label: "Período" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "ineficiencias",
    label: "Ineficiências Ocultas",
    shortLabel: "Ineficiências",
    description: "Onde a margem é consumida por perdas, rota, processo ou complexidade.",
    icon: ScanSearch,
    fields: [
      { key: "ponto", label: "Ponto crítico" },
      { key: "causa", label: "Causa" },
      { key: "produto", label: "Produto/SKU" },
      { key: "impacto", label: "Impacto no COGS (%)", type: "number" },
      { key: "valor", label: "Valor estimado", type: "number" },
      { key: "acao", label: "Ação recomendada", type: "textarea" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "simulacoes",
    label: "Simulações de Cenário",
    shortLabel: "Simulações",
    description: "Impacto de fornecedor, rota, processo, preço de insumo, perda e capacidade.",
    icon: Gauge,
    fields: [
      { key: "nome", label: "Cenário" },
      { key: "alavanca", label: "Alavanca" },
      { key: "impacto", label: "Impacto no COGS (%)", type: "number" },
      { key: "economia", label: "Economia estimada", type: "number" },
      { key: "risco", label: "Risco" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios Granulares",
    shortLabel: "Relatórios",
    description: "COGS por SKU, família, cultura, talhão, animal/lote, planta, rota e região.",
    icon: LineChart,
    fields: [
      { key: "sku", label: "SKU/Produto" },
      { key: "familia", label: "Família" },
      { key: "cultura_lote", label: "Cultura/Lote" },
      { key: "planta_rota", label: "Planta/Rota" },
      { key: "regiao", label: "Região" },
      { key: "cogs", label: "COGS", type: "number" },
      { key: "margem", label: "Margem", type: "number" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "atualizacao",
    label: "Atualização Contínua",
    shortLabel: "Atualização",
    description: "Monitoramento de preço de insumos, fretes, perdas e custos em tempo real.",
    icon: RefreshCw,
    fields: [
      { key: "evento", label: "Evento" },
      { key: "origem", label: "Origem" },
      { key: "valor_anterior", label: "Valor anterior", type: "number" },
      { key: "valor_atual", label: "Valor atual", type: "number" },
      { key: "variacao", label: "Variação (%)", type: "number" },
      { key: "data", label: "Data", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  etapas: [
    record("etapas", "1", {
      produto: "Cesta orgânica",
      etapa: "Matéria-prima",
      familia: "CSA",
      planta: "Talhão A",
      regiao: "Sudeste",
      custo: "42000",
      volume: "1400",
      status: "Calculado",
    }),
    record("etapas", "2", {
      produto: "Cesta orgânica",
      etapa: "Embalagem",
      familia: "CSA",
      planta: "Packing House",
      regiao: "Sudeste",
      custo: "8200",
      volume: "1400",
      status: "Atenção",
    }),
  ],
  fontes: [
    record("fontes", "1", {
      fonte: "Financeiro",
      tipo: "financial_records",
      modulo_origem: "custos",
      campo_chave: "custo_total",
      periodo: "Mensal",
      status: "Ativa",
    }),
  ],
  ineficiencias: [
    record("ineficiencias", "1", {
      ponto: "Transporte com baixa densidade",
      causa: "Rota fragmentada",
      produto: "Cesta orgânica",
      impacto: "4.8",
      valor: "4200",
      acao: "Consolidar entregas por região e janela.",
      status: "Revisar",
    }),
  ],
  simulacoes: [
    record("simulacoes", "1", {
      nome: "Trocar fornecedor de caixas",
      alavanca: "Fornecedor",
      impacto: "-6.5",
      economia: "3400",
      risco: "Baixo",
      status: "Favorável",
    }),
  ],
  relatorios: [
    record("relatorios", "1", {
      sku: "CSA-ORG",
      familia: "CSA",
      cultura_lote: "Hortaliças",
      planta_rota: "Curitiba > São Paulo",
      regiao: "Sudeste",
      cogs: "37.2",
      margem: "20.8",
      status: "OK",
    }),
  ],
  atualizacao: [
    record("atualizacao", "1", {
      evento: "Preço do diesel",
      origem: "Fretes",
      valor_anterior: "5.72",
      valor_atual: "5.91",
      variacao: "3.3",
      data: "2026-06-02",
      status: "Atualizado",
    }),
  ],
};

function record(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return {
    id: `demo-cogs-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Helpers de foco por aba (padrão replicado de logistica.tsx) ──
const normStr = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const countByStatus = (records: OperationRecord[], key: string, term: string) =>
  records.filter((r) => normStr(r.payload[key]).includes(term)).length;

const sumField = (records: OperationRecord[], key: string) =>
  records.reduce((sum, r) => sum + numberValue(r.payload[key]), 0);

function groupCount(records: OperationRecord[], key: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[key] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function CogsPage() {
  const { snapshot } = useConnectedAgroData();
  const model = buildCogsModel(snapshot);
  const fieldMargins = buildFieldMarginModel(snapshot);

  return (
    <OperationAreaPage
      area={AREA}
      title="Otimização de COGS"
      description="Custo de mercadoria vendida com visibilidade por etapa, SKU, família, planta, região e cenário."
      modules={modules}
      demoByModule={demoByModule}
      renderOverviewAddon={() => <CogsOverview model={model} fieldMargins={fieldMargins} />}
      renderModuleAddon={(module, records) => (
        <CogsModuleAddon module={module} records={records} model={model} />
      )}
    />
  );
}

function CogsOverview({ model, fieldMargins }: { model: CogsModel; fieldMargins: FieldMargin[] }) {
  const stageLabel = (key: string) => model.stages.find((s) => s.key === key)?.label ?? key;
  const topVariances = model.variances.filter((v) => v.autorizado > 0).slice(0, 6);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const varianceTone = (level: string) =>
    level === "danger" ? "text-destructive" : level === "warning" ? "text-warning" : "text-success";
  const topStages = model.stages.filter((stage) => stage.key !== "final" && stage.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <CogsKpi label="COGS total" value={money(model.total)} tone="warning" />
        <CogsKpi label="Receita conectada" value={money(model.revenue)} tone="primary" />
        <CogsKpi
          label="Margem operacional"
          value={money(model.margin)}
          tone={model.margin >= 0 ? "success" : "danger"}
        />
        <CogsKpi label="Alertas de margem" value={String(model.alerts.length)} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-border bg-background/60 p-4">
          <div className="mb-3">
            <h4 className="font-semibold">Custo por etapa da cadeia</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Matéria-prima, insumos, processo, perdas, frete e comercialização.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={topStages}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {topStages.map((stage, index) => (
                    <Cell
                      key={stage.key}
                      fill={index % 2 ? "var(--color-chart-2)" : "var(--color-primary)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h4 className="font-semibold">Ineficiências ocultas</h4>
          </div>
          <div className="space-y-2">
            {model.alerts.map((alert) => (
              <div key={alert.id} className="rounded-md border border-border bg-card p-3">
                <div className="text-sm font-medium">{alert.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{alert.description}</div>
              </div>
            ))}
            {model.alerts.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma ineficiência crítica detectada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financeiro V2: centros de custo (orçado × realizado) por etapa/talhão + ROI */}
      {(topVariances.length > 0 || fieldMargins.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          {topVariances.length > 0 && (
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="mb-3">
                <h4 className="font-semibold">Centros de custo — orçado × realizado</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Consumo do orçamento por centro (inclui contratos vinculados).
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-2 font-medium">Centro</th>
                      <th className="py-1.5 pr-2 font-medium">Etapa</th>
                      <th className="py-1.5 pr-2 text-right font-medium">Realizado</th>
                      <th className="py-1.5 pr-2 text-right font-medium">Autorizado</th>
                      <th className="py-1.5 text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVariances.map((v) => (
                      <tr key={v.id} className="border-b border-border/50">
                        <td className="py-1.5 pr-2">{v.nome}</td>
                        <td className="py-1.5 pr-2 text-xs text-muted-foreground">
                          {stageLabel(v.stage)}
                          {v.talhao_id ? ` · ${v.talhao_id}` : ""}
                        </td>
                        <td className="py-1.5 pr-2 text-right">{money(v.realizado)}</td>
                        <td className="py-1.5 pr-2 text-right text-muted-foreground">
                          {money(v.autorizado)}
                        </td>
                        <td className={`py-1.5 text-right font-medium ${varianceTone(v.level)}`}>
                          {pct(v.ratio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {fieldMargins.length > 0 && (
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="mb-3">
                <h4 className="font-semibold">Margem e ROI por talhão</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Receita (contratos de venda) − custo (centros + contratos). Maior ROI primeiro.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-2 font-medium">Talhão</th>
                      <th className="py-1.5 pr-2 text-right font-medium">Receita</th>
                      <th className="py-1.5 pr-2 text-right font-medium">Custo</th>
                      <th className="py-1.5 pr-2 text-right font-medium">Margem</th>
                      <th className="py-1.5 text-right font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldMargins.slice(0, 8).map((m) => (
                      <tr key={m.talhao_id} className="border-b border-border/50">
                        <td className="py-1.5 pr-2">{m.talhao_id}</td>
                        <td className="py-1.5 pr-2 text-right">{money(m.receita)}</td>
                        <td className="py-1.5 pr-2 text-right text-muted-foreground">
                          {money(m.custo)}
                        </td>
                        <td
                          className={`py-1.5 pr-2 text-right ${m.margem >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {money(m.margem)}
                        </td>
                        <td
                          className={`py-1.5 text-right font-medium ${m.roi >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {pct(m.roi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CogsModuleAddon({
  module,
  records,
  model,
}: {
  module: OperationModuleConfig;
  records: OperationRecord[];
  model: CogsModel;
}) {
  if (module.id === "etapas") {
    return <StageSourceList model={model} />;
  }
  if (module.id === "relatorios") {
    return <GranularReports model={model} />;
  }
  if (module.id === "simulacoes") {
    return <ScenarioCards records={records} model={model} />;
  }
  if (module.id === "fontes") {
    return <SourcesFocus records={records} model={model} />;
  }
  if (module.id === "ineficiencias") {
    return <InefficiencyFocus records={records} />;
  }
  if (module.id === "atualizacao") {
    return <ContinuousUpdateFocus records={records} />;
  }
  return null;
}

// ── Fontes de Custo: saúde das integrações + cobertura do modelo de COGS ──
function SourcesFocus({ records, model }: { records: OperationRecord[]; model: CogsModel }) {
  const ativas = countByStatus(records, "status", "ativ");
  const byTipo = groupCount(records, "tipo");
  const byModulo = groupCount(records, "modulo_origem");
  // Cobertura: quantas das etapas do modelo (com origem) têm custo > 0.
  const cobertura = model.stages.filter((s) => s.key !== "final" && s.value > 0);
  const coberturaPct = model.stages.length
    ? Math.round((cobertura.length / model.stages.filter((s) => s.key !== "final").length) * 100)
    : 0;

  if (!records.length) {
    return (
      <div className="space-y-4">
        <RichTabKpis
          kpis={[
            { label: "Fontes conectadas", value: 0, icon: Plug },
            { label: "Fontes ativas", value: 0, icon: CheckCircle2 },
            { label: "Cobertura de COGS", value: `${coberturaPct}%`, icon: Gauge },
            { label: "Módulos de origem", value: 0, icon: Database },
          ]}
        />
        <RichTabPanel
          title="Sem fontes mapeadas"
          description="Conecte Financeiro, Campo, Logística e Inteligência para alimentar o COGS."
        >
          <EmptyState
            title="Nenhuma fonte cadastrada"
            description="Cada fonte mapeia um campo de outro módulo para uma etapa do custo."
            icon={Plug}
          />
        </RichTabPanel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Fontes conectadas", value: records.length, icon: Plug },
          {
            label: "Fontes ativas",
            value: ativas,
            icon: CheckCircle2,
            trend: ativas === records.length ? "todas ativas" : "verificar",
            trendDir: ativas === records.length ? "up" : "down",
          },
          {
            label: "Cobertura de COGS",
            value: `${coberturaPct}%`,
            icon: Gauge,
            hint: `${cobertura.length} etapas com custo`,
          },
          { label: "Módulos de origem", value: byModulo.length, icon: Database },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Fontes por tipo" description="Distribuição das integrações de custo">
          {byTipo.length ? (
            <RichBarList items={byTipo} />
          ) : (
            <EmptyState title="Sem classificação por tipo" />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Linhagem do custo"
          description="Etapas do modelo e a fonte que as alimenta"
        >
          <div className="space-y-2">
            {model.stages
              .filter((s) => s.key !== "final")
              .map((stage) => {
                const filled = stage.value > 0;
                return (
                  <div
                    key={stage.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">
                        <strong>{stage.label}</strong>{" "}
                        <span className="text-xs text-muted-foreground">· {stage.source}</span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                        filled ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {filled ? money(stage.value) : "sem dado"}
                    </span>
                  </div>
                );
              })}
          </div>
        </RichTabPanel>
      </div>
    </div>
  );
}

// ── Ineficiências Ocultas: severidade do impacto, perda total e ranking ──
function InefficiencyFocus({ records }: { records: OperationRecord[] }) {
  const perdaTotal = sumField(records, "valor");
  const impactos = records.map((r) => numberValue(r.payload.impacto)).filter((n) => n > 0);
  const maiorImpacto = impactos.length ? Math.max(...impactos) : 0;
  const criticos = records.filter((r) => numberValue(r.payload.impacto) >= 5).length;
  const ranking = [...records]
    .sort((a, b) => numberValue(b.payload.valor) - numberValue(a.payload.valor))
    .slice(0, 6)
    .map((r) => ({
      label: r.payload.ponto || r.payload.produto || "Ponto crítico",
      value: numberValue(r.payload.valor),
    }));
  const top = [...records]
    .sort((a, b) => numberValue(b.payload.impacto) - numberValue(a.payload.impacto))
    .slice(0, 4);

  if (!records.length) {
    return (
      <div className="space-y-4">
        <RichTabKpis
          kpis={[
            { label: "Pontos críticos", value: 0, icon: ScanSearch },
            { label: "Perda estimada", value: money(0), icon: Wallet },
            { label: "Críticos (≥5%)", value: 0, icon: AlertTriangle },
            { label: "Maior impacto", value: "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Nenhuma ineficiência mapeada">
          <EmptyState
            title="Sem ineficiências registradas"
            description="Registre pontos críticos para priorizar onde a margem é consumida."
            icon={CheckCircle2}
          />
        </RichTabPanel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Pontos críticos", value: records.length, icon: ScanSearch },
          { label: "Perda estimada", value: money(perdaTotal), icon: Wallet },
          {
            label: "Críticos (≥5%)",
            value: criticos,
            icon: AlertTriangle,
            trend: criticos ? "priorizar" : "ok",
            trendDir: criticos ? "down" : "up",
          },
          {
            label: "Maior impacto",
            value: maiorImpacto ? `${maiorImpacto.toLocaleString("pt-BR")}%` : "—",
            icon: Gauge,
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Maiores perdas estimadas"
          description="Onde a margem é mais consumida (R$)"
        >
          {ranking.length ? (
            <RichBarList items={ranking} format={money} color="var(--color-destructive)" />
          ) : (
            <EmptyState title="Sem valores estimados" />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Top causas por impacto"
          description="Maior % de impacto no COGS + ação recomendada"
        >
          <div className="space-y-2">
            {top.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{r.payload.ponto || "—"}</span>
                  <span className="shrink-0 rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive tabular-nums">
                    {numberValue(r.payload.impacto).toLocaleString("pt-BR")}%
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.payload.causa ? `${r.payload.causa} · ` : ""}
                  {r.payload.acao || "Sem ação recomendada"}
                </div>
              </div>
            ))}
          </div>
        </RichTabPanel>
      </div>
    </div>
  );
}

// ── Atualização Contínua: volatilidade de preços/custos em tempo real ──
function ContinuousUpdateFocus({ records }: { records: OperationRecord[] }) {
  const altas = records.filter((r) => numberValue(r.payload.variacao) > 0).length;
  const baixas = records.filter((r) => numberValue(r.payload.variacao) < 0).length;
  const variacoesAbs = records.map((r) => Math.abs(numberValue(r.payload.variacao)));
  const maiorVar = variacoesAbs.length ? Math.max(...variacoesAbs) : 0;
  const recent = [...records]
    .sort((a, b) => String(b.payload.data ?? "").localeCompare(String(a.payload.data ?? "")))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Eventos monitorados", value: records.length, icon: RefreshCw },
          {
            label: "Em alta",
            value: altas,
            icon: ArrowUpRight,
            trend: altas ? "pressão de custo" : "estável",
            trendDir: altas ? "down" : "up",
          },
          {
            label: "Em queda",
            value: baixas,
            icon: ArrowDownRight,
            trend: baixas ? "alívio" : "—",
            trendDir: baixas ? "up" : "neutral",
          },
          {
            label: "Maior variação",
            value: maiorVar ? `${maiorVar.toLocaleString("pt-BR")}%` : "—",
            icon: TrendingUp,
          },
        ]}
      />
      <RichTabPanel
        title="Timeline de variações de custo"
        description="Eventos recentes de preço de insumos, fretes e perdas (Realtime)"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            <RefreshCw className="h-3 w-3" />
            ao vivo
          </span>
        }
      >
        {recent.length ? (
          <div className="space-y-2">
            {recent.map((r) => {
              const variacao = numberValue(r.payload.variacao);
              const up = variacao > 0;
              const down = variacao < 0;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.payload.evento || "Evento"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.payload.origem ? `${r.payload.origem} · ` : ""}
                      {r.payload.data || "sem data"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-right">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.payload.valor_anterior || "—"} → {r.payload.valor_atual || "—"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                        up && "bg-destructive/12 text-destructive",
                        down && "bg-success/12 text-success",
                        !up && !down && "bg-muted text-muted-foreground",
                      )}
                    >
                      {up && <ArrowUpRight className="h-3 w-3" />}
                      {down && <ArrowDownRight className="h-3 w-3" />}
                      {variacao.toLocaleString("pt-BR")}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Sem eventos de atualização"
            description="Mudanças de Financeiro, Logística, Campo e Inteligência aparecem aqui em tempo real."
            icon={RefreshCw}
          />
        )}
      </RichTabPanel>
    </div>
  );
}

function StageSourceList({ model }: { model: CogsModel }) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {model.stages
        .filter((stage) => stage.key !== "final")
        .map((stage) => (
          <div key={stage.key} className="rounded-lg border border-border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">{stage.source}</div>
            <div className="mt-1 text-sm font-semibold">{stage.label}</div>
            <div className="mt-1 text-lg font-semibold text-primary">{money(stage.value)}</div>
          </div>
        ))}
    </div>
  );
}

function GranularReports({ model }: { model: CogsModel }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Margem por SKU/produto conectado
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {model.reports.map((report) => (
          <div key={String(report.sku)} className="rounded-md border border-border bg-card p-3">
            <div className="text-sm font-semibold">{report.produto}</div>
            <div className="mt-1 text-xs text-muted-foreground">{report.sku}</div>
            <div
              className={cn(
                "mt-2 text-lg font-semibold",
                Number(report.margem) >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {money(Number(report.margem))}
            </div>
          </div>
        ))}
        {model.reports.length === 0 && (
          <div className="py-6 text-sm text-muted-foreground">
            Cadastre custos por produto no Financeiro para gerar relatórios granulares.
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioCards({ records, model }: { records: OperationRecord[]; model: CogsModel }) {
  const scenarios = model.scenarios.length
    ? model.scenarios
    : records.map((recordItem) => ({
        nome: recordItem.payload.nome ?? "Cenário",
        impacto: recordItem.payload.impacto ?? "0",
        economia: Number(recordItem.payload.economia ?? 0),
        status: recordItem.payload.status ?? "Em análise",
      }));

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {scenarios.map((scenario) => (
        <div
          key={String(scenario.nome)}
          className="rounded-lg border border-border bg-background/60 p-3"
        >
          <div className="text-sm font-semibold">{scenario.nome}</div>
          <div className="mt-1 text-xs text-muted-foreground">Status: {scenario.status}</div>
          <div className="mt-2 text-lg font-semibold text-success">
            {money(Number(scenario.economia))}
          </div>
          <div className="text-xs text-muted-foreground">Impacto: {scenario.impacto}%</div>
        </div>
      ))}
    </div>
  );
}

function CogsKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calculator className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={cn("mt-1 text-lg font-semibold", toneClass)}>{value}</div>
    </div>
  );
}
