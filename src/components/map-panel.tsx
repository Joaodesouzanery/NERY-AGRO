import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MapLegendItem = {
  /** Cor CSS do ponto (token ou hex vindo do dado, ex.: faixa de lotação). */
  color: string;
  label: string;
};

// Container de mapa do redesenho: borda + radius 3, chip de camada no topo e
// legenda flutuante na base. O conteúdo (MapLibre/SVG) preenche o painel.
export function MapPanel({
  chip,
  legend,
  children,
  className,
}: {
  chip?: ReactNode;
  legend?: MapLegendItem[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md border border-border", className)}
      style={{ background: "oklch(0.235 0.006 250)" }}
    >
      {children}
      {chip && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-border bg-background/85 px-2.5 py-1.5 text-xs font-medium">
          {chip}
        </div>
      )}
      {legend && legend.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-background/80 px-3 py-2 text-xs text-muted-foreground">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
