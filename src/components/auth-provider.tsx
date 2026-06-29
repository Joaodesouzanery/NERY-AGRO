import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/lib/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sessão inicial + escuta de mudanças (login/logout/refresh/recovery).
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Empresa ativa + papel do usuário (1 empresa por usuário nesta fase).
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setOrgId(null);
      setRole(null);
      return;
    }
    let active = true;
    void supabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", uid)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setOrgId(data?.org_id ?? null);
        setRole(data?.role ?? null);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      orgId,
      role,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, orgId, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
