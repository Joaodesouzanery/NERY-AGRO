import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  LogOut,
  Search,
  MapPinned,
  ClipboardList,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { resetAllDemoStores } from "@/lib/demo-store";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";

const generalItems = [
  { title: "Torre de Controle", url: "/torre-de-controle", icon: LayoutDashboard },
  { title: "Logística e Distribuição", url: "/logistica", icon: Truck },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Campo", url: "/campo", icon: Sprout },
  { title: "Talhão 360°", url: "/campo/talhoes", icon: MapPinned },
  { title: "RDC — Diário de Campo", url: "/rdc", icon: ClipboardList },
  { title: "Pecuária", url: "/pecuaria", icon: QrCode },
  { title: "Emissão de Carbono", url: "/sustentabilidade", icon: Leaf },
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
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/login", replace: true });
  };

  // Apaga os deltas locais do DEMO (calendário, insumos, ...) e recarrega tudo.
  const resetDemo = () => {
    resetAllDemoStores();
    void queryClient.invalidateQueries();
    toast.success("Dados demo restaurados ao estado original.");
  };

  // Persiste a escolha do usuário (desktop). Sem preferência salva, segue o tamanho
  // da tela. A escolha manual nunca é sobrescrita pelo resize.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(stored !== null ? stored === "true" : isMobile);
  }, [isMobile]);

  // Fecha o drawer ao navegar (mudou a rota).
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

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
    if (url === "/campo") return path === "/campo";
    return url === "/" ? path === "/" : path.startsWith(url);
  };

  const navLists = (compact: boolean) => (
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      {!compact && (
        <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80">
          GERAL
        </div>
      )}
      <ul className="space-y-1">
        {generalItems.map((item) => {
          const active = isActive(item.url);
          return (
            <li key={item.title}>
              <Link
                to={item.url}
                preload="intent"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border border-sidebar-border bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/40",
                  compact && "justify-center px-0",
                )}
              >
                <item.icon
                  className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")}
                  strokeWidth={active ? 2.25 : 1.85}
                />
                {!compact && <span>{item.title}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {!compact && (
        <div className="mb-2 mt-7 px-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80">
          SUPORTE
        </div>
      )}
      <ul className="space-y-1">
        {supportItems.map((item) => (
          <li key={item.title}>
            <a
              href={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/40",
                compact && "justify-center px-0",
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.85} />
              {!compact && <span>{item.title}</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  const sos = (compact: boolean) => (
    <a
      href={EMERGENCY_WHATSAPP}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20",
        compact && "justify-center px-0",
      )}
      title="Emergência / Suporte"
    >
      <LifeBuoy className="h-[18px] w-[18px] shrink-0" />
      {!compact && <span>SOS / Suporte</span>}
    </a>
  );

  const userBlock = (compact: boolean) => {
    const email = user?.email ?? "—";
    const roleLabel = !user
      ? ""
      : role === "platform_admin"
        ? "Admin global"
        : role === "owner"
          ? "Dono"
          : role === "admin"
            ? "Admin"
            : role === "member"
              ? "Membro"
              : "Sem empresa";
    if (compact) {
      return (
        <button
          onClick={handleSignOut}
          title="Sair"
          aria-label="Sair"
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4" />
        </button>
      );
    }
    return (
      <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary">
          {email.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium">{email}</div>
          <div className="truncate text-[10.5px] text-muted-foreground">{roleLabel}</div>
        </div>
        <button
          onClick={handleSignOut}
          title="Sair"
          aria-label="Sair"
          className="text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ===== Desktop rail ===== */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="min-w-0 flex-1 leading-none">
            {collapsed ? (
              <div className="text-center text-[13px] font-semibold tracking-[0.08em] text-foreground">
                AT
              </div>
            ) : (
              <div className="text-[15px] font-semibold tracking-[0.16em] text-foreground">
                AGROTORRE
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsedPersisted(true)}
              className="text-muted-foreground transition hover:text-foreground"
              aria-label="Recolher menu"
              title="Recolher menu"
            >
              <PanelLeft className="h-4 w-4" />
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
            <PanelLeft className="h-4 w-4 rotate-180" />
          </button>
        )}

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

        {navLists(collapsed)}

        <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
          {userBlock(collapsed)}
          {sos(collapsed)}
          <div
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm",
              collapsed ? "justify-center" : "justify-between gap-3 bg-sidebar-accent/40",
            )}
          >
            {!collapsed && (
              <div className="flex min-w-0 items-center gap-2">
                {theme === "light" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold">Modo Claro</div>
                  <div className="truncate text-[10.5px] text-muted-foreground">
                    {theme === "light" ? "Melhor sob o sol" : "Tema escuro"}
                  </div>
                </div>
              </div>
            )}
            <Switch
              checked={theme === "light"}
              onCheckedChange={(v) => setTheme(v ? "light" : "dark")}
              aria-label="Alternar modo claro"
            />
          </div>
          <div
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm",
              collapsed ? "justify-center" : "justify-between gap-3 bg-sidebar-accent/40",
            )}
          >
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[12px] font-semibold">Modo DEMO</div>
                <div className="truncate text-[10.5px] text-muted-foreground">
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
          {demoMode && !collapsed && (
            <button
              type="button"
              onClick={resetDemo}
              className="w-full rounded-lg border border-sidebar-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-sidebar-accent/40"
            >
              Restaurar dados demo
            </button>
          )}
        </div>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-sidebar-accent/50"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-[15px] font-semibold tracking-[0.16em] text-foreground">AGROTORRE</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Alternar modo claro"
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-sidebar-accent/50"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <Switch
            checked={demoMode}
            onCheckedChange={setDemoMode}
            aria-label="Alternar dados demonstrativos"
          />
        </div>
      </header>

      {/* ===== Mobile drawer ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
              <div className="text-[15px] font-semibold tracking-[0.16em] text-foreground">
                AGROTORRE
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-sidebar-accent/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navLists(false)}
            <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
              {userBlock(false)}
              {sos(false)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
