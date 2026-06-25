# Deploy do Nery Agro na Vercel (time braunafinance)

Guia para publicar o sistema completo (Talhão 360 + Calendário + Pecuária) num **novo
projeto Vercel** no time **braunafinance's projects**, apontando para o Supabase de
produção `fvglfmikqbzwpdfizprp`. Os dados de talhões já estão no Supabase (modo REAL),
então **aparecem automaticamente** assim que as variáveis forem configuradas.

> Por que pelo painel (e não por upload direto): importando o repositório do GitHub, o
> build sai do git — que **não** contém o `.env` — então as chaves não vazam. As
> variáveis são configuradas com segurança nas Settings do projeto.

---

## Passo 1 — Garantir o código completo no `main`
A versão completa está na branch `integration/merge-talhao360` (já no GitHub), pronta para
mesclar no `main` via PR:

  https://github.com/Joaodesouzanery/NERY-AGRO/pull/new/integration/merge-talhao360

- **Recomendado:** mesclar esse PR no `main` e usar `main` como Production Branch.
- **Alternativa (publicar já):** no Passo 2, definir a *Production Branch* como
  `integration/merge-talhao360` (ou `fix/talhao-360-block-1-hardening`) e mesclar no `main`
  depois.

## Passo 2 — Criar o projeto na Vercel
1. Acesse https://vercel.com/ e selecione o time **braunafinance's projects**.
2. **Add New… → Project**.
3. **Import Git Repository → `Joaodesouzanery/NERY-AGRO`**.
   - Se o repositório não aparecer, clique em **Adjust GitHub App Permissions** e
     conceda acesso a esse repo (pode exigir aprovação do dono do repo, Joaodesouzanery).
4. Configurações do projeto:
   - **Project Name:** `nery-agro` (ou `neriagro`).
   - **Framework Preset:** TanStack Start (já vem do `vercel.json`).
   - **Build Command:** `npm run build` (já vem do `vercel.json`).
   - **Production Branch:** `main` (ou a branch do Passo 1).
   - **NÃO clique em Deploy ainda** — configure as variáveis primeiro (Passo 3).

## Passo 3 — Variáveis de ambiente (Environment Variables)
Na tela de import (ou em **Settings → Environment Variables**), adicione, para o ambiente
**Production** (e marque também **Preview**):

| Nome | Onde achar o valor |
|---|---|
| `VITE_SUPABASE_URL` | linha correspondente no seu `.env` local |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | idem `.env` |
| `VITE_SUPABASE_PROJECT_ID` | idem `.env` |
| `SUPABASE_URL` | idem `.env` (usado no SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | idem `.env` (usado no SSR) |

> Atalho: abra o arquivo **`.env`** na raiz do projeto, **copie todo o conteúdo** e cole no
> campo de variáveis da Vercel (ela aceita colar um `.env` inteiro de uma vez). São as 5
> chaves acima, todas já apontando para o projeto `fvglfmikqbzwpdfizprp`.

## Passo 4 — Deploy
Clique em **Deploy**. Aguarde o build (~1–2 min). A Vercel dará a URL de produção
(ex.: `https://nery-agro.vercel.app`).

## Passo 5 — Verificação (não pular)
1. Abra a URL de produção.
2. Vá em **Campo → Talhões** e **Campo → Calendário**.
3. Confira o selo no topo: deve estar **REAL** (não DEMO).
4. Os talhões cadastrados devem aparecer (vêm do Supabase).
5. Se aparecer erro `Missing Supabase environment variable(s)` no console (F12), revise o
   Passo 3 e faça **Redeploy**.

### Checklist
- [ ] Código completo no `main` (ou Production Branch ajustada)
- [ ] Projeto `nery-agro` criado no time braunafinance
- [ ] 5 variáveis setadas em Production (e Preview)
- [ ] Deploy concluído sem erro de build
- [ ] Selo **REAL** e talhões aparecendo na URL de produção

---

## Observações
- O Supabase (`fvglfmikqbzwpdfizprp`) é independente da Vercel: este novo projeto Vercel
  usa o **mesmo** Supabase de hoje, então vê os **mesmos dados** do localhost (modo REAL).
- O `.env` continua **local e ignorado pelo git** — nunca suba ele ao repositório; as
  variáveis vivem nas Settings da Vercel.
- Se quiser um domínio próprio (ex.: `neriagro.com.br`), configure depois em
  **Settings → Domains**.
