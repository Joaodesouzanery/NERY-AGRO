import { useEffect, useMemo, useState } from "react";
import { DemoContext } from "@/lib/demo-context";

const STORAGE_KEY = "nery-demo-mode";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoModeState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setDemoModeState(saved == null ? import.meta.env.DEV : saved === "true");
  }, []);

  const setDemoMode = (value: boolean) => {
    setDemoModeState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    }
  };

  const value = useMemo(() => ({ demoMode, setDemoMode }), [demoMode]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
