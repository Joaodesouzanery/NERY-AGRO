import {
  AlertTriangle,
  Banknote,
  Boxes,
  Calculator,
  ClipboardList,
  FileSignature,
  FileText,
  Landmark,
  MapPin,
  Scale,
  ShoppingCart,
  Sprout,
  Tags,
} from "lucide-react";
import type { FinancialRecord } from "@/lib/supabase-financial";

// Configuração das 15 abas do Financeiro. Vive fora do componente porque a
// rota (export do módulo inteiro) e o builder da visão geral precisam dela —
// e exportar constante de arquivo de componente atrapalha o fast refresh.

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
};

export type ModuleConfig = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
};
export type RecordsByModule = Record<string, FinancialRecord[]>;

export const financialModules: ModuleConfig[] = [
  {
    id: "fluxo",
    label: "Fluxo de Caixa Simples",
    shortLabel: "Fluxo",
    description: "Registro de entradas e saídas adaptado ao produtor.",
    icon: Banknote,
    fields: [
      { key: "descricao", label: "Descrição" },
      { key: "tipo", label: "Tipo" },
      { key: "categoria", label: "Categoria" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "data", label: "Data", type: "date" },
    ],
  },
  {
    id: "custos",
    label: "Custos por Unidade",
    shortLabel: "Custos",
    description: "Cálculo automático do custo de produção por dúzia, saca ou kg.",
    icon: Calculator,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "unidade", label: "Unidade" },
      { key: "custo_total", label: "Custo total", type: "number" },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "preco_venda", label: "Preço venda", type: "number" },
    ],
  },
  {
    id: "inadimplencia",
    label: "Controle de Inadimplência",
    shortLabel: "Inadimplência",
    description: "Alertas de pagamentos pendentes de clientes.",
    icon: AlertTriangle,
    fields: [
      { key: "cliente", label: "Cliente" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "vencimento", label: "Vencimento", type: "date" },
      { key: "status", label: "Status" },
      { key: "alerta_dias", label: "Alerta dias", type: "number" },
      { key: "etapa_regua", label: "Etapa da régua" },
      { key: "canal", label: "Canal" },
    ],
  },
  {
    id: "estoque",
    label: "Gestão de Estoque de Produtos Acabados",
    shortLabel: "Estoque",
    description: "Produtos prontos para venda imediata, reservas e validade.",
    icon: Boxes,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "saldo", label: "Saldo", type: "number" },
      { key: "reservado", label: "Reservado", type: "number" },
      { key: "validade", label: "Validade", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "equilibrio",
    label: "Cálculo de Ponto de Equilíbrio",
    shortLabel: "Equilíbrio",
    description: "Quanto vender para cobrir os custos.",
    icon: Scale,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "preco_venda", label: "Preço venda", type: "number" },
      { key: "custo_variavel", label: "Custo variável", type: "number" },
      { key: "custo_fixo", label: "Custo fixo", type: "number" },
    ],
  },
  {
    id: "compras",
    label: "Gestão de Compras",
    shortLabel: "Compras",
    description: "Lista baseada na necessidade de insumos.",
    icon: ShoppingCart,
    fields: [
      { key: "insumo", label: "Insumo" },
      { key: "estoque_atual", label: "Estoque atual", type: "number" },
      { key: "estoque_minimo", label: "Estoque mínimo", type: "number" },
      { key: "consumo_semanal", label: "Consumo semanal", type: "number" },
      { key: "fornecedor", label: "Fornecedor" },
    ],
  },
  {
    id: "credito",
    label: "Controle de Crédito Rural",
    shortLabel: "Crédito",
    description: "Acompanhamento de parcelas de financiamentos.",
    icon: Landmark,
    fields: [
      { key: "contrato", label: "Contrato" },
      { key: "banco", label: "Banco" },
      { key: "saldo_devedor", label: "Saldo devedor", type: "number" },
      { key: "parcela", label: "Parcela", type: "number" },
      { key: "vencimento", label: "Vencimento", type: "date" },
    ],
  },
  {
    id: "precos",
    label: "Tabela de Preços Dinâmica",
    shortLabel: "Preços",
    description: "Preços para atacado, varejo e assinaturas.",
    icon: Tags,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "varejo", label: "Varejo", type: "number" },
      { key: "atacado", label: "Atacado", type: "number" },
      { key: "assinatura", label: "Assinatura", type: "number" },
      { key: "promocao", label: "Promoção" },
    ],
  },
  {
    id: "hectare",
    label: "Custo por Hectare",
    shortLabel: "Hectare",
    description: "Real x planejado por talhão e por safra.",
    icon: MapPin,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "safra", label: "Safra" },
      { key: "real", label: "Real", type: "number" },
      { key: "planejado", label: "Planejado", type: "number" },
    ],
  },
  {
    id: "safra",
    label: "Orçamento de Safra",
    shortLabel: "Safra",
    description: "Insumos, mão de obra, maquinário e curva de desembolso.",
    icon: ClipboardList,
    fields: [
      { key: "etapa", label: "Etapa" },
      { key: "categoria", label: "Categoria" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "roi",
    label: "Rentabilidade Field-by-Field",
    shortLabel: "ROI",
    description: "ROI por talhão, híbrido e variedade.",
    icon: Sprout,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "hibrido", label: "Híbrido" },
      { key: "receita", label: "Receita", type: "number" },
      { key: "custo", label: "Custo", type: "number" },
    ],
  },
  {
    id: "arrendamento",
    label: "Controle de Arrendamento",
    shortLabel: "Arrendamento",
    description: "Custo por área, vencimentos e histórico de reajustes.",
    icon: FileText,
    fields: [
      { key: "contrato", label: "Contrato" },
      { key: "area", label: "Área ha", type: "number" },
      { key: "valor_ha", label: "R$/ha", type: "number" },
      { key: "vencimento", label: "Vencimento", type: "date" },
    ],
  },
  {
    id: "contratos",
    label: "Gestão de Contratos",
    shortLabel: "Contratos",
    description: "Compra de insumos, venda de grãos e fixações.",
    icon: FileSignature,
    fields: [
      { key: "contrato", label: "Contrato" },
      { key: "tipo", label: "Tipo" },
      { key: "contraparte", label: "Contraparte" },
      { key: "quantidade", label: "Qtd. contratada", type: "number" },
      { key: "qtd_liquidada", label: "Qtd. liquidada", type: "number" },
      { key: "vigencia_fim", label: "Vigência (fim)", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "autorizacao",
    label: "Autorizações de Verba",
    shortLabel: "Autorizações",
    description: "Verba autorizada x alocada x realizada por centro de custo e safra.",
    icon: Landmark,
    fields: [
      { key: "centro_custo", label: "Centro de custo" },
      { key: "safra", label: "Safra" },
      { key: "tipo_verba", label: "Tipo de verba", type: "text" },
      { key: "valor_autorizado", label: "Valor autorizado", type: "number" },
      { key: "valor_alocado", label: "Valor alocado", type: "number" },
      { key: "valor_realizado", label: "Valor realizado", type: "number" },
      { key: "vigencia_inicio", label: "Início vigência", type: "date" },
      { key: "vigencia_fim", label: "Fim vigência", type: "date" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "cenario",
    label: "Cenários de Fluxo",
    shortLabel: "Cenários",
    description: "Projeções de caixa por premissa (preço, produtividade, data de colheita).",
    icon: Scale,
    fields: [
      { key: "nome", label: "Cenário" },
      { key: "horizonte_semanas", label: "Horizonte (semanas)", type: "number" },
      { key: "inflows", label: "Entradas previstas", type: "number" },
      { key: "outflows", label: "Saídas previstas", type: "number" },
      { key: "premissas", label: "Premissas" },
    ],
  },
];
