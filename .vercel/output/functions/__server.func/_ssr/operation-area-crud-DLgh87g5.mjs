import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueries, c as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { m as listOperationRecordsByAreaModule, f as createOperationRecord, i as deleteOperationRecord, o as updateOperationRecord, j as invalidateConnectedQueries } from "./connected-agro-data-B5gpgC4B.mjs";
import { u as useDemoMode, c as cn } from "./router-D1uahgUG.mjs";
import { I as ImportRecordsButton, D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./import-records-button-BiVLSQbM.mjs";
import { d as defaultPeriod, P as PeriodPicker } from "./period-picker-BtQVPyDA.mjs";
import { e as exportRowsToXlsx } from "./export-xlsx-CRIENmK4.mjs";
import { t as Download, X as Plus, W as PenLine, aa as Trash2 } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar } from "../_libs/recharts.mjs";
function emptyPayload(module) {
  return Object.fromEntries(calculatedCostFields(module.fields).map((field) => [field.key, ""]));
}
function numberValue(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
const totalCostKeys = [
  "custo_total",
  "custo",
  "valor",
  "valor_estimado",
  "receita",
  "margem",
  "economia",
  "cogs",
  "co2e"
];
function hasCostSurface(fields) {
  return fields.some((field) => totalCostKeys.includes(field.key));
}
function calculatedCostFields(fields) {
  if (!hasCostSurface(fields)) return fields;
  const next = [...fields];
  const add = (field) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({ key: "quantidade", label: "Quantidade", type: "number" });
  add({ key: "unidade_base", label: "Unidade base" });
  add({ key: "custo_total", label: "Custo total", type: "number" });
  add({ key: "custo_unitario", label: "Custo unitario", type: "number" });
  return next;
}
function primaryTotalKey(payload, changedKey) {
  if (changedKey && totalCostKeys.includes(changedKey)) return changedKey;
  if (payload.custo_total) return "custo_total";
  return totalCostKeys.find((key) => payload[key]) ?? "custo_total";
}
function roundCost(value) {
  return Number.isFinite(value) ? String(Math.round(value * 1e4) / 1e4) : "";
}
function normalizeCostPayload(payload, changedKey) {
  const next = { ...payload };
  const hasCost = Object.keys(next).some(
    (key) => totalCostKeys.includes(key) || key === "custo_unitario"
  );
  if (!hasCost) return next;
  const quantity = numberValue(next.quantidade);
  const totalKey = primaryTotalKey(next, changedKey);
  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }
  const total = numberValue(next.custo_total || next[totalKey]);
  const unit = numberValue(next.custo_unitario);
  if (quantity <= 0) return next;
  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = roundCost(unit * quantity);
    return next;
  }
  if ((changedKey === "quantidade" || changedKey === "custo_total" || totalCostKeys.includes(changedKey ?? "")) && total > 0) {
    next.custo_unitario = roundCost(total / quantity);
  }
  return next;
}
function updateCostPayload(current, key, value) {
  return normalizeCostPayload({ ...current, [key]: value }, key);
}
function exportXlsx(area, module, records) {
  const fields = calculatedCostFields(module.fields);
  const header = fields.map((field) => field.label);
  const rows = records.map(
    (recordItem) => fields.map((field) => recordItem.payload[field.key] ?? "")
  );
  exportRowsToXlsx(`nery-${area}-${module.id}`, header, rows, module.shortLabel);
}
function statusNeedsAttention(status) {
  const value = String(status ?? "").toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
  return ["alerta", "atencao", "critico", "revisar", "pendente", "vencido"].some(
    (term) => value.includes(term)
  );
}
function OperationAreaPage({
  area,
  title,
  description,
  modules,
  demoByModule,
  renderOverviewAddon,
  renderModuleAddon
}) {
  const { demoMode } = useDemoMode();
  const [period, setPeriod] = reactExports.useState(defaultPeriod());
  const [tab, setTab] = reactExports.useState("visao-geral");
  const current = modules.find((module) => module.id === tab);
  const queries = useQueries({
    queries: modules.map((module) => ({
      queryKey: ["operation-records", area, module.id],
      queryFn: () => listOperationRecordsByAreaModule(area, module.id),
      enabled: !demoMode,
      staleTime: 3e4,
      refetchOnWindowFocus: false
    }))
  });
  const recordsByModule = reactExports.useMemo(() => {
    if (demoMode) return demoByModule;
    return Object.fromEntries(
      modules.map((module, index) => [module.id, queries[index].data ?? []])
    );
  }, [demoByModule, demoMode, modules, queries]);
  const allRecords = Object.values(recordsByModule).flat();
  const alerts = allRecords.filter(
    (recordItem) => statusNeedsAttention(recordItem.payload.status)
  ).length;
  const numericTotal = allRecords.reduce(
    (sum, recordItem) => sum + numberValue(
      recordItem.payload.valor_estimado ?? recordItem.payload.co2e ?? recordItem.payload.margem ?? recordItem.payload.valor
    ),
    0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-8 py-6 max-w-[1600px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: demoMode ? "Modo DEMO ligado: exemplos protegidos contra edição." : "Modo DEMO desligado: salvando registros reais no Supabase." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PeriodPicker, { value: period, onChange: setPeriod })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Abas ativas", value: String(modules.length) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Registros", value: String(allRecords.length), tone: "info" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Alertas", value: String(alerts), tone: alerts ? "warning" : "success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Indicador acumulado", value: numericTotal.toLocaleString("pt-BR") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:flex md:items-start md:gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabButton,
          {
            label: "Visão Geral",
            active: tab === "visao-geral",
            onClick: () => setTab("visao-geral")
          }
        ),
        modules.map((module) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabButton,
          {
            label: module.shortLabel,
            icon: module.icon,
            active: tab === module.id,
            onClick: () => setTab(module.id)
          },
          module.id
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "mt-3 min-w-0 flex-1 rounded-xl border-2 p-3 sm:p-4 md:mt-0",
          style: { borderColor: "rgba(43,178,74,0.35)" },
          children: current ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            ModuleTab,
            {
              area,
              module: current,
              records: recordsByModule[current.id] ?? [],
              addon: renderModuleAddon?.(current, recordsByModule[current.id] ?? [])
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            AreaOverview,
            {
              modules,
              recordsByModule,
              onSelect: setTab,
              addon: renderOverviewAddon?.(recordsByModule)
            }
          )
        }
      )
    ] })
  ] });
}
function TabButton({
  label,
  icon: Icon,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick,
      style: active ? { backgroundColor: "#2bb24a" } : void 0,
      className: cn(
        "relative flex min-w-[8.5rem] shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-left text-sm font-semibold transition-colors md:min-w-0",
        active ? "text-white shadow-sm md:after:absolute md:after:right-[-9px] md:after:top-1/2 md:after:-translate-y-1/2 md:after:border-[7px] md:after:border-transparent md:after:border-l-[#2bb24a] md:after:content-['']" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      ),
      children: [
        Icon && /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("h-4 w-4 shrink-0", active ? "text-white" : "text-[#2bb24a]") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate leading-snug md:line-clamp-2 md:whitespace-normal", children: label })
      ]
    }
  );
}
function AreaOverview({
  modules,
  recordsByModule,
  onSelect,
  addon
}) {
  const moduleVolume = modules.map((module) => ({
    label: module.shortLabel,
    valor: (recordsByModule[module.id] ?? []).length
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Visão Geral do Módulo" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Resumo das abas, registros e pontos de atenção deste módulo." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5 h-56 rounded-lg border border-border bg-background/60 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: moduleVolume, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 11, tickLine: false, axisLine: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { allowDecimals: false, fontSize: 11, tickLine: false, axisLine: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "valor", fill: "var(--color-primary)", radius: [6, 6, 0, 0] })
    ] }) }) }),
    addon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5", children: addon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: modules.map((module) => {
      const records = recordsByModule[module.id] ?? [];
      const alerts = records.filter(
        (recordItem) => statusNeedsAttention(recordItem.payload.status)
      ).length;
      const last = records[0]?.payload[module.fields[0]?.key] ?? "Sem registros";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onSelect(module.id),
          className: "rounded-lg border border-border bg-background/60 p-4 text-left transition-colors hover:bg-muted/50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: module.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground", children: module.description })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Registros" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold", children: records.length })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Alertas" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold text-warning-foreground", children: alerts })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Último" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 truncate font-medium", children: last })
              ] })
            ] })
          ]
        },
        module.id
      );
    }) })
  ] });
}
function Kpi({
  label,
  value,
  tone = "default"
}) {
  const toneClass = {
    default: "text-foreground",
    info: "text-primary",
    warning: "text-warning-foreground",
    success: "text-success"
  }[tone];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1.5 text-2xl font-semibold ${toneClass}`, children: value })
  ] });
}
function ModuleTab({
  area,
  module,
  records,
  addon
}) {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [payload, setPayload] = reactExports.useState(emptyPayload(module));
  const fields = reactExports.useMemo(() => calculatedCostFields(module.fields), [module.fields]);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["operation-records", area, module.id] });
    invalidateConnectedQueries(queryClient);
  };
  const createMutation = useMutation({
    mutationFn: createOperationRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message)
  });
  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message)
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (error) => toast.error(error.message)
  });
  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };
  const beginEdit = (recordItem) => {
    if (demoMode) return toast.info("Dados demo não podem ser editados.");
    setEditing(recordItem);
    setPayload({ ...emptyPayload(module), ...recordItem.payload });
    setOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) updateMutation.mutate({ id: editing.id, payload: normalizeCostPayload(payload) });
    else createMutation.mutate({ area, module: module.id, payload: normalizeCostPayload(payload) });
  };
  const importRows = async (rows) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createOperationRecord({ area, module: module.id, payload: normalizeCostPayload(row) });
    }
    toast.success(`${rows.length} registro(s) importado(s).`);
    invalidate();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: module.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: module.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ImportRecordsButton,
          {
            fields,
            disabled: demoMode,
            onImport: importRows,
            className: "h-9 rounded-lg border border-border px-3 text-sm"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => records.length ? exportXlsx(area, module, records) : toast.info("Nenhum registro para exportar."),
            className: "h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5" }),
              "Exportar Excel"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: beginCreate,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              "Adicionar"
            ]
          }
        )
      ] })
    ] }),
    addon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5", children: addon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
        fields.slice(0, 6).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-4 font-medium", children: field.label }, field.key)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right font-medium", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        records.map((recordItem) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
          fields.slice(0, 6).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4", children: recordItem.payload[field.key] || "-" }, field.key)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => beginEdit(recordItem),
                className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted",
                "aria-label": "Editar",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
                  if (window.confirm("Excluir este registro?"))
                    deleteMutation.mutate(recordItem.id);
                },
                className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted",
                "aria-label": "Excluir",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
              }
            )
          ] }) })
        ] }, recordItem.id)),
        records.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "py-10 text-center text-sm text-muted-foreground", children: "Nenhum registro real cadastrado neste módulo." }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar registro" : "Adicionar registro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: module.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          field.label,
          field.hint && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-[10px] opacity-70", children: [
            "(",
            field.hint,
            ")"
          ] })
        ] }),
        field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: payload[field.key] ?? "",
            onChange: (event) => setPayload(
              (current) => updateCostPayload(current, field.key, event.target.value)
            ),
            className: "min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: field.type ?? "text",
            step: field.type === "number" ? "any" : void 0,
            value: payload[field.key] ?? "",
            onChange: (event) => setPayload(
              (current) => updateCostPayload(current, field.key, event.target.value)
            ),
            className: "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          }
        )
      ] }, field.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "h-9 rounded-lg border border-border px-3 text-sm",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: submit,
            disabled: createMutation.isPending || updateMutation.isPending,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60",
            children: "Salvar"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  OperationAreaPage as O
};
