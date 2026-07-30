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
  maoObra: { registros: number; valor: number };
  total: number;
};

/** Período fechado [de, ate] em ISO (yyyy-mm-dd); limites inclusivos. */
export type PeriodoISO = { de?: string; ate?: string };

/**
 * Filtra por `payload.data`. Registro SEM data nunca some — esconder lançamento
 * por falta de data faria o fechamento pagar a menos sem ninguém perceber.
 */
export function dentroDoPeriodo(payload: Record<string, string>, periodo?: PeriodoISO): boolean {
  if (!periodo?.de && !periodo?.ate) return true;
  const data = (payload.data ?? "").trim();
  if (!data) return true;
  if (periodo.de && data < periodo.de) return false;
  if (periodo.ate && data > periodo.ate) return false;
  return true;
}

export function buildColheitaPagamento(
  fields: FieldRecord[],
  periodo?: PeriodoISO,
): ColheitaPagamento {
  const noPeriodo = fields.filter((f) => dentroDoPeriodo(f.payload, periodo));
  const corte = noPeriodo.filter((f) => f.module === "colheita-corte");
  const carreg = noPeriodo.filter((f) => f.module === "colheita-carregamento");
  const diarias = noPeriodo.filter((f) => f.module === "colheita-diarias");

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

  // Mão de obra: soma `total_mao_obra` de TODOS os registros de colheita — as
  // diárias/horas podem vir soltas (colheita-diarias) OU embutidas num bloco de
  // corte/carregamento; cada registro entra uma vez.
  const comMaoObra = [...corte, ...carreg, ...diarias].filter(
    (f) => num(f.payload.total_mao_obra) > 0,
  );
  const maoObraValor = comMaoObra.reduce((s, f) => s + num(f.payload.total_mao_obra), 0);

  return {
    corte: { registros: corte.length, ...corteAgg },
    carregamento: { registros: carreg.length, ...carregAgg },
    maoObra: { registros: comMaoObra.length, valor: maoObraValor },
    total: corteAgg.valor + carregAgg.valor + maoObraValor,
  };
}
