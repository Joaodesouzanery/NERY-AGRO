// Modelos de relatório do talhão. Dado puro, compartilhado entre a aba
// Relatórios (que desenha os cartões e monta o PDF) e a visão geral (que mede
// quantas linhas cada modelo levaria hoje — modelo sem linha sai em branco).

export type ReportModelId =
  | "geral"
  | "custos"
  | "produtividade"
  | "agronomico"
  | "alertas"
  | "mapa";

export const REPORT_MODELS: Array<{ id: ReportModelId; nome: string; desc: string }> = [
  { id: "geral", nome: "Geral", desc: "Área · ciclos · timeline · alertas" },
  { id: "custos", nome: "Custos", desc: "Planejado × realizado por hectare" },
  { id: "produtividade", nome: "Produtividade", desc: "Histórico por ciclo e safra" },
  { id: "agronomico", nome: "Agronômico", desc: "Solo, aptidão e manejo" },
  { id: "alertas", nome: "Alertas", desc: "Ocorrências e resoluções" },
  { id: "mapa", nome: "Mapa e áreas", desc: "Geometria e medidas" },
];
