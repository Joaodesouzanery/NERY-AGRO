import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";
import type { FieldRecord } from "@/lib/supabase-field";
import type {
  CalendarCycleOption,
  CalendarField,
  CalendarTalhao360Integration,
  CalendarTalhao360ManualEvent,
  CalendarWorkspace,
} from "@/features/campo-calendar/types";

const DEMO_OVERRIDES_KEY = "nery-talhao360-demo-overrides";
const DEMO_EXTRA_KEY = "nery-talhao360-demo-extra-records";

export function readDemoTalhao360CalendarRecords(): FieldRecord[] {
  if (typeof window === "undefined") return demoTalhao360Records;
  const overrides = readStorage<Record<string, FieldRecord>>(DEMO_OVERRIDES_KEY, {});
  const extra = readStorage<FieldRecord[]>(DEMO_EXTRA_KEY, []);
  return [...demoTalhao360Records.map((record) => overrides[record.id] ?? record), ...extra];
}

export function buildTalhao360CalendarIntegration(
  records: FieldRecord[],
): CalendarTalhao360Integration {
  const areas = records.filter((record) => record.module === "areas");
  const fieldNames = new Map(areas.map((record) => [record.id, record.payload.talhao || record.id]));
  const fieldIdsByName = new Map(
    areas
      .map((record) => [normalize(record.payload.talhao), record.id] as const)
      .filter(([name]) => Boolean(name)),
  );
  const cycles = areas.flatMap((record) => parseCyclesFromArea(record));
  const cycleIdsByFieldAndName = new Map(
    cycles.map((cycle) => [
      `${cycle.fieldId}:${normalize(cycle.name)}:${cycle.seasonId || ""}`,
      cycle.id,
    ]),
  );

  const manualEvents = records
    .filter((record) => record.module === "talhao360-event")
    .map((record) =>
      recordToManualEvent(record, fieldNames, fieldIdsByName, cycleIdsByFieldAndName),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    cycles,
    manualEvents,
    futurePatch:
      "Patch futuro no Talhão 360: expor um snapshot de ciclos/eventos por talhão para o Calendário consumir sem depender de parsing de field_records.",
  };
}

export function mergeTalhao360IntoCalendarWorkspace(
  workspace: CalendarWorkspace,
  integration: CalendarTalhao360Integration,
): CalendarWorkspace {
  const cyclesByField = new Map<string, CalendarCycleOption[]>();
  for (const cycle of integration.cycles) {
    const list = cyclesByField.get(cycle.fieldId) ?? [];
    list.push(cycle);
    cyclesByField.set(cycle.fieldId, list);
  }
  return {
    ...workspace,
    fields: workspace.fields.map((field) => {
      const cycles = cyclesByField.get(field.id);
      if (!cycles?.length) return field;
      return {
        ...field,
        cycles: mergeCycles(field.cycles, cycles),
      };
    }),
    talhao360: integration,
  };
}

export function recordsToCalendarFields(records: FieldRecord[]): CalendarField[] {
  return records
    .filter((record) => record.module === "areas")
    .map((record) => {
      const payload = record.payload;
      return {
        id: record.id,
        name: payload.talhao || "Talhão",
        code: payload.codigo || "Sem código",
        crop: payload.cultura || "Sem cultura",
        areaHa: numberValue(payload.area_ha) ?? 0,
        season: payload.safra || undefined,
        cycle: payload.ciclo_atual || undefined,
        status: payload.status || undefined,
        color: payload.cor_mapa || undefined,
        geometryGeoJson: payload.geometry_geojson || undefined,
        farmGeometryGeoJson: payload.farm_geometry_geojson || undefined,
        cycles: parseCyclesFromArea(record),
      };
    });
}

function parseCyclesFromArea(record: FieldRecord): CalendarCycleOption[] {
  try {
    const cycles = JSON.parse(record.payload.ciclos_json || "[]");
    if (!Array.isArray(cycles)) return [];
    const usefulArea = numberValue(record.payload.area_util) ?? numberValue(record.payload.area_ha);
    return cycles
      .filter((cycle): cycle is Record<string, unknown> => Boolean(cycle) && typeof cycle === "object")
      .map((cycle) => ({
        id: stringValue(cycle.id),
        fieldId: record.id,
        fieldName: record.payload.talhao || record.id,
        seasonId: stringValue(cycle.safra),
        name: stringValue(cycle.nome || cycle.cultura || "Ciclo"),
        crop: optionalString(cycle.cultura),
        type: optionalString(cycle.tipo),
        status: optionalString(cycle.status),
        areaHa: numberValue(cycle.areaHa),
        startsOn: optionalString(cycle.inicio),
        endsOn: optionalString(cycle.fimPrevisto),
        completedOn: optionalString(cycle.fimReal),
        usefulAreaHa: usefulArea,
        source: "talhao360" as const,
      }))
      .filter((cycle) => cycle.id && cycle.seasonId);
  } catch {
    return [];
  }
}

function recordToManualEvent(
  record: FieldRecord,
  fieldNames: Map<string, string>,
  fieldIdsByName: Map<string, string>,
  cycleIdsByFieldAndName: Map<string, string>,
): CalendarTalhao360ManualEvent {
  const payload = record.payload;
  const talhaoId = optionalString(payload.talhao_id) || fieldIdsByName.get(normalize(payload.talhao));
  const ciclo = optionalString(payload.cycle || payload.ciclo);
  const seasonId = optionalString(payload.season || payload.safra);
  return {
    id: `talhao360:${record.id}`,
    talhaoId,
    talhaoName: talhaoId ? fieldNames.get(talhaoId) || payload.talhao : optionalString(payload.talhao),
    date: optionalString(payload.date || payload.data) || record.created_at?.slice(0, 10) || "",
    type: optionalString(payload.type || payload.tipo) || "Observação",
    description: optionalString(payload.description || payload.observacao) || "Evento registrado no Talhão 360.",
    responsible: optionalString(payload.responsible || payload.responsavel),
    seasonId,
    cycleId:
      talhaoId && ciclo
        ? cycleIdsByFieldAndName.get(`${talhaoId}:${normalize(ciclo)}:${seasonId || ""}`)
        : undefined,
    ciclo,
    origin: payload.origin === "Automática" ? "Automática" : "Manual",
    impact: optionalString(payload.impact || payload.impacto),
    critical: payload.critical === "true",
    relatedRecordId: record.id,
  };
}

function mergeCycles(existing: CalendarCycleOption[], incoming: CalendarCycleOption[]) {
  const byId = new Map(existing.map((cycle) => [cycle.id, cycle]));
  for (const cycle of incoming) {
    byId.set(cycle.id, { ...byId.get(cycle.id), ...cycle });
  }
  return Array.from(byId.values()).sort((a, b) =>
    (a.startsOn || a.name).localeCompare(b.startsOn || b.name),
  );
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function stringValue(value: unknown) {
  return value == null ? "" : String(value);
}

function optionalString(value: unknown) {
  const normalized = stringValue(value).trim();
  return normalized || undefined;
}

function numberValue(value: unknown) {
  const parsed = Number(stringValue(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalize(value: unknown) {
  return stringValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
