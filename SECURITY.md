# Segurança — AgroTorre

Modelo de segurança e checklist de manutenção. **A fronteira de segurança real é a
RLS do Supabase** — o cliente é código não-confiável; toda autorização e isolamento
são impostos no banco.

## Ação obrigatória após clonar/deployar

Rode as migrações em `supabase/migrations/` **na ordem** no seu projeto Supabase.
A mais importante para segurança:

- **`20260717120000_rls_lockdown.sql`** — fecha um vazamento em que as tabelas
  `financial_records`, `operation_records`, `field_records`, `animal_pdf_records`
  tinham policies permissivas legadas (`open_* … to anon using(true)`) que anulavam o
  isolamento por empresa. A migração dropa TODA policy dessas tabelas, recria só as
  org-scoped (`org_id = current_org_id()`, `to authenticated`) e revoga `anon`.

Verificação (deve retornar só policies org-scoped, `roles = {authenticated}`, nenhuma
com `qual = true`):

```sql
select tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('financial_records','operation_records','field_records',
                    'animal_pdf_records','cost_centers','contracts')
order by tablename, cmd;
```

## Autenticação e sessão

- Login por e-mail+senha via Supabase Auth (`src/lib/auth.ts`, `src/routes/login.tsx`).
- Defesa: honeypot anti-bot, throttle local (5 tentativas → 60s), sem enumeração de
  usuário (erro genérico "e-mail ou senha incorretos"), auto-logout por inatividade
  (`src/hooks/use-idle-logout.ts`, 30 min).
- Sessão no `localStorage` (padrão do Supabase JS). Aceitável porque **não há
  superfície de XSS** (ver abaixo); o backstop é a RLS.
- Guarda de rota `RequireAuth` (`src/routes/__root.tsx`) é conveniência de UI — a
  segurança dos dados é a RLS.

## Multi-tenant / RLS

- Isolamento por `org_id`. `org_id` é preenchido por trigger `set_org_id`
  (`app_set_org_id`) — **nunca** confiado do cliente. `current_org_id()` e
  `is_org_member()`/`is_platform_admin()` são `security definer`.
- Toda tabela de dados tem RLS `org_id = current_org_id()` para `authenticated`.
  Storage (`rdc-photos`, `animal-pdfs`) é privado, isolado pelo 1º segmento do path.
- **Super-admin global** (`platform_admins`) — RLS select-only pelo próprio uid, sem
  grant de INSERT (não dá para se autopromover); só o trigger `handle_new_user`
  marca admin, a partir de uma allowlist de e-mails.
- Guarda de regressão: `src/lib/supabase-rls-guard.test.ts` falha se o `schema.sql`
  canônico ou uma migração nova reintroduzir `to anon`/`using (true)`.

## Cabeçalhos / CSP

- `src/server.ts` anexa a todas as respostas SSR: CSP, HSTS (preload),
  X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy,
  Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy,
  X-Permitted-Cross-Domain-Policies. `vercel.json` replica os não-CSP para os
  estáticos.
- CSP: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `base-uri 'self'`, `upgrade-insecure-requests`; `script-src` **sem** `'unsafe-eval'`
  (e com **nonce por resposta** — sem `'unsafe-inline'`).
- **Regra:** ao usar uma origem externa nova (fonte, CDN, API, tile), libere-a na
  diretiva certa (`connect-src`/`img-src`/`style-src`/`font-src`) ou quebra em produção.

## Segredos

- O cliente só recebe a chave **publishable/anon** (`vite.config.ts` `define` injeta
  só `SUPABASE_PUBLISHABLE_KEY`). `service_role` **nunca** no cliente.
- `.gitignore` cobre `.env*` e `.vercel`. Sourcemaps off em produção (default do Vite).

## XSS

- React escapa por padrão. Os únicos pontos de HTML cru: a landing
  (`dangerouslySetInnerHTML` de uma **constante estática**) e os popups do MapLibre
  (`escapeHtml` em todo valor; `safeHref` barra `javascript:`/`data:`). Sem entrada
  não-confiável chegando a `innerHTML`.

## Reportar vulnerabilidade

Abra uma issue privada ou contate o mantenedor (neryadministrativo@gmail.com).
