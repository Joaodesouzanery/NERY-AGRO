// Domínio canônico do Calendário de Campo. O evento criado aqui é a fonte de
// verdade: Talhão 360, Operações e Financeiro referenciam por id — nunca copiam.
// Persistência inicial em field_records (module = calendar-event | calendar-template |
// calendar-status), isolada em api/services.ts para permitir migração futura.

export const calendarEventTypes = [
  "operacao",
  "monitoramento",
  "plantio",
  "adubacao",
  "pulverizacao",
  "irrigacao",
  "colheita",
  "compra",
  "manutencao",
  "decisao",
  "alerta",
  "marco",
  "administrativa",
  "personalizado",
] as const;
export type CalendarEventType = (typeof calendarEventTypes)[number];

export const eventTypeLabels: Record<CalendarEventType, string> = {
  operacao: "Operação de campo",
  monitoramento: "Monitoramento",
  plantio: "Plantio",
  adubacao: "Adubação",
  pulverizacao: "Pulverização",
  irrigacao: "Irrigação",
  colheita: "Colheita",
  compra: "Compra",
  manutencao: "Manutenção",
  decisao: "Decisão",
  alerta: "Alerta",
  marco: "Marco de ciclo",
  administrativa: "Tarefa administrativa",
  personalizado: "Personalizado",
};

export const calendarPriorities = ["baixa", "normal", "alta", "critica"] as const;
export type CalendarPriority = (typeof calendarPriorities)[number];

export const priorityLabels: Record<CalendarPriority, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  critica: "Crítica",
};

export const calendarSources = [
  "manual",
  "ciclo",
  "alerta",
  "clima",
  "decisao",
  "integracao",
  "legado",
] as const;
export type CalendarSource = (typeof calendarSources)[number];

export const sourceLabels: Record<CalendarSource, string> = {
  manual: "Manual",
  ciclo: "Ciclo",
  alerta: "Alerta",
  clima: "Clima",
  decisao: "Decisão",
  integracao: "Integração",
  legado: "Legado",
};

export const calendarVisibilities = ["equipe", "gestor", "todos"] as const;
export type CalendarVisibility = (typeof calendarVisibilities)[number];

export const visibilityLabels: Record<CalendarVisibility, string> = {
  equipe: "Equipe",
  gestor: "Gestor",
  todos: "Todos",
};

// Status padrão: identificadores internos fixos (regras do sistema dependem
// deles); o rótulo pode ser personalizado, o id nunca muda.
export const defaultStatusIds = [
  "planejada",
  "pendente",
  "em-andamento",
  "concluida",
  "atrasada",
  "cancelada",
] as const;
export type DefaultStatusId = (typeof defaultStatusIds)[number];

export type CalendarStatus = {
  id: string;
  label: string;
  order: number;
  active: boolean;
  /** true para status criados pelo usuário (module = calendar-status). */
  custom: boolean;
  /** id do field_record que persiste o status custom/personalização. */
  recordId?: string;
};

export const defaultStatuses: CalendarStatus[] = [
  { id: "planejada", label: "Planejada", order: 0, active: true, custom: false },
  { id: "pendente", label: "Pendente", order: 1, active: true, custom: false },
  { id: "em-andamento", label: "Em andamento", order: 2, active: true, custom: false },
  { id: "concluida", label: "Concluída", order: 3, active: true, custom: false },
  { id: "atrasada", label: "Atrasada", order: 4, active: true, custom: false },
  { id: "cancelada", label: "Cancelada", order: 5, active: true, custom: false },
];

export type CalendarEvent = {
  /** id do field_record (ou id sintético `<recordId>::sufixo` para legados). */
  id: string;
  farmKey?: string;
  fazenda?: string;
  talhaoId?: string;
  talhaoName?: string;
  /** Safra funciona como seasonId (ex.: "2025/2026"). */
  safra?: string;
  cycleId?: string;
  cicloNome?: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  /** ISO local (YYYY-MM-DD ou YYYY-MM-DDTHH:mm). */
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  statusId: string;
  priority: CalendarPriority;
  responsibleId?: string;
  responsibleName?: string;
  source: CalendarSource;
  visibility: CalendarVisibility;
  estimatedCost?: number;
  delayCost?: number;
  decisionOptions?: string[];
  decisionSelected?: string;
  weatherRisk?: string;
  weatherSummary?: string;
  relatedModule?: string;
  relatedRecordId?: string;
  templateId?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Registro antigo (module = calendario) exibido via adapter, somente leitura. */
  legacy?: boolean;
};

export type TemplateAnchor = "inicio" | "fim" | "anterior";

export type CycleTemplateItem = {
  id: string;
  titulo: string;
  eventType: CalendarEventType;
  /** Deslocamento em dias a partir da âncora. */
  offsetDias: number;
  ancora: TemplateAnchor;
  responsavelSugerido?: string;
  priority: CalendarPriority;
  custoEstimado?: number;
  obrigatorio: boolean;
  observacao?: string;
};

export type CycleTemplate = {
  id: string;
  recordId?: string;
  nome: string;
  cultura: string;
  cicloTipo: string;
  regiao?: string;
  regime: "irrigado" | "sequeiro" | "ambos";
  duracaoDias?: number;
  ativo: boolean;
  itens: CycleTemplateItem[];
};

/** Talhão/ciclo lidos do Talhão 360 via adapter (integrations/talhao-360.ts). */
export type CalendarTalhao = {
  id: string;
  nome: string;
  fazenda?: string;
  areaHa?: number;
  safra?: string;
  corMapa?: string;
  geometry?: GeoJSON.Polygon;
};

export type CalendarCycle = {
  id: string;
  talhaoId: string;
  talhaoName: string;
  safra: string;
  nome: string;
  cultura: string;
  tipo: string;
  inicio: string;
  fimPrevisto: string;
  status: string;
  areaHa?: number;
  custoPrevistoHa?: number;
};

/** Alerta calculado (clima/regras) ou manual — nunca duplicado (key determinística). */
export type CalendarAlert = {
  key: string;
  rule: string;
  severity: "critico" | "atencao" | "informativo";
  title: string;
  description: string;
  eventId?: string;
  talhaoId?: string;
  date?: string;
};
