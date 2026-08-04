// Fila offline do Calendário (modo REAL): mutações que falham por rede ficam
// pendentes em localStorage e são reenviadas ao reconectar. Conflito é detectado
// por updated_at — em conflito a operação é PULADA (nunca sobrescreve silencioso;
// decisões estratégicas jamais são sobrescritas automaticamente).
import {
  createFieldRecord,
  deleteFieldRecord,
  listAllFieldRecords,
  updateFieldRecord,
} from "@/lib/supabase-field";
import { ownerKey, type QueueOwner } from "@/lib/offline-owner";

/**
 * A chave é PARTICIONADA por dono (empresa+usuário) em vez de a fila ganhar um
 * campo `org_id` como a da Pecuária.
 *
 * A diferença é proposital: localStorage é chave-valor plano, e particionar a
 * chave torna a leitura cruzada estruturalmente impossível — para ler a fila de
 * outra empresa seria preciso montar a chave dela. Na Pecuária, que usa
 * IndexedDB com store e cursor, campo + filtro é a forma natural. O contrato é o
 * mesmo (ver src/lib/offline-owner.ts): item de outro dono nunca sincroniza, e
 * nada é apagado no logout.
 */
const STORAGE_PREFIX = "campo-calendar-offline-queue-v2";

/** Fila do dono. Sem dono resolvido, não há fila para ler nem para escrever. */
function storageKey(owner: QueueOwner): string {
  return `${STORAGE_PREFIX}:${ownerKey(owner)}`;
}

/**
 * Chave da versão anterior, sem dono. Os itens que estiverem nela foram
 * capturados antes desta correção e não sabemos de quem são: não sincronizam e
 * não são apagados. Ver `listLegacyQueue`.
 */
const STORAGE_KEY_LEGADO = "campo-calendar-offline-queue-v1";

export type QueuedOp = {
  id: string;
  op: "create" | "update" | "delete";
  module: string;
  recordId?: string;
  payload?: Record<string, string>;
  /** updated_at do registro no momento do enfileiramento (base p/ conflito). */
  baseUpdatedAt?: string;
  queuedAt: string;
};

function readKey(key: string): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as QueuedOp[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listQueue(owner: QueueOwner): QueuedOp[] {
  return readKey(storageKey(owner));
}

/** Itens da fila antiga, sem dono. Só para exibir/exportar — nunca sincronizam. */
export function listLegacyQueue(): QueuedOp[] {
  return readKey(STORAGE_KEY_LEGADO);
}

export const QUEUE_CHANGE_EVENT = "campo-calendar-queue-change";

function writeQueue(owner: QueueOwner, queue: QueuedOp[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(owner), JSON.stringify(queue));
  } catch {
    // QuotaExceededError (aba privada do iOS, disco cheio). Engolir aqui é
    // deliberado: quem chama já está no caminho de erro e vai avisar o usuário.
    // Lançar daqui transformaria "não consegui enfileirar" em crash da tela.
    return;
  }
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGE_EVENT));
}

export function enqueueOp(owner: QueueOwner, op: Omit<QueuedOp, "id" | "queuedAt">) {
  const entry: QueuedOp = {
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
  };
  writeQueue(owner, [...listQueue(owner), entry]);
  return entry;
}

export function removeOp(owner: QueueOwner, id: string) {
  writeQueue(
    owner,
    listQueue(owner).filter((op) => op.id !== id),
  );
}

/** Erro de rede (fetch falhou) vs. erro de regra — só rede vai para a fila. */
export function isNetworkError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("fetch") || message.includes("network") || message.includes("failed");
}

export type FlushResult = { synced: number; conflicts: number; failed: number };

/**
 * Tenta reenviar a fila. Só marca como sincronizado após resposta do Supabase.
 * Conflito (registro remoto mais novo que a base local) remove da fila sem gravar.
 */
export async function flushQueue(owner: QueueOwner): Promise<FlushResult> {
  const queue = listQueue(owner);
  if (!queue.length) return { synced: 0, conflicts: 0, failed: 0 };

  const remote = await listAllFieldRecords();
  const remoteById = new Map(remote.map((record) => [record.id, record]));
  const result: FlushResult = { synced: 0, conflicts: 0, failed: 0 };

  for (const op of queue) {
    try {
      if (op.op === "update" && op.recordId) {
        const current = remoteById.get(op.recordId);
        if (current?.updated_at && op.baseUpdatedAt && current.updated_at > op.baseUpdatedAt) {
          result.conflicts += 1;
          removeOp(owner, op.id);
          continue;
        }
      }
      if (op.op === "create" && op.payload) {
        await createFieldRecord({ module: op.module, payload: op.payload });
      } else if (op.op === "update" && op.recordId && op.payload) {
        await updateFieldRecord({ id: op.recordId, payload: op.payload });
      } else if (op.op === "delete" && op.recordId) {
        await deleteFieldRecord(op.recordId);
      }
      result.synced += 1;
      removeOp(owner, op.id);
    } catch {
      result.failed += 1; // permanece na fila para a próxima tentativa
    }
  }
  return result;
}
