import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Map as MapIcon,
  MapPinned,
  Plus,
  Search,
  Sprout,
  Tractor,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTalhao,
  farmNamesFromTalhoes,
  findFarmPerimeter,
  listFarmPerimeters,
  parseCycles,
  resolveFarmPerimeter,
  saveFarmPerimeter,
} from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import { useTalhao360Records } from "@/features/talhao-360/hooks/use-talhao-360";
import type { TalhaoPayload, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { statusTone } from "@/features/talhao-360/types/domain";
import { TalhaoMapOverview } from "@/features/talhao-360/map/talhao-map-overview";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { FieldRecord } from "@/lib/supabase-field";

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function area(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha`;
}

export function FieldsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, demoMode } = useTalhao360Records();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [crop, setCrop] = useState("Todas");
  const [season, setSeason] = useState("Todas");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [perimeterOpen, setPerimeterOpen] = useState(false);
  const [perimeterFarmName, setPerimeterFarmName] = useState("Fazenda ativa");
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const talhoes = useMemo(
    () => (data ?? []).filter((item) => item.module === "areas") as TalhaoRecord[],
    [data],
  );
  const farmPerimeters = useMemo(() => listFarmPerimeters(data ?? []), [data]);
  const farmNames = useMemo(() => {
    const names = [
      ...farmNamesFromTalhoes(talhoes),
      ...farmPerimeters.map((item) => item.payload.fazenda),
    ];
    return Array.from(new Set(names.filter(Boolean)));
  }, [farmPerimeters, talhoes]);
  const alertsByField = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of data ?? []) {
      if (record.module !== "talhao360-alert" || record.payload.status === "Resolvido") continue;
      const key = record.payload.talhao_id || record.payload.talhao;
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [data]);

  const filtered = talhoes.filter((item) => {
    const text = `${item.payload.talhao} ${item.payload.codigo}`.toLowerCase();
    const alertCount = alertsByField.get(item.id) ?? alertsByField.get(item.payload.talhao) ?? 0;
    return (
      text.includes(search.toLowerCase()) &&
      (status === "Todos" || item.payload.status === status) &&
      (crop === "Todas" || item.payload.cultura === crop) &&
      (season === "Todas" || item.payload.safra === season) &&
      (!alertsOnly || alertCount > 0)
    );
  });

  if (isLoading) return <FieldsLoading />;
  if (error) {
    return (
      <StateCard
        title="Não foi possível carregar os talhões"
        description={error.message}
        action={<button onClick={() => void refetch()}>Tentar novamente</button>}
      />
    );
  }

  const farmName =
    talhoes[0]?.payload.fazenda || farmPerimeters[0]?.payload.fazenda || "Fazenda ativa";
  const selectedFarmName =
    talhoes.find((item) => item.id === selectedMapId)?.payload.fazenda || farmName;
  const selectedFarmPerimeter = resolveFarmPerimeter(data ?? [], talhoes, selectedFarmName);
  const selectedFarmGeometry = parsePolygon(selectedFarmPerimeter?.payload.geometry_geojson);
  const hasPerimeterFor = (name?: string) =>
    Boolean(resolveFarmPerimeter(data ?? [], talhoes, name));
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
  const alertFields = talhoes.filter(
    (item) => (alertsByField.get(item.id) ?? alertsByField.get(item.payload.talhao) ?? 0) > 0,
  ).length;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Campo / Talhões
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Talhões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {farmName} · visão operacional das áreas cadastradas em Campo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPerimeterFarmName(selectedFarmName);
              setPerimeterOpen(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <MapPinned className="h-4 w-4" />
            Perímetro fazenda
          </button>
          <Link
            to="/campo/talhoes/$fieldId"
            params={{ fieldId: talhoes[0]?.id ?? "sem-talhao" }}
            search={{ tab: "map" }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium"
          >
            <MapIcon className="h-4 w-4" />
            Abrir mapa
          </Link>
          <button
            type="button"
            onClick={() => {
              if (!hasPerimeterFor(selectedFarmName)) {
                toast.info("Cadastre o perímetro da fazenda antes de criar talhões.");
                setPerimeterFarmName(selectedFarmName);
                setPerimeterOpen(true);
                return;
              }
              setNewOpen(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Novo talhão
          </button>
        </div>
      </header>

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

      {talhoes.length > 0 && (
        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <TalhaoMapOverview
            talhoes={talhoes}
            farmGeometry={selectedFarmGeometry}
            selectedId={selectedMapId}
            onSelect={setSelectedMapId}
            className="h-[440px]"
          />
          <MapSelection
            talhao={talhoes.find((item) => item.id === selectedMapId) ?? talhoes[0]}
            alertCount={(item) =>
              alertsByField.get(item.id) ?? alertsByField.get(item.payload.talhao) ?? 0
            }
          />
        </section>
      )}

      <section className="mt-5 rounded-xl border border-border bg-card">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-6">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou código"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
            />
          </label>
          <Filter
            value={status}
            onChange={setStatus}
            options={["Todos", ...unique(talhoes, "status")]}
          />
          <Filter
            value={crop}
            onChange={setCrop}
            options={["Todas", ...unique(talhoes, "cultura")]}
          />
          <Filter
            value={season}
            onChange={setSeason}
            options={["Todas", ...unique(talhoes, "safra")]}
          />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm">
            <input
              type="checkbox"
              checked={alertsOnly}
              onChange={(event) => setAlertsOnly(event.target.checked)}
            />
            Com alertas
          </label>
        </div>

        {talhoes.length === 0 ? (
          <StateCard
            title="Nenhum talhão cadastrado"
            description="Cadastre o primeiro talhão usando a mesma estrutura de Áreas e Talhões do módulo Campo."
          />
        ) : filtered.length === 0 ? (
          <StateCard
            title="Nenhum resultado"
            description="Ajuste os filtros para visualizar outros talhões."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {[
                    "Talhão",
                    "Área",
                    "Cultura",
                    "Safra",
                    "Ciclo atual",
                    "Status",
                    "Alertas",
                    "Última operação",
                    "",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const cycles = parseCycles(item.payload);
                  const current = cycles.find((cycle) => cycle.status === "Em andamento");
                  const event = (data ?? []).find(
                    (record) =>
                      record.module === "talhao360-event" &&
                      (record.payload.talhao_id === item.id ||
                        record.payload.talhao === item.payload.talhao),
                  );
                  const alertCount =
                    alertsByField.get(item.id) ?? alertsByField.get(item.payload.talhao) ?? 0;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.payload.talhao}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.payload.codigo || "Sem código"}
                        </div>
                      </td>
                      <td className="px-4 py-3">{area(number(item.payload.area_ha))}</td>
                      <td className="px-4 py-3">{item.payload.cultura || "—"}</td>
                      <td className="px-4 py-3">{item.payload.safra || "—"}</td>
                      <td className="px-4 py-3">
                        {current?.nome || item.payload.ciclo_atual || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.payload.status || "Planejado"} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(alertCount > 0 && "font-semibold text-destructive")}>
                          {alertCount}
                        </span>
                      </td>
                      <td className="max-w-48 truncate px-4 py-3">
                        {event?.payload.type || event?.payload.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/campo/talhoes/$fieldId"
                          params={{ fieldId: item.id }}
                          search={{ tab: "overview", seasonId: item.payload.safra || undefined }}
                          className="inline-flex h-9 items-center rounded-lg border border-primary/30 px-3 text-xs font-medium text-primary hover:bg-primary/5"
                        >
                          Abrir Talhão 360°
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <NewTalhaoDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        demoMode={demoMode}
        farmName={farmName}
        farmNames={farmNames}
        hasFarmPerimeter={hasPerimeterFor}
        onCreated={() => queryClient.invalidateQueries({ queryKey: talhao360Keys.root })}
      />
      <FarmPerimeterDialog
        open={perimeterOpen}
        onOpenChange={setPerimeterOpen}
        demoMode={demoMode}
        farmName={perimeterFarmName}
        farmNames={farmNames}
        records={data ?? []}
        talhoes={talhoes}
        onSaved={() => queryClient.invalidateQueries({ queryKey: talhao360Keys.root })}
      />
    </div>
  );
}

function MapSelection({
  talhao,
  alertCount,
}: {
  talhao: TalhaoRecord;
  alertCount: (talhao: TalhaoRecord) => number;
}) {
  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-primary">
        Talhão selecionado
      </div>
      <h2 className="mt-2 text-xl font-semibold">{talhao.payload.talhao}</h2>
      <p className="text-sm text-muted-foreground">
        {talhao.payload.codigo || "Sem código"} · {area(number(talhao.payload.area_ha))}
      </p>
      <div className="mt-5 space-y-3 text-sm">
        <MapRow label="Cultura" value={talhao.payload.cultura || "—"} />
        <MapRow label="Safra" value={talhao.payload.safra || "—"} />
        <MapRow label="Ciclo" value={talhao.payload.ciclo_atual || "—"} />
        <MapRow label="Status" value={talhao.payload.status || "—"} />
        <MapRow label="Alertas ativos" value={String(alertCount(talhao))} />
      </div>
      <Link
        to="/campo/talhoes/$fieldId"
        params={{ fieldId: talhao.id }}
        search={{ tab: "map", seasonId: talhao.payload.safra || undefined }}
        className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Abrir mapa e editar limites
      </Link>
      <Link
        to="/campo/talhoes/$fieldId"
        params={{ fieldId: talhao.id }}
        search={{ tab: "overview", seasonId: talhao.payload.safra || undefined }}
        className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-medium"
      >
        Ver Talhão 360°
      </Link>
    </aside>
  );
}

function MapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}

function unique(talhoes: TalhaoRecord[], key: keyof TalhaoPayload) {
  return Array.from(new Set(talhoes.map((item) => item.payload[key]).filter(Boolean))) as string[];
}

function Filter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex rounded-full border px-2 py-1 text-xs font-medium"
      style={{
        color: statusTone[status as keyof typeof statusTone] ?? "#64748b",
        borderColor: `${statusTone[status as keyof typeof statusTone] ?? "#64748b"}55`,
        backgroundColor: `${statusTone[status as keyof typeof statusTone] ?? "#64748b"}12`,
      }}
    >
      {status}
    </span>
  );
}

function StateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="m-6 rounded-xl border border-dashed border-border p-10 text-center">
      <MapPinned className="mx-auto h-9 w-9 text-primary" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function FieldsLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-16 w-full max-w-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function NewTalhaoDialog({
  open,
  onOpenChange,
  demoMode,
  farmName,
  farmNames,
  hasFarmPerimeter,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demoMode: boolean;
  farmName: string;
  farmNames: string[];
  hasFarmPerimeter: (farmName?: string) => boolean;
  onCreated: () => Promise<unknown>;
}) {
  const [payload, setPayload] = useState<TalhaoPayload>({
    talhao: "",
    codigo: "",
    fazenda: farmName,
    area_ha: "",
    cultura: "",
    safra: "",
    ciclo_atual: "",
    status: "Planejado",
  });
  useEffect(() => {
    if (!open) return;
    setPayload({
      talhao: "",
      codigo: "",
      fazenda: farmName,
      area_ha: "",
      cultura: "",
      safra: "",
      ciclo_atual: "",
      status: "Planejado",
    });
  }, [farmName, open]);
  const mutation = useMutation({
    mutationFn: createTalhao,
    onSuccess: async () => {
      toast.success("Talhão criado.");
      await onCreated();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo talhão</DialogTitle>
          <DialogDescription>
            O registro será salvo em Áreas e Talhões, sem criar uma fonte paralela.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Fazenda
            <input
              value={payload.fazenda ?? ""}
              list="talhao-farm-names"
              onChange={(event) =>
                setPayload((current) => ({ ...current, fazenda: event.target.value }))
              }
              className="h-10 rounded-lg border border-border bg-background px-3"
            />
            <datalist id="talhao-farm-names">
              {farmNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          {[
            ["talhao", "Nome"],
            ["codigo", "Código"],
            ["area_ha", "Área (ha)"],
            ["cultura", "Cultura"],
            ["safra", "Safra"],
            ["ciclo_atual", "Ciclo atual"],
          ].map(([key, label]) => (
            <label key={key} className="grid gap-1.5 text-sm">
              {label}
              <input
                value={payload[key] ?? ""}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, [key]: event.target.value }))
                }
                className="h-10 rounded-lg border border-border bg-background px-3"
              />
            </label>
          ))}
        </div>
        <DialogFooter>
          <button className="h-9 rounded-lg border px-3" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            className="h-9 rounded-lg bg-primary px-3 text-primary-foreground"
            disabled={mutation.isPending}
            onClick={() => {
              if (demoMode) return toast.info("Desative o modo DEMO para salvar dados reais.");
              if (!payload.talhao || !payload.codigo || !payload.area_ha)
                return toast.error("Preencha nome, código e área.");
              if (!hasFarmPerimeter(payload.fazenda)) {
                return toast.error("Cadastre o perímetro desta fazenda antes de criar o talhão.");
              }
              mutation.mutate(payload);
            }}
          >
            Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FarmPerimeterDialog({
  open,
  onOpenChange,
  demoMode,
  farmName,
  farmNames,
  records,
  talhoes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demoMode: boolean;
  farmName: string;
  farmNames: string[];
  records: FieldRecord[];
  talhoes: TalhaoRecord[];
  onSaved: () => Promise<unknown>;
}) {
  const [name, setName] = useState(farmName);
  useEffect(() => {
    if (open) setName(farmName);
  }, [farmName, open]);

  const existing = findFarmPerimeter(records, name);
  const resolved = resolveFarmPerimeter(records, talhoes, name);
  const geometry = parsePolygon(resolved?.payload.geometry_geojson);
  const mutation = useMutation({
    mutationFn: ({
      geometry,
      areaHa,
      perimeterKm,
    }: {
      geometry: GeoJSON.Polygon;
      areaHa: number;
      perimeterKm: number;
    }) =>
      saveFarmPerimeter({
        existingId: existing?.id,
        fazenda: name,
        geometry,
        areaHa,
        perimeterKm,
      }),
    onSuccess: async () => {
      toast.success("Perímetro da fazenda salvo.");
      await onSaved();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1180px]">
        <DialogHeader>
          <DialogTitle>Perímetro fazenda</DialogTitle>
          <DialogDescription>
            Desenhe o limite total da fazenda antes de cadastrar ou desenhar talhões.
          </DialogDescription>
        </DialogHeader>
        <label className="grid gap-1.5 text-sm">
          Nome da fazenda
          <input
            value={name}
            list="farm-perimeter-names"
            onChange={(event) => setName(event.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3"
          />
          <datalist id="farm-perimeter-names">
            {farmNames.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
        <TalhaoMapEditor
          mode="farm"
          geometry={geometry}
          talhoes={talhoes}
          title={name || "Fazenda ativa"}
          subtitle={existing ? "Editando perímetro salvo" : "Novo perímetro por nome de fazenda"}
          exportName={name || "perimetro-fazenda"}
          saveLabel="Salvar perímetro"
          disabled={demoMode || mutation.isPending || !name.trim()}
          onSave={(geometry, metrics) => {
            if (demoMode) return toast.info("Desative o modo DEMO para salvar dados reais.");
            if (!name.trim()) return toast.error("Informe o nome da fazenda.");
            mutation.mutate({ geometry, ...metrics });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
