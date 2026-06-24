import type { ComponentType } from "react";
import { Sprout, Beef, NotebookPen, Wrench } from "lucide-react";
import type { Secao } from "../types/domain";

export type RdcInput = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: string[];
  full?: boolean; // ocupa a linha inteira no grid
};

export type SecaoConfig = {
  secao: Secao;
  label: string;
  descricao: string;
  icon: ComponentType<{ className?: string }>;
  /** Vínculo oferecido no diálogo de item. */
  link: "talhao" | "animal" | "both" | "none";
  inputs: RdcInput[];
};

const SEVERIDADE = ["", "Baixa", "Atenção", "Alta"];

export const SECAO_CONFIGS: SecaoConfig[] = [
  {
    secao: "campo",
    label: "Campo",
    descricao: "Atividades, insumos, ocorrências e clima do dia no talhão.",
    icon: Sprout,
    link: "talhao",
    inputs: [
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: ["Atividade", "Insumo", "Ocorrência", "Clima"],
      },
      { key: "descricao", label: "Descrição", type: "textarea", full: true },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "unidade", label: "Unidade" },
      { key: "custo", label: "Custo (R$)", type: "number" },
      { key: "severidade", label: "Severidade", type: "select", options: SEVERIDADE },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ],
  },
  {
    secao: "pecuaria",
    label: "Pecuária",
    descricao: "Manejo, sanidade e observações do rebanho.",
    icon: Beef,
    link: "animal",
    inputs: [
      { key: "tipo", label: "Tipo", type: "select", options: ["Manejo", "Sanidade", "Observação"] },
      { key: "descricao", label: "Descrição", type: "textarea", full: true },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "unidade", label: "Unidade" },
      { key: "custo", label: "Custo (R$)", type: "number" },
      { key: "severidade", label: "Severidade", type: "select", options: SEVERIDADE },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ],
  },
  {
    secao: "observacoes",
    label: "Observações & Fotos",
    descricao: "Notas livres do dia e registro fotográfico do campo.",
    icon: NotebookPen,
    link: "both",
    inputs: [
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: ["Observação geral", "Nota", "Pendência"],
      },
      { key: "descricao", label: "Descrição", type: "textarea", full: true },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ],
  },
  {
    secao: "equipe",
    label: "Equipe & Máquinas",
    descricao: "Mão de obra e máquinas/implementos usados — alimenta custos/COGS.",
    icon: Wrench,
    link: "both",
    inputs: [
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: ["Mão de obra", "Implemento", "Máquina"],
      },
      { key: "descricao", label: "Descrição", type: "textarea", full: true },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "unidade", label: "Unidade" },
      { key: "custo", label: "Custo (R$)", type: "number" },
      { key: "status", label: "Status" },
      { key: "responsavel", label: "Responsável" },
    ],
  },
];

export const secaoConfig = (secao: Secao): SecaoConfig =>
  SECAO_CONFIGS.find((config) => config.secao === secao) ?? SECAO_CONFIGS[0];
