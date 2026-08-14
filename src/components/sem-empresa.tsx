import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Autenticado, mas sem vínculo com nenhuma empresa.
 *
 * Por que uma tela, e não um redirect para /login: quem chega aqui TEM sessão
 * válida, e o /login manda de volta para dentro assim que detecta sessão — os
 * dois ficariam se empurrando num laço.
 *
 * Por que barrar, se a RLS já protege: sem vínculo, `current_org_id()` devolve
 * NULL e toda policy nega, então a pessoa não vê dado de ninguém. Mas via o
 * produto inteiro por dentro — sidebar, menus, todas as telas — vazio e sem
 * explicação. Entrar e não ver nada é pior que não entrar e saber por quê.
 */
export function SemEmpresa() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Conta sem empresa vinculada</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sua conta foi criada, mas ainda não está ligada a nenhuma empresa no AgroTorre. Peça a
          quem administra a plataforma para vincular o seu acesso.
        </p>
        {user?.email && (
          <p className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            Conectado como <span className="text-foreground">{user.email}</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium transition hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
