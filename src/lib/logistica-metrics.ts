import type { OperationRecord } from "@/lib/supabase-operations";

// Métricas puras da Logística — derivadas dos operation_records (area "logistica").
// Sem dependência de React/Supabase, para serem testáveis e reusadas pelo
// dashboard, pela Torre de Controle e pelo COGS.

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

export type LogisticaMetrics = {
  totalCargas: number;
  emTransito: number;
  entregues: number;
  atrasadas: number;
  aguardando: number;
  otif: number; // entregues / (entregues + atrasadas) * 100
  valorTotal: number; // soma de cargas.valor
  custoFreteTotal: number; // soma de fretes (custo + combustível + pedágio)
  frotaTotal: number;
  frotaDisponivel: number;
  capacidadePct: number; // disponível / total * 100
};

export function buildLogisticaMetrics(records: OperationRecord[]): LogisticaMetrics {
  const cargas = byModule(records, "cargas");
  const fretes = byModule(records, "fretes");
  const frota = byModule(records, "frota");

  const statusCount = (term: string) =>
    cargas.filter((c) => norm(c.payload.status).includes(term)).length;

  const entregues = statusCount("entregue");
  const atrasadas = statusCount("atras");
  const emTransito = statusCount("transito");
  const aguardando = statusCount("aguard");

  const valorTotal = cargas.reduce((sum, c) => sum + num(c.payload.valor), 0);
  const custoFreteTotal = fretes.reduce(
    (sum, f) => sum + num(f.payload.custo) + num(f.payload.combustivel) + num(f.payload.pedagio),
    0,
  );

  const frotaTotal = frota.length;
  const frotaDisponivel = frota.filter((f) => norm(f.payload.status).includes("dispon")).length;
  const otifBase = entregues + atrasadas;

  return {
    totalCargas: cargas.length,
    emTransito,
    entregues,
    atrasadas,
    aguardando,
    otif: otifBase ? Math.round((entregues / otifBase) * 100) : 0,
    valorTotal,
    custoFreteTotal,
    frotaTotal,
    frotaDisponivel,
    capacidadePct: frotaTotal ? Math.round((frotaDisponivel / frotaTotal) * 100) : 0,
  };
}

/** Custo de frete agregado por rota (para gráfico de barras), maior primeiro. */
export function freightByRoute(records: OperationRecord[]): Array<{ rota: string; custo: number }> {
  const fretes = byModule(records, "fretes");
  const map = new Map<string, number>();
  for (const f of fretes) {
    const rota = f.payload.rota?.trim() || "Sem rota";
    const custo = num(f.payload.custo) + num(f.payload.combustivel) + num(f.payload.pedagio);
    map.set(rota, (map.get(rota) ?? 0) + custo);
  }
  return [...map.entries()]
    .map(([rota, custo]) => ({ rota, custo }))
    .sort((a, b) => b.custo - a.custo);
}

/** Distribuição de cargas por status (para donut/legenda). */
export function cargaStatusBreakdown(
  records: OperationRecord[],
): Array<{ status: string; valor: number }> {
  const cargas = byModule(records, "cargas");
  const map = new Map<string, number>();
  for (const c of cargas) {
    const status = c.payload.status?.trim() || "Sem status";
    map.set(status, (map.get(status) ?? 0) + 1);
  }
  return [...map.entries()].map(([status, valor]) => ({ status, valor }));
}

export type SlaBreach = {
  id: string;
  codigo: string;
  cliente: string;
  eta: string;
  motivo: "Status atrasado" | "ETA vencida";
};

/**
 * Cargas em violação de SLA: status já marcado como atrasado, OU com ETA (data)
 * anterior a `today` e ainda não entregue. `today` é injetado (ISO yyyy-mm-dd)
 * para a função permanecer pura/testável.
 */
export function slaBreaches(records: OperationRecord[], today: string): SlaBreach[] {
  const cargas = byModule(records, "cargas");
  const breaches: SlaBreach[] = [];
  for (const c of cargas) {
    const status = norm(c.payload.status);
    if (status.includes("entregue")) continue;
    const eta = c.payload.eta?.trim() ?? "";
    const isLateStatus = status.includes("atras");
    const isEtaPast = /^\d{4}-\d{2}-\d{2}$/.test(eta) && eta < today;
    if (isLateStatus || isEtaPast) {
      breaches.push({
        id: c.id,
        codigo: c.payload.codigo?.trim() || c.id,
        cliente: c.payload.cliente?.trim() || "-",
        eta: eta || "-",
        motivo: isLateStatus ? "Status atrasado" : "ETA vencida",
      });
    }
  }
  return breaches;
}
