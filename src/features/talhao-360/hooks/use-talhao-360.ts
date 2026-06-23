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
  const model = recordsQuery.data
    ? buildTalhao360Model(recordsQuery.data, fieldId, seasonId, cycleId)
    : null;
  return { ...recordsQuery, model };
}
