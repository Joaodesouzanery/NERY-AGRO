import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  chartColors,
  chartPalette,
  formatValue,
  type ChartDatum,
  type SeriesSpec,
  type ValueFormat,
} from "@/lib/chart-theme";

// Componentes de gráfico do AgroTorre. Antes cada tela reescrevia eixos, grade
// e tooltip à mão (13 arquivos, três raios de canto diferentes num design de
// --radius: 3px). Aqui isso é um lugar só. Tema e formatação: lib/chart-theme.

const tooltipStyle = {
  background: chartColors.popover,
  border: `1px solid ${chartColors.border}`,
  borderRadius: 3,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

const axisProps = {
  stroke: chartColors.mutedFg,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const gridProps = {
  strokeDasharray: "3 3",
  stroke: chartColors.border,
  vertical: false,
} as const;

// Cantos quadrados: o design usa --radius 3px, mas os gráficos tinham 6/5/4.
const BAR_RADIUS: [number, number, number, number] = [2, 2, 0, 0];

function tooltipFormatter(format?: ValueFormat) {
  return (value: number | string) =>
    typeof value === "number" ? formatValue(value, format) : String(value);
}

/**
 * Moldura de gráfico: título, altura, empty state honesto e **montagem tardia**.
 * O lazy-mount não é enfeite — Campo tem 18 abas e Financeiro 15; montar todos
 * os SVGs de uma vez trava a rota num celular de campo.
 */
export function ChartFrame({
  title,
  description,
  action,
  height = 240,
  empty,
  emptyTitle = "Sem dados para este gráfico",
  emptyDescription,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  height?: number;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (visivel) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisivel(true);
      },
      { rootMargin: "200px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visivel]);

  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div ref={ref} style={{ height }}>
        {empty ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="h-full justify-center py-0"
          />
        ) : visivel ? (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

export function BarsChart({
  data,
  xKey,
  series,
  layout = "horizontal",
  format,
}: {
  data: ChartDatum[];
  xKey: string;
  series: SeriesSpec[];
  /** "vertical" = barras deitadas (bom para nomes longos, ex.: rotas/fazendas). */
  layout?: "horizontal" | "vertical";
  format?: ValueFormat;
}) {
  const deitado = layout === "vertical";
  return (
    <BarChart
      data={data}
      layout={deitado ? "vertical" : "horizontal"}
      margin={{ top: 4, right: 8, bottom: 4, left: deitado ? 8 : 0 }}
    >
      <CartesianGrid {...gridProps} vertical={deitado} horizontal={!deitado} />
      {deitado ? (
        <>
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey={xKey} width={110} {...axisProps} />
        </>
      ) : (
        <>
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
        </>
      )}
      <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(format)} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      {series.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name}
          stackId={s.stackId}
          fill={s.color ?? chartPalette[i % chartPalette.length]}
          radius={deitado ? [0, 2, 2, 0] : BAR_RADIUS}
        />
      ))}
    </BarChart>
  );
}

export function TrendChart({
  data,
  xKey,
  series,
  area = false,
  format,
}: {
  data: ChartDatum[];
  xKey: string;
  series: SeriesSpec[];
  area?: boolean;
  format?: ValueFormat;
}) {
  if (area) {
    return (
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          {series.map((s, i) => {
            const cor = s.color ?? chartPalette[i % chartPalette.length];
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={cor} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(format)} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color ?? chartPalette[i % chartPalette.length]}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    );
  }
  return (
    <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey={xKey} {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(format)} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      {series.map((s, i) => (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.name}
          stroke={s.color ?? chartPalette[i % chartPalette.length]}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </LineChart>
  );
}

export function DonutChart({
  data,
  nameKey,
  valueKey,
  format,
  colors,
}: {
  data: ChartDatum[];
  nameKey: string;
  valueKey: string;
  format?: ValueFormat;
  /** Cores por fatia, quando o dado é semáforo (status, severidade). */
  colors?: string[];
}) {
  return (
    <PieChart>
      <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(format)} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Pie
        data={data}
        nameKey={nameKey}
        dataKey={valueKey}
        innerRadius="55%"
        outerRadius="80%"
        paddingAngle={2}
        stroke="none"
      >
        {data.map((d, i) => (
          <Cell
            key={String(d[nameKey] ?? i)}
            fill={colors?.[i] ?? chartPalette[i % chartPalette.length]}
          />
        ))}
      </Pie>
    </PieChart>
  );
}

/** Mini-série sem eixos, para dentro de um KPI. */
export function Sparkline({
  data,
  dataKey = "v",
  color = chartColors.primary,
}: {
  data: ChartDatum[];
  dataKey?: string;
  color?: string;
}) {
  const gid = "spark-" + String(dataKey).replace(/[^a-zA-Z0-9]/g, "");
  return (
    <AreaChart data={data}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        fill={`url(#${gid})`}
        strokeWidth={2}
      />
    </AreaChart>
  );
}

// --- Gráficos de domínio (sobre o kit) -------------------------------------

export function CashFlowChart({
  data,
}: {
  data: Array<{ label: string; entradas: number; saidas: number }>;
}) {
  return (
    <BarsChart
      data={data}
      xKey="label"
      format="brl"
      series={[
        { key: "entradas", name: "Entradas", color: chartColors.success },
        { key: "saidas", name: "Saídas", color: chartColors.primary },
      ]}
    />
  );
}

export function BreakEvenChart({ data, point }: { data: ChartDatum[]; point: number }) {
  return (
    <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="qty" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter("brl")} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <ReferenceLine
        x={point}
        stroke={chartColors.primary}
        strokeDasharray="4 4"
        label={{ value: "Equilíbrio", fill: chartColors.primary, fontSize: 11 }}
      />
      <Line
        type="monotone"
        dataKey="receita"
        name="Receita"
        stroke={chartColors.success}
        strokeWidth={2}
        dot={false}
      />
      <Line
        type="monotone"
        dataKey="custo"
        name="Custo"
        stroke={chartColors.primary}
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  );
}
