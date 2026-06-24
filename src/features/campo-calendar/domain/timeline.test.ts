import { describe, expect, it } from "vitest";
import { demoCalendarWorkspace } from "@/features/campo-calendar/data/mocks";
import {
  buildCalendarTimelineModel,
  timelineManualEventMatches,
} from "@/features/campo-calendar/domain/timeline";
import type {
  CalendarEvent,
  CalendarSearch,
  CalendarWorkspace,
} from "@/features/campo-calendar/types";

const search: CalendarSearch = {
  tab: "timeline",
  view: "month",
  date: "2026-06-23",
};

function workspace(overrides: Partial<CalendarWorkspace> = {}): CalendarWorkspace {
  return {
    ...demoCalendarWorkspace,
    fields: [
      {
        id: "talhao-a",
        name: "Talhão A",
        code: "A",
        crop: "Soja",
        areaHa: 50,
        cycles: [
          {
            id: "cycle-a",
            fieldId: "talhao-a",
            seasonId: "2025/2026",
            name: "Soja Verão",
            areaHa: 45,
            usefulAreaHa: 45,
            startsOn: "2025-10-01",
            endsOn: "2026-03-10",
            source: "talhao360",
          },
        ],
      },
    ],
    events: [],
    talhao360: {
      cycles: [
        {
          id: "cycle-a",
          fieldId: "talhao-a",
          seasonId: "2025/2026",
          name: "Soja Verão",
          areaHa: 45,
          usefulAreaHa: 45,
          startsOn: "2025-10-01",
          endsOn: "2026-03-10",
          source: "talhao360",
        },
      ],
      manualEvents: [
        {
          id: "talhao360:manual-a",
          relatedRecordId: "manual-a",
          talhaoId: "talhao-a",
          talhaoName: "Talhão A",
          date: "2026-01-05",
          type: "Pulverização",
          description: "Manual preservado.",
          responsible: "Equipe Campo",
          seasonId: "2025/2026",
          cycleId: "cycle-a",
          ciclo: "Soja Verão",
          origin: "Manual",
          critical: false,
        },
      ],
      futurePatch: "patch futuro",
    },
    ...overrides,
  };
}

function event(value: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "event-a",
    farmKey: "fazenda-santa-helena",
    fazenda: "Fazenda Santa Helena",
    talhaoId: "talhao-a",
    talhaoName: "Talhão A",
    seasonId: "2025/2026",
    safra: "2025/2026",
    cycleId: "cycle-a",
    ciclo: "Soja Verão",
    title: "Evento",
    eventType: "Vistoria",
    startsAt: "2026-01-05T12:00:00-03:00",
    allDay: true,
    statusId: "planned",
    status: "Planejada",
    priority: "Normal",
    source: "Manual",
    visibility: "Equipe",
    decisionOptions: [],
    createdAt: "2026-01-01T12:00:00-03:00",
    updatedAt: "2026-01-01T12:00:00-03:00",
    ...value,
  };
}

describe("calendar timeline model", () => {
  it("shows Talhão 360 cycles, calendar events and preserved manual events", () => {
    const events = [event({ title: "Monitoramento" })];
    const model = buildCalendarTimelineModel(workspace(), events, search);

    expect(model.rows).toHaveLength(1);
    expect(model.rows[0].cycles[0].id).toBe("cycle-a");
    expect(model.rows[0].calendarEvents[0].title).toBe("Monitoramento");
    expect(model.rows[0].manualEvents[0].relatedRecordId).toBe("manual-a");
  });

  it("does not duplicate a manual Talhão 360 event already related to a calendar event", () => {
    const manual = workspace().talhao360.manualEvents[0];

    expect(
      timelineManualEventMatches(
        manual,
        search,
        [event({ relatedModule: "talhao360-event", relatedRecordId: "manual-a" })],
      ),
    ).toBe(false);
  });

  it("filters rows by field and cycle", () => {
    const model = buildCalendarTimelineModel(
      workspace(),
      [event({ title: "Monitoramento" })],
      { ...search, fieldId: "talhao-a", cycleId: "cycle-a" },
    );

    expect(model.rows).toHaveLength(1);
    expect(model.rows[0].cycles).toHaveLength(1);
    expect(model.rows[0].calendarEvents).toHaveLength(1);
  });

  it("detects conflicts only when data is available", () => {
    const model = buildCalendarTimelineModel(
      workspace(),
      [
        event({
          id: "critical",
          title: "Decisão crítica",
          priority: "Crítica",
          responsibleId: undefined,
          responsibleName: undefined,
        }),
        event({
          id: "weather",
          title: "Pulverização",
          weatherRisk: "Alto",
          weatherSummary: "Vento acima do limite.",
        }),
        event({
          id: "outside",
          title: "Aplicação fora do ciclo",
          startsAt: "2026-05-01T12:00:00-03:00",
        }),
      ],
      search,
    );

    expect(model.conflicts.map((conflict) => conflict.kind)).toEqual(
      expect.arrayContaining([
        "critical-without-owner",
        "weather-risk",
        "outside-cycle-window",
      ]),
    );
  });

  it("reports insufficient data instead of inventing conflicts", () => {
    const model = buildCalendarTimelineModel(
      workspace({
        talhao360: { cycles: [], manualEvents: [], futurePatch: "patch futuro" },
      }),
      [event({ cycleId: "missing-cycle" })],
      search,
    );

    expect(model.conflicts).toHaveLength(0);
    expect(model.rows[0].dataGaps.join(" ")).toContain("dados insuficientes");
  });
});
