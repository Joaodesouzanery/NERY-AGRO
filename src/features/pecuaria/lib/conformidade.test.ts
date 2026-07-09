import { describe, it, expect } from "vitest";
import {
  DESMATE_VERIFICAVEL,
  avaliarConformidade,
  coberturaProtocolo,
  ehAnabolizante,
  riscoEmArrobas,
  textoSolicitacaoCar,
  type Conformidade,
} from "./conformidade";

const CTX_LIMPO = { temAnabolizante: false, idadeMesesNoAbate: 24 };

const animalBase = {
  sisbov: "BR123456789",
  brinco_visual: "4820",
  origem: "nascido",
  origem_car: null,
  sexo: "macho",
};

describe("conformidade por protocolo", () => {
  it("animal nascido na fazenda, identificado, novo → tudo conforme", () => {
    const c = avaliarConformidade(animalBase, CTX_LIMPO);
    expect(c).toEqual({
      sisbov: "conforme",
      pnib: "conforme",
      eudr: "conforme",
      boi_china: "conforme",
      estradiol: "conforme",
    });
  });

  it("comprado SEM CAR derruba o EUDR", () => {
    const c = avaliarConformidade(
      { ...animalBase, origem: "comprado", origem_car: null },
      CTX_LIMPO,
    );
    expect(c.eudr).toBe("pendente");
  });

  it("comprado COM CAR passa no EUDR", () => {
    const c = avaliarConformidade(
      { ...animalBase, origem: "comprado", origem_car: "MG-3106200-ABC" },
      CTX_LIMPO,
    );
    expect(c.eudr).toBe("conforme");
  });

  it("origem não declarada (migrado) é pendente, nunca falso-verde", () => {
    const c = avaliarConformidade({ ...animalBase, origem: null }, CTX_LIMPO);
    expect(c.eudr).toBe("pendente");
  });

  it("sem SISBOV / sem brinco → pendente", () => {
    const c = avaliarConformidade({ ...animalBase, sisbov: null, brinco_visual: "  " }, CTX_LIMPO);
    expect(c.sisbov).toBe("pendente");
    expect(c.pnib).toBe("pendente");
  });

  it("Boi China: >30 meses reprova; sem idade é não avaliável", () => {
    expect(avaliarConformidade(animalBase, { ...CTX_LIMPO, idadeMesesNoAbate: 31 }).boi_china).toBe(
      "pendente",
    );
    expect(avaliarConformidade(animalBase, { ...CTX_LIMPO, idadeMesesNoAbate: 30 }).boi_china).toBe(
      "conforme",
    );
    expect(
      avaliarConformidade(animalBase, { ...CTX_LIMPO, idadeMesesNoAbate: null }).boi_china,
    ).toBe("nao_avaliavel");
  });

  it("anabolizante registrado reprova o Estradiol", () => {
    expect(avaliarConformidade(animalBase, { ...CTX_LIMPO, temAnabolizante: true }).estradiol).toBe(
      "pendente",
    );
  });

  it("o sistema NÃO afirma conformidade de desmate (sem fonte de dado)", () => {
    expect(DESMATE_VERIFICAVEL).toBe(false);
  });
});

describe("detecção de anabolizante", () => {
  it("reconhece os produtos proibidos", () => {
    expect(ehAnabolizante("Benzoato de estradiol")).toBe(true);
    expect(ehAnabolizante("Trembolona")).toBe(true);
    expect(ehAnabolizante("Vacina clostridial")).toBe(false);
    expect(ehAnabolizante(null)).toBe(false);
  });
});

describe("cobertura e risco", () => {
  const conformes: Conformidade[] = [
    {
      sisbov: "conforme",
      pnib: "conforme",
      eudr: "pendente",
      boi_china: "nao_avaliavel",
      estradiol: "conforme",
    },
    {
      sisbov: "pendente",
      pnib: "conforme",
      eudr: "pendente",
      boi_china: "conforme",
      estradiol: "conforme",
    },
  ];

  it("cobertura ignora não avaliáveis no denominador", () => {
    expect(coberturaProtocolo(conformes, "boi_china")).toEqual({
      conformes: 1,
      pendentes: 0,
      total: 1,
      pct: 1,
    });
  });

  it("cobertura conta conformes sobre avaliáveis", () => {
    const c = coberturaProtocolo(conformes, "sisbov");
    expect(c.total).toBe(2);
    expect(c.pct).toBe(0.5);
  });

  it("traduz pendência em arrobas, ordenado pelo maior prejuízo", () => {
    const risco = riscoEmArrobas([
      { conformidade: conformes[0], arrobas: 18 },
      { conformidade: conformes[1], arrobas: 20 },
    ]);
    const eudr = risco.find((r) => r.protocolo === "eudr");
    expect(eudr).toEqual({ protocolo: "eudr", animais: 2, arrobas: 38 });
    // SISBOV tem só 1 animal (20 @) → vem depois do EUDR
    expect(risco[0].protocolo).toBe("eudr");
  });

  it("protocolos sem pendência não aparecem no risco", () => {
    expect(
      riscoEmArrobas([{ conformidade: conformes[0], arrobas: 10 }]).some(
        (r) => r.protocolo === "estradiol",
      ),
    ).toBe(false);
  });
});

describe("solicitação de CAR", () => {
  it("gera texto com o brinco e o estabelecimento", () => {
    const texto = textoSolicitacaoCar("4820", "Fazenda Boa Vista");
    expect(texto).toContain("4820");
    expect(texto).toContain("Fazenda Boa Vista");
    expect(texto).toContain("EUDR");
  });

  it("cai para texto genérico sem estabelecimento", () => {
    expect(textoSolicitacaoCar("4820", null)).toContain("o estabelecimento de origem");
  });
});
