import { z } from "zod";
import {
  calendarPriorities,
  calendarTabs,
  calendarViews,
} from "@/features/campo-calendar/types";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
  z.string().optional(),
);
const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && isoDate.test(value) ? value : undefined),
  z.string().optional(),
);

export const calendarSearchSchema = z.object({
  tab: z.enum(calendarTabs).catch("overview"),
  view: z.enum(calendarViews).catch("month"),
  date: z
    .string()
    .regex(isoDate)
    .catch(() => currentDate()),
  fieldId: optionalText,
  seasonId: optionalText,
  cycleId: optionalText,
  status: optionalText,
  responsible: optionalText,
  eventType: optionalText,
  priority: z.enum(calendarPriorities).optional().catch(undefined),
  dateFrom: optionalDate,
  dateTo: optionalDate,
});

export type CalendarSearchParams = z.infer<typeof calendarSearchSchema>;
