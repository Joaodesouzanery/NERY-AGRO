import type { OperationRecord } from "@/lib/supabase-operations";

// Métricas puras de Emissão de Carbono — no padrão do Foundry Carbon Module:
// emissão = atividade (volume) × fator. Derivadas dos operation_records
// (area "sustentabilidade", module "carbono"). Sem React/Supabase: testável.
// co2e é sempre em kg CO₂e.

function num(value: unknown): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** co2e (kg) do registro: usa o campo co2e informado, senão calcula volume × fator. */
export function recordCo2e(payload: Record<string, string>): number {
  const stored = num(payload.co2e);
  return stored > 0 ? stored : num(payload.volume) * num(payload.fator);
}

export type CarbonMetrics = {
  registros: number;
  totalKg: number; // kg CO₂e
  totalT: number; // toneladas
  scope1: number; // kg
  scope2: number;
  scope3: number;
  naoClassificado: number;
};

export function buildCarbonMetrics(records: OperationRecord[]): CarbonMetrics {
  let total = 0;
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  for (const r of records) {
    const v = recordCo2e(r.payload);
    total += v;
    const esc = (r.payload.escopo ?? "").trim();
    if (esc === "1") s1 += v;
    else if (esc === "2") s2 += v;
    else if (esc === "3") s3 += v;
  }
  const round = (x: number) => Math.round(x * 10) / 10;
  return {
    registros: records.length,
    totalKg: round(total),
    totalT: Math.round((total / 1000) * 1000) / 1000,
    scope1: round(s1),
    scope2: round(s2),
    scope3: round(s3),
    naoClassificado: round(total - s1 - s2 - s3),
  };
}

function groupSum(
  records: OperationRecord[],
  pick: (p: Record<string, string>) => string,
  fallback: string,
): Array<{ label: string; co2e: number }> {
  const map = new Map<string, number>();
  for (const r of records) {
    const label = pick(r.payload)?.trim() || fallback;
    map.set(label, (map.get(label) ?? 0) + recordCo2e(r.payload));
  }
  return [...map.entries()]
    .map(([label, co2e]) => ({ label, co2e: Math.round(co2e * 10) / 10 }))
    .sort((a, b) => b.co2e - a.co2e);
}

export function carbonByEscopo(records: OperationRecord[]): Array<{ label: string; co2e: number }> {
  const m = buildCarbonMetrics(records);
  return [
    { label: "Escopo 1", co2e: m.scope1 },
    { label: "Escopo 2", co2e: m.scope2 },
    { label: "Escopo 3", co2e: m.scope3 },
    ...(m.naoClassificado > 0.05 ? [{ label: "Não classificado", co2e: m.naoClassificado }] : []),
  ].filter((x) => x.co2e > 0);
}

export const carbonByCategoria = (records: OperationRecord[]) =>
  groupSum(records, (p) => p.categoria || p.fonte, "Outros");
export const carbonByFonte = (records: OperationRecord[]) =>
  groupSum(records, (p) => p.fonte, "Outros");
export const carbonByTalhao = (records: OperationRecord[]) =>
  groupSum(records, (p) => p.talhao, "Sem talhão");

/**
 * Fatores de emissão padrão (agro), kg CO₂e por unidade — referência editável
 * (IPCC / tabelas usuais). Servem para sugerir o `fator` na entrada.
 */
export const CARBON_FACTORS: Array<{
  categoria: string;
  fator: number;
  unidade: string;
  escopo: "1" | "2" | "3";
}> = [
  { categoria: "Diesel", fator: 2.68, unidade: "L", escopo: "1" },
  { categoria: "Gasolina", fator: 2.27, unidade: "L", escopo: "1" },
  { categoria: "Energia elétrica", fator: 0.0385, unidade: "kWh", escopo: "2" },
  { categoria: "Ureia (N → N₂O)", fator: 3.67, unidade: "kg N", escopo: "1" },
  { categoria: "Calcário", fator: 0.44, unidade: "kg", escopo: "1" },
  { categoria: "Transporte (frete)", fator: 0.1, unidade: "t·km", escopo: "3" },
];
