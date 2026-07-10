import { useState } from "react";
import type { Talhao360Model } from "@/features/talhao-360/types/domain";
import { makeReportPdf, downloadPdf } from "@/lib/pdf-utils";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModeloId = "geral" | "custos" | "produtividade" | "agronomico" | "alertas" | "mapa";

const MODELOS: Array<{ id: ModeloId; nome: string; desc: string }> = [
  { id: "geral", nome: "Geral", desc: "Área · ciclos · timeline · alertas" },
  { id: "custos", nome: "Custos", desc: "Planejado × realizado por hectare" },
  { id: "produtividade", nome: "Produtividade", desc: "Histórico por ciclo e safra" },
  { id: "agronomico", nome: "Agronômico", desc: "Solo, aptidão e manejo" },
  { id: "alertas", nome: "Alertas", desc: "Ocorrências e resoluções" },
  { id: "mapa", nome: "Mapa e áreas", desc: "Geometria e medidas" },
];

export function ReportsTab({ model }: { model: Talhao360Model }) {
  const [modelo, setModelo] = useState<ModeloId>("geral");
  const selecionado = MODELOS.find((m) => m.id === modelo)!;
  const payload = model.talhao.payload;

  const gerar = () => {
    const doc = makeReportPdf({
      title: `Relatório ${selecionado.nome} · ${payload.talhao}`,
      subtitle: `${payload.fazenda || "Fazenda"} · Safra ${model.selectedSeason}`,
      metrics: [
        { label: "Área", value: payload.area_ha ? `${payload.area_ha} ha` : "—" },
        { label: "Ciclos", value: String(model.cycles.length) },
        { label: "Alertas", value: String(model.alerts.length) },
      ],
      sections: pdfSections(modelo, model),
    });
    downloadPdf(doc, `relatorio-${modelo}-${payload.codigo || payload.talhao}.pdf`);
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>Escolha um modelo</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODELOS.map((m) => {
          const ativo = m.id === modelo;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModelo(m.id)}
              className={cn(
                "rounded-md border bg-card p-4 text-left transition-colors",
                ativo ? "border-foreground" : "border-border hover:bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{m.nome}</span>
                {ativo && <span className="h-2 w-2 rounded-full bg-success" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
            </button>
          );
        })}
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.01em]">
              Prévia — Relatório {selecionado.nome}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">fiel ao PDF final</p>
          </div>
          <Button onClick={gerar}>Gerar PDF</Button>
        </div>

        <article className="rounded-md border border-border bg-background p-5">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-3.5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                AgroTorre
              </div>
              <div className="font-heading mt-1 text-base font-semibold">
                Relatório {selecionado.nome} · {payload.talhao}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Safra {model.selectedSeason}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniKpi label="Área" value={payload.area_ha || "—"} unit="ha" />
            <MiniKpi label="Ciclos" value={String(model.cycles.length)} />
            <MiniKpi label="Alertas" value={String(model.alerts.length)} />
          </div>

          {previewSections(modelo, model).map((section) => (
            <div key={section.title} className="mt-4 border-t border-border pt-4">
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}

function MiniKpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="font-heading mt-1.5 text-xl font-bold leading-none tabular-nums">
        {value}
        {unit && (
          <span className="font-display text-xs font-medium tracking-normal text-muted-foreground">
            {" "}
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/** Parágrafos da prévia em tela, por modelo. */
function previewSections(
  modelo: ModeloId,
  model: Talhao360Model,
): Array<{ title: string; body: string }> {
  const payload = model.talhao.payload;
  const criticos = model.alerts.filter((a) => a.severity === "Crítico").length;
  const custos = {
    title: "Custos",
    body: `Planejado: ${payload.custo_planejado_ha || "—"} por hectare · Realizado: ${payload.custo_realizado_ha || "—"} por hectare.`,
  };
  const produtividade = {
    title: "Produtividade",
    body: model.cycles.length
      ? model.cycles
          .map(
            (c) =>
              `${c.nome} (${c.safra}): ${c.produtividadeRealizada ?? c.produtividadeEsperada ?? "—"} sc/ha`,
          )
          .join(" · ")
      : "Nenhum ciclo registrado.",
  };
  const alertas = {
    title: "Alertas",
    body: `${model.alerts.length} alertas encontrados, sendo ${criticos} críticos.`,
  };
  const timeline = {
    title: "Timeline",
    body: `${model.events.length} eventos associados; último registro: ${model.lastOperation?.description || "não disponível"}.`,
  };
  const agronomico = {
    title: "Agronômico",
    body: `Solo ${payload.tipo_solo || "—"} · pH ${payload.ph || "—"} · aptidão ${payload.aptidao_agricola || "—"} · cultura recomendada ${payload.cultura_recomendada || "—"}.`,
  };
  const mapa = {
    title: "Mapa e áreas",
    body: payload.geometry_geojson
      ? `Geometria GeoJSON disponível · ${payload.area_ha || "—"} ha · perímetro ${payload.perimetro_km || "—"} km.`
      : "Talhão sem geometria cadastrada.",
  };
  switch (modelo) {
    case "geral":
      return [custos, timeline, alertas, mapa];
    case "custos":
      return [custos];
    case "produtividade":
      return [produtividade];
    case "agronomico":
      return [agronomico];
    case "alertas":
      return [alertas];
    case "mapa":
      return [mapa];
  }
}

/** Tabelas do PDF por modelo — mesmos dados da prévia. */
function pdfSections(modelo: ModeloId, model: Talhao360Model) {
  const payload = model.talhao.payload;
  const ciclos = {
    title: "Ciclos",
    head: ["Safra", "Ciclo", "Cultura", "Status", "Prod. (sc/ha)", "Custo/ha", "Margem/ha"],
    body: model.cycles.map((c) => [
      c.safra,
      c.nome,
      c.cultura,
      c.status,
      c.produtividadeRealizada ?? c.produtividadeEsperada ?? "—",
      c.custoRealizadoHa ?? c.custoPrevistoHa ?? "—",
      c.margemEstimadaHa ?? "—",
    ]),
  };
  const alertas = {
    title: "Alertas",
    head: ["Severidade", "Título", "Status", "Prazo"],
    body: model.alerts.map((a) => [a.severity, a.title, a.status, a.dueOn ?? "—"]),
  };
  const solo = {
    title: "Solo e agronomia",
    head: ["Campo", "Valor"],
    body: [
      ["Tipo de solo", payload.tipo_solo || "—"],
      ["Textura", payload.textura_solo || "—"],
      ["pH", payload.ph || "—"],
      ["Matéria orgânica (%)", payload.materia_organica || "—"],
      ["Aptidão agrícola", payload.aptidao_agricola || "—"],
      ["Cultura recomendada", payload.cultura_recomendada || "—"],
    ],
  };
  const areas = {
    title: "Áreas e geometria",
    head: ["Campo", "Valor"],
    body: [
      ["Área calculada (ha)", payload.area_ha || "—"],
      ["Área útil (ha)", payload.area_util || "—"],
      ["Perímetro (km)", payload.perimetro_km || "—"],
      ["Geometria", payload.geometry_geojson ? "GeoJSON disponível" : "não cadastrada"],
    ],
  };
  const eventos = {
    title: "Timeline",
    head: ["Data", "Tipo", "Descrição", "Origem"],
    body: model.events.map((e) => [e.date, e.type, e.description, e.origin]),
  };
  switch (modelo) {
    case "geral":
      return [ciclos, eventos, alertas];
    case "custos":
    case "produtividade":
      return [ciclos];
    case "agronomico":
      return [solo];
    case "alertas":
      return [alertas];
    case "mapa":
      return [areas];
  }
}
