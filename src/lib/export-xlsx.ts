// xlsx (~550 kB) é carregado sob demanda (só ao exportar) via import dinâmico,
// para não pesar no bundle das rotas. Por isso a função é assíncrona.
export async function exportRowsToXlsx(
  filename: string,
  header: string[],
  rows: (string | number)[][],
  sheetName = "Dados",
) {
  const XLSX = await import("xlsx");
  const safeSheetName = sheetName.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Dados";
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName);
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
