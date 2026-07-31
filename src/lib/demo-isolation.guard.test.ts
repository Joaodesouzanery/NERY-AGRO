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

const ESCRITA = /export\s+async\s+function\s+(create|update|delete|save|upsert)\w*/g;

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
    const desprotegidos: string[] = [];
    for (const f of arquivos) {
      const conteudo = readFileSync(f, "utf8");
      const escritas = conteudo.match(ESCRITA) ?? [];
      if (!escritas.length) continue;
      if (GUARDA.test(conteudo) || HELPERS_GUARDADOS.test(conteudo)) continue;
      desprotegidos.push(`${f} (${escritas.length} escrita(s): ${escritas.join(", ")})`);
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
