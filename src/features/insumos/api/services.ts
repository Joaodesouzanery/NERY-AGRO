import {
  createFieldRecord,
  deleteFieldRecord,
  listFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import { isDemoModeActive } from "@/lib/demo-context";
import { insumosDemoStore } from "@/features/insumos/data/demo-store";
import {
  INSUMO_MODULES,
  type InsumoPayload,
  type InsumoRecord,
  type LotePayload,
  type LoteRecord,
  type MovimentacaoPayload,
  type MovimentacaoRecord,
} from "@/features/insumos/types/domain";

// Camada de dados dos Insumos. Com o modo DEMO ativo, todas as operações
// (leitura E escrita) vão para o store local (localStorage) — o CRUD demo
// funciona de verdade sem tocar o Supabase.

export type InsumosRecords = {
  insumos: InsumoRecord[];
  lotes: LoteRecord[];
  movimentacoes: MovimentacaoRecord[];
};

function groupRecords(records: FieldRecord[]): InsumosRecords {
  return {
    insumos: records.filter((r) => r.module === INSUMO_MODULES.catalogo) as InsumoRecord[],
    lotes: records.filter((r) => r.module === INSUMO_MODULES.lote) as LoteRecord[],
    movimentacoes: records.filter(
      (r) => r.module === INSUMO_MODULES.movimentacao,
    ) as MovimentacaoRecord[],
  };
}

export async function listInsumosRecords(): Promise<InsumosRecords> {
  if (isDemoModeActive()) return groupRecords(insumosDemoStore.load());
  const [insumos, lotes, movimentacoes] = await Promise.all([
    listFieldRecords(INSUMO_MODULES.catalogo),
    listFieldRecords(INSUMO_MODULES.lote),
    listFieldRecords(INSUMO_MODULES.movimentacao),
  ]);
  return {
    insumos: insumos as InsumoRecord[],
    lotes: lotes as LoteRecord[],
    movimentacoes: movimentacoes as MovimentacaoRecord[],
  };
}

function cleanPayload(payload: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value ?? ""]),
  ) as Record<string, string>;
}

async function createRecord(module: string, payload: Record<string, string>) {
  if (isDemoModeActive()) return insumosDemoStore.create(module, payload);
  return createFieldRecord({ module, payload });
}

async function updateRecord(id: string, payload: Record<string, string>, fallbackModule: string) {
  if (isDemoModeActive()) return insumosDemoStore.update(id, payload, fallbackModule);
  return updateFieldRecord({ id, payload });
}

export async function createInsumo(payload: InsumoPayload) {
  return createRecord(INSUMO_MODULES.catalogo, cleanPayload(payload));
}

export async function updateInsumo(id: string, payload: InsumoPayload) {
  return updateRecord(id, cleanPayload(payload), INSUMO_MODULES.catalogo);
}

export async function createLote(payload: LotePayload) {
  return createRecord(INSUMO_MODULES.lote, cleanPayload(payload));
}

export async function updateLote(id: string, payload: LotePayload) {
  return updateRecord(id, cleanPayload(payload), INSUMO_MODULES.lote);
}

export async function createMovimentacao(payload: MovimentacaoPayload) {
  return createRecord(
    INSUMO_MODULES.movimentacao,
    cleanPayload({ data: new Date().toISOString().slice(0, 10), ...payload }),
  );
}

export async function updateMovimentacao(record: FieldRecord, patch: Partial<MovimentacaoPayload>) {
  return updateRecord(
    record.id,
    cleanPayload({ ...record.payload, ...patch }),
    INSUMO_MODULES.movimentacao,
  );
}

export async function removeInsumoRecord(id: string) {
  if (isDemoModeActive()) return insumosDemoStore.remove(id);
  return deleteFieldRecord(id);
}

// Executar reserva = baixa definitiva (saída) + marca a reserva como executada.
export async function executarReserva(reserva: MovimentacaoRecord) {
  await createMovimentacao({
    ...reserva.payload,
    tipo: "saida",
    status: "",
    data: new Date().toISOString().slice(0, 10),
    observacao: reserva.payload.observacao || `Execução da reserva ${reserva.id.slice(0, 8)}`,
  });
  return updateMovimentacao(reserva, { status: "executada" });
}

export async function cancelarReserva(reserva: MovimentacaoRecord) {
  return updateMovimentacao(reserva, { status: "cancelada" });
}
