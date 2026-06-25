import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  max,
  min,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  CalendarCycleOption,
  CalendarEvent,
  CalendarField,
  CalendarSearch,
  CalendarTalhao360ManualEvent,
  CalendarWorkspace,
} from "@/features/campo-calendar/types";

export type CalendarTimelineConflictKind =
  | "cycle-area-overlap"
  | "resource-overlap"
  | "outside-cycle-window"
  | "harvest-invades-planting"
  | "critical-without-owner"
  | "weather-risk";

export type CalendarTimelineConflict = {
  id: string;
  kind: CalendarTimelineConflictKind;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  fieldId?: string;
  cycleId?: string;
  eventIds: string[];
  dataStatus: "ok" | "insufficient";
};

export type CalendarTimelineRow = {
  field: CalendarField;
  cycles: CalendarCycleOption[];
  calendarEvents: CalendarEvent[];
  manualEvents: CalendarTalhao360ManualEvent[];
  conflicts: CalendarTimelineConflict[];
  dataGaps: string[];
};

export type CalendarTimelineMonth = {
  key: string;
  label: string;
  date: Date;
};

export type CalendarTimelineModel = {
  rows: CalendarTimelineRow[];
  months: CalendarTimelineMonth[];
  startsOn: Date;
  endsOn: Date;
  dayWidth: number;
  monthWidth: number;
  totalWidth: number;
  conflicts: CalendarTimelineConflict[];
};

const MONTH_WIDTH = 172;

export function buildCalendarTimelineModel(
  workspace: CalendarWorkspace,
  events: CalendarEvent[],
  search: CalendarSearch,
): CalendarTimelineModel {
  const fields = search.fieldId
    ? workspace.fields.filter((field) => field.id === search.fieldId)
    : workspace.fields;
  const cycles = workspace.talhao360.cycles.filter((cycle) =>
    timelineCycleMatches(cycle, search),
  );
  const manualEvents = workspace.talhao360.manualEvents.filter((event) =>
    timelineManualEventMatches(event, search, events),
  );
  const bounds = timelineBounds(cycles, events, manualEvents, search.date);
  const months = timelineMonths(bounds.startsOn, bounds.endsOn);
  const totalDays = Math.max(1, differenceInCalendarDays(bounds.endsOn, bounds.startsOn) + 1);
  const monthCount = Math.max(1, months.length);
  const totalWidth = monthCount * MONTH_WIDTH;
  const dayWidth = totalWidth / totalDays;

  const rows = fields.map((field) => {
    const rowCycles = cycles.filter((cycle) => cycle.fieldId === field.id);
    const rowEvents = events.filter((event) => event.talhaoId === field.id);
    const rowManualEvents = manualEvents.filter((event) => event.talhaoId === field.id);
    const conflicts = detectTimelineConflicts(field, rowCycles, rowEvents);
    const dataGaps = dataGapsFor(field, rowCycles, rowEvents);
    return {
      field,
      cycles: rowCycles,
      calendarEvents: rowEvents,
      manualEvents: rowManualEvents,
      conflicts,
      dataGaps,
    };
  });

  return {
    rows,
    months,
    startsOn: bounds.startsOn,
    endsOn: bounds.endsOn,
    dayWidth,
    monthWidth: MONTH_WIDTH,
    totalWidth,
    conflicts: rows.flatMap((row) => row.conflicts),
  };
}

export function timelineItemStyle(
  start: string,
  end: string | undefined,
  model: Pick<CalendarTimelineModel, "startsOn" | "endsOn" | "dayWidth">,
) {
  const itemStart = clampDate(parseDateOnly(start), model.startsOn, model.endsOn);
  const itemEnd = clampDate(parseDateOnly(end || start), model.startsOn, model.endsOn);
  const left = Math.max(0, differenceInCalendarDays(itemStart, model.startsOn) * model.dayWidth);
  const width = Math.max(
    10,
    (differenceInCalendarDays(itemEnd, itemStart) + 1) * model.dayWidth,
  );
  return { left, width };
}

export function timelineManualEventMatches(
  event: CalendarTalhao360ManualEvent,
  search: CalendarSearch,
  calendarEvents: CalendarEvent[] = [],
) {
  if (calendarEvents.some((item) => item.relatedRecordId === event.relatedRecordId)) return false;
  if (search.fieldId && event.talhaoId !== search.fieldId) return false;
  if (search.seasonId && event.seasonId !== search.seasonId) return false;
  if (search.cycleId && event.cycleId !== search.cycleId) return false;
  if (search.responsible && event.responsible !== search.responsible) return false;
  if (search.eventType && event.type !== search.eventType) return false;
  if (search.dateFrom && event.date < search.dateFrom) return false;
  if (search.dateTo && event.date > search.dateTo) return false;
  return true;
}

function timelineCycleMatches(cycle: CalendarCycleOption, search: CalendarSearch) {
  if (search.fieldId && cycle.fieldId !== search.fieldId) return false;
  if (search.seasonId && cycle.seasonId !== search.seasonId) return false;
  if (search.cycleId && cycle.id !== search.cycleId) return false;
  if (search.dateFrom && cycle.endsOn && cycle.endsOn < search.dateFrom) return false;
  if (search.dateTo && cycle.startsOn && cycle.startsOn > search.dateTo) return false;
  return true;
}

function detectTimelineConflicts(
  field: CalendarField,
  cycles: CalendarCycleOption[],
  events: CalendarEvent[],
): CalendarTimelineConflict[] {
  return [
    ...cycleAreaOverlapConflicts(field, cycles),
    ...resourceOverlapConflicts(field, events),
    ...outsideCycleWindowConflicts(field, cycles, events),
    ...harvestInvadesPlantingConflicts(field, events),
    ...criticalWithoutOwnerConflicts(field, events),
    ...weatherRiskConflicts(field, events),
  ];
}

function cycleAreaOverlapConflicts(field: CalendarField, cycles: CalendarCycleOption[]) {
  const conflicts: CalendarTimelineConflict[] = [];
  for (let index = 0; index < cycles.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < cycles.length; otherIndex += 1) {
      const first = cycles[index];
      const second = cycles[otherIndex];
      if (!first.startsOn || !first.endsOn || !second.startsOn || !second.endsOn) continue;
      if (!rangesOverlap(first.startsOn, first.endsOn, second.startsOn, second.endsOn)) continue;
      const usefulArea = first.usefulAreaHa ?? second.usefulAreaHa ?? field.areaHa;
      if (!first.areaHa || !second.areaHa || !usefulArea) continue;
      if (first.areaHa + second.areaHa > usefulArea) {
        conflicts.push({
          id: `cycle-area-${field.id}-${first.id}-${second.id}`,
          kind: "cycle-area-overlap",
          severity: "critical",
          title: "Sobreposição de ciclos acima da área útil",
          description: `${first.name} e ${second.name} somam ${(first.areaHa + second.areaHa).toLocaleString("pt-BR")} ha para ${usefulArea.toLocaleString("pt-BR")} ha úteis.`,
          fieldId: field.id,
          cycleId: first.id,
          eventIds: [],
          dataStatus: "ok",
        });
      }
    }
  }
  return conflicts;
}

function resourceOverlapConflicts(field: CalendarField, events: CalendarEvent[]) {
  const conflicts: CalendarTimelineConflict[] = [];
  for (let index = 0; index < events.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < events.length; otherIndex += 1) {
      const first = events[index];
      const second = events[otherIndex];
      const firstResource = first.responsibleId || first.responsibleName;
      const secondResource = second.responsibleId || second.responsibleName;
      if (!firstResource || firstResource !== secondResource) continue;
      if (!rangesOverlap(dateOnly(first.startsAt), dateOnly(first.endsAt || first.startsAt), dateOnly(second.startsAt), dateOnly(second.endsAt || second.startsAt))) {
        continue;
      }
      conflicts.push({
        id: `resource-${field.id}-${first.id}-${second.id}`,
        kind: "resource-overlap",
        severity: "warning",
        title: "Recurso simultâneo",
        description: `${firstResource} aparece em tarefas sobrepostas.`,
        fieldId: field.id,
        eventIds: [first.id, second.id],
        dataStatus: "ok",
      });
    }
  }
  return conflicts;
}

function outsideCycleWindowConflicts(
  field: CalendarField,
  cycles: CalendarCycleOption[],
  events: CalendarEvent[],
) {
  return events.flatMap((event) => {
    const cycle = cycles.find(
      (item) =>
        (event.cycleId && item.id === event.cycleId) ||
        (!event.cycleId && event.ciclo && item.name === event.ciclo),
    );
    if (!event.cycleId && !event.ciclo) return [];
    if (!cycle?.startsOn || !cycle.endsOn) return [];
    const startsOn = dateOnly(event.startsAt);
    const endsOn = dateOnly(event.endsAt || event.startsAt);
    if (startsOn >= cycle.startsOn && endsOn <= cycle.endsOn) return [];
    return [
      {
        id: `outside-cycle-${field.id}-${event.id}`,
        kind: "outside-cycle-window" as const,
        severity: "warning" as const,
        title: "Tarefa fora da janela do ciclo",
        description: `${event.title} está fora de ${cycle.name}.`,
        fieldId: field.id,
        cycleId: cycle.id,
        eventIds: [event.id],
        dataStatus: "ok" as const,
      },
    ];
  });
}

function harvestInvadesPlantingConflicts(field: CalendarField, events: CalendarEvent[]) {
  const harvests = events.filter((event) => includesAny(event, ["colheita", "harvest"]));
  const plantings = events.filter((event) => includesAny(event, ["plantio", "planting"]));
  const conflicts: CalendarTimelineConflict[] = [];
  for (const harvest of harvests) {
    for (const planting of plantings) {
      if (harvest.id === planting.id) continue;
      if (dateOnly(harvest.endsAt || harvest.startsAt) >= dateOnly(planting.startsAt)) {
        conflicts.push({
          id: `harvest-planting-${field.id}-${harvest.id}-${planting.id}`,
          kind: "harvest-invades-planting",
          severity: "warning",
          title: "Colheita invadindo plantio",
          description: `${harvest.title} encosta na janela de ${planting.title}.`,
          fieldId: field.id,
          eventIds: [harvest.id, planting.id],
          dataStatus: "ok",
        });
      }
    }
  }
  return conflicts;
}

function criticalWithoutOwnerConflicts(field: CalendarField, events: CalendarEvent[]) {
  return events
    .filter((event) => event.priority === "Crítica" && !event.responsibleId && !event.responsibleName)
    .map((event) => ({
      id: `critical-owner-${field.id}-${event.id}`,
      kind: "critical-without-owner" as const,
      severity: "critical" as const,
      title: "Tarefa crítica sem responsável",
      description: `${event.title} precisa de dono operacional.`,
      fieldId: field.id,
      eventIds: [event.id],
      dataStatus: "ok" as const,
    }));
}

function weatherRiskConflicts(field: CalendarField, events: CalendarEvent[]) {
  return events
    .filter((event) => {
      const risk = event.weatherRisk?.toLowerCase() || "";
      return risk.includes("alto") || risk.includes("crítico") || risk.includes("critico");
    })
    .map((event) => ({
      id: `weather-${field.id}-${event.id}`,
      kind: "weather-risk" as const,
      severity: "warning" as const,
      title: "Janela climática desfavorável",
      description: event.weatherSummary || `${event.title} possui risco climático informado.`,
      fieldId: field.id,
      eventIds: [event.id],
      dataStatus: "ok" as const,
    }));
}

function dataGapsFor(
  field: CalendarField,
  cycles: CalendarCycleOption[],
  events: CalendarEvent[],
) {
  const gaps = new Set<string>();
  if (!cycles.length) gaps.add("dados insuficientes: ciclos não encontrados no Talhão 360");
  if (cycles.some((cycle) => !cycle.startsOn || !cycle.endsOn)) {
    gaps.add("dados insuficientes: ciclo sem início ou fim previsto");
  }
  if (cycles.some((cycle) => cycle.areaHa === undefined || !cycle.usefulAreaHa) && field.areaHa <= 0) {
    gaps.add("dados insuficientes: área útil do ciclo/talhão não informada");
  }
  if (events.some((event) => event.cycleId || event.ciclo) && !cycles.length) {
    gaps.add("dados insuficientes: vínculo de ciclo sem janela correspondente");
  }
  if (!events.some((event) => event.responsibleId || event.responsibleName)) {
    gaps.add("dados insuficientes: recurso/responsável não informado para detectar sobreposição");
  }
  return Array.from(gaps);
}

function timelineBounds(
  cycles: CalendarCycleOption[],
  events: CalendarEvent[],
  manualEvents: CalendarTalhao360ManualEvent[],
  fallbackDate: string,
) {
  const dates = [
    ...cycles.flatMap((cycle) => [cycle.startsOn, cycle.endsOn, cycle.completedOn]),
    ...events.flatMap((event) => [dateOnly(event.startsAt), dateOnly(event.endsAt || event.startsAt)]),
    ...manualEvents.map((event) => event.date),
    fallbackDate,
  ]
    .filter((value): value is string => Boolean(value))
    .map(parseDateOnly);
  const startsOn = startOfMonth(min(dates));
  const endsOn = endOfMonth(max(dates.map((date) => addDays(date, 15))));
  return { startsOn, endsOn };
}

function timelineMonths(startsOn: Date, endsOn: Date) {
  const months: CalendarTimelineMonth[] = [];
  let current = startOfMonth(startsOn);
  while (!isAfter(current, endsOn)) {
    months.push({
      key: format(current, "yyyy-MM"),
      label: format(current, "MMM/yy", { locale: ptBR }),
      date: current,
    });
    current = addMonths(current, 1);
  }
  return months;
}

function rangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  return firstStart <= secondEnd && secondStart <= firstEnd;
}

function includesAny(event: CalendarEvent, needles: string[]) {
  const value = `${event.title} ${event.eventType}`.toLowerCase();
  return needles.some((needle) => value.includes(needle));
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function parseDateOnly(value: string) {
  return parseISO(dateOnly(value));
}

function clampDate(date: Date, startsOn: Date, endsOn: Date) {
  if (isBefore(date, startsOn)) return startsOn;
  if (isAfter(date, endsOn)) return endsOn;
  return date;
}
