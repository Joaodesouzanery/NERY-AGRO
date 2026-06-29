import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/lib/auth";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [{ title: "Redefinir senha — Nery Agro" }],
  }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa de pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setBusy(true);
    try {
      // O link do e-mail abre esta página já com uma sessão de recovery ativa.
      await updatePassword(password);
      toast.success("Senha atualizada com sucesso.");
      void navigate({ to: "/torre-de-controle", replace: true });
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível atualizar a senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-lg font-semibold tracking-[0.18em]">NERY AGRO</div>
          <p className="mt-2 text-sm text-muted-foreground">Defina uma nova senha.</p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="••••••••"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Confirmar senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {busy ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/login" className="hover:text-foreground">
            ← Voltar ao login
          </a>
        </div>
      </div>
    </div>
  );
}
