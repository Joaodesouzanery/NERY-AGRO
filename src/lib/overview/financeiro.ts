import { localToday } from "@/lib/date-local";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  FileText,
  Landmark,
  MapPinned,
  Percent,
  ShoppingCart,
  Sprout,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import { barras, contaPor, num, rosca, soma, somaPor } from "@/lib/overview/helpers";
import type { RegistrosPorAba } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Financeiro — 15 abas. A visão geral tinha 6 KPIs e UM gráfico de 4 barras.
// Aqui as 15 abas ganham leitura: caixa, aging de inadimplência, ruptura de
// compra, ROI por talhão e o orçamento autorizado × realizado.

const ABAS = [
  { id: "fluxo", label: "Fluxo de Caixa Simples" },
  { id: "custos", label: "Custos por Unidade" },
  { id: "inadimplencia", label: "Controle de Inadimplência" },
  { id: "estoque", label: "Gestão de Estoque de Produtos Acabados" },
  { id: "equilibrio", label: "Cálculo de Ponto de Equilíbrio" },
  { id: "compras", label: "Gestão de Compras" },
  { id: "credito", label: "Controle de Crédito Rural" },
  { id: "precos", label: "Tabela de Preços Dinâmica" },
  { id: "hectare", label: "Custo por Hectare" },
  { id: "safra", label: "Orçamento de Safra" },
  { id: "roi", label: "Rentabilidade Field-by-Field" },
  { id: "arrendamento", label: "Controle de Arrendamento" },
  { id: "contratos", label: "Gestão de Contratos" },
  { id: "autorizacao", label: "Autorizações de Verba" },
  { id: "cenario", label: "Cenários de Fluxo" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Dias entre hoje e a data de vencimento (positivo = vencido). */
function diasVencido(vencimento: string | undefined, hojeISO: string): number | null {
  const v = (vencimento ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  return Math.round((Date.parse(hojeISO) - Date.parse(v.slice(0, 10))) / 86_400_000);
}

/** Faixas de atraso — a leitura que dá o tamanho do rombo, não só o total. */
export function agingBuckets(
  registros: RegistrosPorAba["x"],
  hojeISO: string,
): Array<{ label: string; valor: number }> {
  const faixas = [
    { label: "A vencer", min: -Infinity, max: 0 },
    { label: "1–30 dias", min: 1, max: 30 },
    { label: "31–60 dias", min: 31, max: 60 },
    { label: "61–90 dias", min: 61, max: 90 },
    { label: "90+ dias", min: 91, max: Infinity },
  ];
  return faixas
    .map((f) => ({
      label: f.label,
      valor: registros.reduce((s, r) => {
        const d = diasVencido(r.payload.vencimento, hojeISO);
        if (d == null || d < f.min || d > f.max) return s;
        return s + num(r.payload.valor);
      }, 0),
    }))
    .filter((f) => f.valor > 0);
}

export function buildFinanceiroOverview(
  registros: RegistrosPorAba,
  demoMode: boolean,
  hojeISO = localToday(),
): ModuleOverviewSpec {
  const fluxo = registros.fluxo ?? [];
  const custos = registros.custos ?? [];
  const inadimplencia = registros.inadimplencia ?? [];
  const estoque = registros.estoque ?? [];
  const compras = registros.compras ?? [];
  const credito = registros.credito ?? [];
  const roi = registros.roi ?? [];
  const autorizacao = registros.autorizacao ?? [];
  const contratos = registros.contratos ?? [];

  const entradas = fluxo
    .filter((r) => /entrada/i.test(r.payload.tipo ?? ""))
    .reduce((s, r) => s + num(r.payload.valor), 0);
  const saidas = fluxo
    .filter((r) => /sa[ií]da/i.test(r.payload.tipo ?? ""))
    .reduce((s, r) => s + num(r.payload.valor), 0);
  const vencido = inadimplencia.reduce((s, r) => {
    const d = diasVencido(r.payload.vencimento, hojeISO);
    return d != null && d > 0 ? s + num(r.payload.valor) : s;
  }, 0);
  // Insumo abaixo do estoque mínimo é ruptura de compra iminente.
  const rupturas = compras.filter(
    (r) =>
      num(r.payload.estoque_minimo) > 0 &&
      num(r.payload.estoque_atual) < num(r.payload.estoque_minimo),
  ).length;
  const autorizado = soma(autorizacao, "valor_autorizado");
  const realizado = soma(autorizacao, "valor_realizado");
  const receitaRoi = soma(roi, "receita");
  const custoRoi = soma(roi, "custo");

  return {
    moduleId: "financeiro",
    moduleLabel: "Financeiro Agro",
    tabs: ABAS,
    demoMode,
    kpis: [
      {
        label: "Saldo de caixa",
        value: brl(entradas - saidas),
        icon: Wallet,
        hint: `${brl(entradas)} entradas · ${brl(saidas)} saídas`,
        trendDir: entradas >= saidas ? "up" : "down",
        tabId: "fluxo",
      },
      {
        label: "Vencido",
        value: brl(vencido),
        icon: AlertTriangle,
        trendDir: vencido ? "down" : "up",
        tabId: "inadimplencia",
      },
      {
        label: "Orçamento realizado",
        value: autorizado ? `${Math.round((realizado / autorizado) * 100)}%` : "—",
        icon: Percent,
        hint: `${brl(realizado)} de ${brl(autorizado)}`,
        trendDir: autorizado && realizado > autorizado ? "down" : "up",
        tabId: "autorizacao",
      },
      {
        label: "ROI da safra",
        value: custoRoi ? `${Math.round(((receitaRoi - custoRoi) / custoRoi) * 100)}%` : "—",
        icon: TrendingUp,
        hint: `${brl(receitaRoi - custoRoi)} de margem`,
        tabId: "roi",
      },
      {
        label: "Compras em ruptura",
        value: rupturas,
        icon: ShoppingCart,
        trendDir: rupturas ? "down" : "up",
        tabId: "compras",
      },
      {
        label: "Estoque pronto",
        value: soma(estoque, "saldo").toLocaleString("pt-BR"),
        icon: Boxes,
        tabId: "estoque",
      },
      {
        label: "Dívida rural",
        value: brl(soma(credito, "saldo_devedor")),
        icon: Landmark,
        tabId: "credito",
      },
      { label: "Contratos", value: contratos.length, icon: FileText, tabId: "contratos" },
      {
        label: "Custo/ha planejado",
        value: brl(soma(registros.hectare ?? [], "planejado")),
        icon: MapPinned,
        hint: `${brl(soma(registros.hectare ?? [], "real"))} realizado`,
        tabId: "hectare",
      },
      {
        label: "Orçamento de safra",
        value: brl(soma(registros.safra ?? [], "valor")),
        icon: Sprout,
        tabId: "safra",
      },
      {
        label: "Arrendamento",
        value: brl(soma(registros.arrendamento ?? [], "valor_ha")),
        icon: MapPinned,
        tabId: "arrendamento",
      },
      {
        label: "Cenários",
        value: (registros.cenario ?? []).length,
        icon: Banknote,
        tabId: "cenario",
      },
    ],
    charts: [
      {
        id: "fin-fluxo-categoria",
        tabId: "fluxo",
        title: "Entradas × saídas por categoria",
        description: "De onde vem e para onde vai o caixa",
        featured: true,
        kind: "bars",
        xKey: "label",
        format: "brl",
        series: [
          { key: "entradas", name: "Entradas", color: chartColors.success },
          { key: "saidas", name: "Saídas", color: chartColors.primary },
        ],
        data: [
          ...new Set(fluxo.map((r) => (r.payload.categoria ?? "").trim() || "Sem categoria")),
        ].map((cat) => {
          const doGrupo = fluxo.filter(
            (r) => ((r.payload.categoria ?? "").trim() || "Sem categoria") === cat,
          );
          return {
            label: cat,
            entradas: doGrupo
              .filter((r) => /entrada/i.test(r.payload.tipo ?? ""))
              .reduce((s, r) => s + num(r.payload.valor), 0),
            saidas: doGrupo
              .filter((r) => /sa[ií]da/i.test(r.payload.tipo ?? ""))
              .reduce((s, r) => s + num(r.payload.valor), 0),
          };
        }),
      },
      barras({
        id: "fin-aging",
        tabId: "inadimplencia",
        title: "Inadimplência por faixa de atraso",
        description: "O tamanho do rombo, não só o total",
        featured: true,
        format: "brl",
        nome: "Valor",
        data: agingBuckets(inadimplencia, hojeISO),
      }),
      {
        id: "fin-autorizacao",
        tabId: "autorizacao",
        title: "Orçado × realizado por centro de custo",
        description: "Quem está estourando a verba",
        featured: true,
        kind: "bars",
        xKey: "label",
        format: "brl",
        series: [
          { key: "autorizado", name: "Autorizado", color: chartColors.c1 },
          { key: "realizado", name: "Realizado", color: chartColors.primary },
        ],
        data: autorizacao.slice(0, 8).map((r) => ({
          label: r.payload.centro_custo || "Sem centro",
          autorizado: num(r.payload.valor_autorizado),
          realizado: num(r.payload.valor_realizado),
        })),
      },
      barras({
        id: "fin-roi-talhao",
        tabId: "roi",
        title: "Margem por talhão",
        layout: "vertical",
        format: "brl",
        nome: "Margem",
        limite: 8,
        data: roi
          .map((r) => ({
            label: r.payload.talhao || "Sem talhão",
            valor: num(r.payload.receita) - num(r.payload.custo),
          }))
          .sort((a, b) => b.valor - a.valor),
      }),
      barras({
        id: "fin-custo-unitario",
        tabId: "custos",
        title: "Custo unitário × preço de venda",
        layout: "vertical",
        format: "brl",
        nome: "Custo unitário",
        limite: 8,
        data: custos
          .map((r) => ({
            label: r.payload.produto || "Sem produto",
            valor: num(r.payload.quantidade)
              ? Math.round((num(r.payload.custo_total) / num(r.payload.quantidade)) * 100) / 100
              : 0,
          }))
          .filter((x) => x.valor > 0),
      }),
      barras({
        id: "fin-compras-gap",
        tabId: "compras",
        title: "Gap de estoque por insumo",
        description: "Mínimo − atual, onde falta",
        layout: "vertical",
        nome: "Faltando",
        limite: 8,
        data: compras
          .map((r) => ({
            label: r.payload.insumo || "Sem insumo",
            valor: Math.max(0, num(r.payload.estoque_minimo) - num(r.payload.estoque_atual)),
          }))
          .filter((x) => x.valor > 0)
          .sort((a, b) => b.valor - a.valor),
      }),
      barras({
        id: "fin-credito",
        tabId: "credito",
        title: "Saldo devedor por banco",
        layout: "vertical",
        format: "brl",
        nome: "Saldo",
        limite: 8,
        data: somaPor(credito, "banco", "saldo_devedor"),
      }),
      barras({
        id: "fin-estoque",
        tabId: "estoque",
        title: "Saldo por produto acabado",
        layout: "vertical",
        nome: "Saldo",
        limite: 8,
        data: somaPor(estoque, "produto", "saldo"),
      }),
      {
        id: "fin-precos",
        tabId: "precos",
        title: "Varejo × atacado",
        kind: "bars",
        xKey: "label",
        format: "brl",
        series: [
          { key: "varejo", name: "Varejo" },
          { key: "atacado", name: "Atacado" },
        ],
        data: (registros.precos ?? []).slice(0, 8).map((r) => ({
          label: r.payload.produto || "Sem produto",
          varejo: num(r.payload.varejo),
          atacado: num(r.payload.atacado),
        })),
      },
      {
        id: "fin-hectare",
        tabId: "hectare",
        title: "Custo por hectare: real × planejado",
        kind: "bars",
        xKey: "label",
        format: "brl",
        series: [
          { key: "planejado", name: "Planejado", color: chartColors.c1 },
          { key: "real", name: "Real", color: chartColors.primary },
        ],
        data: (registros.hectare ?? []).slice(0, 8).map((r) => ({
          label: r.payload.talhao || "Sem talhão",
          planejado: num(r.payload.planejado),
          real: num(r.payload.real),
        })),
      },
      barras({
        id: "fin-safra",
        tabId: "safra",
        title: "Orçamento de safra por etapa",
        layout: "vertical",
        format: "brl",
        nome: "Valor",
        limite: 8,
        data: somaPor(registros.safra ?? [], "etapa", "valor"),
      }),
      barras({
        id: "fin-equilibrio",
        tabId: "equilibrio",
        title: "Custo fixo por produto",
        layout: "vertical",
        format: "brl",
        nome: "Custo fixo",
        limite: 8,
        data: somaPor(registros.equilibrio ?? [], "produto", "custo_fixo"),
      }),
      barras({
        id: "fin-arrendamento",
        tabId: "arrendamento",
        title: "Arrendamento por contrato",
        layout: "vertical",
        format: "brl",
        nome: "Valor/ha",
        limite: 8,
        data: somaPor(registros.arrendamento ?? [], "contrato", "valor_ha"),
      }),
      rosca({
        id: "fin-contratos-tipo",
        tabId: "contratos",
        title: "Contratos por tipo",
        nome: "Contratos",
        data: contaPor(contratos, "tipo"),
      }),
      barras({
        id: "fin-cenario",
        tabId: "cenario",
        title: "Entradas projetadas por cenário",
        layout: "vertical",
        format: "brl",
        nome: "Entradas",
        limite: 6,
        data: somaPor(registros.cenario ?? [], "nome", "inflows"),
      }),
    ],
  };
}
