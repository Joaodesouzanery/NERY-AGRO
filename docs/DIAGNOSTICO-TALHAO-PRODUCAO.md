# Diagnóstico — Talhão funciona em DEMO mas não em REAL na produção (Vercel)

> Relatório exportável para o **Claude Code / desenvolvedor da conta dona do Vercel e do
> Supabase de produção**. Objetivo: explicar a causa exata e dar a correção definitiva.

## Sintoma relatado
- No **localhost**: Talhão 360 funciona perfeitamente em **DEMO e REAL**.
- Na **produção (Vercel)**: Talhão 360 funciona **só em DEMO**; em **REAL** não carrega/salva.
- Ao fazer `git pull`, vem uma **versão desatualizada**.

---

## Causa raiz (confirmada): a produção é buildada SEM as variáveis do Supabase

O cliente Supabase em
[`src/integrations/supabase/client.ts`](../src/integrations/supabase/client.ts#L11-L19)
**lança erro** se as variáveis não existirem no momento do build/execução:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(`Missing Supabase environment variable(s)...`);
}
```

E o cliente é instanciado **de forma preguiçosa** (Proxy na linha 34): ele só tenta criar
a conexão **na primeira vez que o código acessa o Supabase**.

- **Modo DEMO** grava/lê apenas no `localStorage` do navegador
  ([`talhao-360/api/services.ts`](../src/features/talhao-360/api/services.ts#L24-L60)) →
  **nunca toca no Supabase** → funciona mesmo sem as variáveis.
- **Modo REAL** chama `supabase.from("field_records")`
  ([`src/lib/supabase-field.ts`](../src/lib/supabase-field.ts#L11)) → dispara a criação do
  cliente → **sem as variáveis, lança o erro** → o talhão REAL não carrega.

### Por que falta a variável só na produção?

| | Localhost | Produção (Vercel) |
|---|---|---|
| Fonte das variáveis | arquivo **`.env` no disco** (existe na máquina) | precisa estar nas **Env Vars do projeto Vercel** |
| `.env` está no `origin/main`? | — | **NÃO** (verificado: `git cat-file -e origin/main:.env` falha) |
| Vite consegue inlinar `VITE_SUPABASE_URL`? | **Sim** (lê o `.env` local) | **Não**, se a Vercel não tiver as vars configuradas |
| Resultado em REAL | conecta no Supabase ✅ | cliente lança "Missing Supabase env var" ❌ |

O `.env` **não é versionado** no `origin/main` (a branch que o Vercel builda). Como a
Vercel **não usa** um `.env` commitado por padrão — ela injeta variáveis a partir das
**Environment Variables do projeto** —, se essas variáveis não estiverem configuradas no
painel, o bundle de produção sai sem elas e o modo REAL quebra.

> Importante: as tabelas do Supabase **existem** (o localhost REAL grava/lê do projeto
> `fvglfmikqbzwpdfizprp` com sucesso). O problema **não é** banco/migração — é
> **configuração de variáveis de ambiente na Vercel**.

---

## Causa secundária: a produção builda código ANTIGO

Mesmo corrigindo as variáveis, a produção ainda roda a versão **parcial e antiga** do
Talhão 360:

- `origin/main` tem `talhao-360/api/services.ts` com **195 linhas** (integração parcial,
  commit `d134da7`).
- A branch `fix/talhao-360-block-1-hardening` tem **454 linhas** (versão completa: perímetro
  da fazenda, persistência demo, integração com Calendário e Pecuária, abas extras).

Por isso, em produção, faltam Calendário e a integração de Pecuária — eles **nunca foram
mesclados** no `main`.

### Por que "git pull traz versão desatualizada"
- O `main` local está em `f198d06` (muito atrás); o `origin/main` está em `d134da7`.
- A versão completa está na branch `fix/talhao-360-block-1-hardening`, **não mesclada**.
- Quem faz `pull` no `main` recebe o código **sem** a versão completa. A Vercel, buildando
  `main`, faz o mesmo.

---

## Correção definitiva (passo a passo para a conta de produção)

### Passo 1 — Configurar as variáveis na Vercel (resolve o "só funciona DEMO")
No painel: **Vercel → Project → Settings → Environment Variables**, ambiente
**Production** (e **Preview**), adicione:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://fvglfmikqbzwpdfizprp.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | a **publishable/anon key** do projeto `fvglfmikqbzwpdfizprp` |
| `SUPABASE_URL` | `https://fvglfmikqbzwpdfizprp.supabase.co` (para o SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | a mesma publishable/anon key (para o SSR) |

> Os valores estão no `.env` local do iagod (já apontam para esse projeto). Pegue-os de lá
> ou no dashboard do Supabase em **Settings → API**.

Depois: **Deployments → Redeploy** (sem cache).

### Passo 2 — Levar o código completo para produção
A versão completa está na branch `fix/talhao-360-block-1-hardening` (já no GitHub). Opções:
- Abrir/mesclar o **PR para o `main`**:
  `https://github.com/Joaodesouzanery/NERY-AGRO/pull/new/fix/talhao-360-block-1-hardening`
  (resolver os ~23 conflitos mantendo a versão completa desta branch + a sidebar/ícones do
  main — ver [`docs/HANDOFF-PRODUCAO.md`](./HANDOFF-PRODUCAO.md)); **ou**
- Apontar a **Production Branch** da Vercel temporariamente para
  `fix/talhao-360-block-1-hardening` (Settings → Git → Production Branch) para validar.

### Passo 3 — Higiene de Git/segredos
- **Remover o `.env` do versionamento** e adicioná-lo ao `.gitignore` (já que contém
  chaves). Manter as variáveis **apenas** nas Env Vars da Vercel e num `.env` local.
- Conferir se a **publishable/anon key** exposta não é a `service_role` (essa **nunca**
  deve ir para o cliente nem para o git). A `anon`/`publishable` no cliente é o esperado.

---

## Como confirmar a causa em 1 minuto (antes de corrigir)
1. Abrir o site em produção, **F12 → Console**.
2. Ir em **Campo → Talhão 360** e alternar para o modo **REAL**.
3. Se aparecer **`Missing Supabase environment variable(s)`** (ou erro ao criar o cliente),
   a causa é a **falta das variáveis na Vercel** (Passo 1).
4. Se conectar mas faltarem Calendário/abas/Pecuária, é a **causa secundária** (Passo 2).

## Checklist
- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` setadas na Vercel (Production)
- [ ] `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` setadas (SSR)
- [ ] Redeploy feito; modo **REAL** conecta (badge REAL, sem erro no console)
- [ ] Branch completa mesclada no `main` (ou Production Branch ajustada)
- [ ] `.env` removido do git e adicionado ao `.gitignore`
