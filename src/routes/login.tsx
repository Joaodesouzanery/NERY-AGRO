import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CalendarClock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { signInWithPassword } from "@/lib/auth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PasswordInput } from "@/components/password-input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — AgroTorre" },
      { name: "description", content: "Acesse a plataforma AgroTorre." },
    ],
  }),
  component: LoginPage,
});

// Link de agendamento de demonstração (para quem ainda não tem acesso).
const DEMO_URL = "https://calendly.com/neryadministrativo/30min";

// Bloqueio local por tentativas (defesa em profundidade; o rate-limit real é do
// Supabase). Após MAX_ATTEMPTS falhas, trava por LOCK_SECONDS segundos.
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;
const ATTEMPTS_KEY = "auth:attempts";
const LOCKED_UNTIL_KEY = "auth:lockedUntil";

function readNumber(key: string): number {
  if (typeof sessionStorage === "undefined") return 0;
  return Number(sessionStorage.getItem(key)) || 0;
}

// Traduz os erros do Supabase Auth para mensagens acionáveis em pt-BR.
function friendlyAuthError(message: string): string {
  const m = (message || "").toLowerCase();
  // Mesma mensagem genérica para credencial inválida E e-mail não confirmado: não
  // revela se a conta existe (anti-enumeração) nem vaza caminhos internos do
  // Supabase ao usuário final. (Ativação de conta é tratada pelo admin.)
  if (m.includes("invalid login credentials") || m.includes("email not confirmed"))
    return "E-mail ou senha incorretos.";
  if (m.includes("email logins are disabled") || m.includes("email provider"))
    return "Login por e-mail está desabilitado no Supabase (Authentication → Providers → Email).";
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("placeholder")
  )
    return "Não foi possível falar com o Supabase. Confira VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY e refaça o deploy.";
  return message || "Não foi possível entrar.";
}

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Segundos restantes de bloqueio (0 = liberado).
  const [cooldown, setCooldown] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  // Honeypot anti-bot: humanos não veem/preenchem; bots costumam preencher.
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Já logado → entra direto na Torre de Controle.
  useEffect(() => {
    if (!loading && session) void navigate({ to: "/torre-de-controle", replace: true });
  }, [loading, session, navigate]);

  // Restaura o bloqueio pendente (persistido em sessionStorage) e mantém a contagem.
  useEffect(() => {
    const refresh = () => {
      const remaining = Math.ceil((readNumber(LOCKED_UNTIL_KEY) - Date.now()) / 1000);
      setCooldown(remaining > 0 ? remaining : 0);
      if (remaining <= 0 && tick.current) {
        clearInterval(tick.current);
        tick.current = null;
      }
    };
    refresh();
    tick.current = setInterval(refresh, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  const startLock = () => {
    const until = Date.now() + LOCK_SECONDS * 1000;
    sessionStorage.setItem(LOCKED_UNTIL_KEY, String(until));
    sessionStorage.setItem(ATTEMPTS_KEY, "0");
    setCooldown(LOCK_SECONDS);
    if (!tick.current) {
      tick.current = setInterval(() => {
        const remaining = Math.ceil((readNumber(LOCKED_UNTIL_KEY) - Date.now()) / 1000);
        setCooldown(remaining > 0 ? remaining : 0);
        if (remaining <= 0 && tick.current) {
          clearInterval(tick.current);
          tick.current = null;
        }
      }, 1000);
    }
  };

  const registerFailure = () => {
    const attempts = readNumber(ATTEMPTS_KEY) + 1;
    sessionStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) startLock();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Honeypot preenchido → provável bot: aborta em silêncio (sem chamar o Supabase).
    if (honeypotRef.current?.value) return;
    if (cooldown > 0) {
      toast.error(`Muitas tentativas. Aguarde ${cooldown}s antes de tentar novamente.`);
      return;
    }
    if (!email.trim() || !password) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(email.trim(), password);
      sessionStorage.removeItem(ATTEMPTS_KEY);
      sessionStorage.removeItem(LOCKED_UNTIL_KEY);
      toast.success("Bem-vindo de volta!");
      void navigate({ to: "/torre-de-controle", replace: true });
    } catch (error) {
      registerFailure();
      toast.error(friendlyAuthError((error as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const locked = cooldown > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-lg font-semibold tracking-[0.18em]">AGROTORRE</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para acessar a operação da sua fazenda.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            Configuração do Supabase ausente (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
            Defina as variáveis no ambiente e refaça o deploy — o login não funciona sem elas.
          </div>
        )}

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          {/* Honeypot: fora da tela, ignorado por leitores de tela e sem tab */}
          <input
            ref={honeypotRef}
            type="text"
            name="empresa_site"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
          />
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

          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {locked && (
            <p className="text-center text-xs text-destructive">
              Muitas tentativas. Tente novamente em {cooldown}s.
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured || locked}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {busy ? "Entrando..." : locked ? `Aguarde ${cooldown}s` : "Entrar"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm font-medium">Ainda não tem acesso?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Conheça a AgroTorre em uma demonstração guiada.
          </p>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
          >
            <CalendarClock className="h-4 w-4" />
            Agendar DEMO
          </a>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
