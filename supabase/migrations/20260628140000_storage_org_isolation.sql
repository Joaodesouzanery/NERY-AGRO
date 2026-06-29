-- ════════════════════════════════════════════════════════════════════════
-- Storage por empresa: torna os buckets PRIVADOS e isola por org_id.
-- Convenção: todo arquivo é gravado em "<org_id>/<resto/do/caminho>".
-- A RLS de storage.objects compara o 1º segmento do path com current_org_id().
-- Requer a migração de auth/multi-tenant (current_org_id()) aplicada antes.
-- ════════════════════════════════════════════════════════════════════════

-- Buckets privados (idempotente). Cria rdc-photos se ainda não existir.
insert into storage.buckets (id, name, public)
values ('animal-pdfs', 'animal-pdfs', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('rdc-photos', 'rdc-photos', false)
on conflict (id) do update set public = false;

-- Remove policies abertas antigas do animal-pdfs (definidas no schema.sql).
drop policy if exists "animal_pdfs_select" on storage.objects;
drop policy if exists "animal_pdfs_insert" on storage.objects;
drop policy if exists "animal_pdfs_update" on storage.objects;
drop policy if exists "animal_pdfs_delete" on storage.objects;

-- Policies por empresa, cobrindo os dois buckets (1º segmento do path = org).
drop policy if exists "org_files_select" on storage.objects;
create policy "org_files_select" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('animal-pdfs', 'rdc-photos')
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "org_files_insert" on storage.objects;
create policy "org_files_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('animal-pdfs', 'rdc-photos')
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "org_files_update" on storage.objects;
create policy "org_files_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('animal-pdfs', 'rdc-photos')
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id in ('animal-pdfs', 'rdc-photos')
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists "org_files_delete" on storage.objects;
create policy "org_files_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('animal-pdfs', 'rdc-photos')
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- NOTA: arquivos enviados ANTES desta migração estão em caminhos sem o prefixo
-- "<org_id>/" e deixarão de abrir (bucket agora é privado). Migre-os manualmente
-- (mover para "<org_id>/<path-antigo>") ou regere os PDFs/fotos. Uploads novos
-- já nascem isolados. Veja docs/auth-multitenant.md §5.
