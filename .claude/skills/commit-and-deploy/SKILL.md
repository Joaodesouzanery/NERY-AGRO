---
name: commit-and-deploy
description: Disciplina de commit e deploy do AgroTorre — main = produção (push auto-deploya na Vercel). Use ao commitar, dar push ou preparar deploy; rode o gate antes, assine o Co-Authored-By e nunca commite segredos.
---

# Commit e deploy (AgroTorre)

`main` é **produção**: push na `main` dispara auto-deploy na Vercel. Trate cada
commit como algo que pode ir ao ar.

## Antes de commitar — rode o gate

Sempre passe pela skill `verification-gate` (nvm + typecheck + lint + test:run +
build + smoke SSR) antes de commitar. O pre-commit do husky
(`.husky/pre-commit`) roda `npx lint-staged` → `npm run typecheck` →
`npm run test:run`; ele PRECISA do nvm carregado, senão `npx` falha:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
git add -A
git commit   # husky roda lint-staged + typecheck + test:run
```

O CI (`.github/workflows/ci.yml`, em push/PR) repete typecheck → lint →
test:run → build, protegendo o deploy mesmo se o hook for burlado.

## Mensagem de commit

Termine SEMPRE com esta linha (última linha do corpo):

```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

Use mensagem curta e descritiva; strings/descrições em pt-BR.

## Push e deploy

- Faça `git push` **somente quando o usuário autorizar**.
- Se não estiver numa branch de trabalho, crie uma antes (evite commitar direto
  na `main` sem autorização).
- Push na `main` = deploy automático na Vercel (produção).
- Mudou env var na Vercel? é preciso **refazer o deploy** para valer.

## Nunca commite segredos

- `.env` e `.vercel` estão no `.gitignore` — mantenha assim.
- `service_role` / chaves de servidor NUNCA vão para o cliente nem para o git.
- Confira o que está staged antes de commitar:

```bash
git status
git diff --cached --stat
```

## Faça / Evite

- Faça: rodar o gate completo antes de commitar (main = produção).
- Faça: carregar o nvm antes de `git commit` (senão o husky falha).
- Faça: terminar a mensagem com o `Co-Authored-By`.
- Evite: `git push` sem autorização explícita do usuário.
- Evite: commitar `.env`, `.vercel` ou qualquer segredo/`service_role`.
- Evite: commitar direto na `main` sem checar o gate e sem autorização.
