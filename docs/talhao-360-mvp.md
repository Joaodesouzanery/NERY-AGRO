# Talhão 360 — arquitetura do MVP

## Fonte de verdade

O Talhão 360 reutiliza `field_records`, já usado pelo módulo Campo:

- `module = "areas"`: cadastro, perfil agronômico, ciclos e GeoJSON do talhão;
- `module = "talhao360-event"`: eventos adicionais da timeline;
- `module = "talhao360-alert"`: alertas e recomendações.

Não foram criadas tabelas, autenticação, contas, memberships, staging ou dependência de PostGIS.

Campos novos são armazenados no `payload JSONB` já existente. Ciclos e geometrias usam JSON
serializado em `ciclos_json` e `geometry_geojson`, respectivamente.

## Integrações

Registros existentes de calendário, diário, insumos, pragas, solo, planejamento e estimativa são
associados pelo campo `talhao`, mantendo o comportamento atual. Registros novos do Talhão 360
incluem também `talhao_id`, evitando dependência exclusiva do nome.

## Mapa

O editor usa MapLibre já instalado. O desenho é salvo como GeoJSON no registro atual do talhão.
Área e perímetro são calculados no navegador. Contenção rigorosa, sobreposição multiusuário,
importação de arquivos e processamento geoespacial no banco ficam como evoluções posteriores.

## Banco

Nenhuma migration é necessária para o MVP. As migrations experimentais normalizadas do bloco
anterior foram removidas antes de qualquer aplicação remota.

O histórico antigo do repositório ainda contém migrations duplicadas e deve ser reconciliado
separadamente, mas isso não altera o contrato do Talhão 360 baseado em `field_records`.
