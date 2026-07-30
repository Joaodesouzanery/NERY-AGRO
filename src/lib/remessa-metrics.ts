import type { OperationRecord } from "@/lib/supabase-operations";
import { REMESSA_TOLERANCIAS_PADRAO, type RemessaTolerancias } from "@/lib/app-settings";

// Métricas puras de Remessa/Recebimento (colheita) — derivadas dos
// operation_records (area "logistica", module "remessa"), + saldo de caixas
// vazias (module "caixas-vazias"). Sem React/Supabase: testável e reusável pela
// aba da Logística, pela Torre de Controle e pelo dashboard.

function num(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function norm(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function byModule(records: OperationRecord[], module: string): OperationRecord[] {
  return records.filter((r) => r.module === module);
}

// ---------------------------------------------------------------------------
// Ciclo da carga: lavoura → balança → beneficiamento → conferida
// ---------------------------------------------------------------------------

export type RemessaEtapa = "lavoura" | "balanca" | "beneficiamento" | "conferida" | "cancelada";

export const ETAPA_LABEL: Record<RemessaEtapa, string> = {
  lavoura: "Na lavoura",
  balanca: "Pesada na balança",
  beneficiamento: "Aguardando conferência",
  conferida: "Conferida",
  cancelada: "Cancelada",
};

const ETAPAS_VALIDAS = new Set<string>(Object.keys(ETAPA_LABEL));

/**
 * Etapa atual da carga. Quando `etapa` não existe no payload (todo registro
 * anterior a este bloco), DERIVA a partir do que já foi preenchido — assim o
 * histórico entra no ciclo sem backfill nem migração.
 */
export function etapaDe(payload: Record<string, string>): RemessaEtapa {
  const explicita = norm(payload.etapa);
  if (ETAPAS_VALIDAS.has(explicita)) return explicita as RemessaEtapa;
  // "beneficiamento: OK" era o campo morto do formulário — agora ele fala.
  const conferido =
    norm(payload.conferencia_ok).startsWith("s") ||
    norm(payload.conferencia_ok) === "ok" ||
    norm(payload.beneficiamento) === "ok";
  if (conferido || num(payload.caixas_recebidas) > 0 || num(payload.peso_liquido_destino) > 0) {
    return "conferida";
  }
  if (num(payload.peso_liquido) > 0 || payload.pesagem_num?.trim()) return "balanca";
  return "lavoura";
}

export type Quebra = {
  kg: number; // origem − destino (positivo = faltou peso no destino)
  pct: number;
  nivel: "ok" | "atencao" | "critico";
};

/**
 * Quebra entre o peso que saiu da lavoura/balança e o conferido no
 * beneficiamento. `null` quando ainda não há as duas pontas — é o caso normal
 * de uma carga em trânsito, e não deve virar alerta.
 */
export function quebraDe(
  payload: Record<string, string>,
  tol: RemessaTolerancias = REMESSA_TOLERANCIAS_PADRAO,
): Quebra | null {
  const origem = num(payload.peso_liquido);
  // O destino pode vir da conferência do beneficiamento ou do "líquido final"
  // rasurado à mão no ticket da balança.
  const destino = num(payload.peso_liquido_destino) || num(payload.peso_liquido_final);
  if (!(origem > 0) || !(destino > 0) || origem === destino) return null;
  const kg = Math.round((origem - destino) * 100) / 100;
  const pct = Math.round((Math.abs(kg) / origem) * 10000) / 100;
  const nivel = pct > tol.quebraPct * 2 ? "critico" : pct > tol.quebraPct ? "atencao" : "ok";
  return { kg, pct, nivel };
}

/** Diferença entre caixas que saíram e caixas recebidas no beneficiamento. */
export function caixasDivergencia(
  payload: Record<string, string>,
  tol: RemessaTolerancias = REMESSA_TOLERANCIAS_PADRAO,
): { delta: number; nivel: "ok" | "atencao" | "critico" } | null {
  const saiu = num(payload.qtd_caixas);
  const recebeu = num(payload.caixas_recebidas);
  if (!(saiu > 0) || !(recebeu > 0)) return null;
  const delta = saiu - recebeu;
  if (delta === 0) return null;
  const abs = Math.abs(delta);
  return { delta, nivel: abs > tol.caixas * 2 ? "critico" : abs > tol.caixas ? "atencao" : "ok" };
}

export type Divergencia = {
  id: string;
  placa: string;
  fazenda: string;
  romaneio: string;
  nivel: "atencao" | "critico";
  descricao: string;
};

/** Cargas cuja conferência não fecha — origem da fila de alertas da Torre. */
export function remessaDivergencias(
  records: OperationRecord[],
  tol: RemessaTolerancias = REMESSA_TOLERANCIAS_PADRAO,
): Divergencia[] {
  const out: Divergencia[] = [];
  for (const r of byModule(records, "remessa")) {
    const motivos: string[] = [];
    let nivel: "atencao" | "critico" = "atencao";
    const q = quebraDe(r.payload, tol);
    if (q && q.nivel !== "ok") {
      motivos.push(`quebra de ${q.kg} kg (${q.pct}%)`);
      if (q.nivel === "critico") nivel = "critico";
    }
    const c = caixasDivergencia(r.payload, tol);
    if (c && c.nivel !== "ok") {
      motivos.push(`${Math.abs(c.delta)} caixa(s) de diferença`);
      if (c.nivel === "critico") nivel = "critico";
    }
    if (!motivos.length) continue;
    out.push({
      id: r.id,
      placa: r.payload.placa?.trim() || "-",
      fazenda: r.payload.fazenda?.trim() || "-",
      romaneio: r.payload.romaneio_num?.trim() || "",
      nivel,
      descricao: motivos.join(" e "),
    });
  }
  return out.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "critico" ? -1 : 1));
}

export type RemessaMetrics = {
  totalRemessas: number;
  caixasTotal: number;
  pesoLiquidoTotal: number; // kg
  mediaKgCx: number; // peso ÷ caixas
  atrasadas: number; // status marcado como atraso
  fazendasAtivas: number;
  naEstrada: number; // etapa lavoura ou balanca
  aguardandoConferencia: number; // etapa beneficiamento
  comDivergencia: number;
};

export function buildRemessaMetrics(
  records: OperationRecord[],
  tol: RemessaTolerancias = REMESSA_TOLERANCIAS_PADRAO,
): RemessaMetrics {
  const remessas = byModule(records, "remessa");
  const caixasTotal = remessas.reduce((s, r) => s + num(r.payload.qtd_caixas), 0);
  const pesoLiquidoTotal = remessas.reduce((s, r) => s + num(r.payload.peso_liquido), 0);
  const atrasadas = remessas.filter((r) => norm(r.payload.status).includes("atras")).length;
  const fazendas = new Set(
    remessas.map((r) => norm(r.payload.fazenda)).filter((f) => f && f !== "-"),
  );
  const etapas = remessas.map((r) => etapaDe(r.payload));
  return {
    totalRemessas: remessas.length,
    caixasTotal,
    pesoLiquidoTotal,
    mediaKgCx: caixasTotal ? Math.round((pesoLiquidoTotal / caixasTotal) * 10) / 10 : 0,
    atrasadas,
    fazendasAtivas: fazendas.size,
    naEstrada: etapas.filter((e) => e === "lavoura" || e === "balanca").length,
    aguardandoConferencia: etapas.filter((e) => e === "beneficiamento").length,
    comDivergencia: remessaDivergencias(remessas, tol).length,
  };
}

/** Caixas colhidas agregadas por fazenda (barra), maior primeiro. */
export function remessaByFazenda(
  records: OperationRecord[],
): Array<{ fazenda: string; caixas: number }> {
  const map = new Map<string, number>();
  for (const r of byModule(records, "remessa")) {
    const fazenda = r.payload.fazenda?.trim() || "Sem fazenda";
    map.set(fazenda, (map.get(fazenda) ?? 0) + num(r.payload.qtd_caixas));
  }
  return [...map.entries()]
    .map(([fazenda, caixas]) => ({ fazenda, caixas }))
    .sort((a, b) => b.caixas - a.caixas);
}

/** Caixas colhidas por variedade (barra). */
export function remessaByVariedade(
  records: OperationRecord[],
): Array<{ variedade: string; caixas: number }> {
  const map = new Map<string, number>();
  for (const r of byModule(records, "remessa")) {
    const variedade = r.payload.variedade?.trim() || "Sem variedade";
    map.set(variedade, (map.get(variedade) ?? 0) + num(r.payload.qtd_caixas));
  }
  return [...map.entries()]
    .map(([variedade, caixas]) => ({ variedade, caixas }))
    .sort((a, b) => b.caixas - a.caixas);
}

export type SaldoCaixas = { fazenda: string; enviadas: number; retornadas: number; saldo: number };

/**
 * Razão de caixas vazias por fazenda: enviadas (saida_campo) − retornadas
 * (retorno_campo) = saldo ainda no campo. Um saldo alto/negativo indica caixa
 * perdida ou contagem furada.
 */
export function caixasVaziasSaldo(records: OperationRecord[]): SaldoCaixas[] {
  const map = new Map<string, { enviadas: number; retornadas: number }>();
  for (const r of byModule(records, "caixas-vazias")) {
    const fazenda = r.payload.fazenda?.trim() || "Sem fazenda";
    const qtd = num(r.payload.qtd);
    const entry = map.get(fazenda) ?? { enviadas: 0, retornadas: 0 };
    if (norm(r.payload.tipo).includes("retorno")) entry.retornadas += qtd;
    else entry.enviadas += qtd;
    map.set(fazenda, entry);
  }
  return [...map.entries()]
    .map(([fazenda, v]) => ({ fazenda, ...v, saldo: v.enviadas - v.retornadas }))
    .sort((a, b) => b.saldo - a.saldo);
}

/**
 * Permanência do caminhão no local (saída − chegada), em minutos. Prefere os
 * horários da BALANÇA, que são inequívocos (entrada e saída no mesmo pátio);
 * cai para chegada/saída do apontamento quando a balança não foi preenchida.
 * null se faltar horário ou se a conta der negativa (horários de locais
 * diferentes).
 */
export function permanenciaMinutos(payload: Record<string, string>): number | null {
  const toMin = (t?: string) => {
    const m = (t ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const pares: Array<[string | undefined, string | undefined]> = [
    [payload.hora_entrada_balanca, payload.hora_saida_balanca],
    [payload.hora_chegada, payload.hora_saida],
  ];
  for (const [entrada, saida] of pares) {
    const e = toMin(entrada);
    const s = toMin(saida);
    if (e == null || s == null) continue;
    const diff = s - e;
    if (diff >= 0) return diff;
  }
  return null;
}

export type Atraso = {
  id: string;
  placa: string;
  fazenda: string;
  permanencia: number | null; // minutos
  motivo: string;
};

/**
 * Remessas em atraso: status marcado como atrasado OU permanência acima do SLA
 * (padrão 180 min). Para acompanhar "caminhão chegou/ficou muito tempo".
 */
export function remessaAtrasos(
  records: OperationRecord[],
  slaMin = REMESSA_TOLERANCIAS_PADRAO.slaPermanenciaMin,
): Atraso[] {
  const out: Atraso[] = [];
  for (const r of byModule(records, "remessa")) {
    const perm = permanenciaMinutos(r.payload);
    const lateStatus = norm(r.payload.status).includes("atras");
    if (lateStatus || (perm != null && perm > slaMin)) {
      out.push({
        id: r.id,
        placa: r.payload.placa?.trim() || "-",
        fazenda: r.payload.fazenda?.trim() || "-",
        permanencia: perm,
        motivo: lateStatus
          ? "Status atrasado"
          : `Permanência ${Math.round((perm! / 60) * 10) / 10}h`,
      });
    }
  }
  return out;
}

// Destino do beneficiamento (do ticket de balança: Fazenda Matrice, BR-251, Cristalina-GO).
export const BENEFICIAMENTO = { nome: "Fazenda Matrice", lat: -16.78, lng: -47.55 };

// Coordenadas aproximadas por fazenda (região de Cristalina-GO). AJUSTE com as
// coordenadas reais das fazendas do cliente quando ele confirmar.
const FAZENDA_COORDS: Record<string, { lat: number; lng: number }> = {
  sato: { lat: -16.7, lng: -47.7 },
  nascente: { lat: -16.85, lng: -47.65 },
  "monte alto": { lat: -16.72, lng: -47.5 },
  matrice: { lat: -16.78, lng: -47.55 },
};

// Coordenada da fazenda: overrides (configurados pelo usuário) têm prioridade
// sobre os defaults aproximados de FAZENDA_COORDS.
export function fazendaCoord(
  fazenda: string,
  overrides?: Record<string, { lat: number; lng: number }>,
): { lat: number; lng: number } | null {
  const key = norm(fazenda);
  return overrides?.[key] ?? FAZENDA_COORDS[key] ?? null;
}

export type RemessaGeo = { fazenda: string; caixas: number; lat: number; lng: number };

/** Caixas por fazenda COM coordenada conhecida (para o mapa origem→beneficiamento). */
export function remessaGeoPorFazenda(
  records: OperationRecord[],
  overrides?: Record<string, { lat: number; lng: number }>,
): RemessaGeo[] {
  return remessaByFazenda(records)
    .map((r) => {
      const c = fazendaCoord(r.fazenda, overrides);
      return c ? { fazenda: r.fazenda, caixas: r.caixas, ...c } : null;
    })
    .filter((x): x is RemessaGeo => x !== null);
}
