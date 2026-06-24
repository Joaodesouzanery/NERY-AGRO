import { describe, expect, it } from "vitest";
import { demoRdcRecords } from "@/features/rdc/data/mocks";
import {
  buildRdcDailySummary,
  buildRdcModel,
  listEntriesForAnimal,
  listEntriesForTalhao,
  listFichaSummaries,
} from "@/features/rdc/api/services";

describe("RDC selectors", () => {
  it("buildRdcModel agrupa itens por seção e soma custos/ocorrências", () => {
    const model = buildRdcModel(demoRdcRecords, "rdc-demo-1");
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.ficha.titulo).toContain("Turno manhã");
    expect(model.entriesBySecao.campo).toHaveLength(4);
    expect(model.entriesBySecao.pecuaria).toHaveLength(3);
    expect(model.entriesBySecao.observacoes).toHaveLength(1);
    expect(model.entriesBySecao.equipe).toHaveLength(2);
    expect(model.photos).toHaveLength(2);
    expect(model.totalItens).toBe(10);
    expect(model.totalCusto).toBe(2115); // 1280 + 35 + 480 + 320
    expect(model.ocorrenciasAbertas).toBe(2); // 1 Ocorrência + 1 Sanidade
  });

  it("retorna null para ficha inexistente", () => {
    expect(buildRdcModel(demoRdcRecords, "inexistente")).toBeNull();
  });

  it("listFichaSummaries conta itens e fotos por ficha", () => {
    const fichas = listFichaSummaries(demoRdcRecords);
    expect(fichas).toHaveLength(2);
    const ficha1 = fichas.find((f) => f.id === "rdc-demo-1");
    expect(ficha1?.itens).toBe(10);
    expect(ficha1?.fotos).toBe(2);
    expect(ficha1?.custo).toBe(2115);
  });

  it("reverse-link por talhão e por animal", () => {
    expect(listEntriesForTalhao(demoRdcRecords, "talhao-demo-03")).toHaveLength(5);
    expect(listEntriesForAnimal(demoRdcRecords, "demo-pecuaria-animal-1")).toHaveLength(3);
    expect(listEntriesForTalhao(demoRdcRecords, "talhao-inexistente")).toHaveLength(0);
  });

  it("buildRdcDailySummary agrega múltiplas fichas do mesmo dia", () => {
    const summary = buildRdcDailySummary(demoRdcRecords, "2026-06-24");
    expect(summary.fichas).toBe(2);
    expect(summary.itens).toBe(11); // 10 + 1
    expect(summary.custoTotal).toBe(2115);
    expect(summary.ocorrencias).toBe(2);
    expect(summary.talhoesTocados).toBe(1);
    expect(summary.animaisTocados).toBe(1);
  });

  it("buildRdcDailySummary zera fora do dia", () => {
    const summary = buildRdcDailySummary(demoRdcRecords, "2020-01-01");
    expect(summary.fichas).toBe(0);
    expect(summary.itens).toBe(0);
  });
});
