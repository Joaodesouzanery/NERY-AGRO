import { describe, expect, it } from "vitest";
import { field360SearchSchema } from "@/features/talhao-360/schemas/navigation";

describe("Talhão 360 navigation", () => {
  it("falls back to overview for unknown tabs", () => {
    expect(field360SearchSchema.parse({ tab: "unknown" }).tab).toBe("overview");
  });

  it("redireciona abas legadas para as consolidadas", () => {
    expect(field360SearchSchema.parse({ tab: "timeline" }).tab).toBe("activity");
    expect(field360SearchSchema.parse({ tab: "alerts" }).tab).toBe("activity");
    expect(field360SearchSchema.parse({ tab: "reports" }).tab).toBe("overview");
  });

  it("keeps valid shareable selections", () => {
    const selection = field360SearchSchema.parse({
      tab: "cycles",
      seasonId: "550e8400-e29b-41d4-a716-446655440000",
      cycleId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    });
    expect(selection).toMatchObject({ tab: "cycles" });
  });
});
