import { z } from "zod";

export const calendarStatusDefinitionSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "Informe o nome do status."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Informe uma cor hexadecimal válida."),
  order: z.number().int().nonnegative(),
  active: z.boolean(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});
