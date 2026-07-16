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

function roundCo2e(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 10000) / 10000) : "";
}

/**
 * Grava co2e = volume × fator quando não informado (para que tabela/Excel batam
 * com os KPIs). Respeita um co2e digitado manualmente. Puro — usado no salvar.
 */
export function fillCarbonCo2e(payload: Record<string, string>): Record<string, string> {
  const next = { ...payload };
  if (num(next.co2e) > 0) return next;
  const computed = num(next.volume) * num(next.fator);
  if (computed > 0) next.co2e = roundCo2e(computed);
  return next;
}

/**
 * Ao escolher a categoria, sugere fator/unidade/escopo pela tabela de referência
 * — só preenche o que está vazio, nunca sobrescreve o que o usuário digitou.
 */
export function carbonFactorAutofill(
  payload: Record<string, string>,
  changedKey?: string,
): Record<string, string> {
  if (changedKey !== "categoria") return payload;
  const factor = CARBON_FACTORS.find((f) => f.categoria === payload.categoria);
  if (!factor) return payload;
  const next = { ...payload };
  if (!String(next.fator ?? "").trim()) next.fator = String(factor.fator);
  if (!String(next.unidade ?? "").trim()) next.unidade = factor.unidade;
  if (!String(next.escopo ?? "").trim()) next.escopo = factor.escopo;
  return next;
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

export type CarbonFactor = {
  categoria: string;
  fator: number; // kg CO₂e por unidade (GWP já embutido)
  unidade: string;
  escopo: "1" | "2" | "3";
  grupo: string; // agrupa na entrada e liga a auto-captura à fonte de dado
};

/**
 * Fatores de emissão de referência (agro), em kg CO₂e por unidade — com o GWP já
 * embutido (metano e N₂O já convertidos para CO₂ equivalente). Valores usuais
 * (IPCC / tabelas de mercado); confirme com a base oficial da sua certificação.
 * Servem para sugerir o `fator` na entrada e para a captura automática (C2).
 */
export const CARBON_FACTORS: CarbonFactor[] = [
  // Combustíveis (escopo 1 — queima direta)
  { categoria: "Diesel", fator: 2.68, unidade: "L", escopo: "1", grupo: "Combustíveis" },
  { categoria: "Gasolina", fator: 2.27, unidade: "L", escopo: "1", grupo: "Combustíveis" },
  { categoria: "Etanol", fator: 1.5, unidade: "L", escopo: "1", grupo: "Combustíveis" },
  { categoria: "GLP", fator: 2.9, unidade: "kg", escopo: "1", grupo: "Combustíveis" },
  { categoria: "Gás natural", fator: 2.0, unidade: "m³", escopo: "1", grupo: "Combustíveis" },
  // Energia comprada (escopo 2 — grid varia por região/ano)
  { categoria: "Energia elétrica", fator: 0.0385, unidade: "kWh", escopo: "2", grupo: "Energia" },
  // Fertilizantes nitrogenados (escopo 1 — N₂O direto + indireto), por kg de N
  {
    categoria: "Ureia (N → N₂O)",
    fator: 3.67,
    unidade: "kg N",
    escopo: "1",
    grupo: "Fertilizantes",
  },
  {
    categoria: "Nitrato de amônio",
    fator: 6.0,
    unidade: "kg N",
    escopo: "1",
    grupo: "Fertilizantes",
  },
  { categoria: "MAP/DAP", fator: 5.5, unidade: "kg N", escopo: "1", grupo: "Fertilizantes" },
  {
    categoria: "Fertilizante orgânico",
    fator: 2.5,
    unidade: "kg N",
    escopo: "1",
    grupo: "Fertilizantes",
  },
  // Correção de solo (escopo 1 — CO₂ do carbonato)
  { categoria: "Calcário", fator: 0.44, unidade: "kg", escopo: "1", grupo: "Correção de solo" },
  {
    categoria: "Gesso agrícola",
    fator: 0.02,
    unidade: "kg",
    escopo: "1",
    grupo: "Correção de solo",
  },
  // Agroquímicos (escopo 3 — fabricação), por kg de ingrediente ativo
  { categoria: "Herbicida", fator: 12, unidade: "kg i.a.", escopo: "3", grupo: "Agroquímicos" },
  {
    categoria: "Inseticida/Fungicida",
    fator: 15,
    unidade: "kg i.a.",
    escopo: "3",
    grupo: "Agroquímicos",
  },
  // Pecuária (escopo 1 — metano entérico + dejetos), por cabeça ao ano
  {
    categoria: "Bovino corte (metano entérico)",
    fator: 1600,
    unidade: "cabeça·ano",
    escopo: "1",
    grupo: "Pecuária",
  },
  {
    categoria: "Bovino leite (metano entérico)",
    fator: 2300,
    unidade: "cabeça·ano",
    escopo: "1",
    grupo: "Pecuária",
  },
  {
    categoria: "Manejo de dejetos",
    fator: 400,
    unidade: "cabeça·ano",
    escopo: "1",
    grupo: "Pecuária",
  },
  // Cadeia (escopo 3)
  {
    categoria: "Transporte (frete)",
    fator: 0.1,
    unidade: "t·km",
    escopo: "3",
    grupo: "Transporte",
  },
];

/** Busca o fator de referência de uma categoria (case/acentos-insensível). */
export function findCarbonFactor(categoria: string): CarbonFactor | undefined {
  const key = (categoria ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return CARBON_FACTORS.find(
    (f) =>
      f.categoria
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "") === key,
  );
}

/**
 * Preço de referência do carbono (R$ por tonelada de CO₂e) — premissa editável,
 * usada no COGS como custo/passivo de offset. Ordem de grandeza do mercado
 * voluntário brasileiro (~US$ 10-15/t). Ajuste conforme o preço praticado.
 */
export const CARBON_PRICE_BRL_PER_T = 60;

/** Custo/passivo de carbono (R$) = tCO₂e × preço por tonelada. */
export function carbonCostBRL(totalT: number, pricePerT = CARBON_PRICE_BRL_PER_T): number {
  return Math.round(totalT * pricePerT * 100) / 100;
}
