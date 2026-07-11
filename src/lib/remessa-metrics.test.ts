import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import { buildRemessaMetrics, caixasVaziasSaldo, remessaByFazenda } from "@/lib/remessa-metrics";

function rec(
  module: string,
  payload: Record<string, string>,
  id = module + Math.random(),
): OperationRecord {
  return { id, area: "logistica", module, payload };
}

const records: OperationRecord[] = [
  rec(
    "remessa",
    { fazenda: "Sato", variedade: "Taila", qtd_caixas: "881", peso_liquido: "19178" },
    "r1",
  ),
  rec(
    "remessa",
    { fazenda: "Sato", variedade: "Taila", qtd_caixas: "876", peso_liquido: "19368" },
    "r2",
  ),
  rec("caixas-vazias", { fazenda: "Sato", tipo: "saida_campo", qtd: "936" }, "c1"),
  rec("caixas-vazias", { fazenda: "Sato", tipo: "retorno_campo", qtd: "500" }, "c2"),
];

describe("buildRemessaMetrics", () => {
  const m = buildRemessaMetrics(records);
  it("soma caixas e peso e calcula média kg/cx", () => {
    expect(m.totalRemessas).toBe(2);
    expect(m.caixasTotal).toBe(1757);
    expect(m.pesoLiquidoTotal).toBe(38546);
    expect(m.mediaKgCx).toBe(21.9); // 38546 / 1757
    expect(m.fazendasAtivas).toBe(1);
  });
});

describe("remessaByFazenda", () => {
  it("agrega caixas por fazenda", () => {
    expect(remessaByFazenda(records)).toEqual([{ fazenda: "Sato", caixas: 1757 }]);
  });
});

describe("caixasVaziasSaldo", () => {
  it("calcula saldo = enviadas − retornadas", () => {
    expect(caixasVaziasSaldo(records)).toEqual([
      { fazenda: "Sato", enviadas: 936, retornadas: 500, saldo: 436 },
    ]);
  });
});
