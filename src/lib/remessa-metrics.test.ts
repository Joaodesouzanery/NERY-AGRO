import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildRemessaMetrics,
  caixasVaziasSaldo,
  permanenciaMinutos,
  remessaAtrasos,
  remessaByFazenda,
} from "@/lib/remessa-metrics";

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

describe("permanenciaMinutos", () => {
  it("calcula saída − chegada", () => {
    expect(permanenciaMinutos({ hora_chegada: "13:15", hora_saida: "15:40" })).toBe(145);
  });
  it("retorna null sem os dois horários", () => {
    expect(permanenciaMinutos({ hora_saida: "15:40" })).toBeNull();
  });
});

describe("remessaAtrasos", () => {
  const atrasoRecords: OperationRecord[] = [
    rec(
      "remessa",
      { placa: "AAA-1A11", fazenda: "Sato", hora_chegada: "08:00", hora_saida: "15:40" },
      "a1",
    ),
    rec("remessa", { placa: "BBB-2B22", fazenda: "Nascente", status: "Atrasada" }, "a2"),
    rec(
      "remessa",
      { placa: "CCC-3C33", fazenda: "Sato", hora_chegada: "13:15", hora_saida: "15:40" },
      "a3",
    ),
  ];
  it("pega permanência acima do SLA e status atrasado, ignora o normal", () => {
    const at = remessaAtrasos(atrasoRecords, 180);
    expect(at.map((a) => a.placa).sort()).toEqual(["AAA-1A11", "BBB-2B22"]);
  });
});
