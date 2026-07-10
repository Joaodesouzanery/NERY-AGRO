import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { insumosKeys } from "@/features/insumos/api/query-keys";
import { listInsumosRecords } from "@/features/insumos/api/services";
import { buildInsumosModel } from "@/features/insumos/lib/estoque";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";

export function useInsumos() {
  const { demoMode } = useDemoMode();
  // listInsumosRecords já resolve DEMO x real; a flag na queryKey separa os caches.
  const query = useQuery({
    queryKey: insumosKeys.records(demoMode),
    queryFn: listInsumosRecords,
  });
  const model = query.data
    ? buildInsumosModel(query.data.insumos, query.data.lotes, query.data.movimentacoes)
    : null;
  return { ...query, model, lotes: query.data?.lotes ?? [], demoMode };
}

// Movimentações com talhao_id também alimentam a Timeline do Talhão 360.
export function useInvalidateInsumos() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: insumosKeys.root }),
      queryClient.invalidateQueries({ queryKey: talhao360Keys.root }),
    ]);
  };
}
