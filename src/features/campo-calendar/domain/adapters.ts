import { calendarEventSchema } from "@/features/campo-calendar/schemas/domain";
import type {
  CalendarEvent,
  CalendarPriority,
  CalendarSource,
  CalendarStatus,
  CalendarVisibility,
} from "@/features/campo-calendar/types";
import { defaultStatusIdByName } from "@/features/campo-calendar/data/statuses";

const DEFAULT_OFFSET = "-03:00";

export type CalendarFieldRecord = {
  id: string;
  module: string;
  payload: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

const statusAliases: Record<string, CalendarStatus> = {
  planned: "Planejada",
  Planejado: "Planejada",
  Planejada: "Planejada",
  Pendente: "Pendente",
  "in-progress": "Em andamento",
  "Em andamento": "Em andamento",
  completed: "Concluída",
  Concluído: "Concluída",
  Concluída: "Concluída",
  delayed: "Atrasada",
  Atrasada: "Atrasada",
  cancelled: "Cancelada",
  Cancelado: "Cancelada",
  Cancelada: "Cancelada",
};

const priorityAliases: Record<string, CalendarPriority> = {
  low: "Baixa",
  Baixa: "Baixa",
  medium: "Normal",
  normal: "Normal",
  Média: "Normal",
  Normal: "Normal",
  high: "Alta",
  Alta: "Alta",
  critical: "Crítica",
  Crítica: "Crítica",
};

function optional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function numberValue(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function jsonArray(value: string | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
  } catch {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function normalizeCalendarInstant(
  value: string | undefined,
  fallback: string,
  allDay = true,
) {
  const candidate = optional(value) || fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return `${candidate}T${allDay ? "12:00:00" : "00:00:00"}${DEFAULT_OFFSET}`;
  }
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return candidate;
}

function status(value: string | undefined): CalendarStatus {
  return statusAliases[value || ""] || optional(value) || "Planejada";
}

function priority(value: string | undefined): CalendarPriority {
  return priorityAliases[value || ""] || "Normal";
}

function source(value: string | undefined, legacy: boolean): CalendarSource {
  if (legacy) return "Legado";
  return ["Manual", "Ciclo", "Alerta", "Clima", "Decisão", "Integração"].includes(value || "")
    ? (value as CalendarSource)
    : "Manual";
}

function visibility(value: string | undefined): CalendarVisibility {
  return ["Equipe", "Gestor", "Todos"].includes(value || "")
    ? (value as CalendarVisibility)
    : "Equipe";
}

export function fieldRecordToCalendarEvent(record: CalendarFieldRecord): CalendarEvent {
  const payload = record.payload;
  const legacy = record.module === "calendario";
  const createdAt = normalizeCalendarInstant(
    record.created_at,
    "1970-01-01T00:00:00.000Z",
    false,
  );
  const updatedAt = normalizeCalendarInstant(record.updated_at, createdAt, false);
  const allDay = payload.all_day !== "false";
  const startsAt = normalizeCalendarInstant(
    payload.starts_at ||
      payload.start_date ||
      payload.data ||
      payload.date ||
      payload.plantio_inicio,
    createdAt,
    allDay,
  );
  const rawEndsAt =
    payload.ends_at || payload.end_date || payload.colheita_prevista || undefined;

  return calendarEventSchema.parse({
    id: record.id,
    farmKey: payload.farm_key || slug(payload.fazenda || "fazenda-ativa"),
    fazenda: payload.fazenda || "Fazenda ativa",
    talhaoId: optional(payload.talhao_id || payload.field_id),
    talhaoName: optional(payload.talhao),
    seasonId: optional(payload.season_id || payload.season || payload.safra),
    safra: optional(payload.safra || payload.season),
    cycleId: optional(payload.cycle_id),
    ciclo: optional(payload.ciclo || payload.cycle),
    title: payload.title || payload.cultura || payload.tipo || "Evento de campo",
    description: optional(
      payload.description || payload.observacao || payload.sazonalidade,
    ),
    eventType:
      payload.event_type || payload.tipo || (legacy ? "Plantio e colheita" : "Evento"),
    startsAt,
    endsAt: rawEndsAt ? normalizeCalendarInstant(rawEndsAt, startsAt, allDay) : undefined,
    allDay,
    statusId:
      payload.status_id ||
      defaultStatusIdByName[status(payload.status)] ||
      slug(status(payload.status)),
    status: status(payload.status),
    priority: priority(payload.priority),
    responsibleId: optional(payload.responsible_id),
    responsibleName: optional(payload.responsible_name || payload.responsible || payload.responsavel),
    source: source(payload.source || payload.origin, legacy),
    visibility: visibility(payload.visibility),
    estimatedCost: numberValue(payload.estimated_cost),
    delayCost: numberValue(payload.delay_cost),
    decisionOptions: jsonArray(payload.decision_options),
    decisionSelected: optional(payload.decision_selected),
    weatherRisk: optional(payload.weather_risk),
    weatherSummary: optional(payload.weather_summary),
    relatedModule: optional(payload.related_module),
    relatedRecordId: optional(payload.related_record_id),
    templateId: optional(payload.template_id),
    completedAt: payload.completed_at
      ? normalizeCalendarInstant(payload.completed_at, startsAt, false)
      : undefined,
    cancelledAt: payload.cancelled_at
      ? normalizeCalendarInstant(payload.cancelled_at, startsAt, false)
      : undefined,
    notes: optional(payload.notes),
    createdAt,
    updatedAt,
  });
}

export function calendarEventToPayload(event: CalendarEvent): Record<string, string> {
  const value = calendarEventSchema.parse(event);
  const payload: Record<string, string | undefined> = {
    schema_version: "1",
    farm_key: value.farmKey,
    fazenda: value.fazenda,
    field_id: value.talhaoId,
    talhao_id: value.talhaoId,
    talhao: value.talhaoName,
    season_id: value.seasonId,
    season: value.seasonId,
    safra: value.safra || value.seasonId,
    cycle_id: value.cycleId,
    cycle: value.ciclo,
    ciclo: value.ciclo,
    title: value.title,
    description: value.description,
    event_type: value.eventType,
    starts_at: value.startsAt,
    ends_at: value.endsAt,
    all_day: String(value.allDay),
    status_id: value.statusId,
    status: value.status,
    priority: value.priority,
    responsible_id: value.responsibleId,
    responsible_name: value.responsibleName,
    source: value.source,
    visibility: value.visibility,
    estimated_cost:
      value.estimatedCost === undefined ? undefined : String(value.estimatedCost),
    delay_cost: value.delayCost === undefined ? undefined : String(value.delayCost),
    decision_options: JSON.stringify(value.decisionOptions),
    decision_selected: value.decisionSelected,
    weather_risk: value.weatherRisk,
    weather_summary: value.weatherSummary,
    related_module: value.relatedModule,
    related_record_id: value.relatedRecordId,
    template_id: value.templateId,
    completed_at: value.completedAt,
    cancelled_at: value.cancelledAt,
    notes: value.notes,
  };
  return Object.fromEntries(
    Object.entries(payload).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
