# Campo › Calendário — arquitetura e contratos

Rota: `/campo/calendario` (`src/routes/campo_.calendario.tsx`) · Feature:
`src/features/campo-calendar/`.

## Fonte de verdade

O **evento canônico** do Calendário (`module = calendar-event` em `field_records`)
é a única fonte de tarefas/operações planejadas, compras como ações, decisões,
alertas manuais e marcos. Talhão 360, Operações e Financeiro devem **referenciar**
o evento (`related_record_id` / futuro `calendar_event_id`) — nunca copiá-lo.

Módulos usados em `field_records`:

| module              | conteúdo                                            |
| ------------------- | --------------------------------------------------- |
| `calendar-event`    | evento canônico (payload string-only, ver services) |
| `calendar-template` | modelos de ciclo (itens em `itens_json`)            |
| `calendar-status`   | status personalizados + overrides de rótulo/ordem   |
| `calendario`        | **legado** — lido via adapter, nunca regravado      |

Toda a persistência está isolada em `api/services.ts` para permitir migração
futura a tabelas relacionais sem tocar na interface.

## Compatibilidade legada

Registros antigos (`module = calendario`, do CRUD genérico de Campo) continuam
aparecendo: o adapter (`legacyEventsFromRecord`) converte cada registro em até
dois eventos somente leitura (janela de plantio + marco de colheita) com
`source = legado`. Nada é migrado nem apagado automaticamente. Vínculo com
talhão usa `talhao_id` quando existe e **nome normalizado como fallback**.

## Integração com Talhão 360 (somente leitura)

`integrations/talhao-360.ts` lê talhões (`module = areas`), ciclos
(`ciclos_json`) e geometrias via imports **read-only** de
`talhao-360/api/services`. Nenhum arquivo de `src/features/talhao-360/**` foi
editado. A integração bidirecional (Timeline do Talhão 360 lendo
`calendar-event`) é um bloco futuro que exige aprovação explícita — o patch
necessário seria: em `buildTalhao360Model`, incluir eventos `calendar-event`
com `talhao_id` do talhão no array `events`, preservando `talhao360-event`.

## DEMO x REAL

- DEMO: snapshot em `data/mocks.ts` (datas relativas a hoje) + delta local em
  `localStorage` (`data/demo-store.ts`). **Dados demo nunca vão ao Supabase.**
- REAL: `field_records` via Supabase. Falha de rede em mutação vai para a fila
  offline (`lib/offline-queue.ts`): pendências ficam no dispositivo, são
  reenviadas ao reconectar e conflito por `updated_at` mantém a versão do
  servidor (nunca sobrescreve silenciosamente; nada é marcado como sincronizado
  antes da resposta do Supabase).

## Permissões (LIMITAÇÃO IMPORTANTE)

A área de **Decisões** usa capacidades por papel em modo **demonstrativo**
(`lib/capabilities.ts`, papel salvo no dispositivo). O produto ainda não tem
papéis por usuário nem RLS por papel em `field_records` — ocultar UI **não é
segurança**. Bloco futuro: tabela de papéis por membro da organização +
policies RLS filtrando `visibility = gestor`, e só então declarar a área como
restrita de fato.

## Clima e notificações

`lib/weather.ts` define o contrato `WeatherProvider`; o MVP usa provider
**mockado determinístico** (nenhuma origem externa — ao trocar por API real,
liberar o domínio na CSP de `src/server.ts`). Alertas calculados
(`computeCalendarAlerts`) têm chave determinística (sem duplicação) e o estado
"lida" fica no dispositivo. Adapter de e-mail é interface futura — nada simula
envio real.

## Custos

`estimated_cost` é planejamento (informativo): não cria conta a pagar nem
lançamento automático. Compra é tarefa, não estoque. "Previsto x realizado"
completo depende dos vínculos futuros com `financial_records` /
`operation_records` por `calendar_event_id`.

## Testes

- `schemas/navigation.test.ts` — search params (defaults, inválidos, filtros).
- `api/services.test.ts` — roundtrip payload, adapter legado, modelo, status.
- `lib/derive.test.ts` — atraso, filtros, grades, KPIs, custos, alertas,
  geração por modelo e reuso de ciclo.
- `lib/weather.test.ts` — determinismo do provider mock.
