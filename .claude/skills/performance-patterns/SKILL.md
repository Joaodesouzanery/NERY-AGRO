---
name: performance-patterns
description: Padrões de performance do AgroTorre — memoização com custo real, evitar re-render do mapa MapLibre, staleTime do React Query e lazy import de libs pesadas (maplibre/jspdf/xlsx). Use ao otimizar render, cache de dados ou tamanho de bundle.
---

# Performance (React / Query / Mapa)

Regra de ouro: **não otimize sem medir**. Memoize onde há custo real (listas grandes, builders de mapa, gráficos), não em tudo.

## Mapa: nunca recriar a instância

Em `src/components/interactive-map.tsx` o mapa é criado uma vez e alimentado por refs — imite isso:

- Instância/DOM em `useRef` (`mapRef`, `containerRef`, `loadedRef`).
- Dados via `useMemo`: `pointData`/`routeData`, `pointLookup`/`routeLookup` (`new Map(...)`).
- Callbacks e dados "vivos" em refs sincronizadas por `useEffect`, lidos dentro dos handlers do MapLibre:

```ts
const callbacksRef = useRef({ onPointClick, onRouteClick, pointLookup, routeLookup });
useEffect(() => {
  callbacksRef.current = { onPointClick, onRouteClick, pointLookup, routeLookup };
});
// no handler: callbacksRef.current.pointLookup.get(id)
```

Assim novas props/callbacks não disparam re-init do mapa.

## React Query: staleTime

Default global já é `staleTime: 60_000` (`src/router.tsx`). Suba para dados que mudam pouco (ex.: signed URL de foto no RDC usa `staleTime: 50 * 60 * 1000`). Só reduza quando precisar de dado sempre fresco.

## Lazy import de libs pesadas

Carregue sob demanda para não inflar o bundle da rota:

- `xlsx` (~550 kB): já lazy em `exportRowsToXlsx` (`const XLSX = await import("xlsx")`) — use o helper, não importe estático.
- `jspdf`/`jspdf-autotable`: importe dentro do handler de export quando possível.
- `maplibre-gl`: fica no componente de mapa; não importe em rotas que não mostram mapa.

Padrão: `const Mod = await import("mod")` dentro do evento, não no topo do módulo de rota.

## Memoização com critério

- `useMemo` para builders/derivações caras (`buildUnifiedMapModel`, `data` de gráficos, `new Map(...)`).
- `useCallback` só quando o callback vai para dependência/ref ou componente memoizado.
- Não envolva valores primitivos baratos.

## Faça / Evite

- Faça: medir (React DevTools Profiler / bundle) antes de refatorar.
- Faça: dados do mapa em `useMemo`, callbacks em refs — zero re-init.
- Faça: respeitar/ajustar `staleTime` conforme volatilidade do dado.
- Evite: `import "xlsx"`/`jspdf` estático no topo de uma rota.
- Evite: memoizar por reflexo (YAGNI) — só onde há custo comprovado.

## Gate (nvm primeiro)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```
