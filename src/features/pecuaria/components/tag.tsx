import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "primary" | "success" | "danger" | "warning";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  danger: "bg-destructive/12 text-destructive",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

// Pill de status reutilizável, alinhado aos tokens do design (mesmos tons do
// StatKpi). Cantos levemente arredondados como o resto do sistema.
export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
