import { useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  Home,
  Leaf,
  Moon,
  QrCode,
  Search,
  Sprout,
  Sun,
  Truck,
  Wallet,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Mapa", url: "/", icon: Home },
  { title: "Torre", url: "/torre-de-controle", icon: AlertTriangle },
  { title: "Logistica", url: "/logistica", icon: Truck },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Campo", url: "/campo", icon: Sprout },
  { title: "Pecuaria", url: "/pecuaria", icon: QrCode },
  { title: "Sustentabilidade", url: "/sustentabilidade", icon: Leaf },
  { title: "Inteligencia", url: "/inteligencia", icon: BarChart3 },
  { title: "COGS", url: "/otimizacao-cogs", icon: Calculator },
];

export function PlatformTopNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { demoMode, setDemoMode } = useDemoMode();
  const { theme, toggle } = useTheme();
  const mapShell = path === "/" || path === "/torre-de-controle";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-14 overflow-hidden border-b backdrop-blur",
        mapShell
          ? "border-slate-800 bg-slate-950/96 text-slate-100 shadow-[0_8px_22px_rgba(2,6,23,0.28)]"
          : "border-slate-200 bg-white/96 text-slate-900 shadow-[0_1px_12px_rgba(15,23,42,0.06)]",
      )}
    >
      <div className="flex h-full min-w-0 items-center">
        <a
          href="/"
          className={cn(
            "flex h-full shrink-0 items-center gap-3 border-r px-3 sm:px-4",
            mapShell ? "border-slate-800" : "border-slate-200",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              mapShell
                ? "bg-blue-500/20 text-blue-300"
                : "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
            )}
          >
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold tracking-tight">Nery Control Tower</div>
            <div className={cn("text-[10px]", mapShell ? "text-slate-400" : "text-slate-500")}>
              Mapa operacional unico
            </div>
          </div>
        </a>

        <nav className="flex h-full min-w-0 flex-1 overflow-hidden">
          {navItems.map((item) => {
            const active =
              item.url === "/"
                ? path === "/"
                : path === item.url || path.startsWith(`${item.url}/`);
            return (
              <a
                key={item.url}
                href={item.url}
                className={cn(
                  "group flex h-full min-w-0 shrink items-center justify-center gap-1.5 border-r px-2 text-xs font-medium transition md:px-2.5 xl:px-3",
                  mapShell
                    ? "border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
                    : "border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700",
                  active &&
                    (mapShell
                      ? "border-b-2 border-b-blue-400 bg-slate-900 text-white"
                      : "border-b-2 border-b-blue-600 bg-blue-50 text-blue-700"),
                )}
                title={item.title}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden truncate lg:inline">{item.title}</span>
              </a>
            );
          })}
        </nav>

        <div
          className={cn(
            "hidden h-full shrink-0 items-center gap-2 border-l px-3 xl:flex",
            mapShell ? "border-slate-800" : "border-slate-200",
          )}
        >
          <label
            className={cn(
              "flex h-9 w-52 items-center gap-2 rounded-lg border px-2 text-xs",
              mapShell
                ? "border-slate-700 bg-slate-950/60 text-slate-400"
                : "border-slate-200 bg-white text-slate-500 shadow-sm",
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <input
              placeholder="Buscar no mapa..."
              className={cn(
                "min-w-0 flex-1 bg-transparent outline-none",
                mapShell
                  ? "text-slate-200 placeholder:text-slate-500"
                  : "text-slate-800 placeholder:text-slate-400",
              )}
            />
          </label>
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-1.5",
              mapShell ? "border-slate-700" : "border-slate-200 bg-white shadow-sm",
            )}
          >
            <span className={cn("text-[10px]", mapShell ? "text-slate-400" : "text-slate-500")}>
              DEMO
            </span>
            <Switch checked={demoMode} onCheckedChange={setDemoMode} />
          </div>
          <button
            onClick={toggle}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border transition",
              mapShell
                ? "border-slate-700 text-slate-300 hover:bg-slate-900"
                : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-blue-700",
            )}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
