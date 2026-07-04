---
name: tdd-vitest
description: Como escrever e rodar testes Vitest no AgroTorre — use ao criar/ajustar teste, testar métricas/parsing/schemas, cobrir lógica pura ou quando um teste falha.
---

# Testes com Vitest

Rodar SEMPRE com o nvm carregado (Node 20 não está no PATH padrão):

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run test:run          # roda tudo uma vez (é o que o CI e o pre-commit usam)
npm run test              # watch, para desenvolver
```

Config em `vitest.config.ts`. Ambiente **node por padrão**; ative jsdom por arquivo com o comentário no topo, só quando testar componente/DOM:

```ts
// @vitest-environment jsdom
```

## Onde fica o teste

- Padrão: `src/**/*.{test,spec}.{ts,tsx}`, **ao lado da lógica** que testa.
  Ex.: `src/lib/import-parsing.ts` → `src/lib/import-parsing.test.ts`.
- Foque em **lógica pura** (é o que já tem cobertura e o melhor ROI):
  - `src/lib/*-metrics.ts` (`equipe-metrics`, `logistica-metrics`, `pecuaria-metrics`)
  - `src/lib/import-parsing.ts`, `src/lib/connected-agro-data.ts`
  - `src/features/*/schemas` (validação zod)
- Componentes: use `@testing-library/react` + jsdom, só quando o comportamento não couber em função pura.

## Exemplo (lógica pura)

```ts
import { describe, expect, it } from "vitest";
import { parseImportRows } from "./import-parsing";

describe("parseImportRows", () => {
  it("descarta linhas sem coluna obrigatória", () => {
    expect(parseImportRows([{ nome: "" }])).toEqual([]);
  });
});
```

## Faça / Evite

- Faça: nomear casos em pt-BR descrevendo o comportamento; testar bordas (vazio, negativo, string malformada).
- Faça: rodar `npm run test:run` antes de commitar — o pre-commit (`.husky/pre-commit`) e o CI derrubam se algo quebrar.
- Faça: extrair a regra para `src/lib/*` e testar lá, em vez de testar via UI.
- Evite: jsdom "por precaução" — mantenha node quando não há DOM (mais rápido, menos flaky).
- Evite: testar Supabase/rede real; teste a transformação dos dados, não o cliente.
- Evite: snapshots de UI grandes e frágeis; prefira asserções explícitas.
