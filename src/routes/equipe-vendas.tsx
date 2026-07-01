import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Coins,
  HandCoins,
  ListChecks,
  Timer,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";
import { buildEquipeMetrics } from "@/lib/equipe-metrics";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/equipe-vendas")({
  head: () => ({
    meta: [
      { title: "Equipe & Vendas - AgroTorre" },
      {
        name: "description",
        content:
          "Vendas diretas, clientes, gestão de mão de obra e tarefas prioritárias da operação.",
      },
    ],
  }),
  component: EquipeVendasPage,
});

const AREA = "equipe-vendas";

const modules: OperationModuleConfig[] = [
  {
    id: "vendas",
    label: "Vendas Diretas e Clientes",
    shortLabel: "Vendas",
    description: "Cadastro de clientes, canal de venda, pedidos e valor por venda.",
    icon: HandCoins,
    fields: [
      { key: "cliente", label: "Cliente" },
      { key: "canal", label: "Canal (WhatsApp, Feira, Loja...)" },
      { key: "produto", label: "Produto/Lote" },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "data", label: "Data", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "mao_de_obra",
    label: "Gestão de Mão de Obra e Equipe",
    shortLabel: "Mão de Obra",
    description: "Diárias, tarefas atribuídas e custo de mão de obra por colaborador.",
    icon: Users,
    fields: [
      { key: "colaborador", label: "Colaborador" },
      { key: "funcao", label: "Função" },
      { key: "atividade", label: "Atividade" },
      { key: "data", label: "Data", type: "date" },
      { key: "horas", label: "Horas trabalhadas", type: "number" },
      { key: "mao_obra", label: "Custo (mão de obra)", type: "number" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "tarefas",
    label: "To-Do List da Operação",
    shortLabel: "Tarefas",
    description: "Tarefas prioritárias do dia, responsável, prazo e status.",
    icon: CheckSquare,
    fields: [
      { key: "tarefa", label: "Tarefa" },
      { key: "responsavel", label: "Responsável" },
      { key: "prioridade", label: "Prioridade (Alta/Média/Baixa)" },
      { key: "prazo", label: "Prazo", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  vendas: [
    record("vendas", "1", {
      cliente: "Feira Municipal Centro",
      canal: "Feira",
      produto: "Caixa de tomate orgânico",
      quantidade: "40",
      valor: "1280",
      data: "2026-06-10",
      status: "Concluída",
    }),
    record("vendas", "2", {
      cliente: "Maria Oliveira",
      canal: "WhatsApp",
      produto: "Cesta agroecológica",
      quantidade: "8",
      valor: "640",
      data: "2026-06-12",
      status: "Aguardando entrega",
    }),
  ],
  mao_de_obra: [
    record("mao_de_obra", "1", {
      colaborador: "José Almeida",
      funcao: "Operador de campo",
      atividade: "Colheita Talhão B",
      data: "2026-06-14",
      horas: "8",
      mao_obra: "240",
      status: "Concluída",
    }),
  ],
  tarefas: [
    record("tarefas", "1", {
      tarefa: "Revisar irrigação do Talhão A",
      responsavel: "Equipe Campo",
      prioridade: "Alta",
      prazo: "2026-06-18",
      status: "Pendente",
    }),
    record("tarefas", "2", {
      tarefa: "Confirmar entrega da feira",
      responsavel: "Logística",
      prioridade: "Média",
      prazo: "2026-06-17",
      status: "Em andamento",
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

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ── Helpers de foco por aba (mesmo padrão de logistica.tsx) ──
const normStr = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
const numberValue = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};
const countByStatus = (records: OperationRecord[], key: string, term: string) =>
  records.filter((r) => normStr(r.payload[key]).includes(term)).length;
const sumField = (records: OperationRecord[], key: string) =>
  records.reduce((sum, r) => sum + numberValue(r.payload[key]), 0);
function groupSum(records: OperationRecord[], labelKey: string, valueKey: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[labelKey] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + numberValue(r.payload[valueKey]));
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
function groupCount(records: OperationRecord[], key: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[key] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
const isDone = (status: unknown) =>
  ["conclu", "feita", "feito", "entregue", "ok"].some((k) => normStr(status).includes(k));

// ── Aba "Vendas": foco em segmentos de cliente + canal ──
function vendasFocus(records: OperationRecord[]) {
  const total = sumField(records, "valor");
  const clientes = new Set(records.map((r) => (r.payload.cliente || "—").trim())).size;
  const aguardando = records.filter((r) => !isDone(r.payload.status)).length;
  const ticket = records.length ? Math.round(total / records.length) : 0;
  const porCanal = groupSum(records, "canal", "valor").slice(0, 6);
  const porCliente = groupSum(records, "cliente", "valor").slice(0, 6);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Receita direta", value: brl(total), icon: HandCoins },
          { label: "Ticket médio", value: brl(ticket), icon: TrendingUp },
          { label: "Pedidos", value: records.length, icon: ListChecks },
          { label: "Clientes", value: clientes, icon: Users },
          {
            label: "Qtd. vendida",
            value: sumField(records, "quantidade").toLocaleString("pt-BR"),
            icon: Coins,
          },
          {
            label: "Aguardando entrega",
            value: aguardando,
            icon: Clock,
            trend: aguardando ? "pendente" : "ok",
            trendDir: aguardando ? "down" : "up",
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Receita por canal"
          description="Onde a produção está sendo escoada — também somada à Torre de Controle."
        >
          {porCanal.length ? (
            <RichBarList items={porCanal} format={brl} />
          ) : (
            <EmptyState title="Sem vendas cadastradas" />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Top clientes por receita"
          description="Segmentos que mais compram da fazenda."
        >
          {porCliente.length ? (
            <RichBarList items={porCliente} format={brl} />
          ) : (
            <EmptyState title="Sem clientes cadastrados" />
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}

// ── Aba "Mão de Obra": foco em custo por colaborador e por função ──
function maoDeObraFocus(records: OperationRecord[]) {
  const custo = sumField(records, "mao_obra");
  const horas = sumField(records, "horas");
  const colaboradores = new Set(records.map((r) => (r.payload.colaborador || "—").trim())).size;
  const custoHora = horas > 0 ? custo / horas : 0;
  const concluidas = records.filter((r) => isDone(r.payload.status)).length;
  const porColaborador = groupSum(records, "colaborador", "mao_obra").slice(0, 6);
  const horasPorFuncao = groupSum(records, "funcao", "horas").slice(0, 6);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Custo de mão de obra", value: brl(custo), icon: Wallet },
          {
            label: "Horas totais",
            value: `${horas.toLocaleString("pt-BR")} h`,
            icon: Timer,
          },
          { label: "Custo por hora", value: custoHora > 0 ? brl(custoHora) : "—", icon: Coins },
          { label: "Colaboradores", value: colaboradores, icon: Users },
          { label: "Diárias/atividades", value: records.length, icon: ListChecks },
          { label: "Concluídas", value: concluidas, icon: CheckCircle2 },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Custo por colaborador"
          description="Quem mais pesa no custo de mão de obra do período."
        >
          {porColaborador.length ? (
            <RichBarList items={porColaborador} format={brl} />
          ) : (
            <EmptyState title="Sem registros de mão de obra" />
          )}
        </RichTabPanel>
        <RichTabPanel title="Horas por função" description="Distribuição do esforço da equipe.">
          {horasPorFuncao.length ? (
            <RichBarList items={horasPorFuncao} format={(n) => `${n.toLocaleString("pt-BR")} h`} />
          ) : (
            <EmptyState title="Sem horas registradas" />
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}

// ── Aba "Tarefas": foco em Kanban por status + prioridade ──
const KANBAN_COLUMNS: Array<{ label: string; match: (status: unknown) => boolean }> = [
  { label: "Pendente", match: (s) => normStr(s).includes("pend") || normStr(s).trim() === "" },
  {
    label: "Em andamento",
    match: (s) => ["andamento", "execu", "progresso"].some((k) => normStr(s).includes(k)),
  },
  { label: "Concluída", match: (s) => isDone(s) },
];

function tarefasFocus(records: OperationRecord[]) {
  const pendentes = records.filter((r) => !isDone(r.payload.status)).length;
  const concluidas = records.filter((r) => isDone(r.payload.status)).length;
  const emAndamento = countByStatus(records, "status", "andamento");
  const alta = countByStatus(records, "prioridade", "alta");
  const today = new Date().toISOString().slice(0, 10);
  const atrasadas = records.filter(
    (r) => !isDone(r.payload.status) && r.payload.prazo && r.payload.prazo < today,
  ).length;

  // distribui cada tarefa na primeira coluna que casar (sem dupla contagem)
  const buckets = KANBAN_COLUMNS.map((col) => ({
    label: col.label,
    items: [] as OperationRecord[],
  }));
  for (const r of records) {
    const idx = KANBAN_COLUMNS.findIndex((col) => col.match(r.payload.status));
    buckets[idx === -1 ? 0 : idx].items.push(r);
  }
  const porResponsavel = groupCount(records, "responsavel").slice(0, 6);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Tarefas", value: records.length, icon: ListChecks },
          {
            label: "Pendentes",
            value: pendentes,
            icon: Clock,
            trend: pendentes ? "abrir" : "ok",
            trendDir: pendentes ? "down" : "up",
          },
          { label: "Em andamento", value: emAndamento, icon: Timer },
          { label: "Concluídas", value: concluidas, icon: CheckCircle2 },
          { label: "Alta prioridade", value: alta, icon: AlertTriangle },
          {
            label: "Atrasadas",
            value: atrasadas,
            icon: AlertTriangle,
            trend: atrasadas ? "atenção" : "ok",
            trendDir: atrasadas ? "down" : "up",
          },
        ]}
      />
      <RichTabPanel
        title="Quadro da operação"
        description="Tarefas organizadas por status — visão de Kanban."
      >
        {records.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {buckets.map((col) => (
              <div key={col.label} className="rounded-lg border border-border bg-background/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{col.label}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.items.length === 0 ? (
                    <p className="py-3 text-center text-[11px] text-muted-foreground">
                      Sem tarefas
                    </p>
                  ) : (
                    col.items.map((r) => {
                      const overdue =
                        !isDone(r.payload.status) && r.payload.prazo && r.payload.prazo < today;
                      return (
                        <div
                          key={r.id}
                          className="rounded-md border border-border bg-card px-2.5 py-2 text-sm"
                        >
                          <div className="truncate font-medium">{r.payload.tarefa || "—"}</div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <span className="truncate">{r.payload.responsavel || "Sem dono"}</span>
                            {r.payload.prazo && (
                              <span
                                className={
                                  overdue ? "font-medium text-destructive" : "tabular-nums"
                                }
                              >
                                {r.payload.prazo}
                              </span>
                            )}
                          </div>
                          {normStr(r.payload.prioridade).includes("alta") && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-destructive/12 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Alta
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sem tarefas cadastradas" />
        )}
      </RichTabPanel>
      {porResponsavel.length > 0 && (
        <RichTabPanel
          title="Carga por responsável"
          description="Distribuição de tarefas entre a equipe."
        >
          <RichBarList items={porResponsavel} />
        </RichTabPanel>
      )}
    </div>
  );
}

const moduleFocus: Record<string, (records: OperationRecord[]) => React.ReactNode> = {
  vendas: vendasFocus,
  mao_de_obra: maoDeObraFocus,
  tarefas: tarefasFocus,
};

function EquipeDashboard({
  recordsByModule,
}: {
  recordsByModule: Record<string, OperationRecord[]>;
}) {
  const m = buildEquipeMetrics({
    vendas: recordsByModule.vendas,
    maoDeObra: recordsByModule.mao_de_obra,
    tarefas: recordsByModule.tarefas,
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Vendas (total)" value={brl(m.vendasTotal)} />
        <Kpi label="Ticket médio" value={brl(m.ticketMedio)} />
        <Kpi label="Custo de mão de obra" value={brl(m.custoMaoObra)} />
        <Kpi label="Tarefas pendentes" value={`${m.tarefasPendentes}/${m.tarefasTotal}`} />
      </div>
      {m.vendasPorCanal.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="font-semibold">Vendas por canal</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Receita das vendas diretas por canal — também somada à Torre de Controle.
          </p>
          <div className="mt-4 h-60">
            <ResponsiveContainer>
              <BarChart data={m.vendasPorCanal}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="canal" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function EquipeVendasPage() {
  return (
    <OperationAreaPage
      area={AREA}
      title="Equipe & Vendas"
      description="Vendas diretas, clientes, mão de obra e tarefas prioritárias conectadas ao restante da operação."
      modules={modules}
      demoByModule={demoByModule}
      renderOverviewAddon={(recordsByModule) => (
        <EquipeDashboard recordsByModule={recordsByModule} />
      )}
      renderModuleAddon={(module, records) => moduleFocus[module.id]?.(records)}
    />
  );
}
