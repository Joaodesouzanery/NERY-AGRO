-- ============================================================================
-- Teste de aceitação: isolamento multi-tenant (RLS por empresa)
-- ----------------------------------------------------------------------------
-- Rode no SQL Editor do Supabase APÓS:
--   1) aplicar as migrações de auth/multi-tenant e storage;
--   2) criar 2 empresas e 1 usuário de teste em CADA (ver docs/auth-multitenant.md);
--   3) cada usuário ter ao menos 1 registro (ex.: um lançamento no Financeiro).
--
-- COMO USAR:
--   1) Descubra os UUIDs dos usuários de teste (copie os ids retornados):
--        select id, email from auth.users order by created_at desc;
--   2) SUBSTITUA <UUID_USUARIO_A> e <UUID_USUARIO_B> abaixo pelos ids reais
--      (mantendo as aspas). Se NÃO substituir, o Postgres dá o erro
--      "invalid input syntax for type uuid: <UUID_USUARIO_A>".
--
-- RLS só se aplica a roles NÃO-owner; por isso usamos `set local role authenticated`
-- + simulamos o JWT (auth.uid() lê request.jwt.claims->>'sub').
-- (Não use contas super-admin aqui — elas enxergam a empresa ativa selecionada.)
-- ============================================================================

-- ───────────────────────── Usuário A (empresa A) ─────────────────────────
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', '<UUID_USUARIO_A>')::text, true);

  -- Empresa resolvida para A (deve ser a empresa A):
  select public.current_org_id() as org_do_usuario_a;

  -- Isolamento: TODO registro visível deve pertencer à empresa de A.
  -- Esperado: total_visivel == da_minha_empresa (e fora_da_empresa = 0).
  select
    count(*)                                                      as total_visivel,
    count(*) filter (where org_id = public.current_org_id())     as da_minha_empresa,
    count(*) filter (where org_id <> public.current_org_id())    as fora_da_empresa  -- deve ser 0
  from public.financial_records;
rollback;

-- ───────────────────────── Usuário B (empresa B) ─────────────────────────
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', '<UUID_USUARIO_B>')::text, true);

  select public.current_org_id() as org_do_usuario_b;  -- deve ser DIFERENTE da de A

  select
    count(*)                                                      as total_visivel,
    count(*) filter (where org_id = public.current_org_id())     as da_minha_empresa,
    count(*) filter (where org_id <> public.current_org_id())    as fora_da_empresa  -- deve ser 0
  from public.financial_records;
rollback;

-- ✅ Passou se: org_do_usuario_a <> org_do_usuario_b, e em ambos os blocos
--    fora_da_empresa = 0 (nenhum registro de outra empresa vazou).
-- Repita trocando financial_records por operation_records / field_records /
-- cost_centers / contracts para cobrir todas as tabelas.
