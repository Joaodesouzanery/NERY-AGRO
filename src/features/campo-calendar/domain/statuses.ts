import type { FieldRecord } from "@/lib/supabase-field";
import { calendarStatusDefinitionSchema } from "@/features/campo-calendar/schemas/status";
import type {
  CalendarEvent,
  CalendarStatusDefinition,
} from "@/features/campo-calendar/types";

export function fieldRecordToCalendarStatus(record: FieldRecord): CalendarStatusDefinition {
  return calendarStatusDefinitionSchema.parse({
    id: record.payload.status_id || record.id,
    name: record.payload.name,
    color: record.payload.color || "#64748b",
    order: Number(record.payload.order || 0),
    active: record.payload.active !== "false",
    isDefault: record.payload.is_default === "true",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}

export function calendarStatusToPayload(status: CalendarStatusDefinition) {
  const value = calendarStatusDefinitionSchema.parse(status);
  return {
    status_id: value.id,
    name: value.name,
    color: value.color,
    order: String(value.order),
    active: String(value.active),
    is_default: String(value.isDefault),
  };
}

export function statusIsInUse(statusId: string, events: CalendarEvent[]) {
  return events.some((event) => event.statusId === statusId);
}
