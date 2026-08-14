# AgroTorre — Módulos e funcionalidades, em detalhe

> Documento **exaustivo**: a visão de cada módulo e **cada funcionalidade (aba por aba)**,
> com o que faz e os dados que captura. Complementa a [visão geral](visao-geral-plataforma.md).
>
> Convenção: cada funcionalidade traz sua **descrição** e, quando útil, _Captura:_ (os campos
> que registra). Itens marcados "preparada/prevista" existem na estrutura e estão prontos para
> ativação. www.agrotorre.com.br

---

## Torre de Controle

**Visão:** o cockpit que junta a operação inteira numa tela, ao vivo.

- **Mapa operacional** — cargas, talhões, bases, rotas, frota e focos ambientais
  georreferenciados; cada ícone abre o módulo de origem; medir/desenhar área no mapa.
- **Painel Executivo** — KPIs da operação inteira: OTIF, vendas, cargas, alertas, COGS,
  caixas colhidas, peso líquido, pegada de CO₂e e nº de módulos ativos.
- **Fila de Ações** — alertas de todos os módulos priorizados por gravidade (orçamento
  estourado, contrato vencendo, carga atrasada, ocorrência de campo).
- **RDC de hoje** — resumo do diário de campo do dia (fichas, itens, ocorrências, talhões).

---

## Logística & Distribuição

**Visão:** tudo o que se move — da colheita ao cliente — com custo, posição e rastreabilidade.
Tem uma **Visão Geral** com KPIs por sub-área (remessas, cargas, motoristas, rotas, frota,
fretes, bases, roteiros, embalagens, assinaturas, checklists).

- **Remessa/Recebimento** — romaneios da colheita; alimenta a Torre. Cola o apontamento do
  WhatsApp ou lê a foto (OCR). _Captura:_ data, fazenda, talhão, pivô, cultura, variedade,
  placa, motorista, qtd. caixas, unidade, peso bruto/tara/líquido (kg), média (kg/cx), hora
  saída/chegada, ordem de produção, beneficiamento, ficou na lavoura, status.
- **Caixas vazias** — razão das caixas plásticas (saíram X pro campo, voltaram Y; saldo por
  fazenda). _Captura:_ data, fazenda, placa, tipo, quantidade.
- **Cargas** — pedidos em separação, em trânsito e entregues; posiciona pinos no mapa.
  _Captura:_ código, cliente, cidade/lat/long de origem e destino, peso, valor, motorista,
  placa, status, ETA.
- **Motoristas** — equipe ativa, escala, posição atual e desempenho. _Captura:_ nome, CNH,
  telefone, veículo padrão, latitude/longitude atual, status, score.
- **Rotas** — trajetos planejados com custo, SLA e paradas. _Captura:_ nome, origem/destino
  (lat/long), distância (km), SLA (h), paradas intermediárias.
- **Frota** — veículos com posição e situação. _Captura:_ placa, modelo, tipo, capacidade
  (kg), lat/long atual, status, última manutenção.
- **Bases e Filiais** — matriz, filiais e centros de distribuição. _Captura:_ nome, tipo,
  endereço, cidade/UF, lat/long, responsável.
- **Roteirização de Entregas na Cidade** — sequência urbana de paradas. _Captura:_ rota,
  motorista, veículo, bairros atendidos, paradas, distância, tempo previsto, status.
- **Controle de Embalagens e Estoque** — saldos, mínimos e reposição. _Captura:_ item, SKU,
  saldo, estoque mínimo, fornecedor, validade, status.
- **Sistema de Cestas/Assinaturas (CSA)** — planos recorrentes. _Captura:_ cliente, plano,
  frequência, próxima entrega, itens padrão, pausa até, status.
- **Checklist de Expedição Pré-carga** — conferência antes da saída. _Captura:_ pedido,
  responsável, itens previstos/conferidos, temperatura, lacres, status.
- **Gestão de Fretes e Custo de Transporte** — custo por rota. _Captura:_ rota,
  transportadora, km, custo total, combustível, pedágio, status.

---

## Financeiro & COGS

**Visão:** o custo verdadeiro e a margem — do fluxo de caixa ao ROI por talhão. (15 funções.)

- **Fluxo de Caixa Simples** — entradas e saídas adaptado ao produtor.
- **Custos por Unidade** — custo de produção automático por dúzia, saca ou kg.
- **Controle de Inadimplência** — alertas de pagamentos pendentes de clientes (cobrança).
- **Gestão de Estoque de Produtos Acabados** — prontos para venda, reservas e validade.
- **Cálculo de Ponto de Equilíbrio** — quanto vender para cobrir os custos.
- **Gestão de Compras** — lista de compras baseada na necessidade de insumos.
- **Controle de Crédito Rural** — acompanhamento de parcelas de financiamentos.
- **Tabela de Preços Dinâmica** — preços para atacado, varejo e assinaturas.
- **Custo por Hectare** — real × planejado por talhão e por safra.
- **Orçamento de Safra** — insumos, mão de obra, maquinário e curva de desembolso.
- **Rentabilidade Field-by-Field** — ROI por talhão, híbrido e variedade.
- **Controle de Arrendamento** — custo por área, vencimentos e histórico de reajustes.
- **Gestão de Contratos** — compra de insumos, venda de grãos e fixações (com vencimento).
- **Autorizações de Verba** — verba autorizada × alocada × realizada por centro de custo e
  safra (com alerta de estouro).
- **Cenários de Fluxo** — projeções de caixa por premissa (preço, produtividade, data de
  colheita).

---

## Campo & Produção

**Visão:** do plantio à colheita, com custo por hectare e por talhão. (18 funções + Visão Geral
com KPIs.)

- **Áreas e Talhões** — mapeamento visual, histórico de solo, coordenadas GPS. _Captura:_
  talhão, área (ha), cultura, histórico de uso do solo, GPS, status.
- **Calendário de Plantio/Colheita** — cronograma por sazonalidade + alerta de colheita.
  _Captura:_ cultura, talhão, janela de plantio, colheita prevista, sazonalidade, alerta.
- **Diário de Campo Digital** — notas, fotos, áudio, geolocalização (offline-first).
  _Captura:_ título, talhão, observação, foto, áudio, GPS.
- **Registro de Insumos** — sementes, fertilizantes e defensivos por talhão. _Captura:_
  insumo, tipo, talhão, dose, carência (dias), custo por hectare.
- **Manejo de Pragas e Doenças** — ocorrências, mapa de focos, tratamentos. _Captura:_
  ocorrência, talhão, severidade, tratamento, receituário agronômico, GPS do foco, carência
  pós-aplicação.
- **Rastreabilidade de Lotes** — QR Code por lote, cadeia de custódia, conformidade orgânica.
- **Gestão de Solo** — análises químicas, calagem e histórico. _Captura:_ talhão, pH, MO,
  CTC, recomendação de calagem, data do laudo.
- **Controle de Irrigação** — turnos de rega, consumo por talhão, integração IoT preparada.
  _Captura:_ talhão, turno automático, consumo (m³), sensor IoT, status.
- **Previsão Meteorológica** — previsão de 7 dias, alertas push preparados, histórico.
- **Gestão de Maquinário** — manutenção preventiva, horímetro, custo operacional. _Captura:_
  máquina, horímetro, troca de óleo, alerta de manutenção, custo operacional.
- **Estimativa de Safra** — produtividade esperada, histórico e cenários por talhão.
- **Planejamento de Plantio por Talhão** — variedade, taxa de semeadura, espaçamento, janela.
- **Mapa de Prescrição** — taxa variável por zona; exportação para máquina preparada.
- **Monitoramento + Modelo de Cultura** — simulação de crescimento por clima, solo, manejo e
  genética (estágio fenológico, projeção, sensibilidade ao clima).
- **Scouting de Campo** — notas, fotos e alertas georreferenciados para o agrônomo.
- **Estimativa Pré-Colheita** — amostragem digital para logística, contratos e projeção.
- **Análise de Solo Integrada** — importação de laudos, recomendação automática, histórico por
  camada.
- **Gestão de Nitrogênio** — dose preditiva por clima e solo, janelas, risco de perda por
  chuva.

---

## Talhão 360°

**Visão:** cada talhão por inteiro, num painel único.

- **Desenhar/medir a área no mapa** — sem depender do perímetro cadastrado (perímetro opcional
  valida contenção).
- **Painel por talhão** — reúne custo, margem/ROI, carbono e eventos daquela área.
- **Perímetro da fazenda** — geometria GeoJSON, opcional.

---

## RDC — Relatório Diário de Campo

**Visão:** o dia da operação registrado — e o pagamento da colheita fechado.

- **Ficha diária** — turno, responsável, clima, resumo; múltiplas fichas por dia.
- **Seções da ficha** (itens com tipo, descrição, quantidade, unidade, custo, severidade,
  status, responsável):
  - **Campo** — atividades e ocorrências do talhão.
  - **Pecuária** — manejo/sanidade do rebanho.
  - **Observações & Fotos** — registro livre com anexos.
  - **Equipe & Máquinas** — mão de obra e maquinário do dia.
- **Fotos** anexadas por seção; **links** por talhão e por animal.
- **Fechamento de pagamento** — corte + carregamento + diárias/mão de obra somados
  automaticamente.

---

## Pecuária

**Visão:** rebanho rastreável ponta a ponta, com custo por arroba e resultado. Abas:

- **Visão Geral** — KPIs: cabeças ativas, GMD médio do rebanho, custo/@, arrobas de carcaça,
  lotação, DG pendente, doses em estoque, elegível UE, abate projetado.
- **Rebanho** — ficha individual por animal (cards/lista), busca, dossiê; **QR Code no
  brinco**; categoria, curva de peso.
- **Lotes** — criação e detalhe de lotes, transferência entre lotes, romaneio.
- **Manejo** — sub-abas **Sanidade** (calendário sanitário, carências), **Reprodução** (ciclo,
  IEP, diagnóstico de gestação, estoque de sêmen), **Produção** (leite/ovos, lançamentos).
- **Pastos** — sub-abas **Lotação** e **Uso do solo**; ocupação/descanso em timeline.
- **Rastreabilidade** — cadeia de custódia, **Registro de GTA** e movimentações.
- **Resultados** — custo por arroba, arrobas de carcaça, margem, abate projetado, desempenho.
- **Modo Curral** — tela dedicada ao manejo no curral.

---

## Emissão de Carbono

**Visão:** a pegada integrada ao custo e à decisão — não um relatório à parte. Abas:

- **Emissões (pegada de carbono)** — atividade × fator = CO₂e por **escopo 1/2/3** (combustão
  direta, energia comprada, cadeia — frete/insumos), categoria, talhão e safra. _Captura:_
  atividade, escopo, categoria, fonte emissora, volume, unidade, fator (kg CO₂e/un.), CO₂e
  (kg), talhão, safra, período, status. **Auto-captura** a partir de rebanho, cargas e fretes;
  inventário, intensidade por tonelada e meta anual; relatório em Excel. Integra COGS/Torre/
  Talhão 360.
- **Certificações** — checklist de certificação orgânica, auditor, validade, pendências,
  status.
- **Caderno de Campo para Agroecologia** — práticas, insumos naturais, observações, evidência.
- **Controle de Resíduos e Compostagem** — origem, resíduo, volume, destino, lote de composto,
  maturação.
- **Monitoramento de APPs e Limites** — área monitorada, coordenadas, ocorrência, ação
  corretiva, responsável.

---

## Inteligência

**Visão:** lucratividade, tendência, preço de mercado e perdas com causa.

- **Lucratividade por Cultura Comparada** — receita, custo, margem e safra por cultura.
- **Desempenho Mês a Mês / Ano a Ano** — indicadores por período, comparativo e tendência em
  gráficos.
- **Alertas de Preços CEASA/CNA** — alertas por produto, praça/fonte e limite de preço.
- **Relatório de Perdas com Causas** — produto/cultura, volume perdido, causa, valor estimado
  e ação.

---

## Otimização de COGS

**Visão:** onde a margem é consumida — e o que muda em cada cenário.

- **Etapas de Produção** — custo por etapa, da matéria-prima à entrega final (por produto/SKU,
  família, planta/base, região).
- **Fontes de Custo** — ERP, MES, WMS, financeiro, campo, frete e perdas num modelo unificado.
- **Ineficiências Ocultas** — onde a margem é consumida (perda, rota, processo, complexidade),
  com impacto no COGS (%), valor estimado e ação recomendada.
- **Simulações de Cenário** — impacto de fornecedor, rota, processo, preço de insumo, perda e
  capacidade (economia estimada, risco).
- **Relatórios Granulares** — COGS por SKU, família, cultura, talhão, animal/lote, planta,
  rota e região.
- **Atualização Contínua** — monitoramento de preço de insumos, fretes, perdas e custos em
  tempo real (evento, valor anterior/atual, variação %).
- Inclui a etapa **Pegada de carbono** (tCO₂e × preço de referência), vinda do módulo de
  Carbono.

---

## Equipe & Vendas

**Visão:** pessoas, tarefas e vendas — com o custo de mão de obra ligado à colheita e ao COGS.

- **Vendas Diretas e Clientes** — cadastro de clientes, canal (WhatsApp, feira, loja...),
  pedidos e valor. _Captura:_ cliente, canal, produto/lote, quantidade, valor, data, status.
- **Gestão de Mão de Obra e Equipe** — diárias, tarefas e custo por colaborador. _Captura:_
  colaborador, função, atividade, data, horas trabalhadas, custo, status.
- **To-Do List da Operação** — tarefas prioritárias do dia. _Captura:_ tarefa, responsável,
  prioridade (alta/média/baixa), prazo, status.

---

## Camadas que atravessam todos os módulos

- **Tempo real** — lançou num módulo, a Torre e os KPIs atualizam na hora.
- **Mapa operacional único** — uma tela interativa que abre cada módulo.
- **Ingestão sem digitar** — colar do WhatsApp + OCR do romaneio de papel (a foto não sai do
  aparelho).
- **Rastreabilidade com QR** — lote e animal escaneáveis, prontos para auditoria.
- **Multi-empresa** — cada empresa isolada; gestor transita entre fazendas.
- **Segurança** — isolamento por empresa no banco (RLS), políticas endurecidas, logout por
  inatividade.
- **Exporta pronto** — PDF e Excel direto dos módulos.
- **Feito para o campo** — celular, modo claro (sol) e escuro (noite).

---

_Este documento descreve as capacidades e a estrutura da plataforma; funcionalidades marcadas
como "preparada/prevista" estão prontas para ativação e não contêm métricas de clientes.
AgroTorre — www.agrotorre.com.br_
