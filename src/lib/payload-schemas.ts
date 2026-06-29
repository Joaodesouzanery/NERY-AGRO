import { z } from "zod";

// Validação leve de payloads (jsonb stringly-typed) antes de gravar. Cobre os
// módulos de maior valor; os demais passam sem validação até ganharem schema.
// Padrão incremental: adicione entradas em SCHEMAS por módulo.

const numericish = z
  .string()
  .optional()
  .refine(
    (value) =>
      value == null || value === "" || Number.isFinite(Number(String(value).replace(",", "."))),
    "deve ser um número",
  );
const required = z.string().trim().min(1, "obrigatório");

const SCHEMAS: Record<string, z.ZodType> = {
  // Financeiro
  fluxo: z.object({ descricao: required, valor: numericish }).passthrough(),
  custos: z
    .object({ produto: required, custo_total: numericish, quantidade: numericish })
    .passthrough(),
  autorizacao: z
    .object({ centro_custo: required, valor_autorizado: numericish, valor_alocado: numericish })
    .passthrough(),
};

export function validatePayload(
  module: string,
  payload: Record<string, string>,
): { ok: true } | { ok: false; error: string } {
  const schema = SCHEMAS[module];
  if (!schema) return { ok: true };
  const result = schema.safeParse(payload);
  if (result.success) return { ok: true };
  const issue = result.error.issues[0];
  const field = issue?.path.join(".") || "campo";
  return { ok: false, error: `${field}: ${issue?.message ?? "inválido"}` };
}
