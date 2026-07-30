import type { ReactNode } from "react";
import type { ChartDatum, SeriesSpec, ValueFormat } from "@/lib/chart-theme";
import type { RichKpi } from "@/components/rich-tab";

// Contrato único da "visão geral" de um módulo. É DADO PURO — montado por
// funções em src/lib/overview/*.ts, sem React — e alimenta duas coisas ao mesmo
// tempo: a tela (ModuleOverview) e o export (buildModuleWorkbook). Por isso
// "exportar tudo" é consequência, não trabalho duplicado.
//
// Cada KPI/gráfico/tabela carrega o `tabId` da aba que ele cobre; é o que
// permite provar por teste que a visão geral cobre TODAS as abas do módulo.

export type OverviewKpi = RichKpi & { tabId?: string };

export type OverviewChartKind = "bars" | "trend" | "donut" | "barlist";

export type OverviewChart = {
  id: string;
  /** Aba do módulo que este gráfico cobre. */
  tabId: string;
  title: string;
  description?: string;
  /** Zona executiva (maior, no topo). Sem isto vai para a grade compacta. */
  featured?: boolean;
  kind: OverviewChartKind;
  data: ChartDatum[];
  xKey: string;
  series: SeriesSpec[];
  format?: ValueFormat;
  /** "vertical" = barras deitadas (nomes longos). */
  layout?: "horizontal" | "vertical";
  area?: boolean;
  /** Cores por fatia quando o dado é semáforo (status/severidade). */
  colors?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export type OverviewTable = {
  id: string;
  tabId: string;
  title: string;
  description?: string;
  head: string[];
  body: Array<Array<string | number>>;
};

export type ModuleOverviewSpec = {
  moduleId: string;
  moduleLabel: string;
  /** TODAS as abas do módulo — a base da checagem de cobertura. */
  tabs: Array<{ id: string; label: string }>;
  kpis: OverviewKpi[];
  charts: OverviewChart[];
  tables?: OverviewTable[];
  /** Mapa ou destaque visual no topo (Torre, Campo, Logística). */
  hero?: ReactNode;
  demoMode: boolean;
  /** Rótulo do período aplicado, carimbado no export. */
  periodLabel?: string;
};
