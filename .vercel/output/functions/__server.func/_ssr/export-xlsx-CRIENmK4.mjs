import { u as utils, w as writeSync } from "../_libs/xlsx.mjs";
function exportRowsToXlsx(filename, header, rows, sheetName = "Dados") {
  const safeSheetName = sheetName.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Dados";
  const sheet = utils.aoa_to_sheet([header, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, safeSheetName);
  const arrayBuffer = writeSync(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
export {
  exportRowsToXlsx as e
};
