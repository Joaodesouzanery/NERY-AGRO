import type { FieldRecord } from "@/lib/supabase-field";

// Módulos persistidos em field_records (mesmo padrão do Talhão 360):
// catálogo de produtos, lotes com validade e movimentações de estoque.
export const INSUMO_MODULES = {
  catalogo: "insumo-catalogo",
  lote: "insumo-lote",
  movimentacao: "insumo-movimentacao",
} as const;

export const insumoCategorias = [
  "Sementes",
  "Fertilizantes",
  "Corretivos",
  "Defensivos",
  "Biológicos",
  "Adjuvantes",
  "Ração",
  "Sal mineral e suplementos",
  "Medicamentos e vacinas",
  "Materiais gerais",
  "Combustível",
  "Outros",
] as const;
export type InsumoCategoria = (typeof insumoCategorias)[number];

export const insumoUnidades = ["kg", "t", "L", "mL", "sc", "un", "dose", "cx", "m³"] as const;

export const locaisEstoquePadrao = [
  "Almoxarifado central",
  "Depósito de defensivos",
  "Galpão da fazenda",
  "Tanque diesel",
  "Silo de ração",
  "Farmácia veterinária",
  "Estoque móvel",
] as const;

export const movimentacaoTipos = [
  "entrada",
  "saida",
  "reserva",
  "transferencia",
  "ajuste",
  "perda",
  "devolucao",
] as const;
export type MovimentacaoTipo = (typeof movimentacaoTipos)[number];

export const movimentacaoTipoLabel: Record<MovimentacaoTipo, string> = {
  entrada: "Entrada",
  saida: "Saída por atividade",
  reserva: "Reserva",
  transferencia: "Transferência",
  ajuste: "Ajuste de inventário",
  perda: "Perda/avaria/vencimento",
  devolucao: "Devolução",
};

export type ReservaStatus = "ativa" | "executada" | "cancelada";

export type InsumoPayload = Record<string, string> & {
  nome: string;
  categoria?: string;
  unidade?: string;
  fabricante?: string;
  fornecedor_padrao?: string;
  codigo_interno?: string;
  principio_ativo?: string;
  registro?: string;
  carencia_dias?: string;
  reentrada_horas?: string;
  estoque_minimo?: string;
  status?: string; // ativo | inativo
  observacao?: string;
};

export type LotePayload = Record<string, string> & {
  insumo_id: string;
  insumo?: string;
  numero?: string;
  fabricacao?: string;
  validade?: string;
  quantidade_inicial?: string;
  custo_unitario?: string;
  fornecedor?: string;
  nota_fiscal?: string;
  local?: string;
  status?: string; // disponivel | bloqueado
  observacao?: string;
};

export type MovimentacaoPayload = Record<string, string> & {
  tipo: string; // MovimentacaoTipo
  insumo_id: string;
  insumo?: string;
  lote_id?: string;
  lote?: string;
  quantidade?: string; // ajuste aceita valor negativo
  unidade?: string;
  data?: string;
  local?: string;
  local_destino?: string;
  talhao_id?: string;
  talhao?: string;
  safra?: string;
  ciclo?: string;
  operacao?: string;
  responsavel?: string;
  status?: string; // reserva: ativa | executada | cancelada
  custo_total?: string;
  observacao?: string;
};

export type InsumoRecord = Omit<FieldRecord, "payload"> & { payload: InsumoPayload };
export type LoteRecord = Omit<FieldRecord, "payload"> & { payload: LotePayload };
export type MovimentacaoRecord = Omit<FieldRecord, "payload"> & { payload: MovimentacaoPayload };

export type LoteResumo = {
  lote: LoteRecord;
  saldoFisico: number;
  reservado: number;
  disponivel: number;
  valorEmEstoque: number;
  vencido: boolean;
  diasParaVencer?: number;
};

export type InsumoResumo = {
  insumo: InsumoRecord;
  lotes: LoteResumo[];
  saldoFisico: number;
  reservado: number;
  disponivel: number;
  valorEmEstoque: number;
  abaixoDoMinimo: boolean;
};

export type InsumoAlerta = {
  id: string;
  severidade: "critico" | "atencao";
  titulo: string;
  descricao: string;
};

export type InsumosModel = {
  insumos: InsumoResumo[];
  movimentacoes: MovimentacaoRecord[];
  alertas: InsumoAlerta[];
  valorEmEstoque: number;
  valorReservado: number;
  lotesAVencer: number;
  lotesVencidos: number;
};
