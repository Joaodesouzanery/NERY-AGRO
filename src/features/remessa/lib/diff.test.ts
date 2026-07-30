import { describe, expect, it } from "vitest";
import { aplicarEscolhas, calcularDiff, escolhasPadrao } from "@/features/remessa/lib/diff";

// Caso real: a mensagem do WhatsApp diz 881 cxs / 19.178 kg; o OCR do romaneio
// de papel traz o nº do documento e a ordem de produção, mas erra a placa no
// manuscrito. Nada pode ser sobrescrito sem escolha.
const doTexto = {
  placa: "NFN-6I47",
  qtd_caixas: "881",
  peso_liquido: "19178",
  motorista: "Lorival",
};
const daFoto = {
  placa: "NFN-6147", // OCR trocou I por 1
  qtd_caixas: "881",
  peso_liquido: "19178",
  romaneio_num: "9426",
  ordem_producao: "TL03 PV51 SATO CEB",
};

describe("calcularDiff", () => {
  const linhas = calcularDiff(doTexto, daFoto);

  it("marca como iguais os campos em que as duas fontes batem", () => {
    expect(linhas.find((l) => l.key === "qtd_caixas")?.igual).toBe(true);
    expect(linhas.find((l) => l.key === "peso_liquido")?.igual).toBe(true);
  });
  it("marca como divergente o campo que o OCR leu errado", () => {
    const placa = linhas.find((l) => l.key === "placa");
    expect(placa?.igual).toBe(false);
    expect(placa?.atual).toBe("NFN-6I47");
    expect(placa?.novo).toBe("NFN-6147");
  });
  it("inclui campo que só existe numa das fontes", () => {
    expect(linhas.find((l) => l.key === "romaneio_num")?.atual).toBe("");
    expect(linhas.find((l) => l.key === "motorista")?.novo).toBe("");
  });
  it("põe os divergentes primeiro (é o que precisa de decisão)", () => {
    expect(linhas[0].igual).toBe(false);
  });
  it("usa o rótulo humano do campo", () => {
    expect(linhas.find((l) => l.key === "peso_liquido")?.label).toBe("Peso líquido");
  });
});

describe("escolhasPadrao", () => {
  const linhas = calcularDiff(doTexto, daFoto);
  const padrao = escolhasPadrao(linhas);

  it("preenche lacuna com a fonte nova", () => {
    expect(padrao.romaneio_num).toBe("novo");
    expect(padrao.ordem_producao).toBe("novo");
  });
  it("mantém o que o humano já conferiu quando as duas divergem de verdade", () => {
    expect(padrao.placa).toBe("atual");
  });
  it("não decide nada para campos iguais", () => {
    expect(padrao.qtd_caixas).toBeUndefined();
  });
});

describe("aplicarEscolhas", () => {
  const linhas = calcularDiff(doTexto, daFoto);

  it("aplica o padrão sem perder o que já estava conferido", () => {
    const out = aplicarEscolhas(doTexto, linhas, escolhasPadrao(linhas));
    expect(out.placa).toBe("NFN-6I47"); // o do texto vence
    expect(out.romaneio_num).toBe("9426"); // lacuna preenchida pela foto
    expect(out.motorista).toBe("Lorival"); // não some por não estar na foto
    expect(out.qtd_caixas).toBe("881");
  });

  it("respeita a troca manual para o valor da foto", () => {
    const escolhas = { ...escolhasPadrao(linhas), placa: "novo" as const };
    expect(aplicarEscolhas(doTexto, linhas, escolhas).placa).toBe("NFN-6147");
  });

  it("nunca apaga um campo do formulário por escolha padrão", () => {
    const out = aplicarEscolhas(doTexto, linhas, escolhasPadrao(linhas));
    for (const key of Object.keys(doTexto)) expect(out[key]).toBeTruthy();
  });
});
