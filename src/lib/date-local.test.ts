import { afterEach, describe, expect, it, vi } from "vitest";
import { localDateOf, localDaysAgo, localMonthStart, localToday } from "@/lib/date-local";

afterEach(() => vi.useRealTimers());

describe("localDateOf", () => {
  it("devolve o dia do FUSO DO DISPOSITIVO, não o de Londres", () => {
    // O bug que motivou este módulo: às 21h30 no Brasil (UTC−3) já é o dia
    // seguinte em UTC, e `toISOString().slice(0,10)` gravava amanhã. Uma sessão
    // de curral que virava a noite ficava com metade das pesagens no dia errado
    // — e o GMD (Δpeso ÷ Δdias) saía errado por causa disso.
    const noite = new Date(2026, 7, 4, 21, 30); // 4/ago 21h30 local
    expect(localDateOf(noite.toISOString())).toBe("2026-08-04");
    // Prova de que o caminho antigo erraria, se o ambiente estiver a oeste de
    // Greenwich (o caso do Brasil). Em UTC os dois coincidem e o teste é neutro.
    if (noite.getTimezoneOffset() > 0) {
      expect(noite.toISOString().slice(0, 10)).toBe("2026-08-05");
    }
  });

  it("meia-noite e um minuto ainda é o dia que começou", () => {
    expect(localDateOf(new Date(2026, 0, 1, 0, 1).toISOString())).toBe("2026-01-01");
  });

  it("mês e dia com um algarismo ganham zero à esquerda", () => {
    expect(localDateOf(new Date(2026, 2, 7, 12).toISOString())).toBe("2026-03-07");
  });

  it("entrada ausente ou inválida devolve string vazia, não 'Invalid Date'", () => {
    expect(localDateOf(undefined)).toBe("");
    expect(localDateOf("")).toBe("");
    expect(localDateOf("não é data")).toBe("");
  });
});

describe("localToday", () => {
  it("é o dia local do relógio atual", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 4, 22, 45));
    expect(localToday()).toBe("2026-08-04");
  });

  it("vira o dia à meia-noite local", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 5, 0, 0, 1));
    expect(localToday()).toBe("2026-08-05");
  });
});

describe("localDaysAgo / localMonthStart", () => {
  it("conta dias para trás atravessando o mês", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 2, 23, 30)); // 2/ago
    expect(localDaysAgo(0)).toBe("2026-08-02");
    expect(localDaysAgo(3)).toBe("2026-07-30");
  });

  it("atravessa o ano", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 2, 22));
    expect(localDaysAgo(5)).toBe("2025-12-28");
  });

  it("primeiro dia do mês corrente", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 31, 23, 59));
    expect(localMonthStart()).toBe("2026-08-01");
  });
});
