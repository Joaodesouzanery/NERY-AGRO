import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, HandCoins, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";
import { buildEquipeMetrics } from "@/lib/equipe-metrics";

export const Route = createFileRoute("/equipe-vendas")({
  head: () => ({
    meta: [
      { title: "Equipe & Vendas - Nery Agro" },
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

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
    />
  );
}
