-- ============================================================================
-- Conta global ÚNICA: só neryadministrativo@gmail.com enxerga todas as empresas
-- ----------------------------------------------------------------------------
-- Até aqui havia DOIS super-admins (neryadministrativo@ e joaodsouzanery@), e
-- super-admin atravessa a RLS de todas as organizações — inclusive a da Fazenda
-- Matrice, que agora é cliente. Uma conta global a mais é uma porta a mais para
-- o dado de um cliente.
--
-- joaodsouzanery@ deixa de ser global e passa a ser membro da empresa padrão.
-- Sem esse vínculo ele ficaria SEM empresa: `current_org_id()` devolveria NULL
-- e ele entraria no sistema sem enxergar nada.
--
-- Idempotente: rodar de novo não faz nada.
-- ============================================================================

do $$
declare
  v_email text := 'joaodsouzanery@gmail.com';
  v_org   uuid;
  v_user  uuid;
begin
  -- 1) Sai da allowlist, para não voltar a virar admin se o login for recriado
  --    (handle_new_user() consulta esta tabela a cada cadastro).
  delete from public.platform_admin_emails where lower(email) = lower(v_email);

  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise notice 'Usuário % não existe no Auth — nada a rebaixar.', v_email;
    return;
  end if;

  -- 2) Perde o privilégio global e a empresa ativa de admin (que só admin usa).
  delete from public.platform_admins where user_id = v_user;
  delete from public.admin_active_org where user_id = v_user;

  -- 3) Ganha vínculo com a empresa padrão. Sem isto ele fica sem org nenhuma.
  select id into v_org from public.organizations where slug = 'nery-agro-padrao';
  if v_org is null then
    -- fallback: a empresa mais antiga que não seja de cliente externo
    select id into v_org from public.organizations order by created_at asc limit 1;
  end if;

  if v_org is null then
    raise warning 'Nenhuma empresa cadastrada — % ficou SEM empresa. Crie uma e rode supabase/criar-empresa.sql.', v_email;
  else
    insert into public.organization_members (org_id, user_id, role)
    values (v_org, v_user, 'owner')
    on conflict (org_id, user_id) do update set role = 'owner';
    raise notice 'Usuário % rebaixado a owner da empresa %.', v_email, v_org;
  end if;
end $$;

-- Conferência: a primeira query deve retornar SÓ neryadministrativo@.
select u.email as admin_global
from public.platform_admins pa
join auth.users u on u.id = pa.user_id
order by u.email;

select o.nome as empresa, u.email as usuario, m.role
from public.organization_members m
join public.organizations o on o.id = m.org_id
join auth.users u on u.id = m.user_id
order by o.nome, u.email;
