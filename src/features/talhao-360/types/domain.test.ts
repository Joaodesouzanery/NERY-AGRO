import { describe, expect, it } from "vitest";
import {
  TALHAO_COLORS,
  nextTalhaoColor,
  type TalhaoRecord,
} from "@/features/talhao-360/types/domain";

const record = (cor_mapa?: string) =>
  ({ id: cor_mapa ?? "no-color", payload: { talhao: "T", cor_mapa } }) as unknown as TalhaoRecord;

describe("nextTalhaoColor", () => {
  it("returns the first palette color when none are used", () => {
    expect(nextTalhaoColor([])).toBe(TALHAO_COLORS[0]);
  });

  it("skips colors already in use", () => {
    const used = TALHAO_COLORS.slice(0, 3).map(record);
    expect(nextTalhaoColor(used)).toBe(TALHAO_COLORS[3]);
  });

  it("gives every drawn talhão a distinct color until the palette is exhausted", () => {
    const records: TalhaoRecord[] = [];
    const assigned = new Set<string>();
    for (let i = 0; i < TALHAO_COLORS.length; i += 1) {
      const color = nextTalhaoColor(records);
      assigned.add(color);
      records.push(record(color));
    }
    expect(assigned.size).toBe(TALHAO_COLORS.length);
  });
});
