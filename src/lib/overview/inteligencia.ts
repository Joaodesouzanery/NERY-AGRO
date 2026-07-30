import { AlertTriangle, DollarSign, Percent, TrendingUp } from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import {
  barras,
  contaPor,
  num,
  rosca,
  soma,
  somaPor,
  type RegistrosPorAba,
} from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Inteligência. A visão geral era o resumo genérico ("quantos registros por
// aba"); os dois únicos gráficos do módulo só apareciam dentro de abas
// específicas. Aqui as 4 abas viram leitura de margem, tendência e perda.

const ABAS = [
  { id: "lucratividade", label: "Lucratividade" },
  { id: "desempenho", label: "Desempenho" },
  { id: "precos", label: "Preços" },
  { id: "perdas", label: "Perdas" },
];

export function buildInteligenciaOverview(
  registros: RegistrosPorAba,
  demoMode: boolean,
): ModuleOverviewSpec {
  const lucratividade = registros.lucratividade ?? [];
  const desempenho = registros.desempenho ?? [];
  const precos = registros.precos ?? [];
  const perdas = registros.perdas ?? [];

  const receita = soma(lucratividade, "receita");
  const custo = soma(lucratividade, "custo");
  const margem = receita - custo;
  const perdaValor = soma(perdas, "valor_estimado");
  // Preço acima do limite configurado é o alerta que o módulo existe para dar.
  const acimaDoLimite = precos.filter(
    (r) => num(r.payload.limite_alerta) > 0 && num(r.payload.preco) > num(r.payload.limite_alerta),
  ).length;

  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return {
    moduleId: "inteligencia",
    moduleLabel: "Inteligência",
    tabs: ABAS,
    demoMode,
    kpis: [
      { label: "Receita", value: brl(receita), icon: DollarSign, tabId: "lucratividade" },
      { label: "Custo", value: brl(custo), icon: DollarSign, tabId: "lucratividade" },
      {
        label: "Margem",
        value: brl(margem),
        icon: Percent,
        hint: receita ? `${Math.round((margem / receita) * 100)}% da receita` : undefined,
        trend: margem >= 0 ? "positiva" : "negativa",
        trendDir: margem >= 0 ? "up" : "down",
        tabId: "lucratividade",
      },
      { label: "Indicadores", value: desempenho.length, icon: TrendingUp, tabId: "desempenho" },
      {
        label: "Preços acima do limite",
        value: acimaDoLimite,
        icon: AlertTriangle,
        hint: "Comparado ao limite de alerta cadastrado",
        trendDir: acimaDoLimite ? "down" : "up",
        tabId: "precos",
      },
      {
        label: "Perdas estimadas",
        value: brl(perdaValor),
        icon: AlertTriangle,
        trendDir: perdaValor ? "down" : "up",
        tabId: "perdas",
      },
    ],
    charts: [
      {
        id: "lucratividade-cultura",
        tabId: "lucratividade",
        title: "Receita × custo por cultura",
        description: "Onde a margem é feita e onde é perdida",
        featured: true,
        kind: "bars",
        xKey: "label",
        format: "brl",
        series: [
          { key: "receita", name: "Receita", color: chartColors.success },
          { key: "custo", name: "Custo", color: chartColors.primary },
        ],
        data: [
          ...new Set(lucratividade.map((r) => (r.payload.cultura ?? "").trim() || "Sem cultura")),
        ].map((cultura) => {
          const doGrupo = lucratividade.filter(
            (r) => ((r.payload.cultura ?? "").trim() || "Sem cultura") === cultura,
          );
          return {
            label: cultura,
            receita: soma(doGrupo, "receita"),
            custo: soma(doGrupo, "custo"),
          };
        }),
      },
      barras({
        id: "perdas-causa",
        tabId: "perdas",
        title: "Perdas por causa",
        description: "O que mais custa em desperdício",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Valor perdido",
        limite: 8,
        data: somaPor(perdas, "causa", "valor_estimado"),
      }),
      barras({
        id: "desempenho-indicador",
        tabId: "desempenho",
        title: "Indicadores por período",
        nome: "Valor",
        limite: 10,
        data: somaPor(desempenho, "periodo", "valor"),
      }),
      barras({
        id: "precos-produto",
        tabId: "precos",
        title: "Preço médio por produto",
        nome: "Preço",
        format: "brl",
        layout: "vertical",
        limite: 8,
        data: [...new Set(precos.map((r) => (r.payload.produto ?? "").trim() || "Sem produto"))]
          .map((produto) => {
            const doGrupo = precos.filter(
              (r) => ((r.payload.produto ?? "").trim() || "Sem produto") === produto,
            );
            return {
              label: produto,
              valor: Math.round((soma(doGrupo, "preco") / doGrupo.length) * 100) / 100,
            };
          })
          .sort((a, b) => b.valor - a.valor),
      }),
      rosca({
        id: "perdas-produto",
        tabId: "perdas",
        title: "Perdas por produto",
        nome: "Volume perdido",
        data: contaPor(perdas, "produto"),
      }),
    ],
  };
}
