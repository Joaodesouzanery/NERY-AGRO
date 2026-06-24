import { describe, expect, it } from "vitest";
import {
  buildTalhao360CalendarIntegration,
  mergeTalhao360IntoCalendarWorkspace,
} from "@/features/campo-calendar/api/talhao360-calendar-adapter";
import { demoCalendarWorkspace } from "@/features/campo-calendar/data/mocks";
import type { FieldRecord } from "@/lib/supabase-field";

const records: FieldRecord[] = [
  {
    id: "talhao-a",
    module: "areas",
    payload: {
      talhao: "Talhão A",
      fazenda: "Fazenda Santa Helena",
      area_ha: "50",
      area_util: "45",
      safra: "2025/2026",
      ciclos_json: JSON.stringify([
        {
          id: "cycle-a",
          safra: "2025/2026",
          nome: "Soja Verão",
          cultura: "Soja",
          tipo: "Produção",
          areaHa: 45,
          inicio: "2025-10-01",
          fimPrevisto: "2026-03-10",
          status: "Em andamento",
        },
      ]),
    },
  },
  {
    id: "manual-a",
    module: "talhao360-event",
    payload: {
      talhao_id: "talhao-a",
      talhao: "Talhão A",
      date: "2026-01-05",
      type: "Pulverização",
      description: "Evento manual preservado.",
      responsible: "Equipe Campo",
      season: "2025/2026",
      cycle: "Soja Verão",
      origin: "Manual",
    },
  },
];

describe("Talhão 360 calendar adapter", () => {
  it("reads fields, cycles and manual events without changing modules", () => {
    const integration = buildTalhao360CalendarIntegration(records);

    expect(integration.cycles).toContainEqual(
      expect.objectContaining({
        id: "cycle-a",
        fieldId: "talhao-a",
        name: "Soja Verão",
        startsOn: "2025-10-01",
        endsOn: "2026-03-10",
        source: "talhao360",
      }),
    );
    expect(integration.manualEvents).toContainEqual(
      expect.objectContaining({
        relatedRecordId: "manual-a",
        talhaoId: "talhao-a",
        cycleId: "cycle-a",
        type: "Pulverização",
      }),
    );
    expect(records[1].module).toBe("talhao360-event");
  });

  it("merges Talhão 360 cycles into the Calendar workspace without duplicating fields", () => {
    const integration = buildTalhao360CalendarIntegration(records);
    const workspace = mergeTalhao360IntoCalendarWorkspace(
      {
        ...demoCalendarWorkspace,
        fields: [
          {
            id: "talhao-a",
            name: "Talhão A",
            code: "A",
            crop: "Soja",
            areaHa: 50,
            cycles: [],
          },
        ],
        talhao360: integration,
      },
      integration,
    );

    expect(workspace.fields).toHaveLength(1);
    expect(workspace.fields[0].cycles).toHaveLength(1);
    expect(workspace.talhao360.manualEvents).toHaveLength(1);
  });
});
