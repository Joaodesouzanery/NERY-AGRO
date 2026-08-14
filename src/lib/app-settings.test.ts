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

describe("beneficiamento — deixou de ser constante no código", () => {
  it("sem configuração não há beneficiamento", () => {
    // `BENEFICIAMENTO = { nome: "Fazenda Matrice", ... }` vivia em
    // remessa-metrics.ts: o estabelecimento de UM cliente, desenhado no mapa de
    // qualquer outro que registrasse uma remessa. Sem pino é melhor que pino
    // com o nome de outra empresa.
    expect(parseAppSettings(undefined).beneficiamento).toBeUndefined();
    expect(
      parseAppSettings({ beneficiamento_nome: "Packing House" }).beneficiamento,
    ).toBeUndefined();
  });

  it("exige nome E coordenada — 0,0 não vale", () => {
    // lat/lng 0,0 é o Golfo da Guiné; o pino apareceria no meio do Atlântico.
    expect(
      parseAppSettings({
        beneficiamento_nome: "Packing House",
        beneficiamento_lat: "0",
        beneficiamento_lng: "0",
      }).beneficiamento,
    ).toBeUndefined();
  });

  it("com os três campos, vira destino do mapa", () => {
    expect(
      parseAppSettings({
        beneficiamento_nome: "  Packing House Sede  ",
        beneficiamento_lat: "-16.78",
        beneficiamento_lng: "-47.55",
      }).beneficiamento,
    ).toEqual({ nome: "Packing House Sede", lat: -16.78, lng: -47.55 });
  });
});

describe("fazendaCoord", () => {
  it("sem override não há coordenada — nada de defaults de um cliente", async () => {
    const { fazendaCoord } = await import("@/lib/remessa-metrics");
    // Estas quatro estavam chumbadas (Cristalina-GO, do cliente que estreou a
    // feature). Fazenda sem coordenada configurada simplesmente não vira pino.
    for (const nome of ["Sato", "Nascente", "Monte Alto", "Matrice"]) {
      expect(fazendaCoord(nome), nome).toBeNull();
    }
  });

  it("usa o override da empresa, normalizando o nome", async () => {
    const { fazendaCoord } = await import("@/lib/remessa-metrics");
    const overrides = { "monte alto": { lat: -16.72, lng: -47.5 } };
    expect(fazendaCoord("Monte Alto", overrides)).toEqual({ lat: -16.72, lng: -47.5 });
    expect(fazendaCoord("  MONTE ALTO ", overrides)).toEqual({ lat: -16.72, lng: -47.5 });
    expect(fazendaCoord("Outra", overrides)).toBeNull();
  });
});
