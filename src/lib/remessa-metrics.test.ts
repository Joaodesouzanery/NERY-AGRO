import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildRemessaMetrics,
  caixasDivergencia,
  caixasVaziasSaldo,
  etapaDe,
  permanenciaMinutos,
  quebraDe,
  remessaAtrasos,
  remessaByFazenda,
  remessaDivergencias,
} from "@/lib/remessa-metrics";
import { REMESSA_TOLERANCIAS_PADRAO } from "@/lib/app-settings";

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
  it("prefere os horários da balança (inequívocos, mesmo pátio)", () => {
    // ticket real: entrada 09h54, saída 11h22
    expect(
      permanenciaMinutos({
        hora_entrada_balanca: "09:54",
        hora_saida_balanca: "11:22",
        hora_chegada: "13:15",
        hora_saida: "15:40",
      }),
    ).toBe(88);
  });
});

// ---------------------------------------------------------------------------
// Ciclo da carga
// ---------------------------------------------------------------------------

describe("etapaDe — deriva a etapa dos registros antigos (sem backfill)", () => {
  it("usa a etapa explícita quando existe", () => {
    expect(etapaDe({ etapa: "beneficiamento" })).toBe("beneficiamento");
  });
  it("registro só com dado da lavoura fica em 'lavoura'", () => {
    expect(etapaDe({ fazenda: "Sato", qtd_caixas: "881" })).toBe("lavoura");
  });
  it("registro com peso/nº de pesagem já passou pela balança", () => {
    expect(etapaDe({ qtd_caixas: "881", peso_liquido: "19178" })).toBe("balanca");
    expect(etapaDe({ pesagem_num: "016417" })).toBe("balanca");
  });
  it("ressuscita o campo morto 'beneficiamento: OK' como conferida", () => {
    expect(etapaDe({ peso_liquido: "19178", beneficiamento: "OK" })).toBe("conferida");
  });
  it("conferência do beneficiamento fecha o ciclo", () => {
    expect(etapaDe({ peso_liquido: "19178", caixas_recebidas: "881" })).toBe("conferida");
  });
});

describe("quebraDe — as duas pesagens", () => {
  it("null enquanto só há uma ponta (carga em trânsito não é divergência)", () => {
    expect(quebraDe({ peso_liquido: "19178" })).toBeNull();
    expect(quebraDe({ peso_liquido_destino: "19178" })).toBeNull();
  });
  it("null quando o destino confirma o mesmo peso", () => {
    expect(quebraDe({ peso_liquido: "19178", peso_liquido_destino: "19178" })).toBeNull();
  });
  it("dentro da tolerância padrão (1,5%) fica 'ok'", () => {
    // 19178 → 19000 = 178 kg = 0,93%
    const q = quebraDe({ peso_liquido: "19178", peso_liquido_destino: "19000" });
    expect(q).toEqual({ kg: 178, pct: 0.93, nivel: "ok" });
  });
  it("acima da tolerância vira atenção", () => {
    // 19178 → 18800 = 378 kg = 1,97%
    expect(quebraDe({ peso_liquido: "19178", peso_liquido_destino: "18800" })?.nivel).toBe(
      "atencao",
    );
  });
  it("acima do dobro da tolerância vira crítico", () => {
    // 19178 → 18000 = 1178 kg = 6,14%
    expect(quebraDe({ peso_liquido: "19178", peso_liquido_destino: "18000" })?.nivel).toBe(
      "critico",
    );
  });
  it("usa o líquido final do ticket quando não há conferência do destino", () => {
    // ticket rasurado à mão: 19.178 impresso vs 19.368 escrito
    const q = quebraDe({ peso_liquido: "19178", peso_liquido_final: "19368" });
    expect(q?.kg).toBe(-190); // negativo = chegou MAIS peso que o declarado
    expect(q?.nivel).toBe("ok"); // 0,99% — dentro da tolerância
  });
  it("respeita a tolerância configurada pela empresa", () => {
    const rigorosa = { ...REMESSA_TOLERANCIAS_PADRAO, quebraPct: 0.5 };
    expect(
      quebraDe({ peso_liquido: "19178", peso_liquido_destino: "19000" }, rigorosa)?.nivel,
    ).toBe("atencao");
  });
});

describe("caixasDivergencia", () => {
  it("null quando não há as duas contagens ou elas batem", () => {
    expect(caixasDivergencia({ qtd_caixas: "881" })).toBeNull();
    expect(caixasDivergencia({ qtd_caixas: "881", caixas_recebidas: "881" })).toBeNull();
  });
  it("2 caixas de diferença ficam na tolerância padrão", () => {
    expect(caixasDivergencia({ qtd_caixas: "881", caixas_recebidas: "879" })?.nivel).toBe("ok");
  });
  it("5 caixas faltando vira crítico", () => {
    const d = caixasDivergencia({ qtd_caixas: "881", caixas_recebidas: "876" });
    expect(d).toEqual({ delta: 5, nivel: "critico" });
  });
});

describe("remessaDivergencias", () => {
  const divRecords: OperationRecord[] = [
    rec("remessa", { placa: "AAA-1A11", fazenda: "Sato", peso_liquido: "19178" }, "d1"),
    rec(
      "remessa",
      {
        placa: "BBB-2B22",
        fazenda: "Sato",
        romaneio_num: "9426",
        peso_liquido: "19178",
        peso_liquido_destino: "18000",
        qtd_caixas: "881",
        caixas_recebidas: "870",
      },
      "d2",
    ),
    rec(
      "remessa",
      {
        placa: "CCC-3C33",
        fazenda: "Nascente",
        peso_liquido: "19178",
        peso_liquido_destino: "18800",
      },
      "d3",
    ),
  ];
  const div = remessaDivergencias(divRecords);

  it("ignora carga em trânsito (só uma pesagem)", () => {
    expect(div.map((d) => d.placa)).not.toContain("AAA-1A11");
  });
  it("acusa peso e caixas na mesma carga, com o nº do romaneio", () => {
    const d = div.find((x) => x.placa === "BBB-2B22");
    expect(d?.nivel).toBe("critico");
    expect(d?.romaneio).toBe("9426");
    expect(d?.descricao).toContain("quebra");
    expect(d?.descricao).toContain("caixa");
  });
  it("põe as críticas antes das de atenção", () => {
    expect(div[0].nivel).toBe("critico");
  });

  it("entra nos KPIs da aba", () => {
    const m = buildRemessaMetrics(divRecords);
    expect(m.comDivergencia).toBe(2);
    expect(m.naEstrada).toBe(1); // só a AAA (as outras já foram conferidas)
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
