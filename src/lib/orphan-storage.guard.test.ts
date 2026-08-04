import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Teste-guarda: fila que ninguém lê.
//
// O Diário de Campo tinha um `queueOfflineDiary()` que, ao falhar a gravação,
// enfileirava o registro em localStorage["nery-campo-diario-pendente"], mostrava
// "Registro salvo na fila offline do Diário" e FECHAVA o diálogo. Nenhuma linha
// do repo jamais leu essa chave. O dado não existia em lugar nenhum — e o
// usuário saía com a confirmação de que existia. É a pior forma de perda: a
// silenciosa com recibo.
//
// A regra que isso vira: **chave de armazenamento cujo nome promete
// pendência/fila precisa ter um leitor.** Uma escrita sozinha é um buraco negro.
//
// Não é análise de fluxo — é contagem de menções ao literal. Basta ter uma
// leitura em algum lugar; o guard não julga se ela é boa. O que ele impede é o
// caso extremo, que foi o que aconteceu de verdade.

const RAIZES = ["src/components", "src/routes", "src/features", "src/lib", "src/hooks"];

/** Nomes que prometem "isto será sincronizado depois". */
const PROMETE_PENDENCIA = /pendente|pending|queue|fila|outbox|draft|rascunho/i;

function arquivosFonte(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) out.push(...arquivosFonte(caminho));
    else if (/\.tsx?$/.test(nome)) out.push(caminho);
  }
  return out;
}

const FONTES = RAIZES.flatMap(arquivosFonte).map((caminho) => ({
  caminho,
  texto: readFileSync(caminho, "utf8"),
}));

// Só código de PRODUÇÃO conta como leitor. Arquivos de teste ficam de fora por
// dois motivos: um leitor que só existe no teste não devolve o dado a ninguém,
// e — descoberto na prática — o comentário deste próprio guard cita a chave do
// buraco negro que ele existe para pegar, o que fazia a contagem chegar a 2 e a
// regressão passar.
const TODO_O_CODIGO = FONTES.filter((f) => !/\.test\.tsx?$/.test(f.caminho))
  .map((f) => f.texto)
  .join("\n");

/**
 * O que de fato passa por uma API de armazenamento — não qualquer literal com
 * hífen. Sem esta âncora o guard acusava `"rdc-rascunhos"`, que é id de tabela
 * do spec de visão geral e nunca chegou perto de um localStorage.
 *
 * Devolve o argumento cru de cada chamada: `"literal"` ou `IDENTIFICADOR`.
 */
const CHAMADA_STORAGE =
  /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*([^,)\s]+)|indexedDB\.open\(\s*([^,)\s]+)/g;

function argumentosDeStorage(texto: string): string[] {
  const out: string[] = [];
  for (const m of texto.matchAll(CHAMADA_STORAGE)) out.push(m[1] ?? m[2]);
  return [...new Set(out)];
}

describe("guarda: fila/rascunho sem leitor é buraco negro", () => {
  it("encontra arquivos para varrer (o teste não pode passar por engano)", () => {
    expect(FONTES.length).toBeGreaterThan(50);
  });

  it("toda chave que promete pendência é lida em algum lugar", () => {
    const semLeitor: string[] = [];

    for (const { caminho, texto } of FONTES) {
      if (/\.test\.tsx?$/.test(caminho)) continue;
      const linhas = texto.split("\n");

      for (const argumento of argumentosDeStorage(texto)) {
        const ehLiteral = /^["'`]/.test(argumento);

        // Resolve identificador → o literal que ele guarda, para saber se a
        // chave promete pendência.
        //
        // TODAS as declarações daquele nome, não a primeira: nomes genéricos
        // colidem. Em campo.tsx há um `const key = preferred.find(...)` (sem
        // literal) antes do `const key = "…-pendente"`, e olhar só a primeira
        // fazia o guard desistir justamente no caso que ele existe para pegar.
        const declaracoes = linhas.filter((l) =>
          new RegExp(`(?:const|let|var)\\s+${argumento}\\s*(?::[^=]+)?=`).test(l),
        );
        const literal = ehLiteral
          ? argumento.slice(1, -1)
          : (declaracoes
              .map((l) => l.match(/["'`]([^"'`]+)["'`]/)?.[1] ?? "")
              .find((v) => PROMETE_PENDENCIA.test(v)) ?? "");

        if (!literal || !PROMETE_PENDENCIA.test(literal)) continue;

        // Constante de MÓDULO (`const QUEUE_KEY = "campo-calendar-…-v1"`) é o
        // padrão certo: o literal aparece uma vez e todo mundo usa o
        // identificador — então é o identificador que precisa ter leitor.
        //
        // Só SCREAMING_CASE vale como termo. Um `const key = "…"` local dentro
        // da função — que era exatamente a forma do buraco negro do Diário —
        // faria o termo virar `key`, palavra comum que aparece no repo inteiro
        // e deixaria qualquer órfão passar.
        const termo = /^[A-Z][A-Z0-9_]+$/.test(argumento) ? argumento : literal;

        // Quantas vezes o termo aparece no código de produção. Uma só = quem
        // escreveu é o único que sabe que existe.
        const mencoes = TODO_O_CODIGO.split(termo).length - 1;
        if (mencoes < 2) semLeitor.push(`${caminho} → "${literal}" (busquei por \`${termo}\`)`);
      }
    }

    expect(
      semLeitor,
      "Chave de fila/rascunho mencionada uma única vez no repo: ninguém lê o que " +
        "foi gravado ali. Se a intenção é enfileirar, escreva o leitor; se não é, " +
        "não diga ao usuário que salvou.",
    ).toEqual([]);
  });

  it("o Diário não voltou a fingir que enfileira", () => {
    // Regressão pontual, com nome próprio: este ramo dizia "Registro salvo na
    // fila offline do Diário" e fechava o diálogo, destruindo o que o usuário
    // tinha digitado, para qualquer erro — inclusive falta de permissão.
    const campo = readFileSync("src/routes/campo.tsx", "utf8");
    expect(campo).not.toMatch(/queueOfflineDiary|fila offline do Diário/);
  });
});
