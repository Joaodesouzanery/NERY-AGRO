# NERY AGRO

Plataforma SaaS de gestão agro full-stack: mapa operacional unificado, módulos de
Logística, Financeiro, Campo, Pecuária, Sustentabilidade, Inteligência, Torre de
Controle e Otimização de COGS.

## Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + Router + Query)
- **Build:** Vite 7 · TypeScript
- **UI:** Tailwind CSS 4 · shadcn/ui · Radix UI · Lucide
- **Mapas:** MapLibre GL (tiles Carto, com fallback OSM/satélite)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Deploy:** Vercel (preset Nitro)

## Pré-requisitos

- Node.js 20+
- Conta/projeto no [Supabase](https://supabase.com)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com as chaves do seu projeto Supabase
# (Project Settings -> API -> use a chave anon/publishable)

# 3. Rodar em desenvolvimento
npm run dev
```

> **Segurança:** o `.env` é ignorado pelo git. Nunca comite chaves. Use apenas a
> chave `anon`/`publishable` no front-end — a `service_role` jamais deve ir para o cliente.
> Em produção, configure as variáveis no painel da Vercel (Production + Preview).

## Scripts

| Comando             | Descrição                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (HMR)  |
| `npm run build`     | Build de produção                  |
| `npm run preview`   | Pré-visualiza o build              |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm run test`      | Testes (Vitest, watch)             |
| `npm run test:run`  | Testes uma vez (CI/pre-commit)     |
| `npm run format`    | Prettier (`--write`)               |

## Banco de dados (Supabase)

O backend é um projeto Supabase (PostgreSQL + Storage + Realtime). Para subir
um **projeto novo do zero** (ex.: sair da Supabase gerenciada pela Lovable):

1. Crie um projeto em https://supabase.com/dashboard.
2. No **SQL Editor**, cole e rode [`supabase/schema.sql`](supabase/schema.sql) —
   cria tabelas, índices, RLS (políticas abertas), o bucket `animal-pdfs` e a
   publicação realtime. É idempotente (pode rodar de novo sem quebrar).
3. (Opcional) Rode [`supabase/seed.sql`](supabase/seed.sql) para popular dados de
   exemplo (espelha o modo demo do app). Só insere se as tabelas estiverem vazias.
4. Em **Project Settings → API**, copie `Project URL`, `anon/publishable key` e
   `Project ID` para o seu `.env` local (veja `.env.example`) e para as
   Environment Variables na **Vercel** (Production + Preview).
5. `npm run dev` e valide; depois publique. Quando tudo estiver ok, o projeto
   antigo (Lovable) pode ser desativado/deletado.

> A pasta `supabase/migrations/` é o histórico herdado da Lovable e tem
> definições duplicadas/conflitantes — **não** use para um `db push` limpo.
> Para um projeto novo, use `schema.sql`. Alternativa via CLI:
> `supabase link --project-ref <ref> && supabase db push` (requer a CLI instalada).

## Estrutura

```
src/
├── routes/        # rotas (file-based routing do TanStack Router)
├── components/    # componentes React (UI em components/ui)
├── lib/           # regra de negócio, CRUD Supabase, PDF, utils
├── integrations/  # cliente Supabase (browser + server)
└── hooks/         # hooks compartilhados
supabase/
├── schema.sql       # schema consolidado p/ subir projeto novo (use este)
├── seed.sql         # dados de exemplo (opcional)
└── migrations/      # histórico herdado da Lovable
```
