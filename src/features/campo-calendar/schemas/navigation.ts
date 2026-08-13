import { z } from "zod";

export const calendarTabs = ["geral", "calendario", "tarefas", "modelos", "relatorios"] as const;
export type CalendarTab = (typeof calendarTabs)[number];

export const calendarViews = ["mes", "semana", "agenda", "gantt"] as const;
export type CalendarView = (typeof calendarViews)[number];

const optionalParam = z.string().min(1).optional().catch(undefined);

// Subabas consolidadas: a antiga "linha-tempo" virou a visualização Gantt do
// Calendário e "decisoes" mora na Visão Geral — links salvos redirecionam.
function normalizeLegacyTabs(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.tab === "linha-tempo") return { ...record, tab: "calendario", view: "gantt" };
    if (record.tab === "decisoes") return { ...record, tab: "geral" };
  }
  return value;
}

// Filtros globais persistidos na URL: refresh preserva contexto, links são
// compartilháveis e o Talhão 360 pode abrir o Calendário já filtrado.
export const calendarSearchSchema = z.preprocess(
  normalizeLegacyTabs,
  z.object({
    tab: z.enum(calendarTabs).catch("geral"),
    view: z.enum(calendarViews).catch("mes"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .catch(undefined),
    fieldId: optionalParam,
    seasonId: optionalParam,
    cycleId: optionalParam,
    status: optionalParam,
    responsible: optionalParam,
    eventType: optionalParam,
    priority: optionalParam,
  }),
);

export type CalendarSearch = z.infer<typeof calendarSearchSchema>;

export const emptyCalendarSearch: CalendarSearch = { tab: "geral", view: "mes" };
