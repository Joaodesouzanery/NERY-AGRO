// Busca de animal por brinco (ou SISBOV). Função pura: o componente só
// renderiza o que ela devolve.

export type AnimalBuscavel = {
  id: string;
  brinco_visual: string | null;
  sisbov: string | null;
};

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

/**
 * Filtra animais pelo texto digitado, priorizando quem COMEÇA com o termo.
 *
 * Digitando "20", o brinco 2010 vem antes de 1204 — quem digita o começo do
 * brinco quer o começo do brinco. Consulta vazia devolve os primeiros
 * `limite` animais, para a lista não abrir em branco.
 */
export function filtrarAnimais<T extends AnimalBuscavel>(
  animais: T[],
  consulta: string,
  limite = 8,
): T[] {
  const q = norm(consulta);
  if (!q) return animais.slice(0, limite);

  const pontuar = (a: T): number => {
    const brinco = norm(a.brinco_visual);
    const sisbov = norm(a.sisbov);
    if (brinco === q) return 0; // exato
    if (brinco.startsWith(q)) return 1; // começa com
    if (brinco.includes(q)) return 2; // contém
    if (sisbov.startsWith(q)) return 3;
    if (sisbov.includes(q)) return 4;
    return Number.POSITIVE_INFINITY; // não casa
  };

  return animais
    .map((a) => ({ a, p: pontuar(a) }))
    .filter((x) => Number.isFinite(x.p))
    .sort((x, y) => x.p - y.p || norm(x.a.brinco_visual).localeCompare(norm(y.a.brinco_visual)))
    .slice(0, limite)
    .map((x) => x.a);
}

/** O termo digitado corresponde exatamente a um brinco? (para confirmar com Enter) */
export function acharBrincoExato<T extends AnimalBuscavel>(animais: T[], consulta: string): T | null {
  const q = norm(consulta);
  if (!q) return null;
  return animais.find((a) => norm(a.brinco_visual) === q) ?? null;
}
