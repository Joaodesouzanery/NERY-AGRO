import {
  createFieldRecord,
  listAllFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import type {
  FieldAlert,
  Talhao360Model,
  TalhaoCycle,
  TalhaoPayload,
  TalhaoRecord,
  TimelineEvent,
} from "@/features/talhao-360/types/domain";
import { parsePolygon } from "@/features/talhao-360/map/geometry";

const DEMO_OVERRIDES_KEY = "nery-talhao360-demo-overrides";
const DEMO_EXTRA_KEY = "nery-talhao360-demo-extra-records";
// Dedicated record for the farm perimeter, so it can be registered before any
// talhão exists (instead of only being replicated onto talhão records).
const FARM_MODULE = "talhao360-farm";
const DEMO_FARM_ID = "demo-farm";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

export function applyDemoPersistence(records: FieldRecord[]) {
  const overrides = readStorage<Record<string, FieldRecord>>(DEMO_OVERRIDES_KEY, {});
  const extra = readStorage<FieldRecord[]>(DEMO_EXTRA_KEY, []);
  return [...records.map((record) => overrides[record.id] ?? record), ...extra];
}

function saveDemoRecord(record: FieldRecord) {
  const overrides = readStorage<Record<string, FieldRecord>>(DEMO_OVERRIDES_KEY, {});
  overrides[record.id] = record;
  writeStorage(DEMO_OVERRIDES_KEY, overrides);
  return record;
}

function createDemoRecord(module: string, payload: Record<string, string>) {
  const record: FieldRecord = {
    id: `demo-${module}-${crypto.randomUUID()}`,
    module,
    payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const extra = readStorage<FieldRecord[]>(DEMO_EXTRA_KEY, []);
  writeStorage(DEMO_EXTRA_KEY, [record, ...extra]);
  return record;
}

// Insert-or-update a record in the demo "extra" list (those aren't covered by
// the overrides map, which only patches the base mocks).
function upsertDemoExtra(record: FieldRecord) {
  const extra = readStorage<FieldRecord[]>(DEMO_EXTRA_KEY, []);
  const index = extra.findIndex((item) => item.id === record.id);
  if (index >= 0) extra[index] = record;
  else extra.unshift(record);
  writeStorage(DEMO_EXTRA_KEY, extra);
  return record;
}

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
    talhaoId: value.talhao_id,
    talhaoName: value.talhao,
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
  const calculatedAlerts = calculateAlerts(talhao, cycles, alerts);

  const operationalEvents = records
    .filter(
      (record) =>
        !["areas", "talhao360-event", "talhao360-alert"].includes(record.module) &&
        belongsToTalhao(record, talhao),
    )
    .map((record) =>
      eventFromRecord({
        ...record,
        payload: {
          ...record.payload,
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
    alerts: calculatedAlerts,
    lastOperation: allEvents[0] ?? null,
    nextActivity: allEvents.find((event) => event.type.toLowerCase().includes("planej")) ?? null,
  };
}

function calculateAlerts(talhao: TalhaoRecord, cycles: TalhaoCycle[], existing: FieldAlert[]) {
  const alerts = [...existing];
  const add = (alert: FieldAlert) => {
    if (!alerts.some((item) => item.title === alert.title)) alerts.push(alert);
  };
  const base = {
    talhaoId: talhao.id,
    talhaoName: talhao.payload.talhao,
    status: "Aberto" as const,
  };
  const planned = Number(talhao.payload.custo_planejado_ha || 0);
  const realized = Number(talhao.payload.custo_realizado_ha || 0);
  if (planned > 0 && realized > planned) {
    add({
      ...base,
      id: `calculated-cost-${talhao.id}`,
      type: "Custo",
      severity: "Atenção",
      title: "Custo acima do planejado",
      description: `O custo realizado está ${Math.round(((realized - planned) / planned) * 100)}% acima do previsto.`,
      expectedImpact: "Redução da margem estimada.",
      recommendation: "Revisar operações, aplicações e compras pendentes.",
      season: talhao.payload.safra,
      cycle: talhao.payload.ciclo_atual,
    });
  }
  if (!talhao.payload.geometry_geojson) {
    add({
      ...base,
      id: `calculated-map-${talhao.id}`,
      type: "Mapa",
      severity: "Atenção",
      title: "Talhão sem geometria",
      description: "O limite físico ainda não foi desenhado.",
      expectedImpact: "Áreas e planejamento espacial podem ficar imprecisos.",
      recommendation: "Abra o mapa e desenhe o perímetro do talhão.",
    });
  }
  if (!cycles.length) {
    add({
      ...base,
      id: `calculated-cycle-${talhao.id}`,
      type: "Planejamento",
      severity: "Atenção",
      title: "Talhão sem ciclo planejado",
      description: "Nenhum ciclo produtivo foi encontrado.",
      recommendation: "Crie o ciclo atual ou o próximo uso da área.",
    });
  }
  const lastCycle = [...cycles].sort((a, b) => b.fimPrevisto.localeCompare(a.fimPrevisto))[0];
  if (lastCycle?.tipo === "Pousio" && !lastCycle.cultura) {
    add({
      ...base,
      id: `calculated-cover-${talhao.id}`,
      type: "Planejamento",
      severity: "Recomendação",
      title: "Pousio sem cobertura definida",
      description: "O ciclo de pousio não informa uma espécie de cobertura.",
      recommendation: "Definir cultura de cobertura para proteção e recuperação do solo.",
      season: lastCycle.safra,
      cycle: lastCycle.nome,
    });
  }
  const expected = Number(talhao.payload.produtividade_esperada || 0);
  const historical = Number(talhao.payload.produtividade_historica || 0);
  if (expected > 0 && historical > 0 && expected < historical) {
    add({
      ...base,
      id: `calculated-yield-${talhao.id}`,
      type: "Produtividade",
      severity: "Atenção",
      title: "Produtividade abaixo da média",
      description: "A expectativa atual está abaixo da média histórica.",
      recommendation: "Revisar manejo, população e condições agronômicas.",
    });
  }
  return alerts;
}

export async function saveTalhaoPayload(talhao: TalhaoRecord, patch: Partial<TalhaoPayload>) {
  if (talhao.id.startsWith("talhao-demo-")) {
    return saveDemoRecord({
      ...talhao,
      payload: cleanPayload({ ...talhao.payload, ...patch }),
      updated_at: new Date().toISOString(),
    });
  }
  return updateFieldRecord({
    id: talhao.id,
    payload: cleanPayload({ ...talhao.payload, ...patch }),
  });
}

export async function createTalhao(payload: TalhaoPayload) {
  return createFieldRecord({ module: "areas", payload: cleanPayload(payload) });
}

export async function createDemoTalhao(payload: TalhaoPayload) {
  return createDemoRecord("areas", cleanPayload(payload));
}

// Read the farm perimeter, preferring the dedicated record and falling back to
// the legacy value replicated onto any talhão.
export function farmGeometryFromRecords(records: FieldRecord[]): GeoJSON.Polygon | null {
  const farm = records.find((record) => record.module === FARM_MODULE);
  const dedicated = parsePolygon(farm?.payload.geometry_geojson);
  if (dedicated) return dedicated;
  const legacy = records.find(
    (record) => record.module === "areas" && record.payload.farm_geometry_geojson,
  );
  return parsePolygon(legacy?.payload.farm_geometry_geojson);
}

export async function saveFarm(
  records: FieldRecord[],
  geometry: GeoJSON.Polygon,
  metrics: { areaHa: number; perimeterKm: number },
  demoMode: boolean,
) {
  const payload = {
    geometry_geojson: JSON.stringify(geometry),
    area_ha: metrics.areaHa.toFixed(2),
    perimetro_km: metrics.perimeterKm.toFixed(3),
  };
  const existing = records.find((record) => record.module === FARM_MODULE);
  if (demoMode) {
    const now = new Date().toISOString();
    upsertDemoExtra({
      id: existing?.id ?? DEMO_FARM_ID,
      module: FARM_MODULE,
      payload: cleanPayload(payload),
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });
  } else if (existing) {
    await updateFieldRecord({
      id: existing.id,
      payload: cleanPayload({ ...existing.payload, ...payload }),
    });
  } else {
    await createFieldRecord({ module: FARM_MODULE, payload: cleanPayload(payload) });
  }
  // Replicate onto talhões so the per-talhão editor keeps seeing the perimeter.
  const talhoes = records.filter((record) => record.module === "areas").map(asTalhaoRecord);
  await Promise.all(
    talhoes.map((talhao) =>
      saveTalhaoPayload(talhao, {
        farm_geometry_geojson: payload.geometry_geojson,
        farm_area_ha: payload.area_ha,
        farm_perimeter_km: payload.perimetro_km,
      }),
    ),
  );
}

export async function saveCycles(talhao: TalhaoRecord, cycles: TalhaoCycle[]) {
  return saveTalhaoPayload(talhao, { ciclos_json: JSON.stringify(cycles) });
}

// Remove a talhão's drawn geometry (keeps the record and its cadastral fields).
export async function clearTalhaoGeometry(talhao: TalhaoRecord) {
  return saveTalhaoPayload(talhao, { geometry_geojson: "", perimetro_km: "" });
}

// Remove the farm perimeter: clears the dedicated record and the legacy copy
// replicated onto every talhão.
export async function clearFarmGeometry(records: FieldRecord[], demoMode: boolean) {
  const existing = records.find((record) => record.module === FARM_MODULE);
  const cleared = { geometry_geojson: "", area_ha: "", perimetro_km: "" };
  if (existing) {
    if (demoMode) {
      upsertDemoExtra({
        ...existing,
        payload: cleanPayload({ ...existing.payload, ...cleared }),
        updated_at: new Date().toISOString(),
      });
    } else {
      await updateFieldRecord({
        id: existing.id,
        payload: cleanPayload({ ...existing.payload, ...cleared }),
      });
    }
  }
  const talhoes = records.filter((record) => record.module === "areas").map(asTalhaoRecord);
  await Promise.all(
    talhoes.map((talhao) =>
      saveTalhaoPayload(talhao, {
        farm_geometry_geojson: "",
        farm_area_ha: "",
        farm_perimeter_km: "",
      }),
    ),
  );
}

export async function createTimelineEvent(talhao: TalhaoRecord, event: Omit<TimelineEvent, "id">) {
  const payload = {
    talhao_id: talhao.id,
    talhao: talhao.payload.talhao,
    ...Object.fromEntries(
      Object.entries(event).map(([key, value]) => [key, value == null ? "" : String(value)]),
    ),
  };
  return talhao.id.startsWith("talhao-demo-")
    ? createDemoRecord("talhao360-event", payload)
    : createFieldRecord({ module: "talhao360-event", payload });
}

export async function updateAlert(recordId: string, alert: FieldAlert) {
  const payload = cleanPayload({
    talhao_id: alert.talhaoId,
    talhao: alert.talhaoName,
    ...Object.fromEntries(
      Object.entries(alert).map(([key, value]) => [key, value == null ? "" : String(value)]),
    ),
  });
  if (recordId.startsWith("calculated-")) {
    return alert.talhaoId?.startsWith("talhao-demo-")
      ? createDemoRecord("talhao360-alert", payload)
      : createFieldRecord({ module: "talhao360-alert", payload });
  }
  if (recordId.startsWith("alert-") || recordId.startsWith("demo-")) {
    return saveDemoRecord({
      id: recordId,
      module: "talhao360-alert",
      payload,
      updated_at: new Date().toISOString(),
    });
  }
  return updateFieldRecord({
    id: recordId,
    payload,
  });
}
