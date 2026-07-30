import type { ChartDatum, ValueFormat } from "@/lib/chart-theme";
import type { OverviewChart } from "@/lib/overview/types";

// Peças que se repetem em todo builder de visão geral. Existem para que cada
// módulo escreva o que é PRÓPRIO dele, não a mesma agregação 13 vezes.

/**
 * Os builders só precisam do payload — assim o mesmo helper serve para
 * operation_records (Logística, COGS…) e field_records (Campo), sem cast.
 */
export type RegistroComPayload = { payload: Record<string, string> };

export type RegistrosPorAba = Record<string, RegistroComPayload[]>;

export function num(value: unknown): number {
  const n = Number(
    String(value ?? "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) ? n : 0;
}

export function soma(records: RegistroComPayload[], campo: string): number {
  return records.reduce((s, r) => s + num(r.payload[campo]), 0);
}

/** Conta registros por valor de um campo, do maior para o menor. */
export function contaPor(
  records: RegistroComPayload[],
  campo: string,
  rotuloVazio = "Sem informação",
): Array<{ label: string; total: number }> {
  const mapa = new Map<string, number>();
  for (const r of records) {
    const chave = (r.payload[campo] ?? "").trim() || rotuloVazio;
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

/** Soma um campo numérico agrupando por outro campo, do maior para o menor. */
export function somaPor(
  records: RegistroComPayload[],
  campoGrupo: string,
  campoValor: string,
  rotuloVazio = "Sem informação",
): Array<{ label: string; valor: number }> {
  const mapa = new Map<string, number>();
  for (const r of records) {
    const chave = (r.payload[campoGrupo] ?? "").trim() || rotuloVazio;
    mapa.set(chave, (mapa.get(chave) ?? 0) + num(r.payload[campoValor]));
  }
  return [...mapa.entries()]
    .map(([label, valor]) => ({ label, valor }))
    .filter((x) => x.valor !== 0)
    .sort((a, b) => b.valor - a.valor);
}

/** Gráfico de barras a partir de uma lista {label, valor}. */
export function barras(input: {
  id: string;
  tabId: string;
  title: string;
  description?: string;
  data: Array<{ label: string; valor: number }>;
  nome: string;
  format?: ValueFormat;
  featured?: boolean;
  layout?: "horizontal" | "vertical";
  limite?: number;
}): OverviewChart {
  return {
    id: input.id,
    tabId: input.tabId,
    title: input.title,
    description: input.description,
    featured: input.featured,
    kind: "bars",
    layout: input.layout,
    xKey: "label",
    series: [{ key: "valor", name: input.nome }],
    format: input.format,
    data: (input.limite ? input.data.slice(0, input.limite) : input.data) as ChartDatum[],
  };
}

/** Donut de composição a partir de uma lista {label, total}. */
export function rosca(input: {
  id: string;
  tabId: string;
  title: string;
  description?: string;
  data: Array<{ label: string; total: number }>;
  nome: string;
  format?: ValueFormat;
  featured?: boolean;
  colors?: string[];
}): OverviewChart {
  return {
    id: input.id,
    tabId: input.tabId,
    title: input.title,
    description: input.description,
    featured: input.featured,
    kind: "donut",
    xKey: "label",
    series: [{ key: "total", name: input.nome }],
    format: input.format,
    colors: input.colors,
    data: input.data as ChartDatum[],
  };
}
