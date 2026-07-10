import type { CalendarModel } from "@/features/campo-calendar/api/services";
import type { CalendarAlert, CalendarEvent } from "@/features/campo-calendar/types/domain";
import type { CalendarFilters } from "@/features/campo-calendar/lib/derive";
import type { DailyForecast } from "@/features/campo-calendar/lib/weather";
import type { CalendarCapabilities } from "@/features/campo-calendar/lib/capabilities";
import type { CalendarSearch } from "@/features/campo-calendar/schemas/navigation";
import type { useCalendarMutations } from "@/features/campo-calendar/hooks/use-campo-calendar";

/** Contrato único passado do shell (calendar-page) para cada subaba. */
export type CalendarTabProps = {
  model: CalendarModel;
  /** Eventos já filtrados pelos filtros globais. */
  events: CalendarEvent[];
  /** Todos os eventos (sem filtro) — para dedupe/relatórios completos. */
  allEvents: CalendarEvent[];
  filters: CalendarFilters;
  alerts: CalendarAlert[];
  forecast: DailyForecast[];
  now: Date;
  demoMode: boolean;
  capabilities: CalendarCapabilities;
  search: CalendarSearch;
  patchSearch: (patch: Partial<CalendarSearch>) => void;
  onCreate: (defaults?: { date?: string }) => void;
  onEdit: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  mutations: ReturnType<typeof useCalendarMutations>;
};
