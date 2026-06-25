import { describe, expect, it } from "vitest";
import type { FieldRecord } from "@/lib/supabase-field";
import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";
import type { LocalDataBundle } from "./local-data";
import { buildPreview, remapPayload, totalCount } from "./plan";

function bundle(partial: Partial<LocalDataBundle>): LocalDataBundle {
  return {
    talhaoExtra: [],
    talhaoOverrides: {},
    calendarEvents: [],
    calendarStatuses: [],
    ...partial,
  };
}

const talhaoRecord: FieldRecord = {
  id: "demo-areas-abc",
  module: "areas",
  payload: { talhao: "T1", area_ha: "10" },
};

describe("buildPreview", () => {
  it("inclui talhões criados pelo usuário (extra)", () => {
    const preview = buildPreview(bundle({ talhaoExtra: [talhaoRecord] }), new Set());
    expect(preview.talhoes).toHaveLength(1);
    expect(totalCount(preview)).toBe(1);
  });

  it("descarta registros de amostra (seeds)", () => {
    const seed = demoTalhao360Records[0];
    const preview = buildPreview(bundle({ talhaoExtra: [seed] }), new Set());
    expect(preview.talhoes).toHaveLength(0);
  });

  it("ignora itens já migrados", () => {
    const preview = buildPreview(
      bundle({ talhaoExtra: [talhaoRecord] }),
      new Set([talhaoRecord.id]),
    );
    expect(totalCount(preview)).toBe(0);
  });

  it("overrides têm precedência sobre extra", () => {
    const edited: FieldRecord = {
      ...talhaoRecord,
      payload: { ...talhaoRecord.payload, talhao: "T1-editado" },
    };
    const preview = buildPreview(
      bundle({ talhaoExtra: [talhaoRecord], talhaoOverrides: { [talhaoRecord.id]: edited } }),
      new Set(),
    );
    expect(preview.talhoes).toHaveLength(1);
    expect(preview.talhoes[0].payload.talhao).toBe("T1-editado");
  });

  it("separa eventos e alertas por módulo", () => {
    const event: FieldRecord = {
      id: "demo-talhao360-event-1",
      module: "talhao360-event",
      payload: { talhao_id: "demo-areas-abc" },
    };
    const alert: FieldRecord = {
      id: "demo-talhao360-alert-1",
      module: "talhao360-alert",
      payload: { talhao_id: "demo-areas-abc" },
    };
    const preview = buildPreview(bundle({ talhaoExtra: [event, alert] }), new Set());
    expect(preview.events).toHaveLength(1);
    expect(preview.alerts).toHaveLength(1);
  });

  it("só migra eventos de calendário criados pelo usuário (demo-calendar-*)", () => {
    const preview = buildPreview(
      bundle({
        calendarEvents: [
          { id: "demo-calendar-1", title: "Plantio" } as never,
          { id: "seed-evento", title: "Amostra" } as never,
        ],
      }),
      new Set(),
    );
    expect(preview.calendarEvents).toHaveLength(1);
    expect(preview.calendarEvents[0].id).toBe("demo-calendar-1");
  });
});

describe("remapPayload", () => {
  it("substitui o id antigo do talhão pelo novo", () => {
    const idMap = new Map([["demo-areas-abc", "uuid-real-1"]]);
    const out = remapPayload({ talhao_id: "demo-areas-abc", nome: "Evento" }, idMap);
    expect(out.talhao_id).toBe("uuid-real-1");
    expect(out.nome).toBe("Evento");
  });

  it("mantém valores sem correspondência", () => {
    const out = remapPayload({ talhao_id: "x" }, new Map());
    expect(out.talhao_id).toBe("x");
  });
});
