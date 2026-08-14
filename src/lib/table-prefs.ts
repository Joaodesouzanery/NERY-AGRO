import { useCallback, useEffect, useState } from "react";
import { ownerKey, useQueueOwner } from "@/lib/offline-owner";

// Colunas que ESTA pessoa escolheu ver em cada tabela de módulo.
//
// Por que existe: a tabela mostrava `fields.slice(0, 5)` — 6 colunas de até 33
// campos. Placa, motorista, peso líquido e romaneio existiam no registro e não
// havia como trazê-los para a tela.
//
// Por que por PESSOA e não por empresa: quem confere na balança quer placa e
// hora; quem fecha o mês quer peso e valor. Uma configuração por empresa faria
// os dois se sobrescreverem. Escopo por `ownerKey` (empresa+usuário) é o mesmo
// da fila offline e do rascunho, pelo mesmo motivo: tablet compartilhado não
// pode devolver a configuração de uma empresa para a sessão de outra.
//
// Preferência que falha nunca pode quebrar a tela — daí o try/catch em tudo e
// o fallback silencioso para o padrão.

const PREFIXO = "agrotorre-colunas";

function chave(escopo: string, owner: { orgId: string; userId: string }): string {
  return `${PREFIXO}:${escopo}:${ownerKey(owner)}`;
}

function ler(escopo: string, owner: { orgId: string; userId: string } | null): string[] | null {
  if (!owner || typeof window === "undefined") return null;
  try {
    const cru = window.localStorage.getItem(chave(escopo, owner));
    if (!cru) return null;
    const parsed = JSON.parse(cru);
    return Array.isArray(parsed) && parsed.every((k) => typeof k === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function gravar(
  escopo: string,
  owner: { orgId: string; userId: string } | null,
  colunas: string[],
): void {
  if (!owner || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chave(escopo, owner), JSON.stringify(colunas));
  } catch {
    // Cota estourada / aba privada do iOS. A escolha vale só para esta sessão.
  }
}

function limpar(escopo: string, owner: { orgId: string; userId: string } | null): void {
  if (!owner || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(chave(escopo, owner));
  } catch {
    // ver gravar
  }
}

/**
 * Colunas visíveis de uma tabela, persistidas por pessoa.
 *
 * `escopo` identifica a tabela (ex.: `"logistica:remessa"`). `padrao` são as
 * colunas de quem nunca configurou — mantenha igual ao que a tela já mostrava,
 * para ninguém estranhar na primeira abertura.
 *
 * A leitura acontece num efeito, não no estado inicial: o valor vem do
 * localStorage, que não existe no SSR, e ler no primeiro render causaria
 * divergência de hidratação. É o mesmo cuidado de app-sidebar.tsx.
 */
export function useColunasVisiveis(escopo: string, padrao: string[], disponiveis: string[]) {
  const owner = useQueueOwner();
  const [colunas, setColunas] = useState<string[]>(padrao);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    const salvas = ler(escopo, owner);
    // Descarta chave que não existe mais (campo removido do módulo) — senão uma
    // preferência antiga deixaria a tabela com coluna fantasma.
    const validas = salvas?.filter((k) => disponiveis.includes(k)) ?? null;
    setColunas(validas?.length ? validas : padrao);
    setCarregou(true);
    // `disponiveis`/`padrao` são arrays novos a cada render do chamador; usar o
    // conteúdo (join) evita reler a cada render sem precisar memoizar lá fora.
  }, [escopo, owner, padrao.join("|"), disponiveis.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const alternar = useCallback(
    (key: string) => {
      setColunas((atuais) => {
        // Ordem estável: segue `disponiveis`, não a ordem de clique — senão a
        // tabela embaralha as colunas conforme a pessoa marca e desmarca.
        const proximas = atuais.includes(key)
          ? atuais.filter((k) => k !== key)
          : disponiveis.filter((k) => atuais.includes(k) || k === key);
        // Nunca deixar zero colunas: a tabela viraria uma lista de linhas vazias.
        const final = proximas.length ? proximas : atuais;
        gravar(escopo, owner, final);
        return final;
      });
    },
    [escopo, owner, disponiveis],
  );

  const restaurarPadrao = useCallback(() => {
    limpar(escopo, owner);
    setColunas(padrao);
  }, [escopo, owner, padrao]);

  return { colunas, alternar, restaurarPadrao, carregou };
}

/**
 * Camadas ocultas do mapa operacional, lembradas por pessoa.
 *
 * Mesma mecânica das colunas, e pela mesma razão: era `useState` puro, então a
 * escolha se perdia a cada recarga E ao trocar para a aba "Painel executivo",
 * que desmonta o mapa. Quem desliga metade das camadas para enxergar a operação
 * tinha que refazer isso toda hora.
 */
export function useCamadasOcultas() {
  const owner = useQueueOwner();
  const [escondidas, setEscondidas] = useState<Set<string>>(new Set());

  useEffect(() => {
    const salvas = ler("mapa:camadas", owner);
    setEscondidas(new Set(salvas ?? []));
  }, [owner]);

  const persistir = useCallback(
    (proximas: Set<string>) => {
      setEscondidas(proximas);
      gravar("mapa:camadas", owner, [...proximas]);
    },
    [owner],
  );

  const alternar = useCallback(
    (id: string) => {
      setEscondidas((atuais) => {
        const proximas = new Set(atuais);
        if (proximas.has(id)) proximas.delete(id);
        else proximas.add(id);
        gravar("mapa:camadas", owner, [...proximas]);
        return proximas;
      });
    },
    [owner],
  );

  const mostrarTudo = useCallback(() => persistir(new Set()), [persistir]);

  return { escondidas, alternar, mostrarTudo };
}

/**
 * Aba ativa do módulo, lembrada por pessoa.
 *
 * Onze dos treze módulos guardavam a aba em `useState` puro: recarregar a
 * página, ou voltar de outra tela, jogava a pessoa de volta na Visão Geral.
 * Num módulo de 19 abas isso custa caro — reencontrar onde se estava é o mesmo
 * trabalho de escolher pela primeira vez.
 *
 * Talhão 360 e Calendário resolvem isso pela URL (`?tab=`), que ainda dá link
 * compartilhável e botão voltar. Aqui usamos localStorage porque o Financeiro
 * separa a rota do componente de abas, e levar `search` até lá seria prop
 * drilling por três camadas. O ganho principal — não perder a aba — é o mesmo.
 */
export function useAbaPersistida(escopo: string, padrao: string) {
  const owner = useQueueOwner();
  const [aba, setAbaState] = useState(padrao);

  useEffect(() => {
    const salva = ler(`aba:${escopo}`, owner);
    if (salva?.[0]) setAbaState(salva[0]);
  }, [escopo, owner]);

  const setAba = useCallback(
    (proxima: string) => {
      setAbaState(proxima);
      gravar(`aba:${escopo}`, owner, [proxima]);
    },
    [escopo, owner],
  );

  return [aba, setAba] as const;
}
