import type { OperationRecord } from "@/lib/supabase-operations";

// Métricas puras de Equipe & Vendas — testáveis e reutilizadas pelo dashboard
// da aba e (via somas) pela Torre/COGS.

function num(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export type EquipeMetrics = {
  vendasTotal: number;
  vendasCount: number;
  ticketMedio: number;
  custoMaoObra: number;
  horasTotais: number;
  tarefasPendentes: number;
  tarefasTotal: number;
  vendasPorCanal: Array<{ canal: string; valor: number }>;
};

export function buildEquipeMetrics(input: {
  vendas?: OperationRecord[];
  maoDeObra?: OperationRecord[];
  tarefas?: OperationRecord[];
}): EquipeMetrics {
  const vendas = input.vendas ?? [];
  const maoDeObra = input.maoDeObra ?? [];
  const tarefas = input.tarefas ?? [];

  const vendasTotal = vendas.reduce((sum, v) => sum + num(v.payload.valor), 0);
  const vendasCount = vendas.length;
  const custoMaoObra = maoDeObra.reduce((sum, m) => sum + num(m.payload.mao_obra), 0);
  const horasTotais = maoDeObra.reduce((sum, m) => sum + num(m.payload.horas), 0);
  const tarefasPendentes = tarefas.filter(
    (t) =>
      !["conclu", "feita", "feito"].some((k) => (t.payload.status ?? "").toLowerCase().includes(k)),
  ).length;

  const canalMap = new Map<string, number>();
  for (const v of vendas) {
    const canal = v.payload.canal?.trim() || "Outros";
    canalMap.set(canal, (canalMap.get(canal) ?? 0) + num(v.payload.valor));
  }

  return {
    vendasTotal,
    vendasCount,
    ticketMedio: vendasCount ? Math.round(vendasTotal / vendasCount) : 0,
    custoMaoObra,
    horasTotais,
    tarefasPendentes,
    tarefasTotal: tarefas.length,
    vendasPorCanal: [...canalMap.entries()]
      .map(([canal, valor]) => ({ canal, valor }))
      .sort((a, b) => b.valor - a.valor),
  };
}
