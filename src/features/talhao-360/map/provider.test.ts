import { describe, expect, it } from "vitest";
import { mapProvider } from "@/features/talhao-360/map/provider";

describe("mapProvider.style", () => {
  it("caps the satellite source maxzoom so deep zoom overzooms instead of erroring", () => {
    const style = mapProvider.style("satellite") as {
      sources: Record<string, { maxzoom?: number }>;
    };
    const maxzoom = style.sources.satellite?.maxzoom;
    expect(maxzoom).toBeGreaterThan(0);
    expect(maxzoom).toBeLessThanOrEqual(22);
  });
});
