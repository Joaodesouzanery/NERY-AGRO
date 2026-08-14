---
name: charts-recharts
description: Como criar/editar gráficos Recharts no AgroTorre reusando o kit de src/components/charts.tsx, o tema de src/lib/chart-theme.ts e o contrato de visão geral (ModuleOverviewSpec). Use ao adicionar gráfico, dashboard, tooltip ou KPI visual.
---

# Gráficos (Recharts)

Duas camadas, e a separação importa (evita warning de fast refresh):

- **`src/lib/chart-theme.ts`** — valores puros: `chartColors`, `chartPalette`, `formatValue`,
  e os tipos `ChartDatum`, `SeriesSpec`, `ValueFormat`. Sem React.
- **`src/components/charts.tsx`** — os componentes.

## Nunca escreva recharts direto — use o kit

- `ChartFrame({ title, description?, height?, empty?, emptyTitle?, emptyDescription?, action?, children })`
  — moldura com título, altura, empty state e **montagem tardia** (IntersectionObserver).
  É ela que segura `ResponsiveContainer`; nunca use `ResponsiveContainer` solto.
- `BarsChart({ data, xKey, series, layout?, format? })` — `layout="vertical"` deita as barras
  (bom para nomes longos: fazendas, rotas).
- `TrendChart({ data, xKey, series, area?, format? })` — linha ou área temporal.
- `DonutChart({ data, nameKey, valueKey, format?, colors? })` — composição.
- `Sparkline({ data, dataKey?, color? })` — mini-série dentro de um KPI.
- Domínio: `CashFlowChart({ data })`, `BreakEvenChart({ data, point })`.

`SeriesSpec = { key, name, color?, stackId? }` — `stackId` igual empilha as barras.

## Cores — SEMPRE do tema, nunca hex

```ts
import { chartColors, chartPalette } from "@/lib/chart-theme";
```

São CSS vars redefinidas em `:root` (claro) e `.dark` — **viram sozinhas nos dois temas**.
A paleta é **mono + 3 semáforos**: séries categóricas seguem `chartPalette`
(`primary → c1 → c2`); `success`/`warning`/`destructive` só quando o dado **é** semáforo
(status, severidade, dentro/fora da tolerância). Omitir `color` já pega a paleta na ordem.

## Formatação

`formatValue(v, "int" | "brl" | "kg" | "t" | "pct" | "co2e")` — pt-BR, um lugar só.
Passe `format` para o gráfico; o tooltip usa automaticamente.

## Dashboard de módulo: use o spec, não JSX solto

Visão geral de módulo não se escreve à mão. Monte um `ModuleOverviewSpec`
(`src/lib/overview/types.ts`) numa função **pura** em `src/lib/overview/<modulo>.ts` e
renderize com `<ModuleOverview spec={...} onSelectTab={...} />`. O mesmo spec alimenta a
tela **e** o export (`buildModuleWorkbook`) — "exportar tudo" sai de graça.

Cada gráfico/KPI/tabela leva o `tabId` da aba que cobre. Todo módulo tem um teste:

```ts
expect(overviewCoverage(spec).missing).toEqual([]);
```

É isso que garante "gráficos de todas as abas" e impede regressão quando alguém
adicionar uma aba nova.

## Faça / Evite

- Faça: memoizar `data` no pai com `useMemo` (ver `performance-patterns`).
- Faça: `empty` + `emptyDescription` dizendo **o que cadastrar** — nunca zero fabricado.
- Evite: dado inventado/`Math.random()` em modo REAL (há teste-guarda contra isso).
- Evite: `radius` de canto diferente de `[2,2,0,0]` — o design é `--radius: 3px`.
- Evite: exportar valores/funções de `charts.tsx` (quebra o fast refresh) — vão em
  `lib/chart-theme.ts`.

## Gate (nvm primeiro)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```
