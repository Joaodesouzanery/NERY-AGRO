import { SECAO_LABEL, SECOES, type RdcModel } from "@/features/rdc/types/domain";

function cell(value: string | number | undefined): string {
  const s = String(value ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Exporta a ficha (cabeçalho + itens) em CSV (delimitador ";", amigável ao Excel pt-BR). */
export function exportRdcCsv(model: RdcModel): void {
  const { ficha } = model;
  const meta = [
    ["RDC", ficha.titulo],
    ["Data", ficha.data],
    ["Dia", ficha.dia],
    ["Local", ficha.local],
    ["Safra", ficha.safra],
    ["Responsável", ficha.responsavel],
    ["Clima", [ficha.clima, ficha.climaResumo].filter(Boolean).join(" — ")],
    ["Atividades", [...ficha.atividades, ficha.atividadesOutros].filter(Boolean).join(" | ")],
    ["Status", ficha.status],
  ]
    .map((row) => row.map(cell).join(";"))
    .join("\n");

  const head = [
    "Seção",
    "Tipo",
    "Descrição",
    "Qtd",
    "Unidade",
    "Custo",
    "Vínculo",
    "Severidade",
    "Status",
    "Responsável",
    "Data",
  ]
    .map(cell)
    .join(";");

  const lines: string[] = [head];
  for (const secao of SECOES) {
    for (const e of model.entriesBySecao[secao]) {
      lines.push(
        [
          SECAO_LABEL[secao],
          e.tipo,
          e.descricao,
          e.quantidade ?? "",
          e.unidade ?? "",
          e.custo ?? "",
          e.talhaoNome ?? e.animalNome ?? "",
          e.severidade ?? "",
          e.status ?? "",
          e.responsavel ?? "",
          e.data,
        ]
          .map(cell)
          .join(";"),
      );
    }
  }

  const csv = "﻿" + meta + "\n\n" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `RDC-${ficha.data || "ficha"}.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
}
