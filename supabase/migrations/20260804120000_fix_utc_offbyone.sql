-- ============================================================================
-- AGROTORRE — Corrige as datas gravadas com o dia de UTC, não o do usuário
-- ----------------------------------------------------------------------------
-- O app usava `new Date().toISOString().slice(0,10)` para gravar "hoje", o que
-- devolve a data em UTC. No Brasil (UTC−3), **tudo registrado a partir das 21h
-- ia para o dia seguinte**. Uma sessão de curral que virava a noite ficava com
-- metade das pesagens no dia errado — e o GMD (ganho médio diário), que é
-- Δpeso ÷ Δdias, saía errado por causa disso.
--
-- O código já foi corrigido (src/lib/date-local.ts). Isto conserta o passado.
--
-- ⚠️ ESCOPO DELIBERADAMENTE ESTREITO. Só entram aqui as tabelas onde a data
-- NUNCA pôde ser escolhida pelo usuário — nelas, o padrão "data = dia seguinte
-- ao dia local da gravação" só pode ser o bug. Onde há campo de data no
-- formulário, erro e escolha são indistinguíveis, e um UPDATE cego reescreveria
-- histórico legítimo.
--
--   CORRIGE:
--     • pec_pesagem.data          → só `createPesagem`, chamado só pelo Modo
--                                    Curral, que sempre grava "hoje".
--                                    `created_at` vem do SERVIDOR (default now()).
--     • pec_ocupacao.data_saida   → só `encerrarOcupacao`, chamado só por
--                                    `moverLote`, também sempre com "hoje".
--
--   NÃO CORRIGE, e o motivo:
--     • field_records de movimentação de insumo — `movimentacao-modal.tsx` tem
--       um campo "Data *" editável. Não dá para distinguir off-by-one de data
--       escolhida.
--     • pec_evento_sanitario — a aba Manejo deixa escolher a data.
--     • pec_lote.aberto_em — idem, no diálogo de novo lote.
--
-- PREMISSA: fuso America/Sao_Paulo. `localToday()` usa o fuso do dispositivo;
-- para os clientes atuais é o mesmo. Se algum dia houver cliente noutro fuso,
-- revise antes de rodar.
--
-- SEGURANÇA: faz backup das linhas ANTES de alterar, em
-- `public._backup_utc_offbyone`. Não apague essa tabela até conferir os números.
--
-- IDEMPOTENTE: depois de corrigida, a linha deixa de casar o critério — rodar
-- de novo não faz nada.
--
-- Rode no SQL Editor. A RLS não se aplica ao owner, então isto atravessa todas
-- as empresas de uma vez; o NOTICE final quebra a contagem por empresa.
-- ============================================================================

create table if not exists public._backup_utc_offbyone (
  tabela text not null,
  registro_id uuid not null,
  org_id uuid,
  coluna text not null,
  valor_antigo date not null,
  valor_novo date not null,
  gravado_em timestamptz not null,
  corrigido_em timestamptz not null default now(),
  primary key (tabela, registro_id, coluna)
);

-- Esta tabela guarda linhas de TODAS as empresas — é uma tabela de manutenção,
-- não de produto. Tudo que vive em `public` é exposto automaticamente pelo
-- PostgREST, então: RLS ligada e NENHUMA policy (nega a todo mundo pela API),
-- mais revoke explícito. Só o owner, pelo SQL Editor, enxerga.
alter table public._backup_utc_offbyone enable row level security;
revoke all on public._backup_utc_offbyone from anon, authenticated;

-- ── 1) BACKUP ───────────────────────────────────────────────────────────────
-- Guardar antes de mexer. `on conflict do nothing` mantém o valor da PRIMEIRA
-- execução, que é o original — reexecutar não sobrescreve o backup bom.

-- pec_pesagem: `created_at` é `default now()`, horário do SERVIDOR. Confiável.
insert into public._backup_utc_offbyone
  (tabela, registro_id, org_id, coluna, valor_antigo, valor_novo, gravado_em)
select 'pec_pesagem', id, org_id, 'data', data, data - 1, created_at
  from public.pec_pesagem
 where data = ((created_at at time zone 'America/Sao_Paulo')::date + 1)
   and (created_at at time zone 'America/Sao_Paulo')::time >= '21:00'
on conflict do nothing;

-- pec_ocupacao: a referência aqui é `updated_at`, que HOJE vem do relógio do
-- celular (trigger no servidor é item de outra rodada). Aparelho com hora errada
-- simplesmente não casa o critério e a linha fica como está — falha para o lado
-- seguro, que é o que se quer numa correção retroativa.
insert into public._backup_utc_offbyone
  (tabela, registro_id, org_id, coluna, valor_antigo, valor_novo, gravado_em)
select 'pec_ocupacao', id, org_id, 'data_saida', data_saida, data_saida - 1, updated_at
  from public.pec_ocupacao
 where data_saida is not null
   and data_saida = ((updated_at at time zone 'America/Sao_Paulo')::date + 1)
   and (updated_at at time zone 'America/Sao_Paulo')::time >= '21:00'
on conflict do nothing;

-- ── 2) CORREÇÃO ─────────────────────────────────────────────────────────────
-- Mesmo critério do backup, nesta ordem: nada muda entre um e outro, então os
-- dois alcançam exatamente o mesmo conjunto de linhas.

update public.pec_pesagem
   set data = data - 1
 where data = ((created_at at time zone 'America/Sao_Paulo')::date + 1)
   and (created_at at time zone 'America/Sao_Paulo')::time >= '21:00';

update public.pec_ocupacao
   set data_saida = data_saida - 1
 where data_saida is not null
   and data_saida = ((updated_at at time zone 'America/Sao_Paulo')::date + 1)
   and (updated_at at time zone 'America/Sao_Paulo')::time >= '21:00';

-- ── 3) RELATÓRIO ────────────────────────────────────────────────────────────
do $$
declare
  v_pesagem int;
  v_ocupacao int;
begin
  select count(*) into v_pesagem
    from public._backup_utc_offbyone where tabela = 'pec_pesagem';
  select count(*) into v_ocupacao
    from public._backup_utc_offbyone where tabela = 'pec_ocupacao';
  raise notice 'Off-by-one de UTC — linhas no backup: % pesagem(ns), % ocupação(ões).',
    v_pesagem, v_ocupacao;
end $$;

-- ============================================================================
-- CONFIRA o que foi alterado (por empresa):
--
--   select o.nome as empresa, b.tabela, count(*) as linhas_corrigidas
--     from public._backup_utc_offbyone b
--     left join public.organizations o on o.id = b.org_id
--    group by 1, 2
--    order by 1, 2;
--
-- DESFAZER (se algum número não fizer sentido):
--
--   update public.pec_pesagem p set data = b.valor_antigo
--     from public._backup_utc_offbyone b
--    where b.tabela = 'pec_pesagem' and b.registro_id = p.id;
--
--   update public.pec_ocupacao o set data_saida = b.valor_antigo
--     from public._backup_utc_offbyone b
--    where b.tabela = 'pec_ocupacao' and b.registro_id = o.id;
-- ============================================================================
