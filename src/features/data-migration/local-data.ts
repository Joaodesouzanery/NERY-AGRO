import type { FieldRecord } from "@/lib/supabase-field";
import type { CalendarEvent, CalendarStatusDefinition } from "@/features/campo-calendar/types";

// Chaves do localStorage onde o modo DEMO guarda os dados criados pelo usuário.
// Mantidas em sincronia com talhao-360/api/services.ts e campo-calendar/api/demo-repository.ts.
export const LOCAL_KEYS = {
  talhaoExtra: "nery-talhao360-demo-extra-records",
  talhaoOverrides: "nery-talhao360-demo-overrides",
  calendarEvents: "nery-campo-calendar-demo-events-v1",
  calendarStatuses: "nery-campo-calendar-demo-statuses-v1",
} as const;

// Registro do que já foi migrado, para evitar inserções duplicadas em re-execuções.
export const MIGRATION_LOG_KEY = "nery-migration-log-v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export type LocalDataBundle = {
  talhaoExtra: FieldRecord[];
  talhaoOverrides: Record<string, FieldRecord>;
  calendarEvents: CalendarEvent[];
  calendarStatuses: CalendarStatusDefinition[];
};

export function readLocalDataBundle(): LocalDataBundle {
  return {
    talhaoExtra: read<FieldRecord[]>(LOCAL_KEYS.talhaoExtra, []),
    talhaoOverrides: read<Record<string, FieldRecord>>(LOCAL_KEYS.talhaoOverrides, {}),
    calendarEvents: read<CalendarEvent[]>(LOCAL_KEYS.calendarEvents, []),
    calendarStatuses: read<CalendarStatusDefinition[]>(LOCAL_KEYS.calendarStatuses, []),
  };
}

export type MigrationLog = { migratedIds: string[]; at?: string };

export function readMigrationLog(): MigrationLog {
  return read<MigrationLog>(MIGRATION_LOG_KEY, { migratedIds: [] });
}

export function appendMigrationLog(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  const prev = readMigrationLog();
  const merged = Array.from(new Set([...(prev.migratedIds ?? []), ...ids]));
  window.localStorage.setItem(
    MIGRATION_LOG_KEY,
    JSON.stringify({ migratedIds: merged, at: new Date().toISOString() }),
  );
}

// Backup completo e legível dos dados locais — para o usuário guardar antes de migrar.
export function buildBackupBlob(bundle: LocalDataBundle): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "nery-agro",
      keys: LOCAL_KEYS,
      data: bundle,
    },
    null,
    2,
  );
}
