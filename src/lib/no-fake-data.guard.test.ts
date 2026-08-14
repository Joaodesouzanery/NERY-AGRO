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

// `src/lib` entrou na varredura DEPOIS de uma conferência módulo a módulo achar
// cinco frentes que este guard não via — todas moravam justamente aqui
// (connected-agro-data.ts, remessa-metrics.ts, tower-metrics.ts). O guard estava
// olhando para a UI enquanto o dado inventado nascia uma camada abaixo.
const RAIZES = ["src/components", "src/routes", "src/features", "src/lib"];

// Dados DEMO vivem em src/lib/demo/* e nos literais de demo das rotas; eles são
// legítimos porque a camada de dados só os entrega com o modo DEMO ligado.
const PERMITIDOS = [
  "src/lib/demo/",
  "src/lib/demo-store.ts", // gera id local dos deltas de demo
  "/data/demo.ts", // vitrine por feature (pecuaria/data/demo.ts)
  ".test.ts",
  ".test.tsx",
];

// Aleatoriedade que NÃO vira número na tela. Cada entrada precisa do porquê —
// a lista existe para ser lida, não para crescer sem critério.
const ALEATORIO_OK = [
  "src/components/ui/sidebar.tsx", // largura do skeleton de carregamento
  "src/features/campo-calendar/lib/offline-queue.ts", // id da operação enfileirada
];

// Fallback numérico que NÃO é métrica. Cada entrada precisa do porquê.
const FALLBACK_OK = [
  "src/features/campo-calendar/api/services.ts", // `?? 99` = ordenação (vai pro fim da lista)
];

// Defaults de negócio nomeados: legítimos quando são REFERÊNCIA TÉCNICA (boa
// para qualquer empresa até que se ajuste), ilegítimos quando são premissa de
// mercado (preço, cotação) — essas variam por empresa, região e semana, e um
// valor fixo vira dinheiro na tela que ninguém escolheu.
const DEFAULTS_OK: Record<string, string> = {
  DEFAULT_PEC_CONFIG: "constantes Embrapa (peso da UA, rendimento de carcaça, consumo)",
  REMESSA_TOLERANCIAS_PADRAO: "tolerância inicial da conferência, editável por empresa",
  PROTOCOLO_IATF_PADRAO: "protocolo reprodutivo de referência",
  COR_LOTE_PADRAO: "cor de fallback na timeline (não é dado)",
  SLA_CARGA_PADRAO: "prazo de entrega de referência (24h/aviso 6h), editável por empresa",
};

function arquivosFonte(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      out.push(...arquivosFonte(caminho));
    } else if (/\.tsx?$/.test(nome)) {
      out.push(caminho.replaceAll("\\", "/"));
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

  it("nenhum provider simulado fora de src/lib/demo", () => {
    // `mockWeatherProvider` gerava previsão do tempo por hash da data e rodava
    // também em REAL: alertas de chuva com percentual inventado levavam alguém
    // a adiar pulverização de verdade. Exige a maiúscula para não pegar a
    // string "previsão (mock)" num texto de UI.
    const culpados = arquivos.filter((f) =>
      /\bmock[A-Z]/.test(semComentarios(readFileSync(f, "utf8"))),
    );
    expect(
      culpados,
      "Provider/dado simulado fora de src/lib/demo roda também em modo REAL. " +
        "Mova para a vitrine e ligue por `enabled: demoMode`.",
    ).toEqual([]);
  });

  it("nenhum fallback numérico fabricado substitui medição ausente", () => {
    // `otif ?? 94`, `capacidade ?? 82`, `|| 3`, `?? 2200`, `?? 0.52`, `?? 450`:
    // seis casos reais, todos exibindo número inventado como se fosse medido.
    // 0 e 1 ficam de fora — são neutros de contagem, não afirmação sobre o dado.
    const padrao = /(\?\?|\|\|)\s*(\d+(?:\.\d+)?)\b/g;
    const culpados: string[] = [];
    for (const f of arquivos) {
      if (FALLBACK_OK.includes(f)) continue;
      semComentarios(readFileSync(f, "utf8"))
        .split("\n")
        .forEach((linha, i) => {
          for (const m of linha.matchAll(padrao)) {
            if (Number(m[2]) >= 2) culpados.push(`${f}:${i + 1} (${m[0].trim()})`);
          }
        });
    }
    expect(
      culpados,
      "Fallback numérico vira métrica fabricada quando não há o que medir. " +
        "Use null e mostre “—” com a razão, ou leia o default de um lugar só.",
    ).toEqual([]);
  });

  it("default de negócio nomeado precisa de justificativa", () => {
    // Premissa de MERCADO com valor fixo é o defeito (precoArrobaVenda: 320);
    // referência técnica com default é aceitável. A allowlist obriga a dizer
    // qual é qual — sem ela, `DEFAULT_*` vira esconderijo de cotação chumbada.
    const padrao = /\b(DEFAULT_\w+|\w+_PADRAO)\b\s*(?::|=)/g;
    const semJustificativa = new Set<string>();
    for (const f of arquivos) {
      for (const m of semComentarios(readFileSync(f, "utf8")).matchAll(padrao)) {
        if (!(m[1] in DEFAULTS_OK)) semJustificativa.add(`${f} (${m[1]})`);
      }
    }
    expect(
      [...semJustificativa],
      "Default de negócio novo: se for referência técnica, some em DEFAULTS_OK " +
        "com o porquê; se for premissa de mercado (preço, cotação), use null e " +
        "peça a configuração — cotação fixa vira dinheiro inventado na tela.",
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
