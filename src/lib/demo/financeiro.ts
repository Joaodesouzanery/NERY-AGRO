import type { RecordsByModule } from "@/lib/financeiro-config";
import type { FinancialRecord } from "@/lib/supabase-financial";

// Dados DEMO do Financeiro. Isolados do componente para nunca vazarem para o
// modo REAL e para o snapshot da Torre poder compô-los (fonte única de DEMO).

function record(module: string, id: string, payload: Record<string, string>): FinancialRecord {
  return { id: `${module}-demo-${id}`, module, payload };
}

export const demoFinancialRecords: RecordsByModule = {
  fluxo: [
    record("fluxo", "1", {
      descricao: "Venda de ovos caipira",
      tipo: "entrada",
      categoria: "Vendas",
      valor: "18400",
      data: "2026-05-22",
    }),
    record("fluxo", "2", {
      descricao: "Ração poedeiras",
      tipo: "saída",
      categoria: "Insumos",
      valor: "5200",
      data: "2026-05-21",
    }),
    record("fluxo", "3", {
      descricao: "Assinaturas de cestas",
      tipo: "entrada",
      categoria: "CSA",
      valor: "9700",
      data: "2026-05-19",
    }),
  ],
  custos: [
    record("custos", "1", {
      produto: "Ovos caipira",
      unidade: "dúzia",
      custo_total: "4820",
      quantidade: "1000",
      preco_venda: "9.90",
    }),
    record("custos", "2", {
      produto: "Mel",
      unidade: "kg",
      custo_total: "3100",
      quantidade: "220",
      preco_venda: "32",
    }),
  ],
  inadimplencia: [
    record("inadimplencia", "1", {
      cliente: "Mercado Central",
      valor: "3200",
      vencimento: "2026-05-20",
      status: "pendente",
      alerta_dias: "3",
      etapa_regua: "D+7",
      canal: "WhatsApp",
    }),
    record("inadimplencia", "2", {
      cliente: "Restaurante Aurora",
      valor: "5800",
      vencimento: "2026-06-02",
      status: "a vencer",
      alerta_dias: "5",
      etapa_regua: "D-3",
      canal: "E-mail",
    }),
  ],
  estoque: [
    record("estoque", "1", {
      produto: "Ovos caipira",
      saldo: "1240",
      reservado: "320",
      validade: "2026-06-08",
      status: "pronto",
    }),
    record("estoque", "2", {
      produto: "Mel silvestre",
      saldo: "180",
      reservado: "45",
      validade: "2027-01-10",
      status: "pronto",
    }),
  ],
  equilibrio: [
    record("equilibrio", "1", {
      produto: "Ovos caipira",
      preco_venda: "9.90",
      custo_variavel: "4.82",
      custo_fixo: "1200",
    }),
  ],
  compras: [
    record("compras", "1", {
      insumo: "Racao inicial",
      estoque_atual: "420",
      estoque_minimo: "800",
      consumo_semanal: "210",
      fornecedor: "Agro Sul",
    }),
    record("compras", "2", {
      insumo: "Caixas kraft",
      estoque_atual: "180",
      estoque_minimo: "300",
      consumo_semanal: "90",
      fornecedor: "Embalagens Norte",
    }),
  ],
  credito: [
    record("credito", "1", {
      contrato: "Custeio 2026",
      banco: "Banco do Brasil",
      saldo_devedor: "320000",
      parcela: "28400",
      vencimento: "2026-06-15",
    }),
  ],
  precos: [
    record("precos", "1", {
      produto: "Ovos caipira",
      varejo: "9.90",
      atacado: "8.40",
      assinatura: "7.80",
      promocao: "Combo semanal",
    }),
  ],
  hectare: [
    record("hectare", "1", {
      talhao: "Talhão A",
      safra: "2025/26",
      real: "3420",
      planejado: "3200",
    }),
  ],
  safra: [
    record("safra", "1", {
      etapa: "Plantio",
      categoria: "Insumos",
      valor: "48000",
      status: "aprovado",
    }),
  ],
  roi: [
    record("roi", "1", {
      talhao: "Talhão B",
      hibrido: "Pioneer P3380",
      receita: "412000",
      custo: "280000",
    }),
  ],
  arrendamento: [
    record("arrendamento", "1", {
      contrato: "Fazenda Vale Verde",
      area: "120",
      valor_ha: "1850",
      vencimento: "2026-09-30",
    }),
  ],
  contratos: [
    record("contratos", "1", {
      contrato: "Venda soja - Cargill",
      tipo: "Venda",
      contraparte: "Cargill",
      quantidade: "5000",
      qtd_liquidada: "3750",
      vigencia_fim: "2026-07-31",
      status: "Em aberto",
    }),
    record("contratos", "2", {
      contrato: "Compra fertilizante - Yara",
      tipo: "Compra insumo",
      contraparte: "Yara",
      quantidade: "120",
      qtd_liquidada: "120",
      vigencia_fim: "2026-02-28",
      status: "Liquidado",
    }),
  ],
  autorizacao: [
    record("autorizacao", "1", {
      centro_custo: "Talhão A · Soja",
      safra: "2025/26",
      tipo_verba: "insumos",
      valor_autorizado: "120000",
      valor_alocado: "86000",
      valor_realizado: "72000",
      vigencia_inicio: "2025-09-01",
      vigencia_fim: "2026-03-31",
      status: "em_execucao",
    }),
    record("autorizacao", "2", {
      centro_custo: "Geral · Mão de obra",
      safra: "2025/26",
      tipo_verba: "mao_obra",
      valor_autorizado: "80000",
      valor_alocado: "80000",
      valor_realizado: "64000",
      vigencia_inicio: "2025-09-01",
      vigencia_fim: "2026-06-30",
      status: "em_execucao",
    }),
    record("autorizacao", "3", {
      centro_custo: "Frota · Maquinário",
      safra: "2025/26",
      tipo_verba: "maquinario",
      valor_autorizado: "60000",
      valor_alocado: "30000",
      valor_realizado: "18000",
      vigencia_inicio: "2025-09-01",
      vigencia_fim: "2026-02-28",
      status: "aprovado",
    }),
  ],
  cenario: [
    record("cenario", "1", {
      nome: "Base",
      horizonte_semanas: "12",
      inflows: "540000",
      outflows: "410000",
      premissas: "Soja R$120/sc · colheita mar/26",
    }),
    record("cenario", "2", {
      nome: "Pessimista",
      horizonte_semanas: "12",
      inflows: "470000",
      outflows: "430000",
      premissas: "Soja R$105/sc · atraso 3 semanas",
    }),
  ],
};
