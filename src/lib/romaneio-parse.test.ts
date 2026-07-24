import { describe, expect, it } from "vitest";
import { numBr, parseMaoObra, parseRomaneio, splitApontamentos } from "@/lib/romaneio-parse";

describe("splitApontamentos (multi-colar)", () => {
  it("um apontamento simples vira um bloco só", () => {
    expect(splitApontamentos("Placa ABC 100 cxs")).toEqual(["Placa ABC 100 cxs"]);
  });
  it("não divide um apontamento multi-linha com uma linha em branco no meio", () => {
    const t = "Placa ABC 100 cxs\n\nmédia 21.7";
    expect(splitApontamentos(t)).toEqual(["Placa ABC 100 cxs\n\nmédia 21.7"]);
  });
  it("divide por separador de traços", () => {
    expect(splitApontamentos("bloco 1\n---\nbloco 2")).toEqual(["bloco 1", "bloco 2"]);
  });
  it("divide por espaço grande (2+ linhas em branco)", () => {
    expect(splitApontamentos("bloco 1\n\n\nbloco 2")).toEqual(["bloco 1", "bloco 2"]);
  });
  it("ignora blocos vazios entre separadores", () => {
    expect(splitApontamentos("a\n---\n\n---\nb")).toEqual(["a", "b"]);
  });
});

describe("numBr (número BR/misto)", () => {
  it("trata milhar e decimal corretamente", () => {
    expect(numBr("19.178")).toBe("19178"); // milhar
    expect(numBr("21.7")).toBe("21.7"); // decimal com ponto
    expect(numBr("24,33")).toBe("24.33"); // decimal com vírgula
    expect(numBr("2.632")).toBe("2632");
    expect(numBr("438,5")).toBe("438.5");
    expect(numBr("R$1,70")).toBe("1.7");
    expect(numBr("R$0,22")).toBe("0.22");
    expect(numBr("2.830,50")).toBe("2830.5");
    expect(numBr("")).toBe("");
  });
});

describe("parseRomaneio — apontamento de remessa (linha única)", () => {
  const r = parseRomaneio(
    "Lorival placa NFN-6I47 com  881 cxs cebola TAILA talhão 03 PV 51 peso líquido de 19.178 kg média de 21.7",
  );
  it("classifica como remessa", () => expect(r.kind).toBe("remessa"));
  it("extrai placa, motorista e caixas", () => {
    expect(r.fields.placa).toBe("NFN-6I47");
    expect(r.fields.motorista?.toLowerCase()).toBe("lorival");
    expect(r.fields.qtd_caixas).toBe("881");
    expect(r.fields.unidade).toBe("cx");
  });
  it("extrai talhão, pivô, cultura, variedade", () => {
    expect(r.fields.talhao).toBe("03");
    expect(r.fields.pivo).toBe("51");
    expect(r.fields.cultura).toBe("Cebola");
    expect(r.fields.variedade?.toLowerCase()).toContain("taila");
  });
  it("extrai peso líquido e média (milhar vs decimal)", () => {
    expect(r.fields.peso_liquido).toBe("19178");
    expect(r.fields.media).toBe("21.7");
  });
  it("não gera aviso de média (19178/881 ≈ 21,77 ≈ 21,7)", () => {
    expect(r.warnings.some((w) => w.includes("Média"))).toBe(false);
  });
});

describe("parseRomaneio — apontamento multi-linha (beg + horários)", () => {
  const r = parseRomaneio(
    [
      "Lorival placa NFN 6I47",
      "Chegou em monte alto 11.30",
      "Saída as 15.40",
      "Carregando com 33 beg de cebola",
      "Pivô:02",
      "Talhão:02",
      "Fazenda:nascente",
      "Variedade:vale sul!!!",
    ].join("\n"),
  );
  it("normaliza placa com espaço", () => expect(r.fields.placa).toBe("NFN-6I47"));
  it("extrai horários de chegada e saída", () => {
    expect(r.fields.hora_chegada).toBe("11:30");
    expect(r.fields.hora_saida).toBe("15:40");
  });
  it("extrai quantidade em beg", () => {
    expect(r.fields.qtd_caixas).toBe("33");
    expect(r.fields.unidade).toBe("beg");
  });
  it("extrai fazenda e variedade rotuladas", () => {
    expect(r.fields.fazenda?.toLowerCase()).toBe("nascente");
    expect(r.fields.variedade?.toLowerCase()).toBe("vale sul");
  });
});

describe("parseRomaneio — 'ficou na lavoura'", () => {
  const r = parseRomaneio(
    ["Data 09/07/2026", "Foi carregando 65 beg de cebola", "Ficou na lavoura 94 beg!!!"].join("\n"),
  );
  it("extrai data, carregado e saldo em campo", () => {
    expect(r.fields.data).toBe("2026-07-09");
    expect(r.fields.qtd_caixas).toBe("65");
    expect(r.fields.ficou_na_lavoura).toBe("94");
  });
});

describe("parseRomaneio — corte (mão de obra)", () => {
  const r = parseRomaneio(
    [
      "Data:08/07/2026",
      "Fazenda: Sato",
      "Pivô:51",
      "Talhão:03",
      "Turma própria: alojamento",
      "Total de caixas:219",
      "Cortadores:09",
      "Média:24,33",
      "Carga horária 07 as 11:30 hs",
      "Preço p/ caixa: R$1,70",
      "Total:R$372,30",
    ].join("\n"),
  );
  it("classifica como corte", () => expect(r.kind).toBe("corte"));
  it("extrai cortadores, caixas, média e preço", () => {
    expect(r.fields.cortadores).toBe("09");
    expect(r.fields.qtd_caixas).toBe("219");
    expect(r.fields.media).toBe("24.33");
    expect(r.fields.preco_caixa).toBe("1.7");
    expect(r.fields.data).toBe("2026-07-08");
    expect(r.fields.fazenda?.toLowerCase()).toBe("sato");
  });
});

describe("parseRomaneio — carregamento (chapas)", () => {
  const r = parseRomaneio(
    [
      "Carregamento",
      "Chapas:06",
      "Total de caixas:2.632",
      "Média:438,5 caixas p/ chapa",
      "Preço p/ caixa: R$0,22",
      "04 carretas de caixas vazias: R$30,00",
    ].join("\n"),
  );
  it("classifica como carregamento", () => expect(r.kind).toBe("carregamento"));
  it("extrai chapas, caixas, preço e carretas de vazias", () => {
    expect(r.fields.chapas).toBe("06");
    expect(r.fields.qtd_caixas).toBe("2632");
    expect(r.fields.preco_caixa).toBe("0.22");
    expect(r.fields.carretas_vazias).toBe("04");
  });
});

describe("parseRomaneio — caixas vazias indo para o campo", () => {
  const r = parseRomaneio(
    "Antônio placa GPC-2G22 saída para Sato às 11:21 com 936 cxs plástica mista",
  );
  it("classifica como caixas-vazias", () => expect(r.kind).toBe("caixas-vazias"));
  it("extrai placa, quantidade e horário", () => {
    expect(r.fields.placa).toBe("GPC-2G22");
    expect(r.fields.qtd_caixas).toBe("936");
    expect(r.fields.hora_saida).toBe("11:21");
  });
});

describe("parseRomaneio — valida média divergente", () => {
  const r = parseRomaneio("881 cxs peso líquido de 19.178 kg média de 30");
  it("gera aviso quando a média não bate com peso/caixas", () => {
    expect(r.warnings.some((w) => w.includes("Média"))).toBe(true);
  });
});

describe("parseRomaneio — Total do bloco e 'Preço por caixa' por extenso", () => {
  const r = parseRomaneio(
    ["Total de caixas:219", "Cortadores:09", "Preço por caixa: R$1,70", "Total:R$372,30"].join(
      "\n",
    ),
  );
  it("extrai o Total em R$ (ignora 'Total de caixas')", () => {
    expect(r.fields.total).toBe("372.3");
    expect(r.fields.qtd_caixas).toBe("219");
  });
  it("lê 'Preço por caixa' escrito por extenso", () => {
    expect(r.fields.preco_caixa).toBe("1.7");
  });
});

describe("parseRomaneio — carregamento com 'Total' sem R$", () => {
  const r = parseRomaneio(
    [
      "Carregamento",
      "Chapas:06",
      "Total de caixas:2.632",
      "Preço p/ caixa: R$0,22",
      "Total:579,26",
    ].join("\n"),
  );
  it("extrai total 579.26 sem confundir com 'Total de caixas'", () => {
    expect(r.kind).toBe("carregamento");
    expect(r.fields.total).toBe("579.26");
    expect(r.fields.qtd_caixas).toBe("2632");
  });
});

describe("parseMaoObra — diárias e horas (HN/HE)", () => {
  it("diárias com total explícito e calculado, + categoria", () => {
    const items = parseMaoObra(
      ["06 diárias:R$90,00", "02 diária alojamento R$ 90.00 =R$ 180.00", "01 HE R$ 16.87"].join(
        "\n",
      ),
    );
    expect(items.find((i) => i.tipo === "diaria" && !i.categoria && i.qtd === 6)?.total).toBe(540);
    expect(items.find((i) => i.categoria === "alojamento")?.total).toBe(180);
    expect(items.find((i) => i.tipo === "HE")?.total).toBeCloseTo(16.87, 2);
  });
  it("HN/HE com total explícito (=R$)", () => {
    const items = parseMaoObra("02 HN R$ 11.25 =R$ 22.5\n01 HE R$ 16.87 =R$ 16.87");
    expect(items.find((i) => i.tipo === "HN")?.total).toBe(22.5);
    expect(items.find((i) => i.tipo === "HE")?.total).toBeCloseTo(16.87, 2);
  });
});

describe("parseRomaneio — bloco só de diárias vira kind 'diarias'", () => {
  const r = parseRomaneio(
    [
      "Data:08/07/2026",
      "06 diárias:R$90,00",
      "Total:R$540,00",
      "03 diárias:R$100,00",
      "Total:R$300,00",
      "02 diárias: R$120,00",
      "Total:R$240,00",
    ].join("\n"),
  );
  it("classifica como diarias e soma a mão de obra", () => {
    expect(r.kind).toBe("diarias");
    expect(r.fields.total_mao_obra).toBe("1080"); // 6×90 + 3×100 + 2×120
    expect(JSON.parse(r.fields.mao_obra ?? "[]")).toHaveLength(3);
  });
});

describe("parseRomaneio — caixas vazias com valor + fazenda sem 'às'", () => {
  it("extrai preço/unid. e valor das caixas vazias soltas", () => {
    const r = parseRomaneio("02 caixas vazias R$30.00 =R$ 60.00");
    expect(r.kind).toBe("caixas-vazias");
    expect(r.fields.preco_unit).toBe("30");
    expect(r.fields.valor).toBe("60");
  });
  it("limpa a cauda 'às' do nome da fazenda", () => {
    const r = parseRomaneio("Antônio placa GPC-2G22 saída para Sato às 11:21 com 936 cxs");
    expect(r.fields.fazenda?.toLowerCase()).toBe("sato");
  });
});
