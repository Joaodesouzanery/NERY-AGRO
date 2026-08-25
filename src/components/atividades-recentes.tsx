import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { atividadesRecentes, type Atividade } from "@/lib/atividades-recentes";
import type { ConnectedAgroSnapshot } from "@/lib/connected-agro-data";
import { tempoRelativo } from "@/lib/tempo-relativo";
import { EmptyState } from "@/components/empty-state";
import { PanelBody, PanelHeader, PanelShell } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";

// "O que aconteceu na operação" — feed dos últimos registros criados ou
// atualizados, no esqueleto visual da Timeline do Talhão 360: ponto colorido
// por severidade, título, meta juntada por "·".
//
// Sem avatar de propósito: não existe dado de pessoa com foto no produto, e
// `payload.responsavel` é o sujeito do fato, não o autor da edição — pôr um
// rosto (ou iniciais) ali atribuiria a mexida à pessoa errada. O ponto de
// severidade já é a linguagem do repo para "o quanto isto pede atenção".

const PONTO: Record<Atividade["severidade"], string> = {
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-chart-2",
};

export function AtividadesRecentes({
  snapshot,
  limite = 10,
  onAtividade,
  className,
}: {
  snapshot: Pick<ConnectedAgroSnapshot, "operations" | "field" | "financial">;
  limite?: number;
  /** Clique no item — recebe o `recordId` para quem quiser abrir a ficha. */
  onAtividade?: (atividade: Atividade) => void;
  className?: string;
}) {
  const atividades = useMemo(() => atividadesRecentes(snapshot, limite), [snapshot, limite]);
  // Um relógio por render é suficiente: o snapshot já refaz a cada 15s.
  const agora = useMemo(() => new Date(), []);

  return (
    <PanelShell className={className}>
      <PanelHeader
        title="Atividade recente"
        description="Últimos registros criados ou atualizados, em todos os módulos"
      />
      <PanelBody>
        {atividades.length === 0 ? (
          <EmptyState
            title="Nenhuma atividade ainda"
            description="Os registros criados ou alterados aparecem aqui."
          />
        ) : (
          <div className="divide-y divide-border">
            {atividades.map((a) => {
              const Linha = onAtividade ? "button" : "div";
              return (
                <Linha
                  key={a.id}
                  type={onAtividade ? "button" : undefined}
                  onClick={onAtividade ? () => onAtividade(a) : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 py-2.5 text-left",
                    onAtividade && "transition-colors hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", PONTO[a.severidade])}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.titulo}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {a.area}/{a.module} · {a.acao === "criado" ? "criado" : "atualizado"} ·{" "}
                      {tempoRelativo(a.quandoISO, agora)}
                    </span>
                  </span>
                  {a.severidade === "danger" && (
                    <StatusPill tone="destructive" className="shrink-0">
                      atenção
                    </StatusPill>
                  )}
                </Linha>
              );
            })}
          </div>
        )}
      </PanelBody>
    </PanelShell>
  );
}
