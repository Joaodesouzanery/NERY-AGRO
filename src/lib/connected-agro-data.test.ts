import { describe, expect, it } from "vitest";
import {
  buildCogsModel,
  buildControlTowerModel,
  num,
  type ConnectedAgroSnapshot,
} from "./connected-agro-data";

function snapshot(partial: Partial<ConnectedAgroSnapshot>): ConnectedAgroSnapshot {
  return {
    financial: [],
    operations: [],
    field: [],
    pecuariaCabecas: 0,
    costCenters: [],
    contracts: [],
    settings: { fazendaCoords: {} },
    ...partial,
  };
}

describe("num", () => {
  it("converte strings numéricas e vírgula decimal simples", () => {
    expect(num("148000")).toBe(148000);
    expect(num("2,68")).toBe(2.68);
    expect(num("-6.5")).toBe(-6.5);
    expect(num(42)).toBe(42);
  });

  it("retorna 0 para valores inválidos/ausentes", () => {
    expect(num(undefined)).toBe(0);
    expect(num(null)).toBe(0);
    expect(num("")).toBe(0);
    expect(num("abc")).toBe(0);
  });

  it("não lida com separador de milhar + decimal (vira 0)", () => {
    // `num` só troca a primeira vírgula; "1.234,56" -> "1.234.56" -> NaN -> 0.
    expect(num("1.234,56")).toBe(0);
  });
});

describe("buildCogsModel", () => {
  const base = snapshot({
    financial: [
      {
        id: "f1",
        module: "custos",
        payload: { produto: "Cesta", custo_total: "42000", quantidade: "1400", preco_venda: "58" },
      },
      { id: "f2", module: "fluxo", payload: { tipo: "entrada", valor: "148000" } },
      { id: "f3", module: "fluxo", payload: { tipo: "saida", valor: "62400" } },
    ],
    operations: [
      {
        id: "o1",
        area: "logistica",
        module: "fretes",
        payload: { custo: "3250", combustivel: "980", pedagio: "210" },
      },
      {
        id: "o2",
        area: "inteligencia",
        module: "perdas",
        payload: { valor_estimado: "4200" },
      },
      {
        id: "o3",
        area: "cogs",
        module: "etapas",
        payload: { etapa: "Embalagem", custo: "8200" },
      },
    ],
    field: [
      { id: "d1", module: "insumos", payload: { custo_hectare: "480" } },
      { id: "d2", module: "maquinario", payload: { custo_operacional: "7300" } },
    ],
  });

  it("soma cada etapa a partir das fontes conectadas", () => {
    const model = buildCogsModel(base);
    const value = (key: string) => model.stages.find((s) => s.key === key)?.value;
    expect(value("materia_prima")).toBe(42000);
    expect(value("insumos")).toBe(480);
    expect(value("maquinario")).toBe(7300);
    expect(value("embalagem")).toBe(8200);
    expect(value("perdas")).toBe(4200);
    expect(value("frete")).toBe(4440); // 3250 + 980 + 210
  });

  it("consolida total, receita e margem", () => {
    const model = buildCogsModel(base);
    expect(model.total).toBe(66620);
    expect(model.revenue).toBe(148000);
    expect(model.margin).toBe(81380);
    // a etapa "final" (custo total) é anexada ao fim da lista
    expect(model.stages.find((s) => s.key === "final")?.value).toBe(66620);
  });

  it("calcula custo unitário e margem por produto", () => {
    const model = buildCogsModel(base);
    expect(model.reports).toHaveLength(1);
    expect(model.reports[0].custo_unitario).toBe(30); // 42000 / 1400
    expect(model.reports[0].margem).toBe(28); // 58 - 30
  });

  it("gera alerta de aviso quando uma etapa passa de 30% do COGS", () => {
    const model = buildCogsModel(base);
    const warning = model.alerts.find((a) => a.id === "stage-materia_prima");
    expect(warning?.severity).toBe("warning"); // 42000/66620 ≈ 63%
  });

  it("gera alerta de perigo para produto com margem negativa", () => {
    const negative = buildCogsModel(
      snapshot({
        financial: [
          {
            id: "c1",
            module: "custos",
            payload: { produto: "X", custo_total: "100", quantidade: "1", preco_venda: "50" },
          },
        ],
      }),
    );
    expect(negative.alerts.some((a) => a.severity === "danger")).toBe(true);
  });

  it("retorna zeros para um snapshot vazio", () => {
    const empty = buildCogsModel(snapshot({}));
    expect(empty.total).toBe(0);
    expect(empty.revenue).toBe(0);
    expect(empty.alerts).toEqual([]);
  });
});

describe("buildControlTowerModel", () => {
  const base = snapshot({
    financial: [{ id: "f1", module: "fluxo", payload: { tipo: "entrada", valor: "148000" } }],
    operations: [
      {
        id: "c1",
        area: "logistica",
        module: "cargas",
        payload: { status: "Entregue", destino_lat: "-23.55", destino_lng: "-46.63" },
      },
      {
        id: "c2",
        area: "logistica",
        module: "cargas",
        payload: { status: "Atrasado", destino_lat: "-30.03", destino_lng: "-51.23" },
      },
      {
        id: "c3",
        area: "logistica",
        module: "cargas",
        payload: { status: "Em trânsito", destino_lat: "-25.43", destino_lng: "-49.27" },
      },
    ],
  });

  it("conta cargas por status e calcula OTIF", () => {
    const model = buildControlTowerModel(base);
    expect(model.mapMetrics.entregues).toBe(1);
    expect(model.mapMetrics.atrasadas).toBe(1);
    expect(model.mapMetrics.emTransito).toBe(1);
    expect(model.mapMetrics.totalCargas).toBe(3);
    expect(model.metrics.cargas).toBe(3);
    expect(model.metrics.otif).toBe(50); // entregues / (entregues + atrasadas) = 1/2
    expect(model.metrics.vendas).toBe(148000);
  });

  it("usa OTIF padrão (94) quando não há entregas nem atrasos", () => {
    const model = buildControlTowerModel(snapshot({}));
    expect(model.metrics.otif).toBe(94);
  });

  it("mostra a pegada de carbono no card do módulo", () => {
    const model = buildControlTowerModel(
      snapshot({
        operations: [
          {
            id: "cb1",
            area: "sustentabilidade",
            module: "carbono",
            payload: { escopo: "1", volume: "180", fator: "2.68" }, // 482.4 kg = 0,5 t
          },
        ],
      }),
    );
    const card = model.moduleCards.find((c) => c.label === "Emissão de Carbono");
    expect(card?.value).toContain("tCO₂e");
    expect(card?.value).toContain("0,5");
  });
});

describe("Financeiro V2 → COGS/Torre", () => {
  const centers = [
    {
      id: "cc1",
      nome: "Insumos T14",
      tipo: "insumos",
      safra: null,
      talhao_id: "T14",
      valor_autorizado: 100,
      valor_alocado: 100,
      valor_realizado: 130, // estouro
      vigencia_inicio: null,
      vigencia_fim: null,
      status: "ativo",
    },
  ];

  it("buildCogsModel expõe centerRollup + variances", () => {
    const model = buildCogsModel(snapshot({ costCenters: centers }));
    expect(model.variances[0]?.level).toBe("danger");
    expect(model.centerRollup.find((r) => r.stage === "insumos")?.realizado).toBe(130);
  });

  it("Torre gera alerta de orçamento estourado", () => {
    const model = buildControlTowerModel(snapshot({ costCenters: centers }));
    const alert = model.alerts.find((a) => a.source === "financeiro/centros-de-custo");
    expect(alert?.severity).toBe("danger");
  });
});

describe("buildCogsModel — etapa Pegada de carbono", () => {
  it("custo de carbono = tCO₂e × preço de referência (R$ 60/t)", () => {
    const model = buildCogsModel(
      snapshot({
        operations: [
          {
            id: "cb1",
            area: "sustentabilidade",
            module: "carbono",
            payload: { escopo: "1", co2e: "2000" }, // 2000 kg = 2 t → 2 × 60 = 120
          },
        ],
      }),
    );
    const stage = model.stages.find((s) => s.key === "carbono");
    expect(stage?.value).toBe(120);
    // e entra no total
    expect(model.total).toBe(120);
  });

  it("carbono zero quando não há apontamentos", () => {
    const model = buildCogsModel(snapshot({}));
    expect(model.stages.find((s) => s.key === "carbono")?.value).toBe(0);
  });
});
