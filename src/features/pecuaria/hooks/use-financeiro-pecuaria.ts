import { useQuery } from "@tanstack/react-query";
import { listCostCenters, type CostCenter } from "@/lib/supabase-cost-centers";
import { listContracts, type Contract } from "@/lib/supabase-contracts";
import { listFinancialRecords, type FinancialRecord } from "@/lib/supabase-financial";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { pecKeys } from "../api/query-keys";
import { somarCustos, type CustoPorCategoria } from "../lib/custos";
import type { PecLote } from "../types/domain";

const COMMON = { staleTime: 30_000, refetchOnWindowFocus: false } as const;

export function useCostCenters() {
  return useQuery({
    queryKey: [...pecKeys.all, "cost-centers"],
    queryFn: async (): Promise<CostCenter[]> => (isSupabaseConfigured ? listCostCenters() : []),
    ...COMMON,
  });
}

export function useContratos() {
  return useQuery({
    queryKey: [...pecKeys.all, "contracts"],
    queryFn: async (): Promise<Contract[]> => (isSupabaseConfigured ? listContracts() : []),
    ...COMMON,
  });
}

/** Lançamentos de caixa do Financeiro (module='fluxo'). */
export function useFluxoFinanceiro() {
  return useQuery({
    queryKey: [...pecKeys.all, "financeiro-fluxo"],
    queryFn: async (): Promise<FinancialRecord[]> =>
      isSupabaseConfigured ? listFinancialRecords("fluxo") : [],
    ...COMMON,
  });
}

export type CustoLote = { total: number; porCategoria: CustoPorCategoria };

/**
 * Centros de custo usados por MAIS DE UM lote.
 *
 * Nesse caso `custoAcumuladoPorLote` atribui o lançamento INTEIRO a cada lote —
 * somar os lotes dá mais que o gasto real. Não há rateio automático porque a
 * regra é de negócio (por cabeça? por arroba produzida? por dias?). A UI avisa
 * para o gestor separar os centros de custo ou interpretar o número.
 */
export function centrosDeCustoCompartilhados(lotes: PecLote[]): string[] {
  const contagem = new Map<string, number>();
  for (const lote of lotes) {
    if (!lote.centro_custo_id) continue;
    contagem.set(lote.centro_custo_id, (contagem.get(lote.centro_custo_id) ?? 0) + 1);
  }
  return [...contagem.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

/**
 * Custo acumulado de cada lote, via `pec_lote.centro_custo_id`.
 * Duas fontes reais de lançamento no sistema:
 *  - `contracts` ligados ao centro de custo (Financeiro V2, por FK);
 *  - `financial_records` module='fluxo' de saída, casados pelo NOME do centro
 *    de custo em `payload.centro_custo` (caminho legado, sem FK).
 * Transferências internas do desmame entram como custo no lote de destino.
 */
export function custoAcumuladoPorLote(
  lotes: PecLote[],
  costCenters: CostCenter[],
  contratos: Contract[],
  fluxo: FinancialRecord[],
): Map<string, CustoLote> {
  const ccPorId = new Map(costCenters.map((c) => [c.id, c]));
  const resultado = new Map<string, CustoLote>();

  for (const lote of lotes) {
    if (!lote.centro_custo_id) {
      resultado.set(lote.id, somarCustos([]));
      continue;
    }
    const cc = ccPorId.get(lote.centro_custo_id);
    const lancamentos: Array<{ valor: number; texto: string | null | undefined }> = [];

    for (const c of contratos) {
      if (c.cost_center_id !== lote.centro_custo_id) continue;
      lancamentos.push({ valor: Number(c.valor) || 0, texto: `${c.tipo} ${c.contraparte ?? ""}` });
    }

    if (cc) {
      for (const f of fluxo) {
        if (f.payload.centro_custo !== cc.nome) continue;
        if ((f.payload.tipo ?? "").toLowerCase() !== "saida") continue;
        lancamentos.push({
          valor: Number(f.payload.valor) || 0,
          texto: `${f.payload.categoria ?? ""} ${f.payload.descricao ?? ""}`,
        });
      }
    }

    resultado.set(lote.id, somarCustos(lancamentos));
  }
  return resultado;
}
