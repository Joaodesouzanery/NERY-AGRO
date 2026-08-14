-- ════════════════════════════════════════════════════════════════════════
-- 🔴 CORREÇÃO DE SEGURANÇA (P0) — fecha RLS aberta nas tabelas de dados core.
-- ----------------------------------------------------------------------------
-- PROBLEMA: as migrações antigas criaram policies PERMISSIVAS de emergência
-- (`open_select_fin`, `open_*_op`, `open_*_field`, `open_*_animal_pdf`,
-- `animal_pdfs_*`) `to anon, authenticated using (true)`. O retrofit multi-tenant
-- (20260628130000) só dropou as policies com nome `{tabela}_{cmd}` — as `open_*`
-- SOBREVIVERAM. Como policies RLS são OR (permissivas), a `using(true)` ANULA a
-- org-scoped: qualquer visitante ANÔNIMO lê/escreve/apaga o dado de TODAS as
-- empresas (financeiro, operações, campo/RDC, PDFs de animais).
--
-- CORREÇÃO: dropa TODA policy existente nessas tabelas e recria SÓ as org-scoped
-- (org_id = current_org_id(), somente `authenticated`), e revoga o `anon`.
-- Idempotente: seguro rodar mais de uma vez. Requer a migração de auth/multi-tenant
-- aplicada antes (usa org_id + current_org_id()).
--
-- ── VERIFICAÇÃO (rode depois; deve retornar SÓ policies org-scoped, roles={authenticated},
--    e nenhuma com qual = 'true'): ────────────────────────────────────────────
--   select tablename, policyname, roles, cmd, qual
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('financial_records','operation_records','field_records',
--                       'animal_pdf_records','cost_centers','contracts')
--   order by tablename, cmd;
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  t text;
  pol record;
  core_tables text[] := array[
    'financial_records', 'operation_records', 'field_records',
    'animal_pdf_records', 'cost_centers', 'contracts'
  ];
begin
  foreach t in array core_tables loop
    -- pula tabela que não existir (defensivo)
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;

    -- garante RLS ligado
    execute format('alter table public.%I enable row level security', t);

    -- dropa TODA policy existente (limpa as permissivas legadas de qualquer nome)
    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    -- recria SÓ as org-scoped, apenas para authenticated
    execute format(
      'create policy %I on public.%I for select to authenticated using (org_id = public.current_org_id())',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (org_id = public.current_org_id())',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (org_id = public.current_org_id()) with check (org_id = public.current_org_id())',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (org_id = public.current_org_id())',
      t || '_delete', t);

    -- o dado core NÃO deve ser acessível sem login (anon perde o grant herdado)
    execute format('revoke all on public.%I from anon', t);
    -- authenticated mantém o acesso (RLS filtra por empresa)
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
