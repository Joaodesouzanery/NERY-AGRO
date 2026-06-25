import { ATIVIDADES_AGRO, CLIMA_OPTIONS, type RdcFicha } from "@/features/rdc/types/domain";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * "Preencher com Texto" — best-effort: lê um texto livre do dia e tenta
 * marcar atividades/clima por palavras-chave e extrair responsável, deixando
 * o resto editável. Não substitui dados já preenchidos sem necessidade.
 */
export function fillFichaFromText(text: string, base: RdcFicha): RdcFicha {
  const norm = normalize(text);

  const atividades = ATIVIDADES_AGRO.filter((atividade) =>
    atividade.split(/[ /]+/).some((word) => word.length >= 4 && norm.includes(normalize(word))),
  );

  const clima =
    CLIMA_OPTIONS.find((c) => c !== "Outros" && norm.includes(normalize(c))) ?? base.clima;

  const respMatch = text.match(/respons[aá]vel[:\s-]+([^\n,.;]{2,40})/i);
  const localMatch = text.match(/(?:fazenda|local|obra)[:\s-]+([^\n,.;]{2,50})/i);

  return {
    ...base,
    clima,
    atividades: Array.from(new Set([...base.atividades, ...atividades])),
    responsavel: respMatch ? respMatch[1].trim() : base.responsavel,
    local: localMatch && !base.local ? localMatch[1].trim() : base.local,
    resumo: base.resumo ? base.resumo : text.trim().slice(0, 600),
  };
}
