import { createFileRoute } from "@tanstack/react-router";
import { buildInteligenciaOverview } from "@/lib/overview/inteligencia";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Coins,
  LineChart,
  Percent,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/inteligencia")({
  head: () => ({
    meta: [
      { title: "Inteligência - AgroTorre" },
      {
        name: "description",
        content:
          "Relatórios, gráficos de desempenho, alertas de preços CEASA/CNA e perdas com causas.",
      },
    ],
  }),
  component: InteligenciaPage,
});

const AREA = "inteligencia";

const modules: OperationModuleConfig[] = [
  {
    id: "lucratividade",
    label: "Lucratividade por Cultura Comparada",
    shortLabel: "Lucratividade",
    description: "Receita, custo, margem e safra por cultura.",
    icon: TrendingUp,
    fields: [
      { key: "cultura", label: "Cultura" },
      { key: "safra", label: "Safra" },
      { key: "receita", label: "Receita", type: "number" },
      { key: "custo", label: "Custo", type: "number" },
      { key: "margem", label: "Margem", type: "number" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "desempenho",
    label: "Desempenho Mês a Mês / Ano a Ano",
    shortLabel: "Desempenho",
    description: "Indicadores por período, comparativo e tendência em gráficos.",
    icon: LineChart,
    fields: [
      { key: "periodo", label: "Período" },
      { key: "indicador", label: "Indicador" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "comparativo", label: "Comparativo", type: "number" },
      { key: "ano", label: "Ano" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "precos",
    label: "Alertas de Preços CEASA/CNA",
    shortLabel: "Preços",
    description: "Alertas configuráveis por produto, praça/fonte e limite de preço.",
    icon: AlertTriangle,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "fonte", label: "Praça/Fonte" },
      { key: "preco", label: "Preço", type: "number" },
      { key: "limite_alerta", label: "Limite de alerta", type: "number" },
      { key: "data", label: "Data", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "perdas",
    label: "Relatório de Perdas com Causas",
    shortLabel: "Perdas",
    description: "Produto/cultura, volume perdido, causa, valor estimado e ação.",
    icon: BarChart3,
    fields: [
      { key: "produto", label: "Produto/Cultura" },
      { key: "volume_perdido", label: "Volume perdido", type: "number" },
      { key: "causa", label: "Causa" },
      { key: "valor_estimado", label: "Valor estimado", type: "number" },
      { key: "acao", label: "Ação" },
      { key: "status", label: "Status" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  lucratividade: [
    record("lucratividade", "1", {
      cultura: "Tomate",
      safra: "2025/26",
      receita: "148000",
      custo: "92000",
      margem: "56000",
      status: "Acima da meta",
    }),
    record("lucratividade", "2", {
      cultura: "Alface",
      safra: "2025/26",
      receita: "82000",
      custo: "51000",
      margem: "31000",
      status: "Estável",
    }),
    record("lucratividade", "3", {
      cultura: "Milho verde",
      safra: "2025/26",
      receita: "116000",
      custo: "87000",
      margem: "29000",
      status: "Atenção",
    }),
  ],
  desempenho: [
    record("desempenho", "1", {
      periodo: "Jan",
      indicador: "Receita",
      valor: "68000",
      comparativo: "61000",
      ano: "2026",
      status: "OK",
    }),
    record("desempenho", "2", {
      periodo: "Fev",
      indicador: "Receita",
      valor: "73000",
      comparativo: "65500",
      ano: "2026",
      status: "OK",
    }),
    record("desempenho", "3", {
      periodo: "Mar",
      indicador: "Receita",
      valor: "70500",
      comparativo: "69000",
      ano: "2026",
      status: "Estável",
    }),
  ],
  precos: [
    record("precos", "1", {
      produto: "Tomate",
      fonte: "CEASA Curitiba",
      preco: "88",
      limite_alerta: "80",
      data: "2026-05-31",
      status: "Alerta",
    }),
    record("precos", "2", {
      produto: "Alface",
      fonte: "CNA",
      preco: "42",
      limite_alerta: "38",
      data: "2026-05-31",
      status: "Monitorar",
    }),
  ],
  perdas: [
    record("perdas", "1", {
      produto: "Tomate",
      volume_perdido: "340",
      causa: "Transporte",
      valor_estimado: "4200",
      acao: "Revisar embalagem e rota.",
      status: "Em ação",
    }),
    record("perdas", "2", {
      produto: "Folhosas",
      volume_perdido: "120",
      causa: "Calor",
      valor_estimado: "1350",
      acao: "Antecipar colheita.",
      status: "Revisar",
    }),
  ],
};

function record(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return {
    id: `demo-${AREA}-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function num(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const pct = (n: number) => `${n.toFixed(n >= 10 || n <= -10 ? 0 : 1)}%`;

const normStr = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const countByStatus = (records: OperationRecord[], key: string, term: string) =>
  records.filter((r) => normStr(r.payload[key]).includes(term)).length;

const sumField = (records: OperationRecord[], key: string) =>
  records.reduce((total, r) => total + num(r.payload[key]), 0);

function groupSum(records: OperationRecord[], labelKey: string, valueKey: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const label = (r.payload[labelKey] || "—").trim() || "—";
    map.set(label, (map.get(label) ?? 0) + num(r.payload[valueKey]));
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// ── Foco por aba: KPIs reais + visual de domínio acima da tabela CRUD. ──
const moduleFocus: Record<string, (records: OperationRecord[]) => ReactNode> = {
  lucratividade: (records) => {
    const receita = sumField(records, "receita");
    const custo = sumField(records, "custo");
    const margem = records.length ? sumField(records, "margem") : 0;
    const margemPct = receita > 0 ? (margem / receita) * 100 : 0;
    const acimaMeta = countByStatus(records, "status", "acima");
    const atencao =
      countByStatus(records, "status", "atenc") + countByStatus(records, "status", "abaixo");
    const ranking = [...records]
      .map((r) => ({ label: r.payload.cultura || "—", value: num(r.payload.margem) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const margemPorCultura = [...records]
      .map((r) => ({
        label: r.payload.cultura || "—",
        value:
          num(r.payload.receita) > 0 ? (num(r.payload.margem) / num(r.payload.receita)) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return (
      <div className="space-y-4">
        <RichTabKpis
          kpis={[
            { label: "Culturas", value: records.length, icon: Sprout },
            { label: "Receita total", value: brl(receita), icon: Wallet },
            { label: "Custo total", value: brl(custo), icon: Coins },
            {
              label: "Margem total",
              value: brl(margem),
              icon: margem >= 0 ? ArrowUpRight : ArrowDownRight,
              trendDir: margem >= 0 ? "up" : "down",
            },
            {
              label: "Margem média",
              value: pct(margemPct),
              icon: Percent,
              trend: margemPct >= 25 ? "saudável" : "apertada",
              trendDir: margemPct >= 25 ? "up" : "down",
            },
            {
              label: "Acima da meta",
              value: `${acimaMeta}/${records.length || 0}`,
              icon: Target,
              trend: atencao ? `${atencao} em atenção` : "ok",
              trendDir: atencao ? "down" : "up",
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RichTabPanel title="Lucro por cultura" description="Margem absoluta da safra (R$)">
            {ranking.length ? (
              <RichBarList items={ranking} format={brl} color="var(--color-success)" />
            ) : (
              <EmptyState title="Sem culturas cadastradas" icon={Sprout} />
            )}
          </RichTabPanel>
          <RichTabPanel title="Eficiência de margem" description="Margem como % da receita">
            {margemPorCultura.length ? (
              <RichBarList items={margemPorCultura} format={pct} />
            ) : (
              <EmptyState title="Sem dados de margem" icon={Percent} />
            )}
          </RichTabPanel>
        </div>
      </div>
    );
  },
  desempenho: (records) => {
    const valorTotal = sumField(records, "valor");
    const compTotal = sumField(records, "comparativo");
    const variacao = compTotal > 0 ? ((valorTotal - compTotal) / compTotal) * 100 : 0;
    const acima = records.filter((r) => num(r.payload.valor) >= num(r.payload.comparativo)).length;
    const melhor = [...records].sort(
      (a, b) =>
        num(b.payload.valor) -
        num(b.payload.comparativo) -
        (num(a.payload.valor) - num(a.payload.comparativo)),
    )[0];
    const variacaoPorPeriodo = [...records]
      .map((r) => ({
        label: r.payload.periodo || "—",
        value:
          num(r.payload.comparativo) > 0
            ? ((num(r.payload.valor) - num(r.payload.comparativo)) / num(r.payload.comparativo)) *
              100
            : 0,
      }))
      .slice(0, 8);
    return (
      <div className="space-y-4">
        <RichTabKpis
          kpis={[
            { label: "Períodos", value: records.length, icon: LineChart },
            { label: "Acumulado", value: brl(valorTotal), icon: Wallet },
            {
              label: "vs. comparativo",
              value: pct(variacao),
              icon: variacao >= 0 ? TrendingUp : TrendingDown,
              trendDir: variacao >= 0 ? "up" : "down",
              trend: variacao >= 0 ? "crescendo" : "recuando",
            },
            {
              label: "Acima do comparativo",
              value: `${acima}/${records.length || 0}`,
              icon: CheckCircle2,
              trendDir: acima >= records.length - acima ? "up" : "down",
            },
            {
              label: "Melhor período",
              value: melhor?.payload.periodo || "—",
              icon: Target,
              hint: melhor ? brl(num(melhor.payload.valor)) : undefined,
            },
          ]}
        />
        <RichTabPanel
          title="Variação por período"
          description="Diferença % do realizado contra o comparativo"
        >
          {variacaoPorPeriodo.length ? (
            <RichBarList items={variacaoPorPeriodo} format={pct} />
          ) : (
            <EmptyState title="Sem períodos cadastrados" icon={LineChart} />
          )}
        </RichTabPanel>
      </div>
    );
  },
  precos: (records) => {
    const disparados = records.filter(
      (r) =>
        num(r.payload.preco) >= num(r.payload.limite_alerta) && num(r.payload.limite_alerta) > 0,
    );
    const monitorar = countByStatus(records, "status", "monitor");
    const folga =
      records.reduce((acc, r) => {
        const limite = num(r.payload.limite_alerta);
        const preco = num(r.payload.preco);
        if (limite <= 0) return acc;
        return acc + ((preco - limite) / limite) * 100;
      }, 0) / Math.max(1, records.filter((r) => num(r.payload.limite_alerta) > 0).length);
    const distancia = [...records]
      .map((r) => ({
        label: `${r.payload.produto || "—"} · ${r.payload.fonte || ""}`.trim(),
        value:
          num(r.payload.limite_alerta) > 0
            ? ((num(r.payload.preco) - num(r.payload.limite_alerta)) /
                num(r.payload.limite_alerta)) *
              100
            : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return (
      <div className="space-y-4">
        <RichTabKpis
          kpis={[
            { label: "Alertas configurados", value: records.length, icon: Bell },
            {
              label: "Disparados",
              value: disparados.length,
              icon: AlertTriangle,
              trend: disparados.length ? "ação" : "ok",
              trendDir: disparados.length ? "down" : "up",
            },
            { label: "Em monitoramento", value: monitorar, icon: LineChart },
            {
              label: "Folga média ao limite",
              value: Number.isFinite(folga) ? pct(folga) : "—",
              icon: Percent,
              trendDir: folga >= 0 ? "down" : "up",
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RichTabPanel
            title="Distância do limite"
            description="% do preço atual acima/abaixo do alerta"
          >
            {distancia.length ? (
              <RichBarList items={distancia} format={pct} color="var(--color-destructive)" />
            ) : (
              <EmptyState title="Sem alertas cadastrados" icon={Bell} />
            )}
          </RichTabPanel>
          <RichTabPanel title="Alertas disparados" description="Produtos acima do limite definido">
            {disparados.length ? (
              <div className="space-y-2">
                {disparados.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      <strong>{r.payload.produto || "—"}</strong> · {r.payload.fonte || "—"}
                    </span>
                    <span className="shrink-0 rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                      {brl(num(r.payload.preco))} ≥ {brl(num(r.payload.limite_alerta))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhum alerta disparado" icon={CheckCircle2} />
            )}
          </RichTabPanel>
        </div>
      </div>
    );
  },
  perdas: (records) => {
    const valorPerdido = sumField(records, "valor_estimado");
    const volume = sumField(records, "volume_perdido");
    const emAcao =
      countByStatus(records, "status", "acao") + countByStatus(records, "status", "açao");
    const porCausa = groupSum(records, "causa", "valor_estimado").slice(0, 6);
    const porProduto = groupSum(records, "produto", "valor_estimado").slice(0, 6);
    const topCausa = porCausa[0];
    return (
      <div className="space-y-4">
        <RichTabKpis
          kpis={[
            { label: "Ocorrências", value: records.length, icon: BarChart3 },
            {
              label: "Prejuízo estimado",
              value: brl(valorPerdido),
              icon: TrendingDown,
              trendDir: "down",
            },
            {
              label: "Volume perdido",
              value: `${volume.toLocaleString("pt-BR")} kg`,
              icon: AlertTriangle,
            },
            {
              label: "Maior causa",
              value: topCausa?.label || "—",
              icon: AlertTriangle,
              hint: topCausa ? brl(topCausa.value) : undefined,
            },
            {
              label: "Em ação",
              value: `${emAcao}/${records.length || 0}`,
              icon: CheckCircle2,
              trendDir: emAcao >= records.length - emAcao ? "up" : "down",
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RichTabPanel title="Prejuízo por causa" description="Onde o dinheiro está sendo perdido">
            {porCausa.length ? (
              <RichBarList items={porCausa} format={brl} color="var(--color-destructive)" />
            ) : (
              <EmptyState title="Sem perdas cadastradas" icon={BarChart3} />
            )}
          </RichTabPanel>
          <RichTabPanel title="Prejuízo por produto" description="Culturas mais afetadas">
            {porProduto.length ? (
              <RichBarList items={porProduto} format={brl} />
            ) : (
              <EmptyState title="Sem perdas cadastradas" icon={BarChart3} />
            )}
          </RichTabPanel>
        </div>
      </div>
    );
  },
};

function renderModuleAddon(module: OperationModuleConfig, records: OperationRecord[]) {
  const focus = moduleFocus[module.id];
  return (
    <div className="space-y-4">
      {focus?.(records)}
      {renderCharts(module, records)}
    </div>
  );
}

function InteligenciaPage() {
  return (
    <OperationAreaPage
      area={AREA}
      title="Inteligência"
      description="Relatórios, gráficos e alertas configuráveis para apoiar decisões da fazenda."
      modules={modules}
      buildOverview={buildInteligenciaOverview}
      demoByModule={demoByModule}
      renderModuleAddon={renderModuleAddon}
    />
  );
}

function renderCharts(module: OperationModuleConfig, records: OperationRecord[]) {
  if (!["lucratividade", "desempenho", "perdas"].includes(module.id) || records.length === 0) {
    return null;
  }

  if (module.id === "desempenho") {
    const data = records.map((recordItem) => ({
      name: recordItem.payload.periodo,
      valor: num(recordItem.payload.valor),
      comparativo: num(recordItem.payload.comparativo),
    }));
    return (
      <ChartShell title="Desempenho comparado">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="valor" stroke="var(--color-primary)" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="comparativo"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  const data = records.map((recordItem) => ({
    name: recordItem.payload.cultura ?? recordItem.payload.produto,
    receita: num(recordItem.payload.receita),
    custo: num(recordItem.payload.custo),
    margem: num(recordItem.payload.margem),
    perdas: num(recordItem.payload.valor_estimado),
  }));

  return (
    <ChartShell title={module.id === "perdas" ? "Perdas estimadas" : "Lucratividade comparada"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
          <Tooltip />
          {module.id === "perdas" ? (
            <Bar dataKey="perdas" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
          ) : (
            <>
              <Bar dataKey="receita" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="margem" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="mt-3 h-64">{children}</div>
    </div>
  );
}
