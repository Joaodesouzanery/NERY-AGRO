import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StatKpiProps = {
  label: string;
  value: ReactNode;
  /** Texto de tendência, ex.: "+8%". A seta/cor seguem `trendDir`. */
  trend?: string;
  trendDir?: "up" | "down" | "neutral";
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

// Card de KPI no estilo da imagem 2: label discreto, valor grande, pill de
// tendência com seta (verde p/ cima, vermelho p/ baixo).
export function StatKpi({
  label,
  value,
  trend,
  trendDir = "up",
  hint,
  icon: Icon,
  className,
}: StatKpiProps) {
  const TrendIcon = trendDir === "down" ? TrendingDown : TrendingUp;
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
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
              trendDir === "up" && "bg-success/12 text-success",
              trendDir === "down" && "bg-destructive/12 text-destructive",
              trendDir === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {trendDir !== "neutral" && <TrendIcon className="h-3.5 w-3.5" />}
            {trend}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
