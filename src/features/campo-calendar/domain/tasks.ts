import { calendarEventInputSchema } from "@/features/campo-calendar/schemas/domain";
import { defaultStatusIdByName } from "@/features/campo-calendar/data/statuses";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarField,
  CalendarStatus,
} from "@/features/campo-calendar/types";

export function validateCalendarEventContext(
  input: CalendarEventInput,
  fields: CalendarField[],
) {
  const value = calendarEventInputSchema.parse(input);
  if (value.cycleId && !value.talhaoId) {
    throw new Error("Selecione o talhão antes de informar o ciclo.");
  }
  const field = value.talhaoId
    ? fields.find((item) => item.id === value.talhaoId)
    : undefined;
  if (value.talhaoId && !field) throw new Error("O talhão selecionado não está disponível.");
  if (value.cycleId) {
    const cycle = field?.cycles.find((item) => item.id === value.cycleId);
    if (!cycle) throw new Error("O ciclo selecionado não pertence ao talhão.");
    if (value.seasonId && cycle.seasonId !== value.seasonId) {
      throw new Error("A safra não é compatível com o ciclo selecionado.");
    }
  } else if (field?.season && value.seasonId && field.season !== value.seasonId) {
    throw new Error("A safra não é compatível com o talhão selecionado.");
  }
  return value;
}

export function transitionCalendarEvent(
  event: CalendarEvent,
  status: CalendarStatus,
  statusId = defaultStatusIdByName[status] || event.statusId,
  now = new Date().toISOString(),
) {
  return {
    ...event,
    status,
    statusId,
    completedAt: statusId === "completed" ? now : undefined,
    cancelledAt: statusId === "cancelled" ? now : undefined,
  };
}

export function reopenCalendarEvent(event: CalendarEvent, now = new Date().toISOString()) {
  return {
    ...event,
    status: "Pendente",
    statusId: "pending",
    completedAt: undefined,
    cancelledAt: undefined,
    updatedAt: now,
  } satisfies CalendarEvent;
}

export function duplicateCalendarEvent(event: CalendarEvent): CalendarEventInput {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    completedAt: _completedAt,
    cancelledAt: _cancelledAt,
    ...input
  } = event;
  return {
    ...input,
    title: `${event.title} (cópia)`,
    statusId: "planned",
    status: "Planejada",
    source: "Manual",
  };
}

export function visualCalendarStatus(event: CalendarEvent, referenceDate: string) {
  if (
    !["completed", "cancelled", "delayed"].includes(event.statusId) &&
    event.startsAt.slice(0, 10) < referenceDate
  ) {
    return "Atrasada";
  }
  return event.status;
}

export function removeStatusGuard(
  statusId: string,
  events: CalendarEvent[],
  remapStatusId?: string,
) {
  const inUse = events.some((event) => event.statusId === statusId);
  if (inUse && !remapStatusId) {
    throw new Error("O status está em uso. Escolha um status para remapeamento.");
  }
  return { inUse, remapStatusId };
}
