# 04 · Campo & Produção

**Visão:** do **plantio à colheita**, com custo por hectare e por talhão — o coração agronômico
da plataforma. 18 funções cobrindo talhão, solo, insumos, pragas, clima, maquinário e safra.

## Para quê

Tirar o campo do caderno: registrar o que acontece em cada talhão (com GPS, foto e áudio),
planejar plantio e colheita, e ter o **custo por hectare** calculado sozinho.

## Funcionalidades (18)

- **Áreas e Talhões** — mapeamento visual, histórico de solo, GPS. _Captura:_ talhão, área
  (ha), cultura, histórico de uso do solo, coordenadas, status.
- **Calendário de Plantio/Colheita** — cronograma por sazonalidade + **alerta de colheita**.
  _Captura:_ cultura, talhão, janela de plantio, colheita prevista, sazonalidade, alerta.
- **Diário de Campo Digital** — notas, fotos, áudio e observações com GPS (**offline-first**).
  _Captura:_ título, talhão, observação, foto, áudio, GPS.
- **Registro de Insumos** — sementes, fertilizantes e defensivos por talhão. _Captura:_ insumo,
  tipo, talhão, dose, carência (dias), **custo por hectare**.
- **Manejo de Pragas e Doenças** — ocorrências, **mapa de focos**, tratamentos. _Captura:_
  ocorrência, talhão, severidade, tratamento, receituário agronômico, GPS do foco, carência
  pós-aplicação.
- **Rastreabilidade de Lotes** — **QR Code** por lote, cadeia de custódia, conformidade
  orgânica.
- **Gestão de Solo** — análises químicas, calagem e histórico. _Captura:_ talhão, pH, MO, CTC,
  recomendação de calagem, data do laudo.
- **Controle de Irrigação** — turnos de rega, consumo por talhão, **integração IoT preparada**.
  _Captura:_ talhão, turno automático, consumo (m³), sensor IoT, status.
- **Previsão Meteorológica** — previsão de 7 dias, **alertas push preparados**, histórico.
- **Gestão de Maquinário** — manutenção preventiva, horímetro, custo operacional. _Captura:_
  máquina, horímetro, troca de óleo, alerta de manutenção, custo operacional.
- **Estimativa de Safra** — produtividade esperada, histórico e cenários por talhão.
- **Planejamento de Plantio por Talhão** — variedade, taxa de semeadura, espaçamento, janela.
- **Mapa de Prescrição** — taxa variável por zona; **exportação para máquina preparada**.
- **Monitoramento + Modelo de Cultura** — simulação de crescimento por clima, solo, manejo e
  genética (estágio fenológico, projeção, sensibilidade ao clima).
- **Scouting de Campo** — notas, fotos e alertas georreferenciados para o agrônomo.
- **Estimativa Pré-Colheita** — amostragem digital para logística, contratos e projeção.
- **Análise de Solo Integrada** — importação de laudos, recomendação automática, histórico por
  camada.
- **Gestão de Nitrogênio** — dose preditiva por clima e solo, janelas, risco de perda por chuva.

## Visão Geral (KPIs)

Talhões (área total, culturas, georreferenciados, área média) · janelas (colheita ≤30d,
vencidas) · registros de diário (sincronizados, com foto/áudio) · insumos (custo/ha total e
médio, com carência) · ocorrências (severidade alta/média, talhões afetados, focos com GPS) ·
lotes (conformes/não conformes) · solo (pH médio, talhões ácidos, MO, CTC) · irrigação (consumo,
com sensor IoT) · meteorologia (riscos ativos) · maquinário (custo operacional, manutenção
pendente) · estimativas, planos, prescrições, simulações, scouting, amostragens, análises e
nitrogênio — cada um com seu total e média.

## Integrações

- **Insumos/maquinário → COGS e custo por hectare** (Financeiro).
- **Ocorrências → RDC e Fila de Ações** (Torre).
- **Talhão → Talhão 360** (painel único por área).
- **Lotes/QR → rastreabilidade** ponta a ponta.

## Eficiência

Custo por hectare e por talhão calculado sozinho; a **janela de colheita não passa batida**; e o
que o agrônomo vê no campo já entra no sistema, com foto e GPS.
