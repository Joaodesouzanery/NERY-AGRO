import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertRowTone = "destructive" | "warning" | "info";

const BAR: Record<AlertRowTone, string> = {
  destructive: "bg-destructive",
  warning: "bg-warning",
  info: "bg-chart-2",
};

// Linha de alerta/agenda: barra de severidade 3px, título 14/500, suporte 12
// muted, ações inline (Button sm) e pill de prazo à direita.
export function AlertRow({
  tone,
  title,
  support,
  actions,
  aside,
  className,
}: {
  tone: AlertRowTone;
  title: ReactNode;
  support?: ReactNode;
  /** Botões de ação inline (`Button size="sm"`). */
  actions?: ReactNode;
  /** Pill de prazo/status à direita. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-border bg-background px-3.5 py-3",
        className,
      )}
    >
      <span className={cn("w-[3px] self-stretch rounded-[2px]", BAR[tone])} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug tracking-[-0.01em]">{title}</div>
        {support && (
          <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{support}</div>
        )}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {aside}
    </div>
  );
}
