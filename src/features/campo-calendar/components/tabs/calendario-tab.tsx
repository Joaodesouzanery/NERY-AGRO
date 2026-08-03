// Calendário visual: mês, semana e agenda. A âncora temporal vive no search
// param `date` (refresh/links preservam o período). Eventos coloridos por tipo,
// multi-dia aparecem em todo o intervalo; previsão de chuva (mock) é indicada
// de forma distinta de eventos (chip tracejado).
import { useMemo } from "react";
import { addDays, addMonths, format, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, CloudRain, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  agendaGroups,
  dayKey,
  eventsForDay,
  isOverdue,
  monthMatrix,
  weekDaysOf,
} from "@/features/campo-calendar/lib/derive";
import { calendarViews, type CalendarView } from "@/features/campo-calendar/schemas/navigation";
import { eventTypeLabels, type CalendarEvent } from "@/features/campo-calendar/types/domain";
import { eventTypeTone } from "@/features/campo-calendar/components/event-tone";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";

const viewLabels: Record<CalendarView, string> = {
  mes: "Mês",
  semana: "Semana",
  agenda: "Agenda",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioTab(props: CalendarTabProps) {
  const { events, forecast, now, search, patchSearch, onCreate, onEdit } = props;
  const view = search.view;
  const anchor = useMemo(() => (search.date ? parseISO(search.date) : now), [search.date, now]);
  const rainByDay = useMemo(
    () => new Map(forecast.filter((day) => day.rainChancePct >= 60).map((day) => [day.date, day])),
    [forecast],
  );

  const navigate = (direction: -1 | 0 | 1) => {
    if (direction === 0) return patchSearch({ date: undefined });
    const next =
      view === "mes"
        ? addMonths(anchor, direction)
        : addDays(anchor, view === "semana" ? direction * 7 : direction * 30);
    patchSearch({ date: dayKey(next) });
  };

  const periodLabel =
    view === "mes"
      ? format(anchor, "MMMM yyyy", { locale: ptBR })
      : view === "semana"
        ? `Semana de ${format(weekDaysOf(anchor)[0], "dd/MM", { locale: ptBR })}`
        : `A partir de ${format(anchor, "dd/MM/yyyy", { locale: ptBR })}`;

  const legendTypes = useMemo(() => {
    const used = new Set(events.map((event) => event.eventType));
    return [...used];
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
            aria-label="Período anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(0)}
            className="h-9 rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            Hoje
          </button>
          <button
            onClick={() => navigate(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
            aria-label="Próximo período"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-semibold capitalize">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {calendarViews.map((option) => (
              <button
                key={option}
                onClick={() => patchSearch({ view: option })}
                className={cn(
                  "h-8 rounded-md px-3 text-xs font-medium",
                  view === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {viewLabels[option]}
              </button>
            ))}
          </div>
          <button
            onClick={() => onCreate({ date: dayKey(anchor) })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova tarefa
          </button>
        </div>
      </div>

      {view === "mes" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
          <div className="grid min-w-[760px] grid-cols-7 gap-1.5">
            {WEEKDAYS.map((label) => (
              <div
                key={label}
                className="rounded-md bg-muted/40 py-1.5 text-center text-[11px] font-bold uppercase text-muted-foreground"
              >
                {label}
              </div>
            ))}
            {monthMatrix(anchor)
              .flat()
              .map((day) => {
                const dayEvents = eventsForDay(events, day);
                const rain = rainByDay.get(dayKey(day));
                const isToday = isSameDay(day, now);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "group min-h-24 rounded-md border border-border bg-background/60 p-1.5",
                      !isSameMonth(day, anchor) && "opacity-45",
                      isToday && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-semibold", isToday && "text-primary")}>
                        {format(day, "d")}
                      </span>
                      <button
                        onClick={() => onCreate({ date: dayKey(day) })}
                        className="hidden h-5 w-5 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted group-hover:inline-flex"
                        aria-label={`Adicionar tarefa em ${format(day, "dd/MM")}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {rain && (
                      <span className="mt-1 flex items-center gap-1 rounded border border-dashed border-chart-2/60 px-1 py-0.5 text-[10px] text-muted-foreground">
                        <CloudRain className="h-3 w-3" />
                        {rain.rainChancePct}%
                      </span>
                    )}
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <EventChip key={event.id} event={event} now={now} onEdit={onEdit} />
                      ))}
                      {dayEvents.length > 3 && (
                        <button
                          onClick={() => patchSearch({ view: "agenda", date: dayKey(day) })}
                          className="w-full rounded px-1 py-0.5 text-left text-[10px] font-medium text-muted-foreground hover:bg-muted"
                        >
                          +{dayEvents.length - 3} eventos
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {view === "semana" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
          <div className="grid min-w-[820px] grid-cols-7 gap-1.5">
            {weekDaysOf(anchor).map((day) => {
              const dayEvents = eventsForDay(events, day);
              const rain = rainByDay.get(dayKey(day));
              const isToday = isSameDay(day, now);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-48 rounded-md border border-border bg-background/60 p-2",
                    isToday && "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("text-xs font-semibold", isToday && "text-primary")}>
                      {WEEKDAYS[day.getDay()]} · {format(day, "dd/MM")}
                    </div>
                    <button
                      onClick={() => onCreate({ date: dayKey(day) })}
                      className="inline-flex h-5 w-5 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted"
                      aria-label={`Adicionar em ${format(day, "dd/MM")}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  {rain && (
                    <span className="mt-1.5 flex w-fit items-center gap-1 rounded border border-dashed border-chart-2/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <CloudRain className="h-3 w-3" />
                      chuva {rain.rainChancePct}%
                    </span>
                  )}
                  <div className="mt-1.5 space-y-1">
                    {dayEvents.map((event) => (
                      <EventChip key={event.id} event={event} now={now} onEdit={onEdit} detailed />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "agenda" && (
        <div className="space-y-3">
          {agendaGroups(events, anchor, 30).map((group) => (
            <div
              key={group.date.toISOString()}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-semibold capitalize",
                    isSameDay(group.date, now) && "text-primary",
                  )}
                >
                  {format(group.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
                {rainByDay.get(dayKey(group.date)) && (
                  <span className="flex items-center gap-1 rounded border border-dashed border-chart-2/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <CloudRain className="h-3 w-3" />
                    chuva {rainByDay.get(dayKey(group.date))!.rainChancePct}%
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {group.events.map((event) => (
                  <EventChip key={event.id} event={event} now={now} onEdit={onEdit} detailed />
                ))}
              </div>
            </div>
          ))}
          {agendaGroups(events, anchor, 30).length === 0 && (
            <EmptyState
              title="Sem eventos nos próximos 30 dias"
              description="Ajuste os filtros ou crie uma nova tarefa."
              icon={CalendarDays}
            />
          )}
        </div>
      )}

      {legendTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase">Legenda</span>
          {legendTypes.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: eventTypeTone[type] }}
                aria-hidden
              />
              {eventTypeLabels[type]}
            </span>
          ))}
          {/* Sem previsão carregada (o caso do modo REAL) não há ícone de chuva
              no calendário — a legenda descreveria algo que não está na tela. */}
          {forecast.length > 0 && (
            <span className="flex items-center gap-1.5">
              <CloudRain className="h-3 w-3" />
              previsão (vitrine) — não é evento
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EventChip({
  event,
  now,
  onEdit,
  detailed,
}: {
  event: CalendarEvent;
  now: Date;
  onEdit: (event: CalendarEvent) => void;
  detailed?: boolean;
}) {
  const overdue = isOverdue(event, now);
  const done = event.statusId === "concluida";
  const multiDay = Boolean(
    event.endsAt && event.endsAt.slice(0, 10) !== event.startsAt.slice(0, 10),
  );
  return (
    <button
      onClick={() => onEdit(event)}
      title={`${event.title} · ${eventTypeLabels[event.eventType]}`}
      className={cn(
        "flex w-full items-center gap-1.5 truncate rounded border-l-2 bg-muted/60 px-1.5 py-0.5 text-left text-[11px] font-medium text-foreground hover:bg-muted",
        done && "opacity-55 line-through",
        overdue && "ring-1 ring-destructive",
      )}
      style={{ borderLeftColor: eventTypeTone[event.eventType] }}
    >
      <span className="truncate">
        {event.eventType === "decisao" ? "◆ " : ""}
        {event.title}
      </span>
      {detailed && (
        <span className="ml-auto shrink-0 text-[10px] opacity-80">
          {multiDay ? `${event.startsAt.slice(8, 10)}–${event.endsAt!.slice(8, 10)}` : ""}
          {event.talhaoName ? ` ${event.talhaoName}` : ""}
        </span>
      )}
    </button>
  );
}
