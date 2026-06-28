# Arquitetura — Módulo Financeiro Nery Agro (estilo "Palantir Financial Management")

> **Contexto.** A inspiração é o **Palantir Financial Management**: uma superfície única que une **budget (planejado) + actuals (realizado) + contracting (contratos/obrigações)**, totalmente _configurável_ sobre um modelo de dados genérico. A meta é trazer esse mesmo modelo para a fazenda (dimensões talhão / cultura / centro de custo) sem reescrever o backend. **O MVP é entregue sem DDL** — tudo vive dentro de `financial_records.payload` (`module` + `payload jsonb`), reusando as libs `supabase-*` e o realtime já existentes. Normalização de tabelas e RLS por perfil ficam para a fase completa, quando houver necessidade real de drill-down e governança.

Visão: unificar **Orçamento (planejado)** + **Realizado (actuals)** + **Contratos/Obrigações** numa única superfície configurável, espelhando o Budget Planning Module + Unliquidated Obligations Inbox + Data Lineage da Palantir, adaptado para fazenda (talhão/cultura/centro de custo). Tudo sobre o modelo genérico atual (`financial_records` com `module` + `payload jsonb`), reusando as `supabase-*` libs e o realtime já existentes.

---

## 1) Modelo de dados

**Princípio:** zero migração estrutural no MVP. Tudo continua em `financial_records(module, payload jsonb)`. Adicionamos campos novos _dentro_ do `payload` e dois `module` novos. Tipagem hoje é `payload: Record<string,string>` — manter (o sistema já converte com `Number(...)`).

### 1a. Campos novos a injetar nos payloads existentes (fechar os `gaps`)

Acrescentar como dimensões de rastreabilidade/centro de custo. Todos opcionais para não quebrar registros legados.

| module              | campos novos no payload                                                                                                                                                                                            | finalidade Palantir                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `safra` (Orçamento) | `talhao_id`, `ciclo_id`, `centro_custo`, `aprovado_por`, `aprovado_em`, `status` (rascunho/aprovado/em_execucao/encerrado)                                                                                         | Fund Code / Allocated authorization + audit |
| `contratos`         | `contrato_id`, `talhao_id`, `ciclo_id`, `contraparte`, `tipo` (compra_insumo/venda_grãos/fixacao/frete/CSA), `vigencia_inicio`, `vigencia_fim`, `qtd_contratada`, `qtd_liquidada`, `preco_unit`, `saldo`, `status` | COAR / contrato com vigência e saldo        |
| `compras`           | `centro_custo`, `talhao_id`, `adiantamento_valor`, `adiantamento_data`, `adiantamento_liquidado`, `fornecedor_id`                                                                                                  | Unallocated need + adiantamentos            |
| `credito`           | `data_pagamento`, `juros_acumulados`, `status` (em_aberto/pago/vencido), `vinculo_safra`                                                                                                                           | Obrigação não liquidada                     |
| `inadimplencia`     | `data_pagamento`, `multa`                                                                                                                                                                                          | Reconciliação / deobligation                |
| `arrendamento`      | `reajuste_percentual`, `indice` (IGPM), `centro_custo`                                                                                                                                                             | Obrigação recorrente                        |

### 1b. Dois `module` novos (mesma tabela, zero DDL)

- **`autorizacao`** (Allocated vs Unallocated): `centro_custo`, `talhao_id`, `safra`, `tipo_verba` (total/insumos/mao_obra/maquinario), `valor_autorizado`, `valor_alocado` (= soma de compras/contratos vinculados), `valor_realizado`, `vigencia_inicio`, `vigencia_fim`, `status`. Espelha o modal "Create/Edit Authorization" (Total/Labor/Material Funds + datas). `valor_autorizado − valor_alocado = Unallocated`; `valor_alocado − valor_realizado = obrigação aberta`.
- **`cenario`** (Fluxo/Forecast): `nome`, `horizonte_semanas`, `premissas jsonb` (preço sc, produtividade, data colheita), `inflows`, `outflows` — base do cash-flow projection (gap "Forecast de Caixa").

### 1c. Camada derivada (sem persistência — calculada em TS)

- **Deobligation Stats** = `Σ(valor_alocado − valor_realizado)` por ano/centro de custo (verba comprometida e não usada).
- **Lineage** = grafo já implícito no audit: `financeiro.custos ← campo.insumos + logistica.fretes + operacoes.mao_obra` (lê de `field_records`/`operation_records` via snapshot existente).
- **Alertas** (motor de regra, igual ao `equilibrio` calc já existente):
  - estouro orçamento: `ciclo.custoRealizadoHa / custoPrevistoHa − 1 > threshold` (8%)
  - contrato vencendo: `vigencia_fim ∈ [hoje, hoje+Nd]`
  - verba ociosa: `unallocated > 0 e vigencia_fim < hoje`
  - margem negativa / inadimplência vencida / crédito a vencer (regras já no audit).

### 1d. Endurecimento (fase completa, opcional)

Tabela `cost_centers` e `contracts` normalizadas com FK só quando precisar de drill-down ("todos contratos Cargill") e RLS por perfil. RLS hoje é aberta — manter no MVP.

---

## 2) Abas / Telas propostas

Refatorar de 14 abas planas para **6 superfícies** sob um shell único "Gestão Financeira" (mantendo as 14 telas atuais como detalhes drill-down dentro delas). Banner **"TODOS OS DADOS SÃO ILUSTRATIVOS"** em Demo Mode (espelha "ALL DATA IS NOTIONAL").

1. **Orçamento (Budget Planning)** — Allocated vs Unallocated por centro de custo / talhão / cultura. Cards de autorização (Total/Insumos/Mão-obra/Maquinário) com barras alocado×não-alocado. Modal criar/editar autorização (valor, tipo de verba, vigência). Reusa: `safra`, `hectare`, `roi`. KPIs: orçado total, alocado, livre, % execução.
2. **Realizado (Actuals)** — DRE simplificada + custo por unidade/hectare realizado + fluxo de caixa real. Compara contra orçamento (delta planejado×realizado por talhão). Reusa: `fluxo`, `custos`, `hectare`, CashflowWorkspace, BarChart Recharts.
3. **Contratos (COARs)** — tabela de contratos com vigência, contraparte, qtd contratada×liquidada, saldo, status, **fulfillment %** (3750/5000 sc). Filtros por tipo/contraparte/status. Reusa: `contratos`, `arrendamento`, `credito`, `precos` (fixação).
4. **Obrigações / Compromissos (Unliquidated Obligations Inbox)** — a tela-assinatura Palantir. Filtros + **Deobligation Stats** (totais não gastos por ano/centro de custo) + tabela de compromissos pendentes (crédito, arrendamento, adiantamentos, contratos em aberto) com flag "fora de vigência"/atrasado, flag de regra (≈ flag ML) e ação **Liberar verba (Deobligate)** → toast "Alteração aplicada com sucesso". Reusa: `credito`, `arrendamento`, `compras` (adiantamentos), `inadimplencia`.
5. **Fluxo / Cenários (Forecast)** — projeção 12 semanas inflows×outflows, "caixa em risco" se forecast<0, comparação de cenários (preço/produtividade/data colheita). Reusa: motor de cálculo + module `cenario` novo.
6. **Lineage / Alertas (Data Lineage)** — grafo de proveniência (custo ← insumos+fretes+mão-obra), painel de alertas categorizados (Custo/Contrato/Verba/Inadimplência), audit trail (quem aprovou/quando via `aprovado_por`/`updated_at`). Reusa: `connected-agro-data.ts` snapshot + COGS aggregation (9 estágios já prontos como nós do lineage).

---

## 3) Faseamento

**MVP (sem DDL — só payload + UI):**

1. Injetar campos novos nos `FieldConfig` de `financial-agro-crud.tsx` (`safra`, `contratos`, `credito`, `compras`).
2. Criar module `autorizacao` + tela **Orçamento** (Allocated vs Unallocated + modal).
3. Criar tela **Obrigações** (Inbox + Deobligation Stats + ação deobligate = update de status).
4. Cálculos derivados (deobligation stats, alertas) como funções puras ao lado do `equilibrio`/COGS existentes.
5. Banner "DADOS ILUSTRATIVOS" + reorganizar shell em 6 abas.

**V2:**

6. Tela **Contratos** com fulfillment % e vínculo talhão/ciclo (`contrato_id` no ciclo de `field_records`).
7. Tela **Fluxo/Cenários** (module `cenario` + forecast 12 semanas).
8. **Lineage** visual reusando snapshot + COGS.

**Completo:**

9. Normalizar `contracts`/`cost_centers` + FKs para drill-down.
10. RLS por perfil (gerente financeiro / operacional / administrativo) substituindo demo binário.
11. Audit trail real (`aprovado_por` via `auth.uid()`), reconciliação bancária (`data_pagamento`).

---

## 4) O que reusar do que já existe

- **`supabase-financial.ts`** (CRUD genérico): serve sem alteração para `autorizacao` e `cenario` — basta passar o novo `module`. Não criar libs novas.
- **`financial-agro-crud.tsx`**: a estrutura `ModuleConfig` + `FieldConfig[]` + Dialog de criar/editar **é exatamente o modal "Create/Edit Authorization"** da Palantir — estender, não reescrever.
- **`connected-agro-data.ts`**: snapshot unificado (financial+operations+field) + `ControlAlert` + COGS 9-estágios = base pronta de **Lineage** e **Alertas**. `invalidateConnectedQueries` já propaga edições para dashboards cruzados.
- **Motor de regra calc** (ex.: `equilibrio = custo_fixo ÷ (preço − custo_var)`): mesmo padrão para deobligation stats e thresholds de alerta.
- **CashflowWorkspace + BarChart Recharts**: base das telas Realizado e Fluxo.
- **Realtime + query invalidation**: ação "Deobligate" reflete em tempo real (espelha "Successfully applied change").
- **Demo Mode** (`use-demo-mode`): vira o "ALL DATA IS NOTIONAL".
- **field_records (ciclos: custoPrevistoHa×custoRealizadoHa)** e **operation_records (fretes/mão-obra)**: dimensões de centro de custo (talhão) para Orçamento e Lineage.

### Arquivos críticos para implementação

- `/Users/joaonery/VS CODE/NERY AGRO/NERY-AGRO/src/components/financial-agro-crud.tsx`
- `/Users/joaonery/VS CODE/NERY AGRO/NERY-AGRO/src/lib/supabase-financial.ts`
- `/Users/joaonery/VS CODE/NERY AGRO/NERY-AGRO/src/lib/connected-agro-data.ts`
- `/Users/joaonery/VS CODE/NERY AGRO/NERY-AGRO/src/routes/financeiro.tsx`
- `/Users/joaonery/VS CODE/NERY AGRO/NERY-AGRO/supabase/schema.sql`
