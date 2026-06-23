import {
  calendarEventInputSchema,
  calendarEventSchema,
} from "@/features/campo-calendar/schemas/domain";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarStatusDefinition,
} from "@/features/campo-calendar/types";
import { demoCalendarEvents } from "@/features/campo-calendar/data/mocks";
import { defaultCalendarStatuses } from "@/features/campo-calendar/data/statuses";
import { calendarStatusDefinitionSchema } from "@/features/campo-calendar/schemas/status";

const STORAGE_KEY = "nery-campo-calendar-demo-events-v1";
const STATUS_STORAGE_KEY = "nery-campo-calendar-demo-statuses-v1";

export type CalendarDemoStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): CalendarDemoStorage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function cloneSeed() {
  return demoCalendarEvents.map((event) => ({ ...event, decisionOptions: [...event.decisionOptions] }));
}

export function listDemoCalendarEvents(
  storage: CalendarDemoStorage | undefined = browserStorage(),
): CalendarEvent[] {
  if (!storage) return cloneSeed();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return cloneSeed();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((event) => calendarEventSchema.parse(event)) : cloneSeed();
  } catch {
    return cloneSeed();
  }
}

function save(events: CalendarEvent[], storage: CalendarDemoStorage | undefined) {
  storage?.setItem(STORAGE_KEY, JSON.stringify(events));
  return events;
}

export function createDemoCalendarEvent(
  input: CalendarEventInput,
  storage: CalendarDemoStorage | undefined = browserStorage(),
) {
  const value = calendarEventInputSchema.parse(input);
  const now = new Date().toISOString();
  const event = calendarEventSchema.parse({
    ...value,
    id: `demo-calendar-${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  });
  save([event, ...listDemoCalendarEvents(storage)], storage);
  return event;
}

export function updateDemoCalendarEvent(
  event: CalendarEvent,
  storage: CalendarDemoStorage | undefined = browserStorage(),
) {
  const value = calendarEventSchema.parse({
    ...event,
    updatedAt: new Date().toISOString(),
  });
  const events = listDemoCalendarEvents(storage);
  save(events.map((item) => (item.id === value.id ? value : item)), storage);
  return value;
}

export function deleteDemoCalendarEvent(
  id: string,
  storage: CalendarDemoStorage | undefined = browserStorage(),
) {
  save(
    listDemoCalendarEvents(storage).filter((event) => event.id !== id),
    storage,
  );
}

export function resetDemoCalendarEvents(
  storage: CalendarDemoStorage | undefined = browserStorage(),
) {
  storage?.removeItem(STORAGE_KEY);
}

export function listDemoCalendarStatuses(
  storage: CalendarDemoStorage | undefined = browserStorage(),
): CalendarStatusDefinition[] {
  const raw = storage?.getItem(STATUS_STORAGE_KEY);
  if (!raw) return defaultCalendarStatuses.map((status) => ({ ...status }));
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((status) => calendarStatusDefinitionSchema.parse(status))
      : defaultCalendarStatuses.map((status) => ({ ...status }));
  } catch {
    return defaultCalendarStatuses.map((status) => ({ ...status }));
  }
}

export function saveDemoCalendarStatus(
  status: CalendarStatusDefinition,
  storage: CalendarDemoStorage | undefined = browserStorage(),
) {
  const value = calendarStatusDefinitionSchema.parse(status);
  const statuses = listDemoCalendarStatuses(storage);
  const next = statuses.some((item) => item.id === value.id)
    ? statuses.map((item) => (item.id === value.id ? value : item))
    : [...statuses, value];
  storage?.setItem(
    STATUS_STORAGE_KEY,
    JSON.stringify(next.sort((a, b) => a.order - b.order)),
  );
  return value;
}

export function resetDemoCalendarStatuses(
  storage: CalendarDemoStorage | undefined = browserStorage(),
) {
  storage?.removeItem(STATUS_STORAGE_KEY);
}
