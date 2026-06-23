export const calendarTabs = [
  "overview",
  "calendar",
  "timeline",
  "tasks",
  "decisions",
  "cycle-models",
  "reports",
] as const;

export const calendarViews = ["month", "week", "agenda"] as const;
export const calendarStatuses = [
  "Planejada",
  "Pendente",
  "Em andamento",
  "Concluída",
  "Atrasada",
  "Cancelada",
] as const;
export const calendarPriorities = ["Baixa", "Normal", "Alta", "Crítica"] as const;
export const calendarSources = [
  "Manual",
  "Ciclo",
  "Alerta",
  "Clima",
  "Decisão",
  "Integração",
  "Legado",
] as const;
export const calendarVisibilities = ["Equipe", "Gestor", "Todos"] as const;

export type CalendarTab = (typeof calendarTabs)[number];
export type CalendarView = (typeof calendarViews)[number];
export type CalendarStatus = (typeof calendarStatuses)[number] | (string & {});
export type CalendarPriority = (typeof calendarPriorities)[number];
export type CalendarSource = (typeof calendarSources)[number];
export type CalendarVisibility = (typeof calendarVisibilities)[number];

export type CalendarSearch = {
  tab: CalendarTab;
  view: CalendarView;
  date: string;
  fieldId?: string;
  seasonId?: string;
  cycleId?: string;
  status?: CalendarStatus;
  responsible?: string;
  eventType?: string;
  priority?: CalendarPriority;
  dateFrom?: string;
  dateTo?: string;
};

export type CalendarEvent = {
  id: string;
  farmKey: string;
  fazenda: string;
  talhaoId?: string;
  talhaoName?: string;
  seasonId?: string;
  safra?: string;
  cycleId?: string;
  ciclo?: string;
  title: string;
  description?: string;
  eventType: string;
  startsAt: string;
  endsAt?: string;
  allDay: boolean;
  statusId: string;
  status: CalendarStatus;
  priority: CalendarPriority;
  responsibleId?: string;
  responsibleName?: string;
  source: CalendarSource;
  visibility: CalendarVisibility;
  estimatedCost?: number;
  delayCost?: number;
  decisionOptions: string[];
  decisionSelected?: string;
  weatherRisk?: string;
  weatherSummary?: string;
  relatedModule?: string;
  relatedRecordId?: string;
  templateId?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventInput = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;

export type CalendarCycleOption = {
  id: string;
  fieldId: string;
  seasonId: string;
  name: string;
  crop?: string;
};

export type CalendarField = {
  id: string;
  name: string;
  code: string;
  crop: string;
  areaHa: number;
  season?: string;
  cycle?: string;
  status?: string;
  color?: string;
  geometryGeoJson?: string;
  farmGeometryGeoJson?: string;
  cycles: CalendarCycleOption[];
};

export type CalendarStatusDefinition = {
  id: string;
  name: string;
  color: string;
  order: number;
  active: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CalendarWorkspace = {
  farm: {
    key: string;
    name: string;
    location: string;
    season: string;
  };
  fields: CalendarField[];
  events: CalendarEvent[];
  statuses: CalendarStatusDefinition[];
};

export type CalendarEventFilters = Pick<
  CalendarSearch,
  | "fieldId"
  | "seasonId"
  | "cycleId"
  | "status"
  | "responsible"
  | "eventType"
  | "priority"
  | "dateFrom"
  | "dateTo"
>;
