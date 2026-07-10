import { describe, expect, it } from "vitest";
import { demoPecuariaData } from "./demo";

const NOW = new Date("2026-07-10T12:00:00");
const data = demoPecuariaData(NOW);

describe("demoPecuariaData — consistência interna", () => {
  it("todo animal pertence a um lote existente", () => {
    const lotes = new Set(data.lotes.map((lote) => lote.id));
    for (const animal of data.animais) {
      expect(animal.lote_id && lotes.has(animal.lote_id)).toBe(true);
    }
  });

  it("GMD é derivado das pesagens (positivo e coerente)", () => {
    const porAnimal = new Map<string, typeof data.pesagens>();
    for (const pesagem of data.pesagens) {
      porAnimal.set(pesagem.animal_id, [...(porAnimal.get(pesagem.animal_id) ?? []), pesagem]);
    }
    for (const linha of data.gmd) {
      const pesagens = (porAnimal.get(linha.animal_id ?? "") ?? []).sort((a, b) =>
        a.data.localeCompare(b.data),
      );
      expect(pesagens.length).toBeGreaterThanOrEqual(2);
      expect(linha.intervalos).toBe(pesagens.length - 1);
      const ultima = pesagens[pesagens.length - 1];
      const penultima = pesagens[pesagens.length - 2];
      const dias =
        (new Date(`${ultima.data}T12:00:00`).getTime() -
          new Date(`${penultima.data}T12:00:00`).getTime()) /
        86_400_000;
      const esperado = (ultima.peso_kg - penultima.peso_kg) / dias;
      expect(linha.gmd_atual).toBeCloseTo(esperado, 2);
      expect(linha.gmd_atual ?? 0).toBeGreaterThan(0);
      expect(linha.ultima_pesagem).toBe(ultima.data);
    }
  });

  it("carência lista só animais com libera_em no futuro, vindo dos eventos", () => {
    expect(data.carencia.length).toBeGreaterThan(0);
    const hoje = NOW.toISOString().slice(0, 10);
    for (const linha of data.carencia) {
      expect(linha.libera_em && linha.libera_em > hoje).toBe(true);
      const evento = data.sanitarios.find(
        (item) => item.animal_id === linha.animal_id && item.libera_em === linha.libera_em,
      );
      expect(evento).toBeDefined();
    }
  });

  it("ocupações apontam para talhões demo existentes e há pasto aberto por lote ativo", () => {
    const talhoes = new Set(data.talhoes.map((talhao) => talhao.id));
    for (const ocupacao of data.ocupacoes) {
      expect(talhoes.has(ocupacao.talhao_id)).toBe(true);
    }
    const abertas = data.ocupacoes.filter((item) => !item.data_saida);
    expect(new Set(abertas.map((item) => item.lote_id)).size).toBe(data.lotes.length);
  });

  it("dossiê tem elo de origem para comprados/leilão e elos de talhão do lote", () => {
    for (const animal of data.animais) {
      const elos = data.dossies[animal.id] ?? [];
      const temOrigem = elos.some((elo) => elo.tipo_elo === "origem");
      expect(temOrigem).toBe(
        (animal.origem === "comprado" || animal.origem === "leilao") &&
          !!animal.origem_estabelecimento,
      );
      const elosTalhao = elos.filter((elo) => elo.tipo_elo === "talhao");
      const ocupacoesDoLote = data.ocupacoes.filter((item) => item.lote_id === animal.lote_id);
      expect(elosTalhao.length).toBe(ocupacoesDoLote.length);
    }
  });

  it("financeiro demo casa com os centros de custo dos lotes", () => {
    const nomes = new Set(data.costCenters.map((cc) => cc.nome));
    const ids = new Set(data.costCenters.map((cc) => cc.id));
    for (const lote of data.lotes) {
      if (lote.centro_custo_id) expect(ids.has(lote.centro_custo_id)).toBe(true);
    }
    for (const registro of data.fluxo) {
      expect(nomes.has(registro.payload.centro_custo)).toBe(true);
    }
    for (const contrato of data.contratos) {
      expect(contrato.cost_center_id && ids.has(contrato.cost_center_id)).toBe(true);
    }
  });

  it("é estável dentro do mesmo dia (cache) e datas são relativas ao 'now'", () => {
    expect(demoPecuariaData(NOW)).toBe(demoPecuariaData(NOW));
    const gtaEntrada = data.gta.find((item) => item.sentido === "entrada");
    expect(gtaEntrada?.data).toBe("2026-04-26"); // 75 dias antes de 2026-07-10
  });
});
