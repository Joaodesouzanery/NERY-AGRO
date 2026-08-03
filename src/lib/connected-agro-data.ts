import { useEffect } from "react";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { MapPoint, MapRoute } from "@/components/carto-map";
import { type FinancialRecord, listAllFinancialRecords } from "@/lib/supabase-financial";
import { type FieldRecord, listAllFieldRecords } from "@/lib/supabase-field";
import { type OperationRecord, listOperationRecordsByArea } from "@/lib/supabase-operations";
import {
  buildRemessaMetrics,
  caixasVaziasSaldo,
  remessaAtrasos,
  remessaDivergencias,
  remessaGeoPorFazenda,
} from "@/lib/remessa-metrics";
import {
  buildCarbonMetrics,
  carbonCostBRL,
  CARBON_PRICE_BRL_PER_T,
  type CarbonMetrics,
} from "@/lib/carbon-emissions-metrics";
import { type CostCenter, listCostCenters } from "@/lib/supabase-cost-centers";
import { type Contract, listContracts } from "@/lib/supabase-contracts";
import { type AppSettings, EMPTY_SETTINGS, loadAppSettings } from "@/lib/app-settings";
import {
  buildFieldMargin,
  contractsExpiringSoon,
  costCenterVariances,
  rollupByStage,
  type CenterVariance,
  type FieldMargin,
  type StageRollup,
} from "@/lib/cost-center-metrics";
import { listAnimais } from "@/features/pecuaria/api/pecuaria-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { demoSnapshot } from "@/lib/demo/connected-agro";

export type ConnectedAgroSnapshot = {
  financial: FinancialRecord[];
  operations: OperationRecord[];
  field: FieldRecord[];
  /**
   * Cabeças ativas em pec_animal (Pecuária v2). Vive fora de `operations`
   * porque a pecuária deixou de gravar em operation_records na virada — contar
   * o legado ali congelaria o número.
   */
  pecuariaCabecas: number;
  /** Financeiro V2 normalizado: dimensão de orçamento e contratos (drill-down do COGS). */
  costCenters: CostCenter[];
  contracts: Contract[];
  /** Configurações editáveis da empresa (preço do carbono, coords das fazendas). */
  settings: AppSettings;
};

export type ControlAlert = {
  id: string;
  title: string;
  source: string;
  severity: "info" | "warning" | "danger";
  description: string;
};

export type ControlTowerModel = {
  // `null` = não há base de cálculo (sem carga fechada, sem frota cadastrada).
  // A tela mostra "—" com a razão; um número inventado aqui seria lido como
  // desempenho medido.
  metrics: {
    otif: number | null;
    vendas: number;
    capacidade: number | null;
    alertas: number;
    cargas: number;
    nosRede: number;
  };
  mapMetrics: {
    emTransito: number;
    entregues: number;
    atrasadas: number;
    totalCargas: number;
    totalRotas: number;
    bases: number;
    ocorrencias: number;
  };
  moduleCards: Array<{ label: string; value: string; detail: string; tone: string }>;
  alerts: ControlAlert[];
  points: MapPoint[];
  routes: MapRoute[];
  shipments: Array<Record<string, string>>;
};

export type CogsStage = {
  key: string;
  label: string;
  value: number;
  source: string;
};

export type CogsModel = {
  stages: CogsStage[];
  total: number;
  revenue: number;
  margin: number;
  alerts: ControlAlert[];
  reports: Array<Record<string, string | number>>;
  scenarios: Array<Record<string, string | number>>;
  /** Rollup dos centros de custo por etapa (drill-down etapa → centro → talhão). */
  centerRollup: StageRollup[];
  /** Variância orçado×realizado por centro (maior estouro primeiro). */
  variances: CenterVariance[];
};

export type UnifiedMapModel = {
  points: MapPoint[];
  routes: MapRoute[];
  kpis: Array<{ label: string; value: string | number; tone?: MapPoint["tone"] }>;
  alerts: ControlAlert[];
  moduleCounts: Array<{
    id: string;
    label: string;
    value: number;
    href: string;
    tone: MapPoint["tone"];
  }>;
  lastUpdatedAt?: number;
};

const operationAreas = [
  "logistica",
  "pecuaria",
  "sustentabilidade",
  "inteligencia",
  "cogs",
  "equipe-vendas",
];

// Catálogo dos módulos: id, rótulo, rota e tom. NÃO tem coordenada — cada
// entrada tinha uma lat/lng fixa (SP, Brasília, Campinas, BH, Manaus, Rio,
// Curitiba, Campo Grande) e o mapa em REAL nascia com oito pinos espalhados
// pelo Brasil, em cidades onde a empresa não tem nada; o fit inicial ainda
// enquadrava neles. Contagem por módulo continua (moduleCounts), no painel
// lateral, que é onde ela sempre pertenceu.
const unifiedModules = [
  { id: "logistica", label: "Logística", href: "/logistica", tone: "primary" as const },
  { id: "financeiro", label: "Financeiro", href: "/financeiro", tone: "success" as const },
  { id: "campo", label: "Campo", href: "/campo", tone: "success" as const },
  { id: "pecuaria", label: "Pecuária", href: "/pecuaria", tone: "info" as const },
  {
    id: "sustentabilidade",
    label: "Emissão de Carbono",
    href: "/sustentabilidade",
    tone: "success" as const,
  },
  { id: "inteligencia", label: "Inteligência", href: "/inteligencia", tone: "info" as const },
  { id: "cogs", label: "Otimização COGS", href: "/otimizacao-cogs", tone: "warning" as const },
  {
    id: "equipe-vendas",
    label: "Equipe & Vendas",
    href: "/equipe-vendas",
    tone: "primary" as const,
  },
];

export function num(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalized(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isExpense(value: unknown) {
  const type = normalized(value);
  return type.includes("saida") || type.includes("custo") || type.includes("despesa");
}

function statusSeverity(status: unknown): ControlAlert["severity"] {
  const value = normalized(status);
  if (["atras", "critico", "alta", "vencido"].some((term) => value.includes(term))) {
    return "danger";
  }
  if (
    ["alerta", "atencao", "pendente", "revisar", "reforco"].some((term) => value.includes(term))
  ) {
    return "warning";
  }
  return "info";
}

function latLngFrom(payload: Record<string, string>, latKey = "lat", lngKey = "lng") {
  const lat = num(payload[latKey]);
  const lng = num(payload[lngKey]);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
    ? { lat, lng }
    : undefined;
}

function gpsFrom(value: unknown) {
  const [lat, lng] = String(value ?? "")
    .split(",")
    .map((part) => num(part.trim()));
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
    ? { lat, lng }
    : undefined;
}

export async function loadConnectedAgroSnapshot(): Promise<ConnectedAgroSnapshot> {
  const [financial, field, operationGroups, animais, costCenters, contracts, settings] =
    await Promise.all([
      listAllFinancialRecords(),
      listAllFieldRecords(),
      Promise.all(operationAreas.map((area) => listOperationRecordsByArea(area))),
      // `false` explícito: este snapshot só roda em REAL (`enabled: !demoMode`
      // em useConnectedAgroData); em DEMO a Torre serve o demoSnapshot inteiro.
      // Robustez: falha em pec_animal não pode derrubar toda a Torre (fail-closed
      // para vazio, como as demais tabelas opcionais abaixo).
      listAnimais(false).catch(() => [] as Awaited<ReturnType<typeof listAnimais>>),
      // V2 opcional: um tropeço numa dessas tabelas não pode derrubar toda a Torre.
      listCostCenters().catch(() => [] as CostCenter[]),
      listContracts().catch(() => [] as Contract[]),
      loadAppSettings().catch(() => EMPTY_SETTINGS),
    ]);
  return {
    financial,
    field,
    operations: operationGroups.flat(),
    pecuariaCabecas: animais.filter((a) => a.status === "ativo").length,
    costCenters,
    contracts,
    settings,
  };
}

export function useConnectedAgroData() {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["connected-agro-snapshot"],
    queryFn: loadConnectedAgroSnapshot,
    enabled: !demoMode && isSupabaseConfigured,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    // Não assina realtime em modo demo nem quando o Supabase não está configurado
    // (acessar `supabase` sem env vars degrada para um client placeholder; subscrever
    // só geraria ruído de rede). try/catch é defensivo para nunca crashar a página.
    if (demoMode || !isSupabaseConfigured) return;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    try {
      channel = supabase
        .channel("connected-agro-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "financial_records" }, () =>
          invalidateConnectedQueries(queryClient),
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "operation_records" }, () =>
          invalidateConnectedQueries(queryClient),
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "field_records" }, () =>
          invalidateConnectedQueries(queryClient),
        )
        .subscribe();
    } catch (error) {
      console.error("[Supabase] Falha ao assinar realtime:", error);
    }

    return () => {
      if (!channel) return;
      try {
        void supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [demoMode, queryClient]);

  return {
    snapshot: demoMode
      ? demoSnapshot
      : (query.data ?? {
          financial: [],
          operations: [],
          field: [],
          pecuariaCabecas: 0,
          costCenters: [],
          contracts: [],
          settings: EMPTY_SETTINGS,
        }),
    loading: !demoMode && query.isLoading,
    demoMode,
    lastUpdatedAt: demoMode ? Date.now() : query.dataUpdatedAt,
  };
}

// Invalida o snapshot conectado E as chaves amplas por-módulo. O React Query faz
// match por prefixo, então invalidar ["operation-records"] cobre também
// ["operation-records", area, module]. Chamada tanto pelo handler de realtime
// quanto pelos onSuccess das mutações, para que editar num módulo reflita
// imediatamente nos dashboards cruzados (COGS, Torre, Mapa).
export function invalidateConnectedQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["connected-agro-snapshot"] });
  void queryClient.invalidateQueries({ queryKey: ["operation-records"] });
  void queryClient.invalidateQueries({ queryKey: ["financial-records"] });
  void queryClient.invalidateQueries({ queryKey: ["field-records"] });
}

/** Métricas de Emissão de Carbono do snapshot (area sustentabilidade, module carbono). */
export function snapshotCarbonMetrics(snapshot: ConnectedAgroSnapshot): CarbonMetrics {
  return buildCarbonMetrics(
    snapshot.operations.filter(
      (item) => item.area === "sustentabilidade" && item.module === "carbono",
    ),
  );
}

// toneladas (a partir de kg) com 1 casa, pt-BR — ex.: 482.4 kg → "0,5".
function fmtT(kg: number): string {
  return (kg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
// tCO₂e com 1 casa, formato pt-BR (ex.: "1,3 tCO₂e").
function fmtCo2eT(totalT: number): string {
  return `${totalT.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} tCO₂e`;
}

export function buildControlTowerModel(snapshot: ConnectedAgroSnapshot): ControlTowerModel {
  const carbon = snapshotCarbonMetrics(snapshot);
  const cargas = snapshot.operations.filter(
    (item) => item.area === "logistica" && item.module === "cargas",
  );
  const bases = snapshot.operations.filter(
    (item) => item.area === "logistica" && item.module === "bases",
  );
  const rotas = snapshot.operations.filter(
    (item) => item.area === "logistica" && ["rotas", "roteirizacao"].includes(item.module),
  );
  const frota = snapshot.operations.filter(
    (item) => item.area === "logistica" && item.module === "frota",
  );
  const fluxo = snapshot.financial.filter((item) => item.module === "fluxo");
  const entradas = fluxo
    .filter((item) => normalized(item.payload.tipo).includes("entrada"))
    .reduce((sum, item) => sum + num(item.payload.valor), 0);
  const saidas = fluxo
    .filter((item) => isExpense(item.payload.tipo))
    .reduce((sum, item) => sum + num(item.payload.valor), 0);
  // Vendas diretas (Equipe & Vendas) entram como receita na Torre/Financeiro.
  const vendasDiretas = snapshot.operations
    .filter((item) => item.area === "equipe-vendas" && item.module === "vendas")
    .reduce((sum, item) => sum + num(item.payload.valor), 0);
  const receitaTotal = entradas + vendasDiretas;
  const entregues = cargas.filter((item) =>
    normalized(item.payload.status).includes("entregue"),
  ).length;
  const atrasadas = cargas.filter((item) =>
    normalized(item.payload.status).includes("atras"),
  ).length;
  const emTransito = cargas.filter((item) =>
    normalized(item.payload.status).includes("transito"),
  ).length;
  const ocorrencias = snapshot.field.filter(isFieldOccurrence).length;
  const otifBase = entregues + atrasadas;
  const capacidade = frota.length
    ? Math.round(
        (frota.filter((item) => !normalized(item.payload.status).includes("manutencao")).length /
          frota.length) *
          100,
      )
    : null;

  const alerts = buildControlAlerts(snapshot);
  const { points, routes } = buildNetworkMap(snapshot);

  return {
    metrics: {
      otif: otifBase ? Math.round((entregues / otifBase) * 100) : null,
      vendas: receitaTotal,
      capacidade,
      alertas: alerts.filter((alert) => alert.severity !== "info").length,
      cargas: cargas.length,
      nosRede: bases.length + snapshot.field.filter((item) => item.module === "areas").length,
    },
    mapMetrics: {
      emTransito,
      entregues,
      atrasadas,
      totalCargas: cargas.length,
      totalRotas: routes.length || rotas.length,
      bases: bases.length,
      ocorrencias,
    },
    moduleCards: [
      {
        label: "Logística",
        value: `${cargas.length} cargas`,
        detail: `${emTransito} em trânsito · ${atrasadas} atrasadas`,
        tone: atrasadas ? "text-destructive" : "text-primary",
      },
      {
        label: "Financeiro",
        value: money(receitaTotal - saidas),
        detail: `${money(receitaTotal)} em vendas`,
        tone: receitaTotal >= saidas ? "text-success" : "text-destructive",
      },
      {
        label: "Campo",
        value: `${snapshot.field.filter((item) => item.module === "areas").length} talhões`,
        detail: "manejo, insumos e ocorrências",
        tone: "text-primary",
      },
      {
        label: "Pecuária",
        value: `${snapshot.pecuariaCabecas} ${snapshot.pecuariaCabecas === 1 ? "cabeça ativa" : "cabeças ativas"}`,
        detail: "rebanho, sanidade e rastreabilidade",
        tone: "text-primary",
      },
      {
        label: "Emissão de Carbono",
        value: carbon.registros ? fmtCo2eT(carbon.totalT) : "—",
        detail: carbon.registros
          ? `escopos 1/2/3: ${fmtT(carbon.scope1)}/${fmtT(carbon.scope2)}/${fmtT(carbon.scope3)} t`
          : "sem apontamentos ainda",
        tone: "text-success",
      },
      {
        label: "COGS",
        value: money(buildCogsModel(snapshot).total),
        detail: "custo total conectado",
        tone: "text-warning",
      },
    ],
    alerts,
    points,
    routes,
    shipments: cargas.slice(0, 8).map((item) => ({
      codigo: item.payload.codigo ?? item.id,
      cliente: item.payload.cliente ?? "-",
      destino: item.payload.destino ?? "-",
      motorista: item.payload.motorista ?? "-",
      status: item.payload.status ?? "-",
      valor: item.payload.valor ?? "0",
    })),
  };
}

function buildControlAlerts(snapshot: ConnectedAgroSnapshot): ControlAlert[] {
  const alerts: ControlAlert[] = [];
  snapshot.operations.forEach((item) => {
    const severity = statusSeverity(item.payload.status ?? item.payload.severidade);
    if (severity === "info") return;
    alerts.push({
      id: `op-${item.id}`,
      title:
        item.payload.codigo ??
        item.payload.nome ??
        item.payload.produto ??
        item.payload.talhao ??
        item.module,
      source: `${item.area}/${item.module}`,
      severity,
      description: item.payload.status ?? item.payload.severidade ?? "Registro requer atenção.",
    });
  });
  snapshot.financial
    .filter((item) => ["inadimplencia", "compras", "credito"].includes(item.module))
    .forEach((item) => {
      const severity = statusSeverity(item.payload.status ?? "pendente");
      alerts.push({
        id: `fin-${item.id}`,
        title: item.payload.cliente ?? item.payload.insumo ?? item.payload.contrato ?? item.module,
        source: `financeiro/${item.module}`,
        severity,
        description: item.payload.valor
          ? `${money(num(item.payload.valor))} em acompanhamento.`
          : "Registro financeiro em acompanhamento.",
      });
    });
  snapshot.field
    .filter((item) => {
      if (statusSeverity(item.payload.status ?? item.payload.severidade) === "info") return false;
      // RDC: apenas ocorrências/sanidade (que carregam `ocorrencia`) viram alerta — itens
      // comuns (insumo, manejo, mão de obra...) não devem poluir a Torre.
      if (item.module === "rdc-entry" && !item.payload.ocorrencia) return false;
      return true;
    })
    .forEach((item) => {
      alerts.push({
        id: `field-${item.id}`,
        title:
          item.payload.ocorrencia ??
          item.payload.maquina ??
          item.payload.talhao ??
          item.payload.talhao_nome ??
          item.payload.descricao ??
          "Registro de campo",
        source: `campo/${item.module}`,
        severity: statusSeverity(item.payload.status ?? item.payload.severidade),
        description:
          item.payload.status ?? item.payload.severidade ?? "Registro de campo requer atenção.",
      });
    });
  // Caixas vazias: saldo alto no campo indica caixa perdida ou contagem furada.
  caixasVaziasSaldo(snapshot.operations).forEach((s) => {
    if (s.saldo > 200) {
      alerts.push({
        id: `caixas-${s.fazenda}`,
        title: `Caixas vazias no campo — ${s.fazenda}`,
        source: "logistica/caixas-vazias",
        severity: s.saldo > 500 ? "danger" : "warning",
        description: `${s.saldo} caixas ainda no campo (enviadas ${s.enviadas} − retornadas ${s.retornadas}).`,
      });
    }
  });
  // Caminhão demorado (permanência acima do SLA) — o de status atrasado já entra
  // pela varredura genérica de operations acima.
  remessaAtrasos(
    snapshot.operations,
    snapshot.settings.remessaTolerancias.slaPermanenciaMin,
  ).forEach((a) => {
    if (a.motivo.startsWith("Permanência")) {
      alerts.push({
        id: `atraso-${a.id}`,
        title: `Caminhão demorado — ${a.placa}`,
        source: "logistica/remessa",
        severity: "warning",
        description: `${a.fazenda}: ${a.motivo} no carregamento.`,
      });
    }
  });
  // Conferência que não fecha: o que saiu da lavoura × o que o beneficiamento
  // recebeu. É a razão de ser do controle de remessa.
  remessaDivergencias(snapshot.operations, snapshot.settings.remessaTolerancias).forEach((d) => {
    const doc = d.romaneio ? ` (romaneio ${d.romaneio})` : "";
    alerts.push({
      id: `remessa-div-${d.id}`,
      title: `Divergência na conferência — ${d.placa}`,
      source: "logistica/remessa",
      severity: d.nivel === "critico" ? "danger" : "warning",
      description: `${d.fazenda}${doc}: ${d.descricao} entre a saída e o beneficiamento.`,
    });
  });
  // Financeiro V2 — orçado × realizado: centro estourando ou quase (>95% / >100%).
  costCenterVariances(snapshot.costCenters, snapshot.contracts)
    .filter((v) => v.level !== "ok" && v.autorizado > 0)
    .forEach((v) => {
      alerts.push({
        id: `cc-var-${v.id}`,
        title:
          v.level === "danger"
            ? `Orçamento estourado — ${v.nome}`
            : `Orçamento quase no limite — ${v.nome}`,
        source: "financeiro/centros-de-custo",
        severity: v.level as "warning" | "danger",
        description: `${money(v.realizado)} de ${money(v.autorizado)} autorizado (${Math.round(v.ratio * 100)}%).`,
      });
    });
  // Financeiro V2 — contratos vencendo em ≤30 dias (renovar/encerrar).
  contractsExpiringSoon(snapshot.contracts, new Date().toISOString().slice(0, 10)).forEach((c) => {
    alerts.push({
      id: `ct-venc-${c.id}`,
      title: `Contrato vencendo — ${c.contrato}`,
      source: "financeiro/contratos",
      severity: "warning",
      description: `Vigência até ${c.vigencia_fim}${c.contraparte ? ` · ${c.contraparte}` : ""}. Renovar ou encerrar.`,
    });
  });
  return alerts.slice(0, 12);
}

function buildNetworkMap(snapshot: ConnectedAgroSnapshot) {
  const points: MapPoint[] = [];
  const routes: MapRoute[] = [];
  snapshot.operations
    .filter((item) => item.area === "logistica" && item.module === "cargas")
    .forEach((item) => {
      const origin = latLngFrom(item.payload, "origem_lat", "origem_lng");
      const destination = latLngFrom(item.payload, "destino_lat", "destino_lng");
      const tone = statusSeverity(item.payload.status) === "danger" ? "danger" : "primary";
      if (origin) {
        points.push({
          id: `origin-${item.id}`,
          label: item.payload.codigo ?? "Origem",
          caption: item.payload.origem,
          tone: "info",
          iconKey: "base",
          meta: { tipo: "Origem", cliente: item.payload.cliente, status: item.payload.status },
          ...origin,
        });
      }
      if (destination) {
        points.push({
          id: `dest-${item.id}`,
          label: item.payload.codigo ?? "Destino",
          caption: item.payload.destino,
          tone,
          iconKey: "cliente",
          meta: {
            tipo: "Cliente",
            status: item.payload.status,
            cliente: item.payload.cliente,
            origem: item.payload.origem,
            destino: item.payload.destino,
            motorista: item.payload.motorista,
            placa: item.payload.placa,
            ETA: item.payload.eta,
            valor: item.payload.valor,
          },
          ...destination,
        });
      }
      if (origin && destination) {
        routes.push({
          id: `route-${item.id}`,
          label: item.payload.codigo ?? "Rota",
          description: `${item.payload.origem ?? ""} -> ${item.payload.destino ?? ""}`,
          tone,
          points: [origin, destination],
        });
      }
    });

  snapshot.operations
    .filter((item) => item.area === "logistica" && item.module === "bases")
    .forEach((item) => {
      const coord = latLngFrom(item.payload);
      if (!coord) return;
      points.push({
        id: `base-${item.id}`,
        label: item.payload.nome ?? "Base",
        caption: item.payload.tipo,
        tone: "info",
        iconKey: "base",
        meta: { cidade: item.payload.cidade, responsavel: item.payload.responsavel },
        ...coord,
      });
    });

  snapshot.field.filter(isFieldOccurrence).forEach((item) => {
    const coord = gpsFrom(item.payload.gps);
    if (!coord) return;
    points.push({
      id: `field-${item.id}`,
      label: item.payload.ocorrencia ?? item.payload.titulo ?? "Campo",
      caption: item.payload.talhao,
      tone:
        statusSeverity(item.payload.status ?? item.payload.severidade) === "danger"
          ? "danger"
          : "warning",
      iconKey: "campo",
      meta: { talhao: item.payload.talhao, severidade: item.payload.severidade },
      ...coord,
    });
  });

  return { points, routes };
}

// Ocorrência de campo (para KPI e pontos do mapa): módulos de scouting/pragas/diário
// OU um item de RDC (`rdc-entry`) que registrou uma ocorrência — antes o RDC ficava
// de fora do KPI "ocorrências" e não era plotado no mapa mesmo com GPS.
function isFieldOccurrence(item: { module: string; payload: Record<string, string> }) {
  return (
    ["pragas", "scouting", "diario"].includes(item.module) ||
    (item.module === "rdc-entry" && !!item.payload.ocorrencia)
  );
}

function moduleRecordCount(snapshot: ConnectedAgroSnapshot, moduleId: string) {
  if (moduleId === "financeiro") return snapshot.financial.length;
  if (moduleId === "campo") return snapshot.field.length;
  // Pecuária migrou para as tabelas pec_* e não grava mais operation_records; a
  // contagem vem do rebanho ativo (senão a bolha do mapa mostrava 0 com gado real).
  // Fallback para operation_records cobre DEMO/legado (rebanho 0 + registros antigos).
  if (moduleId === "pecuaria")
    return (
      snapshot.pecuariaCabecas ||
      snapshot.operations.filter((item) => item.area === "pecuaria").length
    );
  return snapshot.operations.filter((item) => item.area === moduleId).length;
}

function firstText(payload: Record<string, string>, keys: string[]) {
  const key = keys.find((item) => payload[item]);
  return key ? payload[key] : undefined;
}

function recordCoord(payload: Record<string, string>) {
  return (
    latLngFrom(payload) ??
    latLngFrom(payload, "atual_lat", "atual_lng") ??
    latLngFrom(payload, "origem_lat", "origem_lng") ??
    latLngFrom(payload, "destino_lat", "destino_lng") ??
    gpsFrom(payload.gps)
  );
}

function operationHref(area: string) {
  if (area === "cogs") return "/otimizacao-cogs";
  return `/${area}`;
}

function operationLabel(area: string) {
  return unifiedModules.find((item) => item.id === area)?.label ?? area;
}

function operationTone(area: string, status?: string): MapPoint["tone"] {
  if (statusSeverity(status) === "danger") return "danger";
  if (statusSeverity(status) === "warning") return "warning";
  return unifiedModules.find((item) => item.id === area)?.tone ?? "primary";
}

export function buildUnifiedMapModel(
  snapshot: ConnectedAgroSnapshot,
  lastUpdatedAt?: number,
): UnifiedMapModel {
  const control = buildControlTowerModel(snapshot);
  const cogs = buildCogsModel(snapshot);
  const alerts = buildControlAlerts(snapshot);
  const remessaM = buildRemessaMetrics(snapshot.operations);
  const carbon = snapshotCarbonMetrics(snapshot);

  const moduleCounts = unifiedModules.map((module) => ({
    id: module.id,
    label: module.label,
    value: moduleRecordCount(snapshot, module.id),
    href: module.href,
    tone: module.tone,
  }));

  const logisticsPoints = control.points.map((point) => ({
    ...point,
    moduleId: point.id.startsWith("field-") ? "campo" : "logistica",
    moduleLabel: point.id.startsWith("field-") ? "Campo" : "Logística",
    iconKey: point.id.startsWith("field-") ? "campo" : "logistica",
    href: point.id.startsWith("field-") ? "/campo" : "/logistica",
    summary: point.description ?? point.caption ?? "Registro operacional georreferenciado.",
  }));

  const operationPoints: MapPoint[] = snapshot.operations
    .filter((item) => item.area !== "logistica")
    .map((item) => {
      const coord = recordCoord(item.payload);
      if (!coord) return null;
      const label =
        firstText(item.payload, [
          "codigo",
          "nome",
          "identificacao",
          "animal_lote",
          "produto",
          "atividade",
          "evento",
          "etapa",
          "status",
        ]) ?? item.module;
      return {
        id: `op-${item.area}-${item.id}`,
        label,
        ...coord,
        tone: operationTone(item.area, item.payload.status),
        moduleId: item.area,
        moduleLabel: operationLabel(item.area),
        iconKey: item.area,
        href: operationHref(item.area),
        recordId: item.id,
        recordModule: item.module,
        status: item.payload.status,
        summary: item.payload.observacao ?? item.payload.descricao ?? item.payload.status,
        metrics: {
          Módulo: item.module,
          Valor: item.payload.valor ?? item.payload.valor_estimado ?? item.payload.custo,
        },
      } as MapPoint;
    })
    .filter((point): point is MapPoint => Boolean(point));

  const fieldPoints: MapPoint[] = snapshot.field
    .map((item) => {
      const coord = recordCoord(item.payload);
      if (!coord) return null;
      const label =
        firstText(item.payload, [
          "talhao",
          "ocorrencia",
          "titulo",
          "insumo",
          "maquina",
          "lote",
          "cultura",
          "status",
        ]) ?? item.module;
      const severity = statusSeverity(item.payload.status ?? item.payload.severidade);
      return {
        id: `field-unified-${item.id}`,
        label,
        ...coord,
        tone: severity === "danger" ? "danger" : severity === "warning" ? "warning" : "success",
        moduleId: "campo",
        moduleLabel: "Campo",
        iconKey: item.module || "campo",
        href: "/campo",
        recordId: item.id,
        recordModule: item.module,
        status: item.payload.status ?? item.payload.severidade,
        summary: item.payload.observacao ?? item.payload.tratamento ?? item.payload.recomendacao,
        metrics: {
          Talhão: item.payload.talhao,
          Módulo: item.module,
        },
      } as MapPoint;
    })
    .filter((point): point is MapPoint => Boolean(point));

  const routes = control.routes.map((route) => ({
    ...route,
    moduleId: "logistica",
    moduleLabel: "Logística",
    href: "/logistica",
  }));

  // Rastreabilidade da colheita: origem (fazenda) → beneficiamento configurado.
  const remessaGeo = remessaGeoPorFazenda(snapshot.operations, snapshot.settings.fazendaCoords);
  const remessaPoints: MapPoint[] = remessaGeo.map((g) => ({
    id: `remessa-org-${g.fazenda}`,
    label: g.fazenda,
    lat: g.lat,
    lng: g.lng,
    moduleId: "campo",
    iconKey: "campo",
    moduleLabel: "Colheita",
    href: "/logistica",
    tone: "success",
    summary: `${g.caixas.toLocaleString("pt-BR")} caixas colhidas.`,
    metrics: { Caixas: g.caixas },
  }));
  // Destino vem das configurações da empresa. Sem beneficiamento configurado
  // não há rota nem pino de destino — antes o pino era "Fazenda Matrice",
  // chumbado no código e visível no mapa de qualquer outro cliente.
  const beneficiamento = snapshot.settings.beneficiamento;
  const remessaRoutes: MapRoute[] = beneficiamento
    ? remessaGeo.map((g) => ({
        id: `remessa-rota-${g.fazenda}`,
        label: `${g.fazenda} → ${beneficiamento.nome}`,
        tone: "primary",
        points: [
          { lat: g.lat, lng: g.lng },
          { lat: beneficiamento.lat, lng: beneficiamento.lng },
        ],
      }))
    : [];
  const beneficiamentoPoint: MapPoint[] =
    beneficiamento && remessaGeo.length
      ? [
          {
            id: "beneficiamento",
            label: `Beneficiamento — ${beneficiamento.nome}`,
            lat: beneficiamento.lat,
            lng: beneficiamento.lng,
            moduleId: "base",
            iconKey: "base",
            moduleLabel: "Beneficiamento",
            tone: "info",
            summary: "Recebimento e beneficiamento da colheita.",
          },
        ]
      : [];

  return {
    points: [
      ...logisticsPoints,
      ...operationPoints,
      ...fieldPoints,
      ...remessaPoints,
      ...beneficiamentoPoint,
    ],
    routes: [...routes, ...remessaRoutes],
    alerts,
    moduleCounts,
    lastUpdatedAt,
    kpis: [
      ...(control.metrics.otif === null
        ? []
        : [{ label: "OTIF", value: `${control.metrics.otif}%`, tone: "success" as const }]),
      { label: "Vendas", value: money(control.metrics.vendas), tone: "success" },
      { label: "Cargas", value: control.metrics.cargas, tone: "primary" },
      {
        label: "Alertas",
        value: control.metrics.alertas,
        tone: control.metrics.alertas ? "warning" : "success",
      },
      { label: "COGS", value: money(cogs.total), tone: "warning" },
      {
        label: "Módulos",
        value: moduleCounts.filter((item) => item.value > 0).length,
        tone: "info",
      },
      ...(remessaM.caixasTotal > 0
        ? [
            {
              label: "Caixas colhidas",
              value: remessaM.caixasTotal.toLocaleString("pt-BR"),
              tone: "primary" as const,
            },
            {
              label: "Peso líq.",
              value: `${(remessaM.pesoLiquidoTotal / 1000).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })} t`,
              tone: "success" as const,
            },
          ]
        : []),
      ...(carbon.registros > 0
        ? [{ label: "Pegada", value: fmtCo2eT(carbon.totalT), tone: "success" as const }]
        : []),
    ],
  };
}

export function buildCogsModel(snapshot: ConnectedAgroSnapshot): CogsModel {
  const carbonPrice = snapshot.settings.carbonPriceBrlPerT ?? CARBON_PRICE_BRL_PER_T;
  const costRecords = snapshot.financial.filter((item) => item.module === "custos");
  const fluxo = snapshot.financial.filter((item) => item.module === "fluxo");
  const cogsRecords = snapshot.operations.filter((item) => item.area === "cogs");
  const fretes = snapshot.operations.filter(
    (item) => item.area === "logistica" && item.module === "fretes",
  );
  const perdas = snapshot.operations.filter(
    (item) => item.area === "inteligencia" && item.module === "perdas",
  );
  const insumos = snapshot.field.filter((item) => item.module === "insumos");
  const maquinario = snapshot.field.filter((item) => item.module === "maquinario");

  const explicitStageCost = (stage: string) =>
    cogsRecords
      .filter((item) => item.module === "etapas" && normalized(item.payload.etapa).includes(stage))
      .reduce((sum, item) => sum + num(item.payload.custo), 0);

  const stages: CogsStage[] = [
    {
      key: "materia_prima",
      label: "Matéria-prima",
      value:
        costRecords.reduce((sum, item) => sum + num(item.payload.custo_total), 0) +
        explicitStageCost("materia"),
      source: "Financeiro/Custos",
    },
    {
      key: "insumos",
      label: "Insumos",
      value:
        insumos.reduce((sum, item) => sum + num(item.payload.custo_hectare), 0) +
        explicitStageCost("insumo"),
      source: "Campo/Insumos",
    },
    {
      key: "mao_obra",
      label: "Mão de obra",
      value:
        explicitStageCost("mao") +
        snapshot.operations
          .filter((item) => item.area === "equipe-vendas" && item.module === "mao_de_obra")
          .reduce((sum, item) => sum + num(item.payload.mao_obra), 0),
      source: "Equipe/Mão de obra + COGS",
    },
    {
      key: "maquinario",
      label: "Maquinário",
      value:
        maquinario.reduce((sum, item) => sum + num(item.payload.custo_operacional), 0) +
        explicitStageCost("maquin"),
      source: "Campo/Maquinário",
    },
    {
      key: "embalagem",
      label: "Embalagem",
      value: explicitStageCost("embal"),
      source: "COGS/Etapas",
    },
    {
      key: "perdas",
      label: "Perdas",
      value: perdas.reduce((sum, item) => sum + num(item.payload.valor_estimado), 0),
      source: "Inteligência/Perdas",
    },
    {
      key: "armazenagem",
      label: "Armazenagem",
      value: explicitStageCost("armazen"),
      source: "COGS/Etapas",
    },
    {
      key: "frete",
      label: "Frete e transporte",
      value: fretes.reduce(
        (sum, item) =>
          sum + num(item.payload.custo) + num(item.payload.combustivel) + num(item.payload.pedagio),
        0,
      ),
      source: "Logística/Fretes",
    },
    {
      key: "comercializacao",
      label: "Comercialização",
      value: explicitStageCost("comercial"),
      source: "COGS/Etapas",
    },
    {
      key: "carbono",
      label: "Pegada de carbono",
      // custo/passivo de offset = tCO₂e × preço de referência (R$/t, editável nas configs)
      value: carbonCostBRL(snapshotCarbonMetrics(snapshot).totalT, carbonPrice),
      source: `Emissão de Carbono · R$ ${carbonPrice}/tCO₂e`,
    },
  ];
  const total = stages.reduce((sum, stage) => sum + stage.value, 0);
  const revenue = fluxo
    .filter((item) => normalized(item.payload.tipo).includes("entrada"))
    .reduce((sum, item) => sum + num(item.payload.valor), 0);
  const reports = costRecords.map((item) => {
    const unitCost = num(item.payload.custo_total) / Math.max(num(item.payload.quantidade), 1);
    return {
      sku: item.payload.sku ?? item.payload.produto ?? item.id,
      produto: item.payload.produto ?? "-",
      familia: item.payload.familia ?? item.payload.unidade ?? "-",
      custo_unitario: unitCost,
      preco_venda: num(item.payload.preco_venda),
      margem: num(item.payload.preco_venda) - unitCost,
    };
  });
  const scenarios = cogsRecords
    .filter((item) => item.module === "simulacoes")
    .map((item) => ({
      nome: item.payload.nome ?? item.payload.cenario ?? "Cenário",
      impacto: item.payload.impacto ?? "0",
      economia: num(item.payload.economia),
      status: item.payload.status ?? "Em análise",
    }));

  return {
    stages: [
      ...stages,
      { key: "final", label: "Custo final", value: total, source: "Consolidado" },
    ],
    total,
    revenue,
    margin: revenue - total,
    alerts: buildCogsAlerts(stages, reports),
    reports,
    scenarios,
    // Financeiro V2: centros de custo por etapa (drill-down) + variância orçado×realizado.
    centerRollup: rollupByStage(snapshot.costCenters, snapshot.contracts),
    variances: costCenterVariances(snapshot.costCenters, snapshot.contracts),
  };
}

/** Margem/ROI por talhão a partir dos centros de custo + contratos do snapshot. */
export function buildFieldMarginModel(snapshot: ConnectedAgroSnapshot): FieldMargin[] {
  return buildFieldMargin(snapshot.costCenters, snapshot.contracts);
}

function buildCogsAlerts(stages: CogsStage[], reports: CogsModel["reports"]): ControlAlert[] {
  const alerts: ControlAlert[] = [];
  const total = stages.reduce((sum, stage) => sum + stage.value, 0);
  stages
    .filter((stage) => stage.value > 0 && stage.value / Math.max(total, 1) > 0.3)
    .forEach((stage) => {
      alerts.push({
        id: `stage-${stage.key}`,
        title: `${stage.label} acima do esperado`,
        source: stage.source,
        severity: "warning",
        description: `${stage.label} representa ${Math.round((stage.value / Math.max(total, 1)) * 100)}% do COGS.`,
      });
    });
  reports
    .filter((report) => Number(report.margem) < 0)
    .forEach((report) => {
      alerts.push({
        id: `report-${report.sku}`,
        title: `Margem negativa em ${report.produto}`,
        source: "COGS/Relatórios",
        severity: "danger",
        description: `Custo unitário maior que o preço de venda para ${report.sku}.`,
      });
    });
  return alerts.slice(0, 8);
}
