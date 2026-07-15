import { describe, expect, it } from "vitest";
import type { CostCenter } from "@/lib/supabase-cost-centers";
import type { Contract } from "@/lib/supabase-contracts";
import {
  buildFieldMargin,
  contractLiquidado,
  contractsExpiringSoon,
  costCenterVariances,
  isRevenueContract,
  rollupByStage,
  stageForTipo,
} from "@/lib/cost-center-metrics";

function cc(patch: Partial<CostCenter>): CostCenter {
  return {
    id: patch.id ?? "c1",
    nome: patch.nome ?? "Centro",
    tipo: patch.tipo ?? "insumos",
    safra: null,
    talhao_id: patch.talhao_id ?? null,
    valor_autorizado: patch.valor_autorizado ?? 0,
    valor_alocado: patch.valor_alocado ?? 0,
    valor_realizado: patch.valor_realizado ?? 0,
    vigencia_inicio: null,
    vigencia_fim: null,
    status: "ativo",
  };
}

function ct(patch: Partial<Contract>): Contract {
  return {
    id: patch.id ?? "k1",
    contrato: patch.contrato ?? "CT",
    tipo: patch.tipo ?? "compra_insumo",
    contraparte: null,
    cost_center_id: patch.cost_center_id ?? null,
    talhao_id: patch.talhao_id ?? null,
    vigencia_inicio: null,
    vigencia_fim: patch.vigencia_fim ?? null,
    qtd_contratada: patch.qtd_contratada ?? 0,
    qtd_liquidada: patch.qtd_liquidada ?? 0,
    preco_unit: patch.preco_unit ?? 0,
    valor: patch.valor ?? 0,
    status: patch.status ?? "ativo",
  };
}

describe("stageForTipo", () => {
  it("mapeia tipo → etapa do COGS", () => {
    expect(stageForTipo("insumos")).toBe("insumos");
    expect(stageForTipo("Mão de obra")).toBe("mao_obra");
    expect(stageForTipo("maquinário")).toBe("maquinario");
    expect(stageForTipo("frete")).toBe("frete");
    expect(stageForTipo("qualquer")).toBe("materia_prima");
  });
});

describe("contratos", () => {
  it("liquidado = qtd × preço (ou valor × execução)", () => {
    expect(contractLiquidado(ct({ qtd_liquidada: 100, preco_unit: 2 }))).toBe(200);
    expect(contractLiquidado(ct({ qtd_contratada: 10, qtd_liquidada: 5, valor: 1000 }))).toBe(500);
  });
  it("classifica receita vs custo", () => {
    expect(isRevenueContract(ct({ tipo: "venda_graos" }))).toBe(true);
    expect(isRevenueContract(ct({ tipo: "csa" }))).toBe(true);
    expect(isRevenueContract(ct({ tipo: "compra_insumo" }))).toBe(false);
  });
});

describe("costCenterVariances", () => {
  it("ratio realizado/autorizado + nível, somando contratos vinculados", () => {
    const centers = [cc({ id: "a", valor_autorizado: 1000, valor_realizado: 800 })];
    const contracts = [ct({ cost_center_id: "a", qtd_liquidada: 100, preco_unit: 2 })]; // +200
    const [v] = costCenterVariances(centers, contracts);
    expect(v.realizado).toBe(1000);
    expect(v.ratio).toBe(1);
    expect(v.level).toBe("warning"); // >0.95, não >1
  });
  it("estouro → danger", () => {
    const [v] = costCenterVariances([cc({ valor_autorizado: 100, valor_realizado: 130 })]);
    expect(v.level).toBe("danger");
  });
});

describe("rollupByStage", () => {
  it("agrupa por etapa e por talhão", () => {
    const centers = [
      cc({ id: "a", tipo: "insumos", talhao_id: "T1", valor_realizado: 500 }),
      cc({ id: "b", tipo: "insumos", talhao_id: "T2", valor_realizado: 300 }),
      cc({ id: "c", tipo: "frete", talhao_id: "T1", valor_realizado: 200 }),
    ];
    const roll = rollupByStage(centers);
    const insumos = roll.find((r) => r.stage === "insumos");
    expect(insumos?.realizado).toBe(800);
    expect(insumos?.byTalhao).toEqual([
      { talhao_id: "T1", realizado: 500 },
      { talhao_id: "T2", realizado: 300 },
    ]);
    expect(roll.find((r) => r.stage === "frete")?.realizado).toBe(200);
  });
});

describe("contractsExpiringSoon", () => {
  const contracts = [
    ct({ id: "k1", vigencia_fim: "2026-07-25", status: "ativo" }), // dentro de 30d de 2026-07-15
    ct({ id: "k2", vigencia_fim: "2026-09-01", status: "ativo" }), // fora
    ct({ id: "k3", vigencia_fim: "2026-07-20", status: "encerrado" }), // ignorado
  ];
  it("só ativos vencendo na janela", () => {
    const soon = contractsExpiringSoon(contracts, "2026-07-15", 30);
    expect(soon.map((c) => c.id)).toEqual(["k1"]);
  });
});

describe("buildFieldMargin", () => {
  it("margem/ROI por talhão (custo centros + custo/receita contratos)", () => {
    const centers = [cc({ talhao_id: "T1", valor_realizado: 400 })];
    const contracts = [
      ct({ talhao_id: "T1", tipo: "venda_graos", qtd_liquidada: 100, preco_unit: 10 }), // receita 1000
      ct({ talhao_id: "T1", tipo: "frete", qtd_liquidada: 100, preco_unit: 1 }), // custo 100
    ];
    const [m] = buildFieldMargin(centers, contracts);
    expect(m.receita).toBe(1000);
    expect(m.custo).toBe(500); // 400 + 100
    expect(m.margem).toBe(500);
    expect(m.roi).toBe(1); // 500/500
  });
});
