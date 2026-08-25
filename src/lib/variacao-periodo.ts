import type { PeriodValue } from "@/components/period-picker";
import { localDateOf } from "@/lib/date-local";
import { filtrarRegistros, type RegistroFiltravel } from "@/lib/filtro-registros";

// Variação de um KPI contra o período imediatamente anterior.
//
// Nenhum KPI do produto comparava com o período anterior — a pílula de
// tendência do StatKpi existia, mas era alimentada à mão, KPI por KPI. Este
// motor calcula a comparação a partir dos REGISTROS, com o mesmo
// `filtrarRegistros` que a tela usa: o número da pílula sai do mesmo conjunto
// que o usuário está vendo, não de uma segunda contagem paralela.
//
// A regra de honestidade vem do guard `no-fake-data`: sem recorte de período
// não existe "anterior" (o que viria antes de "todo o período"?), e período
// anterior com valor zero não tem base de divisão. Nos dois casos o delta é
// `null` e o KPI simplesmente NÃO mostra pílula — nunca "0%", que afirmaria
// estabilidade onde não houve medição.

export type VariacaoPeriodo = {
  atual: number;
  /** Valor no período anterior. `null` quando não há recorte. */
  anterior: number | null;
  /** Percentual de variação. `null` = sem base de comparação (sem pílula). */
  deltaPct: number | null;
};

/**
 * A janela imediatamente anterior, com a MESMA duração.
 * "Este mês" (dia 1..hoje) compara com o bloco de mesmo tamanho logo antes —
 * não com o mês-calendário anterior inteiro, que teria outra duração.
 */
export function periodoAnterior(periodo: PeriodValue): PeriodValue | null {
  if (!periodo.start || !periodo.end) return null;
  // Meio-dia local: aritmética com `setDate` sem risco de escorregar de dia
  // por fuso — o mesmo padrão de src/lib/demo/logistica.ts.
  const inicio = new Date(`${periodo.start}T12:00:00`);
  const fim = new Date(`${periodo.end}T12:00:00`);
  const dias = Math.round((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;
  const fimAnterior = new Date(inicio);
  fimAnterior.setDate(fimAnterior.getDate() - 1);
  const inicioAnterior = new Date(inicio);
  inicioAnterior.setDate(inicioAnterior.getDate() - dias);
  return {
    granularity: "custom",
    start: localDateOf(inicioAnterior.toISOString()),
    end: localDateOf(fimAnterior.toISOString()),
    label: "período anterior",
  };
}

export function variacaoDePeriodo<T extends RegistroFiltravel>(
  /** Lista COMPLETA, sem filtro — o motor recorta os dois períodos. */
  registros: T[],
  periodo: PeriodValue,
  /** O que medir: `(r) => r.length`, uma soma de campo, etc. */
  extrator: (regs: T[]) => number,
): VariacaoPeriodo {
  const janelaAnterior = periodoAnterior(periodo);
  const atual = extrator(filtrarRegistros(registros, { periodo }));
  if (!janelaAnterior) return { atual, anterior: null, deltaPct: null };
  const anterior = extrator(filtrarRegistros(registros, { periodo: janelaAnterior }));
  if (anterior === 0) return { atual, anterior, deltaPct: null };
  return { atual, anterior, deltaPct: ((atual - anterior) / anterior) * 100 };
}

/** "+20,1%" / "−12,3%" em pt-BR. `null` continua `null` — sem pílula. */
export function formatoDelta(deltaPct: number | null): string | null {
  if (deltaPct === null) return null;
  return `${deltaPct.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
    signDisplay: "always",
  })}%`;
}
