import { describe, expect, it } from "vitest";
import {
  cycleSchema,
  polygonGeometrySchema,
  talhaoRegistrationSchema,
} from "@/features/talhao-360/schemas/domain";
import {
  buildTalhao360Model,
  findFarmPerimeter,
  legacyFarmPerimeterFromTalhoes,
  listFarmPerimeters,
  normalizeFarmName,
} from "@/features/talhao-360/api/services";
import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";
import { polygonOutsideVertexCount } from "@/features/talhao-360/map/geometry";
import { nextMapStyle } from "@/features/talhao-360/map/map-styles";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";

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

  it("normalizes farm names and finds saved farm perimeters", () => {
    expect(normalizeFarmName("  Fazenda São João  ")).toBe("fazenda sao joao");
    expect(listFarmPerimeters(demoTalhao360Records)).toHaveLength(1);
    expect(findFarmPerimeter(demoTalhao360Records, "fazenda santa helena")?.id).toBe(
      "farm-demo-santa-helena",
    );
  });

  it("falls back to legacy farm_geometry_geojson on talhao records", () => {
    const recordsWithoutFarm = demoTalhao360Records.filter(
      (record) => record.module !== "talhao360-farm",
    );
    const talhoes = recordsWithoutFarm.filter(
      (record) => record.module === "areas",
    ) as TalhaoRecord[];
    const legacy = legacyFarmPerimeterFromTalhoes(talhoes, "Fazenda Santa Helena");
    expect(legacy?.payload.fazenda).toBe("Fazenda Santa Helena");
    expect(legacy?.payload.geometry_geojson).toContain("Polygon");
  });

  it("counts talhao vertices outside the farm perimeter", () => {
    const farm: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ],
    };
    const talhao: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [1, 1],
          [3, 1],
          [1, 1.5],
          [1, 1],
        ],
      ],
    };
    expect(polygonOutsideVertexCount(talhao, farm)).toBe(1);
  });

  it("cycles map base styles without dropping the current map instance", () => {
    expect(nextMapStyle("satellite")).toBe("map");
    expect(nextMapStyle("map")).toBe("hybrid");
    expect(nextMapStyle("hybrid")).toBe("satellite");
  });
});
