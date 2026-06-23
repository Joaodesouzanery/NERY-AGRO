import { describe, expect, it } from "vitest";
import { calendarSearchSchema } from "@/features/campo-calendar/schemas/navigation";

describe("Campo Calendar navigation", () => {
  it("applies stable defaults to an empty search", () => {
    const search = calendarSearchSchema.parse({});
    expect(search.tab).toBe("overview");
    expect(search.view).toBe("month");
    expect(search.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("preserves valid shareable filters", () => {
    expect(
      calendarSearchSchema.parse({
        tab: "tasks",
        view: "agenda",
        date: "2026-02-10",
        fieldId: "talhao-demo-03",
        seasonId: "2025/2026",
        cycleId: "cycle-soja-2025",
        status: "Planejada",
        responsible: "João Silva",
        eventType: "Plantio",
        priority: "Alta",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
      }),
    ).toMatchObject({
      tab: "tasks",
      view: "agenda",
      date: "2026-02-10",
      fieldId: "talhao-demo-03",
      seasonId: "2025/2026",
      cycleId: "cycle-soja-2025",
      status: "Planejada",
      responsible: "João Silva",
      eventType: "Plantio",
      priority: "Alta",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
  });

  it("accepts the weekly calendar view", () => {
    const search = calendarSearchSchema.parse({
      tab: "calendar",
      view: "week",
      date: "2026-06-23",
    });
    expect(search.view).toBe("week");
    expect(search.date).toBe("2026-06-23");
  });

  it("recovers from invalid enum values and blank optional filters", () => {
    const search = calendarSearchSchema.parse({
      tab: "unknown",
      view: "board",
      date: "not-a-date",
      status: "unknown",
      priority: "urgent",
      responsible: " ",
      dateFrom: "invalid",
    });
    expect(search.tab).toBe("overview");
    expect(search.view).toBe("month");
    expect(search.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(search.status).toBe("unknown");
    expect(search.priority).toBeUndefined();
    expect(search.responsible).toBeUndefined();
    expect(search.dateFrom).toBeUndefined();
  });
});
