import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Teste-guarda da separação DEMO × REAL na ESCRITA.
//
// A regra do produto é que os dois modos nunca se contaminam: em DEMO nada é
// gravado no Supabase, em REAL nada de exemplo aparece. O lado "REAL não mostra
// dado falso" já tem guarda própria (no-fake-data.guard.test.ts). Este cobre o
// outro lado: nenhuma função de escrita pode chegar ao banco sem passar por
// `assertNotDemo()` — direto ou através de um helper que já o faz.
//
// Sem isto, basta alguém escrever um `createXyz` novo chamando `supabase.from()`
// para o modo DEMO começar a sujar o banco real do cliente, silenciosamente.

const CAMADA_DADOS = [
  "src/lib",
  "src/features/insumos/api",
  "src/features/campo-calendar/api",
  "src/features/rdc/api",
  "src/features/remessa/api",
  "src/features/talhao-360/api",
  "src/features/pecuaria/api",
];

// Helpers que JÁ chamam assertNotDemo(). Delegar para eles é a forma correta —
// o guard vive num lugar só.
const HELPERS_GUARDADOS =
  /create(Field|Operation|Financial)Record|update(Field|Operation|Financial)Record|delete(Field|Operation|Financial)Record|createCostCenter|updateCostCenter|deleteCostCenter|createContract|updateContract|deleteContract|patchSettings/;

const GUARDA = /assertNotDemo|isDemoModeActive/;

const ESCRITA_DECL = /^export\s+async\s+function\s+((?:create|update|delete|save|upsert)\w*)/;

// Escritas que não tocam dado de empresa (auth é do Supabase Auth, não do org).
const FORA_DE_ESCOPO = ["src/lib/auth.ts"];

function arquivosDe(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((n) => join(dir, n))
    .filter((p) => statSync(p).isFile() && /\.ts$/.test(p) && !/\.test\.ts$/.test(p));
}

const arquivos = CAMADA_DADOS.flatMap(arquivosDe).filter((f) => !FORA_DE_ESCOPO.includes(f));

describe("guarda: DEMO nunca escreve no banco real", () => {
  it("encontra a camada de dados (o teste não pode passar por engano)", () => {
    expect(arquivos.length).toBeGreaterThan(5);
  });

  it("toda função de escrita passa por assertNotDemo, direto ou via helper", () => {
    // A checagem é POR FUNÇÃO, não por arquivo. Antes bastava uma função do
    // arquivo ter o guard para todas as outras passarem — um `createXyz` novo
    // sem guarda entrava sem ninguém notar, num arquivo já "aprovado".
    //
    // Precisa seguir a indireção: `createInsumo` delega para o `createRecord`
    // local, que é quem tem o guard. Sete funções legítimas seriam acusadas sem
    // isso, e guard que grita demais é guard que alguém desliga.
    const desprotegidos: string[] = [];
    for (const f of arquivos) {
      const linhas = readFileSync(f, "utf8").split("\n");

      // nome → corpo de toda função de topo do arquivo
      const corpos = new Map<string, string>();
      linhas.forEach((linha, i) => {
        const decl = linha.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
        if (!decl) return;
        let j = i + 1;
        const corpo: string[] = [];
        while (j < linhas.length && linhas[j] !== "}") corpo.push(linhas[j++]);
        corpos.set(decl[1], corpo.join("\n"));
      });

      const temGuarda = (nome: string, vistos = new Set<string>()): boolean => {
        if (vistos.has(nome)) return false; // ciclo
        vistos.add(nome);
        const corpo = corpos.get(nome) ?? "";
        if (GUARDA.test(corpo) || HELPERS_GUARDADOS.test(corpo)) return true;
        for (const outro of corpos.keys()) {
          if (outro === nome) continue;
          if (new RegExp(`\\b${outro}\\s*\\(`).test(corpo) && temGuarda(outro, vistos)) return true;
        }
        return false;
      };

      linhas.forEach((linha, i) => {
        const escrita = linha.match(ESCRITA_DECL);
        if (escrita && !temGuarda(escrita[1])) desprotegidos.push(`${f}:${i + 1} ${escrita[1]}`);
      });
    }
    expect(
      desprotegidos,
      "Escrita sem guarda de DEMO: em modo DEMO isto grava no banco real do cliente. " +
        "Chame assertNotDemo() no início da função, ou delegue para os helpers de " +
        "supabase-field/operations/financial, que já o fazem.",
    ).toEqual([]);
  });

  it("os helpers de registro continuam sendo o ponto único da guarda", () => {
    // Se alguém remover o assertNotDemo daqui, TODOS os módulos que delegam
    // ficam desprotegidos de uma vez — por isso a checagem é explícita.
    for (const base of ["field", "operations", "financial", "cost-centers", "contracts"]) {
      const f = `src/lib/supabase-${base}.ts`;
      expect(readFileSync(f, "utf8"), `${f} perdeu o assertNotDemo`).toContain("assertNotDemo()");
    }
  });
});
