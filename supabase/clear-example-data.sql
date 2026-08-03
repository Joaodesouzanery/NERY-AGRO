-- ============================================================================
-- AGROTORRE — Limpar dados de EXEMPLO (o que o seed.sql inseriu)
-- ----------------------------------------------------------------------------
-- Use isto quando quiser que o modo REAL fique SÓ com os seus dados. Remove
-- exatamente as linhas de exemplo que o supabase/seed.sql carregou (espelho do
-- `demoSnapshot`). NÃO apaga dados que você mesmo cadastrou.
--
-- ⚠️ REVISE antes de rodar. Rode no SQL Editor do seu projeto Supabase. A RLS já
-- escopa por empresa (org_id), então isto só afeta a empresa ativa. Se você editou
-- algum registro de exemplo, ajuste/retire a linha correspondente abaixo.
--
-- Idempotente: rodar de novo num banco já limpo não faz nada.
-- ============================================================================

-- financial_records ----------------------------------------------------------
delete from public.financial_records
where (module = 'fluxo'         and payload->>'descricao' in ('Venda de cestas e ovos','Insumos e embalagens'))
   or (module = 'custos'        and payload->>'produto' = 'Cesta orgânica' and payload->>'custo_total' = '42000')
   or (module = 'inadimplencia' and payload->>'cliente' = 'Mercado Central' and payload->>'valor' = '3200');

-- operation_records ----------------------------------------------------------
delete from public.operation_records
where (area = 'logistica'        and module = 'cargas'    and payload->>'codigo' in ('#100512-SP','#330217-RS'))
   or (area = 'logistica'        and module = 'bases'     and payload->>'nome' = 'CD Sudeste')
   or (area = 'logistica'        and module = 'fretes'    and payload->>'rota' = 'Curitiba > São Paulo' and payload->>'custo' = '3250')
   or (area = 'pecuaria'         and module = 'animal'    and payload->>'identificacao' = 'BR-0421')
   or (area = 'pecuaria'         and module = 'vacinacao' and payload->>'animal_lote' = 'Lote Bezerras 01')
   or (area = 'sustentabilidade' and module = 'carbono'   and payload->>'atividade' = 'Transporte de cestas' and payload->>'co2e' = '482.4')
   or (area = 'inteligencia'     and module = 'perdas'    and payload->>'produto' = 'Tomate' and payload->>'volume_perdido' = '340')
   or (area = 'cogs'             and module = 'etapas'    and payload->>'sku' = 'CSA-ORG')
   or (area = 'cogs'             and module = 'simulacoes' and payload->>'nome' = 'Trocar fornecedor de caixas');

-- field_records --------------------------------------------------------------
delete from public.field_records
where (module = 'areas'      and payload->>'talhao' = 'Talhão A' and payload->>'area_ha' = '18')
   or (module = 'insumos'    and payload->>'insumo' = 'Composto orgânico')
   or (module = 'maquinario' and payload->>'maquina' = 'Trator 01')
   or (module = 'pragas'     and payload->>'ocorrencia' = 'Lagarta' and payload->>'talhao' = 'Talhão A');

-- Pecuária v2 (pec_*) ---------------------------------------------------------
-- Apagar o animal de operation_records acima NÃO basta: a migração
-- 20260709130000_pecuaria_v2_data_migration.sql COPIOU o animal do seed para as
-- tabelas novas, criando o lote "Rebanho migrado", uma pesagem de 418 kg e o
-- evento de vacinação. Sem esta parte, o card "Pecuária — 1 cabeça ativa"
-- continua depois da limpeza e ninguém entende de onde vem.
--
-- A ordem importa: pesagem e evento referenciam o animal/lote.

-- Pesagens do animal do seed (BR-0421, 418 kg).
delete from public.pec_pesagem p
where exists (
  select 1 from public.pec_animal a
  where a.id = p.animal_id
    and a.brinco_visual = 'BR-0421'
    and a.raca = 'Girolando'
    and a.org_id = p.org_id
);

-- Evento sanitário criado a partir da vacinação de exemplo. O registro do seed
-- não trazia o nome da vacina, então `produto` ficou nulo — é por aí que se
-- distingue do que você cadastrou, que sempre tem produto. Sem essa condição, a
-- limpeza levaria junto vacinas reais aplicadas nesse lote.
delete from public.pec_evento_sanitario e
where e.tipo = 'vacina'
  and e.produto is null
  and exists (
    select 1 from public.pec_lote l
    where l.id = e.lote_id and l.nome = 'Rebanho migrado' and l.org_id = e.org_id
  );

-- O animal em si.
delete from public.pec_animal
where brinco_visual = 'BR-0421' and raca = 'Girolando';

-- O lote "Rebanho migrado" — SÓ se tiver ficado vazio. Se você já cadastrou
-- animais nele, ele fica: apagar levaria junto o seu rebanho.
delete from public.pec_lote l
where l.nome = 'Rebanho migrado'
  and not exists (select 1 from public.pec_animal a where a.lote_id = l.id)
  and not exists (select 1 from public.pec_ocupacao o where o.lote_id = l.id)
  and not exists (select 1 from public.pec_evento_sanitario e where e.lote_id = l.id);

-- ============================================================================
-- Confira o que sobrou (deve listar só o que VOCÊ cadastrou):
--
--   select 'financial' t, count(*) from public.financial_records
--   union all select 'operations', count(*) from public.operation_records
--   union all select 'field',      count(*) from public.field_records
--   union all select 'pec_animal', count(*) from public.pec_animal
--   union all select 'pec_lote',   count(*) from public.pec_lote;
--
-- Nota: o modo DEMO (botão na barra lateral) NUNCA usa o banco — ele mostra um
-- dataset em memória (src/lib/demo/connected-agro.ts). Isto aqui só afeta os
-- dados REAIS.
-- ============================================================================
