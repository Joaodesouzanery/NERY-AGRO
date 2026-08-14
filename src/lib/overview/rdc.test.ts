import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import { buildRdcOverview } from "@/lib/overview/rdc";

// O RDC não tem abas: as "abas" do spec são as seções da ficha + os cortes
// transversais do diário. O teste garante (a) que nenhuma delas fica sem
// número, (b) que o builder aguenta o módulo vazio e (c) que a agregação bate
// com um fixture pequeno o suficiente para se conferir na mão.

const HOJE = "2026-07-29";

function ficha(id: string, payload: Record<string, string>): FieldRecord {
  return { id, module: "rdc-ficha", payload };
}

function item(rdcId: string, payload: Record<string, string>): FieldRecord {
  return {
    id: `${rdcId}-${payload.descricao}`,
    module: "rdc-entry",
    payload: { rdc_id: rdcId, ...payload },
  };
}

function foto(rdcId: string, secao: string): FieldRecord {
  return {
    id: `${rdcId}-foto-${secao}`,
    module: "rdc-photo",
    payload: { rdc_id: rdcId, secao, storage_path: `org/${rdcId}/${secao}/f.jpg` },
  };
}

// 3 fichas em 2 dias: A fechada (28/07) e B/C em rascunho (29/07 = "hoje").
const REGISTROS: FieldRecord[] = [
  ficha("a", {
    data: "2026-07-28",
    titulo: "RDC 28/07",
    responsavel: "Ana",
    clima: "Chuva",
    atividades: JSON.stringify(["Plantio", "Colheita"]),
    status: "Concluído",
  }),
  ficha("b", {
    data: HOJE,
    titulo: "RDC 29/07 — manhã",
    responsavel: "Bruno",
    clima: "Sol",
    atividades: JSON.stringify(["Plantio"]),
    status: "Rascunho",
  }),
  ficha("c", { data: HOJE, titulo: "RDC 29/07 — tarde", responsavel: "Ana", status: "Rascunho" }),

  item("a", {
    secao: "campo",
    tipo: "Insumo",
    data: "2026-07-28",
    descricao: "Herbicida",
    custo: "1000",
    talhao_id: "t1",
    talhao_nome: "Talhão 01",
  }),
  item("a", {
    secao: "campo",
    tipo: "Ocorrência",
    data: "2026-07-28",
    descricao: "Foco de lagarta",
    severidade: "Alta",
    talhao_id: "t1",
    talhao_nome: "Talhão 01",
  }),
  item("a", {
    secao: "pecuaria",
    tipo: "Sanidade",
    data: "2026-07-28",
    descricao: "Vacinação",
    severidade: "Atenção",
    status: "Resolvido",
    custo: "200",
    animal_id: "an1",
  }),
  item("a", {
    secao: "equipe",
    tipo: "Mão de obra",
    data: "2026-07-28",
    descricao: "2 operadores",
    custo: "300",
  }),
  item("b", { secao: "campo", tipo: "Atividade", data: HOJE, descricao: "Inspeção" }),
  item("b", {
    secao: "observacoes",
    tipo: "Pendência",
    data: HOJE,
    descricao: "Cascalho na estrada",
    status: "Pendente",
  }),
  item("c", {
    secao: "campo",
    tipo: "Insumo",
    data: HOJE,
    descricao: "Adubo",
    custo: "500",
    talhao_id: "t2",
    talhao_nome: "Talhão 02",
  }),

  foto("a", "observacoes"),
  foto("a", "campo"),
];

const spec = buildRdcOverview(REGISTROS, false, HOJE);
const kpi = (label: string) => spec.kpis.find((k) => k.label === label);
const chart = (id: string) => spec.charts.find((c) => c.id === id)!;

describe("buildRdcOverview — cobertura e resiliência", () => {
  it("toda seção da ficha tem KPI ou gráfico, e nenhum aponta para aba inexistente", () => {
    expect(coverageReport(spec)).toBe("");
    expect(overviewCoverage(spec).missing).toEqual([]);
    expect(overviewCoverage(spec).orphan).toEqual([]);
  });

  it("sobrevive ao módulo sem nenhuma ficha", () => {
    const vazio = buildRdcOverview([], false, HOJE);
    expect(overviewCoverage(vazio).missing).toEqual([]);
    expect(vazio.kpis.length).toBeGreaterThan(0);
    expect(vazio.charts.every((c) => Array.isArray(c.data))).toBe(true);
    expect(vazio.charts.every((c) => c.data.length === 0)).toBe(true);
    expect(vazio.tables).toBeUndefined();
    expect(kpiDe(vazio, "RDC de hoje")?.hint).toBe("Nenhuma ficha registrada");
  });

  it("sobrevive à query ainda em voo (data undefined)", () => {
    expect(() => buildRdcOverview(undefined, true, HOJE)).not.toThrow();
    expect(buildRdcOverview(undefined, true, HOJE).demoMode).toBe(true);
  });
});

describe("buildRdcOverview — números reais", () => {
  it("soma o custo do diário e separa por seção da ficha", () => {
    expect(String(kpi("Custo lançado")?.value)).toContain("2.000"); // 1000 + 200 + 300 + 500
    expect(chart("rdc-custo-secao").data).toEqual([
      { label: "Campo", valor: 1500 },
      { label: "Pecuária", valor: 200 },
      { label: "Equipe & Máquinas", valor: 300 },
    ]);
    expect(String(kpi("Custo de campo")?.value)).toContain("1.500");
  });

  it("conta só a ocorrência sem resolução e ordena a severidade pela urgência", () => {
    // 2 ocorrências (Ocorrência + Sanidade); a Sanidade está "Resolvido".
    expect(kpi("Ocorrências abertas")?.value).toBe(1);
    expect(kpi("Ocorrências abertas")?.hint).toBe("1 de severidade alta");
    expect(chart("rdc-ocorrencias-severidade").data).toEqual([
      { label: "Alta", total: 1 },
      { label: "Atenção", total: 1 },
    ]);
    expect(spec.tables?.find((t) => t.id === "rdc-ocorrencias-abertas")?.body).toEqual([
      ["28/07/2026", "Campo", "Foco de lagarta", "Alta"],
    ]);
  });

  it("resume o dia pelo mesmo seletor da Torre e mede o ritmo do diário", () => {
    expect(kpi("RDC de hoje")?.value).toBe(2); // fichas b e c
    expect(kpi("RDC de hoje")?.hint).toBe("3 itens · 0 ocorrências");
    expect(chart("rdc-ritmo-diario").data).toEqual([
      { label: "28/07", fichas: 1, itens: 4 },
      { label: "29/07", fichas: 2, itens: 3 },
    ]);
  });

  it("conta o checklist de atividades marcado em cada ficha", () => {
    expect(chart("rdc-atividades").data).toEqual([
      { label: "Plantio", valor: 2 },
      { label: "Colheita", valor: 1 },
    ]);
    expect(kpi("Fichas sem atividade")?.value).toBe(1); // ficha c
  });

  it("mede rastreabilidade: talhões, animais e itens órfãos", () => {
    expect(kpi("Talhões tocados")?.value).toBe(2);
    expect(kpi("Talhões tocados")?.hint).toBe("3 itens sem vínculo");
    expect(kpi("Animais acompanhados")?.value).toBe(1);
    expect(chart("rdc-itens-talhao").data).toEqual([
      { label: "Talhão 01", valor: 2 },
      { label: "Talhão 02", valor: 1 },
    ]);
  });

  it("aponta o que trava o fechamento: rascunhos, pendências e fotos", () => {
    expect(kpi("Fichas em rascunho")?.value).toBe(2);
    expect(kpi("Fichas em rascunho")?.hint).toBe("de 3 fichas");
    expect(kpi("Pendências em aberto")?.value).toBe(1);
    expect(kpi("Fotos anexadas")?.value).toBe(2);
    expect(kpi("Fotos anexadas")?.hint).toBe("2 fichas sem foto");
    expect(spec.tables?.find((t) => t.id === "rdc-rascunhos")?.body).toHaveLength(2);
  });

  it("conta dias de chuva e fichas sem clima informado", () => {
    expect(kpi("Dias com chuva")?.value).toBe(1);
    expect(kpi("Dias com chuva")?.hint).toBe("1 ficha sem clima informado");
    expect(chart("rdc-clima").data).toContainEqual({ label: "Sem clima informado", total: 1 });
  });
});

describe("buildRdcOverview — o que já saiu errado", () => {
  it("o hint de severidade só fala das ocorrências AINDA abertas", () => {
    const atual = buildRdcOverview(
      [
        ficha("a", { data: "2026-07-28", titulo: "RDC", status: "Concluído" }),
        item("a", {
          secao: "campo",
          tipo: "Ocorrência",
          descricao: "resolvida",
          severidade: "Alta",
          status: "Resolvido",
        }),
      ],
      false,
      HOJE,
    );
    const abertas = kpiDe(atual, "Ocorrências abertas");
    expect(abertas?.value).toBe(0);
    expect(abertas?.hint).toBe("0 de severidade alta");
  });

  it("pendência marcada como resolvida sai de 'Pendências em aberto'", () => {
    const atual = buildRdcOverview(
      [
        ficha("a", { data: "2026-07-28", titulo: "RDC" }),
        item("a", {
          secao: "observacoes",
          tipo: "Pendência",
          descricao: "cerca",
          status: "Resolvido",
        }),
        item("a", { secao: "observacoes", tipo: "Pendência", descricao: "porteira" }),
      ],
      false,
      HOJE,
    );
    expect(kpiDe(atual, "Pendências em aberto")?.value).toBe(1);
  });

  it("ficha com data futura não vira 'há -N dias'", () => {
    const atual = buildRdcOverview(
      [ficha("a", { data: "2026-08-05", titulo: "RDC" })],
      false,
      HOJE,
    );
    expect(kpiDe(atual, "RDC de hoje")?.hint).toBe("Última em 05/08/2026 · há 0 dias");
  });

  it("ficha sem data usa o created_at, não o relógio de hoje", () => {
    const atual = buildRdcOverview(
      [
        {
          id: "a",
          module: "rdc-ficha",
          payload: { titulo: "RDC" },
          created_at: "2026-07-20T10:00:00Z",
        },
      ],
      false,
      HOJE,
    );
    expect(kpiDe(atual, "RDC de hoje")?.hint).toBe("Última em 20/07/2026 · há 9 dias");
  });

  it("item sem seção entra em Campo — o total sempre bate com a quebra", () => {
    const atual = buildRdcOverview(
      [
        ficha("a", { data: "2026-07-28", titulo: "RDC" }),
        item("a", { tipo: "Insumo", descricao: "sem secao", custo: "100" }),
      ],
      false,
      HOJE,
    );
    expect(atual.charts.find((c) => c.id === "rdc-custo-secao")?.data).toEqual([
      { label: "Campo", valor: 100 },
    ]);
    expect(String(kpiDe(atual, "Custo de campo")?.value)).toContain("100");
    expect(String(kpiDe(atual, "Custo lançado")?.value)).toContain("100");
  });
});

function kpiDe(atual: ReturnType<typeof buildRdcOverview>, label: string) {
  return atual.kpis.find((k) => k.label === label);
}
