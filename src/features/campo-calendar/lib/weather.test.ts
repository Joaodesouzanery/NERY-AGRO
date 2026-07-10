import { describe, expect, it } from "vitest";
import { mockForecast } from "@/features/campo-calendar/lib/weather";

describe("Calendário — provider climático mock", () => {
  it("é determinístico para a mesma data (semente estável)", () => {
    const now = new Date(2026, 6, 10);
    const first = mockForecast(now, 7);
    const second = mockForecast(now, 7);
    expect(first).toEqual(second);
    expect(first).toHaveLength(7);
    expect(first[0].date).toBe("2026-07-10");
  });

  it("gera valores dentro de faixas plausíveis", () => {
    for (const day of mockForecast(new Date(2026, 0, 1), 30)) {
      expect(day.rainChancePct).toBeGreaterThanOrEqual(0);
      expect(day.rainChancePct).toBeLessThan(100);
      expect(day.tempMaxC).toBeGreaterThan(day.tempMinC);
      expect(day.windKmh).toBeGreaterThanOrEqual(0);
    }
  });
});
