import { describe, it, expect } from "vitest";
import {
  GESTACAO_DIAS,
  dgPendente,
  iepMedioDias,
  nascimentosPorMes,
  previsoesParto,
  taxaPrenhez,
  type EventoRepro,
} from "./reproducao";

const ev = (
  animal_id: string | null,
  tipo: string,
  data: string,
  resultado: string | null = null,
): EventoRepro => ({ animal_id, tipo, data, resultado });

describe("taxa de prenhez", () => {
  it("positivos ÷ total de DG", () => {
    const eventos = [
      ev("a", "dg", "2026-03-01", "Positivo"),
      ev("b", "dg", "2026-03-01", "negativo"),
      ev("c", "dg", "2026-03-01", "POSITIVO"),
    ];
    expect(taxaPrenhez(eventos)).toBeCloseTo(2 / 3, 5);
  });

  it("sem DG → null (não zero)", () => {
    expect(taxaPrenhez([ev("a", "iatf", "2026-01-01")])).toBeNull();
  });
});

describe("DG pendente", () => {
  it("cobertura sem DG posterior fica pendente", () => {
    const eventos = [ev("a", "iatf", "2026-01-10"), ev("b", "monta", "2026-01-12")];
    expect(dgPendente(eventos).sort()).toEqual(["a", "b"]);
  });

  it("cobertura com DG depois não é pendente", () => {
    const eventos = [ev("a", "iatf", "2026-01-10"), ev("a", "dg", "2026-02-20", "positivo")];
    expect(dgPendente(eventos)).toEqual([]);
  });

  it("nova cobertura após o DG antigo volta a pendurar o DG", () => {
    const eventos = [
      ev("a", "iatf", "2026-01-10"),
      ev("a", "dg", "2026-02-20", "negativo"),
      ev("a", "iatf", "2026-03-01"),
    ];
    expect(dgPendente(eventos)).toEqual(["a"]);
  });
});

describe("previsão de parto", () => {
  it("cobertura + 285 dias", () => {
    const eventos = [ev("a", "iatf", "2026-01-01"), ev("a", "dg", "2026-02-10", "positivo")];
    const p = previsoesParto(eventos);
    expect(p).toHaveLength(1);
    // 2026-01-01 + 285 dias = 2026-10-13
    expect(p[0].previsto).toBe("2026-10-13");
  });

  it("DG negativo não gera previsão", () => {
    expect(previsoesParto([ev("a", "dg", "2026-02-10", "negativo")])).toEqual([]);
  });

  it("animal que já pariu depois do DG some da previsão", () => {
    const eventos = [
      ev("a", "iatf", "2026-01-01"),
      ev("a", "dg", "2026-02-10", "positivo"),
      ev("a", "parto", "2026-10-15"),
    ];
    expect(previsoesParto(eventos)).toEqual([]);
  });

  it("gestação bovina é de 285 dias", () => {
    expect(GESTACAO_DIAS).toBe(285);
  });
});

describe("IEP", () => {
  it("média dos intervalos entre partos consecutivos", () => {
    const eventos = [
      ev("a", "parto", "2025-01-01"),
      ev("a", "parto", "2026-01-01"), // 365 d
      ev("b", "parto", "2025-01-01"),
      ev("b", "parto", "2025-12-27"), // 360 d
    ];
    expect(iepMedioDias(eventos)).toBeCloseTo(362.5, 1);
  });

  it("um parto só não gera IEP", () => {
    expect(iepMedioDias([ev("a", "parto", "2026-01-01")])).toBeNull();
  });
});

describe("curva de nascimentos", () => {
  it("agrupa previsões por mês, em ordem", () => {
    const curva = nascimentosPorMes([
      { animal_id: "a", previsto: "2026-10-13" },
      { animal_id: "b", previsto: "2026-10-20" },
      { animal_id: "c", previsto: "2026-09-01" },
    ]);
    expect(curva).toEqual([
      { mes: "2026-09", total: 1 },
      { mes: "2026-10", total: 2 },
    ]);
  });
});
