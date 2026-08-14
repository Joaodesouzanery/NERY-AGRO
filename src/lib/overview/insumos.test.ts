import { describe, expect, it } from "vitest";
import { buildInsumosModel } from "@/features/insumos/lib/estoque";
import type { InsumoRecord, LoteRecord, MovimentacaoRecord } from "@/features/insumos/types/domain";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import { buildInsumosOverview } from "@/lib/overview/insumos";

// Insumos não tem abas — tem painéis. O contrato é o mesmo: toda seção
// declarada em `tabs` precisa de KPI/gráfico/tabela, o builder tem de aguentar
// módulo vazio (a página monta o spec antes da consulta voltar) e os números
// têm de bater com o que estoque.ts já calcula.

const HOJE = "2026-07-10";

function insumo(id: string, payload: Partial<InsumoRecord["payload"]> = {}): InsumoRecord {
  return { id, module: "insumo-catalogo", payload: { nome: `Insumo ${id}`, ...payload } };
}

function lote(id: string, insumoId: string, payload: Partial<LoteRecord["payload"]> = {}) {
  return { id, module: "insumo-lote", payload: { insumo_id: insumoId, ...payload } } as LoteRecord;
}

function mov(
  id: string,
  payload: Record<string, string> & { tipo: string; insumo_id: string },
): MovimentacaoRecord {
  return { id, module: "insumo-movimentacao", payload };
}

// Fazenda de teste: 2 insumos, 3 lotes (um vencido, um vencendo, um sem
// validade) e 4 movimentações (saída, reserva, perda e saída só com nome de
// talhão). Todos os números esperados abaixo saem daqui na mão.
const INSUMOS = [
  insumo("i1", {
    nome: "Glifosato 480 SL",
    categoria: "Defensivos",
    unidade: "L",
    estoque_minimo: "500",
  }),
  insumo("i2", {
    nome: "Cloreto de Potássio 60%",
    categoria: "Fertilizantes",
    unidade: "t",
    estoque_minimo: "10",
  }),
];

const LOTES = [
  lote("l1", "i1", {
    numero: "GLI-2024-31",
    quantidade_inicial: "120",
    custo_unitario: "25",
    validade: "2026-06-30", // vencido há 10 dias
    local: "Depósito de defensivos",
  }),
  lote("l2", "i1", {
    numero: "GLI-2025-07",
    quantidade_inicial: "400",
    custo_unitario: "20",
    validade: "2026-07-25", // vence em 15 dias
    local: "Depósito de defensivos",
  }),
  lote("l3", "i2", {
    numero: "KCL-2025-08",
    quantidade_inicial: "20",
    custo_unitario: "2000",
    local: "Galpão da fazenda",
  }),
];

const MOVS = [
  mov("m1", {
    tipo: "saida",
    insumo_id: "i1",
    lote_id: "l2",
    quantidade: "100",
    data: "2026-05-12",
    talhao_id: "t3",
    talhao: "Talhão 03",
    operacao: "Pulverização",
  }),
  mov("m2", {
    tipo: "reserva",
    insumo_id: "i1",
    lote_id: "l2",
    quantidade: "50",
    status: "ativa",
    data: "2026-07-20",
    talhao_id: "t3",
    talhao: "Talhão 03",
    operacao: "Pulverização",
  }),
  mov("m3", {
    tipo: "perda",
    insumo_id: "i2",
    lote_id: "l3",
    quantidade: "2",
    data: "2026-06-01",
  }),
  mov("m4", {
    tipo: "saida",
    insumo_id: "i2",
    lote_id: "l3",
    quantidade: "3",
    data: "2026-06-20",
    talhao: "Talhão 05", // só nome, sem talhao_id
    operacao: "Adubação",
  }),
];

const model = buildInsumosModel(INSUMOS, LOTES, MOVS, HOJE);
const spec = buildInsumosOverview(model, LOTES, false);

const kpi = (label: string) => spec.kpis.find((k) => k.label === label);
const chart = (id: string) => spec.charts.find((c) => c.id === id);

describe("buildInsumosOverview — cobertura e resiliência", () => {
  it("toda seção do módulo tem KPI, gráfico ou tabela", () => {
    expect(coverageReport(spec)).toBe("");
    expect(overviewCoverage(spec).missing).toEqual([]);
  });

  it("nenhum gráfico aponta para seção inexistente", () => {
    expect(overviewCoverage(spec).orphan).toEqual([]);
  });

  it("sobrevive ao módulo sem nenhum registro", () => {
    const vazio = buildInsumosOverview(buildInsumosModel([], [], [], HOJE), [], false);
    expect(overviewCoverage(vazio).missing).toEqual([]);
    expect(vazio.kpis.length).toBeGreaterThan(0);
    expect(vazio.charts.every((c) => Array.isArray(c.data))).toBe(true);
    expect(vazio.charts.every((c) => c.data.length === 0)).toBe(true);
    expect(vazio.tables).toBeUndefined();
  });

  it("sobrevive ao model ainda não carregado (consulta em voo)", () => {
    const semModel = buildInsumosOverview(null, [], false);
    expect(overviewCoverage(semModel).missing).toEqual([]);
    expect(String(kpiDe(semModel, "Capital concentrado")?.value)).toBe("—");
  });

  it("carrega o modo para o carimbo do export", () => {
    expect(buildInsumosOverview(model, LOTES, true).demoMode).toBe(true);
    expect(spec.demoMode).toBe(false);
  });
});

describe("buildInsumosOverview — números reais", () => {
  it("KPIs reusam o model: valor, reservado, vencido, aplicado e perdas", () => {
    // 3 lotes: 120×25 + 300×20 + 15×2000 = 3.000 + 6.000 + 30.000
    expect(String(kpi("Valor em estoque")?.value)).toContain("39.000");
    // reserva ativa de 50 L no lote de R$ 20
    expect(String(kpi("Reservado")?.value)).toContain("1.000");
    expect(kpi("Reservado")?.hint).toBe("1 reservas ativas");
    // só o Glifosato tem disponível (370 L) abaixo do mínimo (500 L)
    expect(kpi("Abaixo do mínimo")?.value).toBe(1);
    // lote vencido com saldo: 120 × R$ 25
    expect(String(kpi("Valor vencido")?.value)).toContain("3.000");
    expect(kpi("Lotes a vencer")?.value).toBe(1);
    // saídas: 100×20 + 3×2000 = 2.000 + 6.000
    expect(String(kpi("Custo aplicado")?.value)).toContain("8.000");
    // perda: 2 t × R$ 2.000
    expect(String(kpi("Perdas registradas")?.value)).toContain("4.000");
    // 1 crítico (lote vencido) + 2 de atenção (validade e mínimo)
    expect(kpi("Alertas críticos")?.value).toBe(1);
    expect(kpi("Alertas críticos")?.hint).toBe("3 alertas no total");
    expect(kpi("Capital concentrado")?.value).toBe("Fertilizantes");
  });

  it("distribui o capital pelas faixas de validade", () => {
    expect(chart("insumos-validade")?.data).toEqual([
      { label: "Vencido", valor: 3000 },
      { label: "≤ 30 dias", valor: 6000 },
      { label: "Sem validade", valor: 30000 },
    ]);
  });

  it("separa previsto de realizado por talhão, com e sem talhao_id", () => {
    expect(chart("insumos-talhao-custo")?.data).toEqual([
      { label: "Talhão 05", previsto: 0, realizado: 6000 },
      { label: "Talhão 03", previsto: 1000, realizado: 2000 },
    ]);
  });

  it("mede a cobertura do mínimo em % (unidades diferentes não se somam)", () => {
    expect(chart("insumos-cobertura-minimo")?.data).toEqual([
      { label: "Glifosato 480 SL", valor: 74 }, // 370 L / 500 L
      { label: "Cloreto de Potássio 60%", valor: 150 }, // 15 t / 10 t
    ]);
  });

  it("agrupa capital por categoria e por local de armazenamento", () => {
    expect(chart("insumos-valor-categoria")?.data).toEqual([
      { label: "Fertilizantes", total: 30000 },
      { label: "Defensivos", total: 9000 },
    ]);
    expect(chart("insumos-valor-local")?.data).toEqual([
      { label: "Galpão da fazenda", valor: 30000 },
      { label: "Depósito de defensivos", valor: 9000 },
    ]);
  });

  it("monta o consumo mensal a partir das saídas", () => {
    expect(chart("insumos-consumo-mes")?.data).toEqual([
      { label: "05/2026", valor: 2000 },
      { label: "06/2026", valor: 6000 },
    ]);
  });

  it("rotula os tipos de movimentação em pt-BR", () => {
    const tipos = chart("insumos-mov-tipo")?.data.map((d) => d.label);
    expect(tipos).toContain("Saída por atividade");
    expect(tipos).toContain("Perda/avaria/vencimento");
  });

  it("tabela de ruptura diz quanto comprar; tabela de vencidos, quanto descartar", () => {
    const ruptura = spec.tables?.find((t) => t.id === "insumos-ruptura");
    expect(ruptura?.body[0].slice(0, 4)).toEqual([
      "Glifosato 480 SL",
      "370 L",
      "500 L",
      "130 L", // 500 − 370
    ]);
    const vencidos = spec.tables?.find((t) => t.id === "insumos-vencidos");
    expect(vencidos?.body[0][0]).toBe("GLI-2024-31");
    expect(vencidos?.body[0][1]).toBe("30/06/2026");
    expect(String(vencidos?.body[0][3])).toContain("3.000");
  });
});

describe("buildInsumosOverview — talhão sem id não conta duas vezes", () => {
  it("saída só com o nome do talhão entra no grupo que já tem id", () => {
    // m5 repete o nome "Talhão 03" sem talhao_id: belongsToTalhao casa pelo
    // nome, então não pode existir um segundo grupo para o mesmo talhão.
    const movs = [
      ...MOVS,
      mov("m5", {
        tipo: "saida",
        insumo_id: "i1",
        lote_id: "l2",
        quantidade: "10",
        data: "2026-06-25",
        talhao: "Talhão 03",
      }),
    ];
    const comRepetido = buildInsumosOverview(
      buildInsumosModel(INSUMOS, LOTES, movs, HOJE),
      LOTES,
      false,
    );
    const dados = comRepetido.charts.find((c) => c.id === "insumos-talhao-custo")?.data ?? [];
    expect(dados.filter((d) => d.label === "Talhão 03")).toHaveLength(1);
    // 100 L + 10 L a R$ 20 = R$ 2.200 aplicados no Talhão 03
    expect(dados.find((d) => d.label === "Talhão 03")).toEqual({
      label: "Talhão 03",
      previsto: 1000,
      realizado: 2200,
    });
  });

  it("movimentação com id e sem nome não faz o grupo perder as saídas só com nome", () => {
    // m6 é a mais recente e tem talhao_id sem `talhao`. O grupo do id precisa
    // adotar o nome que as outras movimentações do MESMO id trazem — senão m7
    // (só nome) não casaria com ninguém e sumiria do gráfico.
    const movs = [
      ...MOVS,
      mov("m6", {
        tipo: "saida",
        insumo_id: "i1",
        lote_id: "l2",
        quantidade: "5",
        data: "2026-07-28",
        talhao_id: "t3",
        talhao: "",
      }),
      mov("m7", {
        tipo: "saida",
        insumo_id: "i1",
        lote_id: "l2",
        quantidade: "10",
        data: "2026-06-25",
        talhao: "Talhão 03",
      }),
    ];
    const spec = buildInsumosOverview(buildInsumosModel(INSUMOS, LOTES, movs, HOJE), LOTES, false);
    const dados = spec.charts.find((c) => c.id === "insumos-talhao-custo")?.data ?? [];
    expect(dados.filter((d) => d.label === "Talhão 03")).toHaveLength(1);
    // 100 + 5 + 10 = 115 L a R$ 20 → R$ 2.300 aplicados, nada perdido pelo caminho.
    expect(dados.find((d) => d.label === "Talhão 03")).toEqual({
      label: "Talhão 03",
      previsto: 1000,
      realizado: 2300,
    });
  });
});

function kpiDe(spec: ReturnType<typeof buildInsumosOverview>, label: string) {
  return spec.kpis.find((k) => k.label === label);
}
