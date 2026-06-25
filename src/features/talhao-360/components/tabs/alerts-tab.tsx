import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CircleHelp, Info, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { updateAlert } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { FieldAlert } from "@/features/talhao-360/types/domain";
import { cn } from "@/lib/utils";

export function AlertsTab({ alerts, demoMode }: { alerts: FieldAlert[]; demoMode: boolean }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("Todos");
  const mutation = useMutation({
    mutationFn: ({ alert, status }: { alert: FieldAlert; status: FieldAlert["status"] }) =>
      updateAlert(alert.id, { ...alert, status }),
    onSuccess: async () => {
      toast.success("Alerta atualizado.");
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
    },
    onError: (error) => toast.error(error.message),
  });
  const filtered = alerts.filter((alert) => filter === "Todos" || alert.severity === filter);
  const act = (alert: FieldAlert, status: FieldAlert["status"]) => {
    if (demoMode) return toast.info("Desative o modo DEMO para alterar alertas.");
    mutation.mutate({ alert, status });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Alertas</h2>
        <div className="mt-4 space-y-2">
          {["Todos", "Crítico", "Atenção", "Informativo", "Recomendação"].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                filter === value ? "bg-primary/10 text-primary" : "hover:bg-muted",
              )}
            >
              {value}
              <span>
                {value === "Todos"
                  ? alerts.length
                  : alerts.filter((alert) => alert.severity === value).length}
              </span>
            </button>
          ))}
        </div>
      </aside>
      <section className="space-y-3">
        {filtered.map((alert) => {
          const Icon = severityIcon[alert.severity];
          return (
            <article
              key={alert.id}
              className={cn("rounded-xl border bg-card p-5", severityClass[alert.severity])}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide">
                        {alert.severity}
                      </div>
                      <h3 className="mt-1 font-semibold">{alert.title}</h3>
                    </div>
                    <span className="rounded-full bg-background/70 px-2 py-1 text-xs">
                      {alert.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm">{alert.description}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Detail label="Causa provável" value={alert.probableCause} />
                    <Detail label="Impacto esperado" value={alert.expectedImpact} />
                    <Detail label="Recomendação" value={alert.recommendation} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => act(alert, "Resolvido")}
                      className="h-9 rounded-lg border px-3 text-sm"
                    >
                      Marcar resolvido
                    </button>
                    <button
                      onClick={() => act(alert, "Em análise")}
                      className="h-9 rounded-lg border px-3 text-sm"
                    >
                      Registrar ação
                    </button>
                    <button
                      onClick={() => act(alert, "Ignorado")}
                      className="h-9 rounded-lg border px-3 text-sm"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!filtered.length && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nenhum alerta para este filtro.
          </div>
        )}
      </section>
    </div>
  );
}

const severityIcon = {
  Crítico: AlertTriangle,
  Atenção: CircleHelp,
  Informativo: Info,
  Recomendação: Lightbulb,
};
const severityClass = {
  Crítico: "border-destructive/30 bg-destructive/5 text-destructive",
  Atenção: "border-warning/30 bg-warning/5",
  Informativo: "border-border bg-muted/40 text-muted-foreground",
  Recomendação: "border-success/30 bg-success/5 text-success",
};

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-current/10 bg-background/60 p-3">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 text-sm">{value || "—"}</div>
    </div>
  );
}
