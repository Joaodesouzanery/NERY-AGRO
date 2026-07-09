// Conformidade por protocolo — funções puras. Cada animal é avaliado contra os
// protocolos de mercado. Nada é gravado: o status sai sempre da consulta.
//
// LIMITE HONESTO: o EUDR exige comprovar ausência de desmatamento após 2020.
// O sistema NÃO tem fonte de dado de desmate (nem imagem, nem base pública
// integrada). Portanto avaliamos apenas a RASTREABILIDADE da cadeia (origem
// declarada + CAR); o desmate fica como "não verificável" e NUNCA é reportado
// como conforme. Ver DESMATE_VERIFICAVEL.

export const DESMATE_VERIFICAVEL = false;

/** Boi China: idade máxima na data de abate. */
export const BOI_CHINA_IDADE_MAX_MESES = 30;

/** PNIB: identificação individual obrigatória (fêmeas primeiro). */
export const PNIB_PRAZO = "2027-01-01";

export type Protocolo = "sisbov" | "pnib" | "eudr" | "boi_china" | "estradiol";

export const PROTOCOLO_LABEL: Record<Protocolo, string> = {
  sisbov: "SISBOV",
  pnib: "PNIB",
  eudr: "EUDR",
  boi_china: "Boi China",
  estradiol: "Estradiol",
};

export const PROTOCOLO_DESCRICAO: Record<Protocolo, string> = {
  sisbov: "Número SISBOV válido",
  pnib: `Identificação individual (prazo ${PNIB_PRAZO.slice(0, 4)})`,
  eudr: "Cadeia rastreável com CAR de origem",
  boi_china: `Idade ≤ ${BOI_CHINA_IDADE_MAX_MESES} meses no abate projetado`,
  estradiol: "Sem registro de anabolizante",
};

export type StatusConformidade = "conforme" | "pendente" | "nao_avaliavel";

export type Conformidade = Record<Protocolo, StatusConformidade>;

export type AnimalParaConformidade = {
  sisbov: string | null;
  brinco_visual: string | null;
  origem: string | null;
  origem_car: string | null;
  sexo: string | null;
};

export type ContextoConformidade = {
  /** Tem evento sanitário com anabolizante/estradiol registrado. */
  temAnabolizante: boolean;
  /** Idade projetada (meses) na data de abate. null = sem nascimento/GMD. */
  idadeMesesNoAbate: number | null;
};

const preenchido = (v: string | null) => Boolean(v && v.trim());

/** Avalia um animal contra os cinco protocolos. */
export function avaliarConformidade(
  animal: AnimalParaConformidade,
  ctx: ContextoConformidade,
): Conformidade {
  const sisbov: StatusConformidade = preenchido(animal.sisbov) ? "conforme" : "pendente";
  const pnib: StatusConformidade = preenchido(animal.brinco_visual) ? "conforme" : "pendente";

  // EUDR: sem origem declarada não há cadeia. Comprado exige CAR do fornecedor.
  let eudr: StatusConformidade;
  if (!preenchido(animal.origem)) {
    eudr = "pendente";
  } else if (animal.origem === "nascido") {
    eudr = "conforme";
  } else {
    eudr = preenchido(animal.origem_car) ? "conforme" : "pendente";
  }

  const boi_china: StatusConformidade =
    ctx.idadeMesesNoAbate === null
      ? "nao_avaliavel"
      : ctx.idadeMesesNoAbate <= BOI_CHINA_IDADE_MAX_MESES
        ? "conforme"
        : "pendente";

  const estradiol: StatusConformidade = ctx.temAnabolizante ? "pendente" : "conforme";

  return { sisbov, pnib, eudr, boi_china, estradiol };
}

/** Detecta anabolizante/hormônio pelo produto do evento sanitário. */
export function ehAnabolizante(produto: string | null | undefined): boolean {
  if (!produto) return false;
  return /estradiol|anaboliz|horm[ôo]ni|zeranol|trembolona|acetato de melengestrol/i.test(produto);
}

export type Cobertura = { conformes: number; pendentes: number; total: number; pct: number };

/** Cobertura de um protocolo sobre um conjunto de animais (ignora não avaliáveis). */
export function coberturaProtocolo(conformidades: Conformidade[], protocolo: Protocolo): Cobertura {
  let conformes = 0;
  let pendentes = 0;
  for (const c of conformidades) {
    if (c[protocolo] === "conforme") conformes++;
    else if (c[protocolo] === "pendente") pendentes++;
  }
  const total = conformes + pendentes;
  return { conformes, pendentes, total, pct: total ? conformes / total : 0 };
}

export type RiscoArrobas = { protocolo: Protocolo; animais: number; arrobas: number };

/**
 * Traduz a pendência em arrobas fora do mercado premium: soma as @ de carcaça
 * dos animais pendentes em cada protocolo.
 */
export function riscoEmArrobas(
  itens: Array<{ conformidade: Conformidade; arrobas: number }>,
): RiscoArrobas[] {
  const protocolos: Protocolo[] = ["sisbov", "pnib", "eudr", "boi_china", "estradiol"];
  return protocolos
    .map((protocolo) => {
      const pendentes = itens.filter((i) => i.conformidade[protocolo] === "pendente");
      return {
        protocolo,
        animais: pendentes.length,
        arrobas: pendentes.reduce((s, i) => s + i.arrobas, 0),
      };
    })
    .filter((r) => r.animais > 0)
    .sort((a, b) => b.arrobas - a.arrobas);
}

/** Texto pronto para pedir o CAR ao fornecedor de um animal comprado. */
export function textoSolicitacaoCar(brinco: string, estabelecimento: string | null): string {
  const origem = estabelecimento?.trim() || "o estabelecimento de origem";
  return [
    `Prezados,`,
    ``,
    `Para atender à due diligence do Regulamento da União Europeia contra o`,
    `desmatamento (EUDR), precisamos do número do CAR (Cadastro Ambiental Rural)`,
    `de ${origem}, referente ao animal de brinco ${brinco} adquirido de vocês.`,
    ``,
    `Sem esse dado o animal não pode ser comercializado para o mercado europeu.`,
    ``,
    `Agradecemos o retorno.`,
  ].join("\n");
}
