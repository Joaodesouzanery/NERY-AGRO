import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  MapPinned,
  ShoppingCart,
  Sprout,
  Wheat,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildCalendarOverview } from "@/features/campo-calendar/domain/overview";
import type {
  CalendarEvent,
  CalendarField,
  CalendarSearch,
} from "@/features/campo-calendar/types";
import type {
  TalhaoPayload,
  TalhaoRecord,
  TalhaoStatus,
} from "@/features/talhao-360/types/domain";
import { TalhaoMapOverview } from "@/features/talhao-360/map/talhao-map-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarOverview({
  events,
  fields,
  search,
  onFieldSelect,
  onOpenCalendar,
}: {
  events: CalendarEvent[];
  fields: CalendarField[];
  search: CalendarSearch;
  onFieldSelect: (fieldId: string | undefined) => void;
  onOpenCalendar: () => void;
}) {
  const model = buildCalendarOverview(events, fields, search.date);
  const selectedField = fields.find((field) => field.id === search.fieldId);
  const mapRecords = fields.map(asTalhaoRecord);
  const costMissing = model.next7.some((event) => event.estimatedCost === undefined);

  if (!events.length) {
    return (
      <div className="border border-dashed border-border px-5 py-16 text-center">
        <CalendarClock className="mx-auto h-9 w-9 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">Nenhuma atividade no contexto atual</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Limpe os filtros ou amplie o intervalo para voltar à visão de toda a fazenda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">
            Operação e gestão em {format(parseISO(search.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </p>
        </div>
        <Button onClick={onOpenCalendar}>
          <CalendarClock />
          Ver calendário
        </Button>
      </div>

      <div className="grid border border-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Tarefas de hoje" value={model.today.length} icon={Clock3} />
        <Kpi label="Atrasadas" value={model.overdue.length} icon={AlertTriangle} warning />
        <Kpi label="Operações em 7 dias" value={model.next7.length} icon={CalendarClock} />
        <Kpi label="Decisões pendentes" value={model.decisions.length} icon={CheckCircle2} />
        <Kpi label="Compras pendentes" value={model.purchases.length} icon={ShoppingCart} />
        <Kpi
          label="Área programada"
          value={`${model.scheduledArea.toLocaleString("pt-BR")} ha`}
          icon={Sprout}
        />
        <Kpi
          label="Colheita prevista"
          value={model.nextHarvest ? shortDate(model.nextHarvest.startsAt) : "—"}
          hint={model.nextHarvest?.talhaoName}
          icon={Wheat}
        />
        <Kpi
          label="Custo 7/15/30 dias"
          value={money(model.cost7)}
          hint={`${money(model.cost15)} · ${money(model.cost30)}`}
          icon={CircleDollarSign}
        />
        <Kpi
          label="Alertas críticos"
          value={model.criticalAlerts.length}
          icon={AlertTriangle}
          warning={model.criticalAlerts.length > 0}
        />
      </div>

      {(costMissing || fields.some((field) => !field.geometryGeoJson)) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-l-2 border-amber-500 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
          {costMissing && <span>Dados parciais: algumas ações futuras não têm custo estimado.</span>}
          {fields.some((field) => !field.geometryGeoJson) && (
            <span>Mapa parcial: há talhões sem GeoJSON cadastrado.</span>
          )}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <EventSection title="Agora" events={[...model.overdue, ...model.today]} empty="Nenhuma ação imediata." />
        <EventSection
          title="Próximas ações"
          events={model.next7}
          empty="Nenhuma ação nos próximos sete dias."
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <EventSection
          title="Alertas que afetam o cronograma"
          events={model.criticalAlerts}
          empty="Nenhum alerta crítico no contexto."
          alert
        />
        <EventSection
          title="Próximas decisões"
          events={model.decisions}
          empty="Nenhuma decisão pendente."
          decisions
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h3 className="font-semibold">Mapa resumido dos talhões</h3>
              <p className="text-xs text-muted-foreground">
                Clique em um talhão para aplicar o filtro global.
              </p>
            </div>
            {selectedField && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/campo/talhoes/$fieldId"
                  params={{ fieldId: selectedField.id }}
                  search={{
                    tab: "overview",
                    seasonId: search.seasonId || selectedField.season,
                    cycleId: search.cycleId,
                  }}
                >
                  Abrir Talhão 360
                  <ExternalLink />
                </Link>
              </Button>
            )}
          </div>
          <TalhaoMapOverview
            talhoes={mapRecords}
            selectedId={search.fieldId}
            onSelect={onFieldSelect}
            className="min-h-[330px] rounded-none border-0"
          />
          <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
            <button
              type="button"
              onClick={() => onFieldSelect(undefined)}
              className={cn(
                "shrink-0 rounded-md border px-3 py-1.5 text-xs",
                !search.fieldId && "border-primary bg-primary/10 text-primary",
              )}
            >
              Toda a fazenda
            </button>
            {fields.map((field) => (
              <button
                key={field.id}
                type="button"
                onClick={() => onFieldSelect(field.id)}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-1.5 text-xs",
                  search.fieldId === field.id && "border-primary bg-primary/10 text-primary",
                )}
              >
                {field.name}
              </button>
            ))}
          </div>
        </section>

        <section className="border border-border">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">Distribuição por status</h3>
            <p className="text-xs text-muted-foreground">Leitura rápida da carga operacional.</p>
          </div>
          <div className="space-y-3 p-4">
            {model.statusDistribution.map((item) => {
              const max = Math.max(...model.statusDistribution.map((entry) => entry.value), 1);
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-xs">
                    <span>{item.status}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="mt-1 h-2 bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(item.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Desembolso previsto</h3>
          <p className="text-xs text-muted-foreground">
            Custos estimados acumulados nas próximas janelas.
          </p>
        </div>
        {model.cashFlow.every((item) => item.value === 0) ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum custo estimado disponível para o intervalo filtrado.
          </div>
        ) : (
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => compactMoney(Number(value))} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function EventSection({
  title,
  events,
  empty,
  alert,
  decisions,
}: {
  title: string;
  events: CalendarEvent[];
  empty: string;
  alert?: boolean;
  decisions?: boolean;
}) {
  return (
    <section className="border border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {events.length ? (
        <div className="divide-y divide-border">
          {events.slice(0, 6).map((event) => (
            <article key={event.id} className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3">
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 rounded-full bg-primary",
                  (alert || event.status === "Atrasada") && "bg-destructive",
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{event.title}</span>
                  {event.eventType.toLowerCase() === "compra" && (
                    <Badge variant="outline">Compra</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {event.talhaoName || "Toda a fazenda"} · {event.responsibleName || "Sem responsável"}
                </p>
                {alert && event.weatherSummary && (
                  <p className="mt-1 text-xs text-destructive">{event.weatherSummary}</p>
                )}
                {decisions && event.decisionOptions.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.decisionOptions.join(" · ")}
                  </p>
                )}
              </div>
              <div className="whitespace-nowrap text-right text-xs text-muted-foreground">
                {shortDate(event.startsAt)}
                <div className="mt-1">{event.status}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  warning,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  warning?: boolean;
}) {
  return (
    <div className="border-b border-r border-border p-4 last:border-r-0">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {label}
        <Icon className={cn("h-4 w-4 text-primary", warning && "text-destructive")} />
      </div>
      <div className={cn("mt-2 text-xl font-semibold", warning && "text-destructive")}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function asTalhaoRecord(field: CalendarField): TalhaoRecord {
  return {
    id: field.id,
    module: "areas",
    payload: {
      talhao: field.name,
      codigo: field.code,
      cultura: field.crop,
      area_ha: String(field.areaHa),
      safra: field.season || "",
      ciclo_atual: field.cycle || "",
      status: (field.status || "Planejado") as TalhaoStatus,
      cor_mapa: field.color || "#16a34a",
      geometry_geojson: field.geometryGeoJson || "",
      farm_geometry_geojson: field.farmGeometryGeoJson || "",
    } as TalhaoPayload,
  };
}

function shortDate(value: string) {
  return format(parseISO(value), "dd/MM");
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function compactMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
