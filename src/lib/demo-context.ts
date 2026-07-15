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

/**
 * Trava de segurança para as camadas de dados: no modo DEMO nenhuma escrita pode
 * chegar ao Supabase. Chamada no início de todo create/update/delete — é o backstop
 * estrutural para que dados demo NUNCA vazem para o banco real da empresa, mesmo se
 * algum componente esquecer de checar `demoMode`. Leituras não são afetadas.
 */
export function assertNotDemo() {
  if (isDemoModeActive()) {
    throw new Error("Modo DEMO ativo: desative-o na barra lateral para gravar dados reais.");
  }
}
