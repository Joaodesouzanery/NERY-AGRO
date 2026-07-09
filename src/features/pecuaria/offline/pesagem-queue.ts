// Fila offline do Modo Curral (IndexedDB, não localStorage). As pesagens feitas
// no brete entram aqui e sincronizam quando houver conexão. IndexedDB aguenta
// milhares de registros e sobrevive a recarregar a página / fechar o app.

const DB_NAME = "agrotorre-pecuaria";
const DB_VERSION = 1;
const STORE = "pesagem_queue";

export type QueuedPesagem = {
  id: string; // uuid local (idempotência na sincronização)
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

export async function listQueue(): Promise<QueuedPesagem[]> {
  if (!isOfflineQueueAvailable()) return [];
  const all = await tx<QueuedPesagem[]>(
    "readonly",
    (store) => store.getAll() as IDBRequest<QueuedPesagem[]>,
  );
  return (all ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function countQueue(): Promise<number> {
  if (!isOfflineQueueAvailable()) return 0;
  return tx<number>("readonly", (store) => store.count());
}

export async function removeFromQueue(id: string): Promise<void> {
  if (!isOfflineQueueAvailable()) return;
  await tx("readwrite", (store) => store.delete(id));
}

export async function clearQueue(): Promise<void> {
  if (!isOfflineQueueAvailable()) return;
  await tx("readwrite", (store) => store.clear());
}
