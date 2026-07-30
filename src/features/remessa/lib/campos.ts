import type { RomaneioKind } from "@/lib/romaneio-parse";

// Definição dos campos por tipo de apontamento. Fica fora do componente porque
// a conferência (colar/OCR), a conciliação e o formulário nativo falam do mesmo
// vocabulário — e porque exportar constante de arquivo de componente atrapalha
// o fast refresh.

export const KIND_LABEL: Record<RomaneioKind, string> = {
  remessa: "Remessa / Recebimento",
  corte: "Colheita / Corte",
  carregamento: "Carregamento (chapas)",
  diarias: "Diárias / Mão de obra",
  "caixas-vazias": "Caixas vazias",
  desconhecido: "Não identificado",
};

export type CampoDef = { key: string; label: string };

export const KIND_FIELDS: Record<RomaneioKind, CampoDef[]> = {
  remessa: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "talhao", label: "Talhão" },
    { key: "pivo", label: "Pivô" },
    { key: "cultura", label: "Cultura" },
    { key: "variedade", label: "Variedade" },
    { key: "placa", label: "Placa" },
    { key: "motorista", label: "Motorista" },
    { key: "qtd_caixas", label: "Qtd. caixas" },
    { key: "unidade", label: "Unidade" },
    { key: "peso_bruto", label: "Peso bruto" },
    { key: "tara", label: "Tara" },
    { key: "peso_liquido", label: "Peso líquido" },
    { key: "media", label: "Média (kg/cx)" },
    { key: "hora_saida", label: "Hora saída" },
    { key: "hora_chegada", label: "Hora chegada" },
    { key: "ficou_na_lavoura", label: "Ficou na lavoura" },
    { key: "ordem_producao", label: "Ordem de produção" },
    { key: "romaneio_num", label: "Nº do romaneio" },
    { key: "local_descarga", label: "Local de descarga" },
    { key: "pesagem_num", label: "Nº da pesagem" },
    { key: "cod_entrada", label: "Cód. de entrada" },
    { key: "peso_entrada", label: "Peso de entrada (balança)" },
    { key: "peso_saida", label: "Peso de saída (balança)" },
    { key: "peso_liquido_final", label: "Peso líquido final" },
    { key: "hora_entrada_balanca", label: "Hora entrada (balança)" },
    { key: "hora_saida_balanca", label: "Hora saída (balança)" },
    { key: "status", label: "Status" },
  ],
  corte: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "pivo", label: "Pivô" },
    { key: "talhao", label: "Talhão" },
    { key: "turma", label: "Turma" },
    { key: "cortadores", label: "Cortadores" },
    { key: "qtd_caixas", label: "Total de caixas" },
    { key: "media", label: "Média/pessoa" },
    { key: "carga_horaria", label: "Carga horária" },
    { key: "preco_caixa", label: "Preço/caixa" },
    { key: "total", label: "Total (R$)" },
    { key: "total_mao_obra", label: "Mão de obra (R$)" },
  ],
  carregamento: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "chapas", label: "Chapas" },
    { key: "qtd_caixas", label: "Total de caixas" },
    { key: "media", label: "Média/chapa" },
    { key: "preco_caixa", label: "Preço/caixa" },
    { key: "total", label: "Total (R$)" },
    { key: "carretas_vazias", label: "Carretas de vazias" },
    { key: "preco_carreta", label: "Preço/carreta" },
    { key: "carregamento_caixas", label: "Caixas (itens do carregamento)" },
    { key: "carregamento_total", label: "Total dos itens (R$)" },
  ],
  diarias: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "total_mao_obra", label: "Total mão de obra (R$)" },
  ],
  "caixas-vazias": [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "placa", label: "Placa" },
    { key: "tipo", label: "Tipo (saida_campo / retorno_campo)" },
    { key: "qtd_caixas", label: "Quantidade" },
    { key: "preco_unit", label: "Preço/unid." },
    { key: "valor", label: "Valor (R$)" },
  ],
  desconhecido: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "placa", label: "Placa" },
    { key: "qtd_caixas", label: "Quantidade" },
  ],
};

// Blobs JSON (detalhe de mão de obra / itens do carregamento): viajam no payload
// e são resumidos por outros campos — não fazem sentido como input de texto.
export const CAMPOS_INTERNOS = new Set(["mao_obra", "carregamento_itens"]);

const LABELS: Record<string, string> = Object.values(KIND_FIELDS)
  .flat()
  .reduce<Record<string, string>>((acc, f) => {
    acc[f.key] = acc[f.key] ?? f.label;
    return acc;
  }, {});

/** Rótulo humano de um campo do payload; cai na própria chave se for desconhecido. */
export function rotuloCampo(key: string): string {
  return LABELS[key] ?? key;
}
