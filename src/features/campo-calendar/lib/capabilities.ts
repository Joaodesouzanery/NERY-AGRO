// Capacidades por papel — MODO DEMONSTRATIVO. O repositório ainda não tem
// modelo de papéis aplicado ao produto nem RLS por papel em field_records;
// ocultar componente NÃO é segurança real. A fundação de papéis + RLS é um
// bloco separado (ver docs/campo-calendario.md). Aqui o papel vive no
// dispositivo apenas para demonstrar os fluxos de Decisões.

export const calendarRoles = ["gestor", "agronomo", "administrativo", "equipe"] as const;
export type CalendarRole = (typeof calendarRoles)[number];

export const roleLabels: Record<CalendarRole, string> = {
  gestor: "Gestor",
  agronomo: "Agrônomo",
  administrativo: "Administrativo",
  equipe: "Equipe",
};

export type CalendarCapabilities = {
  canViewDecisions: boolean;
  canDecide: boolean;
  canDeleteDecisions: boolean;
};

export function capabilitiesFor(role: CalendarRole): CalendarCapabilities {
  switch (role) {
    case "gestor":
      return { canViewDecisions: true, canDecide: true, canDeleteDecisions: true };
    case "agronomo":
    case "administrativo":
      return { canViewDecisions: true, canDecide: false, canDeleteDecisions: false };
    default:
      return { canViewDecisions: false, canDecide: false, canDeleteDecisions: false };
  }
}

const ROLE_KEY = "campo-calendar-demo-role-v1";

export function getDemoRole(): CalendarRole {
  if (typeof window === "undefined") return "gestor";
  const value = window.localStorage.getItem(ROLE_KEY) as CalendarRole | null;
  return value && calendarRoles.includes(value) ? value : "gestor";
}

export function setDemoRole(role: CalendarRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
}
