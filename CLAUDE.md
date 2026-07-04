# AgroTorre — Guia do projeto (CLAUDE.md)

AgroTorre é um SaaS de gestão agro: mapa operacional unificado + módulos de Logística,
Financeiro, Campo, Pecuária, Sustentabilidade, Inteligência, Torre de Controle e
Otimização de COGS. Design **mono-dark, cantos quadrados**.

## Stack

- **TanStack Start** (React 19 + Router + Query) · **Vite 7** · **TypeScript 5.8** (strict, alias `@/*` → `src/*`)
- **Tailwind 4** + **shadcn/Radix** + **lucide-react** + **sonner**
- **Supabase** (Postgres + Auth + Realtime + Storage + RLS)
- **MapLibre GL** · **Recharts** · **jspdf/jspdf-autotable** + **xlsx** · **react-hook-form + zod**
- **Vitest** + testing-library · **ESLint** (flat) + **Prettier** · **husky** + **lint-staged**
- Deploy: **Vercel** (preset Nitro). **Node 20 via nvm**.

## Comandos (Node via nvm — NÃO está no PATH padrão)

Carregue o nvm antes de qualquer comando de node/npm:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
```

- Dev: `npm run dev` (porta 8080) · Typecheck: `npm run typecheck` · Testes: `npm run test:run`
- Lint: `npm run lint` (**0 erros**; ~9 warnings pré-existentes em `src/components/ui/*`) · Build: `npm run build`

## Gate de verificação (rodar ANTES de dar qualquer tarefa por concluída)

`typecheck` · `lint` (0 erros) · `test:run` (todos verdes) · `build`.
Ao mexer em rota/SSR, faça o **smoke SSR**: suba `npm run dev` e `fetch` em `/`, `/login`,
`/torre-de-controle` (esperar **200**). O pre-commit (husky) já roda
`lint-staged → typecheck → test:run` — carregue o nvm, senão `npx` falha.

## Commit e deploy

- `main` = **produção**; push na `main` dispara **auto-deploy na Vercel**.
- Rode o gate antes de commitar. Toda mensagem de commit termina com:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Push só quando o usuário autorizar.** **Nunca** commitar `.env` nem segredos
  (`.env`, `.vercel` estão no `.gitignore`).

## Env / Supabase (pegadinhas reais)

- O navegador só enxerga `VITE_*`. Chaves: `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`
  (server) e `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` (cliente); `vite.config.ts`
  injeta `__SUPABASE_URL__`/`__SUPABASE_KEY__` como fallback no build. Cliente:
  `src/integrations/supabase/client.ts` (degrada sem crashar; helper `isSupabaseConfigured`).
- Multi-tenant por `org_id` + **RLS** (`current_org_id()`, trigger `set_org_id`,
  `organization_members`, super-admins via `platform_admins`/`admin_active_org`).
  **RLS é a segurança real dos dados.**
- **Não editar migração já aplicada** em `supabase/migrations/` — crie uma **nova**
  (idempotente). `supabase/schema.sql` é o canônico. Após mudar schema, regenere
  `src/integrations/supabase/types.ts`. `service_role` **nunca** no cliente.

## Segurança (headers)

`src/server.ts` anexa **CSP** + **HSTS** + **X-Frame-Options: DENY** + **nosniff** +
**Referrer/Permissions-Policy** em toda resposta. **Regra da CSP:** ao usar uma origem
externa nova (fonte, CDN, API), libere-a na diretiva certa (`connect-src`/`img-src`/
`style-src`/`font-src`) — senão quebra em produção.

## Estilo

Prettier (printWidth 100, aspas duplas, `semi`, `trailingComma: all`). ESLint flat
(`@typescript-eslint/no-explicit-any` = warn; não-usados com prefixo `_`). Strings
visíveis ao usuário em **pt-BR**. Imite a densidade de comentário e a nomenclatura do
arquivo vizinho. KISS/DRY/YAGNI.

## Onde as coisas ficam

```
src/routes/        rotas file-based + head()/meta + RequireAuth (__root.tsx)
src/components/     UI (ui/ = shadcn); interactive-map.tsx, unified-map-page.tsx, auth-provider.tsx
src/features/       módulos (rdc, talhao-360, ...)
src/lib/            regra de negócio, métricas (*-metrics.ts), connected-agro-data.ts, utils (cn())
src/hooks/          hooks (use-idle-logout.ts, ...)
src/integrations/   Supabase (client.ts, client.server.ts, types.ts, auth-*)
src/server.ts       entrada SSR + headers de segurança
supabase/           schema.sql (canônico) + migrations/ + seed.sql
docs/               documentação de arquitetura
```

## Skills e agents deste repo

`.claude/skills/` (disparam por intenção) e `.claude/agents/` (delegados) trazem
capacidades afiadas neste stack — do gate de verificação a padrões de Supabase/MapLibre.
Detalhes e ajustes em [.claude/README.md](.claude/README.md).
