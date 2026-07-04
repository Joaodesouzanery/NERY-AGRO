---
name: maplibre-map-patterns
description: Como mexer no mapa MapLibre do AgroTorre — adicionar categoria de pino, camadas cluster/point/label, ícones e filtro/legenda. Use ao editar o mapa operacional, ícones de pontos, rotas ou a fonte de dados do mapa.
---

# Mapa MapLibre (AgroTorre)

Arquivos-chave:

- `src/components/interactive-map.tsx` — renderização MapLibre (camadas, ícones, popups).
- `src/components/unified-map-page.tsx` — mapa operacional: filtro/legenda por módulo.
- `src/lib/connected-agro-data.ts` — dados dos pontos/rotas (`buildUnifiedMapModel`, `buildNetworkMap`, `useConnectedAgroData`). Tipos `MapPoint`/`MapRoute` vêm de `@/components/carto-map`.

## Camadas (em `interactive-map.tsx`)

- Source com `cluster: true`, `clusterMaxZoom: 14`, `clusterRadius: 48`.
- `clusters` + `cluster-count` — bolhas de aglomeração.
- `unclustered-point` — pino isolado; `icon-image` = `["get", "iconKey"]`, `icon-allow-overlap: true`.
- `point-label` — nome do ponto (só aparece a partir do zoom 7).

## Ícones: como um pino é desenhado

`iconSvg(key)` monta o SVG a partir de 4 mapas (linhas ~98–146 e ~294–355):

- `mapIconConfig[key]` → `{ label, color }` (cor + rótulo curto do pino).
- `KEY_TO_ICON[key]` → nome do glifo; `ICON_PATHS[glifo]` → o `path` SVG (fallback `alert`).
- `categoryNames[key]` → nome amigável na legenda.

O `iconKey` de cada ponto sai de `iconKeyFor(point)` (usa `point.iconKey`, cai em `"alerta"` se a chave não existir em `mapIconConfig`).

## Adicionar uma categoria nova (ex.: `armazem`)

1. `mapIconConfig`: `armazem: { label: "AM", color: "#..." }`.
2. `KEY_TO_ICON`: `armazem: "<glifo>"` (reusar um glifo de `ICON_PATHS` ou adicionar um novo path lá).
3. `ICON_PATHS`: só se criar glifo novo.
4. `categoryNames`: `armazem: "Armazém"` (aparece na legenda).
5. Emitir pontos com `iconKey: "armazem"` em `connected-agro-data.ts` (ex.: `points.push({ ..., iconKey: "armazem", moduleId, tone })`).

Sem a entrada nos 4 mapas o pino cai no fallback `alerta`.

## Filtro / legenda (mapa operacional)

Em `unified-map-page.tsx`: `buildUnifiedMapModel(snapshot, lastUpdatedAt)` gera `model.points`/`model.routes`; o filtro esconde por `moduleId`:

```ts
const visiblePoints = model.points.filter(
  (point) => !(point.moduleId && hidden.has(point.moduleId)),
);
```

Para uma categoria entrar no filtro, os pontos precisam de `moduleId` coerente com os toggles da legenda.

## Faça / Evite

- Faça: tocar SÓ nos 4 mapas de ícone + emitir `iconKey`/`moduleId` nos dados.
- Faça: pinos isolados sempre visíveis (o clustering já resolve densidade); não force zoom mínimo neles.
- Evite: usar cor de origem externa sem checar a CSP — tiles já liberados são cartocdn/arcgisonline/openstreetmap/`demotiles.maplibre.org` em `src/server.ts`. Fonte/estilo novo → liberar em `img-src`/`connect-src`.
- Evite: recriar o mapa a cada render — dados entram via `useMemo` e callbacks via `callbacksRef.current`/`dataRef.current` (ver skill performance-patterns).

## Gate (nvm primeiro)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```
