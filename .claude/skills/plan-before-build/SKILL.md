---
name: plan-before-build
description: Para mudança não-trivial no AgroTorre (multi-arquivo, feature nova, refactor, alteração de schema/mapa), planeje antes de editar — mapeie arquivos, reuse padrões e liste passos + verificação. Use antes de começar a codar algo grande.
---

# Planeje antes de construir (AgroTorre)

Mudança **trivial** (1 arquivo, texto, ajuste local) pode ir direto — depois
rode o gate. Mudança **não-trivial** (multi-arquivo, feature nova, refactor,
schema, mapa) exige um mini-plano curto antes de editar.

## Quando planejar

- Toca em 3+ arquivos ou cruza camadas (rota → componente → `lib` → Supabase).
- Feature/módulo novo (Logística, Financeiro, Campo, Pecuária, etc.).
- Refactor, mudança de schema/RLS, ou nova categoria/camada no mapa.

## O mini-plano (curto, antes de editar)

1. **Mapear arquivos** que vão mudar. Grep primeiro (ver skill `search-first`).
2. **Reusar padrão vizinho**: imite densidade de comentário, nomenclatura e
   estrutura do arquivo ao lado. Lógica pura vai em `src/lib/*` com teste.
3. **Listar passos** em ordem + o que cada um verifica.
4. **Planejar a verificação**: quais testes rodar, qual smoke SSR.

## Pontos de atenção por tipo

- **Schema/RLS**: crie NOVA migração em
  `supabase/migrations/<timestamp>_<nome>.sql` (idempotente, `IF NOT EXISTS` /
  `create or replace`). NÃO edite migração já aplicada. Atualize
  `supabase/schema.sql` (consolidado) e regenere
  `src/integrations/supabase/types.ts`. Respeite `org_id` + RLS + trigger
  `set_org_id`.
- **Mapa — nova categoria**: adicione a entrada nos 4 mapas de
  `src/components/interactive-map.tsx` (`mapIconConfig`, `KEY_TO_ICON`,
  `ICON_PATHS`, `categoryNames`); ajuste filtro/legenda em
  `src/components/unified-map-page.tsx`; dados em
  `src/lib/connected-agro-data.ts`.
- **Origem externa nova** (fonte/CDN/API): libere na diretiva certa da CSP em
  `src/server.ts` (`connect-src`/`img-src`/`style-src`/`font-src`), senão
  quebra em produção.
- **Env**: cliente só enxerga `VITE_*`. Server usa
  `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`. `service_role` NUNCA no cliente.

## Faça / Evite

- Faça: escrever o plano curto (arquivos + passos + verificação) antes de editar.
- Faça: reusar helpers/hooks existentes e imitar o arquivo vizinho.
- Faça: terminar sempre pelo gate (skill `verification-gate`).
- Evite: editar migração já aplicada — crie uma nova.
- Evite: adicionar categoria de mapa em só um dos 4 mapas.
- Evite: usar origem externa sem liberar na CSP de `src/server.ts`.
