// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DemoProvider } from "@/components/demo-provider";
import { DEMO_MODE_STORAGE_KEY, resetDemoMode, writeDemoMode } from "@/lib/demo-context";
import { useDemoMode } from "@/hooks/use-demo-mode";

// Sonda que registra o valor visto no PRIMEIRO render, antes de qualquer efeito.
const rendersVistos: boolean[] = [];
function Sonda() {
  const { demoMode } = useDemoMode();
  rendersVistos.push(demoMode);
  return <span data-testid="modo">{demoMode ? "DEMO" : "REAL"}</span>;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DemoProvider>
        <Sonda />
      </DemoProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  rendersVistos.length = 0;
});

describe("DemoProvider — estado inicial", () => {
  it("o PRIMEIRO render já enxerga o DEMO ligado", () => {
    // Regressão: com useState(false) + useEffect havia uma janela de um render
    // em que o React dizia REAL e o localStorage dizia DEMO. Nessa janela os
    // ~13 `enabled: !demoMode` disparavam consulta real contra o Supabase.
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    montar();
    expect(rendersVistos[0]).toBe(true);
    expect(screen.getByTestId("modo").textContent).toBe("DEMO");
  });

  it("sem a chave, nasce REAL — o default seguro", () => {
    montar();
    expect(rendersVistos[0]).toBe(false);
    expect(screen.getByTestId("modo").textContent).toBe("REAL");
  });

  it("chave com lixo não liga o DEMO", () => {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "sim");
    montar();
    expect(screen.getByTestId("modo").textContent).toBe("REAL");
  });
});

// O estado inicial vem do localStorage, que não existe no SSR. Isso só é seguro
// porque nenhuma tela renderizada no servidor depende do modo: as rotas públicas
// não leem a flag e as protegidas mostram "Carregando..." até a sessão resolver.
// Se alguém puser um DemoBadge na landing ou no login, vira mismatch de
// hidratação — e este teste avisa antes.
describe("premissa do estado inicial: nada demo-dependente no SSR", () => {
  it("rotas públicas não leem o modo DEMO", async () => {
    const { readFileSync } = await import("node:fs");
    const publicas = [
      "src/routes/index.tsx",
      "src/routes/login.tsx",
      "src/routes/redefinir-senha.tsx",
    ];
    const infratores = publicas.filter((f) =>
      /useDemoMode|DemoBadge/.test(readFileSync(f, "utf8")),
    );
    expect(
      infratores,
      "Rota pública lendo o modo DEMO: o estado inicial do DemoProvider vem do " +
        "localStorage (ausente no SSR), então isto causaria mismatch de hidratação.",
    ).toEqual([]);
  });
});

describe("DemoProvider — sincronização", () => {
  it("acompanha o reset feito fora do React (login/logout na mesma aba)", () => {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    montar();
    expect(screen.getByTestId("modo").textContent).toBe("DEMO");

    // É o que signOut()/signInWithPassword() fazem.
    act(() => resetDemoMode());
    expect(screen.getByTestId("modo").textContent).toBe("REAL");
  });

  it("acompanha writeDemoMode (o toggle da barra lateral)", () => {
    montar();
    act(() => writeDemoMode(true));
    expect(screen.getByTestId("modo").textContent).toBe("DEMO");
  });

  it("segue OUTRA aba que saiu do DEMO", () => {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    montar();
    // Outra aba deslogou: o localStorage é compartilhado e o evento `storage`
    // chega aqui com newValue null. Antes as duas abas divergiam para sempre.
    act(() => {
      window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent("storage", { key: DEMO_MODE_STORAGE_KEY, newValue: null }),
      );
    });
    expect(screen.getByTestId("modo").textContent).toBe("REAL");
  });

  it("ignora mudança de outra chave do localStorage", () => {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    montar();
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "agrotorre-theme", newValue: "light" }),
      );
    });
    expect(screen.getByTestId("modo").textContent).toBe("DEMO");
  });
});
