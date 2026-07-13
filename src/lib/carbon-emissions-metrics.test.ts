import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildCarbonMetrics,
  carbonByEscopo,
  carbonByCategoria,
  recordCo2e,
} from "@/lib/carbon-emissions-metrics";

function rec(payload: Record<string, string>, id = String(Math.random())): OperationRecord {
  return { id, area: "sustentabilidade", module: "carbono", payload };
}

describe("recordCo2e", () => {
  it("usa co2e informado", () => {
    expect(recordCo2e({ co2e: "482.4", volume: "180", fator: "2.68" })).toBe(482.4);
  });
  it("calcula volume × fator quando co2e vazio", () => {
    expect(recordCo2e({ volume: "180", fator: "2.68" })).toBeCloseTo(482.4, 1);
  });
});

describe("buildCarbonMetrics", () => {
  const records = [
    rec({ categoria: "Diesel", escopo: "1", volume: "180", fator: "2.68" }), // 482.4 kg (S1)
    rec({ categoria: "Energia elétrica", escopo: "2", co2e: "100" }), // 100 kg (S2)
    rec({ categoria: "Transporte", escopo: "3", co2e: "50" }), // 50 kg (S3)
  ];
  const m = buildCarbonMetrics(records);
  it("soma total e split por escopo", () => {
    expect(m.totalKg).toBe(632.4);
    expect(m.scope1).toBe(482.4);
    expect(m.scope2).toBe(100);
    expect(m.scope3).toBe(50);
    expect(m.registros).toBe(3);
  });
  it("converte para toneladas", () => {
    expect(m.totalT).toBeCloseTo(0.632, 3);
  });
});

describe("agrupamentos", () => {
  const records = [
    rec({ categoria: "Diesel", escopo: "1", co2e: "400" }),
    rec({ categoria: "Diesel", escopo: "1", co2e: "100" }),
    rec({ categoria: "Energia elétrica", escopo: "2", co2e: "80" }),
  ];
  it("carbonByCategoria soma por categoria (maior primeiro)", () => {
    expect(carbonByCategoria(records)).toEqual([
      { label: "Diesel", co2e: 500 },
      { label: "Energia elétrica", co2e: 80 },
    ]);
  });
  it("carbonByEscopo mostra o split", () => {
    const e = carbonByEscopo(records);
    expect(e.find((x) => x.label === "Escopo 1")?.co2e).toBe(500);
    expect(e.find((x) => x.label === "Escopo 2")?.co2e).toBe(80);
  });
});
