// Custos e resultado da pecuária — funções puras. Nada é persistido: custo/@,
// margem e arrobas produzidas saem sempre de cálculo sobre os lançamentos do
// Financeiro (centro de custo) e as pesagens.

/** 1 arroba = 15 kg de CARCAÇA. */
export const ARROBA_KG = 15;

export type CategoriaCusto = "alimentacao" | "aquisicao" | "sanidade" | "mao_de_obra" | "outros";

export const CATEGORIA_LABEL: Record<CategoriaCusto, string> = {
  alimentacao: "Alimentação",
  aquisicao: "Aquisição",
  sanidade: "Sanidade",
  mao_de_obra: "Mão de obra",
  outros: "Outros",
};

const REGRAS: Array<[CategoriaCusto, RegExp]> = [
  [
    "alimentacao",
    /ra[çc][ãa]o|suplement|aliment|cocho|milho|farelo|silag|sal mineral|volumoso|nutri/i,
  ],
  ["aquisicao", /aquisi|compra de (animal|gado|bezerr)|bezerr|boi magro|reposi[çc]|leil[ãa]o/i],
  ["sanidade", /vacin|verm[íi]fug|sanid|medicament|carrapaticid|antibi[óo]tic|vermifug/i],
  ["mao_de_obra", /m[ãa]o de obra|sal[áa]rio|folha|pe[ãa]o|funcion[áa]ri|encargo/i],
];

/** Classifica um lançamento pelo texto (categoria + descrição). */
export function categorizarCusto(texto: string | null | undefined): CategoriaCusto {
  if (!texto) return "outros";
  for (const [categoria, regex] of REGRAS) {
    if (regex.test(texto)) return categoria;
  }
  return "outros";
}

/**
 * Arrobas produzidas a partir do ganho de PESO VIVO.
 * @ = ganho de peso vivo × rendimento de carcaça ÷ 15 kg.
 * (com rendimento de 50% isso equivale ao atalho "ganho ÷ 30" do plano)
 */
export function arrobasProduzidas(ganhoPesoVivoKg: number, rendimentoCarcacaPct: number): number {
  if (ganhoPesoVivoKg <= 0 || rendimentoCarcacaPct <= 0) return 0;
  return (ganhoPesoVivoKg * rendimentoCarcacaPct) / ARROBA_KG;
}

/** Custo por arroba produzida. null quando não há arroba produzida (evita ÷0). */
export function custoPorArroba(custoAcumulado: number, arrobas: number): number | null {
  if (arrobas <= 0) return null;
  return custoAcumulado / arrobas;
}

/** Margem por arroba = preço de venda da @ − custo/@. */
export function margemPorArroba(
  precoArroba: number | null,
  custoArroba: number | null,
): number | null {
  // Sem preço de venda informado não há margem — só custo. Devolver um número
  // aqui espalharia a cotação inventada por toda a rentabilidade.
  if (precoArroba === null || custoArroba === null) return null;
  return precoArroba - custoArroba;
}

/** Resultado do lote = margem/@ × @ produzidas. */
export function resultadoLote(margemArroba: number | null, arrobas: number): number | null {
  if (margemArroba === null) return null;
  return margemArroba * arrobas;
}

export type PesagemPonto = { data: string; peso_kg: number };

/**
 * Ganho de peso vivo do animal = último peso − primeiro peso.
 * Com uma pesagem só não há ganho mensurável (retorna 0, não o peso de entrada).
 */
export function ganhoPesoAnimal(pesagens: PesagemPonto[]): number {
  if (pesagens.length < 2) return 0;
  const ord = [...pesagens].sort((a, b) => a.data.localeCompare(b.data));
  return Math.max(0, ord[ord.length - 1].peso_kg - ord[0].peso_kg);
}

export type CustoPorCategoria = Record<CategoriaCusto, number>;

export function custoVazio(): CustoPorCategoria {
  return { alimentacao: 0, aquisicao: 0, sanidade: 0, mao_de_obra: 0, outros: 0 };
}

/** Soma lançamentos já categorizados. */
export function somarCustos(
  lancamentos: Array<{ valor: number; texto: string | null | undefined }>,
): { total: number; porCategoria: CustoPorCategoria } {
  const porCategoria = custoVazio();
  let total = 0;
  for (const l of lancamentos) {
    if (!Number.isFinite(l.valor) || l.valor <= 0) continue;
    porCategoria[categorizarCusto(l.texto)] += l.valor;
    total += l.valor;
  }
  return { total, porCategoria };
}

/** Peso de carcaça a partir do peso vivo (romaneio). */
export function pesoCarcacaKg(pesoVivoKg: number, rendimentoCarcacaPct: number): number {
  return pesoVivoKg * rendimentoCarcacaPct;
}

/** Arrobas de carcaça de um animal pronto para venda. */
export function arrobasCarcaca(pesoVivoKg: number, rendimentoCarcacaPct: number): number {
  return pesoCarcacaKg(pesoVivoKg, rendimentoCarcacaPct) / ARROBA_KG;
}
