// xlsx (~550 kB) é carregado sob demanda (só ao exportar) via import dinâmico,
// para não pesar no bundle das rotas. Por isso as funções são assíncronas.

export type XlsxSheet = { name: string; header: string[]; rows: (string | number)[][] };

/**
 * Nome de aba válido para o Excel: 31 caracteres, sem `:\/?*[]`, e ÚNICO.
 * A deduplicação não é preciosismo — "Roteirização de Entregas na Cidade" e
 * "Roteirização de Entregas na Cid…" colidem depois do corte, e o xlsx lança
 * justamente na Logística, que é o módulo com mais abas.
 */
function nomesUnicos(nomes: string[]): string[] {
  const usados = new Set<string>();
  return nomes.map((nome) => {
    const base =
      nome
        .replace(/[:\\/?*[\]]/g, " ")
        .slice(0, 31)
        .trim() || "Dados";
    if (!usados.has(base)) {
      usados.add(base);
      return base;
    }
    for (let i = 2; ; i += 1) {
      const sufixo = ` (${i})`;
      const tentativa = base.slice(0, 31 - sufixo.length) + sufixo;
      if (!usados.has(tentativa)) {
        usados.add(tentativa);
        return tentativa;
      }
    }
  });
}

function baixar(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Uma planilha com VÁRIAS abas (uma por aba do módulo + o resumo). */
export async function exportSheetsToXlsx(filename: string, sheets: XlsxSheet[]) {
  if (!sheets.length) throw new Error("Nada para exportar.");
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const nomes = nomesUnicos(sheets.map((s) => s.name));
  sheets.forEach((s, i) => {
    const sheet = XLSX.utils.aoa_to_sheet([s.header, ...s.rows]);
    XLSX.utils.book_append_sheet(workbook, sheet, nomes[i]);
  });
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  baixar(
    new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}

export async function exportRowsToXlsx(
  filename: string,
  header: string[],
  rows: (string | number)[][],
  sheetName = "Dados",
) {
  await exportSheetsToXlsx(filename, [{ name: sheetName, header, rows }]);
}

// Exportado só para teste — a regra de nome de aba é onde o Excel quebra.
export const __testables = { nomesUnicos };
