import { describe, expect, it } from "vitest";
import { buildModuleWorkbook } from "@/lib/export-module";
import { __testables } from "@/lib/export-xlsx";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

const { nomesUnicos } = __testables;

const spec: ModuleOverviewSpec = {
  moduleId: "logistica",
  moduleLabel: "Logística",
  tabs: [
    { id: "remessa", label: "Remessa/Recebimento" },
    { id: "cargas", label: "Cargas" },
    { id: "fretes", label: "Fretes" },
  ],
  kpis: [
    { label: "Remessas", value: 2, tabId: "remessa" },
    { label: "Caixas colhidas", value: "1.757", tabId: "remessa" },
  ],
  charts: [
    {
      id: "caixas-fazenda",
      tabId: "remessa",
      title: "Caixas por fazenda",
      kind: "bars",
      xKey: "fazenda",
      series: [{ key: "caixas", name: "Caixas" }],
      data: [
        { fazenda: "Sato", caixas: 1757 },
        { fazenda: "Nascente", caixas: 420 },
      ],
    },
  ],
  tables: [
    {
      id: "sla",
      tabId: "cargas",
      title: "SLA estourado",
      head: ["Carga", "Atraso"],
      body: [["C-01", "2h"]],
    },
  ],
  demoMode: false,
};

const tabs = [
  {
    id: "remessa",
    label: "Remessa/Recebimento",
    fields: [
      { key: "fazenda", label: "Fazenda" },
      { key: "qtd_caixas", label: "Qtd. caixas" },
    ],
    records: [
      { payload: { fazenda: "Sato", qtd_caixas: "881" } },
      { payload: { fazenda: "Sato", qtd_caixas: "876" } },
    ],
  },
  { id: "cargas", label: "Cargas", fields: [{ key: "placa", label: "Placa" }], records: [] },
  {
    id: "fretes",
    label: "Fretes",
    fields: [{ key: "rota", label: "Rota" }],
    records: [{ payload: { rota: "Sato → Matrice" } }],
  },
];

describe("buildModuleWorkbook", () => {
  const wb = buildModuleWorkbook({ spec, tabs, geradoEm: "30/07/2026 10:00" });

  it("abre com a aba Resumo", () => {
    expect(wb.sheets[0].name).toBe("Resumo");
  });

  it("o Resumo carimba modo, período e data de geração", () => {
    const linhas = wb.sheets[0].rows.map((r) => r.join(" | "));
    expect(linhas.some((l) => l.includes("Modo") && l.includes("REAL"))).toBe(true);
    expect(linhas.some((l) => l.includes("Todo o período"))).toBe(true);
    expect(linhas.some((l) => l.includes("30/07/2026 10:00"))).toBe(true);
  });

  it("leva os KPIs e os DADOS de cada gráfico como números", () => {
    const linhas = wb.sheets[0].rows.map((r) => r.join(" | "));
    expect(linhas.some((l) => l.includes("Remessas"))).toBe(true);
    expect(linhas.some((l) => l.includes("Caixas por fazenda") && l.includes("Sato"))).toBe(true);
  });

  it("cria uma aba por sub-aba COM registros e pula as vazias", () => {
    const nomes = wb.sheets.map((s) => s.name);
    expect(nomes).toContain("Remessa/Recebimento");
    expect(nomes).toContain("Fretes");
    expect(nomes).not.toContain("Cargas"); // sem registros
  });

  it("usa os rótulos dos campos como cabeçalho e preenche as linhas", () => {
    const aba = wb.sheets.find((s) => s.name === "Remessa/Recebimento")!;
    expect(aba.header).toEqual(["Fazenda", "Qtd. caixas"]);
    expect(aba.rows).toEqual([
      ["Sato", "881"],
      ["Sato", "876"],
    ]);
  });

  it("as tabelas do spec viram abas próprias", () => {
    expect(wb.sheets.map((s) => s.name)).toContain("SLA estourado");
  });

  it("marca o arquivo de DEMO no nome e no badge", () => {
    const demo = buildModuleWorkbook({
      spec: { ...spec, demoMode: true },
      tabs,
      geradoEm: "30/07/2026 10:00",
    });
    expect(demo.filename).toBe("agrotorre-logistica-demo");
    expect(demo.demoMode).toBe(true);
    expect(demo.subtitle).toContain("DEMO");
  });

  it("campo ausente no payload vira string vazia, não 'undefined'", () => {
    const wb2 = buildModuleWorkbook({
      spec,
      tabs: [
        {
          id: "remessa",
          label: "Remessa/Recebimento",
          fields: [
            { key: "fazenda", label: "Fazenda" },
            { key: "placa", label: "Placa" },
          ],
          records: [{ payload: { fazenda: "Sato" } }],
        },
      ],
      geradoEm: "x",
    });
    expect(wb2.sheets[1].rows[0]).toEqual(["Sato", ""]);
  });
});

// O Excel corta nome de aba em 31 chars — e a Logística tem rótulos longos que
// colidem depois do corte. Sem deduplicar, o xlsx lança justamente no módulo
// com mais abas.
describe("nomes de aba do Excel", () => {
  it("corta em 31 caracteres", () => {
    const longo = "Roteirização de Entregas na Cidade"; // 33 chars
    expect(nomesUnicos([longo])[0]).toHaveLength(31);
  });
  it("deduplica nomes que colidem depois do corte", () => {
    const nomes = nomesUnicos([
      "Controle de Embalagens e Estoque Central",
      "Controle de Embalagens e Estoque Regional",
    ]);
    expect(nomes[0]).not.toBe(nomes[1]);
    expect(nomes.every((n) => n.length <= 31)).toBe(true);
  });
  it("remove caracteres proibidos pelo Excel", () => {
    expect(nomesUnicos(["Custos [2026]/Safra"])[0]).not.toMatch(/[:\\/?*[\]]/);
  });
  it("nome vazio vira 'Dados'", () => {
    expect(nomesUnicos([""])[0]).toBe("Dados");
  });
});
