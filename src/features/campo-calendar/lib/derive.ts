// Lógica pura do Calendário (sem React/Supabase): filtros, KPIs, grades de
// mês/semana, alertas/conflitos, geração de tarefas por modelo e custos.
// Datas de dia são comparadas como string "yyyy-MM-dd" para evitar armadilha
// de timezone; parseISO (local) é usado só para montar grades e formatar.
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import type {
  CalendarAlert,
  CalendarCycle,
  CalendarEvent,
  CalendarTalhao,
  CycleTemplate,
} from "@/features/campo-calendar/types/domain";
import type { DailyForecast } from "@/features/campo-calendar/lib/weather";

export const dayKey = (date: Date) => format(date, "yyyy-MM-dd");
const eventStartDay = (event: CalendarEvent) => event.startsAt.slice(0, 10);
const eventEndDay = (event: CalendarEvent) => (event.endsAt || event.startsAt).slice(0, 10);

/** Status que encerram a tarefa — atraso e KPIs ignoram concluída/cancelada. */
export function isEventActive(event: CalendarEvent) {
  return event.statusId !== "concluida" && event.statusId !== "cancelada";
}

export function isOverdue(event: CalendarEvent, now: Date) {
  return isEventActive(event) && eventEndDay(event) < dayKey(now);
}

/** Status visual: evento vencido aparece como atrasado sem destruir o persistido. */
export function effectiveStatusId(event: CalendarEvent, now: Date) {
  return isOverdue(event, now) ? "atrasada" : event.statusId;
}

export type CalendarFilters = {
  fieldId?: string;
  seasonId?: string;
  cycleId?: string;
  status?: string;
  responsible?: string;
  eventType?: string;
  priority?: string;
};

export function applyFilters(events: CalendarEvent[], filters: CalendarFilters, now: Date) {
  return events.filter((event) => {
    if (filters.fieldId && event.talhaoId !== filters.fieldId) return false;
    if (filters.seasonId && event.safra !== filters.seasonId) return false;
    if (filters.cycleId && event.cycleId !== filters.cycleId) return false;
    if (filters.status && effectiveStatusId(event, now) !== filters.status) return false;
    if (filters.responsible && event.responsibleName !== filters.responsible) return false;
    if (filters.eventType && event.eventType !== filters.eventType) return false;
    if (filters.priority && event.priority !== filters.priority) return false;
    return true;
  });
}

export function eventOccursOn(event: CalendarEvent, day: Date) {
  const key = dayKey(day);
  return eventStartDay(event) <= key && key <= eventEndDay(event);
}

export function eventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((event) => eventOccursOn(event, day));
}

/** Semanas completas (Dom–Sáb) que cobrem o mês da data-âncora. */
export function monthMatrix(anchor: Date): Date[][] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const start = startOfWeek(first, { weekStartsOn: 0 });
  const weeks: Date[][] = [];
  let cursor = start;
  while (cursor <= last) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function weekDaysOf(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export type AgendaGroup = { date: Date; events: CalendarEvent[] };

/** Agenda: próximos `days` dias a partir da âncora, só dias com eventos. */
export function agendaGroups(events: CalendarEvent[], anchor: Date, days = 30): AgendaGroup[] {
  return Array.from({ length: days }, (_, index) => addDays(anchor, index))
    .map((date) => ({ date, events: eventsForDay(events, date) }))
    .filter((group) => group.events.length > 0);
}

export type CalendarKpis = {
  hoje: number;
  atrasadas: number;
  proximos7: number;
  decisoesPendentes: number;
  comprasPendentes: number;
  areaProgramadaHa: number;
  proximaColheita?: string;
  custo7: number;
  custo15: number;
  custo30: number;
};

export function costWithinDays(events: CalendarEvent[], now: Date, days: number) {
  const from = dayKey(now);
  const to = dayKey(addDays(now, days));
  return events
    .filter(
      (event) => isEventActive(event) && eventStartDay(event) >= from && eventStartDay(event) <= to,
    )
    .reduce((sum, event) => sum + (event.estimatedCost ?? 0), 0);
}

export function computeKpis(
  events: CalendarEvent[],
  talhoes: CalendarTalhao[],
  now: Date,
): CalendarKpis {
  const today = dayKey(now);
  const in7 = dayKey(addDays(now, 7));
  const in30 = dayKey(addDays(now, 30));
  const active = events.filter(isEventActive);

  const talhoesProgramados = new Set(
    active
      .filter(
        (event) => event.talhaoId && eventStartDay(event) <= in30 && eventEndDay(event) >= today,
      )
      .map((event) => event.talhaoId as string),
  );
  const areaProgramadaHa = talhoes
    .filter((talhao) => talhoesProgramados.has(talhao.id))
    .reduce((sum, talhao) => sum + (talhao.areaHa ?? 0), 0);

  const proximaColheita = active
    .filter((event) => event.eventType === "colheita" && eventStartDay(event) >= today)
    .map(eventStartDay)
    .sort()[0];

  return {
    hoje: active.filter((event) => eventOccursOn(event, now)).length,
    atrasadas: events.filter((event) => isOverdue(event, now)).length,
    proximos7: active.filter((event) => eventStartDay(event) > today && eventStartDay(event) <= in7)
      .length,
    decisoesPendentes: active.filter((event) => event.eventType === "decisao").length,
    comprasPendentes: active.filter((event) => event.eventType === "compra").length,
    areaProgramadaHa,
    proximaColheita,
    custo7: costWithinDays(events, now, 7),
    custo15: costWithinDays(events, now, 15),
    custo30: costWithinDays(events, now, 30),
  };
}

// ── Alertas e conflitos (regras determinísticas, key única evita duplicação) ──

const JANELA_CICLO_TOLERANCIA_DIAS = 15;

export function computeCalendarAlerts(
  events: CalendarEvent[],
  cycles: CalendarCycle[],
  forecast: DailyForecast[],
  now: Date,
): CalendarAlert[] {
  const alerts: CalendarAlert[] = [];
  const today = dayKey(now);
  const rainByDay = new Map(forecast.map((day) => [day.date, day]));
  const active = events.filter(isEventActive);

  for (const event of events) {
    if (isOverdue(event, now)) {
      alerts.push({
        key: `atraso:${event.id}`,
        rule: "tarefa-atrasada",
        severity: event.priority === "critica" ? "critico" : "atencao",
        title: `Tarefa atrasada: ${event.title}`,
        description: `Prevista para ${formatDay(eventEndDay(event))} e ainda não concluída.`,
        eventId: event.id,
        talhaoId: event.talhaoId,
        date: eventEndDay(event),
      });
    }
  }

  for (const event of active) {
    if (event.priority === "critica" && !event.responsibleName && event.eventType !== "decisao") {
      alerts.push({
        key: `sem-responsavel:${event.id}`,
        rule: "critica-sem-responsavel",
        severity: "atencao",
        title: `Tarefa crítica sem responsável: ${event.title}`,
        description: "Defina um responsável antes da data prevista.",
        eventId: event.id,
        talhaoId: event.talhaoId,
        date: eventStartDay(event),
      });
    }
    if (event.eventType === "decisao") {
      const dias = differenceInCalendarDays(parseISO(eventStartDay(event)), parseISO(today));
      if (dias >= 0 && dias <= 3) {
        alerts.push({
          key: `decisao-vencendo:${event.id}`,
          rule: "decisao-vencendo",
          severity: "critico",
          title: `Decisão vencendo: ${event.title}`,
          description: `Prazo em ${formatDay(eventStartDay(event))}.`,
          eventId: event.id,
          talhaoId: event.talhaoId,
          date: eventStartDay(event),
        });
      }
    }
    const startDay = eventStartDay(event);
    const dayForecast = rainByDay.get(startDay);
    if (event.eventType === "pulverizacao" && dayForecast && dayForecast.rainChancePct >= 60) {
      alerts.push({
        key: `chuva-pulverizacao:${event.id}:${startDay}`,
        rule: "chuva-antes-pulverizacao",
        severity: "critico",
        title: `Chuva prevista no dia da pulverização (${dayForecast.rainChancePct}%)`,
        description: `${event.title} em ${formatDay(startDay)} — considere antecipar ou adiar.`,
        eventId: event.id,
        talhaoId: event.talhaoId,
        date: startDay,
      });
    }
    if (event.eventType === "colheita") {
      const wet = forecast.find(
        (day) =>
          day.rainChancePct >= 60 &&
          Math.abs(differenceInCalendarDays(parseISO(day.date), parseISO(startDay))) <= 2,
      );
      if (wet) {
        alerts.push({
          key: `chuva-colheita:${event.id}:${wet.date}`,
          rule: "chuva-proxima-colheita",
          severity: "atencao",
          title: `Chuva próxima da colheita (${wet.rainChancePct}% em ${formatDay(wet.date)})`,
          description: `${event.title} pode ser afetada pela janela úmida.`,
          eventId: event.id,
          talhaoId: event.talhaoId,
          date: wet.date,
        });
      }
    }
    const heat = dayForecast && dayForecast.tempMaxC >= 38;
    if (heat && ["pulverizacao", "plantio", "colheita"].includes(event.eventType)) {
      alerts.push({
        key: `calor:${event.id}:${startDay}`,
        rule: "calor-extremo",
        severity: "atencao",
        title: `Calor extremo previsto (${dayForecast.tempMaxC}°C)`,
        description: `${event.title} em ${formatDay(startDay)} sob temperatura elevada.`,
        eventId: event.id,
        talhaoId: event.talhaoId,
        date: startDay,
      });
    }
  }

  // Janela de plantio encerrando: ciclo planejado começa em ≤7 dias e ainda não
  // existe tarefa de plantio vinculada a ele.
  for (const cycle of cycles) {
    if (cycle.status !== "Planejado") continue;
    const dias = differenceInCalendarDays(parseISO(cycle.inicio), parseISO(today));
    if (dias < 0 || dias > 7) continue;
    const temPlantio = active.some(
      (event) => event.cycleId === cycle.id && event.eventType === "plantio",
    );
    if (!temPlantio) {
      alerts.push({
        key: `janela-plantio:${cycle.id}`,
        rule: "janela-plantio-encerrando",
        severity: "atencao",
        title: `Janela de plantio encerrando: ${cycle.nome} (${cycle.talhaoName})`,
        description: `Ciclo inicia em ${formatDay(cycle.inicio)} e não há plantio agendado.`,
        talhaoId: cycle.talhaoId,
        date: cycle.inicio,
      });
    }
  }

  // Tarefa fora da janela do ciclo (com tolerância para preparos pré-plantio).
  const cycleById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  for (const event of active) {
    if (!event.cycleId) continue;
    const cycle = cycleById.get(event.cycleId);
    if (!cycle?.inicio || !cycle?.fimPrevisto) continue;
    const min = dayKey(addDays(parseISO(cycle.inicio), -JANELA_CICLO_TOLERANCIA_DIAS));
    const max = dayKey(addDays(parseISO(cycle.fimPrevisto), JANELA_CICLO_TOLERANCIA_DIAS));
    if (eventStartDay(event) < min || eventStartDay(event) > max) {
      alerts.push({
        key: `fora-janela:${event.id}`,
        rule: "tarefa-fora-da-janela",
        severity: "atencao",
        title: `Tarefa fora da janela do ciclo: ${event.title}`,
        description: `${cycle.nome} vai de ${formatDay(cycle.inicio)} a ${formatDay(cycle.fimPrevisto)}.`,
        eventId: event.id,
        talhaoId: event.talhaoId,
        date: eventStartDay(event),
      });
    }
  }

  // Sobreposição de ciclos no mesmo talhão (colheita invadindo o próximo plantio).
  const byTalhao = new Map<string, CalendarCycle[]>();
  for (const cycle of cycles) {
    byTalhao.set(cycle.talhaoId, [...(byTalhao.get(cycle.talhaoId) ?? []), cycle]);
  }
  for (const [, list] of byTalhao) {
    const sorted = [...list].sort((a, b) => a.inicio.localeCompare(b.inicio));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (current.inicio < previous.fimPrevisto) {
        alerts.push({
          key: `sobreposicao:${previous.id}:${current.id}`,
          rule: "sobreposicao-de-ciclos",
          severity: "atencao",
          title: `Ciclos sobrepostos em ${current.talhaoName}`,
          description: `${previous.nome} termina em ${formatDay(previous.fimPrevisto)} e ${current.nome} inicia em ${formatDay(current.inicio)}.`,
          talhaoId: current.talhaoId,
          date: current.inicio,
        });
      }
    }
  }

  // Dedup por key determinística (regra + evento/ciclo + período).
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    if (seen.has(alert.key)) return false;
    seen.add(alert.key);
    return true;
  });
}

export function formatDay(iso: string) {
  if (!iso) return "-";
  const date = parseISO(iso.slice(0, 10));
  return Number.isNaN(date.getTime()) ? iso : format(date, "dd/MM/yyyy");
}

// ── Geração de tarefas por modelo de ciclo ──

export type GeneratedTask = {
  key: string;
  itemId: string;
  duplicate: boolean;
  draft: Omit<CalendarEvent, "id">;
};

const normalizeTitle = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Sugere tarefas a partir do modelo, ancoradas no ciclo real. Custo do item é
 * por hectare — vira total quando o ciclo tem área. Duplicidade é detectada por
 * (templateId+item) ou título equivalente já existente no mesmo ciclo.
 */
export function generateFromTemplate(
  template: CycleTemplate,
  cycle: CalendarCycle,
  existing: CalendarEvent[],
): GeneratedTask[] {
  const cycleEvents = existing.filter((event) => event.cycleId === cycle.id);
  let previous = parseISO(cycle.inicio);

  return template.itens.map((item) => {
    const base =
      item.ancora === "inicio"
        ? parseISO(cycle.inicio)
        : item.ancora === "fim"
          ? parseISO(cycle.fimPrevisto)
          : previous;
    const date = addDays(base, item.offsetDias);
    if (item.ancora !== "fim") previous = date;

    const duplicate = cycleEvents.some(
      (event) =>
        (event.templateId === template.id &&
          normalizeTitle(event.title) === normalizeTitle(item.titulo)) ||
        normalizeTitle(event.title) === normalizeTitle(item.titulo),
    );

    return {
      key: `${template.id}:${item.id}`,
      itemId: item.id,
      duplicate,
      draft: {
        title: item.titulo,
        description: item.observacao,
        eventType: item.eventType,
        startsAt: dayKey(date),
        allDay: true,
        statusId: "planejada",
        priority: item.priority,
        responsibleName: item.responsavelSugerido,
        source: "ciclo",
        visibility: "equipe",
        estimatedCost:
          item.custoEstimado != null
            ? Math.round(item.custoEstimado * (cycle.areaHa ?? 1) * 100) / 100
            : undefined,
        templateId: template.id,
        talhaoId: cycle.talhaoId,
        talhaoName: cycle.talhaoName,
        safra: cycle.safra,
        cycleId: cycle.id,
        cicloNome: cycle.nome,
        notes: item.obrigatorio ? undefined : "Tarefa opcional do modelo.",
      },
    };
  });
}

/** Reutiliza as tarefas de um ciclo anterior, deslocando pela diferença de início. */
export function reuseCycleTasks(
  events: CalendarEvent[],
  sourceCycle: CalendarCycle,
  targetCycle: CalendarCycle,
): GeneratedTask[] {
  const shift = differenceInCalendarDays(
    parseISO(targetCycle.inicio),
    parseISO(sourceCycle.inicio),
  );
  const targetEvents = events.filter((event) => event.cycleId === targetCycle.id);

  return events
    .filter((event) => event.cycleId === sourceCycle.id && !event.legacy)
    .map((event) => {
      const startsAt = dayKey(addDays(parseISO(event.startsAt.slice(0, 10)), shift));
      const duplicate = targetEvents.some(
        (item) => normalizeTitle(item.title) === normalizeTitle(event.title),
      );
      return {
        key: `reuse:${event.id}`,
        itemId: event.id,
        duplicate,
        draft: {
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startsAt,
          endsAt: event.endsAt
            ? dayKey(addDays(parseISO(event.endsAt.slice(0, 10)), shift))
            : undefined,
          allDay: event.allDay,
          statusId: "planejada",
          priority: event.priority,
          responsibleName: event.responsibleName,
          source: "ciclo" as const,
          visibility: event.visibility,
          estimatedCost: event.estimatedCost,
          templateId: event.templateId,
          talhaoId: targetCycle.talhaoId,
          talhaoName: targetCycle.talhaoName,
          safra: targetCycle.safra,
          cycleId: targetCycle.id,
          cicloNome: targetCycle.nome,
        },
      };
    });
}

// ── Agregações para relatórios ──

export function groupCount(
  events: CalendarEvent[],
  keyOf: (event: CalendarEvent) => string | undefined,
) {
  const map = new Map<string, number>();
  for (const event of events) {
    const label = keyOf(event) || "—";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupCost(
  events: CalendarEvent[],
  keyOf: (event: CalendarEvent) => string | undefined,
) {
  const map = new Map<string, number>();
  for (const event of events) {
    if (!event.estimatedCost) continue;
    const label = keyOf(event) || "—";
    map.set(label, (map.get(label) ?? 0) + event.estimatedCost);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Impacto estimado do atraso: soma de delay_cost das tarefas vencidas. */
export function delayImpact(events: CalendarEvent[], now: Date) {
  return events
    .filter((event) => isOverdue(event, now))
    .reduce((sum, event) => sum + (event.delayCost ?? 0), 0);
}

/**
 * Transição de status com carimbos: concluir preenche completedAt, cancelar
 * preenche cancelledAt e reabrir limpa ambos — regra única para form e ações rápidas.
 */
export function applyStatusTransition(
  event: Omit<CalendarEvent, "id">,
  statusId: string,
  nowIso: string,
): Omit<CalendarEvent, "id"> {
  return {
    ...event,
    statusId,
    completedAt: statusId === "concluida" ? (event.completedAt ?? nowIso) : undefined,
    cancelledAt: statusId === "cancelada" ? (event.cancelledAt ?? nowIso) : undefined,
  };
}
