import { z } from "zod";
import {
  calendarPriorities,
  calendarSources,
  calendarVisibilities,
} from "@/features/campo-calendar/types";

const optionalText = z.string().trim().min(1).optional();
const instant = z.string().datetime({ offset: true });

const calendarEventObjectSchema = z.object({
    id: z.string().trim().min(1),
    farmKey: z.string().trim().min(1),
    fazenda: z.string().trim().min(1),
    talhaoId: optionalText,
    talhaoName: optionalText,
    seasonId: optionalText,
    safra: optionalText,
    cycleId: optionalText,
    ciclo: optionalText,
    title: z.string().trim().min(1),
    description: optionalText,
    eventType: z.string().trim().min(1),
    startsAt: instant,
    endsAt: instant.optional(),
    allDay: z.boolean(),
    statusId: z.string().trim().min(1),
    status: z.string().trim().min(1),
    priority: z.enum(calendarPriorities),
    responsibleId: optionalText,
    responsibleName: optionalText,
    source: z.enum(calendarSources),
    visibility: z.enum(calendarVisibilities),
    estimatedCost: z.number().nonnegative().optional(),
    delayCost: z.number().nonnegative().optional(),
    decisionOptions: z.array(z.string().trim().min(1)).default([]),
    decisionSelected: optionalText,
    weatherRisk: optionalText,
    weatherSummary: optionalText,
    relatedModule: optionalText,
    relatedRecordId: optionalText,
    templateId: optionalText,
    completedAt: instant.optional(),
    cancelledAt: instant.optional(),
    notes: optionalText,
    createdAt: instant,
    updatedAt: instant,
  });

function refineCalendarEvent(
  value: {
    startsAt: string;
    endsAt?: string;
    decisionOptions: string[];
    decisionSelected?: string;
  },
  context: z.RefinementCtx,
) {
    if (value.endsAt && Date.parse(value.endsAt) < Date.parse(value.startsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "O término deve ser igual ou posterior ao início.",
      });
    }
    if (
      value.decisionSelected &&
      value.decisionOptions.length &&
      !value.decisionOptions.includes(value.decisionSelected)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["decisionSelected"],
        message: "A decisão selecionada deve existir entre as opções.",
      });
    }
}

export const calendarEventSchema = calendarEventObjectSchema.superRefine(refineCalendarEvent);

export const calendarEventInputSchema = calendarEventObjectSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .superRefine(refineCalendarEvent);
