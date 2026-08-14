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

// `preprocess` porque nem todo chamador manda a chave: o formulário de remessa
// monta o payload só com o que foi preenchido, e ali `z.string()` responderia
// "Required" — em inglês, e sem dizer que o campo é obrigatório.
const obrigatorio = z.preprocess(
  (v) => (v == null ? "" : v),
  z.string().trim().min(1, "obrigatório"),
);

/**
 * Campos sem os quais a linha não é encontrável depois. Esta lista é a FONTE:
 * o asterisco no formulário, o bloqueio do Salvar e o bloqueio da importação
 * de planilha saem todos daqui.
 *
 * Três telas, uma lista — porque duplicar isso significa que a primeira delas
 * a ganhar campo novo passa a discordar das outras duas, e o produto fica
 * exigindo coisas diferentes conforme o caminho que a pessoa usou para entrar.
 *
 * Deliberadamente CURTA. Cadastrar incompleto e completar depois é o fluxo
 * real: a base existe antes de alguém ir até lá pegar a coordenada, e o
 * veículo é cadastrado quando chega, não quando a documentação fica pronta.
 */
export const CAMPOS_OBRIGATORIOS: Record<string, string[]> = {
  // Financeiro — só documenta o que os schemas abaixo já exigem.
  fluxo: ["descricao"],
  custos: ["produto"],
  autorizacao: ["centro_custo"],
  // Logística
  remessa: ["fazenda"],
  // Sem placa, o veículo não cruza com carga, remessa nem caixa vazia — vira
  // uma linha que ninguém acha nunca mais.
  frota: ["placa"],
  // É o rótulo do pino no mapa e o título da ficha do registro.
  bases: ["nome"],
};

export function ehObrigatorio(module: string, key: string): boolean {
  return (CAMPOS_OBRIGATORIOS[module] ?? []).includes(key);
}

const SCHEMAS: Record<string, z.ZodType> = {
  // Financeiro
  fluxo: z.object({ descricao: obrigatorio, valor: numericish }).passthrough(),
  custos: z
    .object({ produto: obrigatorio, custo_total: numericish, quantidade: numericish })
    .passthrough(),
  autorizacao: z
    .object({ centro_custo: obrigatorio, valor_autorizado: numericish, valor_alocado: numericish })
    .passthrough(),
  // Logística — remessa/romaneio. A fazenda é o mínimo para a carga ser
  // rastreável; os números precisam ser números para as métricas de quebra.
  remessa: z
    .object({
      fazenda: obrigatorio,
      qtd_caixas: numericish,
      peso_bruto: numericish,
      tara: numericish,
      peso_liquido: numericish,
      peso_entrada: numericish,
      peso_saida: numericish,
      peso_liquido_final: numericish,
      peso_liquido_destino: numericish,
      caixas_recebidas: numericish,
      media: numericish,
    })
    .passthrough(),
  frota: z
    .object({
      placa: obrigatorio,
      ano: numericish,
      capacidade: numericish,
      capacidade_caixas: numericish,
      consumo_km_l: numericish,
      km_atual: numericish,
      atual_lat: numericish,
      atual_lng: numericish,
    })
    .passthrough(),
  bases: z
    .object({
      nome: obrigatorio,
      lat: numericish,
      lng: numericish,
      capacidade_t: numericish,
      capacidade_caixas: numericish,
    })
    .passthrough(),
};

export function validatePayload(
  module: string,
  payload: Record<string, string>,
  /** Rótulos do formulário (key → label), para a mensagem falar a língua da tela. */
  rotulos?: Record<string, string>,
): { ok: true } | { ok: false; error: string; field: string } {
  const schema = SCHEMAS[module];
  if (!schema) return { ok: true };
  const result = schema.safeParse(payload);
  if (result.success) return { ok: true };
  const issue = result.error.issues[0];
  const field = issue?.path.join(".") || "campo";
  return {
    ok: false,
    field,
    error: `${rotulos?.[field] ?? field}: ${issue?.message ?? "inválido"}`,
  };
}
