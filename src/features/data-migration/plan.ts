import type { FieldRecord } from "@/lib/supabase-field";
import type { CalendarEvent, CalendarStatusDefinition } from "@/features/campo-calendar/types";
import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";
import { defaultCalendarStatuses } from "@/features/campo-calendar/data/statuses";
import type { LocalDataBundle } from "./local-data";

// Ids de dados de amostra (seeds) que NÃO devem ir para o banco real.
const TALHAO_SEED_IDS = new Set(demoTalhao360Records.map((record) => record.id));
const STATUS_SEED_IDS = new Set(defaultCalendarStatuses.map((status) => status.id));

const KNOWN_TALHAO_MODULES = new Set([
  "areas",
  "talhao360-farm",
  "talhao360-event",
  "talhao360-alert",
]);

export type MigrationPreview = {
  talhoes: FieldRecord[];
  farm: FieldRecord[];
  events: FieldRecord[];
  alerts: FieldRecord[];
  otherTalhao: FieldRecord[];
  calendarEvents: CalendarEvent[];
  calendarStatuses: CalendarStatusDefinition[];
};

// Junta os registros "extra" (criados pelo usuário) com os "overrides" (edições),
// dando precedência às edições e descartando amostras (seeds) e itens já migrados.
export function collectUserTalhaoRecords(
  bundle: LocalDataBundle,
  migratedIds: Set<string>,
): FieldRecord[] {
  const byId = new Map<string, FieldRecord>();
  for (const record of bundle.talhaoExtra ?? []) {
    if (record?.id) byId.set(record.id, record);
  }
  for (const [id, record] of Object.entries(bundle.talhaoOverrides ?? {})) {
    if (record?.id) byId.set(id, { ...record, id });
  }
  return [...byId.values()].filter(
    (record) => !TALHAO_SEED_IDS.has(record.id) && !migratedIds.has(record.id),
  );
}

export function buildPreview(bundle: LocalDataBundle, migratedIds: Set<string>): MigrationPreview {
  const records = collectUserTalhaoRecords(bundle, migratedIds);
  const byModule = (module: string) => records.filter((record) => record.module === module);
  return {
    talhoes: byModule("areas"),
    farm: byModule("talhao360-farm"),
    events: byModule("talhao360-event"),
    alerts: byModule("talhao360-alert"),
    otherTalhao: records.filter((record) => !KNOWN_TALHAO_MODULES.has(record.module)),
    calendarEvents: (bundle.calendarEvents ?? []).filter(
      (event) => event?.id?.startsWith("demo-calendar-") && !migratedIds.has(event.id),
    ),
    calendarStatuses: (bundle.calendarStatuses ?? []).filter(
      (status) => status?.id && !STATUS_SEED_IDS.has(status.id) && !migratedIds.has(status.id),
    ),
  };
}

export function totalCount(preview: MigrationPreview): number {
  return (
    preview.talhoes.length +
    preview.farm.length +
    preview.events.length +
    preview.alerts.length +
    preview.otherTalhao.length +
    preview.calendarEvents.length +
    preview.calendarStatuses.length
  );
}

export function isPreviewEmpty(preview: MigrationPreview): boolean {
  return totalCount(preview) === 0;
}

// Reescreve qualquer valor do payload que seja exatamente o id antigo de um talhão
// para o novo id gerado no banco — preserva as referências (eventos/alertas/calendário).
export function remapPayload(
  payload: Record<string, string>,
  idMap: Map<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    out[key] = idMap.get(value) ?? value;
  }
  return out;
}
