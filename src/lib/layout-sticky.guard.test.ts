import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Teste-guarda do `position: sticky` da barra lateral.
//
// Esta regressão já aconteceu neste repo e passou meses despercebida: o commit
// que pôs `sticky top-0 h-screen` no <aside> e o que pôs `overflow-x: hidden`
// em html/body são incompatíveis, e nada avisava.
//
// A regra da CSS Overflow spec: quando um eixo é `visible` e o outro NÃO é nem
// `visible` nem `clip`, o `visible` computa para `auto`. Logo,
// `overflow-x: hidden` no body faz o `overflow-y` virar `auto`, o body vira
// scroll container com scrollTop sempre 0, e nenhum sticky descendente engata.
// A sidebar tem `h-screen`, então ela acabava depois de 100vh e sobrava fundo.
//
// `overflow-x: clip` NÃO tem esse efeito (clip e visible convivem sem coerção),
// por isso o <main> pode continuar clipando na horizontal.
//
// Não dá para testar isto com jsdom: ele não tem engine de layout — nem resolve
// propagação de overflow nem calcula sticky. Guarda de fonte é o que cabe.

function ler(caminho: string) {
  return readFileSync(caminho, "utf8");
}

describe("guarda: o sticky da barra lateral não pode quebrar de novo", () => {
  it("html/body não declaram overflow (viraria scroll container)", () => {
    const css = ler("src/styles.css");
    const bloco = css.match(/html,\s*\n?body\s*\{([^}]*)\}/);
    expect(bloco, "bloco `html, body` não encontrado em src/styles.css").toBeTruthy();
    expect(
      bloco![1],
      "overflow em html/body faz o body virar scroll container e mata TODO " +
        "position:sticky do produto. Clipe no <main> com overflow-x-clip.",
    ).not.toMatch(/overflow/);
  });

  it("o <main> clipa com `clip`, nunca com `hidden`", () => {
    const root = ler("src/routes/__root.tsx");
    expect(
      root,
      "`overflow-x-hidden` no <main> coage o eixo Y para `auto` e quebra os " +
        "sticky de dentro (OrgSwitcherBar, abas do Talhão 360). Use overflow-x-clip.",
    ).not.toMatch(/overflow-x-hidden/);
    expect(root).toMatch(/overflow-x-clip/);
  });

  it("a barra lateral continua sticky e com altura de viewport", () => {
    const sidebar = ler("src/components/app-sidebar.tsx");
    expect(sidebar).toMatch(/sticky top-0/);
    expect(sidebar).toMatch(/h-screen/);
  });
});
