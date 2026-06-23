import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  CalendarEvent,
  CalendarView,
} from "@/features/campo-calendar/types";

export type CalendarPeriod = {
  start: Date;
  end: Date;
  days: Date[];
};

export function getCalendarPeriod(date: Date, view: CalendarView): CalendarPeriod {
  if (view === "week") {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }
  if (view === "agenda") {
    const start = startOfDay(date);
    const end = addDays(start, 30);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
  return { start, end, days: eachDayOfInterval({ start, end }) };
}

export function moveCalendarDate(date: Date, view: CalendarView, direction: -1 | 1) {
  if (view === "month") return addMonths(date, direction);
  if (view === "week") return addDays(date, direction * 7);
  return addDays(date, direction * 30);
}

export function eventTouchesCalendarDay(event: CalendarEvent, day: Date) {
  const dayKey = format(day, "yyyy-MM-dd");
  const startKey = event.startsAt.slice(0, 10);
  const endKey = (event.endsAt || event.startsAt).slice(0, 10);
  return startKey <= dayKey && endKey >= dayKey;
}

export function eventOverlapsPeriod(
  event: CalendarEvent,
  start: Date,
  end: Date,
) {
  const startKey = format(start, "yyyy-MM-dd");
  const endKey = format(end, "yyyy-MM-dd");
  const eventStart = event.startsAt.slice(0, 10);
  const eventEnd = (event.endsAt || event.startsAt).slice(0, 10);
  return eventStart <= endKey && eventEnd >= startKey;
}

export function eventsOnCalendarDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((event) => eventTouchesCalendarDay(event, day))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function agendaGroups(events: CalendarEvent[], period: CalendarPeriod) {
  return period.days
    .map((day) => ({ day, events: eventsOnCalendarDay(events, day) }))
    .filter((group) => group.events.length > 0);
}

export function calendarPeriodLabel(date: Date, view: CalendarView) {
  if (view === "week") {
    const { start, end } = getCalendarPeriod(date, view);
    return `${format(start, "dd/MM")} – ${format(end, "dd/MM/yyyy")}`;
  }
  if (view === "agenda") {
    const { end } = getCalendarPeriod(date, view);
    return `${format(date, "dd/MM")} – ${format(end, "dd/MM/yyyy")}`;
  }
  return format(parseISO(format(date, "yyyy-MM-dd")), "MMMM 'de' yyyy", {
    locale: ptBR,
  });
}

export function eventCalendarKind(event: CalendarEvent) {
  const type = event.eventType.toLocaleLowerCase("pt-BR");
  if (event.source === "Clima") {
    return event.startsAt.slice(0, 10) >= format(new Date(), "yyyy-MM-dd")
      ? "Previsão climática"
      : "Registro climático";
  }
  if (event.source === "Alerta" || type.includes("alerta")) return "Alerta";
  if (event.source === "Decisão" || type.includes("decis")) return "Decisão";
  if (type === "compra") return "Compra";
  if (type.includes("plantio")) return "Plantio";
  if (type.includes("colheita")) return "Colheita";
  if (type.includes("opera")) return "Operação";
  return "Tarefa";
}

export function isMultiDayEvent(event: CalendarEvent) {
  return Boolean(event.endsAt && event.endsAt.slice(0, 10) !== event.startsAt.slice(0, 10));
}
