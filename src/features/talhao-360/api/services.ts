import {
  createFieldRecord,
  listAllFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import { normalizeFarmName } from "@/features/talhao-360/lib/farm-name";
import type {
  FarmPerimeterRecord,
  FieldAlert,
  Talhao360Model,
  TalhaoCycle,
  TalhaoPayload,
  TalhaoRecord,
  TimelineEvent,
} from "@/features/talhao-360/types/domain";

export async function listTalhao360Records() {
  return listAllFieldRecords();
}

export function asTalhaoRecord(record: FieldRecord): TalhaoRecord {
  return record as TalhaoRecord;
}

function cleanPayload(payload: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value ?? ""]),
  ) as Record<string, string>;
}

// Mora em lib/farm-name (puro) para a visão geral usar sem arrastar o Supabase;
// re-exportado aqui porque as telas já importavam daqui.
export { normalizeFarmName } from "@/features/talhao-360/lib/farm-name";

export function asFarmPerimeterRecord(record: FieldRecord): FarmPerimeterRecord {
  return record as FarmPerimeterRecord;
}

export function listFarmPerimeters(records: FieldRecord[]) {
  return records.filter((record) => record.module === "talhao360-farm").map(asFarmPerimeterRecord);
}

export function farmNamesFromTalhoes(talhoes: TalhaoRecord[]) {
  const names = talhoes.map((talhao) => talhao.payload.fazenda?.trim()).filter(Boolean) as string[];
  return Array.from(new Set(names.length ? names : ["Fazenda ativa"]));
}

export function findFarmPerimeter(
  records: FieldRecord[],
  farmName?: string,
): FarmPerimeterRecord | null {
  const normalized = normalizeFarmName(farmName);
  const perimeters = listFarmPerimeters(records);
  return (
    perimeters.find((record) => normalizeFarmName(record.payload.fazenda) === normalized) ?? null
  );
}

export function legacyFarmPerimeterFromTalhoes(
  talhoes: TalhaoRecord[],
  farmName?: string,
): FarmPerimeterRecord | null {
  const normalized = normalizeFarmName(farmName);
  const talhao = talhoes.find(
    (item) =>
      normalizeFarmName(item.payload.fazenda) === normalized && item.payload.farm_geometry_geojson,
  );
  if (!talhao?.payload.farm_geometry_geojson) return null;
  return {
    ...talhao,
    module: "talhao360-farm",
    payload: {
      fazenda: talhao.payload.fazenda || farmName || "Fazenda ativa",
      geometry_geojson: talhao.payload.farm_geometry_geojson,
    },
  };
}

export function resolveFarmPerimeter(
  records: FieldRecord[],
  talhoes: TalhaoRecord[],
  farmName?: string,
) {
  return findFarmPerimeter(records, farmName) ?? legacyFarmPerimeterFromTalhoes(talhoes, farmName);
}

export function parseCycles(payload: TalhaoPayload): TalhaoCycle[] {
  try {
    const value = JSON.parse(payload.ciclos_json || "[]");
    return Array.isArray(value) ? (value as TalhaoCycle[]) : [];
  } catch {
    return [];
  }
}

function eventFromRecord(record: FieldRecord): TimelineEvent {
  const value = record.payload;
  return {
    id: record.id,
    date: value.date || record.created_at?.slice(0, 10) || "",
    type: value.type || "Observação",
    description: value.description || value.observacao || "Evento registrado.",
    responsible: value.responsible || value.responsavel,
    season: value.season || value.safra,
    cycle: value.cycle || value.ciclo,
    origin: value.origin === "Automática" ? "Automática" : "Manual",
    impact: value.impact || value.impacto,
    critical: value.critical === "true",
  };
}

function alertFromRecord(record: FieldRecord): FieldAlert {
  const value = record.payload;
  const severity = ["Crítico", "Atenção", "Informativo", "Recomendação"].includes(value.severity)
    ? (value.severity as FieldAlert["severity"])
    : "Informativo";
  const status = ["Aberto", "Em análise", "Resolvido", "Ignorado"].includes(value.status)
    ? (value.status as FieldAlert["status"])
    : "Aberto";
  return {
    id: record.id,
    type: value.type || "Planejamento",
    severity,
    title: value.title || "Alerta",
    description: value.description || "",
    probableCause: value.probableCause || value.causa_provavel,
    expectedImpact: value.expectedImpact || value.impacto_esperado,
    recommendation: value.recommendation || value.recomendacao,
    dueOn: value.dueOn || value.prazo,
    season: value.season || value.safra,
    cycle: value.cycle || value.ciclo,
    status,
  };
}

function belongsToTalhao(record: FieldRecord, talhao: TalhaoRecord) {
  return (
    record.payload.talhao_id === talhao.id ||
    (!record.payload.talhao_id && record.payload.talhao === talhao.payload.talhao)
  );
}

// Rótulos pt-BR dos tipos de evento do Calendário de Campo (cópia local para
// não acoplar talhao-360 a campo-calendar).
const CALENDAR_EVENT_TYPE_LABELS: Record<string, string> = {
  operacao: "Operação de campo",
  monitoramento: "Monitoramento",
  plantio: "Plantio",
  adubacao: "Adubação",
  pulverizacao: "Pulverização",
  irrigacao: "Irrigação",
  colheita: "Colheita",
  compra: "Compra",
  manutencao: "Manutenção",
  decisao: "Decisão",
  alerta: "Alerta",
  marco: "Marco de ciclo",
  administrativa: "Tarefa administrativa",
  personalizado: "Personalizado",
};

/** Payload de calendar-event usa title/starts_at/event_type — mapeia para o formato da timeline. */
function calendarEventOverrides(record: FieldRecord) {
  const p = record.payload;
  return {
    date: p.starts_at?.slice(0, 10) || record.created_at?.slice(0, 10) || "",
    type: CALENDAR_EVENT_TYPE_LABELS[p.event_type] || "Calendário",
    description: [p.title, p.description || p.notes].filter(Boolean).join(" — ") || "Tarefa",
  };
}

export function buildTalhao360Model(
  records: FieldRecord[],
  fieldId: string,
  seasonId?: string,
  cycleId?: string,
): Talhao360Model | null {
  const talhoes = records.filter((record) => record.module === "areas").map(asTalhaoRecord);
  const talhao = talhoes.find((record) => record.id === fieldId);
  if (!talhao) return null;

  const cycles = parseCycles(talhao.payload);
  const seasons = Array.from(
    new Set([talhao.payload.safra, ...cycles.map((cycle) => cycle.safra)].filter(Boolean)),
  ) as string[];
  const selectedSeason = seasons.includes(seasonId ?? "")
    ? (seasonId as string)
    : talhao.payload.safra || seasons[0] || "Sem safra";
  const seasonCycles = cycles.filter((cycle) => cycle.safra === selectedSeason);
  const selectedCycle =
    seasonCycles.find((cycle) => cycle.id === cycleId) ??
    seasonCycles.find((cycle) => cycle.status === "Em andamento") ??
    seasonCycles[0] ??
    null;

  const events = records
    .filter((record) => record.module === "talhao360-event" && belongsToTalhao(record, talhao))
    .map(eventFromRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
  const alerts = records
    .filter((record) => record.module === "talhao360-alert" && belongsToTalhao(record, talhao))
    .map(alertFromRecord);

  const operationalEvents = records
    .filter(
      (record) =>
        !["areas", "talhao360-event", "talhao360-alert", "talhao360-farm"].includes(
          record.module,
        ) &&
        // Do Calendário de Campo só a tarefa em si entra na timeline
        // (templates/status são configuração, não acontecimento).
        (!record.module.startsWith("calendar-") || record.module === "calendar-event") &&
        belongsToTalhao(record, talhao),
    )
    .map((record) =>
      eventFromRecord({
        ...record,
        payload: {
          ...record.payload,
          ...(record.module === "calendar-event"
            ? calendarEventOverrides(record)
            : {
                date:
                  record.payload.data ||
                  record.payload.plantio_inicio ||
                  record.created_at?.slice(0, 10) ||
                  "",
                type: record.payload.tipo || record.module,
                description:
                  record.payload.observacao ||
                  record.payload.tratamento ||
                  record.payload.insumo ||
                  record.payload.cultura ||
                  `Registro de ${record.module}`,
              }),
        },
      }),
    );

  const allEvents = [...events, ...operationalEvents].sort((a, b) => b.date.localeCompare(a.date));
  return {
    talhoes,
    talhao,
    cycles,
    seasons,
    selectedSeason,
    selectedCycle,
    events: allEvents,
    alerts,
    lastOperation: allEvents[0] ?? null,
    nextActivity: allEvents.find((event) => event.type.toLowerCase().includes("planej")) ?? null,
  };
}

export async function saveTalhaoPayload(talhao: TalhaoRecord, patch: Partial<TalhaoPayload>) {
  return updateFieldRecord({
    id: talhao.id,
    payload: cleanPayload({ ...talhao.payload, ...patch }),
  });
}

export async function createTalhao(payload: TalhaoPayload) {
  return createFieldRecord({ module: "areas", payload: cleanPayload(payload) });
}

export async function saveFarmPerimeter(input: {
  existingId?: string;
  fazenda: string;
  geometry: GeoJSON.Polygon;
  areaHa: number;
  perimeterKm: number;
}) {
  const payload = cleanPayload({
    fazenda: input.fazenda.trim() || "Fazenda ativa",
    geometry_geojson: JSON.stringify(input.geometry),
    area_ha: input.areaHa.toFixed(2),
    perimetro_km: input.perimeterKm.toFixed(3),
  });
  if (input.existingId) {
    return updateFieldRecord({ id: input.existingId, payload });
  }
  return createFieldRecord({ module: "talhao360-farm", payload });
}

export async function saveCycles(talhao: TalhaoRecord, cycles: TalhaoCycle[]) {
  return saveTalhaoPayload(talhao, { ciclos_json: JSON.stringify(cycles) });
}

export async function createTimelineEvent(talhao: TalhaoRecord, event: Omit<TimelineEvent, "id">) {
  return createFieldRecord({
    module: "talhao360-event",
    payload: {
      talhao_id: talhao.id,
      talhao: talhao.payload.talhao,
      ...Object.fromEntries(
        Object.entries(event).map(([key, value]) => [key, value == null ? "" : String(value)]),
      ),
    },
  });
}

export async function updateAlert(recordId: string, alert: FieldAlert) {
  return updateFieldRecord({
    id: recordId,
    payload: Object.fromEntries(
      Object.entries(alert).map(([key, value]) => [key, value == null ? "" : String(value)]),
    ),
  });
}
