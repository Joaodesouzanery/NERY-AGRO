import { useMemo } from "react";
import {
  useAnimais,
  useConfig,
  useLotes,
  usePesagens,
  groupPesagensByAnimal,
} from "./use-pecuaria";
import {
  custoAcumuladoPorLote,
  useContratos,
  useCostCenters,
  useFluxoFinanceiro,
} from "./use-financeiro-pecuaria";
import {
  arrobasProduzidas,
  custoPorArroba,
  custoVazio,
  ganhoPesoAnimal,
  margemPorArroba,
  resultadoLote,
  type CustoPorCategoria,
} from "../lib/custos";
import type { PecLote } from "../types/domain";

export type RentabilidadeLote = {
  lote: PecLote;
  cabecas: number;
  ganhoTotalKg: number;
  arrobas: number;
  custoTotal: number;
  porCategoria: CustoPorCategoria;
  custoArroba: number | null;
  margemArroba: number | null;
  resultado: number | null;
};

/**
 * Rentabilidade por lote: arrobas produzidas (das pesagens) × custo acumulado
 * (dos lançamentos do centro de custo). Tudo derivado — nada persistido.
 */
export function useRentabilidadeLotes() {
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const configQ = useConfig();
  const ccQ = useCostCenters();
  const contratosQ = useContratos();
  const fluxoQ = useFluxoFinanceiro();

  const isLoading =
    lotesQ.isLoading || animaisQ.isLoading || pesagensQ.isLoading || configQ.isLoading;

  const data = useMemo(() => {
    const lotes = lotesQ.data ?? [];
    const animais = animaisQ.data ?? [];
    const cfg = configQ.data;
    const pesagensMap = groupPesagensByAnimal(pesagensQ.data ?? []);
    const custos = custoAcumuladoPorLote(
      lotes,
      ccQ.data ?? [],
      contratosQ.data ?? [],
      fluxoQ.data ?? [],
    );

    const map = new Map<string, RentabilidadeLote>();
    for (const lote of lotes) {
      const doLote = animais.filter((a) => a.lote_id === lote.id);
      const ganhoTotalKg = doLote.reduce(
        (soma, a) => soma + ganhoPesoAnimal(pesagensMap.get(a.id) ?? []),
        0,
      );
      const arrobas = cfg ? arrobasProduzidas(ganhoTotalKg, cfg.rendimentoCarcacaPct) : 0;
      const custo = custos.get(lote.id) ?? { total: 0, porCategoria: custoVazio() };
      const custoArroba = custoPorArroba(custo.total, arrobas);
      const margemArroba = cfg ? margemPorArroba(cfg.precoArrobaVenda, custoArroba) : null;

      map.set(lote.id, {
        lote,
        cabecas: doLote.length,
        ganhoTotalKg,
        arrobas,
        custoTotal: custo.total,
        porCategoria: custo.porCategoria,
        custoArroba,
        margemArroba,
        resultado: resultadoLote(margemArroba, arrobas),
      });
    }
    return map;
  }, [
    lotesQ.data,
    animaisQ.data,
    pesagensQ.data,
    configQ.data,
    ccQ.data,
    contratosQ.data,
    fluxoQ.data,
  ]);

  return { data, isLoading };
}
