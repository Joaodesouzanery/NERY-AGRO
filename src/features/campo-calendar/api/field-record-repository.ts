import {
  createFieldRecord,
  deleteFieldRecord,
  listFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import {
  calendarEventToPayload,
  fieldRecordToCalendarEvent,
} from "@/features/campo-calendar/domain/adapters";
import {
  calendarEventInputSchema,
  calendarEventSchema,
} from "@/features/campo-calendar/schemas/domain";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarStatusDefinition,
} from "@/features/campo-calendar/types";
import {
  calendarStatusToPayload,
  fieldRecordToCalendarStatus,
} from "@/features/campo-calendar/domain/statuses";

export const calendarModules = {
  event: "calendar-event",
  template: "calendar-template",
  status: "calendar-status",
  legacy: "calendario",
} as const;

export async function listRealCalendarEvents(): Promise<CalendarEvent[]> {
  const [canonical, legacy] = await Promise.all([
    listFieldRecords(calendarModules.event),
    listFieldRecords(calendarModules.legacy),
  ]);
  return [...canonical, ...legacy]
    .map(fieldRecordToCalendarEvent)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function createRealCalendarEvent(
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  const value = calendarEventInputSchema.parse(input);
  const now = new Date().toISOString();
  const event = calendarEventSchema.parse({
    ...value,
    id: "pending",
    createdAt: now,
    updatedAt: now,
  });
  const record = await createFieldRecord({
    module: calendarModules.event,
    payload: calendarEventToPayload(event),
  });
  return fieldRecordToCalendarEvent(record);
}

export async function updateRealCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
  if (event.source === "Legado") {
    throw new Error("Registros legados não são migrados automaticamente.");
  }
  const value = calendarEventSchema.parse({
    ...event,
    updatedAt: new Date().toISOString(),
  });
  const record = await updateFieldRecord({
    id: value.id,
    payload: calendarEventToPayload(value),
  });
  return fieldRecordToCalendarEvent(record);
}

export async function deleteRealCalendarEvent(event: CalendarEvent): Promise<void> {
  if (event.source === "Legado") {
    throw new Error("Registros legados não são removidos pelo domínio canônico.");
  }
  await deleteFieldRecord(event.id);
}

export function listRealCalendarTemplates(): Promise<FieldRecord[]> {
  return listFieldRecords(calendarModules.template);
}

export function listRealCalendarStatuses(): Promise<FieldRecord[]> {
  return listFieldRecords(calendarModules.status);
}

export function createRealCalendarTemplate(payload: Record<string, string>) {
  return createFieldRecord({ module: calendarModules.template, payload });
}

export function createRealCalendarStatus(payload: Record<string, string>) {
  return createFieldRecord({ module: calendarModules.status, payload });
}

export async function saveRealCalendarStatus(
  status: CalendarStatusDefinition,
): Promise<CalendarStatusDefinition> {
  const existing = (await listRealCalendarStatuses()).find(
    (record) => (record.payload.status_id || record.id) === status.id,
  );
  const record = existing
    ? await updateFieldRecord({
        id: existing.id,
        payload: calendarStatusToPayload(status),
      })
    : await createFieldRecord({
        module: calendarModules.status,
        payload: calendarStatusToPayload(status),
      });
  return fieldRecordToCalendarStatus(record);
}
