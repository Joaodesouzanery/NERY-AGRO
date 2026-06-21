import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { j as jsPDF } from "../_libs/jspdf.mjs";
import { a as autoTable } from "../_libs/jspdf-autotable.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { I as InteractiveMap } from "./interactive-map-BSnrv0X5.mjs";
import { d as defaultPeriod, P as PeriodPicker } from "./period-picker-BtQVPyDA.mjs";
import { d as downloadPdf } from "./pdf-utils-DLwND1wI.mjs";
import { p as useConnectedAgroData, a as buildControlTowerModel } from "./connected-agro-data-B5gpgC4B.mjs";
import { c as cn } from "./router-D1uahgUG.mjs";
import { J as Layers, t as Download, w as FileText, q as CircleCheck, V as Package, G as Gauge, ad as TriangleAlert, ae as Truck, y as GitBranch, x as Funnel, d as Bell, $ as Route, h as Calendar } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar, a as AreaChart, A as Area } from "../_libs/recharts.mjs";
import "fs";
import "path";
import "../_libs/fflate.mjs";
import "module";
import "../_libs/fast-png.mjs";
import "../_libs/iobuffer.mjs";
import "../_libs/pako.mjs";
import "../_libs/html2canvas.mjs";
import "../_libs/dompurify.mjs";
import "../_libs/canvg.mjs";
import "../_libs/core-js.mjs";
import "../_libs/babel__runtime.mjs";
import "../_libs/raf.mjs";
import "../_libs/performance-now.mjs";
import "../_libs/rgbcolor.mjs";
import "../_libs/svg-pathdata.mjs";
import "../_libs/stackblur-canvas.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
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
function AgroMap({
  points = [],
  routes = [],
  stats = [],
  className,
  title = "Mapa operacional",
  subtitle = "Clique nos marcadores, clusters e rotas para ver detalhes."
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    InteractiveMap,
    {
      variant: "dark",
      points,
      routes,
      stats,
      className,
      title,
      subtitle,
      showLegend: true,
      fallbackBounds: { west: -74, south: -34, east: -34, north: 6 }
    }
  );
}
const layerOptions = [
  { id: "clientes", label: "Clientes" },
  { id: "bases", label: "CDs/Bases" },
  { id: "plantas", label: "Plantas/Talhões" },
  { id: "rotas", label: "Rotas" },
  { id: "fornecedores", label: "Fornecedores" }
];
const fallbackSeries = [
  { label: "Jan", otif: 91, vendas: 68e3, capacidade: 76 },
  { label: "Fev", otif: 94, vendas: 73e3, capacidade: 80 },
  { label: "Mar", otif: 92, vendas: 70500, capacidade: 78 },
  { label: "Abr", otif: 96, vendas: 89e3, capacidade: 84 },
  { label: "Mai", otif: 98, vendas: 148e3, capacidade: 88 }
];
function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function exportCsv(model) {
  const header = ["Código", "Cliente", "Destino", "Motorista", "Status", "Valor"];
  const rows = model.shipments.map((item) => [
    item.codigo,
    item.cliente,
    item.destino,
    item.motorista,
    item.status,
    item.valor
  ]);
  const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "torre-de-controle-nery.csv";
  link.click();
  URL.revokeObjectURL(url);
}
async function exportPdf(model, demoMode, period) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
  const mapSnapshot = await captureMapSnapshot();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 118, "F");
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, 12, pageHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Torre de Controle Nery Agro", 40, 44);
  doc.setFontSize(10);
  doc.text(
    `${demoMode ? "Dados demonstrativos" : "Dados reais"} · ${period.label} · Gerado em ${generatedAt}`,
    40,
    66
  );
  doc.setDrawColor(76, 111, 87);
  doc.line(40, 88, pageWidth - 40, 88);
  doc.setFontSize(9);
  doc.text("Relatório consolidado para impressão: operação, mapa, alertas e indicadores.", 40, 104);
  let y = 142;
  y = drawMetricGrid(
    doc,
    [
      { label: "OTIF", value: `${model.metrics.otif}%` },
      { label: "Vendas", value: money(model.metrics.vendas) },
      { label: "Capacidade", value: `${model.metrics.capacidade}%` },
      { label: "Alertas", value: String(model.metrics.alertas) },
      { label: "Cargas", value: String(model.metrics.cargas) },
      { label: "Nós da rede", value: String(model.metrics.nosRede) }
    ],
    y
  );
  y = drawMetricGrid(
    doc,
    [
      { label: "Em trânsito", value: String(model.mapMetrics.emTransito) },
      { label: "Entregues", value: String(model.mapMetrics.entregues) },
      { label: "Atrasadas", value: String(model.mapMetrics.atrasadas) },
      { label: "Total de Cargas", value: String(model.mapMetrics.totalCargas) },
      { label: "Rotas", value: String(model.mapMetrics.totalRotas) },
      { label: "Bases/CDs", value: String(model.mapMetrics.bases) }
    ],
    y + 8,
    "Totais agregados do mapa"
  );
  if (mapSnapshot && y < 540) {
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(12);
    doc.text("Captura do mapa operacional", 40, y + 8);
    doc.addImage(mapSnapshot, "PNG", 40, y + 18, pageWidth - 80, 150, void 0, "FAST");
    y += 188;
  }
  autoTable(doc, {
    startY: y + 8,
    head: [["Módulo", "Indicador", "Detalhe"]],
    body: model.moduleCards.map((item) => [item.label, item.value, item.detail]),
    styles: { fontSize: 8, cellPadding: 6 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    margin: { left: 40, right: 40 }
  });
  autoTable(doc, {
    startY: lastTableY(doc) + 28,
    head: [["Origem", "Alerta", "Descrição", "Severidade"]],
    body: model.alerts.map((item) => [item.source, item.title, item.description, item.severity]),
    styles: { fontSize: 7.5, cellPadding: 5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 }
  });
  autoTable(doc, {
    startY: lastTableY(doc) + 28,
    head: [["Código", "Cliente", "Destino", "Motorista", "Status", "Valor"]],
    body: model.shipments.map((item) => [
      item.codigo,
      item.cliente,
      item.destino,
      item.motorista,
      item.status,
      money(Number(item.valor ?? 0))
    ]),
    styles: { fontSize: 7.5, cellPadding: 5 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    margin: { left: 40, right: 40 }
  });
  addFooters(doc);
  downloadPdf(doc, "torre-de-controle-nery-agro.pdf");
}
function lastTableY(doc) {
  return doc.lastAutoTable?.finalY ?? 120;
}
function drawMetricGrid(doc, metrics, y, title) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidth = (pageWidth - 80) / 3;
  let nextY = y;
  if (title) {
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(12);
    doc.text(title, 40, nextY);
    nextY += 14;
  }
  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 40 + col * colWidth;
    const boxY = nextY + row * 58;
    doc.setDrawColor(220, 226, 220);
    doc.setFillColor(250, 252, 250);
    doc.roundedRect(x, boxY, colWidth - 10, 46, 6, 6, "FD");
    doc.setTextColor(95, 108, 101);
    doc.setFontSize(8);
    doc.text(metric.label, x + 12, boxY + 16);
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(14);
    doc.text(String(metric.value).slice(0, 24), x + 12, boxY + 34);
  });
  return nextY + Math.ceil(metrics.length / 3) * 58;
}
function addFooters(doc) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Nery Agro · Torre de Controle · Página ${page}/${pageCount}`, 40, pageHeight - 24);
    doc.text("Relatório pronto para impressão", pageWidth - 150, pageHeight - 24);
  }
}
async function captureMapSnapshot() {
  try {
    const canvas = document.querySelector(".maplibregl-canvas");
    return canvas?.toDataURL("image/png");
  } catch {
    return void 0;
  }
}
function pointLayer(point) {
  if (point.id.startsWith("dest-")) return "clientes";
  if (point.id.startsWith("base-")) return "bases";
  if (point.id.startsWith("field-")) return "plantas";
  if (point.id.startsWith("origin-")) return "rotas";
  return "fornecedores";
}
function ControlTowerPage() {
  const { snapshot, loading, demoMode, lastUpdatedAt } = useConnectedAgroData();
  const [period, setPeriod] = reactExports.useState(defaultPeriod());
  const [selectedLayers, setSelectedLayers] = reactExports.useState([
    "clientes",
    "bases",
    "plantas",
    "rotas",
    "fornecedores"
  ]);
  const model = reactExports.useMemo(() => buildControlTowerModel(snapshot), [snapshot]);
  const filteredPoints = reactExports.useMemo(
    () => model.points.filter((point) => selectedLayers.includes(pointLayer(point))),
    [model.points, selectedLayers]
  );
  const filteredRoutes = selectedLayers.includes("rotas") ? model.routes : [];
  const dangerAlerts = model.alerts.filter((item) => item.severity === "danger").length;
  const lastSync = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString("pt-BR") : "--:--";
  const moduleVolume = reactExports.useMemo(
    () => [
      {
        label: "Logistica",
        valor: snapshot.operations.filter((item) => item.area === "logistica").length
      },
      { label: "Financeiro", valor: snapshot.financial.length },
      { label: "Campo", valor: snapshot.field.length },
      {
        label: "Pecuaria",
        valor: snapshot.operations.filter((item) => item.area === "pecuaria").length
      },
      {
        label: "COGS",
        valor: snapshot.operations.filter((item) => item.area === "cogs").length
      }
    ],
    [snapshot]
  );
  const alertVolume = reactExports.useMemo(() => {
    const grouped = /* @__PURE__ */ new Map();
    model.alerts.forEach((alert) => {
      const source = alert.source.split("/")[0] || "outros";
      grouped.set(source, (grouped.get(source) ?? 0) + 1);
    });
    return Array.from(grouped.entries()).map(([label, valor]) => ({ label, valor }));
  }, [model.alerts]);
  const toggleLayer = (layer) => {
    setSelectedLayers(
      (current) => current.includes(layer) ? current.filter((item) => item !== layer) : [...current, layer]
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-[1600px] space-y-5 px-8 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-3.5 w-3.5" }),
          "Visibilidade unificada"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl font-semibold tracking-tight", children: "Torre de Controle" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Rede logística, campo, finanças, pecuária, sustentabilidade, inteligência e COGS em uma visão operacional conectada." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 animate-pulse rounded-full bg-success" }),
          "Tempo real · ",
          lastSync
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PeriodPicker, { value: period, onChange: setPeriod }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => exportCsv(model),
            className: "flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
              "Exportar CSV"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => void exportPdf(model, demoMode, period),
            className: "flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" }),
              "Exportar PDF"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TowerKpi,
        {
          icon: CircleCheck,
          label: "OTIF",
          value: `${model.metrics.otif}%`,
          tone: "success"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TowerKpi,
        {
          icon: Package,
          label: "Vendas",
          value: money(model.metrics.vendas),
          tone: "primary"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TowerKpi,
        {
          icon: Gauge,
          label: "Capacidade",
          value: `${model.metrics.capacidade}%`,
          tone: "primary"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TowerKpi,
        {
          icon: TriangleAlert,
          label: "Alertas",
          value: String(model.metrics.alertas),
          tone: dangerAlerts ? "danger" : "warning"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TowerKpi, { icon: Truck, label: "Cargas", value: String(model.metrics.cargas), tone: "neutral" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TowerKpi,
        {
          icon: GitBranch,
          label: "Nós da rede",
          value: String(model.metrics.nosRede),
          tone: "neutral"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Mapa global por camadas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Clientes, CDs, plantas, fornecedores e rotas com atualização quase instantânea." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: layerOptions.map((layer) => {
          const active = selectedLayers.includes(layer.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => toggleLayer(layer.id),
              className: cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-3 w-3" }),
                layer.label
              ]
            },
            layer.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AgroMap,
        {
          points: filteredPoints,
          routes: filteredRoutes,
          stats: [
            { label: "Em trânsito", value: model.mapMetrics.emTransito, tone: "primary" },
            { label: "Entregues", value: model.mapMetrics.entregues, tone: "success" },
            { label: "Atrasadas", value: model.mapMetrics.atrasadas, tone: "danger" },
            { label: "Total de Cargas", value: model.mapMetrics.totalCargas, tone: "neutral" }
          ],
          className: "h-[560px]",
          title: "Rede agro conectada",
          subtitle: loading ? "Sincronizando dados..." : "Clique nos itens para ver status, rota, origem, destino e alertas."
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.15fr_0.85fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Visão de rede integrada" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Todos os módulos conectados em um único painel." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => toast.info("Planejamento integrado atualizado com o snapshot atual."),
              className: "h-8 rounded-md border border-border px-3 text-xs hover:bg-muted",
              children: "Atualizar planejamento"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: model.moduleCards.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-lg border border-border bg-background/60 p-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: item.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-1 text-xl font-semibold", item.tone), children: item.value }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: item.detail })
            ]
          },
          item.label
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Alertas proativos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Anomalias, atrasos e riscos antes que virem custo." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[300px] space-y-2 overflow-y-auto", children: [
          model.alerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: cn(
                "rounded-lg border p-3",
                alert.severity === "danger" ? "border-destructive/30 bg-destructive/10" : alert.severity === "warning" ? "border-warning/30 bg-warning/10" : "border-border bg-background/60"
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-medium", children: alert.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: alert.description })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground", children: alert.source })
              ] })
            },
            alert.id
          )),
          model.alerts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-sm text-muted-foreground", children: "Nenhum alerta crítico no snapshot atual." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Volume conectado por módulo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Registros consolidados do snapshot em tempo real." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: moduleVolume, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CartesianGrid,
            {
              strokeDasharray: "3 3",
              stroke: "var(--color-border)",
              vertical: false
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "valor", fill: "var(--color-primary)", radius: [6, 6, 0, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Alertas por origem" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Priorização cruzada entre financeiro, operação e campo." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          BarChart,
          {
            data: alertVolume.length ? alertVolume : [{ label: "Sem alertas", valor: 0 }],
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CartesianGrid,
                {
                  strokeDasharray: "3 3",
                  stroke: "var(--color-border)",
                  vertical: false
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 11, tickLine: false, axisLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { allowDecimals: false, fontSize: 11, tickLine: false, axisLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "valor", fill: "var(--color-chart-4)", radius: [6, 6, 0, 0] })
            ]
          }
        ) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "KPIs operacionais" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "OTIF, vendas mensais e capacidade em leitura executiva." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: fallbackSeries, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CartesianGrid,
            {
              strokeDasharray: "3 3",
              stroke: "var(--color-border)",
              vertical: false
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Area,
            {
              dataKey: "otif",
              stroke: "var(--color-primary)",
              fill: "var(--color-primary)",
              fillOpacity: 0.15,
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Area,
            {
              dataKey: "capacidade",
              stroke: "var(--color-chart-2)",
              fill: "var(--color-chart-2)",
              fillOpacity: 0.1,
              strokeWidth: 2
            }
          )
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Planejamento e ordens de material" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Priorização operacional para produção, expedição e abastecimento." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [
          ["Alta", "Revisar rota atrasada e reprogramar janela de entrega."],
          ["Média", "Conferir estoque mínimo de embalagem e insumos críticos."],
          ["Média", "Validar capacidade de frota para próxima remessa CSA."],
          ["Baixa", "Atualizar registros de certificação e caderno de campo."]
        ].map(([priority, text]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary", children: priority[0] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: text }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-xs text-muted-foreground", children: [
                  "Prioridade ",
                  priority
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { className: "h-4 w-4 text-muted-foreground" })
            ]
          },
          text
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Cargas, ordens e clientes em acompanhamento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Fila operacional conectada à Logística, Financeiro e COGS." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => toast.info("Agrupamento mensal aplicado."),
            className: "flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" }),
              "Mensal"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 font-medium", children: "Código" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 font-medium", children: "Cliente" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 font-medium", children: "Destino" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 font-medium", children: "Motorista" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 font-medium", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right font-medium", children: "Valor" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          model.shipments.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium", children: item.codigo }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: item.cliente }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: item.destino }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-muted-foreground", children: item.motorista }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: item.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right", children: money(Number(item.valor ?? 0)) })
          ] }, item.codigo)),
          model.shipments.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "py-10 text-center text-sm text-muted-foreground", children: "Nenhuma carga real cadastrada para a Torre de Controle." }) })
        ] })
      ] }) })
    ] })
  ] });
}
function TowerKpi({
  icon: Icon,
  label,
  value,
  tone
}) {
  const toneClass = {
    success: "text-success",
    primary: "text-primary",
    warning: "text-warning-foreground",
    danger: "text-destructive",
    neutral: "text-foreground"
  }[tone];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }),
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-1.5 text-2xl font-semibold", toneClass), children: value })
  ] });
}
const SplitComponent = ControlTowerPage;
export {
  SplitComponent as component
};
