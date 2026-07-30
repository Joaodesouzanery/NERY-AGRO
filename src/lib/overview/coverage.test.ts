import { describe, expect, it } from "vitest";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

function spec(partial: Partial<ModuleOverviewSpec> = {}): ModuleOverviewSpec {
  return {
    moduleId: "teste",
    moduleLabel: "Teste",
    tabs: [
      { id: "a", label: "Aba A" },
      { id: "b", label: "Aba B" },
      { id: "c", label: "Aba C" },
    ],
    kpis: [],
    charts: [],
    demoMode: false,
    ...partial,
  };
}

function grafico(tabId: string) {
  return {
    id: `g-${tabId}`,
    tabId,
    title: `Gráfico ${tabId}`,
    kind: "bars" as const,
    data: [],
    xKey: "label",
    series: [{ key: "value", name: "Valor" }],
  };
}

describe("overviewCoverage", () => {
  it("aponta as abas que ficaram de fora da visão geral", () => {
    const c = overviewCoverage(spec({ charts: [grafico("a")] }));
    expect(c.covered).toEqual(["a"]);
    expect(c.missing).toEqual(["b", "c"]);
  });

  it("KPI e tabela também contam como cobertura", () => {
    const c = overviewCoverage(
      spec({
        kpis: [{ label: "Total", value: 10, tabId: "b" }],
        charts: [grafico("a")],
        tables: [{ id: "t", tabId: "c", title: "T", head: [], body: [] }],
      }),
    );
    expect(c.missing).toEqual([]);
  });

  it("pega tabId que não existe entre as abas (erro de digitação)", () => {
    const c = overviewCoverage(spec({ charts: [grafico("a"), grafico("zz")] }));
    expect(c.orphan).toEqual(["zz"]);
  });

  it("KPI sem tabId não cobre aba nenhuma (é KPI de módulo)", () => {
    const c = overviewCoverage(spec({ kpis: [{ label: "Registros", value: 3 }] }));
    expect(c.covered).toEqual([]);
  });
});

describe("coverageReport", () => {
  it("explica o que falta, para o teste do módulo falhar com instrução", () => {
    const msg = coverageReport(spec({ charts: [grafico("a")] }));
    expect(msg).toContain("Teste");
    expect(msg).toContain("b, c");
  });
  it("fica vazio quando está tudo coberto", () => {
    const msg = coverageReport(spec({ charts: [grafico("a"), grafico("b"), grafico("c")] }));
    expect(msg).toBe("");
  });
});
