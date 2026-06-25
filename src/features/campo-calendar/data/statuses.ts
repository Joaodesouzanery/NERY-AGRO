import type { CalendarStatusDefinition } from "@/features/campo-calendar/types";

export const defaultCalendarStatuses: CalendarStatusDefinition[] = [
  { id: "planned", name: "Planejada", color: "#64748b", order: 10, active: true, isDefault: true },
  { id: "pending", name: "Pendente", color: "#d97706", order: 20, active: true, isDefault: true },
  {
    id: "in-progress",
    name: "Em andamento",
    color: "#2563eb",
    order: 30,
    active: true,
    isDefault: true,
  },
  {
    id: "completed",
    name: "Concluída",
    color: "#16a34a",
    order: 40,
    active: true,
    isDefault: true,
  },
  { id: "delayed", name: "Atrasada", color: "#dc2626", order: 50, active: true, isDefault: true },
  {
    id: "cancelled",
    name: "Cancelada",
    color: "#78716c",
    order: 60,
    active: true,
    isDefault: true,
  },
];

export const defaultStatusIdByName = Object.fromEntries(
  defaultCalendarStatuses.map((status) => [status.name, status.id]),
) as Record<string, string>;
