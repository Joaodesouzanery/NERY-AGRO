import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { I as InteractiveMap } from "./interactive-map-BSnrv0X5.mjs";
import { c as cn } from "./router-D1uahgUG.mjs";
import { p as useConnectedAgroData, c as buildUnifiedMapModel } from "./connected-agro-data-B5gpgC4B.mjs";
import "../_libs/sonner.mjs";
import { P as Map, C as Calculator, j as ChartColumn, M as Leaf, Y as QrCode, a5 as Sprout, ah as Wallet, ae as Truck, ad as TriangleAlert, o as ChevronUp, l as ChevronDown, ak as X, n as ChevronRight, E as ExternalLink } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, a as AreaChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, R as ReferenceLine, A as Area } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
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
const GREEN = "#2bb24a";
const toneBg = {
  primary: "bg-blue-500/20 text-blue-300",
  success: "bg-green-500/20 text-green-300",
  warning: "bg-amber-500/20 text-amber-300",
  danger: "bg-rose-500/20 text-rose-300",
  info: "bg-cyan-500/20 text-cyan-300",
  neutral: "bg-slate-500/20 text-slate-300"
};
const toneDot = {
  primary: "#4f8cff",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  neutral: "#64748b"
};
function buildActivityData(point) {
  const base = Number(point.metrics?.registros ?? point.meta?.animais ?? 4);
  const now = /* @__PURE__ */ new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (7 - i));
    const jitter = Math.round((Math.random() - 0.5) * base * 0.6);
    return {
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      valor: Math.max(0, base + jitter + (i === 7 ? Math.round(base * 0.4) : 0))
    };
  });
}
function MapEntityPanel({
  point,
  alerts,
  onClose
}) {
  const [tab, setTab] = reactExports.useState("resumo");
  const [dismissed, setDismissed] = reactExports.useState(/* @__PURE__ */ new Set());
  if (!point) return null;
  const tone = point.tone ?? "primary";
  const dotColor = toneDot[tone] ?? toneDot.primary;
  const metaRows = Object.entries(point.meta ?? {}).filter(([, v]) => v !== void 0 && v !== "");
  const metricsRows = Object.entries(point.metrics ?? {}).filter(
    ([, v]) => v !== void 0 && v !== ""
  );
  const pointAlerts = alerts.filter(
    (a) => !dismissed.has(a.id) && (a.source?.toLowerCase().includes(point.sourceModule ?? "__none__") || a.source?.toLowerCase().includes((point.moduleId ?? "__none__").toLowerCase()) || a.source?.toLowerCase().includes((point.label ?? "").toLowerCase()))
  );
  const activityData = buildActivityData(point);
  const baseline = activityData.slice(0, 7).reduce((s, d) => s + d.valor, 0) / Math.max(1, activityData.slice(0, 7).length);
  const latest = activityData[activityData.length - 1]?.valor ?? 0;
  const anomaly = latest > baseline * 1.5;
  const tabs = [
    { id: "resumo", label: "RESUMO" },
    { id: "alertas", label: "ALERTAS", count: pointAlerts.length },
    { id: "detalhes", label: "DETALHES" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-30", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-auto absolute bottom-0 right-0 top-0 z-40 flex w-full flex-col overflow-hidden border-l border-white/10 bg-slate-950/96 shadow-2xl backdrop-blur sm:w-[380px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 border-b border-white/10 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            style: { backgroundColor: `${dotColor}33`, color: dotColor },
            children: (point.label ?? "P").slice(0, 2).toUpperCase()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-heading truncate text-base font-bold text-white", children: point.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-slate-400", children: point.caption ?? point.sourceModule ?? "Entidade operacional" }),
          (point.severity || tone !== "neutral") && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: cn(
                "mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                toneBg[tone] ?? toneBg.neutral
              ),
              children: point.severity ?? tone
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 gap-0 border-b border-white/10", children: tabs.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setTab(t.id),
          className: cn(
            "flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold tracking-widest transition",
            tab === t.id ? "border-b-2 text-white" : "text-slate-500 hover:text-slate-300"
          ),
          style: tab === t.id ? { borderBottomColor: GREEN, color: "white" } : void 0,
          children: [
            t.label,
            t.count !== void 0 && t.count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-300", children: t.count })
          ]
        },
        t.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto", children: [
        tab === "resumo" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-4", children: [
          (point.description || point.summary) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-slate-300", children: point.description ?? point.summary }),
          (metaRows.length > 0 || metricsRows.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500", children: "Detalhes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: [...metaRows, ...metricsRows].map(([key, val]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "rounded-md border border-white/8 bg-white/5 px-3 py-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wide text-slate-500", children: key.replace(/_/g, " ") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 truncate text-xs font-semibold text-white", children: String(val) })
                ]
              },
              key
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-widest text-slate-500", children: "Atividade" }),
              anomaly && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-2.5 w-2.5" }),
                "Acima da baseline"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 rounded-lg border border-white/8 bg-white/3 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              AreaChart,
              {
                data: activityData,
                margin: { top: 4, right: 4, left: -28, bottom: 0 },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "areaGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "stop",
                      {
                        offset: "5%",
                        stopColor: anomaly ? "#f59e0b" : GREEN,
                        stopOpacity: 0.3
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "stop",
                      {
                        offset: "95%",
                        stopColor: anomaly ? "#f59e0b" : GREEN,
                        stopOpacity: 0
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CartesianGrid,
                    {
                      strokeDasharray: "3 3",
                      stroke: "rgba(255,255,255,0.05)",
                      vertical: false
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    XAxis,
                    {
                      dataKey: "label",
                      fontSize: 9,
                      tickLine: false,
                      axisLine: false,
                      tick: { fill: "#64748b" }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    YAxis,
                    {
                      fontSize: 9,
                      tickLine: false,
                      axisLine: false,
                      tick: { fill: "#64748b" }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tooltip,
                    {
                      contentStyle: {
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        fontSize: 11
                      },
                      labelStyle: { color: "#94a3b8" },
                      itemStyle: { color: "#fff" }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ReferenceLine,
                    {
                      y: baseline,
                      stroke: "#64748b",
                      strokeDasharray: "4 4",
                      label: {
                        value: "baseline",
                        fill: "#64748b",
                        fontSize: 9,
                        position: "insideTopRight"
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Area,
                    {
                      type: "monotone",
                      dataKey: "valor",
                      stroke: anomaly ? "#f59e0b" : GREEN,
                      strokeWidth: 2,
                      fill: "url(#areaGrad)",
                      dot: false
                    }
                  )
                ]
              }
            ) }) })
          ] }),
          pointAlerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500", children: "Observações" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: pointAlerts.slice(0, 3).map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "rounded-lg border border-white/10 bg-white/5 px-3 py-2.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-white", children: alert.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          alert.severity === "danger" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                        ),
                        children: alert.severity
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-[10px] text-slate-400", children: alert.source }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
                    point.href && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: point.href,
                        className: "inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold transition hover:bg-white/10",
                        style: { borderColor: GREEN, color: GREEN },
                        children: [
                          "Revisar",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-2.5 w-2.5" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => setDismissed((prev) => /* @__PURE__ */ new Set([...prev, alert.id])),
                        className: "rounded border border-white/15 px-2 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-white/10",
                        children: "Dispensar"
                      }
                    )
                  ] })
                ]
              },
              alert.id
            )) })
          ] }),
          point.href && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: point.href,
              className: "flex w-full items-center justify-between rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8",
              children: [
                "Abrir módulo",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3.5 w-3.5", style: { color: GREEN } })
              ]
            }
          )
        ] }),
        tab === "alertas" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 p-4", children: pointAlerts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-12 text-center text-xs text-slate-500", children: "Nenhum alerta ativo para este ponto." }) : pointAlerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-lg border border-white/10 bg-white/5 px-3 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: alert.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      alert.severity === "danger" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                    ),
                    children: alert.severity
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: alert.source }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
                point.href && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "a",
                  {
                    href: point.href,
                    className: "inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/10",
                    style: { borderColor: GREEN, color: GREEN },
                    children: [
                      "Revisar",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setDismissed((prev) => /* @__PURE__ */ new Set([...prev, alert.id])),
                    className: "rounded border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/10",
                    children: "Dispensar"
                  }
                )
              ] })
            ]
          },
          alert.id
        )) }),
        tab === "detalhes" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 p-4", children: [
          ["ID", point.id],
          ["Módulo", point.sourceModule ?? point.moduleId],
          ["Tom", point.tone],
          ["Categoria", point.category],
          ["Severidade", point.severity],
          ["Record ID", point.recordId],
          ["Record Módulo", point.recordModule],
          ["Lat", point.lat],
          ["Lng", point.lng],
          ["href", point.href]
        ].filter(([, v]) => v !== void 0 && v !== "").map(([key, val]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "uppercase tracking-wide text-slate-500", children: key }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right font-mono text-slate-200 break-all", children: String(val) })
        ] }, String(key))) })
      ] })
    ] })
  ] });
}
const moduleIcon = {
  logistica: Truck,
  financeiro: Wallet,
  campo: Sprout,
  pecuaria: QrCode,
  sustentabilidade: Leaf,
  inteligencia: ChartColumn,
  cogs: Calculator
};
function UnifiedMapPage() {
  const { snapshot, loading, demoMode, lastUpdatedAt } = useConnectedAgroData();
  const model = buildUnifiedMapModel(snapshot, lastUpdatedAt);
  const lastSync = model.lastUpdatedAt ? new Date(model.lastUpdatedAt).toLocaleTimeString("pt-BR") : "--:--";
  const [alertsCollapsed, setAlertsCollapsed] = reactExports.useState(true);
  const [selectedPoint, setSelectedPoint] = reactExports.useState(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-[calc(100svh-56px)] min-h-[540px] overflow-hidden bg-slate-950 text-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractiveMap,
      {
        points: model.points,
        routes: model.routes,
        variant: "dark",
        className: "h-full min-h-full rounded-none border-0",
        fitToData: true,
        attribution: true,
        onPointClick: (point) => {
          setSelectedPoint(point);
          setAlertsCollapsed(true);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-slate-900/88 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 md:grid-cols-6", children: model.kpis.map((kpi) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "min-w-0 border-r border-white/10 px-3 py-2.5 last:border-r-0 md:px-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-400", children: kpi.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: cn(
                "mt-1 truncate text-base font-semibold md:text-lg",
                kpi.tone === "success" && "text-emerald-300",
                kpi.tone === "warning" && "text-amber-300",
                kpi.tone === "danger" && "text-rose-300",
                kpi.tone === "primary" && "text-green-300",
                kpi.tone === "info" && "text-cyan-300"
              ),
              children: kpi.value
            }
          )
        ]
      },
      kpi.label
    )) }) }),
    !selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute left-4 top-28 z-20 hidden max-w-sm rounded-lg border border-white/15 bg-slate-950/82 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur md:block", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Map, { className: "h-4 w-4 text-green-300" }),
        "Mapa operacional unico"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 leading-5 text-slate-300", children: loading ? "Sincronizando dados..." : "Clique nos icones, clusters e rotas para ver detalhes e abrir o modulo relacionado." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded border border-white/15 bg-white/10 px-2 py-1", children: demoMode ? "DEMO" : "REAL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded border border-white/15 bg-white/10 px-2 py-1", children: [
          "Atualizado ",
          lastSync
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute bottom-4 left-4 z-20 max-w-[calc(100vw-2rem)] rounded-lg border border-white/15 bg-slate-950/86 p-2 shadow-2xl backdrop-blur lg:max-w-[calc(100vw-24rem)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex max-w-full flex-wrap gap-1.5", children: model.moduleCounts.map((module) => {
      const Icon = moduleIcon[module.id] ?? TriangleAlert;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: module.href,
          className: "pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2 text-[11px] font-medium text-slate-200 transition hover:bg-white/15",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5 text-green-300" }),
            module.label,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300", children: module.value })
          ]
        },
        module.id
      );
    }) }) }),
    !selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: cn(
          "absolute bottom-4 right-4 z-20 hidden w-80 rounded-lg border border-white/15 bg-slate-950/86 shadow-2xl backdrop-blur lg:block",
          alertsCollapsed ? "p-0" : "p-3"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setAlertsCollapsed((value) => !value),
              className: cn(
                "flex w-full items-center gap-2 text-left text-sm font-semibold",
                alertsCollapsed ? "px-3 py-2" : "mb-2"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-300" }),
                "Alertas recentes",
                model.alerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200", children: model.alerts.length }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-slate-400", children: alertsCollapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" }) })
              ]
            }
          ),
          !alertsCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-44 space-y-2 overflow-y-auto", children: [
            model.alerts.slice(0, 5).map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "rounded-md border border-white/10 bg-white/5 px-2.5 py-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs font-semibold", children: alert.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-400", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: alert.source }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "rounded px-1.5 py-0.5",
                          alert.severity === "danger" ? "bg-rose-500/20 text-rose-200" : "bg-amber-500/20 text-amber-200"
                        ),
                        children: alert.severity
                      }
                    )
                  ] })
                ]
              },
              alert.id
            )),
            model.alerts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-6 text-center text-xs text-slate-400", children: "Nenhum alerta ativo." })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MapEntityPanel,
      {
        point: selectedPoint,
        alerts: model.alerts,
        onClose: () => setSelectedPoint(null)
      }
    )
  ] });
}
const SplitComponent = UnifiedMapPage;
export {
  SplitComponent as component
};
