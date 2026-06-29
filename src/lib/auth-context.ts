import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  /** Empresa (organization) ativa do usuário; null se ainda não vinculado. */
  orgId: string | null;
  /** Papel na empresa: owner | admin | member. */
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
