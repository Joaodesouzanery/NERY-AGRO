import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarRange,
  Map as MapIcon,
  MapPinned,
  Plus,
  Sprout,
  Table2,
  Tractor,
} from "lucide-react";
import { toast } from "sonner";
import type { FieldRecord } from "@/lib/supabase-field";
import {
  clearFarmGeometry,
  farmGeometryFromRecords,
  saveFarm,
} from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import { useTalhao360Records } from "@/features/talhao-360/hooks/use-talhao-360";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { nextTalhaoColor } from "@/features/talhao-360/types/domain";
import type { TalhoesSearch } from "@/features/talhao-360/schemas/navigation";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";
import {
  CreateTalhaoDialog,
  type GeometryDraft,
} from "@/features/talhao-360/components/create-talhao-dialog";
import { MigrationPanel } from "@/features/data-migration/migration-panel";
import { TalhoesListTab } from "@/features/talhao-360/components/tabs/talhoes-list-tab";
import { FarmCyclesTab } from "@/features/talhao-360/components/tabs/farm-cycles-tab";
import { FarmAlertsTab } from "@/features/talhao-360/components/tabs/farm-alerts-tab";
import { FarmReportsTab } from "@/features/talhao-360/components/tabs/farm-reports-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "mapa", label: "Mapa", icon: MapIcon },
  { id: "lista", label: "Talhões", icon: Table2 },
  { id: "ciclos", label: "Safras e Ciclos", icon: CalendarRange },
  { id: "alertas", label: "Alertas", icon: BellRing },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
] as const;

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function area(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha`;
}

export function TalhoesPage({
  search,
  onSearchChange,
}: {
  search: TalhoesSearch;
  onSearchChange: (next: TalhoesSearch) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch, demoMode } = useTalhao360Records();
  const [draft, setDraft] = useState<GeometryDraft | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawFieldSignal, setDrawFieldSignal] = useState(0);
  const [drawFarmSignal, setDrawFarmSignal] = useState(0);

  const records = useMemo(() => data ?? [], [data]);
  const talhoes = useMemo(
    () => records.filter((item) => item.module === "areas") as TalhaoRecord[],
    [records],
  );
  const farmGeometry = useMemo(() => farmGeometryFromRecords(records), [records]);
  const newFieldColor = useMemo(() => nextTalhaoColor(talhoes), [talhoes]);
  const alertFields = useMemo(() => {
    const active = new Set<string>();
    for (const record of records) {
      if (record.module !== "talhao360-alert" || record.payload.status === "Resolvido") continue;
      const key = record.payload.talhao_id || record.payload.talhao;
      if (key) active.add(key);
    }
    return active.size;
  }, [records]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
  const farmMutation = useMutation({
    mutationFn: ({ geometry, areaHa, perimeterKm }: GeometryDraft) =>
      saveFarm(records, geometry, { areaHa, perimeterKm }, demoMode),
    onSuccess: async () => {
      await invalidate();
      toast.success(
        demoMode ? "Perímetro salvo nesta demonstração." : "Perímetro da fazenda salvo.",
      );
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const deleteFarmMutation = useMutation({
    mutationFn: () => clearFarmGeometry(records, demoMode),
    onSuccess: async () => {
      await invalidate();
      toast.success(
        demoMode ? "Perímetro removido nesta demonstração." : "Perímetro da fazenda removido.",
      );
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const busy = farmMutation.isPending || deleteFarmMutation.isPending;

  const farmName = talhoes[0]?.payload.fazenda || "Fazenda ativa";
  const farmContext: TalhaoRecord = useMemo(
    () => ({
      id: "__farm__",
      module: "areas",
      payload: {
        talhao: "",
        fazenda: farmName,
        farm_geometry_geojson: farmGeometry ? JSON.stringify(farmGeometry) : "",
      },
    }),
    [farmGeometry, farmName],
  );

  const openField = (fieldId: string) =>
    void navigate({
      to: "/campo/talhoes/$fieldId",
      params: { fieldId },
      search: { tab: "overview" },
    });

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <State
        title="Não foi possível carregar os talhões"
        description={error.message}
        action={
          <button onClick={() => void refetch()} className="text-primary">
            Tentar novamente
          </button>
        }
      />
    );
  }

  const totalArea = talhoes.reduce((sum, item) => sum + number(item.payload.area_ha), 0);
  const planted = talhoes
    .filter((item) => item.payload.status === "Plantado")
    .reduce((sum, item) => sum + number(item.payload.area_ha), 0);
  const preparing = talhoes
    .filter((item) => item.payload.status === "Em preparo")
    .reduce((sum, item) => sum + number(item.payload.area_ha), 0);
  const fallow = talhoes
    .filter((item) => item.payload.status === "Pousio")
    .reduce((sum, item) => sum + number(item.payload.area_ha), 0);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Campo / Talhões
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Talhões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {farmName} · centro de controle das áreas da fazenda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(null);
            setDialogOpen(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo talhão
        </button>
      </header>

      <MigrationPanel demoMode={demoMode} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Área total" value={area(totalArea)} icon={MapPinned} />
        <Metric label="Talhões" value={String(talhoes.length)} icon={MapIcon} />
        <Metric label="Área plantada" value={area(planted)} icon={Sprout} />
        <Metric label="Em preparo" value={area(preparing)} icon={Tractor} />
        <Metric label="Em pousio" value={area(fallow)} icon={MapIcon} />
        <Metric
          label="Com alertas"
          value={String(alertFields)}
          icon={AlertTriangle}
          warning={alertFields > 0}
        />
      </div>

      <nav
        aria-label="Abas de Talhões"
        className="sticky top-14 z-20 mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = search.tab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSearchChange({ tab: tab.id })}
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
        {search.tab === "mapa" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDrawFarmSignal((value) => value + 1)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                <MapPinned className="h-4 w-4" />
                {farmGeometry ? "Editar fazenda" : "Cadastrar fazenda"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setDialogOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Novo talhão
              </button>
            </div>
            <TalhaoMapEditor
              talhao={farmContext}
              talhoes={talhoes}
              farmLevel
              newFieldColor={newFieldColor}
              disabled={busy}
              drawFieldSignal={drawFieldSignal}
              drawFarmSignal={drawFarmSignal}
              onSelectField={openField}
              onSaveField={() => undefined}
              onSaveFarm={(geometry, metrics) => farmMutation.mutate({ geometry, ...metrics })}
              onCreateField={(geometry, metrics) => {
                setDraft({ geometry, ...metrics });
                setDialogOpen(true);
              }}
              onDeleteFarm={() => deleteFarmMutation.mutate()}
            />
          </div>
        )}
        {search.tab === "lista" && <TalhoesListTab talhoes={talhoes} records={records} />}
        {search.tab === "ciclos" && <FarmCyclesTab talhoes={talhoes} />}
        {search.tab === "alertas" && <FarmAlertsTab talhoes={talhoes} records={records} />}
        {search.tab === "relatorios" && <FarmReportsTab talhoes={talhoes} />}
      </main>

      <CreateTalhaoDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setDraft(null);
        }}
        draft={draft}
        farmName={farmName}
        defaultSafra={talhoes[0]?.payload.safra}
        farmGeometry={farmGeometry}
        color={newFieldColor}
        demoMode={demoMode}
        onRequestDraw={() => {
          setDialogOpen(false);
          setDraft(null);
          setDrawFieldSignal((value) => value + 1);
        }}
        onCreated={async () => {
          await invalidate();
          setDialogOpen(false);
          setDraft(null);
          toast.success("Talhão criado.");
        }}
      />
    </div>
  );
}

function Metric({
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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className={cn("h-4 w-4 text-primary", warning && "text-destructive")} />
      </div>
      <div className={cn("mt-2 text-xl font-semibold", warning && "text-destructive")}>{value}</div>
    </div>
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
    <div className="mx-auto mt-10 max-w-xl rounded-xl border border-dashed border-border p-10 text-center">
      <MapPinned className="mx-auto h-9 w-9 text-primary" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-16 w-full max-w-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[68vh]" />
    </div>
  );
}
