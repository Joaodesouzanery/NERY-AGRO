import { rotuloCampo } from "@/features/remessa/lib/campos";

// Painel de confronto entre duas fontes da MESMA carga: o que já está no
// formulário/registro × o que veio da foto (OCR) ou de outra mensagem.
// Regra: nada é sobrescrito sem o usuário escolher. Só campos divergentes ou
// novos são acionáveis; os iguais aparecem em cinza, para dar confiança de que
// as duas fontes batem.

export type EscolhaDiff = "atual" | "novo";

export type DiffLinha = {
  key: string;
  label: string;
  atual: string;
  novo: string;
  /** true quando as duas fontes dizem a mesma coisa (nada a decidir). */
  igual: boolean;
};

export function calcularDiff(
  atual: Record<string, string>,
  novo: Record<string, string>,
): DiffLinha[] {
  const keys = Array.from(new Set([...Object.keys(atual), ...Object.keys(novo)]));
  return keys
    .map((key) => {
      const a = (atual[key] ?? "").trim();
      const n = (novo[key] ?? "").trim();
      return { key, label: rotuloCampo(key), atual: a, novo: n, igual: a === n };
    })
    .filter((l) => l.atual || l.novo)
    .sort((a, b) => Number(a.igual) - Number(b.igual) || a.label.localeCompare(b.label, "pt-BR"));
}

/**
 * Preenche lacuna com a fonte nova, mas mantém o que o humano já conferiu quando
 * as duas fontes divergem de verdade — sobrescrever silenciosamente é o bug que
 * este painel existe para evitar.
 */
export function escolhasPadrao(linhas: DiffLinha[]): Record<string, EscolhaDiff> {
  const out: Record<string, EscolhaDiff> = {};
  for (const l of linhas) {
    if (l.igual) continue;
    out[l.key] = l.atual === "" && l.novo !== "" ? "novo" : "atual";
  }
  return out;
}

export function aplicarEscolhas(
  atual: Record<string, string>,
  linhas: DiffLinha[],
  escolhas: Record<string, EscolhaDiff>,
): Record<string, string> {
  const out = { ...atual };
  for (const l of linhas) {
    if (l.igual) {
      if (l.novo) out[l.key] = l.novo;
      continue;
    }
    out[l.key] = escolhas[l.key] === "novo" ? l.novo : l.atual;
  }
  return out;
}
