import { describe, it, expect } from "vitest";
import { previsoesParto, type EventoRepro } from "./reproducao";
import { contarFaixa, parseBrincoRange } from "./derived";
import { valorPorCabeca } from "./transferencia-interna";
import { sobrepoeMes } from "../components/ocupacao-timeline";
import {
  centrosDeCustoCompartilhados,
  custoAcumuladoPorLote,
} from "../hooks/use-financeiro-pecuaria";
import type { PecLote } from "../types/domain";

// Testes que exercitam arestas encontradas na revisão do módulo. Servem de
// guarda: se o comportamento mudar, quebram aqui antes de chegar ao usuário.

const ev = (
  animal_id: string | null,
  tipo: string,
  data: string,
  resultado: string | null = null,
): EventoRepro => ({ animal_id, tipo, data, resultado });

describe("previsão de parto — arestas", () => {
  it("dois DG positivos do mesmo animal não geram duas previsões", () => {
    const eventos = [
      ev("a", "iatf", "2026-01-01"),
      ev("a", "dg", "2026-02-10", "positivo"),
      ev("a", "dg", "2026-03-10", "positivo"), // reconfirmação da MESMA gestação
    ];
    const p = previsoesParto(eventos);
    const doAnimal = p.filter((x) => x.animal_id === "a");
    expect(doAnimal).toHaveLength(1);
  });

  it("DG positivo sem cobertura anterior usa a data do próprio DG", () => {
    const p = previsoesParto([ev("a", "dg", "2026-01-01", "positivo")]);
    expect(p[0].previsto).toBe("2026-10-13"); // 2026-01-01 + 285d
  });
});

describe("faixa de brincos — coerência entre contar e materializar", () => {
  it("contarFaixa e parseBrincoRange concordam dentro do limite", () => {
    expect(contarFaixa("4820", "4880")).toBe(61);
    expect(parseBrincoRange("4820", "4880")).toHaveLength(61);
  });

  // Contrato entre as duas: contarFaixa informa o total REAL (o modal precisa
  // dele para dizer "grande demais: 6000"), e parseBrincoRange é quem recusa.
  it("acima do teto: contarFaixa informa o total, parseBrincoRange recusa", () => {
    const inicio = "1";
    const fim = "6000"; // > max padrão (5000)
    expect(contarFaixa(inicio, fim)).toBe(6000);
    expect(parseBrincoRange(inicio, fim)).toHaveLength(0);
  });

  it("preserva zero à esquerda", () => {
    expect(parseBrincoRange("0008", "0010")).toEqual(["0008", "0009", "0010"]);
  });

  it("faixa invertida ou não numérica é vazia", () => {
    expect(parseBrincoRange("100", "50")).toEqual([]);
    expect(parseBrincoRange("abc", "def")).toEqual([]);
  });
});

describe("valor de mercado por cabeça (transferência interna)", () => {
  const tabela = { bezerro: 2200, bezerra: 2000 };

  it("usa a categoria quando existe", () => {
    expect(valorPorCabeca("Bezerra", tabela)).toBe(2000);
  });

  it("cai para bezerro quando a categoria é desconhecida ou nula", () => {
    expect(valorPorCabeca("novilho", tabela)).toBe(2200);
    expect(valorPorCabeca(null, tabela)).toBe(2200);
  });

  it("sem tabela retorna null em vez de zero silencioso", () => {
    expect(valorPorCabeca("novilho", {})).toBeNull();
  });
});

describe("custo acumulado por lote", () => {
  const lote = (id: string, cc: string | null): PecLote =>
    ({
      id,
      nome: `Lote ${id}`,
      centro_custo_id: cc,
      fase: null,
      sistema: null,
      peso_alvo_kg: null,
      aberto_em: "2026-01-01",
      encerrado_em: null,
      created_at: "",
      updated_at: "",
    }) as PecLote;

  const cc = [{ id: "cc1", nome: "Pecuária" }] as never[];

  it("soma os contratos do centro de custo do lote", () => {
    const mapa = custoAcumuladoPorLote(
      [lote("L1", "cc1")],
      cc,
      [{ cost_center_id: "cc1", valor: 1000, tipo: "compra_racao", contraparte: "X" }] as never[],
      [],
    );
    expect(mapa.get("L1")?.total).toBe(1000);
    expect(mapa.get("L1")?.porCategoria.alimentacao).toBe(1000);
  });

  it("lote sem centro de custo tem custo zero (não herda de ninguém)", () => {
    const mapa = custoAcumuladoPorLote([lote("L1", null)], cc, [], []);
    expect(mapa.get("L1")?.total).toBe(0);
  });

  // LIMITAÇÃO CONHECIDA: dois lotes no mesmo centro de custo recebem o
  // lançamento INTEIRO cada um (somar os lotes excede o gasto real). Não há
  // rateio automático porque a regra é de negócio. O detector abaixo existe
  // para a UI avisar o gestor. Este teste trava o comportamento atual.
  it("dois lotes no mesmo centro de custo recebem o lançamento inteiro cada um", () => {
    const mapa = custoAcumuladoPorLote(
      [lote("L1", "cc1"), lote("L2", "cc1")],
      cc,
      [{ cost_center_id: "cc1", valor: 1000, tipo: "compra_racao", contraparte: "X" }] as never[],
      [],
    );
    expect(mapa.get("L1")?.total).toBe(1000);
    expect(mapa.get("L2")?.total).toBe(1000);
  });

  it("o detector aponta o centro de custo compartilhado", () => {
    expect(centrosDeCustoCompartilhados([lote("L1", "cc1"), lote("L2", "cc1")])).toEqual(["cc1"]);
    expect(centrosDeCustoCompartilhados([lote("L1", "cc1"), lote("L2", "cc2")])).toEqual([]);
    expect(centrosDeCustoCompartilhados([lote("L1", null), lote("L2", null)])).toEqual([]);
  });
});

describe("timeline ILP — sobreposição de mês", () => {
  it("ocupação em aberto cobre os meses seguintes", () => {
    expect(sobrepoeMes("2026-03-10", null, "2026-03")).toBe(true);
    expect(sobrepoeMes("2026-03-10", null, "2026-12")).toBe(true);
    expect(sobrepoeMes("2026-03-10", null, "2026-02")).toBe(false);
  });

  it("ocupação fechada cobre só o intervalo", () => {
    expect(sobrepoeMes("2026-01-20", "2026-03-05", "2026-02")).toBe(true);
    expect(sobrepoeMes("2026-01-20", "2026-03-05", "2026-03")).toBe(true);
    expect(sobrepoeMes("2026-01-20", "2026-03-05", "2026-04")).toBe(false);
  });

  it("entrada e saída no mesmo mês contam esse mês", () => {
    expect(sobrepoeMes("2026-05-02", "2026-05-28", "2026-05")).toBe(true);
  });

  it("fevereiro (mês curto) não escapa do cálculo de fim de mês", () => {
    expect(sobrepoeMes("2026-02-28", "2026-02-28", "2026-02")).toBe(true);
    expect(sobrepoeMes("2026-03-01", null, "2026-02")).toBe(false);
  });
});
