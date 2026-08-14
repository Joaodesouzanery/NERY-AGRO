import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthOrg } from "@/lib/auth-context";
import { signOut as signOutUser } from "@/lib/auth";
import { useIdleLogout } from "@/hooks/use-idle-logout";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [orgs, setOrgs] = useState<AuthOrg[]>([]);
  const [loading, setLoading] = useState(true);
  // Resolver a empresa é uma segunda etapa, com consulta ao banco. Sem um estado
  // próprio, quem barra por falta de vínculo não distingue "ainda não sei" de
  // "não tem" — e a tela de conta-sem-empresa piscaria em todo login.
  const [orgLoading, setOrgLoading] = useState(true);

  // Auto-logout por inatividade (só quando logado).
  useIdleLogout(Boolean(session));

  // Sessão inicial + escuta de mudanças (login/logout/refresh/recovery).
  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
      })
      .catch((erro) => {
        // Sem este catch, uma rejeição deixava `loading` em true PARA SEMPRE e o
        // app ficava preso em "Carregando...". Falhar aqui é ficar deslogado —
        // a direção segura.
        console.error("[Auth] Falha ao ler a sessão:", erro);
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
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
      setOrgLoading(false); // sem sessão não há vínculo a resolver
      return;
    }
    let active = true;
    setOrgLoading(true);
    void (async () => {
      try {
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
      } catch (erro) {
        // Falha de rede ao resolver o vínculo NÃO pode virar "tem empresa":
        // fica sem empresa e a tela explica, em vez de deixar entrar por engano.
        console.error("[Auth] Falha ao resolver a empresa:", erro);
        if (active) {
          setOrgId(null);
          setRole(null);
        }
      } finally {
        if (active) setOrgLoading(false);
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
      orgLoading,
      setActiveOrg: async (next: string) => {
        const uid = session?.user?.id;
        if (!uid) return;
        await supabase.from("admin_active_org").upsert({
          user_id: uid,
          org_id: next,
          updated_at: new Date().toISOString(),
        });
        setOrgId(next);
        // clear() e não invalidate(): invalidate marca stale mas ENTREGA o dado
        // da empresa anterior enquanto refaz a consulta.
        queryClient.clear();
      },
      signOut: async () => {
        // Delega para @/lib/auth, que apaga a flag de DEMO — este é o caminho
        // do botão Sair da barra lateral, não o de lib/auth diretamente.
        await signOutUser();
        // O QueryClient é criado uma vez por router e SOBREVIVE ao logout:
        // sem isto, os dados reais do usuário anterior ficam no cache para o
        // próximo que logar neste navegador.
        queryClient.clear();
      },
    }),
    [session, orgId, role, isPlatformAdmin, orgs, loading, orgLoading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
