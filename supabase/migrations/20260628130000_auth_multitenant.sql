-- ════════════════════════════════════════════════════════════════════════
-- Auth multi-tenant: Empresas (organizations), Funcionários (members),
-- convites por e-mail, e isolamento por org_id + RLS em TODAS as tabelas.
-- Idempotente. Padrão: trigger preenche org_id no insert; RLS filtra por empresa.
-- Veja docs/auth-multitenant.md para o playbook (criar empresa / add funcionário).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1) Tabelas de organização ──────────────────────────────────────────
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

-- ── 2) Funções auxiliares (SECURITY DEFINER: rodam como owner, ignoram RLS) ──
create or replace function public.current_org_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id
  from public.organization_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1;
$$;

create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = p_org and user_id = auth.uid()
  );
$$;

-- Trigger fn: preenche org_id no insert quando o cliente não envia.
create or replace function public.app_set_org_id()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.org_id is null then
    new.org_id := public.current_org_id();
  end if;
  return new;
end;
$$;

-- Trigger em auth.users: ao criar usuário, converte convites do e-mail em membros.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.organization_members (org_id, user_id, role)
  select i.org_id, new.id, i.role
  from public.organization_invites i
  where lower(i.email) = lower(new.email)
  on conflict (org_id, user_id) do nothing;

  delete from public.organization_invites where lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3) Empresa padrão + vincular usuários existentes ───────────────────
insert into public.organizations (nome, slug)
values ('Nery Agro — Empresa Padrão', 'nery-agro-padrao')
on conflict (slug) do nothing;

do $$
declare
  default_org uuid;
begin
  select id into default_org from public.organizations where slug = 'nery-agro-padrao';

  -- todos os usuários que já existem entram como owner da empresa padrão
  insert into public.organization_members (org_id, user_id, role)
  select default_org, u.id, 'owner' from auth.users u
  on conflict (org_id, user_id) do nothing;
end $$;

-- ── 4) org_id + trigger + RLS por empresa em TODAS as tabelas de dados ──
do $$
declare
  t text;
  data_tables text[] := array[
    'financial_records', 'operation_records', 'field_records',
    'animal_pdf_records', 'cost_centers', 'contracts'
  ];
  default_org uuid;
begin
  select id into default_org from public.organizations where slug = 'nery-agro-padrao';

  foreach t in array data_tables loop
    -- coluna + backfill + not null
    execute format('alter table public.%I add column if not exists org_id uuid', t);
    execute format('update public.%I set org_id = %L where org_id is null', t, default_org);
    execute format('alter table public.%I alter column org_id set not null', t);

    -- FK p/ organizations (guard idempotente)
    if not exists (select 1 from pg_constraint where conname = t || '_org_fk') then
      execute format(
        'alter table public.%I add constraint %I foreign key (org_id) references public.organizations (id) on delete cascade',
        t, t || '_org_fk'
      );
    end if;

    -- índice com org_id líder
    execute format('create index if not exists %I on public.%I (org_id, created_at desc)', t || '_org_idx', t);

    -- trigger de preenchimento automático do org_id
    execute format('drop trigger if exists set_org_id on public.%I', t);
    execute format(
      'create trigger set_org_id before insert on public.%I for each row execute function public.app_set_org_id()',
      t
    );

    -- RLS por empresa (substitui as policies abertas)
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (org_id = public.current_org_id())',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (org_id = public.current_org_id())',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (org_id = public.current_org_id()) with check (org_id = public.current_org_id())',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (org_id = public.current_org_id())',
      t || '_delete', t
    );
  end loop;
end $$;

-- ── 5) RLS nas tabelas de organização (leitura para membros da própria empresa) ──
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations
  for select to authenticated using (public.is_org_member(id));

drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "organization_invites_select" on public.organization_invites;
create policy "organization_invites_select" on public.organization_invites
  for select to authenticated using (public.is_org_member(org_id));

-- Escrita em organizations/members/invites é feita por você no Supabase
-- (dashboard/SQL = service role, ignora RLS). Veja docs/auth-multitenant.md.

-- ── 6) Realtime (mantém os eventos; RLS filtra por empresa) ────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.organization_members;
    exception
      when duplicate_object then null;
      when undefined_table then null;
    end;
  end if;
end $$;
