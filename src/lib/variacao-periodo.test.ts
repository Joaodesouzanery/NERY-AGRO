import { describe, expect, it } from "vitest";
import { periodoTodo, type PeriodValue } from "@/components/period-picker";
import { formatoDelta, periodoAnterior, variacaoDePeriodo } from "@/lib/variacao-periodo";

function reg(id: string, data: string) {
  return { id, payload: { data }, created_at: `${data}T12:00:00.000Z` };
}

function periodo(start: string, end: string): PeriodValue {
  return { granularity: "custom", start, end, label: `${start}–${end}` };
}

describe("periodoAnterior", () => {
  it("devolve a janela imediatamente anterior com a MESMA duração", () => {
    // 10 dias → os 10 dias logo antes, colados.
    const ant = periodoAnterior(periodo("2026-08-05", "2026-08-14"));
    expect(ant?.start).toBe("2026-07-26");
    expect(ant?.end).toBe("2026-08-04");
  });

  it("atravessa a virada de mês e de ano sem quebrar", () => {
    const ant = periodoAnterior(periodo("2026-01-01", "2026-01-03"));
    expect(ant?.start).toBe("2025-12-29");
    expect(ant?.end).toBe("2025-12-31");
  });

  it("um dia só compara com o dia anterior", () => {
    const ant = periodoAnterior(periodo("2026-08-13", "2026-08-13"));
    expect(ant?.start).toBe("2026-08-12");
    expect(ant?.end).toBe("2026-08-12");
  });

  it("sem recorte não existe anterior", () => {
    // O que viria antes de "todo o período"? Nada — e o KPI fica sem pílula.
    expect(periodoAnterior(periodoTodo())).toBeNull();
  });
});

describe("variacaoDePeriodo", () => {
  const registros = [
    // atual: 3 registros
    reg("a1", "2026-08-10"),
    reg("a2", "2026-08-11"),
    reg("a3", "2026-08-12"),
    // anterior: 2 registros
    reg("b1", "2026-08-05"),
    reg("b2", "2026-08-06"),
  ];
  const atual = periodo("2026-08-08", "2026-08-12");

  it("calcula o delta a partir dos registros, não de números soltos", () => {
    const v = variacaoDePeriodo(registros, atual, (r) => r.length);
    expect(v.atual).toBe(3);
    expect(v.anterior).toBe(2);
    expect(v.deltaPct).toBeCloseTo(50);
  });

  it("delta negativo quando o período atual cai", () => {
    const menos = registros.filter((r) => r.id !== "a2" && r.id !== "a3");
    const v = variacaoDePeriodo(menos, atual, (r) => r.length);
    expect(v.deltaPct).toBeCloseTo(-50);
  });

  it("sem recorte de período: delta null, nunca 0%", () => {
    const v = variacaoDePeriodo(registros, periodoTodo(), (r) => r.length);
    expect(v.deltaPct).toBeNull();
    expect(v.anterior).toBeNull();
  });

  it("período anterior vazio: sem base de divisão, delta null", () => {
    // "0 → 3" não é "+∞%" nem "+300%": não houve medição anterior.
    const soAtual = registros.filter((r) => r.id.startsWith("a"));
    const v = variacaoDePeriodo(soAtual, atual, (r) => r.length);
    expect(v.anterior).toBe(0);
    expect(v.deltaPct).toBeNull();
  });

  it("funciona com extrator de soma, não só contagem", () => {
    const comValor = [
      { id: "x1", payload: { data: "2026-08-10", valor: "100" }, created_at: "" },
      { id: "x2", payload: { data: "2026-08-05", valor: "80" }, created_at: "" },
    ];
    const v = variacaoDePeriodo(comValor, atual, (r) =>
      r.reduce((s, x) => s + Number(x.payload.valor), 0),
    );
    expect(v.atual).toBe(100);
    expect(v.anterior).toBe(80);
    expect(v.deltaPct).toBeCloseTo(25);
  });

  it("registro sem payload.data cai no created_at — mesma regra da tela", () => {
    const semData = [
      { id: "c1", payload: {}, created_at: "2026-08-10T09:00:00.000Z" },
      { id: "c2", payload: {}, created_at: "2026-08-05T09:00:00.000Z" },
    ];
    const v = variacaoDePeriodo(semData, atual, (r) => r.length);
    expect(v.atual).toBe(1);
    expect(v.anterior).toBe(1);
  });
});

describe("formatoDelta", () => {
  it("formata em pt-BR com sinal explícito", () => {
    expect(formatoDelta(20.13)).toBe("+20,1%");
    expect(formatoDelta(-12.34)).toBe("-12,3%");
  });

  it("null fica null — o KPI decide não mostrar pílula", () => {
    expect(formatoDelta(null)).toBeNull();
  });
});
