import { describe, expect, it } from "vitest";
import { alertasPorSeveridade, buildMonthlySeries } from "@/lib/tower-metrics";
import type { ConnectedAgroSnapshot } from "@/lib/connected-agro-data";
import { EMPTY_SETTINGS } from "@/lib/app-settings";

function snap(partial: Partial<ConnectedAgroSnapshot>): ConnectedAgroSnapshot {
  return {
    financial: [],
    operations: [],
    field: [],
    pecuariaCabecas: 0,
    costCenters: [],
    contracts: [],
    settings: EMPTY_SETTINGS,
    ...partial,
  };
}

const carga = (id: string, data: string, status: string) => ({
  id,
  area: "logistica",
  module: "cargas",
  payload: { data, status },
});

describe("buildMonthlySeries", () => {
  it("vazio quando não há registro nenhum — nunca inventa histórico", () => {
    expect(buildMonthlySeries(snap({}))).toEqual([]);
  });

  it("vazio com um mês só: um ponto não é tendência", () => {
    expect(
      buildMonthlySeries(
        snap({
          operations: [carga("1", "2026-05-02", "Entregue"), carga("2", "2026-05-09", "Entregue")],
        }),
      ),
    ).toEqual([]);
  });

  it("calcula OTIF por mês a partir do status das cargas", () => {
    const serie = buildMonthlySeries(
      snap({
        operations: [
          carga("1", "2026-04-02", "Entregue"),
          carga("2", "2026-04-09", "Entregue"),
          carga("3", "2026-04-15", "Atrasada"),
          carga("4", "2026-05-02", "Entregue"),
        ],
      }),
    );
    expect(serie).toHaveLength(2);
    expect(serie[0]).toMatchObject({ label: "Abr/26", otif: 67, cargas: 3 });
    expect(serie[1]).toMatchObject({ label: "Mai/26", otif: 100, cargas: 1 });
  });

  it("'Entregue com atraso' não conta como no prazo", () => {
    const serie = buildMonthlySeries(
      snap({
        operations: [
          carga("1", "2026-04-02", "Entregue com atraso"),
          carga("2", "2026-05-02", "Entregue"),
        ],
      }),
    );
    expect(serie[0].otif).toBe(0);
  });

  it("soma só as ENTRADAS do fluxo de caixa como vendas", () => {
    const serie = buildMonthlySeries(
      snap({
        operations: [carga("1", "2026-04-02", "Entregue"), carga("2", "2026-05-02", "Entregue")],
        financial: [
          {
            id: "f1",
            module: "fluxo",
            payload: { data: "2026-04-10", tipo: "Entrada", valor: "1.500,50" },
          },
          {
            id: "f2",
            module: "fluxo",
            payload: { data: "2026-04-12", tipo: "Saída", valor: "900" },
          },
          {
            id: "f3",
            module: "custos",
            payload: { data: "2026-04-12", tipo: "Entrada", valor: "999" },
          },
        ],
      }),
    );
    expect(serie[0].vendas).toBe(1501); // só a entrada do módulo fluxo, arredondada
  });

  it("aceita data no formato BR e cai no created_at quando falta", () => {
    const serie = buildMonthlySeries(
      snap({
        operations: [
          {
            id: "a",
            area: "logistica",
            module: "cargas",
            payload: { status: "Entregue", data: "02/04/2026" },
          },
          {
            id: "b",
            area: "logistica",
            module: "cargas",
            payload: { status: "Entregue" },
            created_at: "2026-05-11T10:00:00Z",
          },
        ],
      }),
    );
    expect(serie.map((p) => p.label)).toEqual(["Abr/26", "Mai/26"]);
  });

  it("mantém no máximo 12 meses, em ordem cronológica", () => {
    const ops = Array.from({ length: 20 }, (_, i) =>
      carga(
        String(i),
        `20${25 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}-05`,
        "Entregue",
      ),
    );
    const serie = buildMonthlySeries(snap({ operations: ops }));
    expect(serie).toHaveLength(12);
    // 20 meses de jan/25 a ago/26 → ficam os 12 últimos, do mais antigo ao mais novo.
    expect(serie[0].label).toBe("Set/25");
    expect(serie[11].label).toBe("Ago/26");
  });
});

describe("alertasPorSeveridade", () => {
  it("agrupa e ordena crítico → atenção → informativo", () => {
    const fatias = alertasPorSeveridade([
      { severity: "warning" },
      { severity: "danger" },
      { severity: "warning" },
      { severity: "info" },
    ]);
    expect(fatias).toEqual([
      { severidade: "Crítico", alertas: 1 },
      { severidade: "Atenção", alertas: 2 },
      { severidade: "Informativo", alertas: 1 },
    ]);
  });
  it("omite severidade sem alerta (não desenha fatia de zero)", () => {
    expect(alertasPorSeveridade([{ severity: "danger" }])).toEqual([
      { severidade: "Crítico", alertas: 1 },
    ]);
  });
  it("sem alertas, sem fatias", () => {
    expect(alertasPorSeveridade([])).toEqual([]);
  });
});
