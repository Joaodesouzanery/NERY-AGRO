// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertNotDemo,
  DEMO_MODE_CHANGE_EVENT,
  DEMO_MODE_STORAGE_KEY,
  isDemoModeActive,
  resetDemoMode,
  writeDemoMode,
} from "@/lib/demo-context";
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

// A flag vive no localStorage, que é por NAVEGADOR e não por usuário. Sem
// apagá-la na fronteira de autenticação, quem liga o DEMO e sai deixa o próximo
// login começar em DEMO — inclusive o de um cliente externo.
describe("resetDemoMode / writeDemoMode", () => {
  it("resetDemoMode REMOVE a chave (não grava 'false')", () => {
    setDemo(true);
    resetDemoMode();
    expect(window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)).toBeNull();
    expect(isDemoModeActive()).toBe(false);
  });

  it("é idempotente: resetar sem chave nenhuma não quebra", () => {
    expect(() => resetDemoMode()).not.toThrow();
    expect(isDemoModeActive()).toBe(false);
  });

  it("writeDemoMode grava e reflete em isDemoModeActive", () => {
    writeDemoMode(true);
    expect(isDemoModeActive()).toBe(true);
    writeDemoMode(false);
    expect(isDemoModeActive()).toBe(false);
  });

  it("os dois avisam a própria aba por evento (o 'storage' nativo não faria)", () => {
    const ouvinte = vi.fn();
    window.addEventListener(DEMO_MODE_CHANGE_EVENT, ouvinte);
    writeDemoMode(true);
    resetDemoMode();
    window.removeEventListener(DEMO_MODE_CHANGE_EVENT, ouvinte);
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });
});

describe("signIn/signOut apagam a flag", () => {
  it("signOut limpa o DEMO antes de encerrar a sessão", async () => {
    vi.resetModules();
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: { auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } },
      isSupabaseConfigured: true,
    }));
    setDemo(true);
    const { signOut } = await import("@/lib/auth");
    await signOut();
    expect(isDemoModeActive()).toBe(false);
    vi.doUnmock("@/integrations/supabase/client");
    vi.resetModules();
  });

  it("signInWithPassword limpa o DEMO MESMO SE o login falhar", async () => {
    vi.resetModules();
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        auth: {
          signInWithPassword: vi
            .fn()
            .mockResolvedValue({ data: null, error: new Error("credenciais inválidas") }),
        },
      },
      isSupabaseConfigured: true,
    }));
    setDemo(true);
    const { signInWithPassword } = await import("@/lib/auth");
    // Mesmo com senha errada a flag some: quem abre a tela de login de um
    // navegador alheio não deve herdar o DEMO de quem usou antes.
    await expect(signInWithPassword("a@b.com", "errada")).rejects.toThrow();
    expect(isDemoModeActive()).toBe(false);
    vi.doUnmock("@/integrations/supabase/client");
    vi.resetModules();
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
