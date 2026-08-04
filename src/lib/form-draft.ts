import { useEffect, useRef, useState } from "react";
import { ownerKey, useQueueOwner, type QueueOwner } from "@/lib/offline-owner";

// Rascunho local de formulário.
//
// **NÃO é fila de sincronização.** Nada aqui é enviado sozinho: o rascunho só
// devolve ao usuário o que ele digitou, para ELE reenviar. Essa distinção é o
// ponto — a alternativa (enfileirar e prometer que sincroniza) é exatamente o
// que o Diário de Campo fazia, e o dado nunca chegava a lugar nenhum.
//
// O que ele resolve: em RDC, Remessa e Financeiro, uma falha de gravação
// mostrava o erro e o diálogo levava junto o que tinha sido digitado. No colar
// apontamento do WhatsApp isso custa de 2 a 5 minutos de atenção de uma pessoa
// dentro de um caminhão. A rede volta em 30 segundos; o formulário não voltava
// nunca.
//
// Escopado por empresa+usuário pela mesma razão da fila offline: um aparelho
// compartilhado não pode devolver o rascunho de uma empresa para outra.

const PREFIXO = "agrotorre-draft";

/** ~200 kB: acima disso é anexo disfarçado de rascunho, e a cota é pequena. */
const TETO_BYTES = 200_000;

/** localStorage é síncrono e trava a thread — não a cada tecla. */
const DEBOUNCE_MS = 800;

function chave(form: string, owner: QueueOwner, id?: string): string {
  return `${PREFIXO}:${form}:${ownerKey(owner)}${id ? `:${id}` : ""}`;
}

export type Draft<T> = { value: T; savedAt: string };

export function saveDraft<T>(form: string, owner: QueueOwner, value: T, id?: string): void {
  if (typeof window === "undefined") return;
  try {
    const corpo = JSON.stringify({ value, savedAt: new Date().toISOString() });
    // Rascunho gigante não vale a cota: descartar em silêncio é melhor que
    // estourar a quota e derrubar o rascunho de OUTRO formulário junto.
    if (corpo.length > TETO_BYTES) return;
    window.localStorage.setItem(chave(form, owner, id), corpo);
  } catch {
    // QuotaExceededError, aba privada do iOS, storage desabilitado. Um rascunho
    // que falha NUNCA pode quebrar o formulário — é recurso de conveniência
    // sobre o caminho principal, não parte dele.
  }
}

export function loadDraft<T>(form: string, owner: QueueOwner, id?: string): Draft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const cru = window.localStorage.getItem(chave(form, owner, id));
    if (!cru) return null;
    const parsed = JSON.parse(cru) as Draft<T>;
    return parsed && typeof parsed.savedAt === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDraft(form: string, owner: QueueOwner, id?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(chave(form, owner, id));
  } catch {
    // ver saveDraft
  }
}

/** "14:32" — o rascunho precisa dizer de quando é, senão não dá para confiar. */
export function draftHora(savedAt: string): string {
  const d = new Date(savedAt);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Salva `value` continuamente (debounced) e devolve o rascunho encontrado na
 * montagem, se houver.
 *
 * `restored` é lido UMA vez, na montagem: quem chama decide se oferece a
 * restauração. Nunca sobrescrevemos o que está sendo digitado — a decisão é do
 * usuário, e um formulário que se auto-preenche no meio da digitação é pior que
 * um que perdeu o texto.
 *
 * `enabled: false` (ex.: modo DEMO, ou diálogo fechado) suspende a gravação sem
 * apagar o que já existe.
 */
export function useFormDraft<T>(form: string, value: T, opts?: { enabled?: boolean; id?: string }) {
  const owner = useQueueOwner();
  const enabled = opts?.enabled ?? true;
  const id = opts?.id;

  // Lido na montagem, antes de qualquer gravação — senão o próprio efeito de
  // salvar apagaria o rascunho que queremos oferecer.
  const [restored] = useState<Draft<T> | null>(() =>
    owner ? loadDraft<T>(form, owner, id) : null,
  );

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!enabled || !owner) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveDraft(form, owner, value, id), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [form, owner, value, id, enabled]);

  return {
    restored,
    /**
     * Lê o rascunho AGORA. `restored` é o da montagem do componente; num diálogo
     * que abre e fecha sem desmontar a página, é isto que o botão "abrir" usa
     * para saber se há algo a oferecer.
     */
    read: () => (owner ? loadDraft<T>(form, owner, id) : null),
    /** Chame no SUBMIT BEM-SUCEDIDO — e só nele. Fechar o diálogo é justamente quando o rascunho serve. */
    discard: () => owner && clearDraft(form, owner, id),
  };
}
