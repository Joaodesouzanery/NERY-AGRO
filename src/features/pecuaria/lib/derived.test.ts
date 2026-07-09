import { describe, it, expect } from "vitest";
import {
  contarFaixa,
  desvioGmdTag,
  diasEntre,
  emCarencia,
  faixaLotacao,
  gmdEntre,
  gmdMedio,
  gmdUltimo,
  idadeMeses,
  lotacaoRecomendadaUAha,
  lotacaoUAha,
  parseBrincoRange,
  projecaoAbate,
  ultimoPeso,
} from "./derived";

const REF = new Date("2026-07-09T00:00:00Z");

describe("GMD", () => {
  it("gmdEntre calcula Δpeso ÷ Δdias", () => {
    expect(gmdEntre(400, "2026-01-01", 430, "2026-01-31")).toBeCloseTo(1.0, 5);
  });

  it("gmdEntre retorna null para intervalo inválido", () => {
    expect(gmdEntre(400, "2026-01-31", 430, "2026-01-31")).toBeNull();
    expect(gmdEntre(400, "2026-02-01", 430, "2026-01-31")).toBeNull();
  });

  it("gmdUltimo usa o último intervalo", () => {
    const pesagens = [
      { data: "2026-01-01", peso_kg: 400 },
      { data: "2026-01-31", peso_kg: 430 },
      { data: "2026-03-02", peso_kg: 490 },
    ];
    expect(gmdUltimo(pesagens)).toBeCloseTo(60 / 30, 5);
  });

  it("gmdUltimo precisa de 2 pontos", () => {
    expect(gmdUltimo([{ data: "2026-01-01", peso_kg: 400 }])).toBeNull();
  });

  it("gmdMedio faz a média dos intervalos", () => {
    const pesagens = [
      { data: "2026-01-01", peso_kg: 400 },
      { data: "2026-01-31", peso_kg: 430 }, // 1.0
      { data: "2026-03-02", peso_kg: 490 }, // 2.0
    ];
    expect(gmdMedio(pesagens)).toBeCloseTo(1.5, 5);
  });

  it("ultimoPeso pega o peso mais recente independentemente da ordem", () => {
    expect(
      ultimoPeso([
        { data: "2026-03-02", peso_kg: 490 },
        { data: "2026-01-01", peso_kg: 400 },
      ]),
    ).toBe(490);
  });
});

describe("faixa de brincos", () => {
  it("expande faixa numérica inclusiva", () => {
    const lista = parseBrincoRange("4820", "4880");
    expect(lista).toHaveLength(61);
    expect(lista[0]).toBe("4820");
    expect(lista[60]).toBe("4880");
  });

  it("preserva zero-padding", () => {
    expect(parseBrincoRange("0480", "0482")).toEqual(["0480", "0481", "0482"]);
  });

  it("faixa inválida retorna vazio", () => {
    expect(parseBrincoRange("100", "50")).toEqual([]);
    expect(parseBrincoRange("abc", "50")).toEqual([]);
  });

  it("respeita o teto de tamanho", () => {
    expect(parseBrincoRange("1", "100000", 5000)).toEqual([]);
  });

  it("contarFaixa conta sem materializar", () => {
    expect(contarFaixa("4820", "4880")).toBe(61);
    expect(contarFaixa("10", "5")).toBe(0);
  });
});

describe("idade e datas", () => {
  it("idadeMeses a partir do nascimento", () => {
    expect(idadeMeses("2024-07-09", REF)).toBe(24);
  });

  it("diasEntre positivo e negativo", () => {
    expect(diasEntre("2026-01-01", "2026-01-31")).toBe(30);
    expect(diasEntre("2026-01-31", "2026-01-01")).toBe(-30);
  });
});

describe("projeção de abate", () => {
  it("projeta dias até o peso alvo no ritmo do GMD", () => {
    const p = projecaoAbate(400, 520, 1.0, REF);
    expect(p?.dias).toBe(120);
  });

  it("já atingiu o alvo → 0 dias", () => {
    expect(projecaoAbate(520, 520, 1.0, REF)?.dias).toBe(0);
  });

  it("sem GMD positivo → null", () => {
    expect(projecaoAbate(400, 520, 0, REF)).toBeNull();
    expect(projecaoAbate(400, 520, null, REF)).toBeNull();
  });
});

describe("classificação e carência", () => {
  it("desvioGmdTag classifica contra a média do lote", () => {
    expect(desvioGmdTag(1.2, 1.0)).toBe("destaque");
    expect(desvioGmdTag(0.7, 1.0)).toBe("investigar");
    expect(desvioGmdTag(1.0, 1.0)).toBe("normal");
  });

  it("emCarencia bloqueia enquanto libera_em > hoje", () => {
    expect(emCarencia("2026-07-20", REF)).toBe(true);
    expect(emCarencia("2026-07-01", REF)).toBe(false);
    expect(emCarencia(null, REF)).toBe(false);
  });
});

describe("lotação", () => {
  it("UA/ha = (peso vivo ÷ 450) ÷ área", () => {
    expect(lotacaoUAha(45000, 100)).toBeCloseTo(1.0, 5);
  });

  it("área inválida → null", () => {
    expect(lotacaoUAha(45000, 0)).toBeNull();
  });
});

describe("lotação recomendada", () => {
  const cfg = { eficienciaPastejo: 0.45, consumoPvPct: 0.022, pesoUAkg: 450 };

  // 1 UA consome 0,022 × 450 = 9,9 kg MS/dia → 297 kg em 30 dias.
  // (1000 kg MS/ha × 0,45) ÷ 297 = 1,515 UA/ha
  it("aplica oferta × eficiência ÷ consumo do período", () => {
    expect(lotacaoRecomendadaUAha(1000, cfg, 30)).toBeCloseTo(1.5151, 3);
  });

  it("dobrar a oferta dobra a lotação recomendada", () => {
    const a = lotacaoRecomendadaUAha(1000, cfg, 30) ?? 0;
    const b = lotacaoRecomendadaUAha(2000, cfg, 30) ?? 0;
    expect(b).toBeCloseTo(a * 2, 5);
  });

  it("oferta zero ou período zero → null", () => {
    expect(lotacaoRecomendadaUAha(0, cfg, 30)).toBeNull();
    expect(lotacaoRecomendadaUAha(1000, cfg, 0)).toBeNull();
  });
});

describe("faixas de lotação", () => {
  it("classifica nas 4 faixas do plano", () => {
    expect(faixaLotacao(0.8).id).toBe("subutilizado");
    expect(faixaLotacao(1.0).id).toBe("ideal");
    expect(faixaLotacao(1.6).id).toBe("ideal");
    expect(faixaLotacao(1.7).id).toBe("atencao");
    expect(faixaLotacao(1.9).id).toBe("atencao");
    expect(faixaLotacao(2.4).id).toBe("superlotado");
  });

  it("sem dado não vira superlotado", () => {
    expect(faixaLotacao(null).label).toBe("Sem dado");
    expect(faixaLotacao(Number.NaN).label).toBe("Sem dado");
  });
});
