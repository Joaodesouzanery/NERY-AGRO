import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthOrg } from "@/lib/auth-context";
import { useIdleLogout } from "@/hooks/use-idle-logout";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [orgs, setOrgs] = useState<AuthOrg[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-logout por inatividade (só quando logado).
  useIdleLogout(Boolean(session));

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

  // Empresa ativa + papel. Super-admin global enxerga todas e escolhe a ativa.
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setOrgId(null);
      setRole(null);
      setIsPlatformAdmin(false);
      setOrgs([]);
      return;
    }
    let active = true;
    void (async () => {
      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();
      const admin = Boolean(adminRow);
      if (!active) return;
      setIsPlatformAdmin(admin);

      if (admin) {
        const { data: allOrgs } = await supabase
          .from("organizations")
          .select("id, nome")
          .order("nome", { ascending: true });
        const list = (allOrgs ?? []) as AuthOrg[];
        const { data: act } = await supabase
          .from("admin_active_org")
          .select("org_id")
          .eq("user_id", uid)
          .maybeSingle();
        let activeOrg = act?.org_id ?? null;
        if (!activeOrg && list.length) {
          activeOrg = list[0].id;
          await supabase.from("admin_active_org").upsert({ user_id: uid, org_id: activeOrg });
        }
        if (!active) return;
        setOrgs(list);
        setOrgId(activeOrg);
        setRole("platform_admin");
      } else {
        const { data } = await supabase
          .from("organization_members")
          .select("org_id, role")
          .eq("user_id", uid)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!active) return;
        setOrgs([]);
        setOrgId(data?.org_id ?? null);
        setRole(data?.role ?? null);
      }
    })();
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
      isPlatformAdmin,
      orgs,
      loading,
      setActiveOrg: async (next: string) => {
        const uid = session?.user?.id;
        if (!uid) return;
        await supabase.from("admin_active_org").upsert({
          user_id: uid,
          org_id: next,
          updated_at: new Date().toISOString(),
        });
        setOrgId(next);
        await queryClient.invalidateQueries();
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, orgId, role, isPlatformAdmin, orgs, loading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
