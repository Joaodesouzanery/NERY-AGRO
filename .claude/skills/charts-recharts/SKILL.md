---
name: charts-recharts
description: Como criar/editar gráficos Recharts no AgroTorre reusando os componentes de src/components/charts.tsx e as cores do design mono-dark. Use ao adicionar gráfico de área/linha/barra, tooltip ou KPI visual.
---

# Gráficos (Recharts)

Todos os gráficos vivem em `src/components/charts.tsx`. Antes de criar um novo, **reuse** um destes:

- `MiniArea({ data, dataKey?, color? })` — sparkline com gradiente.
- `CashFlowChart({ data })` — barras `entradas`/`saidas`.
- `TrendLine({ data, keys })` — múltiplas linhas (`keys: {key,color,name}[]`).
- `BreakEvenChart({ data, point })` — linhas receita/custo + `ReferenceLine` no ponto de equilíbrio.

Tipo de dados: `ChartDatum = Record<string, string | number>`.

## Cores (design mono-dark) — use SEMPRE `chartColors`

Nunca hardcodar hex; puxe das variáveis CSS via o objeto exportado:

```ts
import { chartColors } from "@/components/charts";
// chartColors.primary | c2 | c3 | c4 | c5 | border | mutedFg | popover
```

## Container e tooltip (padrão do repo)

- Sempre dentro de `<ResponsiveContainer>` (o pai deve ter altura definida).
- Eixos discretos: `stroke={chartColors.mutedFg}`, `fontSize={11}`, `tickLine={false}`, `axisLine={false}`.
- Grade: `<CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />`.
- Tooltip: reusar o `tooltipStyle` interno via `<Tooltip contentStyle={...}>` — fundo `popover`, borda `border`, `borderRadius: 3`, `fontSize: 12` (cantos quase quadrados, coerente com o design).

## Novo gráfico (só se nenhum servir)

Exportar uma função no mesmo arquivo, imitando os vizinhos:

```tsx
export function EstoqueBar({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={chartColors.mutedFg}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke={chartColors.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: chartColors.popover,
            border: `1px solid ${chartColors.border}`,
            borderRadius: 3,
            fontSize: 12,
          }}
        />
        <Bar dataKey="qtd" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## Faça / Evite

- Faça: reusar componente existente; strings visíveis em pt-BR (ex.: label "Equilíbrio").
- Faça: memoizar `data` no pai com `useMemo` para evitar re-render (ver performance-patterns).
- Evite: cores fixas/temas claros — o produto é mono-dark, só `chartColors`.
- Evite: `<ResponsiveContainer>` sem altura no wrapper (colapsa para 0).

## Gate (nvm primeiro)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```
