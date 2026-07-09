import type { FieldRecord } from "@/lib/supabase-field";

export type TalhaoStatus =
  | "Plantado"
  | "Em preparo"
  | "Colhido"
  | "Pousio"
  | "Planejado"
  | "Inativo";

export type CycleType =
  | "Produção"
  | "Cobertura"
  | "Pousio"
  | "Reforma"
  | "Pastagem"
  | "Experimental";

export type CycleStatus = "Planejado" | "Em andamento" | "Concluído" | "Cancelado";

export type TalhaoCycle = {
  id: string;
  safra: string;
  nome: string;
  cultura: string;
  tipo: CycleType;
  areaHa: number;
  inicio: string;
  fimPrevisto: string;
  fimReal?: string;
  status: CycleStatus;
  produtividadeEsperada?: number;
  produtividadeRealizada?: number;
  custoPrevistoHa?: number;
  custoRealizadoHa?: number;
  margemEstimadaHa?: number;
  objetivo?: string;
  observacoes?: string;
};

export type TimelineEvent = {
  id: string;
  date: string;
  type: string;
  description: string;
  responsible?: string;
  season?: string;
  cycle?: string;
  origin: "Manual" | "Automática";
  impact?: string;
  critical?: boolean;
};

export type FieldAlert = {
  id: string;
  type: string;
  severity: "Crítico" | "Atenção" | "Informativo" | "Recomendação";
  title: string;
  description: string;
  probableCause?: string;
  expectedImpact?: string;
  recommendation?: string;
  dueOn?: string;
  season?: string;
  cycle?: string;
  status: "Aberto" | "Em análise" | "Resolvido" | "Ignorado";
};

export type TalhaoPayload = Record<string, string> & {
  talhao: string;
  codigo?: string;
  fazenda?: string;
  cidade?: string;
  estado?: string;
  area_ha?: string;
  area_util?: string;
  cultura?: string;
  safra?: string;
  ciclo_atual?: string;
  status?: TalhaoStatus;
  coordenadas?: string;
  geometry_geojson?: string;
  farm_geometry_geojson?: string;
  cor_mapa?: string;
  responsavel?: string;
  observacoes?: string;
  plantio_data?: string;
  colheita_prevista?: string;
  estagio_fenologico?: string;
  produtividade_esperada?: string;
  produtividade_realizada?: string;
  produtividade_historica?: string;
  custo_planejado_ha?: string;
  custo_realizado_ha?: string;
  margem_estimada_ha?: string;
  tipo_solo?: string;
  textura_solo?: string;
  profundidade_efetiva?: string;
  drenagem?: string;
  materia_organica?: string;
  ph?: string;
  compactacao?: string;
  erosao?: string;
  ultima_analise_solo?: string;
  aptidao_agricola?: string;
  cultura_recomendada?: string;
  culturas_alternativas?: string;
  necessidade_calagem?: string;
  necessidade_gessagem?: string;
  sensibilidade_estiagem?: string;
  sensibilidade_encharcamento?: string;
  acesso?: string;
  distancia_sede_km?: string;
  irrigacao?: string;
  energia?: string;
  armazenamento_proximo?: string;
  pontos_agua?: string;
  cercas?: string;
  estradas_internas?: string;
  classificacao_estrategica?: string;
  ciclos_json?: string;
};

export type TalhaoRecord = Omit<FieldRecord, "payload"> & {
  payload: TalhaoPayload;
};

export type FarmPerimeterPayload = Record<string, string> & {
  fazenda: string;
  geometry_geojson?: string;
  area_ha?: string;
  perimetro_km?: string;
};

export type FarmPerimeterRecord = Omit<FieldRecord, "payload"> & {
  module: "talhao360-farm";
  payload: FarmPerimeterPayload;
};

export type MapBaseStyle = "satellite" | "map" | "hybrid";

export type Talhao360Model = {
  talhoes: TalhaoRecord[];
  talhao: TalhaoRecord;
  cycles: TalhaoCycle[];
  seasons: string[];
  selectedSeason: string;
  selectedCycle: TalhaoCycle | null;
  events: TimelineEvent[];
  alerts: FieldAlert[];
  lastOperation: TimelineEvent | null;
  nextActivity: TimelineEvent | null;
};

export const statusTone: Record<TalhaoStatus, string> = {
  Plantado: "#16a34a",
  "Em preparo": "#2563eb",
  Colhido: "#d97706",
  Pousio: "#78716c",
  Planejado: "#64748b",
  Inativo: "#94a3b8",
};
