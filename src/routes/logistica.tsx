import { localToday } from "@/lib/date-local";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Image as ImageIcon,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit3,
  Gauge,
  LayoutDashboard,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  Trash2,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  createOperationRecord,
  deleteOperationRecord,
  listOperationRecordsByArea,
  listOperationRecordsByAreaModule,
  OperationRecord,
  updateOperationRecord,
} from "@/lib/supabase-operations";
import { ModuleExportButtons } from "@/components/module-export-buttons";
import { ModuleOverview } from "@/components/module-overview";
import { buildLogisticaOverview } from "@/lib/overview/logistica";
import { agora, buildModuleWorkbook, specMinimo } from "@/lib/export-module";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { defaultPeriod, type PeriodValue } from "@/components/period-picker";
import { ImportRecordsButton } from "@/components/import-records-button";
import { EmptyState } from "@/components/empty-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { exportRowsToXlsx } from "@/lib/export-xlsx";
import { TableToolbar } from "@/components/table-toolbar";
import { RowDetailSheet } from "@/components/row-detail-sheet";
import { ModuleTabRail } from "@/components/module-tab-rail";
import { useColunasVisiveis, useAbaPersistida } from "@/lib/table-prefs";
import { filtrarRegistros, valoresDistintos } from "@/lib/filtro-registros";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { cargaStatusBreakdown, freightByRoute, slaBreaches } from "@/lib/logistica-metrics";
import {
  buildRemessaMetrics,
  caixasVaziasSaldo,
  etapaDe,
  ETAPA_LABEL,
  remessaAtrasos,
  remessaByFazenda,
  remessaByVariedade,
  remessaDivergencias,
} from "@/lib/remessa-metrics";
import { loadAppSettings, REMESSA_TOLERANCIAS_PADRAO } from "@/lib/app-settings";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { PasteIngestButton } from "@/features/remessa/components/paste-ingest-dialog";
import { RemessaPhotoGallery } from "@/features/remessa/components/remessa-photo-gallery";
import { listRemessaPhotos } from "@/features/remessa/api/services";
import { RemessaFormDialog } from "@/features/remessa/components/remessa-form-dialog";
import { RemessaDetailDialog } from "@/features/remessa/components/remessa-detail-dialog";
import {
  BeneficiamentoSetting,
  FazendaCoordsSetting,
  RemessaTolerancasSetting,
} from "@/components/app-settings-controls";

export const Route = createFileRoute("/logistica")({
  head: () => ({
    meta: [
      { title: "Logística e Distribuição - AgroTorre" },
      {
        name: "description",
        content:
          "Cadastro e acompanhamento de cargas, motoristas, rotas, frota, bases, roteirização, expedição, embalagens, cestas e fretes.",
      },
    ],
  }),
  component: LogisticaPage,
});

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea";
  hint?: string;
};

type ModuleConfig = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
};

const AREA = "logistica";

const modules: ModuleConfig[] = [
  {
    id: "remessa",
    label: "Remessa/Recebimento",
    description: "Romaneios da colheita: caixas, peso, média e horários. Alimenta a Torre.",
    icon: ClipboardList,
    fields: [
      { key: "data", label: "Data", type: "date" },
      { key: "fazenda", label: "Fazenda" },
      { key: "talhao", label: "Talhão" },
      { key: "pivo", label: "Pivô" },
      { key: "cultura", label: "Cultura", hint: "Cebola" },
      { key: "variedade", label: "Variedade" },
      { key: "placa", label: "Placa" },
      { key: "motorista", label: "Motorista" },
      { key: "qtd_caixas", label: "Qtd. caixas", type: "number" },
      { key: "unidade", label: "Unidade", hint: "cx ou beg" },
      { key: "peso_bruto", label: "Peso bruto (kg)", type: "number" },
      { key: "tara", label: "Tara (kg)", type: "number" },
      { key: "peso_liquido", label: "Peso líquido (kg)", type: "number" },
      { key: "media", label: "Média (kg/cx)", type: "number" },
      { key: "hora_saida", label: "Hora saída", hint: "HH:MM" },
      { key: "hora_chegada", label: "Hora chegada", hint: "HH:MM" },
      { key: "ordem_producao", label: "Ordem de produção" },
      { key: "romaneio_num", label: "Nº do romaneio", hint: "Nº do documento de papel" },
      { key: "local_descarga", label: "Local de descarga" },
      { key: "pesagem_num", label: "Nº da pesagem", hint: "Ticket da balança" },
      { key: "peso_entrada", label: "Peso de entrada (kg)", type: "number" },
      { key: "peso_saida", label: "Peso de saída (kg)", type: "number" },
      { key: "peso_liquido_final", label: "Peso líquido final (kg)", type: "number" },
      { key: "hora_entrada_balanca", label: "Hora entrada (balança)", hint: "HH:MM" },
      { key: "hora_saida_balanca", label: "Hora saída (balança)", hint: "HH:MM" },
      // Conferência no beneficiamento — a 2ª ponta da pesagem.
      { key: "peso_liquido_destino", label: "Peso conferido no destino (kg)", type: "number" },
      { key: "caixas_recebidas", label: "Caixas recebidas", type: "number" },
      { key: "hora_conferencia", label: "Hora da conferência", hint: "HH:MM" },
      { key: "beneficiamento", label: "Beneficiamento", hint: "OK / pendente" },
      {
        key: "etapa",
        label: "Etapa",
        hint: "lavoura, balanca, beneficiamento, conferida (vazio = deduz do preenchido)",
      },
      { key: "resp_lavoura", label: "Resp. lavoura" },
      { key: "resp_balanca", label: "Resp. balança" },
      { key: "resp_beneficiamento", label: "Resp. beneficiamento" },
      { key: "ficou_na_lavoura", label: "Ficou na lavoura", type: "number" },
      { key: "status", label: "Status", hint: "Em recebimento, Recebida, Atrasada" },
    ],
  },
  {
    id: "caixas-vazias",
    label: "Caixas vazias",
    description: "Razão das caixas plásticas: saíram X pro campo, voltaram Y. Saldo por fazenda.",
    icon: Boxes,
    fields: [
      { key: "data", label: "Data", type: "date" },
      { key: "fazenda", label: "Fazenda" },
      { key: "placa", label: "Placa" },
      { key: "tipo", label: "Tipo", hint: "saida_campo ou retorno_campo" },
      { key: "qtd", label: "Quantidade", type: "number" },
    ],
  },
  {
    id: "cargas",
    label: "Cargas",
    description: "Pedidos em separação, em trânsito e entregues. Posiciona pinos no mapa.",
    icon: Truck,
    fields: [
      { key: "codigo", label: "Código" },
      { key: "cliente", label: "Cliente" },
      { key: "origem", label: "Cidade de Origem" },
      { key: "origem_lat", label: "Latitude Origem", type: "number", hint: "-23.55" },
      { key: "origem_lng", label: "Longitude Origem", type: "number", hint: "-46.63" },
      { key: "destino", label: "Cidade de Destino" },
      { key: "destino_lat", label: "Latitude Destino", type: "number" },
      { key: "destino_lng", label: "Longitude Destino", type: "number" },
      { key: "peso", label: "Peso (kg)", type: "number" },
      { key: "valor", label: "Valor (R$)", type: "number" },
      { key: "motorista", label: "Motorista" },
      { key: "placa", label: "Placa do Veículo" },
      { key: "status", label: "Status", hint: "Em trânsito, Entregue, Atrasado, Aguardando" },
      { key: "eta", label: "ETA", type: "date" },
    ],
  },
  {
    id: "motoristas",
    label: "Motoristas",
    description: "Equipe ativa, escala, posição atual e desempenho.",
    icon: Users,
    fields: [
      { key: "nome", label: "Nome" },
      { key: "cnh", label: "CNH" },
      { key: "telefone", label: "Telefone" },
      { key: "veiculo", label: "Veículo padrão" },
      { key: "atual_lat", label: "Latitude Atual", type: "number" },
      { key: "atual_lng", label: "Longitude Atual", type: "number" },
      { key: "status", label: "Status", hint: "Disponível, Em rota, Folga" },
      { key: "score", label: "Score", type: "number" },
    ],
  },
  {
    id: "rotas",
    label: "Rotas",
    description: "Trajetos planejados com custo, SLA e paradas.",
    icon: MapPin,
    fields: [
      { key: "nome", label: "Nome da rota" },
      { key: "origem", label: "Origem" },
      { key: "origem_lat", label: "Latitude Origem", type: "number" },
      { key: "origem_lng", label: "Longitude Origem", type: "number" },
      { key: "destino", label: "Destino" },
      { key: "destino_lat", label: "Latitude Destino", type: "number" },
      { key: "destino_lng", label: "Longitude Destino", type: "number" },
      { key: "distancia", label: "Distância (km)", type: "number" },
      { key: "sla", label: "SLA (h)", type: "number" },
      { key: "paradas", label: "Paradas intermediárias" },
    ],
  },
  {
    id: "frota",
    label: "Frota",
    description: "Veículos da operação com posição e situação.",
    icon: Wrench,
    fields: [
      { key: "placa", label: "Placa" },
      { key: "modelo", label: "Modelo" },
      { key: "tipo", label: "Tipo", hint: "Carreta, Truck, VUC, Van" },
      { key: "capacidade", label: "Capacidade (kg)", type: "number" },
      { key: "atual_lat", label: "Latitude Atual", type: "number" },
      { key: "atual_lng", label: "Longitude Atual", type: "number" },
      { key: "status", label: "Status", hint: "Disponível, Em rota, Manutenção" },
      { key: "ultima_manutencao", label: "Última manutenção", type: "date" },
    ],
  },
  {
    id: "bases",
    label: "Bases e Filiais",
    description: "Matriz, filiais e centros de distribuição.",
    icon: Building2,
    fields: [
      { key: "nome", label: "Nome" },
      { key: "tipo", label: "Tipo", hint: "Matriz, Filial, Centro de Distribuição" },
      { key: "endereco", label: "Endereço" },
      { key: "cidade", label: "Cidade / UF" },
      { key: "lat", label: "Latitude", type: "number" },
      { key: "lng", label: "Longitude", type: "number" },
      { key: "responsavel", label: "Responsável" },
    ],
  },
  {
    id: "roteirizacao",
    label: "Roteirização de Entregas na Cidade",
    description: "Sequência urbana de paradas, bairros, tempo previsto e responsável.",
    icon: MapPin,
    fields: [
      { key: "rota", label: "Rota" },
      { key: "motorista", label: "Motorista" },
      { key: "veiculo", label: "Veículo" },
      { key: "bairros", label: "Bairros atendidos" },
      { key: "paradas", label: "Paradas", type: "number" },
      { key: "distancia", label: "Distância (km)", type: "number" },
      { key: "tempo_previsto", label: "Tempo previsto" },
      { key: "status", label: "Status", hint: "Planejada, Em execução, Concluída" },
    ],
  },
  {
    id: "embalagens",
    label: "Controle de Embalagens e Estoque",
    description: "Saldos, mínimos, validade, fornecedor e necessidade de reposição.",
    icon: Boxes,
    fields: [
      { key: "item", label: "Item" },
      { key: "sku", label: "SKU" },
      { key: "saldo", label: "Saldo", type: "number" },
      { key: "minimo", label: "Estoque mínimo", type: "number" },
      { key: "fornecedor", label: "Fornecedor" },
      { key: "validade", label: "Validade", type: "date" },
      { key: "status", label: "Status", hint: "OK, Repor, Bloqueado" },
    ],
  },
  {
    id: "cestas",
    label: "Sistema de Cestas/Assinaturas (CSA)",
    description: "Planos recorrentes, frequência, próxima entrega, itens padrão e pausas.",
    icon: Package,
    fields: [
      { key: "cliente", label: "Cliente" },
      { key: "plano", label: "Plano" },
      { key: "frequencia", label: "Frequência" },
      { key: "proxima_entrega", label: "Próxima entrega", type: "date" },
      { key: "itens_padrao", label: "Itens padrão", type: "textarea" },
      { key: "pausa_ate", label: "Pausa até", type: "date" },
      { key: "status", label: "Status", hint: "Ativa, Pausada, Cancelada" },
    ],
  },
  {
    id: "expedicao",
    label: "Checklist de Expedição Pré-carga",
    description: "Conferência de pedido, temperatura, lacres e itens antes da saída.",
    icon: ClipboardList,
    fields: [
      { key: "pedido", label: "Pedido" },
      { key: "responsavel", label: "Responsável" },
      { key: "itens", label: "Itens previstos", type: "textarea" },
      { key: "conferidos", label: "Itens conferidos" },
      { key: "temperatura", label: "Temperatura" },
      { key: "lacres", label: "Lacres" },
      { key: "status", label: "Status", hint: "Pendente, Aprovado, Revisar" },
    ],
  },
  {
    id: "fretes",
    label: "Gestão de Fretes e Custo de Transporte",
    description: "Custo por rota, transportadora, quilometragem, combustível e pedágios.",
    icon: Wallet,
    fields: [
      { key: "rota", label: "Rota" },
      { key: "transportadora", label: "Transportadora" },
      { key: "km", label: "Km", type: "number" },
      { key: "custo", label: "Custo total (R$)", type: "number" },
      { key: "combustivel", label: "Combustível (R$)", type: "number" },
      { key: "pedagio", label: "Pedágio (R$)", type: "number" },
      { key: "status", label: "Status", hint: "Previsto, Fechado, Revisar" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  remessa: [
    record("remessa", "1", {
      data: "2026-07-08",
      fazenda: "Sato",
      talhao: "03",
      pivo: "51",
      cultura: "Cebola",
      variedade: "Taila",
      placa: "NFN-6I47",
      motorista: "Lorival",
      qtd_caixas: "881",
      unidade: "cx",
      peso_liquido: "19178",
      media: "21.7",
      hora_saida: "09:00",
      ordem_producao: "TL03 PV51 SATO",
      beneficiamento: "OK",
      status: "Recebida",
    }),
    record("remessa", "2", {
      data: "2026-07-08",
      fazenda: "Sato",
      talhao: "03",
      pivo: "51",
      cultura: "Cebola",
      variedade: "Taila",
      placa: "NFN-6I47",
      qtd_caixas: "876",
      unidade: "cx",
      peso_liquido: "19368",
      media: "22.1",
      hora_saida: "09:45",
      status: "Recebida",
    }),
    record("remessa", "3", {
      data: "2026-07-09",
      fazenda: "Nascente",
      talhao: "02",
      pivo: "02",
      cultura: "Cebola",
      variedade: "vale sul",
      placa: "LJQ-8J12",
      motorista: "Severino",
      qtd_caixas: "32",
      unidade: "beg",
      hora_chegada: "13:15",
      hora_saida: "15:40",
      status: "Em recebimento",
    }),
  ],
  "caixas-vazias": [
    record("caixas-vazias", "1", {
      data: "2026-07-08",
      fazenda: "Sato",
      placa: "GPC-2G22",
      tipo: "saida_campo",
      qtd: "936",
    }),
    record("caixas-vazias", "2", {
      data: "2026-07-08",
      fazenda: "Sato",
      tipo: "retorno_campo",
      qtd: "400",
    }),
    record("caixas-vazias", "3", {
      data: "2026-07-09",
      fazenda: "Nascente",
      placa: "LJQ-8J12",
      tipo: "saida_campo",
      qtd: "500",
    }),
  ],
  roteirizacao: [
    record("roteirizacao", "1", {
      rota: "Centro + Zona Sul",
      motorista: "João Pereira",
      veiculo: "VUC NRY-2045",
      bairros: "Centro, Batel, Água Verde",
      paradas: "18",
      distancia: "42",
      tempo_previsto: "4h20",
      status: "Planejada",
    }),
  ],
  embalagens: [
    record("embalagens", "1", {
      item: "Caixa hortifruti P",
      sku: "CX-HF-P",
      saldo: "620",
      minimo: "300",
      fornecedor: "Pack Verde",
      validade: "2026-09-30",
      status: "OK",
    }),
  ],
  cestas: [
    record("cestas", "1", {
      cliente: "CSA Vila Verde",
      plano: "Família semanal",
      frequencia: "Semanal",
      proxima_entrega: "2026-06-05",
      itens_padrao: "Verduras, legumes, ovos",
      pausa_ate: "",
      status: "Ativa",
    }),
  ],
  expedicao: [
    record("expedicao", "1", {
      pedido: "PED-8841",
      responsavel: "Carla Souza",
      itens: "24 cestas, 12 caixas de ovos",
      conferidos: "Sim",
      temperatura: "8 C",
      lacres: "L-225, L-226",
      status: "Aprovado",
    }),
  ],
  fretes: [
    record("fretes", "1", {
      rota: "Curitiba > São Paulo",
      transportadora: "Frota própria",
      km: "408",
      custo: "3250",
      combustivel: "980",
      pedagio: "210",
      status: "Fechado",
    }),
  ],
  cargas: [
    record("cargas", "1", {
      codigo: "CG-1001",
      cliente: "Ceagesp São Paulo",
      origem: "Cristalina/GO",
      origem_lat: "-16.767",
      origem_lng: "-47.613",
      destino: "São Paulo/SP",
      destino_lat: "-23.55",
      destino_lng: "-46.63",
      peso: "24000",
      valor: "48000",
      motorista: "Lorival Souza",
      placa: "NFN-6I47",
      status: "Em trânsito",
      eta: "2026-07-10",
    }),
    record("cargas", "2", {
      codigo: "CG-1002",
      cliente: "Ceasa Campinas",
      origem: "Cristalina/GO",
      origem_lat: "-16.767",
      origem_lng: "-47.613",
      destino: "Campinas/SP",
      destino_lat: "-22.905",
      destino_lng: "-47.06",
      peso: "18000",
      valor: "36500",
      motorista: "Severino Lima",
      placa: "LJQ-8J12",
      status: "Entregue",
      eta: "2026-07-08",
    }),
    record("cargas", "3", {
      codigo: "CG-1003",
      cliente: "Atacadão BH",
      origem: "Cristalina/GO",
      origem_lat: "-16.767",
      origem_lng: "-47.613",
      destino: "Belo Horizonte/MG",
      destino_lat: "-19.92",
      destino_lng: "-43.94",
      peso: "20000",
      valor: "39000",
      motorista: "João Pereira",
      placa: "GPC-2G22",
      status: "Atrasado",
      eta: "2026-07-07",
    }),
  ],
  motoristas: [
    record("motoristas", "1", {
      nome: "Lorival Souza",
      cnh: "E - 04788112233",
      telefone: "(61) 99812-4477",
      veiculo: "Carreta NFN-6I47",
      status: "Em rota",
      score: "92",
    }),
    record("motoristas", "2", {
      nome: "Severino Lima",
      cnh: "E - 03399445566",
      telefone: "(61) 99655-1120",
      veiculo: "Truck LJQ-8J12",
      status: "Disponível",
      score: "88",
    }),
    record("motoristas", "3", {
      nome: "João Pereira",
      cnh: "D - 02255778899",
      telefone: "(61) 99340-7781",
      veiculo: "VUC GPC-2G22",
      status: "Folga",
      score: "79",
    }),
  ],
  rotas: [
    record("rotas", "1", {
      nome: "Cristalina → São Paulo",
      origem: "Cristalina/GO",
      origem_lat: "-16.767",
      origem_lng: "-47.613",
      destino: "São Paulo/SP",
      destino_lat: "-23.55",
      destino_lng: "-46.63",
      distancia: "915",
      sla: "18",
      paradas: "Uberlândia",
    }),
    record("rotas", "2", {
      nome: "Cristalina → Campinas",
      origem: "Cristalina/GO",
      origem_lat: "-16.767",
      origem_lng: "-47.613",
      destino: "Campinas/SP",
      destino_lat: "-22.905",
      destino_lng: "-47.06",
      distancia: "835",
      sla: "16",
      paradas: "Ribeirão Preto",
    }),
  ],
  frota: [
    record("frota", "1", {
      placa: "NFN-6I47",
      modelo: "Scania R450",
      tipo: "Carreta",
      capacidade: "30000",
      status: "Em rota",
      ultima_manutencao: "2026-06-20",
    }),
    record("frota", "2", {
      placa: "LJQ-8J12",
      modelo: "VW Constellation",
      tipo: "Truck",
      capacidade: "12000",
      status: "Disponível",
      ultima_manutencao: "2026-06-28",
    }),
    record("frota", "3", {
      placa: "GPC-2G22",
      modelo: "Mercedes Accelo",
      tipo: "VUC",
      capacidade: "4000",
      status: "Manutenção",
      ultima_manutencao: "2026-07-05",
    }),
  ],
  bases: [
    record("bases", "1", {
      nome: "Matriz Cristalina",
      tipo: "Matriz",
      endereco: "Rod. GO-118, km 12",
      cidade: "Cristalina/GO",
      lat: "-16.767",
      lng: "-47.613",
      responsavel: "Felipe Nery",
    }),
    record("bases", "2", {
      nome: "CD São Paulo",
      tipo: "Centro de Distribuição",
      endereco: "Ceagesp, Vila Leopoldina",
      cidade: "São Paulo/SP",
      lat: "-23.53",
      lng: "-46.73",
      responsavel: "Carla Souza",
    }),
  ],
};

type TabId = "visao-geral" | (typeof modules)[number]["id"];

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  ...modules.map((m) => ({ id: m.id as TabId, label: m.label, icon: m.icon })),
];

function record(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return {
    id: `demo-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function emptyPayload(m: ModuleConfig) {
  return Object.fromEntries(calculatedCostFields(m.fields).map((f) => [f.key, ""]));
}

const totalCostKeys = ["custo_total", "custo", "valor", "combustivel", "pedagio"];

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculatedCostFields(fields: FieldConfig[]) {
  if (!fields.some((field) => totalCostKeys.includes(field.key))) return fields;
  const next = [...fields];
  const add = (field: FieldConfig) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({ key: "quantidade", label: "Quantidade", type: "number" });
  add({ key: "unidade_base", label: "Unidade base" });
  add({ key: "custo_total", label: "Custo total", type: "number" });
  add({ key: "custo_unitario", label: "Custo unitario", type: "number" });
  return next;
}

function normalizeCostPayload(payload: Record<string, string>, changedKey?: string) {
  const next = { ...payload };
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }

  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }

  const quantity = numberValue(next.quantidade);
  const totalKey =
    changedKey && totalCostKeys.includes(changedKey)
      ? changedKey
      : next.custo_total
        ? "custo_total"
        : (totalCostKeys.find((key) => next[key]) ?? "custo_total");
  const total = numberValue(next.custo_total || next[totalKey]);
  const unit = numberValue(next.custo_unitario);
  if (quantity <= 0) return next;

  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = String(Math.round(unit * quantity * 10000) / 10000);
  } else if (
    changedKey === "quantidade" ||
    changedKey === "custo_total" ||
    totalCostKeys.includes(changedKey ?? "")
  ) {
    next.custo_unitario = total > 0 ? String(Math.round((total / quantity) * 10000) / 10000) : "";
  }
  return next;
}

function updateCostPayload(current: Record<string, string>, key: string, value: string) {
  return normalizeCostPayload({ ...current, [key]: value }, key);
}

// ── Focos por aba: cada aba ganha KPIs + visual próprios (não só uma tabela). ──
const normStr = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
const countByStatus = (records: OperationRecord[], key: string, term: string) =>
  records.filter((r) => normStr(r.payload[key]).includes(term)).length;
const sumField = (records: OperationRecord[], key: string) =>
  records.reduce((sum, r) => sum + numberValue(r.payload[key]), 0);
function groupCount(records: OperationRecord[], key: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[key] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// Painel da aba Remessa. É um componente (não uma função que devolve JSX)
// porque precisa das tolerâncias configuradas pela empresa — e hooks só
// funcionam dentro de componente.
function RemessaFocus({ records }: { records: OperationRecord[] }) {
  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: loadAppSettings,
    enabled: isSupabaseConfigured,
    staleTime: 60_000,
  });
  const tol = settings?.remessaTolerancias ?? REMESSA_TOLERANCIAS_PADRAO;
  const m = buildRemessaMetrics(records, tol);
  const atrasos = remessaAtrasos(records, tol.slaPermanenciaMin);
  const divergencias = remessaDivergencias(records, tol);
  const porFazenda = remessaByFazenda(records).map((x) => ({
    label: x.fazenda,
    value: x.caixas,
  }));
  const porVariedade = remessaByVariedade(records).map((x) => ({
    label: x.variedade,
    value: x.caixas,
  }));
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PasteIngestButton />
        <span className="text-xs text-muted-foreground">
          Cole o apontamento do WhatsApp/romaneio e confira antes de salvar.
        </span>
      </div>
      <RichTabKpis
        kpis={[
          { label: "Remessas", value: m.totalRemessas, icon: ClipboardList },
          {
            label: "Caixas colhidas",
            value: m.caixasTotal.toLocaleString("pt-BR"),
            icon: Boxes,
          },
          {
            label: "Peso líquido",
            value: `${m.pesoLiquidoTotal.toLocaleString("pt-BR")} kg`,
            icon: Gauge,
          },
          {
            label: "Na estrada",
            value: m.naEstrada,
            icon: Truck,
            hint: "Saíram da lavoura e ainda não foram conferidas",
          },
          {
            label: "Aguardando conferência",
            value: m.aguardandoConferencia,
            icon: PackageCheck,
            hint: "Chegaram ao beneficiamento e falta conferir",
          },
          {
            label: "Com divergência",
            value: m.comDivergencia,
            icon: AlertTriangle,
            hint: "Peso ou caixas não fecham entre saída e destino",
            trend: m.comDivergencia ? "conferir" : "ok",
            trendDir: m.comDivergencia ? "down" : "up",
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Caixas por fazenda"
          description={
            m.mediaKgCx
              ? `Volume colhido por origem · média ${m.mediaKgCx} kg/cx em ${m.fazendasAtivas} fazenda(s)`
              : "Volume colhido por origem"
          }
        >
          {porFazenda.length ? (
            <RichBarList items={porFazenda} />
          ) : (
            <EmptyState title="Sem remessas cadastradas" />
          )}
        </RichTabPanel>
        <RichTabPanel title="Caixas por variedade" description="Distribuição por variedade">
          {porVariedade.length ? (
            <RichBarList items={porVariedade} />
          ) : (
            <EmptyState title="Sem remessas cadastradas" />
          )}
        </RichTabPanel>
      </div>
      {divergencias.length > 0 && (
        <div className="mt-4">
          <RichTabPanel
            title="Conferência que não fecha"
            description={`Diferença entre a saída da lavoura e o beneficiamento acima de ${tol.quebraPct}% de peso ou ${tol.caixas} caixas`}
          >
            <div className="space-y-2">
              {divergencias.slice(0, 8).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    <strong>{d.placa}</strong> · {d.fazenda}
                    {d.romaneio && (
                      <span className="text-muted-foreground"> · romaneio {d.romaneio}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium",
                      d.nivel === "critico"
                        ? "bg-destructive/12 text-destructive"
                        : "bg-warning/12 text-warning",
                    )}
                  >
                    {d.descricao}
                  </span>
                </div>
              ))}
            </div>
          </RichTabPanel>
        </div>
      )}
      {atrasos.length > 0 && (
        <div className="mt-4">
          <RichTabPanel
            title="Caminhões em atraso"
            description={`Status atrasado ou permanência acima de ${Math.round((tol.slaPermanenciaMin / 60) * 10) / 10}h`}
          >
            <div className="space-y-2">
              {atrasos.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    <strong>{a.placa}</strong> · {a.fazenda}
                  </span>
                  <span className="shrink-0 rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                    {a.motivo}
                  </span>
                </div>
              ))}
            </div>
          </RichTabPanel>
        </div>
      )}
      <div className="mt-4">
        <RichTabPanel
          title="Fotos dos romaneios"
          description="Fotos anexadas na ingestão (mais recentes)"
        >
          <RemessaPhotoGallery source="remessa" />
        </RichTabPanel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Coordenadas das fazendas"
          description="Ajuste as coordenadas reais para o mapa origem→beneficiamento"
        >
          <FazendaCoordsSetting fazendas={porFazenda.map((f) => f.label)} />
        </RichTabPanel>
        <BeneficiamentoSetting />
        <RemessaTolerancasSetting />
      </div>
    </>
  );
}

const moduleFocus: Record<string, (records: OperationRecord[]) => React.ReactNode> = {
  remessa: (records) => <RemessaFocus records={records} />,
  "caixas-vazias": (records) => {
    const saldo = caixasVaziasSaldo(records);
    const enviadas = saldo.reduce((s, x) => s + x.enviadas, 0);
    const retornadas = saldo.reduce((s, x) => s + x.retornadas, 0);
    const totalSaldo = enviadas - retornadas;
    const bars = saldo.map((x) => ({ label: x.fazenda, value: x.saldo }));
    return (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <PasteIngestButton />
          <span className="text-xs text-muted-foreground">
            Cole o apontamento de caixas vazias (saída/retorno) e confira antes de salvar.
          </span>
        </div>
        <RichTabKpis
          kpis={[
            { label: "Enviadas ao campo", value: enviadas.toLocaleString("pt-BR"), icon: Boxes },
            {
              label: "Retornadas",
              value: retornadas.toLocaleString("pt-BR"),
              icon: CheckCircle2,
            },
            {
              label: "Saldo no campo",
              value: totalSaldo.toLocaleString("pt-BR"),
              icon: AlertTriangle,
              trend: totalSaldo > 500 ? "alto" : "ok",
              trendDir: totalSaldo > 500 ? "down" : "up",
            },
          ]}
        />
        <RichTabPanel
          title="Saldo por fazenda"
          description="Enviadas − retornadas (caixa ainda no campo)"
        >
          {bars.length ? (
            <RichBarList items={bars} />
          ) : (
            <EmptyState title="Sem movimentação de caixas" />
          )}
        </RichTabPanel>
        <div className="mt-4">
          <RichTabPanel
            title="Fotos das caixas vazias"
            description="Fotos anexadas na ingestão (mais recentes)"
          >
            <RemessaPhotoGallery source="caixas-vazias" />
          </RichTabPanel>
        </div>
      </>
    );
  },
  cargas: (records) => {
    const status = cargaStatusBreakdown(records).map((s) => ({ label: s.status, value: s.valor }));
    const breaches = slaBreaches(records, localToday());
    const atras = countByStatus(records, "status", "atras");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Total de cargas", value: records.length, icon: Truck },
            {
              label: "Em trânsito",
              value: countByStatus(records, "status", "transito"),
              icon: Truck,
            },
            {
              label: "Entregues",
              value: countByStatus(records, "status", "entregue"),
              icon: CheckCircle2,
            },
            {
              label: "Atrasadas",
              value: atras,
              icon: AlertTriangle,
              trend: atras ? "atenção" : "ok",
              trendDir: atras ? "down" : "up",
            },
            { label: "Valor em rota", value: brl(sumField(records, "valor")), icon: Wallet },
            {
              label: "Peso total",
              value: `${sumField(records, "peso").toLocaleString("pt-BR")} kg`,
              icon: Boxes,
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RichTabPanel title="Cargas por status" description="Distribuição atual da operação">
            {status.length ? (
              <RichBarList items={status} />
            ) : (
              <EmptyState title="Sem cargas cadastradas" />
            )}
          </RichTabPanel>
          <RichTabPanel title="Em risco de SLA" description="Atrasadas ou com ETA vencida">
            {breaches.length ? (
              <div className="space-y-2">
                {breaches.slice(0, 6).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      <strong>{b.codigo}</strong> · {b.cliente}
                    </span>
                    <span className="shrink-0 rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                      {b.motivo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhuma carga em risco" icon={CheckCircle2} />
            )}
          </RichTabPanel>
        </div>
      </>
    );
  },
  motoristas: (records) => {
    const scores = records.map((r) => numberValue(r.payload.score)).filter((n) => n > 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const top = [...records]
      .sort((a, b) => numberValue(b.payload.score) - numberValue(a.payload.score))
      .slice(0, 6)
      .map((r) => ({ label: r.payload.nome || "—", value: numberValue(r.payload.score) }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Motoristas", value: records.length, icon: Users },
            {
              label: "Disponíveis",
              value: countByStatus(records, "status", "dispon"),
              icon: CheckCircle2,
            },
            { label: "Em rota", value: countByStatus(records, "status", "rota"), icon: Truck },
            { label: "Em folga", value: countByStatus(records, "status", "folga"), icon: Users },
            { label: "Score médio", value: avg || "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Ranking de score" description="Desempenho por motorista">
          {top.length ? (
            <RichBarList items={top} />
          ) : (
            <EmptyState title="Sem motoristas cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  rotas: (records) => {
    const slas = records.map((r) => numberValue(r.payload.sla)).filter((n) => n > 0);
    const avgSla = slas.length ? Math.round(slas.reduce((a, b) => a + b, 0) / slas.length) : 0;
    const byDist = [...records]
      .sort((a, b) => numberValue(b.payload.distancia) - numberValue(a.payload.distancia))
      .slice(0, 6)
      .map((r) => ({
        label: r.payload.nome || r.payload.origem || "Rota",
        value: numberValue(r.payload.distancia),
      }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Rotas", value: records.length, icon: MapPin },
            {
              label: "Distância total",
              value: `${sumField(records, "distancia").toLocaleString("pt-BR")} km`,
              icon: MapPin,
            },
            { label: "SLA médio", value: avgSla ? `${avgSla} h` : "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Distância por rota" description="Maiores trajetos">
          {byDist.length ? (
            <RichBarList items={byDist} format={(n) => `${n.toLocaleString("pt-BR")} km`} />
          ) : (
            <EmptyState title="Sem rotas cadastradas" />
          )}
        </RichTabPanel>
      </>
    );
  },
  frota: (records) => {
    const byTipo = groupCount(records, "tipo");
    const manut = countByStatus(records, "status", "manuten");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Veículos", value: records.length, icon: Truck },
            {
              label: "Disponíveis",
              value: countByStatus(records, "status", "dispon"),
              icon: CheckCircle2,
            },
            { label: "Em rota", value: countByStatus(records, "status", "rota"), icon: Truck },
            {
              label: "Em manutenção",
              value: manut,
              icon: Wrench,
              trend: manut ? "atenção" : "ok",
              trendDir: manut ? "down" : "up",
            },
            {
              label: "Capacidade total",
              value: `${sumField(records, "capacidade").toLocaleString("pt-BR")} kg`,
              icon: Boxes,
            },
          ]}
        />
        <RichTabPanel title="Frota por tipo" description="Composição da frota">
          {byTipo.length ? (
            <RichBarList items={byTipo} />
          ) : (
            <EmptyState title="Sem veículos cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  fretes: (records) => {
    const custo = records.reduce(
      (s, r) =>
        s +
        numberValue(r.payload.custo) +
        numberValue(r.payload.combustivel) +
        numberValue(r.payload.pedagio),
      0,
    );
    const km = sumField(records, "km");
    const byRoute = freightByRoute(records)
      .slice(0, 6)
      .map((f) => ({ label: f.rota, value: f.custo }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Fretes", value: records.length, icon: Wallet },
            { label: "Custo total", value: brl(custo), icon: Wallet },
            { label: "Distância", value: `${km.toLocaleString("pt-BR")} km`, icon: MapPin },
            { label: "Custo por km", value: km > 0 ? brl(custo / km) : "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Custo de frete por rota" description="Custo + combustível + pedágio">
          {byRoute.length ? (
            <RichBarList items={byRoute} format={brl} />
          ) : (
            <EmptyState title="Sem fretes cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  bases: (records) => {
    const byTipo = groupCount(records, "tipo");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Bases / filiais", value: records.length, icon: Building2 },
            ...byTipo.slice(0, 3).map((t) => ({ label: t.label, value: t.value, icon: Building2 })),
          ]}
        />
        <RichTabPanel title="Bases por tipo" description="Matriz, filiais e CDs">
          {byTipo.length ? (
            <RichBarList items={byTipo} />
          ) : (
            <EmptyState title="Sem bases cadastradas" />
          )}
        </RichTabPanel>
      </>
    );
  },
  roteirizacao: (records) => {
    const byStatus = groupCount(records, "status");
    const distancias = records
      .map((r) => ({ label: r.payload.rota || "Roteiro", value: numberValue(r.payload.distancia) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Roteiros", value: records.length, icon: MapPin },
            { label: "Paradas", value: sumField(records, "paradas"), icon: MapPin },
            {
              label: "Distância",
              value: `${sumField(records, "distancia").toLocaleString("pt-BR")} km`,
              icon: MapPin,
            },
            {
              label: "Concluídos",
              value: countByStatus(records, "status", "conclu"),
              icon: CheckCircle2,
            },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <RichTabPanel title="Status dos roteiros" description="Planejada, em execução, concluída">
            {byStatus.length ? (
              <RichBarList items={byStatus} />
            ) : (
              <EmptyState title="Sem roteiros cadastrados" />
            )}
          </RichTabPanel>
          <RichTabPanel title="Distância por roteiro" description="Maiores trajetos (km)">
            {distancias.length ? (
              <RichBarList items={distancias} format={(v) => `${v.toLocaleString("pt-BR")} km`} />
            ) : (
              <EmptyState title="Sem distâncias informadas" />
            )}
          </RichTabPanel>
        </div>
      </>
    );
  },
  embalagens: (records) => {
    const abaixo = records.filter(
      (r) => numberValue(r.payload.saldo) < numberValue(r.payload.minimo),
    ).length;
    const items = records.slice(0, 6).map((r) => ({
      label: r.payload.item || r.payload.sku || "Item",
      value: numberValue(r.payload.saldo),
    }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Itens", value: records.length, icon: Boxes },
            {
              label: "Abaixo do mínimo",
              value: abaixo,
              icon: AlertTriangle,
              trend: abaixo ? "repor" : "ok",
              trendDir: abaixo ? "down" : "up",
            },
            {
              label: "Saldo total",
              value: sumField(records, "saldo").toLocaleString("pt-BR"),
              icon: Boxes,
            },
          ]}
        />
        <RichTabPanel title="Saldo por item" description="Estoque atual de embalagens">
          {items.length ? (
            <RichBarList items={items} />
          ) : (
            <EmptyState title="Sem itens cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  cestas: (records) => {
    const byFreq = groupCount(records, "frequencia");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Assinaturas", value: records.length, icon: Package },
            {
              label: "Ativas",
              value: countByStatus(records, "status", "ativ"),
              icon: CheckCircle2,
            },
            {
              label: "Pausadas",
              value: countByStatus(records, "status", "paus"),
              icon: AlertTriangle,
            },
          ]}
        />
        <RichTabPanel title="Assinaturas por frequência" description="CSA recorrente">
          {byFreq.length ? (
            <RichBarList items={byFreq} />
          ) : (
            <EmptyState title="Sem assinaturas cadastradas" />
          )}
        </RichTabPanel>
      </>
    );
  },
  expedicao: (records) => {
    const aprovados = countByStatus(records, "status", "aprov");
    const taxa = records.length ? Math.round((aprovados / records.length) * 100) : 0;
    const byStatus = groupCount(records, "status");
    const byResponsavel = groupCount(records, "responsavel");
    const pendencias = records.filter((r) => {
      const s = normStr(r.payload.status);
      return s.includes("pend") || s.includes("revis");
    });
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Checklists", value: records.length, icon: ClipboardList },
            {
              label: "Taxa de aprovação",
              value: `${taxa}%`,
              icon: CheckCircle2,
              trend: taxa >= 80 ? "ok" : "baixa",
              trendDir: taxa >= 80 ? "up" : "down",
            },
            {
              label: "Pendentes",
              value: countByStatus(records, "status", "pend"),
              icon: AlertTriangle,
            },
            {
              label: "Revisar",
              value: countByStatus(records, "status", "revis"),
              icon: AlertTriangle,
            },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <RichTabPanel title="Status da expedição" description="Aprovado, pendente, revisar">
            {byStatus.length ? (
              <RichBarList items={byStatus} />
            ) : (
              <EmptyState title="Sem checklists" />
            )}
          </RichTabPanel>
          <RichTabPanel title="Por responsável" description="Volume conferido por pessoa">
            {byResponsavel.length ? (
              <RichBarList items={byResponsavel} />
            ) : (
              <EmptyState title="Sem responsáveis informados" />
            )}
          </RichTabPanel>
        </div>
        {pendencias.length > 0 && (
          <RichTabPanel
            title="Pendências a resolver"
            description="Checklists pendentes ou a revisar"
          >
            <div className="space-y-2">
              {pendencias.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {r.payload.pedido || "Pedido"} · {r.payload.responsavel || "—"}
                  </span>
                  <span className="shrink-0 rounded bg-warning/12 px-1.5 py-0.5 text-[11px] font-medium text-warning">
                    {r.payload.status}
                  </span>
                </div>
              ))}
            </div>
          </RichTabPanel>
        )}
      </>
    );
  },
};

function LogisticaPage() {
  const { demoMode } = useDemoMode();
  // A aba sobrevive ao recarregar (por pessoa): antes voltava sempre para a
  // Visão Geral, e reencontrar onde se estava custava o mesmo que escolher.
  const [tab, setTab] = useAbaPersistida("logistica", "visao-geral") as [
    TabId,
    (id: TabId) => void,
  ];

  const current = modules.find((m) => m.id === tab);

  return (
    <div className="px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logística e Distribuição</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {demoMode
              ? "Modo DEMO ligado: exemplos isolados dos dados reais."
              : "Modo DEMO desligado: exibindo dados reais cadastrados."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* O seletor de período saiu daqui: ele nunca filtrou nada — só virava
              rótulo no arquivo exportado, e dizia "Este mês" num export que
              contém o histórico inteiro. O período agora está na barra de
              filtros da tabela, onde de fato filtra. */}
          {/* Antes: toast mandando "exportar dentro de cada aba". Agora sai o
              módulo inteiro — os registros das 12 abas são buscados no clique. */}
          <ModuleExportButtons
            workbook={async () => {
              const todos = demoMode ? null : await listOperationRecordsByArea(AREA);
              const tabs = modules.map((m) => ({
                id: m.id,
                label: m.label,
                fields: calculatedCostFields(m.fields).map((f) => ({
                  key: f.key,
                  label: f.label,
                })),
                records: todos
                  ? todos.filter((r) => r.module === m.id)
                  : (demoByModule[m.id] ?? []),
              }));
              return buildModuleWorkbook({
                spec: specMinimo({
                  moduleId: "logistica",
                  moduleLabel: "Logística e Distribuição",
                  tabs,
                  demoMode,
                  // "Histórico completo", não `period.label`: este export do
                  // módulo inteiro NÃO aplica o período — escrever "Este mês"
                  // num arquivo com tudo é um rótulo que mente. O filtro por
                  // período existe na tabela, e o botão Exportar de lá respeita.
                  periodLabel: "Histórico completo",
                }),
                tabs,
                geradoEm: agora(),
              });
            }}
          />
        </div>
      </div>

      {/* As 13 abas ocupavam um grid de cartões: 7 linhas no celular (~496px),
          com o conteúdo começando por volta de 676px. Na coluna, a navegação
          custa zero altura no desktop e ~48px no celular. */}
      <ModuleTabRail
        items={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
        active={tab}
        onSelect={setTab}
      >
        {tab === "visao-geral" && <OverviewTab onSelectTab={setTab} />}
        {current && <ModuleTab module={current} />}
      </ModuleTabRail>
    </div>
  );
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function OverviewTab({ onSelectTab }: { onSelectTab: (tabId: string) => void }) {
  const { demoMode } = useDemoMode();
  // MESMAS query keys do ModuleTab: o React Query compartilha o cache, então
  // isto não gera consulta extra — e a visão geral passa a somar exatamente o
  // que as abas mostram. Antes ela lia do snapshot da Torre, que em DEMO é
  // outro conjunto de registros: os números não fechavam entre si.
  const queries = useQueries({
    queries: modules.map((m) => ({
      queryKey: ["operation-records", AREA, m.id],
      queryFn: () => listOperationRecordsByAreaModule(AREA, m.id),
      enabled: !demoMode,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    })),
  });
  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: loadAppSettings,
    enabled: isSupabaseConfigured,
    staleTime: 60_000,
  });

  const registros = useMemo<Record<string, OperationRecord[]>>(() => {
    if (demoMode) return demoByModule;
    return Object.fromEntries(modules.map((m, i) => [m.id, queries[i]?.data ?? []]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, queries.map((q) => q.data).join("|")]);

  const spec = useMemo(
    () =>
      buildLogisticaOverview(
        registros,
        demoMode,
        settings?.remessaTolerancias ?? REMESSA_TOLERANCIAS_PADRAO,
      ),
    [registros, demoMode, settings],
  );

  return (
    <ModuleOverview
      spec={{
        ...spec,
        hero: (
          <TrackingMap
            title="Mapa operacional único"
            subtitle="Cargas, rotas e origem→beneficiamento aparecem no mapa da Torre."
          />
        ),
      }}
      onSelectTab={onSelectTab}
    />
  );
}

function TrackingMap({ title, subtitle }: { title?: string; subtitle?: string; height?: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {title ?? "Mapa operacional unico"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subtitle ?? "Os dados de logistica aparecem no mapa principal da plataforma."}
          </p>
        </div>
        <a
          href="/torre-de-controle"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <MapPin className="h-4 w-4" />
          Abrir mapa
        </a>
      </div>
    </section>
  );
}

function ModuleTab({ module }: { module: ModuleConfig }) {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, string>>(emptyPayload(module));
  // Ficha da carga (só na aba de remessa): clique na linha abre o ciclo, a
  // conferência e as fotos daquele romaneio.
  const [ficha, setFicha] = useState<OperationRecord | null>(null);
  const ehRemessa = module.id === "remessa";
  const fields = useMemo(() => calculatedCostFields(module.fields), [module.fields]);

  // Colunas escolhidas por ESTA pessoa. O padrão é o que a tela já mostrava
  // (5-6 primeiros campos), para ninguém estranhar na primeira abertura — a
  // diferença é que agora os outros 27 campos estão a um clique, em vez de
  // inacessíveis.
  const chavesDisponiveis = useMemo(() => fields.map((f) => f.key), [fields]);
  const chavesPadrao = useMemo(
    () => fields.slice(0, ehRemessa ? 5 : 6).map((f) => f.key),
    [fields, ehRemessa],
  );
  const prefsColunas = useColunasVisiveis(
    `logistica:${module.id}`,
    chavesPadrao,
    chavesDisponiveis,
  );

  // Filtro FORA do DataTable: a busca dele só varre as colunas visíveis (placa
  // não era achável) e, filtrando por dentro, não havia como o botão Exportar
  // saber o que estava na tela.
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState<PeriodValue>(defaultPeriod);
  const [filtrosCampo, setFiltrosCampo] = useState<Record<string, string>>({});

  // Quais cargas têm foto anexada. UMA consulta para a tabela inteira (não uma
  // por linha): antes só dava para descobrir abrindo a ficha de cada uma.
  const { data: idsComFoto } = useQuery({
    queryKey: ["remessa-photos", "ids", demoMode],
    queryFn: async () => new Set((await listRemessaPhotos()).map((f) => f.refId)),
    enabled: ehRemessa && !demoMode,
    staleTime: 60_000,
  });

  const columns = useMemo<DataTableColumn<OperationRecord>[]>(() => {
    const base = fields
      .filter((f) => prefsColunas.colunas.includes(f.key))
      .map((f) => ({
        key: f.key,
        header: f.label,
        accessor: (rec: OperationRecord) => rec.payload[f.key] ?? "",
        render: (rec: OperationRecord) => rec.payload[f.key] || "-",
        align: f.type === "number" ? ("right" as const) : ("left" as const),
      }));
    if (!ehRemessa) return base;
    return [
      ...base,
      {
        key: "etapa",
        header: "Etapa",
        accessor: (rec: OperationRecord) => etapaDe(rec.payload),
        render: (rec: OperationRecord) => {
          const etapa = etapaDe(rec.payload);
          const divergente = remessaDivergencias([rec]).length > 0;
          return (
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-medium",
                  etapa === "conferida"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : etapa === "lavoura"
                      ? "bg-muted text-muted-foreground"
                      : "bg-amber-500/15 text-amber-600",
                )}
              >
                {ETAPA_LABEL[etapa]}
              </span>
              {divergente && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-label="Divergência" />
              )}
              {idsComFoto?.has(rec.id) && (
                <ImageIcon
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-label="Tem foto do romaneio"
                />
              )}
            </span>
          );
        },
        align: "left" as const,
      },
    ];
  }, [fields, ehRemessa, prefsColunas.colunas, idsComFoto]);

  const query = useQuery({
    queryKey: ["operation-records", AREA, module.id],
    queryFn: () => listOperationRecordsByAreaModule(AREA, module.id),
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const records = useMemo<OperationRecord[]>(
    () => (demoMode ? (demoByModule[module.id] ?? []) : (query.data ?? [])),
    [demoMode, module.id, query.data],
  );

  // Seletores de filtro: só campos de texto COM valor no conjunto atual —
  // um <select> vazio ou de campo numérico é ruído. Máximo 3 para a barra não
  // virar um painel de configuração.
  const filtrosDisponiveis = useMemo(() => {
    const candidatos = ehRemessa
      ? ["fazenda", "etapa", "motorista", "cultura", "placa"]
      : ["status", "cliente", "tipo", "responsavel"];
    return candidatos
      .filter((key) => fields.some((f) => f.key === key))
      .map((key) => ({
        key,
        label: fields.find((f) => f.key === key)?.label ?? key,
        opcoes: valoresDistintos(records, key),
        valor: filtrosCampo[key] ?? "",
      }))
      .filter((f) => f.opcoes.length > 1)
      .slice(0, 3);
  }, [ehRemessa, fields, records, filtrosCampo]);

  const [detalhe, setDetalhe] = useState<OperationRecord | null>(null);

  const registrosFiltrados = useMemo(
    () => filtrarRegistros(records, { busca, periodo, campos: filtrosCampo }),
    [records, busca, periodo, filtrosCampo],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["operation-records", AREA, module.id] });
    void queryClient.invalidateQueries({ queryKey: ["operation-records", AREA, "all"] });
    invalidateConnectedQueries(queryClient);
  };

  const createMutation = useMutation({
    mutationFn: createOperationRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };
  const beginEdit = (rec: OperationRecord) => {
    if (demoMode) return toast.info("Dados demo não podem ser editados.");
    setEditing(rec);
    setPayload({ ...emptyPayload(module), ...rec.payload });
    setOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) updateMutation.mutate({ id: editing.id, payload: normalizeCostPayload(payload) });
    else
      createMutation.mutate({
        area: AREA,
        module: module.id,
        payload: normalizeCostPayload(payload),
      });
  };

  const importRows = async (rows: Record<string, string>[]) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createOperationRecord({
        area: AREA,
        module: module.id,
        payload: normalizeCostPayload(row),
      });
    }
    invalidate();
  };

  /**
   * Exporta O QUE ESTÁ NA TELA: mesmas linhas (filtro) e mesmas colunas.
   *
   * Antes era um CSV montado à mão sobre `records` inteiro e `fields` inteiro —
   * o oposto da tela nos dois eixos: exportava registros que o usuário tinha
   * filtrado fora e 33 colunas quando ele via 6. `todas` serve para quem quer
   * mesmo o arquivo completo, mas agora é uma escolha explícita.
   */
  const handleExport = async (todas = false) => {
    if (registrosFiltrados.length === 0) {
      toast.info("Nenhum registro para exportar com os filtros atuais.");
      return;
    }
    const colunas = todas ? fields : fields.filter((f) => prefsColunas.colunas.includes(f.key));
    try {
      await exportRowsToXlsx(
        `agrotorre-${module.id}.xlsx`,
        colunas.map((f) => f.label),
        registrosFiltrados.map((r) => colunas.map((f) => r.payload[f.key] ?? "")),
        module.label.slice(0, 28),
      );
      toast.success(
        `${registrosFiltrados.length} registro(s) exportado(s) em ${colunas.length} coluna(s).`,
      );
    } catch (erro) {
      toast.error((erro as Error).message || "Não foi possível gerar o arquivo.");
    }
  };

  const loading = !demoMode && query.isLoading;
  const focus = moduleFocus[module.id];

  return (
    <div className="space-y-5">
      {focus && focus(records)}
      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <module.icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{module.label}</h3>
              <p className="text-xs text-muted-foreground">{module.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ImportRecordsButton fields={fields} disabled={demoMode} onImport={importRows} />
            <button
              onClick={() => void handleExport()}
              className="h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
            {ehRemessa ? (
              // Entrada nativa: as 3 vias do romaneio, sem passar pelo WhatsApp.
              <RemessaFormDialog onSaved={() => query.refetch()} />
            ) : (
              <button
                onClick={beginCreate}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            )}
          </div>
        </div>

        <TableToolbar
          busca={busca}
          onBusca={setBusca}
          buscaPlaceholder={`Buscar em ${module.label}...`}
          periodo={periodo}
          onPeriodo={setPeriodo}
          filtros={filtrosDisponiveis}
          onFiltro={(key, valor) => setFiltrosCampo((atual) => ({ ...atual, [key]: valor }))}
          colunas={{
            disponiveis: fields.map((f) => ({ key: f.key, label: f.label })),
            visiveis: prefsColunas.colunas,
            alternar: prefsColunas.alternar,
            restaurar: prefsColunas.restaurarPadrao,
          }}
          onLimpar={() => {
            setBusca("");
            setFiltrosCampo({});
            setPeriodo(defaultPeriod());
          }}
          total={records.length}
          visiveis={registrosFiltrados.length}
        />

        <DataTable
          columns={columns}
          data={registrosFiltrados}
          getRowId={(rec) => rec.id}
          loading={loading}
          // Remessa tem ficha própria (ciclo, conferência, fotos); as demais abas
          // abrem o registro inteiro.
          onRowClick={ehRemessa ? (rec) => setFicha(rec) : (rec) => setDetalhe(rec)}
          // A busca vive na TableToolbar: a daqui só enxerga colunas visíveis.
          searchable={false}
          emptyMessage={
            demoMode
              ? "Sem exemplos demo neste módulo."
              : "Nenhum registro real cadastrado neste módulo."
          }
          actions={(rec) => (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => beginEdit(rec)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                aria-label="Editar"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
                  if (window.confirm("Excluir este registro?")) deleteMutation.mutate(rec.id);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                aria-label="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />

        <RowDetailSheet
          open={Boolean(detalhe)}
          onOpenChange={(aberto) => !aberto && setDetalhe(null)}
          titulo={detalhe ? (detalhe.payload[fields[0]?.key ?? ""] ?? module.label) : ""}
          subtitulo={module.label}
          payload={detalhe?.payload ?? {}}
          fields={fields.map((f) => ({ key: f.key, label: f.label }))}
          onEditar={
            detalhe
              ? () => {
                  const alvo = detalhe;
                  setDetalhe(null);
                  beginEdit(alvo);
                }
              : undefined
          }
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar registro" : "Adicionar registro"}</DialogTitle>
              <DialogDescription>{module.label}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {f.label}
                    {f.hint && <span className="ml-1 text-[10px] opacity-70">({f.hint})</span>}
                  </span>
                  {f.type === "textarea" ? (
                    <textarea
                      value={payload[f.key] ?? ""}
                      onChange={(e) =>
                        setPayload((cur) => updateCostPayload(cur, f.key, e.target.value))
                      }
                      className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      step={f.type === "number" ? "any" : undefined}
                      value={payload[f.key] ?? ""}
                      onChange={(e) =>
                        setPayload((cur) => updateCostPayload(cur, f.key, e.target.value))
                      }
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  )}
                </label>
              ))}
            </div>
            <DialogFooter>
              <button
                onClick={() => setOpen(false)}
                className="h-9 rounded-lg border border-border px-3 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Salvar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <RemessaDetailDialog
          registro={ficha}
          open={ficha !== null}
          onOpenChange={(next) => {
            if (!next) setFicha(null);
          }}
          onSaved={() => void query.refetch()}
        />
      </section>
    </div>
  );
}
