import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KpiState = "success" | "warning" | "destructive";

const STATE_BORDER: Record<KpiState, string> = {
  success: "border-success/40",
  warning: "border-warning/35",
  destructive: "border-destructive/40",
};

// KpiCard do redesenho: label 11/600 uppercase → valor 28/700 Space Grotesk
// tabular (herói: 30) → delta/apoio opcional. O número é SEMPRE neutro
// (foreground); urgência tinge só a borda via `state`, cor de dado vai no delta.
export function KpiCard({
  label,
  value,
  unit,
  delta,
  support,
  state,
  hero,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Unidade pequena ao lado do número (ex.: "ha", "sc/ha"). */
  unit?: string;
  /** Linha de delta 12/600 — única cor permitida; componha os spans no caller. */
  delta?: ReactNode;
  /** Apoio 12 muted sem cor (alternativa ao delta). */
  support?: string;
  state?: KpiState;
  hero?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-5",
        state && STATE_BORDER[state],
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-heading mt-2 font-bold leading-none tabular-nums",
          hero ? "text-3xl" : "text-[28px]",
        )}
      >
        {value}
        {unit && (
          <span className="font-display text-sm font-medium tracking-normal text-muted-foreground">
            {" "}
            {unit}
          </span>
        )}
      </div>
      {delta && <div className="mt-2 text-xs font-semibold">{delta}</div>}
      {support && <div className="mt-2 text-xs text-muted-foreground">{support}</div>}
    </div>
  );
}
