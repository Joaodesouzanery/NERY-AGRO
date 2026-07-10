import { INSUMO_MODULES } from "@/features/insumos/types/domain";
import type { FieldRecord } from "@/lib/supabase-field";

function record(id: string, module: string, payload: Record<string, string>): FieldRecord {
  return {
    id,
    module,
    payload,
    created_at: "2025-10-01T12:00:00.000Z",
    updated_at: "2026-01-05T12:00:00.000Z",
  };
}

// Datas relativas para os alertas de validade continuarem visíveis no modo DEMO.
type Daqui = (dias: number) => string;

const insumos = [
  record("insumo-demo-semente", INSUMO_MODULES.catalogo, {
    nome: "Semente Soja M6410 IPRO",
    categoria: "Sementes",
    unidade: "sc",
    fabricante: "Monsoy",
    fornecedor_padrao: "AgroRevenda Rio Verde",
    estoque_minimo: "50",
    status: "ativo",
  }),
  record("insumo-demo-kcl", INSUMO_MODULES.catalogo, {
    nome: "Cloreto de Potássio 60%",
    categoria: "Fertilizantes",
    unidade: "t",
    fornecedor_padrao: "Fertisolo GO",
    estoque_minimo: "10",
    status: "ativo",
  }),
  record("insumo-demo-glifosato", INSUMO_MODULES.catalogo, {
    nome: "Glifosato 480 SL",
    categoria: "Defensivos",
    unidade: "L",
    principio_ativo: "Glifosato",
    registro: "MAPA 1234-01",
    carencia_dias: "7",
    reentrada_horas: "24",
    estoque_minimo: "200",
    status: "ativo",
  }),
  record("insumo-demo-diesel", INSUMO_MODULES.catalogo, {
    nome: "Óleo Diesel S10",
    categoria: "Combustível",
    unidade: "L",
    estoque_minimo: "3000",
    status: "ativo",
  }),
];

const lotes = (daqui: Daqui) => [
  record("lote-demo-semente-1", INSUMO_MODULES.lote, {
    insumo_id: "insumo-demo-semente",
    insumo: "Semente Soja M6410 IPRO",
    numero: "SEM-2025-114",
    validade: daqui(90),
    quantidade_inicial: "180",
    custo_unitario: "780",
    fornecedor: "AgroRevenda Rio Verde",
    nota_fiscal: "NF 45.221",
    local: "Galpão da fazenda",
    status: "disponivel",
  }),
  record("lote-demo-kcl-1", INSUMO_MODULES.lote, {
    insumo_id: "insumo-demo-kcl",
    insumo: "Cloreto de Potássio 60%",
    numero: "KCL-2025-08",
    quantidade_inicial: "24",
    custo_unitario: "2650",
    fornecedor: "Fertisolo GO",
    nota_fiscal: "NF 44.807",
    local: "Galpão da fazenda",
    status: "disponivel",
  }),
  record("lote-demo-glifosato-1", INSUMO_MODULES.lote, {
    insumo_id: "insumo-demo-glifosato",
    insumo: "Glifosato 480 SL",
    numero: "GLI-2024-31",
    validade: daqui(-20),
    quantidade_inicial: "120",
    custo_unitario: "24.9",
    fornecedor: "AgroRevenda Rio Verde",
    local: "Depósito de defensivos",
    status: "disponivel",
  }),
  record("lote-demo-glifosato-2", INSUMO_MODULES.lote, {
    insumo_id: "insumo-demo-glifosato",
    insumo: "Glifosato 480 SL",
    numero: "GLI-2025-07",
    validade: daqui(20),
    quantidade_inicial: "400",
    custo_unitario: "23.5",
    fornecedor: "AgroRevenda Rio Verde",
    nota_fiscal: "NF 46.031",
    local: "Depósito de defensivos",
    status: "disponivel",
  }),
  record("lote-demo-diesel-1", INSUMO_MODULES.lote, {
    insumo_id: "insumo-demo-diesel",
    insumo: "Óleo Diesel S10",
    numero: "TANQUE-01",
    quantidade_inicial: "8000",
    custo_unitario: "5.85",
    fornecedor: "Posto Cerrado",
    local: "Tanque diesel",
    status: "disponivel",
  }),
];

const movimentacoes = (daqui: Daqui) => [
  record("mov-demo-plantio", INSUMO_MODULES.movimentacao, {
    tipo: "saida",
    insumo_id: "insumo-demo-semente",
    insumo: "Semente Soja M6410 IPRO",
    lote_id: "lote-demo-semente-1",
    lote: "SEM-2025-114",
    quantidade: "86",
    unidade: "sc",
    data: "2025-10-20",
    local: "Galpão da fazenda",
    talhao_id: "talhao-demo-03",
    talhao: "Talhão 03",
    safra: "2025/2026",
    ciclo: "Soja Verão",
    operacao: "Plantio",
    responsavel: "Equipe Campo",
    observacao: "Plantio da soja, 2 sc/ha em 42,8 ha.",
  }),
  record("mov-demo-adubacao", INSUMO_MODULES.movimentacao, {
    tipo: "saida",
    insumo_id: "insumo-demo-kcl",
    insumo: "Cloreto de Potássio 60%",
    lote_id: "lote-demo-kcl-1",
    lote: "KCL-2025-08",
    quantidade: "8.5",
    unidade: "t",
    data: "2025-11-20",
    local: "Galpão da fazenda",
    talhao_id: "talhao-demo-03",
    talhao: "Talhão 03",
    safra: "2025/2026",
    ciclo: "Soja Verão",
    operacao: "Adubação",
    responsavel: "João Silva",
    observacao: "Adubação de cobertura, 200 kg/ha.",
  }),
  record("mov-demo-pulverizacao", INSUMO_MODULES.movimentacao, {
    tipo: "saida",
    insumo_id: "insumo-demo-glifosato",
    insumo: "Glifosato 480 SL",
    lote_id: "lote-demo-glifosato-2",
    lote: "GLI-2025-07",
    quantidade: "130",
    unidade: "L",
    data: "2026-01-05",
    local: "Depósito de defensivos",
    talhao_id: "talhao-demo-03",
    talhao: "Talhão 03",
    safra: "2025/2026",
    ciclo: "Soja Verão",
    operacao: "Pulverização",
    responsavel: "João Silva",
    observacao: "Dessecação pré-colheita, 3 L/ha.",
  }),
  record("mov-demo-reserva-milho", INSUMO_MODULES.movimentacao, {
    tipo: "reserva",
    insumo_id: "insumo-demo-glifosato",
    insumo: "Glifosato 480 SL",
    lote_id: "lote-demo-glifosato-2",
    lote: "GLI-2025-07",
    quantidade: "90",
    unidade: "L",
    data: daqui(12),
    local: "Depósito de defensivos",
    talhao_id: "talhao-demo-03",
    talhao: "Talhão 03",
    safra: "2025/2026",
    ciclo: "Milho Safrinha",
    operacao: "Pulverização",
    status: "ativa",
    observacao: "Dessecação planejada da safrinha.",
  }),
  record("mov-demo-abastecimento", INSUMO_MODULES.movimentacao, {
    tipo: "saida",
    insumo_id: "insumo-demo-diesel",
    insumo: "Óleo Diesel S10",
    lote_id: "lote-demo-diesel-1",
    lote: "TANQUE-01",
    quantidade: "620",
    unidade: "L",
    data: "2026-03-28",
    local: "Tanque diesel",
    talhao_id: "talhao-demo-03",
    talhao: "Talhão 03",
    safra: "2025/2026",
    ciclo: "Milho Safrinha",
    operacao: "Plantio",
    responsavel: "Marcos Lima",
    observacao: "Abastecimento do trator no plantio da safrinha.",
  }),
];

/** Registros base do demo de Insumos (catálogo + lotes + movimentações). */
export function demoInsumosBase(now = new Date()): FieldRecord[] {
  const daqui: Daqui = (dias) => {
    const date = new Date(now);
    date.setDate(date.getDate() + dias);
    return date.toISOString().slice(0, 10);
  };
  return [...insumos, ...lotes(daqui), ...movimentacoes(daqui)];
}
