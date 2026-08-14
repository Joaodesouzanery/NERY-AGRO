import type { TalhaoPayload } from "@/features/talhao-360/types/domain";

// Seções do assistente de cadastro do talhão. Ficam aqui — dado puro, sem React
// — porque duas telas dependem da MESMA lista: o formulário em etapas
// (registration-tab) e o KPI/gráfico de "cadastro preenchido" da visão geral.
// Duplicar a lista faria os dois números divergirem no primeiro campo novo.

export type CadastroField = [
  keyof TalhaoPayload,
  string,
  "text" | "number" | "date" | "select" | "textarea",
  string[]?,
];

export type CadastroSection = { title: string; desc: string; fields: CadastroField[] };

export const CADASTRO_SECTIONS: CadastroSection[] = [
  {
    title: "Identificação",
    desc: "Nome, código, fazenda e responsável",
    fields: [
      ["talhao", "Nome do talhão", "text"],
      ["codigo", "Código interno", "text"],
      ["fazenda", "Fazenda", "text"],
      ["area_ha", "Área calculada (ha)", "number"],
      ["area_util", "Área útil (ha)", "number"],
      ["responsavel", "Responsável", "text"],
      [
        "status",
        "Status",
        "select",
        ["Plantado", "Em preparo", "Colhido", "Pousio", "Planejado", "Inativo"],
      ],
      ["observacoes", "Observações", "textarea"],
    ],
  },
  {
    title: "Solo",
    desc: "Física, química e conservação do solo",
    fields: [
      ["tipo_solo", "Tipo predominante", "text"],
      ["textura_solo", "Textura", "text"],
      ["profundidade_efetiva", "Profundidade efetiva", "text"],
      ["drenagem", "Drenagem", "text"],
      ["materia_organica", "Matéria orgânica (%)", "number"],
      ["ph", "pH", "number"],
      ["compactacao", "Compactação", "text"],
      ["erosao", "Erosão", "text"],
      ["ultima_analise_solo", "Última análise", "date"],
    ],
  },
  {
    title: "Agronomia",
    desc: "Aptidão, culturas e sensibilidades",
    fields: [
      ["aptidao_agricola", "Aptidão agrícola", "text"],
      ["cultura_recomendada", "Cultura principal recomendada", "text"],
      ["culturas_alternativas", "Culturas alternativas", "text"],
      ["produtividade_historica", "Produtividade histórica", "number"],
      ["necessidade_calagem", "Necessidade de calagem", "text"],
      ["necessidade_gessagem", "Necessidade de gessagem", "text"],
      ["sensibilidade_estiagem", "Sensibilidade à estiagem", "text"],
      ["sensibilidade_encharcamento", "Sensibilidade ao encharcamento", "text"],
    ],
  },
  {
    title: "Infraestrutura",
    desc: "Acesso, água, energia e estruturas do talhão",
    fields: [
      ["acesso", "Acesso", "text"],
      ["distancia_sede_km", "Distância da sede (km)", "number"],
      ["irrigacao", "Irrigação", "text"],
      ["energia", "Energia", "text"],
      ["armazenamento_proximo", "Armazenamento próximo", "text"],
      ["pontos_agua", "Pontos de água", "text"],
      ["cercas", "Cercas", "text"],
      ["estradas_internas", "Estradas internas", "text"],
    ],
  },
  {
    title: "Classificação estratégica",
    desc: "Papel do talhão no portfólio da fazenda",
    fields: [
      [
        "classificacao_estrategica",
        "Classificação",
        "select",
        ["Estratégico", "Alto potencial", "Problemático", "Em recuperação", "Experimental"],
      ],
    ],
  },
];

/** Quantos campos da seção já têm valor no payload do talhão. */
export function cadastroSectionFilled(
  section: CadastroSection,
  payload: Partial<TalhaoPayload>,
): number {
  return section.fields.filter(([key]) => String(payload[key] ?? "").trim() !== "").length;
}

/** % de campos preenchidos do cadastro inteiro — resumo da Visão Geral. */
export function cadastroCompleteness(payload: Partial<TalhaoPayload>): number {
  const total = CADASTRO_SECTIONS.reduce((acc, section) => acc + section.fields.length, 0);
  const filled = CADASTRO_SECTIONS.reduce(
    (acc, section) => acc + cadastroSectionFilled(section, payload),
    0,
  );
  return total ? Math.round((filled / total) * 100) : 0;
}
