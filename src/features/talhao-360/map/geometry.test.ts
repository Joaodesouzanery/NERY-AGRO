import { describe, expect, it } from "vitest";
import {
  isValidPolygon,
  polygonAreaHa,
  polygonPerimeterKm,
  polygonsOverlap,
  polygonWithin,
} from "./geometry";

const farm: Array<[number, number]> = [
  [-50.99, -17.8],
  [-50.96, -17.8],
  [-50.96, -17.77],
  [-50.99, -17.77],
];
const field: Array<[number, number]> = [
  [-50.9855, -17.7825],
  [-50.9789, -17.7825],
  [-50.9789, -17.777],
  [-50.9855, -17.777],
];

describe("talhao geometry", () => {
  it("calculates hectares and perimeter from longitude/latitude", () => {
    expect(polygonAreaHa(field)).toBeCloseTo(42.74, 1);
    expect(polygonPerimeterKm(field)).toBeGreaterThan(2);
  });

  it("validates simple polygons and rejects self intersections", () => {
    expect(isValidPolygon(field)).toBe(true);
    expect(
      isValidPolygon([
        [0, 0],
        [1, 1],
        [0, 1],
        [1, 0],
      ]),
    ).toBe(false);
  });

  it("checks farm containment and field overlap", () => {
    expect(polygonWithin(field, farm)).toBe(true);
    expect(
      polygonsOverlap(field, [
        [-50.983, -17.781],
        [-50.977, -17.781],
        [-50.977, -17.775],
        [-50.983, -17.775],
      ]),
    ).toBe(true);
  });
});
