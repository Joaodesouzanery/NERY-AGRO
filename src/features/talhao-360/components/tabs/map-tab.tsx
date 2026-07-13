import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveTalhaoPayload } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";
import { StatusPill } from "@/components/status-pill";

export function MapTab({
  talhao,
  talhoes,
  farmGeometry,
  demoMode,
}: {
  talhao: TalhaoRecord;
  talhoes: TalhaoRecord[];
  farmGeometry?: GeoJSON.Polygon | null;
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
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
      saveTalhaoPayload(talhao, {
        geometry_geojson: JSON.stringify(geometry),
        area_ha: areaHa.toFixed(2),
        perimetro_km: perimeterKm.toFixed(3),
      }),
    onSuccess: async () => {
      toast.success("Geometria salva no registro atual do talhão.");
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
    },
    onError: (error) => toast.error(error.message),
  });

  const payload = talhao.payload;
  return (
    <div className="space-y-4">
      {!farmGeometry && (
        <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Você pode desenhar a área do talhão à mão direto no mapa e salvar. Cadastrar o perímetro
          da fazenda é opcional — serve só para validar se o talhão fica dentro dela.
        </div>
      )}
      <div className="flex items-center justify-end text-xs tabular-nums text-muted-foreground">
        {payload.area_ha ? `${payload.area_ha} ha` : "Área não informada"}
        {payload.perimetro_km ? ` · perímetro ${payload.perimetro_km} km` : ""}
      </div>
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TalhaoMapEditor
          mode="talhao"
          geometry={parsePolygon(payload.geometry_geojson)}
          farmGeometry={farmGeometry}
          talhoes={talhoes}
          selectedTalhaoId={talhao.id}
          title={payload.talhao}
          subtitle={payload.codigo}
          exportName={payload.codigo || payload.talhao}
          saveLabel="Salvar GeoJSON"
          disabled={demoMode || mutation.isPending}
          onSave={(geometry, metrics) => {
            if (demoMode) return toast.info("Desative o modo DEMO para salvar o GeoJSON.");
            if (metrics.outsideVertices > 0) {
              toast.warning(
                "O talhão tem vértices fora do perímetro da fazenda. Salvando com aviso.",
              );
            }
            mutation.mutate({ geometry, ...metrics });
          }}
        />
        <aside className="flex flex-col rounded-md border border-border bg-card p-5">
          <h3 className="mb-3.5 text-sm font-semibold tracking-[-0.01em]">Contexto</h3>
          <div className="flex flex-col gap-3 text-sm">
            <ContextoRow label="Cultura" value={payload.cultura || "—"} />
            <ContextoRow
              label="Área calculada"
              value={payload.area_ha ? `${payload.area_ha} ha` : "—"}
            />
            <ContextoRow
              label="Área útil"
              value={payload.area_util ? `${payload.area_util} ha` : "—"}
            />
            <ContextoRow
              label="Perímetro"
              value={payload.perimetro_km ? `${payload.perimetro_km} km` : "—"}
            />
            <ContextoRow label="Safra" value={payload.safra || "—"} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Status</span>
              <StatusPill tone={payload.status === "Plantado" ? "success" : "muted"}>
                {payload.status || "Sem status"}
              </StatusPill>
            </div>
          </div>
          <div className="mt-auto">
            <div className="mb-3.5 mt-4 h-px bg-border" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              As ferramentas de desenho ficam no próprio mapa. A área e o GeoJSON salvos aqui
              alimentam o cadastro como campos somente leitura.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ContextoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
