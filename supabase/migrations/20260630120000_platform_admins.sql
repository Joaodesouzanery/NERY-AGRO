-- ════════════════════════════════════════════════════════════════════════
-- Super-admins globais (donos da plataforma): acessam TODAS as empresas e
-- transitam entre elas (uma empresa ativa por vez). Os e-mails são designados
-- aqui; as SENHAS você define ao criar os usuários no Supabase Auth (NÃO ficam
-- no repositório). Requer a migração de auth/multi-tenant aplicada antes.
-- ════════════════════════════════════════════════════════════════════════

-- E-mails designados como admin global (data-driven; adicione mais se precisar).
create table if not exists public.platform_admin_emails (
  email text primary key
);
insert into public.platform_admin_emails (email) values
  ('neryadministrativo@gmail.com'),
  ('joaodsouzanery@gmail.com')
on conflict (email) do nothing;

-- Quem é admin global (por user_id de auth.users).
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Empresa "ativa" escolhida por cada admin (para transitar entre empresas).
create table if not exists public.admin_active_org (
  user_id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- current_org_id(): admin global usa a empresa ATIVA; demais usam o vínculo único.
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select case
    when public.is_platform_admin()
      then (select org_id from public.admin_active_org where user_id = auth.uid())
    else (select org_id from public.organization_members where user_id = auth.uid()
          order by created_at asc limit 1)
  end;
$$;

-- handle_new_user(): vincula convites E marca admin global se o e-mail estiver na lista.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (org_id, user_id, role)
  select i.org_id, new.id, i.role from public.organization_invites i
  where lower(i.email) = lower(new.email)
  on conflict (org_id, user_id) do nothing;
  delete from public.organization_invites where lower(email) = lower(new.email);

  if exists (select 1 from public.platform_admin_emails where lower(email) = lower(new.email)) then
    insert into public.platform_admins (user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end; $$;

-- Backfill: usuários já existentes cujo e-mail está na lista viram admin.
insert into public.platform_admins (user_id)
select u.id from auth.users u
join public.platform_admin_emails e on lower(e.email) = lower(u.email)
on conflict do nothing;

-- ── RLS ──
alter table public.platform_admins enable row level security;
alter table public.admin_active_org enable row level security;
grant select on public.platform_admins to authenticated;
grant select, insert, update, delete on public.admin_active_org to authenticated;

drop policy if exists "platform_admins_self" on public.platform_admins;
create policy "platform_admins_self" on public.platform_admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "admin_active_org_select" on public.admin_active_org;
create policy "admin_active_org_select" on public.admin_active_org
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin_active_org_insert" on public.admin_active_org;
create policy "admin_active_org_insert" on public.admin_active_org
  for insert to authenticated with check (user_id = auth.uid() and public.is_platform_admin());
drop policy if exists "admin_active_org_update" on public.admin_active_org;
create policy "admin_active_org_update" on public.admin_active_org
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_platform_admin());

-- Admins enxergam TODAS as empresas (para o seletor) e todos os membros.
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations
  for select to authenticated using (public.is_org_member(id) or public.is_platform_admin());
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select to authenticated using (public.is_org_member(org_id) or public.is_platform_admin());

-- NOTA: crie os 2 usuários em Authentication → Users (Add user), com os e-mails
-- acima e a senha que você definir. O trigger acima os marca como admin global.
-- Já existentes? O backfill acima já cuidou. Eles escolhem a empresa ativa no topo.
