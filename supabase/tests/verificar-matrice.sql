-- ============================================================================
-- Verificação da conta da FAZENDA MATRICE (conta, isolamento e escrita)
-- ----------------------------------------------------------------------------
-- Diferente de tests/rls_isolation.sql, este NÃO pede para você substituir UUID:
-- resolve tudo por e-mail. Rode no SQL Editor do projeto AgroTorre.
--
-- Tudo roda dentro de transações com ROLLBACK — não grava nada de verdade,
-- inclusive o teste de escrita. Pode rodar em produção.
--
-- Leia os "esperado:" de cada bloco. Qualquer divergência é problema real.
-- ============================================================================

-- ── 1) A CONTA existe e está vinculada como owner? ──────────────────────────
-- Esperado: uma linha, com email_confirmado preenchido, empresa "Fazenda
-- Matrice", papel "owner" e eh_admin_global = false.
-- Se email_confirmado vier NULL, o login FALHA com "Email not confirmed"
-- (a UI mostra mensagem genérica) — confirme o e-mail no painel de Auth.
select
  u.email,
  u.email_confirmed_at                                    as email_confirmado,
  u.last_sign_in_at                                       as ultimo_login,
  o.nome                                                  as empresa,
  m.role                                                  as papel,
  exists (select 1 from public.platform_admins pa where pa.user_id = u.id) as eh_admin_global
from auth.users u
left join public.organization_members m on m.user_id = u.id
left join public.organizations o on o.id = m.org_id
where lower(u.email) = 'gerencia.adm.fin@fazendamatrice.com.br';

-- ── 2) A conta enxerga a empresa CERTA? ─────────────────────────────────────
-- Esperado: org_resolvida = o id da Fazenda Matrice (não NULL).
-- NULL aqui significa "entra no sistema e não vê nada".
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', (select id from auth.users
                              where lower(email) = 'gerencia.adm.fin@fazendamatrice.com.br'))::text,
    true);

  select public.current_org_id()                                   as org_resolvida,
         (select nome from public.organizations
          where id = public.current_org_id())                      as empresa_resolvida;
rollback;

-- ── 3) ISOLAMENTO: ela só enxerga o que é dela? ─────────────────────────────
-- Esperado: em TODAS as linhas, fora_da_empresa = 0.
-- Qualquer número > 0 é vazamento de dado entre empresas.
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', (select id from auth.users
                              where lower(email) = 'gerencia.adm.fin@fazendamatrice.com.br'))::text,
    true);

  select 'operation_records' as tabela,
         count(*) as visivel,
         count(*) filter (where org_id <> public.current_org_id()) as fora_da_empresa
  from public.operation_records
  union all
  select 'field_records', count(*),
         count(*) filter (where org_id <> public.current_org_id())
  from public.field_records
  union all
  select 'financial_records', count(*),
         count(*) filter (where org_id <> public.current_org_id())
  from public.financial_records;
rollback;

-- ── 4) ESCRITA: o registro nasce com o org_id certo? ────────────────────────
-- O trigger set_org_id preenche org_id a partir de current_org_id(). Se ele
-- falhar, o registro nasce órfão e some da tela do próprio usuário que gravou.
-- Esperado: org_gravado = a empresa da Matrice, e igual_a_empresa = true.
-- (rollback no fim: nada fica no banco)
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', (select id from auth.users
                              where lower(email) = 'gerencia.adm.fin@fazendamatrice.com.br'))::text,
    true);

  insert into public.operation_records (area, module, payload)
  values ('logistica', 'remessa',
          jsonb_build_object('fazenda', '__TESTE_VERIFICACAO__', 'qtd_caixas', '1'));

  select org_id                                   as org_gravado,
         org_id = public.current_org_id()         as igual_a_empresa,
         payload->>'fazenda'                      as marcador
  from public.operation_records
  where payload->>'fazenda' = '__TESTE_VERIFICACAO__';
rollback;

-- ── 5) Quem é global hoje? ──────────────────────────────────────────────────
-- Esperado (após a migração 20260731120000): SÓ neryadministrativo@gmail.com.
select u.email as admin_global
from public.platform_admins pa
join auth.users u on u.id = pa.user_id
order by u.email;

-- ── 6) Sobrou registro sem empresa? ─────────────────────────────────────────
-- Registro com org_id nulo não aparece para NINGUÉM (nem para o admin global).
-- Esperado: 0 em todas as linhas.
select 'operation_records' as tabela, count(*) as sem_empresa
from public.operation_records where org_id is null
union all
select 'field_records', count(*) from public.field_records where org_id is null
union all
select 'financial_records', count(*) from public.financial_records where org_id is null;
