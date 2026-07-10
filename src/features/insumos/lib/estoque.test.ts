import { describe, expect, it } from "vitest";
import {
  buildInsumoResumo,
  buildInsumosModel,
  buildTalhaoInsumosResumo,
  custoMovimentacao,
  diasParaVencer,
  saldoFisicoLote,
} from "@/features/insumos/lib/estoque";
import type { InsumoRecord, LoteRecord, MovimentacaoRecord } from "@/features/insumos/types/domain";

const HOJE = "2026-07-10";

function insumo(id: string, payload: Partial<InsumoRecord["payload"]> = {}): InsumoRecord {
  return { id, module: "insumo-catalogo", payload: { nome: `Insumo ${id}`, ...payload } };
}

function lote(
  id: string,
  insumoId: string,
  payload: Partial<LoteRecord["payload"]> = {},
): LoteRecord {
  return { id, module: "insumo-lote", payload: { insumo_id: insumoId, ...payload } };
}

function mov(
  id: string,
  payload: Record<string, string> & { tipo: string; insumo_id: string },
): MovimentacaoRecord {
  return { id, module: "insumo-movimentacao", payload };
}

describe("saldoFisicoLote", () => {
  const base = lote("l1", "i1", { quantidade_inicial: "100" });

  it("soma entradas e subtrai saídas, perdas e devoluções", () => {
    const movimentacoes = [
      mov("m1", { tipo: "entrada", insumo_id: "i1", lote_id: "l1", quantidade: "50" }),
      mov("m2", { tipo: "saida", insumo_id: "i1", lote_id: "l1", quantidade: "30" }),
      mov("m3", { tipo: "perda", insumo_id: "i1", lote_id: "l1", quantidade: "10" }),
      mov("m4", { tipo: "devolucao", insumo_id: "i1", lote_id: "l1", quantidade: "5" }),
    ];
    expect(saldoFisicoLote(base, movimentacoes)).toBe(105);
  });

  it("aplica ajuste com sinal e ignora reserva e transferência no físico", () => {
    const movimentacoes = [
      mov("m1", { tipo: "ajuste", insumo_id: "i1", lote_id: "l1", quantidade: "-12" }),
      mov("m2", { tipo: "reserva", insumo_id: "i1", lote_id: "l1", quantidade: "40" }),
      mov("m3", { tipo: "transferencia", insumo_id: "i1", lote_id: "l1", quantidade: "20" }),
    ];
    expect(saldoFisicoLote(base, movimentacoes)).toBe(88);
  });

  it("ignora movimentações de outros lotes", () => {
    expect(
      saldoFisicoLote(base, [
        mov("m1", { tipo: "saida", insumo_id: "i1", lote_id: "outro", quantidade: "30" }),
      ]),
    ).toBe(100);
  });
});

describe("buildInsumoResumo", () => {
  it("calcula reservado (com e sem lote) e disponível", () => {
    const item = insumo("i1", { estoque_minimo: "50" });
    const lotes = [lote("l1", "i1", { quantidade_inicial: "80", custo_unitario: "10" })];
    const movimentacoes = [
      mov("m1", { tipo: "reserva", insumo_id: "i1", lote_id: "l1", quantidade: "20" }),
      mov("m2", { tipo: "reserva", insumo_id: "i1", quantidade: "15" }),
      mov("m3", { tipo: "reserva", insumo_id: "i1", quantidade: "99", status: "cancelada" }),
    ];
    const resumo = buildInsumoResumo(item, lotes, movimentacoes, HOJE);
    expect(resumo.saldoFisico).toBe(80);
    expect(resumo.reservado).toBe(35);
    expect(resumo.disponivel).toBe(45);
    expect(resumo.valorEmEstoque).toBe(800);
    expect(resumo.abaixoDoMinimo).toBe(true);
  });

  it("reserva executada deixa de contar no reservado", () => {
    const resumo = buildInsumoResumo(
      insumo("i1"),
      [lote("l1", "i1", { quantidade_inicial: "80" })],
      [
        mov("m1", {
          tipo: "reserva",
          insumo_id: "i1",
          lote_id: "l1",
          quantidade: "20",
          status: "executada",
        }),
      ],
      HOJE,
    );
    expect(resumo.reservado).toBe(0);
    expect(resumo.disponivel).toBe(80);
  });
});

describe("diasParaVencer e alertas", () => {
  it("calcula dias até a validade", () => {
    expect(diasParaVencer("2026-07-20", HOJE)).toBe(10);
    expect(diasParaVencer("2026-07-01", HOJE)).toBe(-9);
    expect(diasParaVencer(undefined, HOJE)).toBeUndefined();
  });

  it("gera alertas de vencido, validade crítica, mínimo e reserva sem saldo", () => {
    const insumos = [
      insumo("i1", { nome: "Glifosato", estoque_minimo: "500" }),
      insumo("i2", { nome: "Adubo" }),
    ];
    const lotes = [
      lote("l1", "i1", { quantidade_inicial: "100", validade: "2026-06-30", numero: "A1" }),
      lote("l2", "i1", { quantidade_inicial: "50", validade: "2026-07-25", numero: "A2" }),
      lote("l3", "i2", { quantidade_inicial: "10" }),
    ];
    const movimentacoes = [
      mov("m1", { tipo: "reserva", insumo_id: "i2", lote_id: "l3", quantidade: "30" }),
    ];
    const model = buildInsumosModel(insumos, lotes, movimentacoes, HOJE);
    const ids = model.alertas.map((alerta) => alerta.id);
    expect(ids).toContain("vencido-l1");
    expect(ids).toContain("vencendo-l2");
    expect(ids).toContain("minimo-i1");
    expect(ids).toContain("sem-saldo-i2");
    expect(model.lotesVencidos).toBe(1);
    expect(model.lotesAVencer).toBe(1);
    // críticos primeiro
    expect(model.alertas[0].severidade).toBe("critico");
  });

  it("não alerta vencimento de lote sem saldo", () => {
    const model = buildInsumosModel(
      [insumo("i1")],
      [lote("l1", "i1", { quantidade_inicial: "0", validade: "2026-01-01" })],
      [],
      HOJE,
    );
    expect(model.alertas).toHaveLength(0);
    expect(model.lotesVencidos).toBe(0);
  });
});

describe("custos", () => {
  const lotes = [lote("l1", "i1", { quantidade_inicial: "100", custo_unitario: "25" })];

  it("usa custo_total informado quando existe", () => {
    const item = mov("m1", {
      tipo: "saida",
      insumo_id: "i1",
      lote_id: "l1",
      quantidade: "10",
      custo_total: "300",
    });
    expect(custoMovimentacao(item, lotes)).toBe(300);
  });

  it("deriva do custo unitário do lote quando não informado", () => {
    const item = mov("m1", { tipo: "saida", insumo_id: "i1", lote_id: "l1", quantidade: "10" });
    expect(custoMovimentacao(item, lotes)).toBe(250);
  });

  it("usa custo médio do insumo quando a movimentação não tem lote", () => {
    const item = mov("m1", { tipo: "reserva", insumo_id: "i1", quantidade: "4" });
    expect(custoMovimentacao(item, lotes, 30)).toBe(120);
  });
});

describe("buildTalhaoInsumosResumo", () => {
  it("separa previsto (reservas) de realizado (saídas) por talhão e safra", () => {
    const insumos = [insumo("i1", { categoria: "Defensivos" })];
    const lotes = [lote("l1", "i1", { quantidade_inicial: "1000", custo_unitario: "2" })];
    const movimentacoes = [
      mov("m1", {
        tipo: "saida",
        insumo_id: "i1",
        lote_id: "l1",
        quantidade: "100",
        talhao_id: "t3",
        safra: "2025/2026",
      }),
      mov("m2", {
        tipo: "reserva",
        insumo_id: "i1",
        lote_id: "l1",
        quantidade: "50",
        talhao_id: "t3",
        safra: "2025/2026",
      }),
      mov("m3", {
        tipo: "saida",
        insumo_id: "i1",
        lote_id: "l1",
        quantidade: "999",
        talhao_id: "outro",
        safra: "2025/2026",
      }),
      mov("m4", {
        tipo: "saida",
        insumo_id: "i1",
        lote_id: "l1",
        quantidade: "70",
        talhao: "Talhão 03",
        safra: "2024/2025",
      }),
    ];
    const model = buildInsumosModel(insumos, lotes, movimentacoes, HOJE);
    const resumo = buildTalhaoInsumosResumo(
      model,
      lotes,
      { id: "t3", nome: "Talhão 03" },
      "2025/2026",
    );
    expect(resumo.aplicacoes).toHaveLength(1);
    expect(resumo.reservas).toHaveLength(1);
    expect(resumo.custoRealizado).toBe(200);
    expect(resumo.custoPrevisto).toBe(100);
    expect(resumo.custoPorCategoria).toEqual([{ label: "Defensivos", value: 200 }]);
  });
});
