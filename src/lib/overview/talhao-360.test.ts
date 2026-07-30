import { describe, expect, it } from "vitest";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import { buildTalhao360Overview, eventosPorMes } from "@/lib/overview/talhao-360";
import { field360Tabs } from "@/features/talhao-360/schemas/navigation";
import type { TalhaoInsumosResumo } from "@/features/insumos/lib/estoque";
import type {
  FieldAlert,
  Talhao360Model,
  TalhaoCycle,
  TalhaoPayload,
  TalhaoRecord,
  TimelineEvent,
} from "@/features/talhao-360/types/domain";

// A visão geral do Talhão 360° é de UM talhão: as abas são as seções do 360.
// Estes testes garantem (a) que nenhuma seção fica sem número, (b) que um
// talhão recém-criado não quebra a tela e (c) que as agregações batem.

function talhaoRecord(payload: Partial<TalhaoPayload>, id = "t1"): TalhaoRecord {
  return { id, module: "areas", payload: { talhao: "", ...payload } as TalhaoPayload };
}

const HOJE = "2026-07-30";

const vazio: Talhao360Model = {
  talhoes: [],
  talhao: talhaoRecord({}),
  cycles: [],
  seasons: [],
  selectedSeason: "Sem safra",
  selectedCycle: null,
  events: [],
  alerts: [],
  lastOperation: null,
  nextActivity: null,
};

const ciclos: TalhaoCycle[] = [
  {
    id: "c1",
    safra: "2024/25",
    nome: "Safra 1",
    cultura: "Cebola",
    tipo: "Produção",
    areaHa: 40,
    inicio: "2024-08-01",
    fimPrevisto: "2024-12-01",
    status: "Concluído",
    produtividadeEsperada: 45,
    produtividadeRealizada: 48,
    custoPrevistoHa: 3500,
    custoRealizadoHa: 3400,
    margemEstimadaHa: 1200,
  },
  {
    id: "c2",
    safra: "2025/26",
    nome: "Safra 2",
    cultura: "Cebola",
    tipo: "Produção",
    areaHa: 40,
    inicio: "2025-08-01",
    fimPrevisto: "2025-12-01",
    status: "Em andamento",
    produtividadeEsperada: 50,
    produtividadeRealizada: 60,
    custoPrevistoHa: 4000,
    custoRealizadoHa: 4400,
    margemEstimadaHa: 1500,
  },
];

// Timeline chega do services já em ordem decrescente de data.
const eventos: TimelineEvent[] = [
  { id: "e1", date: "2026-07-20", type: "Aplicação", description: "Fungicida", origin: "Manual" },
  { id: "e2", date: "2026-05-10", type: "Plantio", description: "Plantio", origin: "Automática" },
  { id: "e3", date: "2026-05-02", type: "Aplicação", description: "Adubo", origin: "Manual" },
];

const alertas: FieldAlert[] = [
  {
    id: "a1",
    type: "Praga",
    severity: "Crítico",
    title: "Foco de trips",
    description: "Infestação acima do nível de dano",
    status: "Aberto",
    dueOn: "2026-08-01",
  },
  {
    id: "a2",
    type: "Solo",
    severity: "Atenção",
    title: "pH abaixo do ideal",
    description: "Calagem recomendada",
    status: "Em análise",
  },
  {
    id: "a3",
    type: "Praga",
    severity: "Crítico",
    title: "Mancha foliar",
    description: "Tratada",
    status: "Resolvido",
  },
];

const talhao = talhaoRecord({
  talhao: "T-01",
  codigo: "T01",
  fazenda: "Sato",
  area_ha: "40",
  area_util: "40",
  cultura: "Cebola",
  safra: "2025/26",
  tipo_solo: "Argiloso",
  ph: "6,2",
  classificacao_estrategica: "Estratégico",
});

const cheio: Talhao360Model = {
  talhoes: [
    talhao,
    talhaoRecord({ talhao: "T-02", fazenda: "Sato", area_ha: "25" }, "t2"),
    talhaoRecord({ talhao: "T-03", fazenda: "Outra", area_ha: "100" }, "t3"),
  ],
  talhao,
  cycles: ciclos,
  seasons: ["2024/25", "2025/26"],
  selectedSeason: "2025/26",
  selectedCycle: ciclos[1],
  events: eventos,
  alerts: alertas,
  lastOperation: eventos[0],
  nextActivity: null,
};

const insumos: TalhaoInsumosResumo = {
  movimentacoes: [],
  reservas: [],
  aplicacoes: [],
  custoPrevisto: 3000,
  custoRealizado: 12000,
  custoPorCategoria: [
    { label: "Fertilizante", value: 9000 },
    { label: "Defensivo", value: 3000 },
  ],
};

describe("buildTalhao360Overview — cobertura e entrada vazia", () => {
  it("toda seção do 360 tem KPI, gráfico ou tabela", () => {
    const spec = buildTalhao360Overview(cheio, false, insumos, HOJE);
    expect(coverageReport(spec)).toBe("");
    expect(overviewCoverage(spec).missing).toEqual([]);
    expect(overviewCoverage(spec).orphan).toEqual([]);
  });

  // Cobertura só compara o spec com ele mesmo: um id inventado passaria no
  // teste acima e morreria calado no onSelectTab. Aqui o spec responde à lista
  // real de abas da página.
  it("as abas do spec são exatamente as abas da página (menos a própria)", () => {
    const spec = buildTalhao360Overview(cheio, false, insumos, HOJE);
    expect(spec.tabs.map((t) => t.id)).toEqual(field360Tabs.filter((t) => t !== "overview"));
  });

  it("talhão sem nenhum registro não quebra nem inventa número", () => {
    const spec = buildTalhao360Overview(vazio, false, undefined, HOJE);
    expect(overviewCoverage(spec).missing).toEqual([]);
    expect(overviewCoverage(spec).orphan).toEqual([]);
    expect(spec.kpis.length).toBeGreaterThan(0);
    expect(spec.charts.every((c) => Array.isArray(c.data))).toBe(true);
    expect(spec.charts.find((c) => c.id === "talhao-produtividade-ciclo")?.data).toEqual([]);
    expect(spec.kpis.find((k) => k.label === "Produtividade")?.value).toBe("—");
    expect(spec.kpis.find((k) => k.label === "Dias sem registro")?.value).toBe("—");
    expect(spec.kpis.find((k) => k.label === "Relatórios com dados")?.value).toBe("0 de 6");
    expect(spec.tables).toEqual([]);
  });

  it("carrega o modo para o carimbo do export", () => {
    expect(buildTalhao360Overview(vazio, true).demoMode).toBe(true);
    expect(buildTalhao360Overview(cheio, false, insumos, HOJE).periodLabel).toBe(
      "Safra 2025/26 · Safra 2",
    );
    // Sem safra cadastrada o model devolve o rótulo "Sem safra" — o carimbo não
    // pode virar "Safra Sem safra".
    expect(buildTalhao360Overview(vazio, false).periodLabel).toBe("Sem safra");
  });
});

// `ciclos_json` é texto livre no payload e parseCycles não valida campo a
// campo; a timeline recebe datas de outros módulos. Nada disso pode derrubar
// nem escrever "NaN" na aba que abre por padrão.
describe("buildTalhao360Overview — dado torto não derruba a aba padrão", () => {
  it("ciclo sem status nem data de início ainda entra na visão geral", () => {
    const torto = { id: "cx", nome: "Legado", safra: "2023/24" } as TalhaoCycle;
    const spec = buildTalhao360Overview({ ...vazio, cycles: [torto] }, false, undefined, HOJE);
    expect(spec.charts.find((c) => c.id === "talhao-ciclos-status")?.data).toEqual([
      { label: "Sem informação", total: 1 },
    ]);
    expect(spec.tables?.find((t) => t.id === "talhao-historico-ciclos")?.body[0]).toEqual([
      "Legado",
      "2023/24",
      "—",
      "—",
      "—",
    ]);
  });

  // A timeline aceita data futura (evento planejado). Como ela chega em ordem
  // decrescente, o planejado é o PRIMEIRO da lista: se contasse, o KPI zeraria
  // e o talhão abandonado há um mês pareceria em dia.
  it("evento planejado no futuro não zera os dias sem registro", () => {
    const spec = buildTalhao360Overview(
      {
        ...vazio,
        events: [
          { id: "f", date: "2026-09-10", type: "Plantio", description: "", origin: "Manual" },
          { id: "p", date: "2026-06-30", type: "Aplicação", description: "", origin: "Manual" },
        ],
      },
      false,
      undefined,
      HOJE,
    );
    expect(spec.kpis.find((k) => k.label === "Dias sem registro")?.value).toBe(30);
  });

  it("mês impossível não vira coluna no gráfico de ritmo", () => {
    expect(
      eventosPorMes([
        { id: "x", date: "2026-99-99", type: "Aplicação", description: "", origin: "Manual" },
        { id: "y", date: "2026-07-20", type: "Aplicação", description: "", origin: "Manual" },
      ]),
    ).toEqual([{ label: "07/26", eventos: 1 }]);
  });

  it("data de evento impossível não vira NaN no KPI", () => {
    const spec = buildTalhao360Overview(
      {
        ...vazio,
        events: [
          { id: "e", date: "2026-99-99", type: "Aplicação", description: "", origin: "Manual" },
        ],
      },
      false,
      undefined,
      HOJE,
    );
    expect(spec.kpis.find((k) => k.label === "Dias sem registro")?.value).toBe("—");
  });

  it("produtividade fracionada sai em pt-BR (vírgula)", () => {
    const talhaoFrac = talhaoRecord({ talhao: "T-09", produtividade_realizada: "48,5" });
    const spec = buildTalhao360Overview(
      { ...vazio, talhao: talhaoFrac, talhoes: [talhaoFrac] },
      false,
      undefined,
      HOJE,
    );
    expect(spec.kpis.find((k) => k.label === "Produtividade")?.value).toBe("48,5 sc/ha");
  });

  it("agrupa a fazenda pela mesma régua do perímetro (acento e caixa)", () => {
    const alvo = talhaoRecord({ talhao: "T-01", fazenda: "Fazenda São João", area_ha: "40" });
    const spec = buildTalhao360Overview(
      {
        ...vazio,
        talhao: alvo,
        talhoes: [
          alvo,
          talhaoRecord({ talhao: "T-02", fazenda: "fazenda sao joao ", area_ha: "25" }, "t2"),
          talhaoRecord({ talhao: "T-03", fazenda: "Outra", area_ha: "100" }, "t3"),
        ],
      },
      false,
      undefined,
      HOJE,
    );
    expect(spec.charts.find((c) => c.id === "talhao-area-fazenda")?.data).toEqual([
      { label: "T-01", valor: 40 },
      { label: "T-02", valor: 25 },
    ]);
  });
});

describe("buildTalhao360Overview — números reais", () => {
  const spec = buildTalhao360Overview(cheio, false, insumos, HOJE);
  const kpi = (label: string) => spec.kpis.find((k) => k.label === label);

  it("compara produtividade e custo do ciclo com o plano", () => {
    expect(kpi("Produtividade")?.value).toBe("60 sc/ha");
    expect(kpi("Produtividade")?.trend).toBe("+20% vs. plano"); // 60 sobre 50
    expect(kpi("Produtividade")?.trendDir).toBe("up");
    // 4.400 sobre 4.000 planejados: estourou o plano, então a seta é para baixo.
    expect(kpi("Custo realizado/ha")?.trend).toBe("+10% vs. plano");
    expect(kpi("Custo realizado/ha")?.trendDir).toBe("down");
  });

  it("divide o custo de insumos pela área útil do talhão", () => {
    expect(String(kpi("Custo de insumos")?.value)).toContain("12.000");
    expect(kpi("Custo de insumos")?.hint).toContain("300,00"); // 12.000 / 40 ha
    const grafico = spec.charts.find((c) => c.id === "talhao-insumo-categoria")!;
    expect(grafico.data).toEqual([
      { label: "Fertilizante", valor: 9000 },
      { label: "Defensivo", valor: 3000 },
    ]);
  });

  it("conta só o alerta que ainda exige ação", () => {
    expect(kpi("Alertas abertos")?.value).toBe(2); // o Resolvido sai da fila
    expect(kpi("Alertas críticos")?.value).toBe(1);
    expect(spec.charts.find((c) => c.id === "talhao-alertas-severidade")?.data).toEqual([
      { label: "Crítico", total: 1 },
      { label: "Atenção", total: 1 },
    ]);
    const tabela = spec.tables?.find((t) => t.id === "talhao-alertas-prioritarios");
    expect(tabela?.body[0]).toEqual(["Crítico", "Foco de trips", "2026-08-01", "Aberto"]);
  });

  it("mede os dias desde o último apontamento e o ritmo por mês", () => {
    expect(kpi("Dias sem registro")?.value).toBe(10); // 20/07 → 30/07
    expect(eventosPorMes(eventos)).toEqual([
      { label: "05/26", eventos: 2 },
      { label: "07/26", eventos: 1 },
    ]);
    expect(spec.charts.find((c) => c.id === "talhao-eventos-tipo")?.data).toEqual([
      { label: "Aplicação", valor: 2 },
      { label: "Plantio", valor: 1 },
    ]);
  });

  it("usa a régua do cadastro (seção só conta quando está inteira)", () => {
    // Identificação 5 de 8 campos, Solo 2 de 9, Classificação 1 de 1.
    expect(kpi("Cadastro preenchido")?.value).toBe("20%");
    expect(kpi("Cadastro preenchido")?.hint).toBe("1 de 5 seções completas");
    expect(spec.charts.find((c) => c.id === "talhao-cadastro-secoes")?.data).toEqual([
      { label: "Identificação", valor: 63 },
      { label: "Solo", valor: 22 },
      { label: "Agronomia", valor: 0 },
      { label: "Infraestrutura", valor: 0 },
      { label: "Classificação estratégica", valor: 100 },
    ]);
  });

  it("compara o talhão só com os talhões da mesma fazenda", () => {
    expect(spec.charts.find((c) => c.id === "talhao-area-fazenda")?.data).toEqual([
      { label: "T-01", valor: 40 },
      { label: "T-02", valor: 25 },
    ]);
  });

  it("lista o histórico de ciclos do mais recente para o mais antigo", () => {
    const tabela = spec.tables?.find((t) => t.id === "talhao-historico-ciclos");
    expect(tabela?.body[0][0]).toBe("Safra 2");
    expect(tabela?.body[1][0]).toBe("Safra 1");
    expect(spec.charts.find((c) => c.id === "talhao-produtividade-ciclo")?.data).toEqual([
      { label: "Safra 1 · 2024/25", esperada: 45, realizada: 48 },
      { label: "Safra 2 · 2025/26", esperada: 50, realizada: 60 },
    ]);
  });

  it("mostra quantos modelos de relatório já sairiam preenchidos", () => {
    expect(kpi("Relatórios com dados")?.value).toBe("6 de 6");
    const grafico = spec.charts.find((c) => c.id === "talhao-relatorios-linhas")!;
    // Geral = 2 ciclos + 3 eventos + 3 alertas.
    expect(grafico.data.find((d) => d.label === "Geral")?.valor).toBe(8);
    expect(grafico.data.find((d) => d.label === "Agronômico")?.valor).toBe(2);
  });
});
