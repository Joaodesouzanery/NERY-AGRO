import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import { parseWeightHistory, upcomingVaccinations } from "./pecuaria-metrics";

describe("parseWeightHistory", () => {
  it("lê pares 'rótulo: peso kg' separados por ;", () => {
    expect(parseWeightHistory("2026-03: 398 kg; 2026-05: 418 kg")).toEqual([
      { label: "2026-03", peso: 398 },
      { label: "2026-05", peso: 418 },
    ]);
  });

  it("aceita decimal com vírgula e quebra de linha", () => {
    expect(parseWeightHistory("Jan: 12,5kg\nFev: 13.2 kg")).toEqual([
      { label: "Jan", peso: 12.5 },
      { label: "Fev", peso: 13.2 },
    ]);
  });

  it("ignora vazio e partes malformadas", () => {
    expect(parseWeightHistory("")).toEqual([]);
    expect(parseWeightHistory(null)).toEqual([]);
    expect(parseWeightHistory("sem dois pontos; 2026-05: 418")).toEqual([
      { label: "2026-05", peso: 418 },
    ]);
  });
});

function vac(id: string, payload: Record<string, string>): OperationRecord {
  return { id, area: "pecuaria", module: "vacinacao", payload };
}

describe("upcomingVaccinations", () => {
  const records: OperationRecord[] = [
    vac("v1", {
      animal_lote: "Lote A",
      vacina: "Aftosa",
      proxima_dose: "2026-06-25",
      status: "Previsto",
    }),
    vac("v2", {
      animal_lote: "Lote B",
      vacina: "Clostridial",
      proxima_dose: "2026-06-10",
      status: "Previsto",
    }),
    vac("v3", {
      animal_lote: "Lote C",
      vacina: "Raiva",
      proxima_dose: "sem data",
      status: "Previsto",
    }),
    { id: "x", area: "pecuaria", module: "animal", payload: { proxima_dose: "2026-06-01" } },
  ];

  it("ordena por data, ignora não-vacinação e datas inválidas, e flagra vencidas", () => {
    const result = upcomingVaccinations(records, "2026-06-20");
    expect(result.map((r) => r.id)).toEqual(["v2", "v1"]); // só vacinação com data, ordenado
    expect(result.find((r) => r.id === "v2")?.overdue).toBe(true); // 10/06 < 20/06
    expect(result.find((r) => r.id === "v1")?.overdue).toBe(false); // 25/06 futuro
    expect(result.find((r) => r.id === "v1")?.daysUntil).toBe(5);
  });
});
