import { describe, expect, it } from "vitest";
import { parseAppSettings } from "@/lib/app-settings";

describe("parseAppSettings", () => {
  it("payload vazio → defaults", () => {
    const s = parseAppSettings(undefined);
    expect(s.carbonPriceBrlPerT).toBeUndefined();
    expect(s.fazendaCoords).toEqual({});
  });
  it("lê preço do carbono e coords (JSON)", () => {
    const s = parseAppSettings({
      carbon_price_brl_per_t: "72",
      fazenda_coords: JSON.stringify({ sato: { lat: -16.71, lng: -47.72 } }),
    });
    expect(s.carbonPriceBrlPerT).toBe(72);
    expect(s.fazendaCoords.sato).toEqual({ lat: -16.71, lng: -47.72 });
  });
  it("coords com JSON inválido → objeto vazio (não quebra)", () => {
    const s = parseAppSettings({ fazenda_coords: "{quebrado" });
    expect(s.fazendaCoords).toEqual({});
  });
  it("preço zero/negativo é ignorado (usa default depois)", () => {
    expect(parseAppSettings({ carbon_price_brl_per_t: "0" }).carbonPriceBrlPerT).toBeUndefined();
  });
});
