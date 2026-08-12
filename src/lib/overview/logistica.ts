import {
  AlertTriangle,
  Boxes,
  Building2,
  Gauge,
  Package,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import {
  buildLogisticaMetrics,
  cargaStatusBreakdown,
  freightByRoute,
  slaCargas,
  slaPendentes,
  slaResumo,
  SLA_CARGA_PADRAO,
  type SlaConfig,
} from "@/lib/logistica-metrics";
import {
  buildRemessaMetrics,
  caixasVaziasSaldo,
  remessaByFazenda,
  remessaByVariedade,
} from "@/lib/remessa-metrics";
import type { RemessaTolerancias } from "@/lib/app-settings";
import type { OperationRecord } from "@/lib/supabase-operations";
import { barras, contaPor, num, rosca, soma, somaPor } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Logística — 12 abas. A visão geral cobria 3 (KPIs de carga, custo por rota e
// SLA); os outros 9 mini-dashboards só existiam dentro das próprias abas. E ela
// lia do snapshot da Torre enquanto as abas liam de outra consulta, então em
// DEMO os números não fechavam entre a visão geral e as abas.

const ABAS = [
  { id: "remessa", label: "Remessa/Recebimento" },
  { id: "caixas-vazias", label: "Caixas vazias" },
  { id: "cargas", label: "Cargas" },
  { id: "fretes", label: "Gestão de Fretes e Custo de Transporte" },
  { id: "motoristas", label: "Motoristas" },
  { id: "rotas", label: "Rotas" },
  { id: "frota", label: "Frota" },
  { id: "bases", label: "Bases e Filiais" },
  { id: "roteirizacao", label: "Roteirização de Entregas na Cidade" },
  { id: "embalagens", label: "Controle de Embalagens e Estoque" },
  { id: "cestas", label: "Sistema de Cestas/Assinaturas (CSA)" },
  { id: "expedicao", label: "Checklist de Expedição Pré-carga" },
];

/** Prazo em pt-BR curto: "12/08 18:00". A tabela não tem largura para o ISO. */
const prazoBr = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Recebe operation_records (não o payload solto) porque reusa as métricas de
// logística/remessa, que filtram por `module`.
export function buildLogisticaOverview(
  registros: Record<string, OperationRecord[]>,
  demoMode: boolean,
  tolerancias?: RemessaTolerancias,
  // Injetados para a função seguir pura: quem chama decide "agora".
  slaConfig: SlaConfig = SLA_CARGA_PADRAO,
  agoraISO: string = new Date().toISOString(),
): ModuleOverviewSpec {
  const todos = ABAS.flatMap((a) => registros[a.id] ?? []);
  const cargas = registros.cargas ?? [];
  const fretes = registros.fretes ?? [];
  const frota = registros.frota ?? [];
  const embalagens = registros.embalagens ?? [];
  const cestas = registros.cestas ?? [];
  const expedicao = registros.expedicao ?? [];

  const m = buildLogisticaMetrics(todos);
  const rem = buildRemessaMetrics(todos, tolerancias);
  const sla = slaCargas(todos, agoraISO, slaConfig);
  const resumo = slaResumo(sla);
  const pendentes = slaPendentes(sla);
  const custoFrete = soma(fretes, "custo");
  const km = soma(fretes, "km");
  const saldoCaixas = caixasVaziasSaldo(todos);
  const saldoTotal = saldoCaixas.reduce((s, x) => s + x.saldo, 0);
  // Embalagem abaixo do mínimo é ruptura iminente — o KPI que a aba já sabia
  // calcular mas que não subia para a visão geral.
  const abaixoDoMinimo = embalagens.filter(
    (r) => num(r.payload.minimo) > 0 && num(r.payload.saldo) < num(r.payload.minimo),
  ).length;
  const aprovacaoExpedicao = expedicao.length
    ? Math.round(
        (expedicao.filter((r) => /aprovad|ok|conclu/i.test(r.payload.status ?? "")).length /
          expedicao.length) *
          100,
      )
    : 0;

  return {
    moduleId: "logistica",
    moduleLabel: "Logística e Distribuição",
    tabs: ABAS,
    // Ordem dos grupos da grade. Eram 10 gráficos em grade única: dez títulos
    // soltos que a pessoa lia um a um para achar o que queria.
    grupos: ["Transporte", "Colheita e caixas", "Cadastros", "Operação urbana"],
    demoMode,
    kpis: [
      { label: "Cargas", value: m.totalCargas, icon: Truck, tabId: "cargas" },
      {
        // Sem carga entregue nem atrasada não há OTIF: mostrava "0%" com seta
        // vermelha, afirmando desempenho ruim onde não houve medição nenhuma.
        label: "OTIF",
        value: m.otif === null ? "—" : `${m.otif}%`,
        icon: Gauge,
        hint: m.otif === null ? "Sem carga entregue ou atrasada" : "Entregues no prazo",
        trendDir: m.otif === null ? undefined : m.otif >= 90 ? "up" : "down",
        tabId: "cargas",
      },
      {
        label: "Caixas colhidas",
        value: rem.caixasTotal.toLocaleString("pt-BR"),
        icon: Boxes,
        hint: `${rem.pesoLiquidoTotal.toLocaleString("pt-BR")} kg líquidos`,
        tabId: "remessa",
      },
      {
        label: "Com divergência",
        value: rem.comDivergencia,
        icon: AlertTriangle,
        hint: "Peso ou caixas não fecham entre saída e destino",
        trendDir: rem.comDivergencia ? "down" : "up",
        tabId: "remessa",
      },
      {
        label: "Caixas no campo",
        value: saldoTotal.toLocaleString("pt-BR"),
        icon: Boxes,
        hint: "Enviadas − retornadas",
        tabId: "caixas-vazias",
      },
      {
        label: "Custo de frete",
        value: brl(custoFrete),
        icon: Wallet,
        hint: km ? `${brl(custoFrete / km)}/km` : "Informe o km nos fretes",
        tabId: "fretes",
      },
      {
        label: "Motoristas",
        value: (registros.motoristas ?? []).length,
        icon: Users,
        tabId: "motoristas",
      },
      {
        label: "Frota disponível",
        value: frota.filter((r) => /dispon/i.test(r.payload.status ?? "")).length,
        icon: Truck,
        hint: `${frota.length} veículos cadastrados`,
        tabId: "frota",
      },
      { label: "Bases", value: (registros.bases ?? []).length, icon: Building2, tabId: "bases" },
      {
        label: "Embalagens abaixo do mínimo",
        value: abaixoDoMinimo,
        icon: Package,
        trendDir: abaixoDoMinimo ? "down" : "up",
        tabId: "embalagens",
      },
      {
        label: "Assinaturas ativas",
        value: cestas.filter((r) => !/pausa|cancel/i.test(r.payload.status ?? "")).length,
        icon: Package,
        tabId: "cestas",
      },
      {
        label: "Expedição aprovada",
        value: expedicao.length ? `${aprovacaoExpedicao}%` : "—",
        icon: Gauge,
        trendDir: aprovacaoExpedicao >= 90 ? "up" : "down",
        tabId: "expedicao",
      },
    ],
    charts: [
      rosca({
        id: "cargas-status",
        tabId: "cargas",
        title: "Cargas por status",
        description: "Em trânsito, entregues e atrasadas",
        featured: true,
        nome: "Cargas",
        colors: [
          chartColors.success,
          chartColors.primary,
          chartColors.warning,
          chartColors.destructive,
        ],
        data: cargaStatusBreakdown(todos).map((s) => ({ label: s.status, total: s.valor })),
      }),
      barras({
        id: "frete-rota",
        tabId: "fretes",
        title: "Custo de frete por rota",
        description: "Onde o transporte pesa mais",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Custo",
        limite: 8,
        data: freightByRoute(todos).map((f) => ({ label: f.rota, valor: f.custo })),
      }),
      barras({
        id: "remessa-fazenda",
        tabId: "remessa",
        title: "Caixas colhidas por fazenda",
        featured: true,
        layout: "vertical",
        nome: "Caixas",
        limite: 8,
        data: remessaByFazenda(todos).map((r) => ({ label: r.fazenda, valor: r.caixas })),
      }),
      rosca({
        id: "remessa-variedade",
        grupo: "Colheita e caixas",
        tabId: "remessa",
        title: "Colheita por variedade",
        nome: "Caixas",
        data: remessaByVariedade(todos).map((r) => ({ label: r.variedade, total: r.caixas })),
      }),
      {
        id: "caixas-saldo",
        grupo: "Colheita e caixas",
        tabId: "caixas-vazias",
        title: "Caixas enviadas × retornadas",
        description: "Saldo por fazenda",
        kind: "bars",
        xKey: "label",
        series: [
          { key: "enviadas", name: "Enviadas", color: chartColors.primary },
          { key: "retornadas", name: "Retornadas", color: chartColors.success },
        ],
        data: saldoCaixas
          .slice(0, 8)
          .map((s) => ({ label: s.fazenda, enviadas: s.enviadas, retornadas: s.retornadas })),
      },
      barras({
        id: "motoristas-entregas",
        grupo: "Transporte",
        tabId: "motoristas",
        title: "Entregas por motorista",
        layout: "vertical",
        nome: "Cargas",
        limite: 8,
        data: contaPor(cargas, "motorista").map((c) => ({ label: c.label, valor: c.total })),
      }),
      barras({
        id: "rotas-distancia",
        grupo: "Transporte",
        tabId: "rotas",
        title: "Distância por rota",
        layout: "vertical",
        nome: "km",
        limite: 8,
        data: somaPor(registros.rotas ?? [], "nome", "distancia"),
      }),
      rosca({
        id: "frota-status",
        grupo: "Cadastros",
        tabId: "frota",
        title: "Frota por status",
        nome: "Veículos",
        data: contaPor(frota, "status"),
      }),
      barras({
        id: "bases-cidade",
        grupo: "Cadastros",
        tabId: "bases",
        title: "Bases por cidade",
        nome: "Bases",
        limite: 8,
        data: contaPor(registros.bases ?? [], "cidade").map((c) => ({
          label: c.label,
          valor: c.total,
        })),
      }),
      barras({
        id: "roteirizacao-distancia",
        grupo: "Operação urbana",
        tabId: "roteirizacao",
        title: "Distância por rota urbana",
        layout: "vertical",
        nome: "km",
        limite: 8,
        data: somaPor(registros.roteirizacao ?? [], "rota", "distancia"),
      }),
      barras({
        id: "embalagens-saldo",
        grupo: "Colheita e caixas",
        tabId: "embalagens",
        title: "Saldo por embalagem",
        layout: "vertical",
        nome: "Saldo",
        limite: 8,
        data: somaPor(embalagens, "item", "saldo"),
      }),
      rosca({
        id: "cestas-plano",
        grupo: "Operação urbana",
        tabId: "cestas",
        title: "Assinaturas por plano",
        nome: "Assinaturas",
        data: contaPor(cestas, "plano"),
      }),
      rosca({
        id: "expedicao-status",
        grupo: "Transporte",
        tabId: "expedicao",
        title: "Checklist de expedição",
        nome: "Pedidos",
        data: contaPor(expedicao, "status"),
      }),
    ],
    tables: [
      {
        id: "sla-cargas",
        tabId: "cargas",
        title: "SLA das cargas",
        // Some quando está tudo em dia era o comportamento antigo — e sumiço
        // parece defeito. "Nenhuma carga fora do prazo" é informação boa.
        description: `${resumo.estourado} fora do prazo · ${resumo.emRisco} em risco · ${resumo.ok} no prazo${
          resumo.tratadas ? ` · ${resumo.tratadas} tratada(s)` : ""
        }`,
        head: ["Código", "Cliente", "Prazo", "Situação"],
        body: pendentes
          .slice(0, 8)
          .map((b) => [b.codigo, b.cliente, prazoBr(b.prazoISO), b.motivo]),
        rowIds: pendentes.slice(0, 8).map((b) => b.id),
        emptyTitle: "Nenhuma carga fora do prazo",
        emptyDescription: "Cargas com ETA ou prazo de rota vencendo aparecem aqui.",
      },
    ],
  };
}
