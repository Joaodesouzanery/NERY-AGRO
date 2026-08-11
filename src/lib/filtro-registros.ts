// Filtro de registros das tabelas de módulo (Logística, Campo, Financeiro).
//
// Função PURA de propósito: é o que permite cobrir as regras com teste sem
// montar React, e é o que faz "o que está na tela" e "o que vai no arquivo"
// serem literalmente o mesmo conjunto — antes o export ignorava qualquer
// filtro e mandava o histórico inteiro.
//
// Duas armadilhas que este módulo existe para evitar:
//
// 1. A busca do DataTable só varre as COLUNAS VISÍVEIS. Como a tabela mostrava
//    6 de 33 campos, procurar por placa ou motorista não achava nada — o campo
//    existia no registro e era invisível para a busca. Aqui a busca varre o
//    payload inteiro, independente do que está sendo exibido.
// 2. O PeriodPicker estava na tela sem filtrar nada: só virava rótulo no
//    export, que escrevia "Este mês" num arquivo com tudo. Agora ele filtra.

import type { PeriodValue } from "@/components/period-picker";

/** O mínimo que os três tipos de registro (operation/field/financial) têm. */
export type RegistroFiltravel = {
  id: string;
  payload: Record<string, string>;
  created_at?: string;
};

export type FiltroRegistros = {
  /** Texto livre — varre TODO o payload, não só as colunas visíveis. */
  busca?: string;
  periodo?: PeriodValue;
  /** Igualdade exata por campo do payload: { etapa: "balanca" }. Vazio = ignora. */
  campos?: Record<string, string>;
};

/**
 * Data do registro para efeito de período.
 *
 * `payload.data` é a data do FATO (quando a carga saiu, quando a pesagem foi
 * feita) e é o que o usuário tem em mente ao filtrar. `created_at` é quando o
 * registro entrou no sistema — usado só como reserva, porque um apontamento
 * colado dias depois tem `data` no passado e `created_at` hoje.
 */
export function dataDoRegistro(registro: RegistroFiltravel): string {
  const doPayload = (registro.payload.data ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(doPayload)) return doPayload.slice(0, 10);
  return (registro.created_at ?? "").slice(0, 10);
}

function dentroDoPeriodo(registro: RegistroFiltravel, periodo: PeriodValue): boolean {
  const data = dataDoRegistro(registro);
  // Registro sem data reconhecível NÃO é escondido: some da tela sem explicação
  // seria pior que aparecer fora do intervalo. Quem quer achá-lo usa a busca.
  if (!data) return true;
  if (periodo.start && data < periodo.start) return false;
  if (periodo.end && data > periodo.end) return false;
  return true;
}

function casaBusca(registro: RegistroFiltravel, termo: string): boolean {
  const alvo = termo.trim().toLowerCase();
  if (!alvo) return true;
  // Varre valores E chaves: procurar por "placa" acha os registros que têm o
  // campo preenchido, o que é útil quando não se lembra do valor exato.
  for (const [chave, valor] of Object.entries(registro.payload)) {
    if (
      String(valor ?? "")
        .toLowerCase()
        .includes(alvo)
    )
      return true;
    if (chave.toLowerCase().includes(alvo)) return true;
  }
  return false;
}

export function filtrarRegistros<T extends RegistroFiltravel>(
  registros: T[],
  filtro: FiltroRegistros,
): T[] {
  const campos = Object.entries(filtro.campos ?? {}).filter(([, v]) => v !== "" && v != null);

  return registros.filter((registro) => {
    if (filtro.periodo && !dentroDoPeriodo(registro, filtro.periodo)) return false;
    for (const [chave, esperado] of campos) {
      if ((registro.payload[chave] ?? "") !== esperado) return false;
    }
    if (filtro.busca && !casaBusca(registro, filtro.busca)) return false;
    return true;
  });
}

/** Valores distintos de um campo, ordenados — alimenta os seletores de filtro. */
export function valoresDistintos(registros: RegistroFiltravel[], chave: string): string[] {
  const set = new Set<string>();
  for (const r of registros) {
    const v = (r.payload[chave] ?? "").trim();
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

/** Há algum filtro ativo? (para mostrar "limpar filtros" e avisar no export). */
export function temFiltroAtivo(filtro: FiltroRegistros): boolean {
  if (filtro.busca?.trim()) return true;
  if (Object.values(filtro.campos ?? {}).some((v) => v)) return true;
  return Boolean(filtro.periodo?.start || filtro.periodo?.end);
}
