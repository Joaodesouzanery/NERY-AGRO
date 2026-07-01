-- ============================================================================
-- AGROTORRE — Seed de exemplo (dados demo do app)
-- ----------------------------------------------------------------------------
-- Rode DEPOIS de supabase/schema.sql, no SQL Editor do seu projeto Supabase.
-- Espelha o `demoSnapshot` de src/lib/connected-agro-data.ts.
--
-- Idempotente: cada bloco só insere se a tabela estiver VAZIA. Re-executar num
-- banco já populado não duplica nada. Os `id` são gerados pelo banco (uuid).
-- ============================================================================

-- financial_records ----------------------------------------------------------
insert into public.financial_records (module, payload)
select v.module, v.payload from (values
  ('fluxo',         '{"descricao":"Venda de cestas e ovos","tipo":"entrada","categoria":"Vendas","valor":"148000","data":"2026-05-30"}'::jsonb),
  ('fluxo',         '{"descricao":"Insumos e embalagens","tipo":"saida","categoria":"Custos","valor":"62400","data":"2026-05-29"}'::jsonb),
  ('custos',        '{"produto":"Cesta orgânica","unidade":"unidade","custo_total":"42000","quantidade":"1400","preco_venda":"58"}'::jsonb),
  ('inadimplencia', '{"cliente":"Mercado Central","valor":"3200","vencimento":"2026-05-20","status":"pendente"}'::jsonb)
) as v(module, payload)
where not exists (select 1 from public.financial_records);

-- operation_records ----------------------------------------------------------
insert into public.operation_records (area, module, payload)
select v.area, v.module, v.payload from (values
  ('logistica','cargas',       '{"codigo":"#100512-SP","cliente":"CSA Vila Verde","origem":"Curitiba, PR","origem_lat":"-25.43","origem_lng":"-49.27","destino":"São Paulo, SP","destino_lat":"-23.55","destino_lng":"-46.63","peso":"1580","valor":"18400","motorista":"João Pereira","placa":"NER-2A45","status":"Em trânsito","eta":"14:40"}'::jsonb),
  ('logistica','cargas',       '{"codigo":"#330217-RS","cliente":"Distribuidor Sul","origem":"Florianópolis, SC","origem_lat":"-27.59","origem_lng":"-48.55","destino":"Porto Alegre, RS","destino_lat":"-30.03","destino_lng":"-51.23","peso":"960","valor":"9700","motorista":"Ana Ribeiro","placa":"NER-7P30","status":"Atrasado","eta":"+2h"}'::jsonb),
  ('logistica','bases',        '{"nome":"CD Sudeste","tipo":"Centro de Distribuição","cidade":"São Paulo, SP","lat":"-23.55","lng":"-46.63","responsavel":"Operação Sudeste"}'::jsonb),
  ('logistica','fretes',       '{"rota":"Curitiba > São Paulo","km":"408","custo":"3250","combustivel":"980","pedagio":"210","status":"Fechado"}'::jsonb),
  ('pecuaria','animal',        '{"identificacao":"BR-0421","especie":"Bovino","raca":"Girolando","peso_atual":"418","status":"Ativo"}'::jsonb),
  ('pecuaria','vacinacao',     '{"animal_lote":"Lote Bezerras 01","proxima_dose":"2026-06-12","status":"Reforço previsto"}'::jsonb),
  ('sustentabilidade','carbono','{"atividade":"Transporte de cestas","fonte":"Diesel","volume":"180","fator":"2.68","co2e":"482.4","status":"Calculado"}'::jsonb),
  ('inteligencia','perdas',    '{"produto":"Tomate","volume_perdido":"340","causa":"Transporte","valor_estimado":"4200","status":"Em ação"}'::jsonb),
  ('cogs','etapas',            '{"produto":"Cesta orgânica","etapa":"Embalagem","custo":"8200","sku":"CSA-ORG","regiao":"Sudeste","status":"Calculado"}'::jsonb),
  ('cogs','simulacoes',        '{"nome":"Trocar fornecedor de caixas","impacto":"-6.5","economia":"3400","status":"Favorável"}'::jsonb)
) as v(area, module, payload)
where not exists (select 1 from public.operation_records);

-- field_records --------------------------------------------------------------
insert into public.field_records (module, payload)
select v.module, v.payload from (values
  ('areas',      '{"talhao":"Talhão A","area_ha":"18","cultura":"Hortaliças","status":"Em andamento"}'::jsonb),
  ('insumos',    '{"insumo":"Composto orgânico","tipo":"Fertilizante","talhao":"Talhão A","custo_hectare":"480"}'::jsonb),
  ('maquinario', '{"maquina":"Trator 01","custo_operacional":"7300","status":"Atenção"}'::jsonb),
  ('pragas',     '{"ocorrencia":"Lagarta","talhao":"Talhão A","severidade":"Alta","gps":"-23.5505,-46.6333"}'::jsonb)
) as v(module, payload)
where not exists (select 1 from public.field_records);
