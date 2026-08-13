import { useMemo } from "react";
import { parsePolygon, polygonAreaHa } from "@/features/talhao-360/map/geometry";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import {
  useAnimais,
  useConfig,
  useLotes,
  useOcupacoes,
  usePesagens,
  useTalhoes,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { diasDesde, lotacaoUAha, ultimoPeso } from "@/features/pecuaria/lib/derived";

/** Área do talhão: prefere o valor declarado; cai para o cálculo do polígono. */
function areaHaDoTalhao(t: TalhaoRecord): number | null {
  const declarada = Number.parseFloat(t.payload.area_ha ?? "");
  if (Number.isFinite(declarada) && declarada > 0) return declarada;
  const poly = parsePolygon(t.payload.geometry_geojson);
  if (!poly) return null;
  const area = polygonAreaHa(poly.coordinates[0] as Array<[number, number]>);
  return area > 0 ? area : null;
}

export type TalhaoOcupado = {
  talhao: TalhaoRecord;
  areaHa: number | null;
  ocupacaoId: string | null;
  loteId: string | null;
  loteNome: string | null;
  cabecas: number;
  pesoVivoKg: number;
  uaHa: number | null;
  diasOcupacao: number | null;
  /** Dias desde a última saída (null = nunca ocupado). */
  diasDescanso: number | null;
  emLavoura: boolean;
};

/**
 * Linhas de ocupação por talhão (lote, peso vivo, UA/ha) — usadas pela aba
 * Pastos e pelo resumo da Visão Geral, sem duplicar o cálculo.
 */
export function useOcupacaoLinhas() {
  const talhoesQ = useTalhoes();
  const ocupacoesQ = useOcupacoes();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const configQ = useConfig();

  const cfg = configQ.data;
  const talhoes = useMemo(() => talhoesQ.data ?? [], [talhoesQ.data]);
  const ocupacoes = useMemo(() => ocupacoesQ.data ?? [], [ocupacoesQ.data]);
  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);

  const pesoPorAnimal = useMemo(() => {
    const grupos = groupPesagensByAnimal(pesagensQ.data ?? []);
    const map = new Map<string, number>();
    for (const [animalId, ps] of grupos) {
      const peso = ultimoPeso(ps);
      if (peso !== null) map.set(animalId, peso);
    }
    return map;
  }, [pesagensQ.data]);

  const linhas: TalhaoOcupado[] = useMemo(() => {
    const animais = animaisQ.data ?? [];
    return talhoes.map((talhao) => {
      const areaHa = areaHaDoTalhao(talhao);
      const aberta = ocupacoes.find((o) => o.talhao_id === talhao.id && !o.data_saida) ?? null;
      const fechadas = ocupacoes.filter((o) => o.talhao_id === talhao.id && o.data_saida);
      const ultimaSaida = fechadas
        .map((o) => o.data_saida as string)
        .sort((a, b) => b.localeCompare(a))[0];

      const lote = aberta ? (lotes.find((l) => l.id === aberta.lote_id) ?? null) : null;
      const doLote = lote
        ? animais.filter((a) => a.lote_id === lote.id && a.status === "ativo")
        : [];
      const pesoVivoKg = doLote.reduce((s, a) => s + (pesoPorAnimal.get(a.id) ?? 0), 0);
      const uaHa =
        areaHa && pesoVivoKg > 0 ? lotacaoUAha(pesoVivoKg, areaHa, cfg?.pesoUAkg ?? 450) : null;

      const cultura = (talhao.payload.cultura ?? "").toLowerCase();
      const emLavoura = !aberta && cultura !== "" && !cultura.includes("past");

      return {
        talhao,
        areaHa,
        ocupacaoId: aberta?.id ?? null,
        loteId: lote?.id ?? null,
        loteNome: lote?.nome ?? null,
        cabecas: doLote.length,
        pesoVivoKg,
        uaHa,
        diasOcupacao: aberta ? diasDesde(aberta.data_entrada) : null,
        diasDescanso: aberta ? null : ultimaSaida ? diasDesde(ultimaSaida) : null,
        emLavoura,
      };
    });
  }, [talhoes, ocupacoes, lotes, animaisQ.data, pesoPorAnimal, cfg?.pesoUAkg]);

  return {
    linhas,
    cfg,
    talhoes,
    ocupacoes,
    lotes,
    isLoading: talhoesQ.isLoading || configQ.isLoading,
  };
}
