import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, HandCoins, Users } from "lucide-react";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";

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

function EquipeVendasPage() {
  return (
    <OperationAreaPage
      area={AREA}
      title="Equipe & Vendas"
      description="Vendas diretas, clientes, mão de obra e tarefas prioritárias conectadas ao restante da operação."
      modules={modules}
      demoByModule={demoByModule}
    />
  );
}
