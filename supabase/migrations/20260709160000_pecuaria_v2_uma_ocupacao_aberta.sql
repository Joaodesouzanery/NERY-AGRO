-- ════════════════════════════════════════════════════════════════════════
-- Pecuária v2 — invariante: um lote tem NO MÁXIMO uma ocupação aberta.
--
-- Sem isso, `moverLote` (que não é atômico) ou dois cliques rápidos deixam o
-- lote em dois talhões ao mesmo tempo, e a lotação UA/ha passa a mentir nos
-- dois. Índice único PARCIAL: só vale para as linhas com data_saida null.
--
-- Idempotente. Se já houver duplicatas, o create falha e a migration para —
-- de propósito: é preciso decidir qual ocupação encerrar antes de travar.
-- ════════════════════════════════════════════════════════════════════════

create unique index if not exists pec_ocupacao_uma_aberta_por_lote
  on public.pec_ocupacao (lote_id)
  where data_saida is null;
