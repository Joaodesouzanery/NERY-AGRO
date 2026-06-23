import { describe, expect, it } from "vitest";
import { demoCalendarEvents, demoCalendarWorkspace } from "@/features/campo-calendar/data/mocks";
import {
  duplicateCalendarEvent,
  removeStatusGuard,
  reopenCalendarEvent,
  transitionCalendarEvent,
  validateCalendarEventContext,
  visualCalendarStatus,
} from "@/features/campo-calendar/domain/tasks";

describe("Calendar task rules", () => {
  const event = demoCalendarEvents[0];

  it("validates field, cycle and season relationships", () => {
    expect(() =>
      validateCalendarEventContext(
        {
          ...duplicateCalendarEvent(event),
          talhaoId: "talhao-demo-01",
          talhaoName: "Talhão 01",
          cycleId: "cycle-soja-2025",
          ciclo: "Soja Verão",
        },
        demoCalendarWorkspace.fields,
      ),
    ).toThrow("não pertence");
    expect(() =>
      validateCalendarEventContext(
        {
          ...duplicateCalendarEvent(event),
          talhaoId: "talhao-demo-03",
          cycleId: "cycle-soja-2025",
          seasonId: "2024/2025",
        },
        demoCalendarWorkspace.fields,
      ),
    ).toThrow("safra");
  });

  it("supports an empty responsible", () => {
    expect(
      validateCalendarEventContext(
        {
          ...duplicateCalendarEvent(event),
          responsibleId: undefined,
          responsibleName: undefined,
        },
        demoCalendarWorkspace.fields,
      ).responsibleName,
    ).toBeUndefined();
  });

  it("fills completion/cancellation timestamps and clears them when reopened", () => {
    const completed = transitionCalendarEvent(
      event,
      "Concluída",
      "completed",
      "2026-06-23T12:00:00Z",
    );
    expect(completed.completedAt).toBe("2026-06-23T12:00:00Z");
    const cancelled = transitionCalendarEvent(
      completed,
      "Cancelada",
      "cancelled",
      "2026-06-24T12:00:00Z",
    );
    expect(cancelled.cancelledAt).toBe("2026-06-24T12:00:00Z");
    expect(cancelled.completedAt).toBeUndefined();
    expect(reopenCalendarEvent(cancelled).completedAt).toBeUndefined();
    expect(reopenCalendarEvent(cancelled).cancelledAt).toBeUndefined();
  });

  it("shows overdue visually without mutating persisted status", () => {
    const persisted = { ...event, startsAt: "2026-01-01T12:00:00-03:00", status: "Pendente" };
    expect(visualCalendarStatus(persisted, "2026-06-23")).toBe("Atrasada");
    expect(persisted.status).toBe("Pendente");
  });

  it("duplicates as a new planned manual task", () => {
    expect(duplicateCalendarEvent(event)).toMatchObject({
      title: `${event.title} (cópia)`,
      statusId: "planned",
      status: "Planejada",
      source: "Manual",
    });
  });

  it("blocks removing a status in use without remapping", () => {
    expect(() => removeStatusGuard(event.statusId, [event])).toThrow("remapeamento");
    expect(removeStatusGuard(event.statusId, [event], "pending")).toEqual({
      inUse: true,
      remapStatusId: "pending",
    });
  });
});
