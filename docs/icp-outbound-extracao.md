# Extração de ICP + prova + dados (para cold outbound) — AgroTorre

> Resposta ao questionário de ICP/outbound, lida a partir do **código, docs, landing e
> schema** deste repositório (não do marketing). **Cada resposta é marcada pela fonte.**
>
> **Legenda de fonte:**
> `[código]` visto no código · `[estrutura]` visto no schema/seed/migrations (estrutura,
> não linhas reais) · `[docs]` docs do repo · `[landing]` copy da landing · `[inferido]`
> dedução minha, **não confirmada** · `[NÃO EXISTE]` procurado e ausente no repo.
>
> ⚠️ **Limite de acesso:** não tenho acesso ao **banco em produção** (o MCP do Supabase
> exige login). "Vasculhar o banco" aqui = ler `supabase/schema.sql`, `seed.sql` e as
> migrations — ou seja, **estrutura e dados de exemplo/DEMO**, nunca linhas de clientes
> reais.
>
> **TL;DR:** AgroTorre é um **produto SaaS**, não uma máquina de outbound. O repositório
> **não contém** base de leads, CRM, envio de e-mail, prova de cliente validada, opt-out
> nem billing. As seções 2, 3, 5 e 6 são, em grande parte, "não existe — precisa ser
> criado/trazido de fora". O que dá para extrair com solidez é o **ICP a partir do desenho
> do produto** (seção 1) e os **pontos de integração técnica** (seção 4).

---

## 1. O que o serviço faz e para quem (ICP)

**Problema concreto + para quem (2 frases)** `[landing]``[código]`
AgroTorre é uma "torre de controle" que unifica campo, pecuária, logística, financeiro e
sustentabilidade de **uma fazenda** em tempo real — tirando a operação de **planilhas
soltas** e de **apontamentos perdidos no WhatsApp** (tem até "cola o apontamento do
WhatsApp e o sistema extrai/confere/salva o romaneio"). É para o **produtor/gestor de
fazendas em profissionalização** que hoje decide "no escuro" e só enxerga o resultado no
fim do mês.

**Cliente ideal (inferido de quem o produto foi DESENHADO para servir — ver ressalva)**

- **Porte:** fazenda **média em profissionalização** — grande o bastante para ter frota,
  caixas/romaneio, mão de obra por diária e colheita física; pequena o bastante para ainda
  rodar em WhatsApp+planilha. `[inferido]`
- **Segmento:** **hortaliças/cebola irrigada por pivô** (a feature de remessa/colheita foi
  construída sobre romaneios reais de **cebola**, variedade _Taila_, fazendas _Sato/Matrice_,
  região de **Cristalina-GO**) + **CSA/cestas**, **certificação orgânica/APP** e **pecuária
  mista**; geografia **Cerrado (GO/MT)** (os tiles demo da landing dizem `GO//SAF//IRR`,
  `MT//REB//VAC`). `[código]``[landing]``[inferido]`
- **Cargo do decisor:** **Produtor/Gestor** (dono-operador ou gerente da fazenda) — as
  personas oficiais no roteiro de marca são _Produtor/Gestor_, _Agrônomo & Campo_ e
  _Financeiro/Cooperativa_. O decisor econômico é o **Produtor/Gestor**; o **Financeiro/
  Cooperativa** é o co-decisor de custo. `[docs: brand-film-agrotorre.md]`
- ⚠️ **Ressalva crítica:** essa é a leitura do **desenho do produto** e dos **romaneios
  reais** que o alimentaram — **não** de uma lista de clientes pagantes (que **não existe**
  no repo). Trate como **ICP hipótese**, não validado. `[inferido, não confirmado]`

**Quem NÃO é cliente / desqualificadores** `[inferido]`

- Agricultura de **subsistência/pequena não estruturada** (sem caixas/romaneio/frota/mão de
  obra formalizada) — o produto pressupõe operação com logística e colheita.
- **Grande agro / commodity listada** que já roda **SAP/Agrotis/TOTVS** (ver
  `docs/pesquisa-agrotis-realtec.md`) — barreira de troca alta, não é o vão do AgroTorre.
- Operação **sem colheita/logística física** (ex.: arrendamento de grão terceirizado) —
  os módulos-âncora (remessa, colheita, frota) ficam ociosos.
- Quem **não usa WhatsApp/celular no campo** — a proposta de valor de ingestão pressupõe isso.
- **Fora do Brasil** — tudo é pt-BR, LGPD, romaneio, GTA, receituário; sem i18n. `[código]`

---

## 2. Prova que já existe

⚠️ **Não há prova de cliente validada no repositório.** `[NÃO EXISTE]`

- **Estado inicial → resultado, com número e data:** **não existe registrado.** Não há
  planilha de resultados, changelog de outcome, nem tabela de "antes/depois". `[NÃO EXISTE]`
- **O que existe são dados de EXEMPLO/DEMO**, não outcomes medidos: as fazendas _Sato/
  Matrice_, _Cristalina-GO_, variedade _Taila_ vêm dos romaneios reais que você colou, mas
  entram como **seed/DEMO** (há inclusive `supabase/clear-example-data.sql` porque o
  `seed.sql` chegou a popular o banco real). São ilustração, não prova de venda. `[estrutura]`
- **Frase literal de cliente (mensagem/ticket/review):** **não existe** — o repo **não tem**
  sistema de tickets, reviews, NPS nem depoimentos versionados. `[NÃO EXISTE]`
- **Permissão de nome / anonimização:** N/A hoje (sem casos). Quando houver: _Sato_,
  _Matrice_, _Cristalina-GO_, _Nery_ são nomes **reais** que apareceram nos romaneios →
  **anonimizar** até ter permissão **escrita** de uso. `[inferido]`

**Único sinal de tração (inferido, não confirmado):** os super-admins da plataforma são os
fundadores (`neryadministrativo@`, `joaodsouzanery@`) e a feature de romaneio foi construída
sobre uma **operação real de cebola** (WhatsApp real). Isso sugere um **design partner /
operação própria da família Nery** — o que é **operador/primeiro usuário**, **não** prova de
venda para um cliente externo. `[código: platform_admin_emails]``[inferido]`

---

## 3. Dados que você já tem

- **Base de leads / CRM / lista de contatos:** **não existe.** `[estrutura]` As tabelas são
  todas **operacionais multi-tenant**: `organizations`, `organization_members`,
  `organization_invites`, `financial_records`, `operation_records`, `field_records`,
  `cost_centers`, `contracts`, `pec_*`. O mais próximo de "contatos":
  - `organization_members` / `organization_invites` = **usuários das empresas-inquilinas**
    (quem já tem acesso), **não** leads de venda. `[estrutura]`
  - `operation_records` com `area="equipe-vendas"` (módulos `vendas`, `mao_de_obra`) = a
    **equipe/vendas DA FAZENDA** (colaborador, diárias, custo), **não** leads do AgroTorre.
    `[código: src/routes/equipe-vendas.tsx]`
- **Quantos registros / quais campos:** não sei o volume (sem acesso ao banco). Estrutura:
  toda tabela tem `org_id` + colunas + `payload` jsonb. `[estrutura]`
- **De onde vieram os dados (LGPD):** os dados são **inseridos pelos próprios usuários da
  empresa** (opt-in por cadastro/convite via `handle_new_user`), **isolados por org via
  RLS**. **Não há** lista comprada, raspada ou de terceiros no sistema. `[código: schema.sql]`
  → Consequência para outbound: **você não tem base de leads própria**; teria que **trazer/
  comprar de fora**, e a origem/LGPD passa a ser uma responsabilidade **nova** (ver seção 5).
- **Lista de já-contatados (dedupe):** **não existe** — não há CRM nem histórico de outreach.
  `[NÃO EXISTE]`

---

## 4. Encaixe técnico para construir os agentes

- **Stack** `[código / CLAUDE.md]`: TanStack Start (React 19 + Router + Query) · Vite 7 · TS
  5.8 · Tailwind 4 · **Supabase** (Postgres + Auth + RLS + Realtime + Storage) · MapLibre ·
  deploy **Vercel/Nitro**.
- **API / acesso programático** `[código]`: **não há API pública**. O padrão server-side é
  **`createServerFn`** (TanStack Start) — exemplo em `src/lib/api/example.functions.ts`
  (`getGreeting`) — protegível pelo middleware **`requireSupabaseAuth`**
  (`src/integrations/supabase/auth-middleware.ts`, valida o Bearer JWT e devolve
  `supabase`/`userId`). O Supabase expõe REST/Realtime **sob RLS** (só autenticado,
  org-scoped). Segredos server-only ficam em `src/lib/config.server.ts`.
- **Automação de outbound / e-mail / CRM rodando:** **nenhuma.** `[código]` O único
  "outbound" é o **link do Calendly "Agendar DEMO"** na landing e no login (booking
  **inbound**). **Sem** envio de e-mail (nenhum Resend/SendGrid/SMTP), **sem** CRM.
- **Onde plugar qualificador / enricher / reply-handler sem reescrever** `[inferido]`:
  - Uma **`createServerFn` por agente** (qualificar, enriquecer, responder), no molde do
    `getGreeting` + `requireSupabaseAuth`; chaves de APIs de enriquecimento em
    `config.server.ts` (server-only, fora do bundle). `[código, inferido]`
  - Uma **tabela nova `leads`** (org-scoped ou global) via **migração idempotente** no padrão
    do repo + RLS (nada existe hoje). `[inferido]`
  - Reaproveitável **conceitualmente**: o **parser de romaneio + OCR + "colar do WhatsApp"**
    (`src/lib/romaneio-parse.ts`, `ocr-romaneio.ts`) e `connected-agro-data.ts` são bons
    primitivos de **extração determinística texto→campos** — mas hoje extraem **sinal
    OPERACIONAL da fazenda**, não **sinal de venda**. **Não há** automação de vendas a
    reusar; seria construção nova. `[código, inferido]`

---

## 5. Compliance (a camada que decide se dá para escalar)

- **Origem dos dados registrada + canal de opt-out funcionando:** **não há** para
  marketing/outbound. `[código]``[docs]` A app trata dados **operacionais** de inquilinos
  sob RLS; **não** existe consentimento de marketing, descadastro/unsubscribe nem
  rastreamento de origem de lead. `docs/auth-multitenant.md` **não** cobre LGPD/retenção.
- **Política de retenção / lead inativo parado:** **não existe** política de retenção
  documentada — e não há "leads" para envelhecer. `[NÃO EXISTE]`
- **Onde documentar o legítimo interesse (LIA):** **não existe** hoje; precisaria ser
  **criado do zero** (ex.: `docs/lgpd-lia-outbound.md`) **antes** de qualquer disparo,
  justamente porque a base viria **de fora**. `[inferido / recomendação]`
- **O que já existe (protege o produto, mas NÃO legitima outbound)** `[código / SECURITY.md]`:
  RLS multi-tenant, `service_role` nunca no cliente, CSP endurecida (nonce), idle-logout,
  honeypot no login, buckets privados. É segurança de **plataforma**, não base legal de
  **prospecção**.

---

## 6. Gatilhos e economia

- **Evento que sinaliza prontidão (para o ICP hipótese)** `[inferido]`: início de
  **safra/colheita** (pico de mão de obra + romaneios), **expansão** (novo pivô/talhão),
  **dor de fechamento** (planilha/WhatsApp no fim do mês), adesão a **CSA/orgânico/
  rastreabilidade** (exige controle), **exigência de comprador/certificadora**. ⚠️ **Nada
  disso é rastreado no sistema** — é inferência de contexto do segmento.
- **Ticket médio / ciclo de venda:** **não inferível do repo.** `[NÃO EXISTE]` Não há
  **billing, preço, plano, assinatura, Stripe** nem histórico de vendas do AgroTorre no
  código (só a "conversão" inbound do Calendly).
- **Margem / bancar enrichment pago por lead:** **não inferível** — sem dados financeiros do
  **negócio AgroTorre** no repositório. `[NÃO EXISTE]`

---

## Veredito (fato × suposição)

| Tabela                                      | Estado no repo                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Prova (estado→resultado, com nº e data)** | **VAZIA** — só dados DEMO/exemplo `[estrutura]`                                                |
| **Dados (base de leads própria + origem)**  | **INEXISTENTE** — nenhuma base de leads `[estrutura]`                                          |
| **ICP (do desenho do produto)**             | Hipótese sólida, **não validada** `[inferido]`                                                 |
| **Encaixe técnico**                         | Existe caminho limpo (`createServerFn` + Supabase), **mas nada de outbound pronto** `[código]` |
| **Compliance p/ outbound**                  | **A construir do zero** `[NÃO EXISTE]`                                                         |
| **Economia (ticket/ciclo/margem)**          | **Desconhecida** `[NÃO EXISTE]`                                                                |

**Leitura honesta (o que você queria decidir):** com a tabela de **prova vazia** e **sem base
de leads com origem/LGPD defensável**, o AgroTorre **ainda não é candidato a cold outbound em
escala**. O caminho mais forte agora é:

1. **Founder-led / design partner:** transformar a **operação real de cebola** que já alimenta
   o produto (Cristalina-GO) no **primeiro caso documentado** — capturar estado inicial →
   resultado, com número e data, e permissão de nome. Isso preenche a tabela de prova **de
   verdade**.
2. **Documento-ímã (lead magnet) inbound** — reusar os ativos que já existem como isca (a
   `docs/pesquisa-agrotis-realtec.md` e o material de módulos), capturando leads **com opt-in**
   — o que resolve, de saída, a origem/LGPD que o outbound frio não tem.

**Próximo passo no seu fluxo ("um serviço por vez"):** para virar candidato a outbound,
precisamos preencher com dados **reais** (não DEMO): (a) a **tabela de prova** — ≥1 caso:
fazenda X, antes = N, depois = M, data, frase literal, permissão; e (b) a **tabela de dados** —
fonte dos leads + origem (opt-in/público/comprado) + volume. **Nada disso está no repositório
hoje** — precisa vir de você/da operação, não do código.
