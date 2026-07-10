import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTimelineEvent } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoRecord, TimelineEvent } from "@/features/talhao-360/types/domain";
import { SectionLabel } from "@/components/section-label";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
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
  const meses = useMemo(() => groupByMonth(filtered), [filtered]);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterBadge active={type === "Todos"} onClick={() => setType("Todos")}>
            Todos os tipos
          </FilterBadge>
          {[...new Set(events.map((event) => event.type))].map((value) => (
            <FilterBadge key={value} active={type === value} onClick={() => setType(value)}>
              {value}
            </FilterBadge>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {["Todas", "Manual", "Automática"].map((value) => (
            <FilterBadge key={value} active={origin === value} onClick={() => setOrigin(value)}>
              {value === "Todas" ? "Todas as origens" : value}
            </FilterBadge>
          ))}
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Evento
        </Button>
      </div>

      {meses.map(({ label, items }) => (
        <div key={label} className="flex flex-col gap-2">
          <SectionLabel className="mt-1">{label}</SectionLabel>
          <div className="rounded-md border border-border bg-card p-5">
            <div className="divide-y divide-border">
              {items.map((event) => (
                <article
                  key={event.id}
                  className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      event.critical ? "bg-destructive" : "bg-chart-2",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-snug tracking-[-0.01em]">
                      {event.type}
                      {event.description && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          — {event.description}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        event.origin,
                        event.responsible || null,
                        date(event.date),
                        event.impact || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  {event.critical && <StatusPill tone="destructive">crítico</StatusPill>}
                </article>
              ))}
            </div>
          </div>
        </div>
      ))}
      {!filtered.length && (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum evento para os filtros atuais.
        </div>
      )}

      <EventDialog
        open={open}
        onOpenChange={setOpen}
        disabled={demoMode}
        onSave={(event) => mutation.mutate(event)}
      />
    </div>
  );
}

/** Badge de filtro (3 px): ativa = secondary, inativa = outline. */
function FilterBadge({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        active
          ? "border-transparent bg-secondary text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Agrupa eventos por mês (mais recentes primeiro). */
function groupByMonth(events: TimelineEvent[]) {
  const grupos = new Map<string, TimelineEvent[]>();
  for (const event of [...events].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = event.date.slice(0, 7);
    grupos.set(key, [...(grupos.get(key) ?? []), event]);
  }
  return [...grupos.entries()].map(([key, items]) => {
    const nome = new Date(`${key}-15T12:00:00`).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return { label: nome.charAt(0).toUpperCase() + nome.slice(1), items };
  });
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
            <label key={key} className="grid gap-1.5 text-sm font-medium">
              {label}
              <input
                type={inputType}
                value={form[key as keyof typeof form]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                className="h-9 rounded-md border border-input bg-background px-3 font-normal"
              />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Descrição
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-24 rounded-md border border-input bg-background p-3 font-normal"
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (disabled) return toast.info("Desative o modo DEMO para registrar eventos.");
              if (!form.description) return toast.error("Informe uma descrição.");
              onSave(form);
            }}
          >
            Salvar evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function date(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
