import type {
  CalendarEvent,
  CalendarEventFilters,
} from "@/features/campo-calendar/types";

export function calendarEventMatches(
  event: CalendarEvent,
  filters: CalendarEventFilters,
) {
  if (filters.fieldId && event.talhaoId !== filters.fieldId) return false;
  if (filters.seasonId && event.seasonId !== filters.seasonId) return false;
  if (filters.cycleId && event.cycleId !== filters.cycleId) return false;
  if (filters.status && event.status !== filters.status) return false;
  if (
    filters.responsible &&
    event.responsibleId !== filters.responsible &&
    event.responsibleName !== filters.responsible
  ) {
    return false;
  }
  if (filters.eventType && event.eventType !== filters.eventType) return false;
  if (filters.priority && event.priority !== filters.priority) return false;
  const eventStart = event.startsAt.slice(0, 10);
  const eventEnd = (event.endsAt || event.startsAt).slice(0, 10);
  if (filters.dateFrom && eventEnd < filters.dateFrom) return false;
  if (filters.dateTo && eventStart > filters.dateTo) return false;
  return true;
}

export function filterCalendarEvents(
  events: CalendarEvent[],
  filters: CalendarEventFilters,
) {
  return events.filter((event) => calendarEventMatches(event, filters));
}

export function calendarEventBelongsToContext(
  event: CalendarEvent,
  context: {
    talhaoId?: string;
    talhaoName?: string;
    cycleId?: string;
    ciclo?: string;
  },
) {
  const fieldMatches = context.talhaoId
    ? event.talhaoId === context.talhaoId
    : Boolean(context.talhaoName && event.talhaoName === context.talhaoName);
  const cycleMatches = context.cycleId
    ? event.cycleId === context.cycleId
    : !context.ciclo || event.ciclo === context.ciclo;
  return fieldMatches && cycleMatches;
}
