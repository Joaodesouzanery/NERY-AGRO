import { useEffect } from "react";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { MapPoint, MapRoute } from "@/components/carto-map";
import { type FinancialRecord, listAllFinancialRecords } from "@/lib/supabase-financial";
import { type FieldRecord, listAllFieldRecords } from "@/lib/supabase-field";
import { type OperationRecord, listOperationRecordsByArea } from "@/lib/supabase-operations";
import { useDemoMode } from "@/hooks/use-demo-mode";

export type ConnectedAgroSnapshot = {
  financial: FinancialRecord[];
  operations: OperationRecord[];
  field: FieldRecord[];
};

export type ControlAlert = {
  id: string;
  title: string;
  source: string;
  severity: "info" | "warning" | "danger";
  description: string;
};

export type ControlTowerModel = {
  metrics: {
    otif: number;
    vendas: number;
    capacidade: number;
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
  layerStats: Array<{ label: string; value: number; tone: MapPoint["tone"] }>;
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

const unifiedModules = [
  {
    id: "logistica",
    label: "Logistica",
    href: "/logistica",
    tone: "primary" as const,
    lat: -23.55,
    lng: -46.63,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    href: "/financeiro",
    tone: "success" as const,
    lat: -15.78,
    lng: -47.93,
  },
  {
    id: "campo",
    label: "Campo",
    href: "/campo",
    tone: "success" as const,
    lat: -22.9,
    lng: -47.06,
  },
  {
    id: "pecuaria",
    label: "Pecuaria",
    href: "/pecuaria",
    tone: "info" as const,
    lat: -19.92,
    lng: -43.94,
  },
  {
    id: "sustentabilidade",
    label: "Sustentabilidade",
    href: "/sustentabilidade",
    tone: "success" as const,
    lat: -3.1,
    lng: -60.02,
  },
  {
    id: "inteligencia",
    label: "Inteligencia",
    href: "/inteligencia",
    tone: "info" as const,
    lat: -22.91,
    lng: -43.17,
  },
  {
    id: "cogs",
    label: "Otimizacao COGS",
    href: "/otimizacao-cogs",
    tone: "warning" as const,
    lat: -25.43,
    lng: -49.27,
  },
  {
    id: "equipe-vendas",
    label: "Equipe & Vendas",
    href: "/equipe-vendas",
    tone: "primary" as const,
    lat: -20.46,
    lng: -54.62,
  },
];

const demoSnapshot: ConnectedAgroSnapshot = {
  financial: [
    financial("fluxo", "1", {
      descricao: "Venda de cestas e ovos",
      tipo: "entrada",
      categoria: "Vendas",
      valor: "148000",
      data: "2026-05-30",
    }),
    financial("fluxo", "2", {
      descricao: "Insumos e embalagens",
      tipo: "saida",
      categoria: "Custos",
      valor: "62400",
      data: "2026-05-29",
    }),
    financial("custos", "1", {
      produto: "Cesta orgânica",
      unidade: "unidade",
      custo_total: "42000",
      quantidade: "1400",
      preco_venda: "58",
    }),
    financial("inadimplencia", "1", {
      cliente: "Mercado Central",
      valor: "3200",
      vencimento: "2026-05-20",
      status: "pendente",
    }),
  ],
  operations: [
    operation("logistica", "cargas", "1", {
      codigo: "#100512-SP",
      cliente: "CSA Vila Verde",
      origem: "Curitiba, PR",
      origem_lat: "-25.43",
      origem_lng: "-49.27",
      destino: "São Paulo, SP",
      destino_lat: "-23.55",
      destino_lng: "-46.63",
      peso: "1580",
      valor: "18400",
      motorista: "João Pereira",
      placa: "NER-2A45",
      status: "Em trânsito",
      eta: "14:40",
    }),
    operation("logistica", "cargas", "2", {
      codigo: "#330217-RS",
      cliente: "Distribuidor Sul",
      origem: "Florianópolis, SC",
      origem_lat: "-27.59",
      origem_lng: "-48.55",
      destino: "Porto Alegre, RS",
      destino_lat: "-30.03",
      destino_lng: "-51.23",
      peso: "960",
      valor: "9700",
      motorista: "Ana Ribeiro",
      placa: "NER-7P30",
      status: "Atrasado",
      eta: "+2h",
    }),
    operation("logistica", "bases", "1", {
      nome: "CD Sudeste",
      tipo: "Centro de Distribuição",
      cidade: "São Paulo, SP",
      lat: "-23.55",
      lng: "-46.63",
      responsavel: "Operação Sudeste",
    }),
    operation("logistica", "fretes", "1", {
      rota: "Curitiba > São Paulo",
      km: "408",
      custo: "3250",
      combustivel: "980",
      pedagio: "210",
      status: "Fechado",
    }),
    operation("pecuaria", "animal", "1", {
      identificacao: "BR-0421",
      especie: "Bovino",
      raca: "Girolando",
      peso_atual: "418",
      status: "Ativo",
    }),
    operation("pecuaria", "vacinacao", "1", {
      animal_lote: "Lote Bezerras 01",
      proxima_dose: "2026-06-12",
      status: "Reforço previsto",
    }),
    operation("sustentabilidade", "carbono", "1", {
      atividade: "Transporte de cestas",
      fonte: "Diesel",
      volume: "180",
      fator: "2.68",
      co2e: "482.4",
      status: "Calculado",
    }),
    operation("inteligencia", "perdas", "1", {
      produto: "Tomate",
      volume_perdido: "340",
      causa: "Transporte",
      valor_estimado: "4200",
      status: "Em ação",
    }),
    operation("cogs", "etapas", "1", {
      produto: "Cesta orgânica",
      etapa: "Embalagem",
      custo: "8200",
      sku: "CSA-ORG",
      regiao: "Sudeste",
      status: "Calculado",
    }),
    operation("cogs", "simulacoes", "1", {
      nome: "Trocar fornecedor de caixas",
      impacto: "-6.5",
      economia: "3400",
      status: "Favorável",
    }),
  ],
  field: [
    field("areas", "1", {
      talhao: "Talhão A",
      area_ha: "18",
      cultura: "Hortaliças",
      status: "Em andamento",
    }),
    field("insumos", "1", {
      insumo: "Composto orgânico",
      tipo: "Fertilizante",
      talhao: "Talhão A",
      custo_hectare: "480",
    }),
    field("maquinario", "1", {
      maquina: "Trator 01",
      custo_operacional: "7300",
      status: "Atenção",
    }),
    field("pragas", "1", {
      ocorrencia: "Lagarta",
      talhao: "Talhão A",
      severidade: "Alta",
      gps: "-23.5505,-46.6333",
    }),
  ],
};

function financial(module: string, id: string, payload: Record<string, string>): FinancialRecord {
  return { id: `demo-fin-${module}-${id}`, module, payload };
}

function operation(
  area: string,
  module: string,
  id: string,
  payload: Record<string, string>,
): OperationRecord {
  return { id: `demo-op-${area}-${module}-${id}`, area, module, payload };
}

function field(module: string, id: string, payload: Record<string, string>): FieldRecord {
  return { id: `demo-field-${module}-${id}`, module, payload };
}

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
  const [financial, field, operationGroups] = await Promise.all([
    listAllFinancialRecords(),
    listAllFieldRecords(),
    Promise.all(operationAreas.map((area) => listOperationRecordsByArea(area))),
  ]);
  return { financial, field, operations: operationGroups.flat() };
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
      : (query.data ?? { financial: [], operations: [], field: [] }),
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

export function buildControlTowerModel(snapshot: ConnectedAgroSnapshot): ControlTowerModel {
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
  const ocorrencias = snapshot.field.filter((item) =>
    ["pragas", "scouting", "diario"].includes(item.module),
  ).length;
  const otifBase = entregues + atrasadas;
  const capacidade = frota.length
    ? Math.round(
        (frota.filter((item) => !normalized(item.payload.status).includes("manutencao")).length /
          frota.length) *
          100,
      )
    : 82;

  const alerts = buildControlAlerts(snapshot);
  const { points, routes } = buildNetworkMap(snapshot);

  return {
    metrics: {
      otif: otifBase ? Math.round((entregues / otifBase) * 100) : 94,
      vendas: receitaTotal,
      capacidade,
      alertas: alerts.filter((alert) => alert.severity !== "info").length,
      cargas: cargas.length,
      nosRede: bases.length + snapshot.field.filter((item) => item.module === "areas").length + 4,
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
        value: `${snapshot.operations.filter((item) => item.area === "pecuaria").length} registros`,
        detail: "animais, vacinação e produção",
        tone: "text-primary",
      },
      {
        label: "Sustentabilidade",
        value: `${snapshot.operations.filter((item) => item.area === "sustentabilidade").length} controles`,
        detail: "carbono, resíduos e APPs",
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
    layerStats: [
      {
        label: "Clientes",
        value: new Set(cargas.map((item) => item.payload.cliente).filter(Boolean)).size,
        tone: "primary",
      },
      { label: "CDs/Bases", value: bases.length, tone: "info" },
      {
        label: "Plantas",
        value: snapshot.field.filter((item) => item.module === "areas").length,
        tone: "success",
      },
      {
        label: "Fornecedores",
        value:
          new Set(snapshot.financial.map((item) => item.payload.fornecedor).filter(Boolean)).size ||
          3,
        tone: "warning",
      },
    ],
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

  snapshot.field
    .filter((item) => ["pragas", "scouting", "diario"].includes(item.module))
    .forEach((item) => {
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

function moduleRecordCount(snapshot: ConnectedAgroSnapshot, moduleId: string) {
  if (moduleId === "financeiro") return snapshot.financial.length;
  if (moduleId === "campo") return snapshot.field.length;
  return snapshot.operations.filter((item) => item.area === moduleId).length;
}

function moduleAlertCount(alerts: ControlAlert[], moduleId: string) {
  const prefix =
    moduleId === "financeiro" ? "financeiro" : moduleId === "campo" ? "campo" : moduleId;
  return alerts.filter((alert) => alert.source.startsWith(prefix)).length;
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

  const moduleCounts = unifiedModules.map((module) => ({
    id: module.id,
    label: module.label,
    value: moduleRecordCount(snapshot, module.id),
    href: module.href,
    tone: module.tone,
  }));

  const aggregatePoints: MapPoint[] = unifiedModules.map((module) => {
    const count = moduleRecordCount(snapshot, module.id);
    const alertas = moduleAlertCount(alerts, module.id);
    return {
      id: `module-${module.id}`,
      label: module.label,
      lat: module.lat,
      lng: module.lng,
      tone: alertas ? "warning" : module.tone,
      moduleId: module.id,
      moduleLabel: module.label,
      iconKey: module.id,
      href: module.href,
      summary:
        count > 0
          ? `${count} registros conectados neste modulo.`
          : "Modulo sem registros reais no snapshot atual.",
      metrics: {
        Registros: count,
        Alertas: alertas,
      },
      meta: {
        Tipo: "Resumo do modulo",
      },
    };
  });

  const logisticsPoints = control.points.map((point) => ({
    ...point,
    moduleId: point.id.startsWith("field-") ? "campo" : "logistica",
    moduleLabel: point.id.startsWith("field-") ? "Campo" : "Logistica",
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
          Modulo: item.module,
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
          Talhao: item.payload.talhao,
          Modulo: item.module,
        },
      } as MapPoint;
    })
    .filter((point): point is MapPoint => Boolean(point));

  const routes = control.routes.map((route) => ({
    ...route,
    moduleId: "logistica",
    moduleLabel: "Logistica",
    href: "/logistica",
  }));

  return {
    points: [...aggregatePoints, ...logisticsPoints, ...operationPoints, ...fieldPoints],
    routes,
    alerts,
    moduleCounts,
    lastUpdatedAt,
    kpis: [
      { label: "OTIF", value: `${control.metrics.otif}%`, tone: "success" },
      { label: "Vendas", value: money(control.metrics.vendas), tone: "success" },
      { label: "Cargas", value: control.metrics.cargas, tone: "primary" },
      {
        label: "Alertas",
        value: control.metrics.alertas,
        tone: control.metrics.alertas ? "warning" : "success",
      },
      { label: "COGS", value: money(cogs.total), tone: "warning" },
      {
        label: "Modulos",
        value: moduleCounts.filter((item) => item.value > 0).length,
        tone: "info",
      },
    ],
  };
}

export function buildCogsModel(snapshot: ConnectedAgroSnapshot): CogsModel {
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
  };
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
