import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildLogisticaMetrics,
  cargaStatusBreakdown,
  freightByRoute,
  slaBreaches,
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

  it("OTIF/capacidade são 0 sem base", () => {
    const m = buildLogisticaMetrics([]);
    expect(m.otif).toBe(0);
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

describe("slaBreaches", () => {
  it("flagra status atrasado e ETA vencida (não-entregue), ignorando entregues", () => {
    const breaches = slaBreaches(records, "2026-06-20");
    // c2 (Atrasado) -> status; c4 (Aguardando, eta 2026-06-05 < hoje) -> ETA vencida.
    // c1 entregue é ignorado; c3 em trânsito com ETA futura não é breach.
    const codigos = breaches.map((b) => b.codigo).sort();
    expect(codigos).toEqual(["#2", "#4"]);
    expect(breaches.find((b) => b.codigo === "#2")?.motivo).toBe("Status atrasado");
    expect(breaches.find((b) => b.codigo === "#4")?.motivo).toBe("ETA vencida");
  });
});
