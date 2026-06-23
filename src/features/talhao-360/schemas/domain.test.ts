import { describe, expect, it } from "vitest";
import {
  cycleSchema,
  polygonGeometrySchema,
  talhaoRegistrationSchema,
} from "@/features/talhao-360/schemas/domain";
import { buildTalhao360Model } from "@/features/talhao-360/api/services";
import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";

describe("Talhão 360 MVP domain", () => {
  it("validates the minimum registration fields", () => {
    expect(
      talhaoRegistrationSchema.parse({
        talhao: "Talhão Norte",
        codigo: "TN-01",
        area_ha: "42.8",
        status: "Plantado",
      }),
    ).toMatchObject({ codigo: "TN-01" });
  });

  it("rejects an inverted cycle", () => {
    expect(() =>
      cycleSchema.parse({
        safra: "2025/2026",
        nome: "Soja",
        cultura: "Soja",
        tipo: "Produção",
        areaHa: 10,
        inicio: "2026-04-01",
        fimPrevisto: "2026-03-01",
      }),
    ).toThrow();
  });

  it("requires closed GeoJSON polygon rings", () => {
    expect(() =>
      polygonGeometrySchema.parse({
        type: "Polygon",
        coordinates: [
          [
            [-50, -18],
            [-49, -18],
            [-49, -17],
            [-50, -17],
          ],
        ],
      }),
    ).toThrow();
  });

  it("builds one shared model from field_records", () => {
    const model = buildTalhao360Model(
      demoTalhao360Records,
      "talhao-demo-03",
      "2025/2026",
      "cycle-soja-2025",
    );
    expect(model?.talhao.payload.codigo).toBe("TL-003");
    expect(model?.selectedCycle?.nome).toBe("Soja Verão");
    expect(model?.alerts.length).toBeGreaterThan(0);
    expect(model?.events.length).toBeGreaterThan(0);
  });
});
