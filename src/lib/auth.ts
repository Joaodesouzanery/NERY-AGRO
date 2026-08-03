import { supabase } from "@/integrations/supabase/client";
import { resetDemoMode } from "@/lib/demo-context";

// Wrappers finos sobre o Supabase Auth (e-mail + senha). A sessão é persistida
// no localStorage pelo client (persistSession: true) e injetada automaticamente
// nas chamadas .from() — é o que ativa a RLS por empresa.
//
// A flag de DEMO é apagada nas duas pontas da autenticação. Ela vive no
// localStorage, que é por NAVEGADOR e não por usuário — sem isso, quem liga o
// DEMO e sai deixa o próximo login começar em DEMO. Limpar na ENTRADA é o que
// cobre "fechou o navegador com o DEMO ligado e outra pessoa abriu", e
// signInWithPassword é o único caminho de entrada do app (não há OAuth/OTP).

export async function signInWithPassword(email: string, password: string) {
  resetDemoMode();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  resetDemoMode();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email: string) {
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/redefinir-senha` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  // O link de recuperação pode abrir num navegador onde outra pessoa deixou o
  // DEMO ligado — a entrada por aqui também precisa nascer limpa.
  resetDemoMode();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
