import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BarTone = "neutral" | "success" | "warning" | "destructive";

const FILL: Record<BarTone, string> = {
  neutral: "bg-chart-2",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const VALUE: Record<BarTone, string> = {
  neutral: "",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export type BarListItem = {
  label: ReactNode;
  /** Comprimento da barra, 0–100. */
  pct: number;
  value: ReactNode;
  /** Cor da barra/valor só quando o dado é semáforo (lucro/prejuízo, conformidade). */
  tone?: BarTone;
  /** Tinge também o valor à direita (cor ali é dado, não decoração). */
  colorValue?: boolean;
};

// BarList: linhas [label | trilho | valor tabular]. Fill neutro (chart-2) por
// padrão; estado só quando o dado é semáforo.
export function BarList({
  items,
  className,
  labelClassName,
}: {
  items: BarListItem[];
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, index) => {
        const tone = item.tone ?? "neutral";
        return (
          <div
            key={index}
            className="grid grid-cols-[minmax(96px,160px)_minmax(0,1fr)_auto] items-center gap-3.5 text-sm"
          >
            <span className={cn("truncate", labelClassName)}>{item.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", FILL[tone])}
                style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
              />
            </span>
            <span
              className={cn(
                "text-right text-sm font-semibold tabular-nums",
                item.colorValue && VALUE[tone],
              )}
            >
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
