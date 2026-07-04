---
name: supabase-data-patterns
description: Padrões de acesso a dados Supabase no AgroTorre (client Proxy lazy que degrada sem crash, isSupabaseConfigured, env VITE_ x process.env, React Query, realtime, modo DEMO) — use ao ler/gravar dados, configurar realtime ou mexer em env do Supabase.
---

# Dados Supabase no AgroTorre

Supabase Postgres + Auth + Realtime + Storage. Types gerados em `src/integrations/supabase/types.ts`.

## Cliente (`src/integrations/supabase/client.ts`)

- Importe sempre: `import { supabase } from "@/integrations/supabase/client";`.
- É um `Proxy` lazy: o client só é criado no primeiro acesso. Se faltar env var, NÃO lança — cria um client placeholder (`https://placeholder.supabase.co`) e loga erro; a UI segue viva em "modo degradado" (queries/realtime falham no nível de rede, tratadas pelo React Query / no-op).
- Antes de disparar realtime/queries que exigem backend real, cheque `isSupabaseConfigured` (exportado do mesmo arquivo):

```ts
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
if (isSupabaseConfigured) {
  const channel = supabase.channel("...").on(/* ... */).subscribe();
}
```

## Env vars (pegadinha real)

- O navegador só enxerga variáveis com prefixo `VITE_`. Cliente usa `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`; servidor (SSR) usa `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`.
- Fallback de build: `vite.config.ts` injeta as constantes `__SUPABASE_URL__` / `__SUPABASE_KEY__` (via `define`), então o client resolve na ordem `import.meta.env.VITE_*` -> `process.env.*` -> `BUILD_*`.
- Nunca commite `.env` (está no `.gitignore`). Após mudar env vars na Vercel, refaça o deploy.

## Consultas e realtime

- Busque dados via React Query (`@tanstack/react-query`); o `QueryClientProvider` já está no `__root.tsx`. Deixe o React Query cuidar de loading/erro/cache — não invente estado manual.
- Realtime só quando `isSupabaseConfigured`. Lembre de `supabase.removeChannel(channel)` no cleanup do effect.
- server_role NUNCA no cliente: existe `client.server.ts`, mas ele não é importado no bundle do cliente. Lógica servidor via `createServerFn` (ver skill `tanstack-start-patterns`).

## Modo DEMO

- Existe um modo demo em memória (`src/hooks/use-demo-mode.ts` + `DemoProvider`) para navegar sem backend. Respeite-o: dados demo não devem escrever no Supabase.

## Faça / Evite

- Faça: importar `supabase` do `client.ts`; guardar realtime com `isSupabaseConfigured`; tipar via `types.ts`; regenerar `types.ts` após mudança de schema.
- Evite: lançar/crashar quando falta env; usar `service_role`/`client.server.ts` no cliente; assumir prefixo `VITE_` no servidor (lá é sem prefixo); commitar `.env`.
- Gate (nvm carregado): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` e então `npm run typecheck && npm run lint && npm run test:run && npm run build`.
