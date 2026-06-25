import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckSquare2,
  ClipboardList,
  FileStack,
  GitBranch,
  LayoutDashboard,
  RefreshCw,
  Scale,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { useCalendarWorkspace } from "@/features/campo-calendar/hooks/use-calendar-workspace";
import { filterCalendarEvents } from "@/features/campo-calendar/domain/filters";
import { CalendarOverview } from "@/features/campo-calendar/components/calendar-overview";
import { CalendarTasks } from "@/features/campo-calendar/components/calendar-tasks";
import { CalendarTimeline } from "@/features/campo-calendar/components/calendar-timeline";
import { CalendarWorkspaceView } from "@/features/campo-calendar/components/calendar-workspace-view";
import type {
  CalendarEvent,
  CalendarPriority,
  CalendarSearch,
  CalendarStatus,
  CalendarTab,
} from "@/features/campo-calendar/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const tabs: Array<{
  id: CalendarTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "timeline", label: "Linha do Tempo", icon: GitBranch },
  { id: "tasks", label: "Tarefas", icon: CheckSquare2 },
  { id: "decisions", label: "Decisões", icon: Scale },
  { id: "cycle-models", label: "Modelos de Ciclo", icon: FileStack },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

const statusLabels: Record<CalendarStatus, string> = {
  Planejada: "Planejada",
  Pendente: "Pendente",
  "Em andamento": "Em andamento",
  Concluída: "Concluída",
  Atrasada: "Atrasada",
  Cancelada: "Cancelada",
};

const priorityLabels: Record<CalendarPriority, string> = {
  Baixa: "Baixa",
  Normal: "Normal",
  Alta: "Alta",
  Crítica: "Crítica",
};

export function CalendarPage({
  search,
  onSearchChange,
}: {
  search: CalendarSearch;
  onSearchChange: (next: CalendarSearch) => void;
}) {
  const { data, isLoading, error, refetch, demoMode } = useCalendarWorkspace();

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return filterCalendarEvents(data.events, search);
  }, [data, search]);

  const patchSearch = (patch: Partial<CalendarSearch>) =>
    onSearchChange({ ...search, ...patch });
  const hasFilters = Boolean(
    search.fieldId ||
      search.seasonId ||
      search.cycleId ||
      search.status ||
      search.responsible ||
      search.eventType ||
      search.priority ||
      search.dateFrom ||
      search.dateTo,
  );
  const clearFilters = () =>
    onSearchChange({
      tab: search.tab,
      view: search.view,
      date: search.date,
    });

  if (isLoading) return <CalendarLoading />;
  if (error) {
    return (
      <CalendarState
        title="Não foi possível carregar o Calendário"
        description={error.message}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw />
            Tentar novamente
          </Button>
        }
      />
    );
  }
  if (!data) {
    return (
      <CalendarState
        title="Calendário indisponível"
        description="A fonte de dados não retornou um espaço de trabalho."
      />
    );
  }

  const referenceDate = parseISO(search.date);
  const responsibleOptions = unique(data.events.map((event) => event.responsibleName));
  const eventTypeOptions = unique(data.events.map((event) => event.eventType));
  const seasonOptions = unique([
    data.farm.season,
    ...data.events.map((event) => event.seasonId),
  ]);
  const cycleOptions = unique(data.events.map((event) => event.cycleId));

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/campo" className="inline-flex items-center gap-1 hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                Campo
              </Link>
              <span>/</span>
              <span>Calendário</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Calendário de Campo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.farm.name} · {data.farm.location} · Safra {data.farm.season}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={demoMode ? "secondary" : "outline"}>
              {demoMode ? "DEMO" : "REAL"}
            </Badge>
            <Button variant="outline" asChild>
              <Link to="/campo">Voltar para Campo</Link>
            </Button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Subabas do Calendário"
        className="mt-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = search.tab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => patchSearch({ tab: tab.id })}
              className={cn(
                "-mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section aria-label="Filtros do Calendário" className="mt-4 border-b border-border pb-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
          <FilterSelect
            label="Talhão"
            value={search.fieldId}
            onChange={(fieldId) => patchSearch({ fieldId })}
            options={data.fields.map((field) => ({ value: field.id, label: field.name }))}
          />
          <FilterSelect
            label="Safra"
            value={search.seasonId}
            onChange={(seasonId) => patchSearch({ seasonId })}
            options={seasonOptions.map(option)}
          />
          <FilterSelect
            label="Ciclo"
            value={search.cycleId}
            onChange={(cycleId) => patchSearch({ cycleId })}
            options={cycleOptions.map(option)}
          />
          <FilterSelect
            label="Status"
            value={search.status}
            onChange={(status) => patchSearch({ status: status as CalendarStatus | undefined })}
            options={data.statuses.map((status) => ({
              value: status.name,
              label: status.name,
            }))}
          />
          <FilterSelect
            label="Responsável"
            value={search.responsible}
            onChange={(responsible) => patchSearch({ responsible })}
            options={responsibleOptions.map(option)}
          />
          <FilterSelect
            label="Tipo"
            value={search.eventType}
            onChange={(eventType) => patchSearch({ eventType })}
            options={eventTypeOptions.map(option)}
          />
          <FilterSelect
            label="Prioridade"
            value={search.priority}
            onChange={(priority) =>
              patchSearch({ priority: priority as CalendarPriority | undefined })
            }
            options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
          />
          <label className="grid gap-1 text-xs text-muted-foreground">
            Intervalo inicial
            <Input
              type="date"
              value={search.dateFrom ?? ""}
              onChange={(event) => patchSearch({ dateFrom: event.target.value || undefined })}
              className="h-9"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Intervalo final
            <Input
              type="date"
              value={search.dateTo ?? ""}
              onChange={(event) => patchSearch({ dateTo: event.target.value || undefined })}
              className="h-9"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {hasFilters
              ? `${filteredEvents.length} eventos no contexto filtrado`
              : "Toda a fazenda ativa"}
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters}>
            <X />
            Limpar filtros
          </Button>
        </div>
      </section>

      <section className="mt-4">
        {search.tab === "overview" ? (
          <CalendarOverview
            events={filteredEvents}
            fields={data.fields}
            search={search}
            onFieldSelect={(fieldId) => patchSearch({ fieldId })}
            onOpenCalendar={() => patchSearch({ tab: "calendar" })}
          />
        ) : search.tab === "tasks" ? (
          <CalendarTasks
            workspace={data}
            events={filteredEvents}
            referenceDate={search.date}
          />
        ) : search.tab === "calendar" ? (
          <CalendarWorkspaceView
            date={referenceDate}
            view={search.view}
            events={filteredEvents}
            workspace={data}
            onDateChange={(date) => patchSearch({ date: format(date, "yyyy-MM-dd") })}
            onViewChange={(view) => patchSearch({ view })}
          />
        ) : search.tab === "timeline" ? (
          <CalendarTimeline
            workspace={data}
            events={filteredEvents}
            search={search}
            onSearchChange={onSearchChange}
          />
        ) : (
          <OperationalTab
            tab={search.tab}
            events={filteredEvents}
            fieldsCount={search.fieldId ? 1 : data.fields.length}
            date={referenceDate}
            onOpenCalendar={() => patchSearch({ tab: "calendar" })}
          />
        )}
      </section>
    </div>
  );
}

function OperationalTab({
  tab,
  events,
  fieldsCount,
  date,
  onOpenCalendar,
}: {
  tab: CalendarTab;
  events: CalendarEvent[];
  fieldsCount: number;
  date: Date;
  onOpenCalendar: () => void;
}) {
  const label = tabs.find((item) => item.id === tab)?.label ?? "Visão Geral";
  const planned = events.filter((event) => event.status === "Planejada").length;
  const critical = events.filter((event) => event.priority === "Crítica").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{label}</h2>
          <p className="text-sm text-muted-foreground">
            Contexto operacional em {format(date, "MMMM 'de' yyyy", { locale: ptBR })}.
          </p>
        </div>
        <Button onClick={onOpenCalendar}>
          <CalendarDays />
          Abrir calendário
        </Button>
      </div>

      <div className="mt-4 grid border-y border-border sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Eventos filtrados" value={String(events.length)} />
        <Metric label="Talhões no contexto" value={String(fieldsCount)} />
        <Metric label="Planejados" value={String(planned)} />
        <Metric label="Prioridade crítica" value={String(critical)} warning={critical > 0} />
      </div>

      <EventTable events={events} />
    </div>
  );
}

function EventTable({ events }: { events: CalendarEvent[] }) {
  if (!events.length) {
    return (
      <div className="mt-5 border border-dashed border-border px-4 py-12 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-medium">Nenhum evento no contexto atual</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste os filtros ou selecione outra data de referência.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto border-t border-border">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-3 font-medium">Data</th>
            <th className="px-3 py-3 font-medium">Evento</th>
            <th className="px-3 py-3 font-medium">Talhão</th>
            <th className="px-3 py-3 font-medium">Responsável</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Prioridade</th>
            <th className="px-3 py-3 font-medium">Fonte</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-border last:border-0">
              <td className="px-3 py-3 whitespace-nowrap">{displayDate(event)}</td>
              <td className="px-3 py-3">
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-muted-foreground">{event.eventType}</div>
              </td>
              <td className="px-3 py-3">{event.talhaoName || "Todos os talhões"}</td>
              <td className="px-3 py-3">{event.responsibleName || "Não definido"}</td>
              <td className="px-3 py-3">{statusLabels[event.status] || event.status}</td>
              <td className="px-3 py-3">{priorityLabels[event.priority]}</td>
              <td className="px-3 py-3">
                <Badge variant="outline">
                  {event.source === "Legado" ? "Legado" : "Canônico"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      <select
        aria-label={`Filtro ${label}`}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground"
      >
        <option value="">Todos</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold", warning && "text-destructive")}>{value}</div>
    </div>
  );
}

function CalendarLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-20" />
      <Skeleton className="h-12" />
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}

function CalendarState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-16 max-w-xl border border-dashed border-border p-10 text-center">
      <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function option(value: string) {
  return { value, label: value };
}

function displayDate(event: CalendarEvent) {
  const start = format(parseISO(event.startsAt), "dd/MM/yyyy");
  if (!event.endsAt || event.endsAt === event.startsAt) return start;
  return `${start}–${format(parseISO(event.endsAt), "dd/MM/yyyy")}`;
}
