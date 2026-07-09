import type { Fase } from "../types/domain";

// Constantes de manejo (padrões Embrapa) e regras de apartação do Modo Curral.
// Editáveis pelo gestor e persistidas em pec_config.payload por empresa. Os
// derivados (lotação, arrobas) leem daqui — nunca hard-coded no cálculo.

export type ApartacaoRegras = {
  /** peso ≥ pesoDestino → sugerir mover para loteDestinoId. */
  pesoDestinoKg: number | null;
  loteDestinoId: string | null;
  /** GMD < gmdMinimo por 2 pesagens → sugerir repasse. */
  gmdMinimo: number | null;
};

export type PecConfigPayload = {
  // Constantes Embrapa (editáveis)
  pesoUAkg: number; // peso da Unidade Animal
  eficienciaPastejo: number; // fração da forragem efetivamente consumida
  consumoPvPct: number; // consumo diário em % do peso vivo
  rendimentoCarcacaPct: number; // p/ custo por arroba (Fase 5)
  metaDiasPorFase: Record<Fase, number>; // meta de dias do ciclo por fase
  apartacao: ApartacaoRegras;
  /**
   * Acúmulo de matéria seca por hectare no período de pastejo (kg MS/ha/mês).
   * Deveria vir da oferta estimada por NDVI; como NÃO há fonte de NDVI no
   * sistema, é um parâmetro editável pelo gestor. Ver `ndviDisponivel`.
   */
  ofertaForragemKgMsHaMes: number;
  diasPastejoPeriodo: number;
  /** Descanso mínimo (dias) por forrageira, para sugerir rotação. */
  descansoPorForrageira: Record<string, number>;
  /** Preço de venda da arroba (R$/@) — base da margem/@ e do romaneio. */
  precoArrobaVenda: number;
  /**
   * Valor de mercado por categoria (R$/cabeça), usado na TRANSFERÊNCIA INTERNA
   * do desmame: receita interna na cria × custo interno na recria. Sem isso a
   * cria aparece falsamente no vermelho.
   */
  valorMercadoPorCategoria: Record<string, number>;
};

export const DEFAULT_PEC_CONFIG: PecConfigPayload = {
  pesoUAkg: 450,
  eficienciaPastejo: 0.45,
  consumoPvPct: 0.022,
  rendimentoCarcacaPct: 0.52,
  metaDiasPorFase: {
    cria: 210,
    recria: 240,
    engorda: 120,
    terminacao: 90,
  },
  apartacao: {
    pesoDestinoKg: null,
    loteDestinoId: null,
    gmdMinimo: null,
  },
  ofertaForragemKgMsHaMes: 1000,
  diasPastejoPeriodo: 30,
  descansoPorForrageira: {
    Marandu: 28,
    Piatã: 30,
    Mombaça: 32,
  },
  precoArrobaVenda: 320,
  valorMercadoPorCategoria: {
    bezerro: 2200,
    bezerra: 2000,
  },
};

/**
 * NDVI não existe neste sistema (nem simulado). A lotação recomendada usa a
 * oferta de forragem informada pelo gestor. Trocar por dado de satélite é a
 * Fase 8 — até lá a UI deve dizer que o número é estimativa, não medição.
 */
export const NDVI_DISPONIVEL = false;

/** Descanso mínimo da forrageira do talhão (fallback: 30 dias). */
export function descansoMinimoDias(forrageira: string | undefined, cfg: PecConfigPayload): number {
  if (!forrageira) return 30;
  const match = Object.keys(cfg.descansoPorForrageira).find((k) =>
    forrageira.toLowerCase().includes(k.toLowerCase()),
  );
  return match ? cfg.descansoPorForrageira[match] : 30;
}

/** Mescla o payload salvo com os defaults (tolerante a campos ausentes). */
export function normalizeConfig(payload: unknown): PecConfigPayload {
  const p = (payload ?? {}) as Partial<PecConfigPayload>;
  return {
    pesoUAkg: p.pesoUAkg ?? DEFAULT_PEC_CONFIG.pesoUAkg,
    eficienciaPastejo: p.eficienciaPastejo ?? DEFAULT_PEC_CONFIG.eficienciaPastejo,
    consumoPvPct: p.consumoPvPct ?? DEFAULT_PEC_CONFIG.consumoPvPct,
    rendimentoCarcacaPct: p.rendimentoCarcacaPct ?? DEFAULT_PEC_CONFIG.rendimentoCarcacaPct,
    metaDiasPorFase: { ...DEFAULT_PEC_CONFIG.metaDiasPorFase, ...(p.metaDiasPorFase ?? {}) },
    apartacao: { ...DEFAULT_PEC_CONFIG.apartacao, ...(p.apartacao ?? {}) },
    ofertaForragemKgMsHaMes:
      p.ofertaForragemKgMsHaMes ?? DEFAULT_PEC_CONFIG.ofertaForragemKgMsHaMes,
    diasPastejoPeriodo: p.diasPastejoPeriodo ?? DEFAULT_PEC_CONFIG.diasPastejoPeriodo,
    descansoPorForrageira: {
      ...DEFAULT_PEC_CONFIG.descansoPorForrageira,
      ...(p.descansoPorForrageira ?? {}),
    },
    precoArrobaVenda: p.precoArrobaVenda ?? DEFAULT_PEC_CONFIG.precoArrobaVenda,
    valorMercadoPorCategoria: {
      ...DEFAULT_PEC_CONFIG.valorMercadoPorCategoria,
      ...(p.valorMercadoPorCategoria ?? {}),
    },
  };
}
