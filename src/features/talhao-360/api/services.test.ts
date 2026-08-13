import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import { buildTalhao360Model } from "@/features/talhao-360/api/services";

const talhaoRecord: FieldRecord = {
  id: "talhao-1",
  module: "areas",
  payload: {
    talhao: "Talhão Norte 04",
    fazenda: "Fazenda Santa Helena",
    safra: "2025/2026",
    ciclos_json: "[]",
  },
  created_at: "2026-01-10T10:00:00.000Z",
};

const calendarEvent: FieldRecord = {
  id: "cal-1",
  module: "calendar-event",
  payload: {
    talhao_id: "talhao-1",
    talhao: "Talhão Norte 04",
    title: "Pulverização pós-emergente",
    description: "Aplicar herbicida",
    event_type: "pulverizacao",
    starts_at: "2026-07-12",
    status_id: "planejada",
  },
  created_at: "2026-07-01T10:00:00.000Z",
};

describe("buildTalhao360Model — eventos operacionais", () => {
  it("mapeia calendar-event com data, tipo pt-BR e título", () => {
    const model = buildTalhao360Model([talhaoRecord, calendarEvent], "talhao-1");
    expect(model).not.toBeNull();
    const event = model!.events.find((item) => item.id === "cal-1");
    expect(event).toMatchObject({
      date: "2026-07-12",
      type: "Pulverização",
      description: "Pulverização pós-emergente — Aplicar herbicida",
    });
  });

  it("ignora módulos calendar-* de configuração (template/status)", () => {
    const template: FieldRecord = {
      id: "tpl-1",
      module: "calendar-template",
      payload: { talhao_id: "talhao-1", name: "Ciclo Soja" },
    };
    const status: FieldRecord = {
      id: "st-1",
      module: "calendar-status",
      payload: { talhao_id: "talhao-1", label: "Custom" },
    };
    const model = buildTalhao360Model([talhaoRecord, template, status], "talhao-1");
    expect(model!.events).toHaveLength(0);
  });

  it("mantém o fallback genérico para outros módulos operacionais", () => {
    const generic: FieldRecord = {
      id: "op-1",
      module: "plantio",
      payload: { talhao_id: "talhao-1", data: "2026-02-01", observacao: "Plantio iniciado" },
    };
    const model = buildTalhao360Model([talhaoRecord, generic], "talhao-1");
    expect(model!.events[0]).toMatchObject({
      date: "2026-02-01",
      type: "plantio",
      description: "Plantio iniciado",
    });
  });
});
