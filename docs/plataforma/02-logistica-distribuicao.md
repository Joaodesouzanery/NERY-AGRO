# 02 · Logística & Distribuição

**Visão:** tudo o que **se move** — da colheita ao cliente — com custo, posição e
rastreabilidade numa só tela. É onde a colheita vira registro e alimenta a Torre.

## Para quê

Parar de controlar romaneio, frota e entrega no WhatsApp/papel; saber onde cada carga está,
quanto custa cada rota e qual o saldo de caixas no campo.

## Funcionalidades (12)

- **Remessa/Recebimento** — romaneios da colheita; alimenta a Torre. **Cola o apontamento do
  WhatsApp** ou **lê a foto (OCR)** e o sistema extrai, confere e salva.
  _Captura:_ data, fazenda, talhão, pivô, cultura, variedade, placa, motorista, qtd. caixas,
  unidade, peso bruto/tara/líquido (kg), média (kg/cx), hora saída/chegada, ordem de produção,
  beneficiamento, ficou na lavoura, status.
- **Caixas vazias** — razão das caixas plásticas: saíram X pro campo, voltaram Y; **saldo por
  fazenda**. _Captura:_ data, fazenda, placa, tipo (saída/retorno), quantidade.
- **Cargas** — pedidos em separação, em trânsito e entregues; **posiciona pinos no mapa**.
  _Captura:_ código, cliente, cidade/lat/long de origem e destino, peso, valor, motorista,
  placa, status, ETA.
- **Motoristas** — equipe ativa, escala, posição atual e desempenho. _Captura:_ nome, CNH,
  telefone, veículo padrão, lat/long atual, status, score.
- **Rotas** — trajetos planejados com custo, SLA e paradas. _Captura:_ nome, origem/destino
  (lat/long), distância (km), SLA (h), paradas intermediárias.
- **Frota** — veículos com posição e situação. _Captura:_ placa, modelo, tipo, capacidade (kg),
  lat/long atual, status, última manutenção.
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
- **Gestão de Fretes e Custo de Transporte** — custo por rota. _Captura:_ rota, transportadora,
  km, custo total, combustível, pedágio, status.

## Visão Geral (KPIs)

Remessas · caixas colhidas · peso líquido · média kg/cx · fazendas · atrasadas · caixas
enviadas/retornadas e **saldo no campo** · total de cargas, em trânsito, entregues, valor em
rota, peso total · motoristas (disponíveis/em rota/folga, score médio) · rotas (distância, SLA
médio) · veículos (disponíveis/em rota/manutenção, capacidade) · fretes (custo total, custo por
km) · bases/filiais · roteiros (paradas, concluídos) · embalagens (abaixo do mínimo, saldo) ·
assinaturas (ativas/pausadas) · checklists (taxa de aprovação, pendentes).

## Integrações

- **Remessa/colheita → Torre** — caixas, peso e cargas nos KPIs e no mapa em tempo real.
- **Corte + carregamento** (deste módulo/RDC) → **fechamento de pagamento** com as diárias.
- **Fretes/perdas → COGS** — entram no custo por etapa.
- **Rastreabilidade origem → beneficiamento** desenhada no mapa.

## Eficiência

O apontamento do campo vira registro **sem redigitação**; o pagamento da colheita sai pronto; e
você enxerga a frota, o custo por rota e o saldo de caixas num lugar só.
