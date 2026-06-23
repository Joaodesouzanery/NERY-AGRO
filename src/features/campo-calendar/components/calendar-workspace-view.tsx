import {
  format,
  isSameDay,
  isSameMonth,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CloudSun,
  Flag,
  Plus,
  Scale,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  TaskDialog,
  emptyForm,
  eventToForm,
  formToInput,
  type TaskForm,
} from "@/features/campo-calendar/components/calendar-tasks";
import {
  agendaGroups,
  calendarPeriodLabel,
  eventCalendarKind,
  eventOverlapsPeriod,
  eventsOnCalendarDay,
  getCalendarPeriod,
  isMultiDayEvent,
  moveCalendarDate,
} from "@/features/campo-calendar/domain/calendar-layout";
import {
  validateCalendarEventContext,
  visualCalendarStatus,
} from "@/features/campo-calendar/domain/tasks";
import { useCalendarMutations } from "@/features/campo-calendar/hooks/use-calendar-mutations";
import type {
  CalendarEvent,
  CalendarStatusDefinition,
  CalendarView,
  CalendarWorkspace,
} from "@/features/campo-calendar/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const viewLabels: Record<CalendarView, string> = {
  month: "Mês",
  week: "Semana",
  agenda: "Agenda",
};

export function CalendarWorkspaceView({
  date,
  view,
  events,
  workspace,
  onDateChange,
  onViewChange,
}: {
  date: Date;
  view: CalendarView;
  events: CalendarEvent[];
  workspace: CalendarWorkspace;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}) {
  const mutations = useCalendarMutations();
  const referenceDateKey = format(date, "yyyy-MM-dd");
  const period = useMemo(() => getCalendarPeriod(date, view), [date, view]);
  const visibleEvents = useMemo(
    () => events.filter((event) => eventOverlapsPeriod(event, period.start, period.end)),
    [events, period],
  );
  const [selectedDay, setSelectedDay] = useState(date);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TaskForm>(() =>
    emptyForm(workspace.statuses, format(date, "yyyy-MM-dd")),
  );
  const responsibleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          workspace.events
            .map((event) => event.responsibleName)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [workspace.events],
  );

  useEffect(() => {
    setSelectedDay(parseISO(referenceDateKey));
  }, [referenceDateKey]);

  const beginCreate = (day: Date) => {
    setSelectedDay(day);
    setEditing(null);
    setForm(emptyForm(workspace.statuses, format(day, "yyyy-MM-dd")));
    setFormOpen(true);
  };
  const beginEdit = (event: CalendarEvent) => {
    if (event.source === "Legado") {
      toast.info("Duplique o registro legado na subaba Tarefas para editá-lo.");
      return;
    }
    setEditing(event);
    setForm(eventToForm(event));
    setFormOpen(true);
  };
  const save = async () => {
    try {
      const input = formToInput(form, editing, workspace);
      validateCalendarEventContext(input, workspace.fields);
      if (editing) {
        await mutations.updateEvent.mutateAsync({ ...editing, ...input });
        toast.success("Evento atualizado.");
      } else {
        await mutations.createEvent.mutateAsync(input);
        toast.success("Evento criado.");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o evento.");
    }
  };
  const navigate = (direction: -1 | 1) => {
    const next = moveCalendarDate(date, view, direction);
    setSelectedDay(next);
    onDateChange(next);
  };
  const today = () => {
    const next = new Date();
    setSelectedDay(next);
    onDateChange(next);
  };

  return (
    <div aria-label="Visualização do calendário">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Período anterior"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={today}>
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo período"
            onClick={() => navigate(1)}
          >
            <ChevronRight />
          </Button>
          <h2 className="min-w-0 text-base font-semibold capitalize sm:ml-2 sm:text-lg">
            {calendarPeriodLabel(date, view)}
          </h2>
          <Badge variant="outline">{visibleEvents.length} eventos</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-md border border-border p-0.5 max-sm:flex-row-reverse"
            aria-label="Modo do calendário"
          >
            {(["month", "week", "agenda"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onViewChange(item)}
                aria-pressed={view === item}
                className={cn(
                  "h-8 rounded px-3 text-xs font-medium",
                  view === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {viewLabels[item]}
              </button>
            ))}
          </div>
          <Button onClick={() => beginCreate(selectedDay)}>
            <Plus />
            Adicionar em {format(selectedDay, "dd/MM")}
          </Button>
        </div>
      </div>

      <CalendarLegend statuses={workspace.statuses} />

      {view === "month" && (
        <MonthView
          date={date}
          days={period.days}
          events={visibleEvents}
          statuses={workspace.statuses}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onCreate={beginCreate}
          onOpen={beginEdit}
        />
      )}
      {view === "week" && (
        <WeekView
          days={period.days}
          events={visibleEvents}
          statuses={workspace.statuses}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onCreate={beginCreate}
          onOpen={beginEdit}
        />
      )}
      {view === "agenda" && (
        <AgendaView
          groups={agendaGroups(visibleEvents, period)}
          statuses={workspace.statuses}
          onCreate={beginCreate}
          onOpen={beginEdit}
        />
      )}

      <TaskDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        form={form}
        setForm={setForm}
        editing={editing}
        workspace={workspace}
        responsibleOptions={responsibleOptions}
        pending={mutations.createEvent.isPending || mutations.updateEvent.isPending}
        onSave={() => void save()}
      />
    </div>
  );
}

function MonthView({
  date,
  days,
  events,
  statuses,
  selectedDay,
  onSelectDay,
  onCreate,
  onOpen,
}: {
  date: Date;
  days: Date[];
  events: CalendarEvent[];
  statuses: CalendarStatusDefinition[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onCreate: (day: Date) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const selectedEvents = eventsOnCalendarDay(events, selectedDay);
  return (
    <>
      <div className="mt-4 hidden overflow-hidden border border-border md:block">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="px-2 py-2 text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsOnCalendarDay(events, day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "group min-h-32 min-w-0 border-b border-r border-border p-1.5",
                  !isSameMonth(day, date) && "bg-muted/25 text-muted-foreground",
                  isSameDay(day, selectedDay) && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-xs font-medium",
                      isSameDay(day, new Date()) && "bg-primary text-primary-foreground",
                    )}
                    onClick={() => onSelectDay(day)}
                    aria-label={`Selecionar ${format(day, "dd/MM/yyyy")}`}
                  >
                    {format(day, "d")}
                  </button>
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded opacity-0 hover:bg-muted group-hover:opacity-100 focus:opacity-100"
                    onClick={() => onCreate(day)}
                    aria-label={`Adicionar evento em ${format(day, "dd/MM/yyyy")}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      day={day}
                      status={findStatus(statuses, event)}
                      onOpen={onOpen}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <button
                      type="button"
                      onClick={() => onSelectDay(day)}
                      className="w-full truncate px-1 text-left text-[10px] font-medium text-primary"
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

      <div className="mt-4 md:hidden">
        <DaySections
          days={days.filter((day) => eventsOnCalendarDay(events, day).length > 0)}
          events={events}
          statuses={statuses}
          onCreate={onCreate}
          onOpen={onOpen}
          empty="Nenhum evento neste mês."
        />
      </div>

      <SelectedDayPanel
        day={selectedDay}
        events={selectedEvents}
        statuses={statuses}
        onCreate={onCreate}
        onOpen={onOpen}
      />
    </>
  );
}

function WeekView({
  days,
  events,
  statuses,
  selectedDay,
  onSelectDay,
  onCreate,
  onOpen,
}: {
  days: Date[];
  events: CalendarEvent[];
  statuses: CalendarStatusDefinition[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onCreate: (day: Date) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  return (
    <>
      <div className="mt-4 hidden grid-cols-7 border border-border md:grid">
        {days.map((day) => {
          const dayEvents = eventsOnCalendarDay(events, day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[430px] min-w-0 border-r border-border last:border-r-0",
                isSameDay(day, selectedDay) && "bg-primary/5",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className="w-full border-b border-border px-2 py-3 text-center"
              >
                <span className="block text-[10px] uppercase text-muted-foreground">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span className="text-lg font-semibold">{format(day, "d")}</span>
              </button>
              <div className="space-y-1.5 p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => onCreate(day)}
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
                {dayEvents.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    day={day}
                    status={findStatus(statuses, event)}
                    onOpen={onOpen}
                    expanded
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 md:hidden">
        <DaySections
          days={days}
          events={events}
          statuses={statuses}
          onCreate={onCreate}
          onOpen={onOpen}
          empty="Nenhum evento nesta semana."
        />
      </div>
    </>
  );
}

function AgendaView({
  groups,
  statuses,
  onCreate,
  onOpen,
}: {
  groups: Array<{ day: Date; events: CalendarEvent[] }>;
  statuses: CalendarStatusDefinition[];
  onCreate: (day: Date) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  if (!groups.length) {
    return <EmptyCalendar message="Nenhum evento nos próximos 30 dias." />;
  }
  return (
    <div className="mt-4 divide-y divide-border border-y border-border">
      {groups.map(({ day, events }) => (
        <div key={day.toISOString()} className="grid gap-3 py-4 md:grid-cols-[150px_1fr]">
          <DayHeading day={day} onCreate={onCreate} />
          <div className="space-y-2">
            {events.map((event) => (
              <AgendaEvent
                key={event.id}
                event={event}
                status={findStatus(statuses, event)}
                onOpen={onOpen}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DaySections({
  days,
  events,
  statuses,
  onCreate,
  onOpen,
  empty,
}: {
  days: Date[];
  events: CalendarEvent[];
  statuses: CalendarStatusDefinition[];
  onCreate: (day: Date) => void;
  onOpen: (event: CalendarEvent) => void;
  empty: string;
}) {
  if (!days.length) return <EmptyCalendar message={empty} />;
  return (
    <div className="divide-y divide-border border-y border-border">
      {days.map((day) => {
        const dayEvents = eventsOnCalendarDay(events, day);
        return (
          <section key={day.toISOString()} className="py-3">
            <DayHeading day={day} onCreate={onCreate} />
            <div className="mt-2 space-y-2">
              {dayEvents.length ? (
                dayEvents.map((event) => (
                  <AgendaEvent
                    key={event.id}
                    event={event}
                    status={findStatus(statuses, event)}
                    onOpen={onOpen}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Sem eventos.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SelectedDayPanel({
  day,
  events,
  statuses,
  onCreate,
  onOpen,
}: {
  day: Date;
  events: CalendarEvent[];
  statuses: CalendarStatusDefinition[];
  onCreate: (day: Date) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  return (
    <section className="mt-4 border-t border-border pt-4 max-md:hidden">
      <DayHeading day={day} onCreate={onCreate} />
      {events.length ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {events.map((event) => (
            <AgendaEvent
              key={event.id}
              event={event}
              status={findStatus(statuses, event)}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum evento nesta data.</p>
      )}
    </section>
  );
}

function EventChip({
  event,
  day,
  status,
  onOpen,
  expanded,
}: {
  event: CalendarEvent;
  day: Date;
  status?: CalendarStatusDefinition;
  onOpen: (event: CalendarEvent) => void;
  expanded?: boolean;
}) {
  const delayed =
    visualCalendarStatus(event, format(new Date(), "yyyy-MM-dd")) === "Atrasada";
  const multiDay = isMultiDayEvent(event);
  const firstDay = event.startsAt.slice(0, 10) === format(day, "yyyy-MM-dd");
  const lastDay = (event.endsAt || event.startsAt).slice(0, 10) === format(day, "yyyy-MM-dd");
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className={cn(
        "block w-full min-w-0 overflow-hidden rounded-sm border-l-[3px] bg-muted/70 px-1.5 py-1 text-left text-[11px] hover:bg-muted",
        event.completedAt && "opacity-60",
        delayed && "bg-destructive/10",
      )}
      style={{ borderLeftColor: delayed ? "hsl(var(--destructive))" : status?.color }}
      aria-label={`Abrir evento ${event.title}`}
      title={event.title}
    >
      <span className={cn("block truncate font-medium", event.completedAt && "line-through")}>
        {multiDay && !firstDay ? "← " : ""}
        {!event.allDay && firstDay ? `${format(parseISO(event.startsAt), "HH:mm")} ` : ""}
        {event.title}
        {multiDay && !lastDay ? " →" : ""}
      </span>
      {expanded && (
        <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
          {eventCalendarKind(event)} · {event.talhaoName || "Toda a fazenda"}
        </span>
      )}
    </button>
  );
}

function AgendaEvent({
  event,
  status,
  onOpen,
}: {
  event: CalendarEvent;
  status?: CalendarStatusDefinition;
  onOpen: (event: CalendarEvent) => void;
}) {
  const kind = eventCalendarKind(event);
  const delayed = visualCalendarStatus(event, format(new Date(), "yyyy-MM-dd")) === "Atrasada";
  const KindIcon = kindIcon(kind);
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      aria-label={`Abrir evento ${event.title}`}
      className="flex w-full min-w-0 items-start gap-3 border border-border p-3 text-left hover:bg-muted/40"
      style={{ borderLeftWidth: 4, borderLeftColor: delayed ? "#dc2626" : status?.color }}
    >
      <KindIcon className={cn("mt-0.5 h-4 w-4 shrink-0", delayed && "text-destructive")} />
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-medium", event.completedAt && "line-through")}>
          {event.title}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {eventTime(event)} · {event.talhaoName || "Toda a fazenda"}
          {event.responsibleName ? ` · ${event.responsibleName}` : ""}
        </span>
        <span className="mt-2 flex flex-wrap gap-1">
          <Badge variant="outline">{kind}</Badge>
          {event.allDay && <Badge variant="secondary">Dia inteiro</Badge>}
          {isMultiDayEvent(event) && <Badge variant="secondary">Múltiplos dias</Badge>}
          {delayed && <Badge variant="destructive">Atrasada</Badge>}
          {event.completedAt && <Badge variant="outline">Concluída</Badge>}
        </span>
      </span>
    </button>
  );
}

function CalendarLegend({ statuses }: { statuses: CalendarStatusDefinition[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
      {statuses
        .filter((status) => status.active)
        .slice(0, 6)
        .map((status) => (
          <span key={status.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
            {status.name}
          </span>
        ))}
      <span className="inline-flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 text-destructive" /> atraso
      </span>
      <span className="inline-flex items-center gap-1">
        <Scale className="h-3 w-3" /> decisão
      </span>
      <span className="inline-flex items-center gap-1">
        <CloudSun className="h-3 w-3" /> previsão climática
      </span>
      <span className="inline-flex items-center gap-1">
        <BellRing className="h-3 w-3" /> alerta
      </span>
    </div>
  );
}

function DayHeading({ day, onCreate }: { day: Date; onCreate: (day: Date) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-xs font-medium uppercase text-muted-foreground">
          {format(day, "EEEE", { locale: ptBR })}
        </div>
        <div className="text-sm font-semibold">{format(day, "dd 'de' MMMM", { locale: ptBR })}</div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCreate(day)}
        aria-label={`Adicionar evento em ${format(day, "dd/MM/yyyy")}`}
      >
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </div>
  );
}

function EmptyCalendar({ message }: { message: string }) {
  return (
    <div className="mt-5 border border-dashed border-border px-5 py-14 text-center">
      <CalendarCheck2 className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Navegue para outro período ou ajuste os filtros globais.
      </p>
    </div>
  );
}

function findStatus(statuses: CalendarStatusDefinition[], event: CalendarEvent) {
  return statuses.find((status) => status.id === event.statusId);
}

function eventTime(event: CalendarEvent) {
  if (event.allDay) {
    if (!isMultiDayEvent(event)) return "Dia inteiro";
    return `${format(parseISO(event.startsAt), "dd/MM")} – ${format(
      parseISO(event.endsAt!),
      "dd/MM",
    )}`;
  }
  const start = format(parseISO(event.startsAt), "dd/MM HH:mm");
  return event.endsAt ? `${start} – ${format(parseISO(event.endsAt), "dd/MM HH:mm")}` : start;
}

function kindIcon(kind: string) {
  if (kind === "Decisão") return Scale;
  if (kind === "Alerta") return BellRing;
  if (kind.includes("climátic")) return CloudSun;
  if (kind === "Compra") return CircleDollarSign;
  if (kind === "Plantio" || kind === "Colheita") return Flag;
  if (kind === "Operação") return CalendarCheck2;
  return CheckCircle2;
}
