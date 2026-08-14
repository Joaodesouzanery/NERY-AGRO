// Casa o `talhao` (texto livre) de um apontamento (ex.: carbono) ao nome/número
// do talhão do 360. Igualdade normalizada (acento/caixa) ou por número.
function norm(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function talhaoMatches(carbonTalhao: string, alvo: string): boolean {
  const a = norm(carbonTalhao);
  const b = norm(alvo);
  if (!a || !b) return false;
  if (a === b) return true;
  const da = a.replace(/\D+/g, "");
  const db = b.replace(/\D+/g, "");
  return da !== "" && da === db; // "Talhão 03" ~ "03"
}
