import type { CostCenter } from "@/lib/supabase-cost-centers";
import type { Contract } from "@/lib/supabase-contracts";

// Métricas puras que ligam a V2 do Financeiro (centros de custo + contratos) ao
// COGS/Torre: rollup por etapa, variância orçado×realizado, custo derivado de
// contratos e margem/ROI por talhão. Sem React/Supabase: testável.

function norm(value: string): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** tipo do centro de custo → chave da etapa do COGS (casa com buildCogsModel). */
export function stageForTipo(tipo: string): string {
  const t = norm(tipo);
  if (t.includes("insumo")) return "insumos";
  if (t.includes("mao")) return "mao_obra";
  if (t.includes("maquin")) return "maquinario";
  if (t.includes("frete") || t.includes("transp")) return "frete";
  if (t.includes("embal")) return "embalagem";
  if (t.includes("armazen")) return "armazenagem";
  if (t.includes("comerc")) return "comercializacao";
  return "materia_prima";
}

/** Valor liquidado do contrato: qtd_liquidada × preço; fallback = valor × execução. */
export function contractLiquidado(c: Contract): number {
  const byQty = num(c.qtd_liquidada) * num(c.preco_unit);
  if (byQty > 0) return byQty;
  const contratada = num(c.qtd_contratada);
  const frac = contratada > 0 ? num(c.qtd_liquidada) / contratada : 0;
  return num(c.valor) * frac;
}

/** Contrato é de RECEITA (venda/CSA/fixação) vs custo (compra/frete/arrendamento). */
export function isRevenueContract(c: Contract): boolean {
  const t = norm(c.tipo);
  return t.includes("venda") || t.includes("csa") || t.includes("fixac");
}

/** Custo liquidado de contratos de custo, somado por centro de custo vinculado. */
export function contractsRealizadoByCenter(contracts: Contract[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of contracts) {
    if (!c.cost_center_id || isRevenueContract(c)) continue;
    map.set(c.cost_center_id, (map.get(c.cost_center_id) ?? 0) + contractLiquidado(c));
  }
  return map;
}

export type VarianceLevel = "ok" | "warning" | "danger";

export type CenterVariance = {
  id: string;
  nome: string;
  tipo: string;
  stage: string;
  talhao_id: string | null;
  autorizado: number;
  alocado: number;
  realizado: number; // valor_realizado + custo de contratos vinculados
  ratio: number; // realizado / autorizado
  level: VarianceLevel;
};

/** >100% do autorizado = crítico; >95% = atenção; senão ok. Maior ratio primeiro. */
export function costCenterVariances(
  centers: CostCenter[],
  contracts: Contract[] = [],
): CenterVariance[] {
  const linked = contractsRealizadoByCenter(contracts);
  return centers
    .map((cc) => {
      const realizado = num(cc.valor_realizado) + (linked.get(cc.id) ?? 0);
      const autorizado = num(cc.valor_autorizado);
      const ratio = autorizado > 0 ? realizado / autorizado : 0;
      const level: VarianceLevel = ratio > 1 ? "danger" : ratio > 0.95 ? "warning" : "ok";
      return {
        id: cc.id,
        nome: cc.nome,
        tipo: cc.tipo,
        stage: stageForTipo(cc.tipo),
        talhao_id: cc.talhao_id,
        autorizado,
        alocado: num(cc.valor_alocado),
        realizado,
        ratio,
        level,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export type StageRollup = {
  stage: string;
  autorizado: number;
  alocado: number;
  realizado: number;
  centers: CenterVariance[];
  byTalhao: Array<{ talhao_id: string; realizado: number }>;
};

/** Rollup dos centros por etapa do COGS (para drill-down: etapa → centros → talhão). */
export function rollupByStage(centers: CostCenter[], contracts: Contract[] = []): StageRollup[] {
  const variances = costCenterVariances(centers, contracts);
  const byStage = new Map<string, CenterVariance[]>();
  for (const v of variances) {
    const arr = byStage.get(v.stage) ?? [];
    arr.push(v);
    byStage.set(v.stage, arr);
  }
  return [...byStage.entries()]
    .map(([stage, cs]) => {
      const talhaoMap = new Map<string, number>();
      for (const c of cs) {
        if (c.talhao_id)
          talhaoMap.set(c.talhao_id, (talhaoMap.get(c.talhao_id) ?? 0) + c.realizado);
      }
      return {
        stage,
        autorizado: cs.reduce((s, c) => s + c.autorizado, 0),
        alocado: cs.reduce((s, c) => s + c.alocado, 0),
        realizado: cs.reduce((s, c) => s + c.realizado, 0),
        centers: cs,
        byTalhao: [...talhaoMap.entries()]
          .map(([talhao_id, realizado]) => ({ talhao_id, realizado }))
          .sort((a, b) => b.realizado - a.realizado),
      };
    })
    .sort((a, b) => b.realizado - a.realizado);
}

/** Contratos ativos vencendo dentro da janela (default 30 dias). Mais próximo primeiro. */
export function contractsExpiringSoon(
  contracts: Contract[],
  todayISO: string,
  days = 30,
): Contract[] {
  const today = new Date(`${todayISO}T00:00:00`).getTime();
  const horizon = today + days * 86_400_000;
  return contracts
    .filter((c) => {
      if (!c.vigencia_fim) return false;
      const end = new Date(`${c.vigencia_fim}T00:00:00`).getTime();
      if (Number.isNaN(end)) return false;
      const st = norm(c.status);
      if (st.includes("encerr") || st.includes("cancel") || st.includes("conclu")) return false;
      return end >= today && end <= horizon;
    })
    .sort((a, b) => (a.vigencia_fim ?? "").localeCompare(b.vigencia_fim ?? ""));
}

export type FieldMargin = {
  talhao_id: string;
  receita: number;
  custo: number;
  margem: number;
  roi: number; // margem / custo
};

/**
 * Margem/ROI por talhão: custo = centros de custo realizados + contratos de custo
 * do talhão; receita = contratos de receita (venda/CSA/fixação) do talhão. Maior
 * ROI primeiro. Custos são sólidos; a receita depende de contratos com talhao_id.
 */
export function buildFieldMargin(centers: CostCenter[], contracts: Contract[]): FieldMargin[] {
  const custo = new Map<string, number>();
  const receita = new Map<string, number>();
  for (const cc of centers) {
    if (cc.talhao_id)
      custo.set(cc.talhao_id, (custo.get(cc.talhao_id) ?? 0) + num(cc.valor_realizado));
  }
  for (const c of contracts) {
    if (!c.talhao_id) continue;
    const v = contractLiquidado(c);
    if (isRevenueContract(c)) receita.set(c.talhao_id, (receita.get(c.talhao_id) ?? 0) + v);
    else custo.set(c.talhao_id, (custo.get(c.talhao_id) ?? 0) + v);
  }
  const talhoes = new Set([...custo.keys(), ...receita.keys()]);
  return [...talhoes]
    .map((talhao_id) => {
      const r = receita.get(talhao_id) ?? 0;
      const c = custo.get(talhao_id) ?? 0;
      return { talhao_id, receita: r, custo: c, margem: r - c, roi: c > 0 ? (r - c) / c : 0 };
    })
    .sort((a, b) => b.roi - a.roi);
}
