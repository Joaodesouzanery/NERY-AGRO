import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Teste-guarda: "hoje" é o dia do usuário, não o de Londres.
//
// `new Date().toISOString().slice(0, 10)` devolve a data em UTC. No Brasil
// (UTC−3), tudo registrado a partir das 21h ia para o dia seguinte. Estava em
// 20 lugares: pesagem do curral, movimentação de insumo, saída de ocupação,
// transferência, abertura de lote. Uma sessão de curral que virava a noite
// ficava com metade das pesagens no dia errado — e o GMD, que é Δpeso ÷ Δdias,
// saía errado por causa disso.
//
// A implementação canônica é src/lib/date-local.ts.

const RAIZES = ["src/components", "src/routes", "src/features", "src/lib", "src/hooks"];

const PROIBIDO = /toISOString\(\)\s*\.slice\(\s*0\s*,\s*10\s*\)/;

/**
 * Exceções LEGÍTIMAS — cada uma com o motivo escrito. Se a razão não couber
 * numa linha, provavelmente não é exceção: é bug esperando para acontecer.
 */
const PERMITIDOS: Record<string, string> = {
  "src/lib/date-local.ts": "é a implementação canônica",
  "src/features/pecuaria/data/demo.ts": "vitrine DEMO — não é dado de cliente",
  "src/features/insumos/data/mocks.ts": "vitrine DEMO — não é dado de cliente",
  "src/features/pecuaria/components/ocupacao-timeline.tsx":
    "Date.UTC(ano, mes, 0) é fim-de-mês aritmético; UTC é o correto aqui",
  "src/features/pecuaria/lib/reproducao.ts":
    "aritmética sobre data já ancorada em UTC (previsão de parto)",
  "src/features/pecuaria/lib/derived.ts":
    "pareado com parseDia (T00:00:00Z): os dois lados são strings de calendário e " +
    "são consistentes entre si — migrar só um lado criaria um off-by-one NOVO",
};

function arquivosFonte(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) out.push(...arquivosFonte(caminho));
    else if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome)) out.push(caminho);
  }
  return out;
}

describe("guarda: data gravada é a do usuário", () => {
  it("ninguém deriva 'hoje' de toISOString fora da allowlist", () => {
    const infratores = RAIZES.flatMap(arquivosFonte)
      .filter((f) => !(f in PERMITIDOS))
      .filter((f) => PROIBIDO.test(readFileSync(f, "utf8")));

    expect(
      infratores,
      "toISOString().slice(0,10) devolve a data em UTC: no Brasil, tudo depois " +
        "das 21h é gravado com a data de amanhã. Use localToday()/localDateOf() " +
        "de @/lib/date-local — ou some à allowlist com o motivo, se for aritmética " +
        "em UTC de propósito.",
    ).toEqual([]);
  });

  it("toda entrada da allowlist existe no disco", () => {
    // Allowlist com entrada morta é allowlist que ninguém revisa — e vira o
    // esconderijo onde a próxima exceção entra sem ser notada.
    const fantasmas = Object.keys(PERMITIDOS).filter((f) => !existsSync(f));
    expect(fantasmas, "Entrada da allowlist aponta para arquivo inexistente").toEqual([]);
  });

  it("toda entrada da allowlist ainda contém o padrão que ela justifica", () => {
    const desnecessarias = Object.keys(PERMITIDOS).filter(
      (f) => f !== "src/lib/date-local.ts" && !PROIBIDO.test(readFileSync(f, "utf8")),
    );
    expect(
      desnecessarias,
      "Estes arquivos não usam mais o padrão — tire-os da allowlist para ela " +
        "continuar significando alguma coisa.",
    ).toEqual([]);
  });
});
