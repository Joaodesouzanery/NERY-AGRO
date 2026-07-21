import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import { buildCarbonSuggestions, suggestionToPayload } from "@/lib/carbon-auto-capture";

function op(module: string, payload: Record<string, string>, id = module): OperationRecord {
  return { id, area: "logistica", module, payload };
}

describe("buildCarbonSuggestions", () => {
  it("rebanho → metano entérico (cabeças × fator)", () => {
    const s = buildCarbonSuggestions({ operations: [], pecuariaCabecas: 100 });
    const pec = s.find((x) => x.id === "pec-enterico");
    expect(pec?.escopo).toBe("1");
    expect(pec?.co2e).toBe(160000); // 100 × 1600
  });

  it("cargas → frete t·km via coordenadas", () => {
    const cargas = [
      op(
        "cargas",
        {
          peso: "24000", // 24 t
          origem_lat: "-16.767",
          origem_lng: "-47.613",
          destino_lat: "-23.55",
          destino_lng: "-46.63",
        },
        "c1",
      ),
    ];
    const s = buildCarbonSuggestions({ operations: cargas, pecuariaCabecas: 0 });
    const frete = s.find((x) => x.id === "cargas-frete");
    expect(frete?.escopo).toBe("3");
    expect(frete?.volume).toBeGreaterThan(0); // t·km > 0
    expect(frete?.co2e).toBeCloseTo((frete?.volume ?? 0) * 0.1, 1);
  });

  it("fretes → diesel (km × consumo)", () => {
    const fretes = [op("fretes", { km: "408" }, "f1")];
    const s = buildCarbonSuggestions(
      { operations: fretes, pecuariaCabecas: 0 },
      { dieselLPerKm: 0.5 },
    );
    const d = s.find((x) => x.id === "fretes-diesel");
    expect(d?.volume).toBe(204); // 408 × 0.5
    expect(d?.co2e).toBeCloseTo(204 * 2.68, 0);
  });

  it("sem dado → sem sugestão", () => {
    expect(buildCarbonSuggestions({ operations: [], pecuariaCabecas: 0 })).toEqual([]);
  });

  it("suggestionToPayload monta o registro de carbono", () => {
    const [s] = buildCarbonSuggestions({ operations: [], pecuariaCabecas: 50 });
    const p = suggestionToPayload(s, "2026");
    expect(p.categoria).toContain("Bovino");
    expect(p.escopo).toBe("1");
    expect(p.status).toContain("auto");
    expect(p.periodo).toBe("2026");
  });

  it("suggestionToPayload inclui `talhao` quando a fonte tem, omite quando é farm-wide", () => {
    const [s] = buildCarbonSuggestions({ operations: [], pecuariaCabecas: 10 });
    // rebanho é farm-wide → sem talhão
    expect(suggestionToPayload(s, "2026").talhao).toBeUndefined();
    // uma sugestão atribuível a um talhão flui para o payload
    expect(suggestionToPayload({ ...s, talhao: "T14" }, "2026").talhao).toBe("T14");
  });
});
