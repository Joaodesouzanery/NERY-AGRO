import { describe, expect, it } from "vitest";
import {
  buildAliasMap,
  buildPayloads,
  cellToString,
  dateValue,
  detectDelimiter,
  normalize,
  numberValue,
  parseCsv,
  validateValue,
  type ImportField,
} from "./import-parsing";

describe("normalize", () => {
  it("remove acentos, espaços e símbolos virando snake_case", () => {
    expect(normalize("Área Total (ha)")).toBe("area_total_ha");
    expect(normalize("  Custo / Hectare  ")).toBe("custo_hectare");
    expect(normalize("São Paulo")).toBe("sao_paulo");
  });
});

describe("detectDelimiter", () => {
  it("escolhe ; quando há mais ponto-e-vírgula que vírgula", () => {
    expect(detectDelimiter("a;b;c")).toBe(";");
  });
  it("usa , por padrão (incluindo empate)", () => {
    expect(detectDelimiter("a,b,c")).toBe(",");
    expect(detectDelimiter("sem separador")).toBe(",");
  });
});

describe("parseCsv", () => {
  it("faz parse de linhas e colunas simples", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("respeita campos entre aspas com o delimitador embutido", () => {
    expect(parseCsv('nome,cidade\n"Silva, João",SP')).toEqual([
      ["nome", "cidade"],
      ["Silva, João", "SP"],
    ]);
  });

  it('trata aspas escapadas ("")', () => {
    expect(parseCsv('texto\n"disse ""oi"""')).toEqual([["texto"], ['disse "oi"']]);
  });

  it("detecta ; como delimitador e ignora linhas em branco", () => {
    expect(parseCsv("a;b\n\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("suporta quebras de linha CRLF", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("cellToString", () => {
  it("converte vazios, datas e números", () => {
    expect(cellToString(null)).toBe("");
    expect(cellToString(undefined)).toBe("");
    expect(cellToString(42)).toBe("42");
    expect(cellToString(new Date("2026-05-30T12:00:00Z"))).toBe("2026-05-30");
    expect(cellToString("  oi  ")).toBe("oi");
  });
});

describe("buildAliasMap", () => {
  it("mapeia chave e label normalizadas para a key do campo", () => {
    const fields: ImportField[] = [{ key: "area_ha", label: "Área (ha)" }];
    const map = buildAliasMap(fields);
    expect(map.get("area_ha")).toBe("area_ha");
    expect(map.get("area_ha")).toBe("area_ha");
    expect(map.get(normalize("Área (ha)"))).toBe("area_ha");
  });
});

describe("dateValue", () => {
  it("mantém ISO, converte dd/mm/yyyy e devolve original se inválido", () => {
    expect(dateValue("2026-05-30")).toBe("2026-05-30");
    expect(dateValue("5/7/2026")).toBe("2026-07-05");
    expect(dateValue("texto")).toBe("texto");
    expect(dateValue("")).toBe("");
  });
});

describe("numberValue", () => {
  it("normaliza separadores PT-BR e passa texto inválido adiante", () => {
    expect(numberValue("1.234,56")).toBe("1234.56");
    expect(numberValue("58")).toBe("58");
    expect(numberValue("abc")).toBe("abc");
    expect(numberValue("")).toBe("");
  });
});

describe("validateValue", () => {
  it("valida números", () => {
    expect(validateValue({ key: "v", label: "V", type: "number" }, "12,5")).toBeNull();
    expect(validateValue({ key: "v", label: "V", type: "number" }, "abc")).toBe("Número inválido");
  });
  it("valida datas", () => {
    expect(validateValue({ key: "d", label: "D", type: "date" }, "30/05/2026")).toBeNull();
    expect(validateValue({ key: "d", label: "D", type: "date" }, "xx")).toBe("Data inválida");
  });
  it("valida GPS lat,lng", () => {
    expect(validateValue({ key: "g", label: "G", type: "gps" }, "-23.55,-46.63")).toBeNull();
    expect(validateValue({ key: "g", label: "G", type: "gps" }, "abc")).toBe(
      "GPS deve estar em latitude,longitude",
    );
  });
  it("não exige valor (vazio é válido)", () => {
    expect(validateValue({ key: "v", label: "V", type: "number" }, "")).toBeNull();
  });
});

describe("buildPayloads", () => {
  const fields: ImportField[] = [
    { key: "valor", label: "Valor", type: "number" },
    { key: "nome", label: "Nome" },
  ];

  it("monta payloads, prepara valores e numera issues a partir da linha 2", () => {
    const { payloads, issues } = buildPayloads({
      headers: ["Valor", "Nome"],
      dataRows: [
        ["1.234,56", "Maria"],
        ["abc", "João"],
      ],
      mapping: { 0: "valor", 1: "nome" },
      fields,
    });
    expect(payloads).toEqual([
      { valor: "1234.56", nome: "Maria" },
      { valor: "abc", nome: "João" },
    ]);
    expect(issues).toEqual([{ row: 3, field: "Valor", message: "Número inválido" }]);
  });

  it("descarta linhas totalmente vazias", () => {
    const { payloads } = buildPayloads({
      headers: ["Valor", "Nome"],
      dataRows: [["", ""]],
      mapping: { 0: "valor", 1: "nome" },
      fields,
    });
    expect(payloads).toEqual([]);
  });
});

describe("buildPayloads — campo obrigatório", () => {
  it("recusa a linha sem o campo-chave, mesmo com o resto preenchido", () => {
    // `validateValue` só olha valor PRESENTE, então planilha sem a coluna de
    // placa passava batido e virava um veículo que ninguém acha depois.
    const { issues } = buildPayloads({
      headers: ["Modelo"],
      dataRows: [["Scania R450"]],
      mapping: { 0: "modelo" },
      fields: [
        { key: "placa", label: "Placa", required: true },
        { key: "modelo", label: "Modelo" },
      ],
    });
    expect(issues).toContainEqual({ row: 2, field: "Placa", message: "obrigatório" });
  });

  it("aceita a linha quando o obrigatório vem preenchido", () => {
    const { payloads, issues } = buildPayloads({
      headers: ["Placa"],
      dataRows: [["ABC-1D23"]],
      mapping: { 0: "placa" },
      fields: [{ key: "placa", label: "Placa", required: true }],
    });
    expect(issues).toEqual([]);
    expect(payloads[0].placa).toBe("ABC-1D23");
  });

  it("aponta o número da linha da planilha, não o índice do laço", () => {
    const { issues } = buildPayloads({
      headers: ["Placa", "Modelo"],
      dataRows: [
        ["ABC-1D23", "Scania"],
        ["", "VW"],
        ["XYZ-9K88", "Volvo"],
      ],
      mapping: { 0: "placa", 1: "modelo" },
      fields: [
        { key: "placa", label: "Placa", required: true },
        { key: "modelo", label: "Modelo" },
      ],
    });
    // 2ª linha de dados = linha 3 do arquivo (cabeçalho + base 1)
    expect(issues.map((i) => i.row)).toEqual([3]);
  });
});
