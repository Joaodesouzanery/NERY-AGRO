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
  slaBreaches,
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

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Recebe operation_records (não o payload solto) porque reusa as métricas de
// logística/remessa, que filtram por `module`.
export function buildLogisticaOverview(
  registros: Record<string, OperationRecord[]>,
  demoMode: boolean,
  tolerancias?: RemessaTolerancias,
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
  const hoje = new Date().toISOString().slice(0, 10);
  const sla = slaBreaches(todos, hoje);
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
        tabId: "remessa",
        title: "Colheita por variedade",
        nome: "Caixas",
        data: remessaByVariedade(todos).map((r) => ({ label: r.variedade, total: r.caixas })),
      }),
      {
        id: "caixas-saldo",
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
        tabId: "motoristas",
        title: "Entregas por motorista",
        layout: "vertical",
        nome: "Cargas",
        limite: 8,
        data: contaPor(cargas, "motorista").map((c) => ({ label: c.label, valor: c.total })),
      }),
      barras({
        id: "rotas-distancia",
        tabId: "rotas",
        title: "Distância por rota",
        layout: "vertical",
        nome: "km",
        limite: 8,
        data: somaPor(registros.rotas ?? [], "nome", "distancia"),
      }),
      rosca({
        id: "frota-status",
        tabId: "frota",
        title: "Frota por status",
        nome: "Veículos",
        data: contaPor(frota, "status"),
      }),
      barras({
        id: "bases-cidade",
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
        tabId: "roteirizacao",
        title: "Distância por rota urbana",
        layout: "vertical",
        nome: "km",
        limite: 8,
        data: somaPor(registros.roteirizacao ?? [], "rota", "distancia"),
      }),
      barras({
        id: "embalagens-saldo",
        tabId: "embalagens",
        title: "Saldo por embalagem",
        layout: "vertical",
        nome: "Saldo",
        limite: 8,
        data: somaPor(embalagens, "item", "saldo"),
      }),
      rosca({
        id: "cestas-plano",
        tabId: "cestas",
        title: "Assinaturas por plano",
        nome: "Assinaturas",
        data: contaPor(cestas, "plano"),
      }),
      rosca({
        id: "expedicao-status",
        tabId: "expedicao",
        title: "Checklist de expedição",
        nome: "Pedidos",
        data: contaPor(expedicao, "status"),
      }),
    ],
    tables: sla.length
      ? [
          {
            id: "sla-estourado",
            tabId: "cargas",
            title: "SLA estourado",
            description: "Cargas com ETA vencida e ainda não entregues",
            head: ["Código", "Cliente", "ETA", "Motivo"],
            body: sla.slice(0, 8).map((b) => [b.codigo, b.cliente, b.eta, b.motivo]),
          },
        ]
      : undefined,
  };
}
