import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BarChart3,
  Calculator,
  Leaf,
  Wallet,
  Truck,
  QrCode,
  Sprout,
  HelpCircle,
  Settings,
  PanelLeft,
  Users,
  LifeBuoy,
  Search,
  MapPinned,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useIsMobile } from "@/hooks/use-mobile";

const generalItems = [
  { title: "Torre de Controle", url: "/torre-de-controle", icon: LayoutDashboard },
  { title: "Logística e Distribuição", url: "/logistica", icon: Truck },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Campo", url: "/campo", icon: Sprout },
  { title: "Talhão 360°", url: "/campo/talhoes", icon: MapPinned },
  { title: "RDC — Diário de Campo", url: "/rdc", icon: ClipboardList },
  { title: "Pecuária / Animais", url: "/pecuaria", icon: QrCode },
  { title: "Sustentabilidade", url: "/sustentabilidade", icon: Leaf },
  { title: "Equipe & Vendas", url: "/equipe-vendas", icon: Users },
  { title: "Inteligência", url: "/inteligencia", icon: BarChart3 },
  { title: "Otimização de COGS", url: "/otimizacao-cogs", icon: Calculator },
];

const supportItems = [
  { title: "Central de Ajuda", url: "#", icon: HelpCircle },
  { title: "Configurações", url: "#", icon: Settings },
];

const EMERGENCY_WHATSAPP =
  "https://wa.me/5500000000000?text=Preciso%20de%20suporte%20urgente%20na%20opera%C3%A7%C3%A3o";

const SIDEBAR_STORAGE_KEY = "nery-sidebar-collapsed";

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { demoMode, setDemoMode } = useDemoMode();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  // Persiste a escolha do usuário. Sem preferência salva, segue o tamanho da
  // tela (recolhe no mobile). A escolha manual nunca é sobrescrita pelo resize.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(stored !== null ? stored === "true" : isMobile);
  }, [isMobile]);

  const setCollapsedPersisted = (next: boolean) => {
    setCollapsed(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    }
  };

  const isActive = (url: string) => {
    if (url === "/torre-de-controle") {
      return path.startsWith("/torre-de-controle") || path.startsWith("/dashboard");
    }
    // /campo é exato para não acender junto com /campo/talhoes (Talhão 360°).
    if (url === "/campo") return path === "/campo";
    return url === "/" ? path === "/" : path.startsWith(url);
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 shrink-0",
        collapsed ? "w-[76px]" : "w-[260px]",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex-1 min-w-0 leading-none">
          {collapsed ? (
            <div className="text-center text-[13px] font-semibold tracking-[0.08em] text-foreground">
              NA
            </div>
          ) : (
            <div className="text-[15px] font-semibold tracking-[0.16em] text-foreground">
              NERY AGRO
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsedPersisted(true)}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="Recolher menu"
            title="Recolher menu"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsedPersisted(false)}
          className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/60"
          aria-label="Expandir menu"
          title="Expandir menu"
        >
          <PanelLeft className="w-4 h-4 rotate-180" />
        </button>
      )}

      {/* Busca */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <label className="flex h-9 items-center gap-2 rounded-lg border border-sidebar-border bg-card px-2.5 text-sm text-muted-foreground">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              placeholder="Buscar..."
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 mb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80">
            GERAL
          </div>
        )}
        <ul className="space-y-1">
          {generalItems.map((i) => {
            const active = isActive(i.url);
            return (
              <li key={i.title}>
                <Link
                  to={i.url}
                  preload="intent"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-card text-foreground border border-sidebar-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/40",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <i.icon
                    className={cn("w-[18px] h-[18px] shrink-0", active && "text-primary")}
                    strokeWidth={active ? 2.25 : 1.85}
                  />
                  {!collapsed && <span>{i.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="px-2 mt-7 mb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80">
            SUPORTE
          </div>
        )}
        <ul className="space-y-1">
          {supportItems.map((i) => (
            <li key={i.title}>
              <a
                href={i.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/40",
                  collapsed && "justify-center px-0",
                )}
              >
                <i.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.85} />
                {!collapsed && <span>{i.title}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <a
          href={EMERGENCY_WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20",
            collapsed && "justify-center px-0",
          )}
          title="Emergência / Suporte"
        >
          <LifeBuoy className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>SOS / Suporte</span>}
        </a>

        <div
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm",
            collapsed ? "justify-center" : "justify-between gap-3 bg-sidebar-accent/40",
          )}
        >
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[12px] font-semibold">Modo DEMO</div>
              <div className="text-[10.5px] text-muted-foreground truncate">
                {demoMode ? "Dados demonstrativos" : "Dados reais"}
              </div>
            </div>
          )}
          <Switch
            checked={demoMode}
            onCheckedChange={setDemoMode}
            aria-label="Alternar dados demonstrativos"
          />
        </div>

        <div
          className={cn(
            "mt-1 flex items-center gap-3 px-2 py-2 rounded-lg",
            !collapsed && "hover:bg-sidebar-accent/40",
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
            N
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-foreground">Nery Admin</div>
              <div className="text-[11px] text-muted-foreground truncate">admin@nery.com</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
