import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth";

// Encerra a sessão após IDLE_MS sem atividade, avisando WARN_MS antes.
const IDLE_MS = 30 * 60_000; // 30 min
const WARN_MS = 2 * 60_000; // aviso 2 min antes

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "visibilitychange",
] as const;

/**
 * Auto-logout por inatividade (defesa em profundidade — protege sessão esquecida
 * em máquina compartilhada). Ativo só quando `enabled` (há sessão). Reagenda a
 * cada atividade do usuário; ao estourar, faz signOut e volta ao /login.
 */
export function useIdleLogout(enabled: boolean) {
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const clear = () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };

    const schedule = () => {
      clear();
      warnTimer.current = setTimeout(() => {
        toast.warning("Sua sessão expira em 2 min por inatividade — mexa o mouse para continuar.", {
          duration: WARN_MS,
        });
      }, IDLE_MS - WARN_MS);
      logoutTimer.current = setTimeout(() => {
        void signOut().finally(() => {
          window.location.href = "/login";
        });
      }, IDLE_MS);
    };

    // Reagenda no máximo a cada 1s (mousemove dispara muito) e ignora aba oculta.
    let last = 0;
    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - last < 1000) return;
      last = now;
      schedule();
    };

    schedule();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    return () => {
      clear();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
    };
  }, [enabled]);
}
