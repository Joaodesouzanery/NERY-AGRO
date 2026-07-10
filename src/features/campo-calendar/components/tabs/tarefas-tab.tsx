// Tarefas: lista operacional com fluxo completo — criar, editar, duplicar,
// concluir, cancelar, reabrir, excluir (com confirmação), status rápido e
// responsável. Registros legados (module = calendario) aparecem somente leitura.
import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit3,
  ListChecks,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
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
import {
  eventTypeLabels,
  priorityLabels,
  sourceLabels,
  type CalendarEvent,
} from "@/features/campo-calendar/types/domain";
import {
  brl,
  eventTypeTone,
  statusBadgeClass,
} from "@/features/campo-calendar/components/event-tone";
import { StatusManagerDialog } from "@/features/campo-calendar/components/status-manager-dialog";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";

export function TarefasTab(props: CalendarTabProps) {
  const { model, events, now, onCreate, onEdit, onDuplicate, mutations } = props;
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);

  const setStatus = (event: CalendarEvent, statusId: string) => {
    if (event.legacy) return;
    const { id, ...rest } = event;
    mutations.saveEvent.mutate(
      {
        id,
        event: applyStatusTransition(rest, statusId, new Date().toISOString()),
        baseUpdatedAt: event.updatedAt,
      },
      { onSuccess: () => toast.success("Status atualizado.") },
    );
  };

  const tarefas = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {tarefas.length} tarefa(s) no filtro atual · registros legados aparecem como somente
          leitura.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            <ListChecks className="h-4 w-4" />
            Status
          </button>
          <button
            onClick={() => onCreate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova tarefa
          </button>
        </div>
      </div>

      {tarefas.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa no filtro atual"
          description="Crie uma tarefa ou gere a partir de um modelo de ciclo."
          icon={CalendarDays}
          action={
            <button
              onClick={() => onCreate()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Tarefa</th>
                <th className="px-2 py-3 font-medium">Período</th>
                <th className="px-2 py-3 font-medium">Talhão · Ciclo</th>
                <th className="px-2 py-3 font-medium">Responsável</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3 font-medium">Prioridade</th>
                <th className="px-2 py-3 font-medium">Custo</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tarefas.map((event) => {
                const statusId = effectiveStatusId(event, now);
                const overdue = statusId === "atrasada" && event.statusId !== "atrasada";
                return (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="max-w-72 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: eventTypeTone[event.eventType] }}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{event.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {eventTypeLabels[event.eventType]} · {sourceLabels[event.source]}
                            {event.legacy ? " · somente leitura" : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-xs">
                      {formatDay(event.startsAt)}
                      {event.endsAt ? ` – ${formatDay(event.endsAt)}` : ""}
                      {overdue && (
                        <span className="ml-1.5 rounded bg-destructive/15 px-1 py-0.5 text-[10px] font-medium text-destructive">
                          vencida
                        </span>
                      )}
                    </td>
                    <td className="max-w-44 truncate px-2 py-2.5 text-xs">
                      {event.talhaoName ?? "Fazenda toda"}
                      {event.cicloNome ? ` · ${event.cicloNome}` : ""}
                    </td>
                    <td className="max-w-36 truncate px-2 py-2.5 text-xs">
                      {event.responsibleName || (
                        <span className="text-muted-foreground">sem responsável</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      {event.legacy ? (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-medium",
                            statusBadgeClass(statusId),
                          )}
                        >
                          {model.statuses.find((status) => status.id === statusId)?.label ??
                            statusId}
                        </span>
                      ) : (
                        <select
                          value={event.statusId}
                          onChange={(change) => setStatus(event, change.target.value)}
                          aria-label={`Status de ${event.title}`}
                          className={cn(
                            "h-7 rounded-md border border-border bg-background px-1.5 text-xs",
                            statusId === "atrasada" && "border-destructive/60",
                          )}
                        >
                          {model.statuses
                            .filter((status) => status.active || status.id === event.statusId)
                            .map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.label}
                              </option>
                            ))}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-xs">{priorityLabels[event.priority]}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-xs tabular-nums">
                      {event.estimatedCost != null ? brl(event.estimatedCost) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {!event.legacy && (
                        <div className="flex justify-end gap-1">
                          <IconButton
                            label="Editar"
                            onClick={() => onEdit(event)}
                            icon={<Edit3 className="h-3.5 w-3.5" />}
                          />
                          <IconButton
                            label="Duplicar"
                            onClick={() => onDuplicate(event)}
                            icon={<Copy className="h-3.5 w-3.5" />}
                          />
                          {isEventActive(event) ? (
                            <>
                              <IconButton
                                label="Concluir"
                                onClick={() => setStatus(event, "concluida")}
                                icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                              />
                              <IconButton
                                label="Cancelar tarefa"
                                onClick={() => setStatus(event, "cancelada")}
                                icon={<XCircle className="h-3.5 w-3.5" />}
                              />
                            </>
                          ) : (
                            <IconButton
                              label="Reabrir"
                              onClick={() => setStatus(event, "pendente")}
                              icon={<RotateCcw className="h-3.5 w-3.5" />}
                            />
                          )}
                          <IconButton
                            label="Excluir"
                            onClick={() => setDeleting(event)}
                            icon={<Trash2 className="h-3.5 w-3.5 text-destructive" />}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” será removida do Calendário. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  mutations.removeEvent.mutate(deleting.id, {
                    onSuccess: () => toast.success("Tarefa excluída."),
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

      <StatusManagerDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        statuses={model.statuses}
        events={props.allEvents.filter((event) => !event.legacy)}
        pending={mutations.persistStatus.isPending || mutations.remapStatus.isPending}
        onSave={(status) =>
          mutations.persistStatus.mutate(
            model.statuses.find((item) => item.id === status.id && item.recordId)
              ? {
                  ...status,
                  recordId: model.statuses.find((item) => item.id === status.id)?.recordId,
                }
              : status,
            { onSuccess: () => toast.success("Status salvo.") },
          )
        }
        onRemap={({ events: toRemap, toStatusId, then }) =>
          mutations.remapStatus.mutate(
            { events: toRemap, toStatusId },
            {
              onSuccess: () => {
                mutations.persistStatus.mutate(then);
                toast.success(`${toRemap.length} tarefa(s) remapeada(s).`);
              },
            },
          )
        }
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
    >
      {icon}
    </button>
  );
}
