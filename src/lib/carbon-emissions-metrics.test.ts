import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildCarbonMetrics,
  carbonByEscopo,
  carbonByCategoria,
  CARBON_FACTORS,
  carbonCostBRL,
  carbonFactorAutofill,
  carbonIntensityPerTon,
  carbonInventory,
  CARBON_PRICE_BRL_PER_T,
  fillCarbonCo2e,
  findCarbonFactor,
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

describe("fillCarbonCo2e (grava no salvar)", () => {
  it("preenche co2e = volume × fator quando vazio", () => {
    expect(fillCarbonCo2e({ volume: "180", fator: "2.68" }).co2e).toBe("482.4");
  });
  it("respeita co2e informado manualmente", () => {
    expect(fillCarbonCo2e({ volume: "180", fator: "2.68", co2e: "500" }).co2e).toBe("500");
  });
  it("não inventa co2e sem volume/fator", () => {
    expect(fillCarbonCo2e({ volume: "180" }).co2e).toBeUndefined();
  });
});

describe("carbonFactorAutofill (sugere pela categoria)", () => {
  it("preenche fator/unidade/escopo ao escolher categoria conhecida", () => {
    const r = carbonFactorAutofill({ categoria: "Diesel" }, "categoria");
    expect(r.fator).toBe("2.68");
    expect(r.unidade).toBe("L");
    expect(r.escopo).toBe("1");
  });
  it("não sobrescreve o que o usuário já digitou", () => {
    const r = carbonFactorAutofill({ categoria: "Diesel", fator: "3" }, "categoria");
    expect(r.fator).toBe("3");
  });
  it("ignora mudança de outro campo", () => {
    expect(carbonFactorAutofill({ categoria: "Diesel" }, "volume").fator).toBeUndefined();
  });
});

describe("CARBON_FACTORS (biblioteca de fatores)", () => {
  it("cobre os grandes grupos agro", () => {
    const grupos = new Set(CARBON_FACTORS.map((f) => f.grupo));
    for (const g of ["Combustíveis", "Fertilizantes", "Pecuária", "Agroquímicos", "Energia"]) {
      expect(grupos.has(g)).toBe(true);
    }
    expect(CARBON_FACTORS.length).toBeGreaterThanOrEqual(15);
  });
  it("todo fator é positivo e tem escopo 1/2/3", () => {
    for (const f of CARBON_FACTORS) {
      expect(f.fator).toBeGreaterThan(0);
      expect(["1", "2", "3"]).toContain(f.escopo);
    }
  });
});

describe("findCarbonFactor", () => {
  it("acha por categoria ignorando acento/caixa", () => {
    expect(findCarbonFactor("diesel")?.fator).toBe(2.68);
    expect(findCarbonFactor("Bovino corte (metano entérico)")?.escopo).toBe("1");
    expect(findCarbonFactor("inexistente")).toBeUndefined();
  });
});

describe("carbonInventory (inventário GHG)", () => {
  const records = [
    rec({ escopo: "1", categoria: "Diesel", co2e: "500" }),
    rec({ escopo: "1", categoria: "Diesel", co2e: "300" }),
    rec({ escopo: "3", categoria: "Transporte", co2e: "200" }),
  ];
  it("agrupa por escopo × categoria (kg e t)", () => {
    const inv = carbonInventory(records);
    expect(inv[0]).toEqual({ escopo: "1", categoria: "Diesel", co2eKg: 800, co2eT: 0.8 });
    expect(inv.find((r) => r.escopo === "3")?.co2eKg).toBe(200);
  });
});

describe("carbonIntensityPerTon", () => {
  it("kg CO₂e por tonelada produzida", () => {
    expect(carbonIntensityPerTon(1000, 50)).toBe(20);
    expect(carbonIntensityPerTon(1000, 0)).toBe(0);
  });
});

describe("carbonCostBRL (COGS)", () => {
  it("custo = tCO₂e × preço por tonelada", () => {
    expect(carbonCostBRL(2, 60)).toBe(120);
    expect(carbonCostBRL(0.632)).toBeCloseTo(0.632 * CARBON_PRICE_BRL_PER_T, 2);
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
