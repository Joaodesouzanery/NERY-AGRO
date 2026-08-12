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

// NÃO há recuperação de senha por e-mail, e é decisão de produto: quem
// administra cadastra o usuário e define a senha dele no painel do Supabase,
// para manter o controle de quem entra. Sem `resetPasswordForEmail` e sem
// `updatePassword`, a rota pública /redefinir-senha deixou de existir também —
// era superfície aberta que nenhuma tela alcançava. Para trocar a senha de
// alguém: painel → Authentication → Users → editar.
