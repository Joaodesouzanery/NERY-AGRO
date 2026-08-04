// Dono de um item de fila offline: a empresa e a pessoa que o capturaram.
//
// Por que isto existe. O `org_id` das tabelas é carimbado pelo trigger
// `set_org_id` **no momento do INSERT**, não no momento da captura. Uma fila
// que guarda só o payload não sabe de quem ele é — e o flush grava na empresa
// de quem estiver logado NA HORA DA SINCRONIZAÇÃO.
//
// O cenário não é hipotético num tablet de escritório de fazenda: o operador da
// Empresa A pesa 200 animais sem sinal e sai; alguém da Empresa B entra e abre o
// Modo Curral; o flush dispara no mount e as 200 pesagens entram na Empresa B.
// A perdeu o dado e B recebeu dado de A — vazamento entre empresas e perda, de
// uma vez só.
//
// A correção NÃO é limpar a fila no logout. Limpar destrói exatamente essas 200
// pesagens (o operador termina a sessão sem sinal e toca "Sair"): a limpeza *é*
// a perda que estamos corrigindo, ela só esconde o vazamento. O que isola é
// carimbar na captura e filtrar no flush — a fila espera o dono voltar.

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export type QueueOwner = {
  orgId: string;
  userId: string;
};

/** Identidade do dono como string — chave de partição e comparação. */
export function ownerKey(owner: QueueOwner): string {
  return `${owner.orgId}:${owner.userId}`;
}

export function sameOwner(a: QueueOwner, b: QueueOwner): boolean {
  return a.orgId === b.orgId && a.userId === b.userId;
}

/** Item capturado antes deste carimbo existir. Nunca sincroniza. */
export type ItemComDono = { org_id?: string; user_id?: string };

export function isOrphan(item: ItemComDono): boolean {
  return !item.org_id || !item.user_id;
}

export function belongsTo(item: ItemComDono, owner: QueueOwner): boolean {
  return item.org_id === owner.orgId && item.user_id === owner.userId;
}

/**
 * Separa a fila em três: o que é do dono atual, quantos são de outra conta e o
 * que é órfão (legado, sem carimbo).
 *
 * `deOutros` é CONTAGEM e nunca a lista: mostrar "3 pesagens de Fulano" já conta
 * para a Empresa B quantos animais a Empresa A pesou. A UI diz apenas que há
 * registros de outra sessão.
 *
 * Função pura, separada do IndexedDB de propósito — é o que permite testar a
 * regra de isolamento sem subir storage de navegador.
 */
export function classifyQueue<T extends ItemComDono>(
  itens: T[],
  owner: QueueOwner,
): { meus: T[]; deOutros: number; orfaos: T[] } {
  const meus: T[] = [];
  const orfaos: T[] = [];
  let deOutros = 0;

  for (const item of itens) {
    if (isOrphan(item)) orfaos.push(item);
    else if (belongsTo(item, owner)) meus.push(item);
    else deOutros += 1;
  }

  return { meus, deOutros, orfaos };
}

/** Só o que o dono atual pode sincronizar. Órfão nunca entra. */
export function selectForOwner<T extends ItemComDono>(itens: T[], owner: QueueOwner): T[] {
  return itens.filter((item) => belongsTo(item, owner));
}

/**
 * Dono derivado da sessão, ou `null` enquanto ela não resolveu.
 *
 * `null` é o estado seguro e precisa ser tratado por quem chama: sem saber de
 * quem é o item, não se enfileira nem se sincroniza. Vale para o instante de
 * carregamento do app e para quem abre uma tela deslogado.
 */
export function useQueueOwner(): QueueOwner | null {
  const { orgId, session } = useAuth();
  const userId = session?.user?.id;
  return useMemo(() => (orgId && userId ? { orgId, userId } : null), [orgId, userId]);
}
