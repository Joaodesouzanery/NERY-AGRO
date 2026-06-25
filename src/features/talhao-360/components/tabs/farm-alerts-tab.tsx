import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CircleHelp, Info, Lightbulb } from "lucide-react";
import type { FieldRecord } from "@/lib/supabase-field";
import { buildTalhao360Model } from "@/features/talhao-360/api/services";
import type { FieldAlert, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { cn } from "@/lib/utils";

type FarmAlert = FieldAlert & { fieldId: string; fieldName: string };

const order: FieldAlert["severity"][] = ["Crítico", "Atenção", "Recomendação", "Informativo"];

export function FarmAlertsTab({
  talhoes,
  records,
}: {
  talhoes: TalhaoRecord[];
  records: FieldRecord[];
}) {
  const [filter, setFilter] = useState("Todos");

  const alerts = useMemo(() => {
    const all: FarmAlert[] = [];
    for (const talhao of talhoes) {
      const model = buildTalhao360Model(records, talhao.id);
      if (!model) continue;
      for (const alert of model.alerts) {
        if (["Resolvido", "Ignorado"].includes(alert.status)) continue;
        all.push({ ...alert, fieldId: talhao.id, fieldName: talhao.payload.talhao });
      }
    }
    return all.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  }, [records, talhoes]);

  const filtered = alerts.filter((alert) => filter === "Todos" || alert.severity === filter);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Alertas da fazenda</h2>
        <div className="mt-4 space-y-2">
          {["Todos", ...order].map((value) => (
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
              key={`${alert.fieldId}-${alert.id}`}
              className={cn("rounded-xl border bg-card p-5", severityClass[alert.severity])}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide">
                        {alert.severity} · {alert.fieldName}
                      </div>
                      <h3 className="mt-1 font-semibold">{alert.title}</h3>
                    </div>
                    <Link
                      to="/campo/talhoes/$fieldId"
                      params={{ fieldId: alert.fieldId }}
                      search={{ tab: "alerts" }}
                      className="inline-flex h-9 shrink-0 items-center rounded-lg border px-3 text-xs font-medium hover:bg-background/60"
                    >
                      Abrir talhão
                    </Link>
                  </div>
                  <p className="mt-3 text-sm">{alert.description}</p>
                  {alert.recommendation && (
                    <p className="mt-2 text-sm opacity-80">
                      <span className="font-medium">Recomendação:</span> {alert.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {!filtered.length && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nenhum alerta ativo para este filtro.
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
  Informativo: "border-blue-500/30 bg-blue-500/5",
  Recomendação: "border-emerald-500/30 bg-emerald-500/5",
};
