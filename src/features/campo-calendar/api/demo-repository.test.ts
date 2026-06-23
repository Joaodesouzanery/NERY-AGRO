import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDemoCalendarEvent,
  deleteDemoCalendarEvent,
  listDemoCalendarEvents,
  listDemoCalendarStatuses,
  resetDemoCalendarEvents,
  saveDemoCalendarStatus,
  updateDemoCalendarEvent,
  type CalendarDemoStorage,
} from "@/features/campo-calendar/api/demo-repository";
import { demoCalendarEvents } from "@/features/campo-calendar/data/mocks";

function memoryStorage(): CalendarDemoStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("Campo Calendar demo persistence", () => {
  let storage: CalendarDemoStorage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("starts from the isolated Santa Helena seed", () => {
    const events = listDemoCalendarEvents(storage);
    expect(events).toHaveLength(demoCalendarEvents.length);
    expect(new Set(events.map((event) => event.talhaoName))).toEqual(
      new Set(["Talhão 01", "Talhão 02", "Talhão 03", "Talhão 04"]),
    );
    expect(events.map((event) => event.ciclo)).toEqual(
      expect.arrayContaining(["Soja Verão", "Milho Safrinha", "Cobertura/Pousio"]),
    );
  });

  it("creates, updates, deletes and resets without Supabase", () => {
    const created = createDemoCalendarEvent(
      {
        farmKey: "fazenda-santa-helena",
        fazenda: "Fazenda Santa Helena",
        title: "Nova tarefa",
        eventType: "Manejo",
        startsAt: "2026-04-10T12:00:00-03:00",
        allDay: true,
        statusId: "planejada",
        status: "Planejada",
        priority: "Normal",
        source: "Manual",
        visibility: "Equipe",
        decisionOptions: [],
      },
      storage,
    );
    expect(listDemoCalendarEvents(storage)[0].id).toBe(created.id);

    const updated = updateDemoCalendarEvent(
      { ...created, statusId: "concluida", status: "Concluída" },
      storage,
    );
    expect(
      listDemoCalendarEvents(storage).find((event) => event.id === created.id)?.status,
    ).toBe(updated.status);

    deleteDemoCalendarEvent(created.id, storage);
    expect(listDemoCalendarEvents(storage).some((event) => event.id === created.id)).toBe(false);

    resetDemoCalendarEvents(storage);
    expect(listDemoCalendarEvents(storage)).toHaveLength(demoCalendarEvents.length);
  });

  it("creates, edits, orders and inactivates custom statuses locally", () => {
    const created = saveDemoCalendarStatus(
      {
        id: "custom-review",
        name: "Em revisão",
        color: "#7c3aed",
        order: 15,
        active: true,
        isDefault: false,
      },
      storage,
    );
    expect(listDemoCalendarStatuses(storage).some((status) => status.id === created.id)).toBe(true);
    saveDemoCalendarStatus(
      { ...created, name: "Revisão do gestor", order: 70, active: false },
      storage,
    );
    expect(listDemoCalendarStatuses(storage).find((status) => status.id === created.id)).toMatchObject({
      name: "Revisão do gestor",
      order: 70,
      active: false,
    });
    expect(listDemoCalendarStatuses(storage).find((status) => status.id === "planned")?.id).toBe(
      "planned",
    );
  });

  it("never calls network APIs in demo persistence", () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    try {
      listDemoCalendarEvents(storage);
      listDemoCalendarStatuses(storage);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
