# Pacote de Skills + Agents do Claude Code — AgroTorre

Conjunto **original, afiado no stack deste repo** (TanStack Start · React 19 · Supabase ·
Tailwind · MapLibre · Vitest · Vercel). **Só markdown** — sem hooks, sem scripts, sem
`npm install`, sem chamadas de rede, sem chave de API. Versionado junto com o código.

## Como carrega (nada a instalar)

Por estar em `.claude/` **dentro do repositório**, o Claude Code carrega automaticamente
ao abrir o projeto. Não há passo de instalação. Ele também lê o `CLAUDE.md` da raiz
(convenções + gate + regras de commit).

**Verificar que carregou** (dentro do Claude Code):

```
/skills     # lista verification-gate, search-first, supabase-rls-multitenant, ...
/agents     # lista planner, code-reviewer, security-reviewer, ...
```

## O que tem dentro

### Skills (`.claude/skills/*/SKILL.md`) — disparam por intenção

| Grupo        | Skills                                                                                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fluxo / meta | `verification-gate` · `search-first` · `plan-before-build` · `commit-and-deploy`                                                                                                                                                                    |
| Stack        | `tanstack-start-patterns` · `react19-ui-patterns` · `supabase-data-patterns` · `supabase-rls-multitenant` · `database-migrations` · `maplibre-map-patterns` · `charts-recharts` · `data-export-pdf-xlsx` · `forms-zod-rhf` · `performance-patterns` |
| Qualidade    | `tdd-vitest` · `error-handling` · `coding-standards` · `codebase-onboarding`                                                                                                                                                                        |

### Agents (`.claude/agents/*.md`) — delegados automaticamente

| Tipo        | Agents                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------- |
| Read-only   | `planner` · `code-explorer` · `code-reviewer` · `security-reviewer` · `silent-failure-hunter` |
| Com escrita | `build-error-resolver` · `test-writer` · `refactor-cleaner` · `supabase-migration-writer`     |

## Como usar no dia a dia

- **Skills** disparam por intenção — você não precisa invocá-las à mão. Exemplos:
  - "implemente a feature X" → `plan-before-build` + `search-first` + `verification-gate`
  - "adicione uma categoria no mapa" → `maplibre-map-patterns`
  - "crie uma migração" → `database-migrations` (+ agent `supabase-migration-writer`)
- **Agents** rodam por delegação; você também pode forçar:
  ```
  Use the security-reviewer agent on src/routes/login.tsx
  ```

## Ajustar (tudo é editável)

- **Modelo por agent:** campo `model:` no frontmatter (`haiku` p/ tarefas leves,
  `sonnet` p/ trabalho principal). Baixar p/ `haiku` onde dá corta custo.
- **Ferramentas por agent:** campo `tools:` — mantenha o mínimo. Os read-only não têm
  `Edit`/`Write` de propósito.
- **Remover o que não usa:** apague a pasta da skill (ex.: `.claude/skills/charts-recharts/`)
  — menos superfície, menos ruído/contexto.
- **Adicionar:** nova skill = pasta `.claude/skills/<nome>/SKILL.md` com frontmatter
  `name` + `description`; novo agent = `.claude/agents/<nome>.md` com `name` +
  `description` + `tools` + `model`.
- **Convenções do repo** têm prioridade e ficam no `CLAUDE.md` da raiz.

## Projeção de produtividade (baseada em mecanismo — não é medição garantida)

Faixas para um dev usando IA ativamente em projeto de complexidade média:

| Dimensão                        | Mecanismo que age                                               | Ganho projetado                | Confiança  |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------ | ---------- |
| Retrabalho por abordagem errada | `search-first` + `plan-before-build` + `verification-gate`      | −30% a −50% do tempo refazendo | Média-alta |
| Bugs que escapam p/ produção    | `code-reviewer` + `security-reviewer` + `silent-failure-hunter` | −20% a −40% de defeitos        | Média      |
| Relembrar contexto / onboarding | `CLAUDE.md` + `codebase-onboarding` + `code-explorer`           | horas → minutos                | Alta       |
| Re-explicar padrões toda vez    | `CLAUDE.md` + `coding-standards`                                | −5 a −15 min por sessão        | Alta       |
| "Quebrou em produção"           | `verification-gate` + `commit-and-deploy`                       | menos idas-e-voltas de deploy  | Alta       |
| Token por tarefa                | recall determinístico das skills                                | −15% a −30% em tarefas guiadas | Média      |

**Agregado realista:** ~**15–30% do tempo de engenharia**, concentrado em retrabalho e
review. O maior ganho não é digitar mais rápido — é **errar de caminho com menos
frequência**.

Duas honestidades: (1) **skill demais custa contexto** — por isso este pacote é enxuto;
remova o que não usa. (2) O **teto** aparece após ~1–2 semanas de calibração (quais
agents você confia rodar sozinho e quais revisa).

## Procedência

Conteúdo **original**, escrito sob medida para este repositório (não é cópia de nenhum
pacote de terceiros). Auditável: 100% markdown, sem executáveis.
