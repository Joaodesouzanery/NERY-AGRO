import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarRange,
  CloudSun,
  ExternalLink,
  GitBranch,
  Info,
  Layers3,
  UserRoundX,
} from "lucide-react";
import {
  buildCalendarTimelineModel,
  timelineItemStyle,
  type CalendarTimelineConflict,
  type CalendarTimelineModel,
} from "@/features/campo-calendar/domain/timeline";
import type {
  CalendarEvent,
  CalendarSearch,
  CalendarWorkspace,
} from "@/features/campo-calendar/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarTimeline({
  workspace,
  events,
  search,
  onSearchChange,
}: {
  workspace: CalendarWorkspace;
  events: CalendarEvent[];
  search: CalendarSearch;
  onSearchChange: (next: CalendarSearch) => void;
}) {
  const model = buildCalendarTimelineModel(workspace, events, search);
  const fieldCount = model.rows.length;
  const cycleCount = model.rows.reduce((total, row) => total + row.cycles.length, 0);
  const manualCount = model.rows.reduce((total, row) => total + row.manualEvents.length, 0);

  if (!fieldCount) {
    return (
      <div className="border border-dashed border-border px-5 py-16 text-center">
        <GitBranch className="mx-auto h-9 w-9 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">Nenhum talhão no contexto da Linha do Tempo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Limpe os filtros ou selecione outro talhão para visualizar ciclos e eventos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Linha do Tempo</h2>
          <p className="text-sm text-muted-foreground">
            Ciclos vindos do Talhão 360, eventos do Calendário e marcos manuais preservados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{fieldCount} talhões</Badge>
          <Badge variant="outline">{cycleCount} ciclos</Badge>
          <Badge variant="outline">{events.length} eventos</Badge>
          <Badge variant="outline">{manualCount} manuais Talhão 360</Badge>
        </div>
      </div>

      {model.conflicts.length > 0 && (
        <section className="border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold">Conflitos e riscos detectados</h3>
          </div>
          <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
            {model.conflicts.slice(0, 6).map((conflict) => (
              <ConflictCard key={conflict.id} conflict={conflict} />
            ))}
          </div>
        </section>
      )}

      <section className="border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h3 className="font-semibold">Ciclos, tarefas e marcos por talhão</h3>
            <p className="text-xs text-muted-foreground">
              Scroll horizontal controlado; uma linha fixa por talhão.
            </p>
          </div>
          <TimelineLegend />
        </div>

        <div className="overflow-x-auto" data-testid="calendar-timeline-scroll">
          <div className="min-w-full" style={{ width: model.totalWidth + 220 }}>
            <div className="sticky top-0 z-10 grid grid-cols-[220px_1fr] border-b border-border bg-background">
              <div className="border-r border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                Talhão
              </div>
              <div className="relative h-10" style={{ width: model.totalWidth }}>
                {model.months.map((month, index) => (
                  <div
                    key={month.key}
                    className="absolute top-0 flex h-10 items-center border-r border-border px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    style={{ left: index * model.monthWidth, width: model.monthWidth }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>

            {model.rows.map((row) => (
              <div
                key={row.field.id}
                className="grid min-h-[156px] grid-cols-[220px_1fr] border-b border-border last:border-b-0"
                data-testid={`timeline-row-${row.field.id}`}
              >
                <aside className="border-r border-border bg-muted/20 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold leading-tight">{row.field.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.field.areaHa.toLocaleString("pt-BR")} ha · {row.field.crop}
                      </p>
                    </div>
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: row.field.color || "#64748b" }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      asChild
                    >
                      <Link
                        to="/campo/talhoes/$fieldId"
                        params={{ fieldId: row.field.id }}
                        search={{
                          tab: "timeline",
                          seasonId: search.seasonId || row.field.season,
                          cycleId: search.cycleId,
                        }}
                        aria-label={`Abrir Talhão 360 - ${row.field.name}`}
                      >
                        Talhão 360
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => onSearchChange({ ...search, fieldId: row.field.id })}
                    >
                      Filtrar
                    </Button>
                  </div>
                  {row.conflicts.length > 0 && (
                    <Badge className="mt-3" variant="destructive">
                      {row.conflicts.length} risco(s)
                    </Badge>
                  )}
                  {row.dataGaps.length > 0 && (
                    <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                      {row.dataGaps.slice(0, 2).map((gap) => (
                        <div key={gap} className="flex gap-1">
                          <Info className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </aside>

                <TimelineLane model={model} row={row} search={search} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-l-2 border-muted bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Patch futuro documentado:</strong>{" "}
        {workspace.talhao360.futurePatch}
      </section>
    </div>
  );
}

function TimelineLane({
  model,
  row,
  search,
}: {
  model: CalendarTimelineModel;
  row: ReturnType<typeof buildCalendarTimelineModel>["rows"][number];
  search: CalendarSearch;
}) {
  return (
    <div className="relative h-[156px] overflow-hidden" style={{ width: model.totalWidth }}>
      {model.months.map((month, index) => (
        <div
          key={month.key}
          className="absolute top-0 h-full border-r border-border/70"
          style={{ left: index * model.monthWidth, width: model.monthWidth }}
        />
      ))}

      {row.cycles.map((cycle) => {
        const style = cycle.startsOn
          ? timelineItemStyle(cycle.startsOn, cycle.completedOn || cycle.endsOn, model)
          : { left: 8, width: 120 };
        return (
          <Link
            key={cycle.id}
            to="/campo/talhoes/$fieldId"
            params={{ fieldId: row.field.id }}
            search={{
              tab: "cycles",
              seasonId: cycle.seasonId || search.seasonId,
              cycleId: cycle.id,
            }}
            className="absolute top-4 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-left text-xs shadow-sm transition hover:bg-primary/20"
            style={{ left: style.left, width: Math.max(style.width, 112) }}
            aria-label={`Abrir ciclo ${cycle.name} no Talhão 360`}
          >
            <div className="truncate font-semibold">{cycle.name}</div>
            <div className="mt-0.5 truncate text-muted-foreground">
              {cycle.crop || cycle.type || "Ciclo"} · {cycle.status || "sem status"}
            </div>
          </Link>
        );
      })}

      {row.calendarEvents.map((event) => {
        const style = timelineItemStyle(event.startsAt, event.endsAt, model);
        return (
          <div
            key={event.id}
            className={cn(
              "absolute top-[78px] h-7 rounded border px-2 text-[11px] leading-6 shadow-sm",
              event.priority === "Crítica"
                ? "border-destructive/50 bg-destructive/10"
                : "border-emerald-500/40 bg-emerald-500/10",
            )}
            style={{ left: style.left, width: Math.max(style.width, 88) }}
            title={`${event.title} · ${event.eventType}`}
          >
            <span className="block truncate">{event.title}</span>
          </div>
        );
      })}

      {row.manualEvents.map((event) => {
        const style = timelineItemStyle(event.date, event.date, model);
        return (
          <div
            key={event.id}
            className="absolute top-[114px] h-6 rounded-full border border-slate-500/40 bg-slate-500/10 px-2 text-[11px] leading-5"
            style={{ left: style.left, width: 128 }}
            title={`${event.type} · ${event.description}`}
          >
            <span className="block truncate">{event.type}</span>
          </div>
        );
      })}

      {row.conflicts.map((conflict, index) => (
        <div
          key={conflict.id}
          className={cn(
            "absolute right-2 rounded-full px-2 py-0.5 text-[10px]",
            conflict.severity === "critical"
              ? "bg-destructive text-destructive-foreground"
              : "bg-amber-500 text-white",
          )}
          style={{ top: 12 + index * 24 }}
          title={conflict.description}
        >
          {conflictLabel(conflict.kind)}
        </div>
      ))}
    </div>
  );
}

function ConflictCard({ conflict }: { conflict: CalendarTimelineConflict }) {
  const Icon = conflictIcon(conflict.kind);
  return (
    <article className="rounded-md border border-border p-3">
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4", conflict.severity === "critical" ? "text-destructive" : "text-amber-600")} />
        <div>
          <h4 className="text-sm font-medium">{conflict.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{conflict.description}</p>
        </div>
      </div>
    </article>
  );
}

function TimelineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <LegendItem className="bg-primary/20 border-primary/40" label="Ciclo" />
      <LegendItem className="bg-emerald-500/15 border-emerald-500/40" label="Evento" />
      <LegendItem className="bg-slate-500/15 border-slate-500/40 rounded-full" label="Manual 360" />
      <LegendItem className="bg-amber-500" label="Risco" />
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2.5 w-5 border", className)} />
      {label}
    </span>
  );
}

function conflictIcon(kind: CalendarTimelineConflict["kind"]) {
  switch (kind) {
    case "cycle-area-overlap":
      return Layers3;
    case "resource-overlap":
      return CalendarRange;
    case "critical-without-owner":
      return UserRoundX;
    case "weather-risk":
      return CloudSun;
    default:
      return AlertTriangle;
  }
}

function conflictLabel(kind: CalendarTimelineConflict["kind"]) {
  switch (kind) {
    case "cycle-area-overlap":
      return "área";
    case "resource-overlap":
      return "recurso";
    case "outside-cycle-window":
      return "fora do ciclo";
    case "harvest-invades-planting":
      return "janela";
    case "critical-without-owner":
      return "sem dono";
    case "weather-risk":
      return "clima";
  }
}
