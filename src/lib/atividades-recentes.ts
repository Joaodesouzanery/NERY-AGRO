import type { ConnectedAgroSnapshot } from "@/lib/connected-agro-data";
import { statusSeverity, tituloDoRegistro } from "@/lib/connected-agro-data";

// "O que aconteceu na operação" — os últimos registros criados ou atualizados,
// mesclando as três tabelas de dados.
//
// Limite declarado, e importante: as tabelas de registro NÃO têm user_id nem
// created_by — `payload.responsavel` é o sujeito do FATO (quem dirigiu, quem
// aplicou), não o autor da edição. Então o feed diz "o quê" e "quando", nunca
// "quem mexeu". Dizer "por Fulano" com o responsável do payload seria atribuir
// a edição à pessoa errada. Audit log de verdade é mudança de schema — rodada
// própria.

export type Atividade = {
  id: string;
  recordId: string;
  area: string;
  module: string;
  titulo: string;
  /** `updated_at` diferente de `created_at` = o registro foi mexido depois. */
  acao: "criado" | "atualizado";
  quandoISO: string;
  severidade: "info" | "warning" | "danger";
};

type FonteMinima = {
  id: string;
  module: string;
  payload: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

function paraAtividade(item: FonteMinima, area: string): Atividade | null {
  const quandoISO = item.updated_at ?? item.created_at ?? "";
  if (!quandoISO) return null;
  return {
    id: `atv-${area}-${item.id}`,
    recordId: item.id,
    area,
    module: item.module,
    titulo: tituloDoRegistro(item.payload, item.module),
    acao: item.updated_at && item.updated_at !== item.created_at ? "atualizado" : "criado",
    quandoISO,
    severidade: statusSeverity(item.payload.status ?? item.payload.severidade),
  };
}

/** Últimas atividades do snapshot, mais recentes primeiro. */
export function atividadesRecentes(
  snapshot: Pick<ConnectedAgroSnapshot, "operations" | "field" | "financial">,
  limite = 12,
): Atividade[] {
  const todas = [
    ...snapshot.operations.map((r) => paraAtividade(r, r.area)),
    ...snapshot.field.map((r) => paraAtividade(r, "campo")),
    ...snapshot.financial.map((r) => paraAtividade(r, "financeiro")),
  ].filter((a): a is Atividade => a !== null);

  return todas.sort((a, b) => b.quandoISO.localeCompare(a.quandoISO)).slice(0, limite);
}
