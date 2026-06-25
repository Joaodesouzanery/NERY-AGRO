import { createContext, useContext } from "react";

type Theme = "dark";

// Modo único (mono-dark). A classe `dark` é fixa no <html> (ver __root.tsx).
// `useTheme()` permanece para não quebrar consumidores; `toggle` é no-op.
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeCtx.Provider value={{ theme: "dark", toggle: () => {} }}>{children}</ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
