import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Leaf,
  MapPinned,
  Sprout,
  Tractor,
  TrendingUp,
} from "lucide-react";
import { InteractiveMap } from "@/components/interactive-map";
import type { MapRoute } from "@/components/carto-map";
import type { Talhao360Model } from "@/features/talhao-360/types/domain";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { RdcByTalhaoPanel } from "@/features/rdc/components/rdc-reverse-list";
import { CarbonByTalhaoPanel } from "@/features/talhao-360/components/carbon-by-talhao-panel";
import { cn } from "@/lib/utils";

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value?: string) {
  return number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OverviewTab({ model }: { model: Talhao360Model }) {
  const payload = model.talhao.payload;
  const cycle = model.selectedCycle;
  const planting = payload.plantio_data ? new Date(`${payload.plantio_data}T12:00:00`) : null;
  const days = planting
    ? Math.max(0, Math.floor((Date.now() - planting.getTime()) / 86_400_000))
    : null;
  const planned = number(payload.custo_planejado_ha);
  const realized = number(payload.custo_realizado_ha);
  const costDelta = planned ? ((realized - planned) / planned) * 100 : 0;
  const geometry = parsePolygon(payload.geometry_geojson);
  const routes: MapRoute[] = geometry
    ? [
        {
          id: model.talhao.id,
          label: payload.talhao,
          points: [],
          shape: "polygon",
          geometry: {
            type: "Polygon",
            coordinates: geometry.coordinates as Array<Array<[number, number]>>,
          },
          tone: model.alerts.some((alert) => alert.severity === "Crítico") ? "danger" : "success",
          meta: {
            Área: `${payload.area_ha || "—"} ha`,
            Cultura: payload.cultura || "—",
            Safra: model.selectedSeason,
            Ciclo: cycle?.nome || "—",
            Status: payload.status || "—",
          },
        },
      ]
    : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Área" value={`${payload.area_ha || "—"} ha`} icon={MapPinned} />
        <Metric
          label="Produtividade esperada"
          value={`${cycle?.produtividadeEsperada ?? payload.produtividade_esperada ?? "—"} sc/ha`}
          icon={TrendingUp}
        />
        <Metric
          label="Custo estimado"
          value={`${money(payload.custo_planejado_ha)}/ha`}
          icon={CircleDollarSign}
        />
        <Metric
          label="Margem estimada"
          value={`${money(payload.margem_estimada_ha)}/ha`}
          icon={Sprout}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Resumo do talhão">
          <Rows
            rows={[
              ["Cultura atual", payload.cultura],
              ["Safra", model.selectedSeason],
              ["Ciclo", cycle?.nome || payload.ciclo_atual],
              ["Status", payload.status],
              ["Data de plantio", formatDate(payload.plantio_data)],
              ["Previsão de colheita", formatDate(payload.colheita_prevista)],
              ["Dias desde o plantio", days == null ? "—" : String(days)],
              ["Estágio fenológico", payload.estagio_fenologico],
            ]}
          />
        </Panel>
        <Panel title="Saúde agronômica">
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
        </Panel>
        <Panel title="Alertas">
          <div className="space-y-2">
            {model.alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  alert.severity === "Crítico"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-warning/30 bg-warning/5",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {alert.title}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{alert.recommendation}</p>
              </div>
            ))}
            {!model.alerts.length && (
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Operação e decisão">
          <div className="grid gap-3 sm:grid-cols-2">
            <Decision
              icon={Tractor}
              label="Última operação"
              title={model.lastOperation?.type || "Sem operação"}
              description={
                model.lastOperation?.description || "Nenhum registro operacional disponível."
              }
            />
            <Decision
              icon={Leaf}
              label="Próxima recomendação"
              title={model.alerts[0]?.title || "Sem recomendação"}
              description={
                model.alerts[0]?.recommendation || "Não há ação prioritária identificada."
              }
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SmallStat label="Custo planejado" value={`${money(payload.custo_planejado_ha)}/ha`} />
            <SmallStat label="Custo realizado" value={`${money(payload.custo_realizado_ha)}/ha`} />
            <SmallStat
              label="Variação"
              value={`${costDelta > 0 ? "+" : ""}${costDelta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
              warning={costDelta > 5}
            />
          </div>
        </Panel>
        <Panel title="Mini mapa">
          <InteractiveMap
            routes={routes}
            variant="satellite"
            fitToData
            attribution
            interactive={false}
            className="min-h-[300px]"
          />
        </Panel>
      </div>

      <Panel title="Timeline recente">
        <div className="grid gap-3 md:grid-cols-3">
          {model.events.slice(0, 3).map((event) => (
            <div key={event.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(event.date)}
              </div>
              <div className="mt-2 font-medium">{event.type}</div>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </div>
          ))}
        </div>
      </Panel>

      <RdcByTalhaoPanel talhaoId={model.talhao.id} />

      <CarbonByTalhaoPanel talhaoNome={payload.talhao ?? ""} />
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Rows({ rows }: { rows: Array<[string, string | undefined]> }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 text-sm"
        >
          <span className="text-muted-foreground">{label}</span>
          <strong className="text-right font-medium">{value || "—"}</strong>
        </div>
      ))}
    </div>
  );
}

function Decision({
  icon: Icon,
  label,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="mt-2 font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SmallStat({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-semibold", warning && "text-destructive")}>{value}</div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
