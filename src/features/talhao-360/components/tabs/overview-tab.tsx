import { AlertRow, type AlertRowTone } from "@/components/alert-row";
import { CollapsibleSection } from "@/components/collapsible-section";
import { KpiCard } from "@/components/kpi-card";
import { RichTabPanel } from "@/components/rich-tab";
import { SummaryCard, TabLink } from "@/components/summary-card";
import type { Field360Search } from "@/features/talhao-360/schemas/navigation";
import type { FieldAlert, Talhao360Model } from "@/features/talhao-360/types/domain";
import { TalhaoMapOverview } from "@/features/talhao-360/map/talhao-map-overview";
import { cadastroCompleteness } from "@/features/talhao-360/lib/cadastro-sections";
import { CarbonByTalhaoPanel } from "@/features/talhao-360/components/carbon-by-talhao-panel";
import { RdcByTalhaoPanel } from "@/features/rdc/components/rdc-reverse-list";
import { useInsumos } from "@/features/insumos/hooks/use-insumos";
import { brl, buildTalhaoInsumosResumo } from "@/features/insumos/lib/estoque";

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ALERT_TONE: Record<FieldAlert["severity"], AlertRowTone> = {
  Crítico: "destructive",
  Atenção: "warning",
  Informativo: "info",
  Recomendação: "info",
};

export function OverviewTab({
  model,
  farmGeometry,
  onNavigateTab,
  onSelectTalhao,
}: {
  model: Talhao360Model;
  farmGeometry: GeoJSON.Polygon | null;
  onNavigateTab: (tab: Field360Search["tab"]) => void;
  onSelectTalhao: (fieldId: string) => void;
}) {
  const payload = model.talhao.payload;
  const cycle = model.selectedCycle;
  const planting = payload.plantio_data ? new Date(`${payload.plantio_data}T12:00:00`) : null;
  const days = planting
    ? Math.max(0, Math.floor((Date.now() - planting.getTime()) / 86_400_000))
    : null;
  // O custo mora no ciclo; os campos do payload são fallback de talhão sem
  // ciclo — nenhum formulário escreve custo_*_ha. Lendo só o payload, este
  // painel mostrava "R$ 0,00/ha" para talhões com ciclo custeado.
  const planned = cycle?.custoPrevistoHa ?? number(payload.custo_planejado_ha);
  const realized = cycle?.custoRealizadoHa ?? number(payload.custo_realizado_ha);
  const costDelta = planned ? ((realized - planned) / planned) * 100 : 0;
  const costDeltaLabel = `${costDelta > 0 ? "+" : ""}${costDelta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs planejado (${money(planned)})`;
  const alerts = model.alerts.filter((alert) => !["Resolvido", "Ignorado"].includes(alert.status));

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Área" value={payload.area_ha || "—"} unit="ha" />
        <KpiCard
          label="Produtividade esperada"
          value={cycle?.produtividadeEsperada ?? payload.produtividade_esperada ?? "—"}
          unit="sc/ha"
        />
        <KpiCard
          label="Custo realizado/ha"
          value={money(realized)}
          state={costDelta > 5 ? "warning" : undefined}
          delta={
            planned ? (
              <span className={costDelta > 5 ? "text-warning" : "text-muted-foreground"}>
                {costDeltaLabel}
              </span>
            ) : undefined
          }
          support={planned ? undefined : "sem custo planejado"}
        />
        <KpiCard
          label="Margem estimada/ha"
          value={money(cycle?.margemEstimadaHa ?? number(payload.margem_estimada_ha))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <RichTabPanel
          title="Próximas ações e alertas"
          action={<TabLink onClick={() => onNavigateTab("activity")}>Ver atividade →</TabLink>}
        >
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert) => (
              <AlertRow
                key={alert.id}
                tone={ALERT_TONE[alert.severity]}
                title={alert.title}
                support={alert.recommendation || alert.description || undefined}
              />
            ))}
            {!alerts.length && (
              <p className="text-sm text-muted-foreground">
                Nenhum alerta ativo — sem ação prioritária identificada.
              </p>
            )}
          </div>
        </RichTabPanel>
        <RichTabPanel
          title="Timeline recente"
          action={<TabLink onClick={() => onNavigateTab("activity")}>Ver tudo →</TabLink>}
        >
          <div className="divide-y divide-border">
            {model.events.slice(0, 3).map((event) => (
              <div key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="text-sm font-medium leading-snug">
                  {event.type}
                  {event.description && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      — {event.description}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(event.date)}</div>
              </div>
            ))}
            {!model.events.length && (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
            )}
          </div>
        </RichTabPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RichTabPanel
          title="Mapa do talhão"
          action={<TabLink onClick={() => onNavigateTab("map")}>Abrir no editor →</TabLink>}
        >
          <TalhaoMapOverview
            talhoes={model.talhoes}
            farmGeometry={farmGeometry}
            selectedId={model.talhao.id}
            onSelect={onSelectTalhao}
            className="h-[300px] min-h-0"
          />
        </RichTabPanel>
        <RichTabPanel title="Resumo do ciclo">
          <Rows
            rows={[
              ["Data de plantio", formatDate(payload.plantio_data)],
              ["Previsão de colheita", formatDate(payload.colheita_prevista)],
              ["Dias desde o plantio", days == null ? "—" : String(days)],
              ["Estágio fenológico", payload.estagio_fenologico],
            ]}
          />
        </RichTabPanel>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Safras"
          value={cycle?.nome || "Sem ciclo"}
          support={
            payload.colheita_prevista
              ? `colheita prevista ${formatDate(payload.colheita_prevista)}`
              : `${model.cycles.length} ${model.cycles.length === 1 ? "ciclo registrado" : "ciclos registrados"}`
          }
          onOpen={() => onNavigateTab("cycles")}
        />
        <InsumosSummaryCard model={model} onOpen={() => onNavigateTab("insumos")} />
        <SummaryCard
          label="Cadastro"
          value={`${cadastroCompleteness(payload)}% completo`}
          support="campos preenchidos do talhão"
          onOpen={() => onNavigateTab("registration")}
        />
      </div>

      <CollapsibleSection title="Saúde agronômica — solo e análises">
        <Rows
          rows={[
            ["Solo", payload.tipo_solo],
            ["Textura", payload.textura_solo],
            ["Última análise", formatDate(payload.ultima_analise_solo)],
            ["Compactação", payload.compactacao],
            ["Erosão", payload.erosao],
            ["Calagem", payload.necessidade_calagem],
            ["Gessagem", payload.necessidade_gessagem],
          ]}
        />
      </CollapsibleSection>
      <CollapsibleSection title="RDC do talhão">
        <RdcByTalhaoPanel talhaoId={model.talhao.id} />
      </CollapsibleSection>
      <CollapsibleSection title="Carbono do talhão">
        <CarbonByTalhaoPanel talhaoNome={payload.talhao ?? ""} />
      </CollapsibleSection>
    </div>
  );
}

/** Resumo de Insumos no strip — mesma fonte da aba (React Query já deduplica). */
function InsumosSummaryCard({ model, onOpen }: { model: Talhao360Model; onOpen: () => void }) {
  const { model: insumosModel, lotes, isLoading } = useInsumos();
  if (isLoading || !insumosModel) {
    return <SummaryCard label="Insumos" value="—" support="carregando…" onOpen={onOpen} />;
  }
  const resumo = buildTalhaoInsumosResumo(
    insumosModel,
    lotes,
    { id: model.talhao.id, nome: model.talhao.payload.talhao },
    model.selectedSeason,
  );
  return (
    <SummaryCard
      label="Insumos"
      value={`${brl(resumo.custoRealizado)} aplicados`}
      support={`${resumo.reservas.length} ${resumo.reservas.length === 1 ? "reserva ativa" : "reservas ativas"} · safra ${model.selectedSeason}`}
      onOpen={onOpen}
    />
  );
}

function Rows({ rows }: { rows: Array<[string, string | undefined]> }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0"
        >
          <span className="text-muted-foreground">{label}</span>
          <strong className="text-right font-medium">{value || "—"}</strong>
        </div>
      ))}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
