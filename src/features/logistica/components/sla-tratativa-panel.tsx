import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useMutacaoReal } from "@/hooks/use-mutacao-real";
import { cn } from "@/lib/utils";
import { type SlaCarga } from "@/lib/logistica-metrics";
import { updateOperationPayload, type OperationRecord } from "@/lib/supabase-operations";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";

// Registrar o que aconteceu com uma carga atrasada.
//
// Sem isto, a mesma carga reaparecia na lista todo dia, sem explicação, até
// alguém editar o status na mão — e a informação de POR QUE atrasou nunca era
// registrada em lugar nenhum. Um painel de atrasos que não guarda a causa não
// serve para melhorar nada.
//
// A tratativa não faz a carga sumir para sempre: se o nível piorar (em risco →
// fora do prazo) ou a ETA for remarcada, ela volta. Quem decide isso é
// `slaCargas`, na comparação de `sla_tratado_nivel`/`sla_tratado_eta`.

const MOTIVOS = [
  "Trânsito ou estrada",
  "Carregamento atrasado",
  "Cliente não recebeu",
  "Quebra de veículo",
  "Documentação",
  "Outro",
];

const CORES: Record<SlaCarga["nivel"], string> = {
  estourado: "border-destructive/40 bg-destructive/10 text-destructive",
  em_risco: "border-warning/40 bg-warning/10 text-warning",
  ok: "border-border bg-muted/40 text-muted-foreground",
};

const FONTE_PRAZO: Record<SlaCarga["fonte"], string> = {
  eta: "ETA informada no cadastro",
  rota: "prazo da rota cadastrada",
  padrao: "prazo padrão da empresa",
  status: "status do registro",
};

export function SlaTratativaPanel({
  registro,
  sla,
  onSalvo,
}: {
  registro: OperationRecord;
  sla: SlaCarga;
  onSalvo?: () => void;
}) {
  const queryClient = useQueryClient();
  const jaTratada = Boolean(registro.payload.sla_tratado_em);
  const [motivo, setMotivo] = useState(registro.payload.sla_motivo ?? "");
  const [observacao, setObservacao] = useState(registro.payload.sla_observacao ?? "");

  const salvar = useMutacaoReal({
    acaoDemo: "registrar a tratativa",
    mutationFn: (patch: Record<string, string>) => updateOperationPayload(registro, patch),
    onSuccess: () => {
      toast.success("Tratativa registrada.");
      void queryClient.invalidateQueries({ queryKey: ["operation-records"] });
      invalidateConnectedQueries(queryClient);
      onSalvo?.();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const marcar = () => {
    if (!motivo) return toast.error("Escolha o motivo do atraso.");
    salvar.mutate({
      sla_motivo: motivo,
      sla_observacao: observacao,
      sla_tratado_em: new Date().toISOString(),
      // O nível e a ETA do momento da tratativa: é o que permite reabrir
      // quando a situação piorar.
      sla_tratado_nivel: sla.nivel,
      sla_tratado_eta: registro.payload.eta?.trim() ?? "",
    });
  };

  const reabrir = () =>
    salvar.mutate({ sla_tratado_em: "", sla_tratado_nivel: "", sla_tratado_eta: "" });

  const Icone =
    sla.nivel === "estourado" ? AlertTriangle : sla.nivel === "em_risco" ? Clock : CheckCircle2;

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
          CORES[sla.nivel],
        )}
      >
        <Icone className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">{sla.motivo}</p>
          {/* De onde veio o prazo. Sem isto, "por que está vermelho?" não tem
              resposta na tela — e o prazo pode vir de três lugares. */}
          <p className="mt-0.5 text-xs opacity-80">Prazo por {FONTE_PRAZO[sla.fonte]}.</p>
        </div>
      </div>

      {jaTratada ? (
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Atraso já registrado: <strong>{registro.payload.sla_motivo || "—"}</strong>
            {registro.payload.sla_observacao ? ` · ${registro.payload.sla_observacao}` : ""}
          </p>
          <button
            type="button"
            onClick={reabrir}
            disabled={salvar.isPending}
            className="h-9 rounded-lg border border-border px-3 text-sm transition hover:bg-accent disabled:opacity-60"
          >
            Reabrir
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Motivo do atraso</span>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">—</option>
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Observação (opcional)</span>
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <button
            type="button"
            onClick={marcar}
            disabled={salvar.isPending}
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Marcar como tratada
          </button>
        </div>
      )}
    </div>
  );
}
