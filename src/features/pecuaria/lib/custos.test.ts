import { describe, it, expect } from "vitest";
import {
  arrobasCarcaca,
  arrobasProduzidas,
  categorizarCusto,
  custoPorArroba,
  ganhoPesoAnimal,
  margemPorArroba,
  resultadoLote,
  somarCustos,
} from "./custos";

describe("arrobas produzidas", () => {
  it("ganho × rendimento ÷ 15", () => {
    // 300 kg de ganho a 52% = 156 kg de carcaça = 10,4 @
    expect(arrobasProduzidas(300, 0.52)).toBeCloseTo(10.4, 5);
  });

  it("a 50% de rendimento equivale ao atalho ganho ÷ 30", () => {
    expect(arrobasProduzidas(300, 0.5)).toBeCloseTo(300 / 30, 5);
  });

  it("ganho não positivo → 0", () => {
    expect(arrobasProduzidas(0, 0.52)).toBe(0);
    expect(arrobasProduzidas(-10, 0.52)).toBe(0);
  });
});

describe("custo e margem por arroba", () => {
  it("custo/@ = custo ÷ @", () => {
    expect(custoPorArroba(5200, 10.4)).toBeCloseTo(500, 5);
  });

  it("sem arroba produzida não divide por zero", () => {
    expect(custoPorArroba(5200, 0)).toBeNull();
  });

  it("margem/@ = preço − custo/@; resultado = margem × @", () => {
    const custo = custoPorArroba(5200, 10.4);
    const margem = margemPorArroba(320, custo);
    expect(margem).toBeCloseTo(-180, 5);
    expect(resultadoLote(margem, 10.4)).toBeCloseTo(-1872, 5);
  });

  it("margem é null quando o custo/@ é indefinido", () => {
    expect(margemPorArroba(320, null)).toBeNull();
    expect(resultadoLote(null, 10)).toBeNull();
  });
});

describe("ganho de peso", () => {
  it("último − primeiro", () => {
    expect(
      ganhoPesoAnimal([
        { data: "2026-03-01", peso_kg: 380 },
        { data: "2026-01-01", peso_kg: 300 },
        { data: "2026-02-01", peso_kg: 340 },
      ]),
    ).toBe(80);
  });

  it("uma pesagem só não é ganho", () => {
    expect(ganhoPesoAnimal([{ data: "2026-01-01", peso_kg: 418 }])).toBe(0);
  });

  it("perda de peso não vira ganho negativo", () => {
    expect(
      ganhoPesoAnimal([
        { data: "2026-01-01", peso_kg: 400 },
        { data: "2026-02-01", peso_kg: 380 },
      ]),
    ).toBe(0);
  });
});

describe("categorização de lançamento", () => {
  it("reconhece as categorias do plano", () => {
    expect(categorizarCusto("Compra de ração proteica")).toBe("alimentacao");
    expect(categorizarCusto("Aquisição de bezerros")).toBe("aquisicao");
    expect(categorizarCusto("Vacina clostridial")).toBe("sanidade");
    expect(categorizarCusto("Folha de pagamento do peão")).toBe("mao_de_obra");
    expect(categorizarCusto("Conserto da cerca")).toBe("outros");
    expect(categorizarCusto(null)).toBe("outros");
  });

  it("somarCustos agrega por categoria e ignora valores não positivos", () => {
    const { total, porCategoria } = somarCustos([
      { valor: 1000, texto: "Ração" },
      { valor: 500, texto: "Vermífugo" },
      { valor: 0, texto: "Ração" },
      { valor: -50, texto: "Ração" },
      { valor: 200, texto: "Frete" },
    ]);
    expect(total).toBe(1700);
    expect(porCategoria.alimentacao).toBe(1000);
    expect(porCategoria.sanidade).toBe(500);
    expect(porCategoria.outros).toBe(200);
  });
});

describe("romaneio", () => {
  it("@ de carcaça = peso vivo × rendimento ÷ 15", () => {
    expect(arrobasCarcaca(450, 0.52)).toBeCloseTo(15.6, 5);
  });
});
