import { describe, it, expect } from "vitest";
import { acharBrincoExato, filtrarAnimais, type AnimalBuscavel } from "./busca";

const a = (id: string, brinco: string | null, sisbov: string | null = null): AnimalBuscavel => ({
  id,
  brinco_visual: brinco,
  sisbov,
});

const rebanho = [
  a("1", "2010"),
  a("2", "2011"),
  a("3", "1204"),
  a("4", "0020"),
  a("5", null, "BR20999"),
  a("6", "BR-0421", "BR123456"),
];

describe("filtrarAnimais", () => {
  it("prioriza quem COMEÇA com o termo antes de quem apenas contém", () => {
    const r = filtrarAnimais(rebanho, "20");
    expect(r[0].brinco_visual).toBe("2010");
    expect(r[1].brinco_visual).toBe("2011");
    // 1204 e 0020 apenas contêm "20" — vêm depois
    const brincos = r.map((x) => x.brinco_visual);
    expect(brincos.indexOf("2010")).toBeLessThan(brincos.indexOf("1204"));
    expect(brincos.indexOf("2010")).toBeLessThan(brincos.indexOf("0020"));
  });

  it("brinco exato vem em primeiro lugar", () => {
    expect(filtrarAnimais(rebanho, "1204")[0].brinco_visual).toBe("1204");
  });

  it("acha por SISBOV quando o brinco não casa", () => {
    const r = filtrarAnimais(rebanho, "BR20999");
    expect(r[0].id).toBe("5");
  });

  it("é insensível a maiúsculas e a espaços em volta", () => {
    expect(filtrarAnimais(rebanho, "  br-0421 ")[0].id).toBe("6");
  });

  it("consulta vazia devolve os primeiros do rebanho (lista não abre em branco)", () => {
    expect(filtrarAnimais(rebanho, "", 3)).toHaveLength(3);
    expect(filtrarAnimais(rebanho, "   ", 2)).toHaveLength(2);
  });

  it("respeita o limite", () => {
    expect(filtrarAnimais(rebanho, "0", 2)).toHaveLength(2);
  });

  it("termo sem correspondência devolve lista vazia", () => {
    expect(filtrarAnimais(rebanho, "zzz")).toEqual([]);
  });

  it("animal sem brinco não quebra a busca", () => {
    expect(() => filtrarAnimais([a("x", null)], "20")).not.toThrow();
    expect(filtrarAnimais([a("x", null)], "20")).toEqual([]);
  });
});

describe("acharBrincoExato", () => {
  it("casa só no brinco idêntico", () => {
    expect(acharBrincoExato(rebanho, "2010")?.id).toBe("1");
    expect(acharBrincoExato(rebanho, "201")).toBeNull();
  });

  it("consulta vazia não casa com animal sem brinco", () => {
    expect(acharBrincoExato(rebanho, "")).toBeNull();
    expect(acharBrincoExato(rebanho, "  ")).toBeNull();
  });
});
