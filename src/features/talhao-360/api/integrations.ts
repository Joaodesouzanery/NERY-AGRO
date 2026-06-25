import { listAllFinancialRecords } from "@/lib/supabase-financial";
import { listOperationRecordsByArea } from "@/lib/supabase-operations";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";

export type TalhaoIntegrationSnapshot = {
  financial: Array<{ id: string; module: string; payload: Record<string, string> }>;
  operations: Array<{
    id: string;
    module: string;
    area: string;
    payload: Record<string, string>;
  }>;
};

export async function loadTalhaoIntegrations(
  talhao: TalhaoRecord,
): Promise<TalhaoIntegrationSnapshot> {
  const [financial, operations] = await Promise.all([
    listAllFinancialRecords(),
    listOperationRecordsByArea(talhao.payload.talhao),
  ]);
  const matches = (payload: Record<string, string>) =>
    payload.field_id === talhao.id ||
    payload.talhao_id === talhao.id ||
    payload.talhao === talhao.payload.talhao ||
    payload.area === talhao.payload.talhao;
  return {
    financial: financial.filter((record) => matches(record.payload)),
    operations,
  };
}

export const talhaoIntegrationContract = {
  preferredKeys: ["field_id", "talhao_id"],
  legacyKeys: ["talhao", "area"],
  contextKeys: ["safra", "cycle_id", "ciclo"],
} as const;
