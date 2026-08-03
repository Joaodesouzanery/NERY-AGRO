import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  BellRing,
  Calculator,
  CalendarDays,
  ClipboardList,
  Edit3,
  FileSignature,
  LayoutDashboard,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createFinancialRecord,
  deleteFinancialRecord,
  FinancialRecord,
  isSupabaseConfigured,
  listFinancialRecords,
  updateFinancialRecord,
} from "@/lib/supabase-financial";
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
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ImportRecordsButton } from "@/components/import-records-button";
import {
  buildCogsModel,
  invalidateConnectedQueries,
  useConnectedAgroData,
} from "@/lib/connected-agro-data";
import { chartPalette } from "@/lib/chart-theme";
import { RichBarList } from "@/components/rich-tab";
import { validatePayload } from "@/lib/payload-schemas";
import { ModuleOverview } from "@/components/module-overview";
import { buildFinanceiroOverview } from "@/lib/overview/financeiro";
import {
  type CostCenter,
  type CostCenterInput,
  createCostCenter,
  deleteCostCenter,
  listCostCenters,
  updateCostCenter,
} from "@/lib/supabase-cost-centers";
import {
  type Contract,
  type ContractInput,
  createContract,
  deleteContract,
  listContracts,
  updateContract,
} from "@/lib/supabase-contracts";
import {
  financialModules,
  type FieldConfig,
  type ModuleConfig,
  type RecordsByModule,
} from "@/lib/financeiro-config";
import { demoFinancialRecords } from "@/lib/demo/financeiro";
import { reguaEtapas } from "@/lib/inadimplencia-metrics";

function num(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normStr(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isExpenseType(value: unknown) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return normalized.includes("saida");
}

function dateValue(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatValue(value: string | undefined, field?: FieldConfig) {
  if (!value) return "-";
  if (field?.type === "number") return num(value).toLocaleString("pt-BR");
  return value;
}

function emptyPayload(module: ModuleConfig) {
  return Object.fromEntries(calculatedCostFields(module.fields).map((field) => [field.key, ""]));
}

const totalCostKeys = [
  "custo_total",
  "custo",
  "valor",
  "receita",
  "saldo_devedor",
  "parcela",
  "real",
  "planejado",
  "valor_ha",
];

function hasCostSurface(fields: FieldConfig[]) {
  return fields.some((field) => totalCostKeys.includes(field.key));
}

function calculatedCostFields(fields: FieldConfig[]) {
  if (!hasCostSurface(fields)) return fields;
  const next = [...fields];
  const add = (field: FieldConfig) => {
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
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }

  const quantity = num(next.quantidade);
  const totalKey = primaryTotalKey(next, changedKey);
  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }

  const total = num(next.custo_total || next[totalKey]);
  const unit = num(next.custo_unitario);
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

function moduleSummary(moduleId: string, records: FinancialRecord[]) {
  switch (moduleId) {
    case "fluxo": {
      const entradas = records
        .filter((r) => String(r.payload.tipo).toLowerCase().includes("entrada"))
        .reduce((sum, r) => sum + num(r.payload.valor), 0);
      const saidas = records
        .filter((r) => isExpenseType(r.payload.tipo))
        .reduce((sum, r) => sum + num(r.payload.valor), 0);
      return {
        headline: formatMoney(entradas - saidas),
        caption: `${formatMoney(entradas)} entradas - ${formatMoney(saidas)} saídas`,
        tone: entradas >= saidas ? "success" : "danger",
      };
    }
    case "custos": {
      const first = records[0]?.payload;
      const unitCost = first ? num(first.custo_total) / Math.max(num(first.quantidade), 1) : 0;
      return {
        headline: formatMoney(unitCost),
        caption: first ? `Custo por ${first.unidade || "unidade"}` : "Sem custo calculado",
        tone: "info",
      };
    }
    case "inadimplencia": {
      const today = new Date();
      const overdue = records.filter((r) => {
        const due = dateValue(r.payload.vencimento);
        return due
          ? due < today && !String(r.payload.status).toLowerCase().includes("pago")
          : false;
      });
      return {
        headline: formatMoney(overdue.reduce((sum, r) => sum + num(r.payload.valor), 0)),
        caption: `${overdue.length} pagamentos vencidos`,
        tone: overdue.length ? "danger" : "success",
      };
    }
    case "estoque": {
      const available = records.reduce(
        (sum, r) => sum + Math.max(num(r.payload.saldo) - num(r.payload.reservado), 0),
        0,
      );
      return {
        headline: available.toLocaleString("pt-BR"),
        caption: "unidades disponiveis",
        tone: "success",
      };
    }
    case "equilibrio": {
      const first = records[0]?.payload;
      const margin = first ? num(first.preco_venda) - num(first.custo_variavel) : 0;
      const point = margin > 0 && first ? Math.ceil(num(first.custo_fixo) / margin) : 0;
      return {
        headline: point.toLocaleString("pt-BR"),
        caption: "unidades para equilibrio",
        tone: point ? "warning" : "info",
      };
    }
    case "compras": {
      const urgent = records.filter(
        (r) => num(r.payload.estoque_atual) < num(r.payload.estoque_minimo),
      );
      return {
        headline: String(urgent.length),
        caption: "insumos para comprar",
        tone: urgent.length ? "warning" : "success",
      };
    }
    case "credito": {
      const due = records.reduce((sum, r) => sum + num(r.payload.parcela), 0);
      return { headline: formatMoney(due), caption: "proximas parcelas", tone: "warning" };
    }
    case "precos": {
      const avg = records.length
        ? records.reduce((sum, r) => sum + num(r.payload.varejo), 0) / records.length
        : 0;
      return { headline: formatMoney(avg), caption: "preço médio varejo", tone: "info" };
    }
    default:
      return {
        headline: String(records.length),
        caption: "registros cadastrados",
        tone: "default",
      };
  }
}

function buildDashboard(recordsByModule: RecordsByModule) {
  const fluxo = recordsByModule.fluxo ?? [];
  const estoque = recordsByModule.estoque ?? [];
  const compras = recordsByModule.compras ?? [];
  const inadimplencia = recordsByModule.inadimplencia ?? [];
  const credito = recordsByModule.credito ?? [];

  const entradas = fluxo
    .filter((r) => String(r.payload.tipo).toLowerCase().includes("entrada"))
    .reduce((sum, r) => sum + num(r.payload.valor), 0);
  const saidas = fluxo
    .filter((r) => isExpenseType(r.payload.tipo))
    .reduce((sum, r) => sum + num(r.payload.valor), 0);
  const estoquePronto = estoque.reduce(
    (sum, r) => sum + Math.max(num(r.payload.saldo) - num(r.payload.reservado), 0),
    0,
  );
  const comprasPendentes = compras.filter(
    (r) => num(r.payload.estoque_atual) < num(r.payload.estoque_minimo),
  ).length;
  const vencidos = inadimplencia.filter((r) => {
    const due = dateValue(r.payload.vencimento);
    return due
      ? due < new Date() && !String(r.payload.status).toLowerCase().includes("pago")
      : false;
  });
  const parcelas = credito.reduce((sum, r) => sum + num(r.payload.parcela), 0);

  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    estoquePronto,
    comprasPendentes,
    inadimplencia: vencidos.reduce((sum, r) => sum + num(r.payload.valor), 0),
    parcelas,
    chart: [
      { label: "Entradas", valor: entradas },
      { label: "Saídas", valor: saidas },
      { label: "Inadimpl.", valor: vencidos.reduce((sum, r) => sum + num(r.payload.valor), 0) },
      { label: "Parcelas", valor: parcelas },
    ],
  };
}

// As 6 superfícies do "Palantir Financial Management" adaptado: reúnem orçamento
// + realizado + contratos numa só gestão, sem excluir as abas que já existiam
// (cada módulo atual vira sub-aba da superfície correspondente).
const SURFACES: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  modules: string[];
}[] = [
  { id: "resumo", label: "Resumo & Lineage", icon: LayoutDashboard, modules: [] },
  {
    id: "orcamento",
    label: "Orçamento",
    icon: ClipboardList,
    modules: ["autorizacao", "safra", "hectare", "roi"],
  },
  { id: "realizado", label: "Realizado", icon: Banknote, modules: ["fluxo", "custos", "estoque"] },
  {
    id: "contratos",
    label: "Contratos",
    icon: FileSignature,
    modules: ["contratos", "arrendamento", "precos"],
  },
  {
    id: "obrigacoes",
    label: "Obrigações",
    icon: BellRing,
    modules: ["credito", "inadimplencia", "compras"],
  },
  { id: "cenarios", label: "Fluxo & Cenários", icon: Scale, modules: ["cenario", "equilibrio"] },
];

export function FinancialAgroCrud() {
  const { demoMode } = useDemoMode();
  const [surface, setSurface] = useState<string>("resumo");
  const [moduleTab, setModuleTab] = useState<string>("");

  const queryResults = useQueries({
    queries: financialModules.map((module) => ({
      queryKey: ["financial-records", module.id],
      queryFn: () => listFinancialRecords(module.id),
      enabled: !demoMode,
    })),
  });

  const recordsByModule = useMemo(() => {
    if (demoMode) return demoFinancialRecords;
    return Object.fromEntries(
      financialModules.map((module, index) => [module.id, queryResults[index].data ?? []]),
    ) as RecordsByModule;
  }, [demoMode, queryResults]);

  const dashboard = useMemo(() => buildDashboard(recordsByModule), [recordsByModule]);
  const loading = queryResults.some((query) => query.isLoading);

  const currentSurface = SURFACES.find((s) => s.id === surface) ?? SURFACES[0];
  const surfaceModules = currentSurface.modules
    .map((id) => financialModules.find((m) => m.id === id))
    .filter((m): m is ModuleConfig => Boolean(m));
  const activeModule = surfaceModules.find((m) => m.id === moduleTab) ?? surfaceModules[0];

  const selectSurface = (id: string) => {
    setSurface(id);
    setModuleTab(SURFACES.find((s) => s.id === id)?.modules[0] ?? "");
  };
  const goToModule = (id: string) => {
    const owner = SURFACES.find((s) => s.modules.includes(id));
    if (owner) {
      setSurface(owner.id);
      setModuleTab(id);
    }
  };

  return (
    <div className="space-y-5">
      {demoMode && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-warning">
          Dados ilustrativos — modo demonstração
        </div>
      )}
      {!demoMode && !isSupabaseConfigured && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar e salvar dados reais no
          Supabase.
        </div>
      )}

      {/* Superfícies — orçamento + realizado + contratos + obrigações numa só gestão. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {SURFACES.map((s) => {
          const active = surface === s.id;
          return (
            <button
              key={s.id}
              onClick={() => selectSurface(s.id)}
              className={cn(
                "min-h-14 rounded-xl border p-3 text-left text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <s.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {surface === "resumo" ? (
        <>
          <FinancialDashboard dashboard={dashboard} demoMode={demoMode} loading={loading} />
          <AlertsPanel recordsByModule={recordsByModule} />
          {/* Dashboard completo: KPIs e gráficos das 15 abas. */}
          <ModuleOverview
            spec={buildFinanceiroOverview(recordsByModule, demoMode)}
            onSelectTab={(tabId) => {
              const alvo = financialModules.find((m) => m.id === tabId);
              if (alvo) setModuleTab(alvo.id);
            }}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {financialModules.map((module) => {
              const summary = moduleSummary(module.id, recordsByModule[module.id] ?? []);
              return (
                <button
                  key={module.id}
                  onClick={() => goToModule(module.id)}
                  className="rounded-xl border border-border bg-card p-3 text-sm text-left hover:bg-muted/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <module.icon className="h-4 w-4 text-primary" />
                    {module.shortLabel}
                  </div>
                  <div className="mt-2 text-lg font-semibold">{summary.headline}</div>
                  <div className="text-xs text-muted-foreground">{summary.caption}</div>
                </button>
              );
            })}
          </div>
          <LineagePanel />
        </>
      ) : (
        <>
          {surface === "orcamento" &&
            (demoMode ? (
              <OrcamentoPanel records={recordsByModule.autorizacao ?? []} />
            ) : (
              <CostCentersPanel demoMode={demoMode} />
            ))}
          {surface === "contratos" && <ContractsPanel demoMode={demoMode} />}
          {surface === "obrigacoes" && (
            <ObrigacoesPanel recordsByModule={recordsByModule} demoMode={demoMode} />
          )}
          {surface === "cenarios" && <CenariosPanel records={recordsByModule.cenario ?? []} />}

          {surfaceModules.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {surfaceModules.map((m) => {
                const active = activeModule?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModuleTab(m.id)}
                    className={cn(
                      "min-h-12 rounded-lg border p-2.5 text-left text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <m.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{m.shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeModule && (
            <ModuleSection
              key={activeModule.id}
              module={activeModule}
              demoMode={demoMode}
              records={recordsByModule[activeModule.id] ?? []}
              costRecords={recordsByModule.custos ?? []}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Orçamento: verba autorizada x alocada x livre (Allocated vs Unallocated) ──
function OrcamentoPanel({ records }: { records: FinancialRecord[] }) {
  const sum = (key: string) => records.reduce((s, r) => s + num(r.payload[key]), 0);
  const autorizado = sum("valor_autorizado");
  const alocado = sum("valor_alocado");
  const realizado = sum("valor_realizado");
  const livre = autorizado - alocado;
  const exec = autorizado > 0 ? Math.round((realizado / autorizado) * 100) : 0;

  const tipoLabels: Record<string, string> = {
    insumos: "Insumos",
    mao_obra: "Mão de obra",
    maquinario: "Maquinário",
    total: "Total",
  };
  const groups = new Map<string, { auth: number; aloc: number }>();
  for (const r of records) {
    const t = normStr(r.payload.tipo_verba) || "total";
    const g = groups.get(t) ?? { auth: 0, aloc: 0 };
    g.auth += num(r.payload.valor_autorizado);
    g.aloc += num(r.payload.valor_alocado);
    groups.set(t, g);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold tracking-tight">Orçamento — Alocado x Livre</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verba autorizada por centro de custo e tipo, alocada em compras/contratos e o que ainda está
        livre. Crie e edite autorizações na tabela &ldquo;Autorizações&rdquo; abaixo.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <DashKpi label="Autorizado" value={formatMoney(autorizado)} tone="info" />
        <DashKpi label="Alocado" value={formatMoney(alocado)} tone="warning" />
        <DashKpi
          label="Livre"
          value={formatMoney(livre)}
          tone={livre >= 0 ? "success" : "danger"}
        />
        <DashKpi label="% execução" value={`${exec}%`} tone="info" />
      </div>
      {groups.size > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[...groups.entries()].map(([tipo, g]) => {
            const pct = g.auth > 0 ? Math.min(100, Math.round((g.aloc / g.auth) * 100)) : 0;
            return (
              <div key={tipo} className="rounded-lg border border-border bg-background/60 p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {tipoLabels[tipo] ?? tipo}
                </div>
                <div className="mt-1 text-lg font-semibold">{formatMoney(g.auth)}</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Alocado {pct}%</span>
                  <span>Livre {formatMoney(g.auth - g.aloc)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Obrigações: inbox + Deobligation Stats + ação "Liberar verba" ──
function ObrigacoesPanel({
  recordsByModule,
  demoMode,
}: {
  recordsByModule: RecordsByModule;
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
  const autorizacoes = recordsByModule.autorizacao ?? [];
  const credito = recordsByModule.credito ?? [];
  const inad = recordsByModule.inadimplencia ?? [];
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);

  const comprometidoNaoUsado = autorizacoes.reduce(
    (s, r) => s + Math.max(num(r.payload.valor_alocado) - num(r.payload.valor_realizado), 0),
    0,
  );
  const aVencer = credito
    .filter((r) => {
      const d = dateValue(r.payload.vencimento);
      return d ? d >= today && d <= in30 : false;
    })
    .reduce((s, r) => s + num(r.payload.parcela), 0);
  const inadVencida = inad
    .filter((r) => {
      const d = dateValue(r.payload.vencimento);
      return d ? d < today && !normStr(r.payload.status).includes("pago") : false;
    })
    .reduce((s, r) => s + num(r.payload.valor), 0);

  const deobligate = useMutation({
    mutationFn: updateFinancialRecord,
    onSuccess: () => {
      toast.success("Verba liberada com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "autorizacao"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const inbox = autorizacoes
    .map((rec) => ({
      rec,
      aberto: Math.max(num(rec.payload.valor_alocado) - num(rec.payload.valor_realizado), 0),
    }))
    .filter((x) => x.aberto > 0);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold tracking-tight">Obrigações & Compromissos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Caixa de entrada dos compromissos pendentes. Libere a verba comprometida e não usada
        (deobligate) para reprogramar recursos.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <DashKpi
          label="Verba comprometida não usada"
          value={formatMoney(comprometidoNaoUsado)}
          tone="warning"
        />
        <DashKpi label="Compromissos a vencer (30d)" value={formatMoney(aVencer)} tone="info" />
        <DashKpi
          label="Inadimplência vencida"
          value={formatMoney(inadVencida)}
          tone={inadVencida ? "danger" : "success"}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Centro de custo</th>
              <th className="py-2 pr-3 font-medium">Safra</th>
              <th className="py-2 pr-3 font-medium">Comprometido não usado</th>
              <th className="py-2 pr-3 font-medium">Vigência</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {inbox.map(({ rec, aberto }) => {
              const venc = dateValue(rec.payload.vigencia_fim);
              const fora = venc ? venc < today : false;
              return (
                <tr key={rec.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium">{rec.payload.centro_custo || "-"}</td>
                  <td className="py-2 pr-3">{rec.payload.safra || "-"}</td>
                  <td className="py-2 pr-3">{formatMoney(aberto)}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs",
                        fora ? "bg-destructive/15 text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {rec.payload.vigencia_fim || "—"}
                      {fora ? " · fora" : ""}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{rec.payload.status || "-"}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => {
                        if (demoMode) {
                          toast.info("Desligue o modo DEMO para liberar verba real.");
                          return;
                        }
                        if (
                          window.confirm(
                            "Liberar a verba comprometida e não usada deste centro de custo?",
                          )
                        ) {
                          deobligate.mutate({
                            id: rec.id,
                            payload: {
                              ...rec.payload,
                              valor_alocado: rec.payload.valor_realizado,
                              status: "verba_liberada",
                            },
                          });
                        }
                      }}
                      disabled={deobligate.isPending}
                      className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-60"
                    >
                      Liberar verba
                    </button>
                  </td>
                </tr>
              );
            })}
            {inbox.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Sem verba comprometida e não usada. Tudo reconciliado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Cenários de fluxo de caixa (forecast por premissa) ──
function CenariosPanel({ records }: { records: FinancialRecord[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold tracking-tight">Fluxo & Cenários</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Compare projeções de caixa por premissa (preço, produtividade, data de colheita). Cadastre
        cenários na tabela abaixo.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {records.map((r) => {
          const inflows = num(r.payload.inflows);
          const outflows = num(r.payload.outflows);
          const saldo = inflows - outflows;
          return (
            <div key={r.id} className="rounded-lg border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.payload.nome || "Cenário"}</div>
                <span className="text-xs text-muted-foreground">
                  {r.payload.horizonte_semanas || "–"} sem
                </span>
              </div>
              <div
                className={cn(
                  "mt-2 text-lg font-semibold",
                  saldo >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatMoney(saldo)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatMoney(inflows)} entradas · {formatMoney(outflows)} saídas
              </div>
              {r.payload.premissas && (
                <p className="mt-2 text-xs text-muted-foreground">{r.payload.premissas}</p>
              )}
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Cadastre cenários para comparar projeções de caixa.
          </div>
        )}
      </div>
    </section>
  );
}

// ── Alertas financeiros derivados (estouro, vencimento, verba ociosa) ──
function AlertsPanel({ recordsByModule }: { recordsByModule: RecordsByModule }) {
  const alerts: Array<{ id: string; tone: "danger" | "warning"; title: string; detail: string }> =
    [];
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);

  for (const r of recordsByModule.autorizacao ?? []) {
    const auth = num(r.payload.valor_autorizado);
    const real = num(r.payload.valor_realizado);
    const aloc = num(r.payload.valor_alocado);
    if (auth > 0 && real / auth > 1) {
      alerts.push({
        id: `est-${r.id}`,
        tone: "danger",
        title: "Estouro de orçamento",
        detail: `${r.payload.centro_custo}: realizado ${formatMoney(real)} acima do autorizado ${formatMoney(auth)}`,
      });
    }
    const venc = dateValue(r.payload.vigencia_fim);
    if (venc && venc < today && aloc - real > 0) {
      alerts.push({
        id: `oc-${r.id}`,
        tone: "warning",
        title: "Verba ociosa",
        detail: `${r.payload.centro_custo}: ${formatMoney(aloc - real)} comprometido e não usado, vigência vencida`,
      });
    }
  }
  for (const r of recordsByModule.credito ?? []) {
    const d = dateValue(r.payload.vencimento);
    if (d && d >= today && d <= in30) {
      alerts.push({
        id: `cr-${r.id}`,
        tone: "warning",
        title: "Parcela de crédito a vencer",
        detail: `${r.payload.contrato || r.payload.banco}: ${formatMoney(num(r.payload.parcela))} em ${r.payload.vencimento}`,
      });
    }
  }
  for (const r of recordsByModule.inadimplencia ?? []) {
    const d = dateValue(r.payload.vencimento);
    if (d && d < today && !normStr(r.payload.status).includes("pago")) {
      alerts.push({
        id: `in-${r.id}`,
        tone: "danger",
        title: "Inadimplência vencida",
        detail: `${r.payload.cliente}: ${formatMoney(num(r.payload.valor))} desde ${r.payload.vencimento}`,
      });
    }
  }
  for (const r of recordsByModule.contratos ?? []) {
    const d = dateValue(r.payload.vigencia_fim);
    if (d && d >= today && d <= in30 && !normStr(r.payload.status).includes("liquid")) {
      alerts.push({
        id: `co-${r.id}`,
        tone: "warning",
        title: "Contrato vencendo",
        detail: `${r.payload.contrato}: vigência até ${r.payload.vigencia_fim}`,
      });
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Alertas financeiros</h2>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-semibold",
            alerts.length ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
          )}
        >
          {alerts.length}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2"
          >
            <div>
              <div className="text-sm font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.detail}</div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium",
                a.tone === "danger"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-warning/15 text-warning",
              )}
            >
              {a.tone === "danger" ? "crítico" : "atenção"}
            </span>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum alerta financeiro ativo.
          </div>
        )}
      </div>
    </section>
  );
}

// ── Lineage: de onde vem cada custo do financeiro ──
function LineagePanel() {
  // Antes eram 3 nós fixos no JSX ("Campo · Insumos", "Logística · Fretes",
  // "Operações · Mão de obra") sob um título que promete rastreabilidade até o
  // lançamento de origem. Agora as etapas vêm do COGS real; sem custo, o painel
  // some em vez de encenar uma linhagem.
  const { snapshot } = useConnectedAgroData();
  const stages = useMemo(
    () => buildCogsModel(snapshot).stages.filter((s) => s.value > 0),
    [snapshot],
  );
  if (!stages.length) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Origem dos custos (lineage)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        De onde vem cada custo do financeiro — rastreável até o lançamento de origem nos outros
        módulos.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, i) => (
            <span
              key={stage.key}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
              title={stage.source}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: chartPalette[i % chartPalette.length] }}
              />
              {stage.label}
              <span className="text-xs text-muted-foreground">{formatMoney(stage.value)}</span>
            </span>
          ))}
        </div>
        <span className="text-muted-foreground">→</span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-foreground">
          <Calculator className="h-4 w-4 text-primary" />
          Custo / COGS
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
          Orçamento x Realizado
        </span>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Financeiro V2 — tabelas normalizadas (cost_centers, contracts). RLS aberta;
// perfis virão com auth. Em DEMO as queries ficam desligadas (dados reais).
// ════════════════════════════════════════════════════════════════════════

const CC_TIPOS = ["insumos", "mao_obra", "maquinario", "geral"];
const CC_TIPO_LABEL: Record<string, string> = {
  insumos: "Insumos",
  mao_obra: "Mão de obra",
  maquinario: "Maquinário",
  geral: "Geral",
};

function emptyCostCenter(): Record<string, string> {
  return {
    nome: "",
    tipo: "geral",
    safra: "",
    talhao: "",
    valor_autorizado: "",
    valor_alocado: "",
    valor_realizado: "",
    vigencia_inicio: "",
    vigencia_fim: "",
    status: "ativo",
  };
}

function CostCentersPanel({ demoMode }: { demoMode: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["cost_centers"],
    queryFn: listCostCenters,
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyCostCenter());

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    invalidateConnectedQueries(queryClient);
  };
  const createM = useMutation({
    mutationFn: createCostCenter,
    onSuccess: () => {
      toast.success("Centro de custo criado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: updateCostCenter,
    onSuccess: () => {
      toast.success("Centro de custo atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteCostCenter,
    onSuccess: () => {
      toast.success("Centro de custo excluído.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toInput = (f: Record<string, string>): CostCenterInput => ({
    nome: f.nome.trim(),
    tipo: f.tipo || "geral",
    safra: f.safra || null,
    talhao_id: f.talhao?.trim() || null,
    valor_autorizado: num(f.valor_autorizado),
    valor_alocado: num(f.valor_alocado),
    valor_realizado: num(f.valor_realizado),
    vigencia_inicio: f.vigencia_inicio || null,
    vigencia_fim: f.vigencia_fim || null,
    status: f.status || "ativo",
  });

  const beginCreate = () => {
    setEditing(null);
    setForm(emptyCostCenter());
    setOpen(true);
  };
  const beginEdit = (cc: CostCenter) => {
    setEditing(cc);
    setForm({
      nome: cc.nome,
      tipo: cc.tipo,
      safra: cc.safra ?? "",
      talhao: cc.talhao_id ?? "",
      valor_autorizado: String(cc.valor_autorizado),
      valor_alocado: String(cc.valor_alocado),
      valor_realizado: String(cc.valor_realizado),
      vigencia_inicio: cc.vigencia_inicio ?? "",
      vigencia_fim: cc.vigencia_fim ?? "",
      status: cc.status,
    });
    setOpen(true);
  };
  const submit = () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do centro de custo.");
      return;
    }
    const input = toInput(form);
    if (editing) updateM.mutate({ id: editing.id, patch: input });
    else createM.mutate(input);
  };

  const autorizado = rows.reduce((s, r) => s + r.valor_autorizado, 0);
  const alocado = rows.reduce((s, r) => s + r.valor_alocado, 0);
  const realizado = rows.reduce((s, r) => s + r.valor_realizado, 0);
  const livre = autorizado - alocado;
  const exec = autorizado > 0 ? Math.round((realizado / autorizado) * 100) : 0;

  if (demoMode) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold tracking-tight">Centros de custo (V2)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A tabela normalizada de centros de custo aparece com dados reais (desligue o modo DEMO).
          No modo demonstração, use o resumo de “Autorizações” abaixo.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Centros de custo (V2)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Orçamento normalizado: autorizado x alocado x livre, por centro de custo e safra (tabela{" "}
            <code>cost_centers</code>).
          </p>
        </div>
        <button
          onClick={beginCreate}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo centro
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <DashKpi label="Autorizado" value={formatMoney(autorizado)} tone="info" />
        <DashKpi label="Alocado" value={formatMoney(alocado)} tone="warning" />
        <DashKpi
          label="Livre"
          value={formatMoney(livre)}
          tone={livre >= 0 ? "success" : "danger"}
        />
        <DashKpi label="% execução" value={`${exec}%`} tone="info" />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Centro de custo</th>
              <th className="py-2 pr-3 font-medium">Tipo</th>
              <th className="py-2 pr-3 font-medium">Safra</th>
              <th className="py-2 pr-3 font-medium">Autorizado</th>
              <th className="py-2 pr-3 font-medium">Alocado</th>
              <th className="py-2 pr-3 font-medium">Livre</th>
              <th className="py-2 pr-3 font-medium">Vigência</th>
              <th className="py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cc) => (
              <tr key={cc.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-3 font-medium">{cc.nome}</td>
                <td className="py-2 pr-3">{CC_TIPO_LABEL[cc.tipo] ?? cc.tipo}</td>
                <td className="py-2 pr-3">{cc.safra || "-"}</td>
                <td className="py-2 pr-3">{formatMoney(cc.valor_autorizado)}</td>
                <td className="py-2 pr-3">{formatMoney(cc.valor_alocado)}</td>
                <td className="py-2 pr-3">{formatMoney(cc.valor_autorizado - cc.valor_alocado)}</td>
                <td className="py-2 pr-3 text-xs text-muted-foreground">
                  {cc.vigencia_fim || "—"}
                </td>
                <td className="py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => beginEdit(cc)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Excluir este centro de custo?")) deleteM.mutate(cc.id);
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {query.isLoading
                    ? "Carregando..."
                    : "Nenhum centro de custo. Rode a migração e clique em “Novo centro”."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar centro de custo" : "Novo centro de custo"}</DialogTitle>
            <DialogDescription>Orçamento por centro de custo / safra</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldText
              label="Nome"
              value={form.nome}
              onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
            />
            <FieldSelect
              label="Tipo de verba"
              value={form.tipo}
              options={CC_TIPOS.map((t) => ({ value: t, label: CC_TIPO_LABEL[t] }))}
              onChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
            />
            <FieldText
              label="Safra"
              value={form.safra}
              onChange={(v) => setForm((f) => ({ ...f, safra: v }))}
            />
            <FieldText
              label="Talhão (p/ margem/ROI)"
              value={form.talhao}
              onChange={(v) => setForm((f) => ({ ...f, talhao: v }))}
            />
            <FieldText
              label="Status"
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
            <FieldText
              label="Valor autorizado"
              type="number"
              value={form.valor_autorizado}
              onChange={(v) => setForm((f) => ({ ...f, valor_autorizado: v }))}
            />
            <FieldText
              label="Valor alocado"
              type="number"
              value={form.valor_alocado}
              onChange={(v) => setForm((f) => ({ ...f, valor_alocado: v }))}
            />
            <FieldText
              label="Valor realizado"
              type="number"
              value={form.valor_realizado}
              onChange={(v) => setForm((f) => ({ ...f, valor_realizado: v }))}
            />
            <FieldText
              label="Início vigência"
              type="date"
              value={form.vigencia_inicio}
              onChange={(v) => setForm((f) => ({ ...f, vigencia_inicio: v }))}
            />
            <FieldText
              label="Fim vigência"
              type="date"
              value={form.vigencia_fim}
              onChange={(v) => setForm((f) => ({ ...f, vigencia_fim: v }))}
            />
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
              disabled={createM.isPending || updateM.isPending}
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

const CONTRACT_TIPOS = [
  "venda_graos",
  "compra_insumo",
  "fixacao",
  "frete",
  "csa",
  "arrendamento",
  "credito",
];
const CONTRACT_TIPO_LABEL: Record<string, string> = {
  venda_graos: "Venda de grãos",
  compra_insumo: "Compra de insumo",
  fixacao: "Fixação",
  frete: "Frete",
  csa: "CSA / Assinatura",
  arrendamento: "Arrendamento",
  credito: "Crédito",
};

function emptyContract(): Record<string, string> {
  return {
    contrato: "",
    tipo: "venda_graos",
    contraparte: "",
    cost_center_id: "",
    talhao: "",
    qtd_contratada: "",
    qtd_liquidada: "",
    preco_unit: "",
    valor: "",
    vigencia_fim: "",
    status: "em_aberto",
  };
}

function ContractsPanel({ demoMode }: { demoMode: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["contracts"],
    queryFn: listContracts,
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const ccQuery = useQuery({
    queryKey: ["cost_centers"],
    queryFn: listCostCenters,
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const costCenters = useMemo(() => ccQuery.data ?? [], [ccQuery.data]);
  const ccName = (id: string | null) => costCenters.find((c) => c.id === id)?.nome ?? "—";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyContract());

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["contracts"] });
    invalidateConnectedQueries(queryClient);
  };
  const createM = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      toast.success("Contrato criado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: updateContract,
    onSuccess: () => {
      toast.success("Contrato atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      toast.success("Contrato excluído.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toInput = (f: Record<string, string>): ContractInput => ({
    contrato: f.contrato.trim(),
    tipo: f.tipo || "venda_graos",
    contraparte: f.contraparte || null,
    cost_center_id: f.cost_center_id || null,
    talhao_id: f.talhao?.trim() || null,
    vigencia_inicio: null,
    vigencia_fim: f.vigencia_fim || null,
    qtd_contratada: num(f.qtd_contratada),
    qtd_liquidada: num(f.qtd_liquidada),
    preco_unit: num(f.preco_unit),
    valor: num(f.valor),
    status: f.status || "em_aberto",
  });

  const beginCreate = () => {
    setEditing(null);
    setForm(emptyContract());
    setOpen(true);
  };
  const beginEdit = (c: Contract) => {
    setEditing(c);
    setForm({
      contrato: c.contrato,
      tipo: c.tipo,
      contraparte: c.contraparte ?? "",
      cost_center_id: c.cost_center_id ?? "",
      talhao: c.talhao_id ?? "",
      qtd_contratada: String(c.qtd_contratada),
      qtd_liquidada: String(c.qtd_liquidada),
      preco_unit: String(c.preco_unit),
      valor: String(c.valor),
      vigencia_fim: c.vigencia_fim ?? "",
      status: c.status,
    });
    setOpen(true);
  };
  const submit = () => {
    if (!form.contrato.trim()) {
      toast.error("Informe o nome/código do contrato.");
      return;
    }
    const input = toInput(form);
    if (editing) updateM.mutate({ id: editing.id, patch: input });
    else createM.mutate(input);
  };

  const total = rows.reduce((s, r) => s + r.valor, 0);
  const fulfillment = (c: Contract) =>
    c.qtd_contratada > 0 ? Math.round((c.qtd_liquidada / c.qtd_contratada) * 100) : 0;
  const fulfillmentAvg = rows.length
    ? Math.round(rows.reduce((s, r) => s + fulfillment(r), 0) / rows.length)
    : 0;
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);
  const vencendo = rows.filter((r) => {
    const d = dateValue(r.vigencia_fim);
    return d ? d >= today && d <= in30 && !normStr(r.status).includes("liquid") : false;
  }).length;
  const byContraparte = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows)
      map.set(r.contraparte || "—", (map.get(r.contraparte || "—") ?? 0) + r.valor);
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [rows]);

  if (demoMode) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold tracking-tight">Contratos (V2)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A tabela normalizada de contratos aparece com dados reais (desligue o modo DEMO). No modo
          demonstração, use a aba “Contratos” abaixo.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Contratos (V2)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contratos normalizados com vigência, contraparte, fulfillment e vínculo a centro de
            custo (tabela <code>contracts</code>).
          </p>
        </div>
        <button
          onClick={beginCreate}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo contrato
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <DashKpi label="Contratos" value={String(rows.length)} tone="info" />
        <DashKpi label="Valor total" value={formatMoney(total)} tone="info" />
        <DashKpi label="Fulfillment médio" value={`${fulfillmentAvg}%`} tone="success" />
        <DashKpi
          label="Vencendo (30d)"
          value={String(vencendo)}
          tone={vencendo ? "warning" : "success"}
        />
      </div>
      {byContraparte.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
          <div className="mb-3 text-sm font-semibold">Exposição por contraparte</div>
          <RichBarList items={byContraparte} format={formatMoney} />
        </div>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Contrato</th>
              <th className="py-2 pr-3 font-medium">Tipo</th>
              <th className="py-2 pr-3 font-medium">Contraparte</th>
              <th className="py-2 pr-3 font-medium">Centro de custo</th>
              <th className="py-2 pr-3 font-medium">Fulfillment</th>
              <th className="py-2 pr-3 font-medium">Valor</th>
              <th className="py-2 pr-3 font-medium">Vigência</th>
              <th className="py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const pct = fulfillment(c);
              return (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium">{c.contrato}</td>
                  <td className="py-2 pr-3">{CONTRACT_TIPO_LABEL[c.tipo] ?? c.tipo}</td>
                  <td className="py-2 pr-3">{c.contraparte || "-"}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {ccName(c.cost_center_id)}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </span>
                      <span className="text-xs tabular-nums">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3">{formatMoney(c.valor)}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {c.vigencia_fim || "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => beginEdit(c)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                        aria-label="Editar"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Excluir este contrato?")) deleteM.mutate(c.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {query.isLoading
                    ? "Carregando..."
                    : "Nenhum contrato. Rode a migração e clique em “Novo contrato”."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            <DialogDescription>Contrato normalizado (compra, venda, fixação…)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldText
              label="Contrato (nome/código)"
              value={form.contrato}
              onChange={(v) => setForm((f) => ({ ...f, contrato: v }))}
            />
            <FieldSelect
              label="Tipo"
              value={form.tipo}
              options={CONTRACT_TIPOS.map((t) => ({ value: t, label: CONTRACT_TIPO_LABEL[t] }))}
              onChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
            />
            <FieldText
              label="Contraparte"
              value={form.contraparte}
              onChange={(v) => setForm((f) => ({ ...f, contraparte: v }))}
            />
            <FieldSelect
              label="Centro de custo"
              value={form.cost_center_id}
              options={[
                { value: "", label: "—" },
                ...costCenters.map((c) => ({ value: c.id, label: c.nome })),
              ]}
              onChange={(v) => setForm((f) => ({ ...f, cost_center_id: v }))}
            />
            <FieldText
              label="Talhão (p/ margem/ROI)"
              value={form.talhao}
              onChange={(v) => setForm((f) => ({ ...f, talhao: v }))}
            />
            <FieldText
              label="Qtd. contratada"
              type="number"
              value={form.qtd_contratada}
              onChange={(v) => setForm((f) => ({ ...f, qtd_contratada: v }))}
            />
            <FieldText
              label="Qtd. liquidada"
              type="number"
              value={form.qtd_liquidada}
              onChange={(v) => setForm((f) => ({ ...f, qtd_liquidada: v }))}
            />
            <FieldText
              label="Preço unitário"
              type="number"
              value={form.preco_unit}
              onChange={(v) => setForm((f) => ({ ...f, preco_unit: v }))}
            />
            <FieldText
              label="Valor total"
              type="number"
              value={form.valor}
              onChange={(v) => setForm((f) => ({ ...f, valor: v }))}
            />
            <FieldText
              label="Fim vigência"
              type="date"
              value={form.vigencia_fim}
              onChange={(v) => setForm((f) => ({ ...f, vigencia_fim: v }))}
            />
            <FieldText
              label="Status"
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
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
              disabled={createM.isPending || updateM.isPending}
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

function FieldText({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FinancialDashboard({
  dashboard,
  demoMode,
  loading,
}: {
  dashboard: ReturnType<typeof buildDashboard>;
  demoMode: boolean;
  loading: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Visão Geral Financeira</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {demoMode
              ? "Resumo demonstrativo do financeiro agro."
              : "Resumo dos dados reais cadastrados."}
          </p>
        </div>
        <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
          {loading ? "Carregando" : demoMode ? "DEMO" : "REAL"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <DashKpi
          label="Saldo"
          value={formatMoney(dashboard.saldo)}
          tone={dashboard.saldo >= 0 ? "success" : "danger"}
        />
        <DashKpi label="Entradas" value={formatMoney(dashboard.entradas)} tone="success" />
        <DashKpi label="Saídas" value={formatMoney(dashboard.saidas)} tone="danger" />
        <DashKpi
          label="Inadimplência"
          value={formatMoney(dashboard.inadimplencia)}
          tone={dashboard.inadimplencia ? "warning" : "success"}
        />
        <DashKpi
          label="Estoque pronto"
          value={dashboard.estoquePronto.toLocaleString("pt-BR")}
          tone="info"
        />
        <DashKpi
          label="Compras pend."
          value={String(dashboard.comprasPendentes)}
          tone={dashboard.comprasPendentes ? "warning" : "success"}
        />
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer>
          <BarChart data={dashboard.chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="valor" fill="var(--color-primary)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function DashKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning" | "info";
}) {
  const classes = {
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning",
    info: "text-primary",
  };
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", classes[tone])}>{value}</div>
    </div>
  );
}

function ModuleSection({
  module,
  demoMode,
  records,
  costRecords,
}: {
  module: ModuleConfig;
  demoMode: boolean;
  records: FinancialRecord[];
  costRecords?: FinancialRecord[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, string>>(emptyPayload(module));
  const costsModule = financialModules.find((item) => item.id === "custos")!;
  const [costOpen, setCostOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FinancialRecord | null>(null);
  const [costPayload, setCostPayload] = useState<Record<string, string>>(emptyPayload(costsModule));
  const summary = moduleSummary(module.id, records);
  const fields = useMemo(() => calculatedCostFields(module.fields), [module.fields]);
  const costFields = useMemo(() => calculatedCostFields(costsModule.fields), [costsModule.fields]);

  const createMutation = useMutation({
    mutationFn: createFinancialRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateFinancialRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFinancialRecord,
    onSuccess: () => {
      toast.success("Registro excluido.");
      void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const createCostMutation = useMutation({
    mutationFn: createFinancialRecord,
    onSuccess: () => {
      toast.success("Custo por unidade adicionado.");
      setCostOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "custos"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateCostMutation = useMutation({
    mutationFn: updateFinancialRecord,
    onSuccess: () => {
      toast.success("Custo por unidade atualizado.");
      setCostOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "custos"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteCostMutation = useMutation({
    mutationFn: deleteFinancialRecord,
    onSuccess: () => {
      toast.success("Custo por unidade excluido.");
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "custos"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const beginCreate = () => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para cadastrar dados reais.");
      return;
    }
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };

  const beginEdit = (recordToEdit: FinancialRecord) => {
    if (demoMode) {
      toast.info("Dados demo não podem ser editados.");
      return;
    }
    setEditing(recordToEdit);
    setPayload({ ...emptyPayload(module), ...recordToEdit.payload });
    setOpen(true);
  };

  const beginCostCreate = () => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para cadastrar dados reais.");
      return;
    }
    setEditingCost(null);
    setCostPayload(emptyPayload(costsModule));
    setCostOpen(true);
  };

  const beginCostEdit = (recordToEdit: FinancialRecord) => {
    if (demoMode) {
      toast.info("Dados demo não podem ser editados.");
      return;
    }
    setEditingCost(recordToEdit);
    setCostPayload({ ...emptyPayload(costsModule), ...recordToEdit.payload });
    setCostOpen(true);
  };

  const submit = () => {
    if (demoMode) return;
    const check = validatePayload(module.id, payload);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: normalizeCostPayload(payload) });
      return;
    }
    createMutation.mutate({ module: module.id, payload: normalizeCostPayload(payload) });
  };

  const submitCost = () => {
    if (demoMode) return;
    if (editingCost) {
      updateCostMutation.mutate({ id: editingCost.id, payload: normalizeCostPayload(costPayload) });
      return;
    }
    createCostMutation.mutate({ module: "custos", payload: normalizeCostPayload(costPayload) });
  };

  const importRows = async (rows: Record<string, string>[]) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createFinancialRecord({ module: module.id, payload: normalizeCostPayload(row) });
    }
    void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
    invalidateConnectedQueries(queryClient);
  };

  return (
    <section id={module.id} className="scroll-mt-20 rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <module.icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{module.label}</h3>
              <p className="text-xs text-muted-foreground">{module.description}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ImportRecordsButton fields={fields} disabled={demoMode} onImport={importRows} />
          <button
            onClick={beginCreate}
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </span>
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="text-xs text-muted-foreground">Resumo calculado</div>
          <div className="mt-1 text-lg font-semibold">{summary.headline}</div>
          <div className="text-xs text-muted-foreground">{summary.caption}</div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="text-xs text-muted-foreground">Registros</div>
          <div className="mt-1 text-lg font-semibold">{records.length}</div>
          <div className="text-xs text-muted-foreground">
            {demoMode ? "Somente leitura" : "Editavel"}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="text-xs text-muted-foreground">Motor de regra</div>
          <div className="mt-1 text-lg font-semibold">Ativo</div>
          <div className="text-xs text-muted-foreground">cálculo automático por módulo</div>
        </div>
      </div>

      {module.id === "fluxo" && (
        <CashflowWorkspace
          records={records}
          costRecords={costRecords ?? []}
          demoMode={demoMode}
          onAddEntry={beginCreate}
          onAddCost={beginCostCreate}
          onEditCost={beginCostEdit}
          onDeleteCost={(id) => {
            if (demoMode) {
              toast.info("Dados demo não podem ser excluídos.");
              return;
            }
            if (window.confirm("Excluir este custo por unidade?")) deleteCostMutation.mutate(id);
          }}
        />
      )}

      {module.id === "inadimplencia" && (
        <DefaultingWorkspace records={records} demoMode={demoMode} onAdd={beginCreate} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {fields.map((field) => (
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
                {fields.map((field) => (
                  <td key={field.key} className="py-3 pr-4">
                    {formatValue(recordItem.payload[field.key], field)}
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
                        if (demoMode) {
                          toast.info("Dados demo não podem ser excluídos.");
                          return;
                        }
                        if (window.confirm("Excluir este registro?")) {
                          deleteMutation.mutate(recordItem.id);
                        }
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
                <td
                  colSpan={fields.length + 1}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum registro real cadastrado neste módulo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Adicionar registro"}</DialogTitle>
            <DialogDescription>{module.label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {fields.map((field) => (
              <label key={field.key} className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">{field.label}</span>
                <input
                  type={field.type ?? "text"}
                  value={payload[field.key] ?? ""}
                  onChange={(event) =>
                    setPayload((current) =>
                      updateCostPayload(current, field.key, event.target.value),
                    )
                  }
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
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

      {module.id === "fluxo" && (
        <Dialog open={costOpen} onOpenChange={setCostOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCost ? "Editar custo" : "Adicionar custo"}</DialogTitle>
              <DialogDescription>Custos por Unidade dentro do Fluxo de Caixa</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {costFields.map((field) => (
                <label key={field.key} className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">{field.label}</span>
                  <input
                    type={field.type ?? "text"}
                    value={costPayload[field.key] ?? ""}
                    onChange={(event) =>
                      setCostPayload((current) =>
                        updateCostPayload(current, field.key, event.target.value),
                      )
                    }
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </label>
              ))}
            </div>
            <DialogFooter>
              <button
                onClick={() => setCostOpen(false)}
                className="h-9 rounded-lg border border-border px-3 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submitCost}
                disabled={createCostMutation.isPending || updateCostMutation.isPending}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Salvar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

function CashflowWorkspace({
  records,
  costRecords,
  demoMode,
  onAddEntry,
  onAddCost,
  onEditCost,
  onDeleteCost,
}: {
  records: FinancialRecord[];
  costRecords: FinancialRecord[];
  demoMode: boolean;
  onAddEntry: () => void;
  onAddCost: () => void;
  onEditCost: (record: FinancialRecord) => void;
  onDeleteCost: (id: string) => void;
}) {
  const entradas = records.filter((recordItem) =>
    String(recordItem.payload.tipo).toLowerCase().includes("entrada"),
  );
  const saidas = records.filter((recordItem) => isExpenseType(recordItem.payload.tipo));
  const entradaTotal = entradas.reduce((sum, recordItem) => sum + num(recordItem.payload.valor), 0);
  const saidaTotal = saidas.reduce((sum, recordItem) => sum + num(recordItem.payload.valor), 0);
  const custoTotal = costRecords.reduce(
    (sum, recordItem) => sum + num(recordItem.payload.custo_total),
    0,
  );
  const margemMedia = costRecords.length
    ? costRecords.reduce((sum, recordItem) => {
        const unitCost =
          num(recordItem.payload.custo_total) / Math.max(num(recordItem.payload.quantidade), 1);
        return sum + (num(recordItem.payload.preco_venda) - unitCost);
      }, 0) / costRecords.length
    : 0;
  const dreRows = [
    ["Receita bruta", entradaTotal],
    ["(-) Saídas operacionais", -saidaTotal],
    ["(-) Custos de produção", -custoTotal],
    ["(=) Resultado simplificado", entradaTotal - saidaTotal - custoTotal],
  ];

  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">Entradas, Saídas e Custos</h4>
            <p className="text-xs text-muted-foreground">
              Custos por Unidade agora vivem dentro do Fluxo de Caixa.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAddEntry}
              className="h-8 rounded-md border border-border px-2 text-xs hover:bg-muted"
            >
              Entrada/Saída
            </button>
            <button
              onClick={onAddCost}
              className="h-8 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground"
            >
              Custo
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <DashKpi label="Entradas" value={formatMoney(entradaTotal)} tone="success" />
          <DashKpi label="Saídas" value={formatMoney(saidaTotal)} tone="danger" />
          <DashKpi
            label="Margem unitária"
            value={formatMoney(margemMedia)}
            tone={margemMedia >= 0 ? "success" : "danger"}
          />
          <DashKpi label="Custos un." value={String(costRecords.length)} tone="info" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Produto</th>
                <th className="py-2 pr-3 font-medium">Unidade</th>
                <th className="py-2 pr-3 font-medium">Custo un.</th>
                <th className="py-2 pr-3 font-medium">Venda</th>
                <th className="py-2 pr-3 font-medium">Margem</th>
                <th className="py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {costRecords.map((recordItem) => {
                const unitCost =
                  num(recordItem.payload.custo_total) /
                  Math.max(num(recordItem.payload.quantidade), 1);
                const margin = num(recordItem.payload.preco_venda) - unitCost;
                const marginPct = num(recordItem.payload.preco_venda)
                  ? (margin / num(recordItem.payload.preco_venda)) * 100
                  : 0;
                return (
                  <tr key={recordItem.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 font-medium">{recordItem.payload.produto || "-"}</td>
                    <td className="py-2 pr-3">{recordItem.payload.unidade || "-"}</td>
                    <td className="py-2 pr-3">{formatMoney(unitCost)}</td>
                    <td className="py-2 pr-3">
                      {formatMoney(num(recordItem.payload.preco_venda))}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium",
                          margin >= 0
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {formatMoney(margin)} / {marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEditCost(recordItem)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                          aria-label="Editar custo"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCost(recordItem.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                          aria-label="Excluir custo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {costRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {demoMode ? "Sem custo demonstrativo." : "Cadastre custos por unidade aqui."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/60 p-4">
        <h4 className="font-semibold">DRE simplificada</h4>
        <p className="text-xs text-muted-foreground">
          Calculada pelos registros editáveis do Fluxo e de Custos.
        </p>
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {dreRows.map(([label, value], index) => (
            <div
              key={label as string}
              className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
            >
              <span
                className={index === dreRows.length - 1 ? "font-semibold" : "text-muted-foreground"}
              >
                {label}
              </span>
              <span
                className={cn(
                  "font-semibold",
                  Number(value) >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatMoney(Number(value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Comparativo por produto</span>
            <span>{costRecords.length} itens</span>
          </div>
          <div className="space-y-3">
            {costRecords.slice(0, 5).map((recordItem) => {
              const unitCost =
                num(recordItem.payload.custo_total) /
                Math.max(num(recordItem.payload.quantidade), 1);
              const pct = num(recordItem.payload.preco_venda)
                ? clampPercent(
                    ((num(recordItem.payload.preco_venda) - unitCost) /
                      num(recordItem.payload.preco_venda)) *
                      100,
                  )
                : 0;
              return (
                <div key={recordItem.id}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{recordItem.payload.produto || "Produto"}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultingWorkspace({
  records,
  demoMode,
  onAdd,
}: {
  records: FinancialRecord[];
  demoMode: boolean;
  onAdd: () => void;
}) {
  const timeline = [...records].sort((a, b) =>
    String(a.payload.vencimento ?? "").localeCompare(String(b.payload.vencimento ?? "")),
  );
  const etapas = reguaEtapas(records);

  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">Cronograma visual</h4>
            <p className="text-xs text-muted-foreground">
              Vencimentos, atrasos e alertas configuráveis.
            </p>
          </div>
          <button
            onClick={onAdd}
            className="h-8 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground"
          >
            Novo título
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {timeline.map((recordItem) => {
            const due = dateValue(recordItem.payload.vencimento);
            const late = due ? due < new Date() : false;
            return (
              <div key={recordItem.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{recordItem.payload.cliente || "Cliente"}</div>
                    <div className="text-xs text-muted-foreground">
                      {recordItem.payload.vencimento || "Sem vencimento"}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium",
                      late ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
                    )}
                  >
                    {late ? "Atrasado" : recordItem.payload.status || "A vencer"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {formatMoney(num(recordItem.payload.valor))}
                  </span>
                  {/* Sem `|| "3"` / `|| "WhatsApp"`: um título sem régua
                      configurada exibia a de outro cliente como se fosse a dele. */}
                  <span className="text-xs text-muted-foreground">
                    {[
                      recordItem.payload.alerta_dias && `alerta ${recordItem.payload.alerta_dias}d`,
                      recordItem.payload.canal,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "Sem régua definida"}
                  </span>
                </div>
              </div>
            );
          })}
          {timeline.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {demoMode
                ? "Sem inadimplência demonstrativa."
                : "Cadastre títulos para ativar o cronograma."}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <h4 className="font-semibold">Régua de Cobrança</h4>
        </div>
        {etapas.length ? (
          <div className="mt-4 space-y-3">
            {etapas.map((etapa) => (
              <div key={etapa.etapa} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-xs font-semibold tabular-nums">
                  {etapa.titulos}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {etapa.etapa}
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(etapa.valor)}
                    {etapa.canais.length ? ` · ${etapa.canais.join(", ")}` : ""}
                    {etapa.alertaDias === null ? "" : ` · alerta ${etapa.alertaDias}d`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum título com etapa definida.</p>
        )}
        <p className="mt-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          A régua sai dos próprios títulos: preencha Etapa da régua, Canal e Alerta dias na tabela
          abaixo e cada etapa aparece aqui com o total em aberto.
        </p>
      </div>
    </div>
  );
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
