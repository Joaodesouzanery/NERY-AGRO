import { z } from "zod";
import {
  calendarEventTypes,
  calendarPriorities,
  calendarSources,
  calendarVisibilities,
} from "@/features/campo-calendar/types/domain";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/, "Data inválida.");

// Validação do formulário de tarefa/evento. Regras estruturais (ciclo pertence
// ao talhão, safra compatível) entram via superRefine com o contexto do modelo.
export const calendarEventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título da tarefa."),
    description: z.string().optional(),
    eventType: z.enum(calendarEventTypes),
    startsAt: isoDate,
    endsAt: z.union([isoDate, z.literal("")]).optional(),
    allDay: z.boolean(),
    talhaoId: z.string().optional(),
    cycleId: z.string().optional(),
    safra: z.string().optional(),
    statusId: z.string().min(1, "Selecione um status."),
    priority: z.enum(calendarPriorities),
    responsibleName: z.string().optional(),
    visibility: z.enum(calendarVisibilities),
    source: z.enum(calendarSources).default("manual"),
    estimatedCost: z.union([z.number().min(0, "Custo não pode ser negativo."), z.nan()]).optional(),
    delayCost: z.union([z.number().min(0, "Custo não pode ser negativo."), z.nan()]).optional(),
    notes: z.string().optional(),
    decisionOptions: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endsAt && value.endsAt !== "" && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "O fim não pode ser anterior ao início.",
      });
    }
  });

export type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;

export const templateItemSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().trim().min(1, "Informe o título da tarefa padrão."),
  eventType: z.enum(calendarEventTypes),
  offsetDias: z.number().int("Use dias inteiros."),
  ancora: z.enum(["inicio", "fim", "anterior"]),
  responsavelSugerido: z.string().optional(),
  priority: z.enum(calendarPriorities),
  custoEstimado: z.number().min(0).optional(),
  obrigatorio: z.boolean(),
  observacao: z.string().optional(),
});

export const cycleTemplateSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do modelo."),
  cultura: z.string().trim().min(1, "Informe a cultura."),
  cicloTipo: z.string().trim().min(1, "Informe o tipo de ciclo."),
  regiao: z.string().optional(),
  regime: z.enum(["irrigado", "sequeiro", "ambos"]),
  duracaoDias: z.number().int().positive().optional(),
  ativo: z.boolean(),
  itens: z.array(templateItemSchema).min(1, "Adicione pelo menos uma tarefa padrão."),
});
