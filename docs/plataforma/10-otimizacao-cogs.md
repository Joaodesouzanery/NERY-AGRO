# 10 · Otimização de COGS

**Visão:** **onde a margem é consumida** — o custo real por etapa e por recorte, num modelo que
unifica todas as fontes de custo, e o "e se?" de cada mudança.

## Para quê

Sair do custo médio "de fazenda" para o **custo por etapa, SKU, cultura, talhão, animal, rota e
região** — e simular o impacto de trocar fornecedor, rota ou processo **antes** de fazer.

## Funcionalidades

- **Etapas de Produção** — custo por etapa, da **matéria-prima à entrega final**. _Captura:_
  produto/SKU, etapa, família, planta/base, região, custo, volume, status.
- **Fontes de Custo** — ERP, MES, WMS, financeiro, campo, frete e perdas num **modelo
  unificado**. _Captura:_ fonte, tipo, módulo de origem, campo-chave, período, status.
- **Ineficiências Ocultas** — onde a margem é consumida (perda, rota, processo, complexidade).
  _Captura:_ ponto crítico, causa, produto/SKU, **impacto no COGS (%)**, valor estimado, ação
  recomendada.
- **Simulações de Cenário** — impacto de fornecedor, rota, processo, preço de insumo, perda e
  capacidade. _Captura:_ cenário, alavanca, impacto no COGS (%), economia estimada, risco.
- **Relatórios Granulares** — COGS por **SKU, família, cultura, talhão, animal/lote, planta,
  rota e região**. _Captura:_ SKU/produto, família, cultura/lote, planta/rota, região, COGS,
  margem.
- **Atualização Contínua** — monitoramento de preço de insumos, fretes, perdas e custos **em
  tempo real**. _Captura:_ evento, origem, valor anterior/atual, variação (%), data.

## A etapa "Pegada de carbono"

O COGS inclui a etapa **Pegada de carbono** = tCO₂e × preço de referência, vinda do módulo de
**[Emissão de Carbono](08-emissao-de-carbono.md)** — o carbono entra no custo, não fica à parte.

## Visão Geral (KPIs)

Fontes conectadas/ativas e **cobertura de COGS** · pontos críticos (perda estimada, críticos
≥5%, maior impacto) · eventos monitorados (em alta/queda, maior variação).

## Integrações

- **← Financeiro, Campo, Logística/fretes, Perdas, Carbono** — todas as fontes de custo.
- **→ Torre** — KPI de COGS.

## Eficiência

O custo real fica **visível por recorte** — e dá para **simular a mudança antes de fazê-la**,
com economia e risco estimados.
