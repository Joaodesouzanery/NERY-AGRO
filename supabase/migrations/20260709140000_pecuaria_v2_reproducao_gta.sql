-- ════════════════════════════════════════════════════════════════════════
-- Pecuária v2 — Fase 6: estoque de sêmen (IATF) e registro de GTA.
-- Mesmo padrão multi-tenant das demais pec_*: org_id + trigger set_org_id + RLS.
-- Idempotente e re-executável.
-- ════════════════════════════════════════════════════════════════════════

-- ── Estoque de sêmen (baixa automática ao lançar inseminação) ────────────
create table if not exists public.pec_estoque_semen (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  touro text not null,
  partida text,
  doses integer not null default 0 check (doses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Movimentação de GTA (alerta para GTA sem NF-e vinculada — NT 2024.003) ──
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

create index if not exists pec_estoque_semen_org_idx on public.pec_estoque_semen (org_id, touro);
create index if not exists pec_movimentacao_gta_org_idx on public.pec_movimentacao_gta (org_id, data desc);

-- ── RLS + trigger org_id (mesmo loop/padrão de schema.sql §4) ────────────
do $$
declare
  t text;
  data_tables text[] := array['pec_estoque_semen', 'pec_movimentacao_gta'];
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

-- ── Realtime ────────────────────────────────────────────────────────────
do $$
declare
  t text;
  tabs text[] := array['pec_estoque_semen', 'pec_movimentacao_gta'];
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
