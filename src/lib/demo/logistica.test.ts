import { describe, expect, it } from "vitest";
import { defaultPeriod } from "@/components/period-picker";
import { demoLogisticaRecords, demoLogisticaOperations } from "@/lib/demo/logistica";
import { dataDoRegistro, filtrarRegistros } from "@/lib/filtro-registros";

// A vitrine tem que sobreviver ao filtro que a tela aplica sozinha.
//
// O defeito que estes testes travam: os registros nasciam com
// `created_at: "2026-01-01"` e quase nenhum tinha `payload.data`. A barra de
// filtros abre em "Este mês", `dataDoRegistro` cai no `created_at` quando falta
// a data, e o resultado era que **as 12 tabelas abriam vazias em DEMO** —
// enquanto os painéis logo acima, que recebem a lista sem filtro, apareciam
// cheios. Quem via a tela concluía que o produto estava quebrado.

const ABAS = [
  "remessa",
  "caixas-vazias",
  "cargas",
  "fretes",
  "motoristas",
  "rotas",
  "frota",
  "bases",
  "roteirizacao",
  "embalagens",
  "cestas",
  "expedicao",
];

describe("vitrine DEMO da Logística", () => {
  it("cobre as 12 abas do módulo", () => {
    const registros = demoLogisticaRecords();
    expect(Object.keys(registros).sort()).toEqual([...ABAS].sort());
    for (const aba of ABAS) {
      expect(registros[aba]?.length, `aba "${aba}" sem exemplo`).toBeGreaterThan(0);
    }
  });

  it("nenhuma aba some com o período padrão da tela", () => {
    const registros = demoLogisticaRecords();
    const periodo = defaultPeriod();
    for (const aba of ABAS) {
      const visiveis = filtrarRegistros(registros[aba] ?? [], { periodo });
      expect(
        visiveis.length,
        `aba "${aba}": a vitrine some assim que a tela aplica "${periodo.label}"`,
      ).toBeGreaterThan(0);
    }
  });

  it("todo registro tem data reconhecível", () => {
    // Sem isto o teste acima passaria por omissão: `dentroDoPeriodo` deixa
    // passar o registro cuja data não dá para ler.
    for (const registro of demoLogisticaOperations()) {
      expect(dataDoRegistro(registro), `${registro.id} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("as duas pernas da data concordam entre si", () => {
    // `dataDoRegistro` prefere `payload.data` e cai no `created_at`. Se os dois
    // existirem e discordarem, o registro aparece num período e some noutro
    // conforme quem lê — que foi exatamente o defeito original.
    for (const registro of demoLogisticaOperations()) {
      const declarada = registro.payload.data;
      if (!declarada) continue;
      expect(registro.created_at?.slice(0, 10), `${registro.id}: data ≠ created_at`).toBe(
        declarada,
      );
    }
  });

  it("é estável entre chamadas do mesmo dia", () => {
    // Referência estável importa: `registros` alimenta os `useMemo` da visão
    // geral, e um objeto novo a cada chamada recalcularia os 13 gráficos a
    // cada render.
    expect(demoLogisticaRecords()).toBe(demoLogisticaRecords());
  });

  it("acompanha a data recebida, não uma data fixa", () => {
    const emJunho = demoLogisticaRecords(new Date("2026-06-15T12:00:00"));
    expect(dataDoRegistro(emJunho.cargas[0])).toMatch(/^2026-06-/);
  });
});
