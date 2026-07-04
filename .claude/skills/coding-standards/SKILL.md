---
name: coding-standards
description: Estilo e convenções de código do AgroTorre — use ao escrever/editar TS/TSX, resolver erro de lint/format, decidir nomes/imports ou padronizar um arquivo antes de commitar.
---

# Padrões de código

Rodar o gate com o nvm carregado (Node 20 fora do PATH padrão):

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint
npm run format        # prettier --write . (aplica formatação)
```

O pre-commit já roda `eslint --fix` + `prettier` nos arquivos staged (via lint-staged).

## Formatação (Prettier)

- `printWidth: 100`, **aspas duplas**, `semi: true`, `trailingComma: all`.
- Não brigue com o formatter — rode `npm run format` em vez de alinhar à mão.

## Lint (ESLint flat — `eslint.config.js`)

- `@typescript-eslint/no-explicit-any` = **warn**: evite `any`; tipe de verdade.
- Warnings pré-existentes: ~9 de `react-refresh/only-export-components` em `src/components/ui/*` são aceitáveis (não zere à força). O gate exige **0 erros** — warnings tudo bem.
- Variável intencionalmente não usada: prefixe com `_` (ex.: `_event`).
- Regras server-only do TanStack são impostas — respeite a fronteira cliente/servidor.

## TypeScript & imports

- `strict` ligado; alias `@/*` → `src/*`. Importe com `@/` em vez de caminho relativo longo:

  ```ts
  import { supabase } from "@/integrations/supabase/client";
  import { buildUnifiedMapModel } from "@/lib/connected-agro-data";
  ```

## Convenções do produto

- Toda string visível ao usuário em **pt-BR**.
- **Imite o arquivo vizinho**: densidade de comentário, nomenclatura e estrutura. Consistência local > preferência pessoal.
- KISS / DRY / YAGNI: solução mais simples que resolve; extraia repetição para `src/lib/*`; não crie abstração especulativa.
- Não crie arquivo novo se dá pra editar um existente; nada de doc `.md` não solicitada.

## Faça / Evite

- Faça: passar `typecheck` + `lint` (0 erros) antes de commitar.
- Faça: usar `@/*`, aspas duplas e pt-BR nas mensagens.
- Evite: `any` novo; `// eslint-disable` sem justificativa.
- Evite: reformatar arquivo inteiro ao mudar 1 linha (ruído de diff) — deixe o Prettier decidir.
