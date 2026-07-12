import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import { buildColheitaPagamento } from "@/lib/colheita-metrics";

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
