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

const STORAGE_KEY = "campo-calendar-offline-queue-v1";

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

export function listQueue(): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as QueuedOp[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const QUEUE_CHANGE_EVENT = "campo-calendar-queue-change";

function writeQueue(queue: QueuedOp[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGE_EVENT));
}

export function enqueueOp(op: Omit<QueuedOp, "id" | "queuedAt">) {
  const entry: QueuedOp = {
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
  };
  writeQueue([...listQueue(), entry]);
  return entry;
}

export function removeOp(id: string) {
  writeQueue(listQueue().filter((op) => op.id !== id));
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
export async function flushQueue(): Promise<FlushResult> {
  const queue = listQueue();
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
          removeOp(op.id);
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
      removeOp(op.id);
    } catch {
      result.failed += 1; // permanece na fila para a próxima tentativa
    }
  }
  return result;
}
