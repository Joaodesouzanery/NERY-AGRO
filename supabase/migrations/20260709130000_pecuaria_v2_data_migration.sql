-- ════════════════════════════════════════════════════════════════════════
-- Pecuária v2 — migração de DADOS (operation_records → pec_*).
-- Copia PRA FRENTE (idempotente por chaves naturais). NÃO renomeia nem apaga
-- operation_records (tabela compartilhada por outras áreas): o legado fica
-- intacto e a /pecuaria antiga continua lendo dele até a virada (Fase 7).
-- Reexecutável: os guards `not exists` evitam duplicar.
--
-- Observação: o texto livre `historico_pesagens` (ex.: "2026-03: 398 kg; ...")
-- NÃO é interpretado aqui — seed apenas o `peso_atual` como 1 pesagem atual.
-- O histórico completo fica para um backfill manual, se necessário.
-- ════════════════════════════════════════════════════════════════════════

-- 1) Um lote "Rebanho migrado" por empresa (para nenhum animal ficar órfão).
insert into public.pec_lote (org_id, nome, aberto_em)
select distinct o.org_id, 'Rebanho migrado', current_date
from public.operation_records o
where o.area = 'pecuaria'
  and o.module = 'animal'
  and not exists (
    select 1 from public.pec_lote l where l.org_id = o.org_id and l.nome = 'Rebanho migrado'
  );

-- 2) Animais (dedup por (org_id, brinco_visual)). Rows sem identificação são
--    ignoradas por não terem chave natural para deduplicar.
--
--    `categoria` fica NULL de propósito: no legado, `especie` guarda "Bovino",
--    que não é categoria (bezerro/novilha/boi). Preservamos o valor na
--    `observacao` para não perder dado, e o gestor classifica pela UI.
--
--    `origem` fica NULL de propósito: assumir 'nascido' faria todo animal
--    comprado aparecer como nascido na fazenda e o dossiê EUDR o marcaria
--    falsamente como 100% conforme. NULL = pendência honesta a preencher.
insert into public.pec_animal
  (org_id, brinco_visual, categoria, sexo, raca, nascimento, status, observacao, lote_id, origem)
select
  o.org_id,
  nullif(o.payload ->> 'identificacao', ''),
  null::text,
  case
    when lower(o.payload ->> 'sexo') like 'f%' then 'femea'
    when lower(o.payload ->> 'sexo') like 'm%' then 'macho'
    else null
  end,
  nullif(o.payload ->> 'raca', ''),
  case
    when o.payload ->> 'nascimento' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'nascimento')::date
    else null
  end,
  case
    when lower(o.payload ->> 'status') like 'vend%' then 'vendido'
    when lower(o.payload ->> 'status') like 'mort%' then 'morto'
    when lower(o.payload ->> 'status') like 'apto%' then 'apto_abate'
    else 'ativo'
  end,
  nullif(
    trim(concat_ws(
      ' | ',
      nullif(o.payload ->> 'especie', ''),
      nullif(o.payload ->> 'linhagem', ''),
      nullif(o.payload ->> 'genealogia', '')
    )),
    ''
  ),
  (select l.id from public.pec_lote l
    where l.org_id = o.org_id and l.nome = 'Rebanho migrado' limit 1),
  null::text
from public.operation_records o
where o.area = 'pecuaria'
  and o.module = 'animal'
  and nullif(o.payload ->> 'identificacao', '') is not null
  and not exists (
    select 1 from public.pec_animal p
    where p.org_id = o.org_id and p.brinco_visual = o.payload ->> 'identificacao'
  );

-- 3) Peso atual → 1 pesagem por animal (só se ainda não houver pesagem).
insert into public.pec_pesagem (org_id, animal_id, data, peso_kg, origem)
select
  o.org_id,
  p.id,
  coalesce(o.created_at::date, current_date),
  (o.payload ->> 'peso_atual')::numeric,
  'manual'
from public.operation_records o
join public.pec_animal p
  on p.org_id = o.org_id and p.brinco_visual = o.payload ->> 'identificacao'
where o.area = 'pecuaria'
  and o.module = 'animal'
  and o.payload ->> 'peso_atual' ~ '^\d+(\.\d+)?$'
  and not exists (select 1 from public.pec_pesagem pp where pp.animal_id = p.id);

-- 4) Vacinação → evento sanitário no lote "Rebanho migrado" (sem carência no legado).
insert into public.pec_evento_sanitario (org_id, lote_id, tipo, produto, data, carencia_dias)
select
  o.org_id,
  (select l.id from public.pec_lote l
    where l.org_id = o.org_id and l.nome = 'Rebanho migrado' limit 1),
  'vacina',
  nullif(o.payload ->> 'vacina', ''),
  case
    when o.payload ->> 'data' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'data')::date
    else current_date
  end,
  0
from public.operation_records o
where o.area = 'pecuaria'
  and o.module = 'vacinacao'
  and not exists (
    select 1 from public.pec_evento_sanitario s
    where s.org_id = o.org_id
      and s.tipo = 'vacina'
      and coalesce(s.produto, '') = coalesce(nullif(o.payload ->> 'vacina', ''), '')
      and s.data = case
        when o.payload ->> 'data' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'data')::date
        else current_date
      end
  );

-- 5) Reprodutivo → evento reprodutivo (protocolo = texto do evento legado).
insert into public.pec_evento_reprodutivo (org_id, protocolo, resultado, data)
select
  o.org_id,
  nullif(o.payload ->> 'evento', ''),
  nullif(o.payload ->> 'observacao', ''),
  case
    when o.payload ->> 'data' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'data')::date
    else current_date
  end
from public.operation_records o
where o.area = 'pecuaria'
  and o.module = 'reprodutivo'
  and not exists (
    select 1 from public.pec_evento_reprodutivo r
    where r.org_id = o.org_id
      and coalesce(r.protocolo, '') = coalesce(nullif(o.payload ->> 'evento', ''), '')
      and r.data = case
        when o.payload ->> 'data' ~ '^\d{4}-\d{2}-\d{2}$' then (o.payload ->> 'data')::date
        else current_date
      end
  );

-- 6) Relatório (aparece como NOTICE ao rodar). Legado × migrado.
do $$
declare
  v_leg int; v_animal int; v_pes int; v_san int; v_rep int;
begin
  select count(*) into v_leg from public.operation_records where area = 'pecuaria' and module = 'animal';
  select count(*) into v_animal from public.pec_animal;
  select count(*) into v_pes from public.pec_pesagem;
  select count(*) into v_san from public.pec_evento_sanitario;
  select count(*) into v_rep from public.pec_evento_reprodutivo;
  raise notice 'Pecuária v2 — migração: animais legados=%, pec_animal=%, pesagens=%, sanitarios=%, reprodutivos=%',
    v_leg, v_animal, v_pes, v_san, v_rep;
end $$;
