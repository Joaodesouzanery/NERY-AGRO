import { useMemo, useState } from "react";
import { BarChart3, Download, FileSpreadsheet, FileText } from "lucide-react";
import type { Talhao360Model } from "@/features/talhao-360/types/domain";
import { Panel } from "./overview-tab";

export function ReportsTab({ model }: { model: Talhao360Model }) {
  const [type, setType] = useState("Geral");
  const [season, setSeason] = useState(model.selectedSeason);
  const [cycle, setCycle] = useState(model.selectedCycle?.id || "Todos");
  const [includeMap, setIncludeMap] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeCosts, setIncludeCosts] = useState(true);
  const [generated, setGenerated] = useState(false);
  const summary = useMemo(
    () => ({
      area: model.talhao.payload.area_ha || "—",
      crop: model.talhao.payload.cultura || "—",
      cycles: model.cycles.filter((item) => item.safra === season).length,
      events: model.events.filter((item) => !item.season || item.season === season).length,
      alerts: model.alerts.filter((item) => !item.season || item.season === season).length,
    }),
    [model, season],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Configurar relatório</h2>
        <Select
          label="Tipo"
          value={type}
          onChange={setType}
          options={[
            "Geral",
            "Safra",
            "Ciclo",
            "Agronômico",
            "Operacional",
            "Custos",
            "Produtividade",
            "Alertas",
            "Mapa e áreas",
            "Comparativo entre safras",
            "Comparativo entre ciclos",
          ]}
        />
        <Select label="Safra" value={season} onChange={setSeason} options={model.seasons} />
        <Select
          label="Ciclo"
          value={cycle}
          onChange={setCycle}
          options={[
            "Todos",
            ...model.cycles.filter((item) => item.safra === season).map((item) => item.id),
          ]}
          labels={Object.fromEntries(model.cycles.map((item) => [item.id, item.nome]))}
        />
        <div className="mt-5 space-y-3">
          {[
            ["Incluir mapa", includeMap, setIncludeMap],
            ["Incluir timeline", includeTimeline, setIncludeTimeline],
            ["Incluir alertas", includeAlerts, setIncludeAlerts],
            ["Incluir custos", includeCosts, setIncludeCosts],
          ].map(([label, checked, setter]) => (
            <label key={String(label)} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked as boolean}
                onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)}
              />
              {label as string}
            </label>
          ))}
        </div>
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
              onClick={() => void exportPdf(model, type, season)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => exportCsv(model, season)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
          </div>
        )}
      </aside>
      <Panel title="Pré-visualização">
        {!generated ? (
          <div className="flex min-h-80 flex-col items-center justify-center text-center text-muted-foreground">
            <FileText className="h-10 w-10 text-primary" />
            <p className="mt-3 text-sm">Configure os filtros e gere a prévia em tela.</p>
          </div>
        ) : (
          <article className="mx-auto max-w-3xl rounded-xl border border-border bg-background p-6">
            <div className="flex items-start justify-between gap-4 border-b pb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Nery Agro
                </div>
                <h3 className="mt-1 text-xl font-semibold">Relatório {type} do Talhão</h3>
                <p className="text-sm text-muted-foreground">
                  {model.talhao.payload.talhao} · {season}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ReportStat label="Área" value={`${summary.area} ha`} />
              <ReportStat label="Cultura" value={summary.crop} />
              <ReportStat label="Ciclos" value={String(summary.cycles)} />
            </div>
            {includeCosts && (
              <Section title="Custos">
                Planejado: {model.talhao.payload.custo_planejado_ha || "—"} por hectare · Realizado:{" "}
                {model.talhao.payload.custo_realizado_ha || "—"} por hectare.
              </Section>
            )}
            {includeTimeline && (
              <Section title="Timeline">
                {summary.events} eventos associados; último registro:{" "}
                {model.lastOperation?.description || "não disponível"}.
              </Section>
            )}
            {includeAlerts && (
              <Section title="Alertas">
                {summary.alerts} alertas encontrados, sendo{" "}
                {model.alerts.filter((alert) => alert.severity === "Crítico").length} críticos.
              </Section>
            )}
            {includeMap && (
              <Section title="Mapa e áreas">
                {model.talhao.payload.geometry_geojson
                  ? "Geometria GeoJSON disponível para inclusão."
                  : "Talhão sem geometria cadastrada."}
              </Section>
            )}
            {cycle !== "Todos" && (
              <Section title="Ciclo selecionado">
                {model.cycles.find((item) => item.id === cycle)?.nome || "Ciclo não encontrado"}.
              </Section>
            )}
          </article>
        )}
      </Panel>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels = {},
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="mt-3 grid gap-1.5 text-sm">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-border bg-background px-3"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>
    </label>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 border-t pt-5">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </section>
  );
}

async function exportPdf(model: Talhao360Model, type: string, season: string) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF();
  const payload = model.talhao.payload;
  const lines = [
    `Relatório ${type} do Talhão`,
    `${payload.talhao} · ${payload.codigo || "Sem código"}`,
    `Fazenda: ${payload.fazenda || "Não informada"}`,
    `Safra: ${season}`,
    `Área: ${payload.area_ha || "—"} ha`,
    `Cultura: ${payload.cultura || "—"} · Status: ${payload.status || "—"}`,
    `Produtividade esperada: ${payload.produtividade_esperada || "—"} sc/ha`,
    `Custo planejado: R$ ${payload.custo_planejado_ha || "—"}/ha`,
    `Custo realizado: R$ ${payload.custo_realizado_ha || "—"}/ha`,
    `Alertas ativos: ${model.alerts.filter((item) => item.status === "Aberto").length}`,
  ];
  document.setFontSize(16);
  document.text(lines[0], 14, 18);
  document.setFontSize(10);
  lines.slice(1).forEach((line, index) => document.text(line, 14, 28 + index * 7));
  document.save(`${payload.codigo || "talhao"}-${season.replace("/", "-")}.pdf`);
}

function exportCsv(model: Talhao360Model, season: string) {
  const rows = [
    ["talhao", "codigo", "fazenda", "safra", "cultura", "area_ha", "status"],
    [
      model.talhao.payload.talhao,
      model.talhao.payload.codigo || "",
      model.talhao.payload.fazenda || "",
      season,
      model.talhao.payload.cultura || "",
      model.talhao.payload.area_ha || "",
      model.talhao.payload.status || "",
    ],
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${model.talhao.payload.codigo || "talhao"}-${season.replace("/", "-")}.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
}
