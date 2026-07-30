import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StatKpiProps = {
  label: string;
  value: ReactNode;
  /** Texto de tendência, ex.: "+8%". Opcional: só `trendDir` já mostra a seta. */
  trend?: string;
  /** Direção do sinal. Presente = mostra a pílula, mesmo sem texto. */
  trendDir?: "up" | "down" | "neutral";
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

// Card de KPI: label discreto, valor grande, pílula de tendência com seta
// (verde p/ cima, vermelho p/ baixo).
//
// A pílula aparece quando há `trend` OU `trendDir`. Antes exigia o texto, e
// `trendDir` sozinho era silenciosamente ignorado — em ~45 KPIs que declaravam
// "isto está bom/ruim" e não mostravam nada. Ninguém escreve trendDir esperando
// que nada aconteça.
export function StatKpi({
  label,
  value,
  trend,
  trendDir,
  hint,
  icon: Icon,
  className,
}: StatKpiProps) {
  const dir = trendDir ?? "up";
  const TrendIcon = dir === "down" ? TrendingDown : TrendingUp;
  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {(trend || trendDir) && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
              dir === "up" && "bg-success/12 text-success",
              dir === "down" && "bg-destructive/12 text-destructive",
              dir === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {dir !== "neutral" && <TrendIcon className="h-3.5 w-3.5" />}
            {trend}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
