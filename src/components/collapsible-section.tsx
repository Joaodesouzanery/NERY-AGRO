import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Seção recolhível do redesenho: trigger 11/600 uppercase + chevron rotativo,
// contagem opcional ("Mais filtros (3)"). Guarda o secundário da tela sem
// removê-lo — fechada por padrão, a menos que `defaultOpen`.
export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  /** Contagem exibida entre parênteses ao lado do título (ex.: filtros ativos). */
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("rounded-md border border-border bg-card", className)}
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
          {typeof count === "number" && count > 0 && ` (${count})`}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border p-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}
