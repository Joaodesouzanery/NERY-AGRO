import { useDemoMode } from "@/hooks/use-demo-mode";
import { cn } from "@/lib/utils";

// Selo consistente DEMO/REAL. Deixa claro ao usuário se está vendo dados
// demonstrativos ou reais — o mesmo padrão usado no RDC e no Calendário.
export function DemoBadge({ className }: { className?: string } = {}) {
  const { demoMode } = useDemoMode();
  return (
    <span
      className={cn(
        "rounded-md border px-3 py-1 text-xs font-medium",
        demoMode
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-border text-muted-foreground",
        className,
      )}
    >
      {demoMode ? "DEMO" : "REAL"}
    </span>
  );
}
