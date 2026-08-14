import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfTableRow = Array<string | number>;

/** Y do fim da última tabela desenhada (jspdf-autotable não tipa isso). */
export function lastTableY(doc: jsPDF, fallback = 120) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

/** Grade de N métricas, 3 por linha, com quebra de página. Devolve o Y final. */
export function drawMetricGrid(
  doc: jsPDF,
  metrics: Array<{ label: string; value: string }>,
  y: number,
  title?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidth = (pageWidth - 80) / 3;
  let nextY = y;
  if (title) {
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(12);
    doc.text(title, 40, nextY);
    nextY += 14;
  }
  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 40 + col * colWidth;
    const boxY = nextY + row * 58;
    doc.setDrawColor(220, 226, 220);
    doc.setFillColor(250, 252, 250);
    doc.roundedRect(x, boxY, colWidth - 10, 46, 6, 6, "FD");
    doc.setTextColor(95, 108, 101);
    doc.setFontSize(8);
    doc.text(metric.label, x + 12, boxY + 16);
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(14);
    doc.text(String(metric.value).slice(0, 24), x + 12, boxY + 34);
  });
  return nextY + Math.ceil(metrics.length / 3) * 58;
}

export function addFooters(doc: jsPDF, rodape = "AgroTorre") {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`${rodape} · Página ${page}/${pageCount}`, 40, pageHeight - 24);
    doc.text("Relatório pronto para impressão", pageWidth - 150, pageHeight - 24);
  }
}

/** Garante espaço na página; abre outra quando não cabe. */
function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + need <= pageHeight - 60) return y;
  doc.addPage();
  return 60;
}

export function makeReportPdf({
  title,
  subtitle,
  badge,
  metrics,
  sections,
  rodape,
}: {
  title: string;
  subtitle?: string;
  /** "DEMO" imprime a tarja de dados demonstrativos no cabeçalho. */
  badge?: "DEMO" | "REAL";
  metrics?: Array<{ label: string; value: string }>;
  sections?: Array<{ title: string; head: string[]; body: PdfTableRow[] }>;
  rodape?: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, 40, 42);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 40, 62);
  }
  if (badge === "DEMO") {
    // Um PDF de DEMO não pode ser confundido com o relatório real do cliente.
    doc.setFillColor(190, 40, 40);
    doc.roundedRect(pageWidth - 190, 26, 150, 24, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("DADOS DEMONSTRATIVOS", pageWidth - 180, 42);
  }

  let y = 124;
  if (metrics?.length) {
    if (metrics.length <= 4) {
      // Layout histórico (4 colunas), preservado para não mexer nos PDFs que o
      // cliente já usa: dossiê EUDR, GTA, romaneio de lote, Talhão 360.
      const colWidth = (pageWidth - 80) / metrics.length;
      metrics.forEach((metric, index) => {
        const x = 40 + index * colWidth;
        doc.setDrawColor(220, 226, 220);
        doc.roundedRect(x, y, colWidth - 10, 58, 6, 6);
        doc.setTextColor(95, 108, 101);
        doc.setFontSize(9);
        doc.text(metric.label, x + 12, y + 20);
        doc.setTextColor(23, 37, 30);
        doc.setFontSize(15);
        doc.text(metric.value, x + 12, y + 42);
      });
      y += 86;
    } else {
      y = drawMetricGrid(doc, metrics, y) + 20;
    }
  }

  sections?.forEach((section) => {
    // Antes o y crescia sem addPage(): com muitas seções o conteúdo saía fora
    // da página. Um export "de módulo inteiro" tem dezenas de seções.
    y = ensureSpace(doc, y, 90);
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(13);
    doc.text(section.title, 40, y);
    autoTable(doc, {
      startY: y + 12,
      head: [section.head],
      body: section.body,
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
      alternateRowStyles: { fillColor: [246, 248, 246] },
      margin: { left: 40, right: 40 },
    });
    y = lastTableY(doc, y + 120) + 32;
  });

  addFooters(doc, rodape);
  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
