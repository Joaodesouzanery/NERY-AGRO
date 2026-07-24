import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

// Chave de persistência (mesma lida pelo script anti-FOUC em __root.tsx).
export const THEME_STORAGE_KEY = "agrotorre-theme";

type ThemeCtxValue = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const ThemeCtx = createContext<ThemeCtxValue>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default "dark" no primeiro render (igual ao SSR, evita hydration mismatch). O
  // efeito abaixo alinha ao que o script anti-FOUC já aplicou ao <html>.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage indisponível (aba privada) — o tema vale só nesta sessão.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return <ThemeCtx.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
