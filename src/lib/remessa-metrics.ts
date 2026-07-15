import type { OperationRecord } from "@/lib/supabase-operations";

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

export type RemessaMetrics = {
  totalRemessas: number;
  caixasTotal: number;
  pesoLiquidoTotal: number; // kg
  mediaKgCx: number; // peso ÷ caixas
  atrasadas: number; // status marcado como atraso
  fazendasAtivas: number;
};

export function buildRemessaMetrics(records: OperationRecord[]): RemessaMetrics {
  const remessas = byModule(records, "remessa");
  const caixasTotal = remessas.reduce((s, r) => s + num(r.payload.qtd_caixas), 0);
  const pesoLiquidoTotal = remessas.reduce((s, r) => s + num(r.payload.peso_liquido), 0);
  const atrasadas = remessas.filter((r) => norm(r.payload.status).includes("atras")).length;
  const fazendas = new Set(
    remessas.map((r) => norm(r.payload.fazenda)).filter((f) => f && f !== "-"),
  );
  return {
    totalRemessas: remessas.length,
    caixasTotal,
    pesoLiquidoTotal,
    mediaKgCx: caixasTotal ? Math.round((pesoLiquidoTotal / caixasTotal) * 10) / 10 : 0,
    atrasadas,
    fazendasAtivas: fazendas.size,
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

/** Permanência do caminhão no local (saída − chegada), em minutos. null se faltar horário. */
export function permanenciaMinutos(payload: Record<string, string>): number | null {
  const toMin = (t?: string) => {
    const m = (t ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const c = toMin(payload.hora_chegada);
  const s = toMin(payload.hora_saida);
  if (c == null || s == null) return null;
  const diff = s - c;
  return diff >= 0 ? diff : null;
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
export function remessaAtrasos(records: OperationRecord[], slaMin = 180): Atraso[] {
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
