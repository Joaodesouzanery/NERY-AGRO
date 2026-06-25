import { describe, expect, it } from "vitest";
import { buildCalendarOverview } from "@/features/campo-calendar/domain/overview";
import {
  demoCalendarEvents,
  demoCalendarWorkspace,
} from "@/features/campo-calendar/data/mocks";

describe("Calendar overview KPIs", () => {
  it("calculates operational KPIs for the reference date", () => {
    const model = buildCalendarOverview(
      demoCalendarEvents,
      demoCalendarWorkspace.fields,
      "2026-06-23",
    );
    expect(model.today.map((event) => event.title)).toContain("Comprar sementes de cobertura");
    expect(model.overdue.map((event) => event.title)).toContain("Cotar defensivo biológico");
    expect(model.next7.length).toBeGreaterThanOrEqual(4);
    expect(model.decisions.map((event) => event.title)).toContain("Definir início da colheita");
    expect(model.purchases).toHaveLength(3);
    expect(model.scheduledArea).toBe(132.4);
    expect(model.nextHarvest?.title).toBe("Colheita prevista do Talhão 03");
    expect(model.cost7).toBe(92500);
    expect(model.criticalAlerts.length).toBeGreaterThanOrEqual(2);
  });

  it("reports zero cost when the filtered events have no estimates", () => {
    const model = buildCalendarOverview(
      demoCalendarEvents.filter((event) => event.estimatedCost === undefined),
      demoCalendarWorkspace.fields,
      "2026-06-23",
    );
    expect(model.cost7).toBe(0);
  });
});
