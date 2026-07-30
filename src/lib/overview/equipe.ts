import { ClipboardList, DollarSign, Timer, Users } from "lucide-react";
import {
  barras,
  contaPor,
  rosca,
  soma,
  somaPor,
  type RegistrosPorAba,
} from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Equipe & Vendas. Tinha 4 KPIs e um gráfico de vendas por canal; as abas de
// mão de obra e tarefas não apareciam na visão geral.

const ABAS = [
  { id: "vendas", label: "Vendas" },
  { id: "mao_de_obra", label: "Mão de obra" },
  { id: "tarefas", label: "Tarefas" },
];

export function buildEquipeOverview(
  registros: RegistrosPorAba,
  demoMode: boolean,
): ModuleOverviewSpec {
  const vendas = registros.vendas ?? [];
  const maoObra = registros.mao_de_obra ?? [];
  const tarefas = registros.tarefas ?? [];

  const faturamento = soma(vendas, "valor");
  const custoMaoObra = soma(maoObra, "mao_obra");
  const horas = soma(maoObra, "horas");
  const colaboradores = new Set(
    maoObra.map((r) => (r.payload.colaborador ?? "").trim()).filter(Boolean),
  ).size;
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return {
    moduleId: "equipe-vendas",
    moduleLabel: "Equipe & Vendas",
    tabs: ABAS,
    demoMode,
    kpis: [
      { label: "Faturamento", value: brl(faturamento), icon: DollarSign, tabId: "vendas" },
      { label: "Pedidos", value: vendas.length, icon: ClipboardList, tabId: "vendas" },
      {
        label: "Custo de mão de obra",
        value: brl(custoMaoObra),
        icon: Users,
        tabId: "mao_de_obra",
      },
      {
        label: "Horas apontadas",
        value: horas ? `${horas.toLocaleString("pt-BR")} h` : "—",
        icon: Timer,
        tabId: "mao_de_obra",
      },
      { label: "Colaboradores", value: colaboradores, icon: Users, tabId: "mao_de_obra" },
      {
        label: "Tarefas abertas",
        value: tarefas.filter((r) => !/conclu/i.test(r.payload.status ?? "")).length,
        icon: ClipboardList,
        tabId: "tarefas",
      },
    ],
    charts: [
      barras({
        id: "vendas-canal",
        tabId: "vendas",
        title: "Vendas por canal",
        description: "Onde o faturamento é gerado",
        featured: true,
        format: "brl",
        nome: "Faturamento",
        data: somaPor(vendas, "canal", "valor"),
      }),
      barras({
        id: "maoobra-funcao",
        tabId: "mao_de_obra",
        title: "Custo de mão de obra por função",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Custo",
        limite: 8,
        data: somaPor(maoObra, "funcao", "mao_obra"),
      }),
      barras({
        id: "vendas-produto",
        tabId: "vendas",
        title: "Faturamento por produto",
        format: "brl",
        layout: "vertical",
        nome: "Faturamento",
        limite: 8,
        data: somaPor(vendas, "produto", "valor"),
      }),
      rosca({
        id: "tarefas-status",
        tabId: "tarefas",
        title: "Tarefas por status",
        nome: "Tarefas",
        data: contaPor(tarefas, "status"),
      }),
      rosca({
        id: "tarefas-prioridade",
        tabId: "tarefas",
        title: "Tarefas por prioridade",
        nome: "Tarefas",
        data: contaPor(tarefas, "prioridade"),
      }),
      barras({
        id: "maoobra-atividade",
        tabId: "mao_de_obra",
        title: "Horas por atividade",
        layout: "vertical",
        nome: "Horas",
        limite: 8,
        data: somaPor(maoObra, "atividade", "horas"),
      }),
    ],
  };
}
