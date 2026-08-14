// Fila offline do Modo Curral (IndexedDB, não localStorage). As pesagens feitas
// no brete entram aqui e sincronizam quando houver conexão. IndexedDB aguenta
// milhares de registros e sobrevive a recarregar a página / fechar o app.
//
// Todo item carrega o DONO (empresa + usuário) desde a captura, e a API pública
// só devolve o que é do dono informado. O porquê está em src/lib/offline-owner.ts.

import { classifyQueue, isOrphan, selectForOwner, type QueueOwner } from "@/lib/offline-owner";

const DB_NAME = "agrotorre-pecuaria";
const DB_VERSION = 1;
const STORE = "pesagem_queue";

export type QueuedPesagem = {
  id: string; // uuid local (idempotência na sincronização)
  /**
   * Empresa e usuário que capturaram. OBRIGATÓRIOS de propósito: como campo
   * opcional, o typecheck deixaria passar quem esquecesse de carimbar — e é
   * justamente o item sem carimbo que vaza para a empresa errada no flush.
   * Ver src/lib/offline-owner.ts.
   */
  org_id: string;
  user_id: string;
  animal_id: string;
  brinco?: string; // só para exibição na fila
  data: string; // YYYY-MM-DD
  peso_kg: number;
  origem: "manual" | "rfid" | "balanca";
  created_at: string; // ISO
};

/** IndexedDB disponível? (false em SSR ou navegadores sem suporte). */
export function isOfflineQueueAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isOfflineQueueAvailable()) {
      reject(new Error("IndexedDB indisponível neste ambiente."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Falha ao abrir IndexedDB."));
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const req = run(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Falha na transação IndexedDB."));
        t.oncomplete = () => db.close();
      }),
  );
}

export async function enqueuePesagem(item: QueuedPesagem): Promise<void> {
  if (!isOfflineQueueAvailable()) return;
  await tx("readwrite", (store) => store.put(item));
}

/**
 * Fila CRUA, sem escopo. Interna de propósito — quem consome deve usar
 * `listQueueFor`/`classifyQueueFor`, que filtram por dono. Exportar uma leitura
 * sem escopo é o mesmo que convidar o próximo flush a sincronizar item alheio.
 */
async function listQueueRaw(): Promise<QueuedPesagem[]> {
  if (!isOfflineQueueAvailable()) return [];
  const all = await tx<QueuedPesagem[]>(
    "readonly",
    (store) => store.getAll() as IDBRequest<QueuedPesagem[]>,
  );
  return (all ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** O que ESTE dono pode sincronizar. Item de outra conta e órfão ficam de fora. */
export async function listQueueFor(owner: QueueOwner): Promise<QueuedPesagem[]> {
  return selectForOwner(await listQueueRaw(), owner);
}

/** Fila separada em meus / de outros (contagem) / órfãos. Ver classifyQueue. */
export async function classifyQueueFor(owner: QueueOwner) {
  return classifyQueue(await listQueueRaw(), owner);
}

/** Itens sem carimbo de dono (capturados antes desta correção). */
export async function listOrphans(): Promise<QueuedPesagem[]> {
  return (await listQueueRaw()).filter(isOrphan);
}

/** Quantos itens ESTE dono tem pendentes (o número do badge). */
export async function countQueueFor(owner: QueueOwner): Promise<number> {
  return (await listQueueFor(owner)).length;
}

export async function removeFromQueue(id: string): Promise<void> {
  if (!isOfflineQueueAvailable()) return;
  await tx("readwrite", (store) => store.delete(id));
}

/**
 * Descarte EXPLÍCITO, só dos itens de um dono. Não existe "limpar tudo": o
 * logout não apaga fila (ver o cabeçalho de offline-owner.ts) e apagar item de
 * outra conta é destruir dado de quem não está aqui para reclamar.
 */
export async function purgeQueueOf(owner: QueueOwner): Promise<number> {
  const meus = await listQueueFor(owner);
  for (const item of meus) await removeFromQueue(item.id);
  return meus.length;
}

/** Descarte dos órfãos — só depois de exportar. Ver ModoCurral. */
export async function purgeOrphans(): Promise<number> {
  const orfaos = await listOrphans();
  for (const item of orfaos) await removeFromQueue(item.id);
  return orfaos.length;
}
