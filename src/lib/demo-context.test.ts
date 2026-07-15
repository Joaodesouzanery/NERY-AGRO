// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { assertNotDemo, DEMO_MODE_STORAGE_KEY, isDemoModeActive } from "@/lib/demo-context";
import { createOperationRecord } from "@/lib/supabase-operations";
import { createFieldRecord } from "@/lib/supabase-field";
import { createFinancialRecord } from "@/lib/supabase-financial";
import { createCostCenter } from "@/lib/supabase-cost-centers";

function setDemo(on: boolean) {
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(on));
}

afterEach(() => window.localStorage.clear());

describe("assertNotDemo (trava de escrita no modo DEMO)", () => {
  it("lança quando DEMO está ligado", () => {
    setDemo(true);
    expect(isDemoModeActive()).toBe(true);
    expect(() => assertNotDemo()).toThrow(/DEMO/);
  });
  it("não lança quando DEMO está desligado", () => {
    setDemo(false);
    expect(() => assertNotDemo()).not.toThrow();
  });
});

describe("data layer bloqueia escrita em DEMO (antes de tocar no Supabase)", () => {
  it("createOperationRecord/Field/Financial/CostCenter rejeitam em DEMO", async () => {
    setDemo(true);
    await expect(
      createOperationRecord({ area: "logistica", module: "cargas", payload: {} }),
    ).rejects.toThrow(/DEMO/);
    await expect(createFieldRecord({ module: "rdc", payload: {} })).rejects.toThrow(/DEMO/);
    await expect(createFinancialRecord({ module: "fluxo", payload: {} })).rejects.toThrow(/DEMO/);
    await expect(
      createCostCenter({
        nome: "X",
        tipo: "insumos",
        safra: null,
        talhao_id: null,
        valor_autorizado: 0,
        valor_alocado: 0,
        valor_realizado: 0,
        vigencia_inicio: null,
        vigencia_fim: null,
        status: "ativo",
      }),
    ).rejects.toThrow(/DEMO/);
  });
});
