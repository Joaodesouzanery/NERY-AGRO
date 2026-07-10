import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Rótulo de seção 11/600 uppercase — separa grupos dentro de uma tela
// ("Precisa de ação", "Crítico") no lugar de mais cards aninhados.
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
