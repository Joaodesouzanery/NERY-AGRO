// Status personalizados: criar, renomear, ordenar e inativar. Ids internos dos
// status padrão nunca mudam (regras de atraso/conclusão dependem deles); status
// em uso só é inativado após remapear as tarefas para outro status.
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarStatus } from "@/features/campo-calendar/types/domain";

export function StatusManagerDialog({
  open,
  onOpenChange,
  statuses,
  events,
  pending,
  onSave,
  onRemap,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: CalendarStatus[];
  events: CalendarEvent[];
  pending: boolean;
  onSave: (status: CalendarStatus) => void;
  onRemap: (input: { events: CalendarEvent[]; toStatusId: string; then: CalendarStatus }) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [remapTarget, setRemapTarget] = useState<Record<string, string>>({});

  const usage = (statusId: string) => events.filter((event) => event.statusId === statusId).length;
  const slugify = (value: string) =>
    value
      .trim()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const addStatus = () => {
    const label = newLabel.trim();
    if (!label) return toast.error("Informe o nome do status.");
    const id = `custom-${slugify(label)}`;
    if (statuses.some((status) => status.id === id)) {
      return toast.error("Já existe um status com esse nome.");
    }
    onSave({ id, label, order: statuses.length, active: true, custom: true });
    setNewLabel("");
  };

  const move = (status: CalendarStatus, direction: -1 | 1) => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item.id === status.id);
    const swap = sorted[index + direction];
    if (!swap) return;
    onSave({ ...status, order: swap.order });
    onSave({ ...swap, order: status.order });
  };

  const deactivate = (status: CalendarStatus) => {
    const inUse = usage(status.id);
    if (inUse > 0) {
      const target = remapTarget[status.id];
      if (!target) {
        return toast.error(
          `${inUse} tarefa(s) usam "${status.label}". Escolha o status de destino para remapear.`,
        );
      }
      onRemap({
        events: events.filter((event) => event.statusId === status.id),
        toStatusId: target,
        then: { ...status, active: false },
      });
      return;
    }
    onSave({ ...status, active: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Status das tarefas</DialogTitle>
          <DialogDescription>
            Personalize rótulos e ordem. Os identificadores internos dos status padrão são
            preservados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {[...statuses]
            .sort((a, b) => a.order - b.order)
            .map((status) => {
              const inUse = usage(status.id);
              return (
                <div
                  key={status.id}
                  className={cn(
                    "rounded-lg border border-border bg-background/60 p-3",
                    !status.active && "opacity-60",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      defaultValue={status.label}
                      onBlur={(event) => {
                        const label = event.target.value.trim();
                        if (label && label !== status.label) onSave({ ...status, label });
                      }}
                      className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
                      aria-label={`Rótulo do status ${status.label}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {status.custom ? "personalizado" : `padrão · ${status.id}`} · {inUse} em uso
                    </span>
                    <button
                      onClick={() => move(status, -1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label="Subir"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => move(status, 1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label="Descer"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    {status.active ? (
                      status.custom && (
                        <button
                          onClick={() => deactivate(status)}
                          disabled={pending}
                          className="h-7 rounded-md border border-border px-2 text-xs text-destructive hover:bg-muted disabled:opacity-50"
                        >
                          Inativar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onSave({ ...status, active: true })}
                        disabled={pending}
                        className="h-7 rounded-md border border-border px-2 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                  {status.custom && status.active && inUse > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      Remapear para:
                      <select
                        value={remapTarget[status.id] ?? ""}
                        onChange={(event) =>
                          setRemapTarget((current) => ({
                            ...current,
                            [status.id]: event.target.value,
                          }))
                        }
                        className="h-7 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="">Selecione</option>
                        {statuses
                          .filter((item) => item.id !== status.id && item.active)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Novo status (ex.: Aguardando insumo)"
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
          />
          <button
            onClick={addStatus}
            disabled={pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
