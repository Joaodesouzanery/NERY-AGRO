import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

// Teste-guarda da fronteira DEMO/REAL no cache do React Query.
//
// A regra, em uma frase: **LEITURA recebe o modo por parâmetro; só ESCRITA lê o
// localStorage.**
//
// O motivo é concreto. A queryKey é montada com o `demoMode` do React (state do
// DemoProvider), mas as camadas de dados resolviam a fonte com
// `isDemoModeActive()`, que lê o localStorage direto. Os dois discordam durante
// um render — e o resultado é dado da vitrine gravado sob a chave do modo REAL.
// Aí `invalidateQueries()` não salva: ele marca stale mas ENTREGA o valor antigo
// enquanto refaz a consulta; para query inativa o dado fica até o gcTime. Era a
// explicação de "número de DEMO aparecendo em REAL" na Pecuária e nos Insumos.

const RAIZES = ["src/features", "src/lib", "src/hooks", "src/components"];

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

// Quem PODE ler o localStorage: o provider (é o dono da flag) e o próprio
// módulo da flag. Qualquer outro nome aqui precisa de justificativa escrita.
const PODEM_LER = new Set(["src/components/demo-provider.tsx", "src/lib/demo-context.ts"]);

describe("guarda: DEMO e REAL não dividem entrada de cache", () => {
  it("função de leitura não resolve a fonte pelo localStorage", () => {
    // Varre bloco a bloco: `isDemoModeActive()` dentro de um `list*`/`get*` é a
    // assinatura exata do bug. Dentro de `create/update/delete` é legítimo — a
    // escrita não tem cache para envenenar, e assertNotDemo() é o backstop.
    const infratores: string[] = [];
    for (const { caminho, texto } of FONTES) {
      if (PODEM_LER.has(caminho)) continue;
      if (!texto.includes("isDemoModeActive(")) continue;
      const linhas = texto.split("\n");
      let atual = "";
      linhas.forEach((linha, i) => {
        const declara = linha.match(/^(?:export )?(?:async )?function (\w+)/);
        if (declara) atual = declara[1];
        if (linha.includes("isDemoModeActive(") && /^(list|get|load|fetch|build)/.test(atual)) {
          infratores.push(`${caminho}:${i + 1} (${atual})`);
        }
      });
    }
    expect(
      infratores,
      "Leitura resolvendo DEMO pelo localStorage: a queryKey vem do demoMode do " +
        "React e a fonte viria daqui — os dois divergem e o dado da vitrine é " +
        "gravado sob a chave do modo REAL. Receba `demoMode` por parâmetro.",
    ).toEqual([]);
  });

  it("toda queryKey que serve dado demo carrega o modo", () => {
    // Chave sem o modo = uma entrada só para os dois. Os módulos com vitrine
    // própria são os que já morderam: Pecuária e Insumos.
    const chaves = [
      "src/features/pecuaria/api/query-keys.ts",
      "src/features/insumos/api/query-keys.ts",
    ];
    for (const caminho of chaves) {
      const texto = readFileSync(caminho, "utf8");
      const folhas = texto.match(/^\s+\w+: \([^)]*\) =>.*$/gm) ?? [];
      expect(folhas.length, `${caminho}: nenhuma folha encontrada`).toBeGreaterThan(0);
      const semModo = folhas.filter((linha) => !/\bdemo\w*\b/i.test(linha));
      expect(semModo, `${caminho}: folha de cache sem o modo DEMO na chave`).toEqual([]);
    }
  });
});

describe("comportamento: alternar o modo não serve o dado do outro", () => {
  it("dado demo e dado real ocupam entradas distintas", async () => {
    // Prova com um QueryClient real o que as regras acima só verificam por
    // leitura de fonte. `pecKeys` é a chave verdadeira do produto.
    const { pecKeys } = await import("@/features/pecuaria/api/query-keys");
    const client = new QueryClient();

    client.setQueryData(pecKeys.animais(true), [{ id: "demo-1" }]);
    client.setQueryData(pecKeys.animais(false), [{ id: "real-1" }]);

    expect(client.getQueryData(pecKeys.animais(true))).toEqual([{ id: "demo-1" }]);
    expect(client.getQueryData(pecKeys.animais(false))).toEqual([{ id: "real-1" }]);

    // E `pecKeys.all` continua alcançando as duas — é o que as mutações usam
    // para invalidar sem precisar saber em que modo o dado foi gravado.
    const alcancadas = client
      .getQueryCache()
      .findAll({ queryKey: pecKeys.all })
      .map((q) => q.queryKey);
    expect(alcancadas).toHaveLength(2);
  });
});
