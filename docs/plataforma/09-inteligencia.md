# 09 · Inteligência

**Visão:** a camada de **leitura do negócio** — lucratividade, tendência, preço de mercado e
perdas com causa. Transforma o dado operacional em decisão.

## Para quê

Comparar culturas e períodos, reagir a preço de mercado e **entender a perda** (causa, valor,
ação) em vez de só constatar o prejuízo no fim do mês.

## Funcionalidades

- **Lucratividade por Cultura Comparada** — receita, custo, **margem** e safra por cultura.
  _Captura:_ cultura, safra, receita, custo, margem, status.
- **Desempenho Mês a Mês / Ano a Ano** — indicadores por período, **comparativo e tendência** em
  gráficos. _Captura:_ período, indicador, valor, comparativo, ano.
- **Alertas de Preços CEASA/CNA** — alertas configuráveis por produto, praça/fonte e **limite de
  preço**. _Captura:_ produto, praça/fonte, preço, limite de alerta, data.
- **Relatório de Perdas com Causas** — produto/cultura, **volume perdido, causa, valor estimado
  e ação**. _Captura:_ produto/cultura, volume perdido, causa, valor estimado, ação, status.

## Visão Geral (KPIs)

Culturas (receita/custo/margem total e média, acima da meta) · períodos (acumulado, vs.
comparativo, melhor período) · alertas de preço (configurados, disparados, folga ao limite) ·
perdas (prejuízo estimado, volume perdido, **maior causa**, em ação).

## Integrações

- **Financeiro / COGS** → base de receita e custo por cultura.
- **Perdas → COGS** (ineficiências) **e → Torre** (alerta).
- **Alertas de preço → Fila de Ações** quando estouram o limite.

## Eficiência

As perdas ganham **causa e responsável** — deixam de ser um número no fim do mês. E a decisão de
vender/segurar reage ao preço de mercado na hora.
