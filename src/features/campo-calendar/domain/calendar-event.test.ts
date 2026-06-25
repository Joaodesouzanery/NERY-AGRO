import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import {
  calendarEventToPayload,
  fieldRecordToCalendarEvent,
  normalizeCalendarInstant,
} from "@/features/campo-calendar/domain/adapters";
import {
  calendarEventBelongsToContext,
  filterCalendarEvents,
} from "@/features/campo-calendar/domain/filters";
import { calendarEventSchema } from "@/features/campo-calendar/schemas/domain";
import type { CalendarEvent } from "@/features/campo-calendar/types";

const canonicalEvent: CalendarEvent = {
  id: "event-1",
  farmKey: "fazenda-santa-helena",
  fazenda: "Fazenda Santa Helena",
  talhaoId: "talhao-03",
  talhaoName: "Talhão 03",
  seasonId: "2025/2026",
  safra: "2025/2026",
  cycleId: "cycle-soja",
  ciclo: "Soja Verão",
  title: "Monitoramento",
  description: "Vistoria dirigida",
  eventType: "Vistoria",
  startsAt: "2026-01-12T08:00:00-03:00",
  endsAt: "2026-01-12T10:00:00-03:00",
  allDay: false,
  statusId: "pendente",
  status: "Pendente",
  priority: "Crítica",
  responsibleId: "joao",
  responsibleName: "João Silva",
  source: "Alerta",
  visibility: "Equipe",
  estimatedCost: 1200.5,
  delayCost: 300,
  decisionOptions: ["Aplicar", "Monitorar"],
  decisionSelected: "Monitorar",
  weatherRisk: "Médio",
  weatherSummary: "Chuva após as 16h",
  relatedModule: "pragas",
  relatedRecordId: "praga-1",
  templateId: "template-vistoria",
  notes: "Levar armadilhas",
  createdAt: "2026-01-05T12:00:00-03:00",
  updatedAt: "2026-01-06T12:00:00-03:00",
};

describe("CalendarEvent domain", () => {
  it("parses and serializes a canonical event without losing contract fields", () => {
    const parsed = calendarEventSchema.parse(canonicalEvent);
    const payload = calendarEventToPayload(parsed);
    expect(payload).toMatchObject({
      farm_key: "fazenda-santa-helena",
      field_id: "talhao-03",
      talhao_id: "talhao-03",
      talhao: "Talhão 03",
      cycle_id: "cycle-soja",
      ciclo: "Soja Verão",
      starts_at: "2026-01-12T08:00:00-03:00",
      status: "Pendente",
      priority: "Crítica",
      decision_options: '["Aplicar","Monitorar"]',
    });

    const roundTrip = fieldRecordToCalendarEvent({
      id: parsed.id,
      module: "calendar-event",
      payload,
      created_at: parsed.createdAt,
      updated_at: parsed.updatedAt,
    });
    expect(roundTrip).toMatchObject({
      id: parsed.id,
      talhaoId: parsed.talhaoId,
      cycleId: parsed.cycleId,
      decisionOptions: parsed.decisionOptions,
      estimatedCost: parsed.estimatedCost,
    });
  });

  it("rejects inverted dates and invalid decisions", () => {
    expect(() =>
      calendarEventSchema.parse({
        ...canonicalEvent,
        endsAt: "2026-01-11T10:00:00-03:00",
      }),
    ).toThrow();
    expect(() =>
      calendarEventSchema.parse({
        ...canonicalEvent,
        decisionSelected: "Cancelar",
      }),
    ).toThrow();
  });

  it("adapts legacy calendario records without mutating or migrating them", () => {
    const legacy: FieldRecord = {
      id: "legacy-1",
      module: "calendario",
      payload: {
        fazenda: "Fazenda Santa Helena",
        cultura: "Soja",
        talhao: "Talhão 03",
        safra: "2025/2026",
        ciclo: "Soja Verão",
        plantio_inicio: "2025-10-20",
        colheita_prevista: "2026-03-20",
        sazonalidade: "Verão chuvoso",
      },
      created_at: "2025-09-01T15:00:00Z",
    };
    const event = fieldRecordToCalendarEvent(legacy);
    expect(event).toMatchObject({
      id: "legacy-1",
      source: "Legado",
      title: "Soja",
      talhaoName: "Talhão 03",
      ciclo: "Soja Verão",
      startsAt: "2025-10-20T12:00:00-03:00",
      endsAt: "2026-03-20T12:00:00-03:00",
    });
    expect(legacy.module).toBe("calendario");
  });

  it("keeps explicit timezone offsets and normalizes date-only values safely", () => {
    expect(
      normalizeCalendarInstant("2026-03-25T08:30:00-03:00", canonicalEvent.createdAt, false),
    ).toBe("2026-03-25T08:30:00-03:00");
    expect(normalizeCalendarInstant("2026-03-25", canonicalEvent.createdAt)).toBe(
      "2026-03-25T12:00:00-03:00",
    );
    expect(new Date("2026-03-25T12:00:00-03:00").toISOString()).toBe(
      "2026-03-25T15:00:00.000Z",
    );
  });

  it("filters by IDs and calendar dimensions", () => {
    const second = {
      ...canonicalEvent,
      id: "event-2",
      talhaoId: "talhao-01",
      talhaoName: "Talhão 01",
      priority: "Normal" as const,
    };
    expect(
      filterCalendarEvents([canonicalEvent, second], {
        fieldId: "talhao-03",
        seasonId: "2025/2026",
        status: "Pendente",
        responsible: "joao",
        eventType: "Vistoria",
        priority: "Crítica",
      }),
    ).toEqual([canonicalEvent]);
  });

  it("filters by overlapping date interval", () => {
    expect(
      filterCalendarEvents([canonicalEvent], {
        dateFrom: "2026-01-12",
        dateTo: "2026-01-12",
      }),
    ).toEqual([canonicalEvent]);
    expect(
      filterCalendarEvents([canonicalEvent], {
        dateFrom: "2026-01-13",
        dateTo: "2026-01-20",
      }),
    ).toEqual([]);
  });

  it("prefers ID links and falls back to legacy names only when IDs are absent", () => {
    expect(
      calendarEventBelongsToContext(canonicalEvent, {
        talhaoId: "talhao-03",
        talhaoName: "Nome divergente",
        cycleId: "cycle-soja",
        ciclo: "Ciclo divergente",
      }),
    ).toBe(true);
    expect(
      calendarEventBelongsToContext(
        { ...canonicalEvent, talhaoId: undefined, cycleId: undefined },
        { talhaoName: "Talhão 03", ciclo: "Soja Verão" },
      ),
    ).toBe(true);
    expect(
      calendarEventBelongsToContext(canonicalEvent, {
        talhaoId: "outro-id",
        talhaoName: "Talhão 03",
      }),
    ).toBe(false);
  });
});
