import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

export type ChartDatum = Record<string, string | number>;

export const chartColors = {
  primary: "var(--color-primary)",
  c2: "var(--color-chart-2)",
  c3: "var(--color-chart-3)",
  c4: "var(--color-chart-4)",
  c5: "var(--color-chart-5)",
  border: "var(--color-border)",
  mutedFg: "var(--color-muted-foreground)",
  popover: "var(--color-popover)",
};

const tooltipStyle = {
  background: chartColors.popover,
  border: `1px solid ${chartColors.border}`,
  borderRadius: 3,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

export function MiniArea({
  data,
  dataKey = "v",
  color = chartColors.primary,
}: {
  data: ChartDatum[];
  dataKey?: string;
  color?: string;
}) {
  const gid = "ma-" + String(color).replace(/[^a-zA-Z0-9]/g, "");
  return (
    <ResponsiveContainer>
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
    </ResponsiveContainer>
  );
}

export function CashFlowChart({
  data,
}: {
  data: { label: string; entradas: number; saidas: number }[];
}) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={chartColors.mutedFg}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke={chartColors.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="entradas" fill={chartColors.c3} radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({
  data,
  keys,
}: {
  data: ChartDatum[];
  keys: { key: string; color: string; name: string }[];
}) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={chartColors.mutedFg}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke={chartColors.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {keys.map((k) => (
          <Line
            key={k.key}
            type="monotone"
            dataKey={k.key}
            stroke={k.color}
            strokeWidth={2}
            dot={false}
            name={k.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BreakEvenChart({ data, point }: { data: ChartDatum[]; point: number }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="qty"
          stroke={chartColors.mutedFg}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke={chartColors.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <ReferenceLine
          x={point}
          stroke={chartColors.primary}
          strokeDasharray="4 4"
          label={{ value: "Equilíbrio", fill: chartColors.primary, fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="receita"
          stroke={chartColors.c3}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="custo"
          stroke={chartColors.primary}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
