## Plano de Implementação — AgroTorre

Vou organizar a entrega em 4 frentes paralelas. Antes de codar, confirme se a direção está correta.

### 1. Revisão ortográfica global (PT-BR)

- Varredura em todos os módulos (Dashboard, Financeiro, Logística, Sidebar, Topbar) corrigindo:
  - Acentuação (Estatística, Período, Logística, Distribuição, Crédito, Inadimplência, Análise, Operação, etc.)
  - Maiúsculas/minúsculas em títulos (Title Case nos cabeçalhos, sentence case em descrições)
  - Pontuação (vírgulas, pontos finais)
  - Termos técnicos consistentes (Fluxo de Caixa, Break-even, ROI por Talhão, etc.)

### 2. Dashboard — Mapa de Rastreamento em destaque

- Mover **Mapa de Rastreamento** para acima de "Estatística de Entregas", ocupando largura total (estilo da imagem Régate).
- Usar **CARTO basemaps** (dark_all / voyager) com tiles em zoom maior, foco no Brasil/região operacional.
- Ícones plotados representam dados reais cadastrados em **Logística e Distribuição** (cargas em trânsito, motoristas, paradas, bases, entregues, atrasados).
- Painel lateral direito do mapa replicando o estilo "ON THE COURSE" da imagem com KPIs ao vivo (Em trânsito, Entregues hoje, Atrasos, Distância total).
- Legenda de status com cores (em trânsito/entregue/atrasado/parado).

### 3. Logística e Distribuição — Expansão

- Adicionar **mapa grande** (mesmo componente CARTO) no topo do módulo.
- Expandir o schema de cadastro com campos que alimentam o mapa:
  - **Cargas:** origem (lat/lng + cidade), destino (lat/lng + cidade), status, motorista, placa, ETA, peso, valor, cliente
  - **Motoristas:** nome, CNH, telefone, posição atual, status (disponível/em rota/folga)
  - **Rotas:** origem→destino, distância, tempo estimado, paradas intermediárias
  - **Bases/Filiais:** nome, endereço, lat/lng, tipo (matriz/filial/CD)
- Sub-abas dentro de Logística: **Visão Geral** (mapa+KPIs), **Cargas**, **Motoristas**, **Rotas**, **Frota**, **Bases**.
- Cada sub-aba com botão de **Exportar** próprio e filtros próprios.
- Tudo cadastrado refletido automaticamente nos ícones do mapa do Dashboard.

### 4. Financeiro — Reestruturação em sub-rotas

- **Página inicial (`/financeiro`):** Visão geral com KPIs consolidados + mini-gráficos das 13 áreas + alertas.
- **13 sub-abas dedicadas**, cada uma com:
  - Dashboards e gráficos próprios (não apenas tabela CRUD)
  - Múltiplos infográficos (donut, barras, área, heatmap conforme o tema)
  - Filtros e botão **Exportar** independente
  - CRUD completo conectado ao Supabase
- Sub-abas: Fluxo de Caixa, Custos por Unidade, Inadimplência, Estoque & Insumos, DRE Gerencial, Análise de Crédito, Break-even, Custo por Talhão, Capital de Giro, Investimentos, Rentabilidade Field-by-Field, Arrendamento, Contratos.

### 5. Seletor de período global

Substituir o botão "Janeiro 2026" por dropdown com: **Diário · Semanal · Mensal · Período selecionado** (com date-range picker). Aplicado em Dashboard, Financeiro e Logística — cada módulo guarda seu próprio período.

### 6. Banco de dados

- Migration ampliando `operation_records` com campos estruturados para mapa (lat/lng de origem/destino, status normalizado).
- Garantir que todas as 13 áreas do Financeiro persistem corretamente em `financial_records`.
- Validar RLS e GRANTs já existentes.

---

### Detalhes técnicos

- **Mapa:** componente `carto-map.tsx` já existe — vou expandi-lo para aceitar muitos pontos dinâmicos do Supabase, com clustering visual e tooltip ao hover. Mantém os tiles CARTO (dark_all em dark mode, voyager em light).
- **Estado:** React Query com `staleTime` para evitar reflows; skeletons em cada sub-aba.
- **Roteamento:** sub-rotas reais (`/financeiro/fluxo-caixa`, `/logistica/cargas`, etc.) usando TanStack file-based routing — permite deep-linking e exportação por aba.
- **Tipografia/tokens:** já padronizados no `styles.css`; aplicar consistentemente.

### Escopo NÃO incluído (a confirmar se quiser)

- Geocoding automático de endereços (hoje você digita lat/lng manualmente; podemos adicionar busca depois).
- Tracking GPS ao vivo via API externa (o mapa mostra última posição cadastrada).
- Autenticação por usuário (a plataforma segue aberta, como está hoje).

Posso seguir?
