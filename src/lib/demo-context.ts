import { createContext } from "react";

export type DemoContextValue = {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
};

export const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export const DEMO_MODE_STORAGE_KEY = "nery-demo-mode";

/**
 * Evento de mudança da flag, para quem escreve fora do React avisar o provider.
 * O evento nativo `storage` NÃO dispara na aba que escreveu — só nas outras —,
 * então sem isto o reset feito no login/logout não chegaria à própria aba.
 */
export const DEMO_MODE_CHANGE_EVENT = "nery-demo-mode-change";

function notifyDemoModeChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_MODE_CHANGE_EVENT));
}

/**
 * Leitura síncrona da flag de DEMO fora do React (camadas de dados).
 * Fonte única: o mesmo localStorage que o DemoProvider mantém.
 */
export function isDemoModeActive() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
}

/** Grava a flag e avisa o provider (usado pelo toggle da barra lateral). */
export function writeDemoMode(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(value));
  notifyDemoModeChange();
}

/**
 * Apaga a flag. Chamada na FRONTEIRA DE AUTENTICAÇÃO (entrar e sair).
 *
 * O localStorage é por navegador, não por usuário: sem isto, quem liga o DEMO e
 * sai deixa o próximo login começar em DEMO — inclusive o de um cliente externo
 * em outra empresa. Limpar no login também cobre "fechou o navegador com o DEMO
 * ligado e outra pessoa abriu", que limpar só na saída não pegaria.
 */
export function resetDemoMode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  notifyDemoModeChange();
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
