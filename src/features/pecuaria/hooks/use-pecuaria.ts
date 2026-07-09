import { useQuery } from "@tanstack/react-query";
import {
  getConfig,
  listAnimais,
  listCarencia,
  listEstoqueSemen,
  listEventosReprodutivos,
  listEventosSanitarios,
  listGmd,
  listGta,
  listLotes,
  listOcupacoes,
  listPesagens,
  listProducao,
  listTalhoes,
} from "../api/pecuaria-data";
import { pecKeys } from "../api/query-keys";
import type { GmdAnimal, PecPesagem } from "../types/domain";
import { normalizeConfig, type PecConfigPayload } from "../lib/apartacao-config";

const COMMON = { staleTime: 30_000, refetchOnWindowFocus: false } as const;

export function useLotes() {
  return useQuery({ queryKey: pecKeys.lotes(), queryFn: listLotes, ...COMMON });
}

export function useAnimais() {
  return useQuery({ queryKey: pecKeys.animais(), queryFn: listAnimais, ...COMMON });
}

export function usePesagens() {
  return useQuery({ queryKey: pecKeys.pesagens(), queryFn: () => listPesagens(), ...COMMON });
}

export function useEventosSanitarios() {
  return useQuery({ queryKey: pecKeys.sanitarios(), queryFn: listEventosSanitarios, ...COMMON });
}

export function useGmd() {
  return useQuery({ queryKey: pecKeys.gmd(), queryFn: listGmd, ...COMMON });
}

export function useCarencia() {
  return useQuery({ queryKey: pecKeys.carencia(), queryFn: listCarencia, ...COMMON });
}

export function useConfig() {
  return useQuery({
    queryKey: pecKeys.config(),
    queryFn: async (): Promise<PecConfigPayload> => normalizeConfig(await getConfig()),
    ...COMMON,
  });
}

export function useOcupacoes() {
  return useQuery({ queryKey: pecKeys.ocupacoes(), queryFn: listOcupacoes, ...COMMON });
}

export function useTalhoes() {
  return useQuery({ queryKey: pecKeys.talhoes(), queryFn: listTalhoes, ...COMMON });
}

export function useEventosReprodutivos() {
  return useQuery({
    queryKey: pecKeys.reprodutivos(),
    queryFn: listEventosReprodutivos,
    ...COMMON,
  });
}

export function useEstoqueSemen() {
  return useQuery({ queryKey: pecKeys.semen(), queryFn: listEstoqueSemen, ...COMMON });
}

export function useGta() {
  return useQuery({ queryKey: pecKeys.gta(), queryFn: listGta, ...COMMON });
}

export function useProducao() {
  return useQuery({ queryKey: pecKeys.producao(), queryFn: listProducao, ...COMMON });
}

// ── Seletores puros (usar com useMemo nos componentes) ────────────────────

/** Agrupa pesagens por animal, cada grupo ordenado por data crescente. */
export function groupPesagensByAnimal(pesagens: PecPesagem[]): Map<string, PecPesagem[]> {
  const map = new Map<string, PecPesagem[]>();
  for (const p of pesagens) {
    const arr = map.get(p.animal_id) ?? [];
    arr.push(p);
    map.set(p.animal_id, arr);
  }
  for (const arr of map.values()) arr.sort((a, b) => a.data.localeCompare(b.data));
  return map;
}

/** Mapa animal_id → linha de GMD da view. */
export function gmdByAnimal(rows: GmdAnimal[]): Map<string, GmdAnimal> {
  const map = new Map<string, GmdAnimal>();
  for (const r of rows) if (r.animal_id) map.set(r.animal_id, r);
  return map;
}

/** Mapa animal_id → libera_em (carência ativa). */
export function carenciaByAnimal(rows: { animal_id: string | null; libera_em: string | null }[]) {
  const map = new Map<string, string>();
  for (const r of rows) if (r.animal_id && r.libera_em) map.set(r.animal_id, r.libera_em);
  return map;
}
