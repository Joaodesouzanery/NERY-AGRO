// Capacidades por papel no Calendário.
//
// Em REAL o papel vem de `organization_members.role` (owner/admin/member), via
// AuthContext — ver capabilitiesForOrgRole. Em DEMO existe um seletor de perfil
// para percorrer os fluxos de Decisões sem trocar de usuário; esse seletor
// vive no dispositivo e NÃO aparece fora do modo DEMO.
//
// Segue valendo o aviso de sempre: **ocultar componente não é autorização**.
// Estas capacidades organizam a tela; quem barra escrita indevida é a RLS. RLS
// por papel em field_records ainda não existe (ver docs/campo-calendario.md).

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

/**
 * Papel real da empresa (`organization_members.role`) → capacidades.
 *
 * owner/admin decidem; member vê sem decidir. `null` é quem ainda não tem
 * vínculo carregado (ou nenhum): vê o cronograma, não as decisões.
 */
export function capabilitiesForOrgRole(role: string | null): CalendarCapabilities {
  switch (role) {
    case "owner":
    case "admin":
      return capabilitiesFor("gestor");
    case "member":
      return capabilitiesFor("agronomo");
    default:
      return capabilitiesFor("equipe");
  }
}

/** Rótulo do papel real, para o badge somente-leitura em REAL. */
export const orgRoleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Equipe",
};

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
