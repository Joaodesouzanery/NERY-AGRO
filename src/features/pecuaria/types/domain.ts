import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Tipos de domínio da Pecuária v2 — derivados direto das linhas do Postgres
// (schema normalizado pec_*). Métricas (GMD, carência, dossiê) vêm de VIEWS,
// nunca de colunas persistidas.

export type PecLote = Tables<"pec_lote">;
export type PecLoteInsert = TablesInsert<"pec_lote">;
export type PecLoteUpdate = TablesUpdate<"pec_lote">;

export type PecAnimal = Tables<"pec_animal">;
export type PecAnimalInsert = TablesInsert<"pec_animal">;
export type PecAnimalUpdate = TablesUpdate<"pec_animal">;

export type PecPesagem = Tables<"pec_pesagem">;
export type PecPesagemInsert = TablesInsert<"pec_pesagem">;

export type PecEventoSanitario = Tables<"pec_evento_sanitario">;
export type PecEventoSanitarioInsert = TablesInsert<"pec_evento_sanitario">;

export type PecEventoReprodutivo = Tables<"pec_evento_reprodutivo">;
export type PecEventoReprodutivoInsert = TablesInsert<"pec_evento_reprodutivo">;
export type PecOcupacao = Tables<"pec_ocupacao">;
export type PecOcupacaoInsert = TablesInsert<"pec_ocupacao">;

export type PecEstoqueSemen = Tables<"pec_estoque_semen">;
export type PecEstoqueSemenInsert = TablesInsert<"pec_estoque_semen">;
export type PecMovimentacaoGta = Tables<"pec_movimentacao_gta">;
export type PecMovimentacaoGtaInsert = TablesInsert<"pec_movimentacao_gta">;
export type PecProducao = Tables<"pec_producao">;
export type PecProducaoInsert = TablesInsert<"pec_producao">;

export const TIPOS_REPRODUTIVOS = ["iatf", "monta", "dg", "parto", "ressincronizacao"] as const;
export type TipoReprodutivo = (typeof TIPOS_REPRODUTIVOS)[number];

export const TIPO_REPRODUTIVO_LABEL: Record<TipoReprodutivo, string> = {
  iatf: "IATF",
  monta: "Monta natural",
  dg: "Diagnóstico de gestação",
  parto: "Parto",
  ressincronizacao: "Ressincronização",
};

export type GmdAnimal = Tables<"v_gmd_animal">;
export type AnimalCarencia = Tables<"v_animal_carencia">;
export type DossieElo = Tables<"v_dossie_animal">;

// Enums de domínio (espelham os CHECKs do banco). Rótulos em pt-BR na UI.
export const FASES = ["cria", "recria", "engorda", "terminacao"] as const;
export type Fase = (typeof FASES)[number];

export const SISTEMAS = ["pasto", "semiconfinamento", "confinamento"] as const;
export type Sistema = (typeof SISTEMAS)[number];

export const ORIGENS = ["nascido", "comprado", "leilao"] as const;
export type Origem = (typeof ORIGENS)[number];

export const STATUS_ANIMAL = ["ativo", "apto_abate", "vendido", "morto"] as const;
export type StatusAnimal = (typeof STATUS_ANIMAL)[number];

export const SEXOS = ["macho", "femea"] as const;
export type Sexo = (typeof SEXOS)[number];

export const FASE_LABEL: Record<Fase, string> = {
  cria: "Cria",
  recria: "Recria",
  engorda: "Engorda",
  terminacao: "Terminação",
};

export const SISTEMA_LABEL: Record<Sistema, string> = {
  pasto: "Pasto",
  semiconfinamento: "Semiconfinamento",
  confinamento: "Confinamento",
};

export const STATUS_LABEL: Record<StatusAnimal, string> = {
  ativo: "Ativo",
  apto_abate: "Apto ao abate",
  vendido: "Vendido",
  morto: "Morto",
};

export const ORIGEM_LABEL: Record<Origem, string> = {
  nascido: "Nascido",
  comprado: "Comprado",
  leilao: "Leilão",
};
