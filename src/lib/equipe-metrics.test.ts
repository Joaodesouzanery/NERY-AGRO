import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import { buildEquipeMetrics } from "./equipe-metrics";

function rec(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return { id, area: "equipe-vendas", module, payload };
}

describe("buildEquipeMetrics", () => {
  const vendas = [
    rec("vendas", "1", { canal: "Feira", valor: "1280" }),
    rec("vendas", "2", { canal: "WhatsApp", valor: "640" }),
    rec("vendas", "3", { canal: "Feira", valor: "360" }),
  ];
  const maoDeObra = [
    rec("mao_de_obra", "1", { mao_obra: "240", horas: "8" }),
    rec("mao_de_obra", "2", { mao_obra: "120", horas: "4" }),
  ];
  const tarefas = [
    rec("tarefas", "1", { status: "Pendente" }),
    rec("tarefas", "2", { status: "Concluída" }),
    rec("tarefas", "3", { status: "Em andamento" }),
  ];

  it("soma vendas, ticket médio e custo de mão de obra", () => {
    const m = buildEquipeMetrics({ vendas, maoDeObra, tarefas });
    expect(m.vendasTotal).toBe(2280);
    expect(m.vendasCount).toBe(3);
    expect(m.ticketMedio).toBe(760); // 2280 / 3
    expect(m.custoMaoObra).toBe(360);
    expect(m.horasTotais).toBe(12);
  });

  it("conta tarefas pendentes (não concluídas)", () => {
    const m = buildEquipeMetrics({ tarefas });
    expect(m.tarefasTotal).toBe(3);
    expect(m.tarefasPendentes).toBe(2); // Pendente + Em andamento
  });

  it("agrega vendas por canal, maior primeiro", () => {
    const m = buildEquipeMetrics({ vendas });
    expect(m.vendasPorCanal).toEqual([
      { canal: "Feira", valor: 1640 },
      { canal: "WhatsApp", valor: 640 },
    ]);
  });

  it("lida com entrada vazia", () => {
    const m = buildEquipeMetrics({});
    expect(m.vendasTotal).toBe(0);
    expect(m.ticketMedio).toBe(0);
    expect(m.vendasPorCanal).toEqual([]);
  });
});
