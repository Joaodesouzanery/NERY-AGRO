---
name: data-export-pdf-xlsx
description: Como exportar dados para PDF (jspdf + jspdf-autotable) e XLSX (exportRowsToXlsx) e importar planilha (read-excel-file / import-parsing) no AgroTorre. Use ao adicionar botão de exportar/baixar relatório ou importar registros de planilha.
---

# Export/Import de dados

## XLSX — sempre via helper

Use `exportRowsToXlsx` (`src/lib/export-xlsx.ts`); ele já faz import dinâmico de `xlsx` (~550 kB, não pesa no bundle da rota) e dispara o download.

```ts
import { exportRowsToXlsx } from "@/lib/export-xlsx";
// filename SEM extensão; o helper garante ".xlsx" e sanitiza o nome da aba (31 chars)
void exportRowsToXlsx(`agrotorre-pecuaria-${module.id}`, header, rows, module.shortLabel);
```

`header: string[]`, `rows: (string | number)[][]`. É `async` — não precisa `await` para o clique.

## PDF — jspdf + jspdf-autotable

Padrão em `src/features/rdc/pdf/rdc-pdf.ts` e `src/components/control-tower-page.tsx`:

```ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadPdf } from "@/lib/pdf-utils";

const doc = new jsPDF({ unit: "pt", format: "a4" });
autoTable(doc, { head: [header], body: rows });
// finalY da última tabela: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
downloadPdf(doc, "torre-de-controle-agrotorre.pdf");
```

Baixe sempre via `downloadPdf` de `@/lib/pdf-utils` (não `doc.save` solto).

## Convenção de nome de arquivo

Prefixo **`agrotorre-`** (ex.: `agrotorre-pecuaria-animais.xlsx`, `torre-de-controle-agrotorre.pdf`, `torre-de-controle-agrotorre.csv`). Mantenha o padrão dos arquivos existentes por área/módulo.

## Import de planilha

- Leitura do arquivo: `readSheet` de `read-excel-file/browser` (v9 — o default export retorna TODAS as abas; use `readSheet` p/ uma). Ver `src/components/import-records-button.tsx`.
- Parsing/validação puros: `src/lib/import-parsing.ts` — `parseCsv`, `detectDelimiter`, `buildAliasMap`, `dateValue`, `numberValue`, `validateValue`, `buildPayloads`. Essas funções são cobertas por teste; reuse-as em vez de reparsear à mão.
- Fluxo típico: ler linhas → `buildPayloads({ headers, dataRows, mapping, fields })` → inserir no Supabase (o trigger `set_org_id` preenche `org_id`).

## Faça / Evite

- Faça: `exportRowsToXlsx`/`downloadPdf` (import dinâmico já embutido, bundle leve).
- Faça: cabeçalhos/labels em pt-BR; nome de arquivo com prefixo `agrotorre-`.
- Evite: `import * as XLSX` estático no topo de uma rota (infla o bundle) — o helper já lazy-carrega.
- Evite: montar payloads de import à mão — use `import-parsing.ts` (testado).

## Gate (nvm primeiro)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```
