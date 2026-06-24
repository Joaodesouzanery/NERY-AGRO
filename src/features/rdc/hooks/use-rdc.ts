import { useQuery } from "@tanstack/react-query";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { rdcKeys } from "@/features/rdc/api/query-keys";
import {
  buildRdcDailySummary,
  buildRdcModel,
  listAnimalOptions,
  listEntriesForAnimal,
  listEntriesForTalhao,
  listFichaSummaries,
  listRdcRecords,
  listTalhaoOptions,
} from "@/features/rdc/api/services";
import { demoAnimalOptions, demoRdcRecords } from "@/features/rdc/data/mocks";

export function useRdcRecords() {
  const { demoMode } = useDemoMode();
  const query = useQuery({
    queryKey: rdcKeys.records(demoMode),
    queryFn: () => (demoMode ? Promise.resolve(demoRdcRecords) : listRdcRecords()),
    enabled: demoMode || isSupabaseConfigured,
  });
  return { ...query, demoMode };
}

export function useRdc(rdcId: string) {
  const records = useRdcRecords();
  const model = records.data ? buildRdcModel(records.data, rdcId) : null;
  return { ...records, model };
}

export function useRdcFichas() {
  const records = useRdcRecords();
  const fichas = records.data ? listFichaSummaries(records.data) : [];
  return { ...records, fichas };
}

export function useRdcByTalhao(talhaoId: string) {
  const records = useRdcRecords();
  const entries = records.data ? listEntriesForTalhao(records.data, talhaoId) : [];
  return { ...records, entries };
}

export function useRdcByAnimal(animalId: string) {
  const records = useRdcRecords();
  const entries = records.data ? listEntriesForAnimal(records.data, animalId) : [];
  return { ...records, entries };
}

export function useRdcDailySummary(date: string) {
  const records = useRdcRecords();
  const summary = records.data ? buildRdcDailySummary(records.data, date) : null;
  return { ...records, summary };
}

/** Opções do picker de vínculo: talhões (do snapshot de field_records) + animais (operation_records). */
export function useLinkOptions() {
  const { demoMode, data } = useRdcRecords();
  const talhoes = data ? listTalhaoOptions(data) : [];
  const animals = useQuery({
    queryKey: rdcKeys.animalOptions(demoMode),
    queryFn: () => (demoMode ? Promise.resolve(demoAnimalOptions) : listAnimalOptions()),
    enabled: demoMode || isSupabaseConfigured,
  });
  return { talhoes, animals: animals.data ?? [] };
}
