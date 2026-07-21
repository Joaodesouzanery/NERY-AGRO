-- ============================================================================
-- AGROTORRE — Schema consolidado e idempotente (estado FINAL: multi-tenant)
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

-- ── Pecuária v2 (schema normalizado; métricas derivadas via views abaixo) ──
create table if not exists public.pec_lote (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  nome text not null,
  fase text check (fase in ('cria', 'recria', 'engorda', 'terminacao')),
  sistema text check (sistema in ('pasto', 'semiconfinamento', 'confinamento')),
  centro_custo_id uuid references public.cost_centers (id) on delete set null,
  peso_alvo_kg numeric,
  aberto_em date not null default current_date,
  encerrado_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_animal (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  brinco_visual text,
  sisbov text,
  rfid text,
  categoria text,
  sexo text check (sexo in ('macho', 'femea')),
  raca text,
  nascimento date,
  pai_id uuid references public.pec_animal (id) on delete set null,
  mae_id uuid references public.pec_animal (id) on delete set null,
  lote_id uuid references public.pec_lote (id) on delete set null,
  origem text check (origem in ('nascido', 'comprado', 'leilao')),
  origem_estabelecimento text,
  origem_car text,
  -- status = ciclo de vida. "carência" NÃO entra aqui — é derivado (v_animal_carencia).
  status text not null default 'ativo' check (status in ('ativo', 'apto_abate', 'vendido', 'morto')),
  foto_url text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_pesagem (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid not null references public.pec_animal (id) on delete cascade,
  data date not null default current_date,
  peso_kg numeric not null,
  origem text not null default 'manual' check (origem in ('manual', 'rfid', 'balanca')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_evento_sanitario (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid references public.pec_animal (id) on delete cascade,
  lote_id uuid references public.pec_lote (id) on delete cascade,
  tipo text,
  produto text,
  data date not null default current_date,
  carencia_dias integer not null default 0,
  libera_em date generated always as (data + carencia_dias) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_evento_reprodutivo (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid references public.pec_animal (id) on delete cascade,
  tipo text check (tipo in ('iatf', 'monta', 'dg', 'parto', 'ressincronizacao')),
  protocolo text,
  touro_id uuid references public.pec_animal (id) on delete set null,
  semen_touro text,
  resultado text,
  data date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_ocupacao (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  lote_id uuid not null references public.pec_lote (id) on delete cascade,
  talhao_id uuid not null references public.field_records (id) on delete restrict,
  data_entrada date not null default current_date,
  data_saida date,
  gta_entrada text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_config (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_estoque_semen (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  touro text not null,
  partida text,
  doses integer not null default 0 check (doses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pec_movimentacao_gta (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  numero text not null,
  data date not null default current_date,
  sentido text not null default 'entrada' check (sentido in ('entrada', 'saida')),
  contraparte text,
  quantidade integer not null default 0 check (quantidade >= 0),
  nfe_vinculada text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Produção diária (leite, ovos, mel): por animal OU por lote.
create table if not exists public.pec_producao (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid references public.pec_animal (id) on delete cascade,
  lote_id uuid references public.pec_lote (id) on delete cascade,
  produto text not null,
  quantidade numeric not null default 0 check (quantidade >= 0),
  unidade text,
  data date not null default current_date,
  observacao text,
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
create index if not exists pec_lote_org_idx on public.pec_lote (org_id, encerrado_em);
create index if not exists pec_animal_org_idx on public.pec_animal (org_id, status, lote_id);
create index if not exists pec_animal_lote_idx on public.pec_animal (lote_id);
create index if not exists pec_pesagem_animal_idx on public.pec_pesagem (animal_id, data);
create index if not exists pec_pesagem_org_idx on public.pec_pesagem (org_id, data desc);
create index if not exists pec_evento_sanitario_animal_idx on public.pec_evento_sanitario (animal_id, libera_em);
create index if not exists pec_evento_sanitario_lote_idx on public.pec_evento_sanitario (lote_id, libera_em);
create index if not exists pec_evento_reprodutivo_animal_idx on public.pec_evento_reprodutivo (animal_id, data);
create index if not exists pec_ocupacao_talhao_idx on public.pec_ocupacao (talhao_id, data_entrada);
create index if not exists pec_ocupacao_lote_idx on public.pec_ocupacao (lote_id, data_saida);
create index if not exists pec_estoque_semen_org_idx on public.pec_estoque_semen (org_id, touro);
create index if not exists pec_movimentacao_gta_org_idx on public.pec_movimentacao_gta (org_id, data desc);
create index if not exists pec_producao_org_idx on public.pec_producao (org_id, data desc);
create index if not exists pec_producao_animal_idx on public.pec_producao (animal_id, data);
create index if not exists pec_producao_lote_idx on public.pec_producao (lote_id, data);

-- ----------------------------------------------------------------------------
-- 4) Triggers de org_id + RLS por empresa (todas as tabelas de dados)
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  data_tables text[] := array[
    'financial_records', 'operation_records', 'field_records',
    'animal_pdf_records', 'cost_centers', 'contracts',
    'pec_lote', 'pec_animal', 'pec_pesagem', 'pec_evento_sanitario',
    'pec_evento_reprodutivo', 'pec_ocupacao', 'pec_config',
    'pec_estoque_semen', 'pec_movimentacao_gta', 'pec_producao'
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

-- ── Views derivadas da Pecuária (security_invoker: RLS por org da base vale) ──
-- GMD por animal (Δpeso ÷ Δdias entre pesagens consecutivas). NUNCA persistido.
create or replace view public.v_gmd_animal with (security_invoker = true) as
with ordered as (
  select
    p.animal_id,
    p.org_id,
    p.data,
    p.peso_kg,
    lag(p.peso_kg) over (partition by p.animal_id order by p.data) as peso_ant,
    lag(p.data) over (partition by p.animal_id order by p.data) as data_ant
  from public.pec_pesagem p
),
intervalos as (
  select
    animal_id,
    org_id,
    data,
    case
      when data_ant is not null and (data - data_ant) > 0
        then (peso_kg - peso_ant) / (data - data_ant)
      else null
    end as gmd
  from ordered
)
select
  animal_id,
  org_id,
  count(*) filter (where gmd is not null) as intervalos,
  (array_agg(gmd order by data desc) filter (where gmd is not null))[1] as gmd_atual,
  avg(gmd) as gmd_medio,
  max(data) as ultima_pesagem
from intervalos
group by animal_id, org_id;
grant select on public.v_gmd_animal to authenticated;

-- Carência ativa por animal (fonte única do bloqueio de abate/venda).
create or replace view public.v_animal_carencia with (security_invoker = true) as
select
  a.id as animal_id,
  a.org_id,
  max(s.libera_em) as libera_em
from public.pec_animal a
join public.pec_evento_sanitario s
  on s.animal_id = a.id or (s.lote_id is not null and s.lote_id = a.lote_id)
where s.libera_em > current_date
group by a.id, a.org_id;
grant select on public.v_animal_carencia to authenticated;

-- Dossiê do animal: cadeia de estabelecimentos (origem externa + talhões do lote).
create or replace view public.v_dossie_animal with (security_invoker = true) as
select
  a.id as animal_id, a.org_id, 0 as ordem, null::uuid as talhao_id,
  a.origem_estabelecimento as estabelecimento, a.origem_car as car,
  null::date as data_entrada, null::date as data_saida, 'origem'::text as tipo_elo
from public.pec_animal a
where a.origem in ('comprado', 'leilao')
  and coalesce(a.origem_estabelecimento, a.origem_car) is not null
union all
select
  a.id as animal_id, a.org_id, 1 as ordem, o.talhao_id,
  coalesce(f.payload ->> 'nome', f.payload ->> 'talhao') as estabelecimento,
  f.payload ->> 'car' as car, o.data_entrada, o.data_saida, 'talhao'::text as tipo_elo
from public.pec_animal a
join public.pec_ocupacao o on o.lote_id = a.lote_id
left join public.field_records f on f.id = o.talhao_id;
grant select on public.v_dossie_animal to authenticated;

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
  tabs text[] := array['financial_records', 'operation_records', 'field_records', 'organization_members',
    'pec_lote', 'pec_animal', 'pec_pesagem', 'pec_evento_sanitario', 'pec_ocupacao'];
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
-- platform_admin_emails é allowlist estática lida só por funções security-definer
-- (handle_new_user/backfill, que ignoram RLS). Ligar a RLS e não conceder acesso a
-- anon/authenticated impede enumerar os e-mails dos super-admins via PostgREST.
alter table public.platform_admin_emails enable row level security;
revoke all on public.platform_admin_emails from anon, authenticated;
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
