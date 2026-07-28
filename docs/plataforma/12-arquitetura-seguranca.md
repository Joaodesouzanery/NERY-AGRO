# 12 · Arquitetura, tempo real e segurança

**Visão:** as camadas que atravessam **todos** os módulos e fazem a "camada única" funcionar de
verdade — tempo real, isolamento por empresa, segurança e mobilidade.

## Tempo real

Lançou num módulo, a **Torre e os KPIs atualizam na hora** — sem recarregar, sem esperar o mês.
A leitura conectada cruza os dados de todos os módulos num único snapshot que alimenta a Torre,
o COGS, o mapa e os alertas.

## Mapa operacional único

Um mapa interativo (base cartográfica + camadas) onde cargas, talhões, bases, rotas, frota e
focos ambientais aparecem juntos; cada ícone abre o módulo dono. É a visão espacial da operação.

## Ingestão sem digitar

- **Colar do WhatsApp** — cola o apontamento e o sistema **extrai, confere e salva** o romaneio
  (determinístico, sem depender de IA).
- **OCR do romaneio de papel** — fotografa o romaneio e a leitura roda **no próprio aparelho**;
  a foto **não sai do dispositivo** (sem chave, sem custo, sem enviar dado para fora).
- A foto do romaneio fica **salva** e isolada por empresa, visível numa galeria.

## Rastreabilidade com QR

Lote e animal com **QR Code** escaneável — origem, vacinação e cadeia de custódia rastreadas
ponta a ponta, prontas para auditoria e certificação.

## Multi-empresa (multi-tenant)

Cada empresa é **isolada**: um produtor/gestor só enxerga os dados da própria operação. Quem
administra várias fazendas transita entre elas. O isolamento é imposto **no banco de dados**
(não só na tela), então é a segurança real do dado.

## Segurança

- **Isolamento por empresa** garantido no banco.
- **Políticas de segurança endurecidas** no servidor (cabeçalhos de proteção, política de
  conteúdo com token por resposta).
- **Logout automático por inatividade** e proteções no login (anti-robô, limite de tentativas).
- **Arquivos privados** (fotos, PDFs) isolados por empresa, servidos por link temporário.

## Exportar e importar

- **PDF** (fichas, relatórios) e **Excel/XLSX** direto dos módulos — para banco, comprador ou
  contador.
- **Importação de planilha** onde faz sentido (ex.: registros em lote).

## Feito para o campo

Roda no **celular**, com **modo claro** para leitura sob o sol e **modo escuro** para a noite.
Registros de campo pensados para uso móvel (diário com foto/áudio/GPS).

## Stack (resumo técnico)

TanStack Start (React 19 + Router + Query) · Vite · TypeScript · Tailwind · **Supabase**
(Postgres + Auth + Realtime + Storage + isolamento por empresa) · MapLibre (mapa) · deploy
contínuo na Vercel.
