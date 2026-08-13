// Linha do Tempo: uma linha por talhão, ciclos do Talhão 360 como faixas e os
// eventos canônicos como marcadores — tudo lido via adapter, sem copiar dados
// para talhao360-event e sem editar a feature do Talhão 360.
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, GanttChartSquare, MapPinned } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RichTabPanel } from "@/components/rich-tab";
import { cn } from "@/lib/utils";
import { dayKey, formatDay } from "@/features/campo-calendar/lib/derive";
import { eventTypeLabels } from "@/features/campo-calendar/types/domain";
import { eventTypeTone } from "@/features/campo-calendar/components/event-tone";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";

const MAX_MONTHS = 14;

export function LinhaTempoTab(props: CalendarTabProps) {
  const { model, events, alerts, filters, now, onEdit, patchSearch } = props;

  const talhoes = useMemo(
    () => model.talhoes.filter((talhao) => !filters.fieldId || talhao.id === filters.fieldId),
    [model.talhoes, filters.fieldId],
  );
  const cycles = useMemo(
    () =>
      model.cycles.filter(
        (cycle) =>
          (!filters.fieldId || cycle.talhaoId === filters.fieldId) &&
          (!filters.seasonId || cycle.safra === filters.seasonId) &&
          (!filters.cycleId || cycle.id === filters.cycleId),
      ),
    [model.cycles, filters],
  );

  const range = useMemo(() => {
    const dates = [
      ...cycles.flatMap((cycle) => [cycle.inicio, cycle.fimPrevisto]),
      ...events.map((event) => event.startsAt.slice(0, 10)),
      dayKey(now),
    ]
      .filter(Boolean)
      .sort();
    if (!dates.length) return null;
    let start = startOfMonth(parseISO(dates[0]));
    let end = endOfMonth(parseISO(dates[dates.length - 1]));
    // Limita a janela para a grade não explodir com dados muito espalhados.
    if (differenceInCalendarDays(end, start) > MAX_MONTHS * 31) {
      start = startOfMonth(addMonths(now, -2));
      end = endOfMonth(addMonths(now, MAX_MONTHS - 3));
    }
    const months: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      months.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    return { start, end, months, totalDays: differenceInCalendarDays(end, start) + 1 };
  }, [cycles, events, now]);

  if (!model.cycles.length && !events.length) {
    return (
      <EmptyState
        title="Dados insuficientes para a linha do tempo"
        description="Cadastre ciclos nos talhões (Talhão 360 › Safras e Ciclos) ou crie tarefas com data."
        icon={GanttChartSquare}
      />
    );
  }

  const pos = (iso: string) =>
    range
      ? Math.min(
          100,
          Math.max(
            0,
            (differenceInCalendarDays(parseISO(iso.slice(0, 10)), range.start) / range.totalDays) *
              100,
          ),
        )
      : 0;

  const conflictRules = new Set([
    "sobreposicao-de-ciclos",
    "tarefa-fora-da-janela",
    "critica-sem-responsavel",
    "tarefa-atrasada",
    "chuva-antes-pulverizacao",
    "chuva-proxima-colheita",
    "janela-plantio-encerrando",
  ]);
  const conflicts = alerts.filter(
    (alert) =>
      conflictRules.has(alert.rule) && (!filters.fieldId || alert.talhaoId === filters.fieldId),
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
        {range && (
          <div className="min-w-[900px]">
            <div
              className="mb-2 grid pl-44"
              style={{ gridTemplateColumns: `repeat(${range.months.length}, 1fr)` }}
            >
              {range.months.map((month) => (
                <div
                  key={month.toISOString()}
                  className="border-l border-border pl-1.5 text-[10px] font-bold uppercase text-muted-foreground"
                >
                  {format(month, "MMM yy", { locale: ptBR })}
                </div>
              ))}
            </div>

            {talhoes.map((talhao) => {
              const talhaoCycles = cycles.filter((cycle) => cycle.talhaoId === talhao.id);
              const talhaoEvents = events.filter((event) => event.talhaoId === talhao.id);
              return (
                <div key={talhao.id} className="flex items-stretch border-t border-border py-2">
                  <div className="w-44 shrink-0 pr-3">
                    <div className="truncate text-sm font-semibold">{talhao.nome}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {talhao.areaHa ? `${talhao.areaHa.toLocaleString("pt-BR")} ha · ` : ""}
                      {talhaoCycles.length} ciclo(s)
                    </div>
                    <Link
                      to="/campo/talhoes/$fieldId"
                      params={{ fieldId: talhao.id }}
                      search={{ tab: "activity" }}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <MapPinned className="h-3 w-3" />
                      Talhão 360°
                    </Link>
                  </div>
                  <div className="relative min-h-16 flex-1 rounded-md bg-muted/20">
                    {/* hoje */}
                    <div
                      className="absolute inset-y-0 w-px bg-destructive/70"
                      style={{ left: `${pos(dayKey(now))}%` }}
                      title="Hoje"
                    />
                    {talhaoCycles.map((cycle, index) => {
                      const left = pos(cycle.inicio);
                      const width = Math.max(pos(cycle.fimPrevisto) - left, 1.5);
                      return (
                        <button
                          key={cycle.id}
                          onClick={() => patchSearch({ cycleId: cycle.id, fieldId: talhao.id })}
                          className={cn(
                            "absolute h-6 truncate rounded border border-border bg-secondary px-1.5 text-left text-[10px] font-semibold leading-6 hover:bg-accent",
                            filters.cycleId === cycle.id && "ring-1 ring-ring",
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            top: 6 + (index % 2) * 26,
                          }}
                          title={`${cycle.nome} · ${formatDay(cycle.inicio)} – ${formatDay(cycle.fimPrevisto)}`}
                        >
                          {cycle.nome}
                        </button>
                      );
                    })}
                    {talhaoEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEdit(event)}
                        className="absolute bottom-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-background hover:scale-125"
                        style={{
                          left: `${pos(event.startsAt)}%`,
                          background: eventTypeTone[event.eventType],
                        }}
                        title={`${event.title} · ${eventTypeLabels[event.eventType]} · ${formatDay(event.startsAt)}`}
                        aria-label={event.title}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {talhoes.length === 0 && (
              <EmptyState title="Nenhum talhão no filtro atual" icon={MapPinned} />
            )}
          </div>
        )}
      </div>

      <RichTabPanel
        title="Conflitos e riscos detectados"
        description="Somente com dados suficientes — sem inventar conflito"
      >
        {model.cycles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Dados insuficientes: sem ciclos cadastrados não é possível avaliar janelas e
            sobreposições.
          </p>
        ) : conflicts.length ? (
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div
                key={conflict.key}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border p-3 text-sm",
                  conflict.severity === "critico"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-warning/30 bg-warning/5",
                )}
              >
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    conflict.severity === "critico" ? "text-destructive" : "text-warning",
                  )}
                />
                <div>
                  <div className="font-medium">{conflict.title}</div>
                  <div className="text-xs text-muted-foreground">{conflict.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum conflito detectado no período e filtros atuais.
          </p>
        )}
      </RichTabPanel>
    </div>
  );
}
