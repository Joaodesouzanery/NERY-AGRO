import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, ClipboardList, FileText, MapPinned, Plus } from "lucide-react";
import type { Field360Search } from "@/features/talhao-360/schemas/navigation";
import { useTalhao360 } from "@/features/talhao-360/hooks/use-talhao-360";
import { resolveFarmPerimeter } from "@/features/talhao-360/api/services";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { OverviewTab } from "@/features/talhao-360/components/tabs/overview-tab";
import { RegistrationTab } from "@/features/talhao-360/components/tabs/registration-tab";
import { CyclesTab } from "@/features/talhao-360/components/tabs/cycles-tab";
import { InsumosTab } from "@/features/talhao-360/components/tabs/insumos-tab";
import { MapTab } from "@/features/talhao-360/components/tabs/map-tab";
import { TimelineTab } from "@/features/talhao-360/components/tabs/timeline-tab";
import { AlertsTab } from "@/features/talhao-360/components/tabs/alerts-tab";
import { ReportsTab } from "@/features/talhao-360/components/tabs/reports-tab";
import { Segmented } from "@/components/segmented";
import { StatusPill } from "@/components/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const tabs: Array<{ value: Field360Search["tab"]; label: string }> = [
  { value: "overview", label: "Visão Geral" },
  { value: "registration", label: "Cadastro" },
  { value: "cycles", label: "Safras" },
  { value: "insumos", label: "Insumos" },
  { value: "map", label: "Mapa" },
  { value: "timeline", label: "Timeline" },
  { value: "alerts", label: "Alertas" },
  { value: "reports", label: "Relatórios" },
];

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
      <header className="rounded-md border border-border bg-sidebar px-6 py-[18px]">
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
                <h1 className="font-heading text-lg font-semibold">{payload.talhao}</h1>
                <p className="text-xs text-muted-foreground">
                  {payload.codigo || "Sem código"} · {payload.fazenda || "Fazenda ativa"} ·{" "}
                  {payload.area_ha || "—"} ha
                </p>
              </div>
              <StatusPill tone={payload.status === "Plantado" ? "success" : "muted"}>
                {payload.status || "Sem status"}
              </StatusPill>
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

      {/* Este sticky nunca chegou a funcionar (o body virava scroll container e
          matava todo position:sticky). Agora funciona — e por isso precisa de
          `md:top-0` (o header de 56px é só mobile) e de fundo opaco, senão o
          conteúdo passa por trás das abas ao rolar. */}
      <nav className="sticky top-14 z-20 mt-2 bg-background py-2 md:top-0">
        <Segmented
          aria-label="Abas do Talhão 360°"
          value={search.tab}
          onChange={(tab) => onSearchChange({ ...search, tab })}
          options={tabs}
        />
      </nav>

      <main className="mt-4">
        {search.tab === "overview" && (
          <OverviewTab
            model={model}
            demoMode={demoMode}
            onSelectTab={(tab) => onSearchChange({ ...search, tab })}
          />
        )}
        {search.tab === "registration" && (
          <RegistrationTab talhao={model.talhao} demoMode={demoMode} />
        )}
        {search.tab === "cycles" && (
          <CyclesTab
            talhao={model.talhao}
            cycles={model.cycles}
            seasons={model.seasons}
            selectedSeason={model.selectedSeason}
            onSeasonChange={(seasonId) =>
              onSearchChange({ ...search, seasonId, cycleId: undefined })
            }
            demoMode={demoMode}
          />
        )}
        {search.tab === "insumos" && (
          <InsumosTab
            talhao={model.talhao}
            selectedSeason={model.selectedSeason}
            selectedCycle={model.selectedCycle}
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
        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
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
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className={cn("h-4 w-4 text-muted-foreground", warning && "text-destructive")} />
      </div>
      <div className="font-heading mt-1 font-semibold tabular-nums">{value}</div>
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
      className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
    >
      <Icon className="h-4 w-4" />
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
