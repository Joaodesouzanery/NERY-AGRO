// Store genérico do modo DEMO: snapshot = mocks base (datas relativas a hoje)
// + delta CRUD persistido em localStorage. Dados demo NUNCA vão ao servidor.
// Padrão extraído do Calendário de Campo; cada feature cria o seu com uma
// chave própria e um builder de registros base.
import type { FieldRecord } from "@/lib/supabase-field";

type DemoDelta = {
  records: FieldRecord[];
  deleted: string[];
};

// Chaves conhecidas para o "Restaurar dados demo" da sidebar limpar tudo,
// mesmo que a feature ainda não tenha sido carregada (rotas lazy).
export const DEMO_STORE_KEYS = {
  campoCalendar: "campo-calendar-demo-v1",
  insumos: "insumos-demo-v1",
} as const;

export type DemoStore = {
  load: (now?: Date) => FieldRecord[];
  create: (module: string, payload: Record<string, string>) => FieldRecord;
  update: (id: string, payload: Record<string, string>, fallbackModule?: string) => FieldRecord;
  remove: (id: string) => void;
  reset: () => void;
};

export function createDemoStore(storageKey: string, base: (now: Date) => FieldRecord[]): DemoStore {
  function readDelta(): DemoDelta {
    if (typeof window === "undefined") return { records: [], deleted: [] };
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return { records: [], deleted: [] };
      const parsed = JSON.parse(raw) as Partial<DemoDelta>;
      return {
        records: Array.isArray(parsed.records) ? parsed.records : [],
        deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      };
    } catch {
      return { records: [], deleted: [] };
    }
  }

  function writeDelta(delta: DemoDelta) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(delta));
  }

  function load(now = new Date()): FieldRecord[] {
    const delta = readDelta();
    const overrides = new Map(delta.records.map((record) => [record.id, record]));
    const deleted = new Set(delta.deleted);
    const baseRecords = base(now)
      .filter((record) => !deleted.has(record.id))
      .map((record) => overrides.get(record.id) ?? record);
    const baseIds = new Set(baseRecords.map((record) => record.id));
    const created = delta.records.filter(
      (record) => !baseIds.has(record.id) && !deleted.has(record.id),
    );
    return [...baseRecords, ...created];
  }

  function create(module: string, payload: Record<string, string>): FieldRecord {
    const record: FieldRecord = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      module,
      payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const delta = readDelta();
    writeDelta({ ...delta, records: [...delta.records, record] });
    return record;
  }

  function update(id: string, payload: Record<string, string>, fallbackModule = ""): FieldRecord {
    const delta = readDelta();
    const existing =
      delta.records.find((record) => record.id === id) ?? load().find((record) => record.id === id);
    const record: FieldRecord = {
      id,
      module: existing?.module ?? fallbackModule,
      payload,
      created_at: existing?.created_at,
      updated_at: new Date().toISOString(),
    };
    writeDelta({
      ...delta,
      records: [...delta.records.filter((item) => item.id !== id), record],
    });
    return record;
  }

  function remove(id: string) {
    const delta = readDelta();
    writeDelta({
      records: delta.records.filter((record) => record.id !== id),
      deleted: Array.from(new Set([...delta.deleted, id])),
    });
  }

  function reset() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey);
  }

  return { load, create, update, remove, reset };
}

/** Zera o delta local de TODAS as features (volta os demos ao estado original). */
export function resetAllDemoStores() {
  if (typeof window === "undefined") return;
  for (const key of Object.values(DEMO_STORE_KEYS)) {
    window.localStorage.removeItem(key);
  }
}
