import { describe, expect, it } from "vitest";
import {
  detectarMultiContexto,
  numBr,
  parseCarregamentoItens,
  parseMaoObra,
  parseRomaneio,
  splitApontamentos,
} from "@/lib/romaneio-parse";

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

describe("parseRomaneio — tara do romaneio impresso (OCR)", () => {
  const r = parseRomaneio(
    ["Peso Bruto: 37.620", "Tara: 18.442", "Peso Líquido: 19.178"].join("\n"),
  );
  it("extrai bruto, tara e líquido e não gera aviso de balança", () => {
    expect(r.fields.peso_bruto).toBe("37620");
    expect(r.fields.tara).toBe("18442");
    expect(r.fields.peso_liquido).toBe("19178");
    expect(r.warnings.some((w) => w.includes("bruto"))).toBe(false); // 37620 − 18442 = 19178
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

// "Carregamento chapa / 500 R$ 0,22" não informa o nº de chapas — 500 são
// CAIXAS. A regex antiga (`chapas?[:\s]*`) atravessava o \n e gravava chapas=500
// num campo que nem aparecia na conferência.
describe("parseCarregamentoItens — carregamento sem nº de chapas", () => {
  const texto = ["Carregamento chapa", "500 R$ 0.22 =R$ 110.00", "500 R$ 0.33 =R$ 165.00"].join(
    "\n",
  );

  it("lê cada linha como caixas × preço = total", () => {
    expect(parseCarregamentoItens(texto)).toEqual([
      { caixas: 500, preco: 0.22, total: 110 },
      { caixas: 500, preco: 0.33, total: 165 },
    ]);
  });
  it("calcula o total quando não vem explícito", () => {
    expect(parseCarregamentoItens("500 R$ 0.22")).toEqual([
      { caixas: 500, preco: 0.22, total: 110 },
    ]);
  });
  it("não confunde diárias, carretas nem caixas vazias com carregamento", () => {
    expect(parseCarregamentoItens("06 diárias:R$90,00")).toEqual([]);
    expect(parseCarregamentoItens("04 carretas de caixas vazias: R$30,00")).toEqual([]);
    expect(parseCarregamentoItens("02 caixas vazias R$30.00 =R$ 60.00")).toEqual([]);
    expect(parseCarregamentoItens("02 HN R$ 11.25 =R$ 22.5")).toEqual([]);
  });

  const r = parseRomaneio(texto);
  it("NÃO grava 500 como número de chapas", () => {
    expect(r.fields.chapas).toBeUndefined();
  });
  it("soma caixas e total dos itens", () => {
    expect(r.kind).toBe("carregamento");
    expect(r.fields.qtd_caixas).toBe("1000");
    expect(r.fields.total).toBe("275");
    expect(JSON.parse(r.fields.carregamento_itens ?? "[]")).toHaveLength(2);
  });
  it("regressão: 'Chapas:06' continua saindo", () => {
    const c = parseRomaneio(["Carregamento", "Chapas:06", "Total de caixas:2.632"].join("\n"));
    expect(c.fields.chapas).toBe("06");
    expect(c.fields.qtd_caixas).toBe("2632");
  });
  it("ignora 'chapa' em linha de preço (tudo na mesma linha)", () => {
    expect(
      parseRomaneio("Carregamento chapa 500 R$ 0,22 =R$ 110,00").fields.chapas,
    ).toBeUndefined();
  });
});

describe("detectarMultiContexto — dois apontamentos no mesmo bloco", () => {
  it("avisa quando há dois talhões (uma linha em branco não divide o bloco)", () => {
    const texto = [
      "Data:08/07/2026",
      "Fazenda: Sato",
      "Pivô:51",
      "Talhão:03",
      "Cortadores:09",
      "",
      "Data:08/07/2026",
      "Fazenda:Sato",
      "Pivô: 51",
      "Talhão:04",
      "Cortadores:61",
    ].join("\n");
    expect(splitApontamentos(texto)).toHaveLength(1); // confirma que NÃO foi dividido
    expect(detectarMultiContexto(texto).some((a) => a.includes("talhões"))).toBe(true);
    const r = parseRomaneio(texto);
    expect(r.warnings.some((w) => w.includes("talhões"))).toBe(true);
    expect(r.confidence.talhao).toBe("baixa"); // força a conferência no modo rápido
  });

  it("avisa quando há duas fazendas", () => {
    const texto = [
      "Fazenda: Sato",
      "Talhão:03",
      "01 diária R$ 100,00",
      "",
      "Fazenda nascente",
      "01 diária R$ 90,00",
    ].join("\n");
    expect(detectarMultiContexto(texto).some((a) => a.includes("fazendas"))).toBe(true);
  });

  it("não avisa num apontamento normal de uma fazenda só", () => {
    const r = parseRomaneio(["Fazenda: Sato", "Pivô:51", "Talhão:03", "Cortadores:09"].join("\n"));
    expect(r.warnings.some((w) => w.includes("separe"))).toBe(false);
    expect(r.confidence.talhao).toBe("alta");
  });
});

describe("parseRomaneio — foto do romaneio de papel (OCR)", () => {
  const r = parseRomaneio(
    [
      "Matrice CONTROLE DE REMESSA DE PRODUTOS",
      "FAZENDA MATRICE",
      "9426",
      "Preencher na Lavoura",
      "Ordem de Produção Nº TL03 PV51 SATO CEB",
      "Fazenda Sato",
      "Talhão 03",
      "Cultura cebola",
      "Variedade taila",
      "Data 08/07/2026",
      "Hora Saída 09:22",
      "Qtd. Caixas 881",
      "Motorista Lorival",
      "Local de Descarga Fz. Matrice",
      "Preencher Balança",
      "Entrada 09:56",
      "Peso Bruto 37.620",
      "Tara 18.442",
      "Peso Líquido 19.178",
    ].join("\n"),
  );

  it("extrai o nº do romaneio solto no canto do formulário", () => {
    expect(r.fields.romaneio_num).toBe("9426");
    expect(r.confidence.romaneio_num).toBe("baixa"); // sem rótulo → conferir
  });
  it("usa a fazenda preenchida (Sato), não o cabeçalho impresso (MATRICE)", () => {
    expect(r.fields.fazenda?.toLowerCase()).toBe("sato");
  });
  it("não acusa duas fazendas por causa do cabeçalho impresso", () => {
    expect(r.warnings.some((w) => w.includes("fazendas"))).toBe(false);
  });
  it("lê 'Qtd. Caixas 881' (rótulo antes do número)", () => {
    expect(r.fields.qtd_caixas).toBe("881");
  });
  it("extrai ordem de produção, descarga, horários e pesos", () => {
    expect(r.fields.ordem_producao).toBe("TL03 PV51 SATO CEB");
    expect(r.fields.local_descarga).toBe("Fazenda Matrice");
    expect(r.fields.hora_saida).toBe("09:22");
    expect(r.fields.hora_entrada_balanca).toBe("09:56");
    expect(r.fields.peso_liquido).toBe("19178");
    expect(r.fields.data).toBe("2026-07-08");
  });
  it("não gera aviso de balança (37.620 − 18.442 = 19.178)", () => {
    expect(r.warnings.some((w) => w.includes("bruto"))).toBe(false);
  });
});

describe("parseRomaneio — ticket impresso da balança", () => {
  const ticket = (liquidoFinal: string) =>
    [
      "FAZ MATRICE",
      "ROD BR 251 KM 24",
      "CRISTALINA - GO",
      "Nº ENTRADA: 08/07/2026 09h54h45",
      "Nº SAÍDA: 08/07/2026 11h22h16",
      "CLIENTE: MATRICE PLACA: NFN-6I47",
      "PESAGEM Nº: 016417 COD.ENTRADA Nº: 003",
      "PRODUTO: CEBOLA",
      "PESO ENTRADA: 37.620 kg",
      "PESO SAÍDA: 18.442 kg",
      "PESO LÍQUIDO: 19.178 kg",
      `PESO LÍQUIDO FINAL: ${liquidoFinal} kg`,
      "TIPO DA OPERAÇÃO: RECEBIMENTO",
    ].join("\n");
  const r = parseRomaneio(ticket("19.178"));

  it("preserva o zero à esquerda do nº da pesagem (é identificador, não quantidade)", () => {
    expect(r.fields.pesagem_num).toBe("016417");
    expect(r.fields.cod_entrada).toBe("003");
  });
  it("extrai as duas pesagens e os horários da balança", () => {
    expect(r.fields.peso_entrada).toBe("37620");
    expect(r.fields.peso_saida).toBe("18442");
    expect(r.fields.peso_liquido).toBe("19178");
    expect(r.fields.peso_liquido_final).toBe("19178");
    expect(r.fields.hora_entrada_balanca).toBe("09:54");
    expect(r.fields.hora_saida_balanca).toBe("11:22");
    expect(r.fields.placa).toBe("NFN-6I47");
  });
  it("não avisa quando entrada − saída fecha com o líquido", () => {
    expect(r.warnings.some((w) => w.includes("entrada"))).toBe(false);
  });
  it("avisa quando o líquido final foi corrigido à mão", () => {
    const rasurado = parseRomaneio(ticket("19.368"));
    expect(rasurado.fields.peso_liquido_final).toBe("19368");
    expect(rasurado.warnings.some((w) => w.includes("correção manual"))).toBe(true);
  });
});

describe("parseRomaneio — cultura e variedade além da lista fixa", () => {
  it("reconhece alho (não força cebola)", () => {
    const r = parseRomaneio(["Pivô 54", "Talhão 05 alho"].join("\n"));
    expect(r.fields.cultura).toBe("Alho");
  });
  it("lê a cultura rotulada com confiança alta", () => {
    expect(parseRomaneio("Cultura: tomate").confidence.cultura).toBe("alta");
  });
  it("não usa o rótulo seguinte como valor de cultura", () => {
    expect(parseRomaneio("Cultura\nVariedade taila").fields.cultura).toBeUndefined();
  });
  it("variedade fora da lista sai em caixa alta com confiança baixa", () => {
    const r = parseRomaneio("500 cxs tomate ROXO talhão 02");
    expect(r.fields.variedade).toBe("ROXO");
    expect(r.confidence.variedade).toBe("baixa");
  });
});

describe("parseMaoObra — 'R$' não é categoria de diária", () => {
  it("diária sem categoria não vira categoria 'R'", () => {
    const items = parseMaoObra("01 diária R$ 100,00");
    expect(items).toHaveLength(1);
    expect(items[0].categoria).toBeUndefined();
    expect(items[0].total).toBe(100);
  });
  it("mantém a categoria quando ela existe de verdade", () => {
    expect(parseMaoObra("02 diária alojamento R$ 90.00 =R$ 180.00")[0].categoria).toBe(
      "alojamento",
    );
  });
  it("lê '01Diária R$110.00' (sem espaço)", () => {
    const items = parseMaoObra("01Diária R$110.00");
    expect(items[0].total).toBe(110);
    expect(items[0].categoria).toBeUndefined();
  });
});
