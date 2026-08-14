import type { OperationRecord } from "@/lib/supabase-operations";

// Conciliação de fontes da MESMA carga. Uma carga chega ao sistema por até três
// caminhos — a mensagem de texto do apontador, a foto do romaneio de papel e o
// ticket impresso da balança — e hoje cada um viraria um registro solto.
//
// Não existe chave única confiável: o nº do romaneio só aparece no papel, o nº
// da pesagem só no ticket, e placa+data quebra no caso real (o mesmo caminhão
// faz duas viagens no mesmo dia — romaneios 9425 e 9426). Por isso a decisão é
// por PONTUAÇÃO, e o merge NUNCA é automático: o humano confirma.

export type MatchCandidate = {
  id: string;
  score: number;
  motivos: string[];
  payload: Record<string, string>;
  createdAt?: string;
};

/** Score a partir do qual vale mostrar o candidato. */
export const SCORE_MINIMO = 60;
/** Score a partir do qual "conciliar" vem pré-selecionado. */
export const SCORE_FORTE = 100;

const PESOS = {
  romaneio: 100, // identificador natural do documento de papel
  pesagem: 100, // identificador natural do ticket da balança
  ordem: 45, // ordem de produção (TL03 PV51 SATO CEB)
  placaData: 40,
  hora: 20, // desempata duas viagens do mesmo caminhão no mesmo dia
  caixas: 25,
  peso: 25,
  local: 10, // fazenda + talhão
} as const;

function norm(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function num(value: unknown): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function minutos(hhmm: string | undefined): number | null {
  const m = (hhmm ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Qualquer horário conhecido da carga, para desempate. */
function horaRef(p: Record<string, string>): number | null {
  return (
    minutos(p.hora_saida) ??
    minutos(p.hora_entrada_balanca) ??
    minutos(p.hora_chegada) ??
    minutos(p.hora_saida_balanca)
  );
}

function iguais(a: unknown, b: unknown): boolean {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x) && x === y;
}

function pontuar(
  nova: Record<string, string>,
  alvo: Record<string, string>,
): { score: number; motivos: string[] } {
  let score = 0;
  const motivos: string[] = [];

  if (iguais(nova.romaneio_num, alvo.romaneio_num)) {
    score += PESOS.romaneio;
    motivos.push(`mesmo nº de romaneio (${alvo.romaneio_num})`);
  }
  if (iguais(nova.pesagem_num, alvo.pesagem_num)) {
    score += PESOS.pesagem;
    motivos.push(`mesmo nº de pesagem (${alvo.pesagem_num})`);
  }
  if (iguais(nova.ordem_producao, alvo.ordem_producao)) {
    score += PESOS.ordem;
    motivos.push("mesma ordem de produção");
  }

  const mesmaPlaca = iguais(nova.placa, alvo.placa);
  const mesmaData = iguais(nova.data, alvo.data);
  if (mesmaPlaca && mesmaData) {
    score += PESOS.placaData;
    motivos.push("mesma placa e data");
    // Sem isso, duas viagens do mesmo caminhão no mesmo dia empatariam.
    const hNova = horaRef(nova);
    const hAlvo = horaRef(alvo);
    if (hNova != null && hAlvo != null) {
      const delta = Math.abs(hNova - hAlvo);
      if (delta <= 90) {
        score += PESOS.hora;
        motivos.push("horário compatível");
      } else {
        score -= PESOS.hora;
        motivos.push(`horários distantes (${Math.round(delta / 60)}h) — pode ser outra viagem`);
      }
    }
  }

  const cxNova = num(nova.qtd_caixas);
  const cxAlvo = num(alvo.qtd_caixas);
  if (cxNova > 0 && cxAlvo > 0 && Math.abs(cxNova - cxAlvo) <= 2) {
    score += PESOS.caixas;
    motivos.push("mesma quantidade de caixas");
  }

  const pNova = num(nova.peso_liquido);
  const pAlvo = num(alvo.peso_liquido);
  if (pNova > 0 && pAlvo > 0 && Math.abs(pNova - pAlvo) <= 50) {
    score += PESOS.peso;
    motivos.push("mesmo peso líquido");
  }

  if (iguais(nova.fazenda, alvo.fazenda) && iguais(nova.talhao, alvo.talhao)) {
    score += PESOS.local;
    motivos.push("mesma fazenda e talhão");
  }

  return { score, motivos };
}

/** Diferença em dias entre duas datas ISO; Infinity se alguma faltar. */
function distanciaDias(a: string | undefined, b: string | undefined): number {
  if (!a || !b) return Infinity;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (!Number.isFinite(da) || !Number.isFinite(db)) return Infinity;
  return Math.abs(da - db) / 86_400_000;
}

/**
 * Cargas já registradas que podem ser a mesma da fonte nova, da mais provável
 * para a menos. Pré-filtra por data (±3 dias) para não pontuar o histórico
 * inteiro — quando a fonte nova não tem data, cai nos 200 mais recentes.
 */
export function matchRemessaCandidates(
  nova: Record<string, string>,
  existentes: OperationRecord[],
): MatchCandidate[] {
  const candidatos = nova.data
    ? existentes.filter((r) => {
        const d = distanciaDias(nova.data, r.payload.data);
        return d === Infinity || d <= 3;
      })
    : existentes.slice(0, 200);

  return candidatos
    .map((r) => {
      const { score, motivos } = pontuar(nova, r.payload);
      return { id: r.id, score, motivos, payload: r.payload, createdAt: r.created_at };
    })
    .filter((c) => c.score >= SCORE_MINIMO)
    .sort((a, b) => b.score - a.score);
}

/** Resumo de uma linha para a lista de candidatos ("NFN-6I47 · 08/07 · 881 cx"). */
export function resumoCandidato(payload: Record<string, string>): string {
  const partes = [
    payload.placa,
    payload.data,
    payload.romaneio_num ? `romaneio ${payload.romaneio_num}` : "",
    payload.qtd_caixas ? `${payload.qtd_caixas} cx` : "",
    payload.fazenda,
  ].filter(Boolean);
  return partes.join(" · ") || "carga sem identificação";
}
