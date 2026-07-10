import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusPillTone = "success" | "warning" | "destructive" | "muted";

const TONES: Record<StatusPillTone, string> = {
  success: "border-success/35 bg-success/15 text-success",
  warning: "border-warning/35 bg-warning/15 text-warning",
  destructive: "border-destructive/35 bg-destructive/15 text-destructive",
  muted: "border-transparent bg-muted text-muted-foreground",
};

// Pill de status do redesenho: redonda, com ponto em currentColor. Cor é
// reservada a ESTADO — filtros usam Badge/Segmented, nunca esta pill.
export function StatusPill({
  tone = "muted",
  children,
  className,
}: {
  tone?: StatusPillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-fit w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}
