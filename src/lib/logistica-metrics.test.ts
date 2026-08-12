import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildLogisticaMetrics,
  cargaStatusBreakdown,
  freightByRoute,
  slaCargas,
  slaPendentes,
  slaResumo,
} from "./logistica-metrics";

function op(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return { id, area: "logistica", module, payload };
}

const records: OperationRecord[] = [
  op("cargas", "c1", {
    codigo: "#1",
    cliente: "A",
    status: "Entregue",
    valor: "1000",
    eta: "2026-06-10",
  }),
  op("cargas", "c2", {
    codigo: "#2",
    cliente: "B",
    status: "Atrasado",
    valor: "500",
    eta: "2026-06-18",
  }),
  op("cargas", "c3", {
    codigo: "#3",
    cliente: "C",
    status: "Em trânsito",
    valor: "300",
    eta: "2026-06-25",
  }),
  op("cargas", "c4", {
    codigo: "#4",
    cliente: "D",
    status: "Aguardando",
    valor: "200",
    eta: "2026-06-05",
  }),
  op("fretes", "f1", { rota: "SP-RJ", custo: "1000", combustivel: "200", pedagio: "100" }),
  op("fretes", "f2", { rota: "SP-RJ", custo: "500", combustivel: "0", pedagio: "0" }),
  op("fretes", "f3", { rota: "SP-MG", custo: "300", combustivel: "100", pedagio: "50" }),
  op("frota", "v1", { placa: "AAA", status: "Disponível" }),
  op("frota", "v2", { placa: "BBB", status: "Manutenção" }),
];

describe("buildLogisticaMetrics", () => {
  it("conta cargas por status e calcula OTIF", () => {
    const m = buildLogisticaMetrics(records);
    expect(m.totalCargas).toBe(4);
    expect(m.entregues).toBe(1);
    expect(m.atrasadas).toBe(1);
    expect(m.emTransito).toBe(1);
    expect(m.aguardando).toBe(1);
    expect(m.otif).toBe(50); // 1 / (1 + 1)
  });

  it("soma valores e custo de frete (custo+combustível+pedágio)", () => {
    const m = buildLogisticaMetrics(records);
    expect(m.valorTotal).toBe(2000);
    expect(m.custoFreteTotal).toBe(2250); // 1300 + 500 + 450
  });

  it("calcula capacidade da frota disponível", () => {
    const m = buildLogisticaMetrics(records);
    expect(m.frotaTotal).toBe(2);
    expect(m.frotaDisponivel).toBe(1);
    expect(m.capacidadePct).toBe(50);
  });

  it("OTIF é null sem base; capacidade é 0", () => {
    // Este teste afirmava `otif === 0`, que era o defeito: sem nenhuma carga
    // entregue nem atrasada não houve medição, e "0%" com seta vermelha
    // afirma desempenho ruim onde não há dado.
    const m = buildLogisticaMetrics([]);
    expect(m.otif).toBeNull();
    expect(m.capacidadePct).toBe(0);
    expect(m.totalCargas).toBe(0);
  });
});

describe("freightByRoute", () => {
  it("agrega por rota e ordena pelo maior custo", () => {
    expect(freightByRoute(records)).toEqual([
      { rota: "SP-RJ", custo: 1800 },
      { rota: "SP-MG", custo: 450 },
    ]);
  });
});

describe("cargaStatusBreakdown", () => {
  it("conta cargas por status", () => {
    const breakdown = cargaStatusBreakdown(records);
    expect(breakdown).toContainEqual({ status: "Entregue", valor: 1 });
    expect(breakdown).toContainEqual({ status: "Atrasado", valor: 1 });
    expect(breakdown).toHaveLength(4);
  });
});

describe("slaCargas", () => {
  const AGORA = "2026-06-20T12:00:00.000Z";

  it("classifica as quatro situações, e entregue não é risco", () => {
    const sla = slaCargas(records, AGORA);
    const por = (codigo: string) => sla.find((s) => s.codigo === codigo)!;
    // c1 entregue: sai de qualquer lista de risco, independente da ETA.
    expect(por("#1").nivel).toBe("ok");
    expect(por("#1").fonte).toBe("status");
    // c2: status escrito à mão vence o cálculo — é declaração de quem está lá.
    expect(por("#2").nivel).toBe("estourado");
    expect(por("#2").motivo).toBe("Status atrasado");
    // c3: ETA daqui a 5 dias.
    expect(por("#3").nivel).toBe("ok");
    // c4: ETA de 15 dias atrás.
    expect(por("#4").nivel).toBe("estourado");
    expect(por("#4").motivo).toBe("ETA vencida");
  });

  it("devolve TODAS as cargas, não só as violadas", () => {
    // É o que permite a tabela existir quando está tudo em dia — antes ela
    // sumia da tela, e sumiço parece defeito.
    expect(slaCargas(records, AGORA)).toHaveLength(4);
  });

  it("ETA vale até o fim do dia — é promessa de dia, não de hora", () => {
    const hoje = [op("cargas", "x", { codigo: "#X", status: "Em trânsito", eta: "2026-06-20" })];
    // 12:00 do próprio dia da ETA: ainda dá tempo.
    expect(slaCargas(hoje, AGORA)[0].nivel).not.toBe("estourado");
    // 23:00 do dia seguinte: estourou.
    expect(slaCargas(hoje, "2026-06-21T23:00:00.000Z")[0].nivel).toBe("estourado");
  });

  it("avisa ANTES de estourar, na janela configurada", () => {
    const carga = [
      op("cargas", "y", {
        codigo: "#Y",
        status: "Em trânsito",
        origem: "Cristalina/GO",
        destino: "São Paulo/SP",
        saida: "2026-06-20T00:00:00.000Z",
      }),
    ];
    const rota = op("rotas", "r1", {
      nome: "Cristalina → São Paulo",
      origem: "Cristalina/GO",
      destino: "São Paulo/SP",
      sla: "18",
    });
    // Saiu à 00h com 18h de prazo: vence às 18h. Às 12h faltam 6h.
    const sla = slaCargas([...carga, rota], AGORA, { horasPadrao: 24, avisoHoras: 6 });
    expect(sla[0].nivel).toBe("em_risco");
    expect(sla[0].fonte).toBe("rota");
    expect(sla[0].motivo).toContain("Vence em");
  });

  it("usa o prazo da rota quando não há ETA digitada", () => {
    // O campo `sla` da aba Rotas existia no cadastro e não entrava em cálculo
    // nenhum — era um KPI decorativo.
    const carga = op("cargas", "z", {
      codigo: "#Z",
      status: "Em trânsito",
      origem: "Cristalina/GO",
      destino: "São Paulo/SP",
      saida: "2026-06-18T00:00:00.000Z",
    });
    const rota = op("rotas", "r1", {
      origem: "Cristalina/GO",
      destino: "São Paulo/SP",
      sla: "18",
    });
    const sla = slaCargas([carga, rota], AGORA);
    expect(sla[0].fonte).toBe("rota");
    expect(sla[0].nivel).toBe("estourado");
    expect(sla[0].motivo).toBe("Prazo da rota vencido");
  });

  it("cai no prazo padrão quando não há ETA nem rota casada", () => {
    const carga = op("cargas", "w", {
      codigo: "#W",
      status: "Em trânsito",
      origem: "Lugar Nenhum",
      destino: "Outro Lugar",
      saida: "2026-06-18T00:00:00.000Z",
    });
    const sla = slaCargas([carga], AGORA, { horasPadrao: 24, avisoHoras: 6 });
    expect(sla[0].fonte).toBe("padrao");
    expect(sla[0].nivel).toBe("estourado");
  });

  it("carga tratada sai das pendências", () => {
    const tratada = op("cargas", "t", {
      codigo: "#T",
      status: "Atrasado",
      eta: "2026-06-05",
      sla_tratado_em: "2026-06-19T10:00:00.000Z",
      sla_tratado_nivel: "estourado",
      sla_tratado_eta: "2026-06-05",
    });
    const sla = slaCargas([tratada], AGORA);
    expect(sla[0].tratado).toBe(true);
    expect(slaPendentes(sla)).toHaveLength(0);
    expect(slaResumo(sla).tratadas).toBe(1);
  });

  it("reabre quando o nível piora — tratar não é sumir para sempre", () => {
    const tratadaComoRisco = op("cargas", "t2", {
      codigo: "#T2",
      status: "Atrasado",
      eta: "2026-06-05",
      sla_tratado_em: "2026-06-19T10:00:00.000Z",
      sla_tratado_nivel: "em_risco",
      sla_tratado_eta: "2026-06-05",
    });
    expect(slaCargas([tratadaComoRisco], AGORA)[0].tratado).toBe(false);
  });

  it("reabre quando a ETA é remarcada", () => {
    const remarcada = op("cargas", "t3", {
      codigo: "#T3",
      status: "Atrasado",
      eta: "2026-06-30",
      sla_tratado_em: "2026-06-19T10:00:00.000Z",
      sla_tratado_nivel: "estourado",
      sla_tratado_eta: "2026-06-05",
    });
    expect(slaCargas([remarcada], AGORA)[0].tratado).toBe(false);
  });

  it("slaPendentes põe o que já estourou na frente", () => {
    const sla = slaCargas(records, AGORA);
    const pend = slaPendentes(sla);
    expect(pend.every((p) => p.nivel !== "ok")).toBe(true);
    expect(pend[0].nivel).toBe("estourado");
  });

  it("slaResumo conta as quatro categorias", () => {
    const r = slaResumo(slaCargas(records, AGORA));
    expect(r.estourado).toBe(2);
    expect(r.ok).toBe(2);
    expect(r.tratadas).toBe(0);
  });
});

describe("OTIF sem base de cálculo", () => {
  it("é null, não 0 — nunca houve medição", () => {
    // O KPI testava `=== null` desde sempre, mas o tipo era `number` e o valor
    // 0: a tela mostrava "0%" com seta vermelha, afirmando desempenho ruim
    // onde não havia nada medido.
    const semEntregaNemAtraso = [op("cargas", "u", { codigo: "#U", status: "Em trânsito" })];
    expect(buildLogisticaMetrics(semEntregaNemAtraso).otif).toBeNull();
    expect(buildLogisticaMetrics(records).otif).toBe(50);
  });
});
