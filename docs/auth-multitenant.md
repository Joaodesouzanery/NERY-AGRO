# Autenticação + Multi-tenant (Empresas e Funcionários)

Guia para você (admin Nery) operar o login e as empresas no Supabase. O app usa
**e-mail + senha**; cada **Empresa (organization)** só enxerga seus próprios dados
(isolamento por `org_id` + RLS). O cadastro de empresas e funcionários é feito **por
você no Supabase** (dashboard/SQL) — não há signup público no app.

> Pré-requisito: rodar a migração `supabase/migrations/20260628130000_auth_multitenant.sql`
> no Supabase (SQL Editor). Ela cria as tabelas, funções, triggers, faz o backfill dos
> dados atuais para a **“Empresa Padrão”** e fecha a RLS por empresa. **A RLS só passa a
> isolar de verdade depois que essa migração roda.**

---

## 1) Configuração do Supabase Auth (uma vez)

No painel do Supabase → **Authentication**:

1. **Providers → Email**: habilitar “Email” com **senha** (Confirm email à sua escolha).
2. **URL Configuration**: em _Redirect URLs_, adicionar a URL de produção e a de dev:
   - `https://SEU-DOMINIO/redefinir-senha`
   - `http://localhost:8080/redefinir-senha`
     (usadas no fluxo “esqueci a senha”).
3. (Opcional) **Email Templates → Invite / Reset**: personalizar os e-mails.

As chaves já estão no app via `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 2) Criar uma Empresa

SQL Editor:

```sql
insert into public.organizations (nome, slug)
values ('Fazenda Braúna', 'fazenda-brauna')
returning id;
```

Guarde o `id` retornado (é o `org_id` da empresa).

---

## 3) Adicionar um Funcionário (por e-mail)

Há dois caminhos. **O recomendado** (funciona mesmo que a pessoa ainda não tenha conta):

### Caminho A — Convite (pré-cadastro por e-mail)

1. Registre o convite com a empresa + papel:
   ```sql
   insert into public.organization_invites (org_id, email, role)
   values ('<ORG_ID>', 'funcionario@empresa.com', 'member');  -- role: owner | admin | member
   ```
2. No painel → **Authentication → Users → Invite user** (ou _Add user_), informe o
   mesmo e-mail. O Supabase cria o usuário e envia o e-mail para definir a senha.
3. O **trigger `on_auth_user_created`** vincula automaticamente o usuário à empresa do
   convite (vira `organization_members`) e apaga o convite. Pronto: no 1º login ele já
   enxerga os dados da empresa.

### Caminho B — Usuário já existe

Se a pessoa já tem conta (já está em `auth.users`):

```sql
insert into public.organization_members (org_id, user_id, role)
select '<ORG_ID>', u.id, 'member'
from auth.users u
where lower(u.email) = lower('funcionario@empresa.com')
on conflict (org_id, user_id) do nothing;
```

> **Papéis (`role`)**: `owner`, `admin`, `member`. Hoje todos os papéis veem os dados da
> empresa (isolamento é por empresa). Permissões finas por papel podem ser adicionadas
> depois (basta refinar as policies de RLS).

> **1 empresa por usuário** nesta fase: `current_org_id()` usa o primeiro vínculo do
> usuário. Multi-empresa + seletor de empresa fica para uma evolução futura.

---

## 4) Como o isolamento funciona (resumo técnico)

- Toda tabela de dados (`financial_records`, `operation_records`, `field_records`,
  `animal_pdf_records`, `cost_centers`, `contracts`) tem `org_id`.
- **Insert**: o trigger `set_org_id` preenche `org_id = current_org_id()` — o app não
  precisa enviar.
- **Leitura/edição**: a RLS só deixa ver/mexer linhas onde `org_id = current_org_id()`
  e apenas para usuários **autenticados**. Sem login → não vê dados reais.
- O modo **DEMO** continua usando dados fictícios em memória (não toca o banco).

---

## 5) Storage por empresa (passo de endurecimento — recomendado a seguir)

Os arquivos (fotos de RDC no bucket `rdc-photos`, PDFs de animais em `animal-pdfs`)
ainda **não** estão isolados por empresa (os metadados que os referenciam já estão, via
RLS das tabelas). Para isolar os próprios arquivos, o padrão é prefixar o caminho com o
`org_id` e aplicar policy no `storage.objects`. Quando quiser ativar, me peça que eu
ajusto os uploads para `('<org_id>/' || caminho)` e aplicamos:

```sql
-- exemplo para um bucket; ajuste o nome e confirme/remova policies antigas "públicas"
create policy "rdc_photos_org_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'rdc-photos' and (storage.foldername(name))[1] = public.current_org_id()::text);
-- repetir para insert/update/delete (with check no insert/update)
```

---

## 6) Teste de aceitação

1. Crie 2 empresas e 1 funcionário em cada (caminho A).
2. Login como funcionário da Empresa A → cadastre 1 registro (ex.: no Financeiro).
3. Login como funcionário da Empresa B → **não** deve ver o registro de A.
4. Sem login, abrir `/torre-de-controle` → redireciona para `/login`.
5. Toggle **DEMO** continua mostrando dados fictícios mesmo logado.
