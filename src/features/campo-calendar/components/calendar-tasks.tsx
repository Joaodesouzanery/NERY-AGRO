import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Copy,
  Edit3,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  UserRoundMinus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCalendarMutations } from "@/features/campo-calendar/hooks/use-calendar-mutations";
import {
  duplicateCalendarEvent,
  reopenCalendarEvent,
  transitionCalendarEvent,
  validateCalendarEventContext,
  visualCalendarStatus,
} from "@/features/campo-calendar/domain/tasks";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarField,
  CalendarPriority,
  CalendarStatusDefinition,
  CalendarWorkspace,
} from "@/features/campo-calendar/types";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type TaskForm = {
  title: string;
  description: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  talhaoId: string;
  cycleId: string;
  responsibleName: string;
  statusId: string;
  priority: CalendarPriority;
  estimatedCost: string;
  notes: string;
  relatedModule: string;
  relatedRecordId: string;
};

export function CalendarTasks({
  workspace,
  events,
  referenceDate,
}: {
  workspace: CalendarWorkspace;
  events: CalendarEvent[];
  referenceDate: string;
}) {
  const mutations = useCalendarMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<TaskForm>(() =>
    emptyForm(workspace.statuses, referenceDate),
  );
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [statusesOpen, setStatusesOpen] = useState(false);
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

  const beginCreate = () => {
    setEditing(null);
    setForm(emptyForm(workspace.statuses, referenceDate));
    setFormOpen(true);
  };
  const beginEdit = (event: CalendarEvent) => {
    if (event.source === "Legado") {
      toast.info("Duplique o registro legado para editá-lo no modelo canônico.");
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
        toast.success("Tarefa atualizada.");
      } else {
        await mutations.createEvent.mutateAsync(input);
        toast.success("Tarefa criada.");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a tarefa.");
    }
  };

  const updateEvent = async (event: CalendarEvent, message: string) => {
    try {
      await mutations.updateEvent.mutateAsync(event);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tarefas</h2>
          <p className="text-sm text-muted-foreground">
            Atividades operacionais, compras e decisões do contexto filtrado.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStatusesOpen(true)}>
            <Settings2 />
            Configurar status
          </Button>
          <Button onClick={beginCreate}>
            <Plus />
            Nova tarefa
          </Button>
        </div>
      </div>

      {!events.length ? (
        <div className="mt-5 border border-dashed border-border px-5 py-14 text-center">
          <p className="font-medium">Nenhuma tarefa no contexto atual.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Limpe os filtros ou crie uma nova tarefa.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto border border-border">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                {[
                  "Título",
                  "Tipo",
                  "Data / período",
                  "Talhão",
                  "Ciclo",
                  "Responsável",
                  "Status",
                  "Prioridade",
                  "Origem",
                  "Custo",
                  "Risco climático",
                  "Ações",
                ].map((label) => (
                  <th key={label} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const visualStatus = visualCalendarStatus(event, referenceDate);
                const status = workspace.statuses.find((item) => item.id === event.statusId);
                return (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="max-w-64 px-3 py-3">
                      <div className="truncate font-medium">{event.title}</div>
                      {event.description && (
                        <div className="truncate text-xs text-muted-foreground">
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">{event.eventType}</td>
                    <td className="whitespace-nowrap px-3 py-3">{period(event)}</td>
                    <td className="px-3 py-3">{event.talhaoName || "Toda a fazenda"}</td>
                    <td className="px-3 py-3">{event.ciclo || "Sem ciclo"}</td>
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Responsável de ${event.title}`}
                        value={event.responsibleName || ""}
                        disabled={event.source === "Legado"}
                        onChange={(change) =>
                          void updateEvent(
                            {
                              ...event,
                              responsibleId: change.target.value
                                ? slug(change.target.value)
                                : undefined,
                              responsibleName: change.target.value || undefined,
                            },
                            change.target.value
                              ? "Responsável atribuído."
                              : "Responsável removido.",
                          )
                        }
                        className="h-8 max-w-44 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Sem responsável</option>
                        {responsibleOptions.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Status de ${event.title}`}
                        value={event.statusId}
                        disabled={event.source === "Legado"}
                        onChange={(change) => {
                          const next = workspace.statuses.find(
                            (item) => item.id === change.target.value,
                          );
                          if (next) {
                            void updateEvent(
                              transitionCalendarEvent(event, next.name, next.id),
                              "Status atualizado.",
                            );
                          }
                        }}
                        className={cn(
                          "h-8 rounded-md border bg-background px-2 text-xs",
                          visualStatus === "Atrasada" && "border-destructive text-destructive",
                        )}
                        style={{ borderColor: status?.color }}
                      >
                        {!workspace.statuses.some((item) => item.id === event.statusId) && (
                          <option value={event.statusId}>{event.status}</option>
                        )}
                        {workspace.statuses
                          .filter((item) => item.active || item.id === event.statusId)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                      {visualStatus === "Atrasada" && event.status !== "Atrasada" && (
                        <div className="mt-1 text-[10px] text-destructive">Atrasada visualmente</div>
                      )}
                    </td>
                    <td className="px-3 py-3">{event.priority}</td>
                    <td className="px-3 py-3">{event.source}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {event.estimatedCost === undefined ? "—" : money(event.estimatedCost)}
                    </td>
                    <td className="px-3 py-3">{event.weatherRisk || "—"}</td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Ações de ${event.title}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => beginEdit(event)}>
                            <Edit3 />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await mutations.createEvent.mutateAsync(
                                  duplicateCalendarEvent(event),
                                );
                                toast.success("Tarefa duplicada.");
                              } catch (error) {
                                toast.error(
                                  error instanceof Error ? error.message : "Falha ao duplicar.",
                                );
                              }
                            }}
                          >
                            <Copy />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={event.source === "Legado"}
                            onClick={() =>
                              void updateEvent(
                                transitionCalendarEvent(event, "Concluída", "completed"),
                                "Tarefa concluída.",
                              )
                            }
                          >
                            <CheckCircle2 />
                            Concluir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={event.source === "Legado"}
                            onClick={() =>
                              void updateEvent(
                                transitionCalendarEvent(event, "Cancelada", "cancelled"),
                                "Tarefa cancelada.",
                              )
                            }
                          >
                            <XCircle />
                            Cancelar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={event.source === "Legado"}
                            onClick={() =>
                              void updateEvent(reopenCalendarEvent(event), "Tarefa reaberta.")
                            }
                          >
                            <RotateCcw />
                            Reabrir
                          </DropdownMenuItem>
                          {event.responsibleName && (
                            <DropdownMenuItem
                              disabled={event.source === "Legado"}
                              onClick={() =>
                                void updateEvent(
                                  {
                                    ...event,
                                    responsibleId: undefined,
                                    responsibleName: undefined,
                                  },
                                  "Responsável removido.",
                                )
                              }
                            >
                              <UserRoundMinus />
                              Remover responsável
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={event.source === "Legado"}
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
      <StatusSettingsDialog
        open={statusesOpen}
        onOpenChange={setStatusesOpen}
        statuses={workspace.statuses}
        events={workspace.events}
      />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente “{deleteTarget?.title}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await mutations.deleteEvent.mutateAsync(deleteTarget);
                  toast.success("Tarefa excluída.");
                  setDeleteTarget(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Falha ao excluir.");
                }
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

export function TaskDialog({
  open,
  onOpenChange,
  form,
  setForm,
  editing,
  workspace,
  responsibleOptions,
  pending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TaskForm;
  setForm: React.Dispatch<React.SetStateAction<TaskForm>>;
  editing: CalendarEvent | null;
  workspace: CalendarWorkspace;
  responsibleOptions: string[];
  pending: boolean;
  onSave: () => void;
}) {
  const field = workspace.fields.find((item) => item.id === form.talhaoId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Registre a atividade e seus vínculos operacionais.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" className="sm:col-span-2">
            <Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>
          <Field label="Tipo">
            <Input
              value={form.eventType}
              onChange={(event) =>
                setForm((current) => ({ ...current, eventType: event.target.value }))
              }
              list="calendar-event-types"
            />
            <datalist id="calendar-event-types">
              {["Operação", "Plantio", "Colheita", "Vistoria", "Manejo", "compra", "decisao"].map(
                (type) => (
                  <option key={type}>{type}</option>
                ),
              )}
            </datalist>
          </Field>
          <Field label="Status">
            <select
              value={form.statusId}
              onChange={(event) =>
                setForm((current) => ({ ...current, statusId: event.target.value }))
              }
              className="h-9 rounded-md border border-input bg-background px-3"
            >
              {workspace.statuses
                .filter((status) => status.active || status.id === form.statusId)
                .map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Início">
            <Input
              type={form.allDay ? "date" : "datetime-local"}
              value={form.startsAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, startsAt: event.target.value }))
              }
            />
          </Field>
          <Field label="Fim">
            <Input
              type={form.allDay ? "date" : "datetime-local"}
              value={form.endsAt}
              onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={form.allDay}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  allDay: checked === true,
                  startsAt: normalizeFormDate(current.startsAt, checked === true),
                  endsAt: normalizeFormDate(current.endsAt, checked === true),
                }))
              }
            />
            Dia inteiro
          </label>
          <Field label="Talhão">
            <select
              value={form.talhaoId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  talhaoId: event.target.value,
                  cycleId: "",
                }))
              }
              className="h-9 rounded-md border border-input bg-background px-3"
            >
              <option value="">Toda a fazenda</option>
              {workspace.fields.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ciclo">
            <select
              value={form.cycleId}
              disabled={!field}
              onChange={(event) =>
                setForm((current) => ({ ...current, cycleId: event.target.value }))
              }
              className="h-9 rounded-md border border-input bg-background px-3 disabled:opacity-50"
            >
              <option value="">Sem ciclo</option>
              {(field?.cycles ?? []).map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} · {cycle.seasonId}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Responsável">
            <Input
              value={form.responsibleName}
              onChange={(event) =>
                setForm((current) => ({ ...current, responsibleName: event.target.value }))
              }
              list="calendar-responsibles"
              placeholder="Opcional"
            />
            <datalist id="calendar-responsibles">
              {responsibleOptions.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </datalist>
          </Field>
          <Field label="Prioridade">
            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as CalendarPriority,
                }))
              }
              className="h-9 rounded-md border border-input bg-background px-3"
            >
              {["Baixa", "Normal", "Alta", "Crítica"].map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </Field>
          <Field label="Custo estimado">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedCost}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedCost: event.target.value }))
              }
            />
          </Field>
          <Field label="Módulo relacionado">
            <Input
              value={form.relatedModule}
              onChange={(event) =>
                setForm((current) => ({ ...current, relatedModule: event.target.value }))
              }
              placeholder="Ex.: pragas, insumos"
            />
          </Field>
          <Field label="Registro relacionado">
            <Input
              value={form.relatedRecordId}
              onChange={(event) =>
                setForm((current) => ({ ...current, relatedRecordId: event.target.value }))
              }
              placeholder="ID opcional"
            />
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Salvando..." : "Salvar tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusSettingsDialog({
  open,
  onOpenChange,
  statuses,
  events,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: CalendarStatusDefinition[];
  events: CalendarEvent[];
}) {
  const { saveStatus } = useCalendarMutations();
  const [drafts, setDrafts] = useState(statuses);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open) setDrafts(statuses.map((status) => ({ ...status })));
  }, [open, statuses]);

  const persist = async (status: CalendarStatusDefinition) => {
    try {
      await saveStatus.mutateAsync(status);
      toast.success("Status salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar o status.");
    }
  };
  const reorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= drafts.length) return;
    const next = [...drafts];
    [next[index], next[target]] = [next[target], next[index]];
    const ordered = next.map((status, order) => ({ ...status, order: (order + 1) * 10 }));
    setDrafts(ordered);
    await Promise.all([persist(ordered[index]), persist(ordered[target])]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setDrafts(statuses);
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Status das tarefas</DialogTitle>
          <DialogDescription>
            IDs padrão permanecem fixos. Status em uso podem ser inativados, mas não são removidos.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] divide-y divide-border overflow-y-auto border border-border">
          {[...drafts]
            .sort((a, b) => a.order - b.order)
            .map((status, index) => (
              <div key={status.id} className="grid grid-cols-[1fr_90px_auto] gap-2 p-3">
                <div>
                  <Input
                    aria-label={`Nome do status ${status.id}`}
                    value={status.name}
                    onChange={(event) =>
                      setDrafts((current) =>
                        current.map((item) =>
                          item.id === status.id ? { ...item, name: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    ID: {status.id}
                    {events.some((event) => event.statusId === status.id) && " · em uso"}
                  </div>
                </div>
                <Input
                  aria-label={`Cor do status ${status.id}`}
                  type="color"
                  value={status.color}
                  onChange={(event) =>
                    setDrafts((current) =>
                      current.map((item) =>
                        item.id === status.id ? { ...item, color: event.target.value } : item,
                      ),
                    )
                  }
                />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => void reorder(index, -1)}>
                    ↑
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => void reorder(index, 1)}>
                    ↓
                  </Button>
                  <label className="flex items-center gap-1 px-2 text-xs">
                    <Checkbox
                      checked={status.active}
                      onCheckedChange={(checked) => {
                        const next = { ...status, active: checked === true };
                        setDrafts((current) =>
                          current.map((item) => (item.id === status.id ? next : item)),
                        );
                        void persist(next);
                      }}
                    />
                    Ativo
                  </label>
                  <Button variant="outline" size="sm" onClick={() => void persist(status)}>
                    Salvar
                  </Button>
                </div>
              </div>
            ))}
        </div>
        <div className="flex gap-2 border-t border-border pt-3">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Novo status"
          />
          <Button
            onClick={async () => {
              if (!newName.trim()) return toast.error("Informe o nome do status.");
              const status: CalendarStatusDefinition = {
                id: `custom-${crypto.randomUUID()}`,
                name: newName.trim(),
                color: "#7c3aed",
                order: (drafts.length + 1) * 10,
                active: true,
                isDefault: false,
              };
              await persist(status);
              setDrafts((current) => [...current, status]);
              setNewName("");
            }}
          >
            Criar status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function emptyForm(
  statuses: CalendarStatusDefinition[],
  initialDate = new Date().toISOString().slice(0, 10),
): TaskForm {
  const planned = statuses.find((status) => status.id === "planned") ?? statuses[0];
  return {
    title: "",
    description: "",
    eventType: "Operação",
    startsAt: initialDate,
    endsAt: "",
    allDay: true,
    talhaoId: "",
    cycleId: "",
    responsibleName: "",
    statusId: planned?.id || "planned",
    priority: "Normal",
    estimatedCost: "",
    notes: "",
    relatedModule: "",
    relatedRecordId: "",
  };
}

export function eventToForm(event: CalendarEvent): TaskForm {
  return {
    title: event.title,
    description: event.description || "",
    eventType: event.eventType,
    startsAt: event.allDay ? event.startsAt.slice(0, 10) : event.startsAt.slice(0, 16),
    endsAt: event.endsAt
      ? event.allDay
        ? event.endsAt.slice(0, 10)
        : event.endsAt.slice(0, 16)
      : "",
    allDay: event.allDay,
    talhaoId: event.talhaoId || "",
    cycleId: event.cycleId || "",
    responsibleName: event.responsibleName || "",
    statusId: event.statusId,
    priority: event.priority,
    estimatedCost: event.estimatedCost === undefined ? "" : String(event.estimatedCost),
    notes: event.notes || "",
    relatedModule: event.relatedModule || "",
    relatedRecordId: event.relatedRecordId || "",
  };
}

export function formToInput(
  form: TaskForm,
  editing: CalendarEvent | null,
  workspace: CalendarWorkspace,
): CalendarEventInput {
  if (!form.title.trim()) throw new Error("Informe o título da tarefa.");
  if (!form.startsAt) throw new Error("Informe a data de início.");
  const field = workspace.fields.find((item) => item.id === form.talhaoId);
  const cycle = field?.cycles.find((item) => item.id === form.cycleId);
  const status = workspace.statuses.find((item) => item.id === form.statusId);
  const startsAt = toInstant(form.startsAt, form.allDay);
  const endsAt = form.endsAt ? toInstant(form.endsAt, form.allDay) : undefined;
  if (endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    throw new Error("O fim não pode ser anterior ao início.");
  }
  return {
    farmKey: workspace.farm.key,
    fazenda: workspace.farm.name,
    talhaoId: field?.id,
    talhaoName: field?.name,
    seasonId: cycle?.seasonId || field?.season || workspace.farm.season,
    safra: cycle?.seasonId || field?.season || workspace.farm.season,
    cycleId: cycle?.id,
    ciclo: cycle?.name,
    title: form.title.trim(),
    description: optional(form.description),
    eventType: form.eventType.trim() || "Operação",
    startsAt,
    endsAt,
    allDay: form.allDay,
    statusId: status?.id || form.statusId,
    status: status?.name || editing?.status || "Planejada",
    priority: form.priority,
    responsibleId: form.responsibleName.trim()
      ? slug(form.responsibleName)
      : undefined,
    responsibleName: optional(form.responsibleName),
    source: editing?.source === "Legado" ? "Manual" : editing?.source || "Manual",
    visibility: editing?.visibility || "Equipe",
    estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
    delayCost: editing?.delayCost,
    decisionOptions: editing?.decisionOptions || [],
    decisionSelected: editing?.decisionSelected,
    weatherRisk: editing?.weatherRisk,
    weatherSummary: editing?.weatherSummary,
    relatedModule: optional(form.relatedModule),
    relatedRecordId: optional(form.relatedRecordId),
    templateId: editing?.templateId,
    completedAt:
      status?.id === "completed"
        ? editing?.completedAt || new Date().toISOString()
        : undefined,
    cancelledAt:
      status?.id === "cancelled"
        ? editing?.cancelledAt || new Date().toISOString()
        : undefined,
    notes: optional(form.notes),
  };
}

function toInstant(value: string, allDay: boolean) {
  return allDay
    ? `${value.slice(0, 10)}T12:00:00-03:00`
    : `${value.length === 16 ? value : value.slice(0, 16)}:00-03:00`;
}

function normalizeFormDate(value: string, allDay: boolean) {
  if (!value) return "";
  return allDay ? value.slice(0, 10) : `${value.slice(0, 10)}T12:00`;
}

function optional(value: string) {
  return value.trim() || undefined;
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function period(event: CalendarEvent) {
  const start = format(parseISO(event.startsAt), event.allDay ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm");
  if (!event.endsAt) return start;
  return `${start} – ${format(
    parseISO(event.endsAt),
    event.allDay ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm",
  )}`;
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
