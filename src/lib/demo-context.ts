import { createContext } from "react";

export type DemoContextValue = {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
};

export const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export const DEMO_MODE_STORAGE_KEY = "nery-demo-mode";

/**
 * Leitura síncrona da flag de DEMO fora do React (camadas de dados).
 * Fonte única: o mesmo localStorage que o DemoProvider mantém.
 */
export function isDemoModeActive() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
}
