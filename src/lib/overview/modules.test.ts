import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import { buildCarbonoOverview } from "@/lib/overview/carbono";
import { buildInteligenciaOverview } from "@/lib/overview/inteligencia";
import { buildEquipeOverview } from "@/lib/overview/equipe";
import { buildCogsOverview } from "@/lib/overview/cogs";
import { buildLogisticaOverview } from "@/lib/overview/logistica";

// A promessa era "dashboards e gráficos de TODAS as abas, em todas as visões
// gerais". Esses testes tornam a promessa mecânica: se alguém adicionar uma aba
// nova e esquecer da visão geral, o build quebra aqui e não em produção.

function rec(module: string, payload: Record<string, string>, id = `${module}-${Math.random()}`) {
  return { id, area: "x", module, payload } as OperationRecord;
}

const BUILDERS = [
  { nome: "Emissão de Carbono", build: buildCarbonoOverview },
  { nome: "Inteligência", build: buildInteligenciaOverview },
  { nome: "Equipe & Vendas", build: buildEquipeOverview },
  { nome: "Otimização de COGS", build: buildCogsOverview },
  {
    nome: "Logística",
    build: (r: Record<string, OperationRecord[]>, d: boolean) => buildLogisticaOverview(r, d),
  },
];

describe("cobertura das visões gerais", () => {
  for (const { nome, build } of BUILDERS) {
    it(`${nome}: toda aba tem KPI ou gráfico`, () => {
      const spec = build({}, false);
      expect(coverageReport(spec)).toBe("");
      expect(overviewCoverage(spec).missing).toEqual([]);
    });

    it(`${nome}: nenhum gráfico aponta para aba inexistente`, () => {
      expect(overviewCoverage(build({}, false)).orphan).toEqual([]);
    });

    it(`${nome}: sobrevive a módulo sem nenhum registro`, () => {
      const spec = build({}, false);
      expect(spec.kpis.length).toBeGreaterThan(0);
      expect(spec.charts.every((c) => Array.isArray(c.data))).toBe(true);
    });

    it(`${nome}: carrega o modo para o carimbo do export`, () => {
      expect(build({}, true).demoMode).toBe(true);
      expect(build({}, false).demoMode).toBe(false);
    });
  }
});

describe("buildCarbonoOverview — números reais", () => {
  const registros = {
    carbono: [
      rec("carbono", { escopo: "1", categoria: "Diesel", co2e: "12000" }),
      rec("carbono", { escopo: "2", categoria: "Energia elétrica", co2e: "3000" }),
      rec("carbono", { escopo: "1", categoria: "Diesel", co2e: "8000" }),
    ],
    agroecologia: [
      rec("agroecologia", { pratica: "Plantio direto", area: "120" }),
      rec("agroecologia", { pratica: "Cobertura verde", area: "40" }),
    ],
  };
  const spec = buildCarbonoOverview(registros, false);

  it("mostra a emissão total em toneladas no primeiro KPI", () => {
    expect(String(spec.kpis[0].value)).toContain("23");
  });
  it("agrupa Diesel numa fatia só", () => {
    const grafico = spec.charts.find((c) => c.id === "carbono-categoria")!;
    const diesel = grafico.data.find((d) => d.label === "Diesel");
    expect(diesel?.valor).toBe(20); // 12.000 + 8.000 kg = 20 t
  });
  it("soma a área agroecológica no KPI", () => {
    expect(String(spec.kpis.find((k) => k.label === "Área agroecológica")?.value)).toContain("160");
  });
});

describe("buildInteligenciaOverview — margem e alerta de preço", () => {
  const spec = buildInteligenciaOverview(
    {
      lucratividade: [
        rec("lucratividade", { cultura: "Cebola", receita: "100000", custo: "70000" }),
        rec("lucratividade", { cultura: "Alho", receita: "50000", custo: "60000" }),
      ],
      precos: [
        rec("precos", { produto: "Cebola", preco: "3.20", limite_alerta: "3.00" }),
        rec("precos", { produto: "Alho", preco: "2.00", limite_alerta: "3.00" }),
      ],
    },
    false,
  );

  it("calcula a margem (receita − custo)", () => {
    const margem = spec.kpis.find((k) => k.label === "Margem");
    expect(String(margem?.value)).toContain("20.000");
    expect(margem?.trendDir).toBe("up");
  });
  it("conta só os preços acima do limite cadastrado", () => {
    expect(spec.kpis.find((k) => k.label === "Preços acima do limite")?.value).toBe(1);
  });
  it("o gráfico de cultura traz receita e custo lado a lado", () => {
    const g = spec.charts.find((c) => c.id === "lucratividade-cultura")!;
    expect(g.series.map((s) => s.key)).toEqual(["receita", "custo"]);
    expect(g.data.find((d) => d.label === "Cebola")).toMatchObject({
      receita: 100000,
      custo: 70000,
    });
  });
});

describe("buildEquipeOverview e buildCogsOverview — agregações", () => {
  it("Equipe: soma faturamento e horas, conta tarefas abertas", () => {
    const spec = buildEquipeOverview(
      {
        vendas: [
          rec("vendas", { canal: "Ceasa", valor: "1000" }),
          rec("vendas", { canal: "Ceasa", valor: "500" }),
          rec("vendas", { canal: "Varejo", valor: "300" }),
        ],
        mao_de_obra: [rec("mao_de_obra", { colaborador: "Ana", horas: "8", mao_obra: "160" })],
        tarefas: [
          rec("tarefas", { status: "Concluída" }),
          rec("tarefas", { status: "Em andamento" }),
        ],
      },
      false,
    );
    expect(String(spec.kpis[0].value)).toContain("1.800");
    expect(spec.kpis.find((k) => k.label === "Tarefas abertas")?.value).toBe(1);
    const canais = spec.charts.find((c) => c.id === "vendas-canal")!;
    expect(canais.data).toEqual([
      { label: "Ceasa", valor: 1500 },
      { label: "Varejo", valor: 300 },
    ]);
  });

  it("COGS: custo unitário só aparece quando há volume", () => {
    const semVolume = buildCogsOverview(
      { etapas: [rec("etapas", { etapa: "Colheita", custo: "5000" })] },
      false,
    );
    expect(semVolume.kpis.find((k) => k.label === "Custo unitário")?.value).toBe("—");

    const comVolume = buildCogsOverview(
      { etapas: [rec("etapas", { etapa: "Colheita", custo: "5000", volume: "1000" })] },
      false,
    );
    expect(String(comVolume.kpis.find((k) => k.label === "Custo unitário")?.value)).toContain(
      "5,00",
    );
  });

  it("Logística: cobre as 12 abas e soma remessa e caixas vazias juntas", () => {
    const spec = buildLogisticaOverview(
      {
        remessa: [
          rec("remessa", { fazenda: "Sato", qtd_caixas: "881", peso_liquido: "19178" }),
          rec("remessa", { fazenda: "Nascente", qtd_caixas: "500", peso_liquido: "10000" }),
        ],
        "caixas-vazias": [
          rec("caixas-vazias", { fazenda: "Sato", tipo: "saida_campo", qtd: "936" }),
          rec("caixas-vazias", { fazenda: "Sato", tipo: "retorno_campo", qtd: "400" }),
        ],
        embalagens: [
          rec("embalagens", { item: "Caixa 20kg", saldo: "50", minimo: "100" }),
          rec("embalagens", { item: "Sacaria", saldo: "300", minimo: "100" }),
        ],
      },
      false,
    );
    expect(spec.tabs).toHaveLength(12);
    expect(String(spec.kpis.find((k) => k.label === "Caixas colhidas")?.value)).toContain("1.381");
    expect(String(spec.kpis.find((k) => k.label === "Caixas no campo")?.value)).toBe("536");
    expect(spec.kpis.find((k) => k.label === "Embalagens abaixo do mínimo")?.value).toBe(1);
  });

  it("COGS: a tabela de ineficiências vem do maior impacto para o menor", () => {
    const spec = buildCogsOverview(
      {
        ineficiencias: [
          rec("ineficiencias", {
            ponto: "Transporte",
            valor: "1000",
            causa: "Rota",
            acao: "Rever",
          }),
          rec("ineficiencias", {
            ponto: "Embalagem",
            valor: "9000",
            causa: "Perda",
            acao: "Trocar",
          }),
        ],
      },
      false,
    );
    expect(spec.tables?.[0].body[0][0]).toBe("Embalagem");
  });
});
