-- ════════════════════════════════════════════════════════════════════════
-- Pecuária v2 — Produção diária (leite, ovos, mel). Último recurso que só
-- existia na pecuária legada; portado para o schema normalizado pec_*.
-- Multi-tenant por org_id + trigger set_org_id + RLS. Idempotente.
-- Também migra o legado operation_records (area='pecuaria', module='producao').
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.pec_producao (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  -- Produção pode ser por animal (vaca leiteira) ou pelo lote (galinheiro).
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

create index if not exists pec_producao_org_idx on public.pec_producao (org_id, data desc);
create index if not exists pec_producao_animal_idx on public.pec_producao (animal_id, data);
create index if not exists pec_producao_lote_idx on public.pec_producao (lote_id, data);

do $$
declare
  t text;
  data_tables text[] := array['pec_producao'];
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

-- ── Migração do legado (module='producao'). O legado casa o animal/lote por
--    texto livre em `animal_lote`; ligamos ao lote quando o nome bater, senão
--    fica solto (produção da fazenda) com o texto preservado em observacao.
insert into public.pec_producao (org_id, lote_id, produto, quantidade, unidade, data, observacao)
select
  o.org_id,
  (select l.id from public.pec_lote l
    where l.org_id = o.org_id and l.nome = o.payload ->> 'animal_lote' limit 1),
  coalesce(nullif(o.payload ->> 'produto', ''), 'não informado'),
  case
    when o.payload ->> 'quantidade' ~ '^\d+(\.\d+)?$' then (o.payload ->> 'quantidade')::numeric
    else 0
  end,
  nullif(o.payload ->> 'unidade', ''),
  case
    when o.payload ->> 'data' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'data')::date
    else coalesce(o.created_at::date, current_date)
  end,
  nullif(
    trim(concat_ws(' | ', nullif(o.payload ->> 'animal_lote', ''), nullif(o.payload ->> 'observacao', ''))),
    ''
  )
from public.operation_records o
where o.area = 'pecuaria'
  and o.module = 'producao'
  and not exists (
    select 1 from public.pec_producao p
    where p.org_id = o.org_id
      and p.produto = coalesce(nullif(o.payload ->> 'produto', ''), 'não informado')
      and p.data = case
        when o.payload ->> 'data' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'data')::date
        else coalesce(o.created_at::date, current_date)
      end
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.pec_producao;
    exception when duplicate_object then null; when undefined_table then null;
    end;
  end if;
end $$;
