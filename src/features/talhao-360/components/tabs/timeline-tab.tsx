import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTimelineEvent } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoRecord, TimelineEvent } from "@/features/talhao-360/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function TimelineTab({
  talhao,
  events,
  demoMode,
}: {
  talhao: TalhaoRecord;
  events: TimelineEvent[];
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("Todos");
  const [origin, setOrigin] = useState("Todas");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (type === "Todos" || event.type === type) &&
          (origin === "Todas" || event.origin === origin),
      ),
    [events, origin, type],
  );
  const mutation = useMutation({
    mutationFn: (event: Omit<TimelineEvent, "id">) => createTimelineEvent(talhao, event),
    onSuccess: async () => {
      toast.success("Evento registrado.");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Timeline de eventos</h2>
          <p className="text-sm text-muted-foreground">
            Histórico operacional, agronômico e decisório.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Registrar evento
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Select
          value={type}
          onChange={setType}
          options={["Todos", ...new Set(events.map((event) => event.type))]}
        />
        <Select value={origin} onChange={setOrigin} options={["Todas", "Manual", "Automática"]} />
      </div>
      <div className="relative mt-6 space-y-0 before:absolute before:bottom-0 before:left-[7px] before:top-0 before:w-px before:bg-border">
        {filtered.map((event) => (
          <article key={event.id} className="relative grid grid-cols-[16px_1fr] gap-4 pb-6">
            <span
              className={cn(
                "relative z-10 mt-1 h-4 w-4 rounded-full border-4 border-card bg-primary",
                event.critical && "bg-destructive",
              )}
            />
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{event.type}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{date(event.date)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{event.responsible || "Sem responsável"}</span>
                <span>·</span>
                <span>{event.season || "Sem safra"}</span>
                <span>·</span>
                <span>{event.origin}</span>
                {event.impact && (
                  <>
                    <span>·</span>
                    <span>{event.impact}</span>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
        {!filtered.length && (
          <p className="pl-8 text-sm text-muted-foreground">
            Nenhum evento para os filtros atuais.
          </p>
        )}
      </div>
      <EventDialog
        open={open}
        onOpenChange={setOpen}
        disabled={demoMode}
        onSave={(event) => mutation.mutate(event)}
      />
    </div>
  );
}

function EventDialog({
  open,
  onOpenChange,
  disabled,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  onSave: (event: Omit<TimelineEvent, "id">) => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "Observação manual",
    description: "",
    responsible: "",
    season: "",
    cycle: "",
    origin: "Manual" as const,
    impact: "",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar evento</DialogTitle>
          <DialogDescription>Adicione uma ocorrência à timeline do talhão.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["date", "Data", "date"],
            ["type", "Tipo", "text"],
            ["responsible", "Responsável", "text"],
            ["season", "Safra", "text"],
            ["cycle", "Ciclo", "text"],
            ["impact", "Impacto", "text"],
          ].map(([key, label, inputType]) => (
            <label key={key} className="grid gap-1.5 text-sm">
              {label}
              <input
                type={inputType}
                value={form[key as keyof typeof form]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                className="h-10 rounded-lg border border-border bg-background px-3"
              />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Descrição
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-24 rounded-lg border border-border bg-background p-3"
            />
          </label>
        </div>
        <DialogFooter>
          <button className="h-9 rounded-lg border px-3" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            className="h-9 rounded-lg bg-primary px-3 text-primary-foreground"
            onClick={() => {
              if (disabled) return toast.info("Desative o modo DEMO para registrar eventos.");
              if (!form.description) return toast.error("Informe uma descrição.");
              onSave(form);
            }}
          >
            Salvar evento
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Iterable<string>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
    >
      {Array.from(options).map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function date(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
