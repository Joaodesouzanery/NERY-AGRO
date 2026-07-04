---
name: search-first
description: Antes de escrever código novo no AgroTorre, procure utilitário/hook/helper/componente já existente e reuse. Use quando for criar formatador, hook, cálculo de métrica, dado do mapa ou componente de UI.
---

# Procure antes de criar (AgroTorre)

Quase tudo já existe. Grep antes de escrever. Duplicar helper/hook/componente
gera drift e quebra o KISS/DRY do repo.

## Onde procurar primeiro

- **Merge de classes Tailwind**: `cn()` em `src/lib/utils.ts`. Nunca concatene
  className na mão.
- **Hooks**: `src/hooks/` — `use-auth.ts`, `use-mobile.tsx`,
  `use-demo-mode.ts`, `use-idle-logout.ts`. Precisa de sessão/org? use o
  `auth-provider` (`src/components/auth-provider.tsx`) via `use-auth`.
- **Métricas / cálculos**: `src/lib/*-metrics.ts` (`equipe-metrics`,
  `logistica-metrics`, `pecuaria-metrics`). Lógica pura, com testes ao lado.
- **Dados / modelo do mapa e da rede**: `src/lib/connected-agro-data.ts`
  (`buildUnifiedMapModel`, `buildNetworkMap`, métricas derivadas).
- **UI base**: `src/components/ui/*` (shadcn/Radix). Componente novo? veja se
  já existe button/card/dialog/table/tabs antes.
- **Import/Export**: `src/lib/import-parsing.ts` (read-excel-file),
  `exportRowsToXlsx` (xlsx), PDF em `src/features/rdc/pdf` e
  `src/components/control-tower-page.tsx` (jspdf). Arquivos exportados usam
  prefixo `agrotorre-*`.
- **Client Supabase**: `src/integrations/supabase/client.ts` (+ helper
  `isSupabaseConfigured`). Nunca instancie outro client.

## Como buscar

```bash
# helper/símbolo existente?
grep -rn "formatCurrency\|export function\|export const" src/lib
# hook existente?
grep -rln "use[A-Z]" src/hooks
# componente de UI já pronto?
ls src/components/ui
```

## Faça / Evite

- Faça: grep pelo nome/conceito em `src/lib`, `src/hooks`, `src/components/ui`
  antes de criar.
- Faça: colocar lógica pura em `src/lib/*` (testável) e reusar `cn()`.
- Faça: importar via alias `@/` (ex.: `import { cn } from "@/lib/utils"`).
- Evite: recriar `cn`, um client Supabase, um formatador ou um hook que já
  existe.
- Evite: duplicar cálculo de métrica — estenda o `*-metrics.ts` correspondente.
- Evite: novo componente quando `src/components/ui/*` já resolve.
