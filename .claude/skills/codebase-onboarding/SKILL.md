---
name: codebase-onboarding
description: Mapa do repositório AgroTorre para se orientar rápido — use ao começar no projeto, procurar onde algo mora, entender arquitetura/dados/mapa ou antes de mexer numa área nova.
---

# Onboarding do repositório

AgroTorre — SaaS de gestão agro (mapa operacional, Logística, Financeiro, Campo, Pecuária, Sustentabilidade, Inteligência, Torre de Controle, COGS). Design mono-dark, cantos quadrados.

**Stack**: TanStack Start (React 19 + Router + Query) · Vite 7 · TS 5.8 strict (`@/*` → `src/*`) · Tailwind 4 + shadcn/Radix · Supabase (Postgres/Auth/Realtime/Storage/RLS) · MapLibre GL · Recharts · zod + react-hook-form · Vitest. Node 20 via nvm (fora do PATH).

## Layout de `src/`

- `routes/` — rotas do TanStack Router. `__root.tsx` (RequireAuth + `<head>`), `login.tsx`.
- `components/` — UI. Componentes de página grandes vivem aqui (ex.: `unified-map-page.tsx`, `control-tower-page.tsx`) além de `components/ui/*` (shadcn).
- `features/` — módulos de domínio (ex.: `features/rdc/*`, `features/talhao-360/schemas`).
- `lib/` — lógica pura: dados, métricas, parsing.
- `hooks/` — hooks (ex.: `use-idle-logout.ts`).
- `integrations/supabase/` — `client.ts` (cliente, degrada sem crash), `types.ts` (types gerados), `client.server.ts` (service_role, **nunca** no bundle do cliente).
- `server.ts` — entrada SSR; anexa headers de segurança (CSP/HSTS/etc).

## Arquivos-chave (ler primeiro)

- `src/lib/connected-agro-data.ts` — modelo de dados + builders (`buildUnifiedMapModel`, `buildNetworkMap`) + métricas. Ponto de partida para dados.
- `src/components/interactive-map.tsx` — mapa MapLibre; pinos via `mapIconConfig` + `KEY_TO_ICON` + `ICON_PATHS` + `categoryNames`.
- `src/components/unified-map-page.tsx` — mapa operacional + filtro/legenda por módulo.
- `src/components/auth-provider.tsx` — sessão, org ativa, super-admin, idle logout.
- `src/server.ts` — SSR + headers/CSP (libere origem externa nova aqui).

## Docs (`docs/`)

`auth-multitenant.md`, `financeiro-architecture.md`, `modules-rich-tabs-blueprint.md`, `talhao-360-mvp.md`. Migrações em `supabase/migrations/`; schema consolidado em `supabase/schema.sql`.

## Gate antes de concluir mudança

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```

`main` = **produção** (push dispara deploy na Vercel). Rode o gate antes de commitar; leia o `CLAUDE.md`/memória para convenções e ações pendentes.

## Faça / Evite

- Faça: começar por `connected-agro-data.ts` (dados) e `server.ts` (SSR/segurança) para entender o fluxo.
- Faça: seguir os `docs/` da área antes de alterar Auth, Financeiro ou mapa.
- Evite: importar `client.server.ts` no cliente; editar migração já aplicada (crie uma nova).
- Evite: adicionar origem externa sem liberá-la na CSP em `server.ts`.
