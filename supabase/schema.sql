-- ============================================================================
-- NERY AGRO — Schema consolidado e idempotente (estado FINAL: multi-tenant)
-- ----------------------------------------------------------------------------
-- Cole este arquivo inteiro no SQL Editor de um projeto Supabase NOVO para criar
-- toda a estrutura já no estado correto. É seguro re-executar (idempotente).
-- É a fonte canônica; a pasta supabase/migrations/ tem o histórico incremental.
--
-- Postura de segurança: MULTI-TENANT por Empresa (organization). Cada usuário
-- autenticado só vê os dados da sua empresa (org_id + RLS). Acesso anônimo NÃO
-- lê dados reais. Ver docs/auth-multitenant.md para criar empresas/funcionários.
-- Setup inicial: crie 1 organization + 1 organization_members (via este editor =
-- service role, ignora RLS); depois o app preenche org_id automaticamente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Organizações, membros e convites
-- ----------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists organization_members_user_idx on public.organization_members (user_id);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now()
);
create index if not exists organization_invites_email_idx on public.organization_invites (lower(email));

-- ----------------------------------------------------------------------------
-- 2) Funções auxiliares (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.organization_members
  where user_id = auth.uid() order by created_at asc limit 1;
$$;

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where org_id = p_org and user_id = auth.uid());
$$;

create or replace function public.app_set_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null then new.org_id := public.current_org_id(); end if;
  return new;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (org_id, user_id, role)
  select i.org_id, new.id, i.role from public.organization_invites i
  where lower(i.email) = lower(new.email)
  on conflict (org_id, user_id) do nothing;
  delete from public.organization_invites where lower(email) = lower(new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3) Tabelas de dados (com org_id)
-- ----------------------------------------------------------------------------
create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operation_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  area text not null,
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.field_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.animal_pdf_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  animal_record_id uuid not null,
  animal_identifier text not null,
  version integer not null default 1,
  file_path text not null,
  file_name text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  nome text not null,
  tipo text not null default 'geral',
  safra text,
  talhao_id text,
  valor_autorizado numeric not null default 0,
  valor_alocado numeric not null default 0,
  valor_realizado numeric not null default 0,
  vigencia_inicio date,
  vigencia_fim date,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  contrato text not null,
  tipo text not null default 'venda_graos',
  contraparte text,
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  talhao_id text,
  vigencia_inicio date,
  vigencia_fim date,
  qtd_contratada numeric not null default 0,
  qtd_liquidada numeric not null default 0,
  preco_unit numeric not null default 0,
  valor numeric not null default 0,
  status text not null default 'em_aberto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices (org_id líder)
create index if not exists financial_records_org_idx on public.financial_records (org_id, module, created_at desc);
create index if not exists operation_records_org_idx on public.operation_records (org_id, area, module, created_at desc);
create index if not exists field_records_org_idx on public.field_records (org_id, module, created_at desc);
create index if not exists animal_pdf_records_org_idx on public.animal_pdf_records (org_id, created_at desc);
create index if not exists cost_centers_org_idx on public.cost_centers (org_id);
create index if not exists contracts_org_idx on public.contracts (org_id);

-- ----------------------------------------------------------------------------
-- 4) Triggers de org_id + RLS por empresa (todas as tabelas de dados)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  data_tables text[] := array[
    'financial_records', 'operation_records', 'field_records',
    'animal_pdf_records', 'cost_centers', 'contracts'
  ];
begin
  foreach t in array data_tables loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop trigger if exists set_org_id on public.%I', t);
    execute format('create trigger set_org_id before insert on public.%I for each row execute function public.app_set_org_id()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (org_id = public.current_org_id())', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (org_id = public.current_org_id())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (org_id = public.current_org_id()) with check (org_id = public.current_org_id())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (org_id = public.current_org_id())', t || '_delete', t);
  end loop;
end $$;

-- RLS das tabelas de organização (leitura para membros da própria empresa)
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
grant select on public.organizations, public.organization_members, public.organization_invites to authenticated;

drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations for select to authenticated using (public.is_org_member(id));
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members for select to authenticated using (public.is_org_member(org_id));
drop policy if exists "organization_invites_select" on public.organization_invites;
create policy "organization_invites_select" on public.organization_invites for select to authenticated using (public.is_org_member(org_id));

-- ----------------------------------------------------------------------------
-- 5) Storage: buckets PRIVADOS isolados por empresa (1º segmento do path = org)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('animal-pdfs', 'animal-pdfs', false)
on conflict (id) do update set public = false;
insert into storage.buckets (id, name, public) values ('rdc-photos', 'rdc-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "org_files_select" on storage.objects;
create policy "org_files_select" on storage.objects for select to authenticated
  using (bucket_id in ('animal-pdfs', 'rdc-photos') and (storage.foldername(name))[1] = public.current_org_id()::text);
drop policy if exists "org_files_insert" on storage.objects;
create policy "org_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('animal-pdfs', 'rdc-photos') and (storage.foldername(name))[1] = public.current_org_id()::text);
drop policy if exists "org_files_update" on storage.objects;
create policy "org_files_update" on storage.objects for update to authenticated
  using (bucket_id in ('animal-pdfs', 'rdc-photos') and (storage.foldername(name))[1] = public.current_org_id()::text)
  with check (bucket_id in ('animal-pdfs', 'rdc-photos') and (storage.foldername(name))[1] = public.current_org_id()::text);
drop policy if exists "org_files_delete" on storage.objects;
create policy "org_files_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('animal-pdfs', 'rdc-photos') and (storage.foldername(name))[1] = public.current_org_id()::text);

-- ----------------------------------------------------------------------------
-- 6) Realtime
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tabs text[] := array['financial_records', 'operation_records', 'field_records', 'organization_members'];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array tabs loop
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception when duplicate_object then null; when undefined_table then null;
      end;
    end loop;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 7) Super-admins globais (acessam todas as empresas; trocam a empresa ativa)
-- ----------------------------------------------------------------------------
create table if not exists public.platform_admin_emails (email text primary key);
insert into public.platform_admin_emails (email) values
  ('neryadministrativo@gmail.com'), ('joaodsouzanery@gmail.com')
on conflict (email) do nothing;

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_active_org (
  user_id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- current_org_id() ciente de admin (sobrescreve a definição da seção 2)
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select case
    when public.is_platform_admin()
      then (select org_id from public.admin_active_org where user_id = auth.uid())
    else (select org_id from public.organization_members where user_id = auth.uid()
          order by created_at asc limit 1)
  end;
$$;

-- handle_new_user() ciente de admin (sobrescreve a da seção 2)
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

insert into public.platform_admins (user_id)
select u.id from auth.users u
join public.platform_admin_emails e on lower(e.email) = lower(u.email)
on conflict do nothing;

alter table public.platform_admins enable row level security;
alter table public.admin_active_org enable row level security;
grant select on public.platform_admins to authenticated;
grant select, insert, update, delete on public.admin_active_org to authenticated;

drop policy if exists "platform_admins_self" on public.platform_admins;
create policy "platform_admins_self" on public.platform_admins for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin_active_org_select" on public.admin_active_org;
create policy "admin_active_org_select" on public.admin_active_org for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin_active_org_insert" on public.admin_active_org;
create policy "admin_active_org_insert" on public.admin_active_org for insert to authenticated with check (user_id = auth.uid() and public.is_platform_admin());
drop policy if exists "admin_active_org_update" on public.admin_active_org;
create policy "admin_active_org_update" on public.admin_active_org for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_platform_admin());

-- Admins enxergam todas as empresas/membros (sobrescreve políticas da seção 4)
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations for select to authenticated using (public.is_org_member(id) or public.is_platform_admin());
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members for select to authenticated using (public.is_org_member(org_id) or public.is_platform_admin());
