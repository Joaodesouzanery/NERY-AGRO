import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/lib/auth";
import { PasswordInput } from "@/components/password-input";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [{ title: "Redefinir senha — AgroTorre" }],
  }),
  component: RedefinirSenhaPage,
});

// Mínimo aceitável: 8 caracteres com pelo menos uma letra e um número.
function meetsMinimum(pw: string): boolean {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}

// Pontuação 0–4 para o medidor visual de força.
function strength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const label = pw.length === 0 ? "" : score <= 1 ? "Fraca" : score <= 2 ? "Média" : "Forte";
  return { score, label };
}

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const { score, label } = useMemo(() => strength(password), [password]);
  const strong = meetsMinimum(password);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!meetsMinimum(password)) {
      toast.error("A senha precisa de pelo menos 8 caracteres, com letras e números.");
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
          <div className="text-lg font-semibold tracking-[0.18em]">AGROTORRE</div>
          <p className="mt-2 text-sm text-muted-foreground">Defina uma nova senha.</p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="grid gap-1.5">
            <PasswordInput
              label="Nova senha"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {password.length > 0 && (
              <div className="mt-1">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < score
                          ? score <= 1
                            ? "bg-destructive"
                            : score <= 2
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Força: {label}
                  {!strong && " · mínimo 8 caracteres com letras e números"}
                </p>
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirmar senha"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={busy || !strong || password !== confirm}
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
