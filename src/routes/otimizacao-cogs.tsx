import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calculator,
  Database,
  Factory,
  Gauge,
  LineChart,
  RefreshCw,
  ScanSearch,
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
import { buildCogsModel, type CogsModel, useConnectedAgroData } from "@/lib/connected-agro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/otimizacao-cogs")({
  head: () => ({
    meta: [
      { title: "Otimização de COGS - Nery Agro" },
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

function CogsPage() {
  const { snapshot } = useConnectedAgroData();
  const model = buildCogsModel(snapshot);

  return (
    <OperationAreaPage
      area={AREA}
      title="Otimização de COGS"
      description="Custo de mercadoria vendida com visibilidade por etapa, SKU, família, planta, região e cenário."
      modules={modules}
      demoByModule={demoByModule}
      renderOverviewAddon={() => <CogsOverview model={model} />}
      renderModuleAddon={(module, records) => (
        <CogsModuleAddon module={module} records={records} model={model} />
      )}
    />
  );
}

function CogsOverview({ model }: { model: CogsModel }) {
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
  if (module.id === "atualizacao") {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
        A atualização contínua usa Realtime para refletir mudanças de Financeiro, Logística, Campo e
        Inteligência quase instantaneamente, com refetch automático como fallback.
      </div>
    );
  }
  return null;
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
