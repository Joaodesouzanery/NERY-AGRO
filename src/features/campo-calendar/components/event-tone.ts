// Tons visuais do Calendário (legenda por tipo) usando os tokens do design
// mono-dark — mesma paleta dos gráficos (styles.css / components/charts.tsx).
import type { CalendarEventType } from "@/features/campo-calendar/types/domain";

// Mono-dark: cor aparece em pontos/bordas sobre fundo neutro (nunca chip
// inteiro colorido com texto branco — primary aqui é claro).
export const eventTypeTone: Record<CalendarEventType, string> = {
  operacao: "var(--color-chart-1)",
  plantio: "var(--color-success)",
  colheita: "var(--color-chart-3)",
  monitoramento: "var(--color-warning)",
  adubacao: "var(--color-chart-2)",
  pulverizacao: "var(--color-chart-2)",
  irrigacao: "var(--color-chart-2)",
  compra: "var(--color-chart-1)",
  manutencao: "var(--color-chart-4)",
  decisao: "var(--color-warning)",
  alerta: "var(--color-destructive)",
  marco: "var(--color-chart-1)",
  administrativa: "var(--color-muted-foreground)",
  personalizado: "var(--color-chart-2)",
};

/** Classes do badge de status (efetivo — atraso ganha tom destrutivo). */
export function statusBadgeClass(statusId: string) {
  switch (statusId) {
    case "concluida":
      return "bg-success/15 text-success";
    case "cancelada":
      return "bg-muted text-muted-foreground line-through";
    case "atrasada":
      return "bg-destructive/15 text-destructive";
    case "em-andamento":
      return "bg-primary/15 text-primary";
    case "pendente":
      return "bg-warning/15 text-warning";
    default:
      return "bg-muted text-foreground";
  }
}

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
