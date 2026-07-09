import { z } from "zod";
import { FASES, ORIGENS, SEXOS, SISTEMAS, STATUS_ANIMAL } from "@/features/pecuaria/types/domain";

// Schemas de validação (pt-BR nas mensagens). Reutilizados nos formulários de
// lote e animal. Campos opcionais aceitam string vazia → tratada como ausente.

const optionalText = z.string().trim().optional().or(z.literal(""));

export const loteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do lote"),
  fase: z.enum(FASES).optional(),
  sistema: z.enum(SISTEMAS).optional(),
  peso_alvo_kg: z
    .number({ invalid_type_error: "Peso inválido" })
    .positive("Peso deve ser positivo")
    .optional(),
  centro_custo_id: optionalText,
});
export type LoteForm = z.infer<typeof loteSchema>;

export const animalSchema = z.object({
  brinco_visual: optionalText,
  sisbov: optionalText,
  categoria: optionalText,
  sexo: z.enum(SEXOS).optional(),
  raca: optionalText,
  nascimento: optionalText,
  origem: z.enum(ORIGENS).optional(),
  lote_id: optionalText,
  status: z.enum(STATUS_ANIMAL).optional(),
});
export type AnimalForm = z.infer<typeof animalSchema>;

export const faixaSchema = z
  .object({
    brincoInicial: z.string().trim().min(1, "Informe o brinco inicial"),
    brincoFinal: z.string().trim().min(1, "Informe o brinco final"),
    categoria: optionalText,
    raca: optionalText,
    sexo: z.enum(SEXOS).optional(),
    loteId: optionalText,
    nascimento: optionalText,
  })
  .refine(
    (v) => {
      const a = Number.parseInt(v.brincoInicial, 10);
      const b = Number.parseInt(v.brincoFinal, 10);
      return Number.isFinite(a) && Number.isFinite(b) && b >= a;
    },
    { message: "Faixa inválida: brinco final deve ser ≥ inicial", path: ["brincoFinal"] },
  );
export type FaixaForm = z.infer<typeof faixaSchema>;
