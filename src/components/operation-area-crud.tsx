import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Download, Edit3, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import {
  createOperationRecord,
  deleteOperationRecord,
  listOperationRecordsByAreaModule,
  OperationRecord,
  updateOperationRecord,
} from "@/lib/supabase-operations";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PeriodPicker, defaultPeriod, type PeriodValue } from "@/components/period-picker";
import { ImportRecordsButton } from "@/components/import-records-button";
import { exportRowsToXlsx } from "@/lib/export-xlsx";

export type OperationFieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea";
  hint?: string;
};

export type OperationModuleConfig = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  fields: OperationFieldConfig[];
};

type RecordsByModule = Record<string, OperationRecord[]>;

type OperationAreaPageProps = {
  area: string;
  title: string;
  description: string;
  modules: OperationModuleConfig[];
  demoByModule: RecordsByModule;
  renderOverviewAddon?: (recordsByModule: RecordsByModule) => ReactNode;
  renderModuleAddon?: (module: OperationModuleConfig, records: OperationRecord[]) => ReactNode;
};

function emptyPayload(module: OperationModuleConfig) {
  return Object.fromEntries(calculatedCostFields(module.fields).map((field) => [field.key, ""]));
}

function numberValue(value: unknown) {
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
  "co2e",
];

function hasCostSurface(fields: OperationFieldConfig[]) {
  return fields.some((field) => totalCostKeys.includes(field.key));
}

function calculatedCostFields(fields: OperationFieldConfig[]) {
  if (!hasCostSurface(fields)) return fields;
  const next = [...fields];
  const add = (field: OperationFieldConfig) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({ key: "quantidade", label: "Quantidade", type: "number" });
  add({ key: "unidade_base", label: "Unidade base" });
  add({ key: "custo_total", label: "Custo total", type: "number" });
  add({ key: "custo_unitario", label: "Custo unitario", type: "number" });
  return next;
}

function primaryTotalKey(payload: Record<string, string>, changedKey?: string) {
  if (changedKey && totalCostKeys.includes(changedKey)) return changedKey;
  if (payload.custo_total) return "custo_total";
  return totalCostKeys.find((key) => payload[key]) ?? "custo_total";
}

function roundCost(value: number) {
  return Number.isFinite(value) ? String(Math.round(value * 10000) / 10000) : "";
}

function normalizeCostPayload(payload: Record<string, string>, changedKey?: string) {
  const next = { ...payload };
  const hasCost = Object.keys(next).some(
    (key) => totalCostKeys.includes(key) || key === "custo_unitario",
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

  if (
    (changedKey === "quantidade" ||
      changedKey === "custo_total" ||
      totalCostKeys.includes(changedKey ?? "")) &&
    total > 0
  ) {
    next.custo_unitario = roundCost(total / quantity);
  }
  return next;
}

function updateCostPayload(
  current: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  return normalizeCostPayload({ ...current, [key]: value }, key);
}

function exportXlsx(area: string, module: OperationModuleConfig, records: OperationRecord[]) {
  const fields = calculatedCostFields(module.fields);
  const header = fields.map((field) => field.label);
  const rows = records.map((recordItem) =>
    fields.map((field) => recordItem.payload[field.key] ?? ""),
  );
  exportRowsToXlsx(`nery-${area}-${module.id}`, header, rows, module.shortLabel);
}

function statusNeedsAttention(status: unknown) {
  const value = String(status ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return ["alerta", "atencao", "critico", "revisar", "pendente", "vencido"].some((term) =>
    value.includes(term),
  );
}

export function OperationAreaPage({
  area,
  title,
  description,
  modules,
  demoByModule,
  renderOverviewAddon,
  renderModuleAddon,
}: OperationAreaPageProps) {
  const { demoMode } = useDemoMode();
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());
  const [tab, setTab] = useState("visao-geral");
  const current = modules.find((module) => module.id === tab);

  const queries = useQueries({
    queries: modules.map((module) => ({
      queryKey: ["operation-records", area, module.id],
      queryFn: () => listOperationRecordsByAreaModule(area, module.id),
      enabled: !demoMode,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    })),
  });

  const recordsByModule = useMemo<RecordsByModule>(() => {
    if (demoMode) return demoByModule;
    return Object.fromEntries(
      modules.map((module, index) => [module.id, queries[index].data ?? []]),
    );
  }, [demoByModule, demoMode, modules, queries]);

  const allRecords = Object.values(recordsByModule).flat();
  const alerts = allRecords.filter((recordItem) =>
    statusNeedsAttention(recordItem.payload.status),
  ).length;
  const numericTotal = allRecords.reduce(
    (sum, recordItem) =>
      sum +
      numberValue(
        recordItem.payload.valor_estimado ??
          recordItem.payload.co2e ??
          recordItem.payload.margem ??
          recordItem.payload.valor,
      ),
    0,
  );

  return (
    <div className="px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {demoMode
              ? "Modo DEMO ligado: exemplos protegidos contra edição."
              : "Modo DEMO desligado: salvando registros reais no Supabase."}
          </p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Abas ativas" value={String(modules.length)} />
        <Kpi label="Registros" value={String(allRecords.length)} tone="info" />
        <Kpi label="Alertas" value={String(alerts)} tone={alerts ? "warning" : "success"} />
        <Kpi label="Indicador acumulado" value={numericTotal.toLocaleString("pt-BR")} />
      </div>

      <div className="md:flex md:items-start md:gap-6">
        {/* Rail de abas — vertical no desktop, faixa rolável no mobile */}
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0">
          <TabButton
            label="Visão Geral"
            active={tab === "visao-geral"}
            onClick={() => setTab("visao-geral")}
          />
          {modules.map((module) => (
            <TabButton
              key={module.id}
              label={module.shortLabel}
              icon={module.icon}
              active={tab === module.id}
              onClick={() => setTab(module.id)}
            />
          ))}
        </nav>

        {/* Painel de conteúdo */}
        <div className="mt-3 min-w-0 flex-1 rounded-xl border border-border p-3 sm:p-4 md:mt-0">
          {current ? (
            <ModuleTab
              area={area}
              module={current}
              records={recordsByModule[current.id] ?? []}
              addon={renderModuleAddon?.(current, recordsByModule[current.id] ?? [])}
            />
          ) : (
            <AreaOverview
              modules={modules}
              recordsByModule={recordsByModule}
              onSelect={setTab}
              addon={renderOverviewAddon?.(recordsByModule)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex min-w-[8.5rem] shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-left text-sm font-semibold transition-colors md:min-w-0",
        active
          ? "bg-primary text-primary-foreground shadow-sm md:after:absolute md:after:right-[-9px] md:after:top-1/2 md:after:-translate-y-1/2 md:after:border-[7px] md:after:border-transparent md:after:border-l-primary md:after:content-['']"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary-foreground" : "text-muted-foreground",
          )}
        />
      )}
      <span className="truncate leading-snug md:line-clamp-2 md:whitespace-normal">{label}</span>
    </button>
  );
}

function AreaOverview({
  modules,
  recordsByModule,
  onSelect,
  addon,
}: {
  modules: OperationModuleConfig[];
  recordsByModule: RecordsByModule;
  onSelect: (moduleId: string) => void;
  addon?: ReactNode;
}) {
  const moduleVolume = modules.map((module) => ({
    label: module.shortLabel,
    valor: (recordsByModule[module.id] ?? []).length,
  }));

  return (
    <section>
      <div className="mb-4">
        <h3 className="font-semibold">Visão Geral do Módulo</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Resumo das abas, registros e pontos de atenção deste módulo.
        </p>
      </div>
      <div className="mb-5 h-56 rounded-lg border border-border bg-background/60 p-3">
        <ResponsiveContainer>
          <BarChart data={moduleVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {addon && <div className="mb-5">{addon}</div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const records = recordsByModule[module.id] ?? [];
          const alerts = records.filter((recordItem) =>
            statusNeedsAttention(recordItem.payload.status),
          ).length;
          const last = records[0]?.payload[module.fields[0]?.key] ?? "Sem registros";
          return (
            <button
              key={module.id}
              onClick={() => onSelect(module.id)}
              className="rounded-lg border border-border bg-background/60 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <module.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{module.label}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {module.description}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Registros</div>
                  <div className="mt-1 text-lg font-semibold">{records.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Alertas</div>
                  <div className="mt-1 text-lg font-semibold text-warning">{alerts}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-muted-foreground">Último</div>
                  <div className="mt-1 truncate font-medium">{last}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "info" | "warning" | "success";
}) {
  const toneClass = {
    default: "text-foreground",
    info: "text-primary",
    warning: "text-warning",
    success: "text-success",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function ModuleTab({
  area,
  module,
  records,
  addon,
}: {
  area: string;
  module: OperationModuleConfig;
  records: OperationRecord[];
  addon?: ReactNode;
}) {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, string>>(emptyPayload(module));
  const fields = useMemo(() => calculatedCostFields(module.fields), [module.fields]);

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
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };

  const beginEdit = (recordItem: OperationRecord) => {
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

  const importRows = async (rows: Record<string, string>[]) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createOperationRecord({ area, module: module.id, payload: normalizeCostPayload(row) });
    }
    toast.success(`${rows.length} registro(s) importado(s).`);
    invalidate();
  };

  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <module.icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">{module.label}</h3>
            <p className="text-xs text-muted-foreground">{module.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ImportRecordsButton
            fields={fields}
            disabled={demoMode}
            onImport={importRows}
            className="h-9 rounded-lg border border-border px-3 text-sm"
          />
          <button
            onClick={() =>
              records.length
                ? exportXlsx(area, module, records)
                : toast.info("Nenhum registro para exportar.")
            }
            className="h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
          </button>
          <button
            onClick={beginCreate}
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {addon && <div className="mb-5">{addon}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {fields.slice(0, 6).map((field) => (
                <th key={field.key} className="py-3 pr-4 font-medium">
                  {field.label}
                </th>
              ))}
              <th className="py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {records.map((recordItem) => (
              <tr key={recordItem.id} className="border-b border-border last:border-0">
                {fields.slice(0, 6).map((field) => (
                  <td key={field.key} className="py-3 pr-4">
                    {recordItem.payload[field.key] || "-"}
                  </td>
                ))}
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => beginEdit(recordItem)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
                        if (window.confirm("Excluir este registro?"))
                          deleteMutation.mutate(recordItem.id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum registro real cadastrado neste módulo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Adicionar registro"}</DialogTitle>
            <DialogDescription>{module.label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">
                  {field.label}
                  {field.hint && (
                    <span className="ml-1 text-[10px] opacity-70">({field.hint})</span>
                  )}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    value={payload[field.key] ?? ""}
                    onChange={(event) =>
                      setPayload((current) =>
                        updateCostPayload(current, field.key, event.target.value),
                      )
                    }
                    className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                ) : (
                  <input
                    type={field.type ?? "text"}
                    step={field.type === "number" ? "any" : undefined}
                    value={payload[field.key] ?? ""}
                    onChange={(event) =>
                      setPayload((current) =>
                        updateCostPayload(current, field.key, event.target.value),
                      )
                    }
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
