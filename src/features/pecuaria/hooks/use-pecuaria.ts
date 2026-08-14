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
import { useDemoMode } from "@/hooks/use-demo-mode";
import type { GmdAnimal, PecPesagem } from "../types/domain";
import { normalizeConfig, type PecConfigPayload } from "../lib/apartacao-config";

const COMMON = { staleTime: 30_000, refetchOnWindowFocus: false } as const;

// Todo hook aqui segue o mesmo padrão: `demoMode` entra na chave E é passado
// para a leitura. Assim DEMO e REAL ocupam entradas de cache distintas e
// alternar o modo troca o dado na hora, sem servir o valor do outro modo.

export function useLotes() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.lotes(demoMode),
    queryFn: () => listLotes(demoMode),
    ...COMMON,
  });
}

export function useAnimais() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.animais(demoMode),
    queryFn: () => listAnimais(demoMode),
    ...COMMON,
  });
}

export function usePesagens() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.pesagens(demoMode),
    queryFn: () => listPesagens(demoMode),
    ...COMMON,
  });
}

export function useEventosSanitarios() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.sanitarios(demoMode),
    queryFn: () => listEventosSanitarios(demoMode),
    ...COMMON,
  });
}

export function useGmd() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.gmd(demoMode),
    queryFn: () => listGmd(demoMode),
    ...COMMON,
  });
}

export function useCarencia() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.carencia(demoMode),
    queryFn: () => listCarencia(demoMode),
    ...COMMON,
  });
}

export function useConfig() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.config(demoMode),
    queryFn: async (): Promise<PecConfigPayload> => normalizeConfig(await getConfig(demoMode)),
    ...COMMON,
  });
}

export function useOcupacoes() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.ocupacoes(demoMode),
    queryFn: () => listOcupacoes(demoMode),
    ...COMMON,
  });
}

export function useTalhoes() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.talhoes(demoMode),
    queryFn: () => listTalhoes(demoMode),
    ...COMMON,
  });
}

export function useEventosReprodutivos() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.reprodutivos(demoMode),
    queryFn: () => listEventosReprodutivos(demoMode),
    ...COMMON,
  });
}

export function useEstoqueSemen() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.semen(demoMode),
    queryFn: () => listEstoqueSemen(demoMode),
    ...COMMON,
  });
}

export function useGta() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.gta(demoMode),
    queryFn: () => listGta(demoMode),
    ...COMMON,
  });
}

export function useProducao() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: pecKeys.producao(demoMode),
    queryFn: () => listProducao(demoMode),
    ...COMMON,
  });
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
