---
name: supabase-rls-multitenant
description: Multi-tenant por org_id + RLS no AgroTorre (current_org_id(), trigger set_org_id, organization_members/invites, super-admins via platform_admins/admin_active_org) — use ao criar tabelas, escrever/depurar policies RLS ou tratar isolamento entre empresas.
---

# Multi-tenant + RLS no AgroTorre

Isolamento por `org_id` + Row Level Security. RLS é a segurança REAL dos dados — filtro no cliente é só UX. Canônico em `supabase/schema.sql`.

## Peças-chave (em `supabase/schema.sql`)

- `public.current_org_id()`: retorna o `org_id` do usuário atual (via `organization_members` por `auth.uid()`); para super-admin, a empresa ativa.
- `public.is_org_member(p_org)`: `true` se o usuário pertence à org.
- Trigger `set_org_id` (função `public.app_set_org_id()`): em `before insert`, preenche `new.org_id := public.current_org_id()` quando vier nulo. Ligado em cada tabela tenant.
- Tabelas de tenancy: `organization_members` (user_id, org_id, role) e `organization_invites` (aceite automático no signup por trigger).
- Super-admins globais: `platform_admins` + `admin_active_org` (a barra `OrgSwitcherBar` no topo troca a empresa ativa; `current_org_id()` reflete isso).

## Padrão de policy por tabela tenant

Cada tabela com `org_id` recebe: `enable row level security`, o trigger `set_org_id` e 4 policies escopadas por org (o `schema.sql` gera via `format(...)`):

```sql
alter table public.<t> enable row level security;
create policy "<t>_select" on public.<t> for select to authenticated
  using (org_id = public.current_org_id());
create policy "<t>_insert" on public.<t> for insert to authenticated
  with check (org_id = public.current_org_id());
-- update: using + with check; delete: using — ambos = public.current_org_id()
```

- Storage (`animal-pdfs`, `rdc-photos`): policies exigem que o 1º segmento do path seja `current_org_id()::text` — grave arquivos sob `<org_id>/...`.

## Validação

- Teste de isolamento em `supabase/tests/rls_isolation.sql` — rode após mudar policies para garantir que uma org não enxerga a outra.

## Faça / Evite

- Faça: dar `org_id` + RLS + trigger `set_org_id` a TODA nova tabela tenant; escopar policies por `public.current_org_id()`; salvar Storage sob `<org_id>/`; validar com `rls_isolation.sql`.
- Faça: nova mudança de schema = NOVA migração idempotente (ver skill `database-migrations`) + regenerar `src/integrations/supabase/types.ts`.
- Evite: setar `org_id` na mão no insert (o trigger faz); policies `using (true)` em dados tenant (vaza entre empresas); editar migração já aplicada em produção; confiar em filtro de cliente como segurança.
- Gate (nvm carregado): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` e então `npm run typecheck && npm run lint && npm run test:run && npm run build`.
