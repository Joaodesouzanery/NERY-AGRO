# 06 · RDC — Relatório Diário de Campo

**Visão:** o **dia da operação registrado** — o que foi feito no campo, na pecuária e na equipe,
com foto e custo — e o **pagamento da colheita fechado** a partir daí.

## Para quê

Ter um registro diário único da operação (em vez de bilhetes e áudios soltos), que serve ao
mesmo tempo de diário, de fonte de KPI e de base do **pagamento da colheita**.

## Funcionalidades

- **Ficha diária** — cabeçalho do dia: turno, responsável, clima e resumo. Pode haver **mais de
  uma ficha por dia** (turnos/equipes diferentes).
- **Itens por seção** — cada item registra tipo, descrição, quantidade, unidade, **custo (R$)**,
  severidade, status e responsável, agrupados em:
  - **Campo** — atividades e ocorrências do talhão.
  - **Pecuária** — manejo/sanidade do rebanho.
  - **Observações & Fotos** — registro livre com anexos.
  - **Equipe & Máquinas** — mão de obra e maquinário do dia.
- **Fotos** anexadas por seção (com upload isolado por empresa).
- **Links** por **talhão** e por **animal** — o item do dia aponta para a área/animal
  envolvidos.
- **Fechamento de pagamento** — soma automática de **corte + carregamento + diárias/mão de
  obra** do período, virando o valor a pagar da colheita.

## Integrações

- **Colheita/corte/carregamento + diárias → pagamento** (o cálculo vive aqui).
- **Ocorrências (rdc-entry) → KPI de ocorrências e pinos no mapa** da Torre.
- **RDC de hoje** aparece resumido na **Torre**.

## Eficiência

O que aconteceu no campo alimenta os KPIs **e** o pagamento — no mesmo lançamento. Acaba a
planilha paralela de diárias e o retrabalho de fechar a folha da colheita.
