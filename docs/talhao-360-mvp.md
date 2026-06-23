# Talhão 360° — implementação integrada

## Fonte de verdade

O Talhão 360° reutiliza `field_records`, já usado pelo módulo Campo:

- `module = "areas"`: cadastro, perfil agronômico, ciclos, perímetro da fazenda e GeoJSON do talhão;
- `module = "talhao360-event"`: eventos adicionais da timeline;
- `module = "talhao360-alert"`: alertas e recomendações.

Não foram criadas tabelas, autenticação, contas, memberships, staging ou dependência de PostGIS.
Campos adicionais são armazenados no `payload JSONB` existente.

## Contexto compartilhado

A rota mantém o talhão no path e a aba, safra e ciclo nos search params. As sete abas usam o mesmo
modelo montado por `buildTalhao360Model`, evitando estados concorrentes.

## Centro de Talhões (`/campo/talhoes`)

A página de Talhões é um **hub em abas com o mapa no centro** (`?tab=`, padrão `mapa`):

- **Mapa**: mapa interativo da fazenda. Botões **Cadastrar/Editar fazenda** (desenha o perímetro
  total — pode ser feito antes de qualquer talhão) e **Novo talhão**. Clicar num talhão abre o
  **Talhão 360°** dele (modelo híbrido — a página por talhão é mantida);
  - O perímetro da fazenda é guardado num registro próprio (`module: "talhao360-farm"`, lido por
    `farmGeometryFromRecords`) e replicado nos talhões por compatibilidade;
  - **Novo talhão** abre um formulário com três formas de localização — **tamanho da área (ha)**,
    **GPS (lat,long)** ou **desenhar no mapa** — exigindo pelo menos uma. Talhão só por GPS/tamanho
    aparece na lista (sem polígono); desenhado vira polígono colorido;
- **Talhões**: a tabela filtrável (busca/status/cultura/safra/alertas);
- **Safras e Ciclos**: ciclos de todos os talhões agrupados por safra;
- **Alertas**: alertas ativos consolidados da fazenda (via `buildTalhao360Model` por talhão);
- **Relatórios**: relatório consolidado da fazenda com exportação CSV/PDF.

Tudo deriva dos mesmos registros (`useTalhao360Records`), sem novo modelo de dados.

## Integração com Pecuária

Cada talhão tem uma **vocação** (`vocacao`: Agricultura / Pecuária / Integração lavoura-pecuária),
escolhida ao criar e no Cadastro, com básicos de pecuária no payload (lote, forrageira, lotação
UA/ha, capacidade, dias de descanso). A integração é bidirecional:

- **Aba Pecuária** (`/pecuaria` → "Talhões"): mapa + lista dos talhões de vocação pecuária; clicar
  abre o 360° na aba Pecuária. O módulo "Pastagens" ganhou um campo `talhao` para vincular piquetes.
- **Talhão 360°** ganha uma aba **"Pecuária"** (só quando a vocação é Pecuária/Integração) com os
  básicos do talhão e, no modo real, os `operation_records` vinculados via `loadTalhaoIntegrations`.

Os básicos e a seção de talhões funcionam em demo (`field_records`); os registros operacionais
detalhados (pastagens/lotes/animais) vêm de `operation_records` no modo real.

## Mapa

O editor usa MapLibre e um provider configurável:

- `VITE_MAP_STYLE_URL`: sobrescreve o basemap de ruas (padrão: CARTO Voyager);
- `VITE_SATELLITE_TILE_URL`: template de tiles de satélite;
- `VITE_MAP_GEOCODER_URL`: sobrescreve o geocoder (padrão: Nominatim/OpenStreetMap, compatível em formato).

Sem configuração, o MVP usa o basemap CARTO Voyager, Esri World Imagery e o geocoder Nominatim. Antes
de produção, os termos comerciais, atribuição, limites e política de cache dos provedores escolhidos
devem ser confirmados.

O fluxo implementado permite:

- visualizar o perímetro da fazenda e os talhões;
- alternar mapa e satélite sem perder o desenho em andamento;
- buscar por cidade/endereço ou por coordenadas;
- desenhar e editar o perímetro da fazenda;
- desenhar talhões ponto a ponto dentro da fazenda, fechando o polígono no primeiro vértice (em destaque âmbar);
- preencher cada área fechada com cor sólida; cada talhão recebe uma cor distinta da paleta (`cor_mapa`);
- selecionar polígonos e ver, ao passar o mouse, um popup com os dados do talhão;
- editar perímetros fechados: mover, inserir (alças nas arestas) e remover vértices (clique direito);
- excluir a marcação salva de um talhão ou o perímetro da fazenda (com confirmação);
- arrastar vértices, limpar, desfazer e refazer;
- validar geometria, contenção e sobreposição;
- calcular hectares e perímetro;
- salvar e exportar GeoJSON.

O perímetro da fazenda é replicado nos registros de talhão da fazenda atual porque o modelo existente
não possui uma entidade Fazenda separada.

## Modo DEMO

Alterações de cadastro, ciclos, mapa, timeline e alertas são persistidas somente no `localStorage`,
sob as chaves `nery-talhao360-demo-overrides` e `nery-talhao360-demo-extra-records`. Nenhum dado de
demonstração é enviado ao Supabase.

## Integrações

Novos registros usam `talhao_id`; dados antigos continuam aceitando associação por `talhao` ou
`area`. O contrato em `api/integrations.ts` prepara leitura de `financial_records` e
`operation_records` sem reconstruir esses módulos.

## Relatórios

A aba oferece prévia em tela e exportações reais em PDF e CSV. O GeoJSON permanece exportável
separadamente na aba Mapa.

## Limitações conscientes

- a busca textual por cidade/endereço usa o Nominatim por padrão (sujeito a limites de uso da OSM); para volume/produção, configure um geocoder dedicado via `VITE_MAP_GEOCODER_URL`;
- a validação geoespacial ocorre no navegador e não protege contra concorrência multiusuário;
- importação KML, KMZ e SHP não faz parte do MVP solicitado;
- o provedor de satélite padrão deve ser substituído ou licenciado adequadamente para produção;
- o histórico de migrations duplicadas do repositório continua sendo uma questão separada.
