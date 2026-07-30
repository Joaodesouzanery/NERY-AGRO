// Tema e formatação dos gráficos do AgroTorre. Antes cada tela reescrevia eixos, grade e
// tooltip à mão (13 arquivos, três raios de canto diferentes num design de
// --radius: 3px). Aqui isso é um lugar só.
//
// Cores: todas CSS vars redefinidas em :root (claro) e .dark — viram sozinhas
// nos dois temas. A paleta é MONO + 3 semáforos: séries categóricas usam
// primary → c1 → c2; cor (verde/âmbar/vermelho) só quando o dado É semáforo.

export type ChartDatum = Record<string, string | number>;

export const chartColors = {
  primary: "var(--color-primary)",
  c1: "var(--color-chart-1)",
  c2: "var(--color-chart-2)",
  c3: "var(--color-chart-3)",
  c4: "var(--color-chart-4)",
  c5: "var(--color-chart-5)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
  border: "var(--color-border)",
  mutedFg: "var(--color-muted-foreground)",
  popover: "var(--color-popover)",
};

/** Ordem categórica determinística (mono primeiro; cor só depois). */
export const chartPalette = [
  chartColors.primary,
  chartColors.c1,
  chartColors.c2,
  chartColors.c3,
  chartColors.c4,
  chartColors.c5,
];

export type SeriesSpec = { key: string; name: string; color?: string; stackId?: string };

export type ValueFormat = "int" | "brl" | "kg" | "t" | "pct" | "co2e";

const NBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Formatação pt-BR única — antes cada gráfico inventava a sua. */
export function formatValue(value: number, format: ValueFormat = "int"): string {
  if (!Number.isFinite(value)) return "—";
  switch (format) {
    case "brl":
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      });
    case "kg":
      return `${NBR(value)} kg`;
    case "t":
      return `${NBR(value, 1)} t`;
    case "pct":
      return `${NBR(value, 1)}%`;
    case "co2e":
      return `${NBR(value, 1)} tCO₂e`;
    default:
      return NBR(value, Number.isInteger(value) ? 0 : 1);
  }
}
