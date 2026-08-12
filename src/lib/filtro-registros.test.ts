import { describe, expect, it } from "vitest";
import {
  dataDoRegistro,
  filtrarRegistros,
  temFiltroAtivo,
  valoresDistintos,
  type RegistroFiltravel,
  camposCategoricos,
} from "@/lib/filtro-registros";

const r = (
  id: string,
  payload: Record<string, string>,
  created_at?: string,
): RegistroFiltravel => ({
  id,
  payload,
  created_at,
});

const CARGAS = [
  r("1", {
    data: "2026-08-01",
    fazenda: "Sato",
    placa: "NER-2A45",
    motorista: "João",
    etapa: "conferida",
  }),
  r("2", {
    data: "2026-08-05",
    fazenda: "Nascente",
    placa: "ABC-1234",
    motorista: "Maria",
    etapa: "balanca",
  }),
  r("3", {
    data: "2026-07-20",
    fazenda: "Sato",
    placa: "XYZ-9999",
    motorista: "João",
    etapa: "lavoura",
  }),
];

describe("busca — varre o payload inteiro, não só as colunas visíveis", () => {
  it("acha por PLACA, que não é coluna da tabela", () => {
    // Era o defeito: a busca do DataTable só varre colunas visíveis, e a tabela
    // mostrava 6 de 33 campos. Procurar pela placa não achava nada, embora ela
    // estivesse no registro.
    expect(filtrarRegistros(CARGAS, { busca: "NER-2A45" }).map((x) => x.id)).toEqual(["1"]);
  });

  it("acha por motorista, e não diferencia maiúscula", () => {
    expect(filtrarRegistros(CARGAS, { busca: "joão" }).map((x) => x.id)).toEqual(["1", "3"]);
  });

  it("acha pelo NOME do campo — útil para 'quais têm romaneio?'", () => {
    const comRomaneio = [...CARGAS, r("4", { romaneio_num: "5512" })];
    expect(filtrarRegistros(comRomaneio, { busca: "romaneio" }).map((x) => x.id)).toEqual(["4"]);
  });

  it("busca vazia ou só espaço não filtra nada", () => {
    expect(filtrarRegistros(CARGAS, { busca: "   " })).toHaveLength(3);
    expect(filtrarRegistros(CARGAS, {})).toHaveLength(3);
  });
});

describe("período — o PeriodPicker passa a filtrar de verdade", () => {
  it("mantém só o que está no intervalo", () => {
    const dentro = filtrarRegistros(CARGAS, {
      periodo: { granularity: "mensal", start: "2026-08-01", end: "2026-08-31", label: "Agosto" },
    });
    expect(dentro.map((x) => x.id)).toEqual(["1", "2"]);
  });

  it("registro sem data reconhecível NÃO some da tela", () => {
    // Sumir sem explicação é pior que aparecer fora do intervalo: o usuário
    // procuraria um registro que ele sabe que cadastrou.
    const semData = [...CARGAS, r("9", { fazenda: "Monte Alto" })];
    const saida = filtrarRegistros(semData, {
      periodo: { granularity: "mensal", start: "2026-08-01", end: "2026-08-31", label: "Agosto" },
    });
    expect(saida.map((x) => x.id)).toContain("9");
  });

  it("cai para created_at quando o payload não tem data", () => {
    const reg = r("x", { fazenda: "Sato" }, "2026-08-03T10:00:00Z");
    expect(dataDoRegistro(reg)).toBe("2026-08-03");
    expect(
      filtrarRegistros([reg], {
        periodo: { granularity: "mensal", start: "2026-08-01", end: "2026-08-31", label: "Ago" },
      }),
    ).toHaveLength(1);
  });

  it("a data do FATO ganha da data de cadastro", () => {
    // Apontamento colado dias depois: `data` é do dia da colheita, `created_at`
    // é de hoje. Filtrar por created_at esconderia o registro do dia certo.
    const colado = r("c", { data: "2026-07-15" }, "2026-08-10T09:00:00Z");
    expect(dataDoRegistro(colado)).toBe("2026-07-15");
  });
});

describe("filtro por campo", () => {
  it("igualdade exata", () => {
    expect(filtrarRegistros(CARGAS, { campos: { etapa: "balanca" } }).map((x) => x.id)).toEqual([
      "2",
    ]);
  });

  it("valor vazio no filtro significa 'todos'", () => {
    expect(filtrarRegistros(CARGAS, { campos: { etapa: "" } })).toHaveLength(3);
  });

  it("combina com busca e período (E, não OU)", () => {
    const saida = filtrarRegistros(CARGAS, {
      busca: "joão",
      campos: { fazenda: "Sato" },
      periodo: { granularity: "mensal", start: "2026-08-01", end: "2026-08-31", label: "Ago" },
    });
    expect(saida.map((x) => x.id)).toEqual(["1"]);
  });
});

describe("valoresDistintos — alimenta os seletores", () => {
  it("distintos, ordenados, sem vazio", () => {
    expect(valoresDistintos(CARGAS, "fazenda")).toEqual(["Nascente", "Sato"]);
  });

  it("campo inexistente devolve vazio, não quebra", () => {
    expect(valoresDistintos(CARGAS, "inexistente")).toEqual([]);
  });
});

describe("temFiltroAtivo", () => {
  it("reconhece cada tipo de filtro", () => {
    expect(temFiltroAtivo({})).toBe(false);
    expect(temFiltroAtivo({ busca: "  " })).toBe(false);
    expect(temFiltroAtivo({ busca: "x" })).toBe(true);
    expect(temFiltroAtivo({ campos: { etapa: "" } })).toBe(false);
    expect(temFiltroAtivo({ campos: { etapa: "balanca" } })).toBe(true);
    expect(
      temFiltroAtivo({ periodo: { granularity: "mensal", start: "2026-08-01", label: "Ago" } }),
    ).toBe(true);
  });
});

describe("camposCategoricos", () => {
  // Cada registro tem um `codigo` único e um `status` que se repete — é o par
  // que separa identificador de categoria.
  const REGISTROS = [
    { id: "1", payload: { status: "Entregue", codigo: "CG-1", cliente: "Ceasa", obs: "" } },
    { id: "2", payload: { status: "Entregue", codigo: "CG-2", cliente: "Ceasa", obs: "" } },
    { id: "3", payload: { status: "Atrasado", codigo: "CG-3", cliente: "Ceagesp", obs: "" } },
    { id: "4", payload: { status: "Atrasado", codigo: "CG-4", cliente: "Ceagesp", obs: "" } },
  ];
  const CAMPOS = [
    { key: "status", label: "Status" },
    { key: "codigo", label: "Código" },
    { key: "cliente", label: "Cliente" },
    { key: "obs", label: "Observação" },
    { key: "peso", label: "Peso", type: "number" },
  ];

  it("escolhe o campo cujo valor se repete, não o identificador", () => {
    const chaves = camposCategoricos(REGISTROS, CAMPOS).map((c) => c.key);
    expect(chaves).toContain("status");
    expect(chaves).toContain("cliente");
    // `codigo` é único por registro: viraria um seletor com 4 opções e 4
    // resultados de uma linha cada.
    expect(chaves).not.toContain("codigo");
  });

  it("ignora campo numérico e campo vazio", () => {
    const chaves = camposCategoricos(REGISTROS, CAMPOS).map((c) => c.key);
    expect(chaves).not.toContain("peso");
    expect(chaves).not.toContain("obs");
  });

  it("ignora campo com um valor só — não filtra nada", () => {
    const iguais = REGISTROS.map((r) => ({ ...r, payload: { ...r.payload, status: "Entregue" } }));
    expect(camposCategoricos(iguais, CAMPOS).map((c) => c.key)).not.toContain("status");
  });

  it("ignora campo preenchido só numa minoria", () => {
    const raro = [
      ...REGISTROS.map((r) => ({ ...r, payload: { ...r.payload, etapa: "" } })),
      { id: "5", payload: { status: "Entregue", codigo: "CG-5", cliente: "Ceasa", etapa: "a" } },
      { id: "6", payload: { status: "Atrasado", codigo: "CG-6", cliente: "Ceasa", etapa: "b" } },
    ];
    const chaves = camposCategoricos(raro, [...CAMPOS, { key: "etapa", label: "Etapa" }]).map(
      (c) => c.key,
    );
    expect(chaves).not.toContain("etapa");
  });

  it("respeita o teto de seletores", () => {
    expect(camposCategoricos(REGISTROS, CAMPOS, { maximo: 1 })).toHaveLength(1);
  });

  it("lista vazia não quebra", () => {
    expect(camposCategoricos([], CAMPOS)).toEqual([]);
  });
});
