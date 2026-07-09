import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarRange,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  MapPinned,
  Plus,
} from "lucide-react";
import type { Field360Search } from "@/features/talhao-360/schemas/navigation";
import { useTalhao360 } from "@/features/talhao-360/hooks/use-talhao-360";
import { resolveFarmPerimeter } from "@/features/talhao-360/api/services";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { OverviewTab } from "@/features/talhao-360/components/tabs/overview-tab";
import { RegistrationTab } from "@/features/talhao-360/components/tabs/registration-tab";
import { CyclesTab } from "@/features/talhao-360/components/tabs/cycles-tab";
import { MapTab } from "@/features/talhao-360/components/tabs/map-tab";
import { TimelineTab } from "@/features/talhao-360/components/tabs/timeline-tab";
import { AlertsTab } from "@/features/talhao-360/components/tabs/alerts-tab";
import { ReportsTab } from "@/features/talhao-360/components/tabs/reports-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "registration", label: "Cadastro", icon: ClipboardList },
  { id: "cycles", label: "Safras e Ciclos", icon: CalendarRange },
  { id: "map", label: "Mapa", icon: Map },
  { id: "timeline", label: "Timeline", icon: FileText },
  { id: "alerts", label: "Alertas", icon: BellRing },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
] as const;

export function Field360Page({
  fieldId,
  search,
  onSearchChange,
}: {
  fieldId: string;
  search: Field360Search;
  onSearchChange: (next: Field360Search) => void;
}) {
  const navigate = useNavigate();
  const { data, model, isLoading, error, refetch, demoMode } = useTalhao360(
    fieldId,
    search.seasonId,
    search.cycleId,
  );
  const selectedSeasonId = model?.selectedSeason || undefined;
  const selectedCycleId = model?.selectedCycle?.id;

  useEffect(() => {
    if (!model) return;
    if (
      selectedSeasonId === search.seasonId &&
      (!search.cycleId || selectedCycleId === search.cycleId)
    ) {
      return;
    }
    onSearchChange({
      ...search,
      seasonId: selectedSeasonId,
      cycleId: search.cycleId ? selectedCycleId : undefined,
    });
  }, [model, onSearchChange, search, selectedCycleId, selectedSeasonId]);

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <State
        title="Não foi possível carregar o Talhão 360°"
        description={error.message}
        action={<button onClick={() => void refetch()}>Tentar novamente</button>}
      />
    );
  }
  if (!model) {
    return (
      <State
        title="Talhão não encontrado"
        description="O registro pode ter sido removido ou não pertence mais ao módulo Áreas e Talhões."
        action={
          <Link to="/campo/talhoes" className="text-primary">
            Voltar para Talhões
          </Link>
        }
      />
    );
  }

  const payload = model.talhao.payload;
  const farmPerimeter = resolveFarmPerimeter(data ?? [], model.talhoes, payload.fazenda);
  const farmGeometry = parsePolygon(farmPerimeter?.payload.geometry_geojson);
  const alerts = model.alerts.filter((alert) => !["Resolvido", "Ignorado"].includes(alert.status));
  const switchField = (nextId: string) => {
    if (!nextId || nextId === fieldId) return;
    void navigate({
      to: "/campo/talhoes/$fieldId",
      params: { fieldId: nextId },
      search: { tab: search.tab },
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link to="/campo">Campo</Link>
              <span>/</span>
              <Link to="/campo/talhoes">Talhões</Link>
              <span>/</span>
              <span>Talhão 360°</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{payload.talhao}</h1>
                <p className="text-sm text-muted-foreground">
                  {payload.codigo || "Sem código"} · {payload.fazenda || "Fazenda ativa"} ·{" "}
                  {payload.area_ha || "—"} ha
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                {payload.status || "Sem status"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Action
              onClick={() => onSearchChange({ ...search, tab: "registration" })}
              icon={ClipboardList}
            >
              Editar cadastro
            </Action>
            <Action onClick={() => onSearchChange({ ...search, tab: "cycles" })} icon={Plus}>
              Novo ciclo
            </Action>
            <Action onClick={() => onSearchChange({ ...search, tab: "timeline" })} icon={FileText}>
              Registrar evento
            </Action>
            <Action onClick={() => onSearchChange({ ...search, tab: "reports" })} icon={BarChart3}>
              Gerar relatório
            </Action>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Selector label="Talhão" value={fieldId} onChange={switchField}>
            {model.talhoes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.payload.talhao}
              </option>
            ))}
          </Selector>
          <Selector
            label="Safra"
            value={model.selectedSeason}
            onChange={(seasonId) => onSearchChange({ ...search, seasonId, cycleId: undefined })}
          >
            {model.seasons.map((season) => (
              <option key={season}>{season}</option>
            ))}
          </Selector>
          <Selector
            label="Ciclo"
            value={model.selectedCycle?.id ?? ""}
            onChange={(cycleId) => onSearchChange({ ...search, cycleId: cycleId || undefined })}
          >
            {!model.cycles.length && <option value="">Sem ciclo</option>}
            {model.cycles
              .filter((cycle) => cycle.safra === model.selectedSeason)
              .map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.nome}
                </option>
              ))}
          </Selector>
          <Context label="Cultura atual" value={payload.cultura || "—"} icon={MapPinned} />
          <Context
            label="Alertas ativos"
            value={String(alerts.length)}
            icon={AlertTriangle}
            warning={alerts.length > 0}
          />
        </div>
      </header>

      <nav
        aria-label="Abas do Talhão 360°"
        className="sticky top-14 z-20 mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = search.tab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSearchChange({ ...search, tab: tab.id })}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="mt-4">
        {search.tab === "overview" && <OverviewTab model={model} />}
        {search.tab === "registration" && (
          <RegistrationTab talhao={model.talhao} demoMode={demoMode} />
        )}
        {search.tab === "cycles" && (
          <CyclesTab
            talhao={model.talhao}
            cycles={model.cycles}
            selectedSeason={model.selectedSeason}
            demoMode={demoMode}
          />
        )}
        {search.tab === "map" && (
          <MapTab
            talhao={model.talhao}
            talhoes={model.talhoes}
            farmGeometry={farmGeometry}
            demoMode={demoMode}
          />
        )}
        {search.tab === "timeline" && (
          <TimelineTab talhao={model.talhao} events={model.events} demoMode={demoMode} />
        )}
        {search.tab === "alerts" && <AlertsTab alerts={model.alerts} demoMode={demoMode} />}
        {search.tab === "reports" && <ReportsTab model={model} />}
      </main>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
      >
        {children}
      </select>
    </label>
  );
}

function Context({
  label,
  value,
  icon: Icon,
  warning,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  warning?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className={cn("h-4 w-4 text-primary", warning && "text-destructive")} />
      </div>
      <div className={cn("mt-1 font-semibold", warning && "text-destructive")}>{value}</div>
    </div>
  );
}

function Action({
  icon: Icon,
  children,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function State({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-16 max-w-xl rounded-xl border border-dashed p-10 text-center">
      <MapPinned className="mx-auto h-10 w-10 text-primary" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-48" />
      <Skeleton className="h-12" />
      <Skeleton className="h-96" />
    </div>
  );
}
