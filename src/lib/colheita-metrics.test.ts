import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import { buildColheitaPagamento, dentroDoPeriodo } from "@/lib/colheita-metrics";

function fr(module: string, payload: Record<string, string>, id = module): FieldRecord {
  return { id, module, payload };
}

const fields: FieldRecord[] = [
  fr(
    "colheita-corte",
    { qtd_caixas: "219", cortadores: "9", preco_caixa: "1.70", total: "372.30" },
    "c1",
  ),
  fr("colheita-carregamento", { qtd_caixas: "2632", chapas: "6", preco_caixa: "0.22" }, "cg1"),
  fr("rdc-ficha", { titulo: "ignorar" }, "x1"),
];

describe("buildColheitaPagamento", () => {
  const p = buildColheitaPagamento(fields);
  it("usa o total informado no corte", () => {
    expect(p.corte.valor).toBe(372.3);
    expect(p.corte.caixas).toBe(219);
    expect(p.corte.cortadores).toBe(9);
  });
  it("calcula caixas × preço quando não há total (carregamento)", () => {
    expect(p.carregamento.valor).toBeCloseTo(579.04, 2); // 2632 × 0.22
    expect(p.carregamento.chapas).toBe(6);
  });
  it("soma o total geral e ignora outros módulos", () => {
    expect(p.total).toBeCloseTo(951.34, 2);
  });
});

describe("dentroDoPeriodo", () => {
  it("sem período, tudo passa", () => {
    expect(dentroDoPeriodo({ data: "2026-07-08" })).toBe(true);
    expect(dentroDoPeriodo({ data: "2026-07-08" }, {})).toBe(true);
  });
  it("respeita os limites inclusivos", () => {
    const p = { de: "2026-07-08", ate: "2026-07-09" };
    expect(dentroDoPeriodo({ data: "2026-07-08" }, p)).toBe(true);
    expect(dentroDoPeriodo({ data: "2026-07-09" }, p)).toBe(true);
    expect(dentroDoPeriodo({ data: "2026-07-10" }, p)).toBe(false);
    expect(dentroDoPeriodo({ data: "2026-07-07" }, p)).toBe(false);
  });
  it("lançamento SEM data nunca some — esconder faria o fechamento pagar a menos", () => {
    expect(dentroDoPeriodo({}, { de: "2026-07-08", ate: "2026-07-09" })).toBe(true);
  });
});

// Números do apontamento real do Walter (08 e 09/07/2026).
describe("buildColheitaPagamento — fechamento por período", () => {
  const porData: FieldRecord[] = [
    fr("colheita-corte", { data: "2026-07-08", qtd_caixas: "219", total: "372.30" }, "d1"),
    fr(
      "colheita-corte",
      { data: "2026-07-09", qtd_caixas: "1665", total: "2830.50", total_mao_obra: "1080" },
      "d2",
    ),
    fr("colheita-diarias", { data: "2026-07-10", total_mao_obra: "540" }, "d3"),
    fr("colheita-corte", { qtd_caixas: "100", preco_caixa: "1.70" }, "sem-data"),
  ];

  it("sem período soma o acumulado da safra", () => {
    const p = buildColheitaPagamento(porData);
    expect(p.corte.registros).toBe(3);
    expect(p.maoObra.valor).toBe(1620); // 1080 embutido no corte + 540 da diária solta
  });

  it("filtra pelo dia e mantém o lançamento sem data", () => {
    const p = buildColheitaPagamento(porData, { de: "2026-07-08", ate: "2026-07-08" });
    expect(p.corte.registros).toBe(2); // o de 08/07 + o sem data
    expect(p.corte.caixas).toBe(319);
    expect(p.maoObra.valor).toBe(0); // a mão de obra é dos dias 09 e 10
  });

  it("período fora do intervalo ainda conta o sem-data", () => {
    const p = buildColheitaPagamento(porData, { de: "2026-01-01", ate: "2026-01-31" });
    expect(p.corte.registros).toBe(1);
  });
});
