// Formulário canônico de tarefa/evento do Calendário (criar, editar, duplicar).
// Valida com zod (schemas/domain.ts) + regras estruturais: ciclo pertence ao
// talhão e safra segue o ciclo. Conclusão/cancelamento carimbam completed/cancelled.
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { calendarEventFormSchema } from "@/features/campo-calendar/schemas/domain";
import { applyStatusTransition } from "@/features/campo-calendar/lib/derive";
import {
  calendarPriorities,
  calendarVisibilities,
  calendarEventTypes,
  eventTypeLabels,
  priorityLabels,
  visibilityLabels,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarPriority,
  type CalendarVisibility,
} from "@/features/campo-calendar/types/domain";
import type { CalendarModel } from "@/features/campo-calendar/api/services";

export type EventFormResult = { id?: string; event: Omit<CalendarEvent, "id"> };

type FormState = {
  title: string;
  description: string;
  eventType: CalendarEventType;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  talhaoId: string;
  cycleId: string;
  statusId: string;
  priority: CalendarPriority;
  responsibleName: string;
  visibility: CalendarVisibility;
  estimatedCost: string;
  delayCost: string;
  notes: string;
  decisionOptionsText: string;
};

function stateFromEvent(event: CalendarEvent | null, defaultDate?: string): FormState {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    eventType: event?.eventType ?? "operacao",
    startsAt: event?.startsAt.slice(0, 10) ?? defaultDate ?? "",
    endsAt: event?.endsAt?.slice(0, 10) ?? "",
    allDay: event?.allDay ?? true,
    talhaoId: event?.talhaoId ?? "",
    cycleId: event?.cycleId ?? "",
    statusId: event?.statusId ?? "planejada",
    priority: event?.priority ?? "normal",
    responsibleName: event?.responsibleName ?? "",
    visibility: event?.visibility ?? "equipe",
    estimatedCost: event?.estimatedCost != null ? String(event.estimatedCost) : "",
    delayCost: event?.delayCost != null ? String(event.delayCost) : "",
    notes: event?.notes ?? "",
    decisionOptionsText: event?.decisionOptions?.join("\n") ?? "",
  };
}

export function EventFormDialog({
  open,
  onOpenChange,
  model,
  editing,
  duplicating,
  defaultDate,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: CalendarModel;
  /** Evento em edição (null = criação). */
  editing: CalendarEvent | null;
  /** true: salva como novo registro (duplicar). */
  duplicating?: boolean;
  defaultDate?: string;
  pending: boolean;
  onSubmit: (result: EventFormResult) => void;
}) {
  const [form, setForm] = useState<FormState>(() => stateFromEvent(editing, defaultDate));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(stateFromEvent(editing, defaultDate));
      setErrors({});
    }
  }, [open, editing, defaultDate]);

  const cyclesOfTalhao = useMemo(
    () => model.cycles.filter((cycle) => !form.talhaoId || cycle.talhaoId === form.talhaoId),
    [model.cycles, form.talhaoId],
  );
  const selectedCycle = model.cycles.find((cycle) => cycle.id === form.cycleId);
  const activeStatuses = model.statuses.filter(
    (status) => status.active || status.id === form.statusId,
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const decisionOptions = form.decisionOptionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const parsed = calendarEventFormSchema.safeParse({
      title: form.title,
      description: form.description || undefined,
      eventType: form.eventType,
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
      allDay: form.allDay,
      talhaoId: form.talhaoId || undefined,
      cycleId: form.cycleId || undefined,
      safra: selectedCycle?.safra,
      statusId: form.statusId,
      priority: form.priority,
      responsibleName: form.responsibleName || undefined,
      visibility: form.eventType === "decisao" ? "gestor" : form.visibility,
      source: editing && !duplicating ? editing.source : "manual",
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost.replace(",", ".")) : undefined,
      delayCost: form.delayCost ? Number(form.delayCost.replace(",", ".")) : undefined,
      notes: form.notes || undefined,
      decisionOptions: decisionOptions.length ? decisionOptions : undefined,
    });

    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
    }
    if (
      form.cycleId &&
      selectedCycle &&
      form.talhaoId &&
      selectedCycle.talhaoId !== form.talhaoId
    ) {
      nextErrors.cycleId = "O ciclo selecionado não pertence ao talhão escolhido.";
    }
    setErrors(nextErrors);
    if (!parsed.success || Object.keys(nextErrors).length) return;

    const talhao = model.talhoes.find((item) => item.id === form.talhaoId);
    const values = parsed.data;
    const base: Omit<CalendarEvent, "id"> = {
      ...(editing && !duplicating
        ? {
            source: editing.source,
            templateId: editing.templateId,
            relatedModule: editing.relatedModule,
            relatedRecordId: editing.relatedRecordId,
            decisionSelected: editing.decisionSelected,
            completedAt: editing.completedAt,
            cancelledAt: editing.cancelledAt,
            farmKey: editing.farmKey,
          }
        : { source: "manual" }),
      fazenda: talhao?.fazenda ?? editing?.fazenda,
      talhaoId: talhao?.id,
      talhaoName: talhao?.nome,
      safra: selectedCycle?.safra ?? editing?.safra,
      cycleId: selectedCycle?.id,
      cicloNome: selectedCycle?.nome,
      title: values.title,
      description: values.description,
      eventType: values.eventType,
      startsAt: values.startsAt,
      endsAt: values.endsAt || undefined,
      allDay: values.allDay,
      statusId: values.statusId,
      priority: values.priority,
      responsibleName: values.responsibleName,
      visibility: values.visibility,
      estimatedCost: Number.isFinite(values.estimatedCost) ? values.estimatedCost : undefined,
      delayCost: Number.isFinite(values.delayCost) ? values.delayCost : undefined,
      decisionOptions: values.decisionOptions,
      notes: values.notes,
    } as Omit<CalendarEvent, "id">;

    const event = applyStatusTransition(base, values.statusId, new Date().toISOString());
    onSubmit({ id: editing && !duplicating ? editing.id : undefined, event });
  };

  const inputClass =
    "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing && !duplicating
              ? "Editar tarefa"
              : duplicating
                ? "Duplicar tarefa"
                : "Nova tarefa"}
          </DialogTitle>
          <DialogDescription>
            Evento canônico do Calendário — Talhão 360, Operações e Financeiro referenciam este
            registro.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título *" error={errors.title} className="sm:col-span-2">
            <input
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              className={cn(inputClass, "w-full")}
              placeholder="Ex.: Pulverização pós-emergente no Talhão 03"
            />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </Field>
          <Field label="Tipo">
            <select
              value={form.eventType}
              onChange={(event) => set("eventType", event.target.value as CalendarEventType)}
              className={cn(inputClass, "w-full")}
            >
              {calendarEventTypes.map((type) => (
                <option key={type} value={type}>
                  {eventTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioridade">
            <select
              value={form.priority}
              onChange={(event) => set("priority", event.target.value as CalendarPriority)}
              className={cn(inputClass, "w-full")}
            >
              {calendarPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Início *" error={errors.startsAt}>
            <input
              type="date"
              value={form.startsAt}
              onChange={(event) => set("startsAt", event.target.value)}
              className={cn(inputClass, "w-full")}
            />
          </Field>
          <Field label="Fim" error={errors.endsAt}>
            <input
              type="date"
              value={form.endsAt}
              onChange={(event) => set("endsAt", event.target.value)}
              className={cn(inputClass, "w-full")}
            />
          </Field>
          <Field label="Talhão (opcional)">
            <select
              value={form.talhaoId}
              onChange={(event) => {
                set("talhaoId", event.target.value);
                set("cycleId", "");
              }}
              className={cn(inputClass, "w-full")}
            >
              <option value="">Fazenda toda</option>
              {model.talhoes.map((talhao) => (
                <option key={talhao.id} value={talhao.id}>
                  {talhao.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ciclo (opcional)" error={errors.cycleId}>
            <select
              value={form.cycleId}
              onChange={(event) => set("cycleId", event.target.value)}
              disabled={!form.talhaoId}
              className={cn(inputClass, "w-full disabled:opacity-50")}
            >
              <option value="">
                {form.talhaoId ? "Sem ciclo" : "Selecione um talhão primeiro"}
              </option>
              {cyclesOfTalhao.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.nome} · {cycle.safra}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Responsável (opcional)">
            <input
              value={form.responsibleName}
              onChange={(event) => set("responsibleName", event.target.value)}
              list="calendar-responsaveis"
              className={cn(inputClass, "w-full")}
            />
            <datalist id="calendar-responsaveis">
              {model.responsaveis.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Status" error={errors.statusId}>
            <select
              value={form.statusId}
              onChange={(event) => set("statusId", event.target.value)}
              className={cn(inputClass, "w-full")}
            >
              {activeStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Custo estimado (R$)" error={errors.estimatedCost}>
            <input
              type="number"
              min={0}
              value={form.estimatedCost}
              onChange={(event) => set("estimatedCost", event.target.value)}
              className={cn(inputClass, "w-full")}
            />
          </Field>
          <Field label="Custo do atraso (R$)" error={errors.delayCost}>
            <input
              type="number"
              min={0}
              value={form.delayCost}
              onChange={(event) => set("delayCost", event.target.value)}
              className={cn(inputClass, "w-full")}
            />
          </Field>
          {form.eventType !== "decisao" && (
            <Field label="Visibilidade">
              <select
                value={form.visibility}
                onChange={(event) => set("visibility", event.target.value as CalendarVisibility)}
                className={cn(inputClass, "w-full")}
              >
                {calendarVisibilities.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibilityLabels[visibility]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(event) => set("allDay", event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Dia inteiro
          </label>
          {form.eventType === "decisao" && (
            <Field
              label="Opções da decisão (uma por linha)"
              className="sm:col-span-2"
              hint="Decisões são visíveis apenas para o gestor (modo demonstrativo)."
            >
              <textarea
                value={form.decisionOptionsText}
                onChange={(event) => set("decisionOptionsText", event.target.value)}
                className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                placeholder={"Opção A\nOpção B"}
              />
            </Field>
          )}
          <Field label="Observações" className="sm:col-span-2">
            <textarea
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
              className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </Field>
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
            Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
