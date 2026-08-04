// Visão Geral: o dashboard do módulo (KPIs + gráficos de TODAS as subabas, via
// ModuleOverview) somado ao que só esta tela faz — "Agora", próximas ações,
// alertas com marcação de lido, mapa resumido e decisões do gestor. Os painéis
// operacionais entram no `hero` do spec: ficam logo abaixo dos KPIs, antes dos
// gráficos, preservando a leitura "o que fazer hoje" no topo da página.
import { localDateOf } from "@/lib/date-local";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, MapPinned } from "lucide-react";
import { RichTabPanel } from "@/components/rich-tab";
import { ModuleOverview } from "@/components/module-overview";
import { EmptyState } from "@/components/empty-state";
import { buildCalendarioOverview } from "@/lib/overview/calendario";
import { cn } from "@/lib/utils";
import {
  effectiveStatusId,
  eventsForDay,
  formatDay,
  isEventActive,
} from "@/features/campo-calendar/lib/derive";
import { listReadAlertKeys, markAlertRead } from "@/features/campo-calendar/lib/weather";
import { eventTypeLabels } from "@/features/campo-calendar/types/domain";
import { eventTypeTone, statusBadgeClass } from "@/features/campo-calendar/components/event-tone";
import { FarmMiniMap } from "@/features/campo-calendar/components/farm-mini-map";
import type { CalendarTab } from "@/features/campo-calendar/schemas/navigation";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";
import type { CalendarEvent } from "@/features/campo-calendar/types/domain";

export function VisaoGeralTab(props: CalendarTabProps) {
  const { model, events, alerts, now, demoMode, capabilities, patchSearch, search, onEdit } = props;
  const [readKeys, setReadKeys] = useState<Set<string>>(() => listReadAlertKeys());

  // Mesmo spec que alimenta o export do módulo; memo porque varre todos os
  // eventos, ciclos e modelos a cada render do filtro.
  const spec = useMemo(
    () => buildCalendarioOverview({ model, events, alerts, now }, demoMode),
    [model, events, alerts, now, demoMode],
  );

  const hoje = eventsForDay(events, now).filter(isEventActive);
  const proximas = events
    .filter(
      (event) =>
        isEventActive(event) &&
        event.startsAt.slice(0, 10) > localDateOf(now.toISOString()) &&
        event.eventType !== "decisao",
    )
    .slice(0, 6);
  const decisoes = events.filter((event) => event.eventType === "decisao" && isEventActive(event));
  const unreadAlerts = alerts.filter((alert) => !readKeys.has(alert.key));

  return (
    <ModuleOverview
      spec={{
        ...spec,
        hero: (
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <RichTabPanel title="Agora" description="Tarefas em execução ou previstas para hoje">
                {hoje.length ? (
                  <div className="space-y-2">
                    {hoje.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        now={now}
                        model={model}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Nada programado para hoje" icon={CheckCircle2} />
                )}
              </RichTabPanel>

              <RichTabPanel
                title="Próximas ações"
                description="Operações, compras e marcos que vêm a seguir"
                action={
                  <button
                    onClick={() => patchSearch({ tab: "tarefas" })}
                    className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
                  >
                    Ver todas
                  </button>
                }
              >
                {proximas.length ? (
                  <div className="space-y-2">
                    {proximas.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        now={now}
                        model={model}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sem ações futuras no filtro atual" icon={CalendarDays} />
                )}
              </RichTabPanel>

              <RichTabPanel
                title="Alertas que afetam o cronograma"
                description={
                  demoMode
                    ? "Clima da vitrine, atrasos e regras operacionais"
                    : "Atrasos e regras operacionais"
                }
              >
                {unreadAlerts.length ? (
                  <div className="space-y-2">
                    {unreadAlerts.slice(0, 6).map((alert) => (
                      <div
                        key={alert.key}
                        className={cn(
                          "flex items-start justify-between gap-3 rounded-lg border p-3 text-sm",
                          alert.severity === "critico"
                            ? "border-destructive/30 bg-destructive/5"
                            : "border-warning/30 bg-warning/5",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{alert.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {alert.description}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {alert.eventId && (
                            <button
                              onClick={() => {
                                const event = events.find((item) => item.id === alert.eventId);
                                if (event) onEdit(event);
                              }}
                              className="h-7 rounded-md border border-border px-2 text-xs hover:bg-muted"
                            >
                              Abrir
                            </button>
                          )}
                          <button
                            onClick={() => {
                              markAlertRead(alert.key);
                              setReadKeys(listReadAlertKeys());
                            }}
                            className="h-7 rounded-md border border-border px-2 text-xs hover:bg-muted"
                          >
                            Lida
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sem alertas não lidos" icon={CheckCircle2} />
                )}
              </RichTabPanel>
            </div>

            <div className="space-y-4">
              <RichTabPanel
                title="Mapa dos talhões"
                description="Clique em um talhão para filtrar o Calendário"
                action={
                  search.fieldId ? (
                    <Link
                      to="/campo/talhoes/$fieldId"
                      params={{ fieldId: search.fieldId }}
                      search={{ tab: "overview" }}
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <MapPinned className="h-3.5 w-3.5" />
                      Talhão 360°
                    </Link>
                  ) : undefined
                }
              >
                <FarmMiniMap
                  talhoes={model.talhoes}
                  selectedId={search.fieldId}
                  onSelect={(talhaoId) => patchSearch({ fieldId: talhaoId, cycleId: undefined })}
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border bg-background/60 p-2.5">
                    <div className="text-muted-foreground">Filtro atual</div>
                    <div className="mt-0.5 font-semibold">
                      {model.talhoes.find((talhao) => talhao.id === search.fieldId)?.nome ??
                        "Todos os talhões"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-2.5">
                    <div className="text-muted-foreground">Talhões</div>
                    <div className="mt-0.5 font-semibold">{model.talhoes.length}</div>
                  </div>
                </div>
              </RichTabPanel>

              {capabilities.canViewDecisions && (
                <RichTabPanel
                  title="Próximas decisões"
                  description="Área do gestor (modo demonstrativo)"
                  action={
                    <button
                      onClick={() => patchSearch({ tab: "decisoes" })}
                      className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
                    >
                      Abrir
                    </button>
                  }
                >
                  {decisoes.length ? (
                    <div className="space-y-2">
                      {decisoes.slice(0, 4).map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          now={now}
                          model={model}
                          onEdit={onEdit}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Sem decisões pendentes" icon={CheckCircle2} />
                  )}
                </RichTabPanel>
              )}
            </div>
          </div>
        ),
      }}
      onSelectTab={(tabId) => patchSearch({ tab: tabId as CalendarTab })}
      mostrarExport
    />
  );
}

function EventRow({
  event,
  now,
  model,
  onEdit,
}: {
  event: CalendarEvent;
  now: Date;
  model: CalendarTabProps["model"];
  onEdit: (event: CalendarEvent) => void;
}) {
  const statusId = effectiveStatusId(event, now);
  const statusLabel = model.statuses.find((status) => status.id === statusId)?.label ?? statusId;
  return (
    <button
      onClick={() => onEdit(event)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 text-left text-sm transition hover:bg-muted/60"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: eventTypeTone[event.eventType] }}
          aria-hidden
        />
        <span className="min-w-0">
          <span className="block truncate font-medium">{event.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {eventTypeLabels[event.eventType]}
            {event.talhaoName ? ` · ${event.talhaoName}` : ""}
            {event.responsibleName ? ` · ${event.responsibleName}` : " · sem responsável"}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium",
            statusBadgeClass(statusId),
          )}
        >
          {statusLabel}
        </span>
        <span className="text-[11px] text-muted-foreground">{formatDay(event.startsAt)}</span>
      </span>
    </button>
  );
}
