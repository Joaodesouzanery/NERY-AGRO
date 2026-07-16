import { createFieldRecord, listFieldRecords, updateFieldRecord } from "@/lib/supabase-field";

// Configurações leves da empresa (sem migração): um único field_record no módulo
// "app-settings", org-escopado por RLS. Guarda premissas editáveis — hoje o preço
// de referência do carbono (R$/tCO₂e) e coordenadas reais das fazendas.
const MODULE = "app-settings";

export type FazendaCoord = { lat: number; lng: number };

export type AppSettings = {
  carbonPriceBrlPerT?: number; // undefined = usa o default da lib
  carbonTargetT?: number; // meta anual de emissão (tCO₂e); undefined = sem meta
  fazendaCoords: Record<string, FazendaCoord>; // chave = nome da fazenda normalizado
};

export const EMPTY_SETTINGS: AppSettings = { fazendaCoords: {} };

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Parseia o payload cru do field_record em AppSettings tipado. */
export function parseAppSettings(payload: Record<string, string> | undefined): AppSettings {
  if (!payload) return { fazendaCoords: {} };
  const price = num(payload.carbon_price_brl_per_t);
  const target = num(payload.carbon_target_t);
  let fazendaCoords: Record<string, FazendaCoord> = {};
  try {
    fazendaCoords = payload.fazenda_coords ? JSON.parse(payload.fazenda_coords) : {};
  } catch {
    fazendaCoords = {};
  }
  return {
    carbonPriceBrlPerT: price > 0 ? price : undefined,
    carbonTargetT: target > 0 ? target : undefined,
    fazendaCoords,
  };
}

/** Lê o registro único de configurações (o mais recente). */
export async function loadAppSettings(): Promise<AppSettings> {
  const records = await listFieldRecords(MODULE); // já vem desc por created_at
  return parseAppSettings(records[0]?.payload);
}

// Grava mesclando com o registro existente (mantém uma linha só de settings).
async function patchSettings(patch: Record<string, string>): Promise<void> {
  const records = await listFieldRecords(MODULE);
  const existing = records[0];
  const payload = { ...(existing?.payload ?? {}), ...patch };
  if (existing) await updateFieldRecord({ id: existing.id, payload });
  else await createFieldRecord({ module: MODULE, payload });
}

export async function saveCarbonPrice(price: number): Promise<void> {
  await patchSettings({ carbon_price_brl_per_t: String(price) });
}

export async function saveCarbonTarget(targetT: number): Promise<void> {
  await patchSettings({ carbon_target_t: String(targetT) });
}

export async function saveFazendaCoords(coords: Record<string, FazendaCoord>): Promise<void> {
  await patchSettings({ fazenda_coords: JSON.stringify(coords) });
}
