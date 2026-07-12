import type { FieldRecord } from "@/lib/supabase-field";

// Fechamento de pagamento da colheita — derivado dos field_records
// "colheita-corte" (cortadores) e "colheita-carregamento" (chapas). Puro/testável.
// Valor = total informado, ou (caixas × preço/caixa) quando o total não veio.

function num(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function valorDe(payload: Record<string, string>): number {
  const total = num(payload.total);
  if (total > 0) return total;
  return num(payload.qtd_caixas) * num(payload.preco_caixa);
}

export type ColheitaPagamento = {
  corte: { registros: number; caixas: number; cortadores: number; valor: number };
  carregamento: {
    registros: number;
    caixas: number;
    chapas: number;
    valor: number;
    carretasVazias: number;
  };
  total: number;
};

export function buildColheitaPagamento(fields: FieldRecord[]): ColheitaPagamento {
  const corte = fields.filter((f) => f.module === "colheita-corte");
  const carreg = fields.filter((f) => f.module === "colheita-carregamento");

  const corteAgg = corte.reduce(
    (acc, f) => ({
      caixas: acc.caixas + num(f.payload.qtd_caixas),
      cortadores: acc.cortadores + num(f.payload.cortadores),
      valor: acc.valor + valorDe(f.payload),
    }),
    { caixas: 0, cortadores: 0, valor: 0 },
  );

  const carregAgg = carreg.reduce(
    (acc, f) => ({
      caixas: acc.caixas + num(f.payload.qtd_caixas),
      chapas: acc.chapas + num(f.payload.chapas),
      carretasVazias: acc.carretasVazias + num(f.payload.carretas_vazias),
      valor: acc.valor + valorDe(f.payload),
    }),
    { caixas: 0, chapas: 0, carretasVazias: 0, valor: 0 },
  );

  return {
    corte: { registros: corte.length, ...corteAgg },
    carregamento: { registros: carreg.length, ...carregAgg },
    total: corteAgg.valor + carregAgg.valor,
  };
}
