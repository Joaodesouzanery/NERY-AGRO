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
- **`20260721120000_lockdown_platform_admin_emails.sql`** — liga a RLS na tabela
  `platform_admin_emails` (allowlist de super-admins), criada sem RLS e que permitia
  enumerar os e-mails dos donos da plataforma via PostgREST. Após aplicar, rode os
  **Advisors** (Database → Advisors) e confirme zero `rls_disabled_in_public`.

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
  usuário (mesma mensagem genérica para credencial inválida E e-mail não confirmado),
  auto-logout por inatividade (`src/hooks/use-idle-logout.ts`, 30 min).
- **Rate-limit real de força-bruta é do Supabase Auth** — o throttle/honeypot do login
  são só UX (client-side, contornáveis via API direta). Confira/endureça em
  Supabase → Auth → Rate Limits; para brute-force distribuído, habilite **CAPTCHA**
  (hCaptcha/Turnstile — nativo do Supabase Auth), a única defesa server-verificada.
  Pendência aberta (decisão atual: só documentar).
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
  marca admin, a partir da allowlist `platform_admin_emails`, que tem RLS ligada e sem
  grant a `anon`/`authenticated` (não é enumerável).
- Guarda de regressão: `src/lib/supabase-rls-guard.test.ts` falha se o `schema.sql`
  canônico ou uma migração nova reintroduzir `to anon`/`using (true)`, **ou se alguma
  tabela criada ficar sem RLS**.

## Cabeçalhos / CSP

- `src/server.ts` anexa a todas as respostas SSR: CSP, HSTS (preload),
  X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy,
  Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy,
  X-Permitted-Cross-Domain-Policies. `vercel.json` replica os não-CSP para os
  estáticos.
- CSP: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `base-uri 'self'`, `upgrade-insecure-requests`; `script-src` com **nonce por resposta**
  (sem `'unsafe-inline'`) e **sem** `'unsafe-eval'`.
- **`'wasm-unsafe-eval'` no `script-src`** (habilita **apenas WebAssembly**): necessário
  para o **OCR on-device** (Tesseract.js, núcleo WASM) que lê a foto do romaneio. É bem
  mais restrito que `'unsafe-eval'` — **não** permite `eval()`/`new Function()` de
  strings. Os assets do Tesseract são **auto-hospedados** em `/tesseract` (same-origin,
  cobertos por `script-src 'self'` + `worker-src 'self' blob:` + `connect-src 'self'`);
  **nenhuma origem externa nova** e **a foto não sai do dispositivo** (OCR 100% local).
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

## Riscos residuais e hardening futuro

Decisões conscientes (não são falhas exploráveis hoje, mas ficam registradas):

- **Sessão em `localStorage`** (`src/integrations/supabase/client.ts`) — access + refresh
  token legíveis por JS. Risco aceito enquanto a CSP for rígida (nonce, sem
  `unsafe-inline` no `script-src`). Endurecimento definitivo: auth por cookie `httpOnly`
  via `@supabase/ssr`. Dívida técnica.
- **`style-src 'unsafe-inline'`** na CSP — necessário (Tailwind/MapLibre injetam estilo
  inline; o nonce não cobre atributo `style`). Não habilita XSS de script.
- **Guarda de rota é client-side** — **invariante**: toda nova rota/loader de servidor
  que devolva dado de empresa DEVE aplicar `requireSupabaseAuth`; o `RequireAuth` da UI
  não protege dado (só a RLS protege).
- **`xlsx@0.18.5`** tem CVEs (prototype pollution / ReDoS) sem fix na linha do npm. Uso
  no app é só **exportação** (escrita), fora do parsing de entrada não-confiável (a
  leitura de planilhas usa `read-excel-file`). Atualizar para a linha hospedada pela
  SheetJS quando viável.

## Reportar vulnerabilidade

Abra uma issue privada ou contate o mantenedor (neryadministrativo@gmail.com).
