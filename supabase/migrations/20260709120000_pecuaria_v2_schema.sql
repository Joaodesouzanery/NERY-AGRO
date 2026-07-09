-- ════════════════════════════════════════════════════════════════════════
-- Pecuária v2 — schema normalizado (substitui o JSON de operation_records).
-- Entidades: lotes, animais, pesagens, eventos sanitário/reprodutivo, ocupação
-- de talhão e config. Métricas derivadas (GMD, carência, dossiê) saem de VIEWS
-- (nunca persistidas). Multi-tenant por org_id (empresa) — sem fazenda_id; o
-- trigger set_org_id preenche org_id no insert. Idempotente e re-executável.
-- Talhão = public.field_records.id (module='areas') — não cria tabela nova.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1) Lotes ────────────────────────────────────────────────────────────
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

-- ── 2) Animais (genealogia = auto-referência pai_id/mae_id) ──────────────
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

-- ── 3) Pesagens (GMD é derivado — SEM coluna gmd) ───────────────────────
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

-- ── 4) Eventos sanitários (carência via coluna gerada libera_em) ─────────
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

-- ── 5) Eventos reprodutivos (UI só na Fase 6; tabela criada agora) ───────
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

-- ── 6) Ocupação de talhão (ILP; UI só na Fase 4) ────────────────────────
create table if not exists public.pec_ocupacao (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  lote_id uuid not null references public.pec_lote (id) on delete cascade,
  talhao_id uuid not null references public.field_records (id) on delete restrict,
  data_entrada date not null default current_date,
  data_saida date, -- null = ocupação atual
  gta_entrada text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 7) Config do módulo (regras de apartação + constantes editáveis) ─────
create table if not exists public.pec_config (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Índices (org_id líder) ──────────────────────────────────────────────
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

-- ── RLS + trigger org_id (mesmo loop/padrão de schema.sql §4) ────────────
do $$
declare
  t text;
  data_tables text[] := array[
    'pec_lote', 'pec_animal', 'pec_pesagem', 'pec_evento_sanitario',
    'pec_evento_reprodutivo', 'pec_ocupacao', 'pec_config'
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

-- ── Views derivadas (security_invoker: RLS por org da base vale pro caller) ──
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
-- Considera evento no próprio animal OU no lote dele.
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
  a.id as animal_id,
  a.org_id,
  0 as ordem,
  null::uuid as talhao_id,
  a.origem_estabelecimento as estabelecimento,
  a.origem_car as car,
  null::date as data_entrada,
  null::date as data_saida,
  'origem'::text as tipo_elo
from public.pec_animal a
where a.origem in ('comprado', 'leilao')
  and coalesce(a.origem_estabelecimento, a.origem_car) is not null
union all
select
  a.id as animal_id,
  a.org_id,
  1 as ordem,
  o.talhao_id,
  coalesce(f.payload ->> 'nome', f.payload ->> 'talhao') as estabelecimento,
  f.payload ->> 'car' as car,
  o.data_entrada,
  o.data_saida,
  'talhao'::text as tipo_elo
from public.pec_animal a
join public.pec_ocupacao o on o.lote_id = a.lote_id
left join public.field_records f on f.id = o.talhao_id;

grant select on public.v_dossie_animal to authenticated;

-- ── Realtime (mesmo padrão das demais tabelas) ──────────────────────────
do $$
declare
  t text;
  tabs text[] := array[
    'pec_lote', 'pec_animal', 'pec_pesagem', 'pec_evento_sanitario', 'pec_ocupacao'
  ];
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
