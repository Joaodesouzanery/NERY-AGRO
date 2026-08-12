import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECOES_POR_ABA, secaoDoCampo } from "@/lib/logistica-form-sections";

// As seções citam campos por chave, e a config da aba mora noutro arquivo.
// Errar uma chave aqui não quebra nada: a seção simplesmente renderiza um campo
// a menos, calada. Este teste lê a config real e cobra a correspondência.

const FONTE = readFileSync("src/routes/logistica.tsx", "utf8");

/** Chaves declaradas na config de uma aba da Logística. */
function chavesDaAba(id: string): string[] {
  const inicio = FONTE.indexOf(`id: "${id}",`);
  if (inicio < 0) return [];
  const trecho = FONTE.slice(inicio, FONTE.indexOf("\n  },", inicio));
  return [...trecho.matchAll(/\{\s*key: "([^"]+)"/g)].map((m) => m[1]);
}

describe("seções do formulário da Logística", () => {
  it("toda chave citada existe na config da aba", () => {
    for (const [aba, secoes] of Object.entries(SECOES_POR_ABA)) {
      const declarados = chavesDaAba(aba);
      expect(declarados.length, `aba "${aba}" não foi encontrada na config`).toBeGreaterThan(0);
      const inventados = secoes.flatMap((s) => s.campos).filter((c) => !declarados.includes(c));
      expect(inventados, `aba "${aba}": campo citado na seção que não existe na aba`).toEqual([]);
    }
  });

  it("nenhum campo aparece em duas seções", () => {
    for (const [aba, secoes] of Object.entries(SECOES_POR_ABA)) {
      const todos = secoes.flatMap((s) => s.campos);
      const repetidos = todos.filter((c, i) => todos.indexOf(c) !== i);
      expect(repetidos, `aba "${aba}": campo em duas seções`).toEqual([]);
    }
  });

  it("as seções cobrem a aba inteira — o resto cairia em 'Outros'", () => {
    // "Outros" existe como rede de segurança em runtime, não como destino
    // planejado: campo que cai lá está fora do agrupamento que a pessoa espera.
    for (const aba of Object.keys(SECOES_POR_ABA)) {
      const cobertos = new Set(SECOES_POR_ABA[aba].flatMap((s) => s.campos));
      const soltos = chavesDaAba(aba).filter((c) => !cobertos.has(c));
      expect(soltos, `aba "${aba}": campo sem seção`).toEqual([]);
    }
  });

  it("o campo obrigatório fica na primeira seção", () => {
    // Se o Salvar reprovar, a seção culpada abre — mas exigir algo que está na
    // quinta gaveta é pedir para a pessoa procurar.
    expect(secaoDoCampo("frota", "placa")).toBe(SECOES_POR_ABA.frota[0].id);
    expect(secaoDoCampo("bases", "nome")).toBe(SECOES_POR_ABA.bases[0].id);
  });

  it("secaoDoCampo não inventa resposta", () => {
    expect(secaoDoCampo("frota", "campo_que_nao_existe")).toBeUndefined();
    expect(secaoDoCampo("cargas", "placa")).toBeUndefined();
  });
});
