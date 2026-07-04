---
name: tanstack-start-patterns
description: Padrões de TanStack Start (rotas file-based, head/meta, SSR, server functions, guarda de auth) no AgroTorre — use ao criar/editar rotas em src/routes, server functions, SSR ou middleware de auth.
---

# TanStack Start no AgroTorre

Stack: TanStack Start (React 19 + Router + Query), Vite 7, SSR via Nitro/Vercel. Alias `@/*` -> `src/*`.

## Rotas file-based (`src/routes/`)

- Uma rota = um arquivo. Ex.: `financeiro.tsx` -> `/financeiro`; `campo_.talhoes_.$fieldId.tsx` -> `/campo/talhoes/:fieldId` (`_` corta o layout aninhado, `$` é param).
- Sempre exporte `Route` via `createFileRoute("/caminho")({ ... })`. A raiz usa `createRootRouteWithContext<{ queryClient: QueryClient }>()` em `src/routes/__root.tsx`.
- Meta/título por rota no `head: () => ({ meta: [...], links: [...] })`. O `__root.tsx` já define o `title` base "AgroTorre" e as fontes (Google Fonts) + CSS; sobrescreva `title`/`description` na rota quando fizer sentido.

```tsx
export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro · AgroTorre" }] }),
  component: FinanceiroPage,
});
```

## SSR e shell

- `__root.tsx` monta `RootShell` (`<html lang="pt-BR" className="dark">` + `<HeadContent />` + `<Scripts />`) e `RootComponent` (providers: Query -> Theme -> Auth -> Demo).
- Entrada SSR real: `src/server.ts` — anexa CSP/HSTS/X-Frame-Options/etc. em TODA resposta. Ao usar origem externa nova, libere-a na diretiva certa da CSP.

## Guarda de auth (cliente)

- Rotas públicas em `PUBLIC_PATHS` de `__root.tsx`: `/`, `/login`, `/redefinir-senha`. Todas as outras passam por `RequireAuth`, que lê `useAuth()` e redireciona para `/login` se não houver `session` (a sessão vive no `localStorage`).
- Para uma rota pública nova, adicione o path em `PUBLIC_PATHS`.

## Server functions + middleware de auth

- Server logic via `createServerFn` (NÃO Edge Functions) — modelo em `src/lib/api/example.functions.ts`. Valide input com `.inputValidator(z.object({...}))`; o corpo do `.handler` roda só no servidor (imports usados só lá, e `*.server.ts`, saem do bundle do cliente).
- Bearer token: `attachSupabaseAuth` (client middleware, `src/integrations/supabase/auth-attacher.ts`) é registrado como `functionMiddleware` global em `src/start.ts` e injeta `Authorization: Bearer <access_token>`.
- Do lado servidor, `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`) valida o token com `supabase.auth.getClaims` e injeta `{ supabase, userId, claims }` no `context`. Use-o via `.middleware([requireSupabaseAuth])` em server fns protegidas.

## Faça / Evite

- Faça: exportar `Route` com `createFileRoute`; strings visíveis em pt-BR; validar input de server fn com zod; redirecionar rota nova pública via `PUBLIC_PATHS`.
- Faça: rodar o gate antes de concluir (carregue o nvm): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` e então `npm run typecheck && npm run lint && npm run test:run && npm run build`.
- Evite: colocar segredos/`service_role` em código do cliente; lógica servidor em módulo sem `.server.ts` ou fora do `.handler` (ela vaza pro bundle); esquecer de liberar origem nova na CSP de `src/server.ts`.
