import type { ConnectedAgroSnapshot } from "@/lib/connected-agro-data";

// Série mensal REAL da Torre. Existia um array literal `fallbackSeries` com
// OTIF/vendas/capacidade inventados alimentando o gráfico "KPIs operacionais" —
// e ele aparecia em modo REAL, com Supabase configurado e dados de verdade.
// Aqui os números saem dos registros; quando não há histórico suficiente, a
// resposta honesta é o gráfico vazio, não um gráfico bonito e falso.

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export type MonthlyPoint = {
  label: string;
  /** % de cargas entregues no prazo no mês; `null` num mês sem carga alguma. */
  otif: number | null;
  /** Entradas financeiras do mês (R$). */
  vendas: number;
  /** Cargas registradas no mês. */
  cargas: number;
};

function num(value: unknown): number {
  const n = Number(
    String(value ?? "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) ? n : 0;
}

/** Chave "AAAA-MM" a partir de uma data ISO/BR do payload ou do created_at. */
function chaveMes(payload: Record<string, string>, createdAt?: string): string | null {
  const candidatos = [payload.data, payload.eta, payload.vencimento, payload.emissao, createdAt];
  for (const raw of candidatos) {
    const v = (raw ?? "").trim();
    if (!v) continue;
    const iso = v.match(/^(\d{4})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}`;
    const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return `${br[3]}-${br[2]}`;
  }
  return null;
}

function rotulo(chave: string): string {
  const [ano, mes] = chave.split("-");
  return `${MESES[Number(mes) - 1] ?? mes}/${ano.slice(2)}`;
}

/**
 * Agrupa cargas e fluxo de caixa por mês. Devolve os últimos 12 meses COM
 * registro, em ordem cronológica. Menos de 2 meses → array vazio: um gráfico de
 * tendência com um ponto só não é tendência.
 */
export function buildMonthlySeries(snapshot: ConnectedAgroSnapshot): MonthlyPoint[] {
  const meses = new Map<string, { cargas: number; noPrazo: number; vendas: number }>();
  const pega = (chave: string) => {
    const atual = meses.get(chave) ?? { cargas: 0, noPrazo: 0, vendas: 0 };
    meses.set(chave, atual);
    return atual;
  };

  for (const r of snapshot.operations) {
    if (r.module !== "cargas") continue;
    const chave = chaveMes(r.payload, r.created_at);
    if (!chave) continue;
    const m = pega(chave);
    m.cargas += 1;
    const status = String(r.payload.status ?? "").toLowerCase();
    if (status.includes("entregue") && !status.includes("atras")) m.noPrazo += 1;
  }

  for (const r of snapshot.financial) {
    if (r.module !== "fluxo") continue;
    const tipo = String(r.payload.tipo ?? "").toLowerCase();
    if (!tipo.includes("entrada")) continue;
    const chave = chaveMes(r.payload, r.created_at);
    if (!chave) continue;
    pega(chave).vendas += num(r.payload.valor);
  }

  const ordenados = [...meses.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  if (ordenados.length < 2) return [];

  return ordenados.map(([chave, m]) => ({
    label: rotulo(chave),
    // `null`, não 0: um mês que só teve receita entra na série pelo fluxo de
    // caixa e desenhava "OTIF 0%" — desempenho péssimo num mês sem entrega
    // nenhuma. Recharts abre um vão no ponto null, que é o que aconteceu.
    otif: m.cargas ? Math.round((m.noPrazo / m.cargas) * 100) : null,
    vendas: Math.round(m.vendas),
    cargas: m.cargas,
  }));
}

export type SeveridadeFatia = { severidade: string; alertas: number };

/** Alertas por severidade (donut da Torre). */
export function alertasPorSeveridade(
  alerts: Array<{ severity: "info" | "warning" | "danger" }>,
): SeveridadeFatia[] {
  const rotulos: Record<string, string> = {
    danger: "Crítico",
    warning: "Atenção",
    info: "Informativo",
  };
  const ordem = ["danger", "warning", "info"];
  return ordem
    .map((sev) => ({
      severidade: rotulos[sev],
      alertas: alerts.filter((a) => a.severity === sev).length,
    }))
    .filter((f) => f.alertas > 0);
}
