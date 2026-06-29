import { supabase } from "@/integrations/supabase/client";

// Wrappers finos sobre o Supabase Auth (e-mail + senha). A sessão é persistida
// no localStorage pelo client (persistSession: true) e injetada automaticamente
// nas chamadas .from() — é o que ativa a RLS por empresa.

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
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
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
