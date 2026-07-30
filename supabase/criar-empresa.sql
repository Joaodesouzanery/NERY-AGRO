-- ============================================================================
-- AGROTORRE — Criar uma EMPRESA (organização) e vincular o usuário dono
-- ----------------------------------------------------------------------------
-- Por que isto é um script e não uma tela: o trigger `handle_new_user()` só
-- vincula um usuário novo a uma empresa se JÁ EXISTIR um convite
-- (organization_invites) com o e-mail dele. Ele NÃO cria empresa sozinho.
-- Então, se você criou o login antes de existir a empresa, o usuário fica sem
-- `organization_members` — e como a RLS inteira depende de `current_org_id()`,
-- ele entra no sistema e não enxerga nada. Este script conserta os dois casos.
--
-- COMO USAR: troque os dois valores abaixo e rode no SQL Editor do projeto
-- Supabase do AgroTorre. Idempotente: rodar de novo não duplica nada.
--
-- ⚠️ Rode no projeto CERTO. Confira no topo do SQL Editor que o projeto é o do
-- AgroTorre (tem as tabelas organizations / operation_records / field_records).
-- ============================================================================

do $$
declare
  -- ▼▼▼ EDITE ESTAS DUAS LINHAS ▼▼▼
  v_nome  text := 'Fazenda Matrice';
  v_email text := 'gerencia.adm.fin@fazendamatrice.com.br';
  -- ▲▲▲ EDITE ESTAS DUAS LINHAS ▲▲▲

  v_slug  text;
  v_org   uuid;
  v_user  uuid;
begin
  -- slug legível e estável a partir do nome ("Fazenda Matrice" → "fazenda-matrice")
  v_slug := regexp_replace(
              lower(translate(v_nome,
                'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
                'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')),
              '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  -- 1) Empresa (reaproveita se já existir com o mesmo slug)
  select id into v_org from public.organizations where slug = v_slug;
  if v_org is null then
    insert into public.organizations (nome, slug) values (v_nome, v_slug) returning id into v_org;
    raise notice 'Empresa criada: % (slug %, id %)', v_nome, v_slug, v_org;
  else
    raise notice 'Empresa já existia: % (id %)', v_nome, v_org;
  end if;

  -- 2) Usuário do Auth com esse e-mail (case-insensitive)
  select id into v_user from auth.users where lower(email) = lower(v_email);

  if v_user is null then
    -- Login ainda não criado: deixa o convite pronto. Quando você criar o
    -- usuário no Auth, o trigger handle_new_user() vincula sozinho.
    -- organization_invites não tem unique (org_id, email) — a chave é só o id —,
    -- então `on conflict` não protegeria: a checagem tem que ser explícita.
    if not exists (
      select 1 from public.organization_invites
      where org_id = v_org and lower(email) = lower(v_email)
    ) then
      insert into public.organization_invites (org_id, email, role)
      values (v_org, lower(v_email), 'owner');
    end if;
    raise notice 'Usuário % ainda não existe no Auth — convite de OWNER registrado.', v_email;
  else
    -- Login já criado: vincula agora (o trigger já rodou e não achou convite).
    insert into public.organization_members (org_id, user_id, role)
    values (v_org, v_user, 'owner')
    on conflict (org_id, user_id) do update set role = 'owner';
    -- convite pendente do mesmo e-mail vira lixo depois do vínculo
    delete from public.organization_invites where lower(email) = lower(v_email);
    raise notice 'Usuário % vinculado como OWNER da empresa %.', v_email, v_nome;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Conferência: rode e confirme que a linha aparece com role = owner.
-- ----------------------------------------------------------------------------
select
  o.nome  as empresa,
  o.slug,
  u.email as usuario,
  m.role,
  m.created_at
from public.organizations o
left join public.organization_members m on m.org_id = o.id
left join auth.users u on u.id = m.user_id
order by o.created_at, m.created_at;

-- Se o usuário aparecer em MAIS DE UMA empresa, atenção: `current_org_id()`
-- devolve a de vínculo MAIS ANTIGO. Para trocar a empresa padrão dele, apague o
-- vínculo antigo — ou, se for super-admin, use o seletor de empresa no topo da
-- tela (OrgSwitcherBar), que não depende disto.
