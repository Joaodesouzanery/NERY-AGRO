import { addDays, differenceInCalendarDays, isWithinInterval, parseISO } from "date-fns";
import type {
  CalendarEvent,
  CalendarField,
} from "@/features/campo-calendar/types";

function isOpenStatus(event: CalendarEvent) {
  return !["completed", "cancelled"].includes(event.statusId);
}

export function buildCalendarOverview(
  events: CalendarEvent[],
  fields: CalendarField[],
  referenceDate: string,
) {
  const reference = parseISO(referenceDate);
  const today = events.filter((event) => event.startsAt.slice(0, 10) === referenceDate);
  const next7 = events.filter((event) => {
    const date = parseISO(event.startsAt);
    return (
      isOpenStatus(event) &&
      isWithinInterval(date, { start: reference, end: addDays(reference, 7) })
    );
  });
  const decisions = events.filter(
    (event) =>
      event.decisionOptions.length > 0 &&
      !event.decisionSelected &&
      isOpenStatus(event),
  );
  const purchases = events.filter(
    (event) => event.eventType.toLowerCase() === "compra" && isOpenStatus(event),
  );
  const scheduledFieldIds = new Set(
    next7
      .filter((event) => event.source !== "Clima")
      .map((event) => event.talhaoId)
      .filter((value): value is string => Boolean(value)),
  );
  const scheduledArea = fields
    .filter((field) => scheduledFieldIds.has(field.id))
    .reduce((sum, field) => sum + field.areaHa, 0);
  const harvests = events
    .filter(
      (event) =>
        event.eventType.toLowerCase() === "colheita" &&
        isOpenStatus(event) &&
        differenceInCalendarDays(parseISO(event.startsAt), reference) >= 0,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    today,
    overdue: events.filter(
      (event) =>
        event.statusId === "delayed" ||
        (isOpenStatus(event) && event.startsAt.slice(0, 10) < referenceDate),
    ),
    next7,
    decisions,
    purchases,
    scheduledArea,
    nextHarvest: harvests[0] ?? null,
    cost7: costThrough(events, reference, 7),
    cost15: costThrough(events, reference, 15),
    cost30: costThrough(events, reference, 30),
    criticalAlerts: events.filter(
      (event) =>
        event.priority === "Crítica" &&
        (event.source === "Alerta" || Boolean(event.weatherRisk)) &&
        isOpenStatus(event),
    ),
    statusDistribution: statusDistribution(events),
    cashFlow: [7, 15, 30].map((days) => ({
      label: `${days} dias`,
      value: costThrough(events, reference, days),
    })),
  };
}

function costThrough(events: CalendarEvent[], reference: Date, days: number) {
  return events
    .filter((event) => {
      const date = parseISO(event.startsAt);
      return (
        isOpenStatus(event) &&
        isWithinInterval(date, { start: reference, end: addDays(reference, days) })
      );
    })
    .reduce((sum, event) => sum + (event.estimatedCost ?? 0), 0);
}

function statusDistribution(events: CalendarEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.status, (counts.get(event.status) ?? 0) + 1);
  return Array.from(counts, ([status, value]) => ({ status, value })).sort(
    (a, b) => b.value - a.value,
  );
}
