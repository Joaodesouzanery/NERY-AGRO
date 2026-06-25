# Handoff de produção — Talhão 360, Calendário, Campo e Pecuária

> Documento de entrega para o **Claude Code da conta dona do Supabase de produção**
> (projeto `fvglfmikqbzwpdfizprp`). Objetivo: deixar as features de **Talhão 360,
> Calendário, Campo e Pecuária** funcionando de forma **definitiva no Supabase**, e não
> apenas localmente.
>
> Autor da feature: **iagod** — branch `fix/talhao-360-block-1-hardening`.

---

## 1. Diagnóstico — por que "funciona local mas quebra em produção"

Há dois motivos independentes, ambos confirmados no código:

### 1.1. Modo DEMO grava no navegador, não no Supabase
Em [`src/components/demo-provider.tsx`](../src/components/demo-provider.tsx#L12):

```ts
setDemoModeState(saved == null ? import.meta.env.DEV : saved === "true");
```

- **Em desenvolvimento** (`npm run dev`) o modo DEMO liga sozinho → todos os dados de
  talhão/calendário vão para o `localStorage` do navegador (chaves `nery-demo-mode`,
  `nery-talhao360-demo-overrides`, `nery-talhao360-demo-extra-records`). Por isso na
  máquina do dev **sempre funciona**, mesmo sem banco.
- **Em produção** o modo DEMO fica desligado → o app entra em modo **REAL** e passa a
  ler/gravar nas **tabelas reais do Supabase** via
  [`src/lib/supabase-field.ts`](../src/lib/supabase-field.ts) (`field_records`),
  [`src/lib/supabase-operations.ts`](../src/lib/supabase-operations.ts)
  (`operation_records`) e [`src/lib/animal-pdfs.ts`](../src/lib/animal-pdfs.ts)
  (`animal_pdf_records` + Storage).

Cada página mostra um badge **DEMO/REAL** (ex.:
[`calendar-page.tsx:154`](../src/features/campo-calendar/components/calendar-page.tsx#L154)).
Em produção esperamos **REAL**.

### 1.2. As tabelas não existem no Supabase de produção
As migrações estão versionadas em [`supabase/migrations/`](../supabase/migrations/), mas
**nunca foram aplicadas** ao projeto de produção `fvglfmikqbzwpdfizprp`. Em modo REAL,
todo `select`/`insert` em `field_records` falha → as abas aparecem vazias ou quebradas.

> O dev iagod **não consegue** aplicar essas migrações: o projeto de produção pertence a
> outra conta Supabase. Por isso este runbook é para o Claude Code **dessa** conta.

### 1.3. (Contexto) o código ainda não está no `main`
A branch `fix/talhao-360-block-1-hardening` tem a versão **completa** da feature. O `main`
recebeu apenas uma integração **parcial e antiga** (commit `d134da7`), **sem** o
Calendário, **sem** a integração de Pecuária e **sem** várias abas. Ver §5.

---

## 2. Inventário das features

| Aba | Código | Onde grava (modo REAL) |
|---|---|---|
| **Talhão 360** (lista de talhões, página 360°, editor de mapa/polígono, ciclos, alertas, relatórios, cadastro) | [`src/features/talhao-360/**`](../src/features/talhao-360/), rotas `src/routes/campo_.talhoes*.tsx` | tabela `field_records`, módulos `areas`, `talhao360-farm`, `talhao360-event`, `talhao360-alert` |
| **Calendário** (calendário de tarefas/eventos do campo, integração com talhões) | [`src/features/campo-calendar/**`](../src/features/campo-calendar/), rota `src/routes/campo_.calendario.tsx` | `field_records`, módulos `calendar-event`, `calendar-template`, `calendar-status`, `calendario` (legado) + lê `areas`/`talhao360-event` |
| **Campo** (hub, pontos de entrada para Talhão 360 e Calendário) | [`src/routes/campo.tsx`](../src/routes/campo.tsx) | `field_records` |
| **Pecuária** (curva de peso, fichas em PDF, integração com talhões) | [`src/routes/pecuaria.tsx`](../src/routes/pecuaria.tsx), `src/features/talhao-360/components/pecuaria-*`, [`src/lib/animal-pdfs.ts`](../src/lib/animal-pdfs.ts) | `operation_records`, `animal_pdf_records` + bucket Storage `animal-pdfs` |

**Pontos importantes**
- Não há uma tabela por feature. Tudo de Campo/Talhão/Calendário vai para **uma única
  tabela `field_records`**, diferenciada pela coluna `module` (texto). Logo, basta a
  tabela existir — nenhum schema por módulo é necessário.
- Pecuária usa `operation_records` (animais), gera PDFs em `animal_pdf_records` e os
  arquivos vão para o bucket público `animal-pdfs`.

---

## 3. Modelo de dados a garantir em produção

| Objeto | Tipo | Usado por |
|---|---|---|
| `public.field_records` | tabela `(id uuid, module text, payload jsonb, created_at, updated_at)` | Talhão 360, Calendário, Campo |
| `public.operation_records` | tabela `(id uuid, area text, module text, payload jsonb, …)` | Pecuária (animais) e outros módulos operacionais |
| `public.financial_records` | tabela `(id uuid, module text, payload jsonb, …)` | COGS/financeiro (e realtime) |
| `public.animal_pdf_records` | tabela (metadados de PDF) | Pecuária (fichas) |
| Storage bucket `animal-pdfs` | bucket público | Pecuária (arquivos PDF) |
| Publicação `supabase_realtime` | inclui as tabelas acima | sincronização em tempo real |

Todas as tabelas têm **RLS habilitado com políticas liberadas** para `anon` e
`authenticated` (select/insert/update/delete) — é o que o app espera hoje.

---

## 4. Runbook de aplicação (escolha **um** caminho)

> **Pré-condição:** ter o código da branch completa disponível (ver §5) e saber qual
> projeto Supabase a Vercel usa (ver §4.4).

### Caminho A — Supabase CLI (recomendado: aplica TODAS as migrações em ordem)
```bash
# na raiz do repositório, já com a branch completa
supabase login
supabase link --project-ref fvglfmikqbzwpdfizprp
supabase db push      # aplica tudo em supabase/migrations/ que ainda não foi aplicado
```

### Caminho B — Supabase MCP (Claude Code aplica migração por migração)
Para cada arquivo em `supabase/migrations/` (em ordem cronológica), chame
`apply_migration` no projeto `fvglfmikqbzwpdfizprp` com o conteúdo do `.sql`.
Mínimo necessário para as 4 features: `…_create_financial_records.sql`,
`…_create_operation_records.sql`, `…_create_field_records.sql`,
`…_create_animal_pdf_records.sql`, `…_enable_connected_realtime.sql`.

### Caminho C — SQL Editor do dashboard (colar o script consolidado)
Cole **todo** o bloco abaixo no SQL Editor do projeto e execute. É **idempotente**
(`if not exists` / `on conflict`), então pode rodar mais de uma vez sem quebrar.

```sql
-- ===== field_records (Talhão 360 / Calendário / Campo) =====
create table if not exists public.field_records (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists field_records_module_created_at_idx
  on public.field_records (module, created_at desc);
alter table public.field_records enable row level security;

-- ===== operation_records (Pecuária / operacional) =====
create table if not exists public.operation_records (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists operation_records_module_created_at_idx
  on public.operation_records (module, created_at desc);
create index if not exists operation_records_area_module_idx
  on public.operation_records (area, module);
alter table public.operation_records enable row level security;

-- ===== financial_records (COGS / financeiro) =====
create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists financial_records_module_created_at_idx
  on public.financial_records (module, created_at desc);
alter table public.financial_records enable row level security;

-- ===== animal_pdf_records + bucket (Pecuária / fichas PDF) =====
create table if not exists public.animal_pdf_records (
  id uuid primary key default gen_random_uuid(),
  animal_record_id text not null,
  animal_identifier text not null,
  version integer not null default 1,
  file_path text not null,
  file_name text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists animal_pdf_records_animal_idx
  on public.animal_pdf_records (animal_record_id, created_at desc);
create index if not exists animal_pdf_records_identifier_idx
  on public.animal_pdf_records (animal_identifier);
alter table public.animal_pdf_records enable row level security;

insert into storage.buckets (id, name, public)
values ('animal-pdfs', 'animal-pdfs', true)
on conflict (id) do update set public = true;

-- ===== Políticas RLS (liberadas para anon/authenticated) =====
do $$
declare
  t text;
  op text;
begin
  foreach t in array array['field_records','operation_records','financial_records','animal_pdf_records']
  loop
    foreach op in array array['select','insert','update','delete']
    loop
      execute format(
        'drop policy if exists %I on public.%I', t||'_'||op, t);
      if op = 'select' or op = 'delete' then
        execute format(
          'create policy %I on public.%I for %s to anon, authenticated using (true)',
          t||'_'||op, t, op);
      elsif op = 'insert' then
        execute format(
          'create policy %I on public.%I for insert to anon, authenticated with check (true)',
          t||'_'||op, t);
      else -- update
        execute format(
          'create policy %I on public.%I for update to anon, authenticated using (true) with check (true)',
          t||'_'||op, t);
      end if;
    end loop;
  end loop;
end $$;

-- Políticas de Storage para o bucket animal-pdfs
do $$
declare op text;
begin
  foreach op in array array['select','insert','update','delete']
  loop
    execute format('drop policy if exists %I on storage.objects', 'animal_pdfs_'||op);
  end loop;
  create policy "animal_pdfs_select" on storage.objects for select
    to anon, authenticated using (bucket_id = 'animal-pdfs');
  create policy "animal_pdfs_insert" on storage.objects for insert
    to anon, authenticated with check (bucket_id = 'animal-pdfs');
  create policy "animal_pdfs_update" on storage.objects for update
    to anon, authenticated using (bucket_id = 'animal-pdfs') with check (bucket_id = 'animal-pdfs');
  create policy "animal_pdfs_delete" on storage.objects for delete
    to anon, authenticated using (bucket_id = 'animal-pdfs');
end $$;

-- ===== Realtime =====
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.financial_records;
      exception when duplicate_object then null; when undefined_table then null; end;
    begin alter publication supabase_realtime add table public.operation_records;
      exception when duplicate_object then null; when undefined_table then null; end;
    begin alter publication supabase_realtime add table public.field_records;
      exception when duplicate_object then null; when undefined_table then null; end;
  end if;
end $$;
```

### 4.4. Variáveis de ambiente na Vercel
O cliente lê estas variáveis em
[`src/integrations/supabase/client.ts`](../src/integrations/supabase/client.ts):

| Variável | Onde | Valor |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel → Project → Settings → Environment Variables | `https://fvglfmikqbzwpdfizprp.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | idem | a **anon/publishable key** do projeto `fvglfmikqbzwpdfizprp` |

> Confirme que a URL/chave apontam para **o mesmo projeto** onde as migrações foram
> aplicadas. Se a Vercel estiver apontando para outro projeto, ou aplique as migrações
> lá, ou corrija as variáveis. Após salvar, faça **Redeploy**.

---

## 5. Como obter o código completo da feature

A fonte da verdade é a branch **`fix/talhao-360-block-1-hardening`** (autor iagod), que
contém a versão completa (Calendário + Pecuária + todas as abas do Talhão 360). O `main`
só tem a integração parcial `d134da7`.

```bash
git fetch origin
git checkout fix/talhao-360-block-1-hardening   # ou revisar via Pull Request
```

> Não copiar/colar código manualmente — são ~13 mil linhas em ~80 arquivos. Use a branch
> ou o PR para o `main`. (O dev iagod abrirá/atualizará esse PR; ver §7.)

---

## 6. Validação (definição de "pronto")

1. Em produção, abrir **Campo → Talhão 360** e **Campo → Calendário**.
2. Conferir o badge no topo: deve estar **REAL** (se estiver DEMO, desligar o demo no
   próprio app — ele grava `nery-demo-mode=false` no `localStorage`).
3. Criar um talhão (desenhar polígono) e um evento de calendário.
4. No dashboard do Supabase → **Table Editor → `field_records`**: confirmar linhas novas
   com `module = 'areas'` e `module = 'calendar-event'`.
5. Pecuária: gerar a ficha de um animal e confirmar linha em `animal_pdf_records` e o
   arquivo no bucket `animal-pdfs`.
6. Recarregar a página: os dados devem **persistir** (vêm do Supabase, não do navegador).

### Checklist
- [ ] `field_records`, `operation_records`, `financial_records`, `animal_pdf_records` existem
- [ ] Bucket `animal-pdfs` existe e é público
- [ ] RLS habilitado com políticas liberadas nas 4 tabelas
- [ ] Tabelas na publicação `supabase_realtime`
- [ ] `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` corretas na Vercel + redeploy
- [ ] Badge **REAL** e persistência confirmada após reload

---

## 7. Referências rápidas

- Diagnóstico do modo demo: `src/components/demo-provider.tsx:12`
- Acesso ao banco: `src/lib/supabase-field.ts`, `src/lib/supabase-operations.ts`, `src/lib/animal-pdfs.ts`
- Migrações: `supabase/migrations/` (idempotentes, `create … if not exists`)
- Projeto Supabase de produção: `fvglfmikqbzwpdfizprp` (`supabase/config.toml`)
- Branch da feature: `fix/talhao-360-block-1-hardening`
