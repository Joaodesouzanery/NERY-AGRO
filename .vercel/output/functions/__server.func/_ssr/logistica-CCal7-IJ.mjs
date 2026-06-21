import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as useQueryClient, b as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { p as useConnectedAgroData, f as createOperationRecord, i as deleteOperationRecord, o as updateOperationRecord, j as invalidateConnectedQueries, m as listOperationRecordsByAreaModule } from "./connected-agro-data-B5gpgC4B.mjs";
import { u as useDemoMode, c as cn } from "./router-D1uahgUG.mjs";
import { I as ImportRecordsButton, D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./import-records-button-BiVLSQbM.mjs";
import { d as defaultPeriod, P as PeriodPicker } from "./period-picker-BtQVPyDA.mjs";
import { ae as Truck, ag as Users, Q as MapPin, aj as Wrench, g as Building2, f as Boxes, V as Package, r as ClipboardList, ah as Wallet, t as Download, K as LayoutDashboard, q as CircleCheck, G as Gauge, ad as TriangleAlert, X as Plus, W as PenLine, aa as Trash2, ab as TrendingDown, ac as TrendingUp, I as Inbox, a2 as Search, b as ArrowUp, A as ArrowDown, p as ChevronsUpDown, m as ChevronLeft, n as ChevronRight } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
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
function StatKpi({
  label,
  value,
  trend,
  trendDir = "up",
  hint,
  icon: Icon,
  className
}) {
  const TrendIcon = trendDir === "down" ? TrendingDown : TrendingUp;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.035)]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
          Icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-end justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-semibold tracking-tight text-foreground", children: value }),
          trend && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                trendDir === "up" && "bg-success/12 text-success",
                trendDir === "down" && "bg-destructive/12 text-destructive",
                trendDir === "neutral" && "bg-muted text-muted-foreground"
              ),
              children: [
                trendDir !== "neutral" && /* @__PURE__ */ jsxRuntimeExports.jsx(TrendIcon, { className: "h-3.5 w-3.5" }),
                trend
              ]
            }
          )
        ] }),
        hint && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: hint })
      ]
    }
  );
}
function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-3 text-sm font-semibold text-foreground", children: title }),
        description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-sm text-sm text-muted-foreground", children: description }),
        action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: action })
      ]
    }
  );
}
const Table = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("table", { ref, className: cn("w-full caption-bottom text-sm", className), ...props }) })
);
Table.displayName = "Table";
const TableHeader = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { ref, className: cn("[&_tr:last-child]:border-0", className), ...props }));
TableBody.displayName = "TableBody";
const TableFooter = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "tfoot",
  {
    ref,
    className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "tr",
    {
      ref,
      className: cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  )
);
TableRow.displayName = "TableRow";
const TableHead = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "td",
  {
    ref,
    className: cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("caption", { ref, className: cn("mt-4 text-sm text-muted-foreground", className), ...props }));
TableCaption.displayName = "TableCaption";
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("animate-pulse rounded-md bg-primary/10", className), ...props });
}
const alignClass = { left: "text-left", right: "text-right", center: "text-center" };
function DataTable({
  columns,
  data,
  getRowId,
  searchable = true,
  searchPlaceholder = "Buscar...",
  pageSize = 10,
  loading = false,
  emptyMessage = "Nenhum registro encontrado.",
  onRowClick,
  actions,
  className
}) {
  const [query, setQuery] = reactExports.useState("");
  const [sort, setSort] = reactExports.useState(null);
  const [page, setPage] = reactExports.useState(0);
  const filtered = reactExports.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (row) => columns.some((col) => String(col.accessor(row)).toLowerCase().includes(q))
    );
  }, [data, columns, query]);
  const sorted = reactExports.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = col.accessor(a);
      const vb = col.accessor(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * factor;
    });
  }, [filtered, sort, columns]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = reactExports.useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize]
  );
  const toggleSort = (key) => {
    setPage(0);
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };
  const colSpan = columns.length + (actions ? 1 : 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("space-y-3", className), children: [
    searchable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: query,
          onChange: (event) => {
            setQuery(event.target.value);
            setPage(0);
          },
          placeholder: searchPlaceholder,
          className: "h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-muted/40", children: [
        columns.map((col) => {
          const active = sort?.key === col.key;
          const sortable = col.sortable ?? true;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            TableHead,
            {
              className: cn(alignClass[col.align ?? "left"], col.className),
              children: sortable ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => toggleSort(col.key),
                  className: cn(
                    "inline-flex items-center gap-1 hover:text-foreground",
                    active ? "text-foreground" : "text-muted-foreground"
                  ),
                  children: [
                    col.header,
                    active ? sort?.dir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsUpDown, { className: "h-3.5 w-3.5 opacity-50" })
                  ]
                }
              ) : col.header
            },
            col.key
          );
        }),
        actions && /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: loading ? Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: Array.from({ length: colSpan }).map((__, cellIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }) }, cellIndex)) }, `skeleton-${rowIndex}`)) : pageRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan, className: "py-10 text-center text-muted-foreground", children: emptyMessage }) }) : pageRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        TableRow,
        {
          onClick: onRowClick ? () => onRowClick(row) : void 0,
          className: onRowClick ? "cursor-pointer" : void 0,
          children: [
            columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              TableCell,
              {
                className: cn(alignClass[col.align ?? "left"], col.className),
                children: col.render ? col.render(row) : col.accessor(row)
              },
              col.key
            )),
            actions && /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", onClick: (event) => event.stopPropagation(), children: actions(row) })
          ]
        },
        getRowId(row)
      )) })
    ] }) }),
    pageCount > 1 && !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        sorted.length,
        " registro",
        sorted.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setPage((p) => Math.max(0, p - 1)),
            disabled: safePage === 0,
            className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40",
            "aria-label": "Página anterior",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums", children: [
          safePage + 1,
          " / ",
          pageCount
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
            disabled: safePage >= pageCount - 1,
            className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40",
            "aria-label": "Próxima página",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
          }
        )
      ] })
    ] })
  ] });
}
function num(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
function norm(value) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
}
function byModule(records, module) {
  return records.filter((r) => r.module === module);
}
function buildLogisticaMetrics(records) {
  const cargas = byModule(records, "cargas");
  const fretes = byModule(records, "fretes");
  const frota = byModule(records, "frota");
  const statusCount = (term) => cargas.filter((c) => norm(c.payload.status).includes(term)).length;
  const entregues = statusCount("entregue");
  const atrasadas = statusCount("atras");
  const emTransito = statusCount("transito");
  const aguardando = statusCount("aguard");
  const valorTotal = cargas.reduce((sum, c) => sum + num(c.payload.valor), 0);
  const custoFreteTotal = fretes.reduce(
    (sum, f) => sum + num(f.payload.custo) + num(f.payload.combustivel) + num(f.payload.pedagio),
    0
  );
  const frotaTotal = frota.length;
  const frotaDisponivel = frota.filter((f) => norm(f.payload.status).includes("dispon")).length;
  const otifBase = entregues + atrasadas;
  return {
    totalCargas: cargas.length,
    emTransito,
    entregues,
    atrasadas,
    aguardando,
    otif: otifBase ? Math.round(entregues / otifBase * 100) : 0,
    valorTotal,
    custoFreteTotal,
    frotaTotal,
    frotaDisponivel,
    capacidadePct: frotaTotal ? Math.round(frotaDisponivel / frotaTotal * 100) : 0
  };
}
function freightByRoute(records) {
  const fretes = byModule(records, "fretes");
  const map = /* @__PURE__ */ new Map();
  for (const f of fretes) {
    const rota = f.payload.rota?.trim() || "Sem rota";
    const custo = num(f.payload.custo) + num(f.payload.combustivel) + num(f.payload.pedagio);
    map.set(rota, (map.get(rota) ?? 0) + custo);
  }
  return [...map.entries()].map(([rota, custo]) => ({ rota, custo })).sort((a, b) => b.custo - a.custo);
}
function cargaStatusBreakdown(records) {
  const cargas = byModule(records, "cargas");
  const map = /* @__PURE__ */ new Map();
  for (const c of cargas) {
    const status = c.payload.status?.trim() || "Sem status";
    map.set(status, (map.get(status) ?? 0) + 1);
  }
  return [...map.entries()].map(([status, valor]) => ({ status, valor }));
}
function slaBreaches(records, today) {
  const cargas = byModule(records, "cargas");
  const breaches = [];
  for (const c of cargas) {
    const status = norm(c.payload.status);
    if (status.includes("entregue")) continue;
    const eta = c.payload.eta?.trim() ?? "";
    const isLateStatus = status.includes("atras");
    const isEtaPast = /^\d{4}-\d{2}-\d{2}$/.test(eta) && eta < today;
    if (isLateStatus || isEtaPast) {
      breaches.push({
        id: c.id,
        codigo: c.payload.codigo?.trim() || c.id,
        cliente: c.payload.cliente?.trim() || "-",
        eta: eta || "-",
        motivo: isLateStatus ? "Status atrasado" : "ETA vencida"
      });
    }
  }
  return breaches;
}
const chartColors = {
  primary: "var(--color-primary)",
  c3: "var(--color-chart-3)",
  c4: "var(--color-chart-4)",
  c5: "var(--color-chart-5)",
  border: "var(--color-border)",
  mutedFg: "var(--color-muted-foreground)"
};
const AREA = "logistica";
const modules = [{
  id: "cargas",
  label: "Cargas",
  description: "Pedidos em separação, em trânsito e entregues. Posiciona pinos no mapa.",
  icon: Truck,
  fields: [{
    key: "codigo",
    label: "Código"
  }, {
    key: "cliente",
    label: "Cliente"
  }, {
    key: "origem",
    label: "Cidade de Origem"
  }, {
    key: "origem_lat",
    label: "Latitude Origem",
    type: "number",
    hint: "-23.55"
  }, {
    key: "origem_lng",
    label: "Longitude Origem",
    type: "number",
    hint: "-46.63"
  }, {
    key: "destino",
    label: "Cidade de Destino"
  }, {
    key: "destino_lat",
    label: "Latitude Destino",
    type: "number"
  }, {
    key: "destino_lng",
    label: "Longitude Destino",
    type: "number"
  }, {
    key: "peso",
    label: "Peso (kg)",
    type: "number"
  }, {
    key: "valor",
    label: "Valor (R$)",
    type: "number"
  }, {
    key: "motorista",
    label: "Motorista"
  }, {
    key: "placa",
    label: "Placa do Veículo"
  }, {
    key: "status",
    label: "Status",
    hint: "Em trânsito, Entregue, Atrasado, Aguardando"
  }, {
    key: "eta",
    label: "ETA",
    type: "date"
  }]
}, {
  id: "motoristas",
  label: "Motoristas",
  description: "Equipe ativa, escala, posição atual e desempenho.",
  icon: Users,
  fields: [{
    key: "nome",
    label: "Nome"
  }, {
    key: "cnh",
    label: "CNH"
  }, {
    key: "telefone",
    label: "Telefone"
  }, {
    key: "veiculo",
    label: "Veículo padrão"
  }, {
    key: "atual_lat",
    label: "Latitude Atual",
    type: "number"
  }, {
    key: "atual_lng",
    label: "Longitude Atual",
    type: "number"
  }, {
    key: "status",
    label: "Status",
    hint: "Disponível, Em rota, Folga"
  }, {
    key: "score",
    label: "Score",
    type: "number"
  }]
}, {
  id: "rotas",
  label: "Rotas",
  description: "Trajetos planejados com custo, SLA e paradas.",
  icon: MapPin,
  fields: [{
    key: "nome",
    label: "Nome da rota"
  }, {
    key: "origem",
    label: "Origem"
  }, {
    key: "origem_lat",
    label: "Latitude Origem",
    type: "number"
  }, {
    key: "origem_lng",
    label: "Longitude Origem",
    type: "number"
  }, {
    key: "destino",
    label: "Destino"
  }, {
    key: "destino_lat",
    label: "Latitude Destino",
    type: "number"
  }, {
    key: "destino_lng",
    label: "Longitude Destino",
    type: "number"
  }, {
    key: "distancia",
    label: "Distância (km)",
    type: "number"
  }, {
    key: "sla",
    label: "SLA (h)",
    type: "number"
  }, {
    key: "paradas",
    label: "Paradas intermediárias"
  }]
}, {
  id: "frota",
  label: "Frota",
  description: "Veículos da operação com posição e situação.",
  icon: Wrench,
  fields: [{
    key: "placa",
    label: "Placa"
  }, {
    key: "modelo",
    label: "Modelo"
  }, {
    key: "tipo",
    label: "Tipo",
    hint: "Carreta, Truck, VUC, Van"
  }, {
    key: "capacidade",
    label: "Capacidade (kg)",
    type: "number"
  }, {
    key: "atual_lat",
    label: "Latitude Atual",
    type: "number"
  }, {
    key: "atual_lng",
    label: "Longitude Atual",
    type: "number"
  }, {
    key: "status",
    label: "Status",
    hint: "Disponível, Em rota, Manutenção"
  }, {
    key: "ultima_manutencao",
    label: "Última manutenção",
    type: "date"
  }]
}, {
  id: "bases",
  label: "Bases e Filiais",
  description: "Matriz, filiais e centros de distribuição.",
  icon: Building2,
  fields: [{
    key: "nome",
    label: "Nome"
  }, {
    key: "tipo",
    label: "Tipo",
    hint: "Matriz, Filial, Centro de Distribuição"
  }, {
    key: "endereco",
    label: "Endereço"
  }, {
    key: "cidade",
    label: "Cidade / UF"
  }, {
    key: "lat",
    label: "Latitude",
    type: "number"
  }, {
    key: "lng",
    label: "Longitude",
    type: "number"
  }, {
    key: "responsavel",
    label: "Responsável"
  }]
}, {
  id: "roteirizacao",
  label: "Roteirização de Entregas na Cidade",
  description: "Sequência urbana de paradas, bairros, tempo previsto e responsável.",
  icon: MapPin,
  fields: [{
    key: "rota",
    label: "Rota"
  }, {
    key: "motorista",
    label: "Motorista"
  }, {
    key: "veiculo",
    label: "Veículo"
  }, {
    key: "bairros",
    label: "Bairros atendidos"
  }, {
    key: "paradas",
    label: "Paradas",
    type: "number"
  }, {
    key: "distancia",
    label: "Distância (km)",
    type: "number"
  }, {
    key: "tempo_previsto",
    label: "Tempo previsto"
  }, {
    key: "status",
    label: "Status",
    hint: "Planejada, Em execução, Concluída"
  }]
}, {
  id: "embalagens",
  label: "Controle de Embalagens e Estoque",
  description: "Saldos, mínimos, validade, fornecedor e necessidade de reposição.",
  icon: Boxes,
  fields: [{
    key: "item",
    label: "Item"
  }, {
    key: "sku",
    label: "SKU"
  }, {
    key: "saldo",
    label: "Saldo",
    type: "number"
  }, {
    key: "minimo",
    label: "Estoque mínimo",
    type: "number"
  }, {
    key: "fornecedor",
    label: "Fornecedor"
  }, {
    key: "validade",
    label: "Validade",
    type: "date"
  }, {
    key: "status",
    label: "Status",
    hint: "OK, Repor, Bloqueado"
  }]
}, {
  id: "cestas",
  label: "Sistema de Cestas/Assinaturas (CSA)",
  description: "Planos recorrentes, frequência, próxima entrega, itens padrão e pausas.",
  icon: Package,
  fields: [{
    key: "cliente",
    label: "Cliente"
  }, {
    key: "plano",
    label: "Plano"
  }, {
    key: "frequencia",
    label: "Frequência"
  }, {
    key: "proxima_entrega",
    label: "Próxima entrega",
    type: "date"
  }, {
    key: "itens_padrao",
    label: "Itens padrão",
    type: "textarea"
  }, {
    key: "pausa_ate",
    label: "Pausa até",
    type: "date"
  }, {
    key: "status",
    label: "Status",
    hint: "Ativa, Pausada, Cancelada"
  }]
}, {
  id: "expedicao",
  label: "Checklist de Expedição Pré-carga",
  description: "Conferência de pedido, temperatura, lacres e itens antes da saída.",
  icon: ClipboardList,
  fields: [{
    key: "pedido",
    label: "Pedido"
  }, {
    key: "responsavel",
    label: "Responsável"
  }, {
    key: "itens",
    label: "Itens previstos",
    type: "textarea"
  }, {
    key: "conferidos",
    label: "Itens conferidos"
  }, {
    key: "temperatura",
    label: "Temperatura"
  }, {
    key: "lacres",
    label: "Lacres"
  }, {
    key: "status",
    label: "Status",
    hint: "Pendente, Aprovado, Revisar"
  }]
}, {
  id: "fretes",
  label: "Gestão de Fretes e Custo de Transporte",
  description: "Custo por rota, transportadora, quilometragem, combustível e pedágios.",
  icon: Wallet,
  fields: [{
    key: "rota",
    label: "Rota"
  }, {
    key: "transportadora",
    label: "Transportadora"
  }, {
    key: "km",
    label: "Km",
    type: "number"
  }, {
    key: "custo",
    label: "Custo total (R$)",
    type: "number"
  }, {
    key: "combustivel",
    label: "Combustível (R$)",
    type: "number"
  }, {
    key: "pedagio",
    label: "Pedágio (R$)",
    type: "number"
  }, {
    key: "status",
    label: "Status",
    hint: "Previsto, Fechado, Revisar"
  }]
}];
const demoByModule = {
  roteirizacao: [record("roteirizacao", "1", {
    rota: "Centro + Zona Sul",
    motorista: "João Pereira",
    veiculo: "VUC NRY-2045",
    bairros: "Centro, Batel, Água Verde",
    paradas: "18",
    distancia: "42",
    tempo_previsto: "4h20",
    status: "Planejada"
  })],
  embalagens: [record("embalagens", "1", {
    item: "Caixa hortifruti P",
    sku: "CX-HF-P",
    saldo: "620",
    minimo: "300",
    fornecedor: "Pack Verde",
    validade: "2026-09-30",
    status: "OK"
  })],
  cestas: [record("cestas", "1", {
    cliente: "CSA Vila Verde",
    plano: "Família semanal",
    frequencia: "Semanal",
    proxima_entrega: "2026-06-05",
    itens_padrao: "Verduras, legumes, ovos",
    pausa_ate: "",
    status: "Ativa"
  })],
  expedicao: [record("expedicao", "1", {
    pedido: "PED-8841",
    responsavel: "Carla Souza",
    itens: "24 cestas, 12 caixas de ovos",
    conferidos: "Sim",
    temperatura: "8 C",
    lacres: "L-225, L-226",
    status: "Aprovado"
  })],
  fretes: [record("fretes", "1", {
    rota: "Curitiba > São Paulo",
    transportadora: "Frota própria",
    km: "408",
    custo: "3250",
    combustivel: "980",
    pedagio: "210",
    status: "Fechado"
  })]
};
const tabs = [{
  id: "visao-geral",
  label: "Visão Geral",
  icon: LayoutDashboard
}, ...modules.map((m) => ({
  id: m.id,
  label: m.label,
  icon: m.icon
}))];
function record(module, id, payload) {
  return {
    id: `demo-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}
function emptyPayload(m) {
  return Object.fromEntries(calculatedCostFields(m.fields).map((f) => [f.key, ""]));
}
const totalCostKeys = ["custo_total", "custo", "valor", "combustivel", "pedagio"];
function numberValue(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
function calculatedCostFields(fields) {
  if (!fields.some((field) => totalCostKeys.includes(field.key))) return fields;
  const next = [...fields];
  const add = (field) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({
    key: "quantidade",
    label: "Quantidade",
    type: "number"
  });
  add({
    key: "unidade_base",
    label: "Unidade base"
  });
  add({
    key: "custo_total",
    label: "Custo total",
    type: "number"
  });
  add({
    key: "custo_unitario",
    label: "Custo unitario",
    type: "number"
  });
  return next;
}
function normalizeCostPayload(payload, changedKey) {
  const next = {
    ...payload
  };
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }
  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }
  const quantity = numberValue(next.quantidade);
  const totalKey = changedKey && totalCostKeys.includes(changedKey) ? changedKey : next.custo_total ? "custo_total" : totalCostKeys.find((key) => next[key]) ?? "custo_total";
  const total = numberValue(next.custo_total || next[totalKey]);
  const unit = numberValue(next.custo_unitario);
  if (quantity <= 0) return next;
  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = String(Math.round(unit * quantity * 1e4) / 1e4);
  } else if (changedKey === "quantidade" || changedKey === "custo_total" || totalCostKeys.includes(changedKey ?? "")) {
    next.custo_unitario = total > 0 ? String(Math.round(total / quantity * 1e4) / 1e4) : "";
  }
  return next;
}
function updateCostPayload(current, key, value) {
  return normalizeCostPayload({
    ...current,
    [key]: value
  }, key);
}
function LogisticaPage() {
  const {
    demoMode
  } = useDemoMode();
  const [tab, setTab] = reactExports.useState("visao-geral");
  const [period, setPeriod] = reactExports.useState(defaultPeriod());
  const current = modules.find((m) => m.id === tab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-8 py-6 max-w-[1600px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Logística e Distribuição" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: demoMode ? "Modo DEMO ligado: exemplos isolados dos dados reais." : "Modo DEMO desligado: exibindo dados reais cadastrados." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PeriodPicker, { value: period, onChange: setPeriod }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toast.info("Use a exportação dentro de cada aba para baixar os dados."), className: "h-10 px-4 rounded-lg border border-border bg-card text-sm flex items-center gap-2 hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" }),
          "Exportar visão geral"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6", children: tabs.map((t) => {
      const active = tab === t.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t.id), className: cn("min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors", active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2 leading-snug", children: t.label })
      ] }) }, t.id);
    }) }),
    tab === "visao-geral" && /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewTab, {}),
    current && /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleTab, { module: current })
  ] });
}
const brl = (n) => n.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});
const statusTone = {
  entregue: chartColors.c3,
  transito: chartColors.primary,
  atras: chartColors.c5,
  aguard: chartColors.c4
};
function toneForStatus(status) {
  const norm2 = status.toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
  const key = Object.keys(statusTone).find((k) => norm2.includes(k));
  return key ? statusTone[key] : chartColors.mutedFg;
}
function OverviewTab() {
  const {
    snapshot,
    loading
  } = useConnectedAgroData();
  const records = reactExports.useMemo(() => snapshot.operations.filter((r) => r.area === "logistica"), [snapshot.operations]);
  const metrics = reactExports.useMemo(() => buildLogisticaMetrics(records), [records]);
  const freight = reactExports.useMemo(() => freightByRoute(records).slice(0, 6), [records]);
  const statusData = reactExports.useMemo(() => cargaStatusBreakdown(records), [records]);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const breaches = reactExports.useMemo(() => slaBreaches(records, today), [records, today]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatKpi, { label: "Em trânsito", value: metrics.emTransito, icon: Truck }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatKpi, { label: "Entregues", value: metrics.entregues, icon: CircleCheck }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatKpi, { label: "OTIF", value: `${metrics.otif}%`, icon: Gauge, trend: metrics.otif >= 90 ? "meta" : "abaixo", trendDir: metrics.otif >= 90 ? "up" : "down" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatKpi, { label: "Atrasadas", value: metrics.atrasadas, icon: TriangleAlert, trend: metrics.atrasadas > 0 ? "atenção" : "ok", trendDir: metrics.atrasadas > 0 ? "down" : "up" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatKpi, { label: "Custo de frete", value: brl(metrics.custoFreteTotal), icon: Wallet }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatKpi, { label: "Frota disponível", value: `${metrics.frotaDisponivel}/${metrics.frotaTotal}`, icon: Wrench, hint: `${metrics.capacidadePct}% disponível` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold tracking-tight", children: "Custo de frete por rota" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Custo + combustível + pedágio agregados por rota." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 h-64", children: freight.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "Sem fretes cadastrados", description: "Cadastre fretes na aba correspondente para ver o custo por rota." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: freight, layout: "vertical", margin: {
          left: 8,
          right: 16
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { horizontal: false, stroke: chartColors.border }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { type: "number", stroke: chartColors.mutedFg, fontSize: 11, tickLine: false, axisLine: false, tickFormatter: (v) => brl(v) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { type: "category", dataKey: "rota", width: 120, stroke: chartColors.mutedFg, fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { cursor: {
            fill: "var(--color-muted)"
          }, formatter: (v) => brl(v) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "custo", fill: chartColors.primary, radius: [0, 6, 6, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold tracking-tight", children: "Alertas de SLA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Cargas atrasadas ou com ETA vencida e não entregue." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-md px-2 py-0.5 text-xs font-semibold", breaches.length ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"), children: breaches.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 max-h-64 space-y-2 overflow-y-auto", children: breaches.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "Nenhuma carga em risco de SLA", icon: CircleCheck }) : breaches.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-medium", children: b.codigo }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs text-muted-foreground", children: b.cliente })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "ETA ",
              b.eta
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive", children: b.motivo })
          ] })
        ] }, b.id)) }),
        statusData.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-medium text-muted-foreground", children: "Status das cargas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: statusData.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full", style: {
              background: toneForStatus(s.status)
            } }),
            s.status,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums", children: s.valor })
          ] }, s.status)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TrackingMap, { title: "Mapa Operacional", subtitle: "Visualização ao vivo de cargas, motoristas e bases cadastradas.", height: "h-[480px]" }),
    loading && records.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground", children: "Sincronizando dados..." })
  ] });
}
function TrackingMap({
  title,
  subtitle
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: title ?? "Mapa operacional unico" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: subtitle ?? "Os dados de logistica aparecem no mapa principal da plataforma." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/", className: "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
      "Abrir mapa"
    ] })
  ] }) });
}
function ModuleTab({
  module
}) {
  const {
    demoMode
  } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [payload, setPayload] = reactExports.useState(emptyPayload(module));
  const fields = reactExports.useMemo(() => calculatedCostFields(module.fields), [module.fields]);
  const columns = reactExports.useMemo(() => fields.slice(0, 6).map((f) => ({
    key: f.key,
    header: f.label,
    accessor: (rec) => rec.payload[f.key] ?? "",
    render: (rec) => rec.payload[f.key] || "-",
    align: f.type === "number" ? "right" : "left"
  })), [fields]);
  const query = useQuery({
    queryKey: ["operation-records", AREA, module.id],
    queryFn: () => listOperationRecordsByAreaModule(AREA, module.id),
    enabled: !demoMode,
    staleTime: 3e4,
    refetchOnWindowFocus: false
  });
  const records = reactExports.useMemo(() => demoMode ? demoByModule[module.id] ?? [] : query.data ?? [], [demoMode, module.id, query.data]);
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["operation-records", AREA, module.id]
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-records", AREA, "all"]
    });
    invalidateConnectedQueries(queryClient);
  };
  const createMutation = useMutation({
    mutationFn: createOperationRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message)
  });
  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message)
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (e) => toast.error(e.message)
  });
  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };
  const beginEdit = (rec) => {
    if (demoMode) return toast.info("Dados demo não podem ser editados.");
    setEditing(rec);
    setPayload({
      ...emptyPayload(module),
      ...rec.payload
    });
    setOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) updateMutation.mutate({
      id: editing.id,
      payload: normalizeCostPayload(payload)
    });
    else createMutation.mutate({
      area: AREA,
      module: module.id,
      payload: normalizeCostPayload(payload)
    });
  };
  const importRows = async (rows) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createOperationRecord({
        area: AREA,
        module: module.id,
        payload: normalizeCostPayload(row)
      });
    }
    invalidate();
  };
  const handleExport = () => {
    if (records.length === 0) {
      toast.info("Nenhum registro para exportar.");
      return;
    }
    const header = fields.map((f) => f.label);
    const lines = records.map((r) => fields.map((f) => r.payload[f.key] ?? ""));
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nery-${module.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const loading = !demoMode && query.isLoading;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: module.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: module.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImportRecordsButton, { fields, disabled: demoMode, onImport: importRows }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleExport, className: "h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5" }),
          "Exportar"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: beginCreate, className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          "Adicionar"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DataTable, { columns, data: records, getRowId: (rec) => rec.id, loading, searchPlaceholder: `Buscar em ${module.label}...`, emptyMessage: demoMode ? "Sem exemplos demo neste módulo." : "Nenhum registro real cadastrado neste módulo.", actions: (rec) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => beginEdit(rec), className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted", "aria-label": "Editar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
        if (window.confirm("Excluir este registro?")) deleteMutation.mutate(rec.id);
      }, className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted", "aria-label": "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar registro" : "Adicionar registro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: module.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: fields.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          f.label,
          f.hint && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-[10px] opacity-70", children: [
            "(",
            f.hint,
            ")"
          ] })
        ] }),
        f.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: payload[f.key] ?? "", onChange: (e) => setPayload((cur) => updateCostPayload(cur, f.key, e.target.value)), className: "min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: f.type ?? "text", step: f.type === "number" ? "any" : void 0, value: payload[f.key] ?? "", onChange: (e) => setPayload((cur) => updateCostPayload(cur, f.key, e.target.value)), className: "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }, f.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "h-9 rounded-lg border border-border px-3 text-sm", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: submit, disabled: createMutation.isPending || updateMutation.isPending, className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60", children: "Salvar" })
      ] })
    ] }) })
  ] });
}
export {
  LogisticaPage as component
};
