# 00 · A camada única e a eficiência que gera

## O problema que resolve

Hoje a operação de uma fazenda vive **espalhada**: o campo num caderno, a pecuária num app, o
financeiro numa planilha, a logística no WhatsApp. Ninguém enxerga o todo, os números não
conversam, e a decisão só chega no **fim do mês** — quando o prejuízo já aconteceu.

## A ideia: uma camada única

O AgroTorre coloca **tudo o que se move e tudo o que produz** numa camada só, conectada e ao
vivo. Você lança em qualquer módulo e os indicadores da operação inteira **atualizam na hora**,
na mesma tela.

```
Você lança  ──▶  Camada única  ──▶  Torre de Controle
campo · pecuária       conecta, calcula        KPIs, mapa e alertas
logística · financeiro   e cruza os dados         em tempo real
```

Não é figura de linguagem — é como o sistema é construído: um **snapshot conectado** lê de
todos os módulos e os cruza para a Torre, o COGS, o mapa e os alertas.

## Como os módulos conversam (integrações reais)

| Origem                                               | → destino                 | O que acontece                                                            |
| ---------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Colheita / Remessa                                   | Torre                     | Caixas, peso e cargas entram nos KPIs e nos pinos do mapa na hora         |
| Corte + Carregamento + Diárias                       | RDC / Pagamento           | Viram o **fechamento de pagamento** da colheita automaticamente           |
| Emissão de Carbono                                   | COGS · Torre · Talhão 360 | A pegada vira **etapa de custo** (tCO₂e × preço), KPI e painel por talhão |
| Centros de custo + Contratos                         | Financeiro / Talhão       | Alimentam a **margem/ROI por talhão**                                     |
| Rebanho (pec\_\*)                                    | Pecuária / Torre          | Conta **cabeças ativas** e custo por arroba na visão geral                |
| Qualquer entidade (motorista, cliente, talhão, lote) | Mapa                      | É um **link** que abre o módulo dono                                      |

## A eficiência que isso gera

- **Fim das planilhas soltas** — um lugar só, atualizado ao vivo, não cinco arquivos que
  ninguém concilia.
- **Decisão na hora** — os KPIs da operação inteira em tempo real; o problema aparece enquanto
  ainda dá para agir.
- **Custo verdadeiro** — COGS e margem por etapa, produto, rota e talhão; onde o lucro vaza
  fica visível.
- **Menos perdas** — perda com causa, valor e ação, e alertas antes do prejuízo.
- **Rastreabilidade para auditar** — QR, GTA, orgânico e carbono prontos para comprador e
  certificadora.
- **Menos digitação** — colar do WhatsApp e foto do romaneio (OCR no aparelho) viram registro;
  o pagamento da colheita sai pronto.
- **Uma tela no lugar de vários sistemas** — ERP + campo + pecuária + logística + carbono, sem
  trocar de janela.

Veja a implementação técnica dessa camada em
**[12 · Arquitetura, tempo real e segurança](12-arquitetura-seguranca.md)**.
