import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthOrg = { id: string; nome: string };

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  /** Empresa (organization) ativa do usuário; null se ainda não vinculado. */
  orgId: string | null;
  /** Papel na empresa: owner | admin | member | platform_admin. */
  role: string | null;
  /** Super-admin global: acessa todas as empresas e transita entre elas. */
  isPlatformAdmin: boolean;
  /** Lista de empresas (apenas para super-admin, alimenta o seletor do topo). */
  orgs: AuthOrg[];
  /** Troca a empresa ativa (super-admin) e recarrega os dados. */
  setActiveOrg: (orgId: string) => Promise<void>;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
