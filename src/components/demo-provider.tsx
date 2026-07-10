import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DEMO_MODE_STORAGE_KEY, DemoContext } from "@/lib/demo-context";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoModeState] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDemoModeState(window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true");
  }, []);

  const setDemoMode = useCallback(
    (value: boolean) => {
      setDemoModeState(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(value));
      }
      // Camadas de dados leem a flag fora do React (isDemoModeActive); invalidar
      // tudo garante que caches sem demoMode na queryKey também troquem de fonte.
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo(() => ({ demoMode, setDemoMode }), [demoMode, setDemoMode]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
