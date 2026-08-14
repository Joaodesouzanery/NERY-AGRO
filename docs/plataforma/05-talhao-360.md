# 05 · Talhão 360°

**Visão:** **cada talhão por inteiro**, num painel único — o cruzamento de custo, margem,
carbono e eventos daquela área, sobre o mapa.

## Para quê

Descer a conta de rentabilidade ao **nível do talhão**: saber qual pedaço da fazenda dá lucro,
quanto custou, quanto emitiu e o que aconteceu ali.

## Funcionalidades

- **Desenhar / medir a área no mapa** — traça e mede o talhão direto no mapa, **sem depender do
  perímetro cadastrado**. O perímetro da fazenda é **opcional** e, quando existe, valida a
  contenção das áreas internas.
- **Painel por talhão** — reúne, para a área selecionada:
  - **Custo** (insumos, maquinário, mão de obra da área).
  - **Margem / ROI** (via centros de custo e contratos com aquele talhão).
  - **Carbono** (emissões atribuídas ao talhão).
  - **Eventos** (ocorrências, RDC, insumos, pragas daquela área).
- **Perímetro da fazenda** — geometria (GeoJSON) opcional, editável no mapa.

## Integrações

- **Financeiro (centros de custo + contratos)** → margem/ROI por talhão.
- **Emissão de Carbono** → painel de pegada por talhão.
- **Campo / RDC** → eventos e custos da área.

> Observação: a margem/ROI por talhão depende de os centros de custo e contratos terem o
> **mesmo nome de talhão** — é o campo que amarra o cruzamento.

## Eficiência

A rentabilidade deixa de ser "da fazenda inteira" e passa a ser **por talhão** — a base para
decidir o que plantar, onde investir e o que cortar.
