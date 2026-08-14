import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import maplibreCss from "maplibre-gl/dist/maplibre-gl.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado por aqui. Você pode tentar novamente ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgroTorre" },
      { name: "description", content: "Plataforma de gestão logística e financeira da AgroTorre." },
      { name: "author", content: "AgroTorre" },
      { property: "og:title", content: "AgroTorre" },
      {
        property: "og:description",
        content: "Plataforma de gestão logística e financeira da AgroTorre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "AgroTorre" },
      {
        name: "twitter:description",
        content: "Plataforma de gestão logística e financeira da AgroTorre.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7af7d6bf-f396-4f81-a485-7553420dd0f6/id-preview-2e9a8ee6--7f739fbe-ce9b-4f54-929f-b6d0e919b543.lovable.app-1779997135957.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7af7d6bf-f396-4f81-a485-7553420dd0f6/id-preview-2e9a8ee6--7f739fbe-ce9b-4f54-929f-b6d0e919b543.lovable.app-1779997135957.png",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: maplibreCss },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Aplica o tema salvo ANTES do paint (sem flash). Default = escuro; "light" remove a
// classe → aplica o :root claro. Precisa do nonce da CSP (script inline sem nonce é
// bloqueado). O ThemeProvider realinha o estado React pós-mount.
const THEME_INIT_SCRIPT =
  "(function(){try{var t=localStorage.getItem('agrotorre-theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark')}else{d.classList.add('dark')}}catch(e){}})();";

function RootShell({ children }: { children: React.ReactNode }) {
  // Nonce por resposta (definido em src/server.ts via globalThis, só no servidor).
  const nonce =
    typeof window === "undefined"
      ? (globalThis as { __agrotorreNonce?: () => string | undefined }).__agrotorreNonce?.()
      : undefined;
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { DemoProvider } from "@/components/demo-provider";
import { AuthProvider } from "@/components/auth-provider";
import { OrgSwitcherBar } from "@/components/org-switcher-bar";
import { SemEmpresa } from "@/components/sem-empresa";
import { useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

// Toaster que segue o tema atual (claro/escuro).
function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-right" />;
}

// Rotas públicas (sem login): landing e telas de autenticação.
const PUBLIC_PATHS = new Set(["/", "/login"]);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <AppShell path={path} />
            <ThemedToaster />
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppShell({ path }: { path: string }) {
  // Landing e telas de auth: tela limpa, sem chrome do app, sem exigir login.
  if (PUBLIC_PATHS.has(path)) return <Outlet />;

  // Demais rotas exigem login (guarda no cliente — a sessão vive no localStorage).
  return (
    <RequireAuth>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        {/* `overflow-x-clip`, não `hidden`: `clip` + `visible` não coage o eixo
            Y para `auto`, então o <main> NÃO vira scroll container e os sticky
            de dentro (OrgSwitcherBar, abas do Talhão 360) continuam engatando. */}
        <main className="min-h-screen min-w-0 flex-1 overflow-x-clip pt-14 md:pt-0">
          <OrgSwitcherBar />
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  );
}

// Entrar no app exige DUAS coisas: sessão válida E vínculo com uma empresa.
//
// Só a sessão não basta. `handle_new_user` (supabase/schema.sql) só cria o
// vínculo em `organization_members` quando há convite casando pelo e-mail —
// quem se cadastra sem convite fica órfão: `current_org_id()` devolve NULL,
// toda policy nega, e a RLS de fato impede o vazamento. Mas a pessoa entrava no
// produto inteiro, via a sidebar, os menus e todas as telas, tudo vazio e sem
// explicação. A RLS protege o DADO; esta guarda protege a PORTA.
//
// A checagem é feita no render, não só em efeito: efeito roda depois do paint,
// e conteúdo protegido não pode chegar a pintar.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, orgId, orgLoading, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  // `orgLoading` é o que evita a tela de "sem empresa" piscar em todo login: a
  // sessão vem do localStorage (rápido) e o vínculo vem de uma consulta (lenta).
  if (loading || !session || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  // Super-admin da plataforma transita entre empresas e pode estar sem uma ativa
  // no primeiro acesso — o OrgSwitcherBar resolve isso lá dentro.
  if (!orgId && !isPlatformAdmin) return <SemEmpresa />;

  return <>{children}</>;
}
