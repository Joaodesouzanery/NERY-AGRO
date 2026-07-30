import { Activity, Layers, Percent, TrendingDown, Wallet } from "lucide-react";
import {
  barras,
  contaPor,
  rosca,
  soma,
  somaPor,
  type RegistrosPorAba,
} from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Otimização de COGS. Já tinha KPIs e um gráfico por etapa; faltavam as abas
// fontes, ineficiências, simulações, relatórios e atualização na visão geral.

const ABAS = [
  { id: "etapas", label: "Etapas do custo" },
  { id: "fontes", label: "Fontes" },
  { id: "ineficiencias", label: "Ineficiências" },
  { id: "simulacoes", label: "Simulações" },
  { id: "relatorios", label: "Relatórios" },
  { id: "atualizacao", label: "Atualização" },
];

export function buildCogsOverview(
  registros: RegistrosPorAba,
  demoMode: boolean,
): ModuleOverviewSpec {
  const etapas = registros.etapas ?? [];
  const fontes = registros.fontes ?? [];
  const ineficiencias = registros.ineficiencias ?? [];
  const simulacoes = registros.simulacoes ?? [];
  const relatorios = registros.relatorios ?? [];
  const atualizacao = registros.atualizacao ?? [];

  const custoTotal = soma(etapas, "custo");
  const volume = soma(etapas, "volume");
  const impactoIneficiencia = soma(ineficiencias, "valor");
  const economiaSimulada = soma(simulacoes, "economia");
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const porEtapa = somaPor(etapas, "etapa", "custo");

  return {
    moduleId: "cogs",
    moduleLabel: "Otimização de COGS",
    tabs: ABAS,
    demoMode,
    kpis: [
      { label: "Custo total", value: brl(custoTotal), icon: Wallet, tabId: "etapas" },
      {
        label: "Custo unitário",
        value: volume ? brl(custoTotal / volume) : "—",
        icon: Percent,
        hint: volume
          ? `sobre ${volume.toLocaleString("pt-BR")} un.`
          : "Informe o volume nas etapas",
        tabId: "etapas",
      },
      {
        label: "Impacto de ineficiências",
        value: brl(impactoIneficiencia),
        icon: TrendingDown,
        trendDir: impactoIneficiencia ? "down" : "up",
        tabId: "ineficiencias",
      },
      {
        label: "Economia simulada",
        value: brl(economiaSimulada),
        icon: Activity,
        trendDir: "up",
        tabId: "simulacoes",
      },
      { label: "Fontes conectadas", value: fontes.length, icon: Layers, tabId: "fontes" },
      {
        label: "SKUs no relatório",
        value: relatorios.length,
        icon: Layers,
        tabId: "relatorios",
      },
    ],
    charts: [
      barras({
        id: "cogs-etapas",
        tabId: "etapas",
        title: "Custo por etapa",
        description: "Onde o COGS se forma",
        featured: true,
        format: "brl",
        nome: "Custo",
        data: porEtapa,
      }),
      rosca({
        id: "cogs-composicao",
        tabId: "etapas",
        title: "Composição do COGS",
        description: "Peso de cada etapa no custo total",
        featured: true,
        format: "brl",
        nome: "Custo",
        data: porEtapa.map((e) => ({ label: e.label, total: e.valor })),
      }),
      barras({
        id: "cogs-ineficiencias",
        tabId: "ineficiencias",
        title: "Impacto por ponto de ineficiência",
        layout: "vertical",
        format: "brl",
        nome: "Impacto",
        limite: 8,
        data: somaPor(ineficiencias, "ponto", "valor"),
      }),
      barras({
        id: "cogs-simulacoes",
        tabId: "simulacoes",
        title: "Economia por cenário",
        format: "brl",
        nome: "Economia",
        limite: 8,
        data: somaPor(simulacoes, "nome", "economia"),
      }),
      rosca({
        id: "cogs-fontes",
        tabId: "fontes",
        title: "Fontes por módulo de origem",
        nome: "Fontes",
        data: contaPor(fontes, "modulo_origem"),
      }),
      barras({
        id: "cogs-margem-sku",
        tabId: "relatorios",
        title: "Margem por SKU",
        layout: "vertical",
        format: "brl",
        nome: "Margem",
        limite: 8,
        data: somaPor(relatorios, "sku", "margem"),
      }),
      barras({
        id: "cogs-atualizacao",
        tabId: "atualizacao",
        title: "Variação por evento de atualização",
        layout: "vertical",
        nome: "Variação",
        limite: 8,
        data: somaPor(atualizacao, "evento", "variacao"),
      }),
    ],
    tables: ineficiencias.length
      ? [
          {
            id: "cogs-acoes",
            tabId: "ineficiencias",
            title: "Ineficiências com maior impacto",
            description: "Priorize por valor, com a ação já cadastrada",
            head: ["Ponto", "Causa", "Impacto", "Ação"],
            body: [...ineficiencias]
              .sort((a, b) => Number(b.payload.valor ?? 0) - Number(a.payload.valor ?? 0))
              .slice(0, 6)
              .map((r) => [
                r.payload.ponto ?? "—",
                r.payload.causa ?? "—",
                brl(Number(r.payload.valor ?? 0)),
                r.payload.acao ?? "—",
              ]),
          },
        ]
      : undefined,
  };
}
