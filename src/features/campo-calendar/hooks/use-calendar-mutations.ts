import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { campoCalendarKeys } from "@/features/campo-calendar/api/query-keys";
import {
  createDemoCalendarEvent,
  deleteDemoCalendarEvent,
  saveDemoCalendarStatus,
  updateDemoCalendarEvent,
} from "@/features/campo-calendar/api/demo-repository";
import {
  createRealCalendarEvent,
  deleteRealCalendarEvent,
  saveRealCalendarStatus,
  updateRealCalendarEvent,
} from "@/features/campo-calendar/api/field-record-repository";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarStatusDefinition,
} from "@/features/campo-calendar/types";

export function useCalendarMutations() {
  const { demoMode } = useDemoMode();
  const storedDemoMode =
    typeof window !== "undefined" && window.localStorage.getItem("nery-demo-mode") === "true";
  const effectiveDemoMode = demoMode || storedDemoMode;
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: campoCalendarKeys.root });

  const createEvent = useMutation({
    mutationFn: (input: CalendarEventInput) =>
      effectiveDemoMode
        ? Promise.resolve(createDemoCalendarEvent(input))
        : createRealCalendarEvent(input),
    onSuccess: invalidate,
  });
  const updateEvent = useMutation({
    mutationFn: (event: CalendarEvent) =>
      effectiveDemoMode
        ? Promise.resolve(updateDemoCalendarEvent(event))
        : updateRealCalendarEvent(event),
    onSuccess: invalidate,
  });
  const deleteEvent = useMutation({
    mutationFn: (event: CalendarEvent) =>
      effectiveDemoMode
        ? Promise.resolve(deleteDemoCalendarEvent(event.id))
        : deleteRealCalendarEvent(event),
    onSuccess: invalidate,
  });
  const saveStatus = useMutation({
    mutationFn: (status: CalendarStatusDefinition) =>
      effectiveDemoMode
        ? Promise.resolve(saveDemoCalendarStatus(status))
        : saveRealCalendarStatus(status),
    onSuccess: invalidate,
  });

  return {
    demoMode: effectiveDemoMode,
    createEvent,
    updateEvent,
    deleteEvent,
    saveStatus,
  };
}
