import { b as QueryClient, a as QueryCache } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { b as createRouter, u as useRouter, a as createRootRouteWithContext, L as Link, O as Outlet, H as HeadContent, S as Scripts, c as createFileRoute, l as lazyRouteComponent, d as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { t as toast, T as Toaster$1 } from "../_libs/sonner.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { R as Root, T as Thumb } from "../_libs/radix-ui__react-switch.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { z as House, ae as Truck, ah as Wallet, a5 as Sprout, Y as QrCode, M as Leaf, ag as Users, j as ChartColumn, C as Calculator, a2 as Search, N as LifeBuoy, a7 as Sun, T as Moon } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
const appCss = "/assets/styles-BvtNayaC.css";
const maplibreCss = "/assets/maplibre-gl-DNVN2dqC.css";
const ThemeCtx = reactExports.createContext({
  theme: "light",
  toggle: () => {
  }
});
function ThemeProvider({ children }) {
  const [theme, setTheme] = reactExports.useState("light");
  reactExports.useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem("theme");
    const initial = stored ?? "light";
    setTheme(initial);
  }, []);
  reactExports.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThemeCtx.Provider,
    {
      value: { theme, toggle: () => setTheme((t) => t === "dark" ? "light" : "dark") },
      children
    }
  );
}
const useTheme = () => reactExports.useContext(ThemeCtx);
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Switch = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Thumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Root.displayName;
const DemoContext = reactExports.createContext(void 0);
function useDemoMode() {
  const context = reactExports.useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoMode must be used within DemoProvider");
  }
  return context;
}
const navItems = [
  { title: "Torre", url: "/torre-de-controle", icon: House },
  { title: "Logistica", url: "/logistica", icon: Truck },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Campo", url: "/campo", icon: Sprout },
  { title: "Pecuaria", url: "/pecuaria", icon: QrCode },
  { title: "Sustentabilidade", url: "/sustentabilidade", icon: Leaf },
  { title: "Equipe & Vendas", url: "/equipe-vendas", icon: Users },
  { title: "Inteligencia", url: "/inteligencia", icon: ChartColumn },
  { title: "COGS", url: "/otimizacao-cogs", icon: Calculator }
];
const EMERGENCY_WHATSAPP = "https://wa.me/5500000000000?text=Preciso%20de%20suporte%20urgente%20na%20opera%C3%A7%C3%A3o";
function PlatformTopNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { demoMode, setDemoMode } = useDemoMode();
  const { theme, toggle } = useTheme();
  const mapShell = path === "/torre-de-controle";
  if (path === "/") return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "header",
    {
      className: cn(
        "sticky top-0 z-50 h-14 overflow-hidden border-b backdrop-blur",
        mapShell ? "border-slate-700 bg-slate-950 text-slate-100 shadow-[0_8px_22px_rgba(2,6,23,0.28)]" : "border-slate-200 bg-white text-slate-900 shadow-[0_1px_12px_rgba(15,23,42,0.06)]"
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-w-0 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: "/",
            className: cn(
              "flex h-full shrink-0 items-center gap-3 border-r px-3 sm:px-4",
              mapShell ? "border-slate-800" : "border-slate-200"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-heading text-xl font-bold tracking-tight", children: [
                "NER",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-500", children: "Y" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden leading-tight sm:block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold tracking-tight", children: "Control Tower" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("text-[10px]", mapShell ? "text-slate-400" : "text-slate-500"), children: "Mapa operacional unico" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex h-full min-w-0 flex-1 overflow-hidden", children: navItems.map((item) => {
          const active = item.url === "/" ? path === "/" : path === item.url || path.startsWith(`${item.url}/`);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: item.url,
              className: cn(
                "group flex h-full min-w-0 shrink items-center justify-center gap-1.5 border-r px-2 text-xs font-semibold transition md:px-2.5 xl:px-3",
                mapShell ? "border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white" : "border-slate-200 text-slate-700 hover:bg-green-50 hover:text-green-700",
                active && (mapShell ? "border-b-2 border-b-green-400 bg-green-500/15 text-white" : "border-b-2 border-b-green-600 bg-green-50 text-green-700")
              ),
              title: item.title,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden truncate md:inline", children: item.title })
              ]
            },
            item.url
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: cn(
              "hidden h-full shrink-0 items-center gap-2 border-l px-3 xl:flex",
              mapShell ? "border-slate-800" : "border-slate-200"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  className: cn(
                    "flex h-9 w-52 items-center gap-2 rounded-lg border px-2 text-xs",
                    mapShell ? "border-slate-700 bg-slate-950/60 text-slate-400" : "border-slate-200 bg-white text-slate-500 shadow-sm"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-3.5 w-3.5" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        placeholder: "Buscar no mapa...",
                        className: cn(
                          "min-w-0 flex-1 bg-transparent outline-none",
                          mapShell ? "text-slate-200 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
                        )
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                    mapShell ? "border-slate-700" : "border-slate-200 bg-white shadow-sm"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[10px]", mapShell ? "text-slate-400" : "text-slate-500"), children: "DEMO" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: demoMode, onCheckedChange: setDemoMode })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: EMERGENCY_WHATSAPP,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "flex h-9 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20",
                  title: "Emergência / Suporte",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LifeBuoy, { className: "h-4 w-4" }),
                    "SOS"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: toggle,
                  className: cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition",
                    mapShell ? "border-slate-700 text-slate-300 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-green-50 hover:text-green-700"
                  ),
                  "aria-label": "Alternar tema",
                  children: theme === "dark" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "h-4 w-4" })
                }
              )
            ]
          }
        )
      ] })
    }
  );
}
const STORAGE_KEY = "nery-demo-mode";
function DemoProvider({ children }) {
  const [demoMode, setDemoModeState] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    setDemoModeState(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);
  const setDemoMode = (value2) => {
    setDemoModeState(value2);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(value2));
    }
  };
  const value = reactExports.useMemo(() => ({ demoMode, setDemoMode }), [demoMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DemoContext.Provider, { value, children });
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Página não encontrada" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "A página que você está procurando não existe ou foi movida." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Voltar ao início"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "Esta página não carregou" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Algo deu errado por aqui. Você pode tentar novamente ou voltar ao início." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Tentar novamente"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Voltar ao início"
        }
      )
    ] })
  ] }) });
}
const Route$b = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nery Logística" },
      { name: "description", content: "Plataforma de gestão logística e financeira da Nery." },
      { name: "author", content: "Nery Logística" },
      { property: "og:title", content: "Nery Logística" },
      {
        property: "og:description",
        content: "Plataforma de gestão logística e financeira da Nery."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Nery Logística" },
      {
        name: "twitter:description",
        content: "Plataforma de gestão logística e financeira da Nery."
      },
      {
        property: "og:image",
        content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7af7d6bf-f396-4f81-a485-7553420dd0f6/id-preview-2e9a8ee6--7f739fbe-ce9b-4f54-929f-b6d0e919b543.lovable.app-1779997135957.png"
      },
      {
        name: "twitter:image",
        content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7af7d6bf-f396-4f81-a485-7553420dd0f6/id-preview-2e9a8ee6--7f739fbe-ce9b-4f54-929f-b6d0e919b543.lovable.app-1779997135957.png"
      }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
      },
      { rel: "stylesheet", href: maplibreCss },
      { rel: "stylesheet", href: appCss }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "pt-BR", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$b.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DemoProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen w-full flex-col bg-background text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformTopNav, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-h-0 flex-1 overflow-x-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-right" })
  ] }) }) });
}
const $$splitComponentImporter$a = () => import("./torre-de-controle-BBpPoX8K.mjs");
const Route$a = createFileRoute("/torre-de-controle")({
  head: () => ({
    meta: [{
      title: "Torre de Controle - Nery Agro"
    }, {
      name: "description",
      content: "Mapa global, alertas proativos, KPIs OTIF, vendas, capacidade e rede integrada da fazenda."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./sustentabilidade-Bu96jYLh.mjs");
const Route$9 = createFileRoute("/sustentabilidade")({
  head: () => ({
    meta: [{
      title: "Sustentabilidade - Nery Agro"
    }, {
      name: "description",
      content: "Certificações, agroecologia, compostagem, APPs e pegada de carbono com registros reais."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./pecuaria-DBKNLpsL.mjs");
const Route$8 = createFileRoute("/pecuaria")({
  head: () => ({
    meta: [{
      title: "Pecuária e Animais - Nery Logística"
    }, {
      name: "description",
      content: "Gestão de animais, vacinação, reprodução, produção diária e pastagens com CRUD real e modo demo protegido."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./otimizacao-cogs-7H_KhBOM.mjs");
const Route$7 = createFileRoute("/otimizacao-cogs")({
  head: () => ({
    meta: [{
      title: "Otimização de COGS - Nery Agro"
    }, {
      name: "description",
      content: "Custo de mercadoria vendida e custo de servir com visibilidade por etapa, SKU, região, processo e cenário."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./logistica-CCal7-IJ.mjs");
const Route$6 = createFileRoute("/logistica")({
  head: () => ({
    meta: [{
      title: "Logística e Distribuição - Nery Logística"
    }, {
      name: "description",
      content: "Cadastro e acompanhamento de cargas, motoristas, rotas, frota, bases, roteirização, expedição, embalagens, cestas e fretes."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./inteligencia-xt2pJvWZ.mjs");
const Route$5 = createFileRoute("/inteligencia")({
  head: () => ({
    meta: [{
      title: "Inteligência - Nery Agro"
    }, {
      name: "description",
      content: "Relatórios, gráficos de desempenho, alertas de preços CEASA/CNA e perdas com causas."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./financeiro-D9O7A0ZX.mjs");
const Route$4 = createFileRoute("/financeiro")({
  head: () => ({
    meta: [{
      title: "Financeiro Agro - Nery Logística"
    }, {
      name: "description",
      content: "Gestão financeira agro completa com dados reais e modo demo separado."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./equipe-vendas-Dv9djcE-.mjs");
const Route$3 = createFileRoute("/equipe-vendas")({
  head: () => ({
    meta: [{
      title: "Equipe & Vendas - Nery Agro"
    }, {
      name: "description",
      content: "Vendas diretas, clientes, gestão de mão de obra e tarefas prioritárias da operação."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboard-DbWPY2EZ.mjs");
const Route$2 = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      title: "Torre de Controle - Nery Agro"
    }, {
      name: "description",
      content: "Visão consolidada da operação, logística, campo, financeiro, pecuária, sustentabilidade, inteligência e COGS."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./campo-CR4VB7Gl.mjs");
const Route$1 = createFileRoute("/campo")({
  head: () => ({
    meta: [{
      title: "Campo - Nery Logística"
    }, {
      name: "description",
      content: "Gestão de talhões, plantio, manejo, rastreabilidade e estimativa de safra."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-BARL37Bh.mjs");
const Route = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Nery Agro - Gestão agro em tempo real"
    }, {
      name: "description",
      content: "Plataforma de gestão agro que conecta campo, pecuária, logística, financeiro e sustentabilidade em tempo real."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const TorreDeControleRoute = Route$a.update({
  id: "/torre-de-controle",
  path: "/torre-de-controle",
  getParentRoute: () => Route$b
});
const SustentabilidadeRoute = Route$9.update({
  id: "/sustentabilidade",
  path: "/sustentabilidade",
  getParentRoute: () => Route$b
});
const PecuariaRoute = Route$8.update({
  id: "/pecuaria",
  path: "/pecuaria",
  getParentRoute: () => Route$b
});
const OtimizacaoCogsRoute = Route$7.update({
  id: "/otimizacao-cogs",
  path: "/otimizacao-cogs",
  getParentRoute: () => Route$b
});
const LogisticaRoute = Route$6.update({
  id: "/logistica",
  path: "/logistica",
  getParentRoute: () => Route$b
});
const InteligenciaRoute = Route$5.update({
  id: "/inteligencia",
  path: "/inteligencia",
  getParentRoute: () => Route$b
});
const FinanceiroRoute = Route$4.update({
  id: "/financeiro",
  path: "/financeiro",
  getParentRoute: () => Route$b
});
const EquipeVendasRoute = Route$3.update({
  id: "/equipe-vendas",
  path: "/equipe-vendas",
  getParentRoute: () => Route$b
});
const DashboardRoute = Route$2.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$b
});
const CampoRoute = Route$1.update({
  id: "/campo",
  path: "/campo",
  getParentRoute: () => Route$b
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$b
});
const rootRouteChildren = {
  IndexRoute,
  CampoRoute,
  DashboardRoute,
  EquipeVendasRoute,
  FinanceiroRoute,
  InteligenciaRoute,
  LogisticaRoute,
  OtimizacaoCogsRoute,
  PecuariaRoute,
  SustentabilidadeRoute,
  TorreDeControleRoute
};
const routeTree = Route$b._addFileChildren(rootRouteChildren)._addFileTypes();
function RouteError({ error, reset }) {
  const router2 = useRouter();
  console.error(error);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[60vh] items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold tracking-tight text-foreground", children: "Esta seção não carregou" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Algo deu errado ao carregar este módulo. Tente novamente ou volte ao início." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Tentar novamente"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Voltar ao início"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const queryClient = new QueryClient({
    // Falhas de query eram silenciosas (caíam para dados vazios). Aqui damos
    // feedback ao usuário. `id` fixo deduplica refetches que continuam falhando;
    // guard de SSR porque o toast só existe no cliente.
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof window === "undefined") return;
        toast.error("Não foi possível carregar os dados", {
          id: "query-error",
          description: error instanceof Error ? error.message : "Verifique a conexão com o Supabase."
        });
      }
    }),
    defaultOptions: {
      queries: {
        staleTime: 6e4,
        gcTime: 5 * 6e4,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1
      }
    }
  });
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Boundary por rota que preserva a top-nav (o __root tem o de tela cheia).
    defaultErrorComponent: RouteError
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  cn as c,
  router as r,
  useDemoMode as u
};
