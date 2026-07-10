import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import {
  buildCalendarModel,
  eventFromRecord,
  eventToPayload,
  legacyEventsFromRecord,
  CALENDAR_EVENT_MODULE,
} from "@/features/campo-calendar/api/services";
import { demoCalendarRecords } from "@/features/campo-calendar/data/mocks";
import type { CalendarEvent } from "@/features/campo-calendar/types/domain";

const NOW = new Date(2026, 6, 10, 12, 0, 0);

const baseEvent: Omit<CalendarEvent, "id"> = {
  fazenda: "Fazenda Santa Helena",
  talhaoId: "talhao-demo-03",
  talhaoName: "Talhão 03",
  safra: "2025/2026",
  cycleId: "cycle-soja-2025",
  cicloNome: "Soja Verão",
  title: "Pulverização pós-emergente",
  description: "Aplicar herbicida",
  eventType: "pulverizacao",
  startsAt: "2026-07-12",
  endsAt: "2026-07-13",
  allDay: true,
  statusId: "planejada",
  priority: "critica",
  responsibleName: "João Silva",
  source: "manual",
  visibility: "equipe",
  estimatedCost: 12600.5,
  delayCost: 5200,
  decisionOptions: undefined,
  notes: "Checar vento antes.",
};

describe("Calendário — serialização canônica", () => {
  it("faz roundtrip evento → payload string-only → evento", () => {
    const payload = eventToPayload(baseEvent);
    expect(Object.values(payload).every((value) => typeof value === "string")).toBe(true);

    const parsed = eventFromRecord({
      id: "rec-1",
      module: CALENDAR_EVENT_MODULE,
      payload,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-02T10:00:00.000Z",
    });
    expect(parsed).toMatchObject({
      id: "rec-1",
      talhaoId: "talhao-demo-03",
      cycleId: "cycle-soja-2025",
      title: "Pulverização pós-emergente",
      eventType: "pulverizacao",
      startsAt: "2026-07-12",
      endsAt: "2026-07-13",
      priority: "critica",
      estimatedCost: 12600.5,
      delayCost: 5200,
    });
  });

  it("serializa opções de decisão como JSON e volta como array", () => {
    const decisao = {
      ...baseEvent,
      eventType: "decisao" as const,
      visibility: "gestor" as const,
      decisionOptions: ["Híbrido precoce", "Adiar 10 dias"],
    };
    const payload = eventToPayload(decisao);
    const parsed = eventFromRecord({ id: "rec-2", module: CALENDAR_EVENT_MODULE, payload });
    expect(parsed.decisionOptions).toEqual(["Híbrido precoce", "Adiar 10 dias"]);
    expect(parsed.visibility).toBe("gestor");
  });

  it("degrada enums desconhecidos para defaults seguros", () => {
    const parsed = eventFromRecord({
      id: "rec-3",
      module: CALENDAR_EVENT_MODULE,
      payload: { title: "X", event_type: "invalido", priority: "??", starts_at: "2026-01-01" },
    });
    expect(parsed.eventType).toBe("operacao");
    expect(parsed.priority).toBe("normal");
    expect(parsed.visibility).toBe("equipe");
  });
});

describe("Calendário — adapter legado (module = calendario)", () => {
  const legacy: FieldRecord = {
    id: "leg-1",
    module: "calendario",
    payload: {
      cultura: "Hortaliças",
      talhao: "Talhão 02",
      plantio_inicio: "2026-06-05",
      colheita_prevista: "2026-08-12",
      sazonalidade: "Inverno seco",
      alerta: "15 dias",
    },
  };

  it("converte um registro legado em plantio + marco de colheita, somente leitura", () => {
    const events = legacyEventsFromRecord(legacy);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      id: "leg-1::plantio",
      eventType: "plantio",
      startsAt: "2026-06-05",
      source: "legado",
      legacy: true,
      talhaoName: "Talhão 02",
    });
    expect(events[1]).toMatchObject({
      id: "leg-1::colheita",
      eventType: "colheita",
      startsAt: "2026-08-12",
    });
    expect(events[0].notes).toContain("15 dias");
  });

  it("ignora datas ausentes sem inventar eventos", () => {
    const events = legacyEventsFromRecord({
      ...legacy,
      payload: { cultura: "Milho", talhao: "Talhão 01" },
    });
    expect(events).toHaveLength(0);
  });
});

describe("Calendário — modelo consolidado", () => {
  it("monta eventos, talhões, ciclos, modelos e status a partir dos records demo", () => {
    const model = buildCalendarModel(demoCalendarRecords(NOW));
    expect(model.talhoes.length).toBe(3);
    expect(model.cycles.some((cycle) => cycle.nome === "Soja Verão")).toBe(true);
    expect(model.templates.map((template) => template.nome)).toContain("Milho Safrinha");
    expect(model.statuses.map((status) => status.id)).toContain("em-andamento");
    // legado aparece junto dos canônicos, sem duplicar
    expect(model.events.some((event) => event.legacy)).toBe(true);
  });

  it("vincula evento legado ao talhão por nome (fallback) e canônico por id", () => {
    const model = buildCalendarModel(demoCalendarRecords(NOW));
    const legado = model.events.find((event) => event.id === "cal-demo-legado::plantio");
    expect(legado?.talhaoId).toBe("talhao-demo-02");
    const canonico = model.events.find((event) => event.id === "cal-demo-monitorar-pragas");
    expect(canonico?.talhaoName).toBe("Talhão 03");
  });

  it("personalização de status padrão preserva o id interno", () => {
    const override: FieldRecord = {
      id: "status-1",
      module: "calendar-status",
      payload: {
        status_key: "pendente",
        label: "Aguardando",
        order: "1",
        active: "true",
        custom: "false",
      },
    };
    const model = buildCalendarModel([...demoCalendarRecords(NOW), override]);
    const pendente = model.statuses.find((status) => status.id === "pendente");
    expect(pendente?.label).toBe("Aguardando");
    expect(pendente?.custom).toBe(false);
  });
});
