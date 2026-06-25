import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FieldRecord } from "@/lib/supabase-field";
import {
  clearFarmGeometry,
  clearTalhaoGeometry,
  farmGeometryFromRecords,
  saveFarm,
  saveTalhaoPayload,
} from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { nextTalhaoColor } from "@/features/talhao-360/types/domain";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";
import { CreateTalhaoDialog } from "@/features/talhao-360/components/create-talhao-dialog";

type GeometryDraft = {
  geometry: GeoJSON.Polygon;
  areaHa: number;
  perimeterKm: number;
};

export function MapTab({
  talhao,
  talhoes,
  records,
  demoMode,
}: {
  talhao: TalhaoRecord;
  talhoes: TalhaoRecord[];
  records: FieldRecord[];
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<GeometryDraft | null>(null);
  const [drawSignal, setDrawSignal] = useState(0);
  // Distinct color for the next talhão, so each one is visually separable.
  const newFieldColor = useMemo(() => nextTalhaoColor(talhoes), [talhoes]);
  const farmGeometry = useMemo(() => farmGeometryFromRecords(records), [records]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
  const fieldMutation = useMutation({
    mutationFn: ({ geometry, areaHa, perimeterKm }: GeometryDraft) =>
      saveTalhaoPayload(talhao, {
        geometry_geojson: JSON.stringify(geometry),
        area_ha: areaHa.toFixed(2),
        perimetro_km: perimeterKm.toFixed(3),
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success(demoMode ? "Desenho salvo nesta demonstração." : "Geometria do talhão salva.");
    },
    onError: (error) => toast.error(error.message),
  });
  const farmMutation = useMutation({
    mutationFn: ({ geometry, areaHa, perimeterKm }: GeometryDraft) =>
      saveFarm(records, geometry, { areaHa, perimeterKm }, demoMode),
    onSuccess: async () => {
      await invalidate();
      toast.success(
        demoMode ? "Perímetro salvo nesta demonstração." : "Perímetro da fazenda salvo.",
      );
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteFieldMutation = useMutation({
    mutationFn: () => clearTalhaoGeometry(talhao),
    onSuccess: async () => {
      await invalidate();
      toast.success(
        demoMode ? "Marcação removida nesta demonstração." : "Marcação do talhão removida.",
      );
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteFarmMutation = useMutation({
    mutationFn: () => clearFarmGeometry(records, demoMode),
    onSuccess: async () => {
      await invalidate();
      toast.success(
        demoMode ? "Perímetro removido nesta demonstração." : "Perímetro da fazenda removido.",
      );
    },
    onError: (error) => toast.error(error.message),
  });
  const busy =
    fieldMutation.isPending ||
    farmMutation.isPending ||
    deleteFieldMutation.isPending ||
    deleteFarmMutation.isPending;

  return (
    <div className="space-y-4">
      {!farmGeometry && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          Desenhe primeiro o perímetro da fazenda. Depois, use “Novo desenho” para dividir a área em
          talhões.
        </div>
      )}
      <TalhaoMapEditor
        talhao={talhao}
        talhoes={talhoes}
        newFieldColor={newFieldColor}
        disabled={busy}
        drawFieldSignal={drawSignal}
        onDeleteField={() => deleteFieldMutation.mutate()}
        onDeleteFarm={() => deleteFarmMutation.mutate()}
        onSelectField={(fieldId) => {
          if (fieldId === talhao.id) return;
          void navigate({
            to: "/campo/talhoes/$fieldId",
            params: { fieldId },
            search: { tab: "map" },
          });
        }}
        onSaveField={(geometry, metrics) => fieldMutation.mutate({ geometry, ...metrics })}
        onSaveFarm={(geometry, metrics) => farmMutation.mutate({ geometry, ...metrics })}
        onCreateField={(geometry, metrics) => setDraft({ geometry, ...metrics })}
      />
      <CreateTalhaoDialog
        open={Boolean(draft)}
        onOpenChange={(open) => !open && setDraft(null)}
        draft={draft}
        farmName={talhao.payload.fazenda || ""}
        defaultSafra={talhao.payload.safra}
        farmGeometry={farmGeometry}
        color={newFieldColor}
        demoMode={demoMode}
        onRequestDraw={() => {
          setDraft(null);
          setDrawSignal((value) => value + 1);
        }}
        onCreated={async (created) => {
          await invalidate();
          setDraft(null);
          toast.success("Talhão criado e vinculado ao desenho.");
          void navigate({
            to: "/campo/talhoes/$fieldId",
            params: { fieldId: created.id },
            search: { tab: "map" },
          });
        }}
      />
    </div>
  );
}
