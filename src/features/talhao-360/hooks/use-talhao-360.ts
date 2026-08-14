import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import { buildTalhao360Model, listTalhao360Records } from "@/features/talhao-360/api/services";
import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";

export function useTalhao360Records() {
  const { demoMode } = useDemoMode();
  const query = useQuery({
    queryKey: talhao360Keys.records(demoMode),
    queryFn: () => (demoMode ? Promise.resolve(demoTalhao360Records) : listTalhao360Records()),
  });
  return { ...query, demoMode };
}

export function useTalhao360(fieldId: string, seasonId?: string, cycleId?: string) {
  const recordsQuery = useTalhao360Records();
  // Memoizado: o model varre TODOS os field_records e faz JSON.parse dos ciclos.
  // Sem isto ele nascia de novo a cada render e levava junto a visão geral (que
  // é memoizada em cima da identidade dele) e o efeito de safra/ciclo da página.
  const data = recordsQuery.data;
  const model = useMemo(
    () => (data ? buildTalhao360Model(data, fieldId, seasonId, cycleId) : null),
    [data, fieldId, seasonId, cycleId],
  );
  return { ...recordsQuery, model };
}
