import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Teste-guarda: escrever em modo DEMO tem UM comportamento.
//
// O produto tinha três:
//  (a) a maioria checa `demoMode` antes e avisa em azul;
//  (b) Insumos e Calendário gravam num store local (fica no navegador);
//  (c) a Pecuária NÃO checava — a mutação disparava, `assertNotDemo()` lançava
//      no data layer, e a mensagem chegava VERMELHA. A pessoa concluía que o
//      produto tinha quebrado quando estava só usando a vitrine. Nove arquivos,
//      nenhum com `useDemoMode` importado.
//
// A regra: tela que escreve ou trata o DEMO explicitamente, ou usa
// `useMutacaoReal`, que trata por ela. `assertNotDemo()` continua sendo o
// backstop no data layer — é ele que garante que nada chegue ao banco.

const RAIZES = ["src/features", "src/routes", "src/components"];

function arquivos(dir: string): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

const FONTES = RAIZES.flatMap(arquivos).map((caminho) => ({
  caminho,
  texto: readFileSync(caminho, "utf8"),
}));

/**
 * Telas que escrevem e tratam o DEMO de outra forma legítima — cada uma com o
 * porquê. `demo-store` grava no navegador, que é o comportamento (b).
 */
const TRATAM_DE_OUTRA_FORMA: Record<string, string> = {
  "src/features/insumos/api/services.ts": "grava no store local em DEMO (demo-store)",
  // Estas duas escrevem pelo serviço de Insumos, que grava no navegador em
  // DEMO. Passar o wrapper aqui BLOQUEARIA o que hoje funciona.
  "src/features/insumos/components/insumos-page.tsx": "escreve via insumos/api (demo-store)",
  "src/features/talhao-360/components/tabs/insumos-tab.tsx": "escreve via insumos/api (demo-store)",
  "src/features/campo-calendar/api/services.ts": "grava no store local em DEMO",
  "src/features/campo-calendar/hooks/use-campo-calendar.ts": "checa demoMode na fila offline",
  "src/features/remessa/api/services.ts": "assertNotDemo no serviço, antes do upload",
  "src/features/rdc/api/services.ts": "assertNotDemo no serviço, antes do upload",
  "src/lib/anexos.ts": "assertNotDemo no serviço, antes do upload",
};

describe("guarda: escrever em DEMO tem um comportamento só", () => {
  it("toda tela com mutação trata o modo DEMO", () => {
    const semTratamento: string[] = [];

    for (const { caminho, texto } of FONTES) {
      if (caminho in TRATAM_DE_OUTRA_FORMA) continue;
      // `useMutation(` cru = escreve sem passar pelo wrapper.
      if (!/\buseMutation\(/.test(texto)) continue;
      // Trata explicitamente? (checa a flag antes, ou usa o wrapper)
      const trata = /useDemoMode|isDemoModeActive|useMutacaoReal|assertNotDemo/.test(texto);
      if (!trata) semTratamento.push(caminho);
    }

    expect(
      semTratamento,
      "Tela que escreve sem tratar o modo DEMO: a mutação dispara, o data layer " +
        "lança em `assertNotDemo()` e o usuário vê um erro VERMELHO, como se o " +
        "produto tivesse quebrado. Use `useMutacaoReal` (hooks/use-mutacao-real) " +
        "ou cheque `demoMode` antes.",
    ).toEqual([]);
  });

  it("a Pecuária usa o wrapper — era ela que não tratava", () => {
    const pecuaria = FONTES.filter(
      (f) => f.caminho.includes("features/pecuaria") && /useMutacaoReal\(/.test(f.texto),
    );
    expect(pecuaria.length, "nenhum arquivo da Pecuária usa useMutacaoReal").toBeGreaterThan(5);
  });

  it("as mensagens de DEMO vêm da fonte única", () => {
    // Havia seis redações do mesmo conceito, com dois verbos diferentes
    // ("Desligue" e "Desative"). Quem lê duas na mesma sessão fica em dúvida se
    // são a mesma coisa.
    const mensagens = readFileSync("src/lib/demo-mensagens.ts", "utf8");
    expect(mensagens).toMatch(/DEMO_INSTRUCAO/);
    expect(mensagens).toMatch(/demoBloqueado/);
  });

  it("assertNotDemo continua no data layer (o backstop não saiu)", () => {
    // O wrapper melhora a MENSAGEM; quem impede o dado de chegar ao banco é
    // ele. Se este teste falhar, a proteção virou só de interface.
    const contexto = readFileSync("src/lib/demo-context.ts", "utf8");
    expect(contexto).toMatch(/export function assertNotDemo/);
    const usos = FONTES.filter((f) => /assertNotDemo\(\)/.test(f.texto)).length;
    const libs = readdirSync("src/lib").filter(
      (f) => /^supabase-/.test(f) && /\.ts$/.test(f) && !/\.test\./.test(f),
    );
    const nasLibs = libs.filter((f) =>
      /assertNotDemo\(\)/.test(readFileSync(join("src/lib", f), "utf8")),
    ).length;
    expect(usos + nasLibs).toBeGreaterThan(3);
  });
});
