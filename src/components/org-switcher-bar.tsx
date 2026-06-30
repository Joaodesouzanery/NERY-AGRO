import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Quadro no topo, visível APENAS para super-admins globais. Permite transitar
// entre empresas (a empresa selecionada vira a "ativa" e escopa todos os dados).
export function OrgSwitcherBar() {
  const { isPlatformAdmin, orgs, orgId, setActiveOrg } = useAuth();
  if (!isPlatformAdmin) return null;

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm backdrop-blur">
      <span className="inline-flex items-center gap-1.5 font-semibold text-warning">
        <ShieldCheck className="h-4 w-4" />
        Administrador global
      </span>
      <span className="text-muted-foreground">Empresa:</span>
      <select
        value={orgId ?? ""}
        onChange={(event) => void setActiveOrg(event.target.value)}
        className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        aria-label="Selecionar empresa ativa"
      >
        {orgs.length === 0 && <option value="">Nenhuma empresa</option>}
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.nome}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">
        Você está vendo os dados desta empresa — troque para transitar entre as demais.
      </span>
    </div>
  );
}
