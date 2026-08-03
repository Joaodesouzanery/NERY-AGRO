// Hooks React Query do Calendário: um snapshot único de field_records vira o
// CalendarModel; mutações ramificam DEMO (demo-store local) x REAL (Supabase,
// com fila offline para falha de rede). Dados demo nunca vão ao Supabase.
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { campoCalendarKeys } from "@/features/campo-calendar/api/query-keys";
import {
  buildCalendarModel,
  createCalendarEvent,
  deleteCalendarEvent,
  deleteTemplate,
  eventToPayload,
  listCalendarRecords,
  saveStatus,
  saveTemplate,
  statusToPayload,
  templateToPayload,
  updateCalendarEvent,
  CALENDAR_EVENT_MODULE,
  CALENDAR_STATUS_MODULE,
  CALENDAR_TEMPLATE_MODULE,
} from "@/features/campo-calendar/api/services";
import {
  demoCreateRecord,
  demoDeleteRecord,
  demoUpdateRecord,
  loadDemoRecords,
} from "@/features/campo-calendar/data/demo-store";
import {
  enqueueOp,
  flushQueue,
  isNetworkError,
  listQueue,
  QUEUE_CHANGE_EVENT,
  type QueuedOp,
} from "@/features/campo-calendar/lib/offline-queue";
import { demoWeatherProvider } from "@/features/campo-calendar/lib/weather";
import type {
  CalendarEvent,
  CalendarStatus,
  CycleTemplate,
} from "@/features/campo-calendar/types/domain";

export function useCalendarModel() {
  const { demoMode } = useDemoMode();
  const query = useQuery({
    queryKey: campoCalendarKeys.records(demoMode),
    queryFn: () => (demoMode ? Promise.resolve(loadDemoRecords()) : listCalendarRecords()),
    select: buildCalendarModel,
  });
  return { ...query, model: query.data ?? null, demoMode };
}

// Espelha o useCalendarModel acima: modo na chave e no `enabled`. Só a vitrine
// tem previsão; em REAL a query nem roda e `data` fica undefined — as três
// regras de clima em derive.ts recebem [] e não disparam. Nenhum `if` novo em
// regra de negócio.
export function useForecast(days = 30) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: [...campoCalendarKeys.root, "forecast", days, demoMode],
    queryFn: () => demoWeatherProvider.getForecast(new Date(), days),
    enabled: demoMode,
    staleTime: 30 * 60 * 1000,
  });
}

type SaveEventInput = {
  id?: string;
  event: Omit<CalendarEvent, "id">;
  /** updated_at conhecido do registro (base para conflito offline). */
  baseUpdatedAt?: string;
};

export function useCalendarMutations() {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: campoCalendarKeys.root });

  // Falha de rede em modo REAL vai para a fila offline; erro de regra estoura.
  const runReal = async (op: () => Promise<unknown>, queued: Omit<QueuedOp, "id" | "queuedAt">) => {
    try {
      await op();
    } catch (error) {
      if (isNetworkError(error)) {
        enqueueOp(queued);
        toast.info("Sem conexão — alteração guardada na fila offline do Calendário.");
        return;
      }
      throw error;
    }
  };

  const saveEvent = useMutation({
    mutationFn: async ({ id, event, baseUpdatedAt }: SaveEventInput) => {
      const payload = eventToPayload(event);
      if (demoMode) {
        if (id) demoUpdateRecord(id, payload);
        else demoCreateRecord(CALENDAR_EVENT_MODULE, payload);
        return;
      }
      if (id) {
        await runReal(() => updateCalendarEvent(id, event), {
          op: "update",
          module: CALENDAR_EVENT_MODULE,
          recordId: id,
          payload,
          baseUpdatedAt,
        });
      } else {
        await runReal(() => createCalendarEvent(event), {
          op: "create",
          module: CALENDAR_EVENT_MODULE,
          payload,
        });
      }
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const createEvents = useMutation({
    mutationFn: async (events: Array<Omit<CalendarEvent, "id">>) => {
      for (const event of events) {
        if (demoMode) {
          demoCreateRecord(CALENDAR_EVENT_MODULE, eventToPayload(event));
        } else {
          await runReal(() => createCalendarEvent(event), {
            op: "create",
            module: CALENDAR_EVENT_MODULE,
            payload: eventToPayload(event),
          });
        }
      }
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const removeEvent = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        demoDeleteRecord(id);
        return;
      }
      await runReal(() => deleteCalendarEvent(id), {
        op: "delete",
        module: CALENDAR_EVENT_MODULE,
        recordId: id,
      });
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const persistTemplate = useMutation({
    mutationFn: async (template: CycleTemplate) => {
      if (demoMode) {
        const payload = templateToPayload(template);
        if (template.recordId) demoUpdateRecord(template.recordId, payload);
        else demoCreateRecord(CALENDAR_TEMPLATE_MODULE, payload);
        return;
      }
      await saveTemplate(template);
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const removeTemplate = useMutation({
    mutationFn: async (recordId: string) => {
      if (demoMode) {
        demoDeleteRecord(recordId);
        return;
      }
      await deleteTemplate(recordId);
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const persistStatus = useMutation({
    mutationFn: async (status: CalendarStatus) => {
      if (demoMode) {
        const payload = statusToPayload(status);
        if (status.recordId) demoUpdateRecord(status.recordId, payload);
        else demoCreateRecord(CALENDAR_STATUS_MODULE, payload);
        return;
      }
      await saveStatus(status);
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  /** Remapeia eventos de um status em uso para outro antes de inativá-lo. */
  const remapStatus = useMutation({
    mutationFn: async ({ events, toStatusId }: { events: CalendarEvent[]; toStatusId: string }) => {
      for (const event of events) {
        const { id, ...rest } = event;
        const next = { ...rest, statusId: toStatusId };
        if (demoMode) {
          demoUpdateRecord(id, eventToPayload(next));
        } else {
          await runReal(() => updateCalendarEvent(id, next), {
            op: "update",
            module: CALENDAR_EVENT_MODULE,
            recordId: id,
            payload: eventToPayload(next),
            baseUpdatedAt: event.updatedAt,
          });
        }
      }
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  return {
    saveEvent,
    createEvents,
    removeEvent,
    persistTemplate,
    removeTemplate,
    persistStatus,
    remapStatus,
  };
}

/** Fila offline: contador reativo + sincronização manual e ao reconectar. */
export function useOfflineSync() {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const refresh = () => setPending(listQueue().length);
    refresh();
    window.addEventListener(QUEUE_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(QUEUE_CHANGE_EVENT, refresh);
  }, []);

  const sync = useCallback(async () => {
    if (demoMode || !listQueue().length || syncing) return;
    setSyncing(true);
    try {
      const result = await flushQueue();
      if (result.synced) {
        toast.success(`${result.synced} alteração(ões) do Calendário sincronizada(s).`);
        void queryClient.invalidateQueries({ queryKey: campoCalendarKeys.root });
      }
      if (result.conflicts) {
        toast.warning(
          `${result.conflicts} alteração(ões) em conflito: a versão do servidor era mais nova e foi mantida.`,
        );
      }
      if (result.failed) {
        toast.error(`${result.failed} alteração(ões) ainda pendentes — tentaremos de novo.`);
      }
    } finally {
      setPending(listQueue().length);
      setSyncing(false);
    }
  }, [demoMode, queryClient, syncing]);

  useEffect(() => {
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [sync]);

  return { pending, syncing, sync };
}
