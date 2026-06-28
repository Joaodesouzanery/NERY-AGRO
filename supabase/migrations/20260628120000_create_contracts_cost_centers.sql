-- Financeiro V2: tabelas normalizadas para Centros de Custo e Contratos.
-- RLS aberta (mesmo padrão das demais tabelas). Perfis/RLS por papel virão
-- quando houver autenticação (auth.uid()). Drill-down via FK contracts.cost_center_id.

-- ── Centros de custo (dimensão de orçamento: autorizado x alocado x realizado) ──
create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists cost_centers_safra_idx on public.cost_centers (safra);

-- ── Contratos (compra de insumo, venda de grãos, fixação, frete, CSA, etc.) ──
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists contracts_cost_center_idx on public.contracts (cost_center_id);
create index if not exists contracts_contraparte_idx on public.contracts (contraparte);
create index if not exists contracts_status_idx on public.contracts (status);

-- ── RLS aberta (igual financial_records/operation_records/field_records) ──
alter table public.cost_centers enable row level security;
alter table public.contracts enable row level security;

create policy "cost_centers_select" on public.cost_centers for select to anon, authenticated using (true);
create policy "cost_centers_insert" on public.cost_centers for insert to anon, authenticated with check (true);
create policy "cost_centers_update" on public.cost_centers for update to anon, authenticated using (true) with check (true);
create policy "cost_centers_delete" on public.cost_centers for delete to anon, authenticated using (true);

create policy "contracts_select" on public.contracts for select to anon, authenticated using (true);
create policy "contracts_insert" on public.contracts for insert to anon, authenticated with check (true);
create policy "contracts_update" on public.contracts for update to anon, authenticated using (true) with check (true);
create policy "contracts_delete" on public.contracts for delete to anon, authenticated using (true);

-- ── Realtime (mesmo padrão das demais tabelas) ──
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.cost_centers;
    exception
      when duplicate_object then null;
      when undefined_table then null;
    end;

    begin
      alter publication supabase_realtime add table public.contracts;
    exception
      when duplicate_object then null;
      when undefined_table then null;
    end;
  end if;
end $$;
