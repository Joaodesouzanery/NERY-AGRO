import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveTalhaoPayload } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";

export function MapTab({
  talhao,
  talhoes,
  demoMode,
}: {
  talhao: TalhaoRecord;
  talhoes: TalhaoRecord[];
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
      {!talhao.payload.farm_geometry_geojson && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          A fazenda ainda não possui perímetro registrado. O MVP permite desenhar o talhão, mas
          validações avançadas de contenção ficam para uma evolução posterior.
        </div>
      )}
      <TalhaoMapEditor
        talhao={talhao}
        talhoes={talhoes}
        disabled={demoMode || mutation.isPending}
        onSave={(geometry, metrics) => {
          if (demoMode) return toast.info("Desative o modo DEMO para salvar o GeoJSON.");
          mutation.mutate({ geometry, ...metrics });
        }}
      />
    </div>
  );
}
