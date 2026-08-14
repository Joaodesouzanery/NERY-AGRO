import type { FinancialRecord } from "@/lib/supabase-financial";
import { localDateOf } from "@/lib/date-local";
import { demoLogisticaOperations } from "@/lib/demo/logistica";
import type { FieldRecord } from "@/lib/supabase-field";
import type { OperationRecord } from "@/lib/supabase-operations";
import type { CostCenter } from "@/lib/supabase-cost-centers";
import type { Contract } from "@/lib/supabase-contracts";
import { type AppSettings, EMPTY_SETTINGS } from "@/lib/app-settings";
import type { ConnectedAgroSnapshot } from "@/lib/connected-agro-data";

// VITRINE do mapa unificado e da Torre de Controle: o snapshot inteiro servido
// quando o modo DEMO está ligado.
//
// Morava dentro de connected-agro-data.ts, no meio do código de produção — 320
// linhas de dado fictício indistinguíveis do resto para qualquer verificação
// por caminho, o que impedia o teste-guarda de dado inventado de varrer aquele
// arquivo sem falso positivo. Aqui a separação é estrutural: tudo em
// src/lib/demo/ é vitrine, por definição.
//
// Nada daqui chega ao modo REAL: quem entrega é `useConnectedAgroData`, que só
// serve este objeto com o DEMO ligado e mantém a consulta real desligada por
// `enabled: !demoMode`.

function financial(module: string, id: string, payload: Record<string, string>): FinancialRecord {
  return { id: `demo-fin-${module}-${id}`, module, payload };
}

function operation(
  area: string,
  module: string,
  id: string,
  payload: Record<string, string>,
): OperationRecord {
  return { id: `demo-op-${area}-${module}-${id}`, area, module, payload };
}

function field(module: string, id: string, payload: Record<string, string>): FieldRecord {
  return { id: `demo-field-${module}-${id}`, module, payload };
}

// Centros de custo demo (mostram variância orçado×realizado e drill-down por talhão).
export const demoCostCenters: CostCenter[] = [
  {
    id: "cc-ins-14",
    nome: "Insumos — Talhão 14",
    tipo: "insumos",
    safra: "2025/26",
    talhao_id: "Talhão 14",
    valor_autorizado: 80000,
    valor_alocado: 78000,
    valor_realizado: 76000,
    vigencia_inicio: "2025-10-01",
    vigencia_fim: "2026-08-31",
    status: "ativo",
  },
  {
    id: "cc-ins-03",
    nome: "Insumos — Talhão 03",
    tipo: "insumos",
    safra: "2025/26",
    talhao_id: "Talhão 03",
    valor_autorizado: 60000,
    valor_alocado: 60000,
    valor_realizado: 63000, // estouro → alerta danger
    vigencia_inicio: "2025-10-01",
    vigencia_fim: "2026-08-31",
    status: "ativo",
  },
  {
    id: "cc-mao",
    nome: "Mão de obra — Safra",
    tipo: "mao_obra",
    safra: "2025/26",
    talhao_id: null,
    valor_autorizado: 40000,
    valor_alocado: 38000,
    valor_realizado: 32000,
    vigencia_inicio: "2025-10-01",
    vigencia_fim: "2026-08-31",
    status: "ativo",
  },
  {
    id: "cc-maq",
    nome: "Maquinário",
    tipo: "maquinario",
    safra: "2025/26",
    talhao_id: null,
    valor_autorizado: 30000,
    valor_alocado: 28000,
    valor_realizado: 21000,
    vigencia_inicio: "2025-10-01",
    vigencia_fim: "2026-08-31",
    status: "ativo",
  },
];

// Contratos demo: custo vinculado a centro + venda (receita) + um vencendo (renovação).
export const demoContracts: Contract[] = [
  {
    id: "ct-ins-14",
    contrato: "Fornecimento de fertilizante",
    tipo: "compra_insumo",
    contraparte: "AgroInsumos LTDA",
    cost_center_id: "cc-ins-14",
    talhao_id: "Talhão 14",
    vigencia_inicio: "2025-11-01",
    vigencia_fim: "2026-07-28", // vence em ~2 semanas → alerta de renovação
    qtd_contratada: 1000,
    qtd_liquidada: 900,
    preco_unit: 4,
    valor: 4000,
    status: "ativo",
  },
  {
    id: "ct-venda-14",
    contrato: "Venda de cebola — Talhão 14",
    tipo: "venda_graos",
    contraparte: "Ceagesp",
    cost_center_id: null,
    talhao_id: "Talhão 14",
    vigencia_inicio: "2026-05-01",
    vigencia_fim: "2026-12-01",
    qtd_contratada: 2000,
    qtd_liquidada: 1200,
    preco_unit: 95,
    valor: 190000,
    status: "ativo",
  },
];

// Configurações da VITRINE. Beneficiamento e coordenadas de fazenda saíram do
// código (eram de um cliente real, e apareciam no mapa de todo mundo) e viraram
// configuração da empresa — então a vitrine precisa das suas, senão o mapa demo
// perde a rota origem→beneficiamento que ela existe para demonstrar. Nomes e
// coordenadas aqui são fictícios de propósito.
export const DEMO_SETTINGS: AppSettings = {
  ...EMPTY_SETTINGS,
  beneficiamento: { nome: "Central de Beneficiamento (demo)", lat: -16.78, lng: -47.55 },
  fazendaCoords: {
    sato: { lat: -16.7, lng: -47.7 },
    nascente: { lat: -16.85, lng: -47.65 },
    "monte alto": { lat: -16.72, lng: -47.5 },
  },
};

function build(now: Date): ConnectedAgroSnapshot {
  return {
    pecuariaCabecas: 1,
    costCenters: demoCostCenters,
    contracts: demoContracts,
    settings: DEMO_SETTINGS,
    financial: [
      financial("fluxo", "1", {
        descricao: "Venda de cestas e ovos",
        tipo: "entrada",
        categoria: "Vendas",
        valor: "148000",
        data: "2026-05-30",
      }),
      financial("fluxo", "2", {
        descricao: "Insumos e embalagens",
        tipo: "saida",
        categoria: "Custos",
        valor: "62400",
        data: "2026-05-29",
      }),
      financial("custos", "1", {
        produto: "Cesta orgânica",
        unidade: "unidade",
        custo_total: "42000",
        quantidade: "1400",
        preco_venda: "58",
      }),
      financial("inadimplencia", "1", {
        cliente: "Mercado Central",
        valor: "3200",
        vencimento: "2026-05-20",
        status: "pendente",
      }),
    ],
    operations: [
      // A MESMA vitrine do módulo de Logística. Este arquivo tinha a sua
      // própria: 2 cargas contra 3, sem frota, rotas nem motoristas — o OTIF
      // da Torre dava 0% e o do módulo 50%, com o mesmo botão DEMO ligado.
      ...demoLogisticaOperations(now),
      operation("pecuaria", "animal", "1", {
        identificacao: "BR-0421",
        especie: "Bovino",
        raca: "Girolando",
        peso_atual: "418",
        status: "Ativo",
      }),
      operation("pecuaria", "vacinacao", "1", {
        animal_lote: "Lote Bezerras 01",
        proxima_dose: "2026-06-12",
        status: "Reforço previsto",
      }),
      operation("sustentabilidade", "carbono", "1", {
        atividade: "Transporte de cestas",
        escopo: "1",
        categoria: "Diesel",
        fonte: "Frota própria",
        volume: "180",
        unidade: "L",
        fator: "2.68",
        co2e: "482.4",
        status: "Calculado",
      }),
      operation("inteligencia", "perdas", "1", {
        produto: "Tomate",
        volume_perdido: "340",
        causa: "Transporte",
        valor_estimado: "4200",
        status: "Em ação",
      }),
      operation("cogs", "etapas", "1", {
        produto: "Cesta orgânica",
        etapa: "Embalagem",
        custo: "8200",
        sku: "CSA-ORG",
        regiao: "Sudeste",
        status: "Calculado",
      }),
      operation("cogs", "simulacoes", "1", {
        nome: "Trocar fornecedor de caixas",
        impacto: "-6.5",
        economia: "3400",
        status: "Favorável",
      }),
    ],
    field: [
      field("colheita-corte", "1", {
        data: "2026-07-08",
        fazenda: "Sato",
        pivo: "51",
        talhao: "03",
        turma: "alojamento",
        cortadores: "9",
        qtd_caixas: "219",
        media: "24.33",
        preco_caixa: "1.70",
        total: "372.30",
      }),
      field("colheita-carregamento", "1", {
        data: "2026-07-08",
        chapas: "6",
        qtd_caixas: "2632",
        media: "438.5",
        preco_caixa: "0.22",
        carretas_vazias: "4",
      }),
      field("areas", "1", {
        talhao: "Talhão A",
        area_ha: "18",
        cultura: "Hortaliças",
        status: "Em andamento",
      }),
      field("insumos", "1", {
        insumo: "Composto orgânico",
        tipo: "Fertilizante",
        talhao: "Talhão A",
        custo_hectare: "480",
      }),
      field("maquinario", "1", {
        maquina: "Trator 01",
        custo_operacional: "7300",
        status: "Atenção",
      }),
      field("pragas", "1", {
        ocorrencia: "Lagarta",
        talhao: "Talhão A",
        severidade: "Alta",
        gps: "-23.5505,-46.6333",
      }),
    ],
  };
}

// Cache por dia, pela mesma razão do arquivo de logística: sem ele cada
// chamada devolve um objeto novo, e o `useMemo` que monta a Torre inteira
// recalcularia a cada render.
let cache: { chave: string; dados: ConnectedAgroSnapshot } | null = null;

/** Vitrine completa da plataforma, com datas relativas a hoje. */
export function demoSnapshotDe(now: Date = new Date()): ConnectedAgroSnapshot {
  const chave = localDateOf(now.toISOString());
  if (!cache || cache.chave !== chave) cache = { chave, dados: build(now) };
  return cache.dados;
}
