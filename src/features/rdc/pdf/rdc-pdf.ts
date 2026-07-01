import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadPdf } from "@/lib/pdf-utils";
import { getSignedPhotoUrl } from "@/features/rdc/api/services";
import { SECAO_LABEL, SECOES, type RdcModel, type RdcEntry } from "@/features/rdc/types/domain";

const GREEN: [number, number, number] = [20, 83, 45];
const INK: [number, number, number] = [23, 37, 30];
const MUTED: [number, number, number] = [95, 108, 101];

type LoadedImage = { dataUrl: string; ratio: number; legenda?: string };

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
}

/** Carrega uma imagem e a converte para dataURL (canvas). Retorna null se falhar/CORS. */
function loadImage(url: string, legenda?: string): Promise<LoadedImage | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1;
        canvas.height = img.naturalHeight || 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        // Fundo branco para PNGs com transparência (a exportação JPEG pintaria preto).
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.85),
          ratio: (img.naturalHeight || 1) / (img.naturalWidth || 1),
          legenda,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function entryRows(entries: RdcEntry[]) {
  return entries.map((entry) => [
    entry.tipo,
    entry.descricao,
    entry.quantidade ? `${entry.quantidade} ${entry.unidade ?? ""}`.trim() : "—",
    entry.custo != null ? brl(entry.custo) : "—",
    entry.talhaoNome ?? entry.animalNome ?? "—",
    [entry.severidade, entry.status].filter(Boolean).join(" · ") || "—",
  ]);
}

/** Gera e baixa o PDF da ficha de RDC com design de relatório (header, tabelas, galeria). */
export async function exportRdcPdf(
  model: RdcModel,
  opts?: { logoDataUrl?: string | null },
): Promise<void> {
  const { ficha, entriesBySecao, photos } = model;
  // Bucket privado: resolve URL assinada a partir do storage_path (demo usa a URL mock).
  const photoUrls = await Promise.all(
    photos.map((photo) =>
      photo.url ? Promise.resolve(photo.url) : getSignedPhotoUrl(photo.storagePath),
    ),
  );
  const images = (
    await Promise.all(photoUrls.map((url, i) => loadImage(url ?? "", photos[i].legenda)))
  ).filter((item): item is LoadedImage => item !== null);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // --- header band ---
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 110, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(ficha.titulo || "Relatório Diário de Campo", margin, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    [
      `Data: ${fmtDate(ficha.data)}`,
      ficha.dia ? `Dia: ${ficha.dia}` : "",
      ficha.safra ? `Safra: ${ficha.safra}` : "",
      ficha.responsavel ? `Responsável: ${ficha.responsavel}` : "",
    ]
      .filter(Boolean)
      .join("    "),
    margin,
    70,
  );
  const climaTxt = [ficha.clima, ficha.climaResumo].filter(Boolean).join(" · ");
  doc.text(
    [ficha.local ? `Local: ${ficha.local}` : "", climaTxt ? `Clima: ${climaTxt}` : ""]
      .filter(Boolean)
      .join("    "),
    margin,
    88,
  );
  if (opts?.logoDataUrl) {
    try {
      doc.addImage(opts.logoDataUrl, "PNG", pageWidth - margin - 60, 24, 60, 60);
    } catch {
      /* logo inválida — ignora */
    }
  }

  // --- metric grid ---
  let y = 140;
  const metrics = [
    { label: "Itens", value: String(model.totalItens) },
    { label: "Custo total", value: brl(model.totalCusto) },
    { label: "Ocorrências", value: String(model.ocorrenciasAbertas) },
    { label: "Fotos", value: String(photos.length) },
  ];
  const colWidth = (pageWidth - margin * 2) / metrics.length;
  metrics.forEach((metric, index) => {
    const x = margin + index * colWidth;
    doc.setDrawColor(220, 226, 220);
    doc.roundedRect(x, y, colWidth - 10, 58, 6, 6);
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(metric.label, x + 12, y + 20);
    doc.setTextColor(...INK);
    doc.setFontSize(15);
    doc.text(metric.value, x + 12, y + 42);
  });
  y += 86;

  // --- resumo ---
  if (ficha.resumo) {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumo do dia", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(ficha.resumo, pageWidth - margin * 2);
    doc.text(lines, margin, y + 16);
    y += 16 + lines.length * 13 + 16;
  }

  // --- atividades executadas no dia ---
  const atividades = [...ficha.atividades, ficha.atividadesOutros].filter(Boolean);
  if (atividades.length) {
    if (y > pageHeight - 120) {
      doc.addPage();
      y = margin + 10;
    }
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Atividades executadas no dia", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(
      atividades.map((a) => `• ${a}`).join("    "),
      pageWidth - margin * 2,
    );
    doc.text(lines, margin, y + 16);
    y += 16 + lines.length * 13 + 16;
  }

  // --- per-section tables ---
  for (const secao of SECOES) {
    const entries = entriesBySecao[secao];
    if (!entries.length) continue;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(SECAO_LABEL[secao], margin, y);
    autoTable(doc, {
      startY: y + 12,
      head: [["Tipo", "Descrição", "Qtd.", "Custo", "Vínculo", "Sev./Status"]],
      body: entryRows(entries),
      styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
      headStyles: { fillColor: GREEN, textColor: 255 },
      alternateRowStyles: { fillColor: [246, 248, 246] },
      columnStyles: { 1: { cellWidth: 150 } },
      margin: { left: margin, right: margin },
    });
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (finalY ?? y + 120) + 28;
  }

  // --- photo gallery ---
  if (images.length) {
    if (y > pageHeight - 160) {
      doc.addPage();
      y = margin + 10;
    }
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Registro fotográfico", margin, y);
    y += 16;

    const cols = 2;
    const gap = 14;
    const lineH = 10;
    const cellWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
    const imgHeightOf = (image: LoadedImage) => Math.min(cellWidth * (image.ratio || 0.66), 180);
    const captionHeightOf = (image: LoadedImage) =>
      image.legenda ? 12 + doc.splitTextToSize(image.legenda, cellWidth).length * lineH : 0;
    const cellHeightOf = (image: LoadedImage) => imgHeightOf(image) + captionHeightOf(image);

    // Processa por LINHAS: a altura da linha é o maior par (imagem + legenda),
    // evitando sobreposição entre imagens de tamanhos diferentes.
    for (let i = 0; i < images.length; i += cols) {
      const row = images.slice(i, i + cols);
      const rowHeight = Math.max(...row.map(cellHeightOf));
      if (y + rowHeight + 16 > pageHeight - 50) {
        doc.addPage();
        y = margin + 10;
      }
      row.forEach((image, col) => {
        const x = margin + col * (cellWidth + gap);
        const imgHeight = imgHeightOf(image);
        try {
          doc.addImage(image.dataUrl, "JPEG", x, y, cellWidth, imgHeight);
        } catch {
          /* ignora imagem problemática */
        }
        if (image.legenda) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...MUTED);
          doc.text(doc.splitTextToSize(image.legenda, cellWidth), x, y + imgHeight + 10);
        }
      });
      y += rowHeight + 16;
    }
  }

  // --- footers (page numbers + signature) ---
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(225, 230, 225);
    doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("AgroTorre · Relatório Diário de Campo", margin, pageHeight - 28);
    doc.text(`Página ${page} de ${total}`, pageWidth - margin, pageHeight - 28, { align: "right" });
    if (page === total) {
      doc.text(
        "Assinatura do responsável: ______________________________",
        margin,
        pageHeight - 14,
      );
    }
  }

  const safe = (ficha.titulo || "rdc").replace(/[^\w.-]+/g, "_");
  downloadPdf(doc, `RDC-${ficha.data || "ficha"}-${safe}.pdf`);
}
