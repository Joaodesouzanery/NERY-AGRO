import type { FinancialRecord } from "@/lib/supabase-financial";
import { num } from "@/lib/overview/helpers";

// Régua de Cobrança derivada dos títulos cadastrados.
//
// Antes o painel era uma lista literal de 5 etapas (D-3 lembrete, D+1 aviso,
// D+7 formal, D+15 negativação, D+30 protesto) renderizada SEMPRE — e com um
// CheckCircle2 verde nas três primeiras, comunicando "já executadas". Nenhuma
// dessas etapas existia no banco: era desenho de processo lido como registro de
// cobrança feita, inclusive numa empresa sem um único título cadastrado.
//
// Agora cada etapa vem de `payload.etapa_regua` dos títulos, campo que já existe
// no formulário (financeiro-config.ts). Sem título com etapa preenchida, o
// painel some — não há régua a mostrar.

export type EtapaRegua = {
  /** Texto da etapa como o gestor escreveu (agrupador). */
  etapa: string;
  /** Títulos nessa etapa. */
  titulos: number;
  /** Soma dos valores em aberto na etapa. */
  valor: number;
  /** Canais distintos configurados nos títulos da etapa. */
  canais: string[];
  /** Menor prazo de alerta configurado na etapa, em dias. `null` se nenhum. */
  alertaDias: number | null;
};

/**
 * Agrupa os títulos por etapa da régua. Ordena por valor em aberto (a etapa que
 * concentra mais dinheiro parado vem primeiro), que é a pergunta do gestor.
 */
export function reguaEtapas(records: FinancialRecord[]): EtapaRegua[] {
  const porEtapa = new Map<
    string,
    { valor: number; titulos: number; canais: Set<string>; alertas: number[] }
  >();

  for (const record of records) {
    const etapa = String(record.payload.etapa_regua ?? "").trim();
    if (!etapa) continue;
    const atual = porEtapa.get(etapa) ?? {
      valor: 0,
      titulos: 0,
      canais: new Set<string>(),
      alertas: [],
    };
    atual.valor += num(record.payload.valor);
    atual.titulos += 1;
    const canal = String(record.payload.canal ?? "").trim();
    if (canal) atual.canais.add(canal);
    const dias = num(record.payload.alerta_dias);
    if (dias > 0) atual.alertas.push(dias);
    porEtapa.set(etapa, atual);
  }

  return [...porEtapa.entries()]
    .map(([etapa, dados]) => ({
      etapa,
      titulos: dados.titulos,
      valor: dados.valor,
      canais: [...dados.canais].sort(),
      alertaDias: dados.alertas.length ? Math.min(...dados.alertas) : null,
    }))
    .sort((a, b) => b.valor - a.valor || a.etapa.localeCompare(b.etapa));
}
