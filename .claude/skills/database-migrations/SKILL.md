---
name: database-migrations
description: Como escrever migrações Supabase no AgroTorre (novo arquivo idempotente em supabase/migrations, schema.sql canônico, regenerar types) — use ao criar/alterar tabelas, colunas, policies, triggers ou funções no Postgres.
---

# Migrações Supabase no AgroTorre

Migrações em `supabase/migrations/<timestamp>_<nome>.sql`. Consolidado canônico idempotente em `supabase/schema.sql`.

## Regra de ouro

- NUNCA reescreva uma migração já aplicada em produção — crie SEMPRE um arquivo NOVO. `main` = produção (push dispara auto-deploy na Vercel), então uma migração antiga alterada não roda de novo e diverge do banco real.
- Nomeie por timestamp crescente: `20260628120000_create_contracts_cost_centers.sql` (padrão dos arquivos existentes).

## Idempotência (obrigatória)

Toda migração deve poder rodar 2x sem erro:

- Tabelas/índices/colunas: `create table if not exists`, `create index if not exists`, `alter table ... add column if not exists`.
- Funções/triggers: `create or replace function ...`; para trigger, `drop trigger if exists <nome> on public.<t>;` antes do `create trigger`.
- Policies: `drop policy if exists "<nome>" on public.<t>;` antes do `create policy` (o `schema.sql` já faz isso).

```sql
create table if not exists public.exemplo (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null
  -- ...
);
alter table public.exemplo enable row level security;
-- + trigger set_org_id + 4 policies por org (ver skill supabase-rls-multitenant)
```

## Nova tabela tenant

- Inclua `org_id`, `enable row level security`, o trigger `set_org_id` e as 4 policies escopadas por `public.current_org_id()`. Detalhes na skill `supabase-rls-multitenant`. Espelhe a mudança no `supabase/schema.sql` (fonte canônica).

## Depois de mudar o schema

- Regenere os types: `src/integrations/supabase/types.ts` (arquivo gerado — não editar à mão). Sem isso, o TypeScript não vê a coluna/tabela nova e o gate quebra.
- Aplicação no banco é ação do usuário (rodar a migração no Supabase); não assuma que já rodou.

## Faça / Evite

- Faça: arquivo novo com timestamp; tudo idempotente; espelhar no `schema.sql`; regenerar `types.ts`; validar isolamento com `supabase/tests/rls_isolation.sql`.
- Evite: editar migração já em produção; `create table` sem `if not exists`; esquecer RLS/policies numa tabela tenant; editar `types.ts` na mão.
- Gate (nvm carregado): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` e então `npm run typecheck && npm run lint && npm run test:run && npm run build`.
