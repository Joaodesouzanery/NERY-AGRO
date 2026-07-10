// Persistência e (de)serialização do Calendário. Tudo que toca field_records
// passa por aqui — trocar por tabelas relacionais no futuro não deve exigir
// mudanças na interface. Módulos: calendar-event, calendar-template,
// calendar-status; "calendario" (legado) é lido via adapter e nunca regravado.
import {
  createFieldRecord,
  deleteFieldRecord,
  listAllFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import {
  calendarEventTypes,
  calendarPriorities,
  calendarSources,
  calendarVisibilities,
  defaultStatuses,
  type CalendarCycle,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarPriority,
  type CalendarSource,
  type CalendarStatus,
  type CalendarTalhao,
  type CalendarVisibility,
  type CycleTemplate,
  type CycleTemplateItem,
} from "@/features/campo-calendar/types/domain";
import {
  listCalendarCycles,
  listCalendarTalhoes,
  resolveTalhao,
} from "@/features/campo-calendar/integrations/talhao-360";

export const CALENDAR_EVENT_MODULE = "calendar-event";
export const CALENDAR_TEMPLATE_MODULE = "calendar-template";
export const CALENDAR_STATUS_MODULE = "calendar-status";
export const LEGACY_CALENDAR_MODULE = "calendario";

export type CalendarModel = {
  events: CalendarEvent[];
  templates: CycleTemplate[];
  statuses: CalendarStatus[];
  talhoes: CalendarTalhao[];
  cycles: CalendarCycle[];
  fazendas: string[];
  safras: string[];
  responsaveis: string[];
};

export async function listCalendarRecords() {
  return listAllFieldRecords();
}

function asEnum<T extends string>(list: readonly T[], value: string | undefined, fallback: T): T {
  return list.includes((value ?? "") as T) ? (value as T) : fallback;
}

function numOrUndefined(value?: string) {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptions(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : undefined;
  } catch {
    return undefined;
  }
}

/** field_record (module = calendar-event) → evento canônico. */
export function eventFromRecord(record: FieldRecord): CalendarEvent {
  const p = record.payload;
  return {
    id: record.id,
    farmKey: p.farm_key || undefined,
    fazenda: p.fazenda || undefined,
    talhaoId: p.talhao_id || undefined,
    talhaoName: p.talhao || undefined,
    safra: p.safra || undefined,
    cycleId: p.cycle_id || undefined,
    cicloNome: p.ciclo || undefined,
    title: p.title || "Tarefa",
    description: p.description || undefined,
    eventType: asEnum<CalendarEventType>(calendarEventTypes, p.event_type, "operacao"),
    startsAt: p.starts_at || record.created_at?.slice(0, 10) || "",
    endsAt: p.ends_at || undefined,
    allDay: p.all_day !== "false",
    statusId: p.status_id || "planejada",
    priority: asEnum<CalendarPriority>(calendarPriorities, p.priority, "normal"),
    responsibleId: p.responsible_id || undefined,
    responsibleName: p.responsible_name || undefined,
    source: asEnum<CalendarSource>(calendarSources, p.source, "manual"),
    visibility: asEnum<CalendarVisibility>(calendarVisibilities, p.visibility, "equipe"),
    estimatedCost: numOrUndefined(p.estimated_cost),
    delayCost: numOrUndefined(p.delay_cost),
    decisionOptions: parseOptions(p.decision_options_json),
    decisionSelected: p.decision_selected || undefined,
    weatherRisk: p.weather_risk || undefined,
    weatherSummary: p.weather_summary || undefined,
    relatedModule: p.related_module || undefined,
    relatedRecordId: p.related_record_id || undefined,
    templateId: p.template_id || undefined,
    completedAt: p.completed_at || undefined,
    cancelledAt: p.cancelled_at || undefined,
    notes: p.notes || undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/** Evento canônico → payload string-only de field_records. */
export function eventToPayload(event: Omit<CalendarEvent, "id">): Record<string, string> {
  return {
    farm_key: event.farmKey ?? "",
    fazenda: event.fazenda ?? "",
    talhao_id: event.talhaoId ?? "",
    talhao: event.talhaoName ?? "",
    safra: event.safra ?? "",
    cycle_id: event.cycleId ?? "",
    ciclo: event.cicloNome ?? "",
    title: event.title,
    description: event.description ?? "",
    event_type: event.eventType,
    starts_at: event.startsAt,
    ends_at: event.endsAt ?? "",
    all_day: String(event.allDay),
    status_id: event.statusId,
    priority: event.priority,
    responsible_id: event.responsibleId ?? "",
    responsible_name: event.responsibleName ?? "",
    source: event.source,
    visibility: event.visibility,
    estimated_cost: event.estimatedCost != null ? String(event.estimatedCost) : "",
    delay_cost: event.delayCost != null ? String(event.delayCost) : "",
    decision_options_json: event.decisionOptions?.length
      ? JSON.stringify(event.decisionOptions)
      : "",
    decision_selected: event.decisionSelected ?? "",
    weather_risk: event.weatherRisk ?? "",
    weather_summary: event.weatherSummary ?? "",
    related_module: event.relatedModule ?? "",
    related_record_id: event.relatedRecordId ?? "",
    template_id: event.templateId ?? "",
    completed_at: event.completedAt ?? "",
    cancelled_at: event.cancelledAt ?? "",
    notes: event.notes ?? "",
  };
}

/**
 * Adapter de leitura do calendário legado (module = calendario): cada registro
 * vira até dois eventos (janela de plantio + marco de colheita), com origem
 * "legado" e somente leitura. Nada é migrado nem apagado automaticamente.
 */
export function legacyEventsFromRecord(record: FieldRecord): CalendarEvent[] {
  const p = record.payload;
  const cultura = p.cultura || "Cultura";
  const shared = {
    talhaoName: p.talhao || undefined,
    safra: p.sazonalidade || undefined,
    description: p.sazonalidade ? `Sazonalidade: ${p.sazonalidade}` : undefined,
    allDay: true,
    statusId: "planejada",
    priority: "normal" as CalendarPriority,
    source: "legado" as CalendarSource,
    visibility: "todos" as CalendarVisibility,
    notes: p.alerta ? `Alerta legado de colheita: ${p.alerta}` : undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    legacy: true,
  };
  const events: CalendarEvent[] = [];
  if (p.plantio_inicio) {
    events.push({
      ...shared,
      id: `${record.id}::plantio`,
      title: `Janela de plantio · ${cultura}`,
      eventType: "plantio",
      startsAt: p.plantio_inicio,
    });
  }
  if (p.colheita_prevista) {
    events.push({
      ...shared,
      id: `${record.id}::colheita`,
      title: `Colheita prevista · ${cultura}`,
      eventType: "colheita",
      startsAt: p.colheita_prevista,
    });
  }
  return events;
}

function templateFromRecord(record: FieldRecord): CycleTemplate {
  const p = record.payload;
  let itens: CycleTemplateItem[] = [];
  try {
    const parsed = JSON.parse(p.itens_json || "[]");
    if (Array.isArray(parsed)) itens = parsed as CycleTemplateItem[];
  } catch {
    itens = [];
  }
  return {
    id: p.template_key || record.id,
    recordId: record.id,
    nome: p.nome || "Modelo",
    cultura: p.cultura || "",
    cicloTipo: p.ciclo_tipo || "",
    regiao: p.regiao || undefined,
    regime: (["irrigado", "sequeiro", "ambos"] as const).includes(
      p.regime as "irrigado" | "sequeiro" | "ambos",
    )
      ? (p.regime as CycleTemplate["regime"])
      : "ambos",
    duracaoDias: numOrUndefined(p.duracao_dias),
    ativo: p.ativo !== "false",
    itens,
  };
}

export function templateToPayload(template: Omit<CycleTemplate, "recordId">) {
  return {
    template_key: template.id,
    nome: template.nome,
    cultura: template.cultura,
    ciclo_tipo: template.cicloTipo,
    regiao: template.regiao ?? "",
    regime: template.regime,
    duracao_dias: template.duracaoDias != null ? String(template.duracaoDias) : "",
    ativo: String(template.ativo),
    itens_json: JSON.stringify(template.itens),
  };
}

function statusFromRecord(record: FieldRecord): CalendarStatus {
  const p = record.payload;
  return {
    id: p.status_key || record.id,
    label: p.label || "Status",
    order: numOrUndefined(p.order) ?? 99,
    active: p.active !== "false",
    custom: p.custom !== "false",
    recordId: record.id,
  };
}

export function statusToPayload(status: Omit<CalendarStatus, "recordId">) {
  return {
    status_key: status.id,
    label: status.label,
    order: String(status.order),
    active: String(status.active),
    custom: String(status.custom),
  };
}

/**
 * Consolida field_records em um modelo único do Calendário: eventos canônicos +
 * legados, modelos, status (padrão + personalizados) e talhões/ciclos do
 * Talhão 360 via adapter. Vínculos preferem id; nome é fallback legado.
 */
export function buildCalendarModel(records: FieldRecord[]): CalendarModel {
  const talhoes = listCalendarTalhoes(records);
  const cycles = listCalendarCycles(records);

  const canonical = records
    .filter((record) => record.module === CALENDAR_EVENT_MODULE)
    .map(eventFromRecord);
  const legacy = records
    .filter((record) => record.module === LEGACY_CALENDAR_MODULE)
    .flatMap(legacyEventsFromRecord);

  const events = [...canonical, ...legacy]
    .map((event) => {
      const talhao = resolveTalhao(talhoes, event.talhaoId, event.talhaoName);
      return talhao ? { ...event, talhaoId: talhao.id, talhaoName: talhao.nome } : event;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // Personalizações de status: registros custom entram na lista; registros com
  // status_key padrão apenas sobrescrevem rótulo/ordem/ativo (id interno fixo).
  const statusRecords = records
    .filter((record) => record.module === CALENDAR_STATUS_MODULE)
    .map(statusFromRecord);
  const overrides = new Map(statusRecords.map((status) => [status.id, status]));
  const statuses = [
    ...defaultStatuses.map((status) => {
      const override = overrides.get(status.id);
      return override
        ? { ...status, label: override.label, order: override.order, active: override.active }
        : status;
    }),
    ...statusRecords.filter((status) => !defaultStatuses.some((base) => base.id === status.id)),
  ].sort((a, b) => a.order - b.order);

  const templates = records
    .filter((record) => record.module === CALENDAR_TEMPLATE_MODULE)
    .map(templateFromRecord);

  const fazendas = Array.from(
    new Set([...talhoes.map((t) => t.fazenda), ...events.map((e) => e.fazenda)].filter(Boolean)),
  ) as string[];
  const safras = Array.from(
    new Set([...cycles.map((c) => c.safra), ...events.map((e) => e.safra)].filter(Boolean)),
  ) as string[];
  const responsaveis = Array.from(
    new Set(events.map((e) => e.responsibleName).filter(Boolean)),
  ) as string[];

  return { events, templates, statuses, talhoes, cycles, fazendas, safras, responsaveis };
}

// ── Escrita (modo REAL — o modo DEMO usa data/demo-store.ts e nunca chega aqui) ──

export async function createCalendarEvent(event: Omit<CalendarEvent, "id">) {
  return createFieldRecord({ module: CALENDAR_EVENT_MODULE, payload: eventToPayload(event) });
}

export async function updateCalendarEvent(id: string, event: Omit<CalendarEvent, "id">) {
  return updateFieldRecord({ id, payload: eventToPayload(event) });
}

export async function deleteCalendarEvent(id: string) {
  return deleteFieldRecord(id);
}

export async function saveTemplate(template: CycleTemplate) {
  const payload = templateToPayload(template);
  if (template.recordId) return updateFieldRecord({ id: template.recordId, payload });
  return createFieldRecord({ module: CALENDAR_TEMPLATE_MODULE, payload });
}

export async function deleteTemplate(recordId: string) {
  return deleteFieldRecord(recordId);
}

export async function saveStatus(status: CalendarStatus) {
  const payload = statusToPayload(status);
  if (status.recordId) return updateFieldRecord({ id: status.recordId, payload });
  return createFieldRecord({ module: CALENDAR_STATUS_MODULE, payload });
}
