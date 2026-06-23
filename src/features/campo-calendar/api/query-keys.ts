import type { CalendarSearch } from "@/features/campo-calendar/types";

export const campoCalendarKeys = {
  root: ["campo-calendar"] as const,
  events: (demoMode: boolean) => [...campoCalendarKeys.root, "events", demoMode] as const,
  templates: (demoMode: boolean) => [...campoCalendarKeys.root, "templates", demoMode] as const,
  statuses: (demoMode: boolean) => [...campoCalendarKeys.root, "statuses", demoMode] as const,
  workspace: (demoMode: boolean) => [...campoCalendarKeys.root, "workspace", demoMode] as const,
  filtered: (demoMode: boolean, search: CalendarSearch) =>
    [...campoCalendarKeys.workspace(demoMode), "filtered", search] as const,
};
