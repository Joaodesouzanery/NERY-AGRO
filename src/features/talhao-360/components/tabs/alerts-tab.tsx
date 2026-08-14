import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateAlert } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { FieldAlert } from "@/features/talhao-360/types/domain";
import { AlertRow, type AlertRowTone } from "@/components/alert-row";
import { KpiCard } from "@/components/kpi-card";
import { SectionLabel } from "@/components/section-label";
import { StatusPill, type StatusPillTone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { useMutacaoReal } from "@/hooks/use-mutacao-real";

const SEVERITIES: FieldAlert["severity"][] = ["Crítico", "Atenção", "Informativo", "Recomendação"];

const TONE: Record<FieldAlert["severity"], AlertRowTone> = {
  Crítico: "destructive",
  Atenção: "warning",
  Informativo: "info",
  Recomendação: "info",
};

const PILL: Record<FieldAlert["severity"], StatusPillTone> = {
  Crítico: "destructive",
  Atenção: "warning",
  Informativo: "muted",
  Recomendação: "muted",
};

/** "vencido" | "hoje" | "N dias" a partir do prazo do alerta. */
function prazoLabel(dueOn: string): string {
  const dias = Math.round(
    (new Date(`${dueOn}T12:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  if (dias < 0) return "vencido";
  if (dias === 0) return "hoje";
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function AlertsTab({ alerts, demoMode }: { alerts: FieldAlert[]; demoMode: boolean }) {
  const queryClient = useQueryClient();
  const mutation = useMutacaoReal({
    mutationFn: ({ alert, status }: { alert: FieldAlert; status: FieldAlert["status"] }) =>
      updateAlert(alert.id, { ...alert, status }),
    onSuccess: async () => {
      toast.success("Alerta atualizado.");
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
    },
    onError: (error) => toast.error(error.message),
  });
  const act = (alert: FieldAlert, status: FieldAlert["status"]) => {
    if (demoMode) return toast.info("Desative o modo DEMO para alterar alertas.");
    if (status === "Ignorado" && !window.confirm(`Ignorar o alerta "${alert.title}"?`)) return;
    mutation.mutate({ alert, status });
  };

  const abertos = alerts.filter((a) => a.status === "Aberto" || a.status === "Em análise");
  const encerrados = alerts.length - abertos.length;
  const count = (severity: FieldAlert["severity"]) =>
    abertos.filter((a) => a.severity === severity).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Crítico"
          value={count("Crítico")}
          state={count("Crítico") > 0 ? "destructive" : undefined}
        />
        <KpiCard
          label="Atenção"
          value={count("Atenção")}
          state={count("Atenção") > 0 ? "warning" : undefined}
        />
        <KpiCard label="Informativo" value={count("Informativo")} />
        <KpiCard label="Recomendação" value={count("Recomendação")} />
      </div>

      {SEVERITIES.map((severity) => {
        const grupo = abertos.filter((a) => a.severity === severity);
        if (!grupo.length) return null;
        return (
          <div key={severity} className="flex flex-col gap-2">
            <SectionLabel className="mt-1">{severity}</SectionLabel>
            {grupo.map((alert) => (
              <AlertRow
                key={alert.id}
                tone={TONE[alert.severity]}
                title={alert.title}
                support={
                  [
                    alert.description,
                    alert.probableCause && `Causa provável: ${alert.probableCause}.`,
                    alert.expectedImpact && `Impacto: ${alert.expectedImpact}.`,
                    alert.recommendation && `Recomendação: ${alert.recommendation}.`,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                actions={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => act(alert, "Em análise")}
                    >
                      Registrar ação
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => act(alert, "Resolvido")}
                    >
                      Resolver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => act(alert, "Ignorado")}
                    >
                      Ignorar
                    </Button>
                  </>
                }
                aside={
                  <StatusPill tone={PILL[alert.severity]}>
                    {alert.dueOn
                      ? prazoLabel(alert.dueOn)
                      : alert.status === "Em análise"
                        ? "em análise"
                        : severity.toLowerCase()}
                  </StatusPill>
                }
              />
            ))}
          </div>
        );
      })}

      {!abertos.length && (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum alerta aberto para este talhão.
        </div>
      )}
      {encerrados > 0 && (
        <p className="text-xs text-muted-foreground">
          {encerrados}{" "}
          {encerrados === 1 ? "alerta resolvido ou ignorado" : "alertas resolvidos ou ignorados"}{" "}
          nesta safra.
        </p>
      )}
    </div>
  );
}
