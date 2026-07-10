// Decisões estratégicas: calendar-event com eventType = decisao e visibility =
// Gestor. IMPORTANTE: a restrição é DEMONSTRATIVA (capacidade por papel no
// dispositivo) — segurança real depende do bloco de papéis + RLS documentado
// em docs/campo-calendario.md. Ocultar UI não é autorização.
import { useState } from "react";
import { CheckCircle2, GitBranch, Plus, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  applyStatusTransition,
  effectiveStatusId,
  formatDay,
  isEventActive,
} from "@/features/campo-calendar/lib/derive";
import type { CalendarEvent } from "@/features/campo-calendar/types/domain";
import { brl, statusBadgeClass } from "@/features/campo-calendar/components/event-tone";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";

export function DecisoesTab(props: CalendarTabProps) {
  const { events, model, now, capabilities, onCreate, onEdit, mutations } = props;
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);

  const decisoes = events
    .filter((event) => event.eventType === "decisao")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  if (!capabilities.canViewDecisions) {
    return (
      <EmptyState
        title="Área restrita ao gestor"
        description="Seu perfil (demonstrativo) não visualiza decisões estratégicas. Troque o perfil no topo da página para demonstrar o fluxo."
        icon={ShieldAlert}
      />
    );
  }

  const decide = (event: CalendarEvent, option: string) => {
    const { id, ...rest } = event;
    mutations.saveEvent.mutate(
      {
        id,
        event: applyStatusTransition(
          { ...rest, decisionSelected: option },
          "concluida",
          new Date().toISOString(),
        ),
        baseUpdatedAt: event.updatedAt,
      },
      { onSuccess: () => toast.success(`Decisão registrada: ${option}`) },
    );
  };

  const reopen = (event: CalendarEvent) => {
    const { id, ...rest } = event;
    mutations.saveEvent.mutate(
      {
        id,
        event: applyStatusTransition(
          { ...rest, decisionSelected: undefined },
          "pendente",
          new Date().toISOString(),
        ),
        baseUpdatedAt: event.updatedAt,
      },
      { onSuccess: () => toast.success("Decisão reaberta.") },
    );
  };

  const convertToTask = (event: CalendarEvent) => {
    mutations.saveEvent.mutate(
      {
        event: {
          title: event.decisionSelected
            ? `Executar: ${event.decisionSelected}`
            : `Executar decisão: ${event.title}`,
          description: `Tarefa gerada a partir da decisão "${event.title}".`,
          eventType: "operacao",
          startsAt: event.startsAt,
          allDay: true,
          statusId: "planejada",
          priority: event.priority,
          source: "decisao",
          visibility: "equipe",
          talhaoId: event.talhaoId,
          talhaoName: event.talhaoName,
          safra: event.safra,
          cycleId: event.cycleId,
          cicloNome: event.cicloNome,
          fazenda: event.fazenda,
          relatedModule: "calendar-event",
          relatedRecordId: event.id,
        },
      },
      {
        onSuccess: () =>
          toast.success("Tarefa criada para a equipe (sem expor o contexto estratégico)."),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-warning" />
          Modo demonstrativo: a visibilidade por papel ainda não é aplicada no servidor (RLS). Não
          trate esta tela como sigilo real.
        </span>
        {capabilities.canDecide && (
          <button
            onClick={() => onCreate()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova decisão
          </button>
        )}
      </div>

      {decisoes.length === 0 ? (
        <EmptyState
          title="Nenhuma decisão no filtro atual"
          description='Crie uma tarefa com tipo "Decisão" e liste as opções em avaliação.'
          icon={GitBranch}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {decisoes.map((event) => {
            const statusId = effectiveStatusId(event, now);
            const statusLabel =
              model.statuses.find((status) => status.id === statusId)?.label ?? statusId;
            const open = isEventActive(event);
            return (
              <div key={event.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{event.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Prazo: {formatDay(event.startsAt)}
                      {event.talhaoName ? ` · ${event.talhaoName}` : ""}
                      {event.cicloNome ? ` · ${event.cicloNome}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium",
                      statusBadgeClass(statusId),
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>

                {event.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                )}
                {event.delayCost != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Impacto estimado do atraso:{" "}
                    <span className="font-medium text-foreground">{brl(event.delayCost)}</span>
                  </p>
                )}

                <div className="mt-3 space-y-1.5">
                  {(event.decisionOptions ?? []).map((option) => {
                    const chosen = event.decisionSelected === option;
                    return (
                      <div
                        key={option}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
                          chosen
                            ? "border-success/50 bg-success/10 font-medium"
                            : "border-border bg-background/60",
                        )}
                      >
                        <span className="min-w-0 truncate">
                          {chosen && (
                            <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-success" />
                          )}
                          {option}
                        </span>
                        {capabilities.canDecide && open && !chosen && (
                          <button
                            onClick={() => decide(event, option)}
                            className="h-7 shrink-0 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Escolher
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {!event.decisionOptions?.length && (
                    <p className="text-xs text-muted-foreground">
                      Sem opções cadastradas — edite a decisão para listar as alternativas.
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {capabilities.canDecide && (
                    <button
                      onClick={() => onEdit(event)}
                      className="h-8 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
                    >
                      Editar
                    </button>
                  )}
                  {capabilities.canDecide && !open && (
                    <button
                      onClick={() => reopen(event)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reabrir
                    </button>
                  )}
                  {capabilities.canDecide && event.decisionSelected && (
                    <button
                      onClick={() => convertToTask(event)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
                    >
                      <GitBranch className="h-3 w-3" />
                      Gerar tarefa
                    </button>
                  )}
                  {capabilities.canDeleteDecisions && (
                    <button
                      onClick={() => setDeleting(event)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir decisão?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” será removida. Tarefas já geradas a partir dela são mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  mutations.removeEvent.mutate(deleting.id, {
                    onSuccess: () => toast.success("Decisão excluída."),
                  });
                }
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
