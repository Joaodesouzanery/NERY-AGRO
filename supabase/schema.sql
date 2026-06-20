-- ============================================================================
-- NERY AGRO — Schema consolidado e idempotente
-- ----------------------------------------------------------------------------
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase para criar
-- toda a estrutura de uma vez. É seguro re-executar (idempotente).
--
-- Substitui a pasta supabase/migrations/ (que tem definições duplicadas/
-- conflitantes herdadas da Lovable) como fonte canônica para subir um projeto
-- novo. Depois rode supabase/seed.sql para dados de exemplo.
--
-- Postura de segurança: protótipo com RLS ABERTO (anon + authenticated podem
-- ler/escrever tudo). NÃO há isolamento por usuário/organização. Endurecer
-- antes de ir para produção com dados reais.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabelas
-- ----------------------------------------------------------------------------

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operation_records (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.field_records (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- animal_record_id é uuid (referencia operation_records.id; ver src/lib/animal-pdfs.ts).
-- As migrations herdadas criavam como `text` num projeto novo por causa de
-- `create table if not exists`; aqui fica correto desde o início.
create table if not exists public.animal_pdf_records (
  id uuid primary key default gen_random_uuid(),
  animal_record_id uuid not null,
  animal_identifier text not null,
  version integer not null default 1,
  file_path text not null,
  file_name text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------------------

create index if not exists financial_records_module_created_at_idx
  on public.financial_records (module, created_at desc);

create index if not exists operation_records_module_created_at_idx
  on public.operation_records (module, created_at desc);

create index if not exists operation_records_area_module_idx
  on public.operation_records (area, module);

create index if not exists field_records_module_created_at_idx
  on public.field_records (module, created_at desc);

create index if not exists animal_pdf_records_animal_idx
  on public.animal_pdf_records (animal_record_id, created_at desc);

create index if not exists animal_pdf_records_identifier_idx
  on public.animal_pdf_records (animal_identifier);

-- ----------------------------------------------------------------------------
-- Grants (anon/authenticated/service_role)
-- ----------------------------------------------------------------------------

grant select, insert, update, delete on public.financial_records to anon, authenticated;
grant select, insert, update, delete on public.operation_records to anon, authenticated;
grant select, insert, update, delete on public.field_records to anon, authenticated;
grant select, insert, update, delete on public.animal_pdf_records to anon, authenticated;
grant all on public.financial_records to service_role;
grant all on public.operation_records to service_role;
grant all on public.field_records to service_role;
grant all on public.animal_pdf_records to service_role;

-- ----------------------------------------------------------------------------
-- Row Level Security + políticas abertas (idempotente: drop + create)
-- ----------------------------------------------------------------------------

alter table public.financial_records enable row level security;
alter table public.operation_records enable row level security;
alter table public.field_records enable row level security;
alter table public.animal_pdf_records enable row level security;

-- financial_records
drop policy if exists "financial_records_select" on public.financial_records;
drop policy if exists "financial_records_insert" on public.financial_records;
drop policy if exists "financial_records_update" on public.financial_records;
drop policy if exists "financial_records_delete" on public.financial_records;
create policy "financial_records_select" on public.financial_records for select to anon, authenticated using (true);
create policy "financial_records_insert" on public.financial_records for insert to anon, authenticated with check (true);
create policy "financial_records_update" on public.financial_records for update to anon, authenticated using (true) with check (true);
create policy "financial_records_delete" on public.financial_records for delete to anon, authenticated using (true);

-- operation_records
drop policy if exists "operation_records_select" on public.operation_records;
drop policy if exists "operation_records_insert" on public.operation_records;
drop policy if exists "operation_records_update" on public.operation_records;
drop policy if exists "operation_records_delete" on public.operation_records;
create policy "operation_records_select" on public.operation_records for select to anon, authenticated using (true);
create policy "operation_records_insert" on public.operation_records for insert to anon, authenticated with check (true);
create policy "operation_records_update" on public.operation_records for update to anon, authenticated using (true) with check (true);
create policy "operation_records_delete" on public.operation_records for delete to anon, authenticated using (true);

-- field_records
drop policy if exists "field_records_select" on public.field_records;
drop policy if exists "field_records_insert" on public.field_records;
drop policy if exists "field_records_update" on public.field_records;
drop policy if exists "field_records_delete" on public.field_records;
create policy "field_records_select" on public.field_records for select to anon, authenticated using (true);
create policy "field_records_insert" on public.field_records for insert to anon, authenticated with check (true);
create policy "field_records_update" on public.field_records for update to anon, authenticated using (true) with check (true);
create policy "field_records_delete" on public.field_records for delete to anon, authenticated using (true);

-- animal_pdf_records
drop policy if exists "animal_pdf_records_select" on public.animal_pdf_records;
drop policy if exists "animal_pdf_records_insert" on public.animal_pdf_records;
drop policy if exists "animal_pdf_records_update" on public.animal_pdf_records;
drop policy if exists "animal_pdf_records_delete" on public.animal_pdf_records;
create policy "animal_pdf_records_select" on public.animal_pdf_records for select to anon, authenticated using (true);
create policy "animal_pdf_records_insert" on public.animal_pdf_records for insert to anon, authenticated with check (true);
create policy "animal_pdf_records_update" on public.animal_pdf_records for update to anon, authenticated using (true) with check (true);
create policy "animal_pdf_records_delete" on public.animal_pdf_records for delete to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- Storage: bucket público "animal-pdfs" + políticas abertas
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('animal-pdfs', 'animal-pdfs', true)
on conflict (id) do update set public = true;

drop policy if exists "animal_pdfs_select" on storage.objects;
drop policy if exists "animal_pdfs_insert" on storage.objects;
drop policy if exists "animal_pdfs_update" on storage.objects;
drop policy if exists "animal_pdfs_delete" on storage.objects;
create policy "animal_pdfs_select" on storage.objects for select to anon, authenticated using (bucket_id = 'animal-pdfs');
create policy "animal_pdfs_insert" on storage.objects for insert to anon, authenticated with check (bucket_id = 'animal-pdfs');
create policy "animal_pdfs_update" on storage.objects for update to anon, authenticated using (bucket_id = 'animal-pdfs') with check (bucket_id = 'animal-pdfs');
create policy "animal_pdfs_delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'animal-pdfs');

-- ----------------------------------------------------------------------------
-- Realtime: publica as 3 tabelas principais
-- ----------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.financial_records;
    exception when duplicate_object then null; when undefined_table then null;
    end;
    begin
      alter publication supabase_realtime add table public.operation_records;
    exception when duplicate_object then null; when undefined_table then null;
    end;
    begin
      alter publication supabase_realtime add table public.field_records;
    exception when duplicate_object then null; when undefined_table then null;
    end;
  end if;
end $$;
