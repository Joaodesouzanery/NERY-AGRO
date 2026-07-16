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

-- ============================================================================
-- Nota: o modo DEMO (botão na barra lateral) NUNCA usa o banco — ele mostra um
-- dataset em memória (`demoSnapshot`). Isto aqui só afeta os dados REAIS.
-- ============================================================================
