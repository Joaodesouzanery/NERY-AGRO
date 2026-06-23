import { listFieldRecords } from "@/lib/supabase-field";
import { listRealCalendarEvents } from "@/features/campo-calendar/api/field-record-repository";
import {
  listDemoCalendarEvents,
  listDemoCalendarStatuses,
} from "@/features/campo-calendar/api/demo-repository";
import { demoCalendarWorkspace } from "@/features/campo-calendar/data/mocks";
import type { CalendarWorkspace } from "@/features/campo-calendar/types";
import { listRealCalendarStatuses } from "@/features/campo-calendar/api/field-record-repository";
import { fieldRecordToCalendarStatus } from "@/features/campo-calendar/domain/statuses";
import { defaultCalendarStatuses } from "@/features/campo-calendar/data/statuses";

export async function loadRealCalendarWorkspace(): Promise<CalendarWorkspace> {
  const [events, fields, statusRecords] = await Promise.all([
    listRealCalendarEvents(),
    listFieldRecords("areas"),
    listRealCalendarStatuses(),
  ]);
  const first = fields[0]?.payload;
  const statuses = mergeStatuses(statusRecords.map(fieldRecordToCalendarStatus));
  return {
    farm: {
      key: first?.farm_key || slug(first?.fazenda || "fazenda-ativa"),
      name: first?.fazenda || "Fazenda ativa",
      location: [first?.cidade, first?.estado].filter(Boolean).join("/") || "—",
      season: first?.safra || "Safra não informada",
    },
    fields: fields.map((record) => ({
      id: record.id,
      name: record.payload.talhao || "Talhão",
      code: record.payload.codigo || "Sem código",
      crop: record.payload.cultura || "Sem cultura",
      areaHa: Number(record.payload.area_ha || 0),
      season: record.payload.safra || undefined,
      cycle: record.payload.ciclo_atual || undefined,
      status: record.payload.status || undefined,
      color: record.payload.cor_mapa || undefined,
      geometryGeoJson: record.payload.geometry_geojson || undefined,
      farmGeometryGeoJson: record.payload.farm_geometry_geojson || undefined,
      cycles: parseFieldCycles(record.id, record.payload.ciclos_json),
    })),
    events: applyStatusNames(events, statuses),
    statuses,
  };
}

export function loadDemoCalendarWorkspace(): CalendarWorkspace {
  const statuses = listDemoCalendarStatuses();
  return {
    ...demoCalendarWorkspace,
    farm: { ...demoCalendarWorkspace.farm },
    fields: demoCalendarWorkspace.fields.map((field) => ({ ...field })),
    events: applyStatusNames(listDemoCalendarEvents(), statuses),
    statuses,
  };
}

function parseFieldCycles(fieldId: string, raw: string | undefined) {
  try {
    const cycles = JSON.parse(raw || "[]");
    return Array.isArray(cycles)
      ? cycles
          .filter(
            (cycle): cycle is Record<string, unknown> =>
              Boolean(cycle) && typeof cycle === "object",
          )
          .map((cycle) => ({
            id: String(cycle.id || ""),
            fieldId,
            seasonId: String(cycle.safra || ""),
            name: String(cycle.nome || cycle.cultura || "Ciclo"),
            crop: cycle.cultura ? String(cycle.cultura) : undefined,
          }))
          .filter((cycle) => cycle.id && cycle.seasonId)
      : [];
  } catch {
    return [];
  }
}

function mergeStatuses(custom: CalendarWorkspace["statuses"]) {
  const byId = new Map(defaultCalendarStatuses.map((status) => [status.id, status]));
  for (const status of custom) byId.set(status.id, status);
  return Array.from(byId.values()).sort((a, b) => a.order - b.order);
}

function applyStatusNames(
  events: CalendarWorkspace["events"],
  statuses: CalendarWorkspace["statuses"],
) {
  const names = new Map(statuses.map((status) => [status.id, status.name]));
  return events.map((event) => ({
    ...event,
    status: names.get(event.statusId) || event.status,
  }));
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
