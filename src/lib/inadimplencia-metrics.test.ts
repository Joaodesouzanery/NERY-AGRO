import { describe, expect, it } from "vitest";
import { reguaEtapas } from "@/lib/inadimplencia-metrics";
import type { FinancialRecord } from "@/lib/supabase-financial";

const titulo = (payload: Record<string, string>, id = payload.cliente): FinancialRecord =>
  ({ id, module: "inadimplencia", payload }) as unknown as FinancialRecord;

describe("reguaEtapas", () => {
  it("sem título com etapa preenchida, não há régua", () => {
    // A régua era uma lista fixa de 5 etapas renderizada SEMPRE, com marca de
    // "concluída" nas três primeiras — inclusive numa empresa sem um título.
    expect(reguaEtapas([])).toEqual([]);
    expect(reguaEtapas([titulo({ cliente: "A", valor: "1000" })])).toEqual([]);
  });

  it("agrupa por etapa somando valor e contando títulos", () => {
    const etapas = reguaEtapas([
      titulo({
        cliente: "A",
        valor: "1.000,00",
        etapa_regua: "Aviso de atraso",
        canal: "WhatsApp",
      }),
      titulo({ cliente: "B", valor: "500", etapa_regua: "Aviso de atraso", canal: "E-mail" }),
      titulo({ cliente: "C", valor: "3000", etapa_regua: "Cobrança formal", canal: "E-mail" }),
    ]);
    expect(etapas).toHaveLength(2);
    // Ordenado por dinheiro parado: a etapa que concentra mais vem primeiro.
    expect(etapas[0]).toMatchObject({ etapa: "Cobrança formal", titulos: 1, valor: 3000 });
    expect(etapas[1]).toMatchObject({ etapa: "Aviso de atraso", titulos: 2, valor: 1500 });
    // Canais distintos, ordenados — dois clientes na mesma etapa por canais diferentes.
    expect(etapas[1].canais).toEqual(["E-mail", "WhatsApp"]);
  });

  it("alertaDias é o menor prazo configurado na etapa, ou null", () => {
    const [comAlerta, semAlerta] = reguaEtapas([
      titulo({ cliente: "A", valor: "900", etapa_regua: "Lembrete", alerta_dias: "5" }),
      titulo({ cliente: "B", valor: "100", etapa_regua: "Lembrete", alerta_dias: "2" }),
      titulo({ cliente: "C", valor: "50", etapa_regua: "Protesto" }),
    ]);
    expect(comAlerta.alertaDias).toBe(2);
    expect(semAlerta.alertaDias).toBeNull();
  });

  it("etapa só com espaços não vira grupo", () => {
    expect(reguaEtapas([titulo({ cliente: "A", valor: "10", etapa_regua: "   " })])).toEqual([]);
  });
});
