import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DEMO_MODE_CHANGE_EVENT,
  DEMO_MODE_STORAGE_KEY,
  DemoContext,
  isDemoModeActive,
  writeDemoMode,
} from "@/lib/demo-context";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Inicializador preguiçoso: o estado nasce JÁ com o valor do localStorage.
  // Antes começava `false` e só corrigia num useEffect — e nessa janela de um
  // render os ~13 pontos de `enabled: !demoMode` disparavam consulta REAL mesmo
  // com o DEMO ligado, e os selos piscavam "REAL".
  //
  // Não precisa de script anti-FOUC como o tema: no SSR isto devolve `false`
  // (não há window), nenhuma rota pública lê `demoMode`, e as protegidas
  // renderizam "Carregando..." — o HTML do servidor e o da hidratação batem.
  const [demoMode, setDemoModeState] = useState(isDemoModeActive);
  const queryClient = useQueryClient();

  // Camadas de dados leem a flag fora do React (isDemoModeActive); invalidar
  // tudo garante que caches sem demoMode na queryKey também troquem de fonte.
  const sincronizar = useCallback(
    (valor: boolean) => {
      setDemoModeState(valor);
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Mesma aba: quem escreve fora do React (reset no login/logout) avisa por
    // evento custom — o `storage` nativo não dispara em quem escreveu.
    const aoMudar = () => sincronizar(isDemoModeActive());
    // Outras abas: `storage` cobre setItem e removeItem (newValue null), e
    // `key === null` cobre um localStorage.clear().
    const aoMudarOutraAba = (e: StorageEvent) => {
      if (e.key === DEMO_MODE_STORAGE_KEY || e.key === null) sincronizar(isDemoModeActive());
    };

    window.addEventListener(DEMO_MODE_CHANGE_EVENT, aoMudar);
    window.addEventListener("storage", aoMudarOutraAba);
    return () => {
      window.removeEventListener(DEMO_MODE_CHANGE_EVENT, aoMudar);
      window.removeEventListener("storage", aoMudarOutraAba);
    };
  }, [sincronizar]);

  const setDemoMode = useCallback((value: boolean) => {
    // writeDemoMode dispara o evento, que cai em `aoMudar` e sincroniza o
    // estado + invalida o cache. Um caminho só para toda mudança de flag.
    writeDemoMode(value);
  }, []);

  const value = useMemo(() => ({ demoMode, setDemoMode }), [demoMode, setDemoMode]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
