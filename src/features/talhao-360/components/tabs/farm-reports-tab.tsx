import { useMemo, useState } from "react";
import { BarChart3, Download, FileSpreadsheet, FileText } from "lucide-react";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function area(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha`;
}

export function FarmReportsTab({ talhoes }: { talhoes: TalhaoRecord[] }) {
  const [generated, setGenerated] = useState(false);
  const farmName = talhoes[0]?.payload.fazenda || "Fazenda ativa";

  const summary = useMemo(() => {
    const total = talhoes.reduce((sum, item) => sum + number(item.payload.area_ha), 0);
    const byStatus = (status: string) =>
      talhoes
        .filter((item) => item.payload.status === status)
        .reduce((sum, item) => sum + number(item.payload.area_ha), 0);
    return {
      total,
      planted: byStatus("Plantado"),
      preparing: byStatus("Em preparo"),
      fallow: byStatus("Pousio"),
    };
  }, [talhoes]);

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Relatório da fazenda</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Consolidado de todos os talhões de {farmName}.
        </p>
        <button
          onClick={() => setGenerated(true)}
          className="mt-6 h-10 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Gerar prévia
        </button>
        {generated && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void exportPdf(farmName, summary, talhoes)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => exportCsv(farmName, talhoes)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
          </div>
        )}
      </aside>

      <section className="rounded-xl border border-border bg-card p-5">
        {!generated ? (
          <div className="flex min-h-80 flex-col items-center justify-center text-center text-muted-foreground">
            <FileText className="h-10 w-10 text-primary" />
            <p className="mt-3 text-sm">Gere a prévia para consolidar os talhões da fazenda.</p>
          </div>
        ) : (
          <article className="mx-auto max-w-3xl rounded-xl border border-border bg-background p-6">
            <div className="flex items-start justify-between gap-4 border-b pb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Nery Agro
                </div>
                <h3 className="mt-1 text-xl font-semibold">Relatório Geral da Fazenda</h3>
                <p className="text-sm text-muted-foreground">{farmName}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <ReportStat label="Talhões" value={String(talhoes.length)} />
              <ReportStat label="Área total" value={area(summary.total)} />
              <ReportStat label="Plantada" value={area(summary.planted)} />
              <ReportStat label="Em pousio" value={area(summary.fallow)} />
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    {["Talhão", "Código", "Área", "Cultura", "Safra", "Status"].map((label) => (
                      <th key={label} className="px-3 py-2 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {talhoes.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{item.payload.talhao}</td>
                      <td className="px-3 py-2">{item.payload.codigo || "—"}</td>
                      <td className="px-3 py-2">{area(number(item.payload.area_ha))}</td>
                      <td className="px-3 py-2">{item.payload.cultura || "—"}</td>
                      <td className="px-3 py-2">{item.payload.safra || "—"}</td>
                      <td className="px-3 py-2">{item.payload.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

async function exportPdf(
  farmName: string,
  summary: { total: number; planted: number; preparing: number; fallow: number },
  talhoes: TalhaoRecord[],
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const lines = [
    "Relatório Geral da Fazenda",
    farmName,
    `Talhões: ${talhoes.length}`,
    `Área total: ${area(summary.total)}`,
    `Área plantada: ${area(summary.planted)} · Em preparo: ${area(summary.preparing)} · Em pousio: ${area(summary.fallow)}`,
  ];
  doc.setFontSize(16);
  doc.text(lines[0], 14, 18);
  doc.setFontSize(10);
  lines.slice(1).forEach((line, index) => doc.text(line, 14, 28 + index * 7));
  let y = 28 + lines.length * 7 + 4;
  doc.setFontSize(9);
  for (const item of talhoes) {
    doc.text(
      `${item.payload.talhao} · ${area(number(item.payload.area_ha))} · ${item.payload.cultura || "—"} · ${item.payload.status || "—"}`,
      14,
      y,
    );
    y += 6;
  }
  doc.save(`${farmName.replaceAll(" ", "-").toLowerCase()}-fazenda.pdf`);
}

function exportCsv(farmName: string, talhoes: TalhaoRecord[]) {
  const rows = [
    ["talhao", "codigo", "area_ha", "cultura", "safra", "status"],
    ...talhoes.map((item) => [
      item.payload.talhao,
      item.payload.codigo || "",
      item.payload.area_ha || "",
      item.payload.cultura || "",
      item.payload.safra || "",
      item.payload.status || "",
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${farmName.replaceAll(" ", "-").toLowerCase()}-fazenda.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
}
