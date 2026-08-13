import { describe, expect, it } from "vitest";
import { calendarSearchSchema } from "@/features/campo-calendar/schemas/navigation";

describe("Calendário — search params", () => {
  it("aplica defaults quando a URL está vazia", () => {
    expect(calendarSearchSchema.parse({})).toMatchObject({ tab: "geral", view: "mes" });
  });

  it("cai no default em valores inválidos sem quebrar a rota", () => {
    const parsed = calendarSearchSchema.parse({
      tab: "inexistente",
      view: "anual",
      date: "10/07/2026",
      fieldId: "",
    });
    expect(parsed.tab).toBe("geral");
    expect(parsed.view).toBe("mes");
    expect(parsed.date).toBeUndefined();
    expect(parsed.fieldId).toBeUndefined();
  });

  it("redireciona subabas legadas para as consolidadas", () => {
    expect(calendarSearchSchema.parse({ tab: "linha-tempo" })).toMatchObject({
      tab: "calendario",
      view: "gantt",
    });
    expect(calendarSearchSchema.parse({ tab: "decisoes" }).tab).toBe("geral");
  });

  it("preserva filtros globais válidos (refresh/link compartilhável)", () => {
    const parsed = calendarSearchSchema.parse({
      tab: "tarefas",
      view: "agenda",
      date: "2026-07-10",
      fieldId: "talhao-demo-03",
      seasonId: "2025/2026",
      cycleId: "cycle-soja-2025",
      status: "pendente",
      responsible: "João Silva",
      eventType: "compra",
      priority: "critica",
    });
    expect(parsed).toMatchObject({
      tab: "tarefas",
      view: "agenda",
      date: "2026-07-10",
      fieldId: "talhao-demo-03",
      cycleId: "cycle-soja-2025",
      priority: "critica",
    });
  });
});
