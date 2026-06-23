import { useQuery } from "@tanstack/react-query";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { campoCalendarKeys } from "@/features/campo-calendar/api/query-keys";
import {
  loadDemoCalendarWorkspace,
  loadRealCalendarWorkspace,
} from "@/features/campo-calendar/api/services";

export function useCalendarWorkspace() {
  const { demoMode } = useDemoMode();
  const storedDemoMode =
    typeof window !== "undefined" && window.localStorage.getItem("nery-demo-mode") === "true";
  const effectiveDemoMode = demoMode || storedDemoMode;
  const query = useQuery({
    queryKey: campoCalendarKeys.workspace(effectiveDemoMode),
    queryFn: () =>
      effectiveDemoMode
        ? Promise.resolve(loadDemoCalendarWorkspace())
        : loadRealCalendarWorkspace(),
  });
  return { ...query, demoMode: effectiveDemoMode };
}
