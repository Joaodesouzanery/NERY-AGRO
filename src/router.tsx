import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { RouteError } from "@/components/route-error";

export const getRouter = () => {
  const queryClient = new QueryClient({
    // Falhas de query eram silenciosas (caíam para dados vazios). Aqui damos
    // feedback ao usuário. `id` fixo deduplica refetches que continuam falhando;
    // guard de SSR porque o toast só existe no cliente.
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof window === "undefined") return;
        toast.error("Não foi possível carregar os dados", {
          id: "query-error",
          description:
            error instanceof Error ? error.message : "Verifique a conexão com o Supabase.",
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });

  // Nonce da CSP daquela resposta (definido em src/server.ts via globalThis, só no
  // servidor). O <Scripts>/<HeadContent> do TanStack Start aplica esse nonce a todos
  // os scripts inline de hidratação, permitindo uma CSP sem 'unsafe-inline'.
  const nonce =
    typeof window === "undefined"
      ? (globalThis as { __agrotorreNonce?: () => string | undefined }).__agrotorreNonce?.()
      : undefined;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Boundary por rota que preserva a top-nav (o __root tem o de tela cheia).
    defaultErrorComponent: RouteError,
    ...(nonce ? { ssr: { nonce } } : {}),
  });

  return router;
};
