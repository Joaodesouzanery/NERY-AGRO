import { describe, expect, it } from "vitest";
import { pecuariaSearchSchema } from "@/features/pecuaria/schemas/navigation";

describe("pecuariaSearchSchema", () => {
  it("aceita todas as abas válidas", () => {
    expect(pecuariaSearchSchema.parse({ tab: "resultados" })).toEqual({ tab: "resultados" });
    expect(pecuariaSearchSchema.parse({ tab: "rastreabilidade" })).toEqual({
      tab: "rastreabilidade",
    });
  });

  it("cai em visao-geral para valores desconhecidos ou ausentes", () => {
    expect(pecuariaSearchSchema.parse({ tab: "inexistente" })).toEqual({ tab: "visao-geral" });
    expect(pecuariaSearchSchema.parse({})).toEqual({ tab: "visao-geral" });
  });
});
