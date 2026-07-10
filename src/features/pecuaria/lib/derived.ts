// Métricas DERIVADAS da pecuária — funções puras e testáveis. Nada aqui é
// persistido: GMD, projeção de abate, lotação e carência saem sempre de cálculo
// (espelham as views v_gmd_animal / v_animal_carencia no lado do cliente).

const MS_DIA = 86_400_000;

/** Interpreta "YYYY-MM-DD" como data UTC (evita drift de fuso). */
function parseDia(iso: string): number | null {
  if (!iso) return null;
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

function hojeUtcIso(ref?: Date): string {
  return (ref ?? new Date()).toISOString().slice(0, 10);
}

/** Dias (inteiros) entre duas datas ISO. Positivo se `fim` > `inicio`. */
export function diasEntre(inicio: string, fim: string): number | null {
  const a = parseDia(inicio);
  const b = parseDia(fim);
  if (a === null || b === null) return null;
  return Math.round((b - a) / MS_DIA);
}

/** Dias decorridos desde uma data até hoje (ou `ref`). */
export function diasDesde(iso: string, ref?: Date): number | null {
  return diasEntre(iso, hojeUtcIso(ref));
}

export type PesagemPonto = { data: string; peso_kg: number };

/** Ordena pesagens por data crescente (não muta o array de entrada). */
export function ordenarPesagens<T extends PesagemPonto>(pesagens: T[]): T[] {
  return [...pesagens].sort((a, b) => (parseDia(a.data) ?? 0) - (parseDia(b.data) ?? 0));
}

/** GMD (kg/dia) entre duas pesagens. null se o intervalo for inválido. */
export function gmdEntre(
  pesoAnt: number,
  dataAnt: string,
  pesoAtual: number,
  dataAtual: string,
): number | null {
  const dias = diasEntre(dataAnt, dataAtual);
  if (dias === null || dias <= 0) return null;
  return (pesoAtual - pesoAnt) / dias;
}

/** GMD do último intervalo de uma série de pesagens. Precisa de ≥ 2 pontos. */
export function gmdUltimo(pesagens: PesagemPonto[]): number | null {
  const ord = ordenarPesagens(pesagens);
  if (ord.length < 2) return null;
  const ultimo = ord[ord.length - 1];
  const anterior = ord[ord.length - 2];
  return gmdEntre(anterior.peso_kg, anterior.data, ultimo.peso_kg, ultimo.data);
}

/** GMD médio (média dos GMDs de todos os intervalos consecutivos). */
export function gmdMedio(pesagens: PesagemPonto[]): number | null {
  const ord = ordenarPesagens(pesagens);
  if (ord.length < 2) return null;
  const gmds: number[] = [];
  for (let i = 1; i < ord.length; i++) {
    const g = gmdEntre(ord[i - 1].peso_kg, ord[i - 1].data, ord[i].peso_kg, ord[i].data);
    if (g !== null) gmds.push(g);
  }
  if (!gmds.length) return null;
  return gmds.reduce((s, g) => s + g, 0) / gmds.length;
}

/** Último peso conhecido de uma série. */
export function ultimoPeso(pesagens: PesagemPonto[]): number | null {
  const ord = ordenarPesagens(pesagens);
  return ord.length ? ord[ord.length - 1].peso_kg : null;
}

/** Idade em meses (por calendário) a partir da data de nascimento. */
export function idadeMeses(nascimento: string | null, ref?: Date): number | null {
  if (!nascimento) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento.slice(0, 10));
  if (!m) return null;
  const [ny, nmo, nd] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const r = ref ?? new Date();
  let meses = (r.getUTCFullYear() - ny) * 12 + (r.getUTCMonth() + 1 - nmo);
  if (r.getUTCDate() < nd) meses -= 1;
  return meses < 0 ? null : meses;
}

/**
 * Expande uma faixa de brincos numéricos em uma lista de identificadores.
 * Preserva o zero-padding do menor limite (ex.: "0480"→"0480").
 * Retorna [] se os limites não forem numéricos ou a faixa for inválida.
 */
export function parseBrincoRange(inicio: string, fim: string, max = 5000): string[] {
  const a = Number.parseInt(inicio.trim(), 10);
  const b = Number.parseInt(fim.trim(), 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return [];
  if (b - a + 1 > max) return [];
  const width = Math.max(inicio.trim().length, fim.trim().length);
  const padded = /^0\d/.test(inicio.trim()) || /^0\d/.test(fim.trim());
  const out: string[] = [];
  for (let n = a; n <= b; n++) {
    out.push(padded ? String(n).padStart(width, "0") : String(n));
  }
  return out;
}

/**
 * Quantos animais uma faixa de brincos geraria (sem materializar a lista).
 *
 * Devolve o total REAL mesmo acima do teto de `parseBrincoRange` — de propósito:
 * o modal precisa do número para dizer "faixa grande demais (6000), máximo 5000".
 * Quem materializa é `parseBrincoRange`, que aí sim recusa acima do teto.
 */
export function contarFaixa(inicio: string, fim: string): number {
  const a = Number.parseInt(inicio.trim(), 10);
  const b = Number.parseInt(fim.trim(), 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return b - a + 1;
}

export type ProjecaoAbate = { dias: number; data: string };

/**
 * Projeta quando o animal/lote atinge o peso alvo, no ritmo do GMD atual.
 * null se faltar dado ou o GMD não for positivo.
 */
export function projecaoAbate(
  pesoAtual: number | null,
  pesoAlvo: number | null,
  gmd: number | null,
  ref?: Date,
): ProjecaoAbate | null {
  if (pesoAtual === null || pesoAlvo === null || gmd === null || gmd <= 0) return null;
  if (pesoAtual >= pesoAlvo) return { dias: 0, data: hojeUtcIso(ref) };
  const dias = Math.ceil((pesoAlvo - pesoAtual) / gmd);
  const data = new Date((parseDia(hojeUtcIso(ref)) ?? 0) + dias * MS_DIA)
    .toISOString()
    .slice(0, 10);
  return { dias, data };
}

export type DesvioTag = "destaque" | "normal" | "investigar";

/** Classifica o GMD de um animal contra a média do lote. */
export function desvioGmdTag(gmdAnimal: number | null, gmdMedioLote: number | null): DesvioTag {
  if (gmdAnimal === null || gmdMedioLote === null || gmdMedioLote === 0) return "normal";
  const desvio = (gmdAnimal - gmdMedioLote) / gmdMedioLote;
  if (desvio > 0.1) return "destaque";
  if (desvio < -0.25) return "investigar";
  return "normal";
}

/** Animal está em carência (bloqueado p/ abate/venda) se libera_em > hoje. */
export function emCarencia(liberaEm: string | null, ref?: Date): boolean {
  if (!liberaEm) return false;
  const l = parseDia(liberaEm);
  const h = parseDia(hojeUtcIso(ref));
  if (l === null || h === null) return false;
  return l > h;
}

/**
 * Lotação em UA/ha: (peso vivo total ÷ peso da UA) ÷ área.
 * UA padrão = 450 kg (parâmetro Embrapa, editável em apartacao-config).
 */
export function lotacaoUAha(pesoVivoTotalKg: number, areaHa: number, pesoUA = 450): number | null {
  if (areaHa <= 0 || pesoUA <= 0) return null;
  return pesoVivoTotalKg / pesoUA / areaHa;
}

export type ConstantesPastejo = {
  eficienciaPastejo: number;
  consumoPvPct: number;
  pesoUAkg: number;
};

/**
 * Lotação recomendada (UA/ha) = oferta de forragem do período × eficiência de
 * pastejo ÷ consumo do período por UA.
 * Consumo diário de 1 UA = consumoPvPct × pesoUAkg (2,2% de 450 kg = 9,9 kg MS/dia).
 *
 * A `oferta` deve ser o ACÚMULO de MS no período (kg MS/ha), não a biomassa em pé.
 * Sem NDVI no sistema, ela vem de parâmetro editável — é estimativa, não medição.
 */
export function lotacaoRecomendadaUAha(
  ofertaKgMsHaPeriodo: number,
  cfg: ConstantesPastejo,
  diasPeriodo = 30,
): number | null {
  const consumoDiarioUA = cfg.consumoPvPct * cfg.pesoUAkg;
  const consumoPeriodoUA = consumoDiarioUA * diasPeriodo;
  if (consumoPeriodoUA <= 0 || ofertaKgMsHaPeriodo <= 0) return null;
  return (ofertaKgMsHaPeriodo * cfg.eficienciaPastejo) / consumoPeriodoUA;
}

export type FaixaLotacaoId = "subutilizado" | "ideal" | "atencao" | "superlotado";

export type FaixaLotacao = {
  id: FaixaLotacaoId;
  label: string;
  color: string;
};

const FAIXA_SEM_DADO: FaixaLotacao = { id: "subutilizado", label: "Sem dado", color: "#94a3b8" };

/** Classifica a lotação nas faixas do plano (<1,0 · 1,0–1,6 · 1,6–1,9 · >1,9). */
export function faixaLotacao(uaHa: number | null): FaixaLotacao {
  if (uaHa === null || !Number.isFinite(uaHa)) return FAIXA_SEM_DADO;
  if (uaHa < 1.0) return { id: "subutilizado", label: "Subutilizado", color: "#64748b" };
  if (uaHa <= 1.6) return { id: "ideal", label: "Ideal", color: "#16a34a" };
  if (uaHa <= 1.9) return { id: "atencao", label: "Atenção", color: "#d97706" };
  return { id: "superlotado", label: "Superlotado", color: "#dc2626" };
}
