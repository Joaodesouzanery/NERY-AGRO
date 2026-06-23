import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  AudioLines,
  BellRing,
  CalendarDays,
  CloudSun,
  Droplets,
  Edit3,
  LayoutDashboard,
  Leaf,
  MapPinned,
  Microscope,
  Plus,
  QrCode,
  ScanSearch,
  Sprout,
  Tractor,
  Trash2,
  Upload,
  Wheat,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MapPoint, type MapRoute } from "@/components/carto-map";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  createFieldRecord,
  deleteFieldRecord,
  FieldRecord,
  listFieldRecords,
  updateFieldRecord,
} from "@/lib/supabase-field";
import { ImportRecordsButton } from "@/components/import-records-button";
import { isSupabaseConfigured } from "@/lib/supabase-financial";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campo")({
  head: () => ({
    meta: [
      { title: "Campo - Nery Logística" },
      {
        name: "description",
        content: "Gestão de talhões, plantio, manejo, rastreabilidade e estimativa de safra.",
      },
    ],
  }),
  component: CampoPage,
});

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "gps" | "url";
  options?: string[];
};

type CampoModule = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
};

type RecordsByModule = Record<string, FieldRecord[]>;

const statusOptions = ["Planejado", "Em andamento", "Concluído", "Alerta", "Bloqueado"];

const campoModules: CampoModule[] = [
  {
    id: "areas",
    label: "Áreas e Talhões",
    shortLabel: "Talhões",
    description: "Mapeamento visual das áreas, histórico do solo e coordenadas GPS.",
    icon: MapPinned,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "area_ha", label: "Area ha", type: "number" },
      { key: "cultura", label: "Cultura" },
      { key: "uso_solo", label: "Histórico de uso do solo", type: "textarea" },
      { key: "coordenadas", label: "Coordenadas GPS", type: "gps" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
    ],
  },
  {
    id: "calendario",
    label: "Calendário de Plantio/Colheita",
    shortLabel: "Calendário",
    description: "Cronograma visual baseado em sazonalidade e alertas de colheita.",
    icon: CalendarDays,
    fields: [
      { key: "cultura", label: "Cultura" },
      { key: "talhao", label: "Talhão" },
      { key: "plantio_inicio", label: "Janela plantio inicio", type: "date" },
      { key: "colheita_prevista", label: "Colheita prevista", type: "date" },
      { key: "sazonalidade", label: "Sazonalidade" },
      {
        key: "alerta",
        label: "Alerta de colheita",
        type: "select",
        options: ["7 dias", "15 dias", "30 dias"],
      },
    ],
  },
  {
    id: "diario",
    label: "Diário de Campo Digital",
    shortLabel: "Diário",
    description: "Notas, fotos, áudio e observações com geolocalização.",
    icon: AudioLines,
    fields: [
      { key: "titulo", label: "Titulo" },
      { key: "talhao", label: "Talhão" },
      { key: "observacao", label: "Observação", type: "textarea" },
      { key: "foto_url", label: "Foto URL", type: "url" },
      { key: "audio_url", label: "Áudio URL", type: "url" },
      { key: "gps", label: "GPS", type: "gps" },
      { key: "offline_status", label: "Registro offline-first" },
    ],
  },
  {
    id: "insumos",
    label: "Registro de Insumos",
    shortLabel: "Insumos",
    description: "Sementes, fertilizantes e defensivos aplicados por talhão.",
    icon: Leaf,
    fields: [
      { key: "insumo", label: "Insumo" },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: ["Semente", "Fertilizante", "Defensivo"],
      },
      { key: "talhao", label: "Talhão" },
      { key: "dose", label: "Dose" },
      { key: "carencia", label: "Carência dias", type: "number" },
      { key: "custo_hectare", label: "Custo por hectare", type: "number" },
    ],
  },
  {
    id: "pragas",
    label: "Manejo de Pragas e Doenças",
    shortLabel: "Pragas",
    description: "Histórico de ocorrências, mapa de focos e tratamentos.",
    icon: ScanSearch,
    fields: [
      { key: "ocorrencia", label: "Ocorrencia" },
      { key: "talhao", label: "Talhão" },
      {
        key: "severidade",
        label: "Severidade",
        type: "select",
        options: ["Baixa", "Media", "Alta"],
      },
      { key: "tratamento", label: "Tratamento", type: "textarea" },
      { key: "receituario", label: "Receituário agronômico" },
      { key: "gps", label: "GPS do foco", type: "gps" },
      { key: "carencia", label: "Carência pós-aplicação", type: "number" },
    ],
  },
  {
    id: "lotes",
    label: "Rastreabilidade de Lotes",
    shortLabel: "Lotes",
    description: "QR Code por lote, cadeia de custódia e conformidade orgânica.",
    icon: QrCode,
    fields: [
      { key: "lote", label: "Lote" },
      { key: "origem", label: "Origem" },
      { key: "talhao", label: "Talhão" },
      { key: "custodia", label: "Cadeia de custodia", type: "textarea" },
      {
        key: "conformidade",
        label: "Conformidade orgânica",
        type: "select",
        options: ["Conforme", "Em análise", "Não conforme"],
      },
    ],
  },
  {
    id: "solo",
    label: "Gestão de Solo",
    shortLabel: "Solo",
    description: "Análises químicas, calagem e histórico por talhão.",
    icon: Microscope,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "ph", label: "pH", type: "number" },
      { key: "mo", label: "MO", type: "number" },
      { key: "ctc", label: "CTC", type: "number" },
      { key: "calagem", label: "Recomendação de calagem", type: "textarea" },
      { key: "data_laudo", label: "Data do laudo", type: "date" },
    ],
  },
  {
    id: "irrigacao",
    label: "Controle de Irrigação",
    shortLabel: "Irrigação",
    description: "Turnos de rega, consumo por talhão e integração IoT preparada.",
    icon: Droplets,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "turno", label: "Turno automatico" },
      { key: "consumo_m3", label: "Consumo m3", type: "number" },
      { key: "sensor_iot", label: "Sensor IoT" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
    ],
  },
  {
    id: "meteorologia",
    label: "Previsão Meteorológica",
    shortLabel: "Clima",
    description: "Previsão de 7 dias, alertas push preparados e histórico climático.",
    icon: CloudSun,
    fields: [
      { key: "local", label: "Local" },
      { key: "periodo", label: "Período" },
      {
        key: "risco",
        label: "Risco",
        type: "select",
        options: ["Geada", "Chuva", "Seca", "Normal"],
      },
      { key: "previsao_7d", label: "Previsão 7 dias", type: "textarea" },
      { key: "alerta_push", label: "Alerta push" },
    ],
  },
  {
    id: "maquinario",
    label: "Gestão de Maquinário",
    shortLabel: "Máquinas",
    description: "Manutencao preventiva, horimetro e custo operacional.",
    icon: Tractor,
    fields: [
      { key: "maquina", label: "Máquina" },
      { key: "horimetro", label: "Horimetro", type: "number" },
      { key: "troca_oleo", label: "Troca de oleo", type: "date" },
      { key: "manutencao", label: "Alerta de manutencao" },
      { key: "custo_operacional", label: "Custo operacional", type: "number" },
    ],
  },
  {
    id: "estimativa",
    label: "Estimativa de Safra",
    shortLabel: "Safra",
    description: "Produtividade esperada, histórico e cenários por talhão.",
    icon: Wheat,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "cultura", label: "Cultura" },
      { key: "produtividade", label: "Produtividade esperada", type: "number" },
      { key: "historico", label: "Comparação histórica" },
      {
        key: "cenario",
        label: "Cenario",
        type: "select",
        options: ["Otimista", "Base", "Pessimista"],
      },
    ],
  },
  {
    id: "planejamento",
    label: "Planejamento de Plantio por Talhão",
    shortLabel: "Plantio",
    description: "Variedade, taxa de semeadura, espacamento e janela de plantio.",
    icon: Sprout,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "variedade", label: "Variedade" },
      { key: "taxa_semeadura", label: "Taxa de semeadura" },
      { key: "espacamento", label: "Espacamento" },
      { key: "meta_produtividade", label: "Meta produtividade", type: "number" },
      { key: "janela_valida", label: "Validação da janela" },
    ],
  },
  {
    id: "prescricao",
    label: "Mapa de Prescricao",
    shortLabel: "Prescricao",
    description: "Taxa variável por zona, exportação para máquina preparada e histórico.",
    icon: MapPinned,
    fields: [
      { key: "zona", label: "Zona de manejo" },
      { key: "talhao", label: "Talhão" },
      { key: "semente", label: "Semente" },
      { key: "fertilizante", label: "Fertilizante" },
      { key: "defensivo", label: "Defensivo" },
      { key: "exportacao", label: "Arquivo para máquina" },
    ],
  },
  {
    id: "modelo",
    label: "Monitoramento + Modelo de Cultura",
    shortLabel: "Modelo",
    description: "Simulação de crescimento por clima, solo, manejo e genética.",
    icon: Leaf,
    fields: [
      { key: "cultura", label: "Cultura" },
      { key: "talhao", label: "Talhão" },
      { key: "estagio", label: "Estágio fenológico" },
      { key: "projecao", label: "Projeção produtividade", type: "number" },
      { key: "sensibilidade", label: "Sensibilidade ao clima", type: "textarea" },
    ],
  },
  {
    id: "scouting",
    label: "Scouting de Campo",
    shortLabel: "Scouting",
    description: "Notas, fotos e alertas georreferenciados para o agronomo.",
    icon: ScanSearch,
    fields: [
      { key: "alerta", label: "Alerta" },
      { key: "talhao", label: "Talhão" },
      { key: "foto_url", label: "Foto URL", type: "url" },
      { key: "gps", label: "GPS", type: "gps" },
      { key: "responsavel", label: "Agronomo" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
    ],
  },
  {
    id: "pre-colheita",
    label: "Estimativa Pre-Colheita",
    shortLabel: "Pre-colheita",
    description: "Amostragem digital para logística, contratos e projeção por talhão.",
    icon: Wheat,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "amostragem", label: "Amostragem digital", type: "textarea" },
      { key: "projecao", label: "Projeção por talhão", type: "number" },
      { key: "contratos", label: "Saída para contratos" },
    ],
  },
  {
    id: "analise-solo",
    label: "Análise de Solo Integrada",
    shortLabel: "Laudos",
    description: "Importação de laudos, recomendação automática e histórico por camada.",
    icon: Upload,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "laudo_url", label: "Laudo URL", type: "url" },
      { key: "camada", label: "Camada" },
      { key: "recomendacao", label: "Recomendação automática", type: "textarea" },
      { key: "data", label: "Data", type: "date" },
    ],
  },
  {
    id: "nitrogenio",
    label: "Gestão de Nitrogênio",
    shortLabel: "Nitrogênio",
    description: "Dose preditiva por clima e solo, janelas e risco de chuva.",
    icon: Leaf,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "dose", label: "Dose preditiva", type: "number" },
      { key: "janela", label: "Janela de aplicação" },
      { key: "risco_chuva", label: "Risco de perda por chuva" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
    ],
  },
];

const demoRecords: RecordsByModule = {
  areas: [
    record("areas", "1", {
      talhao: "Talhão A",
      area_ha: "18",
      cultura: "Hortalicas",
      uso_solo: "Rotação com milho verde e adubação orgânica.",
      coordenadas: "22,70;36,56;55,48;72,40",
      status: "Em andamento",
    }),
    record("areas", "2", {
      talhao: "Talhão B",
      area_ha: "12",
      cultura: "Mandioca",
      uso_solo: "Pousio curto e cobertura vegetal.",
      coordenadas: "20,42;38,36;55,30;70,25",
      status: "Planejado",
    }),
  ],
  calendario: [
    record("calendario", "1", {
      cultura: "Hortalicas",
      talhao: "Talhão A",
      plantio_inicio: "2026-06-05",
      colheita_prevista: "2026-08-12",
      sazonalidade: "Inverno seco",
      alerta: "15 dias",
    }),
  ],
  diario: [
    record("diario", "1", {
      titulo: "Vistoria pós-chuva",
      talhao: "Talhão A",
      observacao: "Solo com boa infiltração e sem erosão visível.",
      foto_url: "",
      audio_url: "",
      gps: "-23.5505,-46.6333",
      offline_status: "Sincronizado",
    }),
  ],
  insumos: [
    record("insumos", "1", {
      insumo: "Composto orgânico",
      tipo: "Fertilizante",
      talhao: "Talhão A",
      dose: "2 t/ha",
      carencia: "0",
      custo_hectare: "480",
    }),
  ],
  pragas: [
    record("pragas", "1", {
      ocorrencia: "Lagarta",
      talhao: "Talhão A",
      severidade: "Media",
      tratamento: "Monitorar bordadura e aplicar biologico se aumentar.",
      receituario: "BIO-2026-009",
      gps: "52,47",
      carencia: "3",
    }),
  ],
  lotes: [
    record("lotes", "1", {
      lote: "ORG-2026-001",
      origem: "Talhão A",
      talhao: "Talhão A",
      custodia: "Colheita, higienização, embalagem e expedição registrados.",
      conformidade: "Conforme",
    }),
  ],
};

function record(module: string, id: string, payload: Record<string, string>): FieldRecord {
  return { id: `${module}-demo-${id}`, module, payload };
}

function num(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function numericValue(value: unknown) {
  const match = String(value ?? "")
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPercentileLookup(records: FieldRecord[], key: string) {
  const values = records
    .map((recordItem) => ({ id: recordItem.id, value: numericValue(recordItem.payload[key]) }))
    .filter((item): item is { id: string; value: number } => item.value !== undefined)
    .sort((a, b) => a.value - b.value);

  if (!values.length) return new Map<string, number>();
  if (values.length === 1) return new Map([[values[0].id, 100]]);

  return new Map(
    values.map((item, index) => [
      item.id,
      Math.round((index / Math.max(values.length - 1, 1)) * 100),
    ]),
  );
}

function formatPercentile(value: number | undefined) {
  return value === undefined ? "-" : `P${value}`;
}

const totalCostKeys = ["custo_total", "custo_hectare", "custo_operacional", "valor"];

function calculatedCostFields(fields: FieldConfig[]) {
  if (!fields.some((field) => totalCostKeys.includes(field.key))) return fields;
  const next = [...fields];
  const add = (field: FieldConfig) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({ key: "quantidade", label: "Quantidade", type: "number" });
  add({ key: "unidade_base", label: "Unidade base" });
  add({ key: "custo_total", label: "Custo total", type: "number" });
  add({ key: "custo_unitario", label: "Custo unitario", type: "number" });
  return next;
}

function normalizeCostPayload(payload: Record<string, string>, changedKey?: string) {
  const next = { ...payload };
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }

  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }

  const quantity = num(next.quantidade);
  const totalKey =
    changedKey && totalCostKeys.includes(changedKey)
      ? changedKey
      : next.custo_total
        ? "custo_total"
        : (totalCostKeys.find((key) => next[key]) ?? "custo_total");
  const total = num(next.custo_total || next[totalKey]);
  const unit = num(next.custo_unitario);
  if (quantity <= 0) return next;

  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = String(Math.round(unit * quantity * 10000) / 10000);
  } else if (
    changedKey === "quantidade" ||
    changedKey === "custo_total" ||
    totalCostKeys.includes(changedKey ?? "")
  ) {
    next.custo_unitario = total > 0 ? String(Math.round((total / quantity) * 10000) / 10000) : "";
  }
  return next;
}

function updateCostPayload(current: Record<string, string>, key: string, value: string) {
  return normalizeCostPayload({ ...current, [key]: value }, key);
}

function emptyPayload(module: CampoModule) {
  return Object.fromEntries(calculatedCostFields(module.fields).map((field) => [field.key, ""]));
}

function formatValue(value: string | undefined, field?: FieldConfig) {
  if (!value) return "-";
  if (field?.type === "number") return num(value).toLocaleString("pt-BR");
  return value;
}

function parseRoute(value: unknown): Array<{ lat?: number; lng?: number; x?: number; y?: number }> {
  const points = String(value ?? "")
    .split(";")
    .map((pair): { lat?: number; lng?: number; x?: number; y?: number } | null => {
      const [first, second] = pair.split(",").map((part) => num(part.trim()));
      if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
      if (first < 0 || second < 0) return { lat: first, lng: second };
      return { x: first, y: second };
    })
    .filter((point): point is { lat?: number; lng?: number; x?: number; y?: number } =>
      Boolean(point),
    );
  return points.length > 1 ? points : [];
}

function parseFocus(
  value: unknown,
): { lat?: number; lng?: number; x?: number; y?: number } | undefined {
  const [first, second] = String(value ?? "")
    .split(",")
    .map((part) => num(part.trim()));
  if (!Number.isFinite(first) || !Number.isFinite(second)) return undefined;
  if (first < 0 || second < 0) return { lat: first, lng: second };
  return { x: first, y: second };
}

function centroid(points: Array<{ lat?: number; lng?: number; x?: number; y?: number }>) {
  if (!points.length) return undefined;
  const latLng = points.filter((point) => point.lat !== undefined && point.lng !== undefined);
  if (latLng.length) {
    return {
      lat: latLng.reduce((sum, point) => sum + num(point.lat), 0) / latLng.length,
      lng: latLng.reduce((sum, point) => sum + num(point.lng), 0) / latLng.length,
    };
  }
  return {
    x: points.reduce((sum, point) => sum + num(point.x), 0) / points.length,
    y: points.reduce((sum, point) => sum + num(point.y), 0) / points.length,
  };
}

function fieldTone(moduleId: string, payload: Record<string, string>): MapPoint["tone"] {
  if (moduleId === "pragas") return payload.severidade === "Alta" ? "danger" : "warning";
  if (["meteorologia", "irrigacao", "maquinario", "nitrogenio"].includes(moduleId))
    return "warning";
  if (["lotes", "diario", "scouting", "analise-solo", "solo"].includes(moduleId)) return "info";
  if (["areas", "insumos", "planejamento", "estimativa"].includes(moduleId)) return "success";
  return "primary";
}

function fieldTitle(module: CampoModule, payload: Record<string, string>) {
  const preferred = [
    "talhao",
    "lote",
    "insumo",
    "ocorrencia",
    "maquina",
    "cultura",
    "titulo",
    "alerta",
    "zona",
    "local",
  ];
  const key = preferred.find((item) => payload[item]);
  return key ? payload[key] : module.shortLabel;
}

function moduleSummary(module: CampoModule, records: FieldRecord[]) {
  switch (module.id) {
    case "areas":
      return {
        headline: `${records.reduce((sum, item) => sum + num(item.payload.area_ha), 0).toLocaleString("pt-BR")} ha`,
        caption: `${records.length} talhões mapeados`,
      };
    case "insumos":
      return {
        headline: records
          .reduce((sum, item) => sum + num(item.payload.custo_hectare), 0)
          .toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        caption: "custo/ha registrado",
      };
    case "pragas":
      return {
        headline: String(records.filter((item) => item.payload.severidade === "Alta").length),
        caption: "focos criticos",
      };
    default:
      return { headline: String(records.length), caption: "registros" };
  }
}

function queueOfflineDiary(payload: Record<string, string>) {
  const key = "nery-campo-diario-pendente";
  const current = JSON.parse(localStorage.getItem(key) || "[]") as Array<Record<string, string>>;
  localStorage.setItem(
    key,
    JSON.stringify([{ ...payload, offline_status: "Pendente" }, ...current]),
  );
}

function CampoPage() {
  const { demoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState<string>("visao-geral");
  const [selectedTalhaoId, setSelectedTalhaoId] = useState<string | null>(null);

  const queryResults = useQueries({
    queries: campoModules.map((module) => ({
      queryKey: ["field-records", module.id],
      queryFn: () => listFieldRecords(module.id),
      enabled: !demoMode,
    })),
  });

  const recordsByModule = useMemo(() => {
    if (demoMode) return demoRecords;
    return Object.fromEntries(
      campoModules.map((module, index) => [module.id, queryResults[index].data ?? []]),
    ) as RecordsByModule;
  }, [demoMode, queryResults]);

  const talhoes = useMemo(() => recordsByModule.areas ?? [], [recordsByModule.areas]);
  const routes: MapRoute[] = useMemo(
    () =>
      talhoes
        .map((item) => {
          const points = parseRoute(item.payload.coordenadas);
          if (!points.length) return null;
          return {
            id: item.id,
            label: item.payload.talhao || "Talhão",
            points,
            shape: "polygon" as const,
            category: "areas",
            sourceModule: "areas",
            status: item.payload.status,
            description: item.payload.uso_solo,
            tone: "success" as const,
            meta: {
              Cultura: item.payload.cultura,
              Área: item.payload.area_ha ? `${item.payload.area_ha} ha` : undefined,
            },
          };
        })
        .filter((route): route is NonNullable<typeof route> => Boolean(route)),
    [talhoes],
  );

  const talhaoCenters = useMemo(() => {
    return new Map(
      talhoes
        .map((item): [string, { lat?: number; lng?: number; x?: number; y?: number }] | null => {
          const center = centroid(parseRoute(item.payload.coordenadas));
          return item.payload.talhao && center ? [item.payload.talhao, center] : null;
        })
        .filter((item): item is [string, { lat?: number; lng?: number; x?: number; y?: number }] =>
          Boolean(item),
        ),
    );
  }, [talhoes]);

  const campoMapPoints: MapPoint[] = useMemo(
    () =>
      campoModules.flatMap((module) =>
        (recordsByModule[module.id] ?? [])
          .map((item): MapPoint | null => {
            const directPoint =
              parseFocus(item.payload.gps) ??
              parseFocus(item.payload.coordenadas) ??
              parseFocus(item.payload.localizacao);
            const talhaoPoint = item.payload.talhao
              ? talhaoCenters.get(item.payload.talhao)
              : undefined;
            const point = directPoint ?? talhaoPoint;
            if (!point) return null;

            return {
              id: `${module.id}-${item.id}`,
              label: fieldTitle(module, item.payload),
              ...point,
              tone: fieldTone(module.id, item.payload),
              category: module.id,
              icon: module.id,
              sourceModule: module.id,
              status: item.payload.status ?? item.payload.severidade,
              description:
                item.payload.observacao ??
                item.payload.tratamento ??
                item.payload.recomendacao ??
                module.description,
              meta: {
                Modulo: module.shortLabel,
                Talhao: item.payload.talhao,
                Status: item.payload.status,
                Severidade: item.payload.severidade,
                Cultura: item.payload.cultura,
              },
            };
          })
          .filter((point): point is MapPoint => Boolean(point)),
      ),
    [recordsByModule, talhaoCenters],
  );

  const hectares = talhoes.reduce((sum, item) => sum + num(item.payload.area_ha), 0);
  const alerts = [...(recordsByModule.pragas ?? []), ...(recordsByModule.meteorologia ?? [])]
    .length;

  const selectedTalhao = talhoes.find((t) => t.id === selectedTalhaoId);
  const talhaoPragas = selectedTalhao
    ? (recordsByModule.pragas ?? []).filter(
        (p) => p.payload.talhao === selectedTalhao.payload.talhao,
      )
    : [];
  const talhaoInsumos = selectedTalhao
    ? (recordsByModule.insumos ?? []).filter(
        (p) => p.payload.talhao === selectedTalhao.payload.talhao,
      )
    : [];

  const tabs = useMemo(
    () => [
      { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
      ...campoModules.map((m) => ({ id: m.id, label: m.shortLabel, icon: m.icon })),
    ],
    [],
  );
  const activeModule = campoModules.find((m) => m.id === activeTab);

  return (
    <div className="px-8 py-6 max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Talhões, manejo, rastreabilidade, clima e planejamento agrícola em uma tela operacional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/campo/talhoes"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <MapPinned className="h-4 w-4" />
            Abrir Talhão 360°
          </Link>
          <div className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">
            {demoMode ? "DEMO" : "REAL"}
          </div>
        </div>
      </div>

      {!demoMode && !isSupabaseConfigured && (
        <div className="mb-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar dados reais no Campo.
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "min-h-16 rounded-xl border p-3 text-left text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <t.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "visao-geral" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="grid gap-4 xl:grid-cols-[1fr_430px]">
              <div>
                <div className="grid gap-3 md:grid-cols-4">
                  <CampoKpi
                    label="Talhões"
                    value={String(talhoes.length)}
                    hint="áreas cadastradas"
                  />
                  <CampoKpi
                    label="Área total"
                    value={`${hectares.toLocaleString("pt-BR")} ha`}
                    hint="mapeada"
                  />
                  <CampoKpi label="Alertas" value={String(alerts)} hint="campo e clima" />
                  <CampoKpi
                    label="Lotes"
                    value={String(recordsByModule.lotes?.length ?? 0)}
                    hint="rastreáveis"
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {campoModules.map((module) => {
                    const summary = moduleSummary(module, recordsByModule[module.id] ?? []);
                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveTab(module.id)}
                        className="rounded-xl border border-border bg-background/60 p-3 text-sm text-left transition hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <module.icon className="h-4 w-4 text-primary" />
                          <span className="truncate">{module.shortLabel}</span>
                        </div>
                        <div className="mt-2 text-lg font-semibold">{summary.headline}</div>
                        <div className="text-xs text-muted-foreground">{summary.caption}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <CartoMap
                variant="satellite"
                className="h-[380px]"
                centerLabel="Mapa de talhões"
                routes={routes}
                points={campoMapPoints}
                showLegend
                onRouteClick={(r) => setSelectedTalhaoId(r.id)}
              />
            </div>

            <div className="mt-5 h-56 rounded-xl border border-border bg-background/60 p-3">
              <ResponsiveContainer>
                <BarChart
                  data={campoModules.map((module) => ({
                    label: module.shortLabel,
                    valor: (recordsByModule[module.id] ?? []).length,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedTalhao && (
              <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-primary">
                      Talhão selecionado
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">
                      {selectedTalhao.payload.talhao || "Talhão"} ·{" "}
                      {selectedTalhao.payload.cultura || "—"}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selectedTalhao.payload.area_ha
                        ? `${selectedTalhao.payload.area_ha} ha · `
                        : ""}
                      {selectedTalhao.payload.status || "Status não informado"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTalhaoId(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <CampoKpi
                    label="Histórico de uso"
                    value={selectedTalhao.payload.uso_solo ? "Registrado" : "—"}
                    hint={selectedTalhao.payload.uso_solo || "Sem histórico"}
                  />
                  <CampoKpi
                    label="Insumos aplicados"
                    value={String(talhaoInsumos.length)}
                    hint="registros associados"
                  />
                  <CampoKpi
                    label="Focos de praga"
                    value={String(talhaoPragas.length)}
                    hint={
                      talhaoPragas.some((p) => p.payload.severidade === "Alta")
                        ? "atenção alta"
                        : "monitoramento"
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/campo/talhoes/$fieldId"
                    params={{ fieldId: selectedTalhao.id }}
                    search={{ tab: "overview" }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <MapPinned className="h-3.5 w-3.5" />
                    Talhão 360°
                  </Link>
                  <button
                    onClick={() => setActiveTab("areas")}
                    className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
                  >
                    Editar talhão
                  </button>
                  <button
                    onClick={() => setActiveTab("insumos")}
                    className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
                  >
                    Ver insumos
                  </button>
                  <button
                    onClick={() => setActiveTab("pragas")}
                    className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
                  >
                    Ver pragas
                  </button>
                  <button
                    onClick={() => setActiveTab("solo")}
                    className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
                  >
                    Ver solo
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeModule && (
        <CampoModuleSection
          key={activeModule.id}
          module={activeModule}
          demoMode={demoMode}
          records={recordsByModule[activeModule.id] ?? []}
        />
      )}
    </div>
  );
}

function CampoKpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function CartoMap({
  routes = [],
  points = [],
}: {
  variant?: string;
  className?: string;
  centerLabel?: string;
  routes?: MapRoute[];
  points?: MapPoint[];
  showLegend?: boolean;
  onRouteClick?: (route: MapRoute) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-background/60 p-5">
      <div className="flex h-full min-h-[260px] flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPinned className="h-4 w-4 text-primary" />
            Mapa operacional unico
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Talhoes, insumos, pragas, clima e demais registros georreferenciados aparecem no mapa
            principal da plataforma.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <CampoKpi
            label="Talhoes no mapa"
            value={String(routes.length)}
            hint="poligonos cadastrados"
          />
          <CampoKpi
            label="Pontos de campo"
            value={String(points.length)}
            hint="GPS ou centro do talhao"
          />
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Abrir mapa
          </a>
        </div>
      </div>
    </section>
  );
}

function CampoModuleSection({
  module,
  demoMode,
  records,
}: {
  module: CampoModule;
  demoMode: boolean;
  records: FieldRecord[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FieldRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, string>>(emptyPayload(module));
  const summary = moduleSummary(module, records);
  const isInsumos = module.id === "insumos";
  const custoPercentiles = useMemo(
    () => (isInsumos ? buildPercentileLookup(records, "custo_hectare") : new Map<string, number>()),
    [isInsumos, records],
  );
  const dosePercentiles = useMemo(
    () => (isInsumos ? buildPercentileLookup(records, "dose") : new Map<string, number>()),
    [isInsumos, records],
  );
  const fields = useMemo(() => calculatedCostFields(module.fields), [module.fields]);

  const createMutation = useMutation({
    mutationFn: createFieldRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["field-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => {
      if (module.id === "diario") {
        queueOfflineDiary(payload);
        toast.info("Registro salvo na fila offline do Diário.");
        setOpen(false);
        return;
      }
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFieldRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["field-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFieldRecord,
    onSuccess: () => {
      toast.success("Registro excluido.");
      void queryClient.invalidateQueries({ queryKey: ["field-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message),
  });

  const beginCreate = () => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para cadastrar dados reais.");
      return;
    }
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };

  const beginEdit = (recordItem: FieldRecord) => {
    if (demoMode) {
      toast.info("Dados demo não podem ser editados.");
      return;
    }
    setEditing(recordItem);
    setPayload({ ...emptyPayload(module), ...recordItem.payload });
    setOpen(true);
  };

  const submit = () => {
    if (demoMode) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: normalizeCostPayload(payload) });
      return;
    }
    createMutation.mutate({ module: module.id, payload: normalizeCostPayload(payload) });
  };

  const importRows = async (rows: Record<string, string>[]) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createFieldRecord({ module: module.id, payload: normalizeCostPayload(row) });
    }
    void queryClient.invalidateQueries({ queryKey: ["field-records", module.id] });
    invalidateConnectedQueries(queryClient);
  };

  return (
    <section id={module.id} className="scroll-mt-20 rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <module.icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">{module.label}</h3>
            <p className="text-xs text-muted-foreground">{module.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ImportRecordsButton fields={fields} disabled={demoMode} onImport={importRows} />
          <button
            onClick={beginCreate}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <CampoKpi label="Resumo" value={summary.headline} hint={summary.caption} />
        <CampoKpi
          label="Registros"
          value={String(records.length)}
          hint={demoMode ? "somente leitura" : "editável"}
        />
        <CampoKpi
          label="Automação"
          value={
            isInsumos
              ? `${custoPercentiles.size}/${dosePercentiles.size}`
              : module.id === "diario"
                ? "Offline"
                : "Ativa"
          }
          hint={isInsumos ? "percentis custo/dose" : "v1 funcional"}
        />
      </div>

      {module.id === "lotes" && <LotTraceability records={records} />}
      {module.id === "calendario" && <CalendarStrip records={records} />}
      {module.id === "diario" && <OfflineNote />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {fields.slice(0, 5).map((field) => (
                <th key={field.key} className="py-3 pr-4 font-medium">
                  {field.label}
                </th>
              ))}
              {isInsumos && (
                <>
                  <th className="py-3 pr-4 font-medium">Percentil custo/ha</th>
                  <th className="py-3 pr-4 font-medium">Percentil dose</th>
                </>
              )}
              <th className="py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {records.map((recordItem) => (
              <tr key={recordItem.id} className="border-b border-border last:border-0">
                {fields.slice(0, 5).map((field) => (
                  <td key={field.key} className="py-3 pr-4 max-w-64 truncate">
                    {formatValue(recordItem.payload[field.key], field)}
                  </td>
                ))}
                {isInsumos && (
                  <>
                    <td className="py-3 pr-4 font-medium">
                      {formatPercentile(custoPercentiles.get(recordItem.id))}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {formatPercentile(dosePercentiles.get(recordItem.id))}
                    </td>
                  </>
                )}
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => beginEdit(recordItem)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (demoMode) {
                          toast.info("Dados demo não podem ser excluídos.");
                          return;
                        }
                        if (window.confirm("Excluir este registro?"))
                          deleteMutation.mutate(recordItem.id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={fields.slice(0, 5).length + (isInsumos ? 3 : 1)}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum registro real cadastrado neste módulo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Adicionar registro"}</DialogTitle>
            <DialogDescription>{module.label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={payload[field.key] ?? ""}
                onChange={(value) =>
                  setPayload((current) => updateCostPayload(current, field.key, value))
                }
              />
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const baseClass =
    "rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

  const fillGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização indisponível neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        onChange(`${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`),
      () => toast.error("Não foi possível capturar o GPS."),
    );
  };

  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(baseClass, "min-h-24 py-2")}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(baseClass, "h-10")}
        >
          <option value="">Selecione</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "gps" ? (
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="lat,lng ou x,y;..."
            className={cn(baseClass, "h-10 flex-1")}
          />
          <button
            type="button"
            onClick={fillGps}
            className="h-10 rounded-md border border-border px-3 text-xs hover:bg-muted"
          >
            GPS
          </button>
        </div>
      ) : (
        <input
          type={field.type === "url" ? "url" : (field.type ?? "text")}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(baseClass, "h-10")}
        />
      )}
    </label>
  );
}

function lotQrValue(payload: Record<string, string>): string {
  // Conteúdo rastreável e escaneável do lote (origem/talhão/conformidade).
  return [
    `Lote: ${payload.lote || "-"}`,
    payload.origem ? `Origem: ${payload.origem}` : "",
    payload.talhao ? `Talhão: ${payload.talhao}` : "",
    payload.conformidade ? `Conformidade: ${payload.conformidade}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function LotTraceability({ records }: { records: FieldRecord[] }) {
  if (!records.length) return null;
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      {records.slice(0, 3).map((recordItem) => (
        <div key={recordItem.id} className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-border bg-white p-1">
              <QRCodeCanvas value={lotQrValue(recordItem.payload)} size={44} level="M" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{recordItem.payload.lote || "Lote"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {recordItem.payload.conformidade || "Sem conformidade"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarStrip({ records }: { records: FieldRecord[] }) {
  if (!records.length) return null;
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      {records.slice(0, 3).map((recordItem) => (
        <div key={recordItem.id} className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BellRing className="h-4 w-4 text-primary" />
            {recordItem.payload.cultura || "Cultura"}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Plantio {recordItem.payload.plantio_inicio || "-"} / Colheita{" "}
            {recordItem.payload.colheita_prevista || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}

function OfflineNote() {
  return (
    <div className="mb-4 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
      O Diário salva registros em uma fila local se o Supabase estiver indisponível. Campos de foto
      e áudio aceitam URL nesta v1.
    </div>
  );
}
