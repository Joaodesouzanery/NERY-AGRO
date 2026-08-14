-- ════════════════════════════════════════════════════════════════════════
-- Lockdown: public.platform_admin_emails estava SEM RLS
-- ------------------------------------------------------------------------
-- A tabela foi criada em 20260630120000_platform_admins.sql SEM
-- `enable row level security`. Em projeto Supabase, tabelas em `public` são
-- expostas pela API PostgREST; sem RLS, um visitante `anon`/`authenticated`
-- consegue `GET /rest/v1/platform_admin_emails` e ENUMERA os e-mails dos donos
-- da plataforma (neryadministrativo@ / joaodsouzanery@) — exatamente as contas
-- de maior privilégio, alvo ideal de phishing/brute-force.
--
-- Esta migração liga a RLS e revoga o acesso de anon/authenticated. A tabela é
-- lida apenas por funções `security definer` (handle_new_user, backfill), que
-- ignoram a RLS — logo a marcação de admin global continua funcionando.
-- Idempotente (roda seguro mesmo já aplicada).
--
-- Verificação (rode no SQL editor do Supabase após aplicar):
--   select relrowsecurity from pg_class where relname = 'platform_admin_emails';
--   -- deve retornar  t
--   select has_table_privilege('anon',          'public.platform_admin_emails', 'select'); -- f
--   select has_table_privilege('authenticated', 'public.platform_admin_emails', 'select'); -- f
-- Recomendado ainda: rodar os Advisors (Database → Advisors) e conferir que não
-- há mais nenhum "rls_disabled_in_public".
-- ════════════════════════════════════════════════════════════════════════

alter table public.platform_admin_emails enable row level security;
revoke all on public.platform_admin_emails from anon, authenticated;
-- Sem policy permissiva: apenas service_role e funções security-definer leem.
