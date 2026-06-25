import { listAllFieldRecords } from "@/lib/supabase-field";
import { calendarModules } from "@/features/campo-calendar/api/field-record-repository";
import {
  listDemoCalendarEvents,
  listDemoCalendarStatuses,
} from "@/features/campo-calendar/api/demo-repository";
import {
  buildTalhao360CalendarIntegration,
  mergeTalhao360IntoCalendarWorkspace,
  readDemoTalhao360CalendarRecords,
  recordsToCalendarFields,
} from "@/features/campo-calendar/api/talhao360-calendar-adapter";
import { demoCalendarWorkspace } from "@/features/campo-calendar/data/mocks";
import { defaultCalendarStatuses } from "@/features/campo-calendar/data/statuses";
import { fieldRecordToCalendarEvent } from "@/features/campo-calendar/domain/adapters";
import { fieldRecordToCalendarStatus } from "@/features/campo-calendar/domain/statuses";
import type { CalendarWorkspace } from "@/features/campo-calendar/types";

export async function loadRealCalendarWorkspace(): Promise<CalendarWorkspace> {
  const records = await listAllFieldRecords();
  const areaPayload = records.find((record) => record.module === "areas")?.payload;
  const statuses = mergeStatuses(
    records
      .filter((record) => record.module === calendarModules.status)
      .map(fieldRecordToCalendarStatus),
  );
  const workspace: CalendarWorkspace = {
    farm: {
      key: areaPayload?.farm_key || slug(areaPayload?.fazenda || "fazenda-ativa"),
      name: areaPayload?.fazenda || "Fazenda ativa",
      location: [areaPayload?.cidade, areaPayload?.estado].filter(Boolean).join("/") || "—",
      season: areaPayload?.safra || "Safra não informada",
    },
    fields: recordsToCalendarFields(records),
    events: applyStatusNames(
      records
        .filter(
          (record) =>
            record.module === calendarModules.event || record.module === calendarModules.legacy,
        )
        .map(fieldRecordToCalendarEvent)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      statuses,
    ),
    statuses,
    talhao360: buildTalhao360CalendarIntegration(records),
  };
  return mergeTalhao360IntoCalendarWorkspace(workspace, workspace.talhao360);
}

export function loadDemoCalendarWorkspace(): CalendarWorkspace {
  const statuses = listDemoCalendarStatuses();
  const integration = buildTalhao360CalendarIntegration(readDemoTalhao360CalendarRecords());
  const workspace: CalendarWorkspace = {
    ...demoCalendarWorkspace,
    farm: { ...demoCalendarWorkspace.farm },
    fields: demoCalendarWorkspace.fields.map((field) => ({
      ...field,
      cycles: field.cycles.map((cycle) => ({ ...cycle })),
    })),
    events: applyStatusNames(listDemoCalendarEvents(), statuses),
    statuses,
    talhao360: integration,
  };
  return mergeTalhao360IntoCalendarWorkspace(workspace, integration);
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
