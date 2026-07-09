import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveTalhaoPayload } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { parsePolygon } from "@/features/talhao-360/map/geometry";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";

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

  return (
    <div className="space-y-4">
      {!farmGeometry && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          A fazenda ainda não possui perímetro registrado. Cadastre o perímetro da fazenda na lista
          de talhões antes de salvar limites de talhão.
        </div>
      )}
      <TalhaoMapEditor
        mode="talhao"
        geometry={parsePolygon(talhao.payload.geometry_geojson)}
        farmGeometry={farmGeometry}
        talhoes={talhoes}
        selectedTalhaoId={talhao.id}
        title={talhao.payload.talhao}
        subtitle={talhao.payload.codigo}
        exportName={talhao.payload.codigo || talhao.payload.talhao}
        saveLabel="Salvar GeoJSON"
        disabled={demoMode || mutation.isPending || !farmGeometry}
        onSave={(geometry, metrics) => {
          if (demoMode) return toast.info("Desative o modo DEMO para salvar o GeoJSON.");
          if (!farmGeometry) return toast.error("Cadastre o perímetro da fazenda antes de salvar.");
          if (metrics.outsideVertices > 0) {
            toast.warning(
              "O talhão tem vértices fora do perímetro da fazenda. Salvando com aviso.",
            );
          }
          mutation.mutate({ geometry, ...metrics });
        }}
      />
    </div>
  );
}
