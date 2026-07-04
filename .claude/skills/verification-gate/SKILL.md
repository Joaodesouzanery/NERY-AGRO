---
name: verification-gate
description: Como validar QUALQUER mudança no AgroTorre antes de dar por concluída — rode o gate (nvm + typecheck + lint + test:run + build) e o smoke SSR. Use sempre antes de dizer "pronto", commitar ou abrir PR.
---

# Gate de verificação (AgroTorre)

Nenhuma mudança está "pronta" sem passar por este gate. Rode-o inteiro, sem
pular etapas, antes de concluir, commitar ou abrir PR.

## 1. Carregar o nvm PRIMEIRO

Node 20 vem via nvm e NÃO está no PATH padrão. Sem isso, `npm`/`npx` falham.

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
```

`.nvmrc` fixa a versão (20). Rode o carregamento no mesmo comando composto do
gate — o cwd/shell não persiste entre chamadas de bash.

## 2. Rodar o gate (nesta ordem)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck   # tsc --noEmit — 0 erros
npm run lint        # eslint . — 0 erros (~9 warnings pré-existentes em src/components/ui/* são OK)
npm run test:run    # vitest run — todos verdes
npm run build        # vite build — deve completar
```

- `typecheck`: TS 5.8 strict, alias `@/*`. Zero erros.
- `lint`: ESLint flat. Zero **erros**. Os ~9 warnings de
  `react-refresh/only-export-components` em `src/components/ui/*` já existiam — não
  conte como regressão, mas não adicione novos (nem `any`).
- `test:run`: Vitest 4. Todos verdes. Se tocou em lógica pura
  (`src/lib/*-metrics.ts`, `import-parsing.ts`, `connected-agro-data.ts`,
  `src/features/*/schemas`), rode/atualize os testes.
- `build`: pega erros que só aparecem no bundle SSR/Nitro.

## 3. Smoke SSR

Suba o dev e confira que as rotas críticas respondem 200 (SSR não quebrou):

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run dev &   # anote a porta impressa
# em outra chamada, com a porta certa:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/login
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/torre-de-controle
```

Esperado: `200` nas três. Encerre o dev depois.

## Faça / Evite

- Faça: rodar o gate inteiro antes de qualquer "pronto"/commit/PR.
- Faça: carregar o nvm no mesmo comando composto do npm.
- Faça: relatar o resultado real de cada etapa (typecheck/lint/test/build/smoke).
- Evite: dizer "pronto" só porque o typecheck passou.
- Evite: introduzir novos warnings de ESLint ou `any`.
- Evite: pular o build achando que o dev basta — o bundle SSR é diferente.
