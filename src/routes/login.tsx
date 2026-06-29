import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordForEmail, signInWithPassword } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Nery Agro" },
      { name: "description", content: "Acesse a plataforma Nery Agro." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Já logado → entra direto na Torre de Controle.
  useEffect(() => {
    if (!loading && session) void navigate({ to: "/torre-de-controle", replace: true });
  }, [loading, session, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(email.trim(), password);
      toast.success("Bem-vindo de volta!");
      void navigate({ to: "/torre-de-controle", replace: true });
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      toast.info("Digite seu e-mail para enviarmos o link de redefinição.");
      return;
    }
    try {
      await resetPasswordForEmail(email.trim());
      toast.success("Enviamos um link de redefinição para o seu e-mail.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-lg font-semibold tracking-[0.18em]">NERY AGRO</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para acessar a operação da sua fazenda.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="voce@empresa.com"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {busy ? "Entrando..." : "Entrar"}
          </button>

          <button
            type="button"
            onClick={forgot}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Esqueci minha senha
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
