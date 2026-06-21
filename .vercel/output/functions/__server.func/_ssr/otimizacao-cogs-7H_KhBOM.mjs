import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { O as OperationAreaPage } from "./operation-area-crud-DLgh87g5.mjs";
import { p as useConnectedAgroData, b as buildCogsModel } from "./connected-agro-data-B5gpgC4B.mjs";
import { c as cn } from "./router-D1uahgUG.mjs";
import "../_libs/sonner.mjs";
import { F as Factory, D as Database, a1 as ScanSearch, G as Gauge, k as ChartLine, _ as RefreshCw, ad as TriangleAlert, C as Calculator } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar, c as Cell } from "../_libs/recharts.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./import-records-button-BiVLSQbM.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/read-excel-file.mjs";
import "../_libs/fflate.mjs";
import "module";
import "./period-picker-BtQVPyDA.mjs";
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "./export-xlsx-CRIENmK4.mjs";
import "../_libs/xlsx.mjs";
import "./client-BHmQHd0X.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const AREA = "cogs";
const modules = [{
  id: "etapas",
  label: "Etapas de Produção",
  shortLabel: "Etapas",
  description: "Custo por etapa, da matéria-prima à entrega final.",
  icon: Factory,
  fields: [{
    key: "produto",
    label: "Produto/SKU"
  }, {
    key: "etapa",
    label: "Etapa"
  }, {
    key: "familia",
    label: "Família"
  }, {
    key: "planta",
    label: "Planta/Base"
  }, {
    key: "regiao",
    label: "Região"
  }, {
    key: "custo",
    label: "Custo",
    type: "number"
  }, {
    key: "volume",
    label: "Volume",
    type: "number"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "fontes",
  label: "Fontes de Custo",
  shortLabel: "Fontes",
  description: "ERP, MES, WMS, financeiro, campo, frete e perdas em um modelo unificado.",
  icon: Database,
  fields: [{
    key: "fonte",
    label: "Fonte"
  }, {
    key: "tipo",
    label: "Tipo"
  }, {
    key: "modulo_origem",
    label: "Módulo origem"
  }, {
    key: "campo_chave",
    label: "Campo chave"
  }, {
    key: "periodo",
    label: "Período"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "ineficiencias",
  label: "Ineficiências Ocultas",
  shortLabel: "Ineficiências",
  description: "Onde a margem é consumida por perdas, rota, processo ou complexidade.",
  icon: ScanSearch,
  fields: [{
    key: "ponto",
    label: "Ponto crítico"
  }, {
    key: "causa",
    label: "Causa"
  }, {
    key: "produto",
    label: "Produto/SKU"
  }, {
    key: "impacto",
    label: "Impacto no COGS (%)",
    type: "number"
  }, {
    key: "valor",
    label: "Valor estimado",
    type: "number"
  }, {
    key: "acao",
    label: "Ação recomendada",
    type: "textarea"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "simulacoes",
  label: "Simulações de Cenário",
  shortLabel: "Simulações",
  description: "Impacto de fornecedor, rota, processo, preço de insumo, perda e capacidade.",
  icon: Gauge,
  fields: [{
    key: "nome",
    label: "Cenário"
  }, {
    key: "alavanca",
    label: "Alavanca"
  }, {
    key: "impacto",
    label: "Impacto no COGS (%)",
    type: "number"
  }, {
    key: "economia",
    label: "Economia estimada",
    type: "number"
  }, {
    key: "risco",
    label: "Risco"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "relatorios",
  label: "Relatórios Granulares",
  shortLabel: "Relatórios",
  description: "COGS por SKU, família, cultura, talhão, animal/lote, planta, rota e região.",
  icon: ChartLine,
  fields: [{
    key: "sku",
    label: "SKU/Produto"
  }, {
    key: "familia",
    label: "Família"
  }, {
    key: "cultura_lote",
    label: "Cultura/Lote"
  }, {
    key: "planta_rota",
    label: "Planta/Rota"
  }, {
    key: "regiao",
    label: "Região"
  }, {
    key: "cogs",
    label: "COGS",
    type: "number"
  }, {
    key: "margem",
    label: "Margem",
    type: "number"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "atualizacao",
  label: "Atualização Contínua",
  shortLabel: "Atualização",
  description: "Monitoramento de preço de insumos, fretes, perdas e custos em tempo real.",
  icon: RefreshCw,
  fields: [{
    key: "evento",
    label: "Evento"
  }, {
    key: "origem",
    label: "Origem"
  }, {
    key: "valor_anterior",
    label: "Valor anterior",
    type: "number"
  }, {
    key: "valor_atual",
    label: "Valor atual",
    type: "number"
  }, {
    key: "variacao",
    label: "Variação (%)",
    type: "number"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "status",
    label: "Status"
  }]
}];
const demoByModule = {
  etapas: [record("etapas", "1", {
    produto: "Cesta orgânica",
    etapa: "Matéria-prima",
    familia: "CSA",
    planta: "Talhão A",
    regiao: "Sudeste",
    custo: "42000",
    volume: "1400",
    status: "Calculado"
  }), record("etapas", "2", {
    produto: "Cesta orgânica",
    etapa: "Embalagem",
    familia: "CSA",
    planta: "Packing House",
    regiao: "Sudeste",
    custo: "8200",
    volume: "1400",
    status: "Atenção"
  })],
  fontes: [record("fontes", "1", {
    fonte: "Financeiro",
    tipo: "financial_records",
    modulo_origem: "custos",
    campo_chave: "custo_total",
    periodo: "Mensal",
    status: "Ativa"
  })],
  ineficiencias: [record("ineficiencias", "1", {
    ponto: "Transporte com baixa densidade",
    causa: "Rota fragmentada",
    produto: "Cesta orgânica",
    impacto: "4.8",
    valor: "4200",
    acao: "Consolidar entregas por região e janela.",
    status: "Revisar"
  })],
  simulacoes: [record("simulacoes", "1", {
    nome: "Trocar fornecedor de caixas",
    alavanca: "Fornecedor",
    impacto: "-6.5",
    economia: "3400",
    risco: "Baixo",
    status: "Favorável"
  })],
  relatorios: [record("relatorios", "1", {
    sku: "CSA-ORG",
    familia: "CSA",
    cultura_lote: "Hortaliças",
    planta_rota: "Curitiba > São Paulo",
    regiao: "Sudeste",
    cogs: "37.2",
    margem: "20.8",
    status: "OK"
  })],
  atualizacao: [record("atualizacao", "1", {
    evento: "Preço do diesel",
    origem: "Fretes",
    valor_anterior: "5.72",
    valor_atual: "5.91",
    variacao: "3.3",
    data: "2026-06-02",
    status: "Atualizado"
  })]
};
function record(module, id, payload) {
  return {
    id: `demo-cogs-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}
function money(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
function CogsPage() {
  const {
    snapshot
  } = useConnectedAgroData();
  const model = buildCogsModel(snapshot);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(OperationAreaPage, { area: AREA, title: "Otimização de COGS", description: "Custo de mercadoria vendida com visibilidade por etapa, SKU, família, planta, região e cenário.", modules, demoByModule, renderOverviewAddon: () => /* @__PURE__ */ jsxRuntimeExports.jsx(CogsOverview, { model }), renderModuleAddon: (module, records) => /* @__PURE__ */ jsxRuntimeExports.jsx(CogsModuleAddon, { module, records, model }) });
}
function CogsOverview({
  model
}) {
  const topStages = model.stages.filter((stage) => stage.key !== "final" && stage.value > 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CogsKpi, { label: "COGS total", value: money(model.total), tone: "warning" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CogsKpi, { label: "Receita conectada", value: money(model.revenue), tone: "primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CogsKpi, { label: "Margem operacional", value: money(model.margin), tone: model.margin >= 0 ? "success" : "danger" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CogsKpi, { label: "Alertas de margem", value: String(model.alerts.length), tone: "danger" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.15fr_0.85fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "Custo por etapa da cadeia" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Matéria-prima, insumos, processo, perdas, frete e comercialização." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: topStages, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 10, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (value) => money(Number(value)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "value", radius: [5, 5, 0, 0], children: topStages.map((stage, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: index % 2 ? "var(--color-chart-2)" : "var(--color-primary)" }, stage.key)) })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-warning-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "Ineficiências ocultas" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          model.alerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: alert.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: alert.description })
          ] }, alert.id)),
          model.alerts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-sm text-muted-foreground", children: "Nenhuma ineficiência crítica detectada." })
        ] })
      ] })
    ] })
  ] });
}
function CogsModuleAddon({
  module,
  records,
  model
}) {
  if (module.id === "etapas") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(StageSourceList, { model });
  }
  if (module.id === "relatorios") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GranularReports, { model });
  }
  if (module.id === "simulacoes") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ScenarioCards, { records, model });
  }
  if (module.id === "atualizacao") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground", children: "A atualização contínua usa Realtime para refletir mudanças de Financeiro, Logística, Campo e Inteligência quase instantaneamente, com refetch automático como fallback." });
  }
  return null;
}
function StageSourceList({
  model
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 md:grid-cols-3", children: model.stages.filter((stage) => stage.key !== "final").map((stage) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: stage.source }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm font-semibold", children: stage.label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold text-primary", children: money(stage.value) })
  ] }, stage.key)) });
}
function GranularReports({
  model
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Margem por SKU/produto conectado" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 md:grid-cols-3", children: [
      model.reports.map((report) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: report.produto }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: report.sku }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-2 text-lg font-semibold", Number(report.margem) >= 0 ? "text-success" : "text-destructive"), children: money(Number(report.margem)) })
      ] }, String(report.sku))),
      model.reports.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-6 text-sm text-muted-foreground", children: "Cadastre custos por produto no Financeiro para gerar relatórios granulares." })
    ] })
  ] });
}
function ScenarioCards({
  records,
  model
}) {
  const scenarios = model.scenarios.length ? model.scenarios : records.map((recordItem) => ({
    nome: recordItem.payload.nome ?? "Cenário",
    impacto: recordItem.payload.impacto ?? "0",
    economia: Number(recordItem.payload.economia ?? 0),
    status: recordItem.payload.status ?? "Em análise"
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 md:grid-cols-3", children: scenarios.map((scenario) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: scenario.nome }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
      "Status: ",
      scenario.status
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-lg font-semibold text-success", children: money(Number(scenario.economia)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
      "Impacto: ",
      scenario.impacto,
      "%"
    ] })
  ] }, String(scenario.nome))) });
}
function CogsKpi({
  label,
  value,
  tone
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning-foreground",
    danger: "text-destructive"
  }[tone];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Calculator, { className: "h-3.5 w-3.5" }),
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-1 text-lg font-semibold", toneClass), children: value })
  ] });
}
export {
  CogsPage as component
};
