# 03 · Financeiro & COGS

**Visão:** o **custo verdadeiro** e a margem — do fluxo de caixa ao ROI por talhão. Não é um
financeiro genérico: é adaptado ao produtor (safra, talhão, arrendamento, crédito rural).

## Para quê

Saber **quanto custa produzir de verdade** e **onde a margem vaza** — por produto, etapa, rota,
talhão e safra — e não perder contrato/parcela por esquecimento.

## Funcionalidades (15)

- **Fluxo de Caixa Simples** — registro de entradas e saídas adaptado ao produtor.
- **Custos por Unidade** — cálculo automático do custo de produção por **dúzia, saca ou kg**.
- **Controle de Inadimplência** — alertas de pagamentos pendentes de clientes (com cobrança).
- **Gestão de Estoque de Produtos Acabados** — prontos para venda, reservas e validade.
- **Cálculo de Ponto de Equilíbrio** — quanto vender para cobrir os custos.
- **Gestão de Compras** — lista de compras baseada na **necessidade de insumos**.
- **Controle de Crédito Rural** — acompanhamento de **parcelas** de financiamentos.
- **Tabela de Preços Dinâmica** — preços para atacado, varejo e assinaturas.
- **Custo por Hectare** — **real × planejado** por talhão e por safra.
- **Orçamento de Safra** — insumos, mão de obra, maquinário e **curva de desembolso**.
- **Rentabilidade Field-by-Field** — **ROI por talhão**, híbrido e variedade.
- **Controle de Arrendamento** — custo por área, vencimentos e histórico de reajustes.
- **Gestão de Contratos** — compra de insumos, venda de grãos e fixações, com **aviso de
  vencimento/renovação**.
- **Autorizações de Verba** — verba **autorizada × alocada × realizada** por centro de custo e
  safra, com **alerta de estouro**.
- **Cenários de Fluxo** — projeções de caixa por premissa (preço, produtividade, data de
  colheita).

## COGS (custo real por recorte)

O Financeiro alimenta o módulo **[Otimização de COGS](10-otimizacao-cogs.md)**, que consolida o
custo por etapa (matéria-prima → entrega) e por SKU/cultura/talhão/rota/região — incluindo a
etapa **Pegada de carbono** (tCO₂e × preço) vinda do módulo de Carbono.

## Integrações

- **Centros de custo + contratos → margem/ROI por talhão** (Talhão 360).
- **Orçamento estourado / contrato vencendo → Fila de Ações** da Torre.
- **Custos, fretes, perdas, insumos → COGS**.

## Eficiência

Você enxerga onde a margem vaza **antes** do prejuízo; o contrato e a parcela não vencem
esquecidos; e o custo por talhão/safra deixa de ser estimativa de fim de ano.
