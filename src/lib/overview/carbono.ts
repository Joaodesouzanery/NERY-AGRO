import { Award, Factory, Gauge, Leaf } from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import {
  buildCarbonMetrics,
  carbonByCategoria,
  carbonByEscopo,
} from "@/lib/carbon-emissions-metrics";
import type { OperationRecord } from "@/lib/supabase-operations";
import { barras, contaPor, rosca, soma, somaPor } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Emissão de Carbono. A visão geral não tinha NENHUM KPI de CO₂e — o único
// gráfico de emissão vivia escondido dentro da aba "carbono", enquanto o resumo
// do módulo mostrava só "quantos registros por aba". Todos os cálculos já
// existiam em carbon-emissions-metrics; faltava trazê-los para a frente.

const ABAS = [
  { id: "carbono", label: "Emissões" },
  { id: "certificacoes", label: "Certificações" },
  { id: "agroecologia", label: "Agroecologia" },
  { id: "residuos", label: "Resíduos" },
  { id: "apps", label: "APPs" },
];

export function buildCarbonoOverview(
  registros: Record<string, OperationRecord[]>,
  demoMode: boolean,
): ModuleOverviewSpec {
  const carbono = registros.carbono ?? [];
  const certificacoes = registros.certificacoes ?? [];
  const agroecologia = registros.agroecologia ?? [];
  const residuos = registros.residuos ?? [];
  const apps = registros.apps ?? [];

  const m = buildCarbonMetrics(carbono);
  // As libs devolvem kg; a leitura executiva é em tonelada.
  const emT = (kg: number) => Math.round((kg / 1000) * 10) / 10;
  const porEscopo = carbonByEscopo(carbono).map((e) => ({ label: e.label, total: emT(e.co2e) }));
  const porCategoria = carbonByCategoria(carbono).map((c) => ({
    label: c.label,
    valor: emT(c.co2e),
  }));
  const areaAgro = soma(agroecologia, "area");

  return {
    moduleId: "sustentabilidade",
    moduleLabel: "Emissão de Carbono",
    tabs: ABAS,
    demoMode,
    kpis: [
      {
        label: "Emissão total",
        value: `${m.totalT.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} tCO₂e`,
        icon: Factory,
        tabId: "carbono",
      },
      { label: "Escopo 1 (direto)", value: `${emT(m.scope1)} t`, icon: Gauge, tabId: "carbono" },
      { label: "Escopo 2 (energia)", value: `${emT(m.scope2)} t`, icon: Gauge, tabId: "carbono" },
      { label: "Escopo 3 (cadeia)", value: `${emT(m.scope3)} t`, icon: Gauge, tabId: "carbono" },
      {
        label: "Certificações",
        value: certificacoes.length,
        icon: Award,
        hint: "Auditorias e checklists ativos",
        tabId: "certificacoes",
      },
      {
        label: "Área agroecológica",
        value: areaAgro ? `${areaAgro.toLocaleString("pt-BR")} ha` : "—",
        icon: Leaf,
        tabId: "agroecologia",
      },
    ],
    charts: [
      rosca({
        id: "carbono-escopo",
        tabId: "carbono",
        title: "Emissões por escopo",
        description: "Direto (1), energia comprada (2) e cadeia (3)",
        featured: true,
        format: "co2e",
        nome: "tCO₂e",
        data: porEscopo,
      }),
      barras({
        id: "carbono-categoria",
        tabId: "carbono",
        title: "Emissões por categoria",
        description: "Onde a pegada é gerada",
        featured: true,
        layout: "vertical",
        format: "co2e",
        nome: "tCO₂e",
        limite: 10,
        data: porCategoria,
      }),
      rosca({
        id: "certificacoes-status",
        tabId: "certificacoes",
        title: "Certificações por status",
        nome: "Certificações",
        data: contaPor(certificacoes, "status"),
      }),
      barras({
        id: "agroecologia-praticas",
        tabId: "agroecologia",
        title: "Área por prática agroecológica",
        nome: "Hectares",
        layout: "vertical",
        limite: 8,
        data: somaPor(agroecologia, "pratica", "area"),
      }),
      barras({
        id: "residuos-volume",
        tabId: "residuos",
        title: "Volume por tipo de resíduo",
        nome: "Volume",
        layout: "vertical",
        limite: 8,
        data: somaPor(residuos, "residuo", "volume"),
      }),
      rosca({
        id: "apps-ocorrencias",
        tabId: "apps",
        title: "Ocorrências em APPs",
        description: "Áreas de preservação monitoradas",
        nome: "Ocorrências",
        colors: [chartColors.warning, chartColors.destructive, chartColors.success],
        data: contaPor(apps, "ocorrencia"),
      }),
    ],
    tables: m.totalT
      ? [
          {
            id: "carbono-intensidade",
            tabId: "carbono",
            title: "Maiores fontes de emissão",
            description: "Categorias que mais pesam na pegada",
            head: ["Categoria", "tCO₂e", "% do total"],
            body: porCategoria
              .slice(0, 6)
              .map((c) => [
                c.label,
                c.valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
                `${Math.round((c.valor / m.totalT) * 100)}%`,
              ]),
          },
        ]
      : undefined,
  };
}
