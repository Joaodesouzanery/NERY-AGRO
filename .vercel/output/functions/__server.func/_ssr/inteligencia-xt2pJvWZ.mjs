import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { O as OperationAreaPage } from "./operation-area-crud-DLgh87g5.mjs";
import "../_libs/sonner.mjs";
import { ac as TrendingUp, k as ChartLine, ad as TriangleAlert, j as ChartColumn } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, d as LineChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, L as Line, b as BarChart, B as Bar } from "../_libs/recharts.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./connected-agro-data-B5gpgC4B.mjs";
import "./client-BHmQHd0X.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./router-D1uahgUG.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./import-records-button-BiVLSQbM.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
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
import "./export-xlsx-CRIENmK4.mjs";
import "../_libs/xlsx.mjs";
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
const AREA = "inteligencia";
const modules = [{
  id: "lucratividade",
  label: "Lucratividade por Cultura Comparada",
  shortLabel: "Lucratividade",
  description: "Receita, custo, margem e safra por cultura.",
  icon: TrendingUp,
  fields: [{
    key: "cultura",
    label: "Cultura"
  }, {
    key: "safra",
    label: "Safra"
  }, {
    key: "receita",
    label: "Receita",
    type: "number"
  }, {
    key: "custo",
    label: "Custo",
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
  id: "desempenho",
  label: "Desempenho Mês a Mês / Ano a Ano",
  shortLabel: "Desempenho",
  description: "Indicadores por período, comparativo e tendência em gráficos.",
  icon: ChartLine,
  fields: [{
    key: "periodo",
    label: "Período"
  }, {
    key: "indicador",
    label: "Indicador"
  }, {
    key: "valor",
    label: "Valor",
    type: "number"
  }, {
    key: "comparativo",
    label: "Comparativo",
    type: "number"
  }, {
    key: "ano",
    label: "Ano"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "precos",
  label: "Alertas de Preços CEASA/CNA",
  shortLabel: "Preços",
  description: "Alertas configuráveis por produto, praça/fonte e limite de preço.",
  icon: TriangleAlert,
  fields: [{
    key: "produto",
    label: "Produto"
  }, {
    key: "fonte",
    label: "Praça/Fonte"
  }, {
    key: "preco",
    label: "Preço",
    type: "number"
  }, {
    key: "limite_alerta",
    label: "Limite de alerta",
    type: "number"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "perdas",
  label: "Relatório de Perdas com Causas",
  shortLabel: "Perdas",
  description: "Produto/cultura, volume perdido, causa, valor estimado e ação.",
  icon: ChartColumn,
  fields: [{
    key: "produto",
    label: "Produto/Cultura"
  }, {
    key: "volume_perdido",
    label: "Volume perdido",
    type: "number"
  }, {
    key: "causa",
    label: "Causa"
  }, {
    key: "valor_estimado",
    label: "Valor estimado",
    type: "number"
  }, {
    key: "acao",
    label: "Ação"
  }, {
    key: "status",
    label: "Status"
  }]
}];
const demoByModule = {
  lucratividade: [record("lucratividade", "1", {
    cultura: "Tomate",
    safra: "2025/26",
    receita: "148000",
    custo: "92000",
    margem: "56000",
    status: "Acima da meta"
  }), record("lucratividade", "2", {
    cultura: "Alface",
    safra: "2025/26",
    receita: "82000",
    custo: "51000",
    margem: "31000",
    status: "Estável"
  }), record("lucratividade", "3", {
    cultura: "Milho verde",
    safra: "2025/26",
    receita: "116000",
    custo: "87000",
    margem: "29000",
    status: "Atenção"
  })],
  desempenho: [record("desempenho", "1", {
    periodo: "Jan",
    indicador: "Receita",
    valor: "68000",
    comparativo: "61000",
    ano: "2026",
    status: "OK"
  }), record("desempenho", "2", {
    periodo: "Fev",
    indicador: "Receita",
    valor: "73000",
    comparativo: "65500",
    ano: "2026",
    status: "OK"
  }), record("desempenho", "3", {
    periodo: "Mar",
    indicador: "Receita",
    valor: "70500",
    comparativo: "69000",
    ano: "2026",
    status: "Estável"
  })],
  precos: [record("precos", "1", {
    produto: "Tomate",
    fonte: "CEASA Curitiba",
    preco: "88",
    limite_alerta: "80",
    data: "2026-05-31",
    status: "Alerta"
  }), record("precos", "2", {
    produto: "Alface",
    fonte: "CNA",
    preco: "42",
    limite_alerta: "38",
    data: "2026-05-31",
    status: "Monitorar"
  })],
  perdas: [record("perdas", "1", {
    produto: "Tomate",
    volume_perdido: "340",
    causa: "Transporte",
    valor_estimado: "4200",
    acao: "Revisar embalagem e rota.",
    status: "Em ação"
  }), record("perdas", "2", {
    produto: "Folhosas",
    volume_perdido: "120",
    causa: "Calor",
    valor_estimado: "1350",
    acao: "Antecipar colheita.",
    status: "Revisar"
  })]
};
function record(module, id, payload) {
  return {
    id: `demo-${AREA}-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}
function num(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
function InteligenciaPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(OperationAreaPage, { area: AREA, title: "Inteligência", description: "Relatórios, gráficos e alertas configuráveis para apoiar decisões da fazenda.", modules, demoByModule, renderModuleAddon: renderCharts });
}
function renderCharts(module, records) {
  if (!["lucratividade", "desempenho", "perdas"].includes(module.id) || records.length === 0) {
    return null;
  }
  if (module.id === "desempenho") {
    const data2 = records.map((recordItem) => ({
      name: recordItem.payload.periodo,
      valor: num(recordItem.payload.valor),
      comparativo: num(recordItem.payload.comparativo)
    }));
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ChartShell, { title: "Desempenho comparado", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: data2, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", stroke: "var(--color-muted-foreground)", fontSize: 11 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--color-muted-foreground)", fontSize: 11 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "valor", stroke: "var(--color-primary)", strokeWidth: 2 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "comparativo", stroke: "var(--color-chart-2)", strokeWidth: 2 })
    ] }) }) });
  }
  const data = records.map((recordItem) => ({
    name: recordItem.payload.cultura ?? recordItem.payload.produto,
    receita: num(recordItem.payload.receita),
    custo: num(recordItem.payload.custo),
    margem: num(recordItem.payload.margem),
    perdas: num(recordItem.payload.valor_estimado)
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ChartShell, { title: module.id === "perdas" ? "Perdas estimadas" : "Lucratividade comparada", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", stroke: "var(--color-muted-foreground)", fontSize: 11 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--color-muted-foreground)", fontSize: 11 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
    module.id === "perdas" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "perdas", fill: "var(--color-destructive)", radius: [4, 4, 0, 0] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "receita", fill: "var(--color-primary)", radius: [4, 4, 0, 0] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "custo", fill: "var(--color-chart-2)", radius: [4, 4, 0, 0] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "margem", fill: "var(--color-success)", radius: [4, 4, 0, 0] })
    ] })
  ] }) }) });
}
function ChartShell({
  title,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-64", children })
  ] });
}
export {
  InteligenciaPage as component
};
