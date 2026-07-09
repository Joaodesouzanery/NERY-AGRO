import { createFinancialRecord } from "@/lib/supabase-financial";

// Transferência interna de valor (desmame): ao mover animal da cria para a
// recria, gera DOIS lançamentos espelhados no Financeiro — receita interna no
// centro de custo da cria e custo interno no da recria. Sem isso a cria nunca
// registra a receita do bezerro e aparece falsamente no vermelho.
//
// Grava em `financial_records` module='fluxo' (o lançamento de caixa que o
// Financeiro já lê). `origem_modulo` marca as linhas para auditoria/rollback.

export const ORIGEM_MODULO = "pecuaria-transferencia-interna";

export type TransferenciaInterna = {
  data: string; // YYYY-MM-DD
  valorTotal: number;
  cabecas: number;
  loteOrigemNome: string;
  loteDestinoNome: string;
  centroCustoOrigemNome: string | null;
  centroCustoDestinoNome: string | null;
};

/** Lança a receita interna (origem) e o custo interno (destino). */
export async function registrarTransferenciaInterna(t: TransferenciaInterna): Promise<void> {
  if (t.valorTotal <= 0 || t.cabecas <= 0) {
    throw new Error("Transferência interna exige valor e quantidade positivos.");
  }

  const valor = String(t.valorTotal);

  // Receita interna na CRIA (entrada). Não entra como custo em lugar nenhum.
  await createFinancialRecord({
    module: "fluxo",
    payload: {
      data: t.data,
      tipo: "entrada",
      valor,
      categoria: "Transferência interna",
      descricao: `Desmame: ${t.cabecas} cab. ${t.loteOrigemNome} → ${t.loteDestinoNome}`,
      centro_custo: t.centroCustoOrigemNome ?? "",
      origem_modulo: ORIGEM_MODULO,
    },
  });

  // Custo interno na RECRIA (saída). "Aquisição" para cair na categoria certa
  // do custo/@ do lote de destino.
  await createFinancialRecord({
    module: "fluxo",
    payload: {
      data: t.data,
      tipo: "saida",
      valor,
      categoria: "Aquisição interna",
      descricao: `Desmame: ${t.cabecas} cab. recebidas de ${t.loteOrigemNome}`,
      centro_custo: t.centroCustoDestinoNome ?? "",
      origem_modulo: ORIGEM_MODULO,
    },
  });
}

/** Valor de mercado por cabeça, pela categoria do animal (fallback: bezerro). */
export function valorPorCabeca(
  categoria: string | null,
  tabela: Record<string, number>,
): number | null {
  const chave = (categoria ?? "").toLowerCase().trim();
  if (chave && tabela[chave] !== undefined) return tabela[chave];
  return tabela.bezerro ?? null;
}
