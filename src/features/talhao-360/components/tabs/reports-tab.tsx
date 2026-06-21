import { useMemo, useState } from "react";
import { BarChart3, FileText } from "lucide-react";
import type { Talhao360Model } from "@/features/talhao-360/types/domain";
import { Panel } from "./overview-tab";

export function ReportsTab({ model }: { model: Talhao360Model }) {
  const [type, setType] = useState("Geral");
  const [includeMap, setIncludeMap] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeCosts, setIncludeCosts] = useState(true);
  const [generated, setGenerated] = useState(false);
  const summary = useMemo(
    () => ({
      area: model.talhao.payload.area_ha || "—",
      crop: model.talhao.payload.cultura || "—",
      cycles: model.cycles.length,
      events: model.events.length,
      alerts: model.alerts.length,
    }),
    [model],
  );
  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Configurar relatório</h2>
        <label className="mt-4 grid gap-1.5 text-sm">
          Tipo
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3"
          >
            {[
              "Geral",
              "Safra",
              "Ciclo",
              "Agronômico",
              "Operacional",
              "Custos",
              "Produtividade",
              "Alertas",
              "Mapa e áreas",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
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
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Exportações serão habilitadas somente quando possuírem implementação real.
        </p>
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
                  {model.talhao.payload.talhao} · {model.selectedSeason}
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
          </article>
        )}
      </Panel>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 border-t pt-5">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </section>
  );
}
