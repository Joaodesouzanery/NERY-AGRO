import type { ReactNode } from "react";
import { StatKpi } from "@/components/stat-kpi";
import { chartColors } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

// Base reutilizável de "aba rica": uma faixa de KPIs + painéis de domínio
// (gráfico/mapa/lista/calendário). Substitui as abas genéricas idênticas
// (ModuleTab + DataTable) por algo único e útil em cada módulo, reusando o
// CRUD existente por baixo. Ver docs/modules-rich-tabs-blueprint.md.

export type RichKpi = {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  trend?: string;
  trendDir?: "up" | "down" | "neutral";
};

/** Faixa de 3–6 KPIs derivados dos registros da aba. */
export function RichTabKpis({ kpis, className }: { kpis: RichKpi[]; className?: string }) {
  if (!kpis.length) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>
      {kpis.map((kpi) => (
        <StatKpi
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          hint={kpi.hint}
          trend={kpi.trend}
          trendDir={kpi.trendDir}
        />
      ))}
    </div>
  );
}

/** Card-painel para o visual de foco (gráfico, mapa, lista, etc.). */
export function RichTabPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Lista de barras horizontais (CSS puro) — ranking simples sem peso de recharts. */
export function RichBarList({
  items,
  format,
  color,
}: {
  items: Array<{ label: string; value: number }>;
  format?: (value: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(96px,140px)_1fr_auto] items-center gap-3 text-xs"
        >
          <span className="truncate text-muted-foreground">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: color ?? chartColors.primary,
              }}
            />
          </span>
          <span className="tabular-nums font-medium">
            {format ? format(item.value) : item.value.toLocaleString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}
