import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Teste-guarda: nenhum dado inventado pode chegar à UI em modo REAL.
//
// Não é hipótese. O produto tinha (a) um array literal com OTIF/vendas/
// capacidade alimentando o gráfico "KPIs operacionais" da Torre com Supabase
// configurado, (b) um gerador aleatório desenhando o gráfico "Atividade" e o
// selo "Acima da baseline" no painel do mapa, e (c) uma lista fixa de ações no
// JSX. Tudo isso foi removido — este teste existe para não voltar.
//
// Segue o molde de supabase-rls-guard.test.ts, que já varre arquivos-fonte.

const RAIZES = ["src/components", "src/routes", "src/features"];

// Dados DEMO vivem em src/lib/demo/* e nos literais de demo das rotas; eles são
// legítimos porque a camada de dados só os entrega com o modo DEMO ligado.
const PERMITIDOS = [
  "src/lib/demo/",
  "src/lib/demo-store.ts", // gera id local dos deltas de demo
  ".test.ts",
  ".test.tsx",
];

// Aleatoriedade que NÃO vira número na tela. Cada entrada precisa do porquê —
// a lista existe para ser lida, não para crescer sem critério.
const ALEATORIO_OK = [
  "src/components/ui/sidebar.tsx", // largura do skeleton de carregamento
  "src/features/campo-calendar/lib/offline-queue.ts", // id da operação enfileirada
];

function arquivosFonte(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      out.push(...arquivosFonte(caminho));
    } else if (/\.tsx?$/.test(nome)) {
      out.push(caminho);
    }
  }
  return out;
}

function semComentarios(conteudo: string): string {
  return conteudo
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("//"))
    .join("\n");
}

const arquivos = RAIZES.flatMap(arquivosFonte).filter(
  (f) => !PERMITIDOS.some((p) => f.includes(p)),
);

describe("guarda: sem dado inventado na UI", () => {
  it("encontra arquivos para varrer (o teste não pode passar por engano)", () => {
    expect(arquivos.length).toBeGreaterThan(50);
  });

  it("nenhum componente gera número aleatório para exibir como métrica", () => {
    const culpados = arquivos
      .filter((f) => !ALEATORIO_OK.includes(f))
      .filter((f) => semComentarios(readFileSync(f, "utf8")).includes("Math.random("));
    expect(
      culpados,
      "Math.random() em componente vira gráfico/KPI fabricado em modo REAL. " +
        "Use dado do snapshot ou não renderize.",
    ).toEqual([]);
  });

  it("nenhuma série temporal hardcoded alimenta gráfico", () => {
    // Pega `const fooSeries = [` e `const fallbackFoo = [` — o padrão exato das
    // duas violações que existiam.
    const padrao = /const\s+(\w*[Ss]eries|fallback\w*)\s*(:[^=]+)?=\s*\[/;
    const culpados = arquivos.filter((f) => padrao.test(semComentarios(readFileSync(f, "utf8"))));
    expect(
      culpados,
      "Série literal em componente aparece igual em DEMO e em REAL. " +
        "Derive do snapshot e use empty state quando não houver histórico.",
    ).toEqual([]);
  });
});
