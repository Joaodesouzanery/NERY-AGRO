import {
  AlertTriangle,
  Bug,
  CloudRain,
  Droplets,
  Layers,
  MapPinned,
  Sprout,
  Tractor,
  Wallet,
} from "lucide-react";
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

// Campo — 18 abas. A visão geral tinha 4 KPIs e um gráfico que contava
// registros por aba; os 18 mini-dashboards viviam cada um dentro da sua aba.

const ABAS = [
  { id: "areas", label: "Áreas e Talhões" },
  { id: "insumos", label: "Registro de Insumos" },
  { id: "pragas", label: "Manejo de Pragas e Doenças" },
  { id: "lotes", label: "Rastreabilidade de Lotes" },
  { id: "solo", label: "Gestão de Solo" },
  { id: "analise-solo", label: "Análise de Solo Integrada" },
  { id: "irrigacao", label: "Controle de Irrigação" },
  { id: "meteorologia", label: "Previsão Meteorológica" },
  { id: "maquinario", label: "Gestão de Maquinário" },
  { id: "estimativa", label: "Estimativa de Safra" },
  { id: "pre-colheita", label: "Estimativa Pré-Colheita" },
  { id: "planejamento", label: "Planejamento de Plantio" },
  { id: "prescricao", label: "Mapa de Prescrição" },
  { id: "modelo", label: "Modelo de Cultura" },
  { id: "nitrogenio", label: "Gestão de Nitrogênio" },
  { id: "scouting", label: "Scouting de Campo" },
  { id: "diario", label: "Diário de Campo" },
  { id: "calendario", label: "Calendário de Plantio/Colheita" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function buildCampoOverview(
  registros: RegistrosPorAba,
  demoMode: boolean,
): ModuleOverviewSpec {
  const areas = registros.areas ?? [];
  const insumos = registros.insumos ?? [];
  const pragas = registros.pragas ?? [];
  const solo = registros.solo ?? [];
  const irrigacao = registros.irrigacao ?? [];
  const maquinario = registros.maquinario ?? [];
  const scouting = registros.scouting ?? [];
  const meteorologia = registros.meteorologia ?? [];

  const areaTotal = soma(areas, "area_ha");
  const custoInsumos = soma(insumos, "custo_hectare");
  const consumoAgua = soma(irrigacao, "consumo_m3");
  const custoMaquinario = soma(maquinario, "custo_operacional");
  // Praga severa e scouting em aberto são o que exige ida a campo hoje.
  const pragasSeveras = pragas.filter((r) =>
    /alta|sever|crítico|critico/i.test(r.payload.severidade ?? ""),
  ).length;
  const scoutingAberto = scouting.filter(
    (r) => !/conclu|resolv/i.test(r.payload.status ?? ""),
  ).length;
  const phMedio = solo.length
    ? Math.round((soma(solo, "ph") / solo.filter((r) => num(r.payload.ph) > 0).length) * 10) / 10
    : 0;

  return {
    moduleId: "campo",
    moduleLabel: "Campo",
    tabs: ABAS,
    demoMode,
    kpis: [
      {
        label: "Área total",
        value: areaTotal ? `${areaTotal.toLocaleString("pt-BR")} ha` : "—",
        icon: MapPinned,
        hint: `${areas.length} talhões`,
        tabId: "areas",
      },
      { label: "Custo de insumos", value: brl(custoInsumos), icon: Wallet, tabId: "insumos" },
      {
        label: "Pragas severas",
        value: pragasSeveras,
        icon: Bug,
        trendDir: pragasSeveras ? "down" : "up",
        tabId: "pragas",
      },
      {
        label: "Scouting em aberto",
        value: scoutingAberto,
        icon: AlertTriangle,
        trendDir: scoutingAberto ? "down" : "up",
        tabId: "scouting",
      },
      {
        label: "Consumo de água",
        value: consumoAgua ? `${consumoAgua.toLocaleString("pt-BR")} m³` : "—",
        icon: Droplets,
        tabId: "irrigacao",
      },
      { label: "pH médio do solo", value: phMedio || "—", icon: Layers, tabId: "solo" },
      {
        label: "Custo de maquinário",
        value: brl(custoMaquinario),
        icon: Tractor,
        tabId: "maquinario",
      },
      {
        label: "Lotes rastreados",
        value: (registros.lotes ?? []).length,
        icon: Layers,
        tabId: "lotes",
      },
      {
        label: "Alertas de clima",
        value: meteorologia.filter((r) => (r.payload.alerta ?? "").trim()).length,
        icon: CloudRain,
        tabId: "meteorologia",
      },
      {
        label: "Talhões planejados",
        value: (registros.planejamento ?? []).length,
        icon: Sprout,
        tabId: "planejamento",
      },
      {
        label: "Laudos de solo",
        value: (registros["analise-solo"] ?? []).length,
        icon: Layers,
        tabId: "analise-solo",
      },
      {
        label: "Apontamentos do diário",
        value: (registros.diario ?? []).length,
        icon: Sprout,
        tabId: "diario",
      },
    ],
    charts: [
      barras({
        id: "campo-area-talhao",
        tabId: "areas",
        title: "Área por talhão",
        description: "Distribuição do hectare plantado",
        featured: true,
        layout: "vertical",
        nome: "Hectares",
        limite: 10,
        data: somaPor(areas, "talhao", "area_ha"),
      }),
      barras({
        id: "campo-insumo-talhao",
        tabId: "insumos",
        title: "Custo de insumo por talhão",
        description: "Onde o custo por hectare pesa mais",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Custo/ha",
        limite: 10,
        data: somaPor(insumos, "talhao", "custo_hectare"),
      }),
      rosca({
        id: "campo-cultura",
        tabId: "areas",
        title: "Área por cultura",
        featured: true,
        nome: "Talhões",
        data: contaPor(areas, "cultura"),
      }),
      rosca({
        id: "campo-pragas-severidade",
        tabId: "pragas",
        title: "Pragas por severidade",
        nome: "Ocorrências",
        colors: [chartColors.destructive, chartColors.warning, chartColors.success],
        data: contaPor(pragas, "severidade"),
      }),
      barras({
        id: "campo-pragas-talhao",
        tabId: "pragas",
        title: "Focos por talhão",
        layout: "vertical",
        nome: "Ocorrências",
        limite: 8,
        data: contaPor(pragas, "talhao").map((c) => ({ label: c.label, valor: c.total })),
      }),
      barras({
        id: "campo-solo-ph",
        tabId: "solo",
        title: "pH por talhão",
        layout: "vertical",
        nome: "pH",
        limite: 8,
        data: somaPor(solo, "talhao", "ph"),
      }),
      barras({
        id: "campo-irrigacao",
        tabId: "irrigacao",
        title: "Consumo de água por talhão",
        layout: "vertical",
        nome: "m³",
        limite: 8,
        data: somaPor(irrigacao, "talhao", "consumo_m3"),
      }),
      barras({
        id: "campo-maquinario",
        tabId: "maquinario",
        title: "Custo operacional por máquina",
        layout: "vertical",
        format: "brl",
        nome: "Custo",
        limite: 8,
        data: somaPor(maquinario, "maquina", "custo_operacional"),
      }),
      barras({
        id: "campo-estimativa",
        tabId: "estimativa",
        title: "Produtividade estimada por talhão",
        layout: "vertical",
        nome: "Produtividade",
        limite: 8,
        data: somaPor(registros.estimativa ?? [], "talhao", "produtividade"),
      }),
      barras({
        id: "campo-nitrogenio",
        tabId: "nitrogenio",
        title: "Dose de nitrogênio por talhão",
        layout: "vertical",
        nome: "Dose",
        limite: 8,
        data: somaPor(registros.nitrogenio ?? [], "talhao", "dose"),
      }),
      rosca({
        id: "campo-lotes-conformidade",
        tabId: "lotes",
        title: "Lotes por conformidade",
        nome: "Lotes",
        data: contaPor(registros.lotes ?? [], "conformidade"),
      }),
      rosca({
        id: "campo-scouting-status",
        tabId: "scouting",
        title: "Scouting por status",
        nome: "Alertas",
        data: contaPor(scouting, "status"),
      }),
      rosca({
        id: "campo-meteorologia-risco",
        tabId: "meteorologia",
        title: "Risco climático por local",
        nome: "Previsões",
        data: contaPor(meteorologia, "risco"),
      }),
      barras({
        id: "campo-planejamento",
        tabId: "planejamento",
        title: "Meta de produtividade por talhão",
        layout: "vertical",
        nome: "Meta",
        limite: 8,
        data: somaPor(registros.planejamento ?? [], "talhao", "meta_produtividade"),
      }),
      rosca({
        id: "campo-prescricao",
        tabId: "prescricao",
        title: "Prescrições por zona",
        nome: "Zonas",
        data: contaPor(registros.prescricao ?? [], "zona"),
      }),
      rosca({
        id: "campo-modelo",
        tabId: "modelo",
        title: "Estágio das culturas",
        nome: "Registros",
        data: contaPor(registros.modelo ?? [], "estagio"),
      }),
      barras({
        id: "campo-pre-colheita",
        tabId: "pre-colheita",
        title: "Projeção pré-colheita por talhão",
        layout: "vertical",
        nome: "Projeção",
        limite: 8,
        data: somaPor(registros["pre-colheita"] ?? [], "talhao", "projecao"),
      }),
      barras({
        id: "campo-analise-solo",
        tabId: "analise-solo",
        title: "Laudos por talhão",
        layout: "vertical",
        nome: "Laudos",
        limite: 8,
        data: contaPor(registros["analise-solo"] ?? [], "talhao").map((c) => ({
          label: c.label,
          valor: c.total,
        })),
      }),
      barras({
        id: "campo-diario",
        tabId: "diario",
        title: "Apontamentos por talhão",
        layout: "vertical",
        nome: "Apontamentos",
        limite: 8,
        data: contaPor(registros.diario ?? [], "talhao").map((c) => ({
          label: c.label,
          valor: c.total,
        })),
      }),
      rosca({
        id: "campo-calendario",
        tabId: "calendario",
        title: "Janelas por cultura",
        nome: "Janelas",
        data: contaPor(registros.calendario ?? [], "cultura"),
      }),
    ],
  };
}
