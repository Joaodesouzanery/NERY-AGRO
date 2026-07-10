// Modelos de Ciclo: tarefas padrão por cultura/ciclo com geração assistida —
// sempre com prévia editável e detecção de duplicidade antes de salvar
// (source = ciclo + templateId). Sugestões são editáveis, não prescrição
// agronômica definitiva. Também permite reutilizar tarefas de ciclo anterior.
import { useMemo, useState } from "react";
import { Copy, Edit3, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cycleTemplateSchema } from "@/features/campo-calendar/schemas/domain";
import {
  generateFromTemplate,
  reuseCycleTasks,
  formatDay,
  type GeneratedTask,
} from "@/features/campo-calendar/lib/derive";
import {
  calendarEventTypes,
  calendarPriorities,
  eventTypeLabels,
  priorityLabels,
  type CalendarCycle,
  type CalendarEvent,
  type CycleTemplate,
  type CycleTemplateItem,
} from "@/features/campo-calendar/types/domain";
import { brl } from "@/features/campo-calendar/components/event-tone";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";

const inputClass =
  "h-9 rounded-md border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

export function ModelosTab(props: CalendarTabProps) {
  const { model, allEvents, mutations } = props;
  const [wizard, setWizard] = useState<{ template: CycleTemplate | null; reuse: boolean } | null>(
    null,
  );
  const [editing, setEditing] = useState<CycleTemplate | "new" | null>(null);
  const [deleting, setDeleting] = useState<CycleTemplate | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Sugestões editáveis por cultura/ciclo — revise a prévia antes de confirmar; nada é criado
          sem confirmação.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setWizard({ template: null, reuse: true })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            <Copy className="h-4 w-4" />
            Reusar ciclo anterior
          </button>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo modelo
          </button>
        </div>
      </div>

      {model.templates.length === 0 ? (
        <EmptyState
          title="Nenhum modelo cadastrado"
          description="Crie um modelo de ciclo (ex.: Soja Verão) para gerar tarefas automaticamente."
          icon={Sparkles}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {model.templates.map((template) => (
            <div
              key={template.id}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                !template.ativo && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{template.nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    {template.cultura} · {template.cicloTipo} · {template.regime}
                    {template.duracaoDias ? ` · ${template.duracaoDias} dias` : ""}
                    {!template.ativo ? " · inativo" : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                  {template.itens.length} tarefas
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {template.itens.slice(0, 4).map((item) => (
                  <li key={item.id} className="truncate">
                    • {item.titulo} ({item.offsetDias >= 0 ? "+" : ""}
                    {item.offsetDias}d do{" "}
                    {item.ancora === "inicio"
                      ? "início"
                      : item.ancora === "fim"
                        ? "fim"
                        : "anterior"}
                    )
                  </li>
                ))}
                {template.itens.length > 4 && <li>… e mais {template.itens.length - 4}</li>}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setWizard({ template, reuse: false })}
                  disabled={!template.ativo}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Wand2 className="h-3 w-3" />
                  Gerar tarefas
                </button>
                <button
                  onClick={() => setEditing(template)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
                >
                  <Edit3 className="h-3 w-3" />
                  Editar
                </button>
                <button
                  onClick={() => setDeleting(template)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs text-destructive hover:bg-muted"
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {wizard && (
        <GenerateWizard
          open
          onOpenChange={(open) => !open && setWizard(null)}
          template={wizard.template}
          reuse={wizard.reuse}
          cycles={model.cycles}
          events={allEvents}
          pending={mutations.createEvents.isPending}
          onConfirm={(drafts) =>
            mutations.createEvents.mutate(drafts, {
              onSuccess: () => {
                toast.success(`${drafts.length} tarefa(s) criada(s) a partir do ciclo.`);
                setWizard(null);
              },
            })
          }
        />
      )}

      {editing && (
        <TemplateEditorDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          template={editing === "new" ? null : editing}
          pending={mutations.persistTemplate.isPending}
          onSave={(template) =>
            mutations.persistTemplate.mutate(template, {
              onSuccess: () => {
                toast.success("Modelo salvo.");
                setEditing(null);
              },
            })
          }
        />
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.nome}” será removido. Tarefas já geradas por ele são mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting?.recordId) {
                  mutations.removeTemplate.mutate(deleting.recordId, {
                    onSuccess: () => toast.success("Modelo excluído."),
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

// ── Assistente de geração (modelo → ciclo real, ou reutilizar ciclo anterior) ──

function GenerateWizard({
  open,
  onOpenChange,
  template,
  reuse,
  cycles,
  events,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CycleTemplate | null;
  reuse: boolean;
  cycles: CalendarCycle[];
  events: CalendarEvent[];
  pending: boolean;
  onConfirm: (drafts: Array<Omit<CalendarEvent, "id">>) => void;
}) {
  const [talhaoId, setTalhaoId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [sourceCycleId, setSourceCycleId] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [dates, setDates] = useState<Record<string, string>>({});

  const talhoes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const cycle of cycles) seen.set(cycle.talhaoId, cycle.talhaoName);
    return [...seen.entries()].map(([id, nome]) => ({ id, nome }));
  }, [cycles]);
  const talhaoCycles = cycles.filter((cycle) => cycle.talhaoId === talhaoId);
  const targetCycle = cycles.find((cycle) => cycle.id === cycleId);
  const sourceCycles = talhaoCycles.filter(
    (cycle) => cycle.id !== cycleId && targetCycle && cycle.inicio < targetCycle.inicio,
  );
  const sourceCycle = cycles.find((cycle) => cycle.id === sourceCycleId);

  const preview: GeneratedTask[] = useMemo(() => {
    if (!targetCycle) return [];
    if (reuse) {
      return sourceCycle ? reuseCycleTasks(events, sourceCycle, targetCycle) : [];
    }
    return template ? generateFromTemplate(template, targetCycle, events) : [];
  }, [targetCycle, sourceCycle, template, reuse, events]);

  const isChecked = (task: GeneratedTask) => selected[task.key] ?? !task.duplicate;
  const chosen = preview.filter(isChecked);
  const totalCost = chosen.reduce((sum, task) => sum + (task.draft.estimatedCost ?? 0), 0);

  const confirm = () => {
    if (!chosen.length) return toast.error("Selecione pelo menos uma tarefa da prévia.");
    onConfirm(
      chosen.map((task) => ({
        ...task.draft,
        startsAt: dates[task.key] || task.draft.startsAt,
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {reuse ? "Reusar tarefas de ciclo anterior" : `Gerar tarefas · ${template?.nome}`}
          </DialogTitle>
          <DialogDescription>
            Revise a prévia: edite datas, desmarque itens e confirme. Duplicidades já detectadas vêm
            desmarcadas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Talhão</span>
            <select
              value={talhaoId}
              onChange={(event) => {
                setTalhaoId(event.target.value);
                setCycleId("");
                setSourceCycleId("");
              }}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {talhoes.map((talhao) => (
                <option key={talhao.id} value={talhao.id}>
                  {talhao.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Ciclo de destino</span>
            <select
              value={cycleId}
              onChange={(event) => setCycleId(event.target.value)}
              disabled={!talhaoId}
              className={cn(inputClass, "disabled:opacity-50")}
            >
              <option value="">Selecione</option>
              {talhaoCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.nome} · {cycle.safra}
                </option>
              ))}
            </select>
          </label>
          {reuse && (
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Copiar do ciclo</span>
              <select
                value={sourceCycleId}
                onChange={(event) => setSourceCycleId(event.target.value)}
                disabled={!cycleId}
                className={cn(inputClass, "disabled:opacity-50")}
              >
                <option value="">Selecione</option>
                {sourceCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.nome} · {cycle.safra}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {targetCycle && (
          <p className="text-xs text-muted-foreground">
            Janela do ciclo: {formatDay(targetCycle.inicio)} – {formatDay(targetCycle.fimPrevisto)}
            {targetCycle.areaHa ? ` · ${targetCycle.areaHa.toLocaleString("pt-BR")} ha` : ""}
          </p>
        )}

        {preview.length > 0 ? (
          <div className="space-y-1.5">
            {preview.map((task) => (
              <div
                key={task.key}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5 text-sm",
                  task.duplicate && "border-warning/40",
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked(task)}
                  onChange={(event) =>
                    setSelected((current) => ({ ...current, [task.key]: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border"
                  aria-label={`Incluir ${task.draft.title}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{task.draft.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {eventTypeLabels[task.draft.eventType]} · {priorityLabels[task.draft.priority]}
                    {task.draft.estimatedCost ? ` · ${brl(task.draft.estimatedCost)}` : ""}
                    {task.duplicate && (
                      <span className="ml-1.5 rounded bg-warning/15 px-1 py-0.5 text-[10px] font-medium text-warning">
                        possível duplicidade
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={dates[task.key] ?? task.draft.startsAt}
                  onChange={(event) =>
                    setDates((current) => ({ ...current, [task.key]: event.target.value }))
                  }
                  className={cn(inputClass, "h-8 text-xs")}
                  aria-label={`Data de ${task.draft.title}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {reuse
              ? "Escolha talhão, ciclo de destino e o ciclo anterior de origem para ver a prévia."
              : "Escolha talhão e ciclo para ver a prévia das tarefas sugeridas."}
          </p>
        )}

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {chosen.length} de {preview.length} selecionada(s)
            {totalCost ? ` · custo estimado ${brl(totalCost)}` : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={pending || !chosen.length}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Confirmar e criar
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Editor de modelo (nome, cultura, regime e itens com âncora/offset) ──

function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  pending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CycleTemplate | null;
  pending: boolean;
  onSave: (template: CycleTemplate) => void;
}) {
  const [draft, setDraft] = useState<CycleTemplate>(
    () =>
      template ?? {
        id: `template-${Date.now()}`,
        nome: "",
        cultura: "",
        cicloTipo: "Produção",
        regime: "ambos",
        ativo: true,
        itens: [],
      },
  );

  const setItem = (id: string, patch: Partial<CycleTemplateItem>) =>
    setDraft((current) => ({
      ...current,
      itens: current.itens.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const addItem = () =>
    setDraft((current) => ({
      ...current,
      itens: [
        ...current.itens,
        {
          id: `item-${Date.now()}-${current.itens.length}`,
          titulo: "",
          eventType: "operacao",
          offsetDias: 0,
          ancora: "inicio",
          priority: "normal",
          obrigatorio: true,
        },
      ],
    }));

  const submit = () => {
    const parsed = cycleTemplateSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revise os campos do modelo.");
      return;
    }
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? "Editar modelo" : "Novo modelo de ciclo"}</DialogTitle>
          <DialogDescription>
            Tarefas padrão com deslocamento em dias a partir do início do ciclo, do fim previsto ou
            da tarefa anterior.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Nome *</span>
            <input
              value={draft.nome}
              onChange={(event) => setDraft({ ...draft, nome: event.target.value })}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Cultura *</span>
            <input
              value={draft.cultura}
              onChange={(event) => setDraft({ ...draft, cultura: event.target.value })}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Tipo de ciclo *</span>
            <input
              value={draft.cicloTipo}
              onChange={(event) => setDraft({ ...draft, cicloTipo: event.target.value })}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Regime</span>
            <select
              value={draft.regime}
              onChange={(event) =>
                setDraft({ ...draft, regime: event.target.value as CycleTemplate["regime"] })
              }
              className={inputClass}
            >
              <option value="irrigado">Irrigado</option>
              <option value="sequeiro">Sequeiro</option>
              <option value="ambos">Ambos</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Duração (dias)</span>
            <input
              type="number"
              value={draft.duracaoDias ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  duracaoDias: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.ativo}
              onChange={(event) => setDraft({ ...draft, ativo: event.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            Modelo ativo
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Tarefas padrão</h4>
            <button
              onClick={addItem}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
              Adicionar tarefa
            </button>
          </div>
          {draft.itens.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border border-border bg-background/60 p-2.5 sm:grid-cols-[2fr_1.2fr_repeat(3,1fr)_auto]"
            >
              <input
                value={item.titulo}
                onChange={(event) => setItem(item.id, { titulo: event.target.value })}
                placeholder="Título da tarefa"
                className={cn(inputClass, "h-8 text-xs")}
                aria-label="Título da tarefa padrão"
              />
              <select
                value={item.eventType}
                onChange={(event) =>
                  setItem(item.id, {
                    eventType: event.target.value as CycleTemplateItem["eventType"],
                  })
                }
                className={cn(inputClass, "h-8 text-xs")}
                aria-label="Tipo"
              >
                {calendarEventTypes.map((type) => (
                  <option key={type} value={type}>
                    {eventTypeLabels[type]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.offsetDias}
                onChange={(event) => setItem(item.id, { offsetDias: Number(event.target.value) })}
                className={cn(inputClass, "h-8 text-xs")}
                aria-label="Deslocamento em dias"
                title="Deslocamento em dias"
              />
              <select
                value={item.ancora}
                onChange={(event) =>
                  setItem(item.id, { ancora: event.target.value as CycleTemplateItem["ancora"] })
                }
                className={cn(inputClass, "h-8 text-xs")}
                aria-label="Âncora"
              >
                <option value="inicio">Do início</option>
                <option value="fim">Do fim previsto</option>
                <option value="anterior">Da tarefa anterior</option>
              </select>
              <select
                value={item.priority}
                onChange={(event) =>
                  setItem(item.id, {
                    priority: event.target.value as CycleTemplateItem["priority"],
                  })
                }
                className={cn(inputClass, "h-8 text-xs")}
                aria-label="Prioridade"
              >
                {calendarPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabels[priority]}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={item.obrigatorio}
                    onChange={(event) => setItem(item.id, { obrigatorio: event.target.checked })}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  obrig.
                </label>
                <button
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      itens: current.itens.filter((entry) => entry.id !== item.id),
                    }))
                  }
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                  aria-label="Remover tarefa padrão"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {!draft.itens.length && (
            <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Adicione as tarefas padrão do ciclo (ex.: dessecação −10d do início).
            </p>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-border px-3 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Salvar modelo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
