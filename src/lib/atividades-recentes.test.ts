import { describe, expect, it } from "vitest";
import { atividadesRecentes } from "@/lib/atividades-recentes";
import { tempoRelativo } from "@/lib/tempo-relativo";

function op(id: string, module: string, payload: Record<string, string>, quando: string) {
  return {
    id,
    area: "logistica",
    module,
    payload,
    created_at: quando,
    updated_at: quando,
  };
}

describe("atividadesRecentes", () => {
  it("mescla as três fontes e ordena do mais recente para o mais antigo", () => {
    const atv = atividadesRecentes({
      operations: [op("o1", "cargas", { codigo: "CG-1" }, "2026-08-13T10:00:00Z")],
      field: [
        {
          id: "f1",
          module: "pragas",
          payload: { ocorrencia: "Lagarta", talhao: "T-01" },
          created_at: "2026-08-13T12:00:00Z",
          updated_at: "2026-08-13T12:00:00Z",
        },
      ],
      financial: [
        {
          id: "fin1",
          module: "fluxo",
          payload: { descricao: "Venda" },
          created_at: "2026-08-13T08:00:00Z",
          updated_at: "2026-08-13T08:00:00Z",
        },
      ],
    });
    expect(atv.map((a) => a.recordId)).toEqual(["f1", "o1", "fin1"]);
    expect(atv[0].area).toBe("campo");
  });

  it("distingue criado de atualizado pelo par created/updated", () => {
    const atv = atividadesRecentes({
      operations: [
        op("novo", "cargas", { codigo: "A" }, "2026-08-13T10:00:00Z"),
        {
          id: "mexido",
          area: "logistica",
          module: "cargas",
          payload: { codigo: "B" },
          created_at: "2026-08-10T10:00:00Z",
          updated_at: "2026-08-13T11:00:00Z",
        },
      ],
      field: [],
      financial: [],
    });
    expect(atv.find((a) => a.recordId === "novo")?.acao).toBe("criado");
    expect(atv.find((a) => a.recordId === "mexido")?.acao).toBe("atualizado");
  });

  it("usa a MESMA heurística de título dos alertas da Torre", () => {
    const atv = atividadesRecentes({
      operations: [
        op("a", "cargas", { codigo: "CG-9" }, "2026-08-13T10:00:00Z"),
        op("b", "embalagens", { item: "Caixa 20 kg" }, "2026-08-13T09:00:00Z"),
        op("c", "misterio", {}, "2026-08-13T08:00:00Z"),
      ],
      field: [],
      financial: [],
    });
    expect(atv.map((a) => a.titulo)).toEqual(["CG-9", "Caixa 20 kg", "misterio"]);
  });

  it("respeita o limite e descarta registro sem data", () => {
    const muitos = Array.from({ length: 20 }, (_, i) =>
      op(
        `r${i}`,
        "cargas",
        { codigo: `C${i}` },
        `2026-08-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
      ),
    );
    const semData = { id: "x", area: "logistica", module: "cargas", payload: {} };
    const atv = atividadesRecentes(
      { operations: [...muitos, semData], field: [], financial: [] },
      5,
    );
    expect(atv).toHaveLength(5);
    expect(atv.some((a) => a.recordId === "x")).toBe(false);
  });

  it("severidade vem do status, como nos alertas", () => {
    const atv = atividadesRecentes({
      operations: [op("a", "cargas", { codigo: "C", status: "Atrasado" }, "2026-08-13T10:00:00Z")],
      field: [],
      financial: [],
    });
    expect(atv[0].severidade).toBe("danger");
  });
});

describe("tempoRelativo", () => {
  const agora = new Date("2026-08-13T15:00:00");

  it("cada faixa tem a sua palavra", () => {
    expect(tempoRelativo("2026-08-13T14:59:30", agora)).toBe("agora");
    expect(tempoRelativo("2026-08-13T14:44:00", agora)).toBe("há 16 min");
    expect(tempoRelativo("2026-08-13T12:00:00", agora)).toBe("há 3 h");
    expect(tempoRelativo("2026-08-11T15:00:00", agora)).toBe("há 2 dias");
    expect(tempoRelativo("2026-08-08T15:00:00", agora)).toBe("há 5 dias");
  });

  it("'ontem' é calendário, depois das 24h de granularidade em horas", () => {
    // 12h atrás, ontem à noite: ainda em horas — informa mais.
    expect(tempoRelativo("2026-08-13T03:00:00", agora)).toBe("há 12 h");
    // 25h atrás, ontem: "ontem".
    expect(tempoRelativo("2026-08-12T14:00:00", agora)).toBe("ontem");
  });

  it("mais de 30 dias vira data absoluta", () => {
    expect(tempoRelativo("2026-06-01T10:00:00", agora)).toBe("01/06/2026");
  });

  it("futuro e lixo não inventam texto", () => {
    // Relógio dessincronizado: mostrar a data é melhor que "daqui a −3 min".
    expect(tempoRelativo("2026-08-14T10:00:00", agora)).toBe("14/08/2026");
    expect(tempoRelativo("não-é-data", agora)).toBe("-");
  });
});
