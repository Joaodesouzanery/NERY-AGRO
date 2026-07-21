# Pesquisa — Agrotis × Realtec Agro (concorrência agtech BR)

> Levantamento a partir de fontes públicas de cada plataforma (jul/2026). Números
> conforme divulgados pelas próprias empresas/imprensa — **confirmar antes de citar
> comercialmente**. Análise interna AgroTorre; não é material das empresas citadas.
>
> Versão visual (Artifact): https://claude.ai/code/artifact/def7c604-fd9f-4bec-80f0-8f17119f3ba5

Duas gestoras brasileiras de software para o agro, em ligas diferentes: a **Agrotis**,
gigante nacional de 35 anos (ERP + plataforma agrícola + receituário); e a **Realtec
Agro**, ERP-agro regional full-stack com apps de campo.

---

## 1. Agrotis (agrotis.com)

**Posicionamento:** especialista total em agro, multi-segmento. Vende ERP próprio, uma
camada agrícola que pluga em qualquer ERP, e o receituário agronômico digital mais usado
do país.

|          |                                                                              |
| -------- | ---------------------------------------------------------------------------- |
| Origem   | 1989, Paraná                                                                 |
| Porte    | R$ 70,6 mi (2025, +19,6%) · meta R$ 100 mi até 2027                          |
| Escala   | ~300 colaboradores · 1.500+ clientes · 12 mil+ usuários · 17 bases regionais |
| Clientes | SLC Agrícola, C.Vale, Lar Cooperativa                                        |
| Público  | Cooperativas, indústrias, revendas, grandes fazendas                         |

Vende por **segmento** (9): produção rural, receituário agronômico, produção de sementes,
armazenagem, cooperativas, distribuidores de insumos, indústria de fertilizantes,
indústria de ração e algodoeiras.

### Módulos / soluções

- **Plataforma agrícola** — planejamento e controle de safra, talhões, operações, custos,
  insumos e rastreabilidade; **pluga em qualquer ERP** (mantém o financeiro existente).
- **ERP próprio + SAP "tropicalizado"** — ERP agro carro-chefe (nota, estoque, impostos,
  comissões sazonais, barter) e uma versão do SAP adaptada às regras do agro brasileiro.
- **Receituário Agronômico Digital** — o mais usado do país: emissão de receita + ART,
  manejo de pragas/doenças/plantas daninhas, georreferência de fazenda/talhão, integração
  automática com órgãos (SIAGRO); app próprio (iOS/Android).
- **Produção de Sementes** — campo georreferenciado + vistorias no celular, UBS & Qualidade
  (laudos, assinatura digital, nuvem), Laboratório (LAS/BAS), rastreabilidade lote a lote,
  conformidade normativa.
- **Silos & Armazéns** — automação do armazém de grãos: pesagem, umidade/impureza/quebra
  técnica, segurança operacional.
- **Agroindústrias & canais** — fertilizantes, ração, cooperativas, revendas e
  distribuidores de insumos, cada um com regras próprias.

### Diferenciais

- Camada que **pluga em qualquer ERP** (inclusive SAP) — não obriga a trocar o sistema.
- Nuvem + mobilidade; integração com CRM, equipamentos e parceiros (ex.: Solinftec).
- Especialização e escala: 35 anos, 17 bases, gerente de contas + customer success +
  acompanhamento in-loco; aposta em IA e possível IPO.
- Domínio do **receituário/compliance** — a porta de entrada e o maior ativo de rede.

---

## 2. Realtec Agro (realtec.com.br, São Gotardo-MG)

**Posicionamento:** um **ERP-agro único** que integra do financeiro à colheita, com BI e
apps de campo. Forte no cinturão de café/grãos do cerrado mineiro.

### Os 10 módulos

1. **Principal** — multi-empresa e multi-usuário, controle de acessos, agenda integrada.
2. **Finanças** — financeiro + planos orçamentários, boletos, cheques, integração
   bancária, centro de custos.
3. **Gestão Fiscal** — escriturações digitais, apuração de tributos, obrigações acessórias.
4. **Recursos Humanos** — folha de pagamento, proventos, arquivos para bancos/órgãos.
5. **Gestão Agrícola** — safras, talhões, custos por atividade, operações mecanizadas, mão
   de obra, insumos.
6. **Compras & Suprimentos** — cotações, fornecedores, estoques, almoxarifados,
   recomendações agronômicas.
7. **Máquinas & Patrimônio** — patrimônio (compras, alienações, seguros, depreciação),
   manutenção agendada, abastecimentos.
8. **Faturamento** — pré-venda → NFe e CTe; rastreamento da produção do plantio à venda.
9. **Armazenamento** — silos com umidade/impureza/quebra técnica e pesagens integradas.
10. **Power BI** — relatórios dinâmicos e dashboards em tempo real sobre todos os módulos.

### Apps de campo (o diferencial)

- **Apontagro** — apontamento de produção e mão de obra (tarefas, diárias, horas,
  caixas/metros), comprovante diário, previsão do tempo, **100% offline** com sincronização
  e backup automático, identifica funcionário por código, puxa Power BI.
- **Agronomic** — para agrônomo/gestor: receitar aplicações de insumos, gerenciar a execução
  das recomendações, registrar ocorrências (clima, pragas, fitossanidade), custo por talhão
  (mecanização, mão de obra, insumos, indiretos) — tudo no celular.

### Diferenciais

- **Um ERP só**, do fiscal/folha à colheita.
- Apps de campo **offline de verdade** + BI acessível no celular.
- Proximidade regional e preço acessível (também vendido no marketplace Orbia).

---

## 3. Comparativo — e onde o AgroTorre se posiciona

Legenda: ✅ forte · 🟡 parcial · — ausente. A coluna AgroTorre é leitura honesta do
estado atual, para orientar o roadmap.

| Capacidade                              | Agrotis                      | Realtec Agro                | AgroTorre (hoje)                                |
| --------------------------------------- | ---------------------------- | --------------------------- | ----------------------------------------------- |
| ERP financeiro/fiscal/folha             | ✅ ERP próprio + SAP         | ✅ completo e integrado     | — Financeiro simplificado; sem fiscal/NFe/folha |
| Gestão agrícola / talhão / custos       | ✅                           | ✅                          | 🟡 Talhão 360, RDC, COGS por etapa              |
| Receituário agronômico + ART/compliance | ✅ líder de mercado          | 🟡 recomendação (Agronomic) | — não                                           |
| Sementes / silos / agroindústria        | ✅ profundo                  | 🟡 silos/armazém            | — não                                           |
| App de campo offline                    | 🟡 mobile (receituário)      | ✅ Apontagro/Agronomic      | 🟡 PWA; ingest "colar do WhatsApp"              |
| BI / dashboards                         | 🟡 relatórios                | ✅ Power BI                 | ✅ Torre + KPIs cruzados em tempo real          |
| Mapa operacional único (geo)            | 🟡 georreferência por módulo | —                           | ✅ mapa unificado ao vivo                       |
| Pegada de carbono integrada             | —                            | —                           | ✅ escopo 1/2/3 → COGS/Torre                    |
| Multi-tenant SaaS moderno               | 🟡 enterprise/on-prem+nuvem  | 🟡 regional                 | ✅ SaaS multi-tenant, deploy contínuo           |
| Integra em ERP existente                | ✅ camada agnóstica          | — é o próprio ERP           | — ainda não                                     |

### Leitura para o AgroTorre

- **Onde os dois são fortes e o AgroTorre precisa correr:** ERP fiscal/folha/NFe-CTe
  (Realtec) e **receituário agronômico com ART/SIAGRO** (Agrotis) são apostas de anos e
  barreiras regulatórias — competir de frente ali é caro. A Agrotis ainda tem a jogada de
  _plugar na ERP existente_ (não força troca).
- **Onde o AgroTorre já é diferente:** o **mapa operacional único ao vivo** (nenhum dos dois
  tem uma "torre" cruzando tudo num mapa), a ingestão **"colar do WhatsApp"**, a **pegada de
  carbono integrada ao COGS/Torre** e um **SaaS multi-tenant moderno**. É um ângulo de
  _visibilidade e decisão em tempo real_, não de "mais um ERP".

### Três caminhos

1. **Camada por cima (à la Agrotis)** — virar a "torre" que pluga no ERP que a fazenda já
   usa (Realtec, Agrotis, TOTVS…): ganho sem pedir troca.
2. **Cobrir o buraco legal** — receituário/ART e fiscal são o que prende o cliente nesses
   dois; sem isso, o AgroTorre é complemento, não substituto.
3. **Dobrar no diferencial** — tempo real + carbono + rastreabilidade origem→beneficiamento
   - UX. Vender "enxergar e decidir", não "escriturar".

---

## Fontes

- Agrotis — https://www.agrotis.com/pt (segmentos, produtos, produção de sementes)
- AgFeed — https://agfeed.com.br (porte, receita, planos da Agrotis)
- Realtec Agro — https://realtec.com.br/agro/ (módulos)
- Apontagro — https://apontagro.realtec.com.br (app de campo)
- Orbia — listagem "Sistema de Gestão - Realtec AGRO"
- Google Play — app "Agronomic" (Realtec)
