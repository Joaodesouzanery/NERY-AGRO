import { createFieldRecord } from "@/lib/supabase-field";
import { calendarEventToPayload } from "@/features/campo-calendar/domain/adapters";
import { calendarStatusToPayload } from "@/features/campo-calendar/domain/statuses";
import {
  appendMigrationLog,
  readLocalDataBundle,
  readMigrationLog,
  type LocalDataBundle,
} from "./local-data";
import { buildPreview, remapPayload, totalCount } from "./plan";

export type MigrationProgress = { step: string; done: number; total: number };

export type MigrationResult = {
  inserted: number;
  failed: number;
  migratedIds: string[];
  errors: { id: string; module: string; message: string }[];
  log: string[];
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Executa a migração dos dados locais para o Supabase (modo REAL).
// Insere talhões primeiro para mapear os ids antigos -> novos e então reescreve
// as referências de eventos, alertas e eventos de calendário.
export async function runMigration(
  bundle: LocalDataBundle = readLocalDataBundle(),
  onProgress?: (progress: MigrationProgress) => void,
): Promise<MigrationResult> {
  const migratedIds = new Set(readMigrationLog().migratedIds ?? []);
  const preview = buildPreview(bundle, migratedIds);
  const total = totalCount(preview);
  const idMap = new Map<string, string>();
  const result: MigrationResult = {
    inserted: 0,
    failed: 0,
    migratedIds: [],
    errors: [],
    log: [],
  };

  let done = 0;
  const tick = (step: string) => onProgress?.({ step, done: ++done, total });

  const insert = async (
    oldId: string,
    module: string,
    payload: Record<string, string>,
    label: string,
    onCreatedId?: (newId: string) => void,
  ) => {
    try {
      const created = await createFieldRecord({ module, payload });
      onCreatedId?.(created.id);
      result.inserted += 1;
      result.migratedIds.push(oldId);
      result.log.push(`✓ ${label} → ${created.id}`);
    } catch (error) {
      result.failed += 1;
      result.errors.push({ id: oldId, module, message: message(error) });
      result.log.push(`✗ ${label}: ${message(error)}`);
    }
    tick(module);
  };

  // 1) Talhões (constroem o mapa de ids).
  for (const talhao of preview.talhoes) {
    await insert(
      talhao.id,
      "areas",
      talhao.payload,
      `Talhão ${talhao.payload.talhao || talhao.id}`,
      (newId) => idMap.set(talhao.id, newId),
    );
  }

  // 2) Perímetro da fazenda, eventos, alertas e demais módulos do talhão (com remap).
  for (const record of [
    ...preview.farm,
    ...preview.events,
    ...preview.alerts,
    ...preview.otherTalhao,
  ]) {
    await insert(record.id, record.module, remapPayload(record.payload, idMap), record.module);
  }

  // 3) Status do calendário.
  for (const status of preview.calendarStatuses) {
    await insert(
      status.id,
      "calendar-status",
      calendarStatusToPayload(status),
      `Status ${status.name}`,
    );
  }

  // 4) Eventos do calendário (com remap das referências de talhão).
  for (const event of preview.calendarEvents) {
    await insert(
      event.id,
      "calendar-event",
      remapPayload(calendarEventToPayload(event), idMap),
      `Evento ${event.title}`,
    );
  }

  appendMigrationLog(result.migratedIds);
  return result;
}
